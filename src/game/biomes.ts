// Univers Blocland : biomes, blocs et créatures (noms et créatures originaux).
import type { Subject } from '../apps/registry';
import type { ProgrammeId } from '../curriculum';
import type { AnyIconName } from '../components/Icon';
import { lcaCourante, lv2Courante, universCourant, type LcaChoice, type Lv2Choice } from '../core/settings';
import type { ForeignWord } from '../core/foreignWords';
import { nomAssemble } from './world/assembly';
import { ILES } from './islands';

/** Une deuxième langue vivante (pas « Pas de LV2 »). */
export type Lv2 = Exclude<Lv2Choice, 'none'>;

/** Une option de l'île du latin et du grec (pas « Pas d'option »). */
export type Lca = Exclude<LcaChoice, 'none'>;

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
  'history-6e-antiquity',
  'geography-6e-living',
  'life-earth-sciences-6e-living-world',
  'physics-chemistry-6e-matter-energy',
  'technology-6e-objects',
  'civics-6e-democratic-society',
  'history-5e-middle-ages',
  'geography-5e-resources',
  'life-earth-sciences-5e-active-planet',
  'physics-chemistry-5e-matter-universe',
  'technology-5e-design',
  'history-4e-revolutions',
  'geography-4e-globalization',
  'life-earth-sciences-4e-cells-evolution',
  'physics-chemistry-4e-signals-circuits',
  'technology-4e-modeling',
  'history-3e-twentieth-century',
  'geography-3e-france',
  'life-earth-sciences-3e-human-body',
  'physics-chemistry-3e-motion-energy',
  'technology-3e-digital',
  'lv2-5e-introductions',
  'lv2-4e-daily-life',
  'lv2-3e-travel',
] as const;
export type BiomeId = (typeof BIOME_IDS)[number];

const LES_BIOMES: ReadonlySet<string> = new Set(BIOME_IDS);

/** Une chaîne lue des données (l'étiquette d'un cube, l'île d'une borne « île:mission ») est-elle une île du jeu ? */
export function estUnBiome(id: string | undefined | null): id is BiomeId {
  return typeof id === 'string' && LES_BIOMES.has(id);
}
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
  | 'history-6e-antiquity'
  | 'geography-6e-living'
  | 'life-earth-sciences-6e-living-world'
  | 'physics-chemistry-6e-matter-energy'
  | 'technology-6e-objects'
  | 'civics-6e-democratic-society'
  | 'history-5e-middle-ages'
  | 'geography-5e-resources'
  | 'history-4e-revolutions'
  | 'geography-4e-globalization'
  | 'history-3e-twentieth-century'
  | 'geography-3e-france'
  | 'life-earth-sciences-5e-active-planet'
  | 'physics-chemistry-5e-matter-universe'
  | 'technology-5e-design'
  | 'life-earth-sciences-4e-cells-evolution'
  | 'physics-chemistry-4e-signals-circuits'
  | 'technology-4e-modeling'
  | 'life-earth-sciences-3e-human-body'
  | 'physics-chemistry-3e-motion-energy'
  | 'technology-3e-digital'
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
 * leur mot anglais. Le rendu de Blocland (world/, three/) écrit ses blocs avec ses propres mots : `BLOC.pierre`.
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
  mosaique: 'history-6e-antiquity',
  chaume: 'geography-6e-living',
  fossile: 'life-earth-sciences-6e-living-world',
  aimant: 'physics-chemistry-6e-matter-energy',
  carton: 'technology-6e-objects',
  craie: 'civics-6e-democratic-society',
  enluminure: 'history-5e-middle-ages',
  riziere: 'geography-5e-resources',
  fonte: 'history-4e-revolutions',
  conteneur: 'geography-4e-globalization',
  reliure: 'history-3e-twentieth-century',
  gres: 'geography-3e-france',
  strate: 'life-earth-sciences-5e-active-planet',
  sel: 'physics-chemistry-5e-matter-universe',
  bambou: 'technology-5e-design',
  petale: 'life-earth-sciences-4e-cells-evolution',
  bobine: 'physics-chemistry-4e-signals-circuits',
  liege: 'technology-4e-modeling',
  savon: 'life-earth-sciences-3e-human-body',
  ressort: 'physics-chemistry-3e-motion-energy',
  cire: 'technology-3e-digital',
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
  /**
   * Un ou deux bâtons pâles, de ces couleurs, couchés sur le dessus de son icône (`BlockIcon`, Voxel.tsx, et le bloc des
   * étiquettes, world/labelCanvas.ts) : un aplat sombre seul ne dit pas ce qu'est le bloc (la craie se lisait charbon).
   */
  batons?: readonly [string] | readonly [string, string];
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
  | 'mosaique'
  | 'chaume'
  | 'fossile'
  | 'aimant'
  | 'carton'
  | 'craie'
  | 'enluminure'
  | 'riziere'
  | 'fonte'
  | 'conteneur'
  | 'reliure'
  | 'gres'
  | 'strate'
  | 'sel'
  | 'bambou'
  | 'petale'
  | 'bobine'
  | 'liege'
  | 'savon'
  | 'ressort'
  | 'cire'
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
  // Le bloc de la Fouille des siècles (histoire, 6e) : des tesselles de 2 × 2 en tons ocre, terre cuite et crème, mats,
  // l'ocre et le crème dominants (plus jaune que la brique, plus rouge que le chaume), distinctes du vitrail par
  // l'absence de plomb et de couleurs vives.
  'history-6e-antiquity': { id: 'history-6e-antiquity', name: 'Mosaïque', top: '#d6a258', side: '#b47c40', texture: 'mosaique' },
  // Le bloc de la Pointe des paysages (géographie, 6e) : des bottes de paille en couches qui se chevauchent, distinctes
  // du sable, de l'osier et du parchemin par le motif, pas par la teinte seule.
  'geography-6e-living': { id: 'geography-6e-living', name: 'Chaume', top: '#d8b860', side: '#b0903e', texture: 'chaume' },
  // Le bloc de la Vallée du vivant (SVT, 6e) : une pierre beige où dort une coquille en spirale, sombre ; distinct de la
  // pierre de taille et du sable par la spirale, pas par la teinte seule (DA, SC-2).
  'life-earth-sciences-6e-living-world': { id: 'life-earth-sciences-6e-living-world', name: 'Fossile', top: '#b3a68a', side: '#8f8370', texture: 'fossile' },
  // Le bloc du Laboratoire des éléments (physique-chimie, 6e) : un aimant, le dessus en deux moitiés, rouge et bleue,
  // les côtés gris métal marqués d'un U (DA, SC-2) ; jamais la couleur seule : les deux pôles se lisent à la forme.
  'physics-chemistry-6e-matter-energy': { id: 'physics-chemistry-6e-matter-energy', name: 'Aimant', top: '#b84a40', side: '#8c9298', texture: 'aimant' },
  // Le bloc du Hangar des inventions (technologie, 6e) : du carton ondulé brun clair, ses cannelures verticales,
  // distinct des planches et de la terre par le motif (DA, SC-2).
  'technology-6e-objects': { id: 'technology-6e-objects', name: 'Carton', top: '#b98d5a', side: '#9a7246', texture: 'carton' },
  // Le bloc du Préau des délégués (EMC, 6e) : des bâtons de craie couchés, côte à côte, sur l'ardoise vert sombre d'un
  // tableau ; blanc, jaune pâle, rose pâle et bleu pâle. Distinct du sel (blanc, quatre cristaux cernés) et du fossile
  // (beige, une spirale) par les bâtons et le fond sombre, pas par la teinte seule (proposition de l'artiste technique 3D,
  // à valider par le directeur artistique). Le dessus de l'icône, l'ardoise du tableau un ton plus clair : en blanc, elle se
  // lisait comme du sel ou de la neige (DA, relecture des captures emc-2) ; deux bâtons de craie couchés dessus, blanc et
  // rose pâle, pas tout à fait parallèles (ni un signe égal, ni la fente d'une urne) : unie, l'ardoise se lisait comme du
  // charbon (passe 2).
  'civics-6e-democratic-society': { id: 'civics-6e-democratic-society', name: 'Craie', top: '#4c6458', side: '#3e5248', texture: 'craie', batons: ['#f2efe6', '#eec4c4'] },
  // Le bloc du Bourg des chroniques (histoire, 5e) : un violet profond parcouru de filets d'or, comme une page enluminée,
  // distinct de l'obsidienne par les filets et par un violet plus clair.
  'history-5e-middle-ages': { id: 'history-5e-middle-ages', name: 'Enluminure', top: '#6a4c9c', side: '#4e3878', texture: 'enluminure' },
  // Le bloc du Delta des ressources (géographie, 5e) : des rangs de pousses vertes sur une eau bleu-vert, en terrasses,
  // distincts de l'herbe et des feuilles par l'eau entre les rangs.
  'geography-5e-resources': { id: 'geography-5e-resources', name: 'Rizière', top: '#a2bf42', side: '#4f8c86', texture: 'riziere' },
  // Le bloc de l'Imprimerie des révolutions (histoire, 4e) : une fonte vert-noir à rivets, distincte de l'obsidienne, de
  // l'acier et de l'ardoise par les rivets et par sa teinte verte.
  'history-4e-revolutions': { id: 'history-4e-revolutions', name: 'Fonte', top: '#3e4a44', side: '#2c3631', texture: 'fonte' },
  // Le bloc de l'Escale des échanges (géographie, 4e) : la tôle ondulée bleue d'un conteneur, distincte de l'eau par les
  // ondes droites et serrées.
  'geography-4e-globalization': { id: 'geography-4e-globalization', name: 'Conteneur', top: '#3d7fb0', side: '#2c6189', texture: 'conteneur' },
  // Le bloc du Kiosque des témoins (histoire, 3e) : des dos de livres serrés, sans lettres, bleu-vert sombre, distincts
  // du lambris et de la rizière par les dos verticaux.
  'history-3e-twentieth-century': { id: 'history-3e-twentieth-century', name: 'Reliure', top: '#2f6f74', side: '#22545a', texture: 'reliure' },
  // Le bloc du Plateau des territoires (géographie, 3e) : un grès rose à grain fin, en assises, distinct de la brique
  // et de la tuile par sa teinte plus pâle et l'absence de joints marqués.
  'geography-3e-france': { id: 'geography-3e-france', name: 'Grès rose', top: '#d49a94', side: '#b07872', texture: 'gres' },
  // Les blocs des îles de sciences de 5e à 3e (décision du directeur artistique, SC-3) : le nom et les deux couleurs
  // seulement ; la texture se peint dans world/pixels.ts.
  // Le bloc de la Prairie des climats (SVT, 5e) : des couches de roche ; le dessus brun, les côtés en trois bandes, ocre #d4a656, brun-rouge #8a5a3a et gris #8e8a84.
  'life-earth-sciences-5e-active-planet': { id: 'life-earth-sciences-5e-active-planet', name: 'Strate', top: '#9a6a44', side: '#8a5a3a', texture: 'strate' },
  // Le bloc de la Saline des mélanges (physique-chimie, 5e) : du sel blanc, quatre petits cristaux carrés cernés de #8a98a6 sur chaque face (motif obligatoire).
  'physics-chemistry-5e-matter-universe': { id: 'physics-chemistry-5e-matter-universe', name: 'Sel', top: '#ece8e2', side: '#c8ccd0', texture: 'sel' },
  // Le bloc de la Menuiserie des objets (technologie, 5e) : des cannes de bambou, leurs bouts ronds dessus, verticales sur les côtés, nœuds #6f7a34.
  'technology-5e-design': { id: 'technology-5e-design', name: 'Bambou', top: '#cdb46a', side: '#b49c4e', texture: 'bambou' },
  // Le bloc de la Source des espèces (SVT, 4e) : des pétales roses en écailles, un cœur jaune.
  'life-earth-sciences-4e-cells-evolution': { id: 'life-earth-sciences-4e-cells-evolution', name: 'Pétale', top: '#e88fb4', side: '#c8638e', texture: 'petale' },
  // Le bloc de la Vigie des signaux (physique-chimie, 4e) : du fil de cuivre enroulé, l’axe gris dessus, les spires #8a4a22 sur les côtés.
  'physics-chemistry-4e-signals-circuits': { id: 'physics-chemistry-4e-signals-circuits', name: 'Bobine', top: '#c47a3c', side: '#b5652e', texture: 'bobine' },
  // Le bloc du Bassin des maquettes (technologie, 4e) : du liège cannelle moucheté de #4e3020 et de #d0a070.
  'technology-4e-modeling': { id: 'technology-4e-modeling', name: 'Liège', top: '#b0785a', side: '#93603f', texture: 'liege' },
  // Le bloc du Verger de la santé (SVT, 3e) : un savon vert menthe, une rainure et un ovale en relief #d8f0e4.
  'life-earth-sciences-3e-human-body': { id: 'life-earth-sciences-3e-human-body', name: 'Savon', top: '#a6d8c0', side: '#86bfa4', texture: 'savon' },
  // Le bloc du Tremplin des forces (physique-chimie, 3e) : un métal gris, un ressort en zigzag laiton #d6b04a.
  'physics-chemistry-3e-motion-energy': { id: 'physics-chemistry-3e-motion-energy', name: 'Ressort', top: '#5a606a', side: '#4a4f58', texture: 'ressort' },
  // Le bloc de la Ruche des réseaux (technologie, 3e) : de la cire couleur miel, des alvéoles en traits fins #8f5f1e.
  'technology-3e-digital': { id: 'technology-3e-digital', name: 'Cire', top: '#d9a03c', side: '#b98030', texture: 'cire' },
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
  // Blocs assemblés (GD-2) : aucune île ne les donne, on les assemble sur l'île de l'école (world/assembly.ts). Leur nom
  // ici est celui de Blocland ; chaque univers donne le sien, écrit dans docs/contenu/assemblage.md.
  'compound-6e': { id: 'compound-6e', name: 'Poutre', top: '#dcba86', side: '#c49a64', texture: 'poutre', assemble: true },
  'compound-5e': { id: 'compound-5e', name: 'Vitrail', top: '#5f9fd8', side: '#d0594f', texture: 'vitrail', assemble: true },
  'compound-4e': { id: 'compound-4e', name: 'Engrenage', top: '#d2d8de', side: '#4f5864', texture: 'engrenage', assemble: true },
  'compound-3e': { id: 'compound-3e', name: 'Miroir', top: '#e6f0f7', side: '#8a7aa8', texture: 'miroir', assemble: true },
  // Blocs de finition : ils venaient des coffres des plans, retirés par GD-6 ; ceux déjà gagnés restent des trophées.
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
  ['french-6e-phonology', 'french-6e-letter-confusion', 'french-6e-word-spelling', 'french-6e-grammar-spelling', 'french-6e-reading', 'maths-6e-decimals', 'maths-5e-signed-numbers', 'maths-5e-proportionality', 'french-5e-conjugation', 'maths-4e-powers', 'maths-3e-geometry', 'maths-3e-statistics', 'english-4e-comprehension', 'english-5e-grammar', 'geography-6e-living', 'technology-6e-objects', 'civics-6e-democratic-society', 'history-5e-middle-ages', 'geography-5e-resources', 'history-4e-revolutions', 'history-3e-twentieth-century', 'geography-3e-france', 'physics-chemistry-5e-matter-universe', 'technology-5e-design', 'technology-4e-modeling', 'life-earth-sciences-3e-human-body', 'technology-3e-digital', 'trophy-gold'],
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
  /** Compétences du programme officiel que la mission travaille (identifiants de src/curriculum/). Au moins une. */
  programme: readonly ProgrammeId[];
  /**
   * Une mission de LV2 (lieux `lv2-5e-introductions`, `lv2-4e-daily-life`, `lv2-3e-travel`) : la langue qu'elle travaille. Seules les missions de la LV2 choisie dans les
   * Réglages se jouent ; voir `missionsDe`.
   */
  lv2?: Lv2;
  /**
   * Une mission de l'île du latin et du grec (matière `lca`) : l'option qu'elle travaille, `la` ou `gr`. Seules les
   * missions de l'option choisie dans les Réglages se jouent (GD-13) ; voir `missionsJouables`.
   */
  option?: Lca;
  /**
   * Une mission écrite et relue, gardée hors du jeu tant que ce qu'il lui faut manque (« L'alphabet grec » attend sa
   * police) : la raison. Elle ne se joue pas (`missionsJouables`) ; le site la signale.
   */
  waiting?: string;
}

export interface CreatureDef {
  /** Son nom ; ce qu'elle dit est un texte d'univers, dans `src/universes/` (U4). */
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
   * textes d'univers, dans `src/universes/` (lot 6).
   */
  guardian: string;
  creature: CreatureDef;
  exercises: ExerciseTypeDef[];
  /**
   * Les mots de l'île qui ne sont pas du français (« ## La voix » de son Markdown) : marqués dans leur langue, sans
   * syllabes colorées, et lus comme le dit cette liste (src/core/foreignWords.ts). L'île du latin et du grec seulement.
   */
  foreignWords?: readonly ForeignWord[];
}

/**
 * Les îles du français (Forêt au centre de l'archipel), puis celles des maths (rangée de devant). Elles s'écrivent dans
 * docs/contenu/<île>.md (en-tête et missions), dans l'ordre de docs/contenu/archipel.md ; `npm run contenu` en produit
 * islands.ts, que le compilateur vérifie (`satisfies BiomeDef[]`), avec les tests (biomes.test.ts).
 */
export const BIOMES: BiomeDef[] = ILES;

/** Les matières des sciences (SVT, physique-chimie, technologie : SC-2 en 6e, SC-3 de la 5e à la 3e). */
export const SCIENCE_SUBJECTS: readonly Subject[] = ['life-earth-sciences', 'physics-chemistry', 'technology'];

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
 * Les missions qui se jouent sur une île : toutes, sauf celles d'une autre LV2 que celle des Réglages, celles d'une autre
 * option que le latin ou le grec choisi, et celles qui attendent ce qu'il leur faut (`waiting`). Avec « Pas de LV2 »,
 * l'île de la LV2 n'en a aucune ; avec « Pas d'option », l'île du latin et du grec non plus. Les bornes, le Gardien et
 * la progression passent par ici.
 */
export function missionsJouables(biome: Pick<BiomeDef, 'exercises'>, lv2: Lv2Choice = lv2Courante(), lca: LcaChoice = lcaCourante()): ExerciseTypeDef[] {
  return biome.exercises.filter((x) => x.waiting === undefined && (x.lv2 === undefined || x.lv2 === lv2) && (x.option === undefined || x.option === lca));
}

/** Ce que dit l'île de la LV2 avec « Pas de LV2 » (lu à l'ouverture de son panneau), qu'elle soit ouverte ou non. */
export const SANS_LV2 = 'Tu n’as pas choisi de LV2 : les missions de ta deuxième langue ne sont pas proposées ici. Tu peux en choisir une dans les Réglages.';

/** Ce que dit l'île du latin et du grec avec « Pas d'option » (lu à l'ouverture de son panneau). */
export const SANS_LCA = 'Tu n’as pas choisi l’option latin ou grec : ses missions ne sont pas proposées ici. Si tu la suis au collège, choisis-la dans les Réglages.';

/** Une île de LV2 : ses missions dépendent de la langue choisie. */
export function estIleLv2(biome: Pick<BiomeDef, 'subject'>): boolean {
  return biome.subject === 'lv2';
}

/**
 * Un lieu d'option (GD-13) : l'île de la LV2 ou celle du latin et du grec. Ses missions dépendent d'un réglage ; il reste
 * en bout de chemin, n'a pas de commande, n'entre dans aucune quête ni aucun projet, et ne compte pas dans la matière la
 * moins jouée.
 */
export function estLieuDOption(biome: Pick<BiomeDef, 'subject'>): boolean {
  return biome.subject === 'lv2' || biome.subject === 'lca';
}

/** Un lieu d'option dont l'élève n'a pas choisi l'option : ce que lit son panneau, son bouton vers les Réglages, la phrase de ses liaisons. */
export interface SansOption {
  lu: string;
  bouton: string;
  liaison: string;
}

const SANS_OPTION: Record<'lv2' | 'lca', SansOption> = {
  lv2: { lu: SANS_LV2, bouton: 'Choisir une LV2', liaison: 'Choisis d’abord une LV2 dans les Réglages.' },
  lca: { lu: SANS_LCA, bouton: 'Choisir l’option', liaison: 'Choisis d’abord l’option latin ou grec dans les Réglages.' },
};

/**
 * Un lieu d'option dont l'élève n'a pas choisi l'option (« Pas de LV2 », « Pas d'option »), ou `null` : son panneau le
 * dit, sans cadenas, avec un bouton vers les Réglages ; il reste fermé, et aucune liaison n'y mène (GD-13).
 */
export function sansSonOption(biome: Pick<BiomeDef, 'subject'> | undefined, choix: { lv2: Lv2Choice; lca: LcaChoice }): SansOption | null {
  if (biome?.subject === 'lv2' && choix.lv2 === 'none') return SANS_OPTION.lv2;
  if (biome?.subject === 'lca' && choix.lca === 'none') return SANS_OPTION.lca;
  return null;
}

export function getBiome(id: string | undefined): BiomeDef | undefined {
  return BIOMES.find((b) => b.id === id);
}
