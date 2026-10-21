// La marque de la suggestion sur la Nef prête (GD-21, « Prête » : le passage prêt passe en tête), dans la scène vraie,
// sans moteur WebGL sous jsdom (un `WebGLRenderer` simulé) et à l'horloge du test : `setMark('nef')` pose la marque
// au-dessus de la Nef, à l'écran depuis le quai, tout près ; `setMark(null)` la retire.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MarkOnScreen } from '../../world/continu/mission';
import { placeRecord, planFor, type OpenWorldLevel } from '../../world/continu/levelPlan';
import { createOpenWorld, type OpenWorld, type OpenWorldOptions } from './scene';

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
    initTexture() {}
    getPixelRatio() {
      return 1;
    }
  }
  return { ...m, WebGLRenderer };
});

const [W, H] = [1024, 768];
let clock = 1000;
let queued: FrameRequestCallback[] = [];
const frame = (ms = 16) => {
  clock += ms;
  const now = queued;
  queued = [];
  for (const f of now) f(clock);
};

// Les globaux simulés sont retirés après chaque test (src/setupTests.ts) : remis avant chacun.
const stubs = () => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => queued.push(cb));
  vi.stubGlobal('cancelAnimationFrame', () => {});
};
beforeEach(stubs);

const worlds: OpenWorld[] = [];
const marks: Record<string, (MarkOnScreen | null)[]> = {};

function make(level: OpenWorldLevel): OpenWorld {
  const plan = planFor(level);
  const host = document.createElement('div');
  Object.defineProperty(host, 'clientWidth', { get: () => W });
  Object.defineProperty(host, 'clientHeight', { get: () => H });
  document.body.appendChild(host);
  const noop = () => {};
  const seen: (MarkOnScreen | null)[] = (marks[level] = []);
  const world = createOpenWorld(host, {
    plan,
    start: 'quai',
    reduceMotion: true,
    meter: { show: false, expose: false },
    onArrive: noop,
    onDepart: noop,
    onMark: (m) => void seen.push(m),
    onLocks: noop,
    onMapPlaces: noop,
    onMapPick: noop,
    onClosed: noop,
    onPort: noop,
    onAssembled: noop,
    onPosed: noop,
    onNef: noop,
  } as OpenWorldOptions);
  world.setLands({ closed: [] });
  world.setPlaces({ built: placeRecord(plan, () => []), traces: placeRecord(plan, () => []), amenagements: placeRecord(plan, () => []) });
  worlds.push(world);
  return world;
}

beforeAll(() => {
  stubs();
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
});

afterAll(() => {
  for (const w of worlds) w.dispose();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('La marque sur la Nef prête', () => {
  it.each(['6e', '5e'] as const)('au %s : depuis le quai, la marque est à l’écran, au-dessus de la Nef, tout près ; retirée, plus de marque', (level) => {
    const world = make(level);
    world.setNef(3);
    world.setMark('nef');
    frame();
    const m = marks[level].at(-1);
    expect(m).toBeTruthy();
    expect(m!.inside).toBe(true);
    expect(m!.far).toBe(1);
    world.setMark(null);
    frame();
    expect(marks[level].at(-1)).toBeNull();
  });
});
