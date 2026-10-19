/**
 * Les abords de la scénette des Écluses (reprise du lieu d'après le concept validé du 18 octobre 2026, « scenettes-6e-
 * ecluses-v2 ») : le canal bordé de blocs de pierre chaude à facettes (le kit commun, ./surroundingsKit.ts), raccordé de
 * chaque côté (il sort d'une voûte sous la colline à l'ouest ; à l'est, il descend en ruisseau vers la mer), fermé à
 * chaque bout par la porte d'écluse du concept (vantaux de bois sombre, deux hauts poteaux, balanciers à bout blanc) ; sa
 * berge nord en herbe, qui descend en talus derrière les dalles, l'eau du premier bassin du lieu entre les talus, le
 * chemin de halage sur la berge sud, de gros rochers clairs, des touffes d'herbe, des sapins et la maison à colombages de
 * l'éclusier, au toit d'ardoise bleue, sur la colline. Fini tout autour (la caméra tourne à deux doigts, et la scénette
 * s'ouvre dans l'axe du canal, ./scenette.ts) ; ce qui est haut reste hors du tour de la caméra, ce qui est près reste
 * bas : rien ne cache Kéo, l'éclusier, le sas ni la rangée des leviers. Aplats francs, une couleur par facette, rien de
 * presque noir. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { placeById } from './plan6e';
import { LOCK } from './questionScene';
import type { SurroundingsState } from './surroundings';
import { GREEN_TUFT, NATURE, STONE, fir, groundAt as groundOf, jitter, rock, timberHouse, tuft } from './surroundingsKit';
import { heightAt, standingHeight } from './terrain';

const C = {
  // La pierre des berges : la pierre chaude du kit commun (consultant Archipéo), deux tons de flanc, un dessus plus clair.
  block: STONE.side,
  blockAlt: STONE.sideAlt,
  blockTop: STONE.top,
  blockBevel: STONE.bevel,
  blockBevelAlt: STONE.bevelAlt,
  grass: NATURE.grass,
  grassLight: NATURE.grassLight,
  grassDeep: NATURE.grassDeep,
  rock: NATURE.rock,
  // La porte de la maison de l'éclusier, rouge.
  door: 0xc0503a,
  // La voûte d'où sort le canal : son arc clair, son creux d'un bleu-vert profond (jamais noir).
  arch: 0xd8ccb6,
  hollow: 0x3f6f74,
  // Les portes d'écluse des bouts du canal (la signature du concept) : un bois sombre, jamais presque noir, son dessus
  // un ton plus clair ; le bout blanc des balanciers.
  gate: 0x6e5038,
  gateTop: 0x8a6848,
  tip: 0xf2eee4,
  water: NATURE.water,
} as const;

/** Le sol du monde en un point, un peu enfoncé : ce qu'on y pose ne flotte jamais au-dessus d'une facette plus basse. */
const groundAt = (x: number, z: number): number => groundOf(x, z, 0.15);

export function eclusesSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const o = floor;
  const water = o.y - LOCK.water;
  const north = o.z + LOCK.front;
  const south = o.z + LOCK.back;
  const reach = LOCK.reach;
  bankBlocks(b, o, water, north, south, reach);
  northBank(b, o, north, reach);
  vault(b, o, water, north, south);
  // Les deux portes d'écluse des bouts du canal : celle d'amont devant la voûte (au fond, vue dans l'axe du canal depuis
  // l'aval), ses balanciers en travers sur les berges, comme au concept ; celle d'aval avant le ruisseau, ses balanciers
  // vers l'est, hors de la berge de la rangée des leviers.
  lockGate(b, o, o.x + ECLUSES_VAULT + GATE_INSET.west, water, north, south, 1, false);
  lockGate(b, o, o.x + reach - GATE_INSET.east, water, north, south, -1, true);
  stream(b, o, water);
  firstBasin(b);
  for (const [k, [dx, dz, r, h]] of BOULDERS.entries()) {
    const x = o.x + dx, z = o.z + dz;
    rock(b, { x, y: dz > LOCK.back && Math.abs(dx) < reach + LOCK.bank ? o.y : groundAt(x, z), z }, r, h, k);
  }
  for (const [k, [dx, dz]] of TUFTS.entries()) {
    const x = o.x + dx, z = o.z + dz;
    tuft(b, { x, y: dz > LOCK.back && Math.abs(dx) < reach + LOCK.bank ? o.y : Math.max(o.y, groundAt(x, z) + 0.1), z }, k, GREEN_TUFT);
  }
  for (const [k, [dx, dz, r]] of MOUNDS.entries()) mound(b, { x: o.x + dx, y: o.y, z: o.z + dz }, r, k);
  for (const [k, [dx, dz, s]] of FIRS.entries()) fir(b, o.x + dx, o.z + dz, s, jitter(k + 200) * Math.PI, 0.15);
  timberHouse(b, { x: o.x + HOUSE.dx, z: o.z + HOUSE.dz, yaw: Math.PI, width: HOUSE.w, depth: HOUSE.d, wall: HOUSE.h, slope: HOUSE.slope, chimney: true, door: C.door });
}

/**
 * Les blocs de pierre du canal : au sud, une rangée de gros blocs inégaux, leur dessus un peu au-dessus de la berge, leur
 * face dans l'eau ; au nord, devant les dalles de Kéo, du sas et de l'éclusier, une margelle au ras du sol (rien n'y
 * dépasse sous leurs pieds), puis, au-delà des dalles, des blocs comme au sud.
 */
function bankBlocks(b: FacetBuilder, o: Vec3, water: number, north: number, south: number, reach: number): void {
  const deep = water - 0.2;
  let x = o.x + ECLUSES_VAULT;
  let k = 0;
  while (x < o.x + reach - 0.2) {
    const len = Math.min(o.x + reach - x, BLOCK.south + 0.8 * jitter(k));
    const rise = 0.18 + 0.24 * jitter(k + 40);
    chunk(b, { x: x + len / 2, y: deep, z: south + 0.34, yaw: (jitter(k + 80) - 0.5) * 0.1 }, [len - 0.07, o.y + rise - deep, 0.78], k);
    x += len;
    k++;
  }
  // Au nord : la margelle devant les dalles (|x| < DECK), des blocs au-delà.
  x = o.x + ECLUSES_VAULT;
  k = 0;
  while (x < o.x + reach - 0.2) {
    const len = Math.min(o.x + reach - x, BLOCK.north + 0.8 * jitter(k + 120));
    const mid = x + len / 2 - o.x;
    if (Math.abs(mid) - len / 2 < DECK + 0.3) b.box({ x: x + len / 2, y: deep, z: north - 0.12 }, [len - 0.05, o.y + 0.025 - deep, 0.3], k % 2 ? C.block : C.blockAlt, C.blockTop);
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

/**
 * Le mur de tête de la voûte d'où sort le canal, depuis le milieu du sas : là où le sol du monde passe sous l'eau du canal
 * (plus à l'ouest, il le recouvrait, et la porte d'amont se dressait dans l'herbe). Les blocs des berges partent de lui.
 */
export const ECLUSES_VAULT = -8.4;

/** L'arête abattue des blocs du canal. */
const BEVEL = 0.16;

/**
 * La longueur des blocs des berges, au plus court (0,8 de plus au plus long) : allongés (avant 1,2 et 1,3) pour payer
 * les portes d'écluse des bouts du canal.
 */
const BLOCK = { south: 2.4, north: 2.5 } as const;

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
function vault(b: FacetBuilder, o: Vec3, water: number, north: number, south: number): void {
  const x = o.x + ECLUSES_VAULT;
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

/** L'écart des portes d'écluse aux bouts du canal (la voûte à l'ouest, le ruisseau à l'est). */
const GATE_INSET = { west: 0.9, east: 0.3 } as const;

/**
 * Une porte d'écluse en travers du canal, en `x` (la signature du concept) : deux bornes de pierre aux gonds, deux
 * vantaux fermés de bois sombre, un haut poteau sur chaque berge (du côté `post` de la porte, +1 : l'est), et sur chaque
 * berge un balancier couché, le long de la porte vers le dehors du canal (`along` faux) ou le long du canal vers l'est,
 * son bout blanc posé sur un chevalet planté dans le sol (rien ne flotte).
 */
function lockGate(b: FacetBuilder, o: Vec3, x: number, water: number, north: number, south: number, post: 1 | -1, along: boolean): void {
  const mid = (north + south) / 2,
    half = (south - north) / 2;
  const y = o.y + 1.05;
  for (const side of [-1, 1]) {
    const bank = side < 0 ? north - 0.3 : south + 0.3;
    b.box({ x, y: water, z: side < 0 ? north - 0.1 : south + 0.1 }, [0.42, o.y + 0.55 - water, 0.42], C.blockAlt, C.blockTop);
    b.box({ x, y: water - 0.3, z: mid + (side * half) / 2 }, [0.2, o.y + 0.95 - water + 0.3, half - 0.04], C.gate, C.gateTop);
    b.box({ x: x + post * 0.3, y: o.y - 0.1, z: bank }, [0.26, GATE_POST + 0.1, 0.26], C.gate, C.gateTop);
    // Le balancier : du haut de la porte, sur la berge, jusqu'à son bout blanc.
    const from = { x, y, z: side < 0 ? north - 0.1 : south + 0.1 };
    const u = along ? { x: 1, z: 0 } : { x: 0, z: side };
    const at = (t: number) => ({ x: from.x + u.x * t, y, z: from.z + u.z * t });
    b.beam(from, at(BALANCE.length - BALANCE.tip), 0.2, C.gate);
    b.beam(at(BALANCE.length - BALANCE.tip), at(BALANCE.length), 0.22, C.tip);
    const rest = at(BALANCE.length - BALANCE.tip - 0.1);
    const foot = Math.min(o.y, groundAt(rest.x, rest.z));
    b.box({ x: rest.x, y: foot, z: rest.z }, [0.12, y - 0.1 - foot, 0.12], C.gate);
  }
}

/** Les balanciers des portes d'écluse : leur longueur, et celle de leur bout blanc. */
const BALANCE = { length: 2.8, tip: 0.6 } as const;

/** La hauteur des poteaux des portes d'écluse au-dessus du sol de la scène (sous le haut que le tour de la caméra permet). */
const GATE_POST = 2.3;

/** Le ruisseau, sous la porte d'aval : un ruban d'eau posé sur le sol, qui descend de la porte vers la mer. */
function stream(b: FacetBuilder, o: Vec3, water: number): void {
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

/**
 * L'eau du premier bassin du lieu, juste derrière les dalles de la scène (places.ts, `ecluses`) : vu de dos, entre les
 * talus, il se lisait comme une fosse brune (directeur artistique). Une eau basse sur son fond, sous ses murs ébréchés ;
 * le bassin refait (son corps posé) la recouvre de sa pierre et de son eau.
 */
function firstBasin(b: FacetBuilder): void {
  const c = placeById('ecluses').center;
  const y = standingHeight(heightAt(c)) + BASIN.water;
  const x0 = c.x - BASIN.half[0], x1 = c.x + BASIN.half[0], z0 = c.z + BASIN.z - BASIN.half[1], z1 = c.z + BASIN.z + BASIN.half[1];
  b.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], C.water);
}

/**
 * Le premier bassin du lieu, dans son repère (places.ts, `ecluses` : son milieu à 3 au sud du centre, ses murs de 0,4
 * jusqu'à 2,2 et 1,5 de lui) : le dedans de ses murs, et son eau, juste sous le haut de son mur le plus ébréché.
 */
const BASIN = { z: 3, half: [1.8, 1.1], water: -0.78 } as const;

/** Le ruisseau sous la porte d'aval, depuis le milieu du sas : ses points (x, z) et sa demi-largeur, vers la mer. */
const STREAM: readonly (readonly [number, number, number])[] = [
  [LOCK.reach, 1.5, 0.75],
  [14.5, 1.2, 0.7],
  [17, -0.4, 0.6],
  [19.5, -3, 0.55],
  [22, -6, 0.5],
  [24.5, -9, 0.5],
];

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
  [-8.0, 4.4],
  [11.6, 3.6],
  [-6.6, 0.1],
  [-8.6, -0.2],
  [-7.4, 0.3],
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
  [-7.6, 8.4, 1.3],
  [-7.2, -0.1, 1.0],
  [9.8, 0, 1.2],
];

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
const HOUSE = { dx: -6, dz: 22.5, w: 4, d: 2.8, h: 2.2, slope: 0.97 } as const;

/** Un rectangle, dans le sens inverse des aiguilles d'une montre (pour `plate`). */
const rect = (x0: number, y0: number, x1: number, y1: number): [number, number][] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];
