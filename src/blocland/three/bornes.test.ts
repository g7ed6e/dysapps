import * as THREE from 'three';
import type { EnCasesDuMonde } from '../world/view';
import { creerBornes, pileDEtoiles } from './bornes';
import type { Instant, Monde } from './partie';

/** Les repères d'une île : un à faire (qui rebondit), un gagné (qui tourne), un chemin, et le fanion sur la Carte. */
function bornes() {
  const scene = new THREE.Scene();
  const bonhomme = new THREE.Object3D();
  bonhomme.position.set(4, 2, 6);
  const b = creerBornes({ scene } as Monde, () => bonhomme, { carte: true } as Instant);
  type Mission = NonNullable<EnCasesDuMonde['quests']>[number];
  const mission = (id: string, x: number, state: Mission['state']) => ({ id, biome: 'maths-6e-decimals', typeId: 't', cell: { x, y: 0, z: 1 }, state }) as Mission;
  b.poserLesMissions([mission('volcan:a', 0, 'new'), mission('volcan:b', 3, 2)]);
  b.poserLeChemin([0, 1, 2, 3].map((x) => ({ x, y: 5, z: 1 })));
  b.poserLaFleche({ x: 2, y: 2, z: 1 });
  const pose = () =>
    scene.children
      .flatMap((g) => [g, ...g.children])
      .filter((o) => o.visible)
      .map((o) => [o.position.toArray(), o.rotation.y, o.scale.x]);
  return { b, pose };
}

it('avec « Réduire les animations », le fanion, la flèche, les repères de mission et les balises du chemin ne bougent pas', () => {
  const { b, pose } = bornes();
  b.animer!(1.3, 0.016, true);
  const avant = JSON.stringify(pose());
  for (const t of [2.1, 4.7, 9]) {
    b.animer!(t, 0.016, true);
    expect(JSON.stringify(pose()), `t=${t}`).toBe(avant);
  }
  // Dans leur pose de base : le repère à faire à la hauteur de son socle, sans rotation ; les balises à leur taille.
  const aFaire = b.missions.children.find((g) => g.userData.bob)!;
  expect(aFaire.position.y).toBe(aFaire.userData.base);
  expect(aFaire.rotation.y).toBe(0);
  const nouveau = bornes();
  nouveau.b.animer!(0, 0.016, true);
  expect(JSON.stringify(nouveau.pose())).toBe(avant);
});

it('sans le réglage, ils bougent', () => {
  const { b, pose } = bornes();
  b.animer!(1.3, 0.016, false);
  const avant = JSON.stringify(pose());
  b.animer!(2.1, 0.016, false);
  expect(JSON.stringify(pose())).not.toBe(avant);
});

it('les étoiles gagnées d’une borne : une pile en un seul maillage (un appel de dessin), autant de cubes que d’étoiles', () => {
  const scene = new THREE.Scene();
  const b = creerBornes({ scene } as Monde, () => new THREE.Object3D(), { carte: false } as Instant);
  type Mission = NonNullable<EnCasesDuMonde['quests']>[number];
  const mission = (id: string, x: number, state: Mission['state']) => ({ id, biome: 'maths-6e-decimals', typeId: 't', cell: { x, y: 0, z: 1 }, state }) as Mission;
  b.poserLesMissions([mission('volcan:a', 0, 3), mission('volcan:b', 3, 1)]);
  const [trois, une] = b.missions.children;
  expect(trois.children).toHaveLength(1);
  expect(une.children).toHaveLength(1);
  const cubes = (g: THREE.Object3D) => ((g.children[0] as THREE.Mesh).geometry.getAttribute('position').count / 36);
  expect(cubes(trois)).toBe(3);
  expect(cubes(une)).toBe(1);
  // La pile monte de 0,6 par étoile, comme avant.
  const box = new THREE.Box3().setFromObject(trois.children[0]);
  expect(box.max.y - box.min.y).toBeCloseTo(1.2 + 0.45, 3);
  b.dispose();
});

it('pileDEtoiles : une géométrie neuve à chaque appel (vider la dispose sans toucher aux autres)', () => {
  const a = pileDEtoiles(2);
  const c = pileDEtoiles(2);
  expect(a).not.toBe(c);
  a.dispose();
  expect(c.getAttribute('position').count).toBe(72);
});
