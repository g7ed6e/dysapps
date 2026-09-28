// Le relief des Îles Brumeuses (R4b-5e) : des crêtes en gradins sur l'anneau du fond, loin du cœur, des ouvrages et de
// ce qui est posé ; le Marché et le Marais restent bas.
import { toutConstruit } from '../budget';
import { BRIDGES } from '../archipelago';
import { archipelagoOfIsland } from '../archipels';
import { rangerLeDecor } from '../decorMesh';
import { champDuSol } from '../landMesh';
import { CORE } from '../map';
import { bridgePath, origineDe, worldCubes } from '../terrain';
import { modelerLeSol } from '.';
import type { BiomeId } from '../../biomes';

const { progress, village } = toutConstruit();
const cubes = worldCubes('5e', progress, village, false);
const sol = cubes.filter((c) => c.sol);
const { reste } = rangerLeDecor(cubes.filter((c) => !c.sol));
const avant = champDuSol('5e', sol, reste);
const apres = champDuSol('5e', modelerLeSol('5e', sol, reste), reste);
const cle = (x: number, y: number) => (x + 16384) * 32768 + (y + 16384);
const montee = (x: number, y: number) => {
  const i = avant.index.get(cle(x, y));
  return i === undefined ? 0 : apres.colonnes[i].haut - avant.colonnes[i].haut;
};

it('les crêtes montent au fond du Glacier, du Carrefour, du Comptoir, du Manoir et du Relais ; le Marché et le Marais restent bas', () => {
  const max: Record<string, number> = {};
  for (const c of avant.colonnes) max[c.ile!] = Math.max(max[c.ile!] ?? 0, montee(c.x, c.y));
  expect(max.marche).toBe(0);
  expect(max.marais).toBe(0);
  for (const id of ['glacier', 'carrefour', 'comptoir', 'manoir', 'relais']) expect(max[id], id).toBeGreaterThanOrEqual(5);
  expect(max.glacier).toBeGreaterThanOrEqual(max.carrefour);
});

it('ni le cœur, ni la première rangée du fond, ni les abords d’un ouvrage, ni ce qui est posé ne bougent ; rien ne descend', () => {
  const chemins = BRIDGES.filter((b) => archipelagoOfIsland(b.from) === '5e').flatMap((b) => bridgePath(b));
  const posees = new Set(reste.map((c) => `${c.x},${c.y}`));
  for (const c of avant.colonnes) {
    const d = montee(c.x, c.y);
    expect(d).toBeGreaterThanOrEqual(0);
    if (!d) continue;
    const o = origineDe(c.ile as BiomeId);
    expect(c.y - o.y, `${c.ile} ${c.x},${c.y}`).toBeGreaterThan(CORE);
    expect(chemins.some((p) => Math.abs(p.x - c.x) <= 3 && Math.abs(p.y - c.y) <= 3), `${c.x},${c.y}`).toBe(false);
    expect(posees.has(`${c.x},${c.y}`)).toBe(false);
  }
  // Une borne ou un plan n'est jamais au pied d'un gradin : aucune colonne posée n'a de voisine montée de 2 blocs ou plus.
  for (const k of posees) {
    const [x, y] = k.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) expect(montee(x + dx, y + dy), k).toBeLessThan(2);
  }
});
