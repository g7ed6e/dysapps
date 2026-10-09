// Le cadrage de la vue : l'étendue de l'archipel, la zone et l'angle de la vue d'une île, l'île sous la vue, la caméra
// d'une île et sa projection, le cadre d'une traversée.
import { type ArchipelagoId, archipelagoOfIsland, coeurDe, islandDef, type IslandDef, landBox, mapOf, startingIsland, MAP } from '../map';
import { dockBox } from '../harbor';
import { type BridgeDef, getArchipelago, islandsOf } from '../archipelago';
import { type BiomeId, BIOMES } from '../../biomes';
import { BAC_LONG, bridgePath } from './links';
import { islandCenter } from './base';
import { layoutCache } from '../placement';
import { frameOf } from '../footprint';
import { placedLinksOf, neighboursOf } from '../linkGeometry';

/**
 * Étendue d'un archipel (coordonnées de grille) : le cadre fixe de sa région (GD-9, `REGION_FRAMES`), où tout lieu se pose.
 * `maxX` et `maxY` exclus, comme le cadre.
 */
export function worldBounds(a: ArchipelagoId): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const c = frameOf(a);
  return { minX: c.x0, maxX: c.x1, minY: c.y0, maxY: c.y1 };
}

/**
 * La mer gardée devant chaque île (côté caméra), en cases : celle que prenait l'îlot de son Gardien et son eau jusqu'à
 * GD-11 (8 octobre 2026). Le Gardien parti sur son île, la mer de la région reste semée de même (`bornesDeDepart`) ; la
 * Carte, elle, ne la cadre plus (`bornesDesLieux`, `terresDe`).
 */
const MER_DEVANT = 15;

/**
 * L'étendue de la carte de départ d'une région, qui ne bouge jamais, terres et port compris : la mer y est
 * semée une fois pour toutes (`seaDecor`), serrée autour des lieux plutôt qu'au bord du cadre.
 */
export function bornesDeDepart(a: ArchipelagoId): { minX: number; maxX: number; minY: number; maxY: number } {
  return bornesDesIles(a, MAP.filter((d) => archipelagoOfIsland(d.id) === a).map((d) => startingIsland(d.id)));
}

/**
 * L'étendue des lieux d'une région à leur place d'aujourd'hui (déplacés ou non, GD-9), port compris, sans la mer gardée
 * devant eux : ce que la Carte cadre à l'ouverture (three/camera/framings.ts).
 */
export function bornesDesLieux(a: ArchipelagoId): { minX: number; maxX: number; minY: number; maxY: number } {
  return bornesDesIles(a, mapOf(a), 2);
}

type Bornes = { minX: number; maxX: number; minY: number; maxY: number };

/**
 * Les terres des lieux d'une région à leur place d'aujourd'hui, une à une, et le quai de son port, chacune avec deux
 * cases de marge (la couronne d'un grand arbre, l'écume d'une cascade débordent de la terre). La Carte les cadre à
 * l'ouverture (three/camera/framings.ts) : vue de biais, une île au fond prend moins de place qu'un coin du rectangle
 * qui les entoure toutes (GD-11, consultant UX UI).
 */
export function terresDe(a: ArchipelagoId): Bornes[] {
  return [...mapOf(a).map((def) => landBox(def)), dockBox(getArchipelago(a).port)].map((b) => ({ minX: b.x0 - 2, maxX: b.x1 + 2, minY: b.y0 - 2, maxY: b.y1 + 2 }));
}

/**
 * Les bornes de quelques îles d'un archipel, et de son port (la colonne centrale, `colonneCentrale`) ; `devant` : la mer
 * gardée devant chaque île, côté caméra (`MER_DEVANT` par défaut).
 */
function bornesDesIles(a: ArchipelagoId, iles: readonly IslandDef[], devant = MER_DEVANT): Bornes {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const def of iles) {
    const b = landBox(def);
    // Deux cases de marge : la couronne d'un grand arbre, l'écume d'une cascade débordent de la terre.
    minX = Math.min(minX, b.x0 - 2);
    maxX = Math.max(maxX, b.x1 + 2);
    minY = Math.min(minY, b.y0 - devant);
    maxY = Math.max(maxY, b.y1 + 2);
  }
  const dock = dockBox(getArchipelago(a).port);
  minX = Math.min(minX, dock.x0 - 2);
  maxX = Math.max(maxX, dock.x1 + 2);
  minY = Math.min(minY, dock.y0 - 2);
  return { minX, maxX, minY, maxY };
}

/**
 * L'étendue à cadrer dans la vue d'ensemble (la Carte) : toute la région, dès le début (GD-9) ; elle ne bouge pas
 * quand on pose une liaison ni quand on déplace un lieu. `bridges` : gardé pour l'appelant, le cadre n'en dépend plus.
 */
export function overviewBounds(a: ArchipelagoId, bridges: string[]): { minX: number; maxX: number; minY: number; maxY: number } {
  void bridges;
  return worldBounds(a);
}

/** Pivot maximal de la caméra vers le cœur du continent (radians) : le nord reste reconnaissable. */
export const VIEW_YAW_MAX = (40 * Math.PI) / 180;

/**
 * La zone que la caméra cadre quand le bonhomme se tient sur une île : cette île et ses voisines (reliées par un
 * ouvrage, construit ou non). Sur une île du bord, les voisines tirent l'image vers le continent : moins de mer.
 *
 * L'île de la LV2 (le Relais au 5e, le Jardin des heures au 4e) n'élargit jamais le cadrage de sa voisine (DA, 28/09,
 * LV2-4) : avec « Pas de LV2 », la vue reste celle d'avant l'île ; avec une LV2, elle ne l'accueillerait que si son
 * Gardien et son étiquette tenaient entiers au-dessus des boutons en 1024 × 768, 1280 × 800 et 800 × 1280 sans que
 * l'île du bonhomme rapetisse, ce qui n'est pas le cas (au bout de la crête, l'étiquette sort de l'écran à gauche, de
 * 65 à 340 px ; au 5e, celle du Relais aussi) : cadrage d'avant, sans entre-deux. Depuis l'île de la LV2, la voisine compte.
 *
 * Les voisines sont les lieux qu'un pont relierait (GD-9 : une liaison de 36 cases au plus, `neighboursOf`) : l'île au
 * bout d'un long bac n'est pas une voisine.
 */
export function viewZone(home: BiomeId): { minX: number; maxX: number; minY: number; maxY: number } {
  const ids = new Set<BiomeId>([home]);
  for (const other of neighboursOf(home)) {
    if (BIOMES.find((x) => x.id === other)?.subject === 'lv2') continue;
    ids.add(other);
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const id of ids) {
    const b = landBox(islandDef(id));
    minX = Math.min(minX, b.x0);
    maxX = Math.max(maxX, b.x1);
    minY = Math.min(minY, b.y0);
    maxY = Math.max(maxY, b.y1);
  }
  return { minX, maxX, minY, maxY };
}

/**
 * Le pivot de la caméra depuis une île : vers la colonne centrale du continent, borné à VIEW_YAW_MAX de part et
 * d'autre du nord (plein pivot à 50 cases du centre). Positif : la caméra se place à l'ouest et regarde vers l'est.
 */
export function viewYaw(home: BiomeId): number {
  return yawDuLieu(home) + (islandDef(home).quarts * Math.PI) / 2;
}

/**
 * Le pivot de la caméra de la vue d'un lieu tel qu'il est sur la carte de départ, sans rotation (GD-9) : la vue est
 * celle du lieu, figée à sa naissance, qu'il soit déplacé ou non ; tourné, elle tourne avec lui (`viewYaw`). Le décor
 * qui pourrait cacher une borne est tiré pour cette vue.
 */
function yawDuLieu(home: BiomeId): number {
  const depart = startingIsland(home);
  // Depuis sa place d'avant GD-12, si les formes l'ont fait bouger (`vueDepuis`) : la vue de l'île ne change pas.
  const def = depart.vueDepuis ? { ...depart, core: depart.vueDepuis } : depart;
  const c = coeurDe(def);
  // Seul l'écart est-ouest compte : la caméra regarde toujours vers le nord, on la tourne vers la colonne centrale.
  const dx = colonneCentrale(archipelagoOfIsland(home)) - (c.x0 + c.x1) / 2;
  return VIEW_YAW_MAX * Math.max(-1, Math.min(1, dx / 50));
}

/**
 * La colonne centrale d'un archipel dont les îles ont pris leur forme (GD-12), figée à sa valeur d'avant : les formes
 * ont déplacé les îles et élargi leurs côtes, la colonne aurait bougé, et avec elle la vue de chaque île.
 */
const COLONNE_D_AVANT_LES_FORMES: Partial<Record<ArchipelagoId, number>> = { '6e': 72.5, '5e': 92.5 };

/**
 * Les îles qui ne comptent pas dans la colonne centrale : le Refuge des carnets (3e), posé au bord de l'archipel, ne fait
 * pas pivoter les caméras des autres îles, qui gardent leur cadrage (DA, LV2-5) ; de même la Fouille des siècles et la
 * Pointe des paysages (6e, HG-2), au bout du second rang, puis la Vallée du vivant, le Laboratoire des éléments et le
 * Hangar des inventions (6e, SC-2), aux places qui restaient : le dessin des autres îles ne change pas ; et les six îles
 * d'histoire-géographie de 5e à 3e (HG-3) : comptées, celles des Îles Brumeuses, au-delà du cadre d'avant, faisaient
 * tourner toutes les caméras du 5e de plusieurs degrés (et avec elles la place des petites constructions) ; de même les
 * neuf îles de sciences de 5e à 3e (SC-3). Le Relais des
 * voyageurs (5e) et le Jardin des heures (4e) y comptent : leurs lots ont validé avec eux le cadrage de leur archipel,
 * qu'on ne rouvre pas.
 */
export const HORS_DE_LA_COLONNE: readonly BiomeId[] = [
  'lv2-3e-travel',
  'history-6e-antiquity',
  'geography-6e-living',
  'life-earth-sciences-6e-living-world',
  'physics-chemistry-6e-matter-energy',
  'technology-6e-objects',
  'history-5e-middle-ages',
  'geography-5e-resources',
  'history-4e-revolutions',
  'geography-4e-globalization',
  'history-3e-twentieth-century',
  'geography-3e-france',
  'life-earth-sciences-5e-active-planet',
  'physics-chemistry-5e-matter-universe',
  'technology-5e-design',
  'life-earth-sciences-4e-cells-evolution',
  'physics-chemistry-4e-signals-circuits',
  'technology-4e-modeling',
  'life-earth-sciences-3e-human-body',
  'physics-chemistry-3e-motion-energy',
  'technology-3e-digital',
];

const colonnes = new Map<ArchipelagoId, number>();

/**
 * La colonne centrale d'un archipel, vers laquelle pivotent les caméras des îles : le milieu est-ouest de ses îles (sauf
 * `HORS_DE_LA_COLONNE`) et de son port, sur la carte de départ.
 */
function colonneCentrale(a: ArchipelagoId): number {
  const figee = COLONNE_D_AVANT_LES_FORMES[a];
  if (figee !== undefined) return figee;
  const connue = colonnes.get(a);
  if (connue !== undefined) return connue;
  // La carte de départ : la colonne ne bouge pas quand l'élève déplace un lieu (GD-9).
  const b = bornesDesIles(
    a,
    MAP.filter((d) => archipelagoOfIsland(d.id) === a && !HORS_DE_LA_COLONNE.includes(d.id)),
  );
  const x = (b.minX + b.maxX) / 2;
  colonnes.set(a, x);
  return x;
}

/** Île la plus proche d'un point de la grille d'un archipel (pour le toucher : une île ou le pont qui y mène). */
export function islandAt(a: ArchipelagoId, x: number, y: number): BiomeId {
  const islands = islandsOf(a);
  let best: BiomeId = islands[0].id;
  let bestD = Infinity;
  for (const b of islands) {
    const c = islandCenter(b.id);
    const d = Math.hypot(c.x - x, c.y - y);
    if (d < bestD) {
      bestD = d;
      best = b.id;
    }
  }
  return best;
}

/**
 * L'île que montre la vue glissée de (`d.x`, `d.z`) cases depuis l'île `ici` : la plus proche de son cœur déplacé
 * d'autant. Un petit glissé reste sur `ici` (les bulles la suivent, three/signs.ts).
 */
export function ileDeLaVueGlissee(a: ArchipelagoId, ici: BiomeId, d: { x: number; z: number }): BiomeId {
  const c = islandCenter(ici);
  return islandAt(a, c.x + d.x, c.y + d.z);
}

/** La direction de la vue d'une île (x, y de la grille, et hauteur) : de trois quarts avant-droite, plus haute que la vue du bonhomme. */
export const VUE_DE_L_ILE = { dx: 0.7, dy: -0.7, up: 0.9 };

/** La distance de la caméra de la vue d'une île au point visé (en paysage ; la vue en portrait recule, three/camera.ts). */
export const DISTANCE_DE_LA_VUE_DE_L_ILE = 30;

/**
 * À combien de cases au-dessus du sol de son île flotte le nom d'une île (three/labels.ts) : la place du Gardien évite
 * l'étiquette dans la vue de l'île (./creatures.ts, `guardianSpot`).
 */
export const HAUTEUR_DES_NOMS = 12;

/** La caméra vise un bloc au-dessus du point qu'elle regarde (le centre d'une île à son altitude, le bonhomme). */
export const VISEE_AU_DESSUS_DU_SOL = 1;

/**
 * La direction de la vue d'une île, pivot compris (`viewYaw`), non normée : x, y de la grille, z en hauteur. `dessin` :
 * celle du dessin du lieu, sans sa rotation (le lieu se dessine sans être tourné, puis tourne avec sa vue).
 */
function directionDeLaVue(id: BiomeId, dessin = false): [number, number, number] {
  const yaw = -(dessin ? yawDuLieu(id) : viewYaw(id));
  const { dx, dy, up } = VUE_DE_L_ILE;
  return [dx * Math.cos(yaw) - dy * Math.sin(yaw), dx * Math.sin(yaw) + dy * Math.cos(yaw), up];
}

/** Vers la caméra de la vue d'une île, pivot compris (`viewYaw`), en cases : x, y de la grille, z en hauteur. */
export function versLaCamera(id: BiomeId): [number, number, number] {
  const v = directionDeLaVue(id);
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
}

/**
 * Vers la caméra de la vue d'un lieu dans son dessin, le lieu pas tourné (`versLaCamera` sans sa rotation) : le décor
 * qui pourrait cacher une borne, la place de la créature se tirent pour elle, et tournent avec le lieu.
 */
export function versLaCameraDuDessin(id: BiomeId): [number, number, number] {
  const v = directionDeLaVue(id, true);
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
}

/**
 * La place de la caméra de la vue d'une île (x, y de la grille, z en hauteur), en paysage et sans le glissement vers un
 * grand repère d'Archipéo (world/framing.ts) : ce que calcule three/camera.ts dans le cas simple.
 */
export function cameraDeLIle(id: BiomeId): { x: number; y: number; z: number } {
  const c = islandCenter(id);
  const [dx, dy, up] = directionDeLaVue(id);
  const d = DISTANCE_DE_LA_VUE_DE_L_ILE;
  return { x: c.x + d * dx, y: c.y + d * dy, z: c.z + VISEE_AU_DESSUS_DU_SOL + d * up };
}

/**
 * La vue d'une île panneau ouvert, telle que la lit la règle de cadrage des petites constructions (GD-7, PR 3, directeur
 * artistique) : une tablette à l'horizontale (1024 × 768), le panneau de l'île à droite (26rem au texte de 20 px et son
 * liseré de 8 px : global.css, `.island-sheet`), la scène dans les 496 px de gauche, donc en portrait (three/camera.ts
 * recule alors de 1/√aspect), champ vertical de 40° (WorldCanvas.tsx). En bas, les deux rangées de boutons du monde ; en
 * haut à droite, Pause et l'archipel. En pixels CSS.
 */
export const VUE_DE_L_ILE_PANNEAU_OUVERT = { largeur: 496, hauteur: 768, champ: 40, bas: 130, boutons: { largeur: 100, hauteur: 130 } } as const;

/** Un point de la grille (x, y, z en hauteur, coordonnées du monde) à l'écran de la vue de l'île panneau ouvert, en pixels CSS. */
export type ProjectionDeLaVue = (x: number, y: number, z: number) => [number, number];

/**
 * La projection de la vue d'une île panneau ouvert (`VUE_DE_L_ILE_PANNEAU_OUVERT`), le calcul de three/camera.ts
 * (`framing`) et de `THREE.PerspectiveCamera.lookAt` refait sans Three.js : la scène y est en (x, hauteur, y).
 * `cube` : la taille d'une case à l'écran, au point visé, en pixels ; `oeil` : la place de la caméra (x, y de la grille,
 * z en hauteur).
 */
export function projectionDeLaVueDeLIle(id: BiomeId): { projeter: ProjectionDeLaVue; cube: number; oeil: { x: number; y: number; z: number } } {
  const V = VUE_DE_L_ILE_PANNEAU_OUVERT;
  const aspect = V.largeur / V.hauteur;
  const c = islandCenter(id);
  const [dx, dy, up] = directionDeLaVue(id);
  const d = DISTANCE_DE_LA_VUE_DE_L_ILE * (aspect < 1 ? 1 / Math.sqrt(Math.max(0.4, aspect)) : 1);
  const cible = [c.x, c.z + VISEE_AU_DESSUS_DU_SOL, c.y];
  const oeil = [c.x + d * dx, c.z + VISEE_AU_DESSUS_DU_SOL + d * up, c.y + d * dy];
  const norme = (v: number[]) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const az = norme([oeil[0] - cible[0], oeil[1] - cible[1], oeil[2] - cible[2]]);
  // L'axe des x de la caméra : le haut (0, 1, 0) vectoriel l'arrière, puis celui des y : l'arrière vectoriel les x.
  const ax = norme([az[2], 0, -az[0]]);
  const ay = [az[1] * ax[2] - az[2] * ax[1], az[2] * ax[0] - az[0] * ax[2], az[0] * ax[1] - az[1] * ax[0]];
  const t = Math.tan((V.champ * Math.PI) / 360);
  const projeter: ProjectionDeLaVue = (x, y, z) => {
    const v = [x - oeil[0], z - oeil[1], y - oeil[2]];
    const profondeur = -(v[0] * az[0] + v[1] * az[1] + v[2] * az[2]);
    const px = (v[0] * ax[0] + v[1] * ax[1] + v[2] * ax[2]) / (profondeur * t * aspect);
    const py = (v[0] * ay[0] + v[1] * ay[1] + v[2] * ay[2]) / (profondeur * t);
    return [((px + 1) / 2) * V.largeur, ((1 - py) / 2) * V.hauteur];
  };
  return { projeter, cube: V.hauteur / (2 * d * t), oeil: { x: oeil[0], y: oeil[2], z: oeil[1] } };
}

/** Les cases des longues traversées (plus de `BAC_LONG` cases) d'un archipel, et l'ouvrage de chacune : les liaisons posées. */
const traverseesCache = layoutCache<string, Map<string, string>>();

function casesDesTraversees(a: ArchipelagoId, links: readonly string[]): Map<string, string> {
  const posees = placedLinksOf(a, links);
  const cle = `${a}|${posees.map((b) => b.id).join(',')}`;
  let m = traverseesCache.get(cle);
  if (!m) {
    m = new Map();
    for (const b of posees) {
      const path = bridgePath(b, links);
      if (path.length > BAC_LONG) for (const c of path) m.set(`${c.x},${c.y}`, b.id);
    }
    traverseesCache.set(cle, m);
  }
  return m;
}

/** Un rectangle de la grille, en cases (bornes comprises). */
export interface CadreDeCases {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Le cadre de la caméra pendant un trajet qui prend une longue traversée (GD-7, plus de `BAC_LONG` cases sur un même
 * ouvrage) : tout le trajet, du départ à l'arrivée, et le cœur des deux îles du bout ; la caméra s'y pose et ne bouge
 * plus, le bonhomme traverse. `null` pour un trajet ordinaire : la caméra le suit.
 */
export function cadreDeTraversee(a: ArchipelagoId, links: readonly string[], route: readonly { x: number; y: number }[]): CadreDeCases | null {
  const cases = casesDesTraversees(a, links);
  const parOuvrage = new Map<string, number>();
  let longue = false;
  for (const c of route) {
    const id = cases.get(`${Math.round(c.x)},${Math.round(c.y)}`);
    if (!id) continue;
    const n = (parOuvrage.get(id) ?? 0) + 1;
    parOuvrage.set(id, n);
    if (n > BAC_LONG) longue = true;
  }
  if (!longue) return null;
  const bouts = [route[0], route[route.length - 1]].map((c) => islandAt(a, c.x, c.y));
  return cadreDesCases(route, bouts);
}

/** Le rectangle de cases qui tient `cases` et le cœur entier des îles `iles` (l'île d'arrivée se reconnaît). */
function cadreDesCases(cases: readonly { x: number; y: number }[], iles: readonly BiomeId[]): CadreDeCases {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const ajouter = (x: number, y: number) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };
  for (const c of cases) ajouter(c.x, c.y);
  for (const id of iles) {
    const k = coeurDe(islandDef(id));
    ajouter(k.x0, k.y0);
    ajouter(k.x1 - 1, k.y1 - 1);
  }
  return { minX, maxX, minY, maxY };
}

/**
 * Le cadre d'une liaison montrée en fantôme depuis un autre départ (GD-9, « Partir d'une autre île ») : tout son tracé
 * et le cœur de ses deux îles, que la caméra pose dans la place libre au-dessus de la fiche, comme une longue traversée.
 * `null` si elle n'a pas de tracé.
 */
export function cadreDeLaLiaison(def: BridgeDef, links: readonly string[]): CadreDeCases | null {
  const cases = bridgePath(def, links);
  return cases.length ? cadreDesCases(cases, [def.from, def.to]) : null;
}
