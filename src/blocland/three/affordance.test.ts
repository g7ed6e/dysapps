// Les signes des objets touchables dans la scène 3D de Blocland, sans WebGL : un maillage instancié par état, seuls les
// losanges d'or de l'île du bonhomme bougent (en phase), le saut au toucher, rien sur la Carte, rien qui bouge avec le
// mouvement réduit de l'appareil, la zone de toucher de 48 pixels, et rien dans Archipéo.
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { HABILLAGES, type Habillage } from '../habillage';
import { COTE_DU_SIGNE, cleDeLObjet, SIGNE, type EtatDuSigne, type ObjetTouche, type SigneDObjet } from '../world/affordance';
import { creerAffordance } from './affordance';
import type { Derniers, Instant, Monde } from './partie';

const FORET: BiomeId = 'french-6e-phonology';
const MINE: BiomeId = 'french-6e-letter-confusion';

function scene(habillage: Habillage = HABILLAGES.blocland) {
  const monde = { scene: new THREE.Scene(), habillage } as unknown as Monde;
  const el = { clientHeight: 768 } as HTMLElement;
  const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.5, 1000);
  camera.position.set(0, 20, -30);
  camera.lookAt(0, 0, 0);
  const derniers = { current: { carte: false, focus: { island: FORET, seq: 1 }, home: FORET, forceDay: false, whalePass: null, sons: false } as Derniers };
  const instant = { now: 0, marche: false, traversee: null, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } } as Instant;
  const affordance = creerAffordance(monde, el, camera, derniers, instant);
  return { monde, camera, affordance, derniers, instant };
}

/** Un signe posé à (x, 4, 0), au-dessus d'un objet d'un bloc sur le sol. */
const signe = (objet: ObjetTouche, etat: EtatDuSigne, ile: BiomeId, x: number): SigneDObjet => ({
  cle: cleDeLObjet(objet),
  objet,
  etat,
  x,
  y: 0,
  z: 4,
  iles: [ile],
  boite: { min: { x: x - 0.5, y: -0.5, z: 1 }, max: { x: x + 0.5, y: 0.5, z: 2.8 } },
});

const SIGNES = [
  signe({ genre: 'borne', id: `${FORET}:a` }, 'aFaire', FORET, -4),
  signe({ genre: 'borne', id: `${FORET}:b` }, 'aFaire', FORET, -2),
  signe({ genre: 'borne', id: `${MINE}:a` }, 'aFaire', MINE, 0),
  signe({ genre: 'borne', id: `${MINE}:b` }, 'pasEncore', MINE, 2),
  signe({ genre: 'lieu', id: 'school', ile: FORET }, 'lieu', FORET, 4),
];

/** La position et la rotation de chaque instance d'un maillage. */
function poses(m: THREE.InstancedMesh | null) {
  const out: { p: THREE.Vector3; q: THREE.Quaternion; s: THREE.Vector3 }[] = [];
  const mat = new THREE.Matrix4();
  for (let i = 0; i < (m?.count ?? 0); i++) {
    m!.getMatrixAt(i, mat);
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    mat.decompose(p, q, s);
    out.push({ p, q, s });
  }
  return out;
}

it('un maillage instancié par état : trois appels de dessin au plus, quel que soit le nombre de signes', () => {
  const { monde, affordance } = scene();
  affordance.poser(SIGNES);
  const maillages = monde.scene.children.filter((o) => o instanceof THREE.InstancedMesh) as THREE.InstancedMesh[];
  expect(maillages).toHaveLength(3);
  expect(affordance.maillages.aFaire?.count).toBe(3);
  expect(affordance.maillages.pasEncore?.count).toBe(1);
  expect(affordance.maillages.lieu?.count).toBe(1);
  // Les arêtes en couleurs de sommets, dans la même géométrie.
  expect(affordance.maillages.lieu?.geometry.getAttribute('color')).toBeDefined();
  // Reposés : les anciens maillages s'en vont.
  affordance.poser(SIGNES.slice(0, 2));
  expect(monde.scene.children.filter((o) => o instanceof THREE.InstancedMesh)).toHaveLength(1);
  affordance.dispose();
  expect(monde.scene.children).toHaveLength(0);
});

it('seuls les losanges d’or de l’île du bonhomme flottent et tournent, tous en phase ; ailleurs, et la pierre et le crème, figés', () => {
  const { affordance } = scene();
  affordance.poser(SIGNES);
  affordance.animer!(0.75, 0.016, false);
  const [a, b, mine] = poses(affordance.maillages.aFaire);
  // Sur la Forêt : en haut de leur flottement à 0,75 s, les deux en phase, tournés d'un huitième de tour.
  expect(a.p.y).toBeCloseTo(4 + SIGNE.flotte.amplitude, 6);
  expect(b.p.y).toBeCloseTo(a.p.y, 9);
  expect(a.q.angleTo(b.q)).toBeCloseTo(0, 6);
  expect(a.q.angleTo(new THREE.Quaternion())).toBeCloseTo(Math.PI / 4, 6);
  // Sur la Mine : immobile, sans tour.
  expect(mine.p.y).toBe(4);
  expect(mine.q.angleTo(new THREE.Quaternion())).toBeCloseTo(0, 6);
  const [pierre] = poses(affordance.maillages.pasEncore);
  const [creme] = poses(affordance.maillages.lieu);
  affordance.animer!(2.1, 0.016, false);
  expect(poses(affordance.maillages.pasEncore)[0].p).toEqual(pierre.p);
  expect(poses(affordance.maillages.lieu)[0].p).toEqual(creme.p);
});

it('avec le mouvement réduit de l’appareil, aucun signe ne bouge ni ne saute', () => {
  const { affordance, instant } = scene();
  affordance.poser(SIGNES);
  affordance.animer!(0.75, 0.016, true);
  const avant = JSON.stringify(poses(affordance.maillages.aFaire));
  affordance.sauter(SIGNES[0].cle);
  instant.now = SIGNE.saut.monteeMs;
  for (const t of [1.3, 2.2, 5]) {
    affordance.animer!(t, 0.016, true);
    expect(JSON.stringify(poses(affordance.maillages.aFaire)), `t=${t}`).toBe(avant);
  }
  expect(poses(affordance.maillages.aFaire).every((x) => x.p.y === 4)).toBe(true);
});

it('touché, le signe fait son petit saut (0,2 bloc), puis reprend sa place ; un objet sans signe ne fait rien', () => {
  const { affordance, instant, derniers } = scene();
  derniers.current.home = null;
  affordance.poser(SIGNES);
  expect(affordance.sauter('borne:inconnue')).toBe(false);
  instant.now = 1000;
  expect(affordance.sauter(SIGNES[4].cle)).toBe(true);
  instant.now = 1000 + SIGNE.saut.monteeMs;
  affordance.animer!(1, 0.016, false);
  expect(poses(affordance.maillages.lieu)[0].p.y).toBeCloseTo(4 + SIGNE.saut.hauteur, 6);
  instant.now = 1000 + SIGNE.saut.monteeMs + SIGNE.saut.descenteMs;
  affordance.animer!(1.2, 0.016, false);
  expect(poses(affordance.maillages.lieu)[0].p.y).toBe(4);
});

it('rien sur la Carte ni pendant le voyage, et aucune zone de toucher', () => {
  const { affordance, derniers, instant, camera } = scene();
  affordance.poser(SIGNES);
  affordance.animer!(1, 0.016, false);
  expect(affordance.maillages.aFaire?.visible).toBe(true);
  expect(affordance.zones(camera, 1024, 768).length).toBe(SIGNES.length);
  derniers.current.carte = true;
  affordance.animer!(1, 0.016, false);
  expect(affordance.maillages.aFaire?.visible).toBe(false);
  expect(affordance.zones(camera, 1024, 768)).toEqual([]);
  derniers.current.carte = false;
  instant.navigue = { at: new THREE.Vector3(), k: 0.5, stage: 1 };
  affordance.animer!(1, 0.016, false);
  expect(affordance.maillages.lieu?.visible).toBe(false);
});

it('vu de loin, un cube grossit pour garder 14 pixels à l’écran ; ses zones de toucher font au moins 48 pixels', () => {
  const { affordance, camera } = scene();
  affordance.poser(SIGNES);
  affordance.animer!(0, 0.016, true);
  expect(poses(affordance.maillages.pasEncore)[0].s.x).toBe(1);
  camera.position.set(0, 400, -600);
  camera.lookAt(0, 0, 0);
  affordance.animer!(0, 0.016, true);
  const { p, s } = poses(affordance.maillages.pasEncore)[0];
  expect(s.x).toBeGreaterThan(1);
  const profondeur = p.clone().applyMatrix4(camera.matrixWorldInverse).z * -1;
  const pxParUnite = 768 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  expect((COTE_DU_SIGNE.pasEncore * s.x * pxParUnite) / profondeur).toBeCloseTo(SIGNE.minPx, 3);
  for (const { zone } of affordance.zones(camera, 1024, 768)) {
    expect(zone.w).toBeGreaterThanOrEqual(SIGNE.zonePx);
    expect(zone.h).toBeGreaterThanOrEqual(SIGNE.zonePx);
    expect(zone.distance).toBeGreaterThan(0);
  }
});

it('Archipéo garde ses losanges (./bornes.ts) : aucun signe ici', () => {
  const { monde, affordance, camera } = scene(HABILLAGES.archipeo);
  affordance.poser(SIGNES);
  affordance.animer?.(1, 0.016, false);
  expect(monde.scene.children).toHaveLength(0);
  expect(affordance.sauter(SIGNES[0].cle)).toBe(false);
  expect(affordance.zones(camera, 1024, 768)).toEqual([]);
});
