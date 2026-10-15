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
import { bellPlane, habitantHand, scenetteDecor, scenetteFinale, scenetteSuccess } from './scenette';
import { buildHeightField, heightOnMesh, tileRings, tileTriangleCounts } from './terrain';
import { veilFacets } from './veil';

/** Kéo : le modèle importé de près (1 500 triangles environ) et son anneau clair au sol, comme le poste « bonhomme » du monde en grille. */
const KEO = { triangles: 1620, calls: 2 };

/** L'enveloppe du prototype : ce que le cadrage a estimé. */
export const OPEN_WORLD_BUDGET = { triangles: 45_000, calls: 18 } as const;

export interface OpenWorldCost {
  poste: 'sol' | 'mer' | 'chemins' | 'lieux' | 'brume' | 'kéo' | 'question' | 'scénette' | 'pièces';
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
    // Au Phare, les cloches pendues à leur poutre, toutes balancées, et la corde de sonnerie.
    const hang = place === 'phare' ? { hand: habitantHand(place), rail: bellPlane(place).rail } : undefined;
    const objects = answerObjects(place, points, 1, { picked: [0, 1, 2, 3, 4, 5], hanging: hang });
    triangles = Math.max(triangles, item.still.triangles + objects.triangles + (item.reaction?.facets.triangles ?? 0));
  }
  return { triangles, calls: 2 };
}

/**
 * Une scénette (lot 2, le Phare ; lot 3, les Quais ; lot 4, les Filets et les Écluses), la plus chargée : le décor de
 * près (la galerie, sa rambarde, la gardienne ; le docker ; le plancher de séchage et la pêcheuse ; le quai du sas, son
 * canal, sa porte et l'éclusier), un maillage fait à l'arrivée et libéré au départ, du matériau du terrain, au plus fort
 * de la réussite. La lampe et l'objet de la réussite passent par le maillage de la réaction (au Phare, quand les objets
 * des réponses sont effacés ; ailleurs, la réaction de l'item cède sa place à l'objet qui va se poser, puis à la
 * lumière) : leurs triangles comptent ici, pas leur appel. Kéo y reste, sans son anneau (son appel est compté quand
 * même : le pire cas).
 */
function scenetteCost(): { triangles: number; calls: number } {
  const triangles = Math.max(...SCENETTE_PLACES.map((p) => Math.max(scenetteDecor(p).triangles, successTriangles(p))));
  return { triangles, calls: 1 };
}

/** La scène d'item la plus chargée d'un lieu à scénette posée (celle que la réussite reprend). */
const FINALE_SCENES: Partial<Record<PlaceId, ItemScene>> = {
  quais: { kind: 'quai', op: 'moitie', before: 98, after: 49 },
  filets: { kind: 'filets', catch: 'crabes', count: 4 },
  ecluses: { kind: 'echelle', n: 24, d: 12 },
};

/**
 * La scénette à sa réussite : au Phare, le décor et la lampe ; ailleurs, le décor changé, l'objet posé et la lumière
 * (la caisse dans la barque et la lanterne de proue des Quais ; le panier plein et le filet tendu des Filets ; le sas
 * rempli, la porte ouverte et la barque passée des Écluses).
 */
function successTriangles(place: PlaceId): number {
  const scene = FINALE_SCENES[place];
  const f = scene ? scenetteFinale(place, scene, 1) : null;
  if (!f) return scenetteDecor(place).triangles + (scenetteSuccess(place)?.triangles ?? 0);
  return f.decor.triangles + f.landed.triangles + Math.max(f.moving.triangles, f.glow?.triangles ?? 0);
}

/** Les lieux qui ont leur scénette : tous, le Phare (lot 2), les Quais (lot 3), les Filets et les Écluses (lot 4). */
const SCENETTE_PLACES: readonly PlaceId[] = PLACES.map((p) => p.id);

/** Les pièces durables, toutes remises, et le Veilleur rallumé : un maillage pour les quatre lieux, et la Roue des Écluses. */
function piecesCost(): { triangles: number; calls: number } {
  const all = PLACES.map((p) => placePieces(p.id, 2));
  const triangles = all.reduce((t, p) => t + p.still.triangles + (p.wheel?.facets.triangles ?? 0), 0) + veilleurPiece().triangles;
  return { triangles, calls: 2 };
}

/** L'écart entre deux points où l'on cherche le pire sol : Kéo se tient toujours sur le réseau des chemins. */
const SAMPLE_STEP = 4;

/**
 * Le sol, environ : les deux anneaux de tuiles (un maillage chacun) autour des points du réseau pris tous les quatre
 * unités, le plus chargé de près et le plus chargé de loin (ils peuvent venir de deux points différents : on compte
 * large).
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

/**
 * Ce que coûte le monde continu, environ : le sol autour de Kéo, tout le reste visible à la fois ; la brume des quatre
 * lieux, et le second maillage du banc qui se lève (moins d'une seconde).
 */
export function openWorldCost(): OpenWorldCost[] {
  const field = buildHeightField();
  const paths = pathRibbons((x, z) => heightOnMesh(field, x, z));
  const ground = groundCost();
  return [
    { poste: 'sol', triangles: ground.triangles, calls: ground.calls },
    { poste: 'mer', triangles: 2, calls: 1 },
    { poste: 'chemins', triangles: paths.triangles, calls: 1 },
    { poste: 'lieux', triangles: PLACES.reduce((s, p) => s + modelOfPlace(p.id).facets.triangles, 0), calls: PLACES.length },
    { poste: 'brume', triangles: veilFacets(PLACES.map((p) => p.id)).triangles, calls: 2 },
    { poste: 'kéo', ...KEO },
    { poste: 'question', ...questionCost() },
    { poste: 'scénette', ...scenetteCost() },
    { poste: 'pièces', ...piecesCost() },
  ];
}

/**
 * La Carte des lieux ouverts (lot 3), le pire : toute l'île de loin dans l'anneau de loin (celui de près vidé), la mer,
 * les chemins, les quatre lieux, la brume des lieux fermés (les quatre, et le banc qui se lève), Kéo, les pièces. Ni question ni
 * scénette n'y sont ouvertes : elle ne s'ouvre pas pendant une question. Mesuré dans le navigateur : 10 appels,
 * 19 310 triangles (la mer en deux).
 */
export function mapCost(): { triangles: number; calls: number } {
  const field = buildHeightField();
  const far = tileTriangleCounts(field, 'far').reduce((s, n) => s + n, 0);
  const paths = pathRibbons((x, z) => heightOnMesh(field, x, z)).triangles;
  const places = PLACES.reduce((s, p) => s + modelOfPlace(p.id).facets.triangles, 0);
  const veil = veilFacets(PLACES.map((p) => p.id)).triangles;
  const pieces = piecesCost();
  return { triangles: far + 2 + paths + places + veil + KEO.triangles + pieces.triangles, calls: 1 + 1 + 1 + PLACES.length + 2 + KEO.calls + pieces.calls };
}
