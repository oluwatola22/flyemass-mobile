import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { 
  Headphones, 
  MessageSquare, 
  FileText, 
  HelpCircle, 
  Phone, 
  Mail, 
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export const SupportScreen: React.FC = () => {
  const { navigate } = useApp();

  const faqs = [
    { q: 'How long does direct Alipay/WeChat settlement take?', a: 'All supplier payments are processed in real-time via China Merchant Clearing API in under 90 seconds.' },
    { q: 'What is the transit time from Guangzhou Baiyun to Lagos Ikeja?', a: 'Express Air Cargo takes 3 to 5 business days with single-window pre-cleared customs.' },
    { q: 'Can I swap NGN directly into RMB in my wallet?', a: 'Yes. Use our Instant FX Swap screen to lock live market rates for 60 seconds with 0% slippage.' },
    { q: 'Where are your physical China warehouses located?', a: 'We have full-scale receiving hubs in Guangzhou (Baiyun Shijing Logistics Park) and Yiwu (Futian Trade Port).' }
  ];

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Trade Help & Concierge" />

      <div className="p-4 space-y-4">
        {/* Live Chat Launcher Hero */}
        <div 
          onClick={() => navigate('support-chat')}
          className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 cursor-pointer shadow-xl flex items-center justify-between group hover:border-emerald-500/60 transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">FlyeMass 24/7 Trade Desk</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Live agents active in Guangzhou & Lagos hubs
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-400" />
        </div>

        {/* Contact Numbers */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">China Ground Desk</span>
            <span className="font-mono font-bold text-white mt-1 block">+86 20 8917 8888</span>
            <span className="text-[10px] text-emerald-400">Guangzhou / Yiwu</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Nigeria Desk</span>
            <span className="font-mono font-bold text-white mt-1 block">+234 1 888 9200</span>
            <span className="text-[10px] text-cyan-400">Ikeja, Lagos Hub</span>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
            Frequently Asked Questions
          </span>

          {faqs.map((faq, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <h4 className="text-xs font-bold text-white">{faq.q}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
