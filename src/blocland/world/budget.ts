// Le budget de rendu d'un archipel tout construit, décidé pour Archipéo (docs/univers/archipeo/cadrage.md, §5) :
// ce qu'une tablette de collégien dessine sans peiner. `sceneCost()` compte, sans Three.js, les modèles en blocs de la
// scène (terrain, créatures, Gardiens, Bloc-Navire, bonhomme) tels que la vue 3D les dessine : un appel de dessin par
// groupe de `buildMesh`. La mer, les nuages, les baleines, les oiseaux, les étiquettes et les repères de borne s'y
// ajoutent dans le navigateur : `npm run rendu:mesures` mesure la scène entière. `sceneCostArchipeo()` compte en plus,
// pour le rendu Archipéo, le sol (R2), la mer et la faune (R3), le décor (R4), la construction taillée, les bornes et
// le navire (R5), et les personnages fusionnés (R6). Vérifié par world/budget.test.ts.
import { AVATAR_PARTS } from '../Avatar';
import { BIOMES, type BlockId } from '../biomes';
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
import { trianglesDeLaBrume } from './decor/brume';
import { coutDeLaConstruction, coutDesPiliers, maillageDeLaConstruction, piliersDe, sansToursDuCoeur } from './construction';
import { formeDeBaleine, formeDeNuage, formeDOiseau, nuagesDe, oiseauxDe, planeurDe, trianglesDe } from './faune';
import { MAST_TOP, VEHICLE_STAGES } from './vehicle';
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
 * Les postes du budget (docs/univers/archipeo/cadrage.md §6, « Le budget par poste »), décidés le 28 septembre
 * 2026 : chaque lot de rendu tient ses postes dans leur enveloppe, et la somme tient dans `RENDER_BUDGET`. Les Premiers
 * Rivages ont leur colonne (leur phare, leur volcan) ; les trois autres archipels partagent la leur. Chaque lot n'écrit
 * que sa ligne ; le socle les a toutes posées.
 */
export const ENVELOPPES: Record<Poste, { lot: 'R4b' | 'R5' | 'R6' | 'socle'; nom: string; premiersRivages: Enveloppe; autres: Enveloppe }> = {
  // Proposition de l'artiste technique 3D pour le Jardin des heures (LV2, 4e), à valider par le mainteneur : au bout de
  // la crête, à six blocs d'altitude, l'île ajoute 2 775 triangles au sol des Anciens Ateliers (21 268 → 24 043). Les
  // enveloppes « autres » en passent 1 100 au sol, pris sur la mer, la faune, le décor, la construction, le navire et
  // les créatures, où les trois archipels gardent de la marge (mesurée, tout construit) ; la somme ne change pas (52 300).
  // La Halle aux matériaux (GD-2), enveloppe validée par le mainteneur le 01/10/2026 : le lieu où l'on assemble, sur l'île de
  // l'école de chaque archipel, coûte de 108 à 118 triangles de construction, hublots du phare du large compris. Après
  // les îles-écoles en 20 × 20 (01/10/2026), mesuré tout construit : 6 097 aux Premiers Rivages (sur 6 500), 7 217 aux
  // Îles Brumeuses, 4 594 aux Anciens Ateliers, 4 858 aux Îles du Ciel. L'enveloppe « autres » de la construction passe
  // de 7 100 à 7 240 ; 60 triangles sont pris au bonhomme (25), à la faune (20), au navire (10) et aux bornes (5)
  // (mesurés : 472, 1 274, 420, 700), et aucun autre poste n'a de marge depuis le sol en 20 × 20 : la somme des
  // « autres » passe de 52 960 à 53 040 (toujours sous les 60 000 des tablettes). Puis, enveloppe commune avec la salle
  // des trophées agrandie (GD-3), validée par le mainteneur le 01/10/2026 : la construction du 5e monte à 7 249 avec les
  // trophées sur le toit, à environ 7 241 au pire de GD-3 (20 succès) ; l'enveloppe passe à 7 260 et la somme à 53 060,
  // pris sur la réserve sous les 60 000 (aucun autre poste n'a de marge).
  // Le cœur agrandi de l'Atelier (4e, 01/10/2026), enveloppe validée par le mainteneur le 01/10/2026 : 20 × 20 et sa côte autour, l'île gagne 184 colonnes de terre et 694 triangles de sol (Anciens Ateliers :
  // 24 043 → 24 756). Rien à alléger sans retirer de la terre (les marges sont déjà plates, deux triangles par case), et
  // aucun poste « autres » n'a 660 triangles de marge dans les trois archipels (100 en tout) : l'enveloppe du sol passe
  // de 24 100 à 24 760, et la somme des « autres » de 52 300 à 52 960 (toujours sous les 60 000 des tablettes).
  // Les liaisons du port en étoile (GD-7), enveloppes relevées par le mainteneur le 3 octobre 2026 (« 2a ») : les longs
  // bacs ajoutent des poteaux et des abordages ; la construction des Premiers Rivages passe de 6 500 à 7 200 (6 885
  // mesurés tout construit, 7 157 au pire de la salle des trophées), celle des autres archipels de 7 260 à 7 500 (7 435
  // au pire, aux Îles Brumeuses), le sol des autres de 24 760 à 24 780 (24 774 aux Anciens Ateliers). Les sommes passent
  // à 58 500 aux Premiers Rivages et 53 320 ailleurs, toujours sous les 60 000 des tablettes.
  sol: { lot: 'R4b', nom: 'Sol', premiersRivages: { triangles: 25_000, drawCalls: 2 }, autres: { triangles: 24_780, drawCalls: 1 } },
  // Proposition de l'artiste technique 3D pour le Relais des voyageurs (LV2, 5e), à valider par le mainteneur : une île
  // de plus aux Îles Brumeuses coûte environ 800 triangles de décor et 850 de construction. Les enveloppes « autres » en
  // passent 1 600 du navire, de la mer, des créatures et des bornes (qui ont de la marge dans les trois archipels) au
  // décor et à la construction ; la somme ne change pas (52 300).
  // Proposition de l'artiste technique 3D pour le Refuge des carnets (LV2, 3e), à valider par le mainteneur : à l'est du
  // Château, l'île élargit les Îles du Ciel de 27 cases, et le plancher de nuages qui les borde gagne 336 triangles
  // (4 200 → 4 536, mesuré tout construit). Les enveloppes « autres » en passent 350 à la mer, pris sur le décor (150),
  // la construction (100) et les bornes (100), où les trois archipels gardent de la marge (le plus gourmand : 9 327
  // pour le décor, 7 069 pour la construction, aux Îles Brumeuses) ; puis 20 du navire (420 partout) aux bornes, qui
  // n'avaient plus de marge (700 aux Îles Brumeuses) ; la somme ne change pas (52 300). Le refuge, retouché (île plus
  // profonde de deux rangs, pour un lac loin du bord), porte le sol du 3e à 22 505.
  mer: { lot: 'R4b', nom: 'Mer', premiersRivages: { triangles: 5_000, drawCalls: 1 }, autres: { triangles: 4_550, drawCalls: 1 } },
  // Un appel de plus pendant le passage de la baleine (son écume) : voir `APPEL_DU_PASSAGE`.
  // Proposition de l'artiste technique 3D pour les missions ajoutées en 6e (étapes de contenu C-1 à C-5), à valider par
  // le mainteneur : 36 bornes de 28 triangles portent le poste des Premiers Rivages à 1 008, au-dessus de ses 1 000.
  // Leur enveloppe en prend 250 à la faune, dont les baleines, les oiseaux et les nuages ne dépendent pas des îles
  // (1 132 mesurés, comme au 5e) : 1 250 pour les bornes (44 bornes, huit de plus pour l'île des Grandeurs), 1 250 pour
  // la faune ; la somme ne change pas (57 800). Le navire garde ses 1 000, promis en partie à la construction (cadrage Archipéo, lot 7b).
  faune: { lot: 'R4b', nom: 'Faune', premiersRivages: { triangles: 1_250, drawCalls: 3 }, autres: { triangles: 1_280, drawCalls: 3 } },
  decor: { lot: 'R4b', nom: 'Décor et repères signatures', premiersRivages: { triangles: 12_500, drawCalls: 3 }, autres: { triangles: 9_350, drawCalls: 3 } },
  construction: {
    lot: 'R5',
    nom: 'Construction (bâtiments, ouvrages, monuments, quai, cœur des îles ; fantômes et fenêtres compris)',
    premiersRivages: { triangles: 7_200, drawCalls: 3 },
    autres: { triangles: 7_500, drawCalls: 3 },
  },
  bornes: { lot: 'R5', nom: 'Bornes (instanciées)', premiersRivages: { triangles: 1_250, drawCalls: 1 }, autres: { triangles: 715, drawCalls: 1 } },
  navire: { lot: 'R5', nom: 'Navire', premiersRivages: { triangles: 1_000, drawCalls: 3 }, autres: { triangles: 420, drawCalls: 3 } },
  bonhomme: { lot: 'R6', nom: 'Bonhomme', premiersRivages: { triangles: 500, drawCalls: 2 }, autres: { triangles: 475, drawCalls: 2 } },
  creatures: { lot: 'R6', nom: 'Créatures', premiersRivages: { triangles: 2_500, drawCalls: 1 }, autres: { triangles: 1_950, drawCalls: 1 } },
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
    ...BIOMES.map((b) => [`${b.id}-challenge`, { stars: 3, attempts: 1, best: 1 }]),
  ]);
  const plans = Object.fromEntries([...PLANS, ...VEHICLE_STAGES, ...MONUMENTS].map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const bridges = [...BRIDGES, ...VOYAGES].map((b) => b.id);
  return { progress, world: { parts: plans, log: [], links: bridges } };
}

/** Les modèles en blocs de la scène d'un archipel tout construit, chacun en groupes de `buildMesh`. */
export function sceneModels(a: ArchipelagoId): { name: string; groups: MeshGroup[] }[] {
  const { progress, world: village } = toutConstruit();
  const ship = vehiclePlacement(a, progress, village)?.cubes ?? [];
  return [
    { name: 'terrain', groups: buildMesh(worldCubes(a, progress, village, false)) },
    ...[...creaturePlacements(a, village.links), ...guardianPlacements(a, progress, village.links)].map((c) => ({ name: c.id, groups: buildMesh(c.cubes) })),
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
function archipelArchipeo(a: ArchipelagoId, trophees: readonly BlockId[] = []) {
  const { progress, world: village } = toutConstruit();
  const cubes = worldCubes(a, progress, village, false, [...trophees], false, 'halle');
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
  const decor = coutDuDecor(maillageDuDecor(a, champ, elements));
  // Les bancs de brume (R4b-5e) : dans l'enveloppe du décor, un appel de dessin.
  const brume = trianglesDeLaBrume(a);
  return { triangles: decor.triangles + brume, drawCalls: decor.drawCalls + (brume ? 1 : 0) };
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
    // Les oiseaux, et le planeur des Îles du Ciel (une instance de plus).
    { n: oiseauxDe(a).nombre + (planeurDe(a, worldBounds(a)) ? 1 : 0), t: trianglesDe(formeDOiseau()) },
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
  const { progress, world: village } = toutConstruit();
  const creatures = fusionDesCreatures(creaturePlacements(a, village.links));
  const gardiens = fusionDesGardiens(guardianPlacements(a, progress, village.links));
  const appel = (n: number) => (n > 0 ? 1 : 0);
  return {
    bonhomme: { triangles: trianglesDeLaFusion(fusionDuBonhomme()), drawCalls: 1 },
    creatures: { triangles: trianglesDeLaFusion(creatures), drawCalls: appel(trianglesDeLaFusion(creatures)) },
    gardiens: { triangles: trianglesDeLaFusion(gardiens), drawCalls: appel(trianglesDeLaFusion(gardiens)) },
  };
}

/**
 * La construction taillée d'Archipéo (lot R5) : bâtiments, ouvrages, monuments, quai et cœur des îles, fantômes et
 * fenêtres compris (./construction.ts), sans les bornes : trois appels de dessin au plus.
 */
export function constructionCost(a: ArchipelagoId, trophees: readonly BlockId[] = []): { triangles: number; drawCalls: number } {
  const { ground, reste, champ } = archipelArchipeo(a, trophees);
  const { triangles, drawCalls } = coutDeLaConstruction(maillageDeLaConstruction(a, poseDuDecor(champ, sansToursDuCoeur(reste)), ground));
  return { triangles, drawCalls };
}

/** Les bornes de mission d'Archipéo (lot R5) : un pilier taillé, instancié une fois par borne, en un appel. */
export function bornesCost(a: ArchipelagoId): { triangles: number; drawCalls: number } {
  return coutDesPiliers(piliersDe(archipelArchipeo(a).reste));
}

/** Le Bloc-Navire d'Archipéo (lot R5) : la coque et le ballon en construction taillée (un appel par groupe non vide). */
export function navireCost(a: ArchipelagoId): { triangles: number; drawCalls: number } {
  const { progress, world: village } = toutConstruit();
  const ship = vehiclePlacement(a, progress, village)?.cubes ?? [];
  const parts = [ship.filter((c) => c.z < MAST_TOP), ship.filter((c) => c.z >= MAST_TOP)].map((cubes) => coutDeLaConstruction(maillageDeLaConstruction(a, cubes, [], { navire: true })));
  return { triangles: parts.reduce((n, p) => n + p.triangles, 0), drawCalls: parts.reduce((n, p) => n + p.drawCalls, 0) };
}

/**
 * Les modèles de la scène d'un archipel tout construit dans le rendu Archipéo, lot par lot : le sol en facettes (R2),
 * la mer et la faune (R3), le décor en primitives (R4), la construction taillée, les bornes et le navire (R5), le
 * bonhomme, les créatures et les Gardiens fusionnés (R6). `triangles` et `drawCalls` comptent tout, sauf « Dans la
 * scène » (étiquettes, flèche, fanion, balises), que seul le navigateur mesure.
 */
export function sceneCostArchipeo(a: ArchipelagoId): {
  triangles: number;
  drawCalls: number;
  sol: { triangles: number; drawCalls: number };
  mer: { triangles: number; drawCalls: number };
  faune: { triangles: number; drawCalls: number };
  decor: { triangles: number; drawCalls: number };
  construction: { triangles: number; drawCalls: number };
  bornes: { triangles: number; drawCalls: number };
  navire: { triangles: number; drawCalls: number };
  personnages: { triangles: number; drawCalls: number };
} {
  const sol = solCost(a);
  const decor = decorCost(a);
  // Lot R5 : la construction taillée, les bornes et le navire à la place des cubes restants, de la coque et du ballon.
  const construction = constructionCost(a);
  const bornes = bornesCost(a);
  const navire = navireCost(a);
  // Lot R6 : le bonhomme, les créatures et les Gardiens fusionnés (three/personnagesPeints.ts), plus en cubes.
  const { bonhomme, creatures, gardiens } = personnagesCost(a);
  const personnages = { triangles: bonhomme.triangles + creatures.triangles + gardiens.triangles, drawCalls: bonhomme.drawCalls + creatures.drawCalls + gardiens.drawCalls };
  const mer = merCost(a);
  const faune = fauneCost(a);
  const parts = [sol, mer, faune, decor, construction, bornes, navire, personnages];
  return {
    triangles: parts.reduce((n, p) => n + p.triangles, 0),
    drawCalls: parts.reduce((n, p) => n + p.drawCalls, 0),
    sol,
    mer,
    faune,
    decor,
    construction,
    bornes,
    navire,
    personnages,
  };
}

/**
 * Chaque poste que le code compte, avec sa fonction de coût (celle que vérifie world/budget.test.ts) : `npm run
 * rendu:budget` (scripts/rendu/budget.mjs) les lit ici. « Dans la scène » ne se compte que dans le navigateur. Un poste
 * ajouté à `ENVELOPPES` sans sa fonction ne compile pas.
 */
export const COUTS_DES_POSTES = {
  sol: solCost,
  mer: merCost,
  faune: fauneCost,
  decor: decorCost,
  construction: constructionCost,
  bornes: bornesCost,
  navire: navireCost,
  bonhomme: (a: ArchipelagoId) => personnagesCost(a).bonhomme,
  creatures: (a: ArchipelagoId) => personnagesCost(a).creatures,
  gardiens: (a: ArchipelagoId) => personnagesCost(a).gardiens,
} satisfies Record<Exclude<Poste, 'scene'>, (a: ArchipelagoId) => Enveloppe>;
