// La hauteur du sol sous un lieu, selon son niveau (GD-22, lot 3) : la carte de hauteurs du 6e (./terrain.ts) ou celle
// du 5e (./terrain5e.ts). Ce que la scénette, la scène d'un item et les traces posent au sol d'un lieu la lisent ici,
// pour que la Montée, au 5e, se dessine sur son propre sol. Code pur.
import type { Vec2 } from './geometry';
import { levelOfPlace, type OpenWorldLevel, type PlaceId } from './levelPlan';
import { heightAt } from './terrain';
import { heightAt4e } from './terrain4e';
import { heightAt5e } from './terrain5e';

/** La hauteur du sol de chaque niveau. */
const HEIGHT_OF: Readonly<Record<OpenWorldLevel, (p: Vec2) => number>> = { '6e': heightAt, '5e': heightAt5e, '4e': heightAt4e };

const known = new Map<PlaceId, (p: Vec2) => number>();

/** La hauteur du sol (avant la grille) du niveau d'un lieu. */
export function heightFor(place: PlaceId): (p: Vec2) => number {
  let h = known.get(place);
  if (!h) known.set(place, (h = HEIGHT_OF[levelOfPlace(place)]));
  return h;
}
