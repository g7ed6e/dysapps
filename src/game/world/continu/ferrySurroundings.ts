/**
 * Les abords de la scénette de la Gare maritime (reprise lieu par lieu, d'après le concept du 18 octobre 2026, case du
 * Bac) : ce qui entoure Kéo et le chef de gare sur le quai de l'îlot, fini tout autour puisque la caméra tourne à deux
 * doigts (« Caméra libre »). De face, dans la moitié droite du cadre (la gauche est sous le panneau de consigne) : le
 * débarcadère de planches qui part du coin nord-est du quai vers le large, la gare à colombages au toit d'ardoise posée
 * sur pilotis à son flanc ouest, sa lanterne au pignon sud (ni horloge : rien d'écrit, règle du lot L9), un sac et un
 * ballot de toile claire au bout des planches, le bac à câble amarré à la gare, sa cloche au poteau de proue, et son
 * câble tendu jusqu'à l'amer de l'îlot, au loin : une tourelle de pierre trapue (ni croix : aucun symbole religieux au
 * 6e, docs/rendu/style.md). Le haut du cadre
 * s'arrête vers 15 au nord de la scène (la plongée de 27° du lieu, qui cache l'horizon et les mâts des Balises) : tout
 * s'y tient, entre l'anneau de la rangée et le bord. De côté et de dos, des rochers à facettes de pierre chaude qui
 * affleurent autour de l'îlot, un banc de sable à l'ouest, une barque de pêche au sud-ouest.
 *
 * L'îlot de la Gare tient presque entier dans l'anneau où la rangée des objets-réponses se pose quand la caméra tourne
 * (à moins de `RING` du point visé) : rien de haut n'y entre, seul le débarcadère y passe, au ras du quai. Rien de haut
 * entre la caméra de face et la scène. Aplats francs, une couleur par facette, jamais presque noir. Code pur, sans
 * Three.js (le kit commun, ./surroundingsKit.ts, pour le ponton, la maison, les rochers et les touffes).
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { SurroundingsState } from './surroundings';
import { DRY_TUFT, NATURE, STONE, TIMBER, barque, barqueFloor, groundAt, pontoon, rock, timberHouse, tuft } from './surroundingsKit';

const C = {
  /** Le bac : sa coque de bois, son plat-bord clair, son pont de planches et leurs joints. */
  hull: 0x9a6a3e,
  wale: 0xc28a52,
  deck: TIMBER.plank,
  seam: TIMBER.seam,
  /** Les rambardes, les poteaux du câble (le bois des pieux), le câble et les amarres (le chanvre). */
  post: NATURE.pile,
  rope: 0x8f7a5c,
  /** La lanterne du pignon : son cadre de bois, sa vitre Sable éteinte (celle des lanternes des ponts). */
  lanternFrame: 0x8a6440,
  lanternGlass: 0xdaa66a,
  /** La cloche du bac : le bronze, sa bouche plus sombre (jamais presque noir). */
  bell: 0xc9a24e,
  bellMouth: 0x9c7a3c,
  /**
   * Le sac et le ballot : une toile écrue claire, son ombre, le lien de chanvre clair (relecture du 19 octobre 2026 : ni
   * cuir rouge-brun ni sangles sombres en bande, rien qui rappelle les malles des réponses).
   */
  canvas: 0xe8dcc0,
  canvasShade: 0xd6c8a8,
  tie: 0xc2a67c,
  /** L'îlot de l'amer : son sable. */
  sand: NATURE.dune,
  sandShade: 0xd8c294,
} as const;

/**
 * Où sont les abords, depuis le sol de la scène (`floor`, entre Kéo et le chef de gare) : le débarcadère (son axe, sa
 * largeur, son début au bord nord du quai, sa fin), la gare (son milieu, sa largeur le long de z, sa profondeur), le bac
 * (son milieu, sa longueur le long de z, sa largeur), l'îlot de l'amer (son milieu, son rayon, la hauteur de la tourelle).
 */
export const FERRY_SURROUNDINGS = {
  landing: { dx: 4.0, width: 1.6, from: -4.7, to: -13.0 },
  station: { dx: 1.8, dz: -10.6, width: 2.6, depth: 2.2, wall: 1.6, slope: 0.8 },
  bac: { dx: -0.7, dz: -11.0, length: 4.0, width: 2.0 },
  amer: { dx: -5.0, dz: -15.8, radius: 2.4, height: 1.5 },
  barque: { dx: -4.5, dz: 11.5, length: 3.0, width: 1.2 },
} as const;

/** La distance au point visé en deçà de laquelle la rangée des réponses peut se poser quand la caméra tourne. */
export const RING = 7.5;

/** La hauteur du quai de la Gare au-dessus du sol de la scène (le dessus des dalles, un rien sous la scène). */
const QUAY_DROP = 0.02;

export function ferrySurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const top = floor.y - QUAY_DROP;
  landing(b, floor, top);
  station(b, floor, top);
  bundles(b, floor, top);
  bac(b, floor);
  amerIslet(b, floor);
  rocks(b, floor);
  sandbank(b, floor);
  fishingBoat(b, floor);
}

/**
 * Le débarcadère de planches (le ponton du kit commun), du coin nord-est du quai vers le large, au ras du quai ; une
 * rambarde sur son flanc est, au-delà de l'anneau de la rangée.
 */
function landing(b: FacetBuilder, f: Vec3, top: number): void {
  const L = FERRY_SURROUNDINGS.landing;
  const x = f.x + L.dx;
  pontoon(b, { from: { x, z: f.z + L.from }, to: { x, z: f.z + L.to }, width: L.width, top, pairs: 5, braces: 1 });
  const rx = x + L.width / 2 - 0.08;
  const z0 = f.z - 8.6,
    z1 = f.z + L.to + 0.2;
  for (const z of [z0, (z0 + z1) / 2, z1]) b.box({ x: rx, y: top, z }, [0.1, 0.85, 0.1], C.post);
  b.beam({ x: rx, y: top + 0.85, z: z0 + 0.05 }, { x: rx, y: top + 0.85, z: z1 - 0.05 }, 0.09, TIMBER.plankSide);
}

/**
 * La gare, sur pilotis au flanc ouest du débarcadère (la maison à colombages du kit commun) : sa porte à l'est, sur
 * les planches ; son toit d'ardoise, le faîtage du nord au sud ; au pignon sud, tourné vers la caméra de face, sa lanterne.
 */
function station(b: FacetBuilder, f: Vec3, top: number): void {
  const S = FERRY_SURROUNDINGS.station;
  const x = f.x + S.dx,
    z = f.z + S.dz;
  // Sur l'eau, le sol est le fond : la plate-forme se pose au ras du débarcadère.
  let ground = -Infinity;
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) ground = Math.max(ground, groundAt(x + dx * (S.depth / 2 + 0.3), z + dz * (S.width / 2 + 0.3), 0, -Infinity));
  const floor = timberHouse(b, { x, z, yaw: Math.PI / 2, width: S.width, depth: S.depth, wall: S.wall, slope: S.slope, stilts: top + 0.02 - ground });
  lantern(b, { x, y: floor + S.wall - 0.55, z: z + S.width / 2 + 0.02 });
}

/**
 * La lanterne du pignon, accrochée au mur sud en `at` (le pied de sa console) : une console de bois, la lanterne
 * pendue, son socle, sa vitre éteinte et son toit en pointe.
 */
function lantern(b: FacetBuilder, at: Vec3): void {
  const z = at.z + 0.28;
  b.beam({ x: at.x, y: at.y + 0.5, z: at.z }, { x: at.x, y: at.y + 0.5, z: z + 0.04 }, 0.06, C.lanternFrame);
  b.box({ x: at.x, y: at.y + 0.1, z }, [0.2, 0.05, 0.2], C.lanternFrame);
  b.box({ x: at.x, y: at.y + 0.15, z }, [0.16, 0.22, 0.16], C.lanternGlass);
  b.prism({ x: at.x, y: at.y + 0.37, z, yaw: Math.PI / 4 }, 0.15, 0, 0.13, 4, C.lanternFrame);
}

/**
 * Au bout du débarcadère, près du bac, loin de la rangée des réponses quelle que soit la vue : un sac de toile écrue
 * debout, son col noué d'un lien clair ; un ballot de toile couché à côté (ni valise ni malle : rien qui ressemble aux
 * malles des réponses).
 */
function bundles(b: FacetBuilder, f: Vec3, top: number): void {
  const x = f.x + FERRY_SURROUNDINGS.landing.dx + 0.3,
    z = f.z - 12.0;
  // Le sac : le corps renflé, le col serré, le lien, la gueule froncée.
  b.prism({ x, y: top, z, yaw: 0.3 }, 0.22, 0.25, 0.3, 6, C.canvas);
  b.prism({ x, y: top + 0.3, z, yaw: 0.3 }, 0.25, 0.08, 0.22, 6, C.canvasShade, C.canvas);
  b.band({ x, y: top + 0.5, z, yaw: 0.3 }, 0.09, 0.05, 6, C.tie);
  b.prism({ x, y: top + 0.55, z, yaw: 0.3 }, 0.08, 0.13, 0.08, 6, C.canvas, C.canvasShade);
  // Le ballot, couché, un peu plus au sud.
  b.box({ x: x - 0.25, y: top, z: z + 0.65, yaw: -0.35 }, [0.6, 0.32, 0.42], C.canvasShade, C.canvas);
}

/**
 * Le bac à câble, amarré au bout du débarcadère : une coque plate de bois, son pont de planches et ses joints, deux
 * rampes relevées aux bouts, une rambarde sur chaque long côté ; à la proue, au nord, le poteau du câble et sa cloche,
 * le câble tendu jusqu'à l'amer de l'îlot ; une amarre au pieu du débarcadère.
 */
function bac(b: FacetBuilder, f: Vec3): void {
  const B = FERRY_SURROUNDINGS.bac;
  const x = f.x + B.dx,
    z = f.z + B.dz;
  const deck = 0.32;
  b.box({ x, y: -0.25, z }, [B.width, deck + 0.25, B.length], C.hull, C.deck);
  for (const k of [-1, 1]) b.box({ x, y: deck - 0.02, z: z + (k * (B.length / 2 - 0.08)) }, [B.width + 0.04, 0.14, 0.16], C.wale);
  // Les joints du pont, en travers.
  for (let i = 1; i < 6; i++) {
    const zz = z - B.length / 2 + (i * B.length) / 6;
    b.quad([x - B.width / 2, deck + 0.005, zz + 0.02], [x + B.width / 2, deck + 0.005, zz + 0.02], [x + B.width / 2, deck + 0.005, zz - 0.02], [x - B.width / 2, deck + 0.005, zz - 0.02], C.seam);
  }
  // Les rampes, relevées aux deux bouts.
  for (const k of [-1, 1]) b.box({ x, y: deck + 0.08, z: z + k * (B.length / 2 + 0.3), pitch: -k * 0.45 }, [B.width - 0.3, 0.07, 0.75], C.wale, C.deck);
  // Les rambardes : trois poteaux et une lisse sur chaque long côté.
  for (const k of [-1, 1]) {
    const rx = x + k * (B.width / 2 - 0.08);
    for (const dz of [-1.4, 0, 1.4]) b.box({ x: rx, y: deck, z: z + dz }, [0.09, 0.7, 0.09], C.post);
    b.beam({ x: rx, y: deck + 0.7, z: z - 1.45 }, { x: rx, y: deck + 0.7, z: z + 1.45 }, 0.08, C.wale);
  }
  // Le poteau du câble, à la proue, côté ouest, et la cloche du bac à son sommet ; le câble jusqu'à l'amer de l'îlot,
  // attaché à la tourelle ; l'amarre.
  const px = x - B.width / 2 + 0.08,
    pz = z - B.length / 2 + 0.2;
  b.box({ x: px, y: deck, z: pz }, [0.14, 1.3, 0.14], C.post);
  bell(b, { x: px + 0.2, y: deck + 1.25, z: pz }, px);
  const A = FERRY_SURROUNDINGS.amer;
  const ax = f.x + A.dx,
    az = f.z + A.dz - 0.3;
  const toward = Math.atan2(px - ax, pz - az);
  const end = { x: ax + Math.sin(toward) * 0.5, y: 1.1, z: az + Math.cos(toward) * 0.5 };
  b.beam({ x: px, y: deck + 1.15, z: pz }, end, 0.04, C.rope);
  const St = FERRY_SURROUNDINGS.station;
  const pile = { x: f.x + St.dx - St.depth / 2 - 0.15, z: f.z + St.dz + St.width / 2 + 0.15 };
  b.beam({ x: x + B.width / 2 - 0.1, y: deck + 0.2, z: z + B.length / 2 - 0.2 }, { x: pile.x, y: deck + 0.35, z: pile.z }, 0.035, C.rope);
}

/**
 * La cloche du bac, pendue en `at` à une potence qui part du poteau (en `post`, le x du poteau) : la potence, la cloche
 * de bronze évasée, sa bouche.
 */
function bell(b: FacetBuilder, at: Vec3, post: number): void {
  b.beam({ x: post, y: at.y + 0.02, z: at.z }, { x: at.x + 0.04, y: at.y + 0.02, z: at.z }, 0.05, C.post);
  b.prism({ x: at.x, y: at.y - 0.2, z: at.z }, 0.11, 0.06, 0.2, 6, C.bell);
  b.prism({ x: at.x, y: at.y - 0.21, z: at.z }, 0.12, 0.11, 0.02, 6, C.bellMouth, C.bell);
}

/**
 * L'îlot de l'amer, au loin : son banc de sable, ses rochers, deux touffes ; l'amer, une tourelle de pierre chaude
 * trapue (le repère des bateaux) sur un socle, son chapeau conique : rien de religieux, rien de haut (vue de face, elle
 * reste sous le haut du cadre). Le câble du bac s'attache à elle.
 */
function amerIslet(b: FacetBuilder, f: Vec3): void {
  const A = FERRY_SURROUNDINGS.amer;
  const x = f.x + A.dx,
    z = f.z + A.dz;
  b.prism({ x, y: -0.4, z, yaw: 0.2 }, A.radius * 1.15, A.radius, 0.55, 9, C.sandShade, C.sand);
  rock(b, { x: x - 1.6, y: 0.15, z: z - 0.9 }, 1.0, 1.1, 21);
  rock(b, { x: x + 1.7, y: 0.15, z: z - 0.4 }, 0.8, 0.8, 22);
  rock(b, { x: x + 0.6, y: 0.15, z: z + 1.6 }, 0.6, 0.5, 23);
  b.box({ x, y: 0.1, z: z - 0.3 }, [1.4, 0.3, 1.4], STONE.side, STONE.top);
  b.prism({ x, y: 0.4, z: z - 0.3, yaw: 0.2 }, 0.58, 0.46, A.height - 0.4, 8, STONE.sideAlt, STONE.top);
  b.prism({ x, y: A.height, z: z - 0.3, yaw: 0.2 }, 0.52, 0, 0.45, 8, STONE.side);
  tuft(b, { x: x - 0.9, y: 0.15, z: z + 0.9 }, 31, DRY_TUFT, 1.4);
  tuft(b, { x: x + 1.2, y: 0.15, z: z + 1.0 }, 32, DRY_TUFT, 1.4);
}

/** Les rochers qui affleurent autour de l'îlot, hors de l'anneau de la rangée : (dx, dz, rayon, hauteur, graine). */
const ROCKS: readonly (readonly [number, number, number, number, number])[] = [
  [10.2, -3.4, 0.9, 0.9, 1],
  [11.6, -1.2, 0.6, 0.5, 2],
  [10.6, 5.8, 1.0, 0.8, 3],
  [6.2, 10.4, 0.7, 0.6, 4],
  [-6.8, 10.2, 0.9, 0.8, 5],
  [-9.6, 7.0, 0.6, 0.5, 6],
  [-11.4, -1.0, 1.1, 1.0, 7],
  [-9.8, -7.4, 0.8, 0.7, 8],
  [-4.2, -11.6, 0.9, 0.8, 9],
  [1.6, -14.6, 0.7, 0.6, 10],
];

function rocks(b: FacetBuilder, f: Vec3): void {
  for (const [dx, dz, r, h, seed] of ROCKS) rock(b, { x: f.x + dx, y: 0.05, z: f.z + dz }, r, h, seed);
}

/** Le banc de sable à l'ouest, au ras de l'eau, et ses touffes sèches (la vue de côté, vers le large). */
function sandbank(b: FacetBuilder, f: Vec3): void {
  const x = f.x - 15,
    z = f.z - 3.5;
  b.prism({ x, y: -0.4, z, yaw: 0.5 }, 3.4, 2.8, 0.5, 7, C.sandShade, C.sand);
  rock(b, { x: x + 1.2, y: 0.1, z: z - 0.6 }, 0.8, 0.7, 41);
  for (const [k, [dx, dz]] of [
    [-1, 0.8],
    [0.2, 1.4],
    [-1.6, -0.6],
  ].entries())
    tuft(b, { x: x + dx, y: 0.1, z: z + dz }, 45 + k, DRY_TUFT, 1.3);
}

/** Une barque de pêche amarrée au sud-ouest de l'îlot (la vue de dos, vers la côte) : la barque du kit, sans lanterne. */
function fishingBoat(b: FacetBuilder, f: Vec3): void {
  const K = FERRY_SURROUNDINGS.barque;
  const at = { x: f.x + K.dx, y: 0, z: f.z + K.dz };
  barque(b, at, K.length, K.width, { lantern: false });
  barqueFloor(b, at, K.length, K.width);
}
