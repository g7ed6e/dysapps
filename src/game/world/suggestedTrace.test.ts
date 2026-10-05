// Le tracé renforcé de l'ouvrage désigné sur la Carte (GD-7) : des tirets de bout en bout, la rive d'arrivée comprise.
import { casesDesTirets, formeDuTrace, TIRET_SUGGERE } from './suggestedTrace';
import { ARCHIPELAGOS, BRIDGES, archipelagoOf } from './archipelago';
import { dispositionEnGrille } from './grid';

const c = (x: number) => ({ x, y: 0, z: 2 });

it('deux cases sur trois, et toujours la dernière (la rive d’arrivée)', () => {
  expect(casesDesTirets([0, 1, 2, 3, 4, 5].map(c)).map((p) => p.x)).toEqual([0, 1, 3, 4, 5]);
  expect(casesDesTirets([0, 1, 2].map(c)).map((p) => p.x)).toEqual([0, 1, 2]);
  expect(casesDesTirets([])).toEqual([]);
});

it('un tiret plus épais qu’une case, au cœur plus foncé que les fantômes, posé au-dessus du tablier, en 12 triangles', () => {
  expect(TIRET_SUGGERE.lisere.large).toBeGreaterThan(1);
  // Le cœur, foncé ; les fantômes sont bleu clair (three/meshes.ts, 0xa8d8ff) : la forme et la valeur les distinguent.
  const lum = (hex: string) => [1, 3, 5].reduce((s, i) => s + parseInt(hex.slice(i, i + 2), 16), 0) / 3;
  expect(lum(TIRET_SUGGERE.coeur.couleur)).toBeLessThan(lum('#a8d8ff') / 2);
  const f = formeDuTrace([c(0), c(1)]);
  // Deux tirets : un liseré (son dessus, deux triangles) et un cœur sans dessous (cinq faces, dix triangles) chacun.
  expect(f.triangles).toBe(2 * (2 + 10));
  expect(f.parties.length).toBe(f.positions.length / 3);
  const hauteurs = Array.from(f.positions).filter((_, i) => i % 3 === 1);
  expect(Math.min(...hauteurs)).toBeGreaterThan(2 + 1);
  // Le cœur dépasse du liseré : il se voit par-dessus.
  expect(TIRET_SUGGERE.coeur.haut).toBeGreaterThan(TIRET_SUGGERE.lisere.haut);
});

it('le plus long tracé de tous les archipels tient dans 780 triangles (un appel de dessin, « Dans la scène »)', () => {
  // Le compte du rendu : 12 triangles par case dessinée ; le long bac de la Plaine à la Carrière (96 cases) est le pire.
  let pire = 0;
  for (const a of ARCHIPELAGOS) {
    const d = dispositionEnGrille(a.classe);
    for (const b of BRIDGES.filter((o) => archipelagoOf(o.from).classe === a.classe)) pire = Math.max(pire, formeDuTrace(d.liaison(b.id)).triangles);
  }
  expect(pire).toBeGreaterThan(0);
  expect(pire).toBeLessThanOrEqual(780);
});
