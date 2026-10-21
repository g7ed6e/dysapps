// Le retour devant un lieu du monde continu (GD-20, point 8) : l'adresse `?lieu=<lieu>&mission=<mission>` qui dépose Kéo
// devant le lieu et ouvre sa liste, et le garde-fou d'une pose qui ne dirait jamais sa fin. Sortis de la page pour être
// testés sans la scène 3D.
import { useEffect, useRef } from 'react';
import { getIle } from '../../biomes';
import { POSE_GUARD_SECONDS } from '../../world/continu/construction';
import { placeById, type PlaceId } from '../../world/continu/levelPlan';

interface PlaceAddress {
  /** Le lieu de l'adresse, déjà borné (`placeFromParam`). */
  place: PlaceId | null;
  mission: string | null;
  /**
   * La clé de la navigation (`location.key`) : une nouvelle navigation vers la même adresse (« Ma dernière mission »
   * après avoir fermé la liste) rouvre la liste ; un rendu de plus, non.
   */
  navigation: string;
  /** La scène est prête (son numéro change quand elle est refaite). */
  ready: number;
  goTo(place: PlaceId): boolean;
  open(place: PlaceId, focus: string | null): void;
}

/**
 * L'adresse d'un lieu : Kéo y est déposé et sa liste s'ouvre, le focus sur la mission de l'adresse si elle est de l'île
 * du lieu (lue dans le contenu, jamais dans un état qui pourrait être périmé) ; une fois par navigation.
 */
export function usePlaceAddress({ place, mission, navigation, ready, goTo, open }: PlaceAddress) {
  const handled = useRef('');
  const actions = useRef({ goTo, open });
  useEffect(() => {
    actions.current = { goTo, open };
  });
  useEffect(() => {
    const key = place ? `${navigation}|${place}|${mission ?? ''}` : '';
    if (!place || key === handled.current) return;
    if (!actions.current.goTo(place)) return;
    handled.current = key;
    const own = Boolean(mission && getIle(placeById(place).island)?.exercises.some((e) => e.id === mission));
    actions.current.open(place, own ? mission : null);
  }, [place, mission, navigation, ready]);
}

/**
 * Une pose en cours (`active`) qui ne dit pas sa fin dans le temps de la plus longue, et d'une marge, est tenue pour
 * finie (`release`) : la liste du lieu se rouvre quand même.
 */
export function usePoseGuard(active: boolean, release: () => void) {
  const done = useRef(release);
  useEffect(() => {
    done.current = release;
  });
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => done.current(), POSE_GUARD_SECONDS * 1000);
    return () => window.clearTimeout(t);
  }, [active]);
}
