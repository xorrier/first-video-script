import React from 'react';
import { Composition, Still } from 'remotion';
import { loadFonts } from './theme';
import { timeline } from './utils/timing';
import { Video } from './Video';
import { FontTest } from './FontTest';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition
      id="Documentary"
      component={Video}
      durationInFrames={timeline.durationInFrames}
      fps={timeline.fps}
      width={timeline.width}
      height={timeline.height}
      defaultProps={{ previewAudio: true }}
    />
    <Still id="FontTest" component={FontTest} width={1920} height={1080} />
  </>
);
