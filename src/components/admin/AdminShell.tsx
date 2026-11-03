import React from 'react';
import { useApp } from '../../context/AppContext';
import { Toast } from '../ui/Toast';

// Web Admin Dashboard Screens
import { AdminLoginScreen } from '../../screens/admin/AdminLoginScreen';
import { AdminDashboardScreen } from '../../screens/admin/AdminDashboardScreen';
import { AdminUsersScreen } from '../../screens/admin/AdminUsersScreen';
import { AdminLogisticsScreen } from '../../screens/admin/AdminLogisticsScreen';
import { AdminPaymentsScreen } from '../../screens/admin/AdminPaymentsScreen';
import { AdminRmbTransfersScreen } from '../../screens/admin/AdminRmbTransfersScreen';
import { AdminNairaPayoutsScreen } from '../../screens/admin/AdminNairaPayoutsScreen';
import { AdminFxManagementScreen } from '../../screens/admin/AdminFxManagementScreen';
import { AdminFundingScreen } from '../../screens/admin/AdminFundingScreen';
import { AdminShopScreen } from '../../screens/admin/AdminShopScreen';
import { AdminHotelsScreen } from '../../screens/admin/AdminHotelsScreen';
import { AdminRentalsApartmentsScreen } from '../../screens/admin/AdminRentalsApartmentsScreen';
import { AdminRentalsOfficesScreen } from '../../screens/admin/AdminRentalsOfficesScreen';
import { AdminSuppliersScreen } from '../../screens/admin/AdminSuppliersScreen';
import { AdminAgentsScreen } from '../../screens/admin/AdminAgentsScreen';
import { AdminSupportScreen } from '../../screens/admin/AdminSupportScreen';
import { AdminTeamScreen } from '../../screens/admin/AdminTeamScreen';
import { DatabaseViewerScreen } from '../../screens/admin/DatabaseViewerScreen';

export const AdminShell: React.FC = () => {
  const { currentRoute, themeMode } = useApp();

  const renderAdminScreen = () => {
    switch (currentRoute) {
      case 'admin-login':
        return <AdminLoginScreen />;
      case 'admin-users':
      case 'admin-user-detail':
        return <AdminUsersScreen />;
      case 'admin-logistics':
      case 'admin-logistics-detail':
        return <AdminLogisticsScreen />;
      case 'admin-payments':
        return <AdminPaymentsScreen />;
      case 'admin-rmb-transfers':
        return <AdminRmbTransfersScreen />;
      case 'admin-naira-payouts':
        return <AdminNairaPayoutsScreen />;
      case 'admin-fx-management':
        return <AdminFxManagementScreen />;
      case 'admin-funding':
        return <AdminFundingScreen />;
      case 'admin-shop':
        return <AdminShopScreen />;
      case 'admin-hotels':
        return <AdminHotelsScreen />;
      case 'admin-rentals-apartments':
        return <AdminRentalsApartmentsScreen />;
      case 'admin-rentals-offices':
        return <AdminRentalsOfficesScreen />;
      case 'admin-suppliers':
        return <AdminSuppliersScreen />;
      case 'admin-agents':
        return <AdminAgentsScreen />;
      case 'admin-support':
        return <AdminSupportScreen />;
      case 'admin-team':
        return <AdminTeamScreen />;
      case 'schema-inspector':
        return <DatabaseViewerScreen />;
      case 'admin-dashboard':
      default:
        return <AdminDashboardScreen />;
    }
  };

  return (
    <div className={`w-full min-h-screen bg-slate-950 text-slate-100 font-sans ${themeMode === 'light' ? 'light-mode' : ''}`}>
      {renderAdminScreen()}
      <Toast />
    </div>
  );
};
