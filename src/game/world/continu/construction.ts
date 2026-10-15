// La construction de chaque lieu dans le monde continu (GD-20, lot 1, « Tout au lieu ») : la maison de l'habitant, à
// côté du lieu, qui naît partie par partie à la première réussite de chaque mission, en trois étapes comme dans la grille
// (le corps, le haut, les abords ; index.md, « La construction du lieu »). Les parties sont celles de la grille, mêmes
// identifiants et même sauvegarde (`parts`) : la page les lit (../../three/archipeo/constructionParts.ts) et donne ici,
// pour chacune, les tranches d'étapes qu'elle pose ; ce fichier ne fait que les dessiner. Des volumes simples dessinés
// par le code, en aplats francs (le low poly d'Archipéo), sans lumière ni texte ; la lanterne de la porte est la seule
// note chaude. Code pur.
import { FOLLOW, type CameraPose } from './camera';
import { FacetBuilder, placeFacets, type Facets } from './facets';
import { distance, type Vec2, type Vec3 } from './geometry';
import { placeById, type PlaceId } from './plan6e';
import { standingHeight } from './terrain';

/** Les trois étapes de la construction d'un lieu : le corps, le haut, les abords. */
export type Stage = 0 | 1 | 2;

/**
 * Une tranche d'étape qu'une partie pose : de `from` à `to` (de 0 à 1, du bas vers le haut). Une étape entière va de
 * 0 à 1 ; coupée en deux ou en trois par la hauteur (GD-14), ses tranches se suivent, en rangées entières.
 */
interface StageSlice {
  stage: Stage;
  from: number;
  to: number;
}

/** Une partie : les tranches qu'elle pose (une, ou deux quand le haut et les abords vont ensemble). */
export type PartShape = readonly StageSlice[];

/** Un volume de la construction : son étape, sa rangée (de 0 à 1, le bas de la tranche où il se pose) et son dessin. */
interface Piece {
  stage: Stage;
  row: number;
  draw(b: FacetBuilder): void;
}

/** Le dessin d'une maison : ses couleurs, et ce qui distingue ses abords. */
interface HouseLook {
  wall: number;
  roof: number;
  gable: number;
  trim: number;
  stone: number;
  yard: number;
  /** Ce qu'on pose dans la cour, avec la barrière : le dernier geste des abords. */
  extra: 'jardin' | 'tonneaux' | 'perches' | 'bassin';
}

/**
 * La maison de chaque lieu : son centre, depuis le centre du lieu, en unités du monde (à côté du lieu, sur un sol plat,
 * hors des chemins et des traces des scénettes : continu.test.ts le vérifie), son quart de tour, et son dessin.
 * La porte regarde le sud, vers la caméra qui regarde toujours le nord.
 */
const HOUSES: Record<PlaceId, { at: Vec2; yaw: number; look: HouseLook }> = {
  // La maison de la gardienne, sur l'îlot, à l'ouest de la tour : chaux blanche, ardoise, jardin clos.
  phare: { at: { x: -7.5, z: 0 }, yaw: 0, look: { wall: 0xf2eee4, roof: 0x6f8089, gable: 0xe4ddcf, trim: 0x7a5538, stone: 0xb9b2a3, yard: 0xd6c9ae, extra: 'jardin' } },
  // La maison du docker, à l'est des Quais, après le hangar : enduit sable, tuiles rouille, tonneaux dans la cour.
  quais: { at: { x: 10, z: 5.5 }, yaw: 0, look: { wall: 0xe9dcc0, roof: 0xb0583a, gable: 0xd9c7a4, trim: 0x8a6440, stone: 0x9a9488, yard: 0xd2ab78, extra: 'tonneaux' } },
  // La cabane de la pêcheuse, à l'ouest des Filets : chaume, perches à filets dans la cour.
  filets: { at: { x: -9, z: 3 }, yaw: 0, look: { wall: 0xe9dcc0, roof: 0xd9a441, gable: 0xd8c39a, trim: 0x8a6440, stone: 0xb9b2a3, yard: 0xe3c08a, extra: 'perches' } },
  // La maison de l'éclusier, à l'est des Écluses : pierre, ardoise, un petit bassin dans la cour.
  ecluses: { at: { x: 12, z: 3.5 }, yaw: 0, look: { wall: 0xc9c1b0, roof: 0x5f7584, gable: 0xb9b2a3, trim: 0xa9784a, stone: 0x9a9488, yard: 0xc8bfae, extra: 'bassin' } },
};

/** La maison : ses murs (en x et z), la hauteur de ses trois rangées de murs, sa cour devant (au sud). */
const HOUSE = { width: 3.4, depth: 2.6, course: 0.75, socle: 0.25, yard: 2.4, roof: 1.3 } as const;
/** Sous le sol, la maison s'enfonce jusque-là sous son point le plus bas : elle ne flotte jamais sur une pente. */
const SINK = 0.4;
const GLASS = 0x4f7fa3;
const LAMP = 0xffd36b;
const GREEN = 0x5f9f45;

/** Le centre au sol de la maison d'un lieu, dans le monde. */
export function houseCenter(place: PlaceId): Vec2 {
  const p = placeById(place);
  const h = HOUSES[place];
  return { x: p.center.x + h.at.x, z: p.center.z + h.at.z };
}

/** Le rayon où un toucher sur la maison mène au lieu. */
const HOUSE_TOUCH = 3.6;

/** Le lieu dont la maison est sous ce point du sol, s'il y en a un. */
export function houseAt(p: Vec2): PlaceId | null {
  for (const id of Object.keys(HOUSES) as PlaceId[]) if (distance(p, houseCenter(id)) <= HOUSE_TOUCH) return id;
  return null;
}

/** Les points du sol que couvrent la maison, sa cour et ses marches (dans son repère, puis dans le monde). */
export function houseFootprint(place: PlaceId): Vec2[] {
  const c = houseCenter(place);
  const yaw = HOUSES[place].yaw;
  const cs = Math.cos(yaw), sn = Math.sin(yaw);
  const pts: Vec2[] = [];
  const hw = HOUSE.width / 2 + 1;
  for (let lx = -hw; lx <= hw + 1e-6; lx += 0.5)
    for (let lz = -HOUSE.depth / 2 - 0.3; lz <= HOUSE.depth / 2 + HOUSE.yard + 0.8 + 1e-6; lz += 0.5) pts.push({ x: c.x + lx * cs + lz * sn, z: c.z - lx * sn + lz * cs });
  return pts;
}

/** Le pied de la maison : le plus haut du sol sous elle (rien ne s'y enfonce), et le plus bas (sa base y descend). */
function footOf(place: PlaceId, ground: (x: number, z: number) => number): { top: number; low: number } {
  let top = -Infinity;
  let low = Infinity;
  for (const q of houseFootprint(place)) {
    const g = standingHeight(ground(q.x, q.z));
    top = Math.max(top, g);
    low = Math.min(low, g);
  }
  return { top, low };
}

/** Les volumes d'une maison, dans son repère (le sol en 0 sous le seuil, la porte au sud), étape par étape. */
function housePieces(look: HouseLook, depth: number): Piece[] {
  const { width: W, depth: D, course, socle } = HOUSE;
  const front = D / 2;
  const wallTop = socle + 3 * course;
  const pieces: Piece[] = [];
  const add = (stage: Stage, row: number, draw: (b: FacetBuilder) => void) => pieces.push({ stage, row, draw });

  // Le corps, en trois rangées entières : le socle et le bas des murs ; le milieu, ses fenêtres ; le haut, son linteau.
  add(0, 0, (b) => {
    b.box({ x: 0, y: -depth, z: 0 }, [W + 0.3, depth + socle, D + 0.3], look.stone);
    b.box({ x: 0, y: socle, z: 0 }, [W, course, D], look.wall);
  });
  add(0, 0.34, (b) => {
    b.box({ x: 0, y: socle + course, z: 0 }, [W, course, D], look.wall);
    for (const x of [-1.05, 1.05]) b.box({ x, y: socle + course + 0.12, z: front + 0.02 }, [0.62, 0.55, 0.06], GLASS);
    b.box({ x: 0, y: socle + course + 0.12, z: -front - 0.02 }, [0.62, 0.55, 0.06], GLASS);
  });
  add(0, 0.67, (b) => {
    b.box({ x: 0, y: socle + 2 * course, z: 0 }, [W, course, D], look.wall);
    b.box({ x: 0, y: wallTop - 0.12, z: 0 }, [W + 0.12, 0.14, D + 0.12], look.trim);
  });

  // Le haut : la porte et ses poutres, puis le toit, la cheminée et la lanterne de la porte.
  add(1, 0, (b) => {
    b.box({ x: 0, y: socle, z: front + 0.03 }, [0.8, 1.35, 0.08], look.trim);
    b.box({ x: 0, y: socle + 1.35, z: front + 0.05 }, [1.05, 0.14, 0.12], look.trim);
    for (const z of [-front + 0.2, front - 0.2]) b.box({ x: 0, y: wallTop, z }, [W + 0.5, 0.16, 0.16], look.trim);
  });
  add(1, 0.5, (b) => {
    b.gableRoof({ x: 0, y: wallTop + 0.02, z: 0 }, W + 0.6, D + 0.7, HOUSE.roof, look.roof, look.gable);
    b.box({ x: 1, y: wallTop + 0.4, z: -0.45 }, [0.42, 1.25, 0.42], look.stone);
    // La lanterne de la porte, sur sa potence : la lumière rendue.
    b.box({ x: 0.75, y: socle + 1.2, z: front + 0.12 }, [0.08, 0.08, 0.3], look.trim);
    b.box({ x: 0.75, y: socle + 0.85, z: front + 0.3 }, [0.24, 0.32, 0.24], LAMP, look.trim);
  });

  // Les abords : la cour et ses marches, puis la barrière et ce qu'on y pose.
  const yz = front + HOUSE.yard / 2;
  add(2, 0, (b) => {
    b.box({ x: 0, y: -depth, z: yz }, [W + 1.6, depth + 0.14, HOUSE.yard], look.stone, look.yard);
    b.box({ x: 0, y: -depth, z: front + HOUSE.yard + 0.3 }, [1.2, depth + 0.07, 0.6], look.stone);
  });
  add(2, 0.5, (b) => {
    const xs = W / 2 + 0.7;
    const zEnd = front + HOUSE.yard - 0.1;
    // Les poteaux et la lisse, de part et d'autre de la cour, et le devant, ouvert au milieu (les marches).
    for (const x of [-xs, xs]) {
      for (const z of [front + 0.1, (front + zEnd) / 2, zEnd]) b.box({ x, y: 0, z }, [0.14, 0.75, 0.14], look.trim);
      b.box({ x, y: 0.55, z: (front + zEnd) / 2 }, [0.08, 0.1, zEnd - front], look.trim);
    }
    for (const side of [-1, 1]) {
      b.box({ x: side * (xs - 0.6), y: 0, z: zEnd }, [0.14, 0.75, 0.14], look.trim);
      b.box({ x: side * (xs - 0.3), y: 0.55, z: zEnd }, [0.6, 0.1, 0.08], look.trim);
    }
    const ex = -W / 2 + 0.2;
    const ez = yz - 0.2;
    if (look.extra === 'jardin') {
      b.box({ x: ex + 0.3, y: 0.14, z: ez }, [0.9, 0.3, 1.2], look.trim, GREEN);
    } else if (look.extra === 'tonneaux') {
      for (const dz of [-0.35, 0.35]) b.prism({ x: ex + 0.2, y: 0.14, z: ez + dz }, 0.3, 0.3, 0.7, 7, look.trim, 0xc28a52);
    } else if (look.extra === 'perches') {
      for (const dx of [-0.4, 0.6]) b.box({ x: ex + dx, y: 0.14, z: ez }, [0.1, 1.4, 0.1], look.trim);
      b.box({ x: ex + 0.1, y: 1.1, z: ez }, [1.2, 0.5, 0.05], 0x8e7b5a);
    } else {
      b.box({ x: ex + 0.3, y: 0.14, z: ez }, [1, 0.35, 1], look.stone, 0x5fb3e0);
    }
  });
  return pieces;
}

/** La tranche `from`–`to` d'une étape prend-elle ce volume ? Sa rangée y est. */
const takes = (s: StageSlice, p: Piece) => s.stage === p.stage && p.row >= s.from - 1e-9 && p.row < s.to - 1e-9;

/**
 * Les volumes que posent ces parties, dans le monde (`ground` : la hauteur du sol dessiné, comme pour les lieux) :
 * toute la construction posée, ou, pour le passage d'une pose, la seule partie qui arrive.
 */
export function constructionFacets(place: PlaceId, parts: readonly PartShape[], ground: (x: number, z: number) => number): Facets {
  if (!parts.length) return new FacetBuilder().build();
  const foot = footOf(place, ground);
  const pieces = housePieces(HOUSES[place].look, foot.top - foot.low + SINK).filter((p) => parts.some((part) => part.some((s) => takes(s, p))));
  const b = new FacetBuilder();
  for (const p of pieces) p.draw(b);
  const c = houseCenter(place);
  return placeFacets(b.build(), { x: c.x, y: foot.top, z: c.z, yaw: HOUSES[place].yaw });
}

/** La construction entière, ses trois étapes posées : le pire, pour le budget. */
export const WHOLE: PartShape = [
  { stage: 0, from: 0, to: 1 },
  { stage: 1, from: 0, to: 1 },
  { stage: 2, from: 0, to: 1 },
];

/** Le point que regarde la caméra d'une pose : le milieu de la maison, à mi-hauteur. */
export function houseFocus(place: PlaceId, ground: (x: number, z: number) => number): Vec3 {
  const c = houseCenter(place);
  return { x: c.x, y: footOf(place, ground).top + 1.6, z: c.z + 0.6 };
}

/**
 * La caméra d'une pose : `back` au sud de la maison, `height` au-dessus de son milieu, le regard levé de `aim` au-dessus
 * de lui : la maison se pose un peu sous le milieu de l'image, entière avec sa cour, sous les célébrations du haut.
 */
const POSE_VIEW = { back: 9, height: 4.8, aim: 1.2 } as const;

/**
 * La caméra d'une pose (GD-20, lot 1) : la maison vue du sud et de trois quarts haut, toujours tournée vers le nord
 * comme la caméra qui suit Kéo, au même champ (aucun effet de zoom). Remplie dans `out`.
 */
export function poseView(place: PlaceId, ground: (x: number, z: number) => number, out: CameraPose): CameraPose {
  const f = houseFocus(place, ground);
  out.position.x = f.x;
  out.position.y = f.y + POSE_VIEW.height;
  out.position.z = f.z + POSE_VIEW.back;
  out.target.x = f.x;
  out.target.y = f.y + POSE_VIEW.aim;
  out.target.z = f.z;
  out.fov = FOLLOW.fov;
  out.lens = 0;
  return out;
}

/**
 * Le passage d'une pose, en secondes : la caméra monte vers la maison, la partie descend à sa place, on la regarde,
 * puis la caméra rejoint Kéo. Avec « Réduire les animations », la partie est posée d'un coup, la caméra coupe sur la
 * maison puis revient (`still`).
 */
export const POSE_SECONDS = { rise: 0.9, drop: 0.7, look: 1.1, back: 0.9, still: 1.6 } as const;
/** D'où descend la partie qui se pose, en unités au-dessus de sa place. */
export const POSE_DROP = 1.6;
