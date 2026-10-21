// Les Fumerolles (GD-22, lot 9 ; intention du directeur artistique du 20 octobre 2026, planche de rendu de près
// `selection-fumerolles-v2` validée par le mainteneur, vapeur fixe) : « des sources chaudes au pied des aiguilles, et des
// instruments plantés dans la roche pour lire la terre, le ciel et ce que l'humain change ». Le cœur, sans figure, est
// l'ensemble des instruments autour des trois bouches : trois cônes tronqués d'ocre à six pans, ouverts en haut, serrés
// dans leur margelle, la plus haute au milieu, chacune son panache de vapeur fixe ; le socle vide de la grande sonde,
// deux sondes de fer, la girouette en feuille sur son mât, le récipient de pluie. Autour : la dalle de relevé grise (le
// sol de marche des Contreforts, et le plancher de la scénette), la cabane de la sondeuse à l'est, le chemin de dalles qui
// contourne la margelle par l'ouest et sa barrière basse, la haie au nord-est.
//
// La ruine : tout est là, tombé ou cassé, jamais un chantier. La margelle n'a plus que son arc du nord, ses deux autres
// arcs tombés en trois blocs, son lit sec et ses croûtes ; la dalle fendue, ses joints ouverts, une dalle soulevée ; les
// sondes couchées côte à côte ; la cabane penchée sur sa roche, un pied cassé, son toit tombé à plat à côté et deux lames ;
// le mât couché, la feuille face au ciel ; deux lisses au sol, un piquet penché, la lanterne du chemin éteinte, couchée.
// Une seule lumière : la lanterne de la sondeuse, sur sa perche, allumée dès la ruine. Les bouches, leurs panaches, les
// croûtes et le socle ne changent pas. Le corps : la margelle entière et son eau, la dalle remise à plat, la cabane
// redressée sans son toit. Le haut : le toit de lauze et sa planche de rive aux racines, le mât, sa lanterne et la
// girouette. Les abords : le chemin, la barrière, la haie, la lanterne du chemin. Une trace par mission, chacune avec
// l'étape qu'elle pose (`stage`) : les deux sondes debout (le corps), le récipient de pluie (le haut), la pousse en pot
// (les abords). Rien ne bouge ; rien à lire dans la 3D. Code pur (placeArt.ts).
import type { Stage } from './construction';
import { FacetBuilder, type Facets } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_5E, PLACES_5E } from './plan5e';
import { rock, type RockTones } from './surroundingsKit';
import { SHADOW_DIR_5E } from './sky';
import { standingHeight } from './terrain';
import { FOREST_COLORS, heightAt5e } from './terrain5e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter sur une pente (places.ts). */
const SINK = -0.8;

/**
 * Les couleurs des Fumerolles : l'ocre des bouches, de la margelle et du sol (#B39A64), la pierre grise du plateau pour ce
 * qui se marche (la dalle, le chemin : #8E938B, soleil #AEB0A3, ombre #777D77), le bois des Passeurs (neuf #A68672 /
 * #8C766A, usé #9F9279), le fer gris (#6F6A60), le bronze en ferrures, le vert-de-gris des racines (#6F9A8A), le lauze
 * gris sourd du toit ; la vapeur, un gris chaud clair ; les croûtes, un jaune pâle mat, jamais vif ; l'eau des rives. La
 * seule lumière, l'ocre de la lanterne (#E0A84A) ; les lanternes éteintes ont la vitre #BFC4B8.
 */
const C = {
  ochre: COLORS_5E.ochre,
  ochreShade: 0x9c8558,
  ochreLight: 0xc4ad78,
  // Les blocs de la margelle, taillés : deux tons d'ocre qui alternent.
  block: 0xb8a06a,
  blockShade: 0xa08a5a,
  // Le haut ouvert des bouches : un brun sombre, au-dessus du seuil « jamais presque noir ».
  vent: 0x5b4b3a,
  crust: 0xcdbf86,
  water: COLORS_5E.waterShallow,
  stone: COLORS_5E.stone,
  stoneSun: COLORS_5E.stoneSun,
  stoneShade: COLORS_5E.stoneShade,
  // Le trou du socle : brun très sombre, jamais noir. L'écran écrase les tons sombres (le rendu « neutre » de la lumière,
  // scene.ts) : déclaré plus clair, il se rend vers #3A312C (retouche 1 : déclaré #3A312C, il se rendait presque noir).
  hole: 0x5c5049,
  newWood: 0xa68672,
  newShade: 0x8c766a,
  wornWood: 0x9f9279,
  wornShade: 0x86775f,
  door: 0x7d6650,
  lauze: COLORS_5E.stoneShade,
  iron: 0x6f6a60,
  ironHead: 0x5f5a52,
  // Le fer des sondes et des goujons du socle, debout : le fer gris #6F6A60 tel que l'écran le rend sur leurs flancs, à
  // l'ombre comme au soleil (retouche 1 : déclaré #6F6A60, il se rendait brun olive presque noir) ; la tête ronde, plus claire.
  probe: 0x9a958c,
  probeHead: 0xaaa69d,
  bronze: 0xb8954f,
  verdigris: 0x6f9a8a,
  rope: 0xd8c49a,
  lantern: COLORS_5E.lantern,
  unlit: 0xbfc4b8,
  shrub: FOREST_COLORS.shrub,
  shrubTop: FOREST_COLORS.shrubTop,
  // Le pot de la pousse et son tabouret : une pierre chaude, plus claire que la dalle ; la pousse.
  potStone: 0x9a8f7e,
  potTop: 0x6e5a4a,
  leaf: 0x6f8f4e,
  // Les galets de la question : un ocre sourd, jamais celui de la lanterne.
  pebble: 0x9c8558,
  pebbleTop: 0xab9466,
  // La sondeuse, en pion (son modèle 3D prend sa place, ./habitants.ts) : manteau de terrain brun, chemise de lin,
  // pantalon brun, bottes grises, chapeau.
  coat: 0x7a6a52,
  shirt: 0xd8c7a4,
  trousers: 0x6b4f3a,
  boots: 0x55595a,
  head: 0xe3b48a,
  hat: 0x8a7a5c,
} as const;

/** Les tons des roches d'ocre (la roche de la cabane, celle qui cadre la scénette). */
export const OCHRE_ROCK: RockTones = { light: C.ochre, shade: C.ochreShade, top: C.ochreLight };

/**
 * La dalle de relevé, au sud du lieu, contre la porte : ses bords (de l'ouest à l'est, du nord au sud), son dessus au-dessus
 * du sol du centre ; deux rangées de grandes dalles décalées (les joints sont des arêtes entre deux tons, pas des pièces),
 * coupées en `north` puis en `south` le long de x, la rangée du nord jusqu'à `row`.
 */
const DALLE = { x0: -6, x1: 7.5, z0: -1, z1: 5.6, top: 0.14, row: 2.3, north: [-6, -2.5, 1.5, 4.5, 7.5], south: [-6, -4, 0, 3.5, 7.5] } as const;

/** La margelle, au nord de la dalle (son bord sud contre elle) : son centre, ses rayons, sa hauteur (genou), l'eau dedans. */
const MARGELLE = { x: 0.6, z: -5.6, r: 4.6, inner: 3.95, h: 0.55, sides: 12, water: 0.32 } as const;

/**
 * Les trois bouches (celles des ruines du lot 2, retirées au lot 16, resserrées dans la margelle) : leur axe, leur rayon au pied, leur hauteur ; la
 * plus haute au milieu, au fond. Elles ne changent pas, avant comme après.
 */
const VENTS = [
  { x: 0.7, z: -6.4, r: 1.5, h: 3.5 },
  { x: -1.6, z: -4.9, r: 1.15, h: 2.4 },
  { x: 2.8, z: -4.8, r: 0.95, h: 1.8 },
] as const;

/** Le rayon du haut ouvert d'une bouche, en part de son pied. */
const VENT_TOP = 0.42;

/**
 * La vapeur fixe : pour chaque bouche, le haut de son panache (sous deux fois le mât et sous le rebord de la falaise, 13)
 * et ses quatre bouffées (retouche 2 : trois boules blanches de même taille, empilées avec un cou serré, se lisaient
 * comme des cairns). Chacune deux troncs de cône dos à dos, qui s'élargissent puis se referment sans étranglement (le
 * cou et le pied aux trois quarts du ventre), et recouvre la moitié de la précédente : une colonne continue. La première
 * a la largeur du haut ouvert de la bouche (`grow`, en part de ce haut), les suivantes s'élargissent un peu en montant,
 * la dernière est petite (`end`) ; le panache penche vers l'est (en scénette, loin du panneau de la consigne), d'autant plus qu'il monte (`drift`, au haut du
 * panache, en part de sa hauteur), du même côté pour les trois.
 */
const PLUMES = [
  { top: 7.2, puffs: 4 },
  { top: 5.3, puffs: 4 },
  { top: 4.1, puffs: 4 },
] as const;
const PUFF = { grow: [1.15, 1.45, 1.7], end: 1, neck: 0.75, overlap: 0.5, drift: 0.35, sway: [0, -0.22, 0.12, -0.1], dome: 0.3, sides: 6 } as const;

/**
 * Les gris de la vapeur : ses deux bouffées du bas, puis celles du haut, un peu plus claires ; dans chacune, le dessus
 * tourné vers le soleil (`cap`), le dessus à l'ombre et le dessous au soleil (`mid`), le dessous à l'ombre (`under`),
 * d'un petit cran chacun, comme la fumée du Hameau : chaque bouffée se lit, ronde, dans la colonne. Puis le dessus de la
 * dernière. La vue les dessine sans ombre (`FUMEROLLES_STEAM`, ./levelWorld.ts, `thinFog`) : une fumée, jamais une roche
 * (retouche 2 : ombrés par la lumière, leurs flancs viraient au gris de pierre ; plus clairs, la vapeur était l'objet le
 * plus clair de l'image). À l'écran (brume et exposition comprises), le gris chaud de la fumée du Hameau au bas du
 * panache (#C2BDB1), au plus #D6D2C9 en haut.
 */
const STEAM = {
  low: { cap: 0xc6c1b5, mid: 0xbcb7ac, under: 0xb2aea3 },
  high: { cap: 0xcbc6bc, mid: 0xc1bcb2, under: 0xb7b2a8 },
  top: 0xd0ccc3,
} as const;

/** Les couleurs de la vapeur, que la vue dessine sans ombre. */
export const FUMEROLLES_STEAM: readonly number[] = [...Object.values(STEAM.low), ...Object.values(STEAM.high), STEAM.top];

/** Le soleil, à plat : un pan de vapeur qui le regarde prend le gris clair. */
const SUN = { x: -SHADOW_DIR_5E.x, z: -SHADOW_DIR_5E.z } as const;

/**
 * Le socle de la grande sonde, au bord nord-ouest de la dalle : huit pans, à hauteur de genou, le trou et ses quatre goujons
 * ronds, courts et fins (retouche 1 : gros et carrés, autour d'un trou presque noir, ils faisaient « bouche à dents »).
 */
const SOCLE = { x: -4.2, z: 0.1, r: 0.78, h: 0.6, hole: 0.34, pins: 0.56, pin: 0.045 } as const;

/** Les deux sondes, séparées en profondeur : l'une sur la dalle au sud-est du socle, l'autre au bord sud-est de la margelle. */
const PROBES = [
  { x: -3.0, z: 1.4 },
  { x: 3.1, z: -1.35 },
] as const;

/** Une sonde : sa hauteur (tête comprise), l'épaisseur de sa tige, le rayon de sa tête. */
const PROBE = { h: 1.8, t: 0.25, head: 0.2 } as const;

/**
 * La cabane de la sondeuse, à l'est, sa porte au sud : sa place, sa largeur, sa profondeur, ses pieds courts, son mur,
 * la bande de persienne sous l'avant-toit, son toit à deux pans.
 */
const CABIN = { x: 7.6, z: 1.6, w: 3, d: 3, feet: 0.4, floor: 0.15, wall: 1.3, band: 0.2, roof: 1, eave: 0.3 } as const;

/** Le haut du mur de la cabane, au-dessus du sol du centre. */
const CABIN_TOP = CABIN.feet + CABIN.floor + CABIN.wall + 2 * CABIN.band;

/** La perche de la lanterne de la sondeuse, à côté de la porte : sa place, sa hauteur. */
const POLE = { x: 9.0, z: 3.7, h: 2.1, arm: 0.45 } as const;

/** La roche contre laquelle la cabane penche dans la ruine (toujours là), contre son mur de l'est. */
const CABIN_ROCK = { x: 9.85, z: 2.2, r: 1.05, h: 1.5 } as const;

/**
 * La cabane de la ruine : penchée vers l'est de 13°, son pied cassé, son mur de l'est appuyé sur sa roche ; son bord bas
 * de l'est posé au sol (retouche 1 : à 7°, elle se lisait droite ; retouche 2 : à 19°, en scénette, elle penchait
 * au-dessus de la sondeuse).
 */
const CABIN_LEAN = 0.23;

/**
 * La cabane de la ruine, glissée vers l'ouest de sa place : son mur de l'est touche encore sa roche, et en scénette le
 * noir de sa porte reste à gauche de la sondeuse, jamais derrière sa tête.
 */
const CABIN_SLIDE = -0.8;

/**
 * Le toit tombé de la ruine, à plat au sud-est de la cabane, au pied de sa roche, et ses deux lames décrochées entre lui
 * et la perche : vus de la porte, à droite de la cabane (retouche 2 : au nord-est, la cabane les cachait).
 */
const FALLEN_ROOF = { x: 11.3, z: 5.2, yaw: 0.45 } as const;
const FALLEN_SLATS = [
  [9.3, 5.6],
  [9.45, 6.0],
] as const;

/** Le mât, juste au nord de la cabane : sa place, sa hauteur, le bras de la girouette, la lanterne fixée dessous. */
const MAST = { x: 6.5, z: -0.6, h: 4.5, t: 0.16, arm: 4.3 } as const;

/** L'échelle de la lanterne du mât : sa vitre 1,4 fois celle de la cabane, la même ocre (comme au Hameau). */
const MAST_LANTERN = 1.4;

/** Le récipient de pluie, au coin nord-ouest de la cabane, au pied du mât, sur la dalle. */
const RAIN = { x: 5.5, z: -0.2 } as const;

/**
 * Le chemin de dalles : du coin ouest de la dalle, il contourne la margelle par l'ouest, à 6 unités au moins de l'axe de
 * chaque bouche ; sa largeur, son dessus ; la barrière basse le long de son bord extérieur (deux segments).
 */
const PATH: readonly Vec2[] = [
  { x: -6.0, z: -0.2 },
  { x: -8.2, z: -4.3 },
  { x: -6.8, z: -8.9 },
  { x: -4.4, z: -10.6 },
];
const PATH_WIDTH = 1.3;
const PATH_TOP = 0.1;

/**
 * La lanterne sur piquet en tête du chemin, dans l'alignement de sa barrière, au sud de son premier piquet, hors de la dalle
 * (jamais une grosse lanterne de premier plan) : derrière la caméra de la vue vers l'est, au coin nord-ouest de la dalle
 * (retouche 1 : au coin de la dalle, elle bouchait cette vue).
 */
const PATH_LANTERN = { x: -6.55, z: 0.9, h: 1.35 } as const;

/** La haie, au nord-est, derrière la cabane : trois buissons secs en dômes à pans (place, taille). */
const HEDGE = [
  [7.7, -4.4, 0.85],
  [9.0, -3.1, 0.95],
  [10.1, -1.5, 0.8],
] as const;

/**
 * La pousse en pot, entre le bout ouest de la haie et la margelle, visible de la porte entre la cabane et la margelle ;
 * en scénette, à gauche du récipient de pluie (retouche 2 : posée juste au-dessus de lui à l'écran, les deux faisaient
 * un totem).
 */
const POT = { x: 5.3, z: -3.4 } as const;

/** Les croûtes jaune pâle, plates sur la roche ocre autour de la margelle (avant comme après) ; leur taille. */
const CRUSTS = [
  [-4.3, -3.0, 0.55],
  [-3.2, -9.4, 0.5],
  [3.4, -9.9, 0.6],
  [5.6, -6.6, 0.45],
  [-4.6, -7.4, 0.4],
] as const;

/** Les croûtes du lit sec de la margelle, dans la ruine. */
const DRY_CRUSTS = [
  [-0.8, -3.0, 0.42],
  [2.7, -7.7, 0.36],
] as const;

/** Une croûte : un aplat à six pans irréguliers, face au ciel, au ras du sol. */
function crust(b: FacetBuilder, x: number, y: number, z: number, s: number, seed: number): void {
  const outline = Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI * k) / 3 + seed * 0.7;
    const r = s * (0.75 + 0.3 * (((seed + 1) * (k + 3) * 7) % 5) / 5);
    return [r * Math.cos(a) * 1.3, r * Math.sin(a)] as const;
  });
  b.plate({ x, y: y + 0.02, z, pitch: -Math.PI / 2, yaw: seed }, outline, C.crust);
}

/** Une bouche : un cône tronqué d'ocre à six pans, ouvert en haut (son haut brun sombre), posé sur la roche. */
function vent(b: FacetBuilder, v: (typeof VENTS)[number], ground: SiteGround): void {
  b.prism({ x: v.x, y: SINK, z: v.z, yaw: 0.3 }, v.r, v.r * VENT_TOP, v.h - SINK + ground.at(v.x, v.z), 6, C.ochre, C.vent);
}

/**
 * Un panache de vapeur, fixe : ses bouffées arrondies à six pans, en colonne sans torsion, chacune à moitié dans la
 * précédente ; elles s'élargissent un peu en montant puis finissent sur une petite, et penchent de plus en plus vers
 * l'est ; le dessus fermé sur la dernière seulement (les autres sont dans la suivante). Vingt-quatre triangles par
 * bouffée, six pour le dessus.
 */
function plume(b: FacetBuilder, v: (typeof VENTS)[number], p: (typeof PLUMES)[number], base: number): void {
  const n = PUFF.sides;
  const y0 = base + v.h + 0.04;
  const mouth = v.r * VENT_TOP;
  const radii = [...PUFF.grow.slice(0, p.puffs - 1), PUFF.end].map((g) => g * mouth);
  // La hauteur de chaque bouffée, à proportion de son ventre, pour que la dernière finisse au haut du panache.
  const sum = radii.reduce((a, r, k) => a + r * (k + 1 < radii.length ? 1 - PUFF.overlap : 1), 0);
  const height = p.top - y0;
  const unit = height / sum;
  // Le pas vers l'est à la hauteur `y` : nul au pied, `drift` de la hauteur au haut, de plus en plus marqué.
  const lean = (y: number) => PUFF.drift * height * Math.pow((y - y0) / height, 1.5);
  const ring = (x: number, y: number, r: number) =>
    Array.from({ length: n }, (_, k): [number, number, number] => {
      const a = (2 * Math.PI * k) / n;
      return [x + r * Math.cos(a), y, v.z + r * Math.sin(a)];
    });
  const sunny = (k: number) => {
    const a = (2 * Math.PI * (k + 0.5)) / n;
    return Math.cos(a) * SUN.x + Math.sin(a) * SUN.z > 0;
  };
  type Tone = (typeof STEAM)['low' | 'high'];
  const band = (lo: [number, number, number][], hi: [number, number, number][], tone: Tone, over: boolean) => {
    for (let k = 0; k < n; k++) {
      const lit = sunny(k);
      const color = over && lit ? tone.cap : over || lit ? tone.mid : tone.under;
      b.quad(lo[(k + 1) % n], lo[k], hi[k], hi[(k + 1) % n], color);
    }
  };
  let y = y0;
  radii.forEach((r, k) => {
    const tone = 2 * k < radii.length ? STEAM.low : STEAM.high;
    const h = r * unit;
    // Chaque bouffée d'un bloc, à la place de son ventre, et un peu de côté, d'un bord puis de l'autre (`sway`, en part du
    // haut de la bouche) : le pas de l'une à l'autre se lit sur les deux bords du panache.
    const x = v.x + lean(y + h / 2) + PUFF.sway[k] * mouth;
    const foot = ring(x, y, r * PUFF.neck);
    const belly = ring(x, y + h / 2, r);
    const neck = ring(x, y + h, r * PUFF.neck);
    // Une bouffée plus étroite que le cou de la précédente (la dernière) a son dessous dans celle-ci : il ne se dessine
    // pas ; la précédente se ferme alors d'un dôme bas, comme la dernière.
    const inside = k > 0 && r < radii[k - 1] * PUFF.neck;
    const capped = k === radii.length - 1 || radii[k + 1] < r * PUFF.neck;
    if (!inside) band(foot, belly, tone, false);
    band(belly, neck, tone, true);
    if (capped) {
      const c: [number, number, number] = [x, y + h + PUFF.dome * r, v.z];
      for (let i = 0; i < n; i++) b.triangle(c, neck[(i + 1) % n], neck[i], k === radii.length - 1 ? STEAM.top : tone.cap);
    }
    y += h * (1 - PUFF.overlap);
  });
}

/**
 * Un anneau de blocs taillés (la margelle) : pour chaque pan gardé (`keep`), son dessus, son flanc dehors et son flanc
 * dedans (jamais son dessous), de deux tons qui alternent ; `height` : la hauteur de chaque pan.
 */
function ring(b: FacetBuilder, keep: (k: number) => boolean, height: (k: number) => number): void {
  const M = MARGELLE;
  const at = (r: number, k: number, y: number): [number, number, number] => {
    const a = (2 * Math.PI * k) / M.sides;
    return [M.x + r * Math.cos(a), y, M.z + r * Math.sin(a)];
  };
  for (let k = 0; k < M.sides; k++) {
    if (!keep(k)) continue;
    const h = height(k);
    const color = k % 2 ? C.block : C.blockShade;
    const y0 = -0.3;
    b.quad(at(M.inner, k + 1, h), at(M.r, k + 1, h), at(M.r, k, h), at(M.inner, k, h), k % 2 ? C.ochreLight : C.block);
    b.quad(at(M.r, k + 1, y0), at(M.r, k, y0), at(M.r, k, h), at(M.r, k + 1, h), color);
    b.quad(at(M.inner, k, y0), at(M.inner, k + 1, y0), at(M.inner, k + 1, h), at(M.inner, k, h), color);
  }
}

/** L'eau de la margelle : une nappe plate et fixe à douze pans, de l'eau des rives, sans reflet ni ride. */
function water(b: FacetBuilder): void {
  const M = MARGELLE;
  const outline = Array.from({ length: M.sides }, (_, k) => {
    const a = (2 * Math.PI * k) / M.sides;
    return [M.inner * Math.cos(a), M.inner * Math.sin(a)] as const;
  });
  b.plate({ x: M.x, y: M.water, z: M.z, pitch: -Math.PI / 2 }, outline, C.water);
}

/** Les coins d'une dalle de la rangée `row` (0 : nord), entre `x0` et `x1`, rétrécie de `gap` (les joints ouverts de la ruine). */
function slab(row: 0 | 1, x0: number, x1: number, gap = 0): { x: number; z: number; w: number; d: number } {
  const D = DALLE;
  const [z0, z1] = row === 0 ? [D.z0, D.row] : [D.row, D.z1];
  return { x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0 - 2 * gap, d: z1 - z0 - 2 * gap };
}

/**
 * La dalle remise à plat : son dessus en grandes dalles de deux tons, décalées d'une rangée à l'autre (les joints sont
 * leurs arêtes), ses quatre flancs jusque sous le sol. Vingt-quatre triangles.
 */
function dalle(b: FacetBuilder): void {
  const D = DALLE;
  const y = D.top;
  const rows = [D.north, D.south] as const;
  rows.forEach((cuts, row) => {
    for (let i = 0; i + 1 < cuts.length; i++) {
      const s = slab(row as 0 | 1, cuts[i], cuts[i + 1]);
      const color = (i + row) % 2 ? C.stone : C.stoneSun;
      b.quad([s.x - s.w / 2, y, s.z - s.d / 2], [s.x - s.w / 2, y, s.z + s.d / 2], [s.x + s.w / 2, y, s.z + s.d / 2], [s.x + s.w / 2, y, s.z - s.d / 2], color);
    }
  });
  const lo = SINK;
  const c = (x: number, yy: number, z: number): [number, number, number] => [x, yy, z];
  b.quad(c(D.x0, lo, D.z1), c(D.x1, lo, D.z1), c(D.x1, y, D.z1), c(D.x0, y, D.z1), C.stoneShade);
  b.quad(c(D.x1, lo, D.z0), c(D.x0, lo, D.z0), c(D.x0, y, D.z0), c(D.x1, y, D.z0), C.stoneShade);
  b.quad(c(D.x1, lo, D.z1), c(D.x1, lo, D.z0), c(D.x1, y, D.z0), c(D.x1, y, D.z1), C.stoneShade);
  b.quad(c(D.x0, lo, D.z0), c(D.x0, lo, D.z1), c(D.x0, y, D.z1), c(D.x0, y, D.z0), C.stoneShade);
}

/**
 * La dalle de la ruine : les mêmes dalles, chacune à part, ses joints ouverts (on voit l'ocre entre elles), la rangée du
 * nord fendue de la rangée du sud ; une dalle du nord soulevée, son bord nord plus haut (la terre a bougé).
 */
function brokenDalle(b: FacetBuilder): void {
  const D = DALLE;
  const rows = [D.north, D.south] as const;
  rows.forEach((cuts, row) => {
    for (let i = 0; i + 1 < cuts.length; i++) {
      const s = slab(row as 0 | 1, cuts[i], cuts[i + 1], row === 0 && i < 2 ? 0.14 : 0.07);
      const tilted = row === 0 && i === 2;
      const color = (i + row) % 2 ? C.stone : C.stoneSun;
      b.box({ x: s.x, y: SINK, z: s.z, pitch: tilted ? 0.08 : 0 }, [s.w, D.top - SINK, s.d], C.stoneShade, color);
    }
  });
}

/** Le socle de la grande sonde : huit pans de pierre grise, le trou rond sombre et peu profond, ses quatre goujons de fer. */
function socle(b: FacetBuilder): void {
  const S = SOCLE;
  const top = DALLE.top + S.h;
  b.prism({ x: S.x, y: SINK, z: S.z, yaw: Math.PI / 8 }, S.r, S.r * 0.94, top - SINK, 8, C.stoneShade, C.stone);
  const hole = Array.from({ length: 8 }, (_, k) => [S.hole * Math.cos((Math.PI * k) / 4), S.hole * Math.sin((Math.PI * k) / 4)] as const);
  b.plate({ x: S.x, y: top + 0.01, z: S.z, pitch: -Math.PI / 2 }, hole, C.hole);
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (Math.PI * k) / 2;
    b.prism({ x: S.x + S.pins * Math.cos(a), y: top - 0.02, z: S.z + S.pins * Math.sin(a) }, S.pin, S.pin, 0.09, 5, C.probe);
  }
}

/**
 * Une lanterne pendue (comme celles du Hameau) : sa corde, sa vitre à six pans (d'ocre, sans ombre, ou éteinte), son
 * chapeau de bronze. Trente-six triangles.
 */
function hangingLantern(b: FacetBuilder, at: Vec3, lit: boolean): void {
  const y = at.y - 0.8;
  b.beam(at, { x: at.x, y: y + 0.42, z: at.z }, 0.04, C.rope);
  b.prism({ x: at.x, y, z: at.z }, 0.18, 0.18, 0.42, 6, lit ? C.lantern : C.unlit);
  b.prism({ x: at.x, y: y + 0.42, z: at.z, yaw: Math.PI / 6 }, 0.26, 0, 0.18, 6, C.bronze);
}

/** La perche de la sondeuse, à côté de la porte, droite même quand la cabane penche ; sa lanterne allumée dès la ruine. */
function pole(b: FacetBuilder, ground: SiteGround): void {
  const g = ground.at(POLE.x, POLE.z);
  b.box({ x: POLE.x, y: g - 0.4, z: POLE.z }, [0.12, POLE.h + 0.4, 0.12], C.newShade);
  const tip = { x: POLE.x - POLE.arm, y: g + POLE.h - 0.05, z: POLE.z };
  b.beam({ x: POLE.x, y: tip.y, z: POLE.z }, tip, 0.08, C.newShade);
  hangingLantern(b, tip, true);
}

/**
 * Le corps de la cabane, dans son repère (son centre au sol en 0) : ses quatre pieds courts (`broken` : le pied du
 * sud-est cassé, celui du nord-est enfoncé), son plancher, ses planches (le mur, puis la bande de persienne en deux tons
 * alternés sous l'avant-toit), sa porte au sud (`worn` : le bois usé, la porte partie, le dedans sombre). Sans toit.
 */
function cabinBody(b: FacetBuilder, worn: boolean, broken: boolean): void {
  const K = CABIN;
  const wood = worn ? C.wornWood : C.newWood;
  const shade = worn ? C.wornShade : C.newShade;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const top = K.feet;
      const short = broken && sx > 0 ? (sz > 0 ? 0.12 : 0.05) : top;
      b.box({ x: sx * (K.w / 2 - 0.15), y: SINK, z: sz * (K.d / 2 - 0.15) }, [0.2, short - SINK, 0.2], shade);
    }
  b.box({ x: 0, y: K.feet, z: 0 }, [K.w + 0.2, K.floor, K.d + 0.2], shade, wood);
  const y0 = K.feet + K.floor;
  b.box({ x: 0, y: y0, z: 0 }, [K.w, K.wall, K.d], wood);
  b.box({ x: 0, y: y0 + K.wall, z: 0 }, [K.w + 0.06, K.band, K.d + 0.06], shade);
  b.box({ x: 0, y: y0 + K.wall + K.band, z: 0 }, [K.w + 0.1, K.band, K.d + 0.1], wood);
  b.plate({ x: 0, y: y0, z: K.d / 2 + 0.012 }, [[-0.4, 0], [0.4, 0], [0.4, 1.25], [-0.4, 1.25]], worn ? C.hole : C.door);
}

/**
 * Pose un dessin fait dans le repère de la cabane : à sa place, ou penché vers l'est (`roll`, autour de son bord bas de
 * l'ouest) et glissé de `shift` le long de x, contre sa roche, relevé d'autant que le bord bas de l'est de son plancher
 * reste posé au sol (ses pieds de l'ouest, qui descendent sous le sol, l'y portent). Normales comprises.
 */
function placeCabin(b: FacetBuilder, ground: SiteGround, draw: (l: FacetBuilder) => void, roll = 0, shift = 0): void {
  const l = new FacetBuilder();
  draw(l);
  const f = l.build();
  const lift = Math.max(0, (CABIN.w + 0.1) * Math.sin(roll) - CABIN.feet + 0.03);
  const g = ground.at(CABIN.x, CABIN.z) + lift;
  const px = -CABIN.w / 2,
    py = CABIN.feet;
  const c = Math.cos(-roll),
    s = Math.sin(-roll);
  for (let i = 0; i < f.positions.length; i += 3) {
    const x = f.positions[i] - px,
      y = f.positions[i + 1] - py;
    f.positions[i] = CABIN.x + shift + px + x * c - y * s;
    f.positions[i + 1] = g + py + x * s + y * c;
    f.positions[i + 2] += CABIN.z;
    const nx = f.normals[i],
      ny = f.normals[i + 1];
    f.normals[i] = nx * c - ny * s;
    f.normals[i + 1] = nx * s + ny * c;
  }
  b.append(f);
}

/** Le toit de lauze à deux pans, son faîtage le long de la façade, ses pignons de bois ; sa planche de rive aux racines. */
function cabinRoof(b: FacetBuilder, ground: SiteGround): void {
  const K = CABIN;
  const y = ground.at(K.x, K.z) + CABIN_TOP;
  b.gableRoof({ x: K.x, y, z: K.z }, K.w + 2 * K.eave, K.d + 2 * K.eave, K.roof, C.lauze, C.newShade);
  const z = K.z + K.d / 2 + K.eave + 0.02;
  b.beam({ x: K.x - K.w / 2 - K.eave, y: y - 0.04, z }, { x: K.x + K.w / 2 + K.eave, y: y - 0.04, z }, 0.14, C.newShade);
  // Le motif des racines entrelacées, en vert-de-gris : une onde de trois traits sur la planche de rive, sans lettre ni chiffre.
  const wave = [-1.05, -0.35, 0.35, 1.05].map((dx, i) => [K.x + dx, y - 0.04 + (i % 2 ? 0.03 : -0.03)] as const);
  for (let i = 0; i < 3; i++) {
    const [x0, y0] = wave[i];
    const [x1, y1] = wave[i + 1];
    b.plate({ x: 0, y: 0, z: z + 0.075 }, [[x0, y0 - 0.025], [x1, y1 - 0.025], [x1, y1 + 0.025], [x0, y0 + 0.025]], C.verdigris);
  }
}

/** La girouette, dans le repère du mât (son pied en 0) : un bras, une feuille unie à un bout, un contrepoids rond à l'autre. */
const LEAF: readonly (readonly [number, number])[] = [
  [-0.95, 0],
  [-0.7, -0.2],
  [-0.35, -0.16],
  [-0.2, 0],
  [-0.35, 0.16],
  [-0.7, 0.2],
];

function vane(b: FacetBuilder, x: number, y: number, z: number, lying: boolean, color: number): void {
  if (lying) {
    // Couchée avec le mât : le bras à plat, la feuille face au ciel, le contrepoids de l'autre côté.
    b.beam({ x: x - 0.2, y: y + 0.05, z }, { x: x + 0.7, y: y + 0.05, z }, 0.08, C.iron);
    b.extrude({ x, y: y + 0.01, z, pitch: -Math.PI / 2 }, LEAF, 0.05, color, color);
    b.prism({ x: x + 0.75, y, z }, 0.13, 0.13, 0.22, 6, C.iron);
    return;
  }
  b.beam({ x: x - 0.2, y, z }, { x: x + 0.7, y, z }, 0.08, C.iron);
  b.extrude({ x, y, z: z - 0.025 }, LEAF, 0.05, color, color);
  b.prism({ x: x + 0.75, y: y - 0.13, z }, 0.13, 0.13, 0.26, 6, C.iron);
}

/**
 * Le mât debout : sa perche de bois mince, sa lanterne fixée au mât sous le bras (vitre 1,4 fois celle de la cabane,
 * jamais pendue au bout du bras), la girouette au sommet. Allumée dès sa pose.
 */
function mast(b: FacetBuilder): void {
  const M = MAST;
  const y = DALLE.top;
  b.box({ x: M.x, y: SINK, z: M.z }, [M.t, M.h - SINK, M.t], C.newShade);
  const s = MAST_LANTERN;
  const lz = M.z + 0.34;
  b.box({ x: M.x, y: y + 3.6, z: M.z + 0.16 }, [0.07, 0.07, 0.3], C.bronze);
  b.prism({ x: M.x, y: y + 3.05, z: lz }, 0.18 * s, 0.18 * s, 0.42 * s, 6, C.lantern);
  b.prism({ x: M.x, y: y + 3.05 + 0.42 * s, z: lz, yaw: Math.PI / 6 }, 0.26 * s, 0, 0.18 * s, 6, C.bronze);
  vane(b, M.x, M.arm, M.z, false, C.newWood);
}

/** Un buisson sec en dôme à pans (la haie, et celui qui cadre la scénette), comme ceux des Contreforts. Vingt-quatre triangles. */
export function dryBush(b: FacetBuilder, x: number, y: number, z: number, s: number, yaw: number): void {
  b.prism({ x, y: y - 0.3, z, yaw }, 1.0 * s, 0.68 * s, 0.95 * s, 6, C.shrub, C.shrubTop);
  b.prism({ x, y: y + 0.65 * s, z, yaw: yaw + 0.5 }, 0.68 * s, 0, 0.42 * s, 6, C.shrubTop);
}

/** Le chemin de dalles, en tronçons de deux tons (deux par segment), au ras du sol. */
function path(b: FacetBuilder): void {
  for (let i = 0; i + 1 < PATH.length; i++) {
    const a = PATH[i],
      c = PATH[i + 1];
    const len = Math.hypot(c.x - a.x, c.z - a.z);
    const yaw = Math.atan2(-(c.z - a.z), c.x - a.x);
    for (let h = 0; h < 2; h++) {
      const t = (h + 0.5) / 2;
      b.box({ x: a.x + (c.x - a.x) * t, y: SINK, z: a.z + (c.z - a.z) * t, yaw }, [len / 2 + (h ? 0.35 : 0), PATH_TOP - SINK, PATH_WIDTH], C.stoneShade, (i + h) % 2 ? C.stone : C.stoneSun);
    }
  }
}

/** La normale d'un segment du chemin, du côté de l'ouest (son bord extérieur). */
function outward(a: Vec2, c: Vec2): Vec2 {
  const len = Math.hypot(c.x - a.x, c.z - a.z);
  return { x: (c.z - a.z) / len, z: -(c.x - a.x) / len };
}

/** Les piquets de la barrière basse, le long du bord extérieur des deux premiers segments du chemin. */
function fencePosts(): Vec2[] {
  const n0 = outward(PATH[0], PATH[1]);
  const n1 = outward(PATH[1], PATH[2]);
  const off = PATH_WIDTH / 2 + 0.35;
  const mid = { x: (n0.x + n1.x) / 2, z: (n0.z + n1.z) / 2 };
  const ml = Math.hypot(mid.x, mid.z);
  return [
    { x: PATH[0].x + n0.x * off, z: PATH[0].z + n0.z * off },
    { x: PATH[1].x + (mid.x / ml) * off, z: PATH[1].z + (mid.z / ml) * off },
    { x: PATH[2].x + n1.x * off, z: PATH[2].z + n1.z * off },
  ];
}

/** La barrière basse : trois piquets droits et deux lisses parallèles entre chacun. */
function fence(b: FacetBuilder, ground: SiteGround): void {
  const posts = fencePosts();
  for (const p of posts) b.box({ x: p.x, y: ground.at(p.x, p.z) - 0.3, z: p.z }, [0.12, 1.05, 0.12], C.newShade);
  for (let i = 0; i + 1 < posts.length; i++)
    for (const h of [0.35, 0.65]) {
      const a = posts[i],
        c = posts[i + 1];
      b.beam({ x: a.x, y: ground.at(a.x, a.z) + h, z: a.z }, { x: c.x, y: ground.at(c.x, c.z) + h, z: c.z }, 0.07, C.newWood);
    }
}

/**
 * Les volumes des Fumerolles, de la ruine aux abords (le modèle du lieu). `ground` : le sol sous un point du lieu ;
 * `door` : sa porte, au sud, un peu à l'est.
 */
function model(add: AddPiece, ground: SiteGround, _door: Vec2): void {
  const at = (x: number, z: number) => ground.at(x, z);
  // Toujours là : les trois bouches et leur vapeur fixe, les croûtes, le socle nu, la roche de la cabane, et la lanterne
  // de la sondeuse sur sa perche, allumée dès la ruine (la seule).
  add('ruine', 0, (b) => {
    VENTS.forEach((v, i) => {
      vent(b, v, ground);
      plume(b, v, PLUMES[i], at(v.x, v.z));
    });
  });
  add('ruine', 0, (b) => {
    CRUSTS.forEach(([x, z, s], i) => crust(b, x, at(x, z), z, s, i + 1));
    socle(b);
    rock(b, { x: CABIN_ROCK.x, y: at(CABIN_ROCK.x, CABIN_ROCK.z), z: CABIN_ROCK.z }, CABIN_ROCK.r, CABIN_ROCK.h, 5, OCHRE_ROCK);
    pole(b, ground);
  });

  // La ruine du corps : l'arc du nord de la margelle (ses bouts plus bas, cassés), ses trois blocs tombés (l'un glissé
  // contre la bouche du milieu), le lit sec et ses croûtes ; la dalle fendue ; les sondes couchées côte à côte ; la cabane
  // penchée sur sa roche, sans son toit.
  const corps = { stage: 0 as Stage, row: 0 };
  add(
    'ruine',
    0,
    (b) => {
      const arc = [7, 8, 9, 10];
      ring(b, (k) => arc.includes(k), (k) => (k === 7 ? 0.32 : k === 10 ? 0.42 : MARGELLE.h));
      for (const [x, z, yaw, pitch] of [
        [0.45, -4.35, 0.4, 0.25],
        [-3.3, -2.1, 1.3, -0.2],
        [3.6, -2.6, 2.2, 0.18],
      ] as const)
        b.prism({ x, y: at(x, z) - 0.15, z, yaw, pitch }, 0.62, 0.46, 0.62, 5, C.blockShade, C.block);
      DRY_CRUSTS.forEach(([x, z, s], i) => crust(b, x, at(x, z), z, s, i + 7));
    },
    corps,
  );
  add('ruine', 0, (b) => brokenDalle(b), corps);
  add(
    'ruine',
    0,
    (b) => {
      // Les deux sondes couchées sur la dalle, parallèles, jamais croisées ; leur tête au même bout.
      for (const z of [3.0, 3.5]) {
        b.beam({ x: -4.0, y: DALLE.top + PROBE.t / 2, z }, { x: -2.4, y: DALLE.top + PROBE.t / 2, z }, PROBE.t * 0.8, C.probe);
        b.prism({ x: -2.25, y: DALLE.top, z }, PROBE.head, PROBE.head * 0.8, 0.3, 6, C.probeHead);
      }
    },
    corps,
  );
  add('ruine', 0, (b) => placeCabin(b, ground, (l) => cabinBody(l, true, true), CABIN_LEAN, CABIN_SLIDE), corps);

  // La ruine du haut : le toit tombé à plat à côté de la cabane et ses deux lames décrochées, parallèles ; le mât couché sur
  // la roche ocre, vers le nord, la feuille de la girouette face au ciel.
  const haut = { stage: 1 as Stage, row: 0 };
  add(
    'ruine',
    0,
    (b) => {
      const r = FALLEN_ROOF;
      b.gableRoof({ x: r.x, y: at(r.x, r.z) - 0.02, z: r.z, yaw: r.yaw }, CABIN.w + 0.4, CABIN.d + 0.6, 0.28, C.lauze, C.wornShade);
      for (const [x, z] of FALLEN_SLATS)
        b.box({ x, y: at(x, z) - 0.01, z, yaw: 0.25 }, [1.2, 0.05, 0.2], C.wornShade, C.wornWood);
      const foot = { x: 6.6, z: -0.9 };
      const tip = { x: 6.9, z: -0.9 - MAST.h };
      b.beam({ x: foot.x, y: at(foot.x, foot.z) + 0.08, z: foot.z }, { x: tip.x, y: at(tip.x, tip.z) + 0.08, z: tip.z }, MAST.t, C.wornShade);
      vane(b, tip.x, at(tip.x, tip.z), tip.z - 0.12, true, C.wornWood);
    },
    haut,
  );

  // La ruine des abords : deux lisses couchées au sol, parallèles, un piquet penché, et la lanterne du chemin éteinte,
  // couchée à côté.
  const abords = { stage: 2 as Stage, row: 0 };
  add(
    'ruine',
    0,
    (b) => {
      for (const dx of [0, 0.45]) {
        const a = { x: -8.1 + dx, z: -2.2 },
          c = { x: -7.5 + dx, z: -4.6 };
        b.beam({ x: a.x, y: at(a.x, a.z) + 0.04, z: a.z }, { x: c.x, y: at(c.x, c.z) + 0.04, z: c.z }, 0.08, C.wornWood);
      }
      const p = { x: -7.1, z: -1.3 };
      b.beam({ x: p.x, y: at(p.x, p.z) - 0.2, z: p.z }, { x: p.x - 0.45, y: at(p.x, p.z) + 0.75, z: p.z + 0.15 }, 0.12, C.wornShade);
      const l = { x: -6.9, z: 0.6 };
      const g = at(l.x, l.z);
      b.beam({ x: l.x - 0.6, y: g + 0.07, z: l.z + 0.2 }, { x: l.x + 0.5, y: g + 0.07, z: l.z - 0.1 }, 0.12, C.wornShade);
      b.box({ x: l.x + 0.75, y: g - 0.02, z: l.z - 0.16, yaw: 0.27 }, [0.32, 0.26, 0.26], C.unlit);
    },
    abords,
  );

  // Le corps : la dalle remise à plat, la margelle entière et l'eau dedans ; puis la cabane redressée sur ses quatre pieds,
  // ses planches neuves, sa porte, sans son toit.
  add(0, 0, (b) => {
    dalle(b);
    ring(b, () => true, () => MARGELLE.h);
    water(b);
  });
  add(0, 0.5, (b) => placeCabin(b, ground, (l) => cabinBody(l, false, false)));
  // Le haut : le toit de lauze et sa planche de rive aux racines ; puis le mât, sa lanterne (allumée à sa pose, jamais à
  // une réussite) et la girouette.
  add(1, 0, (b) => cabinRoof(b, ground));
  add(1, 0.5, (b) => mast(b));
  // Les abords : le chemin de dalles qui contourne la margelle et sa barrière basse ; puis la haie et la lanterne du chemin.
  add(2, 0, (b) => {
    path(b);
    fence(b, ground);
  });
  add(2, 0.5, (b) => {
    HEDGE.forEach(([x, z, s], i) => dryBush(b, x, at(x, z), z, s, i * 1.3));
    const l = PATH_LANTERN;
    const g = at(l.x, l.z);
    b.box({ x: l.x, y: g - 0.3, z: l.z }, [0.12, l.h + 0.3, 0.12], C.newShade);
    b.box({ x: l.x, y: g + l.h, z: l.z }, [0.26, 0.3, 0.26], C.lantern);
    b.prism({ x: l.x, y: g + l.h + 0.3, z: l.z, yaw: Math.PI / 4 }, 0.22, 0, 0.18, 4, C.bronze);
  });
}

// ---------- Les traces ----------

/** Le sol d'un point du lieu, depuis son centre posé au sol (`c`), dans le monde. */
const groundNear = (c: Vec3, lx: number, lz: number): number => standingHeight(heightAt5e({ x: c.x + lx, z: c.z + lz })) - c.y;

/** Dessine dans le repère du lieu, puis pose le dessin au centre du lieu (`c`), dans le monde. */
function inWorld(b: FacetBuilder, c: Vec3, draw: (l: FacetBuilder) => void): void {
  const l = new FacetBuilder();
  draw(l);
  const f: Facets = l.build();
  for (let i = 0; i < f.positions.length; i += 3) {
    f.positions[i] += c.x;
    f.positions[i + 1] += c.y;
    f.positions[i + 2] += c.z;
  }
  b.append(f);
}

/**
 * Les deux sondes redressées (La Terre active) : deux tiges de fer gris à tête ronde de fer, hautes de 1,8, épaisses
 * comme un poteau ; l'une sur la dalle, l'autre au bord de la margelle, séparées en profondeur (jamais côte à côte).
 */
function probes(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    PROBES.forEach((p, i) => {
      const g = i === 0 ? DALLE.top : groundNear(c, p.x, p.z);
      const rod = g + PROBE.h - 0.3;
      l.box({ x: p.x, y: g - 0.3, z: p.z }, [PROBE.t, rod - g + 0.3, PROBE.t], C.probe);
      // La tête ronde : deux troncs de cône à six pans dos à dos, qui s'élargissent puis se referment.
      l.prism({ x: p.x, y: rod, z: p.z }, PROBE.head * 0.7, PROBE.head, 0.13, 6, C.probeHead);
      l.prism({ x: p.x, y: rod + 0.13, z: p.z, yaw: Math.PI / 6 }, PROBE.head, PROBE.head * 0.45, 0.15, 6, C.probeHead);
    });
  });
}

/**
 * Le récipient de pluie (Météo et climat) : un pot de pierre grise évasé, l'embouchure en entonnoir, sur un trépied de
 * bois, à l'échelle d'un panier ; sans trait ni graduation. Jamais une marmite.
 */
function rainGauge(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = RAIN;
    const y = DALLE.top;
    const top = y + 0.55;
    for (let k = 0; k < 3; k++) {
      const a = (2 * Math.PI * k) / 3 + 0.4;
      l.beam({ x: x + 0.34 * Math.cos(a), y, z: z + 0.34 * Math.sin(a) }, { x: x + 0.12 * Math.cos(a), y: top, z: z + 0.12 * Math.sin(a) }, 0.06, C.newShade);
    }
    l.prism({ x, y: top - 0.05, z }, 0.13, 0.17, 0.2, 6, C.stoneShade, C.stone);
    l.prism({ x, y: top + 0.15, z, yaw: Math.PI / 6 }, 0.17, 0.36, 0.26, 6, C.stone, C.stoneShade);
  });
}

/**
 * La pousse (Ressources et action humaine) : une jeune pousse tuteurée dans un pot de pierre ventru à deux anses, sur un
 * tabouret de pierre, entre le bout ouest de la haie et la margelle. Le pot se distingue du récipient de pluie par sa forme.
 */
function sprout(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = POT;
    const g = groundNear(c, x, z);
    l.prism({ x, y: g - 0.2, z }, 0.3, 0.26, 0.62, 6, C.stoneShade, C.stone);
    const y = g + 0.42;
    l.prism({ x, y, z }, 0.17, 0.27, 0.17, 7, C.potStone);
    l.prism({ x, y: y + 0.17, z }, 0.27, 0.19, 0.17, 7, C.potStone, C.potTop);
    for (const side of [-1, 1]) l.box({ x: x + side * 0.3, y: y + 0.16, z }, [0.08, 0.14, 0.14], C.potStone);
    const soil = y + 0.33;
    l.beam({ x, y: soil, z }, { x: x + 0.02, y: soil + 0.42, z }, 0.04, C.leaf);
    l.beam({ x: x - 0.1, y: soil, z: z - 0.05 }, { x: x - 0.1, y: soil + 0.55, z: z - 0.05 }, 0.035, C.newShade);
    // Deux feuilles, chacune vue des deux côtés (un aplat, et le même retourné).
    for (const side of [-1, 1]) {
      const shape = ([[0, 0], [0.18, 0.04], [0.06, 0.1]] as const).map(([u, v]) => [u * side, v] as const);
      const o = { x: x + 0.02, y: soil + 0.3 + (side > 0 ? 0.08 : 0), z, yaw: 0.3 };
      l.plate(o, shape, C.leaf);
      l.plate(o, [...shape].reverse(), C.leaf);
    }
  });
}

// ---------- La scénette ----------

/**
 * Le cap de départ de la caméra de la scénette (`site.start`) : un peu depuis le sud-ouest (retouche 1). De face, la
 * caméra voyait par-dessus la dalle le lieu entier, les trois bouches au milieu de l'image ; de biais, derrière Kéo, à
 * gauche, la bouche de l'est et son panache seuls (les deux autres passent sous le panneau de la consigne), derrière la
 * sondeuse, la façade de la cabane, et entre eux, les traces.
 */
const SCENE_START = (-26 * Math.PI) / 180;

/** La droite de la scène vue de la caméra (le long de la façade, en biais) et le côté de la caméra. */
const SCENE_RIGHT = { x: Math.cos(SCENE_START), z: -Math.sin(SCENE_START) } as const;
const SCENE_BACK = { x: Math.sin(SCENE_START), z: Math.cos(SCENE_START) } as const;

/** La demi-largeur de Kéo et de la sondeuse l'un de l'autre, et leur avancée vers la caméra (celles du Hameau). */
const SCENE_HALF = 2.3;
const SCENE_FORWARD = 0.3;

/** La sondeuse, sur la dalle, devant la cabane, à la gauche de sa porte. */
const SURVEYOR_AT = { x: 7.1, z: 4.6 } as const;

/**
 * Le milieu de la scène, depuis le centre du lieu : sur la dalle, entre Kéo et la sondeuse ; la demi-largeur et la
 * demi-profondeur du sol relevé sous elle (tout sur la dalle).
 */
const SCENE_SPOT = {
  dx: SURVEYOR_AT.x - SCENE_RIGHT.x * SCENE_HALF - SCENE_BACK.x * SCENE_FORWARD,
  dz: SURVEYOR_AT.z - SCENE_RIGHT.z * SCENE_HALF - SCENE_BACK.z * SCENE_FORWARD,
  half: [2.3, 1.4] as [number, number],
} as const;

/** Les places de Kéo et de la sondeuse depuis le milieu de la scène : de part et d'autre, un peu vers la caméra. */
const sceneSide = (side: -1 | 1) => ({ dx: SCENE_RIGHT.x * SCENE_HALF * side + SCENE_BACK.x * SCENE_FORWARD, dz: SCENE_RIGHT.z * SCENE_HALF * side + SCENE_BACK.z * SCENE_FORWARD });

/**
 * Le point de la scène depuis son milieu, `right` vers la droite de la caméra de départ et `back` vers elle : pour
 * poser ses abords (./fumerollesSurroundings.ts).
 */
export const fumerollesSceneOffset = (right: number, back: number): { dx: number; dz: number } => ({
  dx: SCENE_RIGHT.x * right + SCENE_BACK.x * (back + SCENE_FORWARD),
  dz: SCENE_RIGHT.z * right + SCENE_BACK.z * (back + SCENE_FORWARD),
});

/**
 * La dalle est le plancher de la scénette : Kéo et la sondeuse se tiennent sur son dessus. La scène se pose au plus haut
 * du sol relevé sous elle (questionScene.ts, `sceneSpot`, un relevé par unité) ; sa hauteur au-dessus est celle qui
 * ramène ce sol au dessus de la dalle.
 */
function sceneRise(): number {
  const p = PLACES_5E.find((q) => q.id === 'fumerolles')!;
  const ground = (x: number, z: number) => standingHeight(heightAt5e({ x, z }));
  const at = { x: p.center.x + SCENE_SPOT.dx, z: p.center.z + SCENE_SPOT.dz };
  const [hx, hz] = SCENE_SPOT.half;
  const nx = Math.ceil(hx),
    nz = Math.ceil(hz);
  let top = ground(at.x, at.z);
  for (let i = -nx; i <= nx; i++) for (let k = -nz; k <= nz; k++) top = Math.max(top, ground(at.x + (i / nx) * hx, at.z + (k / nz) * hz));
  return ground(p.center.x, p.center.z) + DALLE.top - top;
}

/** La sondeuse en pion (son modèle 3D prend sa place, ./habitants.ts), immobile, le visage nu ; les bras le long du corps. */
function surveyor(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) {
    b.prism({ x: at.x + side * 0.12, y: at.y, z: at.z }, 0.13, 0.13, 0.2, 6, C.boots);
    b.prism({ x: at.x + side * 0.12, y: at.y + 0.2, z: at.z }, 0.12, 0.12, 0.3, 6, C.trousers);
  }
  b.prism({ x: at.x, y: at.y + 0.42, z: at.z }, 0.33, 0.26, 0.56, 8, C.coat);
  b.prism({ x: at.x, y: at.y + 0.92, z: at.z }, 0.2, 0.16, 0.08, 8, C.shirt);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  b.prism({ x: at.x, y: at.y + 1.22, z: at.z }, 0.34, 0.2, 0.06, 8, C.hat);
  b.prism({ x: at.x, y: at.y + 1.28, z: at.z }, 0.2, 0.15, 0.14, 8, C.hat);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.3, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.36, y: at.y + 0.5, z: at.z + 0.05 }, 0.12, C.coat);
}

/** La planche à relevés des réponses : la hauteur de ses tréteaux, à l'échelle 1 ; un galet choisi se soulève d'un cran. */
const BOARD = { height: 0.55, lift: 0.2 } as const;

/** Un galet plat à facettes à l'échelle `s` : un pied à six pans, un dessus bombé. Trente-six triangles. */
function pebble(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.28 * s, 0.32 * s, 0.09 * s, 6, C.pebble, C.pebble);
  b.prism({ x: at.x, y: at.y + 0.09 * s, z: at.z, yaw: 0.5 }, 0.32 * s, 0.15 * s, 0.1 * s, 6, C.pebble, C.pebbleTop);
}

/** Où se pose la trace de chaque mission, depuis le centre du lieu (la caméra du retour en garde la place). */
const TRACE_SPOTS = {
  'active-earth': { x: (PROBES[0].x + PROBES[1].x) / 2, z: (PROBES[0].z + PROBES[1].z) / 2 },
  'weather-climate': { x: RAIN.x, z: RAIN.z },
  'human-impact': { x: POT.x, z: POT.z },
} as const;

export const FUMEROLLES: PlaceArt = {
  role: 'La sondeuse',
  model,
  // L'étape la plus basse qui porte une trace : la scénette se joue sur le lieu dès que le corps est posé. Chaque trace a
  // la sienne (`stage`) : elle se montre quand sa mission est réussie et que son étape est posée.
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    rise: sceneRise(),
    keo: { ...sceneSide(-1), scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: sceneSide(1),
    // Le point visé entre eux, un peu vers la caméra (le long de z : celui des Kéo et sondeuse avancés).
    subject: { halfWidth: 3.4, bottom: -0.5, top: 3.2, depth: SCENE_BACK.z * SCENE_FORWARD },
    pitch: (14 * Math.PI) / 180,
    start: SCENE_START,
  },
  // Le décor de près : la dalle du lieu est le plancher (rien à poser dessus) ; la sondeuse en pion, sans son modèle.
  decor(b, _floor, at, sphere, body = true) {
    if (body) surveyor(b, at, sphere);
  },
  answer: {
    size: { height: BOARD.height + BOARD.lift + 0.2, half: 0.34 },
    // La caméra de la scénette part en biais (`site.start`) : la planche se tourne avec elle, sous la rangée.
    facing: true,
    // La planche à relevés sur deux tréteaux, sous la rangée des galets.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BOARD.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.7 * s], C.newShade, C.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.12, top - 0.08 * s - foot, 0.6 * s], C.newShade);
      }
    },
    // Un galet posé sur la planche ; choisi, il se soulève d'un cran (sa place le dit, jamais sa couleur seule).
    object(b, at, s, _i, _count, picked) {
      pebble(b, { x: at.x, y: at.y + (BOARD.height + (picked ? BOARD.lift : 0)) * s, z: at.z }, s);
    },
  },
  // Les trois missions en R : la dalle seule, rien de l'item ; les galets portent les réponses.
  rest() {},
  traces: {
    'active-earth': { at: TRACE_SPOTS['active-earth'], lift: 1.2, stage: 0, draw: probes },
    'weather-climate': { at: TRACE_SPOTS['weather-climate'], lift: 1, stage: 1, draw: rainGauge },
    'human-impact': { at: TRACE_SPOTS['human-impact'], lift: 1, stage: 2, draw: sprout },
  },
  // Kéo au retour : sur le chemin, à l'est de la porte, face aux bouches.
  exit: { x: 3.4, z: 8.6 },
  // Les sondes, le récipient de pluie et la pousse restent dans le cadre de la scénette (intention, § 9) : elle ne dessine
  // aucune réussite à leur place.
  keepsTracesInScenette: true,
};

/** Le haut du mât, au-dessus du sol du lieu (sous les aiguilles, bien sous la Montée). */
export const FUMEROLLES_MAST_TOP = MAST.h;

/** Les trois bouches (leur axe, leur rayon, leur hauteur) et le haut de leur panache, au-dessus du sol du lieu. */
export const FUMEROLLES_VENTS: readonly { x: number; z: number; r: number; h: number; plume: number }[] = VENTS.map((v, i) => ({ ...v, plume: PLUMES[i].top }));

/** Le chemin de dalles (sa ligne, sa largeur) : il garde ses distances avec les bouches. */
export const FUMEROLLES_PATH = { line: PATH, width: PATH_WIDTH } as const;

/** Les deux sondes, la place du socle, le dessus de la dalle et sa boîte, la cabane : pour vérifier le plan du lieu. */
export const FUMEROLLES_LAYOUT = {
  probes: PROBES,
  socle: { x: SOCLE.x, z: SOCLE.z, r: SOCLE.r },
  dalle: DALLE,
  cabin: { x: CABIN.x, z: CABIN.z, w: CABIN.w, d: CABIN.d },
  margelle: { x: MARGELLE.x, z: MARGELLE.z, r: MARGELLE.r },
  mast: { x: MAST.x, z: MAST.z },
  rain: RAIN,
  pot: POT,
  pathLantern: PATH_LANTERN,
} as const;
