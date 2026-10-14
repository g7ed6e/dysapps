// La scène d'une question dans un lieu (lot 4) : ce que le lieu montre de l'item (la pêche sur le filet, l'eau dans le
// sas ou sur l'échelle, les caisses en palettes de dix sur le quai), les objets qui portent les réponses (cloches,
// paniers, leviers, caisses à plaque) sur un ponton, le geste de la réaction, et les pièces durables du lieu remises en
// marche. Tout en volumes simples, en aplats ; rien à lire n'est peint : les mots, les nombres et les repères de
// l'échelle sont des panneaux de la page, accrochés aux points que donne ce fichier. Code pur : la vue dessine.
import { boundsOf, FacetBuilder, type Facets } from './facets';
import { CAMERA_FOV, CAMERA_PITCH, type CameraPose } from './camera';
import type { Vec2, Vec3 } from './geometry';
import { placeById, type PlaceId } from './plan6e';
import type { ItemScene } from './questions';
import { heightAt, standingHeight } from './terrain';

const C = {
  deck: 0xa9784a,
  /** Le dessus du quai, plus clair : les caisses s'y détachent. */
  quay: 0xd2ab78,
  crane: 0xd9a441,
  rope: 0x5a4632,
  deckSide: 0x8a6440,
  net: 0x8e7b5a,
  netLine: 0x6f5e42,
  silver: 0xb9c4c8,
  fish: 0x5b8db0,
  fishTop: 0x9cc3da,
  fishTail: 0x46769a,
  fishEye: 0x2f3e46,
  silverTop: 0xd9e0e2,
  white: 0xf2eee4,
  grey: 0x9aa0a3,
  beak: 0xd9a441,
  paper: 0xc9cbc8,
  crab: 0x5f8f3a,
  crabTop: 0x76a64a,
  bucket: 0x6f8089,
  shrimp: 0xe58f7a,
  stone: 0xb9b2a3,
  stoneDark: 0x8f897d,
  water: 0x2f8fc8,
  waterTop: 0x5fb3e0,
  empty: 0xe4ddcf,
  level: 0xfff6dc,
  // Le bronze des cloches, éclairci vers la paille, et son reflet chaud (directeur artistique) : rien de presque noir.
  bronze: 0xc8963c,
  bronzeLight: 0xe8c27a,
  post: 0x7a5538,
  straw: 0xd9a441,
  strawDark: 0xb8862e,
  lever: 0x8a6440,
  knob: 0xc0503a,
  crate: 0xb5793f,
  crateTop: 0xc98d50,
  plate: 0xf2eee4,
  pallet: 0x8a6440,
  hull: 0x4f7fa3,
  hullTop: 0xa9784a,
  lamp: 0xffd36b,
  newRope: 0xc9a36a,
  newWood: 0xc28a52,
  paint: 0xd9a441,
} as const;

/** La hauteur où l'on se tient en un point (le sol, ou le dessus de la digue sur l'eau). */
const groundAt = (p: Vec2): number => standingHeight(heightAt(p));

/** Le centre de la scène d'un item, devant son lieu (au sud : vers la caméra), le rayon du cadrage de la question, et la demi-taille de sa plate-forme. */
const SCENE_SPOT: Record<PlaceId, { dx: number; dz: number; radius: number; half: [number, number] }> = {
  phare: { dx: 0, dz: 0.5, radius: 12, half: [0, 0] },
  filets: { dx: 0, dz: 5, radius: 4.2, half: [2.7, 1.6] },
  ecluses: { dx: -0.5, dz: 5, radius: 3.6, half: [2.3, 0.9] },
  quais: { dx: 0.5, dz: 8.5, radius: 7.6, half: [5.8, 3.3] },
};

/**
 * Le point de la scène d'un item dans un lieu : au sol, au plus haut de sa plate-forme (elle ne s'enfonce jamais dans
 * une pente ; elle descend jusqu'au sol sous elle, `PLATFORM_DEPTH`).
 */
export function sceneSpot(place: PlaceId): Vec3 {
  const p = placeById(place);
  const s = SCENE_SPOT[place];
  const at = { x: p.center.x + s.dx, z: p.center.z + s.dz };
  let y = groundAt(at);
  for (const fx of [-1, 0, 1]) for (const fz of [-1, 0, 1]) y = Math.max(y, groundAt({ x: at.x + fx * s.half[0], z: at.z + fz * s.half[1] }));
  return { x: at.x, y, z: at.z };
}

/** La profondeur de la plate-forme d'une scène, sous le point de la scène : assez pour toucher le sol d'une pente. */
const PLATFORM_DEPTH = 1.5;

/** Des facettes agrandies de `k` depuis leur origine, puis posées en `at`. */
function placed(f: Facets, k: number, at: Vec3 = { x: 0, y: 0, z: 0 }): Facets {
  const positions = new Float32Array(f.positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = f.positions[i] * k + at.x;
    positions[i + 1] = f.positions[i + 1] * k + at.y;
    positions[i + 2] = f.positions[i + 2] * k + at.z;
  }
  return { ...f, positions };
}

/** L'agrandissement qui fait tenir la pêche dans un panier de l'échelle `scale` (sans dépasser sa taille dans le filet). */
function basketFit(f: Facets, scale: number): number {
  const { min, max } = boundsOf(f);
  const width = Math.max(max[0] - min[0], max[2] - min[2], 1e-3);
  return Math.min(CATCH_SCALE, (1.1 * scale) / width);
}

/** La taille de la pêche : à la mesure du filet, lisible de loin. */
const CATCH_SCALE = 1.6;

// ---------- La place de la question à l'écran ----------

/** Ce que la page garde autour de la question, en pixels. */
export const ANSWER_LAYOUT = {
  /** La hauteur d'une étiquette de réponse (48 px au moins), sur tablette et sur un écran bas. */
  label: 56,
  labelLow: 48,
  edge: 12,
  edgeLow: 8,
  gap: 12,
  maxWidth: 200,
  /** La largeur d'une étiquette en dessous de laquelle la rangée prend toute la largeur (les mots des cloches). */
  minLabel: 72,
  minLabelBells: 116,
  /** L'écart entre l'objet et son étiquette. */
  lift: 4,
  /** La hauteur d'un objet : au moins celle de son étiquette, au plus une part de l'écran. */
  objectShare: 0.6,
  objectMax: 0.15,
  /** Les cloches, plus petites : un carillon au pied de la tour, qui la laisse se dresser au-dessus. */
  bellMax: 0.09,
  /** Au Phare, sur tablette, la fenêtre de la scène commence plus bas, pour que la tour se pose juste au-dessus du carillon. */
  towerDrop: 0.3,
  /** La colonne, à gauche : sa part de la largeur. */
  panelMax: 400,
  panelShare: 0.38,
  /** Sur tablette, une colonne plus large quand l'item a sa règle (la carte de l'accord tient en moins de lignes). */
  panelAidMax: 480,
  panelAidShare: 0.46,
  /** La barre du haut : « Vue simple » et la pause (56 px de haut). */
  bar: 56,
  /** En dessous de cette hauteur d'écran, un téléphone couché : la rangée des réponses en bas. */
  low: 500,
} as const;

/** Un rectangle de l'écran, en pixels depuis le coin haut gauche. */
export interface ScreenBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** La place d'une réponse : son étiquette, le pied de son objet, et la cible de toucher qui couvre les deux. */
export interface AnswerSlot {
  label: ScreenBox;
  foot: { x: number; y: number };
  hit: ScreenBox;
}

/** La place de la question à l'écran. */
export interface QuestionLayout {
  /** Un écran bas (un téléphone couché) : la consigne en icône, les réponses en bas, la règle à droite. */
  low: boolean;
  slots: AnswerSlot[];
  /** La hauteur d'un objet à l'écran (au moins celle de son étiquette). */
  objectHeight: number;
  /** La colonne de la phrase, de la ligne de calcul, d'une action et du résultat (fond uni), à gauche. */
  panel: { left: number; top: number; width: number; maxHeight: number };
  /** La règle affichée, hors de la colonne sur un écran bas ; `null` : dans la colonne. */
  aid: ScreenBox | null;
  /** Là où la scène de l'item se montre. */
  view: ScreenBox;
}

/** Ce que demande une question : combien de réponses, des mots longs (les cloches), une règle, la scène au milieu. */
export interface QuestionNeeds {
  count: number;
  bells?: boolean;
  aid?: boolean;
  /**
   * La scène se cadre au milieu de l'écran, objets compris (le Phare : les cloches en carillon au pied de la tour, dans
   * son axe, leur mot dessous, jamais en travers de la tour).
   */
  centered?: boolean;
  /** Sur un écran bas, la colonne élargie d'un cran ou deux quand la phrase n'y tient pas (`PANEL_LOW_SHARES`). */
  widen?: number;
}

/** La part de la largeur que prend la colonne sur un écran bas : 38 %, puis plus large si la phrase n'y tient pas. */
const PANEL_LOW_SHARES = [0.38, 0.46, 0.54] as const;
/**
 * Au-delà de 54 % (un très grand texte), la phrase passe seule en pleine largeur, sur un panneau sous la barre du haut
 * et au-dessus des objets (`WIDEN_FULL`) ; si elle n'y tient toujours pas, l'écran propose « Vue simple » d'emblée
 * (`WIDEN_OFFER`, même place).
 */
export const WIDEN_FULL = PANEL_LOW_SHARES.length;
export const WIDEN_OFFER = WIDEN_FULL + 1;

/**
 * La place d'une question sur un écran de `width` × `height` pixels.
 * Sur tablette, la colonne à gauche, et les réponses dans le tiers du milieu, chaque étiquette posée au-dessus de son
 * objet, à droite de la colonne si elles y tiennent, sinon sur toute la largeur sous la colonne.
 * Sur un écran bas, la colonne étroite à gauche (38 %), les réponses en rangée en bas, les objets juste au-dessus
 * (jamais derrière les étiquettes), la règle à droite. Rien ne défile.
 */
export function questionLayout(needs: QuestionNeeds, width: number, height: number): QuestionLayout {
  const L = ANSWER_LAYOUT;
  const low = height < L.low;
  const n = Math.max(1, needs.count);
  const edge = low ? L.edgeLow : L.edge;
  const lh = low ? L.labelLow : L.label;
  const top = edge + L.bar + edge;
  const full = low && (needs.widen ?? 0) >= WIDEN_FULL;
  const lowShare = PANEL_LOW_SHARES[Math.max(0, Math.min(PANEL_LOW_SHARES.length - 1, needs.widen ?? 0))];
  const panelW = low ? lowShare * width : needs.aid ? Math.min(L.panelAidMax, L.panelAidShare * width) : Math.min(L.panelMax, L.panelShare * width);
  const panelRight = edge + panelW;
  const minLabel = needs.bells ? L.minLabelBells : L.minLabel;
  const slotWidth = (left: number, right: number) => Math.min(L.maxWidth, (right - left - (n - 1) * L.gap) / n);
  // Sur tablette, la rangée tient-elle à droite de la colonne ? Sur un écran bas, elle prend toujours toute la largeur.
  const beside = !low && slotWidth(panelRight + edge, width - edge) >= minLabel;
  const rowLeft = beside ? panelRight + edge : edge;
  const rowRight = width - edge;
  const w = Math.max(48, slotWidth(rowLeft, rowRight));
  const objectHeight = Math.max(lh, Math.min(L.objectShare * (w + L.gap), (needs.bells ? L.bellMax : L.objectMax) * height));
  const total = n * w + (n - 1) * L.gap;
  const first = (rowLeft + rowRight - total) / 2;
  const slots: AnswerSlot[] = [];
  for (let i = 0; i < n; i++) {
    const left = first + i * (w + L.gap);
    const x = left + w / 2;
    if (low) {
      const label = { left, right: left + w, top: height - edge - lh, bottom: height - edge };
      const foot = { x, y: label.top - L.lift };
      slots.push({ label, foot, hit: { left, right: left + w, top: foot.y - objectHeight, bottom: label.bottom } });
    } else if (needs.centered) {
      // Le carillon : la cloche dans le tiers du milieu, son mot dessous.
      const foot = { x, y: Math.round((2 * height) / 3) };
      const label = { left, right: left + w, top: foot.y + L.lift, bottom: foot.y + L.lift + lh };
      slots.push({ label, foot, hit: { left, right: left + w, top: foot.y - objectHeight, bottom: label.bottom } });
    } else {
      // L'objet dans le tiers du milieu, son étiquette au-dessus.
      const foot = { x, y: Math.round((2 * height) / 3) };
      const label = { left, right: left + w, bottom: foot.y - objectHeight - L.lift, top: foot.y - objectHeight - L.lift - lh };
      slots.push({ label, foot, hit: { left, right: left + w, top: label.top, bottom: foot.y } });
    }
  }
  const highest = Math.min(...slots.map((s) => s.hit.top));
  const panel = full
    ? { left: edge, top, width: width - 2 * edge, maxHeight: Math.max(0, highest - edge - top) }
    : {
        left: edge,
        top: edge,
        width: panelW,
        maxHeight: Math.max(0, (low || !beside ? highest - edge : height - edge) - edge),
      };
  const viewBottom = highest - edge;
  const viewLeft = needs.centered ? edge : panelRight + edge;
  // Le Phare : la fenêtre descend jusqu'au pied des cloches, pour que la tour se dresse au-dessus du carillon.
  const sceneBottom = needs.centered ? Math.max(...slots.map((s) => s.foot.y)) : viewBottom;
  const sceneTop = needs.centered && !low ? top + L.towerDrop * (sceneBottom - top) : top;
  const aid = low && needs.aid && !full ? { left: panelRight + edge, top, right: width - edge, bottom: viewBottom } : null;
  return { low, slots, objectHeight, panel, aid, view: { left: viewLeft, top: sceneTop, right: width - edge, bottom: Math.max(sceneTop + 48, sceneBottom) } };
}

/**
 * La pose de la caméra pendant une question : la scène de l'item au milieu de la fenêtre `view` et assez loin pour que
 * son rayon y tienne, et le décalage de l'image (en pixels) qui l'y amène sans tourner la caméra. Fixe tant que la
 * question dure.
 */
export function questionPose(place: PlaceId, view: ScreenBox, width: number, height: number): { pose: CameraPose; shift: { x: number; y: number } } {
  const s = sceneSpot(place);
  const radius = SCENE_SPOT[place].radius;
  const focal = height / 2 / Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180);
  const half = Math.max(24, Math.min(view.right - view.left, view.bottom - view.top) / 2);
  const dist = (radius * focal) / half;
  const target = { x: s.x, y: s.y, z: s.z };
  const pose: CameraPose = {
    target,
    position: {
      x: target.x,
      y: target.y + dist * Math.sin(CAMERA_PITCH),
      z: target.z + dist * Math.cos(CAMERA_PITCH),
    },
    fov: CAMERA_FOV,
    lens: 0,
  };
  return {
    pose,
    shift: {
      x: width / 2 - (view.left + view.right) / 2,
      y: height / 2 - (view.top + view.bottom) / 2,
    },
  };
}

// ---------- Les objets des réponses ----------

/** L'objet qui porte une réponse dans chaque lieu. */
const ANSWER_OBJECT: Record<PlaceId, 'cloche' | 'panier' | 'levier' | 'caisse'> = {
  phare: 'cloche',
  filets: 'panier',
  ecluses: 'levier',
  quais: 'caisse',
};

/** La hauteur et la demi-largeur de chaque objet, à l'échelle 1. */
const OBJECT_SIZE: Record<(typeof ANSWER_OBJECT)[PlaceId], { height: number; half: number }> = {
  cloche: { height: 1.55, half: 0.55 },
  panier: { height: 0.9, half: 0.5 },
  levier: { height: 1.8, half: 0.32 },
  caisse: { height: 1.4, half: 0.42 },
};

/** L'écart entre deux objets voisins, au sol (deux unités s'il n'y en a qu'un). */
const stepOf = (points: readonly Vec3[]): number => (points.length > 1 ? Math.hypot(points[1].x - points[0].x, points[1].z - points[0].z) : 2);

/**
 * L'échelle des objets des réponses : leur hauteur `height` (en unités du monde, tirée de la hauteur à l'écran), sans
 * qu'un objet déborde sur la place de son voisin.
 */
export function answerScale(place: PlaceId, points: readonly Vec3[], height: number): number {
  const size = OBJECT_SIZE[ANSWER_OBJECT[place]];
  return Math.max(0.05, Math.min(height / size.height, (0.45 * stepOf(points)) / size.half));
}

/** Une cloche sur son portique, à l'échelle `s`, sa couleur donnée (le bronze, ou la lumière de la réaction). */
function bell(b: FacetBuilder, p: Vec3, s: number, color: number, side: number, grow = 1): void {
  b.prism({ x: p.x, y: p.y + 0.65 * s - 0.04 * s * (grow - 1), z: p.z }, 0.36 * s * grow, 0.14 * s * grow, 0.68 * s * grow, 8, color, side);
}

/**
 * Les objets des réponses, posés sur un ponton aux points donnés (au sol, dans l'ordre des choix ; la vue les tire de
 * l'écran), à l'échelle `answerScale`, pour que chacun tienne au-dessus de son bouton.
 */
export function answerObjects(place: PlaceId, points: readonly Vec3[], s: number): Facets {
  const b = new FacetBuilder();
  if (points.length === 0) return b.build();
  const xs = points.map((p) => p.x);
  const y = points[0].y;
  const z = points.reduce((t, p) => t + p.z, 0) / points.length;
  // Le ponton sous la rangée : jamais un objet posé sur l'eau.
  b.box(
    { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: y - 0.12 * s, z },
    [Math.max(...xs) - Math.min(...xs) + 1.4 * s, 0.12 * s, 0.8 * s],
    C.deckSide,
    C.deck,
  );
  const kind = ANSWER_OBJECT[place];
  for (const p of points) {
    if (kind === 'cloche') {
      for (const dx of [-0.45, 0.45]) b.box({ x: p.x + dx * s, y, z: p.z }, [0.1 * s, 1.5 * s, 0.1 * s], C.post);
      b.box({ x: p.x, y: y + 1.45 * s, z: p.z }, [1.05 * s, 0.12 * s, 0.14 * s], C.post);
      bell(b, p, s, C.bronze, C.bronzeLight);
    } else if (kind === 'panier') {
      const w = 0.9 * s,
        d = 0.7 * s,
        h = 0.5 * s,
        t = 0.08 * s;
      b.box({ x: p.x, y, z: p.z }, [w, 0.06 * s, d], C.strawDark);
      b.box({ x: p.x, y, z: p.z + d / 2 }, [w, h, t], C.straw, C.strawDark);
      b.box({ x: p.x, y, z: p.z - d / 2 }, [w, h, t], C.straw, C.strawDark);
      b.box({ x: p.x - w / 2, y, z: p.z }, [t, h, d], C.straw, C.strawDark);
      b.box({ x: p.x + w / 2, y, z: p.z }, [t, h, d], C.straw, C.strawDark);
    } else if (kind === 'levier') {
      b.box({ x: p.x, y, z: p.z }, [0.6 * s, 0.35 * s, 0.5 * s], C.stoneDark, C.stone);
      // Un grand levier, penché vers le nord, et sa poignée.
      b.box({ x: p.x, y: y + 0.3 * s, z: p.z, pitch: -0.35 }, [0.12 * s, 1.5 * s, 0.12 * s], C.lever);
      b.box({ x: p.x, y: y + 0.3 * s + 1.41 * s, z: p.z - 0.51 * s }, [0.3 * s, 0.22 * s, 0.22 * s], C.knob);
    } else {
      b.box({ x: p.x, y, z: p.z }, [0.8 * s, 0.7 * s, 0.7 * s], C.crate, C.crateTop);
      // La plaque, à l'avant, sans rien d'écrit : le nombre est dans le panneau de la page.
      b.box({ x: p.x, y: y + 0.2 * s, z: p.z + 0.36 * s }, [0.56 * s, 0.32 * s, 0.03 * s], C.plate);
    }
  }
  return b.build();
}

// ---------- La scène d'un item ----------

/** Un panneau de la page accroché à un point de la scène (les repères 0, 1, 2 de l'échelle). */
interface SceneLabel {
  text: string;
  at: Vec3;
}

/**
 * Le geste de la réaction, une à deux secondes (`REACTION_SECONDS`) : un objet qui va de `from` à `to` en passant
 * `arc` unités plus haut, puis reste (`stay`) ou s'efface. Avec « Réduire les animations », il est tout de suite à `to`.
 */
export interface Reaction {
  facets: Facets;
  from: Vec3;
  to: Vec3;
  arc: number;
  stay: boolean;
}

/** La scène d'un item : ce qui reste en place, les panneaux, et la réaction (`null` : rien ne bouge). */
export interface ItemSceneFacets {
  still: Facets;
  labels: SceneLabel[];
  reaction: Reaction | null;
}

/** Un petit poisson (une sardine), couché, sa tête vers l'est. */
function fish(b: FacetBuilder, x: number, y: number, z: number, yaw = 0): void {
  // Un poisson qui se lit : un corps fuselé bleu argent (deux pavés), la queue en V, un œil et une nageoire.
  const c = Math.cos(yaw),
    sn = Math.sin(yaw);
  const along = (d: number) => ({ x: x + d * c, z: z - d * sn });
  b.box({ ...along(0), y, yaw }, [0.62, 0.22, 0.24], C.fish, C.fishTop);
  b.box({ ...along(0.36), y: y + 0.03, yaw }, [0.14, 0.16, 0.18], C.fish, C.fishTop);
  for (const side of [-1, 1]) b.box({ ...along(-0.4), y: y + 0.02 + side * 0.06, yaw: yaw + side * 0.6 }, [0.24, 0.07, 0.08], C.fishTail);
  b.box({ ...along(0.02), y: y + 0.22, yaw }, [0.22, 0.06, 0.04], C.fishTail);
  b.box({ ...along(0.3), y: y + 0.08, yaw }, [0.06, 0.06, 0.26], C.fishEye);
}

/** Les objets de la pêche, au point (x, y, z), en rangée : la phrase dit ce qu'on voit, et combien. */
function catchObjects(b: FacetBuilder, scene: Extract<ItemScene, { kind: 'filets' }>, x: number, y: number, z0: number, pile = false): void {
  const n = Math.max(1, scene.count);
  const pitch = scene.catch === 'pêche' ? 0 : 0.85;
  for (let i = 0; i < (scene.catch === 'pêche' ? 1 : n); i++) {
    // En rangée sur le filet ; en tas de deux de front dans le panier, pour rester lisible.
    const cx = pile ? x + (n > 1 ? ((i % 2) - 0.5) * 0.7 : 0) : x + (i - (n - 1) / 2) * pitch;
    const rows = Math.ceil(n / 2);
    const z = pile ? z0 + (Math.floor(i / 2) - (rows - 1) / 2) * 0.42 : z0;
    switch (scene.catch) {
      case 'sardines':
        fish(b, cx, y, z, 0.2 * (i % 2 ? 1 : -1));
        break;
      case 'filets':
        b.box({ x: cx, y, z }, [0.8, 0.3, 0.6], C.net, C.netLine);
        break;
      case 'mouette':
        // Une mouette posée : le corps blanc, la tête, le bec orangé, les ailes grises repliées en V, les pattes.
        b.box({ x: cx, y: y + 0.22, z }, [0.62, 0.3, 0.32], C.white);
        b.box({ x: cx + 0.34, y: y + 0.42, z }, [0.22, 0.22, 0.22], C.white);
        b.box({ x: cx + 0.52, y: y + 0.42, z }, [0.16, 0.07, 0.08], C.beak);
        for (const side of [-1, 1]) b.box({ x: cx - 0.05, y: y + 0.4, z: z + side * 0.16, yaw: side * 0.25 }, [0.5, 0.08, 0.14], C.grey);
        b.box({ x: cx - 0.36, y: y + 0.3, z }, [0.16, 0.1, 0.2], C.grey);
        for (const dz of [-0.08, 0.08]) b.box({ x: cx, y, z: z + dz }, [0.05, 0.22, 0.05], C.beak);
        break;
      case 'bocaux':
        // Un bocal gris, sans étiquette, et son couvercle.
        b.prism({ x: cx, y, z }, 0.24, 0.24, 0.5, 8, C.grey, C.silverTop);
        b.prism({ x: cx, y: y + 0.5, z }, 0.18, 0.18, 0.08, 8, C.stoneDark);
        break;
      case 'crabes':
      case 'crabe':
        // Un crabe : la carapace, deux pinces levées devant, trois pattes de chaque côté.
        b.box({ x: cx, y: y + 0.12, z }, [0.5, 0.18, 0.38], C.crab, C.crabTop);
        for (const side of [-1, 1]) {
          b.box({ x: cx + side * 0.22, y: y + 0.24, z: z + 0.3 }, [0.16, 0.14, 0.18], C.crab, C.crabTop);
          for (const dz of [-0.12, 0, 0.12]) b.box({ x: cx + side * 0.32, y: y + 0.04, z: z + dz }, [0.18, 0.06, 0.05], C.crab);
        }
        break;
      case 'seaux':
        b.prism({ x: cx, y, z }, 0.28, 0.34, 0.55, 8, C.bucket, C.shrimp);
        break;
      case 'pêche':
        for (let k = 0; k < 7; k++) fish(b, x + ((k % 4) - 1.5) * 0.55, y + 0.14 * Math.floor(k / 4), z + (k % 2) * 0.3 - 0.15, 0.3 * ((k % 3) - 1));
        break;
    }
  }
}

/** Les caisses d'un quai : en palettes de dix (deux rangées de cinq) et en caisses seules (rangées de cinq), une couche. */
export function crateLayout(count: number): {
  palettes: number;
  singles: number;
} {
  const c = Math.max(0, Math.min(99, Math.floor(count)));
  return { palettes: Math.floor(c / 10), singles: c % 10 };
}

const CRATE = 0.4;
const CRATE_PITCH = 0.48;

/** La place que prennent les caisses de `count` : largeur (x) et profondeur (z). */
function crateBlock(count: number): { w: number; d: number } {
  const { palettes, singles } = crateLayout(count);
  const pw = 5 * CRATE_PITCH + 0.3,
    pd = 2 * CRATE_PITCH + 0.3;
  const cols = Math.min(3, palettes);
  const w = cols * pw + (singles ? (palettes ? 0.2 : 0) + Math.min(5, singles) * CRATE_PITCH : 0);
  const d = Math.max(Math.ceil(palettes / 3) * pd, Math.ceil(singles / 5) * CRATE_PITCH);
  return { w: Math.max(w, CRATE_PITCH), d: Math.max(d, CRATE_PITCH) };
}

/** Les caisses de `count`, rangées depuis (x0, z0) : les palettes en grille de trois de front, les caisses seules à droite. */
function crates(b: FacetBuilder, count: number, x0: number, y: number, z0: number): void {
  const { palettes, singles } = crateLayout(count);
  const paletteW = 5 * CRATE_PITCH,
    paletteD = 2 * CRATE_PITCH;
  for (let p = 0; p < palettes; p++) {
    const px = x0 + (p % 3) * (paletteW + 0.3);
    const pz = z0 + Math.floor(p / 3) * (paletteD + 0.3);
    b.box({ x: px + paletteW / 2 - CRATE_PITCH / 2, y, z: pz + CRATE_PITCH / 2 }, [paletteW, 0.06, paletteD], C.pallet);
    for (let k = 0; k < 10; k++)
      b.box(
        {
          x: px + (k % 5) * CRATE_PITCH,
          y: y + 0.06,
          z: pz + Math.floor(k / 5) * CRATE_PITCH,
        },
        [CRATE, CRATE, CRATE],
        C.crate,
        C.crateTop,
      );
  }
  // Les caisses seules juste à droite des palettes posées.
  const sx = x0 + Math.min(3, palettes) * (paletteW + 0.3) + (palettes ? 0.2 : 0);
  for (let k = 0; k < singles; k++)
    b.box(
      {
        x: sx + (k % 5) * CRATE_PITCH,
        y,
        z: z0 + Math.floor(k / 5) * CRATE_PITCH,
      },
      [CRATE, CRATE, CRATE],
      C.crate,
      C.crateTop,
    );
}

/** Une barque, sa coque vers l'est. */
function boat(b: FacetBuilder, x: number, y: number, z: number, length = 2.4): void {
  b.box({ x, y: y - 0.1, z }, [length, 0.45, 0.9], C.hull, C.hullTop);
  b.box({ x: x + length / 2 + 0.15, y: y - 0.1, z }, [0.3, 0.35, 0.5], C.hull);
}

const ORIGIN: Vec3 = { x: 0, y: 0, z: 0 };

/**
 * La scène d'un item dans son lieu : `answered` donne l'état juste (après la réponse, juste ou corrigée), jamais l'état
 * faux ; `right` : les points des objets des bonnes réponses (la pêche va au panier, les bonnes cloches s'allument),
 * `scale` : l'échelle de ces objets (`answerScale`).
 */
export function itemScene(place: PlaceId, scene: ItemScene, answered: boolean, right: readonly Vec3[] = [], scale = 1): ItemSceneFacets {
  const b = new FacetBuilder();
  const o = sceneSpot(place);
  const labels: SceneLabel[] = [];
  let reaction: Reaction | null = null;
  const answerAt = right[0];
  if (scene.kind === 'cloches') {
    // Les bonnes cloches s'allument le temps de la réaction, puis redeviennent de bronze : rien ne reste.
    if (answered && right.length) {
      const r = new FacetBuilder();
      for (const p of right) bell(r, p, scale, C.lamp, C.lamp, 1.12);
      reaction = {
        facets: r.build(),
        from: ORIGIN,
        to: ORIGIN,
        arc: 0,
        stay: false,
      };
    }
    return { still: b.build(), labels, reaction };
  }
  // Une plate-forme sous la scène : elle ne flotte jamais.
  const platform = (w: number, d: number) => b.box({ x: o.x, y: o.y - PLATFORM_DEPTH, z: o.z }, [w, PLATFORM_DEPTH, d], C.deckSide, C.deck);
  if (scene.kind === 'filets') {
    platform(5.4, 3.2);
    // Le grand filet étendu, ses mailles en traits.
    b.box({ x: o.x, y: o.y, z: o.z }, [4.6, 0.03, 2.6], C.net);
    for (let k = -2; k <= 2; k++) b.box({ x: o.x + k * 0.9, y: o.y + 0.03, z: o.z }, [0.05, 0.01, 2.6], C.netLine);
    for (let k = -1; k <= 1; k++) b.box({ x: o.x, y: o.y + 0.03, z: o.z + k * 0.85 }, [4.6, 0.01, 0.05], C.netLine);
    const r = new FacetBuilder();
    catchObjects(r, scene, 0, 0, 0);
    const pecheFacets = placed(r.build(), CATCH_SCALE);
    const from = { x: o.x, y: o.y + 0.05, z: o.z };
    if (!answered) b.append(placed(pecheFacets, 1, from));
    else if (answerAt) {
      // La prise va au panier de la bonne réponse, en tas, assez grande pour se lire.
      const p = new FacetBuilder();
      catchObjects(p, scene, 0, 0, 0, true);
      const pile = p.build();
      reaction = {
        facets: placed(pile, basketFit(pile, scale)),
        from,
        to: { x: answerAt.x, y: answerAt.y + 0.25 * scale, z: answerAt.z },
        arc: 1.2,
        stay: true,
      };
    }
  } else if (scene.kind === 'sas') {
    platform(4.6, 1.6);
    const d = Math.max(1, scene.d),
      n = Math.max(0, Math.min(d, scene.n));
    const w = 3,
      h = 3.2,
      band = h / d,
      zf = o.z + 0.35;
    // La paroi du sas, de face : les bandes égales (des traits, sans chiffres), l'eau dans les `n` du bas.
    b.box({ x: o.x, y: o.y, z: o.z }, [w + 0.5, h + 0.3, 0.6], C.stoneDark, C.stone);
    for (let k = 0; k < d; k++) b.box({ x: o.x, y: o.y + 0.15 + k * band + 0.03, z: zf }, [w, band - 0.06, 0.05], k < n ? C.water : C.empty);
    // Le trait du niveau de l'eau, large et clair : le niveau se lit sans la couleur.
    b.box({ x: o.x, y: o.y + 0.15 + n * band - 0.06, z: zf + 0.04 }, [w + 0.8, 0.12, 0.06], C.level);
    if (answered) {
      const r = new FacetBuilder();
      boat(r, 0, 0, 0);
      reaction = {
        facets: r.build(),
        from: { x: o.x - 4.5, y: o.y, z: o.z + 1.6 },
        to: { x: o.x + 4.5, y: o.y, z: o.z + 1.6 },
        arc: 0,
        stay: true,
      };
    }
  } else if (scene.kind === 'echelle') {
    platform(4.6, 1.8);
    const d = Math.max(1, scene.d),
      n = Math.max(0, Math.min(2 * d, scene.n));
    const unit = 1.7,
      zf = o.z + 0.35,
      px = o.x + 0.9;
    // Le bassin et son eau, jusqu'au cran `n`.
    b.box({ x: o.x - 0.6, y: o.y, z: o.z }, [2.2, 2 * unit + 0.4, 0.6], C.stoneDark, C.stone);
    b.box({ x: o.x - 0.6, y: o.y + 0.1, z: zf }, [2, (n / d) * unit, 0.05], C.water);
    // Le poteau gradué, de 0 à 2 : un cran par part, un grand cran aux unités (leurs nombres sont des panneaux).
    b.box({ x: px, y: o.y, z: zf }, [0.22, 2 * unit + 0.3, 0.12], C.white);
    for (let k = 0; k <= 2 * d; k++) {
      const big = k % d === 0;
      b.box(
        {
          x: px - (big ? 0.35 : 0.22),
          y: o.y + 0.1 + (k / d) * unit - 0.03,
          z: zf + 0.07,
        },
        [big ? 0.7 : 0.44, 0.06, 0.04],
        C.stoneDark,
      );
      if (big)
        labels.push({
          text: String(k / d),
          at: { x: px + 0.55, y: o.y + 0.1 + (k / d) * unit, z: zf },
        });
    }
    b.box({ x: o.x - 0.2, y: o.y + 0.1 + (n / d) * unit - 0.06, z: zf + 0.09 }, [2.9, 0.12, 0.05], C.level);
    if (answered) {
      const r = new FacetBuilder();
      boat(r, 0, 0, 0);
      reaction = {
        facets: r.build(),
        from: { x: o.x - 4.5, y: o.y, z: o.z + 1.7 },
        to: { x: o.x + 4.5, y: o.y, z: o.z + 1.7 },
        arc: 0,
        stay: true,
      };
    }
  } else if (scene.kind === 'quai') {
    // Le quai à la taille des caisses ; devant lui, la barque amarrée, et la grue au coin du fond. Avant le
    // geste : la moitié, toutes les caisses sur le quai, la grue au-dessus, la barque vide ; le double, les caisses du
    // quai au fond, la barque chargée des nouvelles. Après : les caisses ont changé de place, et y restent.
    const moved = Math.abs(scene.after - scene.before);
    const kept = scene.op === 'moitie' ? scene.after : scene.before;
    const front = crateBlock(scene.op === 'moitie' ? scene.before : moved);
    const back = scene.op === 'moitie' ? { w: 0, d: 0 } : crateBlock(scene.before);
    const qw = Math.max(front.w, back.w, 3) + 1,
      qd = front.d + back.d + (back.d ? 0.4 : 0) + 1;
    b.box({ x: o.x, y: o.y - PLATFORM_DEPTH, z: o.z }, [qw, PLATFORM_DEPTH, qd], C.deckSide, C.quay);
    const x0 = o.x - qw / 2 + 0.5;
    const zBack = o.z - qd / 2 + 0.5;
    const zFront = zBack + back.d + (back.d ? 0.4 : 0);
    const boatLen = Math.max(3, crateBlock(moved).w + 1),
      boatW = Math.max(1.2, crateBlock(moved).d + 0.6);
    // La barque amarrée devant le quai, du côté du spectateur : basse, elle ne cache pas les caisses, et rien ne la
    // cache.
    const boatAt = { x: o.x - 0.2, y: o.y, z: o.z + qd / 2 + boatW / 2 + 0.2 };
    b.box({ x: boatAt.x, y: boatAt.y - 0.35, z: boatAt.z }, [boatLen, 0.45, boatW], C.hull, C.hullTop);
    b.box({ x: boatAt.x + boatLen / 2 + 0.2, y: boatAt.y - 0.35, z: boatAt.z }, [0.4, 0.35, boatW * 0.6], C.hull);
    const onBoat = { x: boatAt.x - boatLen / 2 + 0.5, y: boatAt.y + 0.1, z: boatAt.z - boatW / 2 + 0.3 };
    // La grue : son mât au coin du quai, sa flèche au-dessus des caisses, le crochet et sa corde.
    const mast = { x: o.x + qw / 2 - 0.3, z: o.z - qd / 2 + 0.3 };
    b.box({ x: mast.x, y: o.y, z: mast.z }, [0.3, 3.4, 0.3], C.crane);
    b.box({ x: mast.x - 1.6, y: o.y + 3.2, z: mast.z }, [3.6, 0.22, 0.22], C.crane);
    b.box({ x: mast.x - 3.2, y: o.y + 1.7, z: mast.z }, [0.05, 1.5, 0.05], C.rope);
    b.box({ x: mast.x - 3.2, y: o.y + 1.55, z: mast.z }, [0.3, 0.15, 0.3], C.stoneDark);
    if (scene.op === 'moitie') {
      crates(b, answered ? kept : scene.before, x0, o.y, zFront);
      if (answered) {
        const r = new FacetBuilder();
        crates(r, moved, 0, 0, 0);
        reaction = { facets: r.build(), from: { x: x0, y: o.y, z: zFront }, to: onBoat, arc: 1.5, stay: true };
      }
    } else {
      crates(b, kept, x0, o.y, zBack);
      if (!answered) crates(b, moved, onBoat.x, onBoat.y, onBoat.z);
      else {
        const r = new FacetBuilder();
        crates(r, moved, 0, 0, 0);
        reaction = { facets: r.build(), from: onBoat, to: { x: x0, y: o.y, z: zFront }, arc: 1.5, stay: true };
      }
    }
  }
  return { still: b.build(), labels, reaction };
}


// ---------- Les pièces durables ----------

/** Les pièces durables d'un lieu remises en marche : ce qui reste, et la roue des Écluses qui tourne (à part). */
export interface PlacePieces {
  still: Facets;
  /** La Roue des Écluses, quand elle tourne : son maillage centré sur son axe, et la place de l'axe (est-ouest). */
  wheel: { facets: Facets; at: Vec3 } | null;
}

/** Le premier point d'eau parmi des points proposés autour d'un lieu (pour la barque remise à l'eau). */
function firstWater(candidates: readonly Vec2[]): Vec2 {
  return candidates.find((p) => heightAt(p) < -0.2) ?? candidates[0];
}

/**
 * Les pièces d'un lieu, de 0 à 2 (deux niveaux de réaction, directeur artistique ; à valider par le consultant
 * Archipéo) : au Phare, les lampes de la galerie (une moitié, puis tout le tour ; la lanterne reste éteinte jusqu'à la
 * Conque) ; aux Filets, un pan de filet raccommodé, puis une barque à l'eau ; aux Écluses, une porte de sas neuve, puis la
 * Roue qui tourne ; aux Quais, la grue remontée, puis le quai rouvert.
 */
export function placePieces(place: PlaceId, count: number): PlacePieces {
  const b = new FacetBuilder();
  const p = placeById(place);
  const y0 = groundAt(p.center);
  const { x, z } = p.center;
  let wheel: PlacePieces['wheel'] = null;
  if (count <= 0) return { still: b.build(), wheel };
  if (place === 'phare') {
    const lamps = count >= 2 ? 8 : 4;
    for (let k = 0; k < lamps; k++) {
      // La première moitié face au sud (vers la caméra).
      const a = Math.PI / 2 + ((k - (lamps === 4 ? 1.5 : 3.5)) * Math.PI) / 4;
      b.box({ x: x + 2.05 * Math.cos(a), y: y0 + 11.55, z: z + 2.05 * Math.sin(a) }, [0.3, 0.3, 0.3], C.lamp);
    }
  } else if (place === 'filets') {
    const c = Math.cos(p.yaw),
      s = Math.sin(p.yaw);
    const at = (lx: number, lz: number) => ({
      x: x + lx * c + lz * s,
      z: z - lx * s + lz * c,
    });
    const pan = at(-1.3, 2.3);
    b.box({ x: pan.x, y: y0 + 0.6, z: pan.z, yaw: p.yaw }, [2.4, 2.1, 0.08], C.newRope);
    if (count >= 2) {
      const w = firstWater([at(5, -3), at(-5, -3.5), at(0, -5.5), at(6.5, 1), at(-6.5, 1)]);
      boat(b, w.x, 0.15, w.z, 2.6);
    }
  } else if (place === 'ecluses') {
    b.box({ x, y: y0 + 0.75, z: z - 1.32 }, [3.6, 1.2, 0.08], C.newWood);
    if (count >= 2) {
      const w = new FacetBuilder();
      w.prism({ x: 0, y: -0.25, z: 0, yaw: Math.PI / 2, pitch: Math.PI / 2 }, 1.55, 1.55, 0.5, 10, C.newWood, C.paint);
      for (let k = 0; k < 5; k++) w.box({ x: 0, y: 0, z: 0, pitch: (k * Math.PI) / 5 }, [0.6, 3.3, 0.16], C.paint);
      wheel = {
        facets: w.build(),
        at: { x: x + 3.05, y: y0 + 1.5, z: z - 0.4 },
      };
    }
  } else {
    // La grue remontée : son contrepoids et sa cabine, repeints.
    b.box({ x: x - 1.4, y: y0 + 5.7, z: z - 0.9 }, [1, 0.9, 0.9], C.paint);
    b.box({ x: x - 2.6, y: y0 + 4.6, z: z - 1.6 }, [1, 1, 1], C.paint, C.newWood);
    if (count >= 2) {
      // Le quai rouvert : des bittes neuves et des caisses neuves au bord.
      for (const dx of [-3.5, -1.5, 0.5]) b.prism({ x: x + dx, y: y0, z: z - 3.4 }, 0.25, 0.25, 1, 6, C.paint);
      for (let k = 0; k < 4; k++)
        b.box(
          {
            x: x + 1.6 + (k % 2) * 0.8,
            y: y0 + Math.floor(k / 2) * 0.7,
            z: z - 3.2,
          },
          [0.7, 0.7, 0.7],
          C.newWood,
          C.crateTop,
        );
    }
  }
  return { still: b.build(), wheel };
}

/**
 * Le dernier palier (questions-du-monde.md, directeur artistique) : quand les quatre lieux ont toutes leurs pièces, le
 * Veilleur se rallume au pied du Phare. Sans modèle encore : une silhouette en volumes simples, sa lanterne allumée, et
 * la lanterne du Phare qui brille. Un modèle viendra à sa place.
 */
export function veilleurPiece(): Facets {
  const b = new FacetBuilder();
  const p = placeById('phare');
  const y0 = groundAt(p.center);
  const at = { x: p.center.x + 2.8, z: p.center.z + 2.2 };
  const y = groundAt(at);
  b.box({ x: at.x, y, z: at.z }, [0.9, 0.3, 0.9], C.stoneDark, C.stone);
  b.prism({ x: at.x, y: y + 0.3, z: at.z }, 0.42, 0.28, 1.3, 6, C.hull, C.hullTop);
  b.box({ x: at.x, y: y + 1.6, z: at.z }, [0.42, 0.42, 0.42], C.silverTop);
  b.box({ x: at.x + 0.45, y: y + 0.9, z: at.z + 0.2 }, [0.26, 0.34, 0.26], C.lamp);
  // La lanterne du Phare rallumée.
  b.prism({ x: p.center.x, y: y0 + 11.9, z: p.center.z }, 1.25, 1.25, 0.9, 8, C.lamp);
  return b.build();
}
