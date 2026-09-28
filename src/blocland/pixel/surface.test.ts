import { PRIORITY, materialOf, surfaceOf } from './surface';

it('le sol vu de dessus : le bloc le plus haut de chaque colonne, sans décor ni fantôme', () => {
  const s = surfaceOf([
    { x: 0, y: 0, z: 0, color: '#000', texture: 'terre' },
    { x: 0, y: 0, z: 1, color: '#000', texture: 'herbe' },
    { x: 0, y: 0, z: 2, color: '#000', texture: 'feuilles', decor: 'foret/arbre@0,0' },
    { x: 0, y: 0, z: 3, color: '#000', ghost: true },
  ]);
  expect(s.get('0,0')).toEqual({ z: 1, material: 'herbe' });
  expect(materialOf({ x: 0, y: 0, z: 0, color: '#000', texture: 'planches' })).toBe('autre');
  expect(PRIORITY.herbe).toBeGreaterThan(PRIORITY.sable);
});

it('chaque sol du paysage a sa matière dessinée ; les sols en grain deviennent un dallage, les motifs restent', async () => {
  const { isGrainy } = await import('./tiles');
  for (const t of ['herbe', 'sable', 'terre', 'pierre', 'eau', 'nuage', 'mousse', 'basalte', 'lave', 'glace'])
    expect(materialOf({ x: 0, y: 0, z: 0, color: '#000', texture: t }), t).not.toBe('autre');
  expect(isGrainy('obsidienne')).toBe(true);
  expect(isGrainy('planches')).toBe(false);
  expect(isGrainy(undefined)).toBe(false);
  // La lave, liquide, ne déborde sur rien ; l'herbe déborde sur la mousse.
  expect(PRIORITY.lave).toBeLessThan(PRIORITY.sable);
  expect(PRIORITY.herbe).toBeGreaterThan(PRIORITY.mousse);
});

it('le bonhomme regarde là où il va : vers le nord, il montre son dos', async () => {
  const { facingOf } = await import('./characters');
  expect(facingOf({ dx: 0, dy: 1 })).toBe('up');
  expect(facingOf({ dx: 0, dy: -1 })).toBe('down');
  expect(facingOf({ dx: 2, dy: 1 })).toBe('right');
  expect(facingOf({ dx: -2, dy: -1 })).toBe('left');
});
