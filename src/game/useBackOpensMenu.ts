// Le bouton retour du téléphone (ou du navigateur) dans le village : il ouvre le menu du village, comme la pause d'un
// jeu, au lieu de quitter l'appli. Depuis ce menu, un second retour quitte (ou revient à la page d'avant).
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MARK = 'dysapps-village';
const marked = () => (window.history.state as Record<string, unknown> | null)?.[MARK] === true;

/**
 * Tant que `active` (le village sans panneau, `/adventure`) : une entrée d'historique de plus à la même adresse ; revenir
 * en arrière la quitte, et le menu (`menuPath`) la remplace. Un retour depuis le menu mène donc à la page d'avant.
 */
export function useBackOpensMenu(active: boolean, menuPath: string) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!active) return;
    if (!marked()) window.history.pushState({ ...(window.history.state ?? {}), [MARK]: true }, '', window.location.href);
    const onPop = () => {
      if (marked()) return;
      navigate(menuPath, { replace: true });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [active, menuPath, navigate]);
}
