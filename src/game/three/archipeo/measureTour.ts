// Le tour de la mesure automatique dans le monde ouvert d'un niveau (game/AutoMeasure.tsx, `?mesures=auto`) : la marche
// d'un lieu à un autre et le lieu de la scénette, avec leurs noms pour le tableau. Ici, dans la vue, pour que rien hors
// d'elle ne lise world/continu/ (world/continu/isolation.test.ts) : la mesure le lit sur `window.__dysappsMondeOuvert`.
import { hasScenette, placeById, type LevelPlan, type PlaceId } from '../../world/continu/levelPlan';

/** Un lieu du tour : son identifiant, et son nom sans article (« Phare », « Balises »). */
interface LieuDuTour {
  id: PlaceId;
  nom: string;
}

/** Le tour du monde ouvert d'un niveau : la marche d'un lieu à un autre, et le lieu de la scénette. */
export interface TourDeMesure {
  depart: LieuDuTour;
  arrivee: LieuDuTour;
  scene?: LieuDuTour;
}

const lieu = (id: PlaceId): LieuDuTour => ({ id, nom: placeById(id).name.replace(/^(Le |La |Les |L’|L')/, '') });

/**
 * Le tour d'un niveau : au 6e, celui de la première mesure (17 octobre 2026), gardé pour comparer, du Phare aux Balises,
 * les Quais ; ailleurs, la marche du premier lieu du plan au plus loin de lui (l'île traversée, les lieux qui entrent et
 * sortent du champ), et la scénette du premier lieu qui en a une.
 */
export function measureTour(plan: LevelPlan): TourDeMesure {
  if (plan.level === '6e') return { depart: lieu('phare'), arrivee: lieu('beacons'), scene: lieu('quais') };
  const { places } = plan;
  const depart = places[0];
  const loin = (p: (typeof places)[number]) => Math.hypot(p.center.x - depart.center.x, p.center.z - depart.center.z);
  const arrivee = places.reduce((a, p) => (loin(p) > loin(a) ? p : a), depart);
  const scene = places.find((p) => p.scenes.length > 0 && hasScenette(p.id));
  return { depart: lieu(depart.id), arrivee: lieu(arrivee.id), scene: scene && lieu(scene.id) };
}
