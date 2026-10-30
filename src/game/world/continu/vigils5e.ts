// Les veillées du 5e (GD-23, GD-27, lot 3 bis ; le cadre commun : ./levelVigils.ts) : l'arrivée et le départ cadrent le
// feu du 5e, la lanterne de tête du mât du Sémaphore, sur la dernière terre, les Aiguilles (décision du directeur
// artistique du 30 octobre 2026 : allumée dès que le haut du Sémaphore est posé, comme la lanterne du Phare). Le
// Sémaphore est à l'autre bout du niveau depuis la Lisière : la veillée commence par une coupe (`travel` nul, sous le
// voile du fondu), puis glisse de l'îlot du plateau à la tour. L'embarquement cadre les Fumerolles, le lieu de SVT des
// Contreforts, rallumées sous les yeux de l'élève : le naturaliste y monte à bord (décision du directeur artistique du
// 30 octobre 2026 ; GD-19 : le cinquième ado de l'équipage), depuis le sud-ouest, du côté du chemin de dalles, la caméra
// glisse depuis Kéo. Deux plans par veillée, le regard à peine sous l'horizon. Le départ commence par la lueur du
// niveau d'avant (GD-27, lot 5, « la chaîne des feux ») : depuis le quai de la Lisière, la caméra glisse autour de Kéo
// et se pose sur la lumière du Phare, au sud-est sur la mer (lisiere.ts, `PHARE_LIGHT`), nommée par son icône et son
// nom ; puis, sous le voile, elle coupe sur le Sémaphore. Code pur.
import { followPose } from './camera';
import { stageComplete } from './construction';
import type { Vec3 } from './geometry';
import type { LevelVigils } from './levelVigils';
import { PHARE_LIGHT } from './lisiere';
import { DEPARTURE_5E, LISIERE_LEVEL, fromPlan5e } from './plan5e';
import { glanceFirst, type Vigil, type VigilShot } from './vigil';

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

/** Le coup d'œil à la lueur : glisser depuis Kéo, puis la tenir ; le Phare nommé pendant ces secondes. */
const GLANCE = { travel: 4, hold: 3 } as const;

/**
 * La lumière du Phare, vue du quai de la Lisière : la caméra qui suit, tournée vers elle (son pied derrière Kéo, du
 * côté opposé), le regard posé sur la lumière, au milieu de l'image, sur la ligne où la mer rejoint le ciel.
 */
export const PHARE_GLANCE_5E: VigilShot = (() => {
  const keo = { x: DEPARTURE_5E.at.x, y: LISIERE_LEVEL, z: DEPARTURE_5E.at.z };
  const yaw = Math.atan2(-(PHARE_LIGHT.x - keo.x), -(PHARE_LIGHT.z - keo.z));
  const { position } = followPose(keo, 0, undefined, yaw);
  return { position, target: { ...PHARE_LIGHT }, travel: GLANCE.travel, hold: GLANCE.hold };
})();

/** Le départ : la lumière du Phare d'abord, puis le Sémaphore tel qu'il est. */
export const DEPARTURE_VIGIL_5E: Vigil = glanceFirst(PHARE_GLANCE_5E, SEMAPHORE_VIGIL_5E);
export const DEPARTURE_LIT_VIGIL_5E: Vigil = glanceFirst(PHARE_GLANCE_5E, SEMAPHORE_LIT_VIGIL_5E);

/** Le rôle de l'équipier qui monte à bord au 5e, tel que la ligne le dit : une personne, jamais un prénom (GD-19). */
const BOARDING_5E = 'Le naturaliste';

/** Les veillées du 5e : le Sémaphore (son haut posé l'allume), le naturaliste aux Fumerolles, le départ après la lumière du Phare. */
export const VIGILS_5E: LevelVigils = {
  fire: 'semaphore',
  fireLit: (parts) => stageComplete(parts, 1),
  fireVigil: SEMAPHORE_VIGIL_5E,
  fireVigilLit: SEMAPHORE_LIT_VIGIL_5E,
  boarding: { place: 'fumerolles', who: BOARDING_5E, vigil: FUMEROLLES_VIGIL_5E },
  departure: true,
  beyond: { place: 'phare', until: GLANCE.travel + GLANCE.hold, vigil: DEPARTURE_VIGIL_5E, vigilLit: DEPARTURE_LIT_VIGIL_5E },
};
