// Les créatures et les Gardiens dans le monde : leur modèle tourné, la place et les pas de la créature sur le sol libre
// de son île.
import { type BiomeId, BIOMES } from '../../biomes';
import type { CubeDeModele } from '../characters/ascii';
import { CREATURE_CUBES } from '../characters/creatures';
import { GUARDIAN_CUBES } from '../characters/guardians';
import { lv2Courante } from '../../../core/settings';
import { type ArchipelagoId, bornesDuCoeur, islandDef, landscape, margesDuCoeur, noise, startingIsland, tirage } from '../map';
import { DECOR, decorate } from '../decor';
import { decalageDesPlans, planCells, plansFor, zoneDesPlans } from '../plans';
import { fixturesOfPlace } from '../placedFixtures';
import { casesDeLaPetiteConstruction, eauDeLaPetiteConstruction, placeEcrite } from '../fixtures';
import { ARCHIPELAGOS, bridgesOf, isBiomeUnlocked, islandsOf } from '../archipelago';
import { routeDeDepart } from '../linkGeometry';
import { DOCK_DX, shoreY } from '../harbor';
import { archipelagoOfIsland } from '../archipelagos';
import type { VillagePlaceId, VoxelCube } from '../cube';
import { TOWARDS_SEA, turnDirection, turnPlacedModel, turnPoint, wrapQuarts } from '../placement';
import { possibleLandings } from '../routing';
import { atelierModel, cacheUnLieu, lieuxVus, placeCells, placeSpot, portesDesLieux, schoolModel, TROPHY_AT, TROPHY_SIZE, trophyModel, VILLAGE_PLACES } from './village';
import { cameraDeLIle, DISTANCE_DE_LA_VUE_DE_L_ILE, HAUTEUR_DES_NOMS, projectionDeLaVueDeLIle, versLaCameraDuDessin, VUE_DE_L_ILE_PANNEAU_OUVERT } from './view';
import { AVATAR_HOME, groundHeight, islandOrigin, isSchoolIsland, LAYOUT_PAD } from './base';
import { type BorneVue, cacheUneBorne, QUEST_ROW, questStations, rangeeDevantLesBornes } from './markers';
import { amorcesDuDessin } from './links';
import { layoutCache } from '../placement';
import { GD11_GUARDIAN_SQUARES, GUARDIAN_SQUARE_SIDE } from '../guardianSquares';
import { silhouetteDe } from '../silhouettes';

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
 * La place que vise l'habitant d'une île, quand ce n'est pas (2, 4) : au Préau des délégués, sous le nom de l'île dans
 * la vue de l'île fiche du Gardien ouverte, Voix disparaissait derrière l'étiquette (DA, relecture des captures emc-2) ;
 * trois cases vers −x, il passe à droite de l'étiquette, à côté des bornes, sans rien cacher.
 */
const CIBLE_DE_L_HABITANT: Partial<Record<BiomeId, { x: number; y: number }>> = {
  'civics-6e-democratic-society': { x: -1, y: 4 },
};

/**
 * Où la créature d'une île se tient (case relative au cœur) : la place la plus proche de (2, 4), ou de sa cible
 * (`CIBLE_DE_L_HABITANT`), où elle et ses pas ne touchent ni le décor, ni la zone des plans, ni le bonhomme, ni une
 * colline, ni l'eau. On préfère une place d'où elle peut se promener ; sinon elle reste immobile. Sur une île-école,
 * ni elle ni ses pas ne se tiennent entre la caméra de l'île et un lieu du village, l'emprise réservée de la salle des
 * trophées comprise (`cacheUnLieu`) : devant le cœur, aucune place ne la tient hors de leur vue, elle va derrière la
 * salle, sur les quatre îles-écoles (à la Forêt des sons, un arbre du décor lui a laissé la place : `DECOR.foret`)
 * (GD-3, retouches du directeur artistique) ; depuis que les îles ont grandi (GD-11), la règle l'y tient.
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
  // Le sol libre et ce qui cache un lieu, par case, se gardent : chaque place candidate relit les cases de ses voisines.
  const libres = new Map<number, boolean>();
  const caches = new Map<number, boolean>();
  const libreEn = (x: number, y: number) => {
    const k = (x + 512) * 1024 + y + 512;
    let l = libres.get(k);
    if (l === undefined) libres.set(k, (l = free(x, y)));
    return l;
  };
  const cacheEn = (x: number, y: number, z: number) => {
    const k = ((x + 512) * 1024 + y + 512) * 256 + z;
    let c = caches.get(k);
    if (c === undefined) caches.set(k, (c = cacheUnLieu(lieux, vers, x, y, z)));
    return c;
  };
  const libre = (x: number, y: number, [sx, sy]: [number, number]) => cubes.every((c) => libreEn(x + sx + c.x, y + sy + c.y));
  /** Un cube de la créature (au pas `st`) se tient-il entre la caméra et un lieu du village ? */
  const cache = (x: number, y: number, [sx, sy]: [number, number]) => cubes.some((c) => cacheEn(x + sx + c.x, y + sy + c.y, c.z + 1));
  const fits = (x: number, y: number, st: [number, number]) => libre(x, y, st) && !cache(x, y, st);
  // Sur une île-école, derrière la salle des trophées : depuis que les îles ont grandi (GD-11), les marges du cœur
  // offrent des places sur le côté, devant elle.
  const derriere = isSchoolIsland(id) ? TROPHY_AT.y + TROPHY_SIZE.d : -Infinity;
  const cible = CIBLE_DE_L_HABITANT[id] ?? { x: 2, y: 4 };
  let best: CreatureSpot | null = null;
  let bestScore = Infinity;
  for (let x = coeur.x0 - 2; x < coeur.x1; x++) {
    for (let y = Math.max(coeur.y0, derriere); y < coeur.y1; y++) {
      if (!fits(x, y, [0, 0])) continue;
      const steps = CREATURE_STEPS.filter((st) => fits(x, y, st));
      const score = Math.abs(x - cible.x) + Math.abs(y - cible.y) - 2 * (steps.length - 1);
      if (score < bestScore) {
        best = { x, y, steps };
        bestScore = score;
      }
    }
  }
  const spot = best ?? { ...cible, steps: [[0, 0]] };
  creatureSpots.set(cle, spot);
  return spot;
}

/** Un Gardien plus profond que tant de cases (vu de face) prend tout son carré : son bloc d'or va à côté de lui. */
const PROFONDEUR_DU_GARDIEN_DEVANT_SON_OR = 8;

/** L'étendue d'un modèle en cubes : son coin bas et son coin haut (exclu), en x et en y. */
export function etendue(cubes: readonly { x: number; y: number }[]): { x0: number; y0: number; x1: number; y1: number } {
  const xs = cubes.map((c) => c.x);
  const ys = cubes.map((c) => c.y);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs) + 1, y1: Math.max(...ys) + 1 };
}

/** Le Gardien prend-il tout son carré, de l'avant au fond (un Gardien vu de profil, long) ? */
export function gardienProfond(id: BiomeId): boolean {
  const e = etendue(gardienDuMonde(id));
  return e.y1 - e.y0 > PROFONDEUR_DU_GARDIEN_DEVANT_SON_OR;
}

/**
 * Le carré réservé au Gardien sur son île (GD-11, décision du mainteneur du 8 octobre 2026) : 5 × 5 cases. Le Gardien
 * de Blocland, réduit de moitié (`echelleDesGardiens` de l'habillage), et la sentinelle d'Archipéo y tiennent, avec le
 * bloc d'or du Gardien rallumé, sur la rangée de devant.
 */
export const GUARDIAN_SQUARE = GUARDIAN_SQUARE_SIDE;

/** La hauteur, en blocs, que le Gardien occupe au-dessus de son carré pour ne cacher ni un lieu, ni une borne, ni un chantier. */
const GUARDIAN_HEIGHT = 5;

/**
 * L'étiquette du nom d'une île dans la vue de l'île (three/labels.ts) : le nom à 18 px CSS, en gras, le bloc de l'île
 * devant lui (world/labelCanvas.ts, `metrics`), estimés sans canvas. `LARGEUR_D_UNE_LETTRE` : la largeur moyenne d'une
 * lettre, en part de la taille du texte, un peu au-dessus de celle des polices du jeu, pour ne jamais la sous-estimer ;
 * `MARGE_DE_L_ETIQUETTE` : la place qu'elle peut prendre en s'écartant d'une voisine, en cases.
 */
const ETIQUETTE = { px: 18, lettre: 0.65, bloc: 1.2, bord: 2 } as const;
const MARGE_DE_L_ETIQUETTE = 0.25;

/**
 * La sentinelle d'Archipéo dans le monde, en cases : sa demi-largeur et sa hauteur, socle compris (world/characters/
 * sentinel.ts, `DEMI_LARGEUR_DE_SENTINELLE` et `HAUTEUR_DANS_LE_MONDE` à `ECHELLE_DANS_LE_MONDE` ; un test les tient
 * ensemble). Recopiées ici : la grille ne lit pas le dessin.
 */
export const SENTINELLE_DANS_LE_MONDE = { demiLargeur: 2.5 * 0.65, hauteur: 8 * 0.65 } as const;

// Par île et par LV2, hors des caches de la disposition : ce qui peut cacher le Gardien se lit dans le repère de son
// lieu (l'habitant, les lieux, les plans), pas dans la place de l'île ; une pose en mode aménagement ne le refait pas.
const cubesQuiCachentConnus = new Map<string, Set<string>>();

/**
 * Ce qui peut cacher le Gardien dans la vue de l'île (GD-11, relecture des planches du 8 octobre 2026) : l'habitant (ses
 * cubes, à chacun de ses pas), les lieux du village (l'école, la salle des trophées dans toute son emprise, le lieu où
 * l'on assemble, dans les deux univers) et les bâtiments des plans, tout construits ; en cubes du cœur (le lieu pas
 * tourné, z = 1 : le premier bloc au-dessus du sol).
 */

function cubesQuiCachent(id: BiomeId): Set<string> {
  const cle = `${id}:${lv2Courante()}`;
  const connus = cubesQuiCachentConnus.get(cle);
  if (connus) return connus;
  const out = new Set<string>();
  const habitant = creatureSpot(id);
  for (const [sx, sy] of habitant.steps) for (const c of creatureDuMonde(id)) out.add(`${habitant.x + sx + c.x},${habitant.y + sy + c.y},${c.z + 1}`);
  const lieux: [VillagePlaceId, { x: number; y: number; z: number }[]][] = [
    ['school', schoolModel()],
    ['trophies', trophyModel()],
    ['assembly', [...atelierModel('fabrique', archipelagoOfIsland(id)), ...atelierModel('halle', archipelagoOfIsland(id))]],
  ];
  for (const [place, modele] of lieux) {
    const spot = placeSpot(place, id);
    if (!spot) continue;
    const { at, size } = VILLAGE_PLACES[place];
    for (const c of modele) out.add(`${at.x + c.x},${at.y + c.y},${spot.h + c.z}`);
    // La salle des trophées grandit d'une travée tous les six succès : toute son emprise, à la hauteur de son toit.
    if (place === 'trophies') {
      const haut = Math.max(...modele.map((c) => c.z));
      for (let x = 0; x < size.w; x++) for (let y = 0; y < size.d; y++) for (let z = 1; z <= haut; z++) out.add(`${at.x + x},${at.y + y},${spot.h + z}`);
    }
  }
  for (const plan of plansFor(id)) {
    if (plan.zone !== undefined && plan.zone !== 'plans') continue;
    const d = decalageDesPlans(plan);
    for (const c of planCells(plan)) out.add(`${c.x + d.x},${c.y + d.y},${c.z + d.z + 1}`);
  }
  cubesQuiCachentConnus.set(cle, out);
  return out;
}

/**
 * Le Gardien posé sur un carré se voit-il dans la vue de l'île (cadrage par défaut, `viewYaw` de l'île) ? Rien
 * ne se tient entre la caméra et lui : ni un cube de `cubesQuiCachent`, ni l'étiquette du nom de l'île, qui flotte à
 * `HAUTEUR_DES_NOMS` au-dessus du milieu du cœur et se dessine par-dessus tout (sa taille à l'écran : celle de la vue de
 * l'île sur une tablette à l'horizontale, 768 px de haut). Le Gardien, dans les deux univers : la boîte du Gardien de
 * Blocland, réduit de moitié (`echelleDesGardiens`), et celle de la sentinelle d'Archipéo, autour de son milieu dans
 * le carré (le fond du carré, ou tout le carré pour un Gardien long : terrain/guardians.ts). Un rayon part de chaque
 * point de leurs faces tournées vers la caméra (une grille d'une demi-case) vers chacun de ses deux yeux, en paysage et
 * panneau ouvert : la caméra est en perspective, et une direction unique (`versLaCameraDuDessin`, celle d'une borne)
 * laissait voir entier le Sphinx de marbre que Théo cache à moitié (Belvédère de Thalès, planches de GD-11). Rend, pour un carré (par son coin), la part de ces points que la caméra voit : de
 * l'une des deux formes, ou des deux ensemble (sans `forme`, ce que demande la place du Gardien).
 */
type VueDuGardien = (x: number, y: number, forme?: FormeDuGardien, seuil?: number) => number;

/**
 * Les deux Gardiens autour de leur milieu dans le carré (relatif à son coin, le lieu pas tourné) : demi-largeur,
 * demi-profondeur et hauteur de la boîte du Gardien de Blocland, réduit de moitié (`echelleDesGardiens`), et de celle
 * de la sentinelle d'Archipéo ; le milieu, au fond du carré (son bloc d'or devant lui), ou au milieu pour un Gardien long.
 */
function boitesDuGardien(id: BiomeId): { boites: [FormeDuGardien, { dx: number; dy: number; h: number }][]; milieu: { x: number; y: number } } {
  const e = etendue(gardienDuMonde(id));
  const hauteurDuModele = Math.max(...gardienDuMonde(id).map((c) => c.z)) + 1;
  return {
    boites: [
      ['gardien', { dx: (e.x1 - e.x0) / 4, dy: (e.y1 - e.y0) / 4, h: hauteurDuModele / 2 }],
      ['sentinelle', { dx: SENTINELLE_DANS_LE_MONDE.demiLargeur, dy: SENTINELLE_DANS_LE_MONDE.demiLargeur, h: SENTINELLE_DANS_LE_MONDE.hauteur }],
    ],
    milieu: { x: GUARDIAN_SQUARE / 2, y: gardienProfond(id) ? GUARDIAN_SQUARE / 2 : (GUARDIAN_SQUARE + 1) / 2 },
  };
}

/**
 * Le Gardien posé sur un carré (par son coin) tient-il entier dans la vue de l'île panneau ouvert
 * (`VUE_DE_L_ILE_PANNEAU_OUVERT`, la plus étroite des vues de l'île qu'on mesure) : les coins de ses deux boîtes
 * (`boitesDuGardien`), le lieu tourné, entre les bords gauche, droit et haut de la vue, et au-dessus de la bande des
 * boutons du bas (`bas`) ? Un carré sur un côté de la bande de devant peut sortir du cadre (GD-11, DA, 8 octobre 2026).
 */
function gardienDansLeCadre(id: BiomeId): (x: number, y: number) => boolean {
  const V = VUE_DE_L_ILE_PANNEAU_OUVERT;
  const def = islandDef(id);
  const { projeter } = projectionDeLaVueDeLIle(id);
  const { boites, milieu } = boitesDuGardien(id);
  const coins: [number, number, number][] = [];
  for (const [, b] of boites)
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const h of [0, b.h]) coins.push([milieu.x + sx * b.dx, milieu.y + sy * b.dy, def.altitude + 1 + h]);
  return (x, y) =>
    coins.every(([px, py, z]) => {
      const t = turnPoint(x + px, y + py, def.quarts);
      const [u, v] = projeter(def.core.x + t.x, def.core.y + t.y, z);
      return u >= 0 && u <= V.largeur && v >= 0 && v <= V.hauteur - V.bas;
    });
}

/** Le Gardien de Blocland, réduit de moitié, ou la sentinelle d'Archipéo (l'habillage). */
export type FormeDuGardien = 'gardien' | 'sentinelle';

// Par île, par LV2 et par place des yeux de la caméra dans le repère du lieu, hors des caches de la disposition : la
// vue des carrés du Gardien ne se lit que dans ce repère (l'habitant, les lieux, les plans, la vue figée du lieu), et
// une pose en mode aménagement, qui déplace l'île sans changer ses yeux, ne refait pas ses rayons.
const vuesDuGardien = new Map<string, VueDuGardien>();

function vueDuGardien(id: BiomeId): VueDuGardien {
  // Les yeux de la caméra de la vue de l'île, dans le repère du lieu pas tourné (relatif à son cœur, la hauteur depuis
  // son altitude) : en paysage (`cameraDeLIle`) et panneau ouvert, plus loin (`projectionDeLaVueDeLIle`). La caméra est
  // en perspective : d'un point derrière le milieu de l'île, le rayon vers l'œil est plus couché que la direction de la
  // vue, et passe derrière l'habitant qui se tient devant (le Sphinx de marbre et Théo, au Belvédère de Thalès, planches
  // de GD-11) ; chaque point vise donc chacun des deux yeux.
  const def = islandDef(id);
  const retour = wrapQuarts(4 - def.quarts);
  const dansLeLieu = (o: { x: number; y: number; z: number }): [number, number, number] => {
    const t = turnPoint(o.x - def.core.x, o.y - def.core.y, retour);
    return [t.x, t.y, o.z - def.altitude];
  };
  const yeux = [dansLeLieu(cameraDeLIle(id)), dansLeLieu(projectionDeLaVueDeLIle(id).oeil)];
  const cle = `${id}:${lv2Courante()}:${yeux.flat().map((n) => n.toFixed(3)).join(',')}`;
  const connue = vuesDuGardien.get(cle);
  if (connue) return connue;
  const [vx, vy, vz] = versLaCameraDuDessin(id);
  // Les cubes en nombres (x et y décalés de 512, z sous 256) : les rayons les lisent des milliers de fois.
  const numero = (x: number, y: number, z: number) => ((x + 512) * 1024 + (y + 512)) * 256 + z;
  const cubes = new Set<number>();
  let haut = GUARDIAN_HEIGHT;
  for (const k of cubesQuiCachent(id)) {
    const [x, y, z] = k.split(',').map(Number);
    cubes.add(numero(x, y, z));
    haut = Math.max(haut, z);
  }
  // L'écran, vu le long du rayon : son axe horizontal (perpendiculaire au rayon, à plat) et son axe vertical.
  const lh = Math.hypot(vx, vy) || 1;
  const [hx, hy] = [-vy / lh, vx / lh];
  const [wx, wy, wz] = [-vz * hy, vz * hx, vx * hy - vy * hx];
  const ecran = (x: number, y: number, z: number): [number, number] => [x * hx + y * hy, x * wx + y * wy + z * wz];
  // L'étiquette : son milieu (celui du cœur, une demi-case plus loin, comme le sprite), sa taille en cases.
  const coeur = bornesDuCoeur(islandDef(id));
  const [eu, ev] = ecran((coeur.x0 + coeur.x1) / 2 + 0.5, (coeur.y0 + coeur.y1) / 2 + 0.5, HAUTEUR_DES_NOMS);
  const nom = BIOMES.find((b) => b.id === id)?.name ?? '';
  const V = VUE_DE_L_ILE_PANNEAU_OUVERT;
  const cube = V.hauteur / (2 * DISTANCE_DE_LA_VUE_DE_L_ILE * Math.tan((V.champ * Math.PI) / 360));
  const demiLargeur = (ETIQUETTE.px * (nom.length * ETIQUETTE.lettre + 1.2 + ETIQUETTE.bloc) + 2 * ETIQUETTE.bord) / cube / 2 + MARGE_DE_L_ETIQUETTE;
  const demiHauteur = (ETIQUETTE.px * 1.7 + 2 * ETIQUETTE.bord) / cube / 2 + MARGE_DE_L_ETIQUETTE;
  const { boites, milieu } = boitesDuGardien(id);
  // Les points de leurs faces vues (vers la caméra : x du côté de vx, y du côté de vy, et le dessus), relatifs au coin du
  // carré, sur une grille d'une demi-case : d'un carré à son voisin, les mêmes points du monde reviennent.
  const pas = 0.5;
  const grille = (a: number, b: number) => {
    const out: number[] = [];
    for (let t = Math.ceil((a + 0.05) / pas) * pas; t <= b - 0.05 + 1e-9; t += pas) out.push(t);
    return out;
  };
  const parForme = new Map<FormeDuGardien, [number, number, number][]>();
  for (const [forme, bt] of boites) {
    const points: [number, number, number][] = [];
    parForme.set(forme, points);
    const [x0, x1, y0, y1, z1] = [milieu.x - bt.dx, milieu.x + bt.dx, milieu.y - bt.dy, milieu.y + bt.dy, 1 + bt.h];
    const xs = grille(x0, x1);
    const ys = grille(y0, y1);
    const zs = grille(1, z1);
    const fx = vx >= 0 ? x1 - 0.05 : x0 + 0.05;
    const fy = vy >= 0 ? y1 - 0.05 : y0 + 0.05;
    for (const y of ys) for (const z of zs) points.push([fx, y, z]);
    for (const x of xs) for (const z of zs) points.push([x, fy, z]);
    for (const x of xs) for (const y of ys) points.push([x, y, z1 - 0.05]);
  }
  const lesDeux = [...parForme.values()].flat();
  // Pour chaque point : sous l'étiquette (`null`), ou les cases des cubes que coupent ses rayons. Un pas de l'habitant
  // sur le carré lui-même ne compte pas : il est retiré (`creaturePlacements`).
  // Ce que coupent ses rayons, par point du monde (au deux-centième de case près), en un nombre : sous l'étiquette
  // (`SOUS_L_ETIQUETTE`), aucun cube (`RIEN_NE_COUPE`), ou la boîte des cases des cubes coupés (x et y, du plus petit au
  // plus grand, décalés de 512, dix bits chacun) : le carré ne compte que les cubes qui se tiennent sur lui, et ils s'y
  // tiennent tous si leur boîte y tient. Aucune allocation par point : les rayons se lisent des milliers de fois.
  const SOUS_L_ETIQUETTE = -2;
  const RIEN_NE_COUPE = -1;
  const rayons = new Map<number, number>();
  const coupes = (px: number, py: number, pz: number): number => {
    const k = ((Math.round(px * 200) + 65536) * 131072 + (Math.round(py * 200) + 65536)) * 8192 + Math.round(pz * 200);
    const connu = rayons.get(k);
    if (connu !== undefined) return connu;
    let r = RIEN_NE_COUPE;
    const [u, w] = ecran(px, py, pz);
    if (Math.abs(u - eu) <= demiLargeur && Math.abs(w - ev) <= demiHauteur) r = SOUS_L_ETIQUETTE;
    else {
      let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
      for (const [ox, oy, oz] of yeux) {
        const l = Math.hypot(ox - px, oy - py, oz - pz) || 1;
        const [dx, dy, dz] = [(ox - px) / l, (oy - py) / l, (oz - pz) / l];
        // Le rayon, pas à pas (un quart de case), jusqu'au-dessus du plus haut cube qui pourrait le couper.
        for (let t = 0.25; pz + t * dz <= haut + 1; t += 0.25) {
          const cx = Math.floor(px + t * dx);
          const cy = Math.floor(py + t * dy);
          if (!cubes.has(numero(cx, cy, Math.floor(pz + t * dz)))) continue;
          x0 = Math.min(x0, cx);
          x1 = Math.max(x1, cx);
          y0 = Math.min(y0, cy);
          y1 = Math.max(y1, cy);
        }
      }
      if (x0 <= x1) r = (((x0 + 512) * 1024 + (x1 + 512)) * 1024 + (y0 + 512)) * 1024 + (y1 + 512);
    }
    rayons.set(k, r);
    return r;
  };
  /** Le point se voit-il du carré dont le coin est (x, y) ? */
  const vuDuCarre = (r: number, x: number, y: number) => {
    if (r === RIEN_NE_COUPE) return true;
    if (r === SOUS_L_ETIQUETTE) return false;
    const y1 = (r % 1024) - 512;
    const y0 = (Math.floor(r / 1024) % 1024) - 512;
    const x1 = (Math.floor(r / 1048576) % 1024) - 512;
    const x0 = Math.floor(r / 1073741824) - 512;
    return x0 >= x && y0 >= y && x1 < x + GUARDIAN_SQUARE && y1 < y + GUARDIAN_SQUARE;
  };
  // La part vue, par carré et par forme, se garde : la place du Gardien la redemande à chaque palier et à chaque pose.
  // Avec un seuil, le compte s'arrête dès que la part ne peut plus l'atteindre (-1, qui ne se garde pas).
  const parts = new Map<string, number>();
  const vue: VueDuGardien = (x, y, forme, seuil = -Infinity) => {
    const k = `${x},${y},${forme ?? ''}`;
    const connue = parts.get(k);
    if (connue !== undefined) return connue;
    const points = forme ? (parForme.get(forme) ?? lesDeux) : lesDeux;
    const cachesPermis = points.length * (1 - seuil) + 1e-6;
    let caches = 0;
    for (const [px, py, pz] of points) {
      if (vuDuCarre(coupes(x + px, y + py, pz), x, y)) continue;
      if (++caches > cachesPermis) return -1;
    }
    const part = (points.length - caches) / points.length;
    parts.set(k, part);
    return part;
  };
  vuesDuGardien.set(cle, vue);
  return vue;
}

/**
 * La part du Gardien vue sous laquelle le chemin des arrivées cède sur un côté de devant (DA, 8 octobre 2026 ; voir
 * `guardianSpot`).
 */
export const SEUIL_DU_GARDIEN_VU = 0.75;

/** La place du Gardien sur son île : le coin de son carré (case relative au cœur, le lieu pas tourné). */
export interface GuardianSpot {
  x: number;
  y: number;
  /**
   * Le palier de règles qui a donné la place (voir `guardianSpot`) : 1, toutes les règles ; 2, sans la marge ni les pas
   * de l'habitant ; 3, le décor de la côte et des marges s'efface sous le carré, et le Gardien peut, faute de mieux, ne
   * se voir qu'en partie.
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
 * (`solLibre`), réservé à lui seul : sans la petite construction de sa commande, sans case devant une porte (ni
 * autour), ni sur une arrivée possible d'une liaison ou la case d'entrée derrière elle ; aucune de ses cases ne se tient
 * entre la caméra de l'île et un lieu, une borne ou le chantier (`cacheUneBorne`), et les pas de l'habitant n'y entrent
 * pas (`creaturePlacements`). Rien ne cache le Gardien dans la vue de l'île : ni l'habitant (ses cubes et ses pas), ni
 * un lieu ou un bâtiment, ni l'étiquette du nom de l'île (`vueDuGardien`, relecture des planches, 8 octobre 2026).
 *
 * Le carré se tient derrière la bande de devant des bornes (leur rangée et la rangée d'après), ou sur un de ses côtés
 * (DA, 8 octobre 2026) : aucune de ses cases dans les colonnes des bornes, de la première à la dernière avec une
 * colonne d'écart de chaque côté, ni sur la rangée nue devant elles (`rangeeDevantLesBornes`), ni sur le chemin du
 * bonhomme (sa place et une case autour, la bande droite de là à chaque borne et à chaque porte, et depuis chaque
 * arrivée de ses liaisons et la jetée de l'île-port) ; et le Gardien y tient entier dans la vue de l'île panneau ouvert,
 * au-dessus des boutons du bas (`gardienDansLeCadre`). Derrière la bande, tenir dans ce cadre n'est qu'une préférence,
 * après la part vue. Parmi les carrés d'un même palier, ceux de derrière passent avant ceux des côtés ; puis le plus vu,
 * puis dans le cadre, puis le plus loin du départ du bonhomme et des portes, puis le plus sur le côté du cœur (loin de
 * l'axe de la caméra), puis le plus au large (loin du milieu du cœur), puis le premier de la grille : un choix fixe,
 * calculé dans le repère du lieu pas tourné ; il tourne avec son lieu (DA, 8 octobre 2026).
 *
 * La recherche se fait par paliers, du plus strict au plus large : un côté de devant au palier 1 passe avant un carré
 * de derrière au palier 2 ou 3. Palier 1 : l'habitant, ses pas et une case autour sont exclus. Palier 2 : seules les
 * cases où l'habitant se tient le sont (ses pas sur le carré sont retirés). Palier 3 : de plus, le décor de la côte et
 * des marges s'efface sous le carré (`decorSousLeGardien`) ; sans carré où il se voit entier, celui du palier 3 où il se
 * voit le plus (derrière, à part égale). Sans carré, même au palier 3, la place de repli (`repli`), qui oublie la vue de
 * l'île mais jamais une colline. Le seuil de 75 % (`SEUIL_DU_GARDIEN_VU`, DA, 8 octobre 2026) : quand la place trouvée
 * laisse voir moins de 75 % du Gardien, la recherche se refait, la bande du chemin des arrivées cédée sur les côtés de
 * devant (l'arrivée, une case autour et sa case d'entrée, comme la place du bonhomme, restent exclues), et la place
 * qu'elle donne la remplace si elle en montre plus. Mesuré : 23 îles ont leur place au palier 1, aucune au palier 2, 28
 * au palier 3 (dont 16 où il ne se voit pas entier : le test les nomme ; sous 75 %, le Phare des fonctions seul), aucune
 * au repli ; 9 sont sur un côté de devant. Toute la
 * recherche tient dans cette fonction. Elle ne lit que le repère du lieu et la carte de départ (`routeDeDepart`) : un
 * lieu déplacé garde la place de son Gardien ; les rayons se gardent hors des caches de la disposition (`vueDuGardien`).
 */
export function guardianSpot(id: BiomeId): GuardianSpot {
  const cle = `${id}:${lv2Courante()}`;
  const known = guardianSpots.get(cle);
  if (known) return known;
  // Une île qui a une forme (GD-12) garde le carré de GD-11 : sa forme le tient sur sa terre (./map.ts).
  const fige = silhouetteDe(id).forme ? GD11_GUARDIAN_SQUARES[id] : undefined;
  if (fige) {
    const spot: GuardianSpot = { x: fige.x, y: fige.y, palier: fige.palier, ...(fige.repli ? { repli: true as const } : {}) };
    guardianSpots.set(cle, spot);
    return spot;
  }
  const def = islandDef(id);
  const sol = solDeLIle(id);
  const coeur = bornesDuCoeur(def);
  const n = GUARDIAN_SQUARE;
  const autour = (set: Set<string>, x: number, y: number) => {
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) set.add(`${x + dx},${y + dy}`);
  };
  // Ce qui est toujours exclu : les petites constructions de l'île (leur eau comprise), les portes des lieux et une
  // case autour (le bonhomme y arrive).
  const pris = new Set<string>();
  // Toutes les petites constructions de l'île : celle de sa commande et les objets des quêtes (GD-10), à leur place écrite.
  for (const { fixture } of fixturesOfPlace(id)) {
    const place = placeEcrite(fixture);
    if (!place) continue;
    for (const c of casesDeLaPetiteConstruction(fixture) ?? []) pris.add(`${place.x + c.x},${place.y + c.y}`);
    for (const [x, y] of eauDeLaPetiteConstruction(fixture)) pris.add(`${place.x + x},${place.y + y}`);
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
  // Les côtés de la bande de devant (DA, 8 octobre 2026) : jamais dans les colonnes des bornes, de la première à la
  // dernière, avec une colonne d'écart de chaque côté ; ni sur la rangée nue devant elles (`rangeeDevantLesBornes`) ; ni
  // sur le chemin du bonhomme : sa place et une case autour, et la bande droite de là à chaque borne et à chaque porte
  // (la marche se calcule sur le monde posé, Gardien compris : elle ne peut pas servir ici).
  const colonnes = bornes.map((b) => b.x);
  const [premiere, derniere] = [Math.min(...colonnes) - 1, Math.max(...colonnes) + 1];
  const rangee = rangeeDevantLesBornes(id);
  const chemin = new Set<string>();
  /** La bande droite d'une case à une autre : les cases que traverse la ligne de leurs milieux. */
  const bande = (set: Set<string>, [ax, ay]: [number, number], [bx, by]: [number, number]) => {
    const pas = Math.ceil(4 * Math.hypot(bx - ax, by - ay));
    for (let i = 0; i <= pas; i++) set.add(`${Math.floor(ax + 0.5 + ((bx - ax) * i) / Math.max(1, pas))},${Math.floor(ay + 0.5 + ((by - ay) * i) / Math.max(1, pas))}`);
  };
  const home: [number, number] = [AVATAR_HOME.x, AVATAR_HOME.y];
  autour(chemin, AVATAR_HOME.x, AVATAR_HOME.y);
  for (const b of [...bornes.map((b): [number, number] => [b.x, b.y]), ...portes]) bande(chemin, home, b);
  // Le chemin du bonhomme depuis là où il arrive sur l'île (GD-11, DA, 8 octobre 2026), même forme : la bande droite de
  // la case d'entrée derrière chaque arrivée de ses liaisons (leur tracé sur la carte de départ, `routeDeDepart` : la
  // place du Gardien est tirée dans le repère du lieu et ne bouge pas avec lui) jusqu'à sa place, avec une case autour de l'arrivée ; sur l'île-port, le chemin de la jetée (`boardingRoute` : la rangée de
  // devant, puis la colonne de la jetée jusqu'à la côte), une case autour de son pied. Seulement pour les côtés de
  // devant : appliqué derrière la bande aussi, 15 îles perdaient leur carré au palier 1 (14 au lieu de 29 ; 20 ainsi).
  // `arrivees` : tout ce chemin ; `entrees` : ce qui n'en cède jamais (l'arrivée, sa case d'entrée et une case autour ; le
  // pied de la jetée et une case autour), quand la bande entre l'entrée et la place du bonhomme cède (le seuil de 75 %,
  // plus bas).
  // Tracées à la première demande : seul un côté de devant les lit, et la plupart des îles ont leur carré derrière.
  let chemins: { arrivees: Set<string>; entrees: Set<string> } | null = null;
  const cheminsDesArrivees = () => {
    if (chemins) return chemins;
    const arrivees = new Set<string>();
    const entrees = new Set<string>();
    const depart = startingIsland(id).core;
    for (const ouvrage of bridgesOf(id)) {
      const trace = routeDeDepart(ouvrage);
      for (const a of trace ? [trace.depuis, trace.vers] : []) {
        if (a.lieu !== id) continue;
        const [lx, ly] = [a.x - depart.x, a.y - depart.y];
        autour(arrivees, lx, ly);
        autour(entrees, lx, ly);
        entrees.add(`${lx - a.dx},${ly - a.dy}`);
        bande(arrivees, [lx - a.dx, ly - a.dy], home);
      }
    }
    if (ARCHIPELAGOS.some((a) => a.port === id)) {
      const pied: [number, number] = [DOCK_DX, shoreY(id) - def.core.y];
      bande(arrivees, home, [1, 0]);
      bande(arrivees, [1, 0], [DOCK_DX, 0]);
      bande(arrivees, [DOCK_DX, 0], pied);
      autour(arrivees, ...pied);
      autour(entrees, ...pied);
    }
    chemins = { arrivees, entrees };
    return chemins;
  };
  const surLeCote = (x: number, y: number, cede: boolean) => {
    if (x >= premiere && x <= derniere) return false;
    const k = `${x},${y}`;
    if (chemin.has(k) || rangee.has(`${def.core.x + x},${def.core.y + y}`)) return false;
    const { arrivees, entrees } = cheminsDesArrivees();
    return !(cede ? entrees : arrivees).has(k);
  };
  const tientDansLeCadre = gardienDansLeCadre(id);
  const cadresConnus = new Map<string, boolean>();
  const dansLeCadre = (x: number, y: number) => {
    const k = `${x},${y}`;
    let d = cadresConnus.get(k);
    if (d === undefined) cadresConnus.set(k, (d = tientDansLeCadre(x, y)));
    return d;
  };
  const loinDe = [AVATAR_HOME, ...portes.map(([x, y]) => ({ x, y }))];
  const milieu = { x: (coeur.x0 + coeur.x1) / 2, y: (coeur.y0 + coeur.y1) / 2 };
  // Sur le côté du cœur : loin de l'axe de la caméra qui passe par son milieu (vu de la caméra, à gauche ou à droite).
  const lh = Math.hypot(vers[0], vers[1]) || 1;
  const cote = (cx: number, cy: number) => Math.abs(((cx - milieu.x) * -vers[1] + (cy - milieu.y) * vers[0]) / lh);
  /**
   * Le meilleur carré derrière la bande de devant (sa rangée et la rangée d'après), dans le cœur ou contre lui, ou
   * (`devant`) sur un de ses côtés, dans le cadre de la vue de l'île ; avec la part du Gardien qu'on y voit.
   */
  const chercher = (libre: (x: number, y: number) => boolean, vue: VueDuGardien, entier: boolean, devant: boolean, cede: boolean): { x: number; y: number; part: number } | null => {
    let best: { x: number; y: number; part: number } | null = null;
    let score: number[] = [-Infinity, -Infinity, -Infinity, -Infinity, -Infinity];
    const [y0, y1] = devant ? [coeur.y0 - 3, QUEST_ROW + 1] : [Math.max(coeur.y0, QUEST_ROW + 2), coeur.y1 - n + 3];
    const ouvert = devant ? (x: number, y: number) => libre(x, y) && surLeCote(x, y, cede) : libre;
    for (let x = coeur.x0 - 3; x <= coeur.x1 - n + 3; x++)
      for (let y = y0; y <= y1; y++) {
        let ok = true;
        for (let i = 0; i < n && ok; i++) for (let j = 0; j < n && ok; j++) ok = ouvert(x + i, y + j);
        if (!ok || (devant && !dansLeCadre(x, y))) continue;
        // Vu entier, ou au moins autant que le meilleur jusqu'ici : sinon le compte des points s'arrête tôt.
        const part = vue(x, y, undefined, entier ? 1 : best ? best.part : -Infinity);
        if (part < 0 || (entier && part < 1)) continue;
        const cx = x + n / 2;
        const cy = y + n / 2;
        const loin = Math.min(...loinDe.map((p) => Math.hypot(cx - p.x - 0.5, cy - p.y - 0.5)));
        // Derrière la bande, tenir dans le cadre panneau ouvert est une préférence, jamais une condition (DA, 8 octobre
        // 2026) : elle passe après la part vue ; sur un côté de devant, c'est une condition (plus haut).
        const c = [entier ? 0 : part, devant || dansLeCadre(x, y) ? 1 : 0, loin, cote(cx, cy), Math.hypot(cx - milieu.x, cy - milieu.y)];
        // Le plus vu d'abord (`entier` : vu entier, sinon écarté), puis dans le cadre, puis le plus loin ; à égalité, le
        // plus sur le côté, puis le plus au large ; puis la première place de la grille (x, puis y).
        let mieux = false;
        for (let k = 0; k < c.length; k++) {
          if (c[k] > score[k] + 1e-9) mieux = true;
          if (Math.abs(c[k] - score[k]) > 1e-9) break;
        }
        if (mieux) {
          best = { x, y, part };
          score = c;
        }
      }
    return best;
  };
  // À chaque palier, rien ne cache le Gardien dans la vue de l'île (`vueDuGardien`) ; un carré derrière la bande de
  // devant d'abord, puis un de ses côtés. Sans carré vu entier, même au palier 3, le carré du palier 3 où il se voit le
  // plus, derrière la bande à part égale.
  const vu = vueDuGardien(id);
  const paliers: [1 | 2 | 3, (x: number, y: number) => boolean, Set<string>, boolean][] = [
    [1, sol.libre, habitantLarge, true],
    [2, sol.libre, habitantSeul, true],
    [3, sol.sansLeDecorDeLaCote, habitantSeul, true],
    [3, sol.sansLeDecorDeLaCote, habitantSeul, false],
  ];
  // Le sol libre de chaque palier, par case, se garde : chaque carré candidat relit les cases de ses voisins.
  const libresConnus = paliers.map(() => new Map<number, boolean>());
  const parPaliers = (cede: boolean): (GuardianSpot & { part: number }) | null => {
    for (const [i, [palier, ouvert, habite, entier]] of paliers.entries()) {
      const connus = libresConnus[i];
      const libre = (x: number, y: number) => {
        const k = (x + 512) * 1024 + y + 512;
        let l = connus.get(k);
        if (l === undefined) connus.set(k, (l = ouvert(x, y) && !pris.has(`${x},${y}`) && !habite.has(`${x},${y}`) && !cache(x, y)));
        return l;
      };
      const derriere = chercher(libre, vu, entier, false, cede);
      const surUnCote = entier && derriere ? null : chercher(libre, vu, entier, true, cede);
      const trouve = derriere && (!surUnCote || derriere.part >= surUnCote.part - 1e-9) ? derriere : surUnCote;
      if (trouve) return { x: trouve.x, y: trouve.y, palier, part: trouve.part };
    }
    return null;
  };
  // Le seuil de 75 % (DA, 8 octobre 2026) : sur un côté de devant, le chemin des arrivées cède quand le meilleur carré
  // qui le respecte laisse voir moins de 75 % du Gardien et qu'un carré qui ne le respecte pas en montre plus ; la case
  // d'entrée de chaque arrivée (et l'arrivée, une case autour) et la place du bonhomme restent exclues : seule la bande
  // entre les deux cède.
  let trouve = parPaliers(false);
  if (!trouve || trouve.part < SEUIL_DU_GARDIEN_VU - 1e-9) {
    const cede = parPaliers(true);
    if (cede && (!trouve || cede.part > trouve.part + 1e-9)) trouve = cede;
  }
  let spot: GuardianSpot | null = trouve && { x: trouve.x, y: trouve.y, palier: trouve.palier };
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

/**
 * La part du Gardien d'une île que voit la caméra de la vue de l'île, à sa place, dans la forme d'un univers
 * (`vueDuGardien`) : 1, il se voit entier.
 */
export function partDuGardienVue(id: BiomeId, forme: FormeDuGardien): number {
  const s = guardianSpot(id);
  return vueDuGardien(id)(s.x, s.y, forme);
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
