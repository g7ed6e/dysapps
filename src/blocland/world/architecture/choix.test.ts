import type { VoxelCube } from '../cube';
import { cotesDeReference, FORMES, pieceDe, type Forme } from './choix';
import { indexDuPlan, tournerCotes, tournerVoisinage, voisinageDe, type Classe, type Voisinage } from './voisinage';

const CLASSES: Classe[] = ['mur', 'toit'];
const AUTOUR: (Classe | 'rien')[] = ['rien', 'mur', 'toit'];

/** Tous les voisinages possibles : chaque classe, chaque masque de côtés, chaque dessus et chaque dessous. */
function tous(): Voisinage[] {
  const out: Voisinage[] = [];
  for (const classe of CLASSES)
    for (let cotes = 0; cotes < 16; cotes++)
      for (const dessus of AUTOUR) for (const dessous of AUTOUR) out.push({ texture: classe === 'toit' ? 'toit' : 'pierre', classe, cotes, dessus, dessous });
  return out;
}

/** Un cube d'un plan. */
const cube = (x: number, y: number, z: number, texture = 'pierre', autre: Partial<VoxelCube> = {}): VoxelCube => ({ x, y, z, color: '#888888', texture, tag: 'port', ...autre });

describe('Le choix d’une pièce d’architecture', () => {
  it('reconnaît les motifs : seul, bout, droit, angle, té, croix', () => {
    const attendu: Record<number, Forme> = {
      0b0000: 'seul',
      0b0001: 'bout',
      0b0010: 'bout',
      0b0100: 'bout',
      0b1000: 'bout',
      0b0101: 'droit',
      0b1010: 'droit',
      0b0011: 'angle',
      0b0110: 'angle',
      0b1100: 'angle',
      0b1001: 'angle',
      0b0111: 'te',
      0b1110: 'te',
      0b1101: 'te',
      0b1011: 'te',
      0b1111: 'croix',
    };
    for (let cotes = 0; cotes < 16; cotes++) {
      const { piece } = pieceDe({ texture: 'pierre', classe: 'mur', cotes, dessus: 'mur', dessous: 'mur' });
      expect(piece, `${cotes}`).toBe(`mur.${attendu[cotes]}.haut.mur`);
    }
  });

  it('la pièce tournée retrouve exactement les voisines : sa forme de référence, tournée, donne le masque', () => {
    for (const v of tous()) {
      const { piece, rotation } = pieceDe(v);
      const forme = piece.split('.')[1] as Forme;
      expect(tournerCotes(cotesDeReference(forme), rotation), `${piece} ${v.cotes}`).toBe(v.cotes);
    }
  });

  it('est invariante par rotation de 90° : même pièce, tournée d’un quart de tour de plus (à la symétrie près)', () => {
    for (const v of tous())
      for (let r = 1; r < 4; r++) {
        const a = pieceDe(v);
        const b = pieceDe(tournerVoisinage(v, r));
        expect(b.piece).toBe(a.piece);
        const forme = a.piece.split('.')[1] as Forme;
        // La géométrie posée est la même : la référence tournée de (a + r) ou de b donne le même masque.
        expect(tournerCotes(cotesDeReference(forme), b.rotation)).toBe(tournerCotes(cotesDeReference(forme), a.rotation + r));
      }
  });

  it('est déterministe : le même voisinage donne toujours la même pièce', () => {
    const premiers = tous().map(pieceDe);
    expect(tous().map(pieceDe)).toEqual(premiers);
    // Les formes de référence sont toutes différentes à rotation près, et couvrent les 16 masques.
    const vus = new Set<number>();
    for (const f of FORMES) for (let r = 0; r < 4; r++) vus.add(tournerCotes(f.cotes, r));
    expect(vus.size).toBe(16);
  });

  it('un mur sans rien au-dessus dans le plan porte un chaperon, jamais un toit ajouté ; sous un toit, une tête de toit', () => {
    const base: Voisinage = { texture: 'pierre', classe: 'mur', cotes: 0b0101, dessus: 'rien', dessous: 'mur' };
    expect(pieceDe(base).piece).toBe('mur.droit.haut.chaperon');
    expect(pieceDe({ ...base, dessus: 'toit' }).piece).toBe('mur.droit.haut.toit');
    expect(pieceDe({ ...base, dessus: 'mur' }).piece).toBe('mur.droit.haut.mur');
    // Au pied : rien du plan dessous.
    expect(pieceDe({ ...base, dessous: 'rien' }).piece).toBe('mur.droit.pied.chaperon');
  });
});

describe('Le voisinage d’un bloc', () => {
  it('se lit sur le plan entier : une voisine encore fantôme compte, et la pièce ne change pas quand on la pose', () => {
    const posee = cube(0, 0, 1);
    const fantomes = [cube(1, 0, 1, 'pierre', { ghost: true }), cube(0, 0, 2, 'toit', { ghost: true })];
    const avant = voisinageDe(posee, indexDuPlan([posee, ...fantomes]))!;
    const apres = voisinageDe(posee, indexDuPlan([posee, ...fantomes.map((c) => ({ ...c, ghost: undefined }))]))!;
    expect(avant).toEqual(apres);
    expect(avant.cotes).toBe(0b0001);
    expect(avant.dessus).toBe('toit');
    expect(avant.dessous).toBe('rien');
  });

  it('ne compte ni le sol, ni le décor, ni une borne, ni un pont, ni une lanterne ; une vitre fait mur', () => {
    const c = cube(5, 5, 3);
    const autour = [
      cube(6, 5, 3, 'pierre', { sol: true }),
      cube(4, 5, 3, 'pierre', { decor: 'foret/arbre@4,5' }),
      cube(5, 6, 3, 'pierre', { quest: 'port:1' }),
      cube(5, 4, 3, 'planches', { bridge: 'b1' }),
      cube(5, 5, 4, 'lanterne'),
      cube(5, 5, 2, 'verre'),
    ];
    const v = voisinageDe(c, indexDuPlan([c, ...autour]))!;
    expect(v).toEqual({ texture: 'pierre', classe: 'mur', cotes: 0, dessus: 'rien', dessous: 'mur' });
    expect(voisinageDe(cube(0, 0, 0, 'lanterne'), indexDuPlan([]))).toBeNull();
  });

  it('les côtés ne comptent que la même classe : un toit à côté d’un mur n’allonge pas le mur', () => {
    const m = cube(0, 0, 3);
    const v = voisinageDe(m, indexDuPlan([m, cube(1, 0, 3, 'toit'), cube(-1, 0, 3, 'tuile'), cube(0, 1, 3, 'planches')]))!;
    expect(v.cotes).toBe(0b0010);
  });
});
