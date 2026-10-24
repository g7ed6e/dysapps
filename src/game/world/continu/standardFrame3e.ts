// Le repère et le plan du Standard (./standard3e.ts) : ses couleurs, son repère (la salle regarde l'est-sud-est, `FACING`,
// tout se dessine dans son repère, tourné d'un bloc), les mesures de la salle, de son auvent, du tableau, des lampes, du
// bureau et du premier poteau, ce que la ruine couche au sol, le chemin, la lanterne du chemin, l'herbe sèche ; le pied
// de la salle et son plancher. Ce que partagent la salle (./standard3e.ts) et la ligne des poteaux
// (./standardLine3e.ts). Code pur.
import { drawPosed, type FacetBuilder } from './facets';
import type { Vec2 } from './geometry';
import { site3e } from './place3eKit';
import { once } from './place4eKit';

/**
 * Les couleurs propres au Standard : le creux d'une douille, un brun d'ombre (jamais presque noir) ; les trois cordons ;
 * le fil des poteaux, un gris fer froid ; le verre des isolateurs ; la veste de la télégraphiste.
 */
export const C = {
  hollow: 0x5c5650,
  cords: [0x9a5a48, 0xb8a582, 0x6f8a8a] as const,
  wire: 0x585b5a,
  glass: 0xa9bccc,
  coat: 0x5f7f86,
} as const;

// ---------- Le repère du lieu ----------

export const SITE = site3e('standard');

/** Le cap où regarde la façade (en degrés depuis le nord) : l'est-sud-est, vers la porte ; la vue d'arrivée regarde à 297°. */
export const FACING = 117;
const TURN = ((FACING - 180) * Math.PI) / 180;
/** Le lacet du repère de la salle (`drawPosed`) : son `x` vers la droite de qui regarde la façade, son `z` vers le devant. */
export const YAW = -TURN;

/** Un point du repère de la salle dans le repère du lieu. */
export const local = (x: number, z: number): Vec2 => ({
  x: x * Math.cos(TURN) - z * Math.sin(TURN),
  z: x * Math.sin(TURN) + z * Math.cos(TURN),
});

/** Le sol sous un point du repère de la salle. */
export const groundAt = (x: number, z: number): number => {
  const p = local(x, z);
  return SITE.ground(p.x, p.z);
};

/** Dessine dans le repère de la salle. */
export const posed = (b: FacetBuilder, draw: (l: FacetBuilder) => void): void => drawPosed(b, { x: 0, y: 0, z: 0, yaw: YAW }, draw);

/**
 * La salle : de `x0` à `x1` le long de la façade, de `z0` (le dos) à `z1` (la façade) ; l'épaisseur et la hauteur de ses
 * murs ; son socle ; son toit (débord, hauteur du faîte, part enneigée) ; la grande baie de la façade, ouverte.
 */
export const ROOM = {
  x0: -4.0,
  x1: 4.0,
  z0: -3.8,
  z1: -0.5,
  wall: 0.35,
  h: 3.3,
  plinth: 0.3,
  eave: 0.3,
  ridge: 1.6,
  snow: 0.3,
  bay: { x0: -2.8, x1: 2.8, h: 3.0 },
} as const;

/** L'auvent contre la façade : son bord, la hauteur de son toit au mur et au bord, ses deux poteaux. */
export const AWNING = { x0: -4.2, x1: 4.2, z1: 0.5, wallY: 3.3, edgeY: 3.15, posts: [-3.9, 3.9] as const, post: 0.18 } as const;

/** Le tableau à fiches, contre le mur du fond : son milieu, sa largeur, son bas et son haut ; ses rangs de douilles. */
export const BOARD = { x: 0, w: 3.4, y0: 0.55, y1: 1.85, rows: [0.95, 1.28, 1.6] as const, cols: 9 } as const;

/** La rangée des lampes témoins, au-dessus du tableau : leur hauteur, leur taille, leurs places. */
export const LAMPS = { y: 1.9, s: 0.28, xs: [-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5] as const } as const;

/** Le bureau devant le tableau : son milieu, sa largeur, sa profondeur, sa hauteur. */
export const DESK = { x: 0, w: 2.8, d: 0.6, h: 0.78 } as const;

/** Le premier poteau, à droite de la salle, d'où les fils partent vers le Fanal ; sa hauteur et sa traverse. */
export const POLE = { x: 6.6, z: -2.4, h: 5.0, arm: 1.2 } as const;

/** Le tableau couché (la ruine), devant la salle, à droite ; la moitié gauche du pan avant tombée, à gauche. */
export const FALLEN_BOARD = { x: 2.0, z: 2.4 } as const;
/**
 * Le pan avant tombé, en deux morceaux : l'un couché devant la salle, à gauche, l'ardoise vers la porte (`flat`) ; l'autre
 * debout contre le trumeau gauche, son dessous de bois et ses trois chevrons tournés vers la porte (`leaning`).
 */
export const FALLEN_PAN = {
  flat: { x0: -4.6, x1: -1.4, back: 1.3, front: 3.1, lift: 0.55 },
  leaning: { x0: -4.9, x1: -3.0, foot: 1.2, top: 2.3 },
} as const;

/** Le chemin de pierre claire, du devant de l'auvent vers la porte du lieu ; la lanterne du chemin, à sa droite. */
export const ALLEY = { x: 0, half: 0.85, end: 7.6 } as const;
export const PATH_LANTERN = { x: 2.0, z: 5.4, h: 1.4 } as const;

/** L'herbe sèche de la ruine, au pied de la salle. */
export const DRY = [
  { x: -4.6, z: 2.8, s: 1 },
  { x: 5.0, z: -0.4, s: 0.9 },
  { x: -5.0, z: -2.8, s: 0.85 },
  { x: 2.0, z: 6.4, s: 0.8 },
] as const;

/** Le pied de la salle : le plus bas du sol sous ses coins et le bord de son auvent. */
export const base = once(() => Math.min(...[ROOM.x0, ROOM.x1].flatMap((x) => [ROOM.z0, AWNING.z1].map((z) => groundAt(x, z)))) - 0.05);

/** Le plancher : le dessus du socle, sous la salle et son auvent. */
export const floor = (): number => base() + ROOM.plinth;
