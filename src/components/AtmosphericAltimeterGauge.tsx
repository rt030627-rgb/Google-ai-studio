/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AltitudeTelemetryData,
  ATMOSPHERIC_LAYERS,
  formatAltitudeDisplay,
  formatMachDisplay,
} from '../utils/altitudeTelemetry';
import { ChevronLeft, ChevronRight, Gauge, Flame, Compass } from 'lucide-react';

interface AtmosphericAltimeterGaugeProps {
  telemetry: AltitudeTelemetryData;
  speedMode: 'cinematic' | 'normal' | 'mach';
  isDragonActive?: boolean;
  className?: string;
}

export const AtmosphericAltimeterGauge: React.FC<AtmosphericAltimeterGaugeProps> = ({
  telemetry,
  speedMode,
  isDragonActive = false,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { currentLayer, altitudeKm, machNumber, pressureHpa, temperatureC, plasmaFrictionIntensity } = telemetry;

  return (
    <div
      className={`fixed left-3 top-20 z-20 pointer-events-auto transition-all duration-300 select-none ${className}`}
    >
      <div className="relative flex items-start gap-1">
        {/* Main Panel */}
        <div
          className={`bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-lg p-2.5 shadow-2xl transition-all duration-300 ${
            isCollapsed ? 'w-11 overflow-hidden' : 'w-56'
          }`}
          style={{
            borderColor: plasmaFrictionIntensity > 0.4 ? 'rgba(244, 63, 94, 0.6)' : undefined,
            boxShadow:
              plasmaFrictionIntensity > 0.4
                ? '0 0 25px rgba(244, 63, 94, 0.25), inset 0 0 15px rgba(244, 63, 94, 0.1)'
                : '0 8px 30px rgba(0, 0, 0, 0.65)',
          }}
        >
          {isCollapsed ? (
            /* Collapsed Micro View */
            <div
              onClick={() => setIsCollapsed(false)}
              className="flex flex-col items-center gap-2 cursor-pointer py-1"
              title="Expand Atmospheric Altimeter"
            >
              <Compass className="w-4 h-4 text-sky-400 animate-spin-slow" />
              <div
                className="text-[10px] font-pixel font-bold writing-mode-vertical rotate-180 tracking-wider text-slate-300"
                style={{ color: currentLayer.accentHex }}
              >
                {formatAltitudeDisplay(altitudeKm)}
              </div>
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentLayer.accentHex }}
              />
            </div>
          ) : (
            /* Full Telemetry View */
            <div className="flex flex-col gap-2">
              {/* Header: Title and Layer Tag */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400">
                    Altimeter HUD
                  </span>
                </div>
                <button
                  onClick={() => setIsCollapsed(true)}
                  aria-label="Collapse altimeter"
                  className="p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-800/60 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Primary Altitude Readout */}
              <div className="flex items-baseline justify-between px-1">
                <div>
                  <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">
                    Altitude
                  </div>
                  <div
                    className="text-lg font-pixel font-bold tracking-tight drop-shadow-sm"
                    style={{ color: currentLayer.accentHex }}
                  >
                    {formatAltitudeDisplay(altitudeKm)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">
                    Velocity
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-200">
                    {formatMachDisplay(machNumber)}
                  </div>
                </div>
              </div>

              {/* Current Layer Badge & Key Phenomena */}
              <div
                className="px-2 py-1 rounded bg-slate-900/90 border flex flex-col gap-0.5"
                style={{ borderColor: `${currentLayer.accentHex}40` }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-mono font-bold tracking-wider uppercase"
                    style={{ color: currentLayer.accentHex }}
                  >
                    {currentLayer.shortTag} · {currentLayer.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {currentLayer.minAltKm}-{currentLayer.maxAltKm} km
                  </span>
                </div>
                <div className="text-[8.5px] font-mono text-slate-400 truncate">
                  {currentLayer.keyPhenomena}
                </div>
              </div>

              {/* Vertical Atmospheric Ladder Progress */}
              <div className="flex flex-col gap-1 px-1">
                <div className="flex justify-between text-[8px] font-mono text-slate-400">
                  <span>140 KM</span>
                  <span>SURFACE 0 KM</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                  {ATMOSPHERIC_LAYERS.map((layer) => {
                    const span = layer.maxAltKm - layer.minAltKm;
                    const widthPct = (span / 140) * 100;
                    const isActive = layer.id === currentLayer.id;
                    return (
                      <div
                        key={layer.id}
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: isActive ? layer.accentHex : '#334155',
                          opacity: isActive ? 1.0 : 0.45,
                        }}
                        className="h-full transition-all duration-300 border-r border-slate-950/60"
                        title={`${layer.name} (${layer.minAltKm}-${layer.maxAltKm} km)`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Environmental Specs: Pressure & Temp */}
              <div className="grid grid-cols-2 gap-1.5 px-1 pt-1 border-t border-slate-800/60 text-[9px] font-mono">
                <div className="bg-slate-900/60 px-1.5 py-1 rounded border border-slate-800/40">
                  <span className="text-slate-400 block text-[8px]">BAROMETRIC</span>
                  <span className="text-slate-200 font-bold">{pressureHpa} hPa</span>
                </div>
                <div className="bg-slate-900/60 px-1.5 py-1 rounded border border-slate-800/40">
                  <span className="text-slate-400 block text-[8px]">TEMP</span>
                  <span className="text-slate-200 font-bold">{temperatureC}°C</span>
                </div>
              </div>

              {/* Plasma Re-entry Warning Bar (Active during high speeds or dragon) */}
              {(plasmaFrictionIntensity > 0.1 || isDragonActive) && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-950/60 border border-rose-500/40 rounded animate-pulse">
                  <Flame className="w-3 h-3 text-rose-400 shrink-0" />
                  <span className="text-[8.5px] font-mono font-bold text-rose-300 uppercase tracking-tight">
                    {isDragonActive
                      ? 'DRAGON WAKE PLASMA SURGE'
                      : speedMode === 'mach'
                      ? 'SUPERSONIC ATMOSPHERIC FRICTION'
                      : 'BOUNDARY COMPRESSION GLOW'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collapsed tab trigger button if collapsed */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand altimeter"
            className="p-1 mt-1 bg-slate-900/90 text-slate-400 hover:text-white border border-slate-700/60 rounded shadow-md transition-colors"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
