import { existsSync, readFileSync } from 'node:fs';
import { compacterGlb } from '../../../scripts/rendu/compacterGlb.mjs';
import { lireGlb } from './characters/imported/glb';
import type { BiomeId } from '../biomes';
import type { VoxelCube } from '../Voxel';
import { applyLayout } from './appliedLayout';
import type { ArchipelagoId } from './archipelagos';
import { toutConstruit } from './budget';
import { BUILDING_FAR_TRIANGLES, BUILDING_FILES, BUILDING_MODELS, BUILDING_NEAR_TRIANGLES, buildingCells, buildingFile, buildingTriangles, getImportedBuildings, isBuildingLoaded } from './buildingModels';
import { buildingPath, loadBuildingsFromDisk } from './buildingModels.fromDisk.testing';
import { cacheDeLaConstruction, caseDeLaPiece, construireParIle, fenetresDe, maillageDeLaConstruction } from './construction';
import { lineaire } from './landMesh';
import { islandDef } from './map';
import { STEP } from './placement';
import { frameOf } from './footprint';
import { planCells, plansFor } from './plans';
import { worldCubes } from './terrain';

const FORGE: BiomeId = 'french-6e-letter-confusion';
const TOUS = Object.keys(BUILDING_MODELS) as BiomeId[];

/** Les cubes des Premiers Rivages tout construits, sauf les plans de la forge : `posees[i]` cases posées du plan i. */
function premiersRivages(posees: [number, number, number]): VoxelCube[] {
  const { progress, world } = toutConstruit();
  const parts = { ...world.parts };
  plansFor(FORGE).forEach((p, i) => (parts[p.id] = planCells(p).slice(0, posees[i]).map((c) => c.key)));
  return worldCubes('6e', progress, { ...world, parts }, false);
}

const tout = (i: number) => plansFor(FORGE)[i].cells.length;

/** Le bâtiment importé d'une île parmi tous ceux du monde. */
const deLIle = (l: ReturnType<typeof getImportedBuildings>, id: BiomeId = FORGE) => l.filter((m) => m.id === `building:${id}`);

/** L'archipel tout construit d'une île (le 6e, le 5e…, la classe du dossier de son modèle). */
const archipelConstruit = (id: BiomeId): VoxelCube[] => {
  const { progress, world } = toutConstruit();
  return worldCubes(BUILDING_MODELS[id]!.folder.slice(0, 2) as ArchipelagoId, progress, world, false);
};

describe('Le registre des bâtiments importés', () => {
  it('la forge de Tunel d’abord, et chaque bâtiment sous l’île de ses plans ; tous leurs fichiers sont dans le dépôt', () => {
    expect(TOUS[0]).toBe(FORGE);
    for (const id of TOUS) {
      // Le dossier porte la classe de l'île (6e-batiment-…, 5e-batiment-…).
      expect(id.includes(`-${BUILDING_MODELS[id]!.folder.slice(0, 2)}-`), id).toBe(true);
      for (const f of BUILDING_FILES) expect(existsSync(buildingPath(id, f)), `${id} ${f}`).toBe(true);
    }
  });

  it('le compactage du build garde chaque fichier (mêmes triangles, mêmes couleurs)', () => {
    for (const id of TOUS) for (const f of BUILDING_FILES) {
      const b = readFileSync(buildingPath(id, f));
      const brut = lireGlb(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
      const c = compacterGlb(new Uint8Array(b));
      const lu = lireGlb(c.buffer.slice(c.byteOffset, c.byteOffset + c.byteLength) as ArrayBuffer);
      expect(lu.positions.length, f).toBe(brut.positions.length);
      let ecart = 0;
      for (let i = 0; i < brut.colors.length; i++) ecart = Math.max(ecart, Math.abs(lu.colors[i] - brut.colors[i]));
      expect(ecart, `${id} ${f}`).toBeLessThan(1 / 255 + 1e-6);
    }
  }, 60_000);

  it('le fichier de chaque étape, de près et de loin', () => {
    expect([buildingFile(1, true), buildingFile(2, true), buildingFile(1, false), buildingFile(2, false)]).toEqual(['etape-1.glb', 'final-3000.glb', 'loin-etape-1.glb', 'loin.glb']);
  });

  it('pas chargé : le bâtiment garde ses blocs', () => {
    expect(isBuildingLoaded(FORGE)).toBe(false);
    expect(getImportedBuildings(premiersRivages([Infinity, Infinity, Infinity]), FORGE)).toEqual([]);
  });
});

describe('Les bâtiments importés, lus sur le disque', () => {
  beforeAll(() => loadBuildingsFromDisk());
  afterEach(() => applyLayout(undefined));

  it('chargés, ils tiennent leurs plafonds : 3 000 triangles de près, 200 de loin ; l’étape 1 coûte moins que le tout', () => {
    for (const id of TOUS) {
      expect(isBuildingLoaded(id), id).toBe(true);
      expect(buildingTriangles(id, 'final-3000.glb'), id).toBeLessThanOrEqual(BUILDING_NEAR_TRIANGLES);
      expect(buildingTriangles(id, 'etape-1.glb'), id).toBeLessThan(buildingTriangles(id, 'final-3000.glb'));
      expect(buildingTriangles(id, 'loin-etape-1.glb'), id).toBeLessThan(buildingTriangles(id, 'loin.glb'));
      for (const f of ['loin.glb', 'loin-etape-1.glb'] as const) {
        expect(buildingTriangles(id, f), `${id} ${f}`).toBeGreaterThan(10);
        expect(buildingTriangles(id, f), `${id} ${f}`).toBeLessThanOrEqual(BUILDING_FAR_TRIANGLES);
      }
    }
  });

  it('l’étape suit les plans : rien tant que le premier n’est pas tout posé, l’étape 1 ensuite, le tout quand le deuxième l’est', () => {
    // Une case du premier plan manque : les cubes, et les fantômes.
    expect(deLIle(getImportedBuildings(premiersRivages([tout(0) - 1, 0, 0]), FORGE))).toEqual([]);
    // Le premier plan posé, le deuxième en cours : l'étape 1 remplace les cases du premier ; celles du deuxième restent.
    const enCours = premiersRivages([tout(0), 5, 0]);
    const [e1] = deLIle(getImportedBuildings(enCours, FORGE));
    const [premier, second] = buildingCells(FORGE);
    expect(e1.stage).toBe(1);
    expect(e1.replaced).toEqual(premier);
    const restent = enCours.filter((c) => c.tag === FORGE && second.has(`${c.x},${c.y},${c.z}`));
    expect(restent.filter((c) => c.ghost)).toHaveLength(tout(1) - 5);
    expect(restent.filter((c) => !c.ghost)).toHaveLength(5);
    // Une case du deuxième plan manque : encore l'étape 1.
    expect(deLIle(getImportedBuildings(premiersRivages([tout(0), tout(1) - 1, 0]), FORGE))[0].stage).toBe(1);
    // Tout posé : le bâtiment entier, à la place des deux plans ; la cour (le troisième) reste en blocs.
    const [fini] = deLIle(getImportedBuildings(premiersRivages([tout(0), tout(1), 0]), FORGE));
    expect(fini.stage).toBe(2);
    expect(fini.replaced).toEqual(new Set([...premier, ...second]));
  });

  it('de près sur l’île de l’élève (3 000 triangles), de loin ailleurs (en volumes), au même endroit', () => {
    const cubes = premiersRivages([Infinity, Infinity, Infinity]);
    const forge = (l: ReturnType<typeof getImportedBuildings>) => l.find((m) => m.id === `building:${FORGE}`)!;
    const pres = forge(getImportedBuildings(cubes, FORGE));
    const loin = forge(getImportedBuildings(cubes, 'french-6e-reading'));
    expect(pres.opaque.positions.length / 9).toBe(buildingTriangles(FORGE, 'final-3000.glb'));
    expect(loin.opaque.positions.length / 9).toBe(buildingTriangles(FORGE, 'loin.glb'));
    const boite = (p: Float32Array) => [0, 1, 2].map((k) => [Math.min(...p.filter((_, i) => i % 3 === k)), Math.max(...p.filter((_, i) => i % 3 === k))]);
    const [bp, bl] = [boite(pres.opaque.positions), boite(loin.opaque.positions)];
    // Posés au même pied, à moins d'une case près.
    expect(Math.abs(bp[1][0] - bl[1][0])).toBeLessThan(0.05);
    for (const k of [0, 2]) expect(Math.abs((bp[k][0] + bp[k][1]) / 2 - (bl[k][0] + bl[k][1]) / 2), `axe ${k}`).toBeLessThan(1);
  });

  it('aux couleurs de ses cibles : les sRVB du fichier ramenées en linéaire (un fond 3a2a22 reste sombre)', () => {
    const [pres] = deLIle(getImportedBuildings(premiersRivages([Infinity, Infinity, Infinity]), FORGE));
    const b = readFileSync(buildingPath(FORGE, 'final-3000.glb'));
    const fichier = lireGlb(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)).colors;
    expect(pres.opaque.colors.length).toBe(fichier.length);
    let ecart = 0;
    for (let i = 0; i < fichier.length; i++) ecart = Math.max(ecart, Math.abs(pres.opaque.colors[i] - lineaire(fichier[i])));
    expect(ecart).toBeLessThan(1e-6);
    // le fond des ouvertures de la forge, 3a2a22 : 0,042 en rouge linéaire (et non 0,227, qui s'affichait 838 en sRVB)
    const fond = [0x3a, 0x2a, 0x22].map((c) => lineaire(c / 255));
    expect(fond[0]).toBeCloseTo(0.0423, 3);
    let vu = false;
    for (let i = 0; i < pres.opaque.colors.length && !vu; i += 3) vu = [0, 1, 2].every((k) => Math.abs(pres.opaque.colors[i + k] - fond[k]) < 1e-3);
    expect(vu).toBe(true);
  });

  it.each(TOUS)('%s, posé sur ses deux plans : au pied du premier rang, dans leur emprise à une demi-case près, pas plus haut qu’eux', (id) => {
    const [premier, second] = buildingCells(id);
    const cases = [...premier, ...second].map((k) => k.split(',').map(Number));
    const lo = [0, 1, 2].map((k) => Math.min(...cases.map((c) => c[k])));
    const hi = [0, 1, 2].map((k) => Math.max(...cases.map((c) => c[k])) + 1);
    const [m] = deLIle(getImportedBuildings(archipelConstruit(id), id), id);
    const p = m.opaque.positions;
    // Repère Three : x, la hauteur, puis y de la grille.
    const axe = (k: number) => p.filter((_, i) => i % 3 === k);
    expect(Math.min(...axe(1))).toBeCloseTo(lo[2], 3);
    expect(Math.max(...axe(1))).toBeLessThanOrEqual(hi[2] + 1e-6);
    expect(Math.min(...axe(0))).toBeGreaterThanOrEqual(lo[0] - 0.5 - 1e-6);
    expect(Math.max(...axe(0))).toBeLessThanOrEqual(hi[0] + 0.5 + 1e-6);
    // Sa façade au bord de devant du plan, côté caméra ; derrière, une demi-case de débord au plus.
    expect(Math.min(...axe(2))).toBeCloseTo(lo[1], 3);
    expect(Math.max(...axe(2))).toBeLessThanOrEqual(hi[1] + 1 + 1e-6);
  });

  it('suit l’île tournée (« Modifier le plan ») : le modèle tourne avec ses cases', () => {
    const c = frameOf('6e');
    const def = islandDef(FORGE);
    const ici = { x: (def.core.x - c.x0) / STEP, y: (def.core.y - c.y0) / STEP };
    let tourne = false;
    for (const turn of [1, 2, 3] as const) {
      applyLayout({ '6e': { islands: { [FORGE]: { x: ici.x, y: ici.y, turn } } } });
      if (islandDef(FORGE).quarts !== turn) continue;
      tourne = true;
      const cubes = premiersRivages([Infinity, Infinity, Infinity]);
      const [m] = deLIle(getImportedBuildings(cubes, FORGE));
      expect(m?.stage, `quart ${turn}`).toBe(2);
      // Le centre du modèle reste au-dessus de ses cases tournées.
      const cases = [...m.replaced].map((k) => k.split(',').map(Number));
      const centre = (k: number) => cases.reduce((n, q) => n + q[k] + 0.5, 0) / cases.length;
      const p = m.opaque.positions;
      const milieu = (k: number) => {
        const v = p.filter((_, i) => i % 3 === k);
        return (Math.min(...v) + Math.max(...v)) / 2;
      };
      expect(Math.abs(milieu(0) - centre(0)), `quart ${turn} x`).toBeLessThan(1.5);
      expect(Math.abs(milieu(2) - centre(1)), `quart ${turn} y`).toBeLessThan(1.5);
    }
    expect(tourne).toBe(true);
  });

  it('dans la construction : il remplace les cases des deux plans, sans appel de plus ; le toucher retrouve une case du plan', () => {
    const cubes = premiersRivages([Infinity, Infinity, Infinity]).filter((c) => c.tag === FORGE && !c.sol);
    const m = maillageDeLaConstruction('6e', cubes, [], { pres: FORGE });
    expect(m.monuments?.length).toBe(1);
    const [premier] = buildingCells(FORGE);
    const tranche = m.monuments![0];
    expect(tranche.opaque[1] - tranche.opaque[0]).toBe(buildingTriangles(FORGE, 'final-3000.glb'));
    // Les fenêtres du bâtiment (ses lanternes en blocs) ne s'allument plus : le modèle les remplace.
    for (const [c] of fenetresDe(cubes)) expect(premier.has(`${c.x},${c.y},${c.z}`)).toBe(false);
    // Le toucher sur le modèle : une case du plan.
    const t = tranche.opaque[0];
    const i = m.opaque.indices[3 * t];
    const point = { x: m.opaque.positions[3 * i], y: m.opaque.positions[3 * i + 1], z: m.opaque.positions[3 * i + 2] };
    const touche = caseDeLaPiece(m, 'opaque', t, point, { x: 0, y: 1, z: 0 });
    expect(touche).not.toBeNull();
  });

  it('l’île de près se refait seule quand l’élève change d’île (cache de la construction)', () => {
    const cubes = premiersRivages([Infinity, Infinity, Infinity]).filter((c) => !c.sol);
    const cache = cacheDeLaConstruction();
    const loin = construireParIle('6e', cubes, [], cache, null);
    const pres = construireParIle('6e', cubes, [], cache, FORGE);
    expect(pres.refaites).toBe(1);
    const t = (x: typeof loin) => x.maillage.opaque.indices.length / 3;
    expect(t(pres) - t(loin)).toBe(buildingTriangles(FORGE, 'final-3000.glb') - buildingTriangles(FORGE, 'loin.glb'));
    expect(construireParIle('6e', cubes, [], cache, FORGE).change).toBe(false);
  });
});
