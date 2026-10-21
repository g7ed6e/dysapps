// Les terres du monde continu lues dans la grille (GD-20, point 3, « vraies terres, vrais ponts ») : ce que le monde en
// montre (`openWorldLands`), et ce que la grille en reçoit (`payLand`, `ensureLands`, ../../world/arrange.ts).
import { describe, expect, it } from 'vitest';
import { EMPTY_STATE, type GameState } from '../../engine/state';
import { BRIDGES, VOYAGES, archipelagoOf, getBridge, reachableIslands } from '../../world/archipelago';
import { ensureLands, payLand } from '../../world/arrange';
import { PLACES } from '../../world/continu/plan6e';
import { firstBefore, landById, type LandId, landOf, landsAfter, startLandOf } from '../../world/continu/lands';
import { arrivalPlace, gridLand, gridLands, openWorldLands } from './landLinks';
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

  it('au 5e, une prochaine destination d’un autre niveau suggère la première terre du plan qu’on peut relier (relecture du lot 2)', () => {
    const plan5 = planFor('5e');
    // La liaison du 6e qui ouvre le Couchant, vue du 5e : la terre suggérée est celle du 5e qu'on relie d'abord.
    const id = 'french-6e-phonology-life-earth-sciences-6e-living-world';
    expect(openWorldLands(plan5, [], [], id).suggested).toBe('roselieres');
    // Sans liaison, une destination dans une île du 6e : de même.
    expect(openWorldLands(plan5, [], [], undefined, 'french-6e-letter-confusion').suggested).toBe('roselieres');
    // Au 6e, une mission du 6e : rien de suggéré, comme avant.
    expect(openWorldLands(PLAN, [], [], undefined, 'french-6e-letter-confusion').suggested).toBeNull();
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

describe('Au 5e, les Aiguilles en dernier (GD-22, « Les terres »)', () => {
  const plan5 = planFor('5e');
  // L'élève arrivé au 5e par la Nef : le voyage fait, le port du 5e atteint.
  const voyage = VOYAGES.find((v) => v.toClasse === '5e')!.id;
  const ensure5 = (state: GameState) => ensureLands({ ...state, world: { ...state.world, links: [...state.world.links, voyage] } }, gridLands(plan5));
  const lands5 = (state: GameState) => openWorldLands(plan5, state.world.links, []);

  it('au départ : les trois terres fermées, les Aiguilles seules en attente, des Roselières d’abord ; les Roselières suggérées', () => {
    const lands = lands5(ensure5(withStock(0)));
    expect(lands.closed).toEqual(['roselieres', 'contreforts', 'aiguilles']);
    expect(lands.waiting).toEqual(['aiguilles']);
    expect(firstBefore('aiguilles', lands.closed)).toBe('roselieres');
    expect(openWorldLands(plan5, [], [], undefined, 'french-6e-letter-confusion').suggested).toBe('roselieres');
  });

  it('les Roselières et les Contreforts dans l’ordre que l’élève choisit ; les Aiguilles reliables une fois les deux reliées', () => {
    let s = ensure5(withStock(100));
    expect(pay(s, 'aiguilles').result).toEqual({ ok: false, reason: 'ordre' });
    // Les Contreforts d'abord : permis ; les Aiguilles attendent encore les Roselières.
    const c = pay(s, 'contreforts');
    expect(c.result).toMatchObject({ ok: true });
    expect(landsAfter('contreforts', lands5(s).closed)).toEqual([]);
    s = c.state;
    expect(lands5(s).waiting).toEqual(['aiguilles']);
    expect(firstBefore('aiguilles', lands5(s).closed)).toBe('roselieres');
    expect(pay(s, 'aiguilles').result).toEqual({ ok: false, reason: 'ordre' });
    // Les Roselières ensuite : les Aiguilles deviennent reliables, et la phrase le dit.
    expect(landsAfter('roselieres', lands5(s).closed)).toEqual(['aiguilles']);
    s = pay(s, 'roselieres').state;
    expect(lands5(s).waiting).toEqual([]);
    expect(pay(s, 'aiguilles').result).toMatchObject({ ok: true });
  });

  it('une sauvegarde qui a déjà relié les Aiguilles les garde ouvertes (rien n’est repris)', () => {
    let s = ensure5(withStock(100));
    // Les Aiguilles reliées avant la règle : leurs liaisons de la grille, écrites comme « Relier » les écrit.
    const all = pay(pay(pay(s, 'roselieres').state, 'contreforts').state, 'aiguilles').state;
    const before = new Set([...pay(pay(s, 'roselieres').state, 'contreforts').state.world.links]);
    const aiguilles = all.world.links.filter((l) => !before.has(l));
    s = { ...s, world: { ...s.world, links: [...s.world.links, ...aiguilles] } };
    const lands = lands5(ensure5(s));
    expect(lands.closed).not.toContain('aiguilles');
    expect(lands.closed).toContain('roselieres');
    expect(lands.waiting).toEqual([]);
  });

  it('le 6e ne change pas : aucune terre n’y attend une autre que sa terre d’avant', () => {
    for (const land of PLAN.lands) expect(land.waitsFor, land.id).toBeUndefined();
  });
});

describe('Au 4e, arrivée à la Crique, Bastion fermé (décision du mainteneur, 21 octobre 2026, GD-24)', () => {
  const PLAN_4E = planFor('4e');
  // Ce qu'a l'élève qui arrive au 4e par la grille : tout le 6e et le 5e reliés, et les deux voyages, jusqu'au Gabarit.
  const links = [...BRIDGES.filter((b) => ['6e', '5e'].includes(archipelagoOf(b.from).classe)).map((b) => b.id), ...VOYAGES.filter((v) => v.toClasse !== '3e').map((v) => v.id)];
  const gabarit = placeById('gabarit').island;
  const arrived: GameState = { ...EMPTY_STATE, stock: { 'french-6e-letter-confusion': 40 }, world: { ...EMPTY_STATE.world, links } };

  it('le port de la grille (le Gabarit) est relié, mais n’ouvre pas le Bastion à lui seul', () => {
    expect(reachableIslands(links).has(gabarit as never)).toBe(true);
    expect(gridLand('bastion').shut).toBe(gabarit);
    expect(openWorldLands(PLAN_4E, links, []).closed).toEqual(['bastion', 'coteaux', 'epaule']);
    // L'ouverture du monde ne relie pas le Bastion ; « Relier » le paie comme toute terre fermée.
    const ensured = ensureLands(arrived, gridLands(PLAN_4E));
    const reach = reachableIslands(ensured.world.links);
    for (const id of landById('bastion').places.filter((p) => p !== 'gabarit')) expect(reach.has(islandOf(id) as never), id).toBe(false);
    expect(openWorldLands(PLAN_4E, ensured.world.links, []).closed).toContain('bastion');
    expect(payLand(ensured, gridLand('bastion')).result).toMatchObject({ ok: true });
  });

  it('un lieu du Bastion déjà joué l’ouvre toujours : rien de gagné ne baisse', () => {
    const played = [{ ile: gabarit, mission: 'm', etat: 2 as const }];
    expect(openWorldLands(PLAN_4E, links, played).closed).toEqual(['coteaux', 'epaule']);
    const opened = ensureLands(arrived, gridLands(PLAN_4E), [gabarit as never]);
    expect(opened).not.toBe(arrived);
    expect(payLand(opened, gridLand('bastion')).result).toEqual({ ok: false, reason: 'construit' });
  });

  it('l’adresse de l’île du Gabarit : à la Crique tant que le Bastion est fermé, au Gabarit une fois ouvert par une mission jouée', () => {
    expect(arrivalPlace(PLAN_4E, gabarit, openWorldLands(PLAN_4E, links, []).closed)).toBeUndefined();
    const played = [{ ile: gabarit, mission: 'm', etat: 2 as const }];
    expect(arrivalPlace(PLAN_4E, gabarit, openWorldLands(PLAN_4E, links, played).closed)).toBe('gabarit');
    expect(arrivalPlace(PLAN_4E, undefined, [])).toBeUndefined();
  });

  it('le 6e et le 5e : leur port ne ferme rien', () => {
    for (const level of ['6e', '5e'] as const) for (const land of planFor(level).lands) expect(gridLand(land.id).shut, land.id).toBeUndefined();
  });
});
