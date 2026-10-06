// Les poignées du mode « Modifier le plan » dans la scène 3D (GD-9 ; intention du directeur artistique du 6 octobre
// 2026) : les quatre flèches et « Tourner », sur leurs radeaux posés sur l'eau autour du choix, toutes dans un seul
// maillage à couleurs par sommet (un appel de dessin, seulement pendant un choix, `BUDGET_DES_POIGNEES`). Un matériau sans
// lumière ni brume : la nuit ne les éteint pas. Jamais sous `POIGNEE_MIN_PX` à l'écran : à chaque image, leur taille suit
// le zoom (elles grandissent et s'écartent du choix quand la vue s'éloigne), en réécrivant les sommets seulement quand
// elle change, sans rien allouer. Touchée, une poignée s'enfonce d'un demi-cube et s'assombrit en 120 ms, puis remonte ;
// avec « Réduire les animations », la couleur seule. Pas de flottement au repos. Sur une place prise, la croix grise au
// milieu du choix, dans le même maillage (choix 3 du mainteneur). Sans choix, les petits radeaux des bouts de liaison
// (choix 1a), dans un maillage à eux, jamais en même temps que celui des flèches. La forme et la place :
// ../world/arrangeHandles.ts.
import * as THREE from 'three';
import {
  COTE_DU_BOUT,
  COTE_DU_RADEAU,
  type CleDePoignee,
  formeDesBouts,
  formeDesPoignees,
  placerALEchelle,
  POIGNEE_MIN_PX,
  reculsDesBouts,
  type PoigneesDuChoix,
  type StyleDesPoignees,
} from '../world/arrangeHandles';
import type { LabelBox } from '../world/labelLayout';
import type { LinkEndHandle } from '../world/view';

/** Le temps de l'enfoncement, puis celui de la remontée (ms). */
const ENFONCE_MS = 120;
/** De combien la poignée touchée s'enfonce (un demi-cube de son radeau, en cases à l'échelle 1) et s'assombrit. */
const ENFONCE = 0.2;
const SOMBRE = 0.7;
/** L'échelle ne se réécrit qu'au-delà de ce changement (relatif) : pas de sommets réécrits pour un rien. */
const PAS_D_ECHELLE = 0.01;

export interface Poignees {
  /** Les poignées d'un choix (ou rien : hors d'un choix, pendant le geste). */
  poser(p: PoigneesDuChoix | null): void;
  /** Une poignée vient d'être touchée (son bouton) : elle s'enfonce, puis remonte. */
  toucher(cle: CleDePoignee, maintenant: number): void;
  /** À chaque image : la taille selon le zoom, l'enfoncement en cours. */
  animer(maintenant: number, hauteurDeLaVue: number): void;
  /**
   * Chaque poignée devant la caméra, vue par `cam` (pixels CSS de la vue de `w` × `h`), écrite dans `out` (cinq nombres
   * par poignée : son rang, son milieu x et y, sa largeur et sa hauteur ; rien d'alloué) ; rend combien sont écrites.
   */
  aLEcran(cam: THREE.Camera, w: number, h: number, out: Float32Array): number;
  /**
   * Le bord du haut de l'écran des poignées (le côté nord du plus haut radeau), au milieu du choix, dans `out` (x, hauteur,
   * y du repère de Three) ; `false` sans poignées. Le nom du lieu choisi s'y pose, au-dessus d'elles.
   */
  auDessus(out: THREE.Vector3): boolean;
  /** La clé de la poignée de rang `i`. */
  cle(i: number): CleDePoignee | null;
  /** Les poignées en boîtes pour les étiquettes (des obstacles durs), vues par `cam`. */
  boites(cam: THREE.Camera, w: number, h: number): LabelBox[];
  /** Change quand les poignées bougent ou changent de taille : l'écart des étiquettes se refait. */
  readonly version: number;
  dispose(): void;
}

export function creerPoignees(scene: THREE.Scene, camera: THREE.PerspectiveCamera, style: StyleDesPoignees, reduit: boolean): Poignees {
  // Les deux faces : les facettes peintes d'Archipéo se tracent dans les deux sens (aucun triangle de plus). Toujours
  // visibles (mainteneur, 6 octobre 2026) : sans test de profondeur, dessinées après le décor, la brume et les cases du
  // choix, avant les étiquettes ; une poignée posée sur une terre se voit par-dessus. Dans le maillage, l'ordre des
  // triangles fait la profondeur : le radeau, ses cubes, puis la flèche.
  const matiere = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide, transparent: true, depthTest: false, depthWrite: false });
  // Une seule passe : transparent et à deux faces, Three tracerait les faces de dos d'abord, puis celles de face, et
  // l'ordre des triangles ne ferait plus la profondeur (la flèche en arc d'Archipéo passait sous sa bouée).
  matiere.forceSinglePass = true;
  let maillage: THREE.Mesh | null = null;
  let choix: PoigneesDuChoix | null = null;
  /** Les sommets de la forme (autour du milieu de chaque poignée, à l'échelle 1), ses couleurs en linéaire. */
  let base: Float32Array = new Float32Array(0);
  let teintes: Float32Array = new Float32Array(0);
  let debuts: number[] = [];
  let centres = new Float32Array(0);
  let echelle = 0;
  let version = 0;
  /** La poignée touchée et l'heure du toucher. */
  let touchee = -1;
  let toucheeA = 0;
  /** Ce que l'enfoncement a écrit à la dernière image (pour ne réécrire que si cela change). */
  let enfonceEcrit = 0;
  const couleur = new THREE.Color();
  const point = new THREE.Vector3();
  const regard = new THREE.Vector3();

  const vider = () => {
    if (!maillage) return;
    scene.remove(maillage);
    maillage.geometry.dispose();
    maillage = null;
  };

  /** Les sommets à l'échelle `s`, la poignée touchée enfoncée de `k` (0 à 1). */
  const ecrire = (s: number, k: number) => {
    if (!maillage || !choix) return;
    placerALEchelle(choix, s, centres);
    const pos = maillage.geometry.getAttribute('position') as THREE.BufferAttribute;
    const out = pos.array as Float32Array;
    for (let i = 0; i < choix.liste.length; i++) {
      const cx = centres[2 * i];
      const cy = centres[2 * i + 1];
      const bas = i === touchee && !reduit ? ENFONCE * s * k : 0;
      for (let v = debuts[i]; v < debuts[i + 1]; v++) {
        out[3 * v] = cx + base[3 * v] * s;
        out[3 * v + 1] = choix.z + base[3 * v + 1] * s - bas;
        out[3 * v + 2] = cy + base[3 * v + 2] * s;
      }
    }
    // Au milieu du choix : le petit radeau du bout choisi (jamais sous 28 px), puis la croix grise d'une place prise
    // (jamais plus petite qu'un radeau à l'écran).
    let piece = choix.liste.length;
    const auMilieu = (f: number) => {
      for (let v = debuts[piece]; v < debuts[piece + 1]; v++) {
        out[3 * v] = choix!.cx + base[3 * v] * f;
        out[3 * v + 1] = choix!.z + base[3 * v + 1];
        out[3 * v + 2] = choix!.cy + base[3 * v + 2] * f;
      }
      piece++;
    };
    // Le radeau du bout (côté `COTE_DU_BOUT`) à `BOUT_MIN_PX` quand celui d'une flèche (côté `COTE_DU_RADEAU`) est à `POIGNEE_MIN_PX`.
    if (choix.bout) auMilieu(Math.max(1, (s * BOUT_MIN_PX * COTE_DU_RADEAU) / (POIGNEE_MIN_PX * COTE_DU_BOUT)));
    if (choix.prise) auMilieu(Math.max(1, (s * COTE_DU_RADEAU) / (2 * choix.prise.bras)));
    pos.needsUpdate = true;
  };

  /** Les couleurs, la poignée touchée assombrie de `k` (0 à 1). */
  const teindre = (k: number) => {
    if (!maillage || !choix) return;
    const col = maillage.geometry.getAttribute('color') as THREE.BufferAttribute;
    const out = col.array as Float32Array;
    out.set(teintes);
    if (touchee >= 0 && k > 0) {
      const f = 1 - (1 - SOMBRE) * k;
      for (let v = debuts[touchee] * 3; v < debuts[touchee + 1] * 3; v++) out[v] = teintes[v] * f;
    }
    col.needsUpdate = true;
  };

  /** L'échelle qui garde chaque radeau à `POIGNEE_MIN_PX` au moins à l'écran (1 au plus près). */
  const echelleVoulue = (hauteur: number): number => {
    if (!choix) return 1;
    point.set(choix.cx, choix.z, choix.cy);
    camera.getWorldDirection(regard);
    const profondeur = Math.max(0.1, point.sub(camera.position).dot(regard));
    const parPixel = (2 * profondeur * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / Math.max(1, hauteur);
    // Couché sur l'eau, le radeau paraît moins haut que large quand la vue est de biais : la plus courte des deux compte.
    const biais = Math.max(0.5, Math.abs(regard.y));
    return Math.max(1, (POIGNEE_MIN_PX * parPixel) / (COTE_DU_RADEAU * biais));
  };

  /** Où en est l'enfoncement : 0 au repos, 1 au plus bas (à 120 ms), puis il remonte. */
  const enfoncement = (maintenant: number): number => {
    if (touchee < 0) return 0;
    const t = maintenant - toucheeA;
    if (t < 0 || t >= 2 * ENFONCE_MS) return 0;
    return t < ENFONCE_MS ? t / ENFONCE_MS : 2 - t / ENFONCE_MS;
  };

  // Le dernier point projeté (pixels CSS de la vue), et la dernière boîte : sans allocation.
  let px = 0;
  let py = 0;
  const projeter = (cam: THREE.Camera, x: number, y: number, z: number, w: number, h: number): boolean => {
    point.set(x, z, y).project(cam);
    if (point.z > 1) return false;
    px = ((point.x + 1) / 2) * w;
    py = ((1 - point.y) / 2) * h;
    return true;
  };
  const b = { x: 0, y: 0, w: 0, h: 0 };
  /** La boîte de la poignée `i` à l'écran vue par `cam` dans `b`, au moins `POIGNEE_MIN_PX` de côté ; `false` derrière la caméra. */
  const boite = (cam: THREE.Camera, i: number, w: number, h: number): boolean => {
    if (!choix) return false;
    const demi = (COTE_DU_RADEAU / 2) * Math.max(1, echelle);
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let c = 0; c < 4; c++) {
      if (!projeter(cam, centres[2 * i] + (c & 1 ? demi : -demi), centres[2 * i + 1] + (c & 2 ? demi : -demi), choix.z, w, h)) return false;
      x0 = Math.min(x0, px);
      y0 = Math.min(y0, py);
      x1 = Math.max(x1, px);
      y1 = Math.max(y1, py);
    }
    b.x = (x0 + x1) / 2;
    b.y = (y0 + y1) / 2;
    b.w = Math.max(POIGNEE_MIN_PX, x1 - x0);
    b.h = Math.max(POIGNEE_MIN_PX, y1 - y0);
    return true;
  };

  return {
    poser(p) {
      vider();
      choix = p && p.liste.length ? p : null;
      touchee = -1;
      echelle = 0;
      version++;
      if (!choix) return;
      const forme = formeDesPoignees(choix.liste, style, choix.prise, choix.bout);
      base = forme.positions;
      debuts = forme.debuts;
      centres = new Float32Array(2 * choix.liste.length);
      // Les couleurs en sRGB, passées en linéaire une fois (le rendu travaille en linéaire).
      teintes = new Float32Array(forme.couleurs.length);
      for (let i = 0; i < forme.couleurs.length; i += 3) {
        couleur.setRGB(forme.couleurs[i], forme.couleurs[i + 1], forme.couleurs[i + 2], THREE.SRGBColorSpace);
        teintes[i] = couleur.r;
        teintes[i + 1] = couleur.g;
        teintes[i + 2] = couleur.b;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(base.length), 3));
      g.setAttribute('color', new THREE.BufferAttribute(Float32Array.from(teintes), 3));
      g.setIndex(new THREE.BufferAttribute(forme.index, 1));
      maillage = new THREE.Mesh(g, matiere);
      // Les poignées ne se touchent pas dans la scène : leurs boutons, par-dessus, reçoivent le toucher.
      maillage.raycast = () => {};
      maillage.renderOrder = 9;
      maillage.frustumCulled = false;
      scene.add(maillage);
      ecrire(1, 0);
    },
    toucher(cle, maintenant) {
      if (!choix) return;
      const i = choix.liste.findIndex((q) => q.cle === cle);
      if (i < 0) return;
      if (touchee >= 0 && touchee !== i) {
        teindre(0);
        if (enfonceEcrit) ecrire(echelle, 0);
      }
      touchee = i;
      toucheeA = maintenant;
    },
    animer(maintenant, hauteur) {
      if (!maillage || !choix) return;
      const s = echelleVoulue(hauteur);
      const k = enfoncement(maintenant);
      const changeDEchelle = Math.abs(s - echelle) > PAS_D_ECHELLE * echelle;
      if (changeDEchelle || k !== enfonceEcrit) {
        if (changeDEchelle) {
          echelle = s;
          version++;
        }
        ecrire(echelle, k);
        if (k !== enfonceEcrit) teindre(k);
        enfonceEcrit = k;
      }
      if (touchee >= 0 && k === 0 && maintenant - toucheeA >= 2 * ENFONCE_MS) touchee = -1;
    },
    aLEcran(cam, w, h, out) {
      const n = choix ? Math.min(choix.liste.length, out.length / 5) : 0;
      let k = 0;
      for (let i = 0; i < n; i++) {
        if (!boite(cam, i, w, h)) continue;
        out[5 * k] = i;
        out[5 * k + 1] = b.x;
        out[5 * k + 2] = b.y;
        out[5 * k + 3] = b.w;
        out[5 * k + 4] = b.h;
        k++;
      }
      return k;
    },
    auDessus(out) {
      if (!choix) return false;
      let y = -Infinity;
      const demi = (COTE_DU_RADEAU / 2) * Math.max(1, echelle);
      for (let i = 0; i < choix.liste.length; i++) y = Math.max(y, centres[2 * i + 1] + demi);
      out.set(choix.cx, choix.z, y);
      return true;
    },
    cle(i) {
      return choix?.liste[i]?.cle ?? null;
    },
    boites(cam, w, h) {
      const n = choix ? choix.liste.length : 0;
      const out: LabelBox[] = [];
      for (let i = 0; i < n; i++) if (boite(cam, i, w, h)) out.push({ ...b });
      return out;
    },
    get version() {
      return version;
    },
    dispose() {
      vider();
      matiere.dispose();
      choix = null;
    },
  };
}

/** Jamais sous cette taille à l'écran, en pixels CSS, le petit radeau d'un bout de liaison (son bouton fait 48 px). */
const BOUT_MIN_PX = 28;
/** Le bouton d'un bout de liaison, en pixels CSS : la plus petite cible du toucher. */
const BOUT_BOUTON_PX = 48;

export interface BoutsDesLiaisons {
  /** Les bouts des liaisons posées (ou rien : un choix en cours, pendant le geste, hors du mode). */
  poser(bouts: readonly LinkEndHandle[] | null): void;
  /** À chaque image : la taille selon le zoom. */
  animer(hauteurDeLaVue: number): void;
  /**
   * Chaque bout devant la caméra, vu par `cam` (pixels CSS de la vue de `w` × `h`), écrit dans `out` (cinq nombres par
   * bout : son rang, son milieu x et y, la largeur et la hauteur de son bouton, 48 px au moins) ; rend combien.
   */
  aLEcran(cam: THREE.Camera, w: number, h: number, out: Float32Array): number;
  /** Le bout de rang `i`. */
  bout(i: number): LinkEndHandle | null;
  /** Combien de bouts sont posés. */
  readonly nombre: number;
  /** Les petits radeaux en boîtes pour les étiquettes (des obstacles durs), vus par `cam`. */
  boites(cam: THREE.Camera, w: number, h: number): LabelBox[];
  /** Change quand les bouts changent ou changent de taille : l'écart des étiquettes se refait. */
  readonly version: number;
  dispose(): void;
}

/**
 * Les petits radeaux des bouts de liaison (6 octobre 2026, choix 1a du mainteneur) : un seul maillage à couleurs par
 * sommet (6 triangles par bout, un appel), sans lumière ni brume, toujours visible (sans test de profondeur, après le
 * décor) ; jamais sous `BOUT_MIN_PX` à l'écran. Rien à lire : les boutons transparents posés par-dessus portent les noms.
 * Deux bouts à moins d'un bouton l'un de l'autre à l'écran reculent chacun le long de son ponton, vers sa côte
 * (`reculsDesBouts`), à chaque changement de zoom : aucun bouton n'en couvre un autre.
 */
export function creerBoutsDesLiaisons(scene: THREE.Scene, camera: THREE.PerspectiveCamera, style: StyleDesPoignees): BoutsDesLiaisons {
  const matiere = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide, transparent: true, depthTest: false, depthWrite: false });
  matiere.forceSinglePass = true;
  let maillage: THREE.Mesh | null = null;
  let liste: readonly LinkEndHandle[] = [];
  /** Le recul de chaque bout le long de son ponton, en cases. */
  let reculs: number[] = [];
  let base: Float32Array = new Float32Array(0);
  let debuts: number[] = [];
  let echelle = 0;
  /** Le zoom de la dernière mise à l'échelle (l'échelle voulue, sans plancher) : les reculs se refont quand il change. */
  let zoom = 0;
  let version = 0;
  const couleur = new THREE.Color();
  const point = new THREE.Vector3();
  const regard = new THREE.Vector3();
  const centre = { x: 0, y: 0, z: 0 };

  const vider = () => {
    if (!maillage) return;
    scene.remove(maillage);
    maillage.geometry.dispose();
    maillage = null;
  };
  const ecrire = (s: number) => {
    if (!maillage) return;
    const pos = maillage.geometry.getAttribute('position') as THREE.BufferAttribute;
    const out = pos.array as Float32Array;
    liste.forEach((b, i) => {
      const r = reculs[i] ?? 0;
      for (let v = debuts[i]; v < debuts[i + 1]; v++) {
        out[3 * v] = b.x - b.dx * r + base[3 * v] * s;
        out[3 * v + 1] = b.z + base[3 * v + 1];
        out[3 * v + 2] = b.y - b.dy * r + base[3 * v + 2] * s;
      }
    });
    pos.needsUpdate = true;
  };
  /** L'échelle qui garderait chaque radeau à `BOUT_MIN_PX` à l'écran, au milieu des bouts (elle suit le zoom ; 1 au moins à l'usage). */
  const echelleVoulue = (hauteur: number): number => {
    point.set(centre.x, centre.z, centre.y);
    camera.getWorldDirection(regard);
    const profondeur = Math.max(0.1, point.sub(camera.position).dot(regard));
    const parPixel = (2 * profondeur * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / Math.max(1, hauteur);
    const biais = Math.max(0.5, Math.abs(regard.y));
    return (BOUT_MIN_PX * parPixel) / (COTE_DU_BOUT * biais);
  };
  let px = 0;
  let py = 0;
  const projeter = (cam: THREE.Camera, x: number, y: number, z: number, w: number, h: number): boolean => {
    point.set(x, z, y).project(cam);
    if (point.z > 1) return false;
    px = ((point.x + 1) / 2) * w;
    py = ((1 - point.y) / 2) * h;
    return true;
  };
  /** Le bout `i`, reculé de `r` cases le long de son ponton (son recul du moment par défaut), à l'écran. */
  const projeterLeBout = (cam: THREE.Camera, i: number, w: number, h: number, d = 0, r = reculs[i] ?? 0): boolean => {
    const b = liste[i];
    return projeter(cam, b.x - b.dx * r + d, b.y - b.dy * r + d, b.z, w, h);
  };

  return {
    poser(bouts) {
      vider();
      liste = bouts ?? [];
      reculs = liste.map(() => 0);
      echelle = 0;
      zoom = 0;
      version++;
      if (!liste.length) return;
      centre.x = liste.reduce((t, b) => t + b.x, 0) / liste.length;
      centre.y = liste.reduce((t, b) => t + b.y, 0) / liste.length;
      centre.z = liste[0].z;
      const forme = formeDesBouts(liste.length, style);
      base = forme.positions;
      debuts = forme.debuts;
      const teintes = new Float32Array(forme.couleurs.length);
      for (let i = 0; i < forme.couleurs.length; i += 3) {
        couleur.setRGB(forme.couleurs[i], forme.couleurs[i + 1], forme.couleurs[i + 2], THREE.SRGBColorSpace);
        teintes[i] = couleur.r;
        teintes[i + 1] = couleur.g;
        teintes[i + 2] = couleur.b;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(base.length), 3));
      g.setAttribute('color', new THREE.BufferAttribute(teintes, 3));
      g.setIndex(new THREE.BufferAttribute(forme.index, 1));
      maillage = new THREE.Mesh(g, matiere);
      // Ils ne se touchent pas dans la scène : leurs boutons, par-dessus, reçoivent le toucher.
      maillage.raycast = () => {};
      maillage.renderOrder = 9;
      maillage.frustumCulled = false;
      scene.add(maillage);
      ecrire(1);
    },
    animer(hauteur) {
      if (!maillage) return;
      const z = echelleVoulue(hauteur);
      if (Math.abs(z - zoom) <= 0.01 * zoom) return;
      zoom = z;
      const s = Math.max(1, z);
      echelle = s;
      version++;
      // Les bouts trop proches pour leurs boutons de 48 px reculent le long de leur ponton.
      const w = hauteur * camera.aspect;
      reculs = reculsDesBouts(liste.length, (i, r) => (projeterLeBout(camera, i, w, hauteur, 0, r) ? { x: px, y: py } : null), BOUT_BOUTON_PX, COTE_DU_BOUT * s);
      ecrire(s);
    },
    aLEcran(cam, w, h, out) {
      const n = Math.min(liste.length, out.length / 5);
      const demi = (COTE_DU_BOUT / 2) * Math.max(1, echelle);
      let k = 0;
      for (let i = 0; i < n; i++) {
        if (!projeterLeBout(cam, i, w, h)) continue;
        const x = px;
        const y = py;
        if (!projeterLeBout(cam, i, w, h, demi)) continue;
        out[5 * k] = i;
        out[5 * k + 1] = x;
        out[5 * k + 2] = y;
        out[5 * k + 3] = Math.max(BOUT_BOUTON_PX, 2 * Math.abs(px - x));
        out[5 * k + 4] = Math.max(BOUT_BOUTON_PX, 2 * Math.abs(py - y));
        k++;
      }
      return k;
    },
    bout(i) {
      return liste[i] ?? null;
    },
    get nombre() {
      return liste.length;
    },
    boites(cam, w, h) {
      // Le petit radeau dessiné (pas son bouton de 48 px) : les étiquettes s'en écartent sans s'éloigner pour rien.
      const out: LabelBox[] = [];
      const demi = (COTE_DU_BOUT / 2) * Math.max(1, echelle);
      for (let i = 0; i < liste.length; i++) {
        if (!projeterLeBout(cam, i, w, h)) continue;
        const x = px;
        const y = py;
        if (!projeterLeBout(cam, i, w, h, demi)) continue;
        out.push({ x, y, w: 2 * Math.abs(px - x), h: 2 * Math.abs(py - y) });
      }
      return out;
    },
    get version() {
      return version;
    },
    dispose() {
      vider();
      matiere.dispose();
      liste = [];
      reculs = [];
    },
  };
}
