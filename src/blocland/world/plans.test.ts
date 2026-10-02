import { BIOMES, BLOCKS } from '../biomes';
import { EMPTY_STATE, fillPlanCell, nextFillable, planStatus, sanitizeState, type GameState } from '../engine';
import { ORIGINE_DES_MONUMENTS, ORIGINE_DU_QUAI, PLANS, PLAN_ZONE, activePlan, isPlanDone, planCells, plansFor } from './plans';
import { toutConstruit } from './budget';
import { dockOrigin } from './harbour';
import { MONUMENTS } from './monuments';
import { VEHICLE_STAGES } from './vehicle';
import { ancreDuQuai, decalageDuQuai, groundHeight, islandOrigin, monumentAnchor, worldCubes } from './terrain';
import { ARCHIPELAGO_IDS, islandDef } from './map';

it('chaque île a un plan valide : dans la zone des plans, sur un sol plat et sans décor, avec des blocs gagnables', () => {
  // Le décor sans les créatures (elles se promènent) et sans les fantômes.
  const decor = ARCHIPELAGO_IDS.flatMap((a) =>
    worldCubes(a, {}, { parts: {}, log: [], links: ['foret-mine', 'foret-ferme', 'mine-carriere', 'ferme-tour'] }, false),
  ).filter((c) => !c.ghost);
  const at = new Set(decor.map((c) => `${c.x},${c.y},${c.z}`));
  BIOMES.forEach((b, i) => {
    const plans = plansFor(b.id);
    expect(plans.length).toBe(3);
    const { ox, oy, oz } = islandOrigin(i);
    for (const plan of plans) {
      const cells = planCells(plan);
      expect(cells.length).toBeGreaterThanOrEqual(8);
      expect(new Set(cells.map((c) => c.key)).size).toBe(cells.length);
      for (const c of cells) {
        expect(c.x).toBeGreaterThanOrEqual(PLAN_ZONE.x);
        expect(c.x).toBeLessThan(PLAN_ZONE.x + PLAN_ZONE.w);
        expect(c.y).toBeGreaterThanOrEqual(PLAN_ZONE.y);
        expect(c.y).toBeLessThan(PLAN_ZONE.y + PLAN_ZONE.h);
        expect(c.z).toBeLessThan(6);
        expect(groundHeight(i, c.x, c.y)).toBe(0);
        expect(at.has(`${ox + c.x},${oy + c.y},${oz + c.z + 1}`)).toBe(false);
        // Or et cristal ne se gagnent pas dans les biomes : un plan ne les demande pas.
        expect(BLOCKS[c.block].rare).toBeFalsy();
      }
      expect(plan.reward.xp).toBeGreaterThan(0);
    }
  });
  expect(PLANS.map((p) => p.id)).toEqual([...new Set(PLANS.map((p) => p.id))]);
});

it('pose les blocs du plan dans n’importe quel ordre, refuse sans bloc, et termine avec le coffre', () => {
  const plan = plansFor('foret')[0];
  const cells = planCells(plan);
  const last = cells[cells.length - 1];
  const first = cells[0];
  const empty = fillPlanCell(EMPTY_STATE, plan, first.x, first.y, first.z);
  expect(empty).toMatchObject({ ok: false, reason: 'plus-de-blocs', block: first.block });
  expect(fillPlanCell(EMPTY_STATE, plan, 0, 0, 0)).toMatchObject({ ok: false, reason: 'pas-dans-le-plan' });

  let state: GameState = { ...EMPTY_STATE, stock: { bois: cells.length } };
  const r = fillPlanCell(state, plan, last.x, last.y, last.z);
  expect(r.ok).toBe(true);
  state = r.state;
  expect(state.stock.bois).toBe(cells.length - 1);
  expect(planStatus(state, plan)).toMatchObject({ done: 1, total: cells.length, complete: false });
  expect(fillPlanCell(state, plan, last.x, last.y, last.z)).toMatchObject({ ok: false, reason: 'deja-pose' });

  let completed = false;
  for (let n = 0; n < cells.length; n++) {
    const next = nextFillable(state, plan);
    if (!next) break;
    const f = fillPlanCell(state, plan, next.x, next.y, next.z);
    expect(f.ok).toBe(true);
    if (f.ok) {
      state = f.state;
      completed = f.completed;
    }
  }
  expect(completed).toBe(true);
  expect(planStatus(state, plan).complete).toBe(true);
  expect(planStatus(state, plan).missing).toEqual({});
  expect(state.stock).toMatchObject({ bois: 0, ...plan.reward.chest });
  expect(nextFillable(state, plan)).toBeNull();
});

it('affiche les fantômes d’un plan seulement sur une île ouverte, et les remplace une fois posés', () => {
  const plan = plansFor('foret')[0];
  const first = planCells(plan)[0];
  const cubes = worldCubes('6e', {}, { parts: { [plan.id]: [first.key] }, log: [], links: [] });
  // Les fantômes des plans (les ponts fantômes sont au niveau du sol, z = 0).
  const ghosts = cubes.filter((c) => c.ghost && c.z > 0 && c.tag === 'foret');
  expect(ghosts.length).toBe(planCells(plan).length - 1);
  expect(ghosts.every((c) => c.tag === 'foret')).toBe(true);
  const { ox, oy } = islandOrigin(0);
  const built = cubes.find((c) => c.x === ox + first.x && c.y === oy + first.y && c.z === first.z + 1);
  expect(built?.ghost).toBeFalsy();
  expect(built?.texture).toBe(BLOCKS[first.block].texture);
});

it('chaque île enchaîne trois plans sans chevauchement, et les coffres fournissent les blocs de finition du plan suivant', () => {
  for (const b of BIOMES) {
    const plans = plansFor(b.id);
    const seen = new Set<string>();
    const kit: Partial<Record<string, number>> = {};
    plans.forEach((plan, i) => {
      for (const c of planCells(plan)) {
        expect(seen.has(c.key)).toBe(false);
        seen.add(c.key);
      }
      if (i > 0) {
        // Les blocs qui ne se gagnent dans aucun biome doivent venir des coffres des plans précédents de l'île.
        const needed: Partial<Record<string, number>> = {};
        for (const c of plan.cells) if (!BIOMES.some((x) => x.block === c.block)) needed[c.block] = (needed[c.block] ?? 0) + 1;
        for (const [block, n] of Object.entries(needed)) expect(kit[block] ?? 0).toBeGreaterThanOrEqual(n ?? 0);
      }
      for (const [block, n] of Object.entries(plan.reward.chest)) kit[block] = (kit[block] ?? 0) + (n ?? 0);
    });
  }
});

it('n’affiche les fantômes que du plan en cours, et enchaîne sur le suivant', () => {
  const [first, second] = plansFor('foret');
  const none = worldCubes('6e', {}, { parts: {}, log: [], links: [] });
  expect(none.filter((c) => c.ghost && c.z > 0 && c.tag === 'foret').length).toBe(planCells(first).length);
  expect(activePlan('foret', {})).toBe(first);
  const doneFirst = { [first.id]: planCells(first).map((c) => c.key) };
  expect(isPlanDone(first, doneFirst)).toBe(true);
  expect(activePlan('foret', doneFirst)).toBe(second);
  const after = worldCubes('6e', {}, { parts: doneFirst, log: [], links: [] });
  expect(after.filter((c) => c.ghost && c.z > 0 && c.tag === 'foret').length).toBe(planCells(second).length);
  expect(after.filter((c) => !c.ghost && c.texture === 'planches' && c.tag === 'foret' && c.z >= 1).length).toBeGreaterThanOrEqual(planCells(first).length);
});

it('écrit une ligne de journal quand un plan est terminé', () => {
  const plan = plansFor('foret')[0];
  let state: GameState = { ...EMPTY_STATE, stock: { bois: planCells(plan).length } };
  for (const c of planCells(plan)) {
    const r = fillPlanCell(state, plan, c.x, c.y, c.z, '2026-09-25');
    if (r.ok) state = r.state;
  }
  expect(state.world.log).toEqual([{ day: '2026-09-25', part: plan.id }]);
});

describe('les origines figées des chantiers (séparation du jeu et du rendu, J1 ; origine de rendu et origine des clés)', () => {
  it('figées : les clés des sauvegardes ne suivent ni le quai, ni l’îlot, ni le cœur', () => {
    // Les valeurs écrites dans les sauvegardes depuis le début : les changer rendrait illisibles les chantiers des élèves.
    expect(ORIGINE_DU_QUAI).toEqual({
      plaine: { x: 15, y: -14, z: -1 },
      marche: { x: 15, y: -12, z: -4 },
      atelier: { x: 15, y: -14, z: -7 },
    });
    expect(ORIGINE_DES_MONUMENTS).toEqual({
      'monument-observatoire': { x: 4, y: 23, z: 0 },
      'monument-moulin': { x: 1, y: 24, z: 0 },
      'monument-phare-large': { x: 23, y: 20, z: 0 },
      'monument-kiosque': { x: -11, y: -12, z: 0 },
      'monument-viaduc': { x: 16, y: -13, z: 0 },
      'monument-amphitheatre': { x: -2, y: 24, z: 0 },
      'monument-etoiles': { x: -14, y: 4, z: 0 },
      'monument-temple': { x: -14, y: 6, z: 0 },
    });
    expect(Object.keys(ORIGINE_DU_QUAI).sort()).toEqual([...new Set(VEHICLE_STAGES.map((s) => s.biome))].sort());
    expect(Object.keys(ORIGINE_DES_MONUMENTS).sort()).toEqual(MONUMENTS.map((m) => m.id).sort());
  });

  it('le rendu retombe sur la bonne clé : chaque case est dessinée au quai ou sur l’îlot, et y redonne sa clé', () => {
    for (const stage of VEHICLE_STAGES) {
      // Le navire est dessiné en cases locales depuis le coin du quai (`vehiclePlacement`) ; sa clé y tombe par `ancreDuQuai`.
      const o = dockOrigin(stage.biome);
      const a = ancreDuQuai(stage);
      const d = decalageDuQuai(stage);
      const ile = islandOrigin(BIOMES.findIndex((b) => b.id === stage.biome));
      planCells(stage).forEach((k, i) => {
        const c = stage.cells[i];
        expect({ x: a.x + k.x, y: a.y + k.y, z: a.z + k.z }, `${stage.id} ${k.key}`).toEqual({ x: o.x + c.x, y: o.y + c.y, z: o.z + c.z });
        // Une face touchée (repère de l'île, un cran plus bas) redonne la clé.
        const touchee = { x: o.x + c.x - ile.ox, y: o.y + c.y - ile.oy, z: o.z + c.z - ile.oz - 1 };
        expect({ x: touchee.x - d.x, y: touchee.y - d.y, z: touchee.z - d.z }, stage.id).toEqual({ x: k.x, y: k.y, z: k.z });
      });
    }
    for (const m of MONUMENTS) {
      // Le monument est dessiné sur son îlot : la case (0, 0, 0) de son plan au-dessus du coin intérieur de l'îlot.
      const a = monumentAnchor(m);
      const sol = islandDef(m.biome).altitude + 1;
      planCells(m).forEach((k, i) => {
        const c = m.cells[i];
        expect({ x: a.x + k.x, y: a.y + k.y, z: a.z + k.z }, `${m.id} ${k.key}`).toEqual({ x: m.islet.x + 1 + c.x, y: m.islet.y + 1 + c.y, z: sol + c.z });
      });
    }
  });

  it('une sauvegarde tout construite, relue, garde chacune de ses cases', () => {
    const { progress, world: village } = toutConstruit();
    const relue = sanitizeState(JSON.parse(JSON.stringify({ ...EMPTY_STATE, progress, world: village })));
    for (const [id, keys] of Object.entries(village.parts)) expect(relue.world.parts[id], id).toEqual(keys);
  });
});
