// Le cadre commun des veillées (GD-23, GD-27, lot 3) et les trois veillées du 6e : la caméra part de la caméra qui suit,
// sans saut, glisse lentement et sans à-coup, ne plonge jamais ; chaque plan cadre son lieu, la lanterne du Phare dans le
// haut de l'image ; avec « Réduire les animations », le dernier plan seul ; la ligne nomme le lieu.
import { describe, expect, it } from 'vitest';
import type { CameraPose } from './camera';
import { FERRY_ISLET, placeById } from './plan6e';
import PHRASES from './mondeOuvert.json';
import { heightAt, landDistance } from './terrain';
import { vigilPose, vigilScript, vigilSeconds, type Vigil } from './vigil';
import { levelVigils, vigilCuts, vigilOf, vigilWords } from './levelVigils';
import type { PartShape, Stage } from './construction';
import { heightAt3e } from './terrain3eHeight';
import { heightAt4e } from './terrain4e';
import { heightAt5e, landDistance5e } from './terrain5e';
import { FANAL_3E, FANAL_VIGIL_3E, VIGILS_3E } from './vigils3e';
import { FORGE_4E, FORGE_VIGIL_4E, VIGILS_4E } from './vigils4e';
import { FUMEROLLES_5E, FUMEROLLES_VIGIL_5E, SEMAPHORE_5E, SEMAPHORE_VIGIL_5E, VIGILS_5E } from './vigils5e';
import { FERRY_VIGIL_6E, PHARE_6E, PHARE_VIGIL_6E, VIGILS_6E } from './vigils6e';

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

/** La caméra qui suit Kéo devant la porte des Fumerolles (porte en (2, 7) du lieu), au retour de sa scénette. */
const FROM_FUMEROLLES: CameraPose = { position: { x: FUMEROLLES_5E.center.x + 2, y: FUMEROLLES_5E.ground + 9.6, z: FUMEROLLES_5E.center.z + 16.7 }, target: { x: FUMEROLLES_5E.center.x + 2, y: FUMEROLLES_5E.ground + 3.6, z: FUMEROLLES_5E.center.z + 7 }, fov: 56, lens: 0 };

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
    for (const [v, from] of [[PHARE_VIGIL_6E, FROM], [FERRY_VIGIL_6E, FROM_FERRY], [SEMAPHORE_VIGIL_5E, FROM], [FUMEROLLES_VIGIL_5E, FROM_FUMEROLLES], [FORGE_VIGIL_4E, FROM], [FANAL_VIGIL_3E, FROM]] as const) {
      slow(v, from);
      for (const shot of v.shots) expect(pitch({ ...shot, fov: 56, lens: 0 })).toBeLessThan(25);
      expect(vigilSeconds(v)).toBeLessThan(20);
      expect(v.still).toBeGreaterThanOrEqual(6);
    }
  });

  it('au 6e, le Phare est à portée : la veillée glisse depuis Kéo ; au 5e, au 4e et au 3e, le feu est à l’autre bout du niveau : elle commence par une coupe, la caméra au premier plan dès le début', () => {
    expect(vigilCuts(PHARE_VIGIL_6E)).toBe(false);
    expect(vigilCuts(FERRY_VIGIL_6E)).toBe(false);
    for (const v of [SEMAPHORE_VIGIL_5E, FORGE_VIGIL_4E, FANAL_VIGIL_3E]) {
      expect(vigilCuts(v)).toBe(true);
      expect(vigilPose(v, 0, FROM, blank()).position).toEqual(v.shots[0].position);
      expect(vigilPose(v, 0, FROM, blank()).position).not.toEqual(FROM.position);
    }
    expect(levelVigils('6e')).toBe(VIGILS_6E);
    expect(levelVigils('5e')).toBe(VIGILS_5E);
    expect(levelVigils('4e')).toBe(VIGILS_4E);
    expect(levelVigils('3e')).toBe(VIGILS_3E);
  });
});

/** Le feu d'un niveau est cadré : son sommet dans le haut de l'image, son pied dans l'image, la caméra au-dessus du sol et hors du lieu. */
function framesFire(v: Vigil, foot: { x: number; y: number; z: number }, top: { x: number; y: number; z: number }, groundAt: (p: { x: number; z: number }) => number, clear: number): void {
  for (const shot of v.shots) {
    const p: CameraPose = { ...shot, fov: 56, lens: 0 };
    expect(screenY(p, top), 'sommet').toBeGreaterThan(0.1);
    expect(screenY(p, top), 'sommet').toBeLessThan(0.8);
    expect(screenY(p, foot), 'pied').toBeGreaterThan(-0.9);
    expect(shot.position.y, 'au-dessus du sol').toBeGreaterThan(groundAt(shot.position) + 3);
    expect(Math.hypot(shot.position.x - foot.x, shot.position.z - foot.z), 'hors du lieu').toBeGreaterThan(clear);
  }
}

describe('Les veillées du 5e, du 4e et du 3e', () => {
  it('au 5e, l’arrivée et le départ cadrent le Sémaphore, la lanterne de tête de son mât dans le haut de l’image, depuis le plateau des Aiguilles', () => {
    const c = SEMAPHORE_5E.center;
    expect(heightAt5e(c)).toBeCloseTo(SEMAPHORE_5E.ground, 0);
    framesFire(SEMAPHORE_VIGIL_5E, { x: c.x, y: SEMAPHORE_5E.ground, z: c.z }, { x: c.x + SEMAPHORE_5E.mast.x, y: SEMAPHORE_5E.mast.top, z: c.z + SEMAPHORE_5E.mast.z }, heightAt5e, 20);
    expect(vigilOf(VIGILS_5E, 'arrival')).toBe(SEMAPHORE_VIGIL_5E);
    expect(vigilOf(VIGILS_5E, 'departure')).toBe(SEMAPHORE_VIGIL_5E);
    expect(vigilWords(VIGILS_5E, 'arrival', false)).toBe('Le Sémaphore est éteint.');
    expect(vigilWords(VIGILS_5E, 'departure', true)).toBe('Le Sémaphore est allumé.');
  });

  it('au 5e, l’embarquement cadre les Fumerolles depuis le sud-ouest, la margelle au milieu de l’image, la caméra au-dessus des Contreforts, en glissant depuis Kéo ; « Le naturaliste monte à bord. »', () => {
    const c = FUMEROLLES_5E.center;
    const m = { x: c.x + FUMEROLLES_5E.margelle.x, y: FUMEROLLES_5E.ground + 0.5, z: c.z + FUMEROLLES_5E.margelle.z };
    expect(heightAt5e(c)).toBeCloseTo(FUMEROLLES_5E.ground, 0);
    expect(vigilCuts(FUMEROLLES_VIGIL_5E)).toBe(false);
    for (const shot of FUMEROLLES_VIGIL_5E.shots) {
      const p: CameraPose = { ...shot, fov: 56, lens: 0 };
      expect(screenY(p, m)).toBeGreaterThan(-0.5);
      expect(screenY(p, m)).toBeLessThan(0.3);
      expect(shot.position.x).toBeLessThan(c.x);
      expect(shot.position.z).toBeGreaterThan(c.z);
      expect(shot.position.y).toBeGreaterThan(heightAt5e(shot.position) + 1.5);
      expect(landDistance5e(shot.position)).toBeGreaterThan(0);
      expect(Math.hypot(shot.position.x - m.x, shot.position.z - m.z)).toBeGreaterThan(FUMEROLLES_5E.margelle.r + 4);
    }
    expect(vigilOf(VIGILS_5E, 'boarding')).toBe(FUMEROLLES_VIGIL_5E);
    expect(VIGILS_5E.boarding?.place).toBe('fumerolles');
    expect(vigilWords(VIGILS_5E, 'boarding', false)).toBe('Le naturaliste monte à bord.');
    expect(vigilOf(VIGILS_4E, 'boarding')).toBeNull();
    expect(vigilOf(VIGILS_3E, 'boarding')).toBeNull();
    expect(vigilWords(VIGILS_4E, 'boarding', false)).toBe('');
  });

  it('au 4e, l’arrivée et le départ cadrent la Forge, son fourneau dans le haut de l’image, depuis le sud des Fabriques', () => {
    const c = FORGE_4E.center;
    expect(heightAt4e(c)).toBeCloseTo(FORGE_4E.ground, 0);
    framesFire(FORGE_VIGIL_4E, { x: c.x, y: FORGE_4E.ground, z: c.z }, { x: c.x, y: FORGE_4E.furnace.top, z: c.z + FORGE_4E.furnace.z }, heightAt4e, 20);
    expect(vigilOf(VIGILS_4E, 'arrival')).toBe(FORGE_VIGIL_4E);
    expect(vigilOf(VIGILS_4E, 'departure')).toBe(FORGE_VIGIL_4E);
    expect(vigilWords(VIGILS_4E, 'arrival', false)).toBe('La Forge est éteinte.');
    expect(vigilWords(VIGILS_4E, 'departure', true)).toBe('La Forge est allumée.');
  });

  it('au 3e, l’arrivée cadre le Fanal, sa tour dans le haut de l’image, depuis le Cirque ; la vue finale tient lieu de départ', () => {
    const c = FANAL_3E.center;
    expect(heightAt3e(c)).toBeCloseTo(FANAL_3E.ground, 0);
    framesFire(FANAL_VIGIL_3E, { x: c.x, y: FANAL_3E.ground, z: c.z }, { x: c.x, y: FANAL_3E.tower.top, z: c.z + FANAL_3E.tower.z }, heightAt3e, 20);
    expect(vigilOf(VIGILS_3E, 'arrival')).toBe(FANAL_VIGIL_3E);
    expect(vigilOf(VIGILS_3E, 'departure')).toBeNull();
    expect(VIGILS_3E.departure).toBe(false);
    expect(vigilWords(VIGILS_3E, 'arrival', false)).toBe('Le Fanal est éteint.');
    expect(vigilWords(VIGILS_3E, 'departure', true)).toBe('Le Fanal est allumé.');
  });

  it('chaque feu s’allume avec la partie dite : le haut au 6e, au 5e et au 3e, les abords au 4e ; une demi-partie ne l’allume pas', () => {
    const posed = (...stages: Stage[]): PartShape[] => stages.map((stage) => [{ stage, from: 0, to: 1 }]);
    const half: PartShape[] = [[{ stage: 1, from: 0, to: 0.5 }], [{ stage: 2, from: 0, to: 0.5 }]];
    for (const v of [VIGILS_6E, VIGILS_5E, VIGILS_3E]) {
      expect(v.fireLit([])).toBe(false);
      expect(v.fireLit(posed(0))).toBe(false);
      expect(v.fireLit(posed(0, 1))).toBe(true);
      expect(v.fireLit(half)).toBe(false);
    }
    expect(VIGILS_4E.fireLit(posed(0, 1))).toBe(false);
    expect(VIGILS_4E.fireLit(posed(0, 1, 2))).toBe(true);
    expect(VIGILS_4E.fireLit(half)).toBe(false);
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
    expect(vigilOf(VIGILS_6E, 'arrival')).toBe(PHARE_VIGIL_6E);
    expect(vigilOf(VIGILS_6E, 'departure')).toBe(PHARE_VIGIL_6E);
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
    expect(vigilOf(VIGILS_6E, 'boarding')).toBe(FERRY_VIGIL_6E);
  });

  it('une seule ligne par veillée, littérale, le lieu nommé, dix mots au plus, un point à la fin', () => {
    expect(vigilWords(VIGILS_6E, 'arrival', false)).toBe('Le Phare est éteint.');
    expect(vigilWords(VIGILS_6E, 'departure', true)).toBe('Le Phare est allumé.');
    expect(vigilWords(VIGILS_6E, 'departure', false)).toBe('Le Phare est éteint.');
    expect(vigilWords(VIGILS_6E, 'boarding', false)).toBe('L’équipière radio monte à bord.');
    expect(placeById('phare').name).toBe('Le Phare');
    for (const line of [PHRASES.fireOut, PHRASES.fireLit, PHRASES.boarding]) {
      expect(line.endsWith('.')).toBe(true);
      expect(line.split(/\s+/).length).toBeLessThanOrEqual(10);
      expect(line).not.toMatch(/[!?…]/);
    }
  });
});
