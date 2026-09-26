// Les quatre archipels et ce qui relie les îles : les ouvrages (pont, bac, sentier, escalier taillé, tunnel, col) à
// l'intérieur d'un archipel, et les voyages du Bloc-Navire d'un archipel au suivant.
// Un ouvrage coûte des blocs gagnés n'importe où ; certains demandent aussi un plan terminé ou un Gardien vaincu
// sur l'île de départ. Une île s'ouvre quand un chemin d'ouvrages construits (et de voyages faits) y mène depuis une
// île de départ. Un voyage fait reste fait : on revient toujours en arrière.
// Générateur pur : partagé entre le monde 3D, les pages simples et le moteur.
import { BIOMES, getBiome, type BiomeDef, type BiomeId, type BlockId } from '../biomes';
import { isBossBeaten } from '../bossCore';
import { ARCHIPELAGO_IDS, MAP, archipelagoOfIsland, type ArchipelagoId } from './map';
import { plansFor, isPlanDone } from './plans';

/** La place de chaque île est dans `map.ts` (MAP). */
export const ISLANDS = MAP;

export type { ArchipelagoId };

/** Un archipel : une classe, un nom, une île-port (le Bloc-Navire s'y construit et y accoste) et ses îles de départ. */
export interface ArchipelagoDef {
  classe: ArchipelagoId;
  /** Sans article ni majuscule initiale d'article : « Basses Terres » → « les Basses Terres ». */
  name: string;
  port: BiomeId;
  /** Les îles ouvertes dès qu'on est dans l'archipel. */
  starts: BiomeId[];
  /** Comment on y arrive : par la mer, par les airs, par le ciel (rien pour le premier). */
  travel: 'mer' | 'airs' | 'ciel' | null;
}

export const ARCHIPELAGOS: ArchipelagoDef[] = [
  { classe: '6e', name: 'Basses Terres', port: 'plaine', starts: ['foret', 'plaine'], travel: null },
  { classe: '5e', name: 'Collines du Large', port: 'marche', starts: ['marche'], travel: 'mer' },
  { classe: '4e', name: 'Monts de Feu', port: 'atelier', starts: ['atelier'], travel: 'airs' },
  { classe: '3e', name: 'Îles du Ciel', port: 'phare', starts: ['phare'], travel: 'ciel' },
];

export function getArchipelago(a: ArchipelagoId): ArchipelagoDef {
  return ARCHIPELAGOS.find((x) => x.classe === a)!;
}

/** L'archipel d'une île. */
export function archipelagoOf(island: BiomeId): ArchipelagoDef {
  return getArchipelago(archipelagoOfIsland(island));
}

/** Les îles d'un archipel, dans l'ordre de BIOMES. */
export function islandsOf(a: ArchipelagoId): BiomeDef[] {
  return BIOMES.filter((b) => b.classe === a);
}

/** « Archipel de 5e — Les Collines du Large ». */
export function archipelagoTitle(a: ArchipelagoId): string {
  return `Archipel de ${a} — Les ${getArchipelago(a).name}`;
}

/** L'archipel qui suit (ou précède) : `null` au bout. */
export function nextArchipelago(a: ArchipelagoId): ArchipelagoDef | null {
  const i = ARCHIPELAGO_IDS.indexOf(a);
  return i >= 0 && i + 1 < ARCHIPELAGOS.length ? ARCHIPELAGOS[i + 1] : null;
}
export function previousArchipelago(a: ArchipelagoId): ArchipelagoDef | null {
  const i = ARCHIPELAGO_IDS.indexOf(a);
  return i > 0 ? ARCHIPELAGOS[i - 1] : null;
}

/** Les îles ouvertes dès le début : une de français, une de maths. Le pont entre elles est déjà là. */
export const START_ISLANDS: BiomeId[] = ARCHIPELAGOS[0].starts;

/**
 * Les ouvrages : un sentier de pierres de gué entre deux îles qui se touchent, un pont entre deux îles, un bac (radeau)
 * sur un large bras de mer, un escalier taillé, un tunnel, un col. Tous relient deux îles du même archipel.
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

/** Les ouvrages possibles, entre îles voisines d'un même archipel. Depuis la Forêt, deux directions : la Mine ou la Ferme. */
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
  // Collines du Large (5e) : le Marché est le port ; deux isthmes et un pont entre les deux paires.
  b('glacier', 'marche', 'sentier', 6),
  b('marche', 'marais', 'pont', 4),
  b('carrefour', 'marais', 'sentier', 6),
  // Monts de Feu (4e) : l'Atelier est le port ; un escalier taillé vers le Cabinet (un plan de la Falaise).
  b('atelier', 'forge', 'pont', 4),
  b('atelier', 'falaise', 'pont', 4),
  b('falaise', 'cabinet', 'escalier', 5),
  // Îles du Ciel (3e) : le Phare est le port ; un col à garde-fou vers l'Observatoire des textes (le Gardien du Phare).
  b('phare', 'belvedere', 'pont', 5),
  b('phare', 'donnees', 'pont', 5),
  b('phare', 'textes', 'col', 6),
];

/**
 * Les anciennes liaisons entre classes (escaliers, tunnels, col du continent d'avant les archipels) : plus construites,
 * mais gardées pour lire les anciennes sauvegardes, où elles ouvraient les îles du collège.
 */
export const LEGACY_BRIDGES: BridgeDef[] = [
  b('plaine', 'glacier', 'escalier', 5),
  b('riviere', 'marche', 'escalier', 5),
  b('foret', 'carrefour', 'escalier', 5),
  b('mine', 'marais', 'escalier', 5),
  b('volcan', 'forge', 'tunnel', 5),
  b('glacier', 'forge', 'escalier', 6),
  b('marche', 'atelier', 'escalier', 6),
  b('ferme', 'falaise', 'tunnel', 5),
  b('carrefour', 'falaise', 'escalier', 6),
  b('carriere', 'cabinet', 'tunnel', 5),
  b('marais', 'cabinet', 'escalier', 6),
  b('forge', 'belvedere', 'escalier', 7),
  b('marche', 'donnees', 'tunnel', 6),
  b('forge', 'phare', 'escalier', 7),
  b('tour', 'textes', 'col', 6),
  b('falaise', 'textes', 'escalier', 7),
];

// ---------- Les voyages du Bloc-Navire ----------

/** Un voyage : du port d'un archipel au port du suivant. Fait une fois, il reste fait dans les deux sens. */
export interface VoyageDef {
  id: string;
  from: BiomeId;
  to: BiomeId;
  fromClasse: ArchipelagoId;
  toClasse: ArchipelagoId;
}

export const voyageId = (to: ArchipelagoId): string => `voyage-${to}`;

export const VOYAGES: VoyageDef[] = ARCHIPELAGOS.slice(1).map((a, i) => ({
  id: voyageId(a.classe),
  from: ARCHIPELAGOS[i].port,
  to: a.port,
  fromClasse: ARCHIPELAGOS[i].classe,
  toClasse: a.classe,
}));

export function getVoyage(id: string): VoyageDef | undefined {
  return VOYAGES.find((v) => v.id === id);
}

/** Les voyages à faire pour arriver jusqu'à une île (tous ceux qui mènent à son archipel). */
export function voyagesTo(island: BiomeId): VoyageDef[] {
  const a = archipelagoOfIsland(island);
  return VOYAGES.slice(0, ARCHIPELAGO_IDS.indexOf(a));
}

/** Les voyages qu'il reste à faire pour atteindre une île. */
export function remainingVoyages(island: BiomeId, bridges: string[]): VoyageDef[] {
  return voyagesTo(island).filter((v) => !bridges.includes(v.id));
}

/** Un archipel est atteint quand son port est ouvert (les voyages qui y mènent sont faits). */
export function isArchipelagoReached(a: ArchipelagoId, bridges: string[]): boolean {
  return reachableIslands(bridges).has(getArchipelago(a).port);
}

/** Les archipels atteints, dans l'ordre. */
export function reachedArchipelagos(bridges: string[]): ArchipelagoDef[] {
  return ARCHIPELAGOS.filter((a) => isArchipelagoReached(a.classe, bridges));
}

/** Combien de voyages sont faits (le niveau du Bloc-Navire : 0 coque en chantier, 1 voile, 2 ballon, 3 réacteur). */
export function launchedCount(bridges: string[]): number {
  return VOYAGES.filter((v) => bridges.includes(v.id)).length;
}

// ---------- Les blocs qui paient ----------

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

/** Les ouvrages qui touchent une île. */
export function bridgesOf(island: BiomeId): BridgeDef[] {
  return BRIDGES.filter((b) => b.from === island || b.to === island);
}

export function otherEnd(bridge: { from: BiomeId; to: BiomeId }, island: BiomeId): BiomeId {
  return bridge.from === island ? bridge.to : bridge.from;
}

/** Parcours en largeur depuis des îles, sur des liaisons dont on donne la liste, en ne suivant que celles qui sont « construites ». */
function reach(starts: BiomeId[], links: { id: string; from: BiomeId; to: BiomeId }[], built: (id: string) => boolean): Set<BiomeId> {
  const seen = new Set<BiomeId>(starts);
  const queue = [...starts];
  while (queue.length) {
    const here = queue.shift()!;
    for (const l of links) {
      if (l.from !== here && l.to !== here) continue;
      if (!built(l.id)) continue;
      const there = otherEnd(l, here);
      if (seen.has(there)) continue;
      seen.add(there);
      queue.push(there);
    }
  }
  return seen;
}

/** Les îles que l'on peut atteindre depuis les îles de départ par les ouvrages construits et les voyages faits. */
export function reachableIslands(bridges: string[]): Set<BiomeId> {
  const built = new Set([...bridges, ...BRIDGES.filter((b) => b.cost === 0).map((b) => b.id)]);
  return reach(START_ISLANDS, [...BRIDGES, ...VOYAGES], (id) => built.has(id));
}

/** Une île est ouverte quand un chemin d'ouvrages construits (et de voyages faits) y mène. */
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

/** Le plus court chemin d'ouvrages (construits ou non) depuis une île de départ de son archipel jusqu'à une île. */
export function pathTo(island: BiomeId): BridgeDef[] {
  const starts = archipelagoOf(island).starts;
  const prev = new Map<BiomeId, BridgeDef | null>(starts.map((s) => [s, null]));
  const queue = [...starts];
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

/** Les ouvrages qu'il reste à construire pour aller jusqu'à une île (le chemin le plus court dans son archipel). */
export function remainingPath(island: BiomeId, bridges: string[]): BridgeDef[] {
  return pathTo(island).filter((b) => bridgeState(b, bridges) !== 'built');
}

/**
 * Offre l'accès à des îles : les voyages qui mènent à leur archipel, puis le chemin d'ouvrages le plus court.
 * Rien n'est retiré ; les îles déjà ouvertes ne changent rien.
 */
export function grantAccess(bridges: string[], islands: Iterable<BiomeId>): string[] {
  const out = new Set(bridges);
  for (const island of islands) {
    if (reachableIslands([...out]).has(island)) continue;
    for (const v of voyagesTo(island)) out.add(v.id);
    for (const b of pathTo(island)) out.add(b.id);
  }
  return [...out];
}

/** Les îles qu'une ancienne sauvegarde ouvrait, avec ses ouvrages d'alors (liaisons entre classes comprises). */
export function legacyReachable(rawIds: string[]): Set<BiomeId> {
  const built = new Set([...rawIds, ...BRIDGES.filter((b) => b.cost === 0).map((b) => b.id)]);
  return reach(START_ISLANDS, [...BRIDGES, ...LEGACY_BRIDGES, ...VOYAGES], (id) => built.has(id));
}

/**
 * Anciennes sauvegardes (avant les ponts) : les îles s'ouvraient en chaîne, quand une quête de l'île précédente
 * avait une étoile. On offre l'accès aux îles déjà ouvertes.
 */
export function bridgesFromLegacyProgress(progress: Record<string, { stars: number }>): string[] {
  const opened: BiomeId[] = [];
  for (let i = 1; i < BIOMES.length; i++) {
    const previous = BIOMES[i - 1];
    const starred = Object.entries(progress).some(([id, p]) => id.startsWith(`${previous.id}-`) && p.stars >= 1);
    if (!starred) break;
    opened.push(BIOMES[i].id);
  }
  return grantAccess([], opened);
}
