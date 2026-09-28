import { lineaire } from '../landMesh';
import { MATIERES } from '../palette';
import { COULEURS_DU_PHARE, dessinerPhare, ECLAT_DU_FUT, OMBRE_DU_FUT, PHARE, PHARES, rayonDuFut, type PieceDuPhare, type PoseDuPhare } from './phare';
import { Pinceau, rgb, type FacettesDuDecor } from './pinceau';

const pose = (o: Partial<PoseDuPhare> = {}): PoseDuPhare => ({
  cx: 10,
  cz: 20,
  pied: 0.7,
  y: 2,
  ...PHARES['6e'],
  rot: 0.3,
  pierre: MATIERES.pierre,
  verre: MATIERES.verre,
  muted: false,
  ...o,
});
const trace = (o?: Partial<PoseDuPhare>) => {
  const P = new Pinceau();
  const L = new Pinceau();
  dessinerPhare(P, L, pose(o));
  return { P: P.fin(), L: L.fin() };
};
const ys = (f: FacettesDuDecor) => Array.from({ length: f.positions.length / 3 }, (_, i) => f.positions[3 * i + 1]);
const lin = (c: number) => rgb(c).map((v) => lineaire(v / 255));
/** Les hauteurs (en fraction de H au-dessus du fût) des sommets d'une teinte : terre cuite (rouge nettement au-dessus
 * du vert) ou sombre (la galerie). */
function hauteursDe(f: FacettesDuDecor, teinte: 'terre-cuite' | 'sombre', o = pose()): number[] {
  const out: number[] = [];
  for (let i = 0; i < f.colors.length / 3; i++) {
    const [r, g] = [f.colors[3 * i], f.colors[3 * i + 1]];
    const ok = teinte === 'terre-cuite' ? r > 2 * g && r > 0.2 : r > 1.5 * g && r < 0.15;
    if (ok) out.push((f.positions[3 * i + 1] - o.y) / o.H);
  }
  return out;
}

it('le phare suit les proportions de la fiche de famille : fût, bandes, galerie, lanterne, toit (DA, 28/09)', () => {
  expect(PHARE.fut).toEqual([0, 0.7]);
  expect(PHARE.bandes).toEqual([
    [0.3, 0.38],
    [0.5, 0.58],
  ]);
  for (const [b0, b1] of PHARE.bandes) expect(b1 - b0).toBeCloseTo(0.08, 6);
  expect(PHARE.galerie).toEqual({ bas: 0.7, epaisseur: 0.03, debord: 0.25 });
  expect(PHARE.lanterne).toEqual({ bas: 0.73, haut: 0.85, rayon: 0.55 });
  expect(PHARE.toit).toEqual({ bas: 0.85, haut: 1, rayon: 0.85 });
  expect(PHARE.pans).toBe(8);
  expect(rayonDuFut(1, 0)).toBe(1);
  expect(rayonDuFut(1, 0.7)).toBeCloseTo(0.75, 6);
  // Le toit dépasse la lanterne ; la galerie dépasse le haut du fût.
  expect(PHARE.toit.rayon).toBeGreaterThan(PHARE.lanterne.rayon);
  // Au 6e et au 3e, seuls la taille, le socle et l'emprise changent.
  expect(PHARES['6e']).toEqual({ H: 6, r: 1.2, socle: 0, emprise: 3 });
  expect(PHARES['3e']).toEqual({ H: 11, r: 1.2, socle: 3, emprise: 4 });
});

it('ses couleurs sont celles de la fiche, et ses bandes de terre cuite sont où elle le dit', () => {
  expect(COULEURS_DU_PHARE).toEqual({ fut: 0xe9e4d6, bande: 0xa8553a, toit: 0xa8553a, galerie: 0x553330, anneau: 0x3f8299, lanterneNuit: 0xffd866 });
  const { P } = trace();
  const bandes = hauteursDe(P, 'terre-cuite').filter((f) => f < 0.69);
  expect(bandes.length).toBeGreaterThan(0);
  for (const f of bandes) expect(PHARE.bandes.some(([b0, b1]) => f >= b0 - 1e-6 && f <= b1 + 1e-6), `${f}`).toBe(true);
  // Toutes les limites des bandes sont tracées.
  for (const b of PHARE.bandes.flat()) expect(bandes.some((f) => Math.abs(f - b) < 1e-5), `${b}`).toBe(true);
  // La galerie à 0,70 H, le toit jusqu'au sommet.
  expect(Math.min(...hauteursDe(P, 'sombre'))).toBeCloseTo(0.7, 5);
  expect(Math.max(...hauteursDe(P, 'sombre'))).toBeCloseTo(0.73, 5);
  expect(Math.max(...hauteursDe(P, 'terre-cuite'))).toBeCloseTo(1, 5);
  expect(Math.min(...hauteursDe(P, 'terre-cuite').filter((f) => f > 0.69))).toBeCloseTo(0.85, 5);
});

it('pose le socle au pied, le sommet à H au-dessus du socle, et tient en moins de 200 triangles', () => {
  const o = pose();
  const { P, L } = trace();
  expect(Math.min(...ys(P))).toBeCloseTo(o.pied, 6);
  expect(Math.max(...ys(P))).toBeCloseTo(o.y + o.H, 6);
  expect(P.elements.length + L.elements.length).toBeLessThan(200);
  // Le 3e : même modèle, plus grand.
  const grand = trace({ ...PHARES['3e'], y: 5, pied: 2 });
  expect(Math.max(...ys(grand.P))).toBeCloseTo(5 + 11, 6);
  expect(grand.P.elements.length).toBe(P.elements.length);
});

it('la lanterne est vitrée et claire de jour, et brille la nuit dans les lueurs, sans rien d’autre ; éteinte sur une île fermée', () => {
  const { P, L } = trace();
  expect(L.elements.length).toBe(PHARE.pans * 2);
  expect(L.colorsNuit).toBeDefined();
  const nuit = lin(COULEURS_DU_PHARE.lanterneNuit);
  for (let i = 0; i < L.colorsNuit!.length; i += 3) expect([L.colorsNuit![i], L.colorsNuit![i + 1], L.colorsNuit![i + 2]]).toEqual(nuit);
  // De jour : le verre, bleuté, jamais la lueur jaune.
  for (let i = 0; i < L.colors.length; i += 3) expect(L.colors[i + 2]).toBeGreaterThan(L.colors[i]);
  // Sur une île fermée : pas de lueur, la lanterne est tracée avec le reste, délavée.
  const ferme = trace({ muted: true });
  expect(ferme.L.elements.length).toBe(0);
  expect(ferme.P.elements.length).toBe(P.elements.length + L.elements.length);
  // Le pinceau n'a plus de couleur de nuit posée après le phare.
  const P2 = new Pinceau();
  const L2 = new Pinceau();
  dessinerPhare(P2, L2, pose());
  expect(L2.deNuit).toBeNull();
});

it('se dessine pièce par pièce (R5 : les plans du phare), sans changer ce qu’il trace', () => {
  const tout = trace();
  const pieces: PieceDuPhare[] = ['socle', 'anneau', 'fut', 'galerie', 'lanterne', 'toit'];
  let n = 0;
  for (const p of pieces) {
    const une = trace({ pieces: new Set([p]) });
    n += une.P.elements.length + une.L.elements.length;
    expect(une.P.elements.length + une.L.elements.length, p).toBeGreaterThan(0);
  }
  // Le fût seul (sans galerie) a son haut fermé : un chapeau de plus.
  expect(n).toBe(tout.P.elements.length + tout.L.elements.length + PHARE.pans - 2);
});

it('le fût est peint plus clair que blanc, dans une borne connue (crème lu à l’écran, relecture du DA)', () => {
  const { P } = trace();
  const max = Math.max(...P.colors);
  expect(max).toBeGreaterThan(1);
  expect(max).toBeLessThanOrEqual(ECLAT_DU_FUT * (1 + OMBRE_DU_FUT.eclat) * (1 + OMBRE_DU_FUT.chaleur));
  expect(Math.min(...P.colors)).toBeGreaterThanOrEqual(0);
});
