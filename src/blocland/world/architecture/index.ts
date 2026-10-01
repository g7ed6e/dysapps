// L'architecture modulaire d'Archipéo (lot 7, docs/conception/cadrage-archipeo.md) : les blocs posés des plans
// deviennent des pièces d'architecture (murs peints, toits en pente, pilotis), choisies selon leurs voisines dans le
// plan. Code pur, sans Three.js : `architectureDe` lit les cubes d'un monde (ou d'une île) et rend
// - les murs peints (./peinture.ts) : ils gardent la géométrie de leur bloc, et la fusion des faces de
//   world/construction.ts ; le shader peint leur colombage, leur bardage, leur soubassement, leur chaperon ;
// - les pièces dessinées (les toits de ./toits.ts, les pilotis du kit) : leurs facettes, en coordonnées de grille, que
//   world/construction.ts assemble (./assemblage.ts) et peint dans son groupe opaque, avec la case de chacune (le
//   toucher, toute la case) ; les cases qu'elles remplacent, et les faces de case qu'elles ferment ;
// - les blocs des lieux du village qui prennent la couverture de leur île (./lieux.ts).
//
// Les règles, décisions du directeur artistique :
// - la règle lit le plan entier, fantômes compris (./voisinage.ts) ;
// - un fantôme reste un cube Brume : seul un bloc posé devient pièce ;
// - la matière reste lisible par famille : la table « bloc vers matière » du kit de l'archipel (./kits/) ;
// - un bloc que le kit ne peint ni ne dessine reste un bloc taillé : un kit vide ne remplace rien ;
// - le verre et les lanternes restent ce qu'ils sont (la vue 2D les allume de même) ; les monuments gardent leurs
//   blocs taillés (des repères au large, seuls sur leur îlot) ; la cour d'une île (barrières, jardinières, quai) aussi :
//   seuls les murs et le toit d'un bâtiment prennent le kit (world/construction.ts, `batimentsDe`) ; Blocland n'a pas
//   de kit ;
// - l'école et la salle des trophées (des lieux du village, au milieu des maisons, décision du 30 septembre 2026)
//   prennent le kit quand il les nomme (`lieux`, au 6e) : leur plan se lit sur leurs blocs, la famille de chaque bloc
//   sur sa place dans leur modèle (./lieux.ts) ; ailleurs, elles gardent leur dessin.
import type { VoxelCube } from '../cube';
import type { ArchipelagoId } from '../archipels';
import type { TextureKind } from '../pixels';
import { pieceDe, type IdDePiece, type Rotation } from './choix';
import { KITS, kitRempli, type CaseDuLieu, type Famille, type Kit } from './kits';
import { lieuxDuKit } from './lieux';
import { peintureDuMur, type PeintureDuMur } from './peinture';
import { facettesPosees, tournerCouvre, type DessinDePiece, type Facette } from './pieces';
import { COTES, estDuPlan, indexDuPlan, voisinageDe, type IndexDuPlan, type Voisinage } from './voisinage';

export { assemblerLesPieces, type FacetteAssemblee } from './assemblage';
export { pieceDe, FORMES, PENTES, type Forme, type IdDeMur, type IdDePiece, type IdDeToit, type Pente, type Rotation } from './choix';
export { COLOMBAGE, decharge, MOTIF, MOTIF_GLSL, peintureDuMur, ROLES_PEINTS, sensDeLaDecharge, type Fond, type PeintureDuMur } from './peinture';
export { boiteDansLaCase, FACES, facettesPosees, TOUTES_LES_FACES, trianglesDe, type DessinDePiece, type Facette, type Role } from './pieces';
export { classeDe, COTES, estDuPlan, indexDuPlan, tournerVoisinage, voisinageDe, type Classe, type Voisinage } from './voisinage';
export { KITS, kitRempli, kitVide, type CaseDuLieu, type Famille, type Kit, type LieuDuKit } from './kits';
export { estUnLieuDuVillage, lieuxDuKit, type LieuxDuKit } from './lieux';

/** Une case, en coordonnées de grille (z : hauteur). */
export interface CaseDuPlan {
  x: number;
  y: number;
  z: number;
}

/** Une pièce dessinée, posée : le bloc qu'elle remplace (sa couleur, son île, son lieu), sa pièce, et ses facettes dans le monde. */
export interface PiecePosee {
  cube: VoxelCube;
  famille: Famille;
  piece: IdDePiece;
  rotation: Rotation;
  dessin: DessinDePiece;
  facettes: Facette[];
}

/** Un mur peint : le bloc, qui garde sa géométrie, sa pièce, et sa peinture. */
export interface MurPeint {
  cube: VoxelCube;
  famille: Famille;
  piece: IdDePiece;
  rotation: Rotation;
  peinture: PeintureDuMur;
}

export interface Architecture {
  /** Les cases remplacées par une pièce dessinée (clés `x,y,z`). */
  remplacees: Set<string>;
  /** Les pièces dessinées, dans l'ordre des cubes. */
  pieces: PiecePosee[];
  /** Les faces de case que chaque pièce dessinée ferme (clé `x,y,z`, bits de `FACES`, déjà tournés). */
  couvre: Map<string, number>;
  /** Les murs peints (clé `x,y,z`). */
  peints: Map<string, MurPeint>;
  /** Le nombre de triangles des pièces dessinées, avant leur assemblage (./assemblage.ts). */
  triangles: number;
  /** Les blocs des lieux du village (pièces ou non) qui prennent la couverture de leur île (clé `x,y,z`, ./lieux.ts). */
  couverts: Set<string>;
  /** Les blocs des lieux du village qui prennent la couleur d'une autre matière (clé `x,y,z`, ./lieux.ts). */
  matieres: Map<string, TextureKind>;
}

const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;
/** Ce qui s'allume ou éclaire : jamais remplacé (la 2D les allume de même). */
const LUMIERES = new Set(['lanterne', 'verre']);

export interface OptionsDeLArchitecture {
  /** Un bloc à laisser tel quel (déjà remplacé par un modèle : le phare, un pont). */
  exclure?: (c: VoxelCube) => boolean;
  /** Le kit (par défaut, celui de l'archipel). */
  kit?: Kit;
  /**
   * Les bâtiments des îles, entiers (clé `x,y,z` → texture), tels que leurs plans les dessinent, posés ou non : seuls
   * leurs blocs deviennent pièces, et le voisinage se lit sur eux, même sur les étapes qui ne sont pas encore dans le
   * monde (le toit d'une maison dont on pose les murs). Sans eux, tout bloc du plan, lu sur les cubes du monde.
   */
  batiments?: ReadonlyMap<string, string>;
  /** Un bloc au pied est-il sur le vide (l'eau, le large) ? Sans cette fonction, jamais (pas de pilotis). */
  surLeVide?: (x: number, y: number, z: number) => boolean;
  /**
   * La case d'un bloc d'un lieu du village dans le modèle de son lieu (world/terrain.ts), ou `null` hors du modèle. Sans
   * cette fonction, les lieux gardent leur dessin, même si le kit les nomme.
   */
  caseDuLieu?: (c: VoxelCube) => CaseDuLieu | null;
}

/** L'index du plan de chaque carte des bâtiments (world/construction.ts, `batimentsDe`, la garde par archipel). */
const indexParBatiments = new WeakMap<ReadonlyMap<string, string>, IndexDuPlan>();

function indexDesBatiments(batiments: ReadonlyMap<string, string>): IndexDuPlan {
  let index = indexParBatiments.get(batiments);
  if (!index) {
    index = indexDuPlan(
      [...batiments].map(([k, texture]) => {
        const [x, y, z] = k.split(',').map(Number);
        return { x, y, z, texture, color: '' };
      }),
    );
    indexParBatiments.set(batiments, index);
  }
  return index;
}

/**
 * Les pièces d'architecture d'un monde : chaque bloc posé d'un plan dont le kit de l'archipel dessine ou peint la pièce.
 * `cubes` : tout le plan (fantômes compris), car le voisinage se lit sur le plan entier.
 */
export function architectureDe(a: ArchipelagoId, cubes: readonly VoxelCube[], options: OptionsDeLArchitecture = {}): Architecture {
  const kit = options.kit ?? KITS[a];
  const out: Architecture = { remplacees: new Set(), pieces: [], couvre: new Map(), peints: new Map(), triangles: 0, couverts: new Set(), matieres: new Map() };
  // Un kit sans pièce ni mur peint ne remplace rien : pas même l'index du plan à faire.
  if (!kitRempli(kit)) return out;
  // Le plan entier, fantômes compris ; les bâtiments entiers quand ils sont donnés (la cour n'allonge pas un mur, et un
  // mur ne change pas quand l'étape du toit arrive dans le monde).
  const batiments = options.batiments;
  const dansLesCases = (c: VoxelCube) => !batiments || batiments.has(cle(c.x, c.y, c.z));
  const index = batiments ? indexDesBatiments(batiments) : indexDuPlan(cubes);
  // Les lieux du village que le kit reprend : leur plan à eux, lu sur leurs blocs (ils n'ont ni chantier ni fantôme).
  const lieux = kit.lieux && options.caseDuLieu ? lieuxDuKit(kit, cubes, options.caseDuLieu) : null;
  if (lieux) {
    out.couverts = lieux.couverts;
    out.matieres = lieux.matieres;
  }
  const choisis: { c: VoxelCube; famille: Famille; v: Voisinage; piece: IdDePiece; rotation: Rotation; sansDecharge?: boolean }[] = [];
  for (const c of cubes) {
    if (c.place) {
      const bloc = lieux && lieux.blocs.get(cle(c.x, c.y, c.z));
      if (!lieux || !bloc || options.exclure?.(c)) continue;
      const v = voisinageDe(c, bloc.classe === 'toit' ? lieux.indexDesToits : lieux.index, { surLeVide: options.surLeVide, classe: bloc.classe });
      if (!v) continue;
      choisis.push({ c, famille: bloc.famille, v, ...pieceDe(v), sansDecharge: bloc.sansDecharge });
      continue;
    }
    if (c.ghost || !estDuPlan(c) || LUMIERES.has(c.texture ?? '') || options.exclure?.(c)) continue;
    if (!Number.isInteger(c.x) || !Number.isInteger(c.y) || !Number.isInteger(c.z)) continue;
    if (!dansLesCases(c)) continue;
    const famille = kit.matieres[c.texture as TextureKind];
    if (!famille) continue;
    const v = voisinageDe(c, index, { surLeVide: options.surLeVide });
    if (!v) continue;
    const { piece, rotation } = pieceDe(v);
    choisis.push({ c, famille, v, piece, rotation });
  }
  // Le dehors d'un bâtiment : du côté opposé au centre de ses murs (ceux de son île, ou de son lieu), vu du dessus.
  const batimentDe = (c: VoxelCube) => `${c.tag ?? ''}|${c.place ?? ''}`;
  const centres = new Map<string, { x: number; y: number; n: number }>();
  for (const { c, v } of choisis) {
    if (v.classe !== 'mur') continue;
    const k = batimentDe(c);
    const m = centres.get(k) ?? { x: 0, y: 0, n: 0 };
    centres.set(k, { x: m.x + c.x + 0.5, y: m.y + c.y + 0.5, n: m.n + 1 });
  }
  for (const { c, famille, v, piece, rotation, sansDecharge } of choisis) {
    const k = cle(c.x, c.y, c.z);
    const dessin = kit.pieces[famille]?.[piece];
    if (dessin) {
      const facettes = facettesPosees(dessin, rotation, c.x, c.y, c.z);
      out.remplacees.add(k);
      out.couvre.set(k, tournerCouvre(dessin.couvre, rotation));
      out.pieces.push({ cube: c, famille, piece, rotation, dessin, facettes });
      out.triangles += facettes.reduce((n, f) => n + f.points.length - 2, 0);
      continue;
    }
    const maniere = kit.murs[famille];
    if (v.classe !== 'mur' || !maniere) continue;
    const m = centres.get(batimentDe(c));
    const exterieur = (cote: number) => {
      if (!m) return true;
      const [dx, dy] = COTES[cote];
      return dx * (c.x + 0.5 - m.x / m.n) + dy * (c.y + 0.5 - m.y / m.n) > 0;
    };
    const peinture = peintureDuMur(v, maniere, { barde: kit.bardes.includes(c.tag ?? ''), exterieur, sansDecharge });
    out.peints.set(k, { cube: c, famille, piece, rotation, peinture });
  }
  return out;
}
