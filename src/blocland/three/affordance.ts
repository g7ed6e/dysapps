// Les signes des objets qu'on touche, dans la scène 3D de Blocland (les règles : world/affordance.ts). Un maillage
// instancié par état (l'or, la pierre, le crème) : trois appels de dessin au plus, les arêtes en couleurs de sommets
// dans la même géométrie. Chaque image, chaque cube se pose à sa place, à la taille qui le garde lisible de loin
// (14 pixels au moins) ; seuls les losanges d'or de l'île du bonhomme flottent et tournent, tous en phase ; un signe
// touché fait son petit saut. Rien sur la Carte ni pendant le voyage ; avec la préférence de mouvement réduit de
// l'appareil, aucun ne bouge. Archipéo (l'habillage, `signesDesObjets`) n'en dessine aucun : il garde ses losanges
// (./bornes.ts).
import * as THREE from 'three';
import {
  COTE_DU_SIGNE,
  COULEURS_DU_SIGNE,
  echelleDuSigne,
  flottementDuSigne,
  formeDuSigne,
  sautDuSigne,
  SIGNE,
  tourDuSigne,
  zoneDeToucher,
  type EtatDuSigne,
  type ObjetTouche,
  type SigneDObjet,
  type ZoneDObjet,
} from '../world/affordance';
import type { Derniers, Instant, Monde, PartieDeLaScene } from './partie';

const ETATS: readonly EtatDuSigne[] = ['aFaire', 'pasEncore', 'lieu'];

export interface Affordance extends PartieDeLaScene {
  /** Les signes des objets touchables (refaits quand le monde change). */
  poser(signes: readonly SigneDObjet[]): void;
  /** Le signe de cet objet fait son petit saut ; `false` s'il n'en porte pas. */
  sauter(cle: string): boolean;
  /**
   * Les zones de toucher des objets qui portent un signe, à l'écran vu par `cam` (W × H pixels CSS) : le signe projeté,
   * élargi à 48 pixels autour de son centre (l'objet se touche directement) ; une borne ou un Gardien plus petits que
   * 48 pixels à l'écran ont aussi la leur, élargie de même. Calculées au doigt levé seulement ; aucune quand les signes
   * sont cachés.
   */
  zones(cam: THREE.PerspectiveCamera, W: number, H: number): { objet: ObjetTouche; zone: ZoneDObjet }[];
  /** La hauteur de la vue, en pixels CSS, donnée au redimensionnement (jamais lue dans le DOM image par image). */
  redimensionner(hauteur: number): void;
  /** Les maillages, un par état (pour les tests et les mesures). */
  readonly maillages: Readonly<Record<EtatDuSigne, THREE.InstancedMesh | null>>;
}

/** La géométrie d'un état : la forme de world/affordance.ts, ses arêtes en couleurs de sommets. */
function geometrieDe(etat: EtatDuSigne): THREE.BufferGeometry {
  const forme = formeDuSigne(etat);
  const face = new THREE.Color(COULEURS_DU_SIGNE[etat].face);
  const arete = new THREE.Color(COULEURS_DU_SIGNE[etat].arete);
  const couleurs = new Float32Array(forme.aretes.length * 3);
  forme.aretes.forEach((a, i) => (a ? arete : face).toArray(couleurs, i * 3));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(forme.positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(forme.normals, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(couleurs, 3));
  return geo;
}

/** Le matériau d'un état : l'or brille un peu, comme la flèche « Commence ici » ; la pierre garde une lueur minimale, pour se lire la nuit. */
function materiauDe(etat: EtatDuSigne): THREE.MeshLambertMaterial {
  if (etat === 'aFaire') return new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x7a5a00, emissiveIntensity: 0.4 });
  if (etat === 'pasEncore') return new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x4a4a44, emissiveIntensity: 0.5 });
  return new THREE.MeshLambertMaterial({ vertexColors: true });
}

/** Une partie qui ne dessine rien (Archipéo). */
function sansSignes(): Affordance {
  return {
    poser: () => {},
    sauter: () => false,
    zones: () => [],
    redimensionner: () => {},
    maillages: { aFaire: null, pasEncore: null, lieu: null },
    dispose: () => {},
  };
}

export function creerAffordance(monde: Monde, el: HTMLElement, camera: THREE.PerspectiveCamera, derniers: { current: Derniers }, instant: Instant): Affordance {
  if (monde.habillage.signesDesObjets !== 'cubes') return sansSignes();
  const { scene } = monde;
  let hauteurDeLaVue = el.clientHeight;
  const geometries = Object.fromEntries(ETATS.map((e) => [e, geometrieDe(e)])) as Record<EtatDuSigne, THREE.BufferGeometry>;
  const materiaux = Object.fromEntries(ETATS.map((e) => [e, materiauDe(e)])) as Record<EtatDuSigne, THREE.MeshLambertMaterial>;
  const maillages: Record<EtatDuSigne, THREE.InstancedMesh | null> = { aFaire: null, pasEncore: null, lieu: null };
  /** Le maillage de chaque état, gardé d'une pose à l'autre : il ne se refait que s'il doit grandir. */
  const reserve: Record<EtatDuSigne, THREE.InstancedMesh | null> = { aFaire: null, pasEncore: null, lieu: null };
  /** Les signes posés, leur place dans le maillage de leur état, et le début de leur saut (`performance.now`), s'il saute. */
  let poses: { s: SigneDObjet; rang: number; saut: number | null }[] = [];
  /** Les signes se montrent (ni Carte ni voyage) : sinon, aucune zone de toucher. */
  let montres = false;

  const matrice = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const echelle = new THREE.Vector3();
  const haut = new THREE.Vector3(0, 1, 0);
  const vue = new THREE.Vector3();
  const boite = new THREE.Box3();
  const boiteDeLObjet = new THREE.Box3();
  const coin = new THREE.Vector3();
  /** L'échelle de chaque signe à la dernière image (la zone de toucher compte le cube à sa taille à l'écran). */
  let echelles: number[] = [];

  /** Le maillage d'un état, d'au moins `n` places (`count` : `n`), dans la scène ; sans signe de cet état, hors de la scène. */
  const maillageDe = (e: EtatDuSigne, n: number) => {
    let m = reserve[e];
    if (m && (n === 0 || m.instanceMatrix.count < n)) {
      scene.remove(m);
      maillages[e] = null;
      if (n > 0) {
        m.dispose();
        m = reserve[e] = null;
      }
    }
    if (n === 0) return;
    if (!m) {
      m = new THREE.InstancedMesh(geometries[e], materiaux[e], n);
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false;
      // On touche l'objet (ou la zone de son signe), jamais son signe : le rayon le traverse.
      m.raycast = () => {};
      m.visible = false;
      m.userData = { signes: e };
      reserve[e] = m;
    }
    m.count = n;
    if (!maillages[e]) scene.add(m);
    maillages[e] = m;
  };
  const vider = () => {
    for (const e of ETATS) {
      const m = reserve[e];
      if (!m) continue;
      scene.remove(m);
      m.dispose();
      maillages[e] = reserve[e] = null;
    }
  };
  /** Le rectangle à l'écran d'une boîte du monde de la scène, ou `null` si un de ses coins est derrière la caméra. */
  const projeter = (b: THREE.Box3, cam: THREE.Camera, W: number, H: number): [number, number, number, number] | null => {
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (let k = 0; k < 8; k++) {
      coin.set(k & 1 ? b.max.x : b.min.x, k & 2 ? b.max.y : b.min.y, k & 4 ? b.max.z : b.min.z).project(cam);
      if (coin.z > 1) return null;
      const x = ((coin.x + 1) / 2) * W;
      const y = ((1 - coin.y) / 2) * H;
      [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
    }
    return [x0, y0, x1, y1];
  };

  return {
    maillages,
    poser: (signes) => {
      const avant = new Map(poses.map((p) => [p.s.cle, p.saut]));
      const rangs: Record<EtatDuSigne, number> = { aFaire: 0, pasEncore: 0, lieu: 0 };
      poses = signes.map((s) => ({ s, rang: rangs[s.etat]++, saut: avant.get(s.cle) ?? null }));
      echelles = poses.map(() => 1);
      for (const e of ETATS) maillageDe(e, rangs[e]);
    },
    sauter: (cle) => {
      const p = poses.find((x) => x.s.cle === cle);
      if (!p) return false;
      p.saut = instant.now;
      return true;
    },
    zones: (cam, W, H) => {
      if (!montres) return [];
      const out: { objet: ObjetTouche; zone: ZoneDObjet }[] = [];
      cam.updateMatrixWorld();
      poses.forEach(({ s }, i) => {
        // La distance de l'objet à la caméra : le sol touché devant lui le cache.
        boiteDeLObjet.min.set(s.boite.min.x, s.boite.min.z, s.boite.min.y);
        boiteDeLObjet.max.set(s.boite.max.x, s.boite.max.z, s.boite.max.y);
        const distance = boiteDeLObjet.distanceToPoint(cam.position);
        // Le signe à sa taille à l'écran, flottement compris.
        const demi = (COTE_DU_SIGNE[s.etat] * echelles[i]) / 2 + SIGNE.flotte.amplitude;
        boite.min.set(s.x - demi, s.z - demi, s.y - demi);
        boite.max.set(s.x + demi, s.z + demi, s.y + demi);
        const r = projeter(boite, cam, W, H);
        // Un coin derrière la caméra : le signe n'est pas devant elle, pas de zone.
        if (!r) return;
        out.push({ objet: s.objet, zone: { ...zoneDeToucher(...r, distance), boite: s.boite } });
        // Une borne, un Gardien : petits, ils ont aussi leur zone de 48 pixels, autour de leur centre.
        if (s.objet.genre !== 'borne' && s.objet.genre !== 'gardien') return;
        const o = projeter(boiteDeLObjet, cam, W, H);
        if (o && (o[2] - o[0] < SIGNE.zonePx || o[3] - o[1] < SIGNE.zonePx)) out.push({ objet: s.objet, zone: { ...zoneDeToucher(...o, distance), boite: s.boite } });
      });
      return out;
    },
    redimensionner: (hauteur) => {
      hauteurDeLaVue = hauteur;
    },
    animer: (t, _dt, reduit) => {
      const { carte, home } = derniers.current;
      montres = poses.length > 0 && !carte && !instant.carte && !instant.navigue;
      for (const e of ETATS) if (maillages[e]) maillages[e].visible = montres;
      if (!montres) return;
      camera.updateMatrixWorld();
      const pxParUnite = hauteurDeLaVue / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
      // Le flottement et le tour, les mêmes pour tous les losanges qui bougent (en phase).
      const dy = flottementDuSigne(t);
      const angle = tourDuSigne(t);
      poses.forEach((p, i) => {
        const { s } = p;
        const bouge = !reduit && s.etat === 'aFaire' && home !== null && s.iles.includes(home);
        const saut = !reduit && p.saut !== null ? sautDuSigne(instant.now - p.saut) : 0;
        if (p.saut !== null && (reduit || instant.now - p.saut >= SIGNE.saut.monteeMs + SIGNE.saut.descenteMs)) p.saut = null;
        position.set(s.x, s.z + (bouge ? dy : 0) + saut, s.y);
        rotation.setFromAxisAngle(haut, bouge ? angle : 0);
        const profondeur = -vue.copy(position).applyMatrix4(camera.matrixWorldInverse).z;
        echelles[i] = echelleDuSigne(COTE_DU_SIGNE[s.etat], profondeur, pxParUnite);
        echelle.setScalar(echelles[i]);
        maillages[s.etat]?.setMatrixAt(p.rang, matrice.compose(position, rotation, echelle));
      });
      for (const e of ETATS) if (maillages[e]) maillages[e].instanceMatrix.needsUpdate = true;
    },
    dispose: () => {
      vider();
      for (const e of ETATS) {
        geometries[e].dispose();
        materiaux[e].dispose();
      }
    },
  };
}
