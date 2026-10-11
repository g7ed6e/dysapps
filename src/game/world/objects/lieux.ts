// Les trois lieux du village de l'île-école du 6e d'Archipéo, dessinés (lot 2 du 6e de la piste 3 « hybride », même style
// que le lot 1 : low poly en aplats francs, sans texture, par le code ; dans l'esprit des bâtiments importés : un toit
// franc, une ouverture sombre, une signature) : l'école et son clocheton à cloche d'or, la salle des trophées (ses
// piliers, son fond de velours, ses socles, son faîte d'or) et la Halle aux matériaux (sa grande porte, son toit à deux
// pans, sa haute potence). De près (l'île où se trouve l'élève) le modèle entier, de 600 à 2 000 triangles ; de loin
// ses volumes, 200 au plus.
//
// Les cubes des lieux (world/terrain/village.ts) restent ceux du monde : Blocland les dessine, la vue simple ne les
// voit pas ; on y entre en les touchant (`place`), et le modèle garde leurs cases (le toucher retrouve la case la plus
// proche, qui porte son lieu). Ce que le modèle laisse en cubes : les trophées gagnés, posés sur les socles (GD-3 : la
// construction les dessine, plus petits que leur case), le bloc suspendu de la Halle et les blocs de sa recette (GD-2),
// et le soubassement de pierre de taille sous un lieu posé sur une marche du sol. Le modèle tient dans l'emprise de ses
// cubes (la règle « trois bandes » se lit sur eux, threeBands.test.ts). Seules les vitres de l'école s'allument la nuit,
// sans clignoter (pas sur une île fermée). Code pur, sans Three.js.
import type { VillagePlaceId, VoxelCube } from '../cube';
import type { BiomeId } from '../../biomes';
import type { ImportedMonument } from '../monumentModels';
import { caseDuLieu } from '../construction/buildings';
import type { CaseDuLieu } from '../architecture/kits';
import { HALLE } from '../terrain/village';
import { estUnePlaceDeTrophee, estUnPilier } from '../trophyHall';
import { Pinceau, type V3 } from '../decor/brush';
import type { Faces } from '../palette';
import type { ArchipelagoId } from '../map';
import { getArchipelago } from '../archipelago';
import { KITS } from '../architecture';
import { Atelier, type Teinte } from './atelier';
import { COULEURS_DES_OBJETS as C, type Peinture, peintureDe } from './pieces';

/** Un cube d'un lieu dans son repère (`caseDuLieu` : x le long de la façade, y vers le fond, z = 1 au-dessus du sol). */
type CaseDUnLieu = Pick<CaseDuLieu, 'x' | 'y' | 'z' | 'w' | 'd' | 'texture'>;

/** Le dessin d'un lieu : dans l'atelier (z = 0 au sol du lieu), avec ses couleurs, ses cubes remplacés, de près ou de loin. */
type DessinDUnLieu = (at: Atelier, pe: Peinture, cases: readonly CaseDUnLieu[], loin: boolean) => void;

/** L'ouverture sombre (la porte, la bouche de la Halle). */
const OMBRE = 0x2a201a;
/** La vitre éteinte d'une fenêtre de côté. */
const VITRE_ETEINTE = 0x3e4a52;

/** Le rang du bras de la potence de la Halle (world/terrain/village.ts, `atelierModel`) : le bloc suspendu pend deux rangs plus bas. */
const BRAS_DE_LA_POTENCE = 6;

const mul = (c: number, k: number) => (Math.round(((c >> 16) & 255) * k) << 16) | (Math.round(((c >> 8) & 255) * k) << 8) | Math.round((c & 255) * k);
const sombre = (f: Faces, k = 0.86): Faces => ({ dessus: mul(f.dessus, k), cote: mul(f.cote, k) });

/**
 * Une fenêtre sur la façade de devant (y = `yf`, tournée vers −y), centrée en x, de `l` de large, de z0 à z1 : l'appui et
 * le linteau de pierre, la vitre (`feu` : allumée la nuit), la croisée de bois, deux volets ouverts. 46 triangles (26 sans
 * volets).
 */
function fenetreDevant(at: Atelier, x: number, yf: number, l: number, z0: number, z1: number, pierre: Teinte, vitre: Teinte, feu: boolean, volets: Teinte | null): void {
  const [x0, x1] = [x - l / 2, x + l / 2];
  at.boite(x0 - 0.08, x1 + 0.08, yf - 0.1, yf + 0.02, z0 - 0.1, z0, pierre, {});
  at.boite(x0 - 0.06, x1 + 0.06, yf - 0.08, yf + 0.02, z1, z1 + 0.12, pierre, {});
  const y = yf - 0.006;
  at.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [x, yf + 1, (z0 + z1) / 2], vitre, feu);
  const bois = C.bois;
  const yb = yf - 0.016;
  at.quad([x - 0.03, yb, z0], [x + 0.03, yb, z0], [x + 0.03, yb, z1], [x - 0.03, yb, z1], [x, yf + 1, z0], bois);
  const zm = (z0 + z1) / 2 + 0.05;
  at.quad([x0, yb, zm - 0.03], [x1, yb, zm - 0.03], [x1, yb, zm + 0.03], [x0, yb, zm + 0.03], [x, yf + 1, zm], bois);
  if (!volets) return;
  for (const s of [-1, 1]) {
    const xa = s < 0 ? x0 - 0.1 : x1 + 0.1;
    at.boite(Math.min(xa, xa + s * l * 0.48), Math.max(xa, xa + s * l * 0.48), yf - 0.05, yf, z0, z1, volets, { dessous: true });
  }
}

/** Une fenêtre sur un pignon ou un flanc (x = `xf`, tournée vers `s` : −1 vers −x, 1 vers +x), centrée en y : appui, vitre éteinte, croisée. 16 triangles. */
function fenetreDeCote(at: Atelier, xf: number, s: -1 | 1, y: number, l: number, z0: number, z1: number, pierre: Teinte, vitre: Teinte): void {
  const [y0, y1] = [y - l / 2, y + l / 2];
  const xa = xf + s * 0.07;
  at.boite(Math.min(xf, xa), Math.max(xf, xa), y0 - 0.08, y1 + 0.08, z0 - 0.1, z0, pierre, {});
  const xv = xf + s * 0.006;
  at.quad([xv, y0, z0], [xv, y1, z0], [xv, y1, z1], [xv, y0, z1], [xf - s, y, z0], vitre);
  const xb = xf + s * 0.016;
  at.quad([xb, y - 0.03, z0], [xb, y + 0.03, z0], [xb, y + 0.03, z1], [xb, y - 0.03, z1], [xf - s, y, z0], C.bois);
}

// ---------- L'école ----------

/** Les mesures de l'école (5 × 4 cases, la porte au milieu de la façade, le clocheton au-dessus d'elle). */
const ECOLE = {
  w: 5,
  d: 4,
  plinthe: 0.28,
  murs: { retrait: 0.14, haut: 2.92 },
  corniche: { haut: 3.06, debord: 0.08 },
  toit: { bas: 3.06, faite: 4.62, epaisseur: 0.14 },
  clocheton: { x: 2.5, y: 1.5, pied: 3.7, plancher: 5.15, chapeau: 5.95, pointe: 6.72, epi: 7 },
} as const;

/**
 * L'école : un socle de pierre, les murs de brique, les chaînes d'angle et la corniche de pierre de taille, la porte
 * (ouverture sombre, piédroits et linteau, deux marches), deux fenêtres de devant allumées la nuit avec leurs volets et
 * leurs jardinières, une fenêtre éteinte sur chaque pignon et deux au dos, le toit franc à deux pans dans la couverture de
 * l'île (ses pignons de brique, leur oculus), la cheminée ; le clocheton sur le faîte, au-dessus de la porte : son fût de
 * pierre, quatre poteaux, la cloche d'or évasée, son chapeau en pyramide et l'épi d'or. De loin : le socle, les murs, le
 * toit, la porte, les fenêtres, le clocheton et la cloche.
 */
const ecole: DessinDUnLieu = (at, pe, _cases, loin) => {
  const { w, d, plinthe, murs, corniche, toit, clocheton: k } = ECOLE;
  const brique = pe.matiere('brique');
  const taille = pe.matiere('taille');
  const pierre = { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') };
  const or = pe.matiere('or');
  const vitre = pe.role('lanternGlass');
  const r = murs.retrait;
  at.boite(0.02, w - 0.02, 0.02, d - 0.02, 0, plinthe, pierre);
  at.boite(r, w - r, r, d - r, plinthe, murs.haut, brique, { dessous: true, dessus: true });
  // La porte : l'ouverture sombre.
  const yd = r - 0.008;
  at.quad([2.18, yd, plinthe], [2.82, yd, plinthe], [2.82, yd, 1.9], [2.18, yd, 1.9], [2.5, 1, 1], OMBRE);
  if (loin) {
    for (const x of [1.5, 3.5]) at.quad([x - 0.3, yd, 1.2], [x + 0.3, yd, 1.2], [x + 0.3, yd, 1.95], [x - 0.3, yd, 1.95], [x, 1, 1.5], vitre, true);
    at.toit(0, w, 0, d, toit.bas, toit.faite, 'x', toit.epaisseur, pe.toit(), { teinte: brique, zPied: murs.haut });
    at.bloc(k.x, k.y, 0.76, 0.76, k.pied, k.chapeau, taille, { dessous: true });
    at.prisme(k.x, k.y, 0.24, 0.12, k.plancher + 0.1, k.chapeau - 0.12, 6, or, 0, true);
    at.prisme(k.x, k.y, 0.48 * Math.SQRT2, 0, k.chapeau, k.pointe, 4, pe.toit(), Math.PI / 4);
    return;
  }
  // Les chaînes d'angle : le pilastre, et trois pierres en saillie, une sur deux.
  const a = 0.24;
  for (const [x, y] of [
    [a, a],
    [w - a, a],
    [w - a, d - a],
    [a, d - a],
  ]) {
    at.bloc(x, y, 0.4, 0.4, plinthe, murs.haut, taille, { dessous: true, dessus: true });
    for (const z of [0.7, 1.55, 2.4]) at.bloc(x, y, 0.46, 0.46, z, z + 0.32, taille, { dessous: false });
  }
  // Le bandeau au premier étage, la corniche.
  at.boite(r - 0.03, w - r + 0.03, r - 0.03, d - r + 0.03, 1.02, 1.1, taille, { dessous: false, dessus: false });
  at.boite(corniche.debord, w - corniche.debord, corniche.debord, d - corniche.debord, murs.haut, corniche.haut, taille, {});
  // La porte : piédroits, linteau, deux marches.
  for (const x of [2.1, 2.9]) at.bloc(x, r - 0.02, 0.16, 0.12, plinthe, 1.95, taille, { dessous: true, dessus: true });
  at.boite(1.98, 3.02, r - 0.1, r + 0.02, 1.9, 2.14, taille, {});
  at.boite(2.06, 2.94, 0.04, r, 0.12, plinthe, pierre, { dessous: true, py: true });
  at.boite(2.12, 2.88, 0.02, 0.09, 0, 0.14, pierre, { dessous: true, py: true });
  // Les fenêtres de devant (allumées la nuit), leurs jardinières fleuries.
  const volets = pe.couleur(0x4f7a6a);
  for (const x of [1.15, 3.85]) {
    fenetreDevant(at, x, r, 0.62, 1.25, 2.05, taille, vitre, true, volets);
    at.boite(x - 0.36, x + 0.36, 0.01, 0.1, 1.0, 1.15, pe.couleur(C.boisClair), {});
    for (const dx of [-0.2, 0, 0.2]) at.pyramide(x + dx, 0.055, 0.07, 0.04, 1.15, 1.3, pe.couleur(dx ? C.feuille : 0xd8576b));
  }
  // Une fenêtre éteinte sur chaque pignon, deux au dos.
  const eteinte = pe.couleur(VITRE_ETEINTE);
  fenetreDeCote(at, r, -1, d / 2, 0.6, 1.3, 2.05, taille, eteinte);
  fenetreDeCote(at, w - r, 1, d / 2, 0.6, 1.3, 2.05, taille, eteinte);
  for (const x of [1.4, 3.6]) {
    const yb = d - r + 0.006;
    at.quad([x - 0.3, yb, 1.3], [x + 0.3, yb, 1.3], [x + 0.3, yb, 2.05], [x - 0.3, yb, 2.05], [x, 0, 1.6], eteinte);
    at.boite(x - 0.38, x + 0.38, d - r - 0.02, d - r + 0.1, 1.2, 1.3, taille, {});
  }
  // Le toit, ses rangs de tuiles, l'oculus des pignons, la cheminée.
  at.toit(0, w, 0, d, toit.bas, toit.faite, 'x', toit.epaisseur, pe.toit(), { teinte: brique, zPied: murs.haut });
  const t = pe.toit();
  const rang = { dessus: mul(t.dessus, 0.88), cote: mul(t.cote, 0.88) };
  for (const f of [0.3, 0.55, 0.8])
    for (const [ya, yb] of [
      [0, d / 2],
      [d, d / 2],
    ]) {
      const y = ya + (yb - ya) * f;
      const z = toit.bas + (toit.faite - toit.bas) * f + 0.012;
      const y2 = y + (yb - ya) * 0.04;
      const z2 = z + (toit.faite - toit.bas) * 0.04;
      at.quad([0.02, y, z], [w - 0.02, y, z], [w - 0.02, y2, z2], [0.02, y2, z2], [w / 2, d / 2, 0], rang);
    }
  for (const [x, s] of [
    [0.06, -1],
    [w - 0.06, 1],
  ] as const) {
    at.disqueDebout([x + s * 0.004, d / 2, 3.72], s < 0 ? 'nx' : 'px', 0.24, 8, taille.cote, Math.PI / 8);
    at.disqueDebout([x + s * 0.012, d / 2, 3.72], s < 0 ? 'nx' : 'px', 0.16, 8, OMBRE, Math.PI / 8);
  }
  at.bloc(4.1, 2.9, 0.42, 0.42, 3.6, 4.82, brique, { dessous: true });
  at.bloc(4.1, 2.9, 0.52, 0.52, 4.82, 4.94, taille, {});
  // Le clocheton : le fût, le plancher, quatre poteaux, la cloche d'or, l'entablement, le chapeau, l'épi.
  at.bloc(k.x, k.y, 0.76, 0.76, k.pied, k.plancher, taille, { dessous: true });
  at.bloc(k.x, k.y, 0.88, 0.88, k.plancher, k.plancher + 0.1, taille, {});
  for (const [dx, dy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ])
    at.bloc(k.x + dx * 0.34, k.y + dy * 0.34, 0.16, 0.16, k.plancher + 0.1, k.chapeau, taille, { dessous: true, dessus: true });
  at.prisme(k.x, k.y, 0.26, 0.2, k.plancher + 0.16, k.plancher + 0.3, 8, or, Math.PI / 8, true);
  at.prisme(k.x, k.y, 0.2, 0.12, k.plancher + 0.3, k.chapeau - 0.24, 8, or, Math.PI / 8);
  at.prisme(k.x, k.y, 0.04, 0.04, k.chapeau - 0.24, k.chapeau - 0.1, 4, pe.couleur(C.fer), 0, true);
  at.bloc(k.x, k.y, 0.9, 0.9, k.chapeau - 0.1, k.chapeau, taille, {});
  at.prisme(k.x, k.y, 0.5 * Math.SQRT2, 0, k.chapeau, k.pointe, 4, pe.toit(), Math.PI / 4);
  at.prisme(k.x, k.y, 0.05, 0, k.pointe - 0.04, k.epi, 4, or, Math.PI / 4);
};

// ---------- La salle des trophées ----------

/**
 * La salle des trophées, de sa première colonne bâtie à la dernière (elle grandit d'une travée à la fois, GD-3) : le
 * dallage, les piliers de marbre (base, tore, fût à douze pans, échine, abaque), le fond de velours (ses plis, son galon
 * d'or), les socles de marbre sous les trophées (le dessus juste à la hauteur de leur case, où la construction pose le
 * trophée), l'entablement, le toit franc à deux pans dans la couverture de l'île, le faîte d'or. Ouverte devant. De loin :
 * des piliers carrés, les socles d'un tenant par rangée, le fond, le toit, le faîte.
 */
const salle: DessinDUnLieu = (at, pe, cases, loin) => {
  const d = cases[0]?.d ?? 3;
  const x0 = Math.min(...cases.map((c) => c.x));
  const x1 = Math.max(...cases.map((c) => c.x)) + 1;
  const marbre = pe.matiere('marbre');
  const taille = pe.matiere('taille');
  const velours = pe.matiere('velours');
  const or = pe.matiere('or');
  const de = (f: (c: CaseDUnLieu) => boolean) => cases.filter(f);
  const piliers = new Map<string, [number, number]>();
  for (const c of de((c) => c.texture === 'marbre' && c.z <= 3 && estUnPilier(c.x, c.y, d))) piliers.set(`${c.x},${c.y}`, [c.x, c.y]);
  const socles = de((c) => c.texture === 'marbre' && c.z === 1 && !estUnPilier(c.x, c.y, d));
  const [zDalle, zEnt, zToit, zFaite] = [0.12, 2.9, 3.18, 4.2];
  at.boite(x0 + 0.02, x1 - 0.02, 0.02, d - 0.02, 0, zDalle, { dessus: taille.dessus, cote: pe.role('yardStone') });
  // Le fond de velours, entre les piliers du fond.
  at.boite(x0 + 0.2, x1 - 0.2, d - 0.5, d - 0.16, zDalle, zEnt, velours, { dessous: true, dessus: true });
  if (loin) {
    for (const [x, y] of piliers.values()) at.bloc(x + 0.5, y + 0.5, 0.46, 0.46, zDalle, zEnt, marbre, { dessous: true, dessus: true });
    // Les socles, d'un tenant par suite de cases voisines d'une même rangée.
    for (const y of [0, 1]) {
      const xs = socles.filter((c) => c.y === y).map((c) => c.x).sort((a, b) => a - b);
      for (let i = 0; i < xs.length; ) {
        let j = i;
        while (j + 1 < xs.length && xs[j + 1] === xs[j] + 1) j++;
        at.boite(xs[i] + 0.12, xs[j] + 0.88, y + 0.12, y + 0.88, zDalle, 1, marbre);
        i = j + 1;
      }
    }
    at.boite(x0, x1, 0, d, zEnt, zToit, taille, { dessous: false, dessus: true });
    at.toit(x0, x1, 0, d, zToit, zFaite, 'x', 0.1, pe.toit(), { teinte: taille, zPied: zToit });
    at.poutre([x0 + 0.1, d / 2, zFaite], [x1 - 0.1, d / 2, zFaite], 0.2, or);
    return;
  }
  // Les plis du velours, son galon d'or.
  const pli = sombre(velours, 0.82);
  const yv = d - 0.5 - 0.006;
  for (let x = x0 + 0.45; x < x1 - 0.3; x += 0.5) at.quad([x, yv, zDalle], [x + 0.12, yv, zDalle], [x + 0.12, yv, zEnt - 0.2], [x, yv, zEnt - 0.2], [x, d, 1], pli.cote);
  at.boite(x0 + 0.2, x1 - 0.2, d - 0.53, d - 0.5, zEnt - 0.2, zEnt - 0.08, or, { dessous: false, dessus: true, py: true });
  // Les piliers.
  for (const [x, y] of piliers.values()) {
    const [cx, cy] = [x + 0.5, y + 0.5];
    at.bloc(cx, cy, 0.6, 0.6, zDalle, zDalle + 0.14, marbre);
    at.prisme(cx, cy, 0.27, 0.23, zDalle + 0.14, zDalle + 0.26, 12, marbre, 0, true);
    at.prisme(cx, cy, 0.2, 0.18, zDalle + 0.26, zEnt - 0.3, 12, marbre, 0, true);
    at.prisme(cx, cy, 0.18, 0.28, zEnt - 0.3, zEnt - 0.14, 12, marbre, 0, true);
    at.bloc(cx, cy, 0.64, 0.64, zEnt - 0.14, zEnt, marbre, { dessus: true });
  }
  // Les socles : plinthe, dé, corniche ; le dessus à la hauteur de la case du trophée.
  for (const c of socles) {
    const [cx, cy] = [c.x + 0.5, c.y + 0.5];
    at.bloc(cx, cy, 0.84, 0.84, zDalle, zDalle + 0.14, marbre);
    at.bloc(cx, cy, 0.68, 0.68, zDalle + 0.14, 0.88, marbre, { dessous: true, dessus: true });
    at.bloc(cx, cy, 0.8, 0.8, 0.88, 1, { dessus: marbre.dessus, cote: pe.role('yardSlab') }, {});
  }
  // L'entablement, sa frise d'or devant, le toit, le faîte d'or et ses deux acrotères.
  at.boite(x0, x1, 0, d, zEnt, zToit, taille, { dessus: true });
  at.quad([x0 + 0.1, -0.006, zEnt + 0.1], [x1 - 0.1, -0.006, zEnt + 0.1], [x1 - 0.1, -0.006, zEnt + 0.18], [x0 + 0.1, -0.006, zEnt + 0.18], [x0, 1, zEnt], or.cote);
  at.toit(x0, x1, 0, d, zToit, zFaite, 'x', 0.12, pe.toit(), { teinte: taille, zPied: zToit });
  at.poutre([x0 + 0.1, d / 2, zFaite], [x1 - 0.1, d / 2, zFaite], 0.2, or, true);
  for (const x of [x0 + 0.2, x1 - 0.2]) at.pyramide(x, d / 2, 0.16, 0.16, zFaite + 0.06, zFaite + 0.5, or);
};

// ---------- La Halle aux matériaux ----------

/**
 * La Halle aux matériaux (la halle au fond, la cour devant) : le soubassement de pierre et ses assises, les murs de
 * planches, l'ossature de bois (poteaux, sablières, croix de Saint-André), la grande porte ouverte (sa bouche sombre, ses
 * deux vantaux rabattus), une fenêtre à chaque flanc, le toit franc à deux pans, le faîte en long, le pignon de planches
 * en façade ; la haute potence (son pied de pierre, son mât, son bras, sa jambe de force, la poulie et la corde jusqu'au
 * bloc suspendu, qui reste un bloc, comme ceux de la recette). De loin : la halle, sa porte, son toit, la potence.
 */
const halle: DessinDUnLieu = (at, pe, cases, loin) => {
  const w = cases[0]?.w ?? 3;
  const d = cases[0]?.d ?? 5;
  const y0 = HALLE.rang;
  const zMur = HALLE.haut;
  const zFaite = zMur + 1.62;
  const bras = Math.max(...cases.filter((c) => c.x === 0 && c.y === 1).map((c) => c.z), BRAS_DE_LA_POTENCE);
  const zBras = bras - 0.5;
  // Le dessus du bloc suspendu (son rang, `bras − 2`, va de z = bras − 3 à bras − 2 dans ce repère).
  const zBloc = bras - 2;
  const pierre = pe.matiere('pierre');
  const planches = pe.matiere('planches');
  const bois = pe.couleur(C.bois);
  const boisClair = pe.couleur(C.boisClair);
  at.boite(0.04, w - 0.04, y0 + 0.04, d - 0.04, 0, 0.95, pierre);
  at.boite(0.08, w - 0.08, y0 + 0.08, d - 0.08, 0.95, zMur, planches, { dessous: true, dessus: true });
  const yp = y0 + 0.032;
  at.quad([0.98, yp, 0], [2.02, yp, 0], [2.02, yp, 1.86], [0.98, yp, 1.86], [1.5, d, 1], OMBRE);
  if (loin) {
    at.toit(0, w, y0 - 0.15, d, zMur, zFaite, 'y', 0.12, pe.toit(), { teinte: planches, zPied: zMur });
    at.bloc(0.5, 1.5, 0.26, 0.26, 0, zBras + 0.26, bois, { dessous: true });
    at.boite(0.37, 0.63, 0.32, 1.37, zBras, zBras + 0.26, bois, { dessous: false, py: true });
    at.poutre([0.5, 0.48, zBras], [0.5, 0.48, zBloc], 0.08, pe.couleur(C.fer));
    return;
  }
  // Les assises du soubassement, peintes en deux tons sur la façade et les flancs.
  const assise = sombre(pierre, 0.9).cote;
  for (const z of [0.3, 0.62]) {
    at.quad([0.04, y0 + 0.034, z], [0.98, y0 + 0.034, z], [0.98, y0 + 0.034, z + 0.04], [0.04, y0 + 0.034, z + 0.04], [1.5, d, z], assise);
    at.quad([2.02, y0 + 0.034, z], [w - 0.04, y0 + 0.034, z], [w - 0.04, y0 + 0.034, z + 0.04], [2.02, y0 + 0.034, z + 0.04], [1.5, d, z], assise);
    for (const [x, s] of [
      [0.034, -1],
      [w - 0.034, 1],
    ] as const)
      at.quad([x, y0 + 0.04, z], [x, d - 0.04, z], [x, d - 0.04, z + 0.04], [x, y0 + 0.04, z + 0.04], [x - s, (y0 + d) / 2, z], assise);
  }
  // L'ossature : les poteaux d'angle et de porte, les sablières, les croix des pans pleins.
  for (const [x, y] of [
    [0.1, y0 + 0.1],
    [w - 0.1, y0 + 0.1],
    [w - 0.1, d - 0.1],
    [0.1, d - 0.1],
    [0.1, (y0 + d) / 2],
    [w - 0.1, (y0 + d) / 2],
  ])
    at.bloc(x, y, 0.2, 0.2, 0.9, zMur, bois, { dessous: true, dessus: true });
  at.boite(0.02, w - 0.02, y0 + 0.02, d - 0.02, 0.9, 1.0, bois, { dessus: false, dessous: false });
  at.boite(0.02, w - 0.02, y0 + 0.02, d - 0.02, zMur - 0.1, zMur, bois, { dessus: true, dessous: false });
  const croix = (a: V3, b: V3) => at.poutre(a, b, 0.09, boisClair);
  for (const [x, s] of [
    [0.07, -1],
    [w - 0.07, 1],
  ] as const) {
    for (const [ya, yb] of [
      [y0 + 0.2, (y0 + d) / 2 - 0.1],
      [(y0 + d) / 2 + 0.1, d - 0.2],
    ]) {
      croix([x + s * 0.01, ya, 1.02], [x + s * 0.01, yb, zMur - 0.12]);
      croix([x + s * 0.01, yb, 1.02], [x + s * 0.01, ya, zMur - 0.12]);
    }
  }
  croix([0.2, d - 0.06, 1.02], [w - 0.2, d - 0.06, zMur - 0.12]);
  croix([w - 0.2, d - 0.06, 1.02], [0.2, d - 0.06, zMur - 0.12]);
  // Les chaînes d'angle du soubassement : deux pierres en saillie à chaque coin, une sur deux.
  for (const [x, y] of [
    [0.17, y0 + 0.17],
    [w - 0.17, y0 + 0.17],
    [w - 0.17, d - 0.17],
    [0.17, d - 0.17],
  ])
    for (const [z0, z1] of [
      [0, 0.34],
      [0.56, 0.9],
    ])
      at.bloc(x, y, 0.34, 0.34, z0, z1, pierre, { dessous: true, dessus: z0 === 0 });
  // Le dedans de la porte : le fond et les joues, sombres, un tas de sacs devant le fond.
  at.boite(1.02, 1.98, y0 + 0.03, y0 + 0.9, 0, 1.82, sombre({ dessus: OMBRE, cote: OMBRE }, 1.3), { dessous: true, dessus: true, ny: true });
  at.prisme(1.5, y0 + 0.62, 0.3, 0.1, 0, 0.42, 6, sombre(planches, 0.6), 0.3);
  // La grande porte : piédroits, linteau, deux vantaux rabattus contre la façade.
  for (const x of [0.9, 2.1]) at.bloc(x, y0 + 0.02, 0.18, 0.16, 0, 1.94, bois, { dessous: true, dessus: true });
  at.boite(0.78, 2.22, y0 - 0.06, y0 + 0.1, 1.86, 2.02, bois, {});
  for (const [xa, xb] of [
    [0.8, 0.22],
    [2.2, 2.78],
  ]) {
    const v = { dessus: planches.dessus, cote: planches.cote };
    const [l, r] = [Math.min(xa, xb), Math.max(xa, xb)];
    at.boite(l, r, y0 - 0.08, y0 - 0.02, 0.05, 1.8, v, { dessous: true });
    at.quad([l + 0.04, y0 - 0.086, 0.3], [r - 0.04, y0 - 0.086, 1.5], [r - 0.04, y0 - 0.086, 1.64], [l + 0.04, y0 - 0.086, 0.44], [(l + r) / 2, d, 1], bois);
  }
  // Une fenêtre à chaque flanc.
  for (const [x, s] of [
    [0.08, -1],
    [w - 0.08, 1],
  ] as const)
    fenetreDeCote(at, x, s, (y0 + d) / 2, 0.5, 1.2, 1.7, bois, pe.couleur(VITRE_ETEINTE));
  // Le toit (un peu de débord sur la cour), ses rangs de bardeaux, le faîte en long, le pignon de planches.
  at.toit(0, w, y0 - 0.15, d, zMur, zFaite, 'y', 0.12, pe.toit(), { teinte: planches, zPied: zMur });
  const t = pe.toit();
  const rang = { dessus: mul(t.dessus, 0.88), cote: mul(t.cote, 0.88) };
  for (const f of [0.17, 0.34, 0.5, 0.67, 0.84])
    for (const [xa, xb] of [
      [0, w / 2],
      [w, w / 2],
    ]) {
      const x = xa + (xb - xa) * f;
      const z = zMur + (zFaite - zMur) * f + 0.012;
      const x2 = x + (xb - xa) * 0.05;
      const z2 = z + (zFaite - zMur) * 0.05;
      at.quad([x, y0 - 0.13, z], [x, d - 0.02, z], [x2, d - 0.02, z2], [x2, y0 - 0.13, z2], [w / 2, (y0 + d) / 2, 0], rang);
    }
  at.poutre([w / 2, y0 - 0.2, zFaite + 0.02], [w / 2, d - 0.02, zFaite + 0.02], 0.16, bois, true);
  at.disqueDebout([w / 2, y0 - 0.16, zMur + 0.7], 'ny', 0.18, 6, OMBRE, Math.PI / 6);
  // La potence : le pied de pierre, le mât, le bras vers la cour, la jambe de force, la poulie, la corde, le crochet.
  at.bloc(0.5, 1.5, 0.52, 0.52, 0, 0.32, pierre);
  at.bloc(0.5, 1.5, 0.26, 0.26, 0.32, zBras + 0.26, bois, { dessous: true });
  at.pyramide(0.5, 1.5, 0.15, 0.15, zBras + 0.26, zBras + 0.42, bois);
  at.boite(0.37, 0.63, 0.32, 1.37, zBras, zBras + 0.26, bois, { dessous: false, py: true });
  at.poutre([0.5, 1.4, zBras - 0.9], [0.5, 0.8, zBras + 0.02], 0.14, boisClair);
  for (const s of [-1, 1] as const) at.disqueDebout([0.5 + s * 0.14, 0.48, zBras - 0.12], s < 0 ? 'nx' : 'px', 0.14, 8, pe.couleur(C.fer));
  at.bloc(0.5, 0.48, 0.24, 0.3, zBras - 0.14, zBras, pe.couleur(C.fer), { dessus: true });
  at.poutre([0.5, 0.48, zBras - 0.14], [0.5, 0.48, zBloc + 0.12], 0.07, pe.couleur(0xb8a27a));
  at.boite(0.38, 0.62, 0.36, 0.6, zBloc, zBloc + 0.12, pe.couleur(C.fer), {});
  // Les frettes de fer du mât, le rouleau de corde à son pied.
  for (const z of [1.4, zBras - 0.5]) at.bloc(0.5, 1.5, 0.3, 0.3, z, z + 0.08, pe.couleur(C.fer), { dessous: false });
  at.prisme(0.5, 0.98, 0.2, 0.2, 0, 0.16, 8, pe.couleur(0xb8a27a), 0, true);
  at.couronne(0.5, 0.98, 0.16, 0.08, 0.2, 8, pe.couleur(0x9a865e));
  // Les rives des deux pignons, les chéneaux de bois le long des avant-toits.
  for (const y of [y0 - 0.17, d - 0.05]) for (const s of [-1, 1]) at.poutre([w / 2 + s * (w / 2 - 0.06), y, zMur - 0.02], [w / 2, y, zFaite + 0.02], 0.1, bois);
  for (const x of [0.06, w - 0.06]) at.poutre([x, y0 - 0.15, zMur - 0.06], [x, d, zMur - 0.06], 0.1, boisClair);
};

/** Les lieux dessinés, par lieu. */
const LIEUX: Record<VillagePlaceId, DessinDUnLieu> = { school: ecole, trophies: salle, assembly: halle };

/** Le cube d'un lieu que son modèle remplace : tout, sauf les trophées (la construction les pose), le bloc suspendu et la recette de la Halle. */
export function remplaceParLeLieu(c: VoxelCube, m: CaseDuLieu): boolean {
  if (c.place === 'trophies') return !estUnePlaceDeTrophee(m.x, m.y, m.z);
  // La halle, le mât de la potence, et son bras (en haut de la colonne de devant, deux cases au-dessus du bloc suspendu).
  if (c.place === 'assembly') return m.y >= HALLE.rang || (m.x === 0 && m.y === 1) || (m.x === 0 && m.y === 0 && m.z >= BRAS_DE_LA_POTENCE);
  return true;
}


/**
 * Les lieux du village dessinés de ce monde (sur l'île de l'école, `Kit.objetsDessines` : au 6e) : chacun comme un modèle
 * importé qui remplace ses cubes (on y entre toujours en les touchant), de près sur l'île `pres`, de loin ailleurs.
 */
export function lieuxDessines(a: ArchipelagoId, cubes: readonly VoxelCube[], pres: BiomeId | null = null): ImportedMonument[] {
  const parLieu = new Map<string, { c: VoxelCube; m: CaseDuLieu }[]>();
  for (const c of cubes) {
    if (c.ghost || (c.place !== 'school' && c.place !== 'trophies' && c.place !== 'assembly')) continue;
    const m = caseDuLieu(c);
    if (!m || !remplaceParLeLieu(c, m)) continue;
    const k = `${c.tag}|${c.place}`;
    const l = parLieu.get(k);
    if (l) l.push({ c, m });
    else parLieu.set(k, [{ c, m }]);
  }
  const out: ImportedMonument[] = [];
  for (const [k, l] of parLieu) {
    const [ile, lieu] = k.split('|') as [BiomeId, VillagePlaceId];
    // La Halle d'Archipéo seulement (son toit à deux pans) : la Fabrique de Blocland, à toit plat, garde ses cubes.
    if (lieu === 'assembly' && !l.some((e) => e.m.texture === 'toit')) continue;
    const { c, m } = l[0];
    const coin = { x: c.x - m.x, y: c.y - m.y, z: c.z - m.z };
    const muted = l.some((e) => e.c.muted);
    const at = new Atelier(new Pinceau(), muted ? null : new Pinceau(), (x, y, z) => [coin.x + x, coin.z + 1 + z, coin.y + y]);
    LIEUX[lieu](at, peintureDe(a, ile, muted), l.map((e) => e.m), pres !== ile);
    out.push({
      id: `lieu:${ile}:${lieu}`,
      stage: 1,
      opaque: at.opaque.fin(),
      fire: at.feu?.fin() ?? new Pinceau().fin(),
      halo: null,
      cellules: l.map((e) => ({ x: e.c.x, y: e.c.y, z: e.c.z })),
      replaced: new Set(l.map((e) => `${e.c.x},${e.c.y},${e.c.z}`)),
    });
  }
  return out;
}

/**
 * Ce que coûtent de plus les lieux dessinés d'un monde vus de près plutôt que de loin (les trois, sur l'île-école) : le
 * budget compte le monde de loin, puis ajoute cet écart (world/budget.ts). 0 sans lieu dessiné (hors du 6e).
 */
export function ecartDesLieux(a: ArchipelagoId, cubes: readonly VoxelCube[]): number {
  if (!KITS[a].objetsDessines) return 0;
  const ecole = getArchipelago(a).school;
  const cout = (pres: BiomeId | null) => lieuxDessines(a, cubes, pres).reduce((n, m) => n + (m.opaque.positions.length + m.fire.positions.length) / 9, 0);
  return cout(ecole) - cout(null);
}
