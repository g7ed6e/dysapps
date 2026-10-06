// « Annuler » et ↶ dans le mode « Aménager » (GD-9) : un instantané pris à l'entrée dans le mode (« Modifier le plan »)
// et une pile des poses. Chaque pose (un lieu, un Gardien, une borne, une arrivée, une liaison reposée, une réunion)
// empile le monde d'avant ; ↶ le reprend ; « Annuler » revient à l'instantané et ferme le mode (décision du mainteneur,
// 6 octobre 2026). Seules la disposition et les liaisons reposées reviennent : une liaison payée entre-temps reste (rien
// ne se perd). Code pur, sans Three.js.
import type { World } from '../engine/state';

/** Ce qu'une pose change dans le monde : la disposition et les liaisons (une liaison reposée change d'identifiant). */
type Arrangement = Pick<World, 'links' | 'layout'>;

/** Le mode « Aménager » ouvert : le monde à l'entrée, la pile des poses, les liaisons nées d'une pose. */
export interface ArrangeSession {
  readonly entry: Arrangement;
  /** Le monde d'avant chaque pose, du plus ancien au plus récent. */
  readonly undo: readonly Arrangement[];
  /** Les liaisons apparues par une pose (une liaison reposée entre deux autres lieux) : elles repartent quand on revient. */
  readonly added: readonly string[];
}

const arrangement = (w: World): Arrangement => ({ links: w.links, ...(w.layout ? { layout: w.layout } : {}) });

/** Entre dans le mode : l'instantané du monde. */
export function startArranging(world: World): ArrangeSession {
  return { entry: arrangement(world), undo: [], added: [] };
}

/** Une pose faite (le monde d'avant, le monde d'après) : elle s'empile. */
export function recordPose(session: ArrangeSession, before: World, after: World): ArrangeSession {
  const nouvelles = after.links.filter((id) => !before.links.includes(id) && !session.added.includes(id));
  return { ...session, undo: [...session.undo, arrangement(before)], added: [...session.added, ...nouvelles] };
}

/** Le monde revenu à un arrangement : sa disposition, ses liaisons, plus celles posées entre-temps hors du mode. */
function restore(session: ArrangeSession, world: World, to: Arrangement): World {
  const gardees = world.links.filter((id) => !session.added.includes(id) && !to.links.includes(id));
  const { layout: _actuelle, ...reste } = world;
  return { ...reste, links: [...to.links, ...gardees], ...(to.layout ? { layout: to.layout } : {}) };
}

/** Y a-t-il une pose à défaire (↶) ? */
export function canUndo(session: ArrangeSession): boolean {
  return session.undo.length > 0;
}

/** ↶ : défait la dernière pose ; `null` s'il n'y en a pas. */
export function undoLast(session: ArrangeSession, world: World): { world: World; session: ArrangeSession } | null {
  const avant = session.undo[session.undo.length - 1];
  if (!avant) return null;
  return { world: restore(session, world, avant), session: { ...session, undo: session.undo.slice(0, -1) } };
}

/** Quelque chose a-t-il bougé depuis l'entrée dans le mode ? */
export function hasChanged(session: ArrangeSession, world: World): boolean {
  return JSON.stringify(arrangement(world).layout ?? null) !== JSON.stringify(session.entry.layout ?? null) || world.links.some((id) => session.added.includes(id));
}

/** « Annuler » : tout ce qui a bougé depuis l'entrée dans le mode revient (la session rendue garde ↶ pour le défaire). */
export function resetToEntry(session: ArrangeSession, world: World): { world: World; session: ArrangeSession } {
  if (!hasChanged(session, world)) return { world, session };
  return { world: restore(session, world, session.entry), session: { ...session, undo: [...session.undo, arrangement(world)] } };
}
