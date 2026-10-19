// Le budget de dessin du monde continu (prototype du 6e), compté sans Three.js comme world/budget.ts le fait pour le
// monde en grille : les triangles et les appels de chaque poste. Estimé au cadrage : environ 45 000 triangles et 12 à
// 18 appels avec quatre lieux (prototype-6e.md, § 3) ; relevée par le mainteneur à 75 000 triangles le 16 octobre 2026
// (GD-20, L6b : « Un iPad 9e génération doit pouvoir faire tourner le jeu, donc on est large en triangles pour
// l'instant »), puis à 86 000 le 17 octobre 2026 (GD-20, point 3, lot 3), les appels inchangés, puis à 98 000 triangles et 21
// appels le 18 octobre 2026 pour les habitants en 3D (« on peut augmenter le budget », mesure sur iPad avant la fusion). Les images par seconde se mesurent sur l'iPad 9e génération (`?mesures`).
import { FAUNA, birdFacets, detourTrianglesAtMost, spoutFacets, whaleFacets } from './detours';
import { NEF_MODEL_TRIANGLES, nefSiteTriangles } from './nef';
import { WORLD_FOG } from './camera';
import { bridgeLay } from './bridgeLay';
import { bridgeFacets, bridgeMapMark, cabinCarFacets, isCabin } from './bridges';
import { monteeGlowBand } from './montee5e';
import { linkedLands } from './lands';
import { planFor, scenePlace } from './levelPlan';
import { networkSamples, pathRibbons } from './paths';
import { PLACES, type PlaceId } from './plan6e';
import { lanternLight, modelOfPlace } from './places';
import { constructionFacets, WHOLE } from './construction';
import { PORT_WORST, assemblyScene, portFacets } from './port';
import { answerObjects, itemScene, placeTrace, sceneSpot } from './questionScene';
import type { ItemScene } from './questions';
import { HABITANT_TRIANGLES } from './habitants';
import { bellPlane, habitantHand, scenetteDecor, scenetteFinale, scenetteSetting } from './scenette';
import { landTileCounts } from './flora';
import { buildHeightField, heightOnMesh, tileRings } from './terrain';
import { buildHeightField5e, groundOn5e, tileCounts5e } from './terrain5e';
import { NETWORK_5E, pathMapEdges5e, pathRibbons5e } from './paths5e';
import { TERRAIN_5E } from './plan5e';
import { CLIFF_MAP_COLORS, cliffMapLine, riftMistFacets } from './mist5e';
import { skyDome } from './sky';
import { veilFacets } from './veil';
import { wildlifeTriangles } from './wildlife';

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
 * L'enveloppe du monde ouvert : 100 140 triangles, 22 appels, relevée de 140 triangles pour les bêtes des côtes (piste
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
export const OPEN_WORLD_BUDGET = { triangles: 100_140, calls: 22 } as const;

export interface OpenWorldCost {
  poste: 'ciel' | 'sol' | 'mer' | 'chemins' | 'lieux' | 'aménagements' | 'détours' | 'faune' | 'pose' | 'brume' | 'kéo' | 'question' | 'scénette' | 'nef';
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
  { place: 'ecluses', scene: { kind: 'lockIdle', column: false } },
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
 * appel à lui.
 */
function scenetteCost(): { triangles: number; calls: number } {
  // La scénette d'assemblage de l'Escale (GD-20, lot 2) passe par le maillage de la réaction : les pièces, puis le bloc.
  const assembly = assemblyScene(PORT_WORST);
  const triangles = Math.max(...SCENETTE_PLACES.map((p) => Math.max(scenetteDecor(p).triangles, successTriangles(p)) - pawnTriangles(p) + HABITANT_TRIANGLES), assembly.pieces.triangles, assembly.made.triangles);
  return { triangles, calls: 2 };
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
 * (`PORT_WORST`) ; aucun appel de plus.
 */
function placesCost(): { triangles: number; calls: number } {
  const triangles = PLACES.reduce((s, p) => s + modelOfPlace(p.id).facets.triangles + placeTrace(p.id, [...p.scenes, ...(p.panels ?? [])]).triangles, 0);
  return { triangles: triangles + lanternLight().triangles + portFacets(PORT_WORST).triangles + bridgesCost(), calls: 2 };
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
 * la pose de son pont (sa transparence seule change : aucun triangle de plus).
 */
export function openWorldCost(amenagements: number): OpenWorldCost[] {
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
    { poste: 'question', ...questionCost() },
    { poste: 'scénette', ...scenetteCost() },
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
export type OpenWorldCost5e = Omit<OpenWorldCost, 'poste'> & { poste: OpenWorldCost['poste'] | 'failles' };

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
  return { triangles: ruins + passages, calls: 2 };
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
 * La scénette du 5e (lot 3, la Montée) : son décor de près, abords et ombres compris, avec la fontainière en pion dessiné
 * par le code, dans un seul maillage (un appel). Son modèle 3D, plus tard (≤ 8 000 triangles, choix du mainteneur du 19
 * octobre 2026 : un lot à part), prendra la place du pion avec un appel de plus.
 */
function scenetteCost5e(): { triangles: number; calls: number } {
  const triangles = Math.max(...PLAN_5E.places.filter((p) => p.scenes.length).map((p) => Math.max(scenetteDecor(scenePlace(p.id)).triangles, scenetteDecor(scenePlace(p.id), true).triangles)));
  return { triangles, calls: 1 };
}

/**
 * Ce que coûte le monde ouvert du 5e (lot 2 : toute l'île en grandes masses ; lot 3 : la Montée finie) : le ciel, le sol
 * et sa forêt, la mer, les chemins, les lieux et leurs passages, la brume des terres fermées (au départ, les trois), la
 * brume des failles, Kéo ; puis, selon `view` : la scénette ouverte (`scenette`, le pire : la question et le décor de
 * près de la Montée) ou le monde hors scénette (`monde` : le maillage de la pose, une partie qui descend, un passage qui
 * se relève, la caisse qui roule). Les deux ne se montrent jamais ensemble : une question finit toute pose
 * (three/archipeo/scene.ts, `askQuestion`), et aucune pose ne commence pendant une question (`setPlaces`). Ni
 * aménagements, ni Détours, ni faune, ni Nef : ils viennent avec leurs lots.
 */
export function openWorldCost5e(view: 'scenette' | 'monde' = 'scenette'): OpenWorldCost5e[] {
  const field = buildHeightField5e();
  const ground = groundCost5e();
  const paths = pathRibbons5e((x, z) => groundOn5e(field, x, z));
  return [
    { poste: 'ciel', ...SKY },
    { poste: 'sol', triangles: ground.triangles, calls: ground.calls },
    { poste: 'mer', triangles: 2, calls: 1 },
    { poste: 'chemins', triangles: paths.triangles, calls: 1 },
    { poste: 'lieux', ...placesCost5e() },
    { poste: 'brume', triangles: veilFacets(LINKED_LANDS_5E).triangles, calls: 1 },
    { poste: 'failles', triangles: riftMistFacets().triangles, calls: 1 },
    { poste: 'kéo', ...KEO },
    ...(view === 'monde'
      ? [{ poste: 'pose' as const, ...poseCost5e() }]
      : [
          { poste: 'question' as const, ...questionCost5e() },
          { poste: 'scénette' as const, ...scenetteCost5e() },
        ]),
  ];
}

/**
 * La Carte du 5e, en un seul plan : le ciel, toute l'île de loin, la mer, les chemins, les lieux (deux appels, le pire),
 * le trait double des ponts et de la cabine, la ligne de la falaise et la bande sombre des chemins (dans le maillage des
 * lieux), la brume des terres fermées, Kéo ; jamais la brume des failles.
 */
export function mapCost5e(): { triangles: number; calls: number } {
  const field = buildHeightField5e();
  const far = tileCounts5e(field, 'far').reduce((s, n) => s + n, 0);
  const ground = (x: number, z: number) => groundOn5e(field, x, z);
  const paths = pathRibbons5e(ground).triangles;
  const places = placesCost5e();
  const marks = LINKED_LANDS_5E.reduce((s, l) => s + bridgeMapMark(l).triangles, 0) + cliffMapLine().triangles + pathMapEdges5e(ground, CLIFF_MAP_COLORS.dark).triangles;
  const veil = veilFacets(LINKED_LANDS_5E).triangles;
  return {
    triangles: SKY.triangles + far + 2 + paths + places.triangles + marks + veil + KEO.triangles,
    calls: SKY.calls + 1 + 1 + 1 + places.calls + 1 + KEO.calls,
  };
}
