import { archipelagoOfIsland, ARCHIPELAGO_IDS } from '../archipels';
import { CORE, MAP } from '../map';
import { SILHOUETTES } from '.';

it('chaque île a son relief dans le fichier de son archipel, et seulement là', () => {
  for (const d of MAP) {
    const a = archipelagoOfIsland(d.id);
    for (const b of ARCHIPELAGO_IDS) expect(d.id in SILHOUETTES[b], `${d.id} dans ${b}`).toBe(a === b);
  }
  expect(ARCHIPELAGO_IDS.reduce((n, a) => n + Object.keys(SILHOUETTES[a]).length, 0)).toBe(MAP.length);
});

it('les pics sont écrits en repère d’île : sur la terre de l’île, depuis le coin de son cœur', () => {
  for (const d of MAP) {
    const pics = (SILHOUETTES[archipelagoOfIsland(d.id)] as Record<string, { pics: { x: number; y: number }[] }>)[d.id].pics;
    for (const p of pics) {
      expect(p.x, d.id).toBeGreaterThanOrEqual(-d.ext.left);
      expect(p.x, d.id).toBeLessThan(CORE + d.ext.right);
      expect(p.y, d.id).toBeGreaterThanOrEqual(-d.ext.front);
      expect(p.y, d.id).toBeLessThan(CORE + d.ext.back);
    }
  }
});
