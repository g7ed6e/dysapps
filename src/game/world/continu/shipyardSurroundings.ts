/**
 * Les abords de la scénette du Chantier naval (reprise lieu par lieu, sans concept 2D : d'après l'évaluation du directeur
 * artistique du 18 octobre 2026, « meilleure ruine, la coque aux membrures dressées ») : un chantier qui travaille autour
 * de la coque. Sous elle et derrière, un sol de sable clair et de planches au lieu de la grève ocre et de l'ombre peinte
 * du lieu ; la coque sur sa cale de bois, qui descend de l'atelier jusque dans l'eau, ses deux rails dessus (de dos et de
 * côté, elle prolonge le décor vers la mer) ; au nord-est, dans la moitié droite du cadre de face, la petite grue de bois
 * sur son plancher, sa flèche penchée vers l'étrave et une planche de bordé pendue à son croc, une pile de planches et
 * des tonneaux sur un plancher, un tas de rondins contre l'atelier ; au pied de la cale, dans l'eau, une barque amarrée à
 * son pieu (de face, la mer est derrière la caméra : on la voit de côté et de dos). Fini tout autour, puisque la caméra
 * tourne à deux doigts (« Caméra libre »).
 *
 * Rien de haut entre la caméra de face et la scène, ni près de Kéo, du charpentier et de la planche de bordé (l'objet
 * témoin) : ce qui est haut (la grue) se tient au nord, hors du cercle où la caméra tourne. Le kit commun (./surroundingsKit.ts) pour la barque, les
 * tonneaux et les piles de planches. Aplats francs, une couleur par facette, jamais presque noir. Code pur, sans Three.js.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { SHIPYARD, SLIP_N, SLIP_U, slipPoint, slipRails } from './places';
import { COLORS_6E, PATH_NODES, placeById } from './plan6e';
import { SHADOW_DIR } from './sky';
import type { SurroundingsState } from './surroundings';
import { TIMBER, barque, barqueFloor, barrel, groundAt as groundOf, plankStack, quadToward, type P3 } from './surroundingsKit';
import { buildHeightField, heightAt, heightOnMesh, standingHeight } from './terrain';

/** Les couleurs des abords du Chantier naval : le sable et le bois du chantier. */
const C = {
  /** Le sable clair du chantier (le sable des plages), et le sable tassé le long de la cale, un ton plus chaud. */
  sand: COLORS_6E.sand,
  trodden: 0xdcbc86,
  /** La cale : le dessus de ses planches, leur tranche, leurs joints ; ses rails (le bois de la quille du lieu). */
  slip: 0xbf9566,
  slipSide: 0x8a6440,
  slipSeam: 0x9c754b,
  rail: 0x8a5a36,
  /** La grue : son bois, plus sombre au mât ; le chanvre de son filin, son croc. */
  crane: 0xa57a4f,
  craneDark: 0x8a6440,
  rope: 0x8f7a5c,
  hook: 0x7f8b90,
  /** La planche de bordé pendue au croc (le bordé du lieu). */
  planking: 0xc98e55,
  /** Les rondins : leur écorce, leur bout coupé. */
  log: 0x8f6a45,
  logEnd: 0xd8b07a,
  /** Les pieux (le bois des pieux des pontons). */
  pile: 0x7a5538,
} as const;

/** Le centre du lieu et la hauteur de son sol : le repère du modèle du lieu (places.ts). */
function site(): { x: number; z: number; y: number } {
  const c = placeById('shipyard').center;
  return { x: c.x, z: c.z, y: standingHeight(heightAt(c)) };
}

/**
 * Où sont les abords, dans le repère du lieu (x à l'est, z au sud, depuis son centre) : l'ombre peinte du lieu que le sol
 * de sable recouvre (./flora.ts : son centre, ses demi-axes le long du soleil et en travers) ; le plancher et la grue ; les
 * piles ; la barque et son pieu.
 */
export const SHIPYARD_SURROUNDINGS = {
  /** L'ombre du lieu (rayon 4,5, allongée de 1,6 à l'opposé du soleil), et la marge que le sable prend autour d'elle. */
  shadow: { x: -3.955, z: -2.586, along: 7.2, across: 4.5, margin: 1.3 },
  /** Le sable autour de la tête de la cale et de la grue. */
  yard: { x: 2.4, z: -4.0, rx: 3.8, rz: 4.6 },
  /** La bande de sable tassé, de part et d'autre de l'axe de la cale. */
  trodden: 2.4,
  /** Le sable s'arrête au nord du plancher de la scène (sa pente vers l'eau reste la grève). */
  southEdge: 3.9,
  /** La cale : d'un peu avant sa tête jusqu'à son pied sous l'eau ; sa largeur ; son lever au-dessus des rails du lieu. */
  slip: { from: -0.9, beyond: 1.2, width: 2.3, lift: 0.01, seam: 0.62 },
  crane: { x: 2.8, z: -7.4, mast: 3.4, jib: 3.0, jibY: 3.1 },
  deck: { x: 3.0, z: -7.2, w: 3.0, d: 2.4, top: 0.16 },
  /** Le plancher de la pile de planches et des tonneaux, entre la tête de la cale et le chemin. */
  yardDeck: { x: 3.75, z: -1.7, w: 2.4, d: 3.4, top: 0.14 },
  stacks: [
    { x: 4.2, z: -1.5, rows: [4, 3, 2], length: 2.4 },
    { x: -1.4, z: -5.4, rows: [3, 3, 2], length: 2.6 },
  ],
  logs: { x: 5.0, z: -1.2 },
  barrels: [
    [2.95, -2.35],
    [3.1, -3.05],
    [-6.2, -4.4],
  ],
  barque: { x: -6.9, z: 12.1, length: 2.4, width: 1.0 },
  post: { x: -7.45, z: 11.55 },
} as const;

/** Le plancher de la scène (scenette.ts, `SHIPYARD_DECK`) : sa demi-largeur, sa demi-profondeur ; rien n'y dépasse. */
const SCENE_DECK = { half: 3.5, halfDepth: 1.2 } as const;

export function shipyardSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const o = site();
  sandYard(b, o);
  slipway(b, o, floor);
  plankFloor(b, o, SHIPYARD_SURROUNDINGS.deck);
  plankFloor(b, o, SHIPYARD_SURROUNDINGS.yardDeck);
  crane(b, o);
  woodPiles(b, o);
  mooredBarque(b, o);
}

/** Un point du monde depuis le repère du lieu. */
const at = (o: { x: number; y: number; z: number }, lx: number, ly: number, lz: number): P3 => [o.x + lx, o.y + ly, o.z + lz];

/** Un triangle tourné vers le ciel, quel que soit l'ordre de ses sommets. */
function upward(b: FacetBuilder, p: P3, q: P3, r: P3, color: number): void {
  const ny = (q[2] - p[2]) * (r[0] - p[0]) - (q[0] - p[0]) * (r[2] - p[2]);
  if (ny >= 0) b.triangle(p, q, r, color);
  else b.triangle(p, r, q, color);
}

/**
 * Le champ du sable, dans le repère du lieu : négatif là où il recouvre le sol (dans l'ombre du lieu élargie ou autour de
 * la tête de la cale, hors du chemin du lieu et au nord du plancher de la scène), positif ailleurs.
 */
export function sandField(lx: number, lz: number): number {
  const S = SHIPYARD_SURROUNDINGS;
  const sh = S.shadow;
  const dx = lx - sh.x,
    dz = lz - sh.z;
  const u = dx * SHADOW_DIR.x + dz * SHADOW_DIR.z,
    v = -dx * SHADOW_DIR.z + dz * SHADOW_DIR.x;
  const shadow = Math.hypot(u / (sh.along + sh.margin), v / (sh.across + sh.margin)) - 1;
  const Y = S.yard;
  const yard = Math.hypot((lx - Y.x) / Y.rx, (lz - Y.z) / Y.rz) - 1;
  // Le chemin du lieu, de sa porte à la grande porte de l'atelier (places.ts) : il reste de sable tassé, ocre.
  return Math.max(Math.min(shadow, yard), (lz - S.southEdge) / 4, (0.9 - pathDistance(lx, lz)) / 4);
}

/** La distance, dans le repère du lieu, au chemin de la porte du lieu à la grande porte de l'atelier (places.ts). */
function pathDistance(lx: number, lz: number): number {
  const c = placeById('shipyard').center;
  const node = PATH_NODES.find((n) => n.id === 'shipyard');
  if (!node) throw new Error('Chantier naval : le chemin du monde (places.ts) n’a plus de nœud « shipyard ».');
  const door = node.at;
  const H = SHIPYARD.shop;
  const [ax, az] = [door.x - c.x, door.z - c.z];
  const [bx, bz] = [H.x, H.z + H.d / 2 + 0.5];
  const [ux, uz] = [bx - ax, bz - az];
  const t = Math.max(0, Math.min(1, ((lx - ax) * ux + (lz - az) * uz) / (ux * ux + uz * uz)));
  return Math.hypot(lx - ax - t * ux, lz - az - t * uz);
}

/** Le lever du sable au-dessus du sol dessiné : au-dessus de l'ombre peinte du lieu (./flora.ts, 0,05). */
const SAND_LIFT = 0.07;

/**
 * Le sol de sable du chantier, sur les cases du sol dessiné qu'il recouvre (./terrain.ts) : sur chacune, un rien au-dessus
 * d'elle, deux triangles si elle est plane, sinon quatre, en éventail depuis son milieu (ils épousent alors ses deux
 * triangles, quelle que soit sa diagonale). Le sable clair, et un ton plus chaud de sable tassé le long de la cale.
 */
function sandYard(b: FacetBuilder, o: { x: number; y: number; z: number }): void {
  const field = buildHeightField();
  const step = field.step;
  const ground = (x: number, z: number) => heightOnMesh(field, x, z) + SAND_LIFT;
  const i0 = Math.floor((o.x - 13 - field.minX) / step),
    i1 = Math.ceil((o.x + 10 - field.minX) / step);
  const j0 = Math.floor((o.z - 10 - field.minZ) / step),
    j1 = Math.ceil((o.z + 5 - field.minZ) / step);
  for (let i = i0; i < i1; i++)
    for (let j = j0; j < j1; j++) {
      const x0 = field.minX + i * step,
        z0 = field.minZ + j * step;
      const [x1, z1] = [x0 + step, z0 + step];
      const [mx, mz] = [x0 + step / 2, z0 + step / 2];
      const f = (x: number, z: number) => sandField(x - o.x, z - o.z);
      if (f(mx, mz) > 0.5) continue;
      const corners: P3[] = [
        [x0, ground(x0, z0), z0],
        [x1, ground(x1, z0), z0],
        [x1, ground(x1, z1), z1],
        [x0, ground(x0, z1), z1],
      ];
      if (corners.some((p) => p[1] - SAND_LIFT < 0.05)) continue;
      // Chaque triangle de la case, s'il est dans le sable (son milieu) : le bord suit le champ en biais, sans escalier.
      const put = (p: P3, q: P3, r: P3) => {
        const [cx, cz] = [(p[0] + q[0] + r[0]) / 3, (p[2] + q[2] + r[2]) / 3];
        if (f(cx, cz) >= 0) return;
        const across = Math.abs((cx - o.x - SHIPYARD.slip.x) * SLIP_N.x + (cz - o.z - SHIPYARD.slip.z) * SLIP_N.z);
        upward(b, p, q, r, across < SHIPYARD_SURROUNDINGS.trodden ? C.trodden : C.sand);
      };
      const [p00, p10, p11, p01] = corners;
      if (Math.abs(p00[1] + p11[1] - p10[1] - p01[1]) < 1e-4) {
        // Une case plane : sa diagonale au plus près du bord du sable (perpendiculaire à la pente du champ).
        const gx = f(mx + 0.3, mz) - f(mx - 0.3, mz),
          gz = f(mx, mz + 0.3) - f(mx, mz - 0.3);
        if (Math.abs(gx + gz) < Math.abs(gz - gx)) {
          put(p00, p10, p11);
          put(p00, p11, p01);
        } else {
          put(p10, p11, p01);
          put(p10, p01, p00);
        }
        continue;
      }
      const m: P3 = [mx, ground(mx, mz), mz];
      for (let k = 0; k < 4; k++) put(m, corners[k], corners[(k + 1) % 4]);
    }
}

/** Le dessus des rails du lieu à `s` de la tête de la cale (places.ts, `slipRails`), dans le repère du lieu. */
function railTop(s: number): number {
  const pts = slipRails();
  if (s <= pts[0].s) return pts[0].y;
  // Au-delà du pied, la pente de la dernière travée continue : la cale plonge sous l'eau.
  for (let k = 0; k + 1 < pts.length; k++) {
    const [p, q] = [pts[k], pts[k + 1]];
    if (s <= q.s || k + 2 === pts.length) return p.y + ((s - p.s) / (q.s - p.s)) * (q.y - p.y);
  }
  return pts[0].y;
}

/**
 * Une dalle de bois en pente, de `s0` à `s1` le long de la cale, de `b0` à `b1` en travers (vers le sud-est), son dessus à
 * `top(s)` et son épaisseur `thick` : le dessus, les deux longs côtés et, si `head`, le bout de la tête.
 */
function slab(b: FacetBuilder, o: { x: number; y: number; z: number }, s0: number, s1: number, b0: number, b1: number, top: (s: number) => number, thick: number, color: number, side: number, head = false): void {
  const p = (s: number, bb: number, dy: number): P3 => {
    const q = slipPoint(s, bb);
    return at(o, q.x, top(s) + dy, q.z);
  };
  quadToward(b, [p(s0, b0, 0), p(s1, b0, 0), p(s1, b1, 0), p(s0, b1, 0)], { normal: [0, 1, 0] }, color);
  if (thick <= 0) return;
  quadToward(b, [p(s0, b1, -thick), p(s1, b1, -thick), p(s1, b1, 0), p(s0, b1, 0)], { normal: [SLIP_N.x, 0, SLIP_N.z] }, side);
  quadToward(b, [p(s0, b0, -thick), p(s1, b0, -thick), p(s1, b0, 0), p(s0, b0, 0)], { normal: [-SLIP_N.x, 0, -SLIP_N.z] }, side);
  if (head) quadToward(b, [p(s0, b0, -thick), p(s0, b1, -thick), p(s0, b1, 0), p(s0, b0, 0)], { normal: [-SLIP_U.x, 0, -SLIP_U.z] }, side);
}

/** Le point `s` de la cale, à `bb` de son axe, est-il sous le plancher de la scène (à `pad` près) ? */
function underSceneDeck(o: { x: number; z: number }, floor: Vec3, s: number, bb: number, pad: number): boolean {
  const q = slipPoint(s, bb);
  return Math.abs(o.x + q.x - floor.x) < SCENE_DECK.half + pad && Math.abs(o.z + q.z - floor.z) < SCENE_DECK.halfDepth + pad;
}

/**
 * La cale de bois sous la coque (directeur artistique : « la coque sur une cale qui descend vers l'eau ») : de la tête,
 * près de l'atelier, jusque sous l'eau, un plancher de planches en travers, un rien au-dessus des rails du lieu (ses
 * traverses sont enfouies), ses joints ; ses deux rails dessus, à l'écart des rails du lieu qu'il recouvre, coupés sous le
 * plancher de la scène.
 */
function slipway(b: FacetBuilder, o: { x: number; y: number; z: number }, floor: Vec3): void {
  const S = SHIPYARD_SURROUNDINGS.slip;
  const L = SHIPYARD.slip.length;
  const half = S.width / 2;
  const top = (s: number) => railTop(s) + S.lift;
  const stops = [S.from, ...slipRails().map((p) => p.s), L + S.beyond];
  for (let k = 0; k + 1 < stops.length; k++) slab(b, o, stops[k], stops[k + 1], -half, half, top, 0.4, C.slip, C.slipSide, k === 0);
  // Les joints des planches, en travers, sur la part sèche de la cale.
  for (let s = S.from + S.seam; s < L * 0.8; s += S.seam) {
    if (underSceneDeck(o, floor, s, 0, 0.4) || underSceneDeck(o, floor, s, half, 0.2)) continue;
    slab(b, o, s - 0.025, s + 0.025, -half + 0.05, half - 0.05, (t) => top(t) + 0.012, 0, C.slipSeam, C.slipSeam);
  }
  // Les deux rails, de la tête au pied, sauf sous le plancher de la scène.
  const gauge = SHIPYARD.slip.gauge / 2;
  for (const side of [-1, 1]) {
    const bb = side * gauge;
    let start: number | null = null;
    const n = 40;
    for (let k = 0; k <= n; k++) {
      const s = S.from + ((L - S.from) * k) / n;
      const free = !underSceneDeck(o, floor, s, bb, 0.15) && k < n;
      if (free && start === null) start = s;
      if (!free && start !== null) {
        slab(b, o, start, s, bb - 0.08, bb + 0.08, (t) => top(t) + 0.1, 0.1, C.rail, C.rail, true);
        start = null;
      }
    }
  }
}

/**
 * Un sol de planches (sous la grue, sous la pile et les tonneaux) : un plateau bas, ses planches en long d'est en ouest,
 * leurs joints.
 */
function plankFloor(b: FacetBuilder, o: { x: number; y: number; z: number }, D: { x: number; z: number; w: number; d: number; top: number }): void {
  const g = groundOf(o.x + D.x, o.z + D.z);
  const y = Math.max(g, o.y) + D.top;
  b.box({ x: o.x + D.x, y: y - 0.3, z: o.z + D.z }, [D.w, 0.3, D.d], TIMBER.plankSide, TIMBER.plank);
  for (let k = 1; k < 4; k++) {
    const z = o.z + D.z - D.d / 2 + (k * D.d) / 4;
    b.quad([o.x + D.x - D.w / 2, y + 0.01, z + 0.025], [o.x + D.x + D.w / 2, y + 0.01, z + 0.025], [o.x + D.x + D.w / 2, y + 0.01, z - 0.025], [o.x + D.x - D.w / 2, y + 0.01, z - 0.025], TIMBER.seam);
  }
}

/**
 * La petite grue de bois, sur son plancher : le mât sur deux sablières en croix et ses quatre jambes de force ; la flèche
 * qui part du haut du mât vers l'étrave de la coque, sa contre-fiche ; le filin, le croc et la planche de bordé pendue,
 * en long, au-dessus de la tête de la cale. Le treuil au pied du mât, sa manivelle.
 */
function crane(b: FacetBuilder, o: { x: number; y: number; z: number }): void {
  const K = SHIPYARD_SURROUNDINGS.crane;
  const D = SHIPYARD_SURROUNDINGS.deck;
  const base = Math.max(groundOf(o.x + D.x, o.z + D.z), o.y) + D.top;
  const x = o.x + K.x,
    z = o.z + K.z;
  for (const yaw of [Math.PI / 4, -Math.PI / 4]) b.box({ x, y: base, z, yaw }, [0.22, 0.18, 2.0], C.craneDark);
  b.box({ x, y: base, z }, [0.28, K.mast, 0.28], C.craneDark);
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    b.beam({ x: x + 0.85 * Math.cos(a), y: base + 0.18, z: z + 0.85 * Math.sin(a) }, { x: x + 0.1 * Math.cos(a), y: base + 1.2, z: z + 0.1 * Math.sin(a) }, 0.12, C.crane);
  }
  // La flèche, vers l'étrave (la tête de la coque, sur la cale) : elle part du bas du mât, penchée, et le hauban la tient
  // depuis le haut du mât.
  const stem = slipPoint(SHIPYARD.hull.at + 0.9, 0.5);
  const [dx, dz] = [o.x + stem.x - x, o.z + stem.z - z];
  const l = Math.hypot(dx, dz);
  const [ux, uz] = [dx / l, dz / l];
  const tip = { x: x + ux * K.jib, y: base + K.jibY, z: z + uz * K.jib };
  b.beam({ x: x + ux * 0.15, y: base + 0.9, z: z + uz * 0.15 }, tip, 0.18, C.crane);
  b.box({ x, y: base + K.mast, z }, [0.4, 0.12, 0.4], C.crane);
  b.beam({ x, y: base + K.mast - 0.05, z }, { x: tip.x, y: tip.y + 0.05, z: tip.z }, 0.05, C.rope);
  // Le filin, le croc, la planche de bordé pendue en long, le long de la cale.
  const hookY = tip.y - 1.05;
  b.beam({ x: tip.x, y: tip.y - 0.05, z: tip.z }, { x: tip.x, y: hookY, z: tip.z }, 0.04, C.rope);
  b.box({ x: tip.x, y: hookY - 0.14, z: tip.z }, [0.1, 0.16, 0.1], C.hook);
  const yaw = Math.atan2(SLIP_U.x, SLIP_U.z);
  b.box({ x: tip.x, y: hookY - 0.26, z: tip.z, yaw }, [0.32, 0.08, 2.0], C.planking);
  for (const e of [-0.7, 0.7]) b.beam({ x: tip.x, y: hookY - 0.12, z: tip.z }, { x: tip.x + e * SLIP_U.x, y: hookY - 0.19, z: tip.z + e * SLIP_U.z }, 0.03, C.rope);
  // Le treuil au pied du mât, du côté opposé à la flèche : son tambour en travers, sa manivelle.
  const wx = x - ux * 0.55,
    wz = z - uz * 0.55;
  b.drum({ x: wx - uz * 0.35, y: base + 0.55, z: wz + ux * 0.35, yaw: Math.atan2(-uz, ux) + Math.PI / 2, pitch: Math.PI / 2 }, 0.17, 0.7, 6, C.crane, C.craneDark);
  b.beam({ x: wx + uz * 0.4, y: base + 0.55, z: wz - ux * 0.4 }, { x: wx + uz * 0.42, y: base + 0.85, z: wz - ux * 0.42 }, 0.06, C.craneDark);
}

/** Le dessus de ce qui porte un objet posé en (x, z) du monde : le plancher de la pile s'il y est, sinon le sable. */
function standAt(o: { x: number; z: number }, x: number, z: number): number {
  const D = SHIPYARD_SURROUNDINGS.yardDeck;
  const onDeck = Math.abs(x - o.x - D.x) < D.w / 2 && Math.abs(z - o.z - D.z) < D.d / 2;
  return groundOf(x, z) + (onDeck ? D.top : SAND_LIFT);
}

/** Une pile de planches (le kit) sur ses deux cales, posée sur ce qui la porte. */
function stack(b: FacetBuilder, o: { x: number; z: number }, x: number, z: number, rows: readonly number[], length: number): void {
  const y = standAt(o, x, z) + 0.12;
  for (const dz of [-length / 2 + 0.35, length / 2 - 0.35]) {
    const g = groundOf(x, z + dz, 0.08);
    b.box({ x, y: g, z: z + dz }, [rows[0] * 0.27 + 0.2, y - g, 0.18], C.pile);
  }
  plankStack(b, x, y, z, rows, length);
}

/**
 * Les piles de bois : deux piles de planches sur leurs cales (l'une à l'est du chemin, l'autre derrière la coque), un tas
 * de rondins contre l'atelier (trois, deux, un, leurs bouts clairs vers le sud), des tonneaux.
 */
function woodPiles(b: FacetBuilder, o: { x: number; y: number; z: number }): void {
  const S = SHIPYARD_SURROUNDINGS;
  for (const p of S.stacks) stack(b, o, o.x + p.x, o.z + p.z, p.rows, p.length);
  const lx = o.x + S.logs.x,
    lz = o.z + S.logs.z;
  const g = groundOf(lx, lz) + SAND_LIFT;
  const r = 0.2;
  for (const [row, n] of [3, 2, 1].entries())
    for (let i = 0; i < n; i++) {
      const x = lx + (i - (n - 1) / 2) * 2 * r;
      b.drum({ x, y: g + r + row * r * 1.7, z: lz - 1.1, pitch: Math.PI / 2 }, r, 2.2, 6, C.log, C.logEnd);
    }
  for (const [x, z] of S.barrels) barrel(b, o.x + x, standAt(o, o.x + x, o.z + z) - 0.02, o.z + z);
}

/**
 * La barque amarrée au pied de la cale, sur l'eau, au sud-est d'elle (le kit : sans lanterne ni mât, elle reste basse),
 * son plancher ; le pieu d'amarrage au bord de la cale, l'amarre à sa poupe. De dos, elle reste à l'ouest du regard vers
 * Kéo.
 */
function mooredBarque(b: FacetBuilder, o: { x: number; y: number; z: number }): void {
  const B = SHIPYARD_SURROUNDINGS.barque;
  const P = SHIPYARD_SURROUNDINGS.post;
  const spot = { x: o.x + B.x, y: 0, z: o.z + B.z };
  barque(b, spot, B.length, B.width, { lantern: false, mast: false });
  barqueFloor(b, spot, B.length, B.width);
  const px = o.x + P.x,
    pz = o.z + P.z;
  const foot = groundOf(px, pz, 0.12);
  b.box({ x: px, y: foot, z: pz }, [0.2, 0.75 - foot, 0.2], C.pile);
  const stern = { x: spot.x - B.length / 2 + 0.1, y: 0.42, z: spot.z };
  b.beam({ x: px, y: 0.62, z: pz }, stern, 0.035, C.rope);
}
