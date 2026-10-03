// Les positions que reçoit une vue en grille (des ancrages : une île et un point dans son repère, étape J5), passées en
// cases du monde, où la 3D et la 2D dessinent. Chaque champ garde son identité tant que le sien ne change pas : les
// effets des vues en dépendent (poser les bornes, faire marcher le bonhomme, faire jaillir les éclats).
import { useMemo } from 'react';
import { dispositionEnGrille } from './world/grille';
import { estUnOuvrage, type EnCasesDuMonde, type WorldViewProps } from './world/view';

export function useEnCasesDuMonde({
  archipelago,
  focus,
  marker = null,
  avatar,
  trail,
  quests,
  burst,
}: Pick<WorldViewProps, 'archipelago' | 'focus' | 'marker' | 'avatar' | 'trail' | 'quests' | 'burst'>): EnCasesDuMonde {
  const disposition = useMemo(() => dispositionEnGrille(archipelago), [archipelago]);
  const enMonde = disposition.versMonde;
  return {
    focus: useMemo(() => {
      const { spot, ...f } = focus;
      return spot ? { ...f, spot: enMonde(spot) } : f;
    }, [focus, enMonde]),
    // Un ouvrage : sa place sur la liaison, côté île de départ, et celles où elle glisse ; le tracé de toute la liaison
    // (sans case, pas de flèche).
    marker: useMemo(() => {
      if (marker === null || typeof marker === 'string') return marker;
      if (!estUnOuvrage(marker)) return enMonde(marker);
      const places = disposition.placesDeLaFleche(marker.ouvrage, marker.depuis);
      return places.length ? { ...marker, cell: places[0], places, trace: disposition.liaison(marker.ouvrage) } : null;
    }, [marker, enMonde, disposition]),
    avatar: useMemo(() => avatar && { ...avatar, route: avatar.route.map(enMonde) }, [avatar, enMonde]),
    trail: useMemo(() => trail?.map(enMonde), [trail, enMonde]),
    quests: useMemo(() => quests?.map(({ place, ...q }) => ({ ...q, cell: enMonde(place) })), [quests, enMonde]),
    burst: useMemo(() => burst && { ...burst, cell: enMonde(burst.cell) }, [burst, enMonde]),
  };
}
