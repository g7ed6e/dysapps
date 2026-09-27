import { worldCubes } from '../world/terrain';
import { kindOf, propsOf } from './props';
import { SPRITE_KINDS } from './sprites';
import { PRIORITY, materialOf, surfaceOf } from './surface';

it('le décor d’une île devient des sprites (un par élément), et quitte le terrain', () => {
  const cubes = worldCubes('6e', {});
  const { props, terrain } = propsOf(cubes);
  expect(props.some((p) => p.kind === 'arbre')).toBe(true);
  expect(new Set(props.map((p) => p.id)).size).toBe(props.length);
  for (const p of props) expect(SPRITE_KINDS).toContain(p.kind);
  // Aucun cube d'un élément dessiné en sprite ne reste dans le terrain.
  expect(terrain.some((c) => c.decor && (SPRITE_KINDS as readonly string[]).includes(kindOf(c.decor)))).toBe(false);
  expect(terrain.length + props.length).toBeLessThan(cubes.length);
  // Un arbre pousse au pied de son tronc, sur le sol.
  const tree = props.find((p) => p.kind === 'arbre')!;
  const trunk = cubes.find((c) => c.decor === tree.id && c.texture === 'tronc' && c.z === tree.z);
  expect(trunk).toBeTruthy();
});

it('reconnaît le genre d’un élément de décor, dans le cœur comme dans le paysage', () => {
  expect(kindOf('foret/cœur:arbre@8,2')).toBe('arbre');
  expect(kindOf('mine/sapin@40,12')).toBe('sapin');
});

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
