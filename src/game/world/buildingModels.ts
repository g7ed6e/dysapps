// Les bâtiments des plans d'Archipéo importés (décision du mainteneur, 10 octobre 2026 : « low poly avec aplats », comme
// les monuments, ./monumentModels.ts) : un modèle TRELLIS par île, réduit à 3 000 triangles de près, coupé en une étape
// de chantier, et sa version de loin en volumes simples qui suivent sa silhouette (scripts/rendu/modeles/batiment_loin.py,
// jamais plus de `BUILDING_FAR_TRIANGLES`) ; toute la chaîne : scripts/rendu/modeles/batiments.py. Code pur, sans DOM ni Three.js : le registre des modèles, l'étape
// que montre un bâtiment et la pose du modèle sur son île, que la construction taillée (./construction.ts) et le budget
// lisent. Ce qui charge les fichiers est à part (../importedBuildings.ts, et le disque pour les tests et le budget :
// ./buildingModels.fromDisk.testing.ts).
//
// Le jeu ne change pas : les trois plans de l'île, leurs cases, le toucher et la sauvegarde restent ceux du code. Le
// modèle prend la place des deux premiers plans (les murs, puis le toit : `ETAPES_DU_BATIMENT`) ; la cour (le troisième)
// reste en pièces du code (avis du directeur artistique). L'étape 1 se montre quand toutes les cases du premier plan sont
// posées, le modèle entier quand toutes celles du deuxième le sont aussi ; avant, les cubes posés et les fantômes, comme
// sans modèle ; les fantômes et les cubes posés du plan en cours restent. De près (l'île où se trouve l'élève) le modèle
// de 3 000 triangles, de loin sa version en volumes. Le modèle suit l'île posée et tournée (« Modifier le plan », GD-9).
// Tant que tous les fichiers d'un bâtiment ne sont pas chargés (ou hors ligne sans eux), il garde son rendu en blocs ;
// Blocland ne les charge jamais.
import type { BiomeId } from '../biomes';
import type { VoxelCube } from '../Voxel';
import type { ModeleLu } from './characters/imported/glb';
import { ETAPES_DU_BATIMENT } from './construction/buildings';
import { lineaire } from './landMesh';
import { islandDef } from './map';
import { facetNormals, finish, type ImportedMonument, LINEAR_WASH, shell, turn } from './monumentModels';
import { turnCell } from './placement';
import { decalageDesPlans, planCells, plansFor } from './plans';

/** Ce qu'il faut savoir du bâtiment importé d'une île : le dossier de ses fichiers, et comment il se tourne. */
interface BuildingModel {
  /** Le dossier du modèle, dans docs/univers/archipeo/batiments/modeles/. */
  folder: string;
  /** De combien de quarts de tour le modèle tourne, en plus du demi-tour qui met sa façade (+Z du .glb) face à la caméra. */
  quarterTurns: number;
}

/**
 * Les bâtiments qui ont leur modèle, par île (les autres gardent leurs blocs) : l'île est celle du plan `<île>-1`, dont
 * le nom est celui du bâtiment. La façade est déjà au sud dans les fichiers (colonne `quarts` de reglages.csv).
 */
export const BUILDING_MODELS: Readonly<Partial<Record<BiomeId, BuildingModel>>> = {
  'french-6e-letter-confusion': { folder: '6e-batiment-forge-de-tunel', quarterTurns: 0 },
  'french-6e-phonology': { folder: '6e-batiment-cabane-de-mousso', quarterTurns: 0 },
  'french-6e-word-spelling': { folder: '6e-batiment-four-de-rouxel', quarterTurns: 0 },
  'french-6e-grammar-spelling': { folder: '6e-batiment-etable-de-bloquette', quarterTurns: 0 },
  'french-6e-reading': { folder: '6e-batiment-phare-de-grimoire', quarterTurns: 0 },
  'maths-6e-calculation': { folder: '6e-batiment-nid-de-coco', quarterTurns: 0 },
  'maths-6e-fractions': { folder: '6e-batiment-hutte-de-nenu', quarterTurns: 0 },
  'maths-6e-decimals': { folder: '6e-batiment-abri-de-lavi', quarterTurns: 0 },
  'english-6e-vocabulary': { folder: '6e-batiment-cabine-de-robin', quarterTurns: 0 },
  'english-6e-grammar': { folder: '6e-batiment-tour-de-tick', quarterTurns: 0 },
  'history-6e-antiquity': { folder: '6e-batiment-musee-de-silex', quarterTurns: 0 },
  'geography-6e-living': { folder: '6e-batiment-quartier-de-boussole', quarterTurns: 0 },
  'life-earth-sciences-6e-living-world': { folder: '6e-batiment-serre-de-fougere', quarterTurns: 0 },
  'physics-chemistry-6e-matter-energy': { folder: '6e-batiment-laboratoire-de-bulle', quarterTurns: 0 },
  'technology-6e-objects': { folder: '6e-batiment-atelier-de-pince', quarterTurns: 0 },
  'civics-6e-democratic-society': { folder: '6e-batiment-preau-de-voix', quarterTurns: 0 },
  'maths-5e-signed-numbers': { folder: '5e-batiment-igloo-de-frimas', quarterTurns: 0 },
  'maths-5e-proportionality': { folder: '5e-batiment-echoppe-de-bazar', quarterTurns: 0 },
  'french-5e-homophones': { folder: '5e-batiment-cabane-de-sema', quarterTurns: 0 },
  'french-5e-conjugation': { folder: '5e-batiment-hutte-de-kroa', quarterTurns: 0 },
  'english-5e-vocabulary': { folder: '5e-batiment-boutique-de-pudding', quarterTurns: 0 },
  'english-5e-grammar': { folder: '5e-batiment-salon-de-moustache', quarterTurns: 0 },
  'history-5e-middle-ages': { folder: '5e-batiment-logis-de-velin', quarterTurns: 0 },
  'geography-5e-resources': { folder: '5e-batiment-moulin-de-sillon', quarterTurns: 0 },
  'life-earth-sciences-5e-active-planet': { folder: '5e-batiment-station-d-humus', quarterTurns: 0 },
  'physics-chemistry-5e-matter-universe': { folder: '5e-batiment-chalet-de-perle', quarterTurns: 0 },
  'technology-5e-design': { folder: '5e-batiment-scierie-de-rabot', quarterTurns: 0 },
  'civics-5e-equality-solidarity': { folder: '5e-batiment-fournil-de-mie', quarterTurns: 0 },
  'lv2-5e-introductions': { folder: '5e-batiment-auberge-de-lina', quarterTurns: 0 },
  'lca-5e-legends': { folder: '5e-batiment-abri-de-lyre', quarterTurns: 0 },
};

/** Les fichiers d'un bâtiment : l'étape 1 et le modèle entier, de près et de loin. */
export const BUILDING_FILES = ['etape-1.glb', 'final-3000.glb', 'loin-etape-1.glb', 'loin.glb'] as const;
type BuildingFile = (typeof BUILDING_FILES)[number];

/** Le fichier qui montre l'étape `stage` (1, ou 2 : le bâtiment entier), de près ou de loin. */
export function buildingFile(stage: 1 | 2, near: boolean): BuildingFile {
  if (near) return stage === 1 ? 'etape-1.glb' : 'final-3000.glb';
  return stage === 1 ? 'loin-etape-1.glb' : 'loin.glb';
}

/** Au plus tant de triangles pour un bâtiment de près (le modèle entier, ou son étape et les fantômes qui restent). */
export const BUILDING_NEAR_TRIANGLES = 3_000;
/** Au plus tant de triangles pour un bâtiment de loin (décision du mainteneur, 10 octobre 2026 : environ 200). */
export const BUILDING_FAR_TRIANGLES = 200;

// ---------- Le registre ----------

const loaded = new Map<string, ModeleLu>();
/** Chaque fichier posé dans le repère de son île (avant sa rotation), fait une fois. */
const placed = new Map<string, Float32Array>();
let version = 0;
const keyOf = (id: BiomeId, file: BuildingFile) => `${id}:${file}`;

/**
 * Les couleurs d'un bâtiment, en linéaire. La chaîne (scripts/rendu/modeles/monument_lowpoly.py) écrit dans COLOR_0 les
 * cibles sRVB du directeur artistique telles quelles, alors que glTF et Three.js tiennent COLOR_0 pour linéaire : lues
 * sans conversion, elles s'affichaient délavées (un fond 3a2a22 en brun moyen). Les monuments, lus par le même `lireGlb`
 * et validés ainsi, ne passent pas ici ; les personnages ont des fichiers déjà linéaires (aplats.py).
 */
function couleursLineaires(srvb: Float32Array): Float32Array {
  const out = new Float32Array(srvb.length);
  for (let i = 0; i < srvb.length; i++) out[i] = lineaire(srvb[i]);
  return out;
}

/** Range un fichier lu (par la vue ou par un test), ses couleurs ramenées en linéaire. */
export function registerBuilding(id: BiomeId, file: BuildingFile, read: ModeleLu): void {
  loaded.set(keyOf(id, file), { ...read, colors: couleursLineaires(read.colors) });
  // L'échelle de tous les fichiers vient du modèle entier de près : on les refait.
  for (const k of placed.keys()) if (k.startsWith(`${id}:`)) placed.delete(k);
  version++;
}

/** Change à chaque fichier rangé : la construction refait alors ses îles (./construction.ts, `construireParIle`). */
export const buildingsVersion = (): number => version;

/** Le bâtiment a-t-il tous ses fichiers ? Sinon, il garde ses blocs. */
export function isBuildingLoaded(id: BiomeId): boolean {
  return BUILDING_MODELS[id] !== undefined && BUILDING_FILES.every((f) => loaded.has(keyOf(id, f)));
}

/** Les triangles d'un fichier rangé (pour le budget) ; 0 s'il n'est pas là. */
export function buildingTriangles(id: BiomeId, file: BuildingFile): number {
  return (loaded.get(keyOf(id, file))?.positions.length ?? 0) / 9;
}

// ---------- Les cases ----------

/** Les cases des deux premiers plans d'une île dans le monde (clés « x,y,z »), l'île posée et tournée. */
export function buildingCells(id: BiomeId): [Set<string>, Set<string>] {
  const def = islandDef(id);
  return plansFor(id)
    .slice(0, ETAPES_DU_BATIMENT)
    .map((plan) => {
      const d = decalageDesPlans(plan);
      const out = new Set<string>();
      for (const c of planCells(plan)) {
        const t = turnCell(c.x + d.x, c.y + d.y, def.quarts);
        out.add(`${def.core.x + t.x},${def.core.y + t.y},${def.altitude + c.z + d.z + 1}`);
      }
      return out;
    }) as [Set<string>, Set<string>];
}

/** La boîte des deux premiers plans d'une île, dans son repère (avant rotation) : x, y au sol, et la hauteur, en cases. */
function planBox(id: BiomeId): { x0: number; x1: number; y0: number; y1: number; h: number; z0: number } | null {
  const cells = plansFor(id)
    .slice(0, ETAPES_DU_BATIMENT)
    .flatMap((plan) => {
      const d = decalageDesPlans(plan);
      return planCells(plan).map((c) => ({ x: c.x + d.x, y: c.y + d.y, z: c.z + d.z }));
    });
  if (!cells.length) return null;
  const lo = (k: 'x' | 'y' | 'z') => Math.min(...cells.map((c) => c[k]));
  const hi = (k: 'x' | 'y' | 'z') => Math.max(...cells.map((c) => c[k])) + 1;
  return { x0: lo('x'), x1: hi('x'), y0: lo('y'), y1: hi('y'), z0: lo('z'), h: hi('z') - lo('z') };
}

// ---------- La pose ----------

/**
 * L'échelle du modèle entier de près, que tous les fichiers du bâtiment partagent. Règle : aussi haut que les deux plans
 * en cubes, sans dépasser au sol leur emprise de plus d'une demi-case de chaque côté (le bâtiment ne mord ni sur la cour,
 * devant, ni sur le décor) ; quand l'emprise l'emporte, il reste un peu plus bas que son plan.
 */
function fitOf(whole: ModeleLu, quarterTurns: number, box: NonNullable<ReturnType<typeof planBox>>) {
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
  const k = Math.min(box.h / h, (box.x1 - box.x0 + 1) / w, (box.y1 - box.y0 + 1) / d);
  // Centré en largeur ; en profondeur, sa façade au bord de devant du plan (le devant du plan est en −y, côté caméra).
  return { k, cx: (x0 + x1) / 2, front: z0, y0, ox: (box.x0 + box.x1) / 2, oy: box.y0, oz: box.z0 };
}

/**
 * Un fichier posé dans le repère de son île, avant la rotation de l'île : x, y au sol (en cases, comme les plans), z en
 * hauteur depuis le sol de l'île ; dans l'ordre des sommets du fichier.
 */
function localFile(id: BiomeId, file: BuildingFile): Float32Array | null {
  const m = BUILDING_MODELS[id];
  if (!m || !isBuildingLoaded(id)) return null;
  const k = keyOf(id, file);
  let f = placed.get(k);
  if (!f) {
    const read = loaded.get(k);
    const whole = loaded.get(keyOf(id, 'final-3000.glb'));
    const box = planBox(id);
    if (!read || !whole || !box) return null;
    const fit = fitOf(whole, m.quarterTurns, box);
    const q = read.positions;
    f = new Float32Array(q.length);
    for (let i = 0; i < q.length; i += 3) {
      const [u, v] = turn(q[i], q[i + 2], m.quarterTurns);
      f[i] = fit.ox + (u - fit.cx) * fit.k;
      f[i + 1] = fit.oy + (v - fit.front) * fit.k;
      f[i + 2] = fit.oz + (q[i + 1] - fit.y0) * fit.k;
    }
    placed.set(k, f);
  }
  return f;
}

/**
 * Les bâtiments importés de ce monde, chargés et assez avancés : pour chacun, l'étape que suit l'avancée de ses deux
 * premiers plans, le fichier de près (sur l'île `near`) ou de loin, posé sur l'île telle qu'elle est posée et tournée, et
 * les cases posées qu'il remplace. Même forme que les monuments importés (./monumentModels.ts), sans feu ni halo.
 */
export function getImportedBuildings(cubes: readonly VoxelCube[], near: BiomeId | null = null): ImportedMonument[] {
  // Les cubes des plans de chaque île qui a son modèle chargé (ni le sol, ni un lieu, ni une borne, ni le décor).
  const byIsland = new Map<BiomeId, VoxelCube[]>();
  for (const c of cubes) {
    const id = c.tag as BiomeId | undefined;
    if (!id || c.sol || c.place || c.quest || c.decor || c.bridge || !BUILDING_MODELS[id] || !isBuildingLoaded(id)) continue;
    const l = byIsland.get(id);
    if (l) l.push(c);
    else byIsland.set(id, [c]);
  }
  const out: ImportedMonument[] = [];
  for (const [id, own] of byIsland) {
    const [first, second] = buildingCells(id);
    const at = new Map(own.map((c) => [`${c.x},${c.y},${c.z}`, c]));
    // Une étape ne se montre que si toutes ses cases sont posées.
    const allPlaced = (cells: Set<string>) => [...cells].every((k) => at.has(k) && !at.get(k)!.ghost);
    if (!first.size || !allPlaced(first)) continue;
    const stage: 1 | 2 = second.size && allPlaced(second) ? 2 : 1;
    const local = localFile(id, buildingFile(stage, id === near));
    const read = loaded.get(keyOf(id, buildingFile(stage, id === near)));
    if (!local || !read) continue;
    const covered = [...(stage === 2 ? [...first, ...second] : first)].map((k) => at.get(k)!);
    const muted = covered.some((c) => c.muted);
    // Dans le monde : l'île tournée (`turnCell` d'une case, ramené à un point : (u, v) → (v, 2m − u) par quart), posée.
    const def = islandDef(id);
    const positions = new Float32Array(local.length);
    for (let i = 0; i < local.length; i += 3) {
      const t = turnCell(local[i] - 0.5, local[i + 1] - 0.5, def.quarts);
      positions[i] = def.core.x + t.x + 0.5;
      positions[i + 1] = def.altitude + 1 + local[i + 2];
      positions[i + 2] = def.core.y + t.y + 0.5;
    }
    const opaque = shell();
    const normals = facetNormals(positions);
    const col = read.colors;
    for (let i = 0; i < positions.length; i += 3) {
      opaque.pos.push(positions[i], positions[i + 1], positions[i + 2]);
      opaque.nor.push(normals[i], normals[i + 1], normals[i + 2]);
      if (muted) for (let j = 0; j < 3; j++) opaque.col.push(col[i + j] + (LINEAR_WASH.color[j] - col[i + j]) * LINEAR_WASH.strength);
      else opaque.col.push(col[i], col[i + 1], col[i + 2]);
    }
    out.push({
      id: `building:${id}`,
      stage,
      opaque: finish(opaque),
      fire: finish(shell()),
      halo: null,
      cellules: covered.map((c) => ({ x: c.x, y: c.y, z: c.z })),
      replaced: new Set(covered.map((c) => `${c.x},${c.y},${c.z}`)),
    });
  }
  return out;
}
