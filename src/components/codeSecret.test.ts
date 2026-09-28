import { avancer, gesteDeGlissement, gesteDeTouche, gesteDeZone, LONGUEUR_SUITE, type Geste } from './codeSecret';

const suivre = (gestes: Geste[]) => gestes.reduce((pos, g) => avancer(pos, g), 0);
const FLECHES: Geste[] = ['haut', 'haut', 'bas', 'bas', 'gauche', 'droite', 'gauche', 'droite'];

describe('la suite de gestes', () => {
  it('se réussit au clavier et au doigt', () => {
    expect(suivre([...FLECHES, 'b', 'a'])).toBe(LONGUEUR_SUITE);
    expect(suivre([...FLECHES, 'toucher', 'toucher'])).toBe(LONGUEUR_SUITE);
  });

  it('repart de zéro sur un geste de travers', () => {
    expect(suivre(['haut', 'haut', 'bas', 'gauche'])).toBe(0);
    expect(suivre([...FLECHES, 'a', 'b'])).toBe(0);
  });

  it('pardonne un « haut » de trop au début', () => {
    expect(suivre(['haut', 'haut', 'haut', ...FLECHES.slice(2), 'b', 'a'])).toBe(LONGUEUR_SUITE);
    expect(suivre(['haut', 'bas', ...FLECHES, 'b', 'a'])).toBe(LONGUEUR_SUITE);
  });

  it('lit les touches et les glissements', () => {
    expect(gesteDeTouche('ArrowUp')).toBe('haut');
    expect(gesteDeTouche('B')).toBe('b');
    expect(gesteDeTouche('Enter')).toBeNull();
    expect(gesteDeGlissement(0, -80)).toBe('haut');
    expect(gesteDeGlissement(90, 10)).toBe('droite');
    expect(gesteDeGlissement(5, 5)).toBe('toucher');
  });
});

it('lit un toucher selon l’endroit du logo', () => {
  expect(gesteDeZone(50, 5, 100, 100)).toBe('haut');
  expect(gesteDeZone(50, 95, 100, 100)).toBe('bas');
  expect(gesteDeZone(5, 50, 100, 100)).toBe('gauche');
  expect(gesteDeZone(95, 50, 100, 100)).toBe('droite');
  expect(gesteDeZone(52, 48, 100, 100)).toBe('toucher');
});
