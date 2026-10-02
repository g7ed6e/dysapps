// Le chantier que servent les blocs d'une mission : ce que dit le bilan (« La cabane de Mousso : 12 blocs sur les 20
// qui manquent. ») et où mène « Voir le chantier ». Code pur, déduit de la sauvegarde, sans rien y ajouter : les
// chiffres sont ceux du panneau d'île et de « Mes blocs ».
import { getBiome, ofBlock, type BiomeId, type BlockId } from '../biomes';
import { currentPlan, planStatus, type GameState } from '../engine';
import type { PlanDef } from './plans';
import { BRIDGE_BLOCKS, KIND_NAME, archipelagoOf, buildableBridges, conditionMet, otherEnd, payableBlocks } from './archipelago';
import { monumentsOf } from './monuments';
import { blockUses, type Use } from './uses';
import { VEHICLE_NAME, stageAt } from './vehicle';

export interface Worksite {
  kind: 'plan' | 'navire' | 'monument' | 'ouvrage' | 'garder' | 'aucun';
  /** La phrase du bilan, qui se termine par un point. */
  text: string;
  /** La jauge : blocs en poche pour ce chantier, sur ceux qu'il lui manque (0 sur 0 quand rien ne se compte). */
  have: number;
  need: number;
  /** Tous les blocs sont là : il n'y a plus qu'à poser (ou à construire). */
  ready: boolean;
  /** L'île du chantier (pour un monument, l'île d'où on le voit). */
  island: BiomeId;
  /** L'adresse de « Voir le chantier » : l'île, avec la section à mettre en avant, ou le monument. */
  to: string;
}

/** Ce qu'il manque d'un plan, en blocs, et combien l'élève en a déjà en poche. */
function gauge(state: GameState, plan: PlanDef) {
  const missing = Object.entries(planStatus(state, plan).missing).filter(([, n]) => (n ?? 0) > 0) as [BlockId, number][];
  const need = missing.reduce((sum, [, n]) => sum + n, 0);
  const have = missing.reduce((sum, [b, n]) => sum + Math.min(n, state.stock[b] ?? 0), 0);
  return { have, need, ready: need > 0 && have >= need };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « 12 blocs sur les 20 qui manquent », ou « le bloc qui manque ». */
function count(have: number, need: number): string {
  if (need === 1) return have ? 'tu as le bloc qui manque' : 'il manque 1 bloc';
  return `${have} bloc${have > 1 ? 's' : ''} sur les ${need} qui manquent`;
}

/** Le chantier d'un usage (plan, navire ou monument) : sa phrase et sa jauge. */
function fromUse(state: GameState, use: Use): Worksite | null {
  const island = getBiome(use.island)?.name ?? use.island;
  if (use.kind === 'plan') {
    const current = currentPlan(state, use.island);
    if (!current || current.allDone) return null;
    const g = gauge(state, current.plan);
    const text = g.ready ? `${current.plan.name} : tu as tous tes blocs. Va les poser !` : `${current.plan.name}, sur ${island} : ${count(g.have, g.need)}.`;
    return { kind: 'plan', text, ...g, island: use.island, to: `/aventure/${use.island}?chantier=plan` };
  }
  if (use.kind === 'navire') {
    const stage = stageAt(use.island);
    if (!stage) return null;
    const g = gauge(state, stage);
    const name = `${cap(VEHICLE_NAME)}, ${stage.name.charAt(0).toLowerCase()}${stage.name.slice(1)}`;
    const text = g.ready ? `${name} : tu as tous tes blocs. Va les poser au port !` : `${name} : ${count(g.have, g.need)}.`;
    return { kind: 'navire', text, ...g, island: use.island, to: `/aventure/${use.island}?chantier=navire` };
  }
  if (use.kind === 'monument') {
    const monument = monumentsOf(archipelagoOf(use.island).classe).find((m) => m.name === use.name);
    if (!monument) return null;
    const g = gauge(state, monument);
    const text = g.ready ? `${monument.name} : tu as tous tes blocs. Va les poser !` : `${monument.name} : ${count(g.have, g.need)}.`;
    return { kind: 'monument', text, ...g, island: use.island, to: `/aventure/${monument.id}` };
  }
  return null;
}

/** L'ouvrage le moins cher qui part de cette île (tout bloc d'île le paie), s'il y en a un à construire. */
function ouvrage(state: GameState, island: BiomeId, block: BlockId): Worksite | null {
  if (!BRIDGE_BLOCKS.includes(block)) return null;
  const world = { progress: state.progress, plans: state.world.parts };
  const bridges = buildableBridges(state.world.links, island, world).filter((b) => conditionMet(b, state.world.links, world));
  if (!bridges.length) return null;
  const cheapest = bridges.reduce((a, b) => (b.cost < a.cost ? b : a));
  const to = getBiome(otherEnd(cheapest, island))?.name ?? cheapest.to;
  const kind = KIND_NAME[cheapest.kind].toLowerCase();
  const name = `${/^[aeiouy]/.test(kind) ? 'L’' : 'Le '}${kind} vers ${to}`;
  const have = Math.min(cheapest.cost, payableBlocks(state.stock));
  const ready = have >= cheapest.cost;
  const text = ready ? `${name} : tu peux le construire !` : `${name} : ${have} bloc${have > 1 ? 's' : ''} sur ${cheapest.cost}.`;
  return { kind: 'ouvrage', text, have, need: cheapest.cost, ready, island, to: `/aventure/${island}?chantier=${cheapest.id}` };
}

/**
 * Le chantier que servent les blocs gagnés sur une île : d'abord un plan ou le Bloc-Navire de cette île, puis
 * l'ouvrage le moins cher qui en part, puis un autre chantier de l'archipel (plan d'une autre île, navire, monument) ;
 * sinon les plans suivants qui attendent ce bloc, ou rien, dit tel quel.
 */
export function worksiteFor(state: GameState, island: BiomeId, block: BlockId): Worksite {
  const uses = blockUses(state, block);
  const here = uses.filter((u) => u.island === island && (u.kind === 'plan' || u.kind === 'navire'));
  for (const use of here) {
    const site = fromUse(state, use);
    if (site) return site;
  }
  const bridge = ouvrage(state, island, block);
  if (bridge) return bridge;
  for (const use of uses.filter((u) => u.kind !== 'garder' && !here.includes(u))) {
    const site = fromUse(state, use);
    if (site) return site;
  }
  const later = uses.find((u) => u.kind === 'garder');
  if (later) {
    return {
      kind: 'garder',
      text: `Tes blocs ${ofBlock(block)} attendent le prochain plan de ${later.name}.`,
      have: 0,
      need: 0,
      ready: false,
      island: later.island,
      to: `/aventure/${later.island}`,
    };
  }
  return {
    kind: 'aucun',
    text: `Aucun chantier n’attend tes blocs ${ofBlock(block)} pour l’instant : ils restent dans Mes blocs.`,
    have: 0,
    need: 0,
    ready: false,
    island,
    to: `/aventure/${island}`,
  };
}

