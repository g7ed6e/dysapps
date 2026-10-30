// Les veillées du 3e (GD-23, GD-27, lot 3 bis ; le cadre commun : ./levelVigils.ts) : l'arrivée cadre le feu du 3e, le
// Fanal, au Cirque (décision du directeur artistique du 30 octobre 2026 : allumé avec son haut, la lanterne et ses vitres,
// l'or blanc de GD-25). Le Fanal est loin du Parvis : la veillée commence par une coupe (`travel` nul, sous le voile du
// fondu), puis glisse vers la tour. Au 3e, la vue finale de GD-25 tient lieu de départ : aucune veillée de départ. Code pur.
import { stageComplete } from './construction';
import type { Vec3 } from './geometry';
import type { LevelVigils } from './levelVigils';
import type { Vigil } from './vigil';

/** Le plan du 3e en unités du monde (plan3e.ts, `fromPlan3e`, que le plan garde pour lui) et le point du Fanal (`PLACE_SPECS`). */
const PLAN_3E = { scale: 3.6, origin: { x: 1100, y: 640 } } as const;
const fanalPlan = [985, 175] as const;

/** Le Fanal dans le monde : son centre au sol (vers 1,5), sa tour de 4,6 à 17, sa lanterne au-dessus. */
export const FANAL_3E = { center: { x: (fanalPlan[0] - PLAN_3E.origin.x) / PLAN_3E.scale, z: (fanalPlan[1] - PLAN_3E.origin.y) / PLAN_3E.scale }, ground: 1.5, tower: { z: -1, top: 19 } } as const;

const TIMES = { hold: 4, near: 6, read: 5 } as const;
const STILL = 8;

const shot = (position: Vec3, target: Vec3, travel: number, hold: number) => ({ position, target, travel, hold });

/** Le regard sur le Fanal, depuis le sud-est, au-dessus du Cirque : le socle et la tour entière, puis la tour de plus près, sa lanterne dans le tiers haut. */
export const FANAL_VIGIL_3E: Vigil = {
  shots: [
    shot({ x: FANAL_3E.center.x + 14, y: 20, z: FANAL_3E.center.z + 46 }, { x: FANAL_3E.center.x, y: 9, z: FANAL_3E.center.z - 1 }, 0, TIMES.hold),
    shot({ x: FANAL_3E.center.x + 5, y: 16, z: FANAL_3E.center.z + 28 }, { x: FANAL_3E.center.x, y: 11, z: FANAL_3E.center.z - 1 }, TIMES.near, TIMES.read),
  ],
  still: STILL,
};

/** Les veillées du 3e : le Fanal (son haut l'allume), l'embarquement ; le départ est la vue finale. */
export const VIGILS_3E: LevelVigils = {
  fire: 'fanal',
  fireLit: (parts) => stageComplete(parts, 1),
  fireVigil: FANAL_VIGIL_3E,
  boarding: null,
  departure: false,
};
