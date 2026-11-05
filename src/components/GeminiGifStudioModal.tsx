/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Download,
  Play,
  Pause,
  RefreshCw,
  Palette,
  Sliders,
  Check,
  FileCheck,
  Layers,
  Zap,
} from 'lucide-react';
import {
  GifAnimationMode,
  renderGeminiFrameRgba,
  generateGeminiAnimatedGif,
  downloadGifFile,
} from '../utils/geminiGifGenerator';
import { triggerStarSparkleChime } from '../utils/audioDescent';

interface GeminiGifStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PreGeneratedGifItem {
  id: string;
  name: string;
  badge: string;
  desc: string;
  path: string;
  filename: string;
  fileSize: string;
  duration: string;
  fps: number;
  mode: GifAnimationMode;
}

const PRE_GENERATED_GIFS: PreGeneratedGifItem[] = [
  {
    id: 'gemini-combined',
    name: 'Gemini 시그니처 복합 애니메이션',
    badge: '추천 (Recommended)',
    desc: '화이트 다이아몬드 코어 발광 + 4방향 레이저 플레어 깜빡임 + 360° 크로마틱 색상 순환',
    path: '/gemini_pixel_animated.gif',
    filename: 'gemini_pixel_animated.gif',
    fileSize: '37.2 KB',
    duration: '2.0초 (루프)',
    fps: 14,
    mode: 'combined',
  },
  {
    id: 'gemini-sparkle',
    name: 'Gemini 스타라이트 깜빡임 (Sparkle Blink)',
    badge: '깜빡임 특화',
    desc: '숨쉬는 펄스와 순간적인 4축 광원 플레어 스파이크, 은하 성진(Stardust)의 반짝임',
    path: '/gemini_pixel_sparkle.gif',
    filename: 'gemini_pixel_sparkle.gif',
    fileSize: '33.8 KB',
    duration: '2.0초 (루프)',
    fps: 12,
    mode: 'sparkle',
  },
  {
    id: 'gemini-color-cycle',
    name: 'Gemini 스펙트럼 색상 순환 (Color Shift)',
    badge: '색상 변경 특화',
    desc: '청록(Cyan) -> 코발트(Sky) -> 바이올렛(Purple) -> 마젠타(Pink)로 유려하게 순환하는 색상 그라데이션',
    path: '/gemini_pixel_color_cycle.gif',
    filename: 'gemini_pixel_color_cycle.gif',
    fileSize: '61.4 KB',
    duration: '2.5초 (루프)',
    fps: 12,
    mode: 'color-cycle',
  },
];

export const GeminiGifStudioModal: React.FC<GeminiGifStudioModalProps> = ({ isOpen, onClose }) => {
  // Studio generation settings
  const [mode, setMode] = useState<GifAnimationMode>('combined');
  const [resolution, setResolution] = useState<number>(128); // 64, 128, 256
  const [fps, setFps] = useState<number>(14); // 10, 14, 20
  const [durationSec, setDurationSec] = useState<number>(2.0); // 1.5, 2.0, 3.0
  const [showCompanionStar, setShowCompanionStar] = useState<boolean>(true);
  const [transparentBg, setTransparentBg] = useState<boolean>(false);

  // Live Canvas Preview State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Generation status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Active Tab: 'create' | 'gallery'
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');

  const totalFrames = Math.round(fps * durationSec);

  // Live animation loop on preview canvas
  useEffect(() => {
    if (!isOpen) return;

    let localFrame = 0;
    const intervalMs = 1000 / fps;

    const renderLoop = (timestamp: number) => {
      if (timestamp - lastFrameTimeRef.current >= intervalMs) {
        lastFrameTimeRef.current = timestamp;

        if (isPlaying) {
          localFrame = (localFrame + 1) % totalFrames;
          setCurrentFrame(localFrame);
        }

        const canvas = canvasRef.current;
        if (canvas) {
          const previewSize = 128;
          if (canvas.width !== previewSize) {
            canvas.width = previewSize;
            canvas.height = previewSize;
          }
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const rgba = renderGeminiFrameRgba(previewSize, previewSize, localFrame, totalFrames, {
              mode,
              showCompanionStar,
              transparentBg,
            });
            const imgData = ctx.createImageData(previewSize, previewSize);
            imgData.data.set(rgba);
            ctx.putImageData(imgData, 0, 0);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isOpen, isPlaying, mode, fps, durationSec, totalFrames, showCompanionStar, transparentBg]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Generate & Download customized GIF
  const handleGenerateAndDownload = useCallback(() => {
    setIsGenerating(true);
    setGenerationProgress(10);
    setDownloadSuccessMessage(null);

    // Yield to let UI update spinner
    setTimeout(() => {
      try {
        setGenerationProgress(45);
        const result = generateGeminiAnimatedGif({
          width: resolution,
          height: resolution,
          fps,
          durationSec,
          mode,
          showCompanionStar,
          transparentBg,
        });

        setGenerationProgress(90);

        const filename = `gemini_pixel_${mode}_${resolution}x${resolution}.gif`;
        downloadGifFile(result.gifBytes, filename);
        triggerStarSparkleChime();

        setGenerationProgress(100);
        const sizeKb = (result.gifBytes.length / 1024).toFixed(1);
        setDownloadSuccessMessage(`다운로드 완료! (${filename}, ${sizeKb} KB, ${result.frameCount} 프레임)`);

        setTimeout(() => {
          setIsGenerating(false);
          setGenerationProgress(0);
        }, 1200);
      } catch (err) {
        console.error('Failed to generate GIF:', err);
        setIsGenerating(false);
        setGenerationProgress(0);
      }
    }, 80);
  }, [resolution, fps, durationSec, mode, showCompanionStar, transparentBg]);

  // Handle direct download of pre-generated GIF files
  const handleDirectDownload = (item: PreGeneratedGifItem) => {
    const a = document.createElement('a');
    a.href = item.path;
    a.download = item.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerStarSparkleChime();
    setDownloadSuccessMessage(`'${item.filename}' 파일이 즉시 다운로드되었습니다.`);
    setTimeout(() => setDownloadSuccessMessage(null), 3500);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gemini-gif-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-pink-500/20 border border-cyan-500/30 text-cyan-300">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="gemini-gif-modal-title" className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Google Gemini 픽셀 아트 GIF 스튜디오
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-pixel tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  GIF89a
                </span>
              </div>
              <p className="text-xs text-slate-400">
                정밀한 4포인트 성좌 슈퍼엘립스 곡률 & 시그니처 크로마틱 애니메이션 GIF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'create'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                커스텀 생성
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'gallery'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                저장된 GIF 갤러리 (3종)
              </button>
            </div>

            <button
              onClick={onClose}
              aria-label="닫기"
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white transition-all ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success toast notification */}
        <AnimatePresence>
          {downloadSuccessMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-500/20 border-b border-emerald-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-300 overflow-hidden"
            >
              <div className="flex items-center gap-2 font-medium">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{downloadSuccessMessage}</span>
              </div>
              <button
                onClick={() => setDownloadSuccessMessage(null)}
                className="text-emerald-400 hover:text-white text-[11px]"
              >
                닫기
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeTab === 'create' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Interactive Live Preview (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-inner">
                <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    실시간 픽셀 프리뷰
                  </span>
                  <span className="font-pixel text-[11px] text-cyan-400">
                    프레임: {currentFrame + 1} / {totalFrames}
                  </span>
                </div>

                {/* Pixel Canvas Render Box */}
                <div
                  className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl border-2 border-slate-700/60 overflow-hidden flex items-center justify-center shadow-2xl transition-all"
                  style={{
                    backgroundColor: transparentBg ? '#020617' : '#030712',
                    backgroundImage: transparentBg
                      ? 'linear-gradient(45deg, #090d1a 25%, transparent 25%), linear-gradient(-45deg, #090d1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #090d1a 75%), linear-gradient(-45deg, transparent 75%, #090d1a 75%)'
                      : 'none',
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain"
                    style={{
                      imageRendering: 'pixelated',
                    }}
                  />

                  {/* Corner pixel frame decoration */}
                  <div className="absolute top-2 left-2 text-[9px] font-pixel text-slate-500 uppercase tracking-wider">
                    {resolution}x{resolution} PX
                  </div>
                  <div className="absolute bottom-2 right-2 text-[9px] font-pixel text-slate-500 uppercase tracking-wider">
                    {fps} FPS
                  </div>
                </div>

                {/* Preview controls */}
                <div className="w-full flex items-center justify-between mt-4 px-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-all"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? '일시 정지' : '재생'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">루프:</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-pixel text-cyan-300">
                      {durationSec.toFixed(1)}s
                    </span>
                  </div>
                </div>

                {/* Color Spectrum Indicator */}
                <div className="w-full mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Palette className="w-3 h-3 text-pink-400" />
                    시그니처 팔레트
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#ffffff] ring-1 ring-white/40" title="Core White" />
                    <span className="w-3 h-3 rounded-full bg-[#38bdf8]" title="Cyan (#38bdf8)" />
                    <span className="w-3 h-3 rounded-full bg-[#0ea5e9]" title="Sky Blue (#0ea5e9)" />
                    <span className="w-3 h-3 rounded-full bg-[#818cf8]" title="Indigo (#818cf8)" />
                    <span className="w-3 h-3 rounded-full bg-[#a855f7]" title="Purple (#a855f7)" />
                    <span className="w-3 h-3 rounded-full bg-[#ec4899]" title="Pink (#ec4899)" />
                  </div>
                </div>
              </div>

              {/* Right Column: Customization Controls & Action (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Animation Mode Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    애니메이션 모드 선택
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      {
                        id: 'combined' as GifAnimationMode,
                        name: '시그니처 복합 (Combined)',
                        desc: '광원 깜빡임 플레어 + 360° 크로마틱 색상 순환',
                        color: 'from-cyan-500/20 to-pink-500/20 border-cyan-500/40',
                      },
                      {
                        id: 'sparkle' as GifAnimationMode,
                        name: '반짝임 깜빡임 (Sparkle Blink)',
                        desc: '화이트 코어 펄스와 십자형 레이저 광선 스파이크',
                        color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40',
                      },
                      {
                        id: 'color-cycle' as GifAnimationMode,
                        name: '색상 순환 (Color Cycle)',
                        desc: 'Gemini 6색 브랜드 스펙트럼의 부드러운 회전',
                        color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/40',
                      },
                      {
                        id: 'glacial-frost' as GifAnimationMode,
                        name: '서리빛 글레이셜 (Frost Aurora)',
                        desc: '오로라 시안 및 딥 블루의 극광 펄스',
                        color: 'from-sky-500/20 to-teal-500/20 border-sky-500/40',
                      },
                    ].map((m) => {
                      const isSelected = mode === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setMode(m.id)}
                          className={`p-3 rounded-2xl text-left border transition-all ${
                            isSelected
                              ? `bg-gradient-to-br ${m.color} ring-1 ring-cyan-400 text-white shadow-lg`
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold text-xs mb-1">
                            <span>{m.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-300" />}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{m.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Resolution & FPS Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Resolution Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      해상도 (크기)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      {[
                        { size: 64, label: '64px', sub: '경량 픽셀' },
                        { size: 128, label: '128px', sub: '표준 HD' },
                        { size: 256, label: '256px', sub: '고화질' },
                      ].map((item) => (
                        <button
                          key={item.size}
                          onClick={() => setResolution(item.size)}
                          className={`py-1.5 rounded-lg text-xs font-medium transition-all text-center ${
                            resolution === item.size
                              ? 'bg-cyan-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <div>{item.label}</div>
                          <div className="text-[9px] opacity-75">{item.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FPS Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      프레임 레이트 (FPS)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      {[
                        { val: 10, label: '10 FPS', sub: '레트로' },
                        { val: 14, label: '14 FPS', sub: '균형' },
                        { val: 20, label: '20 FPS', sub: '부드러움' },
                      ].map((item) => (
                        <button
                          key={item.val}
                          onClick={() => setFps(item.val)}
                          className={`py-1.5 rounded-lg text-xs font-medium transition-all text-center ${
                            fps === item.val
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <div>{item.label}</div>
                          <div className="text-[9px] opacity-75">{item.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Duration & Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Duration Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">루프 지속 시간</label>
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      {[1.5, 2.0, 3.0].map((dur) => (
                        <button
                          key={dur}
                          onClick={() => setDurationSec(dur)}
                          className={`py-1.5 rounded-lg text-xs font-medium transition-all text-center ${
                            durationSec === dur
                              ? 'bg-purple-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {dur.toFixed(1)}초
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feature Toggles */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">추가 시각 효과</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCompanionStar(!showCompanionStar)}
                        className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                          showCompanionStar
                            ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span>동반 위성별</span>
                        <div
                          className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border ${
                            showCompanionStar
                              ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                              : 'border-slate-700'
                          }`}
                        >
                          {showCompanionStar && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>

                      <button
                        onClick={() => setTransparentBg(!transparentBg)}
                        className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                          transparentBg
                            ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400'
                        }`}
                        title="GIF 배경을 투명하게 저장"
                      >
                        <span>투명 배경</span>
                        <div
                          className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border ${
                            transparentBg
                              ? 'bg-purple-500 border-purple-400 text-slate-950'
                              : 'border-slate-700'
                          }`}
                        >
                          {transparentBg && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Generate & Download Action Button */}
                <div className="pt-2">
                  <button
                    onClick={handleGenerateAndDownload}
                    disabled={isGenerating}
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-pink-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-pink-500 active:scale-[0.99] text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2.5 transition-all disabled:opacity-70 disabled:pointer-events-none"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>GIF 인코딩 중... ({generationProgress}%)</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>
                          {resolution}x{resolution} GIF 애니메이션 생성 및 저장
                        </span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    순수 픽셀 래스터라이저와 GIF89a 인코더를 통해 무손실 압축된 .gif 파일로 즉시 저장됩니다.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Gallery Tab: 3 Pre-rendered Saved GIF Files */
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                디스크에 미리 렌더링되어 저장된 고품질 Google Gemini 픽셀 GIF 파일입니다. 원클릭으로 즉시 다운로드하거나 사용할 수 있습니다.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PRE_GENERATED_GIFS.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg group"
                  >
                    <div>
                      {/* GIF Real Image Preview */}
                      <div className="relative aspect-square w-full rounded-xl bg-slate-900 border border-slate-800/80 overflow-hidden flex items-center justify-center mb-3">
                        <img
                          src={item.path}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-pixel bg-slate-950/80 text-cyan-300 border border-cyan-500/30">
                          {item.badge}
                        </div>
                      </div>

                      <h3 className="text-xs font-bold text-white mb-1">{item.name}</h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{item.desc}</p>

                      <div className="grid grid-cols-2 gap-1.5 py-2 px-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-400 mb-3">
                        <div>
                          용량: <span className="text-slate-200 font-pixel">{item.fileSize}</span>
                        </div>
                        <div>
                          길이: <span className="text-slate-200">{item.duration}</span>
                        </div>
                        <div>
                          규격: <span className="text-slate-200">128x128 px</span>
                        </div>
                        <div>
                          FPS: <span className="text-slate-200">{item.fps} FPS</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDirectDownload(item)}
                      className="w-full py-2.5 px-3 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{item.filename} 다운로드</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Google Gemini 로고 슈퍼엘립스 곡률 & 4포인트 대칭 보정 완료</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-500">/gemini_pixel_animated.gif</span>
            <button
              onClick={onClose}
              className="text-xs text-slate-300 hover:text-white font-medium"
            >
              닫기
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
