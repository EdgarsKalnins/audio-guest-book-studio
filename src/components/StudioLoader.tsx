import React from 'react';
import { AppLogo } from './AppLogo';

export interface StudioLoaderProps {
  label?: string;
  sublabel?: string;
  variant?: 'fullscreen' | 'card' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  showWaveform?: boolean;
}

/**
 * StudioLoader - Bespoke animated luxury loader for Audio Guest Book Studio.
 * Renders the brand app icon with rotating golden aura and staggered audio equalizer wave bars.
 */
export const StudioLoader: React.FC<StudioLoaderProps> = ({
  label = 'Loading Audio Guest Book Studio...',
  sublabel,
  variant = 'card',
  size = 'md',
  showWaveform = true,
}) => {
  const iconPixelSize = size === 'sm' ? 40 : size === 'lg' ? 84 : 56;

  // Inline variant (for buttons or small chips)
  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-2 select-none">
        <div className="relative flex items-center justify-center">
          <span className="w-4 h-4 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
        </div>
        {label && <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">{label}</span>}
      </div>
    );
  }

  // Fullscreen overlay variant
  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d0d0f]/90 backdrop-blur-md animate-fade-in select-none p-6">
        {/* Ambient Golden Halo Glow */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute -inset-4 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="absolute -inset-1.5 rounded-full border border-amber-500/30 animate-spin-slow" />

          {/* App Icon */}
          <AppLogo size={iconPixelSize} variant="rendered" className="relative shadow-2xl" />
        </div>

        {/* Dancing Equalizer Waveform Bars */}
        {showWaveform && (
          <div className="flex items-center justify-center gap-1.5 h-8 mb-4">
            {[40, 75, 55, 95, 100, 65, 85, 45, 90, 60, 80].map((h, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-gradient-to-t from-amber-600 via-amber-400 to-amber-200 animate-waveform"
                style={{
                  height: `${h}%`,
                  animationDelay: `${(i * 0.12).toFixed(2)}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Labels */}
        <div className="text-center space-y-1 max-w-sm">
          <h3 className="text-sm font-semibold tracking-wide text-zinc-100">{label}</h3>
          {sublabel && <p className="text-xs text-zinc-400 font-mono">{sublabel}</p>}
        </div>
      </div>
    );
  }

  // Default 'card' variant (for panels, modals, and dropzones)
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-white/[0.06] select-none text-center">
      {/* Icon with Rotating Gold Accent Ring */}
      <div className="relative flex items-center justify-center mb-3.5">
        <div className="absolute -inset-2 bg-amber-500/15 rounded-full blur-lg" />
        <div className="absolute -inset-1 rounded-full border border-amber-500/40 border-t-transparent animate-spin" />
        <AppLogo size={iconPixelSize} variant="rendered" className="relative shadow-md" />
      </div>

      {/* Mini Equalizer Wave */}
      {showWaveform && (
        <div className="flex items-center justify-center gap-1 h-5 mb-2.5">
          {[45, 80, 50, 95, 70, 85, 40].map((h, i) => (
            <span
              key={i}
              className="w-0.5 rounded-full bg-amber-500 animate-waveform"
              style={{
                height: `${h}%`,
                animationDelay: `${(i * 0.15).toFixed(2)}s`,
              }}
            />
          ))}
        </div>
      )}

      {label && <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight">{label}</p>}
      {sublabel && <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">{sublabel}</p>}
    </div>
  );
};
