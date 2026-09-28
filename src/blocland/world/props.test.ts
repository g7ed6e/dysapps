import { worldCubes } from './terrain';
import { PROP_KINDS, kindOf, propsOf } from './props';

it('le décor d’une île devient des objets (un par élément), et quitte le terrain', () => {
  const cubes = worldCubes('6e', {});
  const { props, terrain } = propsOf(cubes);
  expect(props.some((p) => p.kind === 'arbre')).toBe(true);
  expect(new Set(props.map((p) => p.id)).size).toBe(props.length);
  for (const p of props) expect(PROP_KINDS).toContain(p.kind);
  // Aucun cube d'un élément dessiné en sprite ne reste dans le terrain.
  expect(terrain.some((c) => c.decor && (PROP_KINDS as readonly string[]).includes(kindOf(c.decor)))).toBe(false);
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

it('chaque borne de mission devient un panneau, une seule fois, et ses cubes quittent le terrain', () => {
  const cubes = worldCubes('6e', {});
  const { stations, terrain } = propsOf(cubes);
  const quests = new Set(cubes.filter((c) => c.quest).map((c) => c.quest));
  expect(stations.map((s) => s.quest).sort()).toEqual([...quests].sort());
  expect(terrain.some((c) => c.quest)).toBe(false);
  for (const s of stations) expect(Math.min(...cubes.filter((c) => c.quest === s.quest).map((c) => c.z))).toBe(s.z);
});

it('la 2D dessine un sprite par genre de décor rangé, ni plus ni moins', async () => {
  const { SPRITE_KINDS } = await import('../pixel/sprites');
  expect(SPRITE_KINDS).toBe(PROP_KINDS);
});
