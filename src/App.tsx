import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileShell } from './components/layout/MobileShell';
import { AdminShell } from './components/admin/AdminShell';
import { DevEnvironmentSwitcher } from './components/dev/DevEnvironmentSwitcher';

function MainRouter() {
  const { currentRoute } = useApp();
  const isAdmin = currentRoute.startsWith('admin-') || currentRoute === 'schema-inspector';

  return (
    <div className="w-full min-h-screen bg-slate-950">
      {isAdmin ? <AdminShell /> : <MobileShell />}
      <DevEnvironmentSwitcher />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
}

export default App;
