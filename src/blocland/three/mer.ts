// La mer d'Archipéo en 3D (lot R3, derrière `?rendu=archipeo`) : la grille et la carte de world/mer.ts, en un seul
// appel de dessin. Un matériau mat à facettes (`flatShading`), dont le dessin est complété de trois choses : la houle
// soulève les sommets (calme près des côtes), la couleur vient de la carte (lagon, mer, large), et l'écume du rivage se
// lit dans la distance à la terre de la carte, avec un léger souffle. Aux Îles du Ciel, le même maillage fait le
// plancher de nuages (houle lente, pas d'écume). « Réduire les animations » : le temps ne passe plus, la houle et
// l'écume sont figées.
import * as THREE from 'three';
import { cadreDeLaMer, carteDeLaMer, ECUME, grilleDeLaMer, houleDe, PAR_CASE, PORTEE, type Etendue, type Terre } from '../world/mer';
import type { ArchipelagoId } from '../world/map';

export interface MerEn3D {
  mesh: THREE.Mesh;
  /** Repeint la carte (la côte a changé). */
  peindre(terres: Terre[]): void;
  /** Le temps de la houle et de l'écume, en secondes. */
  temps(t: number): void;
  dispose(): void;
}

export function creerMer(a: ArchipelagoId, etendue: Etendue, loin: number): MerEn3D {
  const g = grilleDeLaMer(etendue, loin);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(g.positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(g.uvs, 2));
  geo.setIndex(new THREE.BufferAttribute(g.indices, 1));
  // (Pas de normales : les facettes les tirent de leur forme, à chaque image.)
  geo.computeBoundingSphere();
  // La carte a toujours la taille du cadre de l'archipel : la texture est faite une fois, puis repeinte sur place.
  const cadre = cadreDeLaMer(etendue);
  const pixels = new Uint8Array(cadre.largeur * PAR_CASE * cadre.hauteur * PAR_CASE * 4);
  const texture = new THREE.DataTexture(pixels, cadre.largeur * PAR_CASE, cadre.hauteur * PAR_CASE, THREE.RGBAFormat);
  // Où la seconde ligne d'écume a sa place (un canal, filtré : elle s'efface en douceur à l'entrée d'un passage étroit).
  const passes = new Uint8Array(cadre.largeur * PAR_CASE * cadre.hauteur * PAR_CASE);
  const seconde = new THREE.DataTexture(passes, cadre.largeur * PAR_CASE, cadre.hauteur * PAR_CASE, THREE.RedFormat);
  seconde.magFilter = THREE.LinearFilter;
  seconde.minFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  const h = houleDe(a);
  const uniforms = {
    uTemps: { value: 0 },
    uCarte: { value: texture },
    uHoule: { value: new THREE.Vector4(h.large, h.rivage, h.vitesse, h.echelle) },
    // Largeur, souffle et bord du liseré (en cases) ; largeur négative : pas d'écume.
    uEcume: { value: new THREE.Vector4(ECUME.largeur, ECUME.souffle, ECUME.bord, 0) },
    uCouleurEcume: { value: new THREE.Color(0xffffff) },
    uSeconde: { value: seconde },
  };
  const material = new THREE.MeshLambertMaterial({ map: texture, flatShading: true });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uTemps;
uniform vec4 uHoule;
uniform sampler2D uCarte;
varying vec2 vMerXZ;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
{
  // La houle (world/mer.ts, houle()) : calme près des côtes.
  float dTerre = textureLod(uCarte, uv, 0.0).a * ${PORTEE.toFixed(1)};
  float amp = mix(uHoule.y, uHoule.x, smoothstep(0.5, 4.0, dTerre));
  float tt = uTemps * uHoule.z;
  float s = uHoule.w;
  transformed.y += amp * (0.55 * sin(s * (0.42 * position.x + 0.23 * position.z) + 0.9 * tt)
    + 0.45 * sin(s * (-0.19 * position.x + 0.37 * position.z) + 0.7 * tt + 1.3));
  vMerXZ = position.xz;
}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uTemps;
uniform vec4 uEcume;
uniform vec3 uCouleurEcume;
uniform sampler2D uSeconde;
varying vec2 vMerXZ;`,
      )
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
{
  vec4 carte = texture2D(map, vMapUv);
  float d = carte.a * ${PORTEE.toFixed(1)};
  // L'écume : une bande claire au ras de la côte, qui respire doucement ; plus loin, une ligne plus pâle.
  float w = uEcume.x + uEcume.y * sin(uTemps * 0.8 + vMerXZ.x * 0.7 + vMerXZ.y * 0.5);
  float e1 = 1.0 - smoothstep(w - uEcume.z, w + uEcume.z, d);
  // La seconde ligne : fixe, à ${ECUME.force} de l'opacité du liseré, là où le passage est assez large.
  float w2 = uEcume.x + ${ECUME.ligne.toFixed(2)};
  float e2 = (1.0 - smoothstep(0.03, 0.08, abs(d - w2))) * ${ECUME.force.toFixed(2)} * texture2D(uSeconde, vMapUv).r;
  float e = uEcume.x < 0.0 ? 0.0 : max(e1, e2);
  diffuseColor.rgb *= mix(carte.rgb, uCouleurEcume, e * 0.92);
}
#endif`,
      );
  };
  // Une seule mer par scène : la clé distingue ce programme de celui des autres matériaux mats.
  material.customProgramCacheKey = () => 'archipeo-mer';
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.raycast = () => {};
  return {
    mesh,
    peindre(terres) {
      const c = carteDeLaMer(a, terres, etendue);
      pixels.set(c.data);
      passes.set(c.seconde);
      seconde.needsUpdate = true;
      texture.needsUpdate = true;
      uniforms.uCouleurEcume.value.setHex(c.ecume);
      if (c.nuages) uniforms.uEcume.value.set(-1, 0, 0, 0);
    },
    temps(t) {
      uniforms.uTemps.value = t;
    },
    dispose() {
      geo.dispose();
      material.dispose();
      texture.dispose();
      seconde.dispose();
    },
  };
}
