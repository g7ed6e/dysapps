import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ArchipelagoId } from '../../archipelago';
import { TAILLE_DU_BONHOMME } from '../avatar';
import { BONHOMME } from '../colors';
import { fusionDuBonhomme, trianglesDeLaFusion } from '../merges';
import { chargerKeoDuDisque } from './fromDisk.testing';
import { keoImporte, TENUES_DE_KEO } from './keo';

const ARCHIPELS = Object.keys(TENUES_DE_KEO) as ArchipelagoId[];

/** La clarté d'une couleur, de 0 à 1 (le L de TSL). */
const clarte = (c: number) => (Math.max(c >> 16, (c >> 8) & 255, c & 255) + Math.min(c >> 16, (c >> 8) & 255, c & 255)) / 2 / 255;

/** Les cibles de la colonne « aplats » de reglages.csv pour une tenue (`source>cible` et `source@bas-haut>cible`). */
function ciblesDe(nom: string): Set<number> {
  const ligne = readFileSync(resolve(__dirname, '../../../../../docs/univers/archipeo/personnages/modeles/reglages.csv'), 'utf8')
    .split('\n')
    .map((l) => l.split(';'))
    .find((c) => c[0] === nom);
  if (!ligne) throw new Error(`Pas de ligne pour ${nom}`);
  return new Set(ligne[4].split(' ').map((p) => parseInt(p.split('>')[1], 16)));
}

beforeAll(() => chargerKeoDuDisque());

describe('Kéo, le bonhomme d’Archipéo, une tenue par archipel', () => {
  it('chaque archipel a sa tenue : 1 500 triangles au plus, deux blocs de haut, les pieds au sol, centré sur sa case', () => {
    for (const a of ARCHIPELS) {
      const f = keoImporte(a)!;
      expect(f, a).not.toBeNull();
      expect(f.positions.length / 9, a).toBeLessThanOrEqual(1_500);
      let [bas, haut, large] = [Infinity, -Infinity, 0];
      for (let i = 0; i < f.positions.length; i += 3) {
        bas = Math.min(bas, f.positions[i + 1]);
        haut = Math.max(haut, f.positions[i + 1]);
        large = Math.max(large, Math.abs(f.positions[i]), Math.abs(f.positions[i + 2]));
      }
      expect(bas, a).toBeCloseTo(0, 5);
      expect(haut, a).toBeCloseTo(TAILLE_DU_BONHOMME, 4);
      // Dans sa case (une demi-case de chaque côté), sac et porte-cartes compris.
      expect(large, a).toBeLessThan(0.5);
    }
  });

  it('il regarde l’élève (−Z) : son visage devant, ses cheveux derrière', () => {
    for (const a of ARCHIPELS) {
      const f = keoImporte(a)!;
      const zMoyen = (couleur: number) => {
        let [s, n] = [0, 0];
        for (let t = 0; t < f.teintes.length; t++) {
          const y = (f.positions[t * 9 + 1] + f.positions[t * 9 + 4] + f.positions[t * 9 + 7]) / 3;
          if (f.teintes[t] !== couleur || y < 0.8 * TAILLE_DU_BONHOMME || y > 0.9 * TAILLE_DU_BONHOMME) continue;
          s += (f.positions[t * 9 + 2] + f.positions[t * 9 + 5] + f.positions[t * 9 + 8]) / 3;
          n++;
        }
        return s / n;
      };
      expect(zMoyen(BONHOMME.peau), a).toBeLessThan(-0.05);
    }
  });

  it('il marche comme le bonhomme : ses os de squelette.py, les bras et les jambes de chaque côté, quatre poids de somme 1', () => {
    for (const a of ARCHIPELS) {
      const { skin, positions } = keoImporte(a)!;
      const noms = skin!.bones.map((b) => b.name);
      expect(noms, a).toEqual(['hips', 'spine', 'head', 'thigh.L', 'shin.L', 'thigh.R', 'shin.R', 'arm.L', 'arm.R']);
      const os = (nom: string) => skin!.bones.find((b) => b.name === nom)!;
      // Le côté gauche du bonhomme, face à l'élève, est en x < 0 (comme `bras-gauche`, ../avatar.ts).
      expect(os('arm.L').head[0], a).toBeLessThan(0);
      expect(os('arm.R').head[0], a).toBeGreaterThan(0);
      expect(os('thigh.L').head[0], a).toBeLessThan(0);
      expect(os('thigh.R').head[0], a).toBeGreaterThan(0);
      // Les hanches à l'entrejambe, les épaules sous le cou.
      expect(os('thigh.L').head[1] / TAILLE_DU_BONHOMME, a).toBeCloseTo(0.42, 1);
      expect(os('arm.L').head[1] / TAILLE_DU_BONHOMME, a).toBeGreaterThan(0.65);
      for (let v = 0; v < positions.length / 3; v++) {
        const w = skin!.weights;
        expect(w[v * 4] + w[v * 4 + 1] + w[v * 4 + 2] + w[v * 4 + 3]).toBeCloseTo(1, 5);
      }
    }
  });

  it('il est peint en aplats, aux cibles de sa ligne de reglages.csv, et son corps se détache de l’herbe', () => {
    for (const a of ARCHIPELS) {
      const { teintes, positions: p } = keoImporte(a)!;
      const cibles = ciblesDe(TENUES_DE_KEO[a]);
      for (const c of teintes) expect(cibles.has(c), `${a} ${c.toString(16)}`).toBe(true);
      const parts = new Map<number, number>();
      teintes.forEach((c, t) => {
        const o = t * 9;
        const [ux, uy, uz] = [p[o + 3] - p[o], p[o + 4] - p[o + 1], p[o + 5] - p[o + 2]];
        const [vx, vy, vz] = [p[o + 6] - p[o], p[o + 7] - p[o + 1], p[o + 8] - p[o + 2]];
        parts.set(c, (parts.get(c) ?? 0) + Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx));
      });
      const corps = [...parts].sort((x, y) => y[1] - x[1])[0][0];
      // L'herbe du 6e a une clarté de 0,36.
      expect(clarte(corps), a).toBeGreaterThan(0.4);
    }
  });

  it('chargé, il remplace le bonhomme dessiné en code dans la fusion de son archipel, avec ses poids ; sans archipel, le bonhomme reste', () => {
    const enCode = fusionDuBonhomme();
    expect(enCode.poids).toBeUndefined();
    expect(enCode.squelette.map((o) => o.nom)).toContain('bras-gauche');
    for (const a of ARCHIPELS) {
      const f = fusionDuBonhomme(a);
      expect(trianglesDeLaFusion(f), a).toBe(keoImporte(a)!.positions.length / 9);
      expect(f.poids?.joints.length, a).toBe((f.positions.length / 3) * 4);
      expect(f.squelette.every((o) => o.id === 'bonhomme'), a).toBe(true);
      // La même fusion à chaque appel : la scène ne la refait pas.
      expect(fusionDuBonhomme(a), a).toBe(f);
      // L'os de chaque sommet est son plus lourd.
      for (let v = 0; v < f.os.length; v += 97) {
        const w = f.poids!.weights;
        const k = [0, 1, 2, 3].reduce((m, j) => (w[v * 4 + j] > w[v * 4 + m] ? j : m), 0);
        expect(f.os[v]).toBe(f.poids!.joints[v * 4 + k]);
      }
    }
  });
});
