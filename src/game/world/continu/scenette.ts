// La scénette d'un lieu (piste 1, lot 2, choix du mainteneur du 14 octobre 2026) : à l'arrivée, la caméra descend dans
// le lieu, Kéo se tient à gauche, l'habitant à droite, immobile, et les objets-réponses sont en rangée en bas, sous la
// consigne écrite et lue dans un panneau sur fond uni. Le Phare d'abord : la galerie et sa rambarde, la gardienne en
// quatre volumes (son ciré, sa tête, son bonnet, son bras tendu vers la rambarde) et la corde de sonnerie, les cloches
// pendues devant la rambarde ; à la réussite, elles s'effacent (la lanterne s'allume quand son haut est posé, jamais à
// une réussite). Les Quais ensuite (lot 3) : le docker au pied de la
// grue, un bras posé sur une caisse, son crochet de levage à la main, les caisses-réponses sur un ponton du bassin ; la
// bonne caisse monte au crochet de la grue. Les Filets et les Écluses enfin (lot 4) : la pêcheuse au bord du plancher
// de séchage, la pêche sur le filet, les paniers-réponses en rangée, la prise qui va au bon panier ; à la réussite, le
// filet raccommodé se tend sur le séchoir et un panier plein vient à ses pieds. L'éclusier sur le quai du sas, les
// leviers de vanne en rangée, la barque qui avance dans le canal jusqu'à la porte ; à la réussite, le sas se remplit,
// la porte s'ouvre et la barque passe. Une scénette se joue sur le lieu tel qu'il est bâti (GD-20, lot 1) : tant que
// l'étape qui porte sa trace n'est pas posée (`posed`), avec ce qui est là (au Phare, au pied de la tour, la cloche
// tombée sur le socle). Rien à lire n'est peint dans la 3D. Le décor de près est fait à l'arrivée et
// libéré au départ par la vue. Code pur : la vue dessine.
import { CAMERA_FOV, screenOf, wrapAngle, type CameraPose } from './camera';
import { FacetBuilder, type Facets } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { placeArt } from './northShore';
import { placeById, scenePlace, type PlaceId as AnyPlaceId, type ScenePlaceId as PlaceId } from './levelPlan';
import { heightFor } from './placeGround';
import { COLORS_6E, DECK_HEIGHT } from './plan6e';
import {
  ANSWER_LAYOUT,
  ECLUSES_TRACE_SPOTS,
  ENGINE_TRACE_SPOTS,
  LOCK,
  PHARE_GALLERY,
  PHARE_TRACE_SPOTS,
  FILETS_TRACE_SPOTS,
  QUAIS_TRACE_SPOTS,
  QUAY,
  ENGINE_PAVING_RISE,
  SALTWORKS_TRACE_SPOTS,
  SHIPYARD_FLOOR_RISE,
  SHIPYARD_TRACE_SPOTS,
  MANGROVE_SCENE_DECK,
  MANGROVE_TRACE_SPOTS,
  RUINS_PAVING_RISE,
  RUINS_TRACE_SPOTS,
  OBSERVATORY_PAVING_RISE,
  OBSERVATORY_TRACE_SPOTS,
  COMMONS_PAVING_RISE,
  COMMONS_TRACE_SPOTS,
  filetsBasketAt,
  fullBasket,
  liftingHook,
  loadedBoat,
  lockBoat,
  lockFull,
  mendedNet,
  quaySuccess,
  sceneDepth,
  sceneSpot,
  type AnswerSlot,
  type QuestionLayout,
  type ScreenBox,
} from './questionScene';
import type { ItemScene } from './questions';
import { heightAt, standingHeight } from './terrain';
import { SHADOW_DIR } from './sky';
import { SURROUNDINGS } from './surroundings';
import { HABITANT_HEIGHT, habitantEastSide, habitantWestHand, loadedHabitant } from './habitants';
import { MANGROVE, mangroveDeckTop } from './places';

/**
 * Ce que l'élève lit de l'habitant : son rôle en tête du panneau, sans prénom tant que le mainteneur n'a pas tranché
 * (deambuler-scenettes.md, lot 2 : la fiche du 6e dit « habitants sans nom ni réplique ») ; `greeting`, une phrase
 * courte qui explique un rôle peu familier, écrite sous le rôle à la première rencontre seulement (directeur
 * artistique, relecture de L7 ; le texte du contenu), sinon `null`. `placement` : les
 * objets-réponses en rangée en bas (`rangee`, dispositions A et B) ; « à leur place » dans le décor (la disposition C)
 * viendra ici, si le mainteneur la choisit, sans changer le reste.
 */
export interface Scenette {
  role: string;
  greeting: string | null;
  placement: 'rangee';
}

const SCENETTES: Record<PlaceId, Scenette> = {
  // « du phare » : on ne la confond pas avec le Gardien de l'île (consultant Archipéo).
  phare: { role: 'La gardienne du phare', greeting: null, placement: 'rangee' },
  // Le rôle seul, sans prénom ni réplique (choix du mainteneur du 15 octobre 2026).
  quais: { role: 'Le docker', greeting: null, placement: 'rangee' },
  // Lot 4 : « la pêcheuse » (le mot du consultant Archipéo, plus court à lire que « la ramendeuse »), « l'éclusier ».
  filets: { role: 'La pêcheuse', greeting: null, placement: 'rangee' },
  ecluses: { role: 'L’éclusier', greeting: 'L’éclusier ouvre et ferme l’écluse pour les bateaux.', placement: 'rangee' },
  // Lot L5 : « la saunière » (directeur artistique, consultant Archipéo).
  saltworks: { role: 'La saunière', greeting: 'La saunière récolte le sel de la mer.', placement: 'rangee' },
  // Lot L6a : « la machiniste » (directeur artistique : « la mécanicienne » ferait doublon avec Zia).
  engine: { role: 'La machiniste', greeting: null, placement: 'rangee' },
  // Lot L6b : « le charpentier » (directeur artistique).
  shipyard: { role: 'Le charpentier', greeting: null, placement: 'rangee' },
  // Le rivage nord (lot L7, directeur artistique, consultant Archipéo) : le rôle de chaque fichier de lieu (placeArt.ts).
  lookout: { role: placeArt('lookout')!.role, greeting: null, placement: 'rangee' },
  // « Copie » et non « recopie », le modèle des préfixes de Familles-craft (directeur du contenu pédagogique). Une phrase
  // pour un rôle qu'un élève de 11 ans ne devine ni par le mot ni par la scène (directeur artistique) : la copiste,
  // l'éclusier, la saunière, le pilote du chenal.
  archives: { role: placeArt('archives')!.role, greeting: 'La copiste copie les textes à la main.', placement: 'rangee' },
  printworks: { role: placeArt('printworks')!.role, greeting: null, placement: 'rangee' },
  // Lot L8a : « la botaniste » (directeur artistique), le même mot partout.
  mangrove: { role: 'La botaniste', greeting: null, placement: 'rangee' },
  // Lot L8b : « l'archéologue » (directeur artistique ; un homme, consultant Archipéo), le même mot partout.
  ruins: { role: 'L’archéologue', greeting: null, placement: 'rangee' },
  // Lot L8c : « la photographe » (directeur artistique), une visiteuse du lieu (consultant Archipéo).
  observatory: { role: 'La photographe', greeting: null, placement: 'rangee' },
  // Lot L8d : « le couvreur » (directeur artistique), un métier, jamais un élu.
  commons: { role: 'Le couvreur', greeting: null, placement: 'rangee' },
  // Le large (lot L9, directeur artistique, consultant Archipéo) : « le pilote du chenal » (jamais celui d'un avion),
  // « le chef de gare » ; le rôle de chaque fichier de lieu (placeArt.ts).
  // « Chenal » expliqué aussi, pas seulement « pilote » (directeur artistique).
  beacons: { role: placeArt('beacons')!.role, greeting: 'Le pilote guide les bateaux dans le chenal, le passage sûr dans l’eau.', placement: 'rangee' },
  ferry: { role: placeArt('ferry')!.role, greeting: null, placement: 'rangee' },
  // Le 5e, la Montée (GD-22, lot 3) : « la fontainière » (directeur artistique), son nom attend le mot du mainteneur ; sa
  // réplique, une idée, le sommet (consultant d'Archipéo et référent dys, première relecture du lot 3).
  montee: { role: placeArt('montee')!.role, greeting: 'La fontainière monte l’eau jusqu’au sommet, godet par godet.', placement: 'rangee' },
  // Le Hameau (GD-22, lot 5) : « le boulanger », sans prénom (fiche du 5e, § 6) ; sa réplique, une idée, le four commun,
  // à relire par le directeur du contenu pédagogique.
  hameau: { role: placeArt('hameau')!.role, greeting: 'Le boulanger cuit le pain de tout le village, dans le four commun.', placement: 'rangee' },
  // Les Radeaux (GD-22, lot 6) : « le marchand », sans prénom (fiche du 5e, § 6) ; sa réplique, une idée, le marché sur
  // l'eau, à relire par le directeur du contenu pédagogique (jamais « Bazar » ni « le Colporteur »).
  radeaux: { role: placeArt('radeaux')!.role, greeting: 'Ici, le marchand pèse et compare.', placement: 'rangee' },
  // La Croisée (GD-22, lot 7) : « la cordière », sans prénom ; sa réplique, une idée, les passerelles, validée par le
  // directeur du contenu pédagogique (retouche 1, avec le directeur artistique, le consultant d'Archipéo et le référent dys).
  croisee: { role: placeArt('croisee')!.role, greeting: 'La cordière tresse les cordes qui tiennent les passerelles.', placement: 'rangee' },
  // Les Instants (GD-22, lot 8) : « le tailleur de pierre », sans prénom (fiche du 5e, § 6) ; sa réplique, une idée, la
  // chaussée, à relire par le directeur du contenu pédagogique (sans nom propre, sans le mot du lieu).
  instants: { role: placeArt('instants')!.role, greeting: 'Le tailleur de pierre redresse la chaussée, une pierre après l’autre.', placement: 'rangee' },
};

/** La scénette d'un lieu : depuis le lot 4 de la piste 1, chaque lieu a la sienne (la question vue de loin est retirée). */
export const scenetteOf = (place: AnyPlaceId): Scenette => SCENETTES[scenePlace(place)];

// ---------- La place de la scénette à l'écran ----------

/**
 * Les zones de la scénette, en part de l'écran (consultant UX UI, lot 2). A, sur tablette : la consigne en haut (L 3-74,
 * H 3-26), Kéo et l'habitant au milieu (H 28-64), la rangée des réponses en bas (H 66-90), « Valider » en bas à droite.
 * B, sur un écran bas : la colonne de la consigne à gauche (celle du lot 4, `questionLayout`), la scène à droite (L
 * 40-100, H 16-62), la rangée en bas à droite (H 64-88), ou sur toute la largeur si les mots n'y tiennent pas.
 */
export const SCENETTE_LAYOUT = {
  edge: 0.03,
  /**
   * La marge de la rangée des réponses au bord droit de l'écran (et au gauche sur tablette), en pixels : 16 au moins,
   * hors de la zone sûre (relecture UX UI du lot 5 du 5e : l'étiquette de droite finissait à 12 px du bord).
   */
  rowEdge: 16,
  panelRight: 0.74,
  /** « Vue simple » et la pause, en haut à droite : la place gardée, en pixels. */
  topRight: 250,
  /** Au plus grand texte, le panneau commence sous cette barre, en pixels sous le bord (son bouton y est plus haut). */
  grandTop: 84,
  /**
   * La scène, un peu plus bas que la zone de l'UX UI (H 28-64) : le toit de la lanterne passe sous le panneau, qui
   * descend à 37 % environ avec le rôle, la consigne et le son (retour du directeur artistique).
   */
  stage: { top: 0.37, bottom: 0.66 },
  row: { top: 0.66, bottom: 0.9 },
  low: { left: 0.4, top: 0.16, bottom: 0.62, rowTop: 0.64, rowBottom: 0.88 },
  /**
   * Sur un écran bas, quand l'item a sa règle (la carte de l'accord des Filets) : la rangée passe sous la colonne, à
   * gauche ; à droite, la règle en haut, sous la barre, jusqu'à cette part de la hauteur, et la scène dessous, jusqu'en
   * bas.
   */
  lowAid: 0.66,
  /**
   * Et la rangée y est décalée d'un cran vers la droite, en pixels : le premier panier, vu de biais, plus large que
   * son étiquette, n'est pas rogné par le bord gauche (relecture du directeur artistique, lot 4).
   */
  lowAidInset: 28,
  /**
   * « Valider » en bas à droite : la place gardée, en pixels (le bouton peut être plus large en grand texte), et
   * l'écart au-dessus de lui, plus large que celui des réponses (retour UX UI).
   */
  validate: { width: 176, height: 60, gap: 20 },
  /** Les cloches, d'un tiers plus petites que la place au-dessus de leur mot : la poutre descend sous Kéo et l'habitant. */
  objectShare: 2 / 3,
  /** La largeur d'une étiquette au plus quand la rangée passe sous la colonne pour un mot coupé (`wideRow`), en pixels. */
  wideLabel: 320,
} as const;

/**
 * Ce que demande une scénette : combien de réponses, sur un écran bas le cran de la colonne (`questionLayout`), et des
 * objets plus petits (`small` : les cloches, d'un tiers plus petites que la place au-dessus de leur mot).
 */
export interface ScenetteNeeds {
  count: number;
  widen?: number;
  small?: boolean;
  /** Des mots à lire sous les objets (les cloches) : leurs étiquettes sont plus larges que celles des nombres. */
  words?: boolean;
  /**
   * Le plus grand texte : en A, le panneau passe sous la barre de « Vue simple » et de la pause (le bouton s'y élargit
   * avec son mot) et prend toute la largeur, pour que la consigne tienne sans défiler.
   */
  grand?: boolean;
  /**
   * La colonne à gauche sur tous les écrans (la disposition B, même sur tablette) : la consigne, la phrase de l'item, sa
   * ligne de calcul et l'indice n'y tiennent pas en haut sans couvrir la scène (les Quais).
   */
  column?: boolean;
  /**
   * L'item a sa règle (les Filets) : sur un écran bas, elle ne tient pas dans la colonne avec la phrase ; elle se pose à
   * droite, au-dessus de la scène.
   */
  aid?: boolean;
  /**
   * La rangée sous la colonne, sur toute la largeur, même si les étiquettes tiendraient à côté d'elle, et ses étiquettes
   * plus larges (`SCENETTE_LAYOUT.wideLabel`) : un mot de réponse y était coupé (« Elles sont égales », lot L2).
   */
  wideRow?: boolean;
}

/** Une rangée de `n` réponses entre `left` et `right`, l'étiquette en bas (`bottom`), l'objet au-dessus jusqu'à `top`. */
function rowSlots(n: number, left: number, right: number, top: number, bottom: number, lh: number, share: number, max: number = ANSWER_LAYOUT.maxWidth): { slots: AnswerSlot[]; objectHeight: number } {
  const L = ANSWER_LAYOUT;
  const w = Math.max(48, Math.min(max, (right - left - (n - 1) * L.gap) / n));
  const objectHeight = Math.max(lh, share * Math.min(L.objectShare * (w + L.gap), bottom - lh - L.lift - top));
  const total = n * w + (n - 1) * L.gap;
  const first = (left + right - total) / 2;
  const slots: AnswerSlot[] = [];
  for (let i = 0; i < n; i++) {
    const l = first + i * (w + L.gap);
    const label = { left: l, right: l + w, top: bottom - lh, bottom };
    const foot = { x: l + w / 2, y: label.top - L.lift };
    slots.push({ label, foot, hit: { left: l, right: l + w, top: foot.y - objectHeight, bottom } });
  }
  return { slots, objectHeight };
}

/** La place d'une scénette : celle d'une question, et toujours la scène (`scenette`). */
export type ScenetteLayout = QuestionLayout & { scenette: NonNullable<QuestionLayout['scenette']> };

/**
 * B, sur un écran bas, quand l'item a sa règle (les Filets) : la colonne en haut à gauche, la rangée sous elle ; à
 * droite, la règle sous la barre du haut, et la scène dessous, jusqu'en bas. La règle ne tient pas dans la colonne avec la
 * phrase, et la scène ne tient pas sous elle avec la rangée.
 */
function lowWithAid(n: number, width: number, height: number, base: QuestionLayout, sideLeft: number, share: number): ScenetteLayout {
  const S = SCENETTE_LAYOUT;
  const L = ANSWER_LAYOUT;
  const edge = L.edgeLow;
  const right = width - edge;
  // La rangée glisse d'un cran vers la droite, ses étiquettes gardant leur largeur (un mot coupé mènerait à « Vue
  // simple ») : elle passe d'autant sous le coin gauche de la scène, au bas, où Kéo ne se tient pas ; la règle garde
  // toute sa largeur.
  const inset = S.lowAidInset;
  const { slots, objectHeight } = rowSlots(n, edge + inset, sideLeft - edge + inset, S.low.rowTop * height, height - edge, L.labelLow, share);
  const highest = Math.min(...slots.map((s) => s.hit.top));
  const split = S.lowAid * height;
  const stage = { left: sideLeft, top: split, right, bottom: height - edge };
  return {
    ...base,
    slots,
    objectHeight,
    panel: { ...base.panel, maxHeight: Math.max(0, highest - edge - base.panel.top) },
    aid: { left: sideLeft, top: edge + L.bar + edge, right, bottom: split - edge },
    view: stage,
    scenette: { stage, validate: null },
  };
}

/**
 * Une scénette sans rangée (les réponses dans la colonne) : en B, la colonne à gauche jusqu'en bas, la scène à droite,
 * de sa hauteur d'ordinaire jusqu'au bas de la rangée ; en A (le plus grand texte sur tablette), le panneau en haut sur
 * toute la largeur, jusqu'en bas, la scène dessous.
 */
function withoutRow(width: number, height: number, base: QuestionLayout, needs: ScenetteNeeds): ScenetteLayout {
  const S = SCENETTE_LAYOUT;
  const L = ANSWER_LAYOUT;
  if (base.low || needs.column) {
    const edge = base.low ? L.edgeLow : L.edge;
    const sideLeft = Math.max(S.low.left * width, base.panel.left + base.panel.width + edge);
    const stage = { left: sideLeft, top: S.low.top * height, right: width - edge, bottom: S.low.rowBottom * height };
    return { ...base, slots: [], objectHeight: 0, panel: { ...base.panel, maxHeight: Math.max(0, height - edge - base.panel.top) }, aid: null, view: stage, scenette: { stage, validate: null } };
  }
  const edge = S.edge * width;
  const top = S.edge * height + (needs.grand ? S.grandTop : 0);
  const stage = { left: edge, top: S.stage.top * height, right: width - edge, bottom: S.row.bottom * height };
  return {
    low: false,
    slots: [],
    objectHeight: 0,
    panel: { left: edge, top, width: needs.grand ? width - 2 * edge : Math.max(0, Math.min(S.panelRight * width, width - S.topRight) - edge), maxHeight: Math.max(0, height - L.edgeLow - top) },
    aid: null,
    view: stage,
    scenette: { stage, validate: null },
  };
}

/**
 * La place d'une scénette sur un écran de `width` × `height` pixels : `questionLayout` pour la colonne d'un écran bas
 * (ses crans), puis la scène et la rangée de la disposition A ou B. `scenette.stage` : là où Kéo et l'habitant se
 * tiennent ; `scenette.validate` : la place de « Valider » en bas à droite (A), `null` sur un écran bas (il reste dans
 * la colonne). L'ordre des réponses ne change jamais.
 */
export function scenetteLayout(needs: ScenetteNeeds, width: number, height: number, base: QuestionLayout): ScenetteLayout {
  const S = SCENETTE_LAYOUT;
  const L = ANSWER_LAYOUT;
  const n = Math.max(1, needs.count);
  const share = needs.small ? S.objectShare : 1;
  // Aucune réponse dans la scène (`count` 0 : elles restent dans la colonne, Calculer avec des fractions, GD-20, point 8,
  // lot L2) : ni rangée ni « Valider » ; la colonne descend jusqu'en bas, la scène prend la place de la rangée.
  if (needs.count === 0) return withoutRow(width, height, base, needs);
  if (base.low || needs.column) {
    // B : la scène à droite de la colonne ; la rangée à droite aussi si les mots y tiennent, sinon sur toute la largeur
    // (comme au lot 4), la colonne s'arrêtant alors au-dessus d'elle.
    const lh = base.low ? L.labelLow : L.label;
    const edge = base.low ? L.edgeLow : L.edge;
    const right = width - edge;
    const sideLeft = Math.max(S.low.left * width, base.panel.left + base.panel.width + edge);
    if (base.low && needs.aid && sideLeft < width / 2 + edge) return lowWithAid(n, width, height, base, sideLeft, share);
    // La rangée à 16 px du bord droit ; à côté de la colonne, elle glisse vers elle, à 8 px d'elle au plus près, pour
    // garder sa largeur (retouche 2 du lot 5 du 5e : plus étroites de 4 px, « Constitution » ne tenait plus dans son
    // étiquette, et la rangée passait sous la colonne, qui coupait la phrase).
    const rowRight = width - Math.max(edge, S.rowEdge);
    const besideLeft = Math.max(base.panel.left + base.panel.width + L.edgeLow, sideLeft - (Math.max(edge, S.rowEdge) - edge));
    const beside = !needs.wideRow && (rowRight - besideLeft - (n - 1) * L.gap) / n >= (needs.words ? L.minLabelBells : L.minLabel);
    const rowLeft = beside ? besideLeft : edge;
    const { slots, objectHeight } = rowSlots(n, rowLeft, rowRight, S.low.rowTop * height, S.low.rowBottom * height, lh, share, needs.wideRow ? S.wideLabel : L.maxWidth);
    const highest = Math.min(...slots.map((s) => s.hit.top));
    const panelBottom = beside ? height - edge : highest - edge;
    const stage = { left: sideLeft, top: S.low.top * height, right, bottom: Math.min(S.low.bottom * height, highest - edge) };
    return {
      ...base,
      slots,
      objectHeight,
      panel: { ...base.panel, maxHeight: Math.max(0, panelBottom - base.panel.top) },
      aid: null,
      view: stage,
      scenette: { stage, validate: null },
    };
  }
  // A : la consigne en haut, la scène au milieu, la rangée en bas, « Valider » en bas à droite, sous la rangée ou à
  // côté d'elle si l'écran est trop court.
  const edge = S.edge * width;
  const lh = L.label;
  const validate = { left: width - edge - S.validate.width, right: width - edge, top: height - L.edgeLow - S.validate.height, bottom: height - L.edgeLow };
  // La rangée s'arrête au-dessus de « Valider » ; sur un écran trop court pour cela, elle s'arrête à sa gauche.
  const above = Math.min(S.row.bottom * height, validate.top - S.validate.gap);
  const roomy = above - S.row.top * height >= 2 * lh + L.lift;
  const rowBottom = roomy ? above : S.row.bottom * height;
  // La rangée prend toute la largeur, à 16 px des bords : les mots des cloches, leur image devant, y tiennent.
  const rowRight = roomy ? width - S.rowEdge : validate.left - S.validate.gap;
  const { slots, objectHeight } = rowSlots(n, S.rowEdge, rowRight, S.row.top * height, rowBottom, lh, share);
  const top = S.edge * height + (needs.grand ? S.grandTop : 0);
  const panelWidth = needs.grand ? width - 2 * edge : Math.max(0, Math.min(S.panelRight * width, width - S.topRight) - edge);
  const highest = Math.min(...slots.map((s) => s.hit.top));
  const stage = { left: edge, top: S.stage.top * height, right: width - edge, bottom: Math.min(S.stage.bottom * height, highest - L.gap) };
  return {
    low: false,
    slots,
    objectHeight,
    // Le panneau prend la hauteur de son texte (H 3-26 d'ordinaire) ; un très grand texte ou le résultat le font
    // descendre sur la scène, jamais sur la rangée.
    panel: { left: edge, top, width: panelWidth, maxHeight: Math.max(0, highest - L.gap - top) },
    aid: null,
    view: stage,
    scenette: { stage, validate },
  };
}

// ---------- La galerie du Phare ----------

/** La galerie de la scénette, au-dessus du pied du Phare : son plancher, son rayon, la hauteur de sa rambarde. */
export const GALLERY = { floor: 11.55, radius: 3.4, rail: 0.75, posts: 16 } as const;

/**
 * Le lieu d'une scénette : le sol où se tiennent Kéo et l'habitant (`floor`), leurs places depuis lui (Kéo à gauche,
 * son échelle et son cap ; l'habitant à droite), ce que la caméra cadre (de Kéo à l'habitant, en largeur ; du plus bas au
 * plus haut à montrer, en unités au-dessus du sol ; le point visé, `depth` vers la caméra) et l'angle de la caméra sous
 * l'horizon. Au Phare, la galerie ; aux Quais, la bande de devant du quai, au pied de la grue (lot 3).
 */
interface ScenetteSite {
  floor(): Vec3;
  keo: { dx: number; dz: number; scale: number; yaw: number };
  habitant: { dx: number; dz: number };
  subject: { halfWidth: number; bottom: number; top: number; depth: number };
  pitch: number;
  /**
   * Le cap de départ de la caméra, l'angle dont elle a déjà tourné autour du point visé quand la scénette s'ouvre et à
   * chaque nouvel item (comme à deux doigts, `orbitAround`) ; nul ou absent : de face, vue du sud.
   */
  start?: number;
  /**
   * L'arc où la caméra peut tourner, de part et d'autre du cap de départ (en radians) ; absent : le tour complet. Au Phare
   * et au Guet, de dos, le lieu cache Kéo et l'habitant (directeur artistique, 19 octobre 2026).
   */
  arc?: number;
}

/** Le sol de la galerie du Phare. */
function galleryFloor(): Vec3 {
  const p = placeById('phare');
  return { x: p.center.x, y: standingHeight(heightAt(p.center)) + GALLERY.floor, z: p.center.z };
}

/** Le haut du socle de rochers du Phare, au-dessus du sol de son centre (places.ts, sa ruine). */
export const PHARE_SOCLE = 0.7;

/** Le pied du Phare : le dessus de son socle de rochers, où la cloche est tombée. */
function socleFloor(): Vec3 {
  const p = placeById('phare');
  return { x: p.center.x, y: standingHeight(heightAt(p.center)) + PHARE_SOCLE, z: p.center.z };
}

/** Le dessus du muret des Marais salants, au-dessus de la grève : l'eau du bassin, derrière lui, reste au-dessus du sol. */
function saltLevee(): Vec3 {
  const o = sceneSpot('saltworks');
  return { x: o.x, y: o.y + SALT_PAN.rise, z: o.z };
}

/** Le sol des Quais : le milieu de la bande de devant du quai, contre le bord du bassin. */
function quayFloor(): Vec3 {
  const o = sceneSpot('quais');
  return { x: o.x, y: o.y, z: o.z + QUAY.depth / 2 - QUAY.strip / 2 };
}

/** La scénette d'un lieu du rivage nord (lot L7) : celle de son fichier (placeArt.ts), son sol au-dessus de la scène. */
function northSite(place: PlaceId): ScenetteSite {
  const { rise, ...site } = placeArt(place)!.site;
  return {
    floor: () => {
      const s = sceneSpot(place);
      return { ...s, y: s.y + rise };
    },
    ...site,
  };
}

/** Le cap de départ de la scénette des Écluses : dans l'axe du canal, à l'est, un peu au sud de son axe. */
const ECLUSES_START = (65 * Math.PI) / 180;

/**
 * Le cap de départ de la scénette de l'Imprimerie : un peu depuis le sud-ouest (reprise du lieu, 18 octobre 2026). L'atelier
 * du lieu glisse sous le panneau, à gauche ; à droite, l'atelier ouvert des abords, sa presse et la corde de séchage.
 */
const PRINTWORKS_START = (-20 * Math.PI) / 180;

/**
 * Les arcs de la caméra au Phare et au Guet, réglés sur captures (19 octobre 2026). Sur la galerie, 40° (directeur
 * artistique : pas moins) : la potence des abords, au revers de la tour, n'y entre jamais ; le portique des cloches
 * (questionScene.ts, `hangBells`) tourne avec la caméra autour de l'axe de la galerie (`bellPlane`,
 * `facingAnswerObjects`) : de face, horizontal, sous la rambarde, ses cloches sous leurs boutons. À chaque butée, dans
 * les deux missions, la poutre, ses potences et la plus grande cloche de la mission 2 restent sous les pieds de Kéo et
 * de la gardienne, de peu : celui qui s'avance vers la caméra a les pieds juste au-dessus de la poutre. Au
 * pied de la tour, 70° : plus loin, la tour cache Kéo d'un côté, Kéo cache la gardienne de l'autre. Au Guet, 120° : la
 * caméra monte au-dessus de la tour et les garde entiers jusque-là.
 */
export const SCENETTE_ARCS = { phare: (40 * Math.PI) / 180, phareFoot: (70 * Math.PI) / 180, lookout: (120 * Math.PI) / 180 } as const;

const SITES: Record<PlaceId, ScenetteSite> = {
  phare: {
    floor: galleryFloor,
    keo: { dx: -1.45, dz: 2.3, scale: 0.6, yaw: Math.PI - 0.35 },
    habitant: { dx: 1.45, dz: 2.3 },
    subject: { halfWidth: 2.2, bottom: -0.1, top: 2.3, depth: 2 },
    pitch: (20 * Math.PI) / 180,
    arc: SCENETTE_ARCS.phare,
  },
  // La scène reste proche (réserve du directeur artistique) : Kéo, les caisses et le docker, la barque dessous ; la
  // flèche de la grue peut passer sous le panneau. Plus près et plus bas depuis la reprise du lieu (directeur artistique,
  // évaluation du 18 octobre 2026 : « caméra trop haute et loin ») : la maison à colombages entre dans le cadre, derrière.
  quais: {
    floor: quayFloor,
    keo: { dx: -4, dz: 0, scale: 0.6, yaw: Math.PI - 0.45 },
    habitant: { dx: 3.4, dz: 0 },
    subject: { halfWidth: 4.4, bottom: -1.1, top: 3.7, depth: 0.2 },
    pitch: (18 * Math.PI) / 180,
  },
  // Les Filets (lot 4) : Kéo et la pêcheuse sur le plancher de séchage, de part et d'autre du filet étendu ; le séchoir
  // du lieu derrière eux (son pan raccommodé à la réussite).
  filets: {
    floor: () => sceneSpot('filets'),
    keo: { dx: -3.9, dz: 0.7, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 3.9, dz: 0.7 },
    subject: { halfWidth: 5.2, bottom: -0.4, top: 2.4, depth: 0.2 },
    pitch: (26 * Math.PI) / 180,
  },
  // Les Écluses (lot 4) : Kéo et l'éclusier sur le quai du sas, de part et d'autre de sa paroi ; le canal devant eux,
  // sa porte entre le sas et l'éclusier ; assez large pour la barque passée la porte.
  ecluses: {
    floor: () => sceneSpot('ecluses'),
    keo: { dx: -3.5, dz: 0.1, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 3.7, dz: 0.1 },
    subject: { halfWidth: 5.3, bottom: -0.6, top: 3.5, depth: 0.6 },
    pitch: (22 * Math.PI) / 180,
    // Dans l'axe du canal, depuis l'aval, à l'est (recommandation du directeur artistique du 18 octobre 2026, en attente
    // du mainteneur ; pour revenir de face, retirer `start`) : un peu en biais, pour que la paroi du sas et son niveau
    // d'eau restent lisibles et que la paroi ne cache pas Kéo.
    start: ECLUSES_START,
  },
  // Les Marais salants (lot L5) : Kéo et la saunière sur le muret d'argile au bord d'un bassin, au premier plan ; la
  // jauge ou la vanne du bassin entre eux, dans l'eau ; la grille des bassins et le hangar à sel derrière. Assez serrés
  // pour que les graduations de la jauge restent à 8 px l'une de l'autre au moins sur un téléphone couché (contenu).
  saltworks: {
    floor: saltLevee,
    keo: { dx: -3, dz: 0.35, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 3, dz: 0.35 },
    subject: { halfWidth: 4.1, bottom: -0.5, top: 3.6, depth: 0.4 },
    pitch: (20 * Math.PI) / 180,
  },
  // La Turbine (lot L6a) : Kéo et la machiniste sur le dallage devant la chaudière, de part et d'autre de la soupape
  // (l'objet témoin) ; la chaudière et son évent derrière eux, le rotor dans son carter derrière la machiniste, vus du sud.
  engine: {
    floor: () => {
      const s = sceneSpot('engine');
      return { ...s, y: s.y + ENGINE_PAVING_RISE };
    },
    keo: { dx: -2.6, dz: 0.25, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.6, dz: 0.25 },
    subject: { halfWidth: 3.7, bottom: -0.4, top: 3.2, depth: 0.3 },
    pitch: (18 * Math.PI) / 180,
  },
  // Le Chantier naval (lot L6b) : Kéo et le charpentier sur le plancher, au sud-est de la coque, de part et d'autre de la
  // planche de bordé sur ses tréteaux (l'objet témoin) ; la coque derrière eux, en oblique, son flanc vers la caméra.
  shipyard: {
    floor: () => {
      const s = sceneSpot('shipyard');
      return { ...s, y: s.y + SHIPYARD_FLOOR_RISE };
    },
    keo: { dx: -2.4, dz: 0.55, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.6, dz: 0.3 },
    subject: { halfWidth: 3.8, bottom: -0.4, top: 3.3, depth: 0.2 },
    pitch: (18 * Math.PI) / 180,
  },
  lookout: { ...northSite('lookout'), arc: SCENETTE_ARCS.lookout },
  archives: northSite('archives'),
  printworks: { ...northSite('printworks'), start: PRINTWORKS_START },
  beacons: northSite('beacons'),
  ferry: northSite('ferry'),
  montee: northSite('montee'),
  hameau: northSite('hameau'),
  radeaux: northSite('radeaux'),
  croisee: northSite('croisee'),
  instants: northSite('instants'),
  // La Mangrove (lot L8a) : Kéo et la botaniste sur le platelage de rive, devant le départ de la passerelle, vus du sud ;
  // derrière eux l'eau, les racines et la pirogue (l'objet témoin, au milieu), le carbet en haut du cadre.
  mangrove: {
    floor: mangroveFloor,
    keo: { dx: -2.6, dz: 0.35, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.6, dz: 0.35 },
    subject: { halfWidth: 3.7, bottom: -0.8, top: 3.2, depth: 0 },
    // Plus plongeante que les autres : la pirogue, sur l'eau derrière le platelage, reste vue entière.
    pitch: (28 * Math.PI) / 180,
  },
  // Les Ruines (lot L8b) : Kéo et l'archéologue sur le dallage dégagé, devant l'arcade, vus du sud ; deux arcs entiers
  // remplissent le fond ; le treuil de fouille (l'objet témoin) au milieu, entre eux.
  ruins: {
    floor: () => {
      const s = sceneSpot('ruins');
      return { ...s, y: s.y + RUINS_PAVING_RISE };
    },
    keo: { dx: -2.6, dz: 0.3, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.6, dz: 0.3 },
    subject: { halfWidth: 3.7, bottom: -0.4, top: 3.9, depth: 0.3 },
    pitch: (16 * Math.PI) / 180,
  },
  // L'Observatoire (lot L8c) : Kéo et la photographe sur la terrasse, contre le tambour, de part et d'autre de la baie
  // (l'objet témoin) ; le mur de la rotonde fait le fond, la coupole en haut du cadre ; la caméra plonge assez pour que
  // l'horizon reste hors du cadre (ni le Port, ni la digue, ni le Phare, ni la plage). Assez loin du parapet (le point de
  // la scène, questionScene.ts, `SCENE_SPOT`) pour qu'il reste sous leurs pieds (relecture de L8c-d).
  observatory: {
    floor: () => {
      const s = sceneSpot('observatory');
      return { ...s, y: s.y + OBSERVATORY_PAVING_RISE };
    },
    keo: { dx: -2.4, dz: 0.6, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.4, dz: 0.6 },
    subject: { halfWidth: 3.7, bottom: -0.3, top: 3.3, depth: 0.3 },
    pitch: (26 * Math.PI) / 180,
  },
  // La Halle (lot L8d) : Kéo et le couvreur sous le bord sud de la toiture, de part et d'autre de la borne-fontaine
  // (l'objet témoin), entre les deux piliers du milieu ; le bord du toit en haut du cadre, les piliers et la charpente
  // derrière ; la caméra plonge à peine : elle reste sous l'égout, et la toiture cache le village derrière (l'école et
  // ses enseignes, sur la place de l'Escale, juste au nord).
  commons: {
    floor: () => {
      const s = sceneSpot('commons');
      return { ...s, y: s.y + COMMONS_PAVING_RISE };
    },
    keo: { dx: -2.6, dz: 0.6, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.6, dz: 0.6 },
    subject: { halfWidth: 3.7, bottom: -0.3, top: 3.0, depth: 0.3 },
    pitch: (4 * Math.PI) / 180,
  },
};

/** Le plancher de la scénette de la Mangrove : juste au-dessus du platelage de rive du lieu (places.ts). */
function mangroveFloor(): Vec3 {
  const o = sceneSpot('mangrove');
  const c = placeById('mangrove').center;
  return { x: o.x, y: standingHeight(heightAt(c)) + mangroveDeckTop() + MANGROVE_SCENE_DECK.rise, z: o.z };
}

/**
 * La scénette du Phare tant que sa galerie n'est pas posée (directeur artistique, GD-20 lot 1) : au pied de la tour,
 * sur le socle de rochers, parmi les pierres tombées, où la cloche est tombée ; Kéo et la gardienne de part et d'autre de
 * la porte, la caméra basse.
 */
const PHARE_FOOT: ScenetteSite = {
  floor: socleFloor,
  keo: { dx: -1.45, dz: 2.05, scale: 0.6, yaw: Math.PI - 0.35 },
  habitant: { dx: 1.45, dz: 2.05 },
  subject: { halfWidth: 2.2, bottom: -0.1, top: 2.3, depth: 2 },
  pitch: (9 * Math.PI) / 180,
  arc: SCENETTE_ARCS.phareFoot,
};

/**
 * Le lieu d'une scénette, selon ce qui est bâti (`posed` : l'étape qui porte sa trace est posée, construction.ts,
 * `traceStagePosed`). Seul le Phare change de place : sur sa galerie, ou à son pied.
 */
const siteOf = (place: PlaceId, posed = true): ScenetteSite => (place === 'phare' && !posed ? PHARE_FOOT : SITES[place]);

/** L'angle de la caméra de la scénette du Phare sous l'horizon, et le temps de la descente (coupe franche avec « Réduire les animations »). */
export const SCENETTE_CAMERA = { pitch: (20 * Math.PI) / 180, seconds: 0.9 } as const;

/** Le cap de départ de la caméra d'une scénette (`ScenetteSite.start`) : 0, de face. */
export const scenetteStartYaw = (place: AnyPlaceId, posed = true): number => siteOf(scenePlace(place), posed).start ?? 0;

/** L'arc de la caméra d'une scénette autour de son cap de départ (`ScenetteSite.arc`) ; `null` : le tour complet. */
export const scenetteArc = (place: AnyPlaceId, posed = true): number | null => siteOf(scenePlace(place), posed).arc ?? null;

/**
 * L'angle de la caméra autour de la scène après un geste de `d` : borné à l'arc autour du cap de départ, s'il y en a
 * un (une butée douce : au-delà, le geste ne fait plus rien, sans rebond).
 */
export function turnSceneYaw(yaw: number, d: number, start: number, arc: number | null): number {
  if (arc === null) return wrapAngle(yaw + d);
  const off = Math.max(-arc, Math.min(arc, wrapAngle(yaw - start) + d));
  return wrapAngle(start + off);
}

/** Le retour de la caméra au cap de départ à chaque nouvel item : sa durée (d'un coup avec « Réduire les animations »). */
export const SCENE_RETURN = { seconds: 0.6 } as const;

/**
 * L'angle du retour au cap de départ à la part `u` (de 0 à 1) de sa durée : de `from` vers `to` par le plus court, en
 * ralentissant jusqu'à l'arrivée, sans la dépasser (une courbe cubique).
 */
export function sceneReturnYaw(from: number, to: number, u: number): number {
  const k = Math.min(1, Math.max(0, u));
  const ease = 1 - (1 - k) ** 3;
  return wrapAngle(from + wrapAngle(to - from) * ease);
}

/**
 * Le retour au cap de départ en cours (la vue en garde un seul, rempli sur place : rien n'est créé à chaque image) : s'il
 * avance, l'instant où il est parti (en secondes), l'angle d'où il part et le cap où il va.
 */
export interface SceneReturn {
  active: boolean;
  start: number;
  from: number;
  to: number;
}

/**
 * Lance le retour au cap `to` depuis l'angle courant `yaw`, à l'instant `now` (en secondes), et rend l'angle à prendre
 * tout de suite. Un retour en cours (un nouvel item avant la fin du précédent) repart de l'angle où il en est. D'un coup
 * (`instant` : l'entrée dans la scénette, « Réduire les animations »), ou si la caméra est déjà au cap : rien ne glisse.
 */
export function startSceneReturn(r: SceneReturn, yaw: number, to: number, now: number, instant: boolean): number {
  r.active = !instant && Math.abs(wrapAngle(to - yaw)) > 1e-4;
  if (!r.active) return to;
  r.start = now;
  r.from = yaw;
  r.to = to;
  return yaw;
}

/** L'angle du retour à l'instant `now`, ou `null` s'il n'y en a pas ; arrivé au cap, il s'arrête. */
export function stepSceneReturn(r: SceneReturn, now: number): number | null {
  if (!r.active) return null;
  const u = (now - r.start) / SCENE_RETURN.seconds;
  if (u >= 1) r.active = false;
  return sceneReturnYaw(r.from, r.to, u);
}

/** Un geste à deux doigts interrompt le retour : la caméra reste à l'angle où il l'a laissée, le geste part de là. */
export function stopSceneReturn(r: SceneReturn): void {
  r.active = false;
}

/** Le sol d'une scénette, dans le monde. */
const floorOf = (place: PlaceId, posed = true): Vec3 => siteOf(place, posed).floor();

/** La place de Kéo dans la scénette : ses pieds, son échelle et son cap. */
export function scenetteKeo(anyPlace: AnyPlaceId, posed = true): { at: Vec3; scale: number; yaw: number } {
  const place = scenePlace(anyPlace);
  const f = floorOf(place, posed);
  const k = siteOf(place, posed).keo;
  return { at: { x: f.x + k.dx, y: f.y, z: f.z + k.dz }, scale: k.scale, yaw: k.yaw };
}

/** Où se tient l'habitant de la scénette (ses pieds). */
export function scenetteHabitant(anyPlace: AnyPlaceId, posed = true): Vec3 {
  const place = scenePlace(anyPlace);
  const f = floorOf(place, posed);
  const h = siteOf(place, posed).habitant;
  return { x: f.x + h.dx, y: f.y, z: f.z + h.dz };
}

/**
 * Où Kéo reste en quittant la scénette d'un lieu, et ce que la caméra garde alors dans le champ (retour du directeur
 * artistique, lot 3) : la trace de la réussite. Aux Quais, sur le bord du quai, juste à l'est de la proue de la barque
 * chargée, qu'on voit au premier plan avec la grue et le hangar derrière lui ; la caméra garde la trace de la mission
 * jouée (`mission`, GD-20, point 8). Aux Filets (lot 4), devant le séchoir, le panier plein et le filet tendu à sa
 * gauche, ou la trace de la mission jouée (le vivier, les nasses, le carrelet, `FILETS_TRACE_SPOTS`, lot L4). Aux Écluses, sur la rive ouest, la caméra gardant la trace de la mission jouée (la porte d'amont ouverte et le
 * sas rempli des Nénuphars, ou une autre, `ECLUSES_TRACE_SPOTS`, lot L2). Au Phare (lot L3), au sud de la trace de la
 * mission jouée, sur l'îlot : les lampes de la galerie (la caméra lève alors les yeux vers elle, `view`), la corne de
 * brume, le mât de signaux. Rien quand l'étape qui porte la trace n'est pas posée (`posed`) : la trace attend ; la
 * caméra garde alors le lieu (`placeKeep`).
 */
export function scenetteExit(anyPlace: AnyPlaceId, posed = true, mission?: string): { at: Vec2; keep: Vec3; view?: ExitView } | null {
  const place = scenePlace(anyPlace);
  if (!posed) return null;
  if (place === 'phare') {
    const exit = mission && Object.hasOwn(PHARE_EXITS, mission) ? PHARE_EXITS[mission] : null;
    if (!exit) return null;
    const c = placeById(place).center;
    const at = { x: c.x + exit.at.x, z: c.z + exit.at.z };
    if (exit.trace === 'galerie') return { at, keep: { x: c.x, y: standingHeight(heightAt(c)) + PHARE_GALLERY, z: c.z + 2 }, view: GALLERY_VIEW };
    const o = PHARE_TRACE_SPOTS[exit.trace];
    const g = { x: c.x + o.x, z: c.z + o.z };
    return { at, keep: { x: g.x, y: standingHeight(heightAt(g)) + PHARE_TRACE_LIFT[exit.trace], z: g.z } };
  }
  if (place === 'quais') {
    const boat = loadedBoat();
    const f = quayFloor();
    // La trace de la mission jouée (GD-20, point 8) : la barque chargée de Doubles et moitiés, ou la chose remise en
    // ordre sur le quai par une autre mission.
    const spot = mission && mission in QUAIS_TRACE_SPOTS ? QUAIS_TRACE_SPOTS[mission as keyof typeof QUAIS_TRACE_SPOTS] : null;
    const c = placeById(place).center;
    // Le milieu de la trace, à un pas au-dessus du sol (le rayonnage, la balance, la palette et ses élingues).
    const keep = spot ? { x: c.x + spot.x, y: standingHeight(heightAt({ x: c.x + spot.x, z: c.z + spot.z })) + TRACE_LIFT, z: c.z + spot.z } : { x: boat.at.x, y: boat.at.y, z: boat.at.z };
    return { at: { x: boat.at.x + boat.length / 2 + 0.9, z: f.z }, keep };
  }
  const c = placeById(place).center;
  if (place === 'filets') {
    // La trace de la mission jouée (GD-20, point 8, lot L4) : le panier plein du Troupeau, ou le vivier, les nasses, le
    // carrelet (la caméra garde le milieu de sa hauteur).
    const at = { x: c.x + EXIT_SPOTS.filets.x, z: c.z + EXIT_SPOTS.filets.z };
    if (!mission || !Object.hasOwn(FILETS_TRACE_SPOTS, mission)) return { at, keep: filetsBasketAt() };
    const o = FILETS_TRACE_SPOTS[mission as keyof typeof FILETS_TRACE_SPOTS];
    return { at, keep: { x: c.x + o.x, y: FILETS_TRACE_LIFT[mission as keyof typeof FILETS_TRACE_LIFT], z: c.z + o.z } };
  }
  if (place === 'saltworks') {
    // La trace de la mission jouée (GD-20, point 8, lot L5) : la caméra garde le milieu de sa hauteur ; Kéo se tient à
    // côté de la porte, à l'ouest des bassins.
    const at = { x: c.x + EXIT_SPOTS.saltworks.x, z: c.z + EXIT_SPOTS.saltworks.z };
    if (!mission || !Object.hasOwn(SALTWORKS_TRACE_SPOTS, mission)) return { at, keep: placeKeep(place) };
    const key = mission as keyof typeof SALTWORKS_TRACE_SPOTS;
    const o = SALTWORKS_TRACE_SPOTS[key];
    const g = { x: c.x + o.x, z: c.z + o.z };
    return { at, keep: { x: g.x, y: standingHeight(heightAt(g)) + SALTWORKS_TRACE_LIFT[key], z: g.z } };
  }
  if (place === 'engine') {
    // La trace de la mission jouée (GD-20, point 8, lot L6a) : la caméra garde le milieu de sa hauteur ; Kéo se tient au
    // sud-ouest de la porte, sur le chemin.
    const at = { x: c.x + EXIT_SPOTS.engine.x, z: c.z + EXIT_SPOTS.engine.z };
    if (!mission || !Object.hasOwn(ENGINE_TRACE_SPOTS, mission)) return { at, keep: placeKeep(place) };
    const key = mission as keyof typeof ENGINE_TRACE_SPOTS;
    const o = ENGINE_TRACE_SPOTS[key];
    const g = { x: c.x + o.x, z: c.z + o.z };
    return { at, keep: { x: g.x, y: standingHeight(heightAt(g)) + ENGINE_TRACE_LIFT[key], z: g.z } };
  }
  if (place === 'shipyard') {
    // La trace de la mission jouée (GD-20, point 8, lot L6b) : la caméra garde le milieu de sa hauteur ; Kéo se tient à la
    // porte, sur le chemin.
    const at = { x: c.x + EXIT_SPOTS.shipyard.x, z: c.z + EXIT_SPOTS.shipyard.z };
    if (!mission || !Object.hasOwn(SHIPYARD_TRACE_SPOTS, mission)) return { at, keep: placeKeep(place) };
    const key = mission as keyof typeof SHIPYARD_TRACE_SPOTS;
    const o = SHIPYARD_TRACE_SPOTS[key];
    const g = { x: c.x + o.x, z: c.z + o.z };
    return { at, keep: { x: g.x, y: standingHeight(heightAt(g)) + SHIPYARD_TRACE_LIFT[key], z: g.z } };
  }
  const art = placeArt(place);
  if (art) {
    // Le rivage nord (lot L7) : la trace de la mission jouée, la caméra en garde le milieu ; Kéo à sa place de retour.
    const at = { x: c.x + art.exit.x, z: c.z + art.exit.z };
    const trace = mission && Object.hasOwn(art.traces, mission) ? art.traces[mission] : null;
    if (!trace) return { at, keep: placeKeep(place) };
    const g = { x: c.x + trace.at.x, z: c.z + trace.at.z };
    return { at, keep: { x: g.x, y: standingHeight(heightFor(place)(g)) + trace.lift, z: g.z } };
  }
  if (place === 'mangrove') {
    // La trace de la mission jouée (GD-20, point 8, lot L8a) : la caméra garde le milieu de sa hauteur ; Kéo se tient à
    // côté de la passerelle des abords, devant la porte.
    const at = { x: c.x + EXIT_SPOTS.mangrove.x, z: c.z + EXIT_SPOTS.mangrove.z };
    if (!mission || !Object.hasOwn(MANGROVE_TRACE_SPOTS, mission)) return { at, keep: placeKeep(place) };
    const key = mission as keyof typeof MANGROVE_TRACE_SPOTS;
    const o = MANGROVE_TRACE_SPOTS[key];
    const g = { x: c.x + o.x, z: c.z + o.z };
    return { at, keep: { x: g.x, y: standingHeight(heightAt(g)) + MANGROVE_TRACE_LIFT[key], z: g.z } };
  }
  if (place === 'ruins') {
    // La trace de la mission jouée (GD-20, point 8, lot L8b) : la caméra garde le milieu de sa hauteur ; Kéo se tient sur
    // l'herbe, entre le dallage et la porte.
    const at = { x: c.x + EXIT_SPOTS.ruins.x, z: c.z + EXIT_SPOTS.ruins.z };
    if (!mission || !Object.hasOwn(RUINS_TRACE_SPOTS, mission)) return { at, keep: placeKeep(place) };
    const key = mission as keyof typeof RUINS_TRACE_SPOTS;
    const o = RUINS_TRACE_SPOTS[key];
    const g = { x: c.x + o.x, z: c.z + o.z };
    return { at, keep: { x: g.x, y: standingHeight(heightAt(g)) + RUINS_TRACE_LIFT[key], z: g.z } };
  }
  if (place === 'observatory') {
    // La trace de la mission jouée (GD-20, point 8, lot L8c) : la caméra garde le milieu de sa hauteur ; Kéo se tient à
    // l'est de la porte, sur le chemin.
    const at = { x: c.x + EXIT_SPOTS.observatory.x, z: c.z + EXIT_SPOTS.observatory.z };
    if (!mission || !Object.hasOwn(OBSERVATORY_TRACE_SPOTS, mission)) return { at, keep: placeKeep(place) };
    const key = mission as keyof typeof OBSERVATORY_TRACE_SPOTS;
    const o = OBSERVATORY_TRACE_SPOTS[key];
    const g = { x: c.x + o.x, z: c.z + o.z };
    return { at, keep: { x: g.x, y: standingHeight(heightAt(g)) + OBSERVATORY_TRACE_LIFT[key], z: g.z } };
  }
  if (place === 'commons') {
    // La trace de la mission jouée (GD-20, point 8, lot L8d) : la caméra garde le milieu de sa hauteur ; Kéo se tient à
    // l'est de la porte, sur le chemin, au sud de la toiture.
    const at = { x: c.x + EXIT_SPOTS.commons.x, z: c.z + EXIT_SPOTS.commons.z };
    if (!mission || !Object.hasOwn(COMMONS_TRACE_SPOTS, mission)) return { at, keep: placeKeep(place) };
    const key = mission as keyof typeof COMMONS_TRACE_SPOTS;
    const o = COMMONS_TRACE_SPOTS[key];
    const g = { x: c.x + o.x, z: c.z + o.z };
    return { at, keep: { x: g.x, y: standingHeight(heightAt(g)) + COMMONS_TRACE_LIFT[key], z: g.z } };
  }
  if (place === 'ecluses') {
    // La trace de la mission jouée (GD-20, point 8, lot L2) : la porte d'amont ouverte des Nénuphars (le milieu du lieu),
    // ou ce qu'une autre mission a laissé (la barque, la table, l'escalier, la lanterne du sas), à un pas au-dessus du pied du lieu.
    const y = standingHeight(heightAt(c));
    const spot = mission && mission in ECLUSES_TRACE_SPOTS ? ECLUSES_TRACE_SPOTS[mission as keyof typeof ECLUSES_TRACE_SPOTS] : { x: 0, z: 0 };
    return { at: { x: c.x + EXIT_SPOTS.ecluses.x, z: c.z + EXIT_SPOTS.ecluses.z }, keep: { x: c.x + spot.x, y: y + 1, z: c.z + spot.z } };
  }
  return null;
}

/**
 * Ce que la caméra garde au retour quand rien n'est à garder (le Phare, ou l'étape qui porte la trace pas encore posée ;
 * relecture du directeur artistique, GD-20, point 8) : le lieu lui-même, son centre à hauteur d'homme, pour qu'il se
 * reconnaisse avec la partie qu'on vient de poser au-dessus de la liste, plutôt que Kéo de près.
 */
export function placeKeep(anyPlace: AnyPlaceId): Vec3 {
  const place = scenePlace(anyPlace);
  const c = placeById(place).center;
  return { x: c.x, y: standingHeight(heightFor(place)(c)) + PLACE_KEEP_HEIGHT, z: c.z };
}
/** La hauteur du point gardé au-dessus du pied du lieu. */
const PLACE_KEEP_HEIGHT = 1.5;

/** La hauteur du point gardé au-dessus du pied d'une trace des Quais. */
const TRACE_LIFT = 1;

/**
 * La hauteur gardée par la caméra au retour d'une trace des Filets, au-dessus de l'eau (le vivier, le carrelet) ou du
 * sable (les nasses) : le milieu de la trace.
 */
const FILETS_TRACE_LIFT = { 'word-classes': 0.3, sorting: 0.8, 'e-er-ez': 1.8 } as const;

/** Où Kéo se tient au retour des Filets et des Écluses, depuis le centre du lieu. */
const EXIT_SPOTS = { filets: { x: 3.2, z: 5.4 }, ecluses: { x: -3.6, z: 1.4 }, saltworks: { x: -6.2, z: -1.8 }, engine: { x: -2.2, z: 6.4 }, shipyard: { x: 3.4, z: 5.7 }, mangrove: { x: 1.6, z: 5.8 }, ruins: { x: -0.4, z: 5.4 }, observatory: { x: 1.3, z: 6.8 }, commons: { x: 1.6, z: 6.7 } } as const;

/** La hauteur gardée par la caméra au retour d'une trace des Marais salants, au-dessus du sol : le milieu de la trace. */
const SALTWORKS_TRACE_LIFT = { ordering: 0.5, operations: 0.8, scale: 2.6, 'large-numbers': 0.6, 'rounding-products': 0.4 } as const;

/** La hauteur gardée par la caméra au retour d'une trace de la Turbine, au-dessus du sol : le milieu de la trace. */
const ENGINE_TRACE_LIFT = { 'states-of-matter': 1.6, 'motion-signals': 0.5, 'energy-circuits': 1.3, 'materials-light': 0.6 } as const;

/** La hauteur gardée par la caméra au retour d'une trace du Chantier naval, au-dessus du sol : le milieu de la trace. */
const SHIPYARD_TRACE_LIFT = { 'object-function': 0.6, materials: 0.6, 'information-networks': 0.3, 'solve-program': 0.6 } as const;

/** La hauteur gardée par la caméra au retour d'une trace de la Mangrove, au-dessus du sol ou de l'eau : le milieu de la trace. */
const MANGROVE_TRACE_LIFT = { 'living-groups': 1.0, 'food-growth': 0.5, 'planet-earth': 1.1, 'life-enquiry': 0.5 } as const;

/** La hauteur gardée par la caméra au retour d'une trace des Ruines, au-dessus du sol : le milieu de la trace. */
const RUINS_TRACE_LIFT = { 'early-humans': 0.9, 'ancient-peoples': 0.5, 'roman-empire': 1.5, viewpoints: 0.7 } as const;

/** La hauteur gardée par la caméra au retour d'une trace de l'Observatoire, au-dessus du sol : le milieu de la trace. */
const OBSERVATORY_TRACE_LIFT = { metropolises: 0.8, 'low-density': 1.0, 'inhabited-world': 0.3 } as const;

/** La hauteur gardée par la caméra au retour d'une trace de la Halle, au-dessus du sol : le milieu de la trace. */
const COMMONS_TRACE_LIFT = { representatives: 0.4, 'school-secularism': 0.5, 'private-life': 0.4 } as const;

/**
 * Au Phare (GD-20, point 8, lot L3), où Kéo se tient au retour de chaque mission, depuis le centre du lieu, et la trace
 * que la caméra garde : les lampes de la galerie (la Chasse au son), devant la porte ; la corne de brume (l'Abattage
 * syllabique) et le mât de signaux (les Rimes-échelle), à quelques pas au sud de chacun.
 */
const PHARE_EXITS: Readonly<Record<string, { at: Vec2; trace: 'galerie' | keyof typeof PHARE_TRACE_LIFT }>> = {
  'sound-hunt': { at: { x: 1.4, z: 6.6 }, trace: 'galerie' },
  syllables: { at: { x: 3.4, z: 5.6 }, trace: 'syllables' },
  rhymes: { at: { x: -2.6, z: 7.4 }, trace: 'rhymes' },
};

/** La hauteur du point gardé au-dessus du pied d'une trace du Phare : la mi-hauteur de la corne, du mât. */
const PHARE_TRACE_LIFT = { syllables: 1.2, rhymes: 2.3 } as const;

/**
 * La caméra du retour d'une scénette : toujours tournée vers le nord, reculée au-dessus du bassin (`back` unités au sud
 * de ce qu'elle garde, `height` au-dessus des pieds de Kéo), entre Kéo et la barque en largeur, elle regarde un point
 * `aim` unités au-dessus des pieds de Kéo : la barque au premier plan, au-dessus de « Y aller », la grue derrière lui.
 * Le passage vers la caméra qui suit dure `down` secondes quand Kéo repart (d'un bloc avec « Réduire les animations »).
 */
export const EXIT_VIEW = { back: 11, height: 9, aim: 1.6, down: 0.5 } as const;
/** Le recul de la caméra du retour : `back` unités au sud de ce qu'elle garde, `height` au-dessus des pieds de Kéo. */
export type ExitView = { readonly back: number; readonly height: number; readonly aim: number };
/**
 * Le recul quand la caméra garde le lieu entier (`placeKeep`) : plus loin et plus haut que pour une trace, pour que le lieu
 * se reconnaisse, avec la partie qu'on vient de poser, dans la bande que laisse la liste.
 */
export const PLACE_VIEW: ExitView = { back: 20, height: 15, aim: 1.6 };
/**
 * Le recul quand la caméra garde une trace au retour d'une scénette : la liste du lieu se rouvre alors (GD-20, point 8)
 * et ne laisse qu'une bande au-dessus d'elle ; la caméra recule assez pour que la trace y tienne entière avec ses abords.
 */
export const TRACE_VIEW: ExitView = { back: 15, height: 11, aim: 1.6 };
/**
 * Le recul quand la caméra garde les lampes de la galerie du Phare : à la hauteur de la galerie (11,5 unités au-dessus
 * du sol), le regard presque à l'horizontale, assez près pour que les lampes se voient dans la bande au-dessus de la
 * liste, la lanterne et son toit avec elles.
 */
export const GALLERY_VIEW: ExitView = { back: 10, height: 12.5, aim: 10.5 };

/**
 * Pose `pose` (la caméra qui suit, remplie sur place) vers la caméra du retour d'une scénette, de la part `amount` (0 :
 * la caméra qui suit, 1 : le retour) : Kéo, aux pieds `feet`, et `keep` (la barque) ensemble dans le champ.
 */
export function exitView(pose: CameraPose, keep: Vec3, feet: Vec3, amount: number, view: ExitView = EXIT_VIEW): void {
  if (amount <= 0) return;
  const u = Math.min(1, amount);
  const k = u * u * (3 - 2 * u);
  const mx = (feet.x + keep.x) / 2;
  const p = pose.position;
  const t = pose.target;
  p.x += (mx - p.x) * k;
  p.y += (feet.y + view.height - p.y) * k;
  // Au sud du plus au sud des deux (Kéo, ce qu'elle garde), tournée vers le plus au nord : une trace au nord de Kéo (la
  // palette de dix, au bout du ponton) reste devant elle, Kéo au premier plan, jamais vue d'aplomb.
  p.z += (Math.max(keep.z, feet.z) + view.back - p.z) * k;
  t.x += (mx - t.x) * k;
  t.y += (feet.y + view.aim - t.y) * k;
  t.z += (Math.min(keep.z, feet.z) - t.z) * k;
}

/**
 * La pose de la caméra de la scénette : Kéo et l'habitant au milieu de la scène (`layout.scenette.stage`), vus du sud,
 * un peu d'en haut ; le décalage de l'image (en pixels) qui les y amène sans tourner la caméra. Fixe tant que la
 * scénette dure.
 */
export function scenettePose(anyPlace: AnyPlaceId, stage: ScreenBox, width: number, height: number, posed = true): { pose: CameraPose; shift: { x: number; y: number } } {
  const place = scenePlace(anyPlace);
  const site = siteOf(place, posed);
  return poseOfSubject(site, site.subject, site.floor().x + (site.keo.dx + site.habitant.dx) / 2, stage, width, height);
}

/** La marge autour de l'aménagement dans le cadrage de la remise, en unités du monde. */
const REMISE_MARGIN = 0.4;

/** La marge, en pixels, entre l'aménagement et le bord de la scène de la remise. */
const REMISE_PIXELS = 16;

/**
 * La pose de la caméra de la remise (GD-20, point 4, piste B, lot L0 : le cadrage prévu, montré en image fixe) : le
 * même angle, la même hauteur visée et le même recul par unité que la scénette du lieu, le cadre élargi juste assez pour
 * prendre aussi l'aménagement posé (`include`, sa boîte dans le monde ; directeur artistique : « un peu plus large, le
 * même regard »), du côté où il est.
 */
export function remisePose(anyPlace: AnyPlaceId, include: { min: readonly number[]; max: readonly number[] }, stage: ScreenBox, width: number, height: number, posed = true): { pose: CameraPose; shift: { x: number; y: number } } {
  const place = scenePlace(anyPlace);
  const site = siteOf(place, posed);
  const S = site.subject;
  const f = site.floor();
  const mid = f.x + (site.keo.dx + site.habitant.dx) / 2;
  const left = Math.min(mid - S.halfWidth, include.min[0] - REMISE_MARGIN);
  const right = Math.max(mid + S.halfWidth, include.max[0] + REMISE_MARGIN);
  const subject = { ...S, halfWidth: (right - left) / 2, bottom: Math.min(S.bottom, include.min[1] - f.y - REMISE_MARGIN / 2), top: Math.max(S.top, include.max[1] - f.y + REMISE_MARGIN / 2) };
  const framed = poseOfSubject(site, subject, (left + right) / 2, stage, width, height);
  // Le cadre est calculé dans le plan du sujet : ce qui est plus près de la caméra (l'aménagement devant l'habitant) paraît
  // plus grand. La caméra recule alors, dans son axe, jusqu'à ce que les coins de la boîte tiennent dans la scène, à
  // `REMISE_PIXELS` de ses bords (directeur artistique, avis sur le lot L0 : entier dans la scène, avec une marge).
  const { pose } = framed;
  const halfW = Math.max(24, (stage.right - stage.left) / 2 - REMISE_PIXELS);
  const halfH = Math.max(24, (stage.bottom - stage.top) / 2 - REMISE_PIXELS);
  for (let i = 0; i < 4; i++) {
    let k = 0;
    for (const x of [include.min[0], include.max[0]])
      for (const y of [include.min[1], include.max[1]])
        for (const z of [include.min[2], include.max[2]]) {
          const s = screenOf(pose, { x, y, z }, width, height);
          k = Math.max(k, Math.abs(s.x - width / 2) / halfW, Math.abs(s.y - height / 2) / halfH);
        }
    if (k <= 1) break;
    const t = pose.target;
    const q = pose.position;
    pose.position = { x: t.x + (q.x - t.x) * k * 1.02, y: t.y + (q.y - t.y) * k * 1.02, z: t.z + (q.z - t.z) * k * 1.02 };
  }
  return framed;
}

/** La pose qui cadre `S` (ses mesures depuis le sol de la scénette), centrée en `x`, dans la scène `stage`, vue du sud sous l'angle du lieu. */
function poseOfSubject(site: ScenetteSite, S: ScenetteSite['subject'], x: number, stage: ScreenBox, width: number, height: number): { pose: CameraPose; shift: { x: number; y: number } } {
  const f = site.floor();
  const focal = height / 2 / Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180);
  const halfW = Math.max(24, (stage.right - stage.left) / 2);
  const halfH = Math.max(24, (stage.bottom - stage.top) / 2);
  const dist = Math.max((S.halfWidth * focal) / halfW, ((S.top - S.bottom) / 2) * (focal / halfH)) * 1.05;
  const target = { x, y: f.y + (S.top + S.bottom) / 2, z: f.z + S.depth };
  const p = site.pitch;
  return {
    pose: {
      target,
      position: { x: target.x, y: target.y + dist * Math.sin(p), z: target.z + dist * Math.cos(p) },
      fov: CAMERA_FOV,
      lens: 0,
    },
    shift: { x: width / 2 - (stage.left + stage.right) / 2, y: height / 2 - (stage.top + stage.bottom) / 2 },
  };
}

/**
 * La maquette du lieu s'efface-t-elle le temps de la scénette ? Aux Quais, oui : le quai de la scénette a sa grue, on n'en
 * voit pas deux. Au Phare, non : la tour porte la galerie ; aux Filets et aux Écluses non plus : leurs cabanes, leur
 * séchoir et leurs bassins font le fond de la scène.
 */
export const scenetteHidesPlace = (place: AnyPlaceId): boolean => place === 'quais' || placeArt(scenePlace(place))?.hideInScenette === true;

/**
 * Les pièces du lieu s'effacent-elles le temps de la scénette ? Partout sauf au Phare (ses lampes sont sur la galerie) :
 * la trace de la réussite que la scénette montre (la barque chargée, le panier plein, la porte ouverte) n'est pas
 * dessinée deux fois ; elle reste dans le monde au retour.
 */
export const scenetteHidesPieces = (place: AnyPlaceId): boolean => place !== 'phare';

/**
 * Les traces d'un lieu que montre sa scénette (décision du directeur artistique, relecture de L3) : une trace d'une autre
 * mission se cache le temps d'une scénette quand elle est dans le cadre ; elle reste dans le monde et au retour. Au
 * Phare, les lanternes de la galerie (la Chasse au son) se cachent pendant l'Abattage syllabique et les Rimes-échelle
 * joués sur la galerie ; la corne et le mât, au sol, restent hors du cadre. `done` : les missions réussies du lieu.
 */
export function scenetteTraces(anyPlace: AnyPlaceId, done: readonly string[], mission: string | null, posed: boolean): readonly string[] {
  const place = scenePlace(anyPlace);
  if (place !== 'phare' || !posed || mission === 'sound-hunt') return done;
  return done.filter((m) => m !== 'sound-hunt');
}

/**
 * Les objets des réponses pendent-ils (les cloches du Phare, devant la rambarde de sa galerie), ou sont-ils posés (les
 * caisses des Quais sur un ponton ; les cloches tombées au pied du Phare, sur une avancée du socle) ?
 */
export const answersHang = (place: AnyPlaceId, posed = true): boolean => place === 'phare' && posed;

/**
 * La bonne réponse quitte-t-elle la rangée (la caisse des Quais monte au crochet) ? Ailleurs, elle reste ; à la Gare
 * maritime (lot L9b), la malle reste, et son couvercle la quitte : la réaction le rabat sur elle.
 */
export const answerLeaves = (place: AnyPlaceId): boolean => place === 'quais' || placeArt(scenePlace(place))?.answer?.replaces === true;

/**
 * La hauteur du ponton des réponses d'une scénette, quand elles sont posées : celle des pontons du monde, sur l'eau du
 * bassin des Quais ; aux Filets et aux Écluses, un peu au-dessus du plancher de la scène (`LAND_DECK`, sans se confondre
 * avec la berge du canal ; le ponton descend jusqu'au sol, `ground`).
 */
export const scenetteDeck = (place: AnyPlaceId, posed = true): { y: number; onLand: boolean } =>
  place === 'quais' ? { y: DECK_HEIGHT, onLand: false } : { y: floorOf(scenePlace(place), posed).y + LAND_DECK, onLand: true };

/** La margelle des réponses à terre, au-dessus du plancher de la scène. */
export const LAND_DECK = 0.08;

/**
 * Le plan où pendent les cloches : devant la rambarde, au sud de face (la vue y pose les objets sous chaque réponse),
 * tourné de `yaw` autour de l'axe de la galerie (`pivot`) avec la caméra de la scénette : il lui fait toujours face
 * (`through`, `normal`), à la même distance de l'axe. `rail` : le point de la rambarde de face, au sud.
 */
export function bellPlane(anyPlace: AnyPlaceId, yaw = 0): { through: Vec3; normal: { x: number; z: number }; pivot: Vec3; rail: Vec3 } {
  const place = scenePlace(anyPlace);
  const f = floorOf(place);
  const d = GALLERY.radius + 0.45;
  const normal = { x: Math.sin(yaw), z: Math.cos(yaw) };
  return {
    through: { x: f.x + d * normal.x, y: f.y, z: f.z + d * normal.z },
    normal,
    pivot: { x: f.x, y: f.y, z: f.z },
    rail: { x: f.x, y: f.y + GALLERY.rail, z: f.z + GALLERY.radius },
  };
}

const C = {
  deck: 0x9aa6a8,
  deckEdge: 0x8a9597,
  rail: 0xf2eee4,
  // La gardienne (consultant Archipéo) : ciré jaune lanterne, tête sable, bonnet nuit océan, corde de brume.
  coat: 0xffd866,
  coatShade: 0xe8bf4a,
  head: 0xe3c08a,
  cap: 0x142b38,
  // Le rouge du bonnet du modèle 3D de la gardienne, relevé dans sa texture (médiane des pixels rouges du haut du
  // modèle) : la poignée de la corde et le maillet le prennent quand le modèle est montré.
  modelCap: 0xd44330,
  rope: 0xe5ebe3,
  // La pêcheuse (consultant Archipéo, lot 2) : tablier herbe sur une robe sable chaud, chapeau de paille, navette de bois.
  dress: 0x4f7fa3,
  dressShade: 0x426d8c,
  apron: 0x6cbf4e,
  straw: 0xd9a441,
  strawShade: 0xb8862e,
  shuttle: 0xa9784a,
  // L'éclusier (consultant Archipéo, lot 2) : ciré lagon, béret bleu, levier de vanne à poignée rouge.
  lockCoat: 0x2fb5a6,
  lockCoatShade: 0x27998c,
  beret: 0x4f7fa3,
  lever: 0x8a6440,
  knob: 0xc0503a,
  // Les planchers : le bois des pontons (les Filets), la pierre du sas (les Écluses), l'eau du canal.
  wood: 0xa9784a,
  woodSide: 0x8a6440,
  newWood: 0xc28a52,
  lightWood: 0xd9a441,
  stone: 0xb9b2a3,
  stoneSide: 0x8f897d,
  // Les dalles du sol d'une scène (lot commun des scénettes, directeur artistique) : une pierre chaude, tirée vers le
  // Sable du pack (#DAA66A), à la place de la pierre grise qui faisait une estrade ; ses joints et sa tranche plus bruns.
  paving: 0xd6b98e,
  pavingSide: 0xb0926a,
  /**
   * Les dalles de l'Observatoire, la pierre chaude claire du kit des abords (`STONE.top`) : sous le soleil rasant, les
   * dalles chaudes du lot commun se lisaient comme une estrade brune.
   */
  pavingLight: 0xdcd1bc,
  /** Le talus d'herbe sous la dalle de l'Observatoire : le tertre monte jusqu'aux dalles (un vert du kit, `grassDeep`). */
  pavingBank: 0x82cd95,
  /** L'eau du canal des Écluses : le Lagon du pack, turquoise (directeur artistique : le bleu saturé sortait de la palette). */
  canal: COLORS_6E.lagoon,
  // La berge du canal : l'herbe, le chemin et la roche des berges du monde (COLORS_6E).
  grass: COLORS_6E.grass,
  path: COLORS_6E.path,
  rock: COLORS_6E.rock,
  // Le docker (consultant Archipéo, fiche du lot 2) : gilet vert lagon, tête sable, casquette jaune lanterne.
  vest: 0x178078,
  vestShade: 0x12695f,
  dockCap: 0xffd866,
  steel: 0x6f8089,
  crate: 0xb5793f,
  crateTop: 0xc98d50,
  // La saunière (lot L5, consultant Archipéo) : toile claire, tablier terre cuite, chapeau de paille à large bord, pelle
  // à sel de bois ; le muret d'argile et l'eau du bassin (plus claire que la mer).
  linen: 0xd8ccae,
  linenShade: 0xc2b593,
  terracotta: 0xc0643c,
  clay: 0xb59a72,
  clayTop: 0xc7ad83,
  // L'eau du bassin des Marais salants : le Lagon éclairci (directeur artistique ; avant #5FB3E0, qui virait à l'ardoise).
  pan: 0x62c6b9,
  // La machiniste (lot L6a, directeur artistique) : veste bleu lagon, foulard ocre (pas la terre cuite de la brique),
  // lunettes relevées sur le front, burette d'huile de cuivre ; le dallage de pierre des Écluses devant la chaudière.
  lagoonCoat: 0x178078,
  lagoonCoatShade: 0x12695f,
  /** Le pantalon de la machiniste (clôture de L8) : le bleu lagon de sa veste, plus sombre que son ombre. */
  lagoonTrousers: 0x0f5650,
  ochre: 0xc8923a,
  goggles: 0x6f8089,
  copper: 0xc07a3e,
  /** Les cheveux de la machiniste, sombres. */
  hair: 0x3b2a22,
  // La botaniste (lot L8a, directeur artistique) : chemise corail clair, le bas du corps sombre (pantalon bleu nuit),
  // cheveux sombres en tresse (ceux de la machiniste), un petit carnet fermé, Bleu lagon en accent, et sa sangle de cuir.
  coral: 0xf2a285,
  coralShade: 0xd98a6e,
  nightBlue: 0x2e4a5c,
  notebook: 0x178078,
  strap: 0x7a4e2e,
  walkway: 0xb98654,
  walkwayLight: 0xc9965f,
  walkwayDark: 0x8a6440,
  // L'archéologue (lot L8b, directeur artistique, consultant Archipéo) : chemise bleu ciel, le bas du corps sombre
  // (pantalon brun), cheveux gris courts ; sa brosse de fouille, manche de bois et soies ; la pierre du dallage.
  skyShirt: 0xa9c8de,
  skyShirtShade: 0x93b0c6,
  brownTrousers: 0x5a4636,
  greyHair: 0xa9a6a3,
  brushHandle: 0xc8955a,
  bristle: 0x6f5a44,
  passeurStone: 0xdcd0b5,
  passeurShade: 0xb9a988,
  /** Le second ton des dalles de la scène des Ruines, un peu plus chaud que la pierre des Passeurs (le dallage se lit en dalles). */
  passeurWarm: 0xd3c4a3,
  trousers: 0x4d6a82,
  // Le charpentier (lot L6b, directeur artistique, consultant Archipéo) : chemise Brume, tablier ardoise (le cuir se
  // confondrait avec la quille), casquette de cuir ; son maillet de calfat, la tête de bois dur ; le plancher de planches.
  shirt: 0xe5ebe3,
  shirtShade: 0xd3dbd4,
  slateApron: 0x4d6a82,
  leather: 0x7a4e2e,
  // Le bas du charpentier, sombre, sous la chemise (relecture de L6b, directeur artistique : le prisme entier en Brume se
  // lisait comme une robe) : Nuit océan (#142B38), choisi par le directeur artistique entre lui et le cuir.
  workTrousers: 0x142b38,
  mallet: 0x8a5a36,
  plank: 0xc98e55,
  plankSide: 0x9b6a3f,
  // La photographe (lot L8c, directeur artistique) : veste lavande et son ombre, pantalon gris chaud ; sa chambre de bois
  // et son soufflet.
  lavender: 0xb7a6d6,
  lavenderShade: 0xa594c6,
  warmGrey: 0x4a4448,
  cameraWood: 0xa9784a,
  bellows: 0x5a4a40,
  // Le couvreur (lot L8d, directeur artistique) : chemise vert d'eau clair et son ombre, pantalon brun cuir ; la tuile
  // verte qu'il porte (celle de la toiture) ; le dallage de la Halle, la pierre des Passeurs.
  rooferShirt: 0xbfdccb,
  rooferShirtShade: 0xa9c8b6,
  rooferLeather: 0x6a4a34,
  tile: 0x438b82,
  tileShade: 0x356f68,
  // Les chaussures des quatre habitants du rivage sud (relectures de L8) : sombres, sous leurs deux jambes.
  shoe: 0x2f2826,
  // Le filet raccommodé (le même que sur le séchoir, questionScene.ts, `mendedNet`) et ses mailles.
  newRope: 0xc9a36a,
  netLine: 0x6f5e42,
} as const;

/** La vitre de la lanterne : éteinte (gris-bleu, comme le modèle du Phare), puis allumée à la réussite. */
export const LANTERN = { off: 0xbfd0d3, on: 0xffd36b } as const;

/** Une sphère en facettes (la tête), `rings` bandes de `sides` côtés. */
function sphere(b: FacetBuilder, c: Vec3, r: number, sides: number, rings: number, color: number): void {
  const at = (i: number, k: number) => {
    const phi = (Math.PI * i) / rings;
    const theta = (2 * Math.PI * k) / sides;
    return [c.x + r * Math.sin(phi) * Math.cos(theta), c.y + r * Math.cos(phi), c.z + r * Math.sin(phi) * Math.sin(theta)] as const;
  };
  for (let i = 0; i < rings; i++)
    for (let k = 0; k < sides; k++) {
      const a = at(i, k),
        bb = at(i, k + 1),
        cc = at(i + 1, k + 1),
        d = at(i + 1, k);
      if (i === 0) b.triangle(a, cc, d, color);
      else if (i === rings - 1) b.triangle(a, bb, d, color);
      else b.quad(a, bb, cc, d, color);
    }
}

/**
 * Le bas du corps des quatre habitants du rivage sud, la botaniste, l'archéologue, la photographe et le couvreur
 * (relecture DA de L8 : une seule construction, seule change la couleur du pantalon) : un pantalon droit, sans évasement
 * (jamais une robe), deux jambes séparées sous les hanches, sur deux chaussures sombres tournées vers la caméra.
 */
function trouserLegs(b: FacetBuilder, at: Vec3, color: number): void {
  // Sans dessus : celui des jambes se cache dans les hanches, celui des hanches sous la veste.
  for (const dx of [-0.13, 0.13]) {
    b.box({ x: at.x + dx, y: at.y, z: at.z + 0.05 }, [0.17, 0.08, 0.28], C.shoe);
    b.band({ x: at.x + dx, y: at.y, z: at.z, yaw: Math.PI / 6 }, 0.11, 0.35, 6, color);
  }
  b.band({ x: at.x, y: at.y + 0.32, z: at.z, yaw: Math.PI / 8 }, 0.29, TROUSER_TOP - 0.32, 8, color);
}

/** Le haut du pantalon des habitants du rivage sud, au-dessus de leurs pieds : le bas de leur veste. */
const TROUSER_TOP = 0.47;

/**
 * La main de l'habitant, d'où part la corde de sonnerie : celle de son modèle tournée vers Kéo, s'il est montré
 * (./habitants.ts) ; sinon au bout du bras du pion, tendu vers la rambarde.
 */
export function habitantHand(anyPlace: AnyPlaceId, posed = true): Vec3 {
  const place = scenePlace(anyPlace);
  const at = scenetteHabitant(place, posed);
  const model = loadedHabitant(place);
  if (model) {
    const h = habitantWestHand(model);
    return { x: at.x + h.x, y: at.y + h.y, z: at.z + h.z };
  }
  return { x: at.x - 0.15, y: at.y + 0.78, z: at.z + 0.75 };
}

/**
 * La gardienne, immobile, en quatre volumes (consultant Archipéo) : le ciré (un cylindre évasé), la tête (une sphère),
 * le bonnet, le bras tendu vers la rambarde. La corde qu'elle tient part de sa main (`answerObjects`, avec les cloches) ;
 * sa poignée, de la couleur du bonnet, la détache du jaune du ciré (retour du directeur artistique). Au pied de la tour
 * (`posed` faux), elle tient un maillet de bois, pour frapper la cloche tombée.
 */
function gardienne(b: FacetBuilder, place: PlaceId, posed: boolean, body: boolean): void {
  const at = scenetteHabitant(place, posed);
  const hand = habitantHand(place, posed);
  if (body) {
    b.prism(at, 0.4, 0.27, 0.92, 12, C.coat, C.coatShade);
    sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 12, 8, C.head);
    b.prism({ x: at.x, y: at.y + 1.2, z: at.z }, 0.25, 0.12, 0.2, 12, C.cap);
    b.beam({ x: at.x - 0.12, y: at.y + 0.82, z: at.z + 0.12 }, hand, 0.15, C.coat);
  }
  // La couleur du bonnet : celui du pion, ou celui du modèle 3D quand il est montré.
  const cap = loadedHabitant(place) ? C.modelCap : C.cap;
  if (posed) {
    b.box({ x: hand.x, y: hand.y - 0.1, z: hand.z }, [0.16, 0.2, 0.16], cap);
    return;
  }
  // Le maillet : son manche tenu dans la main, sa tête en travers, de la couleur du bonnet.
  const head = { x: hand.x - 0.05, y: hand.y - 0.42, z: hand.z + 0.18 };
  b.beam(hand, head, 0.06, cap);
  b.box({ x: head.x, y: head.y - 0.09, z: head.z, yaw: 0.3 }, [0.32, 0.18, 0.18], cap);
}

/**
 * Le docker, immobile, en quatre volumes (consultant Archipéo) : le corps en cube arrondi (son gilet vert lagon), la tête
 * (une sphère sable), la casquette (un disque jaune lanterne et sa visière), un bras posé sur une caisse à sa gauche ;
 * de l'autre main, il tient son crochet de levage (un manche et un anneau).
 */
function docker(b: FacetBuilder, place: PlaceId, body: boolean): void {
  const at = scenetteHabitant(place);
  // La caisse à côté de lui, posée au sol : elle reste avec son modèle ; le crochet du pion, à la main, part avec lui.
  const crate = { x: at.x - 0.72, y: at.y, z: at.z + 0.05 };
  b.box(crate, [0.6, 0.6, 0.6], C.crate, C.crateTop);
  if (!body) return;
  // Le cube arrondi : un prisme à huit pans, presque droit.
  b.prism({ ...at, yaw: Math.PI / 8 }, 0.38, 0.33, 0.92, 8, C.vest, C.vestShade);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 12, 8, C.head);
  b.prism({ x: at.x, y: at.y + 1.25, z: at.z }, 0.26, 0.26, 0.08, 12, C.dockCap);
  b.box({ x: at.x, y: at.y + 1.25, z: at.z + 0.27 }, [0.3, 0.05, 0.2], C.dockCap);
  // Le bras gauche posé sur la caisse.
  b.beam({ x: at.x - 0.28, y: at.y + 0.84, z: at.z }, { x: crate.x + 0.12, y: crate.y + 0.66, z: crate.z }, 0.15, C.vest);
  // Le bras droit tombe le long du corps ; sa main tient le crochet de levage.
  const hand = { x: at.x + 0.42, y: at.y + 0.5, z: at.z + 0.08 };
  b.beam({ x: at.x + 0.3, y: at.y + 0.86, z: at.z }, hand, 0.15, C.vest);
  liftingHook(b, { x: hand.x, y: hand.y, z: hand.z }, C.steel, 0.11);
}

/**
 * La pêcheuse, immobile, en quatre volumes (consultant Archipéo) : sa robe et son tablier herbe par-devant, la tête, le
 * chapeau de paille à large bord, le bras tendu vers le filet, la navette de bois à la main.
 */
function pecheuse(b: FacetBuilder, place: PlaceId, body: boolean): void {
  if (!body) return;
  const at = scenetteHabitant(place);
  b.prism(at, 0.4, 0.27, 0.92, 12, C.dress, C.dressShade);
  // Le tablier, devant la robe (vers la caméra), plus clair : il la détache du plancher.
  b.box({ x: at.x, y: at.y + 0.08, z: at.z + 0.3, pitch: 0.12 }, [0.42, 0.72, 0.06], C.apron);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 12, 8, C.head);
  b.prism({ x: at.x, y: at.y + 1.22, z: at.z }, 0.46, 0.46, 0.04, 12, C.straw, C.strawShade);
  b.prism({ x: at.x, y: at.y + 1.26, z: at.z }, 0.22, 0.17, 0.16, 12, C.straw);
  const hand = { x: at.x - 0.5, y: at.y + 0.7, z: at.z + 0.35 };
  b.beam({ x: at.x - 0.24, y: at.y + 0.84, z: at.z + 0.08 }, hand, 0.15, C.dress);
  // La navette : un fuseau de bois plat, tenu en travers.
  b.box({ x: hand.x - 0.1, y: hand.y - 0.06, z: hand.z, yaw: 0.5 }, [0.38, 0.06, 0.1], C.shuttle);
}

/**
 * L'éclusier, immobile, en quatre volumes (consultant Archipéo) : le ciré lagon, la tête, le béret, le bras posé sur le
 * levier de vanne planté à côté de lui (son socle de pierre, sa poignée rouge, comme les leviers des réponses).
 */
function eclusier(b: FacetBuilder, place: PlaceId, body: boolean): void {
  const at = scenetteHabitant(place);
  // Le levier de vanne, planté à côté de lui sur son socle : il reste avec son modèle (qui porte sa clé dorée).
  const lever = { x: at.x - 0.62, y: at.y, z: at.z + 0.25 };
  b.box(lever, [0.36, 0.22, 0.32], C.stoneSide, C.stone);
  const top = { x: lever.x + 0.05, y: lever.y + 1.05, z: lever.z - 0.18 };
  b.beam({ x: lever.x, y: lever.y + 0.2, z: lever.z }, top, 0.08, C.lever);
  b.box({ x: top.x, y: top.y - 0.06, z: top.z }, [0.18, 0.14, 0.14], C.knob);
  if (!body) return;
  b.prism(at, 0.42, 0.28, 0.92, 12, C.lockCoat, C.lockCoatShade);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 12, 8, C.head);
  // Le béret : un disque plat, un peu penché, et sa queue.
  b.prism({ x: at.x + 0.03, y: at.y + 1.26, z: at.z, pitch: 0.15 }, 0.27, 0.24, 0.08, 12, C.beret);
  b.box({ x: at.x + 0.03, y: at.y + 1.36, z: at.z }, [0.04, 0.06, 0.04], C.beret);
  b.beam({ x: at.x - 0.26, y: at.y + 0.84, z: at.z + 0.06 }, { x: top.x + 0.06, y: top.y - 0.04, z: top.z + 0.02 }, 0.15, C.lockCoat);
}

/**
 * La saunière, immobile, en quatre volumes (consultant Archipéo, directeur artistique) : sa robe de toile claire et son
 * tablier terre cuite par-devant (il la détache du sel et du muret), la tête, le chapeau de paille à large bord, un bras
 * tendu sur le manche de sa pelle à sel, plantée debout à côté d'elle, sa lame de bois au sol.
 */
function sauniere(b: FacetBuilder, place: PlaceId, body: boolean): void {
  // Son modèle porte son râteau : la pelle du pion en ferait deux outils.
  if (!body) return;
  const at = scenetteHabitant(place);
  b.prism(at, 0.4, 0.27, 0.92, 12, C.linen, C.linenShade);
  b.box({ x: at.x, y: at.y + 0.08, z: at.z + 0.3, pitch: 0.12 }, [0.44, 0.74, 0.06], C.terracotta);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 12, 8, C.head);
  b.prism({ x: at.x, y: at.y + 1.22, z: at.z }, 0.5, 0.5, 0.04, 12, C.straw, C.strawShade);
  b.prism({ x: at.x, y: at.y + 1.26, z: at.z }, 0.22, 0.18, 0.15, 10, C.straw);
  // La pelle, à sa droite (vers l'est) : le manche debout, la lame plate posée sur le muret.
  const foot = { x: at.x + 0.62, y: at.y, z: at.z + 0.2 };
  b.box({ x: foot.x, y: foot.y, z: foot.z }, [0.42, 0.06, 0.32], C.shuttle);
  b.beam({ x: foot.x, y: foot.y + 0.06, z: foot.z }, { x: foot.x - 0.04, y: foot.y + 1.3, z: foot.z - 0.02 }, 0.06, C.lever);
  b.beam({ x: at.x + 0.24, y: at.y + 0.84, z: at.z + 0.06 }, { x: foot.x - 0.03, y: foot.y + 0.92, z: foot.z }, 0.15, C.linen);
}

/**
 * La machiniste, immobile (directeur artistique, consultant Archipéo) : les jambes et les cheveux communs des habitants
 * (directeur artistique, clôture de L8), son pantalon du bleu lagon de sa veste, plus sombre ; sa veste bleu lagon, son foulard ocre au
 * cou, la tête, son chignon, ses lunettes relevées sur le front, sur les cheveux ; un bras plié devant elle, sa burette
 * d'huile à la main, un corps conique de cuivre et son long bec fin tendu vers la soupape (relecture de L6a : jamais une
 * torche, le feu est exclu du lieu). Elle ne dit rien. Pour tenir sous les 400 triangles de la scénette : le bandeau des
 * lunettes sans dessus, les verres sans leur face cachée contre le front, la burette en cône pointu.
 */
function machiniste(b: FacetBuilder, place: PlaceId, body: boolean): void {
  if (!body) return;
  const at = scenetteHabitant(place);
  trouserLegs(b, at, C.lagoonTrousers);
  b.prism({ x: at.x, y: at.y + TROUSER_TOP, z: at.z }, 0.33, 0.28, 0.92 - TROUSER_TOP, 10, C.lagoonCoat, C.lagoonCoatShade);
  b.prism({ x: at.x, y: at.y + 0.86, z: at.z }, 0.27, 0.22, 0.12, 10, C.ochre);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 8, 6, C.head);
  habitantHair(b, at, C.hair);
  // Le chignon, derrière.
  sphere(b, { x: at.x, y: at.y + 1.36, z: at.z - 0.17 }, 0.11, 6, 3, C.hair);
  // Les lunettes relevées : leur bandeau, et deux verres ronds sur le front, tournés vers la caméra.
  b.band({ x: at.x, y: at.y + 1.2, z: at.z }, 0.26, 0.06, 10, C.trousers);
  for (const dx of [-0.09, 0.09]) b.prism({ x: at.x + dx, y: at.y + 1.25, z: at.z + 0.21, pitch: Math.PI / 2 }, 0.065, 0.065, 0.06, 6, C.goggles);
  // Le bras vers l'ouest (vers la soupape), la main à côté de la burette : son corps conique posé sur sa base, large en
  // bas ; son bec, long et fin, qui part du haut vers la soupape.
  const hand = { x: at.x - 0.45, y: at.y + 0.62, z: at.z + 0.3 };
  b.beam({ x: at.x - 0.24, y: at.y + 0.82, z: at.z + 0.06 }, hand, 0.15, C.lagoonCoat);
  const can = { x: hand.x - 0.1, y: hand.y - 0.2, z: hand.z };
  b.prism(can, 0.15, 0, 0.26, 8, C.copper);
  b.beam({ x: can.x, y: can.y + 0.22, z: can.z }, { x: can.x - 0.5, y: can.y + 0.4, z: can.z }, 0.025, C.copper);
}

/**
 * Le dallage de la Turbine (lot L6a) : des dalles de pierre devant la chaudière, sur toute la largeur de la scène, où se
 * tiennent Kéo et la machiniste ; la soupape (l'objet témoin) au milieu.
 */
function enginePaving(b: FacetBuilder): void {
  const o = floorOf('engine');
  const depth = sceneDepth('engine');
  b.box({ x: o.x, y: o.y - depth, z: o.z }, [2 * ENGINE_PAVING.half, depth, ENGINE_PAVING.depth], C.pavingSide, C.paving);
  // Les joints : deux traits plus sombres en travers, à plat sur la pierre (leurs flancs, d'un centième, ne se voyaient
  // pas : la machiniste et ses cheveux communs tiennent ainsi sous les 400 triangles de la scénette).
  const [z0, z1, y] = [o.z - ENGINE_PAVING.depth / 2, o.z + ENGINE_PAVING.depth / 2, o.y + 0.01];
  for (const dx of [-ENGINE_PAVING.half / 2, ENGINE_PAVING.half / 2]) {
    const [x0, x1] = [o.x + dx - 0.025, o.x + dx + 0.025];
    b.quad([x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0], C.pavingSide);
  }
}

/**
 * Le charpentier, immobile (directeur artistique, consultant Archipéo) : les jambes et les cheveux communs des habitants
 * (directeur artistique, clôture de L8), son pantalon Nuit océan ; sa chemise Brume en haut, son tablier ardoise
 * par-devant, de la taille aux genoux (les jambes et les chaussures se voient dessous), la tête, sa casquette de cuir,
 * qui couvre le haut des cheveux, et sa visière ; un bras le long du corps, son maillet de
 * calfat à la main, la tête du maillet longue et ronde, de bois dur, au bout d'un manche court. Il ne dit rien.
 */
function charpentier(b: FacetBuilder, place: PlaceId, body: boolean): void {
  if (!body) return;
  const at = scenetteHabitant(place);
  trouserLegs(b, at, C.workTrousers);
  b.prism({ x: at.x, y: at.y + TROUSER_TOP, z: at.z }, 0.33, 0.28, 0.92 - TROUSER_TOP, 10, C.shirt, C.shirtShade);
  b.box({ x: at.x, y: at.y + 0.3, z: at.z + 0.3, pitch: 0.12 }, [0.46, 0.52, 0.06], C.slateApron);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 8, 6, C.head);
  habitantHair(b, at, C.hair);
  b.prism({ x: at.x, y: at.y + 1.24, z: at.z - 0.02 }, 0.27, 0.24, 0.17, 10, C.leather);
  b.box({ x: at.x, y: at.y + 1.25, z: at.z + 0.27 }, [0.3, 0.04, 0.16], C.leather);
  // Le bras vers l'ouest (vers la planche), plié devant lui ; le maillet tenu par son manche court, la tête en l'air, en
  // travers, longue et ronde.
  const hand = { x: at.x - 0.36, y: at.y + 0.66, z: at.z + 0.26 };
  b.beam({ x: at.x - 0.26, y: at.y + 0.84, z: at.z + 0.04 }, hand, 0.15, C.shirt);
  const head = { x: hand.x - 0.04, y: hand.y + 0.36, z: hand.z + 0.02 };
  b.beam({ x: hand.x, y: hand.y - 0.1, z: hand.z }, head, 0.06, C.lever);
  b.drum({ x: head.x - 0.21, y: head.y, z: head.z, yaw: Math.PI / 2, pitch: Math.PI / 2 }, 0.1, 0.42, 8, C.mallet);
}

/**
 * Le plancher du Chantier naval (lot L6b) : des planches sur la grève, au sud-est de la coque, sur toute la largeur de
 * la scène, où se tiennent Kéo et le charpentier ; la planche de bordé sur ses tréteaux (l'objet témoin) au milieu.
 */
function shipyardFloor(b: FacetBuilder): void {
  const o = floorOf('shipyard');
  const depth = sceneDepth('shipyard') + SHIPYARD_FLOOR_RISE;
  b.box({ x: o.x, y: o.y - depth, z: o.z }, [2 * SHIPYARD_DECK.half, depth, SHIPYARD_DECK.depth], C.plankSide, C.plank);
  // Les joints des planches, d'est en ouest, posés sur le bois.
  for (const dz of [-SHIPYARD_DECK.depth / 4, SHIPYARD_DECK.depth / 4]) b.box({ x: o.x, y: o.y, z: o.z + dz }, [2 * SHIPYARD_DECK.half, 0.01, 0.05], C.plankSide);
}

/** Le plancher du Chantier naval : sa demi-largeur et sa profondeur. */
const SHIPYARD_DECK = { half: 3.5, depth: 2.4 } as const;

/** Le dallage de la Turbine : sa demi-largeur et sa profondeur. */
const ENGINE_PAVING = { half: 5.2, depth: 2.8 } as const;

/**
 * La botaniste, immobile (directeur artistique, consultant Archipéo) : le bas du corps sombre (son pantalon bleu nuit,
 * droit, deux jambes et leurs chaussures, relecture DA de L8),
 * le haut clair (sa chemise corail), la tête, ses cheveux sombres et leur tresse dans le dos ; un bras plié, qui tient
 * contre elle un petit carnet fermé (plus petit que celui de Kéo), sa couverture Bleu lagon et sa sangle de cuir. Ni
 * loupe, ni chapeau ; elle ne dit rien.
 */
function botaniste(b: FacetBuilder, place: PlaceId, body: boolean): void {
  if (!body) return;
  const at = scenetteHabitant(place);
  trouserLegs(b, at, C.nightBlue);
  b.prism({ x: at.x, y: at.y + TROUSER_TOP, z: at.z }, 0.31, 0.26, 0.92 - TROUSER_TOP, 10, C.coral, C.coralShade);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 8, 6, C.head);
  habitantHair(b, at, C.hair);
  // La tresse : une seule mèche continue dans le dos, du bas de la nuque au milieu du dos, qui s'amincit vers le bas, sans
  // vide ni dents, de profil comme de dos (directeur artistique, clôture de L8) : un tronc de pyramide à quatre pans, large
  // en haut, et sa pointe en bas, qui le ferme ; un peu détachée du dos, pour ne jamais rentrer dans la chemise.
  b.prism({ x: at.x, y: at.y + 0.72, z: at.z - 0.3 }, 0.03, 0.085, 0.41, 4, C.hair);
  b.prism({ x: at.x, y: at.y + 0.72, z: at.z - 0.3, pitch: Math.PI }, 0.03, 0, 0.06, 4, C.hair);
  // Le bras droit tombe le long du corps ; le gauche, plié, tient le carnet contre la poitrine.
  b.beam({ x: at.x + 0.27, y: at.y + 0.86, z: at.z }, { x: at.x + 0.36, y: at.y + 0.46, z: at.z + 0.05 }, 0.13, C.coral);
  const hand = { x: at.x - 0.05, y: at.y + 0.7, z: at.z + 0.32 };
  b.beam({ x: at.x - 0.27, y: at.y + 0.86, z: at.z + 0.02 }, hand, 0.13, C.coral);
  b.box({ x: hand.x + 0.04, y: hand.y - 0.05, z: hand.z + 0.02 }, [0.2, 0.26, 0.05], C.notebook);
  b.box({ x: hand.x + 0.04, y: hand.y + 0.03, z: hand.z + 0.02 }, [0.22, 0.035, 0.065], C.strap);
}

/**
 * Le platelage de la scénette de la Mangrove (lot L8a) : celui du lieu, un peu plus grand et un peu plus haut (il le
 * couvre, sans se confondre avec lui), ses planches en deux bois, et ses pieux dans l'eau, côté lagon (la scénette se
 * joue aussi avant que le platelage du lieu soit posé).
 */
function mangroveDeck(b: FacetBuilder): void {
  const f = floorOf('mangrove');
  const D = MANGROVE.deck;
  const grow = MANGROVE_SCENE_DECK.grow;
  const [w, d] = [D.w + 2 * grow, D.d + 2 * grow];
  b.box({ x: f.x, y: f.y - 0.16, z: f.z }, [w, 0.16, d], C.walkwayDark);
  const n = Math.round(w / 0.5);
  const step = w / n;
  for (let k = 0; k < n; k++) {
    const [x0, x1] = [f.x - w / 2 + k * step + 0.03, f.x - w / 2 + (k + 1) * step - 0.03];
    const [z0, z1] = [f.z - d / 2 + 0.03, f.z + d / 2 - 0.03];
    const y = f.y + 0.004;
    b.quad([x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0], k % 2 ? C.walkwayLight : C.walkway);
  }
  for (const dx of [-w / 2 + 0.3, -w / 6, w / 6, w / 2 - 0.3]) b.box({ x: f.x + dx, y: -1.2, z: f.z - d / 2 + 0.12 }, [0.18, f.y - 0.16 + 1.2, 0.18], C.walkwayDark);
}

/**
 * L'archéologue, immobile (directeur artistique ; un homme, consultant Archipéo) : le bas du corps sombre (son pantalon
 * brun, droit, deux jambes et leurs chaussures), le haut clair (sa chemise bleu ciel), la tête, ses cheveux gris
 * courts jusqu'à la nuque, le front dégagé ; un bras qui tombe, la main sur le manche de sa brosse de fouille, sa tête
 * plate plus large que le manche et la frange de ses soies en bas (relecture DA de L8 : jamais un maillet, jamais une calotte ni
 * une robe). Ni chapeau à bord, ni barbe, ni lunettes, ni gilet, ni truelle ; il ne dit rien.
 */
function archeologue(b: FacetBuilder, place: PlaceId, body: boolean): void {
  if (!body) return;
  const at = scenetteHabitant(place);
  trouserLegs(b, at, C.brownTrousers);
  b.prism({ x: at.x, y: at.y + TROUSER_TOP, z: at.z }, 0.31, 0.29, 0.92 - TROUSER_TOP, 10, C.skyShirt, C.skyShirtShade);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 8, 6, C.head);
  // Les cheveux courts : jusqu'au haut du front devant, jusqu'aux oreilles sur les côtés, jusqu'à la nuque derrière.
  habitantHair(b, at, C.greyHair);
  // Le bras gauche le long du corps ; le droit un peu en avant, la main sur le manche de la brosse.
  b.beam({ x: at.x - 0.29, y: at.y + 0.86, z: at.z }, { x: at.x - 0.37, y: at.y + 0.46, z: at.z + 0.04 }, 0.13, C.skyShirt);
  const hand = { x: at.x + 0.36, y: at.y + 0.5, z: at.z + 0.18 };
  b.beam({ x: at.x + 0.29, y: at.y + 0.86, z: at.z + 0.02 }, hand, 0.13, C.skyShirt);
  // La brosse, tenue court, tête en bas : un bout de manche dans la main, la monture plate, six fois plus large que lui
  // et mince, et ses soies, une frange sombre d'un seul tenant, plus haute que la monture et à peine moins large (jamais
  // un pavé au bout d'un long manche, qui se lirait comme un maillet, ni des dents séparées, comme un râteau).
  const neck = { x: hand.x + 0.02, y: hand.y - 0.12, z: hand.z + 0.03 };
  b.beam({ x: hand.x, y: hand.y + 0.04, z: hand.z }, neck, 0.04, C.brushHandle);
  b.box({ x: neck.x, y: neck.y - 0.04, z: neck.z }, [0.24, 0.04, 0.06], C.brushHandle);
  b.box({ x: neck.x, y: neck.y - 0.16, z: neck.z }, [0.22, 0.12, 0.045], C.bristle);
}

/**
 * Le dallage de la scène des Ruines (lot L8b ; repris avec les abords, directeur artistique : « la même estrade grise
 * partout », il devient le sol du lieu) : deux rangs de dalles de pierre des Passeurs, décalés d'une demi-dalle à chaque
 * bout, que leur bord ne dessine plus le rectangle d'une estrade ; levés au-dessus du dallage usé du lieu (la scénette
 * se joue aussi avant qu'il soit dégagé). Chaque rang : un bloc de l'ombre de la pierre, un rien plus bas que le sol de
 * la scène, et ses dalles posées dessus, en deux tons alternés ; entre elles, les joints, de l'ombre. Les abords
 * (./ruinsSurroundings.ts) posent des touffes et des blocs à leur bord.
 */
function ruinsPaving(b: FacetBuilder): void {
  const o = floorOf('ruins');
  const depth = sceneDepth('ruins');
  const P = RUINS_PAVING;
  for (const [r, row] of P.rows.entries()) {
    const [x0, x1, z0, z1] = [o.x + row.x0, o.x + row.x1, o.z + row.z0, o.z + row.z1];
    b.box({ x: (x0 + x1) / 2, y: o.y - depth, z: (z0 + z1) / 2 }, [x1 - x0, depth - P.joint, z1 - z0], C.passeurShade);
    const w = (x1 - x0) / P.slabs;
    for (let k = 0; k < P.slabs; k++) {
      const [a, c] = [x0 + k * w + P.gap, x0 + (k + 1) * w - P.gap];
      b.quad([a, o.y, z1 - P.gap], [c, o.y, z1 - P.gap], [c, o.y, z0 + P.gap], [a, o.y, z0 + P.gap], (k + r) % 2 ? C.passeurStone : C.passeurWarm);
    }
  }
}

/**
 * Le dallage de la scène des Ruines : ses deux rangs (leurs bords, depuis le sol de la scène), le nombre de dalles de
 * chacun, le joint (de combien le bloc du rang est plus bas que ses dalles) et le demi-joint entre deux dalles.
 */
const RUINS_PAVING = {
  rows: [
    { x0: -4.8, x1: 4.3, z0: -1.5, z1: -0.02 },
    { x0: -4.3, x1: 4.8, z0: 0.02, z1: 1.5 },
  ],
  slabs: 6,
  joint: 0.012,
  gap: 0.03,
} as const;

/**
 * La photographe, immobile, une visiteuse de l'Observatoire (jamais son occupante, consultant Archipéo) : le haut clair,
 * sa veste lavande, une teinte que le monde n'a pas encore ; le bas du corps sombre, son pantalon gris chaud (relecture de
 * L6b : jamais un seul prisme clair jusqu'au sol) ; la tête, ses cheveux sombres et courts ; à côté d'elle, à l'est, une
 * chambre photographique de bois sur son trépied, une main posée dessus, l'objectif tourné vers le large, à l'est (ni
 * éclair, ni reflet, ni image montrée). Elle ne dit rien.
 */
function photographe(b: FacetBuilder, place: PlaceId, body: boolean): void {
  const at = scenetteHabitant(place);
  const cam = PHOTO_CAMERA;
  const top = { x: at.x + cam.dx, y: at.y + cam.height, z: at.z + cam.dz };
  if (body) {
    trouserLegs(b, at, C.warmGrey);
    b.prism({ x: at.x, y: at.y + TROUSER_TOP, z: at.z }, 0.33, 0.27, 0.92 - TROUSER_TOP, 10, C.lavender, C.lavenderShade);
    sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 8, 6, C.head);
    habitantHair(b, at, C.hair);
    // Le bras de l'ouest, le long du corps ; celui de l'est, posé sur la chambre.
    b.beam({ x: at.x - 0.27, y: at.y + 0.84, z: at.z + 0.02 }, { x: at.x - 0.33, y: at.y + 0.42, z: at.z + 0.08 }, 0.14, C.lavender);
    b.beam({ x: at.x + 0.27, y: at.y + 0.84, z: at.z + 0.02 }, { x: top.x - 0.1, y: top.y + cam.body[1] + 0.02, z: top.z }, 0.14, C.lavender);
  }
  // La chambre sur son trépied, à côté d'elle : elle reste avec son modèle, plus lisible que le petit appareil qu'il porte
  // en bandoulière (le trépied dit « photographe » de loin).
  // Le trépied : trois pieds de bois, du dessous de la chambre jusqu'au sol, écartés.
  for (const a of [0.3, 2.4, 4.5]) b.beam({ x: top.x, y: top.y, z: top.z }, { x: top.x + 0.32 * Math.cos(a), y: at.y, z: top.z + 0.32 * Math.sin(a) }, 0.05, C.woodSide);
  // La chambre : son corps de bois clair, son soufflet sombre, sa planchette avant et son objectif, vers l'est.
  b.box({ x: top.x, y: top.y, z: top.z }, cam.body, C.cameraWood, C.newWood);
  b.box({ x: top.x + cam.body[0] / 2 + 0.08, y: top.y + 0.04, z: top.z }, [0.16, cam.body[1] - 0.08, cam.body[2] - 0.08], C.bellows);
  b.box({ x: top.x + cam.body[0] / 2 + 0.19, y: top.y + 0.01, z: top.z }, [0.06, cam.body[1] - 0.02, cam.body[2] - 0.02], C.cameraWood);
  b.drum({ x: top.x + cam.body[0] / 2 + 0.22, y: top.y + cam.body[1] / 2, z: top.z, pitch: Math.PI / 2, yaw: Math.PI / 2 }, 0.08, 0.1, 6, C.bellows);
}

/**
 * Les cheveux courts des quatre habitants du rivage sud (relecture de L8c-d : jamais une calotte sur le haut du crâne ;
 * une seule construction, seule change leur couleur, la tresse de la botaniste en plus) :
 * une coque un peu plus grande que la tête, dont le bord descend du front (devant, le visage reste nu) aux oreilles sur
 * les côtés, puis sur la nuque derrière. Ses mesures : son rayon, ses bandes, ses pans ; jusqu'où descend son bord
 * devant, sur les côtés et derrière (en angle depuis le sommet).
 */
const HAIR = { r: 0.25, rings: 4, sides: 10, front: 80, side: 105, back: 130 } as const;

function habitantHair(b: FacetBuilder, at: Vec3, color: number): void {
  const c = { x: at.x, y: at.y + 1.15, z: at.z };
  const H = HAIR;
  const at2 = (i: number, k: number): [number, number, number] => {
    const theta = (2 * Math.PI * k) / H.sides;
    // Le bord : devant (sin θ = 1, vers +z), sur les côtés (sin θ = 0), derrière (sin θ = −1).
    const s = Math.sin(theta);
    const reach = s >= 0 ? H.side + (H.front - H.side) * s : H.side + (H.side - H.back) * s;
    const phi = (((reach * Math.PI) / 180) * i) / H.rings;
    return [c.x + H.r * Math.sin(phi) * Math.cos(theta), c.y + H.r * Math.cos(phi), c.z + H.r * Math.sin(phi) * s];
  };
  for (let i = 0; i < H.rings; i++)
    for (let k = 0; k < H.sides; k++) {
      const a = at2(i, k),
        bb = at2(i, k + 1),
        cc = at2(i + 1, k + 1),
        d = at2(i + 1, k);
      if (i === 0) b.triangle(a, cc, d, color);
      else b.quad(a, bb, cc, d, color);
    }
}

/** La chambre de la photographe, depuis ses pieds : à l'est, un peu devant elle ; la hauteur de son dessous ; son corps. */
const PHOTO_CAMERA = { dx: 0.72, dz: 0.12, height: 0.88, body: [0.34, 0.3, 0.32] as [number, number, number] } as const;

/**
 * La dalle de l'Observatoire (lot L8c) : des dalles de la pierre des Écluses au sud du tambour, sur la terrasse (un peu
 * au-dessus d'elle), où se tiennent Kéo et la photographe ; la baie (l'objet témoin) au milieu, contre le tambour.
 */
function observatoryPaving(b: FacetBuilder): void {
  const o = floorOf('observatory');
  const P = OBSERVATORY_PAVING;
  // Sans joints (relecture de L8c-d : de chaque côté des personnages, un trait en oblique se lisait comme un bâton). Plus
  // d'estrade qui flotte (directeur artistique, abords de l'Observatoire, 18 octobre 2026) : le dessus des dalles, puis,
  // à l'est, au sud et à l'ouest, un talus d'herbe qui descend en pente jusque sous l'herbe du tertre ; au nord, contre
  // le tambour, rien. Le sentier de la porte y arrive par une marche, et des dalles éparses la fondent dans l'herbe
  // (./observatorySurroundings.ts).
  const x0 = o.x - P.half,
    x1 = o.x + P.half,
    z0 = o.z + P.dz - P.depth / 2,
    z1 = o.z + P.dz + P.depth / 2;
  const foot = Math.min(...[x0, x1].flatMap((x) => [z0, z1].map((z) => standingHeight(heightAt({ x, z }))))) - 0.06;
  const s = P.slope;
  const y = o.y;
  b.quad([x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0], C.pavingLight);
  b.quad([x0, y, z1], [x0 - s, foot, z1 + s], [x1 + s, foot, z1 + s], [x1, y, z1], C.pavingBank);
  b.quad([x1, y, z1], [x1 + s, foot, z1 + s], [x1 + s, foot, z0], [x1, y, z0], C.pavingBank);
  b.quad([x0, y, z0], [x0 - s, foot, z0], [x0 - s, foot, z1 + s], [x0, y, z1], C.pavingBank);
  // Les deux bouts nord du talus, fermés (vus de dos, à l'est et à l'ouest du tambour).
  b.triangle([x1, y, z0], [x1 + s, foot, z0], [x1, foot, z0], C.pavingBank);
  b.triangle([x0, y, z0], [x0, foot, z0], [x0 - s, foot, z0], C.pavingBank);
}

/**
 * La dalle de l'Observatoire : sa demi-largeur, sa profondeur, son milieu un peu au sud du point de la scène (son bord
 * nord contre le tambour, jamais dedans), l'avancée de son talus.
 */
const OBSERVATORY_PAVING = { half: 4.6, depth: 2.35, dz: 0.32, slope: 0.55 } as const;

/**
 * Le couvreur, immobile, l'artisan qui refait la toiture de la Halle (un métier, jamais un élu) : le haut clair, sa
 * chemise vert d'eau ; le bas du corps sombre, son pantalon brun cuir (jamais un seul prisme clair jusqu'au sol) ; la
 * tête nue, ses cheveux sombres et courts (ni chapeau, ni casque, ni écharpe, ni pendentif) ; sous son bras de l'est,
 * une tuile verte de la toiture, couchée le long de son flanc. Ni marteau, ni outil qui frappe. Il ne dit rien.
 */
function couvreur(b: FacetBuilder, place: PlaceId, body: boolean): void {
  const at = scenetteHabitant(place);
  const model = body ? null : loadedHabitant(place);
  if (model) {
    // Avec son modèle (son sac au dos, les bras le long du corps, sans tuile) : la même tuile, dressée au sol à côté de
    // lui, à l'est (`COUVREUR_STANDING_TILE`, relecture du directeur artistique : couchée à 55° avec un vide, elle se lisait
    // comme tombée), son bas sur la dalle, son haut appuyé contre sa jambe : le bord de sa voûte touche le dehors de la
    // jambe à la hauteur de son haut (`habitantEastSide`), sans vide.
    const T = COUVREUR_STANDING_TILE;
    const height = T.length * Math.sin(T.slope) + 0.01;
    const leg = habitantEastSide(model, (height - 0.12) / HABITANT_HEIGHT, height / HABITANT_HEIGHT);
    canalTile(b, { x: at.x + leg + T.r * Math.sin(T.slope), y: at.y + height, z: at.z + T.dz }, T);
    return;
  }
  if (!body) {
    canalTile(b, { x: at.x + COUVREUR_TILE.dx, y: at.y + COUVREUR_TILE.height, z: at.z + COUVREUR_TILE.dz }, COUVREUR_TILE);
    return;
  }
  trouserLegs(b, at, C.rooferLeather);
  b.prism({ x: at.x, y: at.y + TROUSER_TOP, z: at.z }, 0.33, 0.27, 0.92 - TROUSER_TOP, 10, C.rooferShirt, C.rooferShirtShade);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 8, 6, C.head);
  habitantHair(b, at, C.hair);
  // Le bras de l'ouest, le long du corps.
  b.beam({ x: at.x - 0.27, y: at.y + 0.84, z: at.z + 0.02 }, { x: at.x - 0.33, y: at.y + 0.42, z: at.z + 0.08 }, 0.14, C.rooferShirt);
  // La tuile canal couchée le long du flanc de l'est (directeur artistique, L8) : son haut sous l'aisselle, contre le
  // torse, son bas vers l'extérieur, à 55° de l'horizontale ; une demi-voûte dont la face bombée, Vert île, est tournée
  // vers la caméra, le creux contre lui. Elle passe devant le bras (clôture de L8 : de face, on la voit sur toute sa
  // longueur) ; le bras, derrière elle, la tient par son bas, la main sur son bord, dehors.
  const T = COUVREUR_TILE;
  const top = { x: at.x + T.dx, y: at.y + T.height, z: at.z + T.dz };
  const tile = canalTile(b, top, T);
  b.beam({ x: at.x + 0.27, y: at.y + 0.84, z: at.z + 0.02 }, tile.grip, 0.14, C.rooferShirt);
}

/**
 * La tuile canal du couvreur, depuis ses pieds : le haut de sa ligne de faîte (son écart vers l'est, sa hauteur, son
 * avancée vers la caméra) ; sa pente sous l'horizontale, dans le plan de la caméra ; sa longueur, le rayon de sa voûte,
 * son épaisseur, ses pans ; où la main la tient, le long d'elle (de son haut à son bas).
 */
const COUVREUR_TILE = { dx: 0.33, height: 0.78, dz: 0.12, slope: (55 * Math.PI) / 180, length: 0.5, r: 0.085, thick: 0.03, segments: 4, grip: 0.8 } as const;

/** La tuile du couvreur posée au sol contre la jambe de son modèle : dressée à 72°, presque dans le plan de ses jambes. */
const COUVREUR_STANDING_TILE = { ...COUVREUR_TILE, slope: (72 * Math.PI) / 180, dz: 0.04 } as const;

/**
 * Une tuile canal : une demi-voûte le long de sa ligne de faîte, qui part de `top` et descend vers l'est selon sa pente ;
 * sa face bombée (dehors) vers +z, la caméra, son creux derrière ; ses deux bords longs et ses deux bouts fermés. Rend où
 * la main la tient : sur son bord de l'est, le haut, un peu derrière lui (le bras passe derrière elle).
 */
function canalTile(b: FacetBuilder, top: Vec3, T: { slope: number; length: number; r: number; thick: number; segments: number; grip: number }): { grip: Vec3 } {
  const u: [number, number, number] = [Math.cos(T.slope), -Math.sin(T.slope), 0];
  const n: [number, number, number] = [Math.sin(T.slope), Math.cos(T.slope), 0];
  const point = (s: number, theta: number, r: number): [number, number, number] => [
    top.x + s * u[0] + r * (Math.sin(theta) * n[0]),
    top.y + s * u[1] + r * (Math.sin(theta) * n[1]),
    top.z + r * Math.cos(theta),
  ];
  // Chaque face, tournée vers où elle regarde (la voûte n'a qu'une face par côté).
  const face = (a: [number, number, number], bb: [number, number, number], c: [number, number, number], d: [number, number, number], out: [number, number, number], color: number) => {
    const nx = (bb[1] - a[1]) * (c[2] - a[2]) - (bb[2] - a[2]) * (c[1] - a[1]);
    const ny = (bb[2] - a[2]) * (c[0] - a[0]) - (bb[0] - a[0]) * (c[2] - a[2]);
    const nz = (bb[0] - a[0]) * (c[1] - a[1]) - (bb[1] - a[1]) * (c[0] - a[0]);
    if (nx * out[0] + ny * out[1] + nz * out[2] >= 0) b.quad(a, bb, c, d, color);
    else b.quad(d, c, bb, a, color);
  };
  const thetas = Array.from({ length: T.segments + 1 }, (_, j) => -Math.PI / 2 + (Math.PI * j) / T.segments);
  const [s0, s1] = [0, T.length];
  const ri = T.r - T.thick;
  for (let j = 0; j < T.segments; j++) {
    const [t0, t1] = [thetas[j], thetas[j + 1]];
    const mid = (t0 + t1) / 2;
    const out: [number, number, number] = [Math.sin(mid) * n[0], Math.sin(mid) * n[1], Math.cos(mid)];
    face(point(s0, t0, T.r), point(s0, t1, T.r), point(s1, t1, T.r), point(s1, t0, T.r), out, C.tile);
    face(point(s0, t0, ri), point(s1, t0, ri), point(s1, t1, ri), point(s0, t1, ri), [-out[0], -out[1], -out[2]], C.tileShade);
    face(point(s0, t0, ri), point(s0, t1, ri), point(s0, t1, T.r), point(s0, t0, T.r), [-u[0], -u[1], -u[2]], C.tileShade);
    face(point(s1, t0, ri), point(s1, t0, T.r), point(s1, t1, T.r), point(s1, t1, ri), u, C.tileShade);
  }
  for (const [theta, side] of [
    [thetas[0], -1],
    [thetas[T.segments], 1],
  ] as const)
    face(point(s0, theta, ri), point(s1, theta, ri), point(s1, theta, T.r), point(s0, theta, T.r), [side * n[0], side * n[1], side * n[2]], C.tileShade);
  const g = point(T.grip * T.length, Math.PI / 2, T.r + 0.03);
  return { grip: { x: g[0], y: g[1], z: g[2] - 0.02 } };
}

/**
 * La dalle de la Halle (lot L8d) : des dalles de la pierre des Passeurs sous le bord de la toiture, au sud du rang des
 * piliers, où se tiennent Kéo et le couvreur ; la borne-fontaine (l'objet témoin) au milieu.
 */
function commonsPaving(b: FacetBuilder): void {
  const o = floorOf('commons');
  const depth = sceneDepth('commons');
  const P = COMMONS_PAVING;
  // Sans joints, comme à l'Observatoire (relecture de L8c-d).
  b.box({ x: o.x, y: o.y - depth, z: o.z + P.dz }, [2 * P.half, depth, P.depth], C.passeurShade, C.paving);
}

/** La dalle de la Halle : sa demi-largeur, sa profondeur, son milieu un peu au nord du point de la scène (la borne). */
const COMMONS_PAVING = { half: 4.6, depth: 2.6, dz: -0.1 } as const;

/**
 * Le bord du bassin des Marais salants (lot L5) : le muret d'argile où se tiennent Kéo et la saunière, sur toute la
 * largeur de la scène, et derrière lui l'eau du bassin, où se dressent la jauge ou la vanne de l'item.
 */
function saltPan(b: FacetBuilder): void {
  const o = floorOf('saltworks');
  const depth = sceneDepth('saltworks') + SALT_PAN.rise;
  b.box({ x: o.x, y: o.y - depth, z: o.z + SALT_PAN.front / 2 }, [2 * SALT_PAN.half, depth, SALT_PAN.front], C.clay, C.clayTop);
  b.box({ x: o.x, y: o.y - depth, z: o.z - SALT_PAN.water / 2 }, [2 * SALT_PAN.half, depth - SALT_PAN.low, SALT_PAN.water], C.clay, C.pan);
}

/**
 * Le bord du bassin : sa demi-largeur, la profondeur du muret (au sud du point de la scène), de l'eau (au nord), le
 * creux de l'eau sous le dessus du muret, et la hauteur du muret au-dessus de la grève (l'eau reste au-dessus du sol).
 */
const SALT_PAN = { half: 6.2, front: 1.4, water: 1.8, low: 0.15, rise: 0.35 } as const;

/**
 * Le plancher de séchage des Filets, de part et d'autre de la plate-forme du filet (la scène de l'item), à sa hauteur :
 * Kéo à l'ouest, la pêcheuse à l'est. `center` : la plate-forme seule, à la place de celle de l'item (la réussite,
 * quand le filet a quitté le plancher ; les deux côtés y sont déjà, avec le décor de près).
 */
function dryingDeck(b: FacetBuilder, center: boolean): void {
  const o = floorOf('filets');
  const depth = sceneDepth('filets');
  for (const side of center ? [0] : [-1, 1]) {
    const w = side === 0 ? FILET_DECK.inner * 2 : FILET_DECK.outer - FILET_DECK.inner;
    const x = o.x + side * (FILET_DECK.inner + FILET_DECK.outer) / 2;
    b.box({ x, y: o.y - depth, z: o.z }, [w, depth, FILET_DECK.depth], C.woodSide, C.wood);
  }
}

/** Le plancher des Filets : la plate-forme du filet en son milieu (`inner` de chaque côté), jusqu'à `outer`. */
const FILET_DECK = { inner: 2.7, outer: 5.8, depth: 3.2 } as const;

/**
 * Le quai du sas des Écluses, de part et d'autre de la plate-forme du sas (la scène de l'item), à sa hauteur ; le canal
 * devant, sous le plancher ; au sud, sa berge (la rangée des leviers s'y pose) : une bordure de pierre le long de l'eau,
 * le chemin de halage, puis l'herbe, ses flancs de roche comme les berges de la rivière (la pierre du quai en bordure
 * seulement, directeur artistique). La porte qui ferme le canal, entre le sas et l'éclusier : deux bornes de pierre aux
 * gonds, deux vantaux qui montent à son épaule, et leurs balanciers, qui prolongent les vantaux au-dessus des quais ;
 * fermés (de bois sombre, en pointe vers l'amont) ou ouverts (neufs, rabattus vers l'aval, contre les bords).
 */
function lockQuay(b: FacetBuilder, open: boolean, posed: boolean): void {
  const o = floorOf('ecluses');
  const depth = sceneDepth('ecluses');
  for (const side of [-1, 1]) b.box({ x: o.x + side * 4.05, y: o.y - depth, z: o.z }, [3.5, depth, 1.6], C.pavingSide, C.paving);
  const width = LOCK.back - LOCK.front;
  const mid = o.z + (LOCK.front + LOCK.back) / 2;
  const long = 2 * LOCK.reach;
  b.box({ x: o.x, y: o.y - depth, z: mid }, [long, depth - LOCK.water, width], C.stoneSide, C.canal);
  // La berge : la bordure de pierre, un peu plus haute, puis l'herbe ; le chemin de halage posé dessus.
  const bank = o.z + LOCK.back;
  b.box({ x: o.x, y: o.y - depth, z: bank + LOCK.kerb / 2 }, [long, depth + 0.04, LOCK.kerb], C.stoneSide, C.stone);
  const grass = LOCK.forecourt - LOCK.kerb;
  b.box({ x: o.x, y: o.y - depth, z: bank + LOCK.kerb + grass / 2 }, [long + 2 * LOCK.bank, depth, grass], C.rock, C.grass);
  b.box({ x: o.x, y: o.y, z: bank + LOCK.kerb + LOCK.towpath / 2 }, [long, 0.02, LOCK.towpath], C.path);
  // La porte du canal est de la trace (le haut des Écluses) : tant qu'il n'est pas posé, le canal reste ouvert.
  if (!posed) return;
  const gx = o.x + LOCK.gate;
  const bottom = o.y - LOCK.water - 0.35;
  const top = o.y + LOCK.gateTop;
  for (const z of [o.z + LOCK.front, bank]) b.box({ x: gx, y: o.y, z }, [0.34, 0.5, 0.34], C.stoneSide, C.stone);
  for (const k of [0, 1]) {
    const hinge = k ? bank - 0.1 : o.z + LOCK.front + 0.1;
    if (open) {
      b.box({ x: gx + LOCK.leaf / 2 + 0.1, y: bottom, z: hinge }, [LOCK.leaf, top - bottom, 0.14], C.newWood, C.lightWood);
      b.beam({ x: gx + 0.1, y: top - 0.08, z: hinge }, { x: gx - LOCK.beam, y: top - 0.08, z: hinge }, 0.14, C.lever);
      beamRest(b, gx - LOCK.beam + 0.1, hinge, bottom, top);
    } else {
      // Fermés, les deux vantaux se rejoignent en pointe vers l'amont (une porte busquée) : de biais, la caméra voit
      // leur face, pas seulement leur tranche.
      const dx = -LOCK.mitre,
        dz = o.z + (LOCK.front + LOCK.back) / 2 - hinge;
      const length = Math.hypot(dx, dz);
      const yaw = Math.atan2(dx, dz);
      b.box({ x: gx + dx / 2, y: bottom, z: hinge + dz / 2, yaw }, [0.2, top - bottom, length], C.lever, C.lightWood);
      const back = LOCK.beam / length;
      b.beam({ x: gx, y: top - 0.08, z: hinge }, { x: gx - dx * back, y: top - 0.08, z: hinge - dz * back }, 0.14, C.lever);
      // Sur le quai (le vantail d'amont) ou sur la berge (celui d'aval) : les deux au niveau du quai.
      beamRest(b, gx - dx * (back - 0.1 / length), hinge - dz * (back - 0.1 / length), o.y, top);
    }
  }
}

/**
 * Le chevalet sous le bout d'un balancier de la porte du canal : un poteau de bois du sol (`from`) jusque sous le
 * balancier (son haut à `top`), pour que le bout ne flotte jamais (consultant Archipéo, directeur artistique).
 */
function beamRest(b: FacetBuilder, x: number, z: number, from: number, top: number): void {
  b.box({ x, y: from, z }, [0.12, top - 0.15 - from, 0.12], C.lever);
}

/**
 * Le décor de près d'une scénette, fait à l'arrivée : au Phare, la galerie élargie (son plancher sur un encorbellement)
 * et sa rambarde (poteaux, main courante, lisse), et la gardienne ; aux Quais, le docker (le quai, la grue et la barque
 * sont la scène de l'item) ; aux Filets, le plancher de séchage et la pêcheuse ; aux Écluses, le quai du sas, le canal
 * et sa porte (`open` : ouverte, à la réussite), et l'éclusier ; aux Marais salants, le bord du bassin et la saunière. Un seul maillage, du matériau du terrain. Tant que
 * l'étape qui porte la trace n'est pas posée (`posed` faux), rien d'elle : au Phare, ni galerie ni rambarde, la gardienne
 * au pied de la tour, son maillet à la main ; aux Écluses, le canal sans sa porte. Quand le modèle 3D de l'habitant est
 * montré (./habitants.ts, choix du mainteneur du 18 octobre 2026), il est dessiné à part, avec sa texture, par la vue :
 * le décor se fait alors sans le corps du pion, et garde ce que la scénette lui fait tenir ou poser à côté de lui (la
 * corde de la cloche, la caisse du docker, le levier de l'éclusier, la chambre de la photographe, la tuile du couvreur).
 * `topped` : l'étape du haut du lieu est posée (à la Mangrove, le carbet relevé : ses abords changent).
 */
export function scenetteDecor(anyPlace: AnyPlaceId, open = false, posed = true, topped = false): Facets {
  const place = scenePlace(anyPlace);
  return decorBuilder(place, open, posed, !loadedHabitant(place), true, topped).build();
}

/**
 * Le décor de près sans le corps de l'habitant, comme quand son modèle est montré : le sol de la scène, la rambarde, et
 * ce que l'habitant tient ou a à côté de lui et que la scénette garde. Le budget y ajoute le modèle (./budget.ts).
 */
export function scenetteSetting(place: PlaceId, open = false, posed = true): Facets {
  return decorBuilder(place, open, posed, false).build();
}

/**
 * Le décor de près sans les abords du lieu : le sol de la scène, l'habitant (son pion dessiné en code s'il n'a pas de
 * modèle) et les ombres au pied. Les tests y jugent l'habitant seul ; le décor montré y ajoute les abords.
 */
export function scenetteCore(place: PlaceId, open = false, posed = true): Facets {
  return decorBuilder(place, open, posed, !loadedHabitant(place), false).build();
}

/** Les abords d'un lieu seuls (./surroundings.ts), autour du sol de sa scène, tels que le décor de près les porte. */
export function scenetteSurroundings(place: PlaceId, open = false, posed = true, topped = false): Facets {
  const b = new FacetBuilder();
  SURROUNDINGS[place]?.(b, floorOf(place, posed), { open, posed, topped });
  return b.build();
}

/**
 * Le décor de près, avec le pion dessiné en code (`body`) ou sans corps, les abords du lieu (./surroundings.ts, sauf
 * `surroundings` faux) et les ombres au pied de Kéo et de l'habitant.
 */
function decorBuilder(place: PlaceId, open: boolean, posed: boolean, body: boolean, surroundings = true, topped = false): FacetBuilder {
  const b = sceneDecor(place, open, posed, body);
  if (surroundings) SURROUNDINGS[place]?.(b, floorOf(place, posed), { open, posed, topped });
  footShadow(b, scenetteKeo(place, posed).at, FOOT_SHADOW.keo, floorShadow(place, posed));
  footShadow(b, scenetteHabitant(place, posed), FOOT_SHADOW.habitant, floorShadow(place, posed));
  return b;
}

/**
 * Les ombres au pied dans une scénette (lot commun des scénettes, directeur artistique : « une ombre au pied, du côté
 * opposé au soleil, un aplat opaque ») : une ellipse de sept triangles, son bord côté soleil sous les pieds, allongée à
 * l'opposé du soleil (`SHADOW_DIR`), un rien au-dessus du sol de la scène.
 */
const FOOT_SHADOW = { keo: { radius: 0.3, long: 0.55 }, habitant: { radius: 0.36, long: 0.66 }, lift: 0.025, sides: 7 } as const;

/** Les triangles des deux ombres au pied, de Kéo et de l'habitant, dans le décor de près. */
export const FOOT_SHADOW_TRIANGLES = 2 * FOOT_SHADOW.sides;

/**
 * La couleur de l'ombre selon le sol de la scène : les planches (le bois, assombri d'un tiers), les dalles, la terre
 * battue ; jamais transparente, jamais noire.
 */
const FLOOR_SHADOWS = { planks: 0x7a5636, paving: 0xa58660, earth: 0xb98a55 } as const;
const FLOOR_OF: Record<PlaceId, keyof typeof FLOOR_SHADOWS> = {
  phare: 'paving',
  quais: 'planks',
  filets: 'planks',
  ecluses: 'paving',
  saltworks: 'earth',
  engine: 'paving',
  shipyard: 'planks',
  lookout: 'paving',
  archives: 'paving',
  printworks: 'earth',
  mangrove: 'planks',
  ruins: 'paving',
  observatory: 'paving',
  commons: 'paving',
  beacons: 'paving',
  ferry: 'planks',
  montee: 'planks',
  hameau: 'planks',
  radeaux: 'planks',
  croisee: 'planks',
  instants: 'planks',
};
const floorShadow = (place: PlaceId, posed: boolean): number => FLOOR_SHADOWS[place === 'phare' && !posed ? 'earth' : FLOOR_OF[place]];

function footShadow(b: FacetBuilder, at: Vec3, size: { radius: number; long: number }, color: number): void {
  const n = FOOT_SHADOW.sides;
  const back = size.long - size.radius;
  const c: [number, number, number] = [at.x + SHADOW_DIR.x * back, at.y + FOOT_SHADOW.lift, at.z + SHADOW_DIR.z * back];
  const rim = Array.from({ length: n }, (_, k): [number, number, number] => {
    const u = size.long * Math.cos((2 * Math.PI * k) / n);
    const v = size.radius * Math.sin((2 * Math.PI * k) / n);
    return [c[0] + u * SHADOW_DIR.x - v * SHADOW_DIR.z, c[1], c[2] + u * SHADOW_DIR.z + v * SHADOW_DIR.x];
  });
  for (let k = 0; k < n; k++) b.triangle(c, rim[(k + 1) % n], rim[k], color);
}

/** Le décor de près, avec le pion dessiné en code (`body`) ou sans corps. */
function sceneDecor(place: PlaceId, open: boolean, posed: boolean, body: boolean): FacetBuilder {
  const b = new FacetBuilder();
  if (place === 'quais') {
    docker(b, place, body);
    return b;
  }
  if (place === 'filets') {
    dryingDeck(b, false);
    pecheuse(b, place, body);
    return b;
  }
  if (place === 'ecluses') {
    lockQuay(b, open, posed);
    eclusier(b, place, body);
    return b;
  }
  if (place === 'saltworks') {
    saltPan(b);
    sauniere(b, place, body);
    return b;
  }
  if (place === 'engine') {
    enginePaving(b);
    machiniste(b, place, body);
    return b;
  }
  if (place === 'shipyard') {
    shipyardFloor(b);
    charpentier(b, place, body);
    return b;
  }
  const art = placeArt(place);
  if (art) {
    // Le rivage nord (lot L7) : le sol de la scène et l'habitant, dessinés dans le fichier du lieu.
    art.decor(b, floorOf(place), scenetteHabitant(place), sphere, body);
    return b;
  }
  if (place === 'mangrove') {
    mangroveDeck(b);
    botaniste(b, place, body);
    return b;
  }
  if (place === 'ruins') {
    ruinsPaving(b);
    archeologue(b, place, body);
    return b;
  }
  if (place === 'observatory') {
    observatoryPaving(b);
    photographe(b, place, body);
    return b;
  }
  if (place === 'commons') {
    commonsPaving(b);
    couvreur(b, place, body);
    return b;
  }
  if (!posed) {
    gardienne(b, place, false, body);
    return b;
  }
  const f = floorOf(place);
  const R = GALLERY.radius;
  const n = GALLERY.posts;
  b.prism({ x: f.x, y: f.y - 1.6, z: f.z }, 1.75, R, 1.3, n, C.deckEdge);
  b.prism({ x: f.x, y: f.y - 0.3, z: f.z }, R, R, 0.3, n, C.deckEdge, C.deck);
  const r = R - 0.08;
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * k) / n;
    const a2 = (2 * Math.PI * (k + 1)) / n;
    const p = { x: f.x + r * Math.cos(a), z: f.z + r * Math.sin(a) };
    const q = { x: f.x + r * Math.cos(a2), z: f.z + r * Math.sin(a2) };
    b.box({ x: p.x, y: f.y, z: p.z }, [0.09, GALLERY.rail, 0.09], C.rail);
    for (const y of [GALLERY.rail, GALLERY.rail * 0.45])
      b.beam({ x: p.x, y: f.y + y, z: p.z }, { x: q.x, y: f.y + y, z: q.z }, y === GALLERY.rail ? 0.09 : 0.06, C.rail);
  }
  gardienne(b, place, true, body);
  return b;
}

/**
 * Le pan de filet raccommodé, étendu sur le plancher de séchage (la plate-forme du filet de l'item) quand le séchoir
 * n'est pas encore posé : la réussite se montre avec ce qui est là, au sol.
 */
function laidNet(b: FacetBuilder): void {
  const o = floorOf('filets');
  b.box({ x: o.x, y: o.y, z: o.z }, [3.6, 0.04, 2.2], C.newRope);
  for (const dx of [-1.2, 0, 1.2]) b.box({ x: o.x + dx, y: o.y + 0.04, z: o.z }, [0.05, 0.015, 2.2], C.netLine);
  for (const dz of [-0.55, 0.55]) b.box({ x: o.x, y: o.y + 0.04, z: o.z + dz }, [3.6, 0.015, 0.05], C.netLine);
}

/**
 * La réussite d'une scénette posée (les Quais, les Filets, les Écluses), en deux temps (directeur artistique) : ce qui
 * change tout de suite (`decor`, qui remplace le décor de près ; `clearsItem` : la scène de l'item et ses objets
 * s'effacent), puis un objet qui va de la réaction de l'item (ou de `from`) à `to`, en passant `arc` unités plus haut,
 * et y reste (`landed`, ajouté au décor) ; enfin une lumière (`glow`), ou rien. D'un bloc avec « Réduire les
 * animations ». Aux Quais, la caisse du crochet descend dans la barque, puis sa lanterne de proue s'allume ; aux Filets,
 * le filet raccommodé se tend sur le séchoir, et un panier plein vient aux pieds de la pêcheuse ; aux Écluses, le sas se
 * remplit et la porte s'ouvre, puis la barque passe.
 */
export interface ScenetteFinale {
  decor: Facets;
  clearsItem: boolean;
  moving: Facets;
  from: Vec3;
  to: Vec3;
  arc: number;
  landed: Facets;
  glow: Facets | null;
}

/** Des facettes posées en `at` (elles sont faites à l'origine). */
function moved(f: Facets, at: Vec3): Facets {
  const positions = new Float32Array(f.positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = f.positions[i] + at.x;
    positions[i + 1] = f.positions[i + 1] + at.y;
    positions[i + 2] = f.positions[i + 2] + at.z;
  }
  return { ...f, positions };
}

/**
 * La réussite d'une scénette posée, pour la scène du dernier item et l'échelle de ses objets ; `null` au Phare. `posed` :
 * l'étape qui porte la trace est posée (sinon le filet raccommodé reste étendu sur le plancher, la porte du canal
 * attend son haut). `mission` : la mission jouée ; aux Filets, seul le Troupeau (`plurals`) a sa réussite, le filet
 * raccommodé et le panier plein, sa trace (relecture de L4, directeur artistique) : à l'Enclos, les paniers restent
 * remplis jusqu'au bilan ; au Tri des graines et à la Récolte, la prise reste dans le panier choisi (`null`, rien ne
 * change). Sans les abords, le panier plein ne vient pas : rien ne se montre avant son étape pour disparaître au retour.
 */
export function scenetteFinale(anyPlace: AnyPlaceId, scene: ItemScene, scale: number, posed = true, mission = ''): ScenetteFinale | null {
  const place = scenePlace(anyPlace);
  if (place === 'quais') {
    if (scene.kind !== 'quai') return null;
    const s = quaySuccess(scene, scale);
    const moving = new FacetBuilder();
    moving.append(moved(s.crate, { x: -s.hold.x, y: -s.hold.y, z: -s.hold.z }));
    return { decor: scenetteDecor(place), clearsItem: false, moving: moving.build(), from: s.hold, to: s.hold, arc: 0, landed: s.crate, glow: s.glass };
  }
  if (place === 'filets') {
    if (mission !== 'plurals') return null;
    const decor = new FacetBuilder();
    decor.append(scenetteDecor(place));
    dryingDeck(decor, true);
    if (!posed) {
      laidNet(decor);
      const none = new FacetBuilder().build();
      const o = floorOf(place);
      return { decor: decor.build(), clearsItem: true, moving: none, from: o, to: o, arc: 0, landed: none, glow: null };
    }
    mendedNet(decor);
    const basket = new FacetBuilder();
    fullBasket(basket, { x: 0, y: 0, z: 0 });
    const moving = basket.build();
    const o = floorOf(place);
    // Au pied du plancher, devant la pêcheuse, là où le panier reste ensuite dans le monde (les pièces du lieu), à la
    // même hauteur : rien ne saute au retour.
    const to = filetsBasketAt();
    return { decor: decor.build(), clearsItem: true, moving, from: { x: o.x, y: o.y, z: o.z }, to, arc: 1, landed: moved(moving, to), glow: null };
  }
  if (place === 'ecluses') {
    const decor = new FacetBuilder();
    decor.append(scenetteDecor(place, true, posed));
    decor.append(lockFull(scene));
    const o = floorOf(place);
    const y = o.y - LOCK.water;
    const z = o.z + (LOCK.front + LOCK.back) / 2;
    const moving = lockBoat();
    const to = { x: o.x + LOCK.beyond, y, z };
    return { decor: decor.build(), clearsItem: false, moving, from: { x: o.x + LOCK.stop, y, z }, to, arc: 0, landed: moved(moving, to), glow: null };
  }
  return null;
}
