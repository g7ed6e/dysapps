// Les personnages d'Archipéo dans la scène 3D (lot R6) : sans WebGL (jsdom), on vérifie l'arbre de la scène, le toucher,
// le matériau à lueur, « Réduire les animations » et la libération des ressources.
import * as THREE from 'three';
import { HABILLAGES, type Habillage } from '../skin';
import { toutConstruit } from '../world/budget';
import { creaturePlacements, guardianPlacements } from '../world/terrain';
import { fusionDesCreatures, fusionDesGardiens } from '../world/characters/merges';
import type { Instant, Monde } from './scenePart';
import { creerPersonnages } from './characters';
import { GESTES, materiauALueur, poseDeMarche } from './paintedCharacters';

const { progress, world: village } = toutConstruit();

function monde(habillage: Habillage): Monde {
  return {
    scene: new THREE.Scene(),
    archipel: '6e',
    habillage,
    surface: null,
    etendue: { minX: 0, maxX: 10, minY: 0, maxY: 10 },
    centre: { x: 5, y: 5 },
    largeur: 10, liaisons: () => [],
  };
}
const instant = (): Instant => ({
  now: 0,
  marche: false,
  traversee: null,
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
  const creatures = creaturePlacements('6e', village.links);
  const gardiens = guardianPlacements('6e', progress, village.links);

  it('un appel pour le bonhomme, un pour les créatures, un pour les Gardiens', async () => {
    const m = monde(HABILLAGES.archipeo);
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
    const m = monde(HABILLAGES.archipeo);
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
    const m = monde(HABILLAGES.archipeo);
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
    const m = monde(HABILLAGES.archipeo);
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
    const { materiau, force, lisere } = materiauALueur();
    const shader = {
      uniforms: {} as Record<string, unknown>,
      vertexShader: THREE.ShaderLib.lambert.vertexShader,
      fragmentShader: THREE.ShaderLib.lambert.fragmentShader,
    };
    materiau.onBeforeCompile(shader as unknown as THREE.WebGLProgramParametersWithUniforms, undefined as unknown as THREE.WebGLRenderer);
    expect(shader.uniforms.forceDeLueur).toBe(force);
    expect(shader.vertexShader).toContain('vLueur = lueur;');
    expect(shader.fragmentShader).toContain('outgoingLight = mix(outgoingLight, vLueur.rgb, forceDeLueur * vLueur.a);');
    // La nuit, le liseré froid du bord de la silhouette, à `lisere`, après la lueur (et jamais sur ce qui brille).
    expect(shader.uniforms.forceDeNuit).toBe(lisere);
    expect(shader.fragmentShader).toMatch(/mix\(outgoingLight, couleurDuLisere, forceDeNuit \* [\d.]+ \* bordDuLisere \* hautDuLisere \* \(1\.0 - vLueur\.a\)\);\n#include <opaque_fragment>/);
    materiau.dispose();
  });

  it('la nuit, le liseré suit le degré de nuit sur les vivants, jamais sur les sentinelles', async () => {
    const m = monde(HABILLAGES.archipeo);
    let nuit = 0;
    const p = creerPersonnages(m, () => null, instant(), { nuit: () => nuit });
    await vi.dynamicImportSettled();
    p.poserLesCreatures([...creatures, ...gardiens]);
    const lisere = () =>
      dessines(m.scene).map((x) => {
        const mat = x.material as THREE.MeshLambertMaterial;
        const shader = { uniforms: {} as Record<string, { value: number }>, vertexShader: THREE.ShaderLib.lambert.vertexShader, fragmentShader: THREE.ShaderLib.lambert.fragmentShader };
        mat.onBeforeCompile(shader as unknown as THREE.WebGLProgramParametersWithUniforms, undefined as unknown as THREE.WebGLRenderer);
        return [x instanceof THREE.SkinnedMesh, shader.uniforms.forceDeNuit.value] as const;
      });
    p.animer!(0, 0.1, false);
    expect(lisere().every(([, v]) => v === 0)).toBe(true);
    nuit = 1;
    // Avec « Réduire les animations » aussi : le liseré n'est pas une animation.
    p.animer!(0, 0.1, true);
    for (const [vivant, v] of lisere()) expect(v).toBe(vivant ? 1 : 0);
    p.dispose();
  });
});

describe('Le cycle de marche des créatures à squelette (poseDeMarche)', () => {
  const angle = (phi: number, nom: string, axe = 'x', elan = 1) =>
    poseDeMarche(GESTES.pas, phi, elan).angles.find(([n, a]) => n === nom && a === axe)![2];

  it('le genou est tendu au contact du talon, plie un peu en recevant le poids, et fort quand la jambe repasse devant', () => {
    const contact = Math.PI / 2;
    expect(angle(contact, 'thigh.L')).toBeCloseTo(GESTES.pas.angle, 5);
    expect(Math.abs(angle(contact, 'shin.L'))).toBeLessThan(0.01);
    const poids = -angle(contact + 0.6, 'shin.L');
    const enLAir = -angle(-0.6, 'shin.L');
    expect(poids).toBeGreaterThan(0.15);
    expect(poids).toBeLessThan(0.3);
    expect(enLAir).toBeGreaterThan(0.9);
    expect(enLAir).toBeLessThan(1.1);
    // La jambe droite fait la même chose un demi-cycle plus tard.
    expect(angle(contact + Math.PI, 'shin.R')).toBeCloseTo(angle(contact, 'shin.L'), 5);
  });

  it('le corps est au plus haut quand les jambes se croisent, au plus bas au contact ; rien ne bouge à l’arrêt', () => {
    expect(poseDeMarche(GESTES.pas, 0, 1).haut).toBeCloseTo(1, 5);
    expect(poseDeMarche(GESTES.pas, Math.PI / 2, 1).haut).toBeCloseTo(0, 5);
    const arret = poseDeMarche(GESTES.pas, 1.3, 0);
    expect(arret.haut).toBe(0);
    for (const [, , a] of arret.angles) expect(Math.abs(a)).toBe(0);
  });

  it('la tête reste droite : le bassin et les épaules tournent à l’inverse, et la tête compense', () => {
    for (const phi of [0.4, 1.2, 2.5, 4]) expect(angle(phi, 'hips', 'y') + angle(phi, 'spine', 'y') + angle(phi, 'head', 'y')).toBeCloseTo(0, 6);
  });
});
