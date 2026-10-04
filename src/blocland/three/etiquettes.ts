// Les étiquettes de la scène 3D : le nom des îles ouvertes (et leur état sur la Carte), toujours face à l'écran, de
// taille fixe, par-dessus le relief ; et sur la Carte, la flèche de la prochaine destination (dans Blocland, la bulle
// d'or de la prochaine chose à faire, et le médaillon « toi » au-dessus du bonhomme). Sur la Carte, les étiquettes
// s'écartent les unes des autres, de la flèche et du fanion du bonhomme, pour que rien n'en cache rien.
// Dans Archipéo, hors de la Carte, elles s'écartent aussi des grands repères (world/cadrage.ts). Partout, elles
// s'écartent de l'interface posée sur la scène, et se montrent entières ou pas du tout (DA-10).
import * as THREE from 'three';
import { drawIslandLabel, drawMapArrow, drawMedaillon, measureIslandLabel } from '../world/labelCanvas';
import { BULLE, flottementDeLaBulle, type ImageDeLaBulle } from '../world/affordance';
import { VISAGE_DU_BONHOMME } from '../Avatar';
import { CASE, PLAQUE, caseALEcran, dessinerLaCase } from './signes';
import { reperesDe } from '../world/cadrage';
import { boitesDuTrace, placerAvecLaFlecheDOuvrage, placerEtiquettes, separateMark, type LabelBox, type LabelOffset } from '../world/labelLayout';
import { islandCenter } from '../world/terrain';
import { lecteurDeZones } from '../zonesCouvertes';
import type { WorldViewProps } from '../world/view';
import type { Instant, Monde, PartieDeLaScene } from './partie';
import type { DonneesDeLaFleche, Pointe } from './bornes';

/** Les étiquettes des îles : le nom dessiné à 40 px dans sa texture, affiché à 18 px CSS à l'écran (comme en 2D). */
const LABEL_PX = 40;
const LABEL_CSS = 18 / LABEL_PX;
/** Sans page autour (un aperçu), la bande du bas de l'écran où flotteraient les boutons : pas d'étiquette dessous. */
const LABEL_RESERVE = 72;
/** Sur la Carte, la flèche de la prochaine destination : 48 px de haut à l'écran, à 56 px au moins du fanion. */
const ARROW_CSS = 48;
const ARROW_GAP = 56;
/** Blocland, sur la Carte : le médaillon « toi », 44 px de diamètre à l'écran (son canvas : 96 px, le disque 80). */
const MEDAILLON_CSS = 44;
const MEDAILLON_CANVAS = 96;
/** L'étiquette flotte à 12 cases au-dessus du sol de son île. */
const ETIQUETTE_AU_DESSUS = 12;

export interface Etiquettes extends PartieDeLaScene {
  /** Le nom des îles (une texture par étiquette, refaite quand la liste change). */
  poser(labels: WorldViewProps['islandLabels']): void;
  /** Blocland : l'image de la bulle d'or de la Carte (`imageDeLaCarte`) ; sans elle, l'étoile. */
  poserLImageDeLaCarte(image: ImageDeLaBulle | null): void;
  vider(): void;
}

/**
 * Les étiquettes, dans l'élément `el` (sa taille en pixels CSS) ; `fleche` : la flèche « Commence ici » (sur la Carte,
 * la flèche de la destination la remplace), et `donnees` ce qu'elle montre (three/bornes.ts) ; `bonhomme` rend le
 * bonhomme, que surmonte son fanion.
 */
export function creerEtiquettes(
  monde: Monde,
  el: HTMLElement,
  camera: THREE.PerspectiveCamera,
  fleche: THREE.Object3D,
  donnees: () => Readonly<DonneesDeLaFleche>,
  bonhomme: () => THREE.Object3D,
  instant: Instant,
  /** Les plaques des créatures (three/signes.ts) : hors de la Carte, aucune étiquette ne se pose dessus. */
  plaques: { boites(cam: THREE.Camera, W: number, H: number): LabelBox[]; readonly version: number } | null = null,
): Etiquettes {
  const { scene } = monde;
  // Blocland (piste B, choisie par le mainteneur le 4 octobre 2026) : sur la Carte, la prochaine destination est la
  // bulle d'or de l'île (three/signes.ts), avec l'image de ce qu'on y fait, et le bonhomme porte le médaillon « toi ».
  // Archipéo garde la flèche et le fanion.
  const bulles = monde.habillage.signesDesObjets === 'bulles';
  // Sur la Carte, la flèche de la prochaine destination : une image toujours tournée vers l'écran (vue du ciel, un
  // cône ne se voit pas), de taille fixe, par-dessus les étiquettes ; sa pointe se pose sur l'île.
  const arrowCanvas = document.createElement('canvas');
  arrowCanvas.width = bulles ? CASE : 96;
  arrowCanvas.height = bulles ? CASE : 124;
  const arrowCtx = arrowCanvas.getContext('2d');
  /** La flèche dessinée : d'une île (`false`) ou d'un ouvrage (`true`, avec son icône, GD-7) ; redessinée quand cela change. */
  let flecheDOuvrage = false;
  /** Blocland : l'image de la bulle, et si elle est tenue au bord de l'écran (sans pointe, sa cible hors du cadre). */
  let imageDeLaBulle: ImageDeLaBulle = { icone: 'star' };
  let bulleAuBord = false;
  const dessinerLaFleche = (ouvrage: boolean) => {
    flecheDOuvrage = ouvrage;
    if (!arrowCtx) return;
    arrowCtx.clearRect(0, 0, arrowCanvas.width, arrowCanvas.height);
    if (bulles) dessinerLaCase(arrowCtx, 0, imageDeLaBulle, 'plaque', true, bulleAuBord);
    else drawMapArrow(arrowCtx, 48, 114, 104, ouvrage ? 'ouvrage' : undefined);
  };
  dessinerLaFleche(false);
  const arrowTex = new THREE.CanvasTexture(arrowCanvas);
  arrowTex.colorSpace = THREE.SRGBColorSpace;
  const mapArrow = new THREE.Sprite(new THREE.SpriteMaterial({ map: arrowTex, depthTest: false, transparent: true, sizeAttenuation: false, fog: false }));
  // La bulle : la taille de la bulle mise en avant sur l'île (`BULLE.prochainePx` pour la plaque), sa pointe en bas.
  mapArrow.userData.px = bulles
    ? { w: caseALEcran(true), h: caseALEcran(true), tip: PLAQUE.pointe.bas / CASE }
    : { w: (ARROW_CSS * arrowCanvas.width) / arrowCanvas.height, h: ARROW_CSS, tip: 114 / arrowCanvas.height };
  mapArrow.renderOrder = 12;
  mapArrow.raycast = () => {};
  mapArrow.visible = false;
  scene.add(mapArrow);
  // Blocland : le médaillon « toi », au-dessus du bonhomme sur la Carte, à la place du fanion jaune (three/bornes.ts).
  // Immobile : sur la Carte, seule la bulle de la destination bouge.
  const medaillon = bulles ? new THREE.Sprite() : null;
  if (medaillon) {
    const canvas = document.createElement('canvas');
    canvas.width = MEDAILLON_CANVAS;
    canvas.height = MEDAILLON_CANVAS;
    const ctx = canvas.getContext('2d');
    if (ctx) drawMedaillon(ctx, MEDAILLON_CANVAS / 2, MEDAILLON_CANVAS / 2 - 4, 40, VISAGE_DU_BONHOMME);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    medaillon.material = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true, sizeAttenuation: false, fog: false });
    medaillon.userData.px = { w: MEDAILLON_CSS, h: MEDAILLON_CSS };
    // Posé sur sa base : le bas du disque juste au-dessus de la tête du bonhomme.
    medaillon.center.set(0.5, 0);
    medaillon.renderOrder = 12;
    medaillon.raycast = () => {};
    medaillon.visible = false;
    scene.add(medaillon);
  }
  // Le nom des îles ouvertes : des étiquettes toujours face à l'écran, de taille fixe, par-dessus le relief.
  const labelsGroup = new THREE.Group();
  scene.add(labelsGroup);

  // Taille fixe en pixels CSS (une échelle « sans atténuation » se compte en hauteur d'écran), et sur la Carte,
  // écartées les unes des autres pour qu'aucune n'en cache une autre (le décalage se fait à l'écran, par le point
  // d'ancrage du sprite : l'étiquette reste au-dessus de son île).
  const labelAt = new THREE.Vector3();
  const ileAt = new THREE.Vector3();
  // Le cadrage où la caméra arrive : l'écart des étiquettes se calcule pour lui (une fois, gardé tant qu'il ne change
  // pas), pas image par image ; pendant qu'elle glisse, les étiquettes suivent leur île sans sauter de place.
  const camGoal = instant.but;
  const goalCamera = new THREE.PerspectiveCamera();
  let labelLayout: { key: string; offsets: LabelOffset[] } | null = null;
  // Sur la Carte, la flèche de la destination (à la place du petit chevron « Commence ici », invisible de si haut) ; si
  // le bonhomme est sur la même île, elle s'écarte de son fanion pour que les deux restent distincts.
  const toScreen = (v: THREE.Vector3, cam: THREE.Camera, W: number, H: number) => {
    labelAt.copy(v).project(cam);
    // `z` : la profondeur (au-delà de 1, le point est derrière la caméra).
    return { x: ((labelAt.x + 1) / 2) * W, y: ((1 - labelAt.y) / 2) * H, z: labelAt.z };
  };
  const beaconBase = new THREE.Vector3();
  const beaconTop = new THREE.Vector3();
  const pointeAt = new THREE.Vector3();
  /**
   * La flèche d'un ouvrage (GD-7) glisse le long de sa liaison si une étiquette occupe sa place (`placerAvecLaFlecheDOuvrage`) :
   * l'indice de la place prise parmi les `pointes` de la flèche, pour l'ouvrage dit, refait avec l'écart des étiquettes.
   */
  let placeDeLOuvrage = { ouvrage: '', i: 0 };
  /** La pointe de la flèche de la Carte : sur une île, ou sur la place prise de l'ouvrage. */
  const laPointe = (): Pointe | null => {
    const { pointes, ouvrage, pointe } = donnees();
    if (ouvrage && pointes?.length) return pointes[placeDeLOuvrage.ouvrage === ouvrage ? Math.min(placeDeLOuvrage.i, pointes.length - 1) : 0];
    return pointe;
  };
  /**
   * Le fanion et la flèche, en pixels d'écran vus par `cam` (la flèche déjà écartée du fanion) : ce que les étiquettes
   * évitent. `pointe` : la pointe de la flèche, si ce n'est pas celle d'aujourd'hui (une autre place d'un ouvrage).
   */
  const marksOnScreen = (cam: THREE.Camera, W: number, H: number, pointe: Pointe | null = laPointe()) => {
    const out: { arrow: LabelBox | null; arrowShift: LabelOffset; beacon: LabelBox | null } = { arrow: null, arrowShift: { dx: 0, dy: 0 }, beacon: null };
    const avatar = bonhomme();
    if (avatar.visible && medaillon) {
      // Blocland : le médaillon, posé au-dessus de la tête du bonhomme, de taille fixe.
      const a = toScreen(beaconBase.set(avatar.position.x, avatar.position.y + 4.5, avatar.position.z), cam, W, H);
      out.beacon = { x: a.x, y: a.y - MEDAILLON_CSS / 2, w: MEDAILLON_CSS, h: MEDAILLON_CSS };
    } else if (avatar.visible) {
      beaconBase.set(avatar.position.x, avatar.position.y + 4.5, avatar.position.z);
      beaconTop.set(avatar.position.x, avatar.position.y + 17, avatar.position.z);
      const a = toScreen(beaconBase, cam, W, H);
      const b = toScreen(beaconTop, cam, W, H);
      const h = Math.max(24, Math.abs(a.y - b.y));
      out.beacon = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, w: Math.max(24, h * 0.9), h };
    }
    if (pointe) {
      const tip = toScreen(pointeAt.set(pointe.x, pointe.z, pointe.y), cam, W, H);
      if (out.beacon) out.arrowShift = separateMark(tip, { x: out.beacon.x, y: out.beacon.y + out.beacon.h / 2 }, ARROW_GAP);
      const { w: aw, h: ah } = mapArrow.userData.px;
      out.arrow = { x: tip.x + out.arrowShift.dx, y: tip.y + out.arrowShift.dy - ah / 2, w: aw, h: ah };
    }
    return out;
  };
  const placeMarks = (onMap: boolean, t: number, reduit: boolean) => {
    // Sa pointe : au-dessus du cœur d'une île, ou d'une case de la liaison d'un ouvrage (three/bornes.ts, `poserLaFleche`).
    const pointe = laPointe();
    const show = onMap && Boolean(pointe);
    mapArrow.visible = show;
    if (medaillon) {
      const avatar = bonhomme();
      medaillon.visible = onMap && avatar.visible;
      if (medaillon.visible) {
        const perPx = 2 / (camera.projectionMatrix.elements[5] * Math.max(1, el.clientHeight));
        medaillon.position.set(avatar.position.x, avatar.position.y + 4.5, avatar.position.z);
        medaillon.scale.set(MEDAILLON_CSS * perPx, MEDAILLON_CSS * perPx, 1);
      }
    }
    const d = donnees();
    if (d.posee) fleche.visible = d.on && !show;
    if (!show || !pointe) return;
    const ouvrage = Boolean(d.ouvrage);
    if (ouvrage !== flecheDOuvrage) {
      dessinerLaFleche(ouvrage);
      arrowTex.needsUpdate = true;
    }
    mapArrow.position.set(pointe.x, pointe.z, pointe.y);
    const H = Math.max(1, el.clientHeight);
    const W = Math.max(1, el.clientWidth);
    const perPx = 2 / (camera.projectionMatrix.elements[5] * H);
    const { w: aw, h: ah, tip } = mapArrow.userData.px;
    mapArrow.scale.set(aw * perPx, ah * perPx, 1);
    const { arrow, arrowShift } = marksOnScreen(camera, W, H);
    if (!bulles || !arrow) {
      const bob = reduit ? 0 : Math.abs(Math.sin(t * 2.2)) * 6;
      mapArrow.center.set(0.5 - arrowShift.dx / aw, 1 - tip + (arrowShift.dy - bob) / ah);
      return;
    }
    // Blocland : la bulle monte et descend lentement (± 2 px, comme sur l'île ; rien avec le mouvement réduit). Sa
    // cible hors du cadre (la Carte qu'on fait glisser), elle reste entière au bord de l'écran, sans pointe, du côté
    // de sa cible (la règle des bulles de l'île, world/affordance.ts, `BULLE.bordPx`).
    const flotte = reduit ? 0 : flottementDeLaBulle(t);
    const m = BULLE.bordPx;
    const cx = Math.min(Math.max(arrow.x, m + aw / 2), W - m - aw / 2);
    const cy = Math.min(Math.max(arrow.y, m + ah / 2), H - m - ah / 2);
    const auBord = cx !== arrow.x || cy !== arrow.y;
    if (auBord !== bulleAuBord) {
      bulleAuBord = auBord;
      dessinerLaFleche(flecheDOuvrage);
      arrowTex.needsUpdate = true;
    }
    const dx = arrowShift.dx + cx - arrow.x;
    const dy = arrowShift.dy + cy - arrow.y;
    mapArrow.center.set(0.5 - dx / aw, 1 - tip + (dy - flotte) / ah);
  };
  // Archipéo : les grands repères de l'archipel (world/cadrage.ts), qu'aucune étiquette ne couvre, hors de la Carte
  // aussi (DA-17). Blocland n'en a pas : ses étiquettes ne s'écartent que de l'interface
  // et du bord du cadre, sans quitter l'aplomb de leur île (`montrees`).
  const reperes = monde.habillage.reperes === 'cadres' ? reperesDe(monde.archipel) : [];
  const repereBas = new THREE.Vector3();
  const repereHaut = new THREE.Vector3();
  /** La colonne de chaque repère à l'écran, vue par `cam` : du pied au sommet, large de son diamètre (et d'une marge). */
  const colonnes = (cam: THREE.PerspectiveCamera, W: number, H: number): LabelBox[] =>
    reperes.flatMap((r) => {
      repereBas.set(r.x, r.pied, r.y);
      repereHaut.set(r.x, r.haut, r.y);
      const loin = cam.position.distanceTo(repereHaut);
      const a = toScreen(repereBas, cam, W, H);
      if (labelAt.z > 1) return [];
      const b = toScreen(repereHaut, cam, W, H);
      if (labelAt.z > 1) return [];
      const parPx = H / (2 * loin * Math.tan((cam.fov * Math.PI) / 360));
      return [{ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, w: 2 * r.rayon * parPx + 8, h: Math.abs(a.y - b.y) }];
    });
  /** Ce que visait la caméra au dernier écart hors de la Carte. */
  const vise = { pos: new THREE.Vector3(), target: new THREE.Vector3(), w: 0, h: 0, n: 0, ids: [] as number[], zones: '', tenues: 0, plaques: -1 };
  /**
   * Les étiquettes tenues, en un nombre (sans rien allouer à chaque image) : l'indice de l'île de la flèche « Commence
   * ici » et celui de l'île la plus proche du bonhomme, plus un (0 : aucune), en `cle = fleche * 1024 + bonhomme`.
   */
  const ilesTenues = (sprites: THREE.Sprite[]): number => {
    let f = 0;
    const { on, island } = donnees();
    if (on && island)
      for (let i = 0; i < sprites.length; i++)
        if (sprites[i].userData.id === island) {
          f = i + 1;
          break;
        }
    let b = 0;
    const av = bonhomme();
    if (av.visible) {
      let bestD = Infinity;
      for (let i = 0; i < sprites.length; i++) {
        const p = sprites[i].position;
        const d = (p.x - av.position.x) ** 2 + (p.z - av.position.z) ** 2;
        if (d < bestD) {
          b = i + 1;
          bestD = d;
        }
      }
    }
    return f * 1024 + b;
  };
  const indicesTenus = (cle: number): number[] => [...new Set([Math.floor(cle / 1024) - 1, (cle % 1024) - 1])].filter((i) => i >= 0);
  // L'interface posée sur la scène (le panneau de la Carte, les bulles, les boutons) : aucune étiquette ne se pose
  // dessous (DA-10). Relue quatre fois par seconde au plus, pas à chaque image.
  // Sans page autour (un aperçu), la bande des boutons du bas reste réservée.
  const lireZones = lecteurDeZones(el, () => [{ x: el.clientWidth / 2, y: el.clientHeight - LABEL_RESERVE / 2, w: el.clientWidth, h: LABEL_RESERVE }]);
  /**
   * Sur la Carte, ce que coûte d'écarter ou de cacher chaque étiquette : la prochaine destination d'abord, une île
   * fermée en dernier ; l'indice de la destination, et celui de l'île d'arrivée de l'ouvrage qu'elle désigne, qui pèse
   * autant si cela ne tait aucun nom (`placerEtiquettes`) : son nom se pose au bout du tracé.
   */
  const carteDesEtiquettes = (sprites: THREE.Sprite[]) => {
    // La destination : l'île de la flèche, ou celle d'où part l'ouvrage qu'elle désigne (GD-7).
    const { island, depuis, arrivee } = donnees();
    const destination = island ?? depuis;
    const indice = sprites.findIndex((s) => s.userData.id === destination);
    const auBout = arrivee ? sprites.findIndex((s) => s.userData.id === arrivee) : -1;
    const weights = sprites.map((s) => (s.userData.id === destination ? 2 : s.userData.fermee ? 0.5 : 1));
    return { weights, ...(indice >= 0 ? { destination: indice } : {}), ...(auBout >= 0 ? { arrivee: auBout } : {}) };
  };
  /** Le tracé de l'ouvrage désigné à l'écran, vu par `cam` : des obstacles souples pour les étiquettes (GD-7). */
  const souplesDuTrace = (cam: THREE.Camera, W: number, H: number): LabelBox[] => {
    const trace = donnees().trace;
    if (!trace?.length) return [];
    return boitesDuTrace(trace.map((p) => toScreen(pointeAt.set(p.x, p.z, p.y), cam, W, H)));
  };
  const placeLabels = (spread: boolean) => {
    const sprites = labelsGroup.children as THREE.Sprite[];
    if (!sprites.length) return;
    const H = Math.max(1, el.clientHeight);
    const W = Math.max(1, el.clientWidth);
    const perPx = 2 / (camera.projectionMatrix.elements[5] * H);
    for (const s of sprites) s.scale.set(s.userData.px.w * perPx, s.userData.px.h * perPx, 1);
    const { zones, bulles, cle: zonesCle } = lireZones();
    // Hors de la Carte, rien d'autre que la caméra visée, la taille, l'interface et les étiquettes ne change l'écart :
    // la clé ne se refait que si l'un d'eux a bougé (pas de chaîne construite à chaque image).
    const tenuesCle = spread ? 0 : ilesTenues(sprites);
    const plaquesVersion = plaques?.version ?? 0;
    if (!spread && labelLayout && vise.plaques === plaquesVersion && vise.tenues === tenuesCle && vise.n === sprites.length && vise.w === W && vise.h === H && vise.zones === zonesCle && vise.pos.equals(camGoal.pos) && vise.target.equals(camGoal.target) && sprites.every((s, i) => vise.ids[i] === s.id)) return;
    const av = bonhomme().position;
    // Hors de la Carte, les îles dont le nom ne se tait jamais tant qu'elles se voient : celle de la flèche « Commence
    // ici » et celle du bonhomme (l'île la plus proche de lui).
    const tenues = indicesTenus(tenuesCle);
    vise.tenues = tenuesCle;
    vise.plaques = plaquesVersion;
    const montre = donnees();
    const marks = spread ? `${montre.ouvrage ?? montre.island ?? ''}:${av.toArray().map((v) => v.toFixed(0))}` : `reperes:${tenues.join(',')}:plaques${plaquesVersion}`;
    const key = `${sprites.map((s) => s.id).join(',')}@${camGoal.pos.toArray().map((v) => v.toFixed(1))}>${camGoal.target.toArray().map((v) => v.toFixed(1))}@${W}x${H}@${marks}@${zonesCle}`;
    // Sur la Carte, l'écart est autre : au retour, il se refait.
    if (spread) vise.n = -1;
    else {
      vise.pos.copy(camGoal.pos);
      vise.target.copy(camGoal.target);
      vise.w = W;
      vise.h = H;
      vise.n = sprites.length;
      vise.ids = sprites.map((s) => s.id);
      vise.zones = zonesCle;
    }
    if (labelLayout?.key === key) return;
    goalCamera.copy(camera);
    goalCamera.position.copy(camGoal.pos);
    goalCamera.lookAt(camGoal.target);
    goalCamera.updateMatrixWorld();
    const boxes = sprites.map((s) => {
      labelAt.copy(s.position).project(goalCamera);
      return { x: ((labelAt.x + 1) / 2) * W, y: ((1 - labelAt.y) / 2) * H, w: s.userData.px.w, h: s.userData.px.h };
    });
    // L'île elle-même, sous son étiquette : si l'interface la couvre, son nom ne désigne rien à l'écran.
    // Une île derrière la caméra retomberait en miroir dans le cadre : elle compte comme hors du cadre.
    const iles = sprites.map((s) => {
      const p = toScreen(ileAt.set(s.position.x, s.position.y - ETIQUETTE_AU_DESSUS, s.position.z), goalCamera, W, H);
      return p.z > 1 ? { x: -1, y: -1 } : p;
    });
    const cadre = { w: W, h: H };
    // Sur la Carte : une île fermée pèse moins (c'est son étiquette qui s'écarte d'abord), la prochaine destination plus ;
    // la flèche de la destination et le fanion du bonhomme restent visibles, aucune étiquette ne se pose dessus. Hors de
    // la Carte : les étiquettes restent au-dessus de leur île ; seules celles posées sur l'interface ou sur un grand
    // repère (Archipéo) s'en écartent, et celles que coupe le bord du cadre y rentrent. Entière ou absente : celle qui ne
    // trouve pas de place libre près de son île ne se montre pas à moitié.
    // La flèche d'un ouvrage (GD-7) : la première de ses places libres, et aucune étiquette ne se pose jamais sur elle
    // (`placerAvecLaFlecheDOuvrage`).
    const ouvrage = spread ? montre.ouvrage : null;
    const pointes: readonly Pointe[] = ouvrage ? (montre.pointes ?? []) : [];
    const marques = spread ? marksOnScreen(goalCamera, W, H, ouvrage ? null : laPointe()) : null;
    // Hors de la Carte : les grands repères d'Archipéo, et les plaques des créatures (GD-4, GD-7), qu'aucune étiquette ne couvre.
    const obstacles = marques
      ? [marques.arrow, marques.beacon].filter((b): b is LabelBox => b !== null)
      : [...colonnes(goalCamera, W, H), ...(plaques?.boites(goalCamera, W, H) ?? [])];
    const carte = spread ? carteDesEtiquettes(sprites) : null;
    // Le tracé de l'ouvrage, un obstacle souple : les étiquettes l'évitent si elles peuvent, sans se taire pour lui.
    const souples = ouvrage ? souplesDuTrace(goalCamera, W, H) : [];
    const vue = { zones, bulles, obstacles, souples, bounds: cadre, gap: 6 };
    let offsets: LabelOffset[];
    let visibles: boolean[];
    if (ouvrage && carte) {
      const fleches = pointes.map((p) => marksOnScreen(goalCamera, W, H, p).arrow).filter((b): b is LabelBox => b !== null);
      const r = placerAvecLaFlecheDOuvrage(fleches, boxes, iles, vue, carte);
      placeDeLOuvrage = { ouvrage, i: r.fleche };
      ({ offsets, visibles } = r);
    } else ({ offsets, visibles } = placerEtiquettes(boxes, iles, vue, carte, tenues));
    labelLayout = { key, offsets };
    offsets.forEach((o, i) => {
      const s = sprites[i];
      s.center.set(0.5 - o.dx / s.userData.px.w, 0.5 + o.dy / s.userData.px.h);
      s.visible = visibles[i];
    });
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
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true, sizeAttenuation: false, fog: monde.habillage.etiquettes === 'voilees' }));
        // Taille fixe à l'écran (le nom à 18 px, l'état à 16 px), quel que soit le zoom : l'échelle suit la hauteur du
        // canvas, à chaque image.
        sprite.userData.px = { w: canvas.width * LABEL_CSS, h: canvas.height * LABEL_CSS };
        sprite.userData.fermee = l.state?.id === 'fermee';
        sprite.userData.id = l.id;
        sprite.renderOrder = l.state?.id === 'fermee' ? 10 : 11;
        sprite.raycast = () => {};
        const c = islandCenter(l.id);
        sprite.position.set(c.x + 0.5, c.z + ETIQUETTE_AU_DESSUS, c.y + 0.5);
        labelsGroup.add(sprite);
      }
    },
    vider,
    poserLImageDeLaCarte: (image) => {
      const suivante = image ?? { icone: 'star' };
      if (JSON.stringify(suivante) === JSON.stringify(imageDeLaBulle)) return;
      imageDeLaBulle = suivante;
      dessinerLaFleche(flecheDOuvrage);
      arrowTex.needsUpdate = true;
    },
    animer: (t, _dt, reduit) => {
      placeMarks(instant.carte, t, reduit);
      placeLabels(instant.carte);
    },
    dispose: () => {
      arrowTex.dispose();
      mapArrow.material.dispose();
      if (medaillon) {
        medaillon.material.map?.dispose();
        medaillon.material.dispose();
      }
    },
  };
}
