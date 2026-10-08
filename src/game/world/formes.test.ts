import { describe, expect, it } from 'vitest';
import { BOITE_DE_LA_FORME, COTE_MINIMALE_DE_LA_FORME, FORMES, distanceALaForme } from './formes';
import { coeurDe, isLand, mapOf } from './map';
import { silhouetteDe } from './silhouettes';

// Les formes des îles (GD-12, piste 1 du directeur artistique, « formes contenues », 8 octobre 2026), lues sur la terre
// telle que le jeu la dessine (bruit compris), île par île, aux Premiers Rivages.
const LIEUX = mapOf('6e').filter((d) => silhouetteDe(d.id).forme);

/** La case (x, y), au repère du monde, est-elle de la terre de l'île ? */
const terre = (id: string) => {
  const def = LIEUX.find((d) => d.id === id)!;
  return (x: number, y: number) => isLand(def, x, y);
};

describe('Les formes des îles (GD-12)', () => {
  it('les quinze lieux des Premiers Rivages ont leur forme, prise dans le catalogue', () => {
    expect(LIEUX).toHaveLength(15);
    for (const d of LIEUX) expect(FORMES).toContain(silhouetteDe(d.id).forme!.forme);
  });

  it.each(LIEUX.map((d) => d.id))('%s : la terre tient dans sa boîte, de 3 à 5 cases au-delà du cœur sur chaque côté', (id) => {
    const def = LIEUX.find((d) => d.id === id)!;
    const c = coeurDe(def);
    const B = BOITE_DE_LA_FORME;
    const est = terre(id);
    // Rien au-delà de la boîte (on regarde trois cases plus loin).
    for (let y = c.y0 - B - 3; y < c.y1 + B + 3; y++)
      for (let x = c.x0 - B - 3; x < c.x1 + B + 3; x++) {
        const dans = x >= c.x0 - B && x < c.x1 + B && y >= c.y0 - B && y < c.y1 + B;
        if (!dans) expect(est(x, y), `${id} ${x},${y}`).toBe(false);
      }
    // Sur chaque côté, la terre dépasse le cœur d'au moins trois cases, là où elle est la plus large.
    const profondeur = (dedans: (k: number, i: number) => boolean, long: number) => {
      let p = 0;
      for (let i = 0; i < long; i++) for (let k = 1; k <= B; k++) if (dedans(k, i)) p = Math.max(p, k);
      return p;
    };
    const cote = c.x1 - c.x0;
    expect(profondeur((k, i) => est(c.x0 - k, c.y0 + i), cote), `${id} à gauche`).toBeGreaterThanOrEqual(COTE_MINIMALE_DE_LA_FORME);
    expect(profondeur((k, i) => est(c.x1 - 1 + k, c.y0 + i), cote), `${id} à droite`).toBeGreaterThanOrEqual(COTE_MINIMALE_DE_LA_FORME);
    expect(profondeur((k, i) => est(c.x0 + i, c.y0 - k), cote), `${id} devant`).toBeGreaterThanOrEqual(COTE_MINIMALE_DE_LA_FORME);
    expect(profondeur((k, i) => est(c.x0 + i, c.y1 - 1 + k), cote), `${id} au fond`).toBeGreaterThanOrEqual(COTE_MINIMALE_DE_LA_FORME);
  });

  // Le dessin de la forme, avant le bruit : le bruit de la graine casse ensuite le contour à la case près (./map.ts),
  // une case de plus ou de moins sur la côte, jamais un bras.
  it.each(LIEUX.map((d) => d.id))('%s : ni bras ni entaille de moins de trois cases dans le dessin de sa forme', (id) => {
    const def = LIEUX.find((d) => d.id === id)!;
    const c = coeurDe(def);
    const s = (c.x1 - c.x0) / 2;
    const B = BOITE_DE_LA_FORME;
    const f = silhouetteDe(id).forme!;
    // La case (i, j) depuis le coin du cœur ; hors de la boîte, de l'eau.
    const est = (i: number, j: number) => i >= -B && i < 2 * s + B && j >= -B && j < 2 * s + B && distanceALaForme(f, i - s + 0.5, j - s + 0.5, s) < 0;
    // Une case tient dans un carré de 3 × 3 tout entier du même genre (terre, ou eau).
    const dansUnCarre = (x: number, y: number, genre: boolean) => {
      for (let oy = -2; oy <= 0; oy++)
        for (let ox = -2; ox <= 0; ox++) {
          let plein = true;
          for (let j = 0; j < 3 && plein; j++) for (let i = 0; i < 3 && plein; i++) plein = est(x + ox + i, y + oy + j) === genre;
          if (plein) return true;
        }
      return false;
    };
    const etroits: string[] = [];
    for (let y = -B; y < 2 * s + B; y++) for (let x = -B; x < 2 * s + B; x++) if (!dansUnCarre(x, y, est(x, y))) etroits.push(`${x},${y}`);
    expect(etroits, id).toEqual([]);
  });

  it('chaque forme du catalogue, tournée de quatre façons, laisse le cœur entier dans sa terre', () => {
    const s = 11;
    for (const forme of FORMES)
      for (const vers of ['devant', 'fond', 'gauche', 'droite'] as const)
        for (let v = -s; v < s; v++)
          for (let u = -s; u < s; u++) expect(distanceALaForme({ forme, vers }, u + 0.5, v + 0.5, s), `${forme} ${vers}`).toBeLessThan(0);
  });
});
