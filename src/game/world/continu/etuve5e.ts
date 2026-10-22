// L'Étuve (GD-22, lot 10 ; intention du directeur artistique du 20 octobre 2026, planche de rendu de près validée par
// le mainteneur le même jour) : « un atelier de verre chauffé par la vapeur des sources, où l'on chauffe, refroidit,
// dose, pèse, et où l'on polit une lentille pour regarder le ciel ». Le cœur, sans figure, est l'atelier : le four à
// calotte basse sur son socle carré plein (ni bouche, ni porte, ni cheminée, ni feu : la rigole qui arrive du nord-ouest,
// d'où sont les Fumerolles, dit qu'elles le chauffent), l'établi aux fioles et aux cornues, la balance à un plateau et la
// grande lentille sur son chevalet. Autour, le regard de captage et la rigole sur ses piles, le chalet du souffleur
// accolé au flanc est du socle, le parvis à l'ouest et ses deux bassins devant. Le pavé de pierre grise (C1) part de la
// porte, au sud, jusqu'à la face du four : c'est le seul sol du lieu, celui de la scénette.
//
// La ruine : tout est là, tombé ou cassé, jamais un chantier. La calotte fendue, sa moitié nord affaissée à plat sur le
// socle, sa moitié sud tombée en trois blocs au pied ; la rigole brisée au milieu, deux tronçons couchés dans l'axe, et
// le filet de vapeur qui sort du bout cassé ; le chalet aux murs gris, la moitié de son toit affaissée ; sur l'établi,
// deux fioles couchées, une cornue brisée, la balance couchée, les éclats au pied ; la lentille couchée sur le parvis en
// trois éclats, ses montants à côté ; les bassins vides ; quelques dalles soulevées. La lanterne du souffleur, sur sa
// perche près de la porte du chalet, brille dès la ruine : la seule lumière, fixe. Le creux du soufflet (C2 : un trou rond
// et quatre goujons, en bas de la face sud, à l'angle ouest) reste nu, avant comme après.
// Le corps : la calotte entière et ses trois évents, la rigole entière, la vapeur passe aux évents ; puis les murs neufs
// du chalet et l'établi vidé. Le haut : le toit de bardeaux et la lanterne du pignon ; puis les fioles, les cornues et la
// balance. Les abords : le pavé neuf, le parvis, le chevalet et la lentille inclinée ; puis les bassins pleins, la
// lanterne du parvis et deux rochers ocre. Une trace par mission, chacune avec l'étape qu'elle pose (`stage`) : le baquet
// cerclé (le corps), le mortier et son pilon (le haut), le polissoir (les abords). Rien ne bouge, rien à lire dans la 3D.
// Code pur (placeArt.ts).
import type { Stage } from './construction';
import { FacetBuilder, placeFacets } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { lowRock } from './monteeSurroundings';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_5E } from './plan5e';
import { tuft, type RockTones } from './surroundingsKit';
import { standingHeight } from './terrain';
import { FOREST_COLORS, heightAt5e } from './terrain5e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter sur une pente (places.ts). */
const SINK = -0.8;

/**
 * Les couleurs de l'Étuve : les matières des Passeurs (la pierre grise du plateau, le bois brun désaturé, le fer gris, le
 * bronze en ferrures, le vert-de-gris du motif des racines), plus le verre mat en deux tons, propre au lieu. Le pavé, le
 * socle et la calotte descendent d'un cran chacun ; la calotte est gris moyen, jamais presque noire. La seule lumière,
 * l'ocre de la lanterne ; le verre n'est jamais ocre, jamais blanc.
 */
const C = {
  // Le pavé et le parvis (C1), un cran plus clairs que le socle.
  pave: COLORS_5E.stoneSun,
  paveAlt: 0xa5a89b,
  paveSide: 0x969a8f,
  // Le socle du four, en grands blocs de deux tons ; son rebord de dalles.
  socle: COLORS_5E.stone,
  socleAlt: 0x868b83,
  // La calotte, pierre fumée gris moyen, ses faces au soleil un cran plus claires ; son dedans (la ruine ouverte), jamais
  // plus sombre que la calotte à l’écran (ses faces regardent le sol : un ton clair qui sort au gris de la calotte).
  dome: COLORS_5E.stoneShade,
  domeSun: 0x848a83,
  domeInside: 0xaeb2a9,
  // Le creux du soufflet et les évents : le brun très sombre de la bouche du Hameau.
  hole: 0x3a312c,
  iron: 0x6f6a60,
  bronze: 0xb8954f,
  lantern: COLORS_5E.lantern,
  glassOff: 0xbfc4b8,
  newWood: 0xa68672,
  newShade: 0x8c766a,
  wornWood: 0x9f9279,
  wornShade: 0x86775f,
  // Le toit de bardeaux, plus sombre que les murs ; la porte du chalet.
  roof: 0x7d6650,
  roofShade: 0x6f5a47,
  door: 0x6e5a4a,
  verdigris: 0x6f9a8a,
  rope: 0xd8c49a,
  // Le verre mat : les fioles et les cornues vert d'eau pâle, la lentille plus claire, les éclats et les gobelets bleu fumé.
  glass: 0xa9c9be,
  glassShade: 0x97b8ad,
  lens: 0xc9ded6,
  smoky: 0x7f9cb0,
  smokyInside: 0x6b879b,
  // L'eau calme et mate des bassins et du baquet, sombre comme le bord des rives.
  water: COLORS_5E.waterShallow,
  // La vapeur : les bouffées de la fumée du Hameau, du blanc de la brume, plus clair que la pierre (jamais un galet).
  steam: 0xe5ebe3,
  steamShade: 0xd3d9d1,
  // Le sable du polissoir, plus clair que le sol ocre.
  sand: 0xd8c49a,
  // Le souffleur de verre, en pion (son modèle 3D prend sa place, ./habitants.ts), dans les couleurs de son modèle :
  // chemise corail, tablier de cuir brun, pantalon bleu nuit, bottes grises, bonnet.
  shirt: 0xe0705a,
  apron: 0x74482e,
  apronShade: 0x5e3a26,
  trousers: 0x2f3f5a,
  boots: 0x55595a,
  head: 0xe3b48a,
  cap: 0x7a4a4a,
} as const;

/** Les rochers ocre des Contreforts : l'ocre du sol, son ombre, son dessus clair. */
export const OCHRE_ROCK: RockTones = { light: COLORS_5E.ochre, shade: 0x9c8656, top: 0xc4ad7a };

/** Le pavé (C1) : de la face sud du four jusqu'à la porte, sa demi-largeur, ses rangées de dalles (deux par rangée). */
const PAVE = { half: 3.2, from: 0.1, to: 7.4, rows: 4, joint: 0.08 } as const;

/** Le socle carré du four : son centre, son côté, sa hauteur (deux assises), son rebord de dalles. */
const SOCLE = { x: 0, z: -2.5, side: 5, h: 2, rim: 0.22 } as const;

/** La face sud du socle. */
const FRONT_Z = SOCLE.z + SOCLE.side / 2;

/**
 * La calotte, large et basse (haute d'un tiers de sa largeur), posée sur le rebord : ses trois couronnes (rayon,
 * hauteur au-dessus du rebord), décalées d'un demi-pan, et son sommet.
 */
const DOME = { sides: 10, rings: [[2.55, 0], [2.2, 0.85], [1.25, 1.45]] as const, top: 1.7 } as const;

/** Le pied de la calotte : le dessus du rebord. */
const DOME_BASE = SOCLE.h + SOCLE.rim;

/** Les trois évents, en triangle serré au sommet : leur rayon, leur écart au centre. */
const VENTS = { r: 0.14, spread: 0.42 } as const;

/** Le creux du soufflet (C2), en bas de la face sud, à son extrémité ouest : son centre, son rayon, ses goujons. */
const HOLLOW = { x: -1.75, y: 0.6, r: 0.3, stud: 0.44 } as const;

/** Le chalet du souffleur : accolé au flanc est du socle, sa façade (pignon et porte au sud) un pas devant le four. */
const CHALET = { x: 4.05, z: -0.3, w: 3, d: 2.6, wall: 2, roof: 1.1 } as const;

/** La façade du chalet. */
const CHALET_FRONT = CHALET.z + CHALET.d / 2;

/** L'établi : un long plateau de pierre sur deux piles, devant la façade du chalet, sur le bord est du pavé. */
const BENCH = { x: 4.25, z: 2.35, len: 2.4, depth: 0.7, top: 0.82 } as const;

/** Le regard de captage, au coin nord-ouest, tourné vers les Fumerolles ; le bout de la rigole, au dos du four. */
const DRAIN = { from: { x: -7.4, z: -7.4 }, to: { x: -1, z: -5.35 }, segments: 5, top: 0.85 } as const;

/** Le parvis : une plateforme basse de dalles, à l'ouest du four ; sa hauteur. */
const PARVIS = { x0: -7.3, x1: -3.4, z0: -3.7, z1: 0.5, h: 0.3 } as const;

/**
 * La grande lentille sur son chevalet, au milieu du parvis : son rayon, la hauteur de son centre, son renversement depuis
 * la verticale, son cap (sa face tournée vers le sud-ouest, hors de l'axe de la porte).
 */
const LENS = { x: -5.4, z: -1.8, r: 1, y: 1.25, tilt: (58 * Math.PI) / 180, yaw: -0.6 } as const;

/** Les deux bassins, côte à côte au sud-ouest, à l'ouest du pavé : leur centre, leur largeur (x), leur longueur (z). */
const BASINS = [
  { x: -6.5, z: 3.3 },
  { x: -4.4, z: 3.3 },
] as const;
const BASIN = { w: 1.4, l: 2, h: 0.35, wall: 0.2 } as const;

/** La perche de la lanterne du souffleur, près de la porte du chalet. */
const POLE = { x: 5.85, z: 1.45, h: 1.75 } as const;

/** Le cap d'un pavé dont le grand côté (x) va de `a` vers `b`. */
const yawOf = (a: Vec2, b: Vec2): number => Math.atan2(-(b.z - a.z), b.x - a.x);

/** Un disque plat à `n` pans, de rayon `r`, dans le plan x, y. */
const disc = (r: number, n: number, turn = 0): (readonly [number, number])[] => Array.from({ length: n }, (_, k) => [r * Math.cos(turn + (2 * Math.PI * k) / n), r * Math.sin(turn + (2 * Math.PI * k) / n)] as const);

/**
 * Une lanterne pendue : sa corde, sa vitre (éteinte, ou d'ocre, sans ombre), son chapeau de bronze (celle du Hameau).
 * Trente-six triangles.
 */
function lantern(b: FacetBuilder, at: Vec3, lit: boolean): void {
  const y = at.y - 0.8;
  b.beam(at, { x: at.x, y: y + 0.42, z: at.z }, 0.04, C.rope);
  b.prism({ x: at.x, y, z: at.z }, 0.18, 0.18, 0.42, 6, lit ? C.lantern : C.glassOff);
  b.prism({ x: at.x, y: y + 0.42, z: at.z, yaw: Math.PI / 6 }, 0.26, 0, 0.18, 6, C.bronze);
}

// ---------- Le four ----------

/** Le socle plein, en deux assises de grands blocs de deux tons, décalés d'un bloc ; son rebord de dalles. */
function socle(b: FacetBuilder): void {
  const S = SOCLE;
  const half = S.side / 2;
  // L'assise du bas : deux blocs, l'ouest clair, l'est sombre ; celle du haut : le joint décalé, les tons inversés.
  const courses = [
    { y: SINK, h: 1 - SINK, cut: 0.4, west: C.socle, east: C.socleAlt },
    { y: 1, h: S.h - 1, cut: -0.8, west: C.socleAlt, east: C.socle },
  ];
  for (const k of courses) {
    const wx = k.cut + half;
    b.box({ x: S.x - half + wx / 2, y: k.y, z: S.z }, [wx, k.h, S.side], k.west);
    b.box({ x: S.x + k.cut + (half - k.cut) / 2, y: k.y, z: S.z }, [half - k.cut, k.h, S.side], k.east);
  }
  b.box({ x: S.x, y: S.h, z: S.z }, [S.side + 0.4, S.rim, S.side + 0.4], C.paveSide, C.socle);
}

/** Le creux du soufflet (C2) : un trou rond sombre, peu profond, et quatre goujons de fer courts, en diagonale. */
function hollow(b: FacetBuilder): void {
  const z = FRONT_Z + 0.012;
  b.plate({ x: HOLLOW.x, y: HOLLOW.y, z }, disc(HOLLOW.r, 8, Math.PI / 8), C.hole);
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ] as const) {
    const d = HOLLOW.stud * Math.SQRT1_2;
    b.box({ x: HOLLOW.x + sx * d, y: HOLLOW.y + sy * d - 0.05, z: FRONT_Z + 0.06 }, [0.1, 0.1, 0.12], C.iron);
  }
}

/** Les sommets d'une couronne de la calotte (décalée d'un demi-pan si `k` est impair), aplatie de `squash`. */
function domeRing(k: number, squash: number): [number, number, number][] {
  const [r, y] = DOME.rings[k];
  const shift = k % 2 ? Math.PI / DOME.sides : 0;
  return Array.from({ length: DOME.sides }, (_, i) => {
    const a = (2 * Math.PI * i) / DOME.sides + shift;
    return [SOCLE.x + r * Math.cos(a), DOME_BASE + y * squash, SOCLE.z + r * Math.sin(a)];
  });
}

/**
 * La calotte, en grandes facettes de deux tons : deux bandes entre trois couronnes, puis le sommet (bande 2). Les faces
 * qui regardent le soleil (l'ouest-sud-ouest) prennent le ton clair. `keep` : les facettes gardées, selon le milieu (z)
 * et la bande ; `squash` : la hauteur, aplatie (la moitié nord affaissée de la ruine) ; `inside` : son dessous montré.
 */
function dome(b: FacetBuilder, keep: (z: number, band: number) => boolean = () => true, squash = 1, inside = false): void {
  const n = DOME.sides;
  const rings = [0, 1, 2].map((k) => domeRing(k, squash));
  let band = 0;
  const face = (p: [number, number, number], q: [number, number, number], s: [number, number, number]) => {
    if (!keep((p[2] + q[2] + s[2]) / 3, band)) return;
    const mx = (p[0] + q[0] + s[0]) / 3 - SOCLE.x,
      mz = (p[2] + q[2] + s[2]) / 3 - SOCLE.z;
    b.triangle(p, q, s, mx * -0.91 + mz * 0.41 > 0.3 ? C.domeSun : C.dome);
    if (inside) b.triangle(p, s, q, C.domeInside);
  };
  for (let k = 0; k < 2; k++) {
    band = k;
    const lo = rings[k],
      hi = rings[k + 1];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (k === 0) {
        face(lo[j], lo[i], hi[i]);
        face(hi[i], hi[j], lo[j]);
      } else {
        const p = (i + n - 1) % n;
        face(lo[i], hi[i], hi[j]);
        face(lo[p], hi[i], lo[i]);
      }
    }
  }
  band = 2;
  const top: [number, number, number] = [SOCLE.x, DOME_BASE + DOME.top * squash, SOCLE.z];
  const last = rings[2];
  for (let i = 0; i < n; i++) face(last[(i + 1) % n], last[i], top);
}

/** Les trois évents, au sommet : trois trous ronds en triangle serré, la pointe vers le nord (jamais deux « yeux »). */
const VENT_SPOTS = [0, 1, 2].map((k) => {
  const a = -Math.PI / 2 + (2 * Math.PI * k) / 3;
  return { x: SOCLE.x + VENTS.spread * Math.cos(a), z: SOCLE.z + VENTS.spread * Math.sin(a) };
});

function vents(b: FacetBuilder): void {
  for (const v of VENT_SPOTS) b.plate({ x: v.x, y: DOME_BASE + DOME.top - 0.02, z: v.z, pitch: -Math.PI / 2 }, disc(VENTS.r, 6), C.hole);
}

/**
 * La vapeur, immobile, courte : deux bouffées arrondies, presque droites, la plus large en bas (la fumée du Hameau,
 * `smoke`, en gris chaud). Chaque bouffée, deux troncs de cône à neuf pans dos à dos ; la
 * basse posée sur sa source, sans jour, la haute qui la chevauche, un peu décalée.
 */
const PUFFS = [
  [0.5, 0.55, 0.12],
  [0.36, 0.42, 0.1],
] as const;

function steam(b: FacetBuilder, from: Vec3): void {
  let x = from.x,
    y = from.y;
  PUFFS.forEach(([r, h, drift], i) => {
    const color = i % 2 ? C.steamShade : C.steam;
    b.prism({ x, y, z: from.z }, r * 0.85, r, h / 2, 9, color, C.steam);
    b.prism({ x, y: y + h / 2, z: from.z }, r, r * 0.55, h / 2, 9, color, C.steam);
    x += drift;
    y += h * 0.7;
  });
}

// ---------- La rigole ----------

/** Le point `t` (de 0 au regard à 1 au four) de la rigole, à plat. */
const drainAt = (t: number): Vec2 => ({ x: DRAIN.from.x + (DRAIN.to.x - DRAIN.from.x) * t, z: DRAIN.from.z + (DRAIN.to.z - DRAIN.from.z) * t });

const DRAIN_YAW = yawOf(DRAIN.from, DRAIN.to);
const DRAIN_STEP = Math.hypot(DRAIN.to.x - DRAIN.from.x, DRAIN.to.z - DRAIN.from.z) / DRAIN.segments;

/** Un tronçon de caniveau, son milieu en `m` à la hauteur `y` (son dessus sombre : le creux du caniveau). */
function trough(b: FacetBuilder, m: Vec2, y: number, yaw = DRAIN_YAW, pitch = 0): void {
  b.box({ x: m.x, y, z: m.z, yaw, pitch }, [DRAIN_STEP - 0.06, 0.24, 0.42], C.socle, C.dome);
}

/** Une pile courte sous la rigole, du sol au dessous du caniveau. */
function pier(b: FacetBuilder, p: Vec2, ground: SiteGround): void {
  b.box({ x: p.x, y: ground.at(p.x, p.z) - 0.4, z: p.z, yaw: DRAIN_YAW }, [0.34, DRAIN.top - 0.24 - ground.at(p.x, p.z) + 0.4, 0.34], C.socleAlt, C.socle);
}

/** Le regard de captage : un petit puits carré de pierre grise, à hauteur de genou, fermé d'une dalle. */
function captage(b: FacetBuilder, ground: SiteGround): void {
  const { x, z } = DRAIN.from;
  const g = ground.at(x, z);
  b.box({ x, y: g - 0.4, z, yaw: DRAIN_YAW }, [1.1, 0.95, 1.1], C.socleAlt, C.socle);
  b.box({ x, y: g + 0.55, z, yaw: DRAIN_YAW }, [1.3, 0.14, 1.3], C.paveSide, C.pave);
}

/** La rigole entière : ses tronçons sur leurs piles, du regard au dos du four. */
function drain(b: FacetBuilder, ground: SiteGround, ruined = false): void {
  const y = DRAIN.top - 0.24;
  for (let k = 0; k < DRAIN.segments; k++) {
    if (ruined && (k === 2 || k === 3)) continue;
    trough(b, drainAt((k + 0.5) / DRAIN.segments), y);
  }
  for (let k = 1; k < DRAIN.segments; k++) if (!ruined || k < 3) pier(b, drainAt(k / DRAIN.segments), ground);
}

/** Le bout cassé de la rigole, côté amont, d'où la vapeur s'échappe dans la ruine. */
const BROKEN_END = drainAt(2 / DRAIN.segments);

// ---------- Le chalet ----------

/** Le motif des racines entrelacées en vert-de-gris, une seule fois, sur le linteau de la porte (une onde, sans lettre). */
function lintel(b: FacetBuilder, g: number): void {
  const z = CHALET_FRONT + 0.06;
  b.box({ x: CHALET.x, y: g + 1.38, z: CHALET_FRONT + 0.04 }, [1.1, 0.2, 0.08], C.newShade);
  const wave = [-0.42, -0.14, 0.14, 0.42].map((dx, i) => ({ x: CHALET.x + dx, y: g + 1.48 + (i % 2 ? 0.05 : -0.03), z }));
  for (let i = 0; i < 3; i++) b.beam(wave[i], wave[i + 1], 0.05, C.verdigris);
}

/** Les murs de planches du chalet, sa porte fermée sans fenêtre, son linteau ; `worn` : le bois gris de la ruine. */
function chalet(b: FacetBuilder, ground: SiteGround, worn: boolean): void {
  const g = ground.at(CHALET.x, CHALET.z);
  b.box({ x: CHALET.x, y: g - 0.4, z: CHALET.z }, [CHALET.w, CHALET.wall + 0.4, CHALET.d], worn ? C.wornShade : C.newShade, worn ? C.wornWood : C.newWood);
  // Les longues planches du mur de façade, d'une pièce : deux bandes de ton, sans planche une à une.
  b.plate({ x: CHALET.x, y: g, z: CHALET_FRONT + 0.01 }, [[-CHALET.w / 2, 0], [-0.55, 0], [-0.55, CHALET.wall], [-CHALET.w / 2, CHALET.wall]], worn ? C.wornWood : C.newWood);
  b.plate({ x: CHALET.x, y: g, z: CHALET_FRONT + 0.015 }, [[-0.4, 0], [0.4, 0], [0.4, 1.3], [-0.4, 1.3]], C.door);
  lintel(b, g);
}

/** Le toit à deux pans de bardeaux, en longues facettes, son faîtage nord-sud (le pignon regarde la porte). */
function roof(b: FacetBuilder, ground: SiteGround): void {
  const g = ground.at(CHALET.x, CHALET.z);
  b.gableRoof({ x: CHALET.x, y: g + CHALET.wall, z: CHALET.z, yaw: Math.PI / 2 }, CHALET.d + 0.5, CHALET.w + 0.5, CHALET.roof, C.roof, C.newWood);
  b.beam({ x: CHALET.x, y: g + CHALET.wall + CHALET.roof, z: CHALET.z - CHALET.d / 2 - 0.25 }, { x: CHALET.x, y: g + CHALET.wall + CHALET.roof, z: CHALET_FRONT + 0.25 }, 0.12, C.roofShade);
}

/** Le pignon, sous la pointe du toit, au-dessus de la porte : là où pend sa lanterne, au haut (loin de la perche). */
const GABLE_LANTERN = { x: CHALET.x, dz: 0.45 } as const;

// ---------- L'établi et le verre ----------

/** L'établi : le plateau de pierre sur deux piles. */
function bench(b: FacetBuilder, ground: SiteGround): void {
  const g = ground.at(BENCH.x, BENCH.z);
  for (const dx of [-0.85, 0.85]) b.box({ x: BENCH.x + dx, y: g - 0.4, z: BENCH.z }, [0.42, BENCH.top - 0.14 + 0.4, 0.5], C.socleAlt, C.socle);
  b.box({ x: BENCH.x, y: g + BENCH.top - 0.14, z: BENCH.z }, [BENCH.len, 0.14, BENCH.depth], C.paveSide, C.pave);
}

/** Une fiole debout : un ventre rond (un tronc de cône à six pans, la panse en bas) et un goulot droit. */
function flask(b: FacetBuilder, at: Vec3): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.14, 0.06, 0.2, 6, C.glassShade, C.glass);
  b.prism({ x: at.x, y: at.y + 0.2, z: at.z, yaw: 0.4 }, 0.045, 0.045, 0.16, 4, C.glass);
}

/** Une cornue : une panse ronde et un col courbe, qui part en biais. */
function retort(b: FacetBuilder, at: Vec3, dir: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.15, 0.1, 0.2, 6, C.glassShade, C.glass);
  b.beam({ x: at.x, y: at.y + 0.18, z: at.z }, { x: at.x + dir * 0.3, y: at.y + 0.3, z: at.z + 0.04 }, 0.06, C.glass);
}

/**
 * La balance à un plateau : un pied, un fléau lisse sans entailles ; à un bout un plateau rond pendu (fer gris), à
 * l'autre un contrepoids rond. Ni deux plateaux, ni graduation, ni X.
 */
function balance(b: FacetBuilder, at: Vec3): void {
  const top = at.y + 0.7;
  b.beam({ x: at.x, y: at.y, z: at.z }, { x: at.x, y: top, z: at.z }, 0.06, C.iron);
  b.beam({ x: at.x - 0.36, y: top, z: at.z }, { x: at.x + 0.3, y: top, z: at.z }, 0.05, C.iron);
  b.beam({ x: at.x - 0.34, y: top, z: at.z }, { x: at.x - 0.34, y: at.y + 0.28, z: at.z }, 0.025, C.iron);
  b.prism({ x: at.x - 0.34, y: at.y + 0.24, z: at.z }, 0.17, 0.2, 0.04, 6, C.iron);
  b.prism({ x: at.x + 0.32, y: top - 0.08, z: at.z }, 0.09, 0.09, 0.16, 6, C.iron);
}

/** Les éclats de verre, au pied de l'établi seulement : une dizaine, à plat, en polygones aux angles ouverts. */
const SHARDS = [
  [3.2, 2.85, 0.16, 0],
  [3.6, 2.95, 0.12, 1],
  [4.05, 2.85, 0.15, 0],
  [4.5, 2.95, 0.11, 1],
  [4.95, 2.85, 0.14, 0],
  [5.4, 2.95, 0.12, 1],
  [3.35, 1.55, 0.14, 1],
  [3.9, 1.7, 0.12, 0],
  [4.7, 1.6, 0.15, 1],
  [5.25, 1.75, 0.11, 0],
] as const;

// ---------- Le parvis, la lentille et les bassins ----------

/** Le parvis : deux grandes dalles basses (deux tons), du sol jusqu'à sa hauteur ; `tilt` : la dalle de l'est soulevée d'un cran, un bord levé. */
function parvis(b: FacetBuilder, ground: SiteGround, tilt = 0): void {
  const P = PARVIS;
  const mid = (P.x0 + P.x1) / 2;
  const g = ground.at(mid, (P.z0 + P.z1) / 2);
  const w = (P.x1 - P.x0) / 2 - 0.04;
  b.box({ x: (P.x0 + mid) / 2, y: g - 0.4, z: (P.z0 + P.z1) / 2 }, [w, P.h + 0.4, P.z1 - P.z0], C.paveSide, C.pave);
  b.box({ x: (mid + P.x1) / 2, y: g - 0.4 + tilt * 0.08, z: (P.z0 + P.z1) / 2, pitch: tilt * 0.08 }, [w, P.h + 0.4, P.z1 - P.z0], C.paveSide, C.paveAlt);
}

/** Le dessus du parvis. */
const parvisTop = (ground: SiteGround): number => ground.at((PARVIS.x0 + PARVIS.x1) / 2, (PARVIS.z0 + PARVIS.z1) / 2) + PARVIS.h;

/**
 * La grande lentille sur son chevalet : un disque de verre très pâle serré dans un cadre rond de bois, renversé depuis la
 * verticale, sa face vers le ciel et le sud-ouest (de la porte, une ellipse penchée, jamais un rond plein face à la
 * caméra : la caméra de marche regarde d'en haut, un disque renversé de 45° face à elle s'y lisait comme un miroir rond) ;
 * deux montants droits sur une traverse de pied, deux étais parallèles au sol. Rien de croisé. Dessinée dans son repère
 * (le cadre face au sud), puis tournée (`LENS.yaw`).
 */
function lens(b: FacetBuilder, ground: SiteGround): void {
  const y0 = parvisTop(ground);
  const l = new FacetBuilder();
  const c = { x: 0, y: LENS.y, z: 0 };
  const pitch = -LENS.tilt;
  const n = { y: Math.sin(LENS.tilt), z: Math.cos(LENS.tilt) };
  // Le cadre de bois : un disque à douze pans, épais ; le verre devant et derrière, un peu plus petit.
  const half = 0.06;
  l.extrude({ x: c.x, y: c.y - half * n.y, z: c.z - half * n.z, pitch }, disc(LENS.r + 0.12, 12), 2 * half, C.newShade, C.newWood);
  l.plate({ x: c.x, y: c.y + n.y * (half + 0.012), z: c.z + n.z * (half + 0.012), pitch }, disc(LENS.r, 12), C.lens);
  l.plate({ x: c.x, y: c.y - n.y * (half + 0.012), z: c.z - n.z * (half + 0.012), pitch: pitch + Math.PI }, disc(LENS.r, 12), C.glass);
  // Les deux montants, de part et d'autre, droits, de la traverse au milieu du cadre ; la traverse de pied ; les étais.
  for (const sx of [-1, 1]) {
    const x = sx * (LENS.r + 0.22);
    l.box({ x, y: 0, z: 0 }, [0.14, LENS.y + 0.2, 0.14], C.newShade, C.newWood);
    l.beam({ x, y: c.y, z: 0 }, { x: sx * (LENS.r + 0.1), y: c.y, z: 0 }, 0.1, C.newShade);
  }
  l.box({ x: 0, y: 0, z: 0 }, [2 * (LENS.r + 0.3), 0.14, 0.2], C.newShade, C.newWood);
  b.append(placeFacets(l.build(), { x: LENS.x, y: y0, z: LENS.z, yaw: LENS.yaw }));
}

/** La lentille couchée sur le parvis, fendue en trois grands éclats nets, et ses montants couchés, parallèles. */
function fallenLens(b: FacetBuilder, ground: SiteGround): void {
  const y = parvisTop(ground) + 0.04;
  const ring = disc(LENS.r, 12);
  // Trois éclats : trois secteurs du disque (quatre pans chacun), un peu écartés du centre.
  for (let s = 0; s < 3; s++) {
    const a = (2 * Math.PI * (s + 0.5)) / 3;
    const off = { x: 0.08 * Math.cos(a), z: -0.08 * Math.sin(a) };
    const sector: (readonly [number, number])[] = [[0, 0], ...[0, 1, 2, 3, 4].map((k) => ring[(s * 4 + k) % 12])];
    b.plate({ x: LENS.x + off.x, y, z: LENS.z + off.z + 0.2, pitch: -Math.PI / 2 }, sector, s === 1 ? C.glass : C.lens);
  }
  for (const dz of [1.45, 1.75]) b.box({ x: LENS.x, y: y - 0.04, z: LENS.z + dz - 0.2, yaw: 0 }, [LENS.y + 0.2, 0.12, 0.14], C.wornShade, C.wornWood);
  b.box({ x: LENS.x - 0.1, y: y - 0.04, z: LENS.z - 1.2 }, [2 * (LENS.r + 0.3), 0.12, 0.2], C.wornShade, C.wornWood);
}

/** Un bassin : sa margelle basse de pierre grise, en quatre murets ; `broken` : un coin tombé, le muret plus court. */
function basinWalls(b: FacetBuilder, at: { x: number; z: number }, ground: SiteGround, broken = false): void {
  const B = BASIN;
  const g = ground.at(at.x, at.z);
  const y = g - 0.4;
  const h = B.h + 0.4;
  b.box({ x: at.x - B.w / 2 + B.wall / 2, y, z: at.z }, [B.wall, h, B.l], C.paveSide, C.pave);
  b.box({ x: at.x + B.w / 2 - B.wall / 2, y, z: at.z - (broken ? 0.3 : 0) }, [B.wall, h, B.l - (broken ? 0.6 : 0)], C.paveSide, C.pave);
  for (const s of [-1, 1]) b.box({ x: at.x, y, z: at.z + s * (B.l / 2 - B.wall / 2) }, [B.w - 2 * B.wall, h, B.wall], C.paveSide, C.paveAlt);
}

/** Le fond d'un bassin : vide (la pierre sombre), ou plein d'une eau calme et mate (`level` : sa part de la margelle). */
function basinFill(b: FacetBuilder, at: { x: number; z: number }, ground: SiteGround, color: number, level: number, scale = 1): void {
  const B = BASIN;
  const g = ground.at(at.x, at.z);
  const hw = (B.w / 2 - B.wall) * scale,
    hl = (B.l / 2 - B.wall) * scale;
  b.plate({ x: at.x, y: g + 0.04 + (B.h - 0.08) * level, z: at.z, pitch: -Math.PI / 2 }, [[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]], color);
}

// ---------- Le pavé ----------

/** Les dalles du pavé : deux par rangée, de deux tons, aux joints nets ; `lifted` : les dalles soulevées de la ruine. */
function pave(b: FacetBuilder, ground: SiteGround, lifted: readonly number[] = []): void {
  const P = PAVE;
  const step = (P.to - P.from) / P.rows;
  for (let r = 0; r < P.rows; r++)
    for (const s of [-1, 1]) {
      const i = r * 2 + (s > 0 ? 1 : 0);
      const x = (s * P.half) / 2;
      const z = P.from + step * (r + 0.5);
      const up = lifted.includes(i);
      b.box({ x, y: ground.at(x, z) - 0.3 + (up ? 0.06 : 0), z, yaw: up ? 0.05 : 0, pitch: up ? 0.07 : 0 }, [P.half - P.joint, 0.38, step - P.joint], C.paveSide, (r + i) % 2 ? C.paveAlt : C.pave);
    }
}

/**
 * Les volumes de l'Étuve, de la ruine aux abords (le modèle du lieu). `ground` : le sol sous un point du lieu ; `door` :
 * sa porte, au sud, au bout du chemin des Contreforts.
 */
function model(add: AddPiece, ground: SiteGround, _door: Vec2): void {
  const at = (x: number, z: number) => ground.at(x, z);
  const corps = { stage: 0 as Stage, row: 0 };
  const corpsLate = { stage: 0 as Stage, row: 0.5 };
  const abords = { stage: 2 as Stage, row: 0 };
  const abordsLate = { stage: 2 as Stage, row: 0.5 };

  // Toujours là : le socle plein, son rebord, le creux nu et ses goujons ; le regard de captage ; l'établi ; les margelles
  // des bassins ; la lanterne du souffleur sur sa perche courte, allumée dès la ruine (la seule) ; quelques touffes sèches.
  add('ruine', 0, (b) => {
    socle(b);
    hollow(b);
    captage(b, ground);
    bench(b, ground);
  });
  add('ruine', 0, (b) => {
    const g = at(POLE.x, POLE.z);
    b.box({ x: POLE.x, y: g - 0.4, z: POLE.z }, [0.14, POLE.h + 0.4, 0.14], C.newShade);
    const tip = { x: POLE.x - 0.45, y: g + POLE.h - 0.05, z: POLE.z };
    b.beam({ x: POLE.x, y: tip.y, z: POLE.z }, tip, 0.09, C.newShade);
    lantern(b, tip, true);
    for (const [x, z, i] of [
      [-8.6, 1.6, 0],
      [7.2, -3.6, 1],
      [-2.2, -8.2, 2],
    ] as const)
      tuft(b, { x, y: at(x, z) - 0.02, z }, i + 101, [FOREST_COLORS.shrub, FOREST_COLORS.shrubTop], 1.1);
  });

  // La ruine du four et de la rigole, que le corps relève : la moitié nord de la calotte affaissée à plat sur le socle,
  // son bord cassé en marches (sans pointe), son dessous montré ; la moitié sud en trois blocs au pied du socle, deux à son
  // coin est contre le chalet, un à son pied ouest, jamais au milieu du pavé ; la rigole brisée au milieu, deux tronçons couchés dans l'axe, et la vapeur qui s'échappe du bout cassé.
  add('ruine', 0, (b) => dome(b, (z, band) => (band === 0 ? z < SOCLE.z + 0.5 : band === 1 && z < SOCLE.z - 0.6), 0.35, true), corps);
  add(
    'ruine',
    0,
    (b) => {
      for (const [x, z, s, yaw, pitch] of [
        [1.75, 0.45, 0.75, 0.3, 0.2],
        [2.2, 0.95, 0.6, -0.5, -0.2],
        [-2.95, -0.8, 0.7, 0.9, 0.25],
      ] as const)
        b.box({ x, y: at(x, z) - 0.15, z, yaw, pitch }, [s, s * 0.55, s * 0.8], C.dome, C.domeSun);
    },
    corps,
  );
  add(
    'ruine',
    0,
    (b) => {
      drain(b, ground, true);
      // Les deux tronçons tombés, couchés à plat dans l'axe, parallèles, côte à côte au pied de la brèche.
      for (const [t, side] of [
        [0.5, -0.35],
        [0.62, 0.35],
      ] as const) {
        const m = drainAt(t);
        const nx = Math.sin(DRAIN_YAW),
          nz = Math.cos(DRAIN_YAW);
        trough(b, { x: m.x + nx * side, z: m.z + nz * side }, at(m.x, m.z) - 0.1);
      }
      steam(b, { x: BROKEN_END.x, y: DRAIN.top - 0.05, z: BROKEN_END.z });
    },
    corps,
  );

  // La ruine du chalet et de l'établi, que la seconde moitié du corps relève : les murs de bois gris (la porte fermée, le
  // linteau garde son motif), un pan du toit qui tient, l'autre affaissé à plat sur lui ; sur l'établi, deux fioles couchées,
  // une cornue brisée en deux, la balance couchée au bout ; les éclats au pied de l'établi.
  add(
    'ruine',
    0,
    (b) => {
      chalet(b, ground, true);
      const g = at(CHALET.x, CHALET.z);
      const y = g + CHALET.wall;
      const hw = CHALET.w / 2 + 0.25,
        z0 = CHALET.z - CHALET.d / 2 - 0.25,
        z1 = CHALET_FRONT + 0.25;
      // Le pan de l'est tient ; celui de l'ouest est tombé à plat sur le haut des murs.
      b.quad([CHALET.x, y + CHALET.roof, z1], [CHALET.x + hw, y, z1], [CHALET.x + hw, y, z0], [CHALET.x, y + CHALET.roof, z0], C.roofShade);
      b.triangle([CHALET.x + hw, y, z1], [CHALET.x, y + CHALET.roof, z1], [CHALET.x, y, z1], C.wornWood);
      b.quad([CHALET.x - hw, y + 0.05, z1 - 0.2], [CHALET.x + 0.1, y + 0.3, z1 - 0.1], [CHALET.x + 0.1, y + 0.3, z0 + 0.1], [CHALET.x - hw, y + 0.05, z0 + 0.3], C.roofShade);
      const top = at(BENCH.x, BENCH.z) + BENCH.top;
      for (const [x, yaw] of [
        [BENCH.x - 0.75, 0.3],
        [BENCH.x - 0.3, -0.5],
      ] as const)
        b.prism({ x, y: top + 0.12, z: BENCH.z - 0.1, yaw, pitch: Math.PI / 2 }, 0.12, 0.06, 0.22, 6, C.glassShade, C.glass);
      b.prism({ x: BENCH.x + 0.25, y: top, z: BENCH.z + 0.05 }, 0.14, 0.1, 0.1, 6, C.glassShade, C.glass);
      b.beam({ x: BENCH.x + 0.5, y: top + 0.04, z: BENCH.z - 0.15 }, { x: BENCH.x + 0.8, y: top + 0.04, z: BENCH.z - 0.05 }, 0.06, C.glass);
      // La balance couchée sur le côté, au bout de l'établi : son pied, son fléau, son plateau à plat.
      b.beam({ x: BENCH.x + 1.0, y: top + 0.04, z: BENCH.z - 0.2 }, { x: BENCH.x + 1.0, y: top + 0.04, z: BENCH.z + 0.25 }, 0.06, C.iron);
      b.prism({ x: BENCH.x + 0.75, y: top, z: BENCH.z + 0.15 }, 0.17, 0.2, 0.04, 6, C.iron);
      for (const [x, z, r, k] of SHARDS) b.plate({ x, y: at(x, z) + 0.02, z, pitch: -Math.PI / 2, yaw: x * 2.1 }, disc(r, 5, k * 0.6), k ? C.smoky : C.glass);
    },
    corpsLate,
  );

  // La ruine des abords : la lentille couchée en trois éclats sur le parvis fendu, ses montants à côté ; le pavé aux
  // dalles soulevées ; les bassins vides, un peu d'eau sombre dans l'un, un coin de margelle tombé.
  add(
    'ruine',
    0,
    (b) => {
      parvis(b, ground, 1);
      fallenLens(b, ground);
      pave(b, ground, [3, 4]);
    },
    abords,
  );
  add(
    'ruine',
    0,
    (b) => {
      basinWalls(b, BASINS[0], ground);
      basinWalls(b, BASINS[1], ground, true);
      basinFill(b, BASINS[0], ground, C.paveSide, 0);
      basinFill(b, BASINS[1], ground, C.paveSide, 0);
      basinFill(b, BASINS[0], ground, C.water, 0.12, 0.5);
      const B = BASIN;
      const g = at(BASINS[1].x, BASINS[1].z);
      b.box({ x: BASINS[1].x + B.w / 2 + 0.25, y: g - 0.1, z: BASINS[1].z + B.l / 2 - 0.2, yaw: 0.5, pitch: 0.2 }, [0.4, 0.3, 0.5], C.paveSide, C.pave);
    },
    abordsLate,
  );

  // Le corps : la calotte entière et ses trois évents, la rigole entière sur ses piles, la vapeur qui sort des évents ;
  // puis les murs neufs du chalet, sa porte et son linteau, l'établi vidé.
  add(0, 0, (b) => {
    dome(b);
    vents(b);
    drain(b, ground);
    steam(b, { x: SOCLE.x, y: DOME_BASE + DOME.top - 0.05, z: SOCLE.z });
  });
  add(0, 0.5, (b) => chalet(b, ground, false));
  // Le haut : le toit de bardeaux et la lanterne pendue au pignon, allumée dès qu'elle est posée (jamais à une réussite) ;
  // puis, sur l'établi, trois fioles debout, deux cornues et la balance à son bout droit.
  add(1, 0, (b) => {
    roof(b, ground);
    const g = at(CHALET.x, CHALET.z);
    const arm = { x: GABLE_LANTERN.x, y: g + CHALET.wall - 0.05, z: CHALET_FRONT + GABLE_LANTERN.dz };
    b.beam({ x: arm.x, y: arm.y, z: CHALET_FRONT }, arm, 0.08, C.newShade);
    lantern(b, arm, true);
  });
  add(1, 0.5, (b) => {
    const top = at(BENCH.x, BENCH.z) + BENCH.top;
    for (const dx of [-0.45, -0.15, 0.15]) flask(b, { x: BENCH.x + dx, y: top, z: BENCH.z - 0.08 });
    retort(b, { x: BENCH.x + 0.45, y: top, z: BENCH.z + 0.1 }, -1);
    retort(b, { x: BENCH.x - 0.35, y: top, z: BENCH.z + 0.18 }, 1);
    balance(b, { x: BENCH.x + 0.95, y: top, z: BENCH.z });
  });
  // Les abords : le pavé neuf, le parvis, le chevalet et la grande lentille inclinée (le dernier geste du lieu) ; puis les
  // deux bassins pleins, la lanterne sur piquet au coin sud-ouest du parvis, deux rochers ocre bas au bord ouest.
  add(2, 0, (b) => {
    pave(b, ground);
    parvis(b, ground);
    lens(b, ground);
  });
  add(2, 0.5, (b) => {
    for (const s of BASINS) {
      basinWalls(b, s, ground);
      basinFill(b, s, ground, C.water, 0.85);
    }
    const x = PARVIS.x0 + 0.25,
      z = PARVIS.z1 - 0.25;
    const y = parvisTop(ground);
    b.box({ x, y: y - 0.05, z }, [0.13, 1.45, 0.13], C.newShade);
    b.box({ x, y: y + 1.4, z }, [0.28, 0.32, 0.28], C.lantern);
    b.prism({ x, y: y + 1.72, z, yaw: Math.PI / 4 }, 0.24, 0, 0.2, 4, C.bronze);
    for (const [rx, rz, r, seed] of [
      [-8.3, -2.6, 0.75, 3],
      [-8.1, -0.2, 0.55, 7],
    ] as const)
      lowRock(b, { x: rx, y: at(rx, rz), z: rz }, r, r * 0.5, seed, OCHRE_ROCK);
  });
}

// ---------- Les traces ----------

/** Le sol d'un point du lieu, depuis son centre posé au sol (`c`), dans le monde. */
const groundNear = (c: Vec3, lx: number, lz: number): number => standingHeight(heightAt5e({ x: c.x + lx, z: c.z + lz })) - c.y;

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

/**
 * Le baquet (États et molécules) : un baquet de bois rond, cerclé de deux bandes de fer gris, plein d'une eau calme ;
 * haut comme une hanche, large comme un panier, debout contre la face sud du socle, côté est, entre le creux et
 * l'établi (jamais devant le creux).
 */
const TUB = { x: 1.25, z: FRONT_Z + 0.6, r: 0.48, h: 0.78 } as const;

function tub(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const g = groundNear(c, TUB.x, TUB.z);
    l.prism({ x: TUB.x, y: g - 0.1, z: TUB.z }, TUB.r * 0.9, TUB.r, TUB.h + 0.1, 8, C.newWood, C.water);
    for (const y of [0.18, 0.58]) l.band({ x: TUB.x, y: g + y, z: TUB.z }, TUB.r * (0.92 + y * 0.1) + 0.02, 0.08, 8, C.iron);
  });
}

/** Le mortier de pierre grise (Mélanges, masse et volume), large comme un panier, son pilon de bois debout dedans, au bout gauche de l'établi. */
const MORTAR = { x: BENCH.x - 0.95, z: BENCH.z } as const;

function mortar(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const y = groundNear(c, BENCH.x, BENCH.z) + BENCH.top;
    l.prism({ x: MORTAR.x, y, z: MORTAR.z }, 0.2, 0.27, 0.26, 7, C.socle, C.socleAlt);
    l.beam({ x: MORTAR.x, y: y + 0.12, z: MORTAR.z }, { x: MORTAR.x + 0.08, y: y + 0.62, z: MORTAR.z - 0.04 }, 0.08, C.newWood);
  });
}

/**
 * Le polissoir (L'Univers et ses éléments) : un disque de verre brut, plus petit qu'une assiette, à plat sur un billot
 * rond de bois, et à côté un petit tas de sable fin, pâle ; au coin sud-est du parvis, au pied du chevalet.
 */
const POLISHER = { x: PARVIS.x1 - 0.55, z: PARVIS.z1 - 0.6 } as const;

function polisher(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const P = PARVIS;
    const y = groundNear(c, (P.x0 + P.x1) / 2, (P.z0 + P.z1) / 2) + P.h;
    l.prism({ x: POLISHER.x, y, z: POLISHER.z }, 0.3, 0.3, 0.42, 7, C.newShade, C.newWood);
    l.prism({ x: POLISHER.x, y: y + 0.42, z: POLISHER.z }, 0.2, 0.2, 0.05, 8, C.glassShade, C.glass);
    l.prism({ x: POLISHER.x - 0.6, y, z: POLISHER.z + 0.05 }, 0.26, 0, 0.18, 6, C.sand);
  });
}

// ---------- La scénette ----------

/** Le plancher de la scène, sur le pavé devant l'établi : sa demi-largeur, sa profondeur, sa hauteur. */
const SCENE_FLOOR = { half: 4.2, depth: 2.2, rise: 0.2 } as const;

/** Le milieu de la scène, depuis le centre du lieu : sur le pavé, le four à gauche derrière, l'établi et le chalet à droite. */
const SCENE_SPOT = { dx: 2.5, dz: 4.1 } as const;

/** Le plancher de la scène : des dalles de pierre grise sur une assise basse, jusqu'au sol. */
function sceneFloor(b: FacetBuilder, floor: Vec3): void {
  const F = SCENE_FLOOR;
  const g = Math.min(standingHeight(heightAt5e({ x: floor.x, z: floor.z })), floor.y - 0.3);
  b.box({ x: floor.x, y: g - 0.4, z: floor.z }, [2 * F.half, floor.y - 0.12 - g + 0.4, F.depth], C.paveSide, C.paveSide);
  const n = 4;
  for (let k = 0; k < n; k++) {
    const x = floor.x - F.half + ((k + 0.5) * 2 * F.half) / n;
    b.box({ x, y: floor.y - 0.14, z: floor.z }, [(2 * F.half) / n - 0.06, 0.14, F.depth - 0.06], C.paveSide, k % 2 ? C.paveAlt : C.pave);
  }
}

/**
 * Le souffleur de verre en pion (son modèle 3D prend sa place, ./habitants.ts), immobile, le visage nu : ses bottes, son
 * pantalon bleu nuit, sa chemise corail, son tablier de cuir, son bonnet ; les bras le long du corps.
 */
function blower(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) {
    b.prism({ x: at.x + side * 0.12, y: at.y, z: at.z }, 0.13, 0.13, 0.2, 6, C.boots);
    b.prism({ x: at.x + side * 0.12, y: at.y + 0.2, z: at.z }, 0.12, 0.12, 0.32, 6, C.trousers);
  }
  b.prism({ x: at.x, y: at.y + 0.5, z: at.z }, 0.28, 0.26, 0.48, 8, C.shirt);
  b.box({ x: at.x, y: at.y + 0.22, z: at.z + 0.24 }, [0.5, 0.72, 0.06], C.apronShade, C.apron);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  b.prism({ x: at.x, y: at.y + 1.24, z: at.z - 0.02 }, 0.21, 0.15, 0.12, 8, C.cap);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.3, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.36, y: at.y + 0.5, z: at.z + 0.05 }, 0.12, C.shirt);
}

/** La planche percée des réponses : la hauteur de ses tréteaux, à l'échelle 1 ; un gobelet choisi se soulève d'un cran. */
const BOARD = { height: 0.55, lift: 0.2 } as const;

/** Un gobelet trapu de verre bleu fumé, sans goulot, dans le trou de la planche (son bord sombre autour). */
function cup(b: FacetBuilder, at: Vec3, s: number, board: number, lifted: boolean): void {
  b.plate({ x: at.x, y: board + 0.006 * s, z: at.z, pitch: -Math.PI / 2 }, disc(0.3 * s, 8), C.hole);
  const y = board + (lifted ? BOARD.lift * s : 0);
  b.prism({ x: at.x, y, z: at.z, yaw: 0.3 }, 0.22 * s, 0.27 * s, 0.34 * s, 7, C.smoky, C.smokyInside);
}

/** Où se pose la trace de chaque mission, depuis le centre du lieu (la caméra du retour en garde la place). */
const TRACE_SPOTS = {
  'changes-of-state': { x: TUB.x, z: TUB.z },
  'mixtures-density': { x: MORTAR.x, z: MORTAR.z },
  'universe-atoms': { x: POLISHER.x, z: POLISHER.z },
} as const;

export const ETUVE: PlaceArt = {
  role: 'Le souffleur de verre',
  model,
  // L'étape la plus basse qui porte une trace : la scénette se joue sur le lieu dès que le corps est posé. Chaque trace a
  // la sienne (`stage`) : elle se montre quand sa mission est réussie et que son étape est posée.
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: [SCENE_FLOOR.half, SCENE_FLOOR.depth / 2], fine: true },
  site: {
    rise: SCENE_FLOOR.rise,
    keo: { dx: -2.3, dz: 0.3, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.3, dz: 0.3 },
    subject: { halfWidth: 3.4, bottom: -0.5, top: 3.2, depth: 0.3 },
    pitch: (14 * Math.PI) / 180,
  },
  decor(b, floor, at, sphere, body = true) {
    sceneFloor(b, floor);
    if (body) blower(b, at, sphere);
  },
  answer: {
    size: { height: BOARD.height + BOARD.lift + 0.34, half: 0.32 },
    // La planche percée sur deux tréteaux, sous la rangée des gobelets.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BOARD.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.7 * s], C.newShade, C.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.12, top - 0.08 * s - foot, 0.6 * s], C.newShade);
      }
    },
    // Un gobelet dans son trou ; choisi, il se soulève d'un cran (sa place le dit, jamais sa couleur seule).
    object(b, at, s, _i, _count, picked) {
      cup(b, at, s, at.y + BOARD.height * s, picked);
    },
  },
  // Les trois missions en R : le plancher seul, rien de l'item ; les gobelets portent les réponses.
  rest() {},
  traces: {
    'changes-of-state': { at: TRACE_SPOTS['changes-of-state'], lift: 1, stage: 0, draw: tub },
    'mixtures-density': { at: TRACE_SPOTS['mixtures-density'], lift: 1.3, stage: 1, draw: mortar },
    'universe-atoms': { at: TRACE_SPOTS['universe-atoms'], lift: 1, stage: 2, draw: polisher },
  },
  // Kéo au retour : sur le chemin, à l'ouest de la porte (le chemin des Contreforts arrive de l'ouest-sud-ouest), face au four.
  exit: { x: -2.4, z: 7.4 },
};

/** Le plus haut de l'Étuve : le sommet de la calotte, au-dessus de son pied (un four bas, pas un dôme haut). */
export const ETUVE_DOME_TOP = DOME_BASE + DOME.top;

/** La calotte : sa largeur et sa hauteur au-dessus du rebord (une calotte basse, haute d'un tiers de sa largeur). */
export const ETUVE_DOME = { width: 2 * DOME.rings[0][0], height: DOME.top } as const;

/** Le creux du soufflet et les évents, pour les tests : le creux loin du milieu de la face, les évents au sommet. */
export const ETUVE_HOLLOW = { x: HOLLOW.x, faceHalf: SOCLE.side / 2 } as const;
export const ETUVE_VENTS = VENT_SPOTS;

/** Le baquet, contre le socle, jamais devant le creux. */
export const ETUVE_TUB = TUB;
