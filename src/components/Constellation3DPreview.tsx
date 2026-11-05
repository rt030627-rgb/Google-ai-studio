/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  rotate3D,
  project3D,
  projectDomeRadar,
  findClosestStar3D,
  getConstellation3DTopology,
  Constellation3DStar,
  Rotation3D,
  Point3D,
} from '../utils/constellation3DMath';
import {
  RotateCcw,
  Compass,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  Layers,
  MapPin,
  Crosshair,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { playCelestialSynthNote } from '../utils/audioDescent';

interface Constellation3DPreviewProps {
  constellationId: 'gemini' | 'gpt' | 'claude' | 'deepseek';
  onSelectStar?: (star: Constellation3DStar) => void;
  accentColor?: string;
  className?: string;
}

export const Constellation3DPreview: React.FC<Constellation3DPreviewProps> = ({
  constellationId,
  onSelectStar,
  accentColor,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const topology = getConstellation3DTopology(constellationId);

  // 3D Camera & Orientation State
  const [rotation, setRotation] = useState<Rotation3D>({ yaw: 0.35, pitch: -0.25, roll: 0 });
  const [cameraDist, setCameraDist] = useState<number>(195); // 130 to 300
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; yaw: number; pitch: number }>({
    x: 0,
    y: 0,
    yaw: 0.35,
    pitch: -0.25,
  });
  const hasDraggedRef = useRef<boolean>(false);

  // Selected Star & Coordinate Highlighting State
  const [selectedStarId, setSelectedStarId] = useState<string | null>(null);
  const [isCoordinateHighlighted, setIsCoordinateHighlighted] = useState<boolean>(true);
  const [highlightPulseTick, setHighlightPulseTick] = useState<number>(0);

  // Reset star selection when constellation changes
  useEffect(() => {
    setSelectedStarId(null);
    setRotation({ yaw: 0.35, pitch: -0.25, roll: 0 });
  }, [constellationId]);

  const selectedStar = topology.stars.find((s) => s.id === selectedStarId) || null;

  // Mouse & Touch Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      yaw: rotation.yaw,
      pitch: rotation.pitch,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDraggedRef.current = true;
    }

    const newYaw = dragStartRef.current.yaw + dx * 0.009;
    // Clamp pitch between -1.2 and +1.2 rad to prevent flipping
    const newPitch = Math.max(
      -1.2,
      Math.min(1.2, dragStartRef.current.pitch + dy * 0.009)
    );

    setRotation({ yaw: newYaw, pitch: newPitch, roll: 0 });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    // If click without drag, perform raycast star selection and coordinate highlight
    if (!hasDraggedRef.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * canvasRef.current.width;
      const clickY = ((e.clientY - rect.top) / rect.height) * canvasRef.current.height;

      const hitStar = findClosestStar3D(
        clickX,
        clickY,
        topology.stars,
        rotation,
        canvasRef.current.width,
        canvasRef.current.height,
        240,
        cameraDist,
        22
      );

      if (hitStar) {
        setSelectedStarId(hitStar.id);
        setIsCoordinateHighlighted(true);
        setHighlightPulseTick(Date.now());
        if (onSelectStar) onSelectStar(hitStar);
        playCelestialSynthNote(
          hitStar.magnitude < 1.5 ? 880 : hitStar.magnitude < 2.5 ? 659 : 523,
          'sine',
          0.6
        );
      } else {
        // Clicking empty space toggles/pulses coordinate visual emphasis
        setIsCoordinateHighlighted(true);
        setHighlightPulseTick(Date.now());
        playCelestialSynthNote(440, 'triangle', 0.5);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setCameraDist((prev) => Math.max(130, Math.min(300, prev + e.deltaY * 0.25)));
  };

  const handleResetOrientation = useCallback(() => {
    setRotation({ yaw: 0.35, pitch: -0.25, roll: 0 });
    setCameraDist(195);
    setIsCoordinateHighlighted(true);
    setHighlightPulseTick(Date.now());
  }, []);

  const handleToggleCoordinateHighlight = () => {
    setIsCoordinateHighlighted((prev) => !prev);
    setHighlightPulseTick(Date.now());
    playCelestialSynthNote(587, 'triangle', 0.7);
  };

  // Main 3D Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let localTick = 0;

    const render = () => {
      localTick++;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w * 0.5;
      const cy = h * 0.5;

      // Update auto-rotation
      if (isAutoRotating && !isDragging) {
        setRotation((r) => ({ ...r, yaw: r.yaw + 0.007 }));
      }

      ctx.clearRect(0, 0, w, h);

      // Deep celestial void background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // Subtle celestial nebula radial gradient centered
      const radGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, w * 0.65);
      radGlow.addColorStop(0, `${topology.color}18`);
      radGlow.addColorStop(0.5, `${topology.accentColor}0a`);
      radGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = radGlow;
      ctx.fillRect(0, 0, w, h);

      // 1. Draw 3D Celestial Coordinate Sphere Rings (Equator, Meridian, Grid)
      ctx.save();
      const sphereRadius = 85;

      // Celestial Equator (Horizontal ring at z=0)
      ctx.strokeStyle = `${topology.color}35`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      const ringSteps = 36;
      for (let i = 0; i <= ringSteps; i++) {
        const theta = (i / ringSteps) * Math.PI * 2;
        const pt: Point3D = {
          x: Math.cos(theta) * sphereRadius,
          y: 0,
          z: Math.sin(theta) * sphereRadius,
        };
        const rotPt = rotate3D(pt, rotation);
        const proj = project3D(rotPt, w, h, 240, cameraDist);
        if (proj.visible) {
          if (i === 0) ctx.moveTo(proj.x, proj.y);
          else ctx.lineTo(proj.x, proj.y);
        }
      }
      ctx.stroke();

      // Celestial Meridian (Vertical ring)
      ctx.strokeStyle = `${topology.accentColor}25`;
      ctx.beginPath();
      for (let i = 0; i <= ringSteps; i++) {
        const theta = (i / ringSteps) * Math.PI * 2;
        const pt: Point3D = {
          x: 0,
          y: Math.sin(theta) * sphereRadius,
          z: Math.cos(theta) * sphereRadius,
        };
        const rotPt = rotate3D(pt, rotation);
        const proj = project3D(rotPt, w, h, 240, cameraDist);
        if (proj.visible) {
          if (i === 0) ctx.moveTo(proj.x, proj.y);
          else ctx.lineTo(proj.x, proj.y);
        }
      }
      ctx.stroke();

      // Polar Axis Line (NCP / SCP)
      const ncp: Point3D = { x: 0, y: -sphereRadius * 1.25, z: 0 };
      const scp: Point3D = { x: 0, y: sphereRadius * 1.25, z: 0 };
      const rotNcp = rotate3D(ncp, rotation);
      const rotScp = rotate3D(scp, rotation);
      const projNcp = project3D(rotNcp, w, h, 240, cameraDist);
      const projScp = project3D(rotScp, w, h, 240, cameraDist);

      if (projNcp.visible && projScp.visible) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.setLineDash([2, 5]);
        ctx.beginPath();
        ctx.moveTo(projNcp.x, projNcp.y);
        ctx.lineTo(projScp.x, projScp.y);
        ctx.stroke();

        // North Celestial Pole marker label
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.font = '7px monospace';
        ctx.fillText('NCP', projNcp.x + 3, projNcp.y - 2);
      }
      ctx.restore();

      // 2. Project all stars in 3D
      const projectedStars = topology.stars.map((star) => {
        const rotPos = rotate3D(star.pos, rotation);
        const proj = project3D(rotPos, w, h, 240, cameraDist);
        return {
          star,
          proj,
          depth: proj.depth,
        };
      });

      // 3. Draw 3D Constellation Edges (Connecting Lines)
      ctx.save();
      for (const [idx1, idx2] of topology.edges) {
        const p1 = projectedStars[idx1]?.proj;
        const p2 = projectedStars[idx2]?.proj;
        if (!p1 || !p2 || !p1.visible || !p2.visible) continue;

        // Depth-averaged alpha for realistic 3D depth cueing
        const avgDepth = (projectedStars[idx1].depth + projectedStars[idx2].depth) * 0.5;
        const depthFactor = Math.max(0.3, Math.min(1.0, 1.0 - (avgDepth - 50) / 250));

        const isCoreEdge = idx1 === topology.coreNodeIndex || idx2 === topology.coreNodeIndex;
        ctx.strokeStyle = isCoreEdge ? '#ffffff' : topology.color;
        ctx.globalAlpha = (isCoreEdge ? 0.75 : 0.55) * depthFactor;
        ctx.lineWidth = isCoreEdge ? 1.4 : 1.0;
        ctx.setLineDash([4, 2]);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Sort stars by depth (render back-to-front)
      const sortedStars = [...projectedStars].sort((a, b) => b.depth - a.depth);

      // 5. Draw 3D Stars & Halos
      for (const item of sortedStars) {
        const { star, proj, depth } = item;
        if (!proj.visible) continue;

        const isSelected = selectedStarId === star.id;
        const isCore = star.id === topology.stars[topology.coreNodeIndex]?.id;
        const depthAlpha = Math.max(0.4, Math.min(1.0, 1.0 - (depth - 50) / 260));
        const pulse = 0.85 + 0.15 * Math.sin(localTick * 0.08 + star.pos.x * 0.2);

        // Halo
        const haloRadius = Math.max(3, (star.magnitude < 1.5 ? 9 : 6) * proj.scale);
        const haloGrad = ctx.createRadialGradient(
          proj.x,
          proj.y,
          1,
          proj.x,
          proj.y,
          haloRadius * (isSelected ? 1.8 : 1.2)
        );
        haloGrad.addColorStop(0, isSelected ? '#fde047' : star.color);
        haloGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = haloGrad;
        ctx.globalAlpha = (isSelected ? 0.8 : 0.45) * depthAlpha * pulse;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, haloRadius * (isSelected ? 1.8 : 1.2), 0, Math.PI * 2);
        ctx.fill();

        // Star Core Diamond/Square
        const coreSize = Math.max(2, (isSelected ? 4 : isCore ? 3.5 : 2.5) * proj.scale);
        ctx.fillStyle = isSelected ? '#fef08a' : '#ffffff';
        ctx.globalAlpha = depthAlpha;
        ctx.fillRect(proj.x - coreSize * 0.5, proj.y - coreSize * 0.5, coreSize, coreSize);

        // Cross Star Sparkle
        if (star.magnitude <= 1.5 || isSelected) {
          ctx.strokeStyle = isSelected ? '#fde047' : star.color;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.6 * depthAlpha;
          const spikeLen = coreSize * 2.2;
          ctx.beginPath();
          ctx.moveTo(proj.x - spikeLen, proj.y);
          ctx.lineTo(proj.x + spikeLen, proj.y);
          ctx.moveTo(proj.x, proj.y - spikeLen);
          ctx.lineTo(proj.x, proj.y + spikeLen);
          ctx.stroke();
        }

        // Star Bayer Label
        ctx.font = '8px monospace';
        ctx.fillStyle = isSelected ? '#fef08a' : 'rgba(226, 232, 240, 0.75)';
        ctx.globalAlpha = (isSelected ? 1.0 : 0.65) * depthAlpha;
        ctx.fillText(star.bayerName, proj.x + 6, proj.y - 3);

        // Selection Reticle when selected
        if (isSelected) {
          const reticleRadius = 16 + 2 * Math.sin(localTick * 0.15);
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([]);
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, reticleRadius, 0, Math.PI * 2);
          ctx.stroke();

          // Reticle tick crosshairs
          ctx.beginPath();
          ctx.moveTo(proj.x - reticleRadius - 3, proj.y);
          ctx.lineTo(proj.x - reticleRadius + 3, proj.y);
          ctx.moveTo(proj.x + reticleRadius - 3, proj.y);
          ctx.lineTo(proj.x + reticleRadius + 3, proj.y);
          ctx.moveTo(proj.x, proj.y - reticleRadius - 3);
          ctx.lineTo(proj.x, proj.y - reticleRadius + 3);
          ctx.moveTo(proj.x, proj.y + reticleRadius - 3);
          ctx.lineTo(proj.x, proj.y + reticleRadius + 3);
          ctx.stroke();
        }
      }

      // 6. Visual Coordinate Emphasis Layer (when enabled or on click)
      if (isCoordinateHighlighted) {
        ctx.save();
        // Pulse ring around constellation center
        const coreProj = projectedStars[topology.coreNodeIndex]?.proj || { x: cx, y: cy };
        const pulseElapsed = (Date.now() - highlightPulseTick) / 1000;
        const pulseAlpha = Math.max(0.35, Math.min(0.85, 1.0 - (pulseElapsed % 2.5) * 0.3));
        const pulseR = 45 + ((pulseElapsed * 35) % 45);

        ctx.strokeStyle = topology.color;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = pulseAlpha * 0.7;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(coreProj.x, coreProj.y, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        // Holographic coordinate reticle brackets
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.85;

        const bSize = 65;
        // Top-left bracket
        ctx.beginPath();
        ctx.moveTo(coreProj.x - bSize, coreProj.y - bSize + 15);
        ctx.lineTo(coreProj.x - bSize, coreProj.y - bSize);
        ctx.lineTo(coreProj.x - bSize + 15, coreProj.y - bSize);
        // Bottom-right bracket
        ctx.moveTo(coreProj.x + bSize, coreProj.y + bSize - 15);
        ctx.lineTo(coreProj.x + bSize, coreProj.y + bSize);
        ctx.lineTo(coreProj.x + bSize - 15, coreProj.y + bSize);
        ctx.stroke();

        // Coordinate HUD text projected near core
        ctx.font = '8px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.globalAlpha = 0.9;
        ctx.fillText(
          `RA ${topology.coordinates.rightAscension} · DEC ${topology.coordinates.declination}`,
          coreProj.x - 55,
          coreProj.y + bSize + 14
        );
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    topology,
    rotation,
    cameraDist,
    isAutoRotating,
    isDragging,
    selectedStarId,
    isCoordinateHighlighted,
    highlightPulseTick,
  ]);

  return (
    <div
      className={`relative bg-slate-950/80 rounded-2xl border border-slate-800/80 overflow-hidden flex flex-col ${className}`}
    >
      {/* Top Controls Bar */}
      <div className="p-2.5 px-3.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full animate-ping"
            style={{ backgroundColor: topology.color }}
          />
          <span className="font-pixel text-[11px] text-white tracking-wide">
            3D 성좌 천체 홀로그램 (3D Orbit)
          </span>
          <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">
            / 마우스 드래그로 360° 회전
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Coordinate Highlight Button */}
          <button
            onClick={handleToggleCoordinateHighlight}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-all ${
              isCoordinateHighlighted
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="천구 위치 좌표계 시각적 강조"
          >
            <Crosshair className="w-3 h-3 text-sky-400" />
            <span>위치 좌표 강조</span>
          </button>

          {/* Auto Rotation Toggle */}
          <button
            onClick={() => setIsAutoRotating((prev) => !prev)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isAutoRotating
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={isAutoRotating ? '자동 회전 일시정지' : '자동 회전 시작'}
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Reset Orientation */}
          <button
            onClick={handleResetOrientation}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
            title="시점 초기화"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Area */}
      <div className="relative w-full h-[220px] sm:h-[250px] cursor-grab active:cursor-grabbing select-none overflow-hidden">
        <canvas
          ref={canvasRef}
          width={460}
          height={260}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          className="w-full h-full block touch-none"
        />

        {/* Floating Mini Sky-Dome Radar Overlay (천구 반구 위치 레이더) */}
        <div className="absolute top-2.5 right-2.5 bg-slate-950/85 border border-slate-800/90 rounded-2xl p-2 shadow-xl backdrop-blur-md pointer-events-none flex flex-col items-center">
          <div className="text-[9px] font-mono text-slate-400 mb-1 flex items-center gap-1">
            <Compass className="w-2.5 h-2.5 text-cyan-400" />
            <span>천구 돔 위치</span>
          </div>

          <div className="relative w-14 h-14 rounded-full border border-slate-700/80 bg-slate-900/90 flex items-center justify-center overflow-hidden">
            {/* Horizon & Meridian axes */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-slate-700/60" />
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-slate-700/60" />
            {/* Cardinal markers */}
            <span className="absolute top-0.5 text-[6.5px] font-mono text-slate-500">N</span>
            <span className="absolute bottom-0.5 text-[6.5px] font-mono text-slate-500">S</span>
            <span className="absolute right-0.5 text-[6.5px] font-mono text-slate-500">E</span>
            <span className="absolute left-0.5 text-[6.5px] font-mono text-slate-500">W</span>

            {/* Projected Constellation Position on Dome */}
            {(() => {
              const domePos = projectDomeRadar(
                topology.domeCoords.altDeg,
                topology.domeCoords.azDeg,
                28,
                28,
                24
              );
              return (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{ left: domePos.x, top: domePos.y }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full animate-ping absolute opacity-75"
                    style={{ backgroundColor: topology.color }}
                  />
                  <div
                    className="w-2 h-2 rounded-full border border-white shadow-[0_0_8px_currentColor]"
                    style={{ backgroundColor: topology.color, color: topology.color }}
                  />
                </div>
              );
            })()}
          </div>
          <span className="text-[8px] font-mono text-cyan-300 mt-1">
            Alt {topology.domeCoords.altDeg}°
          </span>
        </div>

        {/* Selected Star Quick Card Overlay */}
        {selectedStar && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:right-auto sm:max-w-xs bg-slate-950/90 border border-amber-400/50 rounded-xl p-2.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-auto">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{selectedStar.name}</span>
              </span>
              <span className="text-[10px] font-mono text-amber-300 font-semibold">
                {selectedStar.bayerName} · {selectedStar.distanceLy}
              </span>
            </div>
            <div className="text-[10px] text-slate-300 mt-1 leading-tight">
              {selectedStar.spectralType}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 italic">
              {selectedStar.description}
            </p>
          </div>
        )}
      </div>

      {/* Visual Position Emphasizer HUD Ribbon (천구 좌표계 상세 강조 정보) */}
      <div
        className={`p-3 border-t transition-all ${
          isCoordinateHighlighted
            ? 'bg-slate-900/90 border-sky-500/40 shadow-[inset_0_1px_15px_rgba(56,189,248,0.15)]'
            : 'bg-slate-950/60 border-slate-800/80'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>천구 위치 좌표계 (Celestial Sky Position)</span>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            Epoch {topology.coordinates.epoch}
          </span>
        </div>

        {/* 4-Way Celestial Coordinates Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <div className="text-[9px] font-mono text-slate-400">적경 (Right Ascension)</div>
            <div className="text-xs font-mono font-bold text-sky-400 mt-0.5">
              {topology.coordinates.rightAscension}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <div className="text-[9px] font-mono text-slate-400">적위 (Declination)</div>
            <div className="text-xs font-mono font-bold text-sky-400 mt-0.5">
              {topology.coordinates.declination}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <div className="text-[9px] font-mono text-slate-400">지평 방위 (Alt / Az)</div>
            <div className="text-xs font-mono font-bold text-amber-300 mt-0.5 truncate">
              {topology.coordinates.altitude} / {topology.coordinates.azimuth}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <div className="text-[9px] font-mono text-slate-400">천구 분면 & 남중</div>
            <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5 truncate">
              {topology.coordinates.skyQuadrant}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
