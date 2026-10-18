import { describe, expect, it } from 'vitest';
import { NEF_BANC, NEF_DEPARTURE, NEF_TEMPS_PARTS, bancFacets, bancTouched, berFacets, nefArrivingParts, nefBerthWorld, nefDeparture, nefLook, nefShownParts, nefSiteTriangles, nefTouched } from './nef';
import { PASS, PORT, PORT_PAVING } from './plan6e';
import { heightAt } from './terrain';

describe('la Nef du monde continu (GD-21)', () => {
  it('se montre en trois temps, la voile seulement sur une Nef dont toutes les cases sont posées', () => {
    expect(nefLook({ hull: false, all: false, sail: true, departed: false })).toBe(0);
    expect(nefLook({ hull: true, all: false, sail: true, departed: false })).toBe(1);
    expect(nefLook({ hull: true, all: true, sail: false, departed: false })).toBe(2);
    expect(nefLook({ hull: true, all: true, sail: true, departed: false })).toBe(3);
    expect(nefLook({ hull: true, all: true, sail: true, departed: true })).toBe(4);
  });

  it('montre les parties des temps faits, et fait arriver celles des temps nouveaux', () => {
    expect(nefShownParts(0)).toEqual([]);
    expect(nefShownParts(1)).toEqual(NEF_TEMPS_PARTS[1]);
    expect(nefShownParts(3)).toEqual([...NEF_TEMPS_PARTS[1], ...NEF_TEMPS_PARTS[2], ...NEF_TEMPS_PARTS[3]]);
    expect(nefShownParts(4)).toEqual([]);
    expect(nefArrivingParts(1, 3)).toEqual([...NEF_TEMPS_PARTS[2], ...NEF_TEMPS_PARTS[3]]);
    expect(nefArrivingParts(2, 1)).toEqual([]);
    expect(nefArrivingParts(3, 4)).toEqual([]);
  });

  it('a son poste dans l’eau, à l’ouest du quai, et une cible large', () => {
    const at = nefBerthWorld();
    expect(heightAt(at)).toBeLessThan(0);
    expect(PORT.toLocal(at).x).toBeLessThan(PORT_PAVING.quay.x0);
    expect(nefTouched(at)).toBe(true);
    expect(nefTouched(PORT.toWorld(PORT_PAVING.quay.x1, 0))).toBe(false);
  });

  it('a son banc au-delà de la passe, sur l’eau, plus haut que la terre la plus haute', () => {
    const westOfPass = Math.min(...PASS.map((p) => p.x));
    let top = -Infinity;
    for (let x = -250; x <= 250; x += 4) for (let z = -250; z <= 250; z += 4) top = Math.max(top, heightAt({ x, z }));
    for (const v of NEF_BANC) {
      expect(v.x + v.r).toBeLessThan(westOfPass);
      expect(heightAt(v)).toBeLessThan(0);
      expect(v.h - 1).toBeGreaterThan(top);
      expect(bancTouched(v)).toBe(true);
    }
    expect(bancTouched(nefBerthWorld())).toBe(false);
  });

  it('part de son poste vers le large, toujours sur l’eau, au-delà du banc, et le banc se retire', () => {
    const start = nefDeparture(0);
    expect(start.x).toBeCloseTo(nefBerthWorld().x);
    expect(start.bancShift).toBe(0);
    for (let i = 0; i <= 200; i++) expect(heightAt(nefDeparture(i / 200))).toBeLessThan(0);
    const end = nefDeparture(1);
    expect(end.x).toBeLessThan(Math.min(...NEF_BANC.map((v) => v.x)));
    expect(end.bancShift).toBe(NEF_DEPARTURE.bancShift);
    expect(NEF_DEPARTURE.seconds).toBeLessThanOrEqual(8);
  });

  it('coûte peu : le ber, la bouée et le banc', () => {
    const { ber, banc } = nefSiteTriangles();
    expect(berFacets(0).triangles).toBeLessThan(ber);
    expect(banc).toBe(bancFacets(30).triangles);
    expect(ber + banc).toBeLessThan(800);
  });
});
