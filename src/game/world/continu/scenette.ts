// La scénette d'un lieu (piste 1, lot 2, choix du mainteneur du 14 octobre 2026) : à l'arrivée, la caméra descend dans
// le lieu, Kéo se tient à gauche, l'habitant à droite, immobile, et les objets-réponses sont en rangée en bas, sous la
// consigne écrite et lue dans un panneau sur fond uni. Le Phare d'abord : la galerie et sa rambarde, la gardienne en
// quatre volumes (son ciré, sa tête, son bonnet, son bras tendu vers la rambarde) et la corde de sonnerie, les cloches
// pendues devant la rambarde ; à la réussite, la lampe s'allume. Les Quais ensuite (lot 3) : le docker au pied de la
// grue, un bras posé sur une caisse, son crochet de levage à la main, les caisses-réponses sur un ponton du bassin ; la
// bonne caisse monte au crochet de la grue. Rien à lire n'est peint dans la 3D. Le décor de près est fait à l'arrivée et
// libéré au départ par la vue. Code pur : la vue dessine.
import { CAMERA_FOV, type CameraPose } from './camera';
import { FacetBuilder, type Facets } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { DECK_HEIGHT, placeById, type PlaceId } from './plan6e';
import { ANSWER_LAYOUT, QUAY, liftingHook, loadedBoat, sceneSpot, type AnswerSlot, type QuestionLayout, type ScreenBox } from './questionScene';
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

const SCENETTES: Partial<Record<PlaceId, Scenette>> = {
  // « du phare » : on ne la confond pas avec le Gardien de l'île (consultant Archipéo).
  phare: { role: 'La gardienne du phare', greeting: null, placement: 'rangee' },
  // Le rôle seul, sans prénom ni réplique (choix du mainteneur du 15 octobre 2026).
  quais: { role: 'Le docker', greeting: null, placement: 'rangee' },
};

/** La scénette d'un lieu, ou `null` s'il n'en a pas encore (la question s'y pose comme au lot 4). */
export const scenetteOf = (place: PlaceId): Scenette | null => SCENETTES[place] ?? null;

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
   * « Valider » en bas à droite : la place gardée, en pixels (le bouton peut être plus large en grand texte), et
   * l'écart au-dessus de lui, plus large que celui des réponses (retour UX UI).
   */
  validate: { width: 176, height: 60, gap: 20 },
  /** Les cloches, d'un tiers plus petites que la place au-dessus de leur mot : la poutre descend sous Kéo et l'habitant. */
  objectShare: 2 / 3,
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
}

/** Une rangée de `n` réponses entre `left` et `right`, l'étiquette en bas (`bottom`), l'objet au-dessus jusqu'à `top`. */
function rowSlots(n: number, left: number, right: number, top: number, bottom: number, lh: number, share: number): { slots: AnswerSlot[]; objectHeight: number } {
  const L = ANSWER_LAYOUT;
  const w = Math.max(48, Math.min(L.maxWidth, (right - left - (n - 1) * L.gap) / n));
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

/**
 * La place d'une scénette sur un écran de `width` × `height` pixels : `questionLayout` pour la colonne d'un écran bas
 * (ses crans), puis la scène et la rangée de la disposition A ou B. `scenette.stage` : là où Kéo et l'habitant se
 * tiennent ; `scenette.validate` : la place de « Valider » en bas à droite (A), `null` sur un écran bas (il reste dans
 * la colonne). L'ordre des réponses ne change jamais.
 */
export function scenetteLayout(needs: ScenetteNeeds, width: number, height: number, base: QuestionLayout): QuestionLayout {
  const S = SCENETTE_LAYOUT;
  const L = ANSWER_LAYOUT;
  const n = Math.max(1, needs.count);
  const share = needs.small ? S.objectShare : 1;
  if (base.low || needs.column) {
    // B : la scène à droite de la colonne ; la rangée à droite aussi si les mots y tiennent, sinon sur toute la largeur
    // (comme au lot 4), la colonne s'arrêtant alors au-dessus d'elle.
    const lh = base.low ? L.labelLow : L.label;
    const edge = base.low ? L.edgeLow : L.edge;
    const right = width - edge;
    const sideLeft = Math.max(S.low.left * width, base.panel.left + base.panel.width + edge);
    const beside = (right - sideLeft - (n - 1) * L.gap) / n >= (needs.words ? L.minLabelBells : L.minLabel);
    const rowLeft = beside ? sideLeft : edge;
    const { slots, objectHeight } = rowSlots(n, rowLeft, right, S.low.rowTop * height, S.low.rowBottom * height, lh, share);
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

/** Le sol des Quais : le milieu de la bande de devant du quai, contre le bord du bassin. */
function quayFloor(): Vec3 {
  const o = sceneSpot('quais');
  return { x: o.x, y: o.y, z: o.z + QUAY.depth / 2 - QUAY.strip / 2 };
}

const SITES: Partial<Record<PlaceId, ScenetteSite>> = {
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
};

const siteOf = (place: PlaceId): ScenetteSite => SITES[place] ?? SITES.phare!;

/** L'angle de la caméra de la scénette du Phare sous l'horizon, et le temps de la descente (coupe franche avec « Réduire les animations »). */
export const SCENETTE_CAMERA = { pitch: (20 * Math.PI) / 180, seconds: 0.9 } as const;

/** Le sol d'une scénette, dans le monde. */
const floorOf = (place: PlaceId): Vec3 => siteOf(place).floor();

/** La place de Kéo dans la scénette : ses pieds, son échelle et son cap. */
export function scenetteKeo(place: PlaceId): { at: Vec3; scale: number; yaw: number } {
  const f = floorOf(place);
  const k = siteOf(place).keo;
  return { at: { x: f.x + k.dx, y: f.y, z: f.z + k.dz }, scale: k.scale, yaw: k.yaw };
}

/** Où se tient l'habitant de la scénette (ses pieds). */
export function scenetteHabitant(place: PlaceId): Vec3 {
  const f = floorOf(place);
  const h = siteOf(place).habitant;
  return { x: f.x + h.dx, y: f.y, z: f.z + h.dz };
}

/**
 * Où Kéo reste en quittant la scénette d'un lieu, et ce que la caméra garde alors dans le champ (retour du directeur
 * artistique, lot 3) : aux Quais, sur le bord du quai, juste à l'est de la proue de la barque chargée, qu'on voit au
 * premier plan avec la grue et le hangar derrière lui. Ailleurs, rien : Kéo revient sur le chemin, la caméra le suit.
 */
export function scenetteExit(place: PlaceId): { at: Vec2; keep: Vec3 } | null {
  if (place !== 'quais') return null;
  const boat = loadedBoat();
  const f = quayFloor();
  return { at: { x: boat.at.x + boat.length / 2 + 0.9, z: f.z }, keep: { x: boat.at.x, y: boat.at.y, z: boat.at.z } };
}

/**
 * La caméra du retour d'une scénette : toujours tournée vers le nord, reculée au-dessus du bassin (`back` unités au sud
 * de ce qu'elle garde, `height` au-dessus des pieds de Kéo), entre Kéo et la barque en largeur, elle regarde un point
 * `aim` unités au-dessus des pieds de Kéo : la barque au premier plan, au-dessus de « Y aller », la grue derrière lui.
 * Le passage vers la caméra qui suit dure `down` secondes quand Kéo repart (d'un bloc avec « Réduire les animations »).
 */
export const EXIT_VIEW = { back: 11, height: 9, aim: 1.6, down: 0.5 } as const;

/**
 * Pose `pose` (la caméra qui suit, remplie sur place) vers la caméra du retour d'une scénette, de la part `amount` (0 :
 * la caméra qui suit, 1 : le retour) : Kéo, aux pieds `feet`, et `keep` (la barque) ensemble dans le champ.
 */
export function exitView(pose: CameraPose, keep: Vec3, feet: Vec3, amount: number): void {
  if (amount <= 0) return;
  const u = Math.min(1, amount);
  const k = u * u * (3 - 2 * u);
  const mx = (feet.x + keep.x) / 2;
  const p = pose.position;
  const t = pose.target;
  p.x += (mx - p.x) * k;
  p.y += (feet.y + EXIT_VIEW.height - p.y) * k;
  p.z += (keep.z + EXIT_VIEW.back - p.z) * k;
  t.x += (mx - t.x) * k;
  t.y += (feet.y + EXIT_VIEW.aim - t.y) * k;
  t.z += (feet.z - t.z) * k;
}

/**
 * La pose de la caméra de la scénette : Kéo et l'habitant au milieu de la scène (`layout.scenette.stage`), vus du sud,
 * un peu d'en haut ; le décalage de l'image (en pixels) qui les y amène sans tourner la caméra. Fixe tant que la
 * scénette dure.
 */
export function scenettePose(place: PlaceId, stage: ScreenBox, width: number, height: number): { pose: CameraPose; shift: { x: number; y: number } } {
  const site = siteOf(place);
  const S = site.subject;
  const f = floorOf(place);
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
 * voit pas deux. Au Phare, non : la tour porte la galerie.
 */
export const scenetteHidesPlace = (place: PlaceId): boolean => place === 'quais';

/** Les objets des réponses pendent-ils (les cloches du Phare), ou sont-ils posés sur un ponton (les caisses des Quais) ? */
export const answersHang = (place: PlaceId): boolean => place === 'phare';

/** La hauteur du ponton des réponses d'une scénette, quand elles sont posées : celle des pontons du monde. */
export const SCENETTE_DECK = DECK_HEIGHT;

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
  // Le docker (consultant Archipéo, fiche du lot 2) : gilet vert lagon, tête sable, casquette jaune lanterne.
  vest: 0x178078,
  vestShade: 0x12695f,
  dockCap: 0xffd866,
  steel: 0x6f8089,
  crate: 0xb5793f,
  crateTop: 0xc98d50,
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
export function habitantHand(place: PlaceId): Vec3 {
  const at = scenetteHabitant(place);
  return { x: at.x - 0.15, y: at.y + 0.78, z: at.z + 0.75 };
}

/**
 * La gardienne, immobile, en quatre volumes (consultant Archipéo) : le ciré (un cylindre évasé), la tête (une sphère),
 * le bonnet, le bras tendu vers la rambarde. La corde qu'elle tient part de sa main (`answerObjects`, avec les cloches) ;
 * sa poignée, de la couleur du bonnet, la détache du jaune du ciré (retour du directeur artistique).
 */
function gardienne(b: FacetBuilder, place: PlaceId): void {
  const at = scenetteHabitant(place);
  b.prism(at, 0.4, 0.27, 0.92, 12, C.coat, C.coatShade);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 12, 8, C.head);
  b.prism({ x: at.x, y: at.y + 1.2, z: at.z }, 0.25, 0.12, 0.2, 12, C.cap);
  const hand = habitantHand(place);
  b.beam({ x: at.x - 0.12, y: at.y + 0.82, z: at.z + 0.12 }, hand, 0.15, C.coat);
  b.box({ x: hand.x, y: hand.y - 0.1, z: hand.z }, [0.16, 0.2, 0.16], C.cap);
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
 * Le décor de près d'une scénette, fait à l'arrivée : au Phare, la galerie élargie (son plancher sur un encorbellement)
 * et sa rambarde (poteaux, main courante, lisse), et la gardienne ; aux Quais, le docker (le quai, la grue et la barque
 * sont la scène de l'item). Un seul maillage, du matériau du terrain.
 */
export function scenetteDecor(place: PlaceId): Facets {
  const b = new FacetBuilder();
  if (place === 'quais') {
    docker(b, place);
    return b.build();
  }
  if (place !== 'phare') return b.build();
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
  gardienne(b, place);
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
 * Ce qui s'allume à la réussite d'une scénette : la lampe du Phare (sa vitre), ou rien (aux Quais, la bonne caisse est
 * déjà montée au crochet à chaque item).
 */
export function scenetteSuccess(place: PlaceId): Facets | null {
  return place === 'phare' ? lanternGlass(place) : null;
}
