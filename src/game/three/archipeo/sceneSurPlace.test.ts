// L'épreuve hors des murs (GD-27, lot 6) dans la scène vraie, sans moteur WebGL sous jsdom : la marche jusqu'à la
// station (d'un coup avec « Réduire les animations »), l'item posé sur place (Kéo à la station, les objets sur leurs
// pierres dans le maillage de l'item, un repère par objet avec sa boîte, de gauche à droite dans l'ordre des choix),
// la bonne réponse qui reste seule, la coupe de fin vers la scénette, puis la sortie qui ne laisse rien.
import * as THREE from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { planFor } from '../../world/continu/levelPlan';
import { questionLayout } from '../../world/continu/questionScene';
import { scenetteKeo, scenetteLayout } from '../../world/continu/scenette';
import { SUR_PLACE_TRIANGLES_MAX, surPlaceStation, type SurPlaceScene } from '../../world/continu/surPlace';
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

const triangles = (): number => {
  let n = 0;
  scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || !o.visible) return;
    const g = o.geometry as THREE.BufferGeometry;
    n += (g.index ? g.index.count : (g.getAttribute('position')?.count ?? 0)) / 3;
  });
  return n;
};
const itemMesh = (): THREE.Mesh => {
  let found: THREE.Mesh | null = null;
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh && o.name === 'item') found = o;
  });
  return found!;
};
/** Kéo dans la scène : son groupe, nommé. */
const keo = (): THREE.Object3D => {
  let found: THREE.Object3D | null = null;
  scene.traverse((o) => {
    if (o.name === 'keo') found = o;
  });
  return found!;
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
    start: 'mangrove',
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

describe('L’épreuve hors des murs dans la scène', () => {
  const layout = scenetteLayout({ count: 3 }, W, H, questionLayout({ count: 3 }, W, H));
  const scene1: SurPlaceScene = { kind: 'surPlace', objects: ['aigrette', 'chauve-souris', 'libellule'] };

  it('la marche puis l’item sur place : Kéo à la station, trois repères avec leur boîte dans l’ordre des choix, le maillage de l’item sous le plafond ; la bonne reste seule ; la coupe de fin ramène à la scénette ; la sortie ne laisse rien', () => {
    const shown = triangles();
    // Un item de la scénette d'abord, comme dans la partie.
    world.question({ place: 'mangrove', mission: 'living-groups', layout, item: { key: 'a', scene: { kind: 'column' }, answered: false, right: [0], picked: [] } });
    const keoScenette = scenetteKeo('mangrove');
    expect(keo().position.x).toBeCloseTo(keoScenette.at.x, 3);
    expect(keo().scale.x).toBeCloseTo(keoScenette.scale, 3);
    // « Aller voir » : la marche, d'un coup avec « Réduire les animations » ; la page est prévenue à l'arrivée.
    const done = vi.fn();
    const station = surPlaceStation('mangrove')!;
    world.walkTo(station, done);
    expect(done).toHaveBeenCalledTimes(1);
    expect(Math.hypot(world.keoAt().x - station.x, world.keoAt().z - station.z)).toBeLessThan(1.5);
    // Kéo à sa taille du monde, hors de la scénette.
    expect(keo().scale.x).toBeGreaterThan(1);
    // L'item sur place.
    const labels = world.question({ place: 'mangrove', mission: 'living-groups', layout, item: { key: 'b', scene: scene1, answered: false, right: [], picked: [] } });
    expect(labels).toHaveLength(3);
    expect(labels.map((l) => l.answer)).toEqual([0, 1, 2]);
    for (const l of labels) {
      expect(l.box).toBeDefined();
      expect(l.box!.right - l.box!.left).toBeGreaterThan(8);
      expect(l.box!.bottom - l.box!.top).toBeGreaterThan(8);
      // L'étiquette au-dessus de l'objet, dans la scène visible.
      expect(l.y).toBeLessThan(l.box!.bottom);
      expect(l.x).toBeGreaterThan(0);
      expect(l.x).toBeLessThan(W);
    }
    expect(labels[0].x).toBeLessThan(labels[1].x);
    expect(labels[1].x).toBeLessThan(labels[2].x);
    // Chaque objet assez grand pour être touché (48 px), à 1024 × 768.
    for (const l of labels) expect(l.box!.bottom - l.box!.top).toBeGreaterThanOrEqual(48);
    const mesh = itemMesh();
    expect(mesh.visible).toBe(true);
    expect(mesh.geometry.getAttribute('position').count / 3).toBeLessThanOrEqual(SUR_PLACE_TRIANGLES_MAX);
    // Kéo au tiers gauche, derrière les pierres (à l'est, loin de la caméra), tourné vers elles.
    expect(world.keoAt().x).toBeGreaterThan(station.x + 1);
    // La bonne réponse : la bonne reste seule, les deux autres partent d'un coup ; les pierres restent.
    const won = world.question({ place: 'mangrove', mission: 'living-groups', layout, item: { key: 'b', scene: scene1, answered: true, right: [1], picked: [0] } });
    expect(won.map((l) => l.answer)).toEqual([1]);
    expect(mesh.geometry.getAttribute('position').count / 3).toBeLessThan(SUR_PLACE_TRIANGLES_MAX);
    // La coupe de fin : la scénette reprend son cadrage, Kéo à sa place devant l'habitant, les objets partis.
    world.scenetteEnd(true);
    expect(keo().position.x).toBeCloseTo(keoScenette.at.x, 3);
    expect(keo().position.z).toBeCloseTo(keoScenette.at.z, 3);
    expect(keo().scale.x).toBeCloseTo(keoScenette.scale, 3);
    expect(mesh.visible).toBe(false);
    // La sortie : rien ne reste.
    world.question(null);
    expect(triangles()).toBe(shown);
  });

  it('la question fermée depuis la station (« Quitter ») ramène Kéo devant le lieu par la même coupe que le bilan', () => {
    world.question({ place: 'mangrove', mission: 'living-groups', layout, item: { key: 'a', scene: { kind: 'column' }, answered: false, right: [0], picked: [] } });
    const station = surPlaceStation('mangrove')!;
    world.walkTo(station, () => {});
    world.question({ place: 'mangrove', mission: 'living-groups', layout, item: { key: 'b', scene: scene1, answered: false, right: [], picked: [] } });
    expect(Math.hypot(world.keoAt().x - station.x, world.keoAt().z - station.z)).toBeLessThan(9);
    world.question(null);
    const fromStation = world.keoAt();
    expect(Math.hypot(fromStation.x - station.x, fromStation.z - station.z)).toBeGreaterThan(8);
    // Là même où une question de la scénette le laisse en sortant.
    world.question({ place: 'mangrove', mission: 'living-groups', layout, item: { key: 'a', scene: { kind: 'column' }, answered: false, right: [0], picked: [] } });
    world.question(null);
    expect(fromStation).toEqual(world.keoAt());
  });

  it('une marche arrêtée en chemin (la question fermée) ne prévient plus la page', () => {
    const done = vi.fn();
    world.walkTo(null, done);
    expect(done).not.toHaveBeenCalled();
  });
});
