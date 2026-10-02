// À quoi servent les blocs que l'élève a en poche, et lesquels lui manquent : le plan en cours de chaque île
// ouverte de son archipel, le chantier du Bloc-Navire, les monuments de l'archipel, les ouvrages. Code pur, partagé par l'inventaire (« Mes
// blocs ») et les listes de blocs manquants du panneau d'île. Un bloc qui ne sert à rien maintenant est dit tel quel.
import { BIOMES, BLOCKS, type BiomeDef, type BiomeId, type BlockId } from '../biomes';
import { canLaunch, currentPlan, currentStage, planStatus, type GameState } from '../engine';
import { BRIDGE_BLOCKS, archipelagoOf, buildableBridges, conditionMet, islandsOf, otherEnd, payableBlocks, reachableIslands, type BridgeDef } from './archipelago';
import { monumentsOf } from './monuments';
import { lieuDAssemblage } from './assemblage';
import { universCourant } from '../../core/settings';
import { plansFor } from './plans';
import type { VehicleStage } from './vehicle';

/** L'île dont c'est le bloc (où on le gagne), ou rien pour un bloc de finition ou d'or. */
export function earnIsland(block: BlockId): BiomeDef | undefined {
  return BIOMES.find((b) => b.block === block);
}

/** Où gagner un type de bloc, en mots : le nom de son île, sinon le coffre d'un plan (un bloc assemblé : voir `allerChercher`). */
export function whereToEarn(block: BlockId): string {
  return earnIsland(block)?.name ?? 'le coffre du plan précédent (ou un coffre de régularité)';
}

/** Où aller chercher un bloc qui manque, en une consigne : « va dans Forêt des sons », « va à la Fabrique pour l’assembler ». */
export function allerChercher(block: BlockId): string {
  return BLOCKS[block].assemble ? `va ${lieuDAssemblage(universCourant()).a} pour l’assembler` : `va dans ${whereToEarn(block)}`;
}

export interface Use {
  kind: 'plan' | 'navire' | 'monument' | 'garder';
  /** L'île où poser (ou dont les plans suivants attendent le bloc). */
  island: BiomeId;
  /** Le nom du plan (ou de l'étape du navire). */
  name: string;
  /** Combien de ces blocs il reste à poser. */
  need: number;
  /** L'élève en a assez pour tout poser. */
  enough: boolean;
  /** Où aller (un monument a sa propre adresse) ; sinon l'île. */
  to?: string;
}

/** Les îles ouvertes de l'archipel où se tient le bonhomme, la sienne en premier. */
function openIslandsHere(state: GameState): BiomeId[] {
  const at = state.world.place ?? 'french-6e-phonology';
  const open = reachableIslands(state.world.links);
  const ids = islandsOf(archipelagoOf(at).classe)
    .map((b) => b.id)
    .filter((id) => open.has(id));
  return [at, ...ids.filter((id) => id !== at)];
}

/** Le chantier du navire quand il est à portée (son port ouvert, son voyage pas encore fait). */
function shipyard(state: GameState): VehicleStage | null {
  const stage = currentStage(state);
  if (!stage) return null;
  const launch = canLaunch(state, stage);
  return launch.ok || launch.reason !== 'loin' ? stage : null;
}

/** Ce qu'un type de bloc peut construire maintenant ; vide s'il ne sert à rien pour l'instant. */
export function blockUses(state: GameState, block: BlockId): Use[] {
  const have = state.stock[block] ?? 0;
  const uses: Use[] = [];
  for (const island of openIslandsHere(state)) {
    const current = currentPlan(state, island);
    if (!current || current.allDone) continue;
    const need = planStatus(state, current.plan).missing[block] ?? 0;
    if (need > 0)
      uses.push({
        kind: 'plan',
        island,
        name: current.plan.name,
        need,
        enough: have >= need,
      });
  }
  const stage = shipyard(state);
  if (stage) {
    const need = planStatus(state, stage).missing[block] ?? 0;
    if (need > 0)
      uses.push({
        kind: 'navire',
        island: stage.biome,
        name: stage.name,
        need,
        enough: have >= need,
      });
  }
  if (uses.length) return uses;
  // Rien à poser dans un plan ni sur le navire : les monuments de l'archipel s'en servent peut-être (c'est leur rôle :
  // employer les blocs qui s'accumulent).
  for (const m of monumentsOf(archipelagoOf(state.world.place ?? 'french-6e-phonology').classe)) {
    const need = planStatus(state, m).missing[block] ?? 0;
    if (need > 0) uses.push({ kind: 'monument', island: m.biome, name: m.name, need, enough: have >= need, to: `/aventure/${m.id}` });
  }
  // Rien à poser aujourd'hui : les plans suivants de son île (ou, pour un bloc de coffre, des îles ouvertes) l'attendent peut-être.
  const home = earnIsland(block);
  for (const island of home ? [home.id] : openIslandsHere(state)) {
    const later = plansFor(island)
      .filter((p) => !planStatus(state, p).complete)
      .reduce((n, p) => n + (planStatus(state, p).missing[block] ?? 0), 0);
    if (later > 0) {
      uses.push({
        kind: 'garder',
        island,
        name: BIOMES.find((b) => b.id === island)!.name,
        need: later,
        enough: have >= later,
      });
      break;
    }
  }
  return uses;
}

export interface InventoryRow {
  block: BlockId;
  count: number;
  uses: Use[];
}

export interface OuvrageUse {
  bridge: BridgeDef;
  /** L'île ouverte d'où se construit l'ouvrage. */
  from: BiomeId;
  to: BiomeId;
  enough: boolean;
}

export interface MissingBlock {
  block: BlockId;
  /** Ce qu'il manque une fois l'inventaire compté. */
  need: number;
  /** L'île où le gagner ; rien pour un bloc de coffre. */
  island?: BiomeId;
  /** L'île où le gagner n'est pas encore ouverte. */
  closed: boolean;
}

export interface Inventory {
  rows: InventoryRow[];
  total: number;
  /** Les blocs qui peuvent payer un ouvrage (tous types d'île confondus). */
  payable: number;
  ouvrages: OuvrageUse[];
  missing: MissingBlock[];
}

/** Rang d'une ligne : posable ici, posable ailleurs, à garder, sans usage. */
function rank(row: InventoryRow, at: BiomeId): number {
  if (row.uses.some((u) => u.kind !== 'garder' && u.island === at)) return 0;
  if (row.uses.some((u) => u.kind !== 'garder')) return 1;
  return row.uses.length ? 2 : 3;
}

/** Les blocs que réclament les chantiers à portée et que l'élève n'a pas, avec l'île où les gagner. */
export function missingNow(state: GameState): MissingBlock[] {
  const need: Partial<Record<BlockId, number>> = {};
  for (const island of openIslandsHere(state)) {
    const current = currentPlan(state, island);
    if (!current || current.allDone) continue;
    for (const [b, n] of Object.entries(planStatus(state, current.plan).missing)) need[b as BlockId] = (need[b as BlockId] ?? 0) + (n ?? 0);
  }
  const stage = shipyard(state);
  if (stage) for (const [b, n] of Object.entries(planStatus(state, stage).missing)) need[b as BlockId] = (need[b as BlockId] ?? 0) + (n ?? 0);
  const open = reachableIslands(state.world.links);
  return (Object.keys(BLOCKS) as BlockId[])
    .map((block) => ({
      block,
      need: (need[block] ?? 0) - (state.stock[block] ?? 0),
    }))
    .filter(({ need: n }) => n > 0)
    .map(({ block, need: n }) => {
      const island = earnIsland(block)?.id;
      return {
        block,
        need: n,
        island,
        closed: island ? !open.has(island) : false,
      };
    });
}

/** L'inventaire commenté : chaque type possédé et ses usages, les ouvrages payables, les blocs à aller chercher. */
export function inventoryUses(state: GameState): Inventory {
  const at = state.world.place ?? 'french-6e-phonology';
  const rows = (Object.keys(BLOCKS) as BlockId[])
    .filter((b) => (state.stock[b] ?? 0) > 0)
    .map((block) => ({
      block,
      count: state.stock[block] ?? 0,
      uses: blockUses(state, block),
    }))
    .map((row, i) => ({ row, i }))
    .sort((a, b) => rank(a.row, at) - rank(b.row, at) || a.i - b.i)
    .map(({ row }) => row);
  const total = rows.reduce((n, r) => n + r.count, 0);
  const payable = payableBlocks(state.stock);
  const world = { progress: state.progress, plans: state.world.parts };
  const here = new Set(openIslandsHere(state));
  const ouvrages = buildableBridges(state.world.links, undefined, world)
    .filter((b) => here.has(b.from) || here.has(b.to))
    .filter((b) => conditionMet(b, state.world.links, world))
    .map((bridge) => {
      const from = here.has(bridge.from) ? bridge.from : bridge.to;
      return {
        bridge,
        from,
        to: otherEnd(bridge, from),
        enough: payable >= bridge.cost,
      };
    });
  return { rows, total, payable, ouvrages, missing: missingNow(state) };
}

/** Un bloc paie les ouvrages (les blocs de finition, non). */
export function paysOuvrages(block: BlockId): boolean {
  return BRIDGE_BLOCKS.includes(block);
}
