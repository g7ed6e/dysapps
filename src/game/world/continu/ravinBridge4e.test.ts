// Le pont du ravin en arche (les Coteaux du 4e ; intention du directeur artistique du 22 octobre 2026, § 2) : tombé, ses
// culées et ses départs brisés, sans moignon de pile ni lanterne, trois claveaux dans le lit sec, les rails arrêtés au bord
// des culées ; relié, l'arche qui se lit de côté, le tablier réglé sur les berges (sans marche, en dos d'âne), les rails
// de la ligne d'un seul tenant, le dallage au sud, deux parapets et quatre lanternes ; la pose en trois temps ; son
// plafond. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { RAVIN_BRIDGE_TRIANGLES_MAX_4E } from './budget';
import { KEO_HEIGHT } from './camera';
import { bridgeLay } from './bridgeLay';
import { bridgeDeck, bridgeFacets, bridgeFloor, bridgeLayRest, bridgeMapMark, bridgeParts, bridgeSite, stumpPile } from './bridges';
import type { Facets } from './facets';
import { linearRgb } from './geometry';
import { planFor } from './levelPlan';
import { RAILS_LOOK_4E } from './paths4e';
import { C4E } from './place4eKit';
import { COLORS_4E } from './plan4e';
import { RAVIN_ARCH, ravinDeckAt } from './ravinBridge4e';
import { standingHeight } from './terrain';
import { buildHeightField4e, heightAt4e, ravinClearance } from './terrain4e';

const PLAN = planFor('4e');
const S = bridgeSite('coteaux');
const along = (x: number, z: number) => (x - S.near.x) * S.dir.x + (z - S.near.z) * S.dir.z;
const across = (x: number, z: number) => -(x - S.near.x) * S.dir.z + (z - S.near.z) * S.dir.x;

/** Les sommets d'une couleur exacte : leur place sur la ligne du pont (`d`, `v`) et leur hauteur. */
function verticesOf(f: Facets, color: number): { d: number; v: number; y: number }[] {
  const [r, g, b] = linearRgb(color);
  const out: { d: number; v: number; y: number }[] = [];
  for (let i = 0; i < f.colors.length; i += 3)
    if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) {
      const x = f.positions[i],
        y = f.positions[i + 1],
        z = f.positions[i + 2];
      out.push({ d: along(x, z), v: across(x, z), y });
    }
  return out;
}

const FALLEN = bridgeFacets('coteaux', false);
const BUILT = bridgeFacets('coteaux', true);
const ARCH = [S.water[0] + RAVIN_ARCH.spring, S.water[1] - RAVIN_ARCH.spring] as const;

describe('Le pont du ravin tombé', () => {
  it('les culées et deux départs brisés, plus court côté Coteaux ; aucun moignon de pile au milieu du creux', () => {
    const stone = [...verticesOf(FALLEN, C4E.stone), ...verticesOf(FALLEN, C4E.stoneShade)];
    const span = ARCH[1] - ARCH[0];
    // Au milieu du creux, rien de debout : seuls les claveaux couchés dans le lit, plus bas que les berges.
    const middle = stone.filter((p) => p.d > ARCH[0] + span * 0.32 && p.d < ARCH[1] - span * 0.18);
    for (const p of middle) expect(p.y, p.d.toFixed(1)).toBeLessThan(Math.min(S.base[0], S.base[1]) - 0.1);
    // Le départ côté Fabriques (près de `near`) va plus loin que celui des Coteaux.
    const vault = verticesOf(FALLEN, C4E.stoneShade).filter((p) => p.d > ARCH[0] && p.d < ARCH[1]);
    const east = Math.max(...vault.filter((p) => p.d < (ARCH[0] + ARCH[1]) / 2).map((p) => p.d)) - ARCH[0];
    const west = ARCH[1] - Math.min(...vault.filter((p) => p.d > (ARCH[0] + ARCH[1]) / 2).map((p) => p.d));
    expect(east).toBeGreaterThan(west);
    expect(east).toBeGreaterThan(1);
  });

  it('ni lanterne ni mât ; la pierre grise du 4e', () => {
    expect(verticesOf(FALLEN, C4E.lantern)).toHaveLength(0);
    expect(verticesOf(FALLEN, C4E.iron)).toHaveLength(0);
    expect(verticesOf(FALLEN, COLORS_4E.stone).length).toBeGreaterThan(0);
  });

  it('les rails s’arrêtent net au bord de chaque culée, leurs dernières traverses posées', () => {
    const rails = verticesOf(FALLEN, COLORS_4E.rust);
    expect(rails.some((p) => p.d > ARCH[0] + 0.01 && p.d < ARCH[1] - 0.01)).toBe(false);
    expect(Math.max(...rails.filter((p) => p.d < ARCH[0]).map((p) => p.d))).toBeCloseTo(ARCH[0], 1);
    expect(Math.min(...rails.filter((p) => p.d > ARCH[1]).map((p) => p.d))).toBeCloseTo(ARCH[1], 1);
    const sleepers = verticesOf(FALLEN, COLORS_4E.wood);
    expect(sleepers.some((p) => p.d > ARCH[0] - 1.6 && p.d < ARCH[0])).toBe(true);
    expect(sleepers.some((p) => p.d > ARCH[1] && p.d < ARCH[1] + 1.6)).toBe(true);
  });

  it('le lit du ravin reste sec de loin : le terrain de loin, abaissé sous le chemin du pont, ne passe jamais sous la mer (retouche 1)', () => {
    const f = buildHeightField4e();
    let bed = 0;
    for (let j = 0; j < f.nz; j++)
      for (let i = 0; i < f.nx; i++) {
        const r = j * f.nx + i;
        if (f.heights[r] <= 0) continue;
        expect(f.far[r], `${(f.minX + i * f.step).toFixed(1)} ${(f.minZ + j * f.step).toFixed(1)}`).toBeGreaterThan(0);
        if (ravinClearance({ x: f.minX + i * f.step, z: f.minZ + j * f.step }) < 0) bed++;
      }
    expect(bed).toBeGreaterThan(0);
  });
});

describe('Le pont du ravin relié', () => {
  it('le tablier se règle sur les deux berges : ni le chemin ni les rails ne font de marche aux culées', () => {
    for (const side of [0, 1] as const) {
      const d = S.abut[side];
      const ground = standingHeight(heightAt4e({ x: S.near.x + S.dir.x * d, z: S.near.z + S.dir.z * d }));
      expect(Math.abs(ravinDeckAt(S, d) - ground)).toBeLessThan(0.15);
    }
    expect(bridgeDeck('coteaux')).toBeCloseTo(ravinDeckAt(S, (S.water[0] + S.water[1]) / 2), 6);
    // Le dos d'âne (retouche 1) : une pente douce d'un bout à l'autre, où l'on marche, et un tablier bas.
    for (let d = S.abut[0]; d < S.abut[1]; d += 0.25) expect(Math.abs(ravinDeckAt(S, d + 0.25) - ravinDeckAt(S, d)) / 0.25, d.toFixed(2)).toBeLessThan(0.2);
    expect(bridgeDeck('coteaux')).toBeLessThan(Math.max(...S.base) + 1);
  });

  it('l’arche se lit de côté (retouche 1) : son intrados creusé à mi-hauteur de Kéo au moins au-dessus du lit sec, une arche et non une poutre', () => {
    const vault = verticesOf(BUILT, C4E.stoneShade).filter((p) => p.d > ARCH[0] - 0.01 && p.d < ARCH[1] + 0.01);
    const mid = (ARCH[0] + ARCH[1]) / 2;
    const crown = Math.max(...vault.filter((p) => Math.abs(p.d - mid) < 0.6).map((p) => p.y));
    const bed = heightAt4e({ x: S.near.x + S.dir.x * mid, z: S.near.z + S.dir.z * mid });
    expect(crown - bed).toBeGreaterThanOrEqual(KEO_HEIGHT / 2);
    expect((crown - bed) / (ARCH[1] - ARCH[0])).toBeGreaterThan(0.2);
    // Les culées s'avancent dans le lit, de part et d'autre de l'arche.
    expect(ARCH[0]).toBeGreaterThan(S.water[0] + 1);
    expect(ARCH[1]).toBeLessThan(S.water[1] - 1);
  });

  it('Kéo se tient sur les culées toujours, sur le tablier et son dallage seulement relié', () => {
    const at = (d: number, v: number) => ({ x: S.near.x + S.dir.x * d - S.dir.z * v, z: S.near.z + S.dir.z * d + S.dir.x * v });
    const mid = at((ARCH[0] + ARCH[1]) / 2, 0);
    const paving = at((ARCH[0] + ARCH[1]) / 2, -2.4);
    const culee = at((S.abut[0] + ARCH[0]) / 2, 0);
    expect(bridgeFloor(mid.x, mid.z, ['coteaux'], PLAN)).toBeNull();
    expect(bridgeFloor(culee.x, culee.z, ['coteaux'], PLAN)).not.toBeNull();
    expect(bridgeFloor(mid.x, mid.z, [], PLAN)).toBeCloseTo(ravinDeckAt(S, (ARCH[0] + ARCH[1]) / 2), 6);
    expect(bridgeFloor(paving.x, paving.z, [], PLAN)).not.toBeNull();
  });

  it('l’arche entière et sa voûte plus sombre ; les rails de la ligne d’une culée à l’autre, dans l’axe ; le dallage au sud', () => {
    const vault = verticesOf(BUILT, C4E.stoneShade).filter((p) => p.d > ARCH[0] - 0.01 && p.d < ARCH[1] + 0.01);
    expect(Math.min(...vault.map((p) => p.d))).toBeCloseTo(ARCH[0], 1);
    expect(Math.max(...vault.map((p) => p.d))).toBeCloseTo(ARCH[1], 1);
    const rails = verticesOf(BUILT, COLORS_4E.rust);
    for (const p of rails) expect(Math.abs(p.v)).toBeLessThan(RAILS_LOOK_4E.gauge);
    expect(rails.some((p) => p.d > ARCH[0] && p.d < ARCH[1])).toBe(true);
    const paving = verticesOf(BUILT, C4E.paving);
    expect(paving.length).toBeGreaterThan(0);
    for (const p of paving) expect(p.v).toBeLessThan(-RAILS_LOOK_4E.ballast + 1e-6);
  });

  it('deux parapets bas et quatre lanternes, une à chaque bout de chaque parapet, hors du gabarit de la voie', () => {
    const lit = verticesOf(BUILT, C4E.lantern);
    // Une lanterne (la lanterne commune des ponts, ./bridges.ts) : un verre en pavé de cinq faces, trente sommets (deux triangles par face), jamais en deçà du bord du ballast.
    expect(lit).toHaveLength(4 * 30);
    for (const p of lit) expect(Math.abs(p.v)).toBeGreaterThanOrEqual(RAILS_LOOK_4E.ballast - 1e-6);
    const ends = new Set(lit.map((p) => `${p.d < (ARCH[0] + ARCH[1]) / 2 ? 'est' : 'ouest'} ${p.v > 0 ? 'nord' : 'sud'}`));
    expect(ends.size).toBe(4);
  });

  it('la pose : les deux moitiés de l’arche puis la clé, le tablier, puis les parapets et les lanternes ; aucun moignon', () => {
    const parts = bridgeParts('coteaux');
    expect(parts.piles).toHaveLength(3);
    for (const k of [0, 1, 2]) expect(stumpPile('coteaux', k)).toBe(false);
    const lay = bridgeLay('coteaux');
    expect(lay.facets.triangles + bridgeLayRest('coteaux').triangles).toBe(BUILT.triangles);
    expect(verticesOf(parts.rails, C4E.lantern).length).toBe(4 * 30);
  });

  it('sur la Carte, en trait double au-dessus de son tablier', () => {
    const mark = bridgeMapMark('coteaux');
    let low = Infinity;
    for (let i = 1; i < mark.positions.length; i += 3) low = Math.min(low, mark.positions[i]);
    expect(low).toBeGreaterThan(bridgeDeck('coteaux'));
    expect(low).toBeLessThan(bridgeDeck('coteaux') + 2);
  });

  it('coûte au plus son plafond, tombé comme relié', () => {
    expect(RAVIN_BRIDGE_TRIANGLES_MAX_4E).toBe(1_200);
    expect(FALLEN.triangles).toBeLessThanOrEqual(RAVIN_BRIDGE_TRIANGLES_MAX_4E);
    expect(BUILT.triangles).toBeLessThanOrEqual(RAVIN_BRIDGE_TRIANGLES_MAX_4E);
  });
});
