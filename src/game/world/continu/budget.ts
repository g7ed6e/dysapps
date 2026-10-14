// Le budget de dessin du monde continu (prototype du 6e), compté sans Three.js comme world/budget.ts le fait pour le
// monde en grille : les triangles et les appels de chaque poste. Estimé au cadrage : environ 45 000 triangles et 12 à
// 18 appels avec quatre lieux (prototype-6e.md, § 3). Les images par seconde se mesurent sur la tablette (`?mesures`).
import { pathRibbons } from './paths';
import { PLACES, TERRAIN } from './plan6e';
import { modelOfPlace } from './places';
import { buildHeightField, heightOnMesh, terrainTiles } from './terrain';

/** Kéo : le modèle importé de près (1 500 triangles environ) et son ombre au sol, comme le poste « bonhomme » du monde en grille. */
const KEO = { triangles: 1620, calls: 2 };

/** L'enveloppe du prototype : ce que le cadrage a estimé. */
export const OPEN_WORLD_BUDGET = { triangles: 45_000, calls: 18 } as const;

export interface OpenWorldCost {
  poste: 'sol' | 'mer' | 'chemins' | 'lieux' | 'kéo';
  triangles: number;
  calls: number;
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
  ];
}
