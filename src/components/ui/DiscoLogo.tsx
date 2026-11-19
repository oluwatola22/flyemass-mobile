import React, { useState } from 'react';
import { ElectricityDisco } from '../../types';

export interface DiscoLogoProps {
  disco: ElectricityDisco | string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const DiscoLogo: React.FC<DiscoLogoProps> = ({
  disco,
  size = 'md',
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);
  const code = (disco || 'IKEDC').trim().toUpperCase();

  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-base'
  }[size];

  const slug = code.toLowerCase();

  // Brand color mapping for fallback badges
  const brandGradients: Record<string, string> = {
    IKEDC: 'from-red-600 to-rose-900 border-red-500/40 text-white',
    EKEDC: 'from-blue-900 to-slate-950 border-amber-500/40 text-amber-300',
    AEDC: 'from-blue-950 to-blue-900 border-emerald-500/40 text-emerald-300',
    IBEDC: 'from-slate-900 to-slate-950 border-orange-500/40 text-orange-400',
    EEDC: 'from-red-800 to-red-950 border-amber-500/40 text-amber-300',
    PHED: 'from-sky-700 to-blue-950 border-orange-500/40 text-orange-300',
    KEDCO: 'from-emerald-700 to-emerald-950 border-white/30 text-white',
    KAEDCO: 'from-green-700 to-green-950 border-yellow-400/40 text-yellow-300',
    JEDC: 'from-indigo-800 to-slate-950 border-orange-500/40 text-orange-300',
    BEDC: 'from-rose-800 to-slate-950 border-yellow-500/40 text-yellow-300',
    YEDC: 'from-amber-700 to-green-950 border-emerald-400/40 text-amber-200'
  };

  const gradient = brandGradients[code] || 'from-slate-800 to-slate-900 border-slate-700 text-amber-400';

  // 1. Try bundled image from public/providers/discos/
  if (!imgError) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl shadow-md overflow-hidden select-none shrink-0 ${sizeClasses} ${className}`}
        title={`${code} Electricity`}
      >
        <img
          src={`/providers/discos/${slug}.svg`}
          alt={`${code} Electricity DISCO`}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>
    );
  }

  // 2. Safe Fallback: Direct crisp styled brand badge
  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} border shadow-md relative overflow-hidden select-none shrink-0 font-black tracking-tight ${sizeClasses} ${className}`}
      title={`${code} Electricity`}
    >
      <span className="leading-none text-[9px] font-mono">{code.substring(0, 4)}</span>
    </div>
  );
};
