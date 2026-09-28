import { useSyncExternalStore } from 'react';
import { ecouterVoix, hasVoice, type Lang } from './speech';

/**
 * L'appareil a-t-il une voix pour cette langue ? Se met à jour quand la liste des voix arrive, après coup sur Chrome et
 * Android : `undefined` tant qu'elle n'est pas là, pour ne dire « pas de voix » qu'à coup sûr.
 */
export function useVoixDisponible(lang: Lang | null): boolean | undefined {
  return useSyncExternalStore(ecouterVoix, () => (lang ? hasVoice(lang) : undefined), () => undefined);
}
