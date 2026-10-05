import type { VoxelCube } from '../cube';
import { cotesDeReference, FORMES, PENTES, pieceDe, type Forme, type Pente } from './choices';
import { indexDuPlan, tournerCotes, tournerVoisinage, voisinageDe, type Classe, type Voisinage } from './neighbourhood';

const AUTOUR: (Classe | 'rien')[] = ['rien', 'mur', 'toit'];

/** Un voisinage, rien autour par défaut. */
const vois = (v: Partial<Voisinage> & Pick<Voisinage, 'classe'>): Voisinage => ({
  texture: v.classe === 'toit' ? 'toit' : 'pierre',
  cotes: 0,
  dessus: 'rien',
  dessous: 'rien',
  monte: 0,
  descend: 0,
  coins: 0,
  toits: 0,
  surLeVide: false,
  ...v,
});

/** Tous les voisinages des murs : chaque masque de côtés, chaque dessus et chaque dessous, sur le sol ou sur le vide. */
function murs(): Voisinage[] {
  const out: Voisinage[] = [];
  for (let cotes = 0; cotes < 16; cotes++)
    for (const dessus of AUTOUR) for (const dessous of AUTOUR) for (const surLeVide of [false, true]) out.push(vois({ classe: 'mur', cotes, dessus, dessous, surLeVide }));
  return out;
}

/** Des voisinages de toits : chaque masque de côtés, de montée, de descente et de coins (un à la fois), sous le ciel. */
function toits(): Voisinage[] {
  const out: Voisinage[] = [];
  for (let cotes = 0; cotes < 16; cotes++)
    for (let m = 0; m < 16; m++) {
      out.push(vois({ classe: 'toit', cotes, monte: m }));
      out.push(vois({ classe: 'toit', cotes, descend: m }));
      out.push(vois({ classe: 'toit', cotes, coins: m }));
    }
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
      const { piece } = pieceDe(vois({ classe: 'mur', cotes, dessus: 'mur', dessous: 'mur' }));
      expect(piece, `${cotes}`).toBe(`mur.${attendu[cotes]}.haut.mur`);
    }
  });

  it('la pièce tournée retrouve exactement les voisines : sa forme de référence, tournée, donne le masque', () => {
    for (const v of murs()) {
      const { piece, rotation } = pieceDe(v);
      const forme = piece.split('.')[1] as Forme;
      expect(tournerCotes(cotesDeReference(forme), rotation), `${piece} ${v.cotes}`).toBe(v.cotes);
    }
  });

  it('est invariante par rotation de 90° : même pièce, tournée d’un quart de tour de plus (à la symétrie près)', () => {
    for (const v of murs())
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
    const premiers = [...murs(), ...toits()].map(pieceDe);
    expect([...murs(), ...toits()].map(pieceDe)).toEqual(premiers);
    // Les formes de référence sont toutes différentes à rotation près, et couvrent les 16 masques.
    const vus = new Set<number>();
    for (const f of FORMES) for (let r = 0; r < 4; r++) vus.add(tournerCotes(f.cotes, r));
    expect(vus.size).toBe(16);
  });

  it('un mur sans rien au-dessus dans le plan porte un chaperon, jamais un toit ajouté ; sous un toit, une tête de toit', () => {
    const base = vois({ classe: 'mur', cotes: 0b0101, dessous: 'mur' });
    expect(pieceDe(base).piece).toBe('mur.droit.haut.chaperon');
    expect(pieceDe({ ...base, dessus: 'toit' }).piece).toBe('mur.droit.haut.toit');
    expect(pieceDe({ ...base, dessus: 'mur' }).piece).toBe('mur.droit.haut.mur');
    // Au pied : rien du plan dessous ; sur le vide (l'eau, le bord du quai) : des pilotis.
    expect(pieceDe({ ...base, dessous: 'rien' }).piece).toBe('mur.droit.pied.chaperon');
    expect(pieceDe({ ...base, dessous: 'rien', surLeVide: true }).piece).toBe('mur.droit.pilotis.chaperon');
    // Sur le vide ne compte qu'au pied.
    expect(pieceDe({ ...base, surLeVide: true }).piece).toBe('mur.droit.haut.chaperon');
  });
});

describe('Le choix d’un toit : le sens de la pente', () => {
  const penteDe = (v: Voisinage) => pieceDe(v).piece.split('.')[1] as Pente;

  it('« chaperon » est réservé aux murs : la tête d’un toit sous le ciel est « ciel » ; sous un bloc, le toit reste plat', () => {
    for (const v of toits()) expect(pieceDe(v).piece.endsWith('.ciel'), pieceDe(v).piece).toBe(true);
    expect(pieceDe(vois({ classe: 'toit', monte: 1, dessus: 'mur' })).piece).toBe('toit.plat.courant.mur');
    expect(pieceDe(vois({ classe: 'toit', monte: 1, dessus: 'toit' })).piece).toBe('toit.plat.courant.toit');
  });

  it('versant quand il monte d’un côté, arêtier vers un coin, faîte, croupe ou pointe quand il descend de deux, trois ou quatre côtés', () => {
    expect(penteDe(vois({ classe: 'toit', monte: 0b0010 }))).toBe('versant');
    // La montée l'emporte sur la descente : le bas d'un gradin, posé sur un autre.
    expect(penteDe(vois({ classe: 'toit', monte: 0b0010, descend: 0b1000 }))).toBe('versant');
    expect(penteDe(vois({ classe: 'toit', coins: 0b0100 }))).toBe('aretier');
    expect(penteDe(vois({ classe: 'toit', descend: 0b1010 }))).toBe('faite');
    expect(penteDe(vois({ classe: 'toit', descend: 0b0111 }))).toBe('croupe');
    expect(penteDe(vois({ classe: 'toit', descend: 0b1111 }))).toBe('pointe');
    // Rien de lisible : plat (le toit reste un bloc).
    for (const v of [{}, { monte: 0b0101 }, { monte: 0b0011 }, { descend: 0b0001 }, { descend: 0b0011 }, { coins: 0b0011 }])
      expect(penteDe(vois({ classe: 'toit', ...v })), JSON.stringify(v)).toBe('plat');
  });

  it('la rive : le bout d’une rangée, le long de la rangée (perpendiculaire à la pente)', () => {
    // Un versant qui monte vers +y file le long de x.
    expect(pieceDe(vois({ classe: 'toit', monte: 0b0010, cotes: 0b0101 })).piece).toBe('toit.versant.courant.ciel');
    expect(pieceDe(vois({ classe: 'toit', monte: 0b0010, cotes: 0b0001 })).piece).toBe('toit.versant.rive.ciel');
    // Une voisine dans le sens de la pente n'y change rien.
    expect(pieceDe(vois({ classe: 'toit', monte: 0b0010, cotes: 0b1111 })).piece).toBe('toit.versant.courant.ciel');
    // Un faîte qui descend vers ±y file le long de x.
    expect(pieceDe(vois({ classe: 'toit', descend: 0b1010, cotes: 0b0101 })).piece).toBe('toit.faite.courant.ciel');
    expect(pieceDe(vois({ classe: 'toit', descend: 0b1010, cotes: 0b0100 })).piece).toBe('toit.faite.rive.ciel');
  });

  it('est invariant par rotation : même pièce, tournée d’un quart de tour de plus ; la référence, tournée, retrouve le masque', () => {
    for (const v of toits()) {
      const a = pieceDe(v);
      const pente = a.piece.split('.')[1];
      const ref = PENTES.find((p) => p.pente === pente);
      // Le haut d'un versant (il ne monte pas : il descend d'un côté, sa voisine de même niveau est en face) se lit sur
      // la descente.
      const haut = pente === 'versant' && !v.monte;
      if (ref && !haut) expect(tournerCotes(ref.bits, a.rotation), a.piece).toBe(v[ref.masque]);
      if (haut) expect(tournerCotes(0b0100, a.rotation), a.piece).toBe(v.descend);
      for (let r = 1; r < 4; r++) {
        const b = pieceDe(tournerVoisinage(v, r));
        expect(b.piece).toBe(a.piece);
        if (ref) expect(tournerCotes(ref.bits, b.rotation)).toBe(tournerCotes(ref.bits, a.rotation + r));
      }
    }
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

  it('dit de quel côté le toit monte, descend, vers quel coin, et les toits à côté d’un mur (le pignon)', () => {
    const t = cube(5, 5, 5, 'toit');
    const plan = [t, cube(5, 6, 6, 'toit', { ghost: true }), cube(4, 5, 4, 'toit'), cube(6, 6, 6, 'toit'), cube(5, 4, 5, 'pierre')];
    const v = voisinageDe(t, indexDuPlan(plan))!;
    expect(v.monte).toBe(0b0010);
    expect(v.descend).toBe(0b0100);
    expect(v.coins).toBe(0b0001);
    expect(v.toits).toBe(0);
    const pignon = voisinageDe(cube(5, 4, 5, 'pierre'), indexDuPlan(plan))!;
    expect(pignon.toits).toBe(0b0010);
    expect(pignon.cotes).toBe(0);
  });

  it('une fenêtre (une lanterne prise dans un mur) fait mur ; une lanterne sur un mur ou dans une cour, non', () => {
    const plan = [cube(0, 0, 1), cube(1, 0, 1, 'lanterne'), cube(2, 0, 1), cube(1, 0, 0), cube(1, 0, 2, 'lanterne'), cube(5, 5, 0, 'lanterne')];
    const index = indexDuPlan(plan);
    expect(index.get('1,0,1')).toBe('mur');
    expect(index.has('1,0,2')).toBe(false);
    expect(index.has('5,5,0')).toBe(false);
    expect(voisinageDe(cube(0, 0, 1), index)!.cotes).toBe(0b0001);
  });

  it('sur le vide : seulement au pied, et seulement si la fonction le dit', () => {
    const c = cube(0, 0, 1);
    expect(voisinageDe(c, indexDuPlan([c]))!.surLeVide).toBe(false);
    expect(voisinageDe(c, indexDuPlan([c]), { surLeVide: () => true })!.surLeVide).toBe(true);
    expect(voisinageDe(c, indexDuPlan([c, cube(0, 0, 0)]), { surLeVide: () => true })!.surLeVide).toBe(false);
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
    expect(v).toEqual(vois({ classe: 'mur', dessous: 'mur' }));
    expect(voisinageDe(cube(0, 0, 0, 'lanterne'), indexDuPlan([]))).toBeNull();
  });

  it('les côtés ne comptent que la même classe : un toit à côté d’un mur n’allonge pas le mur', () => {
    const m = cube(0, 0, 3);
    const v = voisinageDe(m, indexDuPlan([m, cube(1, 0, 3, 'toit'), cube(-1, 0, 3, 'tuile'), cube(0, 1, 3, 'planches')]))!;
    expect(v.cotes).toBe(0b0010);
  });
});
