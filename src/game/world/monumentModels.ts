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
import { getMonument } from './monuments';
import { LAYERS } from './projects';
import type { Cell } from './view';
import type { ModeleLu } from './characters/imported/glb';

/** Ce qu'il faut savoir d'un monument importé : le nom de son dossier, son nombre d'étapes avant le modèle entier. */
interface ModeleDeMonument {
  /** Le dossier du modèle, dans docs/univers/archipeo/monuments/modeles/. */
  nom: string;
  /** Les étapes de chantier (`etape-1.glb`… ; le modèle entier, `final-3000.glb`, vient après). */
  etapes: number;
  /**
   * De combien de quarts de tour le modèle tourne, en plus du demi-tour qui met sa façade (+Z dans un .glb) face à
   * l'élève (−Z, le devant du plan, en y = 0) : le viaduc, long dans le .glb, prend la longueur de son plan (x).
   */
  quarts: number;
}

/** Les huit monuments qui ont leur modèle (les grands projets neufs de la 4e et de la 3e gardent leurs blocs). */
export const MODELES_DES_MONUMENTS: Readonly<Record<string, ModeleDeMonument>> = {
  'landmark-6e-1': { nom: '6e-monument-observatoire-des-baleines', etapes: 2, quarts: 0 },
  'landmark-6e-2': { nom: '6e-monument-grand-moulin', etapes: 2, quarts: 0 },
  // Le phare du large, en cinq pièces comme son grand projet (GD-10, ./projects.ts) : une étape par pièce posée.
  'landmark-5e-1': { nom: '5e-monument-phare-du-large', etapes: 4, quarts: 0 },
  'landmark-5e-2': { nom: '5e-monument-kiosque-a-musique', etapes: 2, quarts: 0 },
  'landmark-4e-1': { nom: '4e-monument-viaduc', etapes: 2, quarts: 1 },
  'landmark-4e-2': { nom: '4e-monument-amphitheatre', etapes: 2, quarts: 0 },
  'landmark-3e-1': { nom: '3e-monument-observatoire-des-etoiles', etapes: 2, quarts: 0 },
  'landmark-3e-2': { nom: '3e-monument-temple-de-marbre', etapes: 2, quarts: 0 },
};

/** Le côté de l'emprise d'un monument, en cases : le modèle y tient, centré (./monuments.ts, les 7 × 7 du milieu de l'îlot). */
export const EMPRISE_DU_MONUMENT = 7;

/** Le fichier de l'étape `etape` (1 à `etapes`), ou du modèle entier (`etapes + 1`). */
export function fichierDeLEtape(etape: number, etapes: number): string {
  return etape > etapes ? 'final-3000.glb' : `etape-${etape}.glb`;
}

/** Les étapes à charger pour un monument : 1 à `etapes`, puis le modèle entier (`etapes + 1`). */
export function etapesDuMonument(id: string): number[] {
  const m = MODELES_DES_MONUMENTS[id];
  return m ? Array.from({ length: m.etapes + 1 }, (_, i) => i + 1) : [];
}

/**
 * L'étape que montre un chantier de `total` cases dont `posees` sont posées, pour un modèle de `etapes` étapes : 0 (les
 * cubes posés et les fantômes, comme sans modèle) tant que moins d'une part sur `etapes + 1` est posée ; puis l'étape
 * `k` dès `k` parts posées ; `etapes + 1` (le modèle entier) quand tout est posé. Deux étapes : un tiers, deux tiers.
 */
export function etapeAffichee(posees: number, total: number, etapes: number): number {
  if (total <= 0 || posees <= 0) return 0;
  if (posees >= total) return etapes + 1;
  // En entiers : posees / total ≥ k / (etapes + 1).
  return Math.min(etapes, Math.floor((posees * (etapes + 1)) / total));
}

// ---------- Le registre ----------

const lus = new Map<string, ModeleLu>();
/** Les modèles posés au pied, centrés et à l'échelle, faits une fois par étape. */
const prets = new Map<string, FacettesLocales>();
let version = 0;
const cle = (id: string, etape: number) => `${id}:${etape}`;

/** Range une étape lue (par la vue ou par un test). */
export function enregistrerUnMonument(id: string, etape: number, lu: ModeleLu): void {
  lus.set(cle(id, etape), lu);
  // L'échelle de toutes les étapes vient du modèle entier : on les refait.
  for (const k of prets.keys()) if (k.startsWith(`${id}:`)) prets.delete(k);
  version++;
}

/** Change à chaque modèle rangé : la construction refait alors ses îles (./construction.ts, `construireParIle`). */
export const versionDesMonuments = (): number => version;

/** Le monument a-t-il toutes ses étapes et son modèle entier ? Sinon, il garde ses blocs. */
export function monumentCharge(id: string): boolean {
  const e = etapesDuMonument(id);
  return e.length > 0 && e.every((k) => lus.has(cle(id, k)));
}

// ---------- La pose ----------

/** Un modèle posé au pied du monument, au milieu de son emprise (repère Three, x et z autour de 0, y depuis 0). */
interface FacettesLocales {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
}

/**
 * Met une étape au format du monde : tournée face à l'élève (le demi-tour, puis `quarts` quarts), centrée sur le milieu
 * de l'emprise du modèle entier, à l'échelle où le modèle entier tient dans `EMPRISE_DU_MONUMENT` cases, posée à y = 0 ;
 * une normale par facette (les facettes sont plates).
 */
function poserEnLocal(etape: ModeleLu, entier: ModeleLu, quarts: number): FacettesLocales {
  const tourner = (x: number, z: number): [number, number] => {
    let [u, v] = [-x, -z];
    for (let q = 0; q < ((quarts % 4) + 4) % 4; q++) [u, v] = [-v, u];
    return [u, v];
  };
  let [x0, x1, z0, z1, y0] = [Infinity, -Infinity, Infinity, -Infinity, Infinity];
  const p = entier.positions;
  for (let i = 0; i < p.length; i += 3) {
    const [u, v] = tourner(p[i], p[i + 2]);
    x0 = Math.min(x0, u);
    x1 = Math.max(x1, u);
    z0 = Math.min(z0, v);
    z1 = Math.max(z1, v);
    y0 = Math.min(y0, p[i + 1]);
  }
  const k = EMPRISE_DU_MONUMENT / Math.max(x1 - x0, z1 - z0, 1e-6);
  const [cx, cz] = [(x0 + x1) / 2, (z0 + z1) / 2];
  const q = etape.positions;
  const positions = new Float32Array(q.length);
  for (let i = 0; i < q.length; i += 3) {
    const [u, v] = tourner(q[i], q[i + 2]);
    positions[i] = (u - cx) * k;
    positions[i + 1] = (q[i + 1] - y0) * k;
    positions[i + 2] = (v - cz) * k;
  }
  const normals = new Float32Array(q.length);
  for (let t = 0; t < positions.length; t += 9) {
    const a = [positions[t + 3] - positions[t], positions[t + 4] - positions[t + 1], positions[t + 5] - positions[t + 2]];
    const b = [positions[t + 6] - positions[t], positions[t + 7] - positions[t + 1], positions[t + 8] - positions[t + 2]];
    const n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const l = Math.hypot(n[0], n[1], n[2]) || 1;
    for (let s = 0; s < 3; s++) for (let j = 0; j < 3; j++) normals[t + 3 * s + j] = n[j] / l;
  }
  return { positions, normals, colors: etape.colors };
}

/** Une étape posée en local, faite une fois (`null` si le monument n'est pas tout chargé). */
function enLocal(id: string, etape: number): FacettesLocales | null {
  const m = MODELES_DES_MONUMENTS[id];
  if (!m || !monumentCharge(id)) return null;
  const k = cle(id, etape);
  let f = prets.get(k);
  if (!f) {
    const lu = lus.get(k);
    const entier = lus.get(cle(id, m.etapes + 1));
    if (!lu || !entier) return null;
    prets.set(k, (f = poserEnLocal(lu, entier, m.quarts)));
  }
  return f;
}

/**
 * Le feu d'un monument qui s'allume fini (`MonumentDef.litWhenDone`, le phare du large) : une facette orangée et vive
 * du modèle, qui prend la lueur la nuit (dans les fenêtres de la construction), sans pulser.
 */
export function estUnFeu(r: number, g: number, b: number): boolean {
  // Couleurs linéaires, ramenées à peu près en sRGB pour le seuil.
  const [R, G, B] = [r, g, b].map((c) => Math.pow(Math.max(c, 0), 1 / 2.2));
  return R > 0.8 && G > 0.4 && R - B > 0.45;
}

/** Un monument importé tel que le monde le montre : l'étape, ses facettes posées dans le monde, les cases qu'elle remplace. */
export interface MonumentImporte {
  id: string;
  /** L'étape montrée (1 à `etapes`, ou `etapes + 1` : le modèle entier). */
  etape: number;
  /** Le modèle, dans l'opaque. */
  opaque: FacettesDuDecor;
  /** Son feu, allumé la nuit (seulement fini, sur une île ouverte, pour un monument qui s'allume) ; sinon vide. */
  feu: FacettesDuDecor;
  /** Les cases posées que le modèle remplace (pour le toucher et la construction : leurs clés « x,y,z »). */
  cellules: Cell[];
  remplacees: Set<string>;
}

const cleDeCase = (x: number, y: number, z: number) => `${x},${y},${z}`;

/**
 * Les monuments importés de ce monde, chargés et assez avancés : pour chacun, l'étape que suit l'avancée du plan, son
 * modèle posé au milieu de l'emprise, au pied du monument, et les cases posées qu'il remplace. Un grand projet (le phare du large, `LAYERS`) compte ses pièces finies, d'un tenant
 * depuis le bas : une étape par pièce, comme son modèle taillé l'était.
 */
export function monumentsImportes(cubes: readonly VoxelCube[]): MonumentImporte[] {
  const parLieu = new Map<string, VoxelCube[]>();
  for (const c of cubes) {
    if (c.sol || !c.place?.startsWith('monument:')) continue;
    const id = c.place.slice('monument:'.length);
    if (!MODELES_DES_MONUMENTS[id] || !monumentCharge(id)) continue;
    const l = parLieu.get(id);
    if (l) l.push(c);
    else parLieu.set(id, [c]);
  }
  const out: MonumentImporte[] = [];
  for (const [id, siens] of parLieu) {
    const plan = getMonument(id);
    const m = MODELES_DES_MONUMENTS[id];
    if (!plan || !plan.cells.length) continue;
    const posees = siens.filter((c) => !c.ghost);
    const pied = Math.min(...siens.map((c) => c.z));
    const etape = LAYERS[id] ? piecesFinies(id, siens, pied, m.etapes) : etapeAffichee(posees.length, siens.length, m.etapes);
    const local = etape > 0 ? enLocal(id, etape) : null;
    if (!local) continue;
    // Le coin de l'emprise : les cases du plan sont posées en (coin + case) ; le modèle au milieu des 7 × 7.
    const minDe = (k: 'x' | 'y' | 'z', l: readonly { x: number; y: number; z: number }[]) => Math.min(...l.map((c) => c[k]));
    const ox = minDe('x', siens) - minDe('x', plan.cells) + EMPRISE_DU_MONUMENT / 2;
    const oz = minDe('y', siens) - minDe('y', plan.cells) + EMPRISE_DU_MONUMENT / 2;
    const oy = pied - minDe('z', plan.cells);
    const muted = posees.some((c) => c.muted);
    const allume = etape > m.etapes && plan.litWhenDone !== undefined && !muted;
    const opaque = coquille();
    const feu = coquille();
    const delave = DELAVE_LINEAIRE;
    const p = local.positions;
    const col = local.colors;
    for (let t = 0; t < p.length; t += 9) {
      const dans = allume && estUnFeu(col[t], col[t + 1], col[t + 2]) ? feu : opaque;
      for (let s = 0; s < 9; s += 3) {
        const i = t + s;
        dans.pos.push(p[i] + ox, p[i + 1] + oy, p[i + 2] + oz);
        dans.nor.push(local.normals[i], local.normals[i + 1], local.normals[i + 2]);
        if (muted) for (let j = 0; j < 3; j++) dans.col.push(col[i + j] + (delave.couleur[j] - col[i + j]) * delave.force);
        else dans.col.push(col[i], col[i + 1], col[i + 2]);
      }
    }
    const remplacees = new Set(posees.map((c) => cleDeCase(c.x, c.y, c.z)));
    out.push({ id, etape, opaque: fin(opaque), feu: fin(feu), cellules: posees.map((c) => ({ x: c.x, y: c.y, z: c.z })), remplacees });
  }
  return out;
}

/** Les pièces finies d'un grand projet, d'un tenant depuis le bas : 0 à `etapes + 1` (toutes : le modèle entier). */
function piecesFinies(id: string, siens: readonly VoxelCube[], pied: number, etapes: number): number {
  const couches = Object.values(LAYERS[id]);
  let n = 0;
  for (const [bas, haut] of couches) {
    const cases = siens.filter((c) => c.z - pied >= bas && c.z - pied <= haut);
    if (!cases.length || cases.some((c) => c.ghost)) break;
    n++;
  }
  return n >= couches.length ? etapes + 1 : Math.min(n, etapes);
}

/** La couleur d'une île fermée, en linéaire, et sa force (./decor/brush.ts, `DELAVE`). */
const DELAVE_LINEAIRE = { couleur: rgb(DELAVE[0]).map((c) => lineaire(c / 255)), force: DELAVE[1] };

const coquille = () => ({ pos: [] as number[], nor: [] as number[], col: [] as number[] });
const fin = (f: ReturnType<typeof coquille>): FacettesDuDecor => ({
  positions: Float32Array.from(f.pos),
  normals: Float32Array.from(f.nor),
  colors: Float32Array.from(f.col),
  elements: new Int32Array(f.pos.length / 9),
});
