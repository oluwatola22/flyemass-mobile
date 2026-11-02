import React from 'react';
import { AppProvider } from './context/AppContext';
import { MobileShell } from './components/layout/MobileShell';
import { DevEnvironmentSwitcher } from './components/dev/DevEnvironmentSwitcher';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

export function MobileApp() {
  return (
    <ErrorBoundary fallbackTitle="FlyeMass Client Mobile Portal">
      <AppProvider>
        <MobileShell />
        <DevEnvironmentSwitcher />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default MobileApp;
