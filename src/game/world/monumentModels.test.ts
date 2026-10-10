import { existsSync } from 'node:fs';
import type { VoxelCube } from '../Voxel';
import { cacheDeLaConstruction, caseDeLaPiece, construireParIle, coutDeLaConstruction, maillageDeLaConstruction } from './construction';
import { EMPRISE_DU_MONUMENT, estUnFeu, etapeAffichee, etapesDuMonument, fichierDeLEtape, MODELES_DES_MONUMENTS, monumentCharge, monumentsImportes } from './monumentModels';
import { chargerLesMonumentsDuDisque, fichierDuMonument } from './monumentModels.fromDisk.testing';
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
    expect(etapeAffichee(0, 90, 2)).toBe(0);
    expect(etapeAffichee(29, 90, 2)).toBe(0);
    expect(etapeAffichee(30, 90, 2)).toBe(1);
    expect(etapeAffichee(59, 90, 2)).toBe(1);
    expect(etapeAffichee(60, 90, 2)).toBe(2);
    expect(etapeAffichee(89, 90, 2)).toBe(2);
    expect(etapeAffichee(90, 90, 2)).toBe(3);
    // Un plan qui ne se divise pas juste : 116 cases, le tiers à 38,67 (39 posées).
    expect(etapeAffichee(38, 116, 2)).toBe(0);
    expect(etapeAffichee(39, 116, 2)).toBe(1);
  });

  it('quatre étapes : un cinquième, deux, trois, quatre, puis le modèle entier', () => {
    expect([0, 19, 20, 40, 60, 80, 99, 100].map((n) => etapeAffichee(n, 100, 4))).toEqual([0, 0, 1, 2, 3, 4, 4, 5]);
  });

  it('un plan vide ne montre rien', () => {
    expect(etapeAffichee(0, 0, 2)).toBe(0);
  });
});

describe('Le registre des monuments importés', () => {
  it('les huit monuments classés, et eux seuls (les grands projets neufs de la 4e et de la 3e gardent leurs blocs)', () => {
    expect(Object.keys(MODELES_DES_MONUMENTS).sort()).toEqual(['landmark-3e-1', 'landmark-3e-2', 'landmark-4e-1', 'landmark-4e-2', 'landmark-5e-1', 'landmark-5e-2', 'landmark-6e-1', 'landmark-6e-2']);
    for (const id of Object.keys(MODELES_DES_MONUMENTS)) expect(getMonument(id), id).toBeDefined();
    expect(MONUMENTS.filter((m) => !MODELES_DES_MONUMENTS[m.id]).map((m) => m.id)).toEqual(['landmark-4e-3', 'landmark-4e-4', 'landmark-3e-3', 'landmark-3e-4', 'landmark-3e-5']);
  });

  it('chaque étape et chaque modèle entier est dans le dépôt (le phare du large : quatre étapes, ses cinq pièces)', () => {
    expect(MODELES_DES_MONUMENTS['landmark-5e-1'].etapes).toBe(Object.keys(LAYERS['landmark-5e-1']).length - 1);
    for (const id of Object.keys(MODELES_DES_MONUMENTS)) for (const e of etapesDuMonument(id)) expect(existsSync(fichierDuMonument(id, e)), `${id} ${e}`).toBe(true);
    expect(fichierDeLEtape(1, 2)).toBe('etape-1.glb');
    expect(fichierDeLEtape(3, 2)).toBe('final-3000.glb');
    expect(etapesDuMonument('landmark-5e-1')).toEqual([1, 2, 3, 4, 5]);
    expect(etapesDuMonument('landmark-4e-3')).toEqual([]);
  });

  it('pas chargé : le monument garde ses blocs', () => {
    expect(monumentCharge('landmark-6e-2')).toBe(false);
    expect(monumentsImportes(chantier('landmark-6e-2', Infinity))).toEqual([]);
  });

  it('le feu : l’orangé vif du phare, pas ses pierres ni son fer', () => {
    const lin = (h: number) => [16, 8, 0].map((s) => Math.pow(((h >> s) & 255) / 255, 2.2)) as [number, number, number];
    expect(estUnFeu(...lin(0xed9547))).toBe(true);
    for (const h of [0x676d75, 0x1c181c, 0xd1cfc9, 0xb67d6a, 0x9d8262]) expect(estUnFeu(...lin(h)), h.toString(16)).toBe(false);
  });
});

describe('Les monuments importés dans la construction taillée', () => {
  beforeAll(() => chargerLesMonumentsDuDisque());

  it('chargés : toutes les étapes de chaque monument', () => {
    for (const id of Object.keys(MODELES_DES_MONUMENTS)) expect(monumentCharge(id), id).toBe(true);
  });

  it('l’étape suit l’avancée du plan, remplace les cubes posés, et tient dans l’emprise, au pied du monument', () => {
    const id = 'landmark-6e-2';
    const n = getMonument(id)!.cells.length;
    const o = { x: 40, y: 60, z: 2 };
    expect(monumentsImportes(chantier(id, Math.ceil(n / 3) - 1, o))).toEqual([]);
    for (const [posees, etape] of [
      [Math.ceil(n / 3), 1],
      [Math.ceil((2 * n) / 3), 2],
      [n, 3],
    ] as const) {
      const cubes = chantier(id, posees, o);
      const [m] = monumentsImportes(cubes);
      expect(m.etape, `${posees}`).toBe(etape);
      expect(m.remplacees.size).toBe(posees);
      expect(m.cellules).toHaveLength(posees);
      expect(m.feu.positions.length).toBe(0);
      // Le modèle au milieu des 7 × 7 de l'emprise (les cases du plan vont de 0 à 6), posé au pied (z = 2).
      const p = m.opaque.positions;
      let [x0, x1, y0, z0, z1] = [Infinity, -Infinity, Infinity, Infinity, -Infinity];
      for (let i = 0; i < p.length; i += 3) {
        [x0, x1, y0, z0, z1] = [Math.min(x0, p[i]), Math.max(x1, p[i]), Math.min(y0, p[i + 1]), Math.min(z0, p[i + 2]), Math.max(z1, p[i + 2])];
      }
      expect(x0).toBeGreaterThanOrEqual(o.x - 1e-3);
      expect(x1).toBeLessThanOrEqual(o.x + EMPRISE_DU_MONUMENT + 1e-3);
      expect(z0).toBeGreaterThanOrEqual(o.y - 1e-3);
      expect(z1).toBeLessThanOrEqual(o.y + EMPRISE_DU_MONUMENT + 1e-3);
      expect(y0).toBeCloseTo(o.z, 1);
    }
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
      const [m] = monumentsImportes(chantier(id, jusqua(k)));
      expect(m.etape, `${k}`).toBe(k);
      expect(m.feu.positions.length).toBe(0);
    }
    const [fini] = monumentsImportes(chantier(id, Infinity));
    expect(fini.etape).toBe(5);
    expect(fini.feu.positions.length).toBeGreaterThan(0);
    const [ferme] = monumentsImportes(chantier(id, Infinity, undefined, true));
    expect(ferme.feu.positions.length).toBe(0);
    // Dans la construction : le modèle importé à la place du modèle taillé, son feu dans les fenêtres.
    const m = maillageDeLaConstruction('5e', chantier(id, Infinity));
    expect(m.phareDuLarge).toBeUndefined();
    expect(m.monuments?.[0].fenetres[1]).toBeGreaterThan(m.monuments![0].fenetres[0]);
  });

  it('un modèle arrivé fait refaire les îles (la version des monuments est dans le cache)', () => {
    const cubes = chantier('landmark-3e-2', Infinity);
    const cache = cacheDeLaConstruction();
    construireParIle('3e', cubes, [], cache);
    expect(construireParIle('3e', cubes, [], cache).refaites).toBe(0);
    chargerLesMonumentsDuDisque();
    const r = construireParIle('3e', cubes, [], cache);
    expect(r.refaites).toBe(1);
    expect(r.maillage.monuments).toHaveLength(1);
    // Le modèle entier du temple : environ 3 000 triangles, les cubes en moins.
    expect(coutDeLaConstruction(r.maillage).triangles).toBeLessThanOrEqual(3_000 + 100);
  });
});
