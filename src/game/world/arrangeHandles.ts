// Les poignées du mode « Modifier le plan » (GD-9), dessinées dans le monde (mot du mainteneur, 6 octobre 2026 : « Il
// faut intégrer les boutons dans le dessin », « Pour rotation et translation ») : les quatre flèches et « Tourner », sur
// des radeaux posés sur l'eau autour du choix (intention du directeur artistique du 6 octobre 2026). Dans Blocland, un
// radeau carré de 3 × 3 cubes plats, une flèche en cubes dessus (une tige longue, la pointe large en triangle à marches,
// sans biais) ; « Tourner » : un arc ouvert, sa pointe en marches (↷). Dans Archipéo (rattrapage),
// un radeau de trois planches, une flèche peinte à plat ; « Tourner » : une flèche en arc sur une bouée ronde à huit
// pans. Indisponible : le radeau gris pierre, la pointe disparaît (la tige seule). Rien à lire dans le monde : les
// boutons HTML transparents posés par-dessus (ArrangeHandles.tsx) portent les noms.
// Ici : où se tient chaque poignée (à une place du bord de l'emprise du choix, jamais plus loin, par-dessus la terre si
// l'eau n'est pas là), sa forme (sommets et couleurs, en cases, dans le repère de Three : x, hauteur, y) et ce
// qu'elle coûte. Code pur, sans Three.js ; la 3D les dessine en un seul maillage (three/arrangeHandles.ts).
import type { World } from '../engine/state';
import { type Direction, DIRECTION_STEP, nextFreeSpot, nextGuardianSpot } from './arrange';
import { type ArrangeChoice, canTurn, stepChoice, turnChoice } from './arrangeMode';
import type { Rectangle } from './placement';

/** Une poignée : une des quatre flèches, ou « Tourner ». */
export type CleDePoignee = Direction | 'tourner';

/** Le côté d'un radeau, en cases (à l'échelle 1). */
export const COTE_DU_RADEAU = 3;
/** L'eau laissée entre le bord de l'emprise du choix et le radeau, en cases. */
const ECART = 1;
/**
 * Depuis le milieu du choix, au moins trois demi-côtés et demi de radeau de la poignée la plus proche (à l'échelle `s`,
 * `ELOIGNEMENT × s`) : deux poignées voisines (le nord et l'est, « Tourner » et ses deux voisines) ne se touchent jamais,
 * même autour d'une borne.
 */
const ELOIGNEMENT = COTE_DU_RADEAU + COTE_DU_RADEAU / 6;
/** Jamais sous cette taille à l'écran, en pixels CSS (la plus petite cible du toucher). */
export const POIGNEE_MIN_PX = 48;
/**
 * Les échelles où la place de chaque poignée est calculée (la vue s'éloigne : le radeau grandit) ; entre deux, la place
 * de l'échelle au-dessus, un peu plus loin que le radeau plus petit ne le demande ; au-delà de la dernière, la poignée s'écarte
 * d'autant que son radeau grandit.
 */
export const ECHELLES: readonly number[] = [1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8];

/**
 * Une poignée posée : son décalage depuis le milieu du choix à chaque échelle de `ECHELLES` (en cases du monde, x puis y),
 * le premier à l'échelle 1 (`ox`, `oy`), et si elle sert.
 */
export interface PoigneeDuMonde {
  cle: CleDePoignee;
  ox: number;
  oy: number;
  places: readonly number[];
  dispo: boolean;
}

/** Les poignées d'un choix : le milieu de son emprise, la hauteur de l'eau (le dessus), et chaque poignée. */
export interface PoigneesDuChoix {
  cx: number;
  cy: number;
  z: number;
  liste: PoigneeDuMonde[];
  /** Ce que couvrent les radeaux à l'échelle 1, emprise du choix comprise : la vue le garde à l'écran. */
  emprise: Rectangle;
}

/** Le côté de chaque poignée, en cases du monde : le nord vers les y qui montent, l'est vers les x qui descendent. */
const SENS: Readonly<Record<CleDePoignee, { dx: number; dy: number }>> = {
  ...DIRECTION_STEP,
  tourner: { dx: DIRECTION_STEP.est.dx, dy: DIRECTION_STEP.nord.dy },
};

/** L'ordre des poignées : les quatre flèches, puis « Tourner ». */
export const CLES_DES_POIGNEES: readonly CleDePoignee[] = ['nord', 'sud', 'ouest', 'est', 'tourner'];

/** La poignée sert-elle (la flèche trouve une place de ce côté ; « Tourner » trouve où tourner) ? */
function sert(world: World, c: ArrangeChoice, cle: CleDePoignee): boolean {
  if (cle !== 'tourner') {
    // Le même calcul que la flèche ; pour un lieu et un Gardien, sans construire le choix suivant.
    if (c.genre === 'lieu') return nextFreeSpot(world, c.id, c.spot, cle) !== null;
    if (c.genre === 'gardien') return nextGuardianSpot(world, c.id, c.place, cle) !== null;
    return stepChoice(world, c, cle) !== null;
  }
  if (c.genre === 'lieu') return turnChoice(world, c) !== null;
  return true;
}

/**
 * Les poignées d'un choix autour de son emprise `r` (en cases du monde), l'eau à la hauteur `z` (le dessus) : chaque
 * flèche de son côté, « Tourner » au coin nord-est, chacune à une place (`ECART`) du bord de l'emprise, et à
 * `ELOIGNEMENT` demi-côtés au moins du milieu. Jamais plus loin (mainteneur, 6 octobre 2026) : une poignée qui tombe
 * sur une terre y reste, par-dessus (la 3D la dessine devant le décor) ; « toujours visible » prime sur l'eau libre.
 * Calculé à chaque échelle de `ECHELLES`. « Tourner » seulement pour ce qui tourne (`canTurn`).
 */
export function poigneesDuChoix(world: World, c: ArrangeChoice, r: Rectangle, z: number): PoigneesDuChoix {
  const cx = (r.x0 + r.x1) / 2;
  const cy = (r.y0 + r.y1) / 2;
  const rx = (r.x1 - r.x0) / 2;
  const ry = (r.y1 - r.y0) / 2;
  const liste: PoigneeDuMonde[] = [];
  for (const cle of CLES_DES_POIGNEES) {
    if (cle === 'tourner' && !canTurn(c)) continue;
    const sens = SENS[cle];
    const places: number[] = [];
    for (const e of ECHELLES) {
      const demi = (COTE_DU_RADEAU / 2) * e;
      const loin = (rayon: number) => Math.max(rayon + ECART + demi, ELOIGNEMENT * e);
      places.push(sens.dx * loin(rx), sens.dy * loin(ry));
    }
    liste.push({ cle, ox: places[0], oy: places[1], places, dispo: sert(world, c, cle) });
  }
  const demi = COTE_DU_RADEAU / 2;
  const xs = liste.map((p) => cx + p.ox);
  const ys = liste.map((p) => cy + p.oy);
  const emprise = {
    x0: Math.min(r.x0, ...xs.map((x) => x - demi)),
    y0: Math.min(r.y0, ...ys.map((y) => y - demi)),
    x1: Math.max(r.x1, ...xs.map((x) => x + demi)),
    y1: Math.max(r.y1, ...ys.map((y) => y + demi)),
  };
  return { cx, cy, z, liste, emprise };
}

/**
 * Le milieu de chaque poignée à l'échelle `s` (un radeau de `COTE_DU_RADEAU × s` cases), écrit dans `out` (x, y en
 * cases du monde, deux nombres par poignée, sans rien allouer) : sa place à la première échelle de `ECHELLES` qui n'est
 * pas plus petite que `s` ; au-delà de la dernière, elle s'écarte encore de `ELOIGNEMENT` par échelle de plus.
 */
export function placerALEchelle(p: PoigneesDuChoix, s: number, out: Float32Array): void {
  let i = 0;
  while (i < ECHELLES.length - 1 && ECHELLES[i] < s) i++;
  const plus = Math.max(0, s - ECHELLES[i]) * ELOIGNEMENT;
  p.liste.forEach((q, k) => {
    const ox = q.places[2 * i];
    const oy = q.places[2 * i + 1];
    out[2 * k] = p.cx + ox + Math.sign(ox) * plus;
    out[2 * k + 1] = p.cy + oy + Math.sign(oy) * plus;
  });
}

// ---------- La forme ----------

/** Le style des poignées : en cubes (Blocland), ou peint à plat (Archipéo). */
export type StyleDesPoignees = 'blocs' | 'peint';

/** Une couleur, en sRGB (0 à 1). */
type Rgb = readonly [number, number, number];
const rgb = (hex: number): Rgb => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];

/**
 * Les couleurs des poignées (intention du directeur artistique, point 8) : le radeau clair des boutons (Blocland : crème,
 * deux tons pour lire les cubes, à bord sombre ; Archipéo : Brume #E5EBE3 bordé de Nuit océan #142B38), la flèche sombre
 * (#3b2d20 ; Nuit océan) ; indisponible, le radeau gris pierre. Jamais le jaune des places libres (#ffc21a).
 */
export const COULEURS_DES_POIGNEES = {
  blocs: { clair: rgb(0xf3e4c0), clair2: rgb(0xebdcb4), bord: rgb(0x3b2d20), fleche: rgb(0x3b2d20), pierre: rgb(0xa8a59c), pierre2: rgb(0x9c998f) },
  peint: { clair: rgb(0xe5ebe3), clair2: rgb(0xd8e0d6), bord: rgb(0x142b38), fleche: rgb(0x142b38), pierre: rgb(0xa9aea9), pierre2: rgb(0x9da39e) },
} as const;

/** La forme des poignées : sommets (x, hauteur, y, en cases, autour du milieu de chaque poignée), couleurs et triangles. */
export interface FormeDesPoignees {
  positions: Float32Array;
  couleurs: Float32Array;
  index: Uint16Array;
  /** Le premier sommet de chaque poignée, puis le nombre de sommets (une entrée de plus que de poignées). */
  debuts: number[];
}

/** L'épaisseur du radeau au-dessus de l'eau, et celle de la flèche dessus, en cases. */
const RADEAU_HAUT = 0.3;
const RADEAU_BAS = -0.1;
const FLECHE_HAUT = 0.1;
/** Le bord sombre du radeau de Blocland, autour de ses cubes clairs, en cases. */
const BORD_DU_RADEAU = 0.12;
/** Le pas de la flèche en cubes : huit pas de haut tiennent sur le radeau, une marge claire d'un pas autour d'elle. */
const PAS = 0.28;

/** De quoi écrire une forme, face par face. */
class Traceur {
  readonly pos: number[] = [];
  readonly col: number[] = [];
  readonly idx: number[] = [];
  /** Une face de quatre sommets (dans l'ordre du tour), d'une couleur. */
  quad(a: readonly number[], b: readonly number[], c: readonly number[], d: readonly number[], k: Rgb): void {
    const n = this.pos.length / 3;
    for (const v of [a, b, c, d]) this.pos.push(v[0], v[1], v[2]);
    for (let i = 0; i < 4; i++) this.col.push(k[0], k[1], k[2]);
    this.idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  /** Un triangle d'une couleur. */
  tri(a: readonly number[], b: readonly number[], c: readonly number[], k: Rgb): void {
    const n = this.pos.length / 3;
    for (const v of [a, b, c]) this.pos.push(v[0], v[1], v[2]);
    for (let i = 0; i < 3; i++) this.col.push(k[0], k[1], k[2]);
    this.idx.push(n, n + 1, n + 2);
  }
  /** Le dessus seul d'un rectangle (x0, y0, x1, y1 au sol), à la hauteur h. */
  dessus(x0: number, y0: number, x1: number, y1: number, h: number, k: Rgb): void {
    this.quad([x0, h, y0], [x0, h, y1], [x1, h, y1], [x1, h, y0], k);
  }
  /** Un pavé sans dessous (dessus et quatre côtés) : 10 triangles. */
  pave(x0: number, y0: number, x1: number, y1: number, h0: number, h1: number, haut: Rgb, cotes: Rgb): void {
    this.dessus(x0, y0, x1, y1, h1, haut);
    this.quad([x0, h0, y0], [x1, h0, y0], [x1, h1, y0], [x0, h1, y0], cotes);
    this.quad([x1, h0, y1], [x0, h0, y1], [x0, h1, y1], [x1, h1, y1], cotes);
    this.quad([x0, h0, y1], [x0, h0, y0], [x0, h1, y0], [x0, h1, y1], cotes);
    this.quad([x1, h0, y0], [x1, h0, y1], [x1, h1, y1], [x1, h1, y0], cotes);
  }
}

/**
 * Un rectangle de cases d'une grille de pas `PAS`, en cases de l'écran (u vers la droite, v vers le haut, de u0 à u1 et
 * de v0 à v1 compris, les milieux des cases ; des demi-pas pour centrer une forme de largeur paire), dessiné vers le nord.
 */
type Cases = readonly [number, number, number, number];

/**
 * La flèche en cubes vers le haut de l'écran (le nord), haute de huit pas, large de sept : la tige, large de trois pas
 * et longue de quatre ; la pointe pleine en triangle à marches (sept, cinq, trois, un), sans biais : ⬆. Une tige longue
 * et une pointe large : vue de dessus à 48 px, une silhouette de flèche, ni tache ni croix (une tige de deux pas sous
 * une pointe de sept se lisait comme une croix). Indisponible, la tige seule (`seule`).
 */
const FLECHE_EN_CUBES: { seule: Cases[]; pleine: Cases[] } = {
  seule: [[-1, -3.5, 1, -0.5]],
  pleine: [
    [-1, -3.5, 1, -0.5],
    [-3, 0.5, 3, 0.5],
    [-2, 1.5, 2, 1.5],
    [-1, 2.5, 1, 2.5],
    [0, 3.5, 0, 3.5],
  ],
};

/**
 * « Tourner » en cubes, sur la même grille : un arc ouvert, épais de deux pas, qui monte à gauche, passe en escalier
 * par-dessus et redescend à droite, et sa pointe en triangle à marches (quatre, deux) tournée vers le bas : ↷, le sens
 * des aiguilles d'une montre, comme le lieu tourne. Indisponible, l'arc seul.
 */
const TOURNER_EN_CUBES: { seule: Cases[]; pleine: Cases[] } = (() => {
  const arc: Cases[] = [
    [-3.5, -3, -2.5, 1],
    [-2.5, 1, -1.5, 2],
    [-1.5, 2, 1.5, 3],
    [1.5, 1, 2.5, 2],
  ];
  return {
    seule: arc,
    pleine: [...arc, [0.5, 0, 3.5, 0], [1.5, -1, 2.5, -1]],
  };
})();

/** Tourner un point (x, y) d'un quart de tour par `n`, vers la gauche. */
function tourne(x: number, y: number, n: number): [number, number] {
  let p: [number, number] = [x, y];
  for (let i = 0; i < n; i++) p = [-p[1], p[0]];
  return p;
}

/** Combien de quarts de tour pour qu'une forme dessinée vers le nord (+y) regarde le côté de la poignée. */
function quartsVers(cle: CleDePoignee): number {
  const s = SENS[cle];
  if (cle === 'tourner' || (s.dx === 0 && s.dy > 0)) return 0;
  if (s.dx === 0) return 2;
  // L'est est vers les x qui descendent : (0, 1) tourné d'un quart vers la gauche donne (-1, 0).
  return s.dx < 0 ? 1 : 3;
}

/**
 * Les pavés d'une forme en cubes, tournés vers le côté, dessus le radeau. La droite de l'écran est vers les x qui
 * descendent (l'est) : x = -u.
 */
function cubesDeLaFleche(t: Traceur, cases: readonly Cases[], n: number, k: Rgb): void {
  for (const [u0, v0, u1, v1] of cases) {
    const a = tourne(-(u0 - 0.5) * PAS, (v0 - 0.5) * PAS, n);
    const b = tourne(-(u1 + 0.5) * PAS, (v1 + 0.5) * PAS, n);
    t.pave(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), RADEAU_HAUT, RADEAU_HAUT + FLECHE_HAUT, k, k);
  }
}

/**
 * Une poignée de Blocland : le radeau sombre dessous (son bord), ses 3 × 3 cubes clairs dessus, jointifs, en damier de
 * deux crèmes proches (on y lit les cubes sans qu'un joint sombre ne croise la flèche), la flèche en cubes sombres.
 */
function poigneeEnCubes(t: Traceur, p: Pick<PoigneeDuMonde, 'cle' | 'dispo'>): void {
  const k = COULEURS_DES_POIGNEES.blocs;
  const demi = COTE_DU_RADEAU / 2;
  t.pave(-demi, -demi, demi, demi, RADEAU_BAS, RADEAU_HAUT - 0.02, k.bord, k.bord);
  const cube = (COTE_DU_RADEAU - 2 * BORD_DU_RADEAU) / 3;
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++) {
      const c = (i + j) % 2 === 0 ? (p.dispo ? k.clair : k.pierre) : p.dispo ? k.clair2 : k.pierre2;
      t.dessus((i - 0.5) * cube, (j - 0.5) * cube, (i + 0.5) * cube, (j + 0.5) * cube, RADEAU_HAUT, c);
    }
  const forme = p.cle === 'tourner' ? TOURNER_EN_CUBES : FLECHE_EN_CUBES;
  cubesDeLaFleche(t, p.dispo ? forme.pleine : forme.seule, quartsVers(p.cle), k.fleche);
}

/** Une poignée d'Archipéo : trois planches claires sur un fond sombre (leur bord), la flèche peinte à plat. */
function poigneePeinte(t: Traceur, p: Pick<PoigneeDuMonde, 'cle' | 'dispo'>): void {
  const k = COULEURS_DES_POIGNEES.peint;
  const demi = COTE_DU_RADEAU / 2;
  const clair = p.dispo ? k.clair : k.pierre;
  const peinture = RADEAU_HAUT + 0.03;
  if (p.cle === 'tourner') {
    // La bouée ronde à huit pans : son bord sombre, son dessus clair, la flèche en arc peinte dessus.
    const pan = (r: number, i: number, h: number) => [r * Math.cos((i * Math.PI) / 4 + Math.PI / 8), h, r * Math.sin((i * Math.PI) / 4 + Math.PI / 8)];
    // Les flancs d'abord, le dessus ensuite : la 3D les dessine dans l'ordre, sans test de profondeur.
    for (let i = 0; i < 8; i++) t.quad(pan(demi, i, RADEAU_BAS), pan(demi, i + 1, RADEAU_BAS), pan(demi, i + 1, RADEAU_HAUT), pan(demi, i, RADEAU_HAUT), k.bord);
    for (let i = 0; i < 8; i++) {
      t.tri([0, RADEAU_HAUT, 0], pan(demi * 0.86, i + 1, RADEAU_HAUT), pan(demi * 0.86, i, RADEAU_HAUT), clair);
      t.quad(pan(demi * 0.86, i, RADEAU_HAUT), pan(demi * 0.86, i + 1, RADEAU_HAUT), pan(demi, i + 1, RADEAU_HAUT), pan(demi, i, RADEAU_HAUT), k.bord);
    }
    // L'arc : quatre facettes d'un quart de cercle, du bas à gauche jusqu'en haut, puis la pointe vers la droite de l'écran.
    // Vue de l'écran, la droite est vers les x qui descendent : l'arc monte à gauche et tourne vers la droite (↱).
    const arc = (a: number, r: number) => [-r * Math.cos(a), peinture, r * Math.sin(a)];
    const a0 = Math.PI * 1.25;
    const a1 = Math.PI * 0.5;
    const segments = p.dispo ? 3 : 4;
    for (let i = 0; i < segments; i++) {
      const u = a0 + ((a1 - a0) * i) / 4;
      const v = a0 + ((a1 - a0) * (i + 1)) / 4;
      t.quad(arc(u, 0.6), arc(v, 0.6), arc(v, 1.1), arc(u, 1.1), k.fleche);
    }
    if (p.dispo) {
      const u = a0 + ((a1 - a0) * 3) / 4;
      t.tri(arc(u, 0.4), arc(u, 1.3), arc(a1 - 0.4, 0.85), k.fleche);
    }
    return;
  }
  // Le radeau : le fond sombre, puis trois planches claires (leurs joints sombres), dans le sens de la flèche.
  t.pave(-demi, -demi, demi, demi, RADEAU_BAS, RADEAU_HAUT - 0.02, k.bord, k.bord);
  const n = quartsVers(p.cle);
  for (let i = -1; i <= 1; i++) {
    const a = tourne(i - 0.44, -demi + 0.08, n);
    const b = tourne(i + 0.44, demi - 0.08, n);
    t.dessus(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), RADEAU_HAUT, clair);
  }
  // La flèche peinte : la tige (deux facettes), la pointe (une).
  const v = (x: number, y: number) => {
    const q = tourne(x, y, n);
    return [q[0], peinture, q[1]];
  };
  t.quad(v(-0.22, -1.1), v(-0.22, 0.15), v(0.22, 0.15), v(0.22, -1.1), k.fleche);
  if (p.dispo) t.tri(v(-0.8, 0.1), v(0, 1.15), v(0.8, 0.1), k.fleche);
}

/** La forme de toutes les poignées d'un choix, dans un seul maillage (un appel de dessin). */
export function formeDesPoignees(liste: readonly Pick<PoigneeDuMonde, 'cle' | 'dispo'>[], style: StyleDesPoignees): FormeDesPoignees {
  const t = new Traceur();
  const debuts: number[] = [];
  for (const p of liste) {
    debuts.push(t.pos.length / 3);
    if (style === 'blocs') poigneeEnCubes(t, p);
    else poigneePeinte(t, p);
  }
  debuts.push(t.pos.length / 3);
  return { positions: Float32Array.from(t.pos), couleurs: Float32Array.from(t.col), index: Uint16Array.from(t.idx), debuts };
}

/** Le plafond des poignées (intention du directeur artistique, point 9) : 400 triangles, un appel de dessin. */
export const BUDGET_DES_POIGNEES = { triangles: 400, drawCalls: 1 } as const;

/** Ce que coûtent les poignées d'un choix : un appel de dessin pour toutes, seulement pendant un choix. */
export function coutDesPoignees(p: PoigneesDuChoix | null | undefined, style: StyleDesPoignees): { triangles: number; drawCalls: number } {
  if (!p?.liste.length) return { triangles: 0, drawCalls: 0 };
  return { triangles: formeDesPoignees(p.liste, style).index.length / 3, drawCalls: 1 };
}
