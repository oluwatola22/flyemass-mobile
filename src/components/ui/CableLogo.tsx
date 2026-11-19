import React, { useState } from 'react';
import { CableTvProvider } from '../../types';

export interface CableLogoProps {
  provider: CableTvProvider | string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const CableLogo: React.FC<CableLogoProps> = ({
  provider,
  size = 'md',
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);
  const norm = (provider || '').trim().toLowerCase();

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }[size];

  let slug = 'dstv';
  let brandName = 'DStv';

  if (norm.includes('gotv')) {
    slug = 'gotv';
    brandName = 'GOtv';
  } else if (norm.includes('star') || norm.includes('startimes')) {
    slug = 'startimes';
    brandName = 'StarTimes';
  }

  // 1. Try bundled image from public/providers/cable/
  if (!imgError) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl shadow-md overflow-hidden select-none shrink-0 ${sizeClasses} ${className}`}
        title={`${brandName} Cable TV`}
      >
        <img
          src={`/providers/cable/${slug}.svg`}
          alt={`${brandName} Cable TV`}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>
    );
  }

  // 2. Safe Fallback: Direct crisp inline SVG vector
  if (slug === 'dstv') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#00A4E4] to-[#004C97] shadow-md shadow-blue-500/20 border border-blue-400/40 relative overflow-hidden select-none shrink-0 ${sizeClasses} ${className}`}
        title="DStv"
      >
        <span className="text-white font-black italic text-xs tracking-tighter">DStv</span>
      </div>
    );
  }

  if (slug === 'gotv') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#8DC63F] to-[#508018] shadow-md shadow-lime-500/20 border border-lime-400/40 relative overflow-hidden select-none shrink-0 ${sizeClasses} ${className}`}
        title="GOtv"
      >
        <span className="text-white font-black text-xs tracking-tight">GOtv</span>
      </div>
    );
  }

  // StarTimes
  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl bg-[#111B2B] border border-orange-500/40 shadow-md shadow-orange-500/20 relative overflow-hidden select-none shrink-0 ${sizeClasses} ${className}`}
      title="StarTimes"
    >
      <span className="text-orange-400 font-extrabold text-[10px] tracking-tight">StarTimes</span>
    </div>
  );
};
