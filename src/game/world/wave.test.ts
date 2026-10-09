// La pose d'une partie en vague (GD-6, Blocland, piste B) : l'ordre, le rythme borné à six secondes, le maillage partagé.
import { BIOMES } from '../biomes';
import { PLAFOND_DU_MONDE_EN_BLOCS, sceneCost, terrainChunks, toutConstruit } from './budget';
import { buildBlockMesh, chunkFaceCount } from './blockMesh';
import { hiddenBottomLevel } from './sea';
import { ARCHIPELAGO_IDS } from './map';
import { buildMesh } from './mesher';
import { partiesDe } from './parts';
import { GESTE_DE_POSE } from './pose';
import { casesDesPlansDansLeMonde, worldCubes } from './terrain';
import { maillageAvecLaVague, vagueEnBlocs } from './waveMesh';
import { VAGUE, couchesPosees, cubesDeLaVague, cubesPartis, hauteurDansLaVague, planDeLaVague, sansLaPartie } from './wave';

const mur = (w: number, h: number, d = 1) => {
  const out: { x: number; y: number; z: number; color: string }[] = [];
  for (let z = 0; z < h; z++) for (let y = 0; y < d; y++) for (let x = 0; x < w; x++) out.push({ x, y, z, color: '#8a6' });
  return out;
};

it('pose couche par couche, du bas vers le haut, un cube après l’autre, à 30 à 50 ms d’écart', () => {
  // Les cases reçues en désordre : la vague les remet dans l'ordre.
  const cases = mur(4, 3, 2).reverse();
  const plan = planDeLaVague(cases);
  const z = plan.ordre.map((i) => cases[i].z);
  expect(z).toEqual([...z].sort((a, b) => a - b));
  // Dans une couche : du fond (y haut) vers l'avant, puis de gauche à droite.
  const premiere = plan.ordre.slice(0, 8).map((i) => [cases[i].y, cases[i].x]);
  expect(premiere).toEqual([[1, 0], [1, 1], [1, 2], [1, 3], [0, 0], [0, 1], [0, 2], [0, 3]]);
  expect(plan.ecartMs).toBeGreaterThanOrEqual(30);
  expect(plan.ecartMs).toBeLessThanOrEqual(50);
  // Les départs ne reculent jamais ; deux cubes d'une couche se suivent d'un écart, une couche de plus attend un peu.
  for (let i = 1; i < plan.departs.length; i++) expect(plan.departs[i]).toBeGreaterThan(plan.departs[i - 1]);
  expect(plan.departs[1] - plan.departs[0]).toBeCloseTo(plan.ecartMs);
  expect(plan.departs[8] - plan.departs[7]).toBeCloseTo(plan.ecartMs * (1 + VAGUE.pauseEntreCouches));
  expect(plan.departs[0]).toBe(VAGUE.attenteMs);
  // Une couche est posée quand son dernier cube s'arrête : trois couches, trois « clacs ».
  expect(plan.couches).toEqual([plan.departs[7], plan.departs[15], plan.departs[23]].map((d) => d + GESTE_DE_POSE.dureeMs));
  expect(couchesPosees(plan, plan.couches[0] - 1)).toBe(0);
  expect(couchesPosees(plan, plan.couches[1])).toBe(2);
  // Le carillon après le dernier cube.
  expect(plan.finMs).toBeGreaterThan(plan.couches[2]);
});

it('chaque cube fait le geste de pose : rien avant son départ, puis 1,5 case, puis l’arrêt net', () => {
  const plan = planDeLaVague(mur(3, 2));
  expect(cubesPartis(plan, 0)).toBe(0);
  expect(cubesPartis(plan, plan.departs[2])).toBe(3);
  expect(hauteurDansLaVague(plan, 2, plan.departs[2])).toBe(GESTE_DE_POSE.hauteur);
  expect(hauteurDansLaVague(plan, 2, plan.departs[2] + GESTE_DE_POSE.dureeMs)).toBe(0);
  expect(hauteurDansLaVague(plan, 2, plan.finMs)).toBe(0);
});

it('tient en six secondes au plus : l’écart se resserre pour une grande partie', () => {
  for (const n of [1, 10, 60, 140, 400]) {
    const plan = planDeLaVague(mur(n, 4));
    expect(plan.finMs - VAGUE.attenteMs, String(n)).toBeLessThanOrEqual(VAGUE.dureeMaxMs + 1e-6);
    expect(plan.ecartMs).toBeLessThanOrEqual(VAGUE.ecartMs);
  }
  // Une petite partie garde son écart.
  expect(planDeLaVague(mur(5, 2)).ecartMs).toBe(VAGUE.ecartMs);
  expect(planDeLaVague([]).finMs).toBe(0);
});

it('met la vague à la fin des maillages du terrain, sans appel de dessin de plus, les cubes partis en tête', () => {
  const sol = mur(4, 1, 2).map((c) => ({ ...c, z: -1, texture: 'pierre' }));
  const cubes = [
    ...mur(3, 1).map((c) => ({ ...c, texture: 'planches' })),
    ...mur(3, 1).map((c) => ({ ...c, z: 1, texture: 'pierre' })),
  ];
  const plan = planDeLaVague(cubes);
  const groupes = maillageAvecLaVague(sol, cubes, plan);
  const terrain = buildMesh(sol);
  // Le terrain garde ses faces, dans le même ordre, en tête de chaque groupe.
  for (const g of terrain) {
    const v = groupes.find((x) => x.groupe.key === g.key)!;
    expect(v.groupe.positions.slice(0, g.positions.length)).toEqual(g.positions);
    expect(v.groupe.indices.slice(0, g.indices.length)).toEqual(g.indices);
  }
  // Pierre (dessus, côtés, dessous du sol) et planches (dessus, côtés) : pas un groupe par cube, pas de dessous en vague.
  expect(groupes.map((g) => g.groupe.key).sort()).toEqual(['tex:pierre:bottom', 'tex:pierre:side', 'tex:pierre:top', 'tex:planches:side', 'tex:planches:top']);
  expect(groupes.find((g) => g.groupe.key === 'tex:pierre:bottom')!.vague).toBeNull();
  // Chaque cube de la vague garde ses cinq faces visibles d'en haut : il descend seul.
  const faces = groupes.reduce((n, g) => n + (g.vague ? (g.groupe.indices.length - g.vague.premierIndice) / 6 : 0), 0);
  expect(faces).toBe(cubes.length * 5);
  for (const { groupe, vague } of groupes) {
    if (!vague) continue;
    expect(vague.rangDuSommet.length).toBe(groupe.positions.length / 3 - vague.premierSommet);
    expect(vague.indicesJusquA).toHaveLength(cubes.length);
    for (let r = 1; r < vague.indicesJusquA.length; r++) expect(vague.indicesJusquA[r]).toBeGreaterThanOrEqual(vague.indicesJusquA[r - 1]);
    expect(vague.premierIndice + vague.indicesJusquA.at(-1)!).toBe(groupe.indices.length);
    // Les sommets vont dans l'ordre de la vague.
    for (let s = 1; s < vague.rangDuSommet.length; s++) expect(vague.rangDuSommet[s]).toBeGreaterThanOrEqual(vague.rangDuSommet[s - 1]);
  }
  // Les planches (la couche du bas) d'abord : la pierre de la vague n'a rien à dessiner avant son premier cube.
  const pierre = groupes.find((g) => g.groupe.key === 'tex:pierre:side')!.vague!;
  expect(pierre.indicesJusquA[2]).toBe(0);
  expect(pierre.indicesJusquA[3]).toBeGreaterThan(0);
});

it('trouve dans le monde les cases de chaque partie, et le monde sans elles les laisse vides', () => {
  const { progress, world } = toutConstruit();
  for (const a of ARCHIPELAGO_IDS) {
    const cubes = worldCubes(a, progress, world, false);
    for (const b of BIOMES.filter((x) => x.classe === a)) {
      for (const partie of partiesDe(b.id)) {
        const cases = casesDesPlansDansLeMonde(partie.cases);
        const n = partie.cases.reduce((s, c) => s + c.keys.length, 0);
        expect(cases.size, partie.nom).toBe(n);
        expect(cubesDeLaVague(cubes, cases), partie.nom).toHaveLength(n);
        const sans = sansLaPartie(cubes, cases);
        expect(sans.some((c) => cases.has(`${c.x},${c.y},${c.z}`))).toBe(false);
        expect(sans.length).toBe(cubes.length - n);
      }
    }
  }
}, 30_000);

it('reste dans le plafond du monde en blocs pendant la vague (PLAFOND_DU_MONDE_EN_BLOCS : 102 000 triangles, 120 appels)', () => {
  const { progress, world } = toutConstruit();
  for (const a of ARCHIPELAGO_IDS) {
    // L'archipel tout construit, sauf la partie qui se pose en vague : la pire de ses parties.
    const scene = sceneCost(a);
    const cubes = worldCubes(a, progress, world, false);
    const terrain = terrainChunks(a);
    const dessous = { hiddenBottomsUpTo: hiddenBottomLevel(a), fondre: true };
    for (const b of BIOMES.filter((x) => x.classe === a))
      for (const partie of partiesDe(b.id)) {
        const cases = casesDesPlansDansLeMonde(partie.cases);
        const vague = cubesDeLaVague(cubes, cases);
        // Le terrain sans la partie, fondu, et la vague à part, un maillage par passe (three/cubes.ts).
        const sans = buildBlockMesh(sansLaPartie(cubes, cases), dessous);
        const enVague = vagueEnBlocs(vague, planDeLaVague(vague)).map((v) => v.morceau);
        const triangles = scene.triangles - chunkFaceCount(terrain) * 2 + chunkFaceCount([...sans, ...enVague]) * 2;
        const appels = scene.drawCalls - terrain.length + sans.length + enVague.length;
        expect(triangles, partie.nom).toBeLessThanOrEqual(PLAFOND_DU_MONDE_EN_BLOCS.triangles);
        expect(appels, partie.nom).toBeLessThanOrEqual(PLAFOND_DU_MONDE_EN_BLOCS.drawCalls);
      }
  }
}, 60_000);
