// Le monde qui répond dans la scène (GD-28, lot 4 de GD-27) : les objets posés entrent dans le maillage de l'item (aucun
// appel de plus) ; un cran de plus pose l'objet suivant (d'un coup avec « Réduire les animations ») ; un compte qui
// retombe (« Rejouer ») ou une autre mission efface tout ; la sortie de la scénette ne laisse rien. La scène vraie,
// sans moteur WebGL sous jsdom.
import * as THREE from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { planFor } from '../../world/continu/levelPlan';
import { questionLayout } from '../../world/continu/questionScene';
import { registerResponder, respondPlaced } from '../../world/continu/respond';
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

// Un lieu d'essai qui répond : un cube par bonne réponse, au-dessus de la scène des Ruines.
registerResponder('ruins', () => ({
  spot: (i) => ({ at: { x: i, y: 3, z: 0 }, from: { x: i, y: 5, z: 0 }, arc: 0.3 }),
  object: (b) => b.box({ x: 0, y: 0, z: 0 }, [0.3, 0.3, 0.3], 0x806040),
}));

const [W, H] = [1024, 768];
let world: OpenWorld;
let scene: THREE.Scene;

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
    start: 'ruins',
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

describe('Le monde qui répond, dans la scène', () => {
  const layout = scenetteLayout({ count: 3, column: true }, W, H, questionLayout({ count: 3 }, W, H));
  const ask = (responded: number, mission = 'essai', answered = true) =>
    world.question({ place: 'ruins', mission, layout, item: { key: 'essai', scene: { kind: 'column' }, answered, right: [0], picked: [] }, responded });
  const one = respondPlaced('ruins', 1).triangles;

  it('pose un objet par bonne réponse dans le maillage de l’item, les retire quand le compte retombe, rien à la sortie', () => {
    const before = triangles();
    ask(0, 'essai', false);
    const base = triangles();
    expect(base).toBeGreaterThan(before);
    // Deux bonnes réponses d'un coup (une partie reprise au vol) : deux objets posés, sans mouvement (« Réduire les animations »).
    ask(2);
    expect(triangles()).toBe(base + 2 * one);
    // Un cran de plus : un objet de plus, posé d'un coup.
    ask(3);
    expect(triangles()).toBe(base + 3 * one);
    // Le même compte : rien ne bouge.
    ask(3);
    expect(triangles()).toBe(base + 3 * one);
    // Au-delà de huit : huit au plus.
    ask(20);
    expect(triangles()).toBe(base + 8 * one);
    // « Rejouer » : le compte retombe, tout s'efface.
    ask(0, 'essai', false);
    expect(triangles()).toBe(base);
    // Une autre mission du lieu repart de rien.
    ask(2);
    ask(1, 'autre');
    expect(triangles()).toBe(base + one);
    // La sortie de la scénette ne laisse rien.
    world.question(null);
    expect(triangles()).toBe(before);
  });

  it('sans « Réduire les animations », l’objet vole dans le maillage de la réaction, puis se pose d’un coup à l’item suivant ; un cadrage refait pendant le vol ne le fait pas tomber', () => {
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
    const moving = createOpenWorld(host, {
      plan: planFor('6e'),
      start: 'ruins',
      reduceMotion: false,
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
    const s = made.scenes[before];
    // Le maillage de l'item (caché le temps de la descente de la caméra, que le test ne joue pas : ses triangles comptent
    // quand même) et celui de la réaction (visible et en l'air quand l'objet vole).
    const tri = (m: THREE.Mesh) => {
      const g = m.geometry as THREE.BufferGeometry;
      return (g.index ? g.index.count : (g.getAttribute('position')?.count ?? 0)) / 3;
    };
    const shown = (): { item: number; flying: boolean } => {
      const item = s.getObjectByName('item') as THREE.Mesh;
      const reaction = s.getObjectByName('reaction') as THREE.Mesh;
      return { item: tri(item), flying: reaction.visible && tri(reaction) === one && reaction.position.y > 3.5 };
    };
    const item = (key: string, answered: boolean) => ({ key, scene: { kind: 'column' as const }, answered, right: [0], picked: [] });
    try {
      moving.question({ place: 'ruins', mission: 'essai', layout, item: item('a', false), responded: 0 });
      const base = shown().item;
      // « Valider », juste : l'objet part d'en haut (y = 5) dans le maillage de la réaction ; rien n'est encore posé.
      moving.question({ place: 'ruins', mission: 'essai', layout, item: item('a', true), responded: 1 });
      expect(shown()).toEqual({ item: base, flying: true });
      // Le cadrage refait pendant le vol (les réponses sorties) : l'objet vole toujours.
      moving.question({ place: 'ruins', mission: 'essai', layout, item: item('a', true), responded: 1, answersOut: true });
      expect(shown()).toEqual({ item: base, flying: true });
      // « Suivant » avant la fin (un item de même scène, par sa clé) : l'objet se pose d'un coup dans le maillage de l'item ; plus rien ne vole.
      moving.question({ place: 'ruins', mission: 'essai', layout, item: item('b', false), responded: 1 });
      expect(shown()).toEqual({ item: base + one, flying: false });
      // Une deuxième bonne réponse : le deuxième objet vole, le premier reste posé.
      moving.question({ place: 'ruins', mission: 'essai', layout, item: item('b', true), responded: 2 });
      expect(shown()).toEqual({ item: base + one, flying: true });
      // La sortie pendant un vol : plus rien, ni posé ni en vol.
      moving.question(null);
      expect(shown().flying).toBe(false);
      expect((s.getObjectByName('item') as THREE.Mesh).visible).toBe(false);
    } finally {
      moving.dispose();
    }
  });

  it('un lieu sans objet ne montre rien de plus, quel que soit le compte', () => {
    const before = triangles();
    const item = { key: 'essai', scene: { kind: 'cloches' as const }, answered: true, right: [0], picked: [] };
    world.question({ place: 'phare', mission: 'essai', layout, item, responded: 0 });
    const base = triangles();
    world.question({ place: 'phare', mission: 'essai', layout, item, responded: 3 });
    expect(triangles()).toBe(base);
    world.question(null);
    expect(triangles()).toBe(before);
  });
});
