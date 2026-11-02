/**
 * FlyeMass Firebase Configuration & Real-Time Sync Service
 * 
 * Provides production-grade Firebase SDK initialization placeholders
 * (firebase/app, firebase/auth, firebase/firestore) with a robust in-memory &
 * localStorage live-sync layer connecting Web Admin and Mobile Client.
 */

import { db, DatabaseState } from './db';
import { 
  UserDocument, 
  WalletLedgerDocument, 
  ShipmentDocument, 
  SupplierPaymentDocument, 
  ShopOrderDocument, 
  SupportTicketDocument 
} from '../types';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const defaultFirebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyB_FlyeMass_ProductionKey_2026",
  authDomain: "flyemass-trade-fintech.firebaseapp.com",
  projectId: "flyemass-trade-fintech",
  storageBucket: "flyemass-trade-fintech.appspot.com",
  messagingSenderId: "8920149021",
  appId: "1:8920149021:web:9fa12b004289ce"
};

// Admin roles
export type AdminRole = 'super_admin' | 'logistics_manager' | 'finance_officer' | 'support_agent';

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: AdminRole;
  roleTitle: string;
  avatar: string;
  hubLocation: string;
  lastLogin: string;
}

export const INITIAL_ADMINS: AdminUser[] = [
  {
    uid: 'adm-001',
    email: 'admin.alade@flyemass.com',
    name: 'Chief Babatunde Alade',
    role: 'super_admin',
    roleTitle: 'Executive Director & Super Admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    hubLocation: 'Lagos Headquarters',
    lastLogin: 'Just now'
  },
  {
    uid: 'adm-002',
    email: 'chen.wei@flyemass.cn',
    name: 'Chen Wei',
    role: 'logistics_manager',
    roleTitle: 'Guangzhou Cargo Hub Manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    hubLocation: 'Guangzhou Baiyun Hub',
    lastLogin: '5 mins ago'
  },
  {
    uid: 'adm-003',
    email: 'finance.desk@flyemass.com',
    name: 'Ngozi Okonjo-Ade',
    role: 'finance_officer',
    roleTitle: 'Chief Treasury & FX Officer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    hubLocation: 'Victoria Island Clearing Center',
    lastLogin: '18 mins ago'
  },
  {
    uid: 'adm-004',
    email: 'support.china@flyemass.cn',
    name: 'Li Na',
    role: 'support_agent',
    roleTitle: 'Bilingual VIP Trade Desk Lead',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    hubLocation: 'Yiwu International Trade Port',
    lastLogin: '1 hour ago'
  }
];

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetCollection: keyof DatabaseState;
  targetId: string;
  details: string;
  timestamp: number;
  ipAddress: string;
}

const AUDIT_STORAGE_KEY = 'flyemass_admin_audit_logs';

export const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log-001',
    adminId: 'adm-002',
    adminName: 'Chen Wei',
    action: 'WAYPOINT_UPDATE',
    targetCollection: 'shipments',
    targetId: 'ship_can_los_89241',
    details: 'Updated status to Flight ET921 mid-transit',
    timestamp: Date.now() - 3600000,
    ipAddress: '119.130.228.42 (Guangzhou)'
  },
  {
    id: 'log-002',
    adminId: 'adm-003',
    adminName: 'Ngozi Okonjo-Ade',
    action: 'SUPPLIER_PAYOUT_APPROVED',
    targetCollection: 'supplier_payments',
    targetId: 'pay_foxconn_01',
    details: 'Disbursed ¥45,000 to Foxconn Micro Tech via Alipay Business',
    timestamp: Date.now() - 7200000,
    ipAddress: '102.89.44.12 (Lagos)'
  },
  {
    id: 'log-003',
    adminId: 'adm-001',
    adminName: 'Chief Babatunde Alade',
    action: 'RATE_MARGIN_ADJUST',
    targetCollection: 'wallets_ledger',
    targetId: 'fx_engine',
    details: 'Set daily NGN/RMB clearing rate to ₦214.50',
    timestamp: Date.now() - 86400000,
    ipAddress: '105.112.98.14 (Victoria Island)'
  }
];

class FirebaseSyncService {
  private auditLogs: AdminAuditLog[];
  private currentAdminUser: AdminUser = INITIAL_ADMINS[0];

  constructor() {
    this.auditLogs = this.loadAuditLogs();
  }

  private loadAuditLogs(): AdminAuditLog[] {
    try {
      const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_AUDIT_LOGS;
  }

  public recordAudit(adminName: string, action: string, targetCollection: keyof DatabaseState, targetId: string, details: string) {
    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}`,
      adminId: this.currentAdminUser.uid,
      adminName,
      action,
      targetCollection,
      targetId,
      details,
      timestamp: Date.now(),
      ipAddress: '102.89.33.190 (Enterprise Gateway)'
    };
    this.auditLogs = [newLog, ...this.auditLogs];
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.auditLogs));
    } catch (e) {
      console.error(e);
    }
  }

  public getAuditLogs(): AdminAuditLog[] {
    return this.auditLogs;
  }

  public getCurrentAdmin(): AdminUser {
    return this.currentAdminUser;
  }

  public setCurrentAdmin(admin: AdminUser) {
    this.currentAdminUser = admin;
  }

  // ==========================================
  // FIRESTORE SDK REAL-TIME COMPATIBILITY API
  // ==========================================

  /**
   * onSnapshot real-time listener for any collection
   */
  public onSnapshot<K extends keyof DatabaseState>(
    collectionName: K,
    callback: (data: DatabaseState[K]) => void
  ): () => void {
    // Immediate initial dispatch
    callback(db.getCollection(collectionName));

    // Subscribe to ongoing mutations
    return db.subscribe(() => {
      callback(db.getCollection(collectionName));
    });
  }

  /**
   * onSnapshot real-time listener for a single document
   */
  public onDocSnapshot<K extends keyof DatabaseState>(
    collectionName: K,
    docId: string,
    callback: (doc: any) => void
  ): () => void {
    callback(db.getDocument(collectionName, docId));
    return db.subscribe(() => {
      callback(db.getDocument(collectionName, docId));
    });
  }
}

export const firebaseSync = new FirebaseSyncService();
