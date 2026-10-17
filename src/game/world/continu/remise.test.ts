// La remise (GD-20, point 4, lot L1 « Livrer ») : les phrases des habitants et leurs jetons, l'accord de « posé », la
// forme « à » d'un lieu, le temps de la pose (« Réduire les animations » : tout d'un coup), le délai sans voix.
import { describe, expect, it } from 'vitest';
import { HABITANT_PHRASES, REMISE_TIMING, agreedPosed, atForm, capitalized, filled, remiseAt, remiseDuration, voiceFallbackMs, VOICE_FALLBACK } from './remise';

const potager = { objet: '3 pierres', blocs: 'pierres', nom: 'le potager', genre: 'm', auLieu: 'aux Filets' } as const;

describe('Les phrases des habitants', () => {
  it('viennent de docs/contenu/monde-ouvert.md, leurs jetons remplacés', () => {
    expect(filled(HABITANT_PHRASES.ask, potager)).toBe('Il me faut 3 pierres pour le potager. Joue une mission aux Filets.');
    expect(filled(HABITANT_PHRASES.ready, { ...potager, auLieu: 'au Phare' })).toBe('Livre les 3 pierres au Phare.');
    expect(filled(HABITANT_PHRASES.remise, potager)).toBe('Tu livres 3 pierres pour le potager.');
    expect(filled(HABITANT_PHRASES.done, potager)).toBe('Le potager est posé.');
    expect(filled(HABITANT_PHRASES.done, { ...potager, nom: 'la vitrine', genre: 'f' })).toBe('La vitrine est posée.');
    expect(filled(HABITANT_PHRASES.done, { ...potager, nom: 'l’établi' })).toBe('L’établi est posé.');
    expect(filled(HABITANT_PHRASES.askAssembled, { ...potager, objet: '2 madriers', blocs: 'madriers', nom: 'la grue', genre: 'f', auLieu: 'au Chantier de l’Escale' })).toBe(
      'Il me faut 2 madriers pour la grue. Assemble les madriers au Chantier de l’Escale.',
    );
  });

  it('refusent un jeton inconnu', () => {
    expect(() => filled('Livre {rien}.', potager)).toThrow('{rien}');
  });

  it('accordent « posé », mettent la capitale, et disent un lieu dans sa forme « à »', () => {
    expect(agreedPosed('m')).toBe('posé');
    expect(agreedPosed('f')).toBe('posée');
    expect(capitalized('l’urne')).toBe('L’urne');
    expect(atForm('Le Chantier de l’Escale')).toBe('au Chantier de l’Escale');
    expect(atForm('La Halle')).toBe('à la Halle');
    expect(atForm('L’Escale')).toBe('à l’Escale');
    expect(atForm('Les Quais')).toBe('aux Quais');
    expect(atForm('Lisbonne')).toBe('à Lisbonne');
  });
});

describe('Le temps de la pose', () => {
  it('un calme, puis chaque élément descend à sa place, l’un après l’autre', () => {
    expect(remiseAt(0, 3, false)).toEqual({ posed: 0, falling: null, done: false });
    expect(remiseAt(REMISE_TIMING.settle + 0.2, 3, false)).toEqual({ posed: 0, falling: { index: 0, amount: expect.closeTo(0.5, 5) }, done: false });
    expect(remiseAt(REMISE_TIMING.settle + REMISE_TIMING.element * 2.5, 3, false)).toEqual({ posed: 2, falling: { index: 2, amount: expect.closeTo(0.5, 5) }, done: false });
    expect(remiseAt(remiseDuration(3), 3, false)).toEqual({ posed: 3, falling: null, done: true });
  });

  it('avec « Réduire les animations », tout est posé d’un coup', () => {
    expect(remiseAt(0, 4, true)).toEqual({ posed: 4, falling: null, done: true });
  });

  it('reste courte : de deux à quatre éléments, la pose et la consigne tiennent dans les 8 à 10 s du directeur artistique', () => {
    for (const n of [2, 3, 4]) expect(remiseDuration(n) + VOICE_FALLBACK.max / 1000).toBeLessThanOrEqual(10);
  });
});

describe('Sans voix', () => {
  it('la pose part après un délai borné, plus long pour une consigne plus longue', () => {
    const court = voiceFallbackMs('Tu livres 2 cubes pour l’urne.');
    const long = voiceFallbackMs('Tu livres 4 blocs de mousse pour l’étagère à flacons.');
    expect(long).toBeGreaterThan(court);
    expect(voiceFallbackMs('')).toBe(VOICE_FALLBACK.min);
    expect(voiceFallbackMs('x'.repeat(500))).toBe(VOICE_FALLBACK.max);
  });
});
