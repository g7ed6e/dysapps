// Les bulles du monde, dans la scène 3D : celle de la créature qui se souvient (GD-4, étape 1 ; le geste et ses temps :
// world/sign.ts) ou qui attend une commande (GD-7, PR 3), et celles des objets à faire (proposition P2, choisie par le
// mainteneur le 4 octobre 2026 pour Blocland, puis pour Archipéo le même jour ; les règles : world/affordance.ts).
// À l'arrivée de la caméra sur l'île d'une créature qui fait signe, la créature fait un saut lent, une fois ; puis sa
// bulle se pose au-dessus d'elle. Dans Blocland, une bulle est une plaque carrée claire au bord sombre épais, à l'ombre
// nette et à la pointe vers l'objet (un bloc vu de face) ; on n'en montre que trois au plus, sur l'île où l'on est, et la
// première (la prochaine chose à faire) est plus grande, bordée d'or, et monte et descend lentement ; touchée, une bulle
// s'écrase et rebondit ; elle reste entière dans la place que l'interface laisse libre (tenue au bord, sans pointe), et
// la mise en avant ne bouge plus tant qu'une fiche ou un panneau est ouvert. Dans Archipéo, les mêmes bulles, en
// hexagone à coins adoucis, pointe vers la chose : Brume au bord Nuit océan, la prochaine bordée de lumière (choix « 1a »
// du mainteneur, 4 octobre 2026 ; la forme : `formeDesSignes` de l'habillage).
// L'icône au trait, ou le bloc demandé en cube vu de trois quarts, avec les couleurs de Mes blocs (`BlockIcon`). Toujours
// face à l'écran, de taille fixe, sans brume ni lumière (lisible de jour comme de nuit), sans clignoter. Toutes les
// bulles tiennent en un seul appel de dessin : un maillage de quadrilatères, une texture (une case par image), refait
// image par image face à la caméra. Rien sur la Carte ni pendant le voyage ; avec le mouvement réduit de l'appareil,
// rien ne bouge.
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { COULEURS_DES_SIGNES, drawBlock } from '../world/labelCanvas';
import { tracesDeLIcone } from '../../components/tracedIcon';
import { GESTE_DU_SIGNE, ICONE_DU_SIGNE, iconeDuSigneVisible } from '../world/sign';
import {
  BULLE,
  bullesMontrees,
  bullesPossibles,
  flottementDeLaBulle,
  rebondDeLaBulle,
  type CibleDeLaBulle,
  type ImageDeLaBulle,
  type SigneDObjet,
} from '../world/affordance';
import type { SigneDeCreature } from '../world/view';
import type { Habillage } from '../skin';
import type { Derniers, Instant, Monde, PartieDeLaScene } from './scenePart';
import type { Personnages } from './characters';
import type { LabelBox } from '../world/labelLayout';
import type { PlaceLue, Rect } from '../freeSpace';

/** Une case de la texture, en pixels (la plaque et son icône, assez grandes pour un écran à deux pixels par point). */
export const CASE = 128;
/** Quatre cases par côté : seize icônes, plus que d'îles dans un archipel. */
const COTE = 4;
const SIGNES_MAX = COTE * COTE;
/** Les quatre coins d'un quadrilatère, en demi-tailles : bas gauche, bas droite, haut droite, haut gauche. */
const COINS = [-1, -1, 1, -1, 1, 1, -1, 1] as const;

export interface Signes extends PartieDeLaScene {
  /** Les créatures qui font signe (refait quand la liste change). */
  poser(signes: SigneDeCreature[]): void;
  /**
   * Les objets touchables (Blocland : ceux qui sont à faire portent une bulle) et la clé de la prochaine chose à faire,
   * mise en avant quand elle est sur l'île où l'on est.
   */
  poserLesObjets(objets: readonly SigneDObjet[], prochaine: string | null): void;
  /** La bulle de cette clé (un objet, `creature:<île>`) s'écrase et rebondit ; `false` si elle n'est pas montrée. */
  rebondir(cle: string): boolean;
  /** Ce que touche la bulle sous le doigt (`x`, `y` en pixels CSS dans la vue de `W` × `H`), à la dernière image ; sinon `null`. */
  sous(x: number, y: number, W: number, H: number): CibleDeLaBulle | null;
  /** Le maillage des icônes (pour les tests et les mesures). */
  readonly maillage: THREE.Mesh;
  /** La hauteur de la vue, en pixels CSS, donnée au redimensionnement (jamais lue dans le DOM image par image). */
  redimensionner(hauteur: number): void;
  /**
   * Les plaques des créatures qui font signe et ces créatures, à l'écran vu par `cam` (W × H pixels CSS, la caméra visée
   * à son arrivée) : des obstacles pour les étiquettes des îles, qui s'en écartent (une étiquette ne se pose ni sur une
   * plaque ni sur sa créature). Celles qui attendent la fin du geste comptent déjà : l'étiquette ne bouge pas quand la
   * plaque apparaît. Hors de la Carte seulement.
   */
  boites(cam: THREE.Camera, W: number, H: number): LabelBox[];
  /**
   * Change quand une plaque de plus est posée, ou que la créature d'une plaque arrive dans la scène : les étiquettes se
   * replacent alors. Jamais quand une plaque s'en va (l'étiquette ne saute pas pendant la pose d'une petite
   * construction : elle se replacera à la prochaine visée), ni pendant un vol de la caméra. Pendant la pose en vague
   * (`suivreLaVague`), une plaque nouvelle (la commande suivante, suggérée juste après « Livrer ») ou une créature qui
   * arrive se montre tout de suite, mais la version ne change qu'à la fin de la vague : les étiquettes ne se replacent
   * qu'à la prochaine visée de la caméra (qui les replace de toute façon) ou à la fin de la vague (relecture dys).
   */
  readonly version: number;
  /** La pose d'une partie en vague commence (`true`) ou finit, touchée ou quittée (`false`) : voir `version`. */
  suivreLaVague(enCours: boolean): void;
}

/** Le contour d'une plaque carrée aux coins presque droits, en lignes et petits arcs (sans `roundRect`, absent des vieux Safari). */
function contourDeLaPlaque(ctx: CanvasRenderingContext2D, x: number, y: number, cote: number, r: number): void {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + cote - r, y);
  ctx.arcTo(x + cote, y, x + cote, y + r, r);
  ctx.lineTo(x + cote, y + cote - r);
  ctx.arcTo(x + cote, y + cote, x + cote - r, y + cote, r);
  ctx.lineTo(x + r, y + cote);
  ctx.arcTo(x, y + cote, x, y + cote - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Le contour d'un hexagone pointe en haut et en bas, de rayon `r` (centre-sommet) centré en (`cx`, `cy`), aux coins
 * adoucis d'un arc de rayon `coin`.
 */
function contourDeLHexagone(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, coin: number): void {
  const sommet = (i: number): [number, number] => [cx + r * Math.sin((i * Math.PI) / 3), cy - r * Math.cos((i * Math.PI) / 3)];
  // Du milieu du côté entre le sommet du haut et le suivant, puis chaque coin arrondi par `arcTo`.
  const [ax, ay] = sommet(0);
  const [bx, by] = sommet(1);
  ctx.moveTo((ax + bx) / 2, (ay + by) / 2);
  for (let i = 1; i <= 6; i++) {
    const [x, y] = sommet(i % 6);
    const [nx, ny] = sommet((i + 1) % 6);
    ctx.arcTo(x, y, (x + nx) / 2, (y + ny) / 2, coin);
  }
  ctx.closePath();
}

/** Ce que montre une plaque : une icône (une notion, ce qu'on fait sur un objet), ou le bloc demandé (commande). */
export type ImageDuSigne = ImageDeLaBulle;

/**
 * La clé d'une image dans la texture : une case par icône ou par bloc, une de plus pour la bulle mise en avant, et une
 * de plus pour la bulle tenue au bord de la place libre (sans pointe).
 */
const cleDeLImage = (image: ImageDuSigne, enAvant = false, sansPointe = false): string =>
  `${'bloc' in image ? `bloc:${image.bloc}` : `icone:${image.icone}`}${enAvant ? ':avant' : ''}${sansPointe ? ':bord' : ''}`;

/**
 * La bulle de Blocland dans sa case, en pixels de la case : la plaque (son ombre nette en dessous, sa pointe vers
 * l'objet), son côté, son bord sombre et, mise en avant, son bord d'or ; le centre de l'image.
 */
export const PLAQUE = { x: 16, y: 4, cote: 96, coin: 8, ombre: 6, bord: 5, or: 6, pointe: { demi: 12, bas: 122 } } as const;
/**
 * L'hexagone d'Archipéo, dans la même place que la plaque (même hauteur, même pointe, même ombre, même bord) : pointe en
 * bas, de rayon la moitié du côté de la plaque (sa largeur : √3/2 de sa hauteur), aux coins adoucis.
 */
const HEXAGONE = { r: PLAQUE.cote / 2, coin: 9 } as const;
/** Un hexagone rentré de `d` (perpendiculairement à ses côtés) perd `d / cos 30°` de rayon. */
const RENTRE = 2 / Math.sqrt(3);
/** La taille à l'écran d'une case : la plaque (ou l'hexagone, aussi haut) fait `BULLE.px` (ou `prochainePx`), la case l'entoure. */
export const caseALEcran = (enAvant: boolean): number => ((enAvant ? BULLE.prochainePx : BULLE.px) * CASE) / PLAQUE.cote;

/** L'image au milieu de la plaque (`cx`, `cy`), sur `taille` pixels : l'icône au trait rond, comme `Icon` (trait de 2,5 sur 24), ou le bloc. */
function dessinerLImage(ctx: CanvasRenderingContext2D, cx: number, cy: number, taille: number, image: ImageDuSigne, encre: string): void {
  // Le cube d'un bloc a pour demi-hauteur à peu près la moitié de la place.
  if ('bloc' in image) return drawBlock(ctx, cx, cy, image.bloc, taille * 0.53, encre, { contour: 5, aretes: 3 });
  if (typeof Path2D === 'undefined') return;
  ctx.save();
  const echelle = taille / 24;
  ctx.translate(cx - taille / 2, cy - taille / 2);
  ctx.scale(echelle, echelle);
  ctx.strokeStyle = encre;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const d of tracesDeLIcone(image.icone)) ctx.stroke(new Path2D(d));
  ctx.restore();
}

/**
 * Dessine une case : la bulle (son ombre nette, sa pointe vers la chose sauf tenue au bord, son bord sombre, le bord de
 * lumière si elle est mise en avant, le fond clair), plaque carrée (Blocland) ou hexagone (Archipéo), puis l'image.
 */
export function dessinerLaCase(ctx: CanvasRenderingContext2D, rang: number, image: ImageDuSigne, forme: Habillage['formeDesSignes'], enAvant = false, sansPointe = false): void {
  const x0 = (rang % COTE) * CASE;
  const y0 = Math.floor(rang / COTE) * CASE;
  const { fond, encre, avant } = COULEURS_DES_SIGNES[forme];
  const { x, y, cote, coin, ombre, bord, or, pointe } = PLAQUE;
  const cx = x0 + CASE / 2;
  const cy = y0 + y + cote / 2;
  /** La bulle rentrée de `d` pixels, son coin réduit de `moinsCoin`, décalée de `dy`, peinte de `couleur`. */
  const bulle = (d: number, moinsCoin: number, dy: number, couleur: string) => {
    ctx.beginPath();
    if (forme === 'plaque') contourDeLaPlaque(ctx, x0 + x + d, y0 + y + d + dy, cote - 2 * d, Math.max(2, coin - moinsCoin));
    else contourDeLHexagone(ctx, cx, cy + dy, HEXAGONE.r - d * RENTRE, Math.max(2, HEXAGONE.coin - moinsCoin));
    ctx.fillStyle = couleur;
    ctx.fill();
  };
  ctx.save();
  ctx.clearRect(x0, y0, CASE, CASE);
  // L'ombre nette, puis la pointe, sous la bulle (tenue au bord, elle ne vise plus rien : pas de pointe).
  bulle(0, 0, ombre, encre);
  if (!sansPointe) {
    // Sous l'hexagone, la base de la pointe remonte dans ses deux côtés du bas (pente de 30°) : rien ne dépasse.
    const base = forme === 'plaque' ? y0 + y + cote : y0 + y + cote - pointe.demi * Math.tan(Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(cx - pointe.demi, base);
    ctx.lineTo(cx + pointe.demi, base);
    ctx.lineTo(cx, y0 + pointe.bas);
    ctx.closePath();
    ctx.fillStyle = encre;
    ctx.fill();
  }
  bulle(0, 0, 0, encre);
  let dedans: number = bord;
  if (enAvant) {
    bulle(dedans, 2, 0, avant);
    dedans += or;
  }
  bulle(dedans, 4, 0, fond);
  // L'image : dans la plaque, 62 % de son dedans ; dans l'hexagone, 62 % du diamètre de son cercle inscrit.
  const place = forme === 'plaque' ? cote - 2 * dedans : (HEXAGONE.r - dedans * RENTRE) * Math.sqrt(3);
  dessinerLImage(ctx, cx, cy, place * 0.62, image, encre);
  ctx.restore();
}

/** Une bulle montrée : sa clé, ce qu'elle touche, son image, si elle est mise en avant, et sa créature (dont la tête la porte) ou son point. */
interface Montree {
  cle: string;
  cible: CibleDeLaBulle;
  image: ImageDuSigne;
  enAvant: boolean;
  creature: BiomeId | null;
  point: THREE.Vector3 | null;
  /** Les clés de ses deux cases (avec sa pointe, tenue au bord) et leur rang dans la texture, -1 avant la première image. */
  cases: [string, string];
  rangs: [number, number];
}

/** Ce qu'une bulle dessinée touche, à la dernière image : son rectangle (la plaque et sa pointe) en coordonnées normalisées de l'écran. */
interface Touchable {
  cible: CibleDeLaBulle | null;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** `v` ramené entre `a + m` et `b - m` (au milieu si la bande est trop étroite). */
const dansLaBande = (v: number, a: number, b: number, m: number): number => (b - a < 2 * m ? (a + b) / 2 : Math.min(Math.max(v, a + m), b - m));

/** Une place libre relue quatre fois par seconde au plus (la fiche qui s'ouvre change la clé, `calme`). */
const RELIRE_LA_PLACE_MS = 250;

/**
 * `lirePlace` : la place que l'interface laisse libre dans la vue (../freeSpace.ts, `lecteurDePlaceLibre`), pour y
 * tenir les bulles ; sans elle (les tests), toute la vue.
 */
export function creerSignes(
  monde: Monde,
  el: HTMLElement,
  camera: THREE.PerspectiveCamera,
  personnages: Personnages,
  derniers: { current: Derniers },
  instant: Instant,
  lirePlace?: (contexte: string) => PlaceLue,
  /**
   * Blocland : l'île que montre la vue glissée (celle sous le centre de la vue), ou `null` quand la vue n'a pas bougé :
   * les bulles la suivent (mot du mainteneur, 4 octobre 2026).
   */
  ileVisee?: () => BiomeId | null,
): Signes {
  const { scene } = monde;
  const forme = monde.habillage.formeDesSignes;
  /** La hauteur de la vue : lue une fois ici, puis donnée par le redimensionnement de la scène. */
  let hauteurDeLaVue = el.clientHeight;
  const toile = document.createElement('canvas');
  toile.width = toile.height = CASE * COTE;
  const ctx = toile.getContext('2d');
  const texture = new THREE.CanvasTexture(toile);
  texture.colorSpace = THREE.SRGBColorSpace;
  /** La case de chaque image déjà dessinée (`cleDeLImage`). */
  const cases = new Map<string, number>();
  let dessinees = 0;

  const positions = new Float32Array(SIGNES_MAX * 4 * 3);
  const uvs = new Float32Array(SIGNES_MAX * 4 * 2);
  const index: number[] = [];
  for (let i = 0; i < SIGNES_MAX; i++) index.push(4 * i, 4 * i + 1, 4 * i + 2, 4 * i, 4 * i + 2, 4 * i + 3);
  const geometrie = new THREE.BufferGeometry();
  const attrPositions = new THREE.BufferAttribute(positions, 3);
  attrPositions.setUsage(THREE.DynamicDrawUsage);
  const attrUvs = new THREE.BufferAttribute(uvs, 2);
  geometrie.setAttribute('position', attrPositions);
  geometrie.setAttribute('uv', attrUvs);
  geometrie.setIndex(index);
  geometrie.setDrawRange(0, 0);
  const materiau = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, fog: false, side: THREE.DoubleSide });
  const maillage = new THREE.Mesh(geometrie, materiau);
  // Par-dessus le relief, sous la flèche de la Carte (12). Le rayon la traverse : une bulle se touche par `sous`.
  maillage.renderOrder = 11;
  maillage.frustumCulled = false;
  maillage.raycast = () => {};
  maillage.visible = false;
  scene.add(maillage);

  /** Les créatures qui font signe, la hauteur de leur bulle, mesurée une fois au repos, et si leur tête a déjà été trouvée (pour `version`). */
  let signes: { signe: SigneDeCreature; y: number | null; vue: boolean }[] = [];
  const parCreature = new Map<BiomeId, (typeof signes)[number]>();
  /** Blocland : les objets touchables, le point (la pointe) de la bulle de chacun de ceux qui sont à faire, et la prochaine chose à faire. */
  let objets: readonly SigneDObjet[] = [];
  const parCle = new Map<string, SigneDObjet>();
  let prochaine: string | null = null;
  let possibles = bullesPossibles([], []);
  /** Les bulles montrées, gardées tant que ni la liste ni l'île où l'on est ne changent. */
  let enCache: { ile: BiomeId | null; liste: Montree[] } | null = null;
  /** Le début du rebond de chaque bulle touchée. */
  const rebonds = new Map<string, number>();
  /** Le rectangle de chaque bulle dessinée à la dernière image (les `nRectangles` premiers), préalloués. */
  const rectangles: Touchable[] = Array.from({ length: SIGNES_MAX }, () => ({ cible: null, x0: 0, y0: 0, x1: 0, y1: 0 }));
  let nRectangles = 0;
  /** La place libre, en pixels CSS de la vue (`null` : toute la vue), relue de temps en temps. */
  let libre: Rect | null = null;
  let largeurLue = 0;
  let hauteurLue = 0;
  let placeLue = -Infinity;
  let placeCle = '';
  /** La clé de la case écrite dans chaque rang de la texture : une bulle garde son rang tant qu'elle y est. */
  const clesDesRangs = new Array<string>(SIGNES_MAX).fill('');
  /** Le début du geste de chaque île arrivée (une fois par île pour la vie de la scène). */
  const gestes = new Map<BiomeId, number>();
  /** La dernière demande de cadrage vue (l'île et son numéro) : une nouvelle arrivée sur une île déclenche son geste. */
  let derniereIle: BiomeId | null | undefined;
  let dernierSeq = -1;

  const caseDe = (image: ImageDuSigne, enAvant: boolean, sansPointe = false, cle = cleDeLImage(image, enAvant, sansPointe)): number => {
    const deja = cases.get(cle);
    if (deja !== undefined) return deja;
    const rang = dessinees++ % SIGNES_MAX;
    // Plus de seize images dans la vie de la scène (jamais vu : une scène par archipel) : la case la plus ancienne sert.
    for (const [autre, r] of cases) if (r === rang) cases.delete(autre);
    if (ctx) dessinerLaCase(ctx, rang, image, forme, enAvant, sansPointe);
    texture.needsUpdate = true;
    cases.set(cle, rang);
    clesDesRangs[rang] = cle;
    return rang;
  };
  /** Le rang de la case d'une bulle montrée (tenue au bord ou non), gardé dans la bulle tant que la texture l'a encore. */
  const rangDe = (m: Montree, auBord: boolean): number => {
    const i = auBord ? 1 : 0;
    if (m.rangs[i] < 0 || clesDesRangs[m.rangs[i]] !== m.cases[i]) m.rangs[i] = caseDe(m.image, m.enAvant, auBord, m.cases[i]);
    return m.rangs[i];
  };
  /**
   * L'île où l'on est : celle que montre la vue glissée ; sinon celle que regarde la caméra (le bonhomme y va), sinon
   * celle du bonhomme.
   */
  const ileOuLOnEst = (): BiomeId | null => ileVisee?.() ?? derniers.current.focus.island ?? derniers.current.home ?? null;
  const montree = (cle: string, cible: CibleDeLaBulle, image: ImageDuSigne, enAvant: boolean, creature: BiomeId | null, point: THREE.Vector3 | null): Montree => ({
    cle,
    cible,
    image,
    enAvant,
    creature,
    point,
    cases: [cleDeLImage(image, enAvant), cleDeLImage(image, enAvant, true)],
    rangs: [-1, -1],
  });
  /** Le point d'un objet vu de l'île `ile` : un ouvrage, son bout de ce côté ; sinon le sien. */
  const pointDe = (cle: string, ile: BiomeId | null): THREE.Vector3 | null => {
    const o = parCle.get(cle);
    if (!o) return null;
    const p = (ile && o.parIle?.[ile]) || o;
    return new THREE.Vector3(p.x, p.z, p.y);
  };
  /** Les bulles à montrer : trois au plus sur l'île où l'on est. */
  const montrees = (): Montree[] => {
    const ile = ileOuLOnEst();
    if (enCache && enCache.ile === ile) return enCache.liste;
    const liste: Montree[] = bullesMontrees(possibles, ile, prochaine).map(({ bulle, enAvant }) =>
      montree(bulle.cle, bulle.cible, bulle.image, enAvant, bulle.cible.genre === 'creature' ? bulle.cible.id : null, pointDe(bulle.cle, ile)),
    );
    enCache = { ile, liste };
    return liste;
  };
  const refaire = () => {
    possibles = bullesPossibles(objets, signes.map((s) => s.signe));
    enCache = null;
  };
  /** La taille à l'écran d'une bulle, en pixels CSS : sa case (la bulle et sa pointe). */
  const tailleALEcran = (m: Montree): number => caseALEcran(m.enAvant);

  const tete = new THREE.Vector3();
  const centre = new THREE.Vector3();
  const droite = new THREE.Vector3();
  const haut = new THREE.Vector3();
  const vue = new THREE.Vector3();
  /** Le point de la bulle `m` (sa pointe) dans `out` : la tête de sa créature (à sa hauteur au repos), ou son point ; `false` sans lui. */
  const ancreDe = (m: Montree, out: THREE.Vector3): boolean => {
    if (m.point) {
      out.copy(m.point);
      return true;
    }
    const s = m.creature ? parCreature.get(m.creature) : undefined;
    if (!s || !personnages.teteDe(s.signe.id, out)) return false;
    out.y = s.y ?? out.y + ICONE_DU_SIGNE.auDessus;
    return true;
  };

  /** La case de texture écrite dans chaque place du maillage (-1 : aucune) : on ne la réécrit que si elle change. */
  const casesEcrites = new Array<number>(SIGNES_MAX).fill(-1);
  let version = 0;
  /** Une vague est en cours ; une plaque ou une créature est arrivée pendant elle (la version changera à sa fin). */
  let enVague = false;
  let enAttente = false;
  const plaqueDePlus = () => {
    if (enVague) enAttente = true;
    else version++;
  };
  const aLEcran = new THREE.Vector3();
  const boite = new THREE.Box3();
  const coin = new THREE.Vector3();

  /** Le rectangle à l'écran (`cam`, W × H) de la créature d'une île, ou `null` si elle n'est pas dans la scène. */
  const creatureALEcran = (id: BiomeId, cam: THREE.Camera, W: number, H: number): LabelBox | null => {
    const o = personnages.creatures?.children.find((c) => c.userData.creature === id && c.userData.kind !== 'guardian');
    if (!o) return null;
    boite.setFromObject(o);
    if (boite.isEmpty()) return null;
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (let i = 0; i < 8; i++) {
      coin.set(i & 1 ? boite.max.x : boite.min.x, i & 2 ? boite.max.y : boite.min.y, i & 4 ? boite.max.z : boite.min.z).project(cam);
      if (coin.z > 1) return null;
      const x = ((coin.x + 1) / 2) * W;
      const y = ((1 - coin.y) / 2) * H;
      [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
    }
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
  };

  /** La place libre relue (quatre fois par seconde au plus, tout de suite quand une fiche s'ouvre ou se ferme). */
  const relireLaPlace = () => {
    if (!lirePlace) return;
    const cle = derniers.current.calme ? 'bulles:calme' : 'bulles';
    if (cle === placeCle && instant.now - placeLue < RELIRE_LA_PLACE_MS) return;
    placeCle = cle;
    placeLue = instant.now;
    const lue = lirePlace(cle);
    libre = lue.libre;
    largeurLue = lue.w;
    hauteurLue = lue.h;
  };
  const ecart = { x: 0, y: 0 };
  /**
   * L'écart, en pixels CSS (`ecart`), qui tient entière dans la place libre (à `BULLE.bordPx` de ses bords) une bulle
   * de demi-côté `demi` centrée en (`x`, `y`) dans une vue de `W` × `H` ; `true` si elle a dû bouger (tenue au bord).
   */
  const tenirDansLaPlace = (x: number, y: number, demi: number, W: number, H: number): boolean => {
    const sx = libre && largeurLue ? W / largeurLue : 1;
    const sy = libre && hauteurLue ? H / hauteurLue : 1;
    const m = demi + BULLE.bordPx;
    ecart.x = dansLaBande(x, libre ? libre.x0 * sx : 0, libre ? libre.x1 * sx : W, m) - x;
    ecart.y = dansLaBande(y, libre ? libre.y0 * sy : 0, libre ? libre.y1 * sy : H, m) - y;
    return Math.abs(ecart.x) > 0.5 || Math.abs(ecart.y) > 0.5;
  };
  /** Le point de la chose (`x`, `y`, pixels CSS d'une vue `W` × `H`) est dans la place libre : la bulle tenue garde sa pointe. */
  const dansLaPlace = (x: number, y: number, W: number, H: number): boolean => {
    const sx = libre && largeurLue ? W / largeurLue : 1;
    const sy = libre && hauteurLue ? H / hauteurLue : 1;
    return x >= (libre ? libre.x0 * sx : 0) && x <= (libre ? libre.x1 * sx : W) && y >= (libre ? libre.y0 * sy : 0) && y <= (libre ? libre.y1 * sy : H);
  };

  return {
    maillage,
    get version() {
      return version;
    },
    boites: (cam, W, H) => {
      // Lu seulement quand les étiquettes se replacent (une visée nouvelle), jamais image par image.
      const out: LabelBox[] = [];
      for (const m of montrees()) {
        if (!ancreDe(m, tete)) continue;
        aLEcran.copy(tete).project(cam);
        if (aLEcran.z > 1) continue;
        // La bulle se pose sur sa pointe : son bas à l'écran est là ; tenue au bord, là où elle est dessinée.
        const cote = tailleALEcran(m);
        const x = ((aLEcran.x + 1) / 2) * W;
        const y = ((1 - aLEcran.y) / 2) * H - cote / 2;
        const tenue = tenirDansLaPlace(x, y, cote / 2, W, H);
        out.push({ x: x + (tenue ? ecart.x : 0), y: y + (tenue ? ecart.y : 0), w: cote + 8, h: cote + 8 });
        const creature = m.creature ? creatureALEcran(m.creature, cam, W, H) : null;
        if (creature) out.push(creature);
      }
      return out;
    },
    redimensionner: (hauteur) => {
      hauteurDeLaVue = hauteur;
    },
    poser: (liste) => {
      const avant = new Map(signes.map((s) => [s.signe.id, s]));
      signes = liste.slice(0, SIGNES_MAX).map((signe) => ({ signe, y: avant.get(signe.id)?.y ?? null, vue: avant.get(signe.id)?.vue ?? false }));
      parCreature.clear();
      for (const s of signes) parCreature.set(s.signe.id, s);
      refaire();
      // Une plaque de plus : les étiquettes se replacent (à la fin de la vague, s'il y en a une). Une plaque qui s'en va ne
      // les fait pas bouger.
      if (signes.some((s) => !avant.has(s.signe.id))) plaqueDePlus();
    },
    poserLesObjets: (liste, cle) => {
      const avant = new Set(parCle.keys());
      objets = liste;
      prochaine = cle;
      parCle.clear();
      for (const s of liste) if (s.etat === 'aFaire') parCle.set(s.cle, s);
      refaire();
      if ([...parCle.keys()].some((k) => !avant.has(k))) plaqueDePlus();
    },
    rebondir: (cle) => {
      if (!montrees().some((m) => m.cle === cle)) return false;
      rebonds.set(cle, instant.now);
      return true;
    },
    sous: (x, y, W, H) => {
      const nx = (x / Math.max(1, W)) * 2 - 1;
      const ny = 1 - (y / Math.max(1, H)) * 2;
      // De la dernière dessinée à la première : celle qui est vue par-dessus passe d'abord.
      for (let i = nRectangles - 1; i >= 0; i--) {
        const r = rectangles[i];
        if (nx >= r.x0 && nx <= r.x1 && ny >= r.y0 && ny <= r.y1) return r.cible;
      }
      return null;
    },
    suivreLaVague: (enCours) => {
      enVague = enCours;
      if (!enCours && enAttente) {
        enAttente = false;
        version++;
      }
    },
    animer: (t, _dt, reduit) => {
      const { focus, carte } = derniers.current;
      // L'arrivée sur une île : son geste, une fois, le temps que la caméra arrive (rien avec moins d'animations).
      if (focus.island !== derniereIle || focus.seq !== dernierSeq) {
        derniereIle = focus.island;
        dernierSeq = focus.seq;
        const ile = focus.island;
        // Dans Blocland, seulement si sa bulle est montrée (trois au plus) : jamais un signe sans bulle.
        if (ile && !carte && !reduit && !gestes.has(ile) && montrees().some((m) => m.creature === ile)) {
          const debut = instant.now + GESTE_DU_SIGNE.attenteMs;
          gestes.set(ile, debut);
          personnages.faireSigne(ile, debut);
        }
      }
      // La créature d'une plaque arrive dans la scène (posée après la plaque) : les étiquettes se replacent, une fois (à la
      // fin de la vague, s'il y en a une).
      for (const s of signes)
        if (!s.vue && personnages.teteDe(s.signe.id, tete)) {
          s.vue = true;
          plaqueDePlus();
        }
      nRectangles = 0;
      relireLaPlace();
      const liste = montrees();
      if (!liste.length || carte || instant.carte || instant.navigue) {
        maillage.visible = false;
        return;
      }
      camera.updateMatrixWorld();
      const e = camera.matrixWorld.elements;
      droite.set(e[0], e[1], e[2]).normalize();
      haut.set(e[4], e[5], e[6]).normalize();
      const pxParUnite = hauteurDeLaVue / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
      const { ecraseMs, reviensMs } = BULLE.rebond;
      let n = 0;
      for (const m of liste) {
        if (n >= SIGNES_MAX) break;
        const s = m.creature ? parCreature.get(m.creature) : undefined;
        if (s && !iconeDuSigneVisible(gestes.get(s.signe.id) ?? null, instant.now, reduit)) continue;
        if (!ancreDe(m, tete)) continue;
        // La hauteur d'une créature se mesure une fois, au repos (le geste fini) : la bulle reste fixe pendant le balancement.
        if (s) s.y ??= tete.y;
        // Sa taille à l'écran ne dépend pas de la distance : en unités du monde, à la profondeur de la pointe.
        const profondeur = Math.max(0.5, -vue.copy(tete).applyMatrix4(camera.matrixWorldInverse).z);
        const parPx = profondeur / Math.max(1, pxParUnite);
        const debut = rebonds.get(m.cle);
        let echelle = 1;
        if (debut !== undefined) {
          if (reduit || instant.now - debut >= ecraseMs + reviensMs) rebonds.delete(m.cle);
          else echelle = rebondDeLaBulle(instant.now - debut);
        }
        const cotePx = tailleALEcran(m) * echelle;
        const demi = (cotePx * parPx) / 2;
        // La bulle mise en avant monte et descend de 4 pixels au-dessus de sa place, jamais plus bas ; elle se tient
        // tranquille tant qu'une fiche ou un panneau est ouvert (on lit).
        const leve = m.enAvant && !reduit && !derniers.current.calme ? (BULLE.flotte.amplitudePx + flottementDeLaBulle(t)) * parPx : 0;
        centre.copy(tete).addScaledVector(haut, demi + leve);
        // Blocland : une bulle qui sort de la place libre y reste, entière ; si sa chose aussi en est sortie (un Gardien au
        // fond), elle perd sa pointe (elle ne vise plus rien).
        let tenue = false;
        let auBord = false;
        aLEcran.copy(centre).project(camera);
        const W = hauteurDeLaVue * camera.aspect;
        const H = hauteurDeLaVue;
        const cx = ((aLEcran.x + 1) / 2) * W;
        const cy = ((1 - aLEcran.y) / 2) * H;
        if (aLEcran.z <= 1 && tenirDansLaPlace(cx, cy, cotePx / 2, W, H)) {
          tenue = true;
          centre.addScaledVector(droite, ecart.x * parPx).addScaledVector(haut, -ecart.y * parPx);
          coin.copy(tete).project(camera);
          auBord = !dansLaPlace(((coin.x + 1) / 2) * W, ((1 - coin.y) / 2) * H, W, H);
        }
        for (let j = 0; j < 4; j++) {
          const sx = COINS[2 * j] * demi;
          const sy = COINS[2 * j + 1] * demi;
          const k = n * 12 + 3 * j;
          positions[k] = centre.x + droite.x * sx + haut.x * sy;
          positions[k + 1] = centre.y + droite.y * sx + haut.y * sy;
          positions[k + 2] = centre.z + droite.z * sx + haut.z * sy;
        }
        // Son rectangle à l'écran, pour le toucher : la plaque et sa pointe seulement, pas les marges de sa case.
        if (aLEcran.z <= 1) {
          const px = cx + ecart.x * Number(tenue);
          const py = cy + ecart.y * Number(tenue);
          const u = cotePx / CASE;
          const r = rectangles[nRectangles++];
          r.cible = m.cible;
          r.x0 = ((px - cotePx / 2 + PLAQUE.x * u) / W) * 2 - 1;
          r.x1 = ((px - cotePx / 2 + (PLAQUE.x + PLAQUE.cote) * u) / W) * 2 - 1;
          r.y1 = 1 - ((py - cotePx / 2 + PLAQUE.y * u) / H) * 2;
          r.y0 = 1 - ((py - cotePx / 2 + (auBord ? PLAQUE.y + PLAQUE.cote + PLAQUE.ombre : PLAQUE.pointe.bas) * u) / H) * 2;
        }
        const rang = rangDe(m, auBord);
        if (casesEcrites[n] !== rang) {
          casesEcrites[n] = rang;
          const u = (rang % COTE) / COTE;
          const v = 1 - (Math.floor(rang / COTE) + 1) / COTE;
          for (let j = 0; j < 4; j++) {
            uvs[n * 8 + 2 * j] = u + ((COINS[2 * j] + 1) / 2) * (1 / COTE);
            uvs[n * 8 + 2 * j + 1] = v + ((COINS[2 * j + 1] + 1) / 2) * (1 / COTE);
          }
          attrUvs.needsUpdate = true;
        }
        n++;
      }
      geometrie.setDrawRange(0, n * 6);
      attrPositions.needsUpdate = true;
      maillage.visible = n > 0;
    },
    dispose: () => {
      scene.remove(maillage);
      geometrie.dispose();
      materiau.dispose();
      texture.dispose();
    },
  };
}
