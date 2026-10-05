// La flèche de la Carte posée sur un ouvrage (GD-7) : sur sa liaison, côté île de départ, qui ne désigne que lui.
// Sur une région toute reliée (GD-9 : une liaison ne se dessine que posée).
import { ARCHIPELAGO_IDS } from './archipelagos';
import { linkWholeRegion, VOYAGES } from './archipelago';
import { placedLinksOf } from './linkGeometry';
import { archipelagoOfIsland } from './archipelagos';
import { dispositionEnGrille } from './grid';
import { isLand, mapOf } from './map';
import { casesDeLOuvrage, placesDeLaFleche, premierCoude } from './terrain';
import { estUnOuvrage } from './view';

/** Les liaisons posées de chaque région, une région toute reliée (GD-9). */
const LIENS = ARCHIPELAGO_IDS.reduce<string[]>((l, a) => linkWholeRegion(a, l), VOYAGES.map((v) => v.id));
const POSEES = ARCHIPELAGO_IDS.flatMap((a) => placedLinksOf(a, LIENS));

it('la place de la flèche : la première case d’eau, puis trois cases vers l’arrivée', () => {
  const c = (x: number, troncon = 0) => ({ x, y: 0, z: 0, troncon });
  const pas = () => false;
  expect(placesDeLaFleche([], pas)).toEqual([]);
  // Une longue liaison droite : de la case 3 jusqu'au milieu (la case 9 sur 20), où elle peut glisser.
  const longue = Array.from({ length: 20 }, (_, i) => c(i));
  expect(placesDeLaFleche(longue, pas).map((p) => p.x)).toEqual([3, 4, 5, 6, 7, 8, 9]);
  // La terre au départ (une case encore sur la rive) : la première case d'eau compte, pas la première case du tracé.
  expect(placesDeLaFleche(longue, (x) => x < 2)[0].x).toBe(5);
  // Une liaison courte : jamais au-delà du milieu.
  expect(placesDeLaFleche([c(0), c(1), c(2), c(3), c(4)], pas).map((p) => p.x)).toEqual([2]);
  expect(placesDeLaFleche([c(0), c(1)], pas).map((p) => p.x)).toEqual([0]);
  // Un contour : jamais au-delà du premier coude (le premier tronçon finit en 1).
  const contour = [c(0), c(1), c(2, 1), c(3, 1), c(4, 1), c(5, 1), c(6, 1), c(7, 1), c(8, 1), c(9, 1)];
  expect(placesDeLaFleche(contour, pas).map((p) => p.x)).toEqual([1]);
  // Un pas de côté d'une case entre deux tronçons de même sens n'est pas un coude (un pont presque droit).
  const decale = [c(0), c(1), c(2), { x: 2, y: 1, z: 0, troncon: 1 }, ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((x) => ({ x, y: 1, z: 0, troncon: 2 }))];
  expect(placesDeLaFleche(decale, pas).map((p) => p.x)).toEqual([2, 3, 4, 5]);
  // Un pas de côté suivi d'un retour en arrière, ou d'un autre sens, est un coude.
  const retour = [c(0), c(1), c(2), { x: 2, y: 1, z: 0, troncon: 1 }, ...[1, 0, -1, -2, -3, -4].map((x) => ({ x, y: 1, z: 0, troncon: 2 }))];
  expect(placesDeLaFleche(retour, pas).map((p) => p.x)).toEqual([2]);
  // Jamais une case de terre : un îlot sur le tracé est sauté.
  expect(placesDeLaFleche(longue, (x) => x === 3 || x === 4).map((p) => p.x)).toEqual([5, 6, 7, 8, 9]);
  // Sans eau du tout (un sentier sur l'isthme) : les cases du tracé comptent toutes.
  expect(placesDeLaFleche([c(0), c(1), c(2), c(3), c(4), c(5), c(6), c(7)], () => true).map((p) => p.x)).toEqual([3]);
});

it('une flèche d’ouvrage se reconnaît, une île ou une case non', () => {
  expect(estUnOuvrage({ ouvrage: 'a-b' })).toBe(true);
  expect(estUnOuvrage('french-6e-phonology')).toBe(false);
  expect(estUnOuvrage({ x: 1, y: 2, z: 3 })).toBe(false);
  expect(estUnOuvrage(null)).toBe(false);
});

describe('la flèche de chaque liaison posée, depuis chacun de ses deux lieux', () => {
  for (const def of POSEES) {
    const a = archipelagoOfIsland(def.from);
    for (const depuis of [def.from, def.to]) {
      it(`${def.id} depuis ${depuis}`, () => {
        const g = dispositionEnGrille(a, LIENS);
        const places = g.placesDeLaFleche(def.id, depuis);
        expect(places.length).toBeGreaterThan(0);
        const chemin = casesDeLOuvrage(def, LIENS);
        const sens = depuis === def.to ? [...chemin].reverse() : chemin;
        const indice = (p: { x: number; y: number }) => sens.findIndex((c) => c.x === p.x && c.y === p.y);
        const eau = sens.some((c) => !mapOf(a).some((d) => isLand(d, c.x, c.y)));
        const milieu = Math.floor((sens.length - 1) / 2);
        for (const p of places) {
          const i = indice(p);
          // Sur la liaison, sur son premier tronçon depuis l'île de départ, jamais au-delà du milieu.
          expect(i).toBeGreaterThanOrEqual(0);
          expect(i).toBeLessThanOrEqual(premierCoude(sens));
          if (sens.findIndex((c) => !mapOf(a).some((d) => isLand(d, c.x, c.y))) <= milieu) expect(i).toBeLessThanOrEqual(milieu);
          // Jamais sur une case de terre (sauf un tracé tout en terre : un sentier).
          if (eau) expect(mapOf(a).some((d) => isLand(d, p.x, p.y))).toBe(false);
        }
        // Les places se suivent vers l'arrivée.
        expect(places.map(indice)).toEqual([...places.map(indice)].sort((x, y) => x - y));
      });
    }
  }
});

it('la flèche d’un ouvrage n’est sur aucun autre : elle désigne un seul ouvrage parmi ceux d’une île', () => {
  for (const def of POSEES) {
    const g = dispositionEnGrille(archipelagoOfIsland(def.from), LIENS);
    for (const depuis of [def.from, def.to])
      for (const p of g.placesDeLaFleche(def.id, depuis))
        for (const autre of POSEES) {
          if (autre === def || archipelagoOfIsland(autre.from) !== archipelagoOfIsland(def.from)) continue;
          const sur = g.liaison(autre.id).some((c) => Math.abs(c.x - p.x) <= 1 && Math.abs(c.y - p.y) <= 1);
          expect(sur, `${def.id} depuis ${depuis} sur ${autre.id}`).toBe(false);
        }
  }
});
