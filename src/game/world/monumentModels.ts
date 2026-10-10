// Les monuments d'Archipéo importés (décision du mainteneur, 8 octobre 2026, docs/univers/archipeo/monuments/) : un
// modèle TRELLIS par monument, réduit à 3 000 triangles et coupé par la hauteur en étapes de chantier dans Blender
// (scripts/rendu/modeles/monument_etapes.py). Code pur, sans DOM ni Three.js : le registre des modèles, le choix de
// l'étape que montre un chantier et la pose du modèle sur son îlot, que la construction taillée (./construction.ts) et
// le budget lisent. Ce qui charge les fichiers est à part (../importedMonuments.ts, et le disque pour les tests et le
// budget : ./monumentModels.fromDisk.testing.ts).
//
// Le jeu ne change pas : le plan, ses cases, le toucher et la sauvegarde restent ceux du monument (./monuments.ts,
// commun à Blocland). L'étape affichée suit l'avancée du plan ; elle remplace les cubes posés, les fantômes des cases à
// poser restent ; un seul modèle à l'écran. Tant que tous les fichiers d'un monument ne sont pas chargés (ou hors ligne
// sans eux), le monument garde son rendu en blocs.
import type { VoxelCube } from '../Voxel';
import { DELAVE, rgb, type FacettesDuDecor } from './decor/brush';
import { lineaire } from './landMesh';
import { getMonument, MONUMENT_ISLET } from './monuments';
import { LAYERS } from './projects';
import type { Cell } from './view';
import type { ModeleLu } from './characters/imported/glb';

/** Ce qu'il faut savoir d'un monument importé : le nom de son dossier, son nombre d'étapes avant le modèle entier. */
interface MonumentModel {
  /** Le dossier du modèle, dans docs/univers/archipeo/monuments/modeles/. */
  folder: string;
  /** Les étapes de chantier (`etape-1.glb`… ; le modèle entier, `final-3000.glb`, vient après). */
  stages: number;
  /**
   * De combien de quarts de tour le modèle tourne, en plus du demi-tour qui met sa façade (+Z dans un .glb) face à
   * l'élève (−Z, le devant du plan, en y = 0) : le viaduc, long dans le .glb, prend la longueur de son plan (x).
   */
  quarterTurns: number;
  /**
   * Un décalage du modèle dans l'emprise, en cases (x, puis z : le devant du plan est en −z, du côté de la caméra de
   * jeu), quand son voisin le cache : le viaduc, collé sous la falaise de la Gare du futur, avance vers la caméra.
   */
  shift?: { x: number; z: number };
}

/** Les huit monuments qui ont leur modèle (les grands projets neufs de la 4e et de la 3e gardent leurs blocs). */
export const MONUMENT_MODELS: Readonly<Record<string, MonumentModel>> = {
  'landmark-6e-1': { folder: '6e-monument-observatoire-des-baleines', stages: 2, quarterTurns: 0 },
  // Le grand moulin : ses ailes sont dans le plan du fond de sa face −X (.glb) ; trois quarts de tour de plus (en tout
  // −X du fichier vers −z) les mettent de face à la caméra de jeu, le X des quatre ailes en plein devant (relu sur les
  // planches, directeur artistique, 10 octobre 2026). Les sept autres montrent déjà leur devant (porte, escalier,
  // scène) ou n'en ont pas.
  'landmark-6e-2': { folder: '6e-monument-grand-moulin', stages: 2, quarterTurns: 3 },
  // Le phare du large, en cinq pièces comme son grand projet (GD-10, ./projects.ts) : une étape par pièce posée.
  'landmark-5e-1': { folder: '5e-monument-phare-du-large', stages: 4, quarterTurns: 0 },
  'landmark-5e-2': { folder: '5e-monument-kiosque-a-musique', stages: 2, quarterTurns: 0 },
  'landmark-4e-1': { folder: '4e-monument-viaduc', stages: 2, quarterTurns: 1, shift: { x: 0, z: -2 } },
  'landmark-4e-2': { folder: '4e-monument-amphitheatre', stages: 2, quarterTurns: 0 },
  'landmark-3e-1': { folder: '3e-monument-observatoire-des-etoiles', stages: 2, quarterTurns: 0 },
  'landmark-3e-2': { folder: '3e-monument-temple-de-marbre', stages: 2, quarterTurns: 0 },
};

/** Le côté de l'emprise d'un monument, en cases : le modèle y tient, centré (./monuments.ts, les 7 × 7 du milieu de l'îlot). */
export const MONUMENT_FOOTPRINT = 7;

/**
 * Le plus long côté, au sol, qu'un modèle peut prendre en grandissant pour ne pas être plus bas que son plan : celui de
 * l'îlot (9 cases, ./monuments.ts) ; au-delà, il déborderait sur l'eau. Un modèle très large et bas (le viaduc, le phare
 * du large) peut donc rester sous la hauteur de son plan.
 */
export const MONUMENT_MAX_SPAN = MONUMENT_ISLET;

/** Le fichier de l'étape `etape` (1 à `etapes`), ou du modèle entier (`etapes + 1`). */
export function stageFile(stage: number, stages: number): string {
  return stage > stages ? 'final-3000.glb' : `etape-${stage}.glb`;
}

/** Les étapes à charger pour un monument : 1 à `etapes`, puis le modèle entier (`etapes + 1`). */
export function monumentStages(id: string): number[] {
  const m = MONUMENT_MODELS[id];
  return m ? Array.from({ length: m.stages + 1 }, (_, i) => i + 1) : [];
}

/**
 * L'étape que montre un chantier de `total` cases dont `posees` sont posées, pour un modèle de `etapes` étapes : 0 (les
 * cubes posés et les fantômes, comme sans modèle) tant que moins d'une part sur `etapes + 1` est posée ; puis l'étape
 * `k` dès `k` parts posées ; `etapes + 1` (le modèle entier) quand tout est posé. Deux étapes : un tiers, deux tiers.
 */
export function shownStage(placedCubes: number, total: number, stages: number): number {
  if (total <= 0 || placedCubes <= 0) return 0;
  if (placedCubes >= total) return stages + 1;
  // En entiers : posees / total ≥ k / (etapes + 1).
  return Math.min(stages, Math.floor((placedCubes * (stages + 1)) / total));
}

// ---------- Le registre ----------

const loaded = new Map<string, ModeleLu>();
/** Les modèles posés au pied, centrés et à l'échelle, faits une fois par étape. */
const placed = new Map<string, LocalFacets>();
/** L'échelle et le centre de chaque modèle entier (les étapes la partagent). */
const fits = new Map<string, Fit>();
let version = 0;
const keyOf = (id: string, stage: number) => `${id}:${stage}`;

/** Range une étape lue (par la vue ou par un test). */
export function registerMonument(id: string, stage: number, read: ModeleLu): void {
  loaded.set(keyOf(id, stage), read);
  // L'échelle de toutes les étapes vient du modèle entier : on les refait.
  for (const k of placed.keys()) if (k.startsWith(`${id}:`)) placed.delete(k);
  fits.delete(id);
  version++;
}

/** Change à chaque modèle rangé : la construction refait alors ses îles (./construction.ts, `construireParIle`). */
export const monumentsVersion = (): number => version;

/** Le monument a-t-il toutes ses étapes et son modèle entier ? Sinon, il garde ses blocs. */
export function isMonumentLoaded(id: string): boolean {
  const e = monumentStages(id);
  return e.length > 0 && e.every((k) => loaded.has(keyOf(id, k)));
}

// ---------- La pose ----------

/** Un modèle posé au pied du monument, au milieu de son emprise (repère Three, x et z autour de 0, y depuis 0). */
interface LocalFacets {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  /** La hauteur de coupe de l'étape (le haut du tronçon), en cases au-dessus du pied. */
  top: number;
}

/** La boîte du plan en cubes d'un monument : sa largeur (x), sa profondeur et sa hauteur, en cases. */
interface PlanBox {
  w: number;
  d: number;
  h: number;
}

/** Comment le modèle entier se pose : l'échelle, le centre au sol (avant échelle) et le pied. */
interface Fit {
  k: number;
  cx: number;
  cz: number;
  y0: number;
}

/**
 * L'échelle du modèle entier. Règle : un monument fini n'est jamais plus petit ni plus bas que la silhouette de son plan
 * en cubes. L'échelle est la plus grande de : celle où son plus long côté au sol tient dans `MONUMENT_FOOTPRINT` cases,
 * et celles où il couvre la largeur, la profondeur et la hauteur du plan ; bornée à `MONUMENT_MAX_SPAN` cases au sol (le
 * débord, au plus jusqu'au bord de l'îlot). Quand la borne l'emporte, la hauteur du plan n'est pas atteinte.
 */
function fitOf(whole: ModeleLu, quarterTurns: number, plan: PlanBox): Fit {
  let [x0, x1, z0, z1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity];
  const p = whole.positions;
  for (let i = 0; i < p.length; i += 3) {
    const [u, v] = turn(p[i], p[i + 2], quarterTurns);
    x0 = Math.min(x0, u);
    x1 = Math.max(x1, u);
    z0 = Math.min(z0, v);
    z1 = Math.max(z1, v);
    y0 = Math.min(y0, p[i + 1]);
    y1 = Math.max(y1, p[i + 1]);
  }
  const [w, d, h] = [Math.max(x1 - x0, 1e-6), Math.max(z1 - z0, 1e-6), Math.max(y1 - y0, 1e-6)];
  const ground = MONUMENT_FOOTPRINT / Math.max(w, d);
  const wanted = Math.max(ground, plan.w / w, plan.d / d, plan.h / h);
  return { k: Math.max(ground, Math.min(wanted, MONUMENT_MAX_SPAN / Math.max(w, d))), cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, y0 };
}

/** Le demi-tour qui met la façade (+Z d'un .glb) face à l'élève (−Z), puis `quarterTurns` quarts de tour. */
function turn(x: number, z: number, quarterTurns: number): [number, number] {
  let [u, v] = [-x, -z];
  for (let q = 0; q < ((quarterTurns % 4) + 4) % 4; q++) [u, v] = [-v, u];
  return [u, v];
}

/**
 * Met une étape au format du monde : tournée, centrée sur le milieu de l'emprise du modèle entier (plus `shift`), à
 * l'échelle de `fitOf`, posée à y = 0 ; une normale par facette (les facettes sont plates).
 */
function placeLocally(stage: ModeleLu, fit: Fit, quarterTurns: number, shift: { x: number; z: number }): LocalFacets {
  const { k, cx, cz, y0 } = fit;
  const q = stage.positions;
  const positions = new Float32Array(q.length);
  let top = 0;
  for (let i = 0; i < q.length; i += 3) {
    const [u, v] = turn(q[i], q[i + 2], quarterTurns);
    positions[i] = (u - cx) * k + shift.x;
    positions[i + 1] = (q[i + 1] - y0) * k;
    positions[i + 2] = (v - cz) * k + shift.z;
    top = Math.max(top, positions[i + 1]);
  }
  const normals = new Float32Array(q.length);
  for (let t = 0; t < positions.length; t += 9) {
    const a = [positions[t + 3] - positions[t], positions[t + 4] - positions[t + 1], positions[t + 5] - positions[t + 2]];
    const b = [positions[t + 6] - positions[t], positions[t + 7] - positions[t + 1], positions[t + 8] - positions[t + 2]];
    const n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const l = Math.hypot(n[0], n[1], n[2]) || 1;
    for (let s = 0; s < 3; s++) for (let j = 0; j < 3; j++) normals[t + 3 * s + j] = n[j] / l;
  }
  return { positions, normals, colors: stage.colors, top };
}

/** La boîte du plan d'un monument. */
function planBox(id: string): PlanBox | null {
  const plan = getMonument(id);
  if (!plan?.cells.length) return null;
  const span = (k: 'x' | 'y' | 'z') => {
    const v = plan.cells.map((c) => c[k]);
    return Math.max(...v) - Math.min(...v) + 1;
  };
  return { w: span('x'), d: span('y'), h: span('z') };
}

/** Une étape posée en local, faite une fois (`null` si le monument n'est pas tout chargé). */
function localStage(id: string, stage: number): LocalFacets | null {
  const m = MONUMENT_MODELS[id];
  if (!m || !isMonumentLoaded(id)) return null;
  const k = keyOf(id, stage);
  let f = placed.get(k);
  if (!f) {
    const read = loaded.get(k);
    const whole = loaded.get(keyOf(id, m.stages + 1));
    const box = planBox(id);
    if (!read || !whole || !box) return null;
    let fit = fits.get(id);
    if (!fit) fits.set(id, (fit = fitOf(whole, m.quarterTurns, box)));
    // Le décalage ne vaut que pour le modèle posé : le plan, ses cases et le toucher ne bougent pas.
    placed.set(k, (f = placeLocally(read, fit, m.quarterTurns, m.shift ?? { x: 0, z: 0 })));
  }
  return f;
}

/**
 * Le feu d'un monument qui s'allume fini (`MonumentDef.litWhenDone`, le phare du large) : une facette orangée et vive
 * du modèle, qui prend la lueur la nuit (dans les fenêtres de la construction), sans pulser.
 */
export function isFire(r: number, g: number, b: number): boolean {
  // Couleurs linéaires, ramenées à peu près en sRGB pour le seuil.
  const [R, G, B] = [r, g, b].map((c) => Math.pow(Math.max(c, 0), 1 / 2.2));
  return R > 0.8 && G > 0.4 && R - B > 0.45;
}

/**
 * Le halo d'un feu allumé : centré sur lui, de `HALO_DU_FEU` fois sa taille (au moins `HALO_DU_FEU_MIN` cases), pour qu'il
 * marque la nuit et se voie de loin depuis l'archipel sans éclairer l'île voisine (calé sur la lanterne du phare de
 * Blocland, directeur artistique, 10 octobre 2026), sans lumière dynamique (un sprite, un appel).
 */
const HALO_DU_FEU = 3;
export const HALO_DU_FEU_MIN = 4;
/** L'opacité du halo en pleine nuit (additif : il éclaircit, jamais ne voile) ; elle suit le degré de nuit, sans pulser. */
export const OPACITE_DU_HALO_DU_FEU = 0.45;
function fireHalo(f: ReturnType<typeof shell>): ImportedMonument['halo'] {
  if (!f.pos.length) return null;
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < f.pos.length; i++) {
    lo[i % 3] = Math.min(lo[i % 3], f.pos[i]);
    hi[i % 3] = Math.max(hi[i % 3], f.pos[i]);
  }
  const size = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]);
  return { centre: [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2], cote: Math.max(HALO_DU_FEU_MIN, HALO_DU_FEU * size) };
}

/** Un monument importé tel que le monde le montre : l'étape, ses facettes posées dans le monde, les cases qu'elle remplace. */
export interface ImportedMonument {
  id: string;
  /** L'étape montrée (1 à `etapes`, ou `etapes + 1` : le modèle entier). */
  stage: number;
  /** Le modèle, dans l'opaque. */
  opaque: FacettesDuDecor;
  /** Son feu, allumé la nuit (seulement fini, sur une île ouverte, pour un monument qui s'allume) ; sinon vide. */
  fire: FacettesDuDecor;
  /** Le halo du feu, la nuit (un sprite additif, fixe : three/construction.ts) ; `null` sans feu. */
  halo: { centre: [number, number, number]; cote: number } | null;
  /** Les cases posées que le modèle remplace (pour le toucher et la construction : leurs clés « x,y,z »). */
  cellules: Cell[];
  replaced: Set<string>;
}

const cellKey = (x: number, y: number, z: number) => `${x},${y},${z}`;

/**
 * Les monuments importés de ce monde, chargés et assez avancés : pour chacun, l'étape que suit l'avancée du plan, son
 * modèle posé au milieu de l'emprise, au pied du monument, et les cases posées qu'il remplace. Un grand projet (le phare du large, `LAYERS`) compte ses pièces finies, d'un tenant
 * depuis le bas : une étape par pièce, comme son modèle taillé l'était.
 */
export function getImportedMonuments(cubes: readonly VoxelCube[]): ImportedMonument[] {
  const byPlace = new Map<string, VoxelCube[]>();
  for (const c of cubes) {
    if (c.sol || !c.place?.startsWith('monument:')) continue;
    const id = c.place.slice('monument:'.length);
    if (!MONUMENT_MODELS[id] || !isMonumentLoaded(id)) continue;
    const l = byPlace.get(id);
    if (l) l.push(c);
    else byPlace.set(id, [c]);
  }
  const out: ImportedMonument[] = [];
  for (const [id, own] of byPlace) {
    const plan = getMonument(id);
    const m = MONUMENT_MODELS[id];
    if (!plan || !plan.cells.length) continue;
    const placedCubes = own.filter((c) => !c.ghost);
    const foot = Math.min(...own.map((c) => c.z));
    const oy = foot - Math.min(...plan.cells.map((c) => c.z));
    let stage = LAYERS[id] ? finishedPieces(id, own, foot, m.stages) : shownStage(placedCubes.length, own.length, m.stages);
    // Une étape ne s'affiche que si toutes les cases du plan sous sa hauteur de coupe sont posées : sinon les fantômes de
    // ces cases seraient dessinés dans le tronçon ; on retombe sur l'étape d'avant, ou sur les cubes. Le phare du large,
    // posé pièce par pièce de bas en haut, n'est pas concerné.
    const under = (top: number) => (c: VoxelCube) => c.z - oy + 0.5 < top;
    if (!LAYERS[id]) while (stage > 0 && stage <= m.stages && own.some((c) => c.ghost && under(localStage(id, stage)?.top ?? 0)(c))) stage--;
    const local = stage > 0 ? localStage(id, stage) : null;
    if (!local) continue;
    // Le coin de l'emprise : les cases du plan sont posées en (coin + case) ; le modèle au milieu des 7 × 7.
    const minOf = (k: 'x' | 'y', l: readonly { x: number; y: number }[]) => Math.min(...l.map((c) => c[k]));
    const ox = minOf('x', own) - minOf('x', plan.cells) + MONUMENT_FOOTPRINT / 2;
    const oz = minOf('y', own) - minOf('y', plan.cells) + MONUMENT_FOOTPRINT / 2;
    // Les cases que l'étape remplace : celles qu'elle recouvre ; au-dessus de sa coupe, les cubes posés restent.
    const covered = stage > m.stages || LAYERS[id] ? placedCubes : placedCubes.filter(under(local.top));
    const muted = placedCubes.some((c) => c.muted);
    const lit = stage > m.stages && plan.litWhenDone !== undefined && !muted;
    const opaque = shell();
    const fire = shell();
    const wash = LINEAR_WASH;
    const p = local.positions;
    const col = local.colors;
    for (let t = 0; t < p.length; t += 9) {
      const target = lit && isFire(col[t], col[t + 1], col[t + 2]) ? fire : opaque;
      for (let s = 0; s < 9; s += 3) {
        const i = t + s;
        target.pos.push(p[i] + ox, p[i + 1] + oy, p[i + 2] + oz);
        target.nor.push(local.normals[i], local.normals[i + 1], local.normals[i + 2]);
        if (muted) for (let j = 0; j < 3; j++) target.col.push(col[i + j] + (wash.color[j] - col[i + j]) * wash.strength);
        else target.col.push(col[i], col[i + 1], col[i + 2]);
      }
    }
    const replaced = new Set(covered.map((c) => cellKey(c.x, c.y, c.z)));
    const halo = fireHalo(fire);
    out.push({ id, stage, opaque: finish(opaque), fire: finish(fire), halo, cellules: covered.map((c) => ({ x: c.x, y: c.y, z: c.z })), replaced });
  }
  return out;
}

/** Les pièces finies d'un grand projet, d'un tenant depuis le bas : 0 à `etapes + 1` (toutes : le modèle entier). */
function finishedPieces(id: string, own: readonly VoxelCube[], foot: number, stages: number): number {
  const couches = Object.values(LAYERS[id]);
  let n = 0;
  for (const [bas, haut] of couches) {
    const cases = own.filter((c) => c.z - foot >= bas && c.z - foot <= haut);
    if (!cases.length || cases.some((c) => c.ghost)) break;
    n++;
  }
  return n >= couches.length ? stages + 1 : Math.min(n, stages);
}

/** La couleur d'une île fermée, en linéaire, et sa force (./decor/brush.ts, `DELAVE`). */
const LINEAR_WASH = { color: rgb(DELAVE[0]).map((c) => lineaire(c / 255)), strength: DELAVE[1] };

const shell = () => ({ pos: [] as number[], nor: [] as number[], col: [] as number[] });
const finish = (f: ReturnType<typeof shell>): FacettesDuDecor => ({
  positions: Float32Array.from(f.pos),
  normals: Float32Array.from(f.nor),
  colors: Float32Array.from(f.col),
  elements: new Int32Array(f.pos.length / 9),
});
