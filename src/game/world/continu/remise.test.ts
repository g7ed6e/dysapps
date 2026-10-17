// La remise (GD-20, point 4, lot L1 « Livrer ») : les phrases des habitants et leurs jetons, le temps de la pose (« Réduire les animations » : tout d'un coup), le délai sans voix.
import { describe, expect, it } from 'vitest';
import { HABITANT_PHRASES, REMISE_TIMING, capitalized, filled, remiseAt, remiseDuration, voiceFallbackMs, VOICE_FALLBACK } from './remise';

const potager = { objet: '3 blocs de terre', blocs: 'blocs de terre', nom: 'le potager', auLieu: 'aux Filets' } as const;

describe('Les phrases des habitants', () => {
  it('viennent de docs/contenu/monde-ouvert.md, leurs jetons remplacés', () => {
    expect(filled(HABITANT_PHRASES.ask, potager)).toBe('Il me faut 3 blocs de terre. C’est pour le potager. Joue une mission aux Filets.');
    expect(filled(HABITANT_PHRASES.ready, { ...potager, auLieu: 'au Phare' })).toBe('Livre 3 blocs de terre au Phare.');
    expect(filled(HABITANT_PHRASES.remise, potager)).toBe('Tu livres 3 blocs de terre pour le potager.');
    expect(filled(HABITANT_PHRASES.done, potager)).toBe('Le potager est en place.');
    expect(filled(HABITANT_PHRASES.done, { ...potager, nom: 'la vitrine' })).toBe('La vitrine est en place.');
    expect(filled(HABITANT_PHRASES.askAssembled, { ...potager, objet: '2 madriers', blocs: 'madriers', nom: 'la grue', auLieu: 'à l’Entrepôt des matériaux' })).toBe(
      'Il me faut 2 madriers. C’est pour la grue. Assemble les madriers à l’Entrepôt des matériaux.',
    );
  });

  it('refusent un jeton inconnu, et une accolade restée seule', () => {
    expect(() => filled('Livre {rien}.', potager)).toThrow('{rien}');
    expect(() => filled('Livre {objet {au lieu}.', potager)).toThrow();
    expect(() => filled('Livre {objet} au lieu}.', potager)).toThrow('Accolade seule');
  });

  it('mettent la capitale, même après une élision', () => {
    expect(capitalized('l’urne')).toBe('L’urne');
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
});

describe('Sans voix', () => {
  it('la pose part après le temps de lire pour un lecteur dyslexique : 1,5 s et 110 ms par caractère, de 3 à 8 s', () => {
    expect(voiceFallbackMs('Tu livres 3 blocs de terre pour le potager.')).toBe(1500 + 43 * 110);
    const court = voiceFallbackMs('Tu livres 2 cubes pour l’urne.');
    const long = voiceFallbackMs('Tu livres 4 blocs de mousse pour l’étagère à flacons.');
    expect(long).toBeGreaterThan(court);
    expect(voiceFallbackMs('')).toBe(VOICE_FALLBACK.min);
    expect(voiceFallbackMs('x'.repeat(500))).toBe(VOICE_FALLBACK.max);
  });
});
