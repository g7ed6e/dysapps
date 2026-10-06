import { cadrageSerre } from '../../../three/tightFraming';
import { lineaire } from '../../landMesh';
import { toutConstruit } from '../../budget';
import { guardianPlacements } from '../../terrain';
import { gardienDuMonde } from '../../terrain/creatures';
import { LUEUR, SENTINELLE } from '../colors';
import { FIRST_STEP } from '../glow';
import { fusionDesGardiens, pointDePose } from '../merges';
import type { FacettesDePersonnage, V3 } from '../painted';
import { sentinelleAuDefi, sentinellePeinte, STATUES } from '../paintedSentinels';
import { framingPoints } from '../portrait';
import { allumage, couleursAllumees, degreDuSerti, ECHELLE_DANS_LE_MONDE, glowDegree } from '../sentinel';
import { HAUTEUR_DU_LION, LION_DE_PIERRE, LION_SLAB_TOP, LION_VEIN_FIRST_STEP, LION_VEIN_GLOW, QUAI_DU_LION, VEINE_DU_LION } from './lion';
import { LION_DU_DEFI, LION_DU_MONDE } from './lionData';

const ID = 'english-6e-vocabulary';
const nom = (f: FacettesDePersonnage, t: number) => f.table[f.pieces[t]].nom;
const triangles = (f: FacettesDePersonnage, piece: string, teinte?: number) => [...f.pieces.keys()].filter((t) => nom(f, t) === piece && (teinte === undefined || f.teintes[t] === teinte));
const sommet = (f: FacettesDePersonnage, t: number, k: number): V3 => [f.positions[t * 9 + k * 3], f.positions[t * 9 + k * 3 + 1], f.positions[t * 9 + k * 3 + 2]];
const centre = (f: FacettesDePersonnage, t: number): V3 => [0, 1, 2].map((a) => (sommet(f, t, 0)[a] + sommet(f, t, 1)[a] + sommet(f, t, 2)[a]) / 3) as V3;

/** La luminance relative d'une couleur (WCAG), ce que voit un œil en niveaux de gris. */
function luminance(c: number): number {
  const [r, g, b] = [(c >> 16) & 255, (c >> 8) & 255, c & 255].map((v) => lineaire(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contraste = (a: number, b: number) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
/** La luminance d'un triangle peint (couleurs linéaires, celles de son premier sommet). */
const luminanceDe = (c: Float32Array, t: number) => 0.2126 * c[t * 9] + 0.7152 * c[t * 9 + 1] + 0.0722 * c[t * 9 + 2];
/** Ce que la tablette donne à la vitrine du défi, en pixels (src/styles/global.css, `.arena-vitrine .guardian-3d`). */
const VITRINE_DE_TABLETTE = 140;
const dist3 = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
function unit3(a: number[]): V3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

/** Les taches d'un ensemble de triangles : ceux qui se touchent (un sommet commun) en font une. */
function taches(f: FacettesDePersonnage, ts: number[]): number {
  const cle = (p: V3) => p.map((v) => Math.round(v * 1000)).join(',');
  const parent = ts.map((_, i) => i);
  const racine = (i: number): number => (parent[i] === i ? i : (parent[i] = racine(parent[i])));
  const par = new Map<string, number>();
  ts.forEach((t, i) => {
    for (let k = 0; k < 3; k++) {
      const c = cle(sommet(f, t, k));
      const j = par.get(c);
      if (j === undefined) par.set(c, i);
      else parent[racine(i)] = racine(j);
    }
  });
  return new Set(ts.map((_, i) => racine(i))).size;
}

/** Les veines du défi : leur normale et les points de leur ligne (./lionData.ts), en blocs. */
const lignes = LION_DU_DEFI.veines.map((v) => {
  const at = (k: number): V3 => [v[k] / 1000, v[k + 1] / 1000, v[k + 2] / 1000];
  return { n: at(0), points: Array.from({ length: v.length / 3 - 1 }, (_, i) => at(3 + i * 3)) };
});
const segments = lignes.reduce((s, l) => s + l.points.length - 1, 0);

/**
 * La caméra du défi (Guardians.tsx, PersonnageCanvas.tsx) : de trois-quarts, 30° de champ, la vitrine carrée d'une
 * tablette, cadrée sur `cadre`. Rend son œil et la projection d'un point, en pixels depuis le centre de la vitrine.
 */
function cameraDuDefi(f: FacettesDePersonnage, cadre: ArrayLike<number>) {
  const direction: V3 = [-0.55, 0.35, -0.85];
  const fov = 30;
  const [mn, mx] = [[Infinity, Infinity, Infinity], [-Infinity, -Infinity, -Infinity]];
  for (let i = 0; i < f.positions.length; i += 3)
    for (let k = 0; k < 3; k++) [mn[k], mx[k]] = [Math.min(mn[k], f.positions[i + k]), Math.max(mx[k], f.positions[i + k])];
  const milieu = [0, 1, 2].map((k) => (mn[k] + mx[k]) / 2);
  const { cible, distance } = cadrageSerre(
    Array.from(cadre, (v, i) => v - milieu[i % 3]),
    direction,
    fov,
    1,
  );
  const l = Math.hypot(...direction);
  const N = direction.map((v) => v / l);
  const oeil = [0, 1, 2].map((k) => milieu[k] + cible[k] + N[k] * distance) as V3;
  // La droite et le haut de l'image, comme Object3D.lookAt avec le haut du monde.
  const rl = Math.hypot(N[2], N[0]);
  const R = [N[2] / rl, 0, -N[0] / rl];
  const U = [N[1] * R[2], N[2] * R[0] - N[0] * R[2], -N[1] * R[0]];
  const t = Math.tan((fov * Math.PI) / 360);
  const ecran = (p: V3): [number, number] => {
    const d = [p[0] - oeil[0], p[1] - oeil[1], p[2] - oeil[2]];
    const z = -(d[0] * N[0] + d[1] * N[1] + d[2] * N[2]);
    const demi = VITRINE_DE_TABLETTE / 2;
    return [((d[0] * R[0] + d[2] * R[2]) / (z * t)) * demi, ((d[0] * U[0] + d[1] * U[1] + d[2] * U[2]) / (z * t)) * demi];
  };
  return { oeil, ecran };
}

/** La distance où un rayon parti de `o` dans la direction `d` (unitaire) touche la pierre de `f` (Möller-Trumbore), ou l'infini. */
function versLaPierre(f: FacettesDePersonnage, pierre: number[], o: V3, d: V3): number {
  let meilleur = Infinity;
  for (const t of pierre) {
    const [a, b, c] = [0, 1, 2].map((k) => sommet(f, t, k));
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const p = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]];
    const det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
    if (Math.abs(det) < 1e-12) continue;
    const s = [o[0] - a[0], o[1] - a[1], o[2] - a[2]];
    const u = (s[0] * p[0] + s[1] * p[1] + s[2] * p[2]) / det;
    if (u < 0 || u > 1) continue;
    const q = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]];
    const v = (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]) / det;
    if (v < 0 || u + v > 1) continue;
    const dist = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) / det;
    if (dist > 0) meilleur = Math.min(meilleur, dist);
  }
  return meilleur;
}

describe('Le Lion de pierre, tiré de son modèle (Baie des mots, 6e)', () => {
  const monde = sentinellePeinte(ID);
  const defi = sentinelleAuDefi(ID);

  it('est le Gardien de la Baie des mots ; sa dalle sert de quai, sans socle commun, la flamme commune devant ses pattes (décision du mainteneur du 06/10/2026)', () => {
    expect(STATUES[ID]).toBe(LION_DE_PIERRE);
    expect(QUAI_DU_LION).toBe('dalle');
    expect(LION_DE_PIERRE.socle).toBe(false);
    for (const f of [monde, defi]) expect(f.table.map((p) => p.nom)).toEqual(['sculpture', 'flamme', 'veines']);
  });

  it('la flamme brûle sur la dalle, entre son bord et le museau, sous la tête ; la coupe est de pierre', () => {
    for (const f of [monde, defi]) {
      const flamme = triangles(f, 'flamme');
      expect(flamme.length).toBeGreaterThan(0);
      for (const t of flamme) for (let k = 0; k < 3; k++) {
        const [x, y, z] = sommet(f, t, k);
        expect(Math.abs(x)).toBeLessThan(0.3);
        expect(z).toBeGreaterThan(-4.2);
        expect(z).toBeLessThan(-3.6);
        expect(y).toBeGreaterThan(1.2);
        expect(y).toBeLessThan(2.2);
      }
    }
  });

  it('la nuit comme le jour, la dalle reste de pierre et la flamme commune brille comme celle des autres sentinelles', () => {
    const autre = sentinellePeinte('french-6e-phonology');
    const piece = (f: FacettesDePersonnage, n: string) => f.table.find((p) => p.nom === n);
    for (const f of [monde, defi]) {
      expect(piece(f, 'flamme')).toEqual({ ...piece(autre, 'flamme'), pivot: piece(f, 'flamme')!.pivot });
      // La dalle : la pierre sous le haut de la dalle, ni lueur ni serti.
      for (const t of triangles(f, 'sculpture')) if ([0, 1, 2].every((k) => sommet(f, t, k)[1] < LION_SLAB_TOP)) expect(f.teintes[t]).toBe(SENTINELLE.pierre);
    }
  });

  it('la dalle a ses bords sur l’axe nord-sud, dans le monde comme au défi : le modèle n’est jamais tourné (décision du mainteneur du 06/10/2026)', () => {
    expect(LION_DE_PIERRE.tour).toBeUndefined();
  });

  it('deux modèles : 700 triangles dans le monde, sans veines ; 1 500 au défi, plus ses quatre veines serties', () => {
    expect(LION_DU_MONDE.triangles.length / 3).toBe(700);
    expect(LION_DU_DEFI.triangles.length / 3).toBe(1_500);
    // La coupe et sa flamme ajoutent les mêmes quelques triangles aux deux modèles.
    const feu = monde.pieces.length - 700;
    expect(feu).toBeGreaterThan(0);
    expect(feu).toBeLessThanOrEqual(30);
    expect(triangles(monde, 'veines')).toEqual([]);
    expect(LION_DU_MONDE.veines).toEqual([]);
    expect(LION_DU_DEFI.veines.length).toBe(4);
    // Chaque segment d'une veine est une bande d'or sur une bande de serti, de deux triangles chacune ; une veine pliée
    // en a deux : au plus 16 triangles de plus que les quatre veines droites.
    expect(triangles(defi, 'veines', LUEUR).length).toBe(segments * 2);
    expect(triangles(defi, 'sculpture', SENTINELLE.serti).length).toBe(segments * 2);
    expect(segments).toBeLessThanOrEqual(8);
    expect(defi.pieces.length).toBe(1_500 + segments * 4 + feu);
    // Le gros plan reste léger : moins de 1 800 triangles, veines comprises.
    expect(defi.pieces.length).toBeLessThan(1_800);
  });

  it('six blocs de haut, dalle comprise, les pieds en 0, le museau vers −Z', () => {
    for (const f of [monde, defi]) {
      let [bas, haut] = [Infinity, -Infinity];
      for (let i = 1; i < f.positions.length; i += 3) [bas, haut] = [Math.min(bas, f.positions[i]), Math.max(haut, f.positions[i])];
      expect(bas).toBeCloseTo(0, 2);
      expect(haut).toBeGreaterThan(HAUTEUR_DU_LION - 0.06);
      expect(haut).toBeLessThan(HAUTEUR_DU_LION + 0.06);
    }
    // La tête (au-dessus de quatre blocs) est devant (z < 0) : le corps couché s'étend derrière elle.
    const tete = triangles(defi, 'sculpture').filter((t) => centre(defi, t)[1] > 4);
    expect(tete.reduce((s, t) => s + centre(defi, t)[2], 0) / tete.length).toBeLessThan(-1.5);
  });

  it('dans le monde, tient dans la place du Gardien : l’emprise de son îlot, sans en sortir', () => {
    const { progress, world } = toutConstruit();
    const place = guardianPlacements('6e', progress, world.links).find((p) => p.id === ID);
    expect(place).toBeDefined();
    const cubes = gardienDuMonde(ID);
    const largeur = Math.max(...cubes.map((c) => c.x)) - Math.min(...cubes.map((c) => c.x)) + 1;
    const profondeur = Math.max(...cubes.map((c) => c.y)) - Math.min(...cubes.map((c) => c.y)) + 1;
    const f = fusionDesGardiens([place!]);
    const pied = pointDePose(place!);
    let [x0, x1, z0, z1] = [Infinity, -Infinity, Infinity, -Infinity];
    for (let i = 0; i < f.positions.length; i += 3) {
      [x0, x1] = [Math.min(x0, f.positions[i]), Math.max(x1, f.positions[i])];
      [z0, z1] = [Math.min(z0, f.positions[i + 2]), Math.max(z1, f.positions[i + 2])];
    }
    expect(x1 - x0).toBeLessThanOrEqual(largeur);
    expect(z1 - z0).toBeLessThanOrEqual(profondeur);
    expect(Math.abs((x0 + x1) / 2 - pied[0])).toBeLessThan(0.05);
    expect(Math.abs((z0 + z1) / 2 - pied[2])).toBeLessThan(0.05);
    // Environ quatre blocs de haut dans le monde (six à l'échelle de toutes les sentinelles).
    expect(HAUTEUR_DU_LION * ECHELLE_DANS_LE_MONDE).toBeCloseTo(3.9, 5);
  });

  it('le lichen en taches : quatre au défi, une seule (l’épaule) dans le monde, jamais sur une veine', () => {
    expect(taches(defi, triangles(defi, 'sculpture', SENTINELLE.lichen))).toBe(4);
    expect(taches(monde, triangles(monde, 'sculpture', SENTINELLE.lichen))).toBe(1);
    const or = triangles(defi, 'veines', LUEUR).map((t) => centre(defi, t));
    for (const t of triangles(defi, 'sculpture', SENTINELLE.lichen)) {
      const c = centre(defi, t);
      for (const o of or) expect(Math.hypot(c[0] - o[0], c[1] - o[1], c[2] - o[2])).toBeGreaterThan(0.2);
    }
  });

  it('quatre veines droites, la tempe et le bas de la joue de chaque côté ; aucune sur le sommet de la tête ni le poitrail', () => {
    const veines = lignes.map(({ n, points }) => {
      const [A, B] = [points[0], points[points.length - 1]];
      const longueur = points.slice(1).reduce((l, p, i) => l + Math.hypot(p[0] - points[i][0], p[1] - points[i][1], p[2] - points[i][2]), 0);
      return { n, points, longueur, x: (A[0] + B[0]) / 2, y: (A[1] + B[1]) / 2, z: (A[2] + B[2]) / 2 };
    });
    for (const v of veines) {
      // Devant, sur la crinière : ni le poitrail (sous 3,3 blocs), ni le sommet de la tête (au-dessus de 5,6 blocs).
      expect(v.z).toBeLessThan(-0.8);
      expect(Math.abs(v.x)).toBeGreaterThan(0.5);
      expect(Math.abs(v.x)).toBeLessThan(2.2);
      for (const p of v.points) {
        expect(p[1]).toBeGreaterThan(3.3);
        expect(p[1]).toBeLessThan(5.6);
      }
      // Assez longue pour se lire (le script vérifie qu'elle couvre au moins 60 % de sa mèche).
      expect(v.longueur).toBeGreaterThan(0.35);
      expect(Math.hypot(...v.n)).toBeCloseTo(1, 2);
      // Droite, ou pliée en deux segments presque alignés (moins de 25° entre eux).
      expect(v.points.length).toBeLessThanOrEqual(3);
      if (v.points.length === 3) {
        const [a, b, c] = v.points;
        const [u, w] = [unit3([b[0] - a[0], b[1] - a[1], b[2] - a[2]]), unit3([c[0] - b[0], c[1] - b[1], c[2] - b[2]])];
        expect(u[0] * w[0] + u[1] * w[1] + u[2] * w[2]).toBeGreaterThan(Math.cos((25 * Math.PI) / 180));
      }
    }
    for (const cote of [1, -1]) {
      const deCeCote = veines.filter((v) => Math.sign(v.x) === cote).sort((a, b) => b.y - a.y);
      expect(deCeCote.length).toBe(2);
      // La tempe, au-dessus des yeux ; le bas de la joue, sous le museau.
      expect(deCeCote[0].y).toBeGreaterThan(4.9);
      expect(deCeCote[1].y).toBeLessThan(4.2);
    }
    // À plat : les triangles d'or de chaque segment sont dans le même plan.
    const or = triangles(defi, 'veines', LUEUR);
    for (let i = 0; i < or.length; i += 2) {
      const [p, q] = [or[i], or[i + 1]];
      const n: V3 = [defi.normals[p * 9], defi.normals[p * 9 + 1], defi.normals[p * 9 + 2]];
      const m: V3 = [defi.normals[q * 9], defi.normals[q * 9 + 1], defi.normals[q * 9 + 2]];
      expect(n[0] * m[0] + n[1] * m[1] + n[2] * m[2]).toBeGreaterThan(0.999);
    }
  });

  it('les veines ne flottent pas : le serti à 0,06 bloc au plus au-dessus de la pierre, à ses bouts comme à son pli', () => {
    const pierre = triangles(defi, 'sculpture').filter((t) => defi.teintes[t] !== SENTINELLE.serti);
    for (const { n, points } of lignes)
      for (const p of points) {
        const serti: V3 = [0, 1, 2].map((k) => p[k] + n[k] * VEINE_DU_LION.hauteurDuSerti) as V3;
        expect(versLaPierre(defi, pierre, serti, [-n[0], -n[1], -n[2]])).toBeLessThanOrEqual(0.06 + 1e-3);
      }
  });

  it('vu de la caméra du défi, le serti ne sort jamais du contour de la pierre', () => {
    const { oeil } = cameraDuDefi(defi, framingPoints('guardian', ID, defi));
    const pierre = triangles(defi, 'sculpture').filter((t) => defi.teintes[t] !== SENTINELLE.serti);
    for (const t of triangles(defi, 'sculpture', SENTINELLE.serti))
      for (let k = 0; k < 3; k++) {
        const p = sommet(defi, t, k);
        const d = unit3([p[0] - oeil[0], p[1] - oeil[1], p[2] - oeil[2]]);
        expect(versLaPierre(defi, pierre, p, d), `serti ${t}, sommet ${k}`).toBeLessThan(3);
      }
  });

  it('l’or fait au moins 2 px de large partout dans la vitrine d’une tablette, racine, pli et pointe', () => {
    const { ecran } = cameraDuDefi(defi, framingPoints('guardian', ID, defi));
    const or = triangles(defi, 'veines', LUEUR);
    for (let i = 0; i < or.length; i += 2) {
      // Les quatre coins d'une bande ; ses deux bouts sont les deux paires de coins les plus proches.
      const coins = [...new Map([or[i], or[i + 1]].flatMap((t) => [0, 1, 2].map((k) => sommet(defi, t, k))).map((p) => [p.map((v) => v.toFixed(5)).join(), p])).values()];
      expect(coins.length).toBe(4);
      const paires = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]].sort(([a, b], [c, d]) => dist3(coins[a], coins[b]) - dist3(coins[c], coins[d]));
      const [bout1, bout2] = [paires[0], paires.find(([a, b]) => !paires[0].includes(a) && !paires[0].includes(b))!];
      const px = coins.map(ecran);
      const centre2 = ([a, b]: number[]) => [(px[a][0] + px[b][0]) / 2, (px[a][1] + px[b][1]) / 2];
      const [c1, c2] = [centre2(bout1), centre2(bout2)];
      const axe = [c2[0] - c1[0], c2[1] - c1[1]];
      const la = Math.hypot(axe[0], axe[1]);
      for (const [a, b] of [bout1, bout2]) {
        const e = [px[b][0] - px[a][0], px[b][1] - px[a][1]];
        expect(Math.abs(e[0] * axe[1] - e[1] * axe[0]) / la, `bande ${i / 2}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('les veines sont « légèrement émissives » : une part seulement de leur allumage vient de la lueur ; la flamme, pleinement', () => {
    expect(defi.table.find((p) => p.nom === 'veines')?.glowWeight).toBe(LION_VEIN_GLOW);
    // Au premier pas, les veines sont déjà plus allumées que les lueurs ; puis elles les rejoignent à 1.
    const veines = defi.table.find((p) => p.nom === 'veines')!;
    expect(veines.firstStepGlow).toBe(LION_VEIN_FIRST_STEP);
    expect(glowDegree(veines, 0)).toBe(0);
    expect(glowDegree(veines, FIRST_STEP)).toBeCloseTo(LION_VEIN_FIRST_STEP, 9);
    expect(glowDegree(veines, 1)).toBeCloseTo(1, 9);
    expect(glowDegree(defi.table.find((p) => p.nom === 'flamme')!, FIRST_STEP)).toBe(FIRST_STEP);
    expect(LION_VEIN_GLOW).toBeGreaterThan(0);
    expect(LION_VEIN_GLOW).toBeLessThan(1);
    expect(defi.table.find((p) => p.nom === 'flamme')?.glowWeight).toBeUndefined();
  });

  it('le serti suit l’allumage des veines : de la couleur de la pierre éteint, jusqu’à #403D38, sombre dès la première réussite', () => {
    expect(allumage(SENTINELLE.serti, 0)).toBe(SENTINELLE.pierre);
    expect(allumage(SENTINELLE.serti, 1)).toBe(SENTINELLE.serti);
    expect(degreDuSerti(0)).toBe(0);
    expect(degreDuSerti(FIRST_STEP)).toBe(1);
    expect(degreDuSerti(1)).toBe(1);
    // Éteint, le serti est peint comme la pierre : pas de trait sombre sur la crinière.
    const eteint = couleursAllumees(defi, { pierre: 0, lueurs: 0 });
    const pierre = luminance(SENTINELLE.pierre);
    for (const t of triangles(defi, 'sculpture', SENTINELLE.serti)) {
      // À la nuance de sa facette près (de 0,84 à 1, ../painted.ts) : la luminance de la pierre, ou un peu moins.
      expect(luminanceDe(eteint, t)).toBeLessThanOrEqual(pierre + 1e-4);
      expect(luminanceDe(eteint, t)).toBeGreaterThan(luminance(0x777670));
    }
  });

  it('l’or se lit sur son serti à 3,3:1 au moins en niveaux de gris, de la première réussite à la victoire ; le serti déborde de l’or de tous côtés', () => {
    expect(contraste(LUEUR, SENTINELLE.serti)).toBeGreaterThanOrEqual(3);
    // Sans serti, l'or ne se lirait pas sur la pierre : ni grise (défi en cours), ni rallumée.
    expect(contraste(LUEUR, SENTINELLE.pierre)).toBeLessThan(3);
    expect(contraste(LUEUR, SENTINELLE.rallumee)).toBeLessThan(3);
    // Sur les couleurs peintes, facette par facette : chaque bande d'or contre la bande de serti qui la porte (même
    // ordre, deux triangles par segment), du premier pas du défi à la victoire, la pierre éteinte puis rallumée ; 3,3:1
    // plutôt que 3:1, pour l'éclairage de la vue et le lissage des bords (référent dys, 06/10/2026).
    const or = triangles(defi, 'veines', LUEUR);
    const serti = triangles(defi, 'sculpture', SENTINELLE.serti);
    expect(or.length).toBe(serti.length);
    for (const degre of [
      { pierre: 0, lueurs: FIRST_STEP },
      { pierre: 0, lueurs: 0.5 },
      { pierre: 0, lueurs: 0.8 },
      { pierre: 0, lueurs: 1 },
      { pierre: 1, lueurs: 1 },
    ]) {
      const c = couleursAllumees(defi, degre);
      for (let i = 0; i < or.length; i++) {
        const [o, s] = [luminanceDe(c, or[i]), luminanceDe(c, serti[i])];
        expect((o + 0.05) / (s + 0.05), `lueurs ${degre.lueurs}, bande ${i}`).toBeGreaterThanOrEqual(3.3);
      }
    }
    // Le serti déborde de l’or d’au moins 0,05 bloc de chaque côté.
    expect((VEINE_DU_LION.serti - VEINE_DU_LION.or) / 2).toBeGreaterThanOrEqual(0.05);
    expect(VEINE_DU_LION.hauteurDeLOr).toBeGreaterThan(VEINE_DU_LION.hauteurDuSerti);
  });

  it('au défi, la caméra cadre le Lion seul, sans sa dalle : sa tête fait au moins 50 px dans la vitrine d’une tablette', () => {
    const cadre = framingPoints('guardian', ID, defi);
    expect(cadre.length).toBeLessThan(defi.positions.length);
    for (let i = 1; i < cadre.length; i += 3) expect(cadre[i]).toBeGreaterThan(LION_SLAB_TOP);
    // La flamme reste dans le cadre.
    for (const t of triangles(defi, 'flamme')) for (let k = 0; k < 3; k++) expect(sommet(defi, t, k)[1]).toBeGreaterThan(LION_SLAB_TOP);
    const { ecran } = cameraDuDefi(defi, cadre);
    // La tête, crinière comprise : la pierre au-dessus de quatre blocs.
    const tete = triangles(defi, 'sculpture')
      .flatMap((u) => [0, 1, 2].map((k) => sommet(defi, u, k)))
      .filter((p) => p[1] > 4)
      .map(ecran);
    const [largeur, hauteur] = [0, 1].map((k) => Math.max(...tete.map((p) => p[k])) - Math.min(...tete.map((p) => p[k])));
    expect(largeur).toBeGreaterThanOrEqual(50);
    expect(hauteur).toBeGreaterThanOrEqual(50);
    // Tout le Lion tient dans la vitrine.
    for (let i = 0; i < cadre.length; i += 3) for (const v of ecran([cadre[i], cadre[i + 1], cadre[i + 2]])) expect(Math.abs(v)).toBeLessThanOrEqual(VITRINE_DE_TABLETTE / 2 + 1e-6);
  });

  it('des orbites sombres sur les yeux du modèle, sans les creuser, qui ne s’allument jamais', () => {
    for (const f of [monde, defi]) {
      const orbites = triangles(f, 'sculpture', SENTINELLE.orbite);
      expect(orbites.length).toBe(2);
      for (const t of orbites) expect(centre(f, t)[1]).toBeGreaterThan(4.3);
    }
  });
});
