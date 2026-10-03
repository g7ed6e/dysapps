// La flèche de la Carte posée sur un ouvrage (GD-7) : le milieu de sa liaison, qui ne désigne que lui.
import { BRIDGES } from './archipelago';
import { archipelagoOfIsland } from './archipels';
import { grilleDe } from './grille';
import { estUnOuvrage, milieuDeLaLiaison } from './view';

it('le milieu d’une liaison : sa case du milieu (celle du radeau d’un bac), rien sans case', () => {
  const c = (x: number) => ({ x, y: 0, z: 0 });
  expect(milieuDeLaLiaison([])).toBeNull();
  expect(milieuDeLaLiaison([c(0)])).toEqual(c(0));
  expect(milieuDeLaLiaison([c(0), c(1), c(2)])).toEqual(c(1));
  // Un nombre pair de cases : celle d'avant le milieu, où `bridge` (terrain.ts) pose la planche de plus du radeau.
  expect(milieuDeLaLiaison([c(0), c(1), c(2), c(3)])).toEqual(c(1));
});

it('une flèche d’ouvrage se reconnaît, une île ou une case non', () => {
  expect(estUnOuvrage({ ouvrage: 'a-b' })).toBe(true);
  expect(estUnOuvrage('french-6e-phonology')).toBe(false);
  expect(estUnOuvrage({ x: 1, y: 2, z: 3 })).toBe(false);
  expect(estUnOuvrage(null)).toBe(false);
});

it('le milieu de chaque ouvrage n’est sur aucun autre : la flèche désigne un seul ouvrage parmi ceux d’une île', () => {
  for (const def of BRIDGES) {
    const g = grilleDe(archipelagoOfIsland(def.from));
    const milieu = milieuDeLaLiaison(g.liaison(def.id));
    expect(milieu, def.id).not.toBeNull();
    for (const autre of BRIDGES) {
      if (autre === def || archipelagoOfIsland(autre.from) !== archipelagoOfIsland(def.from)) continue;
      const sur = g.liaison(autre.id).some((c) => Math.abs(c.x - milieu!.x) <= 1 && Math.abs(c.y - milieu!.y) <= 1);
      expect(sur, `${def.id} sur ${autre.id}`).toBe(false);
    }
  }
});
