// Les personnages d'Archipéo dans la scène 3D (lot R6) : sans WebGL (jsdom), on vérifie l'arbre de la scène, le toucher,
// le matériau à lueur, « Réduire les animations » et la libération des ressources.
import * as THREE from 'three';
import { toutConstruit } from '../world/budget';
import { creaturePlacements, guardianPlacements } from '../world/terrain';
import { fusionDesCreatures, fusionDesGardiens } from '../world/personnages/fusions';
import type { Instant, Monde } from './partie';
import { creerPersonnages } from './personnages';
import { materiauALueur } from './personnagesPeints';

const { progress, village } = toutConstruit();

function monde(archipeo: boolean): Monde {
  return {
    scene: new THREE.Scene(),
    archipel: '6e',
    archipeo,
    surface: null,
    etendue: { minX: 0, maxX: 10, minY: 0, maxY: 10 },
    centre: { x: 5, y: 5 },
    largeur: 10,
  };
}
const instant = (): Instant => ({
  now: 0,
  marche: false,
  navigue: null,
  carte: false,
  but: { target: new THREE.Vector3(), pos: new THREE.Vector3() },
});

/** Les maillages dessinés d'une scène (les boîtes de toucher, invisibles, n'en sont pas). */
function dessines(scene: THREE.Scene): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh && (o.material as THREE.Material).visible) out.push(o);
  });
  return out;
}

describe('Les personnages d’Archipéo dans la scène 3D', () => {
  const creatures = creaturePlacements('6e', village.bridges);
  const gardiens = guardianPlacements('6e', progress, village.bridges);

  it('un appel pour le bonhomme, un pour les créatures, un pour les Gardiens', async () => {
    const m = monde(true);
    const p = creerPersonnages(m, () => null, instant(), { nuit: () => 0 });
    // Posés avant que leurs modèles soient chargés : ils arrivent avec eux.
    p.poserLesCreatures([...creatures, ...gardiens]);
    expect(dessines(m.scene)).toHaveLength(0);
    await vi.dynamicImportSettled();
    const d = dessines(m.scene);
    expect(d).toHaveLength(3);
    expect(d.filter((x) => x instanceof THREE.SkinnedMesh)).toHaveLength(2);
    const tri = (x: THREE.Mesh) => x.geometry.getAttribute('position').count / 3;
    expect(d.map(tri).sort((a, b) => a - b)).toEqual(
      [472, fusionDesCreatures(creatures).positions.length / 9, fusionDesGardiens(gardiens).positions.length / 9].sort((a, b) => a - b),
    );
    p.dispose();
  });

  it('chaque créature et chaque Gardien garde une boîte de toucher, invisible, à son nom', async () => {
    const m = monde(true);
    const p = creerPersonnages(m, () => null, instant(), null);
    await vi.dynamicImportSettled();
    p.poserLesCreatures([...creatures, ...gardiens]);
    const boites = p.creatures.children as THREE.Mesh[];
    expect(boites.map((b) => b.userData)).toEqual([
      ...creatures.map((c) => ({ creature: c.id, kind: 'creature' })),
      ...gardiens.map((c) => ({ creature: c.id, kind: 'guardian' })),
    ]);
    expect(boites.every((b) => !(b.material as THREE.Material).visible)).toBe(true);
    // On touche une créature par sa boîte : un rayon vers son centre la rencontre.
    const b = boites[0];
    b.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(b.position.clone().add(new THREE.Vector3(0, 0, -20)), new THREE.Vector3(0, 0, 1));
    expect(ray.intersectObjects(p.creatures.children, true)[0]?.object.userData.creature).toBe(creatures[0].id);
    p.dispose();
  });

  it('avec « Réduire les animations », rien ne bouge : ni promenade, ni geste', async () => {
    const m = monde(true);
    const p = creerPersonnages(m, () => null, instant(), null);
    await vi.dynamicImportSettled();
    p.poserLesCreatures(creatures);
    const avant = p.creatures.children.map((b) => b.position.clone());
    const skinned = dessines(m.scene).find((x) => x instanceof THREE.SkinnedMesh && x.skeleton.bones.length > 6) as THREE.SkinnedMesh;
    const os = skinned.skeleton.bones.map((b) => b.rotation.x);
    for (let t = 0; t < 10; t += 0.5) p.animer!(t, 0.5, true);
    expect(p.creatures.children.map((b) => b.position.clone())).toEqual(avant);
    expect(skinned.skeleton.bones.map((b) => b.rotation.x)).toEqual(os);
    p.dispose();
  });

  it('libère ses géométries, ses matériaux et ses squelettes', async () => {
    const m = monde(true);
    const p = creerPersonnages(m, () => null, instant(), null);
    await vi.dynamicImportSettled();
    p.poserLesCreatures([...creatures, ...gardiens]);
    const geos = new Set<THREE.BufferGeometry>();
    const mats = new Set<THREE.Material>();
    m.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        geos.add(o.geometry);
        mats.add(o.material as THREE.Material);
      }
    });
    let liberes = 0;
    for (const x of [...geos, ...mats]) x.addEventListener('dispose', () => liberes++);
    p.dispose();
    expect(liberes).toBe(geos.size + mats.size);
    expect(m.scene.children).toHaveLength(0);
  });

  it('le matériau à lueur mêle la couleur de l’attribut `lueur` à la lumière, au poids donné', () => {
    const { materiau, force } = materiauALueur();
    const shader = {
      uniforms: {} as Record<string, unknown>,
      vertexShader: THREE.ShaderLib.lambert.vertexShader,
      fragmentShader: THREE.ShaderLib.lambert.fragmentShader,
    };
    materiau.onBeforeCompile(shader as unknown as THREE.WebGLProgramParametersWithUniforms, undefined as unknown as THREE.WebGLRenderer);
    expect(shader.uniforms.forceDeLueur).toBe(force);
    expect(shader.vertexShader).toContain('vLueur = lueur;');
    expect(shader.fragmentShader).toContain('outgoingLight = mix(outgoingLight, vLueur.rgb, forceDeLueur * vLueur.a);');
    materiau.dispose();
  });
});
