// La Coupole (les Prairies du 3e, GD-25, lot 4 ; proposition du consultant d'Archipéo, § 4, relecture des lieux du
// directeur artistique, corrections 2 et 9, et planche `selection-prairies-v1`, de près et de loin graine 42) : « la salle
// de lecture sous sa coupole d'émail bleu, sur la deuxième Prairie ». Sur le gabarit du Kiosque (./kiosque3e.ts), avec le
// kit du 3e (./place3eKit.ts). Une salle ronde de pierre claire sur son socle de granit, six hautes fenêtres en arc et
// une large porte au sud ; dessus, la coupole d'émail cobalt (#2E5FAE, le seul dôme bleu du niveau : correction 9), un
// peu de neige autour du lanterneau ; dedans, la grande table et sa lampe, quatre pupitres, les rayonnages de livres
// fermés, aux dos sans titre ; devant, le seuil rond dallé et ses deux bancs.
//
// La ruine, d'après le texte, cassée du côté vu depuis la porte (relecture du Versant, (b) 5) : la coupole ouverte au
// sud-est, sa charpente de bois à nu (le dedans de bois se voit par le trou), le lanterneau penché ; trois plaques d'émail
// tombées, appuyées contre le mur, penchées, leur dessous de bois vers le dehors (relecture des Alpages, (b) 1 : jamais à
// plat) ; deux pans de mur ébréchés sous le trou, les fenêtres vides ; la grande table renversée, des livres en piles
// couchées ; les rayonnages vides ; l'herbe sèche. Une seule lumière, la lanterne du libraire, au mur, à droite de la
// porte. Cinq parties (3 + 1 + 1) : les murs (les pans refaits, les fenêtres vitrées) ; la table et les pupitres ; les
// rayonnages pleins ; le haut (la coupole refermée, son lanterneau, la lampe de la table) ; les abords (le seuil dallé,
// ses bancs, la lanterne du chemin). Une trace par mission, avec sa partie. La porte du lieu est au sud-est de la salle
// (correction 2, puis relecture du Versant, (b) 1) : Kéo s'y arrête à côté de la Coupole, jamais devant. Code pur.
import type { Stage } from './construction';
import { drawPosed, type FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C3E, armLantern3e, dryTuft3e, habitant3e, lantern3e, onCircle, postLantern3e, site3e } from './place3eKit';
import { COLORS_3E } from './plan3e';
import { capOf, groundPlane4e, inWorld, once, quadOut, sceneRight, sceneRise, sheet } from './place4eKit';

type P3 = [number, number, number];

/**
 * Les couleurs propres à la Coupole, en plus des matières des Passeurs (`C3E`) : l'émail cobalt (`COLORS_3E.cobalt`) ;
 * la vitre des fenêtres ; le creux d'une fenêtre vide, d'un brun d'ombre (jamais presque noir) ; les dos des livres
 * fermés, sans titre, de tons éteints (jamais le cobalt) ; la veste du libraire.
 */
const C = {
  cobalt: COLORS_3E.cobalt,
  glass: 0xa9bccc,
  hollow: 0x5c5650,
  books: [0x8a6c52, 0x7d8a6e, 0x9a7f62, 0x6f7d8c, 0xa38f6e] as const,
  page: 0xd6d0c0,
  coat: 0x6e7a6a,
  cushion: 0x9a6a58,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site3e('coupole');

/** Le plan du sol sous la salle et son seuil : la deuxième Prairie est une table plate. */
const planeY = groundPlane4e(SITE.ground, [-8, 8], [-8, 11]);

/** Le socle de granit, rond à douze pans ; la salle ronde dessus : son rayon, l'épaisseur de son mur, sa hauteur. */
const PLINTH = { r: 5.0, h: 0.35, sides: 12 } as const;
const HALL = { r: 4.6, wall: 0.35, h: 3.6, sectors: 12, cornice: 0.28 } as const;

/** La large porte, au sud : le pan de mur qu'elle ouvre (son cap), le haut de l'ouverture. */
const DOOR_GAP = { cap: 180, top: 2.7 } as const;

/** Les pans de mur ébréchés de la ruine, sous le trou de la coupole, et leur haut cassé. */
const BROKEN = { caps: [120, 150] as const, tops: [2.5, 2.9] as const } as const;

/** Les six hautes fenêtres en arc : leurs caps, leur largeur, leur bas et leur haut. */
const WINDOWS = { caps: [30, 90, 120, 240, 270, 330] as const, w: 0.8, y0: 0.9, y1: 2.6 } as const;

/**
 * La coupole : ses anneaux de la corniche au lanterneau (rayon, hauteur au-dessus de la corniche) ; le dernier pan, autour
 * du lanterneau, porte un peu de neige ; les secteurs ouverts dans la ruine (au sud-est, vers la porte), sur les trois
 * premiers rangs.
 */
const DOME = {
  rings: [
    { r: 4.85, y: 0 },
    { r: 4.4, y: 1.05 },
    { r: 3.45, y: 1.95 },
    { r: 2.3, y: 2.45 },
    { r: 0.85, y: 2.8 },
  ] as const,
  open: [120, 150] as const,
  openRows: 3,
} as const;

/** La coupole de la ruine penche vers le sud-est (son cap), du bord nord-ouest (la bascule, en radians). */
const DOME_LEAN = { cap: 135, pitch: 0.08 } as const;

/** Le lanterneau : son rayon, sa hauteur, son chapeau d'émail, l'épi de fer. */
const LANTERN_HOUSE = { r: 0.7, h: 0.75, cap: 0.55, spike: 0.5 } as const;

/** La grande table, au milieu ; sa lampe (le haut). */
const TABLE = { x: 0, z: 0.4, w: 2.6, d: 1.2, h: 0.78 } as const;

/** Les quatre pupitres, en rond autour de la table. */
const DESKS = { r: 2.7, caps: [60, 120, 240, 300] as const } as const;

/** Les deux rayonnages, contre le mur du fond (au nord), face à la porte. */
const SHELVES = { r: 4.05, caps: [343, 17] as const, w: 1.9, h: 2.5, rows: [0.5, 1.15, 1.8] as const } as const;

/** Le seuil rond dallé, devant la porte ; ses deux bancs, à l'ouest. */
const THRESHOLD = { x: 0, z: 6.4, r: 1.9 } as const;
const BENCHES = [
  { x: -2.6, z: 6.6, yaw: Math.PI / 2 },
  { x: -1.9, z: 8.7, yaw: 0.6 },
] as const;

/** Les trois plaques d'émail tombées, appuyées contre le mur (la ruine) : leur cap. */
const PLATES = { caps: [100, 128, 146] as const } as const;

/** La lanterne du chemin (les abords), au sud-ouest de la porte, hors du chemin. */
const PATH_LANTERN = { x: 4.9, z: 10.6, h: 1.4 } as const;

/** L'herbe sèche de la ruine, autour du socle, du côté de la porte. */
const DRY = [
  { x: 3.9, z: 4.6, s: 1 },
  { x: -3.4, z: 4.9, s: 0.85 },
  { x: 5.9, z: 1.6, s: 0.9 },
  { x: 1.5, z: 6.9, s: 0.8 },
] as const;

// ---------- La vue ----------

/**
 * Le cap d'arrivée (correction 2) : au nord, de la porte au sud-est ; la Coupole à gauche de Kéo, jamais derrière lui
 * (relecture du Versant, (b) 1), au soleil ; au fond, la petite arche vers la plus grande Prairie, le zeppelin au loin.
 */
const DOOR_VIEW = capOf(0);

/** La vue d'arrivée basse, un peu reculée : la coupole et son lanterneau entiers dans le cadre. */
const DOOR_FRAME = { height: -1.8, back: 1.5 } as const;

// ---------- Les volumes ----------

/** Le sol du socle : le plus bas de son pourtour. */
const plinthBase = once(() => Math.min(...[0, 90, 180, 270].map((d) => onCircle(PLINTH.r, d)).map((p) => planeY(p.x, p.z))) - 0.05);

/** Le dessus du socle, où se posent les murs et les meubles. */
const deck = (): number => plinthBase() + PLINTH.h;

/** Le haut des murs, sous la corniche ; le pied de la coupole, sur la corniche. */
const wallTop = (): number => deck() + HALL.h;
const domeBase = (): number => wallTop() + HALL.cornice;

/** Le point du nom sur la Carte, au-dessus du lanterneau, le même en ruine et restauré. */
const MAP_POINT: Vec3 = {
  x: 0,
  get y() {
    return domeBase() + DOME.rings[DOME.rings.length - 1].y + LANTERN_HOUSE.h + LANTERN_HOUSE.cap + 1.4;
  },
  z: 0,
};

/** Le cap d'un point (en degrés) en lacet d'un repère dont le nord local regarde ce cap. */
const yawOf = (deg: number): number => (-deg * Math.PI) / 180;

const at3 = (r: number, deg: number, y: number): P3 => {
  const p = onCircle(r, deg);
  return [p.x, y, p.z];
};

/**
 * Un pan de mur rond, du cap `a0` au cap `a1`, entre les rayons `r0` et `r1`, de `y0` à `y1` : sa face du dehors, sa face
 * du dedans (un cran à l'ombre), son dessus ; ses bouts, s'il y a un vide à côté (`ends`).
 */
function ringSector(b: FacetBuilder, r0: number, r1: number, y0: number, y1: number, a0: number, a1: number, side: number, top: number, ends = false): void {
  const m = onCircle(1, (a0 + a1) / 2);
  quadOut(b, at3(r1, a0, y0), at3(r1, a1, y0), at3(r1, a1, y1), at3(r1, a0, y1), [m.x, 0, m.z], side);
  quadOut(b, at3(r0, a0, y0), at3(r0, a1, y0), at3(r0, a1, y1), at3(r0, a0, y1), [-m.x, 0, -m.z], C3E.stoneShade);
  quadOut(b, at3(r0, a0, y1), at3(r1, a0, y1), at3(r1, a1, y1), at3(r0, a1, y1), [0, 1, 0], top);
  if (!ends) return;
  for (const [a, s] of [
    [a0, -1],
    [a1, 1],
  ] as const) {
    const t = onCircle(1, a + s * 90);
    quadOut(b, at3(r0, a, y0), at3(r1, a, y0), at3(r1, a, y1), at3(r0, a, y1), [t.x, 0, t.z], side);
  }
}

/** Le cap de début et de fin du secteur de mur centré sur `cap`. */
const sectorOf = (cap: number): [number, number] => [cap - 180 / HALL.sectors, cap + 180 / HALL.sectors];
const SECTOR_CAPS = Array.from({ length: HALL.sectors }, (_, k) => (360 * k) / HALL.sectors);

/** Le socle de granit, toujours là. */
function plinth(b: FacetBuilder): void {
  b.prism({ x: 0, y: plinthBase() - 0.3, z: 0, yaw: Math.PI / PLINTH.sides }, PLINTH.r, PLINTH.r, PLINTH.h + 0.3, PLINTH.sides, C3E.graniteShade, C3E.granite);
}

/** Un pan de mur de la salle, plein (jusqu'à `top`), et sa corniche s'il monte jusqu'en haut. */
function wallSector(b: FacetBuilder, cap: number, top = wallTop(), ends = false): void {
  const [a0, a1] = sectorOf(cap);
  const rIn = HALL.r - HALL.wall;
  if (cap === DOOR_GAP.cap) {
    // La large porte : le linteau seul, au-dessus de l'ouverture.
    ringSector(b, rIn, HALL.r, deck() + DOOR_GAP.top, top, a0, a1, C3E.stone, C3E.stone, true);
  } else ringSector(b, rIn, HALL.r, deck() - 0.05, top, a0, a1, C3E.stone, C3E.stone, ends);
  if (top >= wallTop()) ringSector(b, rIn - 0.05, HALL.r + 0.12, wallTop(), domeBase(), a0, a1, C3E.stoneShade, C3E.stone);
}

/** Une haute fenêtre en arc sur le mur, au cap `deg` : vitrée, ou vide (la ruine) ; son haut en deux crans. */
function windowAt(b: FacetBuilder, deg: number, glazed: boolean): void {
  const p = onCircle(HALL.r + 0.02, deg);
  const color = glazed ? C.glass : C.hollow;
  const W = WINDOWS;
  b.box({ x: p.x, y: deck() + W.y0, z: p.z, yaw: yawOf(deg) }, [W.w, W.y1 - W.y0, 0.08], color);
  b.box({ x: p.x, y: deck() + W.y1, z: p.z, yaw: yawOf(deg) }, [W.w * 0.62, 0.22, 0.08], color);
  // L'appui de pierre claire, un cran en saillie.
  const s = onCircle(HALL.r + 0.06, deg);
  b.box({ x: s.x, y: deck() + W.y0 - 0.1, z: s.z, yaw: yawOf(deg) }, [W.w + 0.2, 0.1, 0.16], C3E.stoneShade, C3E.stone);
}

/** Les deux battants de bois de la large porte, ouverts contre le mur, de part et d'autre de l'ouverture. */
function doorLeaves(b: FacetBuilder): void {
  for (const s of [-1, 1]) {
    const hinge = onCircle(HALL.r + 0.05, DOOR_GAP.cap + (s * 180) / HALL.sectors);
    const out = onCircle(0.55, DOOR_GAP.cap + s * 80);
    b.box({ x: hinge.x + out.x, y: deck(), z: hinge.z + out.z, yaw: yawOf(DOOR_GAP.cap + s * 80 + 90) }, [1.1, DOOR_GAP.top - 0.05, 0.08], C3E.woodShade, C3E.wood);
  }
}

/** Un pan de la coupole, entre deux anneaux et deux caps : l'émail dehors (la neige au dernier rang), le bois dedans. */
function domePanel(b: FacetBuilder, row: number, a0: number, a1: number): void {
  const lo = DOME.rings[row],
    hi = DOME.rings[row + 1];
  const y = domeBase();
  const m = onCircle(1, (a0 + a1) / 2);
  const slope = (lo.r - hi.r) / Math.max(0.01, hi.y - lo.y);
  const out: P3 = [m.x, slope, m.z];
  const q: P3[] = [at3(lo.r, a0, y + lo.y), at3(lo.r, a1, y + lo.y), at3(hi.r, a1, y + hi.y), at3(hi.r, a0, y + hi.y)];
  const top = row === DOME.rings.length - 2;
  quadOut(b, q[0], q[1], q[2], q[3], out, top ? C3E.snow : C.cobalt);
  quadOut(b, q[0], q[1], q[2], q[3], [-out[0], -out[1], -out[2]], C3E.wood);
}

/** Le lanterneau sur la coupole, dans un repère dont son pied est en y = 0 : la pierre, ses quatre vitres, l'émail, l'épi. */
function lanternHouse(l: FacetBuilder): void {
  const L = LANTERN_HOUSE;
  l.prism({ x: 0, y: -0.05, z: 0, yaw: Math.PI / 8 }, 0.9, 0.9, 0.1, 8, C3E.snow);
  l.prism({ x: 0, y: 0, z: 0, yaw: Math.PI / 8 }, L.r, L.r, L.h, 8, C3E.stoneShade, C3E.stone);
  for (const deg of [45, 135, 225, 315]) {
    const p = onCircle(L.r + 0.01, deg);
    l.box({ x: p.x, y: 0.18, z: p.z, yaw: yawOf(deg) }, [0.3, 0.42, 0.04], C.glass);
  }
  l.prism({ x: 0, y: L.h, z: 0, yaw: Math.PI / 8 }, L.r + 0.15, 0, L.cap, 8, C.cobalt);
  l.prism({ x: 0, y: L.h + L.cap - 0.05, z: 0 }, 0.05, 0, L.spike, 4, C3E.iron);
}

/** La coupole entière, refermée (le haut). */
function domeWhole(b: FacetBuilder): void {
  for (let row = 0; row < DOME.rings.length - 1; row++) for (const cap of SECTOR_CAPS) domePanel(b, row, ...sectorOf(cap));
  drawPosed(b, { x: 0, y: domeBase() + DOME.rings[DOME.rings.length - 1].y, z: 0, yaw: 0 }, lanternHouse);
}

/**
 * La coupole ouverte de la ruine, qui penche (relecture des Alpages, (b) 1 : jamais posée à plat) : elle bascule d'un cran
 * autour de son bord nord-ouest, resté sur la corniche, et s'appuie au sud-est sur les deux pans de mur ébréchés.
 */
function domeOpen(b: FacetBuilder): void {
  const pivot = onCircle(DOME.rings[0].r, DOME_LEAN.cap + 180);
  const y = domeBase();
  // Ramenée au pivot, tournée pour que la bascule (autour de x) regarde le sud-est, basculée, puis remise en place.
  const yaw = ((180 - DOME_LEAN.cap) * Math.PI) / 180;
  drawPosed(b, { x: pivot.x, y, z: pivot.z, yaw, pitch: DOME_LEAN.pitch }, (l) =>
    drawPosed(l, { x: 0, y: 0, z: 0, yaw: -yaw }, (k) => drawPosed(k, { x: -pivot.x, y: -y, z: -pivot.z, yaw: 0 }, domeOpenUpright)),
  );
}

/**
 * La coupole ouverte, droite : les secteurs du sud-est manquent sur les trois premiers rangs ; la charpente de bois à nu le
 * long de leurs bords et en travers ; le lanterneau penché, glissé d'un pas.
 */
function domeOpenUpright(b: FacetBuilder): void {
  const open = (cap: number) => (DOME.open as readonly number[]).includes(cap);
  for (let row = 0; row < DOME.rings.length - 1; row++)
    for (const cap of SECTOR_CAPS) if (!(open(cap) && row < DOME.openRows)) domePanel(b, row, ...sectorOf(cap));
  const y = domeBase();
  // Les côtes de bois, du pied de la coupole au bord du trou, aux bords et au milieu du trou.
  for (const cap of [105, 135, 165]) {
    const pts = DOME.rings.slice(0, DOME.openRows + 1).map((r) => at3(r.r - 0.08, cap, y + r.y));
    for (let k = 0; k + 1 < pts.length; k++) b.beam({ x: pts[k][0], y: pts[k][1], z: pts[k][2] }, { x: pts[k + 1][0], y: pts[k + 1][1], z: pts[k + 1][2] }, 0.13, C3E.woodShade);
  }
  // Une lisse de bois en travers du trou, à mi-hauteur.
  const mid = DOME.rings[1];
  const a = at3(mid.r - 0.1, 105, y + mid.y),
    c = at3(mid.r - 0.1, 165, y + mid.y);
  b.beam({ x: a[0], y: a[1], z: a[2] }, { x: c[0], y: c[1], z: c[2] }, 0.12, C3E.woodShade);
  drawPosed(b, { x: 0.35, y: y + DOME.rings[DOME.rings.length - 1].y - 0.12, z: 0.25, yaw: 0.3, pitch: 0.32 }, lanternHouse);
}

/**
 * Une plaque d'émail tombée (la ruine), appuyée contre le mur au cap `deg`, penchée : son dessous de bois vers le dehors, ou
 * son émail (`enamelOut`, une sur trois, pour que la plaque se lise).
 */
function fallenPlate(b: FacetBuilder, deg: number, enamelOut: boolean): void {
  const foot = onCircle(PLINTH.r + 0.8, deg);
  const head = onCircle(PLINTH.r + 0.05, deg);
  const t = onCircle(0.6, deg + 90);
  const g = planeY(foot.x, foot.z);
  const y0 = g - 0.05,
    y1 = deck() + 1.3;
  // Le haut, plus étroit (la plaque est un pan de la coupole) ; le dessus d'émail contre le mur, le bois dehors.
  sheet(
    b,
    [
      [foot.x - t.x, y0, foot.z - t.z],
      [foot.x + t.x, y0, foot.z + t.z],
      [head.x + t.x * 0.6, y1, head.z + t.z * 0.6],
      [head.x - t.x * 0.6, y1, head.z - t.z * 0.6],
    ],
    0.1,
    enamelOut ? C.cobalt : C3E.wood,
    enamelOut ? C3E.wood : C.cobalt,
  );
}

/** La grande table, debout ; sa lampe pendue au-dessus quand le haut est posé. */
function tableUp(b: FacetBuilder): void {
  const T = TABLE;
  const y = deck();
  b.box({ x: T.x, y: y + T.h - 0.08, z: T.z }, [T.w, 0.08, T.d], C3E.woodShade, C3E.newWood);
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const)
    b.box({ x: T.x + sx * (T.w / 2 - 0.12), y: y - 0.02, z: T.z + sz * (T.d / 2 - 0.12) }, [0.1, T.h - 0.06, 0.1], C3E.woodShade);
  // Deux livres fermés posés, sans titre.
  b.box({ x: T.x - 0.6, y: y + T.h, z: T.z + 0.1, yaw: 0.2 }, [0.42, 0.08, 0.3], C.books[0], C.page);
  b.box({ x: T.x + 0.5, y: y + T.h, z: T.z - 0.15, yaw: -0.3 }, [0.38, 0.1, 0.28], C.books[3], C.page);
}

/** La grande table renversée (la ruine) : son plateau sur la tranche, deux pieds en l'air ; deux piles de livres couchées. */
function tableDown(b: FacetBuilder): void {
  const T = TABLE;
  const y = deck();
  b.box({ x: T.x + 0.3, y: y - 0.05, z: T.z - 0.2, yaw: 0.35, pitch: 1.25 }, [T.w, 0.08, T.d], C3E.woodShade, C3E.wood);
  for (const [x, z, n] of [
    [-1.4, 1.5, 4],
    [1.6, 1.9, 3],
  ] as const)
    for (let k = 0; k < n; k++) b.box({ x: x + (k % 2) * 0.05, y: y + k * 0.09, z, yaw: 0.25 * k }, [0.4, 0.09, 0.3], C.books[k % C.books.length], C.page);
}

/** Les quatre pupitres en rond : un pied de bois, un plan incliné vers la table. */
function desks(b: FacetBuilder): void {
  for (const deg of DESKS.caps) {
    const p = onCircle(DESKS.r, deg);
    drawPosed(b, { x: p.x, y: deck(), z: p.z, yaw: yawOf(deg) }, (l) => {
      l.box({ x: 0, y: -0.02, z: 0 }, [0.1, 0.9, 0.1], C3E.woodShade);
      l.box({ x: 0, y: 0.88, z: 0, pitch: 0.4 }, [0.62, 0.05, 0.46], C3E.woodShade, C3E.newWood);
    });
  }
}

/** Un rayonnage contre le mur, sa face vers la table ; ses rangs de livres fermés, sans titre (`full`), ou vides. */
function shelf(l: FacetBuilder, full: boolean): void {
  const S = SHELVES;
  for (const s of [-1, 1]) l.box({ x: (s * S.w) / 2, y: -0.02, z: 0 }, [0.08, S.h, 0.4], C3E.woodShade, C3E.wood);
  for (const y of [...S.rows, S.h - 0.06]) l.box({ x: 0, y, z: 0 }, [S.w, 0.05, 0.4], C3E.woodShade, C3E.wood);
  if (!full) return;
  S.rows.forEach((y, k) => {
    const widths = [0.95, 0.75];
    let x = -S.w / 2 + 0.08;
    widths.forEach((w, j) => {
      l.box({ x: x + w / 2, y: y + 0.05, z: -0.02 }, [w - 0.03, 0.42 - 0.04 * j, 0.3], C.books[(k + j) % C.books.length], C.books[(k + j + 2) % C.books.length]);
      x += w;
    });
  });
}

/** Les deux rayonnages, pleins ou vides (la ruine). */
function shelves(b: FacetBuilder, full: boolean): void {
  for (const deg of SHELVES.caps) {
    const p = onCircle(SHELVES.r, deg);
    drawPosed(b, { x: p.x, y: deck(), z: p.z, yaw: yawOf(deg) }, (l) => shelf(l, full));
  }
}

/** Le seuil rond dallé devant la porte, en deux tons. */
function threshold(b: FacetBuilder): void {
  const T = THRESHOLD;
  const y = planeY(T.x, T.z);
  b.prism({ x: T.x, y: y - 0.1, z: T.z, yaw: Math.PI / 10 }, T.r, T.r, 0.16, 10, C3E.joint, C3E.stoneShade);
  b.prism({ x: T.x, y: y - 0.1, z: T.z, yaw: Math.PI / 10 }, T.r * 0.55, T.r * 0.55, 0.18, 10, C3E.joint, C3E.stone);
}

/** Un banc de pierre claire à planche de bois, sur deux pieds de granit. */
function bench(b: FacetBuilder, x: number, z: number, yaw: number): void {
  const y = planeY(x, z);
  drawPosed(b, { x, y, z, yaw }, (l) => {
    for (const s of [-1, 1]) l.box({ x: s * 0.6, y: -0.1, z: 0 }, [0.28, 0.55, 0.38], C3E.graniteShade, C3E.granite);
    l.box({ x: 0, y: 0.45, z: 0 }, [1.6, 0.1, 0.44], C3E.woodShade, C3E.wood);
  });
}

function model(add: AddPiece): void {
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 1 / 3 };
  const corps3 = { stage: 0 as Stage, row: 2 / 3 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };
  const broken = (cap: number) => (BROKEN.caps as readonly number[]).includes(cap);

  // Toujours là : le socle, les pans de mur debout et leur corniche, le linteau de la porte ; la lanterne du libraire, au
  // mur à droite de la porte, la seule allumée de la ruine.
  add('ruine', 0, (b) => {
    plinth(b);
    for (const cap of SECTOR_CAPS) if (!broken(cap)) wallSector(b, cap, wallTop(), cap === 90 || cap === 180);
    const w = onCircle(HALL.r + 0.02, 158);
    const out = onCircle(1, 158);
    armLantern3e(b, w.x, deck() + 2.3, w.z, out.x, out.z, true);
  });
  // Les murs (corps 1) relèvent les deux pans ébréchés, leurs fenêtres vides et les autres.
  add(
    'ruine',
    0,
    (b) => {
      BROKEN.caps.forEach((cap, k) => wallSector(b, cap, deck() + BROKEN.tops[k], true));
      for (const deg of WINDOWS.caps) if (!broken(deg)) windowAt(b, deg, false);
    },
    corps1,
  );
  // La table (corps 2) relève la grande table renversée et les piles de livres couchées.
  add('ruine', 0, tableDown, corps2);
  // Les rayonnages (corps 3) remplacent les rayonnages vides.
  add('ruine', 0, (b) => shelves(b, false), corps3);
  // Le haut referme la coupole ouverte et relève les trois plaques d'émail appuyées contre le mur.
  add(
    'ruine',
    0,
    (b) => {
      domeOpen(b);
      PLATES.caps.forEach((deg, k) => fallenPlate(b, deg, k === 1));
    },
    haut,
  );
  // Les abords effacent l'herbe sèche.
  add('ruine', 0, (b) => DRY.forEach((d) => dryTuft3e(b, d.x, planeY(d.x, d.z), d.z, d.s)), abords);

  // ---- Les murs : les deux pans refaits, les six hautes fenêtres vitrées, les deux battants de la porte, ouverts.
  add(0, 0, (b) => {
    for (const cap of BROKEN.caps) wallSector(b, cap);
    for (const deg of WINDOWS.caps) windowAt(b, deg, true);
    doorLeaves(b);
  });
  // ---- La table et les pupitres.
  add(0, 1 / 3, (b) => {
    tableUp(b);
    desks(b);
  });
  // ---- Les rayonnages pleins de livres fermés.
  add(0, 2 / 3, (b) => shelves(b, true));
  // ---- Le haut : la coupole refermée, son lanterneau ; la lampe de la grande table, allumée.
  add(1, 0, (b) => {
    domeWhole(b);
    lantern3e(b, { x: TABLE.x, y: deck() + 2.2, z: TABLE.z }, true);
    b.beam({ x: TABLE.x, y: deck() + 2.2, z: TABLE.z }, { x: TABLE.x, y: wallTop(), z: TABLE.z }, 0.03, C3E.iron);
  });
  // ---- Les abords : le seuil dallé, ses deux bancs, la lanterne du chemin.
  add(2, 0, (b) => {
    threshold(b);
    for (const s of BENCHES) bench(b, s.x, s.z, s.yaw);
    const p = PATH_LANTERN;
    postLantern3e(b, p.x, planeY(p.x, p.z), p.z, p.h, true);
  });
}

// ---------- Les traces ----------

/** Les places des traces, depuis le centre du lieu, loin du chemin et de la scène. */
const TRACE_SPOTS = {
  cart: { x: -3.5, z: 4.4 },
  stool: { x: -5.3, z: 3.2 },
  bundle: { x: -6.0, z: 0.4 },
  pole: onCircle(PLINTH.r + 0.55, 72),
  lectern: { x: -4.4, z: 8.4 },
} as const;

/** Un chariot à livres de bois, ses deux roues, ses livres fermés (Inférences). */
function cart(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.cart;
    const y = planeY(x, z);
    drawPosed(l, { x, y, z, yaw: 0.5 }, (k) => {
      k.box({ x: 0, y: 0.3, z: 0 }, [1.0, 0.45, 0.5], C3E.woodShade, C3E.wood);
      for (const s of [-1, 1]) k.drum({ x: s * 0.42, y: 0.22, z: 0.28 }, 0.22, 0.06, 8, C3E.iron, C3E.ironTop);
      k.beam({ x: -0.5, y: 0.7, z: 0 }, { x: -0.85, y: 0.95, z: 0 }, 0.05, C3E.woodShade);
      [0.22, 0.2, 0.24].forEach((w, j) => k.box({ x: -0.28 + j * 0.28, y: 0.75, z: 0 }, [w, 0.3, 0.32], C.books[j + 1], C.page));
    });
  });
}

/** Un tabouret de lecture et son coussin (Figures de style). */
function stool(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.stool;
    const y = planeY(x, z);
    for (const [dx, dz] of [
      [-0.15, -0.15],
      [0.15, -0.15],
      [-0.15, 0.15],
      [0.15, 0.15],
    ] as const)
      l.box({ x: x + dx, y: y - 0.05, z: z + dz }, [0.05, 0.5, 0.05], C3E.woodShade);
    l.box({ x, y: y + 0.45, z }, [0.44, 0.06, 0.44], C3E.woodShade, C3E.newWood);
    l.box({ x, y: y + 0.51, z }, [0.38, 0.1, 0.38], C.cushion);
  });
}

/** Une pile de livres fermés liée d'une sangle, sur une caisse (Rouages du texte). */
function bundle(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.bundle;
    const y = planeY(x, z);
    l.box({ x, y: y - 0.05, z, yaw: 0.2 }, [0.6, 0.5, 0.5], C3E.woodShade, C3E.newWood);
    for (let k = 0; k < 4; k++) l.box({ x, y: y + 0.45 + k * 0.1, z, yaw: 0.2 + 0.05 * k }, [0.42, 0.1, 0.32], C.books[k], C.page);
    l.box({ x, y: y + 0.44, z, yaw: 0.2 }, [0.07, 0.43, 0.36], C3E.leather);
  });
}

/** Une longue perche à crochet de fer, appuyée au mur (Voix des textes). */
function pole(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const foot = TRACE_SPOTS.pole;
    const head = onCircle(HALL.r + 0.1, 76);
    const y = planeY(foot.x, foot.z);
    l.beam({ x: foot.x, y: y - 0.1, z: foot.z }, { x: head.x, y: deck() + 3.2, z: head.z }, 0.07, C3E.wood);
    l.beam({ x: head.x, y: deck() + 3.2, z: head.z }, { x: head.x, y: deck() + 3.0, z: head.z + 0.2 }, 0.04, C3E.iron);
  });
}

/** Un pupitre de plein air, un livre fermé posé dessus (Genres et époques). */
function lectern(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.lectern;
    const y = planeY(x, z);
    drawPosed(l, { x, y, z, yaw: -0.6 }, (k) => {
      k.box({ x: 0, y: -0.1, z: 0 }, [0.12, 1.1, 0.12], C3E.woodShade);
      k.box({ x: 0, y: -0.05, z: 0 }, [0.5, 0.08, 0.5], C3E.graniteShade, C3E.granite);
      k.box({ x: 0, y: 1.0, z: 0, pitch: 0.45 }, [0.6, 0.05, 0.45], C3E.woodShade, C3E.newWood);
      k.box({ x: 0, y: 1.06, z: 0.02, pitch: 0.45 }, [0.36, 0.06, 0.26], C.books[2], C.page);
    });
  });
}

/** Les cinq traces, une par mission, chacune avec sa partie : les murs, la table, les rayonnages, le haut, les abords. */
const TRACES = {
  inference: { at: TRACE_SPOTS.cart, lift: 1.2, stage: 0, row: 0, draw: cart },
  'figures-of-speech': { at: TRACE_SPOTS.stool, lift: 1, stage: 0, row: 1 / 3, draw: stool },
  'text-connectives': { at: TRACE_SPOTS.bundle, lift: 1.2, stage: 0, row: 2 / 3, draw: bundle },
  voices: { at: TRACE_SPOTS.pole, lift: 1.6, stage: 1, row: 0, draw: pole },
  'literary-eras': { at: TRACE_SPOTS.lectern, lift: 1.4, stage: 2, row: 0, draw: lectern },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/** Le cap de départ de la scénette (proposition, § 4) : au nord-ouest, la Coupole à droite, la Prairie au loin. */
const SCENE_START = capOf(315);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers le libraire). */
const SCENE_RIGHT = sceneRight(SCENE_START);

/** Le milieu de la scène, depuis le centre du lieu : au seuil, à l'est des bancs, la porte à droite. */
const SCENE_SPOT = { dx: 1.9, dz: 7.6, half: [2.4, 1.2] as [number, number] } as const;

/** L'écart de Kéo et du libraire au milieu de la scène. */
const SCENE_HALF = 2.0;

/** La hauteur du sol de la scène au-dessus de son point : l'herbe de la Prairie. */
const sceneRiseOf = once(() => sceneRise(SITE.ground, SCENE_SPOT, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz)));

/** La table des livres : sa hauteur à l'échelle 1 ; un livre choisi se soulève d'un cran. */
const DESK = { height: 0.62, lift: 0.28, book: 0.24 } as const;

/** Un livre fermé, sans titre, couché, son signet de cuir qui dépasse ; tous pareils. */
function markedBook(b: FacetBuilder, at: Vec3, s: number): void {
  b.box({ x: at.x, y: at.y, z: at.z }, [0.3 * s, 0.09 * s, 0.22 * s], C.books[0], C.page);
  b.box({ x: at.x + 0.02 * s, y: at.y - 0.12 * s, z: at.z + 0.12 * s }, [0.05 * s, 0.22 * s, 0.015 * s], C3E.leather);
}

export const COUPOLE: PlaceArt = {
  role: 'Le libraire',
  model,
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    get rise() {
      return sceneRiseOf();
    },
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 3.2, depth: 0.3 },
    pitch: (10 * Math.PI) / 180,
    start: SCENE_START,
  },
  decor(b, _floor, at, sphere: Sphere, body = true) {
    if (body) habitant3e(b, at, sphere, C.coat, 0x5d6470, 0x8a7a6a);
  },
  answer: {
    size: { height: DESK.height + DESK.lift + DESK.book, half: 0.3 },
    facing: true,
    // Une table basse de bois, sous le rang des livres.
    base(b, mid, y, z, span, s, ground) {
      const top = y + DESK.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.46 * s], C3E.woodShade, C3E.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.15);
        const f = Math.min(ground, y) - 0.3;
        b.box({ x, y: f, z }, [0.1, top - 0.08 * s - f, 0.4 * s], C3E.woodShade);
      }
    },
    // Un livre et son signet, tous pareils ; choisi, il se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      markedBook(b, { x: at.x, y: at.y + (DESK.height + (picked ? DESK.lift : 0)) * s, z: at.z }, s);
    },
  },
  rest() {},
  traces: TRACES,
  exit: { x: SITE.door.x - 0.4, z: SITE.door.z - 0.6 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan de la Coupole, pour les tests. */
export const COUPOLE_LAYOUT = {
  plinth: PLINTH,
  hall: HALL,
  dome: DOME,
  planeY,
  door: SITE.door,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  scene: SCENE_SPOT,
  traceSpots: TRACE_SPOTS,
  hollow: C.hollow,
} as const;
