/**
 * Les abords de la scénette des Filets (reprise lieu par lieu, d'après les concepts du 18 octobre 2026,
 * « scenettes-6e-filets ») : l'anse de sable et de lagon sous le plancher de séchage où se tiennent Kéo et la pêcheuse,
 * finie de chaque côté puisque la caméra tourne (« caméra libre »). Le lieu reste sur sa pente : ce sont ses abords qui
 * descendent à l'eau. Au nord-est, derrière la pêcheuse (la moitié droite du cadre de face) : un filet tendu entre deux
 * perches plantées dans l'eau, ses flotteurs ; plus loin, la cabane de pêche sur pilotis au toit d'ardoise en
 * réparation, et le petit ponton qui y mène depuis la grève de l'ouest, au-delà des cabanes du lieu. Au sud-est, sur le
 * sable, deux barques tirées au sec, la proue vers la terre, un panier entre elles ; autour de l'anse, des rochers de
 * pierre chaude, quelques touffes d'herbe sèche. Le séchoir, son filet raccommodé et le panier plein de la réussite du
 * Troupeau sont au lieu (places.ts, questionScene.ts) : rien ici ne se pose à leur place.
 *
 * Rien de haut dans l'anneau où la rangée des objets-réponses se pose quand la caméra tourne (`RING`, depuis le point
 * visé, entre Kéo et la pêcheuse), rien entre la caméra de face et la scène. Aplats francs, une couleur par facette,
 * jamais presque noir ; aucun appel de plus (le décor de près). Code pur, sans Three.js.
 */
import { FacetBuilder, placeFacets } from './facets';
import type { Vec3 } from './geometry';
import type { SurroundingsState } from './surroundings';
import { DRY_TUFT, NATURE, barque, groundAt, pontoon, rock, timberHouse, tuft, type P3 } from './surroundingsKit';

const C = {
  /** Les cordes du filet tendu : un chanvre clair, lisible sur le lagon. */
  rope: 0xe8dcbc,
  ropeShade: 0xcdbd96,
  /** Les flotteurs du filet (terre cuite, un accent retenu) et leur dessus. */
  float: 0xd98a5a,
  floatTop: 0xe9a477,
  /** Les perches, le bois des pieux. */
  pole: NATURE.pile,
  /** Le panier d'osier entre les barques, son bord. */
  wicker: 0xc49a5c,
  wickerRim: 0xa77d45,
} as const;

/**
 * Où sont les abords, depuis le sol de la scène (`floor`, au milieu du plancher, entre Kéo et la pêcheuse ; x à l'est, z
 * au sud) : les deux perches du filet, la cabane sur pilotis (son milieu, sa largeur, sa profondeur, la hauteur de ses
 * pilotis au-dessus du fond), le ponton (de la grève à la plate-forme de la cabane), les deux barques (leur milieu, le
 * cap de leur proue), le panier.
 */
const FILETS_SURROUNDINGS = {
  net: { a: { dx: 4.2, dz: -10.4 }, b: { dx: 7.6, dz: -11.8 }, top: 2.05, sag: 0.3, bottom: 0.12 },
  hut: { dx: 1.6, dz: -13.8, width: 2.6, depth: 2.0, wall: 1.4, stilts: 2.05, yaw: 0 },
  pier: { from: { dx: -4.8, dz: -10.2 }, to: { dx: 0.4, dz: -12.6 }, width: 1.1, top: 0.5 },
  boats: [
    { dx: 6.6, dz: 8.6, yaw: 2.4 },
    { dx: 8.4, dz: 10.4, yaw: 2.6 },
  ],
  basket: { dx: 8.6, dz: 8.2 },
} as const;

/** La distance au point visé en deçà de laquelle la rangée des réponses peut se poser quand la caméra tourne. */
export const RING = 7.5;

export function filetsSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const at = (dx: number, dz: number) => ({ x: floor.x + dx, z: floor.z + dz });
  strungNet(b, floor);
  const S = FILETS_SURROUNDINGS;
  const pierFrom = at(S.pier.from.dx, S.pier.from.dz),
    pierTo = at(S.pier.to.dx, S.pier.to.dz);
  pontoon(b, { from: pierFrom, to: pierTo, width: S.pier.width, top: S.pier.top, pairs: 4 });
  const hut = at(S.hut.dx, S.hut.dz);
  timberHouse(b, { x: hut.x, z: hut.z, yaw: S.hut.yaw, width: S.hut.width, depth: S.hut.depth, wall: S.hut.wall, stilts: S.hut.stilts, slope: 0.75, repair: true });
  for (const boat of S.boats) beachedBarque(b, at(boat.dx, boat.dz), boat.yaw);
  const k = at(S.basket.dx, S.basket.dz);
  basket(b, k.x, groundAt(k.x, k.z, 0.04), k.z);
  for (const [i, [dx, dz, r, h]] of ROCKS.entries()) {
    const p = at(dx, dz);
    rock(b, { x: p.x, y: groundAt(p.x, p.z, 0.05), z: p.z }, r, h, i + 70);
  }
  for (const [i, [dx, dz, s]] of TUFTS.entries()) {
    const p = at(dx, dz);
    tuft(b, { x: p.x, y: groundAt(p.x, p.z, 0.02), z: p.z }, i + 90, DRY_TUFT, s);
  }
}

/** Les rochers de pierre chaude autour de l'anse : x, z depuis le sol de la scène, rayon, hauteur. */
const ROCKS: readonly (readonly [number, number, number, number])[] = [
  // Les deux pointes de l'anse : à l'ouest, au pied du ponton ; à l'est, dans l'eau au bout du cadre de face.
  [-5.8, -9.4, 1.1, 0.9],
  [-3.4, -12.4, 0.7, 0.9],
  [8.2, -4.2, 0.95, 1.9],
  // Sur la grève du sud-est, au-delà des barques, et au large du filet.
  [11.8, 7.0, 1.0, 1.4],
  [9.4, -9.4, 0.8, 1.8],
];

/** Les touffes d'herbe sèche, sur le sable : x, z, taille. */
const TUFTS: readonly (readonly [number, number, number])[] = [
  [5.2, 7.4, 1],
  [10.6, 11.0, 1.1],
  [9.8, 12.0, 0.9],
  [-4.0, -8.6, 1],
  [-6.2, -8.0, 0.8],
];

/**
 * Le filet tendu dans l'eau entre ses deux perches (le concept : « un filet tendu entre deux perches ») : les perches
 * plantées au fond, la ralingue du haut qui pend un peu au milieu, celle du bas un rien au-dessus de l'eau, des mailles
 * en losanges, des flotteurs sur la ralingue du bas ; un hauban de chaque perche vers le large. Les cordes sont des
 * rubans à deux faces : vues de face comme de dos.
 */
function strungNet(b: FacetBuilder, floor: Vec3): void {
  const N = FILETS_SURROUNDINGS.net;
  const A = { x: floor.x + N.a.dx, z: floor.z + N.a.dz },
    B = { x: floor.x + N.b.dx, z: floor.z + N.b.dz };
  const poleTop = N.top + 0.45;
  for (const p of [A, B]) b.beam({ x: p.x, y: groundAt(p.x, p.z, 0.1), z: p.z }, { x: p.x, y: poleTop, z: p.z }, 0.16, C.pole);
  // Un point du filet : `t` de A à B, `v` de la ralingue du bas (0) à celle du haut (1), qui pend au milieu.
  const point = (t: number, v: number): P3 => {
    const top = N.top - N.sag * 4 * t * (1 - t);
    return [A.x + (B.x - A.x) * t, N.bottom + (top - N.bottom) * v, A.z + (B.z - A.z) * t];
  };
  const n = 4;
  for (let i = 0; i < n; i++) {
    const t0 = i / n,
      t1 = (i + 1) / n;
    ribbon(b, point(t0, 1), point(t1, 1), 0.07, C.rope);
    ribbon(b, point(t0, 0), point(t1, 0), 0.06, C.rope);
  }
  // Les mailles : des diagonales dans les deux sens, d'une ralingue à l'autre.
  const m = 6;
  for (let i = 0; i < m; i++) {
    ribbon(b, point(i / m, 0), point((i + 1) / m, 1), 0.035, C.ropeShade);
    ribbon(b, point(i / m, 1), point((i + 1) / m, 0), 0.035, C.ropeShade);
  }
  for (const t of [1 / 6, 1 / 2, 5 / 6]) {
    const [x, , z] = point(t, 0);
    b.prism({ x, y: -0.05, z }, 0.13, 0.13, 0.17, 5, C.float, C.floatTop);
  }
  // Les haubans, des perches vers le large (le nord-est), jusqu'à un pieu dans l'eau.
  const ux = (B.x - A.x) / Math.hypot(B.x - A.x, B.z - A.z),
    uz = (B.z - A.z) / Math.hypot(B.x - A.x, B.z - A.z);
  for (const [p, sgn] of [
    [A, -1],
    [B, 1],
  ] as const) {
    const foot: P3 = [p.x + sgn * ux * 1.1 + uz * 0.9, 0.05, p.z + sgn * uz * 1.1 - ux * 0.9];
    ribbon(b, [p.x, poleTop - 0.1, p.z], foot, 0.05, C.ropeShade);
  }
}

/**
 * Un ruban de corde entre deux points, à deux faces (vu de part et d'autre) : sa largeur `w` dans le plan vertical qui le
 * porte (horizontale pour une corde dressée). Quatre triangles.
 */
function ribbon(b: FacetBuilder, p: P3, q: P3, w: number, color: number): void {
  const dx = q[0] - p[0],
    dy = q[1] - p[1],
    dz = q[2] - p[2];
  const h = Math.hypot(dx, dz);
  // La largeur : en hauteur pour une corde couchée, le long de l'horizontale pour une corde dressée.
  let ox: number, oy: number, oz: number;
  if (h > Math.abs(dy) * 0.5) {
    const l = Math.hypot(dx, dy, dz);
    // Perpendiculaire à la corde, dans le plan vertical qui la porte.
    ox = (-dx * dy) / (h * l);
    oy = h / l;
    oz = (-dz * dy) / (h * l);
  } else {
    ox = -dz / (h || 1);
    oy = 0;
    oz = dx / (h || 1);
  }
  const s = w / 2;
  const a: P3 = [p[0] - ox * s, p[1] - oy * s, p[2] - oz * s],
    c: P3 = [q[0] - ox * s, q[1] - oy * s, q[2] - oz * s],
    d: P3 = [q[0] + ox * s, q[1] + oy * s, q[2] + oz * s],
    e: P3 = [p[0] + ox * s, p[1] + oy * s, p[2] + oz * s];
  b.quad(a, c, d, e, color);
  b.quad(e, d, c, a, color);
}

/**
 * Une barque tirée au sec (la barque du kit, sans lanterne ni mât), sur le sable en `at`, sa proue vers `yaw` (0 : vers
 * l'est) ; posée sur son fond, la quille un rien enfoncée au plus haut du sable sous elle.
 */
function beachedBarque(b: FacetBuilder, at: { x: number; z: number }, yaw: number): void {
  const length = 2.3,
    width = 1.05;
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  let y = -Infinity;
  for (const u of [-length / 2, 0, length / 2 + 0.4]) y = Math.max(y, groundAt(at.x + u * c, at.z + u * s, 0.06));
  const local = new FacetBuilder();
  // `barque` pose le bas de la coque 0,3 sous `at.y` : le fond sur le sable.
  barque(local, { x: 0, y: 0.3, z: 0 }, length, width, { lantern: false, mast: false });
  // placeFacets tourne +x vers (cos, −sin) : la proue vers (cos yaw, sin yaw) demande −yaw.
  b.append(placeFacets(local.build(), { x: at.x, y, z: at.z, yaw: -yaw }));
}

/** Un panier d'osier posé sur le sable : un corps évasé à huit pans, son bord plus sombre. */
function basket(b: FacetBuilder, x: number, y: number, z: number): void {
  b.prism({ x, y, z }, 0.24, 0.32, 0.32, 8, C.wicker, C.wickerRim);
  b.band({ x, y: y + 0.26, z }, 0.33, 0.08, 8, C.wickerRim);
}
