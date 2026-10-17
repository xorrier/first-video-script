import React, { createContext, useContext } from 'react';
import { keys, smooth } from '../utils/animation';

export type Cam = { x: number; y: number; z: number; r?: number };
const CamCtx = createContext<Cam>({ x: 960, y: 540, z: 1 });

/** Interpolate camera keyframes: [frame, {x,y,z,r}] */
export function camAt(f: number, k: [number, Cam][], ease = smooth): Cam {
  return {
    x: keys(f, k.map(([fr, c]) => [fr, c.x]), ease),
    y: keys(f, k.map(([fr, c]) => [fr, c.y]), ease),
    z: keys(f, k.map(([fr, c]) => [fr, c.z]), ease),
    r: keys(f, k.map(([fr, c]) => [fr, c.r ?? 0]), ease),
  };
}

/** Provides a camera to all <Layer>s below it. Renders an SVG canvas of 1920×1080. */
export const Camera: React.FC<{ cam: Cam; children: React.ReactNode; bg?: string; defs?: React.ReactNode }> = ({ cam, children, bg, defs }) => (
  <CamCtx.Provider value={cam}>
    <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: 'absolute', inset: 0, background: bg }}>
      {defs ? <defs>{defs}</defs> : null}
      {children}
    </svg>
  </CamCtx.Provider>
);

/**
 * A parallax layer. depth 0 = fixed to screen (sky), 1 = moves with the camera,
 * >1 = foreground that moves faster than the camera.
 */
export const Layer: React.FC<{ depth: number; children: React.ReactNode; opacity?: number }> = ({ depth, children, opacity }) => {
  const c = useContext(CamCtx);
  const z = 1 + (c.z - 1) * depth;
  const cx = 960 + (c.x - 960) * depth;
  const cy = 540 + (c.y - 540) * depth;
  const rot = (c.r ?? 0) * depth;
  return (
    <g transform={`translate(960 540) rotate(${rot}) scale(${z}) translate(${-cx} ${-cy})`} opacity={opacity}>
      {children}
    </g>
  );
};

export const useCam = () => useContext(CamCtx);
