// Le Détour du Cadran (le Versant du 3e, GD-25, lot 2) : sa place réservée à l'ouest du Jardin, hors des chemins, loin des
// rives et de la langue de glace ; sa sente depuis le chemin de ve-1 à ve-2, libre et marchable ; la vue au cap de 8°, le
// pic et, à sa droite, le Fanal ; le rocher rond, le disque uni, le style de fer et son ombre, trois pierres ; ses 175
// triangles, sa sauvegarde, la phrase de Kéo.
import { describe, expect, it } from 'vitest';
import { DETOUR_IDS as SAVED_IDS, sanitizeDetours } from '../../engine/detours';
import { CADRAN, CADRAN_BUDGET, CADRAN_LAYOUT, CADRAN_STONES, cadranFacets, cadranStoneAt } from './cadran3e';
import { DETOURS_3E, DETOUR_IDS, detourAtPoint, detourById, detourCap, detourViewOf } from './detours';
import type { Facets } from './facets';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { NETWORK_3E } from './paths3e';
import { C3E } from './place3eKit';
import { DETOUR_SPOTS_3E, PATH_EDGES_3E, PEAK_3E, PLACES_3E, TERRAIN_3E } from './plan3e';
import { buildHeightField3e, ground3e, landDistance3e, langueClearance, obstaclesIn3e, walkBlocked3e } from './terrain3e';

const ground = ground3e(buildHeightField3e());
const node = (id: string) => NETWORK_3E.pathNode(id).at;
const EDGES = PATH_EDGES_3E.map(([a, b]) => [node(a), node(b)]);
const pathDistance = (p: { x: number; z: number }) => Math.min(...EDGES.map((l) => distanceToPolyline(p, l)));
const capTo = (from: { x: number; z: number }, to: { x: number; z: number }) => ((Math.atan2(to.x - from.x, -(to.z - from.z)) * 180) / Math.PI + 360) % 360;

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

describe('Le Cadran, le Détour du Versant', () => {
  it('se nomme « Le Cadran », au Versant, dans la sauvegarde à la fin ; Kéo dit sa phrase, écrite sous le nom', () => {
    expect(detourById('cadran')).toBe(CADRAN);
    expect(DETOURS_3E).toEqual([CADRAN]);
    expect(CADRAN.name).toBe('Le Cadran');
    expect(CADRAN.land).toBe('versant');
    expect(SAVED_IDS).toEqual(DETOUR_IDS);
    expect(DETOUR_IDS.at(-1)).toBe('cadran');
    expect(DETOUR_IDS.at(-2)).toBe('replat');
    expect(sanitizeDetours(['cadran', 'replat'])).toEqual(['replat', 'cadran']);
    expect(CADRAN.says).toBe('Ici, l’ombre disait l’heure.');
    expect(CADRAN.saysAloudOnly).toBeUndefined();
    expect(CADRAN.says).not.toMatch(/vide|chute|tomb|vertige|phare/i);
  });

  it('se tient devant sa place réservée, hors des chemins, loin des lieux, des rives et de la langue de glace', () => {
    const at = CADRAN.at;
    expect(distance(at, DETOUR_SPOTS_3E.cadran)).toBeLessThanOrEqual(4);
    expect(walkBlocked3e(at)).toBe(false);
    expect(pathDistance(at)).toBeGreaterThan(10);
    expect(pathDistance(DETOUR_SPOTS_3E.cadran)).toBeGreaterThan(10);
    for (const p of PLACES_3E) expect(distance(p.center, at), p.id).toBeGreaterThan(25);
    expect(landDistance3e(at)).toBeGreaterThan(20);
    expect(langueClearance(at)).toBeGreaterThan(20);
    expect(detourAtPoint(at, '3e')).toBe(CADRAN);
    expect(detourAtPoint(at, '4e')).toBeNull();
  });

  it('à l’arrivée, la caméra se tourne au cap de 8° : le pic un peu à droite du milieu, le Fanal juste à sa droite', () => {
    const cap = detourCap(CADRAN)!;
    const look = { x: -Math.sin(cap), z: -Math.cos(cap) };
    const deg = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(deg).toBeCloseTo(8, 6);
    const peak = capTo(CADRAN.at, PEAK_3E.at);
    const fanal = capTo(CADRAN.at, PLACES_3E.find((p) => p.id === 'fanal')!.center);
    expect(peak).toBeGreaterThan(deg);
    expect(peak - deg).toBeLessThan(10);
    expect(fanal).toBeGreaterThan(peak);
    expect(fanal - deg).toBeLessThan(15);
    expect(detourViewOf(CADRAN).height).toBeLessThanOrEqual(0);
  });

  it('le rocher devant Kéo, à droite de lui dans la vue (jamais caché derrière lui), assez loin pour qu’il ne s’y cogne pas', () => {
    const R = CADRAN_LAYOUT.rock;
    expect(distance(R.at, CADRAN.at) - R.r0).toBeGreaterThan(1.4);
    const off = capTo(CADRAN.at, R.at) - 8;
    expect(off).toBeGreaterThan(20);
    expect(off).toBeLessThan(45);
  });

  it('sa sente part du chemin de ve-1 à ve-2, et reste libre et marchable, sans un pin ni un bloc', () => {
    const [start, end] = CADRAN.sente;
    expect(distanceToPolyline(start, [node('ve-1'), node('ve-2')])).toBeLessThan(0.3);
    expect(end).toEqual(CADRAN.at);
    const len = distance(start, end);
    for (let t = 0; t <= len; t += 0.5) {
      const p = { x: start.x + ((end.x - start.x) * t) / len, z: start.z + ((end.z - start.z) * t) / len };
      expect(walkBlocked3e(p), `${t}`).toBe(false);
    }
    const tile = TERRAIN_3E.step * TERRAIN_3E.tileCells;
    const xs = [Math.min(start.x, end.x, CADRAN_LAYOUT.rock.at.x) - 8, Math.max(start.x, end.x, CADRAN_LAYOUT.rock.at.x) + 8];
    const zs = [Math.min(start.z, end.z, CADRAN_LAYOUT.rock.at.z) - 8, Math.max(start.z, end.z, CADRAN_LAYOUT.rock.at.z) + 8];
    for (let tx = Math.floor((xs[0] - TERRAIN_3E.minX) / tile); tx <= Math.floor((xs[1] - TERRAIN_3E.minX) / tile); tx++)
      for (let tz = Math.floor((zs[0] - TERRAIN_3E.minZ) / tile); tz <= Math.floor((zs[1] - TERRAIN_3E.minZ) / tile); tz++)
        for (const o of obstaclesIn3e(tx, tz)) {
          expect(distanceToPolyline(o, CADRAN.sente) - o.r, `${o.x},${o.z}`).toBeGreaterThan(0.8);
          expect(distance(o, CADRAN_LAYOUT.rock.at) - o.r, `${o.x},${o.z}`).toBeGreaterThan(CADRAN_LAYOUT.rock.r0 + 1);
        }
  });

  it('ses trois pierres entourent Kéo, de part et d’autre de la sente, jamais dessus ni sous le rocher', () => {
    const sides = new Set<number>();
    for (let k = 0; k < CADRAN_STONES.length; k++) {
      const p = cadranStoneAt(k);
      expect(distanceToPolyline(p, CADRAN.sente), String(k)).toBeGreaterThan(1);
      expect(distance(p, CADRAN.at), String(k)).toBeLessThan(4);
      expect(distance(p, CADRAN_LAYOUT.rock.at), String(k)).toBeGreaterThan(CADRAN_LAYOUT.rock.r0 + 0.4);
      sides.add(Math.sign(CADRAN_STONES[k].deg));
    }
    expect(sides.size).toBe(2);
  });

  it('coûte 175 triangles au plus sans sa sente ; ni lanterne, ni bronze ; la sente se trace une fois trouvée', () => {
    const hidden = cadranFacets(false, ground);
    expect(CADRAN_BUDGET.triangles).toBe(175);
    expect(hidden.triangles).toBeLessThanOrEqual(CADRAN_BUDGET.triangles);
    expect(countColor(hidden, C3E.lantern)).toBe(0);
    expect(countColor(hidden, C3E.bronze)).toBe(0);
    // Le style de fer bruni et son ombre fine, plus sombre que le disque, jamais presque noire.
    expect(countColor(hidden, C3E.iron)).toBeGreaterThan(0);
    expect(countColor(hidden, CADRAN_LAYOUT.colors.shadow)).toBe(6);
    const s = CADRAN_LAYOUT.colors.shadow;
    expect(Math.min((s >> 16) & 255, (s >> 8) & 255, s & 255)).toBeGreaterThan(0x60);
    const traced = cadranFacets(true, ground);
    expect(traced.triangles).toBeGreaterThan(hidden.triangles);
    expect(traced.triangles - hidden.triangles).toBeLessThanOrEqual(CADRAN_BUDGET.sente);
  });
});
