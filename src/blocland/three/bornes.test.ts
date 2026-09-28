import * as THREE from 'three';
import type { QuestMark } from '../world/view';
import { creerBornes } from './bornes';
import type { Instant, Monde } from './partie';

/** Les repères d'une île : un à faire (qui rebondit), un gagné (qui tourne), un chemin, et le fanion sur la Carte. */
function bornes() {
  const scene = new THREE.Scene();
  const bonhomme = new THREE.Object3D();
  bonhomme.position.set(4, 2, 6);
  const b = creerBornes({ scene } as Monde, () => bonhomme, { carte: true } as Instant);
  const mission = (id: string, x: number, state: QuestMark['state']) => ({ id, biome: 'volcan', typeId: 't', cell: { x, y: 0, z: 1 }, state }) as QuestMark;
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
