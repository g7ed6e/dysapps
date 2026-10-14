// La brume posée sur les lieux pas encore ouverts (piste 1, lot 1, deambuler-scenettes.md) : un banc de brume en
// volumes simples, assez haut pour couvrir le lieu entier ; elle se lève à l'approche de Kéo et pour la prochaine
// mission (./mission.ts, `veiledPlaces`). Rien ne bouge : c'est un état, pas une animation. Code pur.
import { FacetBuilder, boundsOf, type Facets } from './facets';
import { hash2 } from './geometry';
import { placeById, type PlaceId } from './plan6e';
import { modelOfPlace } from './places';
import { heightAt, standingHeight } from './terrain';

/** La couleur de la brume : la Brume du pack (#E5EBE3), celle du lointain aussi. */
export const MIST_COLOR = 0xe5ebe3;
/** Le côté de ses volumes : assez pour qu'ils restent des volumes, peu pour rester légers. */
const SIDES = 7;
/** Combien de bouffées autour du cœur du banc. */
const PUFFS = 8;

/** Le banc de brume d'un lieu, dans les axes du monde. */
function veilOf(b: FacetBuilder, id: PlaceId): void {
  const place = placeById(id);
  const model = modelOfPlace(id);
  const { min, max } = boundsOf(model.facets);
  const reach = Math.max(Math.abs(min[0]), Math.abs(max[0]), Math.abs(min[2]), Math.abs(max[2])) + 1.5;
  const top = model.top + 1;
  const y = standingHeight(heightAt(place.center)) - 0.5;
  const { x, z } = place.center;
  // Le cœur : il couvre le lieu jusqu'au-dessus de son sommet.
  b.prism({ x, y, z }, reach * 0.75, reach * 0.45, top, SIDES + 1, MIST_COLOR);
  b.prism({ x, y: y + top, z }, reach * 0.45, 0, reach * 0.3, SIDES + 1, MIST_COLOR);
  // Les bouffées tout autour, plus basses, de tailles un peu différentes (un hasard fixe).
  for (let k = 0; k < PUFFS; k++) {
    const a = (2 * Math.PI * k) / PUFFS + 0.3;
    const v = hash2(k, id.length);
    const r = reach * (0.35 + 0.15 * v);
    const h = top * (0.35 + 0.3 * v);
    const at = { x: x + Math.cos(a) * reach * 0.8, y, z: z + Math.sin(a) * reach * 0.8 };
    b.prism(at, r, r * 0.7, h, SIDES, MIST_COLOR);
    b.prism({ ...at, y: y + h }, r * 0.7, 0, r * 0.5, SIDES, MIST_COLOR);
  }
}

/** La brume des lieux `ids` : un seul maillage. */
export function veilFacets(ids: readonly PlaceId[]): Facets {
  const b = new FacetBuilder();
  for (const id of ids) veilOf(b, id);
  return b.build();
}
