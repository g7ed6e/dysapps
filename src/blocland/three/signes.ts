// Le signe de la créature qui se souvient, dans la scène 3D (GD-4, étape 1 ; le geste et ses temps : world/signe.ts).
// À l'arrivée de la caméra sur l'île d'une créature qui fait signe, la créature fait un saut lent, une fois ; puis
// l'icône de la notion se pose au-dessus d'elle : une plaque carrée aux coins presque droits dans Blocland (un bloc vu
// de face), un disque dans Archipéo (l'habillage, `signe`), claire et cerclée de sombre, l'icône au trait, toujours face à
// l'écran, de taille fixe, sans brume ni lumière (lisible de jour comme de nuit), qui ne bouge pas et ne clignote pas.
// Toutes les icônes de l'archipel tiennent en un seul appel de dessin : un maillage de quadrilatères, une texture
// (une case par icône), refait image par image face à la caméra. Rien sur la Carte ni pendant le voyage.
// La commande d'une créature (GD-7, PR 3) prend la même plaque, au même geste ; seule l'image change : le bloc demandé,
// en cube vu de trois quarts, avec les couleurs de Mes blocs (`BlockIcon`), cerné du même trait sombre que les icônes
// (un bloc pâle, la glace ou le verre, reste lisible sur le fond clair).
import * as THREE from 'three';
import { BLOCKS, type BiomeId, type BlockId } from '../biomes';
import { project, shade } from '../Voxel';
import type { AnyIconName } from '../../components/Icon';
import { tracesDeLIcone } from '../../components/iconeTracee';
import { GESTE_DU_SIGNE, ICONE_DU_SIGNE, iconeDuSigneVisible } from '../world/signe';
import type { SigneDeCreature } from '../world/view';
import type { Habillage } from '../habillage';
import type { Derniers, Instant, Monde, PartieDeLaScene } from './partie';
import type { Personnages } from './personnages';
import type { LabelBox } from '../world/labelLayout';

/** Une case de la texture, en pixels (la plaque et son icône, assez grandes pour un écran à deux pixels par point). */
const CASE = 128;
/** Quatre cases par côté : seize icônes, plus que d'îles dans un archipel. */
const COTE = 4;
export const SIGNES_MAX = COTE * COTE;
/** Les quatre coins d'un quadrilatère, en demi-tailles : bas gauche, bas droite, haut droite, haut gauche. */
const COINS = [-1, -1, 1, -1, 1, 1, -1, 1] as const;

/** Le fond et le trait (générés ici, rien d'emprunté) : clair et chaud, cerclé et tracé d'un brun presque noir. */
const FOND = '#fff6e0';
const ENCRE = '#2b2118';
/** La marge autour de la plaque dans sa case, et le rayon de ses coins presque droits, en pixels de la case. */
const MARGE = 6;
const COIN = 6;

export interface Signes extends PartieDeLaScene {
  /** Les créatures qui font signe (refait quand la liste change). */
  poser(signes: SigneDeCreature[]): void;
  /** Le maillage des icônes (pour les tests et les mesures). */
  readonly maillage: THREE.Mesh;
  /** La hauteur de la vue, en pixels CSS, donnée au redimensionnement (jamais lue dans le DOM image par image). */
  redimensionner(hauteur: number): void;
  /**
   * Les plaques montrées, à l'écran vu par `cam` (W × H pixels CSS) : des obstacles pour les étiquettes des îles, qui
   * s'en écartent (une étiquette ne couvre jamais une plaque). Hors de la Carte seulement.
   */
  boites(cam: THREE.Camera, W: number, H: number): LabelBox[];
  /** Change quand une plaque apparaît, disparaît ou se déplace d'une case : les étiquettes se replacent alors. */
  readonly version: number;
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

/** Ce que montre une plaque : l'icône d'une notion (révisions), ou le bloc demandé (commande). */
export type ImageDuSigne = { icone: AnyIconName } | { bloc: BlockId };

/** La clé d'une image dans la texture : une case par icône ou par bloc. */
const cleDeLImage = (image: ImageDuSigne): string => ('bloc' in image ? `bloc:${image.bloc}` : `icone:${image.icone}`);

/** La demi-hauteur du cube d'un bloc sur sa plaque, en pixels de la case (le cube tient dans 0,6 de la case). */
const DEMI_CUBE = CASE * 0.3;

/**
 * Le bloc demandé, au milieu de la case : le cube de `BlockIcon` (Voxel.tsx : le dessus, la face gauche, la face droite
 * plus sombre, mêmes couleurs, même projection), centré, puis son contour et ses deux arêtes intérieures au trait sombre.
 */
function dessinerLeBloc(ctx: CanvasRenderingContext2D, cx: number, cy: number, bloc: BlockId): void {
  const b = BLOCKS[bloc];
  const p = (x: number, y: number, z: number): [number, number] => {
    const [px, py] = project(x, y, z, DEMI_CUBE);
    return [cx + px, cy + py];
  };
  const face = (points: [number, number][], fond: string) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = fond;
    ctx.fill();
  };
  face([p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1)], b.top ?? shade(b.side, 0.16));
  face([p(0, 1, 1), p(1, 1, 1), p(1, 1, 0), p(0, 1, 0)], b.side);
  face([p(1, 0, 1), p(1, 1, 1), p(1, 1, 0), p(1, 0, 0)], shade(b.side, -0.18));
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ENCRE;
  ctx.lineWidth = 5;
  ctx.beginPath();
  [p(0, 0, 1), p(1, 0, 1), p(1, 0, 0), p(1, 1, 0), p(0, 1, 0), p(0, 1, 1)].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const [x, y] of [p(0, 1, 1), p(1, 0, 1), p(1, 1, 0)]) {
    const [mx, my] = p(1, 1, 1);
    ctx.moveTo(mx, my);
    ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/** Dessine une case : la plaque (ou le disque), puis l'icône au trait rond, comme `Icon` (trait de 2,5 sur 24), ou le bloc. */
export function dessinerLaCase(ctx: CanvasRenderingContext2D, rang: number, image: ImageDuSigne, forme: Habillage['signe']): void {
  const x0 = (rang % COTE) * CASE;
  const y0 = Math.floor(rang / COTE) * CASE;
  ctx.save();
  ctx.clearRect(x0, y0, CASE, CASE);
  ctx.beginPath();
  if (forme === 'plaque') contourDeLaPlaque(ctx, x0 + MARGE, y0 + MARGE, CASE - 2 * MARGE, COIN);
  else ctx.arc(x0 + CASE / 2, y0 + CASE / 2, CASE / 2 - MARGE, 0, Math.PI * 2);
  ctx.fillStyle = FOND;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = ENCRE;
  ctx.stroke();
  if ('bloc' in image) dessinerLeBloc(ctx, x0 + CASE / 2, y0 + CASE / 2, image.bloc);
  else if (typeof Path2D !== 'undefined') {
    const echelle = (CASE * 0.56) / 24;
    ctx.translate(x0 + (CASE - 24 * echelle) / 2, y0 + (CASE - 24 * echelle) / 2);
    ctx.scale(echelle, echelle);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const d of tracesDeLIcone(image.icone)) ctx.stroke(new Path2D(d));
  }
  ctx.restore();
}

export function creerSignes(monde: Monde, el: HTMLElement, camera: THREE.PerspectiveCamera, personnages: Personnages, derniers: { current: Derniers }, instant: Instant): Signes {
  const { scene } = monde;
  const forme = monde.habillage.signe;
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
  // Par-dessus le relief, sous la flèche de la Carte (12) ; on ne le touche pas (la créature se touche, pas son icône).
  maillage.renderOrder = 11;
  maillage.frustumCulled = false;
  maillage.raycast = () => {};
  maillage.visible = false;
  scene.add(maillage);

  /** Les signes posés, leur case dans la texture et la hauteur de l'icône, mesurée une fois au repos. */
  let signes: { id: BiomeId; rang: number; y: number | null }[] = [];
  /** Le début du geste de chaque île arrivée (une fois par île pour la vie de la scène). */
  const gestes = new Map<BiomeId, number>();
  /** La dernière demande de cadrage vue (l'île et son numéro) : une nouvelle arrivée sur une île déclenche son geste. */
  let derniereIle: BiomeId | null | undefined;
  let dernierSeq = -1;

  const caseDe = (image: ImageDuSigne): number => {
    const cle = cleDeLImage(image);
    const deja = cases.get(cle);
    if (deja !== undefined) return deja;
    const rang = dessinees++ % SIGNES_MAX;
    // Plus de seize icônes dans la vie de la scène (jamais vu : une scène par archipel) : la case la plus ancienne sert.
    for (const [autre, r] of cases) if (r === rang) cases.delete(autre);
    if (ctx) dessinerLaCase(ctx, rang, image, forme);
    texture.needsUpdate = true;
    cases.set(cle, rang);
    return rang;
  };

  const tete = new THREE.Vector3();
  const centre = new THREE.Vector3();
  const droite = new THREE.Vector3();
  const haut = new THREE.Vector3();
  const vue = new THREE.Vector3();

  /** La case de texture écrite dans chaque place du maillage (-1 : aucune) : on ne la réécrit que si elle change. */
  const casesEcrites = new Array<number>(SIGNES_MAX).fill(-1);
  /** Le centre de chaque plaque montrée (les `montrees` premières), et la case de chacune (pour `version`). */
  const centres = Array.from({ length: SIGNES_MAX }, () => new THREE.Vector3());
  const casesVues = new Int32Array(SIGNES_MAX * 3);
  let montrees = 0;
  let version = 0;
  const aLEcran = new THREE.Vector3();

  /** Les plaques montrées ont changé (nombre, ou case de l'une) : la version monte. Sans rien allouer. */
  const noter = (n: number) => {
    let change = n !== montrees;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < 3; j++) {
        const v = Math.round(centres[i].getComponent(j));
        if (casesVues[3 * i + j] !== v) {
          casesVues[3 * i + j] = v;
          change = true;
        }
      }
    montrees = n;
    if (change) version++;
  };

  return {
    maillage,
    get version() {
      return version;
    },
    boites: (cam, W, H) => {
      const out: LabelBox[] = [];
      const cote = ICONE_DU_SIGNE.css + 8;
      for (let i = 0; i < montrees; i++) {
        aLEcran.copy(centres[i]).project(cam);
        if (aLEcran.z > 1) continue;
        out.push({ x: ((aLEcran.x + 1) / 2) * W, y: ((1 - aLEcran.y) / 2) * H, w: cote, h: cote });
      }
      return out;
    },
    redimensionner: (hauteur) => {
      hauteurDeLaVue = hauteur;
    },
    poser: (liste) => {
      signes = liste.slice(0, SIGNES_MAX).map((s) => ({ id: s.id, rang: caseDe(s.bloc ? { bloc: s.bloc } : { icone: s.icone }), y: null }));
    },
    animer: (_t, _dt, reduit) => {
      const { focus, carte } = derniers.current;
      // L'arrivée sur une île : son geste, une fois, le temps que la caméra arrive (rien avec moins d'animations).
      if (focus.island !== derniereIle || focus.seq !== dernierSeq) {
        derniereIle = focus.island;
        dernierSeq = focus.seq;
        const ile = focus.island;
        if (ile && !carte && !reduit && !gestes.has(ile) && signes.some((s) => s.id === ile)) {
          const debut = instant.now + GESTE_DU_SIGNE.attenteMs;
          gestes.set(ile, debut);
          personnages.faireSigne(ile, debut);
        }
      }
      if (!signes.length || carte || instant.carte || instant.navigue) {
        maillage.visible = false;
        if (montrees) noter(0);
        return;
      }
      camera.updateMatrixWorld();
      const e = camera.matrixWorld.elements;
      droite.set(e[0], e[1], e[2]).normalize();
      haut.set(e[4], e[5], e[6]).normalize();
      const pxParUnite = hauteurDeLaVue / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
      let n = 0;
      for (const s of signes) {
        if (!iconeDuSigneVisible(gestes.get(s.id) ?? null, instant.now, reduit) || !personnages.teteDe(s.id, tete)) continue;
        // La hauteur se mesure une fois, au repos (le geste fini) : l'icône reste fixe pendant le balancement.
        s.y ??= tete.y + ICONE_DU_SIGNE.auDessus;
        tete.y = s.y;
        // Sa taille à l'écran ne dépend pas de la distance : en unités du monde, à la profondeur de la tête.
        const profondeur = Math.max(0.5, -vue.copy(tete).applyMatrix4(camera.matrixWorldInverse).z);
        const demi = (ICONE_DU_SIGNE.css * profondeur) / Math.max(1, pxParUnite) / 2;
        centre.copy(tete).addScaledVector(haut, demi);
        centres[n].copy(centre);
        for (let j = 0; j < 4; j++) {
          const sx = COINS[2 * j] * demi;
          const sy = COINS[2 * j + 1] * demi;
          const k = n * 12 + 3 * j;
          positions[k] = centre.x + droite.x * sx + haut.x * sy;
          positions[k + 1] = centre.y + droite.y * sx + haut.y * sy;
          positions[k + 2] = centre.z + droite.z * sx + haut.z * sy;
        }
        if (casesEcrites[n] !== s.rang) {
          casesEcrites[n] = s.rang;
          const u = (s.rang % COTE) / COTE;
          const v = 1 - (Math.floor(s.rang / COTE) + 1) / COTE;
          for (let j = 0; j < 4; j++) {
            uvs[n * 8 + 2 * j] = u + ((COINS[2 * j] + 1) / 2) * (1 / COTE);
            uvs[n * 8 + 2 * j + 1] = v + ((COINS[2 * j + 1] + 1) / 2) * (1 / COTE);
          }
          attrUvs.needsUpdate = true;
        }
        n++;
      }
      noter(n);
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
