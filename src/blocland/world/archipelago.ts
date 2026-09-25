// L'archipel : la place de chaque île et les ponts qui les relient. Un pont se construit avec des blocs gagnés
// n'importe où ; une île s'ouvre quand un chemin de ponts construits y mène depuis une île de départ.
// Générateur pur : partagé entre le monde 3D, les pages simples et le moteur.
import { BIOMES, type BiomeId, type BlockId } from '../biomes';

/** Colonne et rangée de chaque île. Rangée 0 : le français 6e, la Forêt au centre ; rangée 1 : les maths 6e ; rangée 2 : les maths du cycle 4 (devant) ; rangée −1 : le français du cycle 4 (derrière). */
export const ISLAND_POS: Record<BiomeId, { col: number; row: number }> = {
  carriere: { col: 0, row: 0 },
  mine: { col: 1, row: 0 },
  foret: { col: 2, row: 0 },
  ferme: { col: 3, row: 0 },
  tour: { col: 4, row: 0 },
  plaine: { col: 2, row: 1 },
  riviere: { col: 1, row: 1 },
  volcan: { col: 3, row: 1 },
  glacier: { col: 2, row: 2 },
  marche: { col: 1, row: 2 },
  carrefour: { col: 2, row: -1 },
  marais: { col: 1, row: -1 },
  forge: { col: 3, row: 2 },
  atelier: { col: 0, row: 2 },
  falaise: { col: 3, row: -1 },
  cabinet: { col: 0, row: -1 },
};

/** Les îles ouvertes dès le début : une de français, une de maths. Le pont entre elles est déjà là. */
export const START_ISLANDS: BiomeId[] = ['foret', 'plaine'];

export interface BridgeDef {
  id: string;
  from: BiomeId;
  to: BiomeId;
  /** Nombre de blocs (de n'importe quel type gagné sur une île) pour le construire ; 0 = pont déjà construit. */
  cost: number;
}

/** Les ponts possibles, entre îles voisines. Depuis la Forêt, deux directions : la Mine ou la Ferme. */
export const BRIDGES: BridgeDef[] = [
  { id: 'foret-mine', from: 'foret', to: 'mine', cost: 3 },
  { id: 'foret-ferme', from: 'foret', to: 'ferme', cost: 3 },
  { id: 'mine-carriere', from: 'mine', to: 'carriere', cost: 5 },
  { id: 'ferme-tour', from: 'ferme', to: 'tour', cost: 5 },
  { id: 'foret-plaine', from: 'foret', to: 'plaine', cost: 0 },
  { id: 'plaine-riviere', from: 'plaine', to: 'riviere', cost: 3 },
  { id: 'mine-riviere', from: 'mine', to: 'riviere', cost: 4 },
  { id: 'plaine-volcan', from: 'plaine', to: 'volcan', cost: 3 },
  { id: 'ferme-volcan', from: 'ferme', to: 'volcan', cost: 4 },
  // Cycle 4 : coûts plus élevés, les blocs des nouvelles îles servent.
  { id: 'plaine-glacier', from: 'plaine', to: 'glacier', cost: 6 },
  { id: 'riviere-marche', from: 'riviere', to: 'marche', cost: 6 },
  { id: 'glacier-marche', from: 'glacier', to: 'marche', cost: 6 },
  { id: 'foret-carrefour', from: 'foret', to: 'carrefour', cost: 6 },
  { id: 'mine-marais', from: 'mine', to: 'marais', cost: 6 },
  { id: 'carrefour-marais', from: 'carrefour', to: 'marais', cost: 6 },
  { id: 'volcan-forge', from: 'volcan', to: 'forge', cost: 7 },
  { id: 'glacier-forge', from: 'glacier', to: 'forge', cost: 7 },
  { id: 'marche-atelier', from: 'marche', to: 'atelier', cost: 7 },
  { id: 'ferme-falaise', from: 'ferme', to: 'falaise', cost: 7 },
  { id: 'carrefour-falaise', from: 'carrefour', to: 'falaise', cost: 7 },
  { id: 'carriere-cabinet', from: 'carriere', to: 'cabinet', cost: 7 },
  { id: 'marais-cabinet', from: 'marais', to: 'cabinet', cost: 7 },
];

/** Les blocs qui servent à payer un pont : ceux des îles (et les coffres), jamais les kits de finition des plans. */
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

export type BridgeState = 'built' | 'buildable' | 'far';

/** Construit, constructible (une de ses deux îles est ouverte) ou trop loin pour l'instant. */
export function bridgeState(bridge: BridgeDef, bridges: string[]): BridgeState {
  if (bridge.cost === 0 || bridges.includes(bridge.id)) return 'built';
  const open = reachableIslands(bridges);
  return open.has(bridge.from) || open.has(bridge.to) ? 'buildable' : 'far';
}

/** Les ponts que l'on peut construire maintenant, qui touchent une île donnée (ou tous). */
export function buildableBridges(bridges: string[], island?: BiomeId): BridgeDef[] {
  return (island ? bridgesOf(island) : BRIDGES).filter((b) => bridgeState(b, bridges) === 'buildable');
}

/** Combien de blocs de l'inventaire peuvent payer un pont. */
export function payableBlocks(inventory: Partial<Record<BlockId, number>>): number {
  return BRIDGE_BLOCKS.reduce((n, id) => n + (inventory[id] ?? 0), 0);
}

export type BuildBridgeResult =
  | { ok: true; bridges: string[]; inventory: Partial<Record<BlockId, number>>; used: Partial<Record<BlockId, number>> }
  | { ok: false; reason: 'inconnu' | 'construit' | 'loin' | 'blocs'; missing?: number };

/**
 * Paie et construit un pont : les blocs sont pris dans l'inventaire, les types les plus nombreux d'abord
 * (on garde ainsi les blocs rares pour les plans).
 */
export function buildBridge(id: string, bridges: string[], inventory: Partial<Record<BlockId, number>>): BuildBridgeResult {
  const bridge = getBridge(id);
  if (!bridge) return { ok: false, reason: 'inconnu' };
  const state = bridgeState(bridge, bridges);
  if (state === 'built') return { ok: false, reason: 'construit' };
  if (state === 'far') return { ok: false, reason: 'loin' };
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
