import { BIOMES } from '../biomes';
import { mixColor } from '../world/daylight';
import { deNuit } from '../world/palette';
import { bonhommePeint } from '../world/personnages/bonhomme';
import { LUEUR, SENTINELLE } from '../world/personnages/couleurs';
import { creaturePeinte } from '../world/personnages/creaturesPeintes';
import type { FacettesDePersonnage } from '../world/personnages/peint';
import { sentinellePeinte } from '../world/personnages/sentinellesPeintes';
import type { Facing } from './characters';
import { ANGLE_DU_BONHOMME, GESTES_DU_PAS } from './personnagesPeints';
import { NUIT_OCEAN, PALIERS, peinture, sombreDe } from './painted';
import { AtelierDePersonnages, RASTERS_PAR_IMAGE } from './paintedSprites';
import { ECART_DES_YEUX_VIVANTS, HALO, LISERE_DE_NUIT, LUEUR_MIN, OEIL, OEIL_MIN, rasterDuModele, type OptionsDuRaster, type RasterDePersonnage } from './personnages';

const couleurs = (r: RasterDePersonnage) => new Set(Array.from(r.pixels).filter((c) => c >= 0));
const masque = (r: RasterDePersonnage) => Array.from(r.pixels, (c) => (c >= 0 ? 1 : 0)).join('');
const archipelDe = (id: string) => BIOMES.find((b) => b.id === id)!.classe;

/** Les pixels du bord : pleins, avec un voisin transparent (ou hors de l'image). */
function bord(r: RasterDePersonnage): number[] {
  const at = (i: number, j: number) => (i < 0 || j < 0 || i >= r.largeur || j >= r.hauteur ? -1 : r.pixels[j * r.largeur + i]);
  const out: number[] = [];
  for (let j = 0; j < r.hauteur; j++)
    for (let i = 0; i < r.largeur; i++) if (at(i, j) >= 0 && [at(i - 1, j), at(i + 1, j), at(i, j - 1), at(i, j + 1)].some((c) => c < 0)) out.push(at(i, j));
  return out;
}

const tousLesModeles: [string, FacettesDePersonnage, Omit<OptionsDuRaster, 'light'>][] = [
  ['bonhomme', bonhommePeint(), { archipel: '6e' }],
  ...BIOMES.map((b): [string, FacettesDePersonnage, Omit<OptionsDuRaster, 'light'>] => [`créature ${b.id}`, creaturePeinte(b.id), { archipel: b.classe }]),
  ...BIOMES.map((b): [string, FacettesDePersonnage, Omit<OptionsDuRaster, 'light'>] => [`sentinelle ${b.id}`, sentinellePeinte(b.id), { archipel: b.classe, allumage: 0 }]),
];

describe('Les personnages de la 2D peinte (lot R6)', () => {
  it.each(tousLesModeles)('%s : un bord d’un pixel dans la teinte sombre d’une couleur du modèle, jamais noir, de jour comme de nuit', (_n, f, o) => {
    const vivant = o.allumage === undefined;
    for (const light of [1, 0]) {
      const r = rasterDuModele(f, { ...o, light });
      const traits = new Set(bord(r));
      // La nuit, le bonhomme et les créatures ont un liseré clair et froid du côté éclairé, en plus du trait.
      if (vivant && light === 0) {
        expect(traits.has(LISERE_DE_NUIT)).toBe(true);
        traits.delete(LISERE_DE_NUIT);
      }
      expect(traits.size).toBe(1);
      const [trait] = traits;
      const candidats = new Set(f.palette.filter((p) => p.role === 'dominante').map((p) => sombreDe(deNuit(o.archipel, p.couleur, light))));
      expect(candidats.has(trait)).toBe(true);
      // Jamais noir : le trait garde de la couleur, tiré vers la Nuit océan.
      expect(Math.max((trait >> 16) & 255, (trait >> 8) & 255, trait & 255)).toBeGreaterThan(20);
      expect(couleurs(r).has(0)).toBe(false);
    }
  });

  it.each(tousLesModeles)('%s : la nuit ne change pas la silhouette, seulement les couleurs', (_n, f, o) => {
    const jour = rasterDuModele(f, { ...o, light: 1 });
    const nuit = rasterDuModele(f, { ...o, light: 0 });
    expect(masque(nuit)).toBe(masque(jour));
    expect([nuit.largeur, nuit.hauteur, nuit.ax, nuit.ay]).toEqual([jour.largeur, jour.hauteur, jour.ax, jour.ay]);
    expect(couleurs(nuit)).not.toEqual(couleurs(jour));
  });

  it.each(tousLesModeles)('%s : les pieds au pied du sprite, au milieu', (_n, f, o) => {
    const r = rasterDuModele(f, { ...o, light: 1 });
    // Le pixel juste au-dessus du pied est plein (le personnage se tient sur son point), et le pied est dans l'image.
    expect(r.pixels[(Math.round(r.ay) - 2) * r.largeur + Math.round(r.ax)]).toBeGreaterThanOrEqual(0);
    expect(r.ay).toBeLessThanOrEqual(r.hauteur);
  });

  it.each(tousLesModeles.filter(([, f]) => f.palette.some((p) => p.role === 'yeux') && !f.table.some((p) => p.nom === 'socle')))(
    '%s : deux yeux d’un pixel sur deux, debout, séparés de deux pixels de peau (sans pont sombre), de face',
    (_n, f, o) => {
      const r = rasterDuModele(f, { ...o, light: 1 });
      expect(r.yeux).toHaveLength(2);
      for (const e of r.yeux) expect([e.w, e.h]).toEqual([OEIL.w, OEIL.h]);
      const [a, b] = [...r.yeux].sort((p, q) => p.x - q.x);
      expect(b.x - (a.x + a.w)).toBeGreaterThanOrEqual(ECART_DES_YEUX_VIVANTS);
      // Entre les deux yeux, sur leurs lignes : ni vide, ni la couleur des yeux.
      const oeil = r.pixels[a.y * r.largeur + a.x];
      for (let j = Math.max(a.y, b.y); j < Math.min(a.y + a.h, b.y + b.h); j++)
        for (let i = a.x + a.w; i < b.x; i++) {
          expect(r.pixels[j * r.largeur + i]).toBeGreaterThanOrEqual(0);
          expect(r.pixels[j * r.largeur + i]).not.toBe(oeil);
        }
    },
  );

  // Le Comptable (Données) a les orbites sous le bord de son chapeau : d'en haut, en 2D comme en 3D, on ne les voit pas.
  const SOUS_LE_CHAPEAU = ['maths-3e-statistics'];
  const avecOrbites = BIOMES.filter((b) => sentinellePeinte(b.id).palette.some((p) => p.role === 'yeux') && !SOUS_LE_CHAPEAU.includes(b.id)).map((b) => b.id);
  it('les sentinelles sans orbites sont celles qui n’ont pas de visage (Locomotive, Spectre, Antenne, Soleil et Papillon de cuivre)', () => {
    expect(BIOMES.filter((b) => !sentinellePeinte(b.id).palette.some((p) => p.role === 'yeux')).map((b) => b.id).sort()).toEqual(['english-4e-grammar', 'lv2-4e-daily-life', 'english-5e-grammar', 'lv2-3e-travel', 'english-3e-comprehension']);
  });
  it.each(avecOrbites)('sentinelle %s : ses orbites se voient, d’au moins 2 × 2 pixels', (id) => {
    const r = rasterDuModele(sentinellePeinte(id), { archipel: archipelDe(id), light: 1, allumage: 0 });
    expect(r.yeux.length).toBeGreaterThanOrEqual(1);
    for (const e of r.yeux) expect(Math.min(e.w, e.h)).toBeGreaterThanOrEqual(OEIL_MIN);
  });

  it('le bonhomme se voit dans ses quatre directions et ses deux pas, les yeux devant et de trois quarts, pas de dos', () => {
    const vus: Record<Facing, number> = { down: 2, left: 1, right: 1, up: 0 };
    for (const facing of Object.keys(vus) as Facing[])
      for (const step of [0, 1]) {
        const r = rasterDuModele(bonhommePeint(), { archipel: '6e', light: 1, angle: ANGLE_DU_BONHOMME[facing], gestes: step ? GESTES_DU_PAS : {} });
        expect(r.yeux.length, `${facing} ${step}`).toBeGreaterThanOrEqual(vus[facing]);
        if (facing === 'up') expect(r.yeux).toHaveLength(0);
        for (const e of r.yeux) expect([e.w, e.h]).toEqual([OEIL.w, OEIL.h]);
      }
    // Le pas change la silhouette (les jambes s'écartent).
    const pas = (s: number) => masque(rasterDuModele(bonhommePeint(), { archipel: '6e', light: 1, angle: ANGLE_DU_BONHOMME.right, gestes: s ? GESTES_DU_PAS : {} }));
    expect(pas(1)).not.toBe(pas(0));
  });

  it('ce qui brille la nuit (la lanterne de Fi, Astra, Braise) garde sa lueur, sans passer par la nuit', () => {
    const lumineuses = BIOMES.filter((b) => creaturePeinte(b.id).table.some((p) => p.lueur === 'nuit'));
    expect(lumineuses.length).toBeGreaterThanOrEqual(3);
    for (const b of lumineuses) {
      const f = creaturePeinte(b.id);
      const piece = f.table.find((p) => p.lueur === 'nuit')!;
      const lueur = piece.nuit ?? f.palette.find((p) => p.role === 'lueur')!.couleur;
      // De face ou de dos (l'abdomen d'Astra est dans son dos).
      const vues = [0, Math.PI].map((angle) => couleurs(rasterDuModele(f, { archipel: b.classe, light: 0, angle })).has(lueur));
      expect(vues.some(Boolean), b.id).toBe(true);
    }
    // Les autres créatures n'ont rien de la couleur de jour à la nuit.
    const f = creaturePeinte('french-6e-phonology');
    const jour = couleurs(rasterDuModele(f, { archipel: '6e', light: 1 }));
    const nuit = couleurs(rasterDuModele(f, { archipel: '6e', light: 0 }));
    for (const c of nuit) expect(jour.has(c)).toBe(false);
  });

  it('la braise de Braise, la nuit : au moins 3 × 3 pixels de lueur, et un halo chaud fixe sur le tablier autour', () => {
    const f = creaturePeinte('maths-4e-powers');
    const lueur = f.palette.find((p) => p.role === 'lueur')!.couleur;
    const nuit = rasterDuModele(f, { archipel: '4e', light: 0 });
    const jour = rasterDuModele(f, { archipel: '4e', light: 1 });
    const at = (r: typeof nuit, i: number, j: number) => r.pixels[j * r.largeur + i];
    let carre: [number, number] | null = null;
    for (let j = 0; j + 2 < nuit.hauteur; j++)
      for (let i = 0; i + 2 < nuit.largeur; i++) {
        let plein = true;
        for (let dj = 0; dj < 3; dj++) for (let di = 0; di < 3; di++) if (at(nuit, i + di, j + dj) !== lueur) plein = false;
        if (plein) carre ??= [i, j];
      }
    expect(LUEUR_MIN).toBe(3);
    expect(carre).not.toBeNull();
    // Le halo : autour de la lueur, le personnage est plus chaud (plus rouge que bleu) qu'ailleurs.
    const chaleur = (c: number) => ((c >> 16) & 255) - (c & 255);
    const [ci, cj] = carre!;
    const autour: number[] = [];
    for (let j = cj - 1; j <= cj + 3; j++) for (let i = ci - 1; i <= ci + 3; i++) if (at(nuit, i, j) >= 0 && at(nuit, i, j) !== lueur) autour.push(chaleur(at(nuit, i, j)));
    const ailleurs = Array.from(nuit.pixels).filter((c) => c >= 0 && c !== lueur).map(chaleur);
    const moyenne = (l: number[]) => l.reduce((x, y) => x + y, 0) / l.length;
    expect(autour.length).toBeGreaterThan(0);
    expect(moyenne(autour), `${HALO}`).toBeGreaterThan(moyenne(ailleurs) + 10);
    expect(rasterDuModele(f, { archipel: '4e', light: 1 }).pixels).toEqual(jour.pixels);
  });

  it('les sentinelles : la flamme et les veines de cendre éteintes, de la lueur rallumées, même la nuit', () => {
    for (const b of BIOMES) {
      const f = sentinellePeinte(b.id);
      const eteinte = couleurs(rasterDuModele(f, { archipel: b.classe, light: 0, allumage: 0 }));
      const rallumee = couleurs(rasterDuModele(f, { archipel: b.classe, light: 0, allumage: 1 }));
      expect(eteinte.has(LUEUR), b.id).toBe(false);
      expect(rallumee.has(LUEUR), b.id).toBe(true);
      // Éteinte, la nuit : la cendre passe par la nuit comme la pierre.
      expect([...eteinte].some((c) => c === deNuit(b.classe, SENTINELLE.cendre, 0) || c === deNuit(b.classe, mixColor(SENTINELLE.cendre, 0xffffff, 0.14), 0)), b.id).toBe(true);
    }
  });

  it('les aplats restent peu nombreux : une ombre bleutée, jamais noire', () => {
    const r = rasterDuModele(creaturePeinte('french-6e-phonology'), { archipel: '6e', light: 1 });
    // Couleurs de base × trois aplats, les yeux et le bord.
    expect(couleurs(r).size).toBeLessThanOrEqual(creaturePeinte('french-6e-phonology').palette.length * 3 + 2);
    expect(NUIT_OCEAN & 0xff).toBeGreaterThan((NUIT_OCEAN >> 16) & 0xff);
  });

  it('un sprite par personnage, pose et palier de lumière, gardé', () => {
    const faits: string[] = [];
    const atelier = new AtelierDePersonnages<string>((r) => `${r.largeur}`, 100);
    const raster = (nom: string) => () => {
      faits.push(nom);
      return rasterDuModele(creaturePeinte('french-6e-phonology'), { archipel: '6e', light: 1 });
    };
    const paliers = Array.from({ length: PALIERS + 1 }, (_, p) => peinture('6e', p).cle);
    expect(new Set(paliers).size).toBe(PALIERS + 1);
    expect(peinture('6e', 4).cle).not.toBe(peinture('5e', 4).cle);
    for (const p of paliers) atelier.prendre('creature:foret', 'creature:foret', p, raster(p));
    for (const p of paliers) atelier.prendre('creature:foret', 'creature:foret', p, raster(p));
    expect(faits).toEqual(paliers);
  });

  it(`au plus ${RASTERS_PAR_IMAGE} rasters par image : les autres gardent leur sprite d’avant, le bonhomme passe toujours`, () => {
    let n = 0;
    const atelier = new AtelierDePersonnages<number>(() => ++n);
    const raster = () => rasterDuModele(creaturePeinte('french-6e-phonology'), { archipel: '6e', light: 1 });
    const ids = ['a', 'b', 'c', 'd', 'e'];
    // Le premier passage : deux par image, les autres attendent (rien à montrer encore).
    atelier.nouvelleImage();
    expect(ids.map((id) => atelier.prendre(id, id, 'jour', raster))).toEqual([1, 2, null, null, null]);
    atelier.nouvelleImage();
    expect(ids.map((id) => atelier.prendre(id, id, 'jour', raster))).toEqual([1, 2, 3, 4, null]);
    atelier.nouvelleImage();
    expect(ids.map((id) => atelier.prendre(id, id, 'jour', raster))).toEqual([1, 2, 3, 4, 5]);
    // Un autre palier : chacun garde le sprite du palier d'avant jusqu'à son tour.
    atelier.nouvelleImage();
    expect(ids.map((id) => atelier.prendre(id, id, 'soir', raster))).toEqual([6, 7, 3, 4, 5]);
    // Le bonhomme (urgent) ne reste jamais sans corps, même le budget de l'image pris.
    atelier.nouvelleImage();
    atelier.prendre('c', 'c', 'soir', raster);
    atelier.prendre('d', 'd', 'soir', raster);
    expect(atelier.prendre('bonhomme:down:0', 'bonhomme', 'soir', raster, true)).toBe(10);
    atelier.nouvelleImage();
    atelier.prendre('e', 'e', 'soir', raster);
    expect(atelier.prendre('bonhomme:up:0', 'bonhomme', 'soir', raster, true)).toBe(12);
    atelier.nouvelleImage();
    atelier.prendre('x', 'x', 'soir', raster);
    expect(atelier.prendre('sentinelle:y:0', 'sentinelle:y', 'soir', raster)).toBe(14);
    // Plus de budget : la sentinelle rallumée attend sur l'éteinte.
    expect(atelier.prendre('sentinelle:y:1', 'sentinelle:y', 'soir', raster)).toBe(14);
  });
});
