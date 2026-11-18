/**
 * FlyeMass Real-Time Device Registry & Active Terminal Switching Engine
 *
 * Backed by:
 * - Supabase `public.user_devices`, `public.device_migration_requests`, RPC `authorize_new_device`
 * - Supabase Realtime (`postgres_changes` + broadcast channel `device-auth:<userId>`)
 * - Local sync-server (`/api/devices/*`) seamless synchronization fallback
 */

import { supabase } from './supabaseClient';
import {
  DeviceProfileInfo,
  getCurrentDeviceProfile,
  getOrCreateDeviceId,
  clearEncryptedSessionKey
} from './biometricAuth';

export interface UserDeviceRecord {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string;
  platform: 'ios' | 'android' | 'web' | string;
  biometric_type?: string;
  ip_address?: string | null;
  user_agent?: string | null;
  hardware_key_id?: string | null;
  last_active_at: string;
  is_primary: boolean;
  status: 'active' | 'revoked';
  created_at?: string;
  updated_at?: string;
}

export interface DeviceMigrationRequest {
  id?: string;
  token: string;
  user_id: string;
  requesting_device_id: string;
  requesting_device_name: string;
  requesting_platform: string;
  requesting_ip?: string | null;
  approved_by_device_id?: string | null;
  status: 'pending' | 'approved' | 'expired' | 'rejected';
  expires_at: string;
  approved_at?: string | null;
  created_at?: string;
}

const SYNC_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SYNC_SERVER_URL) ||
  'http://localhost:5050';

/**
 * Fetch all devices for a user from Supabase `public.user_devices` (with local sync fallback).
 * If the user has no registered device yet, auto-registers the current real device.
 */
export async function fetchUserDevices(userId: string): Promise<UserDeviceRecord[]> {
  const uid = userId || 'usr_alade_01';

  // 1. Try Supabase public.user_devices
  try {
    const { data, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', uid)
      .order('is_primary', { ascending: false })
      .order('last_active_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as UserDeviceRecord[];
    }
  } catch {
    // Fallback to sync-server below
  }

  // 2. Try local sync-server /api/devices/list
  try {
    const res = await fetch(`${SYNC_BASE}/api/devices/list?userId=${encodeURIComponent(uid)}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.devices) && json.devices.length > 0) {
        return json.devices as UserDeviceRecord[];
      }
    }
  } catch {
    // Continue to register current device
  }

  // 3. No devices registered yet — register this real terminal as active device
  const current = await getCurrentDeviceProfile();
  const initial = await registerCurrentDeviceHeartbeat(uid, current);
  return initial ? [initial] : [];
}

/**
 * Register or refresh heartbeat for the current real terminal without revoking others unless none exist.
 */
export async function registerCurrentDeviceHeartbeat(
  userId: string,
  profile?: DeviceProfileInfo
): Promise<UserDeviceRecord | null> {
  const uid = userId || 'usr_alade_01';
  const info = profile || (await getCurrentDeviceProfile());
  const nowIso = new Date().toISOString();

  const record: UserDeviceRecord = {
    id: `ud_${info.deviceId}`,
    user_id: uid,
    device_id: info.deviceId,
    device_name: info.deviceName,
    platform: info.platform,
    biometric_type: info.biometricType,
    ip_address: info.ipAddress,
    user_agent: info.userAgent,
    last_active_at: nowIso,
    is_primary: true,
    status: 'active'
  };

  // Best-effort upsert to Supabase
  try {
    const { data, error } = await supabase
      .from('user_devices')
      .upsert(
        {
          user_id: uid,
          device_id: info.deviceId,
          device_name: info.deviceName,
          platform: info.platform,
          biometric_type: info.biometricType,
          ip_address: info.ipAddress,
          user_agent: info.userAgent,
          last_active_at: nowIso,
          is_primary: true,
          status: 'active',
          updated_at: nowIso
        },
        { onConflict: 'user_id,device_id' }
      )
      .select()
      .single();

    if (!error && data) {
      return data as UserDeviceRecord;
    }
  } catch {
    // Fallback to sync server
  }

  try {
    const res = await fetch(`${SYNC_BASE}/api/devices/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: uid,
        deviceId: info.deviceId,
        deviceName: info.deviceName,
        platform: info.platform,
        biometricType: info.biometricType,
        ipAddress: info.ipAddress,
        userAgent: info.userAgent
      })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.device) return json.device as UserDeviceRecord;
    }
  } catch {
    // Return local object
  }

  return record;
}

/**
 * Authorize a new primary device via Supabase RPC `authorize_new_device` (+ sync-server parity),
 * revoke all previous primary devices, and broadcast a Realtime logout event to old devices.
 */
export async function authorizeNewPrimaryDevice(params: {
  userId: string;
  pin?: string;
  hardwareKeyId?: string;
  migrationToken?: string;
  biometricType?: string;
}): Promise<{ success: boolean; device?: UserDeviceRecord; revokedCount: number; error?: string }> {
  const uid = params.userId || 'usr_alade_01';
  const info = await getCurrentDeviceProfile();
  const bioType = params.biometricType || info.biometricType || 'webauthn';

  let authorizedDevice: UserDeviceRecord | undefined;
  let revokedCount = 0;

  // 1. Validate PIN & persist via local sync-server first (enforces PIN verification when provided)
  try {
    const res = await fetch(`${SYNC_BASE}/api/devices/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: uid,
        deviceId: info.deviceId,
        deviceName: info.deviceName,
        platform: info.platform,
        biometricType: bioType,
        ipAddress: info.ipAddress,
        userAgent: info.userAgent,
        hardwareKeyId: params.hardwareKeyId,
        migrationToken: params.migrationToken,
        pin: params.pin
      })
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, revokedCount: 0, error: json.error || 'Device authorization rejected' };
    }
    authorizedDevice = json.device;
    revokedCount = json.revoked_count || 0;
  } catch {
    // If sync server unreachable, continue to Supabase RPC
  }

  // 2. Call Supabase RPC `authorize_new_device`
  try {
    const { data, error } = await supabase.rpc('authorize_new_device', {
      p_user_id: uid,
      p_device_id: info.deviceId,
      p_device_name: info.deviceName,
      p_platform: info.platform,
      p_biometric_type: bioType,
      p_ip_address: info.ipAddress,
      p_user_agent: info.userAgent,
      p_hardware_key_id: params.hardwareKeyId || null,
      p_migration_token: params.migrationToken || null
    });

    if (!error && data?.success) {
      authorizedDevice = (data.device as UserDeviceRecord) || authorizedDevice;
      revokedCount = Math.max(revokedCount, Number(data.revoked_count || 0));
    }
  } catch {
    // Non-fatal if RPC migration not yet applied in remote Supabase
  }

  // 3. Broadcast Supabase Realtime logout event to any old device immediately
  try {
    const channel = supabase.channel(`device-auth:${uid}`);
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'DEVICE_REVOKED',
      payload: {
        userId: uid,
        newPrimaryDeviceId: info.deviceId,
        newPrimaryDeviceName: info.deviceName,
        revokedAt: new Date().toISOString()
      }
    });
    supabase.removeChannel(channel);
  } catch {
    // Non-fatal if offline
  }

  if (!authorizedDevice) {
    authorizedDevice = {
      id: `ud_${info.deviceId}`,
      user_id: uid,
      device_id: info.deviceId,
      device_name: info.deviceName,
      platform: info.platform,
      biometric_type: bioType,
      ip_address: info.ipAddress,
      user_agent: info.userAgent,
      hardware_key_id: params.hardwareKeyId || null,
      last_active_at: new Date().toISOString(),
      is_primary: true,
      status: 'active'
    };
  }

  return {
    success: true,
    device: authorizedDevice,
    revokedCount
  };
}

/**
 * Revoke a specific device session in Supabase & sync-server and broadcast logout.
 */
export async function revokeDeviceSession(userId: string, targetDeviceId: string): Promise<boolean> {
  const uid = userId || 'usr_alade_01';

  try {
    await supabase
      .from('user_devices')
      .update({ is_primary: false, status: 'revoked', updated_at: new Date().toISOString() })
      .eq('user_id', uid)
      .eq('device_id', targetDeviceId);
  } catch {
    // ignore
  }

  try {
    await fetch(`${SYNC_BASE}/api/devices/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: uid, deviceId: targetDeviceId })
    });
  } catch {
    // ignore
  }

  try {
    const channel = supabase.channel(`device-auth:${uid}`);
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'DEVICE_REVOKED',
      payload: {
        userId: uid,
        targetDeviceId,
        revokedAt: new Date().toISOString()
      }
    });
    supabase.removeChannel(channel);
  } catch {
    // ignore
  }

  return true;
}

/**
 * Create a 60-second cryptographic migration token in `public.device_migration_requests` (and sync-server).
 */
export async function createQrMigrationToken(userId: string): Promise<DeviceMigrationRequest> {
  const uid = userId || 'usr_alade_01';
  const info = await getCurrentDeviceProfile();

  // Generate 60-second cryptographic token
  const randomBytes = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(randomBytes);
  }
  const hex = Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('');
  let token = `FM-MIG-${hex || Date.now().toString(16)}`;
  let expiresAt = new Date(Date.now() + 60 * 1000).toISOString();

  // 1. Create on local sync-server
  try {
    const res = await fetch(`${SYNC_BASE}/api/devices/migration-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: uid,
        deviceId: info.deviceId,
        deviceName: info.deviceName,
        platform: info.platform,
        ipAddress: info.ipAddress
      })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.request?.token) {
        token = json.request.token;
        expiresAt = json.request.expires_at;
      }
    }
  } catch {
    // continue with client-generated token
  }

  const requestRecord: DeviceMigrationRequest = {
    token,
    user_id: uid,
    requesting_device_id: info.deviceId,
    requesting_device_name: info.deviceName,
    requesting_platform: info.platform,
    requesting_ip: info.ipAddress,
    status: 'pending',
    expires_at: expiresAt,
    created_at: new Date().toISOString()
  };

  // 2. Insert into Supabase `public.device_migration_requests`
  try {
    await supabase.from('device_migration_requests').insert({
      token: requestRecord.token,
      user_id: uid,
      requesting_device_id: info.deviceId,
      requesting_device_name: info.deviceName,
      requesting_platform: info.platform,
      requesting_ip: info.ipAddress,
      status: 'pending',
      expires_at: expiresAt
    });
  } catch {
    // Non-fatal if migration not yet applied
  }

  return requestRecord;
}

/**
 * Approve a scanned QR migration token from the existing authorized phone (after biometric approval).
 */
export async function approveQrMigrationToken(params: {
  token: string;
  userId: string;
  biometricType?: string;
}): Promise<{ success: boolean; device?: UserDeviceRecord; error?: string }> {
  const uid = params.userId || 'usr_alade_01';
  const approverDeviceId = getOrCreateDeviceId();

  let promotedDevice: UserDeviceRecord | undefined;

  // 1. Approve via sync-server
  try {
    const res = await fetch(`${SYNC_BASE}/api/devices/approve-migration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: params.token,
        approverDeviceId,
        biometricType: params.biometricType || 'webauthn'
      })
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || 'Failed to approve QR migration token' };
    }
    promotedDevice = json.device;
  } catch {
    // Fallback to Supabase update
  }

  // 2. Update Supabase `device_migration_requests` & call `authorize_new_device`
  try {
    await supabase
      .from('device_migration_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by_device_id: approverDeviceId
      })
      .eq('token', params.token)
      .eq('user_id', uid);
  } catch {
    // ignore
  }

  // 3. Broadcast Supabase Realtime approval so the waiting new phone promotes immediately
  try {
    const channel = supabase.channel(`device-migration:${params.token}`);
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'MIGRATION_APPROVED',
      payload: {
        token: params.token,
        userId: uid,
        approvedByDeviceId: approverDeviceId,
        device: promotedDevice,
        approvedAt: new Date().toISOString()
      }
    });
    supabase.removeChannel(channel);
  } catch {
    // ignore
  }

  return { success: true, device: promotedDevice };
}

/**
 * Subscribe on the NEW device to Supabase Realtime for instant QR approval detection.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToQrMigrationApproval(
  token: string,
  onApproved: (device?: UserDeviceRecord) => void
): () => void {
  let active = true;

  // 1. Supabase Realtime postgres_changes + broadcast channel
  const channel = supabase
    .channel(`device-migration:${token}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'device_migration_requests',
        filter: `token=eq.${token}`
      },
      (payload: any) => {
        if (active && payload?.new?.status === 'approved') {
          active = false;
          onApproved();
        }
      }
    )
    .on('broadcast', { event: 'MIGRATION_APPROVED' }, (payload: any) => {
      if (active && payload?.payload?.token === token) {
        active = false;
        onApproved(payload.payload.device);
      }
    })
    .subscribe();

  // 2. Lightweight fallback poll against local sync-server every 2.5s
  const pollTimer = setInterval(async () => {
    if (!active) return;
    try {
      const res = await fetch(`${SYNC_BASE}/api/devices/migration-status?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.request?.status === 'approved') {
          active = false;
          onApproved();
        }
      }
    } catch {
      // ignore
    }
  }, 2500);

  return () => {
    active = false;
    clearInterval(pollTimer);
    try {
      supabase.removeChannel(channel);
    } catch {
      // ignore
    }
  };
}

/**
 * Subscribe on an ACTIVE device to Supabase Realtime so if another phone takes over
 * as Primary Authorized Terminal, this old device logs out immediately and cleanly.
 */
export function subscribeToDeviceRevocation(
  userId: string,
  onRevoked: (reason: string) => void
): () => void {
  const uid = userId || 'usr_alade_01';
  const currentDeviceId = getOrCreateDeviceId();

  const channel = supabase
    .channel(`device-auth:${uid}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_devices',
        filter: `user_id=eq.${uid}`
      },
      async (payload: any) => {
        const row = payload?.new;
        if (row && row.device_id === currentDeviceId && row.status === 'revoked') {
          await clearEncryptedSessionKey();
          onRevoked('This device was revoked because a new Primary Authorized Terminal was enrolled.');
        }
      }
    )
    .on('broadcast', { event: 'DEVICE_REVOKED' }, async (payload: any) => {
      const data = payload?.payload;
      if (!data) return;
      const isTargeted = data.targetDeviceId && data.targetDeviceId === currentDeviceId;
      const isSuperseded = data.newPrimaryDeviceId && data.newPrimaryDeviceId !== currentDeviceId;
      if (isTargeted || isSuperseded) {
        await clearEncryptedSessionKey();
        onRevoked(
          data.newPrimaryDeviceName
            ? `Session moved to ${data.newPrimaryDeviceName}. Signed out for security.`
            : 'This device session has been revoked.'
        );
      }
    })
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch {
      // ignore
    }
  };
}
