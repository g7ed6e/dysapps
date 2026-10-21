// Le Donjon (GD-22, lot 13a ; intention du directeur artistique du 20 octobre 2026, partie 13a, B à I, planche
// `selection-donjon-oracle` validée par le mainteneur) : « une tour des Passeurs sur un piton, que chaque âge a
// reprise ». Le cœur, sans figure : la tour carrée à trois assises, lisibles dès la ruine, en bas les grandes pierres
// grises des Passeurs, au milieu des pierres plus petites et plus claires percées de hautes fentes de jour, en haut la
// brique sourde du parapet. Elle se dresse sur un piton de roche (5,5), sa porte au haut du piton, au sud, quatre marches
// frustes taillées sur son flanc ouest ; son sommet reste sous les aiguilles (18,5 au-dessus du plateau). Au pied du
// piton, à l'est, le logis de la maçonne, adossé à la roche ; au sud la cour de dalles chaudes, où la chaussée d'`aig-2`
// devient la dalle du lieu ; au bord ouest de la cour, le pilier du guet. Le blason, un écu sculpté d'un seul trait
// diagonal, est sur l'assise du milieu, face sud ; la lanterne du guet, à part, pend dans une niche sous le parapet.
// Le signe de l'absence : sur la face sud du pilier du guet, l'empreinte de la pièce prise, un aplat de pierre moins
// passée, son trou rond brun sombre dans son tiers haut et ses quatre goujons de fer aux quatre coins (la solution de
// l'Auberge, jamais la face 5 d'un dé) ; il ne change jamais.
//
// La ruine : tout est là, tombé ou cassé, jamais un chantier. Le haut de la tour est écroulé, sa coupe plate en biais, un
// coin plus haut que l'autre, ouverte au ciel, sans brique ni dent ; au pied du piton, trois blocs à facettes, les deux
// moitiés du blason en pierre claire (le trait visible sur chacune, l'une couchée, l'autre appuyée contre un bloc) et la
// herse couchée à plat, ses six barreaux parallèles ; la porte de la tour, son linteau sombre sans motif ; le logis aux
// murs debout, porte fermée, un volet qui pend, la moitié sud de son toit de lauze glissée d'un seul pan contre sa façade ;
// la cour aux dalles fendues, son côté ouest affaissé. Une seule lumière, celle de la maçonne, sur sa perche à côté de la
// porte du logis. Trois parties, une par mission (`stage`), et une trace avec chacune : l'auge à chaux (le corps), la
// brouette (le haut), la pile de trois dalles neuves (les abords). Rien ne bouge, rien à lire dans la 3D, rien de croisé.
// Retouche 1 (relectures du 21 octobre 2026, le directeur artistique fait foi) : la caméra de « Y aller » recule à la
// porte (`arrivalView`), le parapet en trois blocs par côté, les marches taillées, le signe de l'Auberge, le logis de
// pierre, le pan de toit devant le mur, les moitiés du blason claires, l'auge dans la scénette, la cour sans marche.
// Code pur (placeArt.ts).
import type { Stage } from './construction';
import { drawPosed, FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { lowRock } from './monteeSurroundings';
import { dryBush } from './fumerolles5e';
import { CAUSEWAY_5E } from './paths5e';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_5E, PATH_NODES_5E, PLACES_5E } from './plan5e';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter (places.ts). */
const SINK = -0.8;

/**
 * Les couleurs du Donjon : la pierre grise moussue du plateau (le piton, l'assise des Passeurs), la pierre claire de
 * l'assise du milieu et du logis (passée dans la ruine), la brique sourde du parapet, la lauze grise du toit, les dalles
 * chaudes de la cour et des chaussées et leurs joints, le bois des Passeurs (neuf, usé, le linteau sombre de la ruine),
 * le fer, le bronze des seules ferrures, le vert-de-gris des racines du linteau ; le dedans de la porte et du trou, brun
 * très sombre, jamais noir ; la pâte claire de l'auge. La seule lumière, l'ocre des lanternes.
 */
const C = {
  stone: COLORS_5E.stone,
  stoneSun: COLORS_5E.stoneSun,
  stoneShade: COLORS_5E.stoneShade,
  moss: COLORS_5E.plateauMoss,
  joint: 0x6d726c,
  pale: 0xb9ae98,
  paleTop: 0xc6bca6,
  paleWorn: 0xaca28c,
  paleJoint: 0x978d79,
  brick: 0x9a5a44,
  /** Le joint sombre de la brique, le dessus des blocs du parapet et le dessous de son débord. */
  brickDark: 0x88503d,
  /** Les faces intérieures du parapet, dans l'ombre : on lit l'ouverture du chemin de ronde de trois quarts. */
  parapetInside: COLORS_5E.stoneShade,
  slab: CAUSEWAY_5E.slab,
  slabShade: 0xb3ab9a,
  slabWorn: 0xbcb4a2,
  line: CAUSEWAY_5E.line,
  newWood: 0xa68672,
  newShade: 0x8c766a,
  wornWood: 0x9f9279,
  wornShade: 0x86775f,
  darkWood: 0x5e5046,
  door: 0x7d6650,
  inside: 0x3a312c,
  /** L'empreinte de la pièce prise, sur le pilier du guet : une pierre moins passée que le pilier. */
  markStone: 0x9c9f95,
  /** Le trait des moitiés du blason, plus sombre que la pierre claire où il est taillé. */
  blasonLine: 0x5f635d,
  /** Le fond du haut écroulé, vu du ciel : la pierre tombée dedans, plus sombre que les murs. */
  rubbleFloor: 0x6b675e,
  glass: 0x4f5a5e,
  lauze: 0x7e8580,
  lauzeEdge: 0x6a706b,
  verdigris: 0x6f9a8a,
  iron: 0x6f6a60,
  bronze: 0xb8954f,
  lantern: COLORS_5E.lantern,
  lime: 0xe6e0d2,
  // La maçonne, en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, pantalon brun, veste brique, cheveux
  // noirs (intention, E : le bonnet gris se perdrait dans la pierre).
  boots: 0x55595a,
  trousers: 0x6b5a46,
  vest: 0x9a5a44,
  skin: 0xd9a77f,
  hair: 0x3b3430,
  // Les claveaux des réponses : la pierre claire au soleil, leurs flancs un cran plus sombres.
  keystone: COLORS_5E.stoneSun,
  keystoneSide: 0x9b9e93,
} as const;

// ---------- Le repère du lieu ----------

/** Le centre du lieu et le sol sous lui, dans le monde. */
const CENTER: Vec2 = PLACES_5E.find((p) => p.id === 'donjon')!.center;
const H0 = standingHeight(heightAt5e(CENTER));

/** Le sol du 5e sous un point du repère du lieu, depuis le sol de son centre (comme `SiteGround.at`). */
const localGround = (lx: number, lz: number): number => standingHeight(heightAt5e({ x: CENTER.x + lx, z: CENTER.z + lz })) - H0;

/**
 * La cour de dalles, au sud du piton et du logis : de `x0` à `x1`, de `z0` (sous le piton et le logis) à `z1`, son bord
 * sud, juste au nord de la porte du lieu (en z = 8) : la chaussée d'`aig-2` y arrive et devient sa dalle.
 */
const COUR = { x0: -7.6, x1: 9.9, z0: 2.4, z1: 7.6 } as const;

/**
 * Le dessus de la cour (retouche 1 : « dans une cour, la chaussée devient la dalle sans marche ») : un plan qui suit la
 * pente douce du plateau sous elle (il monte vers l'est), ajusté au sol par moindres carrés puis levé pour passer `lift`
 * au moins au-dessus de lui, comme le dessus d'une chaussée : au nœud de la porte, il est à moins de 0,03 du disque de
 * dalle, et son bord sud ne montre qu'une tranche basse. `y` en x = z = 0, ses pentes `kx` et `kz`.
 */
const COUR_PLANE = (() => {
  const lift = 0.05;
  const pts: [number, number, number][] = [];
  for (let x = COUR.x0; x <= COUR.x1 + 1e-6; x += 0.875) for (let z = COUR.z0; z <= COUR.z1 + 1e-6; z += 0.65) pts.push([x, z, localGround(x, z)]);
  // Les moindres carrés d'un plan y = a + kx·x + kz·z, sur une grille régulière : les sommes centrées se séparent.
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n;
  const mz = pts.reduce((s, p) => s + p[1], 0) / n;
  const my = pts.reduce((s, p) => s + p[2], 0) / n;
  const kx = pts.reduce((s, p) => s + (p[0] - mx) * (p[2] - my), 0) / pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
  const kz = pts.reduce((s, p) => s + (p[1] - mz) * (p[2] - my), 0) / pts.reduce((s, p) => s + (p[1] - mz) ** 2, 0);
  const a = my - kx * mx - kz * mz;
  const above = Math.max(...pts.map(([x, z, g]) => g - (a + kx * x + kz * z)));
  return { y: a + above + lift, kx, kz };
})();

/** Le dessus de la cour en (`x`, `z`), depuis le sol du centre du lieu. */
const courAt = (x: number, z: number): number => COUR_PLANE.y + COUR_PLANE.kx * x + COUR_PLANE.kz * z;

/** Le piton de roche à six pans : son pied, son rayon au sol et en haut, sa hauteur au-dessus de la cour, son cap. */
const PITON = { x: 0, z: -2.2, r0: 5.8, r1: 4.0, h: 5.5, yaw: 0.25 } as const;

/**
 * La tour carrée sur le piton (hauteurs depuis la cour) : son milieu, sa demi-largeur ; son pied, un peu dans le piton ;
 * le haut de l'assise des Passeurs (`low`), celui de l'assise claire, où court le chemin de ronde (`mid`) ; la bande de
 * brique, en encorbellement de `over`, jusqu'à `band` ; le haut du parapet (`top`, 18,5 au-dessus du plateau, sous les
 * aiguilles) ; l'épaisseur de ses murs, ouverts au ciel dans la ruine. Retouche 1 : la brique, de `mid` à `top`, fait
 * 1,8 en tout, en encorbellement de 0,12 (un chemin de ronde, jamais un chapeau).
 */
const TOWER = { x: 0, z: -2.2, half: 2.4, base: 5.3, low: 10, mid: 16.4, band: 16.8, top: 18.2, over: 0.12, wall: 0.55 } as const;

/** Le dessus de la cour au pied de la tour : le repère des hauteurs de la tour et du piton. */
const PT = courAt(TOWER.x, TOWER.z);

/**
 * Le parapet : trois gros blocs plats par côté (`blocks`), d'un seul tenant, épais de `thick`, séparés par un joint
 * sombre debout de `joint` (jamais un vide : pas de créneau). Le joint en long, entre la bande et le parapet (`joints`,
 * hauteurs depuis la cour).
 */
const PARAPET = { thick: 0.5, blocks: 3, joint: 0.06, joints: [TOWER.band] } as const;

/** La face sud de la tour. */
const SOUTH = TOWER.z + TOWER.half;

/**
 * La coupe plate en biais de la ruine : le haut des murs suit un plan, plus haut au nord-ouest (14,5) qu'au sud-est
 * (12,7) ; `y` au milieu, `u` sa pente vers l'est, `v` vers le sud (depuis le milieu de la tour). Toujours dans l'assise
 * claire : la brique est tombée avec le haut. Le fond écroulé (`floor`), plus bas que le plus bas de la coupe : la
 * pierre tombée dedans.
 */
const CUT = { y: 13.6, u: -0.25, v: -0.12, floor: 12.2 } as const;
const cutAt = (x: number, z: number): number => CUT.y + CUT.u * (x - TOWER.x) + CUT.v * (z - TOWER.z);

/** La porte de la tour, au milieu de sa face sud, au haut du piton : sa demi-largeur, sa hauteur ; son linteau. */
const DOOR = { half: 0.65, h: 2.3, lintel: 0.32 } as const;

/** La herse : six barreaux droits, parallèles ; relevée à mi-hauteur, on ne voit que leur bas, sous le linteau. */
const HERSE = { bars: 6, bar: 0.09, hang: 1.05 } as const;

/** Le blason, sur l'assise claire, face sud, à l'ouest de la porte : son milieu ; un écu à cinq pans. */
const BLASON = { x: -1.15, y: 12.0, depth: 0.12 } as const;
const SHIELD: readonly (readonly [number, number])[] = [
  [-0.55, 0.6],
  [-0.55, -0.1],
  [0, -0.75],
  [0.55, -0.1],
  [0.55, 0.6],
];
/** Son seul trait diagonal, du haut à gauche vers le bas à droite : ses deux bouts, sa demi-largeur. */
const STROKE = { from: [-0.42, 0.42], to: [0.4, -0.3], half: 0.08 } as const;

/** La niche de la lanterne du guet, face sud, à l'est de la porte, sous le parapet (aux deux tiers de la tour). */
const NICHE = { x: 1.15, y0: 13.35, y1: 14.65, half: 0.36 } as const;

/** Les hautes fentes de jour de l'assise claire, sur les faces est, ouest et nord : leur bas, leur haut, leur demi-largeur. */
const SLIT = { y0: 11.0, y1: 12.3, half: 0.11 } as const;

/**
 * Les quatre marches taillées, frustes, sur le flanc ouest du piton : du pied, au sud-ouest, jusqu'au replat de la porte ;
 * leur largeur, leur giron. Retouche 1 : des marches, pas des piliers ; chacune une dalle de `riser` de haut au plus (sa
 * contremarche), le dessus clair au soleil, posée sur la roche du piton qui s'évase dessous (`flare` : son évasement par
 * unité de hauteur), jamais une face debout sombre jusqu'au sol.
 */
const STEPS = { from: { x: -6.4, z: 2.2 }, to: { x: -3.0, z: 0.4 }, count: 4, width: 1.3, tread: 1.15, riser: 0.8, flare: 0.3 } as const;

/**
 * Le logis de la maçonne, adossé au pied du piton à l'est : ses murs (de `x0` à `x1`, de `z0` à `z1`), leur hauteur ; son
 * toit de lauze à un pan, haut contre la roche, bas à l'est ; sa porte au sud ; sa fenêtre.
 */
const LOGIS = { x0: 4.4, x1: 9.6, z0: -1.6, z1: 2.4, wall: 2.6, high: 3.55, low: 2.75, eave: 0.35, slab: 0.18 } as const;
const LOGIS_DOOR = { x: 6.6, half: 0.45, h: 1.9 } as const;
const LOGIS_WINDOW = { x: 8.6, y: 1.55, half: 0.32 } as const;

/**
 * Les pierres du logis (retouche 1 : de la pierre, pas un cube de sable) : une assise basse de pierre des Passeurs, haute
 * de `base`, puis la pierre claire, ses deux rangs de joints (`rows`, depuis le sol du logis) et les joints debout de
 * chaque rang (`cuts`, depuis le bord ouest de la façade sud, puis depuis son bord sud sur la face est), décalés d'un rang
 * à l'autre, comme l'assise claire de la tour.
 */
const LOGIS_COURSES = {
  base: 0.6,
  rows: [1.27, 1.93],
  cuts: [
    [1.1, 3.0, 4.6],
    [0.5, 1.6, 3.6],
    [1.3, 2.9, 4.4],
  ],
} as const;

/** Le sol du logis : le dessus de la cour devant sa porte. */
const LY = courAt(LOGIS_DOOR.x, LOGIS.z1);

/**
 * La moitié sud du toit, glissée d'un seul pan contre la façade sud, à l'est de la perche (de `x0` à `x1`) : son haut à
 * `top` sous la fenêtre, contre le mur, son bord bas sur la cour en `z`.
 */
const ROOF_PAN = { x0: 8.1, x1: 10.4, z: 3.4, top: 1.1 } as const;

/** La perche de la maçonne, à droite de la porte du logis, et sa lanterne. */
const PERCH = { x: 7.6, z: 2.95, h: 2.0, arm: 0.34 } as const;

/**
 * Le pilier du guet, au bord ouest de la cour, à hauteur de poitrine (`w`, `h`). Sur sa face sud, le signe de l'absence,
 * comme le signe de la cloche à l'Auberge (`BELL_MARK`, ./auberge5e.ts) : l'empreinte de la pièce prise, un aplat debout
 * (`mark` × `markH`, son milieu à `y`), le trou rond (rayon `r`) dans son tiers haut (son milieu à `hole` au-dessus du
 * milieu de l'aplat), les quatre goujons de fer (`stud`) aux quatre coins, à `inset` du bord. Jamais le trou au milieu
 * d'un carré de goujons (la face 5 d'un dé), jamais une croix ni un viseur.
 */
const PILLAR = { x: -6.6, z: 5.4, w: 0.7, h: 1.35, y: 0.92, mark: 0.36, markH: 0.56, r: 0.075, hole: 0.16, inset: 0.04, stud: 0.06 } as const;

/** La lanterne sur piquet en tête de la cour, du côté de la chaussée (à l'ouest de son arrivée). */
const COUR_LANTERN = { x: -2.0, z: 8.1, h: 1.45 } as const;

/** La porte du lieu (le nœud du chemin), depuis son centre. */
const DOOR_AT: Vec2 = (() => {
  const n = PATH_NODES_5E.find((p) => p.id === 'donjon')!.at;
  return { x: n.x - CENTER.x, z: n.z - CENTER.z };
})();

/** Le recul de la caméra à la porte, en part de sa distance à Kéo (`PlaceArt.arrivalView`) : comme un Détour, 1,6 au plus. */
const ARRIVAL_BACK = 1.4;

/** Le cap d'un pavé dont le grand côté (x) va de `a` vers `b`. */
const yawOf = (a: Vec2, b: Vec2): number => Math.atan2(-(b.z - a.z), b.x - a.x);

// ---------- Les petits volumes ----------

/** Un aplat rectangulaire sur une face verticale : tourné vers le sud (`yaw` 0), l'est (π/2), le nord (π), l'ouest (−π/2). */
function facePlate(b: FacetBuilder, at: Vec3, yaw: number, w: number, h: number, color: number): void {
  b.plate(
    { ...at, yaw },
    [
      [-w / 2, 0],
      [w / 2, 0],
      [w / 2, h],
      [-w / 2, h],
    ],
    color,
  );
}

/** Les quatre faces de la tour : le point du milieu de chacune au ras du mur (`out` devant), le cap de son aplat, sa droite. */
function towerFaces(out: number): { at: Vec2; yaw: number; right: Vec2 }[] {
  const T = TOWER;
  const r = T.half + out;
  return [
    { at: { x: T.x, z: T.z + r }, yaw: 0, right: { x: 1, z: 0 } },
    { at: { x: T.x + r, z: T.z }, yaw: Math.PI / 2, right: { x: 0, z: -1 } },
    { at: { x: T.x, z: T.z - r }, yaw: Math.PI, right: { x: -1, z: 0 } },
    { at: { x: T.x - r, z: T.z }, yaw: -Math.PI / 2, right: { x: 0, z: 1 } },
  ];
}

/**
 * Les joints d'une assise sur les quatre faces : un joint en long à chaque hauteur de `rows` (sauf la première, le bas),
 * et dans chaque rang les joints debout de `cuts` (leur place depuis le milieu de la face), décalés d'un rang à l'autre ;
 * `top` : le haut de l'assise au droit d'un point de la face (la coupe en biais de la ruine).
 */
function courseJoints(b: FacetBuilder, rows: readonly number[], cuts: readonly (readonly number[])[], color: number, top?: (x: number, z: number) => number): void {
  const w = 2 * TOWER.half;
  for (const f of towerFaces(0.012)) {
    // Un joint en long ne passe que sous la coupe, d'un coin à l'autre de la face.
    const low = top ? Math.min(top(f.at.x - f.right.x * TOWER.half, f.at.z - f.right.z * TOWER.half), top(f.at.x + f.right.x * TOWER.half, f.at.z + f.right.z * TOWER.half)) - 0.15 : Infinity;
    for (let r = 1; r < rows.length - 1; r++) if (rows[r] < low) facePlate(b, { x: f.at.x, y: PT + rows[r] - 0.03, z: f.at.z }, f.yaw, w, 0.06, color);
    for (let r = 0; r < rows.length - 1; r++)
      for (const u of cuts[r % cuts.length]) {
        const x = f.at.x + f.right.x * u;
        const z = f.at.z + f.right.z * u;
        const hi = Math.min(rows[r + 1], top ? top(x, z) - 0.15 : Infinity);
        if (hi <= rows[r] + 0.2) continue;
        facePlate(b, { x, y: PT + rows[r], z }, f.yaw, 0.06, hi - rows[r], color);
      }
  }
}

/** Les rangs et les joints debout des deux assises : les grandes pierres des Passeurs, puis les plus petites, plus claires. */
const LOW_COURSES = { rows: [TOWER.base, 8.4, TOWER.low], cuts: [[-1.6, 1.3], [-1.2, 1.0]] } as const;
const MID_COURSES = {
  rows: [TOWER.low, 11.6, 13.3, 14.9, TOWER.mid],
  cuts: [
    [-1.4, -0.2, 1.1],
    [-0.8, 0.5, 1.7],
    [-1.6, -0.3, 1.0],
    [-1.0, 0.4, 1.6],
  ],
} as const;

/** L'assise des Passeurs : un pavé gris sur le piton, ses grandes pierres en joints nets. */
function lowCourse(b: FacetBuilder): void {
  const T = TOWER;
  b.box({ x: T.x, y: PT + T.base, z: T.z }, [2 * T.half, T.low - T.base, 2 * T.half], C.stone, C.stoneSun);
  courseJoints(b, LOW_COURSES.rows, LOW_COURSES.cuts, C.joint);
}

/** Les hautes fentes de jour, sur les faces est, nord et ouest (la face sud porte le blason et la niche). */
function slits(b: FacetBuilder): void {
  for (const f of towerFaces(0.015).slice(1)) facePlate(b, { x: f.at.x, y: PT + SLIT.y0, z: f.at.z }, f.yaw, 2 * SLIT.half, SLIT.y1 - SLIT.y0, C.inside);
}

/**
 * Un pavé dont le dessus suit la coupe en biais (`cutAt`) : de `x0` à `x1`, de `z0` à `z1`, du bas `y0` au plan ; ses
 * flancs de `color`, son dessus de `top`. Dix triangles, comme un pavé.
 */
function cutBox(b: FacetBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, color: number, top: number): void {
  const v = (x: number, z: number, up: boolean) => [x, up ? PT + cutAt(x, z) : y0, z] as const;
  b.quad(v(x0, z0, true), v(x0, z1, true), v(x1, z1, true), v(x1, z0, true), top);
  b.quad(v(x0, z1, false), v(x1, z1, false), v(x1, z1, true), v(x0, z1, true), color);
  b.quad(v(x1, z0, false), v(x0, z0, false), v(x0, z0, true), v(x1, z0, true), color);
  b.quad(v(x1, z1, false), v(x1, z0, false), v(x1, z0, true), v(x1, z1, true), color);
  b.quad(v(x0, z0, false), v(x0, z1, false), v(x0, z1, true), v(x0, z0, true), color);
}

/** La porte de la tour : l'embrasure brun très sombre, et son linteau, sombre et nu (la ruine) ou neuf, aux racines. */
function towerDoor(b: FacetBuilder, worn: boolean): void {
  const y = PT + PITON.h;
  facePlate(b, { x: TOWER.x, y, z: SOUTH + 0.012 }, 0, 2 * DOOR.half, DOOR.h, C.inside);
  b.box({ x: TOWER.x, y: y + DOOR.h, z: SOUTH + 0.12 }, [2 * DOOR.half + 0.5, DOOR.lintel, 0.24], worn ? C.darkWood : C.newShade, worn ? C.darkWood : C.newWood);
  if (worn) return;
  // Le motif des racines en vert-de-gris, sur la bande du linteau seulement : une onde, sans lettre ni chiffre.
  const fz = SOUTH + 0.245;
  const wave = [-0.8, -0.27, 0.27, 0.8].map((x, i) => [TOWER.x + x, y + DOOR.h + DOOR.lintel / 2 + (i % 2 ? 0.05 : -0.05)] as const);
  for (let i = 0; i < 3; i++) {
    const [ax, ay] = wave[i];
    const [cx, cy] = wave[i + 1];
    b.quad([ax, ay - 0.035, fz], [cx, cy - 0.035, fz], [cx, cy + 0.035, fz], [ax, ay + 0.035, fz], C.verdigris);
  }
}

/**
 * Les quatre marches taillées dans le flanc du piton : chacune une dalle de pierre, sa contremarche de `riser` au plus, son
 * dessus clair au soleil, sur la roche du piton qui s'évase jusqu'au sol (un tronc de pyramide à quatre pans, moussu) ;
 * dans la ruine, une seule a glissé de travers.
 */
function steps(b: FacetBuilder, worn: boolean): void {
  const S = STEPS;
  const yaw = yawOf(S.from, S.to);
  // Le haut de la roche dessous, à quatre pans tournés d'un huitième de tour : un carré du giron de la dalle.
  const r1 = (S.tread / 2) * Math.SQRT2;
  for (let k = 0; k < S.count; k++) {
    const t = k / (S.count - 1);
    const x = S.from.x + (S.to.x - S.from.x) * t;
    const z = S.from.z + (S.to.z - S.from.z) * t;
    const h = ((k + 1) * PITON.h) / S.count;
    const rock = h - S.riser;
    b.prism({ x, y: PT + SINK, z, yaw: yaw + Math.PI / 4 }, r1 + (rock - SINK) * S.flare, r1, rock - SINK, 4, C.stone, C.moss);
    const slip = worn && k === 1 ? 0.18 : 0;
    b.box({ x, y: PT + rock - (slip ? 0.1 : 0), z, yaw: yaw + slip }, [S.tread, S.riser, S.width], C.stone, C.stoneSun);
  }
}

/**
 * L'allure d'un écu : son échelle, son épaisseur, la couleur de ses faces et de ses côtés, celle de son trait et sa
 * demi-largeur (dans le repère de l'écu, avant l'échelle). Le blason entier, sur la tour : la pierre des Passeurs, un
 * trait fin. Ses deux moitiés tombées (retouche 1) : la pierre claire de l'assise du milieu, plus grandes, plus épaisses,
 * le trait plus sombre et plus large, pour qu'elles se lisent à la distance de « Y aller ».
 */
interface ShieldLook {
  scale: number;
  depth: number;
  face: number;
  edge: number;
  line: number;
  half: number;
}
const WHOLE_SHIELD: ShieldLook = { scale: 1, depth: BLASON.depth, face: C.stoneSun, edge: C.stoneShade, line: C.line, half: STROKE.half };
const HALF_SHIELD: ShieldLook = { scale: 1.5, depth: 0.25, face: C.pale, edge: C.paleWorn, line: C.blasonLine, half: 0.12 / 1.5 };

/**
 * Un écu, ou l'une de ses moitiés (`side` −1 : l'ouest, 1 : l'est), son trait diagonal sur sa face (`+z` du repère) ;
 * `turn` : tourné dans son plan (une moitié posée sur sa coupe), en radians.
 */
function shield(l: FacetBuilder, side: -1 | 0 | 1, look: ShieldLook = WHOLE_SHIELD, turn = 0): void {
  const outline: readonly (readonly [number, number])[] =
    side === 0
      ? SHIELD
      : side < 0
        ? [SHIELD[0], SHIELD[1], SHIELD[2], [0, SHIELD[0][1]]]
        : [[0, SHIELD[4][1]], SHIELD[2], SHIELD[3], SHIELD[4]];
  const [cs, sn] = [Math.cos(turn) * look.scale, Math.sin(turn) * look.scale];
  const place = (x: number, y: number): [number, number] => [x * cs - y * sn, x * sn + y * cs];
  l.extrude({ x: 0, y: 0, z: 0 }, outline.map(([x, y]) => place(x, y)), look.depth, look.edge, look.face);
  // Le trait, coupé au milieu pour une moitié : le même d'un bout à l'autre.
  const [ax, ay] = STROKE.from;
  const [cx, cy] = STROKE.to;
  const at = (x: number): [number, number] => [x, ay + ((cy - ay) * (x - ax)) / (cx - ax)];
  const [x0, x1] = side === 0 ? [ax, cx] : side < 0 ? [ax, 0] : [0, cx];
  const [p, q] = [at(x0), at(x1)];
  const h = look.half;
  const z = look.depth + 0.006;
  const [a, b2, c, d] = [place(p[0], p[1] - h), place(q[0], q[1] - h), place(q[0], q[1] + h), place(p[0], p[1] + h)];
  l.quad([a[0], a[1], z], [b2[0], b2[1], z], [c[0], c[1], z], [d[0], d[1], z], look.line);
}

/** Une lanterne pendue (sa vitre, un pavé : dix triangles ; son chapeau de bronze en pointe), allumée. */
function lantern(b: FacetBuilder, top: Vec3): void {
  b.box({ x: top.x, y: top.y - 0.34, z: top.z }, [0.24, 0.3, 0.24], C.lantern);
  b.prism({ x: top.x, y: top.y - 0.04, z: top.z, yaw: Math.PI / 4 }, 0.21, 0, 0.16, 4, C.bronze);
}

/** Le toit de lauze à un pan du logis, de `z0` sur `len` vers le sud : haut contre la roche, bas à l'est. */
function logisRoof(b: FacetBuilder, z0: number, len: number): void {
  const L = LOGIS;
  const slope = (L.high - L.low) / (L.x1 - L.x0);
  const hi = L.high + L.eave * slope;
  const lo = L.low - L.eave * slope;
  b.extrude(
    { x: 0, y: LY, z: z0 },
    [
      [L.x0 - L.eave, hi],
      [L.x1 + L.eave, lo],
      [L.x1 + L.eave, lo + L.slab],
      [L.x0 - L.eave, hi + L.slab],
    ],
    len,
    C.lauzeEdge,
    C.lauze,
  );
}

/**
 * Les joints des pierres du logis, sur sa façade sud et sa face est (la face nord et la face ouest sont contre la roche) :
 * les deux rangs en long, puis les joints debout de chaque rang ; jamais sur la porte ni sur la fenêtre.
 */
function logisJoints(b: FacetBuilder): void {
  const L = LOGIS;
  const K = LOGIS_COURSES;
  const W = LOGIS_WINDOW;
  const D = LOGIS_DOOR;
  // Les ouvertures de la façade sud (de gauche à droite, depuis son bord ouest) : leurs bords et leur bas, leur haut.
  const holes = [
    { u0: D.x - D.half - L.x0, u1: D.x + D.half - L.x0, y0: 0, y1: D.h },
    { u0: W.x - W.half - L.x0, u1: W.x + W.half - L.x0, y0: W.y - W.half, y1: W.y + W.half },
  ];
  const faces = [
    // La façade sud, d'ouest en est ; la face est, du sud au nord.
    { len: L.x1 - L.x0, at: (u: number) => ({ x: L.x0 + u, z: L.z1 + 0.012 }), yaw: 0, holes },
    { len: L.z1 - L.z0, at: (u: number) => ({ x: L.x1 + 0.012, z: L.z1 - u }), yaw: Math.PI / 2, holes: [] },
  ];
  const ys = [K.base, ...K.rows, L.wall];
  for (const f of faces) {
    // Un joint en long par rang, coupé aux ouvertures qu'il croise.
    for (const y of K.rows) {
      let u = 0;
      for (const h of [...f.holes.filter((o) => y > o.y0 && y < o.y1 + 0.03), { u0: f.len, u1: f.len }]) {
        if (h.u0 - u > 0.1) facePlate(b, { ...f.at((u + h.u0) / 2), y: LY + y - 0.03 }, f.yaw, h.u0 - u, 0.06, C.paleJoint);
        u = h.u1;
      }
    }
    // Les joints debout, décalés d'un rang à l'autre.
    for (let r = 0; r < ys.length - 1; r++)
      for (const u of K.cuts[r % K.cuts.length]) {
        if (u >= f.len - 0.2 || f.holes.some((o) => u > o.u0 - 0.1 && u < o.u1 + 0.1 && ys[r] < o.y1 && ys[r + 1] > o.y0)) continue;
        facePlate(b, { ...f.at(u), y: LY + ys[r] }, f.yaw, 0.06, ys[r + 1] - ys[r], C.paleJoint);
      }
  }
}

/**
 * Les murs du logis : l'assise basse de pierre des Passeurs, puis la pierre claire et ses joints ; sa porte fermée et sa
 * fenêtre à vitre sombre unie, jamais éclairée.
 */
function logisWalls(b: FacetBuilder, worn: boolean): void {
  const L = LOGIS;
  const [x, z, sx, sz] = [(L.x0 + L.x1) / 2, (L.z0 + L.z1) / 2, L.x1 - L.x0, L.z1 - L.z0];
  b.box({ x, y: LY + SINK, z }, [sx, LOGIS_COURSES.base - SINK, sz], C.stone);
  b.box({ x, y: LY + LOGIS_COURSES.base, z }, [sx, L.wall - LOGIS_COURSES.base, sz], worn ? C.paleWorn : C.pale, C.paleTop);
  logisJoints(b);
  facePlate(b, { x: LOGIS_DOOR.x, y: LY, z: L.z1 + 0.018 }, 0, 2 * LOGIS_DOOR.half, LOGIS_DOOR.h, worn ? C.wornShade : C.door);
  const W = LOGIS_WINDOW;
  facePlate(b, { x: W.x, y: LY + W.y - W.half, z: L.z1 + 0.018 }, 0, 2 * W.half, 2 * W.half, C.glass);
  if (worn) return;
  // La porte neuve : deux pentures de fer, parallèles.
  for (const y of [0.45, 1.4]) facePlate(b, { x: LOGIS_DOOR.x, y: LY + y, z: L.z1 + 0.026 }, 0, 2 * LOGIS_DOOR.half - 0.12, 0.08, C.iron);
}

/** La herse : six barreaux droits, parallèles, sans traverse ; `flat` : couchée au sol (la ruine), sinon relevée dans la porte. */
function herse(b: FacetBuilder, at: Vec3, flat: boolean): void {
  const H = HERSE;
  const span = 2 * DOOR.half - 0.2;
  for (let k = 0; k < H.bars; k++) {
    const x = -span / 2 + (span * k) / (H.bars - 1);
    if (flat) b.box({ x: at.x + x, y: at.y, z: at.z }, [H.bar + 0.03, 0.09, 2.1], C.wornShade, C.wornWood);
    else facePlate(b, { x: at.x + x, y: at.y - H.hang, z: at.z }, 0, H.bar, H.hang, C.newShade);
  }
}

/**
 * Une dalle de la cour, de `x0` à `x1` et de `z0` à `z1` : son dessus suit le plan de la cour (`courAt`), `dy` plus haut,
 * ses flancs descendent sous le sol. Dix triangles, comme un pavé.
 */
function courSlab(b: FacetBuilder, x0: number, x1: number, z0: number, z1: number, dy: number, side: number, top: number): void {
  const v = (x: number, z: number, up: boolean) => [x, courAt(x, z) + (up ? dy : SINK), z] as const;
  b.quad(v(x0, z1, true), v(x1, z1, true), v(x1, z0, true), v(x0, z0, true), top);
  b.quad(v(x0, z1, false), v(x1, z1, false), v(x1, z1, true), v(x0, z1, true), side);
  b.quad(v(x1, z0, false), v(x0, z0, false), v(x0, z0, true), v(x1, z0, true), side);
  b.quad(v(x1, z1, false), v(x1, z0, false), v(x1, z0, true), v(x1, z1, true), side);
  b.quad(v(x0, z0, false), v(x0, z1, false), v(x0, z1, true), v(x0, z0, true), side);
}

/** Un joint sur la cour, large de 0,06 : en long, de `x0` à `x1` (`z0` = `z1`), ou en travers, du sud (`z0`) au nord (`z1`). */
function courJoint(b: FacetBuilder, x0: number, z0: number, x1: number, z1: number): void {
  const v = (x: number, z: number) => [x, courAt(x, z) + 0.012, z] as const;
  if (z0 === z1) b.quad(v(x0, z0 + 0.03), v(x1, z0 + 0.03), v(x1, z0 - 0.03), v(x0, z0 - 0.03), C.line);
  else b.quad(v(x0 - 0.03, z0), v(x0 + 0.03, z0), v(x1 + 0.03, z1), v(x1 - 0.03, z1), C.line);
}

/** La cour entière : une grande dalle à facettes, ses dalles rectangulaires en long, en rangs décalés (jamais une grille). */
function cour(b: FacetBuilder): void {
  courSlab(b, COUR.x0, COUR.x1, COUR.z0, COUR.z1, 0, C.slabShade, C.slab);
  const rows = [COUR.z0, 4.2, 5.9, COUR.z1];
  for (const z of rows.slice(1, -1)) courJoint(b, COUR.x0, z, COUR.x1, z);
  for (let r = 0; r < rows.length - 1; r++) for (let x = COUR.x0 + 1.5 + (r % 2) * 1.5; x < COUR.x1 - 0.5; x += 3) courJoint(b, x, rows[r + 1], x, rows[r]);
}

// ---------- Le modèle ----------

/** Le signe de l'absence, sur la face sud du pilier du guet : l'empreinte, son trou dans son tiers haut, ses quatre goujons aux coins. */
function pillarMark(b: FacetBuilder): void {
  const Q = PILLAR;
  const z = Q.z + Q.w / 2;
  const y = courAt(Q.x, Q.z) + Q.y;
  b.plate(
    { x: Q.x, y, z: z + 0.004 },
    [
      [-Q.mark / 2, -Q.markH / 2],
      [Q.mark / 2, -Q.markH / 2],
      [Q.mark / 2, Q.markH / 2],
      [-Q.mark / 2, Q.markH / 2],
    ],
    C.markStone,
  );
  const hole = Array.from({ length: 8 }, (_, k) => [Q.r * Math.cos((Math.PI * k) / 4), Q.hole + Q.r * Math.sin((Math.PI * k) / 4)] as const);
  b.plate({ x: Q.x, y, z: z + 0.008 }, hole, C.inside);
  const dx = Q.mark / 2 - Q.inset;
  const dy = Q.markH / 2 - Q.inset;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) b.box({ x: Q.x + sx * dx, y: y + sy * dy - Q.stud / 2, z: z + 0.04 }, [Q.stud, Q.stud, 0.08], C.iron);
}

/**
 * La moitié sud du toit, glissée d'un seul pan contre la façade sud (`ROOF_PAN`) : une dalle de lauze penchée, son haut
 * contre le mur sous la fenêtre, son bord bas sur la cour ; son dessus, son bord bas et ses deux bouts (huit triangles :
 * le dessous et le haut sont contre le mur et la cour).
 */
function roofPan(b: FacetBuilder): void {
  const R = ROOF_PAN;
  const t = LOGIS.slab;
  const zt = LOGIS.z1 + 0.03;
  const yb = courAt((R.x0 + R.x1) / 2, R.z) - 0.02;
  const yt = LY + R.top;
  // La normale du dessus, vers le sud et le ciel (en z, y), et l'épaisseur portée dessous.
  const len = Math.hypot(R.z - zt, yt - yb);
  const [nz, ny] = [(yt - yb) / len, (R.z - zt) / len];
  const top = (x: number, high: boolean) => [x, high ? yt : yb, high ? zt : R.z] as const;
  const under = (x: number, high: boolean) => [x, (high ? yt : yb) - t * ny, (high ? zt : R.z) - t * nz] as const;
  b.quad(top(R.x0, false), top(R.x1, false), top(R.x1, true), top(R.x0, true), C.lauze);
  b.quad(under(R.x0, false), under(R.x1, false), top(R.x1, false), top(R.x0, false), C.lauzeEdge);
  b.quad(under(R.x1, false), under(R.x1, true), top(R.x1, true), top(R.x1, false), C.lauzeEdge);
  b.quad(under(R.x0, true), under(R.x0, false), top(R.x0, false), top(R.x0, true), C.lauzeEdge);
}

/**
 * Le haut de la tour, restauré : la bande de brique en encorbellement, le dessous de son débord dans l'ombre (et un trait
 * d'ombre sur le mur clair, juste dessous), le joint sombre en long entre la bande et le parapet ; puis le parapet, trois
 * gros blocs plats par côté, d'un seul tenant, séparés par un joint sombre debout (jamais un vide), leur dessus sombre et
 * leurs faces intérieures dans l'ombre.
 */
function parapet(b: FacetBuilder): void {
  const T = TOWER;
  const P = PARAPET;
  const o = T.half + T.over;
  const i = o - P.thick;
  const [mid, y0, y1] = [PT + T.mid, PT + T.band, PT + T.top];
  b.box({ x: T.x, y: mid, z: T.z }, [2 * o, T.band - T.mid, 2 * o], C.brick, C.brickDark);
  for (const f of towerFaces(0.012)) facePlate(b, { x: f.at.x, y: mid - 0.1, z: f.at.z }, f.yaw, 2 * T.half, 0.1, C.paleJoint);
  for (const f of towerFaces(T.over + 0.012)) for (const y of P.joints) facePlate(b, { x: f.at.x, y: PT + y - 0.03, z: f.at.z }, f.yaw, 2 * o, 0.06, C.brickDark);
  // Chaque côté, dessiné comme le sud (`a` le long de la face, d'ouest en est, `c` vers le dehors), tourné comme la face.
  const sides: readonly ((a: number, c: number) => [number, number])[] = [(a, c) => [a, c], (a, c) => [c, -a], (a, c) => [-a, -c], (a, c) => [-c, a]];
  for (const turn of sides) {
    const v = (a: number, y: number, c: number): [number, number, number] => {
      const [u, w] = turn(a, c);
      return [T.x + u, y, T.z + w];
    };
    // Le dessous du débord, entre le mur et le bord de la bande.
    b.quad(v(-T.half, mid, T.half), v(T.half, mid, T.half), v(o, mid, o), v(-o, mid, o), C.brickDark);
    b.quad(v(-o, y0, o), v(o, y0, o), v(o, y1, o), v(-o, y1, o), C.brick);
    b.quad(v(i, y0, i), v(-i, y0, i), v(-i, y1, i), v(i, y1, i), C.parapetInside);
    b.quad(v(-o, y1, o), v(o, y1, o), v(i, y1, i), v(-i, y1, i), C.brickDark);
  }
  for (const f of towerFaces(T.over + 0.012))
    for (let k = 1; k < P.blocks; k++) {
      const a = -o + (2 * o * k) / P.blocks;
      facePlate(b, { x: f.at.x + f.right.x * a, y: y0, z: f.at.z + f.right.z * a }, f.yaw, P.joint, T.top - T.band, C.brickDark);
    }
}

/**
 * Les volumes du Donjon, de la ruine aux abords (le modèle du lieu). `ground` : le sol sous un point du lieu ; sa porte
 * est au sud, au bout de la chaussée d'`aig-2`.
 */
function model(add: AddPiece, ground: SiteGround): void {
  const at = (x: number, z: number) => ground.at(x, z);
  const T = TOWER;
  const L = LOGIS;
  const corps = { stage: 0 as Stage, row: 0 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : le piton et sa mousse ; l'assise des Passeurs ; le pilier du guet et le signe de l'absence ; la perche
  // de la maçonne et sa lanterne allumée dès la ruine (la seule) ; deux buissons secs bas en dôme, un rocher qui cadre.
  add('ruine', 0, (b) => {
    const P = PITON;
    b.prism({ x: P.x, y: PT + SINK, z: P.z, yaw: P.yaw }, P.r0, P.r1, P.h - SINK, 6, C.stone, C.moss);
    lowCourse(b);
    const Q = PILLAR;
    b.box({ x: Q.x, y: courAt(Q.x, Q.z) - 0.05, z: Q.z }, [Q.w, Q.h + 0.05, Q.w], C.stone, C.stoneSun);
    pillarMark(b);
    const py = courAt(PERCH.x, PERCH.z);
    b.box({ x: PERCH.x, y: py - 0.4, z: PERCH.z }, [0.1, PERCH.h + 0.4, 0.1], C.newShade);
    const tip = { x: PERCH.x - PERCH.arm, y: py + PERCH.h - 0.05, z: PERCH.z };
    b.beam({ x: PERCH.x, y: tip.y, z: PERCH.z }, tip, 0.08, C.newShade);
    lantern(b, { ...tip, y: tip.y - 0.04 });
    dryBush(b, -9.4, at(-9.4, 0.8), 0.8, 0.8, 0.4);
    dryBush(b, 11.3, at(11.3, -2.6), -2.6, 0.7, 1.2);
    lowRock(b, { x: -6.2, y: at(-6.2, 10.6), z: 10.6 }, 1.1, 0.55, 23);
  });

  // ---- La ruine ----
  // Le corps la relève : l'assise claire écroulée en biais, ouverte au ciel ; la porte et son linteau sombre ; les marches
  // frustes ; les trois blocs, les moitiés du blason et la herse au pied du piton ; le logis passé, sa porte fermée, son
  // volet qui pend.
  add(
    'ruine',
    0,
    (b) => {
      const w = T.wall;
      const [x0, x1, z0, z1] = [T.x - T.half, T.x + T.half, T.z - T.half, T.z + T.half];
      const y0 = PT + T.low;
      cutBox(b, x0, x1, z1 - w, z1, y0, C.paleWorn, C.paleTop);
      cutBox(b, x0, x1, z0, z0 + w, y0, C.paleWorn, C.paleTop);
      cutBox(b, x1 - w, x1, z0 + w, z1 - w, y0, C.paleWorn, C.paleTop);
      cutBox(b, x0, x0 + w, z0 + w, z1 - w, y0, C.paleWorn, C.paleTop);
      // Le fond, plus bas que la coupe : la pierre tombée dedans.
      const f = T.half - w;
      b.plate(
        { x: T.x, y: PT + CUT.floor, z: T.z, pitch: -Math.PI / 2 },
        [
          [-f, -f],
          [f, -f],
          [f, f],
          [-f, f],
        ],
        C.rubbleFloor,
      );
      courseJoints(b, MID_COURSES.rows, MID_COURSES.cuts, C.paleJoint, cutAt);
      slits(b);
      towerDoor(b, true);
      steps(b, true);
      // Les trois gros blocs à facettes, au pied du piton, à l'ouest, à l'écart des marches et de la cour.
      for (const [x, z, r, h, seed] of [
        [-5.2, 3.5, 0.95, 0.85, 3],
        [-2.2, 3.4, 0.75, 0.6, 5],
        [3.6, 3.2, 0.7, 0.55, 7],
      ] as const)
        lowRock(b, { x, y: courAt(x, z), z }, r, h, seed);
      // Les deux moitiés du blason, en pierre claire : l'une couchée face au ciel, l'autre posée sur sa coupe, appuyée
      // contre le bloc du milieu, tournée vers le sud ; le trait visible sur chacune.
      drawPosed(b, { x: 0.2, y: courAt(0.2, 4.3) + 0.01, z: 4.3, yaw: 0.35, pitch: -Math.PI / 2 }, (l) => shield(l, 1, HALF_SHIELD));
      drawPosed(b, { x: -2.2, y: courAt(-2.2, 4.25), z: 4.25, yaw: 0, pitch: -0.25 }, (l) => shield(l, -1, HALF_SHIELD, -Math.PI / 2));
      // La herse couchée à plat, ses six barreaux parallèles, entre les blocs, hors de la scène.
      herse(b, { x: -4.3, y: courAt(-4.3, 5.5), z: 5.5 }, true);
      logisWalls(b, true);
      // Le volet qui pend de travers, à droite de la fenêtre.
      const W = LOGIS_WINDOW;
      const a = -0.45;
      const hang = (
        [
          [-0.17, -0.7],
          [0.17, -0.7],
          [0.17, 0],
          [-0.17, 0],
        ] as const
      ).map(([px, py]) => [px * Math.cos(a) - py * Math.sin(a), px * Math.sin(a) + py * Math.cos(a)] as const);
      b.plate({ x: W.x + W.half + 0.2, y: LY + W.y + W.half, z: L.z1 + 0.03 }, hang, C.wornShade);
    },
    corps,
  );
  // Le haut la relève : la moitié nord du toit de lauze, restée sur les murs ; l'autre moitié, glissée d'un seul pan
  // contre la façade sud, à l'est de la perche.
  add(
    'ruine',
    0,
    (b) => {
      const z0 = L.z0 - L.eave;
      const len = L.z1 - L.z0 + 2 * L.eave;
      logisRoof(b, z0, len / 2);
      roofPan(b);
    },
    haut,
  );
  // Les abords la relèvent : la cour aux dalles fendues, un peu sous la dalle neuve, son côté ouest affaissé, trois
  // dalles soulevées de travers à l'écart du chemin, de la scène et du pan de toit.
  add(
    'ruine',
    0,
    (b) => {
      const split = -4.2;
      courSlab(b, split, COUR.x1, COUR.z0, COUR.z1, -0.04, C.slabShade, C.slabWorn);
      // Le côté ouest, affaissé vers l'ouest (un pavé basculé autour de l'axe nord-sud).
      const [wx, wz] = [(COUR.x0 + split) / 2, (COUR.z0 + COUR.z1) / 2];
      b.box({ x: wx, y: courAt(wx, wz) + SINK + 0.05, z: wz, yaw: Math.PI / 2, pitch: -0.06 }, [COUR.z1 - COUR.z0, -SINK - 0.2, split - COUR.x0], C.slabShade, C.slabWorn);
      for (const [x, z, yaw, pitch] of [
        [-2.6, 6.9, 0.3, 0.12],
        [8.4, 6.8, -0.2, -0.1],
        [9.4, 4.6, 0.5, 0.09],
      ] as const)
        b.box({ x, y: courAt(x, z) - 0.1, z, yaw, pitch }, [1.2, 0.16, 0.8], C.slabShade, C.slabWorn);
      // Deux fentes en long, d'un ton de joint, sur la dalle restée à plat.
      const v = (x: number, z: number) => [x, courAt(x, z) - 0.028, z] as const;
      for (const [x, z, len] of [
        [1.4, 5.6, 2.6],
        [6.2, 7.1, 1.8],
      ] as const)
        b.quad(v(x, z + 0.03), v(x + len, z - 0.25), v(x + len, z - 0.31), v(x, z - 0.03), C.line);
    },
    abords,
  );

  // ---- Le corps : la tour jusqu'au chemin de ronde, l'assise claire refaite, joints nets, ses fentes ; le blason entier ;
  // la porte et son linteau à la bande de racines ; la herse relevée à mi-hauteur ; les quatre marches ; le logis, murs
  // refaits, sans toit.
  add(0, 0, (b) => {
    b.box({ x: T.x, y: PT + T.low, z: T.z }, [2 * T.half, T.mid - T.low, 2 * T.half], C.pale, C.paleTop);
    courseJoints(b, MID_COURSES.rows, MID_COURSES.cuts, C.paleJoint);
    slits(b);
    drawPosed(b, { x: TOWER.x + BLASON.x, y: PT + BLASON.y, z: SOUTH + 0.005, yaw: 0 }, (l) => shield(l, 0));
    towerDoor(b, false);
    herse(b, { x: TOWER.x, y: PT + PITON.h + DOOR.h, z: SOUTH + 0.025 }, false);
    steps(b, false);
    logisWalls(b, false);
  });
  // Le haut : la bande de brique et le parapet de gros blocs plats, trois par côté (jamais de créneaux) ; la niche et la
  // lanterne du guet, sous le chemin de ronde, allumée dès qu'elle est posée ; le toit de lauze du logis, entier.
  add(1, 0, (b) => {
    parapet(b);
    const N = NICHE;
    facePlate(b, { x: T.x + N.x, y: PT + N.y0, z: SOUTH + 0.03 }, 0, 2 * N.half, N.y1 - N.y0, C.inside);
    b.box({ x: T.x + N.x, y: PT + N.y1 - 0.12, z: SOUTH + 0.15 }, [0.07, 0.07, 0.26], C.iron);
    lantern(b, { x: T.x + N.x, y: PT + N.y1 - 0.12, z: SOUTH + 0.27 });
    logisRoof(b, L.z0 - L.eave, L.z1 - L.z0 + 2 * L.eave);
  });
  // Les abords : la cour de dalles entière ; la bordure de pierres brutes basses (hors de l'arrivée de la chaussée) ; la
  // lanterne sur piquet en tête de la cour, du côté de la chaussée, allumée dès qu'elle est posée.
  add(2, 0, (b) => {
    cour(b);
    for (const [x, z, seed] of [
      [-8.1, 3.6, 41],
      [-8.1, 6.4, 43],
      [-6.2, 8.1, 45],
      [-4.0, 8.1, 47],
      [4.2, 8.1, 49],
      [6.8, 8.1, 51],
      [9.4, 8.1, 53],
      [10.4, 5.2, 55],
    ] as const)
      lowRock(b, { x, y: at(x, z), z }, 0.45, 0.32, seed);
    const Lp = COUR_LANTERN;
    b.box({ x: Lp.x, y: at(Lp.x, Lp.z) - 0.3, z: Lp.z }, [0.1, Lp.h + 0.3, 0.1], C.newShade);
    lantern(b, { x: Lp.x, y: at(Lp.x, Lp.z) + Lp.h + 0.02, z: Lp.z });
  });
}

// ---------- Les traces ----------

/** Dessine dans le repère du lieu, puis pose le dessin au centre du lieu (`c`), dans le monde. */
function inWorld(b: FacetBuilder, c: Vec3, draw: (l: FacetBuilder) => void): void {
  const l = new FacetBuilder();
  draw(l);
  const f = l.build();
  for (let i = 0; i < f.positions.length; i += 3) {
    f.positions[i] += c.x;
    f.positions[i + 1] += c.y;
    f.positions[i + 2] += c.z;
  }
  b.append(f);
}

/** Où se pose la trace de chaque mission, depuis le centre du lieu. */
const TRACE_SPOTS = {
  // L'auge, contre le mur du logis, à gauche de sa porte (entre Kéo et la maçonne, jamais derrière elle).
  trough: { x: 5.15, z: LOGIS.z1 + 0.42 },
  // La brouette, garée contre le piton, au sud-ouest, à l'écart des marches et du pilier.
  barrow: { x: -2.6, z: 4.1, yaw: 0.25 },
  // La pile, au bord est de la cour, loin des marches et du pilier.
  pile: { x: 8.7, z: 5.9 },
} as const;

/**
 * L'auge à chaux (Chrétientés et islam) : un bac de bois bas à deux poignées, plein d'une pâte claire unie, une
 * planchette à poignée posée à plat dedans.
 */
function trough(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const S = TRACE_SPOTS.trough;
    const y = courAt(S.x, S.z);
    l.box({ x: S.x, y, z: S.z }, [1.15, 0.38, 0.62], C.newShade, C.newShade);
    l.plate({ x: S.x, y: y + 0.39, z: S.z, pitch: -Math.PI / 2 }, [
      [-0.5, -0.24],
      [0.5, -0.24],
      [0.5, 0.24],
      [-0.5, 0.24],
    ], C.lime);
    for (const s of [-1, 1]) l.box({ x: S.x + s * 0.66, y: y + 0.24, z: S.z }, [0.18, 0.07, 0.24], C.newShade);
    l.box({ x: S.x - 0.12, y: y + 0.4, z: S.z + 0.02, yaw: 0.15 }, [0.46, 0.035, 0.24], C.newShade, C.newWood);
    l.box({ x: S.x + 0.18, y: y + 0.43, z: S.z + 0.04, yaw: 0.15 }, [0.07, 0.12, 0.07], C.newShade);
  });
}

/**
 * La brouette (L'Occident féodal) : une seule roue pleine à six pans, sans rayons, deux brancards parallèles, deux
 * moellons bruts dedans, garée contre le piton.
 */
function barrow(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) =>
    drawPosed(l, { x: TRACE_SPOTS.barrow.x, y: courAt(TRACE_SPOTS.barrow.x, TRACE_SPOTS.barrow.z), z: TRACE_SPOTS.barrow.z, yaw: TRACE_SPOTS.barrow.yaw }, (q) => {
      q.box({ x: 0, y: 0.32, z: 0 }, [1.1, 0.12, 0.72], C.newShade, C.newWood);
      for (const dz of [-0.3, 0.3]) {
        q.box({ x: -0.4, y: 0, z: dz }, [0.08, 0.32, 0.08], C.newShade);
        q.beam({ x: 0.65, y: 0.3, z: dz }, { x: -0.95, y: 0.5, z: dz }, 0.07, C.newShade);
      }
      q.drum({ x: 0.7, y: 0.26, z: -0.06, pitch: Math.PI / 2 }, 0.26, 0.12, 6, C.newShade, C.newWood);
      for (const [dx, yaw, s] of [
        [-0.2, 0.3, 0.36],
        [0.2, 1.1, 0.32],
      ] as const)
        q.box({ x: dx, y: 0.44, z: 0, yaw }, [s, s * 0.75, s * 0.9], C.stoneShade, C.stone);
    }),
  );
}

/** La pile de trois dalles neuves (Vers les Temps modernes) : de la teinte de la cour, à plat, décalées, sur deux cales. */
function pile(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const S = TRACE_SPOTS.pile;
    const y = courAt(S.x, S.z);
    for (const dx of [-0.38, 0.38]) l.box({ x: S.x + dx, y, z: S.z }, [0.16, 0.12, 0.95], C.newShade, C.newWood);
    for (let k = 0; k < 3; k++) l.box({ x: S.x + 0.12 * (k - 1), y: y + 0.12 + 0.13 * k, z: S.z + 0.1 * (k - 1) }, [1.3, 0.13, 0.85], C.slabShade, C.slab);
  });
}

// ---------- La scénette ----------

/** Le milieu de la scène, depuis le centre du lieu : sur la cour, devant le logis, sa porte derrière, le piton à gauche. */
const SCENE_SPOT = { dx: 4.3, dz: 5.0, half: [3.4, 1.0] as [number, number] } as const;

/** La hauteur du sol de la scène au-dessus de son point (le plus haut du sol sous sa plate-forme) : le dessus de la cour. */
const SCENE_RISE = (() => {
  const [hx, hz] = SCENE_SPOT.half;
  const nx = Math.ceil(hx),
    nz = Math.ceil(hz);
  let top = localGround(SCENE_SPOT.dx, SCENE_SPOT.dz);
  for (let i = -nx; i <= nx; i++) for (let k = -nz; k <= nz; k++) top = Math.max(top, localGround(SCENE_SPOT.dx + (i / nx) * hx, SCENE_SPOT.dz + (k / nz) * hz));
  return courAt(SCENE_SPOT.dx, SCENE_SPOT.dz) - top;
})();

/** La maçonne en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, pantalon, veste brique, cheveux noirs. */
function mason(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) {
    b.prism({ x: at.x + side * 0.12, y: at.y, z: at.z }, 0.11, 0.11, 0.18, 6, C.boots);
    b.prism({ x: at.x + side * 0.12, y: at.y + 0.18, z: at.z }, 0.13, 0.12, 0.36, 6, C.trousers);
  }
  b.prism({ x: at.x, y: at.y + 0.52, z: at.z }, 0.28, 0.26, 0.46, 8, C.vest);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.skin);
  b.prism({ x: at.x, y: at.y + 1.16, z: at.z - 0.03 }, 0.22, 0.12, 0.2, 8, C.hair);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.3, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.36, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.vest);
}

/** Le banc de bois des réponses : sa hauteur, à l'échelle 1 ; un claveau choisi se soulève d'un cran. */
const BENCH = { height: 0.5, lift: 0.2 } as const;

/** Le profil d'un claveau : un trapèze, plus large en haut, à bords nets (jamais un cube), de 0,34 de haut. */
const KEYSTONE: readonly (readonly [number, number])[] = [
  [-0.14, 0],
  [0.14, 0],
  [0.22, 0.34],
  [-0.22, 0.34],
];

/** Un claveau de pierre claire, à l'échelle `s`, posé debout, sa face vers la caméra. Douze triangles. */
function keystone(b: FacetBuilder, at: Vec3, s: number): void {
  b.extrude(
    { x: at.x, y: at.y, z: at.z - 0.16 * s },
    KEYSTONE.map(([x, y]) => [x * s, y * s] as const),
    0.32 * s,
    C.keystoneSide,
    C.keystone,
  );
}

export const DONJON: PlaceArt = {
  role: 'La maçonne',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a la sienne (`stage`) : elle se montre quand sa mission est
  // réussie et que son étape est posée.
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    rise: SCENE_RISE,
    keo: { dx: -2.3, dz: 0.3, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.3, dz: 0.3 },
    subject: { halfWidth: 3.4, bottom: -0.5, top: 3.2, depth: 0.3 },
    pitch: (14 * Math.PI) / 180,
  },
  // Le décor de près : le plancher est la cour du lieu, la façade du logis et sa porte derrière, le pied du piton à
  // gauche ; le rocher et le buisson qui cadrent sont aux abords (./donjonSurroundings.ts). Il reste la maçonne en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) mason(b, at, sphere);
  },
  answer: {
    size: { height: BENCH.height + BENCH.lift + 0.34, half: 0.3 },
    // Un banc de bois sur deux pieds pleins, sous la rangée des claveaux.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BENCH.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.6 * s], C.newShade, C.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.14, top - 0.08 * s - foot, 0.5 * s], C.newShade);
      }
    },
    // Un claveau posé sur le banc ; choisi, il se soulève d'un cran (sa place le dit, jamais sa couleur seule).
    object(b, at, s, _i, _count, picked) {
      keystone(b, { x: at.x, y: at.y + (BENCH.height + (picked ? BENCH.lift : 0)) * s, z: at.z }, s);
    },
  },
  // Les trois missions en R : la cour seule, rien de l'item ; les claveaux portent les réponses.
  rest() {},
  traces: {
    'christendoms-islam': { at: TRACE_SPOTS.trough, lift: 1, stage: 0, draw: trough },
    'feudal-west': { at: TRACE_SPOTS.barrow, lift: 1.2, stage: 1, draw: barrow },
    'new-worlds': { at: TRACE_SPOTS.pile, lift: 0.8, stage: 2, draw: pile },
  },
  // Kéo au retour : sur la chaussée, à l'arrivée dans la cour, face à la tour.
  exit: { x: 0.6, z: 8.8 },
  // « Y aller » arrive au cap nord, de face (la porte du lieu est au sud), sans `doorView`. De la porte, la caméra qui
  // suit coupait la tour au-dessus de sa porte (retouche 1) : arrêté là, elle recule de 1,4 fois sa distance, sans
  // monter, et lève le regard jusqu'au haut de la tour tel qu'il est bâti : la tour entière avec du ciel au-dessus, Kéo au
  // premier plan sur la chaussée, le logis à droite et le pilier du guet à gauche (un test le vérifie).
  arrivalView: { look: { x: TOWER.x, z: SOUTH + TOWER.over }, back: ARRIVAL_BACK },
  // L'auge, la brouette et la pile restent dans le cadre de la scénette (retouche 1 : l'élève y voit ce qu'il a déjà
  // fait) ; elle ne dessine aucune réussite à leur place.
  keepsTracesInScenette: true,
  // Sur la Carte, « Le Donjon » au nord de la tour, de son côté : il ne couvre pas le petit lieu de l'Oracle, au sud.
  nameAbove: true,
};

/** Le plan du Donjon, pour les tests : la tour, le piton, la cour, le logis, le pilier, la porte, la scène. */
export const DONJON_LAYOUT = {
  tower: TOWER,
  piton: PITON,
  cut: cutAt,
  cour: COUR,
  courTop: PT,
  courAt,
  logis: LOGIS,
  roofPan: ROOF_PAN,
  parapet: PARAPET,
  cutFloor: CUT.floor,
  perch: PERCH,
  pillar: PILLAR,
  niche: NICHE,
  blason: BLASON,
  stroke: STROKE,
  herse: HERSE,
  steps: STEPS,
  door: DOOR_AT,
  scene: SCENE_SPOT,
  heightAtCenter: H0,
} as const;
