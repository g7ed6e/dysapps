// Le mode « Aménager » dans la scène 3D (GD-9) : le fantôme du choix, les places libres autour de lui, les liaisons
// retracées et barrées, en carrés plats bordés d'un contour sombre (deux triangles chacun : `arrangeViewCost`), dans un
// seul maillage instancié (un appel de dessin pendant un choix, rien hors du mode) ; dans Blocland, le lieu
// choisi soulevé d'un cran et le geste de la pose (démonté couche par couche, remonté à sa nouvelle place) par un petit
// ajout aux matériaux des blocs (`avecLAmenagement`), posé seulement le temps que le mode est ouvert, sans maillage de
// plus ; dans Archipéo, le voile de brume du geste.
// Moins d'animations : le lieu se soulève d'un coup, et la page pose sans geste.
// Les poignées (les quatre flèches et « Tourner ») sont dessinées sur l'eau autour du choix, en un appel de dessin de plus
// (./arrangeHandles.ts) ; à chaque image où elles bougent à l'écran, leur place est donnée à la page (`ChoixALEcran`) :
// elle y pose des boutons HTML transparents (ArrangeHandles.tsx), qui portent leur nom et reçoivent le toucher. Sans
// choix, les petits radeaux des bouts de liaison (choix 1a du mainteneur, 6 octobre 2026), de même : un appel, et leurs
// places à l'écran données à la page.
import type { Lumiere } from './light';
import { mixColor } from '../world/daylight';
import * as THREE from 'three';
import { GESTE_SOUS_LE_SOL, gestureCut, veilFootprint, veilOpacity, veilZone } from '../world/arrangeGesture';
import type { ArrangeCellKind, ArrangeGesture, ArrangeView, ChoixALEcran, LinkEndHandle } from '../world/view';
import { lirePlaceReelle, type Rect } from '../freeSpace';
import { drawIslandLabel, measureIslandLabel } from '../world/labelCanvas';
import type { Monde, PartieDeLaScene } from './scenePart';
import { mesuresDemandees } from '../rendering';
import { creerBoutsDesLiaisons, creerPoignees } from './arrangeHandles';
import { type CleDePoignee, type PoigneesDuChoix, sortDeLaPlace } from '../world/arrangeHandles';
import type { LabelBox } from '../world/labelLayout';

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

/**
 * L'ajout du mode, posé sur un matériau des blocs : le même programme pour tous (une compilation par sorte de matériau).
 * Un maillage en instances (les cubes de nuages, ./offshore.ts) se lit à la place de chaque instance.
 */
function injecter(shader: THREE.WebGLProgramParametersWithUniforms): void {
  Object.assign(shader.uniforms, zoneDuMode);
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform vec4 uAmZone;\nuniform float uAmLift;\nvarying vec3 vAmWp;')
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\n#ifdef USE_INSTANCING\nvec4 p = modelMatrix * instanceMatrix * vec4(transformed, 1.0);\n#else\nvec4 p = modelMatrix * vec4(transformed, 1.0);\n#endif\nif (${DANS_LA_ZONE}) { transformed.y += uAmLift; p.y += uAmLift; }\nvAmWp = p.xyz;`,
    );
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform vec4 uAmZone;\nuniform float uAmCut;\nvarying vec3 vAmWp;')
    .replace('void main() {', `void main() {\n{ vec3 p = vAmWp; if (${DANS_LA_ZONE} && p.y > uAmCut) discard; }`);
}

/** Le programme d'un matériau avant l'ajout du mode (la texture des blocs, ./textures.ts), pour l'y remettre. */
const avantLeMode = new WeakMap<THREE.Material, { hook: THREE.Material['onBeforeCompile'] | undefined; cle: (() => string) | undefined }>();

/** Pose ou retire l'ajout du mode sur un matériau ; il se recompile (le programme reste en cache dans le moteur). */
function reglerLeMateriau(m: THREE.Material, oui: boolean): void {
  const pose = avantLeMode.has(m);
  if (pose === oui) return;
  if (oui) {
    // L'ajout du mode vient après le programme propre du matériau, s'il en a un.
    const propre = Object.prototype.hasOwnProperty.call(m, 'onBeforeCompile') ? m.onBeforeCompile : undefined;
    const cle = Object.prototype.hasOwnProperty.call(m, 'customProgramCacheKey') ? m.customProgramCacheKey : undefined;
    avantLeMode.set(m, { hook: propre, cle });
    m.onBeforeCompile = propre
      ? (shader, renderer) => {
          propre.call(m, shader, renderer);
          injecter(shader);
        }
      : injecter;
    m.customProgramCacheKey = () => `${cle?.() ?? ''}amenager`;
  } else {
    // Le matériau redevient celui d'avant : son programme propre, ou celui de Three.js.
    const avant = avantLeMode.get(m);
    avantLeMode.delete(m);
    delete (m as Partial<THREE.Material>).onBeforeCompile;
    delete (m as Partial<THREE.Material>).customProgramCacheKey;
    if (avant?.hook) m.onBeforeCompile = avant.hook;
    if (avant?.cle) m.customProgramCacheKey = avant.cle;
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

/** Ceux qui veulent savoir quand le mode s'ouvre ou se ferme (le terrain, qui ne fond pas ses faces dans le mode). */
const veilleurs = new Set<(oui: boolean) => void>();

/** Le mode est-il ouvert dans les matériaux des blocs ? */
export function modeOuvertDansLesMateriaux(): boolean {
  return modeOuvert;
}

/** Appelle `f` à chaque ouverture ou fermeture du mode ; rend de quoi ne plus l'appeler. */
export function suivreLeMode(f: (oui: boolean) => void): () => void {
  veilleurs.add(f);
  return () => veilleurs.delete(f);
}

/** Ouvre ou ferme le mode dans les matériaux des blocs (une seule scène du monde à la fois). */
export function ouvrirLeModeDansLesMateriaux(oui: boolean): void {
  const change = modeOuvert !== oui;
  modeOuvert = oui;
  for (const m of materiauxDesBlocs) reglerLeMateriau(m, oui);
  if (change) for (const f of veilleurs) f(oui);
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
 * La texture du voile de brume d'Archipéo : couleur Brume (#E5EBE3), pleine au milieu, aux bords fondus en arrondi (un
 * adoucissement radial, en super-ellipse pour couvrir le lieu jusque près de ses coins sans bord net ni coin carré),
 * générée ici, rien d'importé.
 */
function textureDuVoile(): THREE.DataTexture {
  const n = 32;
  const data = new Uint8Array(n * n * 4);
  const doux = (t: number) => t * t * (3 - 2 * t);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const u = ((x + 0.5) / n) * 2 - 1;
      const v = ((y + 0.5) / n) * 2 - 1;
      const d = Math.pow(u ** 4 + v ** 4, 1 / 4);
      const i = (y * n + x) * 4;
      data[i] = 0xe5;
      data[i + 1] = 0xeb;
      data[i + 2] = 0xe3;
      data[i + 3] = Math.round(255 * doux(Math.min(1, Math.max(0, (1 - d) / VOILE_FONDU))));
    }
  const t = new THREE.DataTexture(data, n, n);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

/** La part du voile, depuis son bord, où il se fond (en fraction de sa demi-largeur). */
const VOILE_FONDU = 0.4;
/** Autour du voile, en cases : serré à l'emprise du lieu (déjà élargie d'une case), le fondu commençant sur le lieu. */
const VOILE_DEBORDE = 1;
/** Au plus fort du geste, le voile laisse un peu voir le lieu dessous (un peu transparent, jamais un flash blanc). */
const VOILE_OPACITE = 0.78;
/** La nuit, le voile prend ce bleu sombre (celui des bancs de brume de nuit) : jamais une tache claire sur la mer de nuit. */
const VOILE_DE_NUIT = 0x5d7196;

/** De combien le mode soulève le lieu choisi : les sphères englobantes des blocs en tiennent compte (./meshes.ts). */
export const HAUTEUR_DU_SOULEVEMENT = 1;
/** La hauteur du soulèvement du lieu choisi (en cases), et le temps qu'il met à monter (ms). */
const SOULEVEMENT = { hauteur: HAUTEUR_DU_SOULEVEMENT, dureeMs: 220 };

export interface Amenagement extends PartieDeLaScene {
  /** Le dessin du choix (ou rien : le mode sans choix, ou hors du mode). */
  poser(vue: ArrangeView | null): void;
  /** Le geste de la pose en cours, ou rien. */
  geste(g: ArrangeGesture | null): void;
  /** Les poignées des bouts de liaison, sans choix en cours (ou rien). */
  poserLesBouts(bouts: readonly LinkEndHandle[] | null): void;
  /** Le mode est ouvert : les matériaux des blocs portent son ajout ; fermé, ils redeviennent ceux d'avant. */
  ouvrir(oui: boolean): void;
  /** Une poignée vient d'être touchée (son bouton) : elle s'enfonce et remonte. */
  toucher(cle: CleDePoignee): void;
  /** Les poignées, des obstacles durs pour les étiquettes (vues par `cam`), et ce qui change quand elles bougent. */
  readonly poignees: { boites(cam: THREE.Camera, w: number, h: number): LabelBox[]; readonly version: number };
}

/** Le nom posé sur le fantôme : dessiné à 40 px, affiché à 18 px CSS, comme les étiquettes des îles (./labels.ts). */
const NOM_PX = 40;
const NOM_CSS = 18 / NOM_PX;
/** Au-dessus du fantôme, en cases. */
const NOM_AU_DESSUS = 6;

/** Le nom du lieu choisi, dans une texture, les quatre flèches du mode avant lui (rien sans contexte 2D). */
function textureDuNom(texte: string): { map: THREE.CanvasTexture; w: number; h: number } | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  // Les quatre flèches du mode avant le nom, à la place du bloc de l'île : c'est le lieu qu'on déplace.
  const size = measureIslandLabel(ctx, texte, NOM_PX, undefined, 'deplacer');
  canvas.width = Math.ceil(size.w + 4);
  canvas.height = Math.ceil(size.h + 4);
  drawIslandLabel(ctx, texte, canvas.width / 2, canvas.height / 2, NOM_PX, undefined, 'deplacer');
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return { map, w: canvas.width * NOM_CSS, h: canvas.height * NOM_CSS };
}

/** La place libre et la place de la vue dans la scène de la page sont relues au plus quatre fois par seconde. */
const RELECTURE_DE_LA_PLACE_MS = 250;
/** Cinq poignées au plus, cinq nombres chacune (`Poignees.aLEcran`). */
const POIGNEES_MAX = 5;
/** Le temps laissé à la caméra pour glisser après un recadrage, avant d'en demander un autre. */
const RAMENER_MS = 1000;

/** Où le mode dit à la page que se tient le choix à l'écran (rien : la page ne pose pas de flèches). */
type EcouteDuChoixALEcran = () => ((b: ChoixALEcran | null) => void) | null | undefined;

/**
 * Une poignée sort de la place libre : la vue se recadre pour ramener les poignées du choix `p` au milieu de la place
 * libre ; rend `false` si elle ne le peut pas maintenant (un glissé en cours).
 */
type RamenerLesPoignees = (p: PoigneesDuChoix) => boolean;

export function creerAmenagement(
  monde: Monde,
  reduit: boolean,
  camera: THREE.PerspectiveCamera,
  el: HTMLElement,
  lumiere?: Lumiere,
  aLEcran?: EcouteDuChoixALEcran,
  ramener?: RamenerLesPoignees,
): Amenagement {
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
    // La nuit, le voile s'assombrit avec la lumière (sans lumière propre, il resterait clair).
    lumiere?.suivre((jour) => voileMat?.color.setHex(mixColor(VOILE_DE_NUIT, 0xffffff, Math.min(1, Math.max(0, jour)))));
  }
  // Le nom du lieu choisi, posé sur son fantôme : une étiquette de taille fixe à l'écran, un appel de dessin pendant le choix.
  const nomMat = new THREE.SpriteMaterial({ depthTest: false, transparent: true, sizeAttenuation: false, fog: false });
  const nomSprite = new THREE.Sprite(nomMat);
  nomSprite.visible = false;
  // Au-dessus des autres étiquettes (les noms des lieux à 10 et 11, la flèche et le médaillon de la Carte à 12) : le nom
  // du fantôme n'est jamais caché pendant le mode.
  nomSprite.renderOrder = 13;
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
    // Avec des poignées, le nom se pose au-dessus d'elles (le bas du nom sur le bord nord du plus haut radeau) : jamais
    // sur une poignée. Sans elles, au-dessus du fantôme.
    if (poignees.auDessus(nomSprite.position)) nomSprite.center.set(0.5, -0.15);
    else if (vueCourante) {
      nomSprite.center.set(0.5, 0.5);
      nomSprite.position.set(vueCourante.suivre.x, vueCourante.suivre.z + NOM_AU_DESSUS, vueCourante.suivre.y);
    }
    const perPx = 2 / (camera.projectionMatrix.elements[5] * Math.max(1, el.clientHeight));
    nomSprite.scale.set(nomTaille.w * perPx, nomTaille.h * perPx, 1);
  };
  // La direction de la caméra, relue à chaque image du geste (sans allocation).
  const regard = new THREE.Vector3();
  let souleve: ArrangeView['souleve'] = null;
  let souleveDepuis = 0;
  let enCours: ArrangeGesture | null = null;
  // ---- Les poignées, dessinées dans le monde ; où elles se tiennent à l'écran, donné à la page (leurs boutons). Rien
  // n'est alloué à chaque image : les places vont dans un tableau gardé, et l'objet donné à la page n'est construit que
  // s'il a changé.
  const poignees = creerPoignees(monde.scene, camera, blocs ? 'blocs' : 'peint', reduit);
  const bouts = creerBoutsDesLiaisons(monde.scene, camera, blocs ? 'blocs' : 'peint');
  /** Les places des bouts à l'écran (cinq nombres chacun), à la mesure des bouts posés. */
  let iciDesBouts = new Float32Array(0);
  /** Les places qui colleraient le lieu à un voisin, à l'écran (deux nombres chacune). */
  let iciDesReunions = new Float32Array(0);
  let vueCourante: ArrangeView | null = null;
  let dernierALEcran: ChoixALEcran | null = null;
  let dernierSuivi: ((b: ChoixALEcran | null) => void) | null = null;
  /** La place libre, le décalage de la vue dans la scène de la page et la taille de la vue, relus ensemble. */
  let place: { libre: Rect; dx: number; dy: number; w: number; h: number } | null = null;
  let placeLue = -Infinity;
  const ici = new Float32Array(5 * POIGNEES_MAX);
  const point = new THREE.Vector3();
  /** Le dernier recadrage demandé parce qu'une poignée sortait de la place libre (horloge de la page). */
  let rameneeA = -Infinity;
  /**
   * Où se tiennent les poignées à l'écran maintenant (la caméra de cette image), donné à `f` si l'une a bougé d'au moins
   * un demi-pixel, ou si la page vient d'arriver. Une poignée sort de la place libre (sous la ligne du haut, sous la
   * barre, hors de l'écran) : la vue se recadre pour la ramener (`ramener`), une fois le temps que la caméra glisse ;
   * les boutons restent posés sur les flèches dessinées.
   */
  const suivreALEcran = (maintenant: number) => {
    const f = aLEcran?.() ?? null;
    if (!f) return;
    const vue = vueCourante;
    // Sans choix, les bouts des liaisons ; avec un choix, ses poignées.
    const montre = Boolean(vue) || bouts.nombre > 0;
    if (montre && !enCours && (!place || maintenant - placeLue > RELECTURE_DE_LA_PLACE_MS)) {
      const scene = el.closest('[data-scene]');
      const r = el.getBoundingClientRect();
      const s = scene?.getBoundingClientRect();
      place = { libre: lirePlaceReelle(el), dx: s ? r.left - s.left : 0, dy: s ? r.top - s.top : 0, w: el.clientWidth, h: el.clientHeight };
      placeLue = maintenant;
    }
    // La place, seulement quand les poignées se montrent : le typage suit, sans assertion.
    const p = montre && !enCours && place && place.w && place.h ? place : null;
    let n = 0;
    let nb = 0;
    let nr = 0;
    if (p) {
      // La caméra de cette image (le cadrage l'a déjà bougée) : ses matrices à jour avant de projeter.
      camera.updateMatrixWorld();
      if (vue) {
        n = poignees.aLEcran(camera, p.w, p.h, ici);
        const toutes = n === (vue.poignees?.liste.length ?? 0);
        if (vue.poignees && (!toutes || sortDeLaPlace(ici, n, p.libre)) && maintenant - rameneeA > RAMENER_MS && ramener?.(vue.poignees)) rameneeA = maintenant;
        for (const r of vue.reunions ?? []) {
          if (2 * nr >= iciDesReunions.length) break;
          point.set(r.x, r.z, r.y).project(camera);
          if (point.z > 1) continue;
          iciDesReunions[2 * nr] = ((point.x + 1) / 2) * p.w;
          iciDesReunions[2 * nr + 1] = ((1 - point.y) / 2) * p.h;
          nr++;
        }
      } else nb = bouts.aLEcran(camera, p.w, p.h, iciDesBouts);
    }
    const d = dernierALEcran;
    let pareil: boolean;
    if (!p || !(n || nb)) pareil = d === null;
    else {
      const db = d?.bouts ?? [];
      const dr = d?.reunions ?? [];
      pareil =
        d !== null &&
        d.poignees.length === n &&
        db.length === nb &&
        dr.length === nr &&
        d.libre.x0 === p.libre.x0 + p.dx &&
        d.libre.y0 === p.libre.y0 + p.dy &&
        d.libre.x1 === p.libre.x1 + p.dx &&
        d.libre.y1 === p.libre.y1 + p.dy;
      for (let k = 0; d && pareil && k < n; k++) {
        const q = d.poignees[k];
        pareil =
          q.cle === poignees.cle(ici[5 * k]) &&
          Math.abs(q.x - (ici[5 * k + 1] + p.dx)) < 0.5 &&
          Math.abs(q.y - (ici[5 * k + 2] + p.dy)) < 0.5 &&
          Math.abs(q.w - ici[5 * k + 3]) < 0.5 &&
          Math.abs(q.h - ici[5 * k + 4]) < 0.5;
      }
      for (let k = 0; pareil && k < nr; k++) pareil = Math.abs(dr[k].x - (iciDesReunions[2 * k] + p.dx)) < 0.5 && Math.abs(dr[k].y - (iciDesReunions[2 * k + 1] + p.dy)) < 0.5;
      for (let k = 0; pareil && k < nb; k++) {
        const q = db[k];
        const b = bouts.bout(iciDesBouts[5 * k]);
        pareil =
          b !== null &&
          q.link === b.link &&
          q.end === b.end &&
          Math.abs(q.x - (iciDesBouts[5 * k + 1] + p.dx)) < 0.5 &&
          Math.abs(q.y - (iciDesBouts[5 * k + 2] + p.dy)) < 0.5 &&
          Math.abs(q.w - iciDesBouts[5 * k + 3]) < 0.5 &&
          Math.abs(q.h - iciDesBouts[5 * k + 4]) < 0.5;
      }
    }
    if (f === dernierSuivi && pareil) return;
    dernierSuivi = f;
    if (pareil) return f(d);
    const liste: ChoixALEcran['poignees'][number][] = [];
    const listeDesBouts: NonNullable<ChoixALEcran['bouts']>[number][] = [];
    const reunions: { x: number; y: number }[] = [];
    if (p) {
      for (let k = 0; k < nr; k++) reunions.push({ x: iciDesReunions[2 * k] + p.dx, y: iciDesReunions[2 * k + 1] + p.dy });
      for (let k = 0; k < n; k++) {
        const cle = poignees.cle(ici[5 * k]);
        if (cle) liste.push({ cle, x: ici[5 * k + 1] + p.dx, y: ici[5 * k + 2] + p.dy, w: ici[5 * k + 3], h: ici[5 * k + 4] });
      }
      for (let k = 0; k < nb; k++) {
        const b = bouts.bout(iciDesBouts[5 * k]);
        if (b) listeDesBouts.push({ link: b.link, end: b.end, x: iciDesBouts[5 * k + 1] + p.dx, y: iciDesBouts[5 * k + 2] + p.dy, w: iciDesBouts[5 * k + 3], h: iciDesBouts[5 * k + 4] });
      }
    }
    dernierALEcran =
      p && (liste.length || listeDesBouts.length)
        ? { poignees: liste, ...(listeDesBouts.length ? { bouts: listeDesBouts } : {}), ...(reunions.length ? { reunions } : {}), libre: { x0: p.libre.x0 + p.dx, y0: p.libre.y0 + p.dy, x1: p.libre.x1 + p.dx, y1: p.libre.y1 + p.dy } }
        : null;
    f(dernierALEcran);
  };

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
        // Posé au-dessus du plus haut cube, vu de biais : ramené vers la caméra de la hauteur du lieu, pour couvrir à
        // l'écran le lieu et ce qui s'y dresse, pas l'eau derrière lui (`veilFootprint`).
        camera.getWorldDirection(regard);
        const pente = { x: regard.x / Math.max(0.1, -regard.y), y: regard.z / Math.max(0.1, -regard.y) };
        const r = veilFootprint(veilZone(enCours, now), enCours.haut - (enCours.bas + GESTE_SOUS_LE_SOL), pente);
        voile.visible = true;
        voile.position.set((r.x0 + r.x1) / 2, enCours.haut, (r.y0 + r.y1) / 2);
        voile.scale.set(r.x1 - r.x0 + VOILE_DEBORDE * 2, r.y1 - r.y0 + VOILE_DEBORDE * 2, 1);
        voileMat.opacity = VOILE_OPACITE * veilOpacity(enCours, now);
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
      vueCourante = vue;
      iciDesReunions = new Float32Array(2 * (vue?.reunions?.length ?? 0));
      const meme = souleve && vue?.souleve && souleve.x0 === vue.souleve.x0 && souleve.y0 === vue.souleve.y0 && souleve.x1 === vue.souleve.x1;
      if (!meme) souleveDepuis = performance.now();
      souleve = vue?.souleve ?? null;
      regler(performance.now());
      poserLeNom(vue);
      poignees.poser(vue?.poignees ?? null);
      tailleDuNom();
      if (!vue || !vue.cases.length) return;
      const dessin = new THREE.InstancedMesh(forme, matiere, vue.cases.length);
      dessin.frustumCulled = false;
      // Le dessin du mode ne se touche pas : le toucher passe à la mer ou au lieu dessous.
      dessin.raycast = () => {};
      dessin.renderOrder = 2;
      vue.cases.forEach((c, i) => {
        const a = ALLURE[c.genre];
        const l = a.l * (c.l ?? 1);
        m.makeScale(l, 1, l).setPosition(c.x + 0.5, c.z + 1 + AU_DESSUS, c.y + 0.5);
        dessin.setMatrixAt(i, m);
        dessin.setColorAt(i, couleur.setHex(a.couleur));
      });
      cases = dessin;
      monde.scene.add(dessin);
    },
    poserLesBouts(b) {
      bouts.poser(b);
      iciDesBouts = new Float32Array(5 * bouts.nombre);
    },
    geste(g) {
      enCours = g;
      regler(performance.now());
      // Pendant le geste, pas de poignées : le choix est posé.
      poignees.poser(g ? null : (vueCourante?.poignees ?? null));
    },
    ouvrir(oui) {
      ouvrirLeModeDansLesMateriaux(oui);
    },
    toucher(cle) {
      poignees.toucher(cle, performance.now());
    },
    poignees: {
      // Les poignées, et le nom posé au-dessus d'elles : aucune étiquette d'île ne se pose dessus.
      boites(cam, w, h) {
        // Sans choix, les petits radeaux des bouts de liaison (choix 1a) ; avec un choix, ses poignées.
        const out = [...poignees.boites(cam, w, h), ...bouts.boites(cam, w, h)];
        if (nomSprite.visible && nomTaille.w) {
          point.copy(nomSprite.position).project(cam);
          if (point.z <= 1) {
            const x = ((point.x + 1) / 2) * w;
            const y = ((1 - point.y) / 2) * h;
            out.push({ x: x + (0.5 - nomSprite.center.x) * nomTaille.w, y: y - (0.5 - nomSprite.center.y) * nomTaille.h, w: nomTaille.w, h: nomTaille.h });
          }
        }
        return out;
      },
      get version() {
        return poignees.version + bouts.version;
      },
    },
    animer() {
      const maintenant = performance.now();
      regler(maintenant);
      tailleDuNom();
      poignees.animer(maintenant, el.clientHeight);
      bouts.animer(el.clientHeight);
      suivreALEcran(maintenant);
    },
    dispose() {
      vider();
      neutre();
      // La scène refaite (une pose) en donnera une nouvelle : la page ne garde pas de flèches posées sur l'ancienne.
      if (dernierSuivi && dernierALEcran) dernierSuivi(null);
      oublierLesMateriaux();
      poignees.dispose();
      bouts.dispose();
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
