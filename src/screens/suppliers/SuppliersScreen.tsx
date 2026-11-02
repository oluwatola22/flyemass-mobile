import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { PinPad } from '../../components/ui/PinPad';
import { VETTED_SUPPLIERS } from '../../data/mockData';
import { db } from '../../services/db';
import { 
  Building2, 
  Search, 
  ShieldCheck, 
  Star, 
  MessageCircle, 
  ChevronRight, 
  CheckCircle2, 
  Send,
  Lock,
  Sparkles,
  Users,
  AlertTriangle,
  KeyRound
} from 'lucide-react';
import { Supplier, Currency } from '../../types';

export const SuppliersScreen: React.FC = () => {
  const { navigate, showToast, activeUserId, wallets } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [subscribeModalSupplier, setSubscribeModalSupplier] = useState<Supplier | null>(null);
  const [payWallet, setPayWallet] = useState<Currency>('USD');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [revealedContacts, setRevealedContacts] = useState<Record<string, any>>({});

  const categories = ['All', 'Electronics', 'Commodities', 'Solar', 'Textile'];

  const filteredSuppliers = VETTED_SUPPLIERS.filter((sup) => {
    const matchesSearch = sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sup.chineseName.includes(searchQuery) ||
                          sup.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleRevealContact = async (supplierId: string) => {
    try {
      const res = await db.getSupplierContact(supplierId, activeUserId);
      if (res && res.unlocked && res.contacts) {
        setRevealedContacts((prev) => ({ ...prev, [supplierId]: res.contacts }));
        navigator.clipboard?.writeText(res.contacts.wechatId || res.contacts.phone || '');
        showToast(`Factory contact (${res.contacts.wechatId}) copied!`, 'success');
      } else {
        showToast(res.error || 'VIP Pass required to view contacts', 'error');
      }
    } catch (e) {
      showToast('Enclave access error', 'error');
    }
  };

  const handleAuthorizeSubscription = async (pin: string) => {
    if (!subscribeModalSupplier) return;
    setIsSubscribing(true);
    try {
      const res = await db.subscribeToSupplier(activeUserId, subscribeModalSupplier.id, payWallet, pin);
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`30-Day VIP Access unlocked for ${subscribeModalSupplier.name}!`, 'success');
      setSubscribeModalSupplier(null);
      // Auto fetch the contact
      handleRevealContact(subscribeModalSupplier.id);
    } catch (e) {
      showToast('Subscription processing error', 'error');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="VIP Supplier Directory" />

      <div className="p-4 space-y-4">
        {/* Prominent Supplier Safety Escrow Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>FlyeMass Anti-Fraud Safety Notice:</strong> Never pay unvetted Chinese bank accounts or private WeChat links directly. Always disburse via the <strong>FlyeMass Escrow Clearing Desk</strong> to maintain 100% money-back insurance and legal dispute protection in China.
          </p>
        </div>

        {/* Agent Service Shortcut Banner */}
        <div 
          onClick={() => navigate('agent')}
          className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-900/40 cursor-pointer flex items-center justify-between shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Need an On-Site Factory Inspector?</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Book a FlyeMass bilingual trade agent in Guangzhou, Yiwu, or Shenzhen.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search manufacturer, Chinese name, or city..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Supplier Cards */}
        <div className="space-y-4">
          {filteredSuppliers.map((supplier) => {
            const isSubscribed = db.isSupplierSubscribed(activeUserId, supplier.id);

            return (
              <div
                key={supplier.id}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3"
              >
                <div className="flex gap-3.5">
                  <img
                    src={supplier.image}
                    alt={supplier.name}
                    className="w-20 h-20 rounded-2xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                        {supplier.badge}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{supplier.city}</span>
                      {isSubscribed && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[9px] font-bold">
                          VIP Pass Active
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-bold text-white mt-1 leading-snug">{supplier.name}</h3>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">{supplier.chineseName}</p>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span className="flex items-center text-amber-400 font-semibold">
                        <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                        {supplier.rating}
                      </span>
                      <span>•</span>
                      <span>{supplier.ordersFulfilled}+ Fulfilled</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">{supplier.verifiedYears}y Vetted</span>
                    </div>
                  </div>
                </div>

                {/* Main Products Pills */}
                <div className="flex gap-1.5 flex-wrap">
                  {supplier.mainProducts.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300"
                    >
                      {p}
                    </span>
                  ))}
                </div>

                {/* Actions Footer & Subscription Gate */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">
                    Min Order: <strong className="text-slate-200">{supplier.minOrderValue}</strong>
                  </span>

                  <div className="flex gap-2">
                    {isSubscribed ? (
                      <button
                        onClick={() => handleRevealContact(supplier.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold transition-all active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {revealedContacts[supplier.id]?.wechatId || 'View Contact'}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSubscribeModalSupplier(supplier)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold transition-all active:scale-95"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Unlock Contact ($50 / 30d)</span>
                      </button>
                    )}

                    <button
                      onClick={() => navigate('pay')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold transition-all active:scale-95 shadow-md shadow-emerald-500/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Pay Escrow</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 30-Day VIP Pass Subscription Modal */}
      {subscribeModalSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">
                Unlock Verified Factory Contacts
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {subscribeModalSupplier.name} ({subscribeModalSupplier.city})
              </p>
              <div className="p-3 mt-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400">Pass Fee:</span>{' '}
                <strong className="text-emerald-400 text-sm">$50.00 USD</strong>
                <span className="text-slate-500 text-[10px] block mt-0.5">Valid for 30 consecutive days of unmasked factory access</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Debit From Wallet:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayWallet('USD')}
                  className={`p-2 rounded-xl border text-xs font-bold text-center ${
                    payWallet === 'USD' ? 'bg-slate-800 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  🇺🇸 USD Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setPayWallet('NGN')}
                  className={`p-2 rounded-xl border text-xs font-bold text-center ${
                    payWallet === 'NGN' ? 'bg-slate-800 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  🇳🇬 NGN (₦74,250)
                </button>
              </div>
            </div>

            <PinPad
              title="Authorize Subscription"
              subtitle={`Confirm payment of $50 USD to activate 30-day VIP pass.`}
              onComplete={handleAuthorizeSubscription}
              onCancel={() => setSubscribeModalSupplier(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
