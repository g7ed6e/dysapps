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
import { cleDuPersonnage } from './paintedSprites';
import { ECART_DES_YEUX, OEIL_MIN, rasterDuModele, type OptionsDuRaster, type RasterDePersonnage } from './personnages';

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
    for (const light of [1, 0]) {
      const r = rasterDuModele(f, { ...o, light });
      const traits = new Set(bord(r));
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
    '%s : deux yeux d’au moins 2 × 2 pixels, séparés d’un pixel au moins, de face',
    (_n, f, o) => {
      const r = rasterDuModele(f, { ...o, light: 1 });
      expect(r.yeux).toHaveLength(2);
      for (const e of r.yeux) expect(Math.min(e.w, e.h)).toBeGreaterThanOrEqual(OEIL_MIN);
      const [a, b] = [...r.yeux].sort((p, q) => p.x - q.x);
      expect(b.x - (a.x + a.w)).toBeGreaterThanOrEqual(ECART_DES_YEUX);
    },
  );

  // Le Comptable (Données) a les orbites sous le bord de son chapeau : d'en haut, en 2D comme en 3D, on ne les voit pas.
  const SOUS_LE_CHAPEAU = ['donnees'];
  const avecOrbites = BIOMES.filter((b) => sentinellePeinte(b.id).palette.some((p) => p.role === 'yeux') && !SOUS_LE_CHAPEAU.includes(b.id)).map((b) => b.id);
  it('les sentinelles sans orbites sont celles qui n’ont pas de visage (Locomotive, Spectre, Antenne)', () => {
    expect(BIOMES.filter((b) => !sentinellePeinte(b.id).palette.some((p) => p.role === 'yeux')).map((b) => b.id).sort()).toEqual(['gare', 'manoir', 'studio']);
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
        for (const e of r.yeux) expect(Math.min(e.w, e.h)).toBeGreaterThanOrEqual(OEIL_MIN);
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
    const f = creaturePeinte('foret');
    const jour = couleurs(rasterDuModele(f, { archipel: '6e', light: 1 }));
    const nuit = couleurs(rasterDuModele(f, { archipel: '6e', light: 0 }));
    for (const c of nuit) expect(jour.has(c)).toBe(false);
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
    const r = rasterDuModele(creaturePeinte('foret'), { archipel: '6e', light: 1 });
    // Couleurs de base × trois aplats, les yeux et le bord.
    expect(couleurs(r).size).toBeLessThanOrEqual(creaturePeinte('foret').palette.length * 3 + 2);
    expect(NUIT_OCEAN & 0xff).toBeGreaterThan((NUIT_OCEAN >> 16) & 0xff);
  });

  it('le palier de lumière est dans la clé du cache des sprites', () => {
    const cles = new Set(Array.from({ length: PALIERS + 1 }, (_, p) => cleDuPersonnage('creature:foret', peinture('6e', p))));
    expect(cles.size).toBe(PALIERS + 1);
    expect(cleDuPersonnage('creature:foret', peinture('6e', 4))).not.toBe(cleDuPersonnage('creature:foret', peinture('5e', 4)));
  });
});
