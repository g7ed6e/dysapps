import { describe, expect, it } from 'vitest';
import { BRIDGES } from './archipelago';
import { toutConstruit } from './budget';
import { Pinceau } from './decor/pinceau';
import { dessinerPont, PONTS_DE_PIERRE_ET_DE_BOIS, pontsDePierreEtDeBois } from './ponts';
import { bridgePath, worldCubes } from './terrain';

describe('Les ponts de pierre et de bois du 5e (lot R5, Archipéo seulement)', () => {
  const { progress, village } = toutConstruit();

  it('sont les quatre ponts à construire du 5e, de vrais ponts', () => {
    const ponts = BRIDGES.filter((b) => PONTS_DE_PIERRE_ET_DE_BOIS.has(b.id));
    expect(ponts.map((b) => b.id).sort()).toEqual([...PONTS_DE_PIERRE_ET_DE_BOIS].sort());
    for (const b of ponts) expect(b.kind).toBe('pont');
  });

  it('construits, remplacent leurs planches par le modèle, dans l’ordre du tracé ; les lanternes restent des cubes', () => {
    const cubes = worldCubes('5e', progress, village, false);
    const { ponts, remplacees } = pontsDePierreEtDeBois(cubes);
    expect(ponts.map((p) => p.id).sort()).toEqual([...PONTS_DE_PIERRE_ET_DE_BOIS].sort());
    for (const p of ponts) {
      const def = BRIDGES.find((b) => b.id === p.id);
      if (!def) throw new Error(`ouvrage inconnu : ${p.id}`);
      expect(p.construit).toBe(true);
      expect(p.cases).toHaveLength(bridgePath(def).length);
      // D'une case à la suivante, un pas d'une case.
      for (let i = 1; i < p.cases.length; i++) expect(Math.abs(p.cases[i].x - p.cases[i - 1].x) + Math.abs(p.cases[i].y - p.cases[i - 1].y)).toBe(1);
    }
    for (const c of cubes.filter((c) => c.bridge && PONTS_DE_PIERRE_ET_DE_BOIS.has(c.bridge)))
      expect(remplacees.has(`${c.x},${c.y},${c.z}`)).toBe(c.texture === 'planches' || c.texture === 'escalier');
  });

  it('à restaurer, gardent leurs cases en fantômes et ne montrent que leurs culées', () => {
    const cubes = worldCubes('5e', progress, { ...village, bridges: village.bridges.filter((id) => id !== 'comptoir-manoir') }, false);
    const { ponts, remplacees } = pontsDePierreEtDeBois(cubes);
    const pont = ponts.find((p) => p.id === 'comptoir-manoir');
    if (!pont) throw new Error('pont Comptoir–Manoir absent');
    expect(pont.construit).toBe(false);
    expect([...remplacees].some((k) => cubes.some((c) => c.bridge === 'comptoir-manoir' && `${c.x},${c.y},${c.z}` === k))).toBe(false);
    const avant = new Pinceau();
    dessinerPont(avant, pont);
    const apres = new Pinceau();
    dessinerPont(apres, { ...pont, construit: true });
    // Deux culées de cinq faces : l'état à restaurer ne se lit pas par la couleur seule, le tablier manque.
    expect(avant.fin().positions.length / 9).toBe(20);
    expect(apres.fin().positions.length).toBeGreaterThan(10 * avant.fin().positions.length);
  });
});
