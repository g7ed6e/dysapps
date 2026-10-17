// La pose d'un pont (GD-20, point 3, « La pose ») : les piles se relèvent, puis le tablier s'avance, puis les
// garde-corps et les lanternes montent, environ 3 s jusqu'au toc ; la brume se lève ensuite. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { BRIDGE_LAY, bridgeLay, bridgeLayAt, bridgeLayDrawn, bridgeLayPositions, type BridgeLayState } from './bridgeLay';
import { bridgeFacets, bridgeLayRest, bridgeParts, bridgeSite } from './bridges';
import { LINKED_LANDS } from './lands';
import { veilFacets } from './veil';

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
