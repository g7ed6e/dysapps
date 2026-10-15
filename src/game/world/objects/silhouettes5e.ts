// Les petites constructions à silhouette d'Archipéo, au 5e (lot 2 des objets du 5e, intention du directeur artistique du
// 11 octobre 2026) : les formes que les pièces du 6e ne savent pas faire, chacune un modèle propre dessiné par le code, low
// poly en aplats francs, comme celles du 6e (./silhouettes.ts) : la cabane de Frimas, la salière de Rabot, la tente de
// Pudding et le four à pain de Vélin. Le poteau indicateur de Sema est une pièce (./pieces.ts, `signpost`), posée par
// ./assemblies.ts. Trapues, rien sous 0,15 case, rien d'ajouré, rien à lire ; de près (l'île où se trouve l'élève), le
// modèle entier ; de loin (`far`), ses volumes.
//
// Chacune dans le repère de grille de sa forme (world/fixtures.ts : x vers la droite, y vers le fond, z vers le haut,
// z = 0 sur le sol), sans en sortir. La matière du bloc livré est sur la plus grande face, dans les couleurs mêmes du bloc
// (règle GD-7) : la tuile du toit de la cabane et du dôme du four, le sel du corps de la salière, la toile des pans de la
// tente. Code pur, sans Three.js.
import { BLOC } from '../../biomes';
import type { Faces } from '../palette';
import { OBJECT_COLORS as C, type Paint } from './pieces';
import type { ObjectDrawing } from './silhouettes';
import type { Workshop } from './workshop';

/** La pierre des objets : la dalle claire dessus, la pierre sombre du phare sur les côtés. */
const stoneOf = (pe: Paint): Faces => ({ dessus: pe.role('yardSlab'), cote: pe.role('yardStone') });

// ---------- La cabane de Frimas (le Glacier des relatifs) ----------

/** Les mesures de la cabane (deux cases sur deux) : le soubassement, les murs de planches, le toit de tuiles qui déborde. */
const CABIN = {
  plinth: { x0: 0.08, x1: 1.92, y0: 0.18, y1: 1.82, upper: 0.16 },
  walls: { x0: 0.12, x1: 1.88, y0: 0.24, y1: 1.76, upper: 1.26 },
  roof: { x0: 0, x1: 2, y0: 0.02, y1: 1.98, lower: 1.18, upper: 2.3, thickness: 0.16 },
  chimney: { x: 1.46, y: 1.34, side: 0.38, lower: 1.5, upper: 2.74 },
} as const;

/** Le pignon d'une cabane sans épaisseur de toit (de loin) : le triangle sous le faîte, à chaque bout. */
function farGables(at: Workshop, x: number, t: Faces): void {
  const { walls: w, roof: r } = CABIN;
  const mid = (r.y0 + r.y1) / 2;
  at.tri([x, w.y0, w.upper], [x, w.y1, w.upper], [x, mid, r.upper], [1, mid, w.upper], t);
}

/**
 * La cabane : le soubassement de pierre, les murs de planches bas, la porte sombre et son linteau, la fenêtre sombre, ses
 * deux volets et son appui, le seuil de pierre ; le toit de tuiles livrées (ses deux grands pans) épais et débordant, son
 * faîte le long de x, ses pignons de planches ; la cheminée de pierre trapue et sa dalle. De loin : les murs, les deux
 * pans, les pignons, la cheminée et la porte.
 */
const cabin: ObjectDrawing = (at, pe, far) => {
  const tile = pe.block(BLOC.tuile);
  const planks = pe.material('planches');
  const stone = stoneOf(pe);
  const { plinth: p, walls: w, roof: r, chimney: k } = CABIN;
  const shadow = pe.color(C.shadow);
  const door = { x0: 0.4, x1: 0.86, upper: 1.0 };
  const yd = w.y0 - 0.008;
  if (far) {
    at.box(w.x0, w.x1, w.y0, w.y1, 0, w.upper, planks, { bottom: true, top: true });
    at.roof(r.x0, r.x1, r.y0, r.y1, r.lower, r.upper, 'x', 0, tile);
    for (const x of [w.x0, w.x1]) farGables(at, x, planks);
    at.block(k.x, k.y, k.side, k.side, k.lower, k.upper, stone, { bottom: true });
    at.quad([door.x0, yd, 0], [door.x1, yd, 0], [door.x1, yd, door.upper], [door.x0, yd, door.upper], [0.6, 1, 0.5], shadow);
    return;
  }
  at.box(p.x0, p.x1, p.y0, p.y1, 0, p.upper, stone);
  at.box(w.x0, w.x1, w.y0, w.y1, p.upper, w.upper, planks, { bottom: true, top: true });
  // La porte, son linteau, le seuil.
  at.quad([door.x0, yd, p.upper], [door.x1, yd, p.upper], [door.x1, yd, door.upper], [door.x0, yd, door.upper], [0.6, 1, 0.5], shadow);
  at.box(door.x0 - 0.06, door.x1 + 0.06, w.y0 - 0.06, w.y0, door.upper, door.upper + 0.15, pe.color(C.wood), {});
  at.box(door.x0 - 0.04, door.x1 + 0.04, 0.02, p.y0, 0, 0.12, stone);
  // La fenêtre, ses volets, son appui.
  const win = { x0: 1.14, x1: 1.54, lower: 0.56, upper: 0.96 };
  at.quad([win.x0, yd, win.lower], [win.x1, yd, win.lower], [win.x1, yd, win.upper], [win.x0, yd, win.upper], [1.34, 1, 0.76], shadow);
  const shutter = pe.color(C.lightWood);
  for (const [x0, x1] of [
    [win.x0 - 0.2, win.x0],
    [win.x1, win.x1 + 0.2],
  ])
    at.quad([x0, yd, win.lower], [x1, yd, win.lower], [x1, yd, win.upper], [x0, yd, win.upper], [(x0 + x1) / 2, 1, 0.76], shutter);
  at.box(win.x0 - 0.04, win.x1 + 0.04, w.y0 - 0.08, w.y0, win.lower - 0.08, win.lower, stone, {});
  // Le toit de tuiles, épais, qui déborde des murs ; ses pignons de planches.
  at.roof(r.x0, r.x1, r.y0, r.y1, r.lower, r.upper, 'x', r.thickness, tile, { tint: planks, zFoot: w.upper });
  // La cheminée, trapue, et sa dalle.
  at.block(k.x, k.y, k.side, k.side, k.lower, k.upper, stone, { bottom: true, top: true });
  at.block(k.x, k.y, k.side + 0.1, k.side + 0.1, k.upper, k.upper + 0.12, stone, {});
};

// ---------- La salière de Rabot (la Menuiserie des objets) ----------

/** Les mesures de la salière (une case, quatre de haut) : le pied, le corps à huit pans au ventre renflé, la collerette, la tête bombée. */
const SHAKER = {
  foot: { radius: 0.4, upper: 0.16 },
  body: [
    [0.16, 0.32],
    [1.3, 0.44],
    [2.1, 0.44],
    [3.0, 0.3],
  ],
  collar: { radius: 0.38, upper: 3.14 },
  head: [
    [3.14, 0.34],
    [3.46, 0.3],
    [3.7, 0.18],
  ],
  dots: { radius: 0.05, from: 0.09 },
} as const;

/**
 * La salière : le pied de pierre, le corps de sel livré (sa grande face) à huit pans, au ventre renflé, la collerette de
 * pierre, la tête bombée dans la couverture de l'île, ses trois points sombres peints dessus. De loin : le corps à six
 * pans, la collerette et la tête en pointe.
 */
const saltShaker: ObjectDrawing = (at, pe, far) => {
  const salt = pe.block(BLOC.sel);
  const stone = stoneOf(pe);
  const head = pe.roof();
  const [cx, cy] = [0.5, 0.5];
  const n = far ? 6 : 8;
  const S = SHAKER;
  if (far) {
    at.prism(cx, cy, S.body[0][1], S.body[1][1], 0, S.body[1][0], n, salt, Math.PI / n, true);
    at.prism(cx, cy, S.body[1][1], S.body[3][1], S.body[1][0], S.body[3][0], n, salt, Math.PI / n, true);
    at.prism(cx, cy, S.collar.radius, S.collar.radius, S.body[3][0], S.collar.upper, n, stone);
    at.prism(cx, cy, S.head[0][1], 0, S.collar.upper, S.head[2][0], n, head);
    return;
  }
  at.prism(cx, cy, S.foot.radius, S.foot.radius, 0, S.foot.upper, n, stone, Math.PI / n, true);
  at.annulus(cx, cy, S.foot.upper, S.body[0][1], S.foot.radius, n, stone);
  for (let i = 0; i + 1 < S.body.length; i++) at.prism(cx, cy, S.body[i][1], S.body[i + 1][1], S.body[i][0], S.body[i + 1][0], n, salt, Math.PI / n, true);
  at.prism(cx, cy, S.collar.radius, S.collar.radius, S.body[3][0], S.collar.upper, n, stone, Math.PI / n, true);
  at.annulus(cx, cy, S.collar.upper, S.head[0][1], S.collar.radius, n, stone);
  at.prism(cx, cy, S.head[0][1], S.head[1][1], S.head[0][0], S.head[1][0], n, head, Math.PI / n, true);
  at.prism(cx, cy, S.head[1][1], S.head[2][1], S.head[1][0], S.head[2][0], n, head);
  // Les trois points sombres, peints sur le dessus de la tête.
  const z = S.head[2][0] + 0.004;
  for (let k = 0; k < 3; k++) {
    const a = Math.PI / 2 + (k * Math.PI * 2) / 3;
    at.disc(cx + S.dots.from * Math.cos(a), cy + S.dots.from * Math.sin(a), z, S.dots.radius, 6, pe.color(C.shadow));
  }
};

// ---------- La tente de Pudding (le Comptoir) ----------

/** Les mesures de la tente (trois cases sur deux, deux de haut) : ses deux pans de toile, le faîte le long de y, l'entrée. */
const TENT = {
  canvas: { x0: 0.24, x1: 2.76, y0: 0.08, y1: 1.92, lower: 0.06, upper: 1.86, thickness: 0.06 },
  pole: { side: 0.18, upper: 2.0, ys: [0.12, 1.88] },
  entrance: { half: 0.42, upper: 1.18 },
  pegs: [
    [0.1, 0.34],
    [2.9, 0.34],
    [0.1, 1.66],
    [2.9, 1.66],
  ],
} as const;

/**
 * La tente : deux pans de toile livrée (ses grandes faces) jusqu'au sol, le faîte le long de y, les pignons de toile,
 * l'entrée triangulaire sombre et ses deux rabats, le mât épais devant et derrière, leur tête, la perche du faîte, quatre
 * piquets épais aux coins. De loin : les deux pans, les pignons, l'entrée et le mât de devant.
 */
const tent: ObjectDrawing = (at, pe, far) => {
  const canvas = pe.block(BLOC.toile);
  const wood = pe.color(C.wood);
  const T = TENT;
  const c = T.canvas;
  const r = (c.x1 - c.x0) * 0.06;
  const yFront = c.y0 + r - 0.006;
  const mid = (c.x0 + c.x1) / 2;
  const shadow = pe.color(C.shadow);
  const entrance = () => at.tri([mid - T.entrance.half, yFront, 0], [mid + T.entrance.half, yFront, 0], [mid, yFront, T.entrance.upper], [mid, 1, 0.4], shadow);
  if (far) {
    at.roof(c.x0, c.x1, c.y0, c.y1, c.lower, c.upper, 'y', 0, canvas);
    for (const y of [c.y0, c.y1]) at.tri([c.x0, y, c.lower], [c.x1, y, c.lower], [mid, y, c.upper], [mid, 1, 0.5], canvas.cote);
    entrance();
    at.block(mid, T.pole.ys[0], T.pole.side, T.pole.side, 0, T.pole.upper, wood, { bottom: true, top: true });
    return;
  }
  at.roof(c.x0, c.x1, c.y0, c.y1, c.lower, c.upper, 'y', c.thickness, canvas, { tint: canvas, zFoot: c.lower });
  entrance();
  // Les rabats, roulés de part et d'autre de l'entrée.
  for (const s of [-1, 1]) {
    const x = mid + s * T.entrance.half;
    at.tri([x, yFront - 0.004, 0], [x + s * 0.2, yFront - 0.004, 0], [mid + s * 0.1, yFront - 0.004, T.entrance.upper - 0.1], [mid, 1, 0.4], canvas.cote);
  }
  // Les mâts et leur tête, la perche du faîte.
  for (const y of T.pole.ys) {
    at.block(mid, y, T.pole.side, T.pole.side, 0, T.pole.upper, wood, { bottom: true, top: true });
    at.pyramid(mid, y, 0.11, 0.11, T.pole.upper, T.pole.upper + 0.1, wood);
  }
  at.beam([mid, T.pole.ys[0], c.upper + 0.05], [mid, T.pole.ys[1], c.upper + 0.05], 0.15, pe.color(C.lightWood));
  // Les piquets.
  for (const [x, y] of T.pegs) at.block(x, y, 0.16, 0.16, 0, 0.22, wood);
};

// ---------- Le four à pain de Vélin (le Bourg des chroniques) ----------

/** Les mesures du four (deux cases sur deux) : le socle carré de pierre, le dôme bas, la bouche, le conduit au fond. */
const OVEN = {
  base: { x0: 0.06, x1: 1.94, y0: 0.06, y1: 1.94, upper: 0.5 },
  dome: {
    cx: 1,
    cy: 1.06,
    rings: [
      [0.5, 0.86],
      [0.8, 0.8],
      [1.12, 0.56],
      [1.34, 0],
    ],
  },
  mouth: { x0: 0.64, x1: 1.36, y0: 0.1, y1: 0.36, upper: 1.04, half: 0.24, spring: 0.8, crown: 0.95 },
  flue: { x: 1.42, y: 1.52, side: 0.36, lower: 0.9, upper: 1.76 },
} as const;

/**
 * Le four à pain : le socle carré de pierre, le lit de pierre au pied du dôme, le dôme bas de tuile livrée (sa grande
 * face) à huit pans, l'encadrement de pierre de la bouche devant, la bouche sombre en arc, le conduit trapu au fond et sa
 * dalle. De loin : le socle, le dôme à six pans, la bouche et le conduit.
 */
const breadOven: ObjectDrawing = (at, pe, far) => {
  const tile = pe.block(BLOC.tuile);
  const stone = stoneOf(pe);
  const { base: b, dome: d, mouth: m, flue: f } = OVEN;
  const n = far ? 6 : 8;
  const rot = Math.PI / n;
  const shadow = pe.color(C.shadow);
  const yd = m.y0 - 0.006;
  at.box(b.x0, b.x1, b.y0, b.y1, 0, b.upper, stone);
  if (far) {
    at.prism(d.cx, d.cy, d.rings[0][1], d.rings[2][1], d.rings[0][0], d.rings[2][0], n, tile, rot, true);
    at.prism(d.cx, d.cy, d.rings[2][1], 0, d.rings[2][0], d.rings[3][0], n, tile, rot);
    at.quad([m.x0, yd, b.upper], [m.x1, yd, b.upper], [m.x1, yd, m.upper], [m.x0, yd, m.upper], [1, 1, 0.7], shadow);
    at.block(f.x, f.y, f.side, f.side, f.lower, f.upper, stone, { bottom: true });
    return;
  }
  at.prism(d.cx, d.cy, d.rings[0][1] + 0.05, d.rings[0][1] + 0.05, b.upper, b.upper + 0.08, n, stone, rot, true);
  for (let i = 0; i + 1 < d.rings.length; i++) at.prism(d.cx, d.cy, d.rings[i][1], d.rings[i + 1][1], d.rings[i][0] + (i ? 0 : 0.08), d.rings[i + 1][0], n, tile, rot, true);
  // L'encadrement de la bouche, et la bouche en arc.
  at.box(m.x0, m.x1, m.y0, m.y1, b.upper, m.upper, stone, {});
  const [x0, x1] = [1 - m.half, 1 + m.half];
  at.quad([x0, yd, b.upper], [x1, yd, b.upper], [x1, yd, m.spring], [x0, yd, m.spring], [1, 1, 0.7], shadow);
  at.tri([x0, yd, m.spring], [x1, yd, m.spring], [1, yd, m.crown], [1, 1, 0.8], shadow);
  // Le conduit et sa dalle.
  at.block(f.x, f.y, f.side, f.side, f.lower, f.upper, stone, { bottom: true, top: true });
  at.block(f.x, f.y, f.side + 0.1, f.side + 0.1, f.upper, f.upper + 0.1, stone, {});
};

/** Les petites constructions à silhouette du 5e, par identifiant (world/fixtures.ts), et leur dessin. */
export const SILHOUETTES_5E: Readonly<Record<string, ObjectDrawing>> = {
  'maths-5e-signed-numbers-fixture-1': cabin,
  'technology-5e-design-fixture-1': saltShaker,
  'english-5e-vocabulary-fixture-2': tent,
  'history-5e-middle-ages-fixture-2': breadOven,
};
