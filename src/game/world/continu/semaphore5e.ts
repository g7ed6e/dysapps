// Le Sémaphore (GD-22, lot 14 ; intention du directeur artistique du 20 octobre 2026, planche `selection-semaphore-v1`
// validée par le mainteneur le 21 octobre 2026) : « une tour de pierre au bord du plateau, et de grands bras de bois qui
// parlaient le jour aux navires du large ». Le cœur, sans figure : les deux bras sur leur mât, leurs cordages, les fanions
// sur la drisse, la corne de brume. Une tour de pierre grise à six pans, aussi large que haute, au sommet plat (une
// corniche simple, sans créneaux), couronnée d'une cabine de veille en bois au toit à un pan ; à l'ouest de la cabine, le
// mât à huit pans et ses deux bras, attachés par leur bout intérieur, relevés du même angle vers le nord-ouest, parallèles,
// celui du bas plus long, le mât qui dépasse au-dessus de la charnière du haut ; une drisse et trois fanions à motifs du
// mât à la cabine. Sur la cour de dalles chaudes, la corne de brume à pavillon évasé, tournée vers l'ouest, sur un tréteau
// bas ; un muret bas de gros blocs le long des bords nord et ouest, face au large.
// Le signe de l'absence : le pivot des bras, pris par les Ferrailleurs, a laissé sur le mur sud, à droite de la porte, vers
// 2,6 de haut, un trou rond nu brun sombre et quatre goujons de fer courts (comme le creux de l'Étuve) ; il ne change
// jamais, et ce n'est jamais une étape.
//
// La ruine : tout est là, tombé ou cassé, couché à plat, parallèle, jamais un chantier. Les murs fendus, le haut cassé
// d'un côté en une marche basse ; quatre gros blocs à facettes au pied ; le toit de la cabine tombé à plat sur la cour et
// deux de ses planches à côté ; le mât en deux tronçons et les deux bras couchés le long du mur ouest ; deux fanions
// délavés à plat ; la corne renversée sur le flanc à côté de son tréteau couché ; quelques blocs du muret sortis du rang.
// Une seule lumière, celle du signaleur, sur sa perche à droite de la porte. Cinq parties (3 + 1 + 1, comme les Radeaux) :
// le corps en trois (la cour, le pied de la tour, la porte et son linteau aux racines ; le fût jusqu'à la corniche ; la
// cabine), le haut (le mât, les bras, les cordages, la drisse et ses fanions, la lanterne de la potence), les abords (le
// muret remis en rang, la corne sur son tréteau, la lanterne du chemin). Trois lanternes au plus, toutes sous 4 : aucune
// lumière au-dessus de la corniche. La chaussée qui arrive de l'est est celle de la terre (lot 13a) : le lieu n'y pose
// rien ; elle devient le seuil de la cour, à sa hauteur, sous le disque de son nœud. Une trace par mission, avec sa partie (`stage`, `row`). Rien ne bouge, rien à lire. Code pur (placeArt.ts).
import type { Stage } from './construction';
import { drawPosed, FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { RIBBON_LIFT } from './paths';
import { CAUSEWAY_5E } from './paths5e';
import { COLORS_5E, PATH_NODES_5E, PLACES_5E } from './plan5e';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter sur une pente (places.ts). */
const SINK = -0.8;

/**
 * Les couleurs du Sémaphore : les matières des Passeurs sur le plateau (lot 13) : la pierre grise moussue, les dalles
 * chaudes de la cour et leurs joints, le bois brun désaturé neuf et usé, les bardeaux, le fer (les goujons, les cercles,
 * la potence, le chapeau des lanternes), le vert-de-gris des racines du linteau ; le trou du pivot, brun très sombre, jamais
 * noir. Les fanions de la drisse : bleu-gris, brique sourde, vert sauge, leurs motifs crème ; jamais le rouge orangé de la
 * veste du signaleur. La seule lumière, l'ocre des lanternes ; une lanterne éteinte a la vitre #BFC4B8 et aucune face
 * ocre (retouche 1 : le chapeau des trois lanternes est de fer, plus de bronze).
 */
const C = {
  stone: COLORS_5E.stone,
  stoneSun: COLORS_5E.stoneSun,
  stoneShade: COLORS_5E.stoneShade,
  moss: COLORS_5E.plateauMoss,
  // La fente d'un mur : une arête de facette d'un gris à peine plus sombre, jamais un trait noir.
  crack: 0x80857e,
  slab: 0xcfc6b4,
  slabWorn: 0xbcb3a1,
  joint: COLORS_5E.stoneShade,
  newWood: 0xa68672,
  newShade: 0x8c766a,
  wornWood: 0x9f9279,
  wornShade: 0x86775f,
  shingle: 0x8c766a,
  shingleLine: 0x7a665b,
  door: 0x7d6650,
  // Le pavillon de la corne, vu dedans : un bois brun sombre, jamais le brun du trou.
  bore: 0x5e5046,
  hole: 0x3a312c,
  verdigris: 0x6f9a8a,
  iron: 0x6f6a60,
  rope: 0xd8c49a,
  lantern: COLORS_5E.lantern,
  lanternOff: 0xbfc4b8,
  // Les fanions de la drisse et leurs motifs ; délavés dans la ruine.
  flagBlue: 0x5b7c99,
  flagBrick: 0x9c5e4a,
  flagSage: 0x7f9a84,
  motif: 0xd8c49a,
  fadedBlue: 0x93a0aa,
  fadedBrick: 0xab9283,
  // Les fanions des réponses : tous de la même teinte, unis (réservée à la question).
  answerFlag: 0x6d8aa3,
  // Les traces : le tonnelet et ses cercles, l'osier du panier, la couverture bleu-gris pliée, la toile des perches.
  cask: 0x8f6f55,
  wicker: 0xb39a72,
  wickerShade: 0x9c845f,
  blanket: 0x6f8aa0,
  blanketShade: 0x5f7889,
  cloth: 0xd9cfb8,
  // Le signaleur, en pion (son modèle 3D prend sa place, ./habitants.ts), dans les couleurs de son modèle : bottes,
  // pantalon gris, veste orange, casquette bleue.
  boots: 0x55595a,
  trousers: 0x5d5a52,
  jacket: 0xd0602e,
  head: 0xe3b48a,
  cap: 0x2f4a78,
} as const;

// ---------- Le repère du lieu ----------

/** Le centre du lieu et le sol sous lui, dans le monde. */
const CENTER: Vec2 = PLACES_5E.find((p) => p.id === 'semaphore')!.center;
const H0 = standingHeight(heightAt5e(CENTER));

/** Le sol du 5e sous un point du repère du lieu, depuis le sol de son centre (comme `SiteGround.at`). */
const localGround = (lx: number, lz: number): number => standingHeight(heightAt5e({ x: CENTER.x + lx, z: CENTER.z + lz })) - H0;

/**
 * La cour de dalles chaudes, rectangulaire, entre le muret (au nord et à l'ouest, face au large) et la porte du lieu (au
 * sud, `door` du plan en (2, 8), où s'arrête la chaussée qui vient de l'est) : ses bords, et le dessus de ses dalles,
 * au-dessus du plus haut du sol sous elle (le plateau ondule).
 */
const COURT = { x0: -9.2, x1: 7.6, z0: -8.6, z1: 6.4 } as const;

/**
 * Le seuil de dalles devant la porte du lieu, du bord sud de la cour au nœud de la porte (`door` du plan, en (2, 8)), large
 * comme la chaussée : le plateau ondule, la cour est posée sur son plus haut ; au sud, la chaussée qui arrive de l'est
 * finit par son disque de dalle sur le nœud, et y devient ce seuil, à sa hauteur (`top`, 0,03 sous le disque : il passe
 * dessous, rien du lieu n'est posé sur la chaussée, aucun sol entre les deux), puis une marche monte à la cour
 * (rattrapage du lot 13a). Ses bords en x et en z, son dessus, depuis le pied du lieu.
 */
const STEP = (() => {
  const n = PATH_NODES_5E.find((p) => p.id === 'semaphore')!.at;
  const door = { x: n.x - CENTER.x, z: n.z - CENTER.z };
  const top = localGround(door.x, door.z) + RIBBON_LIFT - 0.03;
  return { x0: door.x - CAUSEWAY_5E.half, x1: door.x + CAUSEWAY_5E.half, z0: COURT.z1, z1: door.z, top } as const;
})();

/** Le contour de la cour dans le repère d'un aplat couché (x, −z), dans le sens inverse des aiguilles d'une montre. */
const flatOutline = (pts: readonly (readonly [number, number])[]) => pts.map(([x, z]) => [x, -z] as const).reverse();
const COURT_OUTLINE = flatOutline([
  [COURT.x0, COURT.z0],
  [COURT.x1, COURT.z0],
  [COURT.x1, COURT.z1],
  [COURT.x0, COURT.z1],
]);

const PT = (() => {
  let top = -Infinity;
  for (let x = COURT.x0; x <= COURT.x1 + 1e-6; x += 0.8) for (let z = COURT.z0; z <= COURT.z1 + 1e-6; z += 0.8) top = Math.max(top, localGround(x, z));
  return top + 0.15;
})();

/**
 * La tour à six pans (hauteurs depuis le dessus des dalles) : son axe, au nord de la cour ; le rayon de son pied et de son
 * fût (une face plate au sud, celle de la porte) ; la hauteur où le pied s'arrête (le linteau, la fin du corps 1 sur 3) ;
 * sa hauteur, sa corniche plate, plus large d'un rien, sans créneaux. La ruine s'arrête à `broken`, et d'un côté (l'est)
 * à `step` : une marche basse, jamais des dents.
 */
const TOWER = { x: 0, z: -2.5, r: 3.45, rTop: 3.35, split: 2.9, h: 6.5, cornice: 0.4, corniceR: 3.75, broken: 4.7, step: 5.6 } as const;

/** Le dessus de la corniche, depuis le dessus des dalles. */
const CORNICE_TOP = TOWER.h + TOWER.cornice;

/** Le rayon intérieur d'un hexagone (du centre au milieu d'une face). */
const inner = (r: number): number => r * Math.cos(Math.PI / 6);

/** La face sud du pied de la tour, où sont la porte et le trou du pivot. */
const SOUTH_Z = TOWER.z + inner(TOWER.r);

/** La porte : sa demi-largeur et son haut ; le linteau de bois au-dessus, sa demi-largeur. */
const DOOR = { half: 0.55, top: 2.15, lintel: 0.25, lintelHalf: 0.85 } as const;

/**
 * Le signe de l'absence, sur la face sud, à droite de la porte, vers 2,6 de haut : le trou rond (rayon `r`, à `sides`
 * pans : seize depuis la retouche 1, il se lisait octogone), ses quatre goujons en diagonale à `stud` du centre (comme le
 * creux de l'Étuve), leur côté `size`.
 */
const PIVOT_MARK = { x: 1.25, y: 2.6, r: 0.22, sides: 16, stud: 0.4, size: 0.1 } as const;

/** La cabine de veille sur la corniche, à l'est du mât : son milieu, son côté, la hauteur de ses murs au sud et au nord, le débord de son toit. */
const CABIN = { x: 0.8, z: -2.5, side: 3, low: 2.1, high: 2.7, eave: 0.3, slab: 0.15 } as const;

/** La pente du toit de la cabine, en hauteur par unité vers le nord. */
const CABIN_SLOPE = (CABIN.high - CABIN.low) / CABIN.side;

/** Le dessus du toit de la cabine en `z` (depuis le dessus des dalles). */
const cabinRoofTop = (z: number): number => CORNICE_TOP + CABIN.low + (CABIN.z + CABIN.side / 2 - z) * CABIN_SLOPE + CABIN.slab;

/**
 * Le mât à huit pans, debout sur la corniche à l'ouest de la cabine : sa place, son rayon, le haut de son fût et son
 * chapeau carré de bois (16 au plus au-dessus de la cour : sous les aiguilles, sous le Donjon).
 */
const MAST = { x: -2.9, z: -2.3, r: 0.2, top: 15.5, cap: 0.5, capH: 0.25 } as const;

/**
 * Les deux bras : attachés au mât par leur bout intérieur, aux charnières `y` ; relevés de `angle` vers le nord-ouest
 * (`dir`, le cap d'un repère dont +z pointe le long du bras), parallèles ; le bras du bas plus long. Une planche de
 * `width` × `thick`, sa face large tournée vers le sud-ouest. Le contrepoids carré de pierre, collé au mât, au départ de
 * chaque bras, du côté opposé.
 */
const ARMS = {
  low: { y: 11.0, len: 5.0 },
  high: { y: 13.2, len: 3.6 },
  angle: (35 * Math.PI) / 180,
  dir: (-3 * Math.PI) / 4,
  // Retouche 1 (directeur artistique) : des planches larges, lues de loin comme des bras et non comme des tiges.
  width: 0.7,
  thick: 0.15,
  weight: 0.5,
} as const;

/** La direction à plat du bras (le nord-ouest). */
const ARM_FLAT = { x: Math.sin(ARMS.dir), z: Math.cos(ARMS.dir) } as const;

/** Le bout d'un bras, depuis son attache au mât. */
function armTip(arm: { y: number; len: number }): Vec3 {
  const a = { x: MAST.x + ARM_FLAT.x * MAST.r * 0.5, z: MAST.z + ARM_FLAT.z * MAST.r * 0.5 };
  const flat = arm.len * Math.cos(ARMS.angle);
  return { x: a.x + ARM_FLAT.x * flat, y: arm.y + arm.len * Math.sin(ARMS.angle), z: a.z + ARM_FLAT.z * flat };
}

/**
 * La drisse, tendue du mât au mur ouest de la cabine, d'ouest en est (ses fanions regardent la porte) : elle finit sur le
 * mur, à 1,6 au-dessus de la corniche, bien sous le débord du toit (retouche 1 : elle se lisait finir au toit) ; les
 * trois fanions triangulaires pendus dessous (leur place le long d'elle, de 0 au mât à 1 au mur), leur largeur, leur
 * hauteur (plus grands à la retouche 1 : la hauteur de 30 %, la largeur de 20 %, ce que permet la drisse de deux unités
 * sans que deux fanions se touchent).
 */
const HALYARD = { from: { x: MAST.x + MAST.r, y: 9.6, z: MAST.z }, to: { x: CABIN.x - CABIN.side / 2, y: CORNICE_TOP + 1.6, z: MAST.z }, flags: [0.17, 0.5, 0.83], w: 0.6, h: 0.78 } as const;

/** Les motifs des fanions de la drisse, un par fanion : un disque, une bande large, un losange ; jamais une croix ni un X. */
const FLAGS = [
  { color: C.flagBlue, motif: 'disc' },
  { color: C.flagBrick, motif: 'band' },
  { color: C.flagSage, motif: 'diamond' },
] as const;

/**
 * La corne de brume, tournée vers l'ouest, sur la cour à gauche de la tour : le bout étroit dans son coffre carré (`x`),
 * le tube et le pavillon très évasé (2,6 de long, la bouche de 1,6), les cercles de fer ; le tréteau bas sous le coffre.
 */
const HORN = { x: -4.5, z: 2.6, axis: 0.98, tube: { r0: 0.13, r1: 0.2, len: 1.5 }, bell: { r1: 0.8, len: 1.1 }, box: 0.5, trestle: 0.73 } as const;

/** La perche du signaleur, à droite de la porte, plantée dans la cour, et sa lanterne au bout d'un bras tourné vers l'est (jamais devant le trou). */
const PERCH = { x: 2.1, z: 1.3, h: 2.1, arm: 0.36 } as const;

/**
 * La potence de fer, au mur sud-ouest de la tour, à gauche de la porte : la lanterne qui s'allume avec le haut. Le milieu de
 * la face, le haut de la potence et son avancée.
 */
const SW_NORMAL = { x: Math.cos((5 * Math.PI) / 6), z: Math.sin((5 * Math.PI) / 6) } as const;
const GIBBET = { y: 3.7, out: 0.55 } as const;

/** La lanterne du chemin, sur un piquet au bord est de la cour, en tête de la chaussée. */
const PATH_LAMP = { x: 6.6, z: 5.4, h: 1.15 } as const;

/**
 * Le muret bas de gros blocs, le long des bords nord et ouest de la cour : leur taille, leur pas ; les blocs que la ruine
 * a sortis du rang (leur rang dans la liste), remis en rang avec les abords.
 */
const WALL = { len: 1.7, h: 0.6, d: 0.8, step: 2.1, fallen: [1, 4, 9] } as const;
const WALL_BLOCKS: readonly { x: number; z: number; yaw: number }[] = (() => {
  const out: { x: number; z: number; yaw: number }[] = [];
  for (let x = COURT.x0 + 1.3; x < COURT.x1 - 0.8; x += WALL.step) out.push({ x, z: COURT.z0 + WALL.d / 2, yaw: 0.05 * Math.sin(x * 3.1) });
  for (let z = COURT.z0 + 2.4; z < COURT.z1 - 0.8; z += WALL.step) out.push({ x: COURT.x0 + WALL.d / 2, z, yaw: Math.PI / 2 + 0.05 * Math.sin(z * 2.3) });
  return out;
})();

/** La porte du lieu (le bout de la chaussée), et le nœud d'où elle arrive, depuis le centre. */
const DOOR_AT: Vec2 = (() => {
  const n = PATH_NODES_5E.find((p) => p.id === 'semaphore')!.at;
  return { x: n.x - CENTER.x, z: n.z - CENTER.z };
})();
const AIG3: Vec2 = (() => {
  const n = PATH_NODES_5E.find((p) => p.id === 'aig-3')!.at;
  return { x: n.x - CENTER.x, z: n.z - CENTER.z };
})();

// ---------- Les petits volumes ----------

/** Un pavé fermé (son dessous aussi : un contrepoids, un chapeau, qu'on voit d'en bas). */
function block(b: FacetBuilder, at: Vec3, size: readonly [number, number, number], color: number, top = color): void {
  b.box(at, size, color, top);
  const [sx, , sz] = size;
  b.quad([at.x - sx / 2, at.y, at.z - sz / 2], [at.x + sx / 2, at.y, at.z - sz / 2], [at.x + sx / 2, at.y, at.z + sz / 2], [at.x - sx / 2, at.y, at.z + sz / 2], color);
}

/**
 * Une lanterne pendue (sa vitre, un pavé : dix triangles ; son chapeau de fer en pointe), d'ocre ou éteinte : éteinte,
 * aucune de ses faces n'est ocre (retouche 1 : le chapeau de bronze se lisait comme une lumière).
 */
function lantern(b: FacetBuilder, top: Vec3, lit: boolean): void {
  b.box({ x: top.x, y: top.y - 0.34, z: top.z }, [0.24, 0.3, 0.24], lit ? C.lantern : C.lanternOff);
  b.prism({ x: top.x, y: top.y - 0.04, z: top.z, yaw: Math.PI / 4 }, 0.21, 0, 0.16, 4, C.iron);
}

/** Un disque à `n` pans (un aplat), de rayon `r`. */
const disc = (r: number, n: number, turn = 0) => Array.from({ length: n }, (_, k) => [r * Math.cos((2 * Math.PI * k) / n + turn), r * Math.sin((2 * Math.PI * k) / n + turn)] as const);

/** Une fente du mur : une bande étroite brisée, d'un gris à peine plus sombre, posée sur une face (dans son repère). */
function crack(l: FacetBuilder, pts: readonly (readonly [number, number])[]): void {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [cx, cy] = pts[i + 1];
    l.quad([ax - 0.035, ay, 0], [ax + 0.035, ay, 0], [cx + 0.035, cy, 0], [cx - 0.035, cy, 0], C.crack);
  }
}

/** Dessine sur une face de la tour : le repère tourné vers la normale de la face (+z sortant), posé à sa surface. */
function onFace(b: FacetBuilder, angle: number, r: number, along: number, draw: (l: FacetBuilder) => void): void {
  const nx = Math.cos(angle);
  const nz = Math.sin(angle);
  const d = inner(r) + 0.012;
  // Le +x du repère suit la face vers la droite, vu de dehors.
  drawPosed(b, { x: TOWER.x + nx * d + nz * along, y: PT, z: TOWER.z + nz * d - nx * along, yaw: Math.atan2(nx, nz) }, draw);
}

/** Le pied de la tour, du sol au linteau (usé : la ruine, ses fentes). */
function towerFoot(b: FacetBuilder, worn: boolean): void {
  b.prism({ x: TOWER.x, y: SINK, z: TOWER.z }, TOWER.r, TOWER.r, PT + TOWER.split - SINK, 6, worn ? C.stoneShade : C.stone, C.stoneSun);
}

/** La porte de planches unies (deux joints droits) ; son linteau de bois, nu ou à la bande des racines. */
function doorway(b: FacetBuilder, worn: boolean): void {
  const z = SOUTH_Z;
  b.box({ x: 0, y: PT, z: z + 0.02 }, [2 * DOOR.half, DOOR.top, 0.08], worn ? C.wornShade : C.newShade, worn ? C.wornWood : C.door);
  for (const x of [-0.18, 0.18]) b.plate({ x, y: PT + 0.05, z: z + 0.065 }, [[-0.02, 0], [0.02, 0], [0.02, DOOR.top - 0.1], [-0.02, DOOR.top - 0.1]], worn ? C.wornShade : C.newShade);
  b.box({ x: 0, y: PT + DOOR.top, z: z + 0.06 }, [2 * DOOR.lintelHalf, DOOR.lintel, 0.14], worn ? C.wornShade : C.newShade, worn ? C.wornWood : C.newWood);
  if (worn) return;
  // La bande des racines, sur le linteau seulement : une onde en vert-de-gris, sans lettre ni autre motif.
  const fz = z + 0.135;
  const wave = [-0.7, -0.35, 0, 0.35, 0.7].map((x, i) => [x, PT + DOOR.top + 0.12 + (i % 2 ? 0.04 : -0.03)] as const);
  for (let i = 0; i < wave.length - 1; i++) {
    const [ax, ay] = wave[i];
    const [cx, cy] = wave[i + 1];
    b.quad([ax, ay - 0.03, fz], [cx, cy - 0.03, fz], [cx, cy + 0.03, fz], [ax, ay + 0.03, fz], C.verdigris);
  }
}

/** Le signe de l'absence : le trou rond nu, brun sombre, et ses quatre goujons de fer courts en diagonale. */
function pivotMark(b: FacetBuilder): void {
  const M = PIVOT_MARK;
  const z = SOUTH_Z + 0.012;
  b.plate({ x: M.x, y: PT + M.y, z }, disc(M.r, M.sides, Math.PI / M.sides), C.hole);
  const d = M.stud * Math.SQRT1_2;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) b.box({ x: M.x + sx * d, y: PT + M.y + sy * d - M.size / 2, z: SOUTH_Z + 0.06 }, [M.size, M.size, 0.12], C.iron);
}

/** La cour de dalles chaudes : une grande dalle à facettes, ses joints en arêtes nettes, en rangs décalés (jamais une grille). */
function court(b: FacetBuilder): void {
  b.extrude({ x: 0, y: SINK, z: 0, pitch: -Math.PI / 2 }, COURT_OUTLINE, PT - SINK, C.stoneShade, C.slab);
  courtStep(b, C.slab);
  const y = PT + 0.012;
  const rows = [-6.1, -3.6, -1.1, 1.4, 3.9];
  for (const z of rows) b.quad([COURT.x0, y, z + 0.035], [COURT.x1, y, z + 0.035], [COURT.x1, y, z - 0.035], [COURT.x0, y, z - 0.035], C.joint);
  const edges = [COURT.z0, ...rows, COURT.z1];
  for (let i = 0; i < edges.length - 1; i++) {
    const shift = i % 2 ? 1.4 : 0;
    for (let x = COURT.x0 + 2.2 + shift; x < COURT.x1 - 0.6; x += 2.8) {
      // Sous la tour, rien : on ne le verrait pas.
      const mid = (edges[i] + edges[i + 1]) / 2;
      if (Math.hypot(x - TOWER.x, mid - TOWER.z) < TOWER.r - 0.2) continue;
      b.quad([x - 0.035, y, edges[i + 1]], [x + 0.035, y, edges[i + 1]], [x + 0.035, y, edges[i]], [x - 0.035, y, edges[i]], C.joint);
    }
  }
}

/**
 * Les joints de la cour en ruine : des bouts de rangs et de joints de travers, rompus (jamais la grille entière de la
 * cour remise à plat), hors du passage de la porte de la tour et de la place de la scénette.
 */
const RUIN_JOINTS = {
  rows: [
    [-6.1, -8.6, -4.4],
    [-6.1, 2.6, 7.0],
    [1.4, -8.6, -4.6],
    [1.4, 3.4, 7.2],
    [3.9, -8.8, -5.2],
    [3.9, 4.6, 7.2],
  ],
  cross: [
    [-6.6, 1.4, 3.9],
    [5.8, 1.4, 3.9],
    [-5.2, -8.6, -6.1],
  ],
} as const;

function ruinJoints(b: FacetBuilder): void {
  const y = PT - 0.03 + 0.012;
  for (const [z, x0, x1] of RUIN_JOINTS.rows) b.quad([x0, y, z + 0.035], [x1, y, z + 0.035], [x1, y, z - 0.035], [x0, y, z - 0.035], C.joint);
  for (const [x, z0, z1] of RUIN_JOINTS.cross) b.quad([x - 0.035, y, z1], [x + 0.035, y, z1], [x + 0.035, y, z0], [x - 0.035, y, z0], C.joint);
}

/** Le seuil au bord sud de la cour, à la hauteur de la chaussée, sous le disque de son nœud ; la cour, une marche plus haut. */
function courtStep(b: FacetBuilder, color: number): void {
  b.box({ x: (STEP.x0 + STEP.x1) / 2, y: SINK, z: (STEP.z0 + STEP.z1) / 2 }, [STEP.x1 - STEP.x0, STEP.top - SINK, STEP.z1 - STEP.z0], C.stoneShade, color);
}

/** Un bloc du muret, debout dans le rang. */
function wallBlock(b: FacetBuilder, w: { x: number; z: number; yaw: number }): void {
  b.box({ x: w.x, y: PT - 0.3, z: w.z, yaw: w.yaw }, [WALL.len, WALL.h + 0.3, WALL.d], C.stone, C.stoneSun);
}

/**
 * La corne, dans son repère : de son bout étroit (z = 0) à sa bouche (z = 2,6), le long de +z ; le tube, le pavillon très
 * évasé, deux cercles de fer, le dedans de la bouche brun sombre ; le coffre carré où entre le bout étroit.
 */
function hornLocal(l: FacetBuilder, worn: boolean): void {
  const H = HORN;
  const wood = worn ? C.wornWood : C.newWood;
  const shade = worn ? C.wornShade : C.newShade;
  l.prism({ x: 0, y: 0, z: 0, pitch: Math.PI / 2 }, H.tube.r0, H.tube.r1, H.tube.len, 8, wood, shade);
  l.prism({ x: 0, y: 0, z: H.tube.len, pitch: Math.PI / 2 }, H.tube.r1, H.bell.r1, H.bell.len, 8, wood, C.bore);
  l.band({ x: 0, y: 0, z: H.tube.len - 0.04, pitch: Math.PI / 2 }, H.tube.r1 + 0.015, 0.09, 8, C.iron);
  l.band({ x: 0, y: 0, z: H.tube.len + H.bell.len - 0.1, pitch: Math.PI / 2 }, H.bell.r1 - 0.05, 0.09, 8, C.iron);
  l.box({ x: 0, y: -H.box / 2, z: -H.box / 2 + 0.05 }, [H.box, H.box, H.box], shade, wood);
}

/** Le tréteau bas, dans son repère : une planche le long de x, deux paires de pieds écartés en Λ (jamais en X). */
function trestleLocal(l: FacetBuilder, top: number, worn: boolean): void {
  const wood = worn ? C.wornWood : C.newWood;
  const shade = worn ? C.wornShade : C.newShade;
  l.box({ x: 0, y: top - 0.12, z: 0 }, [1.6, 0.12, 0.34], shade, wood);
  for (const x of [-0.65, 0.65]) for (const s of [-1, 1]) l.beam({ x, y: 0, z: s * 0.36 }, { x, y: top - 0.12, z: s * 0.1 }, 0.08, shade);
}

/** Une perche droite, ou couchée : son dessin le long de +z, de `len`, de section `t`. */
function rodLocal(l: FacetBuilder, len: number, t: number, color: number): void {
  l.beam({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: len }, t, color);
}

/** Un fanion de la drisse : un triangle pendu entre `a` et `c`, sa pointe en bas, son motif crème des deux côtés. */
function drisseFlag(b: FacetBuilder, a: Vec3, c: Vec3, h: number, color: number, motif: 'disc' | 'band' | 'diamond'): void {
  const mid = { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2, z: (a.z + c.z) / 2 };
  const tip: [number, number, number] = [mid.x, mid.y - h, mid.z];
  const A: [number, number, number] = [a.x, a.y, a.z];
  const B: [number, number, number] = [c.x, c.y, c.z];
  // La face qui regarde le sud (la porte), puis son dos.
  b.triangle(A, tip, B, color);
  b.triangle(A, B, tip, color);
  // Le motif, dans le plan du fanion, un rien devant chaque face : en coordonnées (le long du haut, vers le bas).
  const ux = (c.x - a.x) / 2,
    uy = (c.y - a.y) / 2,
    uz = (c.z - a.z) / 2;
  const at = (s: number, d: number, off: number): [number, number, number] => [mid.x + ux * s, mid.y + uy * s - d * h, mid.z + uz * s + off];
  const shapes: readonly (readonly [number, number])[][] =
    motif === 'disc'
      ? [disc(0.16, 6).map(([s, d]) => [s / Math.hypot(ux, uz), 0.36 + d / h] as const)]
      : motif === 'band'
        ? [
            [
              [-0.52, 0.18],
              [0.52, 0.18],
              [0.34, 0.42],
              [-0.34, 0.42],
            ],
          ]
        : [
            [
              [0, 0.16],
              [0.2, 0.33],
              [0, 0.5],
              [-0.2, 0.33],
            ],
          ];
  for (const shape of shapes)
    for (const side of [1, -1]) {
      const pts = shape.map(([s, d]) => at(s, d, side * 0.012));
      for (let k = 1; k < pts.length - 1; k++) {
        if (side > 0) b.triangle(pts[0], pts[k + 1], pts[k], C.motif);
        else b.triangle(pts[0], pts[k], pts[k + 1], C.motif);
      }
    }
}

/** Le point de la drisse à `t` (0 au mât, 1 au mur de la cabine). */
const onHalyard = (t: number): Vec3 => ({
  x: HALYARD.from.x + (HALYARD.to.x - HALYARD.from.x) * t,
  y: PT + HALYARD.from.y + (HALYARD.to.y - HALYARD.from.y) * t,
  z: HALYARD.from.z + (HALYARD.to.z - HALYARD.from.z) * t,
});

/** Un bras : une planche fermée, de son attache au mât jusqu'à son bout, relevée vers le nord-ouest. */
function arm(b: FacetBuilder, a: { y: number; len: number }): void {
  const T = ARMS.thick / 2;
  const W = ARMS.width / 2;
  drawPosed(b, { x: MAST.x + ARM_FLAT.x * MAST.r * 0.5, y: PT + a.y, z: MAST.z + ARM_FLAT.z * MAST.r * 0.5, yaw: ARMS.dir, pitch: -ARMS.angle }, (l) =>
    l.extrude(
      { x: 0, y: 0, z: 0 },
      [
        [-T, -W],
        [T, -W],
        [T, W],
        [-T, W],
      ],
      a.len,
      C.newShade,
      C.newWood,
    ),
  );
  // Le contrepoids de pierre, collé au mât, de l'autre côté de l'attache.
  const d = MAST.r + ARMS.weight / 2;
  block(b, { x: MAST.x - ARM_FLAT.x * d, y: PT + a.y - ARMS.weight / 2, z: MAST.z - ARM_FLAT.z * d }, [ARMS.weight, ARMS.weight, ARMS.weight], C.stoneShade, C.stone);
}

// ---------- Le modèle ----------

/**
 * Les volumes du Sémaphore, de la ruine aux abords (le modèle du lieu). `ground` : le sol sous un point du lieu ; `door` :
 * sa porte, au sud, au bout de la chaussée qui vient de l'est.
 */
function model(add: AddPiece, ground: SiteGround, _door: Vec2): void {
  const at = (x: number, z: number) => ground.at(x, z);
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 1 / 3 };
  const corps3 = { stage: 0 as Stage, row: 2 / 3 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : le signe de l'absence, la perche du signaleur et sa lanterne allumée dès la ruine (la seule), le pied de
  // roche au nord et à l'ouest de la tour, les blocs du muret qui n'ont jamais quitté le rang.
  add('ruine', 0, (b) => {
    pivotMark(b);
    b.box({ x: PERCH.x, y: PT - 0.3, z: PERCH.z }, [0.1, PERCH.h + 0.3, 0.1], C.newShade);
    const tip = { x: PERCH.x + PERCH.arm, y: PT + PERCH.h - 0.05, z: PERCH.z };
    b.beam({ x: PERCH.x, y: tip.y, z: PERCH.z }, tip, 0.08, C.newShade);
    lantern(b, { ...tip, y: tip.y - 0.04 }, true);
    b.prism({ x: -3.0, y: SINK, z: -5.4, yaw: 0.3 }, 2.4, 1.5, PT + 1.1 - SINK, 5, C.stoneShade, C.moss);
    b.prism({ x: -4.3, y: SINK, z: -3.3, yaw: 0.9 }, 1.2, 0.75, PT + 0.7 - SINK, 5, C.stone, C.moss);
    WALL_BLOCKS.forEach((w, i) => {
      if (!(WALL.fallen as readonly number[]).includes(i)) wallBlock(b, w);
    });
  });

  // ---- La ruine ----
  // Le corps 1 sur 3 la relève : la cour aux dalles fendues, quelques joints rompus, trois dalles soulevées d'un côté,
  // loin de la porte de la tour et du chemin (retouche 1 : la cour se lisait comme un aplat) ; le pied de la tour fendu,
  // sa porte usée sous un linteau nu.
  add(
    'ruine',
    0,
    (b) => {
      b.extrude({ x: 0, y: SINK, z: 0, pitch: -Math.PI / 2 }, COURT_OUTLINE, PT - 0.03 - SINK, C.stoneShade, C.slabWorn);
      courtStep(b, C.slabWorn);
      ruinJoints(b);
      for (const [x, z, yaw, pitch] of [
        [-7.2, 5.6, 0.2, 0.1],
        [-0.9, -7.0, -0.3, -0.12],
        [3.4, -7.2, 0.4, -0.1],
      ] as const)
        b.box({ x, y: PT - 0.12, z, yaw, pitch }, [1.3, 0.16, 1.0], C.stoneShade, C.slab);
      towerFoot(b, true);
      doorway(b, true);
      // Deux fentes sur la face sud, à gauche de la porte et sous le trou.
      onFace(b, Math.PI / 2, TOWER.r, -1.2, (l) =>
        crack(l, [
          [0.1, 0.3],
          [-0.15, 1.1],
          [0.08, 1.9],
          [-0.1, 2.75],
        ]),
      );
    },
    corps1,
  );
  // Le corps 2 sur 3 la relève : le fût fendu, cassé d'un côté en une marche basse (l'ouest à 4,7, l'est à 5,6), sans
  // dents ni pointe ; quatre gros blocs à facettes tombés au pied.
  add(
    'ruine',
    0,
    (b) => {
      b.prism({ x: TOWER.x, y: PT + TOWER.split, z: TOWER.z }, TOWER.rTop, TOWER.rTop, TOWER.broken - TOWER.split, 6, C.stoneShade, C.stone);
      const ri = inner(TOWER.rTop);
      const half = flatOutline([
        [0, -ri],
        [TOWER.rTop / 2, -ri],
        [TOWER.rTop, 0],
        [TOWER.rTop / 2, ri],
        [0, ri],
      ]);
      b.extrude({ x: TOWER.x, y: PT + TOWER.broken - 0.01, z: TOWER.z, pitch: -Math.PI / 2 }, half, TOWER.step - TOWER.broken + 0.01, C.stoneShade, C.stone);
      onFace(b, Math.PI / 6, TOWER.rTop, 0.3, (l) =>
        crack(l, [
          [0.2, 3.1],
          [-0.1, 3.8],
          [0.12, 4.6],
        ]),
      );
      for (const [x, z, r, h, yaw] of [
        [-3.9, 0.4, 0.6, 0.7, 0.4],
        [3.6, 0.9, 0.6, 0.65, 1.1],
        [-2.5, 1.9, 0.5, 0.55, 2.0],
        [0.6, -6.7, 0.6, 0.7, 0.7],
      ] as const)
        b.prism({ x, y: at(x, z) - 0.2, z, yaw }, r, r * 0.75, PT + h - at(x, z) + 0.2, 5, C.stoneShade, C.stone);
    },
    corps2,
  );
  // Le corps 3 sur 3 la relève : le toit à un pan de la cabine, tombé à plat sur la cour à l'est, et deux de ses planches
  // couchées à côté, parallèles.
  add(
    'ruine',
    0,
    (b) => {
      const S = CABIN.side + 2 * CABIN.eave;
      b.box({ x: 5.2, y: PT - 0.02, z: -4.6, yaw: 0.15 }, [S, CABIN.slab, S], C.wornShade, C.shingle);
      for (const z of [-0.95, -0.5]) b.box({ x: 6.2, y: PT - 0.02, z }, [2.2, 0.08, 0.26], C.wornShade, C.wornWood);
    },
    corps3,
  );
  // Le haut la relève : le mât en deux tronçons et les deux bras, couchés à plat le long du mur ouest, parallèles entre
  // eux, jamais croisés ; deux fanions délavés à plat sur les dalles ; la potence et sa lanterne éteinte.
  add(
    'ruine',
    0,
    (b) => {
      for (const [x, z, len] of [
        [-5.9, -4.6, 3.9],
        [-6.4, -4.2, 3.4],
      ] as const)
        b.drum({ x, y: PT + MAST.r, z, pitch: Math.PI / 2 }, MAST.r, len, 6, C.wornShade, C.wornWood);
      for (const [x, z, len] of [
        [-7.0, -4.9, ARMS.low.len],
        [-7.8, -4.3, ARMS.high.len],
      ] as const)
        b.box({ x, y: PT - 0.02, z: z + len / 2 }, [ARMS.width, ARMS.thick, len], C.wornShade, C.wornWood);
      for (const [x, z, yaw, color] of [
        [-4.9, 1.6, 0.4, C.fadedBlue],
        [-5.7, 1.1, 0.5, C.fadedBrick],
      ] as const)
        b.plate({ x, y: PT + 0.015, z, yaw, pitch: -Math.PI / 2 }, [[-0.3, 0.2], [0, -0.35], [0.3, 0.2]], color);
      gibbet(b, false);
    },
    haut,
  );
  // Les abords la relèvent : la corne renversée sur le flanc à côté de son tréteau couché ; les blocs sortis du rang,
  // couchés ; la lanterne éteinte couchée près d'un piquet penché.
  add(
    'ruine',
    0,
    (b) => {
      const tilt = Math.atan2(HORN.bell.r1 - HORN.tube.r0, HORN.tube.len + HORN.bell.len);
      drawPosed(b, { x: HORN.x + 0.1, y: PT + HORN.tube.r0 + 0.12, z: HORN.z + 0.5, yaw: -Math.PI / 2 - 0.15, pitch: -tilt }, (l) => hornLocal(l, true));
      drawPosed(b, { x: HORN.x - 1.2, y: PT + 0.4, z: HORN.z + 1.6, yaw: 0.1, pitch: Math.PI / 2 }, (l) => trestleLocal(l, HORN.trestle, true));
      WALL.fallen.forEach((i, k) => {
        // Sortis du rang vers le dehors de la cour (vers le large), couchés sur le plateau : la cour reste libre.
        const w = WALL_BLOCKS[i];
        const out = w.yaw > 1 ? { x: -1.3, z: 0 } : { x: 0, z: -1.3 };
        const x = w.x + out.x,
          z = w.z + out.z;
        b.box({ x, y: at(x, z) - 0.1, z, yaw: w.yaw + 0.35 * (k % 2 ? -1 : 1) }, [WALL.len, WALL.d - 0.15, WALL.h + 0.15], C.stoneShade, C.stone);
      });
      const L = PATH_LAMP;
      b.beam({ x: L.x, y: at(L.x, L.z) - 0.2, z: L.z }, { x: L.x + 0.35, y: PT + 0.9, z: L.z - 0.2 }, 0.1, C.wornShade);
      drawPosed(b, { x: L.x - 0.6, y: PT + 0.12, z: L.z - 0.4, yaw: 0.6, pitch: Math.PI / 2 }, (l) => lantern(l, { x: 0, y: 0.17, z: 0 }, false));
    },
    abords,
  );

  // ---- Le corps 1 sur 3 : la cour remise à plat, joints nets ; le pied de la tour jusqu'au linteau, la porte et son
  // linteau à la bande des racines.
  add(0, 0, (b) => {
    court(b);
    towerFoot(b, false);
    doorway(b, false);
  });
  // Le corps 2 sur 3 : le fût à six pans jusqu'à la corniche plate, sans créneaux.
  add(0, 1 / 3, (b) => {
    b.prism({ x: TOWER.x, y: PT + TOWER.split, z: TOWER.z }, TOWER.rTop, TOWER.rTop, TOWER.h - TOWER.split, 6, C.stone, C.stoneSun);
    b.drum({ x: TOWER.x, y: PT + TOWER.h, z: TOWER.z }, TOWER.corniceR, TOWER.cornice, 6, C.stoneShade, C.stoneSun);
  });
  // Le corps 3 sur 3 : la cabine de veille sur la corniche, son toit à un pan en bardeaux, son volet fermé ; pas de
  // garde-corps (il ferait la galerie d'un phare).
  add(0, 2 / 3, (b) => {
    const K = CABIN;
    const y0 = PT + CORNICE_TOP;
    b.box({ x: K.x, y: y0, z: K.z }, [K.side, K.low, K.side], C.newShade, C.newWood);
    // Le haut des murs, en biseau sous le toit (plus haut au nord).
    b.extrude(
      { x: K.x - K.side / 2, y: y0 + K.low, z: K.z, yaw: Math.PI / 2 },
      [
        [-K.side / 2, 0],
        [K.side / 2, 0],
        [K.side / 2, K.high - K.low],
      ],
      K.side,
      C.newWood,
      C.newShade,
    );
    // Le toit à un pan, débordant, en bardeaux bruns ; deux rangs de bardeaux en arêtes.
    const run = K.side / 2 + K.eave;
    const yS = y0 + K.low - K.eave * CABIN_SLOPE;
    const yN = y0 + K.high + K.eave * CABIN_SLOPE;
    b.extrude(
      { x: K.x - run, y: 0, z: K.z, yaw: Math.PI / 2 },
      [
        [-run, yS],
        [run, yN],
        [run, yN + K.slab],
        [-run, yS + K.slab],
      ],
      2 * run,
      C.shingle,
      C.newShade,
    );
    for (const z of [K.z + 0.6, K.z - 0.6]) {
      const y = PT + cabinRoofTop(z) + 0.012;
      b.quad([K.x - run, y, z + 0.03], [K.x + run, y, z + 0.03], [K.x + run, y, z - 0.03], [K.x - run, y, z - 0.03], C.shingleLine);
    }
    // Le volet de bois, fermé, sur la face sud.
    b.plate({ x: K.x + 0.3, y: y0 + 0.75, z: K.z + K.side / 2 + 0.012 }, [[-0.5, 0], [0.5, 0], [0.5, 0.85], [-0.5, 0.85]], C.door);
  });
  // Le haut : le mât et son chapeau carré, les deux bras et leurs contrepoids, les cordages le long du mât jusqu'au toit de
  // la cabine, la drisse et ses trois fanions ; la lanterne de la potence, allumée dès qu'elle est posée (jamais à une
  // réussite). Rien d'allumé au-dessus de la corniche.
  add(1, 0, (b) => {
    const y0 = PT + CORNICE_TOP - 0.1;
    b.prism({ x: MAST.x, y: y0, z: MAST.z }, MAST.r, MAST.r * 0.85, PT + MAST.top - y0, 8, C.newShade, C.newWood);
    block(b, { x: MAST.x, y: PT + MAST.top, z: MAST.z }, [MAST.cap, MAST.capH, MAST.cap], C.newShade, C.newWood);
    arm(b, ARMS.low);
    arm(b, ARMS.high);
    // Les cordages : de chaque charnière, le long du mât, jusqu'au bord ouest du toit de la cabine ; chacun à son z, ils
    // ne se croisent jamais, et aucun ne va vers le trou du pivot.
    const roofX = CABIN.x - CABIN.side / 2 - CABIN.eave + 0.1;
    for (const [a, dz] of [
      [ARMS.low, 0.13],
      [ARMS.high, -0.13],
    ] as const) {
      const z = MAST.z + dz;
      b.beam({ x: MAST.x + MAST.r + 0.04, y: PT + a.y - 0.2, z }, { x: roofX, y: PT + cabinRoofTop(z) + 0.02, z }, 0.045, C.rope);
    }
    b.beam(onHalyard(0), onHalyard(1), 0.04, C.rope);
    HALYARD.flags.forEach((t, i) => {
      const half = HALYARD.w / 2 / Math.hypot(HALYARD.to.x - HALYARD.from.x, HALYARD.to.z - HALYARD.from.z);
      const a = onHalyard(t - half);
      const c = onHalyard(t + half);
      drisseFlag(b, { ...a, y: a.y - 0.03 }, { ...c, y: c.y - 0.03 }, HALYARD.h, FLAGS[i].color, FLAGS[i].motif);
    });
    gibbet(b, true);
  });
  // Les abords : les blocs du muret remis en rang ; la corne sur son tréteau bas, tournée vers l'ouest ; la lanterne du
  // chemin sur son piquet, allumée dès qu'elle est posée.
  add(2, 0, (b) => {
    for (const i of WALL.fallen) wallBlock(b, WALL_BLOCKS[i]);
    drawPosed(b, { x: HORN.x, y: PT + HORN.axis, z: HORN.z, yaw: -Math.PI / 2 }, (l) => hornLocal(l, false));
    drawPosed(b, { x: HORN.x - 0.6, y: PT, z: HORN.z, yaw: 0 }, (l) => trestleLocal(l, HORN.trestle, false));
    const L = PATH_LAMP;
    b.box({ x: L.x, y: at(L.x, L.z) - 0.3, z: L.z }, [0.1, PT + L.h - at(L.x, L.z) + 0.3, 0.1], C.newShade);
    lantern(b, { x: L.x, y: PT + L.h + 0.02, z: L.z }, true);
  });
}

/** La potence de fer au mur sud-ouest, vers 3,5 de haut, et sa lanterne, allumée (le haut) ou éteinte (la ruine). */
function gibbet(b: FacetBuilder, lit: boolean): void {
  const d = inner(TOWER.rTop);
  const wall = { x: TOWER.x + SW_NORMAL.x * d, z: TOWER.z + SW_NORMAL.z * d };
  const end = { x: wall.x + SW_NORMAL.x * GIBBET.out, y: PT + GIBBET.y, z: wall.z + SW_NORMAL.z * GIBBET.out };
  b.beam({ x: wall.x, y: end.y, z: wall.z }, end, 0.07, C.iron);
  b.beam({ x: wall.x, y: end.y - 0.45, z: wall.z }, { x: end.x - SW_NORMAL.x * 0.15, y: end.y, z: end.z - SW_NORMAL.z * 0.15 }, 0.05, C.iron);
  lantern(b, { x: end.x, y: end.y - 0.05, z: end.z }, lit);
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

/** Le tonnelet cerclé de fer, bouché, debout contre le mur à gauche de la porte (Shopping) : de l'ordre de 1,2. */
const CASK = { x: -1.05, z: SOUTH_Z + 0.42, r: 0.36, h: 1.15 } as const;

function cask(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z, r, h } = CASK;
    l.prism({ x, y: PT, z }, r * 0.88, r, h / 2, 8, C.newShade, C.cask);
    l.prism({ x, y: PT + h / 2, z }, r, r * 0.88, h / 2, 8, C.newShade, C.cask);
    for (const y of [0.2, h - 0.28]) l.band({ x, y: PT + y, z }, r * 0.93 + 0.012, 0.08, 8, C.iron);
    // Le bouchon, sur le dessus.
    l.box({ x: x + 0.1, y: PT + h, z }, [0.1, 0.06, 0.1], C.newShade);
  });
}

/**
 * Le panier tressé, haut et évasé, à côté du tonnelet (Routine) ; dedans, trois fanions roulés en éventail (jamais droits
 * côte à côte : « III ») : des rouleaux gros et courts de toile crème, chacun une bande de sa couleur au bout (retouche
 * 1 : minces et longs, ils se lisaient comme des crayons). Leur section, leur longueur, la bande, leur pied dans le panier,
 * l'éventail.
 */
const BASKET = { x: -1.9, z: SOUTH_Z + 0.5, r0: 0.24, r1: 0.36, h: 0.75 } as const;
const ROLLS = { beam: 0.16, len: 0.5, band: 0.12, foot: 0.55, fan: 0.6 } as const;

function basket(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const B = BASKET;
    const R = ROLLS;
    l.prism({ x: B.x, y: PT, z: B.z }, B.r0, B.r1, B.h, 8, C.wicker, C.wickerShade);
    l.band({ x: B.x, y: PT + B.h - 0.12, z: B.z }, B.r1 - 0.04, 0.07, 8, C.wickerShade);
    for (const [lean, color] of [
      [-R.fan, C.flagBlue],
      [0, C.flagBrick],
      [R.fan, C.flagSage],
    ] as const) {
      const foot = { x: B.x + lean * 0.15, y: PT + R.foot, z: B.z };
      const at = (d: number) => ({ x: foot.x + Math.sin(lean) * d, y: foot.y + Math.cos(lean) * d, z: B.z + 0.05 * (d / R.len) });
      l.beam(foot, at(R.len - R.band), R.beam, C.cloth);
      l.beam(at(R.len - R.band), at(R.len), R.beam, color);
    }
  });
}

/** Le dévidoir : un tambour de bois et son cordage clair, sur deux montants parallèles, à gauche du tonnelet (Listening). */
const REEL = { x: -3.0, z: SOUTH_Z + 0.35, r: 0.3, w: 0.62, axis: 0.62 } as const;

function reel(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const R = REEL;
    // Le tambour, son axe est-ouest ; le cordage enroulé, un manchon plus clair au milieu.
    drawPosed(l, { x: R.x - R.w / 2, y: PT + R.axis, z: R.z, yaw: Math.PI / 2 }, (q) => {
      q.drum({ x: 0, y: 0, z: 0, pitch: Math.PI / 2 }, R.r, R.w, 8, C.newShade, C.newWood);
      q.band({ x: 0, y: 0, z: 0.12, pitch: Math.PI / 2 }, R.r * 0.82, R.w - 0.24, 8, C.rope);
    });
    for (const s of [-1, 1]) l.box({ x: R.x + s * (R.w / 2 + 0.06), y: PT, z: R.z }, [0.09, R.axis + 0.18, 0.14], C.newShade, C.newWood);
  });
}

/** Le banc bas de bois, long, une couverture pliée bleu-gris dessus, contre le pied sud-est de la tour (Notices). */
const SE_NORMAL = { x: Math.cos(Math.PI / 6), z: Math.sin(Math.PI / 6) } as const;
const BENCH = (() => {
  const d = inner(TOWER.r) + 0.45;
  return { x: TOWER.x + SE_NORMAL.x * d, z: TOWER.z + SE_NORMAL.z * d, len: 1.7, h: 0.45, yaw: Math.atan2(SE_NORMAL.x, SE_NORMAL.z) } as const;
})();

function bench(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) =>
    drawPosed(l, { x: BENCH.x, y: PT, z: BENCH.z, yaw: BENCH.yaw }, (q) => {
      q.box({ x: 0, y: BENCH.h - 0.08, z: 0 }, [BENCH.len, 0.08, 0.4], C.newShade, C.newWood);
      for (const s of [-1, 1]) q.box({ x: s * (BENCH.len / 2 - 0.2), y: 0, z: 0 }, [0.09, BENCH.h - 0.08, 0.34], C.newShade);
      q.box({ x: 0.3, y: BENCH.h, z: 0 }, [0.55, 0.1, 0.36], C.blanketShade, C.blanket);
    }),
  );
}

/**
 * Le râtelier de bois sur deux montants droits à encoche (retouche 1 : les fourches en V faisaient un X de biais) : chacun
 * une planche debout, ses deux joues au-dessus, entre lesquelles reposent les perches ; trois longues perches côte à côte
 * sur un seul étage, en profondeur (vues du sud, elles fuient vers le nord : jamais trois étages, « ≡ »), chacune avec un
 * bout de toile arrondi (The UK). La largeur d'un montant, son épaisseur, ses joues.
 */
const RACK = { x: 4.9, z: 2.6, len: 2.8, top: 0.75, gap: 0.24, post: 0.74, thick: 0.1, cheek: { w: 0.08, h: 0.13 } } as const;

function rack(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const R = RACK;
    for (const dz of [-R.len / 2 + 0.4, R.len / 2 - 0.4]) {
      l.box({ x: R.x, y: PT, z: R.z + dz }, [R.post, R.top - 0.035, R.thick], C.newShade, C.newWood);
      for (const s of [-1, 1]) l.box({ x: R.x + s * (R.post - R.cheek.w) / 2, y: PT + R.top - 0.035, z: R.z + dz }, [R.cheek.w, R.cheek.h, R.thick], C.newShade, C.newWood);
    }
    for (const k of [-1, 0, 1]) {
      const x = R.x + k * R.gap;
      drawPosed(l, { x, y: PT + R.top, z: R.z - R.len / 2, yaw: 0 }, (q) => rodLocal(q, R.len, 0.07, C.newWood));
      // Le bout de toile arrondi, au bout nord, à plat sur la perche (un demi-disque), des deux côtés.
      const cloth = disc(0.17, 6);
      l.plate({ x, y: PT + R.top + 0.045, z: R.z - R.len / 2 + 0.2, pitch: -Math.PI / 2 }, cloth, C.cloth);
      l.plate({ x, y: PT + R.top + 0.035, z: R.z - R.len / 2 + 0.2, pitch: Math.PI / 2 }, cloth, C.cloth);
    }
  });
}

/**
 * Les cinq traces, une par mission, chacune avec sa partie (le corps en trois rangées, puis le haut, puis les abords),
 * dans l'ordre de l'île.
 */
const TRACES = {
  shopping: { at: { x: CASK.x, z: CASK.z }, lift: 1, stage: 0, row: 0, draw: cask },
  routine: { at: { x: BASKET.x, z: BASKET.z }, lift: 1, stage: 0, row: 1 / 3, draw: basket },
  listening: { at: { x: REEL.x, z: REEL.z }, lift: 1, stage: 0, row: 2 / 3, draw: reel },
  notices: { at: { x: BENCH.x, z: BENCH.z }, lift: 1, stage: 1, row: 0, draw: bench },
  'united-kingdom': { at: { x: RACK.x, z: RACK.z }, lift: 1, stage: 2, row: 0, draw: rack },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

/**
 * Le cap de la caméra à l'arrivée d'un « Y aller » : un peu à gauche du nord (0,25, environ 14°, vers l'ouest et le
 * large ; retouche 1, directeur artistique). Le mât, à 5 à l'ouest de la porte, revient vers le milieu de l'image : au
 * téléphone (390 × 844), au cap nord, le bout des bras sortait du cadre à gauche ; ainsi la tour entière, le chapeau
 * du mât et le bout des deux bras sont dans l'image aux trois tailles (un test le vérifie).
 */
const DOOR_VIEW = 0.25;

/**
 * Le regard d'arrivée à la porte (`PlaceArt.arrivalView`, celui du Donjon, rattrapage du lot 13a) : le haut que le regard
 * levé cadre est au-dessus du mât (son chapeau, le plus haut du lieu restauré), la caméra ne recule pas (`back` 1 : la
 * caméra qui suit, à 9,7 de Kéo, garde déjà la tour entière ; seul le regard se lève). Dans la ruine, basse, le haut bâti
 * est déjà dans le cadre : rien ne bouge.
 */
const ARRIVAL_VIEW = { look: { x: MAST.x, z: MAST.z }, back: 1 } as const;

/** Le point du nom sur la Carte, depuis le centre du lieu : sur l'axe de la tour, 1,5 au-dessus de sa corniche. */
const MAP_POINT: Vec3 = { x: TOWER.x, y: PT + CORNICE_TOP + 1.5, z: TOWER.z };

// ---------- La scénette ----------

/** Le milieu de la scène, depuis le centre du lieu : sur la cour, la façade sud et sa porte derrière, la corne à gauche. */
const SCENE_SPOT = {
  dx: 0.6,
  dz: 3.6,
  half: [3.4, 1.1] as [number, number],
} as const;

/** La hauteur du sol de la scène au-dessus de son point : le dessus des dalles de la cour, son plancher. */
const SCENE_RISE = (() => {
  const [hx, hz] = SCENE_SPOT.half;
  const nx = Math.ceil(hx),
    nz = Math.ceil(hz);
  let top = localGround(SCENE_SPOT.dx, SCENE_SPOT.dz);
  for (let i = -nx; i <= nx; i++) for (let k = -nz; k <= nz; k++) top = Math.max(top, localGround(SCENE_SPOT.dx + (i / nx) * hx, SCENE_SPOT.dz + (k / nz) * hz));
  return PT - top;
})();

/** Le signaleur en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, pantalon, veste orange, casquette. */
function signaller(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.1, y: at.y + 0.16, z: at.z }, 0.11, 0.12, 0.4, 6, C.trousers);
  b.prism({ x: at.x, y: at.y + 0.54, z: at.z }, 0.27, 0.24, 0.44, 8, C.jacket);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  b.prism({ x: at.x, y: at.y + 1.22, z: at.z }, 0.2, 0.12, 0.12, 8, C.cap);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.29, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.35, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.jacket);
}

/** La planche à encoches sur tréteaux des réponses : la hauteur de ses tréteaux ; un fanion choisi se soulève d'un cran. */
const BOARD = { height: 0.55, lift: 0.2 } as const;

/**
 * Les formes des fanions des réponses, unis, d'une seule teinte : la forme seule les distingue (DP-08), jamais la couleur
 * ni une marque. Chacune en aplats convexes, dans le plan (x vers le large du fanion, y vers le haut), attachée au piquet
 * en x = 0, dans l'ordre des réponses : un triangle, une queue d'aronde (son encoche de `notch` × la largeur), une flamme
 * longue, un trapèze coupé de biais. Aucun rectangle (il se lisait « drapeau » : directeur du contenu pédagogique,
 * retouche 1) ; aucune ne fait une lettre ni un drapeau connu. Plus grands à la retouche 1 (`w`, `h`), le piquet
 * décalé d'une demi-largeur : le fanion est centré sur sa place.
 */
const ANSWER_FLAG = { w: 0.6, h: 0.45, pole: 0.72, notch: 0.35, flame: 1.4 } as const;
const ANSWER_SHAPES: readonly (readonly (readonly [number, number])[])[][] = (() => {
  const { w, h, notch, flame } = ANSWER_FLAG;
  const y0 = -h / 2,
    y1 = h / 2;
  return [
    [
      [
        [0, y0],
        [w, 0],
        [0, y1],
      ],
    ],
    [
      [
        [0, y0],
        [w, y0],
        [w * (1 - notch), 0],
        [0, 0],
      ],
      [
        [0, 0],
        [w * (1 - notch), 0],
        [w, y1],
        [0, y1],
      ],
    ],
    [
      [
        [0, y0 * 0.7],
        [w * flame, -0.03],
        [w * flame, 0.03],
        [0, y1 * 0.7],
      ],
    ],
    [
      [
        [0, y0],
        [w * 0.85, y0],
        [w * 0.5, y1],
        [0, y1],
      ],
    ],
  ];
})();

/** Un fanion de réponse : son piquet planté dans la planche, son aplat épaissi en haut, la forme `k`. */
function answerFlag(b: FacetBuilder, at: Vec3, s: number, k: number): void {
  const pole = ANSWER_FLAG.pole * s;
  const left = at.x - (ANSWER_FLAG.w / 2) * s;
  b.box({ x: left - 0.03 * s, y: at.y - 0.04 * s, z: at.z }, [0.06 * s, pole + 0.04 * s, 0.06 * s], C.newShade, C.newWood);
  for (const part of ANSWER_SHAPES[k % ANSWER_SHAPES.length])
    b.extrude(
      { x: left, y: at.y + pole - (ANSWER_FLAG.h / 2 + 0.03) * s, z: at.z - 0.02 * s },
      part.map(([x, y]) => [x * s, y * s] as const),
      0.04 * s,
      C.answerFlag,
      C.answerFlag,
    );
}

export const SEMAPHORE: PlaceArt = {
  role: 'Le signaleur',
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
  // Le décor de près : le plancher est la cour du lieu, la façade sud, sa porte, son linteau et le trou derrière ; le
  // muret et le large à gauche ; la roche qui cadre est aux abords (./semaphoreSurroundings.ts). Il reste le signaleur en
  // pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) signaller(b, at, sphere);
  },
  answer: {
    size: { height: BOARD.height + BOARD.lift + ANSWER_FLAG.pole + 0.1, half: 0.34 },
    // Une longue planche à encoches sur deux tréteaux, sous la rangée des fanions.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BOARD.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.4 * s], C.newShade, C.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.12, top - 0.08 * s - foot, 0.4 * s], C.newShade);
      }
    },
    // Un fanion sur son piquet ; choisi, il se soulève d'un cran (sa place le dit, jamais sa couleur). Le cran est une
    // place, pas un mouvement : la rangée est redessinée d'un coup au choix (scene.ts), rien ne glisse, avec ou sans
    // « Réduire les animations ».
    object(b, at, s, i, _count, picked) {
      answerFlag(b, { x: at.x, y: at.y + (BOARD.height + (picked ? BOARD.lift : 0)) * s, z: at.z }, s, i);
    },
  },
  // Les cinq missions en R : la cour seule, rien de l'item ; les fanions portent les réponses.
  rest() {},
  traces: TRACES,
  // Kéo au retour : sur la chaussée, à l'est de la porte, face à la tour.
  exit: { x: 3.4, z: 8.4 },
  // « Y aller » arrive un peu à gauche du nord, vers le large ; à la porte, le regard se lève pour cadrer le mât et ses
  // bras (un test le vérifie).
  doorView: DOOR_VIEW,
  arrivalView: ARRIVAL_VIEW,
  // Sur la Carte, son nom au même point en ruine et restauré : 1,5 au-dessus de la corniche, sur l'axe de la tour.
  mapPoint: MAP_POINT,
};

/** Le plan du Sémaphore, pour les tests : la cour, la tour, la cabine, le mât, les bras, la drisse, la corne, les lanternes. */
export const SEMAPHORE_LAYOUT = {
  court: COURT,
  step: STEP,
  courtTop: PT,
  tower: TOWER,
  corniceTop: CORNICE_TOP,
  southZ: SOUTH_Z,
  door: DOOR,
  pivotMark: PIVOT_MARK,
  cabin: CABIN,
  cabinRoofTop,
  mast: MAST,
  arms: ARMS,
  armTips: { low: armTip(ARMS.low), high: armTip(ARMS.high) },
  halyard: HALYARD,
  onHalyard,
  horn: HORN,
  perch: PERCH,
  pathLamp: PATH_LAMP,
  wallBlocks: WALL_BLOCKS,
  answerShapes: ANSWER_SHAPES,
  doorNode: DOOR_AT,
  aig3: AIG3,
  scene: SCENE_SPOT,
  heightAtCenter: H0,
  mapPoint: MAP_POINT,
  doorView: DOOR_VIEW,
  arrivalView: ARRIVAL_VIEW,
} as const;
