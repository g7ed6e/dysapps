// Le Gaillard (GD-22, lot 15 ; intention du directeur artistique du 21 octobre 2026, planche `selection-gaillard-v1`
// validée par le mainteneur) : « la maison haute des capitaines venus d'ailleurs, et sa galerie de portraits de navires ».
// Le cœur, sans figure : la galerie ouverte de l'étage et ses cinq cadres, chacun au milieu de sa travée. La maison est au
// milieu du plateau des Aiguilles, loin du rebord : un corps long, faîtage est-ouest, son long pan au sud face à la porte
// du lieu ; un rez d'enduit passé sur un socle bas de pierre grise, la porte de planches au milieu et son linteau aux
// racines, une fenêtre de chaque côté ; à l'étage, la loggia dans l'épaisseur du mur, entre les deux murs des bouts, son
// plancher un peu en débord, son garde-corps (deux lisses parallèles sur des barreaux droits), ses quatre poteaux droits
// entre cinq travées égales ; un toit d'ardoise à deux pans et deux cheminées carrées, une à chaque pignon ; à l'est, la
// petite aile plus basse, en retrait, sous un toit d'un pan ; au dos, la fenêtre de poupe à cinq pans d'une seule vitre
// haute chacun, sur ses corbeaux, sous un petit auvent d'ardoise. Autour, la cour de dalles chaudes, à joints gris nets,
// posée à plat sur le plateau (un plan qui suit sa pente douce, sans marche à la porte).
// Le signe de l'absence : la longue-vue des capitaines, de bronze, prise par les Ferrailleurs, a laissé sur son socle rond
// de pierre, au bord est de la cour, un trou rond brun très sombre et quatre goujons de fer courts ; rien n'est posé
// dessus, il ne change jamais.
//
// La ruine : tout est là, tombé ou cassé, jamais un chantier. La moitié ouest du toit est tombée, le haut des murs de l'ouest
// s'arrête en coupe plate en pente ; le pan sud a glissé d'un seul panneau couché contre le socle, à l'ouest du perron ;
// les deux cheminées couchées sur la cour ; dans la galerie, le plancher penche à l'ouest, les deux poteaux de l'ouest
// couchés à plat, les lisses couchées, trois cadres vides couchés et deux qui pendent de travers à l'est ; l'enduit tombé
// par plaques, des fissures ; le perron fendu, sa dernière marche inclinée ; la porte fermée ; un volet couché, l'autre
// qui pend ; la fenêtre de poupe sur ses corbeaux, deux pans brisés, un volet couché au pied du mur nord ; une lanterne
// éteinte couchée au pied d'un piquet penché, au bord ouest de la cour. Une seule lumière, celle de la peintre, sur sa
// perche à droite de la porte. Cinq parties (3 + 1 + 1) : le corps en trois (la cour, le socle, le rez, la porte et les
// fenêtres ; l'étage, la galerie, ses cadres et leurs toiles nues, la fenêtre de poupe ; le haut des murs, les pignons et
// l'aile), le haut (les toits, les cheminées, la lanterne de la galerie), les abords (le perron, les six volets, la
// bordure de pierres, la lanterne du chemin, les cinq toiles peintes). Une trace par mission, avec sa partie (`stage`,
// `row`). Rien ne bouge, rien à lire dans la 3D, rien de croisé. Code pur (placeArt.ts).
import type { Stage } from './construction';
import { drawPosed, FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_5E, PATH_NODES_5E, PLACES_5E } from './plan5e';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter sur une pente (places.ts). */
const SINK = -0.8;

type P3 = readonly [number, number, number];

/**
 * Les couleurs du Gaillard : les matières des Passeurs de l'Auberge (l'enduit passé, le bois brun désaturé neuf et usé,
 * l'ardoise bleue, délavée dans la ruine, la pierre grise du plateau, le fer, le bronze éteint des seules ferrures), les
 * dalles chaudes des Aiguilles et leurs joints gris (communs du lot 13) ; le dedans brun très sombre, jamais noir ; la vitre
 * sombre unie. La seule lumière, l'ocre des lanternes ; une lanterne éteinte a la vitre #BFC4B8. Les toiles : des aplats,
 * un fond par toile (aucune teinte ne porte de sens), une bande de mer, un sujet (un voilier, coque #4E4034, voiles Brume ;
 * une aiguille de pierre grise, une face au soleil, une à l'ombre).
 */
const C = {
  tile: 0xcfc6b4,
  tileWorn: 0xbdb4a2,
  joint: 0x777d77,
  jointWorn: 0x9a9b92,
  stone: COLORS_5E.stone,
  stoneSun: COLORS_5E.stoneSun,
  stoneShade: COLORS_5E.stoneShade,
  wall: 0xb9ae98,
  wallTop: 0xc6bca6,
  wallWorn: 0xaca28c,
  crack: 0x7d7466,
  newWood: 0xa68672,
  newShade: 0x8c766a,
  wornWood: 0x9f9279,
  wornShade: 0x86775f,
  plank: COLORS_5E.plank,
  plankShade: COLORS_5E.plankShade,
  door: 0x7d6650,
  doorLine: 0x6a5644,
  inside: 0x3a312c,
  // Le bois des cadres vides de la ruine, plus sombre et plus rouge que les lisses et les poteaux couchés.
  frameWorn: 0x6b5443,
  attic: 0x5e5046,
  glass: 0x4f5a5e,
  slate: 0x5b7c99,
  slateEdge: 0x4d6a83,
  slateWorn: 0x6f8089,
  slateWornEdge: 0x617079,
  verdigris: 0x6f9a8a,
  iron: 0x6f6a60,
  bronze: 0x9c8452,
  lantern: COLORS_5E.lantern,
  lanternOff: 0xbfc4b8,
  // Les toiles : la toile nue (Brume, plus claire que l'enduit), la mer, la coque, les voiles, l'aiguille peinte.
  brume: 0xe5ebe3,
  // Le creux d'une voile gonflée, une seconde teinte de Brume, plus sombre.
  sailBelly: 0xc3cbc4,
  sea: 0x3f6272,
  hull: 0x4e4034,
  needleSun: 0xaeb0a3,
  needleShade: 0x777d77,
  // Les traces : la palette de bois clair et ses trois taches mates, la toile écrue du rouleau et sa ficelle, les pots de
  // grès gris-bleu, la chaux du seau, les poils naturels des brosses et des pinceaux (sans couleur), le grès du pot.
  palette: 0xb39773,
  dabBlue: 0x6f8089,
  dabBrick: 0x9c5e4a,
  dabOlive: 0x8a9a5a,
  linen: 0xd8cdb4,
  twine: 0x8c766a,
  jar: 0x7f8a8c,
  jarLid: 0x6e787a,
  lime: 0xe8e4da,
  bristle: 0xd8c49a,
  stoneware: 0x8a7d6a,
  stonewareTop: 0x6f6456,
  // La peintre, en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, jupe brune, blouse bleu-gris, foulard
  // terre cuite (la seule terre cuite du premier plan).
  boots: 0x55595a,
  skirt: 0x6f5a48,
  smock: 0x7d8b98,
  head: 0xe3b48a,
  scarf: 0xb0674a,
} as const;

/** Les fonds des cinq toiles, d'ouest en est (directeur artistique, § 5) : bleu-gris, olive, brique sourde, Vert île, brun. */
const CANVAS_GROUNDS = [0x6f8089, 0x8a9a5a, 0x9c5e4a, 0x438b82, 0x7a6455] as const;

// ---------- Le repère du lieu ----------

/** Le centre du lieu et le sol sous lui, dans le monde. */
const CENTER: Vec2 = PLACES_5E.find((p) => p.id === 'gaillard')!.center;
const H0 = standingHeight(heightAt5e(CENTER));

/** Le sol du 5e sous un point du repère du lieu, depuis le sol de son centre (comme `SiteGround.at`). */
const localGround = (lx: number, lz: number): number => standingHeight(heightAt5e({ x: CENTER.x + lx, z: CENTER.z + lz })) - H0;

/**
 * La cour, de l'ordre de 21 sur 16, qui fait le tour de la maison : ses bords (x d'ouest en est, z du nord au sud). Son
 * bord sud passe juste au nord du nœud de la porte (`door`, en z = 8) : Kéo s'arrête au bout de la chaussée, au bord de la
 * cour, sans marche.
 */
const YARD = { x0: -9.5, x1: 12, z0: -10, z1: 7.5 } as const;

/**
 * Le dessus de la cour : un plan (y = a + b x + c z) ajusté au sol du plateau sous elle (aux moindres carrés, puis
 * resserré), relevé juste assez pour ne jamais passer sous le sol, plus 0,03 (le plateau ondule à peine ici, de ±0,2) : la
 * cour paraît à plat et rejoint le sol à la porte sans marche ni seuil.
 */
const YARD_PLANE = (() => {
  const pts: [number, number, number][] = [];
  for (let x = YARD.x0; x <= YARD.x1 + 1e-6; x += 0.5) for (let z = YARD.z0; z <= YARD.z1 + 1e-6; z += 0.5) pts.push([x, z, localGround(x, z)]);
  // Les équations normales d'un plan, centrées (le centre de la cour), pour un système à deux inconnues.
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
  // Puis la pente qui serre le mieux le sol, cherchée autour de celle-là : le plus petit écart entre le plus haut et le plus
  // bas du sol, mesurés depuis le plan (le relevé ne dépend que de cet écart).
  const spread = (bb: number, cc: number): [number, number] => {
    let lo = Infinity,
      hi = -Infinity;
    for (const [x, z, y] of pts) {
      const d = y - bb * x - cc * z;
      lo = Math.min(lo, d);
      hi = Math.max(hi, d);
    }
    return [hi - lo, hi];
  };
  const [w0, hi0] = spread(b, c);
  let best = { b, c, w: w0, hi: hi0 };
  for (let i = -10; i <= 10; i++)
    for (let k = -10; k <= 10; k++) {
      const [w, hi] = spread(b + i * 0.001, c + k * 0.001);
      if (w < best.w) best = { b: b + i * 0.001, c: c + k * 0.001, w, hi };
    }
  return { a: best.hi + 0.03, b: best.b, c: best.c };
})();

/** Le dessus des dalles de la cour, en un point du repère. */
const yardY = (x: number, z: number): number => YARD_PLANE.a + YARD_PLANE.b * x + YARD_PLANE.c * z;

/**
 * La maison (hauteurs depuis `HY`, le dessus de la cour sous son milieu) : le corps, de 12 sur 6,6, son long pan au sud
 * (`z1`), à 7 au nord de la porte du lieu ; le socle, le rez d'enduit jusqu'à 4, l'étage jusqu'à l'égout (8), le faîte
 * (10,3, un toit de 34° : la planche dit 35 à 40) au-dessus de `ridgeZ` ; le débord du toit et l'épaisseur de ses pans ;
 * `top` : le haut de l'étage du corps 2, sous la bande du haut des murs. À l'échelle de Kéo, qui mesure 2,6 (retouche 1,
 * demande du mainteneur du 21 octobre 2026 : « La maison paraît trop petite par rapport au personnage ») : sa porte le
 * dépasse, son rez fait une fois et demie sa taille. La caméra qui suit ne verrait que 7,7 au-dessus de la cour : le
 * lieu a sa vue d'arrivée, plus reculée (`DOOR_FRAME`), où la maison tient entière, cheminées comprises, sans toucher le
 * bord haut (un test le vérifie).
 */
const HOUSE = {
  x: 6,
  z0: -5.6,
  z1: 1,
  socle: 0.5,
  rez: 4,
  top: 7.75,
  eave: 8.05,
  ridge: 10.3,
  ridgeZ: -2.3,
  overhang: 0.45,
  slab: 0.22,
} as const;

/** Le dessus de la cour sous le milieu de la maison : le pied de ses hauteurs. */
const HY = yardY(0, (HOUSE.z0 + HOUSE.z1) / 2);

/** La petite aile, plus basse, en retrait à l'est : ses murs jusqu'à `top`, son toit d'un pan, de `high` contre le corps. */
const WING = { x0: HOUSE.x, x1: 9.4, z0: -5, z1: 0, top: 4.7, high: 6.4, overhang: 0.45 } as const;

/**
 * La galerie, une loggia dans l'épaisseur de l'étage, entre les deux murs des bouts (`half`) : son mur du fond (`back`),
 * son plancher (de `floor` à `floorTop`, en débord jusqu'à `front`), ses quatre poteaux droits (en `postZ`, de section
 * `post`), son garde-corps (deux lisses parallèles, en `rails`, sur des barreaux droits, en `railZ`). Le fond est à 0,35
 * des poteaux : vus du cap de « Y aller », ils tombent entre les cadres (un test le vérifie). Le garde-corps arrive à la
 * taille de Kéo (sa main courante à 1,2 du plancher).
 */
const LOGGIA = {
  half: 5.4,
  back: 0.45,
  floor: 4,
  floorTop: 4.18,
  front: 1.45,
  postZ: 0.8,
  post: 0.26,
  rails: [4.75, 5.3],
  railZ: 1.34,
  bars: 3,
} as const;

/** La largeur d'une travée, et le milieu de chacune, d'ouest en est. */
const BAY = (2 * LOGGIA.half) / 5;
const BAYS = [0, 1, 2, 3, 4].map((k) => -LOGGIA.half + BAY * (k + 0.5));
/** Les quatre poteaux, entre les travées. */
const POSTS = [1, 2, 3, 4].map((k) => -LOGGIA.half + BAY * k);

/** Les cadres, au milieu de leur travée, sur le mur du fond : leur largeur, leur hauteur, leur bas ; la toile en retrait. */
const FRAME = { w: 1.2, h: 2, y0: 5.5, depth: 0.1, inset: 0.13, corner: 0.17 } as const;

/** La porte de planches, droite, au milieu du rez : sa demi-largeur et son haut ; les fenêtres de part et d'autre. */
const DOOR = { half: 0.7, top: 3.3 } as const;
const WINDOWS = { x: [-2.9, 2.9], y: 2.2, half: 0.55 } as const;
/** La largeur d'un volet du rez. */
const SHUTTER = 0.58;

/** Le perron : trois marches de pierre devant la porte, de `depth` chacune, sur `half` de part et d'autre. */
const PERRON = { half: 1.2, depth: 0.5, steps: 3 } as const;

/** La fenêtre de poupe, au dos, à l'étage : son milieu, son rayon le long du mur, sa saillie, le bas et le haut des vitres. */
const POUPE = { x: 0, r: 1.65, d: 1.05, y0: 4.9, y1: 6.6 } as const;

/**
 * Les deux cheminées carrées de pierre, une à chaque pignon, sur le faîte : leur place, leur côté, leur haut sur le faîte
 * (la souche sort de 0,75 au-dessus du dessus des ardoises, son chapeau en plus : retouche 0).
 */
const CHIMNEY = { x: 5.4, w: 1, above: 1.05 } as const;

/** La perche de la peintre, à droite de la porte, plantée dans la cour (jamais au mur), et sa lanterne : la seule de la ruine. */
const PERCH = { x: 1.75, z: 1.9, h: 2.4, arm: 0.4 } as const;

/**
 * La lanterne du chemin, petite, sur un piquet au bord ouest de la cour, en tête de la chaussée, à l'écart du chemin ;
 * reculée vers le nord-ouest le long de ce bord (retouche 1) : jamais au premier plan de « Y aller ».
 */
const PATH_LANTERN = { x: -8.6, z: 4.9, h: 1.2 } as const;

/** La lanterne de la galerie, sur une console au mur du bout est de la loggia, sous le toit, jamais devant un cadre. */
const GALLERY_LANTERN = { x: LOGGIA.half - 0.2, y: 7.3, z: (LOGGIA.back + HOUSE.z1) / 2 } as const;

/**
 * Le socle de la longue-vue prise, au bord est de la cour, face au large, hors du chemin, au sud-est de l'aile (qui le
 * cacherait du cap de « Y aller » plus au nord) : un rond de pierre grise à hauteur de genou, le trou rond brun très sombre sur le dessus, et quatre goujons de fer courts autour (jamais un anneau, jamais
 * huit pointes : ni couronne, ni horloge).
 */
const SPYGLASS = { x: 10.9, z: 1.2, r: 0.55, h: 0.55, hole: 0.19, studs: 0.36, stud: 0.09 } as const;

/** Les angles des quatre goujons autour du trou (en radians, depuis l'est, vers le sud) : des écarts de 70, 110, 50 et 130°. */
const SPYGLASS_STUDS = [20, 90, 200, 250].map((d) => (d * Math.PI) / 180);

/** Le pas de la porte du lieu, au bout de la branche d'`aig-5`, depuis le centre ; et `aig-5`. */
const DOOR_AT: Vec2 = (() => {
  const n = PATH_NODES_5E.find((p) => p.id === 'gaillard')!.at;
  return { x: n.x - CENTER.x, z: n.z - CENTER.z };
})();
const AIG5: Vec2 = (() => {
  const n = PATH_NODES_5E.find((p) => p.id === 'aig-5')!.at;
  return { x: n.x - CENTER.x, z: n.z - CENTER.z };
})();

/**
 * Le cap de la caméra de « Y aller » (directeur artistique, « La caméra ») : tourné de 30° vers l'est depuis le nord (cap
 * nord-nord-est), la maison au centre, entière, l'aiguille de l'est à droite. La caméra regarde vers −(sin cap, cos cap).
 */
const DOOR_VIEW = (-30 * Math.PI) / 180;

/**
 * La vue d'arrivée de « Y aller » (retouche 1) : la caméra qui suit, montée de `height` et reculée de `back` fois, le regard
 * moins plongeant (Kéo garde sa place à l'écran) : la maison à l'échelle de Kéo y tient entière, cheminées comprises, à
 * 12 pixels au moins du bord haut, l'aiguille de l'est dans le cadre (des tests le vérifient). Elle rejoint la caméra qui
 * suit quand Kéo part.
 */
const DOOR_FRAME = { height: 1, back: 1.6 } as const;

/**
 * Le point du nom sur la Carte, depuis le centre du lieu (`PlaceArt.mapPoint`, comme au Sémaphore, lot 14) : sur l'axe
 * du faîte, 1,5 au-dessus du haut des cheminées. Le même en ruine et restauré : le nom ne suit plus la marque, du haut de
 * la ruine au faîte, et ne se pose plus sur la maison.
 */
const MAP_POINT: Vec3 = { x: 0, y: HY + HOUSE.ridge + CHIMNEY.above + 0.16 + 1.5, z: HOUSE.ridgeZ };

// ---------- Les petits volumes ----------

/** Un aplat debout tourné vers le sud (+z), de `x0` à `x1`, de `y0` à `y1`. */
function southPlate(b: FacetBuilder, x0: number, x1: number, y0: number, y1: number, z: number, color: number): void {
  b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], color);
}

/** Un aplat debout tourné vers le nord (−z). */
function northPlate(b: FacetBuilder, x0: number, x1: number, y0: number, y1: number, z: number, color: number): void {
  b.quad([x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z], color);
}

/** Un aplat couché sur la cour, tourné vers le ciel, aux quatre coins donnés (du sud-ouest, dans le sens inverse des aiguilles d'une montre vu d'en haut). */
function groundQuad(b: FacetBuilder, pts: readonly Vec2[], lift: number, color: number): void {
  const v = (p: Vec2): P3 => [p.x, yardY(p.x, p.z) + lift, p.z];
  b.quad(v(pts[0]), v(pts[1]), v(pts[2]), v(pts[3]), color);
}

/** Une bande de joint sur la cour, d'un point à un autre, de demi-largeur 0,03. */
function joint(b: FacetBuilder, a: Vec2, c: Vec2, color: number): void {
  const l = Math.hypot(c.x - a.x, c.z - a.z);
  const nx = (-(c.z - a.z) / l) * 0.03;
  const nz = ((c.x - a.x) / l) * 0.03;
  groundQuad(
    b,
    [
      { x: a.x + nx, z: a.z + nz },
      { x: c.x + nx, z: c.z + nz },
      { x: c.x - nx, z: c.z - nz },
      { x: a.x - nx, z: a.z - nz },
    ],
    0.012,
    color,
  );
}

/**
 * Un volume à dessus libre : `top` (dans le sens inverse des aiguilles d'une montre vu d'en haut) et son dessous à `low`
 * sous lui (ou à la hauteur `floor`) ; ses côtés, son dessus, son dessous (sauf `open`).
 */
function slab(b: FacetBuilder, top: readonly P3[], low: { by?: number; floor?: number }, color: number, face: number, open = false): void {
  const bot = top.map(([x, y, z]) => [x, low.floor ?? y - (low.by ?? 0), z] as const);
  const n = top.length;
  for (let k = 1; k < n - 1; k++) b.triangle(top[0], top[k], top[k + 1], face);
  if (!open) for (let k = 1; k < n - 1; k++) b.triangle(bot[0], bot[k + 1], bot[k], face);
  for (let k = 0; k < n; k++) {
    const m = (k + 1) % n;
    b.quad(bot[k], bot[m], top[m], top[k], color);
  }
}

/** Une lanterne pendue (sa vitre, un pavé : dix triangles ; son chapeau de bronze en pointe), d'ocre ou éteinte. */
function lantern(b: FacetBuilder, top: Vec3, lit: boolean, s = 1): void {
  b.box({ x: top.x, y: top.y - 0.34 * s, z: top.z }, [0.24 * s, 0.3 * s, 0.24 * s], lit ? C.lantern : C.lanternOff);
  b.prism({ x: top.x, y: top.y - 0.04 * s, z: top.z, yaw: Math.PI / 4 }, 0.21 * s, 0, 0.16 * s, 4, C.bronze);
}

/** Les points d'un rectangle tourné de `a` autour de son coin `(px, py)` (un volet qui pend, un cadre de travers). */
function turned(pts: readonly (readonly [number, number])[], a: number): (readonly [number, number])[] {
  return pts.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)] as const);
}

/** Un rectangle centré de `w` sur `h`, pour `plate`. */
const rect = (w: number, h: number): (readonly [number, number])[] => [
  [-w / 2, -h / 2],
  [w / 2, -h / 2],
  [w / 2, h / 2],
  [-w / 2, h / 2],
];

/**
 * Un cadre vide (la ruine) : ses quatre montants en aplats, l'enduit nu au travers, ses quatre coins de bronze (ceux des
 * cadres de la galerie : couché parmi les lisses, il se lit encore comme un cadre) ; décalé de (`ox`, `oy`) puis tourné de
 * `a` dans son plan (un cadre qui pend par un coin tourne autour de ce coin).
 */
function emptyFrame(l: FacetBuilder, a: number, wood: number, ox = 0, oy = 0): void {
  const w = FRAME.w / 2,
    h = FRAME.h / 2,
    t = 0.15;
  const bars: (readonly [number, number])[][] = [
    [
      [-w, -h],
      [w, -h],
      [w, -h + t],
      [-w, -h + t],
    ],
    [
      [-w, h - t],
      [w, h - t],
      [w, h],
      [-w, h],
    ],
    [
      [-w, -h + t],
      [-w + t, -h + t],
      [-w + t, h - t],
      [-w, h - t],
    ],
    [
      [w - t, -h + t],
      [w, -h + t],
      [w, h - t],
      [w - t, h - t],
    ],
  ];
  for (const bar of bars)
    l.plate(
      { x: 0, y: 0, z: 0 },
      turned(
        bar.map(([x, y]) => [x + ox, y + oy] as const),
        a,
      ),
      wood,
    );
  const c = FRAME.corner;
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      const cx = sx * (w - c / 2) + ox,
        cy = sy * (h - c / 2) + oy;
      l.plate(
        { x: 0, y: 0, z: 0.012 },
        turned(
          rect(c, c).map(([x, y]) => [x + cx, y + cy] as const),
          a,
        ),
        C.bronze,
      );
    }
}

/**
 * La coupe de l'étage en ruine, à l'ouest : l'étage reste plein à l'est de `x` (sous le bout du toit qui tient) ; à
 * l'ouest, ses murs en bandes de `wall` d'épaisseur, coupés en pente de son haut (en `x`) jusqu'à `low` au pignon.
 */
const RUIN_CUT = { x: -0.6, low: 5.3, wall: 0.3 } as const;

/**
 * Un mur de l'étage en ruine à l'ouest, de `z0` à `z1`, coupé en pente (`RUIN_CUT`) : sa face du dehors d'enduit usé, sa
 * face du dedans brun très sombre, sa coupe plate d'enduit clair ; `south` : son dehors au sud (le mur du fond de la
 * galerie), sinon au nord.
 */
function cutWall(b: FacetBuilder, z0: number, z1: number, south: boolean): void {
  const H = HOUSE;
  const R = RUIN_CUT;
  const pts: (readonly [number, number])[] = [
    [-H.x, H.rez],
    [R.x, H.rez],
    [R.x, H.top],
    [-H.x, R.low],
  ];
  const at = (z: number) => pts.map(([x, y]) => [x, HY + y, z] as P3);
  const n = at(z0),
    s = at(z1);
  // La face au sud (vue de +z), puis celle au nord.
  b.quad(s[0], s[1], s[2], s[3], south ? C.wallWorn : C.inside);
  b.quad(n[1], n[0], n[3], n[2], south ? C.inside : C.wallWorn);
  // La coupe en pente, et le haut plat qui rejoint l'est.
  b.quad(n[3], s[3], s[2], n[2], C.wallTop);
}

// ---------- La cour ----------

/** La cour : la dalle (son dessus suit le plan, ses côtés descendent sous le sol), puis ses joints en rangs décalés. */
function yard(b: FacetBuilder, worn: boolean): void {
  const Y = YARD;
  const corners: P3[] = [
    [Y.x0, yardY(Y.x0, Y.z1), Y.z1],
    [Y.x1, yardY(Y.x1, Y.z1), Y.z1],
    [Y.x1, yardY(Y.x1, Y.z0), Y.z0],
    [Y.x0, yardY(Y.x0, Y.z0), Y.z0],
  ];
  // Le dessus en dalles chaudes ; les bords, la roche grise du plateau.
  slab(b, corners, { floor: SINK }, worn ? C.stoneShade : C.stone, worn ? C.tileWorn : C.tile, true);
  const j = worn ? C.jointWorn : C.joint;
  const ew = (z: number, x0: number = Y.x0, x1: number = Y.x1) => joint(b, { x: x0, z }, { x: x1, z }, j);
  const ns = (x: number, z0: number, z1: number) => joint(b, { x, z: z0 }, { x, z: z1 }, j);
  if (worn) {
    // Dans la ruine, des joints pâlis, et peu : la cour usée se lit encore comme une cour.
    ew(5.3);
    for (const x of [-7.6, -1.6, 4.4, 10.4]) ns(x, 5.3, Y.z1);
    ew(-7.7);
    return;
  }
  // Des rangs de 2,2 de profondeur ; dans chaque rang, des dalles de 3, décalées d'un demi-rang du voisin.
  ew(5.3);
  ew(3.1);
  ew(-7.7);
  ew(-2.3, Y.x0, -HOUSE.x - 0.2);
  ew(-2.3, WING.x1 + 0.2, Y.x1);
  for (const x of [-7.6, -4.6, -1.6, 1.4, 4.4, 7.4, 10.4]) ns(x, 5.3, Y.z1);
  for (const x of [-6.1, -3.1, 2.9, 5.9, 8.9]) ns(x, 3.1, 5.3);
  for (const x of [-7.6, -4.6, -1.6, 1.6, 4.4, 10.4]) ns(x, x > HOUSE.x && x < WING.x1 ? WING.z1 : HOUSE.z1, 3.1);
  for (const x of [-6, -2, 2, 6, 10]) ns(x, Y.z0, -7.7);
  ns(-7.75, -7.7, 3.1);
  ns(10.7, -7.7, 3.1);
}

/** Les dalles soulevées et fendues de la cour en ruine, à l'écart de la scène, du chemin et de la porte. */
function liftedSlabs(b: FacetBuilder): void {
  for (const [x, z, yaw, pitch] of [
    [-8.2, -4.2, 0.3, 0.1],
    [9.6, 4.2, -0.2, -0.12],
  ] as const)
    b.box({ x, y: yardY(x, z) - 0.1, z, yaw, pitch }, [1.4, 0.16, 1.0], C.stoneShade, C.tileWorn);
}

// ---------- La maison ----------

/** Le socle de pierre grise, bas, sous le corps et l'aile ; ses joints nets sur le long pan. */
function socle(b: FacetBuilder, worn: boolean): void {
  const H = HOUSE;
  const top = HY + H.socle;
  b.box({ x: 0, y: SINK, z: (H.z0 + H.z1) / 2 }, [2 * H.x + 0.3, top - SINK, H.z1 - H.z0 + 0.3], worn ? C.stoneShade : C.stone, C.stoneSun);
  b.box({ x: (WING.x0 + WING.x1) / 2 + 0.15, y: SINK, z: (WING.z0 + WING.z1) / 2 }, [WING.x1 - WING.x0 + 0.3, top - SINK, WING.z1 - WING.z0 + 0.3], worn ? C.stoneShade : C.stone, C.stoneSun);
  if (worn) return;
  for (const x of [-4.4, -1.9, 1.9, 4.4]) southPlate(b, x - 0.035, x + 0.035, yardY(x, H.z1) - 0.02, top, H.z1 + 0.152, C.joint);
}

/** Le rez d'enduit du corps, ses deux fenêtres (des carrés de vitre sombre unie, sans croisillon). */
function rez(b: FacetBuilder, worn: boolean): void {
  const H = HOUSE;
  b.box({ x: 0, y: HY + H.socle, z: (H.z0 + H.z1) / 2 }, [2 * H.x, H.rez - H.socle, H.z1 - H.z0], worn ? C.wallWorn : C.wall, C.wallTop);
  const w = WINDOWS.half;
  for (const x of WINDOWS.x) southPlate(b, x - w, x + w, HY + WINDOWS.y - w, HY + WINDOWS.y + w, H.z1 + 0.015, C.glass);
}

/** La porte de planches, droite, fermée : son battant, deux joints de planches ; son linteau de bois. */
function door(b: FacetBuilder, worn: boolean): void {
  const H = HOUSE;
  const y0 = HY + H.socle;
  b.box({ x: 0, y: y0, z: H.z1 }, [2 * DOOR.half, DOOR.top - H.socle, 0.1], worn ? C.wornShade : C.doorLine, worn ? C.wornWood : C.door);
  for (const x of [-0.23, 0.23]) southPlate(b, x - 0.03, x + 0.03, y0 + 0.06, HY + DOOR.top - 0.06, H.z1 + 0.052, worn ? C.wornShade : C.doorLine);
  b.box({ x: 0, y: HY + DOOR.top, z: H.z1 + 0.02 }, [2 * DOOR.half + 0.5, 0.32, 0.18], worn ? C.wornShade : C.newShade, worn ? C.wornWood : C.newWood);
}

/** Le motif des racines en vert-de-gris, sur le linteau seulement (jamais sur le battant) : une onde, sans lettre. */
function roots(b: FacetBuilder): void {
  const z = HOUSE.z1 + 0.112;
  const y = HY + DOOR.top + 0.16;
  const wave = [-0.88, -0.32, 0.3, 0.88].map((x, i) => [x, y + (i % 2 ? 0.05 : -0.04)] as const);
  for (let i = 0; i < 3; i++) {
    const [ax, ay] = wave[i];
    const [cx, cy] = wave[i + 1];
    b.quad([ax, ay - 0.03, z], [cx, cy - 0.03, z], [cx, cy + 0.03, z], [ax, ay + 0.03, z], C.verdigris);
  }
}

/** Le perron : trois marches de pierre devant la porte, du seuil à la cour. */
function perron(b: FacetBuilder): void {
  const P = PERRON;
  for (let k = 0; k < P.steps; k++) {
    const z0 = HOUSE.z1 + k * P.depth;
    const top = HY + HOUSE.socle * ((P.steps - k) / P.steps);
    b.box({ x: 0, y: SINK, z: z0 + P.depth / 2 + 0.02 }, [2 * P.half, top - SINK, P.depth], C.stoneShade, C.stoneSun);
  }
}

/** L'étage du corps, derrière la galerie, jusqu'à `top` ; les deux murs des bouts de la loggia, en avant, jusqu'au même haut. */
function etage(b: FacetBuilder): void {
  const H = HOUSE;
  const L = LOGGIA;
  b.box({ x: 0, y: HY + H.rez, z: (H.z0 + L.back) / 2 }, [2 * H.x, H.top - H.rez, L.back - H.z0], C.wall, C.wallTop);
  for (const side of [-1, 1]) b.box({ x: side * (H.x + L.half) / 2, y: HY + H.rez, z: (L.back + H.z1) / 2 }, [H.x - L.half, H.top - H.rez, H.z1 - L.back], C.wall, C.wallTop);
}

/** Le plancher de la galerie, en débord, sur la largeur de la loggia. */
function galleryFloor(b: FacetBuilder): void {
  const L = LOGGIA;
  b.box({ x: 0, y: HY + L.floor, z: (L.back + L.front) / 2 }, [2 * L.half, L.floorTop - L.floor, L.front - L.back], C.plankShade, C.plank);
}

/** Un poteau droit de la galerie, du plancher au haut des murs. */
function post(b: FacetBuilder, x: number, wood: number, shade: number): void {
  b.box({ x, y: HY + LOGGIA.floorTop, z: LOGGIA.postZ }, [LOGGIA.post, HOUSE.top - LOGGIA.floorTop, LOGGIA.post], shade, wood);
}

/** Le garde-corps : deux lisses parallèles, des barreaux droits (des aplats tournés vers la cour), jamais rien de croisé. */
function railing(b: FacetBuilder): void {
  const L = LOGGIA;
  for (const y of L.rails) b.box({ x: 0, y: HY + y, z: L.railZ }, [2 * L.half, 0.08, 0.1], C.newShade, C.newWood);
  for (let k = 0; k < 5; k++)
    for (let i = 0; i < L.bars; i++) {
      const x = BAYS[k] + (i - (L.bars - 1) / 2) * (BAY / L.bars);
      southPlate(b, x - 0.035, x + 0.035, HY + L.floorTop, HY + L.rails[1], L.railZ + 0.052, C.newShade);
    }
}

/** Un cadre au mur du fond de la galerie, au milieu de la travée `k` : son bois, sa toile nue (Brume), ses coins de bronze. */
function frame(b: FacetBuilder, k: number): void {
  const F = FRAME;
  const z = LOGGIA.back;
  const x = BAYS[k];
  const y = HY + F.y0;
  b.box({ x, y, z: z + F.depth / 2 }, [F.w, F.h, F.depth], C.newShade, C.newWood);
  southPlate(b, x - F.w / 2 + F.inset, x + F.w / 2 - F.inset, y + F.inset, y + F.h - F.inset, z + F.depth + 0.004, C.brume);
  for (const sx of [-1, 1])
    for (const sy of [0, 1]) {
      const cx = x + sx * (F.w / 2 - F.corner / 2);
      const cy = y + sy * (F.h - F.corner);
      southPlate(b, cx - F.corner / 2, cx + F.corner / 2, cy, cy + F.corner, z + F.depth + 0.006, C.bronze);
    }
}

/**
 * Une toile peinte (les abords), sur la toile nue du cadre `k` : un fond, une bande de mer, un sujet, en aplats. D'ouest en
 * est : voilier (une voile latine), aiguille, voilier (deux voiles d'un mât), aiguille, voilier (une voile carrée
 * gonflée). La coque à cheval sur la ligne de mer, nette sur le bleu ; l'aiguille sans coque, haute et étroite, sur sa base
 * de rocher (retouche 0 : qu'elle ne se lise pas comme une voile latine). La voile carrée, un trapèze plus large que haut,
 * aux bords du haut et du bas droits, son mât au milieu, gonflée par une seconde teinte en bas (retouche 1 : qu'elle ne se
 * lise pas comme un « D »). Rien de croisé : le mât ne dépasse la voile qu'en haut et en bas, jamais une vergue en
 * travers ; ni pavillon, ni nom.
 */
function canvas(b: FacetBuilder, k: number): void {
  const F = FRAME;
  const x = BAYS[k];
  const z = LOGGIA.back + F.depth + 0.008;
  const x0 = x - F.w / 2 + F.inset,
    x1 = x + F.w / 2 - F.inset;
  const y0 = HY + F.y0 + F.inset,
    y1 = HY + F.y0 + F.h - F.inset;
  const w = x1 - x0;
  const h = y1 - y0;
  const sea = y0 + h * 0.3;
  southPlate(b, x0, x1, sea, y1, z, CANVAS_GROUNDS[k]);
  southPlate(b, x0, x1, y0, sea, z, C.sea);
  // Le sujet devant le fond ; les voiles devant le mât.
  const P = (u: number, v: number, front = 0): P3 => [x0 + u * w, y0 + v * h, z + 0.003 + front];
  const S = (u: number, v: number): P3 => P(u, v, 0.002);
  if (k % 2 === 1) {
    // Une aiguille de pierre, haute, étroite et anguleuse (une épaule sur sa face au soleil), sur sa base de rocher
    // large et basse qui sort de la mer : une face au soleil, une à l'ombre.
    b.quad(P(0.14, 0.24), P(0.86, 0.24), P(0.7, 0.4), P(0.3, 0.4), C.needleShade);
    b.triangle(S(0.39, 0.4), S(0.51, 0.4), S(0.5, 0.97), C.needleSun);
    b.triangle(S(0.51, 0.4), S(0.62, 0.4), S(0.5, 0.97), C.needleShade);
    b.triangle(S(0.39, 0.4), S(0.5, 0.97), S(0.35, 0.66), C.needleSun);
    return;
  }
  // Un petit voilier de profil, sur une mer calme : la coque à cheval sur la ligne de mer, le mât, la voilure de la toile.
  b.quad(P(0.22, 0.25), P(0.78, 0.25), P(0.86, 0.38), P(0.14, 0.38), C.hull);
  const mast = (u: number, top: number) => b.quad(P(u - 0.017, 0.38), P(u + 0.017, 0.38), P(u + 0.017, top), P(u - 0.017, top), C.hull);
  if (k === 0) {
    // Une voile latine : un seul triangle, son long côté en biais, le mât à son pied.
    mast(0.5, 0.57);
    b.triangle(S(0.22, 0.42), S(0.78, 0.42), S(0.68, 0.88), C.brume);
  } else if (k === 2) {
    // Deux voiles d'un mât : la grand-voile derrière lui, le foc devant, deux triangles qui ne se croisent pas.
    mast(0.5, 0.9);
    b.triangle(S(0.25, 0.42), S(0.47, 0.42), S(0.47, 0.86), C.brume);
    b.triangle(S(0.53, 0.42), S(0.8, 0.42), S(0.53, 0.82), C.brume);
  } else {
    // Une voile carrée gonflée par le vent : un trapèze plus large que haut, ses bords du haut et du bas droits, devant
    // son mât, au milieu, qui la dépasse en haut et en bas ; son bas, le creux gonflé, d'une seconde teinte.
    mast(0.5, 0.86);
    b.quad(S(0.2, 0.47), S(0.8, 0.47), S(0.76, 0.56), S(0.24, 0.56), C.sailBelly);
    b.quad(S(0.24, 0.56), S(0.76, 0.56), S(0.73, 0.76), S(0.27, 0.76), C.brume);
  }
}

/** Le haut des murs du corps, de `top` à l'égout, sur toute la profondeur (au-dessus de la loggia, son linteau), de `x0` à `x1`. */
function wallTop(b: FacetBuilder, x0: number, x1: number, color: number): void {
  const H = HOUSE;
  b.box({ x: (x0 + x1) / 2, y: HY + H.top, z: (H.z0 + H.z1) / 2 }, [x1 - x0, H.eave - H.top, H.z1 - H.z0], color, C.wallTop);
}

/** Un pignon du corps (`side` −1 : l'ouest, 1 : l'est), de l'égout au faîte, tourné vers le dehors. */
function gable(b: FacetBuilder, side: 1 | -1, color: number): void {
  const H = HOUSE;
  const x = side * (H.x + 0.002);
  const a: P3 = [x, HY + H.eave, H.z1];
  const c: P3 = [x, HY + H.eave, H.z0];
  const top: P3 = [x, HY + H.ridge, H.ridgeZ];
  if (side > 0) b.triangle(a, c, top, color);
  else b.triangle(c, a, top, color);
}

/** Les murs de la petite aile, et ses deux pignons d'un pan (au sud et au nord) sous son toit. */
function wingWalls(b: FacetBuilder, worn: boolean): void {
  const W = WING;
  const wall = worn ? C.wallWorn : C.wall;
  b.box({ x: (W.x0 + W.x1) / 2, y: HY + HOUSE.socle, z: (W.z0 + W.z1) / 2 }, [W.x1 - W.x0, W.top - HOUSE.socle, W.z1 - W.z0], wall, C.wallTop);
  const hi = HY + W.high - 0.05;
  b.triangle([W.x0, HY + W.top, W.z1 + 0.002], [W.x1, HY + W.top, W.z1 + 0.002], [W.x0, hi, W.z1 + 0.002], wall);
  b.triangle([W.x1, HY + W.top, W.z0 - 0.002], [W.x0, HY + W.top, W.z0 - 0.002], [W.x0, hi, W.z0 - 0.002], wall);
}

/** Un pan du toit du corps (`side` −1 : le nord, 1 : le sud), de `x0` à `x1`. */
function roofPan(b: FacetBuilder, side: 1 | -1, x0: number, x1: number, color: number, edge: number): void {
  const H = HOUSE;
  const slope = (H.ridge - H.eave) / (side > 0 ? H.z1 - H.ridgeZ : H.ridgeZ - H.z0);
  const zEave = side > 0 ? H.z1 + H.overhang : H.z0 - H.overhang;
  const yEave = HY + H.eave - H.overhang * slope;
  const yRidge = HY + H.ridge;
  const top: P3[] =
    side > 0
      ? [
          [x0, yEave + H.slab, zEave],
          [x1, yEave + H.slab, zEave],
          [x1, yRidge + H.slab, H.ridgeZ],
          [x0, yRidge + H.slab, H.ridgeZ],
        ]
      : [
          [x1, yEave + H.slab, zEave],
          [x0, yEave + H.slab, zEave],
          [x0, yRidge + H.slab, H.ridgeZ],
          [x1, yRidge + H.slab, H.ridgeZ],
        ];
  slab(b, top, { by: H.slab }, edge, color);
}

/** Le toit d'un pan de la petite aile, de `high` contre le corps à son égout à l'est. */
function wingRoof(b: FacetBuilder, color: number, edge: number): void {
  const W = WING;
  const x1 = W.x1 + W.overhang;
  const slope = (W.high - W.top) / (W.x1 - W.x0);
  const low = HY + W.top - W.overhang * slope;
  const z0 = W.z0 - W.overhang,
    z1 = W.z1 + W.overhang;
  slab(
    b,
    [
      [W.x0, HY + W.high + 0.15, z1],
      [x1, low + 0.15, z1],
      [x1, low + 0.15, z0],
      [W.x0, HY + W.high + 0.15, z0],
    ],
    { by: 0.15 },
    edge,
    color,
  );
}

/** Une cheminée carrée de pierre, sur le faîte au pignon `side`, et son chapeau ; debout. */
function chimney(b: FacetBuilder, side: 1 | -1): void {
  const H = HOUSE;
  const x = side * CHIMNEY.x;
  b.box({ x, y: HY + H.ridge - 1.4, z: H.ridgeZ }, [CHIMNEY.w, 1.4 + CHIMNEY.above, CHIMNEY.w], C.stoneShade, C.stone);
  b.box({ x, y: HY + H.ridge + CHIMNEY.above, z: H.ridgeZ }, [CHIMNEY.w + 0.2, 0.16, CHIMNEY.w + 0.2], C.stoneShade, C.stoneSun);
}

/** Le plan de la fenêtre de poupe : six points, du mur à l'est au mur à l'ouest, en saillie vers le nord (cinq pans). */
const POUPE_PLAN: readonly Vec2[] = [0, 1, 2, 3, 4, 5].map((k) => ({
  x: POUPE.x + POUPE.r * Math.cos((Math.PI * k) / 5),
  z: HOUSE.z0 - POUPE.d * Math.sin((Math.PI * k) / 5),
}));

/** Le plan de la poupe agrandi de `s` autour de son milieu au mur (l'auvent, le bas). */
const poupePlan = (s: number): Vec2[] => POUPE_PLAN.map((p) => ({ x: POUPE.x + (p.x - POUPE.x) * s, z: HOUSE.z0 + (p.z - HOUSE.z0) * s }));

/**
 * La fenêtre de poupe, au dos, à l'étage : son corps de bois en saillie, ses cinq vitres hautes, une par pan, sans
 * croisillon ni petits carreaux (`broken` : les pans brisés de la ruine, le dedans brun très sombre) ; son petit auvent
 * d'ardoise ; ses deux corbeaux de bois.
 */
function poupe(b: FacetBuilder, worn: boolean, broken: readonly number[] = []): void {
  const wood = worn ? C.wornWood : C.newWood;
  const shade = worn ? C.wornShade : C.newShade;
  const y0 = HY + POUPE.y0 - 0.2,
    y1 = HY + POUPE.y1 + 0.15;
  // Le corps : le plan en saillie (de l'est au nord puis à l'ouest : dans le sens inverse des aiguilles d'une montre vu
  // d'en haut), du bas au haut.
  slab(
    b,
    POUPE_PLAN.map((p) => [p.x, y1, p.z] as const),
    { floor: y0 },
    wood,
    shade,
  );
  // Les cinq vitres, un peu en avant de chaque pan.
  for (let k = 0; k < 5; k++) {
    const a = POUPE_PLAN[k],
      c = POUPE_PLAN[k + 1];
    const ux = c.x - a.x,
      uz = c.z - a.z;
    const l = Math.hypot(ux, uz);
    const nx = -uz / l,
      nz = ux / l;
    const p = (t: number, y: number, out = 0.02): P3 => [a.x + ux * t + nx * out, y, a.z + uz * t + nz * out];
    const yb = HY + POUPE.y0,
      yt = HY + POUPE.y1;
    if (!broken.includes(k)) {
      b.quad(p(0.15, yb), p(0.85, yb), p(0.85, yt), p(0.15, yt), C.glass);
      continue;
    }
    // Un pan brisé : le dedans brun très sombre, plus large que la vitre (un montant est tombé), et l'autre montant
    // décroché, penché en travers de l'ouverture, seul (rien de croisé) ; un pan sur deux penche de l'autre côté.
    b.quad(p(0.04, yb), p(0.96, yb), p(0.96, yt), p(0.04, yt), C.inside);
    const lean = k % 2 ? 1 : -1;
    const foot = lean > 0 ? 0.12 : 0.88;
    const head = lean > 0 ? 0.62 : 0.38;
    b.quad(p(foot - 0.06, yb, 0.04), p(foot + 0.06, yb, 0.04), p(head + 0.06, yt - 0.08, 0.04), p(head - 0.06, yt - 0.08, 0.04), wood);
  }
  // L'auvent : le plan un peu agrandi, une dalle d'ardoise.
  const roof = poupePlan(1.18);
  slab(
    b,
    roof.map((p) => [p.x, y1 + 0.16, p.z] as const),
    { by: 0.12 },
    worn ? C.slateWornEdge : C.slateEdge,
    worn ? C.slateWorn : C.slate,
  );
  // Les deux corbeaux de bois, sous la saillie.
  for (const dx of [-0.85, 0.85]) b.box({ x: POUPE.x + dx, y: y0 - 0.7, z: HOUSE.z0 - 0.4 }, [0.24, 0.7, 0.8], shade, wood);
}

/** Les deux volets pleins de la fenêtre de poupe, ouverts à plat contre le mur nord. */
function poupeShutters(b: FacetBuilder): void {
  for (const side of [-1, 1]) {
    const x = POUPE.x + side * (POUPE.r + 0.5);
    northPlate(b, x - 0.44, x + 0.44, HY + POUPE.y0, HY + POUPE.y1, HOUSE.z0 - 0.02, C.newShade);
  }
}

/** Les quatre volets pleins du rez, ouverts à plat contre le mur. */
function rezShutters(b: FacetBuilder): void {
  const w = WINDOWS.half;
  for (const x of WINDOWS.x)
    for (const side of [-1, 1]) {
      const cx = x + side * (w + SHUTTER / 2 + 0.03);
      southPlate(b, cx - SHUTTER / 2, cx + SHUTTER / 2, HY + WINDOWS.y - w, HY + WINDOWS.y + w, HOUSE.z1 + 0.02, C.newShade);
    }
}

/** La perche de la peintre et sa lanterne allumée : la seule lumière de la ruine. */
function perch(b: FacetBuilder): void {
  const g = yardY(PERCH.x, PERCH.z);
  b.box({ x: PERCH.x, y: g - 0.4, z: PERCH.z }, [0.1, PERCH.h + 0.4, 0.1], C.newShade);
  const tip = { x: PERCH.x - PERCH.arm, y: g + PERCH.h - 0.05, z: PERCH.z };
  b.beam({ x: PERCH.x, y: tip.y, z: PERCH.z }, tip, 0.08, C.newShade);
  lantern(b, { ...tip, y: tip.y - 0.04 }, true);
}

/** Le socle de la longue-vue prise : un rond de pierre, le trou brun très sombre, quatre goujons de fer courts. */
function spyglassSocle(b: FacetBuilder): void {
  const S = SPYGLASS;
  const g = yardY(S.x, S.z);
  b.prism({ x: S.x, y: SINK, z: S.z }, S.r, S.r * 0.92, g + S.h - SINK, 14, C.stone, C.stoneSun);
  // Le trou : un disque à douze pans, au-dessus du dessus du socle (jamais une encoche, ni un goujon devant lui).
  const hole = Array.from({ length: 12 }, (_, k) => [S.hole * Math.cos((Math.PI * k) / 6), S.hole * Math.sin((Math.PI * k) / 6)] as const);
  b.plate({ x: S.x, y: g + S.h + 0.008, z: S.z, pitch: -Math.PI / 2 }, hole, C.inside);
  // Les goujons, inégalement espacés (jamais une croix droite, référent dys) : vus du cap de « Y aller » (du sud-ouest),
  // aucun n'est devant ni derrière le trou, les quatre se voient.
  for (const a of SPYGLASS_STUDS)
    b.box({ x: S.x + S.studs * Math.cos(a), y: g + S.h - 0.02, z: S.z + S.studs * Math.sin(a) }, [S.stud, 0.14, S.stud], C.iron);
}

/**
 * La bordure de la cour : un rang discontinu de pierres brutes basses, posées sur la roche juste au-delà du bord, jamais
 * un muret ; aucune devant la porte ni sur la chaussée.
 */
const BORDER_STONES: readonly (readonly [number, number])[] = [
  [1.6, 7.85],
  [4.6, 7.9],
  [7.6, 7.85],
  [10.6, 7.9],
  [-9.85, 4.3],
  [-9.9, 0.8],
  [-9.85, -2.7],
  [-9.9, -6.2],
  [-7.2, -10.4],
  [-3.6, -10.35],
  [0, -10.4],
  [3.6, -10.35],
  [7.2, -10.4],
  [10.8, -10.35],
  [12.4, -6.6],
  [12.35, 4.6],
];

// ---------- Le modèle ----------

/**
 * Les volumes du Gaillard, de la ruine aux abords (le modèle du lieu). `ground` : le sol sous un point du lieu ; `door` :
 * sa porte, au sud-ouest de la maison, au bout de la branche d'`aig-5`.
 */
function model(add: AddPiece, ground: SiteGround, _door: Vec2): void {
  const H = HOUSE;
  const L = LOGGIA;
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 1 / 3 };
  const corps3 = { stage: 0 as Stage, row: 2 / 3 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : la perche de la peintre et sa lanterne allumée dès la ruine (la seule), le socle de la longue-vue prise.
  add('ruine', 0, (b) => {
    perch(b);
    spyglassSocle(b);
  });

  // ---- La ruine ----
  // Le corps 1 sur 3 la relève : la cour usée et ses dalles soulevées, le socle, le rez à l'enduit tombé par plaques et
  // fendu, la porte fermée, le perron fendu (sa dernière marche inclinée), un volet couché sur la cour, l'autre qui pend.
  add(
    'ruine',
    0,
    (b) => {
      yard(b, true);
      liftedSlabs(b);
      socle(b, true);
      rez(b, true);
      door(b, true);
      // L'enduit tombé par plaques sur les pierres, et deux fissures.
      for (const [x0, x1, y0, y1] of [
        [-5.6, -4.3, 1.2, 3.0],
        [4.4, 5.6, 2.1, 3.7],
        [-1.9, -1.25, 2.4, 3.5],
      ] as const)
        southPlate(b, x0, x1, HY + y0, HY + y1, H.z1 + 0.012, C.stone);
      for (const [x, y0, y1, lean] of [
        [-4.0, 0.9, 3.5, 0.3],
        [4.0, 0.8, 1.6, -0.2],
      ] as const)
        b.quad([x - 0.03, HY + y0, H.z1 + 0.014], [x + 0.03, HY + y0, H.z1 + 0.014], [x + 0.03 + lean, HY + y1, H.z1 + 0.014], [x - 0.03 + lean, HY + y1, H.z1 + 0.014], C.crack);
      // Le perron : deux marches fendues, la dernière inclinée.
      const P = PERRON;
      for (let k = 0; k < 2; k++) {
        const z0 = H.z1 + k * P.depth;
        const top = HY + H.socle * ((P.steps - k) / P.steps);
        b.box({ x: 0, y: SINK, z: z0 + P.depth / 2 + 0.02 }, [2 * P.half, top - SINK, P.depth], C.stoneShade, C.stone);
        b.quad([-0.1 + k * 0.3, top + 0.006, z0 + 0.05], [-0.04 + k * 0.3, top + 0.006, z0 + 0.05], [0.06 + k * 0.3, top + 0.006, z0 + P.depth - 0.03], [0.0 + k * 0.3, top + 0.006, z0 + P.depth - 0.03], C.crack);
      }
      const z2 = H.z1 + 2 * P.depth;
      b.box({ x: 0.1, y: yardY(0, z2) - 0.25, z: z2 + P.depth / 2 + 0.05, yaw: 0.06, pitch: 0.16 }, [2 * P.half - 0.1, 0.38, P.depth], C.stoneShade, C.stone);
      // Le volet couché à plat sur la cour, devant la fenêtre de l'ouest ; celui qui pend de travers à une charnière, à l'est.
      b.box({ x: -3.1, y: yardY(-3.1, 3.1) + 0.01, z: 3.1, yaw: 0.35 }, [SHUTTER, 0.05, 2 * WINDOWS.half], C.wornShade, C.wornWood);
      const hinge = { x: WINDOWS.x[1] + WINDOWS.half + 0.04, y: HY + WINDOWS.y + WINDOWS.half };
      b.plate({ x: hinge.x, y: hinge.y, z: H.z1 + 0.02 }, turned(rect(SHUTTER, 2 * WINDOWS.half).map(([x, y]) => [x + SHUTTER / 2, y - WINDOWS.half] as const), -0.5), C.wornShade);
    },
    corps1,
  );
  // Le corps 2 sur 3 la relève : l'étage, dont le haut des murs de l'ouest s'arrête en coupe plate en pente, sans dents :
  // à l'ouest, des murs en bandes minces (le mur du fond de la galerie, le mur nord, le pignon), le dedans brun très sombre
  // à ciel ouvert entre eux (retouche 1 : qu'il ne se lise pas comme un toit en appentis) ; la galerie, son plancher qui
  // penche à l'ouest, les deux poteaux de l'est debout, ceux de l'ouest couchés à plat, parallèles, les deux lisses
  // couchées, trois cadres vides couchés à l'ouest, deux qui pendent de travers à l'est ; la fenêtre de poupe sur ses
  // corbeaux, deux pans brisés, un volet couché au pied du mur nord.
  add(
    'ruine',
    0,
    (b) => {
      // L'est de l'étage, plein jusqu'au haut des murs, sous le bout du toit qui tient ; sa face ouest, le dedans.
      const R = RUIN_CUT;
      b.box({ x: (R.x + H.x) / 2, y: HY + H.rez, z: (H.z0 + L.back) / 2 }, [H.x - R.x, H.top - H.rez, L.back - H.z0], C.wallWorn, C.wallTop);
      b.quad([R.x - 0.005, HY + H.rez, H.z0 + R.wall], [R.x - 0.005, HY + H.rez, L.back - R.wall], [R.x - 0.005, HY + H.top, L.back - R.wall], [R.x - 0.005, HY + H.top, H.z0 + R.wall], C.inside);
      // L'ouest : le mur du fond de la galerie et le mur nord, coupés en pente, le dehors d'enduit, le dedans brun ; le
      // pignon, coupé à plat au plus bas de la pente ; entre eux, le dedans.
      cutWall(b, L.back - R.wall, L.back, true);
      cutWall(b, H.z0, H.z0 + R.wall, false);
      b.box({ x: -H.x + R.wall / 2, y: HY + H.rez, z: (H.z0 + L.back) / 2 }, [R.wall, R.low - H.rez, L.back - H.z0], C.wallWorn, C.stoneShade);
      b.quad([-H.x + R.wall + 0.005, HY + H.rez, L.back - R.wall], [-H.x + R.wall + 0.005, HY + H.rez, H.z0 + R.wall], [-H.x + R.wall + 0.005, HY + R.low, H.z0 + R.wall], [-H.x + R.wall + 0.005, HY + R.low, L.back - R.wall], C.inside);
      b.quad([-H.x + R.wall, HY + H.rez + 0.02, L.back - R.wall], [R.x, HY + H.rez + 0.02, L.back - R.wall], [R.x, HY + H.rez + 0.02, H.z0 + R.wall], [-H.x + R.wall, HY + H.rez + 0.02, H.z0 + R.wall], C.inside);
      // Les deux murs des bouts de la loggia : celui de l'est entier, celui de l'ouest coupé au plus bas.
      b.box({ x: (H.x + L.half) / 2, y: HY + H.rez, z: (L.back + H.z1) / 2 }, [H.x - L.half, H.top - H.rez, H.z1 - L.back], C.wallWorn, C.wallTop);
      b.box({ x: -(H.x + L.half) / 2, y: HY + H.rez, z: (L.back + H.z1) / 2 }, [H.x - L.half, R.low - H.rez, H.z1 - L.back], C.wallWorn, C.stoneShade);
      // L'enduit tombé par plaques, une fissure au fond de la galerie.
      southPlate(b, 2.9, 3.6, HY + 6.0, HY + 6.9, L.back + 0.01, C.stone);
      northPlate(b, -3.6, -2.0, HY + 1.6, HY + 3.4, H.z0 - 0.012, C.stone);
      northPlate(b, 2.6, 3.8, HY + 5.0, HY + 6.2, H.z0 - 0.012, C.stone);
      // Le plancher qui penche à l'ouest (tourné autour de son bout est).
      const tilt = 0.06;
      drawPosed(b, { x: L.half, y: HY + L.floor, z: (L.back + L.front) / 2, yaw: Math.PI / 2, pitch: -tilt }, (l) =>
        l.box({ x: 0, y: 0, z: -L.half }, [L.front - L.back, L.floorTop - L.floor, 2 * L.half], C.wornShade, C.wornWood),
      );
      const floorAt = (x: number) => HY + L.floorTop - (L.half - x) * Math.sin(tilt);
      for (const x of POSTS.slice(2)) post(b, x, C.wornWood, C.wornShade);
      // Les deux poteaux de l'ouest, couchés à plat sur le plancher, parallèles, le long de la galerie.
      for (const [x, z] of [
        [-2.7, 0.66],
        [-2.7, 1.08],
      ] as const)
        b.box({ x, y: floorAt(x), z, yaw: 0, pitch: 0 }, [3.3, LOGGIA.post, LOGGIA.post], C.wornShade, C.wornWood);
      // Les deux lisses couchées sur le plancher, parallèles, devant les deux poteaux de l'est qui tiennent.
      for (const z of [1.2, 1.35]) b.box({ x: 2.75, y: floorAt(2.75), z }, [3.2, 0.1, 0.1], C.wornShade, C.wornWood);
      // Trois cadres vides couchés sur le plancher, à l'ouest, de part et d'autre des poteaux, leur long côté le long de la
      // galerie, le bord du fond relevé contre le mur (de 20 à 25°) : vus de la cour, on lit leur ouverture ; deux qui
      // pendent de travers par un coin, à l'est. Leur bois, plus sombre et plus rouge que les lisses et les poteaux
      // couchés, et leurs coins de bronze les font lire comme des cadres.
      for (const [x, lean] of [
        [-4.3, 0.36],
        [-2.2, 0.42],
        [-0.15, 0.34],
      ] as const)
        drawPosed(b, { x, y: floorAt(x) + 0.03, z: L.front - 0.06, yaw: 0, pitch: -Math.PI / 2 + lean }, (l) => emptyFrame(l, Math.PI / 2, C.frameWorn, FRAME.w / 2, 0));
      for (const [k, a] of [
        [3, 0.22],
        [4, -0.3],
      ] as const) {
        // Il pend par son coin du haut, à l'est ou à l'ouest selon son biais : il tourne autour de ce coin.
        const side = a > 0 ? -1 : 1;
        const corner = { x: BAYS[k] + (side * FRAME.w) / 2, y: HY + FRAME.y0 + FRAME.h };
        drawPosed(b, { x: corner.x, y: corner.y, z: L.back + 0.03, yaw: 0 }, (l) => emptyFrame(l, a, C.frameWorn, (-side * FRAME.w) / 2, -FRAME.h / 2));
      }
      // La fenêtre de poupe en ruine, et son volet couché à plat au pied du mur nord.
      poupe(b, true, [1, 3]);
      b.box({ x: -2.6, y: yardY(-2.6, -7.1) + 0.01, z: -7.1, yaw: 0.25 }, [0.88, 0.05, 1.7], C.wornShade, C.wornWood);
    },
    corps2,
  );
  // Le corps 3 sur 3 la relève : le haut des murs de l'est jusqu'à l'égout (le linteau de la loggia, qui tient), le pignon
  // de l'est, l'aile usée et fendue ; sous le bout du toit qui tient, le dessous des combles.
  add(
    'ruine',
    0,
    (b) => {
      wallTop(b, 0, H.x, C.wallWorn);
      gable(b, 1, C.wallWorn);
      wingWalls(b, true);
      b.quad([7.4, HY + 1.2, WING.z1 + 0.01], [7.47, HY + 1.2, WING.z1 + 0.01], [8.0, HY + 4.1, WING.z1 + 0.01], [7.93, HY + 4.1, WING.z1 + 0.01], C.crack);
      b.triangle([0.02, HY + H.eave, H.z0], [0.02, HY + H.eave, H.z1], [0.02, HY + H.ridge, H.ridgeZ], C.attic);
    },
    corps3,
  );
  // Le haut la relève : la moitié est du toit, qui tient, sur le corps et sur l'aile (rien ne dépasse du faîte) ; le pan
  // sud de l'ouest glissé d'un seul panneau, couché en pente douce contre le socle, à l'ouest du perron ; les deux
  // cheminées tombées d'un bloc, couchées sur la cour.
  add(
    'ruine',
    0,
    (b) => {
      roofPan(b, 1, 0, H.x + H.overhang, C.slateWorn, C.slateWornEdge);
      roofPan(b, -1, 0, H.x + H.overhang, C.slateWorn, C.slateWornEdge);
      wingRoof(b, C.slateWorn, C.slateWornEdge);
      const z0 = H.z1 + 0.15;
      const z1 = H.z1 + 2.3;
      slab(
        b,
        [
          [-6.3, yardY(-6.3, z1) + 0.18, z1],
          [-4.4, yardY(-4.4, z1) + 0.18, z1],
          [-4.4, HY + H.socle + 0.8, z0],
          [-6.3, HY + H.socle + 0.8, z0],
        ],
        { by: 0.18 },
        C.slateWornEdge,
        C.slateWorn,
      );
      // Celle de l'ouest au bout du pignon, celle de l'est devant l'aile : les deux se voient du cap de « Y aller ».
      for (const [x, z, yaw] of [
        [-8.0, -1.0, 0.3],
        [7.6, 2.2, -0.6],
      ] as const)
        b.box({ x, y: yardY(x, z) - 0.05, z, yaw, pitch: Math.PI / 2 }, [CHIMNEY.w, 2.4, CHIMNEY.w], C.stoneShade, C.stone);
    },
    haut,
  );
  // Les abords la relèvent : la lanterne du chemin éteinte, couchée sur la cour au pied de son piquet penché.
  add(
    'ruine',
    0,
    (b) => {
      const p = PATH_LANTERN;
      const g = yardY(p.x, p.z);
      b.beam({ x: p.x, y: g - 0.3, z: p.z }, { x: p.x - 0.35, y: g + 1.0, z: p.z + 0.2 }, 0.1, C.wornShade);
      drawPosed(b, { x: p.x + 0.45, y: g + 0.12, z: p.z - 0.25, yaw: 0.6, pitch: Math.PI / 2 }, (l) => lantern(l, { x: 0, y: 0.17, z: 0 }, false));
    },
    abords,
  );

  // ---- Le corps 1 sur 3 : la cour remise à plat, joints nets ; le socle ; le rez refait, la porte neuve et son linteau
  // aux racines, les fenêtres.
  add(0, 0, (b) => {
    yard(b, false);
    socle(b, false);
    rez(b, false);
    door(b, false);
    roots(b);
  });
  // Le corps 2 sur 3 : l'étage, la galerie, son plancher, ses quatre poteaux, son garde-corps ; les cinq cadres raccrochés,
  // avec leurs toiles nues ; la fenêtre de poupe sur ses corbeaux.
  add(0, 1 / 3, (b) => {
    etage(b);
    galleryFloor(b);
    for (const x of POSTS) post(b, x, C.newWood, C.newShade);
    railing(b);
    for (let k = 0; k < 5; k++) frame(b, k);
    poupe(b, false);
  });
  // Le corps 3 sur 3 : le haut des murs jusqu'à l'égout (le linteau de la loggia), les deux pignons du corps, l'aile.
  add(0, 2 / 3, (b) => {
    wallTop(b, -H.x, H.x, C.wall);
    gable(b, -1, C.wall);
    gable(b, 1, C.wall);
    wingWalls(b, false);
  });
  // Le haut : le toit d'ardoise bleue du corps et de l'aile, les deux cheminées ; la lanterne de la galerie, sur sa console
  // au mur du bout est, allumée dès qu'elle est posée (jamais à une réussite).
  add(1, 0, (b) => {
    for (const side of [-1, 1] as const) roofPan(b, side, -H.x - H.overhang, H.x + H.overhang, C.slate, C.slateEdge);
    wingRoof(b, C.slate, C.slateEdge);
    chimney(b, -1);
    chimney(b, 1);
    const G = GALLERY_LANTERN;
    b.box({ x: (LOGGIA.half + G.x) / 2, y: HY + G.y, z: G.z }, [LOGGIA.half - G.x + 0.04, 0.07, 0.07], C.iron);
    lantern(b, { x: G.x, y: HY + G.y + 0.02, z: G.z }, true);
  });
  // Les abords : le perron neuf ; les six volets (quatre au rez, deux à la fenêtre de poupe) ; la bordure de la cour ; la
  // lanterne du chemin, allumée dès qu'elle est posée ; les cinq toiles se peignent.
  add(2, 0, (b) => {
    perron(b);
    rezShutters(b);
    poupeShutters(b);
    for (const [x, z] of BORDER_STONES) {
      const g = ground.at(x, z);
      b.prism({ x, y: g - 0.3, z, yaw: (x * 1.7 + z) % Math.PI }, 0.42, 0.28, 0.6, 4, C.stoneShade, C.stone);
    }
    const p = PATH_LANTERN;
    const g = yardY(p.x, p.z);
    b.box({ x: p.x, y: g - 0.3, z: p.z }, [0.1, p.h + 0.3, 0.1], C.newShade);
    lantern(b, { x: p.x, y: g + p.h + 0.02, z: p.z }, true, 0.85);
    for (let k = 0; k < 5; k++) canvas(b, k);
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

/** Où se pose chaque trace, depuis le centre du lieu : à gauche de la porte (le seau seul à droite, au pied de l'aile). */
const TRACE_SPOTS = {
  ing: { x: -1.65, z: 1.85 },
  past: { x: -2.6, z: 1.35 },
  comparatives: { x: -3.75, z: 1.65 },
  sentences: { x: 7.1, z: 0.55 },
  portraits: { x: -5.3, z: 1.55 },
} as const;

/** Le contour de la palette en haricot, son trou de pouce (à plat, dans son plan). */
const PALETTE: readonly (readonly [number, number])[] = [
  [-0.2, -0.13],
  [0.06, -0.16],
  [0.22, -0.08],
  [0.24, 0.06],
  [0.12, 0.15],
  [-0.12, 0.15],
  [-0.24, 0.05],
];

/**
 * La palette de bois en haricot, trou de pouce ouvert, trois taches mates (bleu-gris, brique sourde, olive), appuyée contre
 * un tabouret bas à pieds droits, à gauche du perron (-ing). Jamais un chevalet.
 */
function palette(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.ing;
    const g = yardY(x, z);
    // Le tabouret : le siège et ses quatre pieds droits.
    l.box({ x, y: g + 0.36, z }, [0.42, 0.06, 0.42], C.newShade, C.newWood);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) l.box({ x: x + sx * 0.16, y: g, z: z + sz * 0.16 }, [0.05, 0.36, 0.05], C.newShade);
    // La palette, debout, appuyée contre le devant du tabouret, sa face vers la cour.
    drawPosed(l, { x, y: g + 0.19, z: z + 0.27, yaw: 0, pitch: -0.25 }, (q) => {
      q.extrude({ x: 0, y: 0, z: 0 }, PALETTE, 0.025, C.newShade, C.palette);
      q.plate({ x: -0.13, y: -0.04, z: 0.027 }, Array.from({ length: 6 }, (_, k) => [0.035 * Math.cos((Math.PI * k) / 3), 0.035 * Math.sin((Math.PI * k) / 3)] as const), C.inside);
      for (const [dx, dy, col] of [
        [0.0, 0.08, C.dabBlue],
        [0.13, 0.05, C.dabBrick],
        [0.12, -0.08, C.dabOlive],
      ] as const)
        q.plate({ x: dx, y: dy, z: 0.028 }, Array.from({ length: 6 }, (_, k) => [0.045 * Math.cos((Math.PI * k) / 3), 0.04 * Math.sin((Math.PI * k) / 3)] as const), col);
    });
  });
}

/** Un rouleau de toile ficelé, gros comme une cuisse, debout sur un billot, contre le mur, à gauche (prétérit). */
function canvasRoll(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.past;
    const g = yardY(x, z);
    l.prism({ x, y: g - 0.1, z }, 0.26, 0.26, 0.42, 6, C.wornShade, C.wornWood);
    const y = g + 0.32;
    l.prism({ x, y, z, yaw: 0.3 }, 0.12, 0.12, 0.85, 6, C.linen, C.linen);
    for (const dy of [0.22, 0.6]) l.band({ x, y: y + dy, z, yaw: 0.3 }, 0.126, 0.04, 6, C.twine);
  });
}

/** Une caisse de bois basse au couvercle relevé, trois pots ronds à couvercle côte à côte, identiques (comparatifs). */
function jarCrate(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.comparatives;
    const g = yardY(x, z);
    l.box({ x, y: g, z }, [0.9, 0.28, 0.42], C.newShade, C.wornShade);
    // Le couvercle relevé contre le mur, derrière la caisse.
    drawPosed(l, { x, y: g + 0.28, z: z - 0.21, yaw: 0, pitch: 0.2 }, (q) => q.box({ x: 0, y: 0, z: -0.02 }, [0.9, 0.42, 0.04], C.newShade, C.newWood));
    // Les trois pots, de même taille, de même forme, de même teinte, également espacés.
    for (const dx of [-0.27, 0, 0.27]) {
      l.prism({ x: x + dx, y: g + 0.2, z }, 0.1, 0.11, 0.22, 6, C.jar, C.jar);
      l.prism({ x: x + dx, y: g + 0.42, z }, 0.115, 0.04, 0.05, 6, C.jarLid);
    }
  });
}

/** Un seau de bois cerclé de fer, plein de chaux, une large brosse plate plongée dedans, le manche court (phrases). */
function limeBucket(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.sentences;
    const g = yardY(x, z);
    l.prism({ x, y: g - 0.05, z }, 0.22, 0.27, 0.5, 7, C.newWood, C.lime);
    l.band({ x, y: g + 0.3, z }, 0.255, 0.05, 7, C.iron);
    // La brosse plongée : seul son dos et le bout du manche dépassent, à peine, penchés.
    drawPosed(l, { x: x + 0.04, y: g + 0.38, z, yaw: 0.4, pitch: 0.25 }, (q) => {
      q.box({ x: 0, y: 0, z: 0 }, [0.24, 0.1, 0.07], C.newShade, C.bristle);
      q.box({ x: 0, y: 0.1, z: 0 }, [0.05, 0.16, 0.05], C.newShade);
    });
  });
}

/** Un pot de grès large et bas, une botte de pinceaux en éventail, tous de même hauteur, sans couleur aux poils (portraits). */
function brushPot(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.portraits;
    const g = yardY(x, z);
    l.prism({ x, y: g - 0.05, z }, 0.2, 0.18, 0.3, 7, C.stoneware, C.stonewareTop);
    // Cinq pinceaux, en éventail dans le plan de la façade, sans jamais se croiser, chacun de la même longueur.
    const len = 0.55;
    for (const a of [-0.32, -0.16, 0, 0.16, 0.32]) {
      const foot = { x: x + a * 0.25, y: g + 0.18, z };
      const tip = { x: foot.x + Math.sin(a) * len, y: foot.y + Math.cos(a) * len, z };
      l.beam(foot, tip, 0.03, C.newWood);
      const bristle = { x: tip.x + Math.sin(a) * 0.1, y: tip.y + Math.cos(a) * 0.1, z };
      l.beam(tip, bristle, 0.05, C.bristle);
    }
  });
}

/**
 * Les cinq traces, une par mission, chacune avec sa partie (le corps en trois rangées, puis le haut, puis les abords) ;
 * des objets de la peintre, jamais la notion.
 */
const TRACES = {
  ing: { at: TRACE_SPOTS.ing, lift: 1, stage: 0, row: 0, draw: palette },
  'past-simple': { at: TRACE_SPOTS.past, lift: 1, stage: 0, row: 1 / 3, draw: canvasRoll },
  comparatives: { at: TRACE_SPOTS.comparatives, lift: 1, stage: 0, row: 2 / 3, draw: jarCrate },
  sentences: { at: TRACE_SPOTS.sentences, lift: 1, stage: 1, row: 0, draw: limeBucket },
  portraits: { at: TRACE_SPOTS.portraits, lift: 1, stage: 2, row: 0, draw: brushPot },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/** Le milieu de la scène, depuis le centre du lieu : sur la cour, devant le perron, la porte et son linteau derrière. */
const SCENE_SPOT = {
  dx: 0.5,
  dz: 4.3,
  half: [3.0, 1.1] as [number, number],
} as const;

/**
 * La hauteur du sol de la scène au-dessus de son point (le plus haut du sol sous sa plate-forme, comme questionScene.ts,
 * `sceneSpot`) : le dessus des dalles de la cour, son plancher. Le décor de près n'ajoute pas de plancher.
 */
const SCENE_RISE = (() => {
  const [hx, hz] = SCENE_SPOT.half;
  const nx = Math.ceil(hx),
    nz = Math.ceil(hz);
  let top = localGround(SCENE_SPOT.dx, SCENE_SPOT.dz);
  for (let i = -nx; i <= nx; i++) for (let k = -nz; k <= nz; k++) top = Math.max(top, localGround(SCENE_SPOT.dx + (i / nx) * hx, SCENE_SPOT.dz + (k / nz) * hz));
  return yardY(SCENE_SPOT.dx, SCENE_SPOT.dz) - top;
})();

/** La peintre en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, jupe brune, blouse bleu-gris, foulard. */
function painter(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.32, 0.24, 0.42, 8, C.skirt);
  b.prism({ x: at.x, y: at.y + 0.56, z: at.z }, 0.27, 0.24, 0.42, 8, C.smock);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  b.prism({ x: at.x, y: at.y + 0.92, z: at.z }, 0.26, 0.2, 0.08, 8, C.scarf);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.29, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.35, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.smock);
}

/**
 * Le rail de bois bas sur tréteaux des réponses : la hauteur du rail, à l'échelle 1 ; une toile choisie se soulève d'un
 * cran (0,3 : retouche 1, qu'il se voie au téléphone).
 */
const RAIL = { height: 0.4, lift: 0.3 } as const;

/**
 * Une petite toile nue encadrée (les réponses seulement), en toile écrue, moins claire que l'étiquette, debout, nettement
 * penchée en arrière (26°), son châssis épais (retouche 1 : qu'elle ne se lise pas comme une case vide) ; plus petite que
 * les cadres de la galerie, sans marque, à l'échelle `s` : son cadre de bois, la toile devant. Vingt triangles. Jamais
 * tournée : de travers, la rangée se lirait comme des cadres qui tombent.
 */
const SMALL_CANVAS_LEAN = 0.45;
function smallCanvas(b: FacetBuilder, at: Vec3, s: number): void {
  drawPosed(b, { x: at.x, y: at.y, z: at.z, yaw: 0, pitch: -SMALL_CANVAS_LEAN }, (l) => {
    l.box({ x: 0, y: 0, z: 0 }, [0.5 * s, 0.62 * s, 0.12 * s], C.newShade, C.newWood);
    l.box({ x: 0, y: 0.07 * s, z: 0.04 * s }, [0.36 * s, 0.48 * s, 0.05 * s], C.linen, C.linen);
  });
}

export const GAILLARD: PlaceArt = {
  role: 'La peintre',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a sa partie (`stage`, `row` : 3+1+1) et se montre dès que sa
  // mission est réussie et que sa partie est posée.
  traceStage: 0,
  sceneSpot: {
    dx: SCENE_SPOT.dx,
    dz: SCENE_SPOT.dz,
    half: SCENE_SPOT.half,
    fine: true,
  },
  site: {
    rise: SCENE_RISE,
    keo: { dx: -2.1, dz: 0.3, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.1, dz: 0 },
    // Un cadre serré, plongeant, le point visé bas : la porte, plus haute que Kéo, et le bas de son linteau au haut de
    // l'image ; la galerie, à 4 au-dessus de la cour, reste hors du cadre (retouche 1).
    subject: { halfWidth: 3.0, bottom: -0.5, top: 2.9, depth: 0.3 },
    pitch: (34 * Math.PI) / 180,
  },
  // Le décor de près : le plancher est la cour du lieu, le bas de la façade, la porte, son linteau et le perron derrière ;
  // la galerie reste hors du cadre ; la roche qui cadre est aux abords (./gaillardSurroundings.ts). Il reste la peintre en
  // pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) painter(b, at, sphere);
  },
  answer: {
    size: { height: RAIL.height + RAIL.lift + 0.62, half: 0.27 },
    // Un rail de bois bas sur deux tréteaux, sous la rangée des toiles.
    base(b, mid, y, z, span, s, ground) {
      const top = y + RAIL.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.24 * s], C.newShade, C.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.12, top - 0.08 * s - foot, 0.5 * s], C.newShade);
      }
    },
    // Une petite toile posée sur le rail ; choisie, elle se soulève d'un cran (sa place le dit, jamais sa couleur seule).
    object(b, at, s, _i, _count, picked) {
      smallCanvas(b, { x: at.x, y: at.y + (RAIL.height + (picked ? RAIL.lift : 0)) * s, z: at.z }, s);
    },
  },
  // Les cinq missions en R : la cour seule, rien de l'item ; les petites toiles portent les réponses.
  rest() {},
  traces: TRACES,
  // Kéo au retour : sur la chaussée, au pas de la porte, face à la maison.
  exit: { x: -3.6, z: 8.4 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan du Gaillard, pour les tests et ses abords : la cour, la maison, la galerie, ses cadres, la caméra. */
export const GAILLARD_LAYOUT = {
  yard: YARD,
  yardY,
  houseY: HY,
  house: HOUSE,
  wing: WING,
  loggia: LOGGIA,
  bays: BAYS,
  posts: POSTS,
  frame: FRAME,
  poupe: POUPE,
  poupePlan: POUPE_PLAN,
  chimney: CHIMNEY,
  perch: PERCH,
  pathLantern: PATH_LANTERN,
  galleryLantern: GALLERY_LANTERN,
  spyglass: SPYGLASS,
  borderStones: BORDER_STONES,
  door: DOOR_AT,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
  aig5: AIG5,
  scene: SCENE_SPOT,
  heightAtCenter: H0,
} as const;
