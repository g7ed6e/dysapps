import { useCallback, useEffect, useRef, useState } from 'react';
import { useSettings } from '../../core/SettingsContext';
import { stopSpeaking } from '../../core/speech';

/**
 * Lecture à voix haute segment par segment, avec l'index du segment en cours
 * (pour le surligner). `start(i, seul)` lit à partir de i, ou seulement i.
 */
export function useReadAloud(segments: string[]) {
  const { speak } = useSettings();
  const [current, setCurrent] = useState<number | null>(null);
  // Jeton de lecture : un arrêt ou une nouvelle lecture invalide les enchaînements en cours.
  const token = useRef(0);

  const stop = useCallback(() => {
    token.current += 1;
    stopSpeaking();
    setCurrent(null);
  }, []);

  const start = useCallback(
    (from = 0, only = false) => {
      const my = ++token.current;
      const play = (i: number) => {
        if (my !== token.current) return;
        if (i >= segments.length || (only && i > from)) {
          setCurrent(null);
          return;
        }
        setCurrent(i);
        speak(segments[i], () => play(i + 1));
      };
      play(from);
    },
    [segments, speak],
  );

  useEffect(() => stop, [stop]);

  return { current, playing: current !== null, start, stop };
}
