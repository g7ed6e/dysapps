// Le Hameau (GD-22, lot 5 ; intention du directeur artistique du 20 octobre 2026, planche de rendu de près validée par le
// mainteneur) : « un village sur pilotis dans les racines, et un four commun autour duquel on s'organise ». Le cœur, sans
// figure, est le four commun : un tambour bas d'enduit pâle, coiffé d'un dôme de pierre gris-sable à grandes facettes,
// ses blocs visibles (jamais blanc ni lisse), la bouche en arche, la cheminée carrée sur le côté ; le plus large volume
// du lieu. Autour, trois maisons sur pilotis (l'ouest au bord de l'eau, le fond derrière le four, celle du boulanger au
// nord-est, à droite du dôme vue du chemin de la Lisière comme de la porte : retouche 1), deux passerelles de corde entre
// elles, le ponton devant la bouche et son aile sur l'eau.
//
// La ruine : tout est là, tombé ou cassé, jamais un chantier. Le dôme ouvert sur sa moitié ouest, son bord cassé qui
// descend vers l'ouest, sans pointe ; quelques blocs sur les racines et dans l'eau, la bouche presque noire aux gonds nus (la porte de bronze est partie, avant comme après), le moignon de
// cheminée qui penche ; la maison de l'est garde son toit et sa lanterne allumée (le boulanger y vit : la seule lumière
// de la ruine, fixe), celle du fond n'a plus que trois chevrons et ses ardoises au sol, celle de l'ouest penche sur des
// pilotis tordus ; les passerelles coupées pendent, le ponton est cassé, l'enseigne tombée, une barque à moitié coulée.
// Le corps : le tambour fermé de son dôme, la cheminée droite, la braise d'ocre fixe dans la bouche, les trois maisons
// redressées en bois neuf, l'enseigne debout (une miche ronde, sans mot). Le haut : les toits d'ardoise bleue, le mât de
// racine et sa lanterne au-dessus du four, un filet de fumée pâle, d'une seule silhouette qui s'amincit, immobile. Les abords : le ponton neuf et son
// aile, les deux passerelles tendues, la seconde barque à flot, les deux lanternes de la cour. Une trace par mission,
// chacune avec l'étape qu'elle pose (`stage`) : les deux pelles à pain debout (le corps), la guirlande de cinq lanternes
// de trois formes entre ses deux mâts, haut au-dessus du linteau (le haut), la longue table du ponton (les abords). Rien à lire dans la 3D. Code pur (placeArt.ts).
import type { Stage } from './construction';
import { FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { rootArch } from './monteeSurroundings';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_5E } from './plan5e';
import { tuft } from './surroundingsKit';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter sur une pente (places.ts). */
const SINK = -0.8;

/**
 * Les couleurs du Hameau : l'enduit passé des murs (ruins5e.ts), la pierre gris-sable du dôme en blocs de deux tons, le
 * bois neuf brun désaturé de la Lisière et de la Montée (autour de #A87A50 à l'écran), le bois gris de la ruine,
 * l'ardoise bleue #5B7C99, le vert-de-gris du motif des racines ; la seule lumière, l'ocre de la lanterne. La bouche du
 * four est un brun très sombre (retouche 1 : elle se lisait comme une porte de bois fermée), juste au-dessus du seuil
 * « jamais presque noir » du 5e.
 */
const C = {
  wall: 0xb9ae98,
  wallTop: 0xc6bca6,
  dome: 0xaca38f,
  domeShade: 0x968e7c,
  domeLight: 0xbbb29c,
  domeInside: 0x837b6b,
  stone: COLORS_5E.stone,
  stoneSun: COLORS_5E.stoneSun,
  mouth: 0x3a312c,
  lantern: COLORS_5E.lantern,
  newWood: 0xa68672,
  newShade: 0x8c766a,
  wornWood: 0x9f9279,
  wornShade: 0x86775f,
  door: 0x7d6650,
  slate: 0x5b7c99,
  slateWorn: 0x6f8089,
  plank: COLORS_5E.plank,
  plankShade: COLORS_5E.plankShade,
  rope: 0xd8c49a,
  iron: 0x6f6a60,
  bronze: 0xb8954f,
  verdigris: 0x6f9a8a,
  // La fumée : un gris pâle et chaud, court ; jamais le panache sombre et large du Rafiot.
  smoke: 0xc2bdb1,
  smokeShade: 0xaba69b,
  bread: 0xb7804a,
  breadTop: 0xcf9a5e,
  pot: 0xa8643f,
  potShade: 0x8d5434,
  // La pale des pelles à pain, plus claire que le bois neuf : elle se lit de loin contre l'enduit.
  peel: 0xd6bf94,
  // Le dedans des barques, plus sombre que leur flanc : le bord se lit.
  boatInside: 0x6e5a4a,
  log: 0x8a6a4e,
  logEnd: 0xb59a74,
  // Le boulanger, en pion (son modèle 3D prend sa place, ./habitants.ts) : chemise de lin, tablier clair, pantalon brun,
  // bottes grises, béret brun.
  shirt: 0xd8c7a4,
  apron: 0xe6dfcc,
  apronShade: 0xcfc6b0,
  trousers: 0x6b4f3a,
  boots: 0x55595a,
  head: 0xe3b48a,
  cap: 0x6a5240,
} as const;

/** Le four commun, dans le repère du lieu : son centre, le rayon de son tambour (dehors, dedans), la hauteur de son mur. */
const OVEN = { x: 0, z: -3.6, r: 3.7, inner: 3.25, wall: 2, sides: 10 } as const;

/** Le dôme : ses trois couronnes (rayon, hauteur), décalées d'un demi-pan l'une de l'autre, et son sommet. */
const DOME = { rings: [[3.78, 2], [3.2, 3.55], [1.8, 4.75]] as const, top: 5.25 } as const;

/** La façade du tambour qui regarde le sud (le pan centré sur +z) : sa distance au centre. */
const FRONT_Z = OVEN.z + OVEN.r * Math.cos(Math.PI / OVEN.sides);

/** La bouche du four : sa demi-largeur, la hauteur de ses piédroits, celle de son arche. */
const MOUTH = { half: 0.66, jamb: 0.95, top: 1.5 } as const;

/**
 * La cheminée carrée, contre le tambour, derrière le dôme à l'est (comme sur la planche) : sa place, sa largeur, sa
 * hauteur ; son chapeau (0,3) finit sous le sommet du dôme (retouche 1 : au flanc est, devant le dôme vu du chemin de la
 * Lisière, elle le coupait en deux). Dans la ruine, son moignon, court et nettement penché.
 */
const CHIMNEY = { x: 2.9, z: -6.6, w: 0.8, h: 4.75, stump: 1.9, lean: 0.32 } as const;

/** Le mât de racine derrière le four, sa hauteur (sous la canopée), le bout de son bras au-dessus du dôme. */
const MAST = { x: 0, z: -8, top: 7.4, arm: -5.6 } as const;

/** L'échelle de la lanterne du mât : sa vitre plus grande que celle des maisons, la même ocre (retouche 1). */
const MAST_LANTERN = 1.4;

/** Une maison sur pilotis : sa place, son cap, sa largeur (le long du faîtage), sa profondeur, son plancher, son mur. */
interface House {
  x: number;
  z: number;
  yaw: number;
  w: number;
  d: number;
  deck: number;
  wall: number;
}

/**
 * L'ouest, au bord de l'eau (penchée dans la ruine) ; le fond, derrière le four (ses chevrons) ; l'est, le boulanger, au
 * nord-est du four, sa façade vers la cour : vue du chemin de la Lisière, elle se tient à droite du dôme, sans le cacher
 * (retouche 1 ; à l'est de la porte, elle le couvrait).
 */
const HOUSES = {
  west: { x: -8, z: -1, yaw: 0.35, w: 3.2, d: 2.6, deck: 1, wall: 1.8 },
  back: { x: 0.5, z: -11, yaw: 0, w: 3.4, d: 2.6, deck: 1.1, wall: 1.9 },
  east: { x: 7.6, z: -7, yaw: -0.6, w: 3.4, d: 2.8, deck: 1.2, wall: 2 },
} as const satisfies Record<string, House>;

/** Le ponton devant la bouche (sa demi-largeur, ses deux bouts), son aile vers l'eau de l'ouest, la hauteur de leurs planches. */
const PONTOON = { half: 2.2, from: 1.4, to: 7.6, wing: { x0: -9.4, z0: 3.6, z1: 6.2 }, deck: 0.38 } as const;

/** Les barques : celle qui reste à flot dans la ruine, et celle qui coule puis flotte avec les abords. */
const BOATS = { kept: { x: -11, z: 1.8, yaw: 0.4 }, sunk: { x: -11, z: 8, yaw: -0.3 } } as const;

/** Un point du repère d'une maison (`lx` le long du faîtage, `lz` vers sa façade), dans le repère du lieu. */
function inHouse(h: House, lx: number, lz: number): Vec2 {
  const c = Math.cos(h.yaw),
    s = Math.sin(h.yaw);
  return { x: h.x + lx * c + lz * s, z: h.z - lx * s + lz * c };
}

/** Le bas d'un pieu en un point : sous l'eau s'il y en a, sinon enfoncé dans le sol. */
const pileFoot = (ground: SiteGround, p: Vec2): number => Math.min(ground.at(p.x, p.z), ground.water) - 0.35;

/** Le cap d'un pavé dont le grand côté (x) va de `a` vers `b`. */
const yawOf = (a: Vec2, b: Vec2): number => Math.atan2(-(b.z - a.z), b.x - a.x);

/**
 * Une maison debout : ses quatre pieux droits, son plancher, ses murs d'enduit, sa porte sur la façade ; `worn` : le bois
 * gris de la ruine. Le toit vient à part (`roof`).
 */
function house(b: FacetBuilder, h: House, ground: SiteGround, worn = false): void {
  const post = worn ? C.wornShade : C.newShade;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const p = inHouse(h, sx * (h.w / 2 - 0.15), sz * (h.d / 2 - 0.15));
      const foot = pileFoot(ground, p);
      b.box({ x: p.x, y: foot, z: p.z, yaw: h.yaw }, [0.22, h.deck - foot, 0.22], post);
    }
  b.box({ x: h.x, y: h.deck - 0.18, z: h.z, yaw: h.yaw }, [h.w + 0.5, 0.18, h.d + 0.5], worn ? C.wornShade : C.plankShade, worn ? C.wornWood : C.plank);
  b.box({ x: h.x, y: h.deck, z: h.z, yaw: h.yaw }, [h.w, h.wall, h.d], C.wall, C.wallTop);
  const door = inHouse(h, 0, h.d / 2 + 0.012);
  b.plate({ x: door.x, y: h.deck, z: door.z, yaw: h.yaw }, [[-0.36, 0], [0.36, 0], [0.36, 1.15], [-0.36, 1.15]], C.door);
}

/** Le toit d'ardoise d'une maison, son faîtage le long de sa largeur, ses pignons d'enduit. */
function roof(b: FacetBuilder, h: House, color: number = C.slate): void {
  b.gableRoof({ x: h.x, y: h.deck + h.wall, z: h.z, yaw: h.yaw }, h.w + 0.55, h.d + 0.6, 1.15, color, C.wall);
}

/** Le haut d'un coin du mur d'une maison (`sx`, `sz` : ±1), là où s'accroche une corde. */
const wallCorner = (h: House, sx: number, sz: number): Vec3 => {
  const p = inHouse(h, (sx * h.w) / 2, (sz * h.d) / 2);
  return { x: p.x, y: h.deck + h.wall - 0.1, z: p.z };
};

/** Le bord du plancher d'une maison du côté d'un point : là où part une passerelle. */
function deckEdge(h: House, toward: Vec2): Vec3 {
  const dx = toward.x - h.x,
    dz = toward.z - h.z;
  const l = Math.hypot(dx, dz) || 1;
  const r = Math.min(h.w, h.d) / 2 + 0.25;
  return { x: h.x + (dx / l) * r, y: h.deck, z: h.z + (dz / l) * r };
}

/** Une passerelle de corde tendue entre deux planchers : son tablier de planches, ses deux mains courantes. */
function walkway(b: FacetBuilder, a: Vec3, c: Vec3): void {
  const len = Math.hypot(c.x - a.x, c.z - a.z);
  const yaw = yawOf(a, c);
  b.box({ x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 - 0.1, z: (a.z + c.z) / 2, yaw }, [len, 0.1, 0.75], C.plankShade, C.plank);
  const nx = -(c.z - a.z) / len,
    nz = (c.x - a.x) / len;
  for (const s of [-0.38, 0.38]) b.beam({ x: a.x + nx * s, y: a.y + 0.85, z: a.z + nz * s }, { x: c.x + nx * s, y: c.y + 0.85, z: c.z + nz * s }, 0.05, C.rope);
}

/** Une passerelle coupée : le tablier qui pend d'un plancher jusque dans l'eau (ou au sol), sa corde, un moignon en face. */
function cutWalkway(b: FacetBuilder, a: Vec3, c: Vec3, ground: SiteGround): void {
  const mid = { x: a.x + (c.x - a.x) * 0.38, z: a.z + (c.z - a.z) * 0.38 };
  const low = Math.max(ground.water, ground.at(mid.x, mid.z)) - 0.1;
  b.beam(a, { x: mid.x, y: low, z: mid.z }, 0.42, C.wornWood);
  b.beam({ x: a.x, y: a.y + 0.85, z: a.z }, { x: mid.x + 0.3, y: low + 0.2, z: mid.z }, 0.05, C.rope);
  b.beam(c, { x: c.x + (a.x - c.x) * 0.14, y: c.y - 0.35, z: c.z + (a.z - c.z) * 0.14 }, 0.42, C.wornWood);
}

/**
 * Une lanterne pendue : sa corde, sa vitre (éteinte, ou d'ocre, sans ombre), son chapeau de bronze, à l'échelle `s`
 * (celle du mât, plus grande : retouche 1). Vingt-quatre triangles.
 */
function lantern(b: FacetBuilder, at: Vec3, lit: boolean, s = 1): void {
  const y = at.y - 0.38 - 0.42 * s;
  b.beam(at, { x: at.x, y: y + 0.42 * s, z: at.z }, 0.04, C.rope);
  b.prism({ x: at.x, y, z: at.z }, 0.18 * s, 0.18 * s, 0.42 * s, 6, lit ? C.lantern : 0xbfc4b8);
  b.prism({ x: at.x, y: y + 0.42 * s, z: at.z, yaw: Math.PI / 6 }, 0.26 * s, 0, 0.18 * s, 6, C.bronze);
}

/**
 * Une barque plate : sa coque en profil, la proue relevée haut au-dessus de l'eau, épaissie en travers ; son dessus,
 * le dedans de la coque, d'un brun sombre, et le flanc clair : le bord se lit comme un bord (retouche 2), au même coût.
 * Et un banc. `sunk` : à moitié coulée.
 */
const HULL: readonly (readonly [number, number])[] = [
  [-1.05, 0],
  [0.85, 0],
  [1.55, 0.78],
  [-1.3, 0.5],
];

function boat(b: FacetBuilder, at: { x: number; z: number; yaw: number }, water: number, sunk = false): void {
  const y = water - 0.2;
  if (sunk) {
    b.extrude({ x: at.x, y: y - 0.25, z: at.z + 0.45, yaw: at.yaw, pitch: 0.12 }, HULL, 0.9, C.boatInside, C.wornWood);
    return;
  }
  b.extrude({ x: at.x, y, z: at.z + 0.45 * Math.cos(at.yaw), yaw: at.yaw }, HULL, 0.9, C.boatInside, C.newWood);
  b.box({ x: at.x, y: y + 0.36, z: at.z, yaw: at.yaw }, [0.32, 0.18, 0.8], C.plank);
}

/** Les quatre pieux d'un rectangle du ponton, du fond (l'eau ou le sol) au dessous des planches. */
function piles(b: FacetBuilder, ground: SiteGround, x0: number, x1: number, z0: number, z1: number, color: number): void {
  for (const x of [x0, x1])
    for (const z of [z0, z1]) {
      const foot = pileFoot(ground, { x, z });
      b.box({ x, y: foot, z }, [0.2, PONTOON.deck - 0.1 - foot, 0.2], color);
    }
}

/** Le tambour du four : un mur rond d'enduit, épais (on voit son dedans par le dôme ouvert), son dessus en couronne. */
function drum(b: FacetBuilder): void {
  b.annulus({ x: OVEN.x, y: SINK, z: OVEN.z }, OVEN.inner, OVEN.r, OVEN.wall - SINK, OVEN.sides, C.wall, C.wallTop);
}

/** Les sommets d'une couronne du dôme (décalée d'un demi-pan si `k` est impair). */
function domeRing(k: number): [number, number, number][] {
  const [r, y] = DOME.rings[k];
  const shift = k % 2 ? Math.PI / OVEN.sides : 0;
  return Array.from({ length: OVEN.sides }, (_, i) => {
    const a = (2 * Math.PI * i) / OVEN.sides + shift;
    return [OVEN.x + r * Math.cos(a), y, OVEN.z + r * Math.sin(a)];
  });
}

/**
 * Le dôme de pierre, en grandes facettes de deux tons (ses blocs) : deux bandes de triangles entre trois couronnes, puis
 * le sommet (bande 2). `keep` : les facettes gardées, selon leur milieu et leur bande (la ruine garde la moitié est, ses
 * dessous montrés : on la voit par l'ouest).
 */
function dome(b: FacetBuilder, keep: (x: number, band: number) => boolean = () => true, inside = false): void {
  const n = OVEN.sides;
  const rings = [0, 1, 2].map(domeRing);
  let band = 0;
  const face = (p: [number, number, number], q: [number, number, number], s: [number, number, number], color: number) => {
    if (!keep((p[0] + q[0] + s[0]) / 3, band)) return;
    b.triangle(p, q, s, color);
    if (inside) b.triangle(p, s, q, C.domeInside);
  };
  for (let k = 0; k < 2; k++) {
    band = k;
    const lo = rings[k],
      hi = rings[k + 1];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      // La couronne du haut est décalée d'un demi-pan : vers l'avant pour la bande impaire, en arrière pour la paire.
      if (k === 0) {
        face(lo[j], lo[i], hi[i], i % 2 ? C.dome : C.domeShade);
        face(hi[i], hi[j], lo[j], i % 2 ? C.domeShade : C.domeLight);
      } else {
        const p = (i + n - 1) % n;
        face(lo[i], hi[i], hi[j], i % 2 ? C.domeShade : C.dome);
        face(lo[p], hi[i], lo[i], i % 2 ? C.domeLight : C.domeShade);
      }
    }
  }
  band = 2;
  const top: [number, number, number] = [OVEN.x, DOME.top, OVEN.z];
  const last = rings[2];
  for (let i = 0; i < n; i++) face(last[(i + 1) % n], last[i], top, i % 2 ? C.dome : C.domeLight);
}

/**
 * La bouche du four, sur la façade sud du tambour : l'arche d'ombre, son linteau de pierre et, dessus, le motif des
 * racines entrelacées en vert-de-gris (une onde, sans lettre ni chiffre), et les deux gonds de fer nus.
 */
function mouth(b: FacetBuilder, ground: SiteGround): void {
  const g = ground.at(0, FRONT_Z);
  const M = MOUTH;
  b.plate({ x: 0, y: g, z: FRONT_Z + 0.015 }, [[-M.half, 0], [M.half, 0], [M.half, M.jamb], [M.half * 0.7, M.top - 0.12], [0, M.top], [-M.half * 0.7, M.top - 0.12], [-M.half, M.jamb]], C.mouth);
  b.box({ x: 0, y: g + M.top + 0.05, z: FRONT_Z + 0.08 }, [1.9, 0.36, 0.3], C.stone, C.stoneSun);
  const z = FRONT_Z + 0.25;
  const wave = [-0.78, -0.26, 0.26, 0.78].map((x, i) => ({ x, y: g + M.top + 0.16 + (i % 2 ? 0.09 : -0.02), z }));
  for (let i = 0; i < 3; i++) b.beam(wave[i], wave[i + 1], 0.07, C.verdigris);
  for (const y of [0.25, 0.75]) b.box({ x: M.half + 0.07, y: g + y, z: FRONT_Z + 0.03 }, [0.12, 0.1, 0.1], C.iron);
}

/** La cheminée carrée, debout, et son chapeau. */
function chimney(b: FacetBuilder): void {
  const K = CHIMNEY;
  b.box({ x: K.x, y: SINK, z: K.z }, [K.w, K.h - SINK, K.w], C.stone, C.stoneSun);
  b.box({ x: K.x, y: K.h, z: K.z }, [K.w + 0.25, 0.3, K.w + 0.25], C.stone, C.stoneSun);
}

/**
 * La fumée, immobile, courte et pâle : deux bouffées arrondies, presque droites au-dessus du chapeau, la plus large en
 * bas (retouche 2 : le tronc de cône penché se lisait comme une corne). Chaque bouffée, deux troncs de cône à sept pans
 * dos à dos, qui s'élargissent puis se referment (rayon au milieu, hauteur, léger glissement vers l'ouest).
 */
const PUFFS = [
  [0.55, 0.6, 0.06],
  [0.38, 0.45, 0.1],
] as const;

function smoke(b: FacetBuilder): void {
  const K = CHIMNEY;
  let x = K.x,
    y = K.h + 0.22;
  PUFFS.forEach(([r, h, drift], i) => {
    const color = i % 2 ? C.smokeShade : C.smoke;
    b.prism({ x, y, z: K.z }, r * 0.6, r, h / 2, 7, color, C.smoke);
    b.prism({ x, y: y + h / 2, z: K.z }, r, r * 0.45, h / 2, 7, color, C.smoke);
    x -= drift;
    y += h * 0.85;
  });
}

/** L'enseigne du four : son poteau, un disque de bois, et la miche ronde peinte dessus (sans mot). */
const SIGN = { x: 3.5, z: 1.6, h: 2.2, r: 0.5 } as const;

/** Un disque à huit pans, épais, face au sud (ou à plat, face au ciel, `lying`). */
const OCTAGON = Array.from({ length: 8 }, (_, k) => [Math.cos((Math.PI * k) / 4 + Math.PI / 8), Math.sin((Math.PI * k) / 4 + Math.PI / 8)] as const);

function signBoard(b: FacetBuilder, at: Vec3, lying: boolean): void {
  const r = SIGN.r;
  const disc = OCTAGON.map(([x, y]) => [x * r, y * r] as const);
  const loaf = [[-0.3, -0.06], [0.3, -0.06], [0.24, 0.1], [0, 0.2], [-0.24, 0.1]] as const;
  if (lying) {
    b.extrude({ x: at.x, y: at.y + 0.08, z: at.z, pitch: -Math.PI / 2 }, disc, 0.08, C.wornShade, C.wornWood);
    b.plate({ x: at.x, y: at.y + 0.09, z: at.z, pitch: -Math.PI / 2 }, loaf, C.bread);
    return;
  }
  b.extrude({ x: at.x, y: at.y, z: at.z - 0.04, yaw: -0.2 }, disc, 0.08, C.newShade, C.newWood);
  const f = { x: at.x + 0.045 * Math.sin(-0.2), z: at.z + 0.045 * Math.cos(-0.2) };
  b.plate({ x: f.x, y: at.y, z: f.z, yaw: -0.2 }, loaf, C.bread);
}

/** Le sol de forêt du lieu : deux racines en arceaux qui cadrent (à l'est du ponton, au fond), quelques touffes de mousse. */
const FLOOR = {
  roots: [
    [9.2, 6.4, 11.2, 3.6, 1.2],
    [-4.2, -9.8, -6.4, -12.6, 1.3],
  ],
  tufts: [
    [4.8, 6.2],
    [-3.2, 8.4],
    [6.4, -5.6],
    [-5.2, -5.2],
    [9.8, -2.4],
  ],
} as const;

/** Les blocs du dôme tombés (la ruine) : sur les racines et la rive de l'ouest, un dans l'eau ; rien sur le chemin. */
const BLOCKS = [
  [-4.7, -0.9, 0.9, 0.4],
  [-5.4, 1.2, 0.75, 1.1],
  [-3.7, 0.8, 0.6, 2.2],
  [-6.9, 2.2, 0.8, 0.7],
  [-2.6, -7.9, 0.7, 1.6],
] as const;

/** Le bois de chauffe empilé, à l'est du four (toujours là). */
const WOOD = { x: 5.7, z: -4.3, yaw: 0.3 } as const;

/** Les pots d'argile cassés de la ruine. */
const POTS = [
  [4.7, 3.4],
  [-4.5, 2.4],
] as const;

/**
 * Les volumes du Hameau, de la ruine aux abords (le modèle du lieu). `ground` : le sol sous un point du lieu (`water` :
 * le niveau de l'eau) ; `door` : sa porte, au sud, sur le chemin.
 */
function model(add: AddPiece, ground: SiteGround, _door: Vec2): void {
  const at = (x: number, z: number) => ground.at(x, z);
  const H = HOUSES;
  // Toujours là : le sol de forêt, le tambour, la bouche et son linteau, le bois de chauffe, la barque à flot, et la
  // lanterne du boulanger, allumée dès la ruine (la seule), pendue à sa potence au coin de sa maison.
  add('ruine', 0, (b) => {
    for (const [x0, z0, x1, z1, h] of FLOOR.roots) rootArch(b, { x: x0, z: z0 }, { x: x1, z: z1 }, h, 0.32, at);
    FLOOR.tufts.forEach(([x, z], i) => tuft(b, { x, y: at(x, z) - 0.02, z }, i + 61, [COLORS_5E.mossSun, COLORS_5E.plateauMoss], 1.2));
  });
  add('ruine', 0, (b) => {
    drum(b);
    mouth(b, ground);
  });
  add('ruine', 0, (b) => {
    const g = at(WOOD.x, WOOD.z);
    for (const [dx, dy, dz] of [
      [0, 0.18, -0.2],
      [0, 0.18, 0.2],
      [0.05, 0.5, 0],
    ])
      b.prism({ x: WOOD.x + dx, y: g + dy, z: WOOD.z + dz - 0.7, yaw: WOOD.yaw, pitch: Math.PI / 2 }, 0.18, 0.18, 1.4, 5, C.log, C.logEnd);
  });
  add('ruine', 0, (b) => boat(b, BOATS.kept, ground.water));
  add('ruine', 0, (b) => {
    const corner = wallCorner(H.east, -1, 1);
    const tip = { x: corner.x - 0.55, y: corner.y - 0.15, z: corner.z + 0.35 };
    b.beam({ ...corner, y: corner.y - 0.15 }, tip, 0.1, C.newShade);
    lantern(b, tip, true);
  });

  // La ruine du four : la moitié est du dôme (on voit son dessous par la brèche), le moignon de cheminée qui penche, les
  // blocs tombés, l'enseigne couchée face au ciel. Le corps les relève.
  const corps = { stage: 0 as Stage, row: 0 };
  // Le dôme ouvert, sans pointe (retouche 1 : la moitié est, coupée droit, se dressait comme une corne) : plus de sommet,
  // la bande haute seulement à l'est, la bande basse qui va plus loin vers l'ouest ; le bord cassé descend en marches.
  add('ruine', 0, (b) => dome(b, (x, band) => (band === 0 ? x > OVEN.x - 1.9 : band === 1 && x > OVEN.x + 1), true), corps);
  add(
    'ruine',
    0,
    (b) => b.box({ x: CHIMNEY.x + 0.25, y: SINK, z: CHIMNEY.z, pitch: CHIMNEY.lean, yaw: 0.2 }, [CHIMNEY.w, CHIMNEY.stump - SINK, CHIMNEY.w], C.stone, C.stoneSun),
    corps,
  );
  add(
    'ruine',
    0,
    (b) => {
      BLOCKS.forEach(([x, z, s, yaw], i) => b.box({ x, y: Math.max(at(x, z), ground.water - 0.3) - 0.25, z, yaw, pitch: 0.2 * (i % 2) }, [s, s * 0.6 + 0.25, s * 0.85], C.domeShade, C.dome));
      signBoard(b, { x: SIGN.x + 0.3, y: at(SIGN.x + 0.3, SIGN.z + 0.9), z: SIGN.z + 0.9 }, true);
    },
    corps,
  );
  // Les maisons de la ruine : à l'est, debout, son bois gris (son toit reste jusqu'au haut) ; au fond, ses murs bas et
  // trois chevrons, ses ardoises au sol ; à l'ouest, penchée sur ses pilotis tordus.
  add('ruine', 0, (b) => house(b, H.east, ground, true), corps);
  add('ruine', 0, (b) => roof(b, H.east, C.slateWorn), { stage: 1, row: 0 });
  add(
    'ruine',
    0,
    (b) => {
      const h = { ...H.back, wall: 1.2 };
      house(b, h, ground, true);
      for (const lx of [-1.2, 0.1, 1.3]) {
        const a = inHouse(h, lx, h.d / 2 + 0.2),
          c = inHouse(h, lx + 0.1, 0);
        b.beam({ x: a.x, y: h.deck + h.wall, z: a.z }, { x: c.x, y: h.deck + h.wall + (lx === 0.1 ? 0.7 : 1.05), z: c.z }, 0.14, C.wornShade);
      }
      for (const [lx, lz, yaw] of [
        [-1.4, 2.4, 0.5],
        [0.6, 2.9, -0.4],
        [1.9, 2.1, 1.1],
      ] as const) {
        const p = inHouse(h, lx, lz);
        b.box({ x: p.x, y: at(p.x, p.z) - 0.04, z: p.z, yaw }, [0.7, 0.08, 0.45], C.slateWorn);
      }
    },
    corps,
  );
  add(
    'ruine',
    0,
    (b) => {
      const h = H.west;
      const tilt = 0.2;
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
          const top = inHouse(h, sx * (h.w / 2 - 0.15) + 0.3, sz * (h.d / 2 - 0.15));
          const bend = inHouse(h, sx * (h.w / 2 - 0.15) - 0.15 * sz, sz * (h.d / 2 - 0.15) + 0.2);
          b.beam({ x: bend.x, y: pileFoot(ground, bend), z: bend.z }, { x: top.x, y: h.deck - 0.25 - sx * 0.3, z: top.z }, 0.2, C.wornShade);
        }
      b.box({ x: h.x + 0.3, y: h.deck - 0.25, z: h.z, yaw: h.yaw, pitch: 0 }, [h.w + 0.4, 0.18, h.d + 0.4], C.wornShade, C.wornWood);
      // Le mur et un pan de toit, penchés vers l'eau (le pied ouest plus bas).
      b.extrude(
        { x: h.x + 0.3, y: h.deck - 0.1, z: h.z - h.d / 2, yaw: h.yaw },
        [
          [-h.w / 2, -0.3 * tilt * 3],
          [h.w / 2, 0.3 * tilt * 3],
          [h.w / 2 - 0.35, h.wall + 0.6 * tilt],
          [-h.w / 2 - 0.35, h.wall - 0.6 * tilt],
        ],
        h.d,
        C.wall,
        C.wallTop,
      );
      const r0 = inHouse(h, 0.3, h.d / 2 + 0.3),
        r1 = inHouse(h, 0.3, 0);
      b.quad([r0.x - 1.9, h.deck + h.wall - 0.6, r0.z + 0.2], [r0.x + 1.7, h.deck + h.wall + 0.1, r0.z - 0.6], [r1.x + 1.6, h.deck + h.wall + 0.9, r1.z - 0.4], [r1.x - 1.9, h.deck + h.wall + 0.25, r1.z + 0.6], C.slateWorn);
    },
    corps,
  );

  // Les abords de la ruine : les passerelles coupées qui pendent, le ponton cassé, la seconde barque à moitié coulée, les
  // pots brisés. Les abords les remplacent.
  const abords = { stage: 2 as Stage, row: 0 };
  add(
    'ruine',
    0,
    (b) => {
      cutWalkway(b, deckEdge(H.west, H.back), deckEdge(H.back, H.west), ground);
      cutWalkway(b, deckEdge(H.east, H.back), deckEdge(H.back, H.east), ground);
      const P = PONTOON;
      const y = P.deck;
      b.box({ x: -0.6, y: y - 0.25, z: 2.3, yaw: 0.15, pitch: 0.12 }, [3.2, 0.12, 1.1], C.wornShade, C.wornWood);
      b.box({ x: 0.9, y: y - 0.3, z: 7.0, yaw: -0.25 }, [2.6, 0.12, 0.9], C.wornShade, C.wornWood);
      for (const [x, z] of [
        [-2, 3.2],
        [2, 6.3],
      ] as const)
        b.box({ x, y: pileFoot(ground, { x, z }), z }, [0.2, y - 0.3 - pileFoot(ground, { x, z }), 0.2], C.wornShade);
      b.beam({ x: -4.6, y: y - 0.1, z: 4.9 }, { x: -7.2, y: ground.water - 0.15, z: 5.3 }, 0.5, C.wornWood);
      boat(b, BOATS.sunk, ground.water, true);
      for (const [x, z] of POTS) b.prism({ x, y: at(x, z) - 0.05, z }, 0.26, 0.17, 0.4, 6, C.potShade, C.pot);
    },
    abords,
  );

  // Le corps : le dôme refermé, la cheminée droite, la braise d'ocre fixe dans la bouche ; puis les trois maisons
  // redressées en bois neuf et l'enseigne debout.
  add(0, 0, (b) => {
    dome(b);
    chimney(b);
    b.box({ x: 0, y: at(0, FRONT_Z) + 0.04, z: FRONT_Z + 0.06 }, [MOUTH.half * 1.5, 0.22, 0.14], C.lantern);
  });
  add(0, 0.5, (b) => {
    for (const h of [H.west, H.back, H.east]) house(b, h, ground);
    const g = at(SIGN.x, SIGN.z);
    b.box({ x: SIGN.x, y: g - 0.4, z: SIGN.z }, [0.16, SIGN.h + 0.4 - SIGN.r, 0.16], C.newShade);
    signBoard(b, { x: SIGN.x, y: g + SIGN.h - SIGN.r, z: SIGN.z }, false);
  });
  // Le haut : les trois toits d'ardoise bleue ; le mât de racine et sa lanterne au-dessus du dôme, allumée dès qu'elle
  // est posée (jamais à une réussite), et le filet de fumée, immobile.
  add(1, 0, (b) => {
    for (const h of [H.west, H.back, H.east]) roof(b, h);
  });
  add(1, 0.5, (b) => {
    const g = at(MAST.x, MAST.z);
    const knee = { x: MAST.x + 0.35, y: g + MAST.top * 0.55, z: MAST.z - 0.2 };
    b.beam({ x: MAST.x, y: g - 0.4, z: MAST.z }, knee, 0.34, C.log);
    b.beam(knee, { x: MAST.x, y: g + MAST.top, z: MAST.z }, 0.28, C.log);
    const tip = { x: MAST.x, y: g + MAST.top - 0.3, z: MAST.arm };
    b.beam({ x: MAST.x, y: g + MAST.top - 0.3, z: MAST.z }, tip, 0.14, C.log);
    lantern(b, tip, true, MAST_LANTERN);
    smoke(b);
  });
  // Les abords : le ponton neuf devant la bouche et son aile sur l'eau ; puis les passerelles tendues, la seconde barque à
  // flot, les deux lanternes de la cour, au bord nord de l'aile.
  add(2, 0, (b) => {
    const P = PONTOON;
    const n = 5;
    const step = (P.to - P.from) / n;
    for (let k = 0; k < n; k++) b.box({ x: 0, y: P.deck - 0.12, z: P.from + step * (k + 0.5) }, [2 * P.half, 0.12, step - 0.06], C.plankShade, C.plank);
    piles(b, ground, -P.half + 0.2, P.half - 0.2, P.from + 0.3, P.to - 0.3, C.plankShade);
    const W = P.wing;
    const wstep = (-P.half - W.x0) / 3;
    for (let k = 0; k < 3; k++) b.box({ x: -P.half - wstep * (k + 0.5), y: P.deck - 0.12, z: (W.z0 + W.z1) / 2 }, [wstep - 0.06, 0.12, W.z1 - W.z0], C.plankShade, C.plank);
    piles(b, ground, W.x0 + 0.3, -P.half - 2.2, W.z0 + 0.3, W.z1 - 0.3, C.plankShade);
  });
  add(2, 0.5, (b) => {
    walkway(b, deckEdge(H.west, H.back), deckEdge(H.back, H.west));
    walkway(b, deckEdge(H.east, H.back), deckEdge(H.back, H.east));
    boat(b, BOATS.sunk, ground.water);
    for (const x of [-3, -9]) {
      const z = PONTOON.wing.z0 + 0.15;
      b.box({ x, y: PONTOON.deck - 0.05, z }, [0.13, 1.45, 0.13], C.newShade);
      b.box({ x, y: PONTOON.deck + 1.4, z }, [0.28, 0.32, 0.28], C.lantern);
      b.prism({ x, y: PONTOON.deck + 1.72, z, yaw: Math.PI / 4 }, 0.24, 0, 0.2, 4, C.bronze);
    }
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
 * Les deux pelles à pain, identiques, debout côte à côte contre le mur à l'ouest de la bouche (jamais croisées) ; leur
 * pale large et claire se lit de loin (retouches 1 et 2), un écart entre elles.
 */
const PEELS = [-1.05, -2.0] as const;

/** La pale d'une pelle : sa largeur, sa hauteur (retouche 2 : une fois et demie plus large, deux outils pareils d'un coup d'œil). */
const PEEL_BLADE = { w: 0.8, h: 0.85 } as const;

function peels(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    for (const x of PEELS) {
      // Le mur à cet endroit : la façade sud, puis le pan voisin qui recule vers l'ouest.
      const wall = x > -1.14 ? FRONT_Z : FRONT_Z - ((-1.14 - x) / 1.85) * 1.35;
      const g = groundNear(c, x, wall + 0.5);
      // La pelle : son manche, du sol au mur, et sa pale en haut.
      l.beam({ x, y: g - 0.05, z: wall + 0.5 }, { x, y: g + 1.5, z: wall + 0.2 }, 0.09, C.newShade);
      l.box({ x, y: g + 1.4, z: wall + 0.12, pitch: -0.18 }, [PEEL_BLADE.w, PEEL_BLADE.h, 0.06], C.peel);
    }
  });
}

/**
 * La guirlande (Contre les discriminations) : une seule corde tendue entre deux mâts minces, devant le four, assez haut
 * pour que le linteau, la bouche et le motif des racines restent dégagés, de près comme en scénette (retouche 1) ; cinq
 * lanternes de trois formes nettes, ronde, carrée, hexagonale, carrée, ronde, toutes de la même lumière d'ocre (sans
 * ombre) : elles se distinguent par la silhouette, jamais par la couleur.
 */
export const GARLAND_SHAPES = ['ronde', 'carree', 'hexagonale', 'carree', 'ronde'] as const;

const ROUND = Array.from({ length: 12 }, (_, k) => [0.27 * Math.cos((Math.PI * k) / 6), 0.27 * Math.sin((Math.PI * k) / 6)] as const);
const HEX = Array.from({ length: 6 }, (_, k) => [0.3 * Math.cos((Math.PI * k) / 3), 0.3 * Math.sin((Math.PI * k) / 3)] as const);

/**
 * Les deux mâts de la guirlande, de part et d'autre du ponton, en avant de la façade (hors du dôme) : leur écart au
 * milieu, leur place vers le sud, la hauteur de la corde au-dessus du sol, son creux au milieu, la longueur des fils.
 */
const GARLAND = { half: 4.6, z: 1.4, height: 4, sag: 0.3, hang: 0.35 } as const;

function garland(b: FacetBuilder, c: Vec3): void {
  const G = GARLAND;
  inWorld(b, c, (l) => {
    const ends = [-G.half, G.half].map((x) => ({ x, y: groundNear(c, x, G.z), z: G.z }));
    for (const e of ends) l.box({ x: e.x, y: e.y - 0.3, z: e.z }, [0.14, G.height + 0.3, 0.14], C.newShade);
    const [from, to] = ends.map((e) => ({ ...e, y: e.y + G.height - 0.05 }));
    const at = (t: number): Vec3 => ({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - 4 * G.sag * t * (1 - t), z: from.z });
    const knots = [0, 0.25, 0.5, 0.75, 1].map(at);
    for (let k = 0; k < 4; k++) l.beam(knots[k], knots[k + 1], 0.04, C.rope);
    GARLAND_SHAPES.forEach((shape, i) => {
      const p = at((i + 1) / 6);
      const y = p.y - G.hang - 0.22;
      const z = p.z - 0.07;
      if (shape === 'carree') l.box({ x: p.x, y, z: p.z }, [0.48, 0.48, 0.14], C.lantern);
      else l.extrude({ x: p.x, y: y + 0.27, z }, shape === 'ronde' ? ROUND : HEX, 0.14, C.lantern);
      l.beam({ x: p.x, y: y + 0.5, z: p.z }, { x: p.x, y: p.y, z: p.z }, 0.03, C.rope);
    });
  });
}

/** La longue table du ponton (La solidarité), sur l'aile, un banc de chaque côté, des miches rondes au milieu. */
const TABLE = { x: -6.3, z: 4.9, len: 3, top: 0.75 } as const;

function table(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const T = TABLE;
    const y = PONTOON.deck;
    l.box({ x: T.x, y: y + T.top - 0.1, z: T.z }, [T.len, 0.1, 0.85], C.newShade, C.newWood);
    for (const dx of [-1.15, 1.15]) l.box({ x: T.x + dx, y, z: T.z }, [0.12, T.top - 0.1, 0.62], C.newShade);
    for (const dz of [-0.78, 0.78]) l.box({ x: T.x, y, z: T.z + dz }, [T.len - 0.2, 0.42, 0.3], C.newShade, C.newWood);
    for (const dx of [-0.85, 0, 0.85]) l.prism({ x: T.x + dx, y: y + T.top, z: T.z }, 0.2, 0.12, 0.15, 6, C.bread, C.breadTop);
  });
}

// ---------- La scénette ----------

/** Le plancher de la scène, sur le ponton devant la bouche : sa demi-largeur, sa profondeur, sa hauteur. */
const SCENE_FLOOR = { half: 4.2, depth: 2.4, rise: 0.45 } as const;

/** Le milieu de la scène, depuis le centre du lieu : sur le ponton, la bouche du four derrière. */
const SCENE_SPOT = { dx: 0, dz: 4.8 } as const;

/** Le plancher de la scène : des planches en travers sur des pieux, du sol jusqu'à la hauteur de la scène. */
function sceneFloor(b: FacetBuilder, floor: Vec3): void {
  const F = SCENE_FLOOR;
  const n = 6;
  for (let k = 0; k < n; k++) {
    const x = floor.x - F.half + ((k + 0.5) * 2 * F.half) / n;
    b.box({ x, y: floor.y - 0.16, z: floor.z }, [(2 * F.half) / n - 0.05, 0.16, F.depth], C.plankShade, C.plank);
  }
  for (const dx of [-F.half + 0.25, 0, F.half - 0.25])
    for (const dz of [-F.depth / 2 + 0.2, F.depth / 2 - 0.2]) {
      const x = floor.x + dx,
        z = floor.z + dz;
      const g = Math.min(standingHeight(heightAt5e({ x, z })), floor.y - 0.4);
      b.box({ x, y: g - 0.4, z }, [0.2, floor.y - g + 0.25, 0.2], C.plankShade);
    }
}

/**
 * Le boulanger en pion (son modèle 3D prend sa place, ./habitants.ts), immobile, le visage nu : ses bottes, son pantalon
 * brun, sa chemise de lin, son grand tablier clair, son béret ; les bras le long du corps.
 */
function baker(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) {
    b.prism({ x: at.x + side * 0.12, y: at.y, z: at.z }, 0.13, 0.13, 0.2, 6, C.boots);
    b.prism({ x: at.x + side * 0.12, y: at.y + 0.2, z: at.z }, 0.12, 0.12, 0.32, 6, C.trousers);
  }
  b.prism({ x: at.x, y: at.y + 0.5, z: at.z }, 0.28, 0.26, 0.48, 8, C.shirt);
  b.box({ x: at.x, y: at.y + 0.22, z: at.z + 0.24 }, [0.5, 0.72, 0.06], C.apronShade, C.apron);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  b.prism({ x: at.x, y: at.y + 1.24, z: at.z - 0.02 }, 0.22, 0.17, 0.1, 8, C.cap);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.3, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.36, y: at.y + 0.5, z: at.z + 0.05 }, 0.12, C.shirt);
}

/** La planche à pain des réponses : la hauteur de ses tréteaux, à l'échelle 1 ; une miche choisie se soulève d'un cran. */
const BOARD = { height: 0.55, lift: 0.2 } as const;

/** Une miche ronde à l'échelle `s` : un pied à sept pans, un dessus bombé. Quarante-deux triangles. */
function loaf(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.3 * s, 0.32 * s, 0.1 * s, 7, C.bread, C.bread);
  b.prism({ x: at.x, y: at.y + 0.1 * s, z: at.z, yaw: 0.45 }, 0.32 * s, 0.14 * s, 0.16 * s, 7, C.bread, C.breadTop);
}

/** Où se pose la trace de chaque mission, depuis le centre du lieu (la caméra du retour en garde la place). */
const TRACE_SPOTS = {
  'gender-equality': { x: -1.2, z: -0.2 },
  discrimination: { x: 0, z: GARLAND.z },
  solidarity: { x: TABLE.x, z: TABLE.z },
} as const;

export const HAMEAU: PlaceArt = {
  role: 'Le boulanger',
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
    if (body) baker(b, at, sphere);
  },
  answer: {
    size: { height: BOARD.height + BOARD.lift + 0.3, half: 0.36 },
    // La longue planche à pain sur deux tréteaux, sous la rangée des miches.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BOARD.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.7 * s], C.newShade, C.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.12, top - 0.08 * s - foot, 0.6 * s], C.newShade);
      }
    },
    // Une miche ronde posée sur la planche ; choisie, elle se soulève d'un cran (sa place le dit, jamais sa couleur seule).
    object(b, at, s, _i, _count, picked) {
      loaf(b, { x: at.x, y: at.y + (BOARD.height + (picked ? BOARD.lift : 0)) * s, z: at.z }, s);
    },
  },
  // Les trois missions en R : le plancher seul, rien de l'item ; les miches portent les réponses.
  rest() {},
  traces: {
    'gender-equality': { at: TRACE_SPOTS['gender-equality'], lift: 1, stage: 0, draw: peels },
    discrimination: { at: TRACE_SPOTS.discrimination, lift: 3.5, stage: 1, draw: garland },
    solidarity: { at: TRACE_SPOTS.solidarity, lift: 1, stage: 2, draw: table },
  },
  // Kéo au retour : sur le chemin, à l'est de la porte, face au four.
  exit: { x: 2.6, z: 8.8 },
};

/** Le plus haut du Hameau : le haut du mât de racine, au-dessus de son pied (il reste sous la canopée). */
export const HAMEAU_MAST_TOP = MAST.top;
