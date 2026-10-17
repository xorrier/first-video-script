import React from 'react';
import { AbsoluteFill } from 'remotion';
import { window01 } from '../utils/animation';

/**
 * A sub-shot inside a scene. Later shots are drawn on top and fade in over the previous
 * one (which stays opaque), so give consecutive shots ~fadeIn frames of overlap.
 * Renders nothing when invisible. `children` receives the shot-local frame.
 */
export const Shot: React.FC<{ f: number; from: number; to: number; fadeIn?: number; fadeOut?: number; children: (lf: number, o: number) => React.ReactNode; z?: number }> = ({ f, from, to, fadeIn = 16, fadeOut = 0, children, z }) => {
  if (f < from - 1 || f > to + 1) return null;
  const o = window01(f, from, to, fadeIn, fadeOut);
  return <AbsoluteFill style={{ opacity: o, zIndex: z }}>{children(f - from, o)}</AbsoluteFill>;
};
