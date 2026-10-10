// La construction taillée d'Archipéo (lot R5 de la piste Rendu, docs/univers/archipeo/cadrage.md) : les bâtiments
// des plans, les ouvrages, les monuments, l'école et la salle des trophées, les objets du quai et le décor du cœur, en
// blocs de pierre taillée. Code pur, sans Three.js : il lit les cubes restés en cubes après le décor (`rangerLeDecor`,
// posés par `poseDuDecor`) et les cubes du sol, et rend trois groupes de tableaux typés, trois appels de dessin :
//
// - `opaque` : les blocs, en couleurs par sommet (la palette de l'archipel, de jour ; la nuit vient de la lumière de
//   la scène). Les faces coplanaires d'une même couleur sont fusionnées en rectangles (fusion gloutonne par plan, par
//   sens et par couleur) ; chaque bloc garde sa teinte, à ± `TEINTE` de luminosité, que le shader tire de sa case
//   (`TEINTE_GLSL` sur `floor(position - normal * 0.25)`, ou l'attribut `teintes` pour un bloc hors de la grille) : la
//   fusion ne l'efface pas ; un bloc lissé (au 6e, ./architecture/volumes.ts) prend celle de son volume, une seule
//   d'une case à l'autre. Le biseau des arêtes saillantes (celles où deux faces visibles d'un bloc se rencontrent) est
//   peint par défaut : l'attribut `biseaux` donne la distance aux bords saillants de chaque rectangle, et le shader
//   incline la normale sur une bande de `BISEAU` case, sans un triangle de plus. Le biseau taillé en géométrie (bandes,
//   coins, petits triangles qui ferment un bout contre un bloc sans biseau) reste une option : il triple les triangles.
// - `fantomes` : les cubes d'un plan encore à poser, sans biseau, toutes leurs faces (un fantôme ne cache rien),
//   fusionnées par plan ; leurs uv sont leurs coordonnées sur le plan, en cases : le shader dessine l'arête fine de
//   chaque case là où elles sont entières (`ARETE_FANTOME`).
// - `fenetres` : ce qui s'allume la nuit. Les vitres (une lanterne ou un verre pris dans un mur) sont sombres le jour ;
//   les lanternes des cours, des comptoirs et des toits gardent leur couleur de lanterne. La nuit, toutes prennent la
//   lueur `LUEUR`, chacune à son moment (`eclatDeFenetre`, un décalage par sommet) ; au plus `FENETRES_ALLUMEES` vitres
//   par bâtiment, aucune sur une île fermée.
//
// Le phare de Grimoire (6e, décision 16) : chaque étape finie de son plan laisse la place à une pièce du phare de
// référence (world/decor/lighthouse.ts), en facettes peintes dans l'opaque (sa lanterne dans les fenêtres).
// Le phare du large (5e, revue d'ensemble du directeur artistique, DA-4) : fini, le monument laisse la place à sa tour
// ronde de pierre à feu ouvert (./offshoreLighthouse.ts), dans l'opaque (son feu dans les fenêtres).
// Les monuments importés (./monumentModels.ts, chargés à la demande) : l'étape de chantier que suit l'avancée du plan
// remplace les cubes posés, dans l'opaque (le feu du phare du large fini dans les fenêtres) ; les fantômes restent.
// Chargé, le phare du large importé prend la place de son modèle taillé.
//
// L'architecture modulaire (lot 7, ./architecture/) : un bloc posé d'un plan d'île dont le kit de l'archipel peint le
// mur garde sa géométrie et sa fusion, avec un motif par face (le colombage, le bardage, le soubassement, le chaperon,
// peints par le shader : l'attribut `motifs`) ; un bloc dont le kit dessine la pièce (un toit en pente, des pilotis)
// laisse sa case à cette pièce, assemblée (./architecture/assembly.ts) et peinte dans l'opaque, à la fin. Seul le kit
// des Premiers Rivages est rempli (lot 7b) : ailleurs, rien n'est remplacé. L'école, la salle des trophées et la Halle aux
// matériaux de ce kit le prennent aussi (`caseDuLieu`) ; les monuments gardent leurs blocs taillés.
//
// Le toucher : la géométrie reste dans la case de son bloc (le biseau ne fait que rogner). `caseDeLaConstruction`
// redonne la case touchée et la case devant la face, pour une face, un biseau ou un coin ; `caseDeLaPiece`, la case
// sous un modèle qui remplace des cubes : la case de la pièce d'architecture (toute la case, par la table triangle →
// case), ou la case du plan la plus proche sous le phare.
//
// Un maillage par île (`construireParIle`) : poser un bloc ne refait que son île ; les îles sont mises bout à bout dans
// les trois groupes.
//
// Ce fichier garde le maillage et les bornes ; à côté, dans ./construction/ : les réglages de l'intention et les couleurs
// des rôles (`settings.ts`), ce que le shader reprend (`shader.ts`), le genre des blocs (`kinds.ts`), le phare de
// Grimoire (`lighthouse.ts`), les bâtiments et les lieux que le kit reprend (`buildings.ts`). Il en réexporte les noms publics.
import type { Cell } from './view';
import { apartFromGhost, architectureDe, assemblerLesPieces, crystal, ingot, type Kit, KITS, MOTIF, motifDesRangees, RANGEES, rangeesReunies, RESTING_HEIGHT } from './architecture';
import type { VoxelCube } from '../Voxel';
import { ambianceDe, type Couleur, couleurDeMatiere, type Faces, MATIERES } from './palette';
import { DELAVE, eclaircir, type FacettesDuDecor, hex, Pinceau, rgb } from './decor/brush';
import { lineaire } from './landMesh';
import type { ArchipelagoId } from './map';
import { dessinerPont, FANTOME_DU_PONT, pontsDePierreEtDeBois } from './bridges';
import { dessinerPhareDuLarge, hublotsDuPhareDuLarge, PHARE_DU_LARGE, phareDuLarge } from './offshoreLighthouse';
import { getImportedMonuments, type ImportedMonument, monumentsVersion } from './monumentModels';
import { estUnePlaceDeTrophee } from './trophyHall';
import { mixColor } from './daylight';
import { couleursDuToit, toitDe } from './roofs';
import type { TextureKind } from './pixels';
import { dessinerPhare } from './decor/lighthouse';
import { CREME_DU_PHARE, phareDeGrimoire } from './construction/lighthouse';
import { cle, decalagesDe, genresDesBlocs } from './construction/kinds';
import { allumesALaFin } from './construction/endGlow';
import { type BlocAssemble, MOTIF_ASSEMBLE, SANS_BISEAU, teinteDeCase } from './construction/shader';
import { BISEAU, BLOC_EN_RETRAIT, couleurDuRole, FANTOME, LANTERNE, PROFONDEUR, RANG_DES_SOCLES, TOILE_DU_NAVIRE, TROPHEE, VERRE_HORS_MUR, VITRE_DE_JOUR } from './construction/settings';
import { batimentsDe, blocsDArchipeoDe, caseDuLieu, coursDe, enBlocsDArchipeo } from './construction/buildings';
export { ALLUMAGE, ARETE, ARETE_DU_VERRE, ARETE_FANTOME, BISEAU, couleursDesRoles, DECALAGE_MAX, ECART_SOMBRE, ECLAT_DU_BISEAU, FANTOME, FENETRES_ALLUMEES, LANTERNES_ALLUMEES, LUEUR, PLEINE_NUIT, TEINTE, TROPHEE, VITRE_DE_JOUR } from './construction/settings';
export { BISEAU_GLSL, type BlocAssemble, detailDuMotif, ECLAT_GLSL, eclatDeFenetre, eclatDuBiseau, MOTIF_ASSEMBLE, MOTIF_ASSEMBLE_DEBUT, MOTIF_ASSEMBLE_GLSL, opaciteDesFantomes, SANS_BISEAU, TEINTE_GLSL, teinteDeCase } from './construction/shader';
export { genresDesBlocs } from './construction/kinds';
export { CREME_DU_PHARE, phareDeGrimoire } from './construction/lighthouse';
export { batimentsDe, blocsDArchipeoDe, caseDuLieu, coursDe, enBlocsDArchipeo, ETAPES_DU_BATIMENT, etapesDe, sansToursDuCoeur } from './construction/buildings';

// ---------- Le maillage ----------

/** Les trophées précieux (./architecture/precious.ts), faits une fois. */
const INGOT = ingot();
const CRYSTAL = crystal();

/** Un groupe de la construction : un appel de dessin. Repère Three (X = x, Y = hauteur, Z = y). */
export interface GroupeDeConstruction {
  positions: Float32Array;
  normals: Float32Array;
  /** Couleurs par sommet, dans l'espace linéaire de Three.js (vides pour les fantômes : une couleur unie). */
  colors: Float32Array;
  indices: Uint32Array;
}

interface GroupeDesFenetres extends GroupeDeConstruction {
  /** Par sommet : le décalage d'allumage (0 à `DECALAGE_MAX`), négatif pour une fenêtre qui ne s'allume jamais. */
  decalages: Float32Array;
}

interface GroupeDesFantomes extends GroupeDeConstruction {
  /** Par sommet : ses coordonnées sur le plan de sa face, en cases (l'arête d'une case est là où elles sont entières). */
  uvs: Float32Array;
}

interface GroupeOpaque extends GroupeDeConstruction {
  /**
   * Le biseau peint (mode `peint`) : par sommet, quatre distances (en cases) du sommet aux quatre bords de son rectangle,
   * côté u−, u+, v−, v+ (les axes du plan de la face, selon sa normale : X donne (Z, Y), Y donne (X, Z), Z donne (X, Y)), ou `SANS_BISEAU` pour un bord qui n'est pas une arête saillante. Vide dans
   * les autres modes.
   */
  biseaux: Float32Array;
  /**
   * Par sommet : 0 pour un bloc sur la grille (le shader tire sa teinte de sa case), sinon la teinte du bloc
   * (`teinteDeCase` de sa case d'origine) : un objet du quai descendu d'une fraction de bloc au bas de sa pente
   * (`poseDuDecor`) chevauche deux cases, et garderait sinon deux teintes.
   */
  teintes: Float32Array;
  /** Par sommet : 1 sur le verre hors d'un mur, que le shader cerne d'une arête par case (`ARETE_DU_VERRE`), sinon 0. */
  aretes: Float32Array;
  /**
   * Par sommet : le motif peint (0 : aucun). Celui d'un mur ou d'une pièce d'architecture (./architecture/paint.ts,
   * `MOTIF`, en bits, sous `MOTIF_ASSEMBLE_DEBUT`) : le shader y peint le colombage, le bardage, le soubassement et le
   * chaperon. Celui d'un bloc assemblé (GD-2, `MOTIF_ASSEMBLE`, à partir de `MOTIF_ASSEMBLE_DEBUT`) : le shader y peint
   * sa forme (`MOTIF_ASSEMBLE_GLSL`). Ni l'un ni l'autre n'ajoute un triangle.
   */
  motifs: Float32Array;
}

/** Des triangles de l'opaque (de, à) qui remplacent des cases : les cases de chaque triangle, pour le toucher. */
interface TrancheDesPieces {
  opaque: [number, number];
  /**
   * Les cases du triangle `de + i`, de `cases[6i..6i + 2]` à `cases[6i + 3..6i + 5]` (x, y, z) : une case, ou une
   * rangée de pièces dessinées d'un tenant (le toucher prend la case de la rangée sous le point touché).
   */
  cases: Int32Array;
}

export interface MaillageDeLaConstruction {
  opaque: GroupeOpaque;
  fantomes: GroupeDesFantomes;
  fenetres: GroupeDesFenetres;
  /**
   * Le phare de Grimoire, s'il a une pièce : ses triangles dans l'opaque et dans les fenêtres (de, à : indices de
   * triangles), et les cases qu'il remplace, pour que le toucher les retrouve (`caseDeLaPiece`).
   */
  phare?: { opaque: [number, number]; fenetres: [number, number]; cellules: Cell[] };
  /**
   * Les ponts de pierre et de bois du 5e (./bridges.ts) : leur tranche du groupe opaque (triangles), une par île (mis bout
   * à bout, les îles en donnent plusieurs).
   */
  ponts?: { opaque: [number, number] }[];
  /** Le phare du large du 5e (./offshoreLighthouse.ts), fini : comme `phare`, ses triangles et les cases du monument. */
  phareDuLarge?: { opaque: [number, number]; fenetres: [number, number]; cellules: Cell[] };
  /** Les pièces d'architecture (./architecture/) : leurs triangles de l'opaque et la case de chacun, une tranche par île. */
  pieces?: TrancheDesPieces[];
  /** Les monuments importés (./monumentModels.ts) : comme `phare`, leurs triangles et les cases posées qu'ils remplacent. */
  monuments?: { opaque: [number, number]; fenetres: [number, number]; cellules: Cell[]; halo?: HaloDuFeu }[];
}

/** Le halo d'un feu allumé la nuit (repère Three) : son centre et son côté ; un sprite additif, fixe (three/construction.ts). */
interface HaloDuFeu {
  centre: [number, number, number];
  cote: number;
}

export interface OptionsDeLaConstruction {
  /**
   * Le biseau des arêtes saillantes : `peint` (par défaut : le shader incline la normale sur une bande de `largeur` le
   * long des arêtes saillantes, sans un triangle de plus), `taille` (en géométrie : bandes, coins et bouts ; trop cher
   * pour un archipel, gardé pour un petit modèle comme la Nef), `aucun`.
   */
  biseau?: 'peint' | 'taille' | 'aucun';
  /** La largeur du biseau, en part de case. */
  largeur?: number;
  /** Fusionner les faces coplanaires d'une même couleur (sinon une face par bloc). */
  fusion?: boolean;
  /** Dessiner aussi les bornes (sinon elles sont laissées au poste « Bornes », instanciées à part). */
  bornes?: boolean;
  /** Les cubes de la Nef : sa toile prend le crème Brume (et rien n'y devient pièce d'architecture). */
  navire?: boolean;
  /** Le kit d'architecture (lot 7, ./architecture/kits/) : par défaut, celui de l'archipel. */
  kit?: Kit;
  /**
   * Le sol entier, case par case, quand `sol` n'en donne qu'une partie (`construireParIle` ne passe à une île que le
   * sol sous ses blocs) : les pilotis cherchent le sol jusqu'à `PROFONDEUR` cases plus bas, pas seulement juste dessous.
   */
  solEntier?: (x: number, y: number, z: number) => VoxelCube | undefined;
}

type V3 = [number, number, number];

/** Les six directions, en coordonnées de grille (z : hauteur). */
const DIRS: V3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

const HAUT = 4;

const BAS = 5;

const axeDe = (d: number) => d >> 1;

const signeDe = (d: number) => (d & 1 ? -1 : 1);

const dir = (axe: number, signe: number) => axe * 2 + (signe > 0 ? 0 : 1);

/**
 * Les vitres et les lanternes d'un monde, et leur décalage d'allumage ; `lueur` : le bloc d'un grand projet fini, qui prend
 * la lueur de fin (./construction/endGlow.ts), allumé le premier.
 */
export type FenetresDuMonde = Map<VoxelCube, { genre: 'vitre' | 'lanterne' | 'lueur'; decalage: number }>;

/**
 * Les vitres et les lanternes d'un monde, avec leur décalage d'allumage (négatif : jamais allumée), selon le même
 * `eclatDeFenetre` que la 3D : les tests de l'allumage le comparent au maillage. Les bornes n'en ont pas, ni les cases que le phare de
 * Grimoire remplace en 3D.
 */
export function fenetresDe(cubes: VoxelCube[], imported: readonly ImportedMonument[] = getImportedMonuments(cubes)): FenetresDuMonde {
  // Les cases que le phare de Grimoire remplace en 3D ne s'allument pas (sa lanterne est à lui).
  const phare = phareDeGrimoire(cubes);
  // Ni celles qu'un monument importé remplace (./monumentModels.ts) ; `imported` : déjà calculés, pour ne pas les refaire.
  const importedCells = new Set(imported.flatMap((m) => [...m.replaced]));
  const genres = genresDesBlocs(cubes.filter((c) => !c.quest && !c.sol && !phare?.remplacees.has(cle(c.x, c.y, c.z)) && !importedCells.has(cle(c.x, c.y, c.z))));
  const decalages = decalagesDe(genres);
  const out: FenetresDuMonde = new Map();
  // La lueur de fin d'un grand projet ; celle du phare du large est à son modèle (son feu).
  const large = phareDuLarge(cubes).remplacees;
  const allumes = allumesALaFin(cubes.filter((c) => !c.quest && !large.has(cle(c.x, c.y, c.z)) && !importedCells.has(cle(c.x, c.y, c.z))));
  for (const [c, g] of genres) {
    if (allumes.has(c)) out.set(c, { genre: 'lueur', decalage: 0 });
    else if (g === 'vitre' || g === 'lanterne') out.set(c, { genre: g, decalage: decalages.get(c) ?? -1 });
  }
  return out;
}

/** Un groupe en cours de remplissage. */
class Remplissage {
  pos: number[] = [];
  nor: number[] = [];
  col: number[] = [];
  idx: number[] = [];
  extra: number[] = [];
  uv: number[] = [];
  bis: number[] = [];
  tei: number[] = [];
  are: number[] = [];
  mot: number[] = [];
  /** Un polygone convexe (3 ou 4 sommets), tourné vers `n` (coordonnées de grille), et ses attributs par sommet. */
  poly(pts: V3[], n: V3, couleurs: Couleur[] | null, attr: { extra?: number; uvs?: [number, number][]; biseaux?: number[][]; teinte?: number; arete?: number; motif?: number } = {}): void {
    const { extra, uvs, biseaux, teinte, arete = 0, motif = 0 } = attr;
    // Le sens : la normale du polygone doit suivre `n`.
    const [a, b, c] = pts;
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    // En grille, (x, y, z) → Three (x, z, y) inverse le sens : on compare dans le repère de grille, puis on inverse.
    const direct = cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] > 0;
    const ordre = pts.map((_, i) => i);
    if (direct) ordre.reverse();
    const base = this.pos.length / 3;
    const len = Math.hypot(n[0], n[1], n[2]);
    for (const i of ordre) {
      const p = pts[i];
      this.pos.push(p[0], p[2], p[1]);
      this.nor.push(n[0] / len, n[2] / len, n[1] / len);
      if (couleurs) {
        const k = rgb(couleurs[i]);
        this.col.push(lineaire(k[0] / 255), lineaire(k[1] / 255), lineaire(k[2] / 255));
      }
      if (extra !== undefined) this.extra.push(extra);
      if (uvs) this.uv.push(uvs[i][0], uvs[i][1]);
      if (biseaux) this.bis.push(...biseaux[i]);
      if (teinte !== undefined) this.tei.push(teinte);
      this.are.push(arete);
      this.mot.push(motif);
    }
    for (let i = 1; i + 1 < pts.length; i++) this.idx.push(base, base + i, base + i + 1);
  }
  /**
   * Des facettes déjà tracées (le phare, world/decor/lighthouse.ts) : repère Three, couleurs linéaires, trois sommets par
   * triangle ; `nuit` : prendre leurs couleurs de nuit. Rend l'intervalle de leurs triangles.
   */
  facettes(f: FacettesDuDecor, attr: { extra?: number; biseaux?: boolean; teinte?: number }): [number, number] {
    const t0 = this.idx.length / 3;
    const base = this.pos.length / 3;
    const n = f.positions.length / 3;
    for (let i = 0; i < n; i++) {
      this.pos.push(f.positions[3 * i], f.positions[3 * i + 1], f.positions[3 * i + 2]);
      this.nor.push(f.normals[3 * i], f.normals[3 * i + 1], f.normals[3 * i + 2]);
      this.col.push(f.colors[3 * i], f.colors[3 * i + 1], f.colors[3 * i + 2]);
      if (attr.extra !== undefined) this.extra.push(attr.extra);
      if (attr.biseaux) this.bis.push(SANS_BISEAU, SANS_BISEAU, SANS_BISEAU, SANS_BISEAU);
      if (attr.teinte !== undefined) this.tei.push(attr.teinte);
      this.are.push(0);
      this.mot.push(0);
      this.idx.push(base + i);
    }
    return [t0, this.idx.length / 3];
  }
  fin(): GroupeDeConstruction {
    return {
      positions: Float32Array.from(this.pos),
      normals: Float32Array.from(this.nor),
      colors: Float32Array.from(this.col),
      indices: Uint32Array.from(this.idx),
    };
  }
}

/**
 * La construction d'un archipel : trois groupes (voir l'en-tête). `cubes` : les cubes restés en cubes (sans le sol ni
 * le décor en primitives), posés par `poseDuDecor` ; `sol` : les cubes du sol, qui cachent le dessous d'un bloc posé
 * dessus. Les couleurs sont celles de la palette, de jour.
 */
export function maillageDeLaConstruction(
  a: ArchipelagoId,
  cubes: VoxelCube[],
  sol: VoxelCube[] = [],
  options: OptionsDeLaConstruction = {},
): MaillageDeLaConstruction {
  // Les blocs qui changent dans Archipéo (le toit de terre cuite de la maison basse du quartier, DA, retouches HG-2).
  if (!options.navire && !options.kit) cubes = enBlocsDArchipeo(a, cubes);
  const mode = options.biseau ?? 'peint';
  const b = mode === 'aucun' ? 0 : (options.largeur ?? BISEAU);
  /** Les faces rentrent sous le biseau taillé ; le biseau peint ne change pas la géométrie. */
  const retrait = mode === 'taille' ? b : 0;
  const fusion = options.fusion ?? true;
  // Le phare de Grimoire : ses étapes finies laissent la place au modèle (dessiné à la fin).
  const phare = options.navire ? null : phareDeGrimoire(cubes, a);
  // Les ponts de pierre et de bois du 5e : un pont construit laisse la place à son modèle (./bridges.ts).
  const ponts = options.navire ? null : pontsDePierreEtDeBois(cubes);
  // Les monuments importés (./monumentModels.ts), chargés : l'étape du chantier remplace les cubes posés.
  const imported = options.navire ? [] : getImportedMonuments(cubes);
  const importedCells = new Set(imported.flatMap((m) => [...m.replaced]));
  // Le phare du large du 5e : ses pièces finies laissent la place à son modèle (./offshoreLighthouse.ts), sauf s'il est importé.
  const large = options.navire || imported.some((m) => m.id === PHARE_DU_LARGE) ? null : phareDuLarge(cubes);
  const byModel = (c: VoxelCube) => {
    const k = cle(c.x, c.y, c.z);
    return Boolean(phare?.remplacees.has(k) || ponts?.remplacees.has(k) || large?.remplacees.has(k) || importedCells.has(k));
  };
  // La lueur de fin d'un grand projet (./construction/endGlow.ts) : ses blocs restent des blocs, dans les fenêtres.
  const allumes = options.navire ? new Set<VoxelCube>() : allumesALaFin(cubes.filter((c) => !c.quest && !byModel(c)));
  // L'architecture modulaire (lot 7) : le voisinage se lit sur le plan entier (tous les cubes, fantômes compris) ; les
  // cases déjà prises par un modèle restent au modèle, et celles du phare de Grimoire en chantier à leur bloc. Seuls les
  // plans des îles prennent le kit de l'archipel (un kit passé à la main, celui d'un test, prend tout le plan).
  const kit = options.kit ?? KITS[a];
  // Les blocs en retrait de leur case (`Kit.insetBlocks`, au 3e les lanternons du château d'eau), posés : chacun à part.
  const enRetrait = new Set<VoxelCube>();
  if (!options.navire && kit.insetBlocks) for (const c of cubes) if (!c.ghost && !c.quest && !byModel(c) && kit.insetBlocks(c)) enRetrait.add(c);
  // Sur le vide : rien de solide sous la case jusqu'à l'eau, ou jusqu'au large (`PROFONDEUR` cases plus bas) ; les pilotis.
  const solides = new Map<string, VoxelCube>();
  for (const c of [...cubes, ...sol]) if (!c.ghost && !c.quest) solides.set(cle(c.x, c.y, c.z), c);
  const solide = (x: number, y: number, z: number) => {
    const s = solides.get(cle(x, y, z)) ?? options.solEntier?.(x, y, z);
    return s && !s.ghost && !s.quest ? s : undefined;
  };
  const surLeVide = (x: number, y: number, z: number) => {
    for (let k = 1; k <= PROFONDEUR; k++) {
      const s = solide(x, y, z - k);
      if (s) return s.texture === 'eau';
    }
    return true;
  };
  const archi = options.navire
    ? null
    : architectureDe(a, cubes, {
        exclure: (c) => byModel(c) || allumes.has(c) || enRetrait.has(c) || Boolean(phare?.enCours.has(cle(c.x, c.y, c.z))),
        kit,
        batiments: options.kit ? undefined : batimentsDe(a),
        cours: options.kit ? undefined : coursDe(a),
        toitures: options.kit ? undefined : blocsDArchipeoDe(a),
        surLeVide,
        caseDuLieu,
      });
  const avantLesPieces = cubes.filter((c) => (options.bornes || !c.quest) && !byModel(c));
  const dessines = archi?.remplacees.size ? avantLesPieces.filter((c) => !archi.remplacees.has(cle(c.x, c.y, c.z))) : avantLesPieces;
  // Le genre des blocs se lit avant les pièces : une vitre prise entre deux pièces de mur reste une vitre.
  const genres = genresDesBlocs(avantLesPieces);
  const decalages = decalagesDe(genres);
  // La lueur de fin : comme une vitre, allumée la première (le décalage 0), sans compter parmi les vitres d'un bâtiment.
  for (const c of allumes) {
    genres.set(c, 'vitre');
    decalages.set(c, 0);
  }
  // Les trophées de la salle des trophées, quand le kit de l'archipel reprend la salle (au 6e, la halle en colombage ;
  // les autres archipels avec leur kit, lot 7c) : plus petits que leur case (`TROPHEE`), et le rang de chacun.
  const trophees = new Map<VoxelCube, number>();
  if (archi && kit.lieux?.trophies)
    for (const c of dessines) {
      if (c.place !== 'trophies' || c.ghost) continue;
      const m = caseDuLieu(c);
      if (m && estUnePlaceDeTrophee(m.x, m.y, m.z)) trophees.set(c, m.z);
    }
  // Un fantôme ne cache rien, ni une lanterne ni un trophée (ils ne remplissent plus leur case).
  const plein = new Map<string, VoxelCube>();
  for (const c of dessines) if (!c.ghost && genres.get(c) !== 'lanterne' && !trophees.has(c) && !enRetrait.has(c)) plein.set(cle(c.x, c.y, c.z), c);
  const sous = new Set(sol.map((c) => cle(c.x, c.y, c.z)));

  // Les couleurs d'un bloc, de jour.
  const vues = new Map<string, Faces>();
  /** Une case posée du phare de Grimoire, dans une étape pas encore finie : du crème, au lieu du verre provisoire. */
  const cremeDuPhare = (c: VoxelCube) => c.texture === 'verre' && phare !== null && phare.enCours.has(cle(c.x, c.y, c.z));
  /** Le mur peint d'un bloc (lot 7), s'il en est un. */
  const peintDe = (c: VoxelCube) => (archi?.peints.size ? archi.peints.get(cle(c.x, c.y, c.z)) : undefined);
  const couleursDe = (c: VoxelCube): Faces => {
    // Un bloc de la lueur de fin garde sa matière le jour (la nuit, la lueur).
    const g = allumes.has(c) ? 'bloc' : genres.get(c);
    const fond = peintDe(c)?.peinture.fond ?? '';
    // Un toit prend la couverture de son île ; un bloc d'un lieu aussi, quand le kit le dit (le toit de la salle des trophées).
    const couvert = c.texture === 'toit' || Boolean(c.place && archi?.couverts.has(cle(c.x, c.y, c.z)));
    // Un bloc d'un lieu peut prendre la couleur d'une autre matière (la souche du clocheton, en pierre de taille).
    const repeint = c.place ? archi?.matieres.get(cle(c.x, c.y, c.z)) : undefined;
    // Dans un volume lissé (et seulement là), le dessus prend le milieu entre le dessus et les côtés de sa matière
    // (décision du directeur artistique, 8 octobre 2026), même d'une seule case (le sable des angles du moulin) : les
    // pièces dessinées (le bac « pièce seule ») et les bâtiments des plans gardent la convention dessus clair, côtés
    // plus sombres.
    const k0 = cle(c.x, c.y, c.z);
    const lisse = Boolean(archi?.lisses.size && archi.lisses.has(k0) && !archi.remplacees.has(k0));
    const k = `${repeint ?? ''}|${c.texture ?? ''}|${c.color}|${c.top ?? ''}|${c.muted ? 1 : 0}|${couvert ? `toit:${c.tag}` : ''}|${g}|${cremeDuPhare(c) ? 1 : 0}|${fond}|${lisse ? 1 : 0}`;
    let f = vues.get(k);
    if (f) return f;
    const delave = (x: Faces): Faces => (c.muted ? { dessus: mixColor(x.dessus, DELAVE[0], DELAVE[1]), cote: mixColor(x.cote, DELAVE[0], DELAVE[1]) } : x);
    const role = fond === 'remplissage' || fond === 'bardage' || fond === 'soubassement' || fond === 'tole' || fond === 'galon' || fond === 'braise' || fond === 'masonry' ? couleurDuRole(a, kit, fond, c.muted) : null;
    if (role !== null) f = { dessus: role, cote: role };
    else if (repeint) f = delave(couleurDeMatiere(a, repeint));
    else if (couvert) {
      // Les toits enneigés du bâti (au 3e, `Kit.snowyRoofs`) : le dessus de l'ardoise dans la neige du kit, tenue à 70 du
      // fantôme (le voile de l'archipel l'en rapproche).
      const t = couleursDuToit(a, c.tag, c.muted);
      f = kit.snowyRoofs && toitDe(c.tag) === 'ardoise' ? { dessus: apartFromGhost(couleurDuRole(a, kit, 'snow', c.muted)), cote: t.cote } : t;
    }
    else if (g === 'bloc' && cremeDuPhare(c)) {
      const [teinte, force] = ambianceDe(a).voile;
      const creme = mixColor(CREME_DU_PHARE, teinte, force);
      f = delave({ dessus: creme, cote: eclaircir(creme, 0.9) });
    } else if (g === 'vitre') {
      const v = couleurDeMatiere(a, 'verre');
      f = delave({ dessus: eclaircir(v.dessus, VITRE_DE_JOUR), cote: eclaircir(v.cote, VITRE_DE_JOUR) });
    } else if (c.texture === 'verre') {
      // Le verre hors d'un mur (la tour du 6e, provisoire) : sous le voile, comme les matières ; ses côtés un peu plus sombres.
      const [teinte, force] = ambianceDe(a).voile;
      const v = mixColor(VERRE_HORS_MUR, teinte, force);
      f = delave({ dessus: v, cote: eclaircir(v, 0.92) });
    } else if (g === 'lanterne') {
      // Le corps d'une lanterne : du bois sombre (son cœur, éteint le jour, est dans les fenêtres).
      f = delave({ dessus: couleurDeMatiere(a, 'lambris').cote, cote: couleurDeMatiere(a, 'lambris').cote });
    } else if (c.texture === 'toile' && options.navire) {
      // Le crème Brume, sous le voile de l'archipel comme toutes les matières ; ses côtés un peu plus sombres.
      const [teinte, force] = ambianceDe(a).voile;
      const creme = mixColor(TOILE_DU_NAVIRE, teinte, force);
      f = delave({ dessus: creme, cote: eclaircir(creme, 0.9) });
    } else if (c.texture && c.texture in MATIERES) f = delave(couleurDeMatiere(a, c.texture as TextureKind));
    else {
      // Sans matière : sa couleur (déjà délavée si l'île est fermée), comme le décor.
      const x = hex(c.color);
      f = { dessus: c.top ? hex(c.top) : mixColor(x, 0xffffff, 0.12), cote: x };
    }
    if (lisse) f = { dessus: mixColor(f.dessus, f.cote, 0.5), cote: f.cote };
    // Une matière que le kit tient loin du fantôme Brume (au 5e : la glace, le sel, la toile ; le référent dys), qu'elle
    // soit celle du bloc ou celle qu'un lieu lui donne (au 3e, la souche du clocheton en pierre de taille).
    const texture = repeint ?? c.texture;
    if (role === null && !options.navire && texture !== undefined && kit.ghostApart?.some((t) => t === texture)) f = { dessus: apartFromGhost(f.dessus), cote: apartFromGhost(f.cote) };
    vues.set(k, f);
    return f;
  };
  const couleurDeFace = (c: VoxelCube, d: number) => (d === HAUT ? couleursDe(c).dessus : couleursDe(c).cote);

  /** Le bit, dans le masque `couvre` d'une pièce (./architecture/rooms.ts), de la face de sa case tournée vers `d`. */
  const FACE_DE_CASE = [1, 4, 2, 8, 16, 32];
  /** L'ordre des faces d'une peinture (./architecture/paint.ts : +x, +y, −x, −y, haut, bas) pour la direction `d`. */
  const FACE_PEINTE = [0, 2, 1, 3, 4, 5];
  /**
   * Le motif de la face `d` d'un bloc : celui d'un bloc assemblé (GD-2, `MOTIF_ASSEMBLE`, aucun sur une île fermée), sinon
   * celui de son mur peint, délavé sur une île fermée ; 0 hors d'un mur peint.
   */
  const motifDe = (c: VoxelCube, d: number) => {
    // Un mur peint d'abord : une poutre posée dans un monument est du colombage (la table commune) ; un bloc assemblé
    // seul (le bloc suspendu de la Halle) garde son motif.
    const peint = peintDe(c);
    if (!peint && c.texture && c.texture in MOTIF_ASSEMBLE && genres.get(c) === 'bloc') return c.muted ? 0 : MOTIF_ASSEMBLE[c.texture as BlocAssemble];
    const m = peint?.peinture.motifs[FACE_PEINTE[d]] ?? 0;
    return m && c.muted ? m | MOTIF.delave : m;
  };
  /**
   * La face `d` du bloc est-elle visible ? Un bloc plein la cache, ou une pièce d'architecture qui ferme la face de sa
   * case tournée vers lui ; le sol cache le dessous ; un fantôme ne cache rien.
   */
  const visible = (c: VoxelCube, d: number): boolean => {
    const [dx, dy, dz] = DIRS[d];
    const voisine = cle(c.x + dx, c.y + dy, c.z + dz);
    if (plein.has(voisine)) return false;
    if (archi?.couvre.size && ((archi.couvre.get(voisine) ?? 0) & FACE_DE_CASE[d ^ 1])) return false;
    if (d === BAS && sous.has(cle(c.x, c.y, c.z - 1))) return false;
    // Un toit caché sous un autre (le reste du kit) : son dessus n'est jamais vu.
    if (d === HAUT && archi?.sansDessus.size && archi.sansDessus.has(cle(c.x, c.y, c.z))) return false;
    return true;
  };
  /**
   * La teinte à porter par sommet : 0 sur la grille (le shader la calcule), celle de sa case d'origine hors de la grille ;
   * celle de la case d'ancrage de son volume pour un bloc lissé (./architecture/volumes.ts) : une seule teinte par
   * volume, sans joint d'une case à l'autre, et la fusion en fait un rectangle par face.
   */
  const teinteDe = (c: VoxelCube) => {
    const volume = archi?.lisses.size ? archi.lisses.get(cle(c.x, c.y, c.z)) : undefined;
    if (volume) return teinteDeCase(volume.ancre.x, volume.ancre.y, volume.ancre.z);
    return Number.isInteger(c.x) && Number.isInteger(c.y) && Number.isInteger(c.z) ? 0 : teinteDeCase(Math.floor(c.x), Math.floor(c.y), Math.floor(c.z));
  };
  const taille = (c: VoxelCube) => b > 0 && genres.get(c) === 'bloc';
  /** Le verre hors d'un mur porte une arête par case (dessinée par le shader), sauf peint en verrière (le kit). */
  const areteDe = (c: VoxelCube) => (c.texture === 'verre' && genres.get(c) === 'bloc' && !cremeDuPhare(c) && !peintDe(c) ? 1 : 0);
  /** L'arête entre les faces `d` et `e` d'un bloc est-elle biseautée ? */
  const biseaute = (c: VoxelCube, d: number, e: number) => taille(c) && visible(c, d) && visible(c, e);

  const O = new Remplissage();
  const F = new Remplissage();
  const G = new Remplissage();
  const groupeDe = (c: VoxelCube) => (genres.get(c) === 'bloc' ? O : F);
  const extraDe = (c: VoxelCube) => (genres.get(c) === 'bloc' ? undefined : decalages.get(c) ?? -1);

  /** Les deux axes du plan d'une face d'axe `k`, dans l'ordre. */
  const tangents = (k: number): [number, number] => (k === 0 ? [1, 2] : k === 1 ? [0, 2] : [0, 1]);
  const point = (k: number, plan: number, i: number, u: number, j: number, v: number): V3 => {
    const p: V3 = [0, 0, 0];
    p[k] = plan;
    p[i] = u;
    p[j] = v;
    return p;
  };

  /**
   * Un rectangle d'une face, de (uA, vA) à (uB, vB) sur son plan, ses bords saillants `r` (u−, u+, v−, v+) : rentré sous
   * le biseau taillé, ou avec les distances du biseau peint.
   */
  const rectangle = (
    R: Remplissage,
    d: number,
    plan: number,
    uA: number,
    uB: number,
    vA: number,
    vB: number,
    r: boolean[],
    col: Couleur,
    extra?: number,
    teinte?: number,
    arete = 0,
    motif = 0,
  ) => {
    const k = axeDe(d);
    const [i, j] = tangents(k);
    const u0 = uA + (r[0] ? retrait : 0);
    const u1 = uB - (r[1] ? retrait : 0);
    const v0 = vA + (r[2] ? retrait : 0);
    const v1 = vB - (r[3] ? retrait : 0);
    const coins: [number, number][] = [
      [u0, v0],
      [u1, v0],
      [u1, v1],
      [u0, v1],
    ];
    const peint = mode === 'peint' && R === O;
    const dist = (x: number, bord: boolean) => (bord ? x : SANS_BISEAU);
    R.poly(
      coins.map(([u, v]) => point(k, plan, i, u, j, v)),
      DIRS[d],
      [col, col, col, col],
      { extra, arete, motif, teinte: R === O ? teinte : undefined, biseaux: peint ? coins.map(([u, v]) => [dist(u - u0, r[0]), dist(u1 - u, r[1]), dist(v - v0, r[2]), dist(v1 - v, r[3])]) : undefined },
    );
  };

  /** Un rectangle de fantôme : ses uv sont ses coordonnées sur le plan, en cases (l'arête est là où elles sont entières). */
  const fantome = (d: number, plan: number, u0: number, u1: number, v0: number, v1: number) => {
    const k = axeDe(d);
    const [i, j] = tangents(k);
    const coins: [number, number][] = [
      [u0, v0],
      [u1, v0],
      [u1, v1],
      [u0, v1],
    ];
    G.poly(
      coins.map(([u, v]) => point(k, plan, i, u, j, v)),
      DIRS[d],
      null,
      { uvs: coins },
    );
  };

  /**
   * Le fantôme d'une case de pont à restaurer (./bridges.ts) : une boîte plus courte que la case le long du tracé et moins
   * haute, le haut au niveau du tablier, cernée sur tout son tour (ses uv vont de 0 à 1 sur chaque face).
   */
  const fantomeDePont = (c: VoxelCube, leLongDeX: boolean) => {
    const e = (1 - FANTOME_DU_PONT.long) / 2;
    const [x0, x1] = leLongDeX ? [c.x + e, c.x + 1 - e] : [c.x, c.x + 1];
    const [y0, y1] = leLongDeX ? [c.y, c.y + 1] : [c.y + e, c.y + 1 - e];
    const z1 = c.z + 1;
    const z0 = z1 - FANTOME_DU_PONT.haut;
    const uvs: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const q = (pts: V3[], n: V3) => G.poly(pts, n, null, { uvs });
    q([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1]);
    q([[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]], [0, 0, -1]);
    q([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0]);
    q([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0]);
    q([[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], [-1, 0, 0]);
    q([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0]);
  };

  /**
   * Une boîte de (x0, y0, z0) à (x1, y1, z1), en coordonnées de grille, sans son dessous (elle est posée) : ses faces
   * pleines, sans biseau ni fusion.
   */
  const boite = (R: Remplissage, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, f: Faces, attr: { extra?: number; teinte?: number }) => {
    const sansBiseau = R === O && mode === 'peint' ? [0, 1, 2, 3].map(() => [SANS_BISEAU, SANS_BISEAU, SANS_BISEAU, SANS_BISEAU]) : undefined;
    const q = (pts: V3[], n: V3, col: Couleur) => R.poly(pts, n, [col, col, col, col], { ...attr, biseaux: sansBiseau });
    q([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], f.dessus);
    q([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], f.cote);
    q([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], f.cote);
    q([[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], [-1, 0, 0], f.cote);
    q([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0], f.cote);
  };
  /** Une lanterne : son corps sombre (opaque), son cœur (les fenêtres : éteint le jour, allumé la nuit), dans sa case. */
  const lanterne = (c: VoxelCube) => {
    const m = (w: number) => [0.5 - w / 2, 0.5 + w / 2];
    const [a0, a1] = m(LANTERNE.corps);
    const [b0, b1] = m(LANTERNE.coeur);
    boite(O, c.x + a0, c.x + a1, c.y + a0, c.y + a1, c.z, c.z + LANTERNE.corps, couleursDe(c), { teinte: teinteDe(c) });
    const l = couleurDeMatiere(a, 'lanterne');
    const eteint = c.muted ? { dessus: mixColor(l.dessus, DELAVE[0], DELAVE[1]), cote: mixColor(l.cote, DELAVE[0], DELAVE[1]) } : { dessus: eclaircir(l.cote, 0.85), cote: eclaircir(l.cote, 0.75) };
    const z0 = c.z + LANTERNE.corps;
    boite(F, c.x + b0, c.x + b1, c.y + b0, c.y + b1, z0, z0 + LANTERNE.coeur, eteint, { extra: decalages.get(c) ?? -1 });
  };

  /** Le dessin précieux d'un trophée (../architecture/precious.ts : le lingot d'or, le cristal), ou `null` : une boîte. */
  const preciousOf = (c: VoxelCube): 'ingot' | 'crystal' | null => (c.texture === 'or' ? 'ingot' : c.texture === 'cristal' ? 'crystal' : null);
  /** Là où se pose le trophée du dessus : le haut d'une boîte, d'un lingot, ou du prisme d'un cristal. */
  const restingHeightOf = (c: VoxelCube | undefined) => {
    const p = c ? preciousOf(c) : null;
    return p ? RESTING_HEIGHT[p] : TROPHEE.hauteur;
  };
  const trophiesByCell = new Map<string, VoxelCube>();
  /**
   * Un trophée (`TROPHEE`) : une boîte au milieu de sa case, sans son dessous (il est posé) ni sa face du fond (contre le
   * velours ou le trophée de derrière : la caméra regarde toujours vers le nord), aux couleurs de son bloc. Le trophée
   * d'or est un lingot, celui de cristal un cristal (intention du directeur artistique, 9 octobre 2026), sans leurs
   * faces tournées vers le fond ; celui du second rang se pose sur le haut de celui du premier.
   */
  const trophee = (c: VoxelCube, rang: number) => {
    const premier = rang === RANG_DES_SOCLES;
    const w = premier ? TROPHEE.bas : TROPHEE.haut;
    const [x0, x1, y0, y1] = [c.x + 0.5 - w / 2, c.x + 0.5 + w / 2, c.y + 0.5 - w / 2, c.y + 0.5 + w / 2];
    const z0 = premier ? c.z : c.z - 1 + restingHeightOf(trophiesByCell.get(cle(c.x, c.y, c.z - 1)));
    const z1 = z0 + TROPHEE.hauteur;
    const f = couleursDe(c);
    const sansBiseau = mode === 'peint' ? [0, 1, 2, 3].map(() => [SANS_BISEAU, SANS_BISEAU, SANS_BISEAU, SANS_BISEAU]) : undefined;
    const precieux = preciousOf(c);
    if (precieux) {
      const dessin = precieux === 'ingot' ? INGOT : CRYSTAL;
      for (const fa of dessin.facettes) {
        // La face du fond : jamais vue.
        if (fa.normale[1] > 0.5) continue;
        const pts = fa.points.map(([x, y, z]) => [c.x + x, c.y + y, z0 + z] as V3);
        const col = fa.face === 'dessus' ? f.dessus : f.cote;
        O.poly(pts, fa.normale, pts.map(() => col), { teinte: teinteDe(c), biseaux: sansBiseau ? pts.map(() => sansBiseau[0]) : undefined });
      }
      return;
    }
    const q = (pts: V3[], n: V3, col: Couleur) => O.poly(pts, n, [col, col, col, col], { teinte: teinteDe(c), biseaux: sansBiseau });
    q([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], f.dessus);
    q([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], f.cote);
    q([[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], [-1, 0, 0], f.cote);
    q([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0], f.cote);
  };

  /**
   * Un bloc en retrait de sa case (`BLOC_EN_RETRAIT`) : une boîte sans son dessous (il est posé), aux couleurs de son
   * bloc ; fini, ses côtés prennent la lueur de fin (les fenêtres, allumés les premiers) et son dessus garde sa couleur.
   */
  const enRetraitDeSaCase = (c: VoxelCube) => {
    const w = BLOC_EN_RETRAIT.large;
    const [x0, x1, y0, y1] = [c.x + 0.5 - w / 2, c.x + 0.5 + w / 2, c.y + 0.5 - w / 2, c.y + 0.5 + w / 2];
    const [z0, z1] = [c.z, c.z + BLOC_EN_RETRAIT.haut];
    const f = couleursDe(c);
    if (!allumes.has(c)) {
      boite(O, x0, x1, y0, y1, z0, z1, f, { teinte: teinteDe(c) });
      return;
    }
    const sansBiseau = mode === 'peint' ? [0, 1, 2, 3].map(() => [SANS_BISEAU, SANS_BISEAU, SANS_BISEAU, SANS_BISEAU]) : undefined;
    O.poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], [f.dessus, f.dessus, f.dessus, f.dessus], { teinte: teinteDe(c), biseaux: sansBiseau });
    const q = (pts: V3[], n: V3) => F.poly(pts, n, [f.cote, f.cote, f.cote, f.cote], { extra: 0 });
    q([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0]);
    q([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0]);
    q([[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], [-1, 0, 0]);
    q([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0]);
  };

  for (const c of trophees.keys()) trophiesByCell.set(cle(c.x, c.y, c.z), c);

  // ---- Les faces des blocs, des vitres, des lanternes et des trophées.
  interface Case {
    u: number;
    v: number;
    couleur: Couleur;
    teinte: number;
    arete: number;
    motif: number;
    /** Retraits du biseau : côté u−, u+, v−, v+. */
    r: [boolean, boolean, boolean, boolean];
    fait: boolean;
  }
  const plans = new Map<string, Map<string, Case>>();
  const SANS_BORDS: [boolean, boolean, boolean, boolean] = [false, false, false, false];
  // Les fantômes : toutes leurs faces (un fantôme ne cache rien), fusionnées par plan comme les blocs.
  for (const c of dessines) {
    if (!c.ghost) continue;
    const pont = ponts?.fantomes.get(cle(c.x, c.y, c.z));
    if (pont !== undefined) {
      fantomeDePont(c, pont);
      continue;
    }
    for (let d = 0; d < 6; d++) {
      const k = axeDe(d);
      const [i, j] = tangents(k);
      const base: V3 = [c.x, c.y, c.z];
      const plan = base[k] + (signeDe(d) > 0 ? 1 : 0);
      if (!fusion) {
        fantome(d, plan, base[i], base[i] + 1, base[j], base[j] + 1);
        continue;
      }
      const pk = `g|${d}|${plan}`;
      let p = plans.get(pk);
      if (!p) plans.set(pk, (p = new Map()));
      p.set(`${base[i]},${base[j]}`, { u: base[i], v: base[j], couleur: FANTOME, teinte: 0, arete: 0, motif: 0, r: SANS_BORDS, fait: false });
    }
  }
  for (const c of dessines) {
    if (c.ghost) continue;
    const g = genres.get(c);
    if (g === 'lanterne') {
      lanterne(c);
      continue;
    }
    const rang = trophees.get(c);
    if (rang !== undefined) {
      trophee(c, rang);
      continue;
    }
    if (enRetrait.has(c)) {
      enRetraitDeSaCase(c);
      continue;
    }
    for (let d = 0; d < 6; d++) {
      if (!visible(c, d)) continue;
      const k = axeDe(d);
      const [i, j] = tangents(k);
      const base: V3 = [c.x, c.y, c.z];
      const plan = base[k] + (signeDe(d) > 0 ? 1 : 0);
      const r: [boolean, boolean, boolean, boolean] = [
        biseaute(c, d, dir(i, -1)),
        biseaute(c, d, dir(i, 1)),
        biseaute(c, d, dir(j, -1)),
        biseaute(c, d, dir(j, 1)),
      ];
      // La lueur de fin ne prend que les faces verticales (retouches du directeur artistique, 10 octobre 2026 : un aplat
      // jaune sur le dessus se lisait comme un bloc peint, les hublots de la fusée comme des fenêtres) : le dessus et le
      // dessous gardent la couleur de leur famille, dans le groupe opaque (assombris la nuit comme le reste).
      if (allumes.has(c) && axeDe(d) === 2) {
        rectangle(O, d, plan, base[i], base[i] + 1, base[j], base[j] + 1, SANS_BORDS, couleurDeFace(c, d), undefined, teinteDe(c));
        continue;
      }
      if (g !== 'bloc' || !fusion) {
        // Une face seule : les vitres et les lanternes ont chacune leur décalage.
        rectangle(groupeDe(c), d, plan, base[i], base[i] + 1, base[j], base[j] + 1, r, couleurDeFace(c, d), extraDe(c), teinteDe(c), areteDe(c), motifDe(c, d));
        continue;
      }
      const pk = `o|${d}|${plan}`;
      let p = plans.get(pk);
      if (!p) plans.set(pk, (p = new Map()));
      p.set(`${base[i]},${base[j]}`, { u: base[i], v: base[j], couleur: couleurDeFace(c, d), teinte: teinteDe(c), arete: areteDe(c), motif: motifDe(c, d), r, fait: false });
    }
  }

  // La fusion gloutonne : dans chaque plan, des rectangles d'une même couleur, dont chaque bord a le même retrait.
  for (const [pk, cases] of plans) {
    const [groupe, ds, ps] = pk.split('|');
    const d = Number(ds);
    const plan = Number(ps);
    // Un mur (une face verticale du groupe opaque) réunit ses rangées malgré les bandes de son pied et de sa tête : le
    // shader les peint par rangée (`motifDesRangees`).
    const parRangees = groupe === 'o' && axeDe(d) < 2;
    const ordre = [...cases.values()].sort((p, q) => p.v - q.v || p.u - q.u);
    for (const s of ordre) {
      if (s.fait) continue;
      const meme = (x: Case | undefined) => (x && !x.fait && x.couleur === s.couleur && x.teinte === s.teinte && x.arete === s.arete ? x : undefined);
      const at = (u: number, v: number) => {
        const x = meme(cases.get(`${u},${v}`));
        return x && x.motif === s.motif ? x : undefined;
      };
      /** La case (u, v) d'une rangée au-dessus, dont le motif est `motif` (celui de toute la rangée). */
      const auDessus = (u: number, v: number, motif: number) => {
        const x = meme(cases.get(`${u},${v}`));
        return x && x.motif === motif ? x : undefined;
      };
      // Le long de u : même couleur, mêmes retraits en v.
      let u1 = s.u;
      let droite = s;
      for (;;) {
        const n = at(u1 + 1, s.v);
        if (!n || n.r[2] !== s.r[2] || n.r[3] !== s.r[3] || s.r[1] || n.r[0]) break;
        droite = n;
        u1++;
      }
      const bords = { gauche: s.r[0], droite: droite.r[1], bas: s.r[2], haut: s.r[3] };
      // Puis le long de v, rangée par rangée (un mur : une rangée d'un même motif, qui se réunit à la précédente).
      let v1 = s.v;
      let motifDuHaut = s.motif;
      for (;;) {
        const premiere = meme(cases.get(`${s.u},${v1 + 1}`));
        const motif = parRangees && premiere && v1 - s.v + 2 <= RANGEES.max && rangeesReunies(motifDuHaut, premiere.motif) ? premiere.motif : s.motif;
        const rangee: Case[] = [];
        for (let u = s.u; u <= u1; u++) {
          const n = parRangees ? auDessus(u, v1 + 1, motif) : at(u, v1 + 1);
          if (!n) break;
          rangee.push(n);
        }
        if (rangee.length !== u1 - s.u + 1) break;
        const haut = rangee[0].r[3];
        if (rangee.some((n) => n.r[3] !== haut || n.r[2])) break;
        if (rangee[0].r[0] !== bords.gauche || rangee[rangee.length - 1].r[1] !== bords.droite) break;
        if (rangee.some((n, x) => x > 0 && n.r[0]) || rangee.some((n, x) => x < rangee.length - 1 && n.r[1])) break;
        // La rangée d'avant n'avait pas de retrait en haut (sinon elle ne touchait pas celle-ci).
        if (bords.haut) break;
        v1++;
        bords.haut = haut;
        motifDuHaut = motif;
      }
      for (let v = s.v; v <= v1; v++)
        for (let u = s.u; u <= u1; u++) {
          const c = cases.get(`${u},${v}`);
          if (c) c.fait = true;
        }
      if (groupe === 'g') fantome(d, plan, s.u, u1 + 1, s.v, v1 + 1);
      else rectangle(O, d, plan, s.u, u1 + 1, s.v, v1 + 1, [bords.gauche, bords.droite, bords.bas, bords.haut], s.couleur, undefined, s.teinte, s.arete, parRangees ? motifDesRangees(s.motif, motifDuHaut, s.v, v1) : s.motif);
    }
  }

  // ---- Le biseau : les bandes des arêtes, leurs coins, et les bouts qui butent sur un bloc sans biseau.
  if (mode === 'taille' && b > 0) {
    interface Bande {
      t0: number;
      t1: number;
      court0: boolean;
      court1: boolean;
    }
    const bandes = new Map<string, { d: number; e: number; ai: number; aj: number; ca: Couleur; cb: Couleur; tc: number; list: Bande[] }>();
    for (const c of dessines) {
      if (!taille(c)) continue;
      const base: V3 = [c.x, c.y, c.z];
      for (let d = 0; d < 6; d++) {
        if (!visible(c, d)) continue;
        for (let e = d + 1; e < 6; e++) {
          if (axeDe(e) === axeDe(d) || !visible(c, e)) continue;
          const kd = axeDe(d);
          const ke = axeDe(e);
          const kf = 3 - kd - ke;
          // L'arête : sur le plan de d et celui de e, le long de l'axe kf.
          const ai = base[kd] + (signeDe(d) > 0 ? 1 : 0);
          const aj = base[ke] + (signeDe(e) > 0 ? 1 : 0);
          const court0 = visible(c, dir(kf, -1));
          const court1 = visible(c, dir(kf, 1));
          const ca = couleurDeFace(c, d);
          const cb = couleurDeFace(c, e);
          const tc = teinteDe(c);
          const key = `${d}|${e}|${ai}|${aj}|${ca}|${cb}|${tc}`;
          let l = bandes.get(key);
          if (!l) bandes.set(key, (l = { d, e, ai, aj, ca, cb, tc, list: [] }));
          l.list.push({ t0: base[kf], t1: base[kf] + 1, court0, court1 });
          // Les bouts sans coin : si un bloc sans ce biseau est là, un triangle ferme le bout (sa face vers ce bloc-ci).
          for (const sf of [-1, 1]) {
            const f = dir(kf, sf);
            if (visible(c, f)) continue;
            const off = DIRS[f];
            const n = plein.get(cle(c.x + off[0], c.y + off[1], c.z + off[2]));
            if (!n || biseaute(n, d, e)) continue;
            const t = sf > 0 ? base[kf] + 1 : base[kf];
            const K: V3 = [0, 0, 0];
            K[kd] = ai;
            K[ke] = aj;
            K[kf] = t;
            const A: V3 = [...K];
            A[ke] -= signeDe(e) * b;
            const B: V3 = [...K];
            B[kd] -= signeDe(d) * b;
            const col = couleurDeFace(n, dir(kf, -sf));
            groupeDe(n).poly([K, A, B], DIRS[dir(kf, -sf)], [col, col, col], { extra: extraDe(n), teinte: groupeDe(n) === O ? teinteDe(n) : undefined });
          }
        }
      }
      // Les coins : trois faces visibles.
      for (const sx of [-1, 1])
        for (const sy of [-1, 1])
          for (const sz of [-1, 1]) {
            const ds = [dir(0, sx), dir(1, sy), dir(2, sz)];
            if (!ds.every((d) => visible(c, d))) continue;
            const K: V3 = [c.x + (sx > 0 ? 1 : 0), c.y + (sy > 0 ? 1 : 0), c.z + (sz > 0 ? 1 : 0)];
            const s = [sx, sy, sz];
            // Le sommet sur la face d'axe m : rentré de b le long des deux autres axes.
            const pts = [0, 1, 2].map((m) => {
              const p: V3 = [...K];
              for (let q = 0; q < 3; q++) if (q !== m) p[q] -= s[q] * b;
              return p;
            });
            O.poly(pts, [sx, sy, sz], [0, 1, 2].map((m) => couleurDeFace(c, ds[m])), { teinte: teinteDe(c) });
          }
    }
    // Les bandes, fusionnées le long de leur arête.
    for (const { d, e, ai, aj, ca, cb, tc, list } of bandes.values()) {
      list.sort((p, q) => p.t0 - q.t0);
      const kd = axeDe(d);
      const ke = axeDe(e);
      const kf = 3 - kd - ke;
      const n: V3 = [0, 0, 0];
      n[kd] = signeDe(d);
      n[ke] = signeDe(e);
      const emettre = (s: Bande) => {
        const t0 = s.t0 + (s.court0 ? b : 0);
        const t1 = s.t1 - (s.court1 ? b : 0);
        const at = (t: number, surD: boolean): V3 => {
          const p: V3 = [0, 0, 0];
          p[kd] = surD ? ai : ai - signeDe(d) * b;
          p[ke] = surD ? aj - signeDe(e) * b : aj;
          p[kf] = t;
          return p;
        };
        O.poly([at(t0, true), at(t1, true), at(t1, false), at(t0, false)], n, [ca, ca, cb, cb], { teinte: tc });
      };
      let cur = null as Bande | null;
      for (const s of list) {
        if (cur && fusion && cur.t1 === s.t0 && !cur.court1 && !s.court0) cur = { ...cur, t1: s.t1, court1: s.court1 };
        else {
          if (cur) emettre(cur);
          cur = { ...s };
        }
      }
      if (cur) emettre(cur);
    }
  }

  // ---- Le phare de Grimoire : les pièces des étapes finies, en facettes peintes (sa lanterne dans les fenêtres, allumée
  // la première : elle suit la lueur, sans clignoter ; éteinte et délavée sur une île fermée).
  let dessinDuPhare: MaillageDeLaConstruction['phare'];
  if (phare?.pose.pieces?.size) {
    const P = new Pinceau();
    const L = new Pinceau();
    dessinerPhare(P, L, phare.pose);
    dessinDuPhare = {
      opaque: O.facettes(P.fin(), { biseaux: mode === 'peint', teinte: 1 }),
      fenetres: F.facettes(L.fin(), { extra: 0 }),
      cellules: phare.cellules,
    };
  }

  // ---- Les ponts de pierre et de bois : culées, et tablier et garde-corps d'un pont construit, en facettes peintes.
  let dessinDesPonts: MaillageDeLaConstruction['ponts'];
  if (ponts?.ponts.length) {
    const P = new Pinceau();
    for (const p of ponts.ponts) dessinerPont(P, p);
    dessinDesPonts = [{ opaque: O.facettes(P.fin(), { biseaux: mode === 'peint', teinte: 1 }) }];
  }

  // ---- Le phare du large : la tour, sa corniche et son parapet dans l'opaque, son feu dans les fenêtres (allumé le
  // premier : il suit la lueur, sans pulser ; éteint et délavé sur une île fermée).
  let dessinDuLarge: MaillageDeLaConstruction['phareDuLarge'];
  if (large?.pose) {
    const P = new Pinceau();
    const L = new Pinceau();
    dessinerPhareDuLarge(P, L, large.pose);
    const [t0] = O.facettes(P.fin(), { biseaux: mode === 'peint', teinte: 1 });
    // Ses hublots (GD-2, consultant Archipéo) : les vitraux du monument, ronds sur le fût, à mi-hauteur ; un carré de
    // cadre jaune posé sur le pan, que le shader peint en hublot (`MOTIF_ASSEMBLE.vitrail`). Deux triangles chacun ; aucun sur une île fermée,
    // ni avant que la lanterne (les vitraux du grand projet) soit finie.
    if (!large.pose.muted && (large.pose.pieces?.has('lantern') ?? true)) {
      const cadre = couleurDeMatiere(a, 'vitrail').cote;
      const sansBiseau = mode === 'peint' ? [0, 1, 2, 3].map(() => [SANS_BISEAU, SANS_BISEAU, SANS_BISEAU, SANS_BISEAU]) : undefined;
      for (const h of hublotsDuPhareDuLarge(large.pose))
        O.poly(h.points, h.normale, h.points.map(() => cadre), { biseaux: sansBiseau, teinte: 1, motif: MOTIF_ASSEMBLE.vitrail });
    }
    dessinDuLarge = {
      opaque: [t0, O.idx.length / 3],
      fenetres: F.facettes(L.fin(), { extra: 0 }),
      cellules: large.pose.cellules,
    };
  }

  // ---- Les monuments importés : l'étape du chantier dans l'opaque, le feu du phare du large fini dans les fenêtres
  // (allumé le premier, sans pulser).
  const monumentsDrawing: NonNullable<MaillageDeLaConstruction['monuments']> = imported.map((m) => ({
    opaque: O.facettes(m.opaque, { biseaux: mode === 'peint', teinte: 1 }),
    fenetres: F.facettes(m.fire, { extra: 0 }),
    cellules: m.cellules,
    ...(m.halo ? { halo: m.halo } : {}),
  }));

  // ---- Les pièces d'architecture dessinées (lot 7) : assemblées (sans les facettes contre un bloc plein ni celles que
  // deux pièces partagent ; une rangée d'un tenant), dans l'opaque, à la fin, aux couleurs de la matière du bloc qu'elles
  // remplacent (ou d'un rôle du kit), avec sa teinte ; les cases de chaque triangle, pour le toucher (toute la case).
  let dessinDesPieces: MaillageDeLaConstruction['pieces'];
  if (archi?.pieces.length) {
    const t0 = O.idx.length / 3;
    const cases: number[] = [];
    const sansBiseau = mode === 'peint' ? [SANS_BISEAU, SANS_BISEAU, SANS_BISEAU, SANS_BISEAU] : null;
    const estPlein = (x: number, y: number, z: number) => plein.has(cle(x, y, z)) || sous.has(cle(x, y, z));
    const cleDeCouleur = (c: VoxelCube) => `${c.texture ?? ''}|${c.color}|${c.top ?? ''}|${c.muted ? 1 : 0}|${c.tag ?? ''}`;
    for (const { facette: f, cube: c, min, max } of assemblerLesPieces(archi.pieces, estPlein, cleDeCouleur)) {
      // La couleur du bloc de dessous (les flancs de pierre de la braise du cône), sinon celle du bloc ; tenue à l'écart du
      // fantôme pour le pain de craie.
      const couleurs = couleursDe((f.colourBelow && solides.get(cle(c.x, c.y, c.z - 1))) || c);
      const teinteDeLaFacette = f.role ? couleurDuRole(a, kit, f.role, c.muted) : f.face === 'dessus' ? couleurs.dessus : couleurs.cote;
      const col = f.ghostApart ? apartFromGhost(teinteDeLaFacette) : teinteDeLaFacette;
      // Le motif du bloc lui-même (le bloc assemblé suspendu de la Halle), sinon celui de la facette, délavé sur une île fermée.
      const motif = f.ownMotif
        ? !c.muted && c.texture && Object.hasOwn(MOTIF_ASSEMBLE, c.texture)
          ? MOTIF_ASSEMBLE[c.texture as BlocAssemble]
          : 0
        : f.motif && c.muted
          ? f.motif | MOTIF.delave
          : (f.motif ?? 0);
      O.poly(f.points, f.normale, f.points.map(() => col), { biseaux: sansBiseau ? f.points.map(() => sansBiseau) : undefined, teinte: teinteDeCase(c.x, c.y, c.z), motif });
      for (let i = 2; i < f.points.length; i++) cases.push(...min, ...max);
    }
    dessinDesPieces = [{ opaque: [t0, O.idx.length / 3], cases: Int32Array.from(cases) }];
  }

  const opaque = O.fin();
  const f = F.fin();
  const g = G.fin();
  const m: MaillageDeLaConstruction = {
    opaque: { ...opaque, biseaux: Float32Array.from(O.bis), teintes: Float32Array.from(O.tei), aretes: Float32Array.from(O.are), motifs: Float32Array.from(O.mot) },
    fenetres: { ...f, decalages: Float32Array.from(F.extra) },
    fantomes: { ...g, colors: new Float32Array(0), uvs: Float32Array.from(G.uv) },
  };
  if (dessinDuPhare) m.phare = dessinDuPhare;
  if (dessinDesPonts) m.ponts = dessinDesPonts;
  if (dessinDuLarge) m.phareDuLarge = dessinDuLarge;
  if (dessinDesPieces) m.pieces = dessinDesPieces;
  if (monumentsDrawing.length) m.monuments = monumentsDrawing;
  return m;
}

/** Triangles et appels de dessin de la construction (un appel par groupe non vide). */
export function coutDeLaConstruction(m: MaillageDeLaConstruction): { triangles: number; drawCalls: number; opaque: number; fantomes: number; fenetres: number } {
  const t = (g: GroupeDeConstruction) => g.indices.length / 3;
  const groupes = [m.opaque, m.fantomes, m.fenetres];
  // Un halo (la nuit) : un sprite, deux triangles, un appel.
  const halos = (m.monuments ?? []).filter((q) => q.halo).length;
  return {
    triangles: groupes.reduce((n, g) => n + t(g), 0) + 2 * halos,
    drawCalls: groupes.filter((g) => g.indices.length > 0).length + halos,
    opaque: t(m.opaque),
    fantomes: t(m.fantomes),
    fenetres: t(m.fenetres),
  };
}

/**
 * La case touchée sur la construction, et la case devant : le point touché et la normale de la facette (repère Three).
 * La case est celle du bloc sous le point (un quart de bloc derrière la facette : il reste dans la case de son bloc, biseau
 * compris, et dans celle d'une lanterne ou d'une borne, plus petites que leur case) ; la case devant est sa voisine du côté où la facette regarde le plus (le haut d'abord, pour un biseau ou un
 * coin : on pose sur le dessus).
 */
export function caseDeLaConstruction(point: { x: number; y: number; z: number }, normale: { x: number; y: number; z: number }): { cell: Cell; next: Cell } {
  const cell = {
    x: Math.floor(point.x - normale.x * 0.25),
    y: Math.floor(point.z - normale.z * 0.25),
    z: Math.floor(point.y - normale.y * 0.25),
  };
  const ax = Math.abs(normale.x);
  const ay = Math.abs(normale.y);
  const az = Math.abs(normale.z);
  const m = Math.max(ax, ay, az) - 1e-6;
  const next = { ...cell };
  if (ay >= m) next.z += Math.sign(normale.y);
  else if (ax >= m) next.x += Math.sign(normale.x);
  else next.y += Math.sign(normale.z);
  return { cell, next };
}

/**
 * La case touchée sur un modèle qui remplace des cubes (`groupe` : le maillage touché, `triangle` : l'indice du
 * triangle), et la case devant, du côté où la facette regarde le plus :
 * - une pièce d'architecture (lot 7) : sa case, toute la case, lue dans la table triangle → case ;
 * - le phare de Grimoire, le phare du large ou un monument importé : la case remplacée la plus proche du point touché.
 * `null` si le triangle n'est à aucun d'eux (un bloc taillé : `caseDeLaConstruction`).
 */
export function caseDeLaPiece(
  m: MaillageDeLaConstruction,
  groupe: 'opaque' | 'fenetres',
  triangle: number,
  point: { x: number; y: number; z: number },
  normale: { x: number; y: number; z: number },
): { cell: Cell; next: Cell } | null {
  // Une pièce d'architecture : la case de son triangle, ou, pour une rangée, la case de la rangée sous le point touché
  // (un peu derrière la facette, ramené dans la rangée).
  if (groupe === 'opaque')
    for (const t of m.pieces ?? []) {
      if (triangle < t.opaque[0] || triangle >= t.opaque[1]) continue;
      const i = 6 * (triangle - t.opaque[0]);
      if (i + 5 >= t.cases.length) return null;
      const dans = (v: number, de: number, a: number) => Math.min(a, Math.max(de, Math.floor(v)));
      const cell = {
        x: dans(point.x - normale.x * 0.01, t.cases[i], t.cases[i + 3]),
        y: dans(point.z - normale.z * 0.01, t.cases[i + 1], t.cases[i + 4]),
        z: dans(point.y - normale.y * 0.01, t.cases[i + 2], t.cases[i + 5]),
      };
      const { next } = caseDeLaConstruction({ x: cell.x + 0.5, y: cell.z + 0.5, z: cell.y + 0.5 }, normale);
      return { cell, next: { x: next.x, y: next.y, z: next.z } };
    }
  // Le phare de Grimoire, le phare du large ou un monument importé : celui dont les triangles contiennent le triangle touché.
  const p = [m.phare, m.phareDuLarge, ...(m.monuments ?? [])].find((q) => q && triangle >= q[groupe][0] && triangle < q[groupe][1] && q.cellules.length);
  if (!p) return null;
  // Repère Three : le point (x, hauteur, y), un quart de case derrière la facette, comme `caseDeLaConstruction`.
  const q = { x: point.x - normale.x * 0.25, y: point.z - normale.z * 0.25, z: point.y - normale.y * 0.25 };
  let cell = p.cellules[0];
  let d = Infinity;
  for (const c of p.cellules) {
    const e = (c.x + 0.5 - q.x) ** 2 + (c.y + 0.5 - q.y) ** 2 + (c.z + 0.5 - q.z) ** 2;
    if (e < d) [cell, d] = [c, e];
  }
  const { next } = caseDeLaConstruction({ x: cell.x + 0.5, y: cell.z + 0.5, z: cell.y + 0.5 }, normale);
  return { cell: { x: cell.x, y: cell.y, z: cell.z }, next: { x: next.x, y: next.y, z: next.z } };
}

// ---------- Un maillage par île ----------

/** Les maillages déjà faits, un par île (les cubes d'une même étiquette `tag`), et leurs signatures. */
export interface CacheDeLaConstruction {
  iles: Map<string, { signature: string; maillage: MaillageDeLaConstruction }>;
  /** Le nombre de cubes du sol : s'il change, tout est refait. */
  sol: number;
  /** La version des monuments importés (./monumentModels.ts) : un modèle arrivé, tout est refait. */
  monuments: number;
}

export const cacheDeLaConstruction = (): CacheDeLaConstruction => ({ iles: new Map(), sol: -1, monuments: -1 });

/**
 * La construction d'un archipel, île par île : chaque île (les cubes d'une même étiquette) a son maillage, gardé tant
 * que ses cubes ne changent pas ; ils sont mis bout à bout dans les trois groupes (toujours trois appels). Poser un bloc
 * ne refait que son île. `refaites` : le nombre d'îles refaites ; `change` : faux si rien n'a changé.
 */
export function construireParIle(
  a: ArchipelagoId,
  cubes: VoxelCube[],
  sol: VoxelCube[],
  cache: CacheDeLaConstruction,
): { maillage: MaillageDeLaConstruction; refaites: number; change: boolean } {
  if (cache.sol !== sol.length || cache.monuments !== monumentsVersion()) {
    cache.iles.clear();
    cache.sol = sol.length;
    cache.monuments = monumentsVersion();
  }
  const parIle = new Map<string, VoxelCube[]>();
  for (const c of cubes) {
    const k = c.tag ?? '';
    const l = parIle.get(k);
    if (l) l.push(c);
    else parIle.set(k, [c]);
  }
  let solParIle: Map<string, VoxelCube[]> | null = null;
  // Le sol entier, pour les pilotis (ils le cherchent plus bas que la case juste dessous) ; fait une fois, au besoin.
  let index: Map<string, VoxelCube> | null = null;
  const solEntier = (x: number, y: number, z: number) => index?.get(cle(x, y, z));
  let refaites = 0;
  for (const k of [...cache.iles.keys()]) if (!parIle.has(k)) {
    cache.iles.delete(k);
    refaites++;
  }
  for (const [k, l] of parIle) {
    const signature = signatureDeLaConstruction(l, []);
    if (cache.iles.get(k)?.signature === signature) continue;
    // Le sol sous l'île : seulement les cubes du sol sous un de ses blocs (le sol cache le dessous d'un bloc posé).
    if (!solParIle || !index) {
      solParIle = new Map();
      index = new Map(sol.map((c) => [cle(c.x, c.y, c.z), c]));
      for (const [ki, li] of parIle) {
        const s: VoxelCube[] = [];
        for (const c of li) {
          const d = index.get(cle(c.x, c.y, c.z - 1));
          if (d) s.push(d);
        }
        solParIle.set(ki, s);
      }
    }
    cache.iles.set(k, { signature, maillage: maillageDeLaConstruction(a, l, solParIle.get(k), { solEntier }) });
    refaites++;
  }
  return { maillage: miseBoutABout([...cache.iles.values()].map((i) => i.maillage)), refaites, change: refaites > 0 };
}

/**
 * Des maillages mis bout à bout : les trois groupes, indices décalés, et avec eux les triangles des phares, les tranches
 * des ponts et celles des pièces d'architecture (leur table triangle → case suit).
 */
export function miseBoutABout(liste: MaillageDeLaConstruction[]): MaillageDeLaConstruction {
  const joindre = <T extends GroupeDeConstruction>(groupes: T[], extras: (keyof T)[]): { g: GroupeDeConstruction & Record<string, Float32Array>; debuts: number[] } => {
    const debuts: number[] = [];
    let indices = 0;
    for (const g of groupes) {
      debuts.push(indices / 3);
      indices += g.indices.length;
    }
    const cat = (k: keyof T) => {
      const total = groupes.reduce((n, g) => n + (g[k] as Float32Array).length, 0);
      const out = new Float32Array(total);
      let o = 0;
      for (const g of groupes) {
        out.set(g[k] as Float32Array, o);
        o += (g[k] as Float32Array).length;
      }
      return out;
    };
    const idx = new Uint32Array(indices);
    let o = 0;
    let base = 0;
    for (const g of groupes) {
      for (let i = 0; i < g.indices.length; i++) idx[o + i] = g.indices[i] + base;
      o += g.indices.length;
      base += g.positions.length / 3;
    }
    const g = { positions: cat('positions'), normals: cat('normals'), colors: cat('colors'), indices: idx } as GroupeDeConstruction & Record<string, Float32Array>;
    for (const k of extras) g[k as string] = cat(k);
    return { g, debuts };
  };
  const o = joindre(liste.map((m) => m.opaque), ['biseaux', 'teintes', 'aretes', 'motifs']);
  const f = joindre(liste.map((m) => m.fenetres), ['decalages']);
  const g = joindre(liste.map((m) => m.fantomes), ['uvs']);
  const m: MaillageDeLaConstruction = {
    opaque: o.g as unknown as GroupeOpaque,
    fenetres: f.g as unknown as GroupeDesFenetres,
    fantomes: g.g as unknown as GroupeDesFantomes,
  };
  liste.forEach((x, i) => {
    for (const k of ['phare', 'phareDuLarge'] as const) {
      const q = x[k];
      if (!q) continue;
      m[k] = {
        opaque: [q.opaque[0] + o.debuts[i], q.opaque[1] + o.debuts[i]],
        fenetres: [q.fenetres[0] + f.debuts[i], q.fenetres[1] + f.debuts[i]],
        cellules: q.cellules,
      };
    }
    const decaler = (t: [number, number]): [number, number] => [t[0] + o.debuts[i], t[1] + o.debuts[i]];
    for (const p of x.ponts ?? []) (m.ponts ??= []).push({ opaque: decaler(p.opaque) });
    for (const p of x.pieces ?? []) (m.pieces ??= []).push({ opaque: decaler(p.opaque), cases: p.cases });
    for (const q of x.monuments ?? [])
      (m.monuments ??= []).push({ opaque: decaler(q.opaque), fenetres: [q.fenetres[0] + f.debuts[i], q.fenetres[1] + f.debuts[i]], cellules: q.cellules, ...(q.halo ? { halo: q.halo } : {}) });
  });
  return m;
}

// ---------- Les bornes de mission (poste « Bornes ») ----------

/** Une borne de mission : la case de son socle (le bas de ses deux cubes `quest`), et si son île est fermée. */
export interface Pilier {
  quest: string;
  x: number;
  y: number;
  z: number;
  muted: boolean;
}

/** Les bornes d'un monde : une par mission, posée sur la case de son cube le plus bas. */
export function piliersDe(cubes: VoxelCube[]): Pilier[] {
  const parQuete = new Map<string, Pilier>();
  for (const c of cubes) {
    if (!c.quest || c.ghost) continue;
    const p = parQuete.get(c.quest);
    if (!p || c.z < p.z) parQuete.set(c.quest, { quest: c.quest, x: c.x, y: c.y, z: c.z, muted: Boolean(c.muted) || Boolean(p?.muted) });
    else if (c.muted) p.muted = true;
  }
  return [...parQuete.values()];
}

/**
 * La forme d'une borne, pour l'instancier (repère Three, origine au coin bas de la case du socle) : un pilier de pierre
 * taillée, puis une tête d'ardoise (la couleur `borne`) chanfreinée sur le dessus. Elle tient dans ses deux cases, en
 * retrait des bords : le toucher (`caseDeLaConstruction`) retrouve la case du socle ou celle de la tête.
 */
const PILIER = { corps: [0.2, 0.8], hautDuCorps: 1.3, tete: [0.08, 0.92], chanfrein: 0.12, haut: 2 } as const;

export function formeDuPilier(a: ArchipelagoId): GroupeDeConstruction {
  const R = new Remplissage();
  const pierre = couleurDeMatiere(a, 'pierre').cote;
  const tete = couleurDeMatiere(a, 'borne');
  const [c0, c1] = PILIER.corps;
  const [t0, t1] = PILIER.tete;
  const h = PILIER.hautDuCorps;
  const H = PILIER.haut;
  const k = PILIER.chanfrein;
  const quad = (pts: V3[], n: V3, col: Couleur) => R.poly(pts, n, [col, col, col, col]);
  // Le corps : quatre côtés (le dessous est sur le sol, le dessus sous la tête).
  quad([[c0, c0, 0], [c1, c0, 0], [c1, c0, h], [c0, c0, h]], [0, -1, 0], pierre);
  quad([[c0, c1, 0], [c1, c1, 0], [c1, c1, h], [c0, c1, h]], [0, 1, 0], pierre);
  quad([[c0, c0, 0], [c0, c1, 0], [c0, c1, h], [c0, c0, h]], [-1, 0, 0], pierre);
  quad([[c1, c0, 0], [c1, c1, 0], [c1, c1, h], [c1, c0, h]], [1, 0, 0], pierre);
  // La tête : son dessous, ses côtés, ses chanfreins, son dessus.
  quad([[t0, t0, h], [t1, t0, h], [t1, t1, h], [t0, t1, h]], [0, 0, -1], tete.cote);
  const e = H - k;
  quad([[t0, t0, h], [t1, t0, h], [t1, t0, e], [t0, t0, e]], [0, -1, 0], tete.cote);
  quad([[t0, t1, h], [t1, t1, h], [t1, t1, e], [t0, t1, e]], [0, 1, 0], tete.cote);
  quad([[t0, t0, h], [t0, t1, h], [t0, t1, e], [t0, t0, e]], [-1, 0, 0], tete.cote);
  quad([[t1, t0, h], [t1, t1, h], [t1, t1, e], [t1, t0, e]], [1, 0, 0], tete.cote);
  const i0 = t0 + k;
  const i1 = t1 - k;
  // Les chanfreins : quatre trapèzes qui se rejoignent en onglet aux coins.
  quad([[t0, t0, e], [t1, t0, e], [i1, i0, H], [i0, i0, H]], [0, -1, 1], tete.dessus);
  quad([[t0, t1, e], [t1, t1, e], [i1, i1, H], [i0, i1, H]], [0, 1, 1], tete.dessus);
  quad([[t0, t0, e], [t0, t1, e], [i0, i1, H], [i0, i0, H]], [-1, 0, 1], tete.dessus);
  quad([[t1, t0, e], [t1, t1, e], [i1, i1, H], [i1, i0, H]], [1, 0, 1], tete.dessus);
  quad([[i0, i0, H], [i1, i0, H], [i1, i1, H], [i0, i1, H]], [0, 0, 1], tete.dessus);
  return R.fin();
}

/** Triangles et appels de dessin des bornes d'un monde : une forme, instanciée une fois par borne, en un appel. */
export function coutDesPiliers(piliers: Pilier[]): { triangles: number; drawCalls: number } {
  return { triangles: piliers.length * (formeDuPilier('6e').indices.length / 3), drawCalls: piliers.length ? 1 : 0 };
}

/**
 * La signature d'une construction : la même tant que ses cubes (et le nombre de cubes du sol sous elle) ne changent pas.
 * La vue 3D ne refait le maillage que si elle change.
 */
export function signatureDeLaConstruction(cubes: VoxelCube[], sol: VoxelCube[]): string {
  let s = `${sol.length}`;
  for (const c of cubes) s += `|${c.x},${c.y},${c.z},${c.texture ?? c.color},${c.top ?? ''},${c.ghost ? 1 : 0}${c.muted ? 1 : 0},${c.tag ?? ''},${c.place ?? ''},${c.quest ?? ''}`;
  return s;
}
