// Le mode « Aménager » dans la scène 3D (GD-9) : le fantôme du choix, les places libres autour de lui, les liaisons
// retracées et barrées, en carrés plats bordés d'un contour sombre (deux triangles chacun : `arrangeViewCost`), dans un
// seul maillage instancié (un appel de dessin pendant un choix, rien hors du mode) ; dans Blocland, le lieu
// choisi soulevé d'un cran et le geste de la pose (démonté couche par couche, remonté à sa nouvelle place) par un petit
// ajout aux matériaux des blocs (`avecLAmenagement`), posé seulement le temps que le mode est ouvert, sans maillage de
// plus ; dans Archipéo, le voile de brume du geste.
// Moins d'animations : le lieu se soulève d'un coup, et la page pose sans geste.
import * as THREE from 'three';
import { gestureCut, veilOpacity, veilZone } from '../world/arrangeGesture';
import type { ArrangeCellKind, ArrangeGesture, ArrangeView } from '../world/view';
import { drawIslandLabel, measureIslandLabel } from '../world/labelCanvas';
import type { Monde, PartieDeLaScene } from './scenePart';
import { mesuresDemandees } from '../rendering';

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

/** Les matériaux des blocs vus depuis l'ouverture de la scène : le mode « Aménager » les modifie le temps qu'il est ouvert. */
const materiauxDesBlocs = new Set<THREE.Material>();

/** Le mode « Aménager » est ouvert dans la scène : les matériaux des blocs portent l'ajout du mode. */
let modeOuvert = false;

/** L'ajout du mode, posé sur un matériau des blocs : le même programme pour tous (une compilation par sorte de matériau). */
function injecter(shader: THREE.WebGLProgramParametersWithUniforms): void {
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
}

const CLE_DU_MODE = () => 'amenager';

/** Pose ou retire l'ajout du mode sur un matériau ; il se recompile (le programme reste en cache dans le moteur). */
function reglerLeMateriau(m: THREE.Material, oui: boolean): void {
  const pose = m.onBeforeCompile === injecter;
  if (pose === oui) return;
  if (oui) {
    m.onBeforeCompile = injecter;
    m.customProgramCacheKey = CLE_DU_MODE;
  } else {
    // Le matériau redevient celui d'avant : ses méthodes reviennent à celles de Three.js.
    delete (m as Partial<THREE.Material>).onBeforeCompile;
    delete (m as Partial<THREE.Material>).customProgramCacheKey;
  }
  m.needsUpdate = true;
}

/**
 * Un matériau des blocs (Blocland) qui saura soulever le lieu choisi et le couper au-dessus d'une hauteur, dans la zone
 * du mode « Aménager ». Hors du mode, le matériau reste tel quel (son programme est celui d'avant, sans `discard`) ;
 * l'ajout n'est posé que le temps que le mode est ouvert (`ouvrirLeModeDansLesMateriaux`).
 */
export function avecLAmenagement<M extends THREE.Material>(m: M): M {
  materiauxDesBlocs.add(m);
  reglerLeMateriau(m, modeOuvert);
  return m;
}

/** Ouvre ou ferme le mode dans les matériaux des blocs (une seule scène du monde à la fois). */
export function ouvrirLeModeDansLesMateriaux(oui: boolean): void {
  modeOuvert = oui;
  for (const m of materiauxDesBlocs) reglerLeMateriau(m, oui);
}

/** La scène se défait : le mode se ferme dans les matériaux, et la liste se vide (ils restent au cache de ./textures.ts). */
function oublierLesMateriaux(): void {
  ouvrirLeModeDansLesMateriaux(false);
  materiauxDesBlocs.clear();
}

/**
 * L'allure de chaque sorte de case : la part de la case que prend son carré, et sa couleur. Un matériau sans lumière :
 * la couleur reste celle-ci, de jour comme de nuit (le jaune des places libres sortait presque blanc sous le soleil).
 * Le contour sombre de la texture dit la forme ; la croix dit « barrée » avec la couleur.
 */
const ALLURE: Readonly<Record<ArrangeCellKind, { l: number; couleur: number }>> = {
  fantome: { l: 0.9, couleur: 0xd6ecff },
  place: { l: 0.9, couleur: 0xffc21a },
  liaison: { l: 0.7, couleur: 0xffffff },
  barree: { l: 0.7, couleur: 0xd8432f },
  croix: { l: 0.85, couleur: 0xd8432f },
};

/** Au-dessus du dessus de la case : le carré ne se mêle jamais au sol ni à l'eau. */
const AU_DESSUS = 0.04;

/** La texture des carrés : blanche, bordée d'un contour sombre de deux pixels sur seize (générée ici, rien d'importé). */
function textureBordee(): THREE.DataTexture {
  const n = 16;
  const data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const bord = x < 2 || y < 2 || x >= n - 2 || y >= n - 2;
      const i = (y * n + x) * 4;
      const v = bord ? 40 : 255;
      data[i] = v;
      data[i + 1] = bord ? 32 : 255;
      data[i + 2] = bord ? 16 : 255;
      data[i + 3] = 255;
    }
  const t = new THREE.DataTexture(data, n, n);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

/**
 * La texture du voile de brume d'Archipéo : un rectangle plein au milieu, aux bords adoucis (un quart de chaque côté),
 * pour couvrir le lieu entier sans bord net (générée ici, rien d'importé).
 */
function textureDuVoile(): THREE.DataTexture {
  const n = 32;
  const data = new Uint8Array(n * n * 4);
  const bord = n / 4;
  const doux = (t: number) => t * t * (3 - 2 * t);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const d = Math.min(x + 0.5, y + 0.5, n - x - 0.5, n - y - 0.5);
      const i = (y * n + x) * 4;
      data[i] = 246;
      data[i + 1] = 249;
      data[i + 2] = 252;
      data[i + 3] = Math.round(255 * doux(Math.min(1, d / bord)));
    }
  const t = new THREE.DataTexture(data, n, n);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

/** Autour du voile, en cases : ses bords adoucis débordent du lieu. */
const VOILE_DEBORDE = 8;

/** La hauteur du soulèvement du lieu choisi (en cases), et le temps qu'il met à monter (ms). */
const SOULEVEMENT = { hauteur: 1, dureeMs: 220 };

export interface Amenagement extends PartieDeLaScene {
  /** Le dessin du choix (ou rien : le mode sans choix, ou hors du mode). */
  poser(vue: ArrangeView | null): void;
  /** Le geste de la pose en cours, ou rien. */
  geste(g: ArrangeGesture | null): void;
  /** Le mode est ouvert : les matériaux des blocs portent son ajout ; fermé, ils redeviennent ceux d'avant. */
  ouvrir(oui: boolean): void;
}

/** Le nom posé sur le fantôme : dessiné à 40 px, affiché à 18 px CSS, comme les étiquettes des îles (./labels.ts). */
const NOM_PX = 40;
const NOM_CSS = 18 / NOM_PX;
/** Au-dessus du fantôme, en cases. */
const NOM_AU_DESSUS = 6;

/** Le nom du lieu choisi, dans une texture (rien sans contexte 2D). */
function textureDuNom(texte: string): { map: THREE.CanvasTexture; w: number; h: number } | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const size = measureIslandLabel(ctx, texte, NOM_PX);
  canvas.width = Math.ceil(size.w + 4);
  canvas.height = Math.ceil(size.h + 4);
  drawIslandLabel(ctx, texte, canvas.width / 2, canvas.height / 2, NOM_PX);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return { map, w: canvas.width * NOM_CSS, h: canvas.height * NOM_CSS };
}

export function creerAmenagement(monde: Monde, reduit: boolean, camera: THREE.PerspectiveCamera, el: HTMLElement): Amenagement {
  const blocs = monde.habillage.pose === 'geste';
  // Un carré plat, couché : deux triangles par case.
  const forme = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const bordure = textureBordee();
  const matiere = new THREE.MeshBasicMaterial({ map: bordure, transparent: true, opacity: 0.92, depthWrite: false });
  let cases: THREE.InstancedMesh | null = null;
  const m = new THREE.Matrix4();
  const couleur = new THREE.Color();
  // Le voile de brume d'Archipéo : un plan au-dessus du lieu, qui glisse de l'ancienne place à la nouvelle, un appel de
  // dessin le temps du geste.
  const voileMat = blocs ? null : new THREE.MeshBasicMaterial({ map: textureDuVoile(), transparent: true, opacity: 0, depthWrite: false });
  const voile = voileMat ? new THREE.Mesh(new THREE.PlaneGeometry(1, 1), voileMat) : null;
  if (voile) {
    voile.rotation.x = -Math.PI / 2;
    voile.visible = false;
    voile.raycast = () => {};
    monde.scene.add(voile);
  }
  // Le nom du lieu choisi, posé sur son fantôme : une étiquette de taille fixe à l'écran, un appel de dessin pendant le choix.
  const nomMat = new THREE.SpriteMaterial({ depthTest: false, transparent: true, sizeAttenuation: false, fog: false });
  const nomSprite = new THREE.Sprite(nomMat);
  nomSprite.visible = false;
  nomSprite.renderOrder = 3;
  nomSprite.raycast = () => {};
  monde.scene.add(nomSprite);
  let nomEcrit = '';
  let nomTaille = { w: 0, h: 0 };
  const poserLeNom = (vue: ArrangeView | null) => {
    const texte = vue?.nom ?? '';
    if (texte !== nomEcrit) {
      nomMat.map?.dispose();
      nomMat.map = null;
      nomEcrit = texte;
      const t = texte ? textureDuNom(texte) : null;
      if (t) {
        nomMat.map = t.map;
        nomTaille = { w: t.w, h: t.h };
      }
      nomMat.needsUpdate = true;
    }
    nomSprite.visible = Boolean(vue && nomMat.map);
    if (vue && nomSprite.visible) nomSprite.position.set(vue.suivre.x, vue.suivre.z + NOM_AU_DESSUS, vue.suivre.y);
  };
  const tailleDuNom = () => {
    if (!nomSprite.visible) return;
    const perPx = 2 / (camera.projectionMatrix.elements[5] * Math.max(1, el.clientHeight));
    nomSprite.scale.set(nomTaille.w * perPx, nomTaille.h * perPx, 1);
  };
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
  const regler = (maintenant: number) => {
    // Les captures tiennent le geste à un moment choisi (`__dysappsGesteA`).
    const tenue = window.__dysappsGesteA;
    const now = enCours && typeof tenue === 'number' && Number.isFinite(tenue) && (import.meta.env.DEV || mesuresDemandees()) ? enCours.debut + tenue : maintenant;
    if (enCours) {
      if (blocs) {
        zone(enCours.zone);
        zoneDuMode.uAmLift.value = 0;
        zoneDuMode.uAmCut.value = gestureCut(enCours, now);
      } else if (voile && voileMat) {
        const r = veilZone(enCours, now);
        voile.visible = true;
        voile.position.set((r.x0 + r.x1) / 2, enCours.haut, (r.y0 + r.y1) / 2);
        voile.scale.set(r.x1 - r.x0 + VOILE_DEBORDE * 2, r.y1 - r.y0 + VOILE_DEBORDE * 2, 1);
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
      poserLeNom(vue);
      tailleDuNom();
      if (!vue || !vue.cases.length) return;
      cases = new THREE.InstancedMesh(forme, matiere, vue.cases.length);
      cases.frustumCulled = false;
      // Le dessin du mode ne se touche pas : le toucher passe à la mer ou au lieu dessous.
      cases.raycast = () => {};
      cases.renderOrder = 2;
      vue.cases.forEach((c, i) => {
        const a = ALLURE[c.genre];
        const l = a.l * (c.l ?? 1);
        m.makeScale(l, 1, l).setPosition(c.x + 0.5, c.z + 1 + AU_DESSUS, c.y + 0.5);
        cases!.setMatrixAt(i, m);
        cases!.setColorAt(i, couleur.setHex(a.couleur));
      });
      monde.scene.add(cases);
    },
    geste(g) {
      enCours = g;
      regler(performance.now());
    },
    ouvrir(oui) {
      ouvrirLeModeDansLesMateriaux(oui);
    },
    animer() {
      regler(performance.now());
      tailleDuNom();
    },
    dispose() {
      vider();
      neutre();
      oublierLesMateriaux();
      monde.scene.remove(nomSprite);
      nomMat.map?.dispose();
      nomMat.dispose();
      forme.dispose();
      bordure.dispose();
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
