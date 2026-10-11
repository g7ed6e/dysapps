// Les trois lieux du village de l'île-école du 6e d'Archipéo, dessinés (lot 2 du 6e de la piste 3 « hybride », même style
// que le lot 1 : low poly en aplats francs, sans texture, par le code ; dans l'esprit des bâtiments importés : un toit
// franc, une ouverture sombre, une signature) : l'école et son clocheton à cloche d'or, la salle des trophées (ses
// piliers, son fond de velours, ses socles, son faîte d'or) et la Halle aux matériaux (sa grande porte, son toit à deux
// pans, sa haute potence). De près (l'île où se trouve l'élève) le modèle entier, de 600 à 2 000 triangles ; de loin
// ses volumes, 200 au plus.
//
// Les cubes des lieux (world/terrain/village.ts) restent ceux du monde : Blocland les dessine, la vue simple ne les
// voit pas ; on y entre en les touchant (`place`), et le modèle garde leurs cases (le toucher retrouve la case la plus
// proche, qui porte son lieu). Ce que le modèle laisse en cubes : les trophées gagnés, posés sur les socles (GD-3 : la
// construction les dessine, plus petits que leur case), le bloc suspendu de la Halle et les blocs de sa recette (GD-2),
// et le soubassement de pierre de taille sous un lieu posé sur une marche du sol. Le modèle tient dans l'emprise de ses
// cubes (la règle « trois bandes » se lit sur eux, threeBands.test.ts). Seules les vitres de l'école s'allument la nuit,
// sans clignoter (pas sur une île fermée). Code pur, sans Three.js.
import type { VillagePlaceId, VoxelCube } from '../cube';
import type { BiomeId } from '../../biomes';
import type { ImportedMonument } from '../monumentModels';
import { caseDuLieu } from '../construction/buildings';
import type { CaseDuLieu } from '../architecture/kits';
import { HALLE } from '../terrain/village';
import { estUnePlaceDeTrophee, estUnPilier } from '../trophyHall';
import { Pinceau, type V3 } from '../decor/brush';
import type { ArchipelagoId } from '../map';
import { getArchipelago } from '../archipelago';
import { KITS } from '../architecture';
import { darker, scaleColor, Workshop, type Tint } from './workshop';
import { OBJECT_COLORS as C, type Paint, paintFor } from './pieces';

/** Un cube d'un lieu dans son repère (`caseDuLieu` : x le long de la façade, y vers le fond, z = 1 au-dessus du sol). */
type PlaceCell = Pick<CaseDuLieu, 'x' | 'y' | 'z' | 'w' | 'd' | 'texture'>;

/** Le dessin d'un lieu : dans l'atelier (z = 0 au sol du lieu), avec ses couleurs, ses cubes remplacés, de près ou de loin. */
type PlaceDrawing = (at: Workshop, pe: Paint, cells: readonly PlaceCell[], far: boolean) => void;

/** L'ouverture sombre (la porte, la bouche de la Halle). */
const SHADOW = 0x2a201a;
/** La vitre éteinte d'une fenêtre de côté. */
const UNLIT_GLASS = 0x3e4a52;

/** Le rang du bras de la potence de la Halle (world/terrain/village.ts, `atelierModel`) : le bloc suspendu pend deux rangs plus bas. */
const JIB_ARM_ROW = 6;

/**
 * Une fenêtre sur la façade de devant (y = `yf`, tournée vers −y), centrée en x, de `l` de large, de z0 à z1 : l'appui et
 * le linteau de pierre, la vitre (`lit` : allumée la nuit), la croisée de bois, deux volets ouverts. 46 triangles (26 sans
 * volets).
 */
function frontWindow(at: Workshop, x: number, yf: number, l: number, z0: number, z1: number, stone: Tint, pane: Tint, lit: boolean, shutters: Tint | null): void {
  const [x0, x1] = [x - l / 2, x + l / 2];
  at.box(x0 - 0.08, x1 + 0.08, yf - 0.1, yf + 0.02, z0 - 0.1, z0, stone, {});
  at.box(x0 - 0.06, x1 + 0.06, yf - 0.08, yf + 0.02, z1, z1 + 0.12, stone, {});
  const y = yf - 0.006;
  at.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [x, yf + 1, (z0 + z1) / 2], pane, lit);
  const wood = C.wood;
  const yb = yf - 0.016;
  at.quad([x - 0.03, yb, z0], [x + 0.03, yb, z0], [x + 0.03, yb, z1], [x - 0.03, yb, z1], [x, yf + 1, z0], wood);
  const zm = (z0 + z1) / 2 + 0.05;
  at.quad([x0, yb, zm - 0.03], [x1, yb, zm - 0.03], [x1, yb, zm + 0.03], [x0, yb, zm + 0.03], [x, yf + 1, zm], wood);
  if (!shutters) return;
  for (const s of [-1, 1]) {
    const xa = s < 0 ? x0 - 0.1 : x1 + 0.1;
    at.box(Math.min(xa, xa + s * l * 0.48), Math.max(xa, xa + s * l * 0.48), yf - 0.05, yf, z0, z1, shutters, { bottom: true });
  }
}

/** Une fenêtre sur un pignon ou un flanc (x = `xf`, tournée vers `s` : −1 vers −x, 1 vers +x), centrée en y : appui, vitre éteinte, croisée. 16 triangles. */
function sideWindow(at: Workshop, xf: number, s: -1 | 1, y: number, l: number, z0: number, z1: number, stone: Tint, pane: Tint): void {
  const [y0, y1] = [y - l / 2, y + l / 2];
  const xa = xf + s * 0.07;
  at.box(Math.min(xf, xa), Math.max(xf, xa), y0 - 0.08, y1 + 0.08, z0 - 0.1, z0, stone, {});
  const xv = xf + s * 0.006;
  at.quad([xv, y0, z0], [xv, y1, z0], [xv, y1, z1], [xv, y0, z1], [xf - s, y, z0], pane);
  const xb = xf + s * 0.016;
  at.quad([xb, y - 0.03, z0], [xb, y + 0.03, z0], [xb, y + 0.03, z1], [xb, y - 0.03, z1], [xf - s, y, z0], C.wood);
}

// ---------- L'école ----------

/** Les mesures de l'école (5 × 4 cases, la porte au milieu de la façade, le clocheton au-dessus d'elle). */
const SCHOOL = {
  w: 5,
  d: 4,
  plinth: 0.28,
  walls: { inset: 0.14, upper: 2.92 },
  cornice: { upper: 3.06, overhang: 0.08 },
  roof: { lower: 3.06, ridge: 4.62, thickness: 0.14 },
  belfry: { x: 2.5, y: 1.5, foot: 3.7, deck: 5.15, cap: 5.95, spike: 6.72, finial: 7 },
} as const;

/**
 * L'école : un socle de pierre, les murs de brique, les chaînes d'angle et la corniche de pierre de taille, la porte
 * (ouverture sombre, piédroits et linteau, deux marches), deux fenêtres de devant allumées la nuit avec leurs volets et
 * leurs jardinières, une fenêtre éteinte sur chaque pignon et deux au dos, le toit franc à deux pans dans la couverture de
 * l'île (ses pignons de brique, leur oculus), la cheminée ; le clocheton sur le faîte, au-dessus de la porte : son fût de
 * pierre, quatre poteaux, la cloche d'or évasée, son chapeau en pyramide et l'épi d'or. De loin : le socle, les murs, le
 * toit, la porte, les fenêtres, le clocheton et la cloche.
 */
const school: PlaceDrawing = (at, pe, _cells, far) => {
  const { w, d, plinth, walls, cornice, roof, belfry: k } = SCHOOL;
  const brick = pe.material('brique');
  const dressedStone = pe.material('taille');
  const stone = { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') };
  const gold = pe.material('or');
  const pane = pe.role('lanternGlass');
  const r = walls.inset;
  at.box(0.02, w - 0.02, 0.02, d - 0.02, 0, plinth, stone);
  at.box(r, w - r, r, d - r, plinth, walls.upper, brick, { bottom: true, top: true });
  // La porte : l'ouverture sombre.
  const yd = r - 0.008;
  at.quad([2.18, yd, plinth], [2.82, yd, plinth], [2.82, yd, 1.9], [2.18, yd, 1.9], [2.5, 1, 1], SHADOW);
  if (far) {
    for (const x of [1.5, 3.5]) at.quad([x - 0.3, yd, 1.2], [x + 0.3, yd, 1.2], [x + 0.3, yd, 1.95], [x - 0.3, yd, 1.95], [x, 1, 1.5], pane, true);
    at.roof(0, w, 0, d, roof.lower, roof.ridge, 'x', roof.thickness, pe.roof(), { tint: brick, zFoot: walls.upper });
    at.block(k.x, k.y, 0.76, 0.76, k.foot, k.cap, dressedStone, { bottom: true });
    at.prism(k.x, k.y, 0.24, 0.12, k.deck + 0.1, k.cap - 0.12, 6, gold, 0, true);
    at.prism(k.x, k.y, 0.48 * Math.SQRT2, 0, k.cap, k.spike, 4, pe.roof(), Math.PI / 4);
    return;
  }
  // Les chaînes d'angle : le pilastre, et trois pierres en saillie, une sur deux.
  const a = 0.24;
  for (const [x, y] of [
    [a, a],
    [w - a, a],
    [w - a, d - a],
    [a, d - a],
  ]) {
    at.block(x, y, 0.4, 0.4, plinth, walls.upper, dressedStone, { bottom: true, top: true });
    for (const z of [0.7, 1.55, 2.4]) at.block(x, y, 0.46, 0.46, z, z + 0.32, dressedStone, { bottom: false });
  }
  // Le bandeau au premier étage, la corniche.
  at.box(r - 0.03, w - r + 0.03, r - 0.03, d - r + 0.03, 1.02, 1.1, dressedStone, { bottom: false, top: false });
  at.box(cornice.overhang, w - cornice.overhang, cornice.overhang, d - cornice.overhang, walls.upper, cornice.upper, dressedStone, {});
  // La porte : piédroits, linteau, deux marches.
  for (const x of [2.1, 2.9]) at.block(x, r - 0.02, 0.16, 0.12, plinth, 1.95, dressedStone, { bottom: true, top: true });
  at.box(1.98, 3.02, r - 0.1, r + 0.02, 1.9, 2.14, dressedStone, {});
  at.box(2.06, 2.94, 0.04, r, 0.12, plinth, stone, { bottom: true, py: true });
  at.box(2.12, 2.88, 0.02, 0.09, 0, 0.14, stone, { bottom: true, py: true });
  // Les fenêtres de devant (allumées la nuit), leurs jardinières fleuries.
  const shutters = pe.color(0x4f7a6a);
  for (const x of [1.15, 3.85]) {
    frontWindow(at, x, r, 0.62, 1.25, 2.05, dressedStone, pane, true, shutters);
    at.box(x - 0.36, x + 0.36, 0.01, 0.1, 1.0, 1.15, pe.color(C.lightWood), {});
    for (const dx of [-0.2, 0, 0.2]) at.pyramid(x + dx, 0.055, 0.07, 0.04, 1.15, 1.3, pe.color(dx ? C.leaf : 0xd8576b));
  }
  // Une fenêtre éteinte sur chaque pignon, deux au dos.
  const unlit = pe.color(UNLIT_GLASS);
  sideWindow(at, r, -1, d / 2, 0.6, 1.3, 2.05, dressedStone, unlit);
  sideWindow(at, w - r, 1, d / 2, 0.6, 1.3, 2.05, dressedStone, unlit);
  for (const x of [1.4, 3.6]) {
    const yb = d - r + 0.006;
    at.quad([x - 0.3, yb, 1.3], [x + 0.3, yb, 1.3], [x + 0.3, yb, 2.05], [x - 0.3, yb, 2.05], [x, 0, 1.6], unlit);
    at.box(x - 0.38, x + 0.38, d - r - 0.02, d - r + 0.1, 1.2, 1.3, dressedStone, {});
  }
  // Le toit, ses rangs de tuiles, l'oculus des pignons, la cheminée.
  at.roof(0, w, 0, d, roof.lower, roof.ridge, 'x', roof.thickness, pe.roof(), { tint: brick, zFoot: walls.upper });
  const t = pe.roof();
  const row = { dessus: scaleColor(t.dessus, 0.88), cote: scaleColor(t.cote, 0.88) };
  for (const f of [0.3, 0.55, 0.8])
    for (const [ya, yb] of [
      [0, d / 2],
      [d, d / 2],
    ]) {
      const y = ya + (yb - ya) * f;
      const z = roof.lower + (roof.ridge - roof.lower) * f + 0.012;
      const y2 = y + (yb - ya) * 0.04;
      const z2 = z + (roof.ridge - roof.lower) * 0.04;
      at.quad([0.02, y, z], [w - 0.02, y, z], [w - 0.02, y2, z2], [0.02, y2, z2], [w / 2, d / 2, 0], row);
    }
  for (const [x, s] of [
    [0.06, -1],
    [w - 0.06, 1],
  ] as const) {
    at.standingDisc([x + s * 0.004, d / 2, 3.72], s < 0 ? 'nx' : 'px', 0.24, 8, dressedStone.cote, Math.PI / 8);
    at.standingDisc([x + s * 0.012, d / 2, 3.72], s < 0 ? 'nx' : 'px', 0.16, 8, SHADOW, Math.PI / 8);
  }
  at.block(4.1, 2.9, 0.42, 0.42, 3.6, 4.82, brick, { bottom: true });
  at.block(4.1, 2.9, 0.52, 0.52, 4.82, 4.94, dressedStone, {});
  // Le clocheton : le fût, le plancher, quatre poteaux, la cloche d'or, l'entablement, le chapeau, l'épi.
  at.block(k.x, k.y, 0.76, 0.76, k.foot, k.deck, dressedStone, { bottom: true });
  at.block(k.x, k.y, 0.88, 0.88, k.deck, k.deck + 0.1, dressedStone, {});
  for (const [dx, dy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ])
    at.block(k.x + dx * 0.34, k.y + dy * 0.34, 0.16, 0.16, k.deck + 0.1, k.cap, dressedStone, { bottom: true, top: true });
  at.prism(k.x, k.y, 0.26, 0.2, k.deck + 0.16, k.deck + 0.3, 8, gold, Math.PI / 8, true);
  at.prism(k.x, k.y, 0.2, 0.12, k.deck + 0.3, k.cap - 0.24, 8, gold, Math.PI / 8);
  at.prism(k.x, k.y, 0.04, 0.04, k.cap - 0.24, k.cap - 0.1, 4, pe.color(C.iron), 0, true);
  at.block(k.x, k.y, 0.9, 0.9, k.cap - 0.1, k.cap, dressedStone, {});
  at.prism(k.x, k.y, 0.5 * Math.SQRT2, 0, k.cap, k.spike, 4, pe.roof(), Math.PI / 4);
  at.prism(k.x, k.y, 0.05, 0, k.spike - 0.04, k.finial, 4, gold, Math.PI / 4);
};

// ---------- La salle des trophées ----------

/**
 * La salle des trophées, de sa première colonne bâtie à la dernière (elle grandit d'une travée à la fois, GD-3) : le
 * dallage, les piliers de marbre (base, tore, fût à douze pans, échine, abaque), le fond de velours (ses plis, son galon
 * d'or), les socles de marbre sous les trophées (le dessus juste à la hauteur de leur case, où la construction pose le
 * trophée), l'entablement, le toit franc à deux pans dans la couverture de l'île, le faîte d'or. Ouverte devant. De loin :
 * des piliers carrés, les socles d'un tenant par rangée, le fond, le toit, le faîte.
 */
const trophyRoom: PlaceDrawing = (at, pe, cells, far) => {
  const d = cells[0]?.d ?? 3;
  const x0 = Math.min(...cells.map((c) => c.x));
  const x1 = Math.max(...cells.map((c) => c.x)) + 1;
  const marble = pe.material('marbre');
  const dressedStone = pe.material('taille');
  const velvet = pe.material('velours');
  const gold = pe.material('or');
  const cellsWhere = (f: (c: PlaceCell) => boolean) => cells.filter(f);
  const pillars = new Map<string, [number, number]>();
  for (const c of cellsWhere((c) => c.texture === 'marbre' && c.z <= 3 && estUnPilier(c.x, c.y, d))) pillars.set(`${c.x},${c.y}`, [c.x, c.y]);
  const pedestals = cellsWhere((c) => c.texture === 'marbre' && c.z === 1 && !estUnPilier(c.x, c.y, d));
  const [zSlab, zEntablature, zRoof, zRidge] = [0.12, 2.9, 3.18, 4.2];
  at.box(x0 + 0.02, x1 - 0.02, 0.02, d - 0.02, 0, zSlab, { dessus: dressedStone.dessus, cote: pe.role('yardStone') });
  // Le fond de velours, entre les piliers du fond.
  at.box(x0 + 0.2, x1 - 0.2, d - 0.5, d - 0.16, zSlab, zEntablature, velvet, { bottom: true, top: true });
  if (far) {
    for (const [x, y] of pillars.values()) at.block(x + 0.5, y + 0.5, 0.46, 0.46, zSlab, zEntablature, marble, { bottom: true, top: true });
    // Les socles, d'un tenant par suite de cases voisines d'une même rangée.
    for (const y of [0, 1]) {
      const xs = pedestals.filter((c) => c.y === y).map((c) => c.x).sort((a, b) => a - b);
      for (let i = 0; i < xs.length; ) {
        let j = i;
        while (j + 1 < xs.length && xs[j + 1] === xs[j] + 1) j++;
        at.box(xs[i] + 0.12, xs[j] + 0.88, y + 0.12, y + 0.88, zSlab, 1, marble);
        i = j + 1;
      }
    }
    at.box(x0, x1, 0, d, zEntablature, zRoof, dressedStone, { bottom: false, top: true });
    at.roof(x0, x1, 0, d, zRoof, zRidge, 'x', 0.1, pe.roof(), { tint: dressedStone, zFoot: zRoof });
    at.beam([x0 + 0.1, d / 2, zRidge], [x1 - 0.1, d / 2, zRidge], 0.2, gold);
    return;
  }
  // Les plis du velours, son galon d'or.
  const fold = darker(velvet, 0.82);
  const yv = d - 0.5 - 0.006;
  for (let x = x0 + 0.45; x < x1 - 0.3; x += 0.5) at.quad([x, yv, zSlab], [x + 0.12, yv, zSlab], [x + 0.12, yv, zEntablature - 0.2], [x, yv, zEntablature - 0.2], [x, d, 1], fold.cote);
  at.box(x0 + 0.2, x1 - 0.2, d - 0.53, d - 0.5, zEntablature - 0.2, zEntablature - 0.08, gold, { bottom: false, top: true, py: true });
  // Les piliers.
  for (const [x, y] of pillars.values()) {
    const [cx, cy] = [x + 0.5, y + 0.5];
    at.block(cx, cy, 0.6, 0.6, zSlab, zSlab + 0.14, marble);
    at.prism(cx, cy, 0.27, 0.23, zSlab + 0.14, zSlab + 0.26, 12, marble, 0, true);
    at.prism(cx, cy, 0.2, 0.18, zSlab + 0.26, zEntablature - 0.3, 12, marble, 0, true);
    at.prism(cx, cy, 0.18, 0.28, zEntablature - 0.3, zEntablature - 0.14, 12, marble, 0, true);
    at.block(cx, cy, 0.64, 0.64, zEntablature - 0.14, zEntablature, marble, { top: true });
  }
  // Les socles : plinthe, dé, corniche ; le dessus à la hauteur de la case du trophée.
  for (const c of pedestals) {
    const [cx, cy] = [c.x + 0.5, c.y + 0.5];
    at.block(cx, cy, 0.84, 0.84, zSlab, zSlab + 0.14, marble);
    at.block(cx, cy, 0.68, 0.68, zSlab + 0.14, 0.88, marble, { bottom: true, top: true });
    at.block(cx, cy, 0.8, 0.8, 0.88, 1, { dessus: marble.dessus, cote: pe.role('yardSlab') }, {});
  }
  // L'entablement, sa frise d'or devant, le toit, le faîte d'or et ses deux acrotères.
  at.box(x0, x1, 0, d, zEntablature, zRoof, dressedStone, { top: true });
  at.quad([x0 + 0.1, -0.006, zEntablature + 0.1], [x1 - 0.1, -0.006, zEntablature + 0.1], [x1 - 0.1, -0.006, zEntablature + 0.18], [x0 + 0.1, -0.006, zEntablature + 0.18], [x0, 1, zEntablature], gold.cote);
  at.roof(x0, x1, 0, d, zRoof, zRidge, 'x', 0.12, pe.roof(), { tint: dressedStone, zFoot: zRoof });
  at.beam([x0 + 0.1, d / 2, zRidge], [x1 - 0.1, d / 2, zRidge], 0.2, gold, true);
  for (const x of [x0 + 0.2, x1 - 0.2]) at.pyramid(x, d / 2, 0.16, 0.16, zRidge + 0.06, zRidge + 0.5, gold);
};

// ---------- La Halle aux matériaux ----------

/**
 * La Halle aux matériaux (la halle au fond, la cour devant) : le soubassement de pierre et ses assises, les murs de
 * planches, l'ossature de bois (poteaux, sablières, croix de Saint-André), la grande porte ouverte (sa bouche sombre, ses
 * deux vantaux rabattus), une fenêtre à chaque flanc, le toit franc à deux pans, le faîte en long, le pignon de planches
 * en façade ; la haute potence (son pied de pierre, son mât, son bras, sa jambe de force, la poulie et la corde jusqu'au
 * bloc suspendu, qui reste un bloc, comme ceux de la recette). De loin : la halle, sa porte, son toit, la potence.
 */
const hall: PlaceDrawing = (at, pe, cells, far) => {
  const w = cells[0]?.w ?? 3;
  const d = cells[0]?.d ?? 5;
  const y0 = HALLE.rang;
  const zWall = HALLE.haut;
  const zRidge = zWall + 1.62;
  const arm = Math.max(...cells.filter((c) => c.x === 0 && c.y === 1).map((c) => c.z), JIB_ARM_ROW);
  const zArm = arm - 0.5;
  // Le dessus du bloc suspendu (son rang, `bras − 2`, va de z = bras − 3 à bras − 2 dans ce repère).
  const zBlock = arm - 2;
  const stone = pe.material('pierre');
  const planks = pe.material('planches');
  const wood = pe.color(C.wood);
  const lightWood = pe.color(C.lightWood);
  at.box(0.04, w - 0.04, y0 + 0.04, d - 0.04, 0, 0.95, stone);
  at.box(0.08, w - 0.08, y0 + 0.08, d - 0.08, 0.95, zWall, planks, { bottom: true, top: true });
  const yp = y0 + 0.032;
  at.quad([0.98, yp, 0], [2.02, yp, 0], [2.02, yp, 1.86], [0.98, yp, 1.86], [1.5, d, 1], SHADOW);
  if (far) {
    at.roof(0, w, y0 - 0.15, d, zWall, zRidge, 'y', 0.12, pe.roof(), { tint: planks, zFoot: zWall });
    at.block(0.5, 1.5, 0.26, 0.26, 0, zArm + 0.26, wood, { bottom: true });
    at.box(0.37, 0.63, 0.32, 1.37, zArm, zArm + 0.26, wood, { bottom: false, py: true });
    at.beam([0.5, 0.48, zArm], [0.5, 0.48, zBlock], 0.08, pe.color(C.iron));
    return;
  }
  // Les assises du soubassement, peintes en deux tons sur la façade et les flancs.
  const course = darker(stone, 0.9).cote;
  for (const z of [0.3, 0.62]) {
    at.quad([0.04, y0 + 0.034, z], [0.98, y0 + 0.034, z], [0.98, y0 + 0.034, z + 0.04], [0.04, y0 + 0.034, z + 0.04], [1.5, d, z], course);
    at.quad([2.02, y0 + 0.034, z], [w - 0.04, y0 + 0.034, z], [w - 0.04, y0 + 0.034, z + 0.04], [2.02, y0 + 0.034, z + 0.04], [1.5, d, z], course);
    for (const [x, s] of [
      [0.034, -1],
      [w - 0.034, 1],
    ] as const)
      at.quad([x, y0 + 0.04, z], [x, d - 0.04, z], [x, d - 0.04, z + 0.04], [x, y0 + 0.04, z + 0.04], [x - s, (y0 + d) / 2, z], course);
  }
  // L'ossature : les poteaux d'angle et de porte, les sablières, les croix des pans pleins.
  for (const [x, y] of [
    [0.1, y0 + 0.1],
    [w - 0.1, y0 + 0.1],
    [w - 0.1, d - 0.1],
    [0.1, d - 0.1],
    [0.1, (y0 + d) / 2],
    [w - 0.1, (y0 + d) / 2],
  ])
    at.block(x, y, 0.2, 0.2, 0.9, zWall, wood, { bottom: true, top: true });
  at.box(0.02, w - 0.02, y0 + 0.02, d - 0.02, 0.9, 1.0, wood, { top: false, bottom: false });
  at.box(0.02, w - 0.02, y0 + 0.02, d - 0.02, zWall - 0.1, zWall, wood, { top: true, bottom: false });
  const cross = (a: V3, b: V3) => at.beam(a, b, 0.09, lightWood);
  for (const [x, s] of [
    [0.07, -1],
    [w - 0.07, 1],
  ] as const) {
    for (const [ya, yb] of [
      [y0 + 0.2, (y0 + d) / 2 - 0.1],
      [(y0 + d) / 2 + 0.1, d - 0.2],
    ]) {
      cross([x + s * 0.01, ya, 1.02], [x + s * 0.01, yb, zWall - 0.12]);
      cross([x + s * 0.01, yb, 1.02], [x + s * 0.01, ya, zWall - 0.12]);
    }
  }
  cross([0.2, d - 0.06, 1.02], [w - 0.2, d - 0.06, zWall - 0.12]);
  cross([w - 0.2, d - 0.06, 1.02], [0.2, d - 0.06, zWall - 0.12]);
  // Les chaînes d'angle du soubassement : deux pierres en saillie à chaque coin, une sur deux.
  for (const [x, y] of [
    [0.17, y0 + 0.17],
    [w - 0.17, y0 + 0.17],
    [w - 0.17, d - 0.17],
    [0.17, d - 0.17],
  ])
    for (const [z0, z1] of [
      [0, 0.34],
      [0.56, 0.9],
    ])
      at.block(x, y, 0.34, 0.34, z0, z1, stone, { bottom: true, top: z0 === 0 });
  // Le dedans de la porte : le fond et les joues, sombres, un tas de sacs devant le fond.
  at.box(1.02, 1.98, y0 + 0.03, y0 + 0.9, 0, 1.82, darker({ dessus: SHADOW, cote: SHADOW }, 1.3), { bottom: true, top: true, ny: true });
  at.prism(1.5, y0 + 0.62, 0.3, 0.1, 0, 0.42, 6, darker(planks, 0.6), 0.3);
  // La grande porte : piédroits, linteau, deux vantaux rabattus contre la façade.
  for (const x of [0.9, 2.1]) at.block(x, y0 + 0.02, 0.18, 0.16, 0, 1.94, wood, { bottom: true, top: true });
  at.box(0.78, 2.22, y0 - 0.06, y0 + 0.1, 1.86, 2.02, wood, {});
  for (const [xa, xb] of [
    [0.8, 0.22],
    [2.2, 2.78],
  ]) {
    const v = { dessus: planks.dessus, cote: planks.cote };
    const [l, r] = [Math.min(xa, xb), Math.max(xa, xb)];
    at.box(l, r, y0 - 0.08, y0 - 0.02, 0.05, 1.8, v, { bottom: true });
    at.quad([l + 0.04, y0 - 0.086, 0.3], [r - 0.04, y0 - 0.086, 1.5], [r - 0.04, y0 - 0.086, 1.64], [l + 0.04, y0 - 0.086, 0.44], [(l + r) / 2, d, 1], wood);
  }
  // Une fenêtre à chaque flanc.
  for (const [x, s] of [
    [0.08, -1],
    [w - 0.08, 1],
  ] as const)
    sideWindow(at, x, s, (y0 + d) / 2, 0.5, 1.2, 1.7, wood, pe.color(UNLIT_GLASS));
  // Le toit (un peu de débord sur la cour), ses rangs de bardeaux, le faîte en long, le pignon de planches.
  at.roof(0, w, y0 - 0.15, d, zWall, zRidge, 'y', 0.12, pe.roof(), { tint: planks, zFoot: zWall });
  const t = pe.roof();
  const row = { dessus: scaleColor(t.dessus, 0.88), cote: scaleColor(t.cote, 0.88) };
  for (const f of [0.17, 0.34, 0.5, 0.67, 0.84])
    for (const [xa, xb] of [
      [0, w / 2],
      [w, w / 2],
    ]) {
      const x = xa + (xb - xa) * f;
      const z = zWall + (zRidge - zWall) * f + 0.012;
      const x2 = x + (xb - xa) * 0.05;
      const z2 = z + (zRidge - zWall) * 0.05;
      at.quad([x, y0 - 0.13, z], [x, d - 0.02, z], [x2, d - 0.02, z2], [x2, y0 - 0.13, z2], [w / 2, (y0 + d) / 2, 0], row);
    }
  at.beam([w / 2, y0 - 0.2, zRidge + 0.02], [w / 2, d - 0.02, zRidge + 0.02], 0.16, wood, true);
  at.standingDisc([w / 2, y0 - 0.16, zWall + 0.7], 'ny', 0.18, 6, SHADOW, Math.PI / 6);
  // La potence : le pied de pierre, le mât, le bras vers la cour, la jambe de force, la poulie, la corde, le crochet.
  at.block(0.5, 1.5, 0.52, 0.52, 0, 0.32, stone);
  at.block(0.5, 1.5, 0.26, 0.26, 0.32, zArm + 0.26, wood, { bottom: true });
  at.pyramid(0.5, 1.5, 0.15, 0.15, zArm + 0.26, zArm + 0.42, wood);
  at.box(0.37, 0.63, 0.32, 1.37, zArm, zArm + 0.26, wood, { bottom: false, py: true });
  at.beam([0.5, 1.4, zArm - 0.9], [0.5, 0.8, zArm + 0.02], 0.14, lightWood);
  for (const s of [-1, 1] as const) at.standingDisc([0.5 + s * 0.14, 0.48, zArm - 0.12], s < 0 ? 'nx' : 'px', 0.14, 8, pe.color(C.iron));
  at.block(0.5, 0.48, 0.24, 0.3, zArm - 0.14, zArm, pe.color(C.iron), { top: true });
  at.beam([0.5, 0.48, zArm - 0.14], [0.5, 0.48, zBlock + 0.12], 0.07, pe.color(0xb8a27a));
  at.box(0.38, 0.62, 0.36, 0.6, zBlock, zBlock + 0.12, pe.color(C.iron), {});
  // Les frettes de fer du mât, le rouleau de corde à son pied.
  for (const z of [1.4, zArm - 0.5]) at.block(0.5, 1.5, 0.3, 0.3, z, z + 0.08, pe.color(C.iron), { bottom: false });
  at.prism(0.5, 0.98, 0.2, 0.2, 0, 0.16, 8, pe.color(0xb8a27a), 0, true);
  at.annulus(0.5, 0.98, 0.16, 0.08, 0.2, 8, pe.color(0x9a865e));
  // Les rives des deux pignons, les chéneaux de bois le long des avant-toits.
  for (const y of [y0 - 0.17, d - 0.05]) for (const s of [-1, 1]) at.beam([w / 2 + s * (w / 2 - 0.06), y, zWall - 0.02], [w / 2, y, zRidge + 0.02], 0.1, wood);
  for (const x of [0.06, w - 0.06]) at.beam([x, y0 - 0.15, zWall - 0.06], [x, d, zWall - 0.06], 0.1, lightWood);
};

/** Les lieux dessinés, par lieu. */
const VILLAGE_PLACES: Record<VillagePlaceId, PlaceDrawing> = { school: school, trophies: trophyRoom, assembly: hall };

/** Le cube d'un lieu que son modèle remplace : tout, sauf les trophées (la construction les pose), le bloc suspendu et la recette de la Halle. */
export function replacedByPlace(c: VoxelCube, m: CaseDuLieu): boolean {
  if (c.place === 'trophies') return !estUnePlaceDeTrophee(m.x, m.y, m.z);
  // La halle, le mât de la potence, et son bras (en haut de la colonne de devant, deux cases au-dessus du bloc suspendu).
  if (c.place === 'assembly') return m.y >= HALLE.rang || (m.x === 0 && m.y === 1) || (m.x === 0 && m.y === 0 && m.z >= JIB_ARM_ROW);
  return true;
}


/**
 * Les lieux du village dessinés de ce monde (sur l'île de l'école, `Kit.objetsDessines` : au 6e) : chacun comme un modèle
 * importé qui remplace ses cubes (on y entre toujours en les touchant), de près sur l'île `near`, de loin ailleurs.
 */
export function drawnVillagePlaces(a: ArchipelagoId, cubes: readonly VoxelCube[], near: BiomeId | null = null): ImportedMonument[] {
  const byPlace = new Map<string, { c: VoxelCube; m: CaseDuLieu }[]>();
  for (const c of cubes) {
    if (c.ghost || (c.place !== 'school' && c.place !== 'trophies' && c.place !== 'assembly')) continue;
    const m = caseDuLieu(c);
    if (!m || !replacedByPlace(c, m)) continue;
    const k = `${c.tag}|${c.place}`;
    const l = byPlace.get(k);
    if (l) l.push({ c, m });
    else byPlace.set(k, [{ c, m }]);
  }
  const out: ImportedMonument[] = [];
  for (const [k, l] of byPlace) {
    const [island, place] = k.split('|') as [BiomeId, VillagePlaceId];
    // La Halle d'Archipéo seulement (son toit à deux pans) : la Fabrique de Blocland, à toit plat, garde ses cubes.
    if (place === 'assembly' && !l.some((e) => e.m.texture === 'toit')) continue;
    const { c, m } = l[0];
    const corner = { x: c.x - m.x, y: c.y - m.y, z: c.z - m.z };
    const muted = l.some((e) => e.c.muted);
    const at = new Workshop(new Pinceau(), muted ? null : new Pinceau(), (x, y, z) => [corner.x + x, corner.z + 1 + z, corner.y + y]);
    VILLAGE_PLACES[place](at, paintFor(a, island, muted), l.map((e) => e.m), near !== island);
    out.push({
      id: `lieu:${island}:${place}`,
      stage: 1,
      opaque: at.opaque.fin(),
      fire: at.fire?.fin() ?? new Pinceau().fin(),
      halo: null,
      cellules: l.map((e) => ({ x: e.c.x, y: e.c.y, z: e.c.z })),
      replaced: new Set(l.map((e) => `${e.c.x},${e.c.y},${e.c.z}`)),
    });
  }
  return out;
}

/**
 * Ce que coûtent de plus les lieux dessinés d'un monde vus de près plutôt que de loin (les trois, sur l'île-école) : le
 * budget compte le monde de loin, puis ajoute cet écart (world/budget.ts). 0 sans lieu dessiné (hors du 6e).
 */
export function villagePlacesNearGap(a: ArchipelagoId, cubes: readonly VoxelCube[]): number {
  if (!KITS[a].objetsDessines) return 0;
  const school = getArchipelago(a).school;
  const cost = (near: BiomeId | null) => drawnVillagePlaces(a, cubes, near).reduce((n, m) => n + (m.opaque.positions.length + m.fire.positions.length) / 9, 0);
  return cost(school) - cost(null);
}
