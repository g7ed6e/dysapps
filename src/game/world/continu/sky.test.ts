// La lumière et le ciel du monde continu (GD-20, point 3, lot 3, premier levier graphique).
import { expect, test } from 'vitest';
import { linearRgb } from './geometry';
import { HORIZON_COLOR, LIGHT, SHADOW_DIR, SKY_DOME, skyColorAt, skyDome } from './sky';

test('le dôme du ciel : crème à l’horizon (la couleur de la brume du lointain), bleu en haut, sans trou', () => {
  const d = skyDome(450);
  const { sides, rows } = SKY_DOME;
  expect(d.triangles).toBe(sides * (2 * (rows.length - 2) + 1));
  expect(d.colors.length).toBe(d.positions.length);
  for (let k = 0; k < d.positions.length; k += 3) expect(Math.hypot(d.positions[k], d.positions[k + 1], d.positions[k + 2])).toBeCloseTo(450, 3);
  expect(skyColorAt(0)).toEqual(linearRgb(HORIZON_COLOR));
  expect(skyColorAt(-20)).toEqual(linearRgb(HORIZON_COLOR));
  const top = skyColorAt(90);
  // En haut, plus bleu que rouge ; à l'horizon, plus rouge que bleu (la crème).
  expect(top[2]).toBeGreaterThan(top[0]);
  const low = skyColorAt(0);
  expect(low[0]).toBeGreaterThan(low[2]);
  // Jamais sombre : chaque couleur du ciel reste claire.
  for (let e = 0; e <= 90; e += 5) expect(Math.max(...skyColorAt(e))).toBeGreaterThan(0.3);
});

test('le soleil, plus bas qu’avant, à l’est ; l’ambiance garde le tiers de la lumière (jamais presque noir) ; les ombres peintes tombent à l’opposé', () => {
  const { x, y, z } = LIGHT.sunFrom;
  const elevation = (Math.atan2(y, Math.hypot(x, z)) * 180) / Math.PI;
  // Rasant (lot commun des scénettes) : entre 20° et 26°.
  expect(elevation).toBeGreaterThan(20);
  expect(elevation).toBeLessThan(26);
  expect(x).toBeGreaterThan(0);
  const up = y / Math.hypot(x, y, z);
  expect(LIGHT.ambient / (LIGHT.ambient + LIGHT.sunIntensity * up)).toBeGreaterThan(0.3);
  expect(SHADOW_DIR.x).toBeLessThan(0);
  expect(Math.hypot(SHADOW_DIR.x, SHADOW_DIR.z)).toBeCloseTo(1, 6);
});
