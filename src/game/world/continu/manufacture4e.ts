// La Manufacture (lot 3 du monde ouvert du 4e, le Bastion, GD-24 ; intention du directeur artistique du 22 octobre 2026,
// planche `selection-bastion-v1` validée par le mainteneur le même jour, rangée 2) : « la grande filature des Passeurs,
// sur la pointe : sous sa verrière, les machines ont changé la façon de travailler ». Le troisième lieu fini du Bastion,
// sur le gabarit de la Soute et de la Porte (./soute4e.ts, ./porte4e.ts : une partie par plan). Une longue halle de brique
// couchée d'est en ouest, ses hautes baies cintrées, son chaperon de pierre grise, une seule ligne de toit continue de
// tôle rouge sombre, et au faîte, d'un pignon à l'autre, la verrière en bande surélevée (un lanterneau à cadre de fer
// sombre, qui se lit aussi au pignon ouest, depuis les Fabriques et le pont) ; aucune cheminée, aucune fumée. Dedans, une
// rangée de colonnes de fonte au milieu, les six métiers à tisser en deux rangs, l'arbre de transmission sous le faîte ; à
// l'est, dans la travée ouverte par une grande baie, la machine à balancier (sa colonne cannelée, son balancier, une
// plaque de fonte en ovale pointu, jamais un tube, et son volant debout dans sa fosse) ; à l'ouest, sous la dernière
// travée, le coin du tisserand. Au flanc de la colonne de la machine, sur le petit support du régulateur, le signe de
// l'absence du 4e : la ferrure vide à deux chevilles nues (le régulateur est sur le Rafiot), la même avant et après.
//
// La halle est posée au nord de sa cour, assez loin de la porte (au bout de `bas-1`) pour que la caméra qui suit, tournée
// de tous côtés autour de Kéo, reste toujours hors d'elle, au-dessus de son toit. La ruine (intention, « La ruine ») : le
// mur nord debout à mi-hauteur, ses baies ouvertes ; le mur sud debout à l'ouest et tombé bas à l'est, là où la machine se
// voit ; cinq colonnes debout, la cinquième couchée au nord de l'axe ; les fermes rouillées au nord, deux seulement au
// sud, à l'ouest ; la tôle tombée, sauf sur la dernière travée ouest ; le faîte entier, la bande de verre en place sur sa
// moitié ouest, trois cadres vides sur sa moitié est ; le balancier couché à plat au pied de sa colonne, du côté opposé au
// volant ; les métiers de travers, un couché, un sans son ensouple du haut ; les courroies à plat au sol ; l'arbre pendu
// d'un bout. Une seule lumière, la lanterne du tisserand. Trois parties (une par plan) : le corps, le haut, les abords.
// Une trace par mission, avec sa partie. Rien à lire, rien de croisé, rien qui bouge. Code pur (placeArt.ts).
import type { Stage } from './construction';
import { FacetBuilder, drawPosed } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { inWorld, lantern, localGround4e, quadOut, sheet, wallRun } from './place4eKit';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_4E, PATH_NODES_4E, PLACES_4E } from './plan4e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter (places.ts). */
const SINK = -0.8;

type P3 = readonly [number, number, number];

/**
 * Les couleurs de la Manufacture : la brique de l'usine et le chaperon de pierre grise (`COLORS_4E`) ; la rouille de la
 * ruine seulement ; le fer restauré bruni sombre (la fonte, les fermes, le cadre de la verrière) ; la tôle du toit, rouge
 * sombre, son dessous un cran plus sombre ; le verre gris-bleu pâle et mat de la verrière, jamais un reflet ; le bois
 * sombre des métiers, le bois clair du métier à bras ; le cuir brun des courroies, jamais orange ; le fil écru, la toile
 * unie, l'osier ; le dallage de la halle et de la cour.
 */
const C = {
  brick: COLORS_4E.brick,
  brickShade: COLORS_4E.brickShade,
  stone: COLORS_4E.stone,
  stoneSun: COLORS_4E.stoneSun,
  stoneShade: COLORS_4E.stoneShade,
  rust: COLORS_4E.rust,
  rustShade: COLORS_4E.rustShade,
  rustDull: 0x6a483e,
  rustDullTop: 0x74524a,
  iron: 0x5c504c,
  ironTop: 0x6c5e58,
  roof: 0x74403a,
  roofUnder: 0x5e3a34,
  glass: 0x9fb4b8,
  loom: 0x6a5446,
  loomShade: 0x58463a,
  lightWood: 0xa68672,
  lightShade: 0x8c766a,
  leather: 0x6e5040,
  thread: 0xd8cdb4,
  cloth: 0xd2c8b4,
  wicker: 0x9c8660,
  wickerShade: 0x86724f,
  floor: 0x9e948a,
  paving: 0xb0a598,
  joint: 0x8a8078,
  wood: COLORS_4E.wood,
  woodShade: COLORS_4E.woodShade,
  // Le tisserand, en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, tablier, chemise.
  boots: 0x55595a,
  apron: 0x6a6458,
  shirt: 0x9a8e7a,
  head: 0xd9a47c,
} as const;

// ---------- Le repère du lieu ----------

const CENTER: Vec2 = PLACES_4E.find((p) => p.id === 'manufacture')!.center;

/** Le sol du 4e sous un point du repère du lieu, depuis le sol de son centre. */
const localGround = localGround4e(CENTER);

const toLocal = (p: Vec2): Vec2 => ({ x: p.x - CENTER.x, z: p.z - CENTER.z });

/** Le pas de la porte, au bout de son chemin (`bas-1`), depuis le centre. */
const DOOR_AT: Vec2 = toLocal(PATH_NODES_4E.find((p) => p.id === 'manufacture')!.at);

/**
 * La halle, d'est en ouest (20 sur 9) : ses murs (x d'ouest en est, z du nord au sud, sur l'axe des murs), leur épaisseur ;
 * le haut des murs restaurés (`eaves`) ; la tôle monte jusqu'au pied du lanterneau (`roofTop`, à `band` de part et
 * d'autre du milieu), le lanterneau se dresse de `riser`, puis son verre jusqu'au faîte (`ridge`, 8,5).
 */
const HALL = { x0: -10, x1: 10, z0: -9, z1: 0, wall: 0.45, eaves: 5.0, roofTop: 7.2, band: 1.2, riser: 0.5, ridge: 8.5, over: 0.35 } as const;

/** Le milieu de la halle en travers (la rangée des colonnes, le faîte). */
const MID_Z = (HALL.z0 + HALL.z1) / 2;

/** Les baies (leur milieu le long du mur, leur demi-largeur) ; l'appui, la naissance et le haut de leur cintre. */
const BAY = { half: 0.62, sill: 1.0, spring: 3.5, crown: 4.2 } as const;
const NORTH_BAYS = [-8.75, -6.25, -3.75, -1.25, 1.25, 3.75, 6.25, 8.75] as const;
const SOUTH_BAYS = [-8.75, -6.25, -3.75, 3.75, 6.25, 8.75] as const;

/** La grande porte, au milieu du mur sud : sa demi-largeur, la naissance et le haut de son cintre. */
const DOOR = { half: 1.3, spring: 3.4, crown: 4.0 } as const;

/** La grande baie de l'est, au pignon : son milieu en travers, sa demi-largeur, son appui, la naissance et le haut de son cintre. */
const EAST_BAY = { z: MID_Z, half: 2.0, sill: 0.6, spring: 3.4, crown: 4.4 } as const;

/**
 * Les six colonnes de fonte, sur l'axe ; la cinquième (à l'est) est celle qui est couchée dans la ruine. La première est
 * à plus de deux unités du mur ouest : vue de la caméra de la scénette, elle passe derrière la colonne de texte et ne
 * coupe plus la scène (captures du 22 octobre 2026).
 */
const COLUMNS = [-6.3, -3.8, -1.3, 1.2, 3.7, 6.2] as const;
const FALLEN_COLUMN = 4;

/** Le haut des colonnes, sous le faîte, et leur rayon. */
const COLUMN = { r: 0.13, top: HALL.roofTop - 0.1 } as const;

/**
 * La machine à balancier, dans la travée est : sa colonne cannelée (son pied, sa hauteur) ; son balancier (le long de
 * l'axe nord-sud, de niveau en haut de la colonne, sa demi-longueur) ; son volant debout dans sa fosse, au sud (son
 * milieu en travers, la hauteur de son axe, son rayon) ; le support du régulateur au flanc ouest de la colonne.
 */
const MACHINE = { x: 7.6, z: MID_Z, h: 4.3, beam: 2.1, wheel: { z: -1.7, axle: 1.05, r: 1.3 }, governor: 2.9 } as const;

/**
 * Les six métiers, en deux rangs de trois, tous de la même taille : leur milieu (le rang nord, le rang sud, en alternance
 * d'ouest en est) ; leur largeur, profondeur et hauteur. Le rang nord est contre le mur nord, et s'écarte du milieu de la
 * halle : la caméra de la scénette regarde vers l'ouest le long de la halle, au nord des colonnes, et les bobines des
 * réponses se posent dans cette allée, entre x = −5 et −1 ; un métier au milieu de l'allée cachait les bobines et barrait
 * le premier plan, et le métier nord de la travée ouest masquait le tisserand (captures du 22 octobre 2026) : le rang nord
 * est tout entier à l'est des bobines, derrière la caméra ou au bord du cadre.
 */
const LOOMS: readonly Vec2[] = [
  { x: 1.4, z: -8.0 },
  { x: -3.6, z: -2.3 },
  { x: 3.7, z: -8.0 },
  { x: 0, z: -2.3 },
  { x: 6.0, z: -8.0 },
  { x: 3.6, z: -2.3 },
];
const LOOM = { w: 1.3, d: 1.1, h: 1.35 } as const;

/** Le coin du tisserand, contre le pignon ouest : son métier à bras, son banc, son panier. */
const CORNER = { loom: { x: -9.15, z: -7.7 }, bench: { x: -9.4, z: -5.3 }, basket: { x: -9.3, z: -6.45 } } as const;

/** La lanterne du tisserand, à la colonne de la travée ouest (la seule allumée de la ruine). */
const LANTERN_WEAVER = { x: COLUMNS[0], z: MID_Z - 0.32, y: 2.5 } as const;

/** La lanterne de la porte (le haut), à droite de la porte, dehors ; celle du chemin (les abords), côté `bas-1`. */
const LANTERN_DOOR = { x: DOOR.half + 0.55, z: HALL.z1 + HALL.wall / 2 + 0.2, y: 3.2 } as const;
const PATH_LANTERN = { x: -3.6, z: 6.6, h: 1.35 } as const;

/** Le quai de chargement, bas, contre le pignon ouest, au nord du coin sud-ouest. */
const QUAY = { x0: -12.6, x1: HALL.x0 - HALL.wall / 2, z0: -7.2, z1: -1.4, h: 0.8 } as const;

/** La cour dallée des abords, devant la façade sud (dans le sens inverse des aiguilles d'une montre vu d'en haut). */
const YARD: readonly Vec2[] = [
  { x: -6.8, z: 6.2 },
  { x: 6.8, z: 6.2 },
  { x: 6.8, z: 0.4 },
  { x: -6.8, z: 0.4 },
];

/**
 * Le plan du sol, ajusté sous la halle, le quai et la cour (aux moindres carrés), relevé juste assez pour ne jamais
 * passer sous le sol.
 */
const PLANE = (() => {
  const pts: [number, number, number][] = [];
  for (let x = -13; x <= 10.5 + 1e-6; x += 0.5) for (let z = -9.5; z <= 7 + 1e-6; z += 0.5) pts.push([x, z, localGround(x, z)]);
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n;
  const mz = pts.reduce((s, p) => s + p[1], 0) / n;
  const my = pts.reduce((s, p) => s + p[2], 0) / n;
  let sxx = 0,
    szz = 0,
    sxz = 0,
    sxy = 0,
    szy = 0;
  for (const [x, z, y] of pts) {
    sxx += (x - mx) ** 2;
    szz += (z - mz) ** 2;
    sxz += (x - mx) * (z - mz);
    sxy += (x - mx) * (y - my);
    szy += (z - mz) * (y - my);
  }
  const det = sxx * szz - sxz * sxz;
  const b = (sxy * szz - szy * sxz) / det;
  const c = (szy * sxx - sxy * sxz) / det;
  let hi = -Infinity;
  for (const [x, z, y] of pts) hi = Math.max(hi, y - b * x - c * z);
  return { a: hi + 0.04, b, c };
})();

/** Le dessus du plan du sol en un point du repère. */
const planeY = (x: number, z: number): number => PLANE.a + PLANE.b * x + PLANE.c * z;

/** Le pied du lieu : le plan sous son centre ; toutes les hauteurs de la halle partent de lui. */
const G = planeY(0, 0);

// ---------- La vue ----------

/**
 * Le cap de la caméra de « Y aller » (intention : devant la porte, regard vers le nord-nord-est) : la halle presque de
 * face, en longueur ; la travée ouest et la lanterne du tisserand à gauche, plus près ; la machine à droite, dans la travée
 * est ouverte ; la verrière tout le long du haut ; derrière, la mer du nord. La caméra regarde vers −(sin cap, cos cap).
 */
const DOOR_VIEW = -Math.PI / 8;

/** La vue d'arrivée (`doorFrame`, basse comme l'Étalon) : la caméra à hauteur de Kéo, le faîte dans le cadre. */
const DOOR_FRAME = { height: -3, back: 1.5 } as const;

/** Le point du nom sur la Carte : au-dessus du toit, à l'est, sur la tôle sombre, ni sur la bande de verre ni sur la machine. */
const MAP_POINT: Vec3 = { x: 3.2, y: G + HALL.ridge + 1.2, z: HALL.z1 - 1.6 };

// ---------- Les murs ----------

/** Un triangle tourné vers `out` (sa normale du même côté), quel que soit l'ordre de ses coins. */
function triOut(b: FacetBuilder, a: P3, c: P3, d: P3, out: P3, color: number): void {
  const n = [(c[1] - a[1]) * (d[2] - a[2]) - (c[2] - a[2]) * (d[1] - a[1]), (c[2] - a[2]) * (d[0] - a[0]) - (c[0] - a[0]) * (d[2] - a[2]), (c[0] - a[0]) * (d[1] - a[1]) - (c[1] - a[1]) * (d[0] - a[0])];
  if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0) b.triangle(a, c, d, color);
  else b.triangle(a, d, c, color);
}

/** Une baie : son milieu le long du mur, sa demi-largeur, son appui, la naissance et le haut de son cintre. */
interface Bay {
  c: number;
  half: number;
  sill: number;
  spring: number;
  crown: number;
}

/**
 * Un mur de brique droit percé de baies cintrées (d'ouest en est si `alongX`, sinon du nord au sud), centré sur `at` en
 * travers, de `from` à `to`, de `y0` jusqu'au haut `topAt(u)` (u le long du mur) : un bandeau sous les appuis (sauf sous
 * une porte), des trumeaux entre les baies, un bandeau au-dessus des cintres, coupé en morceaux là où le haut casse
 * (`breaks`) ; chaque cintre, deux coins pleins en biais (aux deux faces) et leurs dessous. Le dessus du mur est le
 * chaperon de pierre grise. Les baies ont toutes le même appui, sauf une porte (appui au pied).
 */
function bayWall(b: FacetBuilder, alongX: boolean, at: number, from: number, to: number, y0: number, topAt: (u: number) => number, bays: readonly Bay[], breaks: readonly number[] = []): void {
  const t = HALL.wall;
  const sill = Math.max(...bays.map((k) => k.sill));
  const crown = Math.max(...bays.map((k) => k.crown));
  const p = (u: number, v: number, y: number): P3 => (alongX ? [u, y, at + v] : [at + v, y, u]);
  const out: P3 = alongX ? [0, 0, 1] : [1, 0, 0];
  const back: P3 = [-out[0], 0, -out[2]];
  // Le bandeau du bas, sous les appuis, coupé sous chaque porte.
  let u = from;
  for (const k of [...bays].filter((k) => k.sill <= y0 + 1e-6).sort((a, c) => a.c - c.c)) {
    wallRun(b, alongX, at, u, k.c - k.half, t, y0, sill, sill, C.brickShade, C.brick);
    u = k.c + k.half;
  }
  wallRun(b, alongX, at, u, to, t, y0, sill, sill, C.brickShade, C.brick);
  // Les trumeaux, de l'appui au haut des cintres : leurs deux faces et leurs deux tableaux (le dessus et le dessous sont
  // cachés par les bandeaux). Le long d'une porte, le tableau descend jusqu'au pied.
  const edges = [from, ...bays.flatMap((k) => [k.c - k.half, k.c + k.half]), to].sort((a, c) => a - c);
  for (let k = 0; k < edges.length; k += 2) {
    const [a, c] = [edges[k], edges[k + 1]];
    const lo = sill;
    quadOut(b, p(a, t / 2, lo), p(c, t / 2, lo), p(c, t / 2, crown), p(a, t / 2, crown), out, C.brick);
    quadOut(b, p(a, -t / 2, lo), p(c, -t / 2, lo), p(c, -t / 2, crown), p(a, -t / 2, crown), back, C.brick);
    if (a > from + 1e-6) quadOut(b, p(a, -t / 2, lo), p(a, t / 2, lo), p(a, t / 2, crown), p(a, -t / 2, crown), alongX ? [-1, 0, 0] : [0, 0, -1], C.brickShade);
    if (c < to - 1e-6) quadOut(b, p(c, -t / 2, lo), p(c, t / 2, lo), p(c, t / 2, crown), p(c, -t / 2, crown), alongX ? [1, 0, 0] : [0, 0, 1], C.brickShade);
  }
  // Les cintres : deux coins pleins en biais, aux deux faces, et leurs dessous en biais ; le dessous plat du haut de la
  // baie ; au-dessus d'une baie plus basse que les autres (la porte), le mur plein jusqu'au bandeau.
  for (const k of bays) {
    const [l, r] = [k.c - k.half, k.c + k.half];
    const a = k.half * 0.55;
    for (const [v, n] of [
      [t / 2, out],
      [-t / 2, back],
    ] as const) {
      triOut(b, p(l, v, k.spring), p(l, v, k.crown), p(l + a, v, k.crown), n, C.brick);
      triOut(b, p(r, v, k.spring), p(r - a, v, k.crown), p(r, v, k.crown), n, C.brick);
    }
    const along = (s: number): P3 => (alongX ? [s, -1, 0] : [0, -1, s]);
    quadOut(b, p(l, -t / 2, k.spring), p(l, t / 2, k.spring), p(l + a, t / 2, k.crown), p(l + a, -t / 2, k.crown), along(1), C.brickShade);
    quadOut(b, p(r, -t / 2, k.spring), p(r, t / 2, k.spring), p(r - a, t / 2, k.crown), p(r - a, -t / 2, k.crown), along(-1), C.brickShade);
    quadOut(b, p(l + a, -t / 2, k.crown), p(l + a, t / 2, k.crown), p(r - a, t / 2, k.crown), p(r - a, -t / 2, k.crown), [0, -1, 0], C.brickShade);
    if (k.crown < crown - 1e-6) {
      quadOut(b, p(l, t / 2, k.crown), p(r, t / 2, k.crown), p(r, t / 2, crown), p(l, t / 2, crown), out, C.brick);
      quadOut(b, p(l, -t / 2, k.crown), p(r, -t / 2, k.crown), p(r, -t / 2, crown), p(l, -t / 2, crown), back, C.brick);
    }
  }
  // Le bandeau du haut, du haut des cintres au chaperon, coupé là où le haut casse.
  const cuts = [from, ...breaks, to];
  for (let k = 0; k < cuts.length - 1; k++) wallRun(b, alongX, at, cuts[k], cuts[k + 1], t, crown, topAt(cuts[k]), topAt(cuts[k + 1]), C.brickShade, C.stoneSun);
}

/** Un pignon (ouest ou est) au-dessus du haut des murs : le triangle de brique sous la tôle, puis le bout du lanterneau, de fer sombre. */
function gableTop(b: FacetBuilder, x: number, outward: number): void {
  const H = HALL;
  const zs = [H.z0 - H.wall / 2, MID_Z + H.band, MID_Z - H.band, H.z1 + H.wall / 2] as const;
  const y = (v: number) => G + v;
  // Le triangle de brique (en trapèze jusqu'au pied du lanterneau).
  const brick: [number, number][] = [
    [zs[3], y(H.eaves)],
    [zs[1], y(H.roofTop)],
    [zs[2], y(H.roofTop)],
    [zs[0], y(H.eaves)],
  ];
  plateBoth(b, x, brick, outward, C.brick, C.brickShade);
  // Le bout du lanterneau : son montant et le pignon de son verre, de fer sombre.
  const end: [number, number][] = [
    [zs[1], y(H.roofTop)],
    [zs[1], y(H.roofTop + H.riser)],
    [MID_Z, y(H.ridge)],
    [zs[2], y(H.roofTop + H.riser)],
    [zs[2], y(H.roofTop)],
  ];
  plateBoth(b, x, end, outward, C.iron, C.iron);
}

/** Un profil plan dans le plan x = `x` (ses points en z, y), ses deux faces : celle du dehors (`outward`) et celle du dedans. */
function plateBoth(b: FacetBuilder, x: number, outline: readonly (readonly [number, number])[], outward: number, out: number, inside: number): void {
  const pts = outline.map(([z, y]) => [x, y, z] as P3);
  for (let k = 1; k < pts.length - 1; k++) {
    triOut(b, pts[0], pts[k], pts[k + 1], [outward, 0, 0], out);
    triOut(b, pts[0], pts[k], pts[k + 1], [-outward, 0, 0], inside);
  }
}

/** Le mur plein d'un pignon, du pied au haut des murs, le long de z, sur `x`. */
function gableWall(b: FacetBuilder, x: number, top0: number, top1: number): void {
  wallRun(b, false, x, HALL.z0 - HALL.wall / 2, HALL.z1 + HALL.wall / 2, HALL.wall, G + SINK, top0, top1, C.brickShade, C.stoneSun);
}

// ---------- Le toit et la verrière ----------

/** La hauteur de la tôle en un point du travers (z), du bas du pan au pied du lanterneau. */
const roofAt = (z: number): number => {
  const d = Math.abs(z - MID_Z);
  const half = (HALL.z1 - HALL.z0) / 2;
  return HALL.eaves + ((half - d) / (half - HALL.band)) * (HALL.roofTop - HALL.eaves);
};

/** Un pan de tôle, de `x0` à `x1`, du côté nord (`side` = −1) ou sud (+1), du débord au pied du lanterneau. */
function roofSlope(b: FacetBuilder, x0: number, x1: number, side: -1 | 1, top: number, under: number): void {
  const zEave = MID_Z + side * ((HALL.z1 - HALL.z0) / 2 + HALL.over);
  const zTop = MID_Z + side * HALL.band;
  const yEave = G + roofAt(MID_Z + side * (HALL.z1 - HALL.z0) / 2) - (HALL.over * (HALL.roofTop - HALL.eaves)) / ((HALL.z1 - HALL.z0) / 2 - HALL.band);
  sheet(
    b,
    [
      [x0, yEave, zEave],
      [x1, yEave, zEave],
      [x1, G + HALL.roofTop, zTop],
      [x0, G + HALL.roofTop, zTop],
    ],
    0.07,
    top,
    under,
  );
}

/** Un cadre vide de la verrière (sur la pente `side`), de `x0` à `x1` : un anneau plat de fer rouillé, dessus et dessous. */
function emptyFrame(b: FacetBuilder, x0: number, x1: number, side: -1 | 1): void {
  const H = HALL;
  const y1 = G + H.roofTop + H.riser;
  const z = MID_Z + side * H.band;
  const at = (x: number, s: number): P3 => [x, y1 + (G + H.ridge - y1) * s + 0.02, z + (MID_Z - z) * s];
  const w = 0.28 / (x1 - x0);
  const ring: [number, number, number, number][] = [
    [0, 1, 0.04, 0.24],
    [0, 1, 0.76, 0.96],
    [0, w, 0.24, 0.76],
    [1 - w, 1, 0.24, 0.76],
  ];
  for (const [u0, u1, s0, s1] of ring) {
    const xa = x0 + (x1 - x0) * u0,
      xb = x0 + (x1 - x0) * u1;
    quadOut(b, at(xa, s0), at(xb, s0), at(xb, s1), at(xa, s1), [0, 1, side], C.rust);
    quadOut(b, at(xa, s0), at(xb, s0), at(xb, s1), at(xa, s1), [0, -1, -side], C.rustShade);
  }
}

// ---------- Les petits volumes ----------

/** Une colonne de fonte fine, de son pied à `top`, debout en `x`, `z`. */
function column(b: FacetBuilder, x: number, z: number, top: number, color: number, cap: number): void {
  const y = planeY(x, z) + SINK;
  b.prism({ x, y, z }, COLUMN.r, COLUMN.r * 0.85, top - y, 5, color, cap);
}

/**
 * Un métier à tisser, dans son repère (y = 0 au sol, posé en `at`, tourné de `yaw` ; sa largeur le long de z, sa face, la
 * poitrinière, vers +x) : ses deux flasques pleines, son ensouple du haut (sauf `bare`) et sa poitrinière ; tous de la
 * même taille. `lying` : couché sur le flanc, une flasque au sol.
 */
function loom(b: FacetBuilder, at: Vec3, yaw: number, color: number, shade: number, bare = false, lying = false): void {
  const W = LOOM.w / 2;
  drawPosed(b, { x: at.x, y: at.y + (lying ? W + 0.05 : 0), z: at.z, yaw, pitch: lying ? Math.PI / 2 : 0 }, (l) => {
    for (const s of [-1, 1]) l.box({ x: 0, y: 0, z: s * W }, [LOOM.d, LOOM.h, 0.1], shade, color);
    if (!bare) l.box({ x: -LOOM.d / 2 + 0.1, y: LOOM.h - 0.16, z: 0 }, [0.16, 0.16, LOOM.w], color);
    l.box({ x: LOOM.d / 2 - 0.1, y: 0.75, z: 0 }, [0.12, 0.1, LOOM.w], shade, color);
  });
}

/** La ferrure vide du 4e : une petite plaque de fer éteint, deux chevilles nues, tournée vers `n` (x ou z). */
function emptyBracket(b: FacetBuilder, x: number, y: number, z: number, nx: number, nz: number): void {
  b.box({ x, y: y - 0.12, z, yaw: Math.atan2(nx, nz) }, [0.4, 0.24, 0.08], C.rustDull, C.rustDullTop);
  for (const s of [-0.1, 0.1]) b.box({ x: x + nx * 0.1 + nz * s, y: y - 0.04, z: z + nz * 0.1 - nx * s, yaw: Math.atan2(nx, nz) }, [0.06, 0.06, 0.14], C.iron);
}

/**
 * Le balancier : une plaque de fonte en ovale pointu (jamais un tube), dans son repère (son long le long de x, sa face
 * vers z), posée en `at`.
 */
function walkingBeam(b: FacetBuilder, at: { x: number; y: number; z: number; yaw: number; pitch: number }, color: number, face: number): void {
  const L = MACHINE.beam;
  b.extrude(
    { ...at },
    [
      [-L, 0],
      [-L * 0.5, -0.28],
      [L * 0.5, -0.28],
      [L, 0],
      [L * 0.5, 0.28],
      [-L * 0.5, 0.28],
    ],
    0.16,
    color,
    face,
  );
}

// ---------- Le modèle ----------

function model(add: AddPiece, _ground: SiteGround, _door: Vec2): void {
  const H = HALL;
  const corps = { stage: 0 as Stage, row: 0 };
  const haut = { stage: 1 as Stage, row: 0 };
  const wallFoot = G + SINK;
  const bays = (list: readonly number[]): Bay[] => list.map((c) => ({ c, half: BAY.half, sill: G + BAY.sill, spring: G + BAY.spring, crown: G + BAY.crown }));
  const [zN, zS] = [H.z0, H.z1];
  const [west, east] = [H.x0 - H.wall / 2, H.x1 + H.wall / 2];

  // Toujours là : le pignon ouest, plein, et le bout du lanterneau (la verrière se lit à ce pignon, en ruine comme
  // restaurée) ; le dallage de la halle ; la ferrure vide au support du régulateur ; le coin du tisserand (son métier à
  // bras, son banc, son panier) et sa lanterne, la seule allumée.
  add('ruine', 0, (b) => {
    gableWall(b, H.x0, G + H.eaves, G + H.eaves);
    gableTop(b, west, -1);
    const f = (x: number, z: number): P3 => [x, planeY(x, z) + 0.03, z];
    const [x0, x1, z0, z1] = [H.x0 + H.wall / 2, H.x1 - H.wall / 2, H.z0 + H.wall / 2, H.z1 - H.wall / 2];
    quadOut(b, f(x0, z0), f(x1, z0), f(x1, z1), f(x0, z1), [0, 1, 0], C.floor);
    emptyBracket(b, MACHINE.x - 0.62, G + MACHINE.governor + 0.3, MACHINE.z, -1, 0);
    weaverCorner(b);
  });

  // ---- La ruine ----
  // Le corps la relève : le mur nord à mi-hauteur, ses baies ouvertes (les cintres tiennent à l'ouest ; à l'est, le mur
  // est cassé sous eux) ; le mur sud debout à l'ouest, tombé bas à l'est ; le pignon est cassé en biais ; les colonnes
  // rouillées (cinq debout, la cinquième couchée au nord de l'axe) ; la machine rouillée, son balancier couché à plat au
  // pied de la colonne, du côté opposé au volant ; les métiers de travers, un couché, un sans son ensouple (couchée à ses
  // pieds) ; trois blocs de brique au pied du mur sud.
  add(
    'ruine',
    0,
    (b) => {
      bayWall(b, true, zN, west, 2.5, wallFoot, (u) => G + 4.55 + 0.2 * Math.sin(u * 0.9), bays(NORTH_BAYS.filter((x) => x < 2.5)), [-6, -2]);
      brokenWall(b, zN, 2.5, east, wallFoot, NORTH_BAYS.filter((x) => x > 2.5), (u) => G + 3.9 - (u - 2.5) * 0.17);
      bayWall(b, true, zS, west, -2.4, wallFoot, (u) => G + 4.7 - (u - west) * 0.04, bays(SOUTH_BAYS.filter((x) => x < 0)), [-5]);
      wallRun(b, true, zS, -2.4, east, H.wall, wallFoot, G + 1.6, G + 1.1, C.brickShade, C.stoneSun);
      wallRun(b, false, H.x1, zN - H.wall / 2, EAST_BAY.z - EAST_BAY.half, H.wall, wallFoot, G + 3.4, G + 2.0, C.brickShade, C.stoneSun);
      wallRun(b, false, H.x1, EAST_BAY.z + EAST_BAY.half, zS + H.wall / 2, H.wall, wallFoot, G + 1.4, G + 2.6, C.brickShade, C.stoneSun);
      for (const [k, x] of COLUMNS.entries()) if (k !== FALLEN_COLUMN) column(b, x, MID_Z, G + COLUMN.top, C.rustShade, C.rust);
      // La colonne couchée, au pied de la sienne, entre le rang nord et l'axe (le rang nord est contre le mur).
      const lz = MID_Z - 1.0;
      const lx = COLUMNS[FALLEN_COLUMN] - COLUMN.top + 1.6;
      b.beam({ x: lx, y: planeY(lx, lz) + 0.13, z: lz }, { x: lx + COLUMN.top - 0.6, y: planeY(lx + COLUMN.top - 0.6, lz) + 0.13, z: lz - 0.15 }, 0.24, C.rust);
      machine(b, C.rustShade, C.rust);
      walkingBeam(b, { x: MACHINE.x, y: planeY(MACHINE.x, MACHINE.z - 2.0) + 0.02, z: MACHINE.z - 2.0, yaw: 0.12, pitch: -Math.PI / 2 }, C.rustShade, C.rust);
      LOOMS.forEach((p, k) => {
        const y = planeY(p.x, p.z);
        loom(b, { x: p.x, y, z: p.z }, Math.PI / 2 + [0.25, -0.3, 0.35, 0, -0.2, 0.3][k], C.loom, C.loomShade, k === 4, k === 3);
      });
      const e = LOOMS[4];
      b.box({ x: e.x + 0.3, y: planeY(e.x, e.z + 0.95) - 0.04, z: e.z + 0.95, yaw: 0.25 }, [LOOM.w, 0.16, 0.16], C.loom);
      for (const [x, z, yaw] of [
        [-4.6, 0.9, 0.4],
        [4.2, 0.85, -0.3],
        [6.8, 1.2, 0.9],
      ] as const)
        b.box({ x, y: planeY(x, z) - 0.06, z, yaw }, [0.62, 0.32, 0.36], C.brickShade, C.brick);
    },
    corps,
  );
  // Le haut la relève : les deux montants du lanterneau et le faîte, rouillés, d'un pignon jusqu'au-dessus de la
  // machine, où ils sont cassés ; sur la moitié ouest, la bande de verre en place ; sur la moitié est, trois cadres vides ;
  // les fermes rouillées (toutes au nord, deux au sud, à l'ouest) ; le dernier pan de tôle sur la travée ouest ; l'arbre
  // de transmission pendu d'un bout ; les courroies à plat au sol.
  add(
    'ruine',
    0,
    (b) => {
      const end = 6.7;
      b.box({ x: (H.x0 + end) / 2, y: G + H.ridge - 0.18, z: MID_Z }, [end - H.x0, 0.18, 0.2], C.rustShade, C.rust);
      lanternRisers(b, H.x0, end, C.rustShade);
      glazingSlopes(b, H.x0, 0, 4, C.rust, C.rustShade);
      emptyFrame(b, 0.3, 2.4, -1);
      emptyFrame(b, 2.6, 4.5, 1);
      emptyFrame(b, 4.7, 6.6, -1);
      const rafter = (x: number, side: -1 | 1) => b.beam({ x, y: G + 4.5, z: MID_Z + side * ((H.z1 - H.z0) / 2 - 0.1) }, { x, y: G + H.roofTop, z: MID_Z + side * H.band * 0.6 }, 0.14, C.rust);
      for (const x of COLUMNS) rafter(x, -1);
      for (const x of [COLUMNS[0], COLUMNS[1]]) rafter(x, 1);
      for (const side of [-1, 1] as const) roofSlope(b, H.x0 - H.over, COLUMNS[0] + 0.3, side, C.rust, C.rustShade);
      // L'arbre, de sa chaise à l'ouest jusqu'à son bout tombé ; sa chaise.
      b.box({ x: -6.2, y: G + 6.3, z: MID_Z }, [0.3, 0.5, 0.3], C.rustShade, C.rust);
      b.beam({ x: -6.2, y: G + 6.25, z: MID_Z }, { x: 1.5, y: G + 3.4, z: MID_Z + 0.4 }, 0.13, C.rust);
      for (const [x, z, len, yaw] of [
        [-2.2, -3.9, 2.4, 0.3],
        [1.6, -5.3, 2.0, -0.4],
        [3.2, -3.5, 1.8, 0.9],
      ] as const) {
        const y = planeY(x, z) + 0.05;
        const dx = (Math.cos(yaw) * len) / 2,
          dz = (-Math.sin(yaw) * len) / 2;
        const nx = Math.sin(yaw) * 0.07,
          nz = Math.cos(yaw) * 0.07;
        quadOut(b, [x - dx - nx, y, z - dz - nz], [x + dx - nx, y, z + dz - nz], [x + dx + nx, y, z + dz + nz], [x - dx + nx, y, z - dz + nz], [0, 1, 0], C.leather);
      }
    },
    haut,
  );

  // ---- Le corps : les murs à pleine hauteur, leurs hautes baies cintrées, la grande porte, la grande baie de l'est ; les
  // six colonnes ; les six métiers debout en deux rangs ; la machine redressée, le balancier de niveau en haut de sa
  // colonne, la bielle jusqu'au volant.
  add(0, 0, (b) => {
    const top = () => G + H.eaves;
    bayWall(b, true, zN, west, east, wallFoot, top, bays(NORTH_BAYS));
    bayWall(b, true, zS, west, east, wallFoot, top, [...bays(SOUTH_BAYS), { c: 0, half: DOOR.half, sill: wallFoot, spring: G + DOOR.spring, crown: G + DOOR.crown }]);
    bayWall(b, false, H.x1, zN - H.wall / 2, zS + H.wall / 2, wallFoot, top, [{ c: EAST_BAY.z, half: EAST_BAY.half, sill: G + EAST_BAY.sill, spring: G + EAST_BAY.spring, crown: G + EAST_BAY.crown }]);
    gableTop(b, east, 1);
    for (const x of COLUMNS) column(b, x, MID_Z, G + COLUMN.top, C.iron, C.ironTop);
    for (const p of LOOMS) loom(b, { x: p.x, y: planeY(p.x, p.z), z: p.z }, Math.PI / 2, C.loom, C.loomShade);
    machine(b, C.iron, C.ironTop);
    const top0 = G + MACHINE.h;
    walkingBeam(b, { x: MACHINE.x - 0.08, y: top0 + 0.4, z: MACHINE.z, yaw: Math.PI / 2, pitch: 0 }, C.iron, C.ironTop);
    const W = MACHINE.wheel;
    b.beam({ x: MACHINE.x - 0.25, y: top0 + 0.25, z: MACHINE.z + MACHINE.beam - 0.3 }, { x: MACHINE.x - 0.25, y: G + W.axle + 0.55, z: W.z - 0.2 }, 0.14, C.iron);
  });
  // ---- Le haut : les fermes, la tôle rouge sombre et la verrière en bande surélevée au faîte, une seule ligne de toit
  // continue ; l'arbre de transmission et ses courroies tendues, immobiles ; la lanterne de la porte.
  add(1, 0, (b) => {
    b.box({ x: 0, y: G + H.ridge - 0.12, z: MID_Z }, [H.x1 - H.x0 + 2 * H.over, 0.12, 0.26], C.iron, C.ironTop);
    for (const side of [-1, 1] as const) roofSlope(b, H.x0 - H.over, H.x1 + H.over, side, C.roof, C.roofUnder);
    lanternRisers(b, west, east, C.iron);
    glazingSlopes(b, west, east, 8, C.ironTop, C.iron);
    for (const x of COLUMNS) for (const side of [-1, 1] as const) b.beam({ x, y: G + H.eaves - 0.1, z: MID_Z + side * ((H.z1 - H.z0) / 2 - 0.15) }, { x, y: G + H.roofTop - 0.12, z: MID_Z + side * H.band }, 0.12, C.iron);
    // L'arbre de transmission sous le faîte, sur ses deux chaises, et une courroie tendue jusqu'à chaque métier.
    const y = G + 6.0;
    b.beam({ x: H.x0 + 1.6, y, z: MID_Z }, { x: MACHINE.x - 1.0, y, z: MID_Z }, 0.12, C.iron);
    for (const x of [-6.2, 1.2]) b.box({ x, y: y + 0.05, z: MID_Z }, [0.26, 0.6, 0.26], C.iron, C.ironTop);
    // Le rang sud prend sa courroie à l'arbre du faîte ; le rang nord, contre le mur, à un second arbre porté par le mur nord
    // sur deux consoles, ses courroies droites derrière les métiers : rien ne traverse l'allée de la scénette.
    const north = { y: G + 4.6, z: H.z0 + H.wall / 2 + 0.3 };
    b.beam({ x: LOOMS[0].x - 0.8, y: north.y, z: north.z }, { x: MACHINE.x - 1.0, y: north.y, z: north.z }, 0.1, C.iron);
    for (const x of [LOOMS[0].x - 0.5, MACHINE.x - 1.3]) b.box({ x, y: north.y - 0.2, z: north.z - 0.15 }, [0.2, 0.3, 0.3], C.iron, C.ironTop);
    for (const p of LOOMS) {
      const top = planeY(p.x, p.z) + LOOM.h - 0.05;
      if (p.z < MID_Z) b.beam({ x: p.x, y: north.y - 0.05, z: north.z }, { x: p.x, y: top, z: p.z - 0.35 }, 0.07, C.leather);
      else b.beam({ x: p.x, y: y - 0.05, z: MID_Z + 0.08 }, { x: p.x, y: top, z: p.z - 0.35 }, 0.07, C.leather);
    }
    const L = LANTERN_DOOR;
    b.box({ x: L.x, y: G + L.y + 0.02, z: L.z - 0.1 }, [0.07, 0.07, 0.4], C.iron);
    lantern(b, { x: L.x, y: G + L.y, z: L.z + 0.1 }, true);
  });
  // ---- Les abords : la cour dallée ; la grande porte à deux battants ouverts, repliés contre le mur ; le quai de
  // chargement bas contre le pignon ouest ; la lanterne du chemin.
  add(2, 0, (b) => {
    yard(b);
    for (const s of [-1, 1]) b.box({ x: s * (DOOR.half + 0.62), y: planeY(s * 2, 0.4), z: zS + H.wall / 2 + 0.07 }, [1.22, DOOR.spring - 0.1, 0.1], C.woodShade, C.wood);
    const Q = QUAY;
    const qy = planeY((Q.x0 + Q.x1) / 2, (Q.z0 + Q.z1) / 2);
    b.box({ x: (Q.x0 + Q.x1) / 2, y: wallFoot, z: (Q.z0 + Q.z1) / 2 }, [Q.x1 - Q.x0, qy + Q.h - wallFoot, Q.z1 - Q.z0], C.stoneShade, C.stoneSun);
    const p = PATH_LANTERN;
    const py = planeY(p.x, p.z);
    b.box({ x: p.x, y: py - 0.3, z: p.z }, [0.12, p.h + 0.3, 0.12], C.iron);
    lantern(b, { x: p.x, y: py + p.h + 0.02, z: p.z }, true, 0.85);
  });
}

/**
 * Un mur cassé sous ses cintres (la moitié est du mur nord, dans la ruine), d'ouest en est sur `at`, de `from` à `to` : le
 * bandeau sous les appuis, et des trumeaux au haut cassé en biais (`topAt`), sans cintre ni bandeau.
 */
function brokenWall(b: FacetBuilder, at: number, from: number, to: number, y0: number, bays: readonly number[], topAt: (u: number) => number): void {
  const t = HALL.wall;
  wallRun(b, true, at, from, to, t, y0, G + BAY.sill, G + BAY.sill, C.brickShade, C.brick);
  const edges = [from, ...bays.flatMap((c) => [c - BAY.half, c + BAY.half]), to];
  for (let k = 0; k < edges.length; k += 2) wallRun(b, true, at, edges[k], edges[k + 1], t, G + BAY.sill - 0.02, topAt(edges[k]), topAt(edges[k + 1]), C.brickShade, C.brick);
}

/** Les deux montants du lanterneau, de `x0` à `x1`, à leurs deux faces. */
function lanternRisers(b: FacetBuilder, x0: number, x1: number, color: number): void {
  const [y0, y1] = [G + HALL.roofTop, G + HALL.roofTop + HALL.riser];
  for (const side of [-1, 1] as const) {
    const z = MID_Z + side * HALL.band;
    quadOut(b, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, side], color);
    quadOut(b, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, -side], color);
  }
}

/**
 * Les deux pentes de la verrière, de `x0` à `x1` : leur fer (dessus `top`, dessous `under`), du haut des montants au faîte,
 * et les vitres gris-bleu mat en `panes` panneaux, un peu au-dessus, séparées par un cadre épais (0,28 entre deux vitres,
 * jamais une grille fine).
 */
function glazingSlopes(b: FacetBuilder, x0: number, x1: number, panes: number, top: number, under: number): void {
  const H = HALL;
  const y1 = G + H.roofTop + H.riser;
  const yr = G + H.ridge;
  for (const side of [-1, 1] as const) {
    const z = MID_Z + side * H.band;
    const q: [P3, P3, P3, P3] = [
      [x0, y1, z],
      [x1, y1, z],
      [x1, yr, MID_Z],
      [x0, yr, MID_Z],
    ];
    quadOut(b, ...q, [0, 1, side], top);
    quadOut(b, ...q, [0, -1, -side], under);
    const step = (x1 - x0) / panes;
    const at = (x: number, s: number): P3 => [x, y1 + (yr - y1) * s + 0.025, z + (MID_Z - z) * s];
    for (let k = 0; k < panes; k++) {
      const a = x0 + k * step + 0.14,
        c = x0 + (k + 1) * step - 0.14;
      quadOut(b, at(a, 0.12), at(c, 0.12), at(c, 0.88), at(a, 0.88), [0, 1, side], C.glass);
    }
  }
}

/**
 * La machine, de `metal` (rouillée dans la ruine, de fer bruni restaurée) : sa colonne cannelée sur son socle de pierre,
 * son chapiteau plat ; le petit support du régulateur au flanc ouest ; le volant debout dans sa fosse (son axe nord-sud, sa
 * face vers la cour), la margelle de pierre de part et d'autre et le palier de son axe. Rien ne tourne.
 */
function machine(b: FacetBuilder, metal: number, metalTop: number): void {
  const M = MACHINE;
  const g = planeY(M.x, M.z);
  b.box({ x: M.x, y: g - 0.2, z: M.z }, [0.9, 0.5, 0.9], C.stoneShade, C.stoneSun);
  b.prism({ x: M.x, y: G + 0.3, z: M.z }, 0.3, 0.24, M.h - 0.3, 8, metal, metalTop);
  b.box({ x: M.x, y: G + M.h - 0.05, z: M.z }, [0.62, 0.18, 0.62], metal, metalTop);
  b.box({ x: M.x - 0.42, y: G + M.governor - 0.1, z: M.z }, [0.36, 0.1, 0.3], metal, metalTop);
  const W = M.wheel;
  const wg = planeY(M.x, W.z);
  b.drum({ x: M.x, y: G + W.axle, z: W.z - 0.14, pitch: Math.PI / 2 }, W.r, 0.28, 10, metal, metalTop);
  for (const s of [-1, 1]) b.box({ x: M.x, y: wg - 0.2, z: W.z + s * 0.42 }, [W.r * 2 + 0.6, 0.62, 0.32], C.stoneShade, C.stoneSun);
  b.box({ x: M.x, y: wg - 0.1, z: W.z - 0.62 }, [0.4, G + W.axle - wg + 0.2, 0.3], C.stoneShade, C.stoneSun);
}

/**
 * Le coin du tisserand, contre le pignon ouest, sous la dernière travée : son métier à bras de bois clair (sa face vers
 * l'est), son banc, son panier de pelotes ; sa lanterne à la colonne de la travée, la seule allumée de la ruine (la
 * colonne elle-même est rouillée dans la ruine, de fer bruni restaurée).
 */
function weaverCorner(b: FacetBuilder): void {
  const K = CORNER;
  loom(b, { x: K.loom.x, y: planeY(K.loom.x, K.loom.z), z: K.loom.z }, 0, C.lightWood, C.lightShade);
  b.box({ x: K.bench.x, y: planeY(K.bench.x, K.bench.z) - 0.1, z: K.bench.z }, [0.4, 0.55, 1.5], C.woodShade, C.wood);
  b.prism({ x: K.basket.x, y: planeY(K.basket.x, K.basket.z) - 0.05, z: K.basket.z }, 0.26, 0.32, 0.36, 6, C.wickerShade, C.thread);
  const L = LANTERN_WEAVER;
  b.box({ x: L.x, y: G + L.y + 0.02, z: L.z + 0.16 }, [0.07, 0.07, 0.36], C.iron);
  lantern(b, { x: L.x, y: G + L.y, z: L.z }, true);
}

/** La cour : la dalle qui suit le plan, son bord, et ses joints en rangs (jamais sur le chemin). */
function yard(b: FacetBuilder): void {
  const top = YARD.map(({ x, z }) => [x, planeY(x, z) + 0.02, z] as P3);
  for (let k = 1; k < top.length - 1; k++) b.triangle(top[0], top[k], top[k + 1], C.paving);
  const cx = YARD.reduce((s, p) => s + p.x, 0) / YARD.length,
    cz = YARD.reduce((s, p) => s + p.z, 0) / YARD.length;
  for (let k = 0; k < top.length; k++) {
    const m = (k + 1) % top.length;
    const out: P3 = [(top[k][0] + top[m][0]) / 2 - cx, 0, (top[k][2] + top[m][2]) / 2 - cz];
    quadOut(b, [top[k][0], top[k][1] - 0.4, top[k][2]], [top[m][0], top[m][1] - 0.4, top[m][2]], top[m], top[k], out, C.stoneShade);
  }
  const line = (a: Vec2, c: Vec2) => {
    const len = Math.hypot(c.x - a.x, c.z - a.z) || 1;
    const nx = ((c.z - a.z) / len) * 0.04,
      nz = (-(c.x - a.x) / len) * 0.04;
    const p = (q: Vec2, s: number): P3 => [q.x + nx * s, planeY(q.x, q.z) + 0.032, q.z + nz * s];
    quadOut(b, p(a, 1), p(c, 1), p(c, -1), p(a, -1), [0, 1, 0], C.joint);
  };
  line({ x: -6.5, z: 3.3 }, { x: 6.5, z: 3.3 });
  for (const x of [-3.4, 3.4]) line({ x, z: 0.7 }, { x, z: 5.9 });
}

// ---------- Les traces ----------

/** Où se pose chaque trace, depuis le centre du lieu (intention, « Les parties et les traces ») ; aucune sur le chemin. */
const TRACE_SPOTS = {
  wheel: { x: COLUMNS[1], z: MID_Z + 0.55 },
  oil: { x: MACHINE.x + 0.55, z: MACHINE.z - 2.9 },
  hamper: { x: 2.8, z: 3.6 },
} as const;

/** Un rouet de bois à roue pleine, debout contre une colonne, à l'ouest de la porte (Lumières et révolutions). */
function spinningWheel(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.wheel;
    const y = planeY(x, z);
    l.box({ x, y: y - 0.05, z: z + 0.1 }, [0.9, 0.16, 0.36], C.lightShade, C.lightWood);
    l.box({ x: x + 0.22, y: y + 0.08, z: z + 0.1 }, [0.1, 0.62, 0.1], C.lightShade, C.lightWood);
    l.drum({ x: x + 0.22, y: y + 0.66, z: z - 0.02, pitch: Math.PI / 2 }, 0.42, 0.07, 8, C.lightShade, C.lightWood);
  });
}

/** Un grand bidon d'huile de fer, debout, sa burette posée dessus, au pied de la machine, côté nord (L'Europe et le monde au XIXe siècle). */
function oilCan(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.oil;
    const y = planeY(x, z);
    l.prism({ x, y: y - 0.05, z }, 0.3, 0.3, 0.85, 8, C.iron, C.ironTop);
    l.prism({ x: x + 0.08, y: y + 0.8, z }, 0.11, 0.05, 0.22, 6, C.iron, C.ironTop);
  });
}

/** Une grande panière d'osier rectangulaire pleine de toile unie pliée, dans la cour, à l'est de la porte (La France au XIXe siècle). */
function hamper(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.hamper;
    const y = planeY(x, z);
    l.box({ x, y: y - 0.05, z, yaw: 0.15 }, [1.1, 0.55, 0.7], C.wickerShade, C.wicker);
    l.box({ x, y: y + 0.5, z, yaw: 0.15 }, [0.9, 0.14, 0.52], C.cloth);
  });
}

/** Les trois traces, une par mission, chacune avec sa partie ; des objets de la filature, jamais la notion. */
const TRACES = {
  enlightenment: { at: TRACE_SPOTS.wheel, lift: 1, stage: 0, row: 0, draw: spinningWheel },
  'industrial-europe': { at: TRACE_SPOTS.oil, lift: 1, stage: 1, row: 0, draw: oilCan },
  'french-society': { at: TRACE_SPOTS.hamper, lift: 1, stage: 2, row: 0, draw: hamper },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/**
 * Le cap de départ de la caméra de la scénette (intention : vers l'ouest, vers le pignon de brique pleine) : un fond calme
 * et sombre derrière la bulle, aucune baie, la verrière hors du cadre. Elle regarde vers −(sin cap, cos cap).
 */
const SCENE_START = Math.PI / 2;

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers le tisserand) : le nord. */
const SCENE_RIGHT = { x: Math.cos(SCENE_START), z: -Math.sin(SCENE_START) } as const;

/**
 * Le milieu de la scène, depuis le centre du lieu : dans la travée ouest, devant le coin du tisserand, au nord de la
 * rangée des colonnes (qui reste à gauche du cadre, jamais entre la caméra et Kéo).
 */
const SCENE_SPOT = { dx: -7.9, dz: -6.75, half: [1.1, 1.75] as [number, number] } as const;

/** L'écart de Kéo et du tisserand au milieu de la scène. */
const SCENE_HALF = 1.4;

/** La hauteur du sol de la scène au-dessus de son point (le plus haut du sol sous elle) : le dessus du dallage. */
const SCENE_RISE = (() => {
  const [hx, hz] = SCENE_SPOT.half;
  let top = -Infinity;
  for (let i = -3; i <= 3; i++) for (let k = -2; k <= 2; k++) top = Math.max(top, localGround(SCENE_SPOT.dx + (i / 3) * hx, SCENE_SPOT.dz + (k / 2) * hz));
  return Math.max(0, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz) + 0.03 - top);
})();

/** Le tisserand en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, tablier, chemise. */
function weaver(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.28, 0.24, 0.48, 8, C.apron);
  b.prism({ x: at.x, y: at.y + 0.62, z: at.z }, 0.26, 0.23, 0.38, 8, C.shirt);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.28, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.34, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.shirt);
}

/** Les bobines des réponses : le rayon et la hauteur du fil, la hauteur du fuseau, à l'échelle 1 ; une bobine choisie se soulève d'un cran. */
const SPOOL = { r: 0.22, h: 0.5, spindle: 0.78, lift: 0.3 } as const;

export const MANUFACTURE: PlaceArt = {
  role: 'Le tisserand',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a sa partie (une par plan).
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    rise: SCENE_RISE,
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 2.0, bottom: -0.4, top: 2.5, depth: 0.3 },
    // Basse : le dallage est plat, et le pignon ferme le fond ; serrée, pour que la caméra reste dans la halle, entre les
    // métiers et la machine.
    pitch: (12 * Math.PI) / 180,
    start: SCENE_START,
  },
  // Le décor de près : le dallage, le métier à bras, le banc et le panier sont au lieu. Il reste le tisserand en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) weaver(b, at, sphere);
  },
  answer: {
    size: { height: SPOOL.spindle + SPOOL.lift + 0.15, half: SPOOL.r + 0.04 },
    facing: true,
    // Le banc : une longue planche de bois sombre sur deux pieds pleins, où les bobines sont debout.
    base(b, mid, y, z, span, s, ground) {
      const foot = Math.min(ground, y) - 0.3;
      b.box({ x: mid, y: y - 0.1 * s, z: z + 0.1 * s }, [span + 0.6, 0.1 * s, 0.5 * s], C.loomShade, C.loom);
      for (const k of [-1, 1]) b.box({ x: mid + k * (span / 2 + 0.1), y: foot, z: z + 0.1 * s }, [0.12 * s, y - 0.1 * s - foot, 0.4 * s], C.loomShade);
    },
    // Une grosse bobine de fil écru sur son fuseau de bois sombre, toutes de la même taille ; choisie, elle se soulève d'un
    // cran (sa place le dit, jamais sa couleur).
    object(b, at, s, _i, _count, picked) {
      const y = at.y + (picked ? SPOOL.lift : 0) * s;
      b.prism({ x: at.x, y, z: at.z }, SPOOL.r * 1.15 * s, SPOOL.r * 1.15 * s, 0.06 * s, 8, C.loomShade, C.loom);
      b.prism({ x: at.x, y: y + 0.06 * s, z: at.z }, SPOOL.r * s, SPOOL.r * s, SPOOL.h * s, 8, C.thread, C.thread);
      b.prism({ x: at.x, y: y + (0.06 + SPOOL.h) * s, z: at.z }, 0.05 * s, 0.03 * s, (SPOOL.spindle - 0.06 - SPOOL.h) * s, 4, C.loomShade, C.loom);
    },
  },
  // Les trois missions en R : le banc seul, rien de l'item ; les bobines portent les réponses.
  rest() {},
  traces: TRACES,
  // Kéo au retour : au pas de la porte, tourné vers la halle.
  exit: { x: DOOR_AT.x - 0.6, z: DOOR_AT.z - 0.8 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan de la Manufacture, pour les tests, ses abords et le Recoin : la halle, la machine, les métiers, la caméra. */
export const MANUFACTURE_LAYOUT = {
  hall: HALL,
  midZ: MID_Z,
  columns: COLUMNS,
  machine: MACHINE,
  looms: LOOMS,
  corner: CORNER,
  quay: QUAY,
  yard: YARD,
  planeY,
  base: G,
  pathLantern: PATH_LANTERN,
  door: DOOR_AT,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
  colors: { glass: C.glass, roof: C.roof },
} as const;
