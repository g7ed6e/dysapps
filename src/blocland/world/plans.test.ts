import { BIOMES, BLOCKS } from '../biomes';
import { EMPTY_STATE, FREE_ZONE, MAX_HEIGHT, fillPlanCell, inFreeZone, nextFillable, planStatus, type BloclandState } from '../engine';
import { PLANS, PLAN_ZONE, planCells, plansFor } from './plans';
import { groundHeight, islandOrigin, worldCubes } from './terrain';

it('chaque île a un plan valide : dans la zone des plans, sur un sol plat et sans décor, avec des blocs gagnables', () => {
  const decor = worldCubes({ 'foret-x': { stars: 1 }, 'mine-x': { stars: 1 }, 'carriere-x': { stars: 1 }, 'ferme-x': { stars: 1 } }).filter((c) => !c.ghost);
  const at = new Set(decor.map((c) => `${c.x},${c.y},${c.z}`));
  BIOMES.forEach((b, i) => {
    const plans = plansFor(b.id);
    expect(plans.length).toBeGreaterThanOrEqual(1);
    const { ox, oy } = islandOrigin(i);
    for (const plan of plans) {
      const cells = planCells(plan);
      expect(cells.length).toBeGreaterThan(8);
      expect(new Set(cells.map((c) => c.key)).size).toBe(cells.length);
      for (const c of cells) {
        expect(c.x).toBeGreaterThanOrEqual(PLAN_ZONE.x);
        expect(c.x).toBeLessThan(PLAN_ZONE.x + PLAN_ZONE.w);
        expect(c.y).toBeGreaterThanOrEqual(PLAN_ZONE.y);
        expect(c.y).toBeLessThan(PLAN_ZONE.y + PLAN_ZONE.h);
        expect(inFreeZone(c.x, c.y)).toBe(false);
        expect(c.z).toBeLessThan(MAX_HEIGHT);
        expect(groundHeight(i, c.x, c.y)).toBe(0);
        expect(at.has(`${ox + c.x},${oy + c.y},${c.z + 1}`)).toBe(false);
        // Or et cristal ne se gagnent pas dans les biomes : un plan ne les demande pas.
        expect(BLOCKS[c.block].rare).toBeFalsy();
      }
      expect(plan.reward.xp).toBeGreaterThan(0);
    }
  });
  expect(PLANS.map((p) => p.id)).toEqual([...new Set(PLANS.map((p) => p.id))]);
});

it('la zone libre et la zone des plans ne se chevauchent pas', () => {
  for (let x = PLAN_ZONE.x; x < PLAN_ZONE.x + PLAN_ZONE.w; x++)
    for (let y = PLAN_ZONE.y; y < PLAN_ZONE.y + PLAN_ZONE.h; y++) expect(inFreeZone(x, y)).toBe(false);
  expect(FREE_ZONE.w * FREE_ZONE.h).toBeGreaterThan(0);
});

it('pose les blocs du plan dans n’importe quel ordre, refuse sans bloc, et termine avec le coffre', () => {
  const plan = plansFor('foret')[0];
  const cells = planCells(plan);
  const last = cells[cells.length - 1];
  const first = cells[0];
  const empty = fillPlanCell(EMPTY_STATE, plan, first.x, first.y, first.z);
  expect(empty).toMatchObject({ ok: false, reason: 'plus-de-blocs', block: first.block });
  expect(fillPlanCell(EMPTY_STATE, plan, 0, 0, 0)).toMatchObject({ ok: false, reason: 'pas-dans-le-plan' });

  let state: BloclandState = { ...EMPTY_STATE, inventory: { bois: cells.length } };
  const r = fillPlanCell(state, plan, last.x, last.y, last.z);
  expect(r.ok).toBe(true);
  state = r.state;
  expect(state.inventory.bois).toBe(cells.length - 1);
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
  expect(state.inventory).toMatchObject({ bois: 0, ...plan.reward.chest });
  expect(nextFillable(state, plan)).toBeNull();
});

it('affiche les fantômes d’un plan seulement sur une île ouverte, et les remplace une fois posés', () => {
  const plan = plansFor('foret')[0];
  const first = planCells(plan)[0];
  const cubes = worldCubes({}, { placed: {}, plans: { [plan.id]: [first.key] } });
  const ghosts = cubes.filter((c) => c.ghost);
  expect(ghosts.length).toBe(planCells(plan).length - 1);
  expect(ghosts.every((c) => c.tag === 'foret')).toBe(true);
  const { ox, oy } = islandOrigin(0);
  const built = cubes.find((c) => c.x === ox + first.x && c.y === oy + first.y && c.z === first.z + 1);
  expect(built?.ghost).toBeFalsy();
  expect(built?.texture).toBe(BLOCKS[first.block].texture);
});
