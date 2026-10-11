// Le décor du cœur des îles du 6e d'Archipéo, dessiné (lot 2 du 6e de la piste 3 « hybride » du directeur artistique,
// choisie par le mainteneur le 11 octobre 2026, même style que le lot 1 : low poly en aplats francs, sans texture, par
// le code). Les cubes du cœur (world/decor.ts, `DECOR`) restent ceux du monde : Blocland les dessine, la vue simple ne
// les voit pas ; la construction d'Archipéo remplace chaque ensemble par un objet lisible, comme un modèle importé (le
// toucher retrouve ses cases) : l'entrée de galerie de la Mine des lettres (le grand bloc sombre), le tas de sable de la
// Carrière, les gerbes du champ de la Ferme et ses poteaux, les deux rangées du boulier et la borne de brique de la
// Plaine, la mare et les galets de la Rivière, le volcan et les éclats d'obsidienne de la Lagune, la cabine, le
// réverbère et la caisse de la Baie, la tour de l'Horloge et son rouage de cadrans, le sol de mosaïque et le tas de
// fouille de la Fouille, les bottes de chaume et la borne de la Pointe, la touffe de fougères de la Vallée, le tas de
// galets du Laboratoire, les cartons du Hangar, la craie du Préau. Restent les formes communes du décor (world/
// architecture/heart.ts) : les rochers de pierre (la Mine, et une pierre sur presque chaque île) et le petit arbre de la
// Rivière, déjà des objets. Chaque ensemble : de 12 à 150 triangles, le même dessin de près et de loin.
//
// Un ensemble se lit dans la grille du décor (`DECOR`, avant la marge du cœur, `LAYOUT_PAD`) : ses colonnes, et le
// nombre de cubes que le décor y pose. Il n'est dessiné que si tous ses cubes sont là (un cube que le décor n'a pas pu
// poser, sous un lieu ou le Gardien, laisse l'ensemble en cubes). Il se dessine dans son repère (x vers la droite, y
// vers le fond, z vers le haut, z = 0 sous son cube le plus bas), tourné avec l'île (GD-9), chaque colonne posée sur
// son sol (`sol`). Rien ne s'allume (le réverbère du cœur reste éteint, docs/rendu/style.md), rien ne bouge. Code pur,
// sans Three.js.
import type { VoxelCube } from '../cube';
import { type BiomeId, BIOMES } from '../../biomes';
import { DECOR } from '../decor';
import { type ArchipelagoId, islandDef } from '../map';
import type { ImportedMonument } from '../monumentModels';
import { turnCell, turnPoint } from '../placement';
import { LAYOUT_PAD, origineDe } from '../terrain/base';
import { apartFromGhost, LANTERNE_DE_COUR } from '../architecture';
import { batimentsDe, coursDe } from '../construction/buildings';
import { Pinceau, type V3 } from '../decor/brush';
import type { Faces } from '../palette';
import { Atelier, type Teinte } from './atelier';
import { borne, caisse, COULEURS_DES_OBJETS as C, galet, gerbe, type Peinture, peintureDe, plateauSurPieds, poteauDeBarriere, tas } from './pieces';

/** Un cube d'un ensemble, dans son repère : sa case, et sa matière. */
interface CaseDuCoeur {
  x: number;
  y: number;
  z: number;
  texture: string;
}

/** Ce qu'un dessin du cœur lit : ses cubes, et le sol de chaque colonne (0 sous la plus basse). */
interface EnsembleDuCoeur {
  cases: readonly CaseDuCoeur[];
  sol: (x: number, y: number) => number;
}

/** Le dessin d'un ensemble du cœur. */
type DessinDuCoeur = (at: Atelier, pe: Peinture, e: EnsembleDuCoeur) => void;

/** Un ensemble du décor d'un cœur : son nom, ses colonnes dans la grille du décor (`DECOR`), son dessin. */
export interface DecorDuCoeur {
  nom: string;
  colonnes: readonly (readonly [number, number])[];
  dessin: DessinDuCoeur;
}

/** Une teinte un peu plus sombre (le second ton d'un aplat), sur les deux faces. */
const sombre = (f: Faces, k = 0.86): Faces => ({ dessus: mul(f.dessus, k), cote: mul(f.cote, k) });
const mul = (c: number, k: number) => (Math.round(((c >> 16) & 255) * k) << 16) | (Math.round(((c >> 8) & 255) * k) << 8) | Math.round((c & 255) * k);

/** L'ouverture sombre (la galerie, la fente) : le brun le plus sombre du décor. */
const OMBRE = 0x2a201a;

// ---------- La Mine des lettres ----------

/**
 * L'entrée de la galerie (deux cases de large, deux de haut : le grand bloc sombre des captures) : la butte de roche, son
 * sommet en croupe, le cadre de boisage (deux montants, le chapeau), la bouche noire, deux blocs tombés au pied, le
 * wagonnet à la sortie. Tournée vers la caméra (−y).
 */
const galerie: DessinDuCoeur = (at, pe) => {
  const pierre = pe.matiere('pierre');
  const roche = sombre(pierre, 0.8);
  at.boite(0.04, 1.96, 0.42, 0.98, 0, 0.95, roche);
  at.pyramide(1, 0.7, 0.96, 0.28, 0.95, 1.98, roche);
  // Les épaules de la butte, de chaque côté du cadre.
  at.prisme(0.2, 0.62, 0.28, 0.08, 0, 0.9, 5, pierre, 0.4);
  at.prisme(1.82, 0.66, 0.26, 0.06, 0, 0.75, 5, pierre, 1.1);
  // La bouche, et le cadre de boisage.
  at.quad([0.56, 0.41, 0], [1.44, 0.41, 0], [1.44, 0.41, 1.36], [0.56, 0.41, 1.36], [1, 1, 0.7], OMBRE);
  const bois = pe.matiere('tronc');
  for (const x of [0.45, 1.55]) at.bloc(x, 0.36, 0.22, 0.22, 0, 1.42, bois, { dessous: true, dessus: true });
  at.boite(0.26, 1.74, 0.24, 0.48, 1.42, 1.66, { dessus: bois.dessus, cote: pe.couleur(C.boisClair) }, {});
  // Le wagonnet, sorti devant la bouche : sa caisse de fer, son chargement de roche.
  const fer = pe.couleur(C.fer);
  at.boite(0.72, 1.28, 0.04, 0.36, 0.08, 0.42, fer, {});
  at.pyramide(1, 0.2, 0.22, 0.12, 0.42, 0.56, roche);
};

// ---------- La Carrière des mots ----------

/**
 * Le tas de sable de la Carrière (trois cases sur trois, deux de haut au milieu) : un grand tas à huit pans, un petit
 * contre le coin plus bas, la pelle plantée.
 */
const tasDeSable: DessinDuCoeur = (at, pe, e) => {
  const sable = pe.matiere('sable');
  const z = e.sol(1, 1);
  tas(at, 1.5, 1.5, z, 1.45, 1.9, sable);
  if (e.sol(0, 0) < z) tas(at, 0.62, 0.62, e.sol(0, 0), 0.5, z - e.sol(0, 0) + 0.3, sable, 6);
  pelle(at, pe, [2.05, 1.2, z + 1.0], [2.45, 0.88, z + 1.9]);
};

/** Une pelle plantée : le manche de bois du fer `bas` à la poignée `haut`, le fer en tôle sombre enfoncé. 18 triangles. */
function pelle(at: Atelier, pe: Peinture, bas: V3, haut: V3): void {
  at.poutre(bas, haut, 0.1, pe.couleur(C.boisClair));
  at.boite(bas[0] - 0.13, bas[0] + 0.13, bas[1] - 0.05, bas[1] + 0.05, bas[2] - 0.3, bas[2], pe.couleur(C.fer), {});
}

/** Un petit tas de sable seul (la Carrière, la Fouille), sa truelle à côté pour la Fouille. */
const petitTas =
  (outil: boolean): DessinDuCoeur =>
  (at, pe) => {
    tas(at, 0.5, 0.5, 0, 0.46, 0.62, pe.matiere('sable'), 6);
    if (outil) pelle(at, pe, [0.78, 0.3, 0.32], [0.98, 0.12, 0.72]);
  };

// ---------- La Ferme des accords ----------

/** Le champ de blé : une gerbe de paille liée par case de blé, chacune sur son sol. */
const champ: DessinDuCoeur = (at, pe, e) => {
  const paille = pe.role('paille');
  const lien = pe.couleur(C.bois);
  for (const c of e.cases) gerbe(at, c.x + 0.5, c.y + 0.5, c.z, 0.96, { dessus: paille, cote: mul(paille, 0.84) }, lien);
};

/** Un poteau de barrière seul (la Ferme) : celui des cours. */
const poteau: DessinDuCoeur = (at, pe, e) => poteauDeBarriere(at, pe, 0, 0, e.cases[0]?.z ?? 0);

// ---------- La Plaine des nombres ----------

/**
 * Une rangée du boulier (cinq cases le long de x) : deux montants de bois coiffés, la tringle à la même hauteur d'un bout
 * à l'autre (au-dessus du plus haut sol), une perle par case, dans la matière de son cube (brique ou sable : on compte
 * par cinq).
 */
const boulier: DessinDuCoeur = (at, pe, e) => {
  const haut = Math.max(...e.cases.map((c) => c.z)) + 0.62;
  const bois = pe.couleur(C.bois);
  const n = Math.max(...e.cases.map((c) => c.x)) + 1;
  for (const x of [0.14, n - 0.14]) {
    const s = e.sol(Math.floor(x), 0);
    at.bloc(x, 0.5, 0.2, 0.26, s, haut + 0.22, bois, { dessous: true, dessus: true });
    at.pyramide(x, 0.5, 0.13, 0.16, haut + 0.22, haut + 0.36, bois);
  }
  at.poutre([0.24, 0.5, haut], [n - 0.24, 0.5, haut], 0.12, pe.couleur(C.boisClair));
  for (const c of e.cases) perle(at, c.x + 0.5, 0.5, haut, 0.3, 0.2, pe.matiere(c.texture as 'brique'));
};

/** Une perle du boulier, enfilée le long de x : deux pointes à six pans, dos à dos. 12 triangles. */
function perle(at: Atelier, cx: number, cy: number, cz: number, r: number, demi: number, t: Teinte): void {
  at.pointe([cx, cy, cz], [cx - demi, cy, cz], r, 6, t, Math.PI / 6);
  at.pointe([cx, cy, cz], [cx + demi, cy, cz], r, 6, t, Math.PI / 6);
}

/** La borne de brique de la Plaine (deux cases de haut). */
const borneDeBrique: DessinDuCoeur = (at, pe) => borne(at, pe, 0, 0, 0, 1.9, pe.matiere('brique'), pe.role('yardSlab'));

// ---------- La Rivière des fractions ----------

/**
 * La mare (deux cases sur deux) : l'eau en nappe (le vert d'eau du cœur) à huit pans, son liseré clair, posée à fleur du
 * sol ; trois galets sur sa rive, le nénuphar sur l'eau.
 */
const mare: DessinDuCoeur = (at, pe, e) => {
  const z = e.sol(0, 0);
  at.disque(1, 1, z + 0.04, 0.96, 8, pe.role('lisere'), Math.PI / 8);
  at.disque(1, 1, z + 0.05, 0.86, 8, pe.role('nappe'), Math.PI / 8);
  at.disque(1.32, 1.3, z + 0.06, 0.24, 6, pe.role('feuille'));
  const g = pe.matiere('galet');
  galet(at, 0.24, 0.3, z, 0.2, 0.16, g);
  galet(at, 1.78, 0.42, z, 0.16, 0.14, g, 5, 1.2);
  galet(at, 0.4, 1.76, z, 0.18, 0.14, g, 5, 0.7);
};

/** Des galets seuls (la Rivière) : un gros et un petit. */
const galets: DessinDuCoeur = (at, pe) => {
  const g = pe.matiere('galet');
  galet(at, 0.42, 0.46, 0, 0.3, 0.3, g);
  galet(at, 0.76, 0.72, 0, 0.16, 0.16, sombre(g, 0.94), 5, 1.4);
};

// ---------- La Lagune des décimaux ----------

/**
 * Le petit volcan (trois cases sur trois, la braise au sommet) : deux troncs de cône à huit pans qui se resserrent, le
 * bord du cratère, sa paroi intérieure et la braise mate au fond (elle ne brille pas) ; deux coulées d'obsidienne.
 */
const volcan: DessinDuCoeur = (at, pe) => {
  const pierre = pe.matiere('pierre');
  const n = 8;
  const rot = Math.PI / 8;
  at.prisme(1.5, 1.5, 1.46, 0.98, 0, 1.05, n, pierre, rot, true);
  at.prisme(1.5, 1.5, 0.98, 0.56, 1.05, 2.55, n, sombre(pierre, 0.92), rot, true);
  at.couronne(1.5, 1.5, 2.55, 0.34, 0.56, n, pierre.dessus, rot);
  at.paroi(1.5, 1.5, 0.34, 2.3, 2.55, n, pierre.cote, rot);
  at.disque(1.5, 1.5, 2.3, 0.34, n, pe.role('braise'), rot);
  const obsidienne = pe.matiere('obsidienne');
  const coulees: [V3, V3][] = [
    [
      [1.18, 0.62, 1.45],
      [0.8, 0.1, 0.25],
    ],
    [
      [2.3, 1.3, 1.6],
      [2.82, 1.06, 0.3],
    ],
  ];
  for (const [a, b] of coulees) at.poutre(a, b, 0.2, obsidienne);
};

/** Des éclats d'obsidienne (une ou deux cases de haut) : trois ou quatre pointes penchées sur un pied de roche. */
const eclats: DessinDuCoeur = (at, pe, e) => {
  const haut = Math.max(...e.cases.map((c) => c.z)) + 1;
  const o = pe.matiere('obsidienne');
  at.prisme(0.5, 0.5, 0.36, 0.24, 0, 0.18, 5, sombre(pe.matiere('pierre'), 0.8), 0.5);
  const pointes: [number, number, number, number][] = [
    [0.5, 0.52, 0, 0.92],
    [0.26, 0.4, -0.18, 0.55],
    [0.72, 0.36, 0.2, 0.62],
    [0.5, 0.74, 0.05, 0.45],
  ];
  for (const [x, y, penche, h] of pointes.slice(0, haut > 1 ? 4 : 3)) at.pointe([x, y, 0.1], [x + penche, y - 0.08, 0.1 + h * haut * 0.9], 0.15, 4, o, 0.4);
};

// ---------- La Baie des mots ----------

/**
 * La cabine téléphonique rouge (trois cases de haut, son chapeau sombre) : la plinthe, le soubassement plein, les vitres
 * pâles (éteintes) sur ses quatre faces, leurs traverses, quatre montants, le bandeau, le toit bombé en croupe et son épi.
 */
const cabine: DessinDuCoeur = (at, pe) => {
  const rouge = pe.matiere('cabine');
  const vitre = pe.couleur(0xd9e4dc);
  at.bloc(0.5, 0.5, 0.86, 0.86, 0, 0.1, pe.role('yardStone'));
  at.bloc(0.5, 0.5, 0.68, 0.68, 0.1, 0.84, rouge, { dessous: true, dessus: true });
  at.bloc(0.5, 0.5, 0.62, 0.62, 0.84, 2.46, vitre, { dessous: true, dessus: true });
  for (const [x, y] of [
    [0.2, 0.2],
    [0.8, 0.2],
    [0.8, 0.8],
    [0.2, 0.8],
  ])
    at.bloc(x, y, 0.16, 0.16, 0.1, 2.5, rouge, { dessous: true, dessus: true });
  // Les traverses des vitres, sur chaque face.
  for (const z of [1.36, 1.9]) at.bloc(0.5, 0.5, 0.66, 0.66, z, z + 0.06, rouge, { dessous: true, dessus: true });
  at.bloc(0.5, 0.5, 0.74, 0.74, 2.5, 2.8, rouge, { dessous: false });
  const chapeau = pe.couleur(C.goudron);
  at.prisme(0.5, 0.5, 0.4 * Math.SQRT2, 0.16 * Math.SQRT2, 2.8, 3.12, 4, chapeau, Math.PI / 4);
  at.pyramide(0.5, 0.5, 0.06, 0.06, 3.12, 3.3, chapeau);
};

/**
 * Le réverbère éteint de la Baie (trois cases de poteau sombre, la lanterne au-dessus) : le pied et le fût de fer, la tête
 * de lanterne des cours, ses vitres dans l'opaque (une lanterne du cœur ne s'allume jamais).
 */
const reverbere: DessinDuCoeur = (at, pe) => {
  const fer = pe.couleur(C.fer);
  at.bloc(0.5, 0.5, 0.42, 0.42, 0, 0.26, fer);
  at.bloc(0.5, 0.5, 0.18, 0.18, 0.26, 3, fer, { dessous: true, dessus: true });
  at.facettes(LANTERNE_DE_COUR, 0, 0, 3, (f) => pe.role(f.role ?? 'lanternFrame'), pe.role('lanternGlass'));
};

/** La caisse de cabine posée au sol (la Baie) : une caisse rouge, son couvercle sombre. */
const caisseDeCabine: DessinDuCoeur = (at, pe) => {
  const rouge = pe.matiere('cabine');
  caisse(at, 0.1, 0.9, 0.12, 0.88, 0, 0.82, rouge, sombre(rouge, 0.8));
};

// ---------- L'Horloge des verbes ----------

/**
 * La tour de l'horloge (trois cases de pierre, le cadran, la flèche d'or) : la plinthe, le fût qui s'affine, la
 * corniche, la tête de pierre et ses quatre cadrans crème cerclés de laiton, leurs aiguilles sombres, le toit en
 * pyramide dans la couverture de l'île, la flèche d'or.
 */
const horloge: DessinDuCoeur = (at, pe) => {
  const pierre = pe.matiere('pierre');
  const cadran = pe.matiere('cadran');
  const or = pe.matiere('or');
  const q = Math.PI / 4;
  at.bloc(0.5, 0.5, 0.94, 0.94, 0, 0.24, { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') });
  at.prisme(0.5, 0.5, 0.4 * Math.SQRT2, 0.33 * Math.SQRT2, 0.24, 2.9, 4, pierre, q, true);
  at.bloc(0.5, 0.5, 0.84, 0.84, 2.9, 3.04, { dessus: pierre.dessus, cote: pe.role('yardSlab') }, {});
  at.bloc(0.5, 0.5, 0.78, 0.78, 3.04, 3.9, pierre, { dessous: true, dessus: true });
  const fer = pe.couleur(C.fer);
  const faces: ['px' | 'nx' | 'py' | 'ny', V3, V3][] = [
    ['ny', [0.5, 0.105, 3.47], [1, 0, 0]],
    ['py', [0.5, 0.895, 3.47], [1, 0, 0]],
    ['nx', [0.105, 0.5, 3.47], [0, 1, 0]],
    ['px', [0.895, 0.5, 3.47], [0, 1, 0]],
  ];
  for (const [vers, c, u] of faces) {
    const s = vers === 'ny' || vers === 'nx' ? -1 : 1;
    const devant = (d: number): V3 => (u[0] ? [c[0], c[1] + s * d, c[2]] : [c[0] + s * d, c[1], c[2]]);
    at.disqueDebout(c, vers, 0.32, 8, cadran.cote, Math.PI / 8);
    at.disqueDebout(devant(0.008), vers, 0.26, 8, cadran.dessus, Math.PI / 8);
    // Les aiguilles : la grande vers midi, la petite vers trois heures.
    const m = devant(0.014);
    const le = (du: number, dz: number): V3 => [m[0] + u[0] * du, m[1] + u[1] * du, m[2] + dz];
    at.quad(le(-0.025, 0), le(0.025, 0), le(0.025, 0.21), le(-0.025, 0.21), devant(-0.5), fer);
    at.quad(le(0, -0.025), le(0.15, -0.025), le(0.15, 0.025), le(0, 0.025), devant(-0.5), fer);
  }
  at.pyramide(0.5, 0.5, 0.46, 0.46, 3.9, 4.5, pe.toit());
  at.prisme(0.5, 0.5, 0.07, 0, 4.42, 4.98, 4, or, q);
};

/**
 * Le rouage de cadrans couché au sol (deux cases) : deux roues dentées de laiton qui s'engrènent, dents à plat, leur moyeu
 * crème.
 */
const rouage: DessinDuCoeur = (at, pe) => {
  const cadran = pe.matiere('cadran');
  const laiton: Faces = { dessus: cadran.cote, cote: mul(cadran.cote, 0.82) };
  roue(at, 0.52, 0.5, 0.4, 0.17, 10, laiton, 0);
  roue(at, 1.44, 0.5, 0.34, 0.25, 8, laiton, Math.PI / 8);
  at.prisme(0.52, 0.5, 0.12, 0.1, 0.17, 0.26, 6, cadran.dessus);
  at.prisme(1.44, 0.5, 0.1, 0.08, 0.25, 0.33, 6, cadran.dessus);
};

/** Une roue dentée couchée : `n` dents (une étoile à 2n pointes, son flanc et son dessus), de rayon `r`, haute de `h`. */
function roue(at: Atelier, cx: number, cy: number, r: number, h: number, n: number, t: Teinte, rot: number): void {
  const pts: V3[] = [];
  for (let i = 0; i < 2 * n; i++) {
    const a = rot + (i / (2 * n)) * Math.PI * 2;
    const ri = i % 2 ? r * 0.78 : r;
    pts.push([cx + ri * Math.cos(a), cy + ri * Math.sin(a), 0]);
  }
  const dedans: V3 = [cx, cy, h / 2];
  for (let i = 0; i < pts.length; i++) {
    const [p, q] = [pts[i], pts[(i + 1) % pts.length]];
    at.quad(p, q, [q[0], q[1], h], [p[0], p[1], h], dedans, t);
  }
  for (let i = 0; i < pts.length; i++) {
    const [p, q] = [pts[i], pts[(i + 1) % pts.length]];
    at.tri([cx, cy, h], [p[0], p[1], h], [q[0], q[1], h], [cx, cy, 0], t);
  }
}

// ---------- La Fouille des siècles ----------

/**
 * L'éclat de sol de mosaïque mis au jour (deux cases) : la terre du sondage, la dalle de mosaïque cassée en deux morceaux
 * de hauteur différente, pavée en damier de ses deux tons, deux tesselles détachées.
 */
const solDeMosaique: DessinDuCoeur = (at, pe) => {
  const m = pe.matiere('mosaique');
  const terre = pe.matiere('terre');
  at.boite(0.04, 1.96, 0.06, 0.94, 0, 0.06, terre);
  const morceaux: [number, number, number, number, number, number][] = [
    [0.12, 1.12, 0.14, 0.86, 0.17, 4],
    [1.18, 1.86, 0.2, 0.8, 0.13, 3],
  ];
  for (const [x0, x1, y0, y1, h, n] of morceaux) {
    at.boite(x0, x1, y0, y1, 0.06, h, { dessus: m.dessus, cote: mul(m.cote, 0.9) }, { dessous: true, dessus: true });
    const [px, py] = [(x1 - x0) / n, (y1 - y0) / 3];
    for (let i = 0; i < n; i++)
      for (let j = 0; j < 3; j++) {
        const [a, b] = [x0 + i * px, y0 + j * py];
        at.quad([a, b, h], [a + px, b, h], [a + px, b + py, h], [a, b + py, h], [1, 0.5, 0], (i + j) % 2 ? m.cote : m.dessus);
      }
  }
  at.bloc(1.3, 0.12, 0.12, 0.12, 0.06, 0.16, m.dessus);
  at.bloc(0.96, 0.92, 0.12, 0.1, 0.06, 0.14, m.cote);
};

// ---------- La Pointe des paysages ----------

/** Les deux bottes de chaume (une par case) : un ballot à deux liens de ficelle sombre, l'un un peu tourné. */
const bottesDeChaume: DessinDuCoeur = (at, pe, e) => {
  const chaume = pe.matiere('chaume');
  const lien = pe.couleur(C.bois);
  for (const c of e.cases) {
    const [x0, x1, y0, y1, z0, z1] = [c.x + 0.07, c.x + 0.93, c.y + 0.16, c.y + 0.84, c.z, c.z + 0.6];
    at.boite(x0, x1, y0, y1, z0, z1, chaume);
    for (const x of [x0 + 0.24, x1 - 0.3]) at.boite(x, x + 0.06, y0 - 0.012, y1 + 0.012, z0, z1 + 0.012, lien, { dessous: true, px: false, nx: false });
  }
};

/** La borne de pierre au bord du chemin (la Pointe) : la borne commune, sa tête rouge de borne de chemin. */
const borneDePierre: DessinDuCoeur = (at, pe) => borne(at, pe, 0, 0, 0, 0.92, pe.matiere('pierre'), pe.matiere('cabine'));

// ---------- La Vallée du vivant ----------

/**
 * La touffe de fougères (deux cubes de mousse, une feuille dessus) : deux buttes de mousse, sept frondes penchées en
 * étoile, d'un vert plus clair au milieu.
 */
const fougeres: DessinDuCoeur = (at, pe) => {
  const mousse = pe.matiere('mousse');
  tas(at, 0.52, 0.5, 0, 0.46, 0.34, mousse, 6);
  tas(at, 1.46, 0.5, 0, 0.42, 0.28, mousse, 6, 0.8);
  const f = pe.matiere('feuilles');
  const frondes: [number, number, number, number, number][] = [
    [0.55, 0.5, -0.5, -0.25, 0.95],
    [0.55, 0.5, 0.45, -0.3, 1.0],
    [0.55, 0.5, -0.1, 0.45, 1.1],
    [0.55, 0.5, 0.05, -0.05, 1.2],
    [1.45, 0.5, 0.42, -0.2, 0.7],
    [1.45, 0.5, -0.3, 0.3, 0.8],
    [1.45, 0.5, 0.05, -0.38, 0.75],
  ];
  frondes.forEach(([x, y, dx, dy, h], i) => at.pointe([x, y, 0.2], [x + dx, y + dy, h], 0.1, 3, i === 3 ? pe.role('feuille') : f, i));
};

// ---------- Le Laboratoire des éléments ----------

/** Le tas de galets (deux au sol, un dessus) : deux gros galets plats côte à côte, un troisième posé sur le premier. */
const tasDeGalets: DessinDuCoeur = (at, pe) => {
  const g = pe.matiere('galet');
  galet(at, 0.5, 0.5, 0, 0.42, 0.42, g, 6);
  galet(at, 1.48, 0.52, 0, 0.36, 0.36, sombre(g, 0.94), 6, 0.7);
  galet(at, 0.56, 0.48, 0.42, 0.3, 0.3, g, 6, 1.1);
};

// ---------- Le Hangar des inventions ----------

/** Les deux cartons empilés : le gros en bas, sa bande de ruban ; le petit dessus, ses quatre rabats ouverts. */
const cartons: DessinDuCoeur = (at, pe) => {
  const carton = pe.matiere('carton');
  caisse(at, 0.08, 0.92, 0.1, 0.9, 0, 0.94, carton, sombre(carton, 0.9));
  at.quad([0.44, 0.065, 0.2], [0.56, 0.065, 0.2], [0.56, 0.065, 0.94], [0.44, 0.065, 0.94], [0.5, 0.5, 0.5], pe.couleur(C.creme));
  const [x0, x1, y0, y1, z0, z1] = [0.18, 0.8, 0.2, 0.78, 0.94, 1.62];
  at.boite(x0, x1, y0, y1, z0, z1, carton, { dessous: true, dessus: true });
  at.quad([x0 + 0.02, y0 + 0.02, z1 - 0.01], [x1 - 0.02, y0 + 0.02, z1 - 0.01], [x1 - 0.02, y1 - 0.02, z1 - 0.01], [x0 + 0.02, y1 - 0.02, z1 - 0.01], [0.5, 0.5, 0], pe.couleur(OMBRE));
  const rabat = sombre(carton, 0.95);
  const r = 0.22;
  at.quad([x0, y0, z1], [x1, y0, z1], [x1, y0 - r * 0.7, z1 + r * 0.7], [x0, y0 - r * 0.7, z1 + r * 0.7], [0.5, 0.5, z1 - 1], rabat);
  at.quad([x0, y1, z1], [x1, y1, z1], [x1, y1 + r * 0.7, z1 + r * 0.7], [x0, y1 + r * 0.7, z1 + r * 0.7], [0.5, 0.5, z1 - 1], rabat);
  at.quad([x0, y0, z1], [x0, y1, z1], [x0 - r * 0.6, y1, z1 + r * 0.8], [x0 - r * 0.6, y0, z1 + r * 0.8], [0.5, 0.5, z1 - 1], rabat);
  at.quad([x1, y0, z1], [x1, y1, z1], [x1 + r * 0.6, y1, z1 + r * 0.8], [x1 + r * 0.6, y0, z1 + r * 0.8], [0.5, 0.5, z1 - 1], rabat);
};

// ---------- Le Préau des délégués ----------

/**
 * La craie sur son pied de planches (le Préau) : la petite table de planches, le pain de craie (tenu à 70 d'écart du
 * fantôme Brume), trois bâtons de craie couchés devant lui.
 */
const craie: DessinDuCoeur = (at, pe) => {
  const planches = pe.matiere('planches');
  plateauSurPieds(
    at,
    0.08,
    0.92,
    0.12,
    0.88,
    1,
    0.14,
    planches,
    [
      [0.2, 0.24],
      [0.8, 0.24],
      [0.8, 0.76],
      [0.2, 0.76],
    ],
    0.14,
    sombre(planches, 0.85),
  );
  const c = pe.matiere('craie');
  const blanc: Faces = { dessus: apartFromGhost(c.dessus), cote: apartFromGhost(c.cote) };
  at.boite(0.24, 0.84, 0.44, 0.8, 1, 1.34, blanc);
  for (const [x, y] of [
    [0.2, 0.24],
    [0.42, 0.2],
    [0.62, 0.27],
  ])
    at.boite(x, x + 0.26, y - 0.075, y + 0.075, 1, 1.15, blanc);
};

/** Le décor du cœur des îles du 6e, ensemble par ensemble (colonnes dans la grille de `DECOR`). */
export const COEURS_DU_6E: Readonly<Partial<Record<BiomeId, readonly DecorDuCoeur[]>>> = {
  'french-6e-letter-confusion': [
    {
      nom: 'galerie',
      colonnes: [
        [2, 10],
        [3, 10],
      ],
      dessin: galerie,
    },
  ],
  'french-6e-word-spelling': [
    { nom: 'tas-de-sable', colonnes: [8, 9, 10].flatMap((x) => [3, 4, 5].map((y) => [x, y] as const)), dessin: tasDeSable },
    { nom: 'petit-tas', colonnes: [[3, 9]], dessin: petitTas(false) },
  ],
  'french-6e-grammar-spelling': [
    {
      nom: 'champ',
      colonnes: [
        [8, 2],
        [8, 3],
        [9, 3],
        [8, 4],
        [8, 5],
        [9, 5],
      ],
      dessin: champ,
    },
    { nom: 'poteau-1', colonnes: [[6, 1]], dessin: poteau },
    { nom: 'poteau-2', colonnes: [[3, 10]], dessin: poteau },
  ],
  'maths-6e-calculation': [
    { nom: 'boulier-1', colonnes: [7, 8, 9, 10, 11].map((x) => [x, 2] as const), dessin: boulier },
    { nom: 'boulier-2', colonnes: [7, 8, 9, 10, 11].map((x) => [x, 4] as const), dessin: boulier },
    { nom: 'borne', colonnes: [[3, 9]], dessin: borneDeBrique },
  ],
  'maths-6e-fractions': [
    {
      nom: 'mare',
      colonnes: [
        [8, 3],
        [9, 3],
        [8, 4],
        [9, 4],
      ],
      dessin: mare,
    },
    ...(
      [
        [7, 2],
        [10, 5],
        [7, 5],
        [1, 10],
      ] as const
    ).map(([x, y]) => ({ nom: `galets@${x},${y}`, colonnes: [[x, y] as const], dessin: galets })),
  ],
  'maths-6e-decimals': [
    { nom: 'volcan', colonnes: [8, 9, 10].flatMap((x) => [3, 4, 5].map((y) => [x, y] as const)), dessin: volcan },
    { nom: 'eclats-1', colonnes: [[3, 9]], dessin: eclats },
    { nom: 'eclats-2', colonnes: [[1, 10]], dessin: eclats },
  ],
  'english-6e-vocabulary': [
    { nom: 'cabine', colonnes: [[9, 3]], dessin: cabine },
    { nom: 'reverbere', colonnes: [[11, 5]], dessin: reverbere },
    { nom: 'caisse', colonnes: [[3, 9]], dessin: caisseDeCabine },
  ],
  'english-6e-grammar': [
    { nom: 'horloge', colonnes: [[9, 3]], dessin: horloge },
    {
      nom: 'rouage',
      colonnes: [
        [3, 9],
        [4, 9],
      ],
      dessin: rouage,
    },
  ],
  'history-6e-antiquity': [
    {
      nom: 'mosaique',
      colonnes: [
        [9, 3],
        [10, 3],
      ],
      dessin: solDeMosaique,
    },
    { nom: 'tas-de-fouille', colonnes: [[3, 9]], dessin: petitTas(true) },
  ],
  'geography-6e-living': [
    {
      nom: 'chaume',
      colonnes: [
        [9, 3],
        [10, 3],
      ],
      dessin: bottesDeChaume,
    },
    { nom: 'borne', colonnes: [[1, 10]], dessin: borneDePierre },
  ],
  'life-earth-sciences-6e-living-world': [
    {
      nom: 'fougeres',
      colonnes: [
        [9, 3],
        [10, 3],
      ],
      dessin: fougeres,
    },
  ],
  'physics-chemistry-6e-matter-energy': [
    {
      nom: 'galets',
      colonnes: [
        [9, 3],
        [10, 3],
      ],
      dessin: tasDeGalets,
    },
  ],
  'technology-6e-objects': [{ nom: 'cartons', colonnes: [[9, 3]], dessin: cartons }],
  'civics-6e-democratic-society': [{ nom: 'craie', colonnes: [[9, 3]], dessin: craie }],
};

/** Le nombre de cubes que le décor d'une île pose dans chaque colonne de sa grille (sans les arbres, nommés). */
const posesParColonne = new Map<BiomeId, Map<string, number>>();
function posesDe(id: BiomeId): Map<string, number> {
  let out = posesParColonne.get(id);
  if (out) return out;
  out = new Map();
  const m = out;
  DECOR[id](
    (x, y, _z, _color, decor) => {
      if (decor) return;
      const k = `${x},${y}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    },
    () => 0,
  );
  posesParColonne.set(id, out);
  return out;
}

const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** Le cube compte-t-il parmi le décor du cœur de son île (ni sol, ni décor du paysage, ni borne, lieu, liaison, petite construction) ? */
const duCoeur = (c: VoxelCube) => !c.ghost && !c.sol && !c.decor && !c.quest && !c.place && !c.bridge && !c.petiteConstruction;

/**
 * Les ensembles du décor du cœur de ce monde que le kit d'Archipéo dessine (`Kit.objetsDessines`, au 6e) : chacun comme
 * un modèle importé qui remplace ses cubes (le toucher retrouve ses cases). `null` dans les autres archipels.
 */
export function coeursDessines(a: ArchipelagoId, cubes: readonly VoxelCube[]): ImportedMonument[] {
  const out: ImportedMonument[] = [];
  const iles = BIOMES.filter((b) => b.classe === a && COEURS_DU_6E[b.id]);
  if (!iles.length) return out;
  const ids = new Set<string>(iles.map((b) => b.id));
  const parColonne = new Map<string, VoxelCube[]>();
  const batiments = batimentsDe(a);
  const cours = coursDe(a);
  for (const c of cubes) {
    if (!c.tag || !ids.has(c.tag) || !duCoeur(c)) continue;
    const k = cle(c.x, c.y, c.z);
    if (batiments.has(k) || cours.has(k)) continue;
    const kc = `${c.tag}|${c.x},${c.y}`;
    const l = parColonne.get(kc);
    if (l) l.push(c);
    else parColonne.set(kc, [c]);
  }
  for (const b of iles) {
    const o = origineDe(b.id);
    const q = islandDef(b.id).quarts;
    const poses = posesDe(b.id);
    for (const ens of COEURS_DU_6E[b.id] ?? []) {
      const ax = Math.min(...ens.colonnes.map(([x]) => x));
      const ay = Math.min(...ens.colonnes.map(([, y]) => y));
      const siens: { x: number; y: number; cubes: VoxelCube[] }[] = [];
      let complet = true;
      for (const [x, y] of ens.colonnes) {
        const t = turnCell(LAYOUT_PAD.x + x, LAYOUT_PAD.y + y, q);
        const l = parColonne.get(`${b.id}|${o.x + t.x},${o.y + t.y}`) ?? [];
        if (l.length !== (poses.get(`${x},${y}`) ?? 0) || !l.length) complet = false;
        siens.push({ x: x - ax, y: y - ay, cubes: l });
      }
      if (!complet) continue;
      const tous = siens.flatMap((s) => s.cubes);
      const base = Math.min(...tous.map((c) => c.z));
      const sols = new Map(siens.map((s) => [`${s.x},${s.y}`, Math.min(...s.cubes.map((c) => c.z)) - base]));
      const ensemble: EnsembleDuCoeur = {
        cases: siens.flatMap((s) => s.cubes.map((c) => ({ x: s.x, y: s.y, z: c.z - base, texture: c.texture ?? '' }))),
        sol: (x, y) => sols.get(`${x},${y}`) ?? 0,
      };
      const versLeMonde = (x: number, y: number, z: number): V3 => {
        const p = turnPoint(LAYOUT_PAD.x + ax + x, LAYOUT_PAD.y + ay + y, q);
        return [o.x + p.x, base + z, o.y + p.y];
      };
      // Rien ne s'allume au cœur : le feu est dans l'opaque.
      const at = new Atelier(new Pinceau(), null, versLeMonde);
      ens.dessin(at, peintureDe(a, b.id, tous.some((c) => c.muted)), ensemble);
      out.push({
        id: `coeur:${b.id}:${ens.nom}`,
        stage: 1,
        opaque: at.opaque.fin(),
        fire: new Pinceau().fin(),
        halo: null,
        cellules: tous.map((c) => ({ x: c.x, y: c.y, z: c.z })),
        replaced: new Set(tous.map((c) => cle(c.x, c.y, c.z))),
      });
    }
  }
  return out;
}
