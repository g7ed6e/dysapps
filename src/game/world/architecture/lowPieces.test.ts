// Les pièces basses de la table commune : le bac de pierre, la marche, la barrière (prête, en attente du budget).
import type { VoxelCube } from '../cube';
import { bacDePierre, barriere, FORMES, marche, PIECES_BASSES } from '.';
import { barriereDe, marcheDe, PIECE_SEULE_ET_BASSE } from './lowPieces';
import { FACES, facettesPosees, trianglesDe, type DessinDePiece } from './rooms';
import { KIT_6E } from './kits/6e';

/** Chaque point de chaque facette, à toute rotation, reste dans la case. */
function dansLaCase(d: DessinDePiece): boolean {
  for (let r = 0; r < 4; r++)
    for (const f of facettesPosees(d, r, 0, 0, 0)) for (const [x, y, z] of f.points) if (x < -1e-9 || x > 1 + 1e-9 || y < -1e-9 || y > 1 + 1e-9 || z < -1e-9 || z > 1 + 1e-9) return false;
  return true;
}

/** Aucune oblique : chaque facette suit un axe (rien qui se lise comme une lettre, X, V, Λ ou losange). */
const droite = (d: DessinDePiece) => d.facettes.every((f) => f.normale.filter((v) => v !== 0).length === 1);

const cube = (x: number, y: number): VoxelCube => ({ x, y, z: 1, color: '#888888', texture: 'barriere', tag: 't' });

describe('Les pièces basses', () => {
  it('le bac de pierre : seul et bas, en retrait dans sa case, son dessus en chaperon, ses côtés dans sa matière', () => {
    const b = bacDePierre();
    expect(dansLaCase(b) && droite(b)).toBe(true);
    expect(KIT_6E.pieces.pierre?.[PIECE_SEULE_ET_BASSE]).toEqual(b);
    const dessus = b.facettes.filter((f) => f.normale[2] > 0);
    expect(dessus.map((f) => f.role)).toEqual(['chaperon']);
    expect(Math.max(...b.facettes.flatMap((f) => f.points.map((p) => p[2])))).toBe(PIECES_BASSES.bac.haut);
    expect(b.facettes.filter((f) => f.normale[2] === 0).every((f) => f.role === undefined && f.face === 'cote')).toBe(true);
    // Pas plus de triangles qu'un cube (son dessous, posé sur le sol, n'est pas émis).
    expect(trianglesDe(b) - 2).toBeLessThanOrEqual(10);
  });

  it('la marche : de pierre (le soubassement du kit), basse, ou toute la case sous ce qui est posé dessus', () => {
    const basse = marche(false);
    expect(dansLaCase(basse) && droite(basse)).toBe(true);
    expect(Math.max(...basse.facettes.flatMap((f) => f.points.map((p) => p[2])))).toBe(PIECES_BASSES.marche);
    expect(basse.facettes.every((f) => f.role === 'soubassement')).toBe(true);
    expect(basse.couvre).toBe(FACES.bas);
    expect(marche(true).couvre).toBe(0b111111);
    expect(marcheDe('mur.droit.pied.chaperon')).toBe(marcheDe('mur.seul.haut.chaperon'));
    expect(marcheDe('mur.seul.pied.mur')).toEqual(marche(true));
    expect(marcheDe('toit.plat.courant.ciel')).toBeUndefined();
  });

  it('la barrière : un poteau au milieu, une lisse vers chaque voisine ; de chaque forme, dans sa case, sans oblique', () => {
    for (const { forme, cotes } of FORMES)
      for (const dessus of [false, true])
        for (const poteau of [false, true]) {
          const b = barriere(forme, dessus, poteau);
          expect(dansLaCase(b) && droite(b), forme).toBe(true);
          expect(b.couvre).toBe(0);
          // Les lisses touchent les côtés des voisines, et eux seuls.
          const touche = [0, 1, 2, 3].map((r) => b.facettes.some((f) => f.points.some(([x, y]) => [x === 1, y === 1, x === 0, y === 0][r])));
          expect(touche, forme).toEqual([0, 1, 2, 3].map((r) => Boolean(cotes & (1 << r))));
        }
    // Au bout d'une rangée, ou seule : un poteau haut, sur lequel une lanterne se pose.
    const haut = (b: DessinDePiece) => Math.max(...b.facettes.flatMap((f) => f.points.map((p) => p[2])));
    expect(haut(barriere('bout', false, false))).toBe(1);
    expect(haut(barriere('seul', false, false))).toBe(1);
    expect(haut(barriere('droit', false, false))).toBe(PIECES_BASSES.lisse.haut);
    // Au milieu d'une rangée, un poteau une case sur deux, comme le garde-corps du pont.
    expect(barriereDe('mur.droit.pied.chaperon', cube(0, 0))).toBe(barriereDe('mur.droit.pied.chaperon', cube(2, 0)));
    expect(barriereDe('mur.droit.pied.chaperon', cube(1, 0))!.facettes.length).toBeLessThan(barriereDe('mur.droit.pied.chaperon', cube(0, 0))!.facettes.length);
  });

  it('la barrière attend le budget : elle n’est pas dans le kit des Premiers Rivages', () => {
    expect(KIT_6E.finitions?.barriere).toBeUndefined();
  });
});
