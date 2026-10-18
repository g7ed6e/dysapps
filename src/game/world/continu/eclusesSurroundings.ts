/**
 * Les abords de la scénette des Écluses (reprise du lieu d'après le concept validé du 18 octobre 2026, « scenettes-6e-
 * ecluses-v2 ») : le canal bordé de blocs de pierre grise à facettes, raccordé de chaque côté (il sort d'une voûte sous
 * la colline à l'ouest ; à l'est, une porte d'aval, puis un ruisseau qui descend vers la mer), sa berge nord en herbe,
 * qui descend en talus derrière les dalles, le chemin de halage sur la berge sud, de gros rochers gris clair, des
 * touffes d'herbe, des sapins et la maison à colombages de l'éclusier, au toit d'ardoise bleue, sur la colline. Fini tout
 * autour (la caméra tourne à deux doigts) ; ce qui est haut reste hors du tour de la caméra, ce qui est près reste bas :
 * rien ne cache Kéo, l'éclusier, le sas ni la rangée des leviers. Aplats francs, une couleur par facette, rien de
 * presque noir. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { COLORS_6E } from './plan6e';
import { LOCK } from './questionScene';
import type { SurroundingsState } from './surroundings';
import { heightAt } from './terrain';

const C = {
  // La pierre des berges (le gris des ouvrages voisins, consultant Archipéo) : deux tons de flanc, un dessus plus clair.
  block: 0xb2b2ad,
  blockAlt: 0xa2a29d,
  blockTop: 0xd2d2cc,
  blockBevel: 0xc2c2bc,
  blockBevelAlt: 0xb8b8b2,
  // Les rochers, gris clair, leurs facettes en deux tons.
  boulder: 0xc6c3bb,
  boulderShade: 0xaeaba3,
  grass: COLORS_6E.grass,
  grassLight: 0x90d8a2,
  grassDeep: 0x82cd95,
  rock: COLORS_6E.rock,
  // Les touffes d'herbe et les sapins : deux verts plus soutenus que la prairie, le tronc brun moyen.
  tuft: 0x5fae6a,
  tuftDark: 0x4c9a5a,
  fir: 0x3f8f5a,
  firLight: 0x56a568,
  trunk: 0x8a5a36,
  // La maison de l'éclusier : le crépi crème, les colombages bruns (pas noirs), l'ardoise bleue, la porte rouge.
  wall: 0xefe6d2,
  timber: 0x8a5a36,
  slate: 0x5f7f9a,
  slateGable: 0x6f8fa8,
  door: 0xc0503a,
  glass: 0xbfd0d3,
  chimney: 0x9aa0a3,
  // La voûte d'où sort le canal : son arc clair, son creux d'un bleu-vert profond (jamais noir).
  arch: 0xd2cfc7,
  hollow: 0x3f6f74,
  // Les portes d'aval : le bois de la porte du sas.
  gate: 0x9a7048,
  water: COLORS_6E.lagoon,
} as const;

/** Un nombre entre 0 et 1, toujours le même pour un même `n` (le décor ne change pas d'une visite à l'autre). */
function jitter(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Le sol du monde en un point, un peu enfoncé : ce qu'on y pose ne flotte jamais au-dessus d'une facette plus basse. */
const groundAt = (x: number, z: number): number => heightAt({ x, z }) - 0.15;

export function eclusesSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const o = floor;
  const water = o.y - LOCK.water;
  const north = o.z + LOCK.front;
  const south = o.z + LOCK.back;
  const reach = LOCK.reach;
  bankBlocks(b, o, water, north, south, reach);
  northBank(b, o, north, reach);
  vault(b, o, water, north, south, reach);
  tailGate(b, o, water, north, south, reach);
  for (const [k, [dx, dz, r, h]] of BOULDERS.entries()) {
    const x = o.x + dx, z = o.z + dz;
    boulder(b, { x, y: dz > LOCK.back && Math.abs(dx) < reach + LOCK.bank ? o.y : groundAt(x, z), z }, r, h, k);
  }
  for (const [k, [dx, dz]] of TUFTS.entries()) {
    const x = o.x + dx, z = o.z + dz;
    tuft(b, { x, y: dz > LOCK.back && Math.abs(dx) < reach + LOCK.bank ? o.y : Math.max(o.y, groundAt(x, z) + 0.1), z }, k);
  }
  for (const [k, [dx, dz, r]] of MOUNDS.entries()) mound(b, { x: o.x + dx, y: o.y, z: o.z + dz }, r, k);
  for (const [k, [dx, dz, s]] of FIRS.entries()) fir(b, o.x + dx, o.z + dz, s, k);
  lockKeeperHouse(b, o.x + HOUSE.dx, o.z + HOUSE.dz);
}

/**
 * Les blocs de pierre du canal : au sud, une rangée de gros blocs inégaux, leur dessus un peu au-dessus de la berge, leur
 * face dans l'eau ; au nord, devant les dalles de Kéo, du sas et de l'éclusier, une margelle au ras du sol (rien n'y
 * dépasse sous leurs pieds), puis, au-delà des dalles, des blocs comme au sud.
 */
function bankBlocks(b: FacetBuilder, o: Vec3, water: number, north: number, south: number, reach: number): void {
  const deep = water - 0.2;
  let x = o.x - reach;
  let k = 0;
  while (x < o.x + reach - 0.2) {
    const len = Math.min(o.x + reach - x, 1.2 + 0.6 * jitter(k));
    const rise = 0.18 + 0.24 * jitter(k + 40);
    chunk(b, { x: x + len / 2, y: deep, z: south + 0.34, yaw: (jitter(k + 80) - 0.5) * 0.1 }, [len - 0.07, o.y + rise - deep, 0.78], k);
    x += len;
    k++;
  }
  // Au nord : la margelle devant les dalles (|x| < DECK), des blocs au-delà.
  x = o.x - reach;
  k = 0;
  while (x < o.x + reach - 0.2) {
    const len = Math.min(o.x + reach - x, 1.3 + 0.6 * jitter(k + 120));
    const mid = x + len / 2 - o.x;
    if (Math.abs(mid) < DECK + 0.3) b.box({ x: x + len / 2, y: deep, z: north - 0.12 }, [len - 0.05, o.y + 0.025 - deep, 0.3], k % 2 ? C.block : C.blockAlt, C.blockTop);
    else chunk(b, { x: x + len / 2, y: deep, z: north - 0.24, yaw: (jitter(k + 170) - 0.5) * 0.1 }, [len - 0.07, o.y + 0.16 + 0.2 * jitter(k + 160) - deep, 0.6], k + 1);
    x += len;
    k++;
  }
}

/**
 * Un bloc de pierre taillé à facettes : un pavé dont les quatre arêtes du haut sont abattues (`BEVEL`), ses flancs de
 * l'un des deux gris, ses pans abattus de deux gris moyens, son dessus clair.
 */
function chunk(b: FacetBuilder, at: { x: number; y: number; z: number; yaw: number }, size: readonly [number, number, number], k: number): void {
  const [sx, sy, sz] = size;
  const e = Math.min(BEVEL, sx / 3, sz / 3, sy / 2);
  const c = Math.cos(at.yaw), s = Math.sin(at.yaw);
  const v = (px: number, py: number, pz: number): [number, number, number] => [at.x + px * c + pz * s, at.y + py, at.z - px * s + pz * c];
  const x0 = -sx / 2, x1 = sx / 2, z0 = -sz / 2, z1 = sz / 2, y1 = sy - e;
  const side = k % 2 ? C.blockAlt : C.block;
  b.quad(v(x0, 0, z1), v(x1, 0, z1), v(x1, y1, z1), v(x0, y1, z1), side);
  b.quad(v(x1, 0, z0), v(x0, 0, z0), v(x0, y1, z0), v(x1, y1, z0), side);
  b.quad(v(x1, 0, z1), v(x1, 0, z0), v(x1, y1, z0), v(x1, y1, z1), side);
  b.quad(v(x0, 0, z0), v(x0, 0, z1), v(x0, y1, z1), v(x0, y1, z0), side);
  const i0 = x0 + e, i1 = x1 - e, j0 = z0 + e, j1 = z1 - e;
  b.quad(v(x0, y1, z1), v(x1, y1, z1), v(i1, sy, j1), v(i0, sy, j1), C.blockBevel);
  b.quad(v(x1, y1, z0), v(x0, y1, z0), v(i0, sy, j0), v(i1, sy, j0), C.blockBevel);
  b.quad(v(x1, y1, z1), v(x1, y1, z0), v(i1, sy, j0), v(i1, sy, j1), C.blockBevelAlt);
  b.quad(v(x0, y1, z0), v(x0, y1, z1), v(i0, sy, j1), v(i0, sy, j0), C.blockBevelAlt);
  b.quad(v(i0, sy, j0), v(i0, sy, j1), v(i1, sy, j1), v(i1, sy, j0), C.blockTop);
}

/** L'arête abattue des blocs du canal. */
const BEVEL = 0.16;

/** La demi-largeur des dalles de la scène (le sas, Kéo et l'éclusier), et leur profondeur (scenette.ts, `lockQuay`). */
const DECK = 5.8;
const DECK_DEPTH = 1.6;

/**
 * La berge nord, au-delà des dalles : de l'herbe au niveau du quai, puis, derrière les dalles et la berge, un talus
 * d'herbe qui descend vers le nord jusque sous le sol (le dos des dalles ne fait plus un mur). Le milieu reste ouvert :
 * le lieu, ses bassins, y monte vers le nord.
 */
function northBank(b: FacetBuilder, o: Vec3, north: number, reach: number): void {
  const back = o.z - DECK_DEPTH / 2;
  const foot = o.y - 3.2;
  for (const side of [-1, 1]) {
    const x0 = o.x + side * DECK, x1 = o.x + side * reach;
    b.box({ x: (x0 + x1) / 2, y: foot, z: (back + north) / 2 }, [Math.abs(x1 - x0), o.y - foot, north - back], C.rock, C.grass);
  }
  for (const [x0, x1] of TALUS) talus(b, o.x + x0, o.x + x1, back, back - 4.2, o.y - 0.01, foot);
  // Entre les talus, le dos de la plate-forme du sas, que le lieu laisse voir : un parement de blocs gris, deux assises
  // aux joints décalés (la tranche des dalles dans les joints).
  const [, left] = TALUS[0], [right] = TALUS[1];
  const at = { x: o.x + (left + right) / 2, y: foot, z: back - 0.012, yaw: Math.PI };
  const half = (right - left) / 2, course = (o.y - foot) / 2;
  for (let k = 0; k < 2; k++) {
    const cuts = k ? [-half, -half / 3, half / 2, half] : [-half, 0, half];
    for (let i = 0; i + 1 < cuts.length; i++) b.plate(at, rect(cuts[i] + 0.03, k * course + 0.03, cuts[i + 1] - 0.03, (k + 1) * course - 0.03), (i + k) % 2 ? C.blockAlt : C.block);
  }
}

/** Les deux talus derrière les dalles (en x depuis le milieu du sas) : le lieu monte entre eux. */
const TALUS: readonly (readonly [number, number])[] = [
  [-LOCK.reach, -2.1],
  [3.1, LOCK.reach],
];

/** Un talus d'herbe de `x0` à `x1` : son haut en `zTop` (à `yTop`), son pied plus au nord, en `zFoot` (à `yFoot`). */
function talus(b: FacetBuilder, x0: number, x1: number, zTop: number, zFoot: number, yTop: number, yFoot: number): void {
  b.quad([x0, yTop, zTop], [x1, yTop, zTop], [x1, yFoot, zFoot], [x0, yFoot, zFoot], C.grass);
  b.triangle([x0, yTop, zTop], [x0, yFoot, zFoot], [x0, yFoot, zTop], C.rock);
  b.triangle([x1, yTop, zTop], [x1, yFoot, zTop], [x1, yFoot, zFoot], C.rock);
}

/**
 * La voûte de l'amont, au bout ouest du canal : le mur de tête, de pierre, sous la colline (un remblai d'herbe), son arc
 * clair et son creux, d'où le canal sort ; sa margelle sur le haut du mur.
 */
function vault(b: FacetBuilder, o: Vec3, water: number, north: number, south: number, reach: number): void {
  const x = o.x - reach;
  const mid = (north + south) / 2;
  const top = o.y + 1.7;
  b.box({ x: x - 0.4, y: water - 0.4, z: mid }, [0.8, top - water + 0.4, south - north + 3.4], C.block, C.blockTop);
  b.box({ x: x - 0.35, y: top, z: mid }, [1, 0.16, south - north + 3.6], C.blockAlt, C.blockTop);
  // Le remblai de la colline, au-dessus et derrière la voûte : son dessus d'herbe, ses flancs de roche.
  b.box({ x: x - 3, y: o.y - 3, z: mid }, [4.4, top + 0.12 - (o.y - 3), south - north + 6], C.rock, C.grass);
  const arc = (r: number, foot: number): [number, number][] => {
    const pts: [number, number][] = [[r, foot]];
    for (let k = 0; k <= 6; k++) pts.push([r * Math.cos((k * Math.PI) / 6), 0.55 + r * Math.sin((k * Math.PI) / 6)]);
    pts.push([-r, foot]);
    return pts;
  };
  const face = { x: x + 0.005, y: water, z: mid, yaw: Math.PI / 2 };
  b.plate(face, arc(1.05, 0), C.arch);
  b.plate({ ...face, x: x + 0.012 }, arc(0.78, 0), C.hollow);
}

/**
 * La porte d'aval, au bout est du canal : deux bornes de pierre, deux vantaux de bois fermés et leurs balanciers sur
 * les berges ; au-delà, l'eau descend en ruisseau vers la mer, au nord-est.
 */
function tailGate(b: FacetBuilder, o: Vec3, water: number, north: number, south: number, reach: number): void {
  const x = o.x + reach - 0.25;
  const mid = (north + south) / 2;
  for (const z of [north - 0.1, south + 0.1]) b.box({ x, y: water, z }, [0.42, o.y + 0.55 - water, 0.42], C.blockAlt, C.blockTop);
  for (const side of [-1, 1]) {
    const z = mid + (side * (south - north)) / 4;
    b.box({ x: x + 0.05, y: water - 0.3, z }, [0.16, o.y + 0.35 - water + 0.3, (south - north) / 2 - 0.04], C.gate);
    b.beam({ x: x + 0.05, y: o.y + 0.3, z: side < 0 ? north : south }, { x: x + 1.5, y: o.y + 0.3, z: side < 0 ? north - 0.5 : south + 0.5 }, 0.13, C.gate);
  }
  // Le ruisseau : un ruban d'eau posé sur le sol, qui descend de la porte vers la mer.
  let prev: { x: number; z: number; y: number; w: number } | null = null;
  for (const [dx, dz, w] of STREAM) {
    const px = o.x + dx, pz = o.z + dz;
    const y: number = prev ? heightAt({ x: px, z: pz }) + 0.18 : water - 0.04;
    const p = { x: px, z: pz, y: Math.max(0.05, y), w };
    if (prev) {
      const ux = p.x - prev.x, uz = p.z - prev.z, l = Math.hypot(ux, uz) || 1;
      const nx = -uz / l, nz = ux / l;
      b.quad(
        [prev.x - nx * prev.w, prev.y, prev.z - nz * prev.w],
        [prev.x + nx * prev.w, prev.y, prev.z + nz * prev.w],
        [p.x + nx * p.w, p.y, p.z + nz * p.w],
        [p.x - nx * p.w, p.y, p.z - nz * p.w],
        C.water,
      );
    }
    prev = p;
  }
}

/** Le ruisseau sous la porte d'aval, depuis le milieu du sas : ses points (x, z) et sa demi-largeur, vers la mer. */
const STREAM: readonly (readonly [number, number, number])[] = [
  [LOCK.reach, 1.5, 0.75],
  [14.5, 1.2, 0.7],
  [17, -0.4, 0.6],
  [19.5, -3, 0.55],
  [22, -6, 0.5],
  [24.5, -9, 0.5],
];

/**
 * Un rocher à facettes : une base à six pans un peu enfoncée, une ceinture plus étroite, une pointe ; chaque facette de
 * l'un des deux gris, l'un après l'autre.
 */
function boulder(b: FacetBuilder, at: Vec3, r: number, h: number, seed: number): void {
  const n = 6;
  const lo: [number, number, number][] = [];
  const hi: [number, number, number][] = [];
  for (let k = 0; k < n; k++) {
    const a = ((k + jitter(seed * 7 + k) * 0.4) * 2 * Math.PI) / n;
    const r0 = r * (0.85 + 0.25 * jitter(seed * 11 + k));
    lo.push([at.x + r0 * Math.cos(a), at.y - 0.15, at.z + r0 * Math.sin(a)]);
    const a1 = a + Math.PI / n;
    const r1 = r * (0.55 + 0.25 * jitter(seed * 13 + k));
    hi.push([at.x + r1 * Math.cos(a1), at.y + h * (0.55 + 0.2 * jitter(seed * 17 + k)), at.z + r1 * Math.sin(a1)]);
  }
  const tip: [number, number, number] = [at.x + (jitter(seed) - 0.5) * r * 0.4, at.y + h, at.z + (jitter(seed + 3) - 0.5) * r * 0.4];
  for (let k = 0; k < n; k++) {
    const m = (k + 1) % n;
    b.triangle(lo[m], lo[k], hi[k], k % 2 ? C.boulder : C.boulderShade);
    b.triangle(lo[m], hi[k], hi[m], k % 2 ? C.boulderShade : C.boulder);
    b.triangle(tip, hi[m], hi[k], k % 2 ? C.boulder : C.blockTop);
  }
}

/** Les rochers, depuis le milieu du sas : (x, z, rayon, hauteur). Sur la berge, loin des leviers ; derrière, sur la pente. */
const BOULDERS: readonly (readonly [number, number, number, number])[] = [
  [8.6, 4.6, 0.9, 1.1],
  [10.4, 6.8, 1.2, 1.4],
  [-8.4, 5.4, 1, 1.2],
  [-10.6, 8.2, 0.8, 0.9],
  [-7.6, -4.4, 1.1, 1.3],
  [8.2, -4.8, 0.9, 1],
  [-13.5, 4.6, 1.2, 1.5],
  [14.6, 4, 1, 1.1],
];

/** Une touffe d'herbe : trois brins en pointe, un peu penchés, de deux verts. */
function tuft(b: FacetBuilder, at: Vec3, seed: number): void {
  for (let k = 0; k < 3; k++) {
    const a = (k * 2 * Math.PI) / 3 + jitter(seed + k) * 0.6;
    const h = 0.32 + 0.18 * jitter(seed * 3 + k);
    b.prism({ x: at.x + 0.09 * Math.cos(a), y: at.y, z: at.z + 0.09 * Math.sin(a), yaw: a, pitch: 0.25 }, 0.07, 0, h, 3, k % 2 ? C.tuft : C.tuftDark);
  }
}

/** Les touffes d'herbe, depuis le milieu du sas : le long du chemin de halage, au pied des rochers, sur la berge nord. */
const TUFTS: readonly (readonly [number, number])[] = [
  [-6.4, 3.9],
  [-4.2, 4.1],
  [-1.6, 3.95],
  [1.2, 4.05],
  [4.6, 3.9],
  [6.8, 4.2],
  [7.6, 5.2],
  [9.4, 5.8],
  [-7.4, 6.1],
  [-9.6, 6.8],
  [-11.2, 4],
  [11.6, 3.6],
  [-6.6, 0.1],
  [-8.6, -0.2],
  [-10.6, 0.3],
  [6.6, 0.2],
  [8.8, -0.1],
  [10.8, 0.3],
  [-3.4, 9.6],
  [2.6, 10.4],
  [5.4, 8.6],
  [-6, -3.2],
  [6.4, -3.4],
];

/**
 * Une bosse d'herbe à peine levée sur la berge : un cône très plat à six pans, de deux verts, qui casse l'aplat de la
 * prairie (le concept : une herbe à facettes), sans rien cacher (elle ne monte qu'à `MOUND_RISE`).
 */
function mound(b: FacetBuilder, at: Vec3, r: number, seed: number): void {
  const n = 6;
  const ring = Array.from({ length: n }, (_, k): [number, number, number] => {
    const a = ((k + jitter(seed * 5 + k) * 0.5) * 2 * Math.PI) / n;
    const rr = r * (0.8 + 0.3 * jitter(seed * 9 + k));
    return [at.x + rr * Math.cos(a), at.y - 0.02, at.z + rr * Math.sin(a)];
  });
  const tip: [number, number, number] = [at.x, at.y + MOUND_RISE, at.z];
  for (let k = 0; k < n; k++) b.triangle(tip, ring[(k + 1) % n], ring[k], k % 2 ? C.grassLight : C.grassDeep);
}

const MOUND_RISE = 0.12;

/** Les bosses d'herbe, depuis le milieu du sas : (x, z, rayon), sur la berge, à l'écart du ponton des leviers. */
const MOUNDS: readonly (readonly [number, number, number])[] = [
  [-5.6, 5.4, 1.4],
  [-1.2, 5.6, 1.2],
  [3.2, 5.3, 1.3],
  [7.2, 6.8, 1.5],
  [-8.6, 9.8, 1.6],
  [6.4, 10.6, 1.5],
  [-11.2, 4.6, 1.3],
  [-9.6, -0.1, 1.2],
  [9.8, 0, 1.2],
];

/** Un sapin à facettes : son tronc, trois étages de cônes à six pans, de deux verts, posé sur le sol du monde. */
function fir(b: FacetBuilder, x: number, z: number, s: number, seed: number): void {
  const y = groundAt(x, z);
  const yaw = jitter(seed + 200) * Math.PI;
  b.prism({ x, y, z, yaw }, 0.16 * s, 0.12 * s, 0.9 * s, 4, C.trunk);
  for (let k = 0; k < 3; k++) {
    const r = (1.25 - 0.3 * k) * s;
    b.prism({ x, y: y + (0.7 + 0.85 * k) * s, z, yaw: yaw + k * 0.5 }, r, 0, 1.5 * s, 6, k % 2 ? C.firLight : C.fir);
  }
}

/**
 * Les sapins, depuis le milieu du sas : (x, z, échelle). Tous hors du tour de la caméra (elle tourne à quelque 18,5
 * unités du sas ; eux, à plus de 22) : ils font le fond de chaque côté, jamais un écran devant Kéo ou l'éclusier.
 */
const FIRS: readonly (readonly [number, number, number])[] = [
  [-24, 1, 1.6],
  [-27, -4.5, 1.4],
  [-22.5, 7.5, 1.5],
  [-21, -15, 1.7],
  [-17.5, -18.5, 1.5],
  [-12, -20.5, 1.4],
  [-10, 21.5, 1.4],
  [-17, 17.5, 1.6],
  [8.5, 22.5, 1.5],
  [22.5, 10, 1.6],
];

/**
 * La maison de l'éclusier, au sud-ouest, au-delà de la berge, depuis le milieu du sas : hors du tour de la caméra, au
 * fond quand on regarde la scène de dos (le dos du sas, la berge, puis elle).
 */
const HOUSE = { dx: -6, dz: 22.5, w: 4, d: 2.8, h: 2.2, roof: 1.6 } as const;

/**
 * La maison de l'éclusier : un socle de pierre qui rattrape la pente, des murs de crépi crème à colombages bruns, un
 * toit d'ardoise bleue à deux pans, une cheminée, une porte rouge et des fenêtres.
 */
function lockKeeperHouse(b: FacetBuilder, x: number, z: number): void {
  const { w, d, h, roof } = HOUSE;
  let low = Infinity, high = -Infinity;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]]) {
    const y = groundAt(x + (sx * w) / 2, z + (sz * d) / 2);
    low = Math.min(low, y);
    high = Math.max(high, y);
  }
  const base = high + 0.25;
  b.box({ x, y: low - 0.2, z }, [w + 0.2, base - low + 0.2, d + 0.2], C.block, C.blockTop);
  b.box({ x, y: base, z }, [w, h, d], C.wall);
  b.gableRoof({ x, y: base + h, z }, w + 0.5, d + 0.5, roof, C.slate, C.wall);
  b.box({ x: x + w * 0.28, y: base + h + 0.3, z: z - d * 0.2 }, [0.32, roof + 0.2, 0.32], C.chimney);
  // Les colombages, des aplats posés sur le crépi : sur les deux longs pans, la sablière, la lisse, trois poteaux et deux
  // écharpes à l'étage ; au rez-de-chaussée, la porte (du côté du canal, au nord) et une fenêtre.
  for (const face of [1, -1]) {
    const at = { x, y: base, z: z + face * (d / 2 + 0.012), yaw: face > 0 ? 0 : Math.PI };
    const t = 0.1, sill = 1;
    b.plate(at, rect(-w / 2, h - t, w / 2, h), C.timber);
    b.plate(at, rect(-w / 2, sill, w / 2, sill + t), C.timber);
    for (const px of [-w / 2, -t / 2, w / 2 - t]) b.plate(at, rect(px, 0, px + t, h), C.timber);
    b.plate(at, [[-w / 2 + t, sill + t], [-w / 2 + 2.5 * t, sill + t], [-t / 2, h - t], [-2 * t, h - t]], C.timber);
    b.plate(at, [[w / 2 - 2.5 * t, sill + t], [w / 2 - t, sill + t], [2 * t, h - t], [t / 2, h - t]], C.timber);
    const out = { ...at, z: at.z + face * 0.005 };
    b.plate(out, rect(0.5, 0.3, 1.25, 0.8), C.glass);
    b.plate(out, face < 0 ? rect(-1.35, 0, -0.7, 0.95) : rect(-1.25, 0.3, -0.5, 0.8), face < 0 ? C.door : C.glass);
  }
  // Aux pignons, un poteau au milieu et la sablière.
  for (const face of [1, -1]) {
    const at = { x: x + face * (w / 2 + 0.012), y: base, z, yaw: (face * Math.PI) / 2 };
    b.plate(at, rect(-0.05, 0, 0.05, h), C.timber);
    b.plate(at, rect(-d / 2, h - 0.1, d / 2, h), C.timber);
  }
}

/** Un rectangle, dans le sens inverse des aiguilles d'une montre (pour `plate`). */
const rect = (x0: number, y0: number, x1: number, y1: number): [number, number][] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];
