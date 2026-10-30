// Les veillées du 5e (GD-23, GD-27, lot 3 bis ; le cadre commun : ./levelVigils.ts) : l'arrivée et le départ cadrent le
// feu du 5e, la lanterne de tête du mât du Sémaphore, sur la dernière terre, les Aiguilles (décision du directeur
// artistique du 30 octobre 2026 : allumée dès que le haut du Sémaphore est posé, comme la lanterne du Phare). Le
// Sémaphore est à l'autre bout du niveau depuis la Lisière : la veillée commence par une coupe (`travel` nul, sous le
// voile du fondu), puis glisse de l'îlot du plateau à la tour. L'embarquement cadre les Fumerolles, le lieu de SVT des
// Contreforts, rallumées sous les yeux de l'élève : le naturaliste y monte à bord (décision du directeur artistique du
// 30 octobre 2026 ; GD-19 : le cinquième ado de l'équipage), depuis le sud-ouest, du côté du chemin de dalles, la caméra
// glisse depuis Kéo. Deux plans par veillée, le regard à peine sous l'horizon. Code pur.
import { stageComplete } from './construction';
import type { Vec3 } from './geometry';
import type { LevelVigils } from './levelVigils';
import { fromPlan5e } from './plan5e';
import type { Vigil } from './vigil';

/** Le Sémaphore dans le monde (son point du plan, plan5e.ts `PLACE_SPECS`) : son centre au sol (le plateau, vers 12,8), la cour (13,3), le haut du mât (28,8), à l'ouest de la tour. */
export const SEMAPHORE_5E = { center: fromPlan5e([420, 240]), ground: 12.8, court: 13.3, mast: { x: -2.9, z: -2.3, top: 28.8 } } as const;

/** Les Fumerolles dans le monde : leur centre au sol (les Contreforts, vers 2,4), la margelle au nord-ouest du centre, la dalle de relevé au sud. */
export const FUMEROLLES_5E = { center: fromPlan5e([400, 520]), ground: 2.4, margelle: { x: 0.6, z: -5.6, r: 4.6 } } as const;

/** Les secondes : le premier plan tenu, puis glisser vers le second et le tenir (la ligne) ; en glissant depuis Kéo (`glide`), des plans plus courts. */
const TIMES = { hold: 4, near: 6, read: 5, glide: 5, glance: 3 } as const;
const STILL = 8;

const shot = (position: Vec3, target: Vec3, travel: number, hold: number) => ({ position, target, travel, hold });

/** Le premier plan, commun : depuis le sud, au-dessus du plateau, entre deux aiguilles (l'une à 19 unités à l'est du Sémaphore et 28 au sud, l'autre à 28 à l'ouest : le regard passe entre elles, aucune devant la tour), la tour et sa cour, le mât entier. */
const FAR = shot({ x: SEMAPHORE_5E.center.x - 8, y: 29, z: SEMAPHORE_5E.center.z + 46 }, { x: SEMAPHORE_5E.center.x - 2, y: 17, z: SEMAPHORE_5E.center.z - 2 }, 0, TIMES.hold);

/**
 * Le regard sur le Sémaphore éteint : le premier plan, puis la cour de plus près, depuis le sud-ouest, la tour entière et
 * le mât couché le long du mur ouest, sa lanterne au bout.
 */
export const SEMAPHORE_VIGIL_5E: Vigil = {
  shots: [FAR, shot({ x: SEMAPHORE_5E.center.x - 12, y: 20, z: SEMAPHORE_5E.center.z + 14 }, { x: SEMAPHORE_5E.center.x - 3, y: 15.5, z: SEMAPHORE_5E.center.z - 2 }, TIMES.near, TIMES.read)],
  still: STILL,
};

/**
 * Le regard sur le Sémaphore allumé : le premier plan, puis, de près et un peu à l'ouest, hors de l'axe du panache du
 * volcan, la tête du mât : sa lanterne grosse dans le tiers haut, le feu lui-même (directeur artistique, consultant
 * d'Archipéo, relecture du lot 3 bis).
 */
export const SEMAPHORE_LIT_VIGIL_5E: Vigil = {
  shots: [FAR, shot({ x: SEMAPHORE_5E.center.x - 9, y: 28.5, z: SEMAPHORE_5E.center.z + 9 }, { x: SEMAPHORE_5E.center.x - 2.9, y: 26.5, z: SEMAPHORE_5E.center.z - 2.3 }, TIMES.near, TIMES.read)],
  still: STILL,
};

/**
 * Le regard sur les Fumerolles, depuis le sud-ouest, du côté du chemin de dalles qui contourne la margelle : à mi-hauteur,
 * la margelle entière, ses trois panaches et la cabane de la sondeuse redressée derrière, à l'est (l'habitante, à sa
 * porte, reste au bord de l'image, jamais au milieu : la ligne nomme le naturaliste, pas elle) ; puis de plus près,
 * depuis l'ouest, la margelle et ses trois bouches, aucun objet coupé au premier plan (directeur artistique, relecture).
 */
export const FUMEROLLES_VIGIL_5E: Vigil = {
  shots: [
    shot({ x: FUMEROLLES_5E.center.x - 13, y: FUMEROLLES_5E.ground + 7, z: FUMEROLLES_5E.center.z + 11 }, { x: FUMEROLLES_5E.center.x + 0.5, y: FUMEROLLES_5E.ground + 1.5, z: FUMEROLLES_5E.center.z - 3.5 }, TIMES.glide, TIMES.glance),
    shot({ x: FUMEROLLES_5E.center.x - 13, y: FUMEROLLES_5E.ground + 5, z: FUMEROLLES_5E.center.z - 1 }, { x: FUMEROLLES_5E.center.x + 0.6, y: FUMEROLLES_5E.ground + 2, z: FUMEROLLES_5E.center.z - 5.6 }, TIMES.glide, TIMES.read),
  ],
  still: STILL,
};

/** Le rôle de l'équipier qui monte à bord au 5e, tel que la ligne le dit : une personne, jamais un prénom (GD-19). */
const BOARDING_5E = 'Le naturaliste';

/** Les veillées du 5e : le Sémaphore (son haut posé l'allume), le naturaliste aux Fumerolles, le départ. */
export const VIGILS_5E: LevelVigils = {
  fire: 'semaphore',
  fireLit: (parts) => stageComplete(parts, 1),
  fireVigil: SEMAPHORE_VIGIL_5E,
  fireVigilLit: SEMAPHORE_LIT_VIGIL_5E,
  boarding: { place: 'fumerolles', who: BOARDING_5E, vigil: FUMEROLLES_VIGIL_5E },
  departure: true,
};
