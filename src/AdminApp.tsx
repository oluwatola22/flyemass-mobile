import React from 'react';
import { AppProvider } from './context/AppContext';
import { AdminShell } from './components/admin/AdminShell';
import { DevEnvironmentSwitcher } from './components/dev/DevEnvironmentSwitcher';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

export function AdminApp() {
  return (
    <ErrorBoundary fallbackTitle="FlyeMass Enterprise Admin Portal">
      <AppProvider>
        <AdminShell />
        <DevEnvironmentSwitcher />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default AdminApp;
