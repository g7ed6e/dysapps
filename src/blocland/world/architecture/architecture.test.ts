import type { VoxelCube } from '../cube';
import { toutConstruit } from '../budget';
import { ARCHIPELAGO_IDS } from '../map';
import { worldCubes } from '../terrain';
import { architectureDe, FORMES, KITS, pieceDe, voisinageDe, indexDuPlan, type IdDePiece, type Kit } from '.';
import { boiteDansLaCase, FACES, facettesPosees, tournerCouvre, trianglesDe, TOUTES_LES_FACES, type DessinDePiece } from './pieces';

const cle = (c: { x: number; y: number; z: number }) => `${c.x},${c.y},${c.z}`;

/** Toutes les pièces possibles d'une classe. */
function toutesLesPieces(classe: 'mur' | 'toit'): IdDePiece[] {
  const out: IdDePiece[] = [];
  for (const { forme } of FORMES) for (const pied of ['pied', 'haut'] as const) for (const tete of ['chaperon', 'toit', 'mur'] as const) out.push(`${classe}.${forme}.${pied}.${tete}`);
  return out;
}

/** Un kit d'essai : la pierre et les planches dessinées partout par `dessin`. */
function kitDEssai(dessin: DessinDePiece): Kit {
  const pieces = Object.fromEntries(toutesLesPieces('mur').map((p) => [p, dessin]));
  return { matieres: { pierre: 'pierre', planches: 'bois' }, pieces: { pierre: pieces, bois: pieces } };
}

const cube = (x: number, y: number, z: number, texture = 'pierre', autre: Partial<VoxelCube> = {}): VoxelCube => ({ x, y, z, color: '#888888', texture, tag: 'port', ...autre });

describe('L’architecture modulaire (socle 7a)', () => {
  it('les kits des quatre archipels sont vides : aucun bloc remplacé, aucun triangle, sur tout un archipel construit', () => {
    const { progress, village } = toutConstruit();
    for (const a of ARCHIPELAGO_IDS) {
      expect(Object.keys(KITS[a].matieres), a).toEqual([]);
      expect(Object.keys(KITS[a].pieces), a).toEqual([]);
      const archi = architectureDe(a, worldCubes(a, progress, village, false));
      expect(archi.remplacees.size, a).toBe(0);
      expect(archi.pieces, a).toEqual([]);
      expect(archi.triangles, a).toBe(0);
    }
  }, 30_000);

  it('avec un kit, seuls les blocs posés d’une matière du kit deviennent pièces : ni fantôme, ni verre, ni lanterne, ni borne', () => {
    const kit = kitDEssai(boiteDansLaCase(0, 1, 0, 1, 0, 1));
    const cubes = [
      cube(0, 0, 1),
      cube(1, 0, 1, 'planches'),
      cube(2, 0, 1, 'pierre', { ghost: true }),
      cube(3, 0, 1, 'verre'),
      cube(0, 0, 2, 'lanterne'),
      cube(4, 0, 1, 'pierre', { quest: 'port:1' }),
      cube(5, 0, 1, 'pierre', { sol: true }),
      cube(6, 0, 1, 'brique'),
      cube(7, 0, 1, 'pierre'),
    ];
    const archi = architectureDe('6e', cubes, { kit, exclure: (c) => c.x === 7 });
    expect([...archi.remplacees].sort()).toEqual(['0,0,1', '1,0,1']);
    expect(archi.pieces.map((p) => p.famille)).toEqual(['pierre', 'bois']);
    // La planche voit la pierre à sa gauche et le fantôme à sa droite (le plan entier) : un mur droit.
    expect(archi.pieces[1].piece).toBe('mur.droit.pied.chaperon');
    expect(archi.triangles).toBe(2 * 12);
  });

  it('la pièce et son orientation sont celles de la règle, et la table des faces fermées suit la rotation', () => {
    // Une demi-boîte collée au côté −y de sa case : elle ne ferme que le sud.
    const demi = boiteDansLaCase(0, 1, 0, 0.5, 0, 1);
    expect(demi.couvre).toBe(FACES.sud);
    const cubes = [cube(0, 0, 1), cube(0, 1, 1)];
    const archi = architectureDe('6e', cubes, { kit: kitDEssai(demi) });
    for (const p of archi.pieces) {
      const v = voisinageDe(p.cube, indexDuPlan(cubes))!;
      expect(pieceDe(v)).toEqual({ piece: p.piece, rotation: p.rotation });
      expect(archi.couvre.get(cle(p.cube))).toBe(tournerCouvre(demi.couvre, p.rotation));
    }
  });

  it('une pièce reste dans sa case, quelle que soit sa rotation', () => {
    const d = boiteDansLaCase(0.1, 0.6, 0, 0.3, 0, 0.8);
    for (let r = 0; r < 4; r++)
      for (const f of facettesPosees(d, r, 10, 20, 3))
        for (const [x, y, z] of f.points) {
          expect(x >= 10 && x <= 11 && y >= 20 && y <= 21 && z >= 3 && z <= 4).toBe(true);
        }
    expect(trianglesDe(d)).toBe(12);
  });

  it('les faces fermées d’une boîte : pleine, toutes ; tournée, les côtés tournent avec elle', () => {
    expect(boiteDansLaCase(0, 1, 0, 1, 0, 1).couvre).toBe(TOUTES_LES_FACES);
    // À mi-hauteur, les côtés ne sont qu'à moitié couverts : seul le bas est fermé.
    expect(boiteDansLaCase(0, 1, 0, 1, 0, 0.5).couvre).toBe(FACES.bas);
    expect(boiteDansLaCase(0, 1, 0, 0.5, 0, 1).couvre).toBe(FACES.sud);
    expect(tournerCouvre(FACES.est | FACES.haut, 1)).toBe(FACES.nord | FACES.haut);
    expect(tournerCouvre(FACES.sud, 1)).toBe(FACES.est);
    expect(tournerCouvre(FACES.est, 4)).toBe(FACES.est);
  });
});
