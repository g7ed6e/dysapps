// Les étiquettes de la scène 3D : le nom des îles ouvertes (et leur état sur la Carte), toujours face à l'écran, de
// taille fixe, par-dessus le relief ; et sur la Carte, la flèche de la prochaine destination. Sur la Carte, les
// étiquettes s'écartent les unes des autres, de la flèche et du fanion du bonhomme, pour que rien n'en cache rien.
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { drawIslandLabel, drawMapArrow, measureIslandLabel } from '../world/labelCanvas';
import { layoutLabels, separateMark, type LabelBox, type LabelOffset } from '../world/labelLayout';
import { islandCenter } from '../world/terrain';
import type { WorldViewProps } from '../world/view';
import type { Instant, Monde, PartieDeLaScene } from './partie';

/** Les étiquettes des îles : le nom dessiné à 40 px dans sa texture, affiché à 18 px CSS à l'écran (comme en 2D). */
const LABEL_PX = 40;
const LABEL_CSS = 18 / LABEL_PX;
/** Sur la Carte, la bande du bas de l'écran où flottent les boutons (Carte, Blocs, École) : pas d'étiquette dessous. */
const LABEL_RESERVE = 72;
/** Sur la Carte, la flèche de la prochaine destination : 48 px de haut à l'écran, à 56 px au moins du fanion. */
const ARROW_CSS = 48;
const ARROW_GAP = 56;

export interface Etiquettes extends PartieDeLaScene {
  /** Le nom des îles (une texture par étiquette, refaite quand la liste change). */
  poser(labels: WorldViewProps['islandLabels']): void;
  vider(): void;
}

/**
 * Les étiquettes, dans l'élément `el` (sa taille en pixels CSS) ; `fleche` : la flèche « Commence ici » (sur la Carte,
 * la flèche de la destination la remplace) ; `bonhomme` rend le bonhomme, que surmonte son fanion.
 */
export function creerEtiquettes(
  monde: Monde,
  el: HTMLElement,
  camera: THREE.PerspectiveCamera,
  fleche: THREE.Object3D,
  bonhomme: () => THREE.Object3D,
  instant: Instant,
): Etiquettes {
  const { scene, archipeo } = monde;
  // Sur la Carte, la flèche de la prochaine destination : une image toujours tournée vers l'écran (vue du ciel, un
  // cône ne se voit pas), de taille fixe, par-dessus les étiquettes ; sa pointe se pose sur l'île.
  const arrowCanvas = document.createElement('canvas');
  arrowCanvas.width = 96;
  arrowCanvas.height = 124;
  const arrowCtx = arrowCanvas.getContext('2d');
  if (arrowCtx) drawMapArrow(arrowCtx, 48, 114, 104);
  const arrowTex = new THREE.CanvasTexture(arrowCanvas);
  arrowTex.colorSpace = THREE.SRGBColorSpace;
  const mapArrow = new THREE.Sprite(new THREE.SpriteMaterial({ map: arrowTex, depthTest: false, transparent: true, sizeAttenuation: false, fog: false }));
  mapArrow.userData.px = { w: (ARROW_CSS * arrowCanvas.width) / arrowCanvas.height, h: ARROW_CSS, tip: 114 / arrowCanvas.height };
  mapArrow.renderOrder = 12;
  mapArrow.raycast = () => {};
  mapArrow.visible = false;
  scene.add(mapArrow);
  // Le nom des îles ouvertes : des étiquettes toujours face à l'écran, de taille fixe, par-dessus le relief.
  const labelsGroup = new THREE.Group();
  scene.add(labelsGroup);

  // Taille fixe en pixels CSS (une échelle « sans atténuation » se compte en hauteur d'écran), et sur la Carte,
  // écartées les unes des autres pour qu'aucune n'en cache une autre (le décalage se fait à l'écran, par le point
  // d'ancrage du sprite : l'étiquette reste au-dessus de son île).
  const labelAt = new THREE.Vector3();
  // Le cadrage où la caméra arrive : l'écart des étiquettes se calcule pour lui (une fois, gardé tant qu'il ne change
  // pas), pas image par image ; pendant qu'elle glisse, les étiquettes suivent leur île sans sauter de place.
  const camGoal = instant.but;
  const goalCamera = new THREE.PerspectiveCamera();
  let labelLayout: { key: string; offsets: LabelOffset[] } | null = null;
  // Sur la Carte, la flèche de la destination (à la place du petit chevron « Commence ici », invisible de si haut) ; si
  // le bonhomme est sur la même île, elle s'écarte de son fanion pour que les deux restent distincts.
  const toScreen = (v: THREE.Vector3, cam: THREE.Camera, W: number, H: number) => {
    labelAt.copy(v).project(cam);
    return { x: ((labelAt.x + 1) / 2) * W, y: ((1 - labelAt.y) / 2) * H };
  };
  const beaconBase = new THREE.Vector3();
  const beaconTop = new THREE.Vector3();
  /** Le fanion et la flèche, en pixels d'écran vus par `cam` (la flèche déjà écartée du fanion) : ce que les étiquettes évitent. */
  const marksOnScreen = (cam: THREE.Camera, W: number, H: number) => {
    const out: { arrow: LabelBox | null; arrowShift: LabelOffset; beacon: LabelBox | null } = { arrow: null, arrowShift: { dx: 0, dy: 0 }, beacon: null };
    const avatar = bonhomme();
    if (avatar.visible) {
      beaconBase.set(avatar.position.x, avatar.position.y + 4.5, avatar.position.z);
      beaconTop.set(avatar.position.x, avatar.position.y + 17, avatar.position.z);
      const a = toScreen(beaconBase, cam, W, H);
      const b = toScreen(beaconTop, cam, W, H);
      const h = Math.max(24, Math.abs(a.y - b.y));
      out.beacon = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, w: Math.max(24, h * 0.9), h };
    }
    if (fleche.userData.island) {
      const tip = toScreen(mapArrow.position, cam, W, H);
      if (out.beacon) out.arrowShift = separateMark(tip, { x: out.beacon.x, y: out.beacon.y + out.beacon.h / 2 }, ARROW_GAP);
      const { w: aw, h: ah } = mapArrow.userData.px;
      out.arrow = { x: tip.x + out.arrowShift.dx, y: tip.y + out.arrowShift.dy - ah / 2, w: aw, h: ah };
    }
    return out;
  };
  const placeMarks = (onMap: boolean, t: number, reduit: boolean) => {
    const island = fleche.userData.island as BiomeId | null;
    const show = onMap && Boolean(island);
    mapArrow.visible = show;
    if (fleche.userData.island !== undefined) fleche.visible = Boolean(fleche.userData.on) && !show;
    if (!show || !island) return;
    const c = islandCenter(island);
    mapArrow.position.set(c.x + 0.5, c.z + 8, c.y + 0.5);
    const H = Math.max(1, el.clientHeight);
    const W = Math.max(1, el.clientWidth);
    const perPx = 2 / (camera.projectionMatrix.elements[5] * H);
    const { w: aw, h: ah, tip } = mapArrow.userData.px;
    mapArrow.scale.set(aw * perPx, ah * perPx, 1);
    const { arrowShift } = marksOnScreen(camera, W, H);
    const bob = reduit ? 0 : Math.abs(Math.sin(t * 2.2)) * 6;
    mapArrow.center.set(0.5 - arrowShift.dx / aw, 1 - tip + (arrowShift.dy - bob) / ah);
  };
  const placeLabels = (spread: boolean) => {
    const sprites = labelsGroup.children as THREE.Sprite[];
    if (!sprites.length) return;
    const H = Math.max(1, el.clientHeight);
    const W = Math.max(1, el.clientWidth);
    const perPx = 2 / (camera.projectionMatrix.elements[5] * H);
    for (const s of sprites) s.scale.set(s.userData.px.w * perPx, s.userData.px.h * perPx, 1);
    if (!spread) {
      if (labelLayout) for (const s of sprites) s.center.set(0.5, 0.5);
      labelLayout = null;
      return;
    }
    const av = bonhomme().position;
    const marks = `${fleche.userData.island ?? ''}:${av.toArray().map((v) => v.toFixed(0))}`;
    const key = `${sprites.map((s) => s.id).join(',')}@${camGoal.pos.toArray().map((v) => v.toFixed(1))}>${camGoal.target.toArray().map((v) => v.toFixed(1))}@${W}x${H}@${marks}`;
    if (labelLayout?.key !== key) {
      goalCamera.copy(camera);
      goalCamera.position.copy(camGoal.pos);
      goalCamera.lookAt(camGoal.target);
      goalCamera.updateMatrixWorld();
      const boxes = sprites.map((s) => {
        labelAt.copy(s.position).project(goalCamera);
        return { x: ((labelAt.x + 1) / 2) * W, y: ((1 - labelAt.y) / 2) * H, w: s.userData.px.w, h: s.userData.px.h };
      });
      // Une île fermée pèse moins : c'est son étiquette qui s'écarte d'abord.
      const weights = sprites.map((s) => (s.userData.fermee ? 0.5 : 1));
      // La flèche de la destination et le fanion du bonhomme restent visibles : aucune étiquette ne se pose dessus.
      const { arrow, beacon } = marksOnScreen(goalCamera, W, H);
      const obstacles = [arrow, beacon].filter((b): b is LabelBox => b !== null);
      labelLayout = { key, offsets: layoutLabels(boxes, 6, { w: W, h: H - LABEL_RESERVE }, weights, obstacles) };
      labelLayout.offsets.forEach((o, i) => {
        const s = sprites[i];
        s.center.set(0.5 - o.dx / s.userData.px.w, 0.5 + o.dy / s.userData.px.h);
      });
    }
  };

  const vider = () => {
    for (const s of [...labelsGroup.children] as THREE.Sprite[]) {
      s.material.map?.dispose();
      s.material.dispose();
      labelsGroup.remove(s);
    }
  };

  return {
    poser: (labels) => {
      vider();
      for (const l of labels ?? []) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        const size = measureIslandLabel(ctx, l.text, LABEL_PX, l.state);
        canvas.width = Math.ceil(size.w + 4);
        canvas.height = Math.ceil(size.h + 4);
        drawIslandLabel(ctx, l.text, canvas.width / 2, canvas.height / 2, LABEL_PX, l.state);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        // Archipéo : la brume de profondeur ne voile jamais un nom d'île (DA-02).
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true, sizeAttenuation: false, fog: !archipeo }));
        // Taille fixe à l'écran (le nom à 18 px, l'état à 16 px), quel que soit le zoom : l'échelle suit la hauteur du
        // canvas, à chaque image.
        sprite.userData.px = { w: canvas.width * LABEL_CSS, h: canvas.height * LABEL_CSS };
        sprite.userData.fermee = l.state?.id === 'fermee';
        sprite.renderOrder = l.state?.id === 'fermee' ? 10 : 11;
        sprite.raycast = () => {};
        const c = islandCenter(l.id);
        sprite.position.set(c.x + 0.5, c.z + 12, c.y + 0.5);
        labelsGroup.add(sprite);
      }
    },
    vider,
    animer: (t, _dt, reduit) => {
      placeMarks(instant.carte, t, reduit);
      placeLabels(instant.carte);
    },
    dispose: () => {
      arrowTex.dispose();
      mapArrow.material.dispose();
    },
  };
}
