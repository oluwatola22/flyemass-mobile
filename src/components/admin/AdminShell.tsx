import React from 'react';
import { useApp } from '../../context/AppContext';
import { Toast } from '../ui/Toast';
import { AdminLayout } from './AdminLayout';

// Web Admin Dashboard Screens
import { AdminLoginScreen } from '../../screens/admin/AdminLoginScreen';
import { AdminDashboardScreen } from '../../screens/admin/AdminDashboardScreen';
import { AdminUsersScreen } from '../../screens/admin/AdminUsersScreen';
import { AdminLogisticsScreen } from '../../screens/admin/AdminLogisticsScreen';
import { AdminWarehousesScreen } from '../../screens/admin/AdminWarehousesScreen';
import { AdminLagosHubsScreen } from '../../screens/admin/AdminLagosHubsScreen';
import { AdminPaymentsScreen } from '../../screens/admin/AdminPaymentsScreen';
import { AdminRmbTransfersScreen } from '../../screens/admin/AdminRmbTransfersScreen';
import { AdminNairaPayoutsScreen } from '../../screens/admin/AdminNairaPayoutsScreen';
import { AdminFxManagementScreen } from '../../screens/admin/AdminFxManagementScreen';
import { AdminFxRatesScreen } from '../../screens/admin/AdminFxRatesScreen';
import { AdminFundingScreen } from '../../screens/admin/AdminFundingScreen';
import { AdminShopScreen } from '../../screens/admin/AdminShopScreen';
import { AdminHotelsScreen } from '../../screens/admin/AdminHotelsScreen';
import { AdminRentalsApartmentsScreen } from '../../screens/admin/AdminRentalsApartmentsScreen';
import { AdminRentalsOfficesScreen } from '../../screens/admin/AdminRentalsOfficesScreen';
import { AdminSuppliersScreen } from '../../screens/admin/AdminSuppliersScreen';
import { AdminAgentsScreen } from '../../screens/admin/AdminAgentsScreen';
import { AdminSupportScreen } from '../../screens/admin/AdminSupportScreen';
import { AdminCommunicationsScreen } from '../../screens/admin/AdminCommunicationsScreen';
import { AdminTeamScreen } from '../../screens/admin/AdminTeamScreen';
import { DatabaseViewerScreen } from '../../screens/admin/DatabaseViewerScreen';
import { AdminAccessDeniedScreen } from '../../screens/admin/AdminAccessDeniedScreen';
import { AdminModulePermission, firebaseSync } from '../../services/firebase';
import { db } from '../../services/db';

const ROUTE_TO_ADMIN_TAB: Record<string, string> = {
  'admin-dashboard': 'dashboard',
  'admin-users': 'users',
  'admin-user-detail': 'users',
  'admin-wallet-credit': 'users',
  'admin-logistics': 'logistics',
  'admin-logistics-detail': 'logistics',
  'admin-shipping-rates': 'shipping-rates',
  'admin-warehouses': 'warehouses',
  'admin-lagos-hubs': 'lagos-hubs',
  'admin-registrations': 'logistics',
  'admin-rmb-transfers': 'rmb-transfers',
  'admin-naira-payouts': 'naira-payouts',
  'admin-fx-management': 'fx-management',
  'admin-fx-rates': 'fx-rates',
  'admin-funding': 'funding',
  'admin-gateway': 'funding',
  'admin-payments': 'payments',
  'admin-shop': 'shop',
  'admin-hotels': 'hotels',
  'admin-rentals-apartments': 'rentals-apartments',
  'admin-rentals-offices': 'rentals-offices',
  'admin-suppliers': 'suppliers',
  'admin-agents': 'agents',
  'admin-agent-requests': 'agents',
  'admin-agent-settings': 'agents',
  'admin-support': 'support',
  'admin-support-tickets': 'support',
  'admin-communications': 'communications',
  'admin-team': 'team',
  'schema-inspector': 'schema'
};

const ROUTE_REQUIRED_PERMISSION: Record<string, AdminModulePermission | 'super_admin'> = {
  // Shipments & Cargo Pipeline
  'admin-logistics': 'shipments',
  'admin-logistics-detail': 'shipments',
  'admin-registrations': 'shipments',

  // Air Shipping & FX Rates
  'admin-shipping-rates': 'shipping_rates',

  // Agent Sourcing & Procurement
  'admin-agents': 'agents',
  'admin-agent-requests': 'agents',
  'admin-agent-settings': 'agents',

  // Support Tickets & Duty Desk
  'admin-support': 'support',
  'admin-support-tickets': 'support',

  // Lagos Hubs & Last-Mile Delivery
  'admin-lagos-hubs': 'lagos_hubs',

  // User Directory & Wallets
  'admin-users': 'users',
  'admin-user-detail': 'users',
  'admin-wallet-credit': 'users',

  // Treasury, RMB/Naira Payouts & General Ledger
  'admin-payments': 'treasury',
  'admin-rmb-transfers': 'treasury',
  'admin-naira-payouts': 'treasury',
  'admin-fx-management': 'treasury',
  'admin-fx-rates': 'treasury',
  'admin-funding': 'treasury',
  'admin-gateway': 'treasury',

  // Hubs, Real Estate & Inventory
  'admin-warehouses': 'commerce',
  'admin-shop': 'commerce',
  'admin-hotels': 'commerce',
  'admin-rentals-apartments': 'commerce',
  'admin-rentals-offices': 'commerce',
  'admin-suppliers': 'commerce',

  // Staff Governance & RBAC (Requires super_admin)
  'admin-team': 'super_admin',

  // NoSQL Schema Explorer & Developer Diagnostics (Strictly Super Admin Only)
  'schema-inspector': 'super_admin'
};

export const AdminShell: React.FC = () => {
  const { currentRoute, themeMode, adminUser } = useApp();

  // Route Guard: Require staff authentication for all operational admin routes
  const effectiveRoute = (!adminUser && currentRoute !== 'admin-login') ? 'admin-login' : currentRoute;
  const activeTab = ROUTE_TO_ADMIN_TAB[effectiveRoute] || 'dashboard';

  // Check if staff account is suspended
  if (adminUser && adminUser.status === 'suspended' && effectiveRoute !== 'admin-login') {
    return (
      <div className={`w-full h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans ${themeMode === 'light' ? 'light-mode' : ''}`}>
        <AdminAccessDeniedScreen reason="suspended" staffName={adminUser.name} />
        <Toast />
      </div>
    );
  }

  // Check RBAC permission for the requested route
  const requiredPermission = ROUTE_REQUIRED_PERMISSION[effectiveRoute];
  if (
    adminUser &&
    adminUser.role !== 'super_admin' &&
    requiredPermission &&
    effectiveRoute !== 'admin-login'
  ) {
    const hasPerm = requiredPermission === 'super_admin'
      ? false
      : (adminUser.permissions && adminUser.permissions.includes(requiredPermission as AdminModulePermission));

    if (!hasPerm) {
      // Record security audit
      firebaseSync.recordAudit(
        adminUser.name,
        'UNAUTHORIZED_ACCESS_BLOCKED',
        'governance' as any,
        adminUser.uid,
        `Blocked attempt to access ${effectiveRoute} without '${requiredPermission}' module permission`
      );
      db.logAccessDenied(adminUser.uid, adminUser.name, effectiveRoute, requiredPermission);

      return (
        <div className={`w-full h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans ${themeMode === 'light' ? 'light-mode' : ''}`}>
          <AdminLayout activeTab="dashboard">
            <AdminAccessDeniedScreen
              reason="permission"
              staffName={adminUser.name}
              missingPermission={requiredPermission}
              requestedRoute={effectiveRoute}
            />
          </AdminLayout>
          <Toast />
        </div>
      );
    }
  }

  const renderAdminScreen = () => {
    switch (effectiveRoute) {
      case 'admin-login':
        return <AdminLoginScreen />;
      case 'admin-users':
      case 'admin-user-detail':
      case 'admin-wallet-credit':
        return <AdminUsersScreen />;
      case 'admin-logistics':
      case 'admin-logistics-detail':
        return <AdminLogisticsScreen initialMainTab="cargo" />;
      case 'admin-shipping-rates':
        return <AdminLogisticsScreen initialMainTab="rates" />;
      case 'admin-warehouses':
        return <AdminWarehousesScreen />;
      case 'admin-lagos-hubs':
        return <AdminLagosHubsScreen />;
      case 'admin-registrations':
        return <AdminLogisticsScreen initialStatusFilter="registered" />;
      case 'admin-payments':
        return <AdminPaymentsScreen />;
      case 'admin-rmb-transfers':
        return <AdminRmbTransfersScreen />;
      case 'admin-naira-payouts':
        return <AdminNairaPayoutsScreen />;
      case 'admin-fx-management':
        return <AdminFxManagementScreen />;
      case 'admin-fx-rates':
        return <AdminFxRatesScreen />;
      case 'admin-funding':
      case 'admin-gateway':
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
      case 'admin-agent-requests':
        return <AdminAgentsScreen initialTab="rfqs" />;
      case 'admin-agent-settings':
        return <AdminAgentsScreen initialTab="settings" />;
      case 'admin-support':
      case 'admin-support-tickets':
        return <AdminSupportScreen />;
      case 'admin-communications':
        return <AdminCommunicationsScreen />;
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
    <div className={`w-full h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans ${themeMode === 'light' ? 'light-mode' : ''}`}>
      {effectiveRoute === 'admin-login' ? (
        renderAdminScreen()
      ) : (
        <AdminLayout activeTab={activeTab}>
          {renderAdminScreen()}
        </AdminLayout>
      )}
      <Toast />
    </div>
  );
};
