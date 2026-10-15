import { EMPTY_STATE, type GameState } from '../engine';
import { etatsDesObjets } from './model';
import { projectReady, suggestedProject } from './projectChoice';
import { buildPiece, projectOf } from './projects';

const portique = projectOf('landmark-4e-3')!;
const PROJETS_4E = ['landmark-4e-3', 'landmark-4e-4'];
const tour = projectOf('landmark-4e-4')!;
const etat = (stock: GameState['stock'] = {}, parts: GameState['world']['parts'] = {}): GameState => ({
  ...EMPTY_STATE,
  stock,
  world: { ...EMPTY_STATE.world, parts },
});
/** Le stock qui paie la première recette de la pièce suivante d'un projet. */
const paie = (index: number, p = tour) => Object.fromEntries(p.pieces[index].recipes[0].ingredients.map((i) => [i.bloc, i.n]));
/** La pièce `index` d'un projet posée (les blocs donnés juste pour elle). */
const pose = (s: GameState, p: typeof tour, index: number): GameState => {
  const r = buildPiece({ ...s, stock: { ...s.stock, ...paie(index, p) } }, p, index, 0);
  if (!r.ok) throw new Error(r.reason);
  return { ...r.state, stock: s.stock };
};

it('rien de commencé ni de payable : le premier projet de l’archipel, sans bulle « à faire »', () => {
  const s = etat();
  expect(suggestedProject(s, '4e')).toBe(portique);
  expect(projectReady(s, portique)).toBe(false);
  expect(etatsDesObjets(s, '4e').chantiersPrets).not.toContain(portique.monument);
  // Le 6e n'a aucun projet.
  expect(suggestedProject(s, '6e')).toBeNull();
});

it('un seul projet porte la bulle : celui que l’élève peut poser, le plus avancé d’abord', () => {
  // Seule la tour est payable : elle est mise en avant, seule.
  const s = etat(paie(0));
  expect(suggestedProject(s, '4e')).toBe(tour);
  expect(etatsDesObjets(s, '4e').chantiersPrets.filter((id) => PROJETS_4E.includes(id))).toEqual([tour.monument]);
  // Les deux sont payables et rien n'est commencé : le premier dans l'ordre.
  const lesDeux = etat({ ...paie(0), ...paie(0, portique) });
  expect(suggestedProject(lesDeux, '4e')).toBe(portique);
  expect(etatsDesObjets(lesDeux, '4e').chantiersPrets.filter((id) => PROJETS_4E.includes(id))).toEqual([portique.monument]);
  // La tour a une pièce posée : à recettes égales, elle passe devant.
  const commencee = pose(lesDeux, tour, 0);
  const s2 = { ...commencee, stock: { ...paie(1), ...paie(0, portique) } };
  expect(suggestedProject(s2, '4e')).toBe(tour);
  // Rien de payable : le projet commencé reste mis en avant, sans bulle.
  expect(suggestedProject({ ...commencee, stock: {} }, '4e')).toBe(tour);
  expect(etatsDesObjets({ ...commencee, stock: {} }, '4e').chantiersPrets.filter((id) => PROJETS_4E.includes(id))).toEqual([]);
});
