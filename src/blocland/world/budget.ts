// Le budget de rendu d'un archipel tout construit, décidé pour Archipéo (docs/conception/cadrage-archipeo.md, §5) :
// ce qu'une tablette de collégien dessine sans peiner. `sceneCost()` compte, sans Three.js, les modèles en blocs de la
// scène (terrain, créatures, Gardiens, Bloc-Navire, bonhomme) tels que la vue 3D les dessine : un appel de dessin par
// groupe de `buildMesh`. La mer, les nuages, les baleines, les oiseaux, les étiquettes et les repères de borne s'y
// ajoutent dans le navigateur : `npm run rendu:mesures` mesure la scène entière. Vérifié par world/budget.test.ts.
import { AVATAR_PARTS } from '../Avatar';
import { BIOMES } from '../biomes';
import { CATALOG } from '../exercises';
import { BRIDGES, VOYAGES } from './archipelago';
import type { ArchipelagoId } from './map';
import { buildMesh, faceCount, type MeshGroup } from './mesher';
import { MONUMENTS } from './monuments';
import { PLANS, planCells } from './plans';
import { creaturePlacements, guardianPlacements, vehiclePlacement, worldCubes } from './terrain';
import { VEHICLE_STAGES } from './vehicle';

export const RENDER_BUDGET = {
  /** Triangles de la scène 3D d'un archipel, tout construit. */
  triangles: 60_000,
  /** Appels de dessin de la scène 3D d'un archipel, tout construit. */
  drawCalls: 40,
} as const;

/** Une partie où tout est construit : trois étoiles partout, Gardiens vaincus, tous les plans, ouvrages, étapes du navire et ponts. */
export function toutConstruit() {
  const progress: Record<string, { stars: number; attempts: number; best: number }> = Object.fromEntries([
    ...CATALOG.map((e) => [e.id, { stars: 3, attempts: 1, best: 1 }]),
    ...BIOMES.map((b) => [`${b.id}-gardien`, { stars: 3, attempts: 1, best: 1 }]),
  ]);
  const plans = Object.fromEntries([...PLANS, ...VEHICLE_STAGES, ...MONUMENTS].map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const bridges = [...BRIDGES, ...VOYAGES].map((b) => b.id);
  return { progress, village: { plans, journal: [], bridges } };
}

/** Les modèles en blocs de la scène d'un archipel tout construit, chacun en groupes de `buildMesh`. */
export function sceneModels(a: ArchipelagoId): { name: string; groups: MeshGroup[] }[] {
  const { progress, village } = toutConstruit();
  const MAST_TOP = 7;
  const ship = vehiclePlacement(a, progress, village)?.cubes ?? [];
  return [
    { name: 'terrain', groups: buildMesh(worldCubes(a, progress, village, false)) },
    ...[...creaturePlacements(a, village.bridges), ...guardianPlacements(a, progress, village.bridges)].map((c) => ({ name: c.id, groups: buildMesh(c.cubes) })),
    { name: 'coque', groups: buildMesh(ship.filter((c) => c.z < MAST_TOP)) },
    { name: 'ballon', groups: buildMesh(ship.filter((c) => c.z >= MAST_TOP)) },
    ...AVATAR_PARTS.map((p) => ({ name: p.name, groups: buildMesh(p.cubes) })),
  ];
}

/** Triangles et appels de dessin des modèles en blocs d'un archipel tout construit. */
export function sceneCost(a: ArchipelagoId): { triangles: number; drawCalls: number } {
  const models = sceneModels(a);
  return {
    triangles: models.reduce((n, m) => n + faceCount(m.groups) * 2, 0),
    drawCalls: models.reduce((n, m) => n + m.groups.length, 0),
  };
}
