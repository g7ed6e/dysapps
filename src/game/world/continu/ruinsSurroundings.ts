/**
 * Les abords de la scénette des Ruines (reprise lieu par lieu, d'après les concepts du 18 octobre 2026,
 * « scenettes-6e-ruines ») : un chantier de fouille autour du dallage où se tiennent Kéo et l'archéologue, fini de chaque
 * côté puisque la caméra tourne (« caméra libre »). De face, dans la moitié droite du cadre (directeur artistique) : au
 * fond, dans l'eau claire du lagon, une arcade de pierre des Passeurs encore debout (deux arcs surbaissés et leur
 * corniche, une troisième pile rompue), la partie déjà debout de la cité à demi noyée, au-delà de l'arcade du lieu qui se
 * relève ; derrière l'archéologue, la tente de fouille, sa toile écrue ; au premier plan, sous les pieds de Kéo et de
 * l'archéologue, le carré de fouille marqué de piquets et de cordeaux, son fond de sable, ses paniers d'osier, un tambour
 * de colonne couché, un bloc, et un chevalet qui porte un bloc taillé ; à côté, le tas de déblais. De dos, au pied de la
 * colline : une pile de blocs taillés, un fût de colonne debout, des rochers et des touffes ; à l'ouest, une colonne
 * couchée en trois tambours ; à l'est, des blocs épars. Tout ce qui est haut (l'arcade, la tente) se tient hors des
 * regards de la caméra sur Kéo et l'archéologue, de face, de côté et de dos ; le premier plan reste bas. Pierre claire et
 * chaude, bois, toile et osier, des aplats francs, une couleur par facette, jamais presque noir ; aucun appel de plus
 * (le décor de près).
 */
import type { FacetBuilder } from './facets';
import { FLORA_COLORS } from './flora';
import type { Vec3 } from './geometry';
import type { SurroundingsState } from './surroundings';
import { GREEN_TUFT, TIMBER, groundAt, heap, rock, tuft, type HeapTones, type P3 } from './surroundingsKit';

/** Les couleurs des abords : la pierre des Passeurs (celle du lieu), le bois, la toile, l'osier, la terre de la fouille. */
const C = {
  /** La pierre des Passeurs, son ombre, et un ton un peu plus chaud pour les blocs taillés. */
  stone: 0xdcd0b5,
  stoneShade: 0xb9a988,
  stoneWarm: 0xd3c4a3,
  /** Les piquets du carré de fouille, le bois du chevalet et les mâts de la tente. */
  stake: TIMBER.stave,
  wood: 0xb98654,
  woodDark: 0x8a6440,
  /** Les cordeaux tendus entre les piquets : clairs, pour se lire sur le sable. */
  cord: 0xf2eee4,
  /** Le fond de sable de la fouille (celui de la fouille du lieu) et la terre de son bord. */
  digSand: 0xcdb58a,
  digEdge: 0xa48b62,
  /** La toile écrue de la tente (celle de la tente de fouille du lieu), son pignon à l'ombre, son ouverture. */
  canvas: 0xe8e0cc,
  canvasShade: 0xd3c3a2,
  opening: 0x8c7a5c,
  /** L'osier des paniers : le corps, le bandeau plus clair, le creux de paille foncée (ceux des Filets). */
  straw: 0xb8862e,
  strawBand: 0xd9a441,
  strawInside: 0x8c6a2e,
} as const;

/** Les déblais : la terre de la fouille, plus foncée à son pied. */
const SPOIL: HeapTones = { base: 0x9c7f58, body: 0xb59a72, shade: 0xa48b62 };

/**
 * Où sont les abords, depuis le sol de la scène (`floor`, le milieu du dallage de Kéo et de l'archéologue ; x vers l'est,
 * z vers le sud) : l'arcade debout (sa ligne, ses piles, la pile rompue), la tente, le carré de fouille.
 */
export const RUINS_SURROUNDINGS = {
  /**
   * L'arcade debout, dans l'eau, au nord : assez loin pour que la caméra de dos, qui regarde Kéo par-dessus elle, ne la
   * touche pas, assez près pour remplir le haut de la moitié droite du cadre de face. Ses hauteurs se comptent depuis la
   * surface de l'eau (0).
   */
  // Ses piles tombent de part et d'autre du treuil et de l'archéologue, de face : aucune ne se dresse sur leur tête.
  arcade: { dz: -10.5, piles: [-1.0, 2.3, 5.6], broken: 8.8, pile: 0.7, depth: 0.8, impost: 2.3, rise: 0.72, ring: 0.32, spandrel: 0.22, cornice: 0.2 },
  /**
   * La tente de fouille, derrière l'archéologue, au bord nord de l'ancien dallage : son milieu, sa longueur (le long du
   * faîtage), sa largeur, sa hauteur, et son cap (son ouverture tournée vers le sud-ouest, vers la scène et la caméra de face).
   */
  tent: { dx: 4.0, dz: -2.0, length: 1.6, width: 1.6, height: 1.4, yaw: -0.55 },
  /** Le carré de fouille, au premier plan, au sud du dallage : ses bords. */
  dig: { x0: -1.9, x1: 1.5, z0: 2.9, z1: 4.6 },
} as const;

export function ruinsSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const X = (dx: number) => floor.x + dx;
  const Z = (dz: number) => floor.z + dz;
  arcade(b, floor);
  tent(b, X(RUINS_SURROUNDINGS.tent.dx), Z(RUINS_SURROUNDINGS.tent.dz));
  dig(b, floor);
  // Le tas de déblais, à l'est du carré, et un panier qui attend au bord du dallage.
  heap(b, X(2.6), groundAt(X(2.6), Z(4.5)), Z(4.5), 0.42, 7, SPOIL);
  basket(b, X(3.4), groundAt(X(3.4), Z(2.2)), Z(2.2));
  // Les blocs épars : x, z, cap, longueur, hauteur, profondeur.
  for (const [dx, dz, yaw, l, h, d] of BLOCKS) {
    const x = X(dx), z = Z(dz);
    b.box({ x, y: groundAt(x, z, 0.06), z, yaw }, [l, h, d], C.stoneShade, C.stone);
  }
  stack(b, X(-4.2), Z(6.8));
  // Le fût debout, au sud-ouest, son chapiteau carré.
  const sx = X(-6.6), sz = Z(5.0);
  const sy = groundAt(sx, sz, 0.08);
  b.prism({ x: sx, y: sy, z: sz }, 0.34, 0.3, 1.25, 8, C.stone, C.stoneShade);
  b.box({ x: sx, y: sy + 1.25, z: sz, yaw: 0.2 }, [0.78, 0.2, 0.78], C.stoneShade, C.stone);
  // La colonne couchée de l'ouest, en trois tambours qui ont roulé.
  for (const [dx, dz, yaw] of DRUMS) drum(b, X(dx), Z(dz), yaw);
  for (const [i, [dx, dz, r, h]] of ROCKS.entries()) {
    const x = X(dx), z = Z(dz);
    rock(b, { x, y: groundAt(x, z, 0.05), z }, r, h, 40 + i);
  }
  for (const [i, [dx, dz, s]] of TUFTS.entries()) {
    const x = X(dx), z = Z(dz);
    tuft(b, { x, y: groundAt(x, z), z }, 70 + i, GREEN_TUFT, s);
  }
  // Les dalles du chemin des blocs, du bout est du dallage jusqu'à la porte du lieu, où arrive le sentier : la scène se
  // raccorde au chemin (directeur artistique).
  for (const [i, [dx, dz, yaw]] of STEPS.entries()) {
    const x = X(dx), z = Z(dz);
    const y = groundAt(x, z) + 0.03;
    const c = Math.cos(yaw) * 0.42,
      s = Math.sin(yaw) * 0.42,
      cw = Math.cos(yaw) * 0.32,
      sw = Math.sin(yaw) * 0.32;
    faced(b, [[x - c - sw, y, z + s - cw], [x + c - sw, y, z - s - cw], [x + c + sw, y, z - s + cw], [x - c + sw, y, z + s + cw]], [0, 1, 0], i % 2 ? C.stone : C.stoneWarm);
  }
  for (const [dx, dz, s] of PINES) pine(b, X(dx), Z(dz), s);
}

/** Les dalles du chemin des blocs : dx, dz, cap. Au-delà de l'ancien dallage du lieu, jusqu'à la porte. */
const STEPS: readonly (readonly [number, number, number])[] = [
  [3.9, 3.2, 0.1],
  [4.1, 4.1, -0.15],
  [3.9, 5.0, 0.2],
  [4.2, 5.9, -0.05],
  [4.0, 6.8, 0.25],
  [4.4, 7.7, 0],
];

/** Les pins, au pied de la colline et à l'ouest, loin des sentiers : dx, dz, taille. */
const PINES: readonly (readonly [number, number, number])[] = [
  [-8.0, 10.5, 1.1],
  [9.4, 8.0, 0.95],
  [-11.2, 1.8, 1],
];

/** Un pin de l'archipel (./flora.ts) : un tronc court, deux cônes de feuillage sombre l'un sur l'autre. */
function pine(b: FacetBuilder, x: number, z: number, s: number): void {
  const y = groundAt(x, z, 0.05);
  b.prism({ x, y, z }, 0.14 * s, 0.11 * s, 0.6 * s, 5, FLORA_COLORS.trunk);
  b.prism({ x, y: y + 0.5 * s, z, yaw: 0.3 }, 0.95 * s, 0, 1.5 * s, 6, FLORA_COLORS.pine);
  b.prism({ x, y: y + 1.35 * s, z }, 0.68 * s, 0, 1.3 * s, 6, FLORA_COLORS.pineLight);
}

/** Les blocs taillés épars, posés au sol : dx, dz, cap, longueur, hauteur, profondeur. */
const BLOCKS: readonly (readonly [number, number, number, number, number, number])[] = [
  // À l'est, au-delà du chemin des blocs (bas : la caméra de côté regarde par-dessus) ; la place du tamis, l'aménagement
  // du lieu, au bout du dallage, reste libre.
  [6.6, 4.6, 0.4, 0.7, 0.36, 0.5],
  [7.4, 5.4, -0.3, 0.55, 0.3, 0.45],
  // Au bord ouest du dallage, sous le panneau de face, vus de côté.
  [-5.6, 1.6, 0.6, 0.6, 0.32, 0.5],
  // Au sud, sur le chemin des blocs, entre la pile et la fouille.
  [-3.0, 5.6, -0.2, 0.62, 0.34, 0.48],
];

/** Les tambours de la colonne couchée, à l'ouest : dx, dz, cap de leur axe. */
const DRUMS: readonly (readonly [number, number, number])[] = [
  [-7.4, -1.0, 0.25],
  [-8.3, -0.6, 0.35],
  [-9.2, 0.1, 0.9],
];

/** Les rochers : dx, dz, rayon, hauteur. */
const ROCKS: readonly (readonly [number, number, number, number])[] = [
  [-8.8, 7.6, 0.9, 0.8],
  [6.4, 7.8, 0.8, 0.7],
  [9.6, 4.6, 0.7, 0.6],
  [-10.4, -3.4, 0.8, 0.7],
];

/** Les touffes d'herbe : dx, dz, taille. Au bord du dallage (il se pose au sol), autour de la fouille, au pied des pierres. */
const TUFTS: readonly (readonly [number, number, number])[] = [
  [-4.9, 1.7, 0.9],
  [4.95, -1.6, 0.8],
  [-2.5, 2.6, 0.8],
  [2.1, 2.7, 0.9],
  [-2.3, 4.8, 1],
  [1.9, 5.1, 0.9],
  [-6.2, 5.6, 1],
  [-3.5, 7.4, 1],
  [5.6, 7.0, 1],
  [8.6, 5.3, 0.9],
  [-6.8, -1.6, 0.9],
  [7.2, 1.1, 0.8],
];

/** Les sommets `a`, `c`, `d` tournent-ils dans le sens inverse des aiguilles d'une montre, vus depuis `n` ? */
function toward(a: P3, c: P3, d: P3, n: P3): boolean {
  const u = [c[0] - a[0], c[1] - a[1], c[2] - a[2]],
    v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  return (u[1] * v[2] - u[2] * v[1]) * n[0] + (u[2] * v[0] - u[0] * v[2]) * n[1] + (u[0] * v[1] - u[1] * v[0]) * n[2] >= 0;
}

/** Un quadrilatère tourné vers `n`, quel que soit l'ordre de ses sommets. */
function faced(b: FacetBuilder, p: readonly P3[], n: P3, color: number): void {
  if (toward(p[0], p[1], p[2], n)) b.quad(p[0], p[1], p[2], p[3], color);
  else b.quad(p[3], p[2], p[1], p[0], color);
}

/** Un triangle tourné vers `n`, quel que soit l'ordre de ses sommets. */
function facedTriangle(b: FacetBuilder, a: P3, c: P3, d: P3, n: P3, color: number): void {
  if (toward(a, c, d, n)) b.triangle(a, c, d, color);
  else b.triangle(a, d, c, color);
}

/**
 * L'arcade debout, dans l'eau, au nord de la scène, d'est en ouest, face au sud : trois piles et leur imposte, deux arcs
 * surbaissés en anse de panier (comme ceux de l'arcade du lieu : jamais un plein cintre), leurs voussoirs en deux pierres
 * alternées, les tympans pleins, les deux bouts du mur au-dessus des piles, la corniche basse ; à l'est, une quatrième pile
 * rompue à mi-hauteur, et deux voussoirs tombés dans l'eau peu profonde. Ni clé ornée (celle du lieu reste la seule), ni
 * texte.
 */
function arcade(b: FacetBuilder, f: Vec3): void {
  const A = RUINS_SURROUNDINGS.arcade;
  const z = f.z + A.dz;
  const bed = (x: number) => groundAt(x, z, 0.1);
  const wallTop = A.impost + A.rise + A.ring + A.spandrel;
  for (const dx of A.piles) {
    const x = f.x + dx;
    b.box({ x, y: bed(x), z }, [A.pile, A.impost - 0.16 - bed(x), A.depth], C.stone);
    b.box({ x, y: A.impost - 0.16, z }, [A.pile + 0.14, 0.16, A.depth + 0.1], C.stoneShade);
  }
  const half = (A.piles[1] - A.piles[0]) / 2 - A.pile / 2;
  for (let k = 0; k + 1 < A.piles.length; k++) arch(b, f.x + (A.piles[k] + A.piles[k + 1]) / 2, z, half, wallTop);
  for (const [dx, side] of [
    [A.piles[0], -1],
    [A.piles[A.piles.length - 1], 1],
  ] as const)
    b.box({ x: f.x + dx + (side * A.pile) / 4, y: A.impost, z }, [A.pile / 2, wallTop - A.impost, A.depth], C.stone);
  const x0 = f.x + A.piles[0] - A.pile / 2 - 0.12,
    x1 = f.x + A.piles[A.piles.length - 1] + A.pile / 2 + 0.12;
  b.box({ x: (x0 + x1) / 2, y: wallTop, z }, [x1 - x0, A.cornice, A.depth + 0.24], C.stoneShade, C.stone);
  // La pile rompue, à l'est : son haut cassé en biais (deux pierres décalées), et deux voussoirs tombés à son pied.
  const bx = f.x + A.broken;
  b.box({ x: bx, y: bed(bx), z }, [A.pile, 1.35 - bed(bx), A.depth], C.stone, C.stoneShade);
  b.box({ x: bx - 0.08, y: 1.35, z, yaw: 0.15 }, [A.pile * 0.7, 0.4, A.depth * 0.8], C.stone, C.stoneShade);
  for (const [dx, dz, yaw] of [
    [-1.3, 0.9, 0.5],
    [-0.4, 1.6, -0.6],
  ] as const)
    b.box({ x: bx + dx, y: -0.2, z: z + dz, yaw, pitch: 0.15 }, [0.5, 0.34, 0.42], C.stoneShade, C.stone);
}

/**
 * Un arc surbaissé de l'arcade debout, de centre `cx`, à `z` : ses voussoirs (face avant, face arrière, douelle) en deux
 * pierres alternées, et les tympans au-dessus jusqu'au haut du mur (`top`), devant et derrière ; le dessus du mur.
 */
function arch(b: FacetBuilder, cx: number, z: number, half: number, top: number): void {
  const A = RUINS_SURROUNDINGS.arcade;
  const [zf, zb] = [z + A.depth / 2, z - A.depth / 2];
  const inner = (t: number) => [cx + half * Math.cos(t), A.impost + A.rise * Math.sin(t)] as const;
  const outer = (t: number) => [cx + (half + A.ring) * Math.cos(t), A.impost + (A.rise + A.ring) * Math.sin(t)] as const;
  const n = 7;
  for (let k = 0; k < n; k++) {
    const [ta, tb] = [Math.PI - (k * Math.PI) / n, Math.PI - ((k + 1) * Math.PI) / n];
    const [ia, ib, oa, ob] = [inner(ta), inner(tb), outer(ta), outer(tb)];
    const color = k % 2 ? C.stone : C.stoneShade;
    for (const [zz, out] of [
      [zf, 1],
      [zb, -1],
    ] as const) {
      faced(b, [[ia[0], ia[1], zz], [ib[0], ib[1], zz], [ob[0], ob[1], zz], [oa[0], oa[1], zz]], [0, 0, out], color);
      faced(b, [[oa[0], oa[1], zz], [ob[0], ob[1], zz], [ob[0], top, zz], [oa[0], top, zz]], [0, 0, out], C.stone);
    }
    const mid = (ta + tb) / 2;
    faced(b, [[ia[0], ia[1], zf], [ib[0], ib[1], zf], [ib[0], ib[1], zb], [ia[0], ia[1], zb]], [-Math.cos(mid), -Math.sin(mid), 0], C.stoneShade);
  }
  faced(b, [[cx - half - A.ring, top, zf], [cx + half + A.ring, top, zf], [cx + half + A.ring, top, zb], [cx - half - A.ring, top, zb]], [0, 1, 0], C.stone);
}

/**
 * La tente de fouille, sa toile écrue tendue en deux pans jusqu'au sol, son faîtage du nord au sud, ses pignons au nord
 * et au sud ; au sud, vers la caméra de face, l'ouverture, un triangle plus sombre (jamais noir) ; à chaque pignon, son
 * mât, qui dépasse du faîtage.
 */
function tent(b: FacetBuilder, x: number, z: number): void {
  const T = RUINS_SURROUNDINGS.tent;
  const c = Math.cos(T.yaw),
    s = Math.sin(T.yaw);
  // Un point de la tente : `u` en travers (vers l'est quand le cap est nul), `w` le long du faîtage (vers le sud), `v` en hauteur.
  let y = Infinity;
  for (const su of [-1, 1]) for (const sw of [-1, 1]) y = Math.min(y, groundAt(x + (su * T.width * c) / 2 + (sw * T.length * s) / 2, z - (su * T.width * s) / 2 + (sw * T.length * c) / 2, 0.04));
  const at = (u: number, v: number, w: number): P3 => [x + u * c + w * s, y + v, z - u * s + w * c];
  const [hw, hl, h] = [T.width / 2, T.length / 2, T.height];
  const n = (u: number, v: number, w: number): P3 => [u * c + w * s, v, -u * s + w * c];
  // Les deux pans, jusqu'au sol, puis les deux pignons ; au pignon du sud, l'ouverture.
  faced(b, [at(-hw, 0, -hl), at(-hw, 0, hl), at(0, h, hl), at(0, h, -hl)], n(-h, hw, 0), C.canvas);
  faced(b, [at(hw, 0, -hl), at(hw, 0, hl), at(0, h, hl), at(0, h, -hl)], n(h, hw, 0), C.canvas);
  for (const sw of [-1, 1]) facedTriangle(b, at(-hw, 0, sw * hl), at(hw, 0, sw * hl), at(0, h, sw * hl), n(0, 0, sw), C.canvasShade);
  const front = hl + 0.015;
  facedTriangle(b, at(-0.36, 0, front), at(0.36, 0, front), at(0, h * 0.74, front), n(0, 0, 1), C.opening);
  for (const sw of [-1, 1]) {
    const foot = at(0, -0.1, sw * (hl + 0.05)),
      top = at(0, h + 0.16, sw * (hl + 0.05));
    b.beam({ x: foot[0], y: foot[1], z: foot[2] }, { x: top[0], y: top[1], z: top[2] }, 0.06, C.woodDark);
  }
}

/**
 * Le carré de fouille, au premier plan : un fond de sable d'une seule couleur (jamais des couches) dans un bord de terre
 * bas, six piquets et les cordeaux tendus de l'un à l'autre ; dedans, deux paniers d'osier, un tambour de colonne couché,
 * un bloc, et le chevalet qui porte un bloc taillé. Rien n'y passe la hauteur des genoux de Kéo vus de la caméra de face :
 * tout reste sous leurs pieds à l'écran.
 */
function dig(b: FacetBuilder, f: Vec3): void {
  const D = RUINS_SURROUNDINGS.dig;
  const [x0, x1, z0, z1] = [f.x + D.x0, f.x + D.x1, f.z + D.z0, f.z + D.z1];
  let y = -Infinity;
  for (const x of [x0, x1]) for (const z of [z0, z1]) y = Math.max(y, groundAt(x, z));
  const low = Math.min(groundAt(x0, z0), groundAt(x1, z1), groundAt(x0, z1), groundAt(x1, z0)) - 0.08;
  const rim = 0.1;
  faced(b, [[x0, y + 0.04, z0], [x1, y + 0.04, z0], [x1, y + 0.04, z1], [x0, y + 0.04, z1]], [0, 1, 0], C.digSand);
  const [cx, cz, w, d] = [(x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0];
  for (const side of [-1, 1]) {
    b.box({ x: cx, y: low, z: cz + (side * (d + rim)) / 2 }, [w + 2 * rim, y + 0.06 - low, rim], C.digEdge);
    b.box({ x: cx + (side * (w + rim)) / 2, y: low, z: cz }, [rim, y + 0.06 - low, d], C.digEdge);
  }
  // Les piquets, aux coins et au milieu des longs bords, et les cordeaux, de piquet en piquet.
  const ring: [number, number][] = [
    [x0 - rim / 2, z0 - rim / 2],
    [cx, z0 - rim / 2],
    [x1 + rim / 2, z0 - rim / 2],
    [x1 + rim / 2, z1 + rim / 2],
    [cx, z1 + rim / 2],
    [x0 - rim / 2, z1 + rim / 2],
  ];
  for (const [x, z] of ring) b.box({ x, y: y - 0.05, z }, [0.07, 0.47, 0.07], C.stake);
  // Un cordeau par bord, d'un coin à l'autre (il passe contre le piquet du milieu des longs bords).
  for (const [i, j] of [
    [0, 2],
    [2, 3],
    [3, 5],
    [5, 0],
  ] as const)
    b.beam({ x: ring[i][0], y: y + 0.32, z: ring[i][1] }, { x: ring[j][0], y: y + 0.32, z: ring[j][1] }, 0.025, C.cord);
  const g = y + 0.04;
  basket(b, f.x - 1.4, g, f.z + 4.2);
  basket(b, f.x + 1.05, g, f.z + 4.2);
  drum(b, f.x - 0.8, f.z + 3.5, 0.3, g);
  b.box({ x: f.x + 1.05, y: g, z: f.z + 3.35, yaw: 0.35 }, [0.5, 0.3, 0.4], C.stoneShade, C.stoneWarm);
  trestle(b, f.x + 0.2, g, f.z + 3.85);
}

/** Un panier d'osier posé en (x, y, z) : son corps évasé, son bandeau plus clair, son creux de paille foncée. */
function basket(b: FacetBuilder, x: number, y: number, z: number): void {
  b.prism({ x, y, z }, 0.17, 0.24, 0.26, 7, C.straw, C.strawInside);
  b.band({ x, y: y + 0.15, z }, 0.235, 0.07, 7, C.strawBand);
}

/** Un tambour de colonne couché sur le flanc, son axe au cap `yaw`, son pied au sol (ou en `y`). */
function drum(b: FacetBuilder, x: number, z: number, yaw: number, y = groundAt(x, z, 0.06)): void {
  const r = 0.3;
  b.drum({ x, y: y + r, z, yaw: yaw + Math.PI / 2, pitch: Math.PI / 2 }, r, 0.5, 8, C.stone, C.stoneShade);
}

/** Le chevalet de bois qui porte un bloc taillé : deux pieds en A, la traverse, le bloc posé dessus. */
function trestle(b: FacetBuilder, x: number, y: number, z: number): void {
  const h = 0.5;
  for (const dx of [-0.38, 0.38]) for (const dz of [-0.22, 0.22]) b.beam({ x: x + dx, y, z: z + dz }, { x: x + dx * 0.9, y: y + h, z }, 0.05, C.wood);
  b.beam({ x: x - 0.46, y: y + h, z }, { x: x + 0.46, y: y + h, z }, 0.08, C.woodDark);
  b.box({ x, y: y + h + 0.04, z, yaw: 0.1 }, [0.56, 0.34, 0.4], C.stoneShade, C.stoneWarm);
}

/** La pile de blocs taillés, au pied de la colline, au sud-ouest : trois en bas, deux au-dessus, croisés. */
function stack(b: FacetBuilder, x: number, z: number): void {
  const y = groundAt(x, z, 0.04);
  for (const dx of [-0.62, 0, 0.62]) b.box({ x: x + dx, y, z }, [0.58, 0.36, 0.7], C.stoneShade, C.stone);
  for (const dx of [-0.31, 0.31]) b.box({ x: x + dx, y: y + 0.36, z: z + 0.04 }, [0.58, 0.34, 0.66], C.stoneShade, C.stoneWarm);
}
