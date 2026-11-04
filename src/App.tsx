import React from 'react';
import { AppProvider } from './context/AppContext';
import { MobileShell } from './components/layout/MobileShell';
import { AdminShell } from './components/admin/AdminShell';
import { isAdminEnvironment } from './utils/environment';

function MainRouter() {
  const isAdmin = isAdminEnvironment();

  return (
    <div className="w-full min-h-screen bg-slate-950">
      {isAdmin ? <AdminShell /> : <MobileShell />}
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
