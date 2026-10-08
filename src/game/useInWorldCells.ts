// Les positions que reçoit une vue en grille (des ancrages : une île et un point dans son repère, étape J5), passées en
// cases du monde, où la 3D dessine. Chaque champ garde son identité tant que le sien ne change pas : les
// effets des vues en dépendent (poser les bornes, faire marcher le bonhomme, faire jaillir les éclats).
import { useMemo } from 'react';
import { dispositionEnGrille } from './world/grid';
import { estUnOuvrage, type EnCasesDuMonde, type WorldViewProps } from './world/view';
import { getBridge, otherEnd } from './world/archipelago';
import { casesDesTirets } from './world/suggestedTrace';

/** Sans liaison posée : une seule liste vide, pour que la mémoire des tracés ne change pas à chaque rendu. */
const SANS_LIAISON: string[] = [];

export function useEnCasesDuMonde({
  archipelago,
  focus,
  marker = null,
  avatar,
  trail,
  quests,
  burst,
  bridges = SANS_LIAISON,
}: Pick<WorldViewProps, 'archipelago' | 'focus' | 'marker' | 'avatar' | 'trail' | 'quests' | 'burst' | 'bridges'>): EnCasesDuMonde {
  const disposition = useMemo(() => dispositionEnGrille(archipelago), [archipelago]);
  // Le tracé d'un ouvrage suit les liaisons posées de la partie (GD-9) : la flèche se pose sur le même fantôme que le monde.
  const cle = bridges.join(',');
  const tracee = useMemo(
    () => dispositionEnGrille(archipelago, bridges),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [archipelago, cle],
  );
  const enMonde = disposition.versMonde;
  return {
    focus: useMemo(() => {
      const { spot, ...f } = focus;
      return spot ? { ...f, spot: enMonde(spot) } : f;
    }, [focus, enMonde]),
    // Un ouvrage : sa place sur la liaison, côté île de départ, et celles où elle glisse ; le tracé de toute la liaison
    // et ses tirets ; l'île d'en face (sans case, pas de flèche).
    marker: useMemo(() => {
      if (marker === null || typeof marker === 'string') return marker;
      if (!estUnOuvrage(marker)) return enMonde(marker);
      const places = tracee.placesDeLaFleche(marker.ouvrage, marker.depuis);
      if (!places.length) return null;
      const def = getBridge(marker.ouvrage);
      // De l'île de départ à la rive d'arrivée (la dernière case, toujours dessinée).
      const liaison = tracee.liaison(marker.ouvrage);
      const trace = def && marker.depuis === def.to ? [...liaison].reverse() : liaison;
      const arrivee = def ? otherEnd(def, marker.depuis ?? def.from) : undefined;
      return { ...marker, cell: places[0], places, trace, tirets: casesDesTirets(trace), ...(arrivee ? { arrivee } : {}) };
    }, [marker, enMonde, tracee]),
    avatar: useMemo(() => avatar && { ...avatar, route: avatar.route.map(enMonde) }, [avatar, enMonde]),
    trail: useMemo(() => trail?.map(enMonde), [trail, enMonde]),
    quests: useMemo(() => quests?.map(({ place, ...q }) => ({ ...q, cell: enMonde(place) })), [quests, enMonde]),
    burst: useMemo(() => burst && { ...burst, cell: enMonde(burst.cell) }, [burst, enMonde]),
  };
}
