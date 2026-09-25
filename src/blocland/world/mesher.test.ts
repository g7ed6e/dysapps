import type { VoxelCube } from '../Voxel';
import { buildMesh, faceCount } from './mesher';

const cube = (x: number, y: number, z: number, texture = 'terre'): VoxelCube => ({ x, y, z, color: '#94694a', texture });

it('garde les six faces d’un cube seul, et cache les faces collées', () => {
  expect(faceCount(buildMesh([cube(0, 0, 0)]))).toBe(6);
  expect(faceCount(buildMesh([cube(0, 0, 0), cube(1, 0, 0)]))).toBe(10);
  // Une colonne de trois : 6 + 6 + 6 − 4 faces cachées.
  expect(faceCount(buildMesh([cube(0, 0, 0), cube(0, 0, 1), cube(0, 0, 2)]))).toBe(14);
});

it('regroupe par texture et par face (dessus, dessous, côté) ou par couleur unie', () => {
  const groups = buildMesh([cube(0, 0, 0, 'herbe'), { x: 2, y: 0, z: 0, color: '#ff0000' }]);
  const keys = groups.map((g) => g.key).sort();
  expect(keys).toEqual(['tex:herbe:bottom', 'tex:herbe:side', 'tex:herbe:top', 'tint:#ff0000']);
  const side = groups.find((g) => g.key === 'tex:herbe:side')!;
  expect(side.indices.length / 6).toBe(4);
  expect(side.positions.length / 3).toBe(16);
  expect(side.uvs.length / 2).toBe(16);
});

it('oriente chaque face vers l’extérieur (normale = direction)', () => {
  const groups = buildMesh([cube(0, 0, 0)]);
  for (const g of groups) {
    for (let f = 0; f < g.indices.length; f += 6) {
      const [i0, i1, i2] = [g.indices[f], g.indices[f + 1], g.indices[f + 2]];
      const p = (i: number) => g.positions.slice(i * 3, i * 3 + 3);
      const [a, b, c] = [p(i0), p(i1), p(i2)];
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const expected = g.normals.slice(i0 * 3, i0 * 3 + 3);
      expect(n[0] * expected[0] + n[1] * expected[1] + n[2] * expected[2]).toBeGreaterThan(0);
    }
  }
});

it('laisse voir à travers le verre', () => {
  // Terre à côté de verre : la face de la terre contre le verre reste visible ; celle du verre contre la terre est cachée.
  const groups = buildMesh([cube(0, 0, 0), cube(1, 0, 0, 'verre')]);
  expect(faceCount(groups)).toBe(11);
});

it('le village entier, tout construit, reste dans le budget de faces des tablettes', async () => {
  const { BIOMES } = await import('../biomes');
  const { PLANS, planCells } = await import('./plans');
  const { worldCubes } = await import('./terrain');
  const progress = Object.fromEntries(BIOMES.map((b) => [`${b.id}-x`, { stars: 3 }]));
  const plans = Object.fromEntries(PLANS.map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const groups = buildMesh(worldCubes(progress, { plans, journal: [], bridges: [] }));
  // Vingt îles avec leur terre, leur relief et leur roche flottante : sous les 30 000 faces, à l'aise pour une tablette.
  expect(faceCount(groups)).toBeLessThan(30000);
  expect(groups.length).toBeLessThan(60);
});
