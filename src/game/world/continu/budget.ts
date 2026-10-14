// Le budget de dessin du monde continu (prototype du 6e), compté sans Three.js comme world/budget.ts le fait pour le
// monde en grille : les triangles et les appels de chaque poste. Estimé au cadrage : environ 45 000 triangles et 12 à
// 18 appels avec quatre lieux (prototype-6e.md, § 3). Les images par seconde se mesurent sur la tablette (`?mesures`).
import { pathRibbons } from './paths';
import { PLACES, TERRAIN, type PlaceId } from './plan6e';
import { modelOfPlace } from './places';
import { answerObjects, itemScene, placePieces, sceneSpot } from './questionScene';
import type { ItemScene } from './questions';
import { buildHeightField, heightOnMesh, terrainTiles } from './terrain';

/** Kéo : le modèle importé de près (1 500 triangles environ) et son anneau clair au sol, comme le poste « bonhomme » du monde en grille. */
const KEO = { triangles: 1620, calls: 2 };

/** L'enveloppe du prototype : ce que le cadrage a estimé. */
export const OPEN_WORLD_BUDGET = { triangles: 45_000, calls: 18 } as const;

export interface OpenWorldCost {
  poste: 'sol' | 'mer' | 'chemins' | 'lieux' | 'kéo' | 'question' | 'pièces';
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

/** Les pièces durables, toutes remises : un maillage pour les quatre lieux, et la Roue des Écluses. */
function piecesCost(): { triangles: number; calls: number } {
  const all = PLACES.map((p) => placePieces(p.id, 2));
  return { triangles: all.reduce((t, p) => t + p.still.triangles + (p.wheel?.facets.triangles ?? 0), 0), calls: 2 };
}

/** Ce que coûte le monde continu tout entier (toutes les tuiles visibles : le pire cas). */
export function openWorldCost(): OpenWorldCost[] {
  const field = buildHeightField();
  const tiles = terrainTiles(field);
  const paths = pathRibbons((x, z) => heightOnMesh(field, x, z));
  return [
    { poste: 'sol', triangles: tiles.reduce((s, t) => s + t.triangles, 0), calls: TERRAIN.tiles * TERRAIN.tiles },
    { poste: 'mer', triangles: 2, calls: 1 },
    { poste: 'chemins', triangles: paths.triangles, calls: 1 },
    { poste: 'lieux', triangles: PLACES.reduce((s, p) => s + modelOfPlace(p.id).facets.triangles, 0), calls: PLACES.length },
    { poste: 'kéo', ...KEO },
    { poste: 'question', ...questionCost() },
    { poste: 'pièces', ...piecesCost() },
  ];
}
