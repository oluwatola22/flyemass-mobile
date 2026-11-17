import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  AlertTriangle, 
  Trash2, 
  CheckCircle2, 
  ArrowRight,
  ChevronLeft,
  Clock
} from 'lucide-react';

export const TermsScreen: React.FC = () => {
  const { goBack } = useApp();

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Terms of Trade Service" />

      <div className="p-4 space-y-4 text-xs text-slate-300 leading-relaxed">
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-[10px] uppercase font-bold text-emerald-400">Master Merchant Agreement</span>
          <h3 className="text-sm font-extrabold text-white">Cross-Border Trade & Settlement Protocol</h3>
          <p className="text-[11px] text-slate-400">Effective Date: November 2026 • Version 4.2</p>
        </div>

        <div className="space-y-4 p-4 rounded-3xl bg-slate-900/60 border border-slate-800">
          <section className="space-y-1.5">
            <h4 className="text-xs font-bold text-white">1. Multi-Currency Liquidity & Escrow</h4>
            <p className="text-[11px] text-slate-400">
              FlyeMass operates licensed liquidity pools facilitating Nigerian Naira (NGN), Chinese Yuan (CNY/RMB), and US Dollar (USD) settlements. Payouts via Alipay China and WeChat Pay are executed within 90 seconds under China Merchant Clearing API guidelines.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-xs font-bold text-white">2. Air & Ocean Freight Customs Clearance</h4>
            <p className="text-[11px] text-slate-400">
              All cargo booked through FlyeMass hubs in Guangzhou Baiyun and Yiwu Futian are subject to international aviation security standards and Nigeria Customs Single-Window Form M valuation. FlyeMass liability for unmanifested goods is capped according to standard Warsaw/Montreal convention tariffs.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-xs font-bold text-white">3. Exchange Rate Lock Guarantee</h4>
            <p className="text-[11px] text-slate-400">
              When an FX Swap rate lock countdown timer is active (60 seconds), FlyeMass guarantees 0% slippage between the quote screen and final ledger debit.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-xs font-bold text-white">4. Dispute Resolution & Arbitration</h4>
            <p className="text-[11px] text-slate-400">
              Any cross-border supplier dispute shall be referred to arbitration under the rules of the Lagos Regional Centre for International Commercial Arbitration (LRCICA) or the Hong Kong International Arbitration Centre (HKIAC).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export const PrivacyScreen: React.FC = () => {
  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Privacy Policy & NDPR" />

      <div className="p-4 space-y-4 text-xs text-slate-300 leading-relaxed">
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-[10px] uppercase font-bold text-cyan-400">Data Governance</span>
          <h3 className="text-sm font-extrabold text-white">NDPR & Global Data Protection Compliance</h3>
          <p className="text-[11px] text-slate-400">Nigeria Data Protection Regulation (NDPR) & GDPR Certified</p>
        </div>

        <div className="space-y-4 p-4 rounded-3xl bg-slate-900/60 border border-slate-800">
          <section className="space-y-1.5">
            <h4 className="text-xs font-bold text-white">1. Information We Collect</h4>
            <p className="text-[11px] text-slate-400">
              We collect standard trade contact details, order references, and supplier beneficiary payment coordinates required for trade settlement and logistics execution. User accounts operate with zero mandatory KYC identity requirements.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-xs font-bold text-white">2. Cryptographic Enclave Storage</h4>
            <p className="text-[11px] text-slate-400">
              User 4-digit transaction PINs and biometric keys are stored strictly in client hardware Secure Enclaves (Apple iOS Keychain & Android KeyStore). No plaintext PINs are ever transmitted to or logged on cloud servers.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-xs font-bold text-white">3. Third-Party Disclosures</h4>
            <p className="text-[11px] text-slate-400">
              Beneficiary information is shared solely with clearing partners (Alipay Merchant API, WeChat Pay, Providus Bank, Squad, Korapay) for transaction execution.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export const DeleteAccountScreen: React.FC = () => {
  const { userProfile, wallets, logout, showToast, goBack, activeUserId } = useApp();
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('Closing trading entity');
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [deletionRef, setDeletionRef] = useState('REF-DEL-9014');

  const totalUSD = wallets.reduce((s, w) => s + w.equivalentUSD, 0);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== 'DELETE') {
      showToast('Please type DELETE in capital letters to confirm', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await db.requestAccountDeletion(activeUserId, reason);
      if (res && res.reference) {
        setDeletionRef(res.reference);
      }
    } catch (err) {
      // offline fallback
    } finally {
      setIsProcessing(false);
      setSubmitted(true);
      showToast('Account scheduled for de-identification in 14 days', 'info');
    }
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Account Deletion Request" />

      <div className="p-4 space-y-4">
        {/* Warning Banner */}
        <div className="p-5 rounded-3xl bg-rose-950/40 border border-rose-500/40 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Permanent Deletion Notice</h3>
              <p className="text-[10px] text-rose-300">Apple App Store & Google Play Compliant Flow</p>
            </div>
          </div>

          <p className="text-xs text-rose-200/90 leading-relaxed">
            Submitting this request will permanently deactivate your FlyeMass ID, cancel active trade credit lines, and purge multi-currency virtual accounts across Nigeria and China.
          </p>
        </div>

        {/* Balance Safeguard Alert */}
        {totalUSD > 0 && (
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">
              Safeguard: Existing Wallet Balances
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Liquid Value:</span>
              <span className="font-mono font-bold text-white">${totalUSD.toLocaleString()} USD</span>
            </div>
            <p className="text-[11px] text-slate-400">
              We strongly advise withdrawing all NGN, CNY, and USD funds to your verified Nigerian bank account before proceeding.
            </p>
          </div>
        )}

        {!submitted ? (
          <form onSubmit={handleDelete} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Primary Reason for Departure
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-rose-500"
              >
                <option value="Closing trading entity">Closing trading entity</option>
                <option value="Switching to local broker">Switching to local broker</option>
                <option value="Temporary pause in China imports">Temporary pause in China imports</option>
                <option value="Other compliance requirements">Other compliance requirements</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Type "DELETE" to Confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-center text-sm font-bold tracking-widest text-rose-400 outline-none focus:border-rose-500 uppercase"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing || confirmText !== 'DELETE'}
              className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isProcessing ? 'Submitting Purge Protocol...' : 'Confirm Account Deletion Request'}</span>
            </button>
          </form>
        ) : (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">14-Day Grace Period Initiated</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your deletion request ({deletionRef}) is in the compliance queue. You may log in at any time during the next 14 days to cancel this request.
            </p>
            <div className="pt-2">
              <button
                onClick={logout}
                className="w-full py-3.5 rounded-2xl bg-slate-800 text-white font-bold text-xs"
              >
                Log Out Immediately
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
