import { ARCHIPELAGOS, BRIDGES } from './archipelago';
import { archipelagoOfIsland } from './archipels';
import { AMBIENCE } from './daylight';
import { luminance } from './palette';
import {
  BALEINE,
  capDuNuage,
  deriveDesNuages,
  allongementDuNuage,
  EPAISSEUR_DU_NUAGE,
  NUAGES_AU_LOIN,
  placeDesNuagesDArchipeo,
  couleursDeLaBaleine,
  VENTRE_DE_NUIT,
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
import { ARCHIPELAGO_IDS, mapOf } from './map';
import { boardingRoute, bridgePath, worldBounds } from './terrain';
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

describe('les nuages d’Archipéo (DA-11)', () => {
  /** Le bord sud (le plus petit Z) d'un nuage posé comme dans la vue 3D (three/large.ts, three/faune.ts). */
  function bordSud(f: Forme, z: number, len: number, i: number, grossi: number): number {
    const sx = allongementDuNuage(len) * grossi;
    const sz = EPAISSEUR_DU_NUAGE * grossi;
    const cap = capDuNuage(i);
    let min = Infinity;
    for (let k = 0; k < f.positions.length; k += 3) {
      const px = f.positions[k] * sx;
      const pz = f.positions[k + 2] * sz;
      // Rotation autour de la verticale (Three) : z' = −x sin θ + z cos θ.
      min = Math.min(min, z + 0.6 - px * Math.sin(cap) + pz * Math.cos(cap));
    }
    return min;
  }

  it('aucun nuage ne passe sur un pont ni sur un chemin : tous au nord de l’archipel, dérive comprise', () => {
    const nuage = formeDeNuage();
    for (const a of ARCHIPELAGO_IDS) {
      const b = worldBounds(a);
      // Le plus au nord de ce qu'on parcourt : les îles (leurs chemins), les ponts, la route du navire.
      const ponts = BRIDGES.filter((d) => archipelagoOfIsland(d.from) === a).flatMap((d) => bridgePath(d));
      const archipel = ARCHIPELAGOS.find((d) => d.classe === a);
      expect(archipel).toBeDefined();
      const port = archipel?.port ?? 'maths-6e-calculation';
      const nord = Math.max(b.maxY, ...mapOf(a).map((d) => d.core.y), ...ponts.map((c) => c.y), ...boardingRoute(port).map((c) => c.y)) + 1;
      const nuages = placeDesNuagesDArchipeo(a, b);
      expect(nuages).toHaveLength(nuagesDe(a).length);
      // La dérive ne change que X, et le fondu ne fait que rapetisser : le bord sud de chaque nuage reste où il est.
      nuages.forEach((n, i) => expect(bordSud(nuage, n.z, n.len, i, n.grossi), `${a} nuage ${i}`).toBeGreaterThan(nord));
    }
  });

  it('au-dessus de leurs îles, et tous à leur hauteur : plus de nuage au ras de l’eau, ni sous les îles du Ciel', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const b = worldBounds(a);
      const altitude = mapOf(a)[0].altitude;
      for (const n of placeDesNuagesDArchipeo(a, b)) expect(n.y).toBeGreaterThanOrEqual(altitude + 14);
    }
  });

  it('pas de frise : hauteurs, profondeurs et tailles tirées hors de l’ordre des nuages, les gros au fond', () => {
    const L = NUAGES_AU_LOIN;
    for (const a of ARCHIPELAGO_IDS) {
      const b = worldBounds(a);
      const nuages = placeDesNuagesDArchipeo(a, b);
      const hauts = nuages.map((n) => n.y);
      const fonds = nuages.map((n) => n.z);
      // Au moins 3 blocs d'écart de hauteur et la moitié de la plage en profondeur, dans les bornes.
      expect(Math.max(...hauts) - Math.min(...hauts), a).toBeGreaterThanOrEqual(3);
      expect(Math.max(...hauts) - Math.min(...hauts), a).toBeLessThanOrEqual(L.ecart);
      expect(Math.max(...fonds) - Math.min(...fonds), a).toBeGreaterThanOrEqual(L.profondeur / 2);
      // Deux voisins d'est en ouest ne se suivent pas en escalier régulier : pas le même pas de hauteur partout.
      const pas = new Set(nuages.slice(1).map((n, i) => Math.round((n.y - nuages[i].y) * 10)));
      expect(pas.size, a).toBeGreaterThan(2);
      // Plus loin, plus gros.
      for (const n of nuages) {
        expect(n.grossi).toBeGreaterThanOrEqual(L.grossi[0]);
        expect(n.grossi).toBeLessThanOrEqual(L.grossi[1]);
        expect(n.grossi).toBeCloseTo(L.grossi[0] + ((n.z - b.maxY - L.recul) / L.profondeur) * (L.grossi[1] - L.grossi[0]), 6);
      }
    }
  });

  it('le retour de bord ne se voit pas : le nuage est défait aux deux bouts de sa dérive, entier au milieu', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const b = worldBounds(a);
      const d = deriveDesNuages(b);
      expect(d.debut).toBeLessThan(b.minX);
      expect(d.fin).toBeGreaterThan(b.maxX);
      expect(d.taille(d.debut)).toBe(0);
      expect(d.taille(d.fin)).toBe(0);
      expect(d.taille(d.debut - 5)).toBe(0);
      expect(d.taille((d.debut + d.fin) / 2)).toBe(1);
      // Immobile avec « Réduire les animations », tout nuage est entier à sa place de départ.
      for (const n of placeDesNuagesDArchipeo(a, b)) expect(d.taille(n.x + n.len / 2), `${a} ${n.x}`).toBe(1);
      // Il se défait en douceur : jamais plus d'un quinzième de sa taille par case de dérive (plus d'une minute de fondu).
      for (let x = d.debut; x < d.fin; x += 0.5) expect(Math.abs(d.taille(x + 0.5) - d.taille(x)), `${a} ${x}`).toBeLessThanOrEqual(1 / 15 / 2);
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

it('la nuit, le ventre crème de la baleine s’assombrit vers son flanc, sans rien changer d’autre ni le jour (R4b-6e)', () => {
  const f = formeDeBaleine();
  const jour = couleursDeLaBaleine(f, 0, new Float32Array(f.colors.length));
  expect(Array.from(jour)).toEqual(Array.from(f.colors));
  const nuit = couleursDeLaBaleine(f, 1, new Float32Array(f.colors.length));
  let ventres = 0;
  for (let i = 0; i < f.colors.length; i += 3) {
    const change = [0, 1, 2].some((j) => nuit[i + j] !== f.colors[i + j]);
    if (!change) continue;
    ventres++;
    // Plus sombre qu'au jour, et plus clair que le flanc : le ventre se lit encore, sans luire.
    const l = (c: ArrayLike<number>) => 0.2126 * c[i] + 0.7152 * c[i + 1] + 0.0722 * c[i + 2];
    expect(l(nuit)).toBeLessThan(l(f.colors));
  }
  expect(ventres).toBeGreaterThan(0);
  expect(luminance(VENTRE_DE_NUIT)).toBeLessThan(luminance(BALEINE.ventre));
  expect(luminance(VENTRE_DE_NUIT)).toBeGreaterThan(luminance(BALEINE.flanc));
});
