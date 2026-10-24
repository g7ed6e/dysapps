// La scène du monde ouvert du 5e (GD-22, lot 2) : la scène vraie, sans moteur WebGL sous jsdom (un `WebGLRenderer`
// simulé, qui ne dessine rien). Elle lit le plan du 5e : rien de ce qui n'est qu'au 6e (les Détours, les scénettes des
// lieux) ne s'y appelle, aucune erreur `sixthPlace` ; la brume des failles s'y montre dans le monde, jamais sur la
// Carte ; la Carte a le point « port » de la Lisière (lot 4), et met « en haut » aux lieux du plateau ; tout le décor prend le
// brouillard, sauf le ciel, qui est le lointain lui-même, et la silhouette de Kéo, qui doit se lire au loin.
import * as THREE from 'three';
import { levelWorld } from '../../world/continu/levelWorld';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { linkedLands } from '../../world/continu/lands';
import { placeRecord, planFor } from '../../world/continu/levelPlan';
import { riftMistFacets } from '../../world/continu/mist5e';
import { PORT_WORST } from '../../world/continu/port';
import { questionLayout } from '../../world/continu/questionScene';
import { scenetteLayout } from '../../world/continu/scenette';
import { createOpenWorld, type MapSpotOnScreen, type OpenWorld, type OpenWorldOptions } from './scene';

const made = vi.hoisted(() => ({ scenes: [] as THREE.Scene[], overrides: [] as THREE.Material[] }));
vi.mock('three', async (original) => {
  const m = await original<typeof import('three')>();
  class WebGLRenderer {
    domElement = document.createElement('canvas');
    info = { render: { calls: 0, triangles: 0 }, memory: {}, autoReset: true, reset() {} };
    shadowMap = {};
    setPixelRatio() {}
    setSize() {}
    // Le matériau de remplacement d'un passage (la silhouette de Kéo, `drawWithSilhouette`), relevé.
    render(scene: THREE.Scene) {
      if (scene.overrideMaterial) made.overrides.push(scene.overrideMaterial);
    }
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
const [W, H] = [1024, 768];
let world: OpenWorld;
let scene: THREE.Scene;
let spots: readonly MapSpotOnScreen[] = [];
const arrived: (string | null)[] = [];

/** Le maillage de la brume des failles : celui qui porte ses triangles. */
const riftMesh = (): THREE.Mesh | undefined => {
  const n = riftMistFacets().triangles;
  let found: THREE.Mesh | undefined;
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh && (o.geometry.getAttribute('position')?.count ?? 0) / 3 === n) found = o;
  });
  return found;
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
    plan: PLAN,
    // Un départ hors d'un lieu (le quai de l'Escale au 6e) : au 5e, le quai de la Lisière.
    start: 'quai',
    reduceMotion: true,
    meter: { show: false, expose: false },
    onArrive: (p) => void arrived.push(p),
    onDepart: noop,
    onMark: noop,
    onLocks: noop,
    onMapPlaces: (s) => {
      spots = s;
    },
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

describe('La scène du 5e', () => {
  it('se fait sans rien du 6e : les terres, les lieux, la marque, la Nef et les Détours n’y appellent aucun lieu du 6e', () => {
    expect(() => {
      world.setLands({ closed: linkedLands(PLAN) });
      world.setMark('hameau');
      world.setNef(2);
      world.setDetours(['braise-herons'], []);
      world.setSigns([]);
      world.setPlaces({ built: placeRecord(PLAN, () => []), traces: placeRecord(PLAN, () => []), amenagements: placeRecord(PLAN, () => []) });
    }).not.toThrow();
    expect(world.portAt(W / 2, H / 2)).toBeNull();
  });

  it('la Lisière et le dirigeable (lot 4) : la place pavoisée, la Nef sur son ber, le départ fini d’un coup en « Réduire les animations »', () => {
    expect(() => {
      world.setPort(PORT_WORST);
      world.goToPort('french');
      world.goToPort('quai');
      world.setNef(1);
      world.setNef(3);
    }).not.toThrow();
    const done = vi.fn();
    world.departNef(done);
    expect(done).toHaveBeenCalledTimes(1);
    expect(() => world.setNef(4)).not.toThrow();
  });

  it('Kéo va devant un lieu du bas, et s’arrête au pied de la cabine pour un lieu du haut fermé', () => {
    world.goTo('hameau', true);
    expect(arrived.at(-1)).toBe('hameau');
    expect(() => world.goTo('semaphore', true)).not.toThrow();
  });

  it('une question dans un lieu du 5e sans scénette ne montre rien dans la scène (l’écran habituel la joue)', () => {
    const layout = scenetteLayout({ count: 3, column: true }, W, H, questionLayout({ count: 3 }, W, H));
    expect(world.question({ place: 'oracle', mission: 'essai', layout, item: { key: 'essai', scene: { kind: 'column' }, answered: false, right: [0], picked: [] } })).toEqual([]);
    world.question(null);
  });

  it('la brume des failles se montre dans le monde, jamais sur la Carte', () => {
    const rift = riftMesh();
    expect(rift).toBeDefined();
    expect(rift!.visible).toBe(true);
    world.map(PLAN.places.map((p) => p.id));
    expect(rift!.visible).toBe(false);
    world.map(null);
    expect(rift!.visible).toBe(true);
  });

  it('la Carte : le point « port » de la Lisière, un triangle « en haut » à chaque lieu du plateau', () => {
    // La Carte fermée donne ses points une dernière fois (cachés) : la liste entière.
    world.map(PLAN.places.map((p) => p.id));
    world.map(null);
    expect(spots.length).toBeGreaterThan(0);
    expect(spots.some((s) => s.id === 'port')).toBe(true);
    for (const s of spots) if (PLAN.places.some((p) => p.id === s.id)) expect(Boolean(s.up), s.id).toBe(PLAN.upper.includes(s.id as never));
    expect(spots.find((s) => s.id === 'keo')).toBeDefined();
  });

  it('le décor du 5e a sa lumière par la hauteur : chaque ligne trouve sa place dans le shader de Three.js', () => {
    let land: THREE.MeshLambertMaterial | undefined;
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshLambertMaterial && o.material.customProgramCacheKey() === 'archipeo-hauteur') land = o.material;
    });
    expect(land).toBeDefined();
    const shader = { vertexShader: THREE.ShaderLib.lambert.vertexShader, fragmentShader: THREE.ShaderLib.lambert.fragmentShader, uniforms: {} } as unknown as THREE.WebGLProgramParametersWithUniforms;
    land!.onBeforeCompile(shader, {} as THREE.WebGLRenderer);
    expect(shader.vertexShader).toContain('vHeight = ( modelMatrix * vec4( transformed, 1.0 ) ).y;');
    expect(shader.fragmentShader).toContain('reflectedLight.directDiffuse *= mix( heightSunLow, 1.0, heightLift );');
    expect(shader.fragmentShader).toContain('mix( 1.0, heightFog.z, smoothstep( heightFog.x, heightFog.y, vHeight ) )');
    expect(shader.fragmentShader).not.toContain('#include <fog_fragment>');
    expect(shader.vertexShader).toContain('lanternColor');
    // Les couleurs peu voilées (lot 4, retouche) : la lumière du Phare et sa tour, le mur et le panache, une ligne chacune ;
    // le panache, sans ombre (troisième passe), garde sa couleur ; la vapeur des Fumerolles aussi, voilée comme le reste
    // (`thinFogK = 1.00`, retouche 2 du lot 9). Reconnues par sommet depuis la mesure iPad du 24 octobre 2026 : aucune
    // comparaison de couleur ne reste dans le shader des pixels.
    const thin = levelWorld('5e').thinFog;
    expect(shader.vertexShader.match(/vThinFogK = [01]\.\d\d;/g)).toHaveLength(thin.length);
    expect(shader.vertexShader).toContain('vThinFogK = 0.12; }');
    expect(shader.vertexShader.match(/vThinFogK = [01]\.\d\d; vUnlit = 1\.0; \}/g)).toHaveLength(thin.filter((t) => t.unlit).length);
    // La lampe du 6e remise à zéro d'abord, la lanterne et les couleurs peu voilées ensuite.
    expect(shader.vertexShader.indexOf('vUnlit = 0.0;')).toBeLessThan(shader.vertexShader.indexOf('vThinFogK = 1.0;'));
    expect(shader.fragmentShader).not.toContain('lessThan');
    expect(shader.fragmentShader).toContain('outgoingLight = mix( outgoingLight, vColor.rgb, vUnlit );');
    expect(shader.fragmentShader).toContain('* thinFogK;');
    expect(shader.fragmentShader.indexOf('float thinFogK = vThinFogK;')).toBeLessThan(shader.fragmentShader.indexOf('* thinFogK;'));
    // La lampe du 6e et la lanterne du 5e, puis le morceau de Three.js, une seule fois.
    expect(shader.fragmentShader.split('#include <opaque_fragment>')).toHaveLength(2);
    expect(Object.keys(shader.uniforms)).toEqual(expect.arrayContaining(['heightLow', 'heightHigh', 'heightSunLow', 'heightTintLow', 'heightFog', 'lanternColor', 'lampColor']));
  });

  it('tout le décor prend le brouillard ; deux exceptions : le ciel, le lointain lui-même, et la silhouette de Kéo', () => {
    const fogless: THREE.Material[] = [];
    scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      for (const m of [o.material].flat() as THREE.Material[]) if ('fog' in m && m.fog === false) fogless.push(m);
    });
    // Dans la scène, le ciel seul : dessiné d'abord, sans profondeur.
    expect(fogless).toHaveLength(1);
    expect(fogless[0].depthTest).toBe(false);
    // L'autre, hors de la scène : la silhouette de Kéo, le matériau qui remplace tous les autres le temps d'un passage
    // (là seulement où le décor passe devant lui) ; sans brouillard, elle dit où il est même au loin. Ce n'est pas un décor.
    expect(made.overrides.length).toBeGreaterThan(0);
    for (const m of made.overrides) {
      expect('fog' in m && m.fog).toBe(false);
      expect(m.depthFunc).toBe(THREE.GreaterDepth);
    }
  });
});
