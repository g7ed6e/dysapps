// Les signes des objets touchables dans la scène 3D de Blocland, sans WebGL : un maillage instancié par état, seuls les
// losanges d'or de l'île du bonhomme bougent (en phase), le saut au toucher, rien sur la Carte, rien qui bouge avec le
// mouvement réduit de l'appareil, la zone de toucher de 48 pixels, et rien dans Archipéo.
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { HABILLAGES, type Habillage } from '../habillage';
import { basDuSigne, COTE_DU_SIGNE, cleDeLObjet, SIGNE, signesDesObjets, type EtatDuSigne, type ObjetTouche, type SigneDObjet } from '../world/affordance';
import { guardianPlacements } from '../world/terrain';
import { creerAffordance } from './affordance';
import { creerPersonnages } from './personnages';
import type { Derniers, Instant, Monde } from './partie';

const FORET: BiomeId = 'french-6e-phonology';
const MINE: BiomeId = 'french-6e-letter-confusion';

const instant0 = () => ({ now: 0, marche: false, traversee: null, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } }) as Instant;

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

it('reposés, les maillages restent (count) tant qu’ils ont la place ; ils ne se refont que pour grandir', () => {
  const { monde, affordance } = scene();
  affordance.poser(SIGNES);
  const or = affordance.maillages.aFaire;
  affordance.poser(SIGNES.slice(0, 2));
  expect(affordance.maillages.aFaire).toBe(or);
  expect(or?.count).toBe(2);
  // Sans signe d'un état, son maillage quitte la scène (aucun appel de dessin), puis y revient tel quel.
  expect(affordance.maillages.lieu).toBeNull();
  affordance.poser(SIGNES);
  expect(affordance.maillages.aFaire).toBe(or);
  expect(or?.count).toBe(3);
  expect(monde.scene.children.filter((o) => o instanceof THREE.InstancedMesh)).toHaveLength(3);
  // Plus de losanges que de places : un maillage neuf.
  affordance.poser([...SIGNES, signe({ genre: 'borne', id: `${MINE}:c` }, 'aFaire', MINE, 6)]);
  expect(affordance.maillages.aFaire).not.toBe(or);
  expect(affordance.maillages.aFaire?.count).toBe(4);
  expect(monde.scene.children.filter((o) => o instanceof THREE.InstancedMesh)).toHaveLength(3);
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

it('le losange d’or, dans la scène, reste sur sa pointe à tout moment de son tour : son sommet le plus bas sous son centre', () => {
  const { affordance } = scene();
  affordance.poser(SIGNES);
  const or = affordance.maillages.aFaire!;
  const position = or.geometry.getAttribute('position');
  const m = new THREE.Matrix4();
  const v = new THREE.Vector3();
  for (const [t, reduit] of [[0, true], [0.4, false], [1.1, false], [2.6, false], [4.9, false]] as const) {
    affordance.animer!(t, 0.016, reduit);
    or.getMatrixAt(0, m);
    const centre = new THREE.Vector3().setFromMatrixPosition(m);
    let bas: THREE.Vector3 | null = null;
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i).applyMatrix4(m);
      if (!bas || v.y < bas.y) bas = v.clone();
    }
    expect(Math.hypot(bas!.x - centre.x, bas!.z - centre.z), `t=${t}`).toBeLessThan(1e-5);
    expect(centre.y - bas!.y, `t=${t}`).toBeCloseTo(basDuSigne('aFaire'), 5);
  }
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
  expect(new Set(affordance.zones(camera, 1024, 768).map((z) => cleDeLObjet(z.objet))).size).toBe(SIGNES.length);
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
  // Grossi, il monte d'autant : son bas reste où il était de près (jamais sur l'objet).
  expect(p.y - s.x * basDuSigne('pasEncore')).toBeCloseTo(4 - basDuSigne('pasEncore'), 6);
  // La taille se mesure à sa place de près.
  const profondeur = new THREE.Vector3(p.x, 4, p.z).applyMatrix4(camera.matrixWorldInverse).z * -1;
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

it('le Golem de roche dans la scène de Blocland : son losange, sa pointe comprise, au-dessus de son cube le plus haut tel qu’il est dessiné', () => {
  const ile: BiomeId = 'french-6e-letter-confusion';
  const golem = guardianPlacements('6e', {}, ['french-6e-phonology-french-6e-letter-confusion'], true).find((g) => g.id === ile)!;
  const { monde, affordance } = scene();
  Object.assign(monde, { archipel: '6e', surface: null });
  const personnages = creerPersonnages(monde, () => null, instant0());
  personnages.poserLesCreatures([golem]);
  const dessin = personnages.creatures.children.find((o) => o.userData.creature === ile)!;
  dessin.updateMatrixWorld(true);
  // Tous ses cubes dessinés, à sa place dans le monde.
  const haut = new THREE.Box3().setFromObject(dessin).max.y;
  expect(haut).toBeCloseTo(golem.origin.z + Math.max(...golem.cubes.map((c) => c.z)) + 1, 6);
  const [s] = signesDesObjets({ cubes: [], creatures: [golem] });
  expect(s.z).toBeCloseTo(haut + SIGNE.auDessus, 6);
  affordance.poser([s]);
  affordance.animer!(0, 0.016, true);
  const [{ p }] = poses(affordance.maillages.aFaire);
  expect(p.y - basDuSigne('aFaire')).toBeGreaterThan(haut + 0.5);
  personnages.dispose();
});
