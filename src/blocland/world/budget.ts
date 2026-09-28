// Le budget de rendu d'un archipel tout construit, décidé pour Archipéo (docs/conception/cadrage-archipeo.md, §5) :
// ce qu'une tablette de collégien dessine sans peiner. `sceneCost()` compte, sans Three.js, les modèles en blocs de la
// scène (terrain, créatures, Gardiens, Bloc-Navire, bonhomme) tels que la vue 3D les dessine : un appel de dessin par
// groupe de `buildMesh`. La mer, les nuages, les baleines, les oiseaux, les étiquettes et les repères de borne s'y
// ajoutent dans le navigateur : `npm run rendu:mesures` mesure la scène entière. `sceneCostArchipeo()` compte en plus,
// pour le rendu Archipéo, le sol (R2), la mer et la faune (R3), le décor (R4). Vérifié par world/budget.test.ts.
import { AVATAR_PARTS } from '../Avatar';
import { BIOMES } from '../biomes';
import { CATALOG } from '../exercises';
import { BRIDGES, VOYAGES } from './archipelago';
import type { ArchipelagoId } from './map';
import { appelsDuSol, champDuSol, landMesh, poseDuDecor, trianglesDuSol } from './landMesh';
import { modelerLeSol } from './modeleDessine';
import { buildMesh, faceCount, type MeshGroup } from './mesher';
import { MONUMENTS } from './monuments';
import { PLANS, planCells } from './plans';
import { creaturePlacements, guardianPlacements, vehiclePlacement, whaleSpots, worldBounds, worldCubes } from './terrain';
import { grilleDeLaMer, trianglesDeLaGrille } from './mer';
import { coutDuDecor, maillageDuDecor, rangerLeDecor } from './decorMesh';
import { formeDeBaleine, formeDeNuage, formeDOiseau, nuagesDe, oiseauxDe, trianglesDe } from './faune';
import { VEHICLE_STAGES } from './vehicle';
import { fusionDesCreatures, fusionDesGardiens, fusionDuBonhomme, trianglesDeLaFusion } from './personnages/fusions';

export const RENDER_BUDGET = {
  /** Triangles de la scène 3D d'un archipel, tout construit. */
  triangles: 60_000,
  /** Appels de dessin de la scène 3D d'un archipel, tout construit. */
  drawCalls: 40,
} as const;

/** Un poste du budget d'Archipéo : une part de la scène, et le lot qui la dessine. */
export type Poste = 'sol' | 'mer' | 'faune' | 'decor' | 'construction' | 'bornes' | 'navire' | 'bonhomme' | 'creatures' | 'gardiens' | 'scene';

/** Une enveloppe : les triangles et les appels de dessin qu'un poste peut prendre dans un archipel tout construit. */
export interface Enveloppe {
  triangles: number;
  drawCalls: number;
}

/**
 * Les postes du budget (docs/conception/cadrage-archipeo.md §6, « Le budget par poste »), décidés le 28 septembre
 * 2026 : chaque lot de rendu tient ses postes dans leur enveloppe, et la somme tient dans `RENDER_BUDGET`. Les Premiers
 * Rivages ont leur colonne (leur phare, leur volcan) ; les trois autres archipels partagent la leur. Chaque lot n'écrit
 * que sa ligne ; le socle les a toutes posées.
 */
export const ENVELOPPES: Record<Poste, { lot: 'R4b' | 'R5' | 'R6' | 'socle'; nom: string; premiersRivages: Enveloppe; autres: Enveloppe }> = {
  sol: { lot: 'R4b', nom: 'Sol', premiersRivages: { triangles: 25_000, drawCalls: 2 }, autres: { triangles: 23_000, drawCalls: 1 } },
  mer: { lot: 'R4b', nom: 'Mer', premiersRivages: { triangles: 5_000, drawCalls: 1 }, autres: { triangles: 5_000, drawCalls: 1 } },
  // Un appel de plus pendant le passage de la baleine (son écume) : voir `APPEL_DU_PASSAGE`.
  faune: { lot: 'R4b', nom: 'Faune', premiersRivages: { triangles: 1_500, drawCalls: 3 }, autres: { triangles: 1_500, drawCalls: 3 } },
  decor: { lot: 'R4b', nom: 'Décor et repères signatures', premiersRivages: { triangles: 12_500, drawCalls: 3 }, autres: { triangles: 9_000, drawCalls: 3 } },
  construction: {
    lot: 'R5',
    nom: 'Construction (bâtiments, ouvrages, monuments, quai, cœur des îles ; fantômes et fenêtres compris)',
    premiersRivages: { triangles: 6_500, drawCalls: 3 },
    autres: { triangles: 6_500, drawCalls: 3 },
  },
  bornes: { lot: 'R5', nom: 'Bornes (instanciées)', premiersRivages: { triangles: 1_000, drawCalls: 1 }, autres: { triangles: 1_000, drawCalls: 1 } },
  navire: { lot: 'R5', nom: 'Navire', premiersRivages: { triangles: 1_000, drawCalls: 3 }, autres: { triangles: 1_000, drawCalls: 3 } },
  bonhomme: { lot: 'R6', nom: 'Bonhomme', premiersRivages: { triangles: 500, drawCalls: 2 }, autres: { triangles: 500, drawCalls: 2 } },
  creatures: { lot: 'R6', nom: 'Créatures', premiersRivages: { triangles: 2_500, drawCalls: 1 }, autres: { triangles: 2_500, drawCalls: 1 } },
  gardiens: { lot: 'R6', nom: 'Gardiens en sentinelles', premiersRivages: { triangles: 1_800, drawCalls: 1 }, autres: { triangles: 1_800, drawCalls: 1 } },
  scene: {
    lot: 'socle',
    nom: 'Dans la scène : étiquettes, flèche, fanion, balises',
    premiersRivages: { triangles: 500, drawCalls: 5 },
    autres: { triangles: 500, drawCalls: 5 },
  },
};

/** L'appel de dessin en plus pendant le passage de la baleine (l'écume sous elle), compté dans la faune. */
export const APPEL_DU_PASSAGE = 1;

/** L'enveloppe d'un poste dans un archipel. */
export function enveloppeDe(poste: Poste, a: ArchipelagoId): Enveloppe {
  const e = ENVELOPPES[poste];
  return a === '6e' ? e.premiersRivages : e.autres;
}

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
 * Un archipel tout construit comme le rendu Archipéo le range : le sol (en facettes), le décor en primitives (lot R4),
 * qui ne fige plus sa case, et le reste (en cubes).
 */
function archipelArchipeo(a: ArchipelagoId) {
  const { progress, village } = toutConstruit();
  const cubes = worldCubes(a, progress, village, false);
  const { elements, reste } = rangerLeDecor(cubes.filter((c) => !c.sol));
  // Le sol tel qu'Archipéo le dessine : le relief de marche, puis le modelé dessiné (U2).
  const ground = modelerLeSol(a, cubes.filter((c) => c.sol), reste);
  return { ground, elements, reste, champ: champDuSol(a, ground, reste) };
}

/**
 * Le sol et la roche d'un archipel tout construit dans le rendu Archipéo (lot R2) : le maillage à facettes de
 * ./landMesh.ts, un appel de dessin (deux s'il y a de la lave).
 */
export function solCost(a: ArchipelagoId): { triangles: number; drawCalls: number } {
  const m = landMesh(archipelArchipeo(a).champ);
  return { triangles: trianglesDuSol(m), drawCalls: appelsDuSol(m) };
}

/**
 * Le décor d'Archipéo (lot R4) : arbres, rochers, repères, cascades et habillage de la mer en primitives, un appel de
 * dessin (deux s'il y a des lanternes ou de la lave).
 */
export function decorCost(a: ArchipelagoId): { triangles: number; drawCalls: number } {
  const { champ, elements } = archipelArchipeo(a);
  return coutDuDecor(maillageDuDecor(a, champ, elements));
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
 * Les personnages d'Archipéo (lot R6) dans un archipel tout construit : le bonhomme, les créatures fusionnées et les
 * Gardiens en sentinelles fusionnés (./personnages/fusions.ts), un appel de dessin chacun.
 */
export function personnagesCost(a: ArchipelagoId): Record<'bonhomme' | 'creatures' | 'gardiens', { triangles: number; drawCalls: number }> {
  const { progress, village } = toutConstruit();
  const creatures = fusionDesCreatures(creaturePlacements(a, village.bridges));
  const gardiens = fusionDesGardiens(guardianPlacements(a, progress, village.bridges));
  const appel = (n: number) => (n > 0 ? 1 : 0);
  return {
    bonhomme: { triangles: trianglesDeLaFusion(fusionDuBonhomme()), drawCalls: 1 },
    creatures: { triangles: trianglesDeLaFusion(creatures), drawCalls: appel(trianglesDeLaFusion(creatures)) },
    gardiens: { triangles: trianglesDeLaFusion(gardiens), drawCalls: appel(trianglesDeLaFusion(gardiens)) },
  };
}

/**
 * Les modèles de la scène d'un archipel tout construit dans le rendu Archipéo, lot par lot : le sol en facettes (R2),
 * la mer et la faune (R3), le décor en primitives (R4), et tout le reste encore en blocs (construction, objets du quai,
 * créatures, Gardiens, navire, bonhomme). `triangles` et `drawCalls` comptent tout.
 */
export function sceneCostArchipeo(a: ArchipelagoId): {
  triangles: number;
  drawCalls: number;
  sol: { triangles: number; drawCalls: number };
  mer: { triangles: number; drawCalls: number };
  faune: { triangles: number; drawCalls: number };
  decor: { triangles: number; drawCalls: number };
} {
  const sol = solCost(a);
  const decor = decorCost(a);
  const { ground, reste, champ } = archipelArchipeo(a);
  // Comme la vue 3D : le décor resté en cubes d'une case descendue au bas de sa pente descend avec elle.
  const rest = buildMesh(poseDuDecor(champ, reste), ground);
  const models = sceneModels(a).map((m) => (m.name === 'terrain' ? { ...m, groups: rest } : m));
  const mer = merCost(a);
  const faune = fauneCost(a);
  const parts = [sol, mer, faune, decor];
  return {
    triangles: parts.reduce((n, p) => n + p.triangles, 0) + models.reduce((n, m) => n + faceCount(m.groups) * 2, 0),
    drawCalls: parts.reduce((n, p) => n + p.drawCalls, 0) + models.reduce((n, m) => n + m.groups.length, 0),
    sol,
    mer,
    faune,
    decor,
  };
}
