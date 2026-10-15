// L'application se joue en paysage, au téléphone comme sur la tablette (mot du mainteneur, 10 octobre 2026, « 3a ») : tenu
// en portrait, un appareil tactile ne montre que cet écran, une icône et trois mots, lus avec « Écouter ». Le manifeste
// demande déjà le paysage (vite.config.ts), mais Safari, sur iPhone et iPad, ne suit pas cette demande et ne laisse pas
// une page bloquer la rotation : l'écran le dit donc lui-même. Un ordinateur (souris, pas d'écran tactile) n'est jamais
// bloqué, même dans une fenêtre plus haute que large.
import { useSyncExternalStore } from 'react';
import { Icon } from './Icon';
import { SpeakButton } from './SpeakButton';

/** Un appareil tactile tenu en portrait. */
export const PORTRAIT_TACTILE = '(orientation: portrait) and (hover: none) and (pointer: coarse)';

const PHRASE = 'Tourne ton appareil.';

function abonner(suivre: () => void) {
  const m = typeof window !== 'undefined' ? window.matchMedia?.(PORTRAIT_TACTILE) : undefined;
  m?.addEventListener?.('change', suivre);
  return () => m?.removeEventListener?.('change', suivre);
}
const enPortrait = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.(PORTRAIT_TACTILE).matches);

/** L'appareil est-il tenu en portrait ? Suivi quand on le tourne. Sans `matchMedia` (les tests) : non. */
export function usePortrait(): boolean {
  return useSyncExternalStore(abonner, enPortrait, () => false);
}

export function RotateDevice() {
  return (
    <div className="rotate-device" role="alert">
      <span className="rotate-device-icon" aria-hidden="true">
        <Icon name="appareil" size="5rem" />
      </span>
      <p className="rotate-device-text">
        {PHRASE} <SpeakButton text={PHRASE} compact />
      </p>
    </div>
  );
}
