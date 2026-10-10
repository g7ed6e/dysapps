// Le cœur d'herbe et le parvis des îles d'EMC et de latin-grec du 4e et du 3e (DA, captures emc-4e-3e-1) : le sol du
// cœur est d'herbe, le bloc de l'île n'y reste qu'en allée bordée de pierre, du bord de devant au bâtiment.
import { BIOMES, BLOC, BLOCKS } from '../biomes';
import { GRASS } from './decor';
import { bornesDuCoeur, islandDef } from './map';
import { PLAN_ZONE } from './plans';
import { cubesDeLIle, fade } from './terrain';
import { caseDuParvis, ILES_A_PARVIS } from './terrain/parvis';

/**
 * Le dessus de chaque colonne du sol (les cubes `sol`), en repère du cœur (l'île n'est pas tournée : `quarts` 0), sa
 * couleur d'avant le délavé d'une île fermée (toutes le sont dans une partie vierge) : on la compare au délavé attendu.
 */
function solDuCoeur(id: (typeof BIOMES)[number]['id']) {
  const haut = new Map<string, { z: number; color: string; muted: boolean }>();
  for (const c of cubesDeLIle(id, {}, undefined, false)) {
    if (!c.sol) continue;
    const k = `${c.x},${c.y}`;
    const h = haut.get(k);
    if (!h || c.z > h.z) haut.set(k, { z: c.z, color: c.color, muted: c.muted === true });
  }
  return haut;
}

describe('Le cœur d’herbe et le parvis (DA, captures emc-4e-3e-1)', () => {
  it('quatre îles : la Porte, la Colonnade, le Forum et le Bosquet', () =>
    expect([...ILES_A_PARVIS].sort()).toEqual(['civics-3e-democratic-life', 'civics-4e-rights-freedoms', 'lca-3e-ideas', 'lca-4e-cities']));

  for (const id of ILES_A_PARVIS) {
    it(`${id} : le cœur d’herbe, l’allée du bloc de l’île de deux cases bordée de pierre, du bord de devant à la zone des plans`, () => {
      const def = islandDef(id);
      expect(def.quarts ?? 0).toBe(0);
      const b = bornesDuCoeur(def);
      const bloc = BLOCKS[BIOMES.find((x) => x.id === id)!.block].side;
      const sol = solDuCoeur(id);
      const compte = { herbe: 0, allee: 0, bordure: 0 };
      for (let y = b.y0; y < b.y1; y++)
        for (let x = b.x0; x < b.x1; x++) {
          const s = sol.get(`${x},${y}`);
          if (!s) continue;
          const genre = caseDuParvis(id, x, y);
          const teinte = (couleur: string) => (s.muted ? fade(couleur) : couleur);
          if (genre === 'allee') expect(s.color, `${x},${y}`).toBe(teinte(bloc));
          else if (genre === 'bordure') expect(s.color, `${x},${y}`).toBe(teinte(BLOCKS[BLOC.pierre].side));
          // Hors du parvis, jamais le bloc de l'île au sol (le sable des coins arrondis, la terre de la côte restent).
          else expect(s.color, `${x},${y}`).not.toBe(teinte(bloc));
          if (genre) compte[genre === 'allee' ? 'allee' : 'bordure']++;
          else if (s.color === teinte(GRASS)) compte.herbe++;
        }
      // L'allée va du bord de devant (y0) à la rangée qui touche la zone des plans : deux cases de large.
      expect(compte.allee).toBe(2 * (PLAN_ZONE.y - b.y0));
      expect(compte.bordure).toBe(2 * (PLAN_ZONE.y - b.y0));
      expect(compte.herbe).toBeGreaterThan(300);
    });
  }

  it('aucune autre île n’a de parvis', () => {
    for (const b of BIOMES) if (!ILES_A_PARVIS.has(b.id)) expect(caseDuParvis(b.id, 10, 0)).toBeNull();
  });
});
