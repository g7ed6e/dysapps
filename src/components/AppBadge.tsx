import { useEffect } from 'react';
import { useBlocland } from '../blocland/BloclandContext';
import { questsToReview } from '../blocland/review';
import { useSettings } from '../core/SettingsContext';

type BadgeNavigator = Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };

/**
 * La pastille sur l'icône de l'appli installée : un simple point (pas de nombre, pas de notification) quand des
 * révisions attendent aujourd'hui. Seuls certains systèmes l'affichent (Android, ordinateur, iPhone et iPad récents
 * avec l'appli installée) ; ailleurs, rien ne se passe. Désactivable dans les Réglages.
 */
export function AppBadge() {
  const { state } = useBlocland();
  const { settings } = useSettings();
  const due = questsToReview(state.spaced, state.world.links).length > 0;
  const on = settings.appBadge && due;
  useEffect(() => {
    const nav = (typeof navigator !== 'undefined' ? navigator : undefined) as BadgeNavigator | undefined;
    if (!nav?.setAppBadge || !nav.clearAppBadge) return;
    (on ? nav.setAppBadge() : nav.clearAppBadge()).catch(() => {
      // Pastille refusée (appli non installée, permission) : sans conséquence.
    });
  }, [on]);
  return null;
}
