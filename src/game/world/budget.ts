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
import { ARCHIPELAGOS, grantAccess, linkWholeRegion, VOYAGES } from './archipelago';
import { ALTITUDE, type ArchipelagoId, DANS_LE_CIEL, mapOf } from './map';
import { appelsDuSol, champDuSol, landMesh, poseDuDecor, trianglesDuSol } from './landMesh';
import { modelerLeSol } from './drawnModel';
import { buildMesh, drawCallsOf, faceCount } from './mesher';
import { buildBlockMesh, chunkFaceCount, type BlockChunk } from './blockMesh';
import { hiddenBottomLevel } from './sea';
import { MONUMENTS } from './monuments';
import { PLANS, planCells } from './plans';
import { creaturePlacements, guardianPlacements, vehiclePlacement, whaleSpots, worldBounds, worldCubes } from './terrain';
import { grilleDeLaMer, trianglesDeLaGrille } from './sea';
import { coutDuDecor, maillageDuDecor, rangerLeDecor } from './decorMesh';
import { trianglesDeLaBrume } from './decor/mist';
import { coutDeLaConstruction, coutDesPiliers, maillageDeLaConstruction, piliersDe, sansToursDuCoeur } from './construction';
import { formeDeBaleine, formeDeNuage, formeDOiseau, nuagesDe, oiseauxDe, planeurDe, trianglesDe } from './fauna';
import { MAST_TOP, VEHICLE_STAGES } from './vehicle';
import { bridge, type CaseDOuvrage } from './terrain/links';
import { DEPTH } from './terrain/base';
import { GAP_BETWEEN_PLACES, landRectangle } from './footprint';
import { STEP } from './placement';
import { JOIN_FILL, JOIN_MAX_STEPS } from './join';
import { SHORT_LENGTH, LONG_LENGTH } from './routing';
import type { BridgeKind } from './archipelago';
import type { VoxelCube } from './cube';
import { PLACED_FIXTURES } from './placedFixtures';
import { casesDeLaPetiteConstruction } from './fixtures';
import { fusionDesCreatures, fusionDesGardiens, fusionDuBonhomme, trianglesDeLaFusion } from './characters/merges';
import { COUT_DES_BULLES } from './affordance';

export const RENDER_BUDGET = {
  /** Triangles de la scène 3D d'un archipel, tout construit. */
  triangles: 60_000,
  /** Appels de dessin de la scène 3D d'un archipel, tout construit. */
  drawCalls: 40,
} as const;

/**
 * Les Premiers Rivages (6e) dépassent les 60 000 des tablettes depuis les deux îles d'histoire-géographie (HG-2) : relevé
 * par le mainteneur le 6 octobre 2026 (« Budget on augmente pour l'instant »), à la somme de leurs enveloppes, puis du
 * même mot pour les trois îles de sciences (SC-2) : de 63 400 à 72 800. La mesure sur tablette reste à faire.
 */
export const RENDER_BUDGET_6E = { triangles: 72_800, drawCalls: RENDER_BUDGET.drawCalls } as const;

/**
 * Les Îles Brumeuses, les Anciens Ateliers et les Îles du Ciel (5e, 4e, 3e) dépassent à leur tour les 60 000 des tablettes
 * depuis leurs six îles d'histoire-géographie (HG-3), du même mot du mainteneur (« Budget on augmente pour l'instant ») :
 * relevé à la somme des enveloppes « autres » (62 875). Mesurés tout construit, « Dans la scène » compris : 57 336 aux
 * Îles Brumeuses, 55 292 aux Anciens Ateliers, 52 531 aux Îles du Ciel. Puis, avec leurs neuf îles de sciences (SC-3),
 * du même mot, de 62 900 à 74 900, à la somme des enveloppes « autres » (74 805, 74 865 depuis les programmes
 * 2025-2026 : deux bornes de plus au 4e). Mesurés tout construit, « Dans la
 * scène » à part : 69 880 aux Îles Brumeuses, 67 080 aux Anciens Ateliers, 63 791 aux Îles du Ciel. La mesure sur
 * tablette reste à faire.
 */
export const RENDER_BUDGET_AUTRES = { triangles: 74_900, drawCalls: RENDER_BUDGET.drawCalls } as const;

/** Le budget de la scène 3D d'un archipel, tout construit. */
export function renderBudgetOf(a: ArchipelagoId): { triangles: number; drawCalls: number } {
  return a === '6e' ? RENDER_BUDGET_6E : RENDER_BUDGET_AUTRES;
}

/**
 * Le plafond du monde en blocs (Blocland), tout construit : mesuré au lot R0 (77 216 triangles et 234 appels aux
 * Premiers Rivages), il l'empêche seulement de grossir ; les liaisons du port (GD-7) et les petites constructions des
 * commandes y tiennent (`sceneCost`). Relevé de 80 000 à 88 000 triangles pour GD-9 (mainteneur, 5 octobre 2026) : les
 * liaisons tracées par le jeu, au pire toutes au plus long, et les réunions y tiennent (`worstCaseOfRegion`) ; aucun
 * matériau nouveau, les appels ne bougent pas. Relevé à 100 000 triangles et 256 appels par le mainteneur le 6 octobre
 * 2026 (« Budget on augmente pour l'instant ») pour les deux îles d'histoire-géographie du 6e (HG-2), aux valeurs
 * mesurées avec une petite marge : aux Premiers Rivages, 86 028 triangles et 252 appels tout construit, 253 avec les
 * bulles, 98 928 triangles au pire de la région aménagée, 99 154 avec le dessin d'un choix du mode « Aménager ». Puis
 * ramené à 100 000 triangles et 180 appels pour les trois îles de sciences du 6e (SC-2), après le lot qui fond les
 * couleurs des personnages en cubes (#372, choix du mainteneur « Fondre puis relever », 6 octobre 2026) : les triangles
 * n'ont pas à être relevés, les appels sont ramenés aux valeurs mesurées avec une petite marge. Aux Premiers Rivages,
 * avec les sciences : 81 154 triangles et 167 appels tout construit (81 646 avec les commandes posées), 168 avec les
 * bulles, 97 732 triangles au pire de la région aménagée. Les appels ramenés à 120 par la piste 2 du budget (une seule
 * texture pour les blocs, les faces voisines fondues ; « Ok démarre piste 2 », puis « 1 » pour 120, mainteneur, 7
 * octobre 2026) : aux Premiers Rivages, 33 340 triangles et 100 appels tout construit, 102 au pire de la région
 * aménagée. Les triangles restent à 100 000 : pendant « Modifier le plan », le terrain se dessine face par face
 * (97 860 triangles au pire aux Premiers Rivages, 99 150 aux Anciens Ateliers). La mesure sur tablette reste à faire.
 */
export const PLAFOND_DU_MONDE_EN_BLOCS = { triangles: 100_000, drawCalls: 120 } as const;

/** Un poste du budget d'Archipéo : une part de la scène, et le lot qui la dessine. */
export type Poste = 'sol' | 'mer' | 'faune' | 'decor' | 'construction' | 'commandes' | 'bornes' | 'navire' | 'bonhomme' | 'creatures' | 'gardiens' | 'scene';

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
export const ENVELOPPES: Record<Poste, { lot: 'R4b' | 'R5' | 'R6' | 'GD-7' | 'socle'; nom: string; premiersRivages: Enveloppe; autres: Enveloppe }> = {
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
  // La carte de départ calée sur la grille (GD-9, 5 octobre 2026) : chaque lieu se pose au pas de 4 depuis le coin du
  // cadre de sa région, et les Anciens Ateliers sont redessinés en deux rangs, si bien que chaque région s'étend un peu
  // plus. Proposition de l'artiste technique 3D, à valider par le mainteneur, mesurée tout construit
  // (`npm run rendu:budget`) : la mer est tendue sur tout le cadre de la région (un lieu peut se poser partout), et les
  // écueils sont semés sur une carte plus large. Aux Premiers Rivages, la mer passe de 5 000 à 6 300 (6 200 mesurés) et
  // le décor de 12 050 à 12 100 (12 055) ; 350 sont pris au navire (408 mesurés ; 1 000 → 650), le reste sur la réserve
  // sous les 60 000 des tablettes, et leur somme passe de 58 500 à 59 500. Ailleurs, la mer passe de 4 550 à 5 600
  // (5 544 aux Îles du Ciel), le décor de 9 150 à 10 500 (10 417 aux Îles Brumeuses) et le sol de 24 780 à 24 850
  // (24 818 aux Anciens Ateliers) ; aucun autre poste n'a de marge (la construction garde la sienne pour la salle des
  // trophées : 7 435 au pire), et la somme des « autres » passe de 53 320 à 55 790.
  // Les deux îles d'histoire-géographie du 6e (HG-2) : enveloppes des Premiers Rivages relevées par le mainteneur le
  // 6 octobre 2026 (« Budget on augmente pour l'instant »), aux valeurs mesurées tout construit avec une petite marge,
  // sans lot d'optimisation : le sol de 25 000 à 27 800 (27 785 mesurés), le décor de 12 100 à 12 350 (12 332), les
  // commandes de 450 à 520 (516), les créatures de 2 500 à 2 950 (2 917), les Gardiens de 1 800 à 2 100 (2 065). La
  // somme des Premiers Rivages passe de 59 500 à 63 370 : au-dessus des 60 000 des tablettes : `RENDER_BUDGET_6E`,
  // relevé du même mot (61 386 triangles comptés, « Dans la scène » à part). La mesure sur tablette reste à faire.
  // Les trois îles de sciences du 6e (SC-2) : relevées du même mot (« Budget on augmente pour l'instant », 6 octobre
  // 2026), aux valeurs mesurées tout construit avec une petite marge, sans lot d'optimisation (Archipéo en pause) : le sol
  // de 27 800 à 32 800 (32 724 mesurés), la mer de 6 300 à 7 100 (7 068 : le cadre agrandi vers le fond), le décor de
  // 12 350 à 13 700 (13 687), la construction de 7 200 à 7 750 (7 426, 7 698 au pire de la salle des trophées), les
  // commandes de 520 à 640 (632), les bornes de 1 250 à 1 450 (1 428), les créatures de 2 950 à 3 650 (3 635), les
  // Gardiens de 2 100 à 2 780 (2 756). La somme des Premiers Rivages passe de 63 370 à 72 770, `RENDER_BUDGET_6E` à
  // 72 800 (71 368 triangles comptés, « Dans la scène » à part). La mesure sur tablette reste à faire.
  // Les trois îles replacées dans le cadre de 192 × 144 (SC-2, retouche de la Carte) : la mer revient à 6 200 (900 de
  // marge), le sol à 32 728, le décor à 13 227 ; les enveloppes restent celles du mot du mainteneur.
  // Les six îles d'histoire-géographie des 5e, 4e et 3e (HG-3) : enveloppes « autres » relevées du même mot, aux valeurs
  // mesurées tout construit (le plus gourmand des trois archipels) avec une petite marge : le sol de 24 850 à 29 850
  // (29 800 aux Anciens Ateliers), le décor de 10 500 à 11 500 (11 466 aux Îles Brumeuses), les commandes de 200 à 280
  // (278 aux Anciens Ateliers), les bornes de 715 à 870 (868), les créatures de 1 950 à 2 450 (2 405 aux Îles du Ciel),
  // les Gardiens de 1 800 à 2 150 (2 144 aux Îles Brumeuses). La somme des « autres » passe de 55 790 à 62 875 :
  // `RENDER_BUDGET_AUTRES`. Le monde en blocs tient sous son plafond, depuis la fonte des couleurs des personnages (#372) :
  // au pire de la région aménagée, 79 280 triangles et 156 appels aux Anciens Ateliers, 151 appels aux Îles Brumeuses.
  // Les neuf îles de sciences des 5e, 4e et 3e (SC-3) : enveloppes « autres » relevées du même mot (consigne du lot), aux
  // valeurs mesurées tout construit (`npm run rendu:budget`, le plus gourmand des trois archipels) avec une petite marge,
  // sans lot d'optimisation (Archipéo en pause) : le sol de 29 850 à 37 200 (37 194 aux Anciens Ateliers), la mer de
  // 5 600 à 5 850 (5 808 aux Îles du Ciel, leur plancher de nuages élargi), le décor de 11 660 à 13 600 (13 595 aux Îles
  // Brumeuses), la construction de 7 340 à 8 000 (7 971, 7 987 au pire de la salle des trophées, aux Îles Brumeuses), les
  // commandes de 280 à 370 (368), les bornes de 870 à 1 130 (1 120), les créatures de 2 450 à 3 200 (3 181 aux Îles du
  // Ciel), les Gardiens de 2 150 à 2 780 (2 775 aux Îles Brumeuses, le budget des statues). La somme des « autres » passe
  // de 62 875 à 74 805 : `RENDER_BUDGET_AUTRES`.
  sol: { lot: 'R4b', nom: 'Sol', premiersRivages: { triangles: 32_800, drawCalls: 2 }, autres: { triangles: 37_200, drawCalls: 1 } },
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
  mer: { lot: 'R4b', nom: 'Mer', premiersRivages: { triangles: 7_100, drawCalls: 1 }, autres: { triangles: 5_850, drawCalls: 1 } },
  // Un appel de plus pendant le passage de la baleine (son écume) : voir `APPEL_DU_PASSAGE`.
  // Proposition de l'artiste technique 3D pour les missions ajoutées en 6e (étapes de contenu C-1 à C-5), à valider par
  // le mainteneur : 36 bornes de 28 triangles portent le poste des Premiers Rivages à 1 008, au-dessus de ses 1 000.
  // Leur enveloppe en prend 250 à la faune, dont les baleines, les oiseaux et les nuages ne dépendent pas des îles
  // (1 132 mesurés, comme au 5e) : 1 250 pour les bornes (44 bornes, huit de plus pour l'île des Grandeurs), 1 250 pour
  // la faune ; la somme ne change pas (57 800). Le navire garde ses 1 000, promis en partie à la construction (cadrage Archipéo, lot 7b).
  faune: { lot: 'R4b', nom: 'Faune', premiersRivages: { triangles: 1_250, drawCalls: 3 }, autres: { triangles: 1_280, drawCalls: 3 } },
  // Les commandes des habitants dans Archipéo (GD-7, décision du mainteneur du 4 octobre 2026 : le gameplay de Blocland
  // appliqué à Archipéo) : le directeur artistique propose un poste de 450 triangles par archipel, pris sur la marge du
  // décor, la somme inchangée. Mesuré toutes commandes livrées (`commandesCost`) : 430 aux Premiers Rivages, 178 aux
  // Îles Brumeuses, 186 aux Anciens Ateliers, 152 aux Îles du Ciel, aucun appel de plus. Aux Premiers Rivages, les 450
  // passent du décor (12 500 → 12 050 ; 11 746 mesurés). Ailleurs, le décor des Îles Brumeuses (9 103 mesurés) n'a que
  // 247 de marge : proposition de l'artiste technique 3D, validée par le mainteneur le 4 octobre 2026, 200 seulement (9 350 → 9 150).
  // Proposition de l'artiste technique 3D pour HG-3, à valider par le mainteneur : le cadre des Îles Brumeuses élargi de
  // 24 cases (168 × 112) sème plus d'écueils dans sa mer, et leur décor passe à 11 660 triangles (mesuré tout construit,
  // `npm run rendu:budget`). Les enveloppes « autres » en passent 160 de la construction (6 679 au plus, aux Îles
  // Brumeuses) au décor ; la somme ne change pas (62 875).
  decor: { lot: 'R4b', nom: 'Décor et repères signatures', premiersRivages: { triangles: 13_700, drawCalls: 3 }, autres: { triangles: 13_600, drawCalls: 3 } },
  construction: {
    lot: 'R5',
    nom: 'Construction (bâtiments, ouvrages, monuments, quai, cœur des îles ; fantômes et fenêtres compris)',
    premiersRivages: { triangles: 7_750, drawCalls: 3 },
    autres: { triangles: 8_000, drawCalls: 3 },
  },
  // Les quêtes des habitants (GD-10, PR 1) : les trois objets posés à la fin des quêtes du 6e (la lanterne, le portillon,
  // l'escalier) sont des petites constructions, comptées dans ce poste (`toutConstruitAvecLesCommandes`) : 758 triangles
  // mesurés aux Premiers Rivages (`npm run rendu:budget`), toutes commandes livrées et toutes quêtes finies. Les commandes
  // passent de 640 à 800, pris sur la marge du navire (650 → 490 ; 408 mesurés), la somme inchangée (72 770) ; aucun
  // appel de plus.
  commandes: {
    lot: 'GD-7',
    nom: 'Commandes et quêtes (les petites constructions posées, dans le sol et la construction, sans appel de plus)',
    premiersRivages: { triangles: 800, drawCalls: 0 },
    autres: { triangles: 380, drawCalls: 0 },
  },
  // Le lot de contenu des programmes 2025-2026 (une mission de plus à la Forge et au Cabinet de 4e, et à l'Observatoire
  // de 3e, une de moins au Glacier de 5e) : relevé aux mesures tout construit, comme pour SC-3, confirmé par le
  // mainteneur (8 octobre 2026). Les bornes du 4e passent de 40 à 42 (1 176 triangles, 28 par borne, une par mission, aucune en double) :
  // 1 130 → 1 180 ; la petite construction de la Forge, replacée de (10, 3) à (9, 4) avec la mission ajoutée (`calculerLaPlaceDeLaPetiteConstruction`), fige au sol
  // d'autres cases (368 → 374 au 4e) : commandes 370 → 380. La somme des « autres » passe de 74 805 à 74 865, sous
  // `RENDER_BUDGET_AUTRES` (74 900), inchangé.
  bornes: { lot: 'R5', nom: 'Bornes (instanciées)', premiersRivages: { triangles: 1_450, drawCalls: 1 }, autres: { triangles: 1_180, drawCalls: 1 } },
  navire: { lot: 'R5', nom: 'Navire', premiersRivages: { triangles: 490, drawCalls: 3 }, autres: { triangles: 420, drawCalls: 3 } },
  bonhomme: { lot: 'R6', nom: 'Bonhomme', premiersRivages: { triangles: 500, drawCalls: 2 }, autres: { triangles: 475, drawCalls: 2 } },
  creatures: { lot: 'R6', nom: 'Créatures', premiersRivages: { triangles: 3_650, drawCalls: 1 }, autres: { triangles: 3_200, drawCalls: 1 } },
  gardiens: { lot: 'R6', nom: 'Gardiens en sentinelles', premiersRivages: { triangles: 2_780, drawCalls: 1 }, autres: { triangles: 2_780, drawCalls: 1 } },
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
  // Chaque région toute reliée (GD-9), la liaison la plus courte vers chaque lieu ; un lieu qu'aucune liaison n'atteint
  // (une disposition à l'étroit) s'ouvre quand même (`grantAccess`). Le pire cas des liaisons se compte à part (`worstCaseOfRegion`).
  const relie = ARCHIPELAGOS.reduce<string[]>((links, a) => linkWholeRegion(a.classe, links), VOYAGES.map((v) => v.id));
  const bridges = grantAccess(relie, BIOMES.map((b) => b.id));
  return { progress, world: { parts: plans, log: [], links: bridges } };
}

/**
 * La même partie, avec en plus toutes les commandes livrées (GD-7, PR 3) et toutes les quêtes finies (GD-10) : les
 * petites constructions de chaque créature posées chez elle, pour compter le monde au pire. Dans Archipéo, les postes se comptent sur `toutConstruit`, et les
 * petites constructions à part, dans le poste « commandes » (`commandesCost`).
 */
export function toutConstruitAvecLesCommandes() {
  const partie = toutConstruit();
  const fixtures = Object.fromEntries(PLACED_FIXTURES.map((c) => [c.fixture, (casesDeLaPetiteConstruction(c.fixture) ?? []).map((k) => k.key)]));
  return { ...partie, world: { ...partie.world, parts: { ...partie.world.parts, ...fixtures } } };
}

/**
 * Le terrain d'un archipel tout construit comme Blocland le dessine (three/cubes.ts) : en une seule texture, par
 * morceaux du monde, ses faces voisines fondues, sans ses dessous sous l'eau (world/blockMesh.ts). Un appel de dessin par
 * morceau et par passe : le compte de la Carte, où tous les morceaux sont à l'écran.
 */
export function terrainChunks(a: ArchipelagoId, commandes = false, partie = commandes ? toutConstruitAvecLesCommandes() : toutConstruit()): BlockChunk[] {
  const { progress, world: village } = partie;
  return buildBlockMesh(worldCubes(a, progress, village, false), { hiddenBottomsUpTo: hiddenBottomLevel(a), fondre: true });
}

/**
 * Les autres modèles en blocs de la scène d'un archipel tout construit (les personnages, le navire), chacun comme
 * Blocland le dessine : en une seule texture, ses faces fondues, un appel de dessin par passe (three/meshes.ts
 * `modelMeshes`). `commandes` : avec les petites constructions des commandes posées.
 */
export function sceneModels(a: ArchipelagoId, commandes = false, partie = commandes ? toutConstruitAvecLesCommandes() : toutConstruit()): { name: string; chunks: BlockChunk[] }[] {
  const enBlocs = (cubes: VoxelCube[]) => buildBlockMesh(cubes, { fondre: true, morceau: Infinity });
  return modelesEnCubes(a, partie).map((m) => ({ name: m.name, chunks: enBlocs(m.cubes) }));
}

/** Les personnages et le navire d'un archipel tout construit, en cubes ; `tints` : les couleurs unies dessinées ensemble. */
function modelesEnCubes(a: ArchipelagoId, partie: ReturnType<typeof toutConstruit>): { name: string; cubes: VoxelCube[]; tints?: true }[] {
  const { progress, world: village } = partie;
  const ship = vehiclePlacement(a, progress, village)?.cubes ?? [];
  return [
    ...[...creaturePlacements(a, village.links), ...guardianPlacements(a, progress, village.links)].map((c) => ({ name: c.id, cubes: c.cubes, tints: true as const })),
    { name: 'coque', cubes: ship.filter((c) => c.z < MAST_TOP) },
    { name: 'ballon', cubes: ship.filter((c) => c.z >= MAST_TOP) },
    ...AVATAR_PARTS.map((p) => ({ name: p.name, cubes: p.cubes, tints: true as const })),
  ];
}

/**
 * Triangles et appels de dessin des modèles en blocs d'un archipel tout construit, terrain compris, comme Blocland les
 * dessine. `uneTexture` faux : comme avant la piste 2 du budget, un appel par texture et par face (les couleurs unies
 * d'un personnage ensemble), cube par cube : la mesure à laquelle le rendu Archipéo se compare.
 */
export function sceneCost(
  a: ArchipelagoId,
  commandes = false,
  uneTexture = true,
  // La partie toute construite, une fois (elle se calcule lentement) : celle de l'appelant s'il l'a déjà.
  partie = commandes ? toutConstruitAvecLesCommandes() : toutConstruit(),
): { triangles: number; drawCalls: number } {
  if (uneTexture) {
    const chunks = [...terrainChunks(a, commandes, partie), ...sceneModels(a, commandes, partie).flatMap((m) => m.chunks)];
    return { triangles: chunkFaceCount(chunks) * 2, drawCalls: chunks.length };
  }
  const { progress, world: village } = partie;
  const terrain = buildMesh(worldCubes(a, progress, village, false), [], { hiddenBottomsUpTo: hiddenBottomLevel(a) });
  const modeles = modelesEnCubes(a, partie).map((m) => ({ groups: buildMesh(m.cubes), tints: m.tints }));
  return {
    triangles: (faceCount(terrain) + modeles.reduce((n, m) => n + faceCount(m.groups), 0)) * 2,
    drawCalls: terrain.length + modeles.reduce((n, m) => n + (m.tints ? drawCallsOf(m.groups) : m.groups.length), 0),
  };
}

/**
 * Les bulles de Blocland (world/affordance.ts) : trois au plus à la fois, sur l'île où l'on est, des quadrilatères dans
 * le maillage des plaques des créatures (un appel de dessin), le même coût quels que soient l'archipel et l'état du jeu.
 * Hors de `sceneCost`, qui ne compte que les modèles en blocs ; à ajouter au monde en blocs sous son plafond.
 */
export function signesCost(): { triangles: number; drawCalls: number } {
  return { ...COUT_DES_BULLES };
}

/**
 * Un archipel tout construit comme le rendu Archipéo le range : le sol (en facettes), le décor en primitives (lot R4),
 * qui ne fige plus sa case, et le reste (en cubes).
 */
function archipelArchipeo(a: ArchipelagoId, trophees: readonly BlockId[] = [], commandes = false) {
  const { progress, world: village } = commandes ? toutConstruitAvecLesCommandes() : toutConstruit();
  const cubes = worldCubes(a, progress, village, false, [...trophees], false, 'halle');
  const { elements, reste } = rangerLeDecor(cubes.filter((c) => !c.sol));
  // Le sol tel qu'Archipéo le dessine : le relief de marche, puis le modelé dessiné (U2).
  const ground = modelerLeSol(a, cubes.filter((c) => c.sol), reste);
  return { ground, elements, reste, champ: champDuSol(a, ground, reste) };
}

// ---------- Le pire cas des liaisons tracées par le jeu (GD-9) ----------

/**
 * Les liaisons d'une région de `n` lieux, au plus (GD-9) : deux liaisons ne se croisent jamais et ne coupent aucun lieu,
 * si bien que les lieux et leurs liaisons forment un graphe planaire, qui a au plus 3n − 6 arêtes (n ≥ 3).
 */
export function maxLinks(n: number): number {
  return Math.max(n - 1, 3 * n - 6);
}

/**
 * La construction qui réunit deux lieux au plus large et au plus long qu'elle puisse être dans une région (GD-9,
 * ./join.ts), toute posée : sur la largeur du côté commun le plus large (le second plus grand côté de terre des lieux de
 * la région), de l'écart le plus grand au plus près de la grille, plus deux creux de baie, avec ses trois marches,
 * pleine jusqu'au pied de la terre. Chaque colonne s'arrête sur une case de terre de chaque lieu (pleine elle aussi
 * jusqu'au pied, `terre`) : au pire, la côte est d'un cran plus basse que la construction à ses deux bouts.
 */
export function joinCubes(a: ArchipelagoId): { cubes: VoxelCube[]; terre: VoxelCube[] } {
  const cotes = mapOf(a)
    .map((d) => {
      const r = landRectangle(d);
      return Math.max(r.x1 - r.x0, r.y1 - r.y0);
    })
    .sort((p, q) => q - p);
  const largeur = cotes[1] ?? cotes[0];
  const longueur = GAP_BETWEEN_PLACES + STEP - 1 + 2 * JOIN_FILL;
  const alt = ALTITUDE[a];
  const k = (u: number) => Math.min(JOIN_MAX_STEPS, Math.floor((u * (JOIN_MAX_STEPS + 1)) / longueur));
  const cubes: VoxelCube[] = [];
  const terre: VoxelCube[] = [];
  const colonne = (out: VoxelCube[], u: number, j: number, haut: number, texture: string) => {
    for (let z = alt - DEPTH; z <= haut; z++) out.push({ x: 2000 + u, y: 2000 + j, z, color: '#000', texture: z === haut ? texture : 'pierre', sansDessous: z === alt - DEPTH ? true : undefined });
  };
  for (let j = 0; j < largeur; j++) {
    for (let u = 0; u < longueur; u++) colonne(cubes, u, j, alt + k(u), 'herbe');
    colonne(terre, -1, j, alt + k(0) - 1, 'herbe');
    colonne(terre, longueur, j, alt + k(longueur - 1) - 1, 'herbe');
  }
  return { cubes, terre };
}

/**
 * Ce que coûte au plus une réunion de deux lieux dans une région (`joinCubes`), en triangles (GD-9) : les faces de ses
 * cubes que ni elle ni la terre des deux lieux ne cachent (le dessous de son pied, sous la mer, n'est pas dessiné).
 */
export function joinTriangles(a: ArchipelagoId): number {
  const { cubes, terre } = joinCubes(a);
  const plein = new Set([...cubes, ...terre].map((c) => `${c.x},${c.y},${c.z}`));
  let faces = 0;
  for (const c of cubes)
    for (const [dx, dy, dz] of [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ]) {
      if (dz === -1 && c.sansDessous) continue;
      if (!plein.has(`${c.x + dx},${c.y + dy},${c.z + dz}`)) faces++;
    }
  return faces * 2;
}

/** Le coin d'une liaison en L : dans Blocland, un cube plein de plus (12 triangles au plus). */
export const TRIANGLES_OF_A_BEND = 12;

/**
 * Une liaison en L de `longueur` cases, à son coude au milieu, à l'altitude de sa région : les cubes que le terrain y
 * pose (`bridge`, ./terrain/links.ts), seuls (sans le terrain pour cacher une face : le pire).
 */
export function linkCubes(a: ArchipelagoId, kind: BridgeKind, longueur: number): VoxelCube[] {
  const z = ALTITUDE[a];
  const moitie = Math.floor(longueur / 2);
  const path: CaseDOuvrage[] = [];
  for (let i = 0; i < longueur; i++)
    path.push(i < moitie ? { x: 1000 + i, y: 1000, z, climbing: false, dx: 1, dy: 0 } : { x: 1000 + moitie - 1, y: 1000 + i - moitie + 1, z, climbing: false, dx: 0, dy: 1 });
  const ids = mapOf(a);
  const cubes: VoxelCube[] = [];
  bridge({ id: 'pire', from: ids[0].id, to: ids[1].id, cost: 0 }, kind, path, cubes, false, new Set());
  return cubes;
}

/** Les triangles d'une liaison au plus long (`linkCubes`), son coin compris. */
export function linkTriangles(a: ArchipelagoId, kind: BridgeKind, longueur: number): number {
  return faceCount(buildMesh(linkCubes(a, kind, longueur))) * 2 + TRIANGLES_OF_A_BEND;
}

/**
 * Le pire cas d'une région aménagée (GD-9), tout construit, commandes posées et bulles comprises : le monde d'aujourd'hui
 * sans ses liaisons (`base`), puis autant de liaisons que l'élève peut en poser (`maxLinks`), toutes au plus long —
 * celles qui ouvrent un lieu (lieux − 1, longues : des bacs de 96 cases sur la mer, des ponts dans le ciel), les autres
 * des raccourcis entre lieux ouverts (36 cases au plus, `SHORT_LINK`) — et les réunions : un lieu ne se réunit qu'à un
 * seul autre (lieux ÷ 2 au plus), chacune au plus large (`joinTriangles`). Une réunion est un côté du même graphe
 * planaire que les liaisons (elle ne croise aucune liaison, et aucune liaison ne relie deux lieux réunis) : chacune
 * prend la place d'un raccourci. Les triangles comptés face par face, comme le terrain se dessine pendant « Modifier le
 * plan » (three/cubes.ts : il n'y fond pas ses faces), le pire moment ; les appels, les mêmes dans le mode et hors de lui
 * (un par morceau du monde et par passe).
 */
export function worstCaseOfRegion(a: ArchipelagoId): { base: number; liaisons: number; reunions: number; triangles: number; drawCalls: number } {
  const partie = toutConstruitAvecLesCommandes();
  const terrain = worldCubes(a, partie.progress, partie.world, false);
  const scene = sceneCost(a, true, false, partie);
  const appels = sceneCost(a, true, true, partie).drawCalls;
  const signes = signesCost();
  const dessous = { hiddenBottomsUpTo: hiddenBottomLevel(a) };
  const liaisonsDAujourdhui = (faceCount(buildMesh(terrain, [], dessous)) - faceCount(buildMesh(terrain.filter((c) => !c.bridge), [], dessous))) * 2;
  const base = scene.triangles + signes.triangles - liaisonsDAujourdhui;
  const lieux = mapOf(a).length;
  const longue = linkTriangles(a, DANS_LE_CIEL[a] ? 'pont' : 'bac', LONG_LENGTH);
  const raccourci = linkTriangles(a, 'pont', SHORT_LENGTH);
  const nReunions = Math.floor(lieux / 2);
  const liaisons = (lieux - 1) * longue + (maxLinks(lieux) - (lieux - 1) - nReunions) * raccourci;
  const reunions = nReunions * joinTriangles(a);
  return { base, liaisons, reunions, triangles: base + liaisons + reunions, drawCalls: appels + signes.drawCalls };
}

/**
 * Le sol et la roche d'un archipel tout construit dans le rendu Archipéo (lot R2) : le maillage à facettes de
 * ./landMesh.ts, un appel de dessin (deux s'il y a de la lave).
 */
export function solCost(a: ArchipelagoId, commandes = false): { triangles: number; drawCalls: number } {
  const m = landMesh(archipelArchipeo(a, [], commandes).champ);
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
  const brume = trianglesDeLaBrume(a, toutConstruit().world.links);
  return { triangles: decor.triangles + brume, drawCalls: decor.drawCalls + (brume ? 1 : 0) };
}

/** La mer d'Archipéo (lot R3) : la grille de ./sea.ts, jusqu'à l'horizon, en un appel de dessin. */
export function merCost(a: ArchipelagoId): { triangles: number; drawCalls: number } {
  const b = worldBounds(a);
  const width = Math.max(b.maxX - b.minX, b.maxY - b.minY);
  return { triangles: trianglesDeLaGrille(grilleDeLaMer(b, width * 4)), drawCalls: 1 };
}

/**
 * La faune et le ciel d'Archipéo (lot R3) : les baleines (souffle compris), les oiseaux et les nuages, une instanciation
 * par famille (./fauna.ts). Au plus trois appels de dessin, un de plus pendant le passage de la baleine (son écume).
 */
export function fauneCost(a: ArchipelagoId): { triangles: number; drawCalls: number } {
  const familles = [
    { n: whaleSpots(a, toutConstruit().world.links).length, t: trianglesDe(formeDeBaleine()) },
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
 * Gardiens en sentinelles fusionnés (./characters/merges.ts), un appel de dessin chacun.
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
export function constructionCost(a: ArchipelagoId, trophees: readonly BlockId[] = [], commandes = false): { triangles: number; drawCalls: number } {
  const { ground, reste, champ } = archipelArchipeo(a, trophees, commandes);
  const { triangles, drawCalls } = coutDeLaConstruction(maillageDeLaConstruction(a, poseDuDecor(champ, sansToursDuCoeur(reste)), ground));
  return { triangles, drawCalls };
}

/**
 * Les petites constructions des commandes dans Archipéo (GD-7), toutes livrées : ce qu'elles ajoutent à la construction
 * taillée (leurs blocs, dans le même maillage) et au sol (les cases qu'elles figent à plat), sans appel de dessin de plus.
 */
export function commandesCost(a: ArchipelagoId): { triangles: number; drawCalls: number } {
  const [sans, avec] = [false, true].map((commandes) => {
    const sol = solCost(a, commandes);
    const construction = constructionCost(a, [], commandes);
    return { triangles: sol.triangles + construction.triangles, drawCalls: sol.drawCalls + construction.drawCalls };
  });
  return { triangles: avec.triangles - sans.triangles, drawCalls: avec.drawCalls - sans.drawCalls };
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
  // Lot R6 : le bonhomme, les créatures et les Gardiens fusionnés (three/paintedCharacters.ts), plus en cubes.
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
  construction: (a: ArchipelagoId) => constructionCost(a),
  commandes: commandesCost,
  bornes: bornesCost,
  navire: navireCost,
  bonhomme: (a: ArchipelagoId) => personnagesCost(a).bonhomme,
  creatures: (a: ArchipelagoId) => personnagesCost(a).creatures,
  gardiens: (a: ArchipelagoId) => personnagesCost(a).gardiens,
} satisfies Record<Exclude<Poste, 'scene'>, (a: ArchipelagoId) => Enveloppe>;
