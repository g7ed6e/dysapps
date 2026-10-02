// Garde du lot 7b : l'architecture modulaire (le kit des Premiers Rivages, rempli) ne passe jamais dans le rendu de
// Blocland. Sans WebGL (jsdom), on vérifie l'arbre de la scène : aucun matériau de la construction taillée, aucun motif
// peint, aucune pièce ; exactement les cubes du monde en blocs.
import * as THREE from 'three';
import { HABILLAGES, type Habillage } from '../habillage';
import { toutConstruit } from '../world/budget';
import { maillageDeLaConstruction } from '../world/construction';
import { buildMesh } from '../world/mesher';
import { worldCubes } from '../world/terrain';
import { KITS } from '../world/architecture';
import { creerCubes } from './cubes';
import type { Large } from './large';
import type { Lumiere } from './lumiere';
import type { Instant, Monde } from './partie';
import type { VoxelCube } from '../Voxel';
import { GESTE_DE_POSE } from '../world/pose';
import { BADGES } from '../../core/progress';
import { trophyBlock } from '../trophies';

function monde(habillage: Habillage): Monde {
  return { scene: new THREE.Scene(), archipel: '6e', habillage, surface: null, etendue: { minX: 0, maxX: 10, minY: 0, maxY: 10 }, centre: { x: 5, y: 5 }, largeur: 10 };
}

describe('Le rendu de Blocland ne montre aucune pièce d’architecture', () => {
  const { progress, world: village } = toutConstruit();
  const cubes = worldCubes('6e', progress, village, false);

  it('le kit du 6e est rempli, et le monde d’Archipéo en a des murs peints', () => {
    expect(Object.keys(KITS['6e'].pieces).length).toBeGreaterThan(0);
    const m = maillageDeLaConstruction('6e', cubes.filter((c) => !c.sol));
    expect(m.opaque.motifs.some((v) => v > 0)).toBe(true);
  });

  // Avec les 24 succès (GD-3) : la salle des trophées et ses deux travées, en cubes entiers comme le reste.
  const salleEntiere = worldCubes('6e', progress, village, false, BADGES.map((b) => trophyBlock(b.id)));

  it.each([
    ['sans succès', cubes],
    ['avec les 24 succès (la salle et ses deux travées)', salleEntiere],
  ])('Blocland aux Premiers Rivages, tout construit, %s : les cubes du monde en blocs, sans motif ni pièce', (_, cubes) => {
    const m = monde(HABILLAGES.blocland);
    const lumiere = { nuit: () => 0, suivre: () => {} } as unknown as Lumiere;
    const c = creerCubes(m, { rivage: () => {} } as unknown as Large, lumiere, {} as Instant);
    c.poser(cubes);
    expect(c.materiaux).toBeNull();
    const maillages: THREE.Mesh[] = [];
    m.scene.traverse((o) => {
      if (o instanceof THREE.Mesh && o.geometry.getAttribute('position').count > 0) maillages.push(o);
    });
    // Aucun attribut de motif, aucun shader complété : la construction d'Archipéo (three/construction.ts) peint ses
    // murs dans `onBeforeCompile` ; les matériaux de Blocland gardent celui de Three.js, qui ne fait rien.
    expect(maillages.length).toBeGreaterThan(0);
    for (const o of maillages) {
      expect(o.geometry.getAttribute('motif')).toBeUndefined();
      const mats = ([] as THREE.Material[]).concat(o.material);
      for (const x of mats) {
        expect(x).not.toBeInstanceOf(THREE.ShaderMaterial);
        expect(x.onBeforeCompile).toBe(THREE.Material.prototype.onBeforeCompile);
      }
    }
    // Exactement les triangles du monde en blocs (world/mesher.ts), cube pour cube.
    const tri = (g: THREE.BufferGeometry) => (g.index ? g.index.count : g.getAttribute('position').count) / 3;
    const attendus = buildMesh(cubes).reduce((n, g) => n + g.indices.length / 3, 0);
    expect(maillages.reduce((n, o) => n + tri(o.geometry), 0)).toBe(attendus);
    c.dispose();
  });
});

describe('Le geste de pose de Blocland (GD-1, point 4)', () => {
  const lumiere = { nuit: () => 0, suivre: () => {} } as unknown as Lumiere;
  const avant = [
    { x: 0, y: 0, z: 0, texture: 'herbe' },
    { x: 1, y: 0, z: 0, texture: 'planches', ghost: true },
  ] as VoxelCube[];
  const apres = [avant[0], { x: 1, y: 0, z: 0, texture: 'planches' }] as VoxelCube[];
  const triangles = (o: THREE.Object3D) => {
    let n = 0;
    o.traverse((x) => {
      if (x instanceof THREE.Mesh) n += (x.geometry.index?.count ?? 0) / 3;
    });
    return n;
  };
  const attendus = () => buildMesh(apres).reduce((t, g) => t + g.indices.length / 3, 0);
  const scene = () => {
    const m = monde(HABILLAGES.blocland);
    const c = creerCubes(m, { rivage: () => {} } as unknown as Large, lumiere, { now: 0 } as Instant);
    c.poser(avant);
    // Le terrain est le premier groupe de la scène ; le bloc qui descend, le dernier objet ajouté.
    return { m, c, terrain: m.scene.children[0] };
  };

  it('le dernier bloc descend sans rebond, le terrain garde le fantôme, puis tout s’enclenche en un maillage', () => {
    const { m, c, terrain } = scene();
    const avecFantome = triangles(terrain);
    const n = m.scene.children.length;
    c.enclencher(apres[1]);
    c.poser(apres);
    // Pendant la descente : le terrain d'avant (le fantôme attend dans la case) et un seul bloc de plus.
    expect(triangles(terrain)).toBe(avecFantome);
    expect(m.scene.children.length).toBe(n + 1);
    const bloc = m.scene.children[n];
    // Image par image : la première le montre en haut ; une image longue (0,1 s) ne le fait avancer que d'un pas.
    const hauteurs: number[] = [];
    for (const dt of [0.016, 0.03, 0.1, 0.03, 0.03, 0.03]) {
      c.animer!(0, dt, false);
      hauteurs.push(bloc.position.y);
    }
    expect(hauteurs[0]).toBe(GESTE_DE_POSE.hauteur);
    for (let i = 1; i < hauteurs.length; i++) expect(hauteurs[i]).toBeLessThan(hauteurs[i - 1]);
    expect(Math.min(...hauteurs)).toBeGreaterThan(0);
    // À l'arrêt : le bloc qui descendait s'en va, le terrain reçoit les cubes posés, en un seul maillage.
    for (let i = 0; i < 20 && m.scene.children.length > n; i++) c.animer!(0, 0.03, false);
    expect(m.scene.children.length).toBe(n);
    expect(triangles(terrain)).toBe(attendus());
    c.dispose();
  });

  it('coupé quand l’appareil demande moins d’animations : posé tout de suite', () => {
    const { m, c, terrain } = scene();
    const n = m.scene.children.length;
    c.enclencher(apres[1]);
    c.poser(apres);
    c.animer!(0, 0.016, true);
    expect(m.scene.children.length).toBe(n);
    expect(triangles(terrain)).toBe(attendus());
    c.dispose();
  });
});
