// Le lissage (mot du mainteneur du 8 octobre 2026 : « go pour le lissage ») : dans la construction taillée du 6e, les
// cases voisines d'une même matière d'un plan à part (une petite construction, un monument) font un seul volume, une
// seule teinte, un seul dessus, sans chaperon par case ; le bac « pièce seule » reste à la case isolée. Les autres
// archipels n'ont pas de lissage.
import type { VoxelCube } from '../cube';
import { maillageDeLaConstruction, teinteDeCase } from '../construction';
import { architectureDe, KITS, MOTIF, PIECES_BASSES } from '.';
import { volumesDeMatiere } from './volumes';

/** Loin de toute île : aucun bâtiment des plans ne s'y trouve. */
const LOIN = 900;
const petite = (x: number, y: number, z: number, texture = 'pierre', autre: Partial<VoxelCube> = {}): VoxelCube => ({
  x: LOIN + x,
  y: LOIN + y,
  z,
  color: '#888888',
  texture,
  tag: 'french-6e-reading',
  petiteConstruction: true,
  ...autre,
});
/** Le sol sous une emprise, au niveau 0. */
const solSous = (cubes: VoxelCube[]): VoxelCube[] => cubes.filter((c) => c.z === 1).map((c) => ({ x: c.x, y: c.y, z: 0, color: '#557744', texture: 'herbe', sol: true }));

/** Les triangles de l'opaque, par sommets (repère de grille : x, y, z, la hauteur en z). */
function triangles(m: ReturnType<typeof maillageDeLaConstruction>) {
  const o = m.opaque;
  const out: { p: [number, number, number][]; n: [number, number, number]; teintes: number[]; motifs: number[] }[] = [];
  for (let t = 0; t < o.indices.length / 3; t++) {
    const s = [0, 1, 2].map((k) => o.indices[3 * t + k]);
    out.push({
      p: s.map((i) => [o.positions[3 * i], o.positions[3 * i + 2], o.positions[3 * i + 1]]),
      n: [o.normals[3 * s[0]], o.normals[3 * s[0] + 2], o.normals[3 * s[0] + 1]],
      teintes: s.map((i) => o.teintes[i]),
      motifs: s.map((i) => o.motifs[i]),
    });
  }
  return out;
}

describe('Le lissage : un volume par matière', () => {
  it('les volumes : une colonne d’une même matière en fait un, une autre matière ou un autre plan en fait un autre', () => {
    const cubes = [petite(0, 0, 1), petite(0, 0, 2), petite(0, 0, 3), petite(1, 0, 1, 'galet'), petite(0, 1, 1, 'pierre', { tag: 'autre' })];
    const v = volumesDeMatiere(cubes, (c) => c.tag ?? null);
    const de = (c: VoxelCube) => v.get(`${c.x},${c.y},${c.z}`)!;
    expect(de(cubes[0])).toBe(de(cubes[2]));
    expect(de(cubes[0])).toMatchObject({ bas: 1, haut: 3, ancre: cubes[0] });
    expect(de(cubes[3])).not.toBe(de(cubes[0]));
    expect(de(cubes[4])).not.toBe(de(cubes[0]));
  });

  it('une colonne de trois cases de même matière n’a qu’un dessus, sans chaperon, et une seule teinte', () => {
    const colonne = [petite(0, 0, 1), petite(0, 0, 2), petite(0, 0, 3)];
    const t = triangles(maillageDeLaConstruction('6e', colonne, solSous(colonne)));
    const dessus = t.filter((x) => x.n[2] > 0.5);
    // Un seul rectangle, en haut de la colonne.
    expect(dessus).toHaveLength(2);
    expect(dessus.every((x) => x.p.every((p) => p[2] === 4))).toBe(true);
    // Ni chaperon ni dessus de pierre : le dessus est dans sa matière.
    expect(t.every((x) => x.motifs.every((m) => !(m & (MOTIF.chaperon | MOTIF.pierreEntiere))))).toBe(true);
    // Une teinte pour tout le volume, celle de sa case d'ancrage (le pied) : aucun joint de teinte entre les cases.
    const teinte = teinteDeCase(LOIN, LOIN, 1);
    expect(t.every((x) => x.teintes.every((v) => Math.abs(v - teinte) < 1e-6))).toBe(true);
    // Chaque côté d'un seul tenant : quatre rectangles, et le dessous est caché par le sol.
    expect(t).toHaveLength(2 + 4 * 2);
  });

  it('deux cases voisines de même matière n’ont pas de face entre elles, et chaque face est d’un seul tenant', () => {
    const paire = [petite(0, 0, 1, 'galet'), petite(1, 0, 1, 'galet')];
    const t = triangles(maillageDeLaConstruction('6e', paire, solSous(paire)));
    // Aucun triangle sur le plan qui les sépare.
    expect(t.some((x) => x.p.every((p) => p[0] === LOIN + 1))).toBe(false);
    // Le dessus, les deux longs côtés et les deux bouts : un rectangle chacun.
    expect(t).toHaveLength(5 * 2);
  });

  it('le dessus d’un socle sous une tour d’une autre matière est d’une seule peinture (plus de damier de dessus)', () => {
    // Un socle de terre de 3 × 3, une tour de brique au milieu (comme le grand moulin).
    const socle: VoxelCube[] = [];
    for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) socle.push(petite(x, y, 1, 'terre', { place: 'monument:landmark-6e-2', petiteConstruction: undefined }));
    const tour = [petite(1, 1, 2, 'brique', { place: 'monument:landmark-6e-2', petiteConstruction: undefined })];
    const t = triangles(maillageDeLaConstruction('6e', [...socle, ...tour], solSous(socle)));
    const dessusDuSocle = t.filter((x) => x.n[2] > 0.5 && x.p.every((p) => p[2] === 2));
    expect(dessusDuSocle.length).toBeGreaterThan(0);
    expect(new Set(dessusDuSocle.flatMap((x) => x.motifs)).size).toBe(1);
    expect(new Set(dessusDuSocle.flatMap((x) => x.teintes)).size).toBe(1);
    const peints = architectureDe('6e', [...socle, ...tour]).peints;
    for (const c of socle) expect(peints.get(`${c.x},${c.y},${c.z}`)!.peinture.motifs[4]).toBe(0);
  });

  it('le bac « pièce seule » reste à la case isolée, jamais dans un volume réuni', () => {
    const seule = [petite(0, 0, 1)];
    const a = architectureDe('6e', seule, { surLeVide: () => false });
    expect(a.pieces.map((p) => p.piece)).toEqual(['mur.seul.pied.chaperon']);
    expect(PIECES_BASSES.bac.rebord).toBeGreaterThan(0);
    // Deux cases empilées, ou côte à côte : un volume, peint, sans bac ni rebord gris.
    for (const volume of [
      [petite(0, 0, 1), petite(0, 0, 2)],
      [petite(0, 0, 1), petite(1, 0, 1)],
    ]) {
      const b = architectureDe('6e', volume, { surLeVide: () => false });
      expect(b.pieces).toHaveLength(0);
      expect(b.peints.size).toBe(2);
      for (const p of b.peints.values()) expect(p.peinture.motifs.every((m) => !(m & (MOTIF.chaperon | MOTIF.pierreEntiere)))).toBe(true);
    }
  });

  it('les bâtiments des plans gardent leur chaperon et la teinte de chaque case', () => {
    // Un muret de pierre hors d'un plan à part (le kit d'essai lit tout le plan) : la peinture d'avant.
    const muret = [0, 1].map((x) => ({ x, y: 0, z: 1, color: '#888888', texture: 'pierre', tag: 'port' }) as VoxelCube);
    const a = architectureDe('6e', muret, { kit: KITS['6e'], surLeVide: () => false });
    for (const p of a.peints.values()) expect(p.peinture.motifs[4] & MOTIF.pierreEntiere).toBeTruthy();
    // Sur la carte des bâtiments, les cases ne sont jamais lissées : chacune garde sa teinte.
    const batiments = new Map(muret.map((c) => [`${c.x},${c.y},${c.z}`, c.texture!]));
    expect(architectureDe('6e', muret, { kit: KITS['6e'], batiments, surLeVide: () => false }).lisses.size).toBe(0);
  });

  it('le 5e, le 4e et le 3e n’ont pas de lissage', () => {
    for (const a of ['5e', '4e', '3e'] as const) {
      expect(KITS[a].lissage).toBeUndefined();
      expect(architectureDe(a, [petite(0, 0, 1), petite(0, 0, 2)]).lisses.size).toBe(0);
    }
  });
});
