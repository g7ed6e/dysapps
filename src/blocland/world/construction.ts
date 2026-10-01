// La construction taillée d'Archipéo (lot R5 de la piste Rendu, docs/conception/cadrage-archipeo.md) : les bâtiments
// des plans, les ouvrages, les monuments, l'école et la salle des trophées, les objets du quai et le décor du cœur, en
// blocs de pierre taillée. Code pur, sans Three.js : il lit les cubes restés en cubes après le décor (`rangerLeDecor`,
// posés par `poseDuDecor`) et les cubes du sol, et rend trois groupes de tableaux typés, trois appels de dessin :
//
// - `opaque` : les blocs, en couleurs par sommet (la palette de l'archipel, de jour ; la nuit vient de la lumière de
//   la scène). Les faces coplanaires d'une même couleur sont fusionnées en rectangles (fusion gloutonne par plan, par
//   sens et par couleur) ; chaque bloc garde sa teinte, à ± `TEINTE` de luminosité, que le shader tire de sa case
//   (`TEINTE_GLSL` sur `floor(position - normal * 0.25)`, ou l'attribut `teintes` pour un bloc hors de la grille) : la
//   fusion ne l'efface pas. Le biseau des arêtes saillantes (celles où deux faces visibles d'un bloc se rencontrent) est
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
// référence (world/decor/phare.ts), en facettes peintes dans l'opaque (sa lanterne dans les fenêtres).
// Le phare du large (5e, revue d'ensemble du directeur artistique, DA-4) : fini, le monument laisse la place à sa tour
// ronde de pierre à feu ouvert (./phareDuLarge.ts), dans l'opaque (son feu dans les fenêtres).
//
// L'architecture modulaire (lot 7, ./architecture/) : un bloc posé d'un plan d'île dont le kit de l'archipel peint le
// mur garde sa géométrie et sa fusion, avec un motif par face (le colombage, le bardage, le soubassement, le chaperon,
// peints par le shader : l'attribut `motifs`) ; un bloc dont le kit dessine la pièce (un toit en pente, des pilotis)
// laisse sa case à cette pièce, assemblée (./architecture/assemblage.ts) et peinte dans l'opaque, à la fin. Seul le kit
// des Premiers Rivages est rempli (lot 7b) : ailleurs, rien n'est remplacé. L'école et la salle des trophées de ce kit
// le prennent aussi (`caseDuLieu`) ; les monuments gardent leurs blocs taillés.
//
// Le toucher : la géométrie reste dans la case de son bloc (le biseau ne fait que rogner). `caseDeLaConstruction`
// redonne la case touchée et la case devant la face, pour une face, un biseau ou un coin ; `caseDeLaPiece`, la case
// sous un modèle qui remplace des cubes : la case de la pièce d'architecture (toute la case, par la table triangle →
// case), ou la case du plan la plus proche sous le phare.
//
// Un maillage par île (`construireParIle`) : poser un bloc ne refait que son île ; les îles sont mises bout à bout dans
// les trois groupes.
import type { VoxelCube } from '../Voxel';
import { architectureDe, assemblerLesPieces, estUnLieuDuVillage, KITS, MOTIF, ROLES_PEINTS, type CaseDuLieu, type Kit, type Role } from './architecture';
import { BLOCKS, type BiomeId } from '../biomes';
import { mixColor } from './daylight';
import { COULEURS_DU_PHARE, dessinerPhare, PHARES, type PieceDuPhare, type PoseDuPhare } from './decor/phare';
import { DELAVE, eclaircir, hex, Pinceau, rgb, type FacettesDuDecor } from './decor/pinceau';
import { lineaire } from './landMesh';
import { dessinerPont, FANTOME_DU_PONT, pontsDePierreEtDeBois } from './ponts';
import { dessinerPhareDuLarge, hublotsDuPhareDuLarge, phareDuLarge } from './phareDuLarge';
import { islandDef, mapOf, type ArchipelagoId } from './map';
import { LAYOUT_PAD, origineDe, placeSpot, VILLAGE_PLACES } from './terrain';
import { getPlan, planCells, plansFor } from './plans';
import { ambianceDe, BLEU_LAGON, BRUME, couleurDeMatiere, DETAILS_ASSEMBLES, MATIERES, type Couleur, type Faces } from './palette';
import type { TextureKind } from './pixels';
import { couleursDuToit } from './toits';
import type { Cell } from './view';

// ---------- Les réglages de l'intention (directeur artistique, 28 septembre 2026) ----------

/** La variation de luminosité d'un bloc à l'autre : ± 4 %, jamais une autre teinte. */
export const TEINTE = 0.04;
/** Le biseau des arêtes saillantes, en part de case. */
export const BISEAU = 0.08;
/** La lueur des fenêtres et des lanternes, la nuit. */
export const LUEUR: Couleur = 0xffd866;
/** Le verre d'une vitre, le jour : le verre de la palette, à cette part de sa luminosité. */
export const VITRE_DE_JOUR = 0.55;
/** Au plus tant de vitres allumées par bâtiment. */
export const FENETRES_ALLUMEES = 3;
/** Au plus tant de lanternes allumées par cour (une île et un lieu, comme les vitres). */
export const LANTERNES_ALLUMEES = 2;
/**
 * Une lanterne (le genre `lanterne` : cours, comptoirs, sommets, pas les vitres) : un corps sombre de `corps` case de côté
 * et de haut, posé au milieu de sa case, et sur lui un cœur de `coeur` case, qui s'allume. Rien ne sort de la case.
 */
export const LANTERNE = { corps: 0.3, coeur: 0.18 } as const;
/** Le verre hors d'un mur (provisoire, jusqu'au phare de R4b) : 80 % Brume, 20 % Bleu lagon, avec une arête par case. */
export const VERRE_HORS_MUR: Couleur = mixColor(BRUME, BLEU_LAGON, 0.2);
/** L'arête du verre hors d'un mur : `ARETE`, à cette opacité, sur 1,5 pixel. */
export const ARETE_DU_VERRE = 0.4;
/** Le biseau peint : la lumière ajoutée au bord saillant (+22 %)… */
export const ECLAT_DU_BISEAU = 0.22;
/** … et au moins tant de niveaux sRGB de plus, par canal, sur une teinte sombre (luminance sous `SOMBRE`). */
export const ECART_SOMBRE = 14;
export const SOMBRE = 0.25;
/** Le décalage d'allumage d'une fenêtre, de 0 à cette valeur (en degré de nuit). */
export const DECALAGE_MAX = 0.15;
/** L'allumage : rien sous ce degré de nuit, tout allumé à `PLEINE_NUIT`. */
export const ALLUMAGE = 0.3;
export const PLEINE_NUIT = 0.8;
/** Le fantôme : sa teinte, son arête, et l'épaisseur de l'arête en part de case. */
export const FANTOME: Couleur = BRUME;
export const ARETE: Couleur = 0x142b38;
export const ARETE_FANTOME = 0.035;
/** Les pilotis : une case est sur le vide si rien de solide n'est dessous sur tant de cases (ou si c'est l'eau). */
export const PROFONDEUR = 6;
/** La toile du Bloc-Navire : le crème Brume. */
export const TOILE_DU_NAVIRE: Couleur = BRUME;
/**
 * Le phare de Grimoire (décision 16 du cadrage) : le plan « Le phare de Grimoire » (les murs) donne, une fois fini, le
 * fût du phare de référence et ses bandes (world/decor/phare.ts) ; le plan suivant (le toit) donne la galerie, la
 * lanterne et le cône. Tant qu'une étape n'est pas finie, ses cases posées restent des blocs taillés, en crème (le fût)
 * au lieu du verre provisoire.
 */
export const PHARE_DE_GRIMOIRE = {
  archipel: '6e',
  ile: 'tour',
  etapes: [
    { plan: 'tour-phare', pieces: ['anneau', 'fut'] },
    { plan: 'tour-lanterne', pieces: ['galerie', 'lanterne', 'toit'] },
  ],
} as const satisfies { archipel: ArchipelagoId; ile: string; etapes: readonly { plan: string; pieces: readonly PieceDuPhare[] }[] };
/** Le crème des cases posées du phare, tant que leur étape n'est pas finie. */
export const CREME_DU_PHARE: Couleur = COULEURS_DU_PHARE.fut;

/**
 * La couleur d'un rôle du kit d'architecture (lot 7 : poteau, remplissage, soubassement, bardage, pilotis, chaperon), de
 * jour : sous le voile de l'archipel, comme les matières ; délavée si l'île est fermée.
 */
export function couleurDuRole(a: ArchipelagoId, kit: Kit, role: Role, muted = false): Couleur {
  const [teinte, force] = ambianceDe(a).voile;
  const v = mixColor(kit.couleurs[role] ?? BRUME, teinte, force);
  return muted ? mixColor(v, DELAVE[0], DELAVE[1]) : v;
}

/**
 * Les couleurs des rôles que le shader peint sur les murs (`ROLES_PEINTS` : poteau, soubassement, chaperon), puis les
 * mêmes délavées, dans l'espace linéaire de Three.js : l'uniforme `uRoles` des blocs (three/construction.ts).
 */
export function couleursDesRoles(a: ArchipelagoId, kit: Kit = KITS[a]): Float32Array {
  const out: number[] = [];
  for (const muted of [false, true])
    for (const r of ROLES_PEINTS) {
      const k = rgb(couleurDuRole(a, kit, r, muted));
      out.push(lineaire(k[0] / 255), lineaire(k[1] / 255), lineaire(k[2] / 255));
    }
  return Float32Array.from(out);
}

// ---------- Les fonctions que le shader reprend ----------

const f32 = Math.fround;
const fract = (v: number) => f32(v - Math.floor(v));

/**
 * Le hasard d'une case, de 0 à 1, stable : le même calcul que `TEINTE_GLSL` (en flottants 32 bits), sur la case dans le
 * repère Three (X = x, Y = hauteur, Z = y). Le GPU peut arrondir autrement : la teinte d'un bloc reste stable d'une
 * image à l'autre, pas forcément identique au bit près à celle-ci.
 */
export function hasardDeCase(x: number, y: number, z: number): number {
  let px = fract(f32(x * f32(0.1031)));
  let py = fract(f32(z * f32(0.1031)));
  let pz = fract(f32(y * f32(0.1031)));
  // p += dot(p, p.zyx + 31.32)
  const k = f32(31.32);
  const d = f32(f32(f32(px * f32(pz + k)) + f32(py * f32(py + k))) + f32(pz * f32(px + k)));
  px = f32(px + d);
  py = f32(py + d);
  pz = f32(pz + d);
  return fract(f32(f32(px + py) * pz));
}

/** La teinte d'un bloc : un facteur de luminosité (sur la couleur affichée, sRGB), de 1 − `TEINTE` à 1 + `TEINTE`. */
export function teinteDeCase(x: number, y: number, z: number): number {
  return 1 + TEINTE * (2 * hasardDeCase(x, y, z) - 1);
}

/**
 * Le même calcul en GLSL : `teinteDeCase(floor(position - normal * 0.25))`, en coordonnées de l'objet (le maillage est
 * posé à l'origine du monde), rend le facteur à appliquer à la couleur linéaire (la puissance 2,2 fait ± 4 % sur la
 * couleur affichée).
 */
export const TEINTE_GLSL = `
float teinteDeCase(vec3 c) {
  vec3 p = fract(c * 0.1031);
  p += dot(p, p.zyx + 31.32);
  float h = fract((p.x + p.y) * p.z);
  return pow(1.0 + ${TEINTE.toFixed(3)} * (2.0 * h - 1.0), 2.2);
}
`;

/**
 * L'éclat d'une fenêtre ou d'une lanterne, de 0 (éteinte) à 1 (pleine lueur), selon le degré de nuit `n` (0 : plein
 * jour, 1 : nuit ; `1 - daylight().light`) et son décalage (de 0 à `DECALAGE_MAX` ; négatif : jamais allumée). Rien sous
 * `ALLUMAGE`, tout allumé à `PLEINE_NUIT` ; chaque fenêtre s'allume sur sa rampe, un peu après les autres selon son
 * décalage. Monotone en `n`, en douceur (pas de clignotement).
 */
export function eclatDeFenetre(n: number, decalage: number): number {
  if (decalage < 0) return 0;
  const debut = ALLUMAGE + Math.min(decalage, DECALAGE_MAX);
  const fin = Math.min(PLEINE_NUIT, debut + (PLEINE_NUIT - ALLUMAGE) - DECALAGE_MAX);
  const t = Math.min(1, Math.max(0, (n - debut) / (fin - debut)));
  return t * t * (3 - 2 * t);
}

/** Le même calcul en GLSL (`n` : uniforme, `decalage` : attribut par sommet). */
export const ECLAT_GLSL = `
float eclatDeFenetre(float n, float decalage) {
  if (decalage < 0.0) return 0.0;
  float debut = ${ALLUMAGE.toFixed(3)} + min(decalage, ${DECALAGE_MAX.toFixed(3)});
  float fin = min(${PLEINE_NUIT.toFixed(3)}, debut + ${(PLEINE_NUIT - ALLUMAGE - DECALAGE_MAX).toFixed(3)});
  return smoothstep(debut, fin, n);
}
`;

/**
 * L'opacité des fantômes, entre la nuit (`light` = 0) et le jour (1) : le remplissage (0,35 de jour, 0,45 de nuit)
 * et l'arête (70 % : à 50 %, les fantômes crème disparaissaient sur le marbre des Îles du Ciel).
 */
export function opaciteDesFantomes(light: number): { remplissage: number; arete: number } {
  const l = Math.min(1, Math.max(0, light));
  return { remplissage: 0.45 + (0.35 - 0.45) * l, arete: 0.7 };
}

// ---------- Le maillage ----------

/** Un groupe de la construction : un appel de dessin. Repère Three (X = x, Y = hauteur, Z = y). */
export interface GroupeDeConstruction {
  positions: Float32Array;
  normals: Float32Array;
  /** Couleurs par sommet, dans l'espace linéaire de Three.js (vides pour les fantômes : une couleur unie). */
  colors: Float32Array;
  indices: Uint32Array;
}

export interface GroupeDesFenetres extends GroupeDeConstruction {
  /** Par sommet : le décalage d'allumage (0 à `DECALAGE_MAX`), négatif pour une fenêtre qui ne s'allume jamais. */
  decalages: Float32Array;
}

export interface GroupeDesFantomes extends GroupeDeConstruction {
  /** Par sommet : ses coordonnées sur le plan de sa face, en cases (l'arête d'une case est là où elles sont entières). */
  uvs: Float32Array;
}

export interface GroupeOpaque extends GroupeDeConstruction {
  /**
   * Le biseau peint (mode `peint`) : par sommet, quatre distances (en cases) du sommet aux quatre bords de son rectangle,
   * côté u−, u+, v−, v+ (voir `TANGENTES`), ou `SANS_BISEAU` pour un bord qui n'est pas une arête saillante. Vide dans
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
   * Par sommet : le motif peint (0 : aucun). Celui d'un mur ou d'une pièce d'architecture (./architecture/peinture.ts,
   * `MOTIF`, en bits, sous `MOTIF_ASSEMBLE_DEBUT`) : le shader y peint le colombage, le bardage, le soubassement et le
   * chaperon. Celui d'un bloc assemblé (GD-2, `MOTIF_ASSEMBLE`, à partir de `MOTIF_ASSEMBLE_DEBUT`) : le shader y peint
   * sa forme (`MOTIF_ASSEMBLE_GLSL`). Ni l'un ni l'autre n'ajoute un triangle.
   */
  motifs: Float32Array;
}

/** Des triangles de l'opaque (de, à) qui remplacent des cases : les cases de chaque triangle, pour le toucher. */
export interface TrancheDesPieces {
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
   * Les ponts de pierre et de bois du 5e (./ponts.ts) : leur tranche du groupe opaque (triangles), une par île (mis bout
   * à bout, les îles en donnent plusieurs).
   */
  ponts?: { opaque: [number, number] }[];
  /** Le phare du large du 5e (./phareDuLarge.ts), fini : comme `phare`, ses triangles et les cases du monument. */
  phareDuLarge?: { opaque: [number, number]; fenetres: [number, number]; cellules: Cell[] };
  /** Les pièces d'architecture (./architecture/) : leurs triangles de l'opaque et la case de chacun, une tranche par île. */
  pieces?: TrancheDesPieces[];
}

export interface OptionsDeLaConstruction {
  /**
   * Le biseau des arêtes saillantes : `peint` (par défaut : le shader incline la normale sur une bande de `largeur` le
   * long des arêtes saillantes, sans un triangle de plus), `taille` (en géométrie : bandes, coins et bouts ; trop cher
   * pour un archipel, gardé pour un petit modèle comme le Bloc-Navire), `aucun`.
   */
  biseau?: 'peint' | 'taille' | 'aucun';
  /** La largeur du biseau, en part de case. */
  largeur?: number;
  /** Fusionner les faces coplanaires d'une même couleur (sinon une face par bloc). */
  fusion?: boolean;
  /** Dessiner aussi les bornes (sinon elles sont laissées au poste « Bornes », instanciées à part). */
  bornes?: boolean;
  /** Les cubes du Bloc-Navire : sa toile prend le crème Brume (et rien n'y devient pièce d'architecture). */
  navire?: boolean;
  /** Le kit d'architecture (lot 7, ./architecture/kits/) : par défaut, celui de l'archipel. */
  kit?: Kit;
  /**
   * Le sol entier, case par case, quand `sol` n'en donne qu'une partie (`construireParIle` ne passe à une île que le
   * sol sous ses blocs) : les pilotis cherchent le sol jusqu'à `PROFONDEUR` cases plus bas, pas seulement juste dessous.
   */
  solEntier?: (x: number, y: number, z: number) => VoxelCube | undefined;
}

/** Le genre d'un bloc dans la construction. */
export type Genre = 'bloc' | 'vitre' | 'lanterne' | 'fantome';

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

const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** La distance d'un bord qui n'est pas une arête saillante, dans `biseaux`. */
export const SANS_BISEAU = 64;

/**
 * Les deux axes (u, v) du plan d'une face, selon l'axe de sa normale, dans le repère Three : le shader du biseau peint
 * les retrouve de la normale. Normale selon X : (Z, Y) ; selon Y : (X, Z) ; selon Z : (X, Y).
 */
export const TANGENTES: Record<'x' | 'y' | 'z', [V3, V3]> = {
  x: [
    [0, 0, 1],
    [0, 1, 0],
  ],
  y: [
    [1, 0, 0],
    [0, 0, 1],
  ],
  z: [
    [1, 0, 0],
    [0, 1, 0],
  ],
};

const TOITURES = new Set(['toit', 'tuile']);
const LUMIERES = new Set(['lanterne', 'verre']);

const srgbVersLineaire = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const lineaireVersSrgb = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);

/**
 * La couleur (sRGB) au bord saillant d'une face de couleur `c`, là où le biseau peint est plein : +`ECLAT_DU_BISEAU` de
 * lumière, et, sur une teinte sombre, au moins +`ECART_SOMBRE` niveaux par canal (le même calcul que `BISEAU_GLSL`).
 * Toujours plus clair, jamais plus sombre.
 */
export function eclatDuBiseau(c: Couleur): Couleur {
  const k = rgb(c).map((v) => v / 255);
  const lin = k.map(srgbVersLineaire);
  const sombre = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2] < SOMBRE;
  const out = lin.map((l, i) => {
    let f = l * (1 + ECLAT_DU_BISEAU);
    if (sombre) f = Math.max(f, srgbVersLineaire(Math.min(1, k[i] + ECART_SOMBRE / 255)));
    return Math.round(Math.min(1, lineaireVersSrgb(Math.min(1, f))) * 255);
  });
  return (out[0] << 16) | (out[1] << 8) | out[2];
}

/**
 * Le biseau peint en GLSL : \`biseauPeint(c, k, force)\` rend la couleur linéaire \`c\` éclaircie à la part \`k\` de la bande
 * (\`force\` : \`ECLAT_DU_BISEAU\`, 0 pour l'éteindre). Les fonctions sRGB sont celles de Three.js.
 */
export const BISEAU_GLSL = `
vec3 biseauPeint(vec3 c, float k, float force) {
  vec3 fort = c * (1.0 + force);
  if (force > 0.0 && dot(c, vec3(0.2126, 0.7152, 0.0722)) < ${SOMBRE.toFixed(2)}) {
    vec3 s = sRGBTransferOETF(vec4(c, 1.0)).rgb + ${(ECART_SOMBRE / 255).toFixed(5)};
    fort = max(fort, sRGBTransferEOTF(vec4(min(s, vec3(1.0)), 1.0)).rgb);
  }
  return mix(c, fort, k);
}
`;

// ---------- Les motifs des blocs assemblés (GD-2) ----------

/**
 * Le premier motif des blocs assemblés : le bit au-dessus de tous ceux d'un mur peint (./architecture/peinture.ts,
 * `MOTIF`), si bien qu'aucun mur peint, quels que soient ses drapeaux, ne peut se lire comme un bloc assemblé, ni
 * l'inverse. Il suit `MOTIF` s'il gagne un drapeau.
 */
export const MOTIF_ASSEMBLE_DEBUT = 2 * Math.max(...Object.values(MOTIF));

/**
 * Le motif peint de chaque bloc assemblé, par sommet (l'attribut `motifs`, qu'il partage avec les murs peints du lot 7 :
 * les blocs assemblés prennent `MOTIF_ASSEMBLE_DEBUT` + 1 à + 4, au-delà de leurs bits ; 1025 à 1028 aujourd'hui, des
 * entiers exacts en flottant). Il se peint dans le shader, sans un triangle de plus, par-dessus la couleur de fond du
 * bloc (world/palette.ts, `MATIERES`) : deux blocs ne se distinguent jamais par la couleur seule. Un bloc délavé (île
 * fermée) n'a pas de motif.
 */
export const MOTIF_ASSEMBLE = {
  poutre: MOTIF_ASSEMBLE_DEBUT + 1,
  vitrail: MOTIF_ASSEMBLE_DEBUT + 2,
  engrenage: MOTIF_ASSEMBLE_DEBUT + 3,
  miroir: MOTIF_ASSEMBLE_DEBUT + 4,
} as const;
export type BlocAssemble = keyof typeof MOTIF_ASSEMBLE;

/** Les mesures des motifs, en part de case, depuis le milieu de la face (le même dessin en JS et en GLSL). */
export const MESURES_DES_MOTIFS = {
  /** Le madrier : deux veines en long, et un collier à mi-hauteur ; sur le dessus, un cerne. */
  poutre: { veines: [-0.22, 0.18], veine: 0.025, collier: 0.09, cerne: 0.28, epaisseurDuCerne: 0.035 },
  /** Le hublot : un disque de verre dans son bord sombre, un reflet en haut à gauche. */
  vitrail: { bord: 0.35, verre: 0.3, reflet: [-0.1, 0.1, 0.07] },
  /** La poulie : la roue, sa gorge, son axe. */
  engrenage: { roue: 0.38, gorge: 0.26, epaisseurDeGorge: 0.035, axe: 0.07 },
  /** La loupe : l'anneau, le verre, l'éclat, et le manche vers le coin bas-droit. */
  miroir: { anneau: 0.32, verre: 0.23, eclat: [-0.08, 0.08, 0.06], manche: [0.2, -0.2, 0.46, -0.46], epaisseurDuManche: 0.05 },
} as const;

/** Le détail peint au point (`u`, `v`) d'une face d'un bloc assemblé, de −0,5 à 0,5 depuis son milieu (`v` monte sur un côté) ; `null` : son fond. */
export function detailDuMotif(bloc: BlocAssemble, u: number, v: number, dessus: boolean): string | null {
  const r = Math.hypot(u, v);
  if (bloc === 'poutre') {
    const M = MESURES_DES_MOTIFS.poutre;
    if (dessus) return Math.abs(r - M.cerne) < M.epaisseurDuCerne ? 'veine' : null;
    if (Math.abs(v) < M.collier) return 'collier';
    return M.veines.some((x) => Math.abs(u - x) < M.veine) ? 'veine' : null;
  }
  if (bloc === 'vitrail') {
    const M = MESURES_DES_MOTIFS.vitrail;
    if (Math.hypot(u - M.reflet[0], v - M.reflet[1]) < M.reflet[2]) return 'reflet';
    return r < M.verre ? 'verre' : r < M.bord ? 'bord' : null;
  }
  if (bloc === 'engrenage') {
    const M = MESURES_DES_MOTIFS.engrenage;
    if (r < M.axe || Math.abs(r - M.gorge) < M.epaisseurDeGorge) return 'gorge';
    return r < M.roue ? 'roue' : null;
  }
  const M = MESURES_DES_MOTIFS.miroir;
  if (Math.hypot(u - M.eclat[0], v - M.eclat[1]) < M.eclat[2]) return 'eclat';
  if (r < M.verre) return 'verre';
  if (r < M.anneau) return 'laiton';
  const [ax, ay, bx, by] = M.manche;
  const t = Math.min(1, Math.max(0, ((u - ax) * (bx - ax) + (v - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
  return Math.hypot(u - ax - (bx - ax) * t, v - ay - (by - ay) * t) < M.epaisseurDuManche ? 'laiton' : null;
}

const glslLin = (c: Couleur) => {
  const [r, g, b] = rgb(c).map((v) => srgbVersLineaire(v / 255).toFixed(4));
  return `vec3(${r}, ${g}, ${b})`;
};
const f3 = (v: number) => v.toFixed(3);

/**
 * Les motifs en GLSL : `motifAssemble(c, m, pos, n)` peint le bloc assemblé `m` (son rang : 1 poutre, 2 vitrail,
 * 3 engrenage, 4 miroir ; 0 : aucun) sur la couleur linéaire `c`, à la position `pos` d'une face de normale `n` (repère
 * Three). Le shader lui passe `motif − MOTIF_ASSEMBLE_DEBUT` pour un bloc assemblé, 0 sinon (three/construction.ts).
 * Bords adoucis sur un pixel ; de loin, quand une case tient en moins de 12 pixels, le motif s'efface vers le fond (rien
 * sous 6 pixels) : jamais de moiré. Les dérivées se prennent avant tout branchement.
 */
export const MOTIF_ASSEMBLE_GLSL = (() => {
  const D = DETAILS_ASSEMBLES;
  const P = MESURES_DES_MOTIFS;
  return `
float dansLeMotif(float d, float fw) { return 1.0 - smoothstep(-fw, fw, d); }
vec3 motifAssemble(vec3 c, float m, vec3 pos, vec3 n) {
  vec3 an = abs(n);
  bool dessus = an.y > 0.5;
  vec2 q = an.x > 0.5 ? pos.zy : (dessus ? pos.xz : pos.xy);
  vec2 fq = fwidth(q);
  float fw = max(max(fq.x, fq.y), 1e-5);
  if (m < 0.5) return c;
  float k = clamp((1.0 / fw - 6.0) / 6.0, 0.0, 1.0);
  vec2 p = fract(q) - 0.5;
  float r = length(p);
  if (m < 1.5) {
    if (dessus) return mix(c, ${glslLin(D.poutre.veine)}, dansLeMotif(abs(r - ${f3(P.poutre.cerne)}) - ${f3(P.poutre.epaisseurDuCerne)}, fw) * k);
    float v = min(abs(p.x - (${f3(P.poutre.veines[0])})), abs(p.x - ${f3(P.poutre.veines[1])})) - ${f3(P.poutre.veine)};
    c = mix(c, ${glslLin(D.poutre.veine)}, dansLeMotif(v, fw) * k);
    return mix(c, ${glslLin(D.poutre.collier)}, dansLeMotif(abs(p.y) - ${f3(P.poutre.collier)}, fw) * k);
  }
  if (m < 2.5) {
    c = mix(c, ${glslLin(D.vitrail.bord)}, dansLeMotif(r - ${f3(P.vitrail.bord)}, fw) * k);
    c = mix(c, ${glslLin(D.vitrail.verre)}, dansLeMotif(r - ${f3(P.vitrail.verre)}, fw) * k);
    return mix(c, ${glslLin(D.vitrail.reflet)}, dansLeMotif(length(p - vec2(${f3(P.vitrail.reflet[0])}, ${f3(P.vitrail.reflet[1])})) - ${f3(P.vitrail.reflet[2])}, fw) * k);
  }
  if (m < 3.5) {
    c = mix(c, ${glslLin(D.engrenage.roue)}, dansLeMotif(r - ${f3(P.engrenage.roue)}, fw) * k);
    c = mix(c, ${glslLin(D.engrenage.gorge)}, dansLeMotif(abs(r - ${f3(P.engrenage.gorge)}) - ${f3(P.engrenage.epaisseurDeGorge)}, fw) * k);
    return mix(c, ${glslLin(D.engrenage.gorge)}, dansLeMotif(r - ${f3(P.engrenage.axe)}, fw) * k);
  }
  vec2 a = vec2(${f3(P.miroir.manche[0])}, ${f3(P.miroir.manche[1])});
  vec2 ab = vec2(${f3(P.miroir.manche[2])}, ${f3(P.miroir.manche[3])}) - a;
  float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
  c = mix(c, ${glslLin(D.miroir.laiton)}, dansLeMotif(length(p - a - ab * t) - ${f3(P.miroir.epaisseurDuManche)}, fw) * k);
  c = mix(c, ${glslLin(D.miroir.laiton)}, dansLeMotif(r - ${f3(P.miroir.anneau)}, fw) * k);
  c = mix(c, ${glslLin(D.miroir.verre)}, dansLeMotif(r - ${f3(P.miroir.verre)}, fw) * k);
  return mix(c, ${glslLin(D.miroir.eclat)}, dansLeMotif(length(p - vec2(${f3(P.miroir.eclat[0])}, ${f3(P.miroir.eclat[1])})) - ${f3(P.miroir.eclat[2])}, fw) * k);
}
`;
})();

/**
 * Le genre de chaque bloc : une vitre est une lanterne ou un verre pris dans un mur (deux blocs pleins de part et
 * d'autre sur une rangée, un bloc de la construction dessous, pas de toit dessus : les fenêtres de world/architect.ts,
 * celles de l'école) ; les autres lanternes (cours, comptoirs, sommets, la lanterne d'un phare sous son toit) restent
 * des lanternes ; le reste est un bloc.
 */
export function genresDesBlocs(cubes: VoxelCube[]): Map<VoxelCube, Genre> {
  const plein = new Map<string, VoxelCube>();
  for (const c of cubes) if (!c.ghost) plein.set(cle(c.x, c.y, c.z), c);
  const mur = (x: number, y: number, z: number) => {
    const n = plein.get(cle(x, y, z));
    return n !== undefined && !LUMIERES.has(n.texture ?? '');
  };
  const out = new Map<VoxelCube, Genre>();
  for (const c of cubes) {
    if (c.ghost) {
      out.set(c, 'fantome');
      continue;
    }
    if (!LUMIERES.has(c.texture ?? '')) {
      out.set(c, 'bloc');
      continue;
    }
    const dessus = plein.get(cle(c.x, c.y, c.z + 1));
    const pris =
      ((mur(c.x - 1, c.y, c.z) && mur(c.x + 1, c.y, c.z)) || (mur(c.x, c.y - 1, c.z) && mur(c.x, c.y + 1, c.z))) &&
      mur(c.x, c.y, c.z - 1) &&
      !(dessus && TOITURES.has(dessus.texture ?? ''));
    out.set(c, pris ? 'vitre' : c.texture === 'lanterne' ? 'lanterne' : 'bloc');
  }
  return out;
}

/** Le bâtiment d'un bloc, pour compter ses vitres allumées : son île et son lieu. */
const batimentDe = (c: VoxelCube) => `${c.tag ?? ''}|${c.place ?? ''}`;

/**
 * Les décalages d'allumage des vitres et des lanternes : `FENETRES_ALLUMEES` vitres par bâtiment, `LANTERNES_ALLUMEES`
 * lanternes par cour (une île et un lieu), rien sur une île fermée.
 */
function decalagesDe(genres: Map<VoxelCube, Genre>): Map<VoxelCube, number> {
  const out = new Map<VoxelCube, number>();
  const parBatiment = new Map<string, VoxelCube[]>();
  for (const [c, g] of genres) {
    if (g !== 'vitre' && g !== 'lanterne') continue;
    const d = c.muted ? -1 : DECALAGE_MAX * hasardDeCase(c.x + 17, c.y + 5, c.z + 11);
    out.set(c, d);
    if (c.muted) continue;
    const b = `${g}|${batimentDe(c)}`;
    const list = parBatiment.get(b);
    if (list) list.push(c);
    else parBatiment.set(b, [c]);
  }
  for (const [b, list] of parBatiment) {
    const rang = list.map((c) => ({ c, h: hasardDeCase(c.x, c.y + 31, c.z + 7) })).sort((p, q) => p.h - q.h);
    for (const { c } of rang.slice(b.startsWith('vitre') ? FENETRES_ALLUMEES : LANTERNES_ALLUMEES)) out.set(c, -1);
  }
  return out;
}

/**
 * Les tours du décor du cœur que le rendu Archipéo ne dessine pas (décision du directeur artistique, lot R5) : un seul
 * phare par île. Sur l'île de la Tour (6e), la tour de verre à sommet d'or cachait le pied du phare de Grimoire ; sur
 * l'île du Phare (3e), la petite tour de pierre à lanterne doublait le grand phare. Cases du cœur (world/decor.ts,
 * `DECOR`), que Blocland garde : son dessin ne change pas.
 */
export const TOURS_DU_COEUR: Partial<Record<string, readonly (readonly [number, number])[]>> = {
  tour: [
    [8, 4],
    [9, 4],
    [8, 5],
    [9, 5],
  ],
  phare: [[9, 3]],
};

/** Les cubes du monde sans les tours du décor du cœur (`TOURS_DU_COEUR`) : le rendu Archipéo seulement. */
export function sansToursDuCoeur(cubes: VoxelCube[]): VoxelCube[] {
  const retirees = new Set<string>();
  for (const [ile, cases] of Object.entries(TOURS_DU_COEUR)) {
    const o = origineDe(ile as Parameters<typeof origineDe>[0]);
    for (const [dx, dy] of cases ?? []) retirees.add(`${ile}|${o.x + LAYOUT_PAD.x + dx},${o.y + LAYOUT_PAD.y + dy}`);
  }
  return cubes.filter((c) => c.sol || c.decor || c.ghost || !retirees.has(`${c.tag}|${c.x},${c.y}`));
}

/** Les vitres et les lanternes d'un monde, et leur décalage d'allumage. */
export type FenetresDuMonde = Map<VoxelCube, { genre: 'vitre' | 'lanterne'; decalage: number }>;

/**
 * Les vitres et les lanternes d'un monde, avec leur décalage d'allumage (négatif : jamais allumée) : pour la 2D peinte,
 * qui les allume selon le même `eclatDeFenetre` que la 3D. Les bornes n'en ont pas, ni les cases que le phare de
 * Grimoire remplace en 3D.
 */
export function fenetresDe(cubes: VoxelCube[]): FenetresDuMonde {
  // Les cases que le phare de Grimoire remplace en 3D ne s'allument pas (sa lanterne est à lui).
  const phare = phareDeGrimoire(cubes);
  const genres = genresDesBlocs(cubes.filter((c) => !c.quest && !c.sol && !phare?.remplacees.has(cle(c.x, c.y, c.z))));
  const decalages = decalagesDe(genres);
  const out = new Map<VoxelCube, { genre: 'vitre' | 'lanterne'; decalage: number }>();
  for (const [c, g] of genres) if (g === 'vitre' || g === 'lanterne') out.set(c, { genre: g, decalage: decalages.get(c) ?? -1 });
  return out;
}

/** Le phare de Grimoire dans un monde : les cases que le modèle remplace, celles encore en chantier, et sa pose. */
export interface PhareDeGrimoire {
  /** Les cases des étapes finies (clés `x,y,z`), que le modèle remplace. */
  remplacees: Set<string>;
  /** Les cases des étapes pas encore finies. */
  enCours: Set<string>;
  /** Les cases remplacées, pour le toucher. */
  cellules: Cell[];
  /** Où poser le modèle, et ses pièces (vides tant qu'aucune étape n'est finie). */
  pose: PoseDuPhare;
}

/**
 * Le phare de Grimoire, s'il est dans ce monde : ses étapes, finies ou non, lues sur les cubes (une étape est finie
 * quand toutes ses cases sont posées). Posé au centre de l'emprise de la tour (ses murs), pied au sol. `null` hors du
 * 6e ou tant que la tour n'a aucune case dans le monde (une île fermée ne montre pas ses plans ; l'île de la Tour
 * n'existe qu'au 6e).
 */
export function phareDeGrimoire(cubes: VoxelCube[], a: ArchipelagoId = PHARE_DE_GRIMOIRE.archipel): PhareDeGrimoire | null {
  const P = PHARE_DE_GRIMOIRE;
  if (a !== P.archipel) return null;
  const tour = new Map<string, VoxelCube>();
  for (const c of cubes) if (c.tag === P.ile && !c.quest) tour.set(cle(c.x, c.y, c.z), c);
  if (!tour.size) return null;
  const def = islandDef(P.ile);
  const remplacees = new Set<string>();
  const enCours = new Set<string>();
  const cellules: Cell[] = [];
  const pieces = new Set<PieceDuPhare>();
  let emprise: Cell[] | null = null;
  let muted = false;
  for (const e of P.etapes) {
    const plan = getPlan(e.plan);
    if (!plan) continue;
    const cases = planCells(plan).map((c) => ({ x: def.core.x + c.x, y: def.core.y + c.y, z: def.altitude + c.z + 1 }));
    emprise ??= cases;
    const posees = cases.map((c) => tour.get(cle(c.x, c.y, c.z)));
    // Une étape pas encore dans le monde (la précédente n'est pas finie) : les suivantes non plus.
    if (posees.some((c) => !c)) break;
    muted ||= posees.some((c) => c?.muted);
    const finie = posees.every((c) => !c?.ghost);
    for (const c of cases) (finie ? remplacees : enCours).add(cle(c.x, c.y, c.z));
    if (finie) {
      cellules.push(...cases);
      for (const p of e.pieces) pieces.add(p);
    }
  }
  if (!emprise || (!remplacees.size && !enCours.size)) return null;
  return { remplacees, enCours, cellules, pose: poseDuPhare(a, emprise, pieces, muted) };
}

/** La pose du phare du 6e sur l'emprise de sa tour : au centre, pied au sol, sans socle. */
function poseDuPhare(a: ArchipelagoId, emprise: Cell[], pieces: Set<PieceDuPhare>, muted: boolean): PoseDuPhare {
  const xs = emprise.map((c) => c.x);
  const ys = emprise.map((c) => c.y);
  const pied = Math.min(...emprise.map((c) => c.z));
  const { H, r, emprise: cote } = PHARES['6e'];
  return {
    cx: (Math.min(...xs) + Math.max(...xs) + 1) / 2,
    cz: (Math.min(...ys) + Math.max(...ys) + 1) / 2,
    pied,
    y: pied,
    H,
    r,
    emprise: cote,
    // Huit pans : deux faces à plat vers la caméra (face au sud et à l'est).
    rot: Math.PI / 8,
    pierre: couleurDeMatiere(a, 'pierre'),
    verre: couleurDeMatiere(a, 'verre'),
    muted,
    pieces,
  };
}

/** Les étapes d'un bâtiment qui prennent le kit d'architecture : les murs et le toit (world/architect.ts, `Stages`). */
export const ETAPES_DU_BATIMENT = 2;

const batiments = new Map<ArchipelagoId, ReadonlyMap<string, string>>();

/**
 * Les bâtiments des îles d'un archipel (lot 7b), entiers, posés ou non : les cases des murs et du toit de chaque île
 * (clé `x,y,z` du monde) et la texture de leur bloc. La cour (barrières, jardinières, quai, ponton), la jetée du port,
 * le décor, les ponts, les bornes et les monuments n'y sont pas : ils gardent leur dessin ; l'école et la salle des
 * trophées non plus (elles prennent le kit par `caseDuLieu`).
 */
export function batimentsDe(a: ArchipelagoId): ReadonlyMap<string, string> {
  const deja = batiments.get(a);
  if (deja) return deja;
  const out = new Map<string, string>();
  for (const def of mapOf(a))
    for (const plan of plansFor(def.id).slice(0, ETAPES_DU_BATIMENT))
      // Comme world/terrain.ts : la case (x, y, z) d'un plan est posée en (cœur + x, cœur + y, altitude + z + 1).
      for (const c of planCells(plan)) out.set(`${def.core.x + c.x},${def.core.y + c.y},${def.altitude + c.z + 1}`, BLOCKS[c.block].texture);
  batiments.set(a, out);
  return out;
}

/** Le coin de chaque lieu du village posé (clé `<lieu>|<île>`) : x, y, et z du rang posé sur le sol (`null` ailleurs). */
const coinsDesLieux = new Map<string, { x: number; y: number; z: number } | null>();

/**
 * La case d'un bloc de l'école ou de la salle des trophées dans le modèle de son lieu (world/terrain.ts : `schoolModel`,
 * `trophyModel`, et les trophées posés), relative à son coin ; `null` hors du modèle (le soubassement qui rattrape une
 * marche du sol) ou hors d'un lieu du village (un monument).
 */
export function caseDuLieu(c: VoxelCube): CaseDuLieu | null {
  if (!estUnLieuDuVillage(c.place) || !c.tag) return null;
  const k = `${c.place}|${c.tag}`;
  let coin = coinsDesLieux.get(k);
  if (coin === undefined) {
    const ile = c.tag as BiomeId;
    const s = placeSpot(c.place, ile);
    coin = s && { x: s.x, y: s.y, z: islandDef(ile).altitude + s.h };
    coinsDesLieux.set(k, coin);
  }
  if (!coin) return null;
  const z = c.z - coin.z;
  if (z < 1) return null;
  const { w, d } = VILLAGE_PLACES[c.place].size;
  return { x: c.x - coin.x, y: c.y - coin.y, z, w, d, texture: c.texture ?? '' };
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
   * Des facettes déjà tracées (le phare, world/decor/phare.ts) : repère Three, couleurs linéaires, trois sommets par
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
  const mode = options.biseau ?? 'peint';
  const b = mode === 'aucun' ? 0 : (options.largeur ?? BISEAU);
  /** Les faces rentrent sous le biseau taillé ; le biseau peint ne change pas la géométrie. */
  const retrait = mode === 'taille' ? b : 0;
  const fusion = options.fusion ?? true;
  // Le phare de Grimoire : ses étapes finies laissent la place au modèle (dessiné à la fin).
  const phare = options.navire ? null : phareDeGrimoire(cubes, a);
  // Les ponts de pierre et de bois du 5e : un pont construit laisse la place à son modèle (./ponts.ts).
  const ponts = options.navire ? null : pontsDePierreEtDeBois(cubes);
  // Le phare du large du 5e : fini, il laisse la place à son modèle (./phareDuLarge.ts).
  const large = options.navire ? null : phareDuLarge(cubes);
  const parUnModele = (c: VoxelCube) => {
    const k = cle(c.x, c.y, c.z);
    return Boolean(phare?.remplacees.has(k) || ponts?.remplacees.has(k) || large?.remplacees.has(k));
  };
  // L'architecture modulaire (lot 7) : le voisinage se lit sur le plan entier (tous les cubes, fantômes compris) ; les
  // cases déjà prises par un modèle restent au modèle, et celles du phare de Grimoire en chantier à leur bloc. Seuls les
  // plans des îles prennent le kit de l'archipel (un kit passé à la main, celui d'un test, prend tout le plan).
  const kit = options.kit ?? KITS[a];
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
        exclure: (c) => parUnModele(c) || Boolean(phare?.enCours.has(cle(c.x, c.y, c.z))),
        kit,
        batiments: options.kit ? undefined : batimentsDe(a),
        surLeVide,
        caseDuLieu,
      });
  const avantLesPieces = cubes.filter((c) => (options.bornes || !c.quest) && !parUnModele(c));
  const dessines = archi?.remplacees.size ? avantLesPieces.filter((c) => !archi.remplacees.has(cle(c.x, c.y, c.z))) : avantLesPieces;
  // Le genre des blocs se lit avant les pièces : une vitre prise entre deux pièces de mur reste une vitre (comme en 2D).
  const genres = genresDesBlocs(avantLesPieces);
  const decalages = decalagesDe(genres);
  // Un fantôme ne cache rien, ni une lanterne (elle ne remplit plus sa case).
  const plein = new Map<string, VoxelCube>();
  for (const c of dessines) if (!c.ghost && genres.get(c) !== 'lanterne') plein.set(cle(c.x, c.y, c.z), c);
  const sous = new Set(sol.map((c) => cle(c.x, c.y, c.z)));

  // Les couleurs d'un bloc, de jour.
  const vues = new Map<string, Faces>();
  /** Une case posée du phare de Grimoire, dans une étape pas encore finie : du crème, au lieu du verre provisoire. */
  const cremeDuPhare = (c: VoxelCube) => c.texture === 'verre' && phare !== null && phare.enCours.has(cle(c.x, c.y, c.z));
  /** Le mur peint d'un bloc (lot 7), s'il en est un. */
  const peintDe = (c: VoxelCube) => (archi?.peints.size ? archi.peints.get(cle(c.x, c.y, c.z)) : undefined);
  const couleursDe = (c: VoxelCube): Faces => {
    const g = genres.get(c);
    const fond = peintDe(c)?.peinture.fond ?? '';
    // Un toit prend la couverture de son île ; un bloc d'un lieu aussi, quand le kit le dit (le toit de la salle des trophées).
    const couvert = c.texture === 'toit' || Boolean(c.place && archi?.couverts.has(cle(c.x, c.y, c.z)));
    // Un bloc d'un lieu peut prendre la couleur d'une autre matière (la souche du clocheton, en pierre de taille).
    const repeint = c.place ? archi?.matieres.get(cle(c.x, c.y, c.z)) : undefined;
    const k = `${repeint ?? ''}|${c.texture ?? ''}|${c.color}|${c.top ?? ''}|${c.muted ? 1 : 0}|${couvert ? `toit:${c.tag}` : ''}|${g}|${cremeDuPhare(c) ? 1 : 0}|${fond}`;
    let f = vues.get(k);
    if (f) return f;
    const delave = (x: Faces): Faces => (c.muted ? { dessus: mixColor(x.dessus, DELAVE[0], DELAVE[1]), cote: mixColor(x.cote, DELAVE[0], DELAVE[1]) } : x);
    const role = fond === 'remplissage' || fond === 'bardage' || fond === 'soubassement' ? couleurDuRole(a, kit, fond, c.muted) : null;
    if (role !== null) f = { dessus: role, cote: role };
    else if (repeint) f = delave(couleurDeMatiere(a, repeint));
    else if (couvert) f = couleursDuToit(a, c.tag, c.muted);
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
    vues.set(k, f);
    return f;
  };
  const couleurDeFace = (c: VoxelCube, d: number) => (d === HAUT ? couleursDe(c).dessus : couleursDe(c).cote);

  /** Le bit, dans le masque `couvre` d'une pièce (./architecture/pieces.ts), de la face de sa case tournée vers `d`. */
  const FACE_DE_CASE = [1, 4, 2, 8, 16, 32];
  /** L'ordre des faces d'une peinture (./architecture/peinture.ts : +x, +y, −x, −y, haut, bas) pour la direction `d`. */
  const FACE_PEINTE = [0, 2, 1, 3, 4, 5];
  /**
   * Le motif de la face `d` d'un bloc : celui d'un bloc assemblé (GD-2, `MOTIF_ASSEMBLE`, aucun sur une île fermée), sinon
   * celui de son mur peint, délavé sur une île fermée ; 0 hors d'un mur peint.
   */
  const motifDe = (c: VoxelCube, d: number) => {
    if (c.texture && c.texture in MOTIF_ASSEMBLE && genres.get(c) === 'bloc') return c.muted ? 0 : MOTIF_ASSEMBLE[c.texture as BlocAssemble];
    const m = peintDe(c)?.peinture.motifs[FACE_PEINTE[d]] ?? 0;
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
    return true;
  };
  /** La teinte à porter par sommet : 0 sur la grille (le shader la calcule), celle de sa case d'origine hors de la grille. */
  const teinteDe = (c: VoxelCube) =>
    Number.isInteger(c.x) && Number.isInteger(c.y) && Number.isInteger(c.z) ? 0 : teinteDeCase(Math.floor(c.x), Math.floor(c.y), Math.floor(c.z));
  const taille = (c: VoxelCube) => b > 0 && genres.get(c) === 'bloc';
  /** Le verre hors d'un mur porte une arête par case (dessinée par le shader). */
  const areteDe = (c: VoxelCube) => (c.texture === 'verre' && genres.get(c) === 'bloc' && !cremeDuPhare(c) ? 1 : 0);
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
   * Le fantôme d'une case de pont à restaurer (./ponts.ts) : une boîte plus courte que la case le long du tracé et moins
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

  // ---- Les faces des blocs, des vitres et des lanternes.
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
    const ordre = [...cases.values()].sort((p, q) => p.v - q.v || p.u - q.u);
    for (const s of ordre) {
      if (s.fait) continue;
      const at = (u: number, v: number) => {
        const x = cases.get(`${u},${v}`);
        return x && !x.fait && x.couleur === s.couleur && x.teinte === s.teinte && x.arete === s.arete && x.motif === s.motif ? x : undefined;
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
      // Puis le long de v, rangée par rangée.
      let v1 = s.v;
      for (;;) {
        const rangee: Case[] = [];
        for (let u = s.u; u <= u1; u++) {
          const n = at(u, v1 + 1);
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
      }
      for (let v = s.v; v <= v1; v++)
        for (let u = s.u; u <= u1; u++) {
          const c = cases.get(`${u},${v}`);
          if (c) c.fait = true;
        }
      if (groupe === 'g') fantome(d, plan, s.u, u1 + 1, s.v, v1 + 1);
      else rectangle(O, d, plan, s.u, u1 + 1, s.v, v1 + 1, [bords.gauche, bords.droite, bords.bas, bords.haut], s.couleur, undefined, s.teinte, s.arete, s.motif);
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
    // cadre jaune posé sur le pan, que le shader peint en hublot (`MOTIF_ASSEMBLE.vitrail`). Deux triangles chacun ; aucun sur une île fermée.
    if (!large.pose.muted) {
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
      const couleurs = couleursDe(c);
      const col = f.role ? couleurDuRole(a, kit, f.role, c.muted) : f.face === 'dessus' ? couleurs.dessus : couleurs.cote;
      const motif = f.motif && c.muted ? f.motif | MOTIF.delave : (f.motif ?? 0);
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
  return m;
}

/** Triangles et appels de dessin de la construction (un appel par groupe non vide). */
export function coutDeLaConstruction(m: MaillageDeLaConstruction): { triangles: number; drawCalls: number; opaque: number; fantomes: number; fenetres: number } {
  const t = (g: GroupeDeConstruction) => g.indices.length / 3;
  const groupes = [m.opaque, m.fantomes, m.fenetres];
  return {
    triangles: groupes.reduce((n, g) => n + t(g), 0),
    drawCalls: groupes.filter((g) => g.indices.length > 0).length,
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
 * - le phare de Grimoire ou le phare du large : la case remplacée la plus proche du point touché.
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
  // Le phare de Grimoire, ou le phare du large : celui dont les triangles contiennent le triangle touché.
  const p = [m.phare, m.phareDuLarge].find((q) => q && triangle >= q[groupe][0] && triangle < q[groupe][1] && q.cellules.length);
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
}

export const cacheDeLaConstruction = (): CacheDeLaConstruction => ({ iles: new Map(), sol: -1 });

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
  if (cache.sol !== sol.length) {
    cache.iles.clear();
    cache.sol = sol.length;
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
export const PILIER = { corps: [0.2, 0.8], hautDuCorps: 1.3, tete: [0.08, 0.92], chanfrein: 0.12, haut: 2 } as const;

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
