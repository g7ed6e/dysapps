// Les quatre archipels et ce qui relie les îles : les liaisons (pont, bac, sentier) à l'intérieur d'un archipel, et
// les voyages du Bloc-Navire d'un archipel au suivant. Depuis GD-9, une liaison relie chaque paire de lieux d'une
// région, au même prix, et ne demande rien d'autre que des blocs gagnés n'importe où ; sa nature suit son tracé.
// Les natures d'avant (escalier taillé, tunnel, col) ne servent plus qu'à relire les anciennes sauvegardes
// (`LEGACY_BRIDGES`). Une île s'ouvre quand un chemin de liaisons posées (et de voyages faits) y mène depuis une île
// de départ. Un voyage fait reste fait : on revient toujours en arrière.
// Générateur pur : partagé entre le monde 3D, les pages simples et le moteur.
import { ofPlace } from './placeArticle';
import { BLOC, BIOMES, getBiome, type BiomeDef, type BiomeId, type BlockId } from '../biomes';
import { lv2Courante, type Lv2Choice } from '../../core/settings';
import { ARCHIPELAGO_IDS, archipelagoOfIsland, type ArchipelagoId } from './archipelagos';
import { premierePartiePosee } from './parts';

/** La place de chaque île est dans `map.ts` (MAP). */

export type { ArchipelagoId };

/** Un archipel : une classe, un nom, une île-port (le Bloc-Navire s'y construit et y accoste) et ses îles de départ. */
export interface ArchipelagoDef {
  classe: ArchipelagoId;
  /**
   * Le nom commun, celui des données (le site de documentation, les tests) : sans article ni majuscule initiale
   * d'article, « Premiers Rivages » → « les Premiers Rivages ». Ce que lit l'élève passe par les textes de l'univers
   * affiché (`archipels` de src/universes/), jamais par ce champ (GD-1).
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
 * Les liaisons : un sentier de pierres de gué entre deux îles qui se touchent, un pont entre deux îles, un bac (radeau)
 * sur un large bras de mer. Toutes relient deux îles du même archipel. L'escalier taillé, le tunnel et le col ne sont
 * plus posés depuis GD-9 : ils ne servent qu'aux anciennes sauvegardes (`LEGACY_BRIDGES`).
 */
export type BridgeKind = 'pont' | 'bac' | 'escalier' | 'tunnel' | 'col' | 'sentier';

/** Ce qu'il faut en plus des blocs : rien, ou une mission réussie sur l'île de départ. Aucun Gardien (GD-7). */
export type BridgeCondition = 'aucune' | 'plan';

export interface BridgeDef {
  id: string;
  from: BiomeId;
  to: BiomeId;
  /** Nombre de blocs (de n'importe quel type gagné sur une île) pour le construire ; 0 = pont déjà construit. */
  cost: number;
  /**
   * Le tracé d'origine d'une liaison d'avant GD-9 (ses points de passage), gardé pour une liaison déjà construite que le
   * traceur ne refait pas : rien ne se perd (`bridgePath`, world/terrain/links.ts).
   */
  via?: readonly { x: number; y: number }[];
}

/** La condition d'une liaison : aucune depuis GD-9 (seul l'escalier d'avant voulait une mission réussie, `LEGACY_BRIDGES`). */
export const CONDITION_OF: Record<BridgeKind, BridgeCondition> = {
  pont: 'aucune',
  bac: 'aucune',
  escalier: 'plan',
  tunnel: 'aucune',
  col: 'aucune',
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

/** Une liaison d'avant GD-9, tracée à la main : sa nature est écrite avec elle. */
export type LegacyLink = BridgeDef & { kind: BridgeKind };

const b = (from: BiomeId, to: BiomeId, kind: BridgeKind, cost: number): LegacyLink => ({ id: `${from}-${to}`, from, to, kind, cost });
/**
 * Le prix d'une liaison (GD-9) : 4 blocs aux Premiers Rivages, 5 ailleurs, qu'elle ouvre un lieu ou relie deux lieux
 * ouverts ; le pont déjà construit au départ reste gratuit.
 */
export const LINK_PRICE: Record<ArchipelagoId, number> = { '6e': 4, '5e': 5, '4e': 5, '3e': 5 };

type Point = { x: number; y: number };

/** Une liaison du port qui existait avant GD-7 (même identifiant), au prix du port. */
const p = (from: BiomeId, to: BiomeId, kind: BridgeKind): LegacyLink => b(from, to, kind, LINK_PRICE[archipelagoOfIsland(from)]);

/** Une liaison d'avant GD-9, et si elle était une liaison du port en étoile (GD-7). */
export type LinkBeforeGd9 = LegacyLink & { etoile?: true };

/** Une liaison du port en étoile d'avant GD-9, avec ses points de passage s'il en fallait. */
const e = (from: BiomeId, to: BiomeId, kind: BridgeKind, via?: readonly Point[]): LinkBeforeGd9 => ({ ...p(from, to, kind), etoile: true, ...(via ? { via } : {}) });

/**
 * Les points de passage des liaisons du port (GD-7), entre l'ancrage des deux îles (`bridgePath`, world/terrain.ts) :
 * chaque tracé longe l'archipel sans toucher une autre île, un autre ouvrage, l'îlot d'un Gardien ou d'un monument ni la
 * jetée, et reste dans `worldBounds` (starPort.test.ts). Sans points de passage, la ligne droite.
 */
const VIA: Record<string, readonly Point[]> = {
  'maths-6e-calculation-french-6e-reading': [{ x: 61, y: 14 }, { x: 13, y: 14 }, { x: 13, y: 52 }],
  'maths-6e-calculation-french-6e-word-spelling': [{ x: 91, y: 21 }, { x: 91, y: 14 }, { x: 131, y: 14 }, { x: 131, y: 52 }],
  'french-6e-phonology-english-6e-vocabulary': [{ x: 61, y: 67 }, { x: 61, y: 84 }, { x: 56, y: 84 }, { x: 56, y: 104 }],
  'maths-5e-proportionality-french-5e-homophones': [{ x: 70, y: 336 }, { x: 70, y: 342 }, { x: 54, y: 342 }],
  'maths-3e-functions-english-3e-comprehension': [{ x: 50, y: 911 }, { x: 8, y: 911 }],
  'maths-3e-functions-english-3e-grammar': [{ x: 82, y: 915 }, { x: 87, y: 910 }, { x: 114, y: 910 }],
  'maths-4e-algebra-french-4e-vocabulary': [{ x: 86, y: 646 }, { x: 121, y: 646 }],
};

/**
 * Les liaisons d'avant GD-9, tracées à la main entre îles voisines d'un même archipel : leur identifiant (celui des
 * sauvegardes), leur sens, leur nature quand elle n'est ni un pont ni un bac, et leur tracé d'origine. Le modelé
 * dessiné d'Archipéo, en pause, lit encore leurs abords (`amorcesDOrigine`, world/terrain/links.ts).
 */
export const LINKS_BEFORE_GD9: readonly LinkBeforeGd9[] = [
  // Premiers Rivages (6e) : des ponts, et deux bacs sur les bras de mer les plus larges.
  // La Forêt et la Mine ne sont plus réunies par un isthme (GD-9, mainteneur, 5 octobre 2026) : un pont, au même identifiant.
  p('french-6e-phonology', 'french-6e-letter-confusion', 'pont'),
  p('french-6e-phonology', 'french-6e-grammar-spelling', 'pont'),
  b('french-6e-letter-confusion', 'french-6e-word-spelling', 'pont', 5),
  // La Ferme et la Tour ne sont plus réunies par un isthme (GD-9) : un pont, au même identifiant.
  b('french-6e-grammar-spelling', 'french-6e-reading', 'pont', 5),
  b('french-6e-phonology', 'maths-6e-calculation', 'pont', 0),
  p('maths-6e-calculation', 'maths-6e-fractions', 'bac'),
  b('french-6e-letter-confusion', 'maths-6e-fractions', 'pont', 4),
  p('maths-6e-calculation', 'maths-6e-decimals', 'pont'),
  b('french-6e-grammar-spelling', 'maths-6e-decimals', 'bac', 4),
  // Les îles d'anglais, derrière : un pont depuis la Ferme, un depuis la Forêt, un entre les deux. La Baie et l'Horloge ne
  // sont plus réunies par un isthme (GD-9, 5 octobre 2026) : un pont, au même identifiant et au même prix que le sentier.
  b('french-6e-grammar-spelling', 'english-6e-vocabulary', 'pont', 5),
  p('french-6e-phonology', 'english-6e-grammar', 'pont'),
  p('english-6e-vocabulary', 'english-6e-grammar', 'pont'),
  // Le port en étoile (GD-7) : de la Plaine ou de la Forêt, une liaison vers chaque île qu'elles ne touchaient pas. Deux
  // bacs longent l'archipel par le devant, entre les îlots des Gardiens et les côtes (la Carrière par l'est de la Plaine,
  // à l'écart de la jetée ; la Tour par l'est de son îlot) ; un pont de la Forêt à la Baie, à l'écart de l'Horloge.
  e('maths-6e-calculation', 'french-6e-reading', 'bac', VIA['maths-6e-calculation-french-6e-reading']),
  e('maths-6e-calculation', 'french-6e-word-spelling', 'bac', VIA['maths-6e-calculation-french-6e-word-spelling']),
  e('french-6e-phonology', 'english-6e-vocabulary', 'pont', VIA['french-6e-phonology-english-6e-vocabulary']),
  // Îles Brumeuses (5e) : le Marché est le port. Le Glacier et le Marché, le Carrefour et le Marais ne sont plus réunis
  // par un isthme (GD-9, mainteneur, 5 octobre 2026) : des ponts, aux mêmes identifiants.
  p('maths-5e-signed-numbers', 'maths-5e-proportionality', 'pont'),
  p('maths-5e-proportionality', 'french-5e-conjugation', 'pont'),
  b('french-5e-homophones', 'french-5e-conjugation', 'pont', 6),
  // Les îles d'anglais, à droite : un pont depuis le Marché (le port), un depuis le Marais, un entre les deux.
  p('maths-5e-proportionality', 'english-5e-vocabulary', 'pont'),
  b('french-5e-conjugation', 'english-5e-grammar', 'pont', 6),
  b('english-5e-vocabulary', 'english-5e-grammar', 'pont', 5),
  // Le port en étoile (GD-7) : un bac vers le Carrefour, entre l'arrière du Glacier et le phare du large. Le Manoir n'en a
  // pas : l'îlot du kiosque à musique, celui du Gardien du Manoir et une baleine ferment le passage (décision du
  // mainteneur, 3 octobre 2026).
  e('maths-5e-proportionality', 'french-5e-homophones', 'bac', VIA['maths-5e-proportionality-french-5e-homophones']),
  // La LV2, en bout de chemin : un pont depuis le Comptoir vers le Relais des voyageurs, à l'est ; rien n'en dépend.
  b('english-5e-vocabulary', 'lv2-5e-introductions', 'pont', 6),
  // Anciens Ateliers (4e) : l'Atelier est le port ; un escalier taillé vers le Cabinet (un plan de la Falaise).
  p('maths-4e-algebra', 'maths-4e-powers', 'pont'),
  p('maths-4e-algebra', 'french-4e-agreement', 'pont'),
  b('french-4e-agreement', 'french-4e-vocabulary', 'escalier', 5),
  // Les îles d'anglais, aux deux bouts de la crête : un pont depuis la Forge, un depuis le Cabinet.
  b('maths-4e-powers', 'english-4e-grammar', 'pont', 6),
  b('french-4e-vocabulary', 'english-4e-comprehension', 'pont', 6),
  // Le port en étoile (GD-7) : un bac droit vers la Gare, sous la Forge ; un bac vers le Cabinet, derrière la Falaise.
  // Le Théâtre n'en a pas : l'îlot de l'amphithéâtre et la clairière d'une baleine ferment le passage (décision du
  // mainteneur, 3 octobre 2026).
  e('maths-4e-algebra', 'english-4e-grammar', 'bac', VIA['maths-4e-algebra-english-4e-grammar']),
  e('maths-4e-algebra', 'french-4e-vocabulary', 'bac', VIA['maths-4e-algebra-french-4e-vocabulary']),
  // La LV2, en bout de chemin : un pont depuis le Théâtre vers le Jardin des heures, à l'est ; rien n'en dépend.
  b('english-4e-comprehension', 'lv2-4e-daily-life', 'pont', 6),
  // Îles du Ciel (3e) : le Phare est le port ; un col à garde-fou vers l'Observatoire des textes (le Gardien du Phare).
  p('maths-3e-functions', 'maths-3e-geometry', 'pont'),
  p('maths-3e-functions', 'maths-3e-statistics', 'pont'),
  p('maths-3e-functions', 'french-3e-close-reading', 'col'),
  // Les îles d'anglais, aux deux bouts de l'arc : un pont depuis le Belvédère, un depuis l'Observatoire des données.
  b('maths-3e-geometry', 'english-3e-comprehension', 'pont', 7),
  b('maths-3e-statistics', 'english-3e-grammar', 'pont', 7),
  // Le port en étoile (GD-7) : deux ponts vers les îles d'anglais, aux deux bouts de l'arc. Des ponts et pas des bacs :
  // au-dessus du plancher de nuages, un bac aurait ses poteaux dans le vide (décision du directeur artistique).
  e('maths-3e-functions', 'english-3e-comprehension', 'pont', VIA['maths-3e-functions-english-3e-comprehension']),
  e('maths-3e-functions', 'english-3e-grammar', 'pont', VIA['maths-3e-functions-english-3e-grammar']),
  // La LV2, en bout de chemin : un pont depuis le Château vers le Refuge des carnets, à l'est ; rien n'en dépend.
  b('english-3e-grammar', 'lv2-3e-travel', 'pont', 7),
];

// ---------- Les liaisons que pose l'élève (GD-9) ----------

/**
 * Ce que la grille sait des liaisons (GD-9, `world/linkGeometry.ts`) et que les règles demandent sans lire une case :
 * la nature d'une liaison dans la disposition (un pont ou un bac selon sa longueur, `null` si elle ne se trace pas) et
 * sa longueur en cases si on la posait après les liaisons `built` (`null` si elle ne tiendrait pas). Sans grille (un
 * test des règles seules), toute liaison se trace, en pont, de longueur nulle.
 */
export interface LinkGeometry {
  kind(b: BridgeDef, built: readonly string[]): BridgeKind | null;
  length(b: BridgeDef, built: readonly string[]): number | null;
}

const NO_GEOMETRY: LinkGeometry = { kind: () => null, length: () => 0 };
let geometry: LinkGeometry = NO_GEOMETRY;

/** La grille donne sa géométrie aux règles (une fois, au chargement de `world/linkGeometry.ts`). */
export function provideLinkGeometry(g: LinkGeometry): void {
  geometry = g;
}

/**
 * La géométrie des liaisons. Sans grille, seuls les tests des règles seules continuent (toute liaison en pont, de
 * longueur nulle) : ailleurs, c'est une erreur de chargement (`world/linkGeometry.ts` n'a pas été importé).
 */
function linkGeometry(): LinkGeometry {
  if (geometry === NO_GEOMETRY && import.meta.env?.MODE !== 'test')
    throw new Error('La géométrie des liaisons manque : importer world/linkGeometry.ts au démarrage.');
  return geometry;
}

/** La longueur d'une liaison posée après `built`, en cases, ou `null` si elle ne tiendrait pas (`LinkGeometry`). */
export function linkLength(b: BridgeDef, built: readonly string[]): number | null {
  return linkGeometry().length(b, built);
}

const isLegacy = (b: BridgeDef): b is LegacyLink => 'kind' in b;

/**
 * La nature d'une liaison, les liaisons `built` posées : celle écrite avec elle pour une liaison d'avant GD-9
 * (`LegacyLink` : les anciennes liaisons entre classes, les tracés d'origine) ; sinon selon son tracé dans la disposition (`LinkGeometry`) : un
 * sentier entre deux lieux réunis, un pont jusqu'à `SHORT_LINK` cases, un bac au-delà (un pont dans le ciel).
 */
export function linkKind(b: BridgeDef, built: readonly string[]): BridgeKind {
  if (isLegacy(b)) return b.kind;
  return linkGeometry().kind(b, built) ?? 'pont';
}

/** La longueur d'un pont au plus (GD-9) : au-delà, la liaison est un bac, et un raccourci n'est proposé qu'entre voisins. */
export const SHORT_LINK = 36;

function link(from: BiomeId, to: BiomeId, cost: number, via?: BridgeDef['via']): BridgeDef {
  return { id: `${from}-${to}`, from, to, cost, ...(via ? { via } : {}) };
}

/**
 * Toutes les liaisons possibles (GD-9) : une entre chaque paire de lieux d'une même région, une seule sorte de liaison.
 * Celles d'avant gardent leur identifiant, leur sens et leur tracé d'origine ; toutes coûtent le même prix
 * (`LINK_PRICE`), sauf le pont déjà construit au départ, gratuit. Leur nature suit leur tracé (`linkKind`) : un sentier
 * entre deux lieux réunis, un pont jusqu'à 36 cases, un bac au-delà ; l'escalier taillé et le col d'avant sont des
 * ponts ou des bacs comme les autres.
 */
export const BRIDGES: BridgeDef[] = ARCHIPELAGO_IDS.flatMap((a) => {
  const ids = BIOMES.filter((x) => x.classe === a).map((x) => x.id);
  const out: BridgeDef[] = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) {
      const avant = LINKS_BEFORE_GD9.find((l) => (l.from === ids[i] && l.to === ids[j]) || (l.from === ids[j] && l.to === ids[i]));
      const [from, to] = avant ? [avant.from, avant.to] : [ids[i], ids[j]];
      out.push(link(from, to, avant?.cost === 0 ? 0 : LINK_PRICE[a], avant?.via));
    }
  return out;
});

/**
 * Les anciennes liaisons entre classes (escaliers, tunnels, col du continent d'avant les archipels) : plus construites,
 * mais gardées pour lire les anciennes sauvegardes, où elles ouvraient les îles du collège.
 */
export const LEGACY_BRIDGES: LegacyLink[] = [
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

/** Les blocs qui servent à payer un ouvrage : ceux des îles ; ni l'or ni le cristal, devenus des trophées (GD-6), ni les kits de finition. */
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
  BLOC.mosaique,
  BLOC.chaume,
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

/**
 * La condition d'un ouvrage est-elle remplie depuis une île ouverte qu'il touche ? `open` : les îles ouvertes, quand
 * l'appelant les a déjà (`reachableIslands(bridges)`), pour ne pas les refaire à chaque ouvrage.
 */
export function conditionMet(bridge: BridgeDef, bridges: string[], world: WorldProgress, open = reachableIslands(bridges)): boolean {
  const condition = CONDITION_OF[linkKind(bridge, bridges)];
  if (condition === 'aucune') return true;
  return [bridge.from, bridge.to]
    .filter((island) => open.has(island))
    .some((island) => premierePartiePosee(island, world.plans));
}

/**
 * Les mots de l'univers pour les Gardiens dans ce que disent les objectifs (vaincus dans Blocland, rallumés dans
 * Archipéo) : les libellés de l'univers en cours (`textes.libelles`), passés par l'écran, la règle
 * n'important pas d'univers.
 */
export interface MotsDesGardiens {
  navireGardiensManquants: (n: number, archipel: string) => string;
}

/** Ce qu'il reste à faire pour la condition d'un ouvrage, depuis une île ouverte (pour l'expliquer à l'élève). */
export function conditionText(bridge: BridgeDef, bridges: string[]): string | null {
  const condition = CONDITION_OF[linkKind(bridge, bridges)];
  if (condition === 'aucune') return null;
  const open = reachableIslands(bridges);
  const island = [bridge.from, bridge.to].find((i) => open.has(i)) ?? bridge.from;
  const name = getBiome(island)?.name ?? island;
  return `Réussis d’abord une mission ${ofPlace(name)}.`;
}

/**
 * Construit ; constructible (une de ses deux îles est ouverte, la condition est remplie) ; bloqué (île ouverte mais
 * condition à remplir) ; ou trop loin pour l'instant. Sans `world`, les conditions ne sont pas regardées. `open` : les
 * îles ouvertes, si l'appelant les a déjà.
 */
export function bridgeState(bridge: BridgeDef, bridges: string[], world?: WorldProgress, open?: Set<BiomeId>): BridgeState {
  if (bridge.cost === 0 || bridges.includes(bridge.id)) return 'built';
  const ouvertes = open ?? reachableIslands(bridges);
  if (!ouvertes.has(bridge.from) && !ouvertes.has(bridge.to)) return 'far';
  // Une liaison qui ne tiendrait pas (elle couperait un lieu ou une liaison posée, ou serait trop longue) : pas proposée.
  const n = linkLength(bridge, bridges);
  if (n === null) return 'far';
  // Un raccourci entre deux lieux ouverts : entre voisins seulement (`SHORT_LINK` cases au plus), le budget en dépend.
  if (ouvertes.has(bridge.from) && ouvertes.has(bridge.to) && n > SHORT_LINK) return 'far';
  return !world || conditionMet(bridge, bridges, world, ouvertes) ? 'buildable' : 'blocked';
}

/** Une liaison qui ouvre un lieu : un seul de ses deux bouts est ouvert. */
export function opensAnIsland(b: BridgeDef, open: Set<BiomeId>): boolean {
  return open.has(b.from) !== open.has(b.to);
}

/**
 * Les liaisons qui ouvrent un lieu fermé `island`, depuis chaque lieu ouvert d'où elles tiennent, de la plus courte à la
 * plus longue (puis dans l'ordre des données) : la première part du lieu relié le plus proche, les autres sont les
 * autres départs qu'on peut choisir (GD-9, « Relier »). Vide si aucune ne tient.
 */
export function linksToIsland(island: BiomeId, bridges: string[], open = reachableIslands(bridges)): BridgeDef[] {
  if (open.has(island)) return [];
  return bridgesOf(island)
    .filter((b) => open.has(otherEnd(b, island)))
    .map((b, i) => ({ b, i, n: linkLength(b, bridges) }))
    .filter((x): x is { b: BridgeDef; i: number; n: number } => x.n !== null)
    .sort((p, q) => p.n - q.n || p.i - q.i)
    .map((x) => x.b);
}

/**
 * Le départ d'une liaison vers un lieu fermé (GD-9, « Relier ») : celle qui part du lieu relié le plus proche, la
 * première de `linksToIsland`, ou `null` si aucune ne tient. La seule règle du choix : la phrase de l'île pâle
 * (`lockedHint`), son bouton « Relier » et le fantôme du monde (`buildableBridges`) la lisent tous.
 */
export function nearestDeparture(island: BiomeId, bridges: string[], open = reachableIslands(bridges)): BridgeDef | null {
  return linksToIsland(island, bridges, open)[0] ?? null;
}

/**
 * Les liaisons proposées maintenant (constructibles ou bloquées par une condition), qui touchent une île donnée (ou
 * toutes), GD-9 : vers un lieu fermé, celle qui part du lieu relié le plus proche (sur le lieu fermé lui-même, tous ses
 * départs possibles, `linksToIsland`) ; entre deux lieux ouverts, un raccourci entre voisins (`SHORT_LINK` cases au
 * plus). Avec « Pas de LV2 », aucune ne mène à l'île de la LV2 : l'élève n'y dépense pas de blocs. `open` : les îles
 * ouvertes (`reachableIslands(bridges)`), si l'appelant les a déjà.
 */
export function buildableBridges(bridges: string[], island?: BiomeId, world?: WorldProgress, lv2: Lv2Choice = lv2Courante(), open = reachableIslands(bridges)): BridgeDef[] {
  const proposees = new Set<string>();
  for (const b of BRIDGES) {
    if (open.has(b.from) && open.has(b.to)) {
      const n = bridgeState(b, bridges, undefined, open) === 'buildable' ? linkLength(b, bridges) : null;
      if (n !== null && n <= SHORT_LINK) proposees.add(b.id);
    }
  }
  const fermees = new Set(BRIDGES.filter((b) => opensAnIsland(b, open)).map((b) => (open.has(b.from) ? b.to : b.from)));
  for (const f of fermees) {
    if (island === f) for (const b of linksToIsland(f, bridges, open)) proposees.add(b.id);
    else {
      const b = nearestDeparture(f, bridges, open);
      if (b) proposees.add(b.id);
    }
  }
  return (island ? bridgesOf(island) : BRIDGES).filter((b) => {
    if (!proposees.has(b.id)) return false;
    if (lv2 === 'none' && [b.from, b.to].some((id) => getBiome(id)?.subject === 'lv2')) return false;
    const state = bridgeState(b, bridges, world, open);
    return state === 'buildable' || state === 'blocked';
  });
}

/** Combien de blocs de l'inventaire peuvent payer un pont. */
export function payableBlocks(inventory: Partial<Record<BlockId, number>>): number {
  return BRIDGE_BLOCKS.reduce((n, id) => n + (inventory[id] ?? 0), 0);
}

export type BuildBridgeResult =
  | { ok: true; bridges: string[]; inventory: Partial<Record<BlockId, number>>; used: Partial<Record<BlockId, number>> }
  | { ok: false; reason: 'inconnu' | 'construit' | 'loin' | 'blocs' | 'plan'; missing?: number };

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
  if (state === 'blocked') return { ok: false, reason: 'plan' };
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

/**
 * Les liaisons qu'il reste à poser pour aller jusqu'à une île (GD-9), de la première à la dernière : le plus court
 * chemin de liaisons qui tiennent, depuis les lieux reliés (ou, dans une région pas encore atteinte, depuis ses lieux
 * de départ). Vide si l'île est ouverte, ou si aucun chemin ne tient.
 */
export function remainingPath(island: BiomeId, bridges: string[]): BridgeDef[] {
  const open = reachableIslands(bridges);
  if (open.has(island)) return [];
  // Une liaison directe : le même départ que « Relier » et le fantôme (`nearestDeparture`).
  const direct = nearestDeparture(island, bridges, open);
  if (direct) return [direct];
  const depart = [...open].filter((id) => archipelagoOfIsland(id) === archipelagoOfIsland(island));
  const vus = new Map<BiomeId, BridgeDef | null>((depart.length ? depart : archipelagoOf(island).starts).map((id) => [id, null]));
  // Rang par rang : au même nombre de liaisons, chaque lieu est atteint par la plus courte d'entre elles.
  for (let rang = [...vus.keys()]; rang.length && !vus.has(island); ) {
    const suivant = new Map<BiomeId, { b: BridgeDef; n: number }>();
    for (const ici of rang)
      for (const b of unseenLinksFrom(ici, bridges, vus)) {
        const la = otherEnd(b, ici);
        const n = linkLength(b, bridges) ?? 0;
        const mieux = suivant.get(la);
        if (!mieux || n < mieux.n) suivant.set(la, { b, n });
      }
    for (const [la, { b }] of suivant) vus.set(la, b);
    rang = [...suivant.keys()];
  }
  const chemin: BridgeDef[] = [];
  for (let at: BiomeId | undefined = island; at && vus.get(at); ) {
    const b = vus.get(at)!;
    chemin.unshift(b);
    at = otherEnd(b, at);
  }
  return chemin;
}

/** Les liaisons qui tiennent depuis un lieu vers un lieu pas encore vu, de la plus courte à la plus longue. */
function unseenLinksFrom(from: BiomeId, bridges: string[], vus: Map<BiomeId, BridgeDef | null>): BridgeDef[] {
  return bridgesOf(from)
    .filter((b) => !vus.has(otherEnd(b, from)))
    .map((b, i) => ({ b, i, n: linkLength(b, bridges) }))
    .filter((x): x is { b: BridgeDef; i: number; n: number } => x.n !== null)
    .sort((p, q) => p.n - q.n || p.i - q.i)
    .map((x) => x.b);
}

/** Les lieux ouverts d'une région par ses seules liaisons posées (`links`), depuis ses lieux de départ. */
function openInRegion(a: ArchipelagoId, links: readonly string[]): Set<BiomeId> {
  const open = new Set<BiomeId>(getArchipelago(a).starts);
  const posees = BRIDGES.filter((b) => archipelagoOfIsland(b.from) === a && (b.cost === 0 || links.includes(b.id)));
  for (let grew = true; grew; ) {
    grew = false;
    for (const b of posees)
      if (open.has(b.from) !== open.has(b.to)) {
        open.add(b.from);
        open.add(b.to);
        grew = true;
      }
  }
  return open;
}

/**
 * Toute une région reliée (GD-9), comme le ferait un élève qui pose chaque fois la liaison la plus courte vers le lieu
 * fermé le plus proche : les liaisons de `links`, puis celles-là, jusqu'à ce que tous les lieux soient ouverts ou
 * qu'aucune ne tienne plus. Le mode bâtisseur et le monde « tout construit » (le budget) la lisent.
 */
export function linkWholeRegion(a: ArchipelagoId, links: readonly string[]): string[] {
  const out = [...links];
  for (;;) {
    const open = openInRegion(a, out);
    let best: { b: BridgeDef; n: number } | null = null;
    for (const f of islandsOf(a)) {
      if (open.has(f.id)) continue;
      const b = linksToIsland(f.id, out, open)[0];
      const n = b ? linkLength(b, out) : null;
      if (b && n !== null && (!best || n < best.n)) best = { b, n };
    }
    if (!best) return out;
    out.push(best.b.id);
  }
}

/**
 * Le départ choisi d'une liaison vers un lieu fermé (GD-9, « Relier ») : `id` si c'est une liaison qui ouvre un lieu
 * depuis un autre départ que le lieu relié le plus proche (le monde dessine alors son fantôme à la place de celui du
 * plus proche), sinon `null`.
 */
export function chosenDeparture(id: string | null, bridges: string[]): string | null {
  const b = id ? getBridge(id) : undefined;
  if (!b) return null;
  const open = reachableIslands(bridges);
  if (!opensAnIsland(b, open) || bridgeState(b, bridges, undefined, open) !== 'buildable') return null;
  const ferme = open.has(b.from) ? b.to : b.from;
  return nearestDeparture(ferme, bridges, open)?.id === b.id ? null : b.id;
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
    // La liaison depuis le lieu relié le plus proche, si elle tient ; sinon le chemin le plus court en liaisons.
    const proche = linksToIsland(island, [...out])[0];
    for (const b of proche ? [proche] : pathTo(island)) out.add(b.id);
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
