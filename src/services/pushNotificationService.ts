import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { supabase } from './supabaseClient';
import { db } from './db';
import { ScreenRoute } from '../types';

export interface PushNotificationPayload {
  title: string;
  body: string;
  type?: string;
  data?: Record<string, any>;
}

class PushNotificationService {
  private isInitialized = false;
  private currentToken: string | null = null;
  private activeUserId: string | null = null;
  private onNotificationCallback?: (notif: any) => void;
  private navigateCallback?: (route: ScreenRoute) => void;

  /**
   * Initialize Push Notifications for current authenticated user
   */
  public async init(
    userId: string,
    options?: {
      onNotificationReceived?: (notif: any) => void;
      navigate?: (route: ScreenRoute) => void;
    }
  ): Promise<{ success: boolean; token?: string; platform: string; error?: string }> {
    this.activeUserId = userId;
    if (options?.onNotificationReceived) {
      this.onNotificationCallback = options.onNotificationReceived;
    }
    if (options?.navigate) {
      this.navigateCallback = options.navigate;
    }

    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();

    try {
      if (isNative) {
        // 1. Native iOS / Android Capacitor FCM Flow
        const permResult = await FirebaseMessaging.requestPermissions();
        if (permResult.receive !== 'granted') {
          console.warn('[FCM] Push notification permissions were denied or dismissed.');
          return { success: false, platform, error: 'Permission not granted' };
        }

        // 2. Retrieve device token
        const tokenResult = await FirebaseMessaging.getToken();
        this.currentToken = tokenResult.token;

        // 3. Register token with backend & Supabase
        await this.saveTokenToDatabase(userId, tokenResult.token, platform);

        // 4. Attach event listeners
        if (!this.isInitialized) {
          // Token refresh
          await FirebaseMessaging.addListener('tokenReceived', async (event) => {
            console.log('[FCM] Token refreshed:', event.token);
            this.currentToken = event.token;
            if (this.activeUserId) {
              await this.saveTokenToDatabase(this.activeUserId, event.token, platform);
            }
          });

          // Foreground notification received
          await FirebaseMessaging.addListener('notificationReceived', (event) => {
            console.log('[FCM] Foreground notification received:', event.notification);
            if (this.onNotificationCallback) {
              this.onNotificationCallback(event.notification);
            }
          });

          // User tapped on notification banner
          await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
            console.log('[FCM] Notification action performed:', event.notification);
            this.handleNotificationTap(event.notification);
          });

          this.isInitialized = true;
        }

        return { success: true, token: tokenResult.token, platform };

      } else {
        // 2. Web / Browser Preview Fallback Flow
        console.log('[FCM] Running in web environment; applying web notification fallback.');

        let webToken = this.currentToken;
        if (!webToken) {
          webToken = `fcm_web_${userId}_${Date.now().toString(36)}`;
          this.currentToken = webToken;
        }

        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'default') {
            try {
              await Notification.requestPermission();
            } catch {
              // Ignore non-blocking web permission errors
            }
          }
        }

        await this.saveTokenToDatabase(userId, webToken, 'web');
        this.isInitialized = true;

        return { success: true, token: webToken, platform: 'web' };
      }

    } catch (err: any) {
      console.warn('[FCM] Push notification initialization notice:', err.message || err);
      // Fallback simulated token for web/dev preview
      const fallbackToken = `fcm_${platform}_${userId}_fallback`;
      this.currentToken = fallbackToken;
      await this.saveTokenToDatabase(userId, fallbackToken, platform);

      return {
        success: true,
        token: fallbackToken,
        platform,
        error: err.message
      };
    }
  }

  /**
   * Persist token in Supabase public.user_push_tokens and local sync state
   */
  public async saveTokenToDatabase(userId: string, token: string, platform: string): Promise<boolean> {
    try {
      const deviceInfo = {
        platform,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'FlyeMass-Native',
        language: typeof navigator !== 'undefined' ? navigator.language : 'en',
        updatedAt: new Date().toISOString()
      };

      // 1. Save in Supabase via RPC or upsert
      try {
        const { error } = await supabase
          .from('user_push_tokens')
          .upsert({
            user_id: userId,
            token,
            platform: platform === 'ios' ? 'ios' : platform === 'android' ? 'android' : 'web',
            device_info: deviceInfo,
            is_active: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id, token' });

        if (error) {
          console.warn('[FCM] Supabase push token upsert notice:', error.message);
        }
      } catch (sbErr) {
        console.warn('[FCM] Supabase client error (fallback to local state):', sbErr);
      }

      // 2. Also register in local sync DB for hybrid mode
      db.registerPushToken(userId, token, platform, deviceInfo);
      return true;

    } catch (e) {
      console.warn('[FCM] Token persistence error:', e);
      return false;
    }
  }

  /**
   * Handle Notification Tap & Route Deep-Linking
   */
  public handleNotificationTap(notification: any): void {
    const data = notification?.data || {};
    const linkRoute = data.linkRoute || data.route || 'notifications';

    if (this.navigateCallback) {
      this.navigateCallback(linkRoute as ScreenRoute);
    } else if (typeof window !== 'undefined') {
      // In SPA environment dispatch custom route event
      window.dispatchEvent(new CustomEvent('flyemass:navigate', { detail: { route: linkRoute } }));
    }
  }

  /**
   * Unregister / Deactivate Token
   */
  public async unregisterToken(userId: string, token?: string): Promise<void> {
    const t = token || this.currentToken;
    if (!t) return;

    try {
      await supabase
        .from('user_push_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('token', t);
    } catch {
      // Ignore cleanup error
    }
    this.currentToken = null;
  }

  public getToken(): string | null {
    return this.currentToken;
  }
}

export const pushNotificationService = new PushNotificationService();
