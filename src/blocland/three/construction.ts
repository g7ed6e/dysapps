// La construction taillée d'Archipéo en 3D (lot R5, derrière `?rendu=archipeo`) : les trois groupes de
// world/construction.ts, trois appels de dessin. Les couleurs sont portées par les sommets ; trois matériaux, faits une
// fois par scène et libérés avec elle, les complètent dans le shader (`onBeforeCompile`) :
//
// - les blocs : la teinte de chaque bloc (± 4 %, tirée de sa case), et le biseau peint, une lumière qui accroche les
//   arêtes saillantes sur une bande de `BISEAU` case, un pixel et demi au moins (elle éclaircit, jamais n'assombrit ; de
//   loin, quand une case tient en moins de 16 pixels, elle s'efface, pour ne pas scintiller ; sans biseau en Contraste
//   élevé) ;
// - les fenêtres et les lanternes : la lueur `LUEUR`, exacte, qui monte avec la nuit, chacune à son moment ;
// - les fantômes : le crème Brume, sans lumière, translucide, et l'arête fine de chaque case.
//
// Rien ne bouge image par image : les uniformes suivent la lumière (`lumiere.suivre`, chaque minute au plus) et le thème.
import * as THREE from 'three';
import {
  ARETE,
  ARETE_FANTOME,
  BISEAU,
  ECLAT_GLSL,
  FANTOME,
  LUEUR,
  opaciteDesFantomes,
  TEINTE_GLSL,
  type GroupeDeConstruction,
  type MaillageDeLaConstruction,
} from '../world/construction';
import type { Lumiere } from './lumiere';

/** L'éclat du biseau peint : la part de lumière ajoutée au milieu de la bande. */
export const ECLAT_DU_BISEAU = 0.22;

/** Les trois matériaux de la construction, partagés par ses maillages (le monde, le navire). */
export interface MateriauxDeConstruction {
  opaque: THREE.MeshLambertMaterial;
  fenetres: THREE.MeshLambertMaterial;
  fantomes: THREE.MeshBasicMaterial;
  dispose(): void;
}

/** Contraste élevé : le thème de l'application (core/settings.ts, `data-theme` sur la racine du document). */
const contrasteEleve = () => document.documentElement.dataset.theme === 'contraste';

export function creerMateriaux(lumiere: Lumiere | null): MateriauxDeConstruction {
  const biseau = { value: contrasteEleve() ? 0 : ECLAT_DU_BISEAU };
  const opaque = new THREE.MeshLambertMaterial({ vertexColors: true });
  opaque.onBeforeCompile = (s) => {
    s.uniforms.uBiseau = biseau;
    s.vertexShader = s.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute vec4 biseaux;\nattribute float teinte;\nvarying vec3 vCase;\nvarying vec4 vBiseaux;\nvarying float vTeinte;',
      )
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCase = position - normal * 0.5;\nvBiseaux = biseaux;\nvTeinte = teinte;');
    s.fragmentShader = s.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\nuniform float uBiseau;\nvarying vec3 vCase;\nvarying vec4 vBiseaux;\nvarying float vTeinte;\n${TEINTE_GLSL}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
diffuseColor.rgb *= vTeinte > 0.0 ? pow(vTeinte, 2.2) : teinteDeCase(floor(vCase));
{
  // Le biseau peint : 1 au bord saillant, 0 au-delà de la bande. La bande garde au moins un pixel et demi (jamais un
  // fil qui scintille) ; de loin, quand une case tient en moins de 16 pixels, elle s'efface (rien sous 8 pixels).
  vec4 fw = max(fwidth(vBiseaux), vec4(1e-5));
  vec4 w = max(vec4(${BISEAU.toFixed(3)}), 1.5 * fw);
  vec4 k = (1.0 - smoothstep(w - 0.5 * fw, w + 0.5 * fw, vBiseaux)) * clamp((1.0 / fw - 8.0) / 8.0, 0.0, 1.0);
  diffuseColor.rgb *= 1.0 + uBiseau * max(max(k.x, k.y), max(k.z, k.w));
}`,
      );
  };
  opaque.customProgramCacheKey = () => 'construction-opaque';

  const nuit = { value: 0 };
  const lueur = { value: new THREE.Color(LUEUR) };
  const fenetres = new THREE.MeshLambertMaterial({ vertexColors: true });
  fenetres.onBeforeCompile = (s) => {
    s.uniforms.uNuit = nuit;
    s.uniforms.uLueur = lueur;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float decalage;\nvarying float vDecalage;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvDecalage = decalage;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uNuit;\nuniform vec3 uLueur;\nvarying float vDecalage;\n${ECLAT_GLSL}`)
      // La nuit, la couleur de la lueur, exacte : elle remplace la surface éclairée.
      .replace('#include <color_fragment>', '#include <color_fragment>\nfloat eclat = eclatDeFenetre(uNuit, vDecalage);\ndiffuseColor.rgb *= 1.0 - eclat;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uLueur * eclat;');
  };
  fenetres.customProgramCacheKey = () => 'construction-fenetres';

  const remplissage = { value: 0.35 };
  const arete = { value: 0.5 };
  const couleurDArete = { value: new THREE.Color(ARETE) };
  const fantomes = new THREE.MeshBasicMaterial({ color: FANTOME, transparent: true, depthWrite: false });
  fantomes.onBeforeCompile = (s) => {
    s.uniforms.uRemplissage = remplissage;
    s.uniforms.uArete = arete;
    s.uniforms.uCouleurDArete = couleurDArete;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 caseUv;\nvarying vec2 vCaseUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCaseUv = caseUv;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uRemplissage;\nuniform float uArete;\nuniform vec3 uCouleurDArete;\nvarying vec2 vCaseUv;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
{
  // L'arête de chaque case : là où ses coordonnées sur le plan sont entières, jamais plus fine qu'un pixel.
  vec2 f = fract(vCaseUv);
  vec2 dd = min(f, 1.0 - f);
  float d = min(dd.x, dd.y);
  float fw = max(fwidth(d), 1e-5);
  float w = max(${ARETE_FANTOME.toFixed(3)}, fw);
  float a = 1.0 - smoothstep(w - fw * 0.5, w + fw * 0.5, d);
  diffuseColor.rgb = mix(diffuseColor.rgb, uCouleurDArete, a);
  diffuseColor.a = mix(uRemplissage, uArete, a);
}`,
      );
  };
  fantomes.customProgramCacheKey = () => 'construction-fantomes';

  let jour = 1;
  const regler = () => {
    const contraste = contrasteEleve();
    const o = opaciteDesFantomes(jour, contraste);
    remplissage.value = o.remplissage;
    arete.value = o.arete;
    nuit.value = 1 - jour;
    // En Contraste élevé, pas de biseau : rien ne se lit comme une arête à côté de celles des fantômes.
    biseau.value = contraste ? 0 : ECLAT_DU_BISEAU;
  };
  regler();
  lumiere?.suivre((j) => {
    jour = j;
    regler();
  });
  // Le thème peut changer pendant la partie (les réglages).
  const theme = new MutationObserver(regler);
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  return {
    opaque,
    fenetres,
    fantomes,
    dispose: () => {
      theme.disconnect();
      opaque.dispose();
      fenetres.dispose();
      fantomes.dispose();
    },
  };
}

export interface ConstructionEn3D {
  /** Les maillages de la construction ; `userData.construction` les distingue pour le toucher. */
  group: THREE.Group;
  /** Remplace la construction. */
  peindre(m: MaillageDeLaConstruction): void;
  /** Triangles dessinés (pour les mesures). */
  triangles(): number;
  /** Libère les géométries (les matériaux sont à qui les a faits). */
  dispose(): void;
}

export function creerConstruction(materiaux: MateriauxDeConstruction): ConstructionEn3D {
  const group = new THREE.Group();
  let triangles = 0;
  const vider = () => {
    for (const child of [...group.children]) {
      group.remove(child);
      (child as THREE.Mesh).geometry.dispose();
    }
    triangles = 0;
  };
  const ajouter = (g: GroupeDeConstruction, material: THREE.Material, attributs: Record<string, [Float32Array, number]>) => {
    if (!g.indices.length) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(g.positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(g.normals, 3));
    if (g.colors.length) geo.setAttribute('color', new THREE.BufferAttribute(g.colors, 3));
    for (const [nom, [data, taille]] of Object.entries(attributs)) geo.setAttribute(nom, new THREE.BufferAttribute(data, taille));
    geo.setIndex(new THREE.BufferAttribute(g.positions.length / 3 < 65536 ? Uint16Array.from(g.indices) : g.indices, 1));
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, material);
    mesh.userData = { construction: true };
    // Un seul maillage pour tout l'archipel : le tri par la vue ne ferait rien gagner.
    mesh.frustumCulled = false;
    triangles += g.indices.length / 3;
    group.add(mesh);
    return mesh;
  };
  return {
    group,
    peindre(m) {
      vider();
      ajouter(m.opaque, materiaux.opaque, { biseaux: [m.opaque.biseaux, 4], teinte: [m.opaque.teintes, 1] });
      ajouter(m.fenetres, materiaux.fenetres, { decalage: [m.fenetres.decalages, 1] });
      const f = ajouter(m.fantomes, materiaux.fantomes, { caseUv: [m.fantomes.uvs, 2] });
      if (f) f.renderOrder = 1;
    },
    triangles: () => triangles,
    dispose: vider,
  };
}
