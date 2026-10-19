// Les abords de la scénette des Filets : ce qui y est haut reste hors de l'anneau où la rangée des réponses se pose quand
// la caméra tourne, et hors du regard de la caméra de face ; rien ne se pose sur le séchoir ni sur le panier plein de la
// réussite du Troupeau (leur poids : ./surroundings.test.ts). Sans Three.js.
import { describe, expect, it } from 'vitest';
import { RING } from './filetsSurroundings';
import { filetsBasketAt } from './questionScene';
import { scenetteFinale, scenetteHabitant, scenetteKeo, scenetteSurroundings } from './scenette';

const keo = scenetteKeo('filets').at;
const pecheuse = scenetteHabitant('filets');
const target = { x: (keo.x + pecheuse.x) / 2, z: keo.z };
/** Le dessus du plancher de séchage, où se tiennent Kéo et la pêcheuse. */
const deck = keo.y;

const states = [
  [false, false],
  [false, true],
  [true, true],
] as const;

describe('les abords des Filets', () => {
  it('ne mettent rien de haut dans l’anneau de la rangée des réponses, ni entre Kéo et la pêcheuse', () => {
    for (const [open, posed] of states) {
      const p = scenetteSurroundings('filets', open, posed).positions;
      for (let k = 0; k < p.length; k += 3) {
        if (p[k + 1] <= deck + 0.15) continue;
        expect(Math.hypot(p[k] - target.x, p[k + 2] - target.z)).toBeGreaterThan(RING);
      }
    }
  });

  it('ne dressent rien devant la caméra de face, entre la rangée et elle', () => {
    const p = scenetteSurroundings('filets').positions;
    for (let k = 0; k < p.length; k += 3) {
      if (p[k + 2] < target.z + 2 || p[k + 1] < deck) continue;
      expect(Math.abs(p[k] - target.x)).toBeGreaterThan(5);
    }
  });

  it('laissent libre la place du panier plein, et la réussite du Troupeau garde son filet et son panier', () => {
    const basket = filetsBasketAt();
    const p = scenetteSurroundings('filets').positions;
    for (let k = 0; k < p.length; k += 3) expect(Math.hypot(p[k] - basket.x, p[k + 2] - basket.z)).toBeGreaterThan(1.5);
    const finale = scenetteFinale('filets', { kind: 'filets', catch: 'crabes', count: 4 }, 1, true, 'plurals');
    expect(finale).not.toBeNull();
    expect(finale!.landed.triangles).toBeGreaterThan(0);
  });
});
