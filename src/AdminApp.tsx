import React from 'react';
import { AppProvider } from './context/AppContext';
import { AdminShell } from './components/admin/AdminShell';

export function AdminApp() {
  return (
    <AppProvider>
      <AdminShell />
    </AppProvider>
  );
}

export default AdminApp;
