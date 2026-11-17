/**
 * FlyeMass Environment & URL Configuration Utility
 * Completely separates the Customer Mobile App and Admin Operations Workspace
 * into two independent URLs and access environments while sharing unified backend infrastructure.
 *
 * URLs:
 * - Customer Mobile App:      http://localhost:3030 (Development) | https://app.flyemass.com (Production)
 * - Admin Operations Portal:  http://localhost:5173 (Development) | https://admin.flyemass.com (Production)
 * - Shared Backend API:       http://localhost:5050 (Development) | https://api.flyemass.com (Production)
 */

export const isProduction = typeof import.meta !== 'undefined' && !!import.meta.env?.PROD;

export const isDevelopment = typeof import.meta !== 'undefined' && !!import.meta.env?.DEV;

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local') ||
    /^192\.168\.\d+\.\d+$/.test(hostname) ||
    /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(hostname)
  );
}

export function getBackendBaseUrl(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (isLocalHostname(host)) {
      return `http://${host}:5050`;
    }
    return 'https://api.flyemass.com';
  }
  return 'http://localhost:5050';
}

export function getMobileAppUrl(path: string = ''): string {
  let base: string;
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MOBILE_URL) {
    base = import.meta.env.VITE_MOBILE_URL;
  } else if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (isLocalHostname(host)) {
      base = `http://${host}:3030`;
    } else {
      base = window.location.origin.includes('admin.')
        ? window.location.origin.replace('admin.', 'app.')
        : 'https://app.flyemass.com';
    }
  } else {
    base = 'http://localhost:3030';
  }
  return path ? `${base}${path.startsWith('/') ? path : `/${path}`}` : base;
}

export function getAdminAppUrl(path: string = ''): string {
  let base: string;
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_URL) {
    base = import.meta.env.VITE_ADMIN_URL;
  } else if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (isLocalHostname(host)) {
      base = `http://${host}:5173`;
    } else {
      base = window.location.origin.includes('app.') 
        ? window.location.origin.replace('app.', 'admin.')
        : 'https://admin.flyemass.com';
    }
  } else {
    base = 'http://localhost:5173';
  }
  return path ? `${base}${path.startsWith('/') ? path : `/${path}`}` : base;
}

/**
 * Returns true if the current runtime environment is the Admin Operations Workspace
 */
export function isAdminEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.port === '5173' ||
    window.location.hostname.startsWith('admin.') ||
    window.location.pathname.startsWith('/admin') ||
    window.location.pathname === '/admin.html'
  );
}

/**
 * Returns true if the current runtime environment is the Customer Mobile Application
 */
export function isMobileEnvironment(): boolean {
  return !isAdminEnvironment();
}
