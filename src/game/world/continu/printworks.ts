// L'Imprimerie (GD-20, point 8, lot L7) : le lieu des confusions de lettres, sur sa cour aplanie au bord du lagon
// (`NORTH_FLATS`). Un atelier à colombages irréguliers sur crépi, son toit d'ardoise à pans inégaux et son toit de verre
// (le lanterneau, un mot interne : rien ne le dit à l'élève) décentré vers l'est ; la presse à bras à l'ouest ; la cour,
// la corde de séchage et l'établi. Rien de symétrique (directeur artistique, décisions L7, point 4) : aucune paire de
// fenêtres, de poteaux ou de colonnes de même forme qui se répondent ; les deux poteaux de la corde, les deux feuilles des
// réponses, le chapeau de l'imprimeur, tous différents. Ni lettre, ni plomb, ni casse, ni feuille imprimée, ni miroir.
// Dans le repère du lieu (le centre au sol en 0, le nord vers −z, la face sud vers la caméra), lu par places.ts,
// scenette.ts et questionScene.ts (placeArt.ts). Code pur.
import { FacetBuilder, type Facets } from './facets';
import { linearRgb, type Vec3 } from './geometry';
import type { AddPiece, PlaceArt, SiteGround } from './placeArt';
import { heightAt, standingHeight } from './terrain';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter sur une pente (places.ts). */
const SINK = -0.8;

const C = {
  // L'atelier (directeur artistique, intention L7) : le crépi Brume, les colombages, l'ardoise, le toit de verre opaque.
  crepi: 0xe5ebe3,
  timber: 0x6b4a32,
  slate: 0x4d6a82,
  slateEdge: 0x5f7c93,
  glass: 0xa9c9c4,
  // Les vitres des fenêtres : un cran plus sombre que le toit de verre (elles sont à l'ombre de l'auvent).
  pane: 0x8fadb0,
  door: 0x8a5a36,
  plinth: 0xb9b2a3,
  plinthTop: 0xa9a293,
  // La presse à bras, de fer : sombre au socle et à la vis seulement ; le bois de sa poignée et de l'établi.
  iron: 0x2f3e48,
  // Le dessus du fer et ses faces tournées vers la caméra (le sud) : un cran plus clair, pour que la presse ne se lise
  // jamais comme une masse sombre vue de la pose (directeur artistique, relecture de L7).
  ironTop: 0x4a5f6e,
  wood: 0xa9784a,
  woodTop: 0xc8955a,
  // La cour : des dalles de pierre sur la terre battue.
  yard: 0xd6bb86,
  flag: 0xc9bfa8,
  flagShade: 0xb3a990,
  // Les feuilles des réponses et leur liseré, la corde. Le papier, que rien d'autre ne prend dans le monde, se dessine
  // sans ombre, de sa couleur même (`PAPER_COLOR`, scene.ts) : il se lit comme du papier, jamais comme une dalle.
  paper: 0xf4efe2,
  edge: 0xc9d3d0,
  rope: 0xc9a36a,
  // Les traces : le cuivre du cornet, la pierre du marbre.
  copper: 0xc07a3e,
  copperIn: 0x9a5f2e,
  marble: 0xd3cfc4,
  marbleSide: 0xb4afa3,
  // L'imprimeur (directeur artistique) : chemise Sable, tablier Nuit océan, pantalon brun, chapeau de papier Brume.
  shirt: 0xdaa66a,
  apron: 0x142b38,
  trousers: 0x6b4a32,
  hat: 0xe5ebe3,
  hatFold: 0xc9d3d0,
  head: 0xe3c08a,
  // La ruine : délavée (crépi passé, bois gris, ardoise pâlie, fer usé), d'un ton moyen, jamais sombre.
  wornCrepi: 0xc4c4b8,
  wornCrepiTop: 0xb3b2a5,
  wornTimber: 0x9f9279,
  wornSlate: 0x96a3aa,
  wornIron: 0x8c969b,
  wornStone: 0xaaa08d,
  wornStoneTop: 0x9e9482,
} as const;

/**
 * L'atelier, dans le repère du lieu : ses murs de `x0` à `x1` et de `z0` (nord) à `z1` (la façade sud), leur épaisseur,
 * le dessus du soubassement, le haut des murs ; le toit, son faîtage reculé vers le nord (`ridgeZ`, le pan sud plus
 * long), sa hauteur au-dessus des murs, ses débords inégaux à l'ouest et à l'est.
 */
const SHOP = { x0: -3.6, x1: 3.6, z0: -4.0, z1: 0.2, wall: 0.3, plinth: 0.3, top: 2.7 } as const;
const ROOF = { ridgeZ: -2.35, rise: 1.85, west: 0.25, east: 0.5, eave: 0.35, drop: 0.15 } as const;

/**
 * La façade sud, de l'ouest à l'est : les poteaux (leur milieu et leur largeur, aucun deux fois le même), la porte,
 * la fenêtre haute et étroite à l'ouest, la fenêtre large et basse à l'est ; la lisse de l'ouest plus basse que celle de
 * l'est.
 */
const FACADE = {
  posts: [
    [-3.48, 0.24],
    [-2.35, 0.16],
    [-1.4, 0.2],
    [-0.3, 0.13],
    [0.75, 0.18],
    [2.95, 0.15],
    [3.54, 0.12],
  ],
  door: { x0: -1.28, x1: -0.38, top: 2.05 },
  tall: { x: -1.88, w: 0.42, y0: 0.85, y1: 2.2 },
  wide: { x0: 1.1, x1: 2.6, y0: 1.3, y1: 1.9 },
  railWest: 1.0,
  railEast: 1.3,
} as const;

/** La presse à bras, debout à l'ouest de l'atelier (le corps), et couchée dans la ruine, sa vis à côté. */
const PRESS = { x: -4.75, z: -1.0 } as const;
const FALLEN_PRESS = { x: -4.4, z: 1.7 } as const;

/** Le lanterneau : à cheval sur le faîtage, décentré vers l'est. */
const LANTERN = { x: 1.8, length: 1.8, depth: 1.3, glass: 0.42 } as const;

/** La corde de séchage des abords : ses deux poteaux, de formes différentes, à l'est de la cour, de biais. */
const LINE = { a: { x: 4.3, z: -0.5 }, b: { x: 6.0, z: 2.3 }, height: 1.9 } as const;

/** L'établi, devant la façade, sous la fenêtre large. */
const BENCH = { x: 1.85, z: 0.78, length: 1.7, depth: 0.55, height: 0.82 } as const;

/** Le haut du toit (sous le lanterneau) au-dessus du sol du lieu. */
const RIDGE = SHOP.top + ROOF.rise;

/**
 * Des facettes tournées dans le plan de l'écran (`roll`, autour de l'axe nord-sud, comme on couche une machine sur le
 * flanc), puis autour de la verticale (`yaw`), puis posées en `at` : la presse couchée de la ruine.
 */
function rolled(b: FacetBuilder, f: Facets, at: Vec3, roll: number, yaw = 0): void {
  const cr = Math.cos(roll), sr = Math.sin(roll), cy = Math.cos(yaw), sy = Math.sin(yaw);
  const turn = (v: Float32Array, k: number, move: boolean) => {
    const x = v[k] * cr - v[k + 1] * sr;
    const y = v[k] * sr + v[k + 1] * cr;
    const z = v[k + 2];
    v[k] = x * cy + z * sy + (move ? at.x : 0);
    v[k + 1] = y + (move ? at.y : 0);
    v[k + 2] = -x * sy + z * cy + (move ? at.z : 0);
  };
  for (let k = 0; k < f.positions.length; k += 3) {
    turn(f.positions, k, true);
    turn(f.normals, k, false);
  }
  b.append(f);
}

/** Recolore en `to` les faces de couleur `from` tournées vers le sud (la caméra) : la normale à plus de 60° de l'horizon sud. */
function southFaces(f: Facets, from: number, to: number): Facets {
  const [fr, fg, fb] = linearRgb(from);
  const [tr, tg, tb] = linearRgb(to);
  for (let k = 0; k < f.colors.length; k += 3) {
    if (f.normals[k + 2] <= 0.5) continue;
    if (Math.abs(f.colors[k] - fr) > 1e-6 || Math.abs(f.colors[k + 1] - fg) > 1e-6 || Math.abs(f.colors[k + 2] - fb) > 1e-6) continue;
    f.colors[k] = tr;
    f.colors[k + 1] = tg;
    f.colors[k + 2] = tb;
  }
  return f;
}

/**
 * La presse à bras, dans son repère (son pied en 0, face au sud) : un seul montant, à l'ouest, et sa potence qui passe
 * au-dessus du plateau ; la vis qui descend de la potence sur la platine ; le bras, tendu vers le sud-est, sa poignée de
 * bois. Rien de symétrique. Le socle et la vis de `iron` ; le dessus et les faces au sud du reste (plateau, montant,
 * potence, platine, bras) de `top`. `screw` faux : sans sa vis (tombée à côté, dans la ruine).
 */
function press(b: FacetBuilder, iron: number, top: number, wood: number, screw = true): void {
  b.box({ x: 0, y: SINK, z: 0 }, [1.15, 0.55 - SINK, 0.8], iron, top);
  const body = new FacetBuilder();
  body.box({ x: 0.05, y: 0.55, z: 0.02 }, [0.95, 0.1, 0.66], iron, top);
  body.box({ x: -0.44, y: 0.65, z: -0.12 }, [0.24, 1.15, 0.36], iron);
  body.box({ x: -0.12, y: 1.8, z: -0.12 }, [0.88, 0.24, 0.36], iron, top);
  body.box({ x: 0.08, y: 1.0, z: 0.0 }, [0.62, 0.1, 0.5], iron, top);
  if (screw) body.beam({ x: 0.08, y: 1.55, z: -0.05 }, { x: 0.7, y: 1.68, z: 0.55 }, 0.07, iron);
  b.append(southFaces(body.build(), iron, top));
  if (!screw) return;
  b.prism({ x: 0.08, y: 1.1, z: -0.05 }, 0.07, 0.07, 0.7, 6, iron);
  b.box({ x: 0.72, y: 1.6, z: 0.57, yaw: 0.6 }, [0.12, 0.2, 0.12], wood);
}

/** La vis de la presse, couchée au sol : sa tige, son écrou carré à un bout. */
function fallenScrew(b: FacetBuilder, x: number, z: number): void {
  b.beam({ x, y: 0.08, z }, { x: x + 0.75, y: 0.1, z: z + 0.25 }, 0.13, C.wornIron);
  b.box({ x: x + 0.05, y: 0, z: z + 0.02, yaw: 0.3 }, [0.24, 0.22, 0.24], C.wornIron);
}

/** Les murs de l'atelier, debout sur le soubassement, de toute leur hauteur ; `cut` : ébréchés (la ruine). */
function walls(b: FacetBuilder, side: number, face: number, cut: boolean): void {
  const { x0, x1, z0, z1, wall: t, plinth: p } = SHOP;
  // Chaque pan de mur : de `a` à `b` le long de son côté, sa hauteur ; ébréché, la ruine a des hauteurs inégales.
  const south: [number, number, number][] = cut ? [[x0, -2.75, 2.2], [-2.75, -1.3, 1.55], [-0.35, 1.15, 1.9], [1.15, x1, 1.15]] : [[x0, x1, SHOP.top]];
  const north: [number, number, number][] = cut ? [[x0, 0.5, 2.3], [0.5, x1, 1.65]] : [[x0, x1, SHOP.top]];
  const west: [number, number, number][] = cut ? [[z0 + t, z1 - t, 2.0]] : [[z0 + t, z1 - t, SHOP.top]];
  const east: [number, number, number][] = cut ? [[z0 + t, -1.8, 2.15], [-1.8, z1 - t, 1.35]] : [[z0 + t, z1 - t, SHOP.top]];
  for (const [a, c, h] of south) b.box({ x: (a + c) / 2, y: p, z: z1 - t / 2 }, [c - a, h - p, t], side, face);
  for (const [a, c, h] of north) b.box({ x: (a + c) / 2, y: p, z: z0 + t / 2 }, [c - a, h - p, t], side, face);
  for (const [a, c, h] of west) b.box({ x: x0 + t / 2, y: p, z: (a + c) / 2 }, [t, h - p, c - a], side, face);
  for (const [a, c, h] of east) b.box({ x: x1 - t / 2, y: p, z: (a + c) / 2 }, [t, h - p, c - a], side, face);
}

/** Le pan de toit d'ardoise, les deux pans inégaux, les pignons de crépi, la rive de l'égout sud. */
function roof(b: FacetBuilder): void {
  const xw = SHOP.x0 - ROOF.west,
    xe = SHOP.x1 + ROOF.east;
  const zs = SHOP.z1 + ROOF.eave,
    zn = SHOP.z0 - ROOF.eave;
  const eave = SHOP.top - ROOF.drop;
  const zr = ROOF.ridgeZ;
  // Le pan sud (long) et le pan nord (court), comme `gableRoof`, dont le faîtage est ici reculé.
  b.quad([xw, eave, zs], [xe, eave, zs], [xe, RIDGE, zr], [xw, RIDGE, zr], C.slate);
  b.quad([xe, eave, zn], [xw, eave, zn], [xw, RIDGE, zr], [xe, RIDGE, zr], C.slate);
  // Les pignons de crépi, dans le plan des murs ouest et est, du haut des murs au faîtage.
  for (const [x, sign] of [
    [SHOP.x0, -1],
    [SHOP.x1, 1],
  ] as const) {
    const a: [number, number, number] = [x, SHOP.top, SHOP.z1];
    const c: [number, number, number] = [x, SHOP.top, SHOP.z0];
    const r: [number, number, number] = [x, RIDGE - 0.08, zr];
    if (sign > 0) b.triangle(a, c, r, C.crepi);
    else b.triangle(c, a, r, C.crepi);
  }
  // La rive de l'égout sud, qui donne son épaisseur au toit vu de face ; un seul poinçon, au pignon ouest.
  b.box({ x: (xw + xe) / 2, y: eave - 0.12, z: zs - 0.04 }, [xe - xw, 0.14, 0.1], C.slateEdge);
  b.box({ x: SHOP.x0 - 0.03, y: SHOP.top, z: zr + 0.05 }, [0.08, RIDGE - SHOP.top - 0.25, 0.16], C.timber);
}

/** Les colombages de la façade sud et des pignons : poteaux, lisses, écharpes, aucun deux fois le même. */
function frame(b: FacetBuilder, wood: number): void {
  const zf = SHOP.z1 + 0.03;
  const d = 0.07;
  const p = SHOP.plinth;
  for (const [x, w] of FACADE.posts) b.box({ x, y: p, z: zf }, [w, SHOP.top - p, d], wood);
  // La sablière, en haut, et les deux lisses à des hauteurs différentes, à l'ouest et à l'est de la porte.
  b.box({ x: 0, y: SHOP.top - 0.16, z: zf + 0.005 }, [SHOP.x1 - SHOP.x0, 0.16, d], wood);
  b.box({ x: (SHOP.x0 - 1.4) / 2, y: FACADE.railWest, z: zf + 0.005 }, [-1.4 - SHOP.x0, 0.13, d], wood);
  b.box({ x: (-0.3 + SHOP.x1) / 2, y: FACADE.railEast, z: zf + 0.005 }, [SHOP.x1 + 0.3, 0.12, d], wood);
  // Le linteau de la porte, qui déborde à l'ouest seulement.
  b.box({ x: (FACADE.door.x0 + FACADE.door.x1) / 2 - 0.12, y: FACADE.door.top, z: zf + 0.008 }, [FACADE.door.x1 - FACADE.door.x0 + 0.34, 0.14, d], wood);
  // Les écharpes : raide à l'ouest, montante vers l'ouest à droite de la porte, couchée près de l'angle est.
  const brace = (ax: number, ay: number, cx: number, cy: number, t: number) => b.beam({ x: ax, y: ay, z: zf + 0.035 }, { x: cx, y: cy, z: zf + 0.035 }, t, wood);
  brace(-3.38, FACADE.railWest + 0.12, -2.45, SHOP.top - 0.16, 0.13);
  brace(0.68, FACADE.railEast + 0.1, -0.24, SHOP.top - 0.18, 0.11);
  brace(3.0, p + 0.05, 3.48, FACADE.railEast, 0.1);
  // Sur le pignon ouest, deux poteaux et une lisse ; sur le pignon est, un seul poteau et une écharpe.
  const xw = SHOP.x0 - 0.03;
  for (const [z, w] of [
    [-0.9, 0.16],
    [-2.9, 0.12],
  ] as const)
    b.box({ x: xw, y: p, z }, [d, SHOP.top - p, w], wood);
  b.box({ x: xw, y: 1.45, z: -1.9 }, [d, 0.12, 4.1], wood);
  const xe = SHOP.x1 + 0.03;
  b.box({ x: xe, y: p, z: -1.55 }, [d, SHOP.top - p, 0.17], wood);
  b.beam({ x: xe + 0.005, y: p + 0.1, z: -3.7 }, { x: xe + 0.005, y: SHOP.top - 0.2, z: -1.7 }, 0.12, wood);
}

/** La porte et les deux fenêtres de la façade (leurs vitres en aplat, opaques), leurs appuis. */
function openings(b: FacetBuilder): void {
  const zf = SHOP.z1 + 0.02;
  const { door, tall, wide } = FACADE;
  b.box({ x: (door.x0 + door.x1) / 2, y: SHOP.plinth, z: zf }, [door.x1 - door.x0, door.top - SHOP.plinth, 0.06], C.door);
  b.box({ x: tall.x, y: tall.y0, z: zf }, [tall.w, tall.y1 - tall.y0, 0.05], C.pane);
  b.box({ x: tall.x + 0.05, y: tall.y0 - 0.1, z: zf + 0.04 }, [tall.w + 0.2, 0.1, 0.12], C.timber);
  b.box({ x: (wide.x0 + wide.x1) / 2, y: wide.y0, z: zf }, [wide.x1 - wide.x0, wide.y1 - wide.y0, 0.05], C.pane);
  // Un seul meneau dans la fenêtre large, hors de son milieu.
  b.box({ x: wide.x0 + 0.55, y: wide.y0, z: zf + 0.04 }, [0.07, wide.y1 - wide.y0, 0.04], C.timber);
}

/** Le lanterneau : ses vitres opaques à cheval sur le faîtage, un montant hors du milieu, son chapeau d'ardoise. */
function lantern(b: FacetBuilder): void {
  const { x, length, depth, glass } = LANTERN;
  const y = RIDGE - 0.3;
  b.box({ x, y, z: ROOF.ridgeZ }, [length, glass + 0.3, depth], C.glass);
  b.box({ x: x - 0.35, y, z: ROOF.ridgeZ + depth / 2 + 0.01 }, [0.07, glass + 0.3, 0.04], C.timber);
  b.gableRoof({ x, y: RIDGE + glass, z: ROOF.ridgeZ }, length + 0.25, depth + 0.3, 0.32, C.slate, C.slateEdge);
}

/**
 * L'Imprimerie (lot L7). Avant : le soubassement de pierre, les murs debout mais ébréchés, le crépi passé, des bouts de
 * colombages gris ; le toit effondré dedans, ses plaques d'ardoise pâlie couchées dans l'atelier et une contre le mur
 * est ; pas de lanterneau ; la presse couchée dans la cour, sa vis à côté. Le corps : les murs crépis, les colombages, la
 * porte et les fenêtres, puis la presse redressée à l'ouest. Le haut : le toit d'ardoise à pans inégaux, ses pignons,
 * puis le lanterneau, à l'est. Les abords (les traces) : la cour dallée, puis la corde de séchage et l'établi. Ce qui
 * gît dans la ruine s'en va quand ce qui le relève se pose, jamais en double.
 */
function model(add: AddPiece, ground: SiteGround): void {
  // Le soubassement, le sol de l'atelier : il reste, les murs neufs se posent dessus.
  add('ruine', 0, (b) => b.box({ x: 0, y: SINK, z: (SHOP.z0 + SHOP.z1) / 2 }, [SHOP.x1 - SHOP.x0 + 0.2, SHOP.plinth - SINK, SHOP.z1 - SHOP.z0 + 0.2], C.wornStone, C.wornStoneTop));
  // Les murs debout, ébréchés, et des bouts de colombages délavés ; ils s'en vont quand les murs neufs se posent.
  add(
    'ruine',
    0,
    (b) => {
      walls(b, C.wornCrepi, C.wornCrepiTop, true);
      const zf = SHOP.z1 + 0.03;
      b.box({ x: -3.48, y: SHOP.plinth, z: zf }, [0.24, 1.9 - SHOP.plinth, 0.07], C.wornTimber);
      b.box({ x: 0.75, y: SHOP.plinth, z: zf }, [0.18, 1.6 - SHOP.plinth, 0.07], C.wornTimber);
      b.beam({ x: -3.38, y: 1.1, z: zf + 0.03 }, { x: -2.8, y: 2.0, z: zf + 0.03 }, 0.12, C.wornTimber);
    },
    { stage: 0, row: 0 },
  );
  // Le toit effondré : des plaques d'ardoise pâlie couchées de travers dans l'atelier, une contre le mur est, un chevron
  // tombé ; le haut les relève.
  add(
    'ruine',
    0,
    (b) => {
      b.box({ x: -1.6, y: SHOP.plinth, z: -2.2, yaw: 0.25, pitch: 0.35 }, [2.4, 0.1, 1.6], C.wornSlate);
      b.box({ x: 1.3, y: SHOP.plinth + 0.2, z: -1.5, yaw: -0.4, pitch: -0.5 }, [2.0, 0.1, 1.5], C.wornSlate);
      b.box({ x: SHOP.x1 + 0.45, y: 0, z: -2.6, yaw: Math.PI / 2, pitch: 0.95 }, [1.6, 0.1, 1.0], C.wornSlate);
      b.beam({ x: -2.9, y: SHOP.plinth + 0.05, z: -3.4 }, { x: 0.4, y: 1.5, z: -0.9 }, 0.14, C.wornTimber);
    },
    { stage: 1, row: 0 },
  );
  // La presse couchée sur le flanc dans la cour, et sa vis à côté ; redressée avec le corps.
  add(
    'ruine',
    0,
    (b) => {
      const f = new FacetBuilder();
      press(f, C.wornIron, C.wornIron, C.wornTimber, false);
      rolled(b, f.build(), { x: FALLEN_PRESS.x, y: 0.55, z: FALLEN_PRESS.z }, -Math.PI / 2 + 0.08, 0.5);
      fallenScrew(b, -5.4, 2.85);
    },
    { stage: 0, row: 0.67 },
  );
  // Le corps : les murs crépis, droits.
  add(0, 0, (b) => walls(b, C.crepi, C.crepi, false));
  // Les colombages, la porte, les fenêtres.
  add(0, 0.34, (b) => {
    frame(b, C.timber);
    openings(b);
  });
  // La presse redressée à l'ouest de l'atelier, sur sa dalle.
  add(0, 0.67, (b) => {
    b.box({ x: PRESS.x, y: SINK, z: PRESS.z }, [1.6, 0.06 - SINK, 1.3], C.flagShade, C.flag);
    const f = new FacetBuilder();
    press(f, C.iron, C.ironTop, C.wood);
    rolled(b, f.build(), { x: PRESS.x, y: 0.06, z: PRESS.z }, 0, 0);
  });
  // Le haut : le toit d'ardoise et ses pignons ; puis le lanterneau, à l'est du milieu.
  add(1, 0, (b) => roof(b));
  add(1, 0.5, (b) => lantern(b));
  // Les abords : la cour de terre battue et ses dalles de tailles inégales, de la façade vers la porte.
  add(2, 0, (b) => {
    b.box({ x: -0.1, y: SINK, z: 3.35, yaw: 0.03 }, [8.9, 0.04 - SINK, 5.9], C.flagShade, C.yard);
    for (const [x, z, w, d, yaw] of [
      [-0.85, 1.0, 1.3, 0.9, 0.08],
      [-2.4, 2.9, 1.0, 1.2, -0.12],
      [0.6, 2.4, 1.5, 0.8, 0.15],
      [2.9, 3.6, 0.9, 1.0, -0.05],
      [-0.4, 5.4, 1.2, 0.9, 0.2],
      [1.9, 6.0, 0.8, 0.7, -0.18],
    ] as const)
      b.box({ x, y: 0.03, z, yaw }, [w, 0.03, d], C.flagShade, C.flag);
  });
  // La corde de séchage, nue, entre deux poteaux différents : un poteau carré et sa jambe de force, un poteau rond plus
  // fin ; et l'établi sous la fenêtre large, trois pieds et son étau à un bout.
  add(2, 0.5, (b) => {
    const ga = ground.foot(LINE.a.x, LINE.a.z, 0.2);
    const gb = ground.foot(LINE.b.x, LINE.b.z, 0.2);
    const top = Math.max(ga.top, gb.top) + LINE.height;
    b.box({ x: LINE.a.x, y: ga.low - 0.3, z: LINE.a.z }, [0.18, top + 0.1 - ga.low + 0.3, 0.18], C.timber);
    b.beam({ x: LINE.a.x - 0.55, y: ga.top, z: LINE.a.z - 0.3 }, { x: LINE.a.x - 0.05, y: ga.top + 1.0, z: LINE.a.z - 0.03 }, 0.09, C.timber);
    b.prism({ x: LINE.b.x, y: gb.low - 0.3, z: LINE.b.z }, 0.07, 0.06, top + 0.3 - gb.low + 0.3, 6, C.wood);
    b.beam({ x: LINE.a.x, y: top, z: LINE.a.z }, { x: LINE.b.x, y: top + 0.05, z: LINE.b.z }, 0.035, C.rope);
    const { x, z, length, depth, height } = BENCH;
    b.box({ x, y: height - 0.1, z }, [length, 0.1, depth], C.wood, C.woodTop);
    for (const [dx, dz] of [
      [-length / 2 + 0.1, -depth / 2 + 0.08],
      [-length / 2 + 0.1, depth / 2 - 0.08],
      [length / 2 - 0.25, 0],
    ] as const)
      b.box({ x: x + dx, y: SINK, z: z + dz }, [0.1, height - 0.1 - SINK, 0.1], C.wood);
    b.box({ x: x + length / 2 - 0.12, y: height, z: z + depth / 2 - 0.06 }, [0.24, 0.16, 0.14], C.iron);
  });
}

/** Le sol sous un point du monde, au-dessus du sol du lieu (les traces, dessinées dans le monde). */
const groundAt = (x: number, z: number) => standingHeight(heightAt({ x, z }));

/**
 * Le rouleau encreur, dans le monde : son cylindre de fer couché le long de x, sa chape d'un seul côté et son manche de
 * bois (jamais symétrique). `c` : le milieu du cylindre ; `toward` : le bout du manche.
 */
function inkRoller(b: FacetBuilder, c: Vec3, r: number, width: number, toward: Vec3): void {
  b.drum({ x: c.x - width / 2, y: c.y, z: c.z, yaw: Math.PI / 2, pitch: Math.PI / 2 }, r, width, 8, C.iron);
  const fork = { x: c.x + width / 2 + 0.04, y: c.y, z: c.z };
  b.beam(fork, { x: fork.x + (toward.x - fork.x) * 0.35, y: fork.y + (toward.y - fork.y) * 0.35, z: fork.z + (toward.z - fork.z) * 0.35 }, 0.035, C.iron);
  b.beam({ x: fork.x + (toward.x - fork.x) * 0.35, y: fork.y + (toward.y - fork.y) * 0.35, z: fork.z + (toward.z - fork.z) * 0.35 }, toward, 0.06, C.wood);
}

/**
 * Les feuilles des réponses (Oreille du mineur, toujours deux), à l'échelle 1 : la hauteur de la corde au-dessus du sol
 * de la rangée ; à gauche (la place 0) la feuille large et basse, pincée sur la corde ; à droite (la place 1) la feuille
 * étroite et haute, pendue plus bas et décalée vers l'est (des distances inégales au milieu de la corde). La forme suit
 * la place, jamais la réponse (directeur artistique, décisions L7, point 4).
 */
const CORD = 1.12;
const SHEETS = [
  { w: 0.9, h: 0.52, drop: 0.04, shift: 0 },
  { w: 0.44, h: 0.8, drop: 0.18, shift: 0.12 },
] as const;
/** Une feuille choisie (une réponse tentée) penche, retenue par sa pince de gauche : sa forme le dit. */
const SHEET_TILT = -0.3;

/** Le papier des feuilles : la vue le dessine sans ombre (scene.ts, `unshadedLamp`) ; rien d'autre ne le prend. */
export const PAPER_COLOR = C.paper;

const PEG = 0.05;

export const PRINTWORKS: PlaceArt = {
  role: 'L’imprimeur',
  model,
  traceStage: 2,
  sceneSpot: { dx: 0, dz: 4.4, half: [4.6, 1.4], fine: true },
  site: {
    rise: 0.15,
    keo: { dx: -2.6, dz: 0.25, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.6, dz: 0.25 },
    subject: { halfWidth: 3.7, bottom: -0.4, top: 3.2, depth: 0.3 },
    pitch: (18 * Math.PI) / 180,
  },
  /**
   * Le sol de la scène, les dalles de la cour, et l'imprimeur, immobile : ses jambes brunes (le bas sombre, jamais un
   * fantôme), sa chemise Sable, son tablier Nuit océan par-devant, la tête, son chapeau de papier plié à une seule corne,
   * penchée vers l'est ; un bras le long du corps, l'autre plié, le rouleau encreur à la main, tendu vers Kéo.
   */
  decor(b, floor, at, sphere) {
    b.box({ x: floor.x, y: floor.y - 0.4, z: floor.z }, [9.4, 0.4, 2.8], C.flagShade, C.flag);
    for (const dx of [-3.1, 0.4, 2.0]) b.box({ x: floor.x + dx, y: floor.y, z: floor.z }, [0.05, 0.01, 2.8], C.flagShade);
    for (const dx of [-0.13, 0.13]) b.box({ x: at.x + dx, y: at.y, z: at.z }, [0.2, 0.46, 0.24], C.trousers);
    b.prism({ x: at.x, y: at.y + 0.44, z: at.z }, 0.31, 0.26, 0.48, 10, C.shirt);
    b.extrude(
      { x: at.x, y: at.y, z: at.z + 0.27 },
      [
        [-0.27, 0.16],
        [0.27, 0.16],
        [0.21, 0.86],
        [-0.21, 0.86],
      ],
      0.04,
      C.apron,
    );
    sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 10, 7, C.head);
    // Le chapeau de papier : son bord replié, et une seule corne, qui pointe vers l'est et vers le haut.
    b.prism({ x: at.x, y: at.y + 1.2, z: at.z }, 0.25, 0.24, 0.1, 8, C.hatFold);
    b.extrude(
      { x: at.x, y: at.y + 1.29, z: at.z - 0.07, yaw: -0.25 },
      [
        [-0.24, 0],
        [0.2, 0],
        [0.3, 0.3],
      ],
      0.14,
      C.hatFold,
      C.hat,
    );
    // Le bras droit (à l'est) le long du corps ; le bras gauche plié devant, le rouleau à la main, vers l'ouest.
    b.beam({ x: at.x + 0.28, y: at.y + 0.86, z: at.z + 0.02 }, { x: at.x + 0.36, y: at.y + 0.42, z: at.z + 0.06 }, 0.14, C.shirt);
    const hand = { x: at.x - 0.42, y: at.y + 0.62, z: at.z + 0.32 };
    b.beam({ x: at.x - 0.27, y: at.y + 0.86, z: at.z + 0.04 }, { x: at.x - 0.36, y: at.y + 0.62, z: at.z + 0.1 }, 0.14, C.shirt);
    b.beam({ x: at.x - 0.36, y: at.y + 0.62, z: at.z + 0.1 }, hand, 0.13, C.shirt);
    inkRoller(b, { x: hand.x - 0.35, y: hand.y - 0.18, z: hand.z + 0.02 }, 0.07, 0.26, hand);
  },
  answer: {
    size: { height: CORD + 0.12, half: 0.5 },
    // La corde et ses deux poteaux, de formes différentes : à l'ouest, un poteau carré et sa jambe de force ; à l'est, un
    // poteau rond, plus fin, coiffé d'une cheville.
    base(b, mid, y, z, span, s, ground) {
      const top = y + CORD * s;
      const xa = mid - span / 2,
        xb = mid + span / 2;
      b.box({ x: xa, y: ground - 0.1, z }, [0.12 * s, top + 0.06 * s - ground + 0.1, 0.12 * s], C.timber);
      b.beam({ x: xa - 0.35 * s, y: ground, z: z - 0.05 * s }, { x: xa - 0.04 * s, y: ground + 0.7 * s, z }, 0.06 * s, C.timber);
      b.prism({ x: xb, y: ground - 0.1, z }, 0.05 * s, 0.04 * s, top + 0.12 * s - ground + 0.1, 6, C.wood);
      b.box({ x: xb, y: top + 0.12 * s, z, yaw: 0.4 }, [0.11 * s, 0.06 * s, 0.11 * s], C.timber);
      b.beam({ x: xa, y: top, z }, { x: xb, y: top, z }, 0.025 * s, C.rope);
    },
    // La feuille de la place `i` : blanche, liserée, rien d'écrit dessus ; pincée à la corde ; toujours immobile.
    object(b, at, s, i, _count, picked) {
      const sheet = SHEETS[Math.min(i, SHEETS.length - 1)];
      const w = sheet.w * s,
        h = sheet.h * s;
      const cord = at.y + CORD * s;
      const x = at.x + sheet.shift * s;
      const top = cord - sheet.drop * s;
      // Le pivot : la pince de gauche ; penchée, la feuille tourne autour d'elle dans le plan de l'écran.
      const pivot = { x: x - w / 2 + 0.06 * s, y: top };
      const tilt = picked ? SHEET_TILT : 0;
      const cs = Math.cos(tilt), sn = Math.sin(tilt);
      const corner = (dx: number, dy: number, inset: number): [number, number] => {
        const px = x - w / 2 + (dx ? w - inset : inset) - pivot.x;
        const py = top - (dy ? h - inset : inset) - pivot.y;
        return [pivot.x + px * cs - py * sn - at.x, pivot.y + px * sn + py * cs - at.y];
      };
      const outline = (inset: number) => [corner(0, 1, inset), corner(1, 1, inset), corner(1, 0, inset), corner(0, 0, inset)];
      b.extrude({ x: at.x, y: at.y, z: at.z - 0.01 * s }, outline(0), 0.02 * s, C.edge, C.edge);
      b.plate({ x: at.x, y: at.y, z: at.z + 0.04 * s }, outline(0.045 * s), C.paper);
      // Les pinces de bois : une à gauche, sur la corde ; l'autre au coin droit, sauf si la feuille penche (elle a lâché).
      const pin = (px: number, py: number) => b.box({ x: px, y: py - PEG * s, z: at.z }, [0.05 * s, (cord - py) + 0.12 * s, 0.06 * s], C.wood);
      pin(pivot.x, top);
      if (!picked) pin(x + w / 2 - 0.07 * s, top);
    },
  },
  // Les missions en R au repos : la cour seule, rien de l'item ne s'y montre ; la corde des réponses suffit.
  rest() {},
  traces: {
    // Oreille du mineur : le cornet acoustique de cuivre, fixé au mur entre la porte et l'établi ; son tuyau sort du mur,
    // son pavillon se tourne de profil vers l'est, le long du mur, un peu levé : vu de la cour, un cône, jamais un rond
    // plein qui se lirait comme une horloge (référent dys, relecture de L7).
    'sound-discrimination': {
      at: { x: 0.25, z: 0.6 },
      lift: 1.5,
      draw(b, c) {
        const wall = { x: c.x + 0.25, y: c.y + 1.45, z: c.z + SHOP.z1 + 0.06 };
        b.box({ x: wall.x, y: wall.y - 0.16, z: wall.z }, [0.16, 0.32, 0.06], C.timber);
        const elbow = { x: wall.x + 0.02, y: wall.y, z: wall.z + 0.26 };
        b.beam(wall, elbow, 0.08, C.copper);
        b.prism({ x: elbow.x - 0.02, y: elbow.y, z: elbow.z, yaw: Math.PI / 2 - 0.12, pitch: Math.PI / 2 - 0.2 }, 0.05, 0.24, 0.42, 10, C.copper, C.copperIn);
      },
    },
    // Le Filon : le marbre, une table de pierre lisse sur son bâti de bois, dans la cour à l'ouest de la porte, et son
    // rouleau encreur couché dessus, son manche d'un seul côté.
    'letter-pairs': {
      at: { x: -2.7, z: 2.0 },
      lift: 0.9,
      draw(b, c) {
        const at = { x: c.x - 2.7, z: c.z + 2.0 };
        const g = groundAt(at.x, at.z);
        b.box({ x: at.x, y: g - 0.3, z: at.z, yaw: 0.1 }, [1.1, 1.05, 0.7], C.wood, C.woodTop);
        b.box({ x: at.x + 0.05, y: g + 0.75, z: at.z, yaw: 0.1 }, [1.35, 0.14, 0.86], C.marbleSide, C.marble);
        const y = g + 0.89 + 0.07;
        inkRoller(b, { x: at.x - 0.15, y, z: at.z + 0.08 }, 0.07, 0.34, { x: at.x + 0.5, y: y + 0.12, z: at.z + 0.32 });
      },
    },
  },
  exit: { x: -1.2, z: 6.6 },
};

