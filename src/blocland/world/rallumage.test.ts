import { BIOMES } from '../biomes';
import { lueursDuDefi } from './personnages/allumage';
import { aRallumer, gardiensRallumes, MOMENTS_DE_SUITE, vusSansMoment } from './rallumage';

/** Les Gardiens rallumés au défi : une étoile au moins à leur défi. */
const rallumes = (...ids: string[]) => Object.fromEntries(ids.map((id) => [`${id}-gardien`, { stars: 2 }]));

describe('Le moment du rallumage (lot 6)', () => {
  it('attend, dans l’archipel de l’élève et dans l’ordre des îles, les Gardiens rallumés que l’appareil n’a pas vus', () => {
    const progress = rallumes('mine', 'foret', 'glacier');
    expect(gardiensRallumes(progress)).toEqual(['foret', 'mine', 'glacier']);
    expect(aRallumer(progress, '6e', {})).toEqual(['foret', 'mine']);
    expect(aRallumer(progress, '6e', { foret: true })).toEqual(['mine']);
    expect(aRallumer(progress, '5e', {})).toEqual(['glacier']);
  });

  it('au plus trois moments de suite : les suivants s’allument sans moment', () => {
    const six = BIOMES.filter((b) => b.classe === '6e').slice(0, 5).map((b) => b.id);
    const progress = rallumes(...six);
    expect(vusSansMoment(progress, '6e', {}, true)).toEqual(six.slice(MOMENTS_DE_SUITE));
    expect(MOMENTS_DE_SUITE).toBe(3);
  });

  it('sans sentinelles (Blocland, avant la bascule), tout Gardien rallumé est noté vu, partout : un passage à Archipéo n’en rejoue aucun', () => {
    const progress = rallumes('mine', 'glacier');
    expect(vusSansMoment(progress, '6e', {}, false)).toEqual(['mine', 'glacier']);
    expect(vusSansMoment(progress, '6e', { mine: true, glacier: true }, false)).toEqual([]);
  });
});

describe('Les lueurs d’une sentinelle au défi', () => {
  it('rien avant la première réussite, un premier pas qui se voit, pleines au seuil, jamais plus', () => {
    expect(lueursDuDefi(0, 5)).toBe(0);
    expect(lueursDuDefi(1, 5)).toBeCloseTo(0.44);
    expect(lueursDuDefi(5, 5)).toBe(1);
    expect(lueursDuDefi(7, 5)).toBe(1);
    // Elles ne font que monter.
    for (let n = 1; n <= 7; n++) expect(lueursDuDefi(n, 5)).toBeGreaterThanOrEqual(lueursDuDefi(n - 1, 5));
  });
});
