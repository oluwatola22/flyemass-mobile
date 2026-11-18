import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../../context/AppContext';
import {
  detectBiometricCapabilities,
  enrollDeviceBiometrics,
  authenticateWithBiometrics,
  getCurrentDeviceProfile,
  BiometricCapabilities,
  DeviceProfileInfo
} from '../../services/biometricAuth';
import {
  fetchUserDevices,
  authorizeNewPrimaryDevice,
  createQrMigrationToken,
  approveQrMigrationToken,
  subscribeToQrMigrationApproval,
  UserDeviceRecord,
  DeviceMigrationRequest
} from '../../services/deviceRegistry';
import {
  ChevronLeft,
  SmartphoneNfc,
  Fingerprint,
  ScanFace,
  QrCode,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Laptop,
  Smartphone,
  RefreshCw,
  Clock,
  Lock,
  Wifi,
  AlertCircle
} from 'lucide-react';

function formatRelativeTime(iso?: string): string {
  if (!iso) return 'Active now';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return 'Online just now';
  if (diffSec < 3600) return `Online ${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `Online ${Math.floor(diffSec / 3600)}h ago`;
  return `Last active ${new Date(iso).toLocaleDateString()}`;
}

export const SwitchDeviceScreen: React.FC = () => {
  const { navigate, showToast, isAuthenticated, goBack, activeUserId, userProfile } = useApp();
  const uid = activeUserId || 'usr_alade_01';

  const [migrationMethod, setMigrationMethod] = useState<'biometric' | 'qr'>('biometric');
  const [isMigrating, setIsMigrating] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Real hardware biometric capabilities (Face ID / Touch ID / Fingerprint / WebAuthn)
  const [bioCaps, setBioCaps] = useState<BiometricCapabilities>({
    isAvailable: true,
    isNative: false,
    biometryType: 'fingerprint',
    platform: 'web',
    label: 'Fingerprint',
    actionLabel: 'Authenticate with Fingerprint',
    shortLabel: 'Fingerprint'
  });

  // Real active primary device from Supabase `public.user_devices`
  const [primaryDevice, setPrimaryDevice] = useState<UserDeviceRecord | null>(null);
  const [currentDeviceInfo, setCurrentDeviceInfo] = useState<DeviceProfileInfo | null>(null);
  const [loadingDevice, setLoadingDevice] = useState(true);

  // Tab 1: PIN + Biometric Re-Binding state
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Tab 2: Live 60-second QR Sync Migration state
  const [qrRequest, setQrRequest] = useState<DeviceMigrationRequest | null>(null);
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number>(60);
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [isApprovingQr, setIsApprovingQr] = useState<boolean>(false);

  // 1. Load real hardware capabilities + real active primary device from Supabase `public.user_devices`
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoadingDevice(true);
      try {
        const [caps, localInfo, devices] = await Promise.all([
          detectBiometricCapabilities(),
          getCurrentDeviceProfile(),
          fetchUserDevices(uid)
        ]);
        if (!mounted) return;
        setBioCaps(caps);
        setCurrentDeviceInfo(localInfo);
        const primary = devices.find((d) => d.is_primary && d.status === 'active') || devices[0] || null;
        setPrimaryDevice(primary);
      } catch {
        // Non-fatal
      } finally {
        if (mounted) setLoadingDevice(false);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [uid]);

  // 2. Generate 60-second cryptographic QR migration token when Tab 2 is selected
  const generateFreshQrToken = useCallback(async () => {
    setIsGeneratingQr(true);
    try {
      const req = await createQrMigrationToken(uid);
      setQrRequest(req);
      const remaining = Math.max(0, Math.ceil((new Date(req.expires_at).getTime() - Date.now()) / 1000));
      setQrSecondsLeft(remaining || 60);
    } catch (err: any) {
      showToast(err?.message || 'Unable to generate migration QR token', 'error');
    } finally {
      setIsGeneratingQr(false);
    }
  }, [uid, showToast]);

  useEffect(() => {
    if (migrationMethod === 'qr' && !completed && !qrRequest) {
      generateFreshQrToken();
    }
  }, [migrationMethod, completed, qrRequest, generateFreshQrToken]);

  // 3. Live 60-second countdown timer for QR token
  useEffect(() => {
    if (migrationMethod !== 'qr' || !qrRequest || completed) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((new Date(qrRequest.expires_at).getTime() - Date.now()) / 1000));
      setQrSecondsLeft(left);
    }, 1000);
    return () => clearInterval(interval);
  }, [migrationMethod, qrRequest, completed]);

  // 4. Subscribe to Supabase Realtime for instant QR approval detection on the new phone
  useEffect(() => {
    if (migrationMethod !== 'qr' || !qrRequest?.token || completed) return;
    const unsubscribe = subscribeToQrMigrationApproval(qrRequest.token, async (promoted) => {
      if (promoted) {
        setPrimaryDevice(promoted);
      } else {
        const refreshed = await fetchUserDevices(uid);
        const primary = refreshed.find((d) => d.is_primary && d.status === 'active') || refreshed[0] || null;
        setPrimaryDevice(primary);
      }
      setCompleted(true);
      showToast('QR migration approved! This phone is now your Primary Authorized Terminal.', 'success');
    });
    return () => unsubscribe();
  }, [migrationMethod, qrRequest?.token, completed, uid, showToast]);

  // TAB 1: Biometric + PIN Re-Binding Flow
  const handleBiometricPinRebind = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPinError(null);

    const cleanPin = pinInput.replace(/\D/g, '');
    if (cleanPin.length < 4) {
      setPinError('Enter your 4-digit Transaction PIN to prove account ownership.');
      return;
    }

    setIsMigrating(true);
    try {
      // Step 1: Trigger real native Face ID / Touch ID / Fingerprint / WebAuthn enrollment
      const bioResult = await enrollDeviceBiometrics(uid, userProfile?.name || userProfile?.email || 'FlyeMass Client');
      if (!bioResult.verified) {
        setPinError(bioResult.error || `${bioCaps.label} verification was cancelled.`);
        showToast(bioResult.error || `${bioCaps.label} verification failed`, 'error');
        return;
      }

      // Step 2: Call Supabase RPC `authorize_new_device` (sets is_primary = true, revokes old device, broadcasts Realtime logout)
      const authRes = await authorizeNewPrimaryDevice({
        userId: uid,
        pin: cleanPin,
        hardwareKeyId: bioResult.credentialId,
        biometricType: bioResult.biometryType
      });

      if (!authRes.success) {
        setPinError(authRes.error || 'Device authorization failed');
        showToast(authRes.error || 'Device authorization failed', 'error');
        return;
      }

      if (authRes.device) {
        setPrimaryDevice(authRes.device);
      }
      setCompleted(true);
      showToast(
        `${bioCaps.label} verified! Hardware enclave bound and ${authRes.revokedCount > 0 ? `${authRes.revokedCount} previous device(s) logged out.` : 'terminal promoted to primary.'}`,
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Biometric device migration failed', 'error');
    } finally {
      setIsMigrating(false);
    }
  };

  // TAB 2: Approve QR Migration via Biometrics (from authorized device / companion approval)
  const handleApproveQrViaBiometrics = async () => {
    if (!qrRequest?.token || qrSecondsLeft <= 0) {
      showToast('QR code has expired. Tap Regenerate QR to issue a fresh 60s token.', 'error');
      return;
    }

    setIsApprovingQr(true);
    try {
      const bioResult = await authenticateWithBiometrics(`Approve FlyeMass device migration via ${bioCaps.label}`);
      if (!bioResult.verified) {
        // Attempt enrollment if no key exists yet on this terminal
        const enrollRes = await enrollDeviceBiometrics(uid, userProfile?.name || 'FlyeMass Client');
        if (!enrollRes.verified) {
          showToast(enrollRes.error || `${bioCaps.label} approval cancelled`, 'error');
          return;
        }
      }

      const approval = await approveQrMigrationToken({
        token: qrRequest.token,
        userId: uid,
        biometricType: bioCaps.biometryType
      });

      if (!approval.success) {
        showToast(approval.error || 'QR approval failed', 'error');
        return;
      }

      if (approval.device) {
        setPrimaryDevice(approval.device);
      }
      setCompleted(true);
      showToast(`Approved with ${bioCaps.label}! New device promoted and prior terminal signed out.`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'QR approval failed', 'error');
    } finally {
      setIsApprovingQr(false);
    }
  };

  const handleBack = () => {
    if (isAuthenticated) {
      if (goBack) {
        goBack();
      } else {
        navigate('profile');
      }
    } else {
      navigate('login');
    }
  };

  const BiometricIcon = bioCaps.biometryType === 'face_id' ? ScanFace : Fingerprint;
  const isPrimaryMobile = primaryDevice ? primaryDevice.platform === 'ios' || primaryDevice.platform === 'android' : false;
  const qrPayload = qrRequest
    ? JSON.stringify({
        type: 'FLYEMASS_DEVICE_MIGRATION',
        token: qrRequest.token,
        userId: uid,
        device: currentDeviceInfo?.deviceName || 'New Device',
        exp: qrRequest.expires_at
      })
    : '';

  return (
    <div className="min-h-full flex flex-col justify-between p-6 bg-slate-950 text-white">
      <div>
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 -mx-6 px-6 py-3 mb-6 flex items-center justify-between safe-top shrink-0">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <SmartphoneNfc className="w-3.5 h-3.5" />
            <span>Device Migration</span>
          </span>
          <div className="w-10" />
        </div>

        <div className="space-y-2 mb-5">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Authorize New Device</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Migrate your hardware session securely to this device. Encrypted session keys are stored strictly in your native Keychain / Keystore — zero raw biometric data ever touches the database.
          </p>
        </div>

        {!completed ? (
          <div className="space-y-5">
            {/* Migration Tab Selector: Dynamic Biometric Label + Live QR Sync */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMigrationMethod('biometric')}
                className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  migrationMethod === 'biometric'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BiometricIcon className="w-3.5 h-3.5" />
                <span>{bioCaps.shortLabel}</span>
              </button>
              <button
                type="button"
                onClick={() => setMigrationMethod('qr')}
                className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  migrationMethod === 'qr'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Sync</span>
              </button>
            </div>

            {/* Real-Time Active Primary Authorized Terminal from Supabase `public.user_devices` */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Primary Authorized Terminal
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold">
                  {loadingDevice ? 'Syncing...' : primaryDevice?.status === 'active' ? 'Active Primary' : 'No Primary Bound'}
                </span>
              </div>

              {loadingDevice ? (
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-36 bg-slate-800 rounded" />
                    <div className="h-2.5 w-48 bg-slate-800/70 rounded" />
                  </div>
                </div>
              ) : primaryDevice ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                    {isPrimaryMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{primaryDevice.device_name}</h4>
                    <p className="text-[10px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                      <span>{formatRelativeTime(primaryDevice.last_active_at)}</span>
                      <span>•</span>
                      <span className="font-mono">IP: {primaryDevice.ip_address || 'Live Session'}</span>
                    </p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      {currentDeviceInfo?.deviceName || 'Current Terminal'}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">Ready to enroll as Primary Terminal</p>
                  </div>
                </div>
              )}
            </div>

            {/* TAB 1: Biometric + PIN Re-Binding */}
            {migrationMethod === 'biometric' && (
              <form
                onSubmit={handleBiometricPinRebind}
                className="p-5 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-4"
              >
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <BiometricIcon className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {bioCaps.label} + PIN Hardware Re-Binding
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Verify your Transaction PIN to confirm ownership, then register this device&apos;s {bioCaps.label} enclave. Your previous primary device will be logged out immediately.
                  </p>
                </div>

                {/* Step 1: Transaction PIN Input */}
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Step 1 · Enter Transaction PIN</span>
                    </span>
                    <span className="font-mono text-slate-500">4–6 digits</span>
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value.replace(/\D/g, ''));
                      setPinError(null);
                    }}
                    placeholder="••••"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-center font-mono text-lg font-bold tracking-[0.45em] text-white outline-none transition-all"
                    required
                  />
                  {pinError && (
                    <p className="text-[11px] text-rose-400 flex items-center gap-1 pt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{pinError}</span>
                    </p>
                  )}
                </div>

                {/* Step 2: Native Biometric Trigger Button */}
                <button
                  type="submit"
                  disabled={isMigrating || pinInput.length < 4}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isMigrating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BiometricIcon className="w-4 h-4" />}
                  <span>{isMigrating ? `Verifying ${bioCaps.label}...` : bioCaps.actionLabel}</span>
                </button>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>Sensor: {bioCaps.isNative ? 'Native Hardware' : 'WebAuthn Passkey'}</span>
                  <span>Device: {currentDeviceInfo?.deviceName || 'Detecting...'}</span>
                </div>
              </form>
            )}

            {/* TAB 2: Live QR Sync Migration */}
            {migrationMethod === 'qr' && (
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Wifi className="w-3 h-3 animate-pulse" />
                    <span>Listening via Supabase Realtime</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-full border ${
                      qrSecondsLeft > 15
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{qrSecondsLeft > 0 ? `${qrSecondsLeft}s` : 'Expired'}</span>
                  </span>
                </div>

                {/* Real Scannable QR Code (qrcode.react) */}
                <div className="relative w-48 h-48 mx-auto bg-white rounded-2xl p-3 flex items-center justify-center shadow-xl">
                  {isGeneratingQr ? (
                    <RefreshCw className="w-8 h-8 text-slate-900 animate-spin" />
                  ) : qrPayload ? (
                    <QRCodeSVG
                      value={qrPayload}
                      size={168}
                      level="M"
                      includeMargin={false}
                      bgColor="#ffffff"
                      fgColor="#020617"
                    />
                  ) : null}

                  {qrSecondsLeft === 0 && (
                    <div className="absolute inset-0 bg-slate-950/90 rounded-2xl flex flex-col items-center justify-center gap-2 p-3">
                      <span className="text-xs font-bold text-rose-400">Token Expired</span>
                      <button
                        type="button"
                        onClick={generateFreshQrToken}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Regenerate QR</span>
                      </button>
                    </div>
                  )}
                </div>

                {qrRequest?.token && (
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 inline-block">
                    <span className="text-[10px] font-mono text-slate-400">
                      Token: <strong className="text-emerald-400">{qrRequest.token.slice(0, 18)}…</strong>
                    </span>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Open FlyeMass on your authorized primary phone, scan this QR code, and approve with{' '}
                  <span className="text-white font-semibold">{bioCaps.label}</span>. This device will promote automatically.
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={generateFreshQrToken}
                    disabled={isGeneratingQr}
                    className="px-3.5 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Generate new 60s QR token"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingQr ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApproveQrViaBiometrics}
                    disabled={isApprovingQr || qrSecondsLeft === 0}
                    className="flex-1 py-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isApprovingQr ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>{isApprovingQr ? 'Approving...' : `Approve via ${bioCaps.shortLabel}`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Device Successfully Enrolled!</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-white">{primaryDevice?.device_name || currentDeviceInfo?.deviceName}</strong> is now your Primary Authorized Terminal. Any previous device session has been revoked via Realtime.
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('home')}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Trade Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-6 text-center border-t border-slate-900">
        <button
          onClick={handleBack}
          className="text-xs text-slate-400 hover:text-emerald-400 font-semibold cursor-pointer"
        >
          Cancel and return to <span className="text-emerald-400 underline">{isAuthenticated ? 'Profile' : 'Login'}</span>
        </button>
      </div>
    </div>
  );
};
