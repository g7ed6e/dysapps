import { describe, expect, it } from 'vitest';
import { placeById } from './plan6e';
import { scenetteHabitant, scenetteKeo, scenetteSurroundings } from './scenette';
import { sceneSpot } from './questionScene';
import { heightAt } from './terrain';

/** Le sol de la scène de l'Imprimerie : la terre battue, au-dessus du point de la scène (printworks.ts, `rise`). */
const floor = () => {
  const o = sceneSpot('printworks');
  return { x: o.x, y: o.y + 0.15, z: o.z };
};

describe('Les abords de l’Imprimerie', () => {
  const f = scenetteSurroundings('printworks');

  it('ne dressent rien entre la caméra de face et la scène (Kéo, l’imprimeur, la rangée des feuilles)', () => {
    // Au sud du sol de la scène, entre Kéo et l'imprimeur élargis : rien que le chemin et des touffes, à moins de 0,45 du
    // sol (le sentier suit le maillage du sol, un peu au-dessus de lui).
    const o = floor();
    const keo = scenetteKeo('printworks').at;
    const habitant = scenetteHabitant('printworks');
    const x0 = Math.min(keo.x, habitant.x) - 1.2,
      x1 = Math.max(keo.x, habitant.x) + 1.2;
    for (let k = 0; k < f.positions.length; k += 3) {
      const [x, y, z] = [f.positions[k], f.positions[k + 1], f.positions[k + 2]];
      if (x > x0 && x < x1 && z > o.z + 1.4 && z < o.z + 11) expect(y - Math.max(o.y - 0.15, heightAt({ x, z }))).toBeLessThan(0.55);
    }
  });

  it('laissent libre l’atelier du lieu, son soubassement et sa plaque d’ardoise tombée', () => {
    // L'atelier (printworks.ts, `SHOP`), dans le repère du lieu : de x −3,6 à 3,6, de z −4 à 0,2 ; la plaque tombée
    // contre le mur est, jusqu'à x 4,1, à moins d'une unité du sol. Un rien de marge.
    const c = placeById('printworks').center;
    const o = floor();
    for (let k = 0; k < f.positions.length; k += 3) {
      const [x, y, z] = [f.positions[k] - c.x, f.positions[k + 1], f.positions[k + 2] - c.z];
      const inside = x > -3.8 && x < 3.8 && z > -4.2 && z < 0.4;
      const plaque = x > 3.6 && x < 4.15 && z > -3.4 && z < -1.8;
      if (inside) expect(y, `${x.toFixed(2)} ${z.toFixed(2)}`).toBeLessThan(o.y - 0.1);
      // Au-dessus de la plaque (moins d'une unité de haut), l'égout de l'atelier ouvert peut passer.
      if (plaque) expect(y < o.y - 0.1 || y > o.y + 1.5, `${x.toFixed(2)} ${z.toFixed(2)}`).toBe(true);
    }
  });
});
