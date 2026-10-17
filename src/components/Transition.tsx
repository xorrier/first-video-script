import React from 'react';
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from 'remotion';
import { OVERLAP, SceneProvider, TLScene } from '../utils/timing';
import { easeOut, prog, smooth } from '../utils/animation';

export type TransitionKind = 'fade' | 'dip' | 'zoom' | 'wipe' | 'iris';

/**
 * Places a scene on the global timeline. Incoming scenes overlap the previous one by
 * OVERLAP frames and animate in with the chosen transition.
 */
export const SceneSlot: React.FC<{
  scene: TLScene;
  index: number;
  isLast: boolean;
  transition: TransitionKind;
  children: React.ReactNode;
}> = ({ scene, index, isLast, transition, children }) => {
  const lead = index === 0 ? 0 : OVERLAP;
  const from = scene.from - lead;
  const dur = scene.durationInFrames + lead + (isLast ? 0 : OVERLAP);
  return (
    <Sequence from={from} durationInFrames={dur} name={scene.id}>
      <SceneProvider scene={scene} lead={lead}>
        <TransitionIn kind={index === 0 ? 'none' : transition} len={lead}>
          {children}
        </TransitionIn>
      </SceneProvider>
    </Sequence>
  );
};

const TransitionIn: React.FC<{ kind: TransitionKind | 'none'; len: number; children: React.ReactNode }> = ({ kind, len, children }) => {
  const f = useCurrentFrame();
  if (kind === 'none' || f >= len) return <AbsoluteFill>{children}</AbsoluteFill>;
  const p = prog(f, 0, len, smooth);
  switch (kind) {
    case 'fade':
      return <AbsoluteFill style={{ opacity: p }}>{children}</AbsoluteFill>;
    case 'dip': {
      // outgoing scene darkens (overlay), then the new scene rises from black
      const dark = interpolate(p, [0, 0.5, 1], [0, 1, 0]);
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: '#0d0907', opacity: Math.min(1, dark * 1.2) }} />
          <AbsoluteFill style={{ opacity: p > 0.5 ? (p - 0.5) * 2 : 0 }}>{children}</AbsoluteFill>
        </AbsoluteFill>
      );
    }
    case 'zoom': {
      const s = interpolate(prog(f, 0, len, easeOut), [0, 1], [1.12, 1]);
      return <AbsoluteFill style={{ opacity: p, transform: `scale(${s})` }}>{children}</AbsoluteFill>;
    }
    case 'wipe': {
      const pos = interpolate(p, [0, 1], [-30, 130]);
      const mask = `linear-gradient(100deg, black ${pos - 25}%, transparent ${pos}%)`;
      return <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask }}>{children}</AbsoluteFill>;
    }
    case 'iris': {
      const r = interpolate(p, [0, 1], [0, 120]);
      const mask = `radial-gradient(circle at 50% 50%, black ${r - 12}%, transparent ${r}%)`;
      return <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask }}>{children}</AbsoluteFill>;
    }
  }
};
