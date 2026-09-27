import type { VoxelCube } from '../Voxel';
import { islandCenter, worldCubes } from '../world/terrain';
import { CHUNK, CLOSE_TILES, TILE, buildTiles, crisp, faceCell, fitCells, frame2D, pickTile, project, toBase, toScreen } from './oblique';

const cube = (x: number, y: number, z: number, extra: Partial<VoxelCube> = {}): VoxelCube => ({ x, y, z, color: '#888888', ...extra });

describe('la projection oblique', () => {
  it('le nord et le haut montent à l’écran : un bloc de haut, une case', () => {
    expect(project(2, 0, 0)).toEqual({ bx: 32, by: 0 });
    expect(project(0, 1, 0).by).toBe(-TILE);
    expect(project(0, 0, 1).by).toBe(-TILE);
    // Le dessus d'un cube est juste au-dessus de sa face avant.
    expect(faceCell({ x: 3, y: 4, z: 1 }, 'top')).toEqual({ col: 3, row: -7 });
    expect(faceCell({ x: 3, y: 4, z: 1 }, 'front')).toEqual({ col: 3, row: -6 });
  });

  it('passer de l’écran aux pixels de base, et retour', () => {
    const view = { cx: 100, cy: -50, s: 2 };
    const screen = { w: 800, h: 600 };
    const b = toBase(view, screen, 123, 456);
    expect(toScreen(view, screen, b.bx, b.by)).toEqual({ sx: 123, sy: 456 });
    expect(toBase(view, screen, 400, 300)).toEqual({ bx: 100, by: -50 });
  });
});

describe('la carte des tuiles', () => {
  it('un cube seul montre son dessus et sa face avant', () => {
    const map = buildTiles([cube(0, 0, 0)]);
    expect(map.tiles.size).toBe(2);
    expect(map.tiles.get('0,-2')!.solid!.kind).toBe('top');
    expect(map.tiles.get('0,-1')!.solid!.kind).toBe('front');
  });

  it('une face couverte par un cube voisin disparaît (dessus sous un cube, face avant contre un cube au sud)', () => {
    const map = buildTiles([cube(0, 0, 0), cube(0, 0, 1), cube(0, -1, 0)]);
    const kinds = [...map.tiles.values()].map((t) => `${t.solid!.cube.y},${t.solid!.cube.z}:${t.solid!.kind}`);
    expect(kinds).not.toContain('0,0:top');
    expect(kinds).not.toContain('0,0:front');
    expect(kinds).toContain('0,1:top');
  });

  it('dans une case, le cube le plus proche l’emporte : un mur au sud cache le sol derrière lui', () => {
    // Le sol (0, 2, 0) : son dessus tombe dans la même case que la face avant d'un mur de deux blocs au sud.
    const floor = cube(0, 2, 0);
    const wall = [cube(0, 1, 0), cube(0, 1, 1)];
    const row = faceCell(floor, 'top').row;
    const map = buildTiles([floor, ...wall]);
    expect(map.tiles.get(`0,${row}`)!.solid!.cube).toBe(wall[1]);
  });

  it('un fantôme se dessine par-dessus, sans cacher un bloc plein ni se montrer derrière lui', () => {
    const map = buildTiles([cube(0, 0, 0), cube(0, 0, 1, { ghost: true })]);
    // Le dessus du bloc plein reste visible sous le fantôme posé dessus.
    const under = map.tiles.get(`0,${faceCell({ x: 0, y: 0, z: 0 }, 'top').row}`)!;
    expect(under.solid!.kind).toBe('top');
    expect(under.ghost!.cube.ghost).toBe(true);
    const hidden = buildTiles([cube(0, 1, 1, { ghost: true }), cube(0, 0, 1), cube(0, 0, 2)]);
    for (const t of hidden.tiles.values()) if (t.ghost) expect(t.ghost.depth).toBeLessThan(t.solid?.depth ?? Infinity);
  });

  it('sous la mer, rien n’est dessiné', () => {
    expect(buildTiles([cube(0, 0, -3), cube(0, 0, -2)], -1).tiles.size).toBe(0);
  });

  it('range les cases par morceaux, et couvre tout un archipel', () => {
    const cubes = worldCubes('6e', {});
    const map = buildTiles(cubes, -1);
    let n = 0;
    for (const [k, list] of map.chunks) {
      const [cx, cy] = k.split(',').map(Number);
      for (const t of list) {
        expect(Math.floor(t.col / CHUNK)).toBe(cx);
        expect(Math.floor(t.row / CHUNK)).toBe(cy);
      }
      n += list.length;
    }
    expect(n).toBe(map.tiles.size);
    expect(map.maxCol - map.minCol).toBeGreaterThan(100);
  });
});

describe('toucher une case', () => {
  it('le dessus : la case devant est au-dessus ; la face avant : la case devant est au sud', () => {
    const map = buildTiles([cube(5, 5, 2)]);
    const top = faceCell({ x: 5, y: 5, z: 2 }, 'top');
    expect(pickTile(map, top.col, top.row)).toEqual({ cell: { x: 5, y: 5, z: 2 }, next: { x: 5, y: 5, z: 3 }, ground: { x: 5.5, y: 5.5 } });
    const front = faceCell({ x: 5, y: 5, z: 2 }, 'front');
    expect(pickTile(map, front.col, front.row)!.next).toEqual({ x: 5, y: 4, z: 2 });
    expect(pickTile(map, 99, 99)).toBeNull();
  });

  it('en chantier, c’est le fantôme qu’on touche', () => {
    const map = buildTiles([cube(0, 0, 0), cube(0, 0, 1, { ghost: true })]);
    const t = faceCell({ x: 0, y: 0, z: 1 }, 'top');
    expect(pickTile(map, t.col, t.row)!.cell).toEqual({ x: 0, y: 0, z: 1 });
  });
});

describe('le cadrage', () => {
  const map = buildTiles(worldCubes('6e', {}), -1);
  const screen = { w: 1000, h: 700 };

  it('une échelle nette : un nombre entier de pixels, ou l’échelle exacte sous un pixel', () => {
    expect(crisp(2.4)).toBe(2);
    expect(crisp(2.6)).toBe(3);
    expect(crisp(2.9, true)).toBe(2);
    expect(crisp(0.6)).toBe(0.6);
    expect(crisp(1.2, true)).toBe(1);
  });

  it('cadre un rectangle de cases en entier', () => {
    const v = fitCells({ minCol: 0, maxCol: 9, minRow: 0, maxRow: 4 }, { w: 200, h: 200 }, 0);
    expect(v).toEqual({ cx: 80, cy: 40, s: 200 / 160 });
  });

  it('de près, comme une salle : sur le bonhomme, ou l’île ouverte, sans sortir de l’île ; la Carte en entier', () => {
    const c = islandCenter('foret');
    const island = frame2D({ archipelago: '6e', map: false, island: 'foret', home: 'foret' }, map, screen);
    expect(island.cx).toBe(project(c.x + 0.5, c.y + 0.5, c.z + 1).bx);
    expect(island.s).toBe(Math.round(700 / (CLOSE_TILES * TILE)));
    // Le bonhomme au milieu de l'île : la vue le suit.
    const avatar = { x: c.x + 2, y: c.y - 1, z: c.z + 1 };
    const near = frame2D({ archipelago: '6e', map: false, island: null, home: 'foret', avatar }, map, screen);
    expect(near.cx).toBe(project(avatar.x + 0.5, avatar.y + 0.5, avatar.z).bx);
    // Au bord de l'île : la vue s'arrête avant de montrer trop de mer.
    const far = frame2D({ archipelago: '6e', map: false, island: null, home: 'foret', avatar: { ...avatar, x: avatar.x - 60 } }, map, screen);
    expect(far.cx).toBeGreaterThan(project(avatar.x - 60, 0, 0).bx);
    const carte = frame2D({ archipelago: '6e', map: true, island: null, home: 'foret' }, map, screen);
    expect(carte.s).toBeLessThan(near.s);
  });
});

it('la vue 2D ne charge pas Three.js', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const { join } = await import('node:path');
  const dir = join(process.cwd(), 'src/blocland/pixel');
  for (const f of readdirSync(dir).filter((n) => /\.tsx?$/.test(n) && !n.includes('.test.'))) {
    expect(readFileSync(join(dir, f), 'utf8'), f).not.toMatch(/from '(three|\.\.\/three[^']*)'/);
  }
});
