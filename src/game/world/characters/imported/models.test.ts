import { existsSync, readFileSync } from 'node:fs';
import type { BiomeId } from '../../../biomes';
import { compacterGlb } from '../../../../../scripts/rendu/compacterGlb.mjs';
import { SENTINELLE } from '../colors';
import { ESPECES } from '../paintedCreatures';
import { couleursAllumees, DEMI_LARGEUR_DE_SENTINELLE, frontDeLueur, HAUTEUR_DE_SENTINELLE } from '../sentinel';
import { tailleDe } from '../template';
import { fusionDesCreatures } from '../merges';
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

it('de loin, une créature n’a aucune couleur plus sombre que la clarté 0,42 ; de près, elle garde les siennes', () => {
  const clarte = (c: number) => (Math.max(c >> 16, (c >> 8) & 255, c & 255) + Math.min(c >> 16, (c >> 8) & 255, c & 255)) / 2 / 255;
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

describe('Le squelette de Mousso (scripts/rendu/modeles/squelette.py)', () => {
  const MOUSSO = 'french-6e-phonology' as const;

  it('de près, Mousso a ses os, placés dans son corps, et quatre poids de somme 1 par sommet ; de loin, aucun', () => {
    const f = modeleImporte('creature', MOUSSO, 'pres')!;
    expect(f.skin?.bones.map((b) => b.name)).toEqual(['hips', 'spine', 'head', 'thigh.L', 'shin.L', 'thigh.R', 'shin.R', 'arm.L', 'arm.R']);
    const { bas, haut, large } = cadre(f.positions);
    for (const b of f.skin!.bones) {
      expect(b.head[1], b.name).toBeGreaterThanOrEqual(bas);
      expect(b.head[1], b.name).toBeLessThanOrEqual(haut);
      expect(Math.max(Math.abs(b.head[0]), Math.abs(b.head[2])), b.name).toBeLessThanOrEqual(large);
    }
    expect(f.skin!.joints.length).toBe((f.positions.length / 3) * 4);
    for (let v = 0; v < f.positions.length / 3; v++) {
      const somme = f.skin!.weights[v * 4] + f.skin!.weights[v * 4 + 1] + f.skin!.weights[v * 4 + 2] + f.skin!.weights[v * 4 + 3];
      expect(somme).toBeCloseTo(1, 5);
    }
    // Les pieds suivent les jambes, la tête suit la tête, les mains (à mi-hauteur, le plus sur les côtés) les bras.
    const lourd = (v: number) => f.skin!.bones[f.skin!.joints[v * 4]].name;
    const mains = [1, -1].map((signe) => {
      let meilleur = -1;
      for (let v = 0; v < f.positions.length / 3; v++) {
        const y = f.positions[v * 3 + 1];
        if (y > 0.3 * haut && y < 0.55 * haut && (meilleur < 0 || signe * (f.positions[meilleur * 3] - f.positions[v * 3]) > 0)) meilleur = v;
      }
      return lourd(meilleur);
    });
    expect(mains.sort()).toEqual(['arm.L', 'arm.R']);
    for (let v = 0; v < f.positions.length / 3; v++) {
      if (f.positions[v * 3 + 1] < 0.05 * haut) expect(lourd(v)).toMatch(/^shin\./);
      if (f.positions[v * 3 + 1] > 0.85 * haut) expect(lourd(v)).toBe('head');
    }
    expect(modeleImporte('creature', MOUSSO, 'loin')!.skin).toBeUndefined();
  });

  it('le compactage du build garde ses os et ses poids', () => {
    const brut = lu(fichierDuModele(nomDuModele('creature', MOUSSO)!, 'pres'));
    const a = lireGlb(brut);
    const c = compacterGlb(new Uint8Array(brut));
    const b = lireGlb(c.buffer.slice(c.byteOffset, c.byteOffset + c.byteLength) as ArrayBuffer);
    expect(b.skin?.bones).toEqual(a.skin!.bones);
    expect(b.skin!.joints).toEqual(a.skin!.joints);
    expect(b.skin!.weights).toEqual(a.skin!.weights);
  });

  it('dans la fusion, ses os suivent ceux de toutes les créatures, portés par son corps', () => {
    const places = [
      { id: 'french-6e-letter-confusion' as const, origin: { x: 0, y: 0, z: 0 }, cubes: [{ x: 0, y: 0, z: 0 }] },
      { id: MOUSSO, origin: { x: 10, y: 0, z: 0 }, cubes: [{ x: 0, y: 0, z: 0 }] },
    ];
    const f = fusionDesCreatures(places, MOUSSO);
    const os = f.squelette.slice(4);
    expect(os.map((o) => o.nom)).toEqual(modeleImporte('creature', MOUSSO, 'pres')!.skin!.bones.map((b) => b.name));
    expect(os.every((o) => o.id === MOUSSO)).toBe(true);
    expect(os[0].parent).toBe(2);
    const { debut, fin } = f.plages[1];
    for (let v = debut * 3; v < fin * 3; v++) {
      expect(f.poids!.joints[v * 4]).toBeGreaterThanOrEqual(4);
      expect(f.os[v]).toBeGreaterThanOrEqual(4);
    }
    // L'autre créature suit son seul os, au poids 1.
    for (let v = f.plages[0].debut * 3; v < f.plages[0].fin * 3; v++) {
      expect(f.poids!.joints[v * 4]).toBe(f.os[v]);
      expect(f.poids!.weights[v * 4]).toBe(1);
    }
    // De loin, plus de squelette ni de poids.
    expect(fusionDesCreatures(places).poids).toBeUndefined();
  });
});
