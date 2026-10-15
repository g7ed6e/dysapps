// Les personnages d'Archipéo dans la scène 3D (lot R6) : sans WebGL (jsdom), on vérifie l'arbre de la scène, le toucher,
// le matériau à lueur, « Réduire les animations » et la libération des ressources.
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { HABILLAGES, type Habillage } from '../skin';
import { toutConstruit } from '../world/budget';
import { creaturePlacements, guardianPlacements } from '../world/terrain';
import { fusionDesCreatures, fusionDesGardiens } from '../world/characters/merges';
import type { Instant, Monde } from './scenePart';
import { creerPersonnages } from './characters';
import { OMBRE_AU_SOL } from '../world/characters/colors';
import { GESTES, MARCHE_DE_KEO, materiauALueur, swingOf, poseDeKeo, poseDeMarche, type PasDeKeo } from './paintedCharacters';
import { loadKeoFromDisk } from '../world/characters/imported/fromDisk.testing';

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

  it('un appel pour le bonhomme, un pour les créatures, un pour les Gardiens, un pour les ombres au sol', async () => {
    const m = monde(HABILLAGES.archipeo);
    const p = creerPersonnages(m, () => null, instant(), { nuit: () => 0 });
    // Posés avant que leurs modèles soient chargés : ils arrivent avec eux.
    p.poserLesCreatures([...creatures, ...gardiens]);
    expect(dessines(m.scene)).toHaveLength(0);
    await vi.dynamicImportSettled();
    const tout = dessines(m.scene);
    expect(tout).toHaveLength(4);
    // Les ombres au sol : un disque de `cotes` triangles par vivant, en un seul appel (instancié).
    expect(tout.filter((x) => x instanceof THREE.InstancedMesh).map((x) => x.geometry.index!.count / 3)).toEqual([OMBRE_AU_SOL.cotes]);
    const d = tout.filter((x) => !(x instanceof THREE.InstancedMesh));
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
    const { materiau, force, nuit } = materiauALueur();
    const shader = {
      uniforms: {} as Record<string, unknown>,
      vertexShader: THREE.ShaderLib.lambert.vertexShader,
      fragmentShader: THREE.ShaderLib.lambert.fragmentShader,
    };
    materiau.onBeforeCompile(shader as unknown as THREE.WebGLProgramParametersWithUniforms, undefined as unknown as THREE.WebGLRenderer);
    expect(shader.uniforms.forceDeLueur).toBe(force);
    expect(shader.vertexShader).toContain('vLueur = lueur;');
    expect(shader.fragmentShader).toContain('outgoingLight = mix(outgoingLight, vLueur.rgb, forceDeLueur * vLueur.a);');
    // La nuit, la lune en aplat, à `nuit` : la lumière des vivants éclaircie, plus sur les facettes tournées vers le
    // ciel, avant la lueur ; ni liseré ni couleur étrangère.
    expect(shader.uniforms.forceDeNuit).toBe(nuit);
    expect(shader.fragmentShader).toMatch(/outgoingLight \*= 1\.0 \+ forceDeNuit \* \(0\.45 \+ 0\.30 \* versLeCiel\);\noutgoingLight = mix\(outgoingLight, vLueur/);
    expect(shader.fragmentShader).not.toContain('Lisere');
    materiau.dispose();
  });

  it('la nuit des vivants suit le degré de nuit, jamais sur les sentinelles ; leur ombre au sol se marque', async () => {
    const m = monde(HABILLAGES.archipeo);
    let nuit = 0;
    const p = creerPersonnages(m, () => null, instant(), { nuit: () => nuit });
    await vi.dynamicImportSettled();
    p.poserLesCreatures([...creatures, ...gardiens]);
    const lisere = () =>
      dessines(m.scene).filter((x) => !(x instanceof THREE.InstancedMesh)).map((x) => {
        const mat = x.material as THREE.MeshLambertMaterial;
        const shader = { uniforms: {} as Record<string, { value: number }>, vertexShader: THREE.ShaderLib.lambert.vertexShader, fragmentShader: THREE.ShaderLib.lambert.fragmentShader };
        mat.onBeforeCompile(shader as unknown as THREE.WebGLProgramParametersWithUniforms, undefined as unknown as THREE.WebGLRenderer);
        return [x instanceof THREE.SkinnedMesh, shader.uniforms.forceDeNuit.value] as const;
      });
    p.animer!(0, 0.1, false);
    const ombres = dessines(m.scene).find((x) => x instanceof THREE.InstancedMesh) as THREE.InstancedMesh;
    // Une ombre pour le bonhomme et une par créature, en un seul appel de dessin.
    expect(ombres.count).toBe(1 + creatures.length);
    expect(lisere().every(([, v]) => v === 0)).toBe(true);
    expect((ombres.material as THREE.MeshBasicMaterial).opacity).toBe(OMBRE_AU_SOL.jour);
    nuit = 1;
    // Avec « Réduire les animations » aussi : la nuit n'est pas une animation.
    p.animer!(0, 0.1, true);
    for (const [vivant, v] of lisere()) expect(v).toBe(vivant ? 1 : 0);
    expect((ombres.material as THREE.MeshBasicMaterial).opacity).toBe(OMBRE_AU_SOL.nuit);
    p.dispose();
  });
});

describe('Le cycle de marche des créatures à squelette (poseDeMarche)', () => {
  it('l’aperçu hors du jeu (scripts/rendu/modeles/marche.py) marche comme le jeu', () => {
    const py = readFileSync('scripts/rendu/modeles/marche.py', 'utf8');
    const allure = JSON.parse(/^ALLURE = (\{[^}]*\})/m.exec(py)![1]) as Record<string, number>;
    expect(allure).toEqual(GESTES.pas);
  });

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

describe('Le bonhomme dessiné en code (`swingOf`)', () => {
  it('balance ses bras et ses jambes, chacun de son côté, le bras gauche à l’inverse de la jambe gauche ; aucun os de Kéo', () => {
    expect(swingOf({ nom: 'bras-gauche' })).toBe(1);
    expect(swingOf({ nom: 'bras-droit' })).toBe(-1);
    expect(swingOf({ nom: 'jambe-gauche' })).toBe(-1);
    expect(swingOf({ nom: 'jambe-droite' })).toBe(1);
    for (const nom of ['arm.L', 'thigh.R', 'shin.L', 'hips', 'spine', 'head']) expect(swingOf({ nom }), nom).toBe(0);
  });
});

describe('La marche de Kéo (`poseDeKeo`)', () => {
  /** Kéo marche (ou s'arrête) pendant `duree` secondes, à 60 images par seconde ; rend chaque pose. */
  const jouer = (pas: PasDeKeo, debut: number, duree: number, enMarche: boolean) => {
    const poses: ReturnType<typeof poseDeKeo>[] = [];
    for (let k = 1; k <= Math.round(duree * 60); k++) poses.push(poseDeKeo(pas, debut + k / 60, 1 / 60, enMarche));
    return poses;
  };
  const angleDe = (pose: ReturnType<typeof poseDeKeo>, nom: string, axe = 'x') => pose.angles.find(([n, a]) => n === nom && a === axe)?.[2] ?? 0;

  it('l’aperçu hors du jeu (scripts/rendu/modeles/marche.py) marche comme Kéo dans le jeu', () => {
    const py = readFileSync('scripts/rendu/modeles/marche.py', 'utf8');
    const allure = JSON.parse(/^ALLURE_DE_KEO = (\{[^}]*\})/m.exec(py)![1]) as Record<string, number>;
    expect(allure).toEqual(MARCHE_DE_KEO.allure);
  });

  it('une marche calme : moins de trois pas par seconde, des genoux qui plient, sans dandinement', () => {
    expect(MARCHE_DE_KEO.allure.cadence / Math.PI).toBeLessThan(3);
    expect(MARCHE_DE_KEO.allure.dandine).toBe(0);
    const poses = jouer({ phi: 0, rampe: 0 }, 0, 3, true).slice(60);
    const genou = Math.min(...poses.map((p) => angleDe(p, 'shin.L')));
    expect(genou).toBeLessThan(-0.6);
    // Le bras gauche part en arrière quand la cuisse gauche part en avant (à un rien de retard près).
    const correlation = poses.reduce((s, p) => s + angleDe(p, 'arm.L') * angleDe(p, 'thigh.L'), 0);
    expect(correlation).toBeLessThan(0);
    // Le bassin rebondit : deux fois par cycle, entre 0 et 1.
    expect(Math.max(...poses.map((p) => p.haut))).toBeGreaterThan(0.95);
    expect(Math.min(...poses.map((p) => p.haut))).toBeLessThan(0.05);
  });

  it('la tête reste stable : elle compense le bassin, le buste et le souffle', () => {
    for (const p of jouer({ phi: 0, rampe: 0 }, 0, 2, true)) {
      expect(angleDe(p, 'hips', 'y') + angleDe(p, 'spine', 'y') + angleDe(p, 'head', 'y')).toBeCloseTo(0, 6);
      expect(angleDe(p, 'spine') + angleDe(p, 'head')).toBeCloseTo(0, 6);
    }
  });

  it('il part et s’arrête sans à-coup : d’une image à l’autre, aucun os ne va plus vite qu’en pleine marche', () => {
    const pas = { phi: 0, rampe: 0 };
    const poses = [...jouer(pas, 0, 1, false), ...jouer(pas, 1, 3, true), ...jouer(pas, 4, 1, false)];
    const ecart = (k: number) => Math.max(...poses[k].angles.map(([nom, axe, a]) => Math.abs(a - angleDe(poses[k - 1], nom, axe))));
    // En pleine marche (de la deuxième à la troisième seconde), le genou va au plus vite : un peu moins de 0,16 radian par image.
    let enMarche = 0;
    for (let k = 120; k < 180; k++) enMarche = Math.max(enMarche, ecart(k));
    expect(enMarche).toBeLessThan(0.17);
    for (let k = 1; k < poses.length; k++) expect(ecart(k), `image ${k}`).toBeLessThan(1.05 * enMarche);
    // Arrêté, le cycle repart de zéro.
    expect(pas).toEqual({ phi: 0, rampe: 0 });
  });

  it('au repos, il respire seulement : le buste, lentement, et rien d’autre', () => {
    const poses = jouer({ phi: 0, rampe: 0 }, 0, MARCHE_DE_KEO.souffle[1], false);
    for (const p of poses) {
      expect(p.haut).toBe(0);
      for (const [nom, axe, a] of p.angles) if (!(axe === 'x' && (nom === 'spine' || nom === 'head'))) expect(Math.abs(a), nom).toBe(0);
    }
    expect(Math.max(...poses.map((p) => angleDe(p, 'spine')))).toBeCloseTo(MARCHE_DE_KEO.souffle[0], 3);
  });

  describe('dans la scène', () => {
    beforeAll(() => loadKeoFromDisk());

    it('il respire au repos, marche le long d’un trajet, et « Réduire les animations » le fige dans sa pose de repos', async () => {
      const m = monde(HABILLAGES.archipeo);
      const ici = instant();
      const p = creerPersonnages(m, () => null, ici, null);
      await vi.dynamicImportSettled();
      const keo = p.avatar.children.find((o) => o instanceof THREE.SkinnedMesh) as THREE.SkinnedMesh;
      const os = (nom: string) => keo.skeleton.bones[['hips', 'spine', 'head', 'thigh.L', 'shin.L', 'thigh.R', 'shin.R', 'arm.L', 'arm.R'].indexOf(nom)];
      expect(keo.skeleton.bones).toHaveLength(9);
      const repos = os('hips').position.y;
      // Sans trajet, il respire : le dos bouge, les jambes non.
      ici.now = performance.now();
      p.deplacer!(1.2, 1 / 60, false);
      expect(os('spine').rotation.x).not.toBe(0);
      expect(os('thigh.L').rotation.x).toBe(0);
      // Un trajet de vingt cases (un peu plus de trois secondes) : au bout d'une seconde, ses genoux ont plié.
      p.marcher({ route: Array.from({ length: 21 }, (_, x) => ({ x, y: 0, z: 0 })), seq: 1 });
      let genou = 0;
      for (let k = 1; k <= 60; k++) {
        ici.now += 1000 / 60;
        p.deplacer!(1.2 + k / 60, 1 / 60, false);
        genou = Math.min(genou, os('shin.L').rotation.x, os('shin.R').rotation.x);
      }
      expect(genou).toBeLessThan(-0.3);
      expect(p.marche).not.toBeNull();
      // « Réduire les animations » : il arrive, et reste dans sa pose de repos.
      p.deplacer!(2.3, 1 / 60, true);
      for (const b of keo.skeleton.bones) expect([b.rotation.x, b.rotation.y, b.rotation.z]).toEqual([0, 0, 0]);
      expect(os('hips').position.y).toBe(repos);
      p.deplacer!(2.4, 1 / 60, true);
      expect(os('spine').rotation.x).toBe(0);
      p.dispose();
    });
  });
});
