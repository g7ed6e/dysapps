import { describe, expect, it } from 'vitest';
import { BRIDGES, linkKind } from './archipelago';
import { archipelagoOfIsland } from './archipelagos';
import { toutConstruit } from './budget';
import { Pinceau } from './decor/brush';
import { dessinerPont, PONTS_DE_PIERRE_ET_DE_BOIS, pontsDePierreEtDeBois } from './bridges';
import { bridgePath, worldCubes } from './terrain';

describe('Les ponts de pierre et de bois du 5e (lot R5, Archipéo seulement)', () => {
  const { progress, world: village } = toutConstruit();
  /** Ceux que la partie a posés : depuis GD-9, l'élève choisit ses liaisons, et toutes ne sont pas posées. */
  const poses = [...PONTS_DE_PIERRE_ET_DE_BOIS].filter((id) => village.links.includes(id)).sort();

  it('sont cinq ponts du 5e (le Relais des voyageurs compris), de vrais ponts', () => {
    const ponts = BRIDGES.filter((b) => PONTS_DE_PIERRE_ET_DE_BOIS.has(b.id));
    expect(ponts.map((b) => b.id).sort()).toEqual([...PONTS_DE_PIERRE_ET_DE_BOIS].sort());
    for (const b of ponts) expect(linkKind(b, village.links)).toBe('pont');
    // Depuis GD-9, chaque paire de lieux a sa liaison : ces cinq-là sont des ponts du 5e parmi d'autres.
    expect(BRIDGES.filter((b) => linkKind(b, village.links) === 'pont' && archipelagoOfIsland(b.from) === '5e').map((b) => b.id)).toEqual(expect.arrayContaining([...PONTS_DE_PIERRE_ET_DE_BOIS]));
    expect(poses.length).toBeGreaterThan(0);
  });

  it('construits, remplacent leurs planches par le modèle, dans l’ordre du tracé ; les lanternes restent des cubes', () => {
    const cubes = worldCubes('5e', progress, village, false);
    const { ponts, remplacees } = pontsDePierreEtDeBois(cubes);
    expect(ponts.map((p) => p.id).sort()).toEqual(poses);
    for (const p of ponts) {
      const def = BRIDGES.find((b) => b.id === p.id);
      if (!def) throw new Error(`ouvrage inconnu : ${p.id}`);
      expect(p.construit).toBe(true);
      expect(p.cases).toHaveLength(bridgePath(def, village.links).length);
      // D'une case à la suivante, un pas d'une case.
      for (let i = 1; i < p.cases.length; i++) expect(Math.abs(p.cases[i].x - p.cases[i - 1].x) + Math.abs(p.cases[i].y - p.cases[i - 1].y)).toBe(1);
    }
    for (const c of cubes.filter((c) => c.bridge && PONTS_DE_PIERRE_ET_DE_BOIS.has(c.bridge)))
      expect(remplacees.has(`${c.x},${c.y},${c.z}`)).toBe(c.texture === 'planches' || c.texture === 'escalier');
  });

  it('à restaurer, gardent leurs cases en fantômes et ne montrent que leurs culées', () => {
    const choisi = poses[0];
    const cubes = worldCubes('5e', progress, { ...village, links: village.links.filter((id) => id !== choisi) }, false);
    const { ponts, remplacees } = pontsDePierreEtDeBois(cubes);
    const pont = ponts.find((p) => p.id === choisi);
    if (!pont) throw new Error(`pont absent : ${choisi}`);
    expect(pont.construit).toBe(false);
    expect([...remplacees].some((k) => cubes.some((c) => c.bridge === choisi && `${c.x},${c.y},${c.z}` === k))).toBe(false);
    const avant = new Pinceau();
    dessinerPont(avant, pont);
    const apres = new Pinceau();
    dessinerPont(apres, { ...pont, construit: true });
    // Deux culées de cinq faces : l'état à restaurer ne se lit pas par la couleur seule, le tablier manque.
    expect(avant.fin().positions.length / 9).toBe(20);
    expect(apres.fin().positions.length).toBeGreaterThan(10 * avant.fin().positions.length);
  });
});
