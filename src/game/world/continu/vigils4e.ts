// Les veillées du 4e (GD-23, GD-27, lot 3 bis ; le cadre commun : ./levelVigils.ts) : l'arrivée et le départ cadrent le
// feu du 4e, la gueule du fourneau de la Forge, aux Fabriques (décision du directeur artistique du 30 octobre 2026 : le
// feu arrive par la rigole, il s'allume avec les abords, la dernière partie, par la restauration de la Forge qui existe
// déjà). La Forge est loin de la Crique : la veillée commence par une coupe (`travel` nul, sous le voile du fondu), puis
// glisse vers le fourneau, sa gueule face au sud. Deux plans, le regard à peine sous l'horizon. Le départ commence par
// la lueur du niveau d'avant (GD-27, lot 5, « la chaîne des feux ») : depuis le quai de la Crique, la caméra glisse
// autour de Kéo et se pose sur la lanterne du Sémaphore, en tête d'une Aiguille sur l'horizon du sud (crique4e.ts,
// `SEMAPHORE_LIGHT_4E`), nommée par son icône et son nom ; puis, sous le voile, elle coupe sur la Forge. Code pur.
import { followPose } from './camera';
import { stageComplete } from './construction';
import { SEMAPHORE_LIGHT_4E } from './crique4e';
import type { Vec3 } from './geometry';
import type { LevelVigils } from './levelVigils';
import { CRIQUE_LEVEL, DEPARTURE_4E, fromPlan4e } from './plan4e';
import { glanceFirst, type Vigil, type VigilShot } from './vigil';

/** La Forge dans le monde (son point du plan, plan4e.ts `PLACE_SPECS`) : son centre au sol (vers 1), le fourneau au nord du centre, 9,5 de haut, sa gueule au sud. */
export const FORGE_4E = { center: fromPlan4e([1000, 545]), ground: 1, furnace: { z: -1, top: 10.5 } } as const;

const TIMES = { hold: 4, near: 6, read: 5 } as const;
const STILL = 8;

const shot = (position: Vec3, target: Vec3, travel: number, hold: number) => ({ position, target, travel, hold });

/** Le regard sur la Forge, depuis le sud-ouest : la cour entière et le fourneau, puis le fourneau de plus près, sa gueule au milieu de l'image. */
export const FORGE_VIGIL_4E: Vigil = {
  shots: [
    shot({ x: FORGE_4E.center.x - 12, y: 13, z: FORGE_4E.center.z + 46 }, { x: FORGE_4E.center.x, y: 2.5, z: FORGE_4E.center.z }, 0, TIMES.hold),
    shot({ x: FORGE_4E.center.x - 4, y: 8, z: FORGE_4E.center.z + 27 }, { x: FORGE_4E.center.x, y: 3, z: FORGE_4E.center.z - 1 }, TIMES.near, TIMES.read),
  ],
  still: STILL,
};

/** Le coup d'œil à la lueur : glisser depuis Kéo, puis la tenir, la lanterne un peu au-dessus du milieu de l'image (Kéo se lit au bas) ; le Sémaphore nommé une fois posé. */
const GLANCE = { travel: 4, hold: 3, below: 12 } as const;

/**
 * La lanterne du Sémaphore, vue du quai de la Crique : la caméra qui suit, tournée vers elle (son pied derrière Kéo, du
 * côté opposé), le regard posé sur la lanterne, au milieu de l'image, sur l'horizon du sud.
 */
export const SEMAPHORE_GLANCE_4E: VigilShot = (() => {
  const keo = { x: DEPARTURE_4E.at.x, y: CRIQUE_LEVEL, z: DEPARTURE_4E.at.z };
  const yaw = Math.atan2(-(SEMAPHORE_LIGHT_4E.x - keo.x), -(SEMAPHORE_LIGHT_4E.z - keo.z));
  const { position } = followPose(keo, 0, undefined, yaw);
  // Le regard vise `below` sous la lanterne : elle monte vers 45 % du haut de l'image, Kéo paraît au bas (directeur artistique).
  return { position, target: { x: SEMAPHORE_LIGHT_4E.x, y: SEMAPHORE_LIGHT_4E.y - GLANCE.below, z: SEMAPHORE_LIGHT_4E.z }, travel: GLANCE.travel, hold: GLANCE.hold };
})();

/** Le départ : la lanterne du Sémaphore d'abord, puis la Forge telle qu'elle est. */
export const DEPARTURE_VIGIL_4E: Vigil = glanceFirst(SEMAPHORE_GLANCE_4E, FORGE_VIGIL_4E);

/** Les veillées du 4e : la Forge (ses abords l'allument) à l'arrivée, et au départ après la lanterne du Sémaphore ; personne n'embarque, l'équipage est complet. */
export const VIGILS_4E: LevelVigils = {
  fire: 'forge',
  fireLit: (parts) => stageComplete(parts, 2),
  fireVigil: FORGE_VIGIL_4E,
  boarding: null,
  departure: true,
  beyond: { place: 'semaphore', shown: GLANCE.travel, until: GLANCE.travel + GLANCE.hold, vigil: DEPARTURE_VIGIL_4E },
};
