import React, { useState } from 'react';

export interface TelcoLogoProps {
  provider: string; // 'MTN' | 'Airtel' | 'Glo' | '9mobile' (case-insensitive)
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const TelcoLogo: React.FC<TelcoLogoProps> = ({
  provider,
  size = 'md',
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);
  const norm = (provider || '').trim().toLowerCase();

  // Size mapping
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }[size];

  // Resolve asset slug
  let slug = 'mtn';
  let brandName = 'MTN';
  if (norm.includes('airtel')) {
    slug = 'airtel';
    brandName = 'Airtel';
  } else if (norm.includes('glo') || norm.includes('globacom')) {
    slug = 'glo';
    brandName = 'Glo';
  } else if (norm.includes('9mobile') || norm.includes('etisalat') || norm.includes('9')) {
    slug = '9mobile';
    brandName = '9mobile';
  }

  // 1. Try bundled image from public/providers/telcos/
  if (!imgError) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl shadow-md overflow-hidden select-none shrink-0 ${sizeClasses} ${className}`}
        title={`${brandName} Nigeria`}
      >
        <img
          src={`/providers/telcos/${slug}.svg`}
          alt={`${brandName} Nigeria`}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>
    );
  }

  // 2. Safe Fallback: Direct crisp inline SVG vector
  if (slug === 'mtn') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl bg-[#FFCC00] shadow-md shadow-amber-500/20 border border-yellow-300/40 relative overflow-hidden select-none shrink-0 ${sizeClasses} ${className}`}
        title="MTN Nigeria"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none">
          <ellipse cx="50" cy="50" rx="42" ry="30" fill="none" stroke="#001F3F" strokeWidth="5" />
          <text x="50" y="57" textAnchor="middle" fill="#001F3F" fontWeight="900" fontSize="26" fontFamily="Impact, Inter, system-ui, sans-serif" letterSpacing="1.5">
            MTN
          </text>
        </svg>
      </div>
    );
  }

  if (slug === 'airtel') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF0000] to-[#C80000] shadow-md shadow-red-500/20 border border-red-400/40 relative overflow-hidden select-none shrink-0 ${sizeClasses} ${className}`}
        title="Airtel Nigeria"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
          <path d="M50 16C31.22 16 16 31.22 16 50C16 68.78 31.22 84 50 84C62.45 84 73.34 77.31 79.28 67.35C74.6 71.42 68.52 74 61.85 74C46.39 74 33.85 61.46 33.85 46C33.85 30.54 46.39 18 61.85 18C68.52 18 74.6 20.58 79.28 24.65C73.34 18.69 62.45 16 50 16Z" fill="white" />
          <circle cx="68" cy="46" r="8" fill="white" />
        </svg>
      </div>
    );
  }

  if (slug === 'glo') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#00A859] via-[#008A48] to-[#006837] shadow-md shadow-emerald-500/20 border border-emerald-400/30 relative overflow-hidden select-none shrink-0 ${sizeClasses} ${className}`}
        title="Globacom Nigeria"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
          <circle cx="50" cy="50" r="36" stroke="white" strokeWidth="3" strokeOpacity="0.4" />
          <text x="50" y="58" textAnchor="middle" fill="white" fontWeight="900" fontSize="30" fontFamily="Inter, sans-serif" letterSpacing="-1">
            glo
          </text>
          <circle cx="68" cy="38" r="4" fill="#8CC63F" />
        </svg>
      </div>
    );
  }

  // 9mobile
  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#006B3F] via-[#005230] to-[#003820] shadow-md shadow-teal-900/30 border border-emerald-500/30 relative overflow-hidden select-none shrink-0 ${sizeClasses} ${className}`}
      title="9mobile Nigeria"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full p-2" fill="none">
        <circle cx="50" cy="38" r="16" fill="none" stroke="#8CC63F" strokeWidth="7" />
        <path d="M64 38 L64 64 C64 74 56 80 46 80 C38 80 32 74 32 74" fill="none" stroke="#8CC63F" strokeWidth="7" strokeLinecap="round" />
        <circle cx="50" cy="38" r="5" fill="white" />
      </svg>
    </div>
  );
};
