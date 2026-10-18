/**
 * Les abords de la scénette de la Vigie (reprise lieu par lieu, d'après les concepts du 18 octobre 2026, « scenettes-6e-
 * guet ») : la tour de guet tronquée en chantier, en haut de la butte. Tant que son haut n'est pas posé, une galerie
 * d'échafaudage de bois ceint le moignon (ouverte au sud, où la porte et la fenêtre basse du volet, l'objet témoin des
 * missions en C, restent dégagées), une petite grue de bois s'y dresse au nord-est, sa corde tendue par une pierre de
 * taille qu'elle hisse depuis le tas de pierres au pied, et une oriflamme ocre flotte au nord-ouest. Autour : les rochers
 * de pierre chaude du pied de la tour (le kit commun, ./surroundingsKit.ts), des touffes d'herbe, des pins derrière la tour et loin sur les côtés. Fini tout autour (la caméra tourne à
 * deux doigts) ; ce qui est haut se tient contre la tour, derrière Kéo et le guetteur, ou loin du tour de la caméra : rien
 * ne cache Kéo, le guetteur, le volet ni la rangée des vitraux. Aplats francs, une couleur par facette, rien de presque
 * noir. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { placeById } from './plan6e';
import type { SurroundingsState } from './surroundings';
import { GREEN_TUFT, STONE, groundAt as groundOf, jitter, rock, tuft, type P3 } from './surroundingsKit';

const C = {
  // Le bois de l'échafaudage : les poteaux et les lisses un ton sombre (jamais presque noir), les planches neuves claires.
  post: 0x8a6440,
  rail: 0xa9784a,
  plank: 0xd9ad72,
  plankSide: 0xb98a55,
  // La corde de chanvre, et le treuil.
  rope: 0xd8c39a,
  // L'oriflamme : un ocre chaud, son revers un ton plus sombre (elle se lit sur le ciel crème comme sur les pins).
  flag: 0xd0743f,
  flagShade: 0xb5653f,
  // Les pins : deux verts plus soutenus que la prairie, le tronc brun moyen (comme aux Écluses).
  fir: 0x3f8f5a,
  firLight: 0x56a568,
  trunk: 0x8a5a36,
} as const;

/** Le sol du monde en un point, un peu enfoncé : ce qu'on y pose ne flotte jamais au-dessus d'une facette plus basse. */
const groundAt = (x: number, z: number): number => groundOf(x, z, 0.12);

/**
 * La galerie d'échafaudage, dans le repère de la tour (angles comme lookout.ts : 0 à l'est, 90 au sud) : du pan
 * sud-ouest au pan sud-est par le nord, la porte et la fenêtre basse du sud restent nues ; son plancher juste au-dessus
 * du moignon, du mur (`inner`) au bord (`outer`) ; sa lisse.
 */
export const LOOKOUT_SCAFFOLD = { from: 128, to: 412, step: 28.4, inner: 2.12, outer: 2.78, deck: 2.85, rail: 0.78 } as const;

/** La grue, sur la galerie au nord-est : son angle, la hauteur de son mât au-dessus du plancher, la portée de sa flèche. */
const CRANE = { angle: 332, mast: 2.5, reach: 1.9, load: 1.05 } as const;

/**
 * Le tas de pierres de taille, derrière la tour (vu de face, il se cachait derrière la tête du guetteur) : son angle,
 * son écart au centre. Il se voit de côté et de dos.
 */
const PILE = { angle: 282, distance: 3.5 } as const;

/** L'oriflamme, au nord-ouest de la tour : son angle, son écart au centre, la hauteur de son mât. */
const FLAG = { angle: 214, distance: 2.95, height: 6.2 } as const;

export function lookoutSurroundings(b: FacetBuilder, floor: Vec3, state: SurroundingsState): void {
  const c = placeById('lookout').center;
  const tower = { x: c.x, y: groundOf(c.x, c.z), z: c.z };
  // Le chantier dure tant que le haut de la tour (l'étape qui porte ses traces) n'est pas posé.
  if (!state.posed) {
    scaffold(b, tower);
    crane(b, tower);
    stonePile(b, tower);
  }
  oriflamme(b, tower);
  for (const [i, [dx, dz, r]] of ROCKS.entries()) {
    const x = floor.x + dx,
      z = floor.z + dz;
    rock(b, { x, y: groundAt(x, z), z }, r, r * 0.8, i + 70, { light: STONE.boulder, shade: STONE.boulderShade, top: STONE.top });
  }
  for (const [i, [dx, dz, s]] of TUFTS.entries()) {
    const x = floor.x + dx,
      z = floor.z + dz;
    tuft(b, { x, y: groundAt(x, z), z }, i + 90, GREEN_TUFT, s);
  }
  for (const [k, [dx, dz, s]] of FIRS.entries()) fir(b, floor.x + dx, floor.z + dz, s, k);
}

/** Un point du repère de la tour : à l'angle `deg`, à `r` du centre, à `y` au-dessus de son pied. */
function around(t: Vec3, deg: number, r: number, y: number): Vec3 {
  const a = (deg * Math.PI) / 180;
  return { x: t.x + r * Math.cos(a), y: t.y + y, z: t.z + r * Math.sin(a) };
}

/**
 * La galerie : ses poteaux du sol au-dessus de la lisse (sur le bord, à chaque pas), le plancher de planches neuves d'un
 * pas à l'autre, la lisse et la sous-lisse, une écharpe sous le plancher un pas sur deux.
 */
function scaffold(b: FacetBuilder, t: Vec3): void {
  const S = LOOKOUT_SCAFFOLD;
  const angles: number[] = [];
  for (let a = S.from; a <= S.to + 1e-6; a += S.step) angles.push(a);
  for (const a of angles) {
    const p = around(t, a, S.outer - 0.05, 0);
    const foot = groundAt(p.x, p.z);
    b.beam({ x: p.x, y: foot, z: p.z }, { x: p.x, y: t.y + S.deck + S.rail + 0.12, z: p.z }, 0.13, C.post);
  }
  for (let k = 0; k + 1 < angles.length; k++) {
    const [a0, a1] = [angles[k], angles[k + 1]];
    const mid = (a0 + a1) / 2;
    const m = around(t, mid, (S.inner + S.outer) / 2, S.deck - 0.1);
    // Le plancher : une planche par pas, sa longueur la corde du bord, tournée le long de la galerie.
    const p0 = around(t, a0, S.outer, 0),
      p1 = around(t, a1, S.outer, 0);
    const yaw = Math.atan2(-(p1.z - p0.z), p1.x - p0.x);
    b.box({ x: m.x, y: m.y, z: m.z, yaw }, [Math.hypot(p1.x - p0.x, p1.z - p0.z) + 0.06, 0.1, S.outer - S.inner], C.plankSide, k % 2 ? C.plank : 0xe3bc83);
    // La lisse et la sous-lisse, sur le bord.
    for (const h of [S.rail, S.rail * 0.5]) b.beam(around(t, a0, S.outer - 0.05, S.deck + h), around(t, a1, S.outer - 0.05, S.deck + h), 0.08, C.rail);
    if (k % 2 === 0) b.beam(around(t, a0, S.outer - 0.05, 0.5), around(t, a1, S.outer - 0.05, S.deck - 0.12), 0.08, C.rail);
  }
}

/**
 * La grue de bois, debout sur la galerie au nord-est : son mât, sa jambe de force, sa flèche qui part vers le dehors, la
 * corde qui en pend et la pierre de taille qu'elle hisse ; le treuil au pied du mât.
 */
function crane(b: FacetBuilder, t: Vec3): void {
  const S = LOOKOUT_SCAFFOLD;
  const K = CRANE;
  const r = (S.inner + S.outer) / 2;
  const foot = around(t, K.angle, r, S.deck);
  const top = around(t, K.angle, r, S.deck + K.mast);
  b.beam(foot, top, 0.16, C.post);
  // La flèche monte un peu vers le dehors ; la jambe de force la tient depuis le mât.
  const tip = around(t, K.angle, r + K.reach, S.deck + K.mast + 0.25);
  b.beam(around(t, K.angle, r - 0.15, S.deck + K.mast - 0.08), tip, 0.13, C.rail);
  b.beam(around(t, K.angle, r, S.deck + K.mast * 0.45), around(t, K.angle, r + K.reach * 0.55, S.deck + K.mast + 0.08), 0.09, C.rail);
  // La corde, et la pierre de taille au bout.
  const load = around(t, K.angle, r + K.reach - 0.02, S.deck + K.load);
  b.beam({ ...tip, y: tip.y - 0.05 }, { ...load, y: load.y + 0.36 }, 0.035, C.rope);
  const a = (K.angle * Math.PI) / 180;
  b.box({ x: load.x, y: load.y, z: load.z, yaw: -a }, [0.5, 0.36, 0.4], STONE.side, STONE.top);
  // Le treuil : un tambour en travers, au pied du mât, côté tour.
  const w = around(t, K.angle, r - 0.18, S.deck + 0.22);
  b.drum({ x: w.x, y: w.y, z: w.z, yaw: Math.PI / 2 - a, pitch: Math.PI / 2 }, 0.14, 0.4, 6, C.rail, C.plankSide);
}

/** Le tas de pierres de taille, au pied de la tour : quatre blocs, deux sur deux, un peu de travers. */
function stonePile(b: FacetBuilder, t: Vec3): void {
  const base = around(t, PILE.angle, PILE.distance, 0);
  const y = groundAt(base.x, base.z);
  const blocks: readonly (readonly [number, number, number, number])[] = [
    [-0.32, -0.2, 0, 0.1],
    [0.34, 0.12, 0, -0.2],
    [0, 0.45, 0, 0.35],
    [0.02, -0.02, 0.38, 0.15],
  ];
  for (const [dx, dz, dy, yaw] of blocks) b.box({ x: base.x + dx, y: y + dy, z: base.z + dz, yaw }, [0.55, 0.38, 0.42], dy ? STONE.sideAlt : STONE.side, STONE.top);
}

/**
 * L'oriflamme : un mât planté au nord-ouest de la tour, plus haut que la galerie, sa pomme, et la flamme qui part vers
 * l'est, en deux pans un peu cassés (immobile : rien ne bouge derrière la consigne). Ses deux faces se voient.
 */
function oriflamme(b: FacetBuilder, t: Vec3): void {
  const F = FLAG;
  const p = around(t, F.angle, F.distance, 0);
  const foot = groundAt(p.x, p.z);
  const top = t.y + F.height;
  b.beam({ x: p.x, y: foot, z: p.z }, { x: p.x, y: top, z: p.z }, 0.12, C.post);
  b.prism({ x: p.x, y: top, z: p.z }, 0.1, 0.04, 0.16, 6, C.rail);
  // La flamme, vers l'est et un peu au sud (vue de face, elle flotte vers la tour) : un trapèze, puis la pointe.
  const y0 = top - 0.12,
    y1 = top - 0.95;
  const P = (dx: number, y: number, dz: number): P3 => [p.x + dx, y, p.z + dz];
  const a = P(0, y0, 0),
    d = P(0, y1, 0);
  const m0 = P(0.9, y0 - 0.12, 0.28),
    m1 = P(0.9, y1 + 0.16, 0.28);
  const tip = P(1.7, (y0 + y1) / 2 - 0.12, 0.12);
  twoSided(b, a, d, m1, m0, C.flag, C.flagShade);
  twoSided(b, m0, m1, tip, null, C.flagShade, C.flag);
}

/** Un quadrilatère (ou un triangle, `q4` nul) vu des deux côtés : sa face d'une couleur, son revers de l'autre. */
function twoSided(b: FacetBuilder, p: P3, q: P3, r: P3, s: P3 | null, face: number, back: number): void {
  if (s) {
    b.quad(p, q, r, s, face);
    b.quad(s, r, q, p, back);
  } else {
    b.triangle(p, q, r, face);
    b.triangle(r, q, p, back);
  }
}

/** Un pin (comme aux Écluses) : un tronc à quatre pans, trois étages de cônes à six pans, de deux verts. */
function fir(b: FacetBuilder, x: number, z: number, s: number, seed: number): void {
  const y = groundAt(x, z);
  const yaw = jitter(seed + 300) * Math.PI;
  b.prism({ x, y, z, yaw }, 0.16 * s, 0.12 * s, 0.9 * s, 4, C.trunk);
  for (let k = 0; k < 3; k++) {
    const r = (1.2 - 0.3 * k) * s;
    b.prism({ x, y: y + (0.7 + 0.85 * k) * s, z, yaw: yaw + k * 0.5 }, r, 0, 1.5 * s, 6, k % 2 ? C.firLight : C.fir);
  }
}

/**
 * Les rochers, depuis le sol de la scène : x, z, rayon. Au pied de la tour, de part et d'autre de la porte (derrière
 * Kéo et le guetteur, plus bas que leurs épaules), et quelques-uns dans l'herbe, loin du tour de la caméra. Rien entre
 * 3 et 5,5 à l'est, de 1,2 à 4 au nord : la place du poteau-lanterne et de l'escalier du guetteur (amenagements.ts).
 */
const ROCKS: readonly (readonly [number, number, number])[] = [
  [-2.7, -2.6, 0.5],
  [-1.6, -2.4, 0.32],
  [2.6, -2.5, 0.45],
  [6.6, -5.4, 0.38],
  [-3.9, -4.6, 0.55],
  [-1.4, -9.6, 0.6],
  [7.6, -2.2, 0.5],
];

/** Les touffes d'herbe : x, z, taille. Au bord du dallage, au pied des rochers et le long du sentier. */
const TUFTS: readonly (readonly [number, number, number])[] = [
  [-5.3, -1.0, 1],
  [5.4, -0.9, 1],
  [-3.3, -2.0, 0.9],
  [1.8, 2.6, 0.9],
  [-1.9, 3.4, 1],
  [-3.6, 6.4, 0.9],
  [0.4, 5.6, 0.8],
  [-4.4, -6.6, 1],
  [4.6, -6.8, 0.9],
  [6.6, -4.2, 1],
  [-6.4, -3.4, 0.9],
];

/**
 * Les pins, depuis le sol de la scène : x, z, échelle. Deux derrière la tour, de part et d'autre (ils encadrent le
 * chantier, vus de face) ; les autres loin, hors du tour de la caméra (elle tourne à quelque 15,6 unités du point visé),
 * pour que les côtés et le dos ne soient pas une prairie nue.
 */
const FIRS: readonly (readonly [number, number, number])[] = [
  [-5.6, -8.4, 1.25],
  [5.9, -9.6, 1.4],
  [8.2, -7.4, 1.05],
  [-18.5, -4, 1.4],
  [-17.5, 6.5, 1.3],
  [18, 7.5, 1.2],
  [-9, -19, 1.5],
  [10, -18.5, 1.3],
];
