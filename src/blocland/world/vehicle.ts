// Le Bloc-Navire : un seul véhicule qui grandit en trois étapes, chacune un plan à construire sur le quai de l'île-port
// d'un archipel. La coque et la voile mènent aux Collines du Large (par la mer), le ballon aux Monts de Feu (par les
// airs), le réacteur aux Îles du Ciel. Les cases « kit » (voile, haut du ballon, feux) ne se gagnent pas : elles
// arrivent d'elles-mêmes quand assez de Gardiens de l'archipel sont vaincus. Le reste se pose bloc par bloc.
import { BLOCKS, type BiomeId, type BlockId } from '../biomes';
import { isBossBeaten } from '../bossCore';
import { ARCHIPELAGOS, getArchipelago, islandsOf, reachedArchipelagos, voyageId, type ArchipelagoId } from './archipelago';
import type { PlanCell, PlanDef } from './plans';

export const VEHICLE_NAME = 'le Bloc-Navire';

export interface VehicleStage extends PlanDef {
  zone: 'port';
  /** Numéro de l'étape (1 à 3). */
  stage: 1 | 2 | 3;
  /** L'archipel où l'étape se construit (sur son port) et celui où elle mène. */
  from: ArchipelagoId;
  to: ArchipelagoId;
  /** Gardiens de `from` à vaincre pour que le kit arrive et que l'on puisse embarquer. */
  guardians: number;
  /** Les cases offertes avec les Gardiens (jamais à poser). */
  kit: PlanCell[];
  /** Le nom court de l'étape (« la voile »), pour les phrases. */
  short: string;
}

/** Remplit un volume de cases, du coin (x0, y0, z0), de w × d × h cases. */
function fill(cells: PlanCell[], x0: number, y0: number, z0: number, w: number, d: number, h: number, block: BlockId): void {
  for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + d; y++) for (let z = z0; z < z0 + h; z++) cells.push({ x, y, z, block });
}

function coque(): { cells: PlanCell[]; kit: PlanCell[] } {
  const cells: PlanCell[] = [];
  // Le pont en sable clair (Carrière), la proue et la poupe en bois.
  fill(cells, 1, 1, 0, 3, 6, 1, 'sable');
  cells.push({ x: 2, y: 0, z: 0, block: 'bois' }, { x: 2, y: 7, z: 0, block: 'bois' });
  // Les bastingages en bois (Forêt).
  fill(cells, 0, 1, 1, 1, 6, 1, 'bois');
  fill(cells, 4, 1, 1, 1, 6, 1, 'bois');
  // La cabine de poupe en galet (Rivière), l'ancre en pierre (Mine).
  fill(cells, 1, 6, 1, 3, 1, 2, 'galet');
  cells.push({ x: 0, y: 0, z: 1, block: 'pierre' });
  // Le mât.
  fill(cells, 2, 3, 1, 1, 1, 6, 'bois');
  // Le kit : la voile de toile de part et d'autre du mât, la lanterne de proue.
  const kit: PlanCell[] = [];
  for (const x of [0, 1, 3, 4]) fill(kit, x, 3, 3, 1, 1, 3, 'toile');
  kit.push({ x: 2, y: 0, z: 1, block: 'lanterne' });
  return { cells, kit };
}

function ballon(): { cells: PlanCell[]; kit: PlanCell[] } {
  const cells: PlanCell[] = [];
  // Quatre sacs de lest en glace (Glacier) sous le ballon, autour du sommet du mât.
  for (const [x, y] of [
    [1, 2],
    [3, 2],
    [1, 4],
    [3, 4],
  ])
    cells.push({ x, y, z: 7, block: 'glace' });
  // La nacelle du ballon en panneaux peints (Carrefour), puis la grande couronne de toile (Marché).
  fill(cells, 1, 2, 8, 3, 3, 1, 'panneau');
  fill(cells, 0, 1, 9, 5, 5, 1, 'toile');
  const corners = new Set(['0,1', '4,1', '0,5', '4,5']);
  const trimmed = cells.filter((c) => !(c.z === 9 && corners.has(`${c.x},${c.y}`)));
  // Le kit : le haut du ballon et la corde qui le retient au mât.
  const kit: PlanCell[] = [];
  fill(kit, 1, 2, 10, 3, 3, 1, 'toile');
  kit.push({ x: 2, y: 3, z: 7, block: 'barriere' });
  return { cells: trimmed, kit };
}

function reacteur(): { cells: PlanCell[]; kit: PlanCell[] } {
  const cells: PlanCell[] = [];
  // Le bloc du réacteur en acier (Forge), derrière la poupe.
  fill(cells, 1, 8, 0, 3, 2, 3, 'acier');
  // Les ailerons en calque (Atelier), la tuyère en ardoise (Falaise).
  cells.push({ x: 0, y: 8, z: 1, block: 'calque' }, { x: 4, y: 8, z: 1, block: 'calque' }, { x: 0, y: 9, z: 2, block: 'calque' }, { x: 4, y: 9, z: 2, block: 'calque' });
  fill(cells, 1, 10, 1, 3, 1, 1, 'ardoise');
  // Le kit : les feux de position.
  const kit: PlanCell[] = [{ x: 1, y: 9, z: 3, block: 'lanterne' }, { x: 3, y: 9, z: 3, block: 'lanterne' }];
  return { cells, kit };
}

function stage(
  n: 1 | 2 | 3,
  id: string,
  name: string,
  short: string,
  parts: { cells: PlanCell[]; kit: PlanCell[] },
  guardians: number,
  reward: PlanDef['reward'],
  done: string,
): VehicleStage {
  const from = ARCHIPELAGOS[n - 1];
  const to = ARCHIPELAGOS[n];
  return { id, biome: from.port, name, short, origin: { x: 0, y: 0 }, zone: 'port', stage: n, from: from.classe, to: to.classe, guardians, cells: parts.cells, kit: parts.kit, reward, done };
}

/** Les trois étapes, dans l'ordre. Chaque étape mène à l'archipel suivant. */
export const VEHICLE_STAGES: VehicleStage[] = [
  stage(1, 'navire-coque', 'La coque et la voile', 'la voile', coque(), 3, { xp: 120, chest: { lanterne: 2, barriere: 4 } }, 'La voile est hissée ! Pose les derniers blocs et embarque : les Collines du Large t’attendent.'),
  stage(2, 'navire-ballon', 'Le ballon', 'le ballon', ballon(), 2, { xp: 160, chest: { lanterne: 2, escalier: 2 } }, 'Le ballon est gonflé ! Le Bloc-Navire peut voler. Embarque quand tu veux : les Monts de Feu t’attendent.'),
  stage(3, 'navire-reacteur', 'Le réacteur', 'le réacteur', reacteur(), 2, { xp: 200, chest: { lanterne: 3 } }, 'Le réacteur ronronne ! Le Bloc-Navire peut monter jusqu’au ciel. Embarque quand tu veux : les Îles du Ciel t’attendent.'),
];

export function getStage(id: string): VehicleStage | undefined {
  return VEHICLE_STAGES.find((s) => s.id === id);
}

/** L'étape qui mène à un archipel. */
export function stageTo(a: ArchipelagoId): VehicleStage | undefined {
  return VEHICLE_STAGES.find((s) => s.to === a);
}

/** L'étape dont le voyage porte cet identifiant. */
export function stageFor(voyage: string): VehicleStage | undefined {
  return VEHICLE_STAGES.find((s) => voyageId(s.to) === voyage);
}

/** Le chantier d'une île-port : l'étape qui s'y construit (rien sur les autres îles). */
export function stageAt(island: BiomeId): VehicleStage | undefined {
  return VEHICLE_STAGES.find((s) => s.biome === island);
}

/** Combien de Gardiens d'un archipel sont vaincus. */
export function beatenGuardians(a: ArchipelagoId, progress: Record<string, { stars: number }>): number {
  return islandsOf(a).filter((b) => isBossBeaten(b.id, progress)).length;
}

/** Le kit d'une étape (voile, haut du ballon, feux) est arrivé : assez de Gardiens vaincus. */
export function kitReady(stage: VehicleStage, progress: Record<string, { stars: number }>): boolean {
  return beatenGuardians(stage.from, progress) >= stage.guardians;
}

/** Les étapes déjà parties (leur voyage est fait) : elles sont dessinées complètes, kit compris. */
export function launchedStages(bridges: string[]): VehicleStage[] {
  return VEHICLE_STAGES.filter((s) => bridges.includes(voyageId(s.to)));
}

/** Le port où le Bloc-Navire est amarré : celui de l'archipel le plus lointain atteint (il suit le voyageur). */
export function vehicleAt(bridges: string[]): BiomeId {
  const reached = reachedArchipelagos(bridges);
  return reached[reached.length - 1].port;
}

/** Le navire tel qu'il est aujourd'hui, en cubes locaux (pour le dessiner en SVG) : les étapes parties, kit compris. */
export function vehicleModel(level: number): { x: number; y: number; z: number; color: string; top?: string }[] {
  const cubes: { x: number; y: number; z: number; color: string; top?: string }[] = [];
  for (const s of VEHICLE_STAGES.slice(0, Math.max(1, level))) {
    for (const c of [...s.cells, ...s.kit]) cubes.push({ x: c.x, y: c.y, z: c.z, color: BLOCKS[c.block].side, top: BLOCKS[c.block].top });
  }
  return cubes;
}

/** Ce que dit la créature du port quand le kit arrive, ou ce qu'il manque pour cela. */
export function guardiansText(stage: VehicleStage, progress: Record<string, { stars: number }>): string {
  const beaten = beatenGuardians(stage.from, progress);
  const name = getArchipelago(stage.from).name;
  if (beaten >= stage.guardians) return `Gardiens : c’est fait ! ${beaten} sur ${stage.guardians}, ${stage.short} est là.`;
  const left = stage.guardians - beaten;
  return `Gardiens : encore ${left} à vaincre dans les ${name} pour ${stage.short}.`;
}
