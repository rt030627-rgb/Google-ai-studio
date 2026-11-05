/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { calculateLedEqualizerBands } from '../utils/altitudeTelemetry';

interface AudioLedVisualizerProps {
  isPlaying: boolean;
  isDragonActive?: boolean;
  isMeteorActive?: boolean;
  windScale?: number;
  onToggleSound?: () => void;
  className?: string;
}

export const AudioLedVisualizer: React.FC<AudioLedVisualizerProps> = ({
  isPlaying,
  isDragonActive = false,
  isMeteorActive = false,
  windScale = 1.0,
  onToggleSound,
  className = '',
}) => {
  const [bands, setBands] = useState<number[]>([0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08]);

  useEffect(() => {
    let animId: number;
    let tick = 0;

    const loop = () => {
      tick++;
      if (tick % 2 === 0) { // Update every 2 frames for smooth retro feel
        setBands(calculateLedEqualizerBands(isPlaying, tick, isDragonActive, isMeteorActive, windScale));
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isDragonActive, isMeteorActive, windScale]);

  return (
    <div
      onClick={onToggleSound}
      role="button"
      tabIndex={0}
      title={isPlaying ? 'Cosmic Soundscape Active (Click to mute)' : 'Cosmic Soundscape Muted (Click to start)'}
      className={`group flex items-end gap-[2px] h-5 px-2 py-1 rounded bg-slate-950/80 border border-slate-700/60 hover:border-sky-500/50 cursor-pointer transition-colors shadow-inner select-none ${className}`}
    >
      {bands.map((band, idx) => {
        // Height scaled to 16px max
        const heightPx = Math.max(2, Math.round(band * 16));
        
        // Color gradient from green (bottom/low band) to cyan/purple (high peak)
        let barColor = 'bg-emerald-400';
        if (band > 0.8) {
          barColor = 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.6)]';
        } else if (band > 0.55) {
          barColor = 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)]';
        } else if (band > 0.35) {
          barColor = 'bg-sky-400 shadow-[0_0_4px_rgba(56,189,248,0.4)]';
        }

        const opacityClass = isPlaying ? 'opacity-95' : 'opacity-25';

        return (
          <div
            key={idx}
            className="w-[3px] bg-slate-900 rounded-[1px] h-full flex items-end"
          >
            <div
              style={{ height: `${heightPx}px` }}
              className={`w-full rounded-[1px] transition-all duration-75 ${barColor} ${opacityClass}`}
            />
          </div>
        );
      })}
    </div>
  );
};
