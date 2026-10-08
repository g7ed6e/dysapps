// Les grands projets (GD-10, mot neutre `project`, piste A choisie par le mainteneur le 8 octobre 2026) : dès la 5e, une
// grande construction se pose pièce par pièce. Chaque pièce a deux recettes au choix (des blocs de deux îles de deux
// matières, sans matière commune entre les deux recettes, jamais la LV2) et une question qui mêle ces deux matières,
// posée au chantier comme celle d'un bloc assemblé (GD-2). Bonne réponse : la pièce entière se pose d'un coup. Code pur,
// sans React ni coordonnées du monde.
//
// Les pièces, leurs recettes et leurs noms viennent de docs/contenu/projets.md, que `npm run contenu` écrit dans
// projects.json ; la forme d'une pièce (les étages du grand ouvrage qu'elle couvre) reste ici. Les règles :
// - les pièces se posent dans l'ordre, de bas en haut : une seule est à construire à la fois ;
// - rien ne se perd : les blocs ne partent qu'à la bonne réponse, et une pièce dont des cases étaient déjà posées (une
//   partie commencée case par case, avant les projets) se finit sans rien demander ;
// - la sauvegarde ne change pas : les cases posées restent dans `world.parts[<grand ouvrage>]`.
import type { BlockId } from '../biomes';
import type { GameState } from '../engine/state';
import type { UniversNomme } from './assembly';
import { getMonument } from './monuments';
import { planCells } from './plans';
import PROJECTS_JSON from './projects.json';

export interface ProjectRecipe {
  /** Deux blocs d'îles de l'archipel, de deux matières. */
  ingredients: { bloc: BlockId; n: number }[];
  /** La banque de questions : celle d'un bloc assemblé (`compound-5e`) ou une banque de projets (`project-…`). */
  bank: string;
}

interface ProjectPiece {
  id: string;
  /** Deux recettes au choix, sans matière commune. */
  recipes: [ProjectRecipe, ProjectRecipe];
  /** Son nom dans chaque univers, avec l'article (« la lanterne »). */
  names: Record<UniversNomme, string>;
}

export interface Project {
  /** Le grand ouvrage (`landmark-5e-1`). */
  monument: string;
  /** Les pièces, de bas en haut, dans l'ordre où elles se posent. */
  pieces: ProjectPiece[];
}

export const PROJECTS = PROJECTS_JSON as Project[];

/**
 * La forme des pièces : les étages (z, dans le dessin du grand ouvrage) que chacune couvre, du plus bas au plus haut.
 * Le phare du large : le socle de glace, la tour rayée, la galerie de lambris, la lanterne de vitraux, le toit.
 */
const LAYERS: Record<string, Record<string, readonly [number, number]>> = {
  'landmark-5e-1': {
    base: [0, 0],
    tower: [1, 6],
    gallery: [7, 7],
    lantern: [8, 8],
    roof: [9, 10],
  },
};

/** Le projet d'un grand ouvrage, s'il en est un. */
export function projectOf(monument: string): Project | undefined {
  return PROJECTS.find((p) => p.monument === monument);
}

/** Les banques de questions de projets (`project-…`), dont le tirage se garde comme celui d'un bloc assemblé. */
export const PROJECT_BANKS: readonly string[] = [...new Set(PROJECTS.flatMap((p) => p.pieces.flatMap((x) => x.recipes.map((r) => r.bank))))];

/** Les cases d'une pièce (avec leur clé de sauvegarde), dans l'ordre du dessin. */
export function pieceCells(project: Project, index: number): ReturnType<typeof planCells>[number][] {
  const monument = getMonument(project.monument);
  const piece = project.pieces[index];
  const layers = piece && LAYERS[project.monument]?.[piece.id];
  if (!monument || !layers) return [];
  const all = planCells(monument);
  return monument.cells.flatMap((c, i) => (c.z >= layers[0] && c.z <= layers[1] ? [all[i]] : []));
}

export type PieceState = 'built' | 'started' | 'todo';

/** Une pièce : posée en entier, commencée (des cases posées case par case, avant les projets) ou à faire. */
export function pieceState(state: Pick<GameState, 'world'>, project: Project, index: number): PieceState {
  const done = new Set(state.world.parts[project.monument] ?? []);
  const cells = pieceCells(project, index);
  const n = cells.filter((c) => done.has(c.key)).length;
  return n === cells.length ? 'built' : n > 0 ? 'started' : 'todo';
}

/** La pièce à construire : la première qui n'est pas posée en entier ; `null` quand le projet est fini. */
export function nextPiece(state: Pick<GameState, 'world'>, project: Project): number | null {
  const i = project.pieces.findIndex((_, k) => pieceState(state, project, k) !== 'built');
  return i < 0 ? null : i;
}

/** Combien de pièces sont posées en entier. */
export function piecesBuilt(state: Pick<GameState, 'world'>, project: Project): number {
  return project.pieces.filter((_, k) => pieceState(state, project, k) === 'built').length;
}

/** Le stock paie-t-il cette recette ? */
export function canPay(stock: Partial<Record<BlockId, number>>, recipe: ProjectRecipe): boolean {
  return recipe.ingredients.every((i) => (stock[i.bloc] ?? 0) >= i.n);
}

/** Ce que la pièce à construire coûte encore : rien si elle est commencée, sinon les blocs de la recette. */
export function pieceIsFree(state: Pick<GameState, 'world'>, project: Project, index: number): boolean {
  return pieceState(state, project, index) === 'started';
}

export type BuildPieceResult =
  | { state: GameState; ok: true; completed: boolean }
  | {
      state: GameState;
      ok: false;
      reason: 'pas-la-suivante' | 'plus-de-blocs';
    };

/**
 * Pose la pièce à construire en entier : ses blocs sortent du stock (rien pour une pièce commencée), toutes ses cases
 * entrent dans `world.parts`. `recipe` : celle que l'élève a choisie (ignorée pour une pièce commencée). `completed` :
 * c'était la dernière pièce, le grand ouvrage est fini.
 */
export function buildPiece(state: GameState, project: Project, index: number, recipe: number): BuildPieceResult {
  if (nextPiece(state, project) !== index) return { state, ok: false, reason: 'pas-la-suivante' };
  const stock = { ...state.stock };
  if (!pieceIsFree(state, project, index)) {
    const r = project.pieces[index].recipes[recipe];
    if (!r || !canPay(stock, r)) return { state, ok: false, reason: 'plus-de-blocs' };
    for (const i of r.ingredients) stock[i.bloc] = (stock[i.bloc] ?? 0) - i.n;
  }
  const done = state.world.parts[project.monument] ?? [];
  const parts = [
    ...done,
    ...pieceCells(project, index)
      .map((c) => c.key)
      .filter((k) => !done.includes(k)),
  ];
  const next: GameState = {
    ...state,
    stock,
    world: {
      ...state.world,
      parts: { ...state.world.parts, [project.monument]: parts },
    },
  };
  return {
    state: next,
    ok: true,
    completed: nextPiece(next, project) === null,
  };
}

/**
 * Les blocs que demande encore la pièce à construire, comme `planStatus(…).missing` pour un plan posé case par case :
 * ceux de la recette que le stock couvre le mieux (`both` : des deux recettes, chacun au plus fort), rien pour une pièce
 * commencée ou un projet fini.
 */
export function projectNeeds(state: Pick<GameState, 'world' | 'stock'>, project: Project, both = false): Partial<Record<BlockId, number>> {
  const index = nextPiece(state, project);
  if (index === null || pieceIsFree(state, project, index)) return {};
  const covered = (r: ProjectRecipe) => r.ingredients.reduce((sum, i) => sum + Math.min(i.n, state.stock[i.bloc] ?? 0) / i.n, 0);
  const [a, b] = project.pieces[index].recipes;
  const recipes = both ? [a, b] : [covered(b) > covered(a) ? b : a];
  const needs: Partial<Record<BlockId, number>> = {};
  for (const r of recipes) for (const i of r.ingredients) needs[i.bloc] = Math.max(needs[i.bloc] ?? 0, i.n);
  return needs;
}

