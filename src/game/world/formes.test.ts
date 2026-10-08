import { describe, expect, it } from 'vitest';
import { FEATURE_BOX, FORMES, shapeCorner } from './formes';
import { shapeBox, bornesDuCoeur, coeurDe, inCoeurDOrigine, isLand, landscape, mapOf, BEACH_RADIUS, coreCornerGround, TERRE_AUTOUR_DU_COEUR } from './map';
import { silhouetteDe } from './silhouettes';
import { questStations } from './terrain/markers';
import { zoneDesPlans } from './plans';
import { casesDuVillage } from './terrain/village';
import { fixturesOfPlace } from './placedFixtures';
import { casesDeLaPetiteConstruction, placeEcrite } from './fixtures';
import { GD11_GUARDIAN_SQUARES, GUARDIAN_SQUARE_SIDE } from './guardianSquares';
import { AVATAR_HOME } from './terrain/base';

// Les formes des îles (GD-12, piste 1 du directeur artistique, « formes contenues », 8 octobre 2026), lues sur la terre
// telle que le jeu la dessine (bruit et retouches compris), île par île, aux Premiers Rivages.
const LIEUX = mapOf('6e').filter((d) => silhouetteDe(d.id).forme);
const T = FEATURE_BOX;

/** La case (x, y), au repère du monde, est-elle de la terre de l'île ? */
const terre = (id: string) => {
  const def = LIEUX.find((d) => d.id === id)!;
  return (x: number, y: number) => isLand(def, x, y);
};

/** De combien la terre de l'île dépasse son cœur, de chaque côté, au plus (en cases). */
function profondeurs(id: string): { gauche: number; droite: number; devant: number; fond: number } {
  const def = LIEUX.find((d) => d.id === id)!;
  const c = coeurDe(def);
  const est = terre(id);
  const cote = c.x1 - c.x0;
  const profondeur = (dedans: (k: number, i: number) => boolean) => {
    let p = 0;
    for (let i = 0; i < cote; i++) for (let k = 1; k <= T; k++) if (dedans(k, i)) p = Math.max(p, k);
    return p;
  };
  return {
    gauche: profondeur((k, i) => est(c.x0 - k, c.y0 + i)),
    droite: profondeur((k, i) => est(c.x1 - 1 + k, c.y0 + i)),
    devant: profondeur((k, i) => est(c.x0 + i, c.y0 - k)),
    fond: profondeur((k, i) => est(c.x0 + i, c.y1 - 1 + k)),
  };
}

describe('Les formes des îles (GD-12)', () => {
  it('les quinze lieux des Premiers Rivages ont leur forme, prise dans le catalogue', () => {
    expect(LIEUX).toHaveLength(15);
    for (const d of LIEUX) expect(FORMES).toContain(silhouetteDe(d.id).forme!.forme);
  });

  it.each(LIEUX.map((d) => d.id))('%s : la terre tient dans sa boîte ; son trait va jusqu’à son bord, deux cases de terre au moins ailleurs', (id) => {
    const def = LIEUX.find((d) => d.id === id)!;
    const c = coeurDe(def);
    const est = terre(id);
    // Rien au-delà de la boîte, plus profonde du côté du trait (on regarde trois cases plus loin).
    const k = shapeBox(silhouetteDe(id).forme!);
    for (let y = c.y0 - T - 3; y < c.y1 + T + 3; y++)
      for (let x = c.x0 - T - 3; x < c.x1 + T + 3; x++) {
        const dans = x >= c.x0 - k.gauche && x < c.x1 + k.droite && y >= c.y0 - k.devant && y < c.y1 + k.fond;
        if (!dans) expect(est(x, y), `${id} ${x},${y}`).toBe(false);
      }
    // Franchement asymétrique (directeur artistique, 8 octobre 2026) : le trait de la forme va jusqu'au bord de sa
    // boîte ; sur chaque côté, la terre dépasse le cœur d'au moins deux cases.
    const p = profondeurs(id);
    expect(Math.max(...Object.values(p)), `${id} ${JSON.stringify(p)}`).toBe(Math.max(...Object.values(k)));
    for (const [cote, n] of Object.entries(p)) expect(n, `${id} ${cote}`).toBeGreaterThanOrEqual(TERRE_AUTOUR_DU_COEUR);
  });

  // Sur la terre finale, après le bruit (référent dys, consultant Archipéo, 8 octobre 2026 : des puits d'une ou deux
  // cases s'ouvraient dans la côte de la Forêt, de la Pointe et de la Rivière, qu'Archipéo creusait en fosse noire).
  it.each(LIEUX.map((d) => d.id))('%s : ni bras ni entaille de moins de trois cases, aucune eau dans la terre', (id) => {
    const def = LIEUX.find((d) => d.id === id)!;
    const c = coeurDe(def);
    const est = terre(id);
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
    for (let y = c.y0 - T - 1; y < c.y1 + T + 1; y++) for (let x = c.x0 - T - 1; x < c.x1 + T + 1; x++) if (!dansUnCarre(x, y, est(x, y))) etroits.push(`${x},${y}`);
    expect(etroits, id).toEqual([]);
    // Aucune case d'eau entourée de terre : toute l'eau de la boîte rejoint le large, et la côte n'a ni mare ni lac.
    const mer = new Set<string>();
    const file: [number, number][] = [[c.x0 - T - 1, c.y0 - T - 1]];
    const dansLaBoite = (x: number, y: number) => x >= c.x0 - T - 1 && x <= c.x1 + T && y >= c.y0 - T - 1 && y <= c.y1 + T;
    for (let n = 0; n < file.length; n++) {
      const [x, y] = file[n];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const [a, b] = [x + dx, y + dy];
        if (dansLaBoite(a, b) && !est(a, b) && !mer.has(`${a},${b}`)) {
          mer.add(`${a},${b}`);
          file.push([a, b]);
        }
      }
    }
    for (let y = c.y0 - T; y < c.y1 + T; y++) for (let x = c.x0 - T; x < c.x1 + T; x++) if (!est(x, y)) expect(mer.has(`${x},${y}`), `${id} ${x},${y}`).toBe(true);
    expect(landscape(def).filter((l) => l.ground === 'eau' || l.h < 0), id).toEqual([]);
  });

  it.each(LIEUX.map((d) => d.id))('%s : les coins arrondis du cœur sont dans ses marges, et rien de ce qui y est posé ne s’y tient (point 4)', (id) => {
    const def = LIEUX.find((d) => d.id === id)!;
    const c = coeurDe(def);
    // Les cases des coins arrondis, relatives à l'origine du cœur.
    const coins = new Set<string>();
    for (let y = c.y0; y < c.y1; y++)
      for (let x = c.x0; x < c.x1; x++)
        if (coreCornerGround(def, x, y) !== null) {
          expect(inCoeurDOrigine(def, x, y), `${id} ${x},${y}`).toBe(false);
          coins.add(`${x - def.core.x},${y - def.core.y}`);
        }
    // Ce qui est posé dans le cœur, et une case autour : les bornes, la zone des plans, les lieux du village, les petites
    // constructions et les objets de quête, le carré du Gardien, le bonhomme.
    const poses: [string, number, number][] = [];
    for (const s of questStations(def.id)) poses.push(['borne', s.x, s.y]);
    const z = zoneDesPlans(def.id);
    for (let x = z.x; x < z.x + z.w; x++) for (let y = z.y; y < z.y + z.h; y++) poses.push(['plans', x, y]);
    for (const [x, y] of casesDuVillage(def.id)) poses.push(['village', x, y]);
    for (const f of fixturesOfPlace(def.id)) {
      const p = placeEcrite(f.fixture);
      if (p) for (const k of casesDeLaPetiteConstruction(f.fixture) ?? []) poses.push([f.fixture, p.x + k.x, p.y + k.y]);
    }
    const g = GD11_GUARDIAN_SQUARES[def.id]!;
    for (let x = g.x; x < g.x + GUARDIAN_SQUARE_SIDE; x++) for (let y = g.y; y < g.y + GUARDIAN_SQUARE_SIDE; y++) poses.push(['gardien', x, y]);
    poses.push(['bonhomme', AVATAR_HOME.x, AVATAR_HOME.y]);
    for (const [quoi, x, y] of poses)
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) expect(coins.has(`${x + dx},${y + dy}`), `${id} : ${quoi} en ${x},${y}`).toBe(false);
    // Au moins deux coins arrondis par île : le sol du lieu ne se lit plus en carré sur la Carte.
    const b = bornesDuCoeur(def);
    const arrondis = [b.x0, b.x1 - 1].flatMap((x) => [b.y0, b.y1 - 1].filter((y) => coins.has(`${x},${y}`))).length;
    expect(arrondis, id).toBeGreaterThanOrEqual(2);
  });

  it('chaque coin arrondi garde huit cases de son cœur (un rayon de six cases), et la forme dit ce que devient chacun', () => {
    const def = LIEUX.find((d) => d.id === 'maths-6e-fractions')!;
    const c = coeurDe(def);
    let n = 0;
    for (let y = c.y0; y < c.y0 + BEACH_RADIUS; y++) for (let x = c.x0; x < c.x0 + BEACH_RADIUS; x++) if (coreCornerGround(def, x, y) === 'sable') n++;
    expect(n).toBe(8);
    for (const forme of FORMES) for (const su of [-1, 1] as const) for (const sv of [-1, 1] as const) expect(['plage', 'terre', 'trait']).toContain(shapeCorner({ forme, vers: 'devant' }, su, sv));
  });
});
