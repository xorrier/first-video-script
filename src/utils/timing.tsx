import React, { createContext, useContext } from 'react';
import { useCurrentFrame } from 'remotion';
import timeline from '../data/timeline.json';

export type TLScene = (typeof timeline.scenes)[number];
export type TLLine = (typeof timeline.lines)[number];

export const FPS = timeline.fps;
export const OVERLAP = 20; // frames scenes overlap for transitions

export const SceneCtx = createContext<{ scene: TLScene; lead: number }>({ scene: timeline.scenes[0], lead: 0 });

/** Frame relative to the scene's nominal start (negative during an incoming transition). */
export const useSceneFrame = () => {
  const { lead } = useContext(SceneCtx);
  return useCurrentFrame() - lead;
};

export const useSceneDuration = () => {
  const { scene } = useContext(SceneCtx);
  return scene.durationInFrames;
};

/** Start/end frame of a narration line relative to its scene. */
export const useLine = (id: string) => {
  const { scene } = useContext(SceneCtx);
  const l = timeline.lines.find((x) => x.id === id);
  if (!l) throw new Error(`unknown line ${id}`);
  return {
    s: Math.round((l.start - scene.start) * FPS),
    e: Math.round((l.end - scene.start) * FPS),
  };
};

export const useLines = (...ids: string[]) => ids.map((id) => useLine(id));

export const SceneProvider: React.FC<{ scene: TLScene; lead: number; children: React.ReactNode }> = ({ scene, lead, children }) => (
  <SceneCtx.Provider value={{ scene, lead }}>{children}</SceneCtx.Provider>
);

export { timeline };
