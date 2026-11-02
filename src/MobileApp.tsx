import React from 'react';
import { AppProvider } from './context/AppContext';
import { MobileShell } from './components/layout/MobileShell';

export function MobileApp() {
  return (
    <AppProvider>
      <MobileShell />
    </AppProvider>
  );
}

export default MobileApp;
