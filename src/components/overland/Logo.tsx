import React from 'react';

/**
 * The Overland lockup.
 *
 * The path is the one in `public/logo.svg` — the road as a drawn line, which is
 * the whole mark. It had been re-typed inline everywhere it appeared, with the
 * curve drifting slightly between copies; this is the single definition.
 *
 * `mark` renders the line alone, for tight spaces like a phone status bar.
 * `full` adds the wordmark, which is Archivo at the tracking the nav uses.
 */

const PATH =
  'M6 27 H30 C38 27 38 13 46 13 C54 13 54 23 62 23 C70 23 70 13 78 13 C86 13 86 27 94 27 H122';

type Props = {
  /** Height of the drawn line in px. The wordmark scales from it. */
  size?: number;
  variant?: 'full' | 'mark';
  /** Any CSS colour. Defaults to ink so it inherits correctly on light grounds. */
  color?: string;
  className?: string;
};

export default function Logo({
  size = 14,
  variant = 'full',
  color = '#111111',
  className,
}: Props) {
  // The artboard is 128x40; keep that ratio whatever height is asked for.
  const width = Math.round((size * 128) / 40);

  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <svg
        viewBox="0 0 128 40"
        width={width}
        height={size}
        role="img"
        aria-label={variant === 'mark' ? 'Overland' : undefined}
        aria-hidden={variant === 'full' ? true : undefined}
        style={{ overflow: 'visible', display: 'block' }}
      >
        <path
          d={PATH}
          fill="none"
          stroke={color}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {variant === 'full' && (
        <span
          style={{
            fontFamily: 'Archivo, sans-serif',
            fontWeight: 500,
            letterSpacing: '0.24em',
            fontSize: Math.round(size * 0.92),
            lineHeight: 1,
            color,
          }}
        >
          OVERLAND
        </span>
      )}
    </span>
  );
}
