// Le relief des Îles du Ciel (R4b-3e) : trois gradins derrière le cœur de l'Observatoire des textes, un dôme bas au
// Belvédère à la place de ses deux pics ; rien d'autre ne bouge.
import { toutConstruit } from '../budget';
import { BRIDGES } from '../archipelago';
import { archipelagoOfIsland } from '../archipelagos';
import { rangerLeDecor } from '../decorMesh';
import { champDuSol } from '../landMesh';
import { CORE } from '../map';
import { bridgePath, origineDe, worldCubes } from '../terrain';
import { modelerLeSol } from '.';
import { DOME_DU_BELVEDERE, GRADINS_3E } from './3e';
import type { BiomeId } from '../../biomes';

const { progress, world: village } = toutConstruit();
const cubes = worldCubes('3e', progress, village, false);
const sol = cubes.filter((c) => c.sol);
const { reste } = rangerLeDecor(cubes.filter((c) => !c.sol));
const avant = champDuSol('3e', sol, reste);
const modele = modelerLeSol('3e', sol, reste);
const apres = champDuSol('3e', modele, reste);
const cle = (x: number, y: number) => (x + 16384) * 32768 + (y + 16384);
const ecart = (x: number, y: number) => {
  const i = avant.index.get(cle(x, y));
  return i === undefined ? 0 : apres.colonnes[i].haut - avant.colonnes[i].haut;
};

it('l’Observatoire des textes monte en trois gradins de 2 blocs, neige en haut ; le Belvédère n’a plus de pic ; les autres îles ne bougent pas', () => {
  const max: Record<string, number> = {};
  const min: Record<string, number> = {};
  for (const c of avant.colonnes) {
    const d = ecart(c.x, c.y);
    max[c.ile!] = Math.max(max[c.ile!] ?? 0, d);
    min[c.ile!] = Math.min(min[c.ile!] ?? 0, d);
  }
  for (const id of ['maths-3e-functions', 'maths-3e-statistics', 'english-3e-comprehension', 'english-3e-grammar']) expect([max[id], min[id]], id).toEqual([0, 0]);
  // Les textes : jusqu'à 6 blocs au-dessus de l'île, en marches de 2.
  const o = origineDe('french-3e-close-reading');
  const hauts = apres.colonnes.filter((c) => c.ile === 'french-3e-close-reading').map((c) => c.haut - o.z);
  expect(Math.max(...hauts)).toBe(GRADINS_3E.marche * GRADINS_3E.gradins);
  expect(min['french-3e-close-reading']).toBe(0);
  // Le sommet des gradins est enneigé.
  const neige = modele.filter((c) => c.tag === 'french-3e-close-reading' && c.texture === 'neige');
  expect(neige.length).toBeGreaterThan(3);
  // Le Belvédère : ses pics redescendent, rien ne dépasse le dôme.
  const b = origineDe('maths-3e-geometry');
  const belvedere = apres.colonnes.filter((c) => c.ile === 'maths-3e-geometry').map((c) => c.haut - b.z);
  expect(Math.max(...belvedere)).toBeLessThanOrEqual(DOME_DU_BELVEDERE.h);
  expect(min['maths-3e-geometry']).toBeLessThan(0);
});

it('ni le cœur, ni la première rangée du fond, ni les abords d’un ouvrage, ni ce qui est posé ne bougent', () => {
  const chemins = BRIDGES.filter((b) => archipelagoOfIsland(b.from) === '3e').flatMap((b) => bridgePath(b));
  const posees = new Set(reste.map((c) => `${c.x},${c.y}`));
  for (const c of avant.colonnes) {
    const d = ecart(c.x, c.y);
    if (!d) continue;
    const o = origineDe(c.ile as BiomeId);
    expect(c.y - o.y, `${c.ile} ${c.x},${c.y}`).toBeGreaterThan(CORE);
    expect(chemins.some((p) => Math.abs(p.x - c.x) <= 3 && Math.abs(p.y - c.y) <= 3), `${c.x},${c.y}`).toBe(false);
    expect(posees.has(`${c.x},${c.y}`)).toBe(false);
  }
  // Une borne ou un plan n'est jamais au pied d'un gradin : aucune colonne posée n'a de voisine montée de 2 blocs ou plus.
  for (const k of posees) {
    const [x, y] = k.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) expect(ecart(x + dx, y + dy), k).toBeLessThan(2);
  }
});
