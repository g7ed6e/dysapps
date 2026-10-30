// Le cadre commun des veillées (GD-23, GD-27, lot 3) et les trois veillées du 6e : la caméra part de la caméra qui suit,
// sans saut, glisse lentement et sans à-coup, ne plonge jamais ; chaque plan cadre son lieu, la lanterne du Phare dans le
// haut de l'image ; avec « Réduire les animations », le dernier plan seul ; la ligne nomme le lieu.
import { describe, expect, it } from 'vitest';
import type { CameraPose } from './camera';
import { FERRY_ISLET, placeById } from './plan6e';
import PHRASES from './mondeOuvert.json';
import { heightAt, landDistance } from './terrain';
import { vigilPose, vigilScript, vigilSeconds, type Vigil } from './vigil';
import { FERRY_VIGIL_6E, PHARE_6E, PHARE_VIGIL_6E, vigil6e, vigilWords6e } from './vigils6e';

const blank = (): CameraPose => ({ position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 0, lens: 0 });
/** La caméra qui suit Kéo au quai de l'Escale, tournée vers le nord. */
const FROM: CameraPose = { position: { x: 2, y: 9.6, z: 104.7 }, target: { x: 2, y: 3.6, z: 95 }, fov: 56, lens: 0 };
/** La pente du regard sous l'horizon, en degrés. */
const pitch = (p: CameraPose): number => (Math.atan2(p.position.y - p.target.y, Math.hypot(p.target.x - p.position.x, p.target.z - p.position.z)) * 180) / Math.PI;
/** La hauteur à l'écran d'un point, en part de la demi-hauteur (0 au milieu, 1 au bord haut), depuis une pose. */
function screenY(p: CameraPose, at: { x: number; y: number; z: number }): number {
  const dx = p.target.x - p.position.x,
    dy = p.target.y - p.position.y,
    dz = p.target.z - p.position.z;
  const len = Math.hypot(dx, dy, dz);
  const f = { x: dx / len, y: dy / len, z: dz / len };
  const flat = Math.hypot(f.x, f.z);
  const up = { x: (-f.y * f.x) / flat, y: flat, z: (-f.y * f.z) / flat };
  const v = { x: at.x - p.position.x, y: at.y - p.position.y, z: at.z - p.position.z };
  const depth = v.x * f.x + v.y * f.y + v.z * f.z;
  const rise = v.x * up.x + v.y * up.y + v.z * up.z;
  return rise / depth / Math.tan((p.fov / 2) * (Math.PI / 180));
}

/** La caméra qui suit Kéo devant la porte de la Gare maritime, au retour de sa scénette. */
const FROM_FERRY: CameraPose = { position: { x: FERRY_ISLET.center.x + 1.2, y: 9.6, z: FERRY_ISLET.center.z + 13.1 }, target: { x: FERRY_ISLET.center.x + 1.2, y: 3.6, z: FERRY_ISLET.center.z + 3.4 }, fov: 56, lens: 0 };

const slow = (v: Vigil, from: CameraPose) => {
  let last = vigilPose(v, 0, from, blank());
  for (let t = 0.1; t <= vigilSeconds(v) + 0.5; t += 0.1) {
    const now = vigilPose(v, t, from, blank());
    // Au plus 1,3 unité par dixième de seconde (Kéo mesure 2,4) ; le regard descend de la pente de la caméra qui suit
    // (une trentaine de degrés) vers celle des plans, jamais à pic, jamais au-dessus de l'horizon.
    expect(Math.hypot(now.position.x - last.position.x, now.position.y - last.position.y, now.position.z - last.position.z), `${t}`).toBeLessThan(1.3);
    expect(pitch(now), `${t}`).toBeLessThan(36);
    expect(pitch(now), `${t}`).toBeGreaterThan(-5);
    last = now;
  }
};

describe('Le cadre commun des veillées', () => {
  it('part de la caméra qui suit, sans saut ; tient chaque plan le temps dit ; finit sur le dernier, qui est aussi l’image fixe', () => {
    const v = PHARE_VIGIL_6E;
    const p0 = vigilPose(v, 0, FROM, blank());
    expect(p0.position).toEqual(FROM.position);
    expect(Math.hypot(p0.target.x - FROM.target.x, p0.target.y - FROM.target.y, p0.target.z - FROM.target.z)).toBeLessThan(1e-9);
    expect(p0.fov).toBe(56);
    const [a, b] = v.shots;
    const held = vigilPose(v, a.travel + a.hold / 2, FROM, blank());
    expect(held.position).toEqual(a.position);
    const end = vigilPose(v, vigilSeconds(v) + 1, FROM, blank());
    expect(end.position).toEqual(b.position);
    const still = vigilPose(v, 0, FROM, blank(), true);
    expect(still.position).toEqual(b.position);
    expect(vigilSeconds(v)).toBe(a.travel + a.hold + b.travel + b.hold);
    const script = vigilScript(v);
    expect(script.seconds).toBe(vigilSeconds(v));
    expect(script.still).toBe(v.still);
    expect(script.pose(0, FROM, blank()).position).toEqual(FROM.position);
  });

  it('glisse lentement, sans à-coup, le regard jamais à pic ; chaque veillée dure moins de vingt secondes', () => {
    for (const [v, from] of [[PHARE_VIGIL_6E, FROM], [FERRY_VIGIL_6E, FROM_FERRY]] as const) {
      slow(v, from);
      for (const shot of v.shots) expect(pitch({ ...shot, fov: 56, lens: 0 })).toBeLessThan(25);
      expect(vigilSeconds(v)).toBeLessThan(20);
      expect(v.still).toBeGreaterThanOrEqual(6);
    }
  });
});

describe('Les veillées du 6e', () => {
  it('l’arrivée et le départ cadrent le Phare : la tour entière, sa lanterne dans le haut de l’image, la caméra au-dessus de l’eau', () => {
    const foot = { x: PHARE_6E.foot.x, y: PHARE_6E.ground, z: PHARE_6E.foot.z };
    const top = { x: PHARE_6E.foot.x, y: PHARE_6E.lantern.top, z: PHARE_6E.foot.z };
    expect(heightAt(PHARE_6E.foot)).toBeCloseTo(PHARE_6E.ground, 1);
    for (const shot of PHARE_VIGIL_6E.shots) {
      const p: CameraPose = { ...shot, fov: 56, lens: 0 };
      expect(screenY(p, top)).toBeGreaterThan(0.1);
      expect(screenY(p, top)).toBeLessThan(0.8);
      expect(screenY(p, foot)).toBeGreaterThan(-0.9);
      // La caméra au-dessus du lagon, jamais dans l'îlot ni dans la tour.
      expect(landDistance(shot.position)).toBeLessThan(0);
      expect(Math.hypot(shot.position.x - foot.x, shot.position.z - foot.z)).toBeGreaterThan(15);
    }
    expect(vigil6e('arrival')).toBe(PHARE_VIGIL_6E);
    expect(vigil6e('departure')).toBe(PHARE_VIGIL_6E);
  });

  it('l’embarquement cadre la Gare maritime, sur son îlot, depuis le large', () => {
    const c = FERRY_ISLET.center;
    for (const shot of FERRY_VIGIL_6E.shots) {
      const p: CameraPose = { ...shot, fov: 56, lens: 0 };
      expect(screenY(p, { x: c.x, y: 4, z: c.z })).toBeGreaterThan(-0.4);
      expect(screenY(p, { x: c.x, y: 4, z: c.z })).toBeLessThan(0.4);
      expect(Math.hypot(shot.position.x - c.x, shot.position.z - c.z)).toBeGreaterThan(FERRY_ISLET.radius + 8);
      expect(landDistance(shot.position)).toBeLessThan(0);
    }
    expect(vigil6e('boarding')).toBe(FERRY_VIGIL_6E);
  });

  it('une seule ligne par veillée, littérale, le lieu nommé, dix mots au plus, un point à la fin', () => {
    expect(vigilWords6e('arrival', false)).toBe('Le Phare est éteint.');
    expect(vigilWords6e('departure', true)).toBe('Le Phare est allumé.');
    expect(vigilWords6e('departure', false)).toBe('Le Phare est éteint.');
    expect(vigilWords6e('boarding', false)).toBe('L’équipière radio monte à bord.');
    expect(placeById('phare').name).toBe('Le Phare');
    for (const line of [PHRASES.fireOut, PHRASES.fireLit, PHRASES.boarding]) {
      expect(line.endsWith('.')).toBe(true);
      expect(line.split(/\s+/).length).toBeLessThanOrEqual(10);
      expect(line).not.toMatch(/[!?…]/);
    }
  });
});
