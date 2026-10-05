import { BLOC, BLOCKS } from '../biomes';
import { islandDef } from './map';
import { EMPTY_STATE, canLaunch, currentStage, fillPlanCell, launchVehicle, planStatus, sanitizeState, type GameState } from '../engine';
import { BADGES, EMPTY_PROGRESS, recordVoyage, sanitizeProgress } from '../../core/progress';
import { ARCHIPELAGOS, islandsOf, voyageId } from './archipelago';
import { VEHICLE_SIZE, dockOrigin } from './harbor';
import { PLANS, planCells } from './plans';
import { planV1 } from './plansV1';
import { VEHICLE_STAGES, beatenGuardians, getStage, kitReady, stageAt, stageFor, stageTo, vehicleAt, vehicleModel } from './vehicle';

const guardians = (ids: string[]) => Object.fromEntries(ids.map((id) => [`${id}-challenge`, { stars: 2 as const, attempts: 1, best: 1 }]));

it('trois étapes, de port en port, faites de blocs gagnables dans leur archipel, jamais rares', () => {
  expect(VEHICLE_STAGES.map((s) => s.stage)).toEqual([1, 2, 3]);
  VEHICLE_STAGES.forEach((s, i) => {
    expect(s.zone).toBe('port');
    expect(s.from).toBe(ARCHIPELAGOS[i].classe);
    expect(s.to).toBe(ARCHIPELAGOS[i + 1].classe);
    expect(s.biome).toBe(ARCHIPELAGOS[i].port);
    expect(s.cells.length).toBeGreaterThanOrEqual(16);
    expect(s.kit.length).toBeGreaterThanOrEqual(1);
    // Les cases tiennent dans l'encombrement du navire ; aucune n'est en double, même entre étapes.
    for (const c of [...s.cells, ...s.kit]) {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.x).toBeLessThan(VEHICLE_SIZE.w);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeLessThan(VEHICLE_SIZE.d);
      expect(c.z).toBeGreaterThanOrEqual(-VEHICLE_SIZE.below);
      expect(c.z).toBeLessThan(VEHICLE_SIZE.h);
      expect(BLOCKS[c.block].rare).toBeFalsy();
    }
    // Les blocs à poser se gagnent sur au moins deux îles de l'archipel ; le kit ne se pose pas.
    const earnable = new Set(islandsOf(s.from).map((b) => b.block));
    const used = new Set(s.cells.map((c) => c.block));
    for (const block of used) expect(earnable.has(block), `${s.id} ${block}`).toBe(true);
    expect(used.size).toBeGreaterThanOrEqual(2);
    expect(s.guardians).toBeGreaterThanOrEqual(1);
    expect(s.guardians).toBeLessThanOrEqual(islandsOf(s.from).length);
    expect(s.reward.xp).toBeGreaterThan(0);
    expect(PLANS.some((p) => p.id === s.id)).toBe(false);
    expect(stageFor(voyageId(s.to))).toBe(s);
    expect(stageTo(s.to)).toBe(s);
    expect(stageAt(s.biome)).toBe(s);
    expect(getStage(s.id)).toBe(s);
  });
  const keys = VEHICLE_STAGES.flatMap((s) => [...s.cells, ...s.kit].map((c) => `${c.x},${c.y},${c.z}`));
  expect(new Set(keys).size).toBe(keys.length);
  expect(stageAt('french-6e-phonology')).toBeUndefined();
  // Le modèle SVG grandit avec les voyages.
  expect(vehicleModel(0).length).toBe(VEHICLE_STAGES[0].cells.length + VEHICLE_STAGES[0].kit.length);
  expect(vehicleModel(3).length).toBe(keys.length);
});

it('les cases du navire sont sur le quai, devant l’île-port, sous le niveau de son sol quand elle est en altitude', () => {
  for (const s of VEHICLE_STAGES) {
    const cells = planCells(s);
    const o = dockOrigin(s.biome);
    const def = islandDef(s.biome);
    for (const c of cells) {
      // Devant l'île (y négatif relatif au cœur), à droite de l'îlot du Gardien.
      expect(c.y, s.id).toBeLessThan(0);
      expect(c.x, s.id).toBeGreaterThanOrEqual(12);
    }
    // Le plancher de la coque est au niveau de repos du navire (le monde ajoute l'altitude + 1 au z relatif).
    if (s.stage === 1) expect(Math.min(...cells.map((c) => c.z)) + def.altitude + 1, s.id).toBe(o.z);
    expect(o.z).toBeGreaterThanOrEqual(0);
  }
});

it('le kit arrive avec les Gardiens ; on embarque quand toutes les cases sont posées et les Gardiens vaincus', () => {
  const [coque] = VEHICLE_STAGES;
  expect(beatenGuardians('6e', {})).toBe(0);
  expect(beatenGuardians('6e', guardians(['french-6e-phonology', 'maths-6e-calculation']))).toBe(2);
  expect(beatenGuardians('6e', guardians(['french-6e-phonology', 'maths-5e-proportionality']))).toBe(1);
  expect(kitReady(coque, guardians(['french-6e-phonology', 'maths-6e-calculation']))).toBe(false);
  expect(kitReady(coque, guardians(['french-6e-phonology', 'maths-6e-calculation', 'french-6e-letter-confusion']))).toBe(true);
  // Rien de posé : il manque toutes les cases.
  expect(canLaunch(EMPTY_STATE, coque)).toEqual({ ok: false, reason: 'blocs', missing: coque.cells.length });
  expect(currentStage(EMPTY_STATE)).toBe(coque);
  // On pose tout, bloc par bloc, avec de quoi payer ; la dernière case donne le coffre.
  let state: GameState = { ...EMPTY_STATE, stock: { [BLOC.sable]: 40, [BLOC.bois]: 40, [BLOC.galet]: 20, [BLOC.pierre]: 5 }, world: { ...EMPTY_STATE.world, links: ['french-6e-phonology-french-6e-letter-confusion'] } };
  for (const c of planCells(coque)) {
    const r = fillPlanCell(state, coque, c.x, c.y, c.z, '2026-09-26');
    expect(r.ok, c.key).toBe(true);
    if (r.ok) state = r.state;
  }
  expect(planStatus(state, coque).complete).toBe(true);
  expect(state.stock[BLOC.lanterne]).toBe(coque.reward.chest[BLOC.lanterne]);
  expect(state.world.log).toEqual([{ day: '2026-09-26', part: coque.id }]);
  // Sans Gardiens : on attend.
  expect(canLaunch(state, coque)).toEqual({ ok: false, reason: 'gardiens', missing: 3 });
  state = { ...state, progress: guardians(['french-6e-phonology', 'maths-6e-calculation']) };
  expect(canLaunch(state, coque)).toEqual({ ok: false, reason: 'gardiens', missing: 1 });
  // Trois Gardiens : on largue les amarres, le voyage est fait, le bonhomme est au Marché.
  state = { ...state, progress: guardians(['french-6e-phonology', 'maths-6e-calculation', 'french-6e-letter-confusion']) };
  const gone = launchVehicle(state, coque);
  expect(gone.result).toEqual({ ok: true, to: 'maths-5e-proportionality' });
  expect(gone.state.world.links).toContain('passage-5e');
  expect(gone.state.world.place).toBe('maths-5e-proportionality');
  expect(vehicleAt(gone.state.world.links)).toBe('maths-5e-proportionality');
  expect(currentStage(gone.state)).toBe(VEHICLE_STAGES[1]);
  // Une deuxième fois : déjà fait. Le ballon depuis les Premiers Rivages seulement : trop loin.
  expect(launchVehicle(gone.state, coque).result).toEqual({ ok: false, reason: 'construit', missing: 0 });
  expect(canLaunch(EMPTY_STATE, VEHICLE_STAGES[1])).toEqual({ ok: false, reason: 'loin', missing: 0 });
  // Relu depuis la sauvegarde : rien ne bouge.
  const saved = sanitizeState(JSON.parse(JSON.stringify(gone.state)));
  expect(saved.world.links).toEqual(gone.state.world.links);
  expect(saved.world.place).toBe('maths-5e-proportionality');
  expect(saved.world.parts[coque.id]).toHaveLength(coque.cells.length);
});

it('un voyage compte pour les succès : Capitaine, Aéronaute, Pilote du ciel', () => {
  expect(sanitizeProgress({}).passages).toBe(0);
  const first = recordVoyage(EMPTY_PROGRESS, 120);
  expect(first.progress.passages).toBe(1);
  expect(first.progress.xp).toBe(120);
  expect(first.newBadges.map((b) => b.id)).toContain('capitaine');
  const second = recordVoyage(first.progress, 160);
  expect(second.newBadges.map((b) => b.id)).toContain('aeronaute');
  const third = recordVoyage(second.progress, 200);
  expect(third.newBadges.map((b) => b.id)).toContain('pilote-du-ciel');
  expect(BADGES.find((b) => b.id === 'archipel')?.description).toContain('quatre archipels');
});

it('le réacteur passé sous la coque : un réacteur fini derrière la poupe le reste, des blocs posés à moitié reviennent', () => {
  const reacteur = VEHICLE_STAGES[2];
  const avant = [...planV1(reacteur.id)!.blocks.keys()];
  expect(avant).toHaveLength(25);
  // Aucune ancienne case ne retombe sur une nouvelle.
  const apres = new Set(planCells(reacteur).map((c) => c.key));
  expect(avant.some((k) => apres.has(k))).toBe(false);
  // Fini avant : fini, sans bloc rendu.
  const fini = sanitizeState({ world: { parts: { [reacteur.id]: avant } } });
  expect(fini.world.parts[reacteur.id]).toEqual([...apres]);
  expect(fini.stock).toEqual({});
  // Commencé (le ventre en acier et deux ailerons) : rien n'est posé, les blocs reviennent dans l'inventaire.
  const commence = sanitizeState({ world: { parts: { [reacteur.id]: avant.slice(0, 20) } } });
  expect(commence.world.parts[reacteur.id]).toBeUndefined();
  expect(commence.stock).toEqual({ [BLOC.acier]: 18, [BLOC.calque]: 2 });
});
