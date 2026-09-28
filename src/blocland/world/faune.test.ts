import { AMBIENCE } from './daylight';
import {
  BALEINE,
  EVENT,
  formeDeBaleine,
  formeDEcume,
  formeDeNuage,
  formeDOiseau,
  nuagesDe,
  NUAGES,
  oiseauxDe,
  poseDePassage,
  poseDeRonde,
  trianglesDe,
  type Forme,
} from './faune';
import { ARCHIPELAGO_IDS } from './map';
import { PASS_TIMING } from './whalePass';

/** Le volume signé d'une forme : positif si ses faces regardent vers l'extérieur (les lames à deux faces s'annulent). */
function volume(f: Forme): number {
  let v = 0;
  const p = f.positions;
  for (let t = 0; t < p.length; t += 9) {
    const [ax, ay, az, bx, by, bz, cx, cy, cz] = p.slice(t, t + 9);
    v += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
  }
  return v;
}

const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));

describe('les formes facettées', () => {
  it('des formes légères, peintes par sommet, fermées et tournées vers l’extérieur', () => {
    const formes = { baleine: formeDeBaleine(), oiseau: formeDOiseau(), nuage: formeDeNuage(), ecume: formeDEcume() };
    // Quelques dizaines de triangles chacune (la baleine en blocs en avait 108, un nuage en cubes 12 par bloc).
    expect(trianglesDe(formes.baleine)).toBeLessThanOrEqual(120);
    expect(trianglesDe(formes.oiseau)).toBeLessThanOrEqual(24);
    expect(trianglesDe(formes.nuage)).toBeLessThanOrEqual(80);
    expect(trianglesDe(formes.ecume)).toBeLessThanOrEqual(40);
    for (const [nom, f] of Object.entries(formes)) {
      const n = f.positions.length / 3;
      expect(f.colors.length, nom).toBe(f.positions.length);
      for (const v of f.colors) expect(v >= 0 && v <= 1, nom).toBe(true);
      for (const v of f.positions) expect(Number.isFinite(v), nom).toBe(true);
      for (const w of Object.values(f.poids)) expect(w.length, nom).toBe(n);
    }
    // Fermées et tournées vers l'extérieur : un volume positif (la baleine, environ 7 unités cubes).
    expect(volume(formes.baleine)).toBeGreaterThan(4);
    expect(volume(formes.nuage)).toBeGreaterThan(3);
    expect(volume(formes.oiseau)).toBeGreaterThan(0);
    // L'écume est à plat sur l'eau, tournée vers le ciel.
    for (let i = 1; i < formes.ecume.positions.length; i += 3) expect(formes.ecume.positions[i]).toBe(0);
  });

  it('la baleine : dos bleu profond, ventre crème ; la queue et le souffle ont leurs poids', () => {
    const f = formeDeBaleine();
    const couleurs = new Set<string>();
    for (let i = 0; i < f.colors.length; i += 3) couleurs.add([0, 1, 2].map((j) => f.colors[i + j].toFixed(4)).join(','));
    const hex = (c: number) => [16, 8, 0].map((k) => lin(((c >> k) & 255) / 255).toFixed(4)).join(',');
    expect(couleurs.has(hex(BALEINE.dos))).toBe(true);
    expect(couleurs.has(hex(BALEINE.ventre))).toBe(true);
    expect(couleurs.has(hex(BALEINE.souffle))).toBe(true);
    // Le souffle : au-dessus de l'évent ; la queue : à l'arrière.
    for (let v = 0; v < f.positions.length / 3; v++) {
      if (f.poids.souffle[v] > 0) expect(f.positions[v * 3 + 1]).toBeGreaterThan(EVENT[1]);
      if (f.poids.queue[v] > 0.5) expect(f.positions[v * 3]).toBeLessThan(-2);
    }
  });
});

describe('les effectifs', () => {
  it('les mêmes nuages et oiseaux que le monde en blocs', () => {
    expect(NUAGES).toHaveLength(7);
    for (const a of ARCHIPELAGO_IDS) {
      expect(nuagesDe(a)).toHaveLength(AMBIENCE[a].sky ? 14 : 7);
      expect(oiseauxDe(a)).toEqual({ nombre: a === '4e' ? 8 : 6, altitude: a === '4e' ? 17 : AMBIENCE[a].sky ? 18 : 13 });
    }
  });
});

describe('la pose des baleines', () => {
  const ronde = { cx: 10, cy: 20, r: 6, phase: 2.1, speed: 0.15 };

  it('sa ronde au large : sur son cercle, elle souffle seulement en surface', () => {
    for (let t = 0; t < 60; t += 0.37) {
      const p = poseDeRonde(ronde, t);
      expect(Math.hypot(p.x - ronde.cx, p.z - ronde.cy)).toBeCloseTo(ronde.r, 6);
      expect(p.y).toBeGreaterThanOrEqual(-1.8);
      expect(p.y).toBeLessThanOrEqual(0);
      const rise = Math.sin(t * 0.45 + ronde.phase);
      expect(p.souffle > 0).toBe(rise > 0.7);
      expect(p.ecume).toBe(0);
    }
  });

  it('son passage : elle s’enfonce, glisse le long du trajet en surface, souffle une fois, remonte à sa ronde', () => {
    const passage = { route: { from: { x: 0, y: 0 }, to: { x: 12, y: 0 } }, heading: 0, start: 100 };
    const { sink, swim, rise } = PASS_TIMING;
    // Elle quitte sa ronde en s'enfonçant, sans souffle ni écume.
    const debut = poseDePassage(ronde, 100 + sink * 0.9, passage);
    expect(debut.fini).toBe(false);
    expect(debut.pose.y).toBeLessThan(poseDeRonde(ronde, 100 + sink * 0.9).y - 2);
    expect(debut.pose.souffle + debut.pose.ecume).toBe(0);
    // Au milieu du trajet : en surface, un peu plus grande, avec son écume ; elle souffle vers le milieu.
    let souffles = 0;
    for (let s = sink; s < sink + swim; s += 0.05) {
      const { pose } = poseDePassage(ronde, 100 + s, passage);
      expect(pose.z).toBeCloseTo(0, 6);
      expect(pose.x).toBeGreaterThanOrEqual(0);
      expect(pose.x).toBeLessThanOrEqual(12);
      expect(pose.echelle).toBe(1.2);
      expect(pose.ecume).toBeLessThanOrEqual(0.8);
      if (pose.souffle > 0) souffles++;
    }
    expect(souffles).toBeGreaterThan(0);
    const milieu = poseDePassage(ronde, 100 + sink + swim / 2, passage).pose;
    expect(milieu.y).toBeGreaterThan(-0.3);
    expect(milieu.ecume).toBeGreaterThan(0.5);
    // Puis c'est fini : sa ronde reprend.
    const fin = poseDePassage(ronde, 100 + sink + swim + rise + 0.1, passage);
    expect(fin.fini).toBe(true);
    expect(fin.pose).toEqual(poseDeRonde(ronde, 100 + sink + swim + rise + 0.1));
  });
});
