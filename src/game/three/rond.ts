// Le rond au sol de la scène 3D (world/rondAuSol.ts) : posé sur la case où va le bonhomme quand on a touché le sol, du
// toucher à l'arrivée ; sur la case où il se tient déjà, un court instant (`DUREE_DU_ROND_SEUL`), sans marche. Un
// maillage de quelques triangles, couleurs aux sommets, sans lumière (lisible la nuit comme le jour ; le monde peint le
// teinte un peu de la nuit) : un seul appel de dessin, et rien quand le bonhomme ne va nulle part.
import * as THREE from 'three';
import { piedsSur, type ChampDuSol } from '../world/landMesh';
import { couleursDuRond, DUREE_DU_ROND_SEUL, formeDuRond, RAYON_DU_CERNE } from '../world/rondAuSol';
import type { Walk } from '../world/scene';
import type { Lumiere } from './lumiere';
import type { Instant, Monde, PartieDeLaScene } from './partie';
import type { Personnages } from './personnages';

/** Au-dessus du sol, pour ne pas s'y mêler (le décalage de profondeur fait le reste). */
const AU_DESSUS = 0.03;

/** Le bonhomme ne va nulle part : son trajet commence et finit sur la même case. */
const surPlace = (m: Walk) => m.route.every((p) => p.x === m.route[0].x && p.y === m.route[0].y);

export function creerRond(monde: Monde, personnages: Personnages, champ: () => ChampDuSol | null, lumiere: Lumiere, instant: Instant): PartieDeLaScene {
  const style = monde.habillage.sol === 'facettes' ? 'peint' : 'blocs';
  const forme = formeDuRond(style);
  const n = forme.roles.length;
  const positions = new Float32Array(n * 3);
  const couleurs = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    positions[i * 3] = forme.sommets[i * 2];
    positions[i * 3 + 2] = forme.sommets[i * 2 + 1];
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const attribut = new THREE.BufferAttribute(couleurs, 3);
  geometry.setAttribute('color', attribut);
  const plein = new THREE.Color();
  const cerne = new THREE.Color();
  /** Les couleurs du moment du jour (la lumière les donne à chaque changement, chaque minute au plus). */
  const peindre = (jour: number) => {
    const c = couleursDuRond(style, monde.archipel, jour);
    plein.setHex(c.plein);
    cerne.setHex(c.cerne);
    for (let i = 0; i < n; i++) (forme.roles[i] ? cerne : plein).toArray(couleurs, i * 3);
    attribut.needsUpdate = true;
  };
  peindre(1);
  lumiere.suivre(peindre);
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;
  // Le rond ne se touche pas : le toucher passe au sol dessous.
  mesh.raycast = () => {};
  monde.scene.add(mesh);
  /** Sur le sol à facettes, au-dessus de la pente sous tout le rond (le plus haut de son centre et de ses bords). */
  const bords: [number, number][] = [
    [RAYON_DU_CERNE, 0],
    [-RAYON_DU_CERNE, 0],
    [0, RAYON_DU_CERNE],
    [0, -RAYON_DU_CERNE],
  ];
  const poser = (but: { x: number; y: number; z: number }) => {
    const x = but.x + 0.5;
    const z = but.y + 0.5;
    const c = champ();
    let y = piedsSur(c, x, z, but.z);
    for (const [dx, dz] of bords) y = Math.max(y, piedsSur(c, x + dx, z + dz, but.z));
    mesh.position.set(x, y + AU_DESSUS, z);
  };
  /** La marche dont le rond est posé : on ne le replace qu'à un nouveau trajet. */
  let posee: Walk | null = null;
  /** Sur place : jusqu'à quand le rond reste (ms), sans marche. */
  let jusqua = 0;

  return {
    // Après les déplacements : la marche finie est déjà effacée (`personnages.marche` à `null`) ; le trajet demandé
    // reste (`personnages.trajet`), même s'il est fini dès sa première image (sur place).
    animer: () => {
      const m = personnages.trajet;
      // Un nouveau trajet efface le rond resté sur place ; s'il vient d'un toucher, le rond va sur son but (une fois).
      if (m && m !== posee) {
        posee = m;
        jusqua = m.vise && surPlace(m) ? instant.now + DUREE_DU_ROND_SEUL : 0;
        if (m.vise) poser(m.route[m.route.length - 1]);
      }
      mesh.visible = Boolean(m?.vise && personnages.marche === m) || instant.now < jusqua;
    },
    dispose: () => {
      monde.scene.remove(mesh);
      geometry.dispose();
      material.dispose();
    },
  };
}
