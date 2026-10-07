import { BIOMES } from "../biomes";
import { archipelagoOfIsland, landCells, mapOf } from "./map";
import { islandCenter, whaleSpots } from "./terrain";
import {
  PASS_DURATION,
  PASS_LENGTH,
  passPhase,
  passingWhale,
  routeIsClear,
  whalePassRoute,
} from "./whalePass";

// Chaque île de chaque archipel (51 îles depuis SC-3), sous la seconde depuis que `whaleSpots` ne parcourt plus toutes
// les cases de terre pour chaque clairière (terrain/sea.ts) : le délai par défaut suffit.
it("chaque île avec la mer a un passage de baleine sur l’eau libre, au large de cette île, jamais sur la terre", () => {
  for (const b of BIOMES) {
    const a = archipelagoOfIsland(b.id);
    for (const narrow of [false, true]) {
      const route = whalePassRoute(b.id, [], { x: 0.67, y: -0.73 }, narrow);
      if (a === "3e") {
        // Les Îles du Ciel n'ont pas de mer : pas de passage.
        expect(route, b.id).toBeNull();
        continue;
      }
      expect(route, b.id).not.toBeNull();
      const r = route!;
      expect(
        Math.hypot(r.to.x - r.from.x, r.to.y - r.from.y),
      ).toBeGreaterThanOrEqual(9.99);
      expect(
        Math.hypot(r.to.x - r.from.x, r.to.y - r.from.y),
      ).toBeLessThanOrEqual(PASS_LENGTH + 0.01);
      expect(routeIsClear(a, [], r, 2), b.id).toBe(true);
      // Au large de cette île : près d'elle (les îles du bord ont la mer devant elles, celles du milieu un bras de mer).
      const mid = { x: (r.from.x + r.to.x) / 2, y: (r.from.y + r.to.y) / 2 };
      const c = islandCenter(b.id);
      expect(Math.hypot(mid.x - c.x, mid.y - c.y), b.id).toBeLessThanOrEqual(
        45,
      );
      // Aucune case de terre à moins de deux cases du trajet (vérification indépendante).
      const land = mapOf(a).flatMap((d) => landCells(d));
      for (let k = 0; k <= 28; k++) {
        const p = {
          x: r.from.x + ((r.to.x - r.from.x) * k) / 28,
          y: r.from.y + ((r.to.y - r.from.y) * k) / 28,
        };
        const near = land.find(
          (c) => Math.hypot(c.x + 0.5 - p.x, c.y + 0.5 - p.y) <= 2,
        );
        expect(near, b.id).toBeUndefined();
      }
      // Une des baleines de l'archipel fait le passage.
      expect(passingWhale(whaleSpots(a, []), r)).toBeGreaterThanOrEqual(0);
    }
  }
});

it("le passage se voit depuis la caméra : derrière l’île, en haut de l’écran", () => {
  const south = whalePassRoute("maths-6e-calculation", [])!;
  // Caméra au sud : la baleine passe derrière l'île (au nord), en haut de l'écran, loin des panneaux, en travers ;
  // sur le côté, pas derrière le nom de l'île, en s'éloignant de l'axe de vue.
  const c = islandCenter("maths-6e-calculation");
  const mid = {
    x: (south.from.x + south.to.x) / 2,
    y: (south.from.y + south.to.y) / 2,
  };
  expect(mid.y).toBeGreaterThan(c.y);
  expect(south.from.y).toBeCloseTo(south.to.y);
  expect(Math.abs(mid.x - c.x)).toBeGreaterThanOrEqual(7);
  expect(Math.abs(south.to.x - c.x)).toBeGreaterThan(
    Math.abs(south.from.x - c.x),
  );
  // Vue étroite (téléphone) : plus loin derrière, au-dessus du nom de l'île.
  const narrow = whalePassRoute("maths-6e-calculation", [], { x: 0, y: -1 }, true)!;
  const nmid = {
    x: (narrow.from.x + narrow.to.x) / 2,
    y: (narrow.from.y + narrow.to.y) / 2,
  };
  // Au moins aussi loin derrière : selon la carte, l'eau libre derrière l'île peut manquer pour aller plus loin.
  expect(nmid.y).toBeGreaterThanOrEqual(mid.y);
  const north = whalePassRoute("maths-6e-calculation", [], { x: 0, y: 1 });
  const midY = (r: typeof south) => (r.from.y + r.to.y) / 2;
  if (north) expect(midY(north)).toBeLessThan(midY(south));
});

it("le déroulé : plonger, refaire surface, souffler une seule fois, replonger, revenir", () => {
  expect(PASS_DURATION).toBeGreaterThanOrEqual(6);
  expect(PASS_DURATION).toBeLessThanOrEqual(10);
  expect(passPhase(0.1).phase).toBe("sink");
  expect(passPhase(PASS_DURATION + 0.1).phase).toBe("done");
  let spouts = 0;
  let wasSpouting = false;
  let surfaced = false;
  for (let s = 0; s < PASS_DURATION; s += 0.02) {
    const p = passPhase(s);
    const spouting = p.phase === "swim" && p.spout > 0;
    if (spouting && !wasSpouting) spouts++;
    wasSpouting = spouting;
    if (p.phase === "swim" && p.depth < 0.01) surfaced = true;
    // Au souffle, elle est en surface.
    if (spouting) expect(p.phase === "swim" && p.depth).toBeLessThan(0.05);
  }
  expect(spouts).toBe(1);
  expect(surfaced).toBe(true);
  const end = passPhase(PASS_DURATION - 0.001);
  expect(end.phase === "rise" && end.sink).toBeLessThan(0.01);
});
