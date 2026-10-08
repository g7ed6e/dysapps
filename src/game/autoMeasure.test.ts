import { describe, expect, it } from 'vitest';
import { partieDeLaPose, partieDeMesure, resumerLesImages, tableauDesMesures } from './autoMeasure';
import { mesuresAutoDepuis, mesuresDepuis } from './rendering';

describe('la mesure automatique', () => {
  it('se demande par ?mesures=auto, qui montre aussi le compteur', () => {
    expect(mesuresAutoDepuis('https://x.dev/?mesures=auto#/adventure')).toBe(true);
    expect(mesuresDepuis('https://x.dev/?mesures=auto#/adventure')).toBe(true);
    expect(mesuresAutoDepuis('https://x.dev/?mesures#/adventure')).toBe(false);
    expect(mesuresAutoDepuis('https://x.dev/#/adventure?mesures=auto')).toBe(false);
  });

  it('résume une fenêtre d’images : images par seconde et la plus longue', () => {
    expect(resumerLesImages([16, 17, 17, 50])).toEqual({ ips: 40, pire: 50 });
    expect(resumerLesImages([])).toEqual({ ips: 0, pire: 0 });
  });

  it('prépare la pose : seule la première mission de l’île reste jouée, le reste de la partie tel quel', () => {
    const world = { parts: {}, log: [], links: [] };
    const progress = {
      'french-6e-phonology-sounds-1': { stars: 3, attempts: 1, best: 1 },
      'french-6e-phonology-rhymes-1': { stars: 3, attempts: 1, best: 1 },
      'french-6e-phonology-challenge': { stars: 3, attempts: 1, best: 1 },
      'maths-6e-fractions-a-1': { stars: 3, attempts: 1, best: 1 },
    };
    const toute = partieDeMesure(progress, world, 'french-6e-phonology');
    expect(toute.world.place).toBe('french-6e-phonology');
    const pose = partieDeLaPose(progress, world, 'french-6e-phonology');
    expect(Object.keys(pose.progress).filter((k) => k.startsWith('french-6e-phonology-')).length).toBeLessThanOrEqual(1);
    expect(pose.progress['french-6e-phonology-challenge']).toBeUndefined();
    expect(Object.keys(pose.progress).some((k) => k.startsWith('maths-6e-fractions'))).toBe(Object.keys(toute.progress).some((k) => k.startsWith('maths-6e-fractions')));
  });

  it('écrit un tableau à coller', () => {
    const t = tableauDesMesures([{ etape: 'île', appels: 39, triangles: 12880, ips: 58, pire: 33 }], 'iPad');
    expect(t).toContain('| île | 39 | 12');
    expect(t.split('\n')[0]).toBe('Mesure automatique · iPad');
  });
});
