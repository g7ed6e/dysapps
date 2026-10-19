// La cabine de la Montée dans la scène vraie (GD-22, lot 3, première relecture : arbitrage du fil, point 4 ; expert
// frontend, A1), sans moteur WebGL sous jsdom (un `WebGLRenderer` simulé) et à l'horloge du test (les images viennent
// quand le test les donne). Tant que la caisse roule, aucun geste de déplacement ne fait repartir Kéo ; la pose, la lueur
// et la caisse passent par le même maillage, jamais en même temps qu'une question : ouverte pendant une pose ou un
// trajet de cabine, la question les finit et le maillage se cache.
import * as THREE from 'three';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { bridgeSite, cabinPoint } from '../../world/continu/bridges';
import { cabinOf } from '../../world/continu/cabinRide';
import { placeRecord, planFor } from '../../world/continu/levelPlan';
import { questionLayout } from '../../world/continu/questionScene';
import { scenetteLayout } from '../../world/continu/scenette';
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
    initTexture() {}
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

const PLAN = planFor('5e');
const LAND = cabinOf(PLAN)!;
const SITE = bridgeSite(LAND);
const FOOT = cabinPoint(SITE, SITE.abut[0] - 2);
const [W, H] = [1024, 768];
let world: OpenWorld;
let scene: THREE.Scene;
let clock = 1000;
let queued: FrameRequestCallback[] = [];
const departs: number[] = [];
const cabins: { side: string | null; riding: string | null }[] = [];

/** Une image, `ms` millisecondes après la précédente. */
const frame = (ms = 16) => {
  clock += ms;
  const now = queued;
  queued = [];
  for (const f of now) f(clock);
};
const poseMesh = (): THREE.Mesh => scene.getObjectByName('pose') as THREE.Mesh;
const empty = (): Parameters<OpenWorld['setPlaces']>[0] => ({ built: placeRecord(PLAN, () => []), traces: placeRecord(PLAN, () => []), amenagements: placeRecord(PLAN, () => []) });

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

beforeAll(() => {
  stubs();
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  const host = document.createElement('div');
  Object.defineProperty(host, 'clientWidth', { get: () => W });
  Object.defineProperty(host, 'clientHeight', { get: () => H });
  document.body.appendChild(host);
  const noop = () => {};
  const before = made.scenes.length;
  world = createOpenWorld(host, {
    plan: PLAN,
    start: 'quai',
    reduceMotion: false,
    meter: { show: false, expose: false },
    onArrive: noop,
    onDepart: () => void departs.push(clock),
    onMark: noop,
    onLocks: noop,
    onMapPlaces: noop,
    onMapPick: noop,
    onClosed: noop,
    onPort: noop,
    onAssembled: noop,
    onPosed: noop,
    onCabin: (c) => void cabins.push(c),
  } as OpenWorldOptions);
  scene = made.scenes[before];
  world.setLands({ closed: [] });
  world.setPlaces(empty());
});

afterAll(() => {
  world?.dispose();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Kéo à la gare du pied, puis la caisse qui roule (le bouton « Monter »). */
function rideUp(): void {
  world.standAt(FOOT);
  frame();
  expect(cabins.at(-1)).toEqual({ side: 'bas', riding: null });
  world.ride();
  // Kéo entre dans la caisse, elle part.
  for (let k = 0; k < 40 && cabins.at(-1)?.riding !== 'haut'; k++) frame(50);
  expect(cabins.at(-1)).toEqual({ side: null, riding: 'haut' });
}

describe('La cabine de la Montée, dans la scène', () => {
  it('tant que la caisse roule, ni un lieu, ni un point du sol, ni un toucher ne font repartir Kéo', () => {
    rideUp();
    const departed = departs.length;
    world.goTo('hameau');
    world.standAt(FOOT);
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: W / 2, clientY: H * 0.8, bubbles: true }));
    canvas.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: W / 2, clientY: H * 0.8, bubbles: true }));
    frame(50);
    expect(departs.length).toBe(departed);
    expect(cabins.at(-1)?.riding).toBe('haut');
    // Kéo est toujours dans la caisse : ni le point du sol, ni le lieu ne l'ont pris.
    expect(world.keoAt()).not.toEqual(FOOT);
    // La caisse arrive : Kéo ressort en haut, la page l'annonce (la fin de `riding`).
    for (let k = 0; k < 200 && cabins.at(-1)?.riding; k++) frame(50);
    expect(cabins.at(-1)?.riding).toBeNull();
    expect(poseMesh().visible).toBe(false);
  });

  it('« Passer le trajet » dans la caisse la finit proprement : Kéo en haut, la caisse à sa gare, le maillage de la pose caché', () => {
    world.goTo('montee', true);
    frame();
    rideUp();
    const departed = departs.length;
    world.skip();
    expect(poseMesh().visible).toBe(false);
    frame();
    expect(cabins.at(-1)?.riding).toBeNull();
    expect(departs.length).toBe(departed);
  });

  it('une question ouverte pendant que la caisse roule la finit : Kéo en haut, le maillage de la pose caché', () => {
    world.goTo('montee', true);
    frame();
    rideUp();
    expect(poseMesh().visible).toBe(true);
    const layout = scenetteLayout({ count: 3, column: true }, W, H, questionLayout({ count: 3 }, W, H));
    world.question({ place: 'hameau', mission: 'essai', layout, item: { key: 'essai', scene: { kind: 'column' }, answered: false, right: [0], picked: [] } });
    expect(poseMesh().visible).toBe(false);
    frame();
    expect(cabins.at(-1)?.riding).toBeNull();
    world.question(null);
  });

  it('une question ouverte pendant une pose la finit : le maillage de la pose caché', () => {
    world.goTo('montee', true);
    frame();
    const parts = [[{ stage: 0 as const, from: 0, to: 1 }]];
    const state = empty();
    const built = { ...state.built, montee: parts };
    expect(world.setPlaces({ ...state, built }, { place: 'montee', parts })).toBe(true);
    // La caméra va vers le lieu, puis la partie descend : le maillage de la pose se montre.
    for (let k = 0; k < 60 && !poseMesh().visible; k++) frame(50);
    expect(poseMesh().visible).toBe(true);
    const layout = scenetteLayout({ count: 3, column: true }, W, H, questionLayout({ count: 3 }, W, H));
    world.question({ place: 'hameau', mission: 'essai', layout, item: { key: 'essai', scene: { kind: 'column' }, answered: false, right: [0], picked: [] } });
    expect(poseMesh().visible).toBe(false);
    world.question(null);
  });
});
