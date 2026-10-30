// Les veillées du 4e (GD-23, GD-27, lot 3 bis ; le cadre commun : ./levelVigils.ts) : l'arrivée et le départ cadrent le
// feu du 4e, la gueule du fourneau de la Forge, aux Fabriques (décision du directeur artistique du 30 octobre 2026 : le
// feu arrive par la rigole, il s'allume avec les abords, la dernière partie, par la restauration de la Forge qui existe
// déjà). La Forge est loin de la Crique : la veillée commence par une coupe (`travel` nul, sous le voile du fondu), puis
// glisse vers le fourneau, sa gueule face au sud. Deux plans, le regard à peine sous l'horizon. Code pur.
import { stageComplete } from './construction';
import type { Vec3 } from './geometry';
import type { LevelVigils } from './levelVigils';
import { fromPlan4e } from './plan4e';
import type { Vigil } from './vigil';

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

/** Les veillées du 4e : la Forge (ses abords l'allument) à l'arrivée et au départ ; personne n'embarque, l'équipage est complet. */
export const VIGILS_4E: LevelVigils = {
  fire: 'forge',
  fireLit: (parts) => stageComplete(parts, 2),
  fireVigil: FORGE_VIGIL_4E,
  boarding: null,
  departure: true,
};
