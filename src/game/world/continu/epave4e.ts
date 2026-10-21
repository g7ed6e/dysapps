/**
 * Le Détour de l'Épave (lot 2 du monde ouvert du 4e ; intention du directeur artistique du 21 octobre 2026, « Le Détour
 * de l'Épave ») : le premier Détour du 4e, sur le mécanisme de ceux du 6e et du 5e (./detours.ts, ./hutte5e.ts) : un
 * endroit hors des chemins, que l'élève trouve en marchant ; Kéo s'y arrête, la vue se tourne vers la mer, « L'Épave »
 * s'écrit une fois, et une sente reste tracée pour de bon après la première arrivée. Ni compteur, ni récompense, ni
 * mission.
 *
 * La place : la grève de la côte sud, à l'ouest du quai du Rafiot (./plan4e.ts, `EPAVE_4E`). Un grand navire que les
 * Passeurs ont bâti et jamais mis à l'eau : sa coque entière, droite, d'un bois gris d'argent, sans pont ni mât, la poupe à
 * tableau à l'est, l'étrave à l'ouest, quelques membrures à nu à l'avant du côté de la terre (un bordé jamais fini) ; elle
 * attend sur sa cale de lancement, deux longues poutres en pente douce vers la mer, tenue par un ber (une traverse sous la
 * quille, deux accores). Une lanterne d'ocre sur un poteau au pied de la cale, allumée dès le départ, et les trois pierres
 * plates autour de Kéo, comme aux autres Détours. Rien à lire. Le dessin reçoit son sol (`ground`). Code pur.
 */
import { SENTE_5E as SENTE } from './creux5e';
import type { Detour } from './detours';
import { FacetBuilder, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import { EPAVE_4E } from './plan4e';
import { COLORS_5E } from './plan5e';

/** Vers la mer depuis Kéo : au sud, quinze degrés vers l'est (intention, « L'arrivée ») ; et le long de la grève, vers l'est. */
const TURN = (15 * Math.PI) / 180;
const SEA: Vec2 = { x: Math.sin(TURN), z: Math.cos(TURN) };
const EAST: Vec2 = { x: Math.cos(TURN), z: -Math.sin(TURN) };

/**
 * La vue de l'Épave à l'arrivée : la caméra se tourne vers la mer, recule un peu et descend vers Kéo (à sa hauteur, la
 * correction du mainteneur), comme au Perchoir : l'horizon, les Aiguilles au loin et le Rafiot restent dans le cadre.
 */
const EPAVE_VIEW = { height: -3, back: 1.15, turn: 0 } as const;

/**
 * Le budget de l'Épave (intention, « Le coût ») : 175 triangles au plus sans la sente, dans le maillage des lieux ; et sa
 * sente, une fois tracée, au plus `sente` de plus (quatre-vingts unités de pointillé, deux pavés par tiret).
 */
export const EPAVE_BUDGET = { triangles: 175, sente: 170 } as const;

/** Là où Kéo s'arrête : sur le sable sec, au nord de la coque, face à la mer. */
const AT: Vec2 = { x: EPAVE_4E.at.x, z: EPAVE_4E.at.z };

/**
 * L'Épave, un Détour comme les autres (son nom : le consultant d'Archipéo ; « l'Épave », l'article élidé). `face` va de
 * la mer vers Kéo : la caméra regarde à l'opposé (`detourCap`).
 */
export const EPAVE: Detour = {
  id: 'epave',
  land: 'fabriques',
  name: 'L’Épave',
  kind: 'coque',
  at: AT,
  radius: 2.5,
  foot: AT,
  face: Math.atan2(-SEA.z, -SEA.x),
  sente: [{ x: EPAVE_4E.senteFrom.x, z: EPAVE_4E.senteFrom.z }, AT],
  view: EPAVE_VIEW,
};

/**
 * Les couleurs (directeur artistique) : le bois gris d'argent de la coque (#A8A49C au flanc, le dedans un cran plus
 * sombre), plus pâle que le bois brun du navire de la Soute ; le bois gris de la cale et du ber ; l'ocre de la lanterne.
 */
const C = {
  hull: 0xa8a49c,
  // Le flanc de la terre, à l'ombre au soleil du soir : plus clair et un peu froid, pour rester d'argent sous la lumière
  // chaude du 4e, jamais brun (la planche validée).
  hullShade: 0xd4dce0,
  hullInside: 0x8c887f,
  rib: 0x7e7a72,
  slip: 0x8a8076,
  slipShade: 0x746a61,
  ber: 0x7c7068,
  pole: 0x6e645c,
  bronze: 0xb8954f,
  lantern: COLORS_5E.lantern,
  // Les trois pierres : celles des Détours du 6e (./detours.ts).
  stone: 0xc9c0ae,
  stoneSide: 0xa9a08f,
} as const;

/** Le sol sous un point, jamais sous l'eau. */
type Ground = (x: number, z: number) => number;
type P3 = readonly [number, number, number];

/**
 * La coque, en couples d'est (la poupe, son tableau) en ouest (l'étrave) : pour chacun, sa place le long de l'axe
 * (`x`, depuis le milieu), la hauteur de la quille (`keel`), le bouchain (`bilge` : demi-largeur, hauteur) et le
 * plat-bord (`sheer`), au-dessus du dessus du ber ; `rake` : de combien il penche vers l'avant en montant. Les flancs
 * s'évasent du bouchain au plat-bord. Le dernier, l'étrave, n'a plus de largeur et penche vers l'avant. Relevée aux deux
 * bouts, plus à l'avant.
 */
const STATIONS: readonly { x: number; keel: number; bilge: readonly [number, number]; sheer: readonly [number, number]; rake?: number }[] = [
  { x: 6.0, keel: 0.5, bilge: [1.0, 0.9], sheer: [1.45, 2.45] },
  { x: 3.0, keel: 0.05, bilge: [1.35, 0.45], sheer: [1.75, 2.0] },
  { x: -1.0, keel: 0, bilge: [1.35, 0.4], sheer: [1.75, 1.95] },
  { x: -4.0, keel: 0.15, bilge: [0.9, 0.6], sheer: [1.35, 2.2] },
  { x: -6.2, keel: 0.7, bilge: [0, 1.4], sheer: [0, 2.95], rake: -0.38 },
];

/** L'intervalle de couples (de l'est) où le bordé n'est pas fini du côté de la terre, et ses membrures à nu. */
const OPEN_BAY = 2;
const RIBS = [0.22, 0.5, 0.78] as const;

/** La cale : ses deux poutres (de part et d'autre du milieu, le long de l'axe), du nord de la coque jusqu'à la grève mouillée. */
const SLIP = { offset: 3.2, from: -2.6, to: 9.2, wide: 0.36, headLift: 0.42, footLift: 0.12, sink: 0.4 } as const;

/** Le ber : la traverse sous la quille, posée sur les poutres ; ses deux accores, du sable au bouchain. */
const BER = { thick: 0.16, wide: 0.4, length: 7.4, shore: 2.8 } as const;

/** La lanterne : au pied de la cale, à l'ouest, du côté de la terre ; son poteau. */
const LAMP = { west: -0.65, north: -0.5, pole: 1.35 } as const;

/** Un quadrilatère aux deux faces : `out` vers `hint`, `inside` de l'autre côté. */
function twoSided(b: FacetBuilder, q: readonly [P3, P3, P3, P3], hint: P3, out: number, inside: number): void {
  const [a, c, d] = [q[0], q[1], q[2]];
  const u = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const front = n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2] >= 0 ? q : ([q[3], q[2], q[1], q[0]] as const);
  b.quad(front[0], front[1], front[2], front[3], out);
  b.quad(front[3], front[2], front[1], front[0], inside);
}

/** Un étai à trois pans, tendu entre deux points (les accores, le poteau) : six triangles, sans bouts. */
function strut(b: FacetBuilder, a: P3, c: P3, r: number, color: number): void {
  const d = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1e-6;
  const k = d.map((v) => v / len);
  const ref = Math.abs(k[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let u = [k[1] * ref[2] - k[2] * ref[1], k[2] * ref[0] - k[0] * ref[2], k[0] * ref[1] - k[1] * ref[0]];
  const ul = Math.hypot(u[0], u[1], u[2]);
  u = u.map((x) => x / ul);
  const w = [k[1] * u[2] - k[2] * u[1], k[2] * u[0] - k[0] * u[2], k[0] * u[1] - k[1] * u[0]];
  const ring = (p: P3) =>
    [0, 1, 2].map((i) => {
      const t = (2 * Math.PI * i) / 3;
      const cx = Math.cos(t) * r,
        cy = Math.sin(t) * r;
      return [p[0] + u[0] * cx + w[0] * cy, p[1] + u[1] * cx + w[1] * cy, p[2] + u[2] * cx + w[2] * cy] as const;
    });
  const A = ring(a),
    B = ring(c);
  for (let i = 0; i < 3; i++) {
    const n = (i + 1) % 3;
    b.quad(A[i], A[n], B[n], B[i], color);
  }
}

/** La hauteur du dessus du ber, sous la quille : la base de la coque. */
const hullBase = (ground: Ground): number => slipTop(ground, 0) + BER.thick;

/** Le dessus d'une poutre de la cale, à `along` du milieu de la coque vers la mer : en pente douce de sa tête à son pied. */
function slipTop(ground: Ground, along: number): number {
  const { hull } = EPAVE_4E;
  const head = ground(hull.x, hull.z + SLIP.from) + SLIP.headLift;
  const foot = Math.max(0, ground(hull.x, hull.z + SLIP.to)) + SLIP.footLift;
  return head + ((foot - head) * (along - SLIP.from)) / (SLIP.to - SLIP.from);
}

/** La coque : ses pans dehors et dedans, son tableau, l'avant ouvert côté terre et ses membrures. */
function hull(b: FacetBuilder, ground: Ground): void {
  const { hull: h } = EPAVE_4E;
  const y0 = hullBase(ground);
  const at = (x: number, w: number, y: number): P3 => [h.x + x, y0 + y, h.z + w];
  const point = (i: number, w: number, y: number) => at(STATIONS[i].x + (STATIONS[i].rake ?? 0) * (y - STATIONS[i].keel), w, y);
  const keel = (i: number) => point(i, 0, STATIONS[i].keel);
  const bilge = (i: number, s: number) => point(i, s * STATIONS[i].bilge[0], STATIONS[i].bilge[1]);
  const sheer = (i: number, s: number) => point(i, s * STATIONS[i].sheer[0], STATIONS[i].sheer[1]);
  for (let i = 0; i + 1 < STATIONS.length; i++)
    for (const s of [-1, 1]) {
      const flank = s < 0 ? C.hullShade : C.hull;
      twoSided(b, [keel(i), bilge(i, s), bilge(i + 1, s), keel(i + 1)], [0, -0.6, s], flank, C.hullInside);
      if (i === OPEN_BAY && s === -1) continue;
      twoSided(b, [bilge(i, s), sheer(i, s), sheer(i + 1, s), bilge(i + 1, s)], [0, 0, s], flank, C.hullInside);
    }
  // Le tableau de la poupe, à l'est.
  const T = [keel(0), bilge(0, 1), sheer(0, 1), sheer(0, -1), bilge(0, -1)];
  for (let k = 1; k < T.length - 1; k++) {
    const q = [T[0], T[k], T[k + 1]] as const;
    const u = [q[1][0] - q[0][0], q[1][1] - q[0][1], q[1][2] - q[0][2]];
    const v = [q[2][0] - q[0][0], q[2][1] - q[0][1], q[2][2] - q[0][2]];
    const east = u[1] * v[2] - u[2] * v[1] >= 0;
    b.triangle(q[0], east ? q[1] : q[2], east ? q[2] : q[1], C.hull);
    b.triangle(q[0], east ? q[2] : q[1], east ? q[1] : q[2], C.hullInside);
  }
  // Les membrures à nu de l'avant, côté terre : chacune, du bouchain au plat-bord, aux deux faces.
  const a = STATIONS[OPEN_BAY],
    c = STATIONS[OPEN_BAY + 1];
  for (const t of RIBS) {
    const lerp = (p: number, q: number) => p + (q - p) * t;
    const x = lerp(a.x, c.x);
    const lo = [lerp(a.bilge[0], c.bilge[0]), lerp(a.bilge[1], c.bilge[1])];
    const hi = [lerp(a.sheer[0], c.sheer[0]), lerp(a.sheer[1], c.sheer[1])];
    twoSided(b, [at(x - 0.08, -lo[0], lo[1]), at(x - 0.08, -hi[0], hi[1]), at(x + 0.08, -hi[0], hi[1]), at(x + 0.08, -lo[0], lo[1])], [0, 0, -1], C.rib, C.rib);
  }
}

/** La cale et le ber : les deux poutres en pente vers la mer, la traverse sous la quille, les deux accores. */
function slipway(b: FacetBuilder, ground: Ground): void {
  const { hull: h } = EPAVE_4E;
  const hw = SLIP.wide / 2;
  for (const s of [-1, 1]) {
    const x = h.x + s * SLIP.offset;
    const top = (along: number) => slipTop(ground, along);
    const z0 = h.z + SLIP.from,
      z1 = h.z + SLIP.to;
    const t0 = top(SLIP.from),
      t1 = top(SLIP.to);
    const b0 = Math.min(t0, ground(x, z0)) - SLIP.sink,
      b1 = Math.min(t1, Math.max(0, ground(x, z1))) - SLIP.sink;
    // Le dessus, les deux flancs, la tête (le pied s'enfonce dans la grève mouillée).
    b.quad([x - hw, t0, z0], [x - hw, t1, z1], [x + hw, t1, z1], [x + hw, t0, z0], C.slip);
    b.quad([x + hw, b0, z0], [x + hw, t0, z0], [x + hw, t1, z1], [x + hw, b1, z1], C.slipShade);
    b.quad([x - hw, b1, z1], [x - hw, t1, z1], [x - hw, t0, z0], [x - hw, b0, z0], C.slipShade);
    b.quad([x - hw, b0, z0], [x - hw, t0, z0], [x + hw, t0, z0], [x + hw, b0, z0], C.slipShade);
  }
  // La traverse, sous la quille, d'une poutre à l'autre et un peu au-delà.
  b.box({ x: h.x, y: slipTop(ground, 0), z: h.z }, [BER.length, BER.thick, BER.wide], C.ber);
  // Les deux accores, du sable au bouchain du milieu, de part et d'autre : la coque se tient d'aplomb.
  const mid = STATIONS[2];
  const y0 = hullBase(ground);
  for (const s of [-1, 1]) {
    const z = h.z + s * BER.shore;
    strut(b, [h.x + mid.x, ground(h.x + mid.x, z) - 0.1, z], [h.x + mid.x, y0 + mid.bilge[1] + 0.25, h.z + s * (mid.bilge[0] + 0.05)], 0.09, C.ber);
  }
}

/** La lanterne d'ocre, au pied de la cale, du côté de la terre : son poteau, sa vitre allumée, son chapeau. */
function lantern(b: FacetBuilder, ground: Ground): void {
  const { hull: h } = EPAVE_4E;
  const x = h.x - SLIP.offset + LAMP.west,
    z = h.z + SLIP.from + LAMP.north;
  const y = ground(x, z);
  const top = y + LAMP.pole;
  strut(b, [x, y - 0.1, z], [x, top, z], 0.06, C.pole);
  b.box({ x, y: top, z }, [0.26, 0.32, 0.26], C.lantern);
  b.prism({ x, y: top + 0.32, z, yaw: Math.PI / 4 }, 0.24, 0, 0.14, 4, C.bronze);
}

/** Les trois pierres plates, autour de Kéo, de part et d'autre de la sente (jamais dessus), comme aux autres Détours. */
export const EPAVE_STONES = [
  { sea: -1.9, east: 2.1, r: 0.55 },
  { sea: 2.0, east: 2.0, r: 0.5 },
  { sea: -0.7, east: -2.6, r: 0.42 },
] as const;

/** Le pied d'une pierre de `EPAVE_STONES`, dans le monde. */
export const epaveStoneAt = (k: number): Vec2 => {
  const s = EPAVE_STONES[k];
  return { x: AT.x + SEA.x * s.sea + EAST.x * s.east, z: AT.z + SEA.z * s.sea + EAST.z * s.east };
};

function stones(b: FacetBuilder, ground: Ground): void {
  EPAVE_STONES.forEach((s, k) => {
    const p = epaveStoneAt(k);
    b.prism({ x: p.x, y: Math.max(0, ground(p.x, p.z)) - 0.05, z: p.z, yaw: EPAVE.face + k }, s.r, s.r * 0.85, 0.22, 4, C.stoneSide, C.stone);
  });
}

/** La sente de l'Épave, en pointillé sur le sable : celle du 5e (./creux5e.ts, `SENTE_5E`), un pavé par tiret. */
function sente(b: FacetBuilder, ground: Ground): void {
  const [a, c] = EPAVE.sente;
  const len = distance(a, c);
  const dx = (c.x - a.x) / len,
    dz = (c.z - a.z) / len;
  const p = (t: number, o: number): P3 => [a.x + dx * t + dz * o, Math.max(0, ground(a.x + dx * t, a.z + dz * t)) + SENTE.lift, a.z + dz * t - dx * o];
  for (let s = 0; s < len; s += SENTE.dash + SENTE.gap) {
    const e = Math.min(len, s + SENTE.dash);
    for (let t = s; t < e - 1e-6; t += 0.7) {
      const t1 = Math.min(e, t + 0.7);
      b.quad(p(t, SENTE.half), p(t, -SENTE.half), p(t1, -SENTE.half), p(t1, SENTE.half), SENTE.color);
    }
  }
}

/**
 * Le décor de l'Épave, tel que la vue l'ajoute au maillage des lieux (aucun appel de plus) : la coque, sa cale et son
 * ber, sa lanterne, ses pierres, et sa sente une fois trouvée (`found`), dans le monde comme sur la Carte. Sans la sente :
 * le plafond de 175 triangles (intention, « Le coût »).
 */
export function epaveFacets(found: boolean, ground: Ground): Facets {
  const b = new FacetBuilder();
  hull(b, ground);
  slipway(b, ground);
  lantern(b, ground);
  stones(b, ground);
  if (found) sente(b, ground);
  return b.build();
}
