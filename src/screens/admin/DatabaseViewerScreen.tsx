import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
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
  FileJson
} from 'lucide-react';

export const DatabaseViewerScreen: React.FC = () => {
  const { showToast } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());
  const [activeCollection, setActiveCollection] = useState<keyof DatabaseState>('users');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setDbState({ ...db.getState() });
    });
    return unsubscribe;
  }, []);

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
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Backend Schema & Database" />

      <div className="p-4 space-y-4">
        {/* Top Architecture Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">NoSQL Schema Architecture</h3>
                <p className="text-[10px] text-slate-400">Live 6-Collection Entity Store</p>
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
            {/* Header */}
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

            {/* Code / JSON Display */}
            <div className="p-4 bg-slate-950 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto max-h-96 no-scrollbar selection:bg-emerald-500/30">
              <pre className="whitespace-pre-wrap">{JSON.stringify(currentDoc, null, 2)}</pre>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 rounded-3xl bg-slate-900 border border-slate-800">
            No documents found in this collection.
          </div>
        )}

        {/* Reset Database Button */}
        <div className="pt-2">
          <button
            onClick={() => {
              db.resetToDefaults();
              showToast('Database reset to schema baseline', 'info');
            }}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Database to Schema Baseline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
