import React from 'react';
import appIconUrl from '../assets/app-icon.png';

export interface AppLogoProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'vector' | 'rendered';
  animated?: boolean;
}

const SIZE_MAP = {
  sm: 24,
  md: 36,
  lg: 48,
  xl: 64,
};

/**
 * Audio Guest Book Studio Master Brand Icon.
 * Features an intertwined golden wedding ring with a vintage telephone handset
 * and glowing audio waveform equalizer.
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
  variant = 'vector',
  animated = false,
}) => {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 36;

  if (variant === 'rendered') {
    return (
      <div
        className={`relative shrink-0 rounded-2xl overflow-hidden shadow-lg select-none ${
          animated ? 'animate-pulse' : ''
        } ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
      >
        <img
          src={appIconUrl}
          alt="Audio Guest Book Studio"
          className="w-full h-full object-cover rounded-2xl"
          loading="eager"
        />
      </div>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      width={pixelSize}
      height={pixelSize}
      className={`shrink-0 select-none ${className}`}
    >
      <defs>
        {/* Background Radial Glow */}
        <radialGradient id="appLogoBgGlow" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#2a2215" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#141418" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0a0a0c" stopOpacity="1" />
        </radialGradient>

        <linearGradient id="appLogoBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
          <stop offset="35%" stopColor="#dfc596" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0.7" />
        </linearGradient>

        <linearGradient id="appLogoGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="25%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="75%" stopColor="#dfc596" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        <linearGradient id="appLogoRing" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="35%" stopColor="#fef3c7" />
          <stop offset="65%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>

        <linearGradient id="appLogoWave" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
          <stop offset="20%" stopColor="#fbbf24" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="80%" stopColor="#fbbf24" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
        </linearGradient>

        <filter id="appLogoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Squircle Container Base */}
      <rect x="24" y="24" width="464" height="464" rx="112" fill="url(#appLogoBgGlow)" />
      <rect
        x="24"
        y="24"
        width="464"
        height="464"
        rx="112"
        stroke="url(#appLogoBorder)"
        strokeWidth="3.5"
        fill="none"
      />

      {/* Concentric Sound Grooves */}
      <circle cx="256" cy="256" r="172" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="1.5" strokeDasharray="6 8" />
      <circle cx="256" cy="256" r="140" stroke="#f59e0b" strokeOpacity="0.08" strokeWidth="1.5" />

      {/* Intertwined Wedding Ring Halo */}
      <g filter="url(#appLogoGlow)">
        <circle
          cx="256"
          cy="256"
          r="108"
          stroke="url(#appLogoRing)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />
      </g>

      {/* Vintage Telephone Handset Arch */}
      <g filter="url(#appLogoGlow)">
        <path
          d="M 160 210 C 180 156, 332 156, 352 210"
          stroke="url(#appLogoGold)"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        {/* Left Earpiece */}
        <rect
          x="144"
          y="196"
          width="32"
          height="60"
          rx="14"
          fill="url(#appLogoGold)"
          transform="rotate(-18 160 226)"
        />
        {/* Right Mouthpiece */}
        <rect
          x="336"
          y="196"
          width="32"
          height="60"
          rx="14"
          fill="url(#appLogoGold)"
          transform="rotate(18 352 226)"
        />
      </g>

      {/* Audio Waveform Equalizer Bars */}
      <g filter="url(#appLogoGlow)">
        <rect x="136" y="292" width="6" height="24" rx="3" fill="url(#appLogoWave)" />
        <rect x="152" y="280" width="6" height="48" rx="3" fill="url(#appLogoWave)" />
        <rect x="168" y="288" width="6" height="32" rx="3" fill="url(#appLogoWave)" />
        <rect x="184" y="266" width="6" height="76" rx="3" fill="url(#appLogoWave)" />
        <rect x="200" y="254" width="6" height="100" rx="3" fill="url(#appLogoWave)" />
        <rect x="216" y="272" width="6" height="64" rx="3" fill="url(#appLogoWave)" />
        <rect x="232" y="244" width="6" height="120" rx="3" fill="url(#appLogoWave)" />

        {/* Peak Epicenter */}
        <rect x="248" y="234" width="7" height="140" rx="3.5" fill="#ffffff" />
        <rect x="257" y="234" width="7" height="140" rx="3.5" fill="url(#appLogoWave)" />

        <rect x="274" y="244" width="6" height="120" rx="3" fill="url(#appLogoWave)" />
        <rect x="290" y="272" width="6" height="64" rx="3" fill="url(#appLogoWave)" />
        <rect x="306" y="254" width="6" height="100" rx="3" fill="url(#appLogoWave)" />
        <rect x="322" y="266" width="6" height="76" rx="3" fill="url(#appLogoWave)" />
        <rect x="338" y="288" width="6" height="32" rx="3" fill="url(#appLogoWave)" />
        <rect x="354" y="280" width="6" height="48" rx="3" fill="url(#appLogoWave)" />
        <rect x="370" y="292" width="6" height="24" rx="3" fill="url(#appLogoWave)" />
      </g>

      {/* Haute-Couture Diamond Sparkles */}
      <path
        d="M 374 130 Q 374 146, 390 146 Q 374 146, 374 162 Q 374 146, 358 146 Q 374 146, 374 130 Z"
        fill="#fffbeb"
        opacity="0.95"
      />
      <circle cx="374" cy="146" r="2.5" fill="#ffffff" />

      <path
        d="M 134 330 Q 134 340, 144 340 Q 134 340, 134 350 Q 134 340, 124 340 Q 134 340, 134 330 Z"
        fill="#f59e0b"
        opacity="0.8"
      />
    </svg>
  );
};
