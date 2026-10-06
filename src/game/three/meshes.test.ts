// Les couleurs unies d'un modèle réunies en un maillage (`meshesOf`) : la même image, un appel de dessin.
import * as THREE from 'three';
import { buildMesh, faceCount } from '../world/mesher';
import { meshesOf, meshOf } from './meshes';

const cubes = [
  { x: 0, y: 0, z: 0, color: '#d9453f' },
  { x: 1, y: 0, z: 0, color: '#f2c14e' },
  { x: 2, y: 0, z: 0, color: '#b56cd8' },
  { x: 3, y: 0, z: 0, color: '#94694a', texture: 'planches' },
];

it('réunit les couleurs unies en un maillage aux couleurs dans les sommets, garde un maillage par texture', () => {
  const groups = buildMesh(cubes);
  const meshes = meshesOf(groups);
  // Trois groupes de la texture (dessus, dessous, côtés), un pour les trois couleurs.
  expect(meshes).toHaveLength(4);
  const tints = meshes.filter((m) => m.geometry.getAttribute('color'));
  expect(tints).toHaveLength(1);
  const [mesh] = tints;
  expect((mesh.material as THREE.MeshLambertMaterial).vertexColors).toBe(true);
  // Tous les triangles sont là.
  const triangles = meshes.reduce((n, m) => n + m.geometry.index!.count / 3, 0);
  expect(triangles).toBe(faceCount(groups) * 2);
  // Chaque couleur d'avant, en linéaire comme celle de son matériau.
  const couleurs = mesh.geometry.getAttribute('color');
  const vues = new Set<string>();
  const c = new THREE.Color();
  for (let i = 0; i < couleurs.count; i++) vues.add(c.setRGB(couleurs.getX(i), couleurs.getY(i), couleurs.getZ(i)).getHexString());
  const avant = groups.filter((g) => !g.texture).map((g) => (meshOf(g).material as THREE.MeshLambertMaterial).color.getHexString());
  expect([...vues].sort()).toEqual(avant.sort());
});

it('sans couleur unie, un maillage par groupe, comme avant', () => {
  const groups = buildMesh([cubes[3]]);
  expect(meshesOf(groups)).toHaveLength(groups.length);
});
