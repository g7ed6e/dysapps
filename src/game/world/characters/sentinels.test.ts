import { BIOMES, type BiomeId } from '../../biomes';
import { ARCHIPELAGO_IDS } from '../archipelagos';
import { lineaire } from '../landMesh';
import { LUEUR, SENTINELLE } from './colors';
import type { FacettesDePersonnage, V3 } from './painted';
import { toutConstruit } from '../budget';
import { GRUE } from '../decor/4e';
import { PHARES } from '../decor/lighthouse';
import { bossIsletCenter, guardianPlacements } from '../terrain';
import { fusionDesGardiens, pointDePose } from './merges';
import {
  allumage,
  couleursAllumees,
  DEMI_LARGEUR_DE_SENTINELLE,
  ECHELLE_DANS_LE_MONDE,
  EPAISSEUR_DES_VEINES_DANS_LE_MONDE,
  FOYER,
  HAUT_DU_SOCLE,
  HAUTEUR_DANS_LE_MONDE,
  HAUTEUR_DE_SENTINELLE,
} from './sentinel';
import { sentinelleAuDefi, sentinelleDuMonde, sentinellePeinte, STATUES } from './paintedSentinels';
import { enveloppeDe } from '../budget';
import { HAUTEUR_DU_LION } from './statues/lion';

const nbTriangles = (f: FacettesDePersonnage) => f.pieces.length;

function sommet(f: FacettesDePersonnage, t: number, k: number): V3 {
  const o = t * 9 + k * 3;
  return [f.positions[o], f.positions[o + 1], f.positions[o + 2]];
}

/** Chaque normale est unitaire et suit l'ordre des sommets (la face avant, pour Three.js). */
function normalesCoherentes(f: FacettesDePersonnage): boolean {
  for (let t = 0; t < nbTriangles(f); t++) {
    const [a, b, c] = [0, 1, 2].map((k) => sommet(f, t, k));
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const len = Math.hypot(n[0], n[1], n[2]);
    const m = [f.normals[t * 9], f.normals[t * 9 + 1], f.normals[t * 9 + 2]];
    if (Math.abs(Math.hypot(m[0], m[1], m[2]) - 1) > 1e-4) return false;
    if ((n[0] * m[0] + n[1] * m[1] + n[2] * m[2]) / len < 0.999) return false;
  }
  return true;
}

const lin = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255].map((v) => lineaire(v / 255));
const couleurDe = (colors: Float32Array, t: number, k: number) => Array.from(colors.slice(t * 9 + k * 3, t * 9 + k * 3 + 3));

/**
 * Les lueurs d'une sentinelle (hors flamme) : les amas de triangles des veines dont les boîtes se touchent à un
 * cinquième de bloc près (deux traits aussi proches se lisent comme une seule lueur : le signe égal, les deux faces
 * d'une aile).
 */
function lueurs(f: FacettesDePersonnage): number {
  const veines = f.table.findIndex((p) => p.nom === 'veines');
  const ts = [...f.pieces.keys()].filter((t) => f.pieces[t] === veines);
  const boites = ts.map((t) => {
    const b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    for (let k = 0; k < 3; k++)
      sommet(f, t, k).forEach((v, a) => {
        b[a] = Math.min(b[a], v);
        b[a + 3] = Math.max(b[a + 3], v);
      });
    return b;
  });
  const parent = ts.map((_, i) => i);
  const racine = (i: number): number => (parent[i] === i ? i : (parent[i] = racine(parent[i])));
  for (let i = 0; i < ts.length; i++)
    for (let j = i + 1; j < ts.length; j++) {
      const [a, b] = [boites[i], boites[j]];
      if ([0, 1, 2].every((k) => a[k] <= b[k + 3] + 0.2 && b[k] <= a[k + 3] + 0.2)) parent[racine(i)] = racine(j);
    }
  return new Set(ts.map((_, i) => racine(i))).size;
}

/** Les sentinelles sans visage : le Spectre voilé, la Locomotive, la Grande Antenne, le Soleil et le Papillon de cuivre. */
const SANS_VISAGE: BiomeId[] = ['english-5e-grammar', 'english-4e-grammar', 'english-3e-comprehension', 'lv2-4e-daily-life', 'lv2-3e-travel'];
/**
 * Les sentinelles basses : leur haut, en blocs. La Diligence, plus longue que haute (retouche du directeur artistique) ;
 * le Soleil de cuivre, sans mât (DA, LV2-4), qui repose sur son rayon du bas.
 */
const BASSES: Partial<Record<BiomeId, [number, number]>> = {
  'lv2-5e-introductions': [5, 5.5],
  'lv2-4e-daily-life': [5.8, 6.3],
  'english-6e-vocabulary': [HAUTEUR_DU_LION - 0.005, HAUTEUR_DU_LION + 0.005],
};
/**
 * Les sentinelles tirées d'un modèle importé (le Lion de pierre, ./statues/lion.ts) : couchées sur leur propre quai, sans
 * le socle commun, la flamme commune posée sur le quai, plus longues que les cinq cases (leur emprise est tenue par ./lion.test.ts), et la
 * crinière comme lueur (huit veines, au défi seulement). Leurs règles propres sont dans ./lion.test.ts.
 */
const IMPORTEES: BiomeId[] = ['english-6e-vocabulary'];
/** Les sentinelles basses plus longues que hautes. */
const LONGUES: BiomeId[] = ['lv2-5e-introductions'];

describe('L’allumage des sentinelles', () => {
  it('éteinte (0) et rallumée (1), exactement les couleurs du directeur artistique', () => {
    expect(allumage(SENTINELLE.pierre, 0)).toBe(0x8e8c84);
    expect(allumage(SENTINELLE.lichen, 0)).toBe(0x7a8a6a);
    expect(allumage(LUEUR, 0)).toBe(SENTINELLE.cendre);
    expect(allumage(SENTINELLE.pierre, 1)).toBe(0xdaa66a);
    expect(allumage(SENTINELLE.lichen, 1)).toBe(0xdaa66a);
    expect(allumage(LUEUR, 1)).toBe(0xffd866);
    expect(allumage(SENTINELLE.pierre, -1)).toBe(0x8e8c84);
    expect(allumage(SENTINELLE.pierre, 2)).toBe(0xdaa66a);
  });

  it('monte sans à-coup entre les deux, et laisse les orbites sombres à tous les degrés', () => {
    const r = (c: number) => (c >> 16) & 255;
    let avant = r(allumage(SENTINELLE.pierre, 0));
    for (let d = 0.1; d <= 1; d += 0.1) {
      const c = r(allumage(SENTINELLE.pierre, d));
      expect(c).toBeGreaterThanOrEqual(avant);
      avant = c;
    }
    for (const d of [0, 0.3, 0.5, 1]) expect(allumage(SENTINELLE.orbite, d)).toBe(SENTINELLE.orbite);
  });

  it('au défi (lot 6), les lueurs s’allument avant la pierre : chaque partie à son degré', () => {
    const f = sentinellePeinte('french-6e-letter-confusion');
    const lueursSeules = couleursAllumees(f, { pierre: 0, lueurs: 1 });
    const pleine = couleursAllumees(f, 1);
    let lueurs = 0;
    for (let t = 0; t < nbTriangles(f); t++)
      for (let k = 0; k < 3; k++) {
        if (f.teintes[t] === LUEUR) {
          lueurs++;
          expect(couleurDe(lueursSeules, t, k)).toEqual(couleurDe(pleine, t, k));
        } else expect(couleurDe(lueursSeules, t, k)).toEqual(couleurDe(f.colors, t, k));
      }
    expect(lueurs).toBeGreaterThan(0);
    expect(Array.from(couleursAllumees(f, { pierre: 0.4, lueurs: 0.4 }))).toEqual(Array.from(couleursAllumees(f, 0.4)));
  });

  it('les couleurs d’un modèle : éteintes par défaut, la lueur pleine et la pierre rallumée à 1', () => {
    const f = sentinellePeinte('french-6e-letter-confusion');
    expect(Array.from(couleursAllumees(f, 0))).toEqual(Array.from(f.colors));
    const allumees = couleursAllumees(f, 1);
    const dans = new Float32Array(f.colors.length);
    expect(couleursAllumees(f, 1, dans)).toBe(dans);
    for (let t = 0; t < nbTriangles(f); t++) {
      const ny = f.normals[t * 9 + 1];
      for (let k = 0; k < 3; k++) {
        if (f.teintes[t] === LUEUR) expect(couleurDe(allumees, t, k)).toEqual(lin(0xffd866).map(Math.fround));
        if (f.teintes[t] === SENTINELLE.orbite) expect(couleurDe(allumees, t, k)).toEqual(couleurDe(f.colors, t, k));
        if (f.teintes[t] === SENTINELLE.pierre && ny > 0.999) {
          expect(couleurDe(f.colors, t, k)).toEqual(lin(0x8e8c84).map(Math.fround));
          expect(couleurDe(allumees, t, k)).toEqual(lin(0xdaa66a).map(Math.fround));
        }
      }
    }
  });
});

describe('Les Gardiens en sentinelles', () => {
  it('chaque île a sa sentinelle', () => {
    expect(Object.keys(STATUES).sort()).toEqual(BIOMES.map((b) => b.id).sort());
    expect(new Set(Object.values(STATUES).map((s) => s.nom)).size).toBe(BIOMES.length);
  });

  it('tiennent dans leur budget, toutes ensemble : 2 300 triangles aux Premiers Rivages (le Lion de pierre importé), 1 800 ailleurs', () => {
    expect(enveloppeDe('gardiens', '6e').triangles).toBe(2_300);
    for (const a of ARCHIPELAGO_IDS) {
      const somme = BIOMES.filter((b) => b.classe === a).reduce((n, b) => n + nbTriangles(sentinellePeinte(b.id)), 0);
      expect(somme, a).toBeLessThanOrEqual(enveloppeDe('gardiens', a).triangles);
      if (a !== '6e') expect(enveloppeDe('gardiens', a).triangles).toBe(1_800);
    }
  });

  it('se dressent toutes sur le même socle octogonal', () => {
    const socleDe = (id: BiomeId) => {
      const f = sentinellePeinte(id);
      const i = f.table.findIndex((p) => p.nom === 'socle');
      return Array.from(f.positions).filter((_, j) => f.pieces[Math.floor(j / 9)] === i);
    };
    const reference = socleDe('french-6e-phonology');
    expect(reference.length).toBeGreaterThan(0);
    for (const b of BIOMES.filter((x) => !IMPORTEES.includes(x.id))) expect(socleDe(b.id), b.id).toEqual(reference);
    // Le Lion de pierre se couche sur la dalle de son concept (proposition du directeur artistique) : pas de socle commun.
    for (const id of IMPORTEES) expect(STATUES[id].socle, id).toBe(false);
  });

  for (const b of BIOMES)
    describe(`${STATUES[b.id]?.nom} (${b.id})`, () => {
      const f = sentinellePeinte(b.id);
      const nom = (t: number) => f.table[f.pieces[t]].nom;

      const basse = BASSES[b.id];
      const longue = LONGUES.includes(b.id);
      const importee = IMPORTEES.includes(b.id);
      it(basse ? `basse${longue ? ' et plus longue que haute' : ''}, les pieds en 0 ; cinq cases de large au plus` : 'huit blocs de haut, socle compris, les pieds en 0 ; cinq cases de large au plus', () => {
        let [bas, haut] = [Infinity, -Infinity];
        for (let i = 0; i < f.positions.length; i += 3) {
          bas = Math.min(bas, f.positions[i + 1]);
          haut = Math.max(haut, f.positions[i + 1]);
          if (importee) continue;
          expect(Math.abs(f.positions[i])).toBeLessThanOrEqual(DEMI_LARGEUR_DE_SENTINELLE);
          expect(Math.abs(f.positions[i + 2])).toBeLessThanOrEqual(DEMI_LARGEUR_DE_SENTINELLE);
        }
        expect(bas).toBeCloseTo(0, 6);
        if (!basse) return expect(Math.abs(haut - HAUTEUR_DE_SENTINELLE)).toBeLessThan(0.005);
        expect(haut).toBeGreaterThanOrEqual(basse[0]);
        expect(haut).toBeLessThanOrEqual(basse[1]);
        if (!longue) return;
        // Sa longueur, le long de son grand axe (tourné de son `tour` dans le monde).
        const tour = STATUES[b.id].tour?.monde ?? 0;
        let [gauche, droite] = [Infinity, -Infinity];
        for (let t = 0; t < nbTriangles(f); t++)
          if (nom(t) === 'sculpture')
            for (let k = 0; k < 3; k++) {
              const [x, , z] = sommet(f, t, k);
              const l = x * Math.cos(tour) - z * Math.sin(tour);
              [gauche, droite] = [Math.min(gauche, l), Math.max(droite, l)];
            }
        expect(droite - gauche).toBeGreaterThan(haut - HAUT_DU_SOCLE);
      });

      if (importee)
        it('trois pièces figées, la sculpture, la flamme et les veines ; seules la flamme et les veines s’allument, et elles seules sont de lueur', () => {
          expect(f.table.map((p) => p.nom)).toEqual(['sculpture', 'flamme', 'veines']);
          expect(f.table.map((p) => p.lueur ?? null)).toEqual([null, 'allumage', 'allumage']);
          for (const g of [f, sentinelleAuDefi(b.id)]) for (let t = 0; t < nbTriangles(g); t++) expect(g.teintes[t] === LUEUR).toBe(['flamme', 'veines'].includes(g.table[g.pieces[t]].nom));
        });
      else
      it('quatre pièces figées ; seules la flamme et les veines s’allument, et elles seules sont de lueur', () => {
        expect(f.table.map((p) => p.nom)).toEqual(['socle', 'sculpture', 'flamme', 'veines']);
        expect(f.table.map((p) => p.lueur ?? null)).toEqual([null, null, 'allumage', 'allumage']);
        for (const nomDePiece of ['socle', 'sculpture', 'flamme', 'veines']) expect(f.pieces.includes(f.table.findIndex((p) => p.nom === nomDePiece)), nomDePiece).toBe(true);
        for (let t = 0; t < nbTriangles(f); t++) expect(f.teintes[t] === LUEUR, `triangle ${t} (${nom(t)})`).toBe(nom(t) === 'flamme' || nom(t) === 'veines');
      });

      if (!importee)
      it('porte une à trois lueurs selon l’objet, en plus de la flamme', () => {
        const n = lueurs(f);
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(3);
      });

      it(importee ? 'de la pierre, du lichen, des orbites, la lueur et le serti de ses veines, rien d’autre' : 'de la pierre, du lichen, des orbites et la lueur, rien d’autre', () => {
        const permises = new Set<number>([SENTINELLE.pierre, SENTINELLE.lichen, SENTINELLE.orbite, LUEUR, ...(importee ? [SENTINELLE.serti] : [])]);
        for (const p of [...f.palette, ...sentinelleAuDefi(b.id).palette]) expect(permises.has(p.couleur), p.couleur.toString(16)).toBe(true);
      });

      it(SANS_VISAGE.includes(b.id) ? 'n’a pas de visage' : 'regarde vers −Z : ses orbites, sombres, sont sur la sculpture et tournées vers l’élève', () => {
        const orbites = [...f.teintes.keys()].filter((t) => f.teintes[t] === SENTINELLE.orbite);
        if (SANS_VISAGE.includes(b.id)) return expect(orbites).toEqual([]);
        expect(orbites.length).toBeGreaterThanOrEqual(2);
        for (const t of orbites) {
          expect(nom(t)).toBe('sculpture');
          // Vers −Z, tournées avec la statue quand elle se tourne pour se montrer de profil (`tour`).
          const tour = STATUES[b.id].tour?.monde ?? 0;
          // Le Lion de pierre : ses orbites sont les facettes des yeux du modèle, en biais dans l'ombre du front (sans les
          // creuser davantage), tournées vers l'élève à 45° au plus.
          expect(-Math.sin(tour) * f.normals[t * 9] - Math.cos(tour) * f.normals[t * 9 + 2]).toBeGreaterThan(importee ? 0.7 : 0.95);
        }
      });

      if (!importee)
      it('porte la flamme dans le foyer, devant', () => {
        const flamme = [...f.pieces.keys()].filter((t) => nom(t) === 'flamme');
        for (const t of flamme) for (let k = 0; k < 3; k++) expect(Math.abs(sommet(f, t, k)[2] - FOYER.z)).toBeLessThan(0.3);
        expect(FOYER.z).toBeLessThan(0);
      });

      it('a des facettes cohérentes', () => {
        expect(normalesCoherentes(f)).toBe(true);
      });
    });
});

describe('Les sentinelles qui se tournent pour se montrer de profil (la Diligence)', () => {
  const tournees = BIOMES.filter((b) => STATUES[b.id].tour);
  it('la Diligence, et le Soleil et le Papillon de cuivre, qu’on ne doit pas voir par la tranche (le Lion de pierre ne tourne jamais : sa dalle suit l’axe nord-sud)', () =>
    expect(tournees.map((b) => b.id).sort()).toEqual(['lv2-3e-travel', 'lv2-4e-daily-life', 'lv2-5e-introductions']));

  it('le Soleil de cuivre, dans le monde : de face (à 33° au plus) pour la caméra du Jardin (72°), du Théâtre (20 à 42°) et du rallumage (85°) ; dans les cinq cases', () => {
    const f = sentinellePeinte('lv2-4e-daily-life');
    const sculpture = f.table.findIndex((p) => p.nom === 'sculpture');
    // La patine du disque, sur la sculpture (le socle a sa mousse, qui ne tourne pas).
    const lichen = [...f.teintes.keys()].filter((t) => f.teintes[t] === SENTINELLE.lichen && f.pieces[t] === sculpture);
    expect(lichen.length).toBeGreaterThan(0);
    for (const deg of [20, 42, 72, 85]) {
      const [cx, cz] = [Math.sin((deg * Math.PI) / 180), -Math.cos((deg * Math.PI) / 180)];
      for (const t of lichen) expect(cx * f.normals[t * 9] + cz * f.normals[t * 9 + 2]).toBeGreaterThan(Math.cos((34 * Math.PI) / 180));
    }
    for (let i = 0; i < f.positions.length; i += 3) {
      expect(Math.abs(f.positions[i])).toBeLessThanOrEqual(DEMI_LARGEUR_DE_SENTINELLE);
      expect(Math.abs(f.positions[i + 2])).toBeLessThanOrEqual(DEMI_LARGEUR_DE_SENTINELLE);
    }
  });

  for (const b of tournees.filter((x) => x.id === 'lv2-5e-introductions'))
    it(`${STATUES[b.id].nom} : au défi, sa portière face à la caméra de trois quarts, dans les cinq cases ; le socle ne tourne pas`, () => {
      const f = sentinelleAuDefi(b.id);
      const monde = sentinellePeinte(b.id);
      expect(f).not.toBe(monde);
      expect(f.pieces.length).toBe(monde.pieces.length);
      // La caméra du défi (Guardians.tsx, `cameraDirection`), vue de dessus.
      const [cx, cz] = [-0.55, -0.85].map((v) => v / Math.hypot(0.55, 0.85));
      const orbites = [...f.teintes.keys()].filter((t) => f.teintes[t] === SENTINELLE.orbite);
      expect(orbites.length).toBeGreaterThanOrEqual(2);
      for (const t of orbites) expect(cx * f.normals[t * 9] + cz * f.normals[t * 9 + 2]).toBeGreaterThan(0.95);
      for (let i = 0; i < f.positions.length; i += 3) {
        expect(Math.abs(f.positions[i])).toBeLessThanOrEqual(DEMI_LARGEUR_DE_SENTINELLE);
        expect(Math.abs(f.positions[i + 2])).toBeLessThanOrEqual(DEMI_LARGEUR_DE_SENTINELLE);
      }
      const socle = (g: typeof f) => Array.from(g.positions).filter((_, j) => g.pieces[Math.floor(j / 9)] === g.table.findIndex((p) => p.nom === 'socle'));
      expect(socle(f)).toEqual(socle(monde));
    });
});

describe('Les sentinelles dans le monde (revue d’ensemble du directeur artistique, DA-5)', () => {
  const { progress, world: village } = toutConstruit();

  it('font environ 5 blocs socle compris (la Diligence, basse, à l’échelle), plus basses que le phare de Grimoire (6 cases) et que la grue de l’Atelier (9)', () => {
    expect(HAUTEUR_DANS_LE_MONDE).toBeGreaterThanOrEqual(4.8);
    expect(HAUTEUR_DANS_LE_MONDE).toBeLessThanOrEqual(5.4);
    expect(HAUTEUR_DANS_LE_MONDE).toBeLessThan(PHARES['6e'].H);
    expect(HAUTEUR_DANS_LE_MONDE).toBeLessThan(GRUE.hauteur);
    for (const a of ARCHIPELAGO_IDS) {
      const places = guardianPlacements(a, progress, village.links);
      const f = fusionDesGardiens(places);
      places.forEach((p, i) => {
        const pied = pointDePose(p)[1];
        let haut = -Infinity;
        for (let t = f.plages[i].debut; t < f.plages[i].fin; t++) for (let k = 0; k < 3; k++) haut = Math.max(haut, f.positions[t * 9 + k * 3 + 1]);
        // Une sentinelle basse (la Diligence) rapetisse de même, à partir de son propre haut.
        const basse = BASSES[p.id];
        if (!basse) return expect(haut - pied, p.id).toBeCloseTo(HAUTEUR_DANS_LE_MONDE, 2);
        expect(haut - pied, p.id).toBeGreaterThanOrEqual(basse[0] * ECHELLE_DANS_LE_MONDE - 0.005);
        expect(haut - pied, p.id).toBeLessThanOrEqual(basse[1] * ECHELLE_DANS_LE_MONDE + 0.005);
      });
    }
  });

  it('gardent des veines aussi épaisses à l’écran : élargies d’autant que la statue rapetisse, sans un triangle de plus', () => {
    expect(EPAISSEUR_DES_VEINES_DANS_LE_MONDE * ECHELLE_DANS_LE_MONDE).toBeCloseTo(1, 9);
    for (const b of BIOMES) {
      const [defi, monde] = [sentinellePeinte(b.id), sentinelleDuMonde(b.id)];
      expect(monde.pieces.length, b.id).toBe(defi.pieces.length);
      expect(Array.from(monde.teintes), b.id).toEqual(Array.from(defi.teintes));
      expect(normalesCoherentes(monde), b.id).toBe(true);
    }
  });

  it('la caméra du rallumage vise le milieu de la sentinelle, un bloc au-dessus du point de l’îlot', () => {
    for (const b of BIOMES.filter((x) => x.classe === '6e')) {
      const g = guardianPlacements('6e', progress, village.links).find((p) => p.id === b.id);
      if (!g) continue;
      const pied = pointDePose(g)[1];
      expect(bossIsletCenter(b.id).z + 1, b.id).toBeCloseTo(pied + HAUTEUR_DANS_LE_MONDE / 2, 1);
    }
  });
});
