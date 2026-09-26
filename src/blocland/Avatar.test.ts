import { AVATAR_CUBES, AVATAR_PARTS, AVATAR_SCALE } from './Avatar';

it('le bonhomme a les proportions classiques : 16 de large, 8 de profond, 32 de haut, en seizièmes de bloc', () => {
  const xs = AVATAR_CUBES.map((c) => c.x);
  const ys = AVATAR_CUBES.map((c) => c.y);
  const zs = AVATAR_CUBES.map((c) => c.z);
  expect([Math.min(...xs), Math.max(...xs)]).toEqual([0, 15]);
  expect([Math.min(...ys), Math.max(...ys)]).toEqual([0, 7]);
  expect([Math.min(...zs), Math.max(...zs)]).toEqual([0, 31]);
  expect((Math.max(...zs) + 1) * AVATAR_SCALE).toBe(2);
  expect(AVATAR_PARTS.map((p) => p.name)).toEqual(['tete', 'corps', 'bras-gauche', 'bras-droit', 'jambe-gauche', 'jambe-droite']);
  // Un visage devant : deux yeux et une bouche sur la face y = 0 de la tête.
  const face = AVATAR_PARTS[0].cubes.filter((c) => c.y === 0);
  expect(face.filter((c) => c.color === '#2f5fb5')).toHaveLength(2);
  expect(face.some((c) => c.color === '#a0522d')).toBe(true);
  // Aucun cube en double.
  expect(new Set(AVATAR_CUBES.map((c) => `${c.x},${c.y},${c.z}`)).size).toBe(AVATAR_CUBES.length);
});
