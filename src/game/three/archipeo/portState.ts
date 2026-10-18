// Ce que montre l'Escale, le lieu de départ du monde continu (GD-20, lot 2), tiré de la sauvegarde telle qu'elle est,
// sans champ nouveau : l'état des portes de l'école (les missions du portail jouées), les trophées (les succès gagnés,
// dans l'ordre de la liste), l'état de la région (les parties, les liaisons et les grandes constructions posées), la
// pile des blocs assemblés et la recette de l'établi. Les mêmes règles que la grille : rien ne change dans l'autre
// disposition. Sans Three.js : testé sous jsdom.
import { appsBySubject, bestScore, type Subject } from '../../../apps/registry';
import { BADGES, type Progress } from '../../../core/progress';
import { BLOCKS, type BlockId } from '../../biomes';
import type { GameState } from '../../engine';
import { trophyBlock } from '../../trophies';
import { BRIDGES, getArchipelago, islandsOf, nextArchipelago, voyageId, type ArchipelagoId } from '../../world/archipelago';
import { recetteDeLArchipel } from '../../world/assembly';
import type { DoorState, PortState, RegionDegree, TrophyAccent } from '../../world/continu/port';
import type { PortSubject } from '../../world/continu/plan6e';
import { monumentsOf } from '../../world/monuments';
import { partiesDe, partiePosee, partiesPosees } from '../../world/parts';

/**
 * L'état d'une porte de l'école : fermée tant qu'aucune mission de sa matière n'est réussie, ouverte (sa lanterne
 * allumée) après une réussite, pavoisée quand toutes ses missions ont été jouées.
 */
export function doorState(subject: Subject, apps: Progress['apps']): DoorState {
  const missions = appsBySubject(subject).filter((a) => a.status === 'disponible');
  const records = missions.map((a) => bestScore(apps, a.id));
  if (!records.some((r) => r !== undefined && r > 0)) return 'closed';
  return records.every((r) => r !== undefined) ? 'flags' : 'lit';
}

/** L'accent du trophée d'un succès : la famille de son bloc dans la grille (trophies.ts, `trophyBlock`). */
function accentOf(badgeId: string): TrophyAccent {
  const block = trophyBlock(badgeId);
  if (block === 'trophy-crystal') return 'crystal';
  if (block === 'maths-3e-statistics') return 'quartz';
  if (block === 'french-3e-close-reading') return 'lens';
  if (block === 'maths-3e-geometry') return 'marble';
  return 'gold';
}

/** Les trophées posés : un accent par succès gagné, dans l'ordre de la liste des succès (les places de la galerie). */
export function trophyAccents(badges: Progress['badges']): TrophyAccent[] {
  return BADGES.filter((b) => badges[b.id]).map((b) => accentOf(b.id));
}

/**
 * L'état de la région, en cinq degrés (docs/gameplay/index.md, « L'état de la région ») : abandonnée (aucune partie
 * posée), réactivée (une partie posée), en reconstruction (la construction du lieu de départ achevée et une liaison
 * construite qui en part), en développement (en plus, une grande construction commencée), ouverte (le passage vers la
 * région suivante fait).
 */
export function regionDegree(world: GameState['world'], region: ArchipelagoId): RegionDegree {
  const { parts, links } = world;
  const next = nextArchipelago(region);
  if (next && links.includes(voyageId(next.classe))) return 4;
  const islands = islandsOf(region).map((b) => b.id);
  if (!islands.some((id) => partiesPosees(id, parts) > 0)) return 0;
  const start = getArchipelago(region).school;
  const startDone = partiesDe(start).length > 0 && partiesDe(start).every((p) => partiePosee(p, parts));
  const linked = BRIDGES.some((b) => b.cost > 0 && (b.from === start || b.to === start) && links.includes(b.id));
  if (!startDone || !linked) return 1;
  return monumentsOf(region).some((m) => (parts[m.id]?.length ?? 0) > 0) ? 3 : 2;
}

/** Une couleur `#rrggbb` en nombre. */
const hex = (c: string) => Number.parseInt(c.slice(1), 16);

/** La recette de la région sur l'établi : la couleur de chaque bloc à donner, autant de fois qu'il en faut, et celle du bloc assemblé. */
function recipeColors(region: ArchipelagoId): { bloc: BlockId | null; pieces: number[]; made: number } {
  const r = recetteDeLArchipel(region);
  if (!r) return { bloc: null, pieces: [], made: 0xdcba86 };
  return { bloc: r.bloc, pieces: r.ingredients.flatMap((i) => Array.from({ length: i.n }, () => hex(BLOCKS[i.bloc].top))), made: hex(BLOCKS[r.bloc].top) };
}

/** Ce que montre le lieu de départ de la région `region` (au 6e, l'Escale) pour une sauvegarde : ses portes, ses trophées, l'état de la région, la pile, la recette. */
export function portState(state: GameState, progress: Progress, region: ArchipelagoId): PortState {
  const recipe = recipeColors(region);
  const door = (s: PortSubject) => doorState(s, progress.apps);
  return {
    doors: { french: door('french'), maths: door('maths'), english: door('english') },
    trophies: trophyAccents(progress.badges),
    degree: regionDegree(state.world, region),
    pile: recipe.bloc ? (state.stock[recipe.bloc] ?? 0) : 0,
    recipe: { pieces: recipe.pieces, made: recipe.made },
  };
}
