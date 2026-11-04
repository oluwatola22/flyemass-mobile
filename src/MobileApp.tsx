import React from 'react';
import { AppProvider } from './context/AppContext';
import { MobileShell } from './components/layout/MobileShell';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

/**
 * Customer Mobile Application Entry Point
 * Exclusively serves the customer-facing mobile application.
 * Contains ZERO Admin Dashboard links, buttons, or switching options.
 */
export function MobileApp() {
  return (
    <ErrorBoundary fallbackTitle="FlyeMass Customer Mobile Portal">
      <AppProvider>
        <MobileShell />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default MobileApp;
