import { lineaire } from '../../landMesh';
import { toutConstruit } from '../../budget';
import { guardianPlacements } from '../../terrain';
import { gardienDuMonde } from '../../terrain/creatures';
import { LUEUR, SENTINELLE } from '../colors';
import { fusionDesGardiens, pointDePose } from '../merges';
import type { FacettesDePersonnage, V3 } from '../painted';
import { sentinelleAuDefi, sentinellePeinte, STATUES } from '../paintedSentinels';
import { ECHELLE_DANS_LE_MONDE } from '../sentinel';
import { HAUTEUR_DU_LION, LION_DE_PIERRE, QUAI_DU_LION, VEINE_DU_LION } from './lion';
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

describe('Le Lion de pierre, tiré de son modèle (Baie des mots, 6e)', () => {
  const monde = sentinellePeinte(ID);
  const defi = sentinelleAuDefi(ID);

  it('est le Gardien de la Baie des mots ; sa dalle sert de quai, sans socle commun ni flamme (proposition du directeur artistique)', () => {
    expect(STATUES[ID]).toBe(LION_DE_PIERRE);
    expect(QUAI_DU_LION).toBe('dalle');
    expect(LION_DE_PIERRE.socle).toBe(false);
    for (const f of [monde, defi]) expect(f.table.map((p) => p.nom)).toEqual(['sculpture', 'veines']);
  });

  it('deux modèles : 700 triangles dans le monde, sans veines ; 1 500 au défi, plus ses huit veines serties', () => {
    expect(LION_DU_MONDE.triangles.length / 3).toBe(700);
    expect(LION_DU_DEFI.triangles.length / 3).toBe(1_500);
    expect(monde.pieces.length).toBe(700);
    expect(triangles(monde, 'veines')).toEqual([]);
    expect(LION_DU_MONDE.veines).toEqual([]);
    expect(LION_DU_DEFI.veines.length).toBe(8);
    // Chaque arête d'une veine porte deux bandes (une par facette), d'or et de serti : 1 500 + 2 × 2 × arêtes.
    const aretes = LION_DU_DEFI.veines.reduce((n, v) => n + v.length / 18, 0);
    expect(triangles(defi, 'veines', LUEUR).length).toBe(aretes * 4);
    expect(triangles(defi, 'sculpture', SENTINELLE.serti).length).toBe(aretes * 4);
    expect(defi.pieces.length).toBe(1_500 + aretes * 8);
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

  it('les veines sont sur la crinière, devant : de la tête au poitrail, jamais sur le corps ni la dalle', () => {
    for (const t of triangles(defi, 'veines')) {
      const [x, y, z] = centre(defi, t);
      expect(y).toBeGreaterThan(2.5);
      expect(Math.abs(x)).toBeLessThan(2.2);
      expect(z).toBeLessThan(-0.8);
    }
  });

  it('l’or se lit sur son serti à plus de 3:1 en niveaux de gris, éteint ou rallumé ; le serti déborde de l’or des deux côtés', () => {
    expect(contraste(LUEUR, SENTINELLE.serti)).toBeGreaterThanOrEqual(3);
    // Sans serti, l'or ne se lirait pas sur la pierre : ni grise (défi en cours), ni rallumée.
    expect(contraste(LUEUR, SENTINELLE.pierre)).toBeLessThan(3);
    expect(contraste(LUEUR, SENTINELLE.rallumee)).toBeLessThan(3);
    expect(VEINE_DU_LION.serti).toBeGreaterThan(VEINE_DU_LION.or * 1.8);
    expect(VEINE_DU_LION.hauteurDeLOr).toBeGreaterThan(VEINE_DU_LION.hauteurDuSerti);
  });

  it('des orbites sombres sur les yeux du modèle, sans les creuser, qui ne s’allument jamais', () => {
    for (const f of [monde, defi]) {
      const orbites = triangles(f, 'sculpture', SENTINELLE.orbite);
      expect(orbites.length).toBe(2);
      for (const t of orbites) expect(centre(f, t)[1]).toBeGreaterThan(4.3);
    }
  });
});
