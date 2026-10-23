import { describe, expect, it } from 'vitest';
import { NIVEAUX_MESURES, ileDuNiveau, partieDeLaPose, partieDeMesure, resumeParNiveau, resumerLesImages, tableauDesMesures } from './autoMeasure';
import { getBiome } from './biomes';
import { adresseDeLaMesure, adresseSansMesure, mesuresAutoDepuis, mesuresDepuis } from './rendering';

describe('la mesure automatique', () => {
  it('se demande par ?mesures=auto, qui montre aussi le compteur', () => {
    expect(mesuresAutoDepuis('https://x.dev/?mesures=auto#/adventure')).toBe(true);
    expect(mesuresDepuis('https://x.dev/?mesures=auto#/adventure')).toBe(true);
    expect(mesuresAutoDepuis('https://x.dev/?mesures#/adventure')).toBe(false);
    expect(mesuresAutoDepuis('https://x.dev/#/adventure?mesures=auto')).toBe(false);
  });

  it('se lance depuis les Réglages et rend la vraie partie sur les Réglages, sans ?mesures', () => {
    const lancee = adresseDeLaMesure('https://x.dev/dysapps/?rendu=blocs#/reglages');
    expect(lancee).toBe('https://x.dev/dysapps/?rendu=blocs&mesures=auto#/');
    expect(mesuresAutoDepuis(lancee)).toBe(true);
    const rendue = adresseSansMesure(lancee);
    expect(rendue).toBe('https://x.dev/dysapps/?rendu=blocs#/reglages');
    expect(mesuresDepuis(rendue)).toBe(false);
    expect(adresseSansMesure('https://x.dev/?mesures=auto#/adventure/map')).toBe('https://x.dev/#/reglages');
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
    expect(tableauDesMesures([], 'iPad', ['« Annuler » : bouton non trouvé.'])).toMatch(/\n\n« Annuler » : bouton non trouvé\.$/);
  });

  it('fait le tour des quatre niveaux, chacun depuis une île à lui', () => {
    expect(NIVEAUX_MESURES).toEqual(['6e', '5e', '4e', '3e']);
    for (const niveau of NIVEAUX_MESURES) expect(getBiome(ileDuNiveau(niveau) ?? '')?.classe).toBe(niveau);
  });

  it('résume chaque niveau par son pire : le tableau commence par une ligne par niveau', () => {
    const lignes = [
      { niveau: '6e', etape: 'à l’arrivée', appels: 30, triangles: 90000, ips: 58, pire: 40 },
      { niveau: '6e', etape: 'Carte', appels: 45, triangles: 80000, ips: 50, pire: 70 },
      { niveau: '5e', etape: 'à l’arrivée', appels: 20, triangles: 100000, ips: 60, pire: 20 },
    ];
    expect(resumeParNiveau(lignes)).toEqual([
      { niveau: '6e', ips: 50, pire: 70, triangles: 90000, appels: 45 },
      { niveau: '5e', ips: 60, pire: 20, triangles: 100000, appels: 20 },
    ]);
    const t = tableauDesMesures(lignes, 'iPad').split('\n');
    expect(t[2]).toMatch(/^\| Niveau \| Images\/s/);
    expect(t[4]).toMatch(/^\| 6e \| 50 \| 70 \| 90/);
    expect(t).toContain('| 5e | à l’arrivée | 20 | 100\u202f000 | 60 | 20 |');
  });
});
