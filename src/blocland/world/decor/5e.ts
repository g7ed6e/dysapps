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
import { DELAVE, eclaircir, icosaedre, pave, peintre, tronconique, type Peindre, type Pinceau, type V3 } from './pinceau';

/** Les couleurs de la fiche : la pierre des tours, l'ardoise, la mousse des roches, la glace de la calotte. */
export const COULEURS_5E = { pierre: 0x7d8a86, ardoise: 0x224c5f, mousse: 0x5a7e50, roche: 0x6a7f86, glace: 0xe5ebe3, glaceCote: 0xc9d8dc, ecume: 0xe8eeec, roseau: 0x8a8a5a } as const;

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

/** La tour en ruine et la calotte : des formes hors de la grille (./horsGrille.ts), sans cubes, qu'on ne touche pas. */
export const FORMES_HORS_GRILLE_5E: Record<string, Forme> = {
  'tour-en-ruine': ({ P, e, cx, cz, base, hasard }) => tourEnRuine(P, cx, cz, base, 0.35, e.muted, hasard),
  calotte: ({ P, e, cx, cz, base, hasard }) => calotte(P, cx, base, cz, e.muted, hasard),
};

/**
 * Le décor du 5e hors de la grille : la tour en ruine du Carrefour, derrière son cœur, sur une case de terre où rien
 * n'est posé ; la calotte de sérac sur le plus haut pic du Glacier.
 */
/** Le décalage de la tour en ruine par rapport à l'axe du Carrefour, en cases, pour qu'elle ne passe pas sous le nom de l'île. */
const DECALAGE_DE_LA_RUINE = -5;

export function horsGrille5e(champ: ChampDuSol, elements: readonly ElementDeDecor[]): ElementDeDecor[] {
  const out: ElementDeDecor[] = [];
  const occupees = new Set<string>();
  for (const e of elements) for (const c of e.cubes) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 3; dy++) occupees.add(`${c.x + dx},${c.y + dy}`);
  // Le Carrefour : une case libre juste derrière le cœur, à côté de son axe, sans décor devant elle (la caméra
  // regarde vers le nord), jamais dans le cœur.
  const carrefour = islandDef('carrefour');
  const axe = carrefour.core.x + CORE / 2;
  let tour: Colonne | null = null;
  let meilleur = -Infinity;
  for (const c of champ.colonnes) {
    // Juste derrière le cœur, avant les crêtes du fond : vue de l'île, elle se lit au-dessus des toits.
    if (c.ile !== 'carrefour' || c.liquide || c.fixe || inCore(carrefour, c.x, c.y) || c.y < carrefour.core.y + CORE || c.y > carrefour.core.y + CORE + 2) continue;
    if (occupees.has(`${c.x},${c.y}`)) continue;
    // À quelques cases de l'axe (le nom de l'île se place au-dessus de son axe) ; à égalité, la plus au fond.
    const score = -Math.abs(c.x - axe - DECALAGE_DE_LA_RUINE) * 4 + (c.y - carrefour.core.y);
    if (score > meilleur) [tour, meilleur] = [c, score];
  }
  if (tour) out.push({ id: `hors-grille/tour-en-ruine@${tour.x},${tour.y}`, genre: 'tour-en-ruine', cubes: [], x: tour.x, y: tour.y, z: tour.haut + 1, emprise: 1, muted: tour.muted, horsGrille: true });
  // Le Glacier : la colonne la plus haute.
  let pic: Colonne | null = null;
  for (const c of champ.colonnes) if (c.ile === 'glacier' && !c.liquide && (!pic || c.haut > pic.haut)) pic = c;
  if (pic) out.push({ id: `hors-grille/calotte@${pic.x},${pic.y}`, genre: 'calotte', cubes: [], x: pic.x, y: pic.y, z: pic.haut + 1, emprise: 1, muted: pic.muted, horsGrille: true });
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
    { genre: 'gradins', u: 0.38, recul: 70, haut: 17, rayon: 6.5, marche: 3, retrait: 0.7, pans: 7, couleur: 0x7298af, sommet: 0x6f8f6a, tour: { cote: 3, haut: 6, pierre: 0x7d8a86, toit: 0x224c5f } },
    { genre: 'gradins', u: 0.64, recul: 64, haut: 16, rayon: 4.5, marche: 2.5, retrait: 0.5, pans: 6, couleur: 0x7298af, sommet: 0x6f8f6a },
    { genre: 'gradins', u: 0.92, recul: 86, haut: 15, rayon: 8, allonge: 1.4, marche: 2, retrait: 0.9, pans: 8, couleur: 0x7a9fb4, sommet: 0x6f8f6a },
    { genre: 'cretes', u: -0.3, a: 1.3, recul: 125, haut: 16, cimes: 11, epaisseur: 24, couleur: 0xb3cad8, sommet: 0xcbd9e3, neige: 0.85 },
  ],
};
