// L'Auberge (GD-22, lot 12 ; intention du directeur artistique du 20 octobre 2026, planche `selection-auberge-v1` validée
// par le mainteneur) : « une auberge au bord de la mer, où les voyageurs s'arrêtent, posent leurs bagages et s'assoient
// ensemble ». Le cœur, sans figure : la grande table et ses deux bancs sur le parvis, devant une grande maison à étage qui
// ouvre sa porte. La maison, faîtage nord-sud, tourne son grand pignon au sud, vers le parvis et la porte du lieu : un rez
// d'enduit passé sur un socle de pierre grise, un étage de planches, un toit d'ardoise à deux pans, une cheminée carrée au
// bout nord du faîte. Sur le pignon, le porche et le balcon ne font qu'un ouvrage : deux poteaux carrés portent le balcon
// de l'étage, qui abrite la porte ; l'enseigne au pichet sous la pointe du toit. À l'ouest du parvis la grande table, à
// l'est le départ du ponton, qui passe la vase et avance sur l'eau vers le sud-est, son dernier tiers sur l'eau ; au
// nord, la forêt des Frondaisons.
// Le signe de l'absence : la cloche d'accueil, prise par les Ferrailleurs, a laissé sur la face sud du poteau ouest
// l'empreinte de sa plaque arrachée, un rectangle debout d'un bois moins passé, le trou rond dans son tiers haut et ses
// quatre goujons de fer aux coins ; il ne change jamais, et le poteau ouest ne tombe jamais.
//
// La ruine : tout est là, tombé ou cassé, jamais un chantier ; les dégâts sont à l'est. Le pan est du toit crevé d'un seul
// trou, affaissé vers l'intérieur, trois ardoises au pied du mur est ; le moignon de cheminée coupé à plat ; la moitié est
// du balcon tombée (trois planches et le poteau est couchés à plat sur le parvis), la moitié ouest tenue par le poteau
// ouest ; la porte qui pend à un gond ; deux volets de travers ; l'enseigne couchée face au ciel ; la table fendue, un banc
// renversé, deux malles plates ouvertes ; le ponton troué, son bout dans l'eau, son pieu qui penche, un bout de corde ;
// une lanterne éteinte couchée au pied du ponton. Une seule lumière, celle de l'aubergiste, sur sa perche à droite de la
// porte. Cinq parties (3 + 1 + 1) : le corps en trois (le socle, le parvis et la table ; le rez, la porte et le balcon ;
// l'étage, le garde-corps et les volets), le haut (le toit, la cheminée, l'enseigne et la lanterne du pignon, à son angle
// ouest), les abords
// (le ponton, le chemin de dalles et sa barrière, la lanterne du ponton). Une trace par mission, avec sa partie (`stage`,
// `row`), la même pour la mission de même rang des deux langues (`es-<n>`, `de-<n>`). Rien ne bouge, rien à lire dans la
// 3D : la langue ne se voit pas. Code pur (placeArt.ts).
import type { Stage } from './construction';
import { drawPosed, FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_5E, PATH_NODES_5E, PLACES_5E } from './plan5e';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter sur une pente (places.ts). */
const SINK = -0.8;

/**
 * Les couleurs de l'Auberge : les matières des Passeurs du Hameau et des Radeaux (l'enduit passé, le bois brun désaturé
 * neuf et usé, l'ardoise bleue, délavée dans la ruine, la pierre grise, le fer, le bronze des seules ferrures, la corde),
 * le vert-de-gris des racines du chambranle ; le dedans de la porte et des malles, brun très sombre, jamais noir ; la vitre
 * sombre unie des fenêtres. La seule lumière, l'ocre des lanternes ; une lanterne éteinte a la vitre #BFC4B8.
 */
const C = {
  wall: 0xb9ae98,
  wallTop: 0xc6bca6,
  wallWorn: 0xaca28c,
  stone: COLORS_5E.stone,
  stoneSun: COLORS_5E.stoneSun,
  stoneShade: COLORS_5E.stoneShade,
  joint: 0x6d726c,
  parvisWorn: 0x8f9488,
  newWood: 0xa68672,
  newShade: 0x8c766a,
  wornWood: 0x9f9279,
  wornShade: 0x86775f,
  // L'étage usé de la ruine, un peu plus sombre que le rez passé (consultant d'Archipéo, retouche 1).
  etageWorn: 0x948670,
  plank: COLORS_5E.plank,
  plankShade: COLORS_5E.plankShade,
  door: 0x7d6650,
  inside: 0x3a312c,
  attic: 0x5e5046,
  glass: 0x4f5a5e,
  slate: 0x5b7c99,
  slateEdge: 0x4d6a83,
  slateWorn: 0x6f8089,
  slateWornEdge: 0x617079,
  verdigris: 0x6f9a8a,
  iron: 0x6f6a60,
  bronze: 0xb8954f,
  rope: 0xd8c49a,
  lantern: COLORS_5E.lantern,
  lanternOff: 0xbfc4b8,
  mud: COLORS_5E.mud,
  // Le pichet gravé de l'enseigne : un creux pâle dans le bois, jamais d'ocre.
  signPale: 0xdccdb0,
  // L'empreinte de la plaque de la cloche, sur le poteau ouest : un bois moins passé que le poteau, resté à l'abri.
  bellPlate: 0x7a5c47,
  // Les malles plates du décor (la ruine, la brouette) : un bois brun sourd, deux ferrures parallèles ; jamais rouges.
  trunk: 0x7a6352,
  trunkLid: 0x8a7160,
  // Les malles bombées des réponses, réservées à la question : un autre brun sourd, plus clair (jamais l'ocre).
  chest: 0x8f6f55,
  chestLid: 0xa3826a,
  // Les traces : la valise et ses sangles, le pichet de terre sourde, la couverture brun brique, la bruyère du balai.
  case: 0x7f6a55,
  strap: 0x5c4b3e,
  jug: 0x9c7458,
  jugShade: 0x85624a,
  // La couverture, d'un ton un peu plus clair que le bois de la main courante, unie (retouche 1).
  blanket: 0xc4876c,
  blanketShade: 0xa9725b,
  heather: 0x9a8560,
  // L'aubergiste, en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, jupe brune, corsage de lin, tablier
  // clair, foulard.
  boots: 0x55595a,
  skirt: 0x6f5a48,
  shirt: 0xd8c7a4,
  apron: 0xe6dfcc,
  head: 0xe3b48a,
  scarf: 0x7d8b74,
} as const;

// ---------- Le repère du lieu ----------

/** Le centre du lieu et le sol sous lui, dans le monde. */
const CENTER: Vec2 = PLACES_5E.find((p) => p.id === 'auberge')!.center;
const H0 = standingHeight(heightAt5e(CENTER));

/** Le sol du 5e sous un point du repère du lieu, depuis le sol de son centre (comme `SiteGround.at`). */
const localGround = (lx: number, lz: number): number => standingHeight(heightAt5e({ x: CENTER.x + lx, z: CENTER.z + lz })) - H0;

/**
 * Le parvis, entre la façade (au nord) et la porte du lieu (au sud, `door` du plan en z = 7,5) : son contour (x, z), coupé
 * en biais au sud-ouest pour laisser passer le chemin qui arrive d'`aub-1` (Kéo ne marche jamais sur le parvis : il
 * s'arrête au nœud de la porte), et le dessus de ses dalles, au-dessus du plus haut du sol sous lui.
 */
const PARVIS: readonly (readonly [number, number])[] = [
  [-5.4, 0.9],
  [5.4, 0.9],
  [5.4, 6.6],
  [0.2, 6.6],
  [-5.4, 5.2],
];

/** Le contour du parvis dans le repère d'un aplat couché (x, −z), dans le sens inverse des aiguilles d'une montre. */
const PARVIS_OUTLINE = PARVIS.map(([x, z]) => [x, -z] as const).reverse();

const PT = (() => {
  let top = -Infinity;
  for (let x = -5.4; x <= 5.4 + 1e-6; x += 0.9) for (let z = 0.9; z <= 6.6 + 1e-6; z += 0.95) top = Math.max(top, localGround(x, z));
  return top + 0.15;
})();

/**
 * La maison, sur le parvis (hauteurs depuis le dessus des dalles) : son pignon sud en `z1`, sa largeur de 7 au pignon, sa
 * profondeur de 8,5 ; le socle de pierre, le rez d'enduit haut de 3, l'étage de planches, le faîte à 7,75 (« vers 8,5 » :
 * plus haut, la caméra de « Y aller », 7 au-dessus de Kéo, coupait sa pointe et la cheminée au bord haut de l'image ; un
 * test le vérifie) ; le débord du toit et l'épaisseur de ses pans.
 */
const HOUSE = {
  x: 3.5,
  z0: -7.5,
  z1: 1.0,
  socle: 0.35,
  rez: 3.0,
  etage: 5.4,
  ridge: 7.75,
  eave: 0.4,
  slab: 0.2,
} as const;

/** La pente du toit, en hauteur par unité de largeur. */
const SLOPE = (HOUSE.ridge - HOUSE.etage) / HOUSE.x;

/** La porte du pignon : sa demi-largeur et son haut ; le seuil est au dessus du socle. */
const DOOR = { half: 0.55, top: 2.45 } as const;

/** Les fenêtres : un carré enfoncé, vitre sombre unie, jamais de croisillon ; leur demi-côté. */
const WINDOW = 0.38;

/** Les fenêtres du pignon (x, milieu en hauteur) : deux au rez, de part et d'autre de la porte ; deux à l'étage. */
const GABLE_WINDOWS = {
  rez: [-2.55, 2.55],
  etage: [-1.7, 1.7],
  rezY: 1.45,
  etageY: 4.45,
} as const;

/**
 * Le porche et le balcon, un seul ouvrage : le plancher de l'étage sur toute la largeur du pignon (sans retour), sa
 * poutre de rive, ses deux poteaux carrés de 0,5 ; le garde-corps de barreaux droits et sa main courante large et plate.
 */
const BALCONY = {
  x: 3.7,
  z0: HOUSE.z1,
  z1: 2.6,
  floor: 3.0,
  thick: 0.18,
  beam: 0.26,
  posts: [-3.15, 3.15],
  postZ: 2.3,
  post: 0.5,
  rail: 0.92,
  bars: 8,
} as const;

/**
 * Le signe de l'absence, sur la face sud du poteau ouest, à hauteur d'épaule : l'empreinte de la plaque arrachée, un
 * rectangle debout (`w` × `h`, son milieu en `y`), le trou rond sombre (rayon `r`) dans son tiers haut (son milieu à
 * `hole` au-dessus du milieu), les quatre goujons de fer aux quatre coins (`inset` du bord). Jamais le trou au milieu d'un
 * carré de goujons (la face 5 d'un dé), jamais une croix ni un X.
 */
const BELL_MARK = { y: 1.35, w: 0.3, h: 0.48, r: 0.06, hole: 0.14, inset: 0.04, stud: 0.06 } as const;

/** La grande table et ses deux bancs : grand axe nord-sud, au bord ouest du parvis, à ciel ouvert, jamais sous le balcon. */
const TABLE = {
  x: -4.3,
  z0: 2.8,
  z1: 5.1,
  top: 0.78,
  w: 0.86,
  bench: 0.7,
} as const;

/**
 * Le banc de pierre bas contre le mur, sous la fenêtre ouest, à gauche de la porte : poussé vers l'ouest avec la valise,
 * que Kéo cachait en scénette (retouche 1 ; Kéo ne bouge pas, un test le vérifie à 1024 × 768 et 390 × 844).
 */
const STONE_BENCH = { x: -2.9, w: 1.2, d: 0.42, h: 0.45 } as const;

/** La perche de l'aubergiste, à droite de la porte, plantée dans le parvis (jamais au mur), et sa lanterne. */
const PERCH = { x: 1.35, z: 1.75, h: 2.1, arm: 0.36 } as const;

/**
 * L'enseigne au pichet, au pignon, sous la pointe du toit : son milieu, son rayon. La lanterne du pignon, fixée au mur à
 * l'angle ouest du pignon, au-dessus et à l'écart de la fenêtre ouest de l'étage (référent dys et consultant d'Archipéo,
 * retouche 1 : sous l'enseigne, entre les deux fenêtres, elle faisait un visage) : sa place, le haut de son support.
 */
const SIGN = { y: 6.45, r: 0.62 } as const;
const GABLE_LANTERN = { x: -2.95, y: 5.2 } as const;

/** La cheminée carrée de pierre, au bout nord du faîte : sa place, son côté, son haut au-dessus du faîte. */
const CHIMNEY = { z: -6.6, w: 0.9, above: 0.55 } as const;

/**
 * Le ponton : il part du bord est du parvis et avance vers le sud-est, sur la vase puis sur l'eau, son dernier tiers (4,8
 * unités) au-dessus de l'eau des rives (directeur artistique, retouche 1 ; un test le vérifie) ; son départ, son sens, sa
 * longueur, sa demi-largeur. Le dessus de ses planches est au niveau du parvis.
 */
const PONTOON = {
  from: { x: 5.4, z: 6.0 },
  dir: { x: 0.62, z: 0.78 },
  len: 13.5,
  half: 0.75,
} as const;
const PONTOON_LEN = Math.hypot(PONTOON.dir.x, PONTOON.dir.z);
const UX = PONTOON.dir.x / PONTOON_LEN;
const UZ = PONTOON.dir.z / PONTOON_LEN;

/** Un point du ponton : `s` le long de lui depuis son départ, `t` vers sa gauche (le nord-est). */
const onPontoon = (s: number, t: number): Vec2 => ({
  x: PONTOON.from.x + UX * s + UZ * t,
  z: PONTOON.from.z + UZ * s - UX * t,
});

/** Le cap d'un pavé dont le grand côté (x) suit le ponton. */
const PONTOON_YAW = Math.atan2(-UZ, UX);

/** Le bout du ponton en ruine, cassé à l'entrée de l'eau : d'où il plonge, sa longueur jusque sous l'eau. */
const PLUNGE = { from: 8.8, len: 3.6 } as const;

/**
 * Le chemin de dalles des abords : il vient d'`aub-1`, à l'ouest-sud-ouest, longe le sud de la table et rejoint la porte ;
 * de `from` à `to` le long de l'arête du réseau, sa demi-largeur, et la barrière basse le long de son bord sud.
 */
const DOOR_AT: Vec2 = (() => {
  const n = PATH_NODES_5E.find((p) => p.id === 'auberge')!.at;
  return { x: n.x - CENTER.x, z: n.z - CENTER.z };
})();
const AUB1: Vec2 = (() => {
  const n = PATH_NODES_5E.find((p) => p.id === 'aub-1')!.at;
  return { x: n.x - CENTER.x, z: n.z - CENTER.z };
})();
const PATH_LEN = Math.hypot(DOOR_AT.x - AUB1.x, DOOR_AT.z - AUB1.z);
const PX = (DOOR_AT.x - AUB1.x) / PATH_LEN;
const PZ = (DOOR_AT.z - AUB1.z) / PATH_LEN;
/** Un point du chemin d'`aub-1` à la porte : `s` depuis `aub-1`, `t` vers le sud. */
const onPath = (s: number, t: number): Vec2 => ({
  x: AUB1.x + PX * s - PZ * t,
  z: AUB1.z + PZ * s + PX * t,
});
const WALK = {
  from: 4.5,
  to: PATH_LEN - 0.9,
  half: 0.62,
  fence: 1.45,
  fenceTo: PATH_LEN - 5.2,
} as const;

/** Le pas de deux points du repère vers un cap de pavé (le grand côté de `a` vers `b`). */
const yawOf = (a: Vec2, b: Vec2): number => Math.atan2(-(b.z - a.z), b.x - a.x);

// ---------- Les petits volumes ----------

/** Une bande verticale sur une face tournée vers +x (`side` 1) ou −x (−1), de `z0` à `z1`, de `y0` à `y1`. */
function sideStrip(b: FacetBuilder, x: number, side: 1 | -1, y0: number, y1: number, z0: number, z1: number, color: number): void {
  const s = side > 0 ? [z1, z0] : [z0, z1];
  b.quad([x, y0, s[0]], [x, y0, s[1]], [x, y1, s[1]], [x, y1, s[0]], color);
}

/** Une fenêtre du pignon : son carré de vitre sombre (un aplat), et ses volets pleins ouverts à plat contre le mur. */
function gableWindow(b: FacetBuilder, x: number, y: number, shutters: boolean): void {
  const w = WINDOW;
  const z = HOUSE.z1 + 0.02;
  b.plate(
    { x, y, z },
    [
      [-w, -w],
      [w, -w],
      [w, w],
      [-w, w],
    ],
    C.glass,
  );
  if (!shutters) return;
  for (const side of [-1, 1]) {
    const cx = x + side * (w + 0.21);
    b.plate(
      { x: cx, y, z },
      [
        [-0.19, -w],
        [0.19, -w],
        [0.19, w],
        [-0.19, w],
      ],
      C.newShade,
    );
  }
}

/** Une fenêtre d'un mur long (est ou ouest) : le même carré de vitre sombre, sans volet. */
function sideWindow(b: FacetBuilder, side: 1 | -1, z: number, y: number): void {
  const w = WINDOW;
  sideStrip(b, side * (HOUSE.x + 0.02), side, PT + y - w, PT + y + w, z - w, z + w, C.glass);
}

/** Une lanterne pendue (sa vitre, un pavé : dix triangles ; son chapeau de bronze en pointe), d'ocre ou éteinte. */
function lantern(b: FacetBuilder, top: Vec3, lit: boolean): void {
  b.box({ x: top.x, y: top.y - 0.34, z: top.z }, [0.24, 0.3, 0.24], lit ? C.lantern : C.lanternOff);
  b.prism({ x: top.x, y: top.y - 0.04, z: top.z, yaw: Math.PI / 4 }, 0.21, 0, 0.16, 4, C.bronze);
}

/** Une malle plate à couvercle droit et deux ferrures parallèles, sans sangle ni marque, fermée (la brouette). */
function flatTrunk(b: FacetBuilder, at: Vec3, yaw: number, s = 1): void {
  b.box({ x: at.x, y: at.y, z: at.z, yaw }, [0.82 * s, 0.34 * s, 0.5 * s], C.trunk, C.trunkLid);
  // Les deux ferrures, parallèles, sur le devant (tourné vers +z avant le cap).
  drawPosed(b, { x: at.x, y: at.y, z: at.z, yaw }, (l) => {
    for (const dx of [-0.24, 0.24])
      l.plate(
        { x: dx * s, y: 0, z: 0.252 * s },
        [
          [-0.04 * s, 0.02 * s],
          [0.04 * s, 0.02 * s],
          [0.04 * s, 0.32 * s],
          [-0.04 * s, 0.32 * s],
        ],
        C.iron,
      );
  });
}

/** Une malle plate couchée, son couvercle ouvert tombé devant elle, vide (son dedans brun très sombre) : la ruine. */
function openTrunk(b: FacetBuilder, at: Vec3, yaw: number): void {
  drawPosed(b, { x: at.x, y: at.y, z: at.z, yaw }, (l) => {
    // Couchée sur le dos de son flanc : le dessus ouvert regarde le sud du repère.
    l.box({ x: 0, y: 0.25, z: -0.2, pitch: Math.PI / 2 }, [0.82, 0.34, 0.5], C.trunk, C.inside);
    // Le couvercle à plat devant elle, ses deux ferrures.
    l.box({ x: 0.05, y: -0.02, z: 0.42 }, [0.82, 0.06, 0.48], C.trunk, C.trunkLid);
    for (const dx of [-0.2, 0.28])
      l.plate(
        { x: 0.05 + dx, y: 0.045, z: 0.42, pitch: -Math.PI / 2 },
        [
          [-0.04, -0.22],
          [0.04, -0.22],
          [0.04, 0.22],
          [-0.04, 0.22],
        ],
        C.iron,
      );
  });
}

/** Un banc de bois : son siège le long de z (nord-sud), ses deux pieds pleins. */
function bench(l: FacetBuilder, len: number, wood: number, shade: number): void {
  l.box({ x: 0, y: 0.38, z: 0 }, [0.34, 0.07, len], shade, wood);
  for (const dz of [-1, 1]) l.box({ x: 0, y: 0, z: (dz * (len - 0.3)) / 2 }, [0.28, 0.38, 0.08], shade);
}

/** Le contour de l'enseigne : un disque à huit pans, un pan à plat en haut. */
const OCTAGON = Array.from({ length: 8 }, (_, k) => [SIGN.r * Math.cos((Math.PI * k) / 4 + Math.PI / 8), SIGN.r * Math.sin((Math.PI * k) / 4 + Math.PI / 8)] as const);

/**
 * Le pichet gravé, une cruche (directeur artistique, retouche 1) : sa silhouette fait 1,3 de haut pour 1 de large, anse
 * comprise ; un pied plus étroit que la panse, la panse ventrue des deux côtés, l'épaule, le col resserré, la lèvre
 * évasée ; sans bec ni couvercle, jamais d'ocre. Les demi-largeurs de chaque hauteur, depuis l'axe du pichet (`cx`), et
 * les hauteurs depuis le milieu de l'enseigne. L'anse, d'un côté (retouche 2) : un arc de cercle de six segments
 * (centre 0,17 ; 0,075 depuis l'axe, rayon 0,155, de 135° à −90°), qui tourne de 37,5° à chaque jonction, part du col
 * et rentre dans la panse au-dessus de son ventre, sans monter au-dessus du haut du col : il ne se lit ni « d » ni « D »,
 * et le contour de la panse reste le même des deux côtés de l'axe.
 */
const JUG = {
  cx: -0.06,
  foot: 0.13,
  low: 0.21,
  belly: 0.24,
  high: 0.22,
  shoulder: 0.15,
  neck: 0.085,
  lip: 0.14,
  y: { bottom: -0.4, low: -0.31, belly: -0.17, high: -0.02, shoulder: 0.1, neck: 0.18, lip: 0.29, top: 0.38 },
  /** L'axe de l'anse, du col à la panse (x depuis `cx`), et son épaisseur. */
  handle: [
    [0.06, 0.185],
    [0.15, 0.229],
    [0.248, 0.209],
    [0.313, 0.134],
    [0.32, 0.035],
    [0.264, -0.048],
    [0.17, -0.08],
  ] as readonly (readonly [number, number])[],
  thick: 0.055,
} as const;

/** Les aplats convexes du pichet (chacun se dessine en éventail) : la panse, l'épaule, le col, la lèvre ; l'anse. */
const JUG_PLATES: readonly (readonly (readonly [number, number])[])[] = (() => {
  const J = JUG;
  const Y = J.y;
  const x = (dx: number) => J.cx + dx;
  const band = (y0: number, h0: number, y1: number, h1: number) =>
    [
      [x(-h0), y0],
      [x(h0), y0],
      [x(h1), y1],
      [x(-h1), y1],
    ] as const;
  const body = [
    [x(-J.foot), Y.bottom],
    [x(J.foot), Y.bottom],
    [x(J.low), Y.low],
    [x(J.belly), Y.belly],
    [x(J.high), Y.high],
    [x(J.shoulder), Y.shoulder],
    [x(-J.shoulder), Y.shoulder],
    [x(-J.high), Y.high],
    [x(-J.belly), Y.belly],
    [x(-J.low), Y.low],
  ] as const;
  // L'anse : un quadrilatère par segment, ses bords décalés de la demi-épaisseur le long de la normale moyenne de chaque
  // point, pour que deux segments voisins partagent leur arête (un arc sans trou ni angle).
  const H = J.handle;
  const normal = (i: number): [number, number] => {
    const [ax, ay] = H[Math.max(0, i - 1)];
    const [bx, by] = H[Math.min(H.length - 1, i + 1)];
    const l = Math.hypot(bx - ax, by - ay);
    return [(by - ay) / l, -(bx - ax) / l];
  };
  const side = (i: number, k: 1 | -1) => {
    const [nx, ny] = normal(i);
    return [x(H[i][0] + (k * nx * J.thick) / 2), H[i][1] + (k * ny * J.thick) / 2] as const;
  };
  const handle = H.slice(1).map((_, i) => [side(i, 1), side(i + 1, 1), side(i + 1, -1), side(i, -1)] as const);
  return [body, band(Y.shoulder, J.shoulder, Y.neck, J.neck), band(Y.neck, J.neck, Y.lip, J.neck), band(Y.lip, J.neck, Y.top, J.lip), ...handle];
})();

/** L'enseigne : la planche à huit pans et son pichet pâle en creux (sur sa face, `+z` du repère), sans mot ni bord clouté. */
function signBoard(l: FacetBuilder, worn: boolean): void {
  l.extrude({ x: 0, y: 0, z: 0 }, OCTAGON, 0.08, worn ? C.wornShade : C.newShade, worn ? C.wornWood : C.newWood);
  for (const plate of JUG_PLATES) l.plate({ x: 0, y: 0, z: 0.085 }, plate, C.signPale);
}

/** Un pan du toit (`side` −1 : l'ouest, 1 : l'est), son profil en travers, de `z0` sur `len` vers le sud. */
function roofPan(b: FacetBuilder, side: 1 | -1, z0: number, len: number, color: number, edge: number): void {
  const H = HOUSE;
  const x = side * (H.x + H.eave);
  const low = H.etage - H.eave * SLOPE;
  const pan: (readonly [number, number])[] =
    side < 0
      ? [
          [x, low],
          [0, H.ridge],
          [0, H.ridge + H.slab],
          [x, low + H.slab],
        ]
      : [
          [0, H.ridge],
          [x, low],
          [x, low + H.slab],
          [0, H.ridge + H.slab],
        ];
  b.extrude({ x: 0, y: PT, z: z0 }, pan, len, color, edge);
}

/** Les pignons de l'étage sous le toit, en planches (au sud, celui de l'enseigne ; au nord). */
function gables(b: FacetBuilder, wood: number): void {
  const H = HOUSE;
  const tri: readonly (readonly [number, number])[] = [
    [-H.x, 0],
    [H.x, 0],
    [0, H.ridge - H.etage],
  ];
  b.plate({ x: 0, y: PT + H.etage, z: H.z1 + 0.005 }, tri, wood);
  b.plate({ x: 0, y: PT + H.etage, z: H.z0 - 0.005, yaw: Math.PI }, tri, wood);
}

/** L'étage de planches sur tout le pourtour : son volume et ses joints horizontaux (pignon, flancs est et ouest). */
function etage(b: FacetBuilder, worn: boolean): void {
  const H = HOUSE;
  const wood = worn ? C.etageWorn : C.newWood;
  const line = worn ? C.wornShade : C.newShade;
  b.box({ x: 0, y: PT + H.rez, z: (H.z0 + H.z1) / 2 }, [2 * H.x, H.etage - H.rez, H.z1 - H.z0], wood, C.attic);
  for (const y of [3.62, 4.27, 4.92]) {
    b.plate(
      { x: 0, y: PT + y, z: H.z1 + 0.012 },
      [
        [-H.x, 0],
        [H.x, 0],
        [H.x, 0.05],
        [-H.x, 0.05],
      ],
      line,
    );
    for (const side of [-1, 1] as const) sideStrip(b, side * (H.x + 0.012), side, PT + y, PT + y + 0.05, H.z0, H.z1, line);
  }
  // Les fenêtres de l'étage : deux au pignon (leurs volets viennent avec l'étage neuf), une sur chaque flanc.
  for (const x of GABLE_WINDOWS.etage) gableWindow(b, x, PT + GABLE_WINDOWS.etageY, false);
  sideWindow(b, 1, -3.2, GABLE_WINDOWS.etageY);
  sideWindow(b, -1, -3.2, GABLE_WINDOWS.etageY);
}

/** Le rez d'enduit sur son socle, ses fenêtres (deux au pignon, deux à l'est, une à l'ouest), sa porte en ombre. */
function rez(b: FacetBuilder, worn: boolean): void {
  const H = HOUSE;
  b.box({ x: 0, y: PT + H.socle, z: (H.z0 + H.z1) / 2 }, [2 * H.x, H.rez - H.socle, H.z1 - H.z0], worn ? C.wallWorn : C.wall, C.wallTop);
  for (const x of GABLE_WINDOWS.rez) gableWindow(b, x, PT + GABLE_WINDOWS.rezY, false);
  sideWindow(b, 1, -1.6, GABLE_WINDOWS.rezY);
  sideWindow(b, 1, -5.1, GABLE_WINDOWS.rezY);
  sideWindow(b, -1, -3.4, GABLE_WINDOWS.rezY);
  // Le dedans de la porte : brun très sombre, jamais noir.
  b.plate(
    { x: 0, y: PT + H.socle, z: H.z1 + 0.015 },
    [
      [-DOOR.half, 0],
      [DOOR.half, 0],
      [DOOR.half, DOOR.top - H.socle],
      [-DOOR.half, DOOR.top - H.socle],
    ],
    C.inside,
  );
}

/** Le socle de pierre grise, bas, à joints nets (des arêtes sur le pignon et les flancs). */
function socle(b: FacetBuilder, worn: boolean): void {
  const H = HOUSE;
  b.box({ x: 0, y: SINK, z: (H.z0 + H.z1) / 2 }, [2 * H.x + 0.3, PT + H.socle - SINK, H.z1 - H.z0 + 0.3], worn ? C.stoneShade : C.stone, worn ? C.parvisWorn : C.stoneSun);
  if (worn) return;
  const top = PT + H.socle;
  for (const x of [-2.9, -1.3, 1.3, 2.9])
    b.plate(
      { x, y: PT - 0.02, z: H.z1 + 0.155 },
      [
        [-0.03, 0],
        [0.03, 0],
        [0.03, H.socle],
        [-0.03, H.socle],
      ],
      C.joint,
    );
  for (const side of [-1, 1] as const) for (const z of [-6.2, -3.6, -1.0]) sideStrip(b, side * (H.x + 0.155), side, PT - 0.02, top, z - 0.03, z + 0.03, C.joint);
}

/** Le parvis de dalles grises : une grande dalle à facettes, ses joints en arêtes nettes (des rangs décalés, jamais une grille). */
function parvis(b: FacetBuilder): void {
  b.extrude({ x: 0, y: SINK, z: 0, pitch: -Math.PI / 2 }, PARVIS_OUTLINE, PT - SINK, C.stone, C.stoneSun);
  const y = PT + 0.012;
  // Deux joints est-ouest (les rangs), puis les joints de chaque rang, décalés d'un rang à l'autre.
  const rows = [
    [0.9, 2.8, [-3.4, -1.0, 1.4, 3.8]],
    [2.8, 4.7, [-2.2, 0.2, 2.6]],
    [4.7, 6.6, [-1.0, 1.4, 3.8]],
  ] as const;
  const westEdge = (z: number) => (z <= 5.2 ? -5.4 : -5.4 + ((z - 5.2) / 1.4) * 5.6);
  for (const z of [2.8, 4.7]) {
    const x0 = westEdge(z);
    b.quad([x0, y, z + 0.03], [5.4, y, z + 0.03], [5.4, y, z - 0.03], [x0, y, z - 0.03], C.joint);
  }
  for (const [z0, z1, xs] of rows)
    for (const x of xs) {
      const z = Math.min(z1, x < 0.2 ? 5.2 + ((x + 5.4) / 5.6) * 1.4 : 6.6);
      if (z <= z0 + 0.2) continue;
      b.quad([x - 0.03, y, z], [x + 0.03, y, z], [x + 0.03, y, z0], [x - 0.03, y, z0], C.joint);
    }
}

/**
 * Le poteau ouest, toujours debout, et sur sa face sud le signe de la cloche prise : l'empreinte de la plaque arrachée
 * (un aplat d'un bois moins passé), le trou rond sombre dans son tiers haut, les quatre goujons de fer aux quatre coins.
 */
function westPost(b: FacetBuilder): void {
  const B = BALCONY;
  const M = BELL_MARK;
  const x = B.posts[0];
  b.box({ x, y: SINK, z: B.postZ }, [B.post, PT + B.floor - B.thick - B.beam - SINK, B.post], C.newShade, C.newWood);
  const z = B.postZ + B.post / 2;
  const y = PT + M.y;
  b.plate(
    { x, y, z: z + 0.004 },
    [
      [-M.w / 2, -M.h / 2],
      [M.w / 2, -M.h / 2],
      [M.w / 2, M.h / 2],
      [-M.w / 2, M.h / 2],
    ],
    C.bellPlate,
  );
  const hole = Array.from({ length: 8 }, (_, k) => [M.r * Math.cos((Math.PI * k) / 4), M.hole + M.r * Math.sin((Math.PI * k) / 4)] as const);
  b.plate({ x, y, z: z + 0.008 }, hole, C.inside);
  const dx = M.w / 2 - M.inset;
  const dy = M.h / 2 - M.inset;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) b.box({ x: x + sx * dx, y: y + sy * dy - M.stud / 2, z: z + 0.04 }, [M.stud, M.stud, 0.08], C.iron);
}

/** Le plancher du balcon (de `x0` à `x1`), sa poutre de rive dessous. */
function balconyFloor(b: FacetBuilder, x0: number, x1: number, worn: boolean): void {
  const B = BALCONY;
  const mid = (x0 + x1) / 2;
  b.box({ x: mid, y: PT + B.floor - B.thick, z: (B.z0 + B.z1) / 2 }, [x1 - x0, B.thick, B.z1 - B.z0], worn ? C.wornShade : C.newShade, worn ? C.wornWood : C.plank);
  b.box({ x: mid, y: PT + B.floor - B.thick - B.beam, z: B.postZ }, [x1 - x0, B.beam, 0.32], worn ? C.wornShade : C.newShade);
}

/** Le garde-corps (de `x0` à `x1`) : des barreaux droits, parallèles, et la main courante large et plate. */
function railing(b: FacetBuilder, x0: number, x1: number, bars: number, worn: boolean): void {
  const B = BALCONY;
  const z = B.z1 - 0.1;
  const wood = worn ? C.wornWood : C.newWood;
  const shade = worn ? C.wornShade : C.newShade;
  for (let k = 0; k < bars; k++) {
    const x = x0 + 0.25 + ((x1 - x0 - 0.5) * k) / (bars - 1);
    b.box({ x, y: PT + B.floor, z }, [0.07, B.rail - 0.06, 0.07], shade);
  }
  b.box({ x: (x0 + x1) / 2, y: PT + B.floor + B.rail - 0.06, z }, [x1 - x0, 0.07, 0.24], shade, wood);
}

/** La porte neuve : son battant de bois plein, ouvert à plat contre le mur à l'est ; son chambranle aux racines. */
function doorway(b: FacetBuilder): void {
  const H = HOUSE;
  const y0 = PT + H.socle;
  const z = H.z1;
  b.box({ x: DOOR.half + 0.7, y: y0, z: z + 0.04 }, [1.0, DOOR.top - H.socle - 0.05, 0.07], C.newShade, C.door);
  // Le chambranle : deux montants et un linteau de bois neuf, un peu en saillie.
  for (const side of [-1, 1]) b.box({ x: side * (DOOR.half + 0.09), y: y0, z: z + 0.06 }, [0.18, DOOR.top - H.socle + 0.2, 0.12], C.newShade, C.newWood);
  b.box({ x: 0, y: PT + DOOR.top, z: z + 0.06 }, [2 * DOOR.half + 0.36, 0.2, 0.12], C.newShade, C.newWood);
  // Le motif des racines en vert-de-gris, sur le chambranle seulement : une onde sur le linteau, une racine qui descend
  // chaque montant ; sans lettre ni chiffre.
  const fz = z + 0.125;
  const wave = [-0.7, -0.24, 0.24, 0.7].map((x, i) => [x, PT + DOOR.top + 0.08 + (i % 2 ? 0.05 : -0.01)] as const);
  for (let i = 0; i < 3; i++) {
    const [ax, ay] = wave[i];
    const [cx, cy] = wave[i + 1];
    b.quad([ax, ay - 0.03, fz], [cx, cy - 0.03, fz], [cx, cy + 0.03, fz], [ax, ay + 0.03, fz], C.verdigris);
  }
  for (const side of [-1, 1]) {
    const x = side * (DOOR.half + 0.09);
    const knee = PT + 1.4;
    b.quad([x - 0.03, knee, fz], [x + 0.03, knee, fz], [x + 0.03 + side * 0.03, PT + DOOR.top + 0.05, fz], [x - 0.03 + side * 0.03, PT + DOOR.top + 0.05, fz], C.verdigris);
    b.quad([x - 0.03 - side * 0.04, y0 + 0.15, fz], [x + 0.03 - side * 0.04, y0 + 0.15, fz], [x + 0.03, knee, fz], [x - 0.03, knee, fz], C.verdigris);
  }
}

// ---------- Le modèle ----------

/**
 * Les volumes de l'Auberge, de la ruine aux abords (le modèle du lieu). `ground` : le sol sous un point du lieu (`water` :
 * le niveau de l'eau) ; `door` : sa porte, au sud, au bout du chemin d'`aub-1`.
 */
function model(add: AddPiece, ground: SiteGround, _door: Vec2): void {
  const at = (x: number, z: number) => ground.at(x, z);
  const pileFoot = (p: Vec2) => Math.min(ground.at(p.x, p.z), ground.water) - 0.35;
  const H = HOUSE;
  const B = BALCONY;
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 1 / 3 };
  const corps3 = { stage: 0 as Stage, row: 2 / 3 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : le poteau ouest et son signe, la perche de l'aubergiste et sa lanterne allumée dès la ruine (la seule),
  // la bande de vase gris olive entre le parvis et l'eau, sous le ponton.
  add('ruine', 0, (b) => {
    westPost(b);
    const g = PT;
    b.box({ x: PERCH.x, y: g - 0.4, z: PERCH.z }, [0.1, PERCH.h + 0.4, 0.1], C.newShade);
    const tip = { x: PERCH.x - PERCH.arm, y: g + PERCH.h - 0.05, z: PERCH.z };
    b.beam({ x: PERCH.x, y: tip.y, z: PERCH.z }, tip, 0.08, C.newShade);
    lantern(b, { ...tip, y: tip.y - 0.04 }, true);
    // La vase : une bande qui s'élargit vers l'eau, posée sur le sol (trois rangs le long du ponton, quatre en travers).
    const cols = [-1.9, -0.6, 0.6, 1.9];
    const rowsAt = [0.2, 3.1, 6.0, 8.9];
    const p = (s: number, t: number) => {
      const q = onPontoon(s, t * (0.7 + s / 12));
      return [q.x, Math.max(ground.at(q.x, q.z), ground.water - 0.05) + 0.03, q.z] as const;
    };
    for (let i = 0; i < rowsAt.length - 1; i++)
      for (let k = 0; k < cols.length - 1; k++) b.quad(p(rowsAt[i], cols[k + 1]), p(rowsAt[i], cols[k]), p(rowsAt[i + 1], cols[k]), p(rowsAt[i + 1], cols[k + 1]), C.mud);
  });

  // ---- La ruine ----
  // Le corps 1 sur 3 la relève : le socle et le parvis disjoints, la table fendue, le banc renversé, les malles ouvertes.
  add(
    'ruine',
    0,
    (b) => {
      socle(b, true);
      b.extrude({ x: 0, y: SINK, z: 0, pitch: -Math.PI / 2 }, PARVIS_OUTLINE, PT - 0.03 - SINK, C.stoneShade, C.parvisWorn);
      // Deux dalles soulevées, à l'écart de la scène, du chemin et de la porte.
      for (const [x, z, yaw, pitch] of [
        [-3.3, 1.7, 0.3, 0.12],
        [4.5, 6.0, -0.2, -0.1],
      ] as const)
        b.box({ x, y: PT - 0.12, z, yaw, pitch }, [1.1, 0.16, 0.8], C.stoneShade, C.stone);
    },
    corps1,
  );
  add(
    'ruine',
    0,
    (b) => {
      const T = TABLE;
      const mid = (T.z0 + T.z1) / 2;
      const len = T.z1 - T.z0;
      // Les quatre pieds droits ; le plateau fendu en deux moitiés qui s'affaissent vers la fente.
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box({ x: T.x + sx * 0.3, y: PT, z: mid + sz * (len / 2 - 0.25) }, [0.11, T.top - 0.08, 0.11], C.wornShade);
      for (const side of [-1, 1])
        b.box(
          {
            x: T.x + side * 0.23,
            y: PT + T.top - 0.1 - 0.03,
            z: mid,
            yaw: Math.PI / 2,
            pitch: side * 0.12,
          },
          [len, 0.08, 0.4],
          C.wornShade,
          C.wornWood,
        );
      // Le banc de l'ouest renversé sur le flanc, celui de l'est debout.
      // (le siège ramené le long de x, basculé sur son long côté, puis remis nord-sud : les pieds vers l'ouest).
      drawPosed(
        b,
        {
          x: T.x - T.bench - 0.15,
          y: PT + 0.17,
          z: mid,
          yaw: -Math.PI / 2,
          pitch: Math.PI / 2,
        },
        (l) => drawPosed(l, { x: 0, y: 0, z: 0, yaw: Math.PI / 2 }, (m) => bench(m, len, C.wornWood, C.wornShade)),
      );
      drawPosed(b, { x: T.x + T.bench, y: PT, z: mid, yaw: 0 }, (l) => bench(l, len, C.wornWood, C.wornShade));
      // Les deux malles plates, couchées, ouvertes, vides, près de la table, à l'ouest du parvis.
      openTrunk(b, { x: -6.15, y: at(-6.15, 2.5), z: 2.5 }, 1.4);
      openTrunk(b, { x: -6.35, y: at(-6.35, 4.3), z: 4.3 }, 1.9);
    },
    corps1,
  );
  // Le corps 2 sur 3 la relève : le rez passé et sa porte qui pend à un gond, la moitié ouest du balcon sur son poteau, la
  // moitié est tombée sur le parvis (trois planches et le poteau est, couchés à plat, parallèles), sans linteau tombé.
  add(
    'ruine',
    0,
    (b) => {
      rez(b, true);
      const hinge = { x: -DOOR.half, y: PT + DOOR.top - 0.05, z: H.z1 + 0.03 };
      const a = -0.16;
      const leaf = (
        [
          [0, -2.0],
          [1.02, -2.0],
          [1.02, 0],
          [0, 0],
        ] as const
      ).map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)] as const);
      b.extrude({ ...hinge, yaw: -0.35 }, leaf, 0.07, C.wornShade, C.wornWood);
      b.box({ x: hinge.x, y: hinge.y - 0.12, z: hinge.z + 0.04 }, [0.1, 0.1, 0.12], C.iron);
      balconyFloor(b, -B.x, 0.1, true);
      railing(b, -B.x, 0.1, 4, true);
      for (const x of [4.45, 4.8, 5.15]) b.box({ x, y: PT - 0.02, z: 2.5, yaw: Math.PI / 2 }, [2.2, 0.06, 0.26], C.wornShade, C.wornWood);
      b.box({ x: 5.9, y: at(5.9, 2.5) - 0.05, z: 2.5, yaw: Math.PI / 2 }, [2.6, B.post, B.post], C.wornShade, C.wornWood);
    },
    corps2,
  );
  // Le corps 3 sur 3 la relève : l'étage de planches grises et usées, deux volets qui pendent de travers.
  add(
    'ruine',
    0,
    (b) => {
      etage(b, true);
      for (const [x, a] of [
        [GABLE_WINDOWS.etage[0] - WINDOW - 0.02, 0.35],
        [GABLE_WINDOWS.etage[1] + WINDOW + 0.02, -0.5],
      ] as const) {
        const hang = (
          [
            [-0.19, -0.76],
            [0.19, -0.76],
            [0.19, 0],
            [-0.19, 0],
          ] as const
        ).map(([px, py]) => [px * Math.cos(a) - py * Math.sin(a), px * Math.sin(a) + py * Math.cos(a)] as const);
        b.plate({ x, y: PT + GABLE_WINDOWS.etageY + WINDOW, z: H.z1 + 0.03 }, hang, C.wornShade);
      }
    },
    corps3,
  );
  // Le haut la relève : le toit d'ardoise délavée, son pan est crevé d'un seul trou et affaissé vers l'intérieur, trois
  // ardoises au pied du mur est ; le moignon de cheminée coupé à plat ; l'enseigne couchée face au ciel.
  add(
    'ruine',
    0,
    (b) => {
      const z0 = H.z0 - H.eave;
      const len = H.z1 - H.z0 + 2 * H.eave;
      roofPan(b, -1, z0, len, C.slateWorn, C.slateWornEdge);
      roofPan(b, 1, z0, 3.3, C.slateWorn, C.slateWornEdge);
      roofPan(b, 1, z0 + 5.3, len - 5.3, C.slateWorn, C.slateWornEdge);
      // Le morceau du pan qui s'est affaissé dans le trou : du bord du toit vers l'intérieur, plus bas que le faîte.
      b.extrude(
        { x: 0, y: PT, z: z0 + 3.45 },
        [
          [1.3, 6.15],
          [H.x + H.eave, H.etage - H.eave * SLOPE],
          [H.x + H.eave, H.etage - H.eave * SLOPE + H.slab],
          [1.3, 6.35],
        ],
        1.7,
        C.slateWorn,
        C.slateWornEdge,
      );
      gables(b, C.wornWood);
      for (const [z, yaw] of [
        [-4.2, 0.4],
        [-3.3, -0.3],
        [-2.2, 0.9],
      ] as const)
        b.box({ x: 4.15 + 0.1 * Math.sin(z * 3), y: at(4.2, z) - 0.03, z, yaw }, [0.6, 0.06, 0.4], C.slateWornEdge, C.slateWorn);
      b.box({ x: 0, y: PT + H.ridge - 1.4, z: CHIMNEY.z }, [CHIMNEY.w, 1.5, CHIMNEY.w], C.stoneShade, C.stone);
      drawPosed(b, { x: 2.2, y: PT + 0.01, z: 1.75, yaw: 0.25, pitch: -Math.PI / 2 }, (l) => signBoard(l, true));
    },
    haut,
  );
  // Les abords la relèvent : le ponton troué, son bout dans l'eau, le pieu qui penche et son bout de corde, la lanterne
  // éteinte couchée au pied du ponton.
  add(
    'ruine',
    0,
    (b) => {
      const deck = PT - 0.04;
      // Le tablier, par tronçons : deux trous où des planches manquent ; le dernier tronçon, cassé à l'entrée de l'eau,
      // plonge dedans (un tablier basculé vers le large, son bout sous l'eau).
      for (const [s0, s1] of [
        [0, 2.4],
        [3.1, 5.6],
        [6.2, 8.6],
      ] as const) {
        const m = onPontoon((s0 + s1) / 2, 0);
        b.box({ x: m.x, y: deck - 0.12, z: m.z, yaw: PONTOON_YAW }, [s1 - s0, 0.12, 2 * PONTOON.half], C.wornShade, C.wornWood);
      }
      const e0 = onPontoon(PLUNGE.from, 0);
      const drop = deck - 0.12 - (ground.water - 0.3);
      drawPosed(b, { x: e0.x, y: deck - 0.12, z: e0.z, yaw: Math.atan2(UX, UZ), pitch: Math.asin(drop / PLUNGE.len) }, (l) =>
        l.box({ x: 0, y: 0, z: PLUNGE.len / 2 }, [2 * PONTOON.half - 0.1, 0.12, PLUNGE.len], C.wornShade, C.wornWood),
      );
      for (const s of [2.7, 5.9, 8.4])
        for (const t of [-0.6, 0.6]) {
          const p = onPontoon(s, t);
          b.box({ x: p.x, y: pileFoot(p), z: p.z }, [0.2, deck - 0.12 - pileFoot(p), 0.2], C.wornShade);
        }
      // Le pieu d'amarrage qui penche, et le bout de corde qui pend dans l'eau.
      const foot = onPontoon(8.4, 1.05);
      const top = onPontoon(8.9, 1.45);
      const ft = { x: foot.x, y: pileFoot(foot), z: foot.z };
      const tp = { x: top.x, y: deck + 0.9, z: top.z };
      b.beam(ft, tp, 0.22, C.wornShade);
      const end = onPontoon(9.4, 1.7);
      b.beam({ x: tp.x, y: tp.y - 0.15, z: tp.z }, { x: end.x, y: ground.water - 0.1, z: end.z }, 0.05, C.rope);
      // La lanterne éteinte, couchée sur les dalles au pied du ponton.
      drawPosed(b, { x: 4.75, y: PT + 0.12, z: 4.55, yaw: 0.7, pitch: Math.PI / 2 }, (l) => lantern(l, { x: 0, y: 0.17, z: 0 }, false));
    },
    abords,
  );

  // ---- Le corps 1 sur 3 : le socle et le parvis remis à plat, joints nets ; la grande table entière et ses deux bancs ;
  // le banc de pierre bas contre le mur, à gauche de la porte.
  add(0, 0, (b) => {
    socle(b, false);
    parvis(b);
    const T = TABLE;
    const mid = (T.z0 + T.z1) / 2;
    const len = T.z1 - T.z0;
    b.box({ x: T.x, y: PT + T.top - 0.1, z: mid }, [T.w, 0.1, len], C.newShade, C.newWood);
    // Ses pieds pleins, droits, aux deux bouts (jamais en X).
    for (const sz of [-1, 1]) b.box({ x: T.x, y: PT, z: mid + sz * (len / 2 - 0.3) }, [T.w - 0.2, T.top - 0.1, 0.1], C.newShade);
    for (const side of [-1, 1]) drawPosed(b, { x: T.x + side * T.bench, y: PT, z: mid, yaw: 0 }, (l) => bench(l, len, C.newWood, C.newShade));
    const S = STONE_BENCH;
    b.box({ x: S.x, y: PT - 0.05, z: H.z1 + S.d / 2 }, [S.w, S.h + 0.05, S.d], C.stoneShade, C.stoneSun);
  });
  // Le corps 2 sur 3 : le rez d'enduit, la porte neuve et son chambranle aux racines ; le poteau est, la poutre et le
  // plancher du balcon d'un coup (un auvent au-dessus de la porte, jamais un cadre vide).
  add(0, 1 / 3, (b) => {
    rez(b, false);
    doorway(b);
    for (const x of GABLE_WINDOWS.rez) gableWindow(b, x, PT + GABLE_WINDOWS.rezY, true);
    b.box({ x: B.posts[1], y: SINK, z: B.postZ }, [B.post, PT + B.floor - B.thick - B.beam - SINK, B.post], C.newShade, C.newWood);
    balconyFloor(b, -B.x, B.x, false);
  });
  // Le corps 3 sur 3 : l'étage en planches neuves, le garde-corps du balcon, les volets de l'étage.
  add(0, 2 / 3, (b) => {
    etage(b, false);
    for (const x of GABLE_WINDOWS.etage) gableWindow(b, x, PT + GABLE_WINDOWS.etageY, true);
    railing(b, -B.x, B.x, B.bars, false);
  });
  // Le haut : le toit d'ardoise bleue et sa cheminée carrée ; l'enseigne au pignon ; la lanterne du pignon, fixée au mur à
  // l'angle ouest du pignon, allumée dès qu'elle est posée (jamais à une réussite).
  add(1, 0, (b) => {
    const z0 = H.z0 - H.eave;
    const len = H.z1 - H.z0 + 2 * H.eave;
    roofPan(b, -1, z0, len, C.slate, C.slateEdge);
    roofPan(b, 1, z0, len, C.slate, C.slateEdge);
    gables(b, C.newWood);
    b.box({ x: 0, y: PT + H.ridge - 1.4, z: CHIMNEY.z }, [CHIMNEY.w, 1.4 + CHIMNEY.above, CHIMNEY.w], C.stoneShade, C.stone);
    b.box({ x: 0, y: PT + H.ridge + CHIMNEY.above, z: CHIMNEY.z }, [CHIMNEY.w + 0.22, 0.18, CHIMNEY.w + 0.22], C.stoneShade, C.stoneSun);
    drawPosed(b, { x: 0, y: PT + SIGN.y, z: H.z1 + 0.01, yaw: 0 }, (l) => signBoard(l, false));
    // La lanterne du pignon : son support de fer, droit, sa vitre contre le mur.
    const L = GABLE_LANTERN;
    b.box({ x: L.x, y: PT + L.y, z: H.z1 + 0.15 }, [0.08, 0.08, 0.3], C.iron);
    lantern(b, { x: L.x, y: PT + L.y + 0.02, z: H.z1 + 0.27 }, true);
  });
  // Les abords : le ponton neuf et son pieu d'amarrage droit ; le chemin de dalles depuis `aub-1` et sa barrière basse
  // (deux lisses parallèles sur des piquets, sans croix) ; la lanterne sur un piquet bas au pied du ponton, allumée dès
  // qu'elle est posée.
  add(2, 0, (b) => {
    const deck = PT - 0.02;
    const n = 9;
    const step = PONTOON.len / n;
    for (let k = 0; k < n; k++) {
      const m = onPontoon(step * (k + 0.5), 0);
      b.box({ x: m.x, y: deck - 0.12, z: m.z, yaw: PONTOON_YAW }, [step - 0.08, 0.12, 2 * PONTOON.half], C.plankShade, C.plank);
    }
    for (const s of [3.4, 6.6, 9.8, 13.0])
      for (const t of [-0.6, 0.6]) {
        const p = onPontoon(s, t);
        b.box({ x: p.x, y: pileFoot(p), z: p.z }, [0.2, deck - 0.12 - pileFoot(p), 0.2], C.plankShade);
      }
    const post = onPontoon(13.0, 1.0);
    b.box({ x: post.x, y: pileFoot(post), z: post.z }, [0.24, deck + 0.85 - pileFoot(post), 0.24], C.newShade, C.newWood);
    // Le chemin de dalles : une longue dalle à facettes sur le chemin, ses joints en arêtes.
    const a = onPath(WALK.from, 0);
    const c = onPath(WALK.to, 0);
    const mid = { x: (a.x + c.x) / 2, z: (a.z + c.z) / 2 };
    const yaw = yawOf(a, c);
    let top = -Infinity;
    for (let s = WALK.from; s <= WALK.to; s += 1) for (const t of [-WALK.half, WALK.half]) top = Math.max(top, at(onPath(s, t).x, onPath(s, t).z));
    b.box({ x: mid.x, y: SINK, z: mid.z, yaw }, [WALK.to - WALK.from, top + 0.07 - SINK, 2 * WALK.half], C.stoneShade, C.stone);
    for (let s = WALK.from + 1.6; s < WALK.to - 0.5; s += 1.6) {
      const l = onPath(s, -WALK.half);
      const r = onPath(s, WALK.half);
      const y = top + 0.082;
      b.quad([l.x - PX * 0.03, y, l.z - PZ * 0.03], [r.x - PX * 0.03, y, r.z - PZ * 0.03], [r.x + PX * 0.03, y, r.z + PZ * 0.03], [l.x + PX * 0.03, y, l.z + PZ * 0.03], C.joint);
    }
    // La barrière basse, le long du bord sud du chemin : quatre piquets, deux lisses parallèles.
    const stakes = [0, 1, 2, 3].map((k) => onPath(WALK.from + ((WALK.fenceTo - WALK.from) * k) / 3, WALK.fence));
    for (const p of stakes) b.box({ x: p.x, y: at(p.x, p.z) - 0.3, z: p.z }, [0.12, 0.95, 0.12], C.newShade, C.newWood);
    const f0 = stakes[0];
    const f1 = stakes[3];
    for (const y of [0.3, 0.55]) b.beam({ x: f0.x, y: at(f0.x, f0.z) + y, z: f0.z }, { x: f1.x, y: at(f1.x, f1.z) + y, z: f1.z }, 0.07, C.newWood);
    // La lanterne du ponton : sur un piquet bas au pied du tablier, côté parvis ; jamais un réverbère, jamais au bout.
    const lamp = onPontoon(-0.2, -1.0);
    b.box({ x: lamp.x, y: at(lamp.x, lamp.z) - 0.3, z: lamp.z }, [0.1, 1.15, 0.1], C.newShade);
    lantern(b, { x: lamp.x, y: at(lamp.x, lamp.z) + 1.17, z: lamp.z }, true);
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

/** La valise (Hola / Hallo) : petite, carrée, à une poignée, deux sangles parallèles jamais croisées, sur le banc de pierre. */
const SUITCASE = { x: STONE_BENCH.x - 0.2, z: HOUSE.z1 + 0.22 } as const;

function suitcase(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const y = PT + STONE_BENCH.h;
    const { x, z } = SUITCASE;
    l.box({ x, y, z }, [0.55, 0.5, 0.22], C.case);
    l.box({ x, y: y + 0.5, z }, [0.2, 0.07, 0.05], C.strap);
    for (const dx of [-0.14, 0.14])
      l.plate(
        { x: x + dx, y, z: z + 0.112 },
        [
          [-0.03, 0],
          [0.03, 0],
          [0.03, 0.5],
          [-0.03, 0.5],
        ],
        C.strap,
      );
  });
}

/** Le plateau rond de bois uni et son seul pichet de terre sourde à une anse, vu en biais (Números / Zahlen), sur la table. */
const TRAY = { x: TABLE.x + 0.05, z: (TABLE.z0 + TABLE.z1) / 2 + 0.3 } as const;

function trayAndJug(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const y = PT + TABLE.top;
    l.prism({ x: TRAY.x, y, z: TRAY.z }, 0.34, 0.34, 0.04, 8, C.newShade, C.newWood);
    const jy = y + 0.04;
    // Le pichet : un corps ventru, un col qui s'amincit, une anse sur le côté (jamais une chope, ni un bec).
    l.prism({ x: TRAY.x, y: jy, z: TRAY.z }, 0.11, 0.15, 0.17, 7, C.jugShade, C.jug);
    l.prism({ x: TRAY.x, y: jy + 0.17, z: TRAY.z }, 0.15, 0.08, 0.17, 7, C.jugShade, C.jug);
    l.beam({ x: TRAY.x + 0.1, y: jy + 0.29, z: TRAY.z - 0.08 }, { x: TRAY.x + 0.19, y: jy + 0.12, z: TRAY.z - 0.15 }, 0.04, C.jugShade);
  });
}

/** La couverture unie, brun brique sourd, pliée en carré, à plat sur la main courante, dans la moitié ouest (Familia / Familie). */
const BLANKET = { x: -2.0 } as const;

function blanket(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const B = BALCONY;
    l.box({ x: BLANKET.x, y: PT + B.floor + B.rail + 0.01, z: B.z1 - 0.1 }, [0.66, 0.08, 0.5], C.blanketShade, C.blanket);
  });
}

/** Le seul balai de bruyère, droit, debout contre le mur entre le banc de pierre et la porte, sous le balcon (El, la / Der, die). */
const BROOM = { x: -1.12, z: HOUSE.z1 + 0.14 } as const;

function broom(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    l.box({ x: BROOM.x, y: PT + 0.42, z: BROOM.z }, [0.05, 1.08, 0.05], C.newShade);
    l.prism({ x: BROOM.x, y: PT, z: BROOM.z }, 0.17, 0.05, 0.46, 6, C.heather);
  });
}

/** La brouette de bois à une roue pleine (jamais de rayons), chargée de deux malles plates identiques, au pied du ponton (Frases / Sätze). */
const BARROW = { x: 3.9, z: 6.1, yaw: 0.5 } as const;

function barrow(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) =>
    drawPosed(l, { x: BARROW.x, y: PT, z: BARROW.z, yaw: BARROW.yaw }, (q) => {
      // La caisse sur ses deux pieds, les deux brancards parallèles, la roue pleine devant (à l'est du repère).
      q.box({ x: 0, y: 0.32, z: 0 }, [1.1, 0.12, 0.7], C.newShade, C.newWood);
      for (const dz of [-0.28, 0.28]) {
        q.box({ x: -0.4, y: 0, z: dz }, [0.08, 0.32, 0.08], C.newShade);
        q.beam({ x: 0.65, y: 0.3, z: dz }, { x: -0.95, y: 0.5, z: dz }, 0.07, C.newShade);
      }
      q.drum({ x: 0.68, y: 0.24, z: -0.06, pitch: Math.PI / 2 }, 0.24, 0.12, 8, C.newShade, C.newWood);
      flatTrunk(q, { x: -0.05, y: 0.44, z: 0 }, 0, 0.9);
      flatTrunk(q, { x: -0.05, y: 0.44 + 0.31, z: 0 }, 0, 0.9);
    }),
  );
}

/** Où se pose la trace de chaque rang, depuis le centre du lieu (la caméra du retour en garde la place). */
const TRACE_SPOTS = {
  greetings: { x: SUITCASE.x, z: SUITCASE.z },
  numbers: { x: TRAY.x, z: TRAY.z },
  family: { x: BLANKET.x, z: BALCONY.z1 },
  articles: { x: BROOM.x, z: BROOM.z },
  sentences: { x: BARROW.x, z: BARROW.z },
} as const;

/**
 * Les cinq traces, une par rang de mission, chacune avec sa partie (le corps en trois rangées, puis le haut, puis les
 * abords) ; la mission de même rang des deux langues porte la même (`es-<n>` et `de-<n>`), dessinée une fois.
 */
const RANKS = {
  greetings: {
    at: TRACE_SPOTS.greetings,
    lift: 1,
    stage: 0,
    row: 0,
    draw: suitcase,
  },
  numbers: {
    at: TRACE_SPOTS.numbers,
    lift: 1,
    stage: 0,
    row: 1 / 3,
    draw: trayAndJug,
  },
  family: {
    at: TRACE_SPOTS.family,
    lift: 3.5,
    stage: 0,
    row: 2 / 3,
    draw: blanket,
  },
  articles: {
    at: TRACE_SPOTS.articles,
    lift: 1,
    stage: 1,
    row: 0,
    draw: broom,
  },
  sentences: {
    at: TRACE_SPOTS.sentences,
    lift: 1,
    stage: 2,
    row: 0,
    draw: barrow,
  },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

/** Les rangs des missions, dans l'ordre de l'île (les deux langues ont les mêmes). */
export const AUBERGE_RANKS = ['greetings', 'numbers', 'family', 'articles', 'sentences'] as const;

// ---------- La scénette ----------

/** Le milieu de la scène, depuis le centre du lieu : sur le parvis, la façade et sa porte derrière, la table à gauche. */
const SCENE_SPOT = {
  dx: 0.8,
  dz: 4.4,
  half: [3.4, 1.1] as [number, number],
} as const;

/**
 * La hauteur du sol de la scène au-dessus de son point (le plus haut du sol sous sa plate-forme, comme questionScene.ts,
 * `sceneSpot`) : le dessus des dalles du parvis, son plancher. Le décor de près n'ajoute pas de plancher.
 */
const SCENE_RISE = (() => {
  const [hx, hz] = SCENE_SPOT.half;
  const nx = Math.ceil(hx),
    nz = Math.ceil(hz);
  let top = localGround(SCENE_SPOT.dx, SCENE_SPOT.dz);
  for (let i = -nx; i <= nx; i++) for (let k = -nz; k <= nz; k++) top = Math.max(top, localGround(SCENE_SPOT.dx + (i / nx) * hx, SCENE_SPOT.dz + (k / nz) * hz));
  return PT - top;
})();

/** L'aubergiste en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, jupe brune, corsage, tablier, foulard. */
function innkeeper(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.32, 0.24, 0.42, 8, C.skirt);
  b.prism({ x: at.x, y: at.y + 0.56, z: at.z }, 0.25, 0.24, 0.42, 8, C.shirt);
  b.box({ x: at.x, y: at.y + 0.2, z: at.z + 0.25 }, [0.44, 0.6, 0.05], C.apron);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  b.prism({ x: at.x, y: at.y + 0.92, z: at.z }, 0.26, 0.2, 0.08, 8, C.scarf);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.29, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.35, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.shirt);
}

/** La planche sur tréteaux des réponses : la hauteur de ses tréteaux, à l'échelle 1 ; une malle choisie se soulève d'un cran. */
const BOARD = { height: 0.55, lift: 0.2 } as const;

/** Le couvercle bombé des malles de réponse, en travers (x, y) : une demi-voûte à cinq pans. */
const DOME_LID: readonly (readonly [number, number])[] = [
  [-0.2, 0],
  [0.2, 0],
  [0.16, 0.1],
  [0, 0.15],
  [-0.16, 0.1],
];

/**
 * Une petite malle à couvercle bombé (les réponses seulement), d'un bois brun sourd, sans sangle ni marque, plus petite
 * que celles de la brouette, à l'échelle `s`. Vingt-six triangles.
 */
function domedChest(b: FacetBuilder, at: Vec3, s: number): void {
  b.box({ x: at.x, y: at.y, z: at.z }, [0.56 * s, 0.26 * s, 0.4 * s], C.chest);
  b.extrude(
    { x: at.x - 0.28 * s, y: at.y + 0.26 * s, z: at.z, yaw: Math.PI / 2 },
    DOME_LID.map(([x, y]) => [x * s, y * s] as const),
    0.56 * s,
    C.chestLid,
    C.chest,
  );
}

export const AUBERGE: PlaceArt = {
  role: 'L’aubergiste',
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
    keo: { dx: -2.3, dz: 0.3, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.3, dz: 0.3 },
    subject: { halfWidth: 3.4, bottom: -0.5, top: 3.2, depth: 0.3 },
    pitch: (14 * Math.PI) / 180,
  },
  // Le décor de près : le plancher est le parvis du lieu, la façade et sa porte derrière, le bout de la table à gauche ;
  // la racine qui cadre et le rocher bas sont aux abords (./aubergeSurroundings.ts). Il reste l'aubergiste en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) innkeeper(b, at, sphere);
  },
  answer: {
    size: { height: BOARD.height + BOARD.lift + 0.45, half: 0.32 },
    // Une planche sur deux tréteaux, sous la rangée des malles.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BOARD.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.7 * s], C.newShade, C.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.12, top - 0.08 * s - foot, 0.6 * s], C.newShade);
      }
    },
    // Une malle bombée posée sur la planche ; choisie, elle se soulève d'un cran (sa place le dit, jamais sa couleur seule).
    object(b, at, s, _i, _count, picked) {
      domedChest(
        b,
        {
          x: at.x,
          y: at.y + (BOARD.height + (picked ? BOARD.lift : 0)) * s,
          z: at.z,
        },
        s,
      );
    },
  },
  // Les dix missions en R : le parvis seul, rien de l'item ; les malles portent les réponses.
  rest() {},
  traces: Object.fromEntries(AUBERGE_RANKS.flatMap((rank) => [`es-${rank}`, `de-${rank}`].map((m) => [m, RANKS[rank]]))),
  // Kéo au retour : sur le chemin, à l'est de la porte, face à la maison.
  exit: { x: 1.4, z: 8.3 },
  // « Y aller » arrive au cap nord, de face (directeur artistique, retouche 1 : le cadre sûr avant le repère lointain) ;
  // la maison entière, le départ du ponton et la brouette dans le cadre (un test le vérifie).
};

/** Le plan de l'Auberge, pour les tests : la maison, le parvis, le balcon, la perche, le ponton, le chemin, la caméra. */
export const AUBERGE_LAYOUT = {
  house: HOUSE,
  parvis: PARVIS,
  parvisTop: PT,
  balcony: BALCONY,
  chimney: CHIMNEY,
  bellMark: BELL_MARK,
  sign: SIGN,
  jug: JUG,
  jugPlates: JUG_PLATES,
  gableLantern: GABLE_LANTERN,
  gableWindows: GABLE_WINDOWS,
  window: WINDOW,
  stoneBench: STONE_BENCH,
  perch: PERCH,
  table: TABLE,
  pontoon: { start: onPontoon(0, 0), end: onPontoon(PONTOON.len, 0), len: PONTOON.len, half: PONTOON.half, at: onPontoon },
  door: DOOR_AT,
  aub1: AUB1,
  scene: SCENE_SPOT,
  heightAtCenter: H0,
} as const;
