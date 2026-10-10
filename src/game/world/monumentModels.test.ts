import { existsSync } from 'node:fs';
import type { VoxelCube } from '../Voxel';
import { cacheDeLaConstruction, caseDeLaPiece, construireParIle, coutDeLaConstruction, maillageDeLaConstruction } from './construction';
import { MONUMENT_FOOTPRINT, MONUMENT_MAX_SPAN, HALO_DU_FEU_MIN, isFire, shownStage, monumentStages, stageFile, MONUMENT_MODELS, isMonumentLoaded, getImportedMonuments } from './monumentModels';
import { loadMonumentsFromDisk, monumentFile } from './monumentModels.fromDisk.testing';
import { getMonument, MONUMENTS } from './monuments';
import { LAYERS } from './projects';

/** Les cubes d'un monument posé en (ox, oy, oz), ses `posees` premières cases (de bas en haut) posées, les autres en fantôme. */
function chantier(id: string, posees: number | ((c: { z: number }) => boolean), o = { x: 40, y: 60, z: 2 }, muted = false): VoxelCube[] {
  const m = getMonument(id)!;
  const cells = [...m.cells].sort((p, q) => p.z - q.z);
  return cells.map((c, i) => ({
    x: o.x + c.x,
    y: o.y + c.y,
    z: o.z + c.z,
    color: '#888888',
    texture: 'pierre',
    tag: m.biome,
    place: `monument:${id}`,
    ghost: typeof posees === 'number' ? i >= posees : !posees(c),
    muted: muted || undefined,
  }));
}

describe('Le choix de l’étape d’un chantier', () => {
  it('deux étapes : les cubes sous un tiers, l’étape 1 dès un tiers, l’étape 2 dès deux tiers, le modèle entier fini', () => {
    expect(shownStage(0, 90, 2)).toBe(0);
    expect(shownStage(29, 90, 2)).toBe(0);
    expect(shownStage(30, 90, 2)).toBe(1);
    expect(shownStage(59, 90, 2)).toBe(1);
    expect(shownStage(60, 90, 2)).toBe(2);
    expect(shownStage(89, 90, 2)).toBe(2);
    expect(shownStage(90, 90, 2)).toBe(3);
    // Un plan qui ne se divise pas juste : 116 cases, le tiers à 38,67 (39 posées).
    expect(shownStage(38, 116, 2)).toBe(0);
    expect(shownStage(39, 116, 2)).toBe(1);
  });

  it('quatre étapes : un cinquième, deux, trois, quatre, puis le modèle entier', () => {
    expect([0, 19, 20, 40, 60, 80, 99, 100].map((n) => shownStage(n, 100, 4))).toEqual([0, 0, 1, 2, 3, 4, 4, 5]);
  });

  it('un plan vide ne montre rien', () => {
    expect(shownStage(0, 0, 2)).toBe(0);
  });
});

describe('Le registre des monuments importés', () => {
  it('les huit monuments classés, et eux seuls (les grands projets neufs de la 4e et de la 3e gardent leurs blocs)', () => {
    expect(Object.keys(MONUMENT_MODELS).sort()).toEqual(['landmark-3e-1', 'landmark-3e-2', 'landmark-4e-1', 'landmark-4e-2', 'landmark-5e-1', 'landmark-5e-2', 'landmark-6e-1', 'landmark-6e-2']);
    for (const id of Object.keys(MONUMENT_MODELS)) expect(getMonument(id), id).toBeDefined();
    expect(MONUMENTS.filter((m) => !MONUMENT_MODELS[m.id]).map((m) => m.id)).toEqual(['landmark-4e-3', 'landmark-4e-4', 'landmark-3e-3', 'landmark-3e-4', 'landmark-3e-5']);
  });

  it('chaque étape et chaque modèle entier est dans le dépôt (le phare du large : quatre étapes, ses cinq pièces)', () => {
    expect(MONUMENT_MODELS['landmark-5e-1'].stages).toBe(Object.keys(LAYERS['landmark-5e-1']).length - 1);
    for (const id of Object.keys(MONUMENT_MODELS)) for (const e of monumentStages(id)) expect(existsSync(monumentFile(id, e)), `${id} ${e}`).toBe(true);
    expect(stageFile(1, 2)).toBe('etape-1.glb');
    expect(stageFile(3, 2)).toBe('final-3000.glb');
    expect(monumentStages('landmark-5e-1')).toEqual([1, 2, 3, 4, 5]);
    expect(monumentStages('landmark-4e-3')).toEqual([]);
  });

  it('pas chargé : le monument garde ses blocs', () => {
    expect(isMonumentLoaded('landmark-6e-2')).toBe(false);
    expect(getImportedMonuments(chantier('landmark-6e-2', Infinity))).toEqual([]);
  });

  it('le feu : l’orangé vif du phare, pas ses pierres ni son fer', () => {
    const lin = (h: number) => [16, 8, 0].map((s) => Math.pow(((h >> s) & 255) / 255, 2.2)) as [number, number, number];
    expect(isFire(...lin(0xed9547))).toBe(true);
    for (const h of [0x676d75, 0x1c181c, 0xd1cfc9, 0xb67d6a, 0x9d8262]) expect(isFire(...lin(h)), h.toString(16)).toBe(false);
  });
});

describe('Les monuments importés dans la construction taillée', () => {
  beforeAll(() => loadMonumentsFromDisk());

  it('chargés : toutes les étapes de chaque monument', () => {
    for (const id of Object.keys(MONUMENT_MODELS)) expect(isMonumentLoaded(id), id).toBe(true);
  });

  /** Les cases du plan posées de bas en haut, jusqu'à `posees` d'entre elles. */
  const parLeBas = (id: string, posees: number, o = { x: 40, y: 60, z: 2 }) => chantier(id, posees, o);

  it('l’étape suit l’avancée du plan, remplace les cases qu’elle recouvre, et tient dans l’îlot, au pied du monument', () => {
    const id = 'landmark-6e-2';
    const n = getMonument(id)!.cells.length;
    const o = { x: 40, y: 60, z: 2 };
    let dernier = 0;
    const vues = new Set<number>();
    for (let posees = 1; posees <= n; posees++) {
      const cubes = parLeBas(id, posees, o);
      const [m] = getImportedMonuments(cubes);
      const etape = m?.stage ?? 0;
      // Jamais en arrière, jamais devant l'avancée du plan.
      expect(etape, `${posees}`).toBeGreaterThanOrEqual(dernier);
      expect(etape, `${posees}`).toBeLessThanOrEqual(shownStage(posees, n, 2));
      dernier = etape;
      vues.add(etape);
      if (!m) continue;
      // Les cases remplacées sont posées ; au fini, toutes.
      expect(m.replaced.size).toBe(m.cellules.length);
      expect(m.replaced.size).toBeLessThanOrEqual(posees);
      if (etape === 3) expect(m.replaced.size).toBe(n);
      expect(m.fire.positions.length).toBe(0);
      expect(m.halo).toBeNull();
      // Le modèle, centré sur les 7 × 7 de l'emprise (les cases du plan vont de 0 à 6), dans l'îlot de 9, posé au pied (z = 2).
      const p = m.opaque.positions;
      let [x0, x1, y0, z0, z1] = [Infinity, -Infinity, Infinity, Infinity, -Infinity];
      for (let i = 0; i < p.length; i += 3) {
        [x0, x1, y0, z0, z1] = [Math.min(x0, p[i]), Math.max(x1, p[i]), Math.min(y0, p[i + 1]), Math.min(z0, p[i + 2]), Math.max(z1, p[i + 2])];
      }
      const bord = (MONUMENT_MAX_SPAN - MONUMENT_FOOTPRINT) / 2;
      expect(x0).toBeGreaterThanOrEqual(o.x - bord - 1e-3);
      expect(x1).toBeLessThanOrEqual(o.x + MONUMENT_FOOTPRINT + bord + 1e-3);
      expect(z0).toBeGreaterThanOrEqual(o.y - bord - 1e-3);
      expect(z1).toBeLessThanOrEqual(o.y + MONUMENT_FOOTPRINT + bord + 1e-3);
      expect(y0).toBeCloseTo(o.z, 1);
    }
    // Les trois états se voient : les cubes, une étape au moins, le modèle entier.
    expect(vues.has(0) || dernier === 3).toBe(true);
    expect(dernier).toBe(3);
  });

  it('une étape ne s’affiche que si toutes les cases sous sa coupe sont posées : les fantômes restent hors du tronçon', () => {
    for (const id of Object.keys(MONUMENT_MODELS)) {
      if (LAYERS[id]) continue;
      const o = { x: 40, y: 60, z: 2 };
      const cells = getMonument(id)!.cells;
      // Posé par le haut : tout sauf la couche du bas. L'étape 2 recouvre le bas : rien du modèle, les cubes et les fantômes.
      const parLeHaut = chantier(id, (c) => c.z >= 1, o);
      expect(getImportedMonuments(parLeHaut), `${id} par le haut`).toEqual([]);
      // Posé de bas en haut : chaque étape montrée recouvre des cases toutes posées, et aucun fantôme n'est dessous.
      for (let z = 0; z <= Math.max(...cells.map((c) => c.z)); z++) {
        const cubes = chantier(id, (c) => c.z <= z, o);
        for (const m of getImportedMonuments(cubes)) {
          if (m.stage > MONUMENT_MODELS[id].stages) continue;
          const top = Math.max(...m.opaque.positions.filter((_, i) => i % 3 === 1));
          for (const c of cubes) if (c.ghost) expect(c.z - o.z + 0.5, `${id} étape ${m.stage}, posé jusqu'à z${z}`).toBeGreaterThanOrEqual(top - o.z - 1e-3);
        }
      }
    }
  });

  it('une étape coupée ne remplace que les cases sous sa coupe : les cubes posés au-dessus restent', () => {
    const id = 'landmark-6e-2';
    const cubes = chantier(id, (c) => c.z <= 6);
    const ms = getImportedMonuments(cubes);
    expect(ms).toHaveLength(1);
    const [m] = ms;
    expect(m.stage).toBeLessThan(3);
    const posees = cubes.filter((c) => !c.ghost);
    expect(m.replaced.size).toBeGreaterThan(0);
    expect(m.replaced.size).toBeLessThan(posees.length);
  });

  it('un monument fini n’est jamais plus petit que son plan en cubes (largeur, profondeur, hauteur), au débord borné près', () => {
    const sousLaHauteur: string[] = [];
    for (const id of Object.keys(MONUMENT_MODELS)) {
      const m = getMonument(id)!;
      const span = (k: 'x' | 'y' | 'z') => Math.max(...m.cells.map((c) => c[k])) - Math.min(...m.cells.map((c) => c[k])) + 1;
      const o = { x: 40, y: 60, z: 2 };
      const [fini] = getImportedMonuments(chantier(id, Infinity, o));
      const p = fini.opaque.positions;
      const lo = [Infinity, Infinity, Infinity];
      const hi = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < p.length; i++) {
        lo[i % 3] = Math.min(lo[i % 3], p[i]);
        hi[i % 3] = Math.max(hi[i % 3], p[i]);
      }
      const [w, h, d] = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
      // Au sol : couvre l'emprise du plan et ne dépasse pas l'îlot.
      expect(Math.max(w, d), id).toBeLessThanOrEqual(MONUMENT_MAX_SPAN + 1e-3);
      expect(Math.max(w, d), id).toBeGreaterThanOrEqual(MONUMENT_FOOTPRINT - 1e-3);
      if (h < span('z') - 1e-3) {
        // Sous la hauteur de son plan : seulement parce que l'îlot borne son sol.
        sousLaHauteur.push(id);
        expect(Math.max(w, d), id).toBeCloseTo(MONUMENT_MAX_SPAN, 2);
      } else expect(w, id).toBeGreaterThanOrEqual(span('x') - 1e-3);
    }
    // Seuls les plus larges que hauts (le viaduc, selon ses retouches le phare du large) restent sous la hauteur de leur plan.
    expect(sousLaHauteur.filter((id) => !['landmark-4e-1', 'landmark-5e-1'].includes(id))).toEqual([]);
  });

  it('le grand moulin montre ses ailes de face à la caméra de jeu : elles s’étalent en x, minces en z', () => {
    const [m] = getImportedMonuments(chantier('landmark-6e-2', Infinity));
    const p = m.opaque.positions;
    let h = 0;
    for (let i = 1; i < p.length; i += 3) h = Math.max(h, p[i]);
    const [mx, mz, n] = [{ s: 0, q: 0 }, { s: 0, q: 0 }, { c: 0 }];
    for (let i = 0; i < p.length; i += 3) {
      if (p[i + 1] < h - 1.2) continue;
      n.c++;
      mx.s += p[i];
      mx.q += p[i] ** 2;
      mz.s += p[i + 2];
      mz.q += p[i + 2] ** 2;
    }
    const [vx, vz] = [mx.q / n.c - (mx.s / n.c) ** 2, mz.q / n.c - (mz.s / n.c) ** 2];
    expect(vx).toBeGreaterThan(5 * vz);
  });

  it('le viaduc avance vers la caméra dans son îlot, sans en sortir : la falaise de la Gare ne le cache plus', () => {
    const o = { x: 40, y: 60, z: 2 };
    const centre = o.y + MONUMENT_FOOTPRINT / 2;
    const [fini] = getImportedMonuments(chantier('landmark-4e-1', Infinity, o));
    const p = fini.opaque.positions;
    let [z0, z1] = [Infinity, -Infinity];
    for (let i = 2; i < p.length; i += 3) [z0, z1] = [Math.min(z0, p[i]), Math.max(z1, p[i])];
    expect((z0 + z1) / 2).toBeLessThan(centre - 1);
    expect(z0).toBeGreaterThanOrEqual(centre - MONUMENT_MAX_SPAN / 2 - 1e-3);
  });

  it('la construction : le modèle remplace les cubes posés, les fantômes restent, le toucher retrouve une case posée', () => {
    const id = 'landmark-6e-1';
    const n = getMonument(id)!.cells.length;
    const enBlocs = chantier(id, Math.ceil(n / 3) - 1);
    const cubes = chantier(id, Math.ceil((2 * n) / 3));
    const avant = maillageDeLaConstruction('6e', enBlocs);
    const apres = maillageDeLaConstruction('6e', cubes);
    expect(avant.monuments).toBeUndefined();
    expect(apres.monuments).toHaveLength(1);
    // Les fantômes des cases qui restent : autant de fantômes que sans modèle pour les mêmes cases.
    const fantomes = maillageDeLaConstruction('6e', cubes.filter((c) => c.ghost));
    expect(apres.fantomes.indices.length).toBe(fantomes.fantomes.indices.length);
    const [t0, t1] = apres.monuments![0].opaque;
    expect(t1 - t0).toBeGreaterThan(1_000);
    // Toucher un triangle du modèle : une case posée du monument (le panneau du monument s'ouvre).
    const t = t0 + 10;
    const pos = apres.opaque.positions;
    const idx = apres.opaque.indices;
    const point = { x: pos[3 * idx[3 * t]], y: pos[3 * idx[3 * t] + 1], z: pos[3 * idx[3 * t] + 2] };
    const touche = caseDeLaPiece(apres, 'opaque', t, point, { x: 0, y: 1, z: 0 });
    const posees = new Set(cubes.filter((c) => !c.ghost).map((c) => `${c.x},${c.y},${c.z}`));
    expect(touche && posees.has(`${touche.cell.x},${touche.cell.y},${touche.cell.z}`)).toBe(true);
  });

  it('le phare du large : une étape par pièce posée, puis le modèle entier, son feu allumé seulement fini sur une île ouverte', () => {
    const id = 'landmark-5e-1';
    const couches = Object.values(LAYERS[id]);
    const jusqua = (k: number) => (c: { z: number }) => c.z <= couches[k - 1][1];
    for (let k = 1; k <= 4; k++) {
      const [m] = getImportedMonuments(chantier(id, jusqua(k)));
      expect(m.stage, `${k}`).toBe(k);
      expect(m.fire.positions.length).toBe(0);
    }
    const [fini] = getImportedMonuments(chantier(id, Infinity));
    expect(fini.stage).toBe(5);
    expect(fini.fire.positions.length).toBeGreaterThan(0);
    // Son halo de nuit : centré sur le feu, large, au-dessus du plan (le phare est le plus haut du monde de l'île).
    expect(fini.halo).not.toBeNull();
    expect(fini.halo!.cote).toBeGreaterThanOrEqual(HALO_DU_FEU_MIN);
    expect(fini.halo!.centre[1]).toBeGreaterThan(2 + 5);
    const [ferme] = getImportedMonuments(chantier(id, Infinity, undefined, true));
    expect(ferme.fire.positions.length).toBe(0);
    expect(ferme.halo).toBeNull();
    // Dans la construction : le modèle importé à la place du modèle taillé, son feu dans les fenêtres.
    const m = maillageDeLaConstruction('5e', chantier(id, Infinity));
    expect(m.phareDuLarge).toBeUndefined();
    expect(m.monuments?.[0].fenetres[1]).toBeGreaterThan(m.monuments![0].fenetres[0]);
    expect(m.monuments?.[0].halo?.cote).toBe(fini.halo!.cote);
    expect(coutDeLaConstruction(m).drawCalls).toBe(coutDeLaConstruction({ ...m, monuments: [{ ...m.monuments![0], halo: undefined }] }).drawCalls + 1);
  });

  it('un modèle arrivé fait refaire les îles (la version des monuments est dans le cache)', () => {
    const cubes = chantier('landmark-3e-2', Infinity);
    const cache = cacheDeLaConstruction();
    construireParIle('3e', cubes, [], cache);
    expect(construireParIle('3e', cubes, [], cache).refaites).toBe(0);
    loadMonumentsFromDisk();
    const r = construireParIle('3e', cubes, [], cache);
    expect(r.refaites).toBe(1);
    expect(r.maillage.monuments).toHaveLength(1);
    // Le modèle entier du temple : environ 3 000 triangles, les cubes en moins.
    expect(coutDeLaConstruction(r.maillage).triangles).toBeLessThanOrEqual(3_000 + 100);
  });
});
