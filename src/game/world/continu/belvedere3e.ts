// Le Belvédère (le Versant du 3e, GD-25, lot 2 ; proposition du consultant d'Archipéo, § 3, relecture des lieux du
// directeur artistique, et planche `selection-versant-v1`, vues de près et de loin, graine 2026) : « d'ici, on mesurait la
// montagne sans la gravir : l'ombre du gnomon sur le dallage, la visée vers le Fanal ». Le grand lieu du 3e. Sur le
// gabarit des lieux du 4e (./herbier4e.ts), avec le kit du 3e (./place3eKit.ts). Une terrasse ronde de granit au bout de
// son avancée, bordée de son muret plein à chaperon d'ardoise, ouvert seulement vers la porte, au sud-est ; un dallage à
// joints droits et parallèles, sans chiffre ; au milieu, le gnomon, une haute pierre effilée sur son socle carré, et son
// ombre sur le dallage, vers le nord-ouest (le soleil du matin est au sud-est) ; l'équerre de pierre, un grand L debout ;
// la boule, le cône et le cylindre sur leurs socles bas, chacun à côté de sa coupe, la face coupée plus claire ; le cercle
// de visée sur son pied, tourné vers le Fanal, en fer bruni à ferrures de bronze (correction 7) ; les flèches de fer bruni,
// toutes pareilles, dans le même sens ; le petit abri de bois et d'ardoise de la topographe.
//
// La ruine, d'après le texte et jamais d'après l'image (Z-Image ne sait pas dessiner une ruine) : rien n'a été pris au
// 3e, le temps et le froid ont éteint le lieu. La terrasse entière, deux dalles soulevées de biais ; le muret entier côté
// nuages, une brèche côté montagne ; le gnomon couché le long du muret en deux tronçons ; la boule roulée contre le muret,
// le cône couché, le cylindre debout, leurs coupes à plat dans l'herbe ; le cercle grippé, penché sur son pied ; les
// flèches dispersées, à demi dans l'herbe ; l'équerre tombée à plat. Une seule lumière, la lanterne de la topographe, sur
// le poteau de son abri. Cinq parties (3 + 1 + 1) : le dallage et la brèche refermée ; le gnomon debout et son ombre ;
// l'équerre et les solides sur leurs socles ; le haut (le cercle remis, tourné vers le Fanal, l'abri et sa lanterne) ;
// les abords (les flèches posées, le banc, la lanterne du chemin). Une trace par mission, avec sa partie. Rien à lire,
// rien en croix, aucune figure. Code pur (placeArt.ts).
import type { Stage } from './construction';
import type { FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C3E, SINK_3E, armLantern3e, habitant3e, lantern3e, onCircle, pathLantern3e, scene3e, site3e, wallSpan3e } from './place3eKit';
import { capOf, groundPlane4e, inWorld, once } from './place4eKit';
import { PLACES_3E } from './plan3e';

/**
 * Les couleurs propres au Belvédère, en plus des matières des Passeurs (`C3E`) : l'ombre du gnomon sur la pierre claire,
 * un gris bleuté (les ombres du 3e sont bleues, jamais noires) ; la face coupée des solides, plus claire que le granit ;
 * le creux des dalles soulevées ; la terre sous les coupes tombées ; l'herbe sèche ; les deux tons des jalons ; la veste
 * de la topographe (un vert-gris, jamais vif).
 */
const C = {
  shadow: 0xa4acb8,
  cut: 0xc9ccd2,
  hollow: 0x8f8a80,
  dry: 0x9a9468,
  pale: 0xe2ddd0,
  coat: 0x6f7c6a,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site3e('belvedere');

/** Le plan du sol sous la terrasse et ses abords : le replat est plat ici (à 0,1 près). */
const planeY = groundPlane4e(SITE.ground, [-9, 9], [-9, 9]);

/**
 * La terrasse ronde : son rayon, ses pans, le dessus de son dallage au-dessus du plan du sol ; le muret plein (sa hauteur
 * au-dessus du dallage, à la taille de Kéo, et son épaisseur : assez bas pour que la porte voie la terrasse ; les nuages
 * sont à trente unités) ; les deux pans ouverts vers la porte et le chemin (`gate`, du sud-est au sud : la caméra de la
 * scénette vient de là et ne regarde jamais par-dessus le muret) et celui de la brèche de la ruine (`breach`, au
 * nord-ouest, côté montagne : le muret à l'est, au sud-ouest et à l'ouest reste entier). Les pans sont comptés depuis le
 * nord, dans le sens des aiguilles d'une montre, de 30° chacun.
 */
const T = { r: 6.6, sides: 12, top: 0.22, wall: 0.85, thick: 0.45, gate: [4, 5] as readonly number[], breach: 10 } as const;

/** Le dessus du dallage, au plus haut du plan du sol sous la terrasse. */
const deck = once(() => Math.max(...[0, 90, 180, 270].map((deg) => onCircle(T.r, deg)).map((p) => planeY(p.x, p.z))) + T.top);

/** Un coin de la terrasse (le coin `k` du pan `k`), à `r` du milieu. */
const corner = (k: number, r: number = T.r): Vec2 => onCircle(r, k * (360 / T.sides));

/** Le gnomon : son socle carré, sa pierre effilée (le haut et le bas de sa section), sa hauteur ; l'ombre au nord-ouest. */
const GNOMON = { at: { x: -1.9, z: 0.5 }, socle: 1.4, socleH: 0.5, foot: 0.5, tip: 0.12, h: 4.4, shadow: { cap: 315, len: 4.0 } } as const;

/** L'équerre de pierre, un grand L debout, sa face au sud : son pied, sa hauteur, sa branche. */
const EQUERRE = { at: { x: -0.2, z: -4.7 }, h: 2.4, arm: 1.8, t: 0.38 } as const;

/** Les trois solides sur leurs socles bas, et leurs coupes à côté : la boule, le cône, le cylindre. */
const SOLIDS = {
  ball: { at: { x: -4.0, z: 2.0 }, r: 0.62 },
  cone: { at: { x: -1.6, z: 4.0 }, r: 0.6, h: 1.4 },
  cylinder: { at: { x: -5.2, z: -0.6 }, r: 0.5, h: 1.3 },
  socle: { w: 1.25, h: 0.32 },
  /** La coupe, posée à côté de son solide, vers le sud-est (vue de la porte). */
  cut: { dx: 0.95, dz: 0.55 },
} as const;

/** Le cercle de visée sur son pied, au nord-ouest de la terrasse, tourné vers le Fanal (au cap 332°, mesuré sur le plan). */
const SIGHT = { at: { x: -3.5, z: -3.6 }, pole: 1.15, r: 0.62, ring: 0.1, fanal: 332 } as const;

/** Le petit abri de la topographe, au nord-est : son milieu, sa largeur (x), sa profondeur (z), la hauteur de ses poteaux. */
const SHELTER = { at: { x: 3.2, z: -4.0 }, w: 2.0, d: 1.4, h: 1.9 } as const;

/** Les flèches de fer bruni, toutes pareilles : posées en rang au sud du dallage, toutes vers le nord-ouest. */
const ARROWS = { row: [0.8, 1.25, 1.7, 2.15, 2.6] as const, z: 4.5, len: 1.1, cap: 332 } as const;

/** Le banc de pierre, contre le muret au sud-ouest, tangent à lui. */
const BENCH = { at: onCircle(T.r - 1.0, 222), len: 1.8, w: 0.5, h: 0.45 } as const;

/** La lanterne du chemin (les abords), dehors, à côté de l'entrée, hors du chemin. */
const PATH_LANTERN = { x: 3.4, z: 7.9, h: 1.4 } as const;

// ---------- La vue ----------

/** Le cap d'arrivée (proposition, § 3) : 323°, de la porte au sud-est ; le gnomon au milieu, le pic et le Fanal au-delà. */
const DOOR_VIEW = capOf(323);

/** La vue d'arrivée basse, à hauteur de Kéo (comme aux lieux du 4e). */
const DOOR_FRAME = { height: -2.5, back: 1.3 } as const;

/** Le point du nom sur la Carte, au-dessus du gnomon, le même en ruine et restauré. */
const MAP_POINT: Vec3 = {
  x: 0,
  get y() {
    return deck() + GNOMON.socleH + GNOMON.h + 1;
  },
  z: 0,
};

// ---------- Les volumes ----------

/** Un pan du muret, du coin `k` au coin `k + 1`, entier ou cassé bas (la brèche). */
function wallPan(b: FacetBuilder, k: number, h: number = T.wall): void {
  wallSpan3e(b, corner(k, T.r - 0.22), corner(k + 1, T.r - 0.22), deck() - 0.05, h, T.thick);
}

/** La terrasse : sa pierre en éventail et ses flancs de granit, sa bordure d'ardoise basse. */
function terrace(b: FacetBuilder): void {
  b.prism({ x: 0, y: SINK_3E, z: 0 }, T.r, T.r, deck() - SINK_3E, T.sides, C3E.graniteShade, C3E.stone);
}

/** Les joints du dallage, droits et parallèles (d'est en ouest), sans chiffre ni graduation : les traits nets du corps 1. */
function joints(b: FacetBuilder): void {
  const y = deck() + 0.012;
  for (const z of [-4.4, -2.2, 0, 2.2, 4.4]) {
    const half = Math.sqrt(T.r * T.r * 0.93 - z * z) - 0.5;
    b.quad([-half, y, z + 0.05], [half, y, z + 0.05], [half, y, z - 0.05], [-half, y, z - 0.05], C3E.joint);
  }
}

/** Une boule de granit en facettes (trois anneaux de huit pans), posée à `y`. */
function ball(b: FacetBuilder, x: number, y: number, z: number, r: number, yaw = 0): void {
  b.prism({ x, y, z, yaw }, 0.55 * r, r, 0.5 * r, 8, C3E.graniteShade);
  b.prism({ x, y: y + 0.5 * r, z, yaw }, r, 0.6 * r, 0.75 * r, 8, C3E.granite, C3E.graniteSun);
  b.prism({ x, y: y + 1.25 * r, z, yaw }, 0.6 * r, 0, 0.3 * r, 8, C3E.graniteSun);
}

/** Un socle bas de granit, sous un solide. */
function socle(b: FacetBuilder, at: Vec2): void {
  b.box({ x: at.x, y: deck() - 0.1, z: at.z, yaw: 0.2 }, [SOLIDS.socle.w, SOLIDS.socle.h + 0.1, SOLIDS.socle.w], C3E.graniteShade, C3E.graniteSun);
}

/**
 * Les coupes, posées à côté de leur solide (`y`, leur sol) : la demi-boule (un disque, sa face coupée claire), la tranche
 * du cône (un triangle épais), la tranche du cylindre (un pavé) ; toutes leur face coupée en haut, plus claire.
 */
function cuts(b: FacetBuilder, place: (at: Vec2) => { at: Vec2; y: number; yaw: number }): void {
  const S = SOLIDS;
  const ballCut = place(S.ball.at);
  b.prism({ x: ballCut.at.x, y: ballCut.y, z: ballCut.at.z, yaw: ballCut.yaw }, 0.5, 0.55, 0.22, 8, C3E.granite, C.cut);
  const coneCut = place(S.cone.at);
  b.extrude({ x: coneCut.at.x, y: coneCut.y + 0.2, z: coneCut.at.z, yaw: coneCut.yaw, pitch: -Math.PI / 2 }, [[-0.5, -0.45], [0.5, -0.45], [0, 0.6]], 0.2, C3E.granite, C.cut);
  const cylCut = place(S.cylinder.at);
  b.box({ x: cylCut.at.x, y: cylCut.y, z: cylCut.at.z, yaw: cylCut.yaw }, [0.9, 0.2, 0.9], C3E.granite, C.cut);
}

/** Les trois solides debout sur leurs socles, chacun à côté de sa coupe (le corps 3). */
function solidsUp(b: FacetBuilder): void {
  const S = SOLIDS;
  const top = deck() + S.socle.h;
  for (const s of [S.ball.at, S.cone.at, S.cylinder.at]) socle(b, s);
  ball(b, S.ball.at.x, top, S.ball.at.z, S.ball.r);
  b.prism({ x: S.cone.at.x, y: top, z: S.cone.at.z, yaw: 0.3 }, S.cone.r, 0, S.cone.h, 8, C3E.granite);
  b.prism({ x: S.cylinder.at.x, y: top, z: S.cylinder.at.z }, S.cylinder.r, S.cylinder.r, S.cylinder.h, 8, C3E.graniteShade, C3E.graniteSun);
  cuts(b, (at) => ({ at: { x: at.x + S.cut.dx, z: at.z + S.cut.dz }, y: deck(), yaw: 0.4 }));
}

/** L'équerre de pierre debout, un grand L, sa face au sud (le corps 3), ou tombée à plat (la ruine). */
function equerre(b: FacetBuilder, standing: boolean): void {
  const E = EQUERRE;
  const y = deck();
  if (standing) {
    b.box({ x: E.at.x, y, z: E.at.z }, [E.t, E.h, E.t * 1.2], C3E.graniteShade, C3E.graniteSun);
    b.box({ x: E.at.x + E.arm / 2 - E.t / 2, y, z: E.at.z }, [E.arm, E.t, E.t * 1.2], C3E.graniteShade, C3E.graniteSun);
    return;
  }
  b.box({ x: E.at.x + 0.5, y, z: E.at.z + 0.6, yaw: 0.35 }, [E.t * 1.2, E.t, E.h], C3E.graniteShade, C3E.graniteSun);
  b.box({ x: E.at.x + 0.5 + E.arm / 2, y, z: E.at.z + 0.6 + E.h / 2 - 0.2, yaw: 0.35 }, [E.arm, E.t, E.t * 1.2], C3E.graniteShade, C3E.graniteSun);
}

/** Le socle carré du gnomon, toujours là. */
function gnomonSocle(b: FacetBuilder): void {
  const G = GNOMON;
  b.box({ x: G.at.x, y: deck() - 0.1, z: G.at.z }, [G.socle, G.socleH + 0.1, G.socle], C3E.graniteShade, C3E.graniteSun);
}

/** Le gnomon debout et son ombre sur le dallage, vers le nord-ouest (le corps 2). */
function gnomonUp(b: FacetBuilder): void {
  const G = GNOMON;
  const y = deck() + G.socleH;
  b.prism({ x: G.at.x, y, z: G.at.z, yaw: Math.PI / 4 }, G.foot, G.tip, G.h, 4, C3E.granite, C3E.graniteSun);
  b.prism({ x: G.at.x, y: y + G.h, z: G.at.z, yaw: Math.PI / 4 }, G.tip, 0, 0.3, 4, C3E.graniteSun);
  // L'ombre : un long triangle effilé posé sur la pierre, du pied du socle vers le nord-ouest.
  const a = (G.shadow.cap * Math.PI) / 180;
  const dir = { x: Math.sin(a), z: -Math.cos(a) };
  const side = { x: -dir.z, z: dir.x };
  const s0 = { x: G.at.x + dir.x * (G.socle / 2 + 0.05), z: G.at.z + dir.z * (G.socle / 2 + 0.05) };
  const tip = { x: s0.x + dir.x * G.shadow.len, z: s0.z + dir.z * G.shadow.len };
  const yy = deck() + 0.02;
  b.triangle([s0.x - side.x * 0.45, yy, s0.z - side.z * 0.45], [tip.x, yy, tip.z], [s0.x + side.x * 0.45, yy, s0.z + side.z * 0.45], C.shadow);
  b.triangle([s0.x + side.x * 0.45, yy, s0.z + side.z * 0.45], [tip.x, yy, tip.z], [s0.x - side.x * 0.45, yy, s0.z - side.z * 0.45], C.shadow);
}

/**
 * Le gnomon couché le long du muret, à l'est, en deux tronçons (la ruine) : couchés du nord au sud, en dedans du muret,
 * sans le traverser (relecture du Versant par le directeur artistique, (a) 6).
 */
export const GNOMON_FALLEN = [
  { x: 4.9, z: -3.0, len: 2.6, r0: 0.5, r1: 0.36, lift: 0.42, yaw: 0.06 },
  { x: 4.8, z: 0.4, len: 1.9, r0: 0.33, r1: 0.12, lift: 0.3, yaw: -0.08 },
] as const;

function gnomonFallen(b: FacetBuilder): void {
  for (const g of GNOMON_FALLEN) b.prism({ x: g.x, y: planeY(g.x, g.z) + g.lift, z: g.z, yaw: g.yaw, pitch: Math.PI / 2 }, g.r0, g.r1, g.len, 4, C3E.granite, C3E.graniteSun);
}

/**
 * Le cercle de visée sur son pied : un anneau uni de fer bruni, sans réticule (rien en croix), deux ferrures de bronze où
 * il tient sur sa fourche ; tourné vers le Fanal (`facing`, en degrés), ou de travers et penché (la ruine, grippé).
 */
function sight(b: FacetBuilder, facing: number, lean: number): void {
  const S = SIGHT;
  const y = deck();
  b.box({ x: S.at.x, y: y - 0.1, z: S.at.z }, [0.5, 0.2, 0.5], C3E.graniteShade, C3E.granite);
  const top = { x: S.at.x + Math.sin(lean) * S.pole * 0.6, y: y + 0.1 + S.pole * Math.cos(lean), z: S.at.z };
  b.beam({ x: S.at.x, y: y + 0.1, z: S.at.z }, top, 0.12, C3E.iron);
  const yaw = (-facing * Math.PI) / 180;
  const across = { x: Math.cos(yaw), z: -Math.sin(yaw) };
  const cy = top.y + S.r;
  b.annulus({ x: top.x, y: cy, z: top.z, yaw, pitch: Math.PI / 2 + lean }, S.r - S.ring, S.r, 0.08, 10, C3E.iron, C3E.ironTop);
  for (const s of [-1, 1]) b.box({ x: top.x + across.x * s * S.r, y: cy - 0.08, z: top.z + across.z * s * S.r }, [0.12, 0.16, 0.12], C3E.bronze);
}

/** Une flèche de fer bruni posée à plat : sa hampe, sa pointe ; au cap `cap` (degrés), en (`x`, `z`), sa hauteur `y`. */
function arrow(b: FacetBuilder, x: number, y: number, z: number, cap: number, pitch = 0): void {
  const yaw = (-cap * Math.PI) / 180;
  const d = { x: Math.sin((cap * Math.PI) / 180), z: -Math.cos((cap * Math.PI) / 180) };
  b.box({ x, y, z, yaw, pitch }, [0.07, 0.05, ARROWS.len], C3E.iron, C3E.ironTop);
  // La pointe : un triangle plat, plus large que la hampe, qui dit le sens d'un coup d'œil.
  const tip = { x: x + d.x * (ARROWS.len / 2 - 0.02), z: z + d.z * (ARROWS.len / 2 - 0.02) };
  b.extrude({ x: tip.x, y, z: tip.z, yaw, pitch: -Math.PI / 2 + pitch }, [[-0.17, 0], [0.17, 0], [0, 0.32]], 0.05, C3E.iron, C3E.ironTop);
}

/** Les cinq flèches posées en rang sur le dallage, toutes dans le même sens (les abords). */
function arrowsLaid(b: FacetBuilder): void {
  for (const x of ARROWS.row) arrow(b, x, deck() + 0.01, ARROWS.z, ARROWS.cap);
}

/** Les flèches dispersées, à demi dans l'herbe, au sud, hors du chemin (la ruine). */
function arrowsScattered(b: FacetBuilder): void {
  for (const [x, z, cap, pitch] of [
    [-1.6, 7.6, 40, 0.12],
    [-0.4, 8.4, 200, -0.1],
    [-2.8, 8.8, 300, 0.15],
    [-3.6, 7.6, 120, 0.1],
    [0.6, 7.3, 260, -0.12],
  ] as const)
    arrow(b, x, planeY(x, z) - 0.03, z, cap, pitch);
}

/** Les poteaux de l'abri de la topographe ; `all` : les quatre (le haut), sinon celui de sa lanterne seul (la ruine). */
function shelterPosts(b: FacetBuilder, all: boolean): void {
  const S = SHELTER;
  const posts: Vec2[] = [
    { x: S.at.x + S.w / 2, z: S.at.z + S.d / 2 },
    { x: S.at.x - S.w / 2, z: S.at.z + S.d / 2 },
    { x: S.at.x + S.w / 2, z: S.at.z - S.d / 2 },
    { x: S.at.x - S.w / 2, z: S.at.z - S.d / 2 },
  ];
  for (const p of all ? posts : posts.slice(0, 1)) b.box({ x: p.x, y: deck() - 0.1, z: p.z }, [0.18, S.h + 0.1, 0.18], C3E.woodShade, C3E.wood);
}

/** La lanterne de la topographe, au poteau sud-est de son abri : la seule allumée de la ruine. */
function topographerLantern(b: FacetBuilder): void {
  const S = SHELTER;
  armLantern3e(b, S.at.x + S.w / 2, deck() + S.h - 0.25, S.at.z + S.d / 2, 0.6, 0.8, true);
}

/** L'abri remis : ses quatre poteaux, sa table, son toit d'ardoise sous un peu de neige, sa lanterne pendue au faîte (le haut). */
function shelter(b: FacetBuilder): void {
  const S = SHELTER;
  shelterPosts(b, true);
  const y = deck() + S.h;
  b.box({ x: S.at.x, y: y - 0.12, z: S.at.z }, [S.w + 0.25, 0.12, S.d + 0.25], C3E.woodShade, C3E.wood);
  b.gableRoof({ x: S.at.x, y, z: S.at.z }, S.w + 0.6, S.d + 0.7, 0.75, C3E.slate, C3E.woodShade);
  // Un peu de neige au faîte (le ton des nuages, jamais plus blanc).
  b.gableRoof({ x: S.at.x, y: y + 0.48, z: S.at.z }, S.w + 0.62, (S.d + 0.7) * 0.36, 0.28, C3E.snow, C3E.slateTop);
  b.box({ x: S.at.x, y: deck() + 0.75, z: S.at.z }, [S.w - 0.3, 0.08, S.d - 0.4], C3E.woodShade, C3E.newWood);
  b.box({ x: S.at.x, y: deck(), z: S.at.z }, [0.16, 0.75, 0.16], C3E.woodShade);
  lantern3e(b, { x: S.at.x - 0.5, y: y - 0.12, z: S.at.z + S.d / 2 - 0.05 }, true);
}

/** Le banc de pierre contre le muret, au sud-ouest (les abords). */
function bench(b: FacetBuilder): void {
  const B = BENCH;
  const yaw = Math.atan2(B.at.z, -B.at.x) + Math.PI / 2;
  const along = { x: Math.cos(yaw), z: -Math.sin(yaw) };
  for (const s of [-1, 1]) b.box({ x: B.at.x + along.x * s * (B.len / 2 - 0.2), y: deck() - 0.05, z: B.at.z + along.z * s * (B.len / 2 - 0.2), yaw }, [0.25, B.h, B.w - 0.1], C3E.graniteShade, C3E.granite);
  b.box({ x: B.at.x, y: deck() + B.h - 0.05, z: B.at.z, yaw }, [B.len, 0.12, B.w], C3E.graniteShade, C3E.graniteSun);
}

function model(add: AddPiece): void {
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 1 / 3 };
  const corps3 = { stage: 0 as Stage, row: 2 / 3 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : la terrasse ; le muret entier côté nuages (à l'est et au sud) et côté montagne, sauf la brèche ; le
  // socle du gnomon ; le cylindre debout (tombé de son socle, il reste droit) ; le poteau de l'abri et la lanterne de la
  // topographe, la seule allumée de la ruine.
  add('ruine', 0, (b) => {
    terrace(b);
    for (let k = 0; k < T.sides; k++) if (!T.gate.includes(k) && k !== T.breach) wallPan(b, k);
    gnomonSocle(b);
    shelterPosts(b, false);
    topographerLantern(b);
  });
  // Le corps 1 relève : deux dalles soulevées de biais et leur creux ; la brèche du muret, cassée bas.
  add(
    'ruine',
    0,
    (b) => {
      wallPan(b, T.breach, 0.35);
      for (const [x, z, yaw, pitch] of [
        [-2.4, -2.0, 0.5, 0.32],
        [2.0, -1.6, 1.9, -0.26],
      ] as const) {
        const y = deck() + 0.01;
        b.quad([x - 0.6, y, z + 0.6], [x + 0.6, y, z + 0.6], [x + 0.6, y, z - 0.6], [x - 0.6, y, z - 0.6], C.hollow);
        b.box({ x: x + 0.25, y: deck() - 0.05, z: z + 0.2, yaw, pitch }, [1.2, 0.18, 1.2], C3E.stoneShade, C3E.stone);
      }
    },
    corps1,
  );
  // Le corps 2 relève : le gnomon couché le long du muret, à l'est, en deux tronçons.
  add('ruine', 0, gnomonFallen, corps2);
  // Le corps 3 relève : l'équerre tombée à plat ; la boule roulée contre le muret, le cône couché, le cylindre debout sans
  // socle ; les coupes à plat dans l'herbe, dehors, à l'ouest.
  add(
    'ruine',
    0,
    (b) => {
      equerre(b, false);
      const S = SOLIDS;
      const wallBall = onCircle(T.r - 1.0, 252);
      ball(b, wallBall.x, deck() - 0.08, wallBall.z, S.ball.r, 0.4);
      b.prism({ x: S.cone.at.x, y: deck() + S.cone.r * 0.8, z: S.cone.at.z, yaw: 1.1, pitch: Math.PI / 2 }, S.cone.r, 0, S.cone.h, 8, C3E.granite);
      b.prism({ x: S.cylinder.at.x, y: deck(), z: S.cylinder.at.z }, S.cylinder.r, S.cylinder.r, S.cylinder.h, 8, C3E.graniteShade, C3E.graniteSun);
      cuts(b, (at) => {
        const p = onCircle(T.r + 1.6, 250 + (at.z - at.x) * 4);
        return { at: p, y: planeY(p.x, p.z) - 0.05, yaw: 1.3 + at.x };
      });
    },
    corps3,
  );
  // Le haut relève : le cercle de visée grippé, penché sur son pied, de travers.
  add('ruine', 0, (b) => sight(b, 230, 0.42), haut);
  // Les abords relèvent : les flèches dispersées dans l'herbe ; l'herbe sèche au pied du muret ouest.
  add(
    'ruine',
    0,
    (b) => {
      arrowsScattered(b);
      for (const deg of [235, 262, 290]) {
        const p = onCircle(T.r + 0.5, deg);
        b.prism({ x: p.x, y: planeY(p.x, p.z) - 0.05, z: p.z, yaw: deg }, 0.3, 0, 0.45, 3, C.dry);
      }
    },
    abords,
  );

  // ---- Le corps 1 : le dallage à plat, ses traits nets ; la brèche refermée.
  add(0, 0, (b) => {
    joints(b);
    wallPan(b, T.breach);
  });
  // ---- Le corps 2 : le gnomon debout sur son socle, son ombre sur le dallage.
  add(0, 1 / 3, gnomonUp);
  // ---- Le corps 3 : l'équerre redressée, les solides sur leurs socles, chacun à côté de sa coupe.
  add(0, 2 / 3, (b) => {
    equerre(b, true);
    solidsUp(b);
  });
  // ---- Le haut : le cercle de visée sur son pied, tourné vers le Fanal ; l'abri de bois et d'ardoise, sa lanterne.
  add(1, 0, (b) => {
    sight(b, SIGHT.fanal, 0);
    shelter(b);
  });
  // ---- Les abords : les flèches posées en rang, toutes dans le même sens ; le banc de pierre ; la lanterne du chemin.
  add(2, 0, (b) => {
    arrowsLaid(b);
    bench(b);
    pathLantern3e(b, PATH_LANTERN, planeY);
  });
}

// ---------- Les traces ----------

/** Les places des traces, depuis le centre du lieu, sur le dallage, loin du chemin. */
const TRACE_SPOTS = {
  chain: { x: -2.4, z: -2.0 },
  poles: { x: 1.3, z: -2.6 },
  tripod: onCircle(T.r - 0.75, 286),
  plumb: { x: 5.0, z: -2.0 },
  satchel: BENCH.at,
} as const;

/** Une chaîne d'arpenteur lovée au pied d'un piquet (Pythagore). */
function surveyChain(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.chain;
    const y = deck();
    l.box({ x: x + 0.45, y: y - 0.1, z: z - 0.1 }, [0.1, 0.8, 0.1], C3E.woodShade, C3E.newWood);
    l.annulus({ x, y, z }, 0.22, 0.36, 0.06, 8, C3E.iron, C3E.ironTop);
    l.annulus({ x: x + 0.05, y: y + 0.06, z: z + 0.03 }, 0.16, 0.3, 0.05, 8, C3E.iron, C3E.ironTop);
  });
}

/** Deux jalons de deux tons, debout côte à côte dans un socle de pierre (Thalès). */
function rangingPoles(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.poles;
    const y = deck();
    l.box({ x, y: y - 0.05, z }, [0.8, 0.3, 0.45], C3E.graniteShade, C3E.graniteSun);
    for (const dx of [-0.18, 0.18])
      for (let i = 0; i < 4; i++) l.box({ x: x + dx, y: y + 0.25 + i * 0.42, z }, [0.08, 0.42, 0.08], i % 2 ? C3E.slate : C.pale);
  });
}

/** Un trépied de visée replié, debout contre le muret (Trigo) : trois pieds serrés, sa tête. */
function foldedTripod(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.tripod;
    const y = deck();
    const out = { x: x / Math.hypot(x, z), z: z / Math.hypot(x, z) };
    const top = { x: x + out.x * 0.3, y: y + 1.5, z: z + out.z * 0.3 };
    for (const [dx, dz] of [
      [-0.1, 0],
      [0.1, 0],
      [0, 0.1],
    ] as const)
      l.beam({ x: x - out.x * 0.15 + dx, y, z: z - out.z * 0.15 + dz }, top, 0.06, C3E.newWood);
    l.box({ x: top.x, y: top.y, z: top.z }, [0.2, 0.16, 0.2], C3E.iron, C3E.ironTop);
  });
}

/** Un fil à plomb pendu à une petite potence de bois (Agrandir). */
function plumbLine(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.plumb;
    const y = deck();
    l.box({ x, y: y - 0.1, z }, [0.12, 1.7, 0.12], C3E.woodShade, C3E.wood);
    l.beam({ x, y: y + 1.55, z }, { x: x - 0.55, y: y + 1.55, z }, 0.08, C3E.woodShade);
    l.beam({ x: x - 0.52, y: y + 1.53, z }, { x: x - 0.52, y: y + 0.55, z }, 0.02, C3E.woodShade);
    l.prism({ x: x - 0.52, y: y + 0.55, z, pitch: Math.PI }, 0.09, 0, 0.2, 6, C3E.iron);
  });
}

/** Une sacoche de cuir et un carnet fermé, sur le banc de pierre (Transformer). */
function satchel(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.satchel;
    const y = deck() + BENCH.h + 0.07;
    const yaw = Math.atan2(z, -x) + Math.PI / 2;
    l.box({ x: x - 0.35 * Math.cos(yaw), y, z: z + 0.35 * Math.sin(yaw), yaw }, [0.42, 0.3, 0.2], C3E.leather);
    l.box({ x: x - 0.35 * Math.cos(yaw), y: y + 0.18, z: z + 0.35 * Math.sin(yaw), yaw }, [0.44, 0.13, 0.22], C3E.leather, 0x9c7c60);
    l.box({ x: x + 0.35 * Math.cos(yaw), y, z: z - 0.35 * Math.sin(yaw), yaw: yaw + 0.3 }, [0.3, 0.06, 0.22], C3E.slate, C.pale);
  });
}

/** Les cinq traces, une par mission, chacune avec sa partie : le corps en trois, le haut, les abords. */
const TRACES = {
  pythagoras: { at: TRACE_SPOTS.chain, lift: 1, stage: 0, row: 0, draw: surveyChain },
  thales: { at: TRACE_SPOTS.poles, lift: 1, stage: 0, row: 1 / 3, draw: rangingPoles },
  trigonometry: { at: TRACE_SPOTS.tripod, lift: 1, stage: 0, row: 2 / 3, draw: foldedTripod },
  scaling: { at: TRACE_SPOTS.plumb, lift: 1, stage: 1, row: 0, draw: plumbLine },
  transformations: { at: TRACE_SPOTS.satchel, lift: 1, stage: 2, row: 0, draw: satchel },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/** Le cap de départ de la scénette (proposition, § 3) : au nord-ouest, vers le gnomon, le pic et le Fanal. */
const SCENE_START = capOf(323);

/** Le milieu de la scène, depuis le centre du lieu : au pied du gnomon, côté est de la terrasse. */
const SCENE_SPOT = { dx: 1.4, dz: 1.8, half: [2.4, 1.2] as [number, number] } as const;

/** Le madrier des galets sur ses deux blocs : sa hauteur à l'échelle 1 ; un galet choisi se soulève d'un cran. */
const PLANK = { height: 0.5, lift: 0.3, stone: 0.12 } as const;

/** Un galet plat de granit, tous pareils (une forme par réponse se lirait comme un indice). */
function pebble(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z, yaw: 0.3 }, 0.24 * s, 0.2 * s, PLANK.stone * s, 7, C3E.graniteShade, C3E.graniteSun);
}

export const BELVEDERE: PlaceArt = {
  role: 'La topographe',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a sa partie (`stage`, `row` : 3 + 1 + 1).
  traceStage: 0,
  // La scénette : Kéo et la topographe de part et d'autre de son milieu ; son sol, le dallage.
  // Basse, à l'horizontale : la terrasse est plate, et la caméra ne regarde jamais par-dessus le muret.
  ...scene3e(SITE, { start: SCENE_START, spot: SCENE_SPOT, floor: deck, top: 2.9, pitch: 10 }),
  // Le décor de près : la terrasse et ses pierres sont au lieu ; les abords (./belvedereSurroundings.ts) ajoutent ce qui
  // cadre. Il reste la topographe en pion.
  decor(b, _floor, at, sphere: Sphere, body = true) {
    if (body) habitant3e(b, at, sphere, C.coat);
  },
  answer: {
    size: { height: PLANK.height + PLANK.lift + PLANK.stone, half: 0.3 },
    facing: true,
    // Un madrier de bois gris sur deux blocs de granit, sous la rangée des galets.
    base(b, mid, y, z, span, s, ground) {
      const top = y + PLANK.height * s;
      b.box({ x: mid, y: top - 0.12 * s, z }, [span + 0.7, 0.12 * s, 0.4 * s], C3E.woodShade, C3E.wood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.34, top - 0.12 * s - foot, 0.4 * s], C3E.graniteShade, C3E.granite);
      }
    },
    // Un galet plat, tous pareils ; choisi, il se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      pebble(b, { x: at.x, y: at.y + (PLANK.height + (picked ? PLANK.lift : 0)) * s, z: at.z }, s);
    },
  },
  // Les cinq missions en R : la terrasse seule, rien de l'item ; les galets portent les réponses.
  rest() {},
  traces: TRACES,
  // Kéo au retour : au pas de la porte, tourné vers la terrasse.
  exit: { x: SITE.door.x - 0.6, z: SITE.door.z - 0.6 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan du Belvédère, pour les tests et ses abords : la terrasse, ses pierres, la caméra. */
export const BELVEDERE_LAYOUT = {
  terrace: T,
  get deck() {
    return deck();
  },
  gnomon: GNOMON,
  equerre: EQUERRE,
  solids: SOLIDS,
  sight: SIGHT,
  shelter: SHELTER,
  arrows: ARROWS,
  bench: BENCH,
  pathLantern: PATH_LANTERN,
  planeY,
  door: SITE.door,
  center: PLACES_3E.find((p) => p.id === 'belvedere')!.center,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
  colors: C,
} as const;
