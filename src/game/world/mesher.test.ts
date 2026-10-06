import type { VoxelCube } from './cube';
import { buildMesh, drawCallsOf, faceCount } from './mesher';

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

it('rendu Archipéo : un cube posé sur le sol en facettes garde son dessous caché, sans dessiner le sol', () => {
  const sol = [{ x: 0, y: 0, z: 0, color: '#6cb33f', texture: 'herbe', sol: true as const }];
  const borne = [{ x: 0, y: 0, z: 1, color: '#3a4a6a', texture: 'borne' }];
  const alone = buildMesh(borne);
  const posed = buildMesh(borne, sol);
  expect(faceCount(alone)).toBe(6);
  expect(faceCount(posed)).toBe(5);
  expect(posed.some((g) => g.face === 'bottom')).toBe(false);
  // Un fantôme garde toutes ses faces.
  expect(faceCount(buildMesh([{ ...borne[0], ghost: true }], sol))).toBe(6);
});

it('Blocland : ne dessine pas les dessous à la hauteur de l’eau ou plus bas, ceux d’un fantôme si', () => {
  const sousLEau = { hiddenBottomsUpTo: -1 };
  expect(faceCount(buildMesh([cube(0, 0, -2)], [], sousLEau))).toBe(5);
  expect(faceCount(buildMesh([cube(0, 0, -1)], [], sousLEau))).toBe(5);
  expect(faceCount(buildMesh([cube(0, 0, 0)], [], sousLEau))).toBe(6);
  expect(faceCount(buildMesh([{ ...cube(0, 0, -2), ghost: true }], [], sousLEau))).toBe(6);
});

it('compte un seul appel de dessin pour toutes les couleurs unies d’un modèle, un par texture ou fantôme', () => {
  const groups = buildMesh([
    cube(0, 0, 0, 'herbe'),
    { x: 2, y: 0, z: 0, color: '#ff0000' },
    { x: 4, y: 0, z: 0, color: '#00ff00' },
    { x: 6, y: 0, z: 0, color: '#0000ff', ghost: true },
  ]);
  expect(groups).toHaveLength(6);
  expect(drawCallsOf(groups)).toBe(5);
  expect(drawCallsOf(buildMesh([cube(0, 0, 0, 'herbe')]))).toBe(3);
});
