// La salle des trophées qui s'agrandit (GD-3, décidée par le mainteneur le 1er octobre 2026, option B) : plus aucun
// trophée sur le toit. La salle de départ (4 × 3 cases) garde 12 places sous son toit, six socles sur deux rangs ; tous
// les six succès suivants, une travée de 2 × 3 cases s'ajoute à sa gauche, avec ses piliers, son pan de toit dans le
// prolongement du faîte d'or, son fond de velours et ses trois socles sur deux rangs, jusqu'à 8 × 3 avec 24 succès.
// L'emprise de 8 × 3 est réservée dès le départ (world/terrain.ts : `TROPHY_AT`, `TROPHY_SIZE`) : du sol nu, sans
// dalle ni marque, jusqu'à l'arrivée de la travée. Code pur, sans Three.js ni dépendance : les kits d'Archipéo
// (./architecture/kits) y lisent les piliers.
import type { BlockId } from '../biomes';
import { BLOC } from '../biomes';

/** L'emprise réservée de la salle : 8 cases de large (x), 3 de profondeur (y), ouverte devant (y = 0, côté caméra). */
export const EMPRISE_DE_LA_SALLE = { w: 8, d: 3 } as const;
/** La salle de départ dans l'emprise : à droite, de x = 4 à 7 ; sa porte ne bouge pas. */
export const SALLE_DE_DEPART = { x: 4, w: 4 } as const;
/** Une travée : 2 cases de large, toute la profondeur ; la première de x = 2 à 3, la seconde de x = 0 à 1. */
const LARGEUR_D_UNE_TRAVEE = 2;
/** Les places sous le toit de la salle de départ (six socles, deux rangs), puis de chaque travée (trois socles, deux rangs). */
export const PLACES_DE_LA_SALLE = 12;
export const PLACES_PAR_TRAVEE = 6;
/** Les travées que l'emprise peut recevoir : 8 × 3 est un plafond (à gauche, le cœur de l'île s'arrête). */
export const TRAVEES_AU_PLUS = (EMPRISE_DE_LA_SALLE.w - SALLE_DE_DEPART.w) / LARGEUR_D_UNE_TRAVEE;

/** Le bord gauche de la travée `k` (1, 2) dans l'emprise : la colonne de ses piliers. */
const bordDeLaTravee = (k: number) => SALLE_DE_DEPART.x - LARGEUR_D_UNE_TRAVEE * k;

/** Le nombre de travées posées pour `n` trophées : une dès le 13e, une autre dès le 19e. */
export function traveesPour(n: number): number {
  return Math.min(TRAVEES_AU_PLUS, Math.max(0, Math.ceil((n - PLACES_DE_LA_SALLE) / PLACES_PAR_TRAVEE)));
}

/** La première colonne bâtie de l'emprise avec `travees` travées (4 sans travée, 0 avec les deux). */
const debutDeLaSalle = (travees: number): number => bordDeLaTravee(travees);

/**
 * Les colonnes des piliers dans l'emprise, de droite à gauche : les deux bouts de la salle de départ (7 et 4), puis le
 * bord gauche de chaque travée (2, puis 0). Un pilier se tient devant (y = 0) et au fond (y = d - 1) de sa colonne.
 */
export const COLONNES_DES_PILIERS: readonly number[] = [
  SALLE_DE_DEPART.x + SALLE_DE_DEPART.w - 1,
  SALLE_DE_DEPART.x,
  ...Array.from({ length: TRAVEES_AU_PLUS }, (_, i) => bordDeLaTravee(i + 1)),
];

/** Une case de l'emprise porte-t-elle un pilier (s'il est bâti) ? */
export const estUnPilier = (x: number, y: number, d: number = EMPRISE_DE_LA_SALLE.d): boolean => COLONNES_DES_PILIERS.includes(x) && (y === 0 || y === d - 1);

/** Les socles de la salle de départ, dans l'ordre où ils se remplissent (relatifs à son coin) : devant au milieu, puis le rang du fond. */
const SOCLES_DE_LA_SALLE: readonly (readonly [number, number])[] = [
  [1, 0],
  [2, 0],
  [1, 1],
  [2, 1],
  [0, 1],
  [3, 1],
];

/** Les socles d'une partie de la salle dans l'emprise : la salle de départ (k = 0) ou la travée k (devant, puis au fond). */
function soclesDe(k: number): [number, number][] {
  if (k === 0) return SOCLES_DE_LA_SALLE.map(([x, y]) => [SALLE_DE_DEPART.x + x, y]);
  const b = bordDeLaTravee(k);
  return [
    [b + 1, 0],
    [b, 1],
    [b + 1, 1],
  ];
}

/**
 * Les places des trophées dans l'emprise, dans l'ordre où elles se remplissent (l'ordre de la liste des succès) : les six
 * socles de la salle de départ (inchangés), puis leur second rang ; puis, pour chaque travée, ses trois socles et leur
 * second rang. Toutes sous le toit (z = 2 et 3 ; le toit est à z = 4).
 */
export const TROPHY_SLOTS: readonly { x: number; y: number; z: number }[] = Array.from({ length: TRAVEES_AU_PLUS + 1 }, (_, k) => k).flatMap((k) =>
  [2, 3].flatMap((z) => soclesDe(k).map(([x, y]) => ({ x, y, z }))),
);

const CLES_DES_PLACES = new Set(TROPHY_SLOTS.map(({ x, y, z }) => `${x},${y},${z}`));
/** La case (x, y, z) de l'emprise (z = 1 au-dessus du sol) est-elle la place d'un trophée ? */
export const estUnePlaceDeTrophee = (x: number, y: number, z: number): boolean => CLES_DES_PLACES.has(`${x},${y},${z}`);

export type CubeDeLaSalle = { x: number; y: number; z: number; block: BlockId };

/**
 * La salle des trophées (coordonnées relatives au coin de l'emprise, z = 1 au-dessus du sol) pour `trophies` (le bloc de
 * chaque succès gagné, dans l'ordre des succès) : un pavillon ouvert devant, des piliers de marbre, un fond de velours
 * rouge, des socles de marbre, un toit de pierre de taille au faîte d'or, et autant de travées qu'il en faut. Tout en
 * cubes entiers, dans les matières d'avant (marbre, velours, pierre de taille, or) ; le faîte au même rang. Un trophée
 * de trop (au-delà des places) n'est pas posé : un test vérifie que chaque succès a sa place.
 */
export function modeleDeLaSalle(trophies: readonly BlockId[] = []): CubeDeLaSalle[] {
  const out: CubeDeLaSalle[] = [];
  const { w, d } = EMPRISE_DE_LA_SALLE;
  const x0 = debutDeLaSalle(traveesPour(Math.min(trophies.length, TROPHY_SLOTS.length)));
  for (let x = x0; x < w; x++)
    for (let y = 0; y < d; y++) {
      if (estUnPilier(x, y, d)) for (let z = 1; z <= 3; z++) out.push({ x, y, z, block: BLOC.marbre });
      else if (y === d - 1) for (let z = 1; z <= 3; z++) out.push({ x, y, z, block: BLOC.velours });
      else out.push({ x, y, z: 1, block: BLOC.marbre });
    }
  for (let x = x0; x < w; x++) for (let y = 0; y < d; y++) out.push({ x, y, z: 4, block: BLOC.taille });
  for (let x = x0; x < w; x++) out.push({ x, y: (d - 1) / 2, z: 5, block: BLOC.or });
  trophies.slice(0, TROPHY_SLOTS.length).forEach((block, i) => out.push({ ...TROPHY_SLOTS[i], block }));
  return out;
}
