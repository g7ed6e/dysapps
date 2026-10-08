import { EMPTY_STATE, repondreProjet, sanitizeState, type GameState } from '../engine';
import { getMonument } from './monuments';
import { planCells } from './plans';
import { tirageNeuf } from './assembly';
import { PROJECTS, buildPiece, canPay, nextPiece, pieceCells, pieceState, piecesBuilt, projectNeeds, projectOf } from './projects';

const phare = projectOf('landmark-5e-1')!;
const avec = (stock: GameState['stock'], parts: string[] = []): GameState => ({
  ...EMPTY_STATE,
  stock,
  world: { ...EMPTY_STATE.world, parts: { 'landmark-5e-1': parts } },
});
const recette = (index: number, r: number) => Object.fromEntries(phare.pieces[index].recipes[r].ingredients.map((i) => [i.bloc, i.n]));

it('le phare du large est le seul projet, en cinq pièces de bas en haut', () => {
  expect(PROJECTS.map((p) => p.monument)).toEqual(['landmark-5e-1']);
  expect(phare.pieces.map((p) => p.id)).toEqual(['base', 'tower', 'gallery', 'lantern', 'roof']);
});

it('les pièces couvrent chaque case du phare une seule fois', () => {
  const keys = phare.pieces.flatMap((_, i) => pieceCells(phare, i).map((c) => c.key));
  expect(new Set(keys).size).toBe(keys.length);
  expect(keys.sort()).toEqual(
    planCells(getMonument('landmark-5e-1')!)
      .map((c) => c.key)
      .sort(),
  );
  phare.pieces.forEach((_, i) => expect(pieceCells(phare, i).length).toBeGreaterThan(0));
});

it('une bonne réponse pose la pièce entière et prend les blocs de la recette choisie', () => {
  const s = avec({ ...recette(0, 1), 'maths-5e-signed-numbers': 2 });
  expect(canPay(s.stock, phare.pieces[0].recipes[1])).toBe(true);
  const r = buildPiece(s, phare, 0, 1);
  expect(r.ok).toBe(true);
  expect(pieceState(r.state, phare, 0)).toBe('built');
  expect(nextPiece(r.state, phare)).toBe(1);
  expect(piecesBuilt(r.state, phare)).toBe(1);
  expect(Object.values(r.state.stock).filter((n) => n)).toEqual([2]);
});

it("les pièces se posent dans l'ordre, et rien n'est pris sans les blocs", () => {
  expect(buildPiece(avec(recette(1, 0)), phare, 1, 0)).toMatchObject({
    ok: false,
    reason: 'pas-la-suivante',
  });
  expect(buildPiece(avec({}), phare, 0, 0)).toMatchObject({
    ok: false,
    reason: 'plus-de-blocs',
  });
});

it('une pièce commencée case par case se finit sans rien prendre', () => {
  const une = pieceCells(phare, 0)[0].key;
  const s = avec({ 'maths-5e-signed-numbers': 1 }, [une]);
  expect(pieceState(s, phare, 0)).toBe('started');
  expect(projectNeeds(s, phare)).toEqual({});
  const r = buildPiece(s, phare, 0, 0);
  expect(r.ok && r.state.stock).toEqual({ 'maths-5e-signed-numbers': 1 });
  expect(pieceState(r.state, phare, 0)).toBe('built');
});

it('la dernière pièce finit le grand ouvrage', () => {
  const avant = phare.pieces.slice(0, 4).flatMap((_, i) => pieceCells(phare, i).map((c) => c.key));
  const r = buildPiece(avec(recette(4, 0), avant), phare, 4, 0);
  expect(r).toMatchObject({ ok: true, completed: true });
  expect(nextPiece(r.state, phare)).toBeNull();
});

it('ce que demande la pièce suivante : la recette la mieux couverte, ou les deux', () => {
  const s = avec({ 'english-5e-grammar': 6 });
  expect(projectNeeds(s, phare)).toEqual(recette(0, 1));
  expect(projectNeeds(s, phare, true)).toEqual({
    ...recette(0, 0),
    ...recette(0, 1),
  });
});

it("la question d'une pièce : juste, la pièce se pose ; manquée, rien n'est pris et le tirage la note", () => {
  const reponse = { cles: ['a', 'b'], tirage: tirageNeuf('g'), cle: 'a' };
  const s = avec(recette(0, 0));
  const manquee = repondreProjet(s, 'landmark-5e-1', 0, 0, {
    ...reponse,
    juste: false,
  });
  expect(manquee).toMatchObject({ built: false, reason: 'manquee' });
  expect(manquee.state.stock).toEqual(s.stock);
  expect(manquee.state.assemblyDraw?.['compound-5e']).toBeDefined();
  const juste = repondreProjet(s, 'landmark-5e-1', 0, 0, {
    ...reponse,
    juste: true,
  });
  expect(juste).toMatchObject({ built: true, completed: false });
});

it('la sauvegarde garde le tirage d’une banque de projet, et seulement des banques connues', () => {
  const t = tirageNeuf('g');
  const s = sanitizeState({ assemblyDraw: { 'project-5e-counter': t, 'project-inconnu': t } });
  expect(Object.keys(s.assemblyDraw ?? {})).toEqual(['project-5e-counter']);
});
