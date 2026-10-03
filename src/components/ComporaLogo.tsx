import React, { useId } from 'react';

export interface ComporaLogoProps {
  variant?: 'full' | 'compact' | 'icon' | 'vertical' | 'horizontal' | 'wordmark';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showTagline?: boolean;
  taglineText?: string;
  className?: string;
  iconClassName?: string;
  textColor?: string;
}

export interface ComporaIconProps {
  size?: number | string;
  className?: string;
  idPrefix?: string;
}

/**
 * Pure Vector SVG Icon for COMPORA
 * Blends:
 * 1. Letter 'C' in high-vibrancy Blue-to-Purple gradient
 * 2. Graduation Mortarboard Cap atop the 'C' with detailed tassel
 * 3. Open Book with 3 rising scholars / student community silhouettes in the center
 */
export const ComporaIcon: React.FC<ComporaIconProps> = ({
  size = 40,
  className = '',
  idPrefix,
}) => {
  const generatedId = useId().replace(/:/g, '_');
  const pfx = idPrefix || `cmp_${generatedId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="COMPORA Emblem"
      role="img"
    >
      <defs>
        {/* Main 'C' Blue-to-Purple Gradient */}
        <linearGradient
          id={`${pfx}_c_grad`}
          x1="30"
          y1="50"
          x2="170"
          y2="180"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="25%" stopColor="#2563eb" />
          <stop offset="65%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>

        {/* Graduation Cap Deep Blue / Royal Gradient */}
        <linearGradient
          id={`${pfx}_cap_grad`}
          x1="20"
          y1="12"
          x2="180"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="50%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        {/* Center Book & Scholars Indigo / Royal Gradient */}
        <linearGradient
          id={`${pfx}_center_grad`}
          x1="70"
          y1="85"
          x2="130"
          y2="155"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>

        {/* Subtle Glow Filter for Highlights */}
        <filter id={`${pfx}_soft_shadow`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" floodColor="#1e1b4b" />
        </filter>
      </defs>

      {/* --- 1. Graduation Cap (Mortarboard & Skull Base) --- */}
      <g filter={`url(#${pfx}_soft_shadow)`}>
        {/* Mortarboard Diamond */}
        <path
          d="M100 12 L174 38 L100 64 L26 38 Z"
          fill={`url(#${pfx}_cap_grad)`}
        />
        {/* Cap Crown / Skull Base Underneath */}
        <path
          d="M62 48.5 L62 59 C62 68 79 73 100 73 C121 73 138 68 138 59 L138 48.5 L100 62.5 Z"
          fill="#172554"
          opacity="0.96"
        />
        {/* Cap Button on Top */}
        <circle cx="100" cy="38" r="3.5" fill="#93c5fd" />

        {/* Tassel Cord hanging right */}
        <path
          d="M100 38 Q140 43 148 58 L148 76"
          stroke="#1e3a8a"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Tassel Fringe / Bob */}
        <path
          d="M144 74 C144 74 141 85 143 89 C145 91 150 91 152 89 C154 85 151 74 151 74 Z"
          fill="#2563eb"
        />
      </g>

      {/* --- 2. The Main 'C' Loop (Letter 'C' Arc) --- */}
      <path
        d="M142 76 C130 63 115 54 98 54 C65 54 38 80 38 112 C38 144 65 170 98 170 C116 170 133 161 145 145 L124 130 C117 140 108 146 98 146 C78 146 62 131 62 112 C62 93 78 78 98 78 C108 78 117 83 123 92 Z"
        fill={`url(#${pfx}_c_grad)`}
      />

      {/* --- 3. Center Scholars & Open Book --- */}
      <g fill={`url(#${pfx}_center_grad)`}>
        {/* Central Scholar (Head & Shoulders) */}
        <circle cx="100" cy="94" r="5.5" />
        <path d="M91 114 C91 104 94 102 100 102 C106 102 109 104 109 114 Z" />

        {/* Left Scholar Silhouette */}
        <circle cx="83" cy="99" r="4.2" />
        <path d="M75 116 C75 108 78 106 83 106 C87 106 89 108 89 116 Z" />

        {/* Right Scholar Silhouette */}
        <circle cx="117" cy="99" r="4.2" />
        <path d="M111 116 C111 108 113 106 117 106 C122 106 125 108 125 116 Z" />

        {/* Open Book Spread */}
        {/* Left Page Page Curve */}
        <path d="M100 128 C92 122 82 118 70 119 L70 131 C82 130 92 134 100 141 Z" />
        {/* Right Page Page Curve */}
        <path d="M100 128 C108 122 118 118 130 119 L130 131 C118 130 108 134 100 141 Z" />
      </g>
    </svg>
  );
};

/**
 * Main COMPORA Logo Component
 * Supports Horizontal, Vertical/Stacked, Compact Icon, and Full Banner variants with light & dark mode support.
 */
export const ComporaLogo: React.FC<ComporaLogoProps> = ({
  variant = 'full',
  size = 'md',
  showTagline = false,
  taglineText = 'Connect • Learn • Grow',
  className = '',
  iconClassName = '',
  textColor,
}) => {
  // Preset Icon and Font sizes
  const iconSizeMap: Record<string, number> = {
    xs: 22,
    sm: 30,
    md: 38,
    lg: 48,
    xl: 60,
    '2xl': 76,
  };

  const titleSizeMap: Record<string, string> = {
    xs: 'text-sm tracking-wider',
    sm: 'text-base tracking-wider',
    md: 'text-xl tracking-wider',
    lg: 'text-2xl tracking-wide',
    xl: 'text-3xl sm:text-4xl tracking-tight',
    '2xl': 'text-4xl sm:text-5xl tracking-tight',
  };

  const taglineSizeMap: Record<string, string> = {
    xs: 'text-[9px] tracking-wider',
    sm: 'text-[10px] tracking-wider',
    md: 'text-[11px] tracking-widest',
    lg: 'text-xs tracking-widest',
    xl: 'text-xs sm:text-sm tracking-widest',
    '2xl': 'text-sm tracking-widest',
  };

  const currentIconSize = iconSizeMap[size] || 38;

  // Compact / Icon-only mode
  if (variant === 'icon' || variant === 'compact') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <ComporaIcon size={currentIconSize} className={iconClassName} />
      </div>
    );
  }

  // Vertical / Stacked mode (Icon centered on top of Wordmark & Tagline)
  if (variant === 'vertical') {
    return (
      <div className={`inline-flex flex-col items-center justify-center text-center gap-2 select-none ${className}`}>
        <ComporaIcon size={currentIconSize} className={iconClassName} />
        <div className="flex flex-col items-center leading-none">
          <div className={`font-black font-display flex items-baseline justify-center ${titleSizeMap[size]}`}>
            <span className={textColor || 'text-slate-900 dark:text-white font-extrabold tracking-widest'}>
              COMPOR
            </span>
            <span className="bg-gradient-to-tr from-purple-600 via-blue-600 to-cyan-400 bg-clip-text text-transparent font-black ml-[1px]">
              A
            </span>
          </div>
          {showTagline && (
            <span className={`font-bold text-slate-500 dark:text-slate-400 uppercase mt-1.5 ${taglineSizeMap[size]}`}>
              {taglineText}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Wordmark only
  if (variant === 'wordmark') {
    return (
      <div className={`inline-flex flex-col justify-center select-none ${className}`}>
        <div className={`font-black font-display flex items-baseline ${titleSizeMap[size]}`}>
          <span className={textColor || 'text-slate-900 dark:text-white font-extrabold tracking-widest'}>
            COMPOR
          </span>
          <span className="bg-gradient-to-tr from-purple-600 via-blue-600 to-cyan-400 bg-clip-text text-transparent font-black ml-[1px]">
            A
          </span>
        </div>
        {showTagline && (
          <span className={`font-bold text-slate-500 dark:text-slate-400 uppercase mt-1 ${taglineSizeMap[size]}`}>
            {taglineText}
          </span>
        )}
      </div>
    );
  }

  // Default: Horizontal / Full Mode (Icon + Wordmark + Optional Tagline)
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <ComporaIcon size={currentIconSize} className={iconClassName} />
      <div className="flex flex-col justify-center leading-none">
        <div className={`font-black font-display flex items-baseline ${titleSizeMap[size]}`}>
          <span className={textColor || 'text-slate-900 dark:text-white font-extrabold tracking-widest'}>
            COMPOR
          </span>
          <span className="bg-gradient-to-tr from-purple-600 via-blue-600 to-cyan-400 bg-clip-text text-transparent font-black ml-[1px]">
            A
          </span>
        </div>
        {showTagline && (
          <span className={`font-bold text-slate-500 dark:text-slate-400 uppercase mt-1 ${taglineSizeMap[size]}`}>
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
};

export default ComporaLogo;
