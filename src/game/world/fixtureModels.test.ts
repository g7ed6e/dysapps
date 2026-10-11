import { expect, it } from 'vitest';
import { ecartDePres, petitesConstructionsDessinees, trianglesDuModele } from './fixtureModels';
import { barriereDeCour, FORMES, LANTERNE_DE_COUR, marcheDeCour } from './architecture';
import { toutConstruitAvecLesCommandes } from './budget';
import { worldCubes } from './terrain';
import { casesDeLaPetiteConstructionDansLeMonde } from './terrain/fixture';

const PUITS = 'french-6e-letter-confusion-fixture-1';
const triangles = (d: { facettes: readonly { points: unknown[] }[] }) => d.facettes.reduce((n, f) => n + f.points.length - 2, 0);

it('le puits de Tunel : de 300 à 500 triangles de près, de 30 à 50 de loin ; le budget compte l’écart de près', () => {
  const pres = trianglesDuModele(PUITS, false);
  const loin = trianglesDuModele(PUITS, true);
  expect(pres).toBeGreaterThanOrEqual(300);
  expect(pres).toBeLessThanOrEqual(500);
  expect(loin).toBeGreaterThanOrEqual(30);
  expect(loin).toBeLessThanOrEqual(50);
  expect(ecartDePres('6e')).toBe(pres - loin);
  expect(ecartDePres('5e')).toBe(0);
});

it('posé, le puits remplace toutes ses cases, eau comprise, et reste dans son emprise de 3 × 3 ; sans lui, rien', () => {
  const { progress, world } = toutConstruitAvecLesCommandes();
  const cubes = worldCubes('6e', progress, world, false).filter((c) => !c.sol);
  const [m] = petitesConstructionsDessinees('6e', cubes, 'french-6e-letter-confusion');
  const cases = casesDeLaPetiteConstructionDansLeMonde('french-6e-letter-confusion', PUITS);
  expect(m.replaced).toEqual(cases);
  expect(m.cellules).toHaveLength(cases.size);
  const xs = [...cases].map((k) => Number(k.split(',')[0]));
  const ys = [...cases].map((k) => Number(k.split(',')[1]));
  const p = m.opaque.positions;
  for (let i = 0; i < p.length; i += 3) {
    expect(p[i]).toBeGreaterThanOrEqual(Math.min(...xs) - 1e-6);
    expect(p[i]).toBeLessThanOrEqual(Math.max(...xs) + 1 + 1e-6);
    expect(p[i + 2]).toBeGreaterThanOrEqual(Math.min(...ys) - 1e-6);
    expect(p[i + 2]).toBeLessThanOrEqual(Math.max(...ys) + 1 + 1e-6);
  }
  // De loin sur une autre île.
  expect(petitesConstructionsDessinees('6e', cubes, null)[0].opaque.positions.length / 9).toBe(trianglesDuModele(PUITS, true));
  // Une case manquante (la vague en cours) : pas de modèle, les cubes restent.
  const k = [...cases][0];
  expect(petitesConstructionsDessinees('6e', cubes.filter((c) => `${c.x},${c.y},${c.z}` !== k))).toEqual([]);
});

it('les pièces de la cour : dans leur case, sans dessous, de 10 à 42 triangles', () => {
  const dans = (d: { facettes: readonly { points: number[][]; normale: number[] }[] }) => {
    for (const f of d.facettes) {
      for (const q of f.points)
        for (const v of q) {
          expect(v).toBeGreaterThanOrEqual(-1e-6);
          expect(v).toBeLessThanOrEqual(1 + 1e-6);
        }
      expect(f.normale[2]).not.toBe(-1);
    }
  };
  for (const { forme } of FORMES)
    for (const dessus of ['lanterne', 'bloc', null] as const)
      for (const avecPoteau of [true, false]) {
        const d = barriereDeCour(forme, dessus, avecPoteau);
        dans(d);
        if (forme !== 'te' && forme !== 'croix') expect(triangles(d)).toBeLessThanOrEqual(42);
      }
  for (const vers of [0, 1, 2, 3, null]) {
    const d = marcheDeCour(vers, false);
    dans(d);
    expect(triangles(d)).toBeLessThanOrEqual(18);
    expect(d.dansLeMonde).toBe(true);
  }
  // La marche monte vers la porte : son degré haut est du côté de la porte (+y pour 0, −x pour 1).
  const haut = (vers: number) => marcheDeCour(vers, false).facettes.find((f) => f.normale[2] === 1 && f.points[0][2] > 0.2)!.points;
  expect(Math.min(...haut(0).map((q) => q[1]))).toBeCloseTo(0.5);
  expect(Math.max(...haut(1).map((q) => q[0]))).toBeCloseTo(0.5);
  dans({ facettes: LANTERNE_DE_COUR });
  expect(LANTERNE_DE_COUR.length).toBeGreaterThan(0);
  expect(LANTERNE_DE_COUR.filter((f) => f.vitre)).toHaveLength(4);
});
