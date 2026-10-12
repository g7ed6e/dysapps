// Les formes nouvelles du 4e et du 3e d'Archipéo (piste 3 « hybride », étape 3 ; intention du directeur artistique du
// 12 octobre 2026, point 5, avec les interdits de SC-3) : trapues, rien sous 0,15 case, rien d'ajouré, rien à lire, rien
// qui bouge ; ni éclair, ni écran, ni symbole d'onde, ni corde qui pend, ni fumée, ni étincelle. Au 4e, le wagonnet, la
// voie ferrée, l'enclume, la scène à rideaux et la longue-vue (servie aussi aux deux Observatoires du 3e) ; au 3e, le
// mât d'antenne (chez Stat et au Studio), le haut-parleur, le carillon, la ruche et le triangle de marbre.
//
// Ce fichier tient les formes, et les quatre petites constructions qui n'ont qu'elles (le wagonnet de Braise, le mât de
// Stat, le haut-parleur d'Écho, le carillon de Navette : la matière du bloc livré sur la plus grande face, GD-7, la même
// de près et de loin) ; les cœurs qui les posent sont dans ./heartDecor4e.ts et ./heartDecor3e.ts. Code pur, sans
// Three.js.
import { BLOC } from '../../biomes';
import type { V3 } from '../decor/brush';
import type { Couleur, Faces } from '../palette';
import { scaleColor, type Tint, type Workshop } from './workshop';
import { OBJECT_COLORS as C, type Paint, stoneStep } from './pieces';
import type { ObjectDrawing } from './silhouettes';

/**
 * Les teintes des formes nouvelles (intention du directeur artistique, avant le voile) : l'acier poli du dessus des
 * rails et des tubes du carillon, l'or de la frise et des embrasses de la scène, la paille claire et la paille foncée des
 * anneaux de la ruche (celles de ses cubes), le voyant mat du mât d'antenne (jamais allumé).
 */
export const FORMS_43 = { polishedSteel: 0xb4bac0, stageGold: 0xcca22e, straw: 0xe8c66f, darkStraw: 0xc49a48, beacon: 0xa8503c } as const;

// ---------- La voie ferrée ----------

/** Les mesures de la voie : la hauteur des traverses, les rails (leur axe en y, leur côté), le butoir. */
const TRACK = { sleeper: 0.16, sleeperY: [0.1, 0.9], rails: [0.3, 0.7], rail: 0.16, buffer: { length: 0.26, height: 0.56 } } as const;

/**
 * La voie ferrée droite, le long de x, de 0 à `length` cases : deux traverses jointives par case (pas de jour entre
 * elles), sombres (`sleeper`, et un ton plus sombre une sur deux) ; deux rails de 0,16 case au dessus d'acier poli ; un
 * butoir trapu à chaque bout si `buffers`. Posée en `z` (0 : sur le sol de sa première case). 6 triangles par traverse,
 * 20 de rails, 20 de butoirs.
 */
export function railTrack(at: Workshop, pe: Paint, length: number, buffers: boolean, sleeper: Couleur, z = 0): void {
  const { sleeper: h, sleeperY: [y0, y1], rails, rail, buffer } = TRACK;
  const n = length * 2;
  for (let k = 0; k < n; k++) {
    const [x0, x1] = [k / 2, (k + 1) / 2];
    at.box(x0, x1, y0, y1, z, z + h, k % 2 ? scaleColor(sleeper, 0.84) : sleeper, { bottom: true, nx: k > 0, px: k < n - 1 });
  }
  const steel = pe.color(FORMS_43.polishedSteel);
  const railFaces: Faces = { dessus: steel, cote: scaleColor(steel, 0.62) };
  const [xa, xb] = buffers ? [buffer.length, length - buffer.length] : [0.02, length - 0.02];
  for (const y of rails) at.box(xa, xb, y - rail / 2, y + rail / 2, z + h, z + h + rail, railFaces);
  if (!buffers) return;
  const wood = pe.role('yardRail');
  for (const [x0, x1] of [
    [0.02, buffer.length],
    [length - buffer.length, length - 0.02],
  ])
    at.box(x0, x1, y0 + 0.04, y1 - 0.04, z, z + buffer.height, { dessus: scaleColor(wood, 1.12), cote: wood });
}

// ---------- Le wagonnet ----------

/** Une butte à quatre pans (le chargement du wagonnet) : du rectangle (x0, y0)–(x1, y1) en z0, retrait `inset`, haute de `h`. 10 triangles. */
function hipMound(at: Workshop, x0: number, x1: number, y0: number, y1: number, z0: number, inset: number, h: number, t: Tint): void {
  const z1 = z0 + h;
  const [a0, a1, b0, b1] = [x0 + inset, x1 - inset, y0 + inset * 0.6, y1 - inset * 0.6];
  const c: V3 = [(x0 + x1) / 2, (y0 + y1) / 2, z0 - 0.1];
  at.quad([x0, y0, z0], [x1, y0, z0], [a1, b0, z1], [a0, b0, z1], c, t);
  at.quad([x1, y0, z0], [x1, y1, z0], [a1, b1, z1], [a1, b0, z1], c, t);
  at.quad([x1, y1, z0], [x0, y1, z0], [a0, b1, z1], [a1, b1, z1], c, t);
  at.quad([x0, y1, z0], [x0, y0, z0], [a0, b0, z1], [a0, b1, z1], c, t);
  at.quad([a0, b0, z1], [a1, b0, z1], [a1, b1, z1], [a0, b1, z1], c, t);
}

/** Les mesures du wagonnet : sa place sur la voie, le châssis, la caisse évasée, les roues. */
const CART = { x: [0.4, 2.1], chassis: [0.44, 0.72], body: { top: 1.46, flare: 0.08 }, wheel: { r: 0.24, z: 0.56, xs: [0.78, 1.72] } } as const;

/**
 * Le wagonnet de Braise sur sa voie (trois cases de rails, deux d'acier dessus) : la voie et ses butoirs, les traverses
 * dans la matière livrée (le rail, GD-7) ; sur elle, le châssis plein de fer, quatre roues en disques à demi cachées, la
 * caisse trapue d'acier évasée en haut, le chargement en tas bombé de la matière livrée. Sans cheminée. 132 triangles.
 */
const minecart: ObjectDrawing = (at, pe) => {
  const rail = pe.block(BLOC.rail);
  railTrack(at, pe, 3, true, rail.cote);
  const iron = pe.color(C.iron);
  const [x0, x1] = CART.x;
  const [c0, c1] = CART.chassis;
  at.box(x0 + 0.1, x1 - 0.1, 0.12, 0.88, c0, c1, iron);
  for (const x of CART.wheel.xs)
    for (const [y, toward] of [
      [0.1, 'ny'],
      [0.9, 'py'],
    ] as const)
      at.standingDisc([x, y, CART.wheel.z], toward, CART.wheel.r, 8, iron, Math.PI / 8);
  // La caisse : quatre pans évasés, du châssis à son bord.
  const steel = pe.apart('acier');
  const f = CART.body.flare;
  const [zb, zt] = [c1, CART.body.top];
  const lo = [x0, x1, 0.14, 0.86] as const;
  const hi = [x0 - f, x1 + f, 0.14 - f, 0.86 + f] as const;
  const mid: V3 = [(x0 + x1) / 2, 0.5, (zb + zt) / 2];
  at.quad([lo[0], lo[2], zb], [lo[1], lo[2], zb], [hi[1], hi[2], zt], [hi[0], hi[2], zt], mid, steel);
  at.quad([lo[1], lo[2], zb], [lo[1], lo[3], zb], [hi[1], hi[3], zt], [hi[1], hi[2], zt], mid, steel);
  at.quad([lo[1], lo[3], zb], [lo[0], lo[3], zb], [hi[0], hi[3], zt], [hi[1], hi[3], zt], mid, steel);
  at.quad([lo[0], lo[3], zb], [lo[0], lo[2], zb], [hi[0], hi[2], zt], [hi[0], hi[3], zt], mid, steel);
  hipMound(at, hi[0], hi[1], hi[2], hi[3], zt, 0.32, 0.3, rail);
};

// ---------- L'enclume ----------

/**
 * L'enclume (une case) sur son billot rond de bois au dessus scié (`log`) : le pied, la taille resserrée, la table plate,
 * la corne courte et épaisse vers +x, dans `steel`. Sans marteau, sans étincelle. 51 triangles.
 */
export function anvil(at: Workshop, steel: Faces, log: Faces): void {
  at.prism(0.46, 0.5, 0.36, 0.33, 0, 0.42, 7, log, 0.3);
  at.block(0.42, 0.5, 0.5, 0.4, 0.42, 0.54, steel);
  at.block(0.42, 0.5, 0.26, 0.22, 0.54, 0.7, steel, { bottom: true, top: true });
  at.block(0.4, 0.5, 0.62, 0.34, 0.7, 0.9, steel);
  at.spike([0.66, 0.5, 0.8], [0.96, 0.5, 0.84], 0.1, 4, steel, Math.PI / 4);
}

// ---------- La scène à rideaux ----------

/** Les mesures de la scène : l'estrade, les deux tentures (leurs bords en x), la frise, le fond, les embrasses. */
const STAGE = { deck: 0.3, curtains: [[0.08, 0.92], [2.08, 2.92]], top: 3.36, frieze: 3.76, backY: 0.82, tieZ: 1.2 } as const;

/**
 * La scène à rideaux (trois cases de large, une de profondeur) : l'estrade basse de planches (`planks`), deux colonnes
 * de tenture de velours (`velvet`) plissées sur toute la hauteur, ouvertes et immobiles, chacune tenue par une embrasse
 * d'or, la frise d'or épaisse en travers, le fond sombre plein entre elles. 90 triangles.
 */
export function curtainStage(at: Workshop, pe: Paint, velvet: Faces, planks: Faces): void {
  const S = STAGE;
  const gold = pe.color(FORMS_43.stageGold);
  const goldFaces: Faces = { dessus: gold, cote: scaleColor(gold, 0.86) };
  at.box(0.02, 2.98, 0.06, 0.94, 0, S.deck, planks);
  at.box(0.92, 2.08, S.backY, 0.92, S.deck, S.top, pe.color(C.shadow), { bottom: true, top: true });
  const fold = scaleColor(velvet.cote, 0.78);
  for (const [x0, x1] of S.curtains) {
    at.box(x0, x1, 0.32, 0.92, S.deck, S.top, velvet, { bottom: true, top: true, ny: true });
    // Les plis, devant : trois arêtes verticales, chaque pli un pan clair et un pan sombre.
    const w = (x1 - x0) / 3;
    for (let k = 0; k < 3; k++) {
      const [a, m, b] = [x0 + k * w, x0 + (k + 0.5) * w, x0 + (k + 1) * w];
      at.quad([a, 0.32, S.deck], [m, 0.2, S.deck], [m, 0.2, S.top], [a, 0.32, S.top], [m, 0.6, 1], velvet.cote);
      at.quad([m, 0.2, S.deck], [b, 0.32, S.deck], [b, 0.32, S.top], [m, 0.2, S.top], [m, 0.6, 1], fold);
    }
    at.box(x0 - 0.02, x1 + 0.02, 0.16, 0.94, S.tieZ, S.tieZ + 0.18, goldFaces, { bottom: false });
  }
  at.box(0, 3, 0.08, 0.94, S.top, S.frieze, goldFaces, {});
}

// ---------- La longue-vue ----------

/** Les mesures de la longue-vue : les deux diamètres du tube, le pied (colonne, fourche, patins). */
const SPYGLASS = { eyeR: 0.14, bodyR: 0.23, split: 0.38, column: 0.24, yoke: [0.34, 0.2], skid: { r: 0.4, side: 0.16 } } as const;

/**
 * La longue-vue : le tube trapu à deux diamètres de l'oculaire `eye` à l'objectif `objective` (incliné vers le ciel), la
 * matière de l'île dessus (`body`) ; sous lui, au point (fx, fy), le pied plein en colonne et sa fourche (`stand`), trois
 * pattes courtes en patins au sol. La même à la Vigie et aux deux Observatoires. 104 triangles.
 */
export function spyglass(at: Workshop, fx: number, fy: number, eye: V3, objective: V3, body: Faces, stand: Faces): void {
  const S = SPYGLASS;
  // La hauteur de l'axe au-dessus du pied (au plus près de lui, le long de x).
  const t = Math.min(1, Math.max(0, (fx - eye[0]) / (objective[0] - eye[0])));
  const zAxis = eye[2] + t * (objective[2] - eye[2]);
  for (let k = 0; k < 3; k++) {
    const a = Math.PI / 6 + (k * 2 * Math.PI) / 3;
    at.beam([fx, fy, S.skid.side / 2], [fx + Math.cos(a) * S.skid.r, fy + Math.sin(a) * S.skid.r, S.skid.side / 2], S.skid.side, stand, true);
  }
  at.block(fx, fy, S.column, S.column, 0, zAxis - S.bodyR - 0.04, stand, { bottom: true, top: true });
  at.block(fx, fy, S.yoke[0], S.yoke[1] + S.bodyR, zAxis - S.bodyR - 0.16, zAxis - S.bodyR + 0.06, stand);
  const split: V3 = [eye[0] + (objective[0] - eye[0]) * S.split, eye[1] + (objective[1] - eye[1]) * S.split, eye[2] + (objective[2] - eye[2]) * S.split];
  const dark = scaleColor(body.cote, 0.7);
  at.tube(eye, split, S.eyeR, S.eyeR, 8, body, { a: dark });
  at.tube(split, objective, S.bodyR, S.bodyR, 8, body, { a: body.cote, b: dark });
}

// ---------- Le mât d'antenne ----------

/** Les mesures du mât : son côté, ses deux barres (demi-longueur, hauteur sous le sommet), le voyant. */
const MAST = { side: 0.2, bar: 0.16, bars: [[0.36, 0.78], [0.26, 0.4]], beacon: 0.17 } as const;

/**
 * Le mât d'antenne en (cx, cy), de z0 à z1 : le mât carré de 0,2 case (`body`), deux barres de traverse épaisses
 * étagées, le voyant en boule mate au sommet (jamais allumé, jamais clignotant). Le même chez Stat et au Studio. 50
 * triangles.
 */
export function antennaMast(at: Workshop, pe: Paint, cx: number, cy: number, z0: number, z1: number, body: Tint): void {
  const M = MAST;
  at.block(cx, cy, M.side, M.side, z0, z1, body, { bottom: true, top: true });
  for (const [half, below] of M.bars) at.box(cx - half, cx + half, cy - M.bar / 2, cy + M.bar / 2, z1 - below, z1 - below + M.bar, body, { bottom: false });
  const lamp = pe.color(FORMS_43.beacon);
  const r = M.beacon;
  at.prism(cx, cy, M.side * 0.6, r, z1, z1 + r, 6, lamp, Math.PI / 6, true);
  at.prism(cx, cy, r, 0, z1 + r, z1 + 2 * r, 6, lamp, Math.PI / 6);
}

/** Le mât de relevés de Stat : la marche de pierre des cours sur ses deux cases, le mât d'antenne livré (ses grandes faces) dessus. */
const statMast: ObjectDrawing = (at, pe) => {
  stoneStep(at, pe, 0.04, 1.96, 0.08, 0.92, 0, 0.42);
  antennaMast(at, pe, 0.5, 0.5, 0.42, 2.7, pe.block(BLOC.antenne));
};

// ---------- Le haut-parleur ----------

/** Les mesures du haut-parleur : le caisson, les deux pavillons (leur centre, leur gorge, leur bouche). */
const SPEAKER = { box: { y: [0.42, 0.96], top: 1.84 }, horns: [0.52, 1.48], z: 1.02, throat: 0.2, mouth: 0.4, front: 0.04 } as const;

/**
 * Le haut-parleur d'Écho (deux portes, deux lentilles dessus) : le caisson cubique trapu de portes, deux pavillons en
 * cônes larges de lentille livrée (leurs grandes faces) tournés vers l'avant, côte à côte, leur dedans d'un ton plus
 * sombre, leur gorge sombre. Sans grille ni onde. 86 triangles.
 */
const loudspeaker: ObjectDrawing = (at, pe) => {
  const S = SPEAKER;
  at.box(0.06, 1.94, S.box.y[0], S.box.y[1], 0, S.box.top, pe.material('porte'));
  const lens = pe.block(BLOC.lentille);
  const inner = scaleColor(lens.cote, 0.72);
  for (const x of S.horns) {
    const [back, mouth]: [V3, V3] = [
      [x, S.box.y[0], S.z],
      [x, S.front, S.z],
    ];
    at.tube(back, mouth, S.throat, S.mouth, 8, lens);
    at.tube(back, mouth, S.throat * 0.96, S.mouth * 0.96, 8, inner, { a: pe.color(C.shadow) }, true);
  }
};

// ---------- Le carillon ----------

/** Les mesures du carillon : la potence (poteau, bras, jambe de force), le toit, les tubes (x, longueur). */
const CHIMES = {
  post: 0.36,
  arm: [2.24, 2.48],
  roof: [2.48, 2.9],
  tube: 0.11,
  hang: 0.14,
  tubes: [
    [0.98, 1],
    [1.28, 0.86],
    [1.58, 0.72],
    [1.86, 0.58],
  ],
} as const;

/**
 * Le carillon de Navette (deux ressorts, un toit de deux cases) : la potence trapue de ressort livré (ses grandes faces)
 * sur son pied de pierre, son bras et sa jambe de force, le toit débordant dans la couverture de l'île ; sous le bras,
 * quatre tubes épais d'acier poli de longueurs étagées, tenus chacun par une tige courte et rigide de fer, immobiles.
 * 154 triangles.
 */
const chimes: ObjectDrawing = (at, pe) => {
  const C43 = CHIMES;
  const spring = pe.block(BLOC.ressort);
  at.block(0.5, 0.5, 0.72, 0.72, 0, 0.16, { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') });
  at.block(0.5, 0.5, C43.post, C43.post, 0.16, C43.arm[1], spring, { bottom: true, top: true });
  at.box(0.32, 1.98, 0.36, 0.64, C43.arm[0], C43.arm[1], spring, { bottom: false });
  at.beam([0.6, 0.5, 1.62], [1.16, 0.5, 2.26], 0.16, spring);
  at.roof(0.02, 1.98, 0.08, 0.92, C43.roof[0], C43.roof[1], 'x', 0.08, pe.roof());
  const steel: Faces = { dessus: pe.color(FORMS_43.polishedSteel), cote: scaleColor(pe.color(FORMS_43.polishedSteel), 0.8) };
  const iron = pe.color(C.iron);
  const top = C43.arm[0] - C43.hang;
  for (const [x, l] of C43.tubes) {
    at.block(x, 0.5, 0.15, 0.15, top, C43.arm[0], iron, { bottom: true, top: true });
    at.prism(x, 0.5, C43.tube, C43.tube, top - l, top, 6, steel, Math.PI / 6, true);
    at.disc(x, 0.5, top - l, C43.tube, 6, steel, Math.PI / 6, true);
  }
};

// ---------- La ruche ----------

/** Les anneaux de la ruche : leur rayon au pied, du plus bas au sommet ; leur hauteur ; la pierre plate. */
const SKEP = { rings: [1.24, 1.1, 0.94, 0.74, 0.48], height: 0.4, stone: [1.44, 0.14], door: { half: 0.2, upper: 0.36 } } as const;

/**
 * La ruche (trois sur trois) : le dôme de paille en cinq anneaux empilés en léger retrait, clair, foncé, clair, foncé,
 * clair (les teintes de ses cubes), sur une pierre plate (`stone`) ; l'entrée sombre en arc au pied, vers +x (la caméra
 * de l'île). Sans abeilles. 135 triangles.
 */
export function skep(at: Workshop, pe: Paint, stone: Faces): void {
  const S = SKEP;
  const [cx, cy] = [1.5, 1.5];
  at.prism(cx, cy, S.stone[0], S.stone[0] - 0.04, 0, S.stone[1], 8, stone);
  const tones = [pe.color(FORMS_43.straw), pe.color(FORMS_43.darkStraw)];
  S.rings.forEach((r, k) => {
    const z0 = S.stone[1] + k * S.height;
    const last = k === S.rings.length - 1;
    const tone = tones[k % 2];
    at.prism(cx, cy, r, last ? r * 0.42 : r * 0.9, z0, z0 + S.height, 8, { dessus: tone, cote: tone });
  });
  // L'entrée : le pan tourné vers +x du premier anneau, un peu devant lui.
  const xd = cx + S.rings[0] * Math.cos(Math.PI / 8) + 0.02;
  const [z0, z1] = [S.stone[1], S.stone[1] + S.door.upper];
  const dark = pe.color(C.shadow);
  const d = S.door.half;
  at.quad([xd, cy - d, z0], [xd, cy + d, z0], [xd, cy + d, z1], [xd, cy - d, z1], [cx, cy, z0], dark);
  at.tri([xd, cy - d, z1], [xd, cy + d, z1], [xd, cy, z1 + d * 0.8], [cx, cy, z1], dark);
}

// ---------- Le triangle de marbre ----------

/** Les dalles du triangle 3-4-5, en cases de son repère : les deux côtés droits, puis les marches de l'hypoténuse (plus basses). */
const TRIANGLE = {
  legs: [
    [0, 3, 0, 1],
    [0, 1, 1, 4],
  ],
  steps: [
    [2, 3, 1, 2],
    [1, 2, 2, 3],
  ],
  legHeight: 0.44,
  stepHeight: 0.3,
} as const;

/**
 * Le triangle de marbre du Belvédère (huit cases : le côté de trois le long de x, celui de quatre le long de y, le grand
 * côté en marches) : une dalle épaisse à trois côtés, l'hypoténuse en trois marches basses, le dessus de marbre, les
 * côtés en flanc sombre (`marble`). Aucun chiffre, aucune graduation. 40 triangles.
 */
export function marbleTriangle(at: Workshop, marble: Faces): void {
  const T = TRIANGLE;
  for (const [x0, x1, y0, y1] of T.legs) at.box(x0 + 0.04, x1 - 0.04, y0 + 0.04, y1 - 0.04, 0, T.legHeight, marble);
  for (const [x0, x1, y0, y1] of T.steps) at.box(x0 - 0.04, x1 - 0.06, y0 - 0.04, y1 - 0.06, 0, T.stepHeight, marble);
}

/** Les petites constructions du 4e et du 3e faites des formes nouvelles, par identifiant (world/fixtures.ts). */
export const SILHOUETTES_43: Readonly<Record<string, ObjectDrawing>> = {
  'maths-4e-powers-fixture-1': minecart,
  'maths-3e-statistics-fixture-1': statMast,
  'english-3e-comprehension-fixture-1': loudspeaker,
  'technology-3e-digital-fixture-1': chimes,
};
