import { toutConstruit } from '../budget';
import { rangerLeDecor, maillageDuDecor } from '../decorMesh';
import { champDuSol } from '../landMesh';
import { ARCHIPELAGO_IDS, type ArchipelagoId } from '../map';
import { cielDe, luminance } from '../palette';
import { islandCenter, worldCubes } from '../terrain';
import { lineaire } from '../landMesh';
import { FUMEE_DU_VOLCAN } from './6e';
import { couleurDeFumee, FUMEE, FUMEE_DE_NUIT, MOUVEMENT_DE_LA_BRUME, MOUVEMENT_DE_LA_FUMEE, placeDeLaVolute, poserLesFumees, respirationDeLaBrume } from './fumee';
import { PHARES } from './phare';

const decors = new Map<ArchipelagoId, ReturnType<typeof maillageDuDecor>>();
function decorDe(a: ArchipelagoId) {
  let m = decors.get(a);
  if (!m) {
    const { progress, village } = toutConstruit();
    const cubes = worldCubes(a, progress, village, false);
    const { elements, reste } = rangerLeDecor(cubes.filter((c) => !c.sol));
    decors.set(a, (m = maillageDuDecor(a, champDuSol(a, cubes.filter((c) => c.sol), reste), elements)));
  }
  return m;
}
const poser = (a: ArchipelagoId, t: number, light: number, reduit: boolean) => {
  const f = decorDe(a).fumees;
  const positions = new Float32Array(f.facettes.positions.length);
  const colors = new Float32Array(f.facettes.colors.length);
  poserLesFumees(f, t, light, reduit, positions, colors);
  return { positions, colors };
};
/** La luminance d'une couleur linéaire de Three.js (les canaux déjà linéaires). */
const lum = (c: ArrayLike<number>, i: number) => 0.2126 * c[i] + 0.7152 * c[i + 1] + 0.0722 * c[i + 2];

it('la forme de la fumée reste celle du lot R4', () => {
  expect(FUMEE).toEqual({ croissance: 0.35, fondu: 0.3, volutes: 3 });
});

it('le mouvement de la fumée est lent : 6 s au moins d’une volute à la suivante, aucune oscillation plus rapide que 5 s (DA, 28/09)', () => {
  expect(MOUVEMENT_DE_LA_FUMEE.periode).toBeGreaterThanOrEqual(6);
  // Une volute ne revient à sa place qu'au bout de n périodes, et jamais ne va et vient.
  for (const n of [3, 8]) {
    let avant = placeDeLaVolute(0, n, 0, 0, false).s;
    let tours = 0;
    for (let t = 0.05; t <= MOUVEMENT_DE_LA_FUMEE.periode * n + 0.5; t += 0.05) {
      const { s } = placeDeLaVolute(0, n, 0, t, false);
      if (s < avant) tours++;
      else expect(s - avant).toBeLessThanOrEqual(0.05 / MOUVEMENT_DE_LA_FUMEE.periode + 1e-9);
      avant = s;
    }
    expect(tours).toBe(1);
  }
});

it('une volute naît au pied et se dissout en haut en changeant de taille sans à-coup : rien n’apparaît ni ne disparaît d’un coup', () => {
  const n = 8;
  expect(placeDeLaVolute(0, n, 0, 0, false).taille).toBe(0);
  let avant = placeDeLaVolute(0, n, 0, 0, false).taille;
  for (let t = 0.02; t < MOUVEMENT_DE_LA_FUMEE.periode * n; t += 0.02) {
    const { taille } = placeDeLaVolute(0, n, 0, t, false);
    expect(Math.abs(taille - avant)).toBeLessThan(0.02);
    avant = taille;
  }
});

it('« Réduire les animations » fige la fumée dans la pose du lot R4, d’un coup, quel que soit le temps', () => {
  for (const a of ['6e', '4e'] as const) {
    const f = decorDe(a).fumees;
    expect(f.facettes.elements.length, a).toBeGreaterThan(0);
    const un = poser(a, 3.2, 1, true);
    const deux = poser(a, 1234.5, 1, true);
    expect(Array.from(un.positions)).toEqual(Array.from(f.facettes.positions));
    expect(Array.from(deux.positions)).toEqual(Array.from(un.positions));
    expect(Array.from(deux.colors)).toEqual(Array.from(un.colors));
    // De jour, ses couleurs sont celles du lot R4, à l'arrondi près.
    for (let i = 0; i < un.colors.length; i++) expect(Math.abs(un.colors[i] - f.facettes.colors[i])).toBeLessThan(0.01);
    // Sans le réglage, elle bouge.
    const m1 = poser(a, 3.2, 1, false).positions;
    const m2 = poser(a, 4.2, 1, false).positions;
    expect(m1.some((v, i) => Math.abs(v - m2[i]) > 1e-3), a).toBe(true);
  }
});

it('la nuit, la fumée prend la couleur de nuit, fondue vers l’horizon : jamais plus claire que la lueur d’horizon', () => {
  expect(FUMEE_DE_NUIT.fondu).toBe(0.5);
  for (const a of ARCHIPELAGO_IDS) {
    const plafond = luminance(cielDe(a, 0).lueur);
    for (const jour of [0xffffff, 0xd0ccc8, 0xa9a4a0]) {
      for (const fondu of [0, 0.3]) {
        const c = couleurDeFumee(a, jour, fondu, 0);
        expect(0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2], `${a} ${jour.toString(16)}`).toBeLessThanOrEqual(plafond + 1e-3);
        // Et plus claire le jour que la nuit.
        const j = couleurDeFumee(a, jour, fondu, 1);
        expect(0.2126 * j[0] + 0.7152 * j[1] + 0.0722 * j[2]).toBeGreaterThan(0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]);
      }
    }
  }
  const nuit = poser('4e', 0, 0, false).colors;
  const plafond = luminance(cielDe('4e', 0).lueur);
  for (let i = 0; i < nuit.length; i += 3) expect(lum(nuit, i)).toBeLessThanOrEqual(plafond + 1e-3);
  expect(lineaire(1)).toBe(1);
});

it('au 6e, le volcan fume à peine : une fumée mince, plus basse que le phare (fiche de famille, recommandation du DA)', () => {
  const f = decorDe('6e').fumees;
  expect(f.panaches.length).toBe(1);
  expect(f.panaches[0].n).toBe(FUMEE_DU_VOLCAN.volutes);
  expect(f.panaches[0].rayons[0]).toBeLessThan(0.42);
  // À tout moment, le haut de la fumée reste sous le sommet du phare du 6e posé au niveau de la mer (île de la Tour).
  const sommetDuPhare = islandCenter('tour').z + PHARES['6e'].socle + PHARES['6e'].H;
  for (const t of [0, 1.5, 3, 4.5, 6, 7.5, 9]) {
    const { positions } = poser('6e', t, 1, false);
    let haut = -Infinity;
    for (let i = 1; i < positions.length; i += 3) haut = Math.max(haut, positions[i]);
    expect(haut, `t=${t}`).toBeLessThan(sommetDuPhare);
  }
});

it('la brume respire sur 15 s ou plus, son opacité varie de ±10 % au plus, elle glisse de 0,1 case par seconde au plus', () => {
  const M = MOUVEMENT_DE_LA_BRUME;
  expect(M.respiration).toBeGreaterThanOrEqual(15);
  expect(M.derive).toBeGreaterThanOrEqual(15);
  expect(M.opacite).toBeLessThanOrEqual(0.1);
  for (const i of [0, 1, 2, 5]) {
    let avant = respirationDeLaBrume(i, 0, false);
    for (let t = 0.1; t < 60; t += 0.1) {
      const b = respirationDeLaBrume(i, t, false);
      expect(Math.abs(b.opacite - 1)).toBeLessThanOrEqual(M.opacite + 1e-9);
      expect(Math.hypot(b.dx - avant.dx, b.dy - avant.dy) / 0.1).toBeLessThanOrEqual(M.glisse);
      avant = b;
    }
    expect(respirationDeLaBrume(i, 42, true)).toEqual({ dy: 0, dx: 0, opacite: 1 });
  }
});
