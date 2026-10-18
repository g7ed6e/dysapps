// Le cadrage de la remise suit la taille de l'écran (GD-20, point 4, lot L1 ; relecture de l'expert frontend, deuxième
// passe) : la scène vraie, sans moteur WebGL sous jsdom (un `WebGLRenderer` simulé, qui ne dessine rien), et son
// `ResizeObserver` appelé à la main. Une tablette qui tourne pendant la remise, puis revient : la caméra retrouve le
// cadrage de la remise, pas celle qui suit Kéo. Sans la branche de `resize` qui rappelle `refitRemise`, ce test échoue.
// Lot L2 : la caisse de « Donner » (aux Quais) et l'objet d'« Apporter » (la lanterne du Phare) se jouent dans la même
// remise, et leur cadrage suit l'écran de même.
import * as THREE from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { COMMANDES } from '../../world/requests';
import { createOpenWorld, type OpenWorld, type OpenWorldOptions } from './scene';
import { planFor } from '../../world/continu/levelPlan';

const made = vi.hoisted(() => ({ cameras: [] as THREE.PerspectiveCamera[] }));
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
  class PerspectiveCamera extends m.PerspectiveCamera {
    constructor(...args: ConstructorParameters<typeof m.PerspectiveCamera>) {
      super(...args);
      made.cameras.push(this);
    }
  }
  return { ...m, WebGLRenderer, PerspectiveCamera };
});

const size = { w: 1024, h: 768 };
let observed: (() => void) | null = null;
let world: OpenWorld;
let camera: THREE.PerspectiveCamera;

/** Ce que la caméra montre : sa place, son regard, son décalage. */
const shot = () => {
  const d = camera.getWorldDirection(new THREE.Vector3());
  return [camera.position.x, camera.position.y, camera.position.z, d.x, d.y, d.z, camera.view?.offsetX ?? 0, camera.view?.offsetY ?? 0].map((v) => Number(v.toFixed(4)));
};
const turn = (w: number, h: number) => {
  size.w = w;
  size.h = h;
  observed!();
};

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(cb: () => void) {
        observed = cb;
      }
      observe() {}
      disconnect() {}
    },
  );
  const host = document.createElement('div');
  Object.defineProperty(host, 'clientWidth', { get: () => size.w });
  Object.defineProperty(host, 'clientHeight', { get: () => size.h });
  document.body.appendChild(host);
  const noop = () => {};
  const before = made.cameras.length;
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
  // La caméra de la scène : la première faite par `createOpenWorld`.
  camera = made.cameras[before];
});

afterAll(() => {
  world?.dispose();
  vi.unstubAllGlobals();
});

describe('La remise quand l’écran change de taille', () => {
  it('une tablette qui tourne pendant la remise, puis revient : la caméra retrouve le cadrage de la remise (pas celle qui suit Kéo)', () => {
    const potager = COMMANDES.find((c) => c.fixture === 'french-6e-phonology-fixture-1')!;
    world.remise({ place: 'phare', amenagement: potager.fixture }, { element: () => {}, done: () => {} });
    const landscape = shot();
    turn(768, 1024);
    expect(camera.aspect).toBeCloseTo(768 / 1024);
    const portrait = shot();
    expect(portrait).not.toEqual(landscape);
    turn(1024, 768);
    expect(shot()).toEqual(landscape);
    world.remise(null);
  });

  it('la caisse de « Donner » aux Quais, puis la lanterne apportée au Phare : la remise se joue, l’état final tout de suite, et le cadrage suit l’écran', () => {
    world.remise({ place: 'quais', caisse: { count: 2, block: { dessus: 0xc29a5f, cote: 0x9c7a48 } } }, { element: () => {}, done: () => {} });
    const landscape = shot();
    turn(768, 1024);
    expect(shot()).not.toEqual(landscape);
    turn(1024, 768);
    expect(shot()).toEqual(landscape);
    world.remiseStart();
    world.remiseFinish();
    world.remise({ place: 'phare', amenagement: 'french-6e-phonology-fixture-2', carry: true }, { element: () => {}, done: () => {} });
    world.remiseStart();
    world.remiseFinish();
    expect(shot()).not.toEqual(landscape);
    world.remise(null);
  });
});
