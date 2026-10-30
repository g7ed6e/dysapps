// Le budget de dessin du monde continu (prototype du 6e), compté sans Three.js comme world/budget.ts le fait pour le
// monde en grille : les triangles et les appels de chaque poste. Estimé au cadrage : environ 45 000 triangles et 12 à
// 18 appels avec quatre lieux (prototype-6e.md, § 3) ; relevée par le mainteneur à 75 000 triangles le 16 octobre 2026
// (GD-20, L6b : « Un iPad 9e génération doit pouvoir faire tourner le jeu, donc on est large en triangles pour
// l'instant »), puis à 86 000 le 17 octobre 2026 (GD-20, point 3, lot 3), les appels inchangés, puis à 98 000 triangles et 21
// appels le 18 octobre 2026 pour les habitants en 3D (« on peut augmenter le budget », mesure sur iPad avant la fusion). Les images par seconde se mesurent sur l'iPad 9e génération (`?mesures`).
import { creuxTriangles } from './creux5e';
import { failleTriangles } from './faille5e';
import { perchoirTriangles } from './perchoir5e';
import { FAUNA, birdFacets, detourTrianglesAtMost, spoutFacets, whaleFacets } from './detours';
import { NEF_MODEL_TRIANGLES, nefSiteTriangles } from './nef';
import { NEF_5E_MODEL_TRIANGLES, nef5eSiteTriangles } from './nef5e';
import { LISIERE_SITE, lisiereDecorFacets } from './lisiere';
import { WORLD_FOG } from './camera';
import { bridgeLay } from './bridgeLay';
import { bridgeFacets, bridgeMapMark, cabinCarFacets, isCabin } from './bridges';
import { monteeGlowBand } from './montee5e';
import { linkedLands } from './lands';
import { planFor, scenePlace, type OpenWorldLevel, type ScenePlaceId } from './levelPlan';
import { placeArt } from './northShore';
import { networkSamples, pathRibbons } from './paths';
import { PLACES, type PlaceId } from './plan6e';
import { lanternLight, modelOfPlace } from './places';
import { rafiot6eFacets } from './rafiot6e';
import { constructionFacets, WHOLE } from './construction';
import { PORT_WORST, assemblyScene, portFacets } from './port';
import { answerObjects, itemScene, placeTrace, sceneSpot } from './questionScene';
import type { ItemScene } from './questions';
import { HABITANT_TRIANGLES, HABITANT_TRIANGLES_3E, HABITANT_TRIANGLES_4E, HABITANT_TRIANGLES_5E, hasHabitantModel } from './habitants';
import { EQUIPIER_TRIANGLES, guideOf } from './equipage';
import { farArchipelagos3e } from './finalView3e';
import { GUIDE_SHADOW_TRIANGLES, bellPlane, habitantHand, scenetteDecor, scenetteFinale, scenetteSetting } from './scenette';
import { WORLD_HABITANT_TRIANGLES, hasWorldHabitant } from './worldHabitants';
import { landTileCounts } from './flora';
import { buildHeightField, heightOnMesh, tileRings } from './terrain';
import { buildHeightField5e, groundOn5e, tileCounts5e } from './terrain5e';
import { NETWORK_5E, pathMapEdges5e, pathRibbons5e } from './paths5e';
import { TERRAIN_5E } from './plan5e';
import { CLIFF_MAP_COLORS, cliffMapLine, riftMistFacets } from './mist5e';
import { FOG_3E, FOG_4E, skyDome } from './sky';
import { veilFacets } from './veil';
import { groupsTriangles, wildlifeTriangles } from './wildlife';
import { allCritterForms, wildlifeGroups5e } from './wildlife5e';
import { hutteFacets } from './hutte5e';
import { dalleFacets } from './dalle4e';
import { epaveFacets } from './epave4e';
import { recoinFacets } from './recoin4e';
import { replatFacets } from './replat4e';
import { cadranFacets } from './cadran3e';
import { bergerieFacets } from './bergerie3e';
import { cedreFacets } from './cedre3e';
import { lacFacets } from './lac3e';
import { CRIQUE_SITE, NEF_4E_MODEL_TRIANGLES, criqueDecorFacets, nef4eSiteTriangles } from './crique4e';
import { NETWORK_4E, pathRibbons4e } from './paths4e';
import { TERRAIN_4E } from './plan4e';
import { buildHeightField4e, groundOn4e, mapOverlay4e, tileCounts4e } from './terrain4e';
import { NEF_PARURES, PARVIS_SITE, nefParuresFacets, parvisDecorFacets, zeppelinFacets } from './parvis3e';
import { NETWORK_3E, pathRibbons3e } from './paths3e';
import { TERRAIN_3E } from './plan3e';
import { buildHeightField3e, ground3e, mapOverlay3e, tileCounts3e } from './terrain3e';

/** Les terres qu'on relie du 6e : le budget est celui du monde ouvert du 6e (GD-22, lot 1 : le plan par niveau). */
const LINKED_LANDS_6E = linkedLands(planFor('6e'));

/**
 * Kéo : le modèle importé de près (1 500 triangles environ) et son anneau clair au sol, comme le poste « bonhomme » du
 * monde en grille ; son ombre peinte (GD-20, point 3, lot 3 : 10 triangles, un appel).
 */
/**
 * Le déplacement libre (GD-20, « Le déplacement libre », lot 1) y ajoute sa silhouette vue à travers le décor (son corps
 * une deuxième fois, 1 500 triangles, un appel) et la marque au sol là où il va (40 triangles, un appel).
 */
const KEO = { triangles: 3170, calls: 5 };

/**
 * La baleine, son souffle et les cinq oiseaux du bord d'eau (GD-20, déplacement libre, lot 2), et les bêtes des côtes
 * (mouettes, crabes, poissons ; piste « Ambiance », 19 octobre 2026, ./wildlife.ts) : un maillage, toutes à la fois.
 */
const FAUNA_COST = { triangles: whaleFacets().triangles + spoutFacets().triangles + FAUNA.birds * birdFacets().triangles + wildlifeTriangles(), calls: 1 };

/** Le dôme du ciel (GD-20, point 3, lot 3) : un maillage, dessiné d'abord, sur la Carte aussi. */
const SKY = { triangles: skyDome(1).triangles, calls: 1 };

/**
 * L'enveloppe du monde ouvert du 6e : 111 500 triangles, 22 appels, relevée de 11 360 triangles pour l'équipier qui guide
 * la scénette et son ombre (GD-23, lot 1, choix du mainteneur du 21 octobre 2026 : « Zia et Malo, 12 scénettes », la
 * hausse d'environ 11 300 triangles et d'un appel, l'enveloppe à environ 111 500, dite sur la carte ; les images par seconde à mesurer sur l'iPad avant la fusion).
 * Avant : 100 140 triangles, 22 appels, relevée de 140 triangles pour les bêtes des côtes (piste
 * « Ambiance », choisie par le mainteneur le 19 octobre 2026 avec « environ +300 triangles, 0 appel » : 134 triangles
 * de plus, et les 40 de marge d'avant gardés). Avant : 100 000 triangles, 22 appels, relevée pour la Nef (GD-21, « on peut augmenter le budget si
 * besoin », mainteneur, 18 octobre 2026 ; 98 000 avant). Les 98 000 triangles et 22 appels (21, puis 22 avec les
 * Détours pour garder 3 appels de réserve, carte « Monter à 22 ») ont été relevés par le mainteneur le 18 octobre 2026
 * pour les habitants des scénettes en modèles 3D (« on peut augmenter le budget » ; les images par seconde à mesurer sur
 * l'iPad avant la fusion) ; avec les Détours (#459), 19 appels au pire, 3 de réserve. Avant : 86 000 triangles (17 octobre 2026, les cinq leviers graphiques
 * du lot 3 de GD-20, point 3 : « plafond 86 000 triangles et 18 appels » ; 75 000 depuis le 16 octobre) et 20 appels (le
 * déplacement libre, la silhouette de Kéo et la marque au sol, 18 octobre 2026).
 * La Carte la touche presque (toute l'île de loin, sa végétation comprise).
 */
const OPEN_WORLD_BUDGET_6E = { triangles: 111_500, calls: 22 } as const;

/**
 * L'enveloppe du monde ouvert du 5e : 128 000 triangles, 22 appels, relevée de 10 000 triangles pour les habitants près
 * de leur porte en modèle 3D (choix du mainteneur, 23 octobre 2026, « 1 500 triangles », la hausse à environ 128 000 dite
 * sur la carte ; hors scénette seulement ; les images par seconde à mesurer sur l'iPad). Avant : 118 000 (choix du
 * mainteneur, 20 octobre 2026, « Relever seulement », d'après l'étude du lot 5, `economies.md`, piste D).
 */
const OPEN_WORLD_BUDGET_5E = { triangles: 128_000, calls: 22 } as const;

/**
 * Le plafond d'un lieu du 5e, ruine, étapes et traces montrées ensemble, en triangles (recommandation du directeur
 * artistique du 20 octobre 2026, suivie en attendant le mainteneur : facile à défaire).
 */
export const PLACE_TRIANGLES_MAX_5E = 1_600;

/**
 * Ce que les chaussées dallées du plateau ajoutent aux chemins du 5e, au plus, à la place du sable (GD-22, lot 13a :
 * « le coût de la terre », mesuré le 21 octobre 2026, +1 454 triangles, aucun appel de plus ; +1 586 avec la retouche 1,
 * le liseré des nœuds à douze pans) : un plafond des tests des lots, jamais une enveloppe.
 */
export const CAUSEWAYS_ADDED_5E = 1_600;

/**
 * L'enveloppe que les fiches du 4e et du 3e donnent au monde ouvert (§ 8 de chacune) : 118 000 triangles, 22 appels,
 * cible 110 000. Une seule constante : quand une fiche change, on ne pense pas à deux endroits (expert frontend, relecture
 * du lot 1 du 3e). Seul le mainteneur la relève.
 */
const FICHE_ENVELOPE = { triangles: 118_000, calls: 22 } as const;

/**
 * L'enveloppe du monde ouvert du 4e (fiche du 4e, § 8 : « l'enveloppe décidée tient »). Au lot 1 (l'île entière en
 * grandes masses), le monde en est loin : chaque lieu, la Crique, l'aéronef et les habitants viennent avec leur lot.
 */
const OPEN_WORLD_BUDGET_4E = FICHE_ENVELOPE;

/**
 * L'enveloppe du monde ouvert du 3e (fiche du 3e, § 8, comme le 4e). Au lot 1 (les Îles du Ciel en grandes masses), le
 * monde en est loin : chaque lieu, le Parvis, les habitants et les Détours viennent avec leur lot.
 */
const OPEN_WORLD_BUDGET_3E = FICHE_ENVELOPE;

/**
 * La forêt du 5e retaillée (pistes B, C puis A, choisies par le mainteneur le 21 octobre 2026 : la forêt noyée, les
 * bosquets et les clairières, le palétuvier en trois grappes sur ses racines arquées) : au plus tant de triangles de
 * plus, dans le maillage du sol, sans appel de plus. Mesurée : +5 733 scénette ouverte.
 */
export const FOREST_REWORK_MAX_5E = 5_800;

/** Le plafond de la ruine d'un lieu du 5e, en triangles (intention du directeur artistique du lot 16 : visée à 1 000). */
export const PLACE_RUIN_TRIANGLES_MAX_5E = 1_200;

/**
 * Le plafond d'un lieu du 4e, ruine, étapes, traces et ce qu'il pose hors de son emprise (`reach`, son allumage final)
 * montrés ensemble, en triangles, et celui de sa ruine : ceux du 5e (intention du directeur artistique du lot 2 du 4e, la
 * Forge).
 */
export const PLACE_TRIANGLES_MAX_4E = 1_600;
export const PLACE_RUIN_TRIANGLES_MAX_4E = 1_200;
/**
 * Le plafond d'un lieu du 3e, ruine, étapes et traces montrées ensemble, en triangles, et celui de sa ruine : ceux du 4e
 * (proposition du Versant, § 0, décision du mainteneur) ; le grand lieu du 3e, le Belvédère, a le sien (fiche du 3e, § 8 :
 * 1 600 et le surcoût du grand lieu, environ 800).
 */
export const PLACE_TRIANGLES_MAX_3E = 1_600;
export const PLACE_RUIN_TRIANGLES_MAX_3E = 1_200;
export const GRAND_PLACE_TRIANGLES_MAX_3E = 2_400;

/**
 * Le plafond du pont de l'Épaule relié, en triangles (intention, « Le budget ») : l'arche, le tablier, les rails et leurs
 * traverses, les deux parapets et leurs chaperons, les quatre lanternes, culées comprises (./bridges.test.ts le vérifie).
 */
export const EPAULE_BRIDGE_TRIANGLES = 1_300;

/**
 * Le plafond du pont du glacier relié, au 3e (proposition des Alpages, § 2 : « environ 1 200, comme un pont du 4e ») :
 * l'arche de granit en dos d'âne, ses culées, son chemin de pierre claire, ses deux parapets et leurs chaperons d'ardoise.
 */
export const GLACIER_BRIDGE_TRIANGLES_3E = 1_200;

/**
 * Le plafond de la galerie du col reliée, au 3e (proposition du Cirque, § 2 : « environ 800 ») : ses arcades, son mur
 * plein, son toit d'ardoise et sa neige, son dallage, les deux murets d'éboulis rangés.
 */
export const COL_GALLERY_TRIANGLES_3E = 800;

/**
 * Le plafond des arches basses reliées et des deux petites arches des Prairies, au 3e (proposition des Prairies, § 2 :
 * « environ 2 400 avec les deux petites arches ») : leurs chaussées, leurs voûtes et leurs claveaux, leurs parapets à
 * chaperon d'ardoise, le chemin de pierre claire.
 */
export const ARCHES_TRIANGLES_3E = 2_400;

/**
 * Le plafond du pont du ravin en arche, tombé ou relié (les Coteaux du 4e ; intention du directeur artistique du 22
 * octobre 2026, § 12 : « environ 1 200 triangles », à la place du pont générique, 132 tombé et 906 relié).
 */
export const RAVIN_BRIDGE_TRIANGLES_MAX_4E = 1_200;

/** L'enveloppe du monde ouvert de chaque niveau, que seul le mainteneur relève. */
export const OPEN_WORLD_BUDGETS: Readonly<Record<OpenWorldLevel, { readonly triangles: number; readonly calls: number }>> = {
  '6e': OPEN_WORLD_BUDGET_6E,
  '5e': OPEN_WORLD_BUDGET_5E,
  '4e': OPEN_WORLD_BUDGET_4E,
  '3e': OPEN_WORLD_BUDGET_3E,
};

export interface OpenWorldCost {
  poste: 'ciel' | 'sol' | 'mer' | 'chemins' | 'lieux' | 'aménagements' | 'détours' | 'faune' | 'pose' | 'brume' | 'kéo' | 'question' | 'scénette' | 'nef' | 'habitants';
  triangles: number;
  calls: number;
}

/** Les scènes d'item les plus chargées de chaque lieu (le Phare : six cloches ; les Quais : 98 caisses, ou 49 et 49). */
const HEAVIEST: readonly { place: PlaceId; scene: ItemScene }[] = [
  { place: 'phare', scene: { kind: 'cloches' } },
  { place: 'filets', scene: { kind: 'filets', catch: 'crabes', count: 4 } },
  { place: 'ecluses', scene: { kind: 'echelle', n: 24, d: 12 } },
  { place: 'ecluses', scene: { kind: 'sas', n: 12, d: 12 } },
  // Deux rives : deux sas de dix parts (le générateur s'arrête à dix) ; le sas au repos des autres missions (lot L2).
  { place: 'ecluses', scene: { kind: 'lockPair', a: [10, 10], b: [10, 10] } },
  { place: 'ecluses', scene: { kind: 'lockIdle' } },
  { place: 'quais', scene: { kind: 'quai', op: 'moitie', before: 98, after: 49 } },
  { place: 'quais', scene: { kind: 'quai', op: 'double', before: 49, after: 98 } },
  // Les Marais salants (lot L5) : la jauge du bassin (dix graduations), et le bassin au repos des autres missions.
  { place: 'saltworks', scene: { kind: 'jauge', start: 9, d: 10, n: 9 } },
  { place: 'saltworks', scene: { kind: 'saline' } },
  // La Turbine (lot L6a) : le C neutre, la soupape levée et sa bouffée (aucun objet de réponse).
  { place: 'engine', scene: { kind: 'column' } },
  // Le Chantier naval (lot L6b) : le C neutre, les tréteaux et la planche de bordé plaquée contre la coque.
  { place: 'shipyard', scene: { kind: 'column' } },
  // Le rivage nord (lot L7) : le C de la Vigie et son volet ouvert, puis chaque lieu au repos (ses objets de réponse).
  { place: 'lookout', scene: { kind: 'column' } },
  { place: 'lookout', scene: { kind: 'rest' } },
  { place: 'archives', scene: { kind: 'rest' } },
  { place: 'printworks', scene: { kind: 'rest' } },
  // La Mangrove (lot L8a) : le C neutre, la pirogue qui glisse jusqu'au platelage.
  { place: 'mangrove', scene: { kind: 'column' } },
  // Les Ruines (lot L8b) : le C neutre, le seau du treuil de fouille qui remonte.
  { place: 'ruins', scene: { kind: 'column' } },
  // L'Observatoire (lot L8c) : le C neutre, la baie aux volets ouverts sur sa vitre.
  { place: 'observatory', scene: { kind: 'column' } },
  // La Halle (lot L8d) : le C neutre, la borne-fontaine, son filet et l'eau de son auge.
  { place: 'commons', scene: { kind: 'column' } },
  // Le large (lot L9) : la bouée témoin et son voyant, les bouées et le voyant marqué ; la malle témoin qui se ferme, les
  // malles et le couvercle rabattu.
  { place: 'beacons', scene: { kind: 'column' } },
  { place: 'beacons', scene: { kind: 'restMark' } },
  { place: 'ferry', scene: { kind: 'column' } },
  { place: 'ferry', scene: { kind: 'restMark' } },
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
    // Au Phare, les cloches pendues à leur poutre, toutes balancées, et la corde de sonnerie.
    const hang = place === 'phare' ? { hand: habitantHand(place), rail: bellPlane(place).rail } : undefined;
    const objects = answerObjects(place, points, 1, { picked: [0, 1, 2, 3, 4, 5], hanging: hang });
    triangles = Math.max(triangles, item.still.triangles + objects.triangles + (item.reaction?.facets.triangles ?? 0));
  }
  return { triangles, calls: 2 };
}

/**
 * Une scénette (lot 2, le Phare ; lot 3, les Quais ; lot 4, les Filets et les Écluses ; lot L5, les Marais salants ; lot
 * L6a, la Turbine), la plus chargée : le décor de près (la galerie, sa rambarde, la gardienne ; le docker ; le plancher
 * de séchage et la pêcheuse ; le quai du sas, son canal, sa porte et l'éclusier ; le bord du bassin et la saunière ; le
 * dallage et la machiniste), un maillage fait à
 * l'arrivée et libéré au départ, du matériau du terrain, au plus fort de la réussite. L'objet de la réussite et sa
 * lumière passent par le maillage de la réaction (la réaction de l'item cède sa place à l'objet qui va se poser, puis à
 * la lumière ; au Phare, rien : les cloches s'effacent) : leurs triangles comptent ici, pas leur appel. Kéo y reste,
 * sans son anneau (son appel est compté quand même : le pire cas). L'habitant est son modèle 3D (`pawnTriangles`), un
 * appel à lui. L'équipier qui guide le lieu (GD-23, lot 1, ./equipage.ts), à côté de Kéo, au plus `EQUIPIER_TRIANGLES`,
 * dans son maillage à part, de son matériau texturé : un appel de plus, compté partout (le pire cas).
 */
function scenetteCost(): { triangles: number; calls: number } {
  // La scénette d'assemblage de l'Escale (GD-20, lot 2) passe par le maillage de la réaction : les pièces, puis le bloc.
  const assembly = assemblyScene(PORT_WORST);
  const guide = (p: PlaceId) => (guideOf(p) ? EQUIPIER_TRIANGLES + GUIDE_SHADOW_TRIANGLES : 0);
  const triangles = Math.max(...SCENETTE_PLACES.map((p) => Math.max(scenetteDecor(p).triangles, successTriangles(p)) - pawnTriangles(p) + HABITANT_TRIANGLES + guide(p)), assembly.pieces.triangles, assembly.made.triangles);
  return { triangles, calls: 3 };
}

/**
 * Le corps du pion d'un lieu, que son modèle 3D remplace (./habitants.ts, choix du mainteneur du 18 octobre 2026) : le
 * décor de près avec lui, moins le décor sans lui. Le modèle est compté à sa place, au plus (`HABITANT_TRIANGLES`), dans
 * un maillage à part, de son matériau texturé : un appel de plus que le décor.
 */
function pawnTriangles(place: PlaceId): number {
  return scenetteDecor(place).triangles - scenetteSetting(place).triangles;
}

/** La scène d'item la plus chargée d'un lieu à scénette posée (celle que la réussite reprend). */
const FINALE_SCENES: Partial<Record<PlaceId, ItemScene>> = {
  quais: { kind: 'quai', op: 'moitie', before: 98, after: 49 },
  filets: { kind: 'filets', catch: 'crabes', count: 4 },
  ecluses: { kind: 'echelle', n: 24, d: 12 },
};

/**
 * La scénette à sa réussite : au Phare, le décor seul (la lanterne s'allume avec son haut, jamais à une réussite) ; ailleurs, le décor changé, l'objet posé et la lumière
 * (la caisse dans la barque et la lanterne de proue des Quais ; le panier plein et le filet tendu des Filets ; le sas
 * rempli, la porte ouverte et la barque passée des Écluses).
 */
function successTriangles(place: PlaceId): number {
  const scene = FINALE_SCENES[place];
  // Aux Filets, la réussite du Troupeau, la seule qui change le décor (le filet raccommodé et le panier plein).
  const f = scene ? scenetteFinale(place, scene, 1, true, 'plurals') : null;
  if (!f) return scenetteDecor(place).triangles;
  return f.decor.triangles + f.landed.triangles + Math.max(f.moving.triangles, f.glow?.triangles ?? 0);
}

/**
 * Les lieux qui ont leur scénette : tous, le Phare (lot 2), les Quais (lot 3), les Filets et les Écluses (lot 4), les
 * Marais salants (lot L5), la Turbine (lot L6a).
 */
const SCENETTE_PLACES: readonly PlaceId[] = PLACES.map((p) => p.id);

/**
 * Les lieux (GD-20, lot 1) : tous les lieux entiers (leur ruine et leurs trois étapes : chaque lieu se rebâtit
 * lui-même ; ce qui était tombé, relevé) et les traces de toutes leurs scénettes (aux Quais, une par mission, GD-20,
 * point 8), réunis en un maillage, refait à chaque pose (jamais par image), avec la lumière de la lanterne du Phare
 * allumée (sa couleur dessinée sans ombre, dans le même matériau) ; le lieu suivi, seul hors de la brume, dans un
 * second (son matériau sans brouillard). Deux appels, quel que soit le nombre de lieux. L'Escale y entre (GD-20, lot 2),
 * au plus chargé : toutes les places de sa galerie prises, ses portes pavoisées, ses barques, sa pile pleine
 * (`PORT_WORST`) ; aucun appel de plus. Le Rafiot des Ferrailleurs à quai (GD-23, lot 2 ; GD-27, lot 3 : rafiot6e.ts),
 * tant qu'un lieu qui l'amarre est éteint, dans le même maillage.
 */
function placesCost(): { triangles: number; calls: number } {
  const triangles = PLACES.reduce((s, p) => s + modelOfPlace(p.id).facets.triangles + placeTrace(p.id, [...p.scenes, ...(p.panels ?? [])]).triangles, 0);
  return { triangles: triangles + lanternLight().triangles + portFacets(PORT_WORST).triangles + bridgesCost() + (rafiot6eFacets(() => false)?.triangles ?? 0), calls: 2 };
}

/**
 * Les ponts des terres (GD-20, point 3, « vraies terres, vrais ponts ») : chacun au plus chargé de ses deux états (tombé,
 * ou rebâti), dans le maillage des lieux : aucun appel de plus.
 */
function bridgesCost(): number {
  return LINKED_LANDS_6E.reduce((s, l) => s + Math.max(bridgeFacets(l, false).triangles, bridgeFacets(l, true).triangles), 0);
}

/**
 * La Nef du monde continu (GD-21) : le voilier entier, voile hissée, et son ber dans le maillage des lieux ; le banc du
 * large dans celui du lieu suivi (hors de la brume du lointain) : aucun appel de plus. Pendant l'arrivée d'un temps (la
 * partie qui descend) et pendant le départ (la Nef et le banc qui s'en vont), un ou deux maillages à part, jamais en même
 * temps qu'une question, une scénette ou une pose, plus chargées : comptés dans leurs appels.
 */
function nefCost(): { triangles: number; calls: number } {
  const site = nefSiteTriangles();
  return { triangles: NEF_MODEL_TRIANGLES + site.ber + site.banc, calls: 0 };
}

/** L'Escale seule, au plus chargé : son plafond (4 500 triangles, directeur artistique, GD-20, lot 2). */
export const PORT_BUDGET = 4500;

/**
 * Le passage d'une pose : la partie qui arrive, un maillage à part le temps qu'elle descende à sa place (moins d'une
 * seconde), puis réunie aux lieux. Compté large : la plus grande construction entière, sans sa ruine (une partie en
 * pose au plus une étape et demie), et ses triangles en plus de ceux des lieux. La pose d'un pont (GD-20, point 3, « La
 * pose ») passe par le même maillage, jamais en même temps : ce qui se relève du pont (ses piles, son tablier, ses
 * garde-corps et ses lanternes), les lieux n'en gardant que ses culées et ses départs d'arche.
 */
function poseCost(ground: (x: number, z: number) => number): { triangles: number; calls: number } {
  const places = Math.max(...PLACES.map((p) => constructionFacets(p.id, [WHOLE], ground).triangles));
  const bridges = Math.max(...LINKED_LANDS_6E.map((l) => bridgeLay(l).facets.triangles));
  return { triangles: Math.max(places, bridges), calls: 1 };
}

/** L'écart entre deux points où l'on cherche le pire sol : Kéo se tient toujours sur le réseau des chemins. */
const SAMPLE_STEP = 4;
/** La caméra tourne autour de Kéo (GD-20, rotation libre) : le sol est compté dans tant de directions. */
const SAMPLE_YAWS = 8;

/**
 * Le sol, environ : les deux anneaux de tuiles (un maillage chacun) autour des points du réseau pris tous les quatre
 * unités, la caméra tournée dans huit directions, le plus chargé de près et le plus chargé de loin (ils peuvent venir de deux points différents : on compte
 * large).
 */
export function groundCost(): { triangles: number; calls: number; near: number; far: number } {
  const field = buildHeightField();
  const near = landTileCounts(field, 'near');
  const far = landTileCounts(field, 'far');
  let worstNear = 0;
  let worstFar = 0;
  for (const p of networkSamples(SAMPLE_STEP))
    for (let y = 0; y < SAMPLE_YAWS; y++) {
      const rings = tileRings(p, WORLD_FOG.far, (2 * Math.PI * y) / SAMPLE_YAWS);
      worstNear = Math.max(worstNear, rings.near.reduce((s, t) => s + near[t], 0));
      worstFar = Math.max(worstFar, rings.far.reduce((s, t) => s + far[t], 0));
    }
  return { triangles: worstNear + worstFar, calls: 2, near: worstNear, far: worstFar };
}

/**
 * Ce que coûte le monde continu, environ (avec les triangles des aménagements posés, que la vue compte) : le sol autour de Kéo, tout le reste visible à la fois ; la brume des terres
 * fermées, au pire (au départ, les quatre), en un maillage : quand on relie une terre, la sienne se lève en fondu après
 * la pose de son pont (sa transparence seule change : aucun triangle de plus). `scenette` : le pire, une scénette ouverte
 * et une pose ensemble ; `monde` : hors scénette, les habitants près de leur porte à la place de la question et du décor
 * de près.
 */
export function openWorldCost(amenagements: number, view: 'scenette' | 'monde' = 'scenette'): OpenWorldCost[] {
  const field = buildHeightField();
  const height = (x: number, z: number) => heightOnMesh(field, x, z);
  const paths = pathRibbons(height);
  const ground = groundCost();
  return [
    { poste: 'ciel', ...SKY },
    { poste: 'sol', triangles: ground.triangles, calls: ground.calls },
    { poste: 'mer', triangles: 2, calls: 1 },
    { poste: 'chemins', triangles: paths.triangles, calls: 1 },
    { poste: 'lieux', ...placesCost() },
    // Les aménagements (GD-20, point 4, lot L0) : les dix-neuf posés, dans le maillage des lieux, aucun appel de plus ;
    // leurs triangles comptés par la vue, qui trace leurs dessins (three/archipeo/amenagements.ts, `amenagementsCost`).
    { poste: 'aménagements', triangles: amenagements, calls: 0 },
    // Les Détours (GD-20, déplacement libre, lot 2) : leurs pierres, le cairn allumé et toutes les sentes tracées, au pire,
    // dans le maillage des lieux, aucun appel de plus ; la baleine et les oiseaux du bord d'eau, un maillage, montré
    // seulement près du bord d'eau.
    { poste: 'détours', triangles: detourTrianglesAtMost(), calls: 0 },
    { poste: 'faune', ...FAUNA_COST },
    { poste: 'pose', ...poseCost(height) },
    { poste: 'brume', triangles: veilFacets(LINKED_LANDS_6E).triangles, calls: 1 },
    { poste: 'kéo', ...KEO },
    // Pendant une scénette, la question et le décor de près ; hors scénette (`monde`), les habitants près de leur porte
    // à leur place (choix du mainteneur, 23 octobre 2026), cachés pendant une scénette.
    ...(view === 'monde'
      ? [{ poste: 'habitants' as const, ...worldHabitantsCost('6e') }]
      : [
          { poste: 'question' as const, ...questionCost() },
          { poste: 'scénette' as const, ...scenetteCost() },
        ]),
    { poste: 'nef', ...nefCost() },
  ];
}

/**
 * La Carte des lieux ouverts (lot 3), le pire (les aménagements posés compris, comptés par la vue) : le ciel, toute l'île de loin dans l'anneau de loin (celui de près vidé), la mer,
 * les chemins, les lieux (sur la Carte, aucun n'est hors de la brume : un seul maillage, mais compté à deux appels, le
 * pire ; les ponts y ont en plus leur trait double), la brume des terres fermées, Kéo. Ni question, ni scénette, ni pose n'y
 * sont ouvertes : elle ne s'ouvre pas pendant une question, et l'ouvrir finit la pose.
 */
export function mapCost(amenagements: number): { triangles: number; calls: number } {
  const field = buildHeightField();
  const height = (x: number, z: number) => heightOnMesh(field, x, z);
  const far = landTileCounts(field, 'far').reduce((s, n) => s + n, 0);
  const paths = pathRibbons(height).triangles;
  const places = placesCost();
  const veil = veilFacets(LINKED_LANDS_6E).triangles;
  const marks = LINKED_LANDS_6E.reduce((s, l) => s + bridgeMapMark(l).triangles, 0);
  // Les Détours, leurs sentes tracées comprises, dans le maillage des lieux ; la baleine et les oiseaux, au bord d'eau.
  const detours = detourTrianglesAtMost();
  return {
    triangles: SKY.triangles + far + 2 + paths + places.triangles + amenagements + detours + FAUNA_COST.triangles + marks + veil + KEO.triangles + nefCost().triangles,
    calls: SKY.calls + 1 + 1 + 1 + places.calls + FAUNA_COST.calls + 1 + KEO.calls,
  };
}

// ---------- Le 5e (GD-22, lot 2) ----------

/** Le plan du 5e et ses terres qu'on relie (deux ponts et la cabine). */
const PLAN_5E = planFor('5e');
const LINKED_LANDS_5E = linkedLands(PLAN_5E);

/** Le poste de la brume des failles du 5e (./mist5e.ts) : un maillage transparent, caché sur la Carte. */
export type OpenWorldCost5e = Omit<OpenWorldCost, 'poste'> & { poste: OpenWorldCost['poste'] | 'failles' | 'départ' };

/**
 * Les habitants hors de leur scénette, près de leur porte (choix du mainteneur du 23 octobre 2026 : en modèle 3D, aux
 * quatre niveaux ; ./worldHabitants.ts) : la version de loin de chaque lieu fini, au plus `WORLD_HABITANT_TRIANGLES`
 * chacune, tous à la fois, dans un maillage à part, sous une seule texture par niveau (un appel). Ni sur la Carte, ni
 * pendant une scénette : le monde hors scénette et le départ seuls les comptent.
 */
export function worldHabitantsCost(level: OpenWorldLevel): { triangles: number; calls: number } {
  const count = planFor(level).places.filter((p) => hasWorldHabitant(p.id)).length;
  return { triangles: count * WORLD_HABITANT_TRIANGLES, calls: count ? 1 : 0 };
}

/** Le sol du 5e, compté comme celui du 6e (`groundCost`) : autour des points de son réseau, dans huit directions. */
function groundCost5e(): { triangles: number; calls: number; near: number; far: number } {
  const field = buildHeightField5e();
  const near = tileCounts5e(field, 'near');
  const far = tileCounts5e(field, 'far');
  let worstNear = 0;
  let worstFar = 0;
  for (const p of NETWORK_5E.networkSamples(SAMPLE_STEP))
    for (let y = 0; y < SAMPLE_YAWS; y++) {
      const rings = tileRings(p, WORLD_FOG.far, (2 * Math.PI * y) / SAMPLE_YAWS, TERRAIN_5E);
      worstNear = Math.max(worstNear, rings.near.reduce((s, t) => s + near[t], 0));
      worstFar = Math.max(worstFar, rings.far.reduce((s, t) => s + far[t], 0));
    }
  return { triangles: worstNear + worstFar, calls: 2, near: worstNear, far: worstFar };
}

/**
 * Les lieux du 5e : les treize ruines, la Montée entière (sa ruine et ses trois étapes, lot 3) et les traces de ses cinq
 * missions, et ses passages, chacun au plus chargé de ses deux états (tombé, ou relevé), en deux maillages comme au 6e.
 */
function placesCost5e(): { triangles: number; calls: number } {
  const ruins = PLAN_5E.places.reduce((s, p) => s + modelOfPlace(p.id).facets.triangles + (p.scenes.length ? placeTrace(p.id, p.scenes).triangles : 0), 0);
  const passages = LINKED_LANDS_5E.reduce((s, l) => s + Math.max(bridgeFacets(l, false).triangles, bridgeFacets(l, true).triangles), 0);
  return { triangles: ruins + passages + lisiereCost(), calls: 2 };
}

/**
 * Ce que les lieux du 5e posent hors de leur emprise (`PlaceArt.reach`, GD-22, lot 16 : les deux câbles des Nacelles, tout
 * posé), dans le maillage des lieux du monde, sans appel de plus ; la Carte ne les dessine pas.
 */
export function reachCost5e(): number {
  const origin = { x: 0, y: 0, z: 0 };
  return PLAN_5E.places.reduce((s, p) => s + (placeArt(p.id)?.reach?.(origin, () => true)?.triangles ?? 0), 0);
}

/**
 * La Lisière (lot 4), au plus chargée comme l'Escale (`PORT_WORST` : la galerie pleine, les portes pavoisées, la
 * lanterne, les habitants, les barques, la pile pleine), avec son décor (la graine géante, la lumière du Phare), dans le
 * maillage des lieux : aucun appel de plus.
 */
export function lisiereCost(): number {
  return portFacets(PORT_WORST, { assembling: false }, LISIERE_SITE).triangles + lisiereDecorFacets().triangles;
}

/**
 * Le dirigeable du 5e (lot 4) : le modèle entier, son ber et le gréement plié au plus, le mur de nuages et le panache,
 * dans le maillage des lieux, aucun appel de plus ; pendant le départ, la Nef et le mur passent chacun dans un maillage
 * à part (`departureCost5e`).
 */
function nefCost5e(): { triangles: number; calls: number } {
  const site = nef5eSiteTriangles();
  return { triangles: NEF_5E_MODEL_TRIANGLES + site.ber + site.wall + site.plume, calls: 0 };
}

/**
 * Le maillage de la pose au 5e, au plus chargé : un passage qui se relève, une partie de la Montée qui descend, la caisse
 * de la cabine qui roule (lot 3) ou la lueur de la Montée restaurée. Un appel.
 */
function poseCost5e(): { triangles: number; calls: number } {
  const field = buildHeightField5e();
  const ground = (x: number, z: number) => groundOn5e(field, x, z);
  const lays = Math.max(...LINKED_LANDS_5E.map((l) => (isCabin(l) ? bridgeFacets(l, true).triangles : bridgeLay(l).facets.triangles)));
  const parts = Math.max(...PLAN_5E.places.filter((p) => p.scenes.length).map((p) => constructionFacets(p.id, [WHOLE], ground).triangles));
  const car = Math.max(...LINKED_LANDS_5E.filter(isCabin).map((l) => cabinCarFacets(l).triangles));
  return { triangles: Math.max(lays, parts, car, monteeGlowBand().triangles), calls: 1 };
}

/**
 * Une question du 5e, au pire (lot 3, la Montée) : le lieu au repos et six godets choisis, dans un maillage, et la
 * réaction dans un autre ; deux appels.
 */
function questionCost5e(): { triangles: number; calls: number } {
  let triangles = 0;
  for (const p of PLAN_5E.places.filter((q) => q.scenes.length)) {
    const s = sceneSpot(p.id);
    const points = Array.from({ length: 6 }, (_, i) => ({ x: s.x - 5 + 2 * i, y: s.y, z: s.z + 6 }));
    const item = itemScene(p.id, { kind: 'rest' }, true, points, 1);
    const objects = answerObjects(scenePlace(p.id), points, 1, { picked: [0, 1, 2, 3, 4, 5] });
    triangles = Math.max(triangles, item.still.triangles + objects.triangles + (item.reaction?.facets.triangles ?? 0));
  }
  return { triangles, calls: 2 };
}

/**
 * La scénette du 5e, la plus chargée (lot 3, la Montée ; lot 5, le Hameau) : son décor de près, abords et ombres compris,
 * dans un maillage (un appel) ; l'habitant en modèle 3D (./habitants.ts, `hasHabitantModel` : le boulanger et la
 * fontainière, lot 5) à la place de son pion, au plus `HABITANT_TRIANGLES_5E`, dans un maillage à part, de son matériau
 * texturé : un appel de plus. Deux scénettes ne s'ouvrent jamais ensemble : la plus chargée compte seule.
 */
function scenetteCost5e(): { triangles: number; calls: number } {
  const places = PLAN_5E.places.filter((p) => p.scenes.length).map((p) => scenePlace(p.id));
  const decor = (place: ScenePlaceId, open: boolean) => {
    const full = scenetteDecor(place, open).triangles;
    return hasHabitantModel(place) ? scenetteSetting(place, open).triangles + HABITANT_TRIANGLES_5E : full;
  };
  const worst = Math.max(...places.map((p) => Math.max(decor(p, false), decor(p, true))));
  // La scénette d'assemblage de la Lisière (lot 4), jamais en même temps qu'une autre : les pièces, puis le bloc.
  const assembly = assemblyScene(PORT_WORST, LISIERE_SITE);
  return { triangles: Math.max(worst, assembly.pieces.triangles, assembly.made.triangles), calls: places.some(hasHabitantModel) ? 2 : 1 };
}

/**
 * Ce que coûte le monde ouvert du 5e (lot 2 : toute l'île en grandes masses ; lot 3 : la Montée finie) : le ciel, le sol
 * et sa forêt, la mer, les chemins, les lieux et leurs passages, la brume des terres fermées (au départ, les trois), la
 * brume des failles, Kéo ; puis, selon `view` : la scénette ouverte (`scenette`, le pire : la question et le décor de
 * près de la Montée) ou le monde hors scénette (`monde` : le maillage de la pose, une partie qui descend, un passage qui
 * se relève, la caisse qui roule). Les deux ne se montrent jamais ensemble : une question finit toute pose
 * (three/archipeo/scene.ts, `askQuestion`), et aucune pose ne commence pendant une question (`setPlaces`). Le dirigeable
 * (lot 4) et la Lisière vont dans le maillage des lieux ; pendant le départ (`depart`), la Nef et le mur de nuages
 * passent dans deux maillages à part, le maillage de la pose fermé (`startNefTrip`), ni question ni scénette ouverte.
 * La faune de chaque terre (./wildlife5e.ts), un maillage. Les Détours du 5e, le Creux (lot 6, ./creux5e.ts), la Hutte
 * (lot 8, ./hutte5e.ts), la Faille (lot 11, ./faille5e.ts) et le Perchoir (lot 16, ./perchoir5e.ts), leurs sentes tracées
 * comprises, dans le maillage des lieux ; pas encore d'aménagements. Les câbles des Nacelles (lot 16, `reachCost5e`) vont
 * avec les lieux. Hors scénette et au départ, les habitants près de leur porte (`worldHabitantsCost`), dans un
 * maillage à part ; cachés pendant une scénette.
 */
export function openWorldCost5e(view: 'scenette' | 'monde' | 'depart' = 'scenette'): OpenWorldCost5e[] {
  const field = buildHeightField5e();
  const ground = groundCost5e();
  const paths = pathRibbons5e((x, z) => groundOn5e(field, x, z));
  const places = placesCost5e();
  return [
    { poste: 'ciel', ...SKY },
    { poste: 'sol', triangles: ground.triangles, calls: ground.calls },
    { poste: 'mer', triangles: 2, calls: 1 },
    { poste: 'chemins', triangles: paths.triangles, calls: 1 },
    { poste: 'lieux', triangles: places.triangles + reachCost5e(), calls: places.calls },
    { poste: 'brume', triangles: veilFacets(LINKED_LANDS_5E).triangles, calls: 1 },
    { poste: 'failles', triangles: riftMistFacets().triangles, calls: 1 },
    // Le Creux (lot 6), la Hutte (lot 8), la Faille (lot 11) et le Perchoir (lot 16), leurs sentes tracées, dans le maillage des lieux : aucun
    // appel de plus.
    { poste: 'détours', triangles: creuxTriangles().withSente + hutteFacets(true, (x, z) => groundOn5e(field, x, z)).triangles + failleTriangles().withSente + perchoirTriangles().withSente, calls: 0 },
    // La vie animale du 5e (piste « Ambiance par terre », 19 octobre 2026, ./wildlife5e.ts) : toutes les bêtes à la fois,
    // un maillage (celui de la baleine au 6e).
    { poste: 'faune', triangles: groupsTriangles(wildlifeGroups5e(), allCritterForms()), calls: 1 },
    { poste: 'kéo', ...KEO },
    { poste: 'nef', ...nefCost5e() },
    ...(view === 'depart'
      ? [{ poste: 'départ' as const, triangles: 0, calls: 2 }, { poste: 'habitants' as const, ...worldHabitantsCost('5e') }]
      : view === 'monde'
      ? [{ poste: 'pose' as const, ...poseCost5e() }, { poste: 'habitants' as const, ...worldHabitantsCost('5e') }]
      : [
          { poste: 'question' as const, ...questionCost5e() },
          { poste: 'scénette' as const, ...scenetteCost5e() },
        ]),
  ];
}

/**
 * La Carte du 5e, en un seul plan : le ciel, toute l'île de loin, la mer, les chemins, les lieux (deux appels, le pire),
 * le trait double des ponts et de la cabine, la ligne de la falaise et la bande sombre des chemins (dans le maillage des
 * lieux), le Creux, la Hutte et leurs sentes (dans le même maillage), la brume des terres fermées, Kéo ; jamais la brume
 * des failles.
 */
export function mapCost5e(): { triangles: number; calls: number } {
  const field = buildHeightField5e();
  const far = tileCounts5e(field, 'far').reduce((s, n) => s + n, 0);
  const ground = (x: number, z: number) => groundOn5e(field, x, z);
  const paths = pathRibbons5e(ground).triangles;
  const places = placesCost5e();
  const marks = LINKED_LANDS_5E.reduce((s, l) => s + bridgeMapMark(l).triangles, 0) + cliffMapLine().triangles + pathMapEdges5e(ground, CLIFF_MAP_COLORS.dark).triangles;
  const veil = veilFacets(LINKED_LANDS_5E).triangles;
  // Le repère des lieux de loin, sur la Carte seulement (les Radeaux : le dessus des radeaux, éclairci), au plus chargé.
  const origin = { x: 0, y: 0, z: 0 };
  const placeMarks = PLAN_5E.places.reduce((s, p) => {
    const mark = placeArt(p.id)?.mapMark;
    return s + (mark ? Math.max(mark(origin, () => true).triangles, mark(origin, () => false).triangles) : 0);
  }, 0);
  const hutte = hutteFacets(true, ground).triangles;
  return {
    triangles: SKY.triangles + far + 2 + paths + places.triangles + creuxTriangles().withSente + hutte + failleTriangles().withSente + perchoirTriangles().withSente + marks + placeMarks + veil + KEO.triangles + nefCost5e().triangles,
    calls: SKY.calls + 1 + 1 + 1 + places.calls + 1 + KEO.calls,
  };
}

// ---------- Le 4e (lot 1 du monde ouvert du 4e ; lot 2 : la Forge) ----------

/** Le plan du 4e et ses terres qu'on relie (trois ponts). */
const PLAN_4E = planFor('4e');
const LINKED_LANDS_4E = linkedLands(PLAN_4E);

/** Le poste du départ du 4e : la Nef dans son maillage à part. */
export type OpenWorldCost4e = Omit<OpenWorldCost, 'poste'> & { poste: OpenWorldCost['poste'] | 'départ' | 'vue finale' };

/** Le sol du 4e, compté comme celui du 6e et du 5e : autour des points de son réseau, dans huit directions. */
function groundCost4e(): { triangles: number; calls: number; near: number; far: number } {
  const field = buildHeightField4e();
  const near = tileCounts4e(field, 'near');
  const far = tileCounts4e(field, 'far');
  let worstNear = 0;
  let worstFar = 0;
  for (const p of NETWORK_4E.networkSamples(SAMPLE_STEP))
    for (let y = 0; y < SAMPLE_YAWS; y++) {
      const rings = tileRings(p, FOG_4E.far, (2 * Math.PI * y) / SAMPLE_YAWS, TERRAIN_4E);
      worstNear = Math.max(worstNear, rings.near.reduce((s, t) => s + near[t], 0));
      worstFar = Math.max(worstFar, rings.far.reduce((s, t) => s + far[t], 0));
    }
  return { triangles: worstNear + worstFar, calls: 2, near: worstNear, far: worstFar };
}

/**
 * La Crique au plus chargée (comme l'Escale, `PORT_WORST` ; lot 4 : sa brique, ses joints, ses chaînes d'angle et ses
 * bittes) et son décor (le volcan de loin, sa lave figée, son panache ; la digue, le Rafiot et ses bronzes, les
 * Aiguilles), dans le maillage des lieux : aucun appel de plus.
 */
function criqueCost(): number {
  return portFacets(PORT_WORST, { assembling: false }, CRIQUE_SITE).triangles + criqueDecorFacets().triangles;
}

/**
 * Les lieux du 4e : les ruines, la Forge entière (sa ruine et ses trois étapes, lot 2) et les traces de ses cinq
 * missions, leurs trois ponts au plus chargé de leurs deux états, la Crique ; deux maillages.
 */
function placesCost4e(): { triangles: number; calls: number } {
  const ruins = PLAN_4E.places.reduce((s, p) => s + modelOfPlace(p.id).facets.triangles + (p.scenes.length ? placeTrace(p.id, p.scenes).triangles : 0), 0);
  const passages = LINKED_LANDS_4E.reduce((s, l) => s + Math.max(bridgeFacets(l, false).triangles, bridgeFacets(l, true).triangles), 0);
  return { triangles: ruins + passages + criqueCost(), calls: 2 };
}

/**
 * L'aéronef du 4e (lot 4), comme le dirigeable du 5e : le modèle entier sur son aire (dessinée avec les chemins), ses
 * pièces déposées au plus (ou la bouée), les îles du ciel, dans le maillage des lieux, aucun appel de plus ; pendant le
 * départ, l'aéronef et les îles passent chacun dans un maillage à part (le poste « départ »).
 */
function nefCost4e(): { triangles: number; calls: number } {
  const site = nef4eSiteTriangles();
  return { triangles: NEF_4E_MODEL_TRIANGLES + site.ber + site.islands, calls: 0 };
}

/**
 * Ce que les lieux du 4e posent hors de leur emprise (`PlaceArt.reach` : la vanne et les regards de la rigole de la
 * Forge, lot 2) et leur allumage à son état final (`PlaceArt.restoration` : les laves, la gueule), dans le maillage des
 * lieux du monde, sans appel de plus ; la Carte ne les dessine pas.
 */
export function reachCost4e(): number {
  const origin = { x: 0, y: 0, z: 0 };
  return PLAN_4E.places.reduce((s, p) => {
    const art = placeArt(p.id);
    return s + (art?.reach?.(origin, () => true)?.triangles ?? 0) + (art?.restoration?.draw(origin, Infinity).triangles ?? 0);
  }, 0);
}

/** L'allumage d'un lieu du 4e, au plus chargé de ses instants (pris tous les vingtièmes de seconde, comme la vue). */
function restorationCost4e(): number {
  const origin = { x: 0, y: 0, z: 0 };
  let worst = 0;
  for (const p of PLAN_4E.places) {
    const r = placeArt(p.id)?.restoration;
    if (r) for (let t = 0; t <= r.seconds + 1e-9; t += 0.05) worst = Math.max(worst, r.draw(origin, t).triangles);
  }
  return worst;
}

/**
 * La pose au 4e, au plus chargée : un pont qui se relève, une partie de la Forge qui descend (lot 2), ou son allumage
 * (dans le même maillage, après la pose). Un appel.
 */
function poseCost4e(): { triangles: number; calls: number } {
  const field = buildHeightField4e();
  const ground = (x: number, z: number) => groundOn4e(field, x, z);
  const lays = Math.max(...LINKED_LANDS_4E.map((l) => bridgeLay(l).facets.triangles));
  const parts = Math.max(0, ...PLAN_4E.places.filter((p) => p.scenes.length).map((p) => constructionFacets(p.id, [WHOLE], ground).triangles));
  return { triangles: Math.max(lays, parts, restorationCost4e()), calls: 1 };
}

/**
 * Une question du 4e, au pire (lot 2, la Forge) : le lieu au repos et six lingots choisis, dans un maillage, et la
 * réaction dans un autre ; deux appels.
 */
function questionCost4e(): { triangles: number; calls: number } {
  let triangles = 0;
  for (const p of PLAN_4E.places.filter((q) => q.scenes.length)) {
    const s = sceneSpot(p.id);
    const points = Array.from({ length: 6 }, (_, i) => ({ x: s.x - 5 + 2 * i, y: s.y, z: s.z + 6 }));
    const item = itemScene(p.id, { kind: 'rest' }, true, points, 1);
    const objects = answerObjects(scenePlace(p.id), points, 1, { picked: [0, 1, 2, 3, 4, 5] });
    triangles = Math.max(triangles, item.still.triangles + objects.triangles + (item.reaction?.facets.triangles ?? 0));
  }
  return { triangles, calls: 2 };
}

/**
 * La scénette du 4e, la plus chargée (lot 2, la Forge) : son décor de près, abords compris, dans un maillage ;
 * l'habitante en modèle 3D, au plus `HABITANT_TRIANGLES_4E`, dans un maillage à part : un appel de plus.
 */
function scenetteCost4e(): { triangles: number; calls: number } {
  const places = PLAN_4E.places.filter((p) => p.scenes.length).map((p) => scenePlace(p.id));
  const decor = (place: ScenePlaceId, open: boolean) => (hasHabitantModel(place) ? scenetteSetting(place, open).triangles + HABITANT_TRIANGLES_4E : scenetteDecor(place, open).triangles);
  const worst = Math.max(0, ...places.map((p) => Math.max(decor(p, false), decor(p, true))));
  return { triangles: worst, calls: places.some(hasHabitantModel) ? 2 : 1 };
}

/**
 * Ce que coûte le monde ouvert du 4e (lot 1 : l'île entière en grandes masses ; lot 2 : la Forge finie) : le ciel, le
 * sol et ses buissons, la mer, les chemins (les rails, la rigole couverte et la passerelle de l'aire compris), les lieux
 * et leurs ponts, la vanne et les regards de la Forge et son allumage final (`reachCost4e`), la Crique et son décor, la
 * brume des terres fermées (au départ, les trois), Kéo, l'aéronef ; puis, selon `view` : le monde (`monde`, la pose : un
 * pont qui se relève, une partie qui descend ou l'allumage), la scénette ouverte (`scenette`, la question et le décor de
 * près de la Forge, sa chaudronnière en modèle) ou le départ (`depart`, la Nef et l'obstacle dans deux maillages à part).
 * L'Épave (lot 2, ./epave4e.ts), le Recoin et la Dalle (lot 3, ./recoin4e.ts, ./dalle4e.ts) et le Replat (les Coteaux,
 * ./replat4e.ts), les Détours du 4e, et leurs sentes tracées, dans le maillage des lieux. Pas de faune encore.
 */
export function openWorldCost4e(view: 'monde' | 'scenette' | 'depart' = 'monde'): OpenWorldCost4e[] {
  const field = buildHeightField4e();
  const ground = groundCost4e();
  const paths = pathRibbons4e((x, z) => groundOn4e(field, x, z));
  const places = placesCost4e();
  return [
    { poste: 'ciel', ...SKY },
    { poste: 'sol', triangles: ground.triangles, calls: ground.calls },
    { poste: 'mer', triangles: 2, calls: 1 },
    { poste: 'chemins', triangles: paths.triangles, calls: 1 },
    { poste: 'lieux', ...places, triangles: places.triangles + reachCost4e() },
    { poste: 'brume', triangles: veilFacets(LINKED_LANDS_4E).triangles, calls: 1 },
    { poste: 'détours', triangles: detourCost4e(field), calls: 0 },
    { poste: 'kéo', ...KEO },
    { poste: 'nef', ...nefCost4e() },
    ...(view === 'depart'
      ? [{ poste: 'départ' as const, triangles: 0, calls: 2 }, { poste: 'habitants' as const, ...worldHabitantsCost('4e') }]
      : view === 'scenette'
      ? [
          { poste: 'question' as const, ...questionCost4e() },
          { poste: 'scénette' as const, ...scenetteCost4e() },
        ]
      : [{ poste: 'pose' as const, ...poseCost4e() }, { poste: 'habitants' as const, ...worldHabitantsCost('4e') }]),
  ];
}

/** Les Détours du 4e, leur sente tracée : l'Épave, le Recoin et la Dalle. */
function detourCost4e(field: ReturnType<typeof buildHeightField4e>): number {
  const ground = (x: number, z: number) => groundOn4e(field, x, z);
  return epaveFacets(true, ground).triangles + recoinFacets(true, ground).triangles + dalleFacets(true, ground).triangles + replatFacets(true, ground).triangles;
}

/**
 * La Carte du 4e, en un seul plan : le ciel, toute l'île de loin, la mer, les chemins, les lieux (deux appels, le pire),
 * le trait double des ponts, les hachures du sommet et le dessin des coupures (dans le maillage des lieux), l'Épave, le
 * Recoin, la Dalle, le Replat et leurs sentes, la brume des terres fermées, Kéo, l'aéronef sur son aire (sans les îles
 * du ciel).
 */
export function mapCost4e(): { triangles: number; calls: number } {
  const field = buildHeightField4e();
  const far = tileCounts4e(field, 'far').reduce((s, n) => s + n, 0);
  const paths = pathRibbons4e((x, z) => groundOn4e(field, x, z)).triangles;
  const places = placesCost4e();
  const marks = LINKED_LANDS_4E.reduce((s, l) => s + bridgeMapMark(l).triangles, 0) + mapOverlay4e().triangles;
  const veil = veilFacets(LINKED_LANDS_4E).triangles;
  const epave = detourCost4e(field);
  return {
    // L'aéronef et ses pièces, sans les îles du ciel : la Carte ne les dessine pas (`NefSite.offMap`).
    triangles: SKY.triangles + far + 2 + paths + places.triangles + epave + marks + veil + KEO.triangles + nefCost4e().triangles - nef4eSiteTriangles().islands,
    calls: SKY.calls + 1 + 1 + 1 + places.calls + 1 + KEO.calls,
  };
}

// ---------- Le 3e (lot 1 du monde ouvert du 3e, GD-25) ----------

/** Le plan du 3e et ses terres qu'on relie (trois passages). */
const PLAN_3E = planFor('3e');
const LINKED_LANDS_3E = linkedLands(PLAN_3E);

/** Le sol du 3e, compté comme celui des autres niveaux : autour des points de son réseau, dans huit directions. */
function groundCost3e(): { triangles: number; calls: number; near: number; far: number } {
  const field = buildHeightField3e();
  const near = tileCounts3e(field, 'near');
  const far = tileCounts3e(field, 'far');
  let worstNear = 0;
  let worstFar = 0;
  for (const p of NETWORK_3E.networkSamples(SAMPLE_STEP))
    for (let y = 0; y < SAMPLE_YAWS; y++) {
      const rings = tileRings(p, FOG_3E.far, (2 * Math.PI * y) / SAMPLE_YAWS, TERRAIN_3E);
      worstNear = Math.max(worstNear, rings.near.reduce((s, t) => s + near[t], 0));
      worstFar = Math.max(worstFar, rings.far.reduce((s, t) => s + far[t], 0));
    }
  return { triangles: worstNear + worstFar, calls: 2, near: worstNear, far: worstFar };
}

/**
 * Le Parvis au plus chargé (comme l'Escale, `PORT_WORST` ; sa place ronde et son muret, lot du Versant) et son décor (le
 * pic ; dans le monde, pas sur la Carte, le zeppelin des Ferrailleurs sur son rocher), les trois parures de l'aéronef
 * posées (le pire, avant que leur fiche ne les montre : GD-25), dans le maillage des lieux : aucun appel de plus.
 */
function parvisCost(onMap: boolean): number {
  return portFacets(PORT_WORST, { assembling: false }, PARVIS_SITE).triangles + parvisDecorFacets().triangles + nefParuresFacets(NEF_PARURES).triangles + (onMap ? 0 : zeppelinFacets().triangles);
}

/**
 * Les lieux du 3e : les seize ruines (un lieu construit, sa ruine et ses étapes, et les traces de ses missions : le
 * Belvédère, au lot du Versant), leurs trois passages au plus chargé de leurs deux états, le Parvis (sur la Carte,
 * `onMap`, sans le zeppelin) ; deux maillages.
 */
function placesCost3e(onMap = false): { triangles: number; calls: number } {
  const ruins = PLAN_3E.places.reduce((s, p) => s + modelOfPlace(p.id).facets.triangles + (p.scenes.length ? placeTrace(p.id, p.scenes).triangles : 0) + (onMap ? 0 : restorationCost3e(p.id)), 0);
  const passages = LINKED_LANDS_3E.reduce((s, l) => s + Math.max(bridgeFacets(l, false).triangles, bridgeFacets(l, true).triangles), 0);
  return { triangles: ruins + passages + parvisCost(onMap), calls: 2 };
}

/**
 * Ce qu'un lieu du 3e montre hors de son modèle, à son état le plus chargé : sa restauration (`PlaceArt.restoration` :
 * au Fanal, la fin des Ferrailleurs, les pièces de la gondole puis le râtelier, Grappin et la lumière de leur port) et ce
 * qu'il pose au-delà de son emprise (`PlaceArt.reach` : au Standard, la ligne des poteaux et leurs fils jusqu'au Fanal) ;
 * dans le monde seulement, jamais sur la Carte.
 */
function restorationCost3e(id: (typeof PLAN_3E.places)[number]['id']): number {
  const art = placeArt(id);
  const origin = { x: 0, y: 0, z: 0 };
  const shown = art?.restoration ? Math.max(art.restoration.draw(origin, 0).triangles, art.restoration.draw(origin, Infinity).triangles) : 0;
  const far = art?.reach ? Math.max(art.reach(origin, () => false)?.triangles ?? 0, art.reach(origin, () => true)?.triangles ?? 0) : 0;
  return shown + far;
}

/** La brume des terres fermées du 3e (au départ, les trois) : aucun voile retenu (retouche 1 du lot 1), aucun appel alors. */
function veilCost3e(): { triangles: number; calls: number } {
  const triangles = veilFacets(LINKED_LANDS_3E).triangles;
  return { triangles, calls: triangles ? 1 : 0 };
}

/** L'aéronef du 3e, le modèle du 4e entier (`3-aeronef/final-1464.glb`), sur son aire (dessinée avec les chemins) : dans le maillage des lieux. */
const nefCost3e = (): { triangles: number; calls: number } => ({ triangles: NEF_4E_MODEL_TRIANGLES, calls: 0 });

/** La pose au 3e : un passage qui se relève, ou une partie d'un lieu construit qui descend (le Versant). Un appel. */
function poseCost3e(): { triangles: number; calls: number } {
  const field = buildHeightField3e();
  const ground = ground3e(field);
  const lays = Math.max(...LINKED_LANDS_3E.map((l) => bridgeLay(l).facets.triangles));
  const parts = Math.max(0, ...PLAN_3E.places.filter((p) => p.scenes.length).map((p) => constructionFacets(p.id, [WHOLE], ground).triangles));
  return { triangles: Math.max(lays, parts), calls: 1 };
}

/**
 * Une question du 3e, au pire (le Versant) : le lieu au repos et six objets choisis, dans un maillage, et la réaction
 * dans un autre ; deux appels.
 */
function questionCost3e(): { triangles: number; calls: number } {
  let triangles = 0;
  for (const p of PLAN_3E.places.filter((q) => q.scenes.length)) {
    const s = sceneSpot(p.id);
    const points = Array.from({ length: 6 }, (_, i) => ({ x: s.x - 5 + 2 * i, y: s.y, z: s.z + 6 }));
    const item = itemScene(p.id, { kind: 'rest' }, true, points, 1);
    const objects = answerObjects(scenePlace(p.id), points, 1, { picked: [0, 1, 2, 3, 4, 5] });
    triangles = Math.max(triangles, item.still.triangles + objects.triangles + (item.reaction?.facets.triangles ?? 0));
  }
  return { triangles, calls: 2 };
}

/**
 * La scénette du 3e, la plus chargée : son décor de près, abords compris, dans un maillage ; l'habitant en modèle 3D
 * (`3e-habitant-<lieu>`, 23 octobre 2026), au plus `HABITANT_TRIANGLES_3E`, dans un maillage à part : un appel de plus.
 */
function scenetteCost3e(): { triangles: number; calls: number } {
  const places = PLAN_3E.places.filter((p) => p.scenes.length).map((p) => scenePlace(p.id));
  const decor = (place: ScenePlaceId, open: boolean) => (hasHabitantModel(place) ? scenetteSetting(place, open).triangles + HABITANT_TRIANGLES_3E : scenetteDecor(place, open).triangles);
  const worst = Math.max(0, ...places.map((p) => Math.max(decor(p, false), decor(p, true))));
  return { triangles: worst, calls: places.some(hasHabitantModel) ? 2 : 1 };
}

/**
 * Ce que coûte le monde ouvert du 3e (lot 1 : les Îles du Ciel en grandes masses) : le ciel, le sol et ses pins, la mer
 * de nuages (le plan de l'eau), les chemins (le liseré d'ardoise des rives, les deux petites arches et l'aire de la Nef
 * compris), les lieux et leurs passages, le Parvis et son décor, la brume des terres fermées (au départ, les trois),
 * Kéo, l'aéronef ; puis, selon `view` : le monde (`monde`, un passage qui se relève ou une partie qui descend), la
 * scénette ouverte (`scenette`, la question et le décor de près d'un lieu construit, l'habitant en modèle 3D) ou le départ
 * (`depart`, la Nef et l'obstacle dans deux maillages à part). Pas de faune.
 */
/**
 * Le monde ouvert du 3e : `scenette` (une question ouverte), `monde` (la pose à sa place), `depart` (l'aéronef qui part),
 * `finale` (la vue finale, GD-25 : les archipels au loin dans le maillage de la pose, à sa place ; ./finalView3e.ts).
 */
export function openWorldCost3e(view: 'monde' | 'scenette' | 'depart' | 'finale' = 'monde'): OpenWorldCost4e[] {
  const field = buildHeightField3e();
  const ground = groundCost3e();
  const paths = pathRibbons3e(ground3e(field));
  return [
    { poste: 'ciel', ...SKY },
    { poste: 'sol', triangles: ground.triangles, calls: ground.calls },
    { poste: 'mer', triangles: 2, calls: 1 },
    { poste: 'chemins', triangles: paths.triangles, calls: 1 },
    { poste: 'lieux', ...placesCost3e() },
    { poste: 'brume', ...veilCost3e() },
    { poste: 'détours', triangles: detourCost3e(field), calls: 0 },
    { poste: 'kéo', ...KEO },
    { poste: 'nef', ...nefCost3e() },
    ...(view === 'depart'
      ? [{ poste: 'départ' as const, triangles: 0, calls: 2 }, { poste: 'habitants' as const, ...worldHabitantsCost('3e') }]
      : view === 'finale'
      ? [{ poste: 'vue finale' as const, triangles: farArchipelagos3e().triangles, calls: 1 }, { poste: 'habitants' as const, ...worldHabitantsCost('3e') }]
      : view === 'scenette'
      ? [
          { poste: 'question' as const, ...questionCost3e() },
          { poste: 'scénette' as const, ...scenetteCost3e() },
        ]
      : [{ poste: 'pose' as const, ...poseCost3e() }, { poste: 'habitants' as const, ...worldHabitantsCost('3e') }]),
  ];
}

/** Les Détours du 3e, leur sente tracée : le Cadran (le Versant), la Bergerie (les Alpages), le Cèdre (les Prairies), le Lac (le Cirque). */
const detourCost3e = (field: ReturnType<typeof buildHeightField3e>): number => {
  const ground = ground3e(field);
  return cadranFacets(true, ground).triangles + bergerieFacets(true, ground).triangles + cedreFacets(true, ground).triangles + lacFacets(true, ground).triangles;
};

/**
 * La Carte du 3e, en un seul plan : le ciel, toutes les terres de loin, la mer de nuages, les chemins, les lieux (deux
 * appels, le pire), le trait double des passages, les hachures du pic et des arêtes et la bande de la langue de glace
 * (dans le maillage des lieux), le Cadran, la Bergerie, le Cèdre, le Lac et leur sente, la brume des terres fermées, Kéo.
 */
export function mapCost3e(): { triangles: number; calls: number } {
  const field = buildHeightField3e();
  const far = tileCounts3e(field, 'far').reduce((s, n) => s + n, 0);
  const paths = pathRibbons3e(ground3e(field)).triangles;
  const places = placesCost3e(true);
  const marks = LINKED_LANDS_3E.reduce((s, l) => s + bridgeMapMark(l).triangles, 0) + mapOverlay3e().triangles;
  const veil = veilCost3e();
  return {
    triangles: SKY.triangles + far + 2 + paths + places.triangles + detourCost3e(field) + marks + veil.triangles + KEO.triangles + nefCost3e().triangles,
    calls: SKY.calls + 1 + 1 + 1 + places.calls + veil.calls + KEO.calls,
  };
}
