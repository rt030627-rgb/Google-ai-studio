/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useId, useMemo } from 'react';
import * as d3 from 'd3';
import {
  generateConstellationTelemetry,
  getAllConstellationsTelemetry,
  ConstellationTelemetryPoint,
  ConstellationTelemetrySummary,
} from '../utils/descentEngine';
import { Activity, Compass, Flame, TrendingUp, Layers, Info } from 'lucide-react';

interface ConstellationTelemetryChartProps {
  selectedId: 'gemini' | 'gpt' | 'claude' | 'deepseek';
  onSelectConstellation?: (id: 'gemini' | 'gpt' | 'claude' | 'deepseek') => void;
}

type ChartViewMode = 'trajectory' | 'density' | 'comparison';

export const ConstellationTelemetryChart: React.FC<ConstellationTelemetryChartProps> = ({
  selectedId,
  onSelectConstellation,
}) => {
  const [viewMode, setViewMode] = useState<ChartViewMode>('density');
  const [hoveredPoint, setHoveredPoint] = useState<ConstellationTelemetryPoint | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  const filterId = useId().replace(/:/g, '');

  const telemetry = useMemo(
    () => generateConstellationTelemetry(selectedId, 32),
    [selectedId]
  );

  const allTelemetry = useMemo(
    () => getAllConstellationsTelemetry(32),
    []
  );

  // Chart Dimensions
  const width = 640;
  const height = 220;
  const margin = { top: 22, right: 30, bottom: 32, left: 48 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scales & D3 Line/Area Generators
  const chartRenderData = useMemo(() => {
    if (viewMode === 'trajectory') {
      // Trajectory: X = Drift (-45km to +45km), Y = Altitude (0km to 380km)
      const xScale = d3.scaleLinear().domain([-45, 45]).range([0, innerWidth]);
      const yScale = d3.scaleLinear().domain([0, 380]).range([innerHeight, 0]);

      const lineGen = d3
        .line<ConstellationTelemetryPoint>()
        .x((d) => xScale(d.driftX))
        .y((d) => yScale(d.altitude))
        .curve(d3.curveMonotoneY);

      return {
        xScale,
        yScale,
        lineGen,
        xLabel: '횡방향 표류 (Drift, km)',
        yLabel: '고도 (Altitude, km)',
      };
    } else if (viewMode === 'density') {
      // Density: X = Descent Progress (0% to 100%), Y = Particle Density (0% to 100%)
      const xScale = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);
      const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

      const lineGen = d3
        .line<ConstellationTelemetryPoint>()
        .x((d) => xScale(d.progress))
        .y((d) => yScale(d.density))
        .curve(d3.curveMonotoneX);

      const areaGen = d3
        .area<ConstellationTelemetryPoint>()
        .x((d) => xScale(d.progress))
        .y0(innerHeight)
        .y1((d) => yScale(d.density))
        .curve(d3.curveMonotoneX);

      return {
        xScale,
        yScale,
        lineGen,
        areaGen,
        xLabel: '하강 진행도 (Descent Progress, %)',
        yLabel: '입자 밀도 (Particle Density, %)',
      };
    } else {
      // Comparison: All constellations on Density vs Progress
      const xScale = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);
      const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

      const lineGen = d3
        .line<ConstellationTelemetryPoint>()
        .x((d) => xScale(d.progress))
        .y((d) => yScale(d.density))
        .curve(d3.curveMonotoneX);

      return {
        xScale,
        yScale,
        lineGen,
        xLabel: '하강 진행도 (Descent Progress, %)',
        yLabel: '입자 밀도 (Density, %)',
      };
    }
  }, [viewMode, innerWidth, innerHeight]);

  // Atmospheric altitude thresholds for trajectory background reference lines
  const atmosphericBands = [
    { altitude: 120, label: '열권 / 이온층', color: '#818CF8' },
    { altitude: 85, label: '중간권 계면', color: '#38BDF8' },
    { altitude: 50, label: '성층권', color: '#34D399' },
    { altitude: 15, label: '대류권', color: '#FBBF24' },
  ];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = e.clientX - rect.left - margin.left;
    if (svgX < 0 || svgX > innerWidth) {
      setHoveredPoint(null);
      setHoverCoords(null);
      return;
    }

    if (viewMode === 'trajectory') {
      const svgY = e.clientY - rect.top - margin.top;
      const altitudeVal = chartRenderData.yScale.invert(svgY);
      // Find closest point by altitude
      let closest = telemetry.points[0];
      let minDiff = Infinity;
      for (const pt of telemetry.points) {
        const diff = Math.abs(pt.altitude - altitudeVal);
        if (diff < minDiff) {
          minDiff = diff;
          closest = pt;
        }
      }
      setHoveredPoint(closest);
      setHoverCoords({
        x: chartRenderData.xScale(closest.driftX) + margin.left,
        y: chartRenderData.yScale(closest.altitude) + margin.top,
      });
    } else {
      const progressVal = chartRenderData.xScale.invert(svgX);
      // Find closest point by progress
      let closest = telemetry.points[0];
      let minDiff = Infinity;
      for (const pt of telemetry.points) {
        const diff = Math.abs(pt.progress - progressVal);
        if (diff < minDiff) {
          minDiff = diff;
          closest = pt;
        }
      }
      setHoveredPoint(closest);
      setHoverCoords({
        x: chartRenderData.xScale(closest.progress) + margin.left,
        y: chartRenderData.yScale(closest.density) + margin.top,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoverCoords(null);
  };

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800/90 p-4 space-y-3.5">
      {/* Chart Top Header & Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
            style={{ backgroundColor: telemetry.primaryColor }}
          />
          <span className="text-xs font-semibold text-white tracking-wide flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            하강 궤적 & 입자 밀도 텔레메트리 (D3.js)
          </span>
          <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">
            실시간 수식 연산
          </span>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-[11px]">
          <button
            type="button"
            onClick={() => setViewMode('density')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'density'
                ? 'bg-slate-800 text-white shadow-sm font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>입자 밀도 프로파일</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('trajectory')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'trajectory'
                ? 'bg-slate-800 text-white shadow-sm font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>하강 궤적 곡선</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('comparison')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'comparison'
                ? 'bg-slate-800 text-white shadow-sm font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3 text-purple-400" />
            <span>4대 성좌 비교</span>
          </button>
        </div>
      </div>

      {/* SVG Telemetry Canvas */}
      <div className="relative w-full overflow-hidden bg-slate-950/90 rounded-xl border border-slate-800/90 p-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Neon Glow Filter */}
            <filter id={`telemetry-glow-${filterId}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gradient Fill for Density Area Chart */}
            <linearGradient id={`density-grad-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={telemetry.primaryColor} stopOpacity={0.42} />
              <stop offset="60%" stopColor={telemetry.primaryColor} stopOpacity={0.12} />
              <stop offset="100%" stopColor={telemetry.primaryColor} stopOpacity={0.0} />
            </linearGradient>

            {/* Subtle Grid Pattern */}
            <pattern id={`cyber-grid-${filterId}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="1 3" />
            </pattern>
          </defs>

          {/* Grid Background */}
          <rect
            x={margin.left}
            y={margin.top}
            width={innerWidth}
            height={innerHeight}
            fill={`url(#cyber-grid-${filterId})`}
          />

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Horizontal Grid lines & ticks */}
            {[0, 25, 50, 75, 100].map((tickVal) => {
              const yPos = chartRenderData.yScale(
                viewMode === 'trajectory' ? (tickVal * 380) / 100 : tickVal
              );
              return (
                <g key={`y-grid-${tickVal}`}>
                  <line
                    x1={0}
                    y1={yPos}
                    x2={innerWidth}
                    y2={yPos}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={-8}
                    y={yPos + 3}
                    textAnchor="end"
                    className="font-mono text-[9px] fill-slate-400"
                  >
                    {viewMode === 'trajectory' ? Math.round((tickVal * 380) / 100) : tickVal}
                  </text>
                </g>
              );
            })}

            {/* Vertical Grid lines & ticks */}
            {viewMode === 'trajectory'
              ? [-40, -20, 0, 20, 40].map((tickVal) => {
                  const xPos = chartRenderData.xScale(tickVal);
                  return (
                    <g key={`x-grid-${tickVal}`}>
                      <line
                        x1={xPos}
                        y1={0}
                        x2={xPos}
                        y2={innerHeight}
                        stroke={tickVal === 0 ? '#334155' : '#1e293b'}
                        strokeWidth={tickVal === 0 ? 1.5 : 1}
                        strokeDasharray={tickVal === 0 ? undefined : '2 2'}
                      />
                      <text
                        x={xPos}
                        y={innerHeight + 16}
                        textAnchor="middle"
                        className="font-mono text-[9px] fill-slate-400"
                      >
                        {tickVal}
                      </text>
                    </g>
                  );
                })
              : [0, 20, 40, 60, 80, 100].map((tickVal) => {
                  const xPos = chartRenderData.xScale(tickVal);
                  return (
                    <g key={`x-grid-${tickVal}`}>
                      <line
                        x1={xPos}
                        y1={0}
                        x2={xPos}
                        y2={innerHeight}
                        stroke="#1e293b"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                      <text
                        x={xPos}
                        y={innerHeight + 16}
                        textAnchor="middle"
                        className="font-mono text-[9px] fill-slate-400"
                      >
                        {tickVal}%
                      </text>
                    </g>
                  );
                })}

            {/* Atmosphere layer reference lines for Trajectory View */}
            {viewMode === 'trajectory' &&
              atmosphericBands.map((band) => {
                const yPos = chartRenderData.yScale(band.altitude);
                return (
                  <g key={`band-${band.altitude}`}>
                    <line
                      x1={0}
                      y1={yPos}
                      x2={innerWidth}
                      y2={yPos}
                      stroke={band.color}
                      strokeWidth="1"
                      strokeOpacity="0.35"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={innerWidth - 6}
                      y={yPos - 4}
                      textAnchor="end"
                      fill={band.color}
                      className="font-sans text-[8px] opacity-70"
                    >
                      {band.label} ({band.altitude}km)
                    </text>
                  </g>
                );
              })}

            {/* Area Fill for Single Density View */}
            {viewMode === 'density' && chartRenderData.areaGen && (
              <path
                d={chartRenderData.areaGen(telemetry.points) || ''}
                fill={`url(#density-grad-${filterId})`}
              />
            )}

            {/* Trajectory / Density Curves */}
            {viewMode === 'comparison' ? (
              // All 4 Constellations in Comparison Mode
              allTelemetry.map((item) => {
                const isSelected = item.id === selectedId;
                const pathStr = chartRenderData.lineGen(item.points) || '';
                return (
                  <g
                    key={`comp-line-${item.id}`}
                    className="cursor-pointer"
                    onClick={() => onSelectConstellation?.(item.id)}
                  >
                    <path
                      d={pathStr}
                      fill="none"
                      stroke={item.primaryColor}
                      strokeWidth={isSelected ? 2.5 : 1.2}
                      strokeOpacity={isSelected ? 1.0 : 0.45}
                      filter={isSelected ? `url(#telemetry-glow-${filterId})` : undefined}
                    />
                    {/* Peak Dot */}
                    {item.points.length > 0 && (
                      <circle
                        cx={chartRenderData.xScale(
                          item.points.reduce((max, p) => (p.density > max.density ? p : max), item.points[0]).progress
                        )}
                        cy={chartRenderData.yScale(item.peakDensity)}
                        r={isSelected ? 3.5 : 2}
                        fill={item.primaryColor}
                        stroke="#0f172a"
                        strokeWidth="1"
                      />
                    )}
                  </g>
                );
              })
            ) : (
              // Single Constellation Curve
              <>
                <path
                  d={chartRenderData.lineGen(telemetry.points) || ''}
                  fill="none"
                  stroke={telemetry.primaryColor}
                  strokeWidth="2.4"
                  filter={`url(#telemetry-glow-${filterId})`}
                />

                {/* Peak Indicator on Density view */}
                {viewMode === 'density' && (
                  <g>
                    <circle
                      cx={chartRenderData.xScale(
                        telemetry.points.reduce((max, p) => (p.density > max.density ? p : max), telemetry.points[0]).progress
                      )}
                      cy={chartRenderData.yScale(telemetry.peakDensity)}
                      r={4}
                      fill={telemetry.primaryColor}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <text
                      x={
                        chartRenderData.xScale(
                          telemetry.points.reduce((max, p) => (p.density > max.density ? p : max), telemetry.points[0]).progress
                        ) + 7
                      }
                      y={chartRenderData.yScale(telemetry.peakDensity) - 4}
                      fill={telemetry.primaryColor}
                      className="font-mono text-[9px] font-semibold"
                    >
                      PEAK: {telemetry.peakDensity}% ({telemetry.peakAltitude}km)
                    </text>
                  </g>
                )}

                {/* Start & End Point Markers */}
                {telemetry.points.length > 0 && (
                  <>
                    <circle
                      cx={
                        viewMode === 'trajectory'
                          ? chartRenderData.xScale(telemetry.points[0].driftX)
                          : chartRenderData.xScale(telemetry.points[0].progress)
                      }
                      cy={
                        viewMode === 'trajectory'
                          ? chartRenderData.yScale(telemetry.points[0].altitude)
                          : chartRenderData.yScale(telemetry.points[0].density)
                      }
                      r={3}
                      fill="#38BDF8"
                      stroke="#0f172a"
                      strokeWidth="1"
                    />
                    <circle
                      cx={
                        viewMode === 'trajectory'
                          ? chartRenderData.xScale(telemetry.points[telemetry.points.length - 1].driftX)
                          : chartRenderData.xScale(telemetry.points[telemetry.points.length - 1].progress)
                      }
                      cy={
                        viewMode === 'trajectory'
                          ? chartRenderData.yScale(telemetry.points[telemetry.points.length - 1].altitude)
                          : chartRenderData.yScale(telemetry.points[telemetry.points.length - 1].density)
                      }
                      r={3}
                      fill="#F43F5E"
                      stroke="#0f172a"
                      strokeWidth="1"
                    />
                  </>
                )}
              </>
            )}

            {/* Interactive Hover Point & Crosshair */}
            {hoverCoords && hoveredPoint && (
              <g>
                {/* Vertical Crosshair */}
                <line
                  x1={hoverCoords.x - margin.left}
                  y1={0}
                  x2={hoverCoords.x - margin.left}
                  y2={innerHeight}
                  stroke="#38BDF8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  strokeOpacity="0.75"
                />
                {/* Horizontal Crosshair */}
                <line
                  x1={0}
                  y1={hoverCoords.y - margin.top}
                  x2={innerWidth}
                  y2={hoverCoords.y - margin.top}
                  stroke="#38BDF8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  strokeOpacity="0.75"
                />
                {/* Point Reticle */}
                <circle
                  cx={hoverCoords.x - margin.left}
                  cy={hoverCoords.y - margin.top}
                  r={5}
                  fill={telemetry.primaryColor}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            )}

            {/* Axis Labels */}
            <text
              x={innerWidth}
              y={innerHeight + 26}
              textAnchor="end"
              className="font-sans text-[9px] fill-slate-400"
            >
              {chartRenderData.xLabel}
            </text>
            <text
              x={0}
              y={-8}
              textAnchor="start"
              className="font-sans text-[9px] fill-slate-400"
            >
              {chartRenderData.yLabel}
            </text>
          </g>
        </svg>

        {/* Hover Inspector Tooltip Floating Panel */}
        {hoverCoords && hoveredPoint && (
          <div
            className="absolute pointer-events-none z-20 px-2.5 py-1.5 rounded-xl bg-slate-900/95 border border-cyan-500/50 shadow-xl text-[10px] space-y-0.5 backdrop-blur-md"
            style={{
              left: Math.min(width - 160, Math.max(10, hoverCoords.x - 70)),
              top: Math.max(8, hoverCoords.y - 75),
            }}
          >
            <div className="font-semibold text-white flex items-center justify-between gap-2 border-b border-slate-800 pb-0.5">
              <span>{hoveredPoint.layerName}</span>
              <span className="font-mono text-cyan-300">고도 {hoveredPoint.altitude}km</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 text-slate-300 font-mono text-[9px]">
              <div>밀도: <span className="text-amber-400 font-bold">{hoveredPoint.density}%</span></div>
              <div>표류: <span className="text-sky-300 font-bold">{hoveredPoint.driftX > 0 ? `+${hoveredPoint.driftX}` : hoveredPoint.driftX}km</span></div>
              <div>속도: <span className="text-emerald-400 font-bold">{hoveredPoint.velocity} km/s</span></div>
              <div>진행: <span className="text-purple-300 font-bold">{hoveredPoint.progress}%</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Legend if in comparison mode */}
      {viewMode === 'comparison' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {allTelemetry.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <button
                key={`legend-${item.id}`}
                type="button"
                onClick={() => onSelectConstellation?.(item.id)}
                className={`p-2 rounded-xl text-left border transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-slate-800/90 border-slate-600 shadow-md ring-1'
                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/60'
                }`}
                style={{
                  borderColor: isSelected ? item.primaryColor : undefined,
                  boxShadow: isSelected ? `0 0 12px ${item.primaryColor}40` : undefined,
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.primaryColor }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-white truncate">
                    {item.name}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 truncate">
                    피크: {item.peakDensity}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Telemetry Metrics & Kinetic Formula Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="text-[9px] text-slate-400 flex items-center gap-1">
            <Flame className="w-2.5 h-2.5 text-amber-400" />
            <span>최대 입자 밀도</span>
          </div>
          <div className="font-mono font-bold text-amber-300 text-xs mt-0.5">
            {telemetry.peakDensity}% <span className="text-[9px] font-normal text-slate-400">({telemetry.peakAltitude}km)</span>
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="text-[9px] text-slate-400 flex items-center gap-1">
            <Compass className="w-2.5 h-2.5 text-cyan-400" />
            <span>최대 횡방향 표류</span>
          </div>
          <div className="font-mono font-bold text-cyan-300 text-xs mt-0.5">
            ±{telemetry.maxLateralDrift} km
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="text-[9px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
            <span>대기 진입/종단 속도</span>
          </div>
          <div className="font-mono font-bold text-emerald-300 text-xs mt-0.5">
            {telemetry.entryVelocity} → {telemetry.terminalVelocity} <span className="text-[9px] font-normal text-slate-400">km/s</span>
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="text-[9px] text-slate-400 flex items-center gap-1">
            <Info className="w-2.5 h-2.5 text-purple-400" />
            <span>궤도 역학 방정식</span>
          </div>
          <div className="font-mono text-[9px] text-purple-300 truncate mt-0.5" title={telemetry.trajectoryFormula}>
            {telemetry.trajectoryFormula}
          </div>
        </div>
      </div>
    </div>
  );
};
