// La sortie d'une scénette libère son décor de près, abords compris (relecture de la DA et de l'expert frontend) : la
// scène vraie, sans moteur WebGL sous jsdom (un `WebGLRenderer` simulé, qui ne dessine rien). Pour chaque lieu qui a des
// abords, la question posée puis retirée : la géométrie du décor de près (`decorMesh`) reçoit son `dispose`, et après la
// scénette le monde porte autant de triangles qu'avant elle (rien des abords ne reste, le chenal des Balises compris).
import * as THREE from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PlaceId } from '../../world/continu/plan6e';
import { planFor } from '../../world/continu/levelPlan';
import { questionLayout } from '../../world/continu/questionScene';
import { scenetteDecor, scenetteLayout, scenetteSurroundings } from '../../world/continu/scenette';
import { SURROUNDINGS } from '../../world/continu/surroundings';
import { createOpenWorld, type OpenWorld, type OpenWorldOptions } from './scene';

const made = vi.hoisted(() => ({ scenes: [] as THREE.Scene[] }));
vi.mock('three', async (original) => {
  const m = await original<typeof import('three')>();
  class WebGLRenderer {
    domElement = document.createElement('canvas');
    info = { render: { calls: 0, triangles: 0 }, memory: {}, autoReset: true, reset() {} };
    shadowMap = {};
    setPixelRatio() {}
    setSize() {}
    render() {}
    dispose() {}
    compile() {}
    setClearColor() {}
    getPixelRatio() {
      return 1;
    }
  }
  class Scene extends m.Scene {
    constructor() {
      super();
      made.scenes.push(this);
    }
  }
  return { ...m, WebGLRenderer, Scene };
});

const [W, H] = [1024, 768];
let world: OpenWorld;
let scene: THREE.Scene;

/** Les maillages de la scène et leur géométrie du moment. */
const geometries = (): Map<THREE.Mesh, THREE.BufferGeometry> => {
  const out = new Map<THREE.Mesh, THREE.BufferGeometry>();
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) out.set(o, o.geometry);
  });
  return out;
};
/** Les triangles que portent les maillages montrés de la scène. */
const triangles = (): number => {
  let n = 0;
  scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || !o.visible) return;
    const g = o.geometry as THREE.BufferGeometry;
    n += (g.index ? g.index.count : (g.getAttribute('position')?.count ?? 0)) / 3;
  });
  return n;
};

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  const host = document.createElement('div');
  Object.defineProperty(host, 'clientWidth', { get: () => W });
  Object.defineProperty(host, 'clientHeight', { get: () => H });
  document.body.appendChild(host);
  const noop = () => {};
  const before = made.scenes.length;
  world = createOpenWorld(host, {
    plan: planFor('6e'),
    start: 'phare',
    reduceMotion: true,
    meter: { show: false, expose: false },
    onArrive: noop,
    onDepart: noop,
    onMark: noop,
    onLocks: noop,
    onMapPlaces: noop,
    onMapPick: noop,
    onClosed: noop,
    onPort: noop,
    onAssembled: noop,
    onPosed: noop,
  } as OpenWorldOptions);
  scene = made.scenes[before];
});

afterAll(() => {
  world?.dispose();
  vi.unstubAllGlobals();
});

describe('La sortie d’une scénette', () => {
  const layout = scenetteLayout({ count: 3, column: true }, W, H, questionLayout({ count: 3 }, W, H));
  const places = Object.keys(SURROUNDINGS) as PlaceId[];

  it.each(places)('%s : le décor de près, abords compris, est libéré, et rien n’en reste dans le monde', (place) => {
    const before = geometries();
    const shown = triangles();
    world.question({ place, mission: 'essai', layout, item: { key: 'essai', scene: { kind: 'column' }, answered: false, right: [0], picked: [] } });
    // Le décor de près : le maillage dont la géométrie porte le décor du lieu, abords compris.
    const decor = new Set([true, false].map((posed) => scenetteDecor(place, false, posed).triangles));
    const during = [...geometries()].filter(([m, g]) => before.get(m) !== g && decor.has((g.getAttribute('position')?.count ?? 0) / 3));
    expect(during).toHaveLength(1);
    const [mesh, geometry] = during[0];
    expect(geometry.getAttribute('position').count / 3).toBeGreaterThanOrEqual(scenetteSurroundings(place).triangles);
    const freed = vi.fn();
    geometry.addEventListener('dispose', freed);
    world.question(null);
    expect(freed).toHaveBeenCalledTimes(1);
    expect(mesh.geometry).not.toBe(geometry);
    expect(mesh.geometry.getAttribute('position')).toBeUndefined();
    expect(mesh.visible).toBe(false);
    // Aucune géométrie de la scène ne garde le décor, et le monde montre autant de triangles qu'avant la scénette.
    for (const g of geometries().values()) expect(g).not.toBe(geometry);
    expect(triangles()).toBe(shown);
  });
});
