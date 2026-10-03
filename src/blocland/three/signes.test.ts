// Le signe de la créature dans la scène 3D (GD-4, étape 1), sans WebGL : le geste une fois à l'arrivée de la caméra sur
// l'île, l'icône ensuite, un seul appel de dessin pour toutes, rien sur la Carte, et rien que l'icône avec « Réduire les
// animations ».
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { GESTE_DU_SIGNE } from '../world/signe';
import type { Derniers, Instant, Monde } from './partie';
import type { Personnages } from './personnages';
import { HABILLAGES } from '../habillage';
import { BLOCKS } from '../biomes';
import { shade } from '../Voxel';
import { creerSignes, dessinerLaCase } from './signes';

const FORET: BiomeId = 'french-6e-phonology';
const MINE: BiomeId = 'french-6e-letter-confusion';

function scene() {
  // jsdom ne dessine pas dans un canvas : la texture reste vide, le reste se vérifie.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const monde = { scene: new THREE.Scene(), habillage: HABILLAGES.blocland } as unknown as Monde;
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
  const instant = { now: 0, marche: false, traversee: null, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } } as Instant;
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

it('dans Blocland, une plaque carrée aux coins presque droits ; dans Archipéo, le disque', () => {
  const traceur = () => {
    const appels: string[] = [];
    const ctx = new Proxy({} as Record<string, unknown>, {
      get: (cible, nom: string) => cible[nom] ?? ((...args: unknown[]) => void appels.push(`${nom}:${args.join(',')}`)),
      set: (cible, nom: string, valeur) => ((cible[nom] = valeur), true),
    }) as unknown as CanvasRenderingContext2D;
    return { ctx, appels };
  };
  expect(HABILLAGES.blocland.signe).toBe('plaque');
  expect(HABILLAGES.archipeo.signe).toBe('disque');
  const plaque = traceur();
  dessinerLaCase(plaque.ctx, 0, { icone: 'tree' }, 'plaque');
  // Quatre côtés droits, quatre petits coins (rayon de 6 sur une case de 128), aucun cercle.
  expect(plaque.appels.filter((a) => a.startsWith('lineTo'))).toHaveLength(4);
  const coins = plaque.appels.filter((a) => a.startsWith('arcTo'));
  expect(coins).toHaveLength(4);
  expect(coins.every((a) => a.endsWith(',6'))).toBe(true);
  expect(plaque.appels.some((a) => a.startsWith('arc:'))).toBe(false);
  const disque = traceur();
  dessinerLaCase(disque.ctx, 0, { icone: 'tree' }, 'disque');
  expect(disque.appels.some((a) => a.startsWith('arc:'))).toBe(true);
  expect(disque.appels.some((a) => a.startsWith('arcTo'))).toBe(false);
});

it('une commande (GD-7) : la même plaque, avec le cube du bloc demandé aux couleurs de Mes blocs, cerné de sombre', () => {
  const remplis: string[] = [];
  const traits: number[] = [];
  const appels: string[] = [];
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (cible, nom: string) => {
      if (nom === 'fill') return () => remplis.push(String(cible.fillStyle));
      if (nom === 'stroke') return () => traits.push(Number(cible.lineWidth));
      return cible[nom] ?? ((...args: unknown[]) => void appels.push(`${nom}:${args.join(',')}`));
    },
    set: (cible, nom: string, valeur) => ((cible[nom] = valeur), true),
  }) as unknown as CanvasRenderingContext2D;
  const brique = BLOCKS['maths-6e-calculation'];
  dessinerLaCase(ctx, 0, { bloc: 'maths-6e-calculation' }, 'plaque');
  // La plaque (son fond clair), puis le dessus, la face gauche et la face droite plus sombre du cube : celles de BlockIcon.
  expect(remplis).toEqual(['#fff6e0', brique.top ?? shade(brique.side, 0.16), brique.side, shade(brique.side, -0.18)]);
  // Le cadre de la plaque, le contour du cube, ses arêtes intérieures.
  expect(traits).toEqual([6, 5, 3]);
  // Les mêmes quatre coins presque droits que la plaque des révisions.
  expect(appels.filter((a) => a.startsWith('arcTo'))).toHaveLength(4);
});

it('une révision et une commande ont chacune leur case, dans le même maillage', () => {
  const { signes, monde } = scene();
  signes.poser([
    { id: FORET, icone: 'blocks', bloc: 'maths-6e-calculation' },
    { id: MINE, icone: 'blocks' },
  ]);
  signes.animer!(0, 0, true);
  expect(signes.maillage.geometry.drawRange.count).toBe(12);
  const uv = signes.maillage.geometry.getAttribute('uv');
  // Deux cases différentes de la texture : l'image du bloc n'est pas l'icône des blocs.
  expect(uv.getX(0)).not.toBe(uv.getX(4));
  expect(monde.scene.children.filter((o) => o instanceof THREE.Mesh)).toHaveLength(1);
});

it('les plaques sont des obstacles pour les étiquettes ; leur version ne change qu’à l’arrivée d’une plaque', () => {
  const { signes, derniers, instant } = scene();
  signes.poser([{ id: FORET, icone: 'tree' }]);
  signes.animer!(0, 0, true);
  const v = signes.version;
  const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.5, 1000);
  camera.position.set(0, 20, -30);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const [b] = signes.boites(camera, 1024, 768);
  expect(b.w).toBe(48);
  expect(b.x).toBeCloseTo(512, 0);
  // La plaque se pose sur la tête : son bas à l'écran est au-dessus de la tête.
  const tete = new THREE.Vector3(0, 3, 0).project(camera);
  expect(b.y + b.h / 2).toBeLessThan(((1 - tete.y) / 2) * 768);
  // Les images suivantes, la caméra qui vole, la Carte : rien ne change (les étiquettes ne se replacent pas en vol).
  signes.animer!(0, 0, true);
  instant.now = 5000;
  camera.position.set(10, 30, -20);
  signes.animer!(0, 0, false);
  derniers.current.carte = true;
  signes.animer!(0, 0, true);
  expect(signes.version).toBe(v);
  // Une plaque qui s'en va (une commande livrée) : rien ne bouge non plus, et elle n'est plus un obstacle.
  signes.poser([]);
  expect(signes.version).toBe(v);
  expect(signes.boites(camera, 1024, 768)).toEqual([]);
  // Une plaque de plus : les étiquettes se replacent.
  signes.poser([{ id: MINE, icone: 'pickaxe' }]);
  expect(signes.version).not.toBe(v);
  // Celle qui attend la fin du geste compte déjà (l'étiquette ne bouge pas quand elle apparaît).
  expect(signes.boites(camera, 1024, 768)).toHaveLength(1);
});

it('la créature d’une plaque est aussi un obstacle : aucune étiquette ne se pose sur elle', () => {
  const { signes } = scene();
  const corps = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 2));
  corps.position.set(0, 1.5, 0);
  corps.userData.creature = FORET;
  const creatures = new THREE.Group().add(corps);
  creatures.updateMatrixWorld(true);
  const { signes: avecCorps } = (() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const monde = { scene: new THREE.Scene(), habillage: HABILLAGES.blocland } as unknown as Monde;
    const personnages = { creatures, faireSigne: vi.fn(), teteDe: (_id: BiomeId, out: THREE.Vector3) => (out.set(0, 3, 0), true) } as unknown as Personnages;
    const derniers = { current: { carte: false, focus: { island: null, seq: 1 } } as unknown as Derniers };
    const instant = { now: 0, carte: false, navigue: null } as unknown as Instant;
    return { signes: creerSignes(monde, { clientHeight: 768 } as HTMLElement, new THREE.PerspectiveCamera(), personnages, derniers, instant) };
  })();
  avecCorps.poser([{ id: FORET, icone: 'tree' }]);
  const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.5, 1000);
  camera.position.set(0, 20, -30);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const [plaque, corpsALEcran] = avecCorps.boites(camera, 1024, 768);
  expect(plaque.w).toBe(48);
  expect(corpsALEcran.x).toBeCloseTo(512, 0);
  // Sous la plaque, et plus haut qu'une case.
  expect(corpsALEcran.y).toBeGreaterThan(plaque.y);
  expect(corpsALEcran.h).toBeGreaterThan(40);
  avecCorps.dispose!();
  signes.dispose!();
});

it('la hauteur de la vue ne se lit pas dans le DOM image par image : le redimensionnement la donne', () => {
  const { signes, instant } = scene();
  signes.poser([{ id: FORET, icone: 'tree' }]);
  instant.now = 1;
  signes.animer!(0, 0, true);
  const taille = () => {
    const p = signes.maillage.geometry.getAttribute('position');
    return Math.abs(p.getX(1) - p.getX(0)) + Math.abs(p.getZ(1) - p.getZ(0));
  };
  const avant = taille();
  // La vue deux fois plus haute : la plaque garde ses 40 px, donc deux fois plus petite dans le monde.
  signes.redimensionner(768 * 2);
  signes.animer!(0, 0, true);
  expect(taille()).toBeCloseTo(avant / 2, 5);
});
