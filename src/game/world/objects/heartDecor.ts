// Le décor du cœur des îles du 6e d'Archipéo, dessiné (lot 2 du 6e de la piste 3 « hybride » du directeur artistique,
// choisie par le mainteneur le 11 octobre 2026, même style que le lot 1 : low poly en aplats francs, sans texture, par
// le code). Les cubes du cœur (world/decor.ts, `DECOR`) restent ceux du monde : Blocland les dessine, la vue simple ne
// les voit pas ; la construction d'Archipéo remplace chaque ensemble par un objet lisible, comme un modèle importé (le
// toucher retrouve ses cases) : l'entrée de galerie de la Mine des lettres (le grand bloc sombre), le tas de sable de la
// Carrière, les gerbes du champ de la Ferme et ses poteaux, les deux rangées du boulier et la borne de brique de la
// Plaine, la mare et les galets de la Rivière, le volcan et les éclats d'obsidienne de la Lagune, la cabine, le
// réverbère et la caisse de la Baie, la tour de l'Horloge et son rouage de cadrans, le sol de mosaïque et le tas de
// fouille de la Fouille, les bottes de chaume et la borne de la Pointe, la touffe de fougères de la Vallée, le tas de
// galets du Laboratoire, les cartons du Hangar, la craie du Préau. Restent les formes communes du décor (world/
// architecture/heart.ts) : les rochers de pierre (la Mine, et une pierre sur presque chaque île) et le petit arbre de la
// Rivière, déjà des objets. Chaque ensemble : de 12 à 150 triangles, le même dessin de près et de loin.
//
// Un ensemble se lit dans la grille du décor (`DECOR`, avant la marge du cœur, `LAYOUT_PAD`) : ses colonnes, et le
// nombre de cubes que le décor y pose. Il n'est dessiné que si tous ses cubes sont là (un cube que le décor n'a pas pu
// poser, sous un lieu ou le Gardien, laisse l'ensemble en cubes). Il se dessine dans son repère (x vers la droite, y
// vers le fond, z vers le haut, z = 0 sous son cube le plus bas), tourné avec l'île (GD-9), chaque colonne posée sur
// son sol (`ground`). Rien ne s'allume (le réverbère du cœur reste éteint, docs/rendu/style.md), rien ne bouge. Code pur,
// sans Three.js.
import type { VoxelCube } from '../cube';
import { type BiomeId, BIOMES } from '../../biomes';
import { DECOR } from '../decor';
import { type ArchipelagoId, islandDef } from '../map';
import type { ImportedMonument } from '../monumentModels';
import { turnCell, turnPoint } from '../placement';
import { LAYOUT_PAD, origineDe } from '../terrain/base';
import { apartFromGhost, LANTERNE_DE_COUR } from '../architecture';
import { batimentsDe, coursDe } from '../construction/buildings';
import { Pinceau, type V3 } from '../decor/brush';
import type { Faces } from '../palette';
import { TEXTURE_KINDS, type TextureKind } from '../pixels';
import { darker, scaleColor, Workshop, type Tint } from './workshop';
import { milestone, crate, OBJECT_COLORS as C, pebble, sheaf, type Paint, paintFor, tableOnLegs, fencePost, heap } from './pieces';

/** Un cube d'un ensemble, dans son repère : sa case, et sa matière. */
interface HeartCell {
  x: number;
  y: number;
  z: number;
  /** La matière du cube (`null` : un cube sans texture). */
  texture: TextureKind | null;
}

const TEXTURES = new Set<string>(TEXTURE_KINDS);
const isTextureKind = (t: string | undefined): t is TextureKind => t !== undefined && TEXTURES.has(t);

/** Ce qu'un dessin du cœur lit : ses cubes, et le sol de chaque colonne (0 sous la plus basse). */
interface HeartGroup {
  cells: readonly HeartCell[];
  ground: (x: number, y: number) => number;
}

/** Le dessin d'un ensemble du cœur. */
type HeartDrawing = (at: Workshop, pe: Paint, e: HeartGroup) => void;

/** Un ensemble du décor d'un cœur : son nom, ses colonnes dans la grille du décor (`DECOR`), son dessin. */
export interface HeartDecor {
  name: string;
  columns: readonly (readonly [number, number])[];
  drawing: HeartDrawing;
}


/** L'ouverture sombre (la galerie, la fente) : le brun le plus sombre du décor. */
const SHADOW = 0x2a201a;

/**
 * Les couleurs propres au décor du cœur, pour qu'un objet se détache de son sol (au moins 3:1 en luminance, sans lueur) :
 * le sable mouillé, ocre, du tas de la Carrière posé sur le sable ; le gris chaud des galets du Laboratoire (ni la pierre
 * des rochers communs, ni le galet) ; la crème de la cabine de la Baie, posée sur le sol rouge, et ses vitres d'un gris
 * bleuté qui se lisent contre elle.
 */
const HEART_COLORS = {
  wetSand: { dessus: 0xa06c38, cote: 0x855a2e },
  warmPebble: 0xa39e92,
  boothGlass: 0xb9c9c6,
  boothBand: 0xfbf6ea,
} as const;

// ---------- La Mine des lettres ----------

/**
 * L'entrée de la galerie (deux cases de large, deux de haut : le grand bloc sombre des captures) : la butte de roche, son
 * sommet en croupe, le cadre de boisage (deux montants, le chapeau), la bouche noire, deux blocs tombés au pied, le
 * wagonnet à la sortie. Tournée vers la caméra (−y).
 */
const mineEntrance: HeartDrawing = (at, pe) => {
  const stone = pe.material('pierre');
  const rock = darker(stone, 0.8);
  at.box(0.04, 1.96, 0.42, 0.98, 0, 0.95, rock);
  at.pyramid(1, 0.7, 0.96, 0.28, 0.95, 1.98, rock);
  // Les épaules de la butte, de chaque côté du cadre.
  at.prism(0.2, 0.62, 0.28, 0.08, 0, 0.9, 5, stone, 0.4);
  at.prism(1.82, 0.66, 0.26, 0.06, 0, 0.75, 5, stone, 1.1);
  // La bouche, et le cadre de boisage.
  at.quad([0.56, 0.41, 0], [1.44, 0.41, 0], [1.44, 0.41, 1.36], [0.56, 0.41, 1.36], [1, 1, 0.7], SHADOW);
  const wood = pe.material('tronc');
  for (const x of [0.45, 1.55]) at.block(x, 0.36, 0.22, 0.22, 0, 1.42, wood, { bottom: true, top: true });
  at.box(0.26, 1.74, 0.24, 0.48, 1.42, 1.66, { dessus: wood.dessus, cote: pe.color(C.lightWood) }, {});
  // Le wagonnet, sorti devant la bouche : sa caisse de fer, son chargement de roche.
  const iron = pe.color(C.iron);
  at.box(0.72, 1.28, 0.04, 0.36, 0.08, 0.42, iron, {});
  at.pyramid(1, 0.2, 0.22, 0.12, 0.42, 0.56, rock);
};

// ---------- La Carrière des mots ----------

/** Le sable mouillé de la Carrière, sous le voile de l'archipel. */
const wetSand = (pe: Paint): Faces => ({ dessus: pe.color(HEART_COLORS.wetSand.dessus), cote: pe.color(HEART_COLORS.wetSand.cote) });

/**
 * Le tas de sable de la Carrière (trois cases sur trois, deux de haut au milieu) : un grand tas à huit pans, un petit
 * contre le coin plus bas, la pelle plantée ; en sable mouillé, ocre, pour se détacher du sable de l'île.
 */
const sandHeap: HeartDrawing = (at, pe, e) => {
  const sand = wetSand(pe);
  const z = e.ground(1, 1);
  heap(at, 1.5, 1.5, z, 1.45, 1.9, sand);
  if (e.ground(0, 0) < z) heap(at, 0.62, 0.62, e.ground(0, 0), 0.5, z - e.ground(0, 0) + 0.3, sand, 6);
  shovel(at, pe, [2.05, 1.2, z + 1.0], [2.45, 0.88, z + 1.9]);
};

/** Une pelle plantée : le manche de bois du fer `lower` à la poignée `upper`, le fer en tôle sombre enfoncé. 18 triangles. */
function shovel(at: Workshop, pe: Paint, lower: V3, upper: V3): void {
  at.beam(lower, upper, 0.1, pe.color(C.lightWood));
  at.box(lower[0] - 0.13, lower[0] + 0.13, lower[1] - 0.05, lower[1] + 0.05, lower[2] - 0.3, lower[2], pe.color(C.iron), {});
}

/**
 * Un petit tas de sable seul : en sable mouillé à la Carrière (sur le sable de l'île), en sable sur l'herbe de la
 * Fouille, sa truelle à côté.
 */
const smallHeap =
  (site: 'quarry' | 'dig'): HeartDrawing =>
  (at, pe) => {
    heap(at, 0.5, 0.5, 0, 0.46, 0.62, site === 'quarry' ? wetSand(pe) : pe.material('sable'), 6);
    if (site === 'dig') shovel(at, pe, [0.78, 0.3, 0.32], [0.98, 0.12, 0.72]);
  };

// ---------- La Ferme des accords ----------

/** La paille plus chaude de la tête d'une gerbe : ses rouge et vert relevés de 8 %, son bleu gardé. */
const warmer = (c: number): number => (scaleColor(c & 0xffff00, 1.08) & 0xffff00) | (c & 0xff);

/** Le champ de blé : une gerbe de paille liée par case de blé, chacune sur son sol, la tête d'épis d'un ton plus chaud. */
const wheatField: HeartDrawing = (at, pe, e) => {
  const straw = pe.role('paille');
  const foot: Faces = { dessus: straw, cote: scaleColor(straw, 0.84) };
  const head: Faces = { dessus: warmer(foot.dessus), cote: warmer(foot.cote) };
  const tie = pe.color(C.wood);
  for (const c of e.cells) sheaf(at, c.x + 0.5, c.y + 0.5, c.z, 0.96, foot, head, tie);
};

/** Un poteau de barrière seul (la Ferme) : celui des cours. */
const post: HeartDrawing = (at, pe, e) => fencePost(at, pe, 0, 0, e.cells[0]?.z ?? 0);

// ---------- La Plaine des nombres ----------

/**
 * Une rangée du boulier (cinq cases le long de x) : deux montants de bois coiffés, la tringle à la même hauteur d'un bout
 * à l'autre (au-dessus du plus haut sol), une perle par case, dans la matière de son cube (brique ou sable : on compte
 * par cinq).
 */
const abacus: HeartDrawing = (at, pe, e) => {
  const upper = Math.max(...e.cells.map((c) => c.z)) + 0.62;
  const wood = pe.color(C.wood);
  const n = Math.max(...e.cells.map((c) => c.x)) + 1;
  for (const x of [0.14, n - 0.14]) {
    const s = e.ground(Math.floor(x), 0);
    at.block(x, 0.5, 0.2, 0.26, s, upper + 0.22, wood, { bottom: true, top: true });
    at.pyramid(x, 0.5, 0.13, 0.16, upper + 0.22, upper + 0.36, wood);
  }
  at.beam([0.24, 0.5, upper], [n - 0.24, 0.5, upper], 0.12, pe.color(C.lightWood));
  for (const c of e.cells) bead(at, c.x + 0.5, 0.5, upper, 0.3, 0.2, pe.material(c.texture ?? 'brique'));
};

/** Une perle du boulier, enfilée le long de x : deux pointes à six pans, dos à dos. 12 triangles. */
function bead(at: Workshop, cx: number, cy: number, cz: number, r: number, half: number, t: Tint): void {
  at.spike([cx, cy, cz], [cx - half, cy, cz], r, 6, t, Math.PI / 6);
  at.spike([cx, cy, cz], [cx + half, cy, cz], r, 6, t, Math.PI / 6);
}

/** La borne de brique de la Plaine (deux cases de haut). */
const brickMilestone: HeartDrawing = (at, pe) => milestone(at, pe, 0, 0, 0, 1.9, pe.material('brique'), pe.role('yardSlab'));

// ---------- La Rivière des fractions ----------

/**
 * La mare (deux cases sur deux) : l'eau en nappe (le vert d'eau du cœur) à huit pans, son liseré clair, posée à fleur du
 * sol ; trois galets sur sa rive, le nénuphar sur l'eau.
 */
const pond: HeartDrawing = (at, pe, e) => {
  const z = e.ground(0, 0);
  at.disc(1, 1, z + 0.04, 0.96, 8, pe.role('lisere'), Math.PI / 8);
  at.disc(1, 1, z + 0.05, 0.86, 8, pe.role('nappe'), Math.PI / 8);
  at.disc(1.32, 1.3, z + 0.06, 0.24, 6, pe.role('feuille'));
  const g = pe.material('galet');
  pebble(at, 0.24, 0.3, z, 0.2, 0.16, g);
  pebble(at, 1.78, 0.42, z, 0.16, 0.14, g, 5, 1.2);
  pebble(at, 0.4, 1.76, z, 0.18, 0.14, g, 5, 0.7);
};

/** Des galets seuls (la Rivière) : un gros et un petit. */
const pebbles: HeartDrawing = (at, pe) => {
  const g = pe.material('galet');
  pebble(at, 0.42, 0.46, 0, 0.3, 0.3, g);
  pebble(at, 0.76, 0.72, 0, 0.16, 0.16, darker(g, 0.94), 5, 1.4);
};

// ---------- La Lagune des décimaux ----------

/**
 * Le petit volcan (trois cases sur trois, la braise au sommet) : deux troncs de cône à huit pans qui se resserrent, le
 * bord du cratère, sa paroi intérieure et la braise mate au fond (elle ne brille pas) ; deux coulées d'obsidienne.
 */
const volcano: HeartDrawing = (at, pe) => {
  const stone = pe.material('pierre');
  const n = 8;
  const rot = Math.PI / 8;
  at.prism(1.5, 1.5, 1.46, 0.98, 0, 1.05, n, stone, rot, true);
  at.prism(1.5, 1.5, 0.98, 0.56, 1.05, 2.47, n, stone, rot, true);
  // Le liseré clair du bord du cratère (la dalle des cours) : il détache le sommet du sol sombre de la Lagune, sans lueur.
  const rim = pe.role('yardSlab');
  at.prism(1.5, 1.5, 0.56, 0.56, 2.47, 2.55, n, rim, rot, true);
  at.annulus(1.5, 1.5, 2.55, 0.34, 0.56, n, rim, rot);
  at.innerWall(1.5, 1.5, 0.34, 2.3, 2.55, n, stone.cote, rot);
  at.disc(1.5, 1.5, 2.3, 0.34, n, pe.role('braise'), rot);
  const obsidian = pe.material('obsidienne');
  const flows: [V3, V3][] = [
    [
      [1.18, 0.62, 1.45],
      [0.8, 0.1, 0.25],
    ],
    [
      [2.3, 1.3, 1.6],
      [2.82, 1.06, 0.3],
    ],
  ];
  for (const [a, b] of flows) at.beam(a, b, 0.2, obsidian);
};

/** Des éclats d'obsidienne (une ou deux cases de haut) : trois ou quatre pointes penchées sur un pied de roche. */
const shards: HeartDrawing = (at, pe, e) => {
  const upper = Math.max(...e.cells.map((c) => c.z)) + 1;
  const o = pe.material('obsidienne');
  at.prism(0.5, 0.5, 0.36, 0.24, 0, 0.18, 5, darker(pe.material('pierre'), 0.8), 0.5);
  const spikes: [number, number, number, number][] = [
    [0.5, 0.52, 0, 0.92],
    [0.26, 0.4, -0.18, 0.55],
    [0.72, 0.36, 0.2, 0.62],
    [0.5, 0.74, 0.05, 0.45],
  ];
  for (const [x, y, lean, h] of spikes.slice(0, upper > 1 ? 4 : 3)) at.spike([x, y, 0.1], [x + lean, y - 0.08, 0.1 + h * upper * 0.9], 0.15, 4, o, 0.4);
};

// ---------- La Baie des mots ----------

/**
 * La cabine téléphonique de la Baie (trois cases de haut, son chapeau sombre), crème pour se détacher du sol rouge de
 * l'île : la plinthe, le soubassement plein, les vitres d'un gris bleuté (éteintes) sur ses quatre faces, leurs
 * traverses, quatre montants, le bandeau clair sous le toit bombé en croupe, et son épi.
 */
const booth: HeartDrawing = (at, pe) => {
  const cream = pe.color(C.cream);
  const body: Faces = { dessus: cream, cote: scaleColor(cream, 0.92) };
  const band = pe.color(HEART_COLORS.boothBand);
  const pane = pe.color(HEART_COLORS.boothGlass);
  at.block(0.5, 0.5, 0.86, 0.86, 0, 0.1, pe.role('yardStone'));
  at.block(0.5, 0.5, 0.68, 0.68, 0.1, 0.84, body, { bottom: true, top: true });
  at.block(0.5, 0.5, 0.62, 0.62, 0.84, 2.46, pane, { bottom: true, top: true });
  for (const [x, y] of [
    [0.2, 0.2],
    [0.8, 0.2],
    [0.8, 0.8],
    [0.2, 0.8],
  ])
    at.block(x, y, 0.16, 0.16, 0.1, 2.5, body, { bottom: true, top: true });
  // Les traverses des vitres, sur chaque face.
  for (const z of [1.36, 1.9]) at.block(0.5, 0.5, 0.66, 0.66, z, z + 0.06, body, { bottom: true, top: true });
  at.block(0.5, 0.5, 0.74, 0.74, 2.5, 2.8, band, { bottom: false });
  const cap = pe.color(C.tar);
  at.prism(0.5, 0.5, 0.4 * Math.SQRT2, 0.16 * Math.SQRT2, 2.8, 3.12, 4, cap, Math.PI / 4);
  at.pyramid(0.5, 0.5, 0.06, 0.06, 3.12, 3.3, cap);
};

/**
 * Le réverbère éteint de la Baie (trois cases de poteau sombre, la lanterne au-dessus) : le pied et le fût de fer, la tête
 * de lanterne des cours, ses vitres dans l'opaque (une lanterne du cœur ne s'allume jamais).
 */
const streetLamp: HeartDrawing = (at, pe) => {
  const iron = pe.color(C.iron);
  at.block(0.5, 0.5, 0.42, 0.42, 0, 0.26, iron);
  at.block(0.5, 0.5, 0.18, 0.18, 0.26, 3, iron, { bottom: true, top: true });
  at.facets(LANTERNE_DE_COUR, 0, 0, 3, (f) => pe.role(f.role ?? 'lanternFrame'), pe.role('lanternGlass'));
};

/** La caisse de cabine posée au sol (la Baie) : crème comme la cabine, pour se détacher du sol rouge ; son couvercle bordé d'un ton plus sombre. */
const boothCrate: HeartDrawing = (at, pe) => {
  const cream = pe.color(C.cream);
  const body: Faces = { dessus: cream, cote: scaleColor(cream, 0.94) };
  crate(at, 0.1, 0.9, 0.12, 0.88, 0, 0.82, body, { dessus: cream, cote: scaleColor(cream, 0.84) });
};

// ---------- L'Horloge des verbes ----------

/**
 * La tour de l'horloge (trois cases de pierre, le cadran, la flèche d'or) : la plinthe, le fût qui s'affine, la
 * corniche, la tête de pierre et ses quatre cadrans crème cerclés de laiton, leurs aiguilles sombres, le toit en
 * pyramide dans la couverture de l'île, la flèche d'or.
 */
const clockTower: HeartDrawing = (at, pe) => {
  const stone = pe.material('pierre');
  const dial = pe.material('cadran');
  const gold = pe.material('or');
  const q = Math.PI / 4;
  at.block(0.5, 0.5, 0.94, 0.94, 0, 0.24, { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') });
  at.prism(0.5, 0.5, 0.4 * Math.SQRT2, 0.33 * Math.SQRT2, 0.24, 2.9, 4, stone, q, true);
  at.block(0.5, 0.5, 0.84, 0.84, 2.9, 3.04, { dessus: stone.dessus, cote: pe.role('yardSlab') }, {});
  at.block(0.5, 0.5, 0.78, 0.78, 3.04, 3.9, stone, { bottom: true, top: true });
  const iron = pe.color(C.iron);
  const faces: ['px' | 'nx' | 'py' | 'ny', V3, V3][] = [
    ['ny', [0.5, 0.105, 3.47], [1, 0, 0]],
    ['py', [0.5, 0.895, 3.47], [1, 0, 0]],
    ['nx', [0.105, 0.5, 3.47], [0, 1, 0]],
    ['px', [0.895, 0.5, 3.47], [0, 1, 0]],
  ];
  for (const [toward, c, u] of faces) {
    const s = toward === 'ny' || toward === 'nx' ? -1 : 1;
    const front = (d: number): V3 => (u[0] ? [c[0], c[1] + s * d, c[2]] : [c[0] + s * d, c[1], c[2]]);
    at.standingDisc(c, toward, 0.32, 8, dial.cote, Math.PI / 8);
    at.standingDisc(front(0.008), toward, 0.26, 8, dial.dessus, Math.PI / 8);
    // Les aiguilles : la grande vers midi, la petite vers trois heures.
    const m = front(0.014);
    const along = (du: number, dz: number): V3 => [m[0] + u[0] * du, m[1] + u[1] * du, m[2] + dz];
    at.quad(along(-0.025, 0), along(0.025, 0), along(0.025, 0.21), along(-0.025, 0.21), front(-0.5), iron);
    at.quad(along(0, -0.025), along(0.15, -0.025), along(0.15, 0.025), along(0, 0.025), front(-0.5), iron);
  }
  at.pyramid(0.5, 0.5, 0.46, 0.46, 3.9, 4.5, pe.roof());
  at.prism(0.5, 0.5, 0.07, 0, 4.42, 4.98, 4, gold, q);
};

/**
 * Le rouage de cadrans couché au sol (deux cases) : deux roues dentées de laiton qui s'engrènent, dents à plat, leur moyeu
 * crème.
 */
const gearTrain: HeartDrawing = (at, pe) => {
  const dial = pe.material('cadran');
  const brass: Faces = { dessus: dial.cote, cote: scaleColor(dial.cote, 0.82) };
  gear(at, 0.52, 0.5, 0.4, 0.17, 10, brass, 0);
  gear(at, 1.44, 0.5, 0.34, 0.25, 8, brass, Math.PI / 8);
  at.prism(0.52, 0.5, 0.12, 0.1, 0.17, 0.26, 6, dial.dessus);
  at.prism(1.44, 0.5, 0.1, 0.08, 0.25, 0.33, 6, dial.dessus);
};

/** Une roue dentée couchée : `n` dents (une étoile à 2n pointes, son flanc et son dessus), de rayon `r`, haute de `h`. */
function gear(at: Workshop, cx: number, cy: number, r: number, h: number, n: number, t: Tint, rot: number): void {
  const pts: V3[] = [];
  for (let i = 0; i < 2 * n; i++) {
    const a = rot + (i / (2 * n)) * Math.PI * 2;
    const ri = i % 2 ? r * 0.78 : r;
    pts.push([cx + ri * Math.cos(a), cy + ri * Math.sin(a), 0]);
  }
  const inside: V3 = [cx, cy, h / 2];
  for (let i = 0; i < pts.length; i++) {
    const [p, q] = [pts[i], pts[(i + 1) % pts.length]];
    at.quad(p, q, [q[0], q[1], h], [p[0], p[1], h], inside, t);
  }
  for (let i = 0; i < pts.length; i++) {
    const [p, q] = [pts[i], pts[(i + 1) % pts.length]];
    at.tri([cx, cy, h], [p[0], p[1], h], [q[0], q[1], h], [cx, cy, 0], t);
  }
}

// ---------- La Fouille des siècles ----------

/**
 * L'éclat de sol de mosaïque mis au jour (deux cases) : la terre du sondage, la dalle de mosaïque cassée en deux morceaux
 * de hauteur différente, pavée en damier de ses deux tons, deux tesselles détachées.
 */
const mosaicFloor: HeartDrawing = (at, pe) => {
  const m = pe.material('mosaique');
  const earth = pe.material('terre');
  at.box(0.04, 1.96, 0.06, 0.94, 0, 0.06, earth);
  const pieces: [number, number, number, number, number, number][] = [
    [0.12, 1.12, 0.14, 0.86, 0.17, 4],
    [1.18, 1.86, 0.2, 0.8, 0.13, 3],
  ];
  for (const [x0, x1, y0, y1, h, n] of pieces) {
    at.box(x0, x1, y0, y1, 0.06, h, { dessus: m.dessus, cote: scaleColor(m.cote, 0.9) }, { bottom: true, top: true });
    const [px, py] = [(x1 - x0) / n, (y1 - y0) / 3];
    for (let i = 0; i < n; i++)
      for (let j = 0; j < 3; j++) {
        const [a, b] = [x0 + i * px, y0 + j * py];
        at.quad([a, b, h], [a + px, b, h], [a + px, b + py, h], [a, b + py, h], [1, 0.5, 0], (i + j) % 2 ? m.cote : m.dessus);
      }
  }
  at.block(1.3, 0.12, 0.12, 0.12, 0.06, 0.16, m.dessus);
  at.block(0.96, 0.92, 0.12, 0.1, 0.06, 0.14, m.cote);
};

// ---------- La Pointe des paysages ----------

/** Les deux bottes de chaume (une par case) : un ballot à deux liens de ficelle sombre, l'un un peu tourné. */
const thatchBales: HeartDrawing = (at, pe, e) => {
  const thatch = pe.material('chaume');
  const tie = pe.color(C.wood);
  for (const c of e.cells) {
    const [x0, x1, y0, y1, z0, z1] = [c.x + 0.07, c.x + 0.93, c.y + 0.16, c.y + 0.84, c.z, c.z + 0.6];
    at.box(x0, x1, y0, y1, z0, z1, thatch);
    for (const x of [x0 + 0.24, x1 - 0.3]) at.box(x, x + 0.06, y0 - 0.012, y1 + 0.012, z0, z1 + 0.012, tie, { bottom: true, px: false, nx: false });
  }
};

/** La borne de pierre au bord du chemin (la Pointe) : la borne commune, sa tête rouge de borne de chemin. */
const stoneMilestone: HeartDrawing = (at, pe) => milestone(at, pe, 0, 0, 0, 0.92, pe.material('pierre'), pe.material('cabine'));

// ---------- La Vallée du vivant ----------

/**
 * La touffe de fougères (deux cubes de mousse, une feuille dessus) : deux buttes de mousse, sept frondes penchées en
 * étoile, d'un vert plus clair au milieu.
 */
const ferns: HeartDrawing = (at, pe) => {
  const moss = pe.material('mousse');
  heap(at, 0.52, 0.5, 0, 0.46, 0.34, moss, 6);
  heap(at, 1.46, 0.5, 0, 0.42, 0.28, moss, 6, 0.8);
  const f = pe.material('feuilles');
  const fronds: [number, number, number, number, number][] = [
    [0.55, 0.5, -0.5, -0.25, 0.95],
    [0.55, 0.5, 0.45, -0.3, 1.0],
    [0.55, 0.5, -0.1, 0.45, 1.1],
    [0.55, 0.5, 0.05, -0.05, 1.2],
    [1.45, 0.5, 0.42, -0.2, 0.7],
    [1.45, 0.5, -0.3, 0.3, 0.8],
    [1.45, 0.5, 0.05, -0.38, 0.75],
  ];
  fronds.forEach(([x, y, dx, dy, h], i) => at.spike([x, y, 0.2], [x + dx, y + dy, h], 0.1, 3, i === 3 ? pe.role('feuille') : f, i));
};

// ---------- Le Laboratoire des éléments ----------

/**
 * Le tas de galets (deux au sol, un dessus) : trois galets plats et ronds à huit pans (hauts de 0,6 fois leur rayon),
 * d'un gris chaud qui ne se confond pas avec les rochers communs.
 */
const pebbleHeap: HeartDrawing = (at, pe) => {
  const warm = pe.color(HEART_COLORS.warmPebble);
  const g: Faces = { dessus: warm, cote: scaleColor(warm, 0.88) };
  const flat = 0.6;
  pebble(at, 0.5, 0.5, 0, 0.42, 0.42 * flat, g, 8);
  pebble(at, 1.48, 0.52, 0, 0.36, 0.36 * flat, darker(g, 0.94), 8, 0.7);
  pebble(at, 0.56, 0.48, 0.42 * flat, 0.3, 0.3 * flat, g, 8, 1.1);
};

// ---------- Le Hangar des inventions ----------

/** Les deux cartons empilés : le gros en bas, sa bande de ruban ; le petit dessus, ses quatre rabats ouverts. */
const boxes: HeartDrawing = (at, pe) => {
  const cardboard = pe.material('carton');
  crate(at, 0.08, 0.92, 0.1, 0.9, 0, 0.94, cardboard, darker(cardboard, 0.9));
  at.quad([0.44, 0.065, 0.2], [0.56, 0.065, 0.2], [0.56, 0.065, 0.94], [0.44, 0.065, 0.94], [0.5, 0.5, 0.5], pe.color(C.cream));
  const [x0, x1, y0, y1, z0, z1] = [0.18, 0.8, 0.2, 0.78, 0.94, 1.62];
  at.box(x0, x1, y0, y1, z0, z1, cardboard, { bottom: true, top: true });
  at.quad([x0 + 0.02, y0 + 0.02, z1 - 0.01], [x1 - 0.02, y0 + 0.02, z1 - 0.01], [x1 - 0.02, y1 - 0.02, z1 - 0.01], [x0 + 0.02, y1 - 0.02, z1 - 0.01], [0.5, 0.5, 0], pe.color(SHADOW));
  const flap = darker(cardboard, 0.95);
  const r = 0.22;
  at.quad([x0, y0, z1], [x1, y0, z1], [x1, y0 - r * 0.7, z1 + r * 0.7], [x0, y0 - r * 0.7, z1 + r * 0.7], [0.5, 0.5, z1 - 1], flap);
  at.quad([x0, y1, z1], [x1, y1, z1], [x1, y1 + r * 0.7, z1 + r * 0.7], [x0, y1 + r * 0.7, z1 + r * 0.7], [0.5, 0.5, z1 - 1], flap);
  at.quad([x0, y0, z1], [x0, y1, z1], [x0 - r * 0.6, y1, z1 + r * 0.8], [x0 - r * 0.6, y0, z1 + r * 0.8], [0.5, 0.5, z1 - 1], flap);
  at.quad([x1, y0, z1], [x1, y1, z1], [x1 + r * 0.6, y1, z1 + r * 0.8], [x1 + r * 0.6, y0, z1 + r * 0.8], [0.5, 0.5, z1 - 1], flap);
};

// ---------- Le Préau des délégués ----------

/**
 * La craie sur son pied de planches (le Préau) : la petite table de planches, le pain de craie (tenu à 70 d'écart du
 * fantôme Brume), trois bâtons de craie couchés devant lui.
 */
const chalk: HeartDrawing = (at, pe) => {
  const planks = pe.material('planches');
  tableOnLegs(
    at,
    0.08,
    0.92,
    0.12,
    0.88,
    1,
    0.14,
    planks,
    [
      [0.2, 0.24],
      [0.8, 0.24],
      [0.8, 0.76],
      [0.2, 0.76],
    ],
    0.14,
    darker(planks, 0.85),
  );
  const c = pe.material('craie');
  const white: Faces = { dessus: apartFromGhost(c.dessus), cote: apartFromGhost(c.cote) };
  at.box(0.24, 0.84, 0.44, 0.8, 1, 1.34, white);
  for (const [x, y] of [
    [0.2, 0.24],
    [0.42, 0.2],
    [0.62, 0.27],
  ])
    at.box(x, x + 0.26, y - 0.075, y + 0.075, 1, 1.15, white);
};

/** Le décor du cœur des îles du 6e, ensemble par ensemble (colonnes dans la grille de `DECOR`). */
export const HEART_DECOR_6E: Readonly<Partial<Record<BiomeId, readonly HeartDecor[]>>> = {
  'french-6e-letter-confusion': [
    {
      name: 'galerie',
      columns: [
        [2, 10],
        [3, 10],
      ],
      drawing: mineEntrance,
    },
  ],
  'french-6e-word-spelling': [
    { name: 'tas-de-sable', columns: [8, 9, 10].flatMap((x) => [3, 4, 5].map((y) => [x, y] as const)), drawing: sandHeap },
    { name: 'petit-tas', columns: [[3, 9]], drawing: smallHeap('quarry') },
  ],
  'french-6e-grammar-spelling': [
    {
      name: 'champ',
      columns: [
        [8, 2],
        [8, 3],
        [9, 3],
        [8, 4],
        [8, 5],
        [9, 5],
      ],
      drawing: wheatField,
    },
    { name: 'poteau-1', columns: [[6, 1]], drawing: post },
    { name: 'poteau-2', columns: [[3, 10]], drawing: post },
  ],
  'maths-6e-calculation': [
    { name: 'boulier-1', columns: [7, 8, 9, 10, 11].map((x) => [x, 2] as const), drawing: abacus },
    { name: 'boulier-2', columns: [7, 8, 9, 10, 11].map((x) => [x, 4] as const), drawing: abacus },
    { name: 'borne', columns: [[3, 9]], drawing: brickMilestone },
  ],
  'maths-6e-fractions': [
    {
      name: 'mare',
      columns: [
        [8, 3],
        [9, 3],
        [8, 4],
        [9, 4],
      ],
      drawing: pond,
    },
    ...(
      [
        [7, 2],
        [10, 5],
        [7, 5],
        [1, 10],
      ] as const
    ).map(([x, y]) => ({ name: `galets@${x},${y}`, columns: [[x, y] as const], drawing: pebbles })),
  ],
  'maths-6e-decimals': [
    { name: 'volcan', columns: [8, 9, 10].flatMap((x) => [3, 4, 5].map((y) => [x, y] as const)), drawing: volcano },
    { name: 'eclats-1', columns: [[3, 9]], drawing: shards },
    { name: 'eclats-2', columns: [[1, 10]], drawing: shards },
  ],
  'english-6e-vocabulary': [
    { name: 'cabine', columns: [[9, 3]], drawing: booth },
    { name: 'reverbere', columns: [[11, 5]], drawing: streetLamp },
    { name: 'caisse', columns: [[3, 9]], drawing: boothCrate },
  ],
  'english-6e-grammar': [
    { name: 'horloge', columns: [[9, 3]], drawing: clockTower },
    {
      name: 'rouage',
      columns: [
        [3, 9],
        [4, 9],
      ],
      drawing: gearTrain,
    },
  ],
  'history-6e-antiquity': [
    {
      name: 'mosaique',
      columns: [
        [9, 3],
        [10, 3],
      ],
      drawing: mosaicFloor,
    },
    { name: 'tas-de-fouille', columns: [[3, 9]], drawing: smallHeap('dig') },
  ],
  'geography-6e-living': [
    {
      name: 'chaume',
      columns: [
        [9, 3],
        [10, 3],
      ],
      drawing: thatchBales,
    },
    { name: 'borne', columns: [[1, 10]], drawing: stoneMilestone },
  ],
  'life-earth-sciences-6e-living-world': [
    {
      name: 'fougeres',
      columns: [
        [9, 3],
        [10, 3],
      ],
      drawing: ferns,
    },
  ],
  'physics-chemistry-6e-matter-energy': [
    {
      name: 'galets',
      columns: [
        [9, 3],
        [10, 3],
      ],
      drawing: pebbleHeap,
    },
  ],
  'technology-6e-objects': [{ name: 'cartons', columns: [[9, 3]], drawing: boxes }],
  'civics-6e-democratic-society': [{ name: 'craie', columns: [[9, 3]], drawing: chalk }],
};

/** Le nombre de cubes que le décor d'une île pose dans chaque colonne de sa grille (sans les arbres, nommés). */
const decorCountsCache = new Map<BiomeId, Map<string, number>>();
function decorCountsFor(id: BiomeId): Map<string, number> {
  let out = decorCountsCache.get(id);
  if (out) return out;
  out = new Map();
  const m = out;
  DECOR[id](
    (x, y, _z, _color, decor) => {
      if (decor) return;
      const k = `${x},${y}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    },
    () => 0,
  );
  decorCountsCache.set(id, out);
  return out;
}

const cellKey = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** Le cube compte-t-il parmi le décor du cœur de son île (ni sol, ni décor du paysage, ni borne, lieu, liaison, petite construction) ? */
const isHeartCube = (c: VoxelCube) => !c.ghost && !c.sol && !c.decor && !c.quest && !c.place && !c.bridge && !c.petiteConstruction;

/**
 * Les ensembles du décor du cœur de ce monde que le kit d'Archipéo dessine (`Kit.objetsDessines`, au 6e) : chacun comme
 * un modèle importé qui remplace ses cubes (le toucher retrouve ses cases). `null` dans les autres archipels.
 */
export function drawnHeartDecor(a: ArchipelagoId, cubes: readonly VoxelCube[]): ImportedMonument[] {
  const out: ImportedMonument[] = [];
  const islands = BIOMES.filter((b) => b.classe === a && HEART_DECOR_6E[b.id]);
  if (!islands.length) return out;
  const ids = new Set<string>(islands.map((b) => b.id));
  const byColumn = new Map<string, VoxelCube[]>();
  const buildings = batimentsDe(a);
  const yards = coursDe(a);
  for (const c of cubes) {
    if (!c.tag || !ids.has(c.tag) || !isHeartCube(c)) continue;
    const k = cellKey(c.x, c.y, c.z);
    if (buildings.has(k) || yards.has(k)) continue;
    const kc = `${c.tag}|${c.x},${c.y}`;
    const l = byColumn.get(kc);
    if (l) l.push(c);
    else byColumn.set(kc, [c]);
  }
  for (const b of islands) {
    const o = origineDe(b.id);
    const q = islandDef(b.id).quarts;
    const counts = decorCountsFor(b.id);
    for (const entry of HEART_DECOR_6E[b.id] ?? []) {
      const ax = Math.min(...entry.columns.map(([x]) => x));
      const ay = Math.min(...entry.columns.map(([, y]) => y));
      const members: { x: number; y: number; cubes: VoxelCube[] }[] = [];
      let complete = true;
      for (const [x, y] of entry.columns) {
        const t = turnCell(LAYOUT_PAD.x + x, LAYOUT_PAD.y + y, q);
        const l = byColumn.get(`${b.id}|${o.x + t.x},${o.y + t.y}`) ?? [];
        if (l.length !== (counts.get(`${x},${y}`) ?? 0) || !l.length) complete = false;
        members.push({ x: x - ax, y: y - ay, cubes: l });
      }
      if (!complete) continue;
      const all = members.flatMap((s) => s.cubes);
      const base = Math.min(...all.map((c) => c.z));
      const grounds = new Map(members.map((s) => [`${s.x},${s.y}`, Math.min(...s.cubes.map((c) => c.z)) - base]));
      const group: HeartGroup = {
        cells: members.flatMap((s) => s.cubes.map((c) => ({ x: s.x, y: s.y, z: c.z - base, texture: isTextureKind(c.texture) ? c.texture : null }))),
        ground: (x, y) => grounds.get(`${x},${y}`) ?? 0,
      };
      const toWorld = (x: number, y: number, z: number): V3 => {
        const p = turnPoint(LAYOUT_PAD.x + ax + x, LAYOUT_PAD.y + ay + y, q);
        return [o.x + p.x, base + z, o.y + p.y];
      };
      // Rien ne s'allume au cœur : le feu est dans l'opaque.
      const at = new Workshop(new Pinceau(), null, toWorld);
      entry.drawing(at, paintFor(a, b.id, all.some((c) => c.muted)), group);
      out.push({
        id: `coeur:${b.id}:${entry.name}`,
        stage: 1,
        opaque: at.opaque.fin(),
        fire: new Pinceau().fin(),
        halo: null,
        cellules: all.map((c) => ({ x: c.x, y: c.y, z: c.z })),
        replaced: new Set(all.map((c) => cellKey(c.x, c.y, c.z))),
      });
    }
  }
  return out;
}
