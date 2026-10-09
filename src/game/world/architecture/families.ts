// La table commune « matière → famille » d'Archipéo (décision du mainteneur du 8 octobre 2026 : « Sur archipeo il ne
// devrait rien y avoir en rendu bloc » ; intention du directeur artistique, avis « Aligné ») : tout ce qui est posé
// prend le dessin peint de sa famille, avec les couleurs de son archipel, comme le décor (world/decor/common.ts,
// world/decor/shapes.ts). Elle est exhaustive sur `TextureKind` : une matière ajoutée sans famille ni exception nommée
// fait échouer la compilation et la CI (./families.test.ts). Les blocs taillés ne restent qu'en exceptions nommées
// (`CUBE_EXCEPTIONS`).
//
// Le kit d'un archipel (./kits/) dit ce qu'il sait dessiner de chaque famille ; la table ne s'active qu'au 6e (les
// Premiers Rivages) : au 5e, au 4e et au 3e, le kit est vide et rien ne change. Code pur, sans Three.js.
import type { TextureKind } from '../pixels';

/** Les familles du dessin peint (vocabulaire du directeur artistique). */
export type MaterialFamily =
  /** Le bois : poteaux et sablières peints sur le remplissage crème. */
  | 'colombage'
  /** Les clins horizontaux peints dans la teinte de la matière, sous un chaperon de pierre. */
  | 'bardage'
  /** Le mur plein dans la teinte de la matière, soubassement et chaperon de pierre ; seule et basse, un bac. */
  | 'pierre'
  /**
   * La tôle à joints verticaux peints tous les quarts de case, soubassement de pierre à partir de trois rangées, chaperon
   * mince sans toit, aucun rivet (au 6e, le 9 octobre 2026).
   */
  | 'metal'
  /** Les pentes, la rive, le versant et le faîte, dans la couverture de l'île (world/roofs.ts). */
  | 'toit'
  /** La vitre encadrée d'un châssis peint ; un mur entier de verre, une verrière. */
  | 'verre'
  /** La lueur fixe : une fenêtre allumée dans un mur, une lanterne sur poteau ailleurs. */
  | 'lanterne'
  /** La porte (un vantail dans son encadrement), la barrière (poteaux et lisses), la marche (de pierre, basse). */
  | 'finition'
  /**
   * Les formes communes du décor (world/decor/common.ts) ; au 6e, les poteaux de bois des liaisons et de la jetée en
   * poteaux carrés (./lowPieces.ts, `woodenPost`).
   */
  | 'vegetal'
  | 'toile'
  /**
   * L'or, le cristal, le velours : au 6e, la cloche, le lingot et le cristal des trophées (./precious.ts), la tenture du
   * fond de la salle des trophées (./paint.ts) ; jamais une lueur ni une transparence.
   */
  | 'precieux'
  /** Une nappe plate. */
  | 'eau';

/** Une exception : ce qui garde son dessin à lui, nommé (une exception se décide, elle ne se déduit pas). */
export interface CubeException {
  id: string;
  /** Ce que l'élève voit. */
  what: string;
  /** Où c'est dessiné. */
  where: string;
  /** La texture qu'elle couvre, quand elle en couvre une (sinon, ce n'est pas une matière). */
  texture?: TextureKind;
  /** Ce qui en est décidé. */
  status: string;
}

/**
 * Les exceptions nommées. Les deux premières sont proposées au mainteneur par le directeur artistique (8 octobre 2026),
 * pas encore tranchées : elles restent en cubes par défaut.
 */
export const CUBE_EXCEPTIONS: readonly CubeException[] = [
  {
    id: 'fantome',
    what: 'le fantôme, le cube de Brume d’une case à poser',
    where: 'world/construction.ts, le groupe des fantômes',
    status: 'reste en cube (A), proposé au mainteneur le 8 octobre 2026',
  },
  {
    id: 'pierre-du-fondu',
    what: 'la pierre des ruines d’une partie pendant le fondu de la pose (GD-6)',
    where: 'world/fadeMesh.ts',
    status: 'reste en cube (B), proposé au mainteneur le 8 octobre 2026',
  },
  {
    id: 'borne',
    texture: 'borne',
    what: 'la borne de mission',
    where: 'world/construction.ts, `piliersDe` : son pilier taillé, instancié',
    status: 'son modèle à elle (lot R5) : ce n’est pas un bloc posé',
  },
];

/** Les textures couvertes par une exception. La barrière n'en est plus une (9 octobre 2026) : poteaux et lisses. */
type ExceptionTexture = 'borne';

/**
 * La famille de chaque matière. Les matières relevées par le directeur artistique (biomes.ts, architect.ts,
 * fixtures.ts, monuments.ts, decor.ts, terrain/links.ts, terrain/port.ts, vehicle.ts) d'abord ; puis celles qu'aucun
 * bloc du 6e ne pose, que l'artiste technique 3D range par analogie, à valider par le directeur artistique avant les
 * lots du 5e, du 4e et du 3e (`FAMILIES_TO_CONFIRM`).
 */
export const MATERIAL_FAMILIES: Record<Exclude<TextureKind, ExceptionTexture>, MaterialFamily> = {
  // Le colombage.
  planches: 'colombage',
  terre: 'colombage',
  poutre: 'colombage',
  chaume: 'colombage',
  // Le bardage.
  cabine: 'bardage',
  carton: 'bardage',
  // La pierre.
  pierre: 'pierre',
  galet: 'pierre',
  brique: 'pierre',
  obsidienne: 'pierre',
  sable: 'pierre',
  fossile: 'pierre',
  craie: 'pierre',
  mosaique: 'pierre',
  taille: 'pierre',
  marbre: 'pierre',
  cadran: 'pierre',
  lentille: 'pierre',
  // La farine (l'enduit blanc cassé du Fournil) et le tuf de la Grotte (directeur artistique, 9 octobre 2026).
  farine: 'pierre',
  tuf: 'pierre',
  // Le métal.
  aimant: 'metal',
  // Le toit.
  toit: 'toit',
  tuile: 'toit',
  // Le verre et la lanterne.
  verre: 'verre',
  lanterne: 'lanterne',
  // La finition.
  porte: 'finition',
  barriere: 'finition',
  escalier: 'finition',
  marche: 'finition',
  // Le végétal.
  tronc: 'vegetal',
  feuilles: 'vegetal',
  herbe: 'vegetal',
  mousse: 'vegetal',
  sapin: 'vegetal',
  // La toile, le précieux, l'eau.
  toile: 'toile',
  or: 'precieux',
  cristal: 'precieux',
  velours: 'precieux',
  eau: 'eau',

  // Proposées par analogie (aucune n'est posée au 6e), à valider par le directeur artistique.
  glace: 'pierre',
  ardoise: 'pierre',
  dalle: 'pierre',
  gres: 'pierre',
  strate: 'pierre',
  sel: 'pierre',
  basalte: 'pierre',
  savon: 'pierre',
  cire: 'pierre',
  quartz: 'precieux',
  prisme: 'precieux',
  panneau: 'bardage',
  lambris: 'bardage',
  osier: 'bardage',
  bardeau: 'bardage',
  bambou: 'bardage',
  liege: 'bardage',
  acier: 'metal',
  rail: 'metal',
  antenne: 'metal',
  fonte: 'metal',
  conteneur: 'metal',
  ressort: 'metal',
  engrenage: 'metal',
  bobine: 'metal',
  vitrail: 'verre',
  miroir: 'verre',
  calque: 'toile',
  parchemin: 'toile',
  enluminure: 'toile',
  reliure: 'toile',
  tourbe: 'vegetal',
  riziere: 'vegetal',
  petale: 'vegetal',
  nuage: 'eau',
  lave: 'eau',
};

/** Les matières rangées par analogie, à valider par le directeur artistique (aucune n'est posée au 6e). */
export const FAMILIES_TO_CONFIRM: readonly TextureKind[] = [
  'glace',
  'ardoise',
  'dalle',
  'gres',
  'strate',
  'sel',
  'basalte',
  'savon',
  'cire',
  'quartz',
  'prisme',
  'panneau',
  'lambris',
  'osier',
  'bardeau',
  'bambou',
  'liege',
  'acier',
  'rail',
  'antenne',
  'fonte',
  'conteneur',
  'ressort',
  'engrenage',
  'bobine',
  'vitrail',
  'miroir',
  'calque',
  'parchemin',
  'enluminure',
  'reliure',
  'tourbe',
  'riziere',
  'petale',
  'nuage',
  'lave',
];

/** La famille d'une matière, ou `null` (une exception, ou ce qui n'est pas une matière : une couleur seule). */
export function familyOf(texture: string | undefined): MaterialFamily | null {
  return texture !== undefined && Object.hasOwn(MATERIAL_FAMILIES, texture) ? MATERIAL_FAMILIES[texture as keyof typeof MATERIAL_FAMILIES] : null;
}

/** Les matières des familles données : la table « bloc vers matière » d'un kit (./kits/). */
export function materialsOf(families: readonly MaterialFamily[]): Partial<Record<TextureKind, MaterialFamily>> {
  const out: Partial<Record<TextureKind, MaterialFamily>> = {};
  for (const [texture, family] of Object.entries(MATERIAL_FAMILIES) as [TextureKind, MaterialFamily][]) if (families.includes(family)) out[texture] = family;
  return out;
}
