import React from 'react';

export interface TelcoLogoProps {
  provider: string; // 'MTN' | 'Airtel' | 'Glo' | '9mobile' (case-insensitive)
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const TelcoLogo: React.FC<TelcoLogoProps> = ({
  provider,
  size = 'md',
  className = '',
  showText = false
}) => {
  const norm = (provider || '').trim().toLowerCase();

  // Size mapping
  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-base'
  }[size];

  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 32,
    xl: 42
  }[size];

  if (norm.includes('mtn')) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl bg-[#FFCC00] shadow-md shadow-amber-500/20 border border-yellow-300/40 relative overflow-hidden select-none shrink-0 ${sizeClasses} ${className}`}
        title="MTN Nigeria"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Inner Navy Oval */}
          <ellipse
            cx="50"
            cy="50"
            rx="42"
            ry="30"
            fill="none"
            stroke="#001F3F"
            strokeWidth="5"
          />
          {/* MTN Typography */}
          <text
            x="50"
            y="57"
            textAnchor="middle"
            fill="#001F3F"
            fontWeight="900"
            fontSize="26"
            fontFamily="Impact, Inter, system-ui, sans-serif"
            letterSpacing="1.5"
          >
            MTN
          </text>
        </svg>
      </div>
    );
  }

  if (norm.includes('airtel')) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF0000] to-[#C80000] shadow-md shadow-red-500/20 border border-red-400/40 relative overflow-hidden select-none shrink-0 ${sizeClasses} ${className}`}
        title="Airtel Nigeria"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Airtel Iconic Curved Swoosh / 'a' symbol */}
          <path
            d="M50 16C31.22 16 16 31.22 16 50C16 68.78 31.22 84 50 84C62.45 84 73.34 77.31 79.28 67.35C74.6 71.42 68.52 74 61.85 74C46.39 74 33.85 61.46 33.85 46C33.85 30.54 46.39 18 61.85 18C68.52 18 74.6 20.58 79.28 24.65C73.34 18.69 62.45 16 50 16Z"
            fill="white"
          />
          {/* White Accent Dot */}
          <circle cx="68" cy="46" r="8" fill="white" />
        </svg>
      </div>
    );
  }

  if (norm.includes('glo') || norm.includes('globacom')) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#00A859] via-[#008A48] to-[#006837] shadow-md shadow-emerald-500/20 border border-emerald-400/30 relative overflow-hidden select-none shrink-0 ${sizeClasses} ${className}`}
        title="Globacom (Glo)"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Glowing Outer Ring */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="#80E080"
            strokeWidth="3.5"
            strokeDasharray="4 2"
          />
          {/* Glo Iconic Typography */}
          <text
            x="50"
            y="59"
            textAnchor="middle"
            fill="white"
            fontWeight="900"
            fontSize="30"
            fontFamily="'Century Gothic', Inter, system-ui, sans-serif"
            fontStyle="italic"
          >
            glo
          </text>
        </svg>
      </div>
    );
  }

  if (norm.includes('9mobile') || norm.includes('etisalat') || norm.includes('9mob')) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#006B3F] to-[#004D2D] shadow-md shadow-emerald-700/20 border border-lime-400/40 relative overflow-hidden select-none shrink-0 ${sizeClasses} ${className}`}
        title="9mobile Nigeria"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Vibrant Lime Green '9' Motif */}
          <circle cx="50" cy="40" r="22" stroke="#8CC63F" strokeWidth="8" fill="none" />
          <path
            d="M68 40V68C68 76.84 60.84 84 52 84H42"
            stroke="#8CC63F"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Inner Accent Dot */}
          <circle cx="50" cy="40" r="7" fill="#8CC63F" />
        </svg>
      </div>
    );
  }

  // Fallback for general telco or unknown provider
  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold shrink-0 ${sizeClasses} ${className}`}
    >
      <span>{provider.substring(0, 3).toUpperCase()}</span>
    </div>
  );
};
