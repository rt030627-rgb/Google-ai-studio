/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { type AtmosphericHazeConfig } from '../utils/atmosphericHazeEngine';
import { WeatherType } from '../utils/descentEngine';

export interface AtmosphericHazeFilterProps {
  hazeConfig: AtmosphericHazeConfig;
  weather: WeatherType;
}

export const AtmosphericHazeFilter: React.FC<AtmosphericHazeFilterProps> = ({
  hazeConfig,
  weather,
}) => {
  const { hazeFactor, veilRgb, veilAlpha, horizonAlpha, altitudeKm } = hazeConfig;

  // Generate subtle drifting atmospheric aerosol vapor nodes when low altitude haze is noticeable
  const vaporNodes = useMemo(() => {
    if (hazeFactor < 0.25) return [];
    const count = Math.min(8, Math.floor(hazeFactor * 9));
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${(i * 13 + 7) % 94 + 3}%`,
      bottom: `${(i * 9 + 4) % 36 + 2}%`,
      width: `${24 + (i % 3) * 18}px`,
      height: `${12 + (i % 2) * 8}px`,
      opacity: 0.12 + (i % 4) * 0.05,
      animationDelay: `${i * 0.7}s`,
    }));
  }, [hazeFactor]);

  // If at extreme vacuum altitude (>85km) with zero haze, render nothing to save layout cost
  if (hazeFactor < 0.01) {
    return null;
  }

  const [r, g, b] = veilRgb;
  const veilRgba = `rgba(${r}, ${g}, ${b}, ${Math.min(0.24, veilAlpha * 0.75)})`;
  const horizonRgba = `rgba(${r}, ${g}, ${b}, ${Math.min(0.4, horizonAlpha * 0.85)})`;

  return (
    <div
      data-testid="atmospheric-haze-filter"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      style={{
        opacity: Math.min(1.0, hazeFactor * 1.25),
        transition: 'opacity 0.5s ease-out',
      }}
    >
      {/* 1. Global atmospheric scattering tint veil */}
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          backgroundColor: veilRgba,
        }}
      />

      {/* 2. Volumetric bottom-up altitude density gradient */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: `${Math.round(25 + hazeFactor * 55)}%`,
          background: `linear-gradient(to top, ${horizonRgba} 0%, rgba(${r}, ${g}, ${b}, ${(veilAlpha * 0.4).toFixed(3)}) 55%, transparent 100%)`,
        }}
      />

      {/* 3. Subtle horizontal vapor drift bands */}
      {vaporNodes.map((node) => (
        <div
          key={node.id}
          className="absolute rounded-full blur-md"
          style={{
            left: node.left,
            bottom: node.bottom,
            width: node.width,
            height: node.height,
            backgroundColor: `rgba(${r}, ${g}, ${b}, ${node.opacity * hazeFactor})`,
            animation: 'pulse 4s ease-in-out infinite',
            animationDelay: node.animationDelay,
          }}
        />
      ))}

      {/* 4. Atmospheric corner softening vignette at low altitudes */}
      {hazeFactor > 0.5 && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, transparent 65%, rgba(${r}, ${g}, ${b}, ${(0.15 * hazeFactor).toFixed(3)}) 100%)`,
          }}
        />
      )}
    </div>
  );
};
