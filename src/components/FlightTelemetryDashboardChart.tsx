/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useId, useMemo } from 'react';
import * as d3 from 'd3';
import {
  TelemetryDataPoint,
  summarizeTelemetrySeries,
} from '../utils/telemetryChartEngine';
import {
  Activity,
  Compass,
  Gauge,
  Zap,
  TrendingDown,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface FlightTelemetryDashboardChartProps {
  history: TelemetryDataPoint[];
  language?: 'ko' | 'en';
  className?: string;
}

type ChartMetric = 'altitude' | 'velocity' | 'dual';

export const FlightTelemetryDashboardChart: React.FC<FlightTelemetryDashboardChartProps> = ({
  history,
  language = 'ko',
  className = '',
}) => {
  const [activeMetric, setActiveMetric] = useState<ChartMetric>('dual');
  const [hoveredPoint, setHoveredPoint] = useState<TelemetryDataPoint | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  const filterId = useId().replace(/:/g, '');

  const summary = useMemo(() => summarizeTelemetrySeries(history), [history]);

  // Chart Dimensions
  const width = 360;
  const height = 180;
  const margin = { top: 16, right: 38, bottom: 26, left: 38 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // D3 Scales & Generators
  const scales = useMemo(() => {
    if (history.length === 0) return null;

    // Time domain (elapsed seconds or indexes)
    const minTime = history[0].elapsedSeconds;
    const maxTime = Math.max(minTime + 1, history[history.length - 1].elapsedSeconds);
    const xScale = d3.scaleLinear().domain([minTime, maxTime]).range([0, innerWidth]);

    // Altitude domain (0 to 140km or highest recorded)
    const maxAlt = Math.max(140, ...history.map((d) => d.altitudeKm));
    const yAltScale = d3.scaleLinear().domain([0, maxAlt]).range([innerHeight, 0]);

    // Velocity domain (km/h)
    const maxSpeed = Math.max(2500, ...history.map((d) => d.speedKmh));
    const ySpeedScale = d3.scaleLinear().domain([0, maxSpeed]).range([innerHeight, 0]);

    // D3 Line for Altitude
    const altLine = d3
      .line<TelemetryDataPoint>()
      .x((d) => xScale(d.elapsedSeconds))
      .y((d) => yAltScale(d.altitudeKm))
      .curve(d3.curveMonotoneX);

    // D3 Area for Altitude
    const altArea = d3
      .area<TelemetryDataPoint>()
      .x((d) => xScale(d.elapsedSeconds))
      .y0(innerHeight)
      .y1((d) => yAltScale(d.altitudeKm))
      .curve(d3.curveMonotoneX);

    // D3 Line for Velocity
    const speedLine = d3
      .line<TelemetryDataPoint>()
      .x((d) => xScale(d.elapsedSeconds))
      .y((d) => ySpeedScale(d.speedKmh))
      .curve(d3.curveMonotoneX);

    return {
      xScale,
      yAltScale,
      ySpeedScale,
      altLine,
      altArea,
      speedLine,
      minTime,
      maxTime,
      maxAlt,
      maxSpeed,
    };
  }, [history, innerWidth, innerHeight]);

  // Handle pointer hover across the interactive overlay
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!scales || history.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - margin.left;
    const clampedX = Math.max(0, Math.min(innerWidth, mouseX));

    // Invert X position to time
    const hoverTime = scales.xScale.invert(clampedX);

    // Bisect to find closest data point
    let closest = history[0];
    let minDiff = Math.abs(history[0].elapsedSeconds - hoverTime);
    for (let i = 1; i < history.length; i++) {
      const diff = Math.abs(history[i].elapsedSeconds - hoverTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = history[i];
      }
    }

    setHoveredPoint(closest);
    setHoverCoords({
      x: scales.xScale(closest.elapsedSeconds) + margin.left,
      y: activeMetric === 'velocity'
        ? scales.ySpeedScale(closest.speedKmh) + margin.top
        : scales.yAltScale(closest.altitudeKm) + margin.top,
    });
  };

  const handlePointerLeave = () => {
    setHoveredPoint(null);
    setHoverCoords(null);
  };

  return (
    <div className={`flex flex-col gap-2 rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3 select-none ${className}`}>
      {/* Chart Title and Metric Selector */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/70">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="font-pixel text-[11px] font-bold text-white tracking-wide">
            {language === 'ko' ? '실시간 텔레메트리 차트' : 'REAL-TIME TELEMETRY'}
          </span>
          <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
            D3 LIVE
          </span>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setActiveMetric('dual')}
            className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition-colors cursor-pointer ${
              activeMetric === 'dual'
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="고도 + 속도 동시 표시"
          >
            {language === 'ko' ? '복합' : 'DUAL'}
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('altitude')}
            className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition-colors cursor-pointer ${
              activeMetric === 'altitude'
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="고도 vs 시간"
          >
            {language === 'ko' ? '고도' : 'ALT'}
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('velocity')}
            className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition-colors cursor-pointer ${
              activeMetric === 'velocity'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="강하 속도 (Mach/Velocity)"
          >
            {language === 'ko' ? '속도' : 'SPD'}
          </button>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-3 gap-1.5 pt-0.5 text-center font-mono">
        <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
          <span className="text-[8.5px] text-slate-400 block uppercase">
            {language === 'ko' ? '현재 고도' : 'ALTITUDE'}
          </span>
          <span className="text-xs font-bold text-cyan-300">
            {summary.currentAltitudeKm} <span className="text-[8.5px] font-normal text-slate-400">km</span>
          </span>
        </div>

        <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
          <span className="text-[8.5px] text-slate-400 block uppercase">
            {language === 'ko' ? '속도 (마하)' : 'VELOCITY'}
          </span>
          <span className="text-xs font-bold text-amber-300">
            M {summary.currentMach.toFixed(2)}
          </span>
        </div>

        <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
          <span className="text-[8.5px] text-slate-400 block uppercase">
            {language === 'ko' ? '수직 강하율' : 'DESCENT'}
          </span>
          <span className="text-xs font-bold text-purple-300">
            {summary.averageDescentRateKmh} <span className="text-[8.5px] font-normal text-slate-400">km/h</span>
          </span>
        </div>
      </div>

      {/* SVG D3 Chart Viewport */}
      <div className="relative w-full overflow-hidden rounded-xl bg-slate-950/90 border border-slate-800/90 mt-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            {/* Altitude gradient fill */}
            <linearGradient id={`grad-alt-${filterId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.32" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#030712" stopOpacity="0.0" />
            </linearGradient>

            {/* Velocity gradient fill */}
            <linearGradient id={`grad-spd-${filterId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#030712" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => (
              <line
                key={`grid-y-${idx}`}
                x1={0}
                y1={innerHeight * pct}
                x2={innerWidth}
                y2={innerHeight * pct}
                stroke="#1e293b"
                strokeDasharray="2,3"
                strokeWidth={1}
              />
            ))}
            {[0, 0.33, 0.66, 1].map((pct, idx) => (
              <line
                key={`grid-x-${idx}`}
                x1={innerWidth * pct}
                y1={0}
                x2={innerWidth * pct}
                y2={innerHeight}
                stroke="#1e293b"
                strokeDasharray="2,3"
                strokeWidth={1}
              />
            ))}
          </g>

          {/* D3 Rendered Paths */}
          {scales && (
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {/* Altitude Area & Line */}
              {(activeMetric === 'altitude' || activeMetric === 'dual') && (
                <>
                  <path
                    d={scales.altArea(history) || ''}
                    fill={`url(#grad-alt-${filterId})`}
                  />
                  <path
                    d={scales.altLine(history) || ''}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    style={{ filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.5))' }}
                  />
                </>
              )}

              {/* Velocity Line (Dual or Velocity Metric) */}
              {(activeMetric === 'velocity' || activeMetric === 'dual') && (
                <path
                  d={scales.speedLine(history) || ''}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={activeMetric === 'velocity' ? 2 : 1.5}
                  strokeDasharray={activeMetric === 'dual' ? '3,2' : undefined}
                  style={{ filter: 'drop-shadow(0 0 5px rgba(245, 158, 11, 0.4))' }}
                />
              )}

              {/* Current Active Head Cursor Dot */}
              {history.length > 0 && (
                <g>
                  {/* Altitude Head Dot */}
                  {(activeMetric === 'altitude' || activeMetric === 'dual') && (
                    <circle
                      cx={scales.xScale(history[history.length - 1].elapsedSeconds)}
                      cy={scales.yAltScale(history[history.length - 1].altitudeKm)}
                      r={3.5}
                      fill="#38bdf8"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      className="animate-pulse"
                    />
                  )}

                  {/* Velocity Head Dot */}
                  {(activeMetric === 'velocity' || activeMetric === 'dual') && (
                    <circle
                      cx={scales.xScale(history[history.length - 1].elapsedSeconds)}
                      cy={scales.ySpeedScale(history[history.length - 1].speedKmh)}
                      r={3}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth={1}
                    />
                  )}
                </g>
              )}

              {/* Interactive Hover Crosshair */}
              {hoveredPoint && (
                <g>
                  <line
                    x1={scales.xScale(hoveredPoint.elapsedSeconds)}
                    y1={0}
                    x2={scales.xScale(hoveredPoint.elapsedSeconds)}
                    y2={innerHeight}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                    strokeDasharray="2,2"
                    opacity={0.65}
                  />
                  <circle
                    cx={scales.xScale(hoveredPoint.elapsedSeconds)}
                    cy={scales.yAltScale(hoveredPoint.altitudeKm)}
                    r={4}
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                  <circle
                    cx={scales.xScale(hoveredPoint.elapsedSeconds)}
                    cy={scales.ySpeedScale(hoveredPoint.speedKmh)}
                    r={3.5}
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                </g>
              )}
            </g>
          )}

          {/* Left Y-Axis: Altitude (km) */}
          <g transform={`translate(${margin.left - 4}, ${margin.top})`} textAnchor="end">
            <text y={0} fill="#38bdf8" fontSize={8} fontFamily="monospace" fontWeight="bold">
              {scales?.maxAlt || 140}k
            </text>
            <text y={innerHeight * 0.5} fill="#94a3b8" fontSize={7.5} fontFamily="monospace">
              {Math.round((scales?.maxAlt || 140) * 0.5)}k
            </text>
            <text y={innerHeight} fill="#64748b" fontSize={8} fontFamily="monospace">
              0km
            </text>
          </g>

          {/* Right Y-Axis: Velocity (km/h) */}
          <g transform={`translate(${width - margin.right + 4}, ${margin.top})`} textAnchor="start">
            <text y={0} fill="#f59e0b" fontSize={8} fontFamily="monospace" fontWeight="bold">
              {Math.round((scales?.maxSpeed || 2500) / 1000)}k
            </text>
            <text y={innerHeight * 0.5} fill="#94a3b8" fontSize={7.5} fontFamily="monospace">
              {Math.round((scales?.maxSpeed || 2500) * 0.5 / 1000)}k
            </text>
            <text y={innerHeight} fill="#64748b" fontSize={8} fontFamily="monospace">
              0
            </text>
          </g>

          {/* Bottom X-Axis: Time (Seconds) */}
          <g transform={`translate(${margin.left}, ${height - margin.bottom + 12})`} textAnchor="middle">
            <text x={0} fill="#64748b" fontSize={8} fontFamily="monospace">
              T-0s
            </text>
            <text x={innerWidth * 0.5} fill="#64748b" fontSize={7.5} fontFamily="monospace">
              +{Math.round((scales?.maxTime || 30) * 0.5)}s
            </text>
            <text x={innerWidth} fill="#94a3b8" fontSize={8} fontFamily="monospace" fontWeight="bold">
              +{Math.round(scales?.maxTime || 30)}s
            </text>
          </g>
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && hoverCoords && (
          <div
            className="absolute pointer-events-none z-30 px-2 py-1.5 rounded-lg bg-slate-900/95 border border-cyan-500/50 shadow-2xl text-[9px] font-mono text-white flex flex-col gap-0.5 -translate-x-1/2 -translate-y-full mb-2"
            style={{
              left: `${Math.max(48, Math.min(width - 55, hoverCoords.x))}px`,
              top: `${Math.max(20, hoverCoords.y - 8)}px`,
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)',
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-0.5">
              <span className="text-cyan-300 font-bold">T+{hoveredPoint.elapsedSeconds}s</span>
              <span
                className="px-1 rounded text-[8px]"
                style={{ backgroundColor: `${hoveredPoint.color}25`, color: hoveredPoint.color }}
              >
                {hoveredPoint.layerName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-200">
              <span className="text-cyan-400">ALT:</span>
              <span>{hoveredPoint.altitudeKm} km</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-200">
              <span className="text-amber-400">SPD:</span>
              <span>{hoveredPoint.speedKmh} km/h (M {hoveredPoint.machNumber.toFixed(2)})</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[8px]">
              <span>DESCENT:</span>
              <span>{hoveredPoint.descentRateKmh} km/h</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart Legend */}
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 px-1 pt-0.5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-cyan-400 inline-block rounded" />
            <span className="text-cyan-300">{language === 'ko' ? '고도 (Altitude)' : 'Altitude (km)'}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-amber-400 inline-block rounded" />
            <span className="text-amber-300">{language === 'ko' ? '속도 (Velocity)' : 'Velocity (km/h)'}</span>
          </span>
        </div>
        <span className="text-[8px] text-slate-500">
          {history.length} {language === 'ko' ? '샘플' : 'pts'}
        </span>
      </div>
    </div>
  );
};
