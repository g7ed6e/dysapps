// Le budget de dessin du monde continu (prototype du 6e), compté sans Three.js comme world/budget.ts le fait pour le
// monde en grille : les triangles et les appels de chaque poste. Estimé au cadrage : environ 45 000 triangles et 12 à
// 18 appels avec quatre lieux (prototype-6e.md, § 3) ; l'enveloppe n'est pas relevée avec l'île agrandie (piste 1,
// lot 1 : seul le mainteneur peut la relever). Les images par seconde se mesurent sur la tablette (`?mesures`).
import { WORLD_FOG } from './camera';
import { networkSamples, pathRibbons } from './paths';
import { PLACES, type PlaceId } from './plan6e';
import { modelOfPlace } from './places';
import { answerObjects, itemScene, placePieces, sceneSpot, veilleurPiece } from './questionScene';
import type { ItemScene } from './questions';
import { buildHeightField, heightOnMesh, tileRings, tileTriangleCounts } from './terrain';
import { veilFacets } from './veil';

/** Kéo : le modèle importé de près (1 500 triangles environ) et son anneau clair au sol, comme le poste « bonhomme » du monde en grille. */
const KEO = { triangles: 1620, calls: 2 };

/** L'enveloppe du prototype : ce que le cadrage a estimé. */
export const OPEN_WORLD_BUDGET = { triangles: 45_000, calls: 18 } as const;

export interface OpenWorldCost {
  poste: 'sol' | 'mer' | 'chemins' | 'lieux' | 'brume' | 'kéo' | 'question' | 'pièces';
  triangles: number;
  calls: number;
}

/** Les scènes d'item les plus chargées de chaque lieu (le Phare : six cloches ; les Quais : 98 caisses, ou 49 et 49). */
const HEAVIEST: readonly { place: PlaceId; scene: ItemScene }[] = [
  { place: 'phare', scene: { kind: 'cloches' } },
  { place: 'filets', scene: { kind: 'filets', catch: 'crabes', count: 4 } },
  { place: 'ecluses', scene: { kind: 'echelle', n: 24, d: 12 } },
  { place: 'ecluses', scene: { kind: 'sas', n: 12, d: 12 } },
  { place: 'quais', scene: { kind: 'quai', op: 'moitie', before: 98, after: 49 } },
  { place: 'quais', scene: { kind: 'quai', op: 'double', before: 49, after: 98 } },
];

/**
 * Une question, au pire : la scène de l'item répondu et six objets de réponse (un maillage), plus la réaction (un
 * maillage). Kéo s'efface pendant la question : son poste ne compte pas en même temps, mais il reste compté (le pire cas).
 */
function questionCost(): { triangles: number; calls: number } {
  let triangles = 0;
  for (const { place, scene } of HEAVIEST) {
    const s = sceneSpot(place);
    const points = Array.from({ length: 6 }, (_, i) => ({ x: s.x - 5 + 2 * i, y: s.y, z: s.z + 6 }));
    const item = itemScene(place, scene, true, points, 1);
    triangles = Math.max(triangles, item.still.triangles + answerObjects(place, points, 1).triangles + (item.reaction?.facets.triangles ?? 0));
  }
  return { triangles, calls: 2 };
}

/** Les pièces durables, toutes remises, et le Veilleur rallumé : un maillage pour les quatre lieux, et la Roue des Écluses. */
function piecesCost(): { triangles: number; calls: number } {
  const all = PLACES.map((p) => placePieces(p.id, 2));
  const triangles = all.reduce((t, p) => t + p.still.triangles + (p.wheel?.facets.triangles ?? 0), 0) + veilleurPiece().triangles;
  return { triangles, calls: 2 };
}

/** L'écart entre deux points où l'on cherche le pire sol : Kéo se tient toujours sur le réseau des chemins. */
const SAMPLE_STEP = 4;

/**
 * Le sol, au pire : les deux anneaux de tuiles (un maillage chacun) autour de chaque point du réseau, le plus chargé de
 * près et le plus chargé de loin (ils peuvent venir de deux points différents : on compte large).
 */
export function groundCost(): { triangles: number; calls: number; near: number; far: number } {
  const field = buildHeightField();
  const near = tileTriangleCounts(field, 'near');
  const far = tileTriangleCounts(field, 'far');
  let worstNear = 0;
  let worstFar = 0;
  for (const p of networkSamples(SAMPLE_STEP)) {
    const rings = tileRings(p, WORLD_FOG.far);
    worstNear = Math.max(worstNear, rings.near.reduce((s, t) => s + near[t], 0));
    worstFar = Math.max(worstFar, rings.far.reduce((s, t) => s + far[t], 0));
  }
  return { triangles: worstNear + worstFar, calls: 2, near: worstNear, far: worstFar };
}

/** Ce que coûte le monde continu, au pire : le sol autour de Kéo, tout le reste visible à la fois. */
export function openWorldCost(): OpenWorldCost[] {
  const field = buildHeightField();
  const paths = pathRibbons((x, z) => heightOnMesh(field, x, z));
  const ground = groundCost();
  return [
    { poste: 'sol', triangles: ground.triangles, calls: ground.calls },
    { poste: 'mer', triangles: 2, calls: 1 },
    { poste: 'chemins', triangles: paths.triangles, calls: 1 },
    { poste: 'lieux', triangles: PLACES.reduce((s, p) => s + modelOfPlace(p.id).facets.triangles, 0), calls: PLACES.length },
    { poste: 'brume', triangles: veilFacets(PLACES.map((p) => p.id)).triangles, calls: 1 },
    { poste: 'kéo', ...KEO },
    { poste: 'question', ...questionCost() },
    { poste: 'pièces', ...piecesCost() },
  ];
}
