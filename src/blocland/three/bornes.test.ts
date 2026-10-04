import * as THREE from 'three';
import { casesDesTirets } from '../world/traceSuggere';
import type { EnCasesDuMonde } from '../world/view';
import { creerBornes, pileDEtoiles } from './bornes';
import type { Instant, Monde } from './partie';
import { HABILLAGES } from '../habillage';
import { SIGNE } from '../world/affordance';

/** Les repères d'une île : une borne à faire (rien : elle porte sa bulle), une gagnée, un chemin, la flèche. */
function bornes() {
  const scene = new THREE.Scene();
  const b = creerBornes({ scene, habillage: HABILLAGES.blocland } as unknown as Monde, { carte: true, now: 0 } as Instant);
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

it('avec le mouvement réduit de l’appareil, la flèche, les repères de mission et les balises du chemin ne bougent pas', () => {
  const { b, pose } = bornes();
  b.animer!(1.3, 0.016, true);
  const avant = JSON.stringify(pose());
  for (const t of [2.1, 4.7, 9]) {
    b.animer!(t, 0.016, true);
    expect(JSON.stringify(pose()), `t=${t}`).toBe(avant);
  }
  const nouveau = bornes();
  nouveau.b.animer!(0, 0.016, true);
  expect(JSON.stringify(nouveau.pose())).toBe(avant);
});

it('sans la préférence, ils bougent', () => {
  const { b, pose } = bornes();
  b.animer!(1.3, 0.016, false);
  const avant = JSON.stringify(pose());
  b.animer!(2.1, 0.016, false);
  expect(JSON.stringify(pose())).not.toBe(avant);
});

it('les étoiles gagnées d’une borne : une pile en un seul maillage (un appel de dessin), autant de cubes que d’étoiles', () => {
  const scene = new THREE.Scene();
  const b = creerBornes({ scene, habillage: HABILLAGES.blocland } as unknown as Monde, { carte: false } as Instant);
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

it('sur un ouvrage (GD-7), la flèche dit lequel, pose sa pointe au-dessus de sa place et garde les autres ; sur une case, pas de flèche de la Carte', () => {
  const { b } = bornes();
  const c = (x: number) => ({ x, y: 20, z: 3 });
  const trace = [c(7), c(8), c(9), c(10), c(11), c(12)];
  b.poserLaFleche({ ouvrage: 'a-b', depuis: 'french-6e-phonology', arrivee: 'english-6e-grammar', cell: c(10), places: [c(10), c(11)], trace, tirets: trace });
  expect(b.donneesDeLaFleche()).toMatchObject({ island: null, ouvrage: 'a-b', depuis: 'french-6e-phonology', arrivee: 'english-6e-grammar', on: true, pointe: { x: 10.5, y: 20.5, z: 5 } });
  expect(b.donneesDeLaFleche().pointes).toEqual([
    { x: 10.5, y: 20.5, z: 5 },
    { x: 11.5, y: 20.5, z: 5 },
  ]);
  // Le tracé, en points du monde, que les étiquettes évitent si elles peuvent.
  expect(b.donneesDeLaFleche().trace?.[0]).toEqual({ x: 7.5, y: 20.5, z: 4 });
  b.poserLaFleche('french-6e-phonology');
  expect(b.donneesDeLaFleche()).toMatchObject({ island: 'french-6e-phonology', ouvrage: null, arrivee: null, trace: null });
  expect(b.donneesDeLaFleche().pointe).not.toBeNull();
  // Le chantier du navire : une case, la petite flèche seule.
  b.poserLaFleche({ x: 2, y: 2, z: 1 });
  expect(b.donneesDeLaFleche()).toMatchObject({ island: null, ouvrage: null, pointe: null });
  b.poserLaFleche(null);
  expect(b.donneesDeLaFleche()).toMatchObject({ on: false, pointe: null });
});

it('sur la Carte, le tracé de l’ouvrage désigné (GD-7) : un seul maillage, avec la flèche seulement, immobile', () => {
  const scene = new THREE.Scene();
  const instant = { carte: true } as Instant;
  const b = creerBornes({ scene, habillage: HABILLAGES.blocland } as unknown as Monde, instant);
  const trace = () => scene.getObjectByName('trace-suggere') as THREE.Mesh;
  const c = (x: number) => ({ x, y: 20, z: 3 });
  const liaison = [0, 1, 2, 3, 4, 5, 6].map(c);
  b.poserLaFleche({ ouvrage: 'a-b', cell: c(3), places: [c(3)], trace: liaison, tirets: casesDesTirets(liaison) });
  b.animer!(1, 0.016, false);
  expect(trace().visible).toBe(true);
  // Sept cases : cinq tirets (deux cases sur trois, et la rive d'arrivée), de 12 triangles chacun.
  expect(trace().geometry.getAttribute('position').count / 3).toBe(5 * 12);
  const avant = trace().geometry.getAttribute('position').array.slice();
  b.animer!(2.7, 0.016, false);
  expect(trace().geometry.getAttribute('position').array).toEqual(avant);
  // Hors de la Carte, ou la flèche sur une île : pas de tracé.
  instant.carte = false;
  b.animer!(3, 0.016, false);
  expect(trace().visible).toBe(false);
  instant.carte = true;
  b.poserLaFleche('french-6e-phonology');
  b.animer!(3, 0.016, false);
  expect(trace().visible).toBe(false);
  b.dispose();
  expect(scene.getObjectByName('trace-suggere')).toBeUndefined();
});

describe('Les étoiles gagnées', () => {
  type Mission = NonNullable<EnCasesDuMonde['quests']>[number];
  const mission = (id: string, x: number, state: Mission['state']) => ({ id, biome: 'maths-6e-decimals', typeId: 't', cell: { x, y: 0, z: 1 }, state }) as Mission;
  const blocland = (instant = { carte: false, now: 0 } as Instant) => {
    const scene = new THREE.Scene();
    return { b: creerBornes({ scene, habillage: HABILLAGES.blocland } as unknown as Monde, instant), instant };
  };

  it('pas de repère sur une borne à faire (elle porte sa bulle), les étoiles gagnées seulement, au-dessus de l’ardoise de la borne', () => {
    const { b } = blocland();
    b.poserLesMissions([mission('volcan:a', 0, 'new'), mission('volcan:b', 3, 2), mission('volcan:c', 6, 'locked')], new Map([['volcan:b', 4]]));
    expect(b.missions.children).toHaveLength(1);
    const [pile] = b.missions.children;
    expect(pile.userData.quest).toBe('volcan:b');
    // Le sommet donné (le dessus de l'ardoise), + 0,4, comme avant ; sans sommet, trois cubes au-dessus de sa case.
    expect(pile.position.y).toBeCloseTo(4.4, 9);
    b.poserLesMissions([mission('volcan:b', 3, 2)]);
    expect(b.missions.children[0].position.y).toBeCloseTo(1 + 3.4, 9);
  });

  it('touchée, la pile d’étoiles fait le petit saut, puis reprend sa place ; rien avec le mouvement réduit', () => {
    const { b, instant } = blocland();
    b.poserLesMissions([mission('volcan:b', 3, 2)]);
    const pile = b.missions.children[0];
    const base = pile.userData.base as number;
    expect(b.sauterLaPile('volcan:a')).toBe(false);
    expect(b.sauterLaPile('volcan:b')).toBe(true);
    instant.now = SIGNE.saut.monteeMs;
    b.animer!(1, 0.016, false);
    expect(pile.position.y).toBeCloseTo(base + SIGNE.saut.hauteur, 9);
    instant.now = SIGNE.saut.monteeMs + SIGNE.saut.descenteMs + 1;
    b.animer!(1.2, 0.016, false);
    expect(pile.position.y).toBe(base);
    b.sauterLaPile('volcan:b');
    instant.now += SIGNE.saut.monteeMs;
    b.animer!(1.4, 0.016, true);
    expect(pile.position.y).toBe(base);
    expect(pile.rotation.y).toBe(0);
  });
  it('la pile d’étoiles ne tourne pas : la bulle mise en avant est seule à bouger', () => {
    const { b } = blocland();
    b.poserLesMissions([mission('volcan:b', 3, 2)]);
    const pile = b.missions.children[0];
    for (const t of [0.5, 2, 7.3]) {
      b.animer!(t, 0.016, false);
      expect(pile.rotation.y, `t=${t}`).toBe(0);
    }
  });
});
