// Les étiquettes de la scène 3D : le nom des îles ouvertes (et leur état sur la Carte), toujours face à l'écran, de
// taille fixe, par-dessus le relief ; et sur la Carte, la bulle de la prochaine chose à faire (plaque bordée d'or dans
// Blocland, hexagone bordé de lumière dans Archipéo) et le médaillon « toi » au-dessus du bonhomme. Sur la Carte, les
// étiquettes s'écartent les unes des autres, de la bulle et du médaillon, pour que rien n'en cache rien.
// Dans Archipéo, hors de la Carte, elles s'écartent aussi des grands repères (world/framing.ts). Partout, elles
// s'écartent de l'interface posée sur la scène, et se montrent entières ou pas du tout (DA-10).
import * as THREE from 'three';
import { COULEURS_DES_SIGNES, drawIslandLabel, drawMedaillon, measureIslandLabel } from '../world/labelCanvas';
import { BULLE, flottementDeLaBulle, type ImageDeLaBulle } from '../world/affordance';
import { visageDuJoueur } from '../world/characters/face';
import { CASE, PLAQUE, caseALEcran, dessinerLaCase } from './signs';
import { tenirDansLaPlace, type PlaceLue } from '../freeSpace';
import { reperesDe } from '../world/framing';
import { layoutVersion } from '../world/placement';
import { boitesDesBornes } from './camera/framings';
import type { BiomeId } from '../biomes';
import { avecLIleTouchee, boiteDesPoints, boitesDuTrace, placerAvecLaFlecheDOuvrage, placerDAbordSimplement, recoupe, placerEtiquettes, replierLesSignes, separateMark, type LabelBox, type LabelOffset } from '../world/labelLayout';
import { HAUTEUR_DES_NOMS, islandCenter } from '../world/terrain';
import { bridgesOf, otherEnd } from '../world/archipelago';
import { estUnBiome } from '../biomes';
import { lecteurDeZones } from '../coveredZones';
import type { IslandLabel, WorldViewProps } from '../world/view';
import type { Instant, Monde, PartieDeLaScene } from './scenePart';
import type { DonneesDeLaFleche, Pointe } from './markers';

/** Les étiquettes des îles : le nom dessiné à 40 px dans sa texture, affiché à 18 px CSS à l'écran. */
const LABEL_PX = 40;
const LABEL_CSS = 18 / LABEL_PX;
/** Sans page autour (un aperçu), la bande du bas de l'écran où flotteraient les boutons : pas d'étiquette dessous. */
const LABEL_RESERVE = 72;
/** Sur la Carte, la bulle de la prochaine destination : à 56 px au moins du médaillon. */
const ARROW_GAP = 56;
/** Sur la Carte : le médaillon « toi », 44 px de diamètre à l'écran (son canvas : 96 px, le disque 80). */
export const MEDAILLON_CSS = 44;
const MEDAILLON_CANVAS = 96;
/** L'étiquette flotte à 12 cases au-dessus du sol de son île (le cadrage de la Carte en tient compte). */
const ETIQUETTE_AU_DESSUS = HAUTEUR_DES_NOMS;

/**
 * Sur la Carte, ce que pèse le nom de chaque île (`labels`, dans l'ordre des étiquettes) quand la place manque : le plus
 * lourd se montre d'abord, le plus léger s'écarte ou se tait le premier (world/labelLayout.ts). La prochaine destination
 * pèse 2 ; une île fermée 0,5, sauf celle qu'un ouvrage relie à une île ouverte (on peut l'ouvrir ensuite) : 1, comme une
 * île ouverte (référent dys, 9 octobre 2026 : le Préau des délégués, au 6e, fermé, ne se tait plus le premier) ; l'île
 * touchée (`selected`) au moins 1. Depuis GD-9, toutes les îles d'un archipel se relient deux à deux : une île fermée ne
 * pèse plus 0,5 que si aucune île de son archipel n'est ouverte.
 */
export function mapLabelWeights(labels: readonly { id: string; closed: boolean }[], destination: string | null | undefined, selected: string | null = null): number[] {
  const open = new Set(labels.filter((l) => !l.closed).map((l) => l.id));
  const nextToOpen = (id: string) => estUnBiome(id) && bridgesOf(id).some((b) => open.has(otherEnd(b, id)));
  return labels.map((l) => (l.id === destination ? 2 : !l.closed || l.id === selected || nextToOpen(l.id) ? 1 : 0.5));
}

/** Une forme d'étiquette : sa texture et sa taille à l'écran (pixels CSS). */
interface FormeDeLEtiquette {
  map: THREE.CanvasTexture;
  w: number;
  h: number;
}
/** Les formes d'une étiquette : avec le bloc de son île, et sans lui (seulement si elle en a un). */
interface FormesDeLEtiquette {
  avec: FormeDeLEtiquette;
  sans?: FormeDeLEtiquette;
}

/** L'étiquette dessinée dans sa texture (le nom à `LABEL_PX`), ou rien sans contexte 2D. */
function formeDeLEtiquette(text: string, state?: IslandLabel['state'], bloc?: IslandLabel['bloc']): FormeDeLEtiquette | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const size = measureIslandLabel(ctx, text, LABEL_PX, state, bloc);
  canvas.width = Math.ceil(size.w + 4);
  canvas.height = Math.ceil(size.h + 4);
  drawIslandLabel(ctx, text, canvas.width / 2, canvas.height / 2, LABEL_PX, state, bloc);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return { map, w: canvas.width * LABEL_CSS, h: canvas.height * LABEL_CSS };
}

export interface Etiquettes extends PartieDeLaScene {
  /** Le nom des îles (une texture par étiquette, refaite quand la liste change). */
  poser(labels: WorldViewProps['islandLabels']): void;
  /** L'image de la bulle mise en avant de la Carte (`imageDeLaCarte`) ; sans elle, l'étoile. */
  poserLImageDeLaCarte(image: ImageDeLaBulle | null): void;
  /**
   * Sur la Carte : la bulle mise en avant est tenue au bord de la place libre (sa cible hors du cadre, la Carte glissée
   * ou zoomée) et le point (`x`, `y`, pixels CSS de la vue) est sur elle. La toucher ramène la vue d'ensemble.
   */
  bulleAuBordSous(x: number, y: number): boolean;
  /**
   * Le lieu choisi dans « Modifier le plan » (GD-9), ou rien : son étiquette se tait le temps du choix (son nom est sur
   * son fantôme, three/arrange.ts) ; l'écart des autres ne change pas.
   */
  cacher(id: string | null): void;
  /**
   * L'île touchée, ou rien : sur la Carte, l'île fermée choisie (son chemin d'ouvrages montré) ; ailleurs, l'île dont la
   * fiche est ouverte. Son nom ne se tait jamais tant que l'île se voit, comme celui de la destination (référent dys,
   * 9 octobre 2026).
   */
  keepShown(id: string | null): void;
  /**
   * Pendant le glissé du choix (7 octobre 2026, choix 1b du mainteneur) : la zone de la grille, en cases du monde, à la
   * hauteur `z` ; toute étiquette dont le rectangle à l'écran recoupe celui de la zone s'estompe (`ESTOMPEE`) ; rien :
   * toutes reviennent.
   */
  estomper(zone: { x0: number; y0: number; x1: number; y1: number; z: number } | null): void;
  vider(): void;
}

/** L'opacité d'une étiquette estompée pendant le glissé du choix : son nom se devine, la grille se lit. */
const ESTOMPEE = 0.25;

/**
 * Les étiquettes, dans l'élément `el` (sa taille en pixels CSS) ; `donnees` : ce que montre la flèche de la destination
 * (three/markers.ts), que la bulle de la Carte dessine ; `bonhomme` rend le bonhomme, que surmonte son médaillon.
 */
export function creerEtiquettes(
  monde: Monde,
  el: HTMLElement,
  camera: THREE.PerspectiveCamera,
  donnees: () => Readonly<DonneesDeLaFleche>,
  bonhomme: () => THREE.Object3D,
  instant: Instant,
  /** Les plaques des créatures (three/signs.ts) : hors de la Carte, aucune étiquette ne se pose dessus. */
  plaques: { boites(cam: THREE.Camera, W: number, H: number): LabelBox[]; readonly version: number } | null = null,
  /**
   * La place que l'interface laisse libre dans la vue (../freeSpace.ts, `lecteurDePlaceLibre`) : la bulle d'or de la
   * Carte y reste entière ; sans elle (les tests), toute la vue.
   */
  lirePlace: ((contexte: string) => PlaceLue) | null = null,
  /**
   * Les poignées du mode « Modifier le plan » (three/arrangeHandles.ts) : des obstacles durs, aucune étiquette ne se
   * pose jamais dessus (intention du directeur artistique, 6 octobre 2026).
   */
  poignees: { boites(cam: THREE.Camera, W: number, H: number): LabelBox[]; readonly version: number } | null = null,
): Etiquettes {
  const { scene } = monde;
  // Blocland (piste B, choisie par le mainteneur le 4 octobre 2026), puis Archipéo (choix « 1a », même jour) : sur la
  // Carte, la prochaine destination est la bulle mise en avant de l'île (three/signs.ts), dans la forme de l'univers
  // (`formeDesSignes`), avec l'image de ce qu'on y fait, et le bonhomme porte le médaillon « toi ».
  const forme = monde.habillage.formeDesSignes;
  // Sur la Carte, la bulle de la prochaine destination : une image toujours tournée vers l'écran, de taille fixe,
  // par-dessus les étiquettes ; sa pointe se pose sur l'île ou l'ouvrage.
  const arrowCanvas = document.createElement('canvas');
  arrowCanvas.width = CASE;
  arrowCanvas.height = CASE;
  const arrowCtx = arrowCanvas.getContext('2d');
  /** L'image de la bulle, et si elle est tenue au bord de la place libre (sans pointe, sa cible hors du cadre). */
  let imageDeLaBulle: ImageDeLaBulle = { icone: 'star' };
  let bulleAuBord = false;
  const dessinerLaFleche = () => {
    if (!arrowCtx) return;
    arrowCtx.clearRect(0, 0, arrowCanvas.width, arrowCanvas.height);
    dessinerLaCase(arrowCtx, 0, imageDeLaBulle, forme, true, bulleAuBord);
  };
  dessinerLaFleche();
  const arrowTex = new THREE.CanvasTexture(arrowCanvas);
  arrowTex.colorSpace = THREE.SRGBColorSpace;
  const mapArrow = new THREE.Sprite(new THREE.SpriteMaterial({ map: arrowTex, depthTest: false, transparent: true, sizeAttenuation: false, fog: false }));
  // La bulle : la taille de la bulle mise en avant sur l'île (`BULLE.prochainePx` pour la plaque), sa pointe en bas.
  mapArrow.userData.px = { w: caseALEcran(true), h: caseALEcran(true), tip: PLAQUE.pointe.bas / CASE };
  mapArrow.renderOrder = 12;
  // Tenue au bord, la bulle se dessine loin de sa cible, qui est hors du cadre : sans cela, Three.js l'écarterait de
  // l'image avec elle.
  mapArrow.frustumCulled = false;
  mapArrow.raycast = () => {};
  mapArrow.visible = false;
  scene.add(mapArrow);
  // Le médaillon « toi », au-dessus du bonhomme sur la Carte, avec le visage du joueur (world/characters/face.ts) et
  // les couleurs des bulles de l'univers. Immobile : sur la Carte, seule la bulle de la destination bouge.
  const medaillon = new THREE.Sprite();
  {
    const canvas = document.createElement('canvas');
    canvas.width = MEDAILLON_CANVAS;
    canvas.height = MEDAILLON_CANVAS;
    const ctx = canvas.getContext('2d');
    if (ctx) drawMedaillon(ctx, MEDAILLON_CANVAS / 2, MEDAILLON_CANVAS / 2 - 4, 40, visageDuJoueur(monde.habillage), COULEURS_DES_SIGNES[forme]);
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
  // Sur la Carte, la bulle de la destination ; si le bonhomme est sur la même île, elle s'écarte de son médaillon pour
  // que les deux restent distincts.
  const toScreen = (v: THREE.Vector3, cam: THREE.Camera, W: number, H: number) => {
    labelAt.copy(v).project(cam);
    // `z` : la profondeur (au-delà de 1, le point est derrière la caméra).
    return { x: ((labelAt.x + 1) / 2) * W, y: ((1 - labelAt.y) / 2) * H, z: labelAt.z };
  };
  /** L'île touchée (`keepShown`), dont le nom ne se tait jamais. */
  let keptId: string | null = null;
  const beaconBase = new THREE.Vector3();
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
   * La place libre (`null` : toute la vue), relue quatre fois par seconde au plus, et tout de suite à chaque ouverture de
   * la Carte (la clé change ; le lecteur relit aussi quand une fiche s'ouvre, WorldCanvas.tsx).
   */
  let place: PlaceLue | null = null;
  let ouvertures = 0;
  let ouverte = false;
  let placeCle = '';
  let placeLue = -Infinity;
  const relireLaPlace = () => {
    const cle = `carte:bulle|${ouvertures}`;
    if (!lirePlace || (cle === placeCle && instant.now - placeLue < 250)) return;
    placeCle = cle;
    placeLue = instant.now;
    place = lirePlace(cle);
  };
  /**
   * Le centre de la bulle (`x`, `y`, sa taille `w` × `h`, pixels CSS d'une vue `W` × `H`) ramené dans la place
   * libre, à `BULLE.bordPx` de ses bords (la règle des bulles de l'île, world/affordance.ts) : jamais sous la barre, la
   * colonne de Pause et des classes, « Recentrer », ni une fiche.
   */
  const tenirLaBulle = (x: number, y: number, w: number, h: number, W: number, H: number) => tenirDansLaPlace(x, y, w, h, W, H, place, BULLE.bordPx);
  /** La bulle d'or à l'écran, telle que posée à la dernière image (pixels CSS), et si elle est tenue au bord. */
  const bulleALEcran = { x: 0, y: 0, w: 0, h: 0, visible: false };
  /**
   * Le médaillon et la bulle, en pixels d'écran vus par `cam` (la bulle déjà écartée du médaillon et tenue dans la
   * place libre) : ce que les étiquettes évitent. `pointe` : la pointe de la flèche, si ce n'est pas celle d'aujourd'hui (une autre place d'un ouvrage).
   */
  const marksOnScreen = (cam: THREE.Camera, W: number, H: number, pointe: Pointe | null = laPointe()) => {
    const out: { arrow: LabelBox | null; arrowShift: LabelOffset; beacon: LabelBox | null } = { arrow: null, arrowShift: { dx: 0, dy: 0 }, beacon: null };
    const avatar = bonhomme();
    if (avatar.visible) {
      // Le médaillon, posé au-dessus de la tête du bonhomme, de taille fixe.
      const a = toScreen(beaconBase.set(avatar.position.x, avatar.position.y + 4.5, avatar.position.z), cam, W, H);
      out.beacon = { x: a.x, y: a.y - MEDAILLON_CSS / 2, w: MEDAILLON_CSS, h: MEDAILLON_CSS };
    }
    if (pointe) {
      const tip = toScreen(pointeAt.set(pointe.x, pointe.z, pointe.y), cam, W, H);
      if (out.beacon) out.arrowShift = separateMark(tip, { x: out.beacon.x, y: out.beacon.y + out.beacon.h / 2 }, ARROW_GAP);
      const { w: aw, h: ah } = mapArrow.userData.px;
      out.arrow = { x: tip.x + out.arrowShift.dx, y: tip.y + out.arrowShift.dy - ah / 2, w: aw, h: ah };
      const c = tenirLaBulle(out.arrow.x, out.arrow.y, aw, ah, W, H);
      out.arrow.x = c.x;
      out.arrow.y = c.y;
    }
    return out;
  };
  const placeMarks = (onMap: boolean, t: number, reduit: boolean) => {
    // Sa pointe : au-dessus du cœur d'une île, ou d'une case de la liaison d'un ouvrage (three/markers.ts, `poserLaFleche`).
    const pointe = laPointe();
    const show = onMap && Boolean(pointe);
    mapArrow.visible = show;
    const H = Math.max(1, el.clientHeight);
    const W = Math.max(1, el.clientWidth);
    const perPx = 2 / (camera.projectionMatrix.elements[5] * H);
    const avatar = bonhomme();
    medaillon.visible = onMap && avatar.visible;
    if (medaillon.visible) {
      medaillon.position.set(avatar.position.x, avatar.position.y + 4.5, avatar.position.z);
      medaillon.scale.set(MEDAILLON_CSS * perPx, MEDAILLON_CSS * perPx, 1);
    }
    bulleALEcran.visible = false;
    if (show !== ouverte) {
      ouverte = show;
      if (show) ouvertures++;
    }
    if (!show || !pointe) return;
    relireLaPlace();
    mapArrow.position.set(pointe.x, pointe.z, pointe.y);
    const { w: aw, h: ah, tip } = mapArrow.userData.px;
    mapArrow.scale.set(aw * perPx, ah * perPx, 1);
    const tipAt = toScreen(pointeAt.set(pointe.x, pointe.z, pointe.y), camera, W, H);
    const { arrow, arrowShift } = marksOnScreen(camera, W, H, pointe);
    if (!arrow) return;
    // La bulle monte et descend lentement (± 2 px, comme sur l'île ; rien avec le mouvement réduit). Sa
    // cible hors du cadre (la Carte glissée ou zoomée), elle reste entière au bord de la place libre, sans pointe, du
    // côté de sa cible (`marksOnScreen` l'y a déjà tenue).
    const flotte = reduit ? 0 : flottementDeLaBulle(t);
    const cx = arrow.x;
    const cy = arrow.y;
    const libreX = tipAt.x + arrowShift.dx;
    const libreY = tipAt.y + arrowShift.dy - ah / 2;
    const auBord = Math.abs(cx - libreX) > 0.5 || Math.abs(cy - libreY) > 0.5;
    bulleALEcran.x = cx;
    bulleALEcran.y = cy;
    bulleALEcran.w = aw;
    bulleALEcran.h = ah;
    bulleALEcran.visible = auBord;
    if (auBord !== bulleAuBord) {
      bulleAuBord = auBord;
      dessinerLaFleche();
      arrowTex.needsUpdate = true;
    }
    const dx = arrowShift.dx + cx - libreX;
    const dy = arrowShift.dy + cy - libreY;
    mapArrow.center.set(0.5 - dx / aw, 1 - tip + (dy - flotte) / ah);
  };
  // Archipéo : les grands repères de l'archipel (world/framing.ts), qu'aucune étiquette ne couvre, hors de la Carte
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
  const vise = { pos: new THREE.Vector3(), target: new THREE.Vector3(), w: 0, h: 0, n: 0, ids: [] as number[], zones: '', tenues: 0, plaques: -1, poignees: -1, disposition: -1 };
  /**
   * Les étiquettes tenues, en un nombre (sans rien allouer à chaque image) : l'indice de l'île de la flèche « Commence
   * ici », celui de l'île touchée (`keepShown`) et celui de l'île la plus proche du bonhomme, plus un (0 : aucune), en
   * `cle = (fleche * 1024 + touchee) * 1024 + bonhomme`.
   */
  const ilesTenues = (sprites: THREE.Sprite[]): number => {
    let f = 0;
    let k = 0;
    const { on, island } = donnees();
    for (let i = 0; i < sprites.length; i++) {
      const id = sprites[i].userData.id;
      if (on && island && id === island && !f) f = i + 1;
      if (keptId !== null && id === keptId && !k) k = i + 1;
    }
    return (f * 1024 + k) * 1024 + avatarIslandIndex(sprites) + 1;
  };
  /** L'indice de l'île la plus proche du bonhomme, -1 s'il ne se voit pas. */
  const avatarIslandIndex = (sprites: THREE.Sprite[]): number => {
    const av = bonhomme();
    if (!av.visible) return -1;
    let b = -1;
    let bestD = Infinity;
    for (let i = 0; i < sprites.length; i++) {
      const p = sprites[i].position;
      const d = (p.x - av.position.x) ** 2 + (p.z - av.position.z) ** 2;
      if (d < bestD) {
        b = i;
        bestD = d;
      }
    }
    return b;
  };
  const indicesTenus = (cle: number): number[] => [...new Set([Math.floor(cle / 1024 ** 2) - 1, (Math.floor(cle / 1024) % 1024) - 1, (cle % 1024) - 1])].filter((i) => i >= 0);
  // L'interface posée sur la scène (le panneau de la Carte, les bulles, les boutons) : aucune étiquette ne se pose
  // dessous (DA-10). Relue quatre fois par seconde au plus, pas à chaque image.
  // Sans page autour (un aperçu), la bande des boutons du bas reste réservée.
  const lireZones = lecteurDeZones(el, () => [{ x: el.clientWidth / 2, y: el.clientHeight - LABEL_RESERVE / 2, w: el.clientWidth, h: LABEL_RESERVE }]);
  /**
   * Sur la Carte, ce que coûte d'écarter ou de cacher chaque étiquette (`mapLabelWeights`) : la prochaine destination
   * d'abord, une île fermée qu'aucun ouvrage ne relie à une île ouverte en dernier ; l'indice de la destination, et celui
   * de l'île d'arrivée de l'ouvrage qu'elle désigne, qui pèse autant si cela ne tait aucun nom (`placerEtiquettes`) : son
   * nom se pose au bout du tracé.
   */
  /** Avec `sansLIleTouchee`, la Carte où rien n'est touché (`avecLIleTouchee`). */
  const carteDesEtiquettes = (sprites: THREE.Sprite[], sansLIleTouchee = false) => {
    const touchee = sansLIleTouchee ? null : keptId;
    // La destination : l'île de la flèche, ou celle d'où part l'ouvrage qu'elle désigne (GD-7).
    const { island, depuis, arrivee } = donnees();
    const destination = island ?? depuis;
    const indice = sprites.findIndex((s) => s.userData.id === destination);
    const auBout = arrivee ? sprites.findIndex((s) => s.userData.id === arrivee) : -1;
    const weights = mapLabelWeights(
      sprites.map((s) => ({ id: s.userData.id as string, closed: Boolean(s.userData.fermee) })),
      destination,
      touchee,
    );
    // L'île du bonhomme et l'île touchée : leur nom ne se tait jamais, comme celui de la destination (DA, HG-3 ;
    // référent dys, 9 octobre 2026).
    const avatarIsland = avatarIslandIndex(sprites);
    const selected = touchee === null ? -1 : sprites.findIndex((s) => s.userData.id === touchee);
    return {
      weights,
      ...(indice >= 0 ? { destination: indice } : {}),
      ...(auBout >= 0 ? { arrivee: auBout } : {}),
      ...(avatarIsland >= 0 ? { avatarIsland } : {}),
      ...(selected >= 0 ? { selected } : {}),
    };
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
    const poigneesVersion = poignees?.version ?? 0;
    const disposition = layoutVersion();
    if (!spread && labelLayout && vise.disposition === disposition && vise.plaques === plaquesVersion && vise.poignees === poigneesVersion && vise.tenues === tenuesCle && vise.n === sprites.length && vise.w === W && vise.h === H && vise.zones === zonesCle && vise.pos.equals(camGoal.pos) && vise.target.equals(camGoal.target) && sprites.every((s, i) => vise.ids[i] === s.id)) return;
    const lui = bonhomme();
    const av = lui.position;
    // Hors de la Carte, les îles dont le nom ne se tait jamais tant qu'elles se voient : celle de la flèche « Commence
    // ici » et celle du bonhomme (l'île la plus proche de lui).
    const tenues = indicesTenus(tenuesCle);
    vise.tenues = tenuesCle;
    vise.plaques = plaquesVersion;
    vise.poignees = poigneesVersion;
    vise.disposition = disposition;
    const montre = donnees();
    // Sur la Carte, le médaillon est un obstacle tant que le bonhomme se voit : l'écart se refait quand il paraît (sans
    // quoi le médaillon, montré après le calcul, se posait sur un nom : la Pointe des paysages au 6e, DA, HG-3).
    const marks = spread ? `${montre.ouvrage ?? montre.island ?? ''}:${lui.visible ? av.toArray().map((v) => v.toFixed(0)) : '-'}:${keptId ?? ''}` : `reperes:${tenues.join(',')}:plaques${plaquesVersion}:disposition${disposition}`;
    const key = `${sprites.map((s) => s.id).join(',')}@${camGoal.pos.toArray().map((v) => v.toFixed(1))}>${camGoal.target.toArray().map((v) => v.toFixed(1))}@${W}x${H}@${marks}@${zonesCle}@p${poigneesVersion}`;
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
    // La largeur avec le bloc de l'île : sans lui (`sans`), plus étroite, seulement si le nom se tait faute de place.
    const formes = sprites.map((s) => s.userData.formes as FormesDeLEtiquette);
    const boxes = sprites.map((s, i) => {
      labelAt.copy(s.position).project(goalCamera);
      return { x: ((labelAt.x + 1) / 2) * W, y: ((1 - labelAt.y) / 2) * H, w: formes[i].avec.w, h: formes[i].avec.h };
    });
    const etroites = formes.map((f) => f.sans?.w);
    // L'île elle-même, sous son étiquette : si l'interface la couvre, son nom ne désigne rien à l'écran.
    // Une île derrière la caméra retomberait en miroir dans le cadre : elle compte comme hors du cadre.
    const iles = sprites.map((s) => {
      const p = toScreen(ileAt.set(s.position.x, s.position.y - ETIQUETTE_AU_DESSUS, s.position.z), goalCamera, W, H);
      return p.z > 1 ? { x: -1, y: -1 } : p;
    });
    const cadre = { w: W, h: H };
    // Sur la Carte : une île fermée pèse moins (c'est son étiquette qui s'écarte d'abord), la prochaine destination plus ;
    // la bulle de la destination et le médaillon du bonhomme restent visibles, aucune étiquette ne se pose dessus. Hors de
    // la Carte : les étiquettes restent au-dessus de leur île ; seules celles posées sur l'interface ou sur un grand
    // repère (Archipéo) s'en écartent, et celles que coupe le bord du cadre y rentrent. Entière ou absente : celle qui ne
    // trouve pas de place libre près de son île ne se montre pas à moitié.
    // La flèche d'un ouvrage (GD-7) : la première de ses places libres, et aucune étiquette ne se pose jamais sur elle
    // (`placerAvecLaFlecheDOuvrage`).
    const ouvrage = spread ? montre.ouvrage : null;
    const pointes: readonly Pointe[] = ouvrage ? (montre.pointes ?? []) : [];
    const marques = spread ? marksOnScreen(goalCamera, W, H, ouvrage ? null : laPointe()) : null;
    // Hors de la Carte : les grands repères d'Archipéo, les plaques des créatures (GD-4, GD-7) et les bornes des îles
    // avec leur bulle (GD-14), qu'aucune étiquette ne couvre.
    const obstacles = marques
      ? [marques.arrow, marques.beacon].filter((b): b is LabelBox => b !== null)
      : [...colonnes(goalCamera, W, H), ...(plaques?.boites(goalCamera, W, H) ?? []), ...boitesDesBornes(goalCamera, W, H, sprites.map((s) => s.userData.id as BiomeId))];
    const carte = spread ? carteDesEtiquettes(sprites) : null;
    // Le tracé de l'ouvrage, un obstacle souple : les étiquettes l'évitent si elles peuvent, sans se taire pour lui.
    const souples = ouvrage ? souplesDuTrace(goalCamera, W, H) : [];
    // Les poignées du mode « Modifier le plan », des obstacles durs : une étiquette ne s'y pose jamais, elle se tait plutôt.
    const dures = poignees?.boites(goalCamera, W, H) ?? [];
    // Le placement simple d'abord ; sur la Carte, une seule recherche complète pour tout le placement de ce cadrage (ses
    // essais sous un même plafond), seulement s'il tait un nom ou en pose un sur une autre île (`placerDAbordSimplement`).
    const vue = { zones, bulles, obstacles, souples, bounds: cadre, gap: 6, dures };
    let offsets: LabelOffset[];
    let visibles: boolean[];
    let sansSigne: boolean[];
    if (ouvrage && carte) {
      const fleches = pointes.map((p) => marksOnScreen(goalCamera, W, H, p).arrow).filter((b): b is LabelBox => b !== null);
      const r = avecLIleTouchee(iles, vue, carte.selected, (sansLui) => {
        const c = sansLui ? carteDesEtiquettes(sprites, true) : carte;
        return placerDAbordSimplement(boxes, iles, vue, (recherche) => replierLesSignes(boxes, etroites, (b) => placerAvecLaFlecheDOuvrage(fleches, b, iles, { ...vue, recherche }, c)), etroites);
      });
      placeDeLOuvrage = { ouvrage, i: r.fleche };
      ({ offsets, visibles, sansSigne } = r);
    } else if (carte)
      ({ offsets, visibles, sansSigne } = avecLIleTouchee(iles, vue, carte.selected, (sansLui) => {
        // L'île touchée cède si son nom tait plus d'un nom de plus que la Carte sans lui (référent dys).
        const c = sansLui ? carteDesEtiquettes(sprites, true) : carte;
        return placerDAbordSimplement(boxes, iles, vue, (recherche) => replierLesSignes(boxes, etroites, (b) => placerEtiquettes(b, iles, { ...vue, recherche }, c, tenues)), etroites);
      }));
    else ({ offsets, visibles, sansSigne } = replierLesSignes(boxes, etroites, (b) => placerEtiquettes(b, iles, vue, carte, tenues)));
    labelLayout = { key, offsets };
    offsets.forEach((o, i) => {
      const s = sprites[i];
      // La forme retenue : avec le bloc, ou sans lui si c'est la seule façon de montrer le nom.
      const forme = sansSigne[i] && formes[i].sans ? formes[i].sans : formes[i].avec;
      if (s.material.map !== forme.map) {
        s.material.map = forme.map;
        s.material.needsUpdate = true;
        s.userData.px = { w: forme.w, h: forme.h };
        s.scale.set(forme.w * perPx, forme.h * perPx, 1);
      }
      s.center.set(0.5 - o.dx / s.userData.px.w, 0.5 + o.dy / s.userData.px.h);
      s.userData.montree = visibles[i];
    });
  };
  /** Le lieu dont l'étiquette se tait (le lieu choisi du mode « Modifier le plan »). */
  let cachee: string | null = null;
  /** La zone du glissé, où les étiquettes s'estompent. */
  let estompee: { x0: number; y0: number; x1: number; y1: number; z: number } | null = null;
  const coinDeLaZone = new THREE.Vector3();
  const centreALEcran = new THREE.Vector3();
  /**
   * Chaque étiquette montrée, sauf celle qui se tait ; estompée si son rectangle à l'écran recoupe celui de la zone du
   * glissé (ses quatre coins projetés) : à chaque image, la caméra pouvant glisser pendant le glissé.
   */
  const montrerLesEtiquettes = () => {
    const W = Math.max(1, el.clientWidth);
    const H = Math.max(1, el.clientHeight);
    const z = estompee;
    const zone = z
      ? boiteDesPoints(
          [
            [z.x0, z.y0],
            [z.x1, z.y0],
            [z.x0, z.y1],
            [z.x1, z.y1],
          ].map(([x, y]) => toScreen(coinDeLaZone.set(x, z.z, y), camera, W, H)),
        )
      : null;
    for (const c of labelsGroup.children) {
      c.visible = Boolean(c.userData.montree) && c.userData.id !== cachee;
      const sprite = c as THREE.Sprite;
      let dans = false;
      if (zone && c.visible) {
        const px = c.userData.px as { w: number; h: number };
        const p = toScreen(centreALEcran.copy(c.position), camera, W, H);
        dans = recoupe({ x: p.x + (0.5 - sprite.center.x) * px.w, y: p.y - (0.5 - sprite.center.y) * px.h, w: px.w, h: px.h }, zone);
      }
      sprite.material.opacity = dans ? ESTOMPEE : 1;
    }
  };

  const vider = () => {
    for (const s of [...labelsGroup.children] as THREE.Sprite[]) {
      const formes = s.userData.formes as FormesDeLEtiquette | undefined;
      formes?.avec.map.dispose();
      formes?.sans?.map.dispose();
      s.material.dispose();
      labelsGroup.remove(s);
    }
  };

  return {
    poser: (labels) => {
      vider();
      for (const l of labels ?? []) {
        const avec = formeDeLEtiquette(l.text, l.state, l.bloc);
        if (!avec) continue;
        // Sans le bloc : une seconde texture, montrée seulement si le nom ne trouve pas sa place avec lui.
        const sans = l.bloc ? formeDeLEtiquette(l.text, l.state) : null;
        // Archipéo : la brume de profondeur ne voile jamais un nom d'île (DA-02).
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: avec.map, depthTest: false, transparent: true, sizeAttenuation: false, fog: monde.habillage.etiquettes === 'voilees' }));
        // Taille fixe à l'écran (le nom à 18 px, l'état à 16 px), quel que soit le zoom : l'échelle suit la hauteur du
        // canvas, à chaque image.
        sprite.userData.px = { w: avec.w, h: avec.h };
        sprite.userData.formes = { avec, ...(sans ? { sans } : {}) } satisfies FormesDeLEtiquette;
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
    // Appelée seulement quand l'image change, ou que la scène est refaite (WorldCanvas.tsx).
    poserLImageDeLaCarte: (image) => {
      imageDeLaBulle = image ?? { icone: 'star' };
      dessinerLaFleche();
      arrowTex.needsUpdate = true;
    },
    cacher: (id) => {
      cachee = id;
    },
    keepShown: (id) => {
      keptId = id;
    },
    estomper: (zone) => {
      estompee = zone;
    },
    bulleAuBordSous: (x, y) => bulleALEcran.visible && Math.abs(x - bulleALEcran.x) <= bulleALEcran.w / 2 && Math.abs(y - bulleALEcran.y) <= bulleALEcran.h / 2,
    animer: (t, _dt, reduit) => {
      placeMarks(instant.carte, t, reduit);
      placeLabels(instant.carte);
      montrerLesEtiquettes();
    },
    dispose: () => {
      arrowTex.dispose();
      mapArrow.material.dispose();
      medaillon.material.map?.dispose();
      medaillon.material.dispose();
    },
  };
}
