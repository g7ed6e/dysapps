import { BLOCKS, BIOMES } from './biomes';
import { bacASable, BLOCS_DU_BATISSEUR, remplir } from './batisseur';
import { isBossBeaten } from './bossCore';
import { EMPTY_STATE, fillPlanCell } from './engine';
import { BRIDGES, isBiomeUnlocked } from './world/archipelago';
import { plansFor, planCells } from './world/plans';

describe('mode bâtisseur', () => {
  const bac = bacASable(EMPTY_STATE);

  it('remplit l’inventaire de chaque sorte de bloc', () => {
    for (const b of Object.keys(BLOCKS)) expect(bac.stock[b as keyof typeof BLOCKS]).toBe(BLOCS_DU_BATISSEUR);
  });

  it('pose tous les ponts et compte les Gardiens comme vaincus', () => {
    for (const b of BRIDGES) expect(bac.world.links).toContain(b.id);
    for (const b of BIOMES) expect(isBossBeaten(b.id, bac.progress)).toBe(true);
    expect(isBiomeUnlocked(BIOMES[0].id, bac.world.links)).toBe(true);
  });

  it('garde ce qui était déjà construit et ne touche pas la partie d’origine', () => {
    const avant = { ...EMPTY_STATE, world: { ...EMPTY_STATE.world, parts: { x: ['0,0,0'] } } };
    expect(bacASable(avant).world.parts).toEqual({ x: ['0,0,0'] });
    expect(avant.stock).toEqual({});
    expect(EMPTY_STATE.world.links).toEqual([]);
  });

  it('reste plein après une pose', () => {
    const plan = plansFor(BIOMES[0].id)[0];
    const c = planCells(plan)[0];
    const r = fillPlanCell(bac, plan, c.x, c.y, c.z);
    expect(r.ok).toBe(true);
    expect(remplir(r.state).stock[c.block]).toBe(BLOCS_DU_BATISSEUR);
  });
});
