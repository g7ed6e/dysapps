// Les créatures et les Gardiens dans le monde : leur modèle tourné, la place et les pas de la créature sur le sol libre
// de son île.
import { type BiomeId, BIOMES } from '../../biomes';
import type { CubeDeModele } from '../characters/ascii';
import { CREATURE_CUBES } from '../characters/creatures';
import { GUARDIAN_CUBES } from '../characters/guardians';
import { lv2Courante } from '../../../core/settings';
import { type ArchipelagoId, bornesDuCoeur, islandDef, landscape, margesDuCoeur, noise, startingIsland, tirage } from '../map';
import { DECOR, decorate } from '../decor';
import { zoneDesPlans } from '../plans';
import { commandeDeLIle } from '../requests';
import { casesDeLaPetiteConstruction, eauDeLaPetiteConstruction, placeEcrite } from '../fixtures';
import { isBiomeUnlocked, islandsOf } from '../archipelago';
import type { VoxelCube } from '../cube';
import { TOWARDS_SEA, turnDirection, turnPlacedModel } from '../placement';
import { possibleLandings } from '../routing';
import { cacheUnLieu, lieuxVus, placeCells, portesDesLieux, TROPHY_AT, TROPHY_SIZE } from './village';
import { versLaCameraDuDessin } from './view';
import { AVATAR_HOME, groundHeight, islandOrigin, isSchoolIsland, LAYOUT_PAD } from './base';
import { type BorneVue, cacheUneBorne, QUEST_ROW, questStations } from './markers';
import { amorcesDuDessin } from './links';
import { layoutCache } from '../placement';

/** Les pas d'une créature qui se promène : une case à gauche ou en arrière (jamais vers les plans). */
export const CREATURE_STEPS: [number, number][] = [
  [0, 0],
  [-1, 0],
  [0, 1],
  [-1, 1],
];

/**
 * Les personnages en cubes tournés d'un quart de tour dans le monde (sens direct, vu d'en haut) : le visage, côté y = 0
 * du modèle, passe du côté des x croissants. Au Refuge des carnets, la caméra de l'île et celle de l'archipel pivotent à
 * fond vers l'ouest (`viewYaw`) et regardent l'île par son côté est : Timbre la regarde de trois quarts, et le Papillon
 * lui montre ses ailes de biais, jamais par la tranche (DA, retouches LV2-5). Orientation fixe, sans animation ; les
 * portraits (défi, bulle, panneau) gardent le modèle de face.
 */
export const QUARTS_DE_TOUR: Partial<Record<BiomeId, number>> = { 'lv2-3e-travel': 1 };

/**
 * Les créatures seules (pas leur Gardien) tournées d'un quart de tour de plus, même sens. Au Marché des proportions
 * (5e), Bazar est long (sept cases du museau à la queue) : de face, il n'a aucune place hors de la vue de la salle des
 * trophées (GD-3) ; tourné, il se tient derrière elle, le visage du côté des x croissants, celui de la caméra. Le quart
 * de tour dans l'autre sens lui ferait tourner le dos à la caméra (retouches de GD-3). Jalon (le Plateau des territoires,
 * 3e) n'est pas tournée : la caméra de son île pivote à fond vers l'est (`viewYaw`, −40°) et la regarde déjà de profil ;
 * un quart de tour la lui montrerait de face (voir `JALON`, ../characters/creatures.ts).
 */
export const QUARTS_DE_TOUR_DE_LA_CREATURE: Partial<Record<BiomeId, number>> = {
  'maths-5e-proportionality': 1,
  // Navette, couchée de profil (SC-3) : la caméra de la Ruche regarde de l'est (`viewYaw`, −40°) ; tournée, elle lui
  // montre son flanc et ses anneaux, pas sa tête de face.
  'technology-3e-digital': 1,
};

function tourner(cubes: CubeDeModele[], quarts = 0): CubeDeModele[] {
  let out = cubes;
  for (let i = 0; i < quarts; i++) {
    const maxY = Math.max(...out.map((c) => c.y));
    out = out.map((c) => ({ ...c, x: maxY - c.y, y: c.x }));
  }
  return out;
}

/**
 * Les Gardiens seuls (pas leur créature) tournés de quarts de tour de plus, même sens. Au Kiosque des témoins (3e), la
 * caméra de l'île regarde du sud (`viewYaw`, +40°) : de face, la Colombe d'albâtre se lisait comme un bloc ; tournée de
 * trois quarts de tour, elle montre son flanc, la tête vers l'ouest, l'œil, le bec et le rameau du côté de la caméra
 * (DA, relecture des planches, HG-3).
 */
const QUARTS_DE_TOUR_DU_GARDIEN: Partial<Record<BiomeId, number>> = {
  'history-3e-twentieth-century': 3,
  // À la Menuiserie, au Bassin et à la Ruche (SC-3), la caméra de l'île regarde de l'est (`viewYaw`, −32 à −40°) : de
  // face, le Cheval à bascule, le Grand-bi et l'Abeille se voyaient par la tranche ou de dos ; tournés d'un quart de
  // tour, ils lui montrent leur flanc, l'œil de son côté (DA et consultant de Blocland, relecture des captures ; même
  // règle que la Colombe d'albâtre).
  'technology-5e-design': 1,
  'technology-4e-modeling': 1,
  'technology-3e-digital': 1,
};

const personnagesTournes = new Map<string, CubeDeModele[]>();

const tourne = (genre: 'creature' | 'gardien', id: BiomeId, cubes: CubeDeModele[]) => {
  const cle = `${genre}:${id}`;
  let t = personnagesTournes.get(cle);
  const quarts = (QUARTS_DE_TOUR[id] ?? 0) + (genre === 'creature' ? (QUARTS_DE_TOUR_DE_LA_CREATURE[id] ?? 0) : (QUARTS_DE_TOUR_DU_GARDIEN[id] ?? 0));
  if (!t) personnagesTournes.set(cle, (t = tourner(cubes, quarts)));
  return t;
};

/** La créature d'une île telle qu'elle se tient dans le monde (voir `QUARTS_DE_TOUR` et `QUARTS_DE_TOUR_DE_LA_CREATURE`). */
export const creatureDuMonde = (id: BiomeId): CubeDeModele[] => tourne('creature', id, CREATURE_CUBES[id]);

/** Le Gardien d'une île tel qu'il se tient sur son île (voir `QUARTS_DE_TOUR` et `QUARTS_DE_TOUR_DU_GARDIEN`). */
export const gardienDuMonde = (id: BiomeId): CubeDeModele[] => tourne('gardien', id, GUARDIAN_CUBES[id]);

// Par île et par LV2 : la place de la créature évite les bornes, dont le nombre suit la LV2 sur l'île de la LV2.
const creatureSpots = layoutCache<string, CreatureSpot>();

export interface CreatureSpot {
  x: number;
  y: number;
  /** Les pas qu'elle peut faire sans rien toucher (toujours au moins « rester là »). */
  steps: [number, number][];
}

/**
 * Où la créature d'une île se tient (case relative au cœur) : la place la plus proche de (2, 4) où elle et ses pas
 * ne touchent ni le décor, ni la zone des plans, ni le bonhomme, ni une colline, ni l'eau. On préfère une place
 * d'où elle peut se promener ; sinon elle reste immobile. Sur une île-école, ni elle ni ses pas ne se tiennent entre la
 * caméra de l'île et un lieu du village, l'emprise réservée de la salle des trophées comprise (`cacheUnLieu`) : devant
 * le cœur, aucune place ne la tient hors de leur vue, elle va derrière la salle, sur les quatre îles-écoles (à la Forêt
 * des sons, un arbre du décor lui a laissé la place : `DECOR.foret`) (GD-3, retouches du directeur artistique) ; depuis
 * que les îles ont grandi (GD-11), la règle l'y tient.
 */
export function creatureSpot(id: BiomeId): CreatureSpot {
  const cle = `${id}:${lv2Courante()}`;
  const known = creatureSpots.get(cle);
  if (known) return known;
  const free = solLibre(id);
  const cubes = creatureDuMonde(id);
  const lieux = lieuxVus(id);
  const vers = versLaCameraDuDessin(id);
  const coeur = bornesDuCoeur(islandDef(id));
  // La créature se tient sur le sol de l'île (z = 1 au-dessus, comme les lieux, sur un sol plat : voir `solLibre`).
  const libre = (x: number, y: number, [sx, sy]: [number, number]) => cubes.every((c) => free(x + sx + c.x, y + sy + c.y));
  /** Un cube de la créature (au pas `st`) se tient-il entre la caméra et un lieu du village ? */
  const cache = (x: number, y: number, [sx, sy]: [number, number]) => cubes.some((c) => cacheUnLieu(lieux, vers, x + sx + c.x, y + sy + c.y, c.z + 1));
  const fits = (x: number, y: number, st: [number, number]) => libre(x, y, st) && !cache(x, y, st);
  // Sur une île-école, derrière la salle des trophées : depuis que les îles ont grandi (GD-11), les marges du cœur
  // offrent des places sur le côté, devant elle.
  const derriere = isSchoolIsland(id) ? TROPHY_AT.y + TROPHY_SIZE.d : -Infinity;
  let best: CreatureSpot | null = null;
  let bestScore = Infinity;
  for (let x = coeur.x0 - 2; x < coeur.x1; x++) {
    for (let y = Math.max(coeur.y0, derriere); y < coeur.y1; y++) {
      if (!fits(x, y, [0, 0])) continue;
      const steps = CREATURE_STEPS.filter((st) => fits(x, y, st));
      const score = Math.abs(x - 2) + Math.abs(y - 4) - 2 * (steps.length - 1);
      if (score < bestScore) {
        best = { x, y, steps };
        bestScore = score;
      }
    }
  }
  const spot = best ?? { x: 2, y: 4, steps: [[0, 0]] };
  creatureSpots.set(cle, spot);
  return spot;
}

/**
 * Le carré réservé au Gardien sur son île (GD-11, décision du mainteneur du 8 octobre 2026) : 5 × 5 cases. Le Gardien
 * de Blocland, réduit de moitié (`echelleDesGardiens` de l'habillage), et la sentinelle d'Archipéo y tiennent, avec le
 * bloc d'or du Gardien rallumé, sur la rangée de devant.
 */
export const GUARDIAN_SQUARE = 5;

/** La hauteur, en blocs, que le Gardien occupe au-dessus de son carré pour ne cacher ni un lieu, ni une borne, ni un chantier. */
const GUARDIAN_HEIGHT = 5;

/** La place du Gardien sur son île : le coin de son carré (case relative au cœur, le lieu pas tourné). */
export interface GuardianSpot {
  x: number;
  y: number;
  /**
   * Le palier de règles qui a donné la place (voir `guardianSpot`) : 1, toutes les règles ; 2, sans la marge ni les pas
   * de l'habitant ; 3, le décor de la côte et des marges s'efface sous le carré.
   */
  palier: 1 | 2 | 3;
  /**
   * Aucun carré libre, même au palier 3 : la place de repli, où le Gardien peut cacher à la vue de l'île un lieu, une
   * borne ou le chantier. Depuis que les îles ont grandi (GD-11), aucune île n'y vient : le test l'exige.
   */
  repli?: true;
}

// Par île et par LV2 : la place du Gardien évite les bornes, dont le nombre suit la LV2 sur l'île de la LV2.
const guardianSpots = layoutCache<string, GuardianSpot>();

/**
 * Où le Gardien d'une île se tient (GD-11) : un carré de `GUARDIAN_SQUARE` cases de côté sur le sol libre de son île
 * (`solLibre`), réservé à lui seul : sans la petite construction de sa commande, hors de la bande de devant des bornes,
 * sans case devant une porte (ni autour), ni sur une arrivée possible d'une liaison ou la case d'entrée derrière elle ;
 * aucune de ses cases ne se tient entre la caméra de l'île et un lieu, une borne ou le chantier (`cacheUneBorne`), et
 * les pas de l'habitant n'y entrent pas (`creaturePlacements`). Parmi ces carrés, le plus loin du départ du bonhomme et
 * des portes, puis le plus au large (loin du milieu du cœur), puis le premier de la grille : un choix fixe, calculé
 * dans le repère du lieu pas tourné ; il tourne avec son lieu (DA, 8 octobre 2026).
 *
 * La recherche se fait par paliers, du plus strict au plus large. Palier 1 : l'habitant, ses pas et une case autour
 * sont exclus. Palier 2 : seules les cases où l'habitant se tient le sont (ses pas sur le carré sont retirés). Palier
 * 3 : de plus, le décor de la côte et des marges s'efface sous le carré (`decorSousLeGardien`). Sans carré, même au
 * palier 3, la place de repli (`repli`), qui oublie la vue de l'île mais jamais une colline. Depuis que les îles ont
 * grandi (GD-11, « Agrandir les îles », 8 octobre 2026), 47 îles ont leur place au palier 1, la Forêt, le Marché et
 * l'Atelier au palier 2, la Fouille des siècles au palier 3, aucune au repli. Toute la recherche tient dans cette fonction.
 */
export function guardianSpot(id: BiomeId): GuardianSpot {
  const cle = `${id}:${lv2Courante()}`;
  const known = guardianSpots.get(cle);
  if (known) return known;
  const def = islandDef(id);
  const sol = solDeLIle(id);
  const coeur = bornesDuCoeur(def);
  const n = GUARDIAN_SQUARE;
  const autour = (set: Set<string>, x: number, y: number) => {
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) set.add(`${x + dx},${y + dy}`);
  };
  // Ce qui est toujours exclu : la petite construction de sa commande (son eau comprise), les portes des lieux et une
  // case autour (le bonhomme y arrive).
  const pris = new Set<string>();
  const commande = commandeDeLIle(id);
  const place = commande ? placeEcrite(commande.fixture) : null;
  if (commande && place) {
    for (const c of casesDeLaPetiteConstruction(commande.fixture) ?? []) pris.add(`${place.x + c.x},${place.y + c.y}`);
    for (const [x, y] of eauDeLaPetiteConstruction(commande.fixture)) pris.add(`${place.x + x},${place.y + y}`);
  }
  const portes = portesDesLieux(id).map((k) => k.split(',').map(Number) as [number, number]);
  for (const [x, y] of portes) autour(pris, x, y);
  // Chaque arrivée possible d'une liaison (GD-9), le lieu pas tourné (la place du Gardien tourne avec lui), et la case
  // d'entrée de l'île derrière elle, où le bonhomme descend : jamais sous le Gardien, à aucun palier ni au repli.
  for (const l of possibleLandings(startingIsland(id))) {
    const v = TOWARDS_SEA[l.cote];
    pris.add(`${l.x},${l.y}`);
    pris.add(`${l.x - v.dx},${l.y - v.dy}`);
  }
  // L'habitant : au palier 1, ses pas et une case autour ; ensuite, les cases où il se tient seulement.
  const habitant = creatureSpot(id);
  const sesCubes = creatureDuMonde(id);
  const habitantLarge = new Set<string>();
  for (const [sx, sy] of habitant.steps) for (const c of sesCubes) autour(habitantLarge, habitant.x + sx + c.x, habitant.y + sy + c.y);
  const habitantSeul = new Set(sesCubes.map((c) => `${habitant.x + c.x},${habitant.y + c.y}`));
  // Ce que la vue de l'île doit voir : les lieux, les bornes, la zone du chantier (deux rangs au-dessus du sol).
  const vers = versLaCameraDuDessin(id);
  const lieux = lieuxVus(id);
  const bornes: BorneVue[] = questStations(id).map((st) => ({ x: st.x, y: st.y, base: 0 }));
  const zone = zoneDesPlans(id);
  const chantier: BorneVue[] = [];
  for (let x = zone.x; x < zone.x + zone.w; x++) for (let y = zone.y; y < zone.y + zone.h; y++) for (const base of [0, 1]) chantier.push({ x, y, base });
  const cacheConnu = new Map<string, boolean>();
  const cache = (x: number, y: number) => {
    const k = `${x},${y}`;
    let c = cacheConnu.get(k);
    if (c === undefined) {
      c = false;
      for (let z = 1; z <= GUARDIAN_HEIGHT && !c; z++) c = cacheUnLieu(lieux, vers, x, y, z) || cacheUneBorne(bornes, vers, x, y, z) || cacheUneBorne(chantier, vers, x, y, z);
      cacheConnu.set(k, c);
    }
    return c;
  };
  const loinDe = [AVATAR_HOME, ...portes.map(([x, y]) => ({ x, y }))];
  const milieu = { x: (coeur.x0 + coeur.x1) / 2, y: (coeur.y0 + coeur.y1) / 2 };
  const chercher = (libre: (x: number, y: number) => boolean): { x: number; y: number } | null => {
    let best: { x: number; y: number } | null = null;
    let score: [number, number] = [-Infinity, -Infinity];
    // Derrière la bande de devant des bornes (leur rangée et la rangée d'après), dans le cœur ou contre lui.
    for (let x = coeur.x0 - 3; x <= coeur.x1 - n + 3; x++)
      for (let y = Math.max(coeur.y0, QUEST_ROW + 2); y <= coeur.y1 - n + 3; y++) {
        let ok = true;
        for (let i = 0; i < n && ok; i++) for (let j = 0; j < n && ok; j++) ok = libre(x + i, y + j);
        if (!ok) continue;
        const cx = x + n / 2;
        const cy = y + n / 2;
        const loin = Math.min(...loinDe.map((p) => Math.hypot(cx - p.x - 0.5, cy - p.y - 0.5)));
        const large = Math.hypot(cx - milieu.x, cy - milieu.y);
        // Le plus loin d'abord ; à égalité, le plus au large ; puis la première place de la grille (x, puis y).
        if (loin > score[0] + 1e-9 || (Math.abs(loin - score[0]) <= 1e-9 && large > score[1] + 1e-9)) {
          best = { x, y };
          score = [loin, large];
        }
      }
    return best;
  };
  const paliers: [1 | 2 | 3, (x: number, y: number) => boolean, Set<string>][] = [
    [1, sol.libre, habitantLarge],
    [2, sol.libre, habitantSeul],
    [3, sol.sansLeDecorDeLaCote, habitantSeul],
  ];
  let spot: GuardianSpot | null = null;
  for (const [palier, ouvert, habite] of paliers) {
    const trouve = chercher((x, y) => ouvert(x, y) && !pris.has(`${x},${y}`) && !habite.has(`${x},${y}`) && !cache(x, y));
    if (trouve) {
      spot = { ...trouve, palier };
      break;
    }
  }
  // La place de repli : sur la terre plate de l'île, sans rien d'immuable (`terre`, jamais une colline), ni la petite
  // construction, ni les portes, ni l'habitant, ni une arrivée ou l'entrée derrière elle ; le carré qui prend le moins
  // de cases qu'une règle refuse (le décor, les abords d'une borne, la vue de l'île) ; le premier de la grille à
  // égalité. Sans terre assez grande, le fond du cœur. Depuis que les îles ont grandi (GD-11), aucune île n'y vient.
  if (!spot) {
    const dur = (x: number, y: number) => sol.terre(x, y) && !pris.has(`${x},${y}`) && !habitantSeul.has(`${x},${y}`);
    const genant = (x: number, y: number) => (sol.sansLeDecorDeLaCote(x, y) ? 0 : 1) + (cache(x, y) ? 1 : 0);
    let moins = Infinity;
    let repli: { x: number; y: number } | null = null;
    for (let x = coeur.x0 - 3; x <= coeur.x1 - n + 3; x++)
      for (let y = Math.max(coeur.y0, QUEST_ROW + 2); y <= coeur.y1 - n + 3; y++) {
        let cout = 0;
        for (let i = 0; i < n && cout < Infinity; i++) for (let j = 0; j < n && cout < Infinity; j++) cout = dur(x + i, y + j) ? cout + genant(x + i, y + j) : Infinity;
        if (cout < moins) {
          moins = cout;
          repli = { x, y };
        }
      }
    spot = { ...(repli ?? { x: coeur.x1 - n, y: coeur.y1 - n }), palier: 3, repli: true };
  }
  guardianSpots.set(cle, spot);
  return spot;
}

/** Une case (relative au cœur, le lieu pas tourné) est-elle sur le carré du Gardien de l'île ? */
export function surLeCarreDuGardien(id: BiomeId, x: number, y: number): boolean {
  const s = guardianSpot(id);
  return x >= s.x && y >= s.y && x < s.x + GUARDIAN_SQUARE && y < s.y + GUARDIAN_SQUARE;
}

/**
 * Le décor de la côte et des marges s'efface-t-il sous le Gardien (palier 3 de `guardianSpot`) ? `cases` : les cases
 * (relatives au cœur) que touche un élément du décor.
 */
export function decorSousLeGardien(id: BiomeId, cases: Iterable<{ x: number; y: number }>): boolean {
  if (guardianSpot(id).palier !== 3) return false;
  for (const c of cases) if (surLeCarreDuGardien(id, c.x, c.y)) return true;
  return false;
}

// Par île et par LV2 : le sol libre où la créature, la petite construction de sa commande et le Gardien peuvent se poser.
const solsLibres = layoutCache<string, SolDeLIle>();

/** Le sol libre d'une île (voir `solLibre`), et le même sol si le décor de sa côte et de ses marges s'effaçait. */
interface SolDeLIle {
  libre: (x: number, y: number) => boolean;
  sansLeDecorDeLaCote: (x: number, y: number) => boolean;
  /**
   * La terre plate de l'île (le cœur ou la côte, hors de l'eau et des collines) où rien d'immuable n'est posé : ni une
   * borne, ni la zone des plans, ni la place du bonhomme, ni un lieu ou la case devant sa porte, ni un ouvrage et ses
   * abords. Le décor et les abords y restent : la place de repli du Gardien (`guardianSpot`) en prend le moins possible.
   */
  terre: (x: number, y: number) => boolean;
}

/**
 * Les cases du sol d'une île (relatives au cœur) où rien n'est posé : ni le décor, ni les bornes et leur pourtour, ni la
 * zone des plans, ni la place du bonhomme, ni un lieu ou la case devant sa porte, ni un ouvrage et ses abords, ni une
 * colline, ni l'eau. Hors du cœur, la terre plate et nue seulement.
 */
export function solLibre(id: BiomeId): (x: number, y: number) => boolean {
  return solDeLIle(id).libre;
}

function solDeLIle(id: BiomeId): SolDeLIle {
  const cle = `${id}:${lv2Courante()}`;
  const known = solsLibres.get(cle);
  if (known) return known;
  const index = BIOMES.findIndex((b) => b.id === id);
  const def = islandDef(id);
  const blocked = new Set<string>();
  // Le décor de la côte et des marges du cœur (et la couronne de ses arbres), à part : il s'efface sous le Gardien.
  const decorDeLaCote = new Set<string>();
  DECOR[id](
    (x, y) => blocked.add(`${x + LAYOUT_PAD.x},${y + LAYOUT_PAD.y}`),
    (x, y) => groundHeight(index, x + LAYOUT_PAD.x, y + LAYOUT_PAD.y),
  );
  // Ce qui ne s'efface ni ne s'écarte jamais (`terre`) : les bornes, la zone des plans, la place du bonhomme, les lieux,
  // la case devant leur porte, les ouvrages et leurs abords (le bonhomme y passe).
  const dur = new Set<string>();
  for (const st of questStations(id)) {
    dur.add(`${st.x},${st.y}`);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) blocked.add(`${st.x + dx},${st.y + dy}`);
  }
  const zone = zoneDesPlans(id);
  for (let x = zone.x; x < zone.x + zone.w; x++) for (let y = zone.y; y < zone.y + zone.h; y++) dur.add(`${x},${y}`);
  dur.add(`${AVATAR_HOME.x},${AVATAR_HOME.y}`);
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) blocked.add(`${AVATAR_HOME.x + dx},${AVATAR_HOME.y + dy}`);
  for (const k of placeCells(id)) dur.add(k);
  // … ni sur la case devant la porte d'un lieu, où le bonhomme s'arrête.
  for (const k of portesDesLieux(id)) dur.add(k);
  // Ni sur un ouvrage qui part de l'île, ni à côté (sa rampe, son pied sur la côte).
  for (const { cases } of amorcesDuDessin(id))
    for (const c of cases) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) dur.add(`${c.x + dx},${c.y + dy}`);
  for (const k of dur) blocked.add(k);
  // Le décor des marges du cœur (un cœur agrandi) : la créature ne s'y pose pas.
  for (const m of margesDuCoeur(def)) if (m.decor) decorDeLaCote.add(`${m.x - def.core.x},${m.y - def.core.y}`);
  const coeur = bornesDuCoeur(def);
  for (let x = coeur.x0; x < coeur.x1; x++) for (let y = coeur.y0; y < coeur.y1; y++) if (groundHeight(index, x, y) > 0) blocked.add(`${x},${y}`);
  // Hors du cœur : la terre plate et nue seulement (pas l'eau, pas un arbre, pas une pente).
  const scenery = new Map(landscape(def).map((c) => [`${c.x - def.core.x},${c.y - def.core.y}`, c]));
  // … ni sous la couronne d'un arbre de la côte ou des marges, qui déborde de son tronc (le décor tel que l'île le pose).
  for (const c of [...scenery.values(), ...margesDuCoeur(def)]) {
    if (!c.decor) continue;
    const t = tirage(def, c.x, c.y);
    decorate((x, y) => decorDeLaCote.add(`${x - def.core.x},${y - def.core.y}`), c.decor, c.x, c.y, noise(def.seed + 5, t.x, t.y));
  }
  const sol = (x: number, y: number, avecLeDecor: boolean) => {
    const k = `${x},${y}`;
    if (blocked.has(k) || (avecLeDecor && decorDeLaCote.has(k))) return false;
    if (x >= coeur.x0 && y >= coeur.y0 && x < coeur.x1 && y < coeur.y1) return true;
    const c = scenery.get(k);
    return Boolean(c) && c!.h === 0 && (!avecLeDecor || !c!.decor) && c!.ground !== 'eau' && c!.ground !== 'lave';
  };
  const terre = (x: number, y: number) => {
    const k = `${x},${y}`;
    if (dur.has(k)) return false;
    if (x >= coeur.x0 && y >= coeur.y0 && x < coeur.x1 && y < coeur.y1) return groundHeight(index, x, y) <= 0;
    const c = scenery.get(k);
    return Boolean(c) && c!.h === 0 && c!.ground !== 'eau' && c!.ground !== 'lave';
  };
  const out: SolDeLIle = { libre: (x, y) => sol(x, y, true), sansLeDecorDeLaCote: (x, y) => sol(x, y, false), terre };
  solsLibres.set(cle, out);
  return out;
}

/** Les créatures des îles ouvertes : cubes relatifs et position de leur coin dans le monde (elles sont animées à part). */
export function creaturePlacements(
  a: ArchipelagoId,
  bridges: string[],
): { id: BiomeId; cubes: VoxelCube[]; origin: { x: number; y: number; z: number }; steps: [number, number][] }[] {
  return islandsOf(a)
    .filter((b) => isBiomeUnlocked(b.id, bridges))
    .map((b) => {
      const { ox, oy, oz } = islandOrigin(BIOMES.indexOf(b));
      const spot = creatureSpot(b.id);
      // Les pas qui marcheraient sur le carré du Gardien (paliers 2 et 3 de `guardianSpot`) sont retirés.
      const cubesDeLaCreature = creatureDuMonde(b.id);
      const pas = spot.steps.filter(([sx, sy]) => cubesDeLaCreature.every((c) => !surLeCarreDuGardien(b.id, spot.x + sx + c.x, spot.y + sy + c.y)));
      // Sur le lieu tourné (GD-9), la créature et ses pas tournent avec lui.
      const def = islandDef(b.id);
      const pose = turnPlacedModel(def.core, { x: ox + spot.x, y: oy + spot.y, z: oz + 1 }, creatureDuMonde(b.id), def.quarts);
      const steps = pas.map(([dx, dy]): [number, number] => {
        const t = turnDirection(dx, dy, def.quarts);
        return [t.dx, t.dy];
      });
      return { id: b.id, cubes: pose.cubes as VoxelCube[], origin: pose.origine, steps };
    });
}
