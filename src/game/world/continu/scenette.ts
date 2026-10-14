// La scénette d'un lieu (piste 1, lot 2, choix du mainteneur du 14 octobre 2026) : à l'arrivée, la caméra descend dans
// le lieu, Kéo se tient à gauche, l'habitant à droite, immobile, et les objets-réponses sont en rangée en bas, sous la
// consigne écrite et lue dans un panneau sur fond uni. Le Phare d'abord : la galerie et sa rambarde, la gardienne en
// quatre volumes (son ciré, sa tête, son bonnet, son bras tendu vers la rambarde) et la corde de sonnerie, les cloches
// pendues devant la rambarde ; à la réussite, la lampe s'allume. Rien à lire n'est peint dans la 3D. Le décor de près
// est fait à l'arrivée et libéré au départ par la vue. Code pur : la vue dessine.
import { CAMERA_FOV, type CameraPose } from './camera';
import { FacetBuilder, type Facets } from './facets';
import type { Vec3 } from './geometry';
import { placeById, type PlaceId } from './plan6e';
import { ANSWER_LAYOUT, type AnswerSlot, type QuestionLayout, type ScreenBox } from './questionScene';
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
  phare: { role: 'La gardienne', greeting: null, placement: 'rangee' },
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
  stage: { top: 0.28, bottom: 0.64 },
  row: { top: 0.66, bottom: 0.9 },
  low: { left: 0.4, top: 0.16, bottom: 0.62, rowTop: 0.64, rowBottom: 0.88 },
  /** « Valider » en bas à droite : la place gardée, en pixels (le bouton peut être plus large en grand texte). */
  validate: { width: 176, height: 56 },
} as const;

/** Ce que demande une scénette : combien de réponses, et sur un écran bas, le cran de la colonne (`questionLayout`). */
export interface ScenetteNeeds {
  count: number;
  widen?: number;
}

/** Une rangée de `n` réponses entre `left` et `right`, l'étiquette en bas (`bottom`), l'objet au-dessus jusqu'à `top`. */
function rowSlots(n: number, left: number, right: number, top: number, bottom: number, lh: number): { slots: AnswerSlot[]; objectHeight: number } {
  const L = ANSWER_LAYOUT;
  const w = Math.max(48, Math.min(L.maxWidth, (right - left - (n - 1) * L.gap) / n));
  const objectHeight = Math.max(lh, Math.min(L.objectShare * (w + L.gap), bottom - lh - L.lift - top));
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
  if (base.low) {
    // B : la scène à droite de la colonne ; la rangée à droite aussi si les mots y tiennent, sinon sur toute la largeur
    // (comme au lot 4), la colonne s'arrêtant alors au-dessus d'elle.
    const lh = L.labelLow;
    const right = width - L.edgeLow;
    const sideLeft = Math.max(S.low.left * width, base.panel.left + base.panel.width + L.edgeLow);
    const beside = (right - sideLeft - (n - 1) * L.gap) / n >= L.minLabelBells;
    const rowLeft = beside ? sideLeft : L.edgeLow;
    const { slots, objectHeight } = rowSlots(n, rowLeft, right, S.low.rowTop * height, S.low.rowBottom * height, lh);
    const highest = Math.min(...slots.map((s) => s.hit.top));
    const panelBottom = beside ? height - L.edgeLow : highest - L.edgeLow;
    const stage = { left: sideLeft, top: S.low.top * height, right, bottom: Math.min(S.low.bottom * height, highest - L.edgeLow) };
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
  const above = Math.min(S.row.bottom * height, validate.top - L.gap);
  const roomy = above - S.row.top * height >= 2 * lh + L.lift;
  const rowBottom = roomy ? above : S.row.bottom * height;
  // La rangée prend toute la largeur, à 12 px des bords : les mots des cloches, leur image devant, y tiennent.
  const rowRight = roomy ? width - L.edge : validate.left - L.gap;
  const { slots, objectHeight } = rowSlots(n, L.edge, rowRight, S.row.top * height, rowBottom, lh);
  const top = S.edge * height;
  const panelWidth = Math.max(0, Math.min(S.panelRight * width, width - S.topRight) - edge);
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

/** Où se tiennent Kéo et l'habitant, depuis le centre du lieu (au sud, vers la caméra), et la taille de Kéo. */
const SCENETTE_SPOTS = {
  keo: { dx: -1.45, dz: 2.3, scale: 0.6, yaw: Math.PI - 0.35 },
  habitant: { dx: 1.45, dz: 2.3 },
} as const;

/** L'angle de la caméra de la scénette sous l'horizon, et le temps de sa descente (coupe franche avec « Réduire les animations »). */
export const SCENETTE_CAMERA = { pitch: (20 * Math.PI) / 180, seconds: 0.9 } as const;

/** Le plancher de la galerie d'un lieu, dans le monde. */
function floorOf(place: PlaceId): Vec3 {
  const p = placeById(place);
  return { x: p.center.x, y: standingHeight(heightAt(p.center)) + GALLERY.floor, z: p.center.z };
}

/** La place de Kéo dans la scénette : ses pieds, son échelle et son cap. */
export function scenetteKeo(place: PlaceId): { at: Vec3; scale: number; yaw: number } {
  const f = floorOf(place);
  const k = SCENETTE_SPOTS.keo;
  return { at: { x: f.x + k.dx, y: f.y, z: f.z + k.dz }, scale: k.scale, yaw: k.yaw };
}

/** Ce que la caméra cadre dans la scène : de Kéo à l'habitant, du plancher au toit de la lanterne, en unités. */
const SUBJECT = { halfWidth: 2.2, bottom: -0.1, top: 2.3, depth: 2 } as const;

/**
 * La pose de la caméra de la scénette : Kéo et l'habitant au milieu de la scène (`layout.scenette.stage`), vus du sud,
 * un peu d'en haut ; le décalage de l'image (en pixels) qui les y amène sans tourner la caméra. Fixe tant que la
 * scénette dure.
 */
export function scenettePose(place: PlaceId, stage: ScreenBox, width: number, height: number): { pose: CameraPose; shift: { x: number; y: number } } {
  const f = floorOf(place);
  const focal = height / 2 / Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180);
  const halfW = Math.max(24, (stage.right - stage.left) / 2);
  const halfH = Math.max(24, (stage.bottom - stage.top) / 2);
  const dist = Math.max((SUBJECT.halfWidth * focal) / halfW, ((SUBJECT.top - SUBJECT.bottom) / 2) * (focal / halfH)) * 1.05;
  const target = { x: f.x, y: f.y + (SUBJECT.top + SUBJECT.bottom) / 2, z: f.z + SUBJECT.depth };
  const p = SCENETTE_CAMERA.pitch;
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
  lamp: 0xffd36b,
} as const;

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
  const f = floorOf(place);
  const h = SCENETTE_SPOTS.habitant;
  return { x: f.x + h.dx - 0.15, y: f.y + 0.78, z: f.z + h.dz + 0.75 };
}

/**
 * La gardienne, immobile, en quatre volumes (consultant Archipéo) : le ciré (un cylindre évasé), la tête (une sphère),
 * le bonnet, le bras tendu vers la rambarde. La corde qu'elle tient part de sa main (`answerObjects`, avec les cloches).
 */
function gardienne(b: FacetBuilder, place: PlaceId): void {
  const f = floorOf(place);
  const h = SCENETTE_SPOTS.habitant;
  const at = { x: f.x + h.dx, y: f.y, z: f.z + h.dz };
  b.prism(at, 0.4, 0.27, 0.92, 12, C.coat, C.coatShade);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 12, 8, C.head);
  b.prism({ x: at.x, y: at.y + 1.2, z: at.z }, 0.25, 0.12, 0.2, 12, C.cap);
  b.beam({ x: at.x - 0.12, y: at.y + 0.82, z: at.z + 0.12 }, habitantHand(place), 0.15, C.coat);
}

/**
 * Le décor de près d'une scénette, fait à l'arrivée : au Phare, la galerie élargie (son plancher sur un encorbellement)
 * et sa rambarde (poteaux, main courante, lisse), et la gardienne. Un seul maillage, du matériau du terrain.
 */
export function scenetteDecor(place: PlaceId): Facets {
  const b = new FacetBuilder();
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

/** La lanterne allumée de la réussite : la vitre de la lanterne, un peu plus large, à la couleur de la lampe. */
export function litLantern(place: PlaceId): Facets {
  const b = new FacetBuilder();
  const f = floorOf(place);
  b.prism({ x: f.x, y: f.y - 0.45, z: f.z }, 1.09, 1.09, 1.52, 8, C.lamp);
  return b.build();
}
