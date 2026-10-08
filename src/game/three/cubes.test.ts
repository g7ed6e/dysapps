// Garde du lot 7b : l'architecture modulaire (le kit des Premiers Rivages, rempli) ne passe jamais dans le rendu de
// Blocland. Sans WebGL (jsdom), on vérifie l'arbre de la scène : aucun matériau de la construction taillée, aucun motif
// peint, aucune pièce ; exactement les cubes du monde en blocs.
import * as THREE from 'three';
import { HABILLAGES, type Habillage } from '../skin';
import { toutConstruit } from '../world/budget';
import { maillageDeLaConstruction } from '../world/construction';
import { buildMesh } from '../world/mesher';
import { buildBlockMesh, chunkFaceCount } from '../world/blockMesh';
import { hiddenBottomLevel } from '../world/sea';
import { worldCubes } from '../world/terrain';
import { KITS } from '../world/architecture';
import { creerCubes } from './cubes';
import { ouvrirLeModeDansLesMateriaux } from './arrange';
import type { Large } from './offshore';
import type { Lumiere } from './light';
import type { Instant, Monde } from './scenePart';
import type { VoxelCube } from '../Voxel';
import { GESTE_DE_POSE } from '../world/pose';
import { BADGES } from '../../core/progress';
import { trophyBlock } from '../trophies';
import { partiesDe } from '../world/parts';
import { casesDesPlansDansLeMonde } from '../world/terrain';
import { cubesDeLaVague, planDeLaVague, sansLaPartie } from '../world/wave';
import { maillageDuFondu } from '../world/fadeMesh';

function monde(habillage: Habillage): Monde {
  return { scene: new THREE.Scene(), archipel: '6e', habillage, surface: null, etendue: { minX: 0, maxX: 10, minY: 0, maxY: 10 }, centre: { x: 5, y: 5 }, largeur: 10, liaisons: () => [] };
}

/** Les triangles du terrain en une seule texture, les faces voisines fondues (world/blockMesh.ts). */
const fondus = (cubes: VoxelCube[]) => chunkFaceCount(buildBlockMesh(cubes, { fondre: true })) * 2;

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
    // Aucun attribut de motif, aucun shader peint : la construction d'Archipéo (three/construction.ts) peint ses murs
    // dans `onBeforeCompile` ; les matériaux de Blocland n'y lisent que la texture des blocs (three/textures.ts), et n'y
    // ajoutent la zone du mode « Aménager » (GD-9, three/arrange.ts : le lieu choisi soulevé, le geste de la pose) que
    // le temps que le mode est ouvert : hors du mode, le programme est celui d'avant.
    expect(maillages.length).toBeGreaterThan(0);
    for (const o of maillages) {
      expect(o.geometry.getAttribute('motif')).toBeUndefined();
      const mats = ([] as THREE.Material[]).concat(o.material);
      for (const x of mats) {
        expect(x).not.toBeInstanceOf(THREE.ShaderMaterial);
        expect(x.customProgramCacheKey(), 'hors du mode').toBe('blocs');
      }
    }
    const mats = maillages.flatMap((o) => ([] as THREE.Material[]).concat(o.material));
    // Le mode ouvert : l'ajout est posé sur chaque matériau des blocs ; refermé, il part.
    // Exactement les triangles du monde en blocs, les faces voisines fondues (world/blockMesh.ts), sans les dessous
    // sous l'eau.
    const dessous = { hiddenBottomsUpTo: hiddenBottomLevel('6e') };
    const tri = (o: THREE.Object3D) => {
      let n = 0;
      o.traverse((x) => {
        if (x instanceof THREE.Mesh) n += (x.geometry.index?.count ?? 0) / 3;
      });
      return n;
    };
    const terrain = m.scene.children[0];
    expect(tri(terrain)).toBe(chunkFaceCount(buildBlockMesh(cubes, { ...dessous, fondre: true })) * 2);
    ouvrirLeModeDansLesMateriaux(true);
    for (const x of mats) expect(x.customProgramCacheKey()).toBe('blocsamenager');
    // Dans le mode, le terrain se refait sans fondre ses faces (le lieu choisi se soulève sommet par sommet) : cube pour
    // cube, les triangles du mailleur (world/mesher.ts).
    c.animer!(0, 0.016, false);
    expect(tri(terrain)).toBe(buildMesh(cubes, [], dessous).reduce((n, g) => n + g.indices.length / 3, 0));
    ouvrirLeModeDansLesMateriaux(false);
    for (const x of mats) expect(x.customProgramCacheKey()).toBe('blocs');
    c.animer!(0, 0.016, false);
    expect(tri(terrain)).toBe(chunkFaceCount(buildBlockMesh(cubes, { ...dessous, fondre: true })) * 2);
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
  const attendus = () => fondus(apres);
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

describe('La pose d’une partie en vague (GD-6, Blocland)', () => {
  const lumiere = { nuit: () => 0, suivre: () => {} } as unknown as Lumiere;
  const sol = [0, 1, 2].map((x) => ({ x, y: 0, z: 0, texture: 'herbe' })) as VoxelCube[];
  // Deux couches de trois cubes : la partie.
  const partie = [0, 1, 2].flatMap((x) => [1, 2].map((z) => ({ x, y: 0, z, texture: 'planches' }))) as VoxelCube[];
  const apres = [...sol, ...partie];
  const maillages = (o: THREE.Object3D) => o.children.filter((x): x is THREE.Mesh => x instanceof THREE.Mesh);
  /** Les triangles dessinés : ceux de la portée de dessin de chaque maillage. */
  const dessines = (o: THREE.Object3D) =>
    maillages(o).reduce((n, x) => n + Math.min(x.geometry.index!.count, x.geometry.drawRange.count) / 3, 0);
  const scene = () => {
    const m = monde(HABILLAGES.blocland);
    const c = creerCubes(m, { rivage: () => {} } as unknown as Large, lumiere, { now: 0 } as Instant);
    const moments: string[] = [];
    c.lancerLaVague(partie, (x) => moments.push(x));
    c.poser(sol);
    return { m, c, terrain: m.scene.children[0], moments };
  };

  it('pose couche par couche dans les maillages du terrain : pas un objet de plus, un « clac » par couche, puis la fin', () => {
    const { m, c, terrain, moments } = scene();
    const objets = m.scene.children.length;
    // Rien de la partie avant le premier cube ; pas plus de maillages que le monde tout posé.
    expect(dessines(terrain)).toBe(fondus(sol));
    expect(maillages(terrain).length).toBeLessThanOrEqual(buildBlockMesh(apres).length + 1);
    let hautMax = 0;
    for (let i = 0; i < 400 && !moments.includes('finie'); i++) {
      c.animer!(0, 0.03, false);
      const y = maillages(terrain).flatMap((x) => Array.from(x.geometry.getAttribute('position').array as Float32Array).filter((_, j) => j % 3 === 1));
      hautMax = Math.max(hautMax, ...y);
    }
    expect(m.scene.children.length).toBe(objets);
    // Deux couches, deux « clacs », puis la fin, une fois.
    expect(moments).toEqual(['couche', 'couche', 'finie']);
    // Un cube du haut est parti d'une case et demie au-dessus de sa case (le haut de la partie est à 3).
    expect(hautMax).toBeGreaterThan(3 + 1);
    // Posés : tout est à sa place, et rien ne bouge plus.
    c.animer!(0, 0.03, false);
    expect(moments).toEqual(['couche', 'couche', 'finie']);
    // La page donne le monde avec la partie : le terrain tout posé, sans la vague.
    c.arreterLaVague();
    c.poser(apres);
    expect(dessines(terrain)).toBe(fondus(apres));
    c.dispose();
  });

  it('suit le temps de la scène, d’un pas borné : une image longue ne saute pas la vague', () => {
    const { c, moments } = scene();
    c.animer!(0, 0.016, false);
    for (let i = 0; i < 5; i++) c.animer!(0, 0.1, false);
    // Cinq images d'un dixième de seconde n'avancent que de 300 ms : la vague n'a pas commencé sa première couche.
    expect(moments).toEqual([]);
    c.dispose();
  });

  it('arrêtée en cours (un toucher, ou l’élève quitte le monde) : le monde suivant se dessine sans elle', () => {
    const { c, terrain, moments } = scene();
    for (let i = 0; i < 25; i++) c.animer!(0, 0.03, false);
    c.arreterLaVague();
    c.poser(apres);
    expect(dessines(terrain)).toBe(fondus(apres));
    for (let i = 0; i < 200; i++) c.animer!(0, 0.03, false);
    expect(moments).not.toContain('finie');
    c.dispose();
  });

  it('avec « Réduire les animations » : posée d’un coup, sans « clac » de couche', () => {
    const { c, moments } = scene();
    c.animer!(0, 0.016, true);
    expect(moments).toEqual(['finie']);
    c.dispose();
  });
});

describe('La pose d’une partie en fondu (GD-6, Archipéo, choix « 2c » du mainteneur)', () => {
  const lumiere = { nuit: () => 0, suivre: () => {} } as unknown as Lumiere;
  const { progress, world: village } = toutConstruit();
  const tout = worldCubes('6e', progress, village, false);
  const [cabane] = partiesDe('french-6e-phonology');
  const cases = casesDesPlansDansLeMonde(cabane.cases);
  const partie = cubesDeLaVague(tout, cases);
  const sans = sansLaPartie(tout, cases);
  const plan = planDeLaVague(partie);
  const fondu = maillageDuFondu('6e', partie, plan);
  const scene = () => {
    const m = monde(HABILLAGES.archipeo);
    const c = creerCubes(m, { rivage: () => {} } as unknown as Large, lumiere, { now: 0 } as Instant);
    const moments: string[] = [];
    c.lancerLaVague(partie, (x) => moments.push(x));
    c.poser(sans);
    return { m, c, moments };
  };
  /** Les maillages de la scène qui dessinent quelque chose : autant d'appels de dessin. */
  const appels = (m: Monde) => {
    let n = 0;
    m.scene.traverse((o) => {
      if (o instanceof THREE.Mesh && o.visible && (o.geometry.index?.count ?? o.geometry.getAttribute('position').count) > 0) n++;
    });
    return n;
  };
  /** Les couleurs du fondu, telles que la 3D les dessine : au bout du groupe opaque de la construction. */
  const couleursDuFondu = (m: Monde) => {
    let opaque: THREE.Mesh | null = null;
    m.scene.traverse((o) => {
      if (o instanceof THREE.Mesh && o.userData.construction && o.userData.groupe === 'opaque') opaque = o;
    });
    const couleurs = (opaque as THREE.Mesh | null)!.geometry.getAttribute('color').array as Float32Array;
    return couleurs.subarray(couleurs.length - fondu.depart.length);
  };
  const avancer = (c: ReturnType<typeof creerCubes>, jusqua: number) => {
    // Des images de 30 ms (le pas borné de la scène est de 60 ms) : la première image pose le temps à 0.
    for (let ms = 0; ms <= jusqua; ms += 30) c.animer!(0, ms === 0 ? 0.016 : 0.03, false);
  };

  it('dès la première image, chaque case de la partie est un cube de pierre des ruines, sans un appel de dessin de plus', () => {
    const { m, c } = scene();
    c.animer!(0, 0.016, false);
    const pendant = appels(m);
    expect(Array.from(couleursDuFondu(m))).toEqual(Array.from(fondu.depart));
    // Le monde tout posé, sans fondu : autant d'appels.
    const apres = monde(HABILLAGES.archipeo);
    const d = creerCubes(apres, { rivage: () => {} } as unknown as Large, lumiere, { now: 0 } as Instant);
    d.poser(tout);
    expect(pendant).toBeLessThanOrEqual(appels(apres));
    c.dispose();
    d.dispose();
  });

  it('à mi-chemin, les premiers cubes sont passés, les derniers encore en pierre ; à la fin, la couleur du plan, et un « toc » par couche', () => {
    const { m, c, moments } = scene();
    const milieu = (plan.departs[0] + plan.couches[plan.couches.length - 1]) / 2;
    avancer(c, milieu);
    const mi = couleursDuFondu(m);
    const premier = fondu.rangDuSommet.indexOf(0);
    const dernier = fondu.rangDuSommet.lastIndexOf(plan.ordre.length - 1);
    expect(mi[3 * premier]).toBeCloseTo(fondu.arrivee[3 * premier], 5);
    expect(mi[3 * dernier]).toBeCloseTo(fondu.depart[3 * dernier], 5);
    expect(moments.length).toBeGreaterThan(0);
    expect(moments.length).toBeLessThan(plan.couches.length);
    avancer(c, plan.finMs);
    const fin = couleursDuFondu(m);
    for (let i = 0; i < fin.length; i++) expect(fin[i]).toBeCloseTo(fondu.arrivee[i], 5);
    expect(moments).toEqual([...plan.couches.map(() => 'couche'), 'finie']);
    c.dispose();
  });

  it('avec « Réduire les animations » : restaurée d’un coup, sans « toc » de couche', () => {
    const { m, c, moments } = scene();
    c.animer!(0, 0.016, true);
    const fin = couleursDuFondu(m);
    for (let i = 0; i < fin.length; i++) expect(fin[i]).toBeCloseTo(fondu.arrivee[i], 5);
    expect(moments).toEqual(['finie']);
    c.dispose();
  });

  it('un cube de pierre se touche comme un bloc : sa case, et la case devant sa face', () => {
    const { c } = scene();
    c.animer!(0, 0.016, false);
    const k = plan.ordre[plan.ordre.length - 1];
    const cube = partie[k];
    const ray = new THREE.Raycaster(new THREE.Vector3(cube.x + 0.5, cube.z + 20, cube.y + 0.5), new THREE.Vector3(0, -1, 0));
    // Le premier triangle du fondu touché (au-dessus, d'autres blocs de l'île peuvent couvrir la colonne).
    const hit = ray.intersectObjects(c.cibles()).find((h) => {
      const index = (h.object as THREE.Mesh).geometry.index!;
      return h.object.userData.groupe === 'opaque' && h.faceIndex! >= (index.count - fondu.maillage.opaque.indices.length) / 3;
    })!;
    expect(hit).toBeDefined();
    expect(c.casesTouchees(hit)).toEqual({ cell: { x: cube.x, y: cube.y, z: cube.z }, next: { x: cube.x, y: cube.y, z: cube.z + 1 } });
    c.dispose();
  });

  it('tenue par les captures (la ruine, le mi-fondu), elle ne bouge plus ; menée à sa fin, elle le dit', () => {
    const { m, c, moments } = scene();
    c.tenirLaVague(0);
    avancer(c, plan.finMs);
    expect(Array.from(couleursDuFondu(m))).toEqual(Array.from(fondu.depart));
    expect(moments).toEqual([]);
    c.tenirLaVague(1);
    c.animer!(0, 0.016, false);
    expect(moments.at(-1)).toBe('finie');
    c.dispose();
  });

  it('arrêtée (finie, touchée ou quittée) : la construction se dessine sans le fondu, la partie à sa place', () => {
    const { m, c } = scene();
    avancer(c, 600);
    c.arreterLaVague();
    c.poser(tout);
    c.animer!(0, 0.016, false);
    let opaque: THREE.Mesh | null = null;
    m.scene.traverse((o) => {
      if (o instanceof THREE.Mesh && o.userData.construction && o.userData.groupe === 'opaque') opaque = o;
    });
    const sansFondu = monde(HABILLAGES.archipeo);
    const d = creerCubes(sansFondu, { rivage: () => {} } as unknown as Large, lumiere, { now: 0 } as Instant);
    d.poser(tout);
    let reference: THREE.Mesh | null = null;
    sansFondu.scene.traverse((o) => {
      if (o instanceof THREE.Mesh && o.userData.construction && o.userData.groupe === 'opaque') reference = o;
    });
    expect((opaque as THREE.Mesh | null)!.geometry.getAttribute('position').count).toBe((reference as THREE.Mesh | null)!.geometry.getAttribute('position').count);
    c.dispose();
    d.dispose();
  });
});
