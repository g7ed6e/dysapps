// Le modelé dessiné (U2) : sans modelé, le sol d'Archipéo est le relief de marche tel quel ; avec un modelé, seules les
// colonnes libres de son île bougent, et la grille (les cubes du monde) ne bouge jamais.
import { toutConstruit } from '../budget';
import { ARCHIPELAGO_IDS } from '../archipels';
import { champDuSol } from '../landMesh';
import { rangerLeDecor } from '../decorMesh';
import { origineDe, worldCubes } from '../terrain';
import { islandsOf } from '../archipelago';
import { MODELES, modelerLeSol } from '.';

const { progress, village } = toutConstruit();
const monde = (a: (typeof ARCHIPELAGO_IDS)[number]) => {
  const cubes = worldCubes(a, progress, village, false);
  const { reste } = rangerLeDecor(cubes.filter((c) => !c.sol));
  return { cubes, sol: cubes.filter((c) => c.sol), reste };
};

describe('Le modelé dessiné', () => {
  it('chaque archipel a son fichier, et une île n’est modelée que dans le fichier de son archipel', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const iles = new Set(islandsOf(a).map((b) => b.id));
      for (const id of Object.keys(MODELES[a])) expect(iles.has(id as never), `${id} dans ${a}`).toBe(true);
    }
  });

  it('sans modelé, le sol est rendu tel quel (le même tableau)', () => {
    const { sol, reste } = monde('6e');
    expect(modelerLeSol('6e', sol, reste, {})).toBe(sol);
  });

  it('un modelé monte ou descend les colonnes libres de son île, jamais ce qui est posé, et la grille ne bouge pas', () => {
    const { cubes, sol, reste } = monde('5e');
    const avant = JSON.stringify(cubes);
    const ile = islandsOf('5e')[0].id;
    const o = origineDe(ile);
    // Un gradin : tout ce qui est derrière le cœur monte de deux blocs ; devant, tout descend d'un bloc.
    const modele = { hauteur: (_x: number, y: number, h: number) => (y >= 16 ? h + 2 : h - 1) };
    const modele5e = modelerLeSol('5e', sol, reste, { [ile]: modele });
    const champAvant = champDuSol('5e', sol, reste);
    const champApres = champDuSol('5e', modele5e, reste);
    const posees = new Set(reste.map((c) => `${c.x},${c.y}`));
    let montees = 0;
    let descendues = 0;
    for (const col of champAvant.colonnes) {
      const apres = champApres.colonnes[champApres.index.get((col.x + 16384) * 32768 + (col.y + 16384))!];
      expect(apres.bas).toBe(col.bas);
      const bouge = col.ile === ile && !posees.has(`${col.x},${col.y}`) && !col.liquide;
      if (!bouge) {
        expect(apres.haut, `${col.x},${col.y}`).toBe(col.haut);
        continue;
      }
      const attendu = col.y - o.y >= 16 ? col.haut + 2 : Math.max(col.haut - 1, col.bas + (col.haut > col.bas ? 1 : 0));
      expect(apres.haut, `${col.x},${col.y}`).toBe(attendu);
      // Le dessus garde sa matière ; la colonne reste pleine, du bas au dessus.
      expect(apres.matieres[apres.matieres.length - 1]).toBe(col.matieres[col.matieres.length - 1]);
      expect(apres.matieres.length).toBe(apres.haut - apres.bas + 1);
      if (apres.haut > col.haut) montees++;
      if (apres.haut < col.haut) descendues++;
    }
    expect(montees).toBeGreaterThan(0);
    expect(descendues).toBeGreaterThan(0);
    expect(JSON.stringify(cubes)).toBe(avant);
  });
});
