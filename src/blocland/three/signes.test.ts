// Le signe de la créature dans la scène 3D (GD-4, étape 1), sans WebGL : le geste une fois à l'arrivée de la caméra sur
// l'île, l'icône ensuite, un seul appel de dessin pour toutes, rien sur la Carte, et rien que l'icône avec « Réduire les
// animations ».
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { GESTE_DU_SIGNE } from '../world/signe';
import type { Derniers, Instant, Monde } from './partie';
import type { Personnages } from './personnages';
import { creerSignes } from './signes';

const FORET: BiomeId = 'french-6e-phonology';
const MINE: BiomeId = 'french-6e-letter-confusion';

function scene() {
  // jsdom ne dessine pas dans un canvas : la texture reste vide, le reste se vérifie.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const monde = { scene: new THREE.Scene() } as unknown as Monde;
  const el = { clientHeight: 768 } as HTMLElement;
  const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.5, 1000);
  camera.position.set(0, 20, -30);
  camera.lookAt(0, 0, 0);
  const faireSigne = vi.fn();
  const personnages = {
    faireSigne,
    teteDe: (_id: BiomeId, out: THREE.Vector3) => (out.set(0, 3, 0), true),
  } as unknown as Personnages;
  const derniers = { current: { carte: false, focus: { island: FORET, seq: 1 }, home: null, forceDay: false, whalePass: null, sons: false } as Derniers };
  const instant = { now: 0, marche: false, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } } as Instant;
  const signes = creerSignes(monde, el, camera, personnages, derniers, instant);
  return { monde, signes, faireSigne, derniers, instant };
}

afterEach(() => vi.restoreAllMocks());

it('à l’arrivée sur l’île, un seul geste, puis l’icône ; toutes les icônes en un appel de dessin', () => {
  const { monde, signes, faireSigne, derniers, instant } = scene();
  signes.poser([
    { id: FORET, icone: 'tree' },
    { id: MINE, icone: 'pickaxe' },
  ]);
  instant.now = 1000;
  signes.animer!(0, 0, false);
  expect(faireSigne).toHaveBeenCalledTimes(1);
  expect(faireSigne).toHaveBeenCalledWith(FORET, 1000 + GESTE_DU_SIGNE.attenteMs);
  // Pendant le geste : l'icône de la Forêt attend ; celle de la Mine (pas d'arrivée chez elle) est là.
  expect(signes.maillage.visible).toBe(true);
  expect(signes.maillage.geometry.drawRange.count).toBe(6);
  // Le geste fini : les deux icônes, dans le même maillage.
  instant.now = 1000 + GESTE_DU_SIGNE.attenteMs + GESTE_DU_SIGNE.dureeMs;
  signes.animer!(0, 0, false);
  expect(signes.maillage.geometry.drawRange.count).toBe(12);
  expect(monde.scene.children.filter((o) => o instanceof THREE.Mesh)).toHaveLength(1);
  // Le geste ne se répète pas : la même île cadrée de nouveau, rien de plus.
  derniers.current.focus = { island: FORET, seq: 2 };
  signes.animer!(0, 0, false);
  expect(faireSigne).toHaveBeenCalledTimes(1);
  // L'icône ne se touche pas (c'est la créature qu'on touche).
  const touche: THREE.Intersection[] = [];
  signes.maillage.raycast(new THREE.Raycaster(), touche);
  expect(touche).toHaveLength(0);
});

it('rien sur la Carte', () => {
  const { signes, faireSigne, derniers } = scene();
  derniers.current.carte = true;
  signes.poser([{ id: FORET, icone: 'tree' }]);
  signes.animer!(0, 0, false);
  expect(faireSigne).not.toHaveBeenCalled();
  expect(signes.maillage.visible).toBe(false);
});

it('avec « Réduire les animations » : pas de geste, l’icône tout de suite', () => {
  const { signes, faireSigne } = scene();
  signes.poser([{ id: FORET, icone: 'tree' }]);
  signes.animer!(0, 0, true);
  expect(faireSigne).not.toHaveBeenCalled();
  expect(signes.maillage.visible).toBe(true);
  expect(signes.maillage.geometry.drawRange.count).toBe(6);
});

it('sans révision due, rien n’est dessiné, et tout se libère', () => {
  const { monde, signes } = scene();
  signes.poser([]);
  signes.animer!(0, 0, false);
  expect(signes.maillage.visible).toBe(false);
  const geometrie = vi.spyOn(signes.maillage.geometry, 'dispose');
  signes.dispose();
  expect(geometrie).toHaveBeenCalled();
  expect(monde.scene.children).toHaveLength(0);
});
