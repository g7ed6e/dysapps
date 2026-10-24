// Les Orgues (lot 3 du monde ouvert du 4e, l'Épaule, GD-24 ; intention du directeur artistique du 22 octobre 2026,
// planche `selection-epaule-v1`) : « on taillait la pierre ici ». Le cœur, sans figure : le front de taille, un
// affleurement de colonnes de basalte hexagonales, jointives, de hauteurs toujours inégales (des tuyaux d'orgue, jamais
// un escalier), en deux rangs décalés sur un arc un peu creux, le tertre de basalte derrière lui qui retombe vers la mer ;
// devant, la cour et ses gradins de blocs hexagonaux ; à l'ouest, la chèvre de bois (un mât épais, une flèche, deux
// haubans), plus basse que le front ; à l'est, l'abri du carrier, de pierre sèche, son auvent sur deux poteaux. Le sol
// est plat (intention, § 2) : rien ne se pose au sud de z = 6, où passe le chemin du Terminus.
// Le signe de l'absence du 4e : au bout de la chaîne de la chèvre, la chape vide et ses deux goujons nus (le crochet est
// chez les Ferrailleurs) ; dans la ruine, au bout de la chaîne en tas, à côté du mât couché. Avant comme après, jamais une
// étape.
//
// La ruine (intention, § 6) : les colonnes cassées net à leurs têtes ; trois trous dans le rang : une colonne gît en
// travers de la cour, en deux tronçons, deux autres sont appuyées de biais contre le front ; le mât couché à l'ouest, la
// flèche à côté, la chaîne en tas ; la cour de terre grise, quelques pavés en place ; l'abri, ses murs debout, l'auvent
// tombé, un poteau debout et sa lanterne, la seule allumée de la ruine. Cinq parties : la cour dégagée (les
// gradins), le front refait, la chèvre redressée ; le haut (la poulie, la chaîne et sa chape, la lanterne du mât) ; les
// abords (la cour pavée, l'abri remis, la lanterne du chemin). Les plans de l'île (`docs/contenu/french-4e-agreement.md`)
// coupent ces cinq parties en 2 + 2 + 1, et non en 3 + 1 + 1 comme l'intention : le corps porte la cour et le front, le
// haut la chèvre puis sa chaîne. Code pur (placeArt.ts).
import { drawPosed, FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { CHAPE, chape, courses, EPAULE_COLORS, hexColumn, hexPlate, lantern, SINK, slab, strut } from './epauleKit';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { PATH_NODES_4E, PLACES_4E } from './plan4e';
import { localGround4e, once } from './place4eKit';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';
import { SHADOW_DIR_4E } from './sky';

type P3 = readonly [number, number, number];

/**
 * Les couleurs des Orgues : celles de l'Épaule (./epauleKit.ts) ; le basalte des colonnes, plus clair que la croûte, et
 * son joint d'un ton plus sombre ; le tertre, un cran plus sombre, jamais presque noir ; les dalles de la cour, deux tons
 * proches ; les pavés clairs des réponses ; le carrier en pion. Retouche 1 (directeur artistique, points 7 et 16) : le
 * basalte des colonnes et du tertre tiré vers le gris (`#6A5E58` se lisait brun comme la terre rouge, au soleil bas), une
 * arête claire par colonne, côté soleil (`columnEdge`) ; l'écart entre les dalles de la cour réduit, les pavés des
 * réponses toujours les plus clairs.
 */
const C = {
  ...EPAULE_COLORS,
  column: 0x6c6865,
  columnJoint: 0x63605d,
  columnSun: 0x85817d,
  columnEdge: 0x8f8a86,
  tertre: 0x605b58,
  // Retouche 2 (directeur artistique, point C) : le dessus du tertre se lit #5E534E à l'écran, jamais en dalle noire ;
  // le crêt, en pente douce vers l'arrière, prend le soleil bas du sud ; le dos, raide, lui tourne le dos : chacun sa
  // teinte, pour la même couleur à l'écran (`rendered5e` sous `LIGHT_4E`, vérifié par le test).
  tertreTop: 0x706e70,
  tertreBack: 0x888484,
  paver: 0x857f7a,
  paverLight: 0x8e8883,
  answer: 0xaca69f,
  answerTop: 0xbcb6b0,
  chain: 0x5c504c,
  // Le carrier, en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, pantalon brun, chemise grise.
  trousers: 0x6e5c50,
  shirt: 0x8c8a86,
} as const;

// ---------- Le repère ----------

/** Le centre du lieu et le sol sous lui. */
const CENTER: Vec2 = PLACES_4E.find((p) => p.id === 'orgues')!.center;
/** Le sol sous le centre, pris au premier usage, jamais à l'import (./place4eKit.ts). */
const h0 = once(() => standingHeight(heightAt4e(CENTER)));

/** Le sol du 4e sous un point du repère du lieu, depuis le sol de son centre. */
const localGround = localGround4e(CENTER);

// ---------- Le plan ----------

/** Le front de taille : l'arc un peu creux du rang de devant (son `z` selon `x`) ; le rang de derrière, 1,5 plus au nord. */
const frontZ = (x: number): number => -4.9 + 0.014 * (x + 1) ** 2 - 0.03 * x;
const BACK_ROW = 1.5;

/**
 * Les colonnes, du rang de devant puis de derrière : leur place (`x`, et leur rang), leur rayon, leur hauteur, leurs
 * joints ; tuyaux d'orgue, les plus hautes aux côtés, jamais en escalier. `hole` : une des trois places vides de la ruine
 * (la colonne couchée en travers de la cour, puis les deux appuyées contre le front).
 */
const COLUMNS = [
  { x: -7.6, back: false, r: 1.1, h: 8.6, joints: [2.6, 5.9] },
  { x: -5.7, back: false, r: 0.95, h: 6.2, joints: [3.4] },
  { x: -3.8, back: false, r: 1.05, h: 5.0, joints: [1.9], hole: 'fallen' as const },
  { x: -1.9, back: false, r: 0.9, h: 6.8, joints: [4.1] },
  { x: 0, back: false, r: 1.0, h: 4.6, joints: [2.3], hole: 'leaning' as const },
  { x: 1.9, back: false, r: 1.15, h: 5.8, joints: [3.0] },
  { x: 3.8, back: false, r: 0.95, h: 7.1, joints: [2.2, 4.8], hole: 'leaning' as const },
  { x: 5.6, back: false, r: 1.05, h: 9.0, joints: [3.7, 6.4] },
  { x: -6.65, back: true, r: 1.0, h: 9.5, joints: [4.4] },
  { x: -4.75, back: true, r: 1.1, h: 7.4, joints: [2.8, 5.5] },
  { x: -2.85, back: true, r: 0.95, h: 6.1, joints: [3.6] },
  { x: -0.95, back: true, r: 1.05, h: 7.9, joints: [2.5, 5.2] },
  { x: 0.95, back: true, r: 0.9, h: 5.5, joints: [3.1] },
  { x: 2.85, back: true, r: 1.1, h: 8.3, joints: [4.6] },
] as const;
const columnZ = (c: (typeof COLUMNS)[number]): number => frontZ(c.x) - (c.back ? BACK_ROW : 0);

/** Les hauteurs cassées des têtes de la ruine (chacune un peu plus basse, en biais), dans l'ordre des colonnes. */
const RUIN_DROP = [1.2, 0.6, 0, 1.4, 0, 0.5, 0, 1.6, 2.1, 0.9, 0.4, 1.8, 0.7, 1.3] as const;

/**
 * Le tertre de basalte derrière le front : son bord avant (haut), son dos qui descend vers la mer. Retouche 1 (directeur
 * artistique, point 7) : plus haut, et derrière le rang de derrière, pour que son épaule se voie entre les têtes des
 * colonnes, de face. Retouche 2 (point C : vu de dos, son dessus se lisait comme une grande dalle presque noire) : un
 * crêt en pente douce vers l'arrière (`front` : son bord avant, 7,6 au-dessus du sol ; `crest` : son bord arrière, à
 * `crestZ`, `slope` plus bas, une dizaine de degrés), éclairé par le soleil bas ; puis le dos, raide et court, jusqu'au
 * sol à `backZ` (`back` au-dessus du sol).
 */
const TERTRE = { front: 7.6, slope: 0.6, crestZ: 10.5, backZ: 14.6, back: 0.4 } as const;

/** La cour, devant le front : ses gradins de blocs (deux marches) ; ses pavés de la ruine ; ses dalles des abords. */
const STEPS = { lower: { z: -2.2, h: 0.6, xs: [-5.4, -4.0, -2.6, -1.2, 0.2, 1.6] }, upper: { z: -3.3, h: 1.15, xs: [-4.7, -3.3, -1.9, -0.5, 0.9] }, r: 0.72 } as const;
const RUIN_PAVERS = [
  [-1.4, 1.2],
  [-0.1, 1.9],
  [1.1, 1.0],
  [-0.6, 0.0],
  [0.6, 2.9],
  [2.0, 2.0],
  [-1.8, 2.6],
] as const;

/** La chèvre, à l'ouest : le pied du mât, sa hauteur, le bout de la flèche, les pieds des haubans ; la chape à 2 du sol. */
const DERRICK = { foot: { x: -7, z: 0 }, h: 5.5, post: 0.42, tip: { x: -4.4, y: 4.4, z: 1.1 }, stays: [{ x: -9.9, z: -1.4 }, { x: -9.6, z: 2.3 }], hookY: 2.0 } as const;

/** L'abri du carrier, adossé au bout est du front : ses murs de pierre sèche, ses deux poteaux, son auvent vers le sud-ouest. */
const SHELTER = { x0: 5.2, x1: 8.2, z0: -3.0, z1: -0.2, wall: 0.5, h: 1.8, post: 2.3, posts: [{ x: 5.5, z: 0.25 }, { x: 7.9, z: 0.25 }] } as const;

/** La lanterne de l'abri (la seule allumée de la ruine), au poteau debout ; celle du mât (le haut) ; celle du chemin. */
const PATH_LANTERN = { x: 2.0, z: 6.5, h: 1.35 } as const;

/** Le pas de la porte du lieu, depuis le centre. */
const DOOR_AT: Vec2 = (() => {
  const n = PATH_NODES_4E.find((p) => p.id === 'orgues')!.at;
  return { x: n.x - CENTER.x, z: n.z - CENTER.z };
})();

// ---------- La vue ----------

/**
 * Le cap de la caméra de « Y aller » (intention, § 9) : au nord, de la porte vers le front, au centre du cadre et sur
 * toute sa largeur ; la chèvre à gauche, l'abri et sa lanterne à droite ; au-dessus du front, une bande de mer et le
 * ciel. Le cône n'entre pas dans le cadre.
 */
const DOOR_LOOK: Vec2 = { x: 0, z: -4.5 };
const DOOR_VIEW = Math.atan2(DOOR_AT.x - DOOR_LOOK.x, DOOR_AT.z - DOOR_LOOK.z);

/** La vue d'arrivée, basse comme aux Fabriques et un peu plus reculée : le front monte à 9,5, au-dessus de la caméra qui suit. */
const DOOR_FRAME = { height: -2.2, back: 1.8 } as const;

/** Le point du nom sur la Carte : sur le ciel, au-dessus des colonnes les plus basses, jamais sur la lanterne ni la chape. */
const MAP_POINT: Vec3 = { x: 0, y: 8, z: frontZ(0) };

// ---------- Le front ----------

/** L'arête claire de chaque colonne, sur son pan tourné vers le soleil (retouche 1, point 7). */
const EDGE = { color: C.columnEdge, sun: { x: -SHADOW_DIR_4E.x, z: -SHADOW_DIR_4E.z } } as const;

/** Une colonne debout à sa place : sa tête plate (restaurée) ou cassée en biais (la ruine). */
function column(b: FacetBuilder, k: number, broken: boolean): void {
  const c = COLUMNS[k];
  const z = columnZ(c);
  const y0 = localGround(c.x, z) + SINK;
  const yaw = 0.3 * k;
  const h = localGround(c.x, z) + c.h - (broken ? RUIN_DROP[k] : 0);
  const top = broken ? (i: number) => h - 0.35 * (1 + Math.cos((Math.PI * i) / 3 + k)) : () => h;
  const joints = c.joints.map((j) => localGround(c.x, z) + j).filter((j) => j < h - 0.5);
  hexColumn(b, c.x, z, c.r, yaw, y0, top, [C.column, C.columnJoint], C.columnSun, joints, EDGE);
}

/** Le tertre de basalte derrière le front : son crêt en pente douce, puis son dos qui retombe vers la mer ; toujours là. */
function tertre(b: FacetBuilder): void {
  const T = TERTRE;
  const g = (x: number, z: number, lift: number): P3 => [x, localGround(x, z) + lift, z];
  const crest = T.front - T.slope;
  const rear = [g(8.0, -T.crestZ - 0.1, crest), g(-9.8, -T.crestZ + 0.1, crest)] as const;
  slab(b, [g(-9.6, -6.9, T.front), g(7.4, -7.3, T.front), ...rear], 8.6, C.tertre, C.tertreTop);
  slab(b, [...rear, g(-6.0, -T.backZ, T.back), g(5.0, -T.backZ, T.back)], 8.6, C.tertre, C.tertreBack);
}

/** Les trois places vides de la ruine : la colonne couchée en travers de la cour, en deux tronçons ; les deux appuyées. */
function fallenColumns(b: FacetBuilder): void {
  // Les deux tronçons, couchés à l'ouest de la cour, vers (−3 ; 0).
  for (const [x, z, len, yaw, r] of [
    [-4.1, -0.4, 2.6, 1.25, 1.0],
    [-1.6, 0.5, 2.2, 1.45, 0.98],
  ] as const) {
    const y = localGround(x, z) + r * 0.86 - 0.05;
    drawPosed(b, { x, y, z, yaw, pitch: Math.PI / 2 }, (l) => hexColumn(l, 0, 0, r, 0, -len / 2, () => len / 2, [C.column, C.columnJoint], C.columnSun));
  }
}

/** Les deux colonnes basculées en avant, appuyées de biais contre le front, devant leurs places vides. */
function leaningColumns(b: FacetBuilder): void {
  COLUMNS.forEach((c, k) => {
    if (!('hole' in c) || c.hole !== 'leaning') return;
    const z = columnZ(c) + 2.3;
    const g = localGround(c.x, z);
    drawPosed(b, { x: c.x + 0.2, y: g, z, yaw: Math.PI + 0.15 * (k % 3), pitch: 0.42 }, (l) => hexColumn(l, 0, 0, c.r, 0.2, SINK, () => c.h - 0.6, [C.column, C.columnJoint], C.columnSun, [c.joints[0]]));
  });
}

/** Les gradins de blocs hexagonaux, deux marches au pied du front (le corps 1 : les colonnes tombées, débitées). */
function steps(b: FacetBuilder): void {
  const S = STEPS;
  for (const row of [S.lower, S.upper])
    row.xs.forEach((x, i) => {
      const g = localGround(x, row.z);
      hexColumn(b, x, row.z + (i % 2 ? 0.08 : -0.08), S.r, 0.15 * i, g + SINK, () => g + row.h + (i % 2 ? 0.05 : 0), [C.column, C.columnJoint], C.columnSun, [], EDGE);
    });
}

// ---------- La chèvre ----------

/** Le mât, la flèche et les haubans de la chèvre, debout (le corps 3). */
function derrick(b: FacetBuilder): void {
  const D = DERRICK;
  const g = localGround(D.foot.x, D.foot.z);
  b.box({ x: D.foot.x, y: g + SINK, z: D.foot.z }, [D.post, D.h - SINK, D.post], C.newShade, C.newWood);
  b.beam({ x: D.foot.x + 0.15, y: g + 0.7, z: D.foot.z + 0.05 }, { x: D.tip.x, y: g + D.tip.y, z: D.tip.z }, 0.3, C.newShade);
  const top: P3 = [D.foot.x, g + D.h - 0.2, D.foot.z];
  strut(b, top, [D.tip.x, g + D.tip.y + 0.1, D.tip.z], 0.04, C.rope);
  for (const s of D.stays) strut(b, top, [s.x, localGround(s.x, s.z) - 0.1, s.z], 0.05, C.rope);
}

/** La poulie au bout de la flèche, la chaîne qui pend et la chape vide au bout, à 2 du sol ; la lanterne du mât (le haut). */
function hoist(b: FacetBuilder): void {
  const D = DERRICK;
  const g = localGround(D.foot.x, D.foot.z);
  b.drum({ x: D.tip.x, y: g + D.tip.y - 0.35, z: D.tip.z - 0.08, pitch: Math.PI / 2 }, 0.26, 0.16, 6, C.iron, C.ironTop);
  const hook = g + D.hookY;
  b.box({ x: D.tip.x + 0.26, y: hook + CHAPE.h, z: D.tip.z }, [0.07, D.tip.y - 0.4 - D.hookY - CHAPE.h, 0.07], C.chain);
  chape(b, { x: D.tip.x + 0.26, y: hook, z: D.tip.z }, 0);
  b.beam({ x: D.foot.x, y: g + 3.4, z: D.foot.z }, { x: D.foot.x + 0.55, y: g + 3.4, z: D.foot.z + 0.3 }, 0.08, C.iron);
  lantern(b, { x: D.foot.x + 0.55, y: g + 3.36, z: D.foot.z + 0.3 }, true);
}

/** Le mât couché sur le côté ouest, la flèche à côté (la ruine, jusqu'au corps 3). */
function derrickDown(b: FacetBuilder): void {
  const y = (x: number, z: number) => localGround(x, z) + 0.15;
  b.beam({ x: -9.2, y: y(-9.2, 2), z: 2.0 }, { x: -4.0, y: y(-4, 3), z: 3.0 }, DERRICK.post, C.wood);
  b.beam({ x: -8.6, y: y(-8.6, 3.6), z: 3.6 }, { x: -5.6, y: y(-5.6, 4.6), z: 4.6 }, 0.28, C.woodShade);
}

/** La chaîne en tas et la chape vide au bout, à côté du mât couché (la ruine, jusqu'au haut) : la chape se voit toujours. */
function chainHeap(b: FacetBuilder): void {
  const at = { x: -5.0, z: 1.6 };
  const g = localGround(at.x, at.z);
  b.prism({ x: at.x, y: g - 0.05, z: at.z }, 0.42, 0.16, 0.28, 6, C.chain, C.ironTop);
  b.box({ x: at.x + 0.75, y: g, z: at.z + 0.3, yaw: 0.6 }, [0.9, 0.07, 0.07], C.chain);
  drawPosed(b, { x: at.x + 1.35, y: g + CHAPE.d / 2, z: at.z + 0.55, yaw: 0.6, pitch: Math.PI / 2 }, (l) => chape(l, { x: 0, y: 0, z: 0 }, 0));
}

// ---------- L'abri du carrier ----------

/** Les murs de pierre sèche de l'abri et le poteau debout, sa lanterne : toujours là. */
function shelter(b: FacetBuilder): void {
  const S = SHELTER;
  const g = localGround((S.x0 + S.x1) / 2, (S.z0 + S.z1) / 2);
  b.box({ x: (S.x0 + S.x1) / 2, y: g + SINK, z: S.z0 + S.wall / 2 }, [S.x1 - S.x0, S.h - SINK, S.wall], C.stoneShade, C.stone);
  b.box({ x: S.x1 - S.wall / 2, y: g + SINK, z: (S.z0 + S.z1) / 2 }, [S.wall, S.h - 0.25 - SINK, S.z1 - S.z0], C.stone, C.stoneSun);
  // Les assises de la pierre sèche (retouche 1, point 9).
  courses(b, { x: (S.x0 + S.x1) / 2, y: g, z: S.z0 + S.wall / 2 }, [S.x1 - S.x0, S.h, S.wall], [0.6, 1.2]);
  courses(b, { x: S.x1 - S.wall / 2, y: g, z: (S.z0 + S.z1) / 2 }, [S.wall, S.h - 0.25, S.z1 - S.z0], [0.6, 1.2]);
  const p = S.posts[0];
  b.box({ x: p.x, y: g + SINK, z: p.z }, [0.2, S.post - SINK, 0.2], C.woodShade, C.wood);
  b.beam({ x: p.x, y: g + S.post - 0.12, z: p.z }, { x: p.x - 0.45, y: g + S.post - 0.12, z: p.z + 0.2 }, 0.08, C.woodShade);
  lantern(b, { x: p.x - 0.45, y: g + S.post - 0.16, z: p.z + 0.2 }, true);
}

/** L'auvent de l'abri : sur ses deux poteaux (les abords), ou tombé d'un côté (la ruine). */
function awning(b: FacetBuilder, up: boolean): void {
  const S = SHELTER;
  const g = localGround((S.x0 + S.x1) / 2, (S.z0 + S.z1) / 2);
  if (up) {
    const p = S.posts[1];
    b.box({ x: p.x, y: g + SINK, z: p.z }, [0.2, S.post - SINK, 0.2], C.newShade, C.newWood);
    slab(b, [[S.x0 - 0.2, g + S.h + 0.35, S.z0 - 0.1], [S.x1 + 0.2, g + S.h + 0.35, S.z0 - 0.1], [S.x1 + 0.2, g + S.post + 0.05, S.posts[0].z + 0.15], [S.x0 - 0.2, g + S.post + 0.05, S.posts[0].z + 0.15]], 0.1, C.newShade, C.newWood);
    return;
  }
  slab(b, [[S.x0 + 0.6, g + S.h - 0.1, S.z0 + 0.4], [S.x1, g + S.h - 0.4, S.z0 + 0.4], [S.x1 + 0.3, g + 0.1, S.z1 + 0.6], [S.x0 + 0.9, g + 0.1, S.z1 + 0.6]], 0.1, C.woodShade, C.wood);
}

// ---------- La cour ----------

/** Les dalles hexagonales de la cour (les abords) : leurs dessus seuls, en nid d'abeille, de z = −1,6 à 5,2. */
const YARD_DALLES: readonly Vec2[] = (() => {
  const out: Vec2[] = [];
  const r = 0.92;
  const dx = r * Math.sqrt(3),
    dz = r * 1.5;
  for (let j = 0; j < 5; j++)
    for (let i = 0; i < 6; i++) {
      const x = -5.6 + i * dx + (j % 2 ? dx / 2 : 0);
      const z = -1.4 + j * dz;
      // La chèvre à l'ouest, l'abri à l'est : la cour entre eux.
      if (x < -5.4 || x > 5.0 || (x > 3.6 && z < 0.4)) continue;
      out.push({ x, z });
    }
  return out;
})();

/** La cour pavée : deux tons proches qui alternent (retouche 1, point 16 : le fort contraste papillotait au sol), les joints gardés. */
function yard(b: FacetBuilder): void {
  YARD_DALLES.forEach((p, k) => hexPlate(b, p.x, p.z, 0.88, Math.PI / 6, localGround(p.x, p.z) + 0.04 + (k % 3) * 0.005, k % 2 ? C.paverLight : C.paver));
}

// ---------- Le modèle ----------

function model(add: AddPiece, _ground: SiteGround, _door: Vec2): void {
  const corps1 = { stage: 0 as const, row: 0 };
  const corps2 = { stage: 0 as const, row: 0.5 };
  const haut1 = { stage: 1 as const, row: 0 };
  const haut2 = { stage: 1 as const, row: 0.5 };
  const abords = { stage: 2 as const, row: 0 };
  const holes = (c: (typeof COLUMNS)[number]) => 'hole' in c;

  // Toujours là : le tertre, les murs de l'abri, son poteau debout et sa lanterne (la seule allumée de la ruine).
  add('ruine', 0, (b) => {
    tertre(b);
    shelter(b);
  });

  // ---- La ruine ----
  // Le corps 1 la relève : la colonne couchée en travers de la cour, les deux appuyées contre le front.
  add(
    'ruine',
    0,
    (b) => {
      fallenColumns(b);
      leaningColumns(b);
    },
    corps1,
  );
  // Le corps 2 la relève : le front, ses colonnes cassées net, trois places vides.
  add(
    'ruine',
    0,
    (b) => {
      COLUMNS.forEach((c, k) => {
        if (!holes(c)) column(b, k, true);
      });
    },
    corps2,
  );
  // Le haut 1 la relève : le mât couché, la flèche à côté.
  add('ruine', 0, derrickDown, haut1);
  // Le haut 2 la relève : la chaîne en tas et sa chape vide.
  add('ruine', 0, chainHeap, haut2);
  // Les abords la relèvent : l'auvent tombé, les quelques pavés en place dans la terre grise.
  add(
    'ruine',
    0,
    (b) => {
      awning(b, false);
      for (const [x, z] of RUIN_PAVERS) hexPlate(b, x, z, 0.82, Math.PI / 6 + x, localGround(x, z) + 0.03, C.paver);
    },
    abords,
  );

  // ---- Le corps 1 sur 2 : la cour dégagée, les colonnes tombées débitées en gradins au pied du front.
  add(0, 0, steps);
  // ---- Le corps 2 sur 2 : le front refait, les trois places reprises, les têtes recoupées net, toujours inégales.
  add(0, 0.5, (b) => COLUMNS.forEach((_, k) => column(b, k, false)));
  // ---- Le haut 1 sur 2 : la chèvre redressée, son mât, sa flèche, ses haubans.
  add(1, 0, derrick);
  // ---- Le haut 2 sur 2 : la poulie, la chaîne et sa chape vide ; la lanterne du mât, allumée dès qu'elle est posée.
  add(1, 0.5, hoist);
  // ---- Les abords : la cour pavée ; l'auvent de l'abri sur ses deux poteaux ; la lanterne du chemin.
  add(2, 0, (b) => {
    yard(b);
    awning(b, true);
    const P = PATH_LANTERN;
    const y = localGround(P.x, P.z);
    b.box({ x: P.x, y: y - 0.3, z: P.z }, [0.12, P.h + 0.3, 0.12], C.iron);
    lantern(b, { x: P.x, y: y + P.h + 0.02, z: P.z }, true, 0.85);
  });
}

// ---------- Les traces ----------

/** Où se pose chaque trace, depuis le centre du lieu ; aucune sur un chemin, aucune au sud de z = 5,5. */
const TRACE_SPOTS = {
  'past-participle': { x: 5.0, z: 4.0 },
  adjectives: { x: -2.2, z: -1.0 },
  'subject-verb': { x: 3.0, z: -3.2 },
  'reflexive-verbs': { x: -3.5, z: 3.0 },
  'tense-meaning': { x: 3.6, z: 2.4 },
} as const;

/** Dessine au centre du lieu (`c`), dans le monde, sur le sol sous `p`. */
function inWorld(b: FacetBuilder, c: Vec3, draw: (l: FacetBuilder, g: number) => void, p: Vec2): void {
  drawPosed(b, { x: c.x, y: c.y, z: c.z, yaw: 0 }, (l) => draw(l, localGround(p.x, p.z)));
}

/** Une corde enroulée sur un pieu droit, au bord est de la cour (Corde du participe) : jamais un piquet en croix. */
function ropeStake(b: FacetBuilder, c: Vec3): void {
  const p = TRACE_SPOTS['past-participle'];
  inWorld(b, c, (l, g) => {
    l.box({ x: p.x, y: g - 0.3, z: p.z }, [0.14, 1.25, 0.14], C.newShade, C.newWood);
    l.annulus({ x: p.x, y: g + 0.35, z: p.z }, 0.1, 0.32, 0.3, 8, C.rope, C.rope);
  }, p);
}

/** Une masse et un burin debout côte à côte dans un billot (Paroi des adjectifs) : jamais croisés. */
function billot(b: FacetBuilder, c: Vec3): void {
  const p = TRACE_SPOTS.adjectives;
  inWorld(b, c, (l, g) => {
    l.prism({ x: p.x, y: g - 0.1, z: p.z }, 0.34, 0.32, 0.6, 6, C.newShade, C.newWood);
    l.box({ x: p.x - 0.1, y: g + 0.45, z: p.z }, [0.07, 0.75, 0.07], C.newWood);
    l.box({ x: p.x - 0.1, y: g + 1.18, z: p.z }, [0.32, 0.18, 0.18], C.iron, C.ironTop);
    l.box({ x: p.x + 0.13, y: g + 0.45, z: p.z + 0.02 }, [0.06, 0.55, 0.06], C.iron, C.ironTop);
  }, p);
}

/** Une échelle de bois droite, appuyée contre le front (Sommet du sujet). */
function ladder(b: FacetBuilder, c: Vec3): void {
  const p = TRACE_SPOTS['subject-verb'];
  inWorld(b, c, (l, g) => {
    for (const s of [-0.24, 0.24]) l.beam({ x: p.x + s, y: g, z: p.z }, { x: p.x + s, y: g + 2.9, z: p.z - 0.85 }, 0.08, C.newShade);
    for (const f of [0.25, 0.5, 0.75]) l.box({ x: p.x, y: g + 2.9 * f, z: p.z - 0.85 * f }, [0.5, 0.06, 0.06], C.newWood);
  }, p);
}

/** Un bloc hexagonal taillé, posé sur deux rouleaux de bois, prêt à partir (Écho des pronominaux). */
function blockOnRollers(b: FacetBuilder, c: Vec3): void {
  const p = TRACE_SPOTS['reflexive-verbs'];
  inWorld(b, c, (l, g) => {
    for (const dz of [-0.35, 0.35]) l.drum({ x: p.x - 0.7, y: g + 0.12, z: p.z + dz, yaw: Math.PI / 2, pitch: Math.PI / 2 }, 0.12, 1.4, 5, C.newShade, C.newWood);
    hexColumn(l, p.x, p.z, 0.6, 0.2, g + 0.22, () => g + 0.9, [C.column, C.columnJoint], C.columnSun);
  }, p);
}

/** Un traîneau de bois chargé de pavés hexagonaux (Temps et ponctuation). */
function sled(b: FacetBuilder, c: Vec3): void {
  const p = TRACE_SPOTS['tense-meaning'];
  inWorld(b, c, (l, g) => {
    for (const s of [-0.4, 0.4]) l.box({ x: p.x + s, y: g, z: p.z, yaw: 0.3 }, [0.1, 0.14, 1.5], C.newShade, C.newWood);
    l.box({ x: p.x, y: g + 0.14, z: p.z, yaw: 0.3 }, [1.0, 0.07, 1.3], C.newShade, C.newWood);
    for (const [dx, dz] of [
      [-0.2, -0.3],
      [0.22, 0.05],
      [-0.15, 0.4],
    ] as const)
      hexColumn(l, p.x + dx, p.z + dz, 0.3, 0.4, g + 0.21, () => g + 0.36, [C.column, C.columnJoint], C.paver);
  }, p);
}

/** Les cinq traces, une par mission, chacune avec sa partie : des objets de la taille, jamais la notion, rien à lire. */
const TRACES = {
  'past-participle': { at: TRACE_SPOTS['past-participle'], lift: 1, stage: 0, row: 0, draw: ropeStake },
  adjectives: { at: TRACE_SPOTS.adjectives, lift: 1, stage: 0, row: 0.5, draw: billot },
  'subject-verb': { at: TRACE_SPOTS['subject-verb'], lift: 1, stage: 1, row: 0, draw: ladder },
  'reflexive-verbs': { at: TRACE_SPOTS['reflexive-verbs'], lift: 1, stage: 1, row: 0.5, draw: blockOnRollers },
  'tense-meaning': { at: TRACE_SPOTS['tense-meaning'], lift: 1, stage: 2, row: 0, draw: sled },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/**
 * Le cap de départ de la caméra de la scénette (intention, § 8) : vers le front et la chèvre, au nord-ouest (315°) ; les
 * colonnes au fond, la chèvre à gauche, une bande de mer au-dessus du front ; le cône hors du cadre, la cuvette derrière
 * la caméra. Elle regarde vers −(sin cap, cos cap).
 */
const SCENE_COMPASS = (315 * Math.PI) / 180;
const SCENE_START = Math.atan2(-Math.sin(SCENE_COMPASS), Math.cos(SCENE_COMPASS));

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers le carrier). */
const SCENE_RIGHT = { x: Math.cos(SCENE_START), z: -Math.sin(SCENE_START) } as const;

/** Le milieu de la scène, depuis le centre du lieu : devant l'abri, côté est de la cour. */
const SCENE_SPOT = { dx: 3.0, dz: 2.3, half: [2.3, 1.0] as [number, number] } as const;

/** L'écart de Kéo et du carrier au milieu de la scène. */
const SCENE_HALF = 1.9;

/** Le sol de la scène, les dalles de la cour, un cran au-dessus du sol (questionScene.ts, `sceneSpot`). */
const SCENE_RISE = 0.06;

/** Le carrier en pion (son modèle 3D prend sa place) : bottes, pantalon brun, chemise grise. */
function carrier(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.26, 0.24, 0.42, 8, C.trousers);
  b.prism({ x: at.x, y: at.y + 0.56, z: at.z }, 0.28, 0.24, 0.42, 8, C.shirt);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.29, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.35, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.shirt);
}

/** Le madrier bas des pavés : sa hauteur, le cran d'un pavé choisi, la taille d'un pavé. */
const BOARD = { height: 0.3, lift: 0.3, paver: 0.2, r: 0.24 } as const;

export const ORGUES: PlaceArt = {
  role: 'Le carrier',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a sa partie (`stage`, `row` : 2+2+1).
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    rise: SCENE_RISE,
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 2.9, depth: 0.3 },
    // Basse : la cour est plate ; le front, au fond, monte au-dessus de Kéo et du carrier.
    pitch: (12 * Math.PI) / 180,
    start: SCENE_START,
  },
  // Le décor de près : le dallage, l'abri et son auvent sont au lieu ; les abords (./orguesSurroundings.ts) ajoutent
  // deux blocs hexagonaux bas et une pierre. Il reste le carrier en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) carrier(b, at, sphere);
  },
  answer: {
    size: { height: BOARD.height + BOARD.lift + BOARD.paver, half: BOARD.r + 0.04 },
    facing: true,
    // Un madrier bas posé sur deux blocs, sous la rangée des pavés.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BOARD.height * s;
      b.box({ x: mid, y: top - 0.14 * s, z }, [span + 0.7, 0.14 * s, 0.4 * s], C.woodShade, C.wood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.3, top - 0.14 * s - foot, 0.36 * s], C.stoneShade, C.stone);
      }
    },
    // Un pavé hexagonal clair, plus clair que ceux de la cour ; choisi, il se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      const y = at.y + (BOARD.height + (picked ? BOARD.lift : 0)) * s;
      hexColumn(b, at.x, at.z, BOARD.r * s, 0, y, () => y + BOARD.paver * s, [C.answer, C.answer], C.answerTop);
    },
  },
  // Les cinq missions en R : le sol seul, rien de l'item ; les pavés portent les réponses.
  rest() {},
  traces: TRACES,
  // Kéo au retour : au pas de la porte, face au front.
  exit: { x: DOOR_AT.x - 0.9, z: DOOR_AT.z - 0.6 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan des Orgues, pour les tests et ses abords : le front, ses colonnes, la chèvre, l'abri, la cour, la caméra. */
export const ORGUES_LAYOUT = {
  frontZ,
  columns: COLUMNS,
  columnZ,
  tertre: TERTRE,
  steps: STEPS,
  derrick: DERRICK,
  shelter: SHELTER,
  yardDalles: YARD_DALLES,
  pathLantern: PATH_LANTERN,
  door: DOOR_AT,
  doorFrame: DOOR_FRAME,
  doorLook: DOOR_LOOK,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
  get heightAtCenter() {
    return h0();
  },
  /** Le basalte des colonnes et la pierre grise (ses abords en posent). */
  colors: { column: C.column, columnJoint: C.columnJoint, columnSun: C.columnSun, stone: C.stone, stoneShade: C.stoneShade, stoneSun: C.stoneSun },
} as const;
