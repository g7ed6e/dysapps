/**
 * Les abords de la scénette de la Turbine (retouches du directeur artistique du 18 octobre 2026, sans concept : « la
 * machine au bord de l'eau, une roue à aubes, un plancher sur pilotis, une cabane à colombages à moitié rebâtie ; aucun
 * rocher qui bouche la vue de dos ») : derrière la machine, au nord, le bief qui descend du coteau est vers la rivière en
 * terrasses de pierre chaude, l'écume au pied de chaque marche ; la roue à aubes dans le bief, son axe vers la cabane ; la
 * cabane à colombages sur pilotis (le kit commun, ./surroundingsKit.ts), son toit d'ardoise en réparation, et sa moitié
 * est encore en charpente neuve, sur le plancher sur pilotis qui enjambe le bief ; des touffes et quelques rochers sur les
 * berges. Le carter couché de la ruine, qui bouchait la vue de dos, ne gît plus (places.ts).
 *
 * Rien ne dépasse le sol de la scène à moins de 10 unités du point visé, et tout passe à plus de deux unités sous la
 * caméra quand elle tourne (à quelque 14,6 unités de lui, `ENGINE_RING`) : la cabane et la roue, au bord de son tour, ne
 * coupent jamais la vue sur Kéo et la machiniste. De face, elles se tiennent à l'ouest de l'évent de la chaudière et se
 * lisent dans la moitié droite du cadre, au-dessus de la machine ; au sud, au-delà de la caméra de face, des sapins et un
 * tas de bûches font le fond de la vue de dos. Aplats francs, une couleur par facette, jamais presque noir. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { placeById } from './plan6e';
import type { SurroundingsState } from './surroundings';
import { GREEN_TUFT, NATURE, STONE, fir, groundAt, rock, timberHouse, tuft, type P3 } from './surroundingsKit';
import { buildHeightField, heightAt, heightOnMesh, type HeightField } from './terrain';

const C = {
  /** L'eau du bief : un vert d'eau plus clair que le lagon, pour qu'une fois ombrée elle rejoigne la teinte de la rivière. */
  water: 0x6fcfc2,
  /** L'écume au pied des marches, et l'eau qui tombe d'une marche (un vert d'eau très clair, jamais un blanc pur). */
  foam: 0xe5ebe3,
  fall: 0xbfe3d8,
  /** La roue : sa jante, ses aubes plus claires, son moyeu et son axe (un bois sombre, jamais presque noir). */
  rim: 0x8a6440,
  paddle: 0xc09a68,
  hub: 0x6f5640,
  /** Le plancher : ses planches claires, leur tranche, ses pieux. */
  plank: 0xdcc08f,
  plankSide: 0xb08658,
  pile: NATURE.pile,
  /** La charpente : les poteaux de colombage, le bois neuf des chevrons et des liteaux. */
  timber: 0x9a6e45,
  fresh: 0xe6c88f,
  /** Le tas de bûches : l'écorce et le bout des bûches. */
  bark: 0x8a6440,
  logEnd: 0xd9b98a,
} as const;

/** La distance du point visé à la caméra de la scénette, quand elle tourne (scenette.ts, `scenettePose`). */
export const ENGINE_RING = 14.6;

/**
 * Où sont les abords, dans le repère du lieu (son centre, places.ts ; le lieu n'est pas tourné) : le tracé du bief, de sa
 * source sur le coteau est jusqu'au-delà de la berge de la rivière, chaque point une marche ; la roue (son milieu, son
 * rayon, sa largeur) ; la cabane (son milieu, sa largeur, sa profondeur, ses murs, ses pilotis) ; la charpente neuve, à
 * l'est de la cabane, jusqu'à `to` ; le plancher sur pilotis, de la cabane jusqu'au sud du bief.
 */
export const ENGINE_SURROUNDINGS = {
  race: [
    [12, -13.2],
    [8.5, -12.6],
    [5, -10.6],
    [1.5, -8.4],
    [-2.9, -7.4],
    [-5.0, -7.4],
    [-9.5, -7.0],
    [-12.5, -6.6],
    [-16, -6.3],
  ],
  /** La demi-largeur du bief (pierre comprise), celle de son eau. */
  half: 0.95,
  waterHalf: 0.72,
  wheel: { x: -3.7, r: 1.2, width: 0.56 },
  house: { x: -4.7, z: -10.2, width: 2.8, depth: 2.4, wall: 1.5, stilts: 0.5, slope: 0.8 },
  frame: { to: -1.4 },
  deck: { x0: -2.0, x1: 0.0, z0: -8.7, z1: -6.0 },
} as const;

/** L'eau de la rivière, au pied du bief (le niveau de la mer). */
const RIVER = 0;

export function engineSurroundings(b: FacetBuilder, _floor: Vec3, _state: SurroundingsState): void {
  const c = placeById('engine').center;
  race(b);
  wheel(b, c);
  const floor = timberHouse(b, { ...houseSpec(c), repair: true });
  frame(b, c, floor);
  deck(b, c, floor);
  banks(b, c);
}

function houseSpec(c: { x: number; z: number }) {
  const H = ENGINE_SURROUNDINGS.house;
  return { x: c.x + H.x, z: c.z + H.z, width: H.width, depth: H.depth, wall: H.wall, stilts: H.stilts, slope: H.slope };
}

/** Le sol dessiné en un point (celui des tuiles), jamais sous le sol du plan : l'eau du bief ne s'y enfonce pas. */
function ground(field: HeightField, x: number, z: number): number {
  return Math.max(heightAt({ x, z }), heightOnMesh(field, x, z));
}

/** Le plus haut et le plus bas du sol sous un bief de `a` à `e`, sur toute sa largeur. */
function groundSpan(a: { x: number; z: number }, e: { x: number; z: number }): { high: number; low: number } {
  const field = buildHeightField();
  const half = ENGINE_SURROUNDINGS.half;
  const len = Math.hypot(e.x - a.x, e.z - a.z) || 1;
  const nx = -(e.z - a.z) / len,
    nz = (e.x - a.x) / len;
  let high = -Infinity,
    low = Infinity;
  const n = Math.max(2, Math.ceil(len / 0.5));
  for (let k = 0; k <= n; k++)
    for (const s of [-half, 0, half]) {
      const t = k / n;
      const y = ground(field, a.x + (e.x - a.x) * t + nx * s, a.z + (e.z - a.z) * t + nz * s);
      high = Math.max(high, y);
      low = Math.min(low, y);
    }
  return { high, low };
}

/**
 * Les biefs (les marches) : leurs bouts dans le monde, le dernier coupé à la berge de la rivière, et le niveau de leur
 * eau, au-dessus du plus haut du sol sous chacun, chaque marche plus basse que celle d'amont d'au moins `STEP`.
 */
export function engineRace(): { from: { x: number; z: number }; to: { x: number; z: number }; level: number }[] {
  const c = placeById('engine').center;
  const field = buildHeightField();
  const pts = ENGINE_SURROUNDINGS.race.map(([x, z]) => ({ x: c.x + x, z: c.z + z }));
  // La berge : le long du dernier tronçon, là où le sol descend sous l'eau de la rivière.
  const [p, q] = [pts[pts.length - 2], pts[pts.length - 1]];
  let t = 0;
  while (t < 1 && ground(field, p.x + (q.x - p.x) * t, p.z + (q.z - p.z) * t) > RIVER + 0.05) t += 0.02;
  pts[pts.length - 1] = { x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t };
  const pools = pts.slice(1).map((to, k) => ({ from: pts[k], to, level: groundSpan(pts[k], to).high + LIFT }));
  for (let k = pools.length - 2; k >= 0; k--) pools[k].level = Math.max(pools[k].level, pools[k + 1].level + STEP);
  return pools;
}

/** L'eau d'un bief au-dessus du plus haut du sol sous lui ; la marche la plus basse entre deux biefs. */
const LIFT = 0.12;
const STEP = 0.18;

/**
 * Le bief en terrasses : chaque tronçon, un caisson de pierre chaude (son dessus un rien au-dessus de l'eau, ses flancs
 * jusque sous le sol), son eau ; au bout aval, la chute (un aplat clair en pente) et l'écume au pied de la marche ; au
 * bout du dernier, la chute dans la rivière et la nappe d'écume qui s'y étale.
 */
function race(b: FacetBuilder): void {
  const S = ENGINE_SURROUNDINGS;
  const pools = engineRace();
  pools.forEach((pool, k) => {
    const { from: a, to: e, level } = pool;
    const dx = e.x - a.x,
      dz = e.z - a.z;
    const len = Math.hypot(dx, dz);
    const ux = dx / len,
      uz = dz / len;
    const yaw = Math.atan2(dx, dz);
    const { low } = groundSpan(a, e);
    // Le caisson, prolongé vers l'amont sous le bief d'avant (plus haut : on n'en voit rien) pour fermer les coudes.
    const back = k === 0 ? 0 : 0.35;
    const mid = { x: a.x + ux * ((len - back) / 2), z: a.z + uz * ((len - back) / 2) };
    const bottom = low - 0.35;
    const top = level + 0.08;
    b.box({ x: mid.x, y: bottom, z: mid.z, yaw }, [2 * S.half, top - bottom, len + back], STONE.side, STONE.top);
    // L'eau, un rien au-dessus de la pierre, entre ses deux bords.
    const w = S.waterHalf;
    const nx = -uz * w,
      nz = ux * w;
    const y = top + 0.012;
    const at = (s: number, side: number, h = y): P3 => [a.x + ux * s + nx * side, h, a.z + uz * s + nz * side];
    b.quad(at(0, 1), at(len, 1), at(len, -1), at(0, -1), C.water);
    const next = pools[k + 1];
    const below = next ? next.level + 0.08 + 0.012 : RIVER + 0.01;
    // La chute, du bout du bief jusqu'à l'eau d'en bas, en pente vers l'aval ; l'écume à son pied.
    const fall = 0.3;
    b.quad(at(len, 1), at(len + fall, 1, below + 0.01), at(len + fall, -1, below + 0.01), at(len, -1), C.fall);
    if (next) b.quad(at(len + fall, 1.15, below + 0.012), at(len + fall + 0.55, 1.15, below + 0.012), at(len + fall + 0.55, -1.15, below + 0.012), at(len + fall, -1.15, below + 0.012), C.foam);
    else b.prism({ x: e.x + ux * (fall + 0.5), y: RIVER, z: e.z + uz * (fall + 0.5) }, 0.9, 0.9, 0.02, 7, C.foam);
  });
}

/** Le milieu de la roue, dans le monde : sur le tracé du bief, son bas dans l'eau. */
export function engineWheelHub(): Vec3 {
  const c = placeById('engine').center;
  const W = ENGINE_SURROUNDINGS.wheel;
  const x = c.x + W.x;
  const pool = engineRace().find((p) => (p.from.x - x) * (p.to.x - x) <= 0)!;
  const t = (x - pool.from.x) / (pool.to.x - pool.from.x);
  return { x, y: pool.level + 0.1 + W.r - 0.3, z: pool.from.z + (pool.to.z - pool.from.z) * t };
}

/** Un point du plan x, y autour de (`cx`, `cy`), à l'angle `a`. */
const around = (r: number, a: number): [number, number] => [r * Math.cos(a), r * Math.sin(a)];

/**
 * La roue à aubes, debout dans le bief, sa face au sud : la jante (un anneau de bois), huit aubes qui la débordent, trois
 * rayons en croix, le moyeu ; l'axe qui file au nord jusqu'au plancher de la cabane. Immobile.
 */
function wheel(b: FacetBuilder, c: { x: number; z: number }): void {
  const W = ENGINE_SURROUNDINGS.wheel;
  const hub = engineWheelHub();
  const z0 = hub.z - W.width / 2;
  b.annulus({ x: hub.x, y: hub.y, z: z0, pitch: Math.PI / 2 }, W.r - 0.14, W.r, W.width, 10, C.rim, C.rim);
  for (let k = 0; k < 8; k++) {
    const a = (2 * Math.PI * k) / 8 + 0.2;
    const [r0, r1, t] = [W.r - 0.3, W.r + 0.28, 0.06];
    const [px, py] = [-Math.sin(a) * t, Math.cos(a) * t];
    const [ax, ay] = around(r0, a);
    const [ex, ey] = around(r1, a);
    const outline: [number, number][] = [
      [ax - px, ay - py],
      [ex - px, ey - py],
      [ex + px, ey + py],
      [ax + px, ay + py],
    ];
    b.extrude({ x: hub.x, y: hub.y, z: z0 + 0.04 }, outline, W.width - 0.08, C.paddle, C.paddle);
  }
  for (let k = 0; k < 3; k++) {
    const a = (Math.PI * k) / 3 + 0.2;
    const [x0, y0] = around(W.r - 0.1, a);
    b.beam({ x: hub.x - x0, y: hub.y - y0, z: hub.z }, { x: hub.x + x0, y: hub.y + y0, z: hub.z }, 0.09, C.rim);
  }
  b.drum({ x: hub.x, y: hub.y, z: hub.z - 0.32, pitch: Math.PI / 2 }, 0.17, 0.64, 6, C.hub, C.hub);
  // L'axe, jusqu'au bord du plancher de la cabane, et son palier sur la berge sud.
  const H = ENGINE_SURROUNDINGS.house;
  const north = c.z + H.z + H.depth / 2 + 0.3;
  b.beam({ x: hub.x, y: hub.y, z: hub.z - 0.3 }, { x: hub.x, y: hub.y, z: north }, 0.12, C.hub);
  const south = hub.z + ENGINE_SURROUNDINGS.half + 0.15;
  const foot = groundAt(hub.x, south, 0.1);
  b.beam({ x: hub.x, y: hub.y, z: hub.z + 0.3 }, { x: hub.x, y: hub.y, z: south }, 0.12, C.hub);
  b.box({ x: hub.x, y: foot, z: south }, [0.3, hub.y + 0.12 - foot, 0.3], C.pile);
}

/**
 * La moitié est de la cabane, encore en charpente : deux poteaux d'angle et un poteau au milieu de la façade, les deux
 * sablières hautes, deux fermes de chevrons neufs, le faîtage qui prolonge celui de la cabane, deux liteaux sur le pan
 * sud. Posée sur le plancher, au pied des murs (`floor`).
 */
function frame(b: FacetBuilder, c: { x: number; z: number }, floor: number): void {
  const H = ENGINE_SURROUNDINGS.house;
  const x0 = c.x + H.x + H.width / 2,
    x1 = c.x + ENGINE_SURROUNDINGS.frame.to;
  const zs = c.z + H.z + H.depth / 2,
    zn = c.z + H.z - H.depth / 2,
    zm = c.z + H.z;
  const top = floor + H.wall,
    ridge = top + (H.slope * H.depth) / 2;
  for (const [x, z] of [
    [x1, zs],
    [x1, zn],
    [(x0 + x1) / 2, zs],
  ] as const)
    b.box({ x, y: floor, z }, [0.14, H.wall, 0.14], C.timber);
  for (const z of [zs, zn]) b.beam({ x: x0, y: top, z }, { x: x1, y: top, z }, 0.14, C.timber);
  for (const x of [(x0 + x1) / 2, x1]) {
    b.beam({ x, y: top, z: zs }, { x, y: ridge, z: zm }, 0.1, C.fresh);
    b.beam({ x, y: top, z: zn }, { x, y: ridge, z: zm }, 0.1, C.fresh);
  }
  b.beam({ x: x0, y: ridge, z: zm }, { x: x1, y: ridge, z: zm }, 0.12, C.fresh);
  for (const t of [0.35, 0.7]) {
    const y = top + (ridge - top) * t + 0.06;
    const z = zs + (zm - zs) * t;
    b.beam({ x: x0, y, z }, { x: x1 + 0.1, y, z }, 0.06, C.fresh);
  }
}

/**
 * Le plancher sur pilotis : sous la charpente neuve, contre la plate-forme de la cabane, puis en avancée vers le sud, par-
 * dessus le bief, à la hauteur du plancher de la cabane ; ses pieux plantés dans le sol (et dans le bief), une pile de
 * planches neuves dessus.
 */
function deck(b: FacetBuilder, c: { x: number; z: number }, floor: number): void {
  const H = ENGINE_SURROUNDINGS.house;
  const D = ENGINE_SURROUNDINGS.deck;
  const hx = c.x + H.x + H.width / 2 + 0.3;
  const north = { x0: hx, x1: c.x + D.x1, z0: c.z + H.z - H.depth / 2 - 0.3, z1: c.z + D.z0 };
  const south = { x0: c.x + D.x0, x1: c.x + D.x1, z0: c.z + D.z0, z1: c.z + D.z1 };
  for (const r of [north, south]) b.box({ x: (r.x0 + r.x1) / 2, y: floor - 0.2, z: (r.z0 + r.z1) / 2 }, [r.x1 - r.x0, 0.2, r.z1 - r.z0], C.plankSide, C.plank);
  const piles: [number, number][] = [
    [north.x1 - 0.15, north.z0 + 0.15],
    [north.x1 - 0.15, north.z1 - 0.15],
    [south.x0 + 0.15, south.z1 - 0.15],
    [south.x1 - 0.15, south.z1 - 0.15],
    [south.x0 + 0.15, (south.z0 + south.z1) / 2],
    [south.x1 - 0.15, (south.z0 + south.z1) / 2],
  ];
  for (const [x, z] of piles) {
    const foot = groundAt(x, z, 0.12);
    b.box({ x, y: foot, z }, [0.2, floor - 0.2 - foot, 0.2], C.pile);
  }
  // La pile de planches neuves, sur l'avancée, le long de x.
  const px = (south.x0 + south.x1) / 2,
    pz = south.z0 + 0.8;
  for (const [k, dz] of [-0.27, 0, 0.27].entries()) b.box({ x: px, y: floor, z: pz + dz }, [1.8 - 0.2 * k, 0.09, 0.24], C.plankSide, C.plank);
  b.box({ x: px + 0.1, y: floor + 0.09, z: pz - 0.13 }, [1.5, 0.09, 0.24], C.plankSide, C.plank);
}

/** Les touffes des berges du bief et du fond de dos, dans le repère du lieu. */
const TUFTS: readonly (readonly [number, number])[] = [
  [6.6, -10.0],
  [3.0, -7.4],
  [0.4, -6.6],
  [-7.6, -5.9],
  [-10.8, -5.5],
  [-8.6, -8.4],
  [9.8, -14.4],
  [-0.4, 21.6],
  [4.6, 22.4],
  [-3.4, 23.0],
];

/** Les rochers des berges et du fond de dos, dans le repère du lieu : (x, z, rayon, hauteur). Bas. */
const ROCKS: readonly (readonly [number, number, number, number])[] = [
  [-11.4, -8.4, 0.8, 0.7],
  [-13.6, -4.9, 0.9, 0.6],
  [10.6, -14.8, 0.9, 0.8],
  [1.2, 23.4, 0.9, 0.8],
  [-6.6, 22.6, 0.7, 0.6],
];

/**
 * Le fond de la vue de dos, au sud, au-delà de la caméra de face (rien ne s'y voit de face) : trois sapins, (x, z,
 * échelle), et le tas de bûches de la machiniste (son milieu, le nombre de bûches de chaque lit).
 */
const FIRS: readonly (readonly [number, number, number])[] = [
  [3.2, 24.6, 1.0],
  [-5.0, 25.4, 1.2],
  [7.4, 23.4, 0.9],
];
const LOGS = { x: -1.8, z: 22.4, rows: [3, 2] } as const;

function banks(b: FacetBuilder, c: { x: number; z: number }): void {
  for (const [k, [dx, dz]] of TUFTS.entries()) {
    const x = c.x + dx,
      z = c.z + dz;
    tuft(b, { x, y: groundAt(x, z, 0.05), z }, k + 40, GREEN_TUFT);
  }
  for (const [k, [dx, dz, r, h]] of ROCKS.entries()) {
    const x = c.x + dx,
      z = c.z + dz;
    rock(b, { x, y: groundAt(x, z, 0.05), z }, r, h, k + 60);
  }
  for (const [k, [dx, dz, s]] of FIRS.entries()) fir(b, c.x + dx, c.z + dz, s, k * 0.9, 0.15);
  logs(b, c.x + LOGS.x, c.z + LOGS.z);
}

/** Le tas de bûches, le long de x, sur deux cales : des rondins à six pans, leur bout clair. */
function logs(b: FacetBuilder, x: number, z: number): void {
  const y = groundAt(x, z, 0.05);
  const r = 0.17,
    len = 1.6;
  for (const dx of [-0.55, 0.55]) b.box({ x: x + dx, y: y - 0.05, z }, [0.16, 0.12, 1.2], C.pile);
  LOGS.rows.forEach((n, layer) => {
    for (let i = 0; i < n; i++) {
      const lz = z + (i - (n - 1) / 2) * 2 * r;
      b.drum({ x: x - len / 2, y: y + 0.07 + r + layer * 1.7 * r, z: lz, yaw: Math.PI / 2, pitch: Math.PI / 2 }, r, len, 6, C.bark, C.logEnd);
    }
  });
}
