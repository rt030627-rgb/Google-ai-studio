/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AI_SPRITE_DATA_URIS } from '../utils/aiSpritesData';

interface AIAvatarIconProps {
  type: 'gemini' | 'gpt' | 'claude' | 'deepseek';
  size?: number | string;
  className?: string;
  alt?: string;
}

export const AIAvatarIcon: React.FC<AIAvatarIconProps> = ({
  type,
  size = 16,
  className = '',
  alt,
}) => {
  const src = AI_SPRITE_DATA_URIS[type] || AI_SPRITE_DATA_URIS.gemini;
  const label = alt || `${type.toUpperCase()} Constellation`;

  return (
    <img
      src={src}
      alt={label}
      width={typeof size === 'number' ? size : undefined}
      height={typeof size === 'number' ? size : undefined}
      className={`shrink-0 select-none ${className}`}
      style={{
        imageRendering: 'pixelated',
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
      }}
      draggable={false}
    />
  );
};
