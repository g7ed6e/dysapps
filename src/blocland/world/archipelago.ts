// Le continent : la place de chaque île et les ouvrages qui les relient (pont, bac, escalier taillé, tunnel, col).
// Un ouvrage coûte des blocs gagnés n'importe où ; certains demandent aussi un plan terminé ou un Gardien vaincu
// sur l'île de départ. Une île s'ouvre quand un chemin d'ouvrages construits y mène depuis une île de départ.
// Générateur pur : partagé entre le monde 3D, les pages simples et le moteur.
import { BIOMES, getBiome, type BiomeId, type BlockId } from '../biomes';
import { isBossBeaten } from '../bossCore';
import { MAP } from './map';
import { plansFor, isPlanDone } from './plans';

/** La place de chaque île est dans `map.ts` (MAP). */
export const ISLANDS = MAP;

/** Les îles ouvertes dès le début : une de français, une de maths. Le pont entre elles est déjà là. */
export const START_ISLANDS: BiomeId[] = ['foret', 'plaine'];

/**
 * Les ouvrages : un sentier de pierres de gué entre deux îles qui se touchent, un pont entre deux îles au même niveau, un bac (radeau) sur un large bras de mer, un escalier taillé
 * pour monter d'un niveau, un tunnel dans la montagne pour en monter deux, un col pour monter tout en haut.
 */
export type BridgeKind = 'pont' | 'bac' | 'escalier' | 'tunnel' | 'col' | 'sentier';

/** Ce qu'il faut en plus des blocs : rien, le premier plan de l'île de départ terminé, ou son Gardien vaincu. */
export type BridgeCondition = 'aucune' | 'plan' | 'gardien';

export interface BridgeDef {
  id: string;
  from: BiomeId;
  to: BiomeId;
  kind: BridgeKind;
  /** Nombre de blocs (de n'importe quel type gagné sur une île) pour le construire ; 0 = pont déjà construit. */
  cost: number;
}

/** La condition d'un ouvrage dépend de sa nature : l'escalier veut des bâtisseurs (un plan), le tunnel et le col un Gardien vaincu. */
export const CONDITION_OF: Record<BridgeKind, BridgeCondition> = {
  pont: 'aucune',
  bac: 'aucune',
  escalier: 'plan',
  tunnel: 'gardien',
  col: 'gardien',
  sentier: 'aucune',
};

export const KIND_NAME: Record<BridgeKind, string> = {
  pont: 'Pont',
  bac: 'Bac',
  escalier: 'Escalier taillé',
  tunnel: 'Tunnel',
  col: 'Col',
  sentier: 'Sentier',
};

const b = (from: BiomeId, to: BiomeId, kind: BridgeKind, cost: number): BridgeDef => ({ id: `${from}-${to}`, from, to, kind, cost });

/** Les ouvrages possibles, entre îles voisines. Depuis la Forêt, deux directions : la Mine ou la Ferme. */
export const BRIDGES: BridgeDef[] = [
  // Basses Terres (6e) : des ponts, et deux bacs sur les bras de mer les plus larges.
  b('foret', 'mine', 'sentier', 3),
  b('foret', 'ferme', 'pont', 3),
  b('mine', 'carriere', 'pont', 5),
  b('ferme', 'tour', 'sentier', 5),
  b('foret', 'plaine', 'pont', 0),
  b('plaine', 'riviere', 'bac', 3),
  b('mine', 'riviere', 'pont', 4),
  b('plaine', 'volcan', 'pont', 3),
  b('ferme', 'volcan', 'bac', 4),
  // Vers les Collines (5e) : des escaliers taillés, qui demandent un premier plan terminé.
  b('plaine', 'glacier', 'escalier', 5),
  b('riviere', 'marche', 'escalier', 5),
  b('glacier', 'marche', 'sentier', 6),
  b('foret', 'carrefour', 'escalier', 5),
  b('mine', 'marais', 'escalier', 5),
  b('carrefour', 'marais', 'sentier', 6),
  // Vers les Monts (4e) : escaliers depuis les collines, tunnels depuis la mer (un Gardien vaincu).
  b('volcan', 'forge', 'tunnel', 5),
  b('glacier', 'forge', 'escalier', 6),
  b('marche', 'atelier', 'escalier', 6),
  b('ferme', 'falaise', 'tunnel', 5),
  b('carrefour', 'falaise', 'escalier', 6),
  b('carriere', 'cabinet', 'tunnel', 5),
  b('marais', 'cabinet', 'escalier', 6),
  // Vers les Sommets (3e).
  b('forge', 'belvedere', 'escalier', 7),
  b('marche', 'donnees', 'tunnel', 6),
  b('forge', 'phare', 'escalier', 7),
  b('tour', 'textes', 'col', 6),
  b('falaise', 'textes', 'escalier', 7),
];

/** Les blocs qui servent à payer un ouvrage : ceux des îles (et les coffres), jamais les kits de finition des plans. */
export const BRIDGE_BLOCKS: BlockId[] = [
  'bois',
  'pierre',
  'sable',
  'terre',
  'verre',
  'brique',
  'galet',
  'obsidienne',
  'glace',
  'toile',
  'panneau',
  'tourbe',
  'acier',
  'calque',
  'ardoise',
  'parchemin',
  'marbre',
  'quartz',
  'prisme',
  'lentille',
  'or',
  'cristal',
];

export function getBridge(id: string): BridgeDef | undefined {
  return BRIDGES.find((b) => b.id === id);
}

/** Les ponts qui touchent une île. */
export function bridgesOf(island: BiomeId): BridgeDef[] {
  return BRIDGES.filter((b) => b.from === island || b.to === island);
}

export function otherEnd(bridge: BridgeDef, island: BiomeId): BiomeId {
  return bridge.from === island ? bridge.to : bridge.from;
}

/** Les îles que l'on peut atteindre depuis les îles de départ par les ponts construits. */
export function reachableIslands(bridges: string[]): Set<BiomeId> {
  const built = new Set([...bridges, ...BRIDGES.filter((b) => b.cost === 0).map((b) => b.id)]);
  const seen = new Set<BiomeId>(START_ISLANDS);
  const queue = [...START_ISLANDS];
  while (queue.length) {
    const here = queue.shift()!;
    for (const b of bridgesOf(here)) {
      if (!built.has(b.id)) continue;
      const there = otherEnd(b, here);
      if (seen.has(there)) continue;
      seen.add(there);
      queue.push(there);
    }
  }
  return seen;
}

/** Une île est ouverte quand un chemin de ponts construits y mène. */
export function isBiomeUnlocked(island: BiomeId, bridges: string[]): boolean {
  return reachableIslands(bridges).has(island);
}

/** Ce que sait le monde pour juger une condition : les étoiles et les plans posés. */
export interface WorldProgress {
  progress: Record<string, { stars: number }>;
  plans: Record<string, string[]>;
}

export type BridgeState = 'built' | 'buildable' | 'blocked' | 'far';

/** La condition d'un ouvrage est-elle remplie depuis une île ouverte qu'il touche ? */
export function conditionMet(bridge: BridgeDef, bridges: string[], world: WorldProgress): boolean {
  const condition = CONDITION_OF[bridge.kind];
  if (condition === 'aucune') return true;
  const open = reachableIslands(bridges);
  return [bridge.from, bridge.to]
    .filter((island) => open.has(island))
    .some((island) => {
      if (condition === 'gardien') return isBossBeaten(island, world.progress);
      const first = plansFor(island)[0];
      return Boolean(first) && isPlanDone(first, world.plans);
    });
}

/** Ce qu'il reste à faire pour la condition d'un ouvrage, depuis une île ouverte (pour l'expliquer à l'élève). */
export function conditionText(bridge: BridgeDef, bridges: string[]): string | null {
  const condition = CONDITION_OF[bridge.kind];
  if (condition === 'aucune') return null;
  const open = reachableIslands(bridges);
  const island = [bridge.from, bridge.to].find((i) => open.has(i)) ?? bridge.from;
  const name = getBiome(island)?.name ?? island;
  if (condition === 'gardien') return `Bats d’abord le Gardien de ${name}.`;
  const first = plansFor(island)[0];
  return `Termine d’abord le plan « ${first?.name ?? 'premier plan'} » de ${name}.`;
}

/**
 * Construit ; constructible (une de ses deux îles est ouverte, la condition est remplie) ; bloqué (île ouverte mais
 * condition à remplir) ; ou trop loin pour l'instant. Sans `world`, les conditions ne sont pas regardées.
 */
export function bridgeState(bridge: BridgeDef, bridges: string[], world?: WorldProgress): BridgeState {
  if (bridge.cost === 0 || bridges.includes(bridge.id)) return 'built';
  const open = reachableIslands(bridges);
  if (!open.has(bridge.from) && !open.has(bridge.to)) return 'far';
  return !world || conditionMet(bridge, bridges, world) ? 'buildable' : 'blocked';
}

/** Les ouvrages proposés maintenant (constructibles ou bloqués par une condition), qui touchent une île donnée (ou tous). */
export function buildableBridges(bridges: string[], island?: BiomeId, world?: WorldProgress): BridgeDef[] {
  return (island ? bridgesOf(island) : BRIDGES).filter((b) => {
    const state = bridgeState(b, bridges, world);
    return state === 'buildable' || state === 'blocked';
  });
}

/** Combien de blocs de l'inventaire peuvent payer un pont. */
export function payableBlocks(inventory: Partial<Record<BlockId, number>>): number {
  return BRIDGE_BLOCKS.reduce((n, id) => n + (inventory[id] ?? 0), 0);
}

export type BuildBridgeResult =
  | { ok: true; bridges: string[]; inventory: Partial<Record<BlockId, number>>; used: Partial<Record<BlockId, number>> }
  | { ok: false; reason: 'inconnu' | 'construit' | 'loin' | 'blocs' | 'plan' | 'gardien'; missing?: number };

/**
 * Paie et construit un pont : les blocs sont pris dans l'inventaire, les types les plus nombreux d'abord
 * (on garde ainsi les blocs rares pour les plans).
 */
export function buildBridge(id: string, bridges: string[], inventory: Partial<Record<BlockId, number>>, world?: WorldProgress): BuildBridgeResult {
  const bridge = getBridge(id);
  if (!bridge) return { ok: false, reason: 'inconnu' };
  const state = bridgeState(bridge, bridges, world);
  if (state === 'built') return { ok: false, reason: 'construit' };
  if (state === 'far') return { ok: false, reason: 'loin' };
  if (state === 'blocked') return { ok: false, reason: CONDITION_OF[bridge.kind] === 'gardien' ? 'gardien' : 'plan' };
  const have = payableBlocks(inventory);
  if (have < bridge.cost) return { ok: false, reason: 'blocs', missing: bridge.cost - have };
  const next = { ...inventory };
  const used: Partial<Record<BlockId, number>> = {};
  let left = bridge.cost;
  while (left > 0) {
    const richest = BRIDGE_BLOCKS.reduce((best, b) => ((next[b] ?? 0) > (next[best] ?? 0) ? b : best), BRIDGE_BLOCKS[0]);
    const take = Math.min(left, next[richest] ?? 0);
    next[richest] = (next[richest] ?? 0) - take;
    if (!next[richest]) delete next[richest];
    used[richest] = (used[richest] ?? 0) + take;
    left -= take;
  }
  return { ok: true, bridges: [...bridges, bridge.id], inventory: next, used };
}

/** Le plus court chemin de ponts (construits ou non) depuis une île de départ jusqu'à une île. */
export function pathTo(island: BiomeId): BridgeDef[] {
  const prev = new Map<BiomeId, BridgeDef | null>(START_ISLANDS.map((s) => [s, null]));
  const queue = [...START_ISLANDS];
  while (queue.length) {
    const here = queue.shift()!;
    if (here === island) break;
    for (const b of bridgesOf(here)) {
      const there = otherEnd(b, here);
      if (prev.has(there)) continue;
      prev.set(there, b);
      queue.push(there);
    }
  }
  const path: BridgeDef[] = [];
  let at: BiomeId | undefined = island;
  while (at && prev.get(at)) {
    const b = prev.get(at)!;
    path.unshift(b);
    at = otherEnd(b, at);
  }
  return path;
}

/**
 * Anciennes sauvegardes (avant les ponts) : les îles s'ouvraient en chaîne, quand une quête de l'île précédente
 * avait une étoile. On construit gratuitement les ponts qui mènent aux îles déjà ouvertes.
 */
export function bridgesFromLegacyProgress(progress: Record<string, { stars: number }>): string[] {
  const built = new Set<string>();
  for (let i = 1; i < BIOMES.length; i++) {
    const previous = BIOMES[i - 1];
    const starred = Object.entries(progress).some(([id, p]) => id.startsWith(`${previous.id}-`) && p.stars >= 1);
    if (!starred) break;
    for (const b of pathTo(BIOMES[i].id)) built.add(b.id);
  }
  return [...built];
}
