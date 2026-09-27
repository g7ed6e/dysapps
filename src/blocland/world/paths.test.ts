import type { VoxelCube } from '../Voxel';
import { walkGround, walkPath } from './paths';
import { avatarHome, avatarRoute, bridgePath, creaturePlacements, islandAt, worldCubes } from './terrain';
import { BRIDGES } from './archipelago';

const flat = (w: number, h: number, extra: VoxelCube[] = []): VoxelCube[] => {
  const out: VoxelCube[] = [];
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) out.push({ x, y, z: 0, color: '#0a0', texture: 'herbe' });
  return [...out, ...extra];
};

it('un chemin à pied contourne un arbre, ne marche pas sur l’eau et ne monte qu’un bloc à la fois', () => {
  // Un tronc au milieu du passage (x = 3, y de 0 à 3) : on passe au-dessus (y = 4).
  const trunk = [0, 1, 2, 3].map((y) => ({ x: 3, y, z: 1, color: '#840', texture: 'tronc', decor: 'test/arbre@3,' + y }));
  const ground = walkGround(flat(7, 6, trunk));
  const path = walkPath(ground, { x: 0, y: 0, z: 1 }, { x: 6, y: 0, z: 1 })!;
  expect(path[0]).toEqual({ x: 0, y: 0, z: 1 });
  expect(path[path.length - 1]).toEqual({ x: 6, y: 0, z: 1 });
  expect(path.some((p) => p.y >= 4)).toBe(true);
  // Une fleur s'enjambe : tout droit.
  const flower = walkGround(flat(7, 1, [{ x: 3, y: 0, z: 1, color: '#f0f', decor: 'test/fleur@3,0' }]));
  expect(walkPath(flower, { x: 0, y: 0, z: 1 }, { x: 6, y: 0, z: 1 })).toEqual([
    { x: 0, y: 0, z: 1 },
    { x: 6, y: 0, z: 1 },
  ]);
  // Une borne de mission, même d'un seul bloc : on passe à côté.
  const borne = walkGround(flat(7, 3, [{ x: 3, y: 0, z: 1, color: '#ca3', quest: 'test:quete' }]));
  expect(borne.feet.has('3,0')).toBe(false);
  expect(walkPath(borne, { x: 0, y: 0, z: 1 }, { x: 6, y: 0, z: 1 })!.some((p) => p.y === 1)).toBe(true);
  // Une rangée d'eau en travers : pas de chemin.
  const sea = walkGround(flat(7, 3).map((c) => (c.x === 3 ? { ...c, texture: 'eau' } : c)));
  expect(walkPath(sea, { x: 0, y: 1, z: 1 }, { x: 6, y: 1, z: 1 })).toBeNull();
  // Un mur de deux blocs : on le contourne, pas de marche de deux.
  const wall = [0, 1].flatMap((y) => [1, 2].map((z) => ({ x: 3, y, z, color: '#999', texture: 'pierre' })));
  const around = walkPath(walkGround(flat(7, 3, wall)), { x: 0, y: 0, z: 1 }, { x: 6, y: 0, z: 1 })!;
  expect(around.some((p) => p.y === 2)).toBe(true);
});

it('d’île en île, le bonhomme ne repasse pas par le milieu des îles traversées et contourne le décor', () => {
  const bridges = ['foret-plaine', 'plaine-riviere', 'foret-mine'];
  const village = { plans: {}, journal: [], bridges };
  const cubes = worldCubes('6e', {}, village);
  const ground = walkGround(cubes, creaturePlacements('6e', bridges));
  const route = avatarRoute('riviere', 'mine', bridges, ground)!;
  expect(route[0]).toEqual(avatarHome('riviere'));
  expect(route[route.length - 1]).toEqual(avatarHome('mine'));
  // La Plaine et la Forêt sont traversées : pas de détour par la place du bonhomme.
  for (const id of ['plaine', 'foret'] as const) {
    const home = avatarHome(id);
    expect(route.some((p) => p.x === home.x && p.y === home.y)).toBe(false);
  }
  // Chaque point hors ouvrage est une case libre du sol, et les pieds ne sautent jamais plus d'un bloc entre deux points.
  const deck = new Set(BRIDGES.filter((b) => bridges.includes(b.id)).flatMap((b) => bridgePath(b).map((c) => `${c.x},${c.y}`)));
  const homes = new Set(['riviere', 'mine'].map((id) => `${avatarHome(id as 'mine').x},${avatarHome(id as 'mine').y}`));
  for (const p of route) {
    const k = `${p.x},${p.y}`;
    if (deck.has(k) || homes.has(k)) continue;
    expect(ground.feet.get(k)).toBe(p.z);
  }
  // Une marche d'un bloc sur l'île ; deux au plus au pied d'un ouvrage (la dernière pierre de gué, posée sur le sol).
  for (let i = 1; i < route.length; i++) {
    const onDeck = deck.has(`${route[i].x},${route[i].y}`) || deck.has(`${route[i - 1].x},${route[i - 1].y}`);
    expect(Math.abs(route[i].z - route[i - 1].z)).toBeLessThanOrEqual(onDeck ? 2 : 1);
  }
  // Sur la Mine, il ne saute plus de la dernière pierre à sa place : il marche.
  const lastStone = route.map((p) => deck.has(`${p.x},${p.y}`)).lastIndexOf(true);
  expect(route.length - 1 - lastStone).toBeGreaterThanOrEqual(2);
  // Les îles traversées sont bien celles du chemin.
  expect(new Set(route.map((p) => islandAt('6e', p.x, p.y)))).toEqual(new Set(['riviere', 'plaine', 'foret', 'mine']));
});
