// La faune et le ciel d'Archipéo en 3D (lot R3, dans l’univers Archipéo (voir rendering.ts)) : les formes facettées de world/fauna.ts,
// une instanciation par famille. Toutes les baleines en un appel de dessin (leur queue bat et leur souffle s'ouvre dans
// le dessin, d'après deux valeurs par baleine), tous les oiseaux en un (ils battent des ailes en s'écrasant en hauteur),
// tous les nuages en un ; le liseré d'écume du passage de la baleine en un, seulement quand il se voit. Matériaux mats à
// facettes, couleurs par sommet ; faits une fois par scène et libérés avec elle.
import * as THREE from 'three';
import { allongementDuNuage, couleursDeLaBaleine, EPAISSEUR_DU_NUAGE, EVENT, formeDeBaleine, formeDEcume, formeDeNuage, formeDOiseau, PIVOT_QUEUE, type Forme, type PoseDeBaleine } from '../world/fauna';

export interface FauneEn3D {
  group: THREE.Group;
  poserBaleine(i: number, p: PoseDeBaleine): void;
  /**
   * Un oiseau : sa place, son cap (autour de la verticale), ses ailes (1 : relevées en V, −0,5 : baissées) et sa taille
   * (1 par défaut ; le planeur des Îles du Ciel est plus grand).
   */
  poserOiseau(i: number, x: number, y: number, z: number, cap: number, ailes: number, echelle?: number): void;
  /**
   * Un nuage : sa place (le milieu du dessous), sa longueur (en blocs, comme les nuages en cubes), son cap et sa taille
   * (1 par défaut ; 0 : défait, au bout de sa dérive).
   */
  poserNuage(i: number, x: number, y: number, z: number, longueur: number, cap: number, taille?: number): void;
  /** Le liseré d'écume du passage, sous la baleine qui passe (`null` : caché). */
  poserEcume(p: PoseDeBaleine | null, surLEau: number): void;
  /** La nuit (0 : jour, 1 : pleine nuit) : un reflet de lune garde les baleines et l'écume lisibles sur la mer sombre. */
  nuit(n: number): void;
  /** À appeler après les poses d'une image. */
  fin(): void;
  dispose(): void;
}

function geometrie(f: Forme): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(f.positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(f.colors, 3));
  for (const [nom, v] of Object.entries(f.poids)) geo.setAttribute(nom === 'queue' ? 'aQueue' : 'aSouffle', new THREE.BufferAttribute(v, 1));
  geo.computeBoundingSphere();
  return geo;
}

function instances(geo: THREE.BufferGeometry, material: THREE.Material, n: number): THREE.InstancedMesh {
  const m = new THREE.InstancedMesh(geo, material, Math.max(1, n));
  m.count = n;
  // Aucune instance (pas de baleines aux Îles du Ciel) : pas d'appel de dessin non plus.
  m.visible = n > 0;
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // Les instances se promènent sur tout l'archipel : leur sphère englobante est refaite à chaque image (`fin`), pour ne
  // pas dessiner une famille qui n'est pas dans la vue.
  m.raycast = () => {};
  return m;
}

export function creerFaune(n: { baleines: number; oiseaux: number; nuages: number }): FauneEn3D {
  const group = new THREE.Group();
  const tmp = new THREE.Object3D();
  const poser = (m: THREE.InstancedMesh, i: number) => {
    tmp.updateMatrix();
    m.setMatrixAt(i, tmp.matrix);
  };

  // Les baleines : la queue bat autour de son pivot, le souffle s'ouvre depuis l'évent (aAnim : angle, taille).
  const baleine = formeDeBaleine();
  const geoBaleine = geometrie({ ...baleine, colors: Float32Array.from(baleine.colors) });
  let nuitDuVentre = 0;
  const anim = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, n.baleines) * 2), 2);
  anim.setUsage(THREE.DynamicDrawUsage);
  geoBaleine.setAttribute('aAnim', anim);
  const matBaleine = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  matBaleine.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aQueue;\nattribute float aSouffle;\nattribute vec2 aAnim;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
{
  float ang = aAnim.x * aQueue;
  vec2 q = transformed.xy - vec2(${PIVOT_QUEUE.toFixed(2)}, 0.0);
  transformed.xy = vec2(${PIVOT_QUEUE.toFixed(2)}, 0.0) + vec2(cos(ang) * q.x - sin(ang) * q.y, sin(ang) * q.x + cos(ang) * q.y);
  vec3 evt = vec3(${EVENT.map((v) => v.toFixed(2)).join(', ')});
  transformed = mix(transformed, evt + (transformed - evt) * aAnim.y, aSouffle);
}`,
      );
  };
  matBaleine.customProgramCacheKey = () => 'archipeo-baleine';
  const baleines = instances(geoBaleine, matBaleine, n.baleines);

  // Les oiseaux et les nuages : des instances toutes simples.
  const geoOiseau = geometrie(formeDOiseau());
  const matOiseau = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const oiseaux = instances(geoOiseau, matOiseau, n.oiseaux);
  const geoNuage = geometrie(formeDeNuage());
  const matNuage = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const nuages = instances(geoNuage, matNuage, n.nuages);

  // L'écume du passage : translucide, sans écrire la profondeur (la baleine se voit à travers).
  const geoEcume = geometrie(formeDEcume());
  const matEcume = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false });
  const ecume = new THREE.Mesh(geoEcume, matEcume);
  ecume.visible = false;
  ecume.raycast = () => {};
  group.add(baleines, oiseaux, nuages, ecume);

  return {
    group,
    poserBaleine(i, p) {
      tmp.position.set(p.x, p.y, p.z);
      tmp.rotation.set(0, p.cap, p.roulis);
      tmp.scale.setScalar(p.echelle);
      poser(baleines, i);
      anim.setXY(i, p.queue, p.souffle);
    },
    poserOiseau(i, x, y, z, cap, ailes, echelle = 1) {
      tmp.position.set(x, y, z);
      tmp.rotation.set(0, cap, 0);
      tmp.scale.set(echelle, ailes * echelle, echelle);
      poser(oiseaux, i);
    },
    poserNuage(i, x, y, z, longueur, cap, taille = 1) {
      tmp.position.set(x, y, z);
      tmp.rotation.set(0, cap, 0);
      tmp.scale.set(allongementDuNuage(longueur) * taille, EPAISSEUR_DU_NUAGE * taille, EPAISSEUR_DU_NUAGE * taille);
      poser(nuages, i);
    },
    poserEcume(p, surLEau) {
      ecume.visible = Boolean(p && p.ecume > 0.02);
      if (!p || !ecume.visible) return;
      matEcume.opacity = p.ecume;
      ecume.position.set(p.x, surLEau, p.z);
      ecume.rotation.set(0, p.cap, 0);
      ecume.scale.setScalar(p.echelle);
    },
    nuit(k) {
      matBaleine.emissive.setRGB(0.05 * k, 0.09 * k, 0.14 * k);
      // Le ventre crème s'éteint la nuit vers le flanc (world/fauna.ts) : repeint seulement quand la nuit change.
      if (Math.abs(k - nuitDuVentre) > 1e-3) {
        const color = geoBaleine.getAttribute('color') as THREE.BufferAttribute;
        couleursDeLaBaleine(baleine, k, color.array as Float32Array);
        color.needsUpdate = true;
        nuitDuVentre = k;
      }
      matEcume.emissive.setRGB(0.3 * k, 0.34 * k, 0.38 * k);
    },
    fin() {
      for (const m of [baleines, oiseaux, nuages]) {
        m.instanceMatrix.needsUpdate = true;
        if (m.count > 0) m.computeBoundingSphere();
      }
      anim.needsUpdate = true;
    },
    dispose() {
      for (const g of [geoBaleine, geoOiseau, geoNuage, geoEcume]) g.dispose();
      for (const m of [matBaleine, matOiseau, matNuage, matEcume]) m.dispose();
      for (const m of [baleines, oiseaux, nuages]) m.dispose();
    },
  };
}
