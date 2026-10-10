import { existsSync, readFileSync } from 'node:fs';
import type { BiomeId } from '../../../biomes';
import { compacterGlb } from '../../../../../scripts/rendu/compacterGlb.mjs';
import { SENTINELLE } from '../colors';
import { ESPECES } from '../paintedCreatures';
import { couleursAllumees, DEMI_LARGEUR_DE_SENTINELLE, frontDeLueur, HAUTEUR_DE_SENTINELLE } from '../sentinel';
import { tailleDe } from '../template';
import { FLAT_COLORS, smoothIsolated } from './flatColors';
import { lireGlb } from './glb';
import { chargerLesModelesDuDisque, fichierDuModele } from './fromDisk.testing';
import { ILES_IMPORTEES, modeleImporte, nomDuModele, type Genre, type Niveau } from './models';

const GENRES: Genre[] = ['gardien', 'creature'];
const NIVEAUX: Niveau[] = ['pres', 'loin'];
const lu = (f: string) => {
  const b = readFileSync(f);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
};
/** Le plus bas et le plus haut, puis le plus grand écart au centre en x et en z. */
function cadre(p: Float32Array): { bas: number; haut: number; large: number } {
  let [bas, haut, large] = [Infinity, -Infinity, 0];
  for (let i = 0; i < p.length; i += 3) {
    bas = Math.min(bas, p[i + 1]);
    haut = Math.max(haut, p[i + 1]);
    large = Math.max(large, Math.abs(p[i]), Math.abs(p[i + 2]));
  }
  return { bas, haut, large };
}

/** La clarté d'une couleur, de 0 à 1 (le L de TSL). */
const clarte = (c: number) => (Math.max(c >> 16, (c >> 8) & 255, c & 255) + Math.min(c >> 16, (c >> 8) & 255, c & 255)) / 2 / 255;

beforeAll(() => chargerLesModelesDuDisque());

it('les quinze îles du 6e ont leur Gardien et leur créature, de près et de loin', () => {
  expect(ILES_IMPORTEES).toHaveLength(15);
  for (const id of ILES_IMPORTEES)
    for (const genre of GENRES)
      for (const niveau of NIVEAUX) {
        const nom = nomDuModele(genre, id)!;
        expect(existsSync(fichierDuModele(nom, niveau)), `${nom} ${niveau}`).toBe(true);
        expect(modeleImporte(genre, id, niveau), `${nom} ${niveau}`).not.toBeNull();
      }
});

it('un Gardien importé a la taille d’une sentinelle : 8 blocs, socle compris, dans ses cinq cases', () => {
  for (const id of ILES_IMPORTEES)
    for (const niveau of NIVEAUX) {
      const { bas, haut, large } = cadre(modeleImporte('gardien', id, niveau)!.positions);
      expect(bas, id).toBeCloseTo(0, 5);
      expect(haut, id).toBeLessThanOrEqual(HAUTEUR_DE_SENTINELLE + 1e-4);
      expect(large, id).toBeLessThanOrEqual(DEMI_LARGEUR_DE_SENTINELLE + 1e-4);
      // Il touche le haut ou les bords : à la plus grande taille qui tient.
      expect(Math.max(haut / HAUTEUR_DE_SENTINELLE, large / DEMI_LARGEUR_DE_SENTINELLE), id).toBeGreaterThan(0.99);
    }
});

it('une créature importée a la taille de son gabarit, les pieds au sol', () => {
  for (const id of ILES_IMPORTEES) {
    const { bas, haut } = cadre(modeleImporte('creature', id, 'pres')!.positions);
    expect(bas, id).toBeCloseTo(0, 5);
    expect(haut, id).toBeCloseTo(tailleDe(ESPECES[id]), 4);
  }
});

it('de loin, une créature n’a aucune couleur plus sombre que la clarté 0,42 ; de près, elle garde ses accents sombres', () => {
  let sombresDePres = 0;
  for (const id of ILES_IMPORTEES) {
    for (const c of modeleImporte('creature', id, 'loin')!.teintes) expect(clarte(c), id).toBeGreaterThanOrEqual(0.415);
    sombresDePres += [...modeleImporte('creature', id, 'pres')!.teintes].filter((c) => clarte(c) < 0.4).length;
  }
  expect(sombresDePres).toBeGreaterThan(0);
});

it('éteint, un Gardien porte du lichen ; rallumé, toute sa pierre est au Sable', () => {
  const f = modeleImporte('gardien', 'french-6e-letter-confusion' as BiomeId, 'pres')!;
  expect([...f.teintes].filter((t) => t === SENTINELLE.lichen).length).toBeGreaterThan(10);
  const allume = couleursAllumees(f, 1);
  const eteint = couleursAllumees(f, 0);
  // La même facette de lichen et de pierre, à la même nuance, a la même couleur une fois rallumée.
  const t = [...f.teintes].findIndex((c) => c === SENTINELLE.lichen);
  expect(eteint[t * 9]).not.toBeCloseTo(allume[t * 9], 3);
});

it('les lueurs montent dans la pierre des pieds vers la tête', () => {
  expect(frontDeLueur(0, 0)).toBe(0);
  expect(frontDeLueur(1, 1)).toBe(1);
  expect(frontDeLueur(0.3, 0)).toBe(1);
  expect(frontDeLueur(0.3, 0.8)).toBe(0);
  for (const h of [0.1, 0.4, 0.7]) expect(frontDeLueur(0.5, h)).toBeGreaterThanOrEqual(frontDeLueur(0.4, h));
  const f = modeleImporte('gardien', 'french-6e-reading' as BiomeId, 'pres')!;
  const mi = couleursAllumees(f, { pierre: 0, lueurs: 0.5 });
  const bas = f.hauteurs!.findIndex((h, t) => h < 0.2 && f.teintes[t] === SENTINELLE.pierre && f.normals[t * 9 + 1] > 0.9);
  const haut = f.hauteurs!.findIndex((h, t) => h > 0.9 && f.teintes[t] === SENTINELLE.pierre && f.normals[t * 9 + 1] > 0.9);
  // Le rouge du Sable dépasse celui de la pierre : en bas il est monté, en haut pas encore.
  expect(mi[bas * 9]).toBeGreaterThan(couleursAllumees(f, 0)[bas * 9]);
  expect(mi[haut * 9]).toBeCloseTo(couleursAllumees(f, 0)[haut * 9], 5);
});

it('le modèle compacté au build se lit comme l’original, à moins d’un millième de sa taille près', () => {
  for (const nom of [nomDuModele('gardien', 'french-6e-phonology')!, nomDuModele('creature', 'technology-6e-objects')!]) {
    const brut = lu(fichierDuModele(nom, 'pres'));
    const a = lireGlb(brut);
    const c = compacterGlb(new Uint8Array(brut));
    const b = lireGlb(c.buffer.slice(c.byteOffset, c.byteOffset + c.byteLength) as ArrayBuffer);
    expect(c.byteLength).toBeLessThan(brut.byteLength / 2);
    expect(b.positions.length).toBe(a.positions.length);
    const { haut } = cadre(a.positions);
    for (let i = 0; i < a.positions.length; i++) expect(Math.abs(b.positions[i] - a.positions[i])).toBeLessThan(haut / 1000);
    for (let i = 0; i < a.colors.length; i++) expect(Math.abs(b.colors[i] - a.colors[i])).toBeLessThan(1 / 255 + 1e-6);
  }
});

it('chaque créature a ses aplats : les quatre couleurs de son modèle de près, chacune avec sa cible', () => {
  const srgb = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
  for (const id of ILES_IMPORTEES) {
    const table = FLAT_COLORS[id];
    expect(table, id).toBeDefined();
    const a = lireGlb(lu(fichierDuModele(nomDuModele('creature', id)!, 'pres')));
    const duModele = new Set<number>();
    for (let i = 0; i < a.colors.length; i += 3) {
      const [r, g, b] = [0, 1, 2].map((j) => Math.round(srgb(a.colors[i + j]) * 255));
      duModele.add((r << 16) | (g << 8) | b);
    }
    expect([...duModele].sort(), id).toEqual(Object.keys(table!).map(Number).sort());
  }
});

it('de près, une créature n’a que les couleurs de ses aplats, et son corps se détache de l’herbe', () => {
  for (const id of ILES_IMPORTEES) {
    const cibles = new Set(Object.values(FLAT_COLORS[id]!));
    const f = modeleImporte('creature', id, 'pres')!;
    for (const c of f.teintes) expect(cibles.has(c), id).toBe(true);
    // La couleur qui couvre le plus de facettes, le corps, est plus claire que l'herbe (clarté 0,36).
    const parts = new Map<number, number>();
    for (const c of f.teintes) parts.set(c, (parts.get(c) ?? 0) + 1);
    const corps = [...parts].sort((x, y) => y[1] - x[1])[0][0];
    expect(clarte(corps), id).toBeGreaterThan(0.4);
  }
});

it('un triangle seul au milieu d’une autre couleur la prend ; une zone de deux triangles reste', () => {
  // Une bande de quatre triangles, chacun voisin du suivant par une arête.
  const p = Float32Array.from([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 2, 0, 0, 1, 1, 0, 2, 0, 0, 2, 1, 0, 1, 1, 0]);
  expect([...smoothIsolated(p, Int32Array.from([1, 2, 1, 1]))]).toEqual([1, 1, 1, 1]);
  expect([...smoothIsolated(p, Int32Array.from([1, 2, 2, 1]))]).toEqual([1, 2, 2, 1]);
});
