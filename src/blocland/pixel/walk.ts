// La marche libre de la 2D, en calcul pur : un pas d'une case dans une direction, s'il est possible. On marche sur le
// sol (jamais sur l'eau ni la lave), on ne monte ou ne descend que d'un bloc à la fois, et on ne traverse ni un arbre,
// ni un rocher, ni un panneau, ni une créature. Rien n'est chronométré : chaque pas attend le geste suivant.
import type { Cell } from '../world/view';
import type { Prop, Station } from './props';
import type { Surface } from './surface';

/** Les directions de la croix : x vers l'est, y vers le nord (le haut de l'écran). */
export const STEPS = { up: [0, 1], down: [0, -1], left: [-1, 0], right: [1, 0] } as const;
export type StepDir = keyof typeof STEPS;

/** Le décor qu'on enjambe (bas, au ras du sol) ; le reste barre le passage. */
const LOW: ReadonlySet<string> = new Set(['fleur', 'champignon', 'roseau']);

/** Les cases où l'on ne peut pas se tenir : le pied des arbres, rochers, buissons…, les panneaux, les créatures. */
export function blockedCells(props: Prop[], stations: Station[], creatures: { x: number; y: number }[] = []): Set<string> {
  const out = new Set<string>();
  for (const p of props) if (!LOW.has(p.kind)) out.add(`${p.x},${p.y}`);
  for (const s of stations) out.add(`${s.x},${s.y}`);
  for (const c of creatures) out.add(`${Math.floor(c.x)},${Math.floor(c.y)}`);
  return out;
}

/**
 * La case d'arrivée d'un pas (`z` : la hauteur des pieds, un bloc au-dessus du sol), ou `null` si le pas est
 * impossible : pas de sol, de l'eau ou de la lave, une case occupée, une marche de plus d'un bloc.
 */
export function stepFrom(surface: Surface, blocked: Set<string>, from: Cell, dir: StepDir): Cell | null {
  const [dx, dy] = STEPS[dir];
  const x = Math.round(from.x) + dx;
  const y = Math.round(from.y) + dy;
  const col = surface.get(`${x},${y}`);
  if (!col || col.material === 'eau' || col.material === 'lave') return null;
  if (blocked.has(`${x},${y}`)) return null;
  const z = col.z + 1;
  if (Math.abs(z - from.z) > 1) return null;
  return { x, y, z };
}

/** La case juste devant le bonhomme, dans la direction où il regarde. */
export function cellAhead(at: Cell, dir: StepDir): { x: number; y: number } {
  const [dx, dy] = STEPS[dir];
  return { x: Math.round(at.x) + dx, y: Math.round(at.y) + dy };
}
