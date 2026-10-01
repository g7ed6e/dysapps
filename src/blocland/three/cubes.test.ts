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

function monde(habillage: Habillage): Monde {
  return { scene: new THREE.Scene(), archipel: '6e', habillage, surface: null, etendue: { minX: 0, maxX: 10, minY: 0, maxY: 10 }, centre: { x: 5, y: 5 }, largeur: 10 };
}

describe('Le rendu de Blocland ne montre aucune pièce d’architecture', () => {
  const { progress, village } = toutConstruit();
  const cubes = worldCubes('6e', progress, village, false);

  it('le kit du 6e est rempli, et le monde d’Archipéo en a des murs peints', () => {
    expect(Object.keys(KITS['6e'].pieces).length).toBeGreaterThan(0);
    const m = maillageDeLaConstruction('6e', cubes.filter((c) => !c.sol));
    expect(m.opaque.motifs.some((v) => v > 0)).toBe(true);
  });

  it('Blocland aux Premiers Rivages, tout construit : les cubes du monde en blocs, sans motif ni pièce', () => {
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
