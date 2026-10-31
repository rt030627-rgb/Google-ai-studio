/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Keyboard, Zap, Sparkles, Sliders, Eye } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'flight' | 'celestial' | 'interface';
}

const SHORTCUTS: ShortcutItem[] = [
  // Flight & Diurnal Controls
  { keys: ['Space'], description: 'Toggle auto-cycle time flow / pause', category: 'flight' },
  { keys: ['X'], description: 'Toggle Steerable Glider Flight Mode (WASD / Arrows to steer)', category: 'flight' },
  { keys: ['T'], description: 'Toggle Arcade Stardust Ring challenge & scoring', category: 'flight' },
  { keys: ['1'], description: 'Jump to Dawn (Stratospheric Sunrise)', category: 'flight' },
  { keys: ['2'], description: 'Jump to Golden Hour / High Noon', category: 'flight' },
  { keys: ['3'], description: 'Jump to Twilight Aurora (Dusk)', category: 'flight' },
  { keys: ['4'], description: 'Jump to Cosmic Midnight (Deep Space)', category: 'flight' },

  // Celestial Encounters & Special Events
  { keys: ['D'], description: 'Unleash Celestial Dragon flyby & roar', category: 'celestial' },
  { keys: ['B'], description: 'Trigger Gargantua Black Hole Gravitational Singularity', category: 'celestial' },
  { keys: ['M'], description: 'Trigger Pixel Meteor Shower surge', category: 'celestial' },
  { keys: ['K'], description: 'Toggle Constellation Star-Chart & Lore Navigation', category: 'celestial' },
  { keys: ['G'], description: 'Summon OpenAI GPT Emerald Constellation', category: 'celestial' },
  { keys: ['C'], description: 'Summon Anthropic Claude Prominence', category: 'celestial' },
  { keys: ['S'], description: 'Summon DeepSeek Hydrodynamic Constellation', category: 'celestial' },

  // Interface & Camera Modes
  { keys: ['R'], description: 'Toggle In-Browser 60FPS Video Camcorder (WebM/MP4)', category: 'interface' },
  { keys: ['V'], description: 'Open Cinematic Viewpoints drawer', category: 'interface' },
  { keys: ['Z'], description: 'Toggle Cinematic Zen Mode (Hide HUD)', category: 'interface' },
  { keys: ['O'], description: 'Open Observatory Codex & Trajectory Chart', category: 'interface' },
  { keys: ['A'], description: 'Open Atmosphere & Cloud Physics Studio', category: 'interface' },
  { keys: ['P'], description: 'Capture 4x lossless pixel PNG snapshot', category: 'interface' },
  { keys: ['F'], description: 'Toggle Fullscreen Mode', category: 'interface' },
  { keys: [','], description: 'Open Flight System Preferences & Profile', category: 'interface' },
  { keys: ['?'], description: 'Toggle Keyboard Shortcuts Cheatsheet', category: 'interface' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const categories = [
    { id: 'flight', title: 'Flight & Time Controls', icon: Zap, color: 'text-amber-400' },
    { id: 'celestial', title: 'Celestial Events & Summons', icon: Sparkles, color: 'text-purple-400' },
    { id: 'interface', title: 'Camera & Studio Views', icon: Eye, color: 'text-sky-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{
          boxShadow: '0 0 50px rgba(56, 189, 248, 0.2), inset 0 0 20px rgba(15, 23, 42, 0.8)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-pixel font-bold tracking-wide text-slate-100 flex items-center gap-2">
                KEYBOARD COMMAND DECK
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/40 text-sky-300">
                  HOTKEYS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct keyboard shortcuts for instant cinematic control and celestial navigation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {categories.map((cat) => {
            const items = SHORTCUTS.filter((s) => s.category === cat.id);
            const IconComponent = cat.icon;

            return (
              <div key={cat.id} className="space-y-2.5">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
                  <IconComponent className={`w-4 h-4 ${cat.color}`} />
                  <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
                    {cat.title}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                    >
                      <span className="text-xs text-slate-300 font-sans pr-2">
                        {item.description}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((k) => (
                          <kbd
                            key={k}
                            className="px-2 py-1 text-[11px] font-pixel font-bold rounded bg-slate-800 border border-slate-600 text-sky-300 shadow-sm min-w-[28px] text-center"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-400 font-mono">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-400 font-bold">?</kbd> anywhere to toggle this guide</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
