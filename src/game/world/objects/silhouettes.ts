// Les petites constructions à silhouette d'Archipéo, au 6e (piste 3 « hybride » du directeur artistique, choisie par le
// mainteneur le 11 octobre 2026) : chacune a un modèle propre, dessiné par le code, low poly en aplats francs, qu'un
// assemblage de pièces ne sait pas faire : le puits de Tunel (le premier essai, « Top le style »), la grue de Rouxel, la
// boutique de Coco, le lavoir de Nénu, le parasol de Lavi, la pendule de Robin, le tamis de Silex et le nichoir de
// Fougère. De près (l'île où se trouve l'élève), le modèle entier ; de loin (`far`), ses volumes.
//
// Chacune dans le repère de grille de sa forme (world/fixtures.ts : x vers la droite, y vers le fond, z vers le haut, z = 0
// sur le sol), sans en sortir (le toucher prend ses cases). La matière du bloc livré est sur la plus grande face de
// l'objet, dans les couleurs mêmes du bloc (règle GD-7, docs/rendu/style.md) : la brique de la margelle, le madrier de
// la flèche, le bois du comptoir, la pierre des piliers, la cabine de la toile du parasol, le cadran de la tête de la
// pendule, le sable du tamis, le chaume du toit du nichoir. Code pur, sans Three.js.
import { BLOC } from '../../biomes';
import { mixColor } from '../daylight';
import { type Peindre, type Trace, tronconique, type V3 } from '../decor/brush';
import type { Couleur } from '../palette';
import { flatPaint, type Workshop, type Tint } from './workshop';
import { basin, crate, OBJECT_COLORS as C, type Paint } from './pieces';

/** Le dessin d'un objet : dans l'atelier, avec ses couleurs, de près ou de loin. */
export type ObjectDrawing = (at: Workshop, pe: Paint, far: boolean) => void;

// ---------- Le puits de Tunel (la Mine des lettres) ----------

/** Les mesures du puits, en cases, depuis le centre de sa forme (3 × 3) et le sol. */
const WELL_MEASURES = {
  /** Les pans des anneaux de près (douze, comme le concept), et de loin. */
  segments: 12,
  farSegments: 6,
  /** Le lit de pose, au pied : un peu plus large que le mur. */
  foot: { radius: 1.3, upper: 0.18 },
  /** Le mur de brique : son rayon, et ses trois assises (en damier de deux tons de brique : les gros blocs du concept). */
  wall: { radius: 1.22, courses: [0.18, 0.39, 0.6, 0.8] },
  /** La margelle : déborde du mur, son dessus dans la couleur du dessus de la brique ; son rayon intérieur. */
  coping: { radius: 1.32, inner: 0.92, lower: 0.8, upper: 0.94 },
  /** L'eau, sous la margelle ; son liseré clair au bord (comme l'eau en nappe du cœur des îles). */
  water: { upper: 0.72, edge: 0.78 },
  /** Les deux poteaux, de part et d'autre du milieu le long de y (vus à gauche et à droite par la caméra de l'île). */
  posts: { gap: 1.06, side: 0.24, upper: 2.04 },
  /** La poutre sous le faîte, d'un poteau à l'autre. */
  beam: { side: 0.16, lower: 1.92, span: 1.24 },
  /** Le treuil : un rouleau à six pans entre les poteaux. */
  winch: { radius: 0.1, upper: 1.4 },
  /** Le seau de bois, posé sur la margelle entre deux poteaux : son angle autour du puits, ses rayons, sa hauteur. */
  bucket: { angle: -Math.PI / 4, radii: [0.12, 0.16], upper: 0.24 },
  /** La faîtière de bois, posée à cheval sur le faîte : sa demi-largeur et sa hauteur au-dessus du faîte. */
  ridgeCap: { half: 0.09, upper: 0.06 },
  /** Le toit à deux pans, son faîte le long de y : sa demi-largeur, son avant-toit, son faîte, son épaisseur, sa demi-longueur. */
  roof: { half: 0.8, eaves: 1.98, ridge: 2.46, thickness: 0.09, span: 1.4 },
} as const;

/** Le second ton de la brique, en damier sur le mur : la brique des côtés, un peu plus sombre. */
const DARK_BRICK = 0.88;

// Le puits se trace dans le repère de Three de sa forme (X = x, Y = la hauteur, Z = y : `Workshop.trace`), comme au
// premier essai ; son centre en (1,5 ; 1,5), le sol en 0.

const onRingThree = (cx: number, cz: number, r: number, y: number, i: number, n: number): V3 => {
  const a = ((i + 0.5) / n) * Math.PI * 2;
  return [cx + r * Math.cos(a), y, cz + r * Math.sin(a)];
};

function annulus(P: Trace, cx: number, cz: number, y: number, r0: number, r1: number, n: number, paint: Peindre): void {
  for (let i = 0; i < n; i++) P.quad(onRingThree(cx, cz, r0, y, i, n), onRingThree(cx, cz, r0, y, i + 1, n), onRingThree(cx, cz, r1, y, i + 1, n), onRingThree(cx, cz, r1, y, i, n), [cx, y - 1, cz], paint);
}

function flank(P: Trace, cx: number, cz: number, y0: number, y1: number, r: number, n: number, outside: boolean, paint: (i: number) => Peindre): void {
  for (let i = 0; i < n; i++) {
    const m = onRingThree(cx, cz, outside ? r - 0.1 : r + 0.1, (y0 + y1) / 2, i, n);
    const inside: V3 = outside ? [cx, (y0 + y1) / 2, cz] : [2 * m[0] - cx, m[1], 2 * m[2] - cz];
    P.quad(onRingThree(cx, cz, r, y0, i, n), onRingThree(cx, cz, r, y0, i + 1, n), onRingThree(cx, cz, r, y1, i + 1, n), onRingThree(cx, cz, r, y1, i, n), inside, paint(i));
  }
}

function disc(P: Trace, cx: number, cz: number, y: number, r: number, n: number, paint: Peindre): void {
  for (let i = 1; i + 1 < n; i++) P.triangle(onRingThree(cx, cz, r, y, 0, n), onRingThree(cx, cz, r, y, i, n), onRingThree(cx, cz, r, y, i + 1, n), [cx, y - 1, cz], paint);
}

function threeBox(P: Trace, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, paint: Peindre, skip: { top?: boolean; bottom?: boolean } = {}): void {
  const c: V3 = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
  if (!skip.top) P.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], c, paint);
  if (!skip.bottom) P.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], c, paint);
  P.quad([x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], c, paint);
  P.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], c, paint);
  P.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], c, paint);
  P.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], c, paint);
}

/** Le toit à deux pans du puits, son faîte le long de z ; `thick` faux (de loin) : les deux pans seuls. */
function wellRoof(P: Trace, cx: number, cz: number, paint: Peindre, thick: boolean): void {
  const T = WELL_MEASURES.roof;
  const [ya, yf, e] = [T.eaves, T.ridge, T.thickness];
  const ends = [cz - T.span, cz + T.span];
  const upper = (x: number, z: number): V3 => [x, x === cx ? yf : ya, z];
  const lower = (x: number, z: number): V3 => [x, (x === cx ? yf : ya) - e, z];
  const under: V3 = [cx, ya - 1, cz];
  for (const x of [cx - T.half, cx + T.half]) {
    P.quad(upper(x, ends[0]), upper(x, ends[1]), upper(cx, ends[1]), upper(cx, ends[0]), under, paint);
    if (!thick) continue;
    P.quad(lower(x, ends[0]), lower(x, ends[1]), lower(cx, ends[1]), lower(cx, ends[0]), [cx, yf + 1, cz], paint);
    P.quad(upper(x, ends[0]), upper(x, ends[1]), lower(x, ends[1]), lower(x, ends[0]), [cx, ya - e / 2, cz], paint);
  }
  if (!thick) return;
  for (const z of ends) for (const x of [cx - T.half, cx + T.half]) P.quad(upper(x, z), upper(cx, z), lower(cx, z), lower(x, z), [cx, ya, cz], paint);
}

/**
 * Le puits de Tunel : de près, un peu plus de 300 triangles (le lit de pose, le mur de brique en trois assises en
 * damier, la margelle, la paroi intérieure, l'eau et son liseré, les deux poteaux, la poutre, le treuil, le seau posé sur
 * la margelle, le toit et sa faîtière posée à cheval sur le faîte) ; de loin, une cinquantaine (le mur et la margelle à
 * six pans, l'eau, les poteaux et les deux pans du toit).
 */
const well: ObjectDrawing = (at, pe, far) => {
  const P = at.trace;
  const M = WELL_MEASURES;
  const [cx, cz] = [1.5, 1.5];
  const brick = pe.block(BLOC.brique);
  const side = flatPaint(brick.cote);
  const top = flatPaint(brick.dessus);
  const darkSide = flatPaint(mixColor(brick.cote, 0x000000, 1 - DARK_BRICK));
  const v = (c: Couleur) => flatPaint(pe.color(c));
  const p = M.posts;
  if (far) {
    const n = M.farSegments;
    flank(P, cx, cz, 0, M.coping.upper, M.coping.radius, n, true, () => side);
    annulus(P, cx, cz, M.coping.upper, M.coping.inner, M.coping.radius, n, top);
    disc(P, cx, cz, M.water.edge, M.coping.inner, n, v(C.water));
    for (const s of [-1, 1]) threeBox(P, cx - p.side / 2, M.coping.upper, cz + s * p.gap - p.side / 2, cx + p.side / 2, M.roof.eaves, cz + s * p.gap + p.side / 2, v(C.wood), { top: true, bottom: true });
    wellRoof(P, cx, cz, v(C.slate), false);
    return;
  }
  const n = M.segments;
  flank(P, cx, cz, 0, M.foot.upper, M.foot.radius, n, true, () => side);
  annulus(P, cx, cz, M.foot.upper, M.wall.radius, M.foot.radius, n, top);
  const courses = M.wall.courses;
  for (let k = 0; k + 1 < courses.length; k++) flank(P, cx, cz, courses[k], courses[k + 1], M.wall.radius, n, true, (i) => ((i + k) % 2 ? darkSide : side));
  flank(P, cx, cz, M.coping.lower, M.coping.upper, M.coping.radius, n, true, () => side);
  annulus(P, cx, cz, M.coping.upper, M.coping.inner, M.coping.radius, n, top);
  flank(P, cx, cz, M.water.upper, M.coping.upper, M.coping.inner, n, false, () => side);
  const r = M.coping.inner;
  annulus(P, cx, cz, M.water.upper, r * 0.8, r, n, v(C.edge));
  disc(P, cx, cz, M.water.upper, r * 0.8, n, v(C.water));
  for (const s of [-1, 1]) threeBox(P, cx - p.side / 2, M.coping.upper, cz + s * p.gap - p.side / 2, cx + p.side / 2, p.upper, cz + s * p.gap + p.side / 2, v(C.wood), { top: true, bottom: true });
  const q = M.beam;
  threeBox(P, cx - q.side / 2, q.lower, cz - q.span, cx + q.side / 2, q.lower + q.side, cz + q.span, v(C.wood), { top: true });
  const t = M.winch;
  const ends = [cz - p.gap + p.side / 2, cz + p.gap - p.side / 2];
  for (let i = 0; i < 6; i++) {
    const ang = (k: number) => ((k + 0.5) / 6) * Math.PI * 2;
    const pt = (k: number, z: number): V3 => [cx + t.radius * Math.cos(ang(k)), t.upper + t.radius * Math.sin(ang(k)), z];
    P.quad(pt(i, ends[0]), pt(i + 1, ends[0]), pt(i + 1, ends[1]), pt(i, ends[1]), [cx, t.upper, cz], v(C.lightWood));
  }
  const sv = M.bucket;
  const rs = (M.coping.inner + M.coping.radius) / 2;
  const [sx, sz] = [cx + rs * Math.cos(sv.angle), cz + rs * Math.sin(sv.angle)];
  tronconique(P, sx, sz, M.coping.upper, M.coping.upper + sv.upper, sv.radii[0], sv.radii[1], 8, Math.PI / 8, v(C.lightWood), false);
  disc(P, sx, sz, M.coping.upper + sv.upper - 0.04, sv.radii[1] * 0.92, 8, v(C.water));
  wellRoof(P, cx, cz, v(C.slate), true);
  // La faîtière, à cheval sur le faîte : ses deux bandes descendent du dessus du faîte jusque sur les pans (elle ne
  // flotte plus au-dessus d'eux, relecture des essais), fermée à ses deux bouts.
  const T = M.roof;
  const f = M.ridgeCap;
  const yf = T.ridge + f.upper;
  const slope = (T.ridge - T.eaves) / T.half;
  const yb = T.ridge - slope * f.half;
  const wood = v(C.wood);
  for (const s of [-1, 1]) P.quad([cx, yf, cz - T.span], [cx, yf, cz + T.span], [cx + s * f.half, yb, cz + T.span], [cx + s * f.half, yb, cz - T.span], [cx, yb - 1, cz], wood);
  for (const z of [cz - T.span, cz + T.span]) P.triangle([cx - f.half, yb, z], [cx + f.half, yb, z], [cx, yf, z], [cx, yb, cz], wood);
};

// ---------- La grue de Rouxel (la Carrière) ----------

/**
 * La grue : le mât de bois sur son pied de pierre, cerclé de fer, ses deux jambes de force ; la flèche de madrier (la
 * matière livrée : le bloc assemblé du 6e) le long de y, ses deux colliers gris, le contrepoids de pierre sous son talon,
 * le tirant de fer, la poulie, la corde, le crochet, et la caisse de bois posée sous son bout. De loin : le mât, la
 * flèche, le contrepoids et la caisse.
 */
const crane: ObjectDrawing = (at, pe, far) => {
  const wood = pe.color(C.wood);
  const iron = pe.color(C.iron);
  const timber = pe.block(BLOC.poutre);
  const stone = { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') };
  const door = pe.material('porte');
  const [mx, my] = [0.5, 0.5];
  const jib = { x0: 0.33, x1: 0.67, y0: 0.22, y1: 2.96, z0: 2.24, z1: 2.6 };
  if (far) {
    at.block(mx, my, 0.32, 0.32, 0, 2.95, wood, { bottom: true });
    at.box(jib.x0, jib.x1, jib.y0, jib.y1, jib.z0, jib.z1, timber);
    at.block(mx, 0.3, 0.42, 0.36, 1.9, 2.24, stone, { bottom: true, top: true });
    at.box(0.14, 0.86, 2.14, 2.86, 0, 0.78, door);
    return;
  }
  // Le pied, le mât, ses cercles de fer et sa tête.
  at.block(mx, my, 0.72, 0.72, 0, 0.24, stone);
  at.block(mx, my, 0.32, 0.32, 0.24, 2.95, wood, { bottom: true, top: true });
  for (const z of [0.95, 1.7]) at.block(mx, my, 0.38, 0.38, z, z + 0.1, iron, { bottom: true });
  at.pyramid(mx, my, 0.2, 0.2, 2.95, 3.15, pe.color(C.slate));
  // Les jambes de force, du mât au pied (de part et d'autre, le long de x : la flèche part le long de y).
  for (const s of [-1, 1]) at.beam([mx + s * 0.33, my, 0.24], [mx + s * 0.12, my, 1.0], 0.12, wood);
  // La flèche de madrier et ses deux colliers.
  at.box(jib.x0, jib.x1, jib.y0, jib.y1, jib.z0, jib.z1, timber, {});
  const grey = pe.color(0x767e88);
  for (const y of [1.3, 2.6]) at.box(jib.x0 - 0.03, jib.x1 + 0.03, y, y + 0.1, jib.z0 - 0.03, jib.z1 + 0.03, grey, { bottom: true });
  // Le contrepoids de pierre, sous le talon de la flèche, contre le mât.
  at.block(mx, 0.3, 0.44, 0.38, 1.86, 2.24, stone, { bottom: false, py: true });
  // Le tirant, de la tête du mât au bout de la flèche.
  at.beam([mx, my, 2.95], [mx, 2.8, jib.z1], 0.07, iron);
  // La poulie, la corde, le crochet.
  at.roller('x', 0.4, 0.6, 2.78, 2.14, 0.1, 6, iron);
  at.beam([mx, 2.78, 2.04], [mx, 2.78, 1.2], 0.05, pe.color(C.lightWood));
  at.pyramid(mx, 2.78, 0.08, 0.08, 1.2, 1.06, iron);
  // La caisse, sous le bout de la flèche.
  crate(at, 0.14, 0.86, 2.14, 2.86, 0, 0.78, door, { dessus: door.dessus, cote: pe.color(C.lightWood) });
};

// ---------- La boutique de Coco (la Plaine) ----------

/**
 * La boutique : le comptoir de bois (la matière livrée, sa grande face devant), sa planche du dessus et ses deux lattes ;
 * deux poteaux de brique au fond, la poutre de brique qui les relie ; l'auvent rayé crème et brique, penché vers
 * l'avant, son lambrequin, ses deux jambes de force ; trois paniers sur le comptoir. De loin : le comptoir, les poteaux,
 * la poutre et l'auvent.
 */
const boutique: ObjectDrawing = (at, pe, far) => {
  const wood = pe.block(BLOC.bois);
  const brick = pe.block(BLOC.brique);
  const cream = pe.color(C.cream);
  const awning = { x0: 0.04, x1: 2.96, yFront: 0.06, yBack: 1.8, zFront: 1.95, zBack: 2.65, stripes: 6 };
  const stripe = (k: number): Tint => (k % 2 ? brick.cote : cream);
  const awningPoint = (x: number, t: number, dz = 0): [number, number, number] => [x, awning.yFront + (awning.yBack - awning.yFront) * t, awning.zFront + (awning.zBack - awning.zFront) * t + dz];
  if (far) {
    at.box(0.08, 2.92, 0.12, 0.88, 0, 1.0, wood);
    for (const x of [0.5, 2.5]) at.block(x, 1.5, 0.34, 0.34, 0, 2.0, brick, { bottom: true, top: true });
    at.box(0.33, 2.67, 1.33, 1.67, 2.0, 2.32, brick);
    for (let k = 0; k < 2; k++) {
      const [x0, x1] = [awning.x0 + (k * (awning.x1 - awning.x0)) / 2, awning.x0 + ((k + 1) * (awning.x1 - awning.x0)) / 2];
      at.quad(awningPoint(x0, 0), awningPoint(x1, 0), awningPoint(x1, 1), awningPoint(x0, 1), [1.5, 1, 0], k ? brick.cote : cream);
    }
    return;
  }
  // Le comptoir, sa planche, ses lattes.
  at.box(0.08, 2.92, 0.15, 0.85, 0, 0.9, wood, { bottom: true, top: true });
  at.box(0.02, 2.98, 0.08, 0.92, 0.9, 1.0, wood, {});
  const slat = pe.color(C.lightWood);
  for (const x of [0.98, 1.92]) at.quad([x, 0.14, 0.06], [x + 0.1, 0.14, 0.06], [x + 0.1, 0.14, 0.84], [x, 0.14, 0.84], [x + 0.05, 0.5, 0.45], slat);
  // Les poteaux et la poutre de brique.
  for (const x of [0.5, 2.5]) at.block(x, 1.5, 0.34, 0.34, 0, 2.0, brick, { bottom: true, top: true });
  at.box(0.33, 2.67, 1.33, 1.67, 2.0, 2.32, brick, {});
  // L'auvent : six raies, leur dessous, le lambrequin devant, ses deux flancs.
  const e = 0.06;
  const bottom: [number, number, number] = [1.5, 1, 0];
  const top: [number, number, number] = [1.5, 0.6, 4];
  for (let k = 0; k < awning.stripes; k++) {
    const x0 = awning.x0 + (k * (awning.x1 - awning.x0)) / awning.stripes;
    const x1 = awning.x0 + ((k + 1) * (awning.x1 - awning.x0)) / awning.stripes;
    at.quad(awningPoint(x0, 0), awningPoint(x1, 0), awningPoint(x1, 1), awningPoint(x0, 1), bottom, stripe(k));
    at.quad(awningPoint(x0, 0, -e), awningPoint(x1, 0, -e), awningPoint(x1, 1, -e), awningPoint(x0, 1, -e), top, brick.cote);
    // Le lambrequin : une bande qui pend devant, de la couleur de sa raie, en dents.
    const [ya, za] = [awning.yFront, awning.zFront];
    at.tri([x0, ya, za - e], [x1, ya, za - e], [(x0 + x1) / 2, ya, za - 0.26], [(x0 + x1) / 2, 0.6, za], stripe(k));
  }
  for (const x of [awning.x0, awning.x1]) at.quad(awningPoint(x, 0), awningPoint(x, 1), awningPoint(x, 1, -e), awningPoint(x, 0, -e), [1.5, 1, 2.2], brick.cote);
  for (const x of [0.5, 2.5]) at.beam([x, 1.36, 1.7], [x, 0.5, awningPoint(x, (0.5 - awning.yFront) / (awning.yBack - awning.yFront), -e)[2]], 0.09, wood.cote);
  // Trois paniers sur le comptoir : des fruits verts, orangés, rouges.
  const fruits = [pe.color(C.leaf), pe.color(C.ember), pe.color(0xc24a3a)];
  [0.55, 1.5, 2.45].forEach((x, k) => {
    at.prism(x, 0.48, 0.2, 0.23, 1.0, 1.14, 6, pe.color(C.lightWood), Math.PI / 6, true);
    at.prism(x, 0.48, 0.19, 0, 1.12, 1.3, 6, fruits[k], Math.PI / 6);
  });
};

// ---------- Le lavoir de Nénu (la Rivière des fractions) ----------

/**
 * Le lavoir : deux piliers de pierre (la matière livrée, leurs quatre grandes faces) sur leur socle, coiffés d'une
 * corniche ; le bassin de galets, son eau et la pierre à laver penchée sur son bord ; la panne de bois posée sur les
 * piliers et ses deux jambes de force ; le toit en appentis dans la couverture de l'île, qui descend vers l'avant et
 * abrite tout le bassin. De loin : les piliers, le bassin et le toit.
 */
const washhouse: ObjectDrawing = (at, pe, far) => {
  const stone = pe.block(BLOC.pierre);
  const pebble = pe.block(BLOC.galet);
  const roof = pe.roof();
  const wood = pe.color(C.wood);
  const pillars = [0.5, 2.5];
  // Le toit en appentis : de l'avant (y0, bas) au fond (y1, haut), épais de `e`.
  const t = { x0: 0, x1: 3, y0: 0.14, y1: 2, lower: 2.28, upper: 2.84, e: 0.1 };
  const roofZ = (y: number) => t.lower + ((y - t.y0) / (t.y1 - t.y0)) * (t.upper - t.lower);
  const top = (x: number, y: number): [number, number, number] => [x, y, roofZ(y)];
  const bottom = (x: number, y: number): [number, number, number] => [x, y, roofZ(y) - t.e];
  const under: [number, number, number] = [1.5, 1, 0];
  if (far) {
    for (const x of pillars) at.block(x, 1.5, 0.52, 0.52, 0, roofZ(1.5) - t.e, stone, { bottom: true, top: true });
    at.box(0.86, 2.14, 0.12, 1.86, 0, 0.6, pebble);
    at.quad(top(t.x0, t.y0), top(t.x1, t.y0), top(t.x1, t.y1), top(t.x0, t.y1), under, roof);
    return;
  }
  const zPurlin = roofZ(1.62) - t.e;
  for (const x of pillars) {
    at.block(x, 1.5, 0.64, 0.64, 0, 0.2, stone);
    at.block(x, 1.5, 0.52, 0.52, 0.2, zPurlin - 0.36, stone, { bottom: true, top: true });
    at.block(x, 1.5, 0.62, 0.62, zPurlin - 0.36, zPurlin - 0.22, { dessus: stone.dessus, cote: stone.dessus }, {});
  }
  basin(at, pe, 0.86, 2.14, 0.12, 1.88, 0, 0.6, 0.12, pebble, 0.48);
  // La pierre à laver, penchée sur le bord de devant du bassin.
  at.quad([0.98, 0.14, 0.62], [2.02, 0.14, 0.62], [2.02, 0.42, 0.52], [0.98, 0.42, 0.52], [1.5, 0.3, 0], stone.dessus);
  at.quad([0.98, 0.14, 0.62], [2.02, 0.14, 0.62], [2.02, 0.12, 0.54], [0.98, 0.12, 0.54], [1.5, 0.3, 0.5], stone.cote);
  // La panne sur les piliers, sous le toit ; les jambes de force vers l'avant du toit.
  at.box(0.2, 2.8, 1.38, 1.62, zPurlin - 0.22, zPurlin, wood, {});
  for (const x of pillars) at.beam([x, 1.26, zPurlin - 0.7], [x, 0.5, roofZ(0.5) - t.e - 0.02], 0.1, wood);
  // Le toit : son dessus, son dessous, ses quatre rives.
  at.quad(top(t.x0, t.y0), top(t.x1, t.y0), top(t.x1, t.y1), top(t.x0, t.y1), under, roof);
  at.quad(bottom(t.x0, t.y0), bottom(t.x1, t.y0), bottom(t.x1, t.y1), bottom(t.x0, t.y1), [1.5, 1, 5], roof);
  at.quad(top(t.x0, t.y0), top(t.x1, t.y0), bottom(t.x1, t.y0), bottom(t.x0, t.y0), [1.5, 1, roofZ(1)], roof);
  at.quad(top(t.x0, t.y1), top(t.x1, t.y1), bottom(t.x1, t.y1), bottom(t.x0, t.y1), [1.5, 1, roofZ(1)], roof);
  for (const x of [t.x0, t.x1]) at.quad(top(x, t.y0), top(x, t.y1), bottom(x, t.y1), bottom(x, t.y0), [1.5, 1, roofZ(1)], roof);
};

// ---------- Le parasol de Lavi (la Lagune des décimales) ----------

/**
 * Le parasol : un pied rond lesté de pierre, le mât d'obsidienne, la toile à douze pans en deux pentes, ses raies de
 * cabine (la matière livrée) et de crème, son dessous, son volant, la pointe de fer. De loin : le mât et la toile à six
 * pans.
 */
const parasol: ObjectDrawing = (at, pe, far) => {
  const [cx, cy] = [1.5, 1.5];
  const booth = pe.block(BLOC.cabine);
  const cream = pe.color(C.cream);
  const obsidian = pe.block(BLOC.obsidienne);
  const stone = { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') };
  const canvas = { brim: 1.45, middle: 0.8, zBrim: 2.32, zMiddle: 2.72, zTip: 2.92, valance: 0.15 };
  const pt = (r: number, z: number, i: number, n: number): [number, number, number] => {
    const a = (i / n) * Math.PI * 2 + Math.PI / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a), z];
  };
  const stripe = (i: number): Tint => (i % 2 ? cream : booth.dessus);
  if (far) {
    at.prism(cx, cy, 0.09, 0.09, 0, canvas.zBrim, 4, obsidian, Math.PI / 4, true);
    const n = 6;
    for (let i = 0; i < n; i++) at.tri(pt(canvas.brim, canvas.zBrim, i, n), pt(canvas.brim, canvas.zBrim, i + 1, n), [cx, cy, canvas.zTip], [cx, cy, 0], i % 2 ? cream : booth.dessus);
    for (let i = 0; i < n; i++) at.tri(pt(canvas.brim, canvas.zBrim, i, n), pt(canvas.brim, canvas.zBrim, i + 1, n), [cx, cy, canvas.zBrim + 0.25], [cx, cy, 4], booth.cote);
    return;
  }
  at.prism(cx, cy, 0.36, 0.3, 0, 0.18, 8, stone);
  at.prism(cx, cy, 0.09, 0.09, 0.18, canvas.zMiddle, 6, obsidian, 0, true);
  const n = 12;
  const under: [number, number, number] = [cx, cy, 0];
  for (let i = 0; i < n; i++) {
    at.quad(pt(canvas.brim, canvas.zBrim, i, n), pt(canvas.brim, canvas.zBrim, i + 1, n), pt(canvas.middle, canvas.zMiddle, i + 1, n), pt(canvas.middle, canvas.zMiddle, i, n), under, stripe(i));
    at.tri(pt(canvas.middle, canvas.zMiddle, i, n), pt(canvas.middle, canvas.zMiddle, i + 1, n), [cx, cy, canvas.zTip], under, stripe(i));
    // Le dessous, d'un ton de cabine, et le volant qui pend au rebord.
    at.tri(pt(canvas.brim, canvas.zBrim, i, n), pt(canvas.brim, canvas.zBrim, i + 1, n), [cx, cy, canvas.zBrim + 0.3], [cx, cy, 4], booth.cote);
    at.quad(pt(canvas.brim, canvas.zBrim, i, n), pt(canvas.brim, canvas.zBrim, i + 1, n), pt(canvas.brim, canvas.zBrim - canvas.valance, i + 1, n), pt(canvas.brim, canvas.zBrim - canvas.valance, i, n), [cx, cy, canvas.zBrim], stripe(i));
  }
  at.prism(cx, cy, 0.07, 0, canvas.zTip - 0.02, canvas.zTip + 0.12, 4, pe.color(C.iron), 0);
};

// ---------- La pendule de Robin (la Baie des mots) ----------

/**
 * La pendule : un socle de bois mouluré, le corps de cabine et sa fenêtre où se voit le balancier de laiton, la tête de
 * cadran (la matière livrée : sa grande face devant, le cadran crème, les aiguilles et les quatre repères), coiffée d'un
 * fronton dans la couverture de l'île. De loin : le socle, le corps, la tête, le cadran et le fronton.
 */
const clock: ObjectDrawing = (at, pe, far) => {
  const door = pe.material('porte');
  const booth = pe.block(BLOC.cabine);
  const dial = pe.block(BLOC.cadran);
  const iron = pe.color(C.iron);
  const head = { x0: 0.08, x1: 1.92, y0: 0.12, y1: 0.88, z0: 1.9, z1: 2.74 };
  const center = { x: 1, z: (head.z0 + head.z1) / 2 };
  const yd = head.y0 - 0.012;
  // Un disque tourné vers l'avant (−y), en (x, z), de rayon r, à `n` pans.
  const frontDisc = (x: number, z: number, r: number, y: number, n: number, t: Tint) => {
    const p = (i: number): [number, number, number] => [x + r * Math.cos((i / n) * Math.PI * 2), y, z + r * Math.sin((i / n) * Math.PI * 2)];
    for (let i = 1; i + 1 < n; i++) at.tri(p(0), p(i), p(i + 1), [x, y + 1, z], t);
  };
  if (far) {
    at.box(0.1, 1.9, 0.14, 0.86, 0, 0.66, door);
    at.box(0.3, 1.7, 0.24, 0.76, 0.66, head.z0, booth, { bottom: true, top: true });
    at.box(head.x0, head.x1, head.y0, head.y1, head.z0, head.z1, dial);
    frontDisc(center.x, center.z, 0.36, yd, 6, dial.dessus);
    at.roof(0, 2, 0.06, 0.94, head.z1, 3, 'y', 0, pe.roof());
    return;
  }
  // Le socle et sa moulure.
  at.box(0.1, 1.9, 0.14, 0.86, 0, 0.56, door);
  at.box(0.05, 1.95, 0.09, 0.91, 0.56, 0.68, { dessus: door.dessus, cote: door.dessus }, {});
  // Le corps de cabine, sa fenêtre sombre, le balancier.
  at.box(0.3, 1.7, 0.24, 0.76, 0.68, head.z0, booth, { bottom: true, top: true });
  at.quad([0.72, 0.235, 0.84], [1.28, 0.235, 0.84], [1.28, 0.235, 1.74], [0.72, 0.235, 1.74], [1, 0.5, 1.3], iron);
  at.quad([0.97, 0.225, 1.12], [1.03, 0.225, 1.12], [1.03, 0.225, 1.72], [0.97, 0.225, 1.72], [1, 0.5, 1.4], dial.cote);
  frontDisc(1, 1.06, 0.12, 0.222, 6, dial.cote);
  // La tête de cadran, le cadran, les repères, les aiguilles.
  at.box(head.x0, head.x1, head.y0, head.y1, head.z0, head.z1, dial, {});
  frontDisc(center.x, center.z, 0.36, yd, 12, dial.dessus);
  const ym = yd - 0.006;
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    const [rx, rz] = [center.x + Math.cos(a) * 0.29, center.z + Math.sin(a) * 0.29];
    at.quad([rx - 0.03, ym, rz - 0.03], [rx + 0.03, ym, rz - 0.03], [rx + 0.03, ym, rz + 0.03], [rx - 0.03, ym, rz + 0.03], [rx, 1, rz], iron);
  }
  at.quad([center.x - 0.025, ym, center.z], [center.x + 0.025, ym, center.z], [center.x + 0.025, ym, center.z + 0.24], [center.x - 0.025, ym, center.z + 0.24], [center.x, 1, center.z], iron);
  at.quad([center.x, ym, center.z - 0.025], [center.x + 0.18, ym, center.z - 0.025], [center.x + 0.18, ym, center.z + 0.025], [center.x, ym, center.z + 0.025], [center.x, 1, center.z], iron);
  // Le fronton : un petit toit à deux pans, son pignon tourné vers l'avant.
  at.roof(0, 2, 0.06, 0.94, head.z1, 3, 'y', 0.06, pe.roof(), { tint: dial.cote, zFoot: head.z1 });
};

// ---------- Le tamis de Silex (la Fouille) ----------

/**
 * Le tamis : deux poteaux de bois au milieu des bouts de la forme, une traverse de l'un à l'autre, le grand cadre de
 * bois pendu dessous par quatre cordes, le sable (la matière livrée) qui le remplit, et le tas de sable tamisé dessous.
 * De loin : les poteaux, la traverse, le cadre et son sable.
 */
const sieve: ObjectDrawing = (at, pe, far) => {
  const sand = pe.block(BLOC.sable);
  const post = pe.role('yardPost');
  const wood = pe.color(C.lightWood);
  const frame = { x0: 0.06, x1: 2.94, y0: 1.06, y1: 1.94, z0: 0.66, z1: 0.84 };
  if (far) {
    for (const y of [0.5, 2.5]) at.block(1.5, y, 0.22, 0.22, 0, 1.3, post, { bottom: true });
    at.box(1.42, 1.58, 0.5, 2.5, 1.2, 1.32, wood, { bottom: true });
    at.box(frame.x0, frame.x1, frame.y0, frame.y1, frame.z0, frame.z1, { dessus: sand.dessus, cote: wood });
    return;
  }
  for (const y of [0.5, 2.5]) {
    at.block(1.5, y, 0.22, 0.22, 0, 1.32, post, { bottom: true, top: true });
    at.pyramid(1.5, y, 0.11, 0.11, 1.32, 1.42, post);
  }
  at.box(1.42, 1.58, 0.61, 2.39, 1.2, 1.32, wood, { top: false, bottom: false, py: true, ny: true });
  // Le cadre : ses flancs, son rebord, son dessous ; le sable au ras du rebord.
  at.box(frame.x0, frame.x1, frame.y0, frame.y1, frame.z0, frame.z1, wood, { top: true });
  const r = 0.09;
  const [i0, i1, j0, j1] = [frame.x0 + r, frame.x1 - r, frame.y0 + r, frame.y1 - r];
  const z = frame.z1;
  const c: [number, number, number] = [1.5, 1.5, z - 1];
  at.quad([frame.x0, frame.y0, z], [frame.x1, frame.y0, z], [i1, j0, z], [i0, j0, z], c, wood);
  at.quad([frame.x1, frame.y0, z], [frame.x1, frame.y1, z], [i1, j1, z], [i1, j0, z], c, wood);
  at.quad([frame.x1, frame.y1, z], [frame.x0, frame.y1, z], [i0, j1, z], [i1, j1, z], c, wood);
  at.quad([frame.x0, frame.y1, z], [frame.x0, frame.y0, z], [i0, j0, z], [i0, j1, z], c, wood);
  at.quad([i0, j0, z - 0.03], [i1, j0, z - 0.03], [i1, j1, z - 0.03], [i0, j1, z - 0.03], c, sand.dessus);
  // Les cordes, de la traverse aux quatre coins du cadre.
  const rope = pe.color(C.wood);
  for (const [x, y] of [
    [frame.x0 + 0.2, frame.y0 + 0.12],
    [frame.x1 - 0.2, frame.y0 + 0.12],
    [frame.x0 + 0.2, frame.y1 - 0.12],
    [frame.x1 - 0.2, frame.y1 - 0.12],
  ])
    at.beam([1.5, y < 1.5 ? 1.2 : 1.8, 1.2], [x, y, z], 0.05, rope);
  // Le tas de sable tamisé, sous le cadre.
  at.prism(1.5, 1.5, 0.62, 0, 0, 0.44, 8, sand.dessus);
};

// ---------- Le nichoir de Fougère (la Pointe des paysages) ----------

/**
 * Le nichoir : un poteau de bois sur un pied de pierre, la longue maison de bois et ses trois trous ronds, chacun avec
 * son perchoir ; le toit de chaume (la matière livrée : ses deux grands pans) épais, sa faîtière dans la couverture de
 * l'île, ses pignons de bois. De loin : le poteau, la maison et les deux pans de chaume.
 */
const birdhouse: ObjectDrawing = (at, pe, far) => {
  const thatch = pe.block(BLOC.chaume);
  const wood = pe.color(C.lightWood);
  const post = pe.role('yardPost');
  const house = { x0: 0.18, x1: 2.82, y0: 0.22, y1: 0.78, z0: 1.05, z1: 1.72 };
  const roof = { x0: 0.04, x1: 2.96, y0: 0, y1: 1, lower: 1.66, upper: 2.36 };
  if (far) {
    at.block(1.5, 0.5, 0.22, 0.22, 0, house.z0, post, { bottom: true, top: true });
    at.box(house.x0, house.x1, house.y0, house.y1, house.z0, house.z1, wood, { top: true });
    for (const [y0, y1] of [
      [roof.y0, 0.5],
      [0.5, roof.y1],
    ])
      at.quad([roof.x0, y0, y0 === roof.y0 ? roof.lower : roof.upper], [roof.x1, y0, y0 === roof.y0 ? roof.lower : roof.upper], [roof.x1, y1, y1 === roof.y1 ? roof.lower : roof.upper], [roof.x0, y1, y1 === roof.y1 ? roof.lower : roof.upper], [1.5, 0.5, 0], thatch.dessus);
    return;
  }
  at.block(1.5, 0.5, 0.42, 0.42, 0, 0.14, { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') });
  at.block(1.5, 0.5, 0.22, 0.22, 0.14, house.z0, post, { bottom: true, top: true });
  at.box(house.x0, house.x1, house.y0, house.y1, house.z0, house.z1, wood, { top: true });
  // Les trois trous ronds sur la face de devant, et leurs perchoirs.
  const hole = pe.color(C.iron);
  const yt = house.y0 - 0.01;
  for (const x of [0.62, 1.5, 2.38]) {
    const zt = 1.44;
    const p = (i: number): [number, number, number] => [x + 0.13 * Math.cos((i / 6) * Math.PI * 2), yt, zt + 0.13 * Math.sin((i / 6) * Math.PI * 2)];
    for (let i = 1; i < 5; i++) at.tri(p(0), p(i), p(i + 1), [x, 1, zt], hole);
    at.beam([x, house.y0, 1.2], [x, house.y0 - 0.2, 1.2], 0.06, pe.color(C.wood), true);
  }
  // Le toit de chaume, épais, ses pignons de bois sur la maison, sa faîtière.
  at.roof(roof.x0, roof.x1, roof.y0, roof.y1, roof.lower, roof.upper, 'x', 0.16, thatch, { tint: wood, zFoot: house.z1 });
  const ridgeCap = pe.roof();
  at.box(roof.x0, roof.x1, 0.4, 0.6, roof.upper - 0.06, roof.upper + 0.06, ridgeCap, {});
};

/** Les petites constructions à silhouette du 6e, par identifiant (world/fixtures.ts), et leur dessin. */
export const SILHOUETTES: Readonly<Record<string, ObjectDrawing>> = {
  'french-6e-letter-confusion-fixture-1': well,
  'french-6e-word-spelling-fixture-1': crane,
  'maths-6e-calculation-fixture-1': boutique,
  'maths-6e-fractions-fixture-1': washhouse,
  'maths-6e-decimals-fixture-1': parasol,
  'english-6e-vocabulary-fixture-1': clock,
  'history-6e-antiquity-fixture-1': sieve,
  'life-earth-sciences-6e-living-world-fixture-1': birdhouse,
};
