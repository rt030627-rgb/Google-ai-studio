/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Crisp, high-fidelity pixel art SVG sprites for Gemini, GPT, Claude, and DeepSeek.
// Encoded as inline SVG data URIs for 100% reliable, zero-latency rendering across canvas and UI.

export const AI_SPRITE_SVGS = {
  gemini: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges" width="32" height="32">
    <defs>
      <linearGradient id="geminiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38BDF8"/>
        <stop offset="40%" stop-color="#818CF8"/>
        <stop offset="75%" stop-color="#C084FC"/>
        <stop offset="100%" stop-color="#F472B6"/>
      </linearGradient>
    </defs>
    <!-- 4-pointed Gemini Superellipse Star in crisp pixel blocks -->
    <rect x="15" y="1" width="2" height="30" fill="url(#geminiGrad)" />
    <rect x="1" y="15" width="30" height="2" fill="url(#geminiGrad)" />
    <rect x="14" y="4" width="4" height="24" fill="url(#geminiGrad)" />
    <rect x="4" y="14" width="24" height="4" fill="url(#geminiGrad)" />
    <rect x="13" y="7" width="6" height="18" fill="url(#geminiGrad)" />
    <rect x="7" y="13" width="18" height="6" fill="url(#geminiGrad)" />
    <rect x="12" y="10" width="8" height="12" fill="url(#geminiGrad)" />
    <rect x="10" y="12" width="12" height="8" fill="url(#geminiGrad)" />
    <rect x="11" y="11" width="10" height="10" fill="url(#geminiGrad)" />
    <!-- Radiant white diamond core -->
    <rect x="14" y="13" width="4" height="6" fill="#FFFFFF" />
    <rect x="13" y="14" width="6" height="4" fill="#FFFFFF" />
    <rect x="15" y="14" width="2" height="4" fill="#E0F2FE" />
  </svg>`,

  gpt: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges" width="32" height="32">
    <!-- Authentic OpenAI Sage-Teal Pixel Rosette Badge -->
    <rect x="2" y="2" width="28" height="28" rx="7" fill="#72A99A" stroke="#264D44" stroke-width="2" />
    <!-- White Interlocking Knot Lines -->
    <path d="M12 5h8v2h-8zM20 7h4v2h-4zM24 9h2v4h-2zM22 13h4v2h-4zM20 15h4v2h-4zM18 17h2v6h-2zM12 25h8v2h-8zM8 23h4v2H8zM6 19h2v4H6zM6 15h4v2H6zM8 13h4v2H8zM12 9h2V5h-2z" fill="#FFFFFF"/>
    <path d="M14 11h4v2h-4zM18 13h2v4h-2zM14 17h4v2h-4zM12 15h2v2h-2zM12 13h2v2h-2z" fill="#E2F4EE"/>
    <rect x="14" y="14" width="4" height="4" fill="#72A99A"/>
  </svg>`,

  claude: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges" width="32" height="32">
    <!-- Authentic Anthropic Claude Terracotta Sunburst Badge -->
    <rect x="2" y="2" width="28" height="28" rx="7" fill="#D16B52" stroke="#732A1C" stroke-width="2" />
    <!-- Central White Sunburst Hub & Radiating Rays -->
    <rect x="14" y="14" width="4" height="4" fill="#FFFFFF" />
    <path d="M15 4h2v10h-2zM15 18h2v10h-2zM4 15h10v2H4zM18 15h10v2H18z" fill="#FFFFFF" />
    <!-- Diagonal Coronal Rays -->
    <path d="M8 8h3v3H8zM7 11h3v2H7zM11 7h2v3h-2z" fill="#FFFFFF" />
    <path d="M21 8h3v3h-3zM22 11h3v2h-3zM19 7h2v3h-2z" fill="#FFFFFF" />
    <path d="M8 21h3v3H8zM7 19h3v2H7zM11 22h2v3h-2z" fill="#FFFFFF" />
    <path d="M21 21h3v3h-3zM22 19h3v2h-3zM19 22h2v3h-2z" fill="#FFFFFF" />
    <path d="M12 12h8v8h-8z" fill="#FFFFFF" opacity="0.95" />
    <!-- Shaded Soft Cream Accents -->
    <rect x="14" y="13" width="4" height="1" fill="#FFF2EB" />
    <rect x="13" y="14" width="1" height="4" fill="#FFF2EB" />
  </svg>`,

  deepseek: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges" width="32" height="32">
    <!-- Authentic DeepSeek Blue Pixel Whale (head on left, tail flukes up on right) -->
    <!-- Tail Flukes (right) -->
    <rect x="21" y="2" width="2" height="5" fill="#16205A" />
    <rect x="23" y="1" width="4" height="3" fill="#446CFF" />
    <rect x="27" y="2" width="2" height="5" fill="#16205A" />
    <rect x="23" y="4" width="4" height="4" fill="#446CFF" />
    <rect x="21" y="7" width="5" height="4" fill="#446CFF" />
    <!-- Dorsal Fin (top) -->
    <rect x="13" y="4" width="6" height="3" fill="#16205A" />
    <rect x="14" y="5" width="4" height="3" fill="#446CFF" />
    <!-- Main Body & Head (left) -->
    <rect x="4" y="7" width="18" height="15" rx="5" fill="#446CFF" stroke="#16205A" stroke-width="1.5" />
    <rect x="2" y="10" width="8" height="10" rx="3" fill="#446CFF" />
    <!-- White Belly Patch (front-underbelly on left) -->
    <path d="M4 12h8v7H4zM6 10h4v2H6zM4 19h12v3H4z" fill="#FFFFFF" />
    <!-- Flipper Fin (bottom) -->
    <rect x="18" y="21" width="4" height="4" rx="1" fill="#16205A" />
    <rect x="19" y="22" width="3" height="2" fill="#446CFF" />
    <!-- Whale Eye (left) -->
    <rect x="6" y="11" width="3" height="3" fill="#FFFFFF" />
    <rect x="7" y="12" width="1" height="1" fill="#16205A" />
  </svg>`,
};

export const AI_SPRITE_PATHS: Record<'gemini' | 'gpt' | 'claude' | 'deepseek', string> = {
  gemini: '/gemini_pixel_animated.gif',
  gpt: '/assets/aistudio/chatgpt-logo-20261026-213226.png',
  claude: '/assets/aistudio/claude-logo-20261026-213714-preview.png',
  deepseek: '/assets/aistudio/deepseek-whale-20261026-191209-preview.png',
};

export const AI_SPRITE_DATA_URIS: Record<'gemini' | 'gpt' | 'claude' | 'deepseek', string> = {
  gemini: `data:image/svg+xml;utf8,${encodeURIComponent(AI_SPRITE_SVGS.gemini)}`,
  gpt: `data:image/svg+xml;utf8,${encodeURIComponent(AI_SPRITE_SVGS.gpt)}`,
  claude: `data:image/svg+xml;utf8,${encodeURIComponent(AI_SPRITE_SVGS.claude)}`,
  deepseek: `data:image/svg+xml;utf8,${encodeURIComponent(AI_SPRITE_SVGS.deepseek)}`,
};
