// Le traceur des liaisons (GD-9, L2) : droites ou en L à un seul coude sur l'eau, jamais en biais, d'une arrivée sur la
// côte à une autre, au large des autres lieux, sans en croiser une autre. Sur des dispositions faites pour le test : la
// carte de départ calée sur le pas, qui l'emploiera, vient avec le lot suivant.
import { describe, expect, it } from 'vitest';
import { isLand, isLandDuMonde, lieuDeDepart, type IslandDef } from './map';
import { empriseDuLieu, distanceAuRectangle } from './footprint';
import { type Accroche, accrocheDansLeMonde, arriveesPossibles, cheminsADeuxCoudes, placePossible, cheminEntre, LONGUEUR_LONGUE, tracerLaRegion } from './routing';
import { bornesDuCoeur } from './map';
import { PAS, VERS_LE_LARGE } from './placement';

const accroche = (x: number, y: number, dx: number, dy: number): Accroche => ({ lieu: 'maths-6e-calculation', cote: 'droite', pas: 0, x, y, dx, dy });

/** Un lieu posé ailleurs (sans passer par la disposition du moment). */
const pose = (d: IslandDef, dx: number, dy: number, quarts: 0 | 1 | 2 | 3 = 0): IslandDef => ({ ...d, core: { x: d.core.x + dx, y: d.core.y + dy }, quarts });

describe('un chemin entre deux arrivées', () => {
  it('droit quand elles se font face sur une même ligne, en L quand leurs directions se croisent', () => {
    const droit = cheminEntre(accroche(0, 0, 1, 0), accroche(10, 0, -1, 0))!;
    expect(droit.coudes).toEqual([]);
    expect(droit.cases).toEqual(Array.from({ length: 9 }, (_, i) => ({ x: i + 1, y: 0 })));
    const l = cheminEntre(accroche(0, 0, 1, 0), accroche(8, 6, 0, -1))!;
    expect(l.cases[l.coudes[0]]).toEqual({ x: 8, y: 0 });
    expect(l.cases.length).toBe(8 + 5);
    // Chaque pas va d'une case à sa voisine, jamais en biais.
    for (const ch of [droit, l]) {
      const pts = [{ x: 0, y: 0 }, ...ch.cases];
      for (let i = 1; i < pts.length; i++) expect(Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y)).toBe(1);
    }
  });

  it('une liaison longue passe en Z ou en U, à deux coudes au large, du plus court au plus long', () => {
    const z = [...cheminsADeuxCoudes(accroche(0, 0, 1, 0), accroche(10, 3, -1, 0), 96)];
    expect(z.length).toBeGreaterThan(0);
    // Le premier : le tronçon de travers au milieu du bras de mer.
    expect(z[0].coudes.map((i) => z[0].cases[i])).toEqual([{ x: 5, y: 0 }, { x: 5, y: 3 }]);
    expect(z[0].cases.length).toBe(9 + 3);
    for (const c of z) expect(c.cases[c.cases.length - 1]).toEqual({ x: 9, y: 3 });
    const u = [...cheminsADeuxCoudes(accroche(0, 0, 0, 1), accroche(8, 2, 0, 1), 40)];
    expect(u[0].coudes.map((i) => u[0].cases[i])).toEqual([{ x: 0, y: 5 }, { x: 8, y: 5 }]);
    expect(u.every((c, i) => i === 0 || c.cases.length > u[i - 1].cases.length)).toBe(true);
    expect(u.every((c) => c.cases.length <= 40)).toBe(true);
    // Trop long, ou des arrivées perpendiculaires : rien.
    expect([...cheminsADeuxCoudes(accroche(0, 0, 1, 0), accroche(10, 3, -1, 0), 10)]).toEqual([]);
    expect([...cheminsADeuxCoudes(accroche(0, 0, 1, 0), accroche(10, 3, 0, -1), 96)]).toEqual([]);
  });

  it('jamais en biais, en Z (à un coude), à reculons, ni avec un coude collé à la côte', () => {
    expect(cheminEntre(accroche(0, 0, 1, 0), accroche(10, 3, -1, 0))).toBeNull(); // face à face décalées : un Z
    expect(cheminEntre(accroche(0, 0, 1, 0), accroche(10, 0, 1, 0))).toBeNull(); // dans le même sens
    expect(cheminEntre(accroche(0, 0, 1, 0), accroche(-8, 6, 0, -1))).toBeNull(); // le coude derrière le départ
    expect(cheminEntre(accroche(0, 0, 1, 0), accroche(2, 6, 0, -1))).toBeNull(); // coude à deux cases de la côte
  });
});

describe('les arrivées d’un lieu', () => {
  for (const id of ['maths-6e-calculation', 'french-6e-phonology', 'french-4e-agreement'] as const)
    it(`${id} : sur sa côte, au pas, jamais devant les bornes`, () => {
      const def = lieuDeDepart(id);
      const coeur = bornesDuCoeur(def);
      const arrivees = arriveesPossibles(def);
      expect(arrivees.length).toBeGreaterThan(4);
      for (const a of arrivees) {
        const { dx, dy } = VERS_LE_LARGE[a.cote];
        expect(isLand(def, def.core.x + a.x, def.core.y + a.y), `${a.cote}${a.pas}`).toBe(true);
        expect(isLand(def, def.core.x + a.x + dx, def.core.y + a.y + dy), `${a.cote}${a.pas}`).toBe(false);
        expect(Math.abs((dy !== 0 ? a.x : a.y) % PAS)).toBe(0);
        if (a.cote === 'devant') expect(a.x < coeur.x0 || a.x >= coeur.x1).toBe(true);
      }
    });
});

it('tourné, un lieu garde ses arrivées sur les lignes de la grille du monde', () => {
  const def = lieuDeDepart('maths-6e-fractions');
  for (const q of [1, 2, 3] as const) {
    const d = pose(def, 0, 0, q);
    for (const a of arriveesPossibles(d)) {
      const m = accrocheDansLeMonde(d, a);
      const surLaLigne = m.dy !== 0 ? m.x - d.core.x : m.y - d.core.y;
      expect(((surLaLigne % PAS) + PAS) % PAS, `${q} ${a.cote}${a.pas}`).toBe(0);
      // Sur la côte du lieu tourné, le large devant elle.
      expect(isLandDuMonde(d, m.x, m.y), `${q} ${a.cote}${a.pas}`).toBe(true);
      expect(isLandDuMonde(d, m.x + m.dx, m.y + m.dy), `${q} ${a.cote}${a.pas}`).toBe(false);
    }
  }
});

describe('le traceur d’une région', () => {
  const plaine = lieuDeDepart('maths-6e-calculation');
  const galet = lieuDeDepart('maths-6e-fractions');

  it('trace une liaison droite entre deux lieux face à face, en L sinon, au plus long', () => {
    const droit = tracerLaRegion('6e', { lieux: [plaine, pose(galet, 60 - (galet.core.x - plaine.core.x), 0)] }).get('maths-6e-calculation-maths-6e-fractions')!;
    expect(droit.coudes).toEqual([]);
    const l = tracerLaRegion('6e', { lieux: [plaine, pose(galet, 60 - (galet.core.x - plaine.core.x), 40)] }).get('maths-6e-calculation-maths-6e-fractions')!;
    expect(l.coudes.length).toBe(1);
    for (const t of [droit, l]) expect(t.cases.length).toBeLessThanOrEqual(LONGUEUR_LONGUE);
  });

  it('suit la rotation du lieu : une arrivée garde son côté dans le repère du lieu', () => {
    const g = pose(galet, 60 - (galet.core.x - plaine.core.x), 0, 2);
    const t = tracerLaRegion('6e', { lieux: [plaine, g] }).get('maths-6e-calculation-maths-6e-fractions')!;
    expect(t).not.toBeNull();
    // Tourné d'un demi-tour, c'est sa droite qui regarde la Plaine.
    expect(t.vers.cote).toBe('droite');
    expect(isLandDuMonde(g, t.vers.x, t.vers.y)).toBe(true);
  });

  it('ne coupe jamais un autre lieu : un lieu posé sur le chemin droit le fait passer au large, à deux cases au moins', () => {
    const g = pose(galet, 90 - (galet.core.x - plaine.core.x), 0);
    const obstacle = pose(lieuDeDepart('english-6e-grammar'), 0, 0);
    const milieu = { ...obstacle, core: { x: plaine.core.x + 45, y: plaine.core.y + 4 } };
    const t = tracerLaRegion('6e', { lieux: [plaine, g, milieu] }).get('maths-6e-calculation-maths-6e-fractions');
    expect(t).not.toBeUndefined();
    if (t) {
      expect(t.coudes.length).toBeGreaterThan(0);
      for (const c of t.cases) for (const p of empriseDuLieu(milieu.id, milieu)) expect(distanceAuRectangle(c.x, c.y, p)).toBeGreaterThanOrEqual(2);
    }
  });

  it('une liaison qui ne tient pas reste à reposer (null), sans tracé', () => {
    // Le Galet posé trop loin : plus de 96 cases d'eau.
    const t = tracerLaRegion('6e', { lieux: [plaine, pose(galet, 150 - (galet.core.x - plaine.core.x), 0)] }).get('maths-6e-calculation-maths-6e-fractions');
    expect(t).toBeNull();
  });

  it('deux liaisons ne se croisent jamais, ni ne se frôlent', () => {
    const g = pose(galet, 60 - (galet.core.x - plaine.core.x), 40);
    const volcan = lieuDeDepart('maths-6e-decimals');
    const v = { ...volcan, core: { x: plaine.core.x + 4, y: plaine.core.y + 64 } };
    const traces = [...tracerLaRegion('6e', { lieux: [plaine, g, v] }).values()].filter((t) => t !== null);
    expect(traces.length).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < traces.length; i++)
      for (let j = i + 1; j < traces.length; j++)
        for (const a of traces[i]!.cases) for (const b of traces[j]!.cases) expect(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))).toBeGreaterThanOrEqual(2);
  });
});

describe('une place possible (le geste « Aménager » le lira)', () => {
  const plaine = lieuDeDepart('maths-6e-calculation');
  const galet = lieuDeDepart('maths-6e-fractions');
  const dx = (x: number) => x - (galet.core.x - plaine.core.x);

  it('possible au large, sa liaison au point de départ tracée', () => {
    expect(placePossible('6e', [plaine, pose(galet, dx(60), 0)], galet.id)).toBe(true);
  });

  it('impossible trop près d’un autre lieu, hors du cadre, ou trop loin pour sa liaison', () => {
    expect(placePossible('6e', [plaine, pose(galet, dx(24), 0)], galet.id)).toBe(false);
    expect(placePossible('6e', [plaine, pose(galet, dx(-120), 0)], galet.id)).toBe(false);
    expect(placePossible('6e', [plaine, pose(galet, dx(150), 0)], galet.id)).toBe(false);
  });

  it('impossible s’il bloque une liaison qui se traçait (même en Z ou en U, elle ne tiendrait plus en 96 cases)', () => {
    const volcan = lieuDeDepart('maths-6e-decimals');
    const v = { ...volcan, core: { x: plaine.core.x, y: plaine.core.y + 108 } };
    const g = { ...galet, core: { x: plaine.core.x + 64, y: plaine.core.y } };
    const avant = tracerLaRegion('6e', { lieux: [plaine, g, v] });
    expect(avant.get('maths-6e-calculation-maths-6e-decimals')).not.toBeNull();
    // Le Galet posé entre la Plaine et le Volcan : sa propre liaison se trace, mais plus celle du Volcan.
    const entre = { ...galet, core: { x: plaine.core.x, y: plaine.core.y + 54 } };
    const apres = tracerLaRegion('6e', { lieux: [plaine, entre, v] });
    expect(apres.get('maths-6e-calculation-maths-6e-fractions')).not.toBeNull();
    expect(apres.get('maths-6e-calculation-maths-6e-decimals')).toBeNull();
    expect(placePossible('6e', [plaine, entre, v], galet.id, avant)).toBe(false);
  });
});
