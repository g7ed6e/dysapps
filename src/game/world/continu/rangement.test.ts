// Le geste « ranger » (GD-20, point 8, lot L4) : l'état pur d'une manche, sans vue.
import { EMPTY_RANGEMENT, binOf, cancel, complete, drop, lastIn, rangementResults, reset, sortSlots, take } from './rangement';

describe('Ranger : toucher l’objet, puis le panier', () => {
  it('prendre, ranger, reprendre, reposer : rien ne se perd', () => {
    let s = take(EMPTY_RANGEMENT, 'a');
    expect(s).toEqual({ held: 'a', placed: {} });
    // Toucher un panier range l'objet tenu.
    s = drop(s, 'pluriel');
    expect(s).toEqual({ held: null, placed: { a: 'pluriel' } });
    // Sans objet tenu, toucher un panier ne fait rien.
    expect(drop(s, 'singulier')).toBe(s);
    // Un objet rangé se reprend : il sort de son panier, puis se range ailleurs.
    s = take(s, 'a');
    expect(s).toEqual({ held: 'a', placed: {} });
    s = drop(s, 'singulier');
    expect(binOf(s, 'a')).toBe('singulier');
    // Prendre un autre objet, puis le toucher de nouveau : il est reposé ; Échap fait de même.
    s = take(s, 'b');
    expect(take(s, 'b')).toEqual({ held: null, placed: { a: 'singulier' } });
    expect(cancel(s)).toEqual({ held: null, placed: { a: 'singulier' } });
    expect(cancel(EMPTY_RANGEMENT)).toBe(EMPTY_RANGEMENT);
    // Prendre un objet pendant qu'on en tient un autre : le premier reste où il était, le second est tenu.
    expect(take(take(EMPTY_RANGEMENT, 'b'), 'c')).toEqual({ held: 'c', placed: {} });
    expect(reset()).toEqual(EMPTY_RANGEMENT);
  });

  it('« Valider » attend que tout soit rangé ; la correction compare le panier à la réponse, objet par objet', () => {
    const items = [
      { key: 'le-chien', answer: 'singulier' },
      { key: 'les-chiens', answer: 'pluriel' },
    ];
    let s = drop(take(EMPTY_RANGEMENT, 'le-chien'), 'singulier');
    expect(complete(s, items.map((it) => it.key))).toBe(false);
    s = drop(take(s, 'les-chiens'), 'singulier');
    expect(complete(s, items.map((it) => it.key))).toBe(true);
    expect(rangementResults(s, items)).toEqual([
      { key: 'le-chien', correct: true },
      { key: 'les-chiens', correct: false },
    ]);
    // Une clé héritée (`constructor`) n'est jamais un objet rangé.
    expect(binOf(EMPTY_RANGEMENT, 'constructor')).toBeNull();
  });

  it('la rangée : un panier à chaque bout, les objets entre eux', () => {
    expect(sortSlots(4, 2)).toEqual({ objects: [1, 2, 3, 4], bins: [0, 5], count: 6 });
    expect(sortSlots(3, 2)).toEqual({ objects: [1, 2, 3], bins: [0, 4], count: 5 });
    expect(sortSlots(4, 3)).toEqual({ objects: [2, 3, 4, 5], bins: [0, 1, 6], count: 7 });
  });
});

describe('Le dernier objet rangé dans un panier (GD-26)', () => {
  it('suit l’ordre des dépôts, pas celui des objets', () => {
    let s = drop(take(EMPTY_RANGEMENT, 'b'), 'caisse');
    s = drop(take(s, 'a'), 'caisse');
    expect(lastIn(s, 'caisse')).toBe('a');
    s = drop(take(s, 'b'), 'caisse');
    expect(lastIn(s, 'caisse')).toBe('b');
    expect(lastIn(s, 'autre')).toBeNull();
  });
});
