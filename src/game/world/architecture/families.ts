// La table commune « matière → famille » d'Archipéo (décision du mainteneur du 8 octobre 2026 : « Sur archipeo il ne
// devrait rien y avoir en rendu bloc » ; intention du directeur artistique, avis « Aligné ») : tout ce qui est posé
// prend le dessin peint de sa famille, avec les couleurs de son archipel, comme le décor (world/decor/common.ts,
// world/decor/shapes.ts). Elle est exhaustive sur `TextureKind` : une matière ajoutée sans famille ni exception nommée
// fait échouer la compilation et la CI (./families.test.ts). Les blocs taillés ne restent qu'en exceptions nommées
// (`CUBE_EXCEPTIONS`).
//
// Le kit d'un archipel (./kits/) dit ce qu'il sait dessiner de chaque famille ; la table s'active partout : au 6e (les
// Premiers Rivages), au 5e (les Collines du Large, 9 octobre 2026), au 4e et au 3e (les Anciens Ateliers et les Îles du
// Ciel, 10 octobre 2026). Code pur, sans Three.js.
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
 * fixtures.ts, monuments.ts, decor.ts, terrain/links.ts, terrain/port.ts, vehicle.ts) d'abord ; puis celles du 5e,
 * validées par le directeur artistique le 9 octobre 2026 ; puis celles du 4e et du 3e, validées le 10 octobre 2026 (le
 * basalte et la lave, qu'aucun bloc ne pose, restent à confirmer : `FAMILIES_TO_CONFIRM`).
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

  // Le 5e (directeur artistique, 9 octobre 2026) : la glace, la dalle, la strate, le sel et la tourbe (un mur de mottes
  // plein) en pierre ; le panneau, le lambris et le bambou (des clins verticaux, ./kits/5e.ts) en bardage ; le vitrail
  // en verre (jamais une pièce) ; l'enluminure (le logis à étage en avancée) et la rizière (dans un mur, comme la terre
  // de la Ferme ; seule au sol, une plate-bande) en colombage.
  glace: 'pierre',
  dalle: 'pierre',
  strate: 'pierre',
  sel: 'pierre',
  tourbe: 'pierre',
  panneau: 'bardage',
  lambris: 'bardage',
  bambou: 'bardage',
  vitrail: 'verre',
  enluminure: 'colombage',
  riziere: 'colombage',
  // Le nuage : des congères, tas bas dans la neige (comme le tas de sable de fouille), de la famille de la pierre et non
  // de l'eau (directeur artistique, retouches du 9 octobre 2026) ; le 3e reverra s'il pose du nuage dans une construction.
  nuage: 'pierre',

  // Le 4e et le 3e (directeur artistique, 10 octobre 2026) : les matières rangées par analogie, confirmées.
  // - En pierre, un mur plein de leur matière : l'ardoise, le grès, le savon, la cire, le pavé de la Porte des libertés
  //   et la fresque de la Colonnade des cités (un enduit peint) ; le basalte, qu'aucun bloc ne pose.
  ardoise: 'pierre',
  gres: 'pierre',
  basalte: 'pierre',
  savon: 'pierre',
  cire: 'pierre',
  pave: 'pierre',
  fresque: 'pierre',
  // - Changées : le quartz en mur plein (le trophée de quartz reste dessiné à part) ; le pétale en enduit rose dans un mur
  //   (seul au sol, une plate-bande dans sa teinte : ./kits/shared.ts).
  quartz: 'pierre',
  petale: 'pierre',
  // - En bardage, des clins dans leur teinte : l'osier, le bardeau (les murs du Refuge, sans balcon ni toit de bardeau),
  //   le liège, l'acajou du Forum des débats.
  osier: 'bardage',
  bardeau: 'bardage',
  liege: 'bardage',
  acajou: 'bardage',
  // - En métal, une tôle dans la teinte de sa matière (./kits/4e.ts, ./kits/3e.ts) ; la reliure aussi (changée : la cuve
  //   du château d'eau, le fuselage de la fusée, le Kiosque des témoins).
  acier: 'metal',
  rail: 'metal',
  antenne: 'metal',
  fonte: 'metal',
  conteneur: 'metal',
  ressort: 'metal',
  engrenage: 'metal',
  bobine: 'metal',
  reliure: 'metal',
  // - En verre, une verrière : le miroir ; le prisme (changé : les murs de la lanterne de Fi ; au toit du temple, un toit
  //   lu par sa place) ; le calque (changé : une verrière dépolie, le bureau d'Ixe).
  miroir: 'verre',
  prisme: 'verre',
  calque: 'verre',
  // - En toile, en tenture dans un mur : le parchemin.
  parchemin: 'toile',
  // - En végétal, dans les formes communes (une boule sur son tronc) : le laurier du Bosquet des sages.
  laurier: 'vegetal',
  // - La lave, qu'aucun bloc ne pose.
  lave: 'eau',
};

/**
 * Les matières rangées par analogie qui restent à valider par le directeur artistique : aucun bloc ne les pose (le test
 * le vérifie). Toutes les autres sont confirmées (le 5e le 9 octobre 2026, le 4e et le 3e le 10 octobre 2026).
 */
export const FAMILIES_TO_CONFIRM: readonly TextureKind[] = ['basalte', 'lave'];

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
