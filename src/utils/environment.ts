/**
 * FlyeMass Environment & URL Configuration Utility
 * Centralizes endpoint resolution and removes hardcoded localhost dependencies
 * for production, staging, and native deployment builds.
 */

export const isProduction = typeof import.meta !== 'undefined' && !!import.meta.env?.PROD;

export const isDevelopment = typeof import.meta !== 'undefined' && !!import.meta.env?.DEV;

export function getBackendBaseUrl(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin;
  }
  return 'http://localhost:5050';
}

export function getMobileAppUrl(path: string = ''): string {
  let base: string;
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MOBILE_URL) {
    base = import.meta.env.VITE_MOBILE_URL;
  } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    base = window.location.origin;
  } else {
    base = 'http://localhost:3030';
  }
  return path ? `${base}${path.startsWith('/') ? path : `/${path}`}` : base;
}

export function getAdminAppUrl(path: string = ''): string {
  let base: string;
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_URL) {
    base = import.meta.env.VITE_ADMIN_URL;
  } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // If on app subdomain, point to admin subdomain
    base = window.location.origin.includes('app.') 
      ? window.location.origin.replace('app.', 'admin.')
      : `${window.location.origin}/admin`;
  } else {
    base = 'http://localhost:5173';
  }
  return path ? `${base}${path.startsWith('/') ? path : `/${path}`}` : base;
}
