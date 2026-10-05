// Le village d'un archipel en cinq états, déduits de la progression à chaque rendu et jamais enregistrés : abandonné,
// réactivation, reconstruction, développement, port. Chaque état correspond à un geste de l'élève (une première mission
// réussie, qui pose une partie d'un bâtiment (GD-6) ; le port bâti et un ouvrage ; un monument ; le voyage). Code pur, partagé par le terrain (le port en cubes) et les panneaux.
import type { World } from '../engine';
import { ARCHIPELAGOS, BRIDGES, NOMS_ARCHIPELS, getArchipelago, islandsOf, voyageId, type ArchipelagoId, type NomsArchipels } from './archipelago';
import { monumentsOf } from './monuments';
import { partiesDe, premierePartiePosee, prochainePartie } from './parties';
import { isPlanDone } from './plans';

type VillageStageId = 'abandonne' | 'reactivation' | 'reconstruction' | 'developpement' | 'port';

interface VillageStageDef {
  id: VillageStageId;
  /** Le rang, de 1 à 5. */
  rank: 1 | 2 | 3 | 4 | 5;
  name: string;
}

const VILLAGE_STAGES: VillageStageDef[] = [
  { id: 'abandonne', rank: 1, name: 'Abandonné' },
  { id: 'reactivation', rank: 2, name: 'Réactivation' },
  { id: 'reconstruction', rank: 3, name: 'Reconstruction' },
  { id: 'developpement', rank: 4, name: 'Développement' },
  { id: 'port', rank: 5, name: 'Port' },
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
  // Une partie posée sur une île (sa première mission réussie), et le bâtiment du port fini (toutes ses missions).
  const anyPart = islandsOf(a).some((b) => premierePartiePosee(b.id, village.parts));
  const portDone = partiesDe(port).length > 0 && prochainePartie(port, village.parts) === null;
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
  if (anyPart) {
    const left = [!portDone && `réussis les missions de ${portName}`, !linked && `construis un ouvrage qui part de ${portName}`].filter(Boolean).join(' et ');
    return at(2, `${left.charAt(0).toUpperCase()}${left.slice(1)}.`);
  }
  return at(1, 'Réussis une première mission sur une île.');
}

function getArchipelagoPortName(a: ArchipelagoId): string {
  const port = getArchipelago(a).port;
  return islandsOf(a).find((b) => b.id === port)?.name ?? port;
}
