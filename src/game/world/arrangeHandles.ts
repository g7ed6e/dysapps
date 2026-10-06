// Les poignées du mode « Modifier le plan » (GD-9), dessinées dans le monde (mot du mainteneur, 6 octobre 2026 : « Il
// faut intégrer les boutons dans le dessin », « Pour rotation et translation ») : les quatre flèches et « Tourner », sur
// des radeaux posés sur l'eau autour du choix (intention du directeur artistique du 6 octobre 2026). Dans Blocland, un
// radeau carré de 3 × 3 cubes plats, une flèche en cubes dessus (la tige haute de deux pas, la pointe en marches, sans
// biais) ; « Tourner » : un arc épais en quart de cercle, sa pointe en marches. Dans Archipéo (rattrapage),
// un radeau de trois planches, une flèche peinte à plat ; « Tourner » : une flèche en arc sur une bouée ronde à huit
// pans. Indisponible : le radeau gris pierre, la pointe disparaît (la tige seule). Rien à lire dans le monde : les
// boutons HTML transparents posés par-dessus (ArrangeHandles.tsx) portent les noms.
// Ici : où se tient chaque poignée (sur l'eau, une place du bord de l'emprise du choix, glissée à la première eau libre
// de son côté sur une terre), sa forme (sommets et couleurs, en cases, dans le repère de Three : x, hauteur, y) et ce
// qu'elle coûte. Code pur, sans Three.js ; la 3D les dessine en un seul maillage (three/arrangeHandles.ts).
import type { World } from '../engine/state';
import { type Direction, DIRECTION_STEP, guardianOf, joinsIn, nextFreeSpot, nextGuardianSpot, placeIn } from './arrange';
import { type ArrangeChoice, canTurn, placeOfChoice, stepChoice, turnChoice } from './arrangeMode';
import { footprintOf, frameOf, landRectangle } from './footprint';
import { type ArchipelagoId, archipelagoOfIsland, isLandInWorld } from './map';
import type { Rectangle } from './placement';
import { placesOf } from './routing';

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
/** Sur une terre, jusqu'où un radeau glisse de son côté pour trouver l'eau libre, en cases. */
const GLISSE_MAX = 48;
/** Jamais sous cette taille à l'écran, en pixels CSS (la plus petite cible du toucher). */
export const POIGNEE_MIN_PX = 48;
/**
 * Les échelles où la place de chaque poignée est calculée (la vue s'éloigne : le radeau grandit) ; entre deux, la place
 * de l'échelle au-dessus, dont l'eau libre couvre le radeau plus petit ; au-delà de la dernière, la poignée s'écarte
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

/** La terre d'une région, en table de sommes : combien de cases de terre dans un rectangle, en un calcul. */
interface Terre {
  x0: number;
  y0: number;
  w: number;
  h: number;
  /** Les sommes cumulées, (w + 1) × (h + 1). */
  somme: Int32Array;
}

/** Autour du cadre de la région, l'eau que les poignées peuvent prendre (hors du cadre : de l'eau). */
const MARGE_DU_CADRE = 8;

/** La terre de chaque région, calculée une fois par monde (le monde change à chaque pose). */
const terres = new WeakMap<World, Map<ArchipelagoId, Terre>>();

/** La terre de la région (lieux, îlots des Gardiens, grandes constructions, quai, réunions), en table de sommes. */
function terreDeLaRegion(world: World, a: ArchipelagoId): Terre {
  const deja = terres.get(world)?.get(a);
  if (deja) return deja;
  const f = frameOf(a);
  const x0 = f.x0 - MARGE_DU_CADRE;
  const y0 = f.y0 - MARGE_DU_CADRE;
  const w = f.x1 - f.x0 + 2 * MARGE_DU_CADRE;
  const h = f.y1 - f.y0 + 2 * MARGE_DU_CADRE;
  const plein = new Uint8Array(w * h);
  const remplir = (r: Rectangle, test?: (x: number, y: number) => boolean) => {
    for (let x = Math.max(r.x0, x0); x < Math.min(r.x1, x0 + w); x++)
      for (let y = Math.max(r.y0, y0); y < Math.min(r.y1, y0 + h); y++) if (!test || test(x, y)) plein[(y - y0) * w + (x - x0)] = 1;
  };
  for (const id of placesOf(a)) {
    const def = placeIn(world, id);
    remplir(landRectangle(def), (x, y) => isLandInWorld(def, x, y));
    for (const p of footprintOf(id, def, guardianOf(world, id))) if (p.genre !== 'terre') remplir(p);
  }
  for (const j of joinsIn(world, a)) remplir(j.shape.zone);
  const somme = new Int32Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) somme[(y + 1) * (w + 1) + x + 1] = plein[y * w + x] + somme[y * (w + 1) + x + 1] + somme[(y + 1) * (w + 1) + x] - somme[y * (w + 1) + x];
  const t = { x0, y0, w, h, somme };
  if (!terres.has(world)) terres.set(world, new Map());
  terres.get(world)!.set(a, t);
  return t;
}

/** Combien de cases de terre dans le rectangle [x0, x1[ × [y0, y1[ (en cases du monde). */
function terreDans(t: Terre, x0: number, y0: number, x1: number, y1: number): number {
  const a = Math.min(t.w, Math.max(0, x0 - t.x0));
  const b = Math.min(t.h, Math.max(0, y0 - t.y0));
  const c = Math.min(t.w, Math.max(0, x1 - t.x0));
  const d = Math.min(t.h, Math.max(0, y1 - t.y0));
  if (c <= a || d <= b) return 0;
  const W = t.w + 1;
  return t.somme[d * W + c] - t.somme[b * W + c] - t.somme[d * W + a] + t.somme[b * W + a];
}

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
 * `ELOIGNEMENT` demi-côtés au moins du milieu ; une poignée qui tomberait sur une terre glisse de son côté jusqu'à la
 * première eau libre sous tout son radeau (`GLISSE_MAX` au plus, sinon elle reste à sa première place). Calculé à chaque
 * échelle de `ECHELLES` : un radeau plus grand ne couvre pas plus de terre. « Tourner » seulement pour ce qui tourne
 * (`canTurn`).
 */
export function poigneesDuChoix(world: World, c: ArrangeChoice, r: Rectangle, z: number): PoigneesDuChoix {
  const cx = (r.x0 + r.x1) / 2;
  const cy = (r.y0 + r.y1) / 2;
  const rx = (r.x1 - r.x0) / 2;
  const ry = (r.y1 - r.y0) / 2;
  const terre = terreDeLaRegion(world, archipelagoOfIsland(placeOfChoice(c)));
  // Le radeau de demi-côté `d` centré en (x, y) est-il tout entier sur l'eau ?
  const libre = (x: number, y: number, d: number) => terreDans(terre, Math.floor(x - d), Math.floor(y - d), Math.ceil(x + d), Math.ceil(y + d)) === 0;
  const liste: PoigneeDuMonde[] = [];
  for (const cle of CLES_DES_POIGNEES) {
    if (cle === 'tourner' && !canTurn(c)) continue;
    const sens = SENS[cle];
    const places: number[] = [];
    for (const e of ECHELLES) {
      const demi = (COTE_DU_RADEAU / 2) * e;
      const loin = (rayon: number) => Math.max(rayon + ECART + demi, ELOIGNEMENT * e);
      const bx = sens.dx * loin(rx);
      const by = sens.dy * loin(ry);
      let ox = bx;
      let oy = by;
      for (let k = 0; k <= GLISSE_MAX; k++) {
        if (libre(cx + bx + sens.dx * k, cy + by + sens.dy * k, demi)) {
          ox = bx + sens.dx * k;
          oy = by + sens.dy * k;
          break;
        }
      }
      places.push(ox, oy);
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
  blocs: { clair: rgb(0xf3e4c0), clair2: rgb(0xe8d5a8), bord: rgb(0x3b2d20), fleche: rgb(0x3b2d20), pierre: rgb(0xa8a59c), pierre2: rgb(0x9c998f) },
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
const FLECHE_HAUT = 0.15;
/** Le pas de la flèche en cubes (sept pas tiennent sur le radeau, un liseré clair autour d'elle). */
const PAS = 0.36;

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

/** Un rectangle de cases d'une grille de pas `PAS` (i de i0 à i1, j de j0 à j1, compris), tourné vers son côté. */
type Cases = readonly [number, number, number, number];

/**
 * La flèche en cubes vers le nord (les y qui montent), sur une grille de sept pas (`PAS`) de côté : la tige, large de
 * trois pas, haute de deux ; la pointe pleine en escalier, quatre marches (sept, cinq, trois, un), sans biais : ⬆. À
 * 48 px, une pointe de trois marches se lisait comme une croix : la quatrième la fait lire comme une flèche.
 * Indisponible, la tige seule (`seule`).
 */
const FLECHE_EN_CUBES: { seule: Cases[]; pleine: Cases[] } = {
  seule: [[-1, -3, 1, -2]],
  pleine: [
    [-1, -3, 1, -2],
    [-3, -1, 3, -1],
    [-2, 0, 2, 0],
    [-1, 1, 1, 1],
    [0, 2, 0, 2],
  ],
};

/**
 * « Tourner » en cubes, sur la même grille : un arc épais en quart de cercle (monte à gauche, tourne en escalier, file
 * vers la droite de l'écran), puis sa pointe en escalier vers la droite (l'est, les x qui descendent) : ↱.
 * Indisponible, l'arc seul.
 */
const TOURNER_EN_CUBES: { seule: Cases[]; pleine: Cases[] } = (() => {
  const arc: Cases[] = [
    [1, -3, 2, 0],
    [2, 1, 2, 1],
    [-1, 1, 1, 2],
  ];
  return {
    seule: arc,
    pleine: [
      ...arc,
      [-2, 0, -2, 3],
      [-3, 1, -3, 2],
    ],
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

/** Les pavés d'une forme en cubes, tournés vers le côté, dessus le radeau. */
function cubesDeLaFleche(t: Traceur, cases: readonly Cases[], n: number, k: Rgb, cotes: Rgb): void {
  for (const [i0, j0, i1, j1] of cases) {
    const a = tourne((i0 - 0.5) * PAS, (j0 - 0.5) * PAS, n);
    const b = tourne((i1 + 0.5) * PAS, (j1 + 0.5) * PAS, n);
    t.pave(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), RADEAU_HAUT, RADEAU_HAUT + FLECHE_HAUT, k, cotes);
  }
}

/** Une poignée de Blocland : le radeau sombre dessous (son bord), ses 3 × 3 cubes clairs dessus, la flèche en cubes. */
function poigneeEnCubes(t: Traceur, p: Pick<PoigneeDuMonde, 'cle' | 'dispo'>): void {
  const k = COULEURS_DES_POIGNEES.blocs;
  const demi = COTE_DU_RADEAU / 2;
  t.pave(-demi, -demi, demi, demi, RADEAU_BAS, RADEAU_HAUT - 0.02, k.bord, k.bord);
  // Les neuf cubes plats, un joint sombre entre eux : on y lit les cubes.
  const l = 0.45;
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++) {
      const c = (i + j) % 2 === 0 ? (p.dispo ? k.clair : k.pierre) : p.dispo ? k.clair2 : k.pierre2;
      t.dessus(i - l, j - l, i + l, j + l, RADEAU_HAUT, c);
    }
  const forme = p.cle === 'tourner' ? TOURNER_EN_CUBES : FLECHE_EN_CUBES;
  cubesDeLaFleche(t, p.dispo ? forme.pleine : forme.seule, quartsVers(p.cle), k.fleche, k.bord);
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
    for (let i = 0; i < 8; i++) {
      t.quad(pan(demi, i, RADEAU_BAS), pan(demi, i + 1, RADEAU_BAS), pan(demi, i + 1, RADEAU_HAUT), pan(demi, i, RADEAU_HAUT), k.bord);
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
