// La scène d'une question dans un lieu (lot 4) : ce que le lieu montre de l'item (la pêche sur le filet, l'eau dans le
// sas ou sur l'échelle, les caisses en palettes de dix sur le quai), les objets qui portent les réponses (cloches,
// paniers, leviers, caisses à plaque) sur un ponton, le geste de la réaction, et la trace que la réussite laisse dans le
// lieu. Tout en volumes simples, en aplats ; rien à lire n'est peint : les mots, les nombres et les repères de
// l'échelle sont des panneaux de la page, accrochés aux points que donne ce fichier. Code pur : la vue dessine.
import { boundsOf, FacetBuilder, type Facets } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { DOCK_EDGE, placeById, type PlaceId } from './plan6e';
import type { ItemScene } from './questions';
import { FILETS_RACK, filetsRack } from './places';
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
  /** Les traits entre les bandes du sas rempli : une eau très claire, qu'on voit sur l'eau. */
  lockLine: 0xd6ecf5,
  /** La margelle des leviers : une pierre ocre, ses joints plus sombres ; la pierre du quai en bordure. */
  ochre: 0xc9a46c,
  ochreJoint: 0xa8865a,
  // Le bronze des cloches, éclairci vers la paille, et son reflet chaud (directeur artistique) : rien de presque noir.
  bronze: 0xc8963c,
  bronzeLight: 0xe8c27a,
  // La patine du bronze, vert-de-gris : la couronne des cloches.
  patina: 0x7fae9a,
  // La corde de sonnerie de la gardienne : la brume du pack.
  ringRope: 0xe5ebe3,
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
  /** La vitre éteinte de la lanterne de proue (le gris-bleu de la lanterne du Phare). */
  glassOff: 0xbfd0d3,
  newRope: 0xc9a36a,
  /** La toile claire des ballots de l'Enclos, et son ombre (relecture de L4 : ils se détachent du ponton). */
  canvas: 0xeadfc6,
  canvasShade: 0xd3c3a2,
  newWood: 0xc28a52,
  paint: 0xd9a441,
  /** L'anneau des élingues, en fer sombre (la moufle de la grue est en ardoise). */
  iron: 0x4a555c,
  /** Le gris d'ardoise de la toiture du Phare : la cage des lanternes de sa galerie. */
  slate: 0x6f8089,
} as const;

/** La hauteur où l'on se tient en un point (le sol, ou le dessus de la digue sur l'eau). */
const groundAt = (p: Vec2): number => standingHeight(heightAt(p));

/**
 * Le quai de la scénette des Quais (piste 1, lot 3) : son bord sur le bassin (`front`, en unités au sud du centre du
 * lieu, contre le bord de quai de pierre), sa largeur et sa profondeur au moins, et la bande de devant où se tiennent
 * Kéo et le docker (`strip`) ; les caisses de l'item sont derrière elle. Le bord ne bouge pas d'un item à l'autre : le
 * quai s'allonge vers le nord quand les caisses sont nombreuses.
 */
export const QUAY = { dx: 0.5, front: 12, width: 12, depth: 5.6, strip: 1.6 } as const;

/**
 * Le centre de la scène d'un item, devant son lieu (au sud : vers la caméra), et la demi-taille de sa plate-forme. Aux
 * Filets et aux Écluses (lot 4 de la piste 1), la demi-taille est celle de toute la scénette (la plate-forme de l'item,
 * les planchers de Kéo et de l'habitant, le canal), relevée finement (`fine`) : son sol ne s'enfonce nulle part. Les Filets se décalent vers la grève, à l'est, où le sol est plat.
 */
const SCENE_SPOT: Record<PlaceId, { dx: number; dz: number; half: [number, number]; fine?: true }> = {
  phare: { dx: 0, dz: 0.5, half: [0, 0] },
  filets: { dx: 2.5, dz: 5, half: [5.8, 1.6], fine: true },
  ecluses: { dx: -0.5, dz: 5, half: [5.5, 1.2], fine: true },
  quais: { dx: QUAY.dx, dz: QUAY.front - QUAY.depth / 2, half: [QUAY.width / 2, QUAY.depth / 2] },
};

/** Les points relevés sous la plate-forme d'une scène : ses coins et son milieu, ou tous les pas d'une unité (`fine`). */
function spotSamples(place: PlaceId): Vec2[] {
  const p = placeById(place);
  const s = SCENE_SPOT[place];
  const at = { x: p.center.x + s.dx, z: p.center.z + s.dz };
  const nx = s.fine ? Math.ceil(s.half[0]) : 1;
  const nz = s.fine ? Math.ceil(s.half[1]) : 1;
  const out: Vec2[] = [];
  for (let i = -nx; i <= nx; i++) for (let k = -nz; k <= nz; k++) out.push({ x: at.x + (i / nx) * s.half[0], z: at.z + (k / nz) * s.half[1] });
  return out;
}

/**
 * Le point de la scène d'un item dans un lieu : au sol, au plus haut de sa plate-forme (elle ne s'enfonce jamais dans
 * une pente ; elle descend jusqu'au sol sous elle, `sceneDepth`).
 */
export function sceneSpot(place: PlaceId): Vec3 {
  const p = placeById(place);
  const s = SCENE_SPOT[place];
  const at = { x: p.center.x + s.dx, z: p.center.z + s.dz };
  let y = groundAt(at);
  for (const q of spotSamples(place)) y = Math.max(y, groundAt(q));
  return { x: at.x, y, z: at.z };
}

/** La profondeur de la plate-forme d'une scène, sous le point de la scène : assez pour toucher le sol d'une pente. */
const PLATFORM_DEPTH = 1.5;

/** Le fond de l'eau, pour les jupes des planchers : un peu sous la surface (0). */
const UNDER_WATER = -0.3;

/**
 * La profondeur des planchers d'une scène sous son point : jusqu'au plus bas du sol sous elle (ou un peu sous l'eau),
 * jamais moins que `PLATFORM_DEPTH`.
 */
export function sceneDepth(place: PlaceId): number {
  const y = sceneSpot(place).y;
  const low = Math.min(...spotSamples(place).map((q) => Math.max(UNDER_WATER, heightAt(q))));
  return Math.max(PLATFORM_DEPTH, y - low + 0.2);
}

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
  /** Les cloches, plus petites que les autres objets. */
  bellMax: 0.09,
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
  /**
   * Une scénette (./scenette.ts) : là où Kéo et l'habitant se tiennent, et la place de « Valider » en bas à droite
   * (`null` : dans la colonne). Absent : une question du lot 4.
   */
  scenette?: { stage: ScreenBox; validate: ScreenBox | null };
}

/** Ce que demande une question : combien de réponses, des mots longs (les cloches), une règle, la scène au milieu. */
export interface QuestionNeeds {
  count: number;
  bells?: boolean;
  aid?: boolean;
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
  const aid = low && needs.aid && !full ? { left: panelRight + edge, top, right: width - edge, bottom: viewBottom } : null;
  return { low, slots, objectHeight, panel, aid, view: { left: panelRight + edge, top, right: width - edge, bottom: Math.max(top + 48, viewBottom) } };
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
  cloche: { height: 1, half: 0.45 },
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

/** Les couleurs d'une cloche : le bronze, son reflet (les vagues) et la patine de sa couronne. */
interface BellColors {
  body: number;
  light: number;
  patina: number;
}

const BRONZE: BellColors = { body: C.bronze, light: C.bronzeLight, patina: C.patina };
const LIT: BellColors = { body: C.lamp, light: C.lamp, patina: C.lamp };

/** Le rayon du corps d'une cloche (à l'échelle 1) à la hauteur `y` : de la lèvre à l'épaule. */
const bellRadius = (y: number) => 0.4 - (0.18 * (y - 0.1)) / 0.62;

/**
 * Une cloche pendue, sans lettre (lot 2) : la lèvre évasée, le corps de bronze, une frise de vagues en relief à mi-hauteur,
 * la couronne patinée et son anneau ; de `p` (sa lèvre) à `p.y + s` (son anneau). `grow` : plus grande, son anneau à la
 * même place (la lumière de la réaction) ; `swing` : penchée de côté autour de son anneau, comme une cloche qu'on vient
 * de tirer (une cloche choisie : sa forme le dit, pas seulement la couleur de son étiquette).
 */
function bell(b: FacetBuilder, p: Vec3, s: number, colors: BellColors, grow = 1, swing = 0): void {
  const f = new FacetBuilder();
  f.prism({ x: 0, y: 0, z: 0 }, 0.45, 0.4, 0.1, 10, colors.body, colors.light);
  f.prism({ x: 0, y: 0.1, z: 0 }, 0.4, 0.22, 0.62, 10, colors.body, colors.patina);
  f.prism({ x: 0, y: 0.72, z: 0 }, 0.2, 0.12, 0.16, 8, colors.patina);
  f.box({ x: 0, y: 0.88, z: 0 }, [0.1, 0.12, 0.1], colors.patina);
  // La frise : une bande de vagues (cinq crêtes) posée sur le corps, un peu en saillie.
  const N = 20;
  const ring = (k: number, dy: number) => {
    const a = (2 * Math.PI * k) / N;
    const y = 0.36 + 0.06 * Math.sin(5 * a) + dy;
    const r = bellRadius(y) + 0.02;
    return [r * Math.cos(a), y, r * Math.sin(a)] as const;
  };
  for (let k = 0; k < N; k++) f.quad(ring(k + 1, -0.035), ring(k, -0.035), ring(k, 0.035), ring(k + 1, 0.035), colors.light);
  const built = f.build();
  const k = s * grow;
  const pos = built.positions;
  const nor = built.normals;
  const cs = Math.cos(swing), sn = Math.sin(swing);
  for (let i = 0; i < pos.length; i += 3) {
    // Autour de l'anneau (en haut), dans le plan de l'écran, puis à l'échelle, puis à sa place : l'anneau reste en
    // `p.y + s`.
    const x = pos[i], y = pos[i + 1] - 1;
    pos[i] = (x * cs - y * sn) * k + p.x;
    pos[i + 1] = (x * sn + y * cs) * k + p.y + s;
    pos[i + 2] = pos[i + 2] * k + p.z;
    const nx = nor[i], ny = nor[i + 1];
    nor[i] = nx * cs - ny * sn;
    nor[i + 1] = nx * sn + ny * cs;
  }
  b.append(built);
}

/** Où pendent les cloches d'une scénette : la main qui tient la corde de sonnerie, et le haut de la rambarde. */
interface BellHanging {
  hand: Vec3;
  rail: Vec3;
}

/**
 * Ce qui change l'allure des objets : les choisis (`picked` : une cloche balancée, une caisse penchée en arrière, un
 * signe de forme, pas seulement de couleur), ceux qui sont partis avec la réaction (`gone` : la bonne caisse, montée
 * au crochet), et où pendent les cloches d'une scénette (`hanging`).
 */
export interface AnswerLook {
  picked?: readonly number[];
  gone?: readonly number[];
  hanging?: BellHanging;
  /**
   * La hauteur du sol sous le ponton des réponses, quand il est posé à terre (les Filets, les Écluses) : sa jupe y
   * descend. Sans elle, le ponton flotte sur l'eau (les Quais).
   */
  ground?: number;
  /** Le geste « ranger » (lot L4) : quels objets sont des paniers, l'objet tenu, et où chaque objet est rangé. */
  sort?: SortLook;
}

/**
 * Le geste « ranger » vu par la scène, en places de la rangée (la vue ne décide rien, elle dessine) : `bins`, les places
 * des paniers ; `held`, la place de l'objet tenu ; `placed[i]`, la place du panier où l'objet de la place `i` est rangé
 * (`null` : sur le ponton) ; `moving`, la place d'un objet qui vole vers son panier (la réaction le dessine).
 */
export interface SortLook {
  bins: readonly number[];
  held: number | null;
  placed: readonly (number | null)[];
  moving?: number | null;
}

/** Les paniers du geste « ranger » : une fois et demie ceux du Troupeau (directeur artistique, lot L4), au plus. */
const SORT_BIN_SCALE = 1.5;
/** L'objet tenu : soulevé de 0,3 unité et un peu penché, il reste à sa place (il ne va pas vers Kéo). */
export const HELD_LIFT = 0.3;
const HELD_TILT = 0.25;

/**
 * Un objet à ranger de l'Enclos : un ballot de toile claire ficelé de deux tours de corde (relecture de L4, directeur
 * artistique : il se détache du ponton). Tous les mêmes : rien ne dit un ou plusieurs (la réponse) ; seule l'étiquette
 * les distingue. `tilt` : penché (tenu).
 */
export function sortPrise(b: FacetBuilder, at: Vec3, s: number, tilt = 0): void {
  const c = Math.cos(tilt),
    sn = Math.sin(tilt);
  b.box({ x: at.x, y: at.y, z: at.z, yaw: tilt }, [0.6 * s, 0.34 * s, 0.42 * s], C.canvasShade, C.canvas);
  for (const k of [-1, 1]) b.box({ x: at.x + k * 0.15 * s * c, y: at.y - 0.01, z: at.z - k * 0.15 * s * sn, yaw: tilt }, [0.06 * s, 0.37 * s, 0.45 * s], C.rope);
}

/**
 * La part de l'écart entre deux places de la rangée que prend un panier, au plus : 0,42 (relecture de L4 : le panier du
 * bout de la rangée reste entier, à 24 px du bord au moins, à 1024 comme à 844 px de large).
 */
const SORT_BIN_GAP = 0.42;
/** Un objet à ranger, au plus : le panier divisé par 1,2 (le ballot reste nettement plus petit que le panier). */
const SORT_PRISE_UNDER = 1.2;

/** La taille d'un objet rangé dans son panier : plus petit, pour que quatre y tiennent. */
const SORT_IN_BASKET = 0.62;

/**
 * Les échelles du geste « ranger » pour la rangée posée en `points`, à l'échelle des objets `s` : `bin`, celle des
 * paniers, une fois et demie celle des objets, sans jamais prendre plus que `SORT_BIN_GAP` de l'écart entre deux places
 * voisines (leur étiquette reste sous eux) ; `prise`, celle des objets, qui suit les paniers quand ils rapetissent (le
 * panier reste plus grand que ce qu'il reçoit : `SORT_PRISE_UNDER`) ; `inBasket`, celle d'un objet rangé.
 */
export function sortScales(points: readonly Vec3[], s: number): { bin: number; prise: number; inBasket: number } {
  let gap = Infinity;
  for (let i = 1; i < points.length; i++) gap = Math.min(gap, Math.abs(points[i].x - points[i - 1].x));
  const bin = Math.min(SORT_BIN_SCALE * s, SORT_BIN_GAP * gap);
  const prise = Math.min(s, bin / SORT_PRISE_UNDER);
  return { bin, prise, inBasket: SORT_IN_BASKET * prise };
}

/**
 * Où se pose le `k`-ième objet rangé dans le panier posé en `at` (de l'échelle `B`, `sortScales`), en deux rangs de
 * deux : enfoncé dans le panier, son dessus au-dessus du bord (il se voit dedans, le panier reste entier).
 */
export function inBasket(at: Vec3, B: number, k: number): Vec3 {
  return { x: at.x + ((k % 2) - 0.5) * 0.36 * B, y: at.y + 0.42 * B + 0.12 * B * Math.floor(k / 4), z: at.z + ((Math.floor(k / 2) % 2) - 0.5) * 0.3 * B };
}

/** Le rang de l'objet de la place `i` dans son panier : combien d'objets rangés dans le même panier le précèdent. */
export function rankInBasket(placed: readonly (number | null)[], i: number): number {
  const bin = placed[i];
  let k = 0;
  for (let j = 0; j < i; j++) if (placed[j] === bin) k++;
  return k;
}

/** Le panier d'osier du geste « ranger », à l'échelle 1 : rayon du fond, du bord, hauteur. */
const BASKET = { bottom: 0.3, rim: 0.45, height: 0.5 } as const;

/**
 * Un panier d'osier du geste « ranger » (relecture de L4, directeur artistique) : un corps évasé et opaque, un bandeau de
 * paille tressée plus claire sous le bord, le creux sombre, et une anse ; rien ne le couvre. L'anse se relève quand un
 * objet est tenu (le panier est prêt à le recevoir : la forme le dit) ; sinon, elle est rabattue en arrière sur le bord.
 */
function sortBin(b: FacetBuilder, p: Vec3, B: number, open: boolean): void {
  const r0 = BASKET.bottom * B,
    r1 = BASKET.rim * B,
    h = BASKET.height * B;
  b.prism({ x: p.x, y: p.y, z: p.z }, r0, r1, h, 8, C.strawDark, C.rope);
  // Le bandeau : un anneau à peine plus large que le corps, aux deux tiers de sa hauteur.
  const at = (y: number) => r0 + ((r1 - r0) * y) / h;
  b.prism({ x: p.x, y: p.y + 0.62 * h, z: p.z }, at(0.62 * h) + 0.025 * B, at(0.84 * h) + 0.025 * B, 0.22 * h, 8, C.straw);
  // L'anse, d'un bord à l'autre en trois brins : haute au-dessus du panier, ou couchée en arrière (vers -z).
  const lift = open ? 0.42 * B : 0.06 * B,
    back = open ? 0 : -0.32 * B,
    t = 0.05 * B;
  const ends = [-1, 1].map((k) => ({ x: p.x + k * (r1 - t), y: p.y + h, z: p.z }));
  const mid = [-1, 1].map((k) => ({ x: p.x + k * 0.22 * B, y: p.y + h + lift, z: p.z + back }));
  b.beam(ends[0], mid[0], t, C.straw);
  b.beam(mid[0], mid[1], t, C.straw);
  b.beam(mid[1], ends[1], t, C.straw);
}

/** Les paniers et les objets du geste « ranger », sur le ponton des réponses (hauteur `y`). */
function sortObjects(b: FacetBuilder, points: readonly Vec3[], y: number, s: number, look: SortLook): void {
  const open = look.held !== null;
  const { bin: B, prise, inBasket: k } = sortScales(points, s);
  for (const i of look.bins) if (points[i]) sortBin(b, { x: points[i].x, y, z: points[i].z }, B, open);
  for (const [i, p] of points.entries()) {
    if (look.bins.includes(i) || look.moving === i) continue;
    const bin = look.placed[i];
    if (bin !== null && bin !== undefined && points[bin]) sortPrise(b, inBasket({ x: points[bin].x, y, z: points[bin].z }, B, rankInBasket(look.placed, i)), k);
    else if (look.held === i) sortPrise(b, { x: p.x, y: y + HELD_LIFT, z: p.z }, prise, HELD_TILT);
    else sortPrise(b, { x: p.x, y, z: p.z }, prise);
  }
}

/**
 * Les objets des réponses, posés sur un ponton aux points donnés (au sol, dans l'ordre des choix ; la vue les tire de
 * l'écran), à l'échelle `answerScale`, pour que chacun tienne au-dessus de son bouton. Au Phare, les cloches pendent à
 * une poutre devant la rambarde de la galerie (`hanging`), les choisies balancées de côté.
 */
export function answerObjects(place: PlaceId, points: readonly Vec3[], s: number, look: AnswerLook = {}): Facets {
  const b = new FacetBuilder();
  if (points.length === 0) return b.build();
  const picked = look.picked ?? [];
  const gone = look.gone ?? [];
  const xs = points.map((p) => p.x);
  const y = points[0].y;
  const z = points.reduce((t, p) => t + p.z, 0) / points.length;
  if (ANSWER_OBJECT[place] === 'cloche') {
    if (!look.hanging && look.ground !== undefined) groundBells(b, points, s, look.ground);
    else hangBells(b, points, s, picked, look.hanging);
    return b.build();
  }
  const kind = ANSWER_OBJECT[place];
  // Le ponton sous la rangée : jamais un objet posé sur l'eau ; à terre, il descend jusqu'au sol. Sous les leviers des
  // Écluses, une margelle juste assez profonde pour eux : de pierre ocre, ses joints entre les leviers, la pierre du
  // quai en bordure (directeur artistique).
  const skirt = look.ground === undefined ? 0.12 * s : Math.max(0.12 * s, y - look.ground + 0.1);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  const span = Math.max(...xs) - Math.min(...xs) + 1.4 * s;
  if (kind === 'levier') {
    const depth = 0.9 * s,
      rim = 0.12 * s;
    b.box({ x: mid, y: y - skirt, z }, [span, skirt, depth], C.stoneDark, C.ochre);
    for (const side of [-1, 1]) b.box({ x: mid, y: y - 0.02, z: z + (side * (depth - rim)) / 2 }, [span + 0.02, 0.04, rim], C.stone);
    for (const side of [-1, 1]) b.box({ x: mid + (side * (span - rim)) / 2, y: y - 0.02, z }, [rim, 0.04, depth - 2 * rim], C.stone);
    for (let i = 1; i < points.length; i++)
      b.box({ x: (points[i - 1].x + points[i].x) / 2, y: y - 0.02, z }, [0.05 * s, 0.035, depth - 2 * rim], C.ochreJoint);
  } else b.box({ x: mid, y: y - skirt, z }, [span, skirt, 0.8 * s], C.deckSide, C.deck);
  if (look.sort) {
    sortObjects(b, points, y, s, look.sort);
    return b.build();
  }
  for (const [i, p] of points.entries()) {
    if (gone.includes(i)) continue;
    if (kind === 'panier') {
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
      // Un grand levier de vanne, penché vers le nord, et sa poignée ; un levier choisi (une réponse tentée) est tiré
      // vers l'élève : sa forme le dit.
      const k = picked.includes(i) ? -1 : 1;
      b.box({ x: p.x, y: y + 0.3 * s, z: p.z, pitch: -0.35 * k }, [0.12 * s, 1.5 * s, 0.12 * s], C.lever);
      b.box({ x: p.x, y: y + 0.3 * s + 1.41 * s, z: p.z - 0.51 * s * k }, [0.3 * s, 0.22 * s, 0.22 * s], C.knob);
    } else {
      // Une caisse choisie (une réponse tentée) bascule en arrière sur son arête : sa forme le dit.
      answerCrate(b, { x: p.x, y, z: p.z }, s, picked.includes(i) ? CRATE_TIPPED : 0);
    }
  }
  return b.build();
}

/** La bascule d'une caisse choisie, en radians (en arrière, vers le quai). */
const CRATE_TIPPED = -0.6;

/**
 * Une caisse de réponse, à l'échelle `s`, posée en `at` : le corps, ses lattes, et la plaque à l'avant, sans rien
 * d'écrit (le nombre est dans le panneau de la page). `tilt` : basculée en arrière autour de son arête du fond.
 */
function answerCrate(b: FacetBuilder, at: Vec3, s: number, tilt = 0): void {
  const f = new FacetBuilder();
  const w = 0.8, h = 0.7, d = 0.7;
  f.box({ x: 0, y: 0, z: 0 }, [w, h, d], C.crate, C.crateTop);
  // Deux lattes en travers, plus sombres, et la plaque claire.
  for (const y of [0.12, 0.5]) f.box({ x: 0, y, z: d / 2 + 0.01 }, [w + 0.02, 0.08, 0.03], C.pallet);
  f.box({ x: 0, y: 0.22, z: d / 2 + 0.03 }, [0.5, 0.24, 0.03], C.plate);
  const built = f.build();
  const pos = built.positions;
  const nor = built.normals;
  const c = Math.cos(tilt), sn = Math.sin(tilt);
  for (let i = 0; i < pos.length; i += 3) {
    // Autour de l'arête du bas, au fond (z = −d/2) : la caisse se couche en arrière, son devant vers le ciel.
    const y0 = pos[i + 1], z0 = pos[i + 2] + d / 2;
    pos[i] = pos[i] * s + at.x;
    pos[i + 1] = (y0 * c - z0 * sn) * s + at.y;
    pos[i + 2] = (y0 * sn + z0 * c - d / 2) * s + at.z;
    const ny = nor[i + 1], nz = nor[i + 2];
    nor[i + 1] = ny * c - nz * sn;
    nor[i + 2] = ny * sn + nz * c;
  }
  b.append(built);
}

/**
 * Les cloches pendues à leur poutre, chacune à sa corde, la poutre tenue à la rambarde par deux potences ; la corde de
 * sonnerie va de la main de l'habitant au bout de la poutre. Sans `hanging`, la poutre seule les tient.
 */
function hangBells(b: FacetBuilder, points: readonly Vec3[], s: number, picked: readonly number[], hanging?: BellHanging): void {
  const xs = points.map((p) => p.x);
  const z = points.reduce((t, p) => t + p.z, 0) / points.length;
  const beamY = Math.max(...points.map((p) => p.y)) + 1.12 * s;
  const left = Math.min(...xs) - 0.6 * s;
  const right = Math.max(...xs) + 0.6 * s;
  b.box({ x: (left + right) / 2, y: beamY, z }, [right - left, 0.14 * s, 0.16 * s], C.post);
  points.forEach((p, i) => {
    b.box({ x: p.x, y: p.y + s, z: p.z }, [0.05 * s, beamY - p.y - s, 0.05 * s], C.rope);
    bell(b, p, s, BRONZE, 1, picked.includes(i) ? 0.3 : 0);
  });
  if (!hanging) return;
  // Deux potences : de la poutre à la rambarde, puis au haut de la rambarde.
  const mid = hanging.rail.x;
  for (const x of [Math.max(left, mid - 1.1), Math.min(right, mid + 1.1)]) {
    b.beam({ x, y: beamY, z }, { x, y: beamY, z: hanging.rail.z }, 0.1, C.post);
    b.beam({ x, y: beamY, z: hanging.rail.z }, { x, y: hanging.rail.y, z: hanging.rail.z }, 0.1, C.post);
  }
  // La corde de sonnerie, de la main de l'habitant au bout de la poutre.
  b.beam(hanging.hand, { x: right, y: beamY, z }, 0.09, C.ringRope);
}

/**
 * Les cloches tombées au pied du Phare (sa galerie pas encore posée) : debout sur une avancée du socle de rochers, sa
 * pierre jusqu'au sol (`ground`), quelques pierres tombées à ses bouts. On les frappe là ; une cloche choisie ne bascule
 * pas (elle ne pend pas) : la réponse tentée se lit sur son bouton.
 */
function groundBells(b: FacetBuilder, points: readonly Vec3[], s: number, ground: number): void {
  const xs = points.map((p) => p.x);
  const y = points[0].y;
  const z = points.reduce((t, p) => t + p.z, 0) / points.length;
  const left = Math.min(...xs) - 0.7 * s;
  const right = Math.max(...xs) + 0.7 * s;
  const skirt = Math.max(0.12 * s, y - ground + 0.1);
  b.box({ x: (left + right) / 2, y: y - skirt, z }, [right - left, skirt, 1.1 * s], C.stoneDark, C.stone);
  b.box({ x: left - 0.1 * s, y, z: z - 0.15 * s, yaw: 0.5 }, [0.45 * s, 0.3 * s, 0.4 * s], C.stoneDark, C.stone);
  b.box({ x: right + 0.05 * s, y, z: z + 0.2 * s, yaw: -0.4 }, [0.4 * s, 0.26 * s, 0.35 * s], C.stoneDark, C.stone);
  for (const p of points) bell(b, p, s, BRONZE);
}

// ---------- La scène d'un item ----------

/** Un panneau de la page accroché à un point de la scène (les repères 0, 1, 2 de l'échelle). */
interface SceneLabel {
  text: string;
  at: Vec3;
  /** Centré sous son point (les fractions sous les deux sas), sinon posé à sa droite (les repères de l'échelle). */
  center?: boolean;
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

/** Le grand filet étendu sur sa plate-forme, ses mailles en traits. */
function restingNet(b: FacetBuilder, o: Vec3): void {
  b.box({ x: o.x, y: o.y, z: o.z }, [4.6, 0.03, 2.6], C.net);
  for (let k = -2; k <= 2; k++) b.box({ x: o.x + k * 0.9, y: o.y + 0.03, z: o.z }, [0.05, 0.01, 2.6], C.netLine);
  for (let k = -1; k <= 1; k++) b.box({ x: o.x, y: o.y + 0.03, z: o.z + k * 0.85 }, [4.6, 0.01, 0.05], C.netLine);
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

/**
 * Le canal des Écluses (piste 1, lot 4), dans le repère de la scène : devant le sas, de `front` à `back` unités au sud
 * de son milieu, son eau `water` sous le plancher, sur `half` unités de chaque côté ; la porte qui le ferme, entre le sas
 * et l'éclusier, qui ne la cache pas (`gate`, depuis le milieu du sas, ses deux vantaux de `leaf`, en pointe de `mitre`
 * vers l'amont quand ils sont fermés, leur haut `gateTop` au-dessus du quai, à l'épaule de l'éclusier, et leurs
 * balanciers de `beam`), le milieu de la barque arrêtée devant
 * elle (`stop`, devant le sas), puis passée, dans le champ (`beyond`) ; au sud du canal, la berge (`forecourt`, sa
 * profondeur, assez pour que son flanc sorte du cadre ; plus large que le canal de `bank` de chaque côté), bordée de
 * pierre (`kerb`), puis le chemin de halage (`towpath`) et l'herbe, sous la rangée des leviers (retour du directeur
 * artistique : la pierre en bordure seulement).
 */
export const LOCK = {
  front: 0.8,
  back: 2.2,
  water: 0.3,
  half: 8,
  gate: 2.1,
  leaf: 0.7,
  mitre: 0.3,
  gateTop: 1,
  beam: 1,
  stop: 0.2,
  beyond: 3.4,
  forecourt: 11,
  bank: 4,
  kerb: 0.45,
  towpath: 1.1,
} as const;

/** La barque des Écluses, sa coque vers l'est, au repère de la réaction (la vue la déplace). */
export function lockBoat(): Facets {
  const b = new FacetBuilder();
  boat(b, 0, 0, 0);
  return b.build();
}

/** Les deux sas de Deux rives : la largeur et la hauteur de chacun (la même), et l'écart entre leurs milieux. */
const PAIR = { w: 1.35, h: 3.2, step: 2.05 } as const;

/** Le milieu de chacun des deux sas de Deux rives (`a` à l'ouest, `b` à l'est, l'ordre du tirage), et sa part. */
const pairSas = (x: number, scene: Extract<ItemScene, { kind: 'lockPair' }>): [number, [number, number]][] => [
  [x - PAIR.step / 2, scene.a],
  [x + PAIR.step / 2, scene.b],
];

/**
 * Le sas rempli, à la réussite de la mission aux Écluses : l'eau dans toutes les bandes de la paroi, chacune la sienne,
 * séparées par des traits clairs (le sas se lit « 6 parts sur 6 », pas en aplat ; niveau 1), ou jusqu'en haut du bassin
 * de l'échelle (niveau 2), et le trait clair du niveau en haut. Un voile posé juste devant la scène de l'item, qui reste.
 */
export function lockFull(scene: ItemScene): Facets {
  const b = new FacetBuilder();
  const o = sceneSpot('ecluses');
  const zf = o.z + 0.35;
  if (scene.kind === 'sas') {
    const h = 3.2,
      w = 3,
      d = Math.max(1, scene.d),
      band = h / d;
    for (let k = 0; k < d; k++) b.box({ x: o.x, y: o.y + 0.15 + k * band + 0.05, z: zf + 0.06 }, [w, band - 0.1, 0.04], C.water);
    for (let k = 1; k < d; k++) b.box({ x: o.x, y: o.y + 0.15 + k * band - 0.05, z: zf + 0.06 }, [w, 0.1, 0.04], C.lockLine);
    b.box({ x: o.x, y: o.y + 0.15 + h - 0.06, z: zf + 0.1 }, [w + 0.8, 0.12, 0.06], C.level);
  } else if (scene.kind === 'lockPair') {
    for (const [cx, [, d]] of pairSas(o.x, scene)) {
      const k = Math.max(1, d),
        band = PAIR.h / k;
      for (let i = 0; i < k; i++) b.box({ x: cx, y: o.y + 0.15 + i * band + 0.05, z: zf + 0.06 }, [PAIR.w, band - 0.1, 0.04], C.water);
      for (let i = 1; i < k; i++) b.box({ x: cx, y: o.y + 0.15 + i * band - 0.05, z: zf + 0.06 }, [PAIR.w, 0.1, 0.04], C.lockLine);
      b.box({ x: cx, y: o.y + 0.15 + PAIR.h - 0.06, z: zf + 0.1 }, [PAIR.w + 0.2, 0.12, 0.06], C.level);
    }
  } else if (scene.kind === 'echelle') {
    const top = 2 * 1.7;
    b.box({ x: o.x - 0.6, y: o.y + 0.1, z: zf + 0.12 }, [2, top, 0.04], C.water);
    b.box({ x: o.x - 0.2, y: o.y + 0.1 + top - 0.06, z: zf + 0.15 }, [2.9, 0.12, 0.05], C.level);
  }
  return b.build();
}

/**
 * Le panier plein des Filets : un grand panier de paille, la pêche en tas qui dépasse (des sardines), posé en `at`, à
 * l'échelle `s` (1 : à la taille de la pêcheuse).
 */
export function fullBasket(b: FacetBuilder, at: Vec3, s = 1): void {
  const w = 0.9 * s,
    d = 0.7 * s,
    h = 0.5 * s,
    t = 0.08 * s;
  b.box({ x: at.x, y: at.y, z: at.z }, [w, 0.06 * s, d], C.strawDark);
  b.box({ x: at.x, y: at.y, z: at.z + d / 2 }, [w, h, t], C.straw, C.strawDark);
  b.box({ x: at.x, y: at.y, z: at.z - d / 2 }, [w, h, t], C.straw, C.strawDark);
  b.box({ x: at.x - w / 2, y: at.y, z: at.z }, [t, h, d], C.straw, C.strawDark);
  b.box({ x: at.x + w / 2, y: at.y, z: at.z }, [t, h, d], C.straw, C.strawDark);
  // Le tas : deux couches de sardines, la seconde plus étroite, qui dépasse du bord.
  const f = new FacetBuilder();
  for (let k = 0; k < 4; k++) fish(f, ((k % 2) - 0.5) * 0.36, 0, (Math.floor(k / 2) - 0.5) * 0.28, 0.25 * (k % 2 ? 1 : -1));
  for (let k = 0; k < 2; k++) fish(f, (k - 0.5) * 0.3, 0.2, 0, 0.3 * (k ? -1 : 1));
  b.append(placed(f.build(), 0.75 * s, { x: at.x, y: at.y + h - 0.12 * s, z: at.z }));
}

/**
 * La barque amarrée des Quais (lot 3, réserve du directeur artistique : reconnaissable) : une coque ouverte, son fond
 * de bois, ses bordés bleus au plat-bord clair, la proue en pointe à l'est, et deux bancs en travers. `at` : le milieu de
 * son fond, à la surface de l'eau.
 */
function barque(b: FacetBuilder, at: Vec3, length: number, width: number): void {
  const wall = 0.22, h = 0.75, y = at.y - 0.3;
  b.box({ x: at.x, y, z: at.z }, [length, 0.2, width], C.hull, C.hullTop);
  for (const side of [-1, 1]) b.box({ x: at.x, y, z: at.z + side * (width / 2 - wall / 2) }, [length, h, wall], C.hull, C.newWood);
  b.box({ x: at.x - length / 2 + wall / 2, y, z: at.z }, [wall, h, width], C.hull, C.newWood);
  // La proue (directeur artistique) : courte, à la largeur de la coque, ses deux bordés qui se rejoignent en pointe sur
  // un fond en losange bas (creuse, comme le reste de la barque) ; l'étrave monte de la pointe, penchée vers l'avant, et
  // porte la lanterne.
  const bow = boatBow(at, length, width);
  const end = at.x + length / 2;
  const bowLen = bow.tip.x - end;
  b.prism({ x: end, y, z: at.z }, width / 2, width / 2, 0.2, 4, C.hull, C.hullTop);
  const side = Math.hypot(bowLen, width / 2);
  const angle = Math.atan2(width / 2, bowLen);
  for (const k of [-1, 1])
    b.box({ x: end + bowLen / 2, y, z: at.z + (k * width) / 4, yaw: k * angle }, [side + wall / 2, h, wall], C.hull, C.newWood);
  b.beam({ x: bow.tip.x - 0.08, y, z: at.z }, bow.stemTop, 0.2, C.hull);
  // La lanterne de proue : son socle et son toit sombres, sa vitre éteinte entre les deux.
  b.box({ x: bow.lantern.x, y: bow.lantern.y - 0.06, z: at.z }, [0.26, 0.06, 0.26], C.stoneDark);
  b.box({ x: bow.lantern.x, y: bow.lantern.y, z: at.z }, [LANTERN_GLASS, LANTERN_GLASS, LANTERN_GLASS], C.glassOff);
  b.box({ x: bow.lantern.x, y: bow.lantern.y + LANTERN_GLASS, z: at.z }, [0.3, 0.07, 0.3], C.stoneDark);
  // Deux bancs en travers, à la poupe et à la proue, hors de la place des caisses.
  for (const dx of [-length / 2 + 0.6, length / 2 - 0.6]) b.box({ x: at.x + dx, y: y + 0.42, z: at.z }, [0.34, 0.1, width - 2 * wall], C.newWood);
}

/** La longueur de la proue, en part de la largeur de la coque : une pointe courte. */
const BOW_SHARE = 0.5;
/** Le côté de la vitre de la lanterne de proue. */
const LANTERN_GLASS = 0.2;

/** La pointe de la proue, le haut de l'étrave et le bas de la vitre de sa lanterne, pour une barque. */
function boatBow(at: Vec3, length: number, width: number): { tip: Vec3; stemTop: Vec3; lantern: Vec3 } {
  const y = at.y - 0.3;
  const tip = { x: at.x + length / 2 + BOW_SHARE * width, y, z: at.z };
  const stemTop = { x: tip.x + 0.3, y: y + 1.35, z: at.z };
  return { tip, stemTop, lantern: { x: stemTop.x, y: stemTop.y + 0.06, z: at.z } };
}

/** Le crochet de levage, au bout de la corde : une tige et un anneau ouvert (huit pavés). */
export function liftingHook(b: FacetBuilder, top: Vec3, color: number, r = 0.16): void {
  b.box({ x: top.x, y: top.y - 0.3, z: top.z }, [0.07, 0.3, 0.07], color);
  const cy = top.y - 0.3 - r;
  for (let k = 0; k < 7; k++) {
    const a0 = Math.PI / 2 + (k * 2 * Math.PI) / 8, a1 = a0 + (2 * Math.PI) / 8;
    b.beam({ x: top.x + r * Math.cos(a0), y: cy + r * Math.sin(a0), z: top.z }, { x: top.x + r * Math.cos(a1), y: cy + r * Math.sin(a1), z: top.z }, 0.06, color);
  }
}

const ORIGIN: Vec3 = { x: 0, y: 0, z: 0 };

/**
 * La scène d'un item dans son lieu : `answered` donne l'état juste (après la réponse, juste ou corrigée), jamais l'état
 * faux ; `right` : les points des objets des bonnes réponses (la pêche va au panier, les bonnes cloches s'allument),
 * `scale` : l'échelle de ces objets (`answerScale`).
 */
export function itemScene(place: PlaceId, scene: ItemScene, answered: boolean, right: readonly Vec3[] = [], scale = 1, posed = true): ItemSceneFacets {
  const b = new FacetBuilder();
  const o = sceneSpot(place);
  const labels: SceneLabel[] = [];
  let reaction: Reaction | null = null;
  const answerAt = right[0];
  if (scene.kind === 'cloches') {
    // Les bonnes cloches s'allument le temps de la réaction, puis redeviennent de bronze : rien ne reste.
    if (answered && right.length) {
      const r = new FacetBuilder();
      for (const p of right) bell(r, p, scale, LIT, 1.12);
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
  // Une plate-forme sous la scène : elle ne flotte jamais ; de bois aux Filets, de pierre aux Écluses (le sas).
  const depth = sceneDepth(place);
  const platform = (w: number, d: number, stone = false) =>
    b.box({ x: o.x, y: o.y - depth, z: o.z }, [w, depth, d], stone ? C.stoneDark : C.deckSide, stone ? C.stone : C.deck);
  // La barque des Écluses passe dans le canal, devant le sas, et s'arrête devant la porte fermée.
  const lockReaction = (): Reaction => {
    const r = new FacetBuilder();
    boat(r, 0, 0, 0);
    const y = o.y - LOCK.water;
    const z = o.z + (LOCK.front + LOCK.back) / 2;
    return { facets: r.build(), from: { x: o.x - LOCK.half + 1.5, y, z }, to: { x: o.x + LOCK.stop, y, z }, arc: 0, stay: true };
  };
  if (scene.kind === 'enclos') {
    // L'Enclos (lot L4) : le filet étendu, au repos, sans pêche ; les objets à ranger et les paniers sont sur le ponton.
    platform(5.4, 3.2);
    restingNet(b, o);
  } else if (scene.kind === 'filets') {
    platform(5.4, 3.2);
    restingNet(b, o);
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
    platform(4.6, 1.6, true);
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
    if (answered) reaction = lockReaction();
  } else if (scene.kind === 'lockPair') {
    // Deux rives (lot L2) : deux sas côte à côte, de même hauteur, de même largeur, à la même distance de la caméra (la
    // même unité) ; dans chacun, ses parts égales en traits, l'eau pile sur un trait, la surface de son eau en trait
    // clair, et rien de commun aux deux (aucun trait d'un sas à l'autre). Sous chacun, sa fraction, un panneau de la
    // page. Rien ne change à la réponse, sauf la barque qui avance jusqu'à la porte.
    platform(4.6, 1.6, true);
    const zf = o.z + 0.35;
    for (const [cx, [n0, d0]] of pairSas(o.x, scene)) {
      const d = Math.max(1, d0),
        n = Math.max(0, Math.min(d, n0)),
        band = PAIR.h / d;
      b.box({ x: cx, y: o.y, z: o.z }, [PAIR.w + 0.3, PAIR.h + 0.3, 0.6], C.stoneDark, C.stone);
      for (let k = 0; k < d; k++) b.box({ x: cx, y: o.y + 0.15 + k * band + 0.03, z: zf }, [PAIR.w, band - 0.06, 0.05], k < n ? C.water : C.empty);
      b.box({ x: cx, y: o.y + 0.15 + n * band - 0.05, z: zf + 0.04 }, [PAIR.w + 0.1, 0.1, 0.06], C.level);
      labels.push({ text: `${n0}/${d0}`, at: { x: cx, y: o.y - 0.25, z: zf }, center: true });
    }
    if (answered) reaction = lockReaction();
  } else if (scene.kind === 'lockIdle') {
    // Le sas au repos (lot L2) : sa paroi de pierre, sa vanne de bois fermée, sa tige et son volant ; rien de l'item.
    platform(4.6, 1.6, true);
    const zf = o.z + 0.35;
    b.box({ x: o.x, y: o.y, z: o.z }, [3.5, 3.5, 0.6], C.stoneDark, C.stone);
    b.box({ x: o.x, y: o.y + 0.15, z: zf }, [1.5, 1.7, 0.08], C.lever, C.deck);
    for (const dx of [-0.5, 0, 0.5]) b.box({ x: o.x + dx, y: o.y + 0.15, z: zf + 0.05 }, [0.06, 1.7, 0.03], C.deckSide);
    // La tige de la vanne, et son volant de manœuvre : une roue de fer à huit pans, face à la caméra, sur son moyeu.
    const wheel = { x: o.x, y: o.y + 2.55, z: zf + 0.12 };
    b.box({ x: o.x, y: o.y + 1.85, z: zf + 0.05 }, [0.1, wheel.y - o.y - 1.85, 0.1], C.iron);
    const r = 0.42;
    for (let k = 0; k < 8; k++) {
      const a0 = (k * Math.PI) / 4,
        a1 = ((k + 1) * Math.PI) / 4;
      b.beam({ x: wheel.x + r * Math.cos(a0), y: wheel.y + r * Math.sin(a0), z: wheel.z }, { x: wheel.x + r * Math.cos(a1), y: wheel.y + r * Math.sin(a1), z: wheel.z }, 0.07, C.iron);
    }
    b.box({ x: wheel.x, y: wheel.y - 0.09, z: wheel.z }, [0.18, 0.18, 0.12], C.iron);
    if (answered) reaction = lockReaction();
  } else if (scene.kind === 'echelle') {
    platform(4.6, 1.6, true);
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
    if (answered) reaction = lockReaction();
  } else if (scene.kind === 'quai') {
    reaction = quai(b, scene, answered, o, answerAt, scale, posed);
  }
  return { still: b.build(), labels, reaction };
}


/**
 * Le quai de la scénette des Quais (lot 3) : le quai de bois contre le bord de pierre du bassin, la bande de devant
 * libre pour Kéo et le docker, les caisses de l'item en palettes derrière elle ; la barque amarrée dans le bassin ; la
 * grue au bout est, sa flèche au-dessus du quai, son crochet. Avant la réponse, la moitié : toutes les caisses sur le
 * quai, la barque vide ; le double : les caisses du quai au fond, les nouvelles dans la barque. Après : les caisses ont
 * changé de place (la moitié dans la barque, les nouvelles sur le quai), et la bonne caisse de réponse monte au crochet
 * (la réaction, `answerAt` : sa place dans la rangée) et y reste. Le quai vide (`calcul`, les autres missions des
 * Quais) : rien sur le quai ni dans la barque, la bonne caisse monte au crochet de même.
 */
function quai(b: FacetBuilder, scene: Extract<ItemScene, { kind: 'quai' }>, answered: boolean, o: Vec3, answerAt: Vec3 | undefined, scale: number, posed: boolean): Reaction | null {
  const moved = Math.abs(scene.after - scene.before);
  const kept = scene.op === 'moitie' ? scene.after : scene.before;
  // Les caisses du devant du bloc (toutes, pour la moitié ; les nouvelles, pour le double) et celles du fond ; aucune
  // sur le quai vide (`calcul`).
  const front = crateBlock(scene.op === 'moitie' ? scene.before : moved);
  const back = scene.op === 'double' ? crateBlock(scene.before) : { w: 0, d: 0 };
  const gap = back.d ? 0.4 : 0;
  const edge = o.z + QUAY.depth / 2;
  const qd = Math.max(QUAY.depth, front.d + gap + back.d + 0.5 + QUAY.strip);
  const qw = Math.max(QUAY.width, Math.max(front.w, back.w) + 4);
  b.box({ x: o.x, y: o.y - PLATFORM_DEPTH, z: edge - qd / 2 }, [qw, PLATFORM_DEPTH, qd], C.deckSide, C.quay);
  // Les blocs de caisses, au milieu du quai, un peu à gauche (le docker et la grue sont à droite).
  const x0 = o.x - 0.4 - Math.max(front.w, back.w) / 2 + CRATE_PITCH / 2;
  const zFront = edge - QUAY.strip - front.d + CRATE_PITCH / 2;
  const zBack = zFront - gap - back.d;
  // La barque dans le bassin, contre le bord de pierre.
  const boat = quayBoat(scene, o);
  barque(b, boat.at, boat.length, boat.width);
  const onBoat = boat.cargo;
  // La grue au bout est du quai : son pied, son mât, sa flèche vers l'ouest au-dessus du quai, la corde et le crochet.
  // Tant que le haut des Quais (leur grue) n'est pas posé (`posed`), son pied de pierre seul : la grue attend.
  const mast = { x: o.x + qw / 2 - 0.9, z: edge - QUAY.strip - 0.2 };
  const hook = craneHook(o, qw);
  b.box({ x: mast.x, y: o.y, z: mast.z }, [0.8, 0.5, 0.8], C.stoneDark);
  if (posed) {
    b.box({ x: mast.x, y: o.y + 0.5, z: mast.z }, [0.32, CRANE.height - 0.5, 0.32], C.crane);
    b.box({ x: (mast.x + hook.x) / 2 - 0.3, y: o.y + CRANE.height, z: mast.z }, [mast.x - hook.x + 1, 0.24, 0.24], C.crane);
    b.box({ x: hook.x, y: hook.y + 0.3, z: hook.z }, [0.05, o.y + CRANE.height - hook.y - 0.3, 0.05], C.rope);
    liftingHook(b, { x: hook.x, y: hook.y + 0.3, z: hook.z }, C.stoneDark);
  }
  if (scene.op === 'moitie') {
    crates(b, answered ? kept : scene.before, x0, o.y, zFront);
    if (answered) crates(b, moved, onBoat.x, onBoat.y, onBoat.z);
  } else if (scene.op === 'double') {
    crates(b, kept, x0, o.y, zBack);
    if (answered) crates(b, moved, x0, o.y, zFront);
    else crates(b, moved, onBoat.x, onBoat.y, onBoat.z);
  }
  if (!answered || !answerAt) return null;
  // La bonne caisse de réponse monte au crochet, et y reste pendue ; sans grue, elle passe d'un bond dans la barque, à la
  // place que la grue lui aurait donnée.
  const r = new FacetBuilder();
  answerCrate(r, ORIGIN, scale);
  // Le haut de la caisse juste sous l'anneau du crochet.
  const to = posed ? { x: hook.x, y: hook.y - 0.4 - 0.7 * scale, z: hook.z } : boat.hold;
  return { facets: r.build(), from: answerAt, to, arc: 1.2, stay: true };
}

/**
 * La barque d'une scène de quai : assez grande pour les caisses qui partent ou arrivent (au milieu, un peu vers la
 * poupe), une place libre devant elles, côté proue, pour la caisse que la grue y descend à la réussite de la mission
 * (`hold`), et la vitre de sa lanterne de proue (`lantern`, son bas). La proue reste dans le cadre de la scénette (à
 * droite, sous la grue) : une longue barque file vers l'ouest.
 */
export function quayBoat(scene: Extract<ItemScene, { kind: 'quai' }>, o: Vec3 = sceneSpot('quais')): { at: Vec3; length: number; width: number; cargo: Vec3; hold: Vec3; lantern: Vec3 } {
  const cargo = crateBlock(Math.abs(scene.after - scene.before));
  const length = Math.max(5.2, cargo.w + 3.4);
  const width = Math.max(1.8, cargo.d + 1);
  const edge = o.z + QUAY.depth / 2;
  const at = { x: Math.min(o.x - 0.8, o.x + 3.4 - width / 2 - 0.3 - length / 2), y: 0, z: edge + 0.75 + width / 2 };
  return {
    at,
    length,
    width,
    cargo: { x: at.x - cargo.w / 2 - 0.5 + CRATE_PITCH / 2, y: at.y - 0.11, z: at.z - cargo.d / 2 + CRATE_PITCH / 2 },
    hold: { x: at.x + length / 2 - 1.25, y: at.y - 0.1, z: at.z },
    lantern: boatBow(at, length, width).lantern,
  };
}

/**
 * La réussite de la mission aux Quais (directeur artistique) : la caisse du crochet descendue dans la barque, à sa
 * place (`crate`, à l'échelle des caisses-réponses), et la vitre allumée de la lanterne de proue (`glass`, un peu plus
 * grande que l'éteinte, qu'elle recouvre ; la vue la dessine sans lumière).
 */
export function quaySuccess(scene: Extract<ItemScene, { kind: 'quai' }>, scale: number): { crate: Facets; glass: Facets; hold: Vec3 } {
  const boat = quayBoat(scene);
  const c = new FacetBuilder();
  answerCrate(c, boat.hold, scale);
  const g = new FacetBuilder();
  const k = LANTERN_GLASS * 1.15;
  g.box({ x: boat.lantern.x, y: boat.lantern.y - (k - LANTERN_GLASS) / 2, z: boat.lantern.z }, [k, k, k], C.lamp);
  return { crate: c.build(), glass: g.build(), hold: boat.hold };
}

/** La barque chargée laissée aux Quais par la réussite : dix caisses, et celle de la grue à la proue. */
const LOADED_BOAT: Extract<ItemScene, { kind: 'quai' }> = { kind: 'quai', op: 'moitie', before: 20, after: 10 };
const LOADED_BOAT_CRATE = 0.8;

/** La barque chargée laissée aux Quais : sa place, sa longueur et sa largeur (la vue cadre le retour de la scénette sur elle). */
export function loadedBoat(): { at: Vec3; length: number; width: number } {
  const { at, length, width } = quayBoat(LOADED_BOAT);
  return { at, length, width };
}

/** La grue du quai : la hauteur de sa flèche au-dessus du quai, et l'écart du crochet au bout est du quai. */
const CRANE = { height: 4.2, reach: 5.2, hookDrop: 2 } as const;

/** Le haut du crochet de la grue du quai (la corde s'y arrête), au-dessus de la bande de devant. */
export function craneHook(o: Vec3 = sceneSpot('quais'), qw: number = QUAY.width): Vec3 {
  const edge = o.z + QUAY.depth / 2;
  return { x: o.x + qw / 2 - 0.9 - CRANE.reach, y: o.y + CRANE.height - CRANE.hookDrop, z: edge - QUAY.strip - 0.2 };
}

// ---------- Les traces des scénettes ----------

/**
 * Le panier plein laissé aux Filets par la réussite de la scénette, depuis le centre du lieu : là où il s'est posé, au
 * pied du plancher de séchage, devant la pêcheuse, sur la grève (hors du plancher : dans la scénette et dans le monde,
 * il est à la même place, à la même hauteur, sans saut au retour).
 */
const FILETS_BASKET: Vec2 = { x: 5.2, z: 7.3 };

/** Le panier plein des Filets, posé sur le sable dans le monde (et dans la scénette, au pied du plancher). */
export function filetsBasketAt(): Vec3 {
  const c = placeById('filets').center;
  const at = { x: c.x + FILETS_BASKET.x, z: c.z + FILETS_BASKET.z };
  return { ...at, y: heightAt(at) };
}

/**
 * Le pan de filet raccommodé et tendu sur le séchoir des Filets (son pan du nord, places.ts, `filetsRack`), ses mailles
 * en cordes en travers et de haut en bas sur sa face tournée vers la caméra : la trace de la réussite, dans la scénette
 * puis dans le monde.
 */
export function mendedNet(b: FacetBuilder): void {
  const p = placeById('filets');
  const y0 = groundAt(p.center);
  const c = Math.cos(p.yaw),
    s = Math.sin(p.yaw);
  const at = (lx: number, lz: number) => ({ x: p.center.x + lx * c + lz * s, z: p.center.z - lx * s + lz * c });
  const rack = filetsRack();
  const yaw = p.yaw + rack.yaw;
  // Le long de la perche (`u`), et vers la caméra (`n`, à l'ouest et au sud), dans le repère du lieu.
  const u = { x: Math.cos(rack.yaw), z: -Math.sin(rack.yaw) };
  const n = { x: -u.z, z: u.x };
  const side = n.x * -0.46 + n.z * 0.88 > 0 ? 1 : -1;
  const pan = rack.pans[0];
  const w = rack.length / 2 - 0.15;
  const { bottom, height } = FILETS_RACK.pan;
  const ahead = (k: number, along = 0) => at(pan.x + side * n.x * k + u.x * along, pan.z + side * n.z * k + u.z * along);
  // Devant le pan usé du modèle, qu'il recouvre.
  const front = ahead(0.08);
  b.box({ x: front.x, y: y0 + bottom, z: front.z, yaw }, [w, height, 0.08], C.newRope);
  for (const dy of [0.35, 0.95, 1.55]) {
    const q = ahead(0.14);
    b.box({ x: q.x, y: y0 + bottom + dy, z: q.z, yaw }, [w, 0.05, 0.03], C.netLine);
  }
  for (const dx of [-w / 3, 0, w / 3]) {
    const q = ahead(0.14, dx);
    b.box({ x: q.x, y: y0 + bottom, z: q.z, yaw }, [0.05, height, 0.03], C.netLine);
  }
}

/**
 * La porte d'amont des Écluses (entre le bassin du haut et le sas du milieu), dans le monde : fermée tant que la
 * mission n'est pas réussie (le bois sombre du modèle, ses balanciers couchés sur les murs), puis ouverte, ses deux
 * vantaux neufs rabattus contre les murs du sas, de l'eau jusqu'au-dessus du mur, leurs balanciers couchés sur le mur
 * du bassin du haut, l'eau du sas montée au niveau du bassin du haut (ses murs rehaussés). Deux bornes de pierre aux
 * gonds : la porte se lit comme une porte d'écluse, jamais comme une planche posée sur l'eau.
 */
function lockGate(b: FacetBuilder, x: number, y: number, z: number, open: boolean): void {
  const hinge = z - 1.5;
  for (const side of [-1, 1]) b.box({ x: x + side * 1.95, y: y + 1.6, z: hinge }, [0.4, 0.45, 0.4], C.stoneDark, C.stone);
  if (!open) {
    b.box({ x, y: y + 0.7, z: hinge }, [3.6, 1.2, 0.3], C.lever);
    // Les balanciers couchés sur le mur du bassin du haut (son haut à 1,6), pas au-dessus.
    for (const side of [-1, 1])
      b.beam({ x: x + side * 1.5, y: y + 1.7, z: hinge }, { x: x + side * 2, y: y + 1.7, z: hinge - 1.6 }, 0.2, C.lever);
    return;
  }
  for (const side of [-1, 1]) b.box({ x: x + side * 1.95, y: y + 0.9, z }, [0.5, 0.7, 3], C.stoneDark, C.stone);
  b.box({ x, y: y + 0.9, z: z + 1.3 }, [4.4, 0.7, 0.4], C.stoneDark, C.stone);
  b.box({ x, y: y + 0.95, z: z - 0.1 }, [3.4, 0.55, 2.4], C.water, C.waterTop);
  for (const side of [-1, 1]) {
    // Le vantail, rangé contre le mur, son haut au ras du mur (rien ne dépasse de l'eau comme une planche) ; son
    // balancier couché sur le mur du bassin du haut, d'où il part de la borne.
    b.box({ x: x + side * 1.6, y: y + 1, z: hinge + 0.85 }, [0.18, 0.66, 1.5], C.newWood, C.lever);
    b.beam({ x: x + side * 1.75, y: y + 1.75, z: hinge + 0.2 }, { x: x + side * 1.95, y: y + 1.75, z: hinge - 1.8 }, 0.26, C.lever);
  }
}

/**
 * La trace que la réussite d'une scénette laisse dans son lieu (GD-20, lot 1 : les pièces durables du prototype sont
 * devenues les parties de la construction du lieu, ./construction.ts ; les traces restent). Une trace par mission jouée en
 * scénette (GD-20, point 8 : d'une mission à l'autre, seule la trace de la réussite change), tirée de `done`, les missions
 * du lieu déjà réussies : au Phare, pour la Chasse au son, les lampes de la galerie, face au sud, et une chose par autre
 * mission (`PHARE_TRACES`, lot L3) ; aux Filets, pour le Troupeau, le pan de filet raccommodé tendu sur le séchoir et le
 * panier plein à côté, et une chose par autre mission (`FILETS_TRACES`, lot L4) ; aux Écluses, pour les Nénuphars, la porte
 * d'amont ouverte et le sas rempli (fermée avant : elle est de la trace, pas du modèle, pour s'ouvrir), et une chose par
 * autre mission (`ECLUSES_TRACES`, lot L2) ; aux Quais, une chose remise en ordre sur le quai par mission
 * (`QUAIS_TRACES`). Rien avant la première réussite, sauf la porte fermée
 * des Écluses.
 */
export function placeTrace(place: PlaceId, done: readonly string[]): Facets {
  const b = new FacetBuilder();
  const p = placeById(place);
  const y0 = groundAt(p.center);
  const { x, z } = p.center;
  if (place === 'ecluses') {
    lockGate(b, x, y0, z, done.includes('number-line'));
    for (const mission of done) ECLUSES_TRACES[mission]?.(b, x, y0, z);
  }
  if (place === 'phare') {
    if (done.includes('sound-hunt')) galleryLanterns(b, x, y0 + PHARE_GALLERY, z);
    for (const mission of done) if (Object.hasOwn(PHARE_TRACES, mission)) PHARE_TRACES[mission](b, x, z);
  } else if (place === 'filets') {
    if (done.includes('plurals')) {
      mendedNet(b);
      fullBasket(b, filetsBasketAt());
    }
    for (const mission of done) if (Object.hasOwn(FILETS_TRACES, mission)) FILETS_TRACES[mission](b, x, z);
  } else if (place === 'quais') {
    for (const mission of done) QUAIS_TRACES[mission]?.(b, x, z);
  }
  return b.build();
}

/** Le dessus de la galerie du Phare (places.ts, ses abords), au-dessus du pied du lieu : ses lampes s'y posent. */
export const PHARE_GALLERY = 11.55;

/** Les lanternes de la galerie : leur poteau, puis la lanterne (socle, verre, chapeau), 0,6 unité de haut. */
export const GALLERY_LANTERN = { post: 0.35, base: 0.06, glass: 0.34, cap: 0.2, width: 0.3 } as const;

/**
 * La trace de la Chasse au son (relecture de L3, directeur artistique) : quatre lanternes à cage sombre, montants et
 * chapeau dans le gris de la toiture, verre jaune, chacune sur un poteau planté au milieu d'un pan de la rambarde face
 * au sud ; plus hautes que la rambarde, elles se découpent sur le ciel, et leur cage les sépare de la lanterne du Phare.
 */
function galleryLanterns(b: FacetBuilder, x: number, top: number, z: number): void {
  const L = GALLERY_LANTERN;
  // Le milieu d'un pan de la rambarde (un prisme à huit pans de rayon 2, places.ts) : 2·cos(π/8).
  const r = 2 * Math.cos(Math.PI / 8);
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 2 + ((k - 1.5) * Math.PI) / 4;
    const [px, pz] = [x + r * Math.cos(a), z + r * Math.sin(a)];
    let y = top;
    b.box({ x: px, y, z: pz }, [0.08, L.post, 0.08], C.slate);
    y += L.post;
    b.box({ x: px, y, z: pz }, [L.width, L.base, L.width], C.slate);
    y += L.base;
    b.box({ x: px, y, z: pz }, [L.width - 0.08, L.glass, L.width - 0.08], C.lamp);
    // Les quatre montants de la cage, aux coins du verre.
    const h = L.width / 2 - 0.03;
    for (const [dx, dz] of [[-h, -h], [h, -h], [-h, h], [h, h]] as const) b.box({ x: px + dx, y, z: pz + dz }, [0.05, L.glass, 0.05], C.slate);
    y += L.glass;
    // Le chapeau : une pyramide à quatre pans, ses arêtes sur les coins.
    b.prism({ x: px, y, z: pz, yaw: Math.PI / 4 }, (L.width / 2 + 0.03) * Math.SQRT2, 0, L.cap, 4, C.slate);
  }
}

/**
 * Où se pose la trace de chaque mission du Phare (hors de la Chasse au son, les lampes de la galerie), depuis le centre
 * du lieu, sur le plat de l'îlot, hors des chemins (la digue part au sud-est, le chemin de l'Escale au sud) et du jardin
 * de la gardienne (à l'ouest) : la corne de brume à l'est de la tour, le mât de signaux au sud-ouest ; tous deux dans le
 * champ du retour d'une scénette, au sud.
 */
export const PHARE_TRACE_SPOTS = {
  syllables: { x: 5.2, z: 2.6 },
  rhymes: { x: -4.6, z: 5 },
} as const;

/**
 * Les traces du Phare (GD-20, point 8, lot L3 : une par mission, au même lieu, dans les mêmes volumes, chacune lisible par
 * sa silhouette, sans figure ni texte, rien qui se compte ou se lise comme une réponse ; posées avec les abords, comme
 * les lampes de la galerie) :
 * - Abattage syllabique : la corne de brume, sur son socle de pierre, son pavillon rouge tourné vers le large, à l'est ;
 *   ce qui sonne au Phare quand la lanterne ne suffit pas (aucun battant, aucune cloche : les cloches portent les
 *   réponses) ;
 * - Rimes-échelle : le mât de signaux, sa vergue et une flamme rouge au vent, tenu par deux haubans à l'est et à
 *   l'ouest ; une seule flamme (rien ne se compte).
 * La Chasse au son garde la sienne : les quatre lampes de la galerie, face au sud.
 */
const PHARE_TRACES: Record<string, (b: FacetBuilder, cx: number, cz: number) => void> = {
  syllables: (b, x, z) => {
    const o = PHARE_TRACE_SPOTS.syllables;
    const g = quaiGround(x + o.x, z + o.z);
    // Le socle de pierre, qui descend dans le sol ; le caisson de la corne dessus, et son pied.
    b.box({ x: g.x, y: g.y - 0.4, z: g.z }, [1.1, 0.9, 1.0], C.stoneDark, C.stone);
    b.box({ x: g.x - 0.2, y: g.y + 0.5, z: g.z }, [0.6, 0.5, 0.6], C.post, C.lever);
    b.box({ x: g.x + 0.05, y: g.y + 0.5, z: g.z }, [0.14, 0.75, 0.14], C.iron);
    // Le pavillon, couché, sa bouche vers l'est (vers le large), vu de profil depuis le sud : un cône évasé ; le dedans
    // de sa bouche, plus sombre.
    b.prism({ x: g.x - 0.15, y: g.y + 1.25, z: g.z, pitch: Math.PI / 2, yaw: Math.PI / 2 }, 0.13, 0.48, 1.25, 10, C.knob, C.iron);
  },
  rhymes: (b, x, z) => {
    const o = PHARE_TRACE_SPOTS.rhymes;
    const g = quaiGround(x + o.x, z + o.z);
    const top = g.y + 4.6;
    b.box({ x: g.x, y: g.y - 0.4, z: g.z }, [0.8, 0.65, 0.8], C.stoneDark, C.stone);
    b.box({ x: g.x, y: g.y + 0.2, z: g.z }, [0.16, top - g.y - 0.2, 0.16], C.post);
    // La vergue, en travers, aux trois quarts du mât.
    b.box({ x: g.x, y: top - 1.3, z: g.z }, [1.9, 0.1, 0.1], C.post);
    // La flamme : un long triangle au vent, vers l'est, sous la pomme du mât ; ses deux faces se voient.
    const at = (dx: number, dy: number, dz: number) => [g.x + dx, top + dy, g.z + dz] as const;
    for (const dz of [-0.02, 0.02]) {
      const [a, c, d] = [at(0.08, -0.15, dz), at(0.08, -0.85, dz), at(1.7, -0.45, dz)];
      if (dz > 0) b.triangle(a, c, d, C.knob);
      else b.triangle(a, d, c, C.knob);
    }
    b.box({ x: g.x, y: top, z: g.z }, [0.24, 0.16, 0.24], C.paint);
    // Deux haubans, de la tête du mât à deux piquets plantés à l'est et à l'ouest.
    for (const dx of [-1, 1]) {
      const foot = quaiGround(g.x + 1.4 * dx, g.z);
      b.beam({ x: g.x, y: top - 0.2, z: g.z }, { x: foot.x, y: foot.y + 0.2, z: foot.z }, 0.04, C.rope);
      b.box({ x: foot.x, y: foot.y - 0.2, z: foot.z }, [0.12, 0.45, 0.12], C.post);
    }
  },
};

/**
 * Où se pose la trace de chaque mission des Filets (hors du Troupeau, le filet raccommodé et le panier plein), depuis le
 * centre du lieu, dans le champ du retour d'une scénette (Kéo devant le séchoir, au sud) : le vivier dans l'eau, à un
 * pas du bord (ses pieds immergés, l'eau dedans ; relecture de L4), au sud-est du séchoir ; la pyramide de nasses contre le pan sud du séchoir, côté sable (le pan nord porte le filet
 * raccommodé) ; le carrelet sur le replat de l'eau, à l'est du séchoir, son bras vers le large.
 */
export const FILETS_TRACE_SPOTS = {
  'word-classes': { x: 6.6, z: 2.6 },
  sorting: { x: 2.04, z: 2.71 },
  'e-er-ez': { x: 4.0, z: 0.9 },
} as const;

/** Le vivier de l'Enclos : neuf pieux en cercle, de ce rayon, leur tête au-dessus de l'eau. */
export const FILETS_VIVIER = { stakes: 9, radius: 0.85, top: 0.55 } as const;

/** Le carrelet de la Récolte : son plancher sur pilotis, au-dessus de l'eau, et le bout de son bras, la trace la plus haute du lieu. */
export const FILETS_CARRELET = { deck: 1.25, tip: 3.4, reach: 3.3, frame: 0.9 } as const;

/** Le sol, ou le fond sous l'eau, en (x, z) : les pieux et les pilotis y plantent leur pied. */
const bedAt = (x: number, z: number): number => Math.min(heightAt({ x, z }), 0) - 0.1;

/**
 * Les traces des Filets (GD-20, point 8, lot L4 : une par mission, au même lieu, en volumes du code aux couleurs du lieu,
 * bois clair et sombre, cordes, paille ; sans rouge ni texte, rien qui se compte ou se lise comme une réponse ; posées
 * avec les abords) :
 * - Enclos : un vivier de neuf pieux en cercle dans l'eau du bord, un filet tendu de l'un à l'autre ;
 * - Tri des graines : une pyramide de nasses d'osier (cônes couchés, trois, deux, une) contre le séchoir ;
 * - Récolte : un carrelet, plancher sur pilotis, long bras levé vers le large et filet carré pendu au-dessus de l'eau,
 *   la trace la plus haute du lieu.
 * Le Troupeau garde la sienne : le filet raccommodé sur le séchoir et le panier plein.
 */
const FILETS_TRACES: Record<string, (b: FacetBuilder, cx: number, cz: number) => void> = {
  'word-classes': (b, x, z) => {
    const o = FILETS_TRACE_SPOTS['word-classes'];
    const { stakes, radius, top } = FILETS_VIVIER;
    const at = (k: number) => {
      const a = (2 * Math.PI * k) / stakes;
      return { x: x + o.x + radius * Math.cos(a), z: z + o.z + radius * Math.sin(a) };
    };
    for (let k = 0; k < stakes; k++) {
      const p = at(k);
      const q = at(k + 1);
      const bed = bedAt(p.x, p.z);
      b.box({ x: p.x, y: bed, z: p.z }, [0.13, top - bed, 0.13], C.deckSide, C.deck);
      // Le filet, de pieu en pieu, de sous l'eau à mi-hauteur des pieux : une nappe sans épaisseur, vue des deux côtés
      // (quatre triangles au lieu des dix d'un pavé : ce qu'ils gagnent paie les anneaux des nasses).
      const lo = -0.15,
        hi = 0.35;
      const a0 = [p.x, lo, p.z] as const,
        a1 = [q.x, lo, q.z] as const,
        b1 = [q.x, hi, q.z] as const,
        b0 = [p.x, hi, p.z] as const;
      b.quad(a0, a1, b1, b0, C.netLine);
      b.quad(a1, a0, b0, b1, C.netLine);
    }
  },
  sorting: (b, x, z) => {
    const o = FILETS_TRACE_SPOTS.sorting;
    const g = quaiGround(x + o.x, z + o.z);
    // Le long du séchoir (`u`, dans le monde : le séchoir est tourné avec le lieu), et du pan sud vers le sable (`axis`).
    const p = placeById('filets');
    const rack = filetsRack();
    const rackYaw = p.yaw + rack.yaw;
    const u = { x: Math.cos(rackYaw), z: -Math.sin(rackYaw) };
    const pan = rack.pans[1];
    const c = Math.cos(p.yaw),
      sn = Math.sin(p.yaw);
    const away = { x: g.x - (x + pan.x * c + pan.z * sn), z: g.z - (z - pan.x * sn + pan.z * c) };
    const side = away.x * -u.z + away.z * u.x > 0 ? 1 : -1;
    const axis = { x: -u.z * side, z: u.x * side };
    const r = 0.24,
      len = 0.8;
    const yaw = Math.atan2(axis.x, axis.z);
    // Trois, deux, une : chaque cône couché, sa bouche vers le sable, sa pointe contre le pan du séchoir.
    for (const [row, count] of [
      [0, 3],
      [1, 2],
      [2, 1],
    ] as const)
      for (let i = 0; i < count; i++) {
        const along = (i - (count - 1) / 2) * 2 * r;
        const mouth = { x: g.x + u.x * along + axis.x * (len / 2), y: g.y + r + row * 1.7 * r, z: g.z + u.z * along + axis.z * (len / 2) };
        // Le cône, de la bouche vers le séchoir ; à la bouche, un anneau d'osier clair (relecture de L4 : la nasse ne se
        // lit plus comme un tronc), et le dedans sombre, un cône bas posé sur lui.
        b.prism({ ...mouth, yaw: yaw + Math.PI, pitch: Math.PI / 2 }, r, 0.06, len, 8, C.newRope, C.deck);
        b.prism({ ...mouth, yaw, pitch: Math.PI / 2 }, r + 0.03, r + 0.03, 0.04, 8, C.canvas);
        b.prism({ x: mouth.x + axis.x * 0.04, y: mouth.y, z: mouth.z + axis.z * 0.04, yaw, pitch: Math.PI / 2 }, r - 0.07, 0, 0.03, 8, C.deckSide);
      }
  },
  'e-er-ez': (b, x, z) => {
    const o = FILETS_TRACE_SPOTS['e-er-ez'];
    const g = { x: x + o.x, z: z + o.z };
    const { deck, tip: tipY, reach, frame } = FILETS_CARRELET;
    // Le bras vers le large, au nord-est.
    const d = { x: 0.55, z: -0.835 };
    const q = { x: -d.z, z: d.x };
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      const px = g.x + sx * 0.55,
        pz = g.z + sz * 0.55;
      const bed = bedAt(px, pz);
      b.box({ x: px, y: bed, z: pz }, [0.14, deck - bed, 0.14], C.deckSide);
    }
    b.box({ x: g.x, y: deck, z: g.z }, [1.4, 0.12, 1.4], C.deckSide, C.deck);
    // Le poteau du pivot, et le bras qui passe dessus : son contrepoids au bout du plancher, sa pointe au-dessus de l'eau.
    const pivot = { x: g.x + d.x * 0.5, z: g.z + d.z * 0.5 };
    b.box({ x: pivot.x, y: deck + 0.12, z: pivot.z }, [0.16, 1.1, 0.16], C.deckSide);
    const back = { x: g.x - d.x * 0.6, y: deck + 0.85, z: g.z - d.z * 0.6 };
    const tip = { x: g.x + d.x * reach, y: tipY, z: g.z + d.z * reach };
    b.beam(back, tip, 0.12, C.deck);
    b.box({ x: back.x, y: back.y - 0.45, z: back.z }, [0.32, 0.36, 0.32], C.deckSide);
    // Le filet carré pendu au bout du bras, à un pas au-dessus de l'eau : quatre cordes, son cadre, ses deux arceaux
    // croisés et la nappe.
    const y = 0.55;
    const corner = (a: number, c: number) => ({ x: tip.x + (a * d.x + c * q.x) * frame, y, z: tip.z + (a * d.z + c * q.z) * frame });
    const corners = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
    for (const [k, c] of corners.entries()) {
      b.beam(tip, c, 0.03, C.netLine);
      b.beam(c, corners[(k + 1) % 4], 0.06, C.deck);
    }
    b.beam({ ...corners[0], y: y + 0.05 }, { ...corners[2], y: y + 0.05 }, 0.05, C.deckSide);
    b.beam({ ...corners[1], y: y + 0.05 }, { ...corners[3], y: y + 0.05 }, 0.05, C.deckSide);
    b.box({ x: tip.x, y: y - 0.12, z: tip.z, yaw: Math.atan2(-d.z, d.x) }, [2 * frame, 0.02, 2 * frame], C.netLine);
  },
};

/** Un point du quai, depuis le centre des Quais (`x`, `z`), au sol. */
const quaiGround = (x: number, z: number): Vec3 => ({ x, y: groundAt({ x, z }), z });

/**
 * Où se pose la trace de chaque mission des Quais, depuis le centre du lieu (sur le terre-plein entre le hangar et le
 * bassin, au sud, dans le champ du retour d'une scénette ; l'eau du bassin pour la barque du passeur ; le bout nord du
 * ponton, au plus près du crochet de la grue, pour la palette de dix).
 */
export const QUAIS_TRACE_SPOTS = {
  'times-tables': { x: 5.6, z: 8.4 },
  'make-ten': { x: -5.4, z: -0.45 },
  'word-problems': { x: 6.6, z: 13.6 },
  measures: { x: 8.9, z: 9.6 },
} as const;

/** Le crochet de la grue des Quais (places.ts) : sa place depuis le centre du lieu et le bas de sa moufle, au-dessus du pied du lieu. */
const QUAIS_HOOK = { x: -5.6, z: -3.5, y: 3 } as const;
/** Le dessus du ponton des Quais (places.ts), au-dessus du pied du lieu. */
const QUAIS_DECK_TOP = 0.6;

/** Une caisse simple, posée en `at` (son pied), de côté `s` : le bois des caisses, son dessus plus clair. */
const plainCrate = (b: FacetBuilder, at: Vec3, s: number) => b.box(at, [s, s * 0.85, s * 0.85], C.crate, C.crateTop);

/**
 * Les traces des Quais (GD-20, point 8, lot L1 : une par mission, au même quai, dans les mêmes volumes ; revues sur les
 * avis du directeur artistique et du consultant Archipéo) :
 * - Doubles et moitiés : la grue remontée (sa cabine, sa contre-flèche et son contrepoids) et la barque chargée,
 *   amarrée au bord de quai, sa lanterne de proue allumée ;
 * - Champ des tables : un rayonnage de bois à trois niveaux, ses caisses alignées en rangées ;
 * - Pont de dix : la palette de dix au bout du ponton, au plus près du crochet de la grue, élinguée (quatre brins
 *   réunis à un anneau, l'amarre tendue vers le crochet), prête à lever ;
 * - Carnet du passeur : la petite barque du passeur, vide, amarrée dans le bassin, sa passerelle à garde-corps posée sur
 *   le bord de quai (le passeur est un rôle, sans personnage) ;
 * - Mesures et figures : la balance du quai, son socle de bois sombre, son fléau et ses deux plateaux, à égalité.
 * Rien à lire n'est peint ; les caisses ne se comptent pas (aucune ne dit la réponse d'une mission). Les bois sombres
 * des montants, des socles et des palettes détachent chaque trace du terre-plein clair.
 */
const QUAIS_TRACES: Record<string, (b: FacetBuilder, cx: number, cz: number) => void> = {
  'doubles-halves': (b, x, z) => {
    const y0 = groundAt({ x, z });
    // La grue remontée : sa cabine autour du mât, et sa contre-flèche (le prolongement de la flèche derrière le mât),
    // son contrepoids pendu dessous, contre elle : rien ne flotte (directeur artistique).
    const mast = { x: x - 2.6, z: z - 1.6 };
    b.box({ x: mast.x, y: y0 + 4.6, z: mast.z }, [1, 1, 1], C.paint, C.newWood);
    // L'axe de la flèche (places.ts, les Quais) : du mât vers le ponton, au nord-ouest ; la contre-flèche à l'opposé.
    const a = Math.atan2(1, 1.6);
    const back = { x: Math.cos(a), z: Math.sin(a) };
    b.box({ x: mast.x + back.x * 0.85, y: y0 + 6.3, z: mast.z + back.z * 0.85, yaw: -a }, [1.9, 0.4, 0.4], C.newWood);
    b.box({ x: mast.x + back.x * 1.45, y: y0 + 5.45, z: mast.z + back.z * 1.45, yaw: -a }, [0.75, 0.85, 0.75], C.paint);
    // La barque chargée amarrée au bord de quai, sa lanterne de proue allumée : ce que la réussite de la scénette a
    // laissé (directeur artistique), vu ensuite depuis le monde ouvert.
    const boat = quayBoat(LOADED_BOAT);
    barque(b, boat.at, boat.length, boat.width);
    crates(b, 10, boat.cargo.x, boat.cargo.y, boat.cargo.z);
    answerCrate(b, boat.hold, LOADED_BOAT_CRATE);
    b.append(quaySuccess(LOADED_BOAT, LOADED_BOAT_CRATE).glass);
  },
  'times-tables': (b, x, z) => {
    const o = QUAIS_TRACE_SPOTS['times-tables'];
    const g = quaiGround(x + o.x, z + o.z);
    const w = 2.3, d = 0.8, levels = [0.12, 0.86, 1.6];
    // Les quatre montants, puis les trois planches, chacune portant sa rangée de trois caisses.
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box({ x: g.x + sx * (w / 2 - 0.06), y: g.y, z: g.z + sz * (d / 2 - 0.06) }, [0.12, 2.25, 0.12], C.post);
    for (const ly of levels) {
      b.box({ x: g.x, y: g.y + ly - 0.08, z: g.z }, [w, 0.08, d], C.post, C.newWood);
      for (const dx of [-0.7, 0, 0.7]) plainCrate(b, { x: g.x + dx, y: g.y + ly, z: g.z }, 0.52);
    }
  },
  'make-ten': (b, x, z) => {
    const y0 = groundAt({ x, z });
    const o = QUAIS_TRACE_SPOTS['make-ten'];
    const deck = y0 + QUAIS_DECK_TOP;
    // La palette de dix, deux rangées de cinq, sur le bout du ponton.
    crates(b, 10, x + o.x - 2 * CRATE_PITCH, deck, z + o.z - CRATE_PITCH / 2);
    // Les élingues : quatre brins des coins du chargement à l'anneau, au-dessus de son milieu ; l'amarre de l'anneau au
    // crochet de la grue, tendue : la palette est prête à lever.
    const top = deck + 0.06 + CRATE;
    const ring = { x: x + o.x, y: top + 0.9, z: z + o.z };
    const hw = 2.5 * CRATE_PITCH, hd = CRATE_PITCH;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.beam({ x: x + o.x + sx * hw, y: top, z: z + o.z + sz * hd }, ring, 0.05, C.rope);
    b.box({ x: ring.x, y: ring.y - 0.06, z: ring.z }, [0.22, 0.12, 0.22], C.iron);
    b.beam(ring, { x: x + QUAIS_HOOK.x, y: y0 + QUAIS_HOOK.y, z: z + QUAIS_HOOK.z }, 0.06, C.rope);
  },
  'word-problems': (b, x, z) => {
    const o = QUAIS_TRACE_SPOTS['word-problems'];
    const at = { x: x + o.x, y: 0, z: z + o.z };
    // Plus petite que la barque chargée, vide : sa silhouette la distingue, pas sa couleur.
    barque(b, at, 2.4, 1.0);
    // La passerelle : une planche large du bord de quai au plat-bord, et ses deux garde-corps ; les deux taquets.
    const edge = DOCK_EDGE.from.z;
    const deck = groundAt({ x: at.x, z: edge - 0.6 });
    const from = { x: at.x - 0.2, y: deck + 0.05, z: edge - 0.5 };
    const to = { x: at.x - 0.2, y: 0.2, z: at.z - 0.2 };
    b.beam(from, to, 0.7, C.newWood);
    for (const side of [-1, 1]) b.beam({ x: from.x + side * 0.33, y: from.y + 0.55, z: from.z }, { x: to.x + side * 0.33, y: to.y + 0.55, z: to.z }, 0.06, C.post);
    for (const dx of [-1.0, 0.6]) b.box({ x: at.x + dx, y: deck, z: edge - 0.35 }, [0.2, 0.25, 0.2], C.post);
  },
  measures: (b, x, z) => {
    const o = QUAIS_TRACE_SPOTS.measures;
    const g = quaiGround(x + o.x, z + o.z);
    // La balance du quai : son socle de bois sombre, son pied, son fléau en travers, et ses deux plateaux pendus, à
    // égalité ; une caisse à côté, attendant sa pesée.
    b.box({ x: g.x, y: g.y, z: g.z }, [1.4, 0.2, 1.1], C.post, C.lever);
    b.box({ x: g.x, y: g.y + 0.2, z: g.z - 0.35 }, [0.16, 1.5, 0.16], C.post);
    b.box({ x: g.x, y: g.y + 1.7, z: g.z - 0.35 }, [1.5, 0.1, 0.12], C.paint);
    for (const side of [-1, 1]) {
      b.box({ x: g.x + side * 0.7, y: g.y + 1.12, z: g.z - 0.35 }, [0.03, 0.58, 0.03], C.rope);
      b.prism({ x: g.x + side * 0.7, y: g.y + 1.06, z: g.z - 0.35 }, 0.26, 0.2, 0.06, 8, C.bucket);
    }
    answerCrate(b, { x: g.x + 0.25, y: g.y + 0.2, z: g.z + 0.15 }, 0.6);
  },
};

/**
 * Où se pose la trace de chaque mission des Écluses (hors des Nénuphars, la porte d'amont ouverte), depuis le centre du
 * lieu : la barque dans le bassin d'aval, la table devant la maison de l'éclusier, l'escalier contre le mur est du
 * bassin d'aval, la lanterne du sas sur le coin sud-ouest de ce bassin ; tous dans le champ du retour d'une scénette, au sud.
 */
export const ECLUSES_TRACE_SPOTS = {
  equivalence: { x: 0, z: 3 },
  sharing: { x: 4.1, z: 5.2 },
  'place-value': { x: 2.75, z: 2.6 },
  'fraction-sums': { x: -2.05, z: 4.35 },
} as const;

/** Le haut des murs des bassins des Écluses (places.ts), au-dessus du pied du lieu : le bassin du milieu, celui d'aval. */
const ECLUSES_TOPS = { middle: 0.9, low: 0.2 } as const;

/**
 * Les traces des Écluses (GD-20, point 8, lot L2 : une par mission, au même lieu, dans les mêmes volumes, chacune lisible
 * par sa silhouette, sans figure ni texte, rien qui se compte ou se lise comme une réponse) :
 * - Deux rives : une barque amarrée dans le bassin d'aval, à flot, son amarre à une bitte du mur ;
 * - Partage du gâteau : la table de l'éclusier et ses deux bancs, devant sa maison, rien dessus ;
 * - Galets en colonnes : l'escalier de pierre contre le mur est du bassin d'aval, du quai du sas au bord de l'eau, sa
 *   main courante de bois ;
 * - Calculer avec des fractions : la lanterne du sas, un poteau de bois sur le coin du bassin d'aval, sa lanterne allumée.
 * Les Nénuphars gardent la leur : la porte d'amont ouverte et le sas rempli (`lockGate`).
 */
const ECLUSES_TRACES: Record<string, (b: FacetBuilder, cx: number, y0: number, cz: number) => void> = {
  equivalence: (b, x, y0, z) => {
    const o = ECLUSES_TRACE_SPOTS.equivalence;
    const at = { x: x + o.x - 0.2, y: y0 + ECLUSES_TOPS.low + 0.12, z: z + o.z };
    barque(b, at, 1.7, 0.95);
    // La bitte sur le mur ouest, et l'amarre jusqu'à la poupe.
    const bollard = { x: x - 2.0, y: y0 + ECLUSES_TOPS.low, z: at.z - 0.3 };
    b.prism(bollard, 0.13, 0.11, 0.3, 8, C.iron);
    b.beam({ x: bollard.x, y: bollard.y + 0.22, z: bollard.z }, { x: at.x - 0.85, y: at.y + 0.05, z: at.z - 0.1 }, 0.05, C.rope);
  },
  sharing: (b, x, _y0, z) => {
    const o = ECLUSES_TRACE_SPOTS.sharing;
    const g = { x: x + o.x, y: groundAt({ x: x + o.x, z: z + o.z }), z: z + o.z };
    const low = g.y - 0.3;
    // La table : son plateau clair sur quatre pieds sombres, assez hauts pour descendre dans la pente ; deux bancs.
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box({ x: g.x + sx * 0.6, y: low, z: g.z + sz * 0.3 }, [0.1, 1.05, 0.1], C.post);
    b.box({ x: g.x, y: g.y + 0.75, z: g.z }, [1.5, 0.1, 0.85], C.post, C.newWood);
    for (const sz of [-1, 1]) {
      for (const sx of [-1, 1]) b.box({ x: g.x + sx * 0.55, y: low, z: g.z + sz * 0.75 }, [0.08, 0.72, 0.08], C.post);
      b.box({ x: g.x, y: g.y + 0.42, z: g.z + sz * 0.75 }, [1.4, 0.08, 0.3], C.post, C.newWood);
    }
  },
  'place-value': (b, x, y0, z) => {
    const o = ECLUSES_TRACE_SPOTS['place-value'];
    // Quatre marches, du haut du mur du sas (au nord) au haut du mur d'aval (au sud), contre le mur est ; leur pierre
    // descend jusqu'au sol ; la main courante de bois, sur deux poteaux.
    const steps = 4;
    const run = 0.55;
    const from = y0 + ECLUSES_TOPS.middle;
    const to = y0 + ECLUSES_TOPS.low;
    const base = Math.min(groundAt({ x: x + o.x, z: z + o.z + 1 }), to) - 0.6;
    const step = (k: number) => ({ top: from - ((from - to) * (k + 1)) / (steps + 1), z: z + o.z - 0.8 + k * run });
    for (let k = 0; k < steps; k++) b.box({ x: x + o.x, y: base, z: step(k).z }, [0.9, step(k).top - base, run], C.stoneDark, C.stone);
    const rail = (k: number) => ({ x: x + o.x + 0.5, y: step(k).top + 0.75, z: step(k).z });
    for (const k of [0, steps - 1]) b.box({ x: rail(k).x, y: rail(k).y - 0.75, z: rail(k).z }, [0.08, 0.78, 0.08], C.post);
    b.beam(rail(0), rail(steps - 1), 0.08, C.newWood);
  },
  'fraction-sums': (b, x, y0, z) => {
    const o = ECLUSES_TRACE_SPOTS['fraction-sums'];
    const at = { x: x + o.x, y: y0 + ECLUSES_TOPS.low, z: z + o.z };
    // La lanterne du sas : un socle de pierre sur le coin du mur, un poteau, un bras, et la lanterne pendue, sa vitre allumée.
    b.box(at, [0.45, 0.25, 0.45], C.stoneDark, C.stone);
    b.box({ x: at.x, y: at.y + 0.25, z: at.z }, [0.16, 2.7, 0.16], C.post);
    b.box({ x: at.x + 0.35, y: at.y + 2.85, z: at.z }, [0.85, 0.12, 0.12], C.post);
    const lamp = { x: at.x + 0.65, y: at.y + 2.15, z: at.z };
    b.box({ x: lamp.x, y: lamp.y + 0.52, z: lamp.z }, [0.05, 0.18, 0.05], C.iron);
    b.box({ x: lamp.x, y: lamp.y - 0.06, z: lamp.z }, [0.4, 0.07, 0.4], C.stoneDark);
    b.box({ x: lamp.x, y: lamp.y, z: lamp.z }, [0.32, 0.4, 0.32], C.lamp);
    b.box({ x: lamp.x, y: lamp.y + 0.4, z: lamp.z }, [0.46, 0.1, 0.46], C.stoneDark);
  },
};
