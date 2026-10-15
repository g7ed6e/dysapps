// La scénette d'un lieu (piste 1, lot 2, choix du mainteneur du 14 octobre 2026) : à l'arrivée, la caméra descend dans
// le lieu, Kéo se tient à gauche, l'habitant à droite, immobile, et les objets-réponses sont en rangée en bas, sous la
// consigne écrite et lue dans un panneau sur fond uni. Le Phare d'abord : la galerie et sa rambarde, la gardienne en
// quatre volumes (son ciré, sa tête, son bonnet, son bras tendu vers la rambarde) et la corde de sonnerie, les cloches
// pendues devant la rambarde ; à la réussite, la lampe s'allume. Les Quais ensuite (lot 3) : le docker au pied de la
// grue, un bras posé sur une caisse, son crochet de levage à la main, les caisses-réponses sur un ponton du bassin ; la
// bonne caisse monte au crochet de la grue. Les Filets et les Écluses enfin (lot 4) : la pêcheuse au bord du plancher
// de séchage, la pêche sur le filet, les paniers-réponses en rangée, la prise qui va au bon panier ; à la réussite, le
// filet raccommodé se tend sur le séchoir et un panier plein vient à ses pieds. L'éclusier sur le quai du sas, les
// leviers de vanne en rangée, la barque qui avance dans le canal jusqu'à la porte ; à la réussite, le sas se remplit,
// la porte s'ouvre et la barque passe. Une scénette se joue sur le lieu tel qu'il est bâti (GD-20, lot 1) : tant que
// l'étape qui porte sa trace n'est pas posée (`posed`), avec ce qui est là (au Phare, au pied de la tour, la cloche
// tombée sur le socle). Rien à lire n'est peint dans la 3D. Le décor de près est fait à l'arrivée et
// libéré au départ par la vue. Code pur : la vue dessine.
import { CAMERA_FOV, type CameraPose } from './camera';
import { FacetBuilder, type Facets } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { COLORS_6E, DECK_HEIGHT, placeById, type PlaceId } from './plan6e';
import {
  ANSWER_LAYOUT,
  ECLUSES_TRACE_SPOTS,
  LOCK,
  QUAIS_TRACE_SPOTS,
  QUAY,
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

/**
 * Ce que l'élève lit de l'habitant : son rôle en tête du panneau, sans prénom tant que le mainteneur n'a pas tranché
 * (deambuler-scenettes.md, lot 2 : la fiche du 6e dit « habitants sans nom ni réplique ») ; `greeting`, la phrase
 * d'accueil, est vide pour la même raison : le panneau lui garde sa place, sous le rôle. `placement` : les
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
  ecluses: { role: 'L’éclusier', greeting: null, placement: 'rangee' },
};

/** La scénette d'un lieu : depuis le lot 4 de la piste 1, chaque lieu a la sienne (la question vue de loin est retirée). */
export const scenetteOf = (place: PlaceId): Scenette => SCENETTES[place];

// ---------- La place de la scénette à l'écran ----------

/**
 * Les zones de la scénette, en part de l'écran (consultant UX UI, lot 2). A, sur tablette : la consigne en haut (L 3-74,
 * H 3-26), Kéo et l'habitant au milieu (H 28-64), la rangée des réponses en bas (H 66-90), « Valider » en bas à droite.
 * B, sur un écran bas : la colonne de la consigne à gauche (celle du lot 4, `questionLayout`), la scène à droite (L
 * 40-100, H 16-62), la rangée en bas à droite (H 64-88), ou sur toute la largeur si les mots n'y tiennent pas.
 */
export const SCENETTE_LAYOUT = {
  edge: 0.03,
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
    const beside = !needs.wideRow && (right - sideLeft - (n - 1) * L.gap) / n >= (needs.words ? L.minLabelBells : L.minLabel);
    const rowLeft = beside ? sideLeft : edge;
    const { slots, objectHeight } = rowSlots(n, rowLeft, right, S.low.rowTop * height, S.low.rowBottom * height, lh, share, needs.wideRow ? S.wideLabel : L.maxWidth);
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
  // La rangée prend toute la largeur, à 12 px des bords : les mots des cloches, leur image devant, y tiennent.
  const rowRight = roomy ? width - L.edge : validate.left - S.validate.gap;
  const { slots, objectHeight } = rowSlots(n, L.edge, rowRight, S.row.top * height, rowBottom, lh, share);
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

/** Le sol des Quais : le milieu de la bande de devant du quai, contre le bord du bassin. */
function quayFloor(): Vec3 {
  const o = sceneSpot('quais');
  return { x: o.x, y: o.y, z: o.z + QUAY.depth / 2 - QUAY.strip / 2 };
}

const SITES: Record<PlaceId, ScenetteSite> = {
  phare: {
    floor: galleryFloor,
    keo: { dx: -1.45, dz: 2.3, scale: 0.6, yaw: Math.PI - 0.35 },
    habitant: { dx: 1.45, dz: 2.3 },
    subject: { halfWidth: 2.2, bottom: -0.1, top: 2.3, depth: 2 },
    pitch: (20 * Math.PI) / 180,
  },
  // La scène reste proche (réserve du directeur artistique) : Kéo, les caisses et le docker, la barque dessous ; la
  // flèche de la grue peut passer sous le panneau.
  quais: {
    floor: quayFloor,
    keo: { dx: -4.3, dz: 0, scale: 0.6, yaw: Math.PI - 0.45 },
    habitant: { dx: 3.5, dz: 0 },
    subject: { halfWidth: 4.9, bottom: -1.1, top: 2.5, depth: 0.2 },
    pitch: (24 * Math.PI) / 180,
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
  },
};

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
};

/**
 * Le lieu d'une scénette, selon ce qui est bâti (`posed` : l'étape qui porte sa trace est posée, construction.ts,
 * `traceStagePosed`). Seul le Phare change de place : sur sa galerie, ou à son pied.
 */
const siteOf = (place: PlaceId, posed = true): ScenetteSite => (place === 'phare' && !posed ? PHARE_FOOT : SITES[place]);

/** L'angle de la caméra de la scénette du Phare sous l'horizon, et le temps de la descente (coupe franche avec « Réduire les animations »). */
export const SCENETTE_CAMERA = { pitch: (20 * Math.PI) / 180, seconds: 0.9 } as const;

/** Le sol d'une scénette, dans le monde. */
const floorOf = (place: PlaceId, posed = true): Vec3 => siteOf(place, posed).floor();

/** La place de Kéo dans la scénette : ses pieds, son échelle et son cap. */
export function scenetteKeo(place: PlaceId, posed = true): { at: Vec3; scale: number; yaw: number } {
  const f = floorOf(place, posed);
  const k = siteOf(place, posed).keo;
  return { at: { x: f.x + k.dx, y: f.y, z: f.z + k.dz }, scale: k.scale, yaw: k.yaw };
}

/** Où se tient l'habitant de la scénette (ses pieds). */
export function scenetteHabitant(place: PlaceId, posed = true): Vec3 {
  const f = floorOf(place, posed);
  const h = siteOf(place, posed).habitant;
  return { x: f.x + h.dx, y: f.y, z: f.z + h.dz };
}

/**
 * Où Kéo reste en quittant la scénette d'un lieu, et ce que la caméra garde alors dans le champ (retour du directeur
 * artistique, lot 3) : la trace de la réussite. Aux Quais, sur le bord du quai, juste à l'est de la proue de la barque
 * chargée, qu'on voit au premier plan avec la grue et le hangar derrière lui ; la caméra garde la trace de la mission
 * jouée (`mission`, GD-20, point 8). Aux Filets (lot 4), devant le séchoir,
 * le panier plein et le filet tendu à sa gauche. Aux Écluses, sur la rive ouest, la caméra gardant la trace de la mission
 * jouée (la porte d'amont ouverte et le sas rempli des Nénuphars, ou une autre, `ECLUSES_TRACE_SPOTS`, lot L2). Au Phare, rien : Kéo revient sur le chemin. Rien non plus quand l'étape qui porte la trace n'est pas posée
 * (`posed`) : la trace attend. Dans ces deux cas, la caméra garde le lieu (`placeKeep`).
 */
export function scenetteExit(place: PlaceId, posed = true, mission?: string): { at: Vec2; keep: Vec3 } | null {
  if (!posed) return null;
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
  if (place === 'filets') return { at: { x: c.x + EXIT_SPOTS.filets.x, z: c.z + EXIT_SPOTS.filets.z }, keep: filetsBasketAt() };
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
export function placeKeep(place: PlaceId): Vec3 {
  const c = placeById(place).center;
  return { x: c.x, y: standingHeight(heightAt(c)) + PLACE_KEEP_HEIGHT, z: c.z };
}
/** La hauteur du point gardé au-dessus du pied du lieu. */
const PLACE_KEEP_HEIGHT = 1.5;

/** La hauteur du point gardé au-dessus du pied d'une trace des Quais. */
const TRACE_LIFT = 1;

/** Où Kéo se tient au retour des Filets et des Écluses, depuis le centre du lieu. */
const EXIT_SPOTS = { filets: { x: 3.2, z: 5.4 }, ecluses: { x: -3.6, z: 1.4 } } as const;

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
export function scenettePose(place: PlaceId, stage: ScreenBox, width: number, height: number, posed = true): { pose: CameraPose; shift: { x: number; y: number } } {
  const site = siteOf(place, posed);
  const S = site.subject;
  const f = site.floor();
  const focal = height / 2 / Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180);
  const halfW = Math.max(24, (stage.right - stage.left) / 2);
  const halfH = Math.max(24, (stage.bottom - stage.top) / 2);
  const dist = Math.max((S.halfWidth * focal) / halfW, ((S.top - S.bottom) / 2) * (focal / halfH)) * 1.05;
  const target = { x: f.x + (site.keo.dx + site.habitant.dx) / 2, y: f.y + (S.top + S.bottom) / 2, z: f.z + S.depth };
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
export const scenetteHidesPlace = (place: PlaceId): boolean => place === 'quais';

/**
 * Les pièces du lieu s'effacent-elles le temps de la scénette ? Partout sauf au Phare (ses lampes sont sur la galerie) :
 * la trace de la réussite que la scénette montre (la barque chargée, le panier plein, la porte ouverte) n'est pas
 * dessinée deux fois ; elle reste dans le monde au retour.
 */
export const scenetteHidesPieces = (place: PlaceId): boolean => place !== 'phare';

/**
 * Les objets des réponses pendent-ils (les cloches du Phare, devant la rambarde de sa galerie), ou sont-ils posés (les
 * caisses des Quais sur un ponton ; les cloches tombées au pied du Phare, sur une avancée du socle) ?
 */
export const answersHang = (place: PlaceId, posed = true): boolean => place === 'phare' && posed;

/** La bonne réponse quitte-t-elle la rangée (la caisse des Quais monte au crochet) ? Ailleurs, elle reste. */
export const answerLeaves = (place: PlaceId): boolean => place === 'quais';

/**
 * La hauteur du ponton des réponses d'une scénette, quand elles sont posées : celle des pontons du monde, sur l'eau du
 * bassin des Quais ; aux Filets et aux Écluses, un peu au-dessus du plancher de la scène (`LAND_DECK`, sans se confondre
 * avec la berge du canal ; le ponton descend jusqu'au sol, `ground`).
 */
export const scenetteDeck = (place: PlaceId, posed = true): { y: number; onLand: boolean } =>
  place === 'quais' ? { y: DECK_HEIGHT, onLand: false } : { y: floorOf(place, posed).y + LAND_DECK, onLand: true };

/** La margelle des réponses à terre, au-dessus du plancher de la scène. */
export const LAND_DECK = 0.08;

/** Le plan où pendent les cloches : devant la rambarde, au sud (la vue y pose les objets sous chaque réponse). */
export function bellPlane(place: PlaceId): { z: number; rail: Vec3 } {
  const f = floorOf(place);
  return { z: f.z + GALLERY.radius + 0.45, rail: { x: f.x, y: f.y + GALLERY.rail, z: f.z + GALLERY.radius } };
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
  water: 0x2f8fc8,
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

/** La main de l'habitant, au bout de son bras tendu vers la rambarde : la corde de sonnerie y part. */
export function habitantHand(place: PlaceId, posed = true): Vec3 {
  const at = scenetteHabitant(place, posed);
  return { x: at.x - 0.15, y: at.y + 0.78, z: at.z + 0.75 };
}

/**
 * La gardienne, immobile, en quatre volumes (consultant Archipéo) : le ciré (un cylindre évasé), la tête (une sphère),
 * le bonnet, le bras tendu vers la rambarde. La corde qu'elle tient part de sa main (`answerObjects`, avec les cloches) ;
 * sa poignée, de la couleur du bonnet, la détache du jaune du ciré (retour du directeur artistique). Au pied de la tour
 * (`posed` faux), elle tient un maillet de bois, pour frapper la cloche tombée.
 */
function gardienne(b: FacetBuilder, place: PlaceId, posed: boolean): void {
  const at = scenetteHabitant(place, posed);
  b.prism(at, 0.4, 0.27, 0.92, 12, C.coat, C.coatShade);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 12, 8, C.head);
  b.prism({ x: at.x, y: at.y + 1.2, z: at.z }, 0.25, 0.12, 0.2, 12, C.cap);
  const hand = habitantHand(place, posed);
  b.beam({ x: at.x - 0.12, y: at.y + 0.82, z: at.z + 0.12 }, hand, 0.15, C.coat);
  if (posed) {
    b.box({ x: hand.x, y: hand.y - 0.1, z: hand.z }, [0.16, 0.2, 0.16], C.cap);
    return;
  }
  // Le maillet : son manche tenu dans la main, sa tête en travers, de la couleur du bonnet.
  const head = { x: hand.x - 0.05, y: hand.y - 0.42, z: hand.z + 0.18 };
  b.beam(hand, head, 0.06, C.cap);
  b.box({ x: head.x, y: head.y - 0.09, z: head.z, yaw: 0.3 }, [0.32, 0.18, 0.18], C.cap);
}

/**
 * Le docker, immobile, en quatre volumes (consultant Archipéo) : le corps en cube arrondi (son gilet vert lagon), la tête
 * (une sphère sable), la casquette (un disque jaune lanterne et sa visière), un bras posé sur une caisse à sa gauche ;
 * de l'autre main, il tient son crochet de levage (un manche et un anneau).
 */
function docker(b: FacetBuilder, place: PlaceId): void {
  const at = scenetteHabitant(place);
  // Le cube arrondi : un prisme à huit pans, presque droit.
  b.prism({ ...at, yaw: Math.PI / 8 }, 0.38, 0.33, 0.92, 8, C.vest, C.vestShade);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 12, 8, C.head);
  b.prism({ x: at.x, y: at.y + 1.25, z: at.z }, 0.26, 0.26, 0.08, 12, C.dockCap);
  b.box({ x: at.x, y: at.y + 1.25, z: at.z + 0.27 }, [0.3, 0.05, 0.2], C.dockCap);
  // Le bras gauche posé sur une caisse, à côté de lui.
  const crate = { x: at.x - 0.72, y: at.y, z: at.z + 0.05 };
  b.box(crate, [0.6, 0.6, 0.6], C.crate, C.crateTop);
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
function pecheuse(b: FacetBuilder, place: PlaceId): void {
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
function eclusier(b: FacetBuilder, place: PlaceId): void {
  const at = scenetteHabitant(place);
  b.prism(at, 0.42, 0.28, 0.92, 12, C.lockCoat, C.lockCoatShade);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 12, 8, C.head);
  // Le béret : un disque plat, un peu penché, et sa queue.
  b.prism({ x: at.x + 0.03, y: at.y + 1.26, z: at.z, pitch: 0.15 }, 0.27, 0.24, 0.08, 12, C.beret);
  b.box({ x: at.x + 0.03, y: at.y + 1.36, z: at.z }, [0.04, 0.06, 0.04], C.beret);
  const lever = { x: at.x - 0.62, y: at.y, z: at.z + 0.25 };
  b.box(lever, [0.36, 0.22, 0.32], C.stoneSide, C.stone);
  const top = { x: lever.x + 0.05, y: lever.y + 1.05, z: lever.z - 0.18 };
  b.beam({ x: lever.x, y: lever.y + 0.2, z: lever.z }, top, 0.08, C.lever);
  b.box({ x: top.x, y: top.y - 0.06, z: top.z }, [0.18, 0.14, 0.14], C.knob);
  b.beam({ x: at.x - 0.26, y: at.y + 0.84, z: at.z + 0.06 }, { x: top.x + 0.06, y: top.y - 0.04, z: top.z + 0.02 }, 0.15, C.lockCoat);
}

/**
 * Le plancher de séchage des Filets, de part et d'autre de la plate-forme du filet (la scène de l'item), à sa hauteur :
 * Kéo à l'ouest, la pêcheuse à l'est. `center` : la plate-forme aussi (la réussite, quand le filet a quitté le
 * plancher).
 */
function dryingDeck(b: FacetBuilder, center: boolean): void {
  const o = floorOf('filets');
  const depth = sceneDepth('filets');
  for (const side of center ? [-1, 0, 1] : [-1, 1]) {
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
  for (const side of [-1, 1]) b.box({ x: o.x + side * 4.05, y: o.y - depth, z: o.z }, [3.5, depth, 1.6], C.stoneSide, C.stone);
  const width = LOCK.back - LOCK.front;
  const mid = o.z + (LOCK.front + LOCK.back) / 2;
  const long = 2 * LOCK.half;
  b.box({ x: o.x, y: o.y - depth, z: mid }, [long, depth - LOCK.water, width], C.stoneSide, C.water);
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
 * et sa porte (`open` : ouverte, à la réussite), et l'éclusier. Un seul maillage, du matériau du terrain. Tant que
 * l'étape qui porte la trace n'est pas posée (`posed` faux), rien d'elle : au Phare, ni galerie ni rambarde, la gardienne
 * au pied de la tour, son maillet à la main ; aux Écluses, le canal sans sa porte.
 */
export function scenetteDecor(place: PlaceId, open = false, posed = true): Facets {
  const b = new FacetBuilder();
  if (place === 'quais') {
    docker(b, place);
    return b.build();
  }
  if (place === 'filets') {
    dryingDeck(b, false);
    pecheuse(b, place);
    return b.build();
  }
  if (place === 'ecluses') {
    lockQuay(b, open, posed);
    eclusier(b, place);
    return b.build();
  }
  if (!posed) {
    gardienne(b, place, false);
    return b.build();
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
  gardienne(b, place, true);
  return b.build();
}

/**
 * La vitre de la lanterne, un peu plus large que celle du modèle : la lampe qui s'allume à la réussite. La vue la
 * dessine avec le maillage de la réaction des cloches (caché à ce moment-là) et un matériau sans lumière : aucun
 * appel de plus.
 */
export function lanternGlass(place: PlaceId): Facets {
  const b = new FacetBuilder();
  const f = floorOf(place);
  b.prism({ x: f.x, y: f.y - 0.45, z: f.z }, 1.09, 1.09, 1.52, 8, 0xffffff);
  return b.build();
}

/**
 * Ce qui s'allume à la réussite d'une scénette : la lampe du Phare (sa vitre), quand sa lanterne est posée et encore
 * éteinte (`lantern`), ou rien (ailleurs, la réussite passe par `scenetteFinale`).
 */
export function scenetteSuccess(place: PlaceId, lantern = true): Facets | null {
  return place === 'phare' && lantern ? lanternGlass(place) : null;
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
 * attend son haut).
 */
export function scenetteFinale(place: PlaceId, scene: ItemScene, scale: number, posed = true): ScenetteFinale | null {
  if (place === 'quais') {
    if (scene.kind !== 'quai') return null;
    const s = quaySuccess(scene, scale);
    const moving = new FacetBuilder();
    moving.append(moved(s.crate, { x: -s.hold.x, y: -s.hold.y, z: -s.hold.z }));
    return { decor: scenetteDecor(place), clearsItem: false, moving: moving.build(), from: s.hold, to: s.hold, arc: 0, landed: s.crate, glow: s.glass };
  }
  if (place === 'filets') {
    const decor = new FacetBuilder();
    decor.append(scenetteDecor(place));
    dryingDeck(decor, true);
    if (posed) mendedNet(decor);
    else laidNet(decor);
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
