// Les formes du décor propres aux Îles Brumeuses (5e) : leurs repères, leurs roches moussues, leurs ornements et leur
// lointain. Ce fichier appartient au sous-lot R4b-5e (docs/conception/cadrage-archipeo.md §6 ; intention du directeur
// artistique dans design/archipeo/intentions/5e-iles-brumeuses.md). Rien n'y change le monde en blocs : les cubes des
// repères restent ceux de Blocland, seule leur forme dans Archipéo change.
import { mixColor } from '../daylight';
import type { ElementDeDecor } from '../decorMesh';
import { CORE, inCore, islandDef } from '../map';
import { NIVEAU_EAU, type ChampDuSol, type Colonne } from '../landMesh';
import type { Couleur, Faces } from '../palette';
import type { Lointain } from './lointain';
import { enRepere, type Forme } from './outils';
import { boite, DELAVE, eclaircir, icosaedre, pave, peintre, tronconique, type Peindre, type Pinceau, type V3 } from './pinceau';

/** Les couleurs de la fiche : la pierre des tours, l'ardoise, la mousse des roches, la glace de la calotte. */
export const COULEURS_5E = { pierre: 0x7d8a86, ardoise: 0x224c5f, mousse: 0x5a7e50, roche: 0x6a7f86, glace: 0xe5ebe3, glaceCote: 0xc9d8dc, ecume: 0xe8eeec, roseau: 0x8a8a5a } as const;

/** Le Relais des voyageurs (LV2, DA lot 2) : le bois du ponton et le fer de la girouette. */
export const COULEURS_DU_RELAIS = { planche: 0x9c7c4b, poteau: 0x6e5234, fer: 0x3a4148 } as const;

/** Les deux faces d'une couleur de la fiche : un dessus un peu plus clair ; délavées si l'île est fermée. */
function faces(c: Couleur, muted: boolean, dessus = eclaircir(c, 1.12)): Faces {
  const f = { dessus, cote: c };
  return muted ? { dessus: mixColor(f.dessus, DELAVE[0], DELAVE[1]), cote: mixColor(f.cote, DELAVE[0], DELAVE[1]) } : f;
}

/** Un tertre bas qui épouse le sol : un anneau au ras du sol, un replat plus haut de `h`. */
function tertre(P: Pinceau, cx: number, cz: number, R: number, h: number, n: number, rot: number, sol: (x: number, z: number) => number, hasard: () => number, peindre: Peindre): void {
  const bas: V3[] = [];
  const haut: V3[] = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const r = R * (0.95 + 0.12 * hasard());
    const x = cx + r * Math.cos(a);
    const z = cz + r * Math.sin(a);
    bas.push([x, sol(x, z) - 0.15, z]);
    const xi = cx + r * 0.55 * Math.cos(a);
    const zi = cz + r * 0.55 * Math.sin(a);
    haut.push([xi, sol(xi, zi) + h * (0.75 + 0.5 * hasard()), zi]);
  }
  const dedans: V3 = [cx, sol(cx, cz) - 1, cz];
  for (let i = 0; i < n; i++) P.quad(bas[i], bas[(i + 1) % n], haut[(i + 1) % n], haut[i], dedans, peindre);
  for (let i = 1; i + 1 < n; i++) P.triangle(haut[0], haut[i], haut[i + 1], dedans, peindre);
}

/**
 * La tour d'archives du Marais, à la place du champignon géant de Blocland : carrée, trapue, penchée d'environ 8°, son
 * toit d'ardoise, le pied dans les éboulis et les roseaux, qui couvrent toute l'emprise du champignon (son chapeau).
 */
const tourDArchives = enRepere(({ P, e, cx, cz, pied, rot, hasard, vari, sol }) => {
  const pierre = faces(COULEURS_5E.pierre, e.muted);
  // L'emprise du champignon : son chapeau, un losange de trois cases de rayon autour du pied.
  const auSol = (x: number, z: number) => sol(x, z, pied + 0.3);
  tertre(P, cx, cz, 3.45, 0.45, 9, rot, auSol, hasard, peintre(pierre, pied, 0.8, 0.9 * vari()));
  const base = auSol(cx, cz) + 0.2;
  const haut = pave(P, cx, base - 0.3, cz, 2.3, 2.3, 4.8, rot, (10 * Math.PI) / 180, peintre(pierre, base, 4, vari()), false);
  // Le toit : une pyramide basse d'ardoise, un peu débordante.
  const c: V3 = [(haut[0][0] + haut[2][0]) / 2, (haut[0][1] + haut[2][1]) / 2, (haut[0][2] + haut[2][2]) / 2];
  const deborde = haut.map((p): V3 => [c[0] + (p[0] - c[0]) * 1.15, p[1] - 0.05, c[2] + (p[2] - c[2]) * 1.15]);
  const pointe: V3 = [c[0] + (c[0] - cx) * 0.2, c[1] + 1.2, c[2] + (c[2] - cz) * 0.2];
  const toit = peintre(faces(COULEURS_5E.ardoise, e.muted), c[1], 1.2, vari());
  for (let i = 0; i < 4; i++) P.triangle(deborde[i], deborde[(i + 1) % 4], pointe, [c[0], c[1] - 0.5, c[2]], toit);
  for (let i = 1; i < 3; i++) P.triangle(deborde[0], deborde[i], deborde[i + 1], pointe, toit);
  // Les roseaux, en touffes, au bord de l'emprise.
  const roseau = peintre(faces(COULEURS_5E.roseau, e.muted), pied, 1.2, vari());
  for (let k = 0; k < 5; k++) {
    const a = rot + 0.6 + (k / 5) * Math.PI * 2;
    const r = 2.4 + 0.5 * hasard();
    const x = cx + r * Math.cos(a);
    const z = cz + r * Math.sin(a);
    const y = auSol(x, z);
    for (let j = 0; j < 2; j++) tronconique(P, x + 0.15 * j, z - 0.1 * j, y - 0.05, y + 0.9 + 0.3 * hasard(), 0.07, 0, 3, a + j, roseau);
  }
});

/**
 * Les éboulis du Glacier, à la place de l'aiguille de glace de Blocland : des blocs de pierre sur ses 2 × 2 cases,
 * 2,5 cases de haut au plus. La seule glace blanche du Glacier est la calotte de son plus haut pic.
 */
const eboulis = enRepere(({ P, e, cx, cz, pied, rot, hasard, vari, matiere }) => {
  const f = matiere('pierre', e.muted);
  const base = pied + 0.3;
  icosaedre(P, [cx, base + 0.45, cz], 1.15, 0.8, 0.14, hasard, peintre(f, base, 1.6, vari()), rot);
  for (let k = 0; k < 2; k++) {
    const a = rot + 1.2 + k * 2.4;
    const r = 0.55 + 0.1 * hasard();
    icosaedre(P, [cx + 1.1 * Math.cos(a), base + 0.25, cz + 1.1 * Math.sin(a)], r, 0.75, 0.16, hasard, peintre(f, base, 1, vari()), a);
  }
});

export const FORMES_5E: Record<string, Forme> = { 'champignon-geant': tourDArchives, 'aiguille-de-glace': eboulis };

/**
 * Les roches moussues, à la place des plaques de glace de Blocland (les bancs du 5e) : une roche basse à 0,3 case
 * au-dessus de l'eau, le dessus moussu, l'écume autour.
 */
const rocheMoussue: Forme = ({ P, e, hasard, rot, vari }) => {
  const mx = e.cubes.reduce((t, c) => t + c.x + 0.5, 0) / e.cubes.length;
  const mz = e.cubes.reduce((t, c) => t + c.y + 0.5, 0) / e.cubes.length;
  const R = 0.35 + 0.3 * Math.sqrt(e.cubes.length);
  const roche = faces(COULEURS_5E.roche, e.muted, COULEURS_5E.mousse);
  tronconique(P, mx, mz, NIVEAU_EAU - 0.25, NIVEAU_EAU + 0.3, R, R * 0.7, 6, rot, peintre(roche, NIVEAU_EAU - 0.2, 0.5, vari()));
  // L'écume : un anneau clair, à plat, au ras de l'eau.
  const ecume = peintre(faces(COULEURS_5E.ecume, e.muted), NIVEAU_EAU, 0.1);
  const n = 6;
  const y = NIVEAU_EAU + 0.03;
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * Math.PI * 2;
    const a1 = rot + ((i + 1) / n) * Math.PI * 2;
    const k = 1.35 + 0.2 * hasard();
    const p = (a: number, r: number): V3 => [mx + r * Math.cos(a), y, mz + r * Math.sin(a)];
    P.quad(p(a0, R * 0.98), p(a1, R * 0.98), p(a1, R * k), p(a0, R * k), [mx, y - 1, mz], ecume);
  }
};

export const RETOUCHES_5E: Record<string, Forme> = { banc: rocheMoussue };

/** La tour en ruine du Carrefour : environ 4,5 cases de haut, un mur rompu plus haut que l'autre, son toit d'ardoise tombé au pied. */
function tourEnRuine(P: Pinceau, cx: number, cz: number, base: number, rot: number, muted: boolean, hasard: () => number): void {
  const pierre = peintre(faces(COULEURS_5E.pierre, muted), base, 3, 0.96 + 0.08 * hasard());
  const cote = 2.4;
  pave(P, cx, base - 0.3, cz, cote, cote, 3, rot, 0, pierre);
  // Ce qui reste du haut : un pan de mur, et un coin plus haut encore.
  const u = (d: number): [number, number] => [cx + d * Math.cos(rot), cz + d * Math.sin(rot)];
  const [mx, mz] = u(cote / 2 - 0.18);
  pave(P, mx, base + 2.7, mz, 0.45, cote, 1, rot, 0, pierre);
  const v = (du: number, dv: number): [number, number] => [cx + du * Math.cos(rot) - dv * Math.sin(rot), cz + du * Math.sin(rot) + dv * Math.cos(rot)];
  const [kx, kz] = v(cote / 2 - 0.18, cote / 2 - 0.18);
  pave(P, kx, base + 3.7, kz, 0.45, 0.6, 1, rot, 0, pierre);
  // Le toit effondré : une dalle d'ardoise tombée contre le pied, penchée.
  const [tx, tz] = v(-cote / 2 - 0.35, 0.1);
  pave(P, tx, base - 0.2, tz, 0.2, cote * 1.15, 1.5, rot, -0.55, peintre(faces(COULEURS_5E.ardoise, muted), base, 1.2), true);
}

/** La calotte de sérac : un bloc de glace pâle, facetté, posé sur le sommet du plus haut pic. */
function calotte(P: Pinceau, x: number, y: number, z: number, muted: boolean, hasard: () => number): void {
  const f = faces(COULEURS_5E.glaceCote, muted, COULEURS_5E.glace);
  icosaedre(P, [x, y + 0.25, z], 1.25, 0.62, 0.2, hasard, peintre(f, y - 0.4, 1.3), hasard() * Math.PI);
}

/** Le ponton du Relais : un tablier de planches au ras de l'eau, vers le large (+x), sur quatre pieux, une échelle au rivage. */
export const PONTON = { long: 3.2, large: 1.1, dessus: NIVEAU_EAU + 0.5, planche: 0.14, pieu: 0.09 } as const;

function ponton(P: Pinceau, cx: number, cz: number, base: number, muted: boolean): void {
  const planche = peintre(faces(COULEURS_DU_RELAIS.planche, muted), PONTON.dessus - 0.2, 0.3);
  const bois = peintre(faces(COULEURS_DU_RELAIS.poteau, muted), NIVEAU_EAU - 0.3, base - NIVEAU_EAU);
  const x0 = cx + 0.5;
  const x1 = x0 + PONTON.long;
  const [z0, z1] = [cz - PONTON.large / 2, cz + PONTON.large / 2];
  boite(P, x0 - 0.05, PONTON.dessus - PONTON.planche, z0, x1, PONTON.dessus, z1, planche);
  for (const x of [x0 + 1.2, x1 - 0.15]) for (const z of [z0, z1]) tronconique(P, x, z, NIVEAU_EAU - 0.3, PONTON.dessus + 0.35, PONTON.pieu, PONTON.pieu * 0.8, 4, Math.PI / 4, bois);
  // L'échelle, du tablier au haut du rivage : deux montants, trois barreaux.
  const [e0, e1] = [PONTON.dessus, base];
  for (const z of [cz - 0.25, cz + 0.25]) boite(P, x0 + 0.02, e0, z - 0.04, x0 + 0.1, e1 + 0.3, z + 0.04, bois);
  for (let i = 1; i <= 3; i++) {
    const y = e0 + ((e1 - e0) * i) / 4;
    boite(P, x0 + 0.03, y - 0.03, cz - 0.25, x0 + 0.09, y + 0.03, cz + 0.25, bois);
  }
}

/** La girouette du Relais : un mât de fer, les quatre branches du vent, une cigogne découpée qui tourne au sommet. */
export const GIROUETTE = { mat: 6.6, branche: 0.45 } as const;

function girouette(P: Pinceau, cx: number, cz: number, base: number, muted: boolean): void {
  const fer = peintre(faces(COULEURS_DU_RELAIS.fer, muted), base, GIROUETTE.mat + 1);
  const y = base + GIROUETTE.mat;
  tronconique(P, cx, cz, base - 0.2, y, 0.07, 0.05, 4, Math.PI / 4, fer);
  const b = GIROUETTE.branche;
  boite(P, cx - b, y - 0.55, cz - 0.025, cx + b, y - 0.5, cz + 0.025, fer);
  boite(P, cx - 0.025, y - 0.55, cz - b, cx + 0.025, y - 0.5, cz + b, fer);
  // La cigogne, de profil (une plaque de fer à peine épaisse) : le corps, la queue, le cou, la tête et son long bec, les pattes.
  const e = 0.03;
  boite(P, cx - 0.3, y + 0.25, cz - e, cx + 0.25, y + 0.45, cz + e, fer);
  boite(P, cx - 0.5, y + 0.3, cz - e, cx - 0.3, y + 0.4, cz + e, fer);
  boite(P, cx + 0.15, y + 0.45, cz - e, cx + 0.22, y + 0.8, cz + e, fer);
  boite(P, cx + 0.12, y + 0.78, cz - e, cx + 0.3, y + 0.9, cz + e, fer);
  boite(P, cx + 0.3, y + 0.8, cz - e, cx + 0.62, y + 0.84, cz + e, fer);
  boite(P, cx - 0.05, y, cz - e, cx + 0.0, y + 0.25, cz + e, fer);
}

/** La tour en ruine, la calotte, le ponton et la girouette : des formes hors de la grille (./horsGrille.ts), sans cubes, qu'on ne touche pas. */
export const FORMES_HORS_GRILLE_5E: Record<string, Forme> = {
  'tour-en-ruine': ({ P, e, cx, cz, base, hasard }) => tourEnRuine(P, cx, cz, base, 0.35, e.muted, hasard),
  calotte: ({ P, e, cx, cz, base, hasard }) => calotte(P, cx, base, cz, e.muted, hasard),
  ponton: ({ P, e, cx, cz, base }) => ponton(P, cx, cz, base, e.muted),
  girouette: ({ P, e, cx, cz, base }) => girouette(P, cx, cz, base, e.muted),
};

/**
 * Le décor du 5e hors de la grille : la tour en ruine du Carrefour, derrière son cœur, sur une case de terre où rien
 * n'est posé ; la calotte de sérac sur le plus haut pic du Glacier.
 */
export function horsGrille5e(champ: ChampDuSol, elements: readonly ElementDeDecor[]): ElementDeDecor[] {
  const out: ElementDeDecor[] = [];
  const occupees = new Set<string>();
  for (const e of elements) for (const c of e.cubes) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) occupees.add(`${c.x + dx},${c.y + dy}`);
  // Le Carrefour : une case libre derrière le cœur, jamais dedans, loin de son axe pour ne pas passer sous le nom de l'île.
  const carrefour = islandDef('carrefour');
  const axe = carrefour.core.x + CORE / 2;
  let tour: Colonne | null = null;
  let meilleur = -Infinity;
  for (const c of champ.colonnes) {
    if (c.ile !== 'carrefour' || c.liquide || c.fixe || inCore(carrefour, c.x, c.y) || c.y < carrefour.core.y + CORE) continue;
    if (occupees.has(`${c.x},${c.y}`)) continue;
    // Le plus loin de l'axe (le nom de l'île se place au-dessus de son axe) ; à égalité, la plus près du cœur.
    const score = Math.abs(c.x - axe) * 4 - (c.y - carrefour.core.y);
    if (score > meilleur) [tour, meilleur] = [c, score];
  }
  if (tour) out.push({ id: `hors-grille/tour-en-ruine@${tour.x},${tour.y}`, genre: 'tour-en-ruine', cubes: [], x: tour.x, y: tour.y, z: tour.haut + 1, emprise: 1, muted: tour.muted, horsGrille: true });
  // Le Glacier : la colonne la plus haute.
  let pic: Colonne | null = null;
  for (const c of champ.colonnes) if (c.ile === 'glacier' && !c.liquide && (!pic || c.haut > pic.haut)) pic = c;
  if (pic) out.push({ id: `hors-grille/calotte@${pic.x},${pic.y}`, genre: 'calotte', cubes: [], x: pic.x, y: pic.y, z: pic.haut + 1, emprise: 1, muted: pic.muted, horsGrille: true });
  // Le Relais des voyageurs : le ponton sur son rivage est (le plus à l'est, au milieu du cœur), et la girouette sur la
  // première ou la deuxième rangée derrière le cœur, juste derrière l'auberge (vers les colonnes 9 et 10 du cœur).
  const relais = islandDef('relais');
  const milieu = relais.core.y + CORE / 2;
  let rive: Colonne | null = null;
  let mat: Colonne | null = null;
  // L'écart d'une case à la place voulue de la girouette : derrière la cheminée de l'auberge, au plus près du cœur.
  const ecart = (c: Colonne) => Math.abs(c.x - relais.core.x - 9.5) + 2 * (c.y - relais.core.y - CORE);
  // Le ponton et la girouette ne se posent que sur une case sans décor (un arbre voisin ne les gêne pas : le ponton part
  // vers le large, le mât de la girouette dépasse les arbres).
  const portees = new Set(elements.flatMap((e) => e.cubes.map((c) => `${c.x},${c.y}`)));
  for (const c of champ.colonnes) {
    if (c.ile !== 'relais' || c.liquide || c.fixe || portees.has(`${c.x},${c.y}`)) continue;
    if (!inCore(relais, c.x, c.y) && c.x >= relais.core.x + CORE && Math.abs(c.y - milieu) <= 3 && (!rive || c.x > rive.x || (c.x === rive.x && Math.abs(c.y - milieu) < Math.abs(rive.y - milieu))))
      rive = c;
    if (c.y >= relais.core.y + CORE && c.y <= relais.core.y + CORE + 1 && (!mat || ecart(c) < ecart(mat))) mat = c;
  }
  if (rive) out.push({ id: `hors-grille/ponton@${rive.x},${rive.y}`, genre: 'ponton', cubes: [], x: rive.x, y: rive.y, z: rive.haut + 1, emprise: 1, muted: rive.muted, horsGrille: true });
  if (mat) out.push({ id: `hors-grille/girouette@${mat.x},${mat.y}`, genre: 'girouette', cubes: [], x: mat.x, y: mat.y, z: mat.haut + 1, emprise: 1, muted: mat.muted, horsGrille: true });
  return out;
}

/**
 * Le lointain des Îles Brumeuses (intention, §2) : des masses de roche en gradins irrégulières, de largeurs très
 * différentes (la plus proche, plus large que haute, est la plus pâle), au sommet plat et moussu, la plus au centre
 * portant une tour carrée au toit d'ardoise ; derrière elles, une chaîne de cimes basses et pâles, fondues dans le voile.
 */
export const LOINTAIN_5E: Lointain = {
  graine: 'lointain-5e',
  pieces: [
    { genre: 'gradins', u: 0.08, recul: 60, haut: 15, rayon: 6, allonge: 1.8, marche: 2.5, retrait: 0.8, pans: 7, couleur: 0x86a9bd, sommet: 0x7f9c7a },
    { genre: 'gradins', u: 0.38, recul: 60, haut: 10, rayon: 6.5, marche: 2.5, retrait: 0.7, pans: 7, couleur: 0x7298af, sommet: 0x6f8f6a, tour: { cote: 3, haut: 4.5, pierre: 0x7d8a86, toit: 0x224c5f } },
    { genre: 'gradins', u: 0.64, recul: 64, haut: 16, rayon: 4.5, marche: 2.5, retrait: 0.5, pans: 6, couleur: 0x7298af, sommet: 0x6f8f6a },
    { genre: 'gradins', u: 0.92, recul: 86, haut: 15, rayon: 8, allonge: 1.4, marche: 2, retrait: 0.9, pans: 8, couleur: 0x7a9fb4, sommet: 0x6f8f6a },
    { genre: 'cretes', u: -0.3, a: 1.3, recul: 125, haut: 16, cimes: 11, epaisseur: 24, couleur: 0xb3cad8, sommet: 0xcbd9e3, neige: 0.85 },
  ],
};
