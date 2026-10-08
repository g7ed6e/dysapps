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
import { isBiomeUnlocked, islandsOf } from '../archipelago';
import { archipelagoOfIsland } from '../archipelagos';
import type { VillagePlaceId, VoxelCube } from '../cube';
import { TOWARDS_SEA, turnDirection, turnPlacedModel } from '../placement';
import { possibleLandings } from '../routing';
import { atelierModel, cacheUnLieu, lieuxVus, placeCells, placeSpot, portesDesLieux, schoolModel, TROPHY_AT, TROPHY_SIZE, trophyModel, VILLAGE_PLACES } from './village';
import { DISTANCE_DE_LA_VUE_DE_L_ILE, HAUTEUR_DES_NOMS, versLaCameraDuDessin, VUE_DE_L_ILE_PANNEAU_OUVERT } from './view';
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
export const GUARDIAN_SQUARE = 5;

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

/**
 * Ce qui peut cacher le Gardien dans la vue de l'île (GD-11, relecture des planches du 8 octobre 2026) : l'habitant (ses
 * cubes, à chacun de ses pas), les lieux du village (l'école, la salle des trophées dans toute son emprise, le lieu où
 * l'on assemble, dans les deux univers) et les bâtiments des plans, tout construits ; en cubes du cœur (le lieu pas
 * tourné, z = 1 : le premier bloc au-dessus du sol).
 */
function cubesQuiCachent(id: BiomeId): Set<string> {
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
  return out;
}

/**
 * Le Gardien posé sur un carré se voit-il dans la vue de l'île (cadrage par défaut, `viewYaw` de l'île) ? Rien
 * ne se tient entre la caméra et lui : ni un cube de `cubesQuiCachent`, ni l'étiquette du nom de l'île, qui flotte à
 * `HAUTEUR_DES_NOMS` au-dessus du milieu du cœur et se dessine par-dessus tout (sa taille à l'écran : celle de la vue de
 * l'île sur une tablette à l'horizontale, 768 px de haut). Le Gardien, dans les deux univers : la boîte du Gardien de
 * Blocland, réduit de moitié (`echelleDesGardiens`), et celle de la sentinelle d'Archipéo, autour de son milieu dans
 * le carré (le fond du carré, ou tout le carré pour un Gardien long : terrain/guardians.ts). Un rayon part de chaque
 * point de leurs faces tournées vers la caméra (une grille d'une demi-case) vers elle, dans la même direction que pour
 * une borne (`versLaCameraDuDessin`). Rend, pour un carré (par son coin), la part de ces points que la caméra voit : de
 * l'une des deux formes, ou des deux ensemble (sans `forme`, ce que demande la place du Gardien).
 */
type VueDuGardien = (x: number, y: number, forme?: FormeDuGardien) => number;

/** Le Gardien de Blocland, réduit de moitié, ou la sentinelle d'Archipéo (l'habillage). */
export type FormeDuGardien = 'gardien' | 'sentinelle';

// Par île et par LV2 : la vue des carrés du Gardien suit la place de l'habitant.
const vuesDuGardien = layoutCache<string, VueDuGardien>();

function vueDuGardien(id: BiomeId): VueDuGardien {
  const cle = `${id}:${lv2Courante()}`;
  const connue = vuesDuGardien.get(cle);
  if (connue) return connue;
  const [vx, vy, vz] = versLaCameraDuDessin(id);
  const cubes = cubesQuiCachent(id);
  let haut = GUARDIAN_HEIGHT;
  for (const k of cubes) haut = Math.max(haut, Number(k.split(',')[2]));
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
  // Les deux Gardiens, autour de leur milieu dans le carré : demi-largeur, demi-profondeur, hauteur.
  const e = etendue(gardienDuMonde(id));
  const hauteurDuModele = Math.max(...gardienDuMonde(id).map((c) => c.z)) + 1;
  const boites: [FormeDuGardien, { dx: number; dy: number; h: number }][] = [
    ['gardien', { dx: (e.x1 - e.x0) / 4, dy: (e.y1 - e.y0) / 4, h: hauteurDuModele / 2 }],
    ['sentinelle', { dx: SENTINELLE_DANS_LE_MONDE.demiLargeur, dy: SENTINELLE_DANS_LE_MONDE.demiLargeur, h: SENTINELLE_DANS_LE_MONDE.hauteur }],
  ];
  const milieu = { x: GUARDIAN_SQUARE / 2, y: gardienProfond(id) ? GUARDIAN_SQUARE / 2 : (GUARDIAN_SQUARE + 1) / 2 };
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
  // Pour chaque point : sous l'étiquette (`null`), ou les cases des cubes que coupe son rayon. Un pas de l'habitant sur
  // le carré lui-même ne compte pas : il est retiré (`creaturePlacements`).
  const rayons = new Map<string, [number, number][] | null>();
  const coupes = (px: number, py: number, pz: number) => {
    const k = `${px},${py},${pz}`;
    let r = rayons.get(k);
    if (r !== undefined) return r;
    const [u, w] = ecran(px, py, pz);
    if (Math.abs(u - eu) <= demiLargeur && Math.abs(w - ev) <= demiHauteur) r = null;
    else {
      r = [];
      // Le rayon, pas à pas (un quart de case), jusqu'au-dessus du plus haut cube qui pourrait le couper.
      for (let t = 0.25; pz + t * vz <= haut + 1; t += 0.25) {
        const [cx, cy] = [Math.floor(px + t * vx), Math.floor(py + t * vy)];
        if (cubes.has(`${cx},${cy},${Math.floor(pz + t * vz)}`)) r.push([cx, cy]);
      }
    }
    rayons.set(k, r);
    return r;
  };
  const vue: VueDuGardien = (x, y, forme) => {
    const points = forme ? parForme.get(forme)! : lesDeux;
    let vus = 0;
    for (const [px, py, pz] of points) {
      const r = coupes(x + px, y + py, pz);
      if (r !== null && r.every(([cx, cy]) => cx >= x && cy >= y && cx < x + GUARDIAN_SQUARE && cy < y + GUARDIAN_SQUARE)) vus++;
    }
    return vus / points.length;
  };
  vuesDuGardien.set(cle, vue);
  return vue;
}

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
 * (`solLibre`), réservé à lui seul : sans la petite construction de sa commande, hors de la bande de devant des bornes,
 * sans case devant une porte (ni autour), ni sur une arrivée possible d'une liaison ou la case d'entrée derrière elle ;
 * aucune de ses cases ne se tient entre la caméra de l'île et un lieu, une borne ou le chantier (`cacheUneBorne`), et
 * les pas de l'habitant n'y entrent pas (`creaturePlacements`). Rien ne cache le Gardien dans la vue de l'île : ni
 * l'habitant (ses cubes et ses pas), ni un lieu ou un bâtiment, ni l'étiquette du nom de l'île (`vueDuGardien`, relecture
 * des planches, 8 octobre 2026). Parmi ces carrés, le plus loin du départ du bonhomme et des portes, puis le plus sur le
 * côté du cœur (loin de l'axe de la caméra), puis le plus au large (loin du milieu du cœur), puis le premier de la
 * grille : un choix fixe, calculé dans le repère du lieu pas tourné ; il tourne avec son lieu (DA, 8 octobre 2026).
 *
 * La recherche se fait par paliers, du plus strict au plus large. Palier 1 : l'habitant, ses pas et une case autour
 * sont exclus. Palier 2 : seules les cases où l'habitant se tient le sont (ses pas sur le carré sont retirés). Palier
 * 3 : de plus, le décor de la côte et des marges s'efface sous le carré (`decorSousLeGardien`) ; sans carré où il se voit
 * entier, celui du palier 3 où il se voit le plus. Sans carré, même au palier 3, la place de repli (`repli`), qui
 * oublie la vue de l'île mais jamais une colline. Avec la règle « rien ne cache le Gardien » : 23 îles ont leur place au
 * palier 1, une au palier 2, 27 au palier 3 (dont 15 où il ne se voit pas entier : le test les nomme), aucune au repli.
 * Toute la recherche tient dans cette fonction.
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
  const loinDe = [AVATAR_HOME, ...portes.map(([x, y]) => ({ x, y }))];
  const milieu = { x: (coeur.x0 + coeur.x1) / 2, y: (coeur.y0 + coeur.y1) / 2 };
  // Sur le côté du cœur : loin de l'axe de la caméra qui passe par son milieu (vu de la caméra, à gauche ou à droite).
  const lh = Math.hypot(vers[0], vers[1]) || 1;
  const cote = (cx: number, cy: number) => Math.abs(((cx - milieu.x) * -vers[1] + (cy - milieu.y) * vers[0]) / lh);
  const chercher = (libre: (x: number, y: number) => boolean, vue: (x: number, y: number) => number, entier: boolean): { x: number; y: number } | null => {
    let best: { x: number; y: number } | null = null;
    let score: number[] = [-Infinity, -Infinity, -Infinity, -Infinity];
    // Derrière la bande de devant des bornes (leur rangée et la rangée d'après), dans le cœur ou contre lui.
    for (let x = coeur.x0 - 3; x <= coeur.x1 - n + 3; x++)
      for (let y = Math.max(coeur.y0, QUEST_ROW + 2); y <= coeur.y1 - n + 3; y++) {
        let ok = true;
        for (let i = 0; i < n && ok; i++) for (let j = 0; j < n && ok; j++) ok = libre(x + i, y + j);
        if (!ok) continue;
        const part = vue(x, y);
        if (entier && part < 1) continue;
        const cx = x + n / 2;
        const cy = y + n / 2;
        const loin = Math.min(...loinDe.map((p) => Math.hypot(cx - p.x - 0.5, cy - p.y - 0.5)));
        const c = [entier ? 0 : part, loin, cote(cx, cy), Math.hypot(cx - milieu.x, cy - milieu.y)];
        // Le plus vu d'abord (`entier` : vu entier, sinon écarté), puis le plus loin ; à égalité, le plus sur le côté,
        // puis le plus au large ; puis la première place de la grille (x, puis y).
        let mieux = false;
        for (let k = 0; k < c.length; k++) {
          if (c[k] > score[k] + 1e-9) mieux = true;
          if (Math.abs(c[k] - score[k]) > 1e-9) break;
        }
        if (mieux) {
          best = { x, y };
          score = c;
        }
      }
    return best;
  };
  // À chaque palier, rien ne cache le Gardien dans la vue de l'île (`vueDuGardien`) ; sans carré vu entier, même au
  // palier 3, le carré du palier 3 où il se voit le plus.
  const vu = vueDuGardien(id);
  const paliers: [1 | 2 | 3, (x: number, y: number) => boolean, Set<string>, boolean][] = [
    [1, sol.libre, habitantLarge, true],
    [2, sol.libre, habitantSeul, true],
    [3, sol.sansLeDecorDeLaCote, habitantSeul, true],
    [3, sol.sansLeDecorDeLaCote, habitantSeul, false],
  ];
  let spot: GuardianSpot | null = null;
  for (const [palier, ouvert, habite, entier] of paliers) {
    const trouve = chercher((x, y) => ouvert(x, y) && !pris.has(`${x},${y}`) && !habite.has(`${x},${y}`) && !cache(x, y), vu, entier);
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
