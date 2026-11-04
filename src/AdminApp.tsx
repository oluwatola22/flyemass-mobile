import React from 'react';
import { AppProvider } from './context/AppContext';
import { AdminShell } from './components/admin/AdminShell';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

/**
 * Admin Operations Workspace Entry Point
 * Exclusively serves the authorized administrator control center.
 * Access restricted to authorized personnel with RBAC.
 */
export function AdminApp() {
  return (
    <ErrorBoundary fallbackTitle="FlyeMass Enterprise Admin Portal">
      <AppProvider>
        <AdminShell />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default AdminApp;
