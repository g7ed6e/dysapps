// Univers Blocland : biomes, blocs et créatures (noms et créatures originaux).
import type { Subject } from '../apps/registry';
import type { ProgrammeId } from '../programme';
import type { AnyIconName } from '../components/Icon';
import { lv2Courante, universCourant, type Lv2Choice } from '../core/settings';
import { nomAssemble } from './world/assemblage';
import { ILES } from './iles';

/** Une deuxième langue vivante (pas « Pas de LV2 »). */
export type Lv2 = Exclude<Lv2Choice, 'none'>;

/** Les identifiants des îles (ceux de docs/contenu/archipel.md, dans le même ordre ; vérifié par biomes.test.ts). */
export const BIOME_IDS = [
  'french-6e-phonology',
  'french-6e-letter-confusion',
  'french-6e-word-spelling',
  'french-6e-grammar-spelling',
  'french-6e-reading',
  'maths-6e-calculation',
  'maths-6e-fractions',
  'maths-6e-decimals',
  'maths-5e-signed-numbers',
  'maths-5e-proportionality',
  'french-5e-homophones',
  'french-5e-conjugation',
  'maths-4e-powers',
  'maths-4e-algebra',
  'french-4e-agreement',
  'french-4e-vocabulary',
  'maths-3e-geometry',
  'maths-3e-statistics',
  'maths-3e-functions',
  'french-3e-close-reading',
  'english-6e-vocabulary',
  'english-6e-grammar',
  'english-5e-vocabulary',
  'english-5e-grammar',
  'english-4e-comprehension',
  'english-4e-grammar',
  'english-3e-comprehension',
  'english-3e-grammar',
  'lv2-5e-introductions',
  'lv2-4e-daily-life',
  'lv2-3e-travel',
] as const;
export type BiomeId = (typeof BIOME_IDS)[number];
export type BlockId =
  | 'french-6e-phonology'
  | 'french-6e-letter-confusion'
  | 'french-6e-word-spelling'
  | 'french-6e-grammar-spelling'
  | 'french-6e-reading'
  | 'maths-6e-calculation'
  | 'maths-6e-fractions'
  | 'maths-6e-decimals'
  | 'maths-5e-signed-numbers'
  | 'maths-5e-proportionality'
  | 'french-5e-homophones'
  | 'french-5e-conjugation'
  | 'maths-4e-powers'
  | 'maths-4e-algebra'
  | 'french-4e-agreement'
  | 'french-4e-vocabulary'
  | 'maths-3e-geometry'
  | 'maths-3e-statistics'
  | 'maths-3e-functions'
  | 'french-3e-close-reading'
  | 'english-6e-vocabulary'
  | 'english-6e-grammar'
  | 'english-5e-vocabulary'
  | 'english-5e-grammar'
  | 'english-4e-comprehension'
  | 'english-4e-grammar'
  | 'english-3e-comprehension'
  | 'english-3e-grammar'
  | 'trophy-gold'
  | 'trophy-crystal'
  | 'lv2-5e-introductions'
  | 'lv2-4e-daily-life'
  | 'lv2-3e-travel'
  | 'compound-6e'
  | 'compound-5e'
  | 'compound-4e'
  | 'compound-3e'
  | 'roof'
  | 'door'
  | 'lantern'
  | 'fence'
  | 'stairs';

/**
 * Les ressources sous leur mot de Blocland (« Les mots de Blocland », docs/univers/blocland/fiche.md). Les règles et la
 * sauvegarde ne connaissent que l'identifiant neutre : la ressource d'un lieu porte l'identifiant du lieu, la ressource
 * composée celui de sa région (`compound-6e`), les trophées `trophy-gold` et `trophy-crystal`, les blocs de finition
 * leur mot anglais. Le rendu de Blocland (world/, three/, pixel/) écrit ses blocs avec ses propres mots : `BLOC.pierre`.
 */
export const BLOC = {
  bois: 'french-6e-phonology',
  pierre: 'french-6e-letter-confusion',
  sable: 'french-6e-word-spelling',
  terre: 'french-6e-grammar-spelling',
  verre: 'french-6e-reading',
  brique: 'maths-6e-calculation',
  galet: 'maths-6e-fractions',
  obsidienne: 'maths-6e-decimals',
  glace: 'maths-5e-signed-numbers',
  toile: 'maths-5e-proportionality',
  panneau: 'french-5e-homophones',
  tourbe: 'french-5e-conjugation',
  acier: 'maths-4e-powers',
  calque: 'maths-4e-algebra',
  ardoise: 'french-4e-agreement',
  parchemin: 'french-4e-vocabulary',
  marbre: 'maths-3e-geometry',
  quartz: 'maths-3e-statistics',
  prisme: 'maths-3e-functions',
  lentille: 'french-3e-close-reading',
  cabine: 'english-6e-vocabulary',
  cadran: 'english-6e-grammar',
  tuile: 'english-5e-vocabulary',
  lambris: 'english-5e-grammar',
  velours: 'english-4e-comprehension',
  rail: 'english-4e-grammar',
  antenne: 'english-3e-comprehension',
  taille: 'english-3e-grammar',
  dalle: 'lv2-5e-introductions',
  osier: 'lv2-4e-daily-life',
  bardeau: 'lv2-3e-travel',
  poutre: 'compound-6e',
  vitrail: 'compound-5e',
  engrenage: 'compound-4e',
  miroir: 'compound-3e',
  or: 'trophy-gold',
  cristal: 'trophy-crystal',
  toit: 'roof',
  porte: 'door',
  lanterne: 'lantern',
  barriere: 'fence',
  escalier: 'stairs',
} as const satisfies Record<string, BlockId>;

export interface BlockDef {
  id: BlockId;
  name: string;
  /** Face du dessus, face de côté (plus sombre), pour dessiner le cube en SVG. */
  top: string;
  side: string;
  /** Texture pixel du bloc en 3D (voir three/textures.ts). */
  texture: BlockTexture;
  rare?: boolean;
  /** Un bloc assemblé (GD-2) : il ne se gagne nulle part, il s'assemble dans le lieu du village prévu pour ça. */
  assemble?: boolean;
}

export type BlockTexture =
  | 'herbe'
  | 'terre'
  | 'pierre'
  | 'planches'
  | 'sable'
  | 'verre'
  | 'brique'
  | 'galet'
  | 'obsidienne'
  | 'glace'
  | 'toile'
  | 'panneau'
  | 'tourbe'
  | 'acier'
  | 'calque'
  | 'ardoise'
  | 'parchemin'
  | 'marbre'
  | 'quartz'
  | 'prisme'
  | 'lentille'
  | 'cabine'
  | 'cadran'
  | 'tuile'
  | 'lambris'
  | 'velours'
  | 'rail'
  | 'antenne'
  | 'taille'
  | 'or'
  | 'cristal'
  | 'dalle'
  | 'osier'
  | 'bardeau'
  | 'poutre'
  | 'vitrail'
  | 'engrenage'
  | 'miroir'
  | 'feuilles'
  | 'tronc'
  | 'nuage'
  | 'toit'
  | 'porte'
  | 'lanterne'
  | 'barriere'
  | 'escalier';

export const BLOCKS: Record<BlockId, BlockDef> = {
  'french-6e-phonology': { id: 'french-6e-phonology', name: 'Bois', top: '#c29a5f', side: '#9c7a48', texture: 'planches' },
  'french-6e-letter-confusion': { id: 'french-6e-letter-confusion', name: 'Pierre', top: '#9c9c9c', side: '#7d7d7d', texture: 'pierre' },
  'french-6e-word-spelling': { id: 'french-6e-word-spelling', name: 'Sable', top: '#e8e0b4', side: '#cfc48f', texture: 'sable' },
  'french-6e-grammar-spelling': { id: 'french-6e-grammar-spelling', name: 'Terre', top: '#94694a', side: '#6e4a2e', texture: 'terre' },
  'french-6e-reading': { id: 'french-6e-reading', name: 'Verre', top: '#d6f2f8', side: '#a9dbe6', texture: 'verre' },
  'maths-6e-calculation': { id: 'maths-6e-calculation', name: 'Brique', top: '#d98a5a', side: '#b8623a', texture: 'brique' },
  'maths-6e-fractions': { id: 'maths-6e-fractions', name: 'Galet', top: '#a9bccf', side: '#7f96ad', texture: 'galet' },
  'maths-6e-decimals': { id: 'maths-6e-decimals', name: 'Obsidienne', top: '#4a3d5c', side: '#2e2538', texture: 'obsidienne' },
  'maths-5e-signed-numbers': { id: 'maths-5e-signed-numbers', name: 'Glace', top: '#dff4fb', side: '#b6e0ee', texture: 'glace' },
  'maths-5e-proportionality': { id: 'maths-5e-proportionality', name: 'Toile', top: '#e9d9b8', side: '#c9463f', texture: 'toile' },
  'french-5e-homophones': { id: 'french-5e-homophones', name: 'Panneau', top: '#f2d16b', side: '#e0b73f', texture: 'panneau' },
  'french-5e-conjugation': { id: 'french-5e-conjugation', name: 'Tourbe', top: '#5a4a2a', side: '#3f3320', texture: 'tourbe' },
  'maths-4e-powers': { id: 'maths-4e-powers', name: 'Acier', top: '#c4ccd4', side: '#8f9aa6', texture: 'acier' },
  'maths-4e-algebra': { id: 'maths-4e-algebra', name: 'Calque', top: '#f4f1e4', side: '#dcd6c0', texture: 'calque' },
  'french-4e-agreement': { id: 'french-4e-agreement', name: 'Ardoise', top: '#5c6470', side: '#3f4650', texture: 'ardoise' },
  'french-4e-vocabulary': { id: 'french-4e-vocabulary', name: 'Parchemin', top: '#e8d8a8', side: '#cdb97f', texture: 'parchemin' },
  'maths-3e-geometry': { id: 'maths-3e-geometry', name: 'Marbre', top: '#f1eee8', side: '#d6d1c8', texture: 'marbre' },
  'maths-3e-statistics': { id: 'maths-3e-statistics', name: 'Quartz', top: '#e6dcf2', side: '#b9a8d6', texture: 'quartz' },
  'maths-3e-functions': { id: 'maths-3e-functions', name: 'Prisme', top: '#fff4c2', side: '#f0c95a', texture: 'prisme' },
  'french-3e-close-reading': { id: 'french-3e-close-reading', name: 'Lentille', top: '#cfe6f2', side: '#7fb2cc', texture: 'lentille' },
  'english-6e-vocabulary': { id: 'english-6e-vocabulary', name: 'Cabine', top: '#d8342c', side: '#b02a24', texture: 'cabine' },
  'english-6e-grammar': { id: 'english-6e-grammar', name: 'Cadran', top: '#f4ecd6', side: '#c9a24a', texture: 'cadran' },
  'english-5e-vocabulary': { id: 'english-5e-vocabulary', name: 'Tuile', top: '#d97a48', side: '#b85a30', texture: 'tuile' },
  'english-5e-grammar': { id: 'english-5e-grammar', name: 'Lambris', top: '#6e4a2c', side: '#5a3a22', texture: 'lambris' },
  'english-4e-comprehension': { id: 'english-4e-comprehension', name: 'Velours', top: '#8e2a48', side: '#7a1f3a', texture: 'velours' },
  'english-4e-grammar': { id: 'english-4e-grammar', name: 'Rail', top: '#85603a', side: '#4a4a50', texture: 'rail' },
  'english-3e-comprehension': { id: 'english-3e-comprehension', name: 'Antenne', top: '#b4bcc4', side: '#9aa4ae', texture: 'antenne' },
  'english-3e-grammar': { id: 'english-3e-grammar', name: 'Pierre de taille', top: '#e6dcc4', side: '#d8ccb0', texture: 'taille' },
  'trophy-gold': { id: 'trophy-gold', name: 'Or', top: '#f2c944', side: '#cfa326', texture: 'or', rare: true },
  'trophy-crystal': { id: 'trophy-crystal', name: 'Cristal', top: '#8ff0e8', side: '#4fc3bb', texture: 'cristal', rare: true },
  // Le bloc du Relais des voyageurs (LV2, 5e) : des dalles de 8 × 8 décalées, distinctes de la pierre de taille par le motif.
  'lv2-5e-introductions': { id: 'lv2-5e-introductions', name: 'Dalle', top: '#b8a07a', side: '#9a8462', texture: 'dalle' },
  // Le bloc du Jardin des heures (LV2, 4e) : des brins d'osier tressés dessus-dessous, distincts des planches, de la dalle
  // et du foin par le motif.
  'lv2-4e-daily-life': { id: 'lv2-4e-daily-life', name: 'Osier', top: '#a8955a', side: '#86743f', texture: 'osier' },
  // Le bloc du Refuge des carnets (LV2, 3e) : des bardeaux de bois en écailles décalées, au bas arrondi, distincts de la
  // tuile, de la brique et de la dalle par le motif ; un bois brun chaud, jamais gris comme la pierre.
  'lv2-3e-travel': { id: 'lv2-3e-travel', name: 'Bardeau', top: '#96724e', side: '#7c5c3e', texture: 'bardeau' },
  // Blocs assemblés (GD-2) : aucune île ne les donne, on les assemble sur l'île de l'école (world/assemblage.ts). Leur nom
  // ici est celui de Blocland ; chaque univers donne le sien, écrit dans docs/contenu/assemblage.md.
  'compound-6e': { id: 'compound-6e', name: 'Poutre', top: '#dcba86', side: '#c49a64', texture: 'poutre', assemble: true },
  'compound-5e': { id: 'compound-5e', name: 'Vitrail', top: '#5f9fd8', side: '#d0594f', texture: 'vitrail', assemble: true },
  'compound-4e': { id: 'compound-4e', name: 'Engrenage', top: '#d2d8de', side: '#4f5864', texture: 'engrenage', assemble: true },
  'compound-3e': { id: 'compound-3e', name: 'Miroir', top: '#e6f0f7', side: '#8a7aa8', texture: 'miroir', assemble: true },
  // Blocs de finition : ils viennent des coffres des plans (et des coffres de régularité), pas des biomes.
  'roof': { id: 'roof', name: 'Toit', top: '#a8443a', side: '#8a3630', texture: 'toit' },
  'door': { id: 'door', name: 'Porte', top: '#8a6236', side: '#6f4d2a', texture: 'porte' },
  'lantern': { id: 'lantern', name: 'Lanterne', top: '#ffd85c', side: '#f0b42a', texture: 'lanterne' },
  'fence': { id: 'fence', name: 'Barrière', top: '#d2b07a', side: '#b8945f', texture: 'barriere' },
  'stairs': { id: 'stairs', name: 'Escalier', top: '#c29a5f', side: '#8a6a3c', texture: 'escalier' },
};

/**
 * Le nom d'un bloc dans l'univers affiché, avec sa majuscule : « Poutre » dans Blocland, « Madrier » dans Archipéo.
 * L'univers vient des réglages en mémoire (`universCourant`), comme la LV2 des phrases (`lv2Courante`) : les règles
 * n'importent pas la couche des univers, et changer d'univers redessine l'application qui relit ces noms.
 */
export function nomDuBloc(id: BlockId): string {
  return nomAssemble(id, universCourant())?.nom ?? BLOCKS[id].name;
}

/** « de bois », « d’or », « d’escalier » : le nom du bloc avec la bonne élision. */
export function ofBlock(id: BlockId): string {
  const name = nomDuBloc(id).toLowerCase();
  return /^[aeiouyéèêh]/.test(name) ? `d’${name}` : `de ${name}`;
}

/**
 * Les matières : on les compte en blocs, le nom reste au singulier (« 3 blocs de sable », « 2 blocs d’or ») ; au
 * pluriel, « 3 sables » ou « 2 ors » sont rares, et « 3 verres » ou « 3 glaces » veulent dire autre chose (référent
 * dys). Les autres blocs sont des objets qu’on compte : « 5 toits », « 2 lanternes ».
 */
const MATIERES: ReadonlySet<BlockId> = new Set<BlockId>(
  ['french-6e-phonology', 'french-6e-letter-confusion', 'french-6e-word-spelling', 'french-6e-grammar-spelling', 'french-6e-reading', 'maths-6e-decimals', 'maths-5e-signed-numbers', 'maths-5e-proportionality', 'french-5e-conjugation', 'maths-4e-powers', 'maths-3e-geometry', 'maths-3e-statistics', 'english-4e-comprehension', 'english-5e-grammar', 'trophy-gold'],
);

/** Les pluriels qui ne s’écrivent pas en ajoutant un « s » au nom du bloc. */
const PLURIELS: Partial<Record<BlockId, string>> = { 'lv2-3e-travel': 'bardeaux', 'trophy-crystal': 'cristaux', 'french-5e-homophones': 'panneaux', 'english-3e-grammar': 'pierres de taille', 'compound-5e': 'vitraux' };

/** Ce qui suit le nombre, accordé : « toit », « toits », « bloc de sable », « blocs d’or », « cristaux ». */
export function blockName(id: BlockId, n: number): string {
  if (MATIERES.has(id)) return `${n > 1 ? 'blocs' : 'bloc'} ${ofBlock(id)}`;
  const autre = nomAssemble(id, universCourant());
  const name = (autre?.nom ?? BLOCKS[id].name).toLowerCase();
  if (n < 2) return name;
  return (autre ? autre.pluriel : PLURIELS[id]) ?? (/[sxz]$/.test(name) ? name : `${name}s`);
}

/** Une quantité de blocs, accordée : « 5 toits », « 1 lanterne », « 16 blocs de bois ». */
export function blockCount(id: BlockId, n: number): string {
  return `${n} ${blockName(id, n)}`;
}

export interface ExerciseTypeDef {
  id: string;
  title: string;
  description: string;
  /** Compétences du programme officiel que la mission travaille (identifiants de src/programme/). Au moins une. */
  programme: readonly ProgrammeId[];
  /**
   * Une mission de LV2 (îles `relais`, `jardin`) : la langue qu'elle travaille. Seules les missions de la LV2 choisie dans les
   * Réglages se jouent ; voir `missionsDe`.
   */
  lv2?: Lv2;
}

export interface CreatureDef {
  /** Son nom ; ce qu'elle dit est un texte d'univers, dans `src/univers/` (U4). */
  name: string;
}

export type Classe = '6e' | '5e' | '4e' | '3e';

export interface BiomeDef {
  id: BiomeId;
  name: string;
  module: string;
  /** Matière et classe visée (le contenu monte jusqu'à la fin de 3e). */
  subject: Subject;
  classe: Classe;
  description: string;
  block: BlockId;
  icon: AnyIconName;
  /**
   * Le nom du Gardien du biome (boss de fin de biome). Ce qu'il dit pendant le défi et l'espèce de la créature sont des
   * textes d'univers, dans `src/univers/` (lot 6).
   */
  guardian: string;
  creature: CreatureDef;
  exercises: ExerciseTypeDef[];
}

/**
 * Les îles du français (Forêt au centre de l'archipel), puis celles des maths (rangée de devant). Elles s'écrivent dans
 * docs/contenu/<île>.md (en-tête et missions), dans l'ordre de docs/contenu/archipel.md ; `npm run contenu` en produit
 * iles.ts, que le compilateur vérifie (`satisfies BiomeDef[]`), avec les tests (biomes.test.ts).
 */
export const BIOMES: BiomeDef[] = ILES;

/** Les îles d'une matière, dans l'ordre des classes. */
export function biomesOf(subject: Subject): BiomeDef[] {
  const order: Classe[] = ['6e', '5e', '4e', '3e'];
  return BIOMES.filter((b) => b.subject === subject).sort((a, b) => order.indexOf(a.classe) - order.indexOf(b.classe));
}

/**
 * Le nom du Gardien avec sa majuscule, pour un titre ou un début de phrase (« Le Grand Chêne ») ; au milieu d'une
 * phrase, `guardian` garde son article en minuscule (« bats le Grand Chêne »).
 */
export function guardianTitle(biome: Pick<BiomeDef, 'guardian'>): string {
  return biome.guardian.charAt(0).toUpperCase() + biome.guardian.slice(1);
}

/**
 * Les missions qui se jouent sur une île : toutes, sauf celles d'une autre LV2 que celle des Réglages. Avec « Pas de
 * LV2 », l'île de la LV2 n'en a aucune. Les bornes, le Gardien et la progression passent par ici.
 */
export function missionsJouables(biome: Pick<BiomeDef, 'exercises'>, lv2: Lv2Choice = lv2Courante()): ExerciseTypeDef[] {
  return biome.exercises.filter((x) => x.lv2 === undefined || x.lv2 === lv2);
}

/** Ce que dit l'île de la LV2 avec « Pas de LV2 » (lu à l'ouverture de son panneau), qu'elle soit ouverte ou non. */
export const SANS_LV2 = 'Tu n’as pas choisi de LV2 : les missions de ta deuxième langue ne sont pas proposées ici. Tu peux en choisir une dans les Réglages.';

/** Une île de LV2 : ses missions dépendent de la langue choisie. */
export function estIleLv2(biome: Pick<BiomeDef, 'subject'>): boolean {
  return biome.subject === 'lv2';
}

export function getBiome(id: string | undefined): BiomeDef | undefined {
  return BIOMES.find((b) => b.id === id);
}
