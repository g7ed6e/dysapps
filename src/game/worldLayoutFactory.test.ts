// La fabrique de disposition : le monde continu seulement avec `?monde=ouvert`, dans Archipéo, au 6e et au 5e (GD-22,
// lot 2) ; la grille partout ailleurs, et toujours pour Blocland.
import { describe, expect, it } from 'vitest';
import { openWorldRequested, worldLayoutFor } from './worldLayoutFactory';

describe('La fabrique de disposition du monde', () => {
  it('lit le drapeau avant le #', () => {
    expect(openWorldRequested('http://localhost/?monde=ouvert#/adventure')).toBe(true);
    expect(openWorldRequested('http://localhost/?rendu=archipeo&monde=ouvert#/adventure/french-6e-phonology')).toBe(true);
    expect(openWorldRequested('http://localhost/#/adventure?monde=ouvert')).toBe(false);
    expect(openWorldRequested('http://localhost/?monde=grille#/adventure')).toBe(false);
  });

  it('le monde continu : avec le drapeau, dans Archipéo, au 6e et au 5e, pour le monde ou une île de son archipel', () => {
    expect(worldLayoutFor({ requested: true, rendu: 'archipeo', archipelago: '6e' })).toBe('continuous');
    expect(worldLayoutFor({ requested: true, rendu: 'archipeo', archipelago: '6e', route: 'maths-6e-fractions' })).toBe('continuous');
    expect(worldLayoutFor({ requested: true, rendu: 'archipeo', archipelago: '5e' })).toBe('continuous');
    expect(worldLayoutFor({ requested: true, rendu: 'archipeo', archipelago: '5e', route: 'maths-5e-proportionality' })).toBe('continuous');
  });

  it('la grille partout ailleurs : sans drapeau, dans Blocland, dans un autre archipel, sur la Carte ou un panneau', () => {
    expect(worldLayoutFor({ requested: false, rendu: 'archipeo', archipelago: '6e' })).toBe('grid');
    expect(worldLayoutFor({ requested: true, rendu: 'blocs', archipelago: '6e' })).toBe('grid');
    expect(worldLayoutFor({ requested: true, rendu: 'blocs', archipelago: '5e' })).toBe('grid');
    expect(worldLayoutFor({ requested: true, rendu: 'archipeo', archipelago: '4e' })).toBe('grid');
    expect(worldLayoutFor({ requested: true, rendu: 'archipeo', archipelago: '5e', route: 'maths-6e-fractions' })).toBe('grid');
    for (const route of ['map', 'school', 'stock', 'world', 'maths-5e-proportionality']) expect(worldLayoutFor({ requested: true, rendu: 'archipeo', archipelago: '6e', route })).toBe('grid');
  });
});
