import { islandsOf } from './archipelago';
import { boardingRoute, islandAt, islandCenter } from './terrain';
import {
  ARROW_DIRS,
  WALK_MAX_MS,
  avatarWalk,
  boardingWalk,
  cubeTags,
  finishWalk,
  groundTap,
  islandInDirection,
  startStrolls,
  startVoyage,
  startWalk,
  strollAt,
  voyageFrame,
  walkPose,
} from './scene';
import { legTiming } from './voyage';

const A = { x: 0, y: 0, z: 1 };
const B = { x: 12, y: 0, z: 1 };

describe('la marche du bonhomme', () => {
  it('le premier placement est immédiat ; un trajet dure six cases par seconde, six secondes au plus', () => {
    expect(avatarWalk({ route: [A, B], seq: 0 }, 0)!.duration).toBe(1);
    expect(avatarWalk({ route: [A, B], seq: 1 }, 0)!.duration).toBe(2000);
    expect(avatarWalk({ route: [A, { x: 600, y: 0, z: 1 }], seq: 1 }, 0)!.duration).toBe(WALK_MAX_MS);
    expect(avatarWalk({ route: [], seq: 1 }, 0)).toBeNull();
    // Un seul point : il se tient là.
    const still = walkPose(avatarWalk({ route: [B], seq: 1 }, 0)!, 10);
    expect([still.x, still.y, still.moving]).toEqual([12, 0, false]);
  });

  it('avance au prorata de la distance et regarde là où il va', () => {
    const walk = startWalk([A, B], 1000, 2000);
    const mid = walkPose(walk, 2000);
    expect(mid.x).toBeCloseTo(6);
    expect(mid.moving).toBe(true);
    expect(mid.facing!.dx).toBeGreaterThan(0);
    const end = walkPose(walk, 3000);
    expect([end.x, end.moving]).toEqual([12, false]);
  });

  it('avec « réduire les animations », il est tout de suite arrivé', () => {
    expect(walkPose(startWalk([A, B], 0, 2000), 0, true)).toMatchObject({ x: 12, moving: false });
  });

  it('un toucher pendant le trajet le fait arriver tout de suite', () => {
    const walk = startWalk([A, B], 0, 2000);
    expect(finishWalk(walk, 500)).toBe(true);
    expect(walkPose(walk, 500).moving).toBe(false);
    expect(finishWalk(walk, 600)).toBe(false);
    expect(finishWalk(null, 600)).toBe(false);
  });
});

describe('le voyage du Bloc-Navire', () => {
  it('au départ : le bonhomme marche jusqu’au pont, monte à bord, le navire s’éloigne, puis la fin est annoncée une fois', () => {
    const run = startVoyage({ leg: 'depart', stage: 1, back: false }, 0);
    const { walk, sail } = legTiming('depart', false);
    expect(boardingWalk('plaine', run, 0)!.route).toEqual(boardingRoute('plaine'));
    expect(voyageFrame(run, 'plaine', walk / 2)).toMatchObject({ k: 0, aboard: false, underway: false, end: false });
    const mid = voyageFrame(run, 'plaine', walk + sail / 2);
    expect(mid).toMatchObject({ aboard: true, underway: true, end: false });
    expect(mid.k).toBeCloseTo(0.5);
    expect(voyageFrame(run, 'plaine', walk + sail).end).toBe(true);
    expect(voyageFrame(run, 'plaine', walk + sail + 100).end).toBe(false);
  });

  it('à l’arrivée : le navire accoste, le bonhomme débarque une seule fois, par le chemin d’embarquement à rebours', () => {
    const run = startVoyage({ leg: 'arrivee', stage: 2, back: true }, 0);
    const { walk, sail } = legTiming('arrivee', true);
    expect(boardingWalk('marche', run, 0)).toBeNull();
    const first = voyageFrame(run, 'marche', 0);
    expect(first).toMatchObject({ k: 1, aboard: true, disembark: null });
    const docked = voyageFrame(run, 'marche', sail);
    expect(docked.k).toBe(0);
    expect(docked.aboard).toBe(false);
    expect(docked.disembark!.route).toEqual([...boardingRoute('marche')].reverse());
    expect(voyageFrame(run, 'marche', sail + 10).disembark).toBeNull();
    expect(voyageFrame(run, 'marche', sail + walk).end).toBe(true);
  });
});

describe('les créatures', () => {
  const origin = { x: 5, y: 5, z: 2 };

  it('une créature fait un pas de temps en temps, puis se repose ; un Gardien ne bouge pas', () => {
    const [walker, guardian] = startStrolls(
      [
        { id: 'foret', cubes: [], origin },
        { id: 'mine', cubes: [], origin, kind: 'guardian', still: true },
      ],
      0,
    );
    expect(guardian.kind).toBe('guardian');
    // Avant son premier départ, au repos.
    expect(strollAt(walker, 1000, 1, () => 0)).toMatchObject({ dx: 0, dy: 0 });
    // Le pas démarre (le deuxième pas possible : une case vers l'ouest), puis s'achève 1,8 s plus tard.
    strollAt(walker, 2000, 2, () => 0.3);
    const step = walker.to;
    expect(step).toEqual([-1, 0]);
    const half = strollAt(walker, 2900, 2.9, () => 0);
    expect(Math.abs(half.dx) + Math.abs(half.dy)).toBeGreaterThan(0);
    const done = strollAt(walker, 3800, 3.8, () => 0);
    expect([done.dx, done.dy]).toEqual(step);
    expect(walker.start).toBe(0);
    expect(walker.next).toBe(3800 + 3000);
    for (const now of [2000, 5000, 9000]) expect(strollAt(guardian, now, now / 1000)).toMatchObject({ dx: 0, dy: 0 });
  });
});

describe('le clavier', () => {
  it('une flèche mène à l’île voisine dans cette direction, jamais à l’île où l’on est', () => {
    const islands = islandsOf('6e').map((b) => b.id);
    const from = islandCenter('foret');
    const found = Object.values(ARROW_DIRS)
      .map((dir) => islandInDirection('6e', from, dir))
      .filter((id) => id !== null);
    expect(found.length).toBeGreaterThan(0);
    for (const id of found) {
      expect(islands).toContain(id);
      expect(id).not.toBe('foret');
    }
    const east = islandInDirection('6e', from, ARROW_DIRS.ArrowRight);
    if (east) expect(islandCenter(east).x).toBeGreaterThan(from.x);
  });
});

describe('toucher le sol', () => {
  const cell = { x: 3, y: 4, z: 1 };
  const next = { x: 3, y: 4, z: 2 };
  const tags = cubeTags([
    { x: 3, y: 4, z: 1, color: '#fff', quest: 'foret:rimes', bridge: 'foret-mine' },
    { x: 9, y: 9, z: 1, color: '#fff', bridge: 'foret-mine' },
  ]);
  const all = { quest: true, bridge: true, build: true };

  it('l’école se touche pour y entrer, même en chantier', () => {
    const c = islandCenter('foret');
    const school = cubeTags([{ x: c.x, y: c.y, z: 3, color: '#fff', place: 'ecole' }]);
    const hit = { cell: { x: c.x, y: c.y, z: 3 }, next: { x: c.x, y: c.y, z: 4 }, ground: { x: c.x + 0.5, y: c.y + 0.5 } };
    expect(groundTap('6e', hit, school, { ...all, place: true })).toEqual({ kind: 'place', place: 'ecole', island: 'foret' });
    // Une vue qui ne sait pas y entrer : la face (chantier), comme avant.
    expect(groundTap('6e', hit, school, all)).toEqual({ kind: 'face', cell: hit.cell, next: hit.next });
  });

  it('la borne de mission d’abord, puis l’ouvrage, puis la face en chantier, sinon l’île', () => {
    expect(groundTap('6e', { cell, next, ground: cell }, tags, all)).toEqual({ kind: 'quest', biome: 'foret', typeId: 'rimes' });
    expect(groundTap('6e', { cell, next, ground: cell }, tags, { ...all, quest: false })).toEqual({ kind: 'bridge', id: 'foret-mine' });
    expect(groundTap('6e', { cell, next, ground: cell }, tags, { quest: false, bridge: false, build: true })).toEqual({ kind: 'face', cell, next });
    const c = islandCenter('foret');
    expect(groundTap('6e', { cell: c, next: c, ground: { x: c.x + 0.4, y: c.y + 0.7 } }, cubeTags([]), all)).toEqual({ kind: 'face', cell: c, next: c });
    expect(groundTap('6e', { cell: c, next: c, ground: { x: c.x + 0.4, y: c.y + 0.7 } }, cubeTags([]), { quest: true, bridge: true, build: false })).toEqual({
      kind: 'island',
      id: islandAt('6e', Math.floor(c.x + 0.4), Math.floor(c.y + 0.7)),
    });
  });
});
