// Le village d'un archipel en cinq états, déduits de la progression à chaque rendu et jamais enregistrés : abandonné,
// réactivation, reconstruction, développement, port. Chaque état correspond à un geste de l'élève (un plan d'île, le
// port et un ouvrage, un monument, le voyage). Code pur, partagé par le terrain (le port en cubes) et les panneaux.
import type { World } from '../engine';
import { ARCHIPELAGOS, BRIDGES, NOMS_ARCHIPELS, getArchipelago, islandsOf, voyageId, type ArchipelagoId, type NomsArchipels } from './archipelago';
import { monumentsOf } from './monuments';
import { isPlanDone, plansFor } from './plans';

export type VillageStageId = 'abandonne' | 'reactivation' | 'reconstruction' | 'developpement' | 'port';

export interface VillageStageDef {
  id: VillageStageId;
  /** Le rang, de 1 à 5. */
  rank: 1 | 2 | 3 | 4 | 5;
  name: string;
  /** Ce qui se voit au port, en une phrase (l'avis quand l'état monte). */
  sight: string;
}

export const VILLAGE_STAGES: VillageStageDef[] = [
  { id: 'abandonne', rank: 1, name: 'Abandonné', sight: 'Les lanternes du port sont éteintes, une barque grise est retournée sur la rive.' },
  { id: 'reactivation', rank: 2, name: 'Réactivation', sight: 'Le village se réveille : les lanternes du port s’allument.' },
  { id: 'reconstruction', rank: 3, name: 'Reconstruction', sight: 'Le port revit : une barque est amarrée à la jetée, un foyer fume.' },
  { id: 'developpement', rank: 4, name: 'Développement', sight: 'Le village grandit : une seconde barque, des caisses et des fanions sur le quai.' },
  { id: 'port', rank: 5, name: 'Port', sight: 'Le port est complet : une lanterne sur chaque poteau et un feu au bout de la jetée.' },
];

export interface VillageStage extends VillageStageDef {
  /** Ce qu'il faut faire pour l'état suivant, ou `null` au dernier (ou au plafond du 3e, jusqu'au lot 8). */
  next: string | null;
}

/** L'archipel suivant, celui où mène le voyage du Bloc-Navire depuis ce port (aucun pour le dernier). */
function nextArchipelago(a: ArchipelagoId): ArchipelagoId | null {
  const i = ARCHIPELAGOS.findIndex((x) => x.classe === a);
  return ARCHIPELAGOS[i + 1]?.classe ?? null;
}

/**
 * L'état du village d'un archipel. `noms` : les noms des archipels de l'univers affiché, pour la phrase `next` (le
 * terrain, qui ne lit que le rang, s'en passe).
 */
export function villageStage(village: Pick<World, 'parts' | 'links'>, a: ArchipelagoId, noms: NomsArchipels = NOMS_ARCHIPELS): VillageStage {
  const { port } = getArchipelago(a);
  const plans = islandsOf(a).flatMap((b) => plansFor(b.id));
  const anyPlan = plans.some((p) => isPlanDone(p, village.parts));
  const portPlans = plansFor(port);
  const portDone = portPlans.length > 0 && portPlans.every((p) => isPlanDone(p, village.parts));
  // Un ouvrage payé par l'élève (le pont gratuit de la Forêt à la Plaine ne compte pas) qui part de l'île-port.
  const linked = BRIDGES.some((b) => b.cost > 0 && (b.from === port || b.to === port) && village.links.includes(b.id));
  const monument = monumentsOf(a).some((m) => isPlanDone(m, village.parts));
  const to = nextArchipelago(a);
  const sailed = to !== null && village.links.includes(voyageId(to));
  const portName = getArchipelagoPortName(a);
  const at = (rank: number, next: string | null): VillageStage => ({ ...VILLAGE_STAGES[rank - 1], next });
  if (sailed) return at(5, null);
  if (portDone && linked && monument) return at(4, to ? `Fais partir le Bloc-Navire vers les ${noms[to]}.` : null);
  if (portDone && linked) return at(3, 'Termine un monument de l’archipel.');
  if (anyPlan) {
    const left = [!portDone && `termine les plans de ${portName}`, !linked && `construis un ouvrage qui part de ${portName}`].filter(Boolean).join(' et ');
    return at(2, `${left.charAt(0).toUpperCase()}${left.slice(1)}.`);
  }
  return at(1, 'Termine un premier plan sur une île.');
}

function getArchipelagoPortName(a: ArchipelagoId): string {
  const port = getArchipelago(a).port;
  return islandsOf(a).find((b) => b.id === port)?.name ?? port;
}
