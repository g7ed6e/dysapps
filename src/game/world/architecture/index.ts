// L'architecture modulaire d'Archipéo (lot 7, docs/univers/archipeo/cadrage.md) : les blocs posés des plans
// deviennent des pièces d'architecture (murs peints, toits en pente, pilotis), choisies selon leurs voisines dans le
// plan. Code pur, sans Three.js : `architectureDe` lit les cubes d'un monde (ou d'une île) et rend
// - les murs peints (./paint.ts) : ils gardent la géométrie de leur bloc, et la fusion des faces de
//   world/construction.ts ; le shader peint leur colombage, leur bardage, leur soubassement, leur chaperon ;
// - les pièces dessinées (les toits de ./roofs.ts, les pilotis du kit) : leurs facettes, en coordonnées de grille, que
//   world/construction.ts assemble (./assembly.ts) et peint dans son groupe opaque, avec la case de chacune (le
//   toucher, toute la case) ; les cases qu'elles remplacent, et les faces de case qu'elles ferment ;
// - les blocs des lieux du village qui prennent la couverture de leur île (./places.ts).
//
// Les règles, décisions du directeur artistique :
// - la règle lit le plan entier, fantômes compris (./neighborhood.ts) ;
// - un fantôme reste un cube Brume : seul un bloc posé devient pièce ;
// - la matière reste lisible par famille : la table « bloc vers matière » du kit de l'archipel (./kits/) ;
// - un bloc que le kit ne peint ni ne dessine reste un bloc taillé : un kit vide ne remplace rien ;
// - le verre et les lanternes restent ce qu'ils sont (./construction.ts les allume) ; Blocland n'a pas de kit ;
// - la table commune « matière → famille » (./families.ts, 8 octobre 2026) : les murs et le toit d'un bâtiment
//   (world/construction.ts, `batimentsDe`), sa cour (`cours`, la troisième étape de son plan), les monuments (le
//   directeur artistique révise sa décision du 30 septembre) et les petites constructions des commandes et des quêtes
//   prennent le kit ; chacun se lit sur son propre plan (la cour n'allonge pas un mur, un monument ne touche pas une
//   maison), et une barrière ne se lit que sur les barrières (ses lisses vont d'un poteau à l'autre) ; les liaisons
//   entre les lieux (GD-9) attendent leur pull request ;
// - les lieux du village (l'école, la salle des trophées, le lieu où l'on assemble : au milieu des maisons, décision du
//   30 septembre 2026) prennent le kit quand il les nomme (`lieux`, au 6e) : leur plan se lit sur leurs blocs, la
//   famille de chaque bloc sur sa place dans leur modèle (./places.ts) ; ailleurs, ils gardent leur dessin ;
// - le bois d'un monument ou d'une petite construction est bardé dans sa teinte de bois, jamais en colombage crème : ce
//   ne sont pas des maisons, et le colombage y faisait un damier de crème, de matière et de pierre (retouches du
//   directeur artistique, 8 octobre 2026) ;
// - un mur plein ou bardé n'a de soubassement qu'à partir de trois rangées (`rangees`, lu sur la colonne du bloc) ;
// - le lissage (./volumes.ts, mot du mainteneur du 8 octobre 2026), quand le kit le dit : dans un monument et dans les
//   petites constructions, les cases voisines d'une même matière font un seul volume, sans chaperon par case ; son
//   soubassement se lit par colonne (les cases du volume empilées à la colonne du bloc).
import type { VoxelCube } from '../cube';
import type { ArchipelagoId } from '../archipelagos';
import type { TextureKind } from '../pixels';
import { pieceDe, type IdDePiece, type Rotation } from './choices';
import { KITS, kitRempli, type CaseDuLieu, type Famille, type Kit } from './kits';
import { lieuxDuKit } from './places';
import { getMonument } from '../monuments';
import { peintureDuMur, type ManiereDuMur, type PeintureDuMur } from './paint';
import { woodenPost } from './lowPieces';
import { facettesPosees, tournerCouvre, type DessinDePiece, type Facette } from './rooms';
import { SIDES, estDuPlan, indexDuPlan, voisinageDe, type IndexDuPlan, type Voisinage } from './neighborhood';
import { volumesDeMatiere, type VolumeDeMatiere } from './volumes';

export { assemblerLesPieces } from './assembly';
export { pieceDe, FORMES, type Forme, type IdDePiece } from './choices';
export { CADRAN, CHAPERON_DE_LA_PIERRE, COLOMBAGE, decharge, MOTIF, MOTIF_FIN, MOTIF_GLSL, motifDeLaRangee, motifDesRangees, peintureDuMur, pointsDuCadran, RANGEES, rangeesReunies, RANGEES_DU_SOUBASSEMENT, ROLES_PEINTS, sensDeLaDecharge, DRAPE, SHEET_METAL } from './paint';
export { boiteDansLaCase, type DessinDePiece, type Role } from './rooms';
export { indexDuPlan, voisinageDe, type Voisinage } from './neighborhood';
export { KITS, kitVide, type CaseDuLieu, type Kit } from './kits';
export { CUBE_EXCEPTIONS, FAMILIES_TO_CONFIRM, familyOf, MATERIAL_FAMILIES, materialsOf } from './families';
export { bacDePierre, barriere, marche, PIECES_BASSES, woodenPost } from './lowPieces';
export { bell, crystal, ingot, PRECIOUS, RESTING_HEIGHT } from './precious';
export { estUnLieuDuVillage } from './places';

/** Une pièce dessinée, posée : le bloc qu'elle remplace (sa couleur, son île, son lieu), sa pièce, et ses facettes dans le monde. */
interface PiecePosee {
  cube: VoxelCube;
  famille: Famille;
  piece: IdDePiece;
  rotation: Rotation;
  dessin: DessinDePiece;
  facettes: Facette[];
}

/** Un mur peint : le bloc, qui garde sa géométrie, sa pièce, et sa peinture. */
interface MurPeint {
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
  /** Le nombre de triangles des pièces dessinées, avant leur assemblage (./assembly.ts). */
  triangles: number;
  /** Les blocs des lieux du village (pièces ou non) qui prennent la couverture de leur île (clé `x,y,z`, ./places.ts). */
  couverts: Set<string>;
  /** Les blocs des lieux du village qui prennent la couleur d'une autre matière (clé `x,y,z`, ./places.ts). */
  matieres: Map<string, TextureKind>;
  /** Les volumes lissés (clé `x,y,z` → son volume, ./volumes.ts), quand le kit le dit : une teinte par volume. */
  lisses: Map<string, VolumeDeMatiere>;
}

const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** Les rangées du mur à la colonne d'un bloc : les murs empilés d'un seul tenant dans son plan, lui compris. */
function rangeesDeLaColonne(c: VoxelCube, index: IndexDuPlan): number {
  let n = 1;
  for (let z = c.z - 1; index.get(cle(c.x, c.y, z)) === 'mur'; z--) n++;
  for (let z = c.z + 1; index.get(cle(c.x, c.y, z)) === 'mur'; z++) n++;
  return n;
}

/** Les rangées d'un volume lissé à la colonne d'un bloc : les cases de ce volume empilées d'un seul tenant, lui compris. */
function rangeesDuVolume(c: VoxelCube, volume: VolumeDeMatiere, volumes: ReadonlyMap<string, VolumeDeMatiere>): number {
  let n = 1;
  for (let z = c.z - 1; volumes.get(cle(c.x, c.y, z)) === volume; z--) n++;
  for (let z = c.z + 1; volumes.get(cle(c.x, c.y, z)) === volume; z++) n++;
  return n;
}

/** Ce qui s'allume ou éclaire : jamais remplacé . */
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
  /**
   * Les cours des îles (la troisième étape de leur plan, clé `x,y,z` → texture), posées ou non, lues sur leur propre plan
   * (la cour n'allonge pas un mur). Sans elles, la cour garde ses blocs quand `batiments` est donné.
   */
  cours?: ReadonlyMap<string, string>;
  /** Un bloc au pied est-il sur le vide (l'eau, le large) ? Sans cette fonction, jamais (pas de pilotis). */
  surLeVide?: (x: number, y: number, z: number) => boolean;
  /**
   * La case d'un bloc d'un lieu du village dans le modèle de son lieu (world/terrain.ts), ou `null` hors du modèle. Sans
   * cette fonction, les lieux gardent leur dessin, même si le kit les nomme.
   */
  caseDuLieu?: (c: VoxelCube) => CaseDuLieu | null;
  /** Les toitures à part (./neighborhood.ts, `OptionsDuVoisinage.toitures`). */
  toitures?: ReadonlyMap<string, string>;
}

/** Un monument (son plan sur son îlot), et non une liaison entre deux lieux (GD-9), qui a le même genre de lieu. */
function estUnMonument(place: string): boolean {
  return place.startsWith('monument:') && getMonument(place.slice('monument:'.length)) !== undefined;
}

/**
 * Le plan à part d'un bloc, lu sur lui-même : un monument, ou les petites constructions d'une île (`null` : le plan des
 * bâtiments, ou leur cour).
 */
function groupeDe(c: VoxelCube): string | null {
  if (c.sol || c.decor) return null;
  if (c.place && estUnMonument(c.place)) return c.place;
  if (c.petiteConstruction) return `petite:${c.tag ?? ''}`;
  return null;
}

/**
 * Le plan à part où se lisse un bloc (./volumes.ts) : un monument, les petites constructions d'une île, ou le reste de
 * l'île hors de ses bâtiments (sa cour, les piliers et le quai de son cœur) ; `null` pour un bâtiment des plans (ses murs
 * sont déjà réunis), un lieu du village, une liaison entre deux lieux, une borne, un pont, le sol et le décor.
 */
function groupeDuLissage(c: VoxelCube, batiments?: ReadonlyMap<string, string>): string | null {
  if (c.sol || c.decor || c.quest || c.bridge) return null;
  if (c.place) return estUnMonument(c.place) ? c.place : null;
  if (batiments?.has(cle(c.x, c.y, c.z))) return null;
  return c.petiteConstruction ? `petite:${c.tag ?? ''}` : `ile:${c.tag ?? ''}`;
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
  const out: Architecture = { remplacees: new Set(), pieces: [], couvre: new Map(), peints: new Map(), triangles: 0, couverts: new Set(), matieres: new Map(), lisses: new Map() };
  // Un kit sans pièce ni mur peint ne remplace rien : pas même l'index du plan à faire.
  if (!kitRempli(kit)) return out;
  // Le plan entier, fantômes compris ; les bâtiments entiers quand ils sont donnés (la cour n'allonge pas un mur, et un
  // mur ne change pas quand l'étape du toit arrive dans le monde).
  const batiments = options.batiments;
  const index = batiments ? indexDesBatiments(batiments) : indexDuPlan(cubes);
  // Les lieux du village que le kit reprend : leur plan à eux, lu sur leurs blocs (ils n'ont ni chantier ni fantôme).
  const lieux = kit.lieux && options.caseDuLieu ? lieuxDuKit(kit, cubes, options.caseDuLieu) : null;
  if (lieux) {
    out.couverts = lieux.couverts;
    out.matieres = lieux.matieres;
  }
  // Les autres plans, chacun lu sur lui-même : la cour de chaque île, chaque monument, les petites constructions de
  // chaque île ; et, dans chacun, les barrières seules (une barrière ne se lit que sur les barrières).
  const cours = batiments ? options.cours : undefined;
  const indexDesCours = cours ? indexDesBatiments(cours) : null;
  const autres = new Map<string, VoxelCube[]>();
  for (const c of cubes) {
    const g = groupeDe(c);
    if (!g) continue;
    const l = autres.get(g);
    if (l) l.push(c);
    else autres.set(g, [c]);
  }
  const indexDesAutres = new Map<string, IndexDuPlan>();
  const indexDe = (g: string): IndexDuPlan => {
    let i = indexDesAutres.get(g);
    if (!i) {
      i = indexDuPlan(autres.get(g) ?? []);
      indexDesAutres.set(g, i);
    }
    return i;
  };
  /** Les barrières d'un plan (une barrière ne se lit que sur les barrières : ses lisses vont d'un poteau à l'autre). */
  const barrieresDe = new Map<string, IndexDuPlan>();
  const barrieres = (groupe: string, textures: () => Iterable<readonly [string, string | undefined]>): IndexDuPlan => {
    let i = barrieresDe.get(groupe);
    if (!i) {
      i = new Map();
      for (const [k, t] of textures()) if (t === 'barriere') i.set(k, 'mur');
      barrieresDe.set(groupe, i);
    }
    return i;
  };
  const texturesDe = (l: readonly VoxelCube[]) => l.filter(estDuPlan).map((c) => [cle(c.x, c.y, c.z), c.texture] as const);
  /** Le plan où se lit un bloc (son groupe, et l'index de ce groupe), ou `null` s'il ne prend pas le kit. */
  const planDe = (c: VoxelCube): { groupe: string; index: IndexDuPlan } | null => {
    const k = cle(c.x, c.y, c.z);
    const g = groupeDe(c);
    const plan: { groupe: string; index: IndexDuPlan; textures: () => Iterable<readonly [string, string | undefined]> } | null = g
      ? { groupe: g, index: indexDe(g), textures: () => texturesDe(autres.get(g) ?? []) }
      : !batiments
        ? { groupe: '', index, textures: () => texturesDe(cubes) }
        : batiments.has(k)
          ? { groupe: 'batiment', index, textures: () => batiments }
          : cours?.has(k) && indexDesCours
            ? { groupe: 'cour', index: indexDesCours, textures: () => cours }
            : null;
    if (!plan) return null;
    return c.texture === 'barriere' ? { groupe: plan.groupe, index: barrieres(plan.groupe, plan.textures) } : plan;
  };
  // Les volumes lissés (./volumes.ts), fantômes compris : tous, pour la teinte (world/construction.ts) ; la peinture ne
  // lisse que les monuments et les petites constructions (`groupeDe`), les cours gardant la leur.
  const volumes = kit.lissage ? volumesDeMatiere(cubes, (c) => (LUMIERES.has(c.texture ?? '') ? null : groupeDuLissage(c, batiments))) : null;
  if (volumes) out.lisses = volumes;
  const choisis: { c: VoxelCube; famille: Famille; v: Voisinage; piece: IdDePiece; rotation: Rotation; sansDecharge?: boolean; groupe: string; rangees: number; lisse?: boolean; dessin?: DessinDePiece | ManiereDuMur }[] = [];
  const poteaux: VoxelCube[] = [];
  for (const c of cubes) {
    if (c.place && !estUnMonument(c.place)) {
      const bloc = lieux && lieux.blocs.get(cle(c.x, c.y, c.z));
      if (!lieux || !bloc || options.exclure?.(c)) continue;
      const v = voisinageDe(c, bloc.classe === 'toit' ? lieux.indexDesToits : lieux.index, { surLeVide: options.surLeVide, classe: bloc.classe });
      if (!v) continue;
      choisis.push({ c, famille: bloc.famille, v, ...pieceDe(v), sansDecharge: bloc.sansDecharge, groupe: 'lieu', rangees: rangeesDeLaColonne(c, lieux.index), dessin: bloc.dessin });
      continue;
    }
    if (c.ghost || options.exclure?.(c) || !Number.isInteger(c.x) || !Number.isInteger(c.y) || !Number.isInteger(c.z)) continue;
    // Un poteau de bois (le végétal, une liaison ou la jetée) : d'aucun plan, il se dessine seul, après (`poteaux`).
    if (c.texture === 'tronc' && !c.sol && !c.decor && kit.poteaux?.(c)) {
      poteaux.push(c);
      continue;
    }
    if (!estDuPlan(c) || LUMIERES.has(c.texture ?? '')) continue;
    const famille = kit.matieres[c.texture as TextureKind];
    if (!famille) continue;
    const plan = planDe(c);
    if (!plan) continue;
    const v = voisinageDe(c, plan.index, { surLeVide: options.surLeVide, toitures: plan.groupe === 'batiment' || plan.groupe === '' ? options.toitures : undefined });
    if (!v) continue;
    const { piece, rotation } = pieceDe(v);
    const volume = groupeDe(c) !== null ? volumes?.get(cle(c.x, c.y, c.z)) : undefined;
    // Le soubassement se lit par colonne (directeur artistique, 8 octobre 2026) : dans un volume lissé, sur les cases de
    // ce volume empilées à la colonne du bloc, et non sur la hauteur du volume entier (une aile basse accolée à une tour
    // n'en prend pas).
    const rangees = volume ? rangeesDuVolume(c, volume, volumes!) : rangeesDeLaColonne(c, plan.index);
    choisis.push({ c, famille, v, piece, rotation, groupe: plan.groupe, rangees, lisse: volume !== undefined });
  }
  // Le dehors d'un bâtiment : du côté opposé au centre de ses murs (ceux de son île, ou de son lieu, ou de son plan), vu
  // du dessus.
  const batimentDe = (c: VoxelCube, groupe: string) => `${c.tag ?? ''}|${c.place ?? ''}|${groupe}`;
  const centres = new Map<string, { x: number; y: number; n: number }>();
  for (const { c, v, groupe } of choisis) {
    if (v.classe !== 'mur') continue;
    const k = batimentDe(c, groupe);
    const m = centres.get(k) ?? { x: 0, y: 0, n: 0 };
    centres.set(k, { x: m.x + c.x + 0.5, y: m.y + c.y + 0.5, n: m.n + 1 });
  }
  /** Pose une pièce dessinée à la place de son bloc. */
  const poser = (c: VoxelCube, famille: Famille, piece: IdDePiece, rotation: Rotation, dessin: DessinDePiece) => {
    const k = cle(c.x, c.y, c.z);
    const facettes = facettesPosees(dessin, rotation, c.x, c.y, c.z);
    out.remplacees.add(k);
    out.couvre.set(k, tournerCouvre(dessin.couvre, rotation));
    out.pieces.push({ cube: c, famille, piece, rotation, dessin, facettes });
    out.triangles += facettes.reduce((n, f) => n + f.points.length - 2, 0);
  };
  for (const { c, famille, v, piece, rotation, sansDecharge, groupe, rangees, lisse, dessin: dessinDuLieu } of choisis) {
    // Le dessin que le lieu donne (la cloche, la tenture), puis la finition, matière par matière (la porte, la barrière,
    // la marche) : avant les pièces et les murs.
    const finition = dessinDuLieu ?? (famille === 'finition' ? kit.finitions?.[c.texture as TextureKind]?.(piece, c) : undefined);
    if (famille === 'finition' && !finition) continue;
    const dessin = typeof finition === 'object' ? finition : finition ? undefined : kit.pieces[famille]?.[piece];
    if (dessin) {
      poser(c, famille, piece, rotation, dessin);
      continue;
    }
    const maniere = typeof finition === 'string' ? finition : kit.murs[famille];
    if (v.classe !== 'mur' || !maniere) continue;
    const m = centres.get(batimentDe(c, groupe));
    const exterieur = (cote: number) => {
      if (!m) return true;
      const [dx, dy] = SIDES[cote];
      return dx * (c.x + 0.5 - m.x / m.n) + dy * (c.y + 0.5 - m.y / m.n) > 0;
    };
    // Un monument, une petite construction : bardés (`groupeDe` : leur plan à part).
    const barde = kit.bardes.includes(c.tag ?? '') || groupeDe(c) !== null;
    const peinture = peintureDuMur(v, maniere, { barde, exterieur, sansDecharge, rangees, lisse });
    out.peints.set(cle(c.x, c.y, c.z), { cube: c, famille, piece, rotation, peinture });
  }
  // Les poteaux de bois : sans dessus sous un autre poteau ou sous une lanterne (son corps s'y pose juste).
  if (poteaux.length) {
    const des = new Set(poteaux.map((c) => cle(c.x, c.y, c.z)));
    const lanternes = new Set(cubes.filter((c) => c.texture === 'lanterne' && !c.ghost).map((c) => cle(c.x, c.y, c.z)));
    for (const c of poteaux) {
      const au = cle(c.x, c.y, c.z + 1);
      const dessus = !des.has(au) && !lanternes.has(au);
      poser(c, 'vegetal', dessus ? 'mur.seul.pied.chaperon' : 'mur.seul.pied.mur', 0, woodenPost(dessus));
    }
  }
  return out;
}
