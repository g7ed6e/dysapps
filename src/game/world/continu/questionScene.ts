// La scène d'une question dans un lieu (lot 4) : ce que le lieu montre de l'item (la pêche sur le filet, l'eau dans le
// sas ou sur l'échelle, les caisses en palettes de dix sur le quai), les objets qui portent les réponses (cloches,
// paniers, leviers, caisses à plaque) sur un ponton, le geste de la réaction, et les pièces durables du lieu remises en
// marche. Tout en volumes simples, en aplats ; rien à lire n'est peint : les mots, les nombres et les repères de
// l'échelle sont des panneaux de la page, accrochés aux points que donne ce fichier. Code pur : la vue dessine.
import { boundsOf, FacetBuilder, type Facets } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { WHEEL } from './places';
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
  newWood: 0xc28a52,
  paint: 0xd9a441,
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
    hangBells(b, points, s, picked, look.hanging);
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
    reaction = quai(b, scene, answered, o, answerAt, scale);
  }
  return { still: b.build(), labels, reaction };
}


/**
 * Le quai de la scénette des Quais (lot 3) : le quai de bois contre le bord de pierre du bassin, la bande de devant
 * libre pour Kéo et le docker, les caisses de l'item en palettes derrière elle ; la barque amarrée dans le bassin ; la
 * grue au bout est, sa flèche au-dessus du quai, son crochet. Avant la réponse, la moitié : toutes les caisses sur le
 * quai, la barque vide ; le double : les caisses du quai au fond, les nouvelles dans la barque. Après : les caisses ont
 * changé de place (la moitié dans la barque, les nouvelles sur le quai), et la bonne caisse de réponse monte au crochet
 * (la réaction, `answerAt` : sa place dans la rangée) et y reste.
 */
function quai(b: FacetBuilder, scene: Extract<ItemScene, { kind: 'quai' }>, answered: boolean, o: Vec3, answerAt: Vec3 | undefined, scale: number): Reaction | null {
  const moved = Math.abs(scene.after - scene.before);
  const kept = scene.op === 'moitie' ? scene.after : scene.before;
  // Les caisses du devant du bloc (toutes, pour la moitié ; les nouvelles, pour le double) et celles du fond.
  const front = crateBlock(scene.op === 'moitie' ? scene.before : moved);
  const back = scene.op === 'moitie' ? { w: 0, d: 0 } : crateBlock(scene.before);
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
  const mast = { x: o.x + qw / 2 - 0.9, z: edge - QUAY.strip - 0.2 };
  const hook = craneHook(o, qw);
  b.box({ x: mast.x, y: o.y, z: mast.z }, [0.8, 0.5, 0.8], C.stoneDark);
  b.box({ x: mast.x, y: o.y + 0.5, z: mast.z }, [0.32, CRANE.height - 0.5, 0.32], C.crane);
  b.box({ x: (mast.x + hook.x) / 2 - 0.3, y: o.y + CRANE.height, z: mast.z }, [mast.x - hook.x + 1, 0.24, 0.24], C.crane);
  b.box({ x: hook.x, y: hook.y + 0.3, z: hook.z }, [0.05, o.y + CRANE.height - hook.y - 0.3, 0.05], C.rope);
  liftingHook(b, { x: hook.x, y: hook.y + 0.3, z: hook.z }, C.stoneDark);
  if (scene.op === 'moitie') {
    crates(b, answered ? kept : scene.before, x0, o.y, zFront);
    if (answered) crates(b, moved, onBoat.x, onBoat.y, onBoat.z);
  } else {
    crates(b, kept, x0, o.y, zBack);
    if (answered) crates(b, moved, x0, o.y, zFront);
    else crates(b, moved, onBoat.x, onBoat.y, onBoat.z);
  }
  if (!answered || !answerAt) return null;
  // La bonne caisse de réponse monte au crochet, et y reste pendue.
  const r = new FacetBuilder();
  answerCrate(r, ORIGIN, scale);
  // Le haut de la caisse juste sous l'anneau du crochet.
  return { facets: r.build(), from: answerAt, to: { x: hook.x, y: hook.y - 0.4 - 0.7 * scale, z: hook.z }, arc: 1.2, stay: true };
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
 * Le pan de filet raccommodé et tendu sur le séchoir des Filets (le pan de l'ouest), ses mailles en cordes en travers
 * et de haut en bas sur sa face sud : la trace de la réussite, dans la scénette puis dans le monde.
 */
export function mendedNet(b: FacetBuilder): void {
  const p = placeById('filets');
  const y0 = groundAt(p.center);
  const c = Math.cos(p.yaw),
    s = Math.sin(p.yaw);
  const at = (lx: number, lz: number) => ({ x: p.center.x + lx * c + lz * s, z: p.center.z - lx * s + lz * c });
  // Devant le pan usé du modèle (sur la perche à 2,4 du centre, vers le sud), qu'il recouvre.
  const pan = at(-1.3, 2.48);
  b.box({ x: pan.x, y: y0 + 0.6, z: pan.z, yaw: p.yaw }, [2.4, 2.1, 0.08], C.newRope);
  const front = at(-1.3, 2.54);
  for (const dy of [0.95, 1.65, 2.35]) b.box({ x: front.x, y: y0 + dy, z: front.z, yaw: p.yaw }, [2.4, 0.05, 0.03], C.netLine);
  for (const dx of [-0.8, 0, 0.8]) {
    const q = at(-1.3 + dx, 2.54);
    b.box({ x: q.x, y: y0 + 0.6, z: q.z, yaw: p.yaw }, [0.05, 2.1, 0.03], C.netLine);
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
 * Les pièces d'un lieu, de 0 à 2 (deux niveaux de réaction, directeur artistique ; à valider par le consultant
 * Archipéo) : au Phare, les lampes de la galerie (une moitié, puis tout le tour ; la lanterne reste éteinte jusqu'à la
 * Conque) ; aux Filets, un pan de filet raccommodé et tendu sur le séchoir et le panier plein à côté (la trace de la
 * scénette), puis une barque à l'eau ; aux Écluses, la porte d'amont ouverte et le sas rempli (fermée avant : elle est
 * des pièces, pas du modèle, pour s'ouvrir), puis la Roue qui tourne ; aux Quais, la grue remontée et la barque chargée,
 * puis le quai rouvert.
 */
export function placePieces(place: PlaceId, count: number): PlacePieces {
  const b = new FacetBuilder();
  const p = placeById(place);
  const y0 = groundAt(p.center);
  const { x, z } = p.center;
  let wheel: PlacePieces['wheel'] = null;
  if (place === 'ecluses') lockGate(b, x, y0, z, count >= 1);
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
    mendedNet(b);
    fullBasket(b, filetsBasketAt());
    if (count >= 2) {
      const w = firstWater([at(5, -3), at(-5, -3.5), at(0, -5.5), at(6.5, 1), at(-6.5, 1)]);
      boat(b, w.x, 0.15, w.z, 2.6);
    }
  } else if (place === 'ecluses') {
    if (count >= 2) {
      // Centrée sur son axe (elle tourne autour) : le tambour fermé, et cinq pales qui le traversent.
      const w = new FacetBuilder();
      w.drum({ x: -0.25, y: 0, z: 0, yaw: Math.PI / 2, pitch: Math.PI / 2 }, WHEEL.r + 0.05, 0.5, 10, C.newWood, C.paint);
      for (let k = 0; k < 5; k++) {
        const a = (k * Math.PI) / 5;
        w.box({ x: 0, y: -1.65 * Math.cos(a), z: -1.65 * Math.sin(a), pitch: a }, [0.6, 3.3, 0.16], C.paint);
      }
      wheel = {
        facets: w.build(),
        at: { x: x + WHEEL.x, y: y0 + WHEEL.y, z: z + WHEEL.z },
      };
    }
  } else {
    // La grue remontée : son contrepoids et sa cabine, repeints.
    b.box({ x: x - 1.4, y: y0 + 5.7, z: z - 0.9 }, [1, 0.9, 0.9], C.paint);
    b.box({ x: x - 2.6, y: y0 + 4.6, z: z - 1.6 }, [1, 1, 1], C.paint, C.newWood);
    // La barque chargée amarrée au bord de quai, sa lanterne de proue allumée : ce que la réussite de la scénette a
    // laissé (directeur artistique), vu ensuite depuis le monde ouvert.
    const boat = quayBoat(LOADED_BOAT);
    barque(b, boat.at, boat.length, boat.width);
    crates(b, 10, boat.cargo.x, boat.cargo.y, boat.cargo.z);
    answerCrate(b, boat.hold, LOADED_BOAT_CRATE);
    const g = quaySuccess(LOADED_BOAT, LOADED_BOAT_CRATE).glass;
    b.append(g);
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
