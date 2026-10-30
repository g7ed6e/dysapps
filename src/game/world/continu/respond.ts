// Le monde qui répond (GD-27, axe 3, piste B ; GD-28, « Le monde qui répond, sur le monument » ; lot 4 du chantier
// « Rendre le monde ouvert vivant », 30 octobre 2026) : pendant une mission, chaque bonne réponse pose un objet de plus
// dans la scène, fixe et cumulatif jusqu'au bilan, sur le monument, jamais sur l'instrument ni parmi les réponses,
// jamais sur le signe de l'absence, loin de la bulle. L'objet se pose après « Valider », une fois la réaction de l'item
// finie, en un seul mouvement lent (`RESPOND_SECONDS`) ; d'un coup avec « Réduire les animations ». Rien pour une
// erreur ; ni compteur, ni jauge, ni emplacement vide : les objets qui ne sont pas encore posés ne se dessinent pas, et
// rien ne dit combien il en manque. Le bilan n'en parle jamais ; en quittant la scénette, la scène revient à l'état du
// lieu (le maillage de l'item s'efface avec elle). Ce fichier tient le registre des lieux qui répondent (un objet par
// lieu, décidé par le directeur artistique) et dessine les objets posés ; la vue (three/archipeo/scene.ts) les joue.
// Code pur.
import { FacetBuilder, type Facets, mergeFacets } from './facets';
import type { Vec3 } from './geometry';
import { placeById, type PlaceId } from './levelPlan';
import { heightFor } from './placeGround';
import { standingHeight } from './terrain';

/** Les objets au plus par mission : les missions ont huit items (une bonne réponse par item au plus). */
export const RESPOND_MAX = 8;

/** Le mouvement de l'objet qui se pose, en secondes : un seul, lent (plus lent qu'une réaction d'item, 1,4 s). */
export const RESPOND_SECONDS = 1.2;

/** L'objet numéro `i` d'un lieu : sa place posée (`at`), d'où il vient (`from`), le lever de son arc. */
interface RespondSpot {
  at: Vec3;
  from: Vec3;
  arc: number;
}

/** Ce qu'un lieu pose à chaque bonne réponse : la place de l'objet `i` (de 0 à `RESPOND_MAX − 1`) et son dessin. */
export interface Responder {
  spot(i: number): RespondSpot;
  /** L'objet `i`, dessiné à l'origine (il est posé en `spot(i).at`, et il vole de `from` à `at`). */
  object(b: FacetBuilder, i: number): void;
}

/** L'objet qui se pose : ses facettes à l'origine, son départ, son arrivée, son arc. */
export interface RespondMove {
  facets: Facets;
  from: Vec3;
  to: Vec3;
  arc: number;
}

/**
 * Le repère d'un lieu dans le monde : un point de son repère (son centre au sol en 0, tourné de son cap) devient un
 * point du monde ; `ly` : la hauteur au-dessus du sol du centre. Les fichiers des lieux placent leurs objets avec lui.
 */
export function placeFrame(place: PlaceId): (lx: number, ly: number, lz: number) => Vec3 {
  const p = placeById(place);
  const c = Math.cos(p.yaw),
    s = Math.sin(p.yaw);
  let h0: number | null = null;
  return (lx, ly, lz) => {
    if (h0 === null) h0 = standingHeight(heightFor(place)(p.center));
    return { x: p.center.x + lx * c + lz * s, y: h0 + ly, z: p.center.z - lx * s + lz * c };
  };
}

/** Les lieux qui répondent, chacun par son dessin (un fichier par niveau nomme le sien ; vide tant qu'aucun n'est décidé). */
const RESPONDERS: Partial<Record<PlaceId, () => Responder>> = {};

/** Inscrit le répondant d'un lieu (appelé par les fichiers des lieux à leur chargement). */
export function registerResponder(place: PlaceId, make: () => Responder): void {
  RESPONDERS[place] = make;
}

/** Le lieu répond-il (a-t-il son objet) ? */
export function responds(place: PlaceId): boolean {
  return place in RESPONDERS;
}

/** Des facettes faites à l'origine, posées en `at`. */
function placedAt(f: Facets, at: Vec3): Facets {
  const positions = new Float32Array(f.positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = f.positions[i] + at.x;
    positions[i + 1] = f.positions[i + 1] + at.y;
    positions[i + 2] = f.positions[i + 2] + at.z;
  }
  return { ...f, positions };
}

/** Les `count` premiers objets d'un lieu, posés à leur place (rien pour un lieu qui ne répond pas). */
export function respondPlaced(place: PlaceId, count: number): Facets {
  const make = RESPONDERS[place];
  const n = Math.max(0, Math.min(RESPOND_MAX, Math.floor(count)));
  if (!make || !n) return new FacetBuilder().build();
  const r = make();
  return mergeFacets(
    Array.from({ length: n }, (_, i) => {
      const b = new FacetBuilder();
      r.object(b, i);
      return placedAt(b.build(), r.spot(i).at);
    }),
  );
}

/** L'objet `i` d'un lieu en mouvement, de son départ à sa place (rien pour un lieu qui ne répond pas, ou au-delà du dernier). */
export function respondMove(place: PlaceId, i: number): RespondMove | null {
  const make = RESPONDERS[place];
  if (!make || i < 0 || i >= RESPOND_MAX) return null;
  const r = make();
  const b = new FacetBuilder();
  r.object(b, i);
  const s = r.spot(i);
  return { facets: b.build(), from: s.from, to: s.at, arc: s.arc };
}

/** Les triangles des objets d'un lieu, tous posés (pour le budget de la scénette). */
export function respondTriangles(place: PlaceId): number {
  return respondPlaced(place, RESPOND_MAX).triangles;
}
