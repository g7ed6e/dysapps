// L'Étalon (lot 2 du monde ouvert du 4e, GD-24 ; intention du directeur artistique du 21 octobre 2026, planche
// `selection-fabriques-v1` validée par le mainteneur le même jour, rangée 3) : « la halle où l'on pesait, tirait au
// hasard, triait et dosait le minerai avant de l'envoyer au fourneau ». Le deuxième lieu fini du 4e, sur le gabarit de la
// Forge (./forge4e.ts). La halle de brique sur son soubassement de pierre grise, fermée au nord, à l'ouest et à l'est,
// ouverte au sud sur deux piliers, son toit de tôle à deux pans, son faîtage d'est en ouest. Le cœur, sans figure : à
// l'ouest, la bascule à plateau et sa potence, le peson pendu ; au milieu, le tonneau de tirage sur ses chevalets, et au
// fond la table de la pile des étalons (des coupes de fonte emboîtées dans leur boîte ouverte) ; à l'est, les deux cuves
// doseuses et la trieuse à goulotte, ses trois bacs en rang. Au mur du fond, trois niches de tailles différentes à des
// hauteurs différentes, jamais en escalier (correction 1 du directeur artistique) ; la grande, à l'ouest, porte le signe
// de l'absence du 4e : un support de fer vide, deux goujons nus (le grand poids étalon de bronze, pris par les
// Ferrailleurs). Avant comme après, jamais une étape. Le butoir de la ligne, au bout des rails, est contre le mur ouest :
// il est à la ligne (./paths4e.ts), jamais au lieu. Rien n'évoque le cheval (correction 5).
//
// La ruine, plus marquée que la planche (le mainteneur) : le mur est cassé en biais, le fond écrêté à l'est ; un pilier
// cassé à mi-hauteur, son haut couché dans la cour ; le pan nord du toit tient à moitié, le pan sud est tombé en biais ;
// la bascule de travers et son peson à terre ; le tonneau couché hors de ses chevalets ; une cuve couchée ; la trieuse à
// terre, deux bacs renversés ; la table des étalons renversée, deux coupes roulées. Une seule lumière, la lanterne de la
// peseuse. Cinq parties (3 + 1 + 1) : le corps en trois (la bascule ; le tonneau ; les cuves et la trieuse), le haut (le
// toit, les murs et le pilier relevés, la pile des étalons, les petites niches garnies, la lanterne de la halle), les
// abords (la cour dallée, la lanterne du chemin). Une trace par mission, avec sa partie. Le fer de la ruine est d'un brun
// éteint, jamais la rouille claire qui se lisait orange à la Forge ; restauré, il est bruni sombre. Aucune lueur rouge.
// Rien à lire dans la 3D, rien de croisé, rien qui bouge. Code pur (placeArt.ts).
import type { Stage } from './construction';
import { FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_4E, PATH_NODES_4E, PLACES_4E } from './plan4e';
import { COLORS_5E } from './plan5e';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';
import { inWorld, lantern, localGround4e, quadOut } from './place4eKit';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter (places.ts). */
const SINK = -0.8;

type P3 = readonly [number, number, number];

/**
 * Les couleurs de l'Étalon : la brique de l'usine et la pierre grise des Passeurs à assises (`COLORS_4E`) ; le fer de la
 * ruine d'un brun éteint (jamais la rouille claire, qui se lisait orange au soleil bas : relevé sur la Forge) ; le fer
 * restauré bruni sombre, chaud, jamais presque noir ; la tôle du toit, rouillée en ruine (brun éteint), de fer bruni
 * neuve, son dessous un cran plus sombre ; l'ombre des niches et le dedans des cuves ; le bois gris de la ruine, le bois
 * neuf brun des outils ; la toile du sac ; le dallage de la cour et ses joints. L'ocre des lanternes, seule lumière.
 */
const C = {
  brick: COLORS_4E.brick,
  brickShade: COLORS_4E.brickShade,
  stone: COLORS_4E.stone,
  stoneSun: COLORS_4E.stoneSun,
  stoneShade: COLORS_4E.stoneShade,
  rustDull: 0x6a483e,
  rustDullTop: 0x74524a,
  rustUnder: 0x6c5048,
  iron: 0x5c504c,
  ironTop: 0x6c5e58,
  sheet: 0x7a6e68,
  sheetUnder: 0x6a5e58,
  niche: 0x4e3a34,
  hollow: 0x4a423e,
  wood: COLORS_4E.wood,
  woodShade: COLORS_4E.woodShade,
  newWood: 0xa68672,
  newShade: 0x8c766a,
  canvas: 0xc8b89a,
  canvasShade: 0xa8987c,
  floor: 0xa89c90,
  paving: 0xb0a598,
  joint: 0x8a8078,
  lantern: COLORS_5E.lantern,
  lanternOff: 0xbfc4b8,
  bronze: 0x9c8452,
  // Les poids des réponses : une fonte gris chaud, plus claire que le fer bruni, sans marque.
  weight: 0x8e8580,
  weightTop: 0x9e958e,
  // La peseuse, en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, tablier de toile, chemise.
  boots: 0x55595a,
  apron: 0x8a7a64,
  shirt: 0x7e8a8e,
  head: 0xe3b48a,
} as const;

// ---------- Le repère du lieu ----------

const CENTER: Vec2 = PLACES_4E.find((p) => p.id === 'etalon')!.center;
const H0 = standingHeight(heightAt4e(CENTER));

/** Le sol du 4e sous un point du repère du lieu, depuis le sol de son centre. */
const localGround = localGround4e(CENTER);

const toLocal = (p: Vec2): Vec2 => ({ x: p.x - CENTER.x, z: p.z - CENTER.z });

/** Le pas de la porte, au bout de ses deux chemins (`fab-2`, `fab-4`), depuis le centre. */
const DOOR_AT: Vec2 = toLocal(PATH_NODES_4E.find((p) => p.id === 'etalon')!.at);

/**
 * La halle : ses bords (x d'ouest en est, z du nord au sud), l'épaisseur de ses murs, leur hauteur, celle du soubassement
 * de pierre, le faîtage du toit (son z et sa hauteur), le débord du toit ; le dessus de son sol dallé, au-dessus du plan.
 */
const HALL = { x0: -6.9, x1: 5.4, z0: -8.4, z1: -2.2, wall: 0.45, h: 3.8, plinth: 0.6, ridgeZ: -5.3, ridge: 5.2, eave: 0.5, overhang: 0.35, floor: 0.18 } as const;

/** Les deux piliers de la façade (le mur ouest et le mur est en font les deux autres) ; celui de l'est se casse dans la ruine. */
const PILLARS = [-2.6, 1.4] as const;
const PILLAR = 0.55;

/**
 * Les trois niches du mur du fond (correction 1 : de tailles différentes, à des hauteurs différentes, jamais en escalier ni
 * rangées par taille) : leur milieu en x, leur bas et leur haut au-dessus du sol de la halle, leur demi-largeur. La grande,
 * vide, porte le signe de l'absence ; les deux autres sont garnies d'un poids avec le haut.
 */
const NICHES = [
  { x: -4.4, y0: 1.5, y1: 3.0, half: 0.75 },
  { x: 0.5, y0: 2.55, y1: 3.15, half: 0.3 },
  { x: 2.3, y0: 1.05, y1: 1.75, half: 0.45 },
] as const;

/** La bascule, à l'ouest : le milieu de son plateau, sa taille ; sa potence (deux montants derrière, une traverse) ; le peson pendu. */
const SCALE = { x: -4.6, z: -4.4, w: 2.2, d: 1.6, h: 0.22, gallowsZ: -5.55, gallowsH: 2.9, half: 1.25, peson: 2.15 } as const;

/** Le tonneau de tirage, au milieu : son axe d'est en ouest, son rayon, sa longueur, la hauteur de son axe ; ses chevalets. */
const BARREL = { x: -0.6, z: -3.9, r: 0.5, len: 1.15, axle: 1.0 } as const;

/** Les deux cuves doseuses, à l'est : leurs milieux, leurs rayons au pied et au bord, leur hauteur, le socle commun. */
const VATS = { at: [2.4, 3.8], z: -4.7, r0: 0.45, r1: 0.58, h: 0.85, base: 0.3 } as const;

/** La trieuse, au fond à l'est : sa goulotte en pente vers l'est, et ses trois bacs en rang, de la même taille. */
const SORTER = { x: 3.95, z: -7.2, bins: [3.25, 3.95, 4.65], binZ: -6.45 } as const;

/** La table des étalons, au fond, au milieu ; sa boîte ouverte, la pile de coupes emboîtées (sans marque). */
const TABLE = { x: -1.0, z: -7.5, w: 1.7, d: 0.8, h: 0.85 } as const;

/** La lanterne de la peseuse (seule allumée de la ruine), au pilier ouest de la façade ; celle de la halle (le haut), au pilier est. */
const LANTERN_PESEUSE = { x: PILLARS[0], y: 2.5 } as const;
const LANTERN_HALL = { x: PILLARS[1], y: 2.5 } as const;
/** La lanterne du chemin (les abords), au coin sud-ouest de la cour, hors du chemin. */
const PATH_LANTERN = { x: -1.3, z: 3.0, h: 1.35 } as const;

/**
 * La cour dallée des abords, devant la halle : ses coins, du sud-ouest dans le sens inverse des aiguilles d'une montre vu
 * d'en haut ; son coin nord-ouest s'arrête à un pas du butoir, son bord ouest longe le chemin à deux unités de son axe.
 */
const YARD: readonly Vec2[] = [
  { x: -1.0, z: 3.4 },
  { x: 5.6, z: 3.4 },
  { x: 5.6, z: -2.0 },
  { x: -6.8, z: -2.0 },
];

/**
 * Le plan du sol, ajusté sous la halle et la cour (aux moindres carrés), relevé juste assez pour ne jamais passer sous le
 * sol : la plaine des Fabriques est presque plate ici (à 0,1 près).
 */
const PLANE = (() => {
  const pts: [number, number, number][] = [];
  for (let x = -8; x <= 7 + 1e-6; x += 0.5) for (let z = -9; z <= 4 + 1e-6; z += 0.5) pts.push([x, z, localGround(x, z)]);
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

/** Le dessus du plan du sol en un point du repère (la cour s'y pose ; la halle un cran plus haut). */
const planeY = (x: number, z: number): number => PLANE.a + PLANE.b * x + PLANE.c * z;
/** Le dessus du sol dallé de la halle. */
const hallY = (x: number, z: number): number => planeY(x, z) + HALL.floor;

// ---------- La vue ----------

/**
 * Le cap de la caméra de « Y aller » (intention, « L'arrivée ») : 40° à l’ouest du nord, depuis la porte. Le chemin part
 * au nord-ouest, la halle est au centre-droit, et le cône du volcan et son panache restent à gauche, au-dessus des rails :
 * le repère du niveau. La caméra regarde vers −(sin cap, cos cap).
 */
const DOOR_VIEW = (40 * Math.PI) / 180;

/**
 * La vue d'arrivée (`doorFrame`) : reculée d'une fois et demie, et plus basse que la caméra qui suit (la correction « à
 * hauteur de Kéo » du mainteneur) : le regard presque à l'horizontale, le cône au-dessus de la plaine.
 */
const DOOR_FRAME = { height: -3, back: 1.5 } as const;

/** Le point du nom sur la Carte, depuis le centre du lieu : au-dessus du faîtage, au milieu, le même en ruine et restauré. */
const MAP_POINT: Vec3 = { x: -0.7, y: HALL.floor + HALL.ridge + 1.5, z: HALL.ridgeZ };

// ---------- Les petits volumes ----------

/**
 * Un pan de mur droit, d'ouest en est (`alongX`) ou du nord au sud, de `from` à `to` sur son axe, centré sur `at` en
 * travers, épais de `thick`, de `y0` jusqu'à `top0` à son début et `top1` à sa fin (un haut cassé en biais) : son dessus,
 * ses deux faces, ses deux bouts (le dessous ne se voit pas).
 */
function wallRun(b: FacetBuilder, alongX: boolean, at: number, from: number, to: number, thick: number, y0: number, top0: number, top1: number, side: number, top: number): void {
  const t = thick / 2;
  const p = (u: number, v: number, y: number): P3 => (alongX ? [u, y, at + v] : [at + v, y, u]);
  const corners = [p(from, -t, 0), p(to, -t, 0), p(to, t, 0), p(from, t, 0)];
  const lo = corners.map(([x, , z]) => [x, y0, z] as P3);
  const hi = corners.map(([x, , z], k) => [x, k === 0 || k === 3 ? top0 : top1, z] as P3);
  const mid: P3 = [(lo[0][0] + lo[2][0]) / 2, (y0 + Math.max(top0, top1)) / 2, (lo[0][2] + lo[2][2]) / 2];
  for (let k = 0; k < 4; k++) {
    const m = (k + 1) % 4;
    const fc: P3 = [(lo[k][0] + lo[m][0]) / 2 - mid[0], 0, (lo[k][2] + lo[m][2]) / 2 - mid[2]];
    quadOut(b, lo[k], lo[m], hi[m], hi[k], fc, side);
  }
  quadOut(b, hi[0], hi[1], hi[2], hi[3], [0, 1, 0], top);
}

/** Un pan de tôle épais de `t` (dessus et dessous), entre quatre coins dans l'ordre du tour : le dessus de `top`, le dessous de `under`. */
function sheet(b: FacetBuilder, q: readonly P3[], t: number, top: number, under: number): void {
  const up = q.map(([x, y, z]) => [x, y + t, z] as P3);
  quadOut(b, up[0], up[1], up[2], up[3], [0, 1, 0], top);
  quadOut(b, q[0], q[1], q[2], q[3], [0, -1, 0], under);
  const cx = q.reduce((s, p) => s + p[0], 0) / 4,
    cz = q.reduce((s, p) => s + p[2], 0) / 4;
  for (let k = 0; k < 4; k++) {
    const m = (k + 1) % 4;
    quadOut(b, q[k], q[m], up[m], up[k], [(q[k][0] + q[m][0]) / 2 - cx, 0, (q[k][2] + q[m][2]) / 2 - cz], under);
  }
}

/** Une lanterne sur un bras, devant un pilier de la façade, à `y` au-dessus du sol de la halle. */
function pillarLantern(b: FacetBuilder, x: number, y: number): void {
  const z = HALL.z1 + PILLAR / 2;
  const f = hallY(x, HALL.z1);
  b.box({ x, y: f + y, z: z + 0.2 }, [0.08, 0.08, 0.45], C.woodShade);
  lantern(b, { x, y: f + y - 0.02, z: z + 0.4 }, true);
}

// ---------- La halle ----------

/** Le soubassement de pierre grise des trois murs et le sol dallé de la halle : toujours là. */
function hallBase(b: FacetBuilder): void {
  const H = HALL;
  const g = planeY(0, H.z0);
  const top = g + H.plinth;
  wallRun(b, true, H.z0 + H.wall / 2, H.x0, H.x1, H.wall + 0.08, SINK, top, top, C.stoneShade, C.stoneSun);
  for (const x of [H.x0 + H.wall / 2, H.x1 - H.wall / 2]) wallRun(b, false, x, H.z0, H.z1, H.wall + 0.08, SINK, top, top, C.stoneShade, C.stoneSun);
  // Le sol dallé, de pierre grise un peu plus sombre que la cour.
  const f = (x: number, z: number): P3 => [x, hallY(x, z), z];
  const q = [f(H.x0 + H.wall, H.z1), f(H.x1 - H.wall, H.z1), f(H.x1 - H.wall, H.z0 + H.wall), f(H.x0 + H.wall, H.z0 + H.wall)];
  quadOut(b, q[0], q[1], q[2], q[3], [0, 1, 0], C.floor);
  quadOut(b, [q[0][0], q[0][1] - 0.5, q[0][2]], [q[1][0], q[1][1] - 0.5, q[1][2]], q[1], q[0], [0, 0, 1], C.stoneShade);
}

/** Le haut de brique d'un mur, au-dessus du soubassement, de `top0` à `top1` au-dessus du sol (un haut cassé en biais). */
function brickRun(b: FacetBuilder, alongX: boolean, at: number, from: number, to: number, top0: number, top1: number): void {
  const g = planeY(0, HALL.z0);
  wallRun(b, alongX, at, from, to, HALL.wall, g + HALL.plinth - 0.02, g + top0, g + top1, C.brickShade, C.brick);
}

/** Un pignon de brique au-dessus d'un mur de flanc, du haut du mur au faîtage. */
function gable(b: FacetBuilder, x: number): void {
  const H = HALL;
  const g = planeY(0, H.z0);
  const half = (H.z1 - H.z0) / 2;
  b.extrude({ x: x - H.wall / 2, y: g + H.h - 0.02, z: (H.z0 + H.z1) / 2, yaw: Math.PI / 2 }, [[-half, 0], [half, 0], [0, H.ridge - H.h]], H.wall, C.brickShade, C.brick);
}

/** Un pilier de la façade : son pied de pierre et son fût de brique jusqu'à `h`. */
function pillar(b: FacetBuilder, x: number, h: number): void {
  const z = HALL.z1 - PILLAR / 2;
  const g = planeY(x, z);
  b.box({ x, y: SINK, z }, [PILLAR + 0.1, g + HALL.plinth - SINK, PILLAR + 0.1], C.stoneShade, C.stoneSun);
  b.box({ x, y: g + HALL.plinth - 0.02, z }, [PILLAR, h - HALL.plinth + 0.02, PILLAR], C.brickShade, C.brick);
}

/** Les niches du mur du fond : leur ombre, posée sur la face du mur ; dans la grande, le support de fer vide et ses deux goujons nus. */
function niches(b: FacetBuilder): void {
  const z = HALL.z0 + HALL.wall + 0.012;
  for (const n of NICHES) {
    const f = hallY(n.x, z);
    b.plate({ x: n.x, y: f + n.y0, z }, [[-n.half, 0], [n.half, 0], [n.half, n.y1 - n.y0], [-n.half, n.y1 - n.y0]], C.niche);
  }
  // Le signe de l'absence du 4e, dans la grande niche : le support vide, deux goujons nus.
  const big = NICHES[0];
  const f = hallY(big.x, z);
  b.box({ x: big.x, y: f + big.y0, z: z + 0.15 }, [0.9, 0.12, 0.3], C.rustDull, C.rustDullTop);
  for (const dx of [-0.22, 0.22]) b.box({ x: big.x + dx, y: f + big.y0 + 0.12, z: z + 0.18 }, [0.07, 0.2, 0.07], C.iron);
}

/** Un poids de fonte rond à poignée, sans marque : un tambour bas et son anse (deux montants et leur traverse). */
function castWeight(b: FacetBuilder, at: Vec3, r: number, color: number = C.weight, top: number = C.weightTop): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, r, r * 0.9, r * 0.75, 8, color, top);
  const y = at.y + r * 0.75;
  for (const s of [-1, 1]) b.box({ x: at.x + s * r * 0.42, y, z: at.z }, [r * 0.18, r * 0.5, r * 0.18], color);
  b.box({ x: at.x, y: y + r * 0.5, z: at.z }, [r * 1.02, r * 0.18, r * 0.2], color, top);
}

/** Le toit restauré : ses deux pans de tôle de fer bruni, le dessous un cran plus sombre, et le faîtage. */
function fullRoof(b: FacetBuilder): void {
  const H = HALL;
  const g = planeY(0, H.ridgeZ);
  const xa = H.x0 - H.overhang,
    xb = H.x1 + H.overhang;
  const ridge = g + H.ridge;
  const slope = (H.ridge - H.h) / (H.ridgeZ - H.z0);
  const eaveY = ridge - slope * (H.ridgeZ - (H.z0 - H.eave));
  const south: readonly P3[] = [
    [xa, eaveY, H.z1 + H.eave],
    [xb, eaveY, H.z1 + H.eave],
    [xb, ridge, H.ridgeZ],
    [xa, ridge, H.ridgeZ],
  ];
  const north: readonly P3[] = [
    [xa, ridge, H.ridgeZ],
    [xb, ridge, H.ridgeZ],
    [xb, eaveY, H.z0 - H.eave],
    [xa, eaveY, H.z0 - H.eave],
  ];
  sheet(b, south, 0.12, C.sheet, C.sheetUnder);
  sheet(b, north, 0.12, C.sheet, C.sheetUnder);
  b.box({ x: (xa + xb) / 2, y: ridge + 0.05, z: H.ridgeZ }, [xb - xa + 0.1, 0.16, 0.36], C.iron, C.ironTop);
}

// ---------- Les machines ----------

/** La potence de la bascule (toujours là, de bois gris) : deux montants derrière le plateau et leur traverse. */
function gallows(b: FacetBuilder): void {
  const S = SCALE;
  const f = hallY(S.x, S.gallowsZ);
  for (const s of [-1, 1]) b.box({ x: S.x + s * S.half, y: f - 0.1, z: S.gallowsZ }, [0.22, S.gallowsH + 0.1, 0.22], C.woodShade, C.wood);
  b.box({ x: S.x, y: f + S.gallowsH, z: S.gallowsZ }, [2 * S.half + 0.4, 0.24, 0.26], C.woodShade, C.wood);
}

/** Le peson : une barre lisse, son crochet à un bout, son contrepoids à l'autre ; sans graduation ni encoche (correction 3). */
function peson(b: FacetBuilder, at: { x: number; y: number; z: number; yaw: number; pitch?: number }, color: number, top: number): void {
  b.box({ x: at.x, y: at.y, z: at.z, yaw: at.yaw, pitch: at.pitch }, [1.7, 0.1, 0.1], color, top);
  const c = Math.cos(at.yaw),
    s = Math.sin(at.yaw);
  // Le crochet, à l'ouest ; le contrepoids, à l'est (dans le repère de la barre).
  b.box({ x: at.x - 0.78 * c, y: at.y - 0.32, z: at.z + 0.78 * s, yaw: at.yaw }, [0.07, 0.32, 0.07], color);
  b.box({ x: at.x - 0.78 * c, y: at.y - 0.36, z: at.z + 0.78 * s, yaw: at.yaw }, [0.2, 0.06, 0.07], color);
  b.box({ x: at.x + 0.72 * c, y: at.y - 0.28, z: at.z - 0.72 * s, yaw: at.yaw }, [0.24, 0.3, 0.24], color, top);
}

/** Le tonneau : son fût de bois, cerclé de fer, l'axe le long de `yaw` ; posé à `at` (le milieu de son axe). */
function barrel(b: FacetBuilder, at: Vec3, yaw: number, hoop: number): void {
  const B = BARREL;
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  // Le fût : un tambour à sept pans, couché sur son axe (de `-len/2` à `len/2` le long de `yaw`).
  b.drum({ x: at.x - (B.len / 2) * c, y: at.y, z: at.z + (B.len / 2) * s, yaw: yaw + Math.PI / 2, pitch: Math.PI / 2 }, B.r, B.len, 7, C.newShade, C.wood);
  b.band({ x: at.x - 0.08 * c, y: at.y, z: at.z + 0.08 * s, yaw: yaw + Math.PI / 2, pitch: Math.PI / 2 }, B.r + 0.02, 0.16, 7, hoop);
}

/** Un chevalet du tonneau : une planche dressée en travers de son axe, échancrée par l'axe ; de bois neuf restauré. */
function trestle(b: FacetBuilder, x: number, z: number, h: number, color: number, top: number, pitch = 0): void {
  b.box({ x, y: hallY(x, z) - (pitch ? 0 : 0.1), z, pitch }, [0.12, h, 0.95], color, top);
}

/** Une cuve doseuse : un tronc de cône de fer, son dedans sombre ; `spout` : son bec, vers le sud. */
function vat(b: FacetBuilder, at: { x: number; y: number; z: number; yaw?: number; pitch?: number }, color: number, top: number, spout: boolean): void {
  const V = VATS;
  b.prism(at, V.r0, V.r1, V.h, 8, color, C.hollow);
  b.band({ ...at, y: at.y + V.h - 0.12 }, V.r1 + 0.02, 0.12, 8, top);
  if (spout) b.beam({ x: at.x, y: at.y + V.h - 0.18, z: at.z + V.r1 - 0.05 }, { x: at.x, y: at.y + V.h - 0.32, z: at.z + V.r1 + 0.32 }, 0.14, color);
}

/** Un bac de la trieuse : une caisse basse de bois, ouverte ; `upside` : renversé. */
function bin(b: FacetBuilder, x: number, z: number, color: number, top: number, yaw = 0): void {
  b.box({ x, y: hallY(x, z) - 0.02, z, yaw }, [0.58, 0.34, 0.5], color, top);
}

/** La table des étalons : son plateau et ses deux pieds pleins (des planches), dans son repère posé (`drawPosed`). */
function table(b: FacetBuilder, at: { x: number; y: number; z: number; yaw: number; pitch?: number }, color: number, top: number): void {
  const T = TABLE;
  const c = Math.cos(at.yaw),
    s = Math.sin(at.yaw);
  const lp = (lx: number, ly: number, lz: number) => {
    // Bascule autour de x (dans le repère de la table), puis le cap.
    const p = at.pitch ?? 0;
    const y1 = ly * Math.cos(p) - lz * Math.sin(p);
    const z1 = ly * Math.sin(p) + lz * Math.cos(p);
    return { x: at.x + lx * c + z1 * s, y: at.y + y1, z: at.z - lx * s + z1 * c };
  };
  const top0 = lp(0, T.h - 0.1, 0);
  b.box({ ...top0, yaw: at.yaw, pitch: at.pitch }, [T.w, 0.1, T.d], color, top);
  for (const sx of [-1, 1]) {
    const leg = lp(sx * (T.w / 2 - 0.12), 0, 0);
    b.box({ ...leg, yaw: at.yaw, pitch: at.pitch }, [0.1, T.h - 0.1, T.d - 0.15], color, top);
  }
}

/**
 * La pile des étalons (corrections 1 et du référent dys : une pile, jamais une rangée ; aucune marque) : quatre coupes de
 * fonte emboîtées les unes dans les autres, dans leur boîte ouverte, posée sur la table ; le couvercle debout contre le mur.
 */
function cupStack(b: FacetBuilder, at: Vec3): void {
  b.box({ x: at.x, y: at.y, z: at.z }, [0.8, 0.22, 0.7], C.newShade, C.newWood);
  [0.3, 0.25, 0.2, 0.15].forEach((r, k) => b.prism({ x: at.x, y: at.y + 0.12 + k * 0.11, z: at.z }, r * 0.82, r, 0.14, 7, C.iron, C.ironTop));
  b.box({ x: at.x, y: at.y + 0.1, z: at.z - 0.42, pitch: -0.25 }, [0.8, 0.7, 0.06], C.newShade, C.newWood);
}

/** Une coupe de fonte roulée au sol, couchée sur le flanc (la ruine). */
function rolledCup(b: FacetBuilder, x: number, z: number, r: number, yaw: number): void {
  b.prism({ x, y: hallY(x, z) + r * 0.85, z, yaw, pitch: Math.PI / 2 }, r * 0.82, r, 0.14, 7, C.rustDull, C.rustDullTop);
}

// ---------- Le modèle ----------

function model(add: AddPiece, _ground: SiteGround, _door: Vec2): void {
  const H = HALL;
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 1 / 3 };
  const corps3 = { stage: 0 as Stage, row: 2 / 3 };
  const haut = { stage: 1 as Stage, row: 0 };

  // Toujours là : le soubassement et le sol de la halle ; le mur ouest et son pignon, la moitié ouest du mur du fond ; le
  // pilier ouest de la façade et la lanterne de la peseuse (la seule allumée de la ruine) ; les niches et le signe de
  // l'absence ; la potence de la bascule.
  add('ruine', 0, (b) => {
    hallBase(b);
    brickRun(b, false, H.x0 + H.wall / 2, H.z0, H.z1, H.h, H.h);
    gable(b, H.x0 + H.wall / 2);
    brickRun(b, true, H.z0 + H.wall / 2, H.x0, 0, H.h, H.h);
    pillar(b, PILLARS[0], H.h);
    pillarLantern(b, LANTERN_PESEUSE.x, LANTERN_PESEUSE.y);
    niches(b);
    gallows(b);
  });

  // ---- La ruine ----
  // Le corps 1 la relève : le plateau de travers, une rive soulevée ; le peson tombé, couché à côté.
  add(
    'ruine',
    0,
    (b) => {
      const S = SCALE;
      const f = hallY(S.x, S.z);
      b.box({ x: S.x + 0.1, y: f - 0.12, z: S.z + 0.1, yaw: 0.22, pitch: 0.14 }, [S.w, S.h + 0.1, S.d], C.woodShade, C.rustDull);
      peson(b, { x: S.x + 0.6, y: f + 0.05, z: S.z + 1.45, yaw: 0.5 }, C.rustDull, C.rustDullTop);
    },
    corps1,
  );
  // Le corps 2 la relève : le tonneau couché hors de ses chevalets, l'un debout, l'autre couché à plat.
  add(
    'ruine',
    0,
    (b) => {
      const B = BARREL;
      barrel(b, { x: B.x + 0.4, y: hallY(B.x, B.z) + B.r - 0.06, z: B.z + 0.9 }, 0.7, C.rustDull);
      trestle(b, B.x - 0.75, B.z, 0.95, C.woodShade, C.wood);
      b.box({ x: B.x + 0.9, y: hallY(B.x + 0.9, B.z) - 0.02, z: B.z - 0.2, yaw: 0.4 }, [0.95, 0.12, 0.95], C.woodShade, C.wood);
    },
    corps2,
  );
  // Le corps 3 la relève : une cuve debout et vide, l'autre couchée sur le flanc ; la trieuse à terre, sa goulotte
  // couchée, deux bacs renversés.
  add(
    'ruine',
    0,
    (b) => {
      const V = VATS;
      const x0 = V.at[0];
      vat(b, { x: x0, y: hallY(x0, V.z) - 0.05, z: V.z }, C.rustDull, C.rustDullTop, false);
      vat(b, { x: V.at[1] + 0.2, y: hallY(V.at[1], V.z) + V.r1, z: V.z + 0.5, yaw: 1.2, pitch: Math.PI / 2 }, C.rustDull, C.rustDullTop, false);
      const S = SORTER;
      b.box({ x: S.x, y: hallY(S.x, S.z) - 0.02, z: S.z, yaw: 0.25 }, [2.2, 0.16, 0.55], C.woodShade, C.wood);
      bin(b, S.bins[0] - 0.3, S.binZ + 0.5, C.woodShade, C.woodShade, 0.7);
      bin(b, S.bins[2] + 0.2, S.binZ + 0.2, C.woodShade, C.woodShade, -0.4);
    },
    corps3,
  );
  // Le haut la relève : le mur du fond écrêté en biais à l'est, le mur est cassé en biais ; le pilier est cassé à
  // mi-hauteur, son haut couché dans la cour ; le pan nord du toit, rouillé, à moitié ; le pan sud tombé en biais,
  // glissé contre le flanc est, un bord au sol ; la table renversée, la boîte couchée, deux coupes
  // roulées ; deux briques tombées.
  add(
    'ruine',
    0,
    (b) => {
      brickRun(b, true, H.z0 + H.wall / 2, 0, H.x1, H.h, 2.3);
      brickRun(b, false, H.x1 - H.wall / 2, H.z0, H.z1, 2.6, 1.5);
      pillar(b, PILLARS[1], 1.9);
      const g = planeY(3.3, -0.7);
      b.box({ x: 3.3, y: g - 0.25, z: -0.7, yaw: 1.1, pitch: Math.PI / 2 }, [PILLAR, 1.7, PILLAR], C.brickShade, C.brick);
      // Le pan nord, à moitié, rouillé.
      const gr = planeY(0, H.ridgeZ);
      const ridge = gr + H.ridge;
      const slope = (H.ridge - H.h) / (H.ridgeZ - H.z0);
      const eaveY = ridge - slope * (H.ridgeZ - (H.z0 - H.eave));
      const xa = H.x0 - H.overhang;
      sheet(
        b,
        [
          [xa, ridge, H.ridgeZ],
          [-0.6, ridge, H.ridgeZ],
          [-0.2, eaveY, H.z0 - H.eave],
          [xa, eaveY, H.z0 - H.eave],
        ],
        0.1,
        C.rustDull,
        C.rustUnder,
      );
      // Le pan sud, tombé en biais : glissé contre le flanc est, à l'extérieur, son bord haut sur le mur cassé, son bord bas
      // au sol (hors de la cour et de la scène : la caméra de la scénette voit la halle).
      const ge = planeY(H.x1, H.ridgeZ);
      sheet(
        b,
        [
          [H.x1 + 0.3, ge + 2.45, H.z0 + 0.4],
          [H.x1 + 0.3, ge + 1.4, H.z1 - 0.3],
          [H.x1 + 3.1, ge + 0.05, H.z1 + 0.3],
          [H.x1 + 3.4, ge + 0.05, H.z0 + 0.8],
        ],
        0.1,
        C.rustDullTop,
        C.rustUnder,
      );
      const T = TABLE;
      table(b, { x: T.x + 0.2, y: hallY(T.x, T.z) + T.d / 2 - 0.05, z: T.z + 0.6, yaw: 0.2, pitch: Math.PI / 2 }, C.woodShade, C.wood);
      b.box({ x: T.x + 1.0, y: hallY(T.x, T.z) - 0.02, z: T.z + 1.3, yaw: 0.6, pitch: 0.3 }, [0.8, 0.22, 0.7], C.woodShade, C.wood);
      rolledCup(b, T.x - 0.6, T.z + 2.0, 0.3, 0.4);
      rolledCup(b, T.x + 1.6, T.z + 2.4, 0.22, 1.5);
      for (const [x, z, yaw] of [
        [5.3, 0.2, 0.4],
        [-5.4, -0.9, 1.3],
      ] as const)
        b.box({ x, y: planeY(x, z) - 0.05, z, yaw }, [0.5, 0.26, 0.24], C.brickShade, C.brick);
    },
    haut,
  );

  // ---- Le corps 1 sur 3 : la bascule remise à plat, le peson pendu à sa potence.
  add(0, 0, (b) => {
    const S = SCALE;
    const f = hallY(S.x, S.z);
    b.box({ x: S.x, y: f - 0.1, z: S.z }, [S.w, S.h + 0.1, S.d], C.iron, C.ironTop);
    const y = f + S.peson;
    b.box({ x: S.x, y, z: S.gallowsZ }, [0.07, f + S.gallowsH - y, 0.07], C.iron);
    peson(b, { x: S.x, y: y - 0.1, z: S.gallowsZ, yaw: 0 }, C.iron, C.ironTop);
  });
  // ---- Le corps 2 sur 3 : le tonneau sur ses deux chevalets, sa manivelle à l'est.
  add(0, 1 / 3, (b) => {
    const B = BARREL;
    const f = hallY(B.x, B.z);
    for (const dx of [-0.75, 0.75]) trestle(b, B.x + dx, B.z, B.axle + 0.1, C.newShade, C.newWood);
    barrel(b, { x: B.x, y: f + B.axle, z: B.z }, 0, C.iron);
    const ex = B.x + 0.9;
    b.box({ x: ex, y: f + B.axle - 0.05, z: B.z }, [0.3, 0.1, 0.1], C.iron);
    b.box({ x: ex + 0.12, y: f + B.axle - 0.4, z: B.z, pitch: 0 }, [0.08, 0.4, 0.08], C.iron);
    b.box({ x: ex + 0.2, y: f + B.axle - 0.45, z: B.z }, [0.18, 0.08, 0.08], C.newWood);
  });
  // ---- Le corps 3 sur 3 : les deux cuves debout sur leur socle, leurs becs ; la trieuse redressée, sa goulotte en
  // pente vers l'est sur deux montants, ses trois bacs en rang, de la même taille.
  add(0, 2 / 3, (b) => {
    const V = VATS;
    const g = hallY(3.1, V.z);
    b.box({ x: 3.1, y: g - 0.05, z: V.z }, [2.7, V.base + 0.05, 1.1], C.stoneShade, C.stoneSun);
    for (const x of V.at) vat(b, { x, y: g + V.base, z: V.z }, C.iron, C.ironTop, true);
    const S = SORTER;
    const f = hallY(S.x, S.z);
    for (const dx of [-0.95, 0.95]) b.box({ x: S.x + dx, y: f - 0.1, z: S.z }, [0.16, (dx < 0 ? 1.75 : 1.05) + 0.1, 0.16], C.newShade, C.newWood);
    b.beam({ x: S.x - 1.2, y: f + 1.85, z: S.z }, { x: S.x + 1.2, y: f + 1.0, z: S.z }, 0.42, C.iron);
    for (const x of S.bins) bin(b, x, S.binZ, C.newShade, C.newWood);
  });
  // ---- Le haut : le mur du fond et le mur est relevés, le pignon est ; le pilier est refait ; le toit entier ; la pile
  // des étalons sur sa table ; les deux petites niches garnies d'un poids ; la lanterne de la halle, allumée dès sa pose.
  add(1, 0, (b) => {
    brickRun(b, true, H.z0 + H.wall / 2, 0, H.x1, H.h, H.h);
    brickRun(b, false, H.x1 - H.wall / 2, H.z0, H.z1, H.h, H.h);
    gable(b, H.x1 - H.wall / 2);
    pillar(b, PILLARS[1], H.h);
    fullRoof(b);
    const T = TABLE;
    const f = hallY(T.x, T.z);
    table(b, { x: T.x, y: f, z: T.z, yaw: 0 }, C.newShade, C.newWood);
    cupStack(b, { x: T.x, y: f + T.h, z: T.z });
    const z = H.z0 + H.wall + 0.18;
    for (const n of NICHES.slice(1)) castWeight(b, { x: n.x, y: hallY(n.x, z) + n.y0, z }, Math.min(0.24, n.half * 0.7), C.iron, C.ironTop);
    pillarLantern(b, LANTERN_HALL.x, LANTERN_HALL.y);
  });
  // ---- Les abords : la cour dallée devant la halle, ses joints ; la lanterne du chemin, au coin sud-ouest de la cour.
  add(2, 0, (b) => {
    yard(b);
    const p = PATH_LANTERN;
    const y = planeY(p.x, p.z);
    b.box({ x: p.x, y: y - 0.3, z: p.z }, [0.12, p.h + 0.3, 0.12], C.iron);
    lantern(b, { x: p.x, y: y + p.h + 0.02, z: p.z }, true, 0.85);
  });
}

/** La cour : la dalle qui suit le plan, son bord, et ses joints en rangs (jamais sur le chemin). */
function yard(b: FacetBuilder): void {
  const top = YARD.map(({ x, z }) => [x, planeY(x, z) + 0.02, z] as P3);
  b.triangle(top[0], top[1], top[2], C.paving);
  b.triangle(top[0], top[2], top[3], C.paving);
  for (let k = 0; k < 4; k++) {
    const m = (k + 1) % 4;
    const out: P3 = [(top[k][0] + top[m][0]) / 2 - 0.4, 0, (top[k][2] + top[m][2]) / 2 + 0.6];
    quadOut(b, [top[k][0], top[k][1] - 0.4, top[k][2]], [top[m][0], top[m][1] - 0.4, top[m][2]], top[m], top[k], out, C.stoneShade);
  }
  const line = (a: Vec2, c: Vec2) => {
    const len = Math.hypot(c.x - a.x, c.z - a.z) || 1;
    const nx = ((c.z - a.z) / len) * 0.04,
      nz = (-(c.x - a.x) / len) * 0.04;
    const p = (q: Vec2, s: number): P3 => [q.x + nx * s, planeY(q.x, q.z) + 0.032, q.z + nz * s];
    quadOut(b, p(a, 1), p(c, 1), p(c, -1), p(a, -1), [0, 1, 0], C.joint);
  };
  // Le bord ouest de la cour, du coin sud-ouest au coin nord-ouest : un joint de rang s'arrête à lui.
  const westAt = (z: number): number => YARD[3].x + ((YARD[0].x - YARD[3].x) * (z - YARD[3].z)) / (YARD[0].z - YARD[3].z);
  for (const z of [-0.3, 1.5]) line({ x: westAt(z) + 0.3, z }, { x: YARD[1].x - 0.3, z });
  for (const x of [0.8, 3.4]) line({ x, z: YARD[2].z + 0.3 }, { x, z: YARD[1].z - 0.3 });
}

// ---------- Les traces ----------

/** Où se pose chaque trace, depuis le centre du lieu (intention, § 5) ; aucune sur le chemin. */
const TRACE_SPOTS = {
  mean: { x: SCALE.x + 0.5, z: SCALE.z + 0.2 },
  events: { x: BARREL.x - 0.95, z: BARREL.z + 0.45 },
  ratio: { x: VATS.at[0], z: VATS.z },
  programs: { x: 1.3, z: HALL.z0 + HALL.wall + 0.45 },
  figures: { x: 4.4, z: 1.6 },
} as const;

/** Un sac de toile ficelé, posé sur le plateau de la bascule (Moyenne et médiane). */
function sack(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.mean;
    const y = hallY(SCALE.x, SCALE.z) + SCALE.h;
    l.prism({ x, y, z, yaw: 0.3 }, 0.34, 0.26, 0.5, 6, C.canvasShade, C.canvas);
    l.prism({ x, y: y + 0.5, z, yaw: 0.3 }, 0.12, 0.05, 0.18, 4, C.canvas);
    l.band({ x, y: y + 0.44, z, yaw: 0.3 }, 0.15, 0.06, 4, C.woodShade);
  });
}

/** La petite pelle à échantillon, debout contre le chevalet ouest du tonneau (Évènements ; jamais un dé : correction 2). */
function scoop(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.events;
    const f = hallY(x, z);
    l.box({ x, y: f, z, pitch: -0.12 }, [0.26, 0.3, 0.06], C.iron, C.ironTop);
    l.box({ x, y: f + 0.28, z: z - 0.04, pitch: -0.12 }, [0.06, 0.6, 0.06], C.newShade, C.newWood);
  });
}

/** Un broc de fer et une louche, debout côte à côte sur le bord de la cuve ouest (Proportions). */
function jugAndLadle(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.ratio;
    const y = hallY(3.1, VATS.z) + VATS.base + VATS.h;
    const zr = z + VATS.r1 - 0.06;
    l.prism({ x: x - 0.17, y, z: zr }, 0.11, 0.09, 0.3, 6, C.iron, C.ironTop);
    l.box({ x: x - 0.17, y: y + 0.08, z: zr + 0.12 }, [0.04, 0.16, 0.06], C.iron);
    l.box({ x: x + 0.15, y, z: zr }, [0.05, 0.5, 0.05], C.newShade, C.newWood);
    l.prism({ x: x + 0.15, y: y - 0.08, z: zr }, 0.06, 0.1, 0.08, 5, C.iron, C.ironTop);
  });
}

/** Un escabeau de bois à deux marches, contre le mur du fond, près de la petite niche (Programmes de calcul ; jamais une échelle). */
function stepStool(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.programs;
    const f = hallY(x, z);
    for (const dx of [-0.32, 0.32]) l.box({ x: x + dx, y: f, z }, [0.07, 0.95, 0.62], C.newShade, C.newWood);
    l.box({ x, y: f + 0.42, z: z + 0.12 }, [0.7, 0.07, 0.3], C.newShade, C.newWood);
    l.box({ x, y: f + 0.88, z: z - 0.08 }, [0.7, 0.07, 0.3], C.newShade, C.newWood);
  });
}

/** Trois tamis ronds empilés sur une table de tri basse, dans la cour (Figures de 4e). */
function sieves(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.figures;
    const f = planeY(x, z);
    l.box({ x, y: f, z }, [1.2, 0.5, 0.8], C.newShade, C.newWood);
    for (let k = 0; k < 3; k++) l.prism({ x, y: f + 0.5 + k * 0.1, z, yaw: k * 0.4 }, 0.36, 0.36, 0.09, 7, C.newShade, k === 2 ? C.woodShade : C.newWood);
  });
}

/**
 * Les cinq traces, une par mission, chacune avec sa partie (le corps en trois rangées, puis le haut, puis les abords) ;
 * des objets de la halle, jamais la notion.
 */
const TRACES = {
  'weighted-mean': { at: TRACE_SPOTS.mean, lift: 1, stage: 0, row: 0, draw: sack },
  events: { at: TRACE_SPOTS.events, lift: 1, stage: 0, row: 1 / 3, draw: scoop },
  'proportional-reasoning': { at: TRACE_SPOTS.ratio, lift: 1, stage: 0, row: 2 / 3, draw: jugAndLadle },
  'calculation-programs': { at: TRACE_SPOTS.programs, lift: 1, stage: 1, row: 0, draw: stepStool },
  translations: { at: TRACE_SPOTS.figures, lift: 1, stage: 2, row: 0, draw: sieves },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/**
 * Le cap de départ de la caméra de la scénette (intention, § 7) : vers le nord, vers le mur des niches (trois niches à des
 * hauteurs différentes, jamais une rangée en escalier derrière les poids). Elle regarde vers −(sin cap, cos cap).
 */
const SCENE_START = 0;

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers la peseuse). */
const SCENE_RIGHT = { x: Math.cos(SCENE_START), z: -Math.sin(SCENE_START) } as const;

/** Le milieu de la scène, depuis le centre du lieu : dans la cour, devant la façade, entre la bascule et le tonneau. */
const SCENE_SPOT = { dx: -0.4, dz: 0.4, half: [2.6, 1.2] as [number, number] } as const;

/** L'écart de Kéo et de la peseuse au milieu de la scène. */
const SCENE_HALF = 2.1;

/** La hauteur du sol de la scène au-dessus de son point (le plus haut du sol sous elle) : le dessus de la cour. */
const SCENE_RISE = (() => {
  const [hx, hz] = SCENE_SPOT.half;
  let top = -Infinity;
  for (let i = -3; i <= 3; i++) for (let k = -2; k <= 2; k++) top = Math.max(top, localGround(SCENE_SPOT.dx + (i / 3) * hx, SCENE_SPOT.dz + (k / 2) * hz));
  return Math.max(0, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz) + 0.02 - top);
})();

/** La peseuse en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, tablier de toile, chemise. */
function weigher(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.3, 0.24, 0.42, 8, C.apron);
  b.prism({ x: at.x, y: at.y + 0.56, z: at.z }, 0.27, 0.24, 0.42, 8, C.shirt);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.29, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.35, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.shirt);
}

/** La planche des poids sur ses tréteaux : sa hauteur, à l'échelle 1 ; un poids choisi se soulève d'un cran. */
const BOARD = { height: 0.5, lift: 0.3, weight: 0.24 } as const;

export const ETALON: PlaceArt = {
  role: 'La peseuse',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a sa partie (`stage`, `row` : 3+1+1).
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    rise: SCENE_RISE,
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 2.9, depth: 0.3 },
    // Basse (intention, § 7) : la cour est plate, rien ne la cache.
    pitch: (12 * Math.PI) / 180,
    start: SCENE_START,
  },
  // Le décor de près : la cour, la halle et ses machines sont au lieu ; les abords (./etalonSurroundings.ts) ajoutent ce qui
  // cadre. Il reste la peseuse en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) weigher(b, at, sphere);
  },
  answer: {
    size: { height: BOARD.height + BOARD.lift + BOARD.weight, half: 0.3 },
    facing: true,
    // Une planche sur deux tréteaux, sous la rangée des poids.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BOARD.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.5 * s], C.woodShade, C.wood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.12, top - 0.08 * s - foot, 0.45 * s], C.woodShade);
      }
    },
    // Un poids de fonte rond à poignée, tous de la même taille ; choisi, il se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      castWeight(b, { x: at.x, y: at.y + (BOARD.height + (picked ? BOARD.lift : 0)) * s, z: at.z }, 0.26 * s);
    },
  },
  // Les cinq missions en R : la cour seule, rien de l'item ; les poids portent les réponses.
  rest() {},
  traces: TRACES,
  // Kéo au retour : au pas de la porte, tourné vers la halle.
  exit: { x: DOOR_AT.x - 0.8, z: DOOR_AT.z - 1.0 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan de l'Étalon, pour les tests et ses abords : la halle, ses machines, la cour, la caméra. */
export const ETALON_LAYOUT = {
  hall: HALL,
  pillars: PILLARS,
  niches: NICHES,
  scale: SCALE,
  barrel: BARREL,
  vats: VATS,
  sorter: SORTER,
  table: TABLE,
  yard: YARD,
  planeY,
  hallY,
  pathLantern: PATH_LANTERN,
  door: DOOR_AT,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
  heightAtCenter: H0,
} as const;
