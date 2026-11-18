import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-400 shrink-0" />
  };

  const borderColors = {
    success: 'border-emerald-500/30 bg-emerald-950/80 text-emerald-100',
    error: 'border-rose-500/30 bg-rose-950/80 text-rose-100',
    info: 'border-indigo-500/30 bg-indigo-950/80 text-indigo-100'
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[88%] max-w-xs pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-2">
      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl border ${borderColors[toast.type]} shadow-black/40`}>
        {icons[toast.type]}
        <p className="text-xs font-semibold leading-snug">{toast.message}</p>
      </div>
    </div>
  );
};
