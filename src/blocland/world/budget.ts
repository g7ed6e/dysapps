// Le budget de rendu d'un archipel tout construit, décidé pour Archipéo (docs/conception/cadrage-archipeo.md, §5) :
// ce qu'une tablette de collégien dessine sans peiner. `sceneCost()` compte, sans Three.js, les modèles en blocs de la
// scène (terrain, créatures, Gardiens, Bloc-Navire, bonhomme) tels que la vue 3D les dessine : un appel de dessin par
// groupe de `buildMesh`. La mer, les nuages, les baleines, les oiseaux, les étiquettes et les repères de borne s'y
// ajoutent dans le navigateur : `npm run rendu:mesures` mesure la scène entière. `sceneCostArchipeo()` compte en plus,
// pour le rendu Archipéo, le sol (R2), la mer et la faune (R3). Vérifié par world/budget.test.ts.
import { AVATAR_PARTS } from '../Avatar';
import { BIOMES } from '../biomes';
import { CATALOG } from '../exercises';
import { BRIDGES, VOYAGES } from './archipelago';
import type { ArchipelagoId } from './map';
import { appelsDuSol, champDuSol, landMesh, poseDuDecor, trianglesDuSol } from './landMesh';
import { buildMesh, faceCount, type MeshGroup } from './mesher';
import { MONUMENTS } from './monuments';
import { PLANS, planCells } from './plans';
import { creaturePlacements, guardianPlacements, vehiclePlacement, whaleSpots, worldBounds, worldCubes } from './terrain';
import { grilleDeLaMer, trianglesDeLaGrille } from './mer';
import { formeDeBaleine, formeDeNuage, formeDOiseau, nuagesDe, oiseauxDe, trianglesDe } from './faune';
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

/**
 * Le sol et la roche d'un archipel tout construit dans le rendu Archipéo (lot R2) : le maillage à facettes de
 * ./landMesh.ts, un appel de dessin (deux s'il y a de la lave).
 */
export function solCost(a: ArchipelagoId): { triangles: number; drawCalls: number } {
  const { progress, village } = toutConstruit();
  const cubes = worldCubes(a, progress, village, false);
  const m = landMesh(
    champDuSol(
      a,
      cubes.filter((c) => c.sol),
      cubes.filter((c) => !c.sol),
    ),
  );
  return { triangles: trianglesDuSol(m), drawCalls: appelsDuSol(m) };
}

/** La mer d'Archipéo (lot R3) : la grille de ./mer.ts, jusqu'à l'horizon, en un appel de dessin. */
export function merCost(a: ArchipelagoId): { triangles: number; drawCalls: number } {
  const b = worldBounds(a);
  const width = Math.max(b.maxX - b.minX, b.maxY - b.minY);
  return { triangles: trianglesDeLaGrille(grilleDeLaMer(b, width * 4)), drawCalls: 1 };
}

/**
 * La faune et le ciel d'Archipéo (lot R3) : les baleines (souffle compris), les oiseaux et les nuages, une instanciation
 * par famille (./faune.ts). Au plus trois appels de dessin, un de plus pendant le passage de la baleine (son écume).
 */
export function fauneCost(a: ArchipelagoId): { triangles: number; drawCalls: number } {
  const familles = [
    { n: whaleSpots(a).length, t: trianglesDe(formeDeBaleine()) },
    { n: oiseauxDe(a).nombre, t: trianglesDe(formeDOiseau()) },
    { n: nuagesDe(a).length, t: trianglesDe(formeDeNuage()) },
  ];
  return {
    triangles: familles.reduce((s, f) => s + f.n * f.t, 0),
    drawCalls: familles.filter((f) => f.n > 0).length,
  };
}

/**
 * Les modèles de la scène d'un archipel tout construit dans le rendu Archipéo, lot par lot : le sol en facettes (R2),
 * la mer et la faune (R3), et tout le reste encore en blocs (construction, décor, créatures, Gardiens, navire,
 * bonhomme). `triangles` et `drawCalls` comptent tout.
 */
export function sceneCostArchipeo(a: ArchipelagoId): {
  triangles: number;
  drawCalls: number;
  sol: { triangles: number; drawCalls: number };
  mer: { triangles: number; drawCalls: number };
  faune: { triangles: number; drawCalls: number };
} {
  const sol = solCost(a);
  const { progress, village } = toutConstruit();
  const cubes = worldCubes(a, progress, village, false);
  const ground = cubes.filter((c) => c.sol);
  const autres = cubes.filter((c) => !c.sol);
  // Comme la vue 3D : le décor d'une case descendue au bas de sa pente descend avec elle.
  const rest = buildMesh(poseDuDecor(champDuSol(a, ground, autres), autres), ground);
  const models = sceneModels(a).map((m) => (m.name === 'terrain' ? { ...m, groups: rest } : m));
  const mer = merCost(a);
  const faune = fauneCost(a);
  return {
    triangles: sol.triangles + mer.triangles + faune.triangles + models.reduce((n, m) => n + faceCount(m.groups) * 2, 0),
    drawCalls: sol.drawCalls + mer.drawCalls + faune.drawCalls + models.reduce((n, m) => n + m.groups.length, 0),
    sol,
    mer,
    faune,
  };
}
