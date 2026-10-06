// Le traceur des liaisons (GD-9, L2) : droites ou en L à un seul coude sur l'eau, jamais en biais, d'une arrivée sur la
// côte à une autre, au large des autres lieux, sans en croiser une autre, posées dans l'ordre où l'élève les a posées.
// Sur des dispositions faites pour le test ; la carte de départ, calée sur le pas, a les siens (linkGeometry.test.ts).
import { describe, expect, it } from 'vitest';
import { isLand, isLandInWorld, startingIsland, type IslandDef } from './map';
import { footprintOf } from './footprint';
import type { Rectangle } from './placement';

/** La distance (en cases, à la façon d'un roi aux échecs) d'une case à un rectangle : 0 dedans, 1 contre lui. */
function distanceAuRectangle(x: number, y: number, r: Rectangle): number {
  return Math.max(r.x0 - x, x - (r.x1 - 1), r.y0 - y, y - (r.y1 - 1), 0);
}
import { type Anchor, anchorInWorld, possibleLandings, spotPossible, pathBetween, LONG_LENGTH, MAX_ISLANDS_PER_REGION, routeRegion, RegionRouter } from './routing';
import { type BridgeDef, getBridge } from './archipelago';
import { bornesDuCoeur } from './map';
import { STEP, TOWARDS_SEA } from './placement';

/** Les liaisons posées, dans l'ordre, toutes jusqu'à 96 cases. */
const liaisons = (...ids: string[]): BridgeDef[] => ids.map((id) => getBridge(id)!);
const AU_PLUS_LONG = () => LONG_LENGTH;
const VERS_LE_GALET = 'maths-6e-calculation-maths-6e-fractions';
const VERS_LE_VOLCAN = 'maths-6e-calculation-maths-6e-decimals';
const tracer = (lieux: IslandDef[], ...ids: string[]) => routeRegion('6e', { lieux }, liaisons(...ids), AU_PLUS_LONG);

const accroche = (x: number, y: number, dx: number, dy: number): Anchor => ({ lieu: 'maths-6e-calculation', cote: 'droite', pas: 0, x, y, dx, dy });

/** Un lieu posé ailleurs (sans passer par la disposition du moment). */
const pose = (d: IslandDef, dx: number, dy: number, quarts: 0 | 1 | 2 | 3 = 0): IslandDef => ({ ...d, core: { x: d.core.x + dx, y: d.core.y + dy }, quarts });

describe('un chemin entre deux arrivées', () => {
  it('droit quand elles se font face sur une même ligne, en L quand leurs directions se croisent', () => {
    const droit = pathBetween(accroche(0, 0, 1, 0), accroche(10, 0, -1, 0))!;
    expect(droit.coude).toBe(-1);
    expect(droit.cases).toEqual(Array.from({ length: 9 }, (_, i) => ({ x: i + 1, y: 0 })));
    const l = pathBetween(accroche(0, 0, 1, 0), accroche(8, 6, 0, -1))!;
    expect(l.cases[l.coude]).toEqual({ x: 8, y: 0 });
    expect(l.cases.length).toBe(8 + 5);
    // Chaque pas va d'une case à sa voisine, jamais en biais.
    for (const ch of [droit, l]) {
      const pts = [{ x: 0, y: 0 }, ...ch.cases];
      for (let i = 1; i < pts.length; i++) expect(Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y)).toBe(1);
    }
  });

  it('jamais en biais, en Z, à reculons, ni avec un coude collé à la côte', () => {
    expect(pathBetween(accroche(0, 0, 1, 0), accroche(10, 3, -1, 0))).toBeNull(); // face à face décalées : un Z
    expect(pathBetween(accroche(0, 0, 1, 0), accroche(10, 0, 1, 0))).toBeNull(); // dans le même sens
    expect(pathBetween(accroche(0, 0, 1, 0), accroche(-8, 6, 0, -1))).toBeNull(); // le coude derrière le départ
    expect(pathBetween(accroche(0, 0, 1, 0), accroche(2, 6, 0, -1))).toBeNull(); // coude à deux cases de la côte
  });
});

describe('les arrivées d’un lieu', () => {
  for (const id of ['maths-6e-calculation', 'french-6e-phonology', 'french-4e-agreement'] as const)
    it(`${id} : sur sa côte, au pas, jamais devant les bornes`, () => {
      const def = startingIsland(id);
      const coeur = bornesDuCoeur(def);
      const arrivees = possibleLandings(def);
      expect(arrivees.length).toBeGreaterThan(4);
      for (const a of arrivees) {
        const { dx, dy } = TOWARDS_SEA[a.cote];
        expect(isLand(def, def.core.x + a.x, def.core.y + a.y), `${a.cote}${a.pas}`).toBe(true);
        expect(isLand(def, def.core.x + a.x + dx, def.core.y + a.y + dy), `${a.cote}${a.pas}`).toBe(false);
        expect(Math.abs((dy !== 0 ? a.x : a.y) % STEP)).toBe(0);
        if (a.cote === 'devant') expect(a.x < coeur.x0 || a.x >= coeur.x1).toBe(true);
      }
    });
});

it('tourné, un lieu garde ses arrivées sur les lignes de la grille du monde', () => {
  const def = startingIsland('maths-6e-fractions');
  for (const q of [1, 2, 3] as const) {
    const d = pose(def, 0, 0, q);
    for (const a of possibleLandings(d)) {
      const m = anchorInWorld(d, a);
      const surLaLigne = m.dy !== 0 ? m.x - d.core.x : m.y - d.core.y;
      expect(((surLaLigne % STEP) + STEP) % STEP, `${q} ${a.cote}${a.pas}`).toBe(0);
      // Sur la côte du lieu tourné, le large devant elle.
      expect(isLandInWorld(d, m.x, m.y), `${q} ${a.cote}${a.pas}`).toBe(true);
      expect(isLandInWorld(d, m.x + m.dx, m.y + m.dy), `${q} ${a.cote}${a.pas}`).toBe(false);
    }
  }
});

describe('le traceur d’une région', () => {
  const plaine = startingIsland('maths-6e-calculation');
  const galet = startingIsland('maths-6e-fractions');

  it('trace une liaison droite entre deux lieux face à face, en L sinon, au plus long', () => {
    const droit = tracer([plaine, pose(galet, 60 - (galet.core.x - plaine.core.x), 0)], VERS_LE_GALET).get(VERS_LE_GALET)!;
    expect(droit.coude).toBe(-1);
    const l = tracer([plaine, pose(galet, 60 - (galet.core.x - plaine.core.x), 40)], VERS_LE_GALET).get(VERS_LE_GALET)!;
    expect(l.coude).toBeGreaterThan(0);
    for (const t of [droit, l]) expect(t.cases.length).toBeLessThanOrEqual(LONG_LENGTH);
  });

  it('suit la rotation du lieu : une arrivée garde son côté dans le repère du lieu', () => {
    const g = pose(galet, 60 - (galet.core.x - plaine.core.x), 0, 2);
    const t = tracer([plaine, g], VERS_LE_GALET).get(VERS_LE_GALET)!;
    expect(t).not.toBeNull();
    // Tourné d'un demi-tour, c'est sa droite qui regarde la Plaine.
    expect(t.vers.cote).toBe('droite');
    expect(isLandInWorld(g, t.vers.x, t.vers.y)).toBe(true);
  });

  it('ne coupe jamais un autre lieu : un lieu posé sur le chemin droit le fait passer au large, à deux cases au moins', () => {
    const g = pose(galet, 90 - (galet.core.x - plaine.core.x), 0);
    const obstacle = pose(startingIsland('english-6e-grammar'), 0, 0);
    const milieu = { ...obstacle, core: { x: plaine.core.x + 45, y: plaine.core.y + 4 } };
    const t = tracer([plaine, g, milieu], VERS_LE_GALET).get(VERS_LE_GALET);
    expect(t).not.toBeUndefined();
    if (t) {
      expect(t.coude).toBeGreaterThan(0);
      for (const c of t.cases) for (const p of footprintOf(milieu.id, milieu)) expect(distanceAuRectangle(c.x, c.y, p)).toBeGreaterThanOrEqual(2);
    }
  });

  it('une liaison qui ne tient pas reste à reposer (null), sans tracé', () => {
    // Le Galet posé trop loin : plus de 96 cases d'eau.
    const t = tracer([plaine, pose(galet, 150 - (galet.core.x - plaine.core.x), 0)], VERS_LE_GALET).get(VERS_LE_GALET);
    expect(t).toBeNull();
  });

  it('deux liaisons ne se croisent jamais, ni ne se frôlent', () => {
    const g = pose(galet, 60 - (galet.core.x - plaine.core.x), 40);
    const volcan = startingIsland('maths-6e-decimals');
    const v = { ...volcan, core: { x: plaine.core.x + 4, y: plaine.core.y + 64 } };
    const traces = [...tracer([plaine, g, v], VERS_LE_GALET, VERS_LE_VOLCAN, 'maths-6e-fractions-maths-6e-decimals').values()].filter((t) => t !== null);
    expect(traces.length).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < traces.length; i++)
      for (let j = i + 1; j < traces.length; j++)
        for (const a of traces[i]!.cases) for (const b of traces[j]!.cases) expect(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))).toBeGreaterThanOrEqual(2);
  });
});

describe('une place possible (le geste « Aménager » le lira)', () => {
  const plaine = startingIsland('maths-6e-calculation');
  const galet = startingIsland('maths-6e-fractions');
  const dx = (x: number) => x - (galet.core.x - plaine.core.x);

  it('possible au large, ses liaisons posées toujours tracées', () => {
    expect(spotPossible('6e', [plaine, pose(galet, dx(60), 0)], galet.id, liaisons(VERS_LE_GALET))).toBe(true);
  });

  it('impossible trop près d’un autre lieu, hors du cadre, ou trop loin pour sa liaison posée', () => {
    expect(spotPossible('6e', [plaine, pose(galet, dx(24), 0)], galet.id)).toBe(false);
    expect(spotPossible('6e', [plaine, pose(galet, dx(-120), 0)], galet.id)).toBe(false);
    expect(spotPossible('6e', [plaine, pose(galet, dx(150), 0)], galet.id, liaisons(VERS_LE_GALET))).toBe(false);
  });

  it('impossible s’il coupe une liaison posée ; une liaison seulement proposée ne compte pas', () => {
    const volcan = startingIsland('maths-6e-decimals');
    const v = { ...volcan, core: { x: plaine.core.x, y: plaine.core.y + 100 } };
    const g = { ...galet, core: { x: plaine.core.x + 60, y: plaine.core.y + 50 } };
    expect(tracer([plaine, g, v], VERS_LE_VOLCAN).get(VERS_LE_VOLCAN)).not.toBeNull();
    // Le Galet posé entre la Plaine et le Volcan : sa propre liaison se trace, mais plus celle du Volcan.
    const entre = { ...galet, core: { x: plaine.core.x, y: plaine.core.y + 50 } };
    expect(tracer([plaine, entre, v], VERS_LE_GALET).get(VERS_LE_GALET)).not.toBeNull();
    expect(spotPossible('6e', [plaine, entre, v], galet.id, liaisons(VERS_LE_VOLCAN))).toBe(false);
    expect(spotPossible('6e', [plaine, entre, v], galet.id, [])).toBe(true);
  });
});

describe('les liaisons posées l’une après l’autre', () => {
  const plaine = startingIsland('maths-6e-calculation');
  const galet = startingIsland('maths-6e-fractions');

  it('essayer ne pose rien ; poser prend l’arrivée et le côté, et la suivante passe ailleurs', () => {
    const g = pose(galet, 60 - (galet.core.x - plaine.core.x), 0);
    const t = new RegionRouter('6e', { lieux: [plaine, g] });
    const essai = t.essayer(getBridge(VERS_LE_GALET)!, LONG_LENGTH);
    expect(essai).not.toBeNull();
    expect(t.essayer(getBridge(VERS_LE_GALET)!, LONG_LENGTH)).toEqual(essai);
    expect(t.poser(getBridge(VERS_LE_GALET)!, LONG_LENGTH)).toEqual(essai);
  });

  it('une liaison posée qui ne tient plus est rendue nulle, les autres restent tracées dans leur ordre', () => {
    const g = pose(galet, 60 - (galet.core.x - plaine.core.x), 0);
    const loin = { ...startingIsland('maths-6e-decimals'), core: { x: plaine.core.x - 170, y: plaine.core.y } };
    const traces = tracer([plaine, g, loin], VERS_LE_GALET, VERS_LE_VOLCAN);
    expect(traces.get(VERS_LE_GALET)).not.toBeNull();
    expect(traces.get(VERS_LE_VOLCAN)).toBeNull();
  });
});

it('le traceur refuse une région de plus de 31 lieux : un bit par lieu dans un entier de 32 bits', () => {
  const foret = startingIsland('french-6e-phonology');
  const trop = Array.from({ length: MAX_ISLANDS_PER_REGION + 1 }, () => foret);
  expect(() => new RegionRouter('6e', { lieux: trop })).toThrow(/31 lieux/);
  expect(() => new RegionRouter('6e', { lieux: trop.slice(1) })).not.toThrow();
});
