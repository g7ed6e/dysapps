// Les terres du monde continu lues dans la grille (GD-20, point 3, « vraies terres, vrais ponts ») : ce que le monde en
// montre (`openWorldLands`), et ce que la grille en reçoit (`payLand`, `ensureLands`, ../../world/arrange.ts).
import { describe, expect, it } from 'vitest';
import { EMPTY_STATE, type GameState } from '../../engine/state';
import { getBridge, reachableIslands } from '../../world/archipelago';
import { ensureLands, payLand } from '../../world/arrange';
import { PLACES } from '../../world/continu/plan6e';
import { landById, type LandId, landOf, startLandOf } from '../../world/continu/lands';
import { gridLand, gridLands, openWorldLands } from './landLinks';
import { placeById, planFor, type PlaceId } from '../../world/continu/levelPlan';

/** Le plan du 6e, le seul enregistré (GD-22). */
const PLAN = planFor('6e');
const START_LAND = startLandOf(PLAN);

const islandOf = (id: PlaceId) => placeById(id).island;
const openIn = (state: GameState) => reachableIslands(state.world.links);
const landOpen = (state: GameState, land: LandId) => landById(land).places.every((id) => [...openIn(state)].includes(islandOf(id) as never));
const withStock = (n: number, links: string[] = []): GameState => ({ ...EMPTY_STATE, stock: { 'french-6e-letter-confusion': n }, world: { ...EMPTY_STATE.world, links } });
const ensure = (state: GameState, played: readonly PlaceId[] = []) => ensureLands(state, gridLands(PLAN), played.map((id) => islandOf(id) as never));
const pay = (state: GameState, land: LandId) => payLand(state, gridLand(land));

describe('Ce que le monde montre des terres', () => {
  it('ce que le monde montre : au départ, les quatre terres fermées, le Large et les Crêtes en attente', () => {
    const lands = openWorldLands(PLAN, [], []);
    expect(lands.closed).toEqual(['couchant', 'large', 'levant', 'cretes']);
    expect(lands.waiting).toEqual(['large', 'cretes']);
    expect(lands.suggested).toBeNull();
  });

  it('le pont suggéré : celui de la terre que la prochaine liaison ouvre, jamais une terre en attente', () => {
    // Du Phare vers un lieu du Couchant (la grille d'aujourd'hui) : le pont du Couchant.
    const id = 'french-6e-phonology-life-earth-sciences-6e-living-world';
    const to = PLACES.find((p) => p.island === getBridge(id)!.to)!.id;
    expect(landOf(to)).toBe('couchant');
    expect(openWorldLands(PLAN, [], [], id).suggested).toBe('couchant');
    // Une liaison entre deux lieux fermés n'ouvre rien : aucun pont suggéré.
    expect(openWorldLands(PLAN, [], [], 'history-6e-antiquity-geography-6e-living').suggested).toBeNull();
  });

  it('la Pointe : le Phare et les Quais ouverts dans la grille, la Halle et le Chantier naval offerts à l’ouverture', () => {
    const start = withStock(0);
    const pointe = landById(START_LAND).places;
    expect(pointe.filter((id) => !openIn(start).has(islandOf(id) as never))).toEqual(['shipyard', 'commons']);
    expect(landOpen(ensure(start), START_LAND)).toBe(true);
    expect(ensure(start).stock).toEqual(start.stock);
  });

  it('les quatre ponts ouvrent les seize lieux pour 48 ressources', () => {
    let s = ensure(withStock(48));
    for (const land of ['couchant', 'large', 'levant', 'cretes'] as const) {
      const r = pay(s, land);
      expect(r.result, land).toMatchObject({ ok: true });
      s = r.state;
    }
    expect(s.stock['french-6e-letter-confusion'] ?? 0).toBe(0);
    for (const p of PLACES) expect(openIn(s).has(p.island as never), p.id).toBe(true);
  });
});

describe('Relier une terre (payLand) et l’ouverture du monde (ensureLands)', () => {
  it('une terre payée une fois : son prix débité, chacun de ses lieux relié ; une seconde fois, « construit », rien de débité', () => {
    const first = pay(ensure(withStock(15)), 'couchant');
    expect(first.result).toMatchObject({ ok: true });
    expect(first.state.stock['french-6e-letter-confusion']).toBe(3);
    expect(landOpen(first.state, 'couchant')).toBe(true);
    const again = pay(first.state, 'couchant');
    expect(again.result).toEqual({ ok: false, reason: 'construit' });
    expect(again.state).toBe(first.state);
  });

  it('la terre d’avant fermée : refusé (« ordre »), rien de débité ; pas assez de ressources : refusé (« blocs »), ce qui manque', () => {
    const s = withStock(40);
    expect(pay(s, 'large')).toEqual({ state: s, result: { ok: false, reason: 'ordre' } });
    expect(pay(s, 'cretes')).toEqual({ state: s, result: { ok: false, reason: 'ordre' } });
    const poor = withStock(10);
    expect(pay(poor, 'levant')).toEqual({ state: poor, result: { ok: false, reason: 'blocs', missing: 2 } });
    expect(pay(s, 'pointe').result).toEqual({ ok: false, reason: 'inconnu' });
  });

  it('ensureLands : gratuit, idempotent (la même référence), et une demi-terre n’est jamais facturée', () => {
    const once = ensure(withStock(15));
    expect(once.stock['french-6e-letter-confusion']).toBe(15);
    expect(ensure(once)).toBe(once);
    // Une demi-terre : un seul lieu du Couchant relié dans la grille (la première liaison que « Relier » y écrit), les
    // autres non. L'ouverture relie le reste, sans rien débiter ; « Relier » la dit déjà ouverte.
    const linked = pay(once, 'couchant').state;
    const first = linked.world.links.find((l) => !once.world.links.includes(l))!;
    const half: GameState = { ...once, world: { ...once.world, links: [...once.world.links, first] } };
    expect(landById('couchant').places.some((id) => openIn(half).has(islandOf(id) as never))).toBe(true);
    expect(landOpen(half, 'couchant')).toBe(false);
    const done = ensure(half);
    expect(done.stock).toEqual(half.stock);
    expect(landOpen(done, 'couchant')).toBe(true);
    expect(pay(done, 'couchant').result).toEqual({ ok: false, reason: 'construit' });
    expect(ensure(done)).toBe(done);
  });

  it('ensureLands ouvre aussi une terre où l’élève a déjà joué, et celles qu’il faut traverser pour l’atteindre', () => {
    const s = ensure(withStock(0), ['ferry']);
    for (const land of ['couchant', 'large'] as const) expect(landOpen(s, land)).toBe(true);
    expect(landOpen(s, 'levant')).toBe(false);
  });
});
