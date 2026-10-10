// La Nef (GD-15) : un seul véhicule, qui change entièrement de forme à chaque passage. Chaque forme se construit sur le
// quai de l'île-port d'un archipel : le voilier mène aux Îles Brumeuses (par la mer), le dirigeable aux Anciens Ateliers
// (par les airs), la fusée aux Îles du Ciel. Une forme reprend des cubes de la précédente (`kept` : la coque devient la
// nacelle, puis le socle de la fusée) ; l'élève ne pose que les pièces neuves (`cells`), à leur place finale, hors des cases de la
// forme d'avant. Les cases « kit » (la voile, le haut de l'enveloppe, les ailerons) ne se gagnent pas : elles arrivent
// d'elles-mêmes quand assez de Gardiens de l'archipel sont rallumés.
import { BLOC, BLOCKS, type BiomeId, type BlockId } from '../biomes';
import { isBossBeaten } from '../bossCore';
import { ARCHIPELAGOS, islandsOf, reachedArchipelagos, voyageId, type ArchipelagoId } from './archipelago';
import type { PlanCell, PlanDef } from './plans';

export const VEHICLE_NAME = 'la Nef';

export interface VehicleStage extends PlanDef {
  zone: 'port';
  /** Numéro de l'étape (1 à 3). */
  stage: 1 | 2 | 3;
  /** L'archipel où l'étape se construit (sur son port) et celui où elle mène. */
  from: ArchipelagoId;
  to: ArchipelagoId;
  /** Gardiens de `from` à rallumer pour que le kit arrive et que l'on puisse embarquer. */
  guardians: number;
  /** Les cases offertes avec les Gardiens (jamais à poser). */
  kit: PlanCell[];
  /** Les cubes repris de la forme d'avant, à leur place dans la nouvelle forme (rien pour la première). */
  kept: PlanCell[];
  /** Le nom court de l'étape (« la voile »), pour les phrases. */
  short: string;
  /**
   * Le message de fin, avec le nom de l'archipel où elle mène dans l'univers affiché (GD-1) ; `done` le donne avec le
   * nom commun des données.
   */
  fin: (archipel: string) => string;
}

/** Remplit un volume de cases, du coin (x0, y0, z0), de w × d × h cases. */
function fill(cells: PlanCell[], x0: number, y0: number, z0: number, w: number, d: number, h: number, block: BlockId): void {
  for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + d; y++) for (let z = z0; z < z0 + h; z++) cells.push({ x, y, z, block });
}

/** Le voilier (6e) : une coque courte de planches au pont de sable, un mât, une cabine de galet ; le kit, la voile carrée unie
 * barrée de sa bande et la lanterne de proue. */
function voilier(): { cells: PlanCell[]; kit: PlanCell[]; kept: PlanCell[] } {
  const cells: PlanCell[] = [];
  fill(cells, 1, 1, 0, 1, 6, 1, BLOC.bois);
  fill(cells, 3, 1, 0, 1, 6, 1, BLOC.bois);
  fill(cells, 2, 1, 0, 1, 6, 1, BLOC.sable);
  cells.push({ x: 2, y: 0, z: 0, block: BLOC.bois });
  fill(cells, 2, 3, 1, 1, 1, 5, BLOC.bois);
  fill(cells, 1, 6, 1, 3, 1, 1, BLOC.galet);
  const kit: PlanCell[] = [];
  for (const x of [0, 1, 3, 4]) for (const z of [2, 3, 4]) kit.push({ x, y: 3, z, block: z === 3 ? BLOC.reliure : BLOC.marbre });
  kit.push({ x: 2, y: 0, z: 1, block: BLOC.lanterne });
  return { cells, kit, kept: [] };
}

/** Le dirigeable (5e) : la coque devenue nacelle, pendue à deux cordes sous une enveloppe creuse couchée (le dessous en
 * glace, les bouts en sel, la bande sur les flancs, le dessus blanc), un gouvernail en croix ; le kit, le haut de
 * l'enveloppe et ce qui manque à la bande. */
function dirigeable(): { cells: PlanCell[]; kit: PlanCell[]; kept: PlanCell[] } {
  const kept: PlanCell[] = [];
  fill(kept, 1, 2, 0, 1, 4, 1, BLOC.bois);
  fill(kept, 3, 2, 0, 1, 4, 1, BLOC.bois);
  fill(kept, 2, 2, 0, 1, 4, 1, BLOC.sable);
  fill(kept, 2, 2, 1, 1, 1, 5, BLOC.bois);
  fill(kept, 2, 5, 1, 1, 1, 5, BLOC.bois);
  kept.push({ x: 2, y: 0, z: 7, block: BLOC.lanterne });
  const cells: PlanCell[] = [];
  // Au-dessus du mât du voilier (z 6 et plus) et derrière sa cabine (y 8) : jamais sur une case de la forme d'avant.
  fill(cells, 1, 2, 6, 3, 5, 1, BLOC.glace);
  for (const y of [1, 7]) fill(cells, 1, y, 7, 3, 1, 1, BLOC.sel);
  fill(cells, 2, 8, 6, 1, 1, 3, BLOC.lambris);
  cells.push({ x: 1, y: 8, z: 7, block: BLOC.lambris }, { x: 3, y: 8, z: 7, block: BLOC.lambris });
  // La bande et le dessus : quatre cases de bande et huit de toile blanche viennent de la voile, le reste du kit.
  const bande: PlanCell[] = [];
  for (const x of [0, 4]) fill(bande, x, 2, 7, 1, 5, 1, BLOC.reliure);
  const dessus: PlanCell[] = [];
  fill(dessus, 1, 2, 8, 3, 5, 1, BLOC.marbre);
  kept.push(...bande.slice(0, 4), ...dessus.slice(0, 8));
  return { cells, kit: [...bande.slice(4), ...dessus.slice(8)], kept };
}

/** La fusée (4e, debout au 3e) : la nacelle devenue socle, une coque en croix d'acier, de calque et d'ardoise, dressée sur
 * la corde de bois devenue quille ; le dessous de l'enveloppe en hublots, son dessus en anneau blanc ; le kit, trois
 * ailerons de bois (le quatrième est l'autre corde), la bande et la lanterne au nez. */
function fusee(): { cells: PlanCell[]; kit: PlanCell[]; kept: PlanCell[] } {
  // La croix de la coque autour de l'axe (2, 4) : son cœur, caché, n'est pas posé.
  const bras = [
    [1, 4],
    [3, 4],
    [2, 3],
    [2, 5],
  ] as const;
  const kept: PlanCell[] = [];
  fill(kept, 1, 3, 0, 1, 3, 1, BLOC.bois);
  fill(kept, 3, 3, 0, 1, 3, 1, BLOC.bois);
  fill(kept, 2, 2, 0, 1, 4, 1, BLOC.sable);
  fill(kept, 2, 2, 1, 1, 1, 2, BLOC.bois);
  fill(kept, 2, 5, 1, 1, 1, 5, BLOC.bois);
  for (const [x, y] of [...bras, [2, 4] as const]) kept.push({ x, y, z: 6, block: BLOC.glace }, { x, y, z: 8, block: BLOC.marbre });
  const cells: PlanCell[] = [];
  // La coque de z 1 à 5 (la corde arrière en est le bras de derrière), une rangée de calque au milieu ; la pointe d'ardoise.
  for (const [x, y] of bras.slice(0, 3)) for (let z = 1; z <= 5; z++) cells.push({ x, y, z, block: z === 3 ? BLOC.calque : BLOC.acier });
  for (const [x, y] of [...bras, [2, 4] as const]) cells.push({ x, y, z: 9, block: BLOC.ardoise });
  const kit: PlanCell[] = [];
  for (const [x, y] of bras) kit.push({ x, y, z: 7, block: BLOC.reliure });
  for (const [x, y] of [
    [0, 4],
    [4, 4],
    [2, 6],
  ]) fill(kit, x, y, 1, 1, 1, 2, BLOC.bois);
  kit.push({ x: 2, y: 4, z: 10, block: BLOC.lanterne });
  return { cells, kit, kept };
}

function stage(
  n: 1 | 2 | 3,
  id: string,
  name: string,
  short: string,
  parts: { cells: PlanCell[]; kit: PlanCell[]; kept: PlanCell[] },
  guardians: number,
  reward: PlanDef['reward'],
  fin: (archipel: string) => string,
): VehicleStage {
  const from = ARCHIPELAGOS[n - 1];
  const to = ARCHIPELAGOS[n];
  return { id, biome: from.port, name, short, origin: { x: 0, y: 0 }, zone: 'port', stage: n, from: from.classe, to: to.classe, guardians, cells: parts.cells, kit: parts.kit, kept: parts.kept, reward, done: fin(to.name), fin };
}

/** Les trois étapes, dans l'ordre. Chaque étape mène à l'archipel suivant. Les identifiants sont ceux des sauvegardes. */
export const VEHICLE_STAGES: VehicleStage[] = [
  stage(1, 'navire-coque', 'Le voilier', 'la voile', voilier(), 3, { xp: 120, chest: { [BLOC.lanterne]: 2, [BLOC.barriere]: 4 } }, (archipel) => `La voile est hissée ! Embarque quand tu veux : les ${archipel} t’attendent.`),
  stage(2, 'navire-ballon', 'Le dirigeable', 'l’enveloppe', dirigeable(), 2, { xp: 160, chest: { [BLOC.lanterne]: 2, [BLOC.escalier]: 2 } }, (archipel) => `La Nef est devenue dirigeable ! Embarque quand tu veux : les ${archipel} t’attendent.`),
  stage(3, 'navire-reacteur', 'La fusée', 'les ailerons', fusee(), 2, { xp: 200, chest: { [BLOC.lanterne]: 3 } }, (archipel) => `La Nef est devenue fusée ! Embarque quand tu veux : les ${archipel} t’attendent.`),
];

/** Toutes les cases d'une forme de la Nef (1 à 3) : ce qu'elle reprend, ce qu'on pose, son kit. */
export function vehicleForm(n: number): PlanCell[] {
  const s = VEHICLE_STAGES[Math.min(3, Math.max(1, n)) - 1];
  return [...s.kept, ...s.cells, ...s.kit];
}

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

/** Combien de Gardiens d'un archipel sont rallumés. */
export function beatenGuardians(a: ArchipelagoId, progress: Record<string, { stars: number }>): number {
  return islandsOf(a).filter((b) => isBossBeaten(b.id, progress)).length;
}

/** Le kit d'une étape (voile, haut de l'enveloppe, ailerons) est arrivé : assez de Gardiens rallumés. */
export function kitReady(stage: VehicleStage, progress: Record<string, { stars: number }>): boolean {
  return beatenGuardians(stage.from, progress) >= stage.guardians;
}

/** L'étape qui se construit sur le quai d'un port : pas encore partie, et l'étape d'avant déjà partie (ou la première). */
export function stageBuildingAt(port: BiomeId, bridges: string[]): VehicleStage | undefined {
  return VEHICLE_STAGES.find(
    (st) => st.biome === port && !bridges.includes(voyageId(st.to)) && (st.stage === 1 || bridges.includes(voyageId(VEHICLE_STAGES[st.stage - 2].to))),
  );
}

/** Les étapes déjà parties (leur voyage est fait) ; la Nef a la forme de la dernière. */
export function launchedStages(bridges: string[]): VehicleStage[] {
  return VEHICLE_STAGES.filter((s) => bridges.includes(voyageId(s.to)));
}

/** Le port où la Nef est amarrée : celui de l'archipel le plus lointain atteint (elle suit le voyageur). */
export function vehicleAt(bridges: string[]): BiomeId {
  const reached = reachedArchipelagos(bridges);
  return reached[reached.length - 1].port;
}

/** La Nef telle qu'elle est aujourd'hui, en cubes locaux (pour la dessiner en SVG) : la forme de la dernière étape partie. */
export function vehicleModel(level: number): { x: number; y: number; z: number; color: string; top?: string }[] {
  return vehicleForm(Math.max(1, level)).map((c) => ({ x: c.x, y: c.y, z: c.z, color: BLOCKS[c.block].side, top: BLOCKS[c.block].top }));
}
