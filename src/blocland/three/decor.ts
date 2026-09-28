// Le décor d'Archipéo en 3D (lot R4, derrière `?rendu=archipeo`) : les primitives de world/decorMesh.ts, fusionnées en
// un seul maillage à couleurs par sommet (un second, sans lumière, pour ce qui brille : lanternes, lave ; un troisième,
// sans lumière, pour les fumées qui bougent, R4b-6e). Les matériaux sont faits une fois par scène et libérés avec elle ;
// les géométries, à chaque nouveau décor. `animer` fait bouger les fumées ; `jour` passe la lanterne du phare et les
// fumées à la nuit. Ils ne recopient que ce que calcule le code pur (world/decor/fumee.ts).
import * as THREE from 'three';
import { poserLesFumees, type FacettesDuDecor, type MaillageDuDecor } from '../world/decorMesh';

export interface DecorEn3D {
  /** Les maillages du décor, à ajouter à la scène ; `userData.decor` les distingue pour le toucher. */
  group: THREE.Group;
  /** Remplace le décor. */
  peindre(m: MaillageDuDecor): void;
  /**
   * Chaque image (le contrat des parties de la scène, `animer(t, dt, reduit)`) : les fumées au temps `t` (en
   * secondes), figées dans leur pose immobile avec « Réduire les animations » (`reduit`).
   */
  animer(t: number, dt: number, reduit: boolean): void;
  /** Le moment du jour (0 la nuit, 1 le jour), à chaque changement de lumière : la lanterne du phare et les fumées le suivent. */
  jour(light: number): void;
  /** Le décor dessiné, pour retrouver la case d'un triangle touché. */
  maillage: MaillageDuDecor | null;
  dispose(): void;
}

export function creerDecor(): DecorEn3D {
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const brille = new THREE.MeshBasicMaterial({ vertexColors: true });
  // Les fumées : sans lumière (leur couleur de jour et de nuit est calculée par la règle de la fumée), opaques comme le
  // reste du décor ; elles ne se touchent pas (le toucher passe au travers).
  const vapeur = new THREE.MeshBasicMaterial({ vertexColors: true });
  let fumee: { mesh: THREE.Mesh; position: THREE.BufferAttribute; color: THREE.BufferAttribute } | null = null;
  let lanterne: { color: THREE.BufferAttribute; jour: Float32Array; nuit: Float32Array; light: number } | null = null;
  /** Le dernier état posé des fumées : immobiles, on ne les repose que si le jour ou le réglage change. */
  const pose = { light: -1, reduit: false };
  /** Le moment du jour courant (`jour`). */
  let lumiere = 1;
  const vider = () => {
    for (const child of [...group.children]) {
      group.remove(child);
      (child as THREE.Mesh).geometry.dispose();
    }
    fumee = null;
    lanterne = null;
  };
  const geometrie = (f: FacettesDuDecor) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(f.positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(f.normals, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(f.colors, 3));
    geo.computeBoundingSphere();
    return geo;
  };
  const ajouter = (f: FacettesDuDecor, material: THREE.Material, lueur: boolean) => {
    if (!f.elements.length) return null;
    const geo = geometrie(f);
    const mesh = new THREE.Mesh(geo, material);
    mesh.userData = { decor: true, lueur };
    // Un seul maillage pour tout l'archipel : le tri par la vue ne ferait rien gagner.
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  };
  const d: DecorEn3D = {
    group,
    maillage: null,
    peindre(m) {
      vider();
      ajouter(m.decor, mat, false);
      const l = ajouter(m.lueurs, brille, true);
      if (l && m.lueurs.colorsNuit) {
        // Une copie : la géométrie garde les couleurs de jour du maillage pour les rendre au lever du jour.
        const color = new THREE.BufferAttribute(Float32Array.from(m.lueurs.colors), 3);
        l.geometry.setAttribute('color', color);
        lanterne = { color, jour: m.lueurs.colors, nuit: m.lueurs.colorsNuit, light: 1 };
      }
      const f = m.fumees.facettes;
      if (f.elements.length) {
        const geo = new THREE.BufferGeometry();
        const position = new THREE.BufferAttribute(Float32Array.from(f.positions), 3);
        const color = new THREE.BufferAttribute(Float32Array.from(f.colors), 3);
        position.setUsage(THREE.DynamicDrawUsage);
        color.setUsage(THREE.DynamicDrawUsage);
        geo.setAttribute('position', position);
        geo.setAttribute('color', color);
        const mesh = new THREE.Mesh(geo, vapeur);
        mesh.frustumCulled = false;
        // La fumée ne se touche pas : un toucher sur elle va au sol derrière.
        mesh.raycast = () => {};
        group.add(mesh);
        fumee = { mesh, position, color };
        pose.light = -1;
        pose.reduit = false;
      }
      d.maillage = m;
      if (lanterne) d.jour(lumiere);
    },
    jour(light) {
      lumiere = light;
      if (lanterne && Math.abs(lanterne.light - light) > 1e-3) {
        const a = lanterne.color.array as Float32Array;
        const k = Math.min(1, Math.max(0, light));
        for (let i = 0; i < a.length; i++) a[i] = lanterne.nuit[i] + (lanterne.jour[i] - lanterne.nuit[i]) * k;
        lanterne.color.needsUpdate = true;
        lanterne.light = light;
      }
    },
    animer(t, _dt, reduit) {
      const light = lumiere;
      const m = d.maillage;
      if (!fumee || !m) return;
      if (reduit && pose.reduit && Math.abs(pose.light - light) < 1e-3) return;
      poserLesFumees(m.fumees, t, light, reduit, fumee.position.array as Float32Array, fumee.color.array as Float32Array);
      fumee.position.needsUpdate = true;
      fumee.color.needsUpdate = true;
      pose.light = light;
      pose.reduit = reduit;
    },
    dispose() {
      vider();
      mat.dispose();
      brille.dispose();
      vapeur.dispose();
      d.maillage = null;
    },
  };
  return d;
}
