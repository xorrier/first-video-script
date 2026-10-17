import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { FilmLook } from './components/Overlay';
import { Subtitles } from './components/Subtitle';
import { SceneSlot, TransitionKind } from './components/Transition';
import { timeline } from './utils/timing';
import { Hook } from './scenes/Hook';
import { HistoricalContext } from './scenes/HistoricalContext';
import { CityLife } from './scenes/CityLife';
import { Transformation } from './scenes/Transformation';
import { Mystery } from './scenes/Mystery';
import { Conclusion } from './scenes/Conclusion';
import { EndScreen } from './scenes/EndScreen';

const SCENES: Record<string, { C: React.FC; transition: TransitionKind }> = {
  hook: { C: Hook, transition: 'fade' },
  context: { C: HistoricalContext, transition: 'dip' },
  city: { C: CityLife, transition: 'zoom' },
  change: { C: Transformation, transition: 'wipe' },
  mystery: { C: Mystery, transition: 'dip' },
  conclusion: { C: Conclusion, transition: 'fade' },
  end: { C: EndScreen, transition: 'fade' },
};

/**
 * The full documentary. Audio stems are attached here for Studio preview only;
 * the final mix is done by FFmpeg in scripts/render-video.ts (render runs muted).
 */
export const Video: React.FC<{ previewAudio?: boolean }> = ({ previewAudio = true }) => (
  <AbsoluteFill style={{ background: '#0d0907' }}>
    {timeline.scenes.map((scene, i) => {
      const s = SCENES[scene.id];
      if (!s) throw new Error(`No component for scene "${scene.id}"`);
      return (
        <SceneSlot key={scene.id} scene={scene} index={i} isLast={i === timeline.scenes.length - 1} transition={s.transition}>
          <s.C />
        </SceneSlot>
      );
    })}
    <FilmLook />
    <Subtitles />
    {previewAudio ? (
      <>
        {timeline.hasNarration ? <Audio src={staticFile('audio/narration.wav')} /> : null}
        <Audio src={staticFile('audio/music.wav')} volume={0.22} />
        <Audio src={staticFile('audio/sfx.wav')} volume={0.4} />
      </>
    ) : null}
  </AbsoluteFill>
);
