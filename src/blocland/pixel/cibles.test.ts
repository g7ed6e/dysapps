import { agrandirCible, cibleAu } from "./cibles";

it("une cible plus petite que le doigt s’agrandit autour de son milieu, une grande garde sa taille", () => {
  expect(agrandirCible({ x: 100, y: 200, w: 36, h: 44 }, 48)).toEqual({
    x: 94,
    y: 198,
    w: 48,
    h: 48,
  });
  expect(agrandirCible({ x: 0, y: 0, w: 160, h: 350 }, 48)).toEqual({
    x: 0,
    y: 0,
    w: 160,
    h: 350,
  });
});

it("un toucher dans la marge prend la cible ; loin de toute cible, rien", () => {
  const panneau = { x: 100, y: 100, w: 36, h: 44, agrandir: true };
  expect(cibleAu([panneau], 96, 120, 48)).toBe(panneau);
  expect(cibleAu([panneau], 90, 120, 48)).toBeNull();
});

it("une cible non marquée (le navire) ne se touche que sur son dessin", () => {
  const navire = { x: 100, y: 100, w: 36, h: 44 };
  expect(cibleAu([navire], 96, 120, 48)).toBeNull();
  expect(cibleAu([navire], 101, 120, 48)).toBe(navire);
});

it("le dessin même d’une cible passe avant la marge d’une voisine plus proche", () => {
  const loin = { x: 100, y: 100, w: 30, h: 30, agrandir: true };
  const proche = { x: 132, y: 100, w: 30, h: 30, agrandir: true };
  // Le point est sur le dessin de « loin » et dans la marge de « proche » (rangée après, donc plus proche).
  expect(cibleAu([loin, proche], 129, 115, 48)).toBe(loin);
});

it("dans deux marges à la fois, la cible dont le milieu est le plus près du doigt, la plus proche à égalité", () => {
  const a = { x: 100, y: 100, w: 30, h: 30, agrandir: true };
  const b = { x: 136, y: 100, w: 30, h: 30, agrandir: true };
  expect(cibleAu([a, b], 132, 115, 48)).toBe(a);
  expect(cibleAu([a, b], 134, 115, 48)).toBe(b);
  expect(cibleAu([a, b], 133, 115, 48)).toBe(b);
});
