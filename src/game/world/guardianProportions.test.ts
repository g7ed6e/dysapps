// Les proportions des Gardiens (GD-16 pour le 6e, GD-18 du 5e au 3e) : dans Blocland, le Gardien dépasse sa créature
// et les arbres de son île ; un Gardien couché ou une statue d'Archipéo restée basse, les arbres qui poussent près de
// lui ; dans les deux univers, il tient entier dans la vue de l'île ; le bloc d'or d'un Gardien qui prend tout son carré
// est à côté.
import { describe, expect, it } from 'vitest';
import { BIOMES } from '../biomes';
import { GUARDIAN_CUBES } from './characters/guardians';
import { CREATURE_CUBES } from './characters/creatures';
import { GUARDIAN_GOLD_BESIDE, LYING_GUARDIANS, SHORT_STATUE_HEIGHTS, TREE_CLEARANCE_OF_A_LYING_GUARDIAN, TREE_HEIGHT_BESIDE_A_LYING_GUARDIAN } from './guardianSquares';
import { HABILLAGE_BLOCLAND } from './skin/blocland';
import { creaturePlacements, guardianCells, trophySpot, worldCubes } from './terrain';
import { gardienEntierDansLeCadre, guardianSpot, presDuCarreDuGardien, solLibre } from './terrain/creatures';
import { toutConstruit } from './budget';
import { decorPose, kindOf } from './decor';
import { LOW } from './paths';
import { ARCHIPELAGO_IDS } from './archipelagos';

const haut = (cubes: readonly { z: number }[]) => Math.max(...cubes.map((c) => c.z)) + 1;

describe('Les proportions des Gardiens (GD-16, GD-18)', () => {
  it('dans Blocland, les créatures sont réduites comme les Gardiens : un seul grain de cube', () => {
    const { world } = toutConstruit();
    for (const a of ARCHIPELAGO_IDS) for (const c of creaturePlacements(a, world.links, HABILLAGE_BLOCLAND.echelleDesGardiens)) expect(c.echelle, c.id).toBe(HABILLAGE_BLOCLAND.echelleDesGardiens);
  });

  it('dans Blocland, chaque Gardien est plus haut que sa créature', () => {
    for (const { id } of BIOMES) if (CREATURE_CUBES[id]) expect(haut(GUARDIAN_CUBES[id]), id).toBeGreaterThan(haut(CREATURE_CUBES[id]));
  });

  it('dans Blocland, chaque Gardien est au moins aussi haut que les arbres de son île ; un Gardien couché ou une statue d’Archipéo restée basse, que ceux qui poussent près de lui', () => {
    const { progress, world } = toutConstruit();
    const cubes = ARCHIPELAGO_IDS.flatMap((a) => worldCubes(a, progress, world));
    const trop: string[] = [];
    for (const { id } of BIOMES) {
      const gardien = haut(GUARDIAN_CUBES[id]) * HABILLAGE_BLOCLAND.echelleDesGardiens;
      // La hauteur d'un arbre, depuis son pied (un arbre sur une colline n'en est pas plus grand).
      const elements = new Map<string, { bas: number; sommet: number; cases: { x: number; y: number }[] }>();
      for (const c of cubes) {
        if (c.tag !== id || !decorPose(c.decor) || LOW.has(kindOf(c.decor!))) continue;
        const e = elements.get(c.decor!) ?? { bas: Infinity, sommet: -Infinity, cases: [] };
        e.bas = Math.min(e.bas, c.z);
        e.sommet = Math.max(e.sommet, c.z);
        e.cases.push({ x: c.x, y: c.y });
        elements.set(c.decor!, e);
      }
      const carre = guardianCells(id);
      const pres = (cases: { x: number; y: number }[]) =>
        cases.some((p) => carre.some((q) => Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)) <= TREE_CLEARANCE_OF_A_LYING_GUARDIAN));
      for (const [nom, { bas, sommet, cases }] of elements) {
        if (!['arbre', 'sapin'].includes(kindOf(nom))) continue;
        const e = { haut: sommet - bas + 1, cases };
        if (LYING_GUARDIANS.has(id)) {
          if (pres(e.cases)) expect(e.haut, `${id} : ${nom}`).toBeLessThanOrEqual(TREE_HEIGHT_BESIDE_A_LYING_GUARDIAN);
        } else {
          if (gardien < e.haut) trop.push(`${id} ${nom} ${e.haut} > ${gardien}`);
          const statue = SHORT_STATUE_HEIGHTS[id];
          if (statue !== undefined && pres(e.cases)) expect(e.haut, `${id} : ${nom}`).toBeLessThanOrEqual(statue);
        }
      }
    }
    expect(trop).toEqual([]);
  });

  it('chaque Gardien tient entier dans la vue de l’île la plus étroite, dans les deux univers', () => {
    for (const { id } of BIOMES) expect(gardienEntierDansLeCadre(id), id).toBe(true);
  });

  it('le bloc d’or posé à côté du carré est sur le sol libre de l’île, sur la case voisine de la rangée de devant', () => {
    for (const id of Object.keys(GUARDIAN_GOLD_BESIDE) as (keyof typeof GUARDIAN_GOLD_BESIDE)[]) {
      const s = guardianSpot(id);
      const t = trophySpot(id);
      expect(t.y, id).toBe(s.y);
      expect(t.x === s.x - 1 || t.x === s.x + 5, id).toBe(true);
      expect(solLibre(id)(t.x, t.y), id).toBe(true);
      expect(presDuCarreDuGardien(id, [t], 1), id).toBe(true);
    }
  });
});
