// Les petites constructions du 6e d'Archipéo faites des pièces communes (piste 3 « hybride » du directeur artistique,
// choisie par le mainteneur le 11 octobre 2026) : les commandes simples (le potager de Mousso, le bac à eau de
// Bloquette, le poteau-lanterne de Grimoire, la vitrine de Tick, la placette de Boussole, l'étagère à flacons de Bulle,
// l'établi de Pince, l'urne de Voix) et les objets des quêtes d'entraide (la lanterne de Mousso, le portillon de
// Bloquette, l'escalier de Grimoire). Chacune pose, sur les cases de sa forme (world/fixtures.ts), la pièce qui leur
// va : la caisse, la dalle, le plateau sur pieds, le petit toit, le bassin, la marche, et la barrière et la lanterne sur
// poteau des cours (./pieces.ts). La matière du bloc livré est sur la plus grande face de l'objet, dans les couleurs
// mêmes du bloc (règle GD-7). La même dessinée de près et de loin (une pièce coûte moins de 120 triangles). Code pur,
// sans Three.js.
import { BLOC } from '../../biomes';
import { bassin, caisse, COULEURS_DES_OBJETS as C, dalle, flacon, lanterneSurPoteau, marcheDePierre, plateauSurPieds, poteauDeBarriere } from './pieces';
import type { DessinDObjet } from './silhouettes';

/**
 * Le potager de Mousso : la jardinière de bois (son rang de bois), la terre livrée bombée dessus (sa grande face : le
 * dessus et les talus), quatre pousses vertes.
 */
const potager: DessinDObjet = (at, pe) => {
  const bois = pe.bloc(BLOC.bois);
  const terre = pe.bloc(BLOC.terre);
  const [x0, x1, y0, y1, h] = [0.05, 2.95, 0.1, 0.9, 0.74];
  at.boite(x0, x1, y0, y1, 0, h, bois, { dessous: true, dessus: true });
  // Le rebord, du flanc à la terre.
  const r = 0.08;
  const c: [number, number, number] = [1.5, 0.5, h - 1];
  at.quad([x0, y0, h], [x1, y0, h], [x1 - r, y0 + r, h], [x0 + r, y0 + r, h], c, bois.dessus);
  at.quad([x1, y0, h], [x1, y1, h], [x1 - r, y1 - r, h], [x1 - r, y0 + r, h], c, bois.dessus);
  at.quad([x1, y1, h], [x0, y1, h], [x0 + r, y1 - r, h], [x1 - r, y1 - r, h], c, bois.dessus);
  at.quad([x0, y1, h], [x0, y0, h], [x0 + r, y0 + r, h], [x0 + r, y1 - r, h], c, bois.dessus);
  // La terre, en tronc de pyramide sur la jardinière.
  const [bx, by, tx, ty, zt] = [(x1 - x0) / 2 - r, (y1 - y0) / 2 - r, (x1 - x0) / 2 - 0.22, (y1 - y0) / 2 - 0.2, 1.02];
  const bas = [
    [1.5 - bx, 0.5 - by],
    [1.5 + bx, 0.5 - by],
    [1.5 + bx, 0.5 + by],
    [1.5 - bx, 0.5 + by],
  ];
  const haut = [
    [1.5 - tx, 0.5 - ty],
    [1.5 + tx, 0.5 - ty],
    [1.5 + tx, 0.5 + ty],
    [1.5 - tx, 0.5 + ty],
  ];
  const d: [number, number, number] = [1.5, 0.5, h];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    at.quad([bas[i][0], bas[i][1], h], [bas[j][0], bas[j][1], h], [haut[j][0], haut[j][1], zt], [haut[i][0], haut[i][1], zt], d, terre.cote);
  }
  at.quad([haut[0][0], haut[0][1], zt], [haut[1][0], haut[1][1], zt], [haut[2][0], haut[2][1], zt], [haut[3][0], haut[3][1], zt], d, terre.dessus);
  // Les pousses.
  const feuille = pe.couleur(C.feuille);
  for (const x of [0.75, 1.25, 1.75, 2.25]) at.pyramide(x, 0.5, 0.1, 0.1, zt, zt + 0.24, feuille);
};

/**
 * Le bac à eau de Bloquette : le bassin de galets livrés (ses grandes faces devant et derrière), plein d'eau, entre les
 * deux poteaux de terre de sa forme coiffés d'une pointe, la traverse de bois et la goulotte de fer au-dessus de l'eau.
 */
const bacAEau: DessinDObjet = (at, pe) => {
  const terre = pe.bloc(BLOC.terre);
  const galet = pe.bloc(BLOC.galet);
  for (const x of [0.5, 3.5]) {
    at.bloc(x, 0.5, 0.46, 0.46, 0, 1.74, terre, { dessous: true, dessus: true });
    at.pyramide(x, 0.5, 0.25, 0.25, 1.74, 1.96, terre.dessus);
  }
  bassin(at, pe, 0.85, 3.15, 0.12, 0.88, 0, 0.64, 0.12, galet, 0.52);
  at.boite(0.73, 3.27, 0.42, 0.58, 1.48, 1.64, pe.couleur(C.boisClair), {});
  at.bloc(2, 0.5, 0.12, 0.12, 1.02, 1.48, pe.couleur(C.fer), {});
};

/**
 * Le poteau-lanterne de Grimoire : un socle d'obsidienne livrée (son grand dessus), une marche d'obsidienne sur la case
 * d'à côté, le pilier d'obsidienne, la tête de lanterne des cours (ses vitres allumées la nuit).
 */
const poteauLanterne: DessinDObjet = (at, pe) => {
  const obsidienne = pe.bloc(BLOC.obsidienne);
  dalle(at, 0.06, 1.94, 0.1, 0.9, 0, 0.3, obsidienne);
  at.bloc(1.5, 0.5, 0.7, 0.62, 0.3, 0.6, obsidienne);
  at.bloc(0.5, 0.5, 0.4, 0.4, 0.3, 2, obsidienne, { dessous: true });
  lanterneSurPoteau(at, pe, 0, 0, null, 2);
};

/**
 * La vitrine de Tick : le soubassement de bois (les portes de sa forme) et sa tablette, la vitrine de verre livré (ses
 * trois grandes faces) entre quatre montants, le petit toit dans la couverture de l'île, ses pignons crème.
 */
const vitrine: DessinDObjet = (at, pe) => {
  const porte = pe.matiere('porte');
  const verre = pe.bloc(BLOC.verre);
  at.boite(0.05, 2.95, 0.1, 0.9, 0, 0.84, porte, { dessous: true, dessus: true });
  at.boite(0, 3, 0.05, 0.95, 0.84, 0.95, { dessus: porte.dessus, cote: porte.dessus }, {});
  at.boite(0.12, 2.88, 0.2, 0.8, 0.95, 1.9, verre, { dessous: true, dessus: true });
  const montant = pe.couleur(C.bois);
  for (const x of [0.12, 1.04, 1.96, 2.88]) at.bloc(x, 0.5, 0.1, 0.64, 0.95, 1.9, montant, { dessous: true, dessus: true });
  at.toit(0, 3, 0.05, 0.95, 1.9, 2.42, 'x', 0.08, pe.toit(), { teinte: pe.couleur(C.creme), zPied: 1.9 });
};

/**
 * La placette de Boussole : une dalle basse de quatre cases, pavée de seize carreaux de mosaïque livrée en damier de ses
 * deux tons, une rosace crème au milieu ; la lanterne sur poteau des cours sur sa case (ses vitres allumées la nuit).
 */
const placette: DessinDObjet = (at, pe) => {
  const mosaique = pe.bloc(BLOC.mosaique);
  const [x0, x1, y0, y1, h] = [0.04, 1.96, 0.04, 1.96, 0.16];
  at.boite(x0, x1, y0, y1, 0, h, mosaique, { dessous: true, dessus: true });
  const n = 4;
  const [px, py] = [(x1 - x0) / n, (y1 - y0) / n];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const [a, b] = [x0 + i * px, y0 + j * py];
      at.quad([a, b, h], [a + px, b, h], [a + px, b + py, h], [a, b + py, h], [1, 1, 0], (i + j) % 2 ? mosaique.cote : mosaique.dessus);
    }
  at.disque(1, 1, h + 0.012, 0.3, 8, pe.couleur(C.creme));
  lanterneSurPoteau(at, pe, 2, 2, 0, 1);
};

/**
 * L'étagère à flacons de Bulle : trois caisses de carton livré (leurs grandes faces), la planche posée dessus, deux
 * blocs d'aimant aux bouts, un flacon sur chacun, la tête de lanterne des cours au milieu (ses vitres allumées la nuit).
 */
const etagere: DessinDObjet = (at, pe) => {
  const carton = pe.bloc(BLOC.carton);
  const aimant = pe.bloc(BLOC.aimant);
  for (let k = 0; k < 3; k++) caisse(at, k + 0.06, k + 0.94, 0.12, 0.88, 0, 0.76, carton, { dessus: carton.dessus, cote: carton.cote });
  at.boite(0.02, 2.98, 0.1, 0.9, 0.76, 0.86, pe.couleur(C.boisClair), {});
  for (const x of [0.5, 2.5]) {
    at.bloc(x, 0.5, 0.72, 0.62, 0.86, 1.46, aimant);
    flacon(at, pe, x, 0.5, 1.46, 0.36, x < 1 ? 0x6fb7c8 : 0xb98ad0);
  }
  lanterneSurPoteau(at, pe, 1, 0, null, 0.86);
};

/**
 * L'établi de Pince : le plateau de carton sur ses deux pieds de barrière et leur entretoise, la barre d'aimant livré
 * posée dessus (sa grande face devant, ses joints de tôle).
 */
const etabli: DessinDObjet = (at, pe) => {
  const carton = pe.bloc(BLOC.carton);
  const aimant = pe.bloc(BLOC.aimant);
  const pied = pe.role('yardPost');
  plateauSurPieds(at, 0.03, 2.97, 0.1, 0.9, 1, 0.22, carton, [
    [0.5, 0.5],
    [2.5, 0.5],
  ], 0.24, pied);
  at.boite(0.62, 2.38, 0.44, 0.56, 0.3, 0.42, pied, { dessous: false, px: true, nx: true });
  at.boite(0.12, 2.88, 0.22, 0.78, 1, 1.5, aimant);
  const joint = pe.role('joint');
  for (const x of [0.8, 1.5, 2.2]) at.quad([x - 0.02, 0.215, 1.03], [x + 0.02, 0.215, 1.03], [x + 0.02, 0.215, 1.47], [x - 0.02, 0.215, 1.47], [x, 0.5, 1.25], joint);
};

/**
 * L'urne de Voix : le plateau épais de fossile livré (son dessus et sa grande face devant) sur ses deux pieds de
 * barrière, l'urne de craie dessus, son couvercle et sa fente sombre. Aucun symbole.
 */
const urne: DessinDObjet = (at, pe) => {
  const fossile = pe.bloc(BLOC.fossile);
  const craie = pe.bloc(BLOC.craie);
  plateauSurPieds(at, 0.03, 2.97, 0.08, 0.92, 1.05, 0.3, fossile, [
    [0.5, 0.5],
    [2.5, 0.5],
  ], 0.24, pe.role('yardPost'));
  at.bloc(1.5, 0.5, 0.56, 0.5, 1.05, 1.55, craie, { dessous: true, dessus: true });
  at.prisme(1.5, 0.5, 0.42, 0.3, 1.55, 1.66, 4, craie.dessus, Math.PI / 4);
  at.quad([1.36, 0.47, 1.665], [1.64, 0.47, 1.665], [1.64, 0.53, 1.665], [1.36, 0.53, 1.665], [1.5, 0.5, 1], pe.couleur(C.fer));
};

/**
 * La lanterne de Mousso : un banc de bois (son rang de bois : l'assise et ses deux pieds pleins), la lanterne sur poteau
 * des cours dressée en son milieu (ses vitres allumées la nuit).
 */
const lanterneDeMousso: DessinDObjet = (at, pe) => {
  const bois = pe.bloc(BLOC.bois);
  plateauSurPieds(at, 0.04, 2.96, 0.14, 0.86, 0.56, 0.14, bois, [
    [0.36, 0.5],
    [2.64, 0.5],
  ], 0.32, { dessus: bois.dessus, cote: bois.cote });
  lanterneSurPoteau(at, pe, 1, 0, 0.56, 2);
};

/**
 * Le portillon de Bloquette : deux piliers de galets livrés et le seuil de galet entre eux (leurs grandes faces), un
 * poteau de barrière des cours sur chaque pilier, le vantail de bois (deux montants, trois traverses, une écharpe).
 */
const portillon: DessinDObjet = (at, pe) => {
  const galet = pe.bloc(BLOC.galet);
  for (const x of [0.5, 2.5]) at.bloc(x, 0.5, 0.7, 0.7, 0, 1, galet);
  at.boite(0.85, 2.15, 0.18, 0.82, 0, 0.22, galet);
  poteauDeBarriere(at, pe, 0, 0, 1);
  poteauDeBarriere(at, pe, 2, 0, 1);
  const porte = pe.matiere('porte');
  for (const x of [0.96, 2.04]) at.bloc(x, 0.5, 0.12, 0.12, 0.24, 1.56, porte, { dessous: true });
  for (const z of [0.42, 0.95, 1.42]) at.boite(1.02, 1.98, 0.45, 0.55, z, z + 0.1, porte, { dessous: false, px: true, nx: true });
  at.poutre([1.06, 0.5, 0.5], [1.94, 0.5, 1.38], 0.08, porte);
};

/**
 * L'escalier de Grimoire : trois marches de pierre (dalle claire dessus), de une à trois cases de haut, portées par les
 * colonnes d'aimant livré (leurs grandes faces de côté).
 */
const escalier: DessinDObjet = (at, pe) => {
  const aimant = pe.bloc(BLOC.aimant);
  for (let k = 0; k < 3; k++) {
    const [x0, x1] = [k + 0.03, k + 0.97];
    if (k > 0) at.boite(x0, x1, 0.06, 0.94, 0, k, aimant, { dessous: true, dessus: true });
    marcheDePierre(at, pe, x0, x1, 0.06, 0.94, k, k + 0.86);
  }
};

/** Les petites constructions du 6e faites de pièces communes, par identifiant (world/fixtures.ts), et leur dessin. */
export const ASSEMBLAGES: Readonly<Record<string, DessinDObjet>> = {
  'french-6e-phonology-fixture-1': potager,
  'french-6e-grammar-spelling-fixture-1': bacAEau,
  'french-6e-reading-fixture-1': poteauLanterne,
  'english-6e-grammar-fixture-1': vitrine,
  'geography-6e-living-fixture-1': placette,
  'physics-chemistry-6e-matter-energy-fixture-1': etagere,
  'technology-6e-objects-fixture-1': etabli,
  'civics-6e-democratic-society-fixture-1': urne,
  'french-6e-phonology-fixture-2': lanterneDeMousso,
  'french-6e-grammar-spelling-fixture-2': portillon,
  'french-6e-reading-fixture-2': escalier,
};
