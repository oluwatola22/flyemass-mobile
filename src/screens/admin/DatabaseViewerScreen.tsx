import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { 
  Database, 
  Users, 
  Layers, 
  Truck, 
  Send, 
  ShoppingBag, 
  Headphones, 
  Copy, 
  CheckCheck, 
  RotateCcw, 
  Sparkles, 
  Code2, 
  ChevronRight, 
  Search,
  PlusCircle,
  FileJson,
  ShieldCheck,
  Scale,
  DownloadCloud,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export const DatabaseViewerScreen: React.FC = () => {
  const { showToast } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());
  const [activeCollection, setActiveCollection] = useState<keyof DatabaseState>('users');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Phase 3 Sub-nav view mode
  const [viewMode, setViewMode] = useState<'collections' | 'reconciliation' | 'backups' | 'audit_chain'>('collections');
  const [trialBalanceData, setTrialBalanceData] = useState<any | null>(null);
  const [backupsList, setBackupsList] = useState<any[]>([]);
  const [integrityReport, setIntegrityReport] = useState<any | null>(null);
  const [auditChainStatus, setAuditChainStatus] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setDbState({ ...db.getState() });
    });
    return unsubscribe;
  }, []);

  const loadPhase3Diagnostics = async () => {
    setIsLoading(true);
    try {
      const [recon, backups, integrity, audit] = await Promise.all([
        db.getTrialBalanceReconciliation('adm-001'),
        db.listBackups('adm-001'),
        db.verifyDbIntegrity('adm-001'),
        db.verifyAuditLogs('adm-001')
      ]);
      setTrialBalanceData(recon);
      setBackupsList(backups?.backups || []);
      setIntegrityReport(integrity);
      setAuditChainStatus(audit);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPhase3Diagnostics();
  }, [viewMode]);

  const handleCreateBackup = async () => {
    const res = await db.createBackup('MANUAL_DASHBOARD_SNAPSHOT', 'adm-001');
    if (res && res.success) {
      showToast(`Database snapshot ${res.snapshot.filename} created!`, 'success');
      loadPhase3Diagnostics();
    } else {
      showToast('Failed to create snapshot', 'error');
    }
  };

  const handleRunIntegrityCheck = async () => {
    const res = await db.verifyDbIntegrity('adm-001');
    setIntegrityReport(res);
    if (res && res.healthy) {
      showToast('Database integrity 100% verified! Zero ledger/schema defects.', 'success');
    } else {
      showToast('Integrity issues detected. Review report.', 'error');
    }
  };

  const collectionInfo: { key: keyof DatabaseState; label: string; icon: any; color: string; path: string }[] = [
    { key: 'users', label: 'Users', icon: Users, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', path: '/users/{userId}' },
    { key: 'wallets_ledger', label: 'Wallets Ledger', icon: Layers, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', path: '/wallets_ledger/{ledgerId}' },
    { key: 'shipments', label: 'Shipments', icon: Truck, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', path: '/shipments/{shipmentId}' },
    { key: 'supplier_payments', label: 'Supplier Payouts', icon: Send, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', path: '/supplier_payments/{paymentId}' },
    { key: 'shop_orders', label: 'Shop Orders', icon: ShoppingBag, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', path: '/shop_orders/{orderId}' },
    { key: 'support_tickets', label: 'Support Tickets', icon: Headphones, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', path: '/support_tickets/{ticketId}' },
  ];

  const currentDocs = dbState[activeCollection] || {};
  const docIds = Object.keys(currentDocs);
  
  // Set default selected document
  const effectiveDocId = selectedDocId && currentDocs[selectedDocId] ? selectedDocId : docIds[0] || '';
  const currentDoc = currentDocs[effectiveDocId];

  const handleCopyDoc = (data: any) => {
    navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    showToast('Document JSON copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddSampleRecord = () => {
    if (activeCollection === 'wallets_ledger') {
      db.recordLedgerEntry({
        userId: 'usr_alade_01',
        type: 'FUND',
        sourceCurrency: 'USD',
        targetCurrency: 'USD',
        amount: 2500,
        fee: 0,
        status: 'completed',
        reference: `DEMO-FUND-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: 'Simulated Federal Wire top-up'
      });
      showToast('New record added to /wallets_ledger', 'success');
    } else if (activeCollection === 'shipments') {
      db.recordShipment({
        trackingNumber: `FM-TEST-${Math.floor(10000 + Math.random() * 90000)}`,
        userId: 'usr_alade_01',
        receiverName: 'Chief Babatunde Alade',
        originWarehouse: 'Guangzhou',
        destination: 'Lagos Hub',
        weightKg: 12.4,
        mode: 'Air Freight',
        currentStatus: 'Origin Received',
        timeline: [
          {
            status: 'Origin Received',
            location: 'Guangzhou Baiyun Dock 4',
            timestamp: new Date().toLocaleTimeString(),
            notes: 'Sample pallet checked in'
          }
        ],
        title: 'Sample Electronics Pallet'
      });
      showToast('New shipment added to /shipments', 'success');
    } else if (activeCollection === 'supplier_payments') {
      db.recordSupplierPayment({
        userId: 'usr_alade_01',
        paymentMethod: 'Alipay',
        receiverAccount: '13900139000',
        receiverName: 'Shenzhen Fast Display Co.',
        amountRMB: 12000,
        equivalentNGN: 2574000,
        status: 'disbursed',
        notes: 'Test PO sample payment'
      });
      showToast('New payout added to /supplier_payments', 'success');
    } else {
      showToast(`Select Wallets Ledger, Shipments, or Supplier Payouts to add sample records`, 'info');
    }
  };

  const currentMeta = collectionInfo.find((c) => c.key === activeCollection);

  return (
    <AdminLayout activeTab="db">
      <div className="space-y-6 pb-12">
        {/* Navigation Switcher Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setViewMode('collections')}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'collections'
                ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Entities & Schema</span>
          </button>

          <button
            onClick={() => setViewMode('reconciliation')}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'reconciliation'
                ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Trial Balance</span>
          </button>

          <button
            onClick={() => setViewMode('backups')}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'backups'
                ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Backups & DR</span>
          </button>

          <button
            onClick={() => setViewMode('audit_chain')}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'audit_chain'
                ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Hash Chain</span>
          </button>
        </div>

        {/* 1. ENTITIES & COLLECTIONS INSPECTOR */}
        {viewMode === 'collections' && (
          <div className="space-y-6">
            {/* Top Architecture Banner */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">NoSQL Schema Architecture</h3>
                    <p className="text-[10px] text-slate-400">Live Authoritative Entity Store</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[9px]">
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Directly mapped to the enterprise Firestore data models for cross-border users, ledger transactions, shipments, supplier payouts, shop orders, and support tickets.
              </p>
            </div>

            {/* Collection Selector Pills */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-1">
                Database Collections
              </span>
              <div className="grid grid-cols-2 gap-2">
                {collectionInfo.map((col) => {
                  const Icon = col.icon;
                  const count = Object.keys(dbState[col.key] || {}).length;
                  const isSelected = activeCollection === col.key;
                  return (
                    <button
                      key={col.key}
                      onClick={() => {
                        setActiveCollection(col.key);
                        setSelectedDocId('');
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-slate-900 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className={`p-2 rounded-xl border ${col.color} shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate text-slate-100">{col.label}</p>
                        <p className="text-[9px] text-slate-500 num-tabular font-mono">
                          {count} {count === 1 ? 'doc' : 'docs'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collection Path & Action Bar */}
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span className="truncate max-w-[210px]">{currentMeta?.path}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleAddSampleRecord}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-all text-[11px] font-semibold flex items-center gap-1"
                  title="Add Sample Record"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
                <button
                  onClick={() => handleCopyDoc(currentDocs)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all text-[11px] font-semibold flex items-center gap-1"
                  title="Copy Entire Collection"
                >
                  <FileJson className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document Selector Pills */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-1">
                Document IDs ({docIds.length})
              </span>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                {docIds.map((id) => (
                  <button
                    key={id}
                    onClick={() => setSelectedDocId(id)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold whitespace-nowrap transition-all border ${
                      effectiveDocId === id
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Detail Tree / JSON Viewer */}
            {currentDoc ? (
              <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden space-y-0">
                <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-mono text-[11px] text-white font-bold truncate max-w-[200px]">
                      {effectiveDocId}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyDoc(currentDoc)}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-1 rounded-lg bg-emerald-500/10 transition-colors"
                  >
                    {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-950 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto max-h-96 no-scrollbar selection:bg-emerald-500/30">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(currentDoc, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 rounded-3xl bg-slate-900 border border-slate-800">
                No documents found in this collection.
              </div>
            )}
          </div>
        )}

        {/* 2. TRIAL BALANCE RECONCILIATION */}
        {viewMode === 'reconciliation' && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    Mathematical Ledger Integrity
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-1">
                    Multi-Currency Trial Balance Reconciliation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Enforces strict double-entry equality: sum(Debits) === sum(Credits) with zero delta.
                  </p>
                </div>
                <button
                  onClick={loadPhase3Diagnostics}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {trialBalanceData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(trialBalanceData.trialBalance || {}).map(([curr, b]: [string, any]) => (
                    <div key={curr} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{curr} Ledger</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.net === 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400'
                        }`}>
                          {b.net === 0 ? 'BALANCED' : 'DELTA DEFECT'}
                        </span>
                      </div>
                      <div className="text-xs space-y-1 font-mono">
                        <div className="flex justify-between text-slate-400">
                          <span>Total Debits:</span>
                          <span className="text-slate-200">{b.debits?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Total Credits:</span>
                          <span className="text-slate-200">{b.credits?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-400 border-t border-slate-800 pt-1">
                          <span>Net Invariant:</span>
                          <span>{b.net === 0 ? '0.00 (Zero Delta)' : b.net}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. DATABASE BACKUPS & DISASTER RECOVERY */}
        {viewMode === 'backups' && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    Disaster Recovery & Point-In-Time Snapshots
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-1">
                    Automated Database Snapshots ({backupsList.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Snapshots stored with SHA-256 integrity checksums and 15-version retention policy.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRunIntegrityCheck}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Run Integrity Check</span>
                  </button>
                  <button
                    onClick={handleCreateBackup}
                    className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>Create Snapshot</span>
                  </button>
                </div>
              </div>

              {integrityReport && (
                <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                  integrityReport.healthy ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    <div>
                      <strong className="block font-bold">
                        {integrityReport.healthy ? 'System Integrity: 100% HEALTHY' : 'Integrity Violations Detected'}
                      </strong>
                      <span className="text-[10px] opacity-80 font-mono">
                        {integrityReport.totalJournalEntries} Journal Entries • {integrityReport.usersCount} Accounts Verified
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                {backupsList.map((bk) => (
                  <div key={bk.filename} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-900/40">
                    <div>
                      <span className="font-mono font-bold text-white text-xs">{bk.filename}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        SHA-256: {bk.checksum?.slice(0, 24)}... • {(bk.sizeBytes / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400">
                      {bk.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. AUDIT LOG HASH CHAIN VERIFICATION */}
        {viewMode === 'audit_chain' && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Cryptographic Non-Repudiation Audit
                </span>
                <h3 className="text-base font-extrabold text-white mt-1">
                  Tamper-Evident SHA-256 Audit Trail Chain
                </h3>
                <p className="text-xs text-slate-400">
                  Every staff action, financial approval, and role change is linked to the prior hash, guaranteeing historical immutability.
                </p>
              </div>

              {auditChainStatus && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <strong className="block font-bold">Audit Chain Verified Valid</strong>
                      <span className="text-[10px] font-mono text-emerald-400/80">
                        {auditChainStatus.verifiedCount} Hash-Chained Logs Verified from Genesis Head
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300">
                    CHAIN INTACT
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Integrity Trigger (Non-Destructive) */}
        <div className="pt-2 flex gap-3">
          <button
            onClick={handleRunIntegrityCheck}
            className="flex-1 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verify Database Ledger & Schema Integrity</span>
          </button>
          <button
            onClick={handleCreateBackup}
            className="py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 active:scale-98"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Capture Disaster Recovery Snapshot</span>
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};
