/**
 * Les abords de la scénette des Quais (d'après le concept du 18 octobre 2026, « scenettes-6e-quais-v2 ») : le quai de
 * planches claires tenu par ses pieux au bord du bassin, une jetée sur pilotis le long de la rive est, la maison à
 * colombages sur pilotis au toit d'ardoise bleue en réparation (ses liteaux posés), des tonneaux, des piles de planches,
 * un voilier amarré au sud-ouest du bassin et des rochers à facettes de pierre chaude sur les rives (le kit commun,
 * ./surroundingsKit.ts, pour la maison et les rochers). Fini tout autour, puisque la caméra tourne à deux doigts : de
 * face, la maison derrière le docker, entière sous « Vue simple » ; de côté, la jetée et les planches ; de dos, le bassin,
 * le voilier et la rive sud, la maison sous le panneau.
 *
 * Tout se tient hors de l'anneau où la rangée des objets-réponses se pose quand la caméra tourne (à moins de 7,5 du
 * point visé, `RING`), sauf ce qui reste au ras du quai (les pieux, les joints des planches) ; rien de haut entre la
 * caméra de face et la scène. Aplats francs, une couleur par facette, jamais presque noir. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { QUAY } from './questionScene';
import type { SurroundingsState } from './surroundings';
import { NATURE, groundAt, rock, timberHouse } from './surroundingsKit';
import { heightAt } from './terrain';

const C = {
  /** Les planches claires du quai et de la jetée, leur tranche, leurs joints. */
  plank: 0xdcc08f,
  plankSide: 0xb08658,
  seam: 0xb48c5c,
  /** Les pieux (le bois des pieux des pontons, lot commun des scénettes). */
  pile: NATURE.pile,
  /** Les tonneaux : les douelles, le cerclage, le fond. */
  stave: 0x9a6a3e,
  hoop: 0x7f8b90,
  lid: 0xc08c55,
  /** Le voilier : sa coque blanche, sa bande bleue, son pont, son mât, sa voile ferlée, ses haubans. */
  hull: 0xf2eee4,
  stripe: 0x4f7fa3,
  boatDeck: 0xc9a26e,
  mast: 0xa57a4f,
  sail: 0xebe2cc,
  rope: 0x8f7a5c,
} as const;

/**
 * Où sont les abords, depuis le sol de la scène (`floor`, le milieu de la bande de devant du quai) : la maison et sa
 * plate-forme (le centre de la maison, sa largeur et sa profondeur), la jetée (son axe, sa largeur, son début et sa fin),
 * le voilier (son milieu), les tas de la rive ouest.
 */
export const QUAIS_SURROUNDINGS = {
  house: { dx: 4.4, dz: -9.4, width: 3.2, depth: 2.4, wall: 1.6, stilts: 0.15, slope: 0.75 },
  jetty: { dx: 9.7, width: 1.6, from: -0.7, to: 8.5, top: 0.78 },
  sailboat: { dx: -5.6, dz: 11.2, length: 4.2, width: 1.3 },
  westPile: { dx: -9.1, dz: -3.3 },
  /** La pile de planches neuves, au pied de la maison, à l'est, au-delà de son escalier. */
  yard: { dx: 8.9, dz: -10.4 },
} as const;

/** La distance au point visé en deçà de laquelle la rangée des réponses peut se poser quand la caméra tourne. */
export const RING = 7.5;

export function quaisSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  quayPiles(b, floor);
  jetty(b, floor);
  house(b, floor);
  westShore(b, floor);
  sailboat(b, floor);
  rocks(b, floor);
}

/** Le sol en un point, un rien enfoncé : un pied posé ne flotte jamais. */
const footAt = (x: number, z: number, sink = 0.12): number => groundAt(x, z, sink);

/**
 * Le quai de la scène de l'item, vu de l'eau : ses pieux le long du bord (à demi pris dans sa tranche, leur tête au ras
 * du plancher : rien n'y bute) et les joints de ses planches, dans le sens de la profondeur.
 */
function quayPiles(b: FacetBuilder, f: Vec3): void {
  const edge = f.z + QUAY.strip / 2;
  const half = QUAY.width / 2;
  const n = 9;
  for (let i = 0; i < n; i++) {
    const x = f.x - half + 0.25 + ((2 * half - 0.5) * i) / (n - 1);
    const foot = footAt(x, edge + 0.08);
    b.box({ x, y: foot, z: edge + 0.04 }, [0.22, f.y - 0.02 - foot, 0.22], C.pile);
  }
  // Les joints, de l'ouest du quai jusqu'au docker : au-delà, le pied de la grue et la place d'un aménagement.
  const y = f.y + 0.012;
  for (let k = 1; k < 18; k++) {
    const x = f.x - half + k * 0.6;
    b.quad([x - 0.025, y, edge - 0.02], [x + 0.025, y, edge - 0.02], [x + 0.025, y, edge - QUAY.depth], [x - 0.025, y, edge - QUAY.depth], C.seam);
  }
}

/**
 * La jetée sur pilotis, le long de la rive est du bassin : du rivage, au nord, vers le large ; ses planches en travers,
 * ses pieux par paires, des écharpes sur sa face est, un tonneau au bout.
 */
function jetty(b: FacetBuilder, f: Vec3): void {
  const J = QUAIS_SURROUNDINGS.jetty;
  const x = f.x + J.dx, z0 = f.z + J.from, z1 = f.z + J.to, y = J.top;
  const len = z1 - z0;
  b.box({ x, y: y - 0.16, z: (z0 + z1) / 2 }, [J.width, 0.16, len], C.plankSide, C.plank);
  for (let k = 1; k * 0.7 < len; k++) {
    const z = z0 + k * 0.7;
    b.quad([x - J.width / 2, y + 0.012, z + 0.02], [x + J.width / 2, y + 0.012, z + 0.02], [x + J.width / 2, y + 0.012, z - 0.02], [x - J.width / 2, y + 0.012, z - 0.02], C.seam);
  }
  const rows = 6;
  const zs = Array.from({ length: rows }, (_, i) => z0 + 0.15 + ((len - 0.3) * i) / (rows - 1));
  for (const z of zs)
    for (const side of [-1, 1]) {
      const px = x + side * (J.width / 2 - 0.05);
      const foot = footAt(px, z);
      b.box({ x: px, y: foot, z }, [0.2, y + 0.12 - foot, 0.2], C.pile);
    }
  // Les écharpes sur la face est, de pieu en pieu, au-dessus de l'eau.
  const ex = x + J.width / 2 + 0.06;
  for (let i = 1; i < rows - 1; i++) b.beam({ x: ex, y: 0.05, z: zs[i] }, { x: ex, y: y - 0.2, z: zs[i + 1] }, 0.09, C.pile);
  barrel(b, x - 0.3, y, z1 - 0.5);
}

/**
 * La maison à colombages sur pilotis, derrière le quai, au nord-est (le kit commun, `timberHouse`) : sa plate-forme de
 * planches sur six pieux et son escalier à l'est ; les murs crème et leurs colombages, la porte et les fenêtres au sud ;
 * le toit d'ardoise à deux pans en réparation (sur chaque pan, un morceau à nu et ses liteaux neufs). À son pied, à l'est,
 * la pile de planches neuves et deux tonneaux. Le bord sud de la plate-forme reste au nord de la rangée des réponses de
 * dos, et son bord ouest à l'est du regard de la caméra de dos vers le docker.
 */
function house(b: FacetBuilder, f: Vec3): void {
  const H = QUAIS_SURROUNDINGS.house;
  timberHouse(b, { x: f.x + H.dx, z: f.z + H.dz, width: H.width, depth: H.depth, wall: H.wall, slope: H.slope, stilts: H.stilts, repair: true });
  // Au pied de l'escalier : la pile de planches neuves (trois lits) sur ses cales, et deux tonneaux.
  const Y = QUAIS_SURROUNDINGS.yard;
  const yx = f.x + Y.dx, yz = f.z + Y.dz;
  const yy = heightAt({ x: yx, z: yz }) + 0.1;
  for (const dz of [-0.85, 0.85]) b.box({ x: yx, y: footAt(yx, yz + dz), z: yz + dz }, [1.2, yy - footAt(yx, yz + dz), 0.18], C.pile);
  planks(b, yx, yy, yz, [4, 3, 2], 2.4);
  for (const [dx, dz] of [[-0.2, 1.75], [0.6, 1.9]]) barrel(b, yx + dx, heightAt({ x: yx + dx, z: yz + dz }) - 0.04, yz + dz);
}

/** Un tonneau posé en (x, y, z) : deux troncs de cône de douelles, un cerclage au ventre, le fond clair. */
function barrel(b: FacetBuilder, x: number, y: number, z: number): void {
  const r0 = 0.27, r1 = 0.33, h = 0.38, sides = 7;
  b.prism({ x, y, z }, r0, r1, h, sides, C.stave);
  b.band({ x, y: y + h - 0.06, z }, r1 + 0.01, 0.12, sides, C.hoop);
  b.prism({ x, y: y + h, z }, r1, r0, h, sides, C.stave, C.lid);
}

/** Une pile de planches le long de z, posée en (x, y, z) : des lits de `rows` planches, de `length` de long. */
function planks(b: FacetBuilder, x: number, y: number, z: number, rows: readonly number[], length: number): void {
  const w = 0.24, t = 0.09;
  rows.forEach((n, layer) => {
    for (let i = 0; i < n; i++) {
      const px = x + (i - (n - 1) / 2) * (w + 0.02);
      b.box({ x: px, y: y + layer * t, z: z + (layer % 2 ? 0.15 : 0) }, [w, t, length - layer * 0.25], C.plankSide, C.plank);
    }
  });
}

/** La rive ouest, au-delà du bout du quai : une pile de planches sur ses deux cales, un tonneau. */
function westShore(b: FacetBuilder, f: Vec3): void {
  const P = QUAIS_SURROUNDINGS.westPile;
  const x = f.x + P.dx, z = f.z + P.dz;
  const y = heightAt({ x, z }) + 0.12;
  for (const dz of [-0.8, 0.8]) b.box({ x, y: footAt(x, z + dz), z: z + dz }, [1.1, y - footAt(x, z + dz), 0.18], C.pile);
  planks(b, x, y, z, [3, 2], 2.2);
  barrel(b, x - 1, heightAt({ x: x - 1, z: z - 1 }) - 0.04, z - 1);
}

/**
 * Le voilier amarré au sud-ouest du bassin, loin de la rangée : sa coque blanche à la bande bleue, sa proue en pointe à
 * l'est, son pont et son rouf, le mât, la bôme et sa voile ferlée, l'étai et le pataras ; le pieu où il est amarré.
 */
function sailboat(b: FacetBuilder, f: Vec3): void {
  const S = QUAIS_SURROUNDINGS.sailboat;
  const x = f.x + S.dx, z = f.z + S.dz;
  const body = S.length - S.width / 2;
  const cx = x - S.width / 4;
  b.box({ x: cx, y: -0.25, z }, [body, 0.7, S.width], C.hull, C.boatDeck);
  b.prism({ x: cx + body / 2, y: -0.25, z }, S.width / 2, S.width / 2, 0.7, 4, C.hull, C.boatDeck);
  b.box({ x: cx, y: 0.06, z }, [body + 0.02, 0.12, S.width + 0.02], C.stripe);
  b.box({ x: cx - 0.5, y: 0.45, z }, [1.2, 0.32, 0.8], C.hull, C.boatDeck);
  const mx = cx + 0.45;
  b.beam({ x: mx, y: 0.45, z }, { x: mx, y: 5.4, z }, 0.12, C.mast);
  b.beam({ x: mx, y: 1.35, z }, { x: cx - body / 2 + 0.1, y: 1.45, z }, 0.09, C.mast);
  b.beam({ x: mx - 0.1, y: 1.5, z }, { x: cx - body / 2 + 0.35, y: 1.58, z }, 0.2, C.sail);
  b.beam({ x: mx, y: 5.3, z }, { x: cx + body / 2 + S.width / 2 - 0.1, y: 0.47, z }, 0.035, C.rope);
  b.beam({ x: mx, y: 5.3, z }, { x: cx - body / 2 + 0.05, y: 0.47, z }, 0.035, C.rope);
  // Le pieu d'amarrage, au nord de la proue, et l'amarre.
  const post = { x: cx + body / 2, z: z - S.width / 2 - 0.9 };
  const foot = footAt(post.x, post.z);
  b.box({ x: post.x, y: foot, z: post.z }, [0.22, 1.05 - foot, 0.22], C.pile);
  b.beam({ x: post.x, y: 0.9, z: post.z }, { x: cx + body / 2, y: 0.47, z: z - S.width / 2 + 0.1 }, 0.035, C.rope);
}

/** Les rochers à facettes (le kit commun), sur les rives du bassin et derrière le quai : (dx, dz, rayon, hauteur, graine). */
const ROCKS: readonly (readonly [number, number, number, number, number])[] = [
  [-11.4, 2.2, 0.9, 0.9, 0.3],
  [-10.6, -2.4, 0.7, 0.6, 1.1],
  [-12.2, 9.8, 1.1, 1.0, 0.7],
  [12.9, 6.6, 1.0, 0.9, 0.2],
  [11.6, 11.4, 0.8, 0.7, 1.4],
  [1.9, 15.4, 1.0, 0.8, 0.9],
  [-2.1, 15.7, 0.8, 0.6, 0.4],
  [-5.2, -10.2, 0.9, 0.8, 1.7],
  [9.6, -12.6, 1.1, 1.0, 0.5],
];

function rocks(b: FacetBuilder, f: Vec3): void {
  for (const [dx, dz, r, h, seed] of ROCKS) {
    const x = f.x + dx, z = f.z + dz;
    rock(b, { x, y: footAt(x, z, 0.05), z }, r, h, Math.round(seed * 10));
  }
}
