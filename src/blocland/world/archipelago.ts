// Les quatre archipels et ce qui relie les îles : les ouvrages (pont, bac, sentier, escalier taillé, tunnel, col) à
// l'intérieur d'un archipel, et les voyages du Bloc-Navire d'un archipel au suivant.
// Un ouvrage coûte des blocs gagnés n'importe où ; certains demandent aussi un plan terminé ou un Gardien vaincu
// sur l'île de départ. Une île s'ouvre quand un chemin d'ouvrages construits (et de voyages faits) y mène depuis une
// île de départ. Un voyage fait reste fait : on revient toujours en arrière.
// Générateur pur : partagé entre le monde 3D, les pages simples et le moteur.
import { BLOC, BIOMES, getBiome, type BiomeDef, type BiomeId, type BlockId } from '../biomes';
import { lv2Courante, type Lv2Choice } from '../../core/settings';
import { isBossBeaten } from '../bossCore';
import { ARCHIPELAGO_IDS, archipelagoOfIsland, type ArchipelagoId } from './archipels';
import { plansFor, isPlanDone } from './plans';

/** La place de chaque île est dans `map.ts` (MAP). */

export type { ArchipelagoId };

/** Un archipel : une classe, un nom, une île-port (le Bloc-Navire s'y construit et y accoste) et ses îles de départ. */
export interface ArchipelagoDef {
  classe: ArchipelagoId;
  /**
   * Le nom commun, celui des données (le site de documentation, les tests) : sans article ni majuscule initiale
   * d'article, « Premiers Rivages » → « les Premiers Rivages ». Ce que lit l'élève passe par les textes de l'univers
   * affiché (`archipels` de src/univers/), jamais par ce champ (GD-1).
   */
  name: string;
  port: BiomeId;
  /** Les îles ouvertes dès qu'on est dans l'archipel. */
  starts: BiomeId[];
  /** Comment on y arrive : par la mer, par les airs, par le ciel (rien pour le premier). */
  travel: 'mer' | 'airs' | 'ciel' | null;
  /** L'île de l'école du village (une île de départ) : les missions du portail y rapportent ses blocs. */
  school: BiomeId;
}

export const ARCHIPELAGOS: ArchipelagoDef[] = [
  { classe: '6e', name: 'Premiers Rivages', port: 'maths-6e-calculation', starts: ['french-6e-phonology', 'maths-6e-calculation'], travel: null, school: 'french-6e-phonology' },
  { classe: '5e', name: 'Îles Brumeuses', port: 'maths-5e-proportionality', starts: ['maths-5e-proportionality'], travel: 'mer', school: 'maths-5e-proportionality' },
  { classe: '4e', name: 'Anciens Ateliers', port: 'maths-4e-algebra', starts: ['maths-4e-algebra'], travel: 'airs', school: 'maths-4e-algebra' },
  { classe: '3e', name: 'Îles du Ciel', port: 'maths-3e-functions', starts: ['maths-3e-functions'], travel: 'ciel', school: 'maths-3e-functions' },
];

/**
 * Le nom de chaque archipel dans un univers (« Basses Terres »), sans article : ce que lit l'élève. Les règles et les
 * phrases communes le reçoivent de l'appelant, qui le prend dans les textes de l'univers affiché (GD-1).
 */
export type NomsArchipels = Record<ArchipelagoId, string>;

/** Les noms communs des données (`name`), pour le site de documentation et les tests. */
export const NOMS_ARCHIPELS = Object.fromEntries(ARCHIPELAGOS.map((a) => [a.classe, a.name])) as NomsArchipels;

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

/** « Archipel de 5e — Les Collines du Large », avec les noms de l'univers affiché. */
export function archipelagoTitle(a: ArchipelagoId, noms: NomsArchipels): string {
  return `Archipel de ${a} — Les ${noms[a]}`;
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
  // Premiers Rivages (6e) : des ponts, et deux bacs sur les bras de mer les plus larges.
  b('french-6e-phonology', 'french-6e-letter-confusion', 'sentier', 3),
  b('french-6e-phonology', 'french-6e-grammar-spelling', 'pont', 3),
  b('french-6e-letter-confusion', 'french-6e-word-spelling', 'pont', 5),
  b('french-6e-grammar-spelling', 'french-6e-reading', 'sentier', 5),
  b('french-6e-phonology', 'maths-6e-calculation', 'pont', 0),
  b('maths-6e-calculation', 'maths-6e-fractions', 'bac', 3),
  b('french-6e-letter-confusion', 'maths-6e-fractions', 'pont', 4),
  b('maths-6e-calculation', 'maths-6e-decimals', 'pont', 3),
  b('french-6e-grammar-spelling', 'maths-6e-decimals', 'bac', 4),
  // Les îles d'anglais, derrière : un pont depuis la Ferme, un depuis la Forêt, un sentier entre les deux.
  b('french-6e-grammar-spelling', 'english-6e-vocabulary', 'pont', 5),
  b('french-6e-phonology', 'english-6e-grammar', 'pont', 5),
  b('english-6e-vocabulary', 'english-6e-grammar', 'sentier', 4),
  // Îles Brumeuses (5e) : le Marché est le port ; deux isthmes et un pont entre les deux paires.
  b('maths-5e-signed-numbers', 'maths-5e-proportionality', 'sentier', 6),
  b('maths-5e-proportionality', 'french-5e-conjugation', 'pont', 4),
  b('french-5e-homophones', 'french-5e-conjugation', 'sentier', 6),
  // Les îles d'anglais, à droite : un pont depuis le Marché (le port), un depuis le Marais, un entre les deux.
  b('maths-5e-proportionality', 'english-5e-vocabulary', 'pont', 6),
  b('french-5e-conjugation', 'english-5e-grammar', 'pont', 6),
  b('english-5e-vocabulary', 'english-5e-grammar', 'pont', 5),
  // La LV2, en bout de chemin : un pont depuis le Comptoir vers le Relais des voyageurs, à l'est ; rien n'en dépend.
  b('english-5e-vocabulary', 'lv2-5e-introductions', 'pont', 6),
  // Anciens Ateliers (4e) : l'Atelier est le port ; un escalier taillé vers le Cabinet (un plan de la Falaise).
  b('maths-4e-algebra', 'maths-4e-powers', 'pont', 4),
  b('maths-4e-algebra', 'french-4e-agreement', 'pont', 4),
  b('french-4e-agreement', 'french-4e-vocabulary', 'escalier', 5),
  // Les îles d'anglais, aux deux bouts de la crête : un pont depuis la Forge, un depuis le Cabinet.
  b('maths-4e-powers', 'english-4e-grammar', 'pont', 6),
  b('french-4e-vocabulary', 'english-4e-comprehension', 'pont', 6),
  // La LV2, en bout de chemin : un pont depuis le Théâtre vers le Jardin des heures, à l'est ; rien n'en dépend.
  b('english-4e-comprehension', 'lv2-4e-daily-life', 'pont', 6),
  // Îles du Ciel (3e) : le Phare est le port ; un col à garde-fou vers l'Observatoire des textes (le Gardien du Phare).
  b('maths-3e-functions', 'maths-3e-geometry', 'pont', 5),
  b('maths-3e-functions', 'maths-3e-statistics', 'pont', 5),
  b('maths-3e-functions', 'french-3e-close-reading', 'col', 6),
  // Les îles d'anglais, aux deux bouts de l'arc : un pont depuis le Belvédère, un depuis l'Observatoire des données.
  b('maths-3e-geometry', 'english-3e-comprehension', 'pont', 7),
  b('maths-3e-statistics', 'english-3e-grammar', 'pont', 7),
  // La LV2, en bout de chemin : un pont depuis le Château vers le Refuge des carnets, à l'est ; rien n'en dépend.
  b('english-3e-grammar', 'lv2-3e-travel', 'pont', 7),
];

/**
 * Les anciennes liaisons entre classes (escaliers, tunnels, col du continent d'avant les archipels) : plus construites,
 * mais gardées pour lire les anciennes sauvegardes, où elles ouvraient les îles du collège.
 */
export const LEGACY_BRIDGES: BridgeDef[] = [
  b('maths-6e-calculation', 'maths-5e-signed-numbers', 'escalier', 5),
  b('maths-6e-fractions', 'maths-5e-proportionality', 'escalier', 5),
  b('french-6e-phonology', 'french-5e-homophones', 'escalier', 5),
  b('french-6e-letter-confusion', 'french-5e-conjugation', 'escalier', 5),
  b('maths-6e-decimals', 'maths-4e-powers', 'tunnel', 5),
  b('maths-5e-signed-numbers', 'maths-4e-powers', 'escalier', 6),
  b('maths-5e-proportionality', 'maths-4e-algebra', 'escalier', 6),
  b('french-6e-grammar-spelling', 'french-4e-agreement', 'tunnel', 5),
  b('french-5e-homophones', 'french-4e-agreement', 'escalier', 6),
  b('french-6e-word-spelling', 'french-4e-vocabulary', 'tunnel', 5),
  b('french-5e-conjugation', 'french-4e-vocabulary', 'escalier', 6),
  b('maths-4e-powers', 'maths-3e-geometry', 'escalier', 7),
  b('maths-5e-proportionality', 'maths-3e-statistics', 'tunnel', 6),
  b('maths-4e-powers', 'maths-3e-functions', 'escalier', 7),
  b('french-6e-reading', 'french-3e-close-reading', 'col', 6),
  b('french-4e-agreement', 'french-3e-close-reading', 'escalier', 7),
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

export const voyageId = (to: ArchipelagoId): string => `passage-${to}`;

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
  BLOC.bois,
  BLOC.pierre,
  BLOC.sable,
  BLOC.terre,
  BLOC.verre,
  BLOC.brique,
  BLOC.galet,
  BLOC.obsidienne,
  BLOC.glace,
  BLOC.toile,
  BLOC.panneau,
  BLOC.tourbe,
  BLOC.acier,
  BLOC.calque,
  BLOC.ardoise,
  BLOC.parchemin,
  BLOC.marbre,
  BLOC.quartz,
  BLOC.prisme,
  BLOC.lentille,
  BLOC.cabine,
  BLOC.cadran,
  BLOC.tuile,
  BLOC.lambris,
  BLOC.velours,
  BLOC.rail,
  BLOC.antenne,
  BLOC.taille,
  BLOC.dalle,
  BLOC.osier,
  BLOC.bardeau,
  BLOC.or,
  BLOC.cristal,
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

/**
 * Les mots de l'univers pour les Gardiens dans ce que disent les ouvrages et les objectifs (vaincus dans Blocland,
 * rallumés dans Archipéo) : les libellés de l'univers en cours (`textes.libelles`), passés par l'écran, la règle
 * n'important pas d'univers.
 */
export interface MotsDesGardiens {
  ouvrageGardien: string;
  navireGardiensManquants: (n: number, archipel: string) => string;
  gardienDabord: (ile: string) => string;
}

/** Ce qu'il reste à faire pour la condition d'un ouvrage, depuis une île ouverte (pour l'expliquer à l'élève). */
export function conditionText(bridge: BridgeDef, bridges: string[], mots: MotsDesGardiens): string | null {
  const condition = CONDITION_OF[bridge.kind];
  if (condition === 'aucune') return null;
  const open = reachableIslands(bridges);
  const island = [bridge.from, bridge.to].find((i) => open.has(i)) ?? bridge.from;
  const name = getBiome(island)?.name ?? island;
  if (condition === 'gardien') return mots.gardienDabord(name);
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

/**
 * Les ouvrages proposés maintenant (constructibles ou bloqués par une condition), qui touchent une île donnée (ou tous).
 * Avec « Pas de LV2 », aucun ne mène à l'île de la LV2 : l'élève n'y dépense pas de blocs.
 */
export function buildableBridges(bridges: string[], island?: BiomeId, world?: WorldProgress, lv2: Lv2Choice = lv2Courante()): BridgeDef[] {
  return (island ? bridgesOf(island) : BRIDGES).filter((b) => {
    if (lv2 === 'none' && [b.from, b.to].some((id) => getBiome(id)?.subject === 'lv2')) return false;
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
 * Anciennes sauvegardes (avant les ponts) : les îles s'ouvraient en chaîne, quand une mission de l'île précédente
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
