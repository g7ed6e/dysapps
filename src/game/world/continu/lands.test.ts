// Les terres du monde continu (GD-20, point 3, « vraies terres, vrais ponts ») : cinq terres que seuls les quatre ponts
// relient, leurs lieux, leur prix, leur ordre. Ce que la grille en reçoit : ../../three/archipeo/landLinks.test.ts.
import { describe, expect, it } from 'vitest';
import { LINK_PRICE } from '../archipelago';
import { bridgeEdge, firstClosed, landById, landOf, landPrice, landsAfter, linkedLands, nodeLands, openLands, placesOfLands, PRICE_PER_PLACE } from './lands';
import { PATH_EDGES, PLACES } from './plan6e';
import { planFor } from './levelPlan';

/** Le plan du 6e, le seul enregistré (GD-22). */
const PLAN = planFor('6e');
const LANDS = PLAN.lands;
const LINKED_LANDS = linkedLands(PLAN);
const NODE_LANDS = nodeLands(PLAN);

describe('Les cinq terres', () => {
  it('chaque lieu est dans une terre et une seule, chaque terre se trouve par son nom (les « ! » de landById et landOf sont sûrs : relecture de l’expert frontend)', () => {
    const all = LANDS.flatMap((l) => l.places);
    expect(new Set(all).size).toBe(all.length);
    expect(new Set(all)).toEqual(new Set(PLACES.map((p) => p.id)));
    for (const p of PLACES) expect(LANDS.filter((l) => l.places.includes(p.id)), p.id).toHaveLength(1);
    for (const l of LANDS) expect(landById(l.id)).toBe(l);
  });

  it('sans les quatre ponts, le réseau fait exactement cinq morceaux, chacun avec les lieux de sa terre', () => {
    expect(new Set(NODE_LANDS.values())).toEqual(new Set(LANDS.map((l) => l.id)));
    for (const p of PLACES) expect(NODE_LANDS.get(p.door), p.id).toBe(landOf(p.id));
  });

  it('chaque pont est le seul passage entre sa terre et celle d’avant ; aucune autre liaison ne passe d’une terre à l’autre', () => {
    const bridges = new Set(LINKED_LANDS.map((l) => bridgeEdge(PLAN, l)));
    expect(bridges.size).toBe(4);
    PATH_EDGES.forEach(([a, b], i) => {
      const ends = new Set([NODE_LANDS.get(a), NODE_LANDS.get(b)]);
      if (!bridges.has(i)) expect(ends.size, `${a}–${b}`).toBe(1);
    });
    for (const land of LINKED_LANDS) {
      const [a, b] = PATH_EDGES[bridgeEdge(PLAN, land)];
      expect(new Set([NODE_LANDS.get(a), NODE_LANDS.get(b)])).toEqual(new Set([land, landById(land).after]));
    }
  });

  it('seize lieux, 4 + 3 + 2 + 3 + 4 ; 48 ressources pour tout relier, au prix d’une liaison du 6e par lieu', () => {
    expect(LANDS.map((l) => l.places.length)).toEqual([4, 3, 2, 3, 4]);
    expect(LANDS.flatMap((l) => l.places).sort()).toEqual(PLACES.map((p) => p.id).sort());
    expect(LINKED_LANDS.map(landPrice)).toEqual([12, 8, 12, 16]);
    expect(LINKED_LANDS.reduce((s, l) => s + landPrice(l), 0)).toBe(48);
    expect(PRICE_PER_PLACE).toBe(LINK_PRICE['6e']);
  });

  it('l’ordre : le Couchant et le Levant d’abord, le Large après le Couchant, les Crêtes après le Levant', () => {
    expect(LANDS.map((l) => [l.id, l.after])).toEqual([
      ['pointe', null],
      ['couchant', 'pointe'],
      ['large', 'couchant'],
      ['levant', 'pointe'],
      ['cretes', 'levant'],
    ]);
    expect(firstClosed('large', ['couchant', 'large'])).toBe('couchant');
    expect(firstClosed('large', ['large'])).toBe('large');
    expect(landsAfter('levant', ['levant', 'cretes'])).toEqual(['cretes']);
    expect(landsAfter('levant', ['levant'])).toEqual([]);
    // Une terre ouverte ouvre celle d'avant : un lieu du Large joué ouvre le Couchant.
    expect([...openLands(PLAN, (id) => id === 'ferry')].sort()).toEqual(['couchant', 'large', 'pointe']);
  });

  it('placesOfLands rend les lieux des terres dans l’ordre du plan', () => {
    expect(placesOfLands(PLAN, ['large'])).toEqual(['beacons', 'ferry']);
  });
});

