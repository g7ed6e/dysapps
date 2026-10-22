// La pose d'un pont (GD-20, point 3, « La pose ») : les piles se relèvent, puis le tablier s'avance, puis les
// garde-corps et les lanternes montent, environ 3 s jusqu'au toc ; la brume se lève ensuite. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { BRIDGE_LAY, SWING_LAY, bridgeLay, bridgeLayAt, bridgeLayColors, bridgeLayDrawn, bridgeLayPositions, type BridgeLayState } from './bridgeLay';
import { bridgeFacets, bridgeLayRest, bridgeParts, bridgeSite, swingRuin } from './bridges';
import { linearRgb } from './geometry';
import { linkedLands } from './lands';
import { veilFacets } from './veil';
import { planFor } from './levelPlan';

/** Le plan du 6e, le seul enregistré (GD-22). */
const PLAN = planFor('6e');
const LINKED_LANDS = linkedLands(PLAN);

const state = (): BridgeLayState => ({ landed: false, fade: 0, done: false });

describe('La pose d’un pont', () => {
  it('ce qui se relève et ce qui reste en place font le pont rebâti, sans les moignons', () => {
    for (const land of LINKED_LANDS) {
      const lay = bridgeLay(land);
      const rest = bridgeLayRest(land);
      const fallen = bridgeFacets(land, false);
      // Les culées et les départs d'arche restent ; les moignons laissent la place aux piles.
      expect(rest.triangles, land).toBeLessThan(fallen.triangles);
      const built = bridgeFacets(land, true);
      const parts = bridgeParts(land);
      expect(lay.facets.triangles, land).toBe(parts.piles.reduce((n, f) => n + f.triangles, 0) + parts.deck.triangles + parts.rails.triangles);
      expect(lay.facets.triangles, land).toBeLessThan(built.triangles);
      // Au plus environ 1 200 triangles à part le temps de la pose.
      expect(lay.facets.triangles, land).toBeLessThan(1200);
    }
  });

  it('environ 3 s jusqu’au toc, un seul toc, puis le fondu de la brume', () => {
    for (const land of LINKED_LANDS) {
      const lay = bridgeLay(land);
      expect(lay.landed, land).toBeGreaterThan(2.5);
      expect(lay.landed, land).toBeLessThan(3.5);
      const out = state();
      let taps = 0;
      let was = false;
      for (let u = 0; u <= lay.landed + BRIDGE_LAY.fade + 0.2; u += 1 / 60) {
        bridgeLayAt(lay, u, out);
        if (out.landed && !was) taps++;
        was = out.landed;
        if (!out.landed) expect(out.fade).toBe(0);
      }
      expect(taps, land).toBe(1);
      expect(out.fade).toBe(1);
      expect(out.done).toBe(true);
      expect(bridgeLayAt(lay, lay.landed - 0.01, state()).landed).toBe(false);
    }
  });

  it('les piles d’abord, puis le tablier, puis les garde-corps et les lanternes ; à la fin, tout est à sa place', () => {
    const lay = bridgeLay('couchant');
    const n = lay.facets.positions.length / 3;
    const out = new Float32Array(lay.facets.positions.length);
    // Au début : seules les piles se dessinent, toutes sous l'eau ou au haut de leur moignon.
    expect(bridgeLayDrawn(lay, 0)).toBe(lay.ends[0]);
    bridgeLayPositions(lay, 0, out);
    for (let i = 0; i < lay.ends[0]; i++) expect(out[i * 3 + 1]).toBeLessThan(lay.facets.positions[i * 3 + 1] - 0.3);
    const pilesEnd = lay.landed - BRIDGE_LAY.deck - BRIDGE_LAY.rails;
    // Les piles debout : le tablier vient ; à mi-chemin, il ne dépasse pas le milieu du bras de mer de beaucoup.
    expect(bridgeLayDrawn(lay, pilesEnd + 0.01)).toBe(lay.ends[1]);
    bridgeLayPositions(lay, pilesEnd + BRIDGE_LAY.deck / 4, out);
    const s = bridgeSite('couchant');
    let far = -Infinity;
    for (let i = lay.ends[0]; i < lay.ends[1]; i++) far = Math.max(far, (out[i * 3] - s.near.x) * s.dir.x + (out[i * 3 + 2] - s.near.z) * s.dir.z);
    expect(far).toBeLessThan(lay.deck[1] - 2);
    expect(bridgeLayDrawn(lay, pilesEnd + BRIDGE_LAY.deck + 0.01)).toBe(n);
    // Au toc : tout à sa place.
    bridgeLayPositions(lay, lay.landed, out);
    for (let i = 0; i < out.length; i++) expect(out[i]).toBeCloseTo(lay.facets.positions[i], 4);
  });

  it('les sommets restent dans la boîte de la pose : les piles ne descendent pas plus bas que `sink`, rien ne monte au-dessus de sa place', () => {
    const lay = bridgeLay('levant');
    const rest = lay.facets.positions;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 1; i < rest.length; i += 3) {
      minY = Math.min(minY, rest[i]);
      maxY = Math.max(maxY, rest[i]);
    }
    const out = new Float32Array(rest.length);
    for (let u = 0; u <= lay.landed; u += 0.1) {
      bridgeLayPositions(lay, u, out);
      for (let i = 1; i < out.length; i += 3) {
        expect(out[i]).toBeGreaterThanOrEqual(minY - lay.sink - 1e-4);
        expect(out[i]).toBeLessThanOrEqual(maxY + 1e-4);
      }
    }
  });

  it('la brume de la terre qui se lève vient en dernier dans le maillage', () => {
    const v = veilFacets(['couchant', 'large', 'levant'], 'couchant');
    const alone = veilFacets(['couchant']);
    expect(v.triangles).toBe(veilFacets(['large', 'levant', 'couchant']).triangles);
    expect(v.positions.length / 3 - v.fadingFrom).toBe(alone.triangles * 3);
    expect(Array.from(v.positions.slice(v.fadingFrom * 3))).toEqual(Array.from(alone.positions));
    expect(veilFacets(['large']).fadingFrom).toBe(veilFacets(['large']).triangles * 3);
  });
});

describe('La pose du pont tournant des docks (le bassin à flot du 4e)', () => {
  const lay = bridgeLay('bastion');
  const deckEnd = lay.ends[1];

  it('le toc à 3 s au plus, un seul ; la volée seule d’abord, puis les garde-corps et les lanternes', () => {
    expect(lay.landed).toBeLessThanOrEqual(3);
    expect(lay.swing).not.toBeNull();
    expect(bridgeLayDrawn(lay, 0)).toBe(deckEnd);
    expect(bridgeLayDrawn(lay, SWING_LAY.raise + SWING_LAY.turn - 0.01)).toBe(deckEnd);
    expect(bridgeLayDrawn(lay, SWING_LAY.raise + SWING_LAY.turn + 0.01)).toBe(lay.facets.positions.length / 3);
    const out = state();
    let taps = 0;
    let was = false;
    for (let u = 0; u <= lay.landed + BRIDGE_LAY.fade + 0.2; u += 1 / 60) {
      bridgeLayAt(lay, u, out);
      if (out.landed && !was) taps++;
      was = out.landed;
    }
    expect(taps).toBe(1);
  });

  it('elle part de la ruine (ouverte, affaissée, rouillée) et finit à sa place, au fer bruni', () => {
    const s = bridgeSite('bastion');
    const ruin = swingRuin(s);
    const out = new Float32Array(lay.facets.positions.length);
    const normals = new Float32Array(lay.facets.normals.length);
    bridgeLayPositions(lay, 0, out, normals);
    for (let i = 0; i < deckEnd * 3; i++) expect(out[i]).toBeCloseTo(ruin.positions[i], 4);
    for (let i = 0; i < deckEnd * 3; i++) expect(normals[i]).toBeCloseTo(ruin.normals[i], 4);
    bridgeLayPositions(lay, lay.landed, out, normals);
    for (let i = 0; i < out.length; i++) expect(out[i]).toBeCloseTo(lay.facets.positions[i], 4);
    for (let i = 0; i < deckEnd * 3; i++) expect(normals[i]).toBeCloseTo(lay.facets.normals[i], 4);
    const colors = new Float32Array(lay.facets.colors.length);
    expect(bridgeLayColors(lay, 0, colors)).toBe(0);
    const rust = linearRgb(0xaf6c55);
    expect(Array.from({ length: deckEnd }, (_, i) => i).some((i) => [0, 1, 2].every((k) => Math.abs(colors[i * 3 + k] - rust[k]) < 1e-6))).toBe(true);
    expect(bridgeLayColors(lay, SWING_LAY.raise, colors, 0)).toBe(1);
    for (let i = 0; i < colors.length; i++) expect(colors[i]).toBeCloseTo(lay.facets.colors[i], 6);
    // Le fondu fini et écrit, rien n'est plus à téléverser jusqu'à la fin de la pose.
    expect(bridgeLayColors(lay, SWING_LAY.raise + 0.5, colors, 1)).toBeNull();
    expect(bridgeLayColors(lay, lay.landed, colors, 1)).toBeNull();
    // Un pont à piles n'a pas de fondu.
    expect(bridgeLayColors(bridgeLay('coteaux'), 0, colors)).toBeNull();
  });

  it('un seul quart de tour, sans rebond : le bout libre se rapproche toujours de la culée d’en face ; tout reste dans la boîte', () => {
    const s = bridgeSite('bastion');
    const out = new Float32Array(lay.facets.positions.length);
    // Le sommet de la volée le plus loin du tambour.
    let far = 0;
    let best = -Infinity;
    for (let i = 0; i < deckEnd; i++) {
      const d = (lay.facets.positions[i * 3] - s.near.x) * s.dir.x + (lay.facets.positions[i * 3 + 2] - s.near.z) * s.dir.z;
      if (d > best) [best, far] = [d, i];
    }
    const target = { x: lay.facets.positions[far * 3], z: lay.facets.positions[far * 3 + 2] };
    let last = Infinity;
    const { min, max } = lay.swing!.bounds;
    for (let u = 0; u <= lay.landed + 1e-6; u += 1 / 30) {
      bridgeLayPositions(lay, u, out);
      // Le quart de tour, après le redressement (qui ne tourne pas).
      const gap = Math.hypot(out[far * 3] - target.x, out[far * 3 + 2] - target.z);
      if (u >= SWING_LAY.raise) {
        expect(gap).toBeLessThanOrEqual(last + 1e-4);
        last = gap;
      }
      for (let i = 0; i < deckEnd; i++)
        for (let k = 0; k < 3; k++) {
          expect(out[i * 3 + k]).toBeGreaterThanOrEqual(min[k] - 1e-3);
          expect(out[i * 3 + k]).toBeLessThanOrEqual(max[k] + 1e-3);
        }
    }
  });
});
