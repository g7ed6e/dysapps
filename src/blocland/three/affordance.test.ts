// Les zones de toucher des objets dans la scène 3D de Blocland, sans WebGL : une borne ou un Gardien petits à l'écran
// se touchent dans un carré de 48 pixels autour d'eux, les autres objets directement ; rien sur la Carte ni pendant le
// voyage ; rien dans Archipéo. Les bulles sont dessinées par ./signes.ts (signes.test.ts).
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { HABILLAGES, type Habillage } from '../habillage';
import { cleDeLObjet, SIGNE, signesDesObjets, type EtatDuSigne, type ObjetTouche, type SigneDObjet } from '../world/affordance';
import { guardianPlacements } from '../world/terrain';
import { creerAffordance } from './affordance';
import type { Derniers, Instant, Monde } from './partie';

const FORET: BiomeId = 'french-6e-phonology';

function scene(habillage: Habillage = HABILLAGES.blocland) {
  const monde = { scene: new THREE.Scene(), habillage } as unknown as Monde;
  const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.5, 1000);
  camera.position.set(0, 20, -30);
  camera.lookAt(0, 0, 0);
  const derniers = { current: { carte: false, focus: { island: FORET, seq: 1 }, home: FORET, forceDay: false, whalePass: null, sons: false } as Derniers };
  const instant = { now: 0, marche: false, traversee: null, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } } as Instant;
  const affordance = creerAffordance(monde, derniers, instant);
  return { monde, camera, affordance, derniers, instant };
}

/** Un objet d'un bloc sur le sol, en (x, 0). */
const objet = (o: ObjetTouche, etat: EtatDuSigne, x: number): SigneDObjet => ({
  cle: cleDeLObjet(o),
  objet: o,
  etat,
  x,
  y: 0,
  z: 3,
  iles: [FORET],
  boite: { min: { x: x - 0.5, y: -0.5, z: 1 }, max: { x: x + 0.5, y: 0.5, z: 2.8 } },
});

const OBJETS = [
  objet({ genre: 'borne', id: `${FORET}:a` }, 'aFaire', -4),
  objet({ genre: 'borne', id: `${FORET}:b` }, 'pasEncore', -2),
  objet({ genre: 'gardien', id: FORET }, 'aFaire', 0),
  objet({ genre: 'lieu', id: 'school', ile: FORET }, 'lieu', 4),
];

it('une borne ou un Gardien petits à l’écran ont leur zone de 48 pixels, à faire ou pas ; un lieu se touche directement', () => {
  const { affordance, camera } = scene();
  affordance.poser(OBJETS);
  affordance.animer!(0, 0.016, false);
  const zones = affordance.zones(camera, 1024, 768);
  expect(zones.map((z) => cleDeLObjet(z.objet))).toEqual([`borne:${FORET}:a`, `borne:${FORET}:b`, `gardien:${FORET}`]);
  for (const { zone } of zones) {
    expect(zone.w).toBeGreaterThanOrEqual(SIGNE.zonePx);
    expect(zone.h).toBeGreaterThanOrEqual(SIGNE.zonePx);
    expect(zone.distance).toBeGreaterThan(0);
  }
  // De tout près, une borne fait plus de 48 pixels : elle se touche directement, sans zone.
  camera.position.set(-4, 3, -3);
  camera.lookAt(-4, 2, 0);
  expect(affordance.zones(camera, 1024, 768).some((z) => cleDeLObjet(z.objet) === `borne:${FORET}:a`)).toBe(false);
  // Rien n'est dessiné ici : les bulles sont dans ./signes.ts.
  expect(scene().monde.scene.children).toHaveLength(0);
});

it('aucune zone sur la Carte ni pendant le voyage', () => {
  const { affordance, derniers, instant, camera } = scene();
  affordance.poser(OBJETS);
  derniers.current.carte = true;
  affordance.animer!(1, 0.016, false);
  expect(affordance.zones(camera, 1024, 768)).toEqual([]);
  derniers.current.carte = false;
  instant.navigue = { at: new THREE.Vector3(), k: 0.5, stage: 1 };
  affordance.animer!(1, 0.016, false);
  expect(affordance.zones(camera, 1024, 768)).toEqual([]);
});

it('Archipéo garde ses losanges (./bornes.ts) : aucune zone ici', () => {
  const { affordance, camera } = scene(HABILLAGES.archipeo);
  affordance.poser(OBJETS);
  affordance.animer?.(1, 0.016, false);
  expect(affordance.zones(camera, 1024, 768)).toEqual([]);
});

it('le Golem de roche : un Gardien à faire, sa bulle au-dessus de sa tête', () => {
  const ile: BiomeId = 'french-6e-letter-confusion';
  const golem = guardianPlacements('6e', {}, ['french-6e-phonology-french-6e-letter-confusion'], true).find((g) => g.id === ile)!;
  const [s] = signesDesObjets({ cubes: [], creatures: [golem] });
  expect(s).toMatchObject({ etat: 'aFaire', objet: { genre: 'gardien', id: ile } });
  expect(s.z).toBeCloseTo(golem.origin.z + Math.max(...golem.cubes.map((c) => c.z)) + 1 + SIGNE.auDessus, 6);
});
