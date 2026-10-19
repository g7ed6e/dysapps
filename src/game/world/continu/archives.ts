// Les Archives (GD-20, point 8, lot L7, directeur artistique) : une façade à quatre colonnes de calcaire et son fronton,
// creusée dans la roche de l'éperon de la falaise, adossée au nord, ses niches basses de part et d'autre ; le parvis
// dallé devant elle, au-dessus du lagon. Avant : la ruine du temps (deux colonnes couchées sur le parvis, deux tronçons
// debout, le fronton fendu tombé à ses pieds, les niches bouchées d'éboulis), délavée, jamais sombre. Le corps : le
// socle, les colonnes, puis l'entablement et la porte. Le haut : le fronton, puis les niches dégagées. Les abords : le
// parvis dallé et le chemin de la porte, puis le muret (l'étape qui porte les traces). L'habitante, « la copiste » ; les
// réponses, trois tiroirs à fiches identiques sur un banc de pierre ; la façade reste calme (aucun témoin). Rien d'écrit,
// ni lettre, ni chiffre, ni livre ouvert. Code pur (placeArt.ts).
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_6E } from './plan6e';
import { heightAt, standingHeight } from './terrain';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant (places.ts, `SINK`). */
const SINK = -0.8;

const C = {
  // Le calcaire des colonnes (directeur artistique, #D8CBB0), son ombre (les flancs), le tympan un cran plus sombre.
  lime: 0xd8cbb0,
  limeShade: 0xbcae92,
  tympan: 0xcbbd9f,
  // L'ombre des niches et de la porte : un brun chaud, jamais noir (#5E4E3C).
  shade: 0x5e4e3c,
  // La roche du monde (#9C8466) et son flanc, plus sombre d'un cran.
  rock: COLORS_6E.rock,
  rockSide: 0x8a7458,
  // La ruine : le calcaire délavé, son dessus, les éboulis.
  worn: 0xbdb39c,
  wornTop: 0xaea48d,
  rubble: 0xa89d88,
  rubbleTop: 0xb7ad98,
  // Le parvis : ses dalles et leurs joints ; le muret.
  slab: 0xd2c4a6,
  // Le sol de la scène : les dalles chaudes des scènes (lot commun des scénettes), leurs joints et leur tranche.
  paving: 0xd6b98e,
  pavingAlt: 0xccad80,
  pavingSide: 0xb0926a,
  joint: 0xb3a587,
  wall: 0xc4b69a,
  wallTop: 0xd6c9ad,
  path: COLORS_6E.path,
  // Les tiroirs à fiches (#B98049), leur flanc, leur poignée (#C8923A), les fiches vierges (la Brume).
  drawer: 0xb98049,
  drawerSide: 0x9c6a3b,
  handle: 0xc8923a,
  card: 0xe5ebe3,
  cardShade: 0xc9d3d0,
  // La copiste : gilet Vert île (#438B82) sur chemise Brume (#E5EBE3), pantalon et manchettes Nuit océan (#142B38),
  // ses cheveux châtains (jamais presque noirs), la plume d'oie.
  vest: 0x438b82,
  vestShade: 0x37756d,
  shirt: 0xe5ebe3,
  night: 0x142b38,
  head: 0xe3c08a,
  hair: 0x7a4a2e,
  quill: 0xf2eee4,
  quillShaft: 0xc9b98f,
  // Les traces : la mosaïque (Bleu lagon, Brume, Sable), le coffre (bois #8A5A36, fer #2F3E48), la pierre à facettes.
  lagoon: 0x178078,
  lagoonLight: COLORS_6E.lagoon,
  sand: 0xdaa66a,
  chest: 0x8a5a36,
  chestTop: 0x9c6a42,
  iron: 0x2f3e48,
  gem: 0x2f9d8f,
  gemShade: 0x178078,
  shelf: 0x8a5a36,
} as const;

/**
 * La façade, dans le repère du lieu : le socle (son bord sud, son bord nord, son dessus), les quatre colonnes (leur x,
 * leur z, leur rayon), l'entablement (son bas, son épaisseur, sa demi-largeur), le fronton (sa hauteur, sa
 * demi-largeur), la porte au fond (sa demi-largeur, sa hauteur) et le fond de roche (son z).
 */
const F = {
  front: -1.7,
  back: -3.7,
  plinth: 0.32,
  columns: [-2.7, -0.9, 0.9, 2.7],
  colZ: -2.35,
  colR: 0.3,
  beam: 3.62,
  beamH: 0.42,
  half: 3.9,
  pediment: 1.25,
  pedHalf: 4.0,
  door: { half: 0.75, h: 2.4 },
  wallZ: -3.5,
} as const;

/** Les deux pans de roche qui encadrent la façade (le lieu creusé dans l'éperon) : leur bord intérieur, extérieur, leur face sud. */
const JAMB = { inner: 4.15, outer: 6.6, face: -1.55, deep: -4.8, top: 3.95 } as const;

/** Les niches basses, une dans chaque pan de roche : leur milieu (en x), leur demi-largeur, leur bas, leur haut. */
const NICHE = { x: 5.35, half: 0.55, y0: 0.25, y1: 1.65 } as const;

/** Le parvis dallé : sa demi-largeur, son bord sud ; le muret de part et d'autre (son x, sa largeur). */
const PARVIS = { half: 4.1, south: 2.9, wall: 4.45, wallW: 0.36 } as const;

/** Les colonnes : un fût à huit pans, sa base et son chapiteau. */
function column(b: FacetBuilder, x: number, y: number, z: number, h: number, color: number, top: number): void {
  b.box({ x, y, z }, [0.78, 0.16, 0.78], top, top);
  b.prism({ x, y: y + 0.16, z, yaw: Math.PI / 8 }, F.colR, F.colR * 0.9, h - 0.34, 8, color, top);
  b.box({ x, y: y + h - 0.18, z }, [0.82, 0.18, 0.82], top, top);
}

/** Un contour d'arc (une niche, la porte) : un rectangle et son haut en demi-cercle, dans le plan x, y, vu du sud. */
function arch(cx: number, half: number, y0: number, y1: number): [number, number][] {
  const spring = y1 - half;
  const out: [number, number][] = [
    [cx - half, y0],
    [cx + half, y0],
  ];
  for (let k = 0; k <= 4; k++) {
    const a = (Math.PI * k) / 4;
    out.push([cx + half * Math.cos(a), spring + half * Math.sin(a)]);
  }
  return out;
}

/** Le fronton : un triangle épaissi, posé sur l'entablement (`y`), sa face au sud en `z`. */
function pediment(b: FacetBuilder, y: number, z: number, depth: number, half: number, h: number, color: number, face: number): void {
  b.extrude({ x: 0, y, z: z - depth }, [[-half, 0], [half, 0], [0, h]], depth, color, face);
}

/**
 * Les Archives : le lieu, dans son repère (le centre au sol en 0, le nord vers −z). La roche encadre la façade et la
 * porte au fond (là avant toute partie) ; ce qui gît dans la ruine s'en va quand ce qui le relève se pose, jamais en
 * double.
 */
function model(add: AddPiece, ground: SiteGround, door: { x: number; z: number }): void {
  const plinthZ = (F.front + F.back) / 2;
  const plinthD = F.front - F.back;
  // La roche de l'éperon : deux pans qui avancent de part et d'autre de la façade, leur dessus qui retombe vers elle, et
  // le fond, derrière les colonnes, où s'ouvre la porte (son ombre, jamais noire). Toujours là.
  add('ruine', 0, (b) => {
    for (const side of [-1, 1]) {
      const [a, o] = [side * JAMB.inner, side * JAMB.outer];
      const outline: [number, number][] = [
        [Math.min(a, o), SINK],
        [Math.max(a, o), SINK],
        [side > 0 ? o : a, side > 0 ? JAMB.top - 1.1 : JAMB.top - 0.25],
        [side > 0 ? (a + o) / 2 + 0.4 : (a + o) / 2 - 0.4, JAMB.top],
        [side > 0 ? a : o, side > 0 ? JAMB.top - 0.25 : JAMB.top - 1.1],
      ];
      b.extrude({ x: 0, y: 0, z: JAMB.deep }, outline, JAMB.face - JAMB.deep, C.rockSide, C.rock);
      // La niche basse, creusée dans la face sud du pan : son ombre.
      b.plate({ x: 0, y: 0, z: JAMB.face + 0.01 }, arch(side * NICHE.x, NICHE.half, NICHE.y0, NICHE.y1), C.shade);
    }
    b.box({ x: 0, y: SINK, z: F.wallZ - 0.6 }, [2 * JAMB.inner + 0.2, JAMB.top - 0.35 - SINK, 1.2], C.rockSide, C.rock);
    b.plate({ x: 0, y: 0, z: F.wallZ + 0.01 }, arch(0, F.door.half, 0, F.door.h), C.shade);
  });
  // Le socle usé, à ras du sol ; le socle neuf le remplace.
  add('ruine', 0, (b) => b.box({ x: 0, y: SINK, z: plinthZ }, [2 * F.half + 0.6, 0.2 - SINK, plinthD], C.worn, C.wornTop), { stage: 0, row: 0 });
  // Deux tronçons de colonnes encore debout, cassés à des hauteurs inégales ; les fûts relevés les remplacent.
  add(
    'ruine',
    0,
    (b) => {
      b.prism({ x: F.columns[0], y: 0.1, z: F.colZ, yaw: Math.PI / 8 }, F.colR, F.colR * 0.95, 1.5, 8, C.worn, C.wornTop);
      b.prism({ x: F.columns[2], y: 0.1, z: F.colZ, yaw: Math.PI / 8 }, F.colR, F.colR * 0.93, 2.2, 8, C.worn, C.wornTop);
    },
    { stage: 0, row: 0.34 },
  );
  // Deux colonnes couchées sur le parvis, de travers, l'une brisée en deux tronçons ; relevées avec les fûts.
  add(
    'ruine',
    0,
    (b) => {
      const r = F.colR;
      const lying = (x: number, z: number, yaw: number, len: number) => {
        const y = Math.max(ground.foot(x, z, 0.6).top, 0) + r - 0.06;
        b.drum({ x: x - (Math.sin(yaw) * len) / 2, y, z: z - (Math.cos(yaw) * len) / 2, yaw, pitch: Math.PI / 2 }, r, len, 8, C.worn, C.wornTop);
      };
      lying(-2.1, -0.4, Math.PI / 2 + 0.25, 2.8);
      lying(1.4, 0.6, Math.PI / 2 - 0.35, 1.5);
      lying(3.0, 1.3, Math.PI / 2 - 0.1, 1.1);
    },
    { stage: 0, row: 0.34 },
  );
  // Le fronton fendu, tombé au pied de la façade : ses deux moitiés à plat, de travers ; le fronton neuf le remplace.
  add(
    'ruine',
    0,
    (b) => {
      const h = F.pediment * 0.9;
      b.extrude({ x: -3.2, y: 0.02, z: 1.6, pitch: -Math.PI / 2 + 0.12, yaw: 0.3 }, [[0, 0], [2.6, 0], [0, h]], 0.4, C.worn, C.wornTop);
      b.extrude({ x: 3.6, y: 0.02, z: 0.0, pitch: -Math.PI / 2 + 0.2, yaw: -0.5 }, [[-2.2, 0], [0, 0], [0, h * 0.85]], 0.4, C.worn, C.wornTop);
    },
    { stage: 1, row: 0 },
  );
  // Les éboulis qui bouchent les niches : des blocs de roche entassés devant elles ; ils s'en vont quand elles sont dégagées.
  add(
    'ruine',
    0,
    (b) => {
      for (const side of [-1, 1]) {
        const x = side * NICHE.x;
        const y = Math.max(0, ground.foot(x, JAMB.face + 0.4, 0.5).top) - 0.15;
        // Le bouchon : des pierres sèches empilées dans la niche, jusqu'aux deux tiers ; puis le tas devant elle.
        b.box({ x, y: NICHE.y0 - 0.05, z: JAMB.face + 0.1, yaw: 0.05 * side }, [2 * NICHE.half - 0.05, 0.85, 0.3], C.rubble, C.rubbleTop);
        for (const [dx, dz, r, h] of [
          [-0.32, 0.35, 0.5, 0.75],
          [0.35, 0.45, 0.42, 0.6],
          [0.0, 0.3, 0.42, 1.3],
          [0.1, 0.85, 0.32, 0.4],
        ] as const)
          b.prism({ x: x + side * dx, y, z: JAMB.face + dz, yaw: dx + side }, r, r * 0.6, h, 6, C.rubble, C.rubbleTop);
      }
    },
    { stage: 1, row: 0.5 },
  );
  // Le corps : le socle neuf, en deux marches de calcaire.
  add(0, 0, (b) => {
    b.box({ x: 0, y: SINK, z: plinthZ }, [2 * F.half + 0.8, F.plinth / 2 - SINK, plinthD], C.limeShade, C.lime);
    b.box({ x: 0, y: F.plinth / 2, z: plinthZ - 0.2 }, [2 * F.half + 0.3, F.plinth / 2, plinthD - 0.4], C.limeShade, C.lime);
  });
  // Les quatre colonnes de calcaire.
  add(0, 0.34, (b) => {
    for (const x of F.columns) column(b, x, F.plinth, F.colZ, F.beam - F.plinth, C.lime, C.lime);
  });
  // L'entablement sur les colonnes, sa frise de vagues gravée (un ruban ondulé, un cran plus sombre : rien qui se lise), et
  // le cadre de la porte au fond.
  add(0, 0.67, (b) => {
    const depth = F.colZ - F.wallZ + 1.2;
    const zc = (F.colZ + F.wallZ) / 2 + 0.25;
    b.box({ x: 0, y: F.beam, z: zc }, [2 * F.half, F.beamH, depth], C.limeShade, C.lime);
    const n = 24;
    const zf = zc + depth / 2 + 0.01;
    const yw = (x: number) => F.beam + F.beamH / 2 + 0.07 * Math.sin((x / F.half) * Math.PI * 4);
    for (let k = 0; k < n; k++) {
      const [x0, x1] = [-F.half + 0.2 + ((2 * F.half - 0.4) * k) / n, -F.half + 0.2 + ((2 * F.half - 0.4) * (k + 1)) / n];
      b.quad([x0, yw(x0) - 0.04, zf], [x1, yw(x1) - 0.04, zf], [x1, yw(x1) + 0.04, zf], [x0, yw(x0) + 0.04, zf], C.tympan);
    }
    for (const side of [-1, 1]) b.box({ x: side * (F.door.half + 0.12), y: F.plinth, z: F.wallZ + 0.05 }, [0.24, F.door.h + 0.1 - F.plinth, 0.12], C.lime);
    b.box({ x: 0, y: F.door.h + 0.1, z: F.wallZ + 0.05 }, [2 * F.door.half + 0.5, 0.24, 0.14], C.lime);
  });
  // Le haut : la corniche et le fronton, son tympan un cran plus sombre (nu : ni gravure, ni lettre).
  add(1, 0, (b) => {
    const y = F.beam + F.beamH;
    const z = F.colZ + 0.75;
    b.box({ x: 0, y, z: z - 0.7 }, [2 * F.pedHalf + 0.1, 0.12, 1.5], C.limeShade, C.lime);
    pediment(b, y + 0.12, z, 1.3, F.pedHalf, F.pediment, C.limeShade, C.lime);
    b.plate({ x: 0, y: y + 0.12, z: z + 0.01 }, [[-F.pedHalf + 0.55, 0.14], [F.pedHalf - 0.55, 0.14], [0, F.pediment - 0.3]], C.tympan);
  });
  // Les niches dégagées : leur cadre de calcaire, un seuil et un linteau.
  add(1, 0.5, (b) => {
    for (const side of [-1, 1]) {
      const x = side * NICHE.x;
      b.box({ x, y: NICHE.y0 - 0.12, z: JAMB.face + 0.08 }, [2 * NICHE.half + 0.3, 0.12, 0.2], C.limeShade, C.lime);
      b.box({ x, y: NICHE.y1, z: JAMB.face + 0.06 }, [2 * NICHE.half + 0.3, 0.16, 0.16], C.limeShade, C.lime);
    }
  });
  // Les abords : le parvis dallé devant la façade, ses joints, et le chemin de sable de la porte jusqu'à lui.
  add(2, 0, (b) => {
    const z0 = F.front;
    const depth = PARVIS.south - z0;
    b.box({ x: 0, y: SINK, z: (z0 + PARVIS.south) / 2 }, [2 * PARVIS.half, 0.06 - SINK, depth], C.joint, C.slab);
    for (const x of [-2.05, 2.05]) b.box({ x, y: 0.06, z: (z0 + PARVIS.south) / 2 }, [0.05, 0.01, depth], C.joint);
    for (const z of [z0 + depth / 3, z0 + (2 * depth) / 3]) b.box({ x: 0, y: 0.06, z }, [2 * PARVIS.half, 0.01, 0.05], C.joint);
    const len = door.z - PARVIS.south;
    if (len > 0) b.box({ x: door.x / 2, y: SINK, z: PARVIS.south + len / 2, yaw: Math.atan2(door.x, len) }, [1.2, 0.03 - SINK, len + 0.2], C.joint, C.path);
  });
  // Le muret, de part et d'autre du parvis : des pierres de hauteurs inégales, le passage vers la porte laissé libre.
  add(2, 0.5, (b) => {
    for (const side of [-1, 1])
      for (const [z, len, h] of [
        [-0.9, 1.4, 0.62],
        [0.65, 1.6, 0.5],
        [2.2, 1.3, 0.58],
      ] as const)
        b.box({ x: side * PARVIS.wall, y: SINK, z, yaw: 0.03 * side * z }, [PARVIS.wallW, h - SINK, len], C.limeShade, C.wallTop);
  });
}

/** Le sol (à sa hauteur où l'on se tient) en un point du lieu, depuis son centre, dans le monde. */
function groundOf(c: Vec3, dx: number, dz: number): Vec3 {
  const x = c.x + dx,
    z = c.z + dz;
  return { x, y: standingHeight(heightAt({ x, z })), z };
}

/** Où se pose la trace de chaque mission, depuis le centre du lieu, sur le parvis ou dans une niche, hors du chemin. */
const TRACE_SPOTS = {
  'missing-letters': { x: 0, z: 0.75 },
  'word-families': { x: -NICHE.x, z: JAMB.face + 0.3 },
  'sight-words': { x: 3.05, z: 1.95 },
  'word-forms': { x: -3.05, z: 1.95 },
} as const;

/** Les bandes de la mosaïque de vagues : leur décalage (en z), leur couleur. */
const WAVES: readonly (readonly [number, number])[] = [
  [-0.32, C.lagoon],
  [0.32, C.lagoonLight],
];

/**
 * La mosaïque de vagues du parvis (Mot troué) : un cadre de sable, un fond de Brume, deux bandes ondulées de tesselles
 * en aplats (Bleu lagon, lagon clair) ; chaque tesselle est un losange étiré le long de sa vague, aucune n'a forme de lettre.
 */
function mosaic(b: FacetBuilder, g: Vec3): void {
  const [hx, hz] = [1.5, 0.75];
  const y = g.y + 0.07;
  b.quad([g.x - hx - 0.12, y, g.z + hz + 0.12], [g.x + hx + 0.12, y, g.z + hz + 0.12], [g.x + hx + 0.12, y, g.z - hz - 0.12], [g.x - hx - 0.12, y, g.z - hz - 0.12], C.sand);
  b.quad([g.x - hx, y + 0.005, g.z + hz], [g.x + hx, y + 0.005, g.z + hz], [g.x + hx, y + 0.005, g.z - hz], [g.x - hx, y + 0.005, g.z - hz], C.shirt);
  const n = 12;
  for (const [dz, color] of WAVES) {
    for (let k = 0; k < n; k++) {
      const [x0, x1] = [-hx + 0.05 + ((2 * hx - 0.1) * k) / n, -hx + 0.05 + ((2 * hx - 0.1) * (k + 1)) / n - 0.04];
      const wave = (x: number) => dz + 0.2 * Math.sin((x / hx) * Math.PI * 1.5 + dz * 4);
      const [z0, z1] = [wave(x0), wave(x1)];
      const yy = y + 0.01;
      b.quad([g.x + x0, yy, g.z + z0 + 0.13], [g.x + x1, yy, g.z + z1 + 0.13], [g.x + x1, yy, g.z + z1 - 0.13], [g.x + x0, yy, g.z + z0 - 0.13], color);
    }
  }
}

/** Le coffre cerclé (Coffre à mots) : sa caisse et son couvercle de bois, deux cercles de fer, sur le parvis. */
function chest(b: FacetBuilder, g: Vec3): void {
  const [w, h, d] = [1.1, 0.55, 0.7];
  b.box({ x: g.x, y: g.y, z: g.z, yaw: -0.25 }, [w, h, d], C.chest, C.chestTop);
  b.box({ x: g.x, y: g.y + h, z: g.z, yaw: -0.25 }, [w + 0.06, 0.18, d + 0.06], C.chestTop, C.chest);
  for (const u of [-0.3, 0.3]) {
    const [ox, oz] = [u * Math.cos(-0.25), -u * Math.sin(-0.25)];
    b.box({ x: g.x + ox, y: g.y - 0.01, z: g.z + oz, yaw: -0.25 }, [0.1, h + 0.2, d + 0.1], C.iron);
  }
}

/** La pierre taillée à facettes (Facettes) : un socle de calcaire, la pierre, deux pointes à six facettes. */
function facetedStone(b: FacetBuilder, g: Vec3): void {
  b.box({ x: g.x, y: g.y - 0.1, z: g.z }, [0.7, 0.9, 0.7], C.limeShade, C.lime);
  b.box({ x: g.x, y: g.y + 0.8, z: g.z }, [0.86, 0.12, 0.86], C.limeShade, C.lime);
  const y = g.y + 0.92 + 0.32;
  b.prism({ x: g.x, y, z: g.z, yaw: 0.3 }, 0.32, 0, 0.38, 6, C.gem);
  b.prism({ x: g.x, y, z: g.z, yaw: 0.3, pitch: Math.PI }, 0.32, 0, 0.32, 6, C.gemShade);
}

/**
 * La niche rangée (Familles-craft) : dans la niche ouest, une tablette de bois et trois piles de fiches vierges, nues
 * (rien d'écrit), qui dépassent de la roche.
 */
function tidyNiche(b: FacetBuilder, c: Vec3): void {
  const x = c.x - NICHE.x;
  const z = c.z + JAMB.face;
  const y = c.y + NICHE.y0 + 0.5;
  b.box({ x, y, z: z + 0.05 }, [2 * NICHE.half - 0.05, 0.07, 0.4], C.shelf);
  for (const [dx, h, yaw] of [
    [-0.3, 0.32, 0.08],
    [0.02, 0.44, -0.05],
    [0.32, 0.26, 0.12],
  ] as const) {
    b.box({ x: x + dx, y: y + 0.07, z: z + 0.07, yaw }, [0.26, h, 0.3], C.cardShade, C.card);
  }
  b.box({ x, y: c.y + NICHE.y0, z: z + 0.07 }, [2 * NICHE.half - 0.1, 0.36, 0.34], C.drawerSide, C.drawer);
}

/** Le tiroir à fiches, à l'échelle 1 : sa largeur, sa hauteur, sa profondeur ; la hauteur des fiches qui dépassent. */
const DRAWER = { w: 0.72, h: 0.46, d: 0.86, cards: 0.13 } as const;

/** Les fiches vierges d'un tiroir : leur place le long de sa profondeur (depuis sa façade), leur bascule, en radians. */
const CARDS: readonly (readonly [number, number])[] = [
  [-0.14, 0.12],
  [-0.27, 0.06],
  [-0.4, 0.1],
  [-0.53, 0.02],
  [-0.66, 0.08],
];

/** La bascule d'un tiroir choisi (une réponse tentée) : tiré vers l'élève, penché en avant sur son bord, en radians. */
const DRAWER_TIPPED = 0.42;

/**
 * Un tiroir à fiches de réponse, posé sur le banc en `at`, à l'échelle `s` : sa caisse de bois, sa façade et sa
 * poignée d'ocre, ses fiches vierges qui dépassent ; tous les mêmes, rien ne dit la réponse. `tilt` : tiré vers l'élève
 * et penché en avant autour de son bord sud (les fiches se montrent) : sa forme le dit.
 */
function answerDrawer(b: FacetBuilder, at: Vec3, s: number, tilt: number): void {
  const [w, h, d] = [DRAWER.w * s, DRAWER.h * s, DRAWER.d * s];
  // Le pivot : le bord sud du dessous, avancé quand le tiroir est tiré.
  const pivot = { x: at.x, y: at.y, z: at.z + d / 2 + (tilt ? 0.06 * s : 0) };
  const [cp, sp] = [Math.cos(tilt), Math.sin(tilt)];
  // Un point du tiroir (depuis le pivot : en haut `oy`, vers le sud `oz`), tourné avec lui.
  const put = (ox: number, oy: number, oz: number, pitch = tilt) => ({ x: pivot.x + ox, y: pivot.y + oy * cp - oz * sp, z: pivot.z + oy * sp + oz * cp, pitch });
  b.box(put(0, 0, -d / 2), [w, h, d], C.drawerSide, C.drawer);
  // La façade, un peu plus large, et la poignée en demi-anneau.
  b.box(put(0, 0, 0.02 * s), [w + 0.06 * s, h + 0.04 * s, 0.05 * s], C.drawer);
  b.box(put(0, h * 0.62, 0.07 * s), [0.3 * s, 0.07 * s, 0.05 * s], C.handle);
  for (const side of [-1, 1]) b.box(put(side * 0.13 * s, h * 0.62, 0.05 * s), [0.05 * s, 0.07 * s, 0.04 * s], C.handle);
  // Les fiches vierges : des feuilles fines, serrées, un peu penchées, qui dépassent du dessus (toutes les mêmes).
  for (const [oz, lean] of CARDS) b.box(put(0, h - 0.06 * s, oz * s, tilt + lean), [w - 0.1 * s, (DRAWER.cards + 0.06) * s, 0.03 * s], C.card);
}

/**
 * La copiste, immobile (directeur artistique, consultant Archipéo) : son pantalon Nuit océan, sa chemise Brume et son
 * gilet Vert île par-dessus (le haut seulement), ses manchettes Nuit océan ; la tête, ses cheveux châtains noués ; une
 * plume d'oie levée dans sa main tendue vers l'ouest (vers les tiroirs). Elle ne dit rien.
 */
function copiste(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  b.prism(at, 0.3, 0.27, 0.5, 10, C.night);
  b.prism({ x: at.x, y: at.y + 0.5, z: at.z }, 0.27, 0.25, 0.42, 10, C.shirt);
  // Le gilet : un tronc un peu plus large, ouvert devant (la chemise s'y voit en pointe).
  b.prism({ x: at.x, y: at.y + 0.5, z: at.z, yaw: Math.PI / 8 }, 0.29, 0.265, 0.38, 8, C.vest, C.vestShade);
  b.plate({ x: at.x, y: at.y + 0.52, z: at.z + 0.285 }, [[-0.04, 0.36], [0, 0.08], [0.04, 0.36]], C.shirt);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 8, 6, C.head);
  // Les cheveux : une calotte reculée (le visage nu devant) et un chignon bas.
  sphere(b, { x: at.x, y: at.y + 1.16, z: at.z - 0.04 }, 0.245, 8, 4, C.hair);
  sphere(b, { x: at.x, y: at.y + 1.0, z: at.z - 0.22 }, 0.1, 6, 3, C.hair);
  // Le bras gauche le long du corps, sa manchette ; le bras droit tendu vers l'ouest, la plume levée dans la main.
  const rest = { x: at.x + 0.32, y: at.y + 0.5, z: at.z + 0.04 };
  b.beam({ x: at.x + 0.26, y: at.y + 0.86, z: at.z }, rest, 0.13, C.shirt);
  b.box({ x: rest.x, y: rest.y - 0.1, z: rest.z }, [0.15, 0.12, 0.15], C.night);
  const hand = { x: at.x - 0.48, y: at.y + 0.72, z: at.z + 0.3 };
  b.beam({ x: at.x - 0.24, y: at.y + 0.86, z: at.z + 0.04 }, hand, 0.13, C.shirt);
  b.beam({ x: hand.x + 0.05, y: hand.y - 0.01, z: hand.z - 0.03 }, { x: hand.x - 0.03, y: hand.y + 0.01, z: hand.z + 0.02 }, 0.16, C.night);
  // La plume : son tuyau fin, puis sa barbe, un fuseau plat penché vers l'arrière.
  const tip = { x: hand.x - 0.1, y: hand.y + 0.05, z: hand.z };
  b.beam(tip, { x: tip.x + 0.06, y: tip.y + 0.2, z: tip.z - 0.02 }, 0.025, C.quillShaft);
  b.extrude({ x: tip.x + 0.06, y: tip.y + 0.18, z: tip.z - 0.03, yaw: 0.3 }, [[0, 0], [0.07, 0.1], [0.08, 0.32], [0.02, 0.44], [-0.04, 0.2]], 0.02, C.quill);
}

/**
 * Le cap de départ de la caméra de la scénette (avis du directeur artistique, 18 octobre 2026 : la maison de la copiste
 * dans la moitié droite du cadre) : un peu tournée vers l'ouest, la caméra regarde vers le nord-est ; de face, le pan de
 * roche de l'éperon prend toute la droite du cadre et la maison, à l'est de lui, n'y entre pas.
 */
const ARCHIVES_START = (-33 * Math.PI) / 180;

/**
 * Les rangs de dalles du sol de la scène (directeur artistique, lot commun : plus d'estrade grise) : du nord au sud, le
 * milieu du rang (depuis le sol de la scène), ses deux bouts (inégaux : le bord n'est pas une boîte), ses joints en
 * travers.
 */
const FLOOR_ROWS: readonly { z: number; from: number; to: number; joints: readonly number[] }[] = [
  { z: -0.7, from: -5.1, to: 5.35, joints: [-3.9, -2.65, -1.35, -0.05, 1.25, 2.55, 3.95] },
  { z: 0.7, from: -5.45, to: 5.05, joints: [-4.4, -3.2, -1.95, -0.7, 0.6, 1.9, 3.25] },
];

/** La profondeur d'un rang de dalles. */
const FLOOR_ROW_DEPTH = 1.4;

/**
 * Le sol de la scène : deux rangs de dalles chaudes (#D6B98E, tranche #B0926A), chacun jusqu'au plus bas du sol sous
 * lui, leurs bouts décalés ; sur le dessus, les dalles presque carrées, une sur trois un ton plus sombre (#CCAD80),
 * séparées par des joints de la couleur de la tranche.
 */
function sceneFloor(b: FacetBuilder, floor: Vec3): void {
  const deep = FLOOR_ROW_DEPTH;
  for (const [r, row] of FLOOR_ROWS.entries()) {
    const z = floor.z + row.z;
    let low = floor.y;
    for (let x = row.from; x <= row.to; x += 1) for (const dz of [-deep / 2, deep / 2]) low = Math.min(low, Math.max(heightAt({ x: floor.x + x, z: z + dz }), -0.3));
    const depth = Math.max(0.4, floor.y - low + 0.2);
    b.box({ x: floor.x + (row.from + row.to) / 2, y: floor.y - depth, z }, [row.to - row.from, depth, deep], C.pavingSide);
    const edges = [row.from, ...row.joints, row.to];
    const y = floor.y + 0.008;
    for (let k = 0; k < edges.length - 1; k++) {
      const [x0, x1] = [floor.x + edges[k] + 0.035, floor.x + edges[k + 1] - 0.035];
      const [z0, z1] = [z - deep / 2 + 0.035, z + deep / 2 - 0.035];
      b.quad([x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0], (k + 2 * r) % 3 === 1 ? C.pavingAlt : C.paving);
    }
  }
}

export const ARCHIVES: PlaceArt = {
  role: 'La copiste',
  model,
  traceStage: 2,
  // La scène : sur le parvis et le chemin, devant la façade, vue du sud ; le lagon reste à plus de trois unités au sud.
  sceneSpot: { dx: 0, dz: 4.4, half: [4.6, 1.4], fine: true },
  site: {
    rise: 0.12,
    keo: { dx: -2.6, dz: 0.25, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.6, dz: 0.25 },
    subject: { halfWidth: 3.7, bottom: -0.4, top: 3.2, depth: 0.3 },
    pitch: (18 * Math.PI) / 180,
    start: ARCHIVES_START,
  },
  // Le sol de la scène : des dalles de pierre chaude, à joints décalés, la suite du parvis, jusqu'au sol sous elle.
  decor(b, floor, at, sphere, body = true) {
    sceneFloor(b, floor);
    // Son modèle porte sa plume dans le chignon : celle du pion, à la main, part avec lui.
    if (body) copiste(b, at, sphere);
  },
  answer: {
    size: { height: DRAWER.h + DRAWER.cards, half: DRAWER.w / 2 + 0.04 },
    // Le banc de pierre sous les tiroirs : sa table de calcaire, deux blocs pour pieds, jusqu'au sol.
    base(b, mid, y, z, span, s, ground) {
      const t = 0.12 * s,
        d = 1.0 * s;
      b.box({ x: mid, y: y - t, z }, [span, t, d], C.limeShade, C.lime);
      for (const side of [-1, 1]) b.box({ x: mid + side * (span / 2 - 0.25 * s), y: ground - 0.1, z }, [0.34 * s, Math.max(0.05, y - t - ground + 0.1), d - 0.16 * s], C.limeShade, C.lime);
    },
    object(b, at, s, _i, _count, picked) {
      answerDrawer(b, at, s, picked ? DRAWER_TIPPED : 0);
    },
  },
  // Au repos : rien de plus que le parvis et la façade (calme, aucun témoin).
  rest() {},
  traces: {
    'missing-letters': {
      at: TRACE_SPOTS['missing-letters'],
      lift: 0.3,
      draw: (b, c) => {
        const o = TRACE_SPOTS['missing-letters'];
        mosaic(b, { ...groundOf(c, o.x, o.z), y: c.y });
      },
    },
    'word-families': { at: TRACE_SPOTS['word-families'], lift: 0.9, draw: (b, c) => tidyNiche(b, c) },
    'sight-words': {
      at: TRACE_SPOTS['sight-words'],
      lift: 0.4,
      draw: (b, c) => {
        const o = TRACE_SPOTS['sight-words'];
        chest(b, { ...groundOf(c, o.x, o.z), y: c.y + 0.06 });
      },
    },
    'word-forms': {
      at: TRACE_SPOTS['word-forms'],
      lift: 0.8,
      draw: (b, c) => {
        const o = TRACE_SPOTS['word-forms'];
        facetedStone(b, { ...groundOf(c, o.x, o.z), y: c.y + 0.06 });
      },
    },
  },
  // Kéo au retour : au sud-ouest de la porte, sur le sable, hors du chemin.
  exit: { x: -1.8, z: 6.9 },
};
