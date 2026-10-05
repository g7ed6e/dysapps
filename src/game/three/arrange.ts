// Le mode « Aménager » dans la scène 3D (GD-9) : le fantôme du choix, les places libres autour de lui, les liaisons
// retracées et barrées, en un seul maillage instancié (un appel de dessin, rien hors du mode) ; dans Blocland, le lieu
// choisi soulevé d'un cran et le geste de la pose (démonté couche par couche, remonté à sa nouvelle place) par un petit
// ajout aux matériaux des blocs (`avecLAmenagement`), sans maillage de plus ; dans Archipéo, le voile de brume du geste.
// Moins d'animations : le lieu se soulève d'un coup, et la page pose sans geste.
import * as THREE from 'three';
import type { ArrangeView, ArrangeCellKind } from '../world/arrangeView';
import { type ArrangeGesture, gestureCut, veilOpacity } from '../world/arrangeGesture';
import { mistTexture } from './meshes';
import type { Monde, PartieDeLaScene } from './scenePart';

/** Ce qui ne coupe ni ne soulève rien. */
const LOIN = 1e6;

/**
 * Les valeurs que lisent les matériaux des blocs (partagées : une seule scène du monde à la fois) : la zone du monde
 * (x0, z0, x1, z1 dans le repère Three), le soulèvement (en cases) et la hauteur de coupe.
 */
const zoneDuMode = {
  uAmZone: { value: new THREE.Vector4(0, 0, -1, -1) },
  uAmLift: { value: 0 },
  uAmCut: { value: LOIN },
};

const neutre = () => {
  zoneDuMode.uAmZone.value.set(0, 0, -1, -1);
  zoneDuMode.uAmLift.value = 0;
  zoneDuMode.uAmCut.value = LOIN;
};

const DANS_LA_ZONE = 'p.x > uAmZone.x && p.x < uAmZone.z && p.z > uAmZone.y && p.z < uAmZone.w';

/**
 * Un matériau des blocs (Blocland) qui sait soulever le lieu choisi et le couper au-dessus d'une hauteur, dans la zone
 * du mode « Aménager » : quelques opérations par sommet et par pixel, le même programme pour tous (une seule
 * compilation par sorte de matériau). Hors du mode, la zone est vide : rien ne change à l'image.
 */
export function avecLAmenagement<M extends THREE.Material>(m: M): M {
  if (m.userData.amenager) return m;
  m.userData.amenager = true;
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, zoneDuMode);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform vec4 uAmZone;\nuniform float uAmLift;\nvarying vec3 vAmWp;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>\nvec4 p = modelMatrix * vec4(transformed, 1.0);\nif (${DANS_LA_ZONE}) { transformed.y += uAmLift; p.y += uAmLift; }\nvAmWp = p.xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec4 uAmZone;\nuniform float uAmCut;\nvarying vec3 vAmWp;')
      .replace('void main() {', `void main() {\n{ vec3 p = vAmWp; if (${DANS_LA_ZONE} && p.y > uAmCut) discard; }`);
  };
  m.customProgramCacheKey = () => 'amenager';
  return m;
}

/** L'allure de chaque sorte de case : sa taille (largeur, hauteur) et sa couleur (la croix dit « barrée » avec la couleur). */
const ALLURE: Readonly<Record<ArrangeCellKind, { l: number; h: number; couleur: number }>> = {
  fantome: { l: 0.9, h: 0.9, couleur: 0xeaf6ff },
  place: { l: 0.8, h: 0.25, couleur: 0x7fc4ff },
  liaison: { l: 0.7, h: 0.35, couleur: 0xffffff },
  barree: { l: 0.7, h: 0.35, couleur: 0xc0392b },
  croix: { l: 0.85, h: 0.85, couleur: 0xc0392b },
};

/** La hauteur du soulèvement du lieu choisi (en cases), et le temps qu'il met à monter (ms). */
const SOULEVEMENT = { hauteur: 1, dureeMs: 220 };

export interface Amenagement extends PartieDeLaScene {
  /** Le dessin du choix (ou rien : le mode sans choix, ou hors du mode). */
  poser(vue: ArrangeView | null): void;
  /** Le geste de la pose en cours, ou rien. */
  geste(g: ArrangeGesture | null): void;
}

export function creerAmenagement(monde: Monde, reduit: boolean): Amenagement {
  const blocs = monde.habillage.pose === 'geste';
  const forme = new THREE.BoxGeometry(1, 1, 1);
  const matiere = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.88, depthWrite: false });
  let cases: THREE.InstancedMesh | null = null;
  const m = new THREE.Matrix4();
  const couleur = new THREE.Color();
  // Le voile de brume d'Archipéo : un plan au-dessus du lieu, un appel de dessin le temps du geste.
  const voileMat = blocs ? null : new THREE.MeshBasicMaterial({ map: mistTexture(), transparent: true, opacity: 0, depthWrite: false });
  const voile = voileMat ? new THREE.Mesh(new THREE.PlaneGeometry(1, 1), voileMat) : null;
  if (voile) {
    voile.rotation.x = -Math.PI / 2;
    voile.visible = false;
    voile.raycast = () => {};
    monde.scene.add(voile);
  }
  let souleve: ArrangeView['souleve'] = null;
  let souleveDepuis = 0;
  let enCours: ArrangeGesture | null = null;

  const vider = () => {
    if (!cases) return;
    monde.scene.remove(cases);
    cases.dispose();
    cases = null;
  };

  const zone = (r: { x0: number; y0: number; x1: number; y1: number }) => zoneDuMode.uAmZone.value.set(r.x0, r.y0, r.x1, r.y1);

  /** Les valeurs des matériaux à l'heure `now` : le geste d'abord, sinon le lieu soulevé, sinon rien. */
  const regler = (now: number) => {
    if (enCours) {
      if (blocs) {
        zone(enCours.zone);
        zoneDuMode.uAmLift.value = 0;
        zoneDuMode.uAmCut.value = gestureCut(enCours, now);
      } else if (voile && voileMat) {
        const r = enCours.zone;
        voile.visible = true;
        voile.position.set((r.x0 + r.x1) / 2, enCours.haut, (r.y0 + r.y1) / 2);
        voile.scale.set(r.x1 - r.x0 + 8, r.y1 - r.y0 + 8, 1);
        voileMat.opacity = 0.95 * veilOpacity(enCours, now);
      }
      return;
    }
    if (voile) voile.visible = false;
    if (blocs && souleve) {
      zone(souleve);
      const k = reduit ? 1 : Math.min(1, (now - souleveDepuis) / SOULEVEMENT.dureeMs);
      zoneDuMode.uAmLift.value = SOULEVEMENT.hauteur * k;
      zoneDuMode.uAmCut.value = LOIN;
    } else neutre();
  };

  return {
    poser(vue) {
      vider();
      const meme = souleve && vue?.souleve && souleve.x0 === vue.souleve.x0 && souleve.y0 === vue.souleve.y0 && souleve.x1 === vue.souleve.x1;
      if (!meme) souleveDepuis = performance.now();
      souleve = vue?.souleve ?? null;
      regler(performance.now());
      if (!vue || !vue.cases.length) return;
      cases = new THREE.InstancedMesh(forme, matiere, vue.cases.length);
      cases.frustumCulled = false;
      // Le dessin du mode ne se touche pas : le toucher passe à la mer ou au lieu dessous.
      cases.raycast = () => {};
      cases.renderOrder = 2;
      vue.cases.forEach((c, i) => {
        const a = ALLURE[c.genre];
        m.makeScale(a.l, a.h, a.l).setPosition(c.x + 0.5, c.z + a.h / 2, c.y + 0.5);
        cases!.setMatrixAt(i, m);
        cases!.setColorAt(i, couleur.setHex(a.couleur));
      });
      monde.scene.add(cases);
    },
    geste(g) {
      enCours = g;
      regler(performance.now());
    },
    animer() {
      regler(performance.now());
    },
    dispose() {
      vider();
      neutre();
      forme.dispose();
      matiere.dispose();
      if (voile) {
        monde.scene.remove(voile);
        voile.geometry.dispose();
        voileMat?.map?.dispose();
        voileMat?.dispose();
      }
    },
  };
}
