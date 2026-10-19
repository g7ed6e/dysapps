// Le plan du 6e en données (prototype du monde ouvert d'Archipéo, piste B « chemins aimantés », choix du mainteneur
// du 14 octobre 2026) : la côte en anneau, le lagon et sa passe, l'îlot du Phare, la falaise nord, la rivière de l'est,
// relevés sur le plan des lieux confirmé le 13 octobre 2026 (archipeo/univers-challenge/niveaux/plan-6e.png, dans la
// Bibliothèque du projet) ; les quatre lieux du prototype ; le réseau des chemins (sentiers, digue, pontons). Les points
// sont écrits en pixels du plan (1 800 × 1 250), pour se relire contre l'image, et convertis en unités du monde
// (`fromPlan`). Piste 1, lot 1 (choix du mainteneur du 14 octobre 2026) : l'île agrandie autour de Kéo, environ 120 pas
// du Phare aux Quais ; les lieux gardent leur taille, posés au bord de leur rivage. Code pur.
import type { Vec2 } from './geometry';
import type { Land } from './lands';

/**
 * Un pas de Kéo, en unités du monde : un demi-mètre, Kéo (2,4 unités dans la scène) mesurant un mètre et demi. Les
 * distances du monde se règlent en pas (deambuler-scenettes.md, « Échelle »).
 */
export const KEO_STEP = 0.8;

/**
 * Pixels du plan par unité du monde. Piste 1, lot 1 : 2,8 (il était de 14) : le monde est cinq fois plus grand, l'anneau
 * fait environ 380 unités d'est en ouest ; du Phare aux Quais, environ 120 pas (premier essai, à régler avec des élèves).
 */
const PLAN_SCALE = 2.8;
/** Le point du plan qui est l'origine du monde : le pied du Phare, au milieu du lagon. */
const PLAN_ORIGIN = { x: 880, y: 590 };

/** Un point du plan (en pixels de l'image) en unités du monde. */
export const fromPlan = ([px, py]: readonly [number, number]): Vec2 => ({ x: (px - PLAN_ORIGIN.x) / PLAN_SCALE, z: (py - PLAN_ORIGIN.y) / PLAN_SCALE });

const poly = (points: readonly (readonly [number, number])[]): Vec2[] => points.map(fromPlan);

/** Les couleurs du 6e (fiche du niveau, § 2), et ce qui les accompagne dans la palette du pack. */
export const COLORS_6E = {
  /** Lagon : eau claire, peu profonde. */
  lagoon: 0x2fb5a6,
  /** Bleu lagon du pack : l'eau profonde, le large. */
  deepSea: 0x178078,
  /**
   * Rivage : herbe, mousse sur la pierre ; la prairie claire des bas (GD-20, point 3, lot 3 : un vert d'eau tiré vers le
   * Vert île du pack, au lieu du vert acide #6CBF4E ; retouche : plus vert, moins d'eau, d'après les concepts validés).
   */
  grass: 0x8ad59c,
  /** L'herbe du haut de la falaise nord, plus sombre (le plan). */
  cliffTop: 0x4e8f3a,
  /** Sable chaud : plages (un peu plus clair au lot 3, sous le soleil plus chaud). */
  sand: 0xe8cf9c,
  /** La roche des pentes raides (la falaise, les berges de la rivière, les rives des bras de mer) : un gris chaud (lot 3). */
  rock: 0x968e83,
  /** Le sable mouillé, juste sous l'eau. */
  wetSand: 0xc9ad78,
  /**
   * Les sentiers : un sable éclairci (#F0E2B6 : le #E8D6A6 demandé, un cran plus clair pour s'écarter de l'herbe), plus
   * clair que la plage (#E8CF9C), et sans ombre (la vue les dessine de leur couleur même) pour se lire sur la prairie
   * claire sans l'assombrir (GD-20, point 3, lot 3, décision du directeur artistique du 17 octobre 2026 ; avant, #D6BB86,
   * à 1,03:1 de l'herbe).
   */
  path: 0xf0e2b6,
  /**
   * Le liseré de terre des sentiers, continu de part et d'autre : un brun moyen, jamais presque-noir, à 3:1 au moins du
   * sentier (même décision) ; le contraste du chemin ne tient pas à la seule teinte.
   */
  pathEdge: 0x8c7448,
  /** Le bois des pontons et de la digue (le sable chaud, plus sombre). */
  wood: 0xa9784a,
} as const;

/** Le bord extérieur de l'anneau (sable compris), dans le sens des aiguilles d'une montre depuis le nord. */
export const COAST = poly([
  [880, 112], [1010, 160], [1090, 250], [1160, 340], [1300, 410], [1440, 500], [1465, 610], [1440, 700],
  [1360, 810], [1300, 880], [1220, 940], [1100, 965], [1000, 960], [800, 972], [640, 1005], [510, 985],
  [420, 920], [395, 800], [400, 650], [398, 560], [410, 480], [480, 360], [635, 205], [745, 130],
]);

/** Le lagon, l'eau claire au milieu de l'anneau. */
export const LAGOON = poly([
  [680, 382], [800, 372], [940, 400], [1060, 420], [1140, 470], [1182, 560], [1182, 660], [1150, 725],
  [1060, 790], [950, 832], [800, 860], [735, 838], [660, 780], [600, 680], [592, 600], [610, 500],
]);

/** La passe de l'ouest : la Nef y entre, le lagon s'ouvre sur le large. */
export const PASS = poly([[380, 572], [612, 578], [612, 646], [380, 652]]);

/** L'îlot du Phare, au milieu du lagon. */
export const ISLET = poly([[800, 560], [840, 532], [930, 538], [968, 596], [944, 650], [880, 670], [820, 646], [794, 602]]);

/** La falaise du nord : la Vigie en haut, les Archives dessous (hors du prototype, mais le relief est là). */
export const CLIFF = poly([
  [640, 240], [760, 190], [830, 196], [866, 262],
  // L'éperon du rivage nord (GD-20, point 8, lot L7, directeur artistique) : la falaise avance vers l'est, au-dessus du
  // lagon, pour que les Archives y creusent leur façade, tournée au sud.
  [872, 318], [905, 325], [900, 348],
  [846, 350], [800, 366], [690, 372], [650, 328],
]);

/**
 * Le bassin des Quais, au sud du quai : l'eau devant laquelle la barque s'amarre pendant une question (le quai regardait
 * la mer du sud quand l'île était petite ; agrandie, la mer est trop loin). Son bord nord est droit, tenu par le bord de
 * quai de pierre (`DOCK_EDGE`) ; ses autres rives sont irrégulières (lot 3, directeur artistique : pas une piscine).
 */
export const DOCK = poly([
  [1056, 818],
  [1112, 818],
  [1121, 827],
  [1117, 841],
  [1104, 853],
  [1079, 849],
  [1061, 855],
  [1049, 843],
  [1051, 828],
]);

/** Le bord de quai de pierre, le long de la rive nord du bassin, d'ouest en est : là où la barque accoste. */
export const DOCK_EDGE = { from: fromPlan([1057, 818]), to: fromPlan([1111, 818]) };

/** Le haut pays de l'est, d'où descend la rivière (les Écluses « en haut »). */
export const UPLAND = { center: fromPlan([1215, 330]), radius: 130 / PLAN_SCALE, height: 6 };

/** La rivière, des Écluses à l'estuaire, et sa demi-largeur (en unités : un ruisseau de quelques pas, pas un fleuve). */
export const RIVER = { line: poly([[1222, 418], [1258, 550], [1242, 730], [1292, 842], [1400, 912], [1490, 960]]), halfWidth: 2.4 };

/**
 * Les bras de mer (GD-20, point 3, « vraies terres, vrais ponts », choix du mainteneur du 17 octobre 2026) : quatre
 * détroits creusés dans la terre, sur le même plan d'eau, qui coupent l'anneau en cinq terres ; chacun n'a qu'un passage,
 * le pont de sa terre, sur la liaison `bridge` du réseau (du côté de la terre d'avant, puis de la terre qu'il ouvre).
 * Coordonnées de l'artiste technique 3D (en pixels du plan) : une ligne et sa demi-largeur (en unités), 11 à 12,5 unités
 * d'eau de rive à rive, un cœur d'eau profonde. Le Couchant, à l'ouest de l'Escale (le rectangle x 808 à 843, y 845 à 980,
 * écrit en ligne : ses bouts arrondis sont dans le lagon et dans la mer) ; le Large, sur le chemin des Balises ; le
 * Levant, du lagon jusqu'à la rivière, que `RIVER_MOUTH` élargit jusqu'à la mer ; les Crêtes, au nord, où le chemin de
 * crête entre les Filets et les Écluses a disparu. Relecture du lot 1 (directeur artistique) : les bouts du bras
 * s'évasent en entonnoir vers la mer et le lagon (`flare`, à chaque bout de la ligne : jusqu'où, en unités, et de
 * combien la demi-largeur y grandit au bout même), plus loin au nord du Large, dont la part rectiligne raccourcit ; la
 * largeur au pont ne change pas.
 */
export const STRAITS = {
  couchant: { line: poly([[825.5, 845], [825.5, 980]]), halfWidth: 6.25, bridge: ['sud-1', 'sud-2'], flare: [[16, 7], [16, 7]] },
  large: { line: poly([[608, 680], [605, 700], [560, 995], [556, 1015]]), halfWidth: 6, bridge: ['lar-1', 'lar-2'], flare: [[34, 9], [16, 7]] },
  levant: { line: poly([[1160, 682], [1172, 690], [1245, 742]]), halfWidth: 5.5, bridge: ['est-1', 'est-2'], flare: [[14, 6], [10, 4]] },
  cretes: { line: poly([[1122, 468], [1120, 450], [1133, 302], [1135, 285]]), halfWidth: 5.5, bridge: ['est-4', 'nord-1'], flare: [[14, 6], [16, 7]] },
} as const satisfies Record<string, { line: readonly Vec2[]; halfWidth: number; bridge: readonly [string, string]; flare: readonly [readonly [number, number], readonly [number, number]] }>;

/** Un bras de mer, par sa terre. */
export type StraitId = keyof typeof STRAITS;

/**
 * L'embouchure de la rivière (même décision) : élargie, du détroit du Levant jusqu'à la mer, pour qu'aucun gué ne reste
 * entre le Levant et la Pointe du Phare ; plus haut, la rivière garde sa largeur de ruisseau, dans le Levant.
 */
export const RIVER_MOUTH = { line: poly([[1245, 742], [1292, 842], [1400, 912], [1495, 962]]), halfWidth: 4.5 } as const;

/**
 * La culée d'un pont sur sa rive : là où l'on est à moins de tant d'unités de l'eau de son bras de mer, le chemin laisse
 * la place à la pierre du pont (./paths.ts, `bridgeCut` ; ./bridges.ts).
 */
export const BRIDGE_ABUT = 3.2;

/**
 * La grève plate des Marais salants (GD-20, point 8, lot L5), sur la côte est, face au large : le sol y est aplani à
 * cette hauteur dans ce rayon (en unités), puis rejoint le sien sur `fade` unités ; seulement sur la terre (la côte ne
 * bouge pas).
 */
export const SALT_FLAT = { center: fromPlan([1430, 652]), radius: 9, fade: 5, height: 0.55 } as const;

/**
 * La porte des Écluses, depuis leur centre (relecture du lot 1 des « vraies terres », directeur artistique) : au
 * sud-ouest du canal, au bout du chemin qui vient de l'ouest, sur un palier plat (`ECLUSES_LANDING`) taillé dans la pente
 * de la vallée ; la caméra, tournée vers le nord, a le lieu devant elle, à droite de Kéo (avant, la porte à l'ouest, sur
 * la pente, l'anneau de Kéo tordu sur le relief et le lieu hors du cadre).
 */
const ECLUSES_DOOR: Vec2 = { x: -5.5, z: 2.5 };

/**
 * Le palier de la porte des Écluses (relecture du lot 1 des « vraies terres », directeur artistique) : le sol y est
 * aplani à cette hauteur dans ce rayon (en unités), puis rejoint la pente sur `fade` unités ; l'anneau de Kéo y reste
 * plan.
 */
export const ECLUSES_LANDING = { center: { x: fromPlan([1226, 404]).x + ECLUSES_DOOR.x, z: fromPlan([1226, 404]).z + ECLUSES_DOOR.z }, radius: 1.5, fade: 4.5, height: 1.7 } as const;

/**
 * Le replat de la Turbine (GD-20, point 8, lot L6a), sur la rive est de la rivière, au pied du haut pays : le sol y est
 * aplani à cette hauteur dans ce rayon (en unités), puis rejoint le sien sur `fade` unités ; la rivière et ses berges ne
 * bougent pas (seulement sur la terre, loin de l'eau).
 */
export const ENGINE_FLAT = { center: fromPlan([1302, 590]), radius: 8.5, fade: 5, height: 1 } as const;

/**
 * La grève du Chantier naval (GD-20, point 8, lot L6b), sur la côte sud, à l'est de l'Escale : aplanie comme celle des
 * Marais salants (à cette hauteur dans ce rayon, puis le sol d'avant sur `fade` unités ; au bord de l'eau, elle descend
 * encore comme la plage), pour que la cale descende droit jusqu'à la mer.
 */
export const SHIPYARD_FLAT = { center: fromPlan([1112, 938]), radius: 9.5, fade: 5, height: 0.6 } as const;

/**
 * La rampe de la Vigie (GD-20, point 8, lot L7, directeur artistique) : sans étage ni escalier, une rampe de terre et de
 * pierre en écharpe monte de la grève au plateau de la falaise, de `from` à `to` (en pixels du plan), environ 1 pour 5 ;
 * son dessus fait `halfWidth` unités de chaque côté de sa ligne, ses flancs descendent ensuite de `side` par unité
 * (terrain.ts). Kéo y marche comme sur un sentier.
 */
export const LOOKOUT_RAMP = { from: fromPlan([950, 330]), to: fromPlan([842, 232]), halfWidth: 1.7, side: 0.9 } as const;

/**
 * Les replats du rivage nord (lot L7) : la cour de l'Imprimerie, au bord du lagon, et le parvis des Archives, au pied de
 * l'éperon ; le sol y est aplani à cette hauteur dans ce rayon (en unités), puis rejoint le sien sur `fade` unités
 * (seulement sur la terre, loin de l'eau et de la falaise).
 */
export const NORTH_FLATS = [
  { center: fromPlan([975, 300]), radius: 7, fade: 5, height: 1 },
  { center: fromPlan([872, 364]), radius: 5.5, fade: 3.5, height: 0.6 },
] as const;

/**
 * La vasière de la Mangrove (GD-20, point 8, lot L8a), sur la rive sud-ouest du lagon : le sol y est aplani bas, à
 * cette hauteur dans ce rayon (en unités), puis rejoint le sien sur `fade` unités (`lowShore`, terrain.ts, comme la rive
 * basse des Ruines, `RUINS_FLAT`) ; au bord de l'eau, il descend encore comme la plage. Le disque déborde sur le lagon,
 * mais le fond de l'eau ne change pas (`heightAt` le rend avant), ni la rive (`landDistance` vient du tracé de la côte).
 */
export const MANGROVE_FLAT = { center: fromPlan([672, 805]), radius: 7, fade: 4, height: 0.46 } as const;

/**
 * La rive basse des Ruines (GD-20, point 8, lot L8b), sur la rive sud du lagon, à l'écart de l'Escale : le sol y est
 * aplani bas, à cette hauteur dans ce rayon, puis rejoint le sien sur `fade` unités ; au bord de l'eau, il descend encore
 * comme la plage. Comme pour la Mangrove (`MANGROVE_FLAT`), ni le fond de l'eau ni la rive ne bougent.
 */
export const RUINS_FLAT = { center: fromPlan([765, 858]), radius: 8, fade: 4, height: 0.5 } as const;

/**
 * Le tertre de l'Observatoire (GD-20, point 8, lot L8c), sur la pointe sud, loin de l'eau (à 19,9 de la rive) : le sol
 * y est aplani un peu au-dessus du sien (2,26 au centre) dans ce rayon (en unités), puis redescend vers la grève sur
 * `fade` unités (le rayon et le fondu n'atteignent pas l'eau : la côte ne bouge pas).
 */
export const OBSERVATORY_FLAT = { center: fromPlan([640, 948]), radius: 8, fade: 5, height: 2.4 } as const;

/**
 * Le replat de la Halle (GD-20, point 8, lot L8d), au village, juste au sud de l'Escale, derrière sa place : le sol y est
 * aplani (un peu sous le sien au centre, 1,51) dans ce rayon (en unités), puis rejoint le sol d'avant sur `fade` unités.
 */
export const COMMONS_FLAT = { center: fromPlan([935, 915]), radius: 9, fade: 5, height: 1.2 } as const;

/**
 * Le replat des Balises (GD-20, point 8, lot L9a), sur la lèvre sud de la passe, à l'ouest : le sol y est aplani à cette
 * hauteur dans ce rayon (en unités), puis rejoint le sien sur `fade` unités, seulement sur la terre, loin de l'eau (la
 * côte et la passe ne bougent pas).
 */
export const BEACONS_FLAT = { center: fromPlan([428, 690]), radius: 5.5, fade: 4, height: 1 } as const;

/**
 * Les collines des Détours (GD-20, déplacement libre, lot 2, piste B « Les sentes qui restent », choix du mainteneur du
 * 18 octobre 2026 ; places du consultant d'Archipéo, forme de l'artiste technique 3D) : une colline posée à la main par
 * terre, à la place d'une colline tirée au hasard (terrain.ts, `hillsAt`). Un plateau (`plateau`, l'apothème de son
 * hexagone), six pans en falaise (pente `cliff`, au-delà de ce qui se marche) et une seule face douce, une rampe droite de
 * `halfWidth` de demi-largeur qui descend du plateau à la pente `ramp`, vers l'angle `face` (en radians, dans le plan :
 * x vers l'est, z vers le sud), ses côtés en falaise. Chaque colline garde 3 unités d'un chemin, 15 d'un lieu, 5 de la
 * côte et 7 d'un bras de mer (le test du terrain le vérifie) ; sa rampe finit près d'un chemin, d'où on la voit.
 */
export const DETOUR_HILL = { plateau: 2.5, cliff: 1.5, ramp: 0.45, halfWidth: 2.2 } as const;

/** Une colline de Détour : son identifiant (celui du Détour), le centre de son plateau, sa hauteur et le sens de sa rampe. */
export interface DetourHill {
  id: string;
  at: Vec2;
  height: number;
  face: number;
}

const deg = (d: number) => (d * Math.PI) / 180;

/** Les quatre collines (le cinquième Détour, au Large, est un bord d'eau, sans colline). */
export const DETOUR_HILLS: readonly DetourHill[] = [
  { id: 'butte-chantier', at: { x: 119, z: 94 }, height: 7, face: deg(150) },
  { id: 'braise-herons', at: { x: -42, z: 126 }, height: 6, face: deg(180) },
  { id: 'colline-aube', at: { x: 151.5, z: 34 }, height: 7, face: deg(255) },
  { id: 'haut-cretes', at: { x: 26, z: -134 }, height: 8, face: deg(0) },
];

/**
 * Le chenal de la Nef (GD-20, lot 5) : de la passe jusqu'au bord de l'image de la mer, la bande où l'on ne pose ni mât,
 * ni bouée, ni jetée (lot L9, directeur artistique et artiste technique 3D), en pixels du plan : de x 0 à la passe
 * (612), de y 565 à 660.
 */
export const NEF_CHANNEL = { x0: 0, x1: 612, y0: 565, y1: 660 } as const;

/** Un point du monde en pixels du plan (l'inverse de `fromPlan`). */
export const toPlan = (p: Vec2): [number, number] => [p.x * PLAN_SCALE + PLAN_ORIGIN.x, p.z * PLAN_SCALE + PLAN_ORIGIN.y];

/**
 * Les mâts des Balises (lot L9a), chacun sur une roche qui affleure, en ligne vers l'ouest le long du bord sud du chenal,
 * hors de lui (y 672 à 674, la roche comprise au-dessus de 668) : environ 6 unités entre deux perches (la fiche en
 * disait 11 : serrées, elles tiennent dans la pose du lieu avec Kéo à sa porte). Presque droites, au plus loin de la
 * caméra : de la porte, à l'ouest de la station, trois mâts et leurs voyants entrent dans l'image de l'arrivée
 * (consultant Archipéo, relecture de L9).
 */
export const BEACON_MASTS: readonly Vec2[] = poly([
  [392, 672],
  [375, 672.5],
  [358, 673],
  [342, 673.5],
  [325, 674],
]);

/**
 * L'îlot de la Gare maritime (lot L9b) : un rocher bas au large de la côte ouest, modelé dans le maillage du lieu (le
 * terrain s'arrête à x 362 du plan) ; son centre, son rayon (en unités). Kéo y marche au niveau des pontons
 * (`DECK_HEIGHT`) : le dessus du quai est à cette hauteur.
 */
export const FERRY_ISLET = { center: fromPlan([338, 800]), radius: 7.5 } as const;

/** Les points du large hors de l'anneau (les mâts des Balises, l'îlot de la Gare), pour la boîte de la Carte (map.ts). */
export const OFFSHORE: readonly Vec2[] = [
  ...BEACON_MASTS,
  { x: FERRY_ISLET.center.x - FERRY_ISLET.radius, z: FERRY_ISLET.center.z },
  { x: FERRY_ISLET.center.x, z: FERRY_ISLET.center.z - FERRY_ISLET.radius },
  { x: FERRY_ISLET.center.x, z: FERRY_ISLET.center.z + FERRY_ISLET.radius },
];

/**
 * Les lieux du prototype. `saltworks` : les Marais salants (lot L5), le premier lieu neuf, qui reprend l'île des
 * nombres décimaux ; son identifiant reste neutre (son nom, choix du mainteneur, 16 octobre 2026).
 * `engine` : la Turbine (lot L6a), qui reprend l'île de la matière et de l'énergie (physique-chimie). `shipyard` : le
 * Chantier naval (lot L6b), qui reprend l'île des objets techniques (technologie). Le rivage nord (lot L7) : `lookout`,
 * la Vigie (l'île de la lecture), `archives`, les Archives (l'orthographe lexicale), `printworks`, l'Imprimerie (les
 * confusions de lettres).
 * `observatory` : l'Observatoire (lot L8c), qui reprend l'île de la géographie (habiter le monde).
 * `commons` : la Halle (lot L8d), qui reprend l'île de l'enseignement moral et civique (vivre dans une société
 * démocratique) ; pas `hall`, qui est déjà le lieu d'assemblage de l'Escale (port.ts).
 * Le large (lot L9) : `beacons`, les Balises (le vocabulaire et l'écoute de l'anglais), `ferry`, la Gare maritime (la
 * grammaire de l'anglais).
 */
export type PlaceId =
  | 'phare'
  | 'quais'
  | 'filets'
  | 'ecluses'
  | 'saltworks'
  | 'engine'
  | 'shipyard'
  | 'lookout'
  | 'archives'
  | 'printworks'
  | 'mangrove'
  | 'ruins'
  | 'observatory'
  | 'commons'
  | 'beacons'
  | 'ferry';

/**
 * Les lieux du rivage nord (lot L7), vus ensemble depuis le sud : pendant toute question de l'un, les traces des trois
 * se cachent (directeur artistique : la boule horaire de la Vigie ne se voit jamais pendant Oreille du mineur).
 */
export const NORTH_SHORE: readonly PlaceId[] = ['lookout', 'archives', 'printworks'];

/**
 * Les lieux du large (lot L9), sur le même bras de l'ouest : pendant toute question de l'un, les traces des deux se
 * cachent (le canot des Balises et le bac de la Gare sont des bateaux, une réponse d'Ears).
 */
export const LARGE: readonly PlaceId[] = ['beacons', 'ferry'];

/**
 * Pendant une question d'un lieu (`asked`), les traces que la vue cache : les siennes ; au rivage nord, où les trois
 * lieux sont voisins, celles des trois (lot L7, directeur artistique) ; au large, celles des deux (lot L9).
 */
export function hidesTraces(asked: string | null, place: string): boolean {
  if (asked === null) return false;
  const together = (group: readonly string[]) => group.includes(asked) && group.includes(place);
  return asked === place || together(NORTH_SHORE) || together(LARGE);
}

/** Un lieu d'un plan (`Id` : les identifiants des lieux de son niveau ; tous niveaux : ./levelPlan.ts). */
export interface OpenPlace<Id extends string = PlaceId> {
  id: Id;
  /** Le nouveau nom (fiche du 6e, § 4 ; pas encore validé : il ne s'affiche que derrière le drapeau). */
  name: string;
  /** « au Phare », « aux Quais » : pour les phrases. */
  at: string;
  /**
   * Le genre et le nombre de son nom (le Phare : masculin singulier ; les Écluses : féminin pluriel), pour accorder le
   * mot d'état de la Carte (« restauré », « restaurées »).
   */
  agree: 'ms' | 'mp' | 'fs' | 'fp';
  /**
   * L'île d'aujourd'hui dont il reprend les missions (ses repères stables : identifiant, matière, icône). Le lieu porte
   * toutes les missions de son île (GD-20, point 8, choix du mainteneur du 15 octobre 2026) : sa liste est celle des
   * bornes de l'île (le modèle du monde, ./mission.ts, `missionsOfPlace`), jamais écrite ici.
   */
  island: string;
  /**
   * Les missions de l'île qui se jouent déjà en scénette dans le lieu (les autres se jouent sur l'écran habituel, depuis
   * le panneau du lieu, le temps de la transition) : le Troupeau aux Filets ; aux Quais, toutes (GD-20, point 8, lot
   * L1) ; aux Écluses, toutes (lot L2) ; au Phare, toutes (lot L3) ; aux Filets, toutes (lot L4) ; aux Marais salants,
   * toutes (lot L5) ; à la Turbine, toutes (lot L6a) ; au Chantier naval, toutes (lot L6b).
   */
  scenes: readonly string[];
  /**
   * Les missions qui restent sur l'écran habituel, comme état final (lot L7, directeur artistique : Ascension à la Vigie,
   * le Filon à l'Imprimerie, aucune scène promise) : elles laissent leur trace au lieu comme les autres.
   */
  panels?: readonly string[];
  /** Le centre du modèle au sol, et son quart de tour (en radians autour de la verticale). */
  center: Vec2;
  yaw: number;
  /** Le nœud du chemin où Kéo s'arrête devant lui. */
  door: string;
  /** Le rayon de toucher autour du centre : large (rien de précis à viser). */
  touchRadius: number;
}

/**
 * Un lieu : son centre sur le plan (en pixels, posé au bord de son rivage à la nouvelle échelle), et sa porte, à
 * quelques pas de lui, en unités du monde (les lieux gardent leur taille quand l'île grandit).
 */
interface PlaceSpec extends Omit<OpenPlace, 'center' | 'door'> {
  /** Le centre sur le plan, en pixels. */
  plan: [number, number];
  /** La porte, depuis le centre, en unités. */
  door: Vec2;
}

/**
 * Le nom du Chantier naval (lot L6b), écrit ici seulement : « Le Chantier naval », choisi par le mainteneur le
 * 16 octobre 2026 (le directeur artistique recommandait « Le Carénage ») ; le lieu d’assemblage, « Le Chantier de
 * l’Escale », garde son nom. Le nom, la phrase « au … » et l'accord du mot d'état de la Carte changent ensemble, sur
 * cette ligne.
 */
const SHIPYARD_NAME = { name: 'Le Chantier naval', at: 'au Chantier naval', agree: 'ms' } as const satisfies Pick<OpenPlace, 'name' | 'at' | 'agree'>;

const PLACE_SPECS: readonly PlaceSpec[] = [
  { id: 'phare', name: 'Le Phare', at: 'au Phare', agree: 'ms', island: 'french-6e-phonology', scenes: ['syllables', 'sound-hunt', 'rhymes'], plan: [880, 590], door: { x: 0, z: 6.14 }, yaw: 0, touchRadius: 5.5 },
  {
    id: 'quais',
    name: 'Les Quais',
    at: 'aux Quais',
    agree: 'mp',
    island: 'maths-6e-calculation',
    scenes: ['times-tables', 'make-ten', 'doubles-halves', 'word-problems', 'measures'],
    plan: [1085, 783],
    door: { x: -1.71, z: -2 },
    yaw: 0,
    touchRadius: 5.5,
  },
  { id: 'filets', name: 'Les Filets', at: 'aux Filets', agree: 'mp', island: 'french-6e-grammar-spelling', scenes: ['word-classes', 'sorting', 'e-er-ez', 'plurals'], plan: [1061, 222], door: { x: -0.86, z: 3.29 }, yaw: 0.35, touchRadius: 5.5 },
  { id: 'ecluses', name: 'Les Écluses', at: 'aux Écluses', agree: 'fp', island: 'maths-6e-fractions', scenes: ['number-line', 'equivalence', 'sharing', 'place-value', 'fraction-sums'], plan: [1226, 404], door: ECLUSES_DOOR, yaw: 0, touchRadius: 5.5 },
  // Les Marais salants (lot L5) : sur la grève plate de la côte est, face au large ; le nom affiché est un nom de
  // travail (le mainteneur peut choisir « Les Salins » ou « La Saline »), écrit ici seulement.
  {
    id: 'saltworks',
    name: 'Les Marais salants',
    at: 'aux Marais salants',
    agree: 'mp',
    island: 'maths-6e-decimals',
    scenes: ['ordering', 'operations', 'scale', 'large-numbers', 'rounding-products'],
    plan: [1430, 652],
    door: { x: -1, z: 7.4 },
    yaw: 0,
    touchRadius: 6.5,
  },
  // La Turbine (lot L6a) : sur le replat de la rive est, face au sud ; ses quatre missions se jouent en C, les réponses
  // dans la colonne (le nom de la fiche validée, gardé par le directeur artistique).
  {
    id: 'engine',
    name: 'La Turbine',
    at: 'à la Turbine',
    agree: 'fs',
    island: 'physics-chemistry-6e-matter-energy',
    scenes: ['states-of-matter', 'motion-signals', 'energy-circuits', 'materials-light'],
    plan: [1300, 585],
    door: { x: -1, z: 7.6 },
    yaw: 0,
    touchRadius: 6.5,
  },
  // Le Chantier naval (lot L6b) : sur la grève de la côte sud, à l'est du Port, face au sud ; sa cale descend en oblique
  // vers le sud-ouest jusqu'à la mer ; la porte au sud-est de l'atelier. Ses quatre missions se jouent en C.
  {
    id: 'shipyard',
    ...SHIPYARD_NAME,
    island: 'technology-6e-objects',
    scenes: ['object-function', 'materials', 'information-networks', 'solve-program'],
    plan: [1112, 938],
    door: { x: 2.6, z: 6 },
    yaw: 0,
    touchRadius: 7,
  },
  // Le rivage nord (lot L7, directeur artistique) : les trois lieux groupés sur le flanc est de la falaise, près des Filets
  // (écart au plan du 6e, soumis au mainteneur) ; vus du sud, la Vigie en haut, les Archives dessous, l'Imprimerie au
  // pied. Les noms de la fiche validée. La Vigie : une mission en R (les vitraux), deux en C, Ascension sur l'écran
  // habituel ; les Archives : trois en R (les tiroirs à fiches), Facettes en C ; l'Imprimerie : Oreille du mineur en R
  // (les feuilles), le Filon sur l'écran habituel.
  {
    id: 'lookout',
    name: 'La Vigie',
    at: 'à la Vigie',
    agree: 'fs',
    island: 'french-6e-reading',
    scenes: ['comprehension', 'sentence-order', 'tense-values'],
    panels: ['fluency'],
    plan: [815, 270],
    door: { x: 0, z: 7.6 },
    yaw: 0,
    touchRadius: 6,
  },
  {
    id: 'archives',
    name: 'Les Archives',
    at: 'aux Archives',
    agree: 'fp',
    island: 'french-6e-word-spelling',
    scenes: ['missing-letters', 'word-families', 'sight-words', 'word-forms'],
    plan: [872, 356],
    door: { x: 0, z: 6.4 },
    yaw: 0,
    touchRadius: 6,
  },
  {
    id: 'printworks',
    name: 'L’Imprimerie',
    at: 'à l’Imprimerie',
    agree: 'fs',
    island: 'french-6e-letter-confusion',
    scenes: ['sound-discrimination'],
    panels: ['letter-pairs'],
    plan: [975, 300],
    door: { x: 0, z: 7.6 },
    yaw: 0,
    touchRadius: 6,
  },
  // La Mangrove (lot L8a) : sur la rive sud-ouest du lagon, à cheval sur le bord de l'eau, face au nord ; ses quatre
  // missions se jouent en C (le nom de la fiche, gardé par le directeur artistique et le consultant d'Archipéo).
  {
    id: 'mangrove',
    name: 'La Mangrove',
    at: 'à la Mangrove',
    agree: 'fs',
    island: 'life-earth-sciences-6e-living-world',
    scenes: ['living-groups', 'food-growth', 'planet-earth', 'life-enquiry'],
    plan: [672, 805],
    door: { x: 0, z: 7.5 },
    yaw: 0,
    touchRadius: 6.5,
  },
  // Les Ruines (lot L8b) : sur la rive sud du lagon, l'arcade face au sud, à demi dans l'eau ; ses quatre missions se
  // jouent en C (le nom de la fiche : un site, jamais un état).
  {
    id: 'ruins',
    name: 'Les Ruines',
    at: 'aux Ruines',
    agree: 'fp',
    island: 'history-6e-antiquity',
    scenes: ['early-humans', 'ancient-peoples', 'roman-empire', 'viewpoints'],
    plan: [765, 858],
    door: { x: 0, z: 7.9 },
    yaw: 0,
    touchRadius: 7.5,
  },
  // L'Observatoire (lot L8c) : sur le tertre de la pointe sud, face au sud ; un belvédère couvert, sans astronomie ; ses
  // trois missions se jouent en C, les réponses dans la colonne (le nom de la fiche, gardé par le consultant Archipéo).
  {
    id: 'observatory',
    name: 'L’Observatoire',
    at: 'à l’Observatoire',
    agree: 'ms',
    island: 'geography-6e-living',
    scenes: ['metropolises', 'low-density', 'inhabited-world'],
    plan: [640, 948],
    door: { x: 0, z: 7.6 },
    yaw: 0,
    touchRadius: 7,
  },
  // La Halle (lot L8d) : au village, au sud de la place de l'Escale, face au sud ; une grande toiture à quatre pans sur
  // des piliers de pierre ; ses trois missions se jouent en C, les réponses dans la colonne (le nom de la fiche).
  {
    id: 'commons',
    name: 'La Halle',
    at: 'à la Halle',
    agree: 'fs',
    island: 'civics-6e-democratic-society',
    scenes: ['representatives', 'school-secularism', 'private-life'],
    plan: [935, 915],
    door: { x: 0, z: 7.5 },
    yaw: 0,
    touchRadius: 7.5,
  },
  // Les Balises (lot L9a) : à terre, sur la lèvre sud de la passe, la porte au sud ; la station basse, sa cale vers la
  // passe, ses cinq mâts en chapelet dans la mer, vers l'ouest. Hello, Numbers et Ears en R (les bouées), Signs et
  // Famous people en C (le nom de la fiche).
  {
    id: 'beacons',
    name: 'Les Balises',
    at: 'aux Balises',
    agree: 'fp',
    island: 'english-6e-vocabulary',
    scenes: ['hello', 'numbers', 'first-listening', 'signs', 'famous-people'],
    plan: [428, 692],
    // La porte au sud-ouest de la station, près de la grève : la caméra, tournée vers le nord, y prend la station à
    // droite et trois mâts à gauche (relecture de L9).
    door: { x: -8, z: 9.5 },
    yaw: 0,
    // La porte à 12,4 du centre : le toucher du lieu va jusqu'à elle, sur la grève où sont les mâts.
    touchRadius: 10.5,
  },
  // La Gare maritime (lot L9b) : sur l'îlot au large de la côte ouest (écart au plan du 6e, choisi par le mainteneur le
  // 16 octobre 2026), reliée à la côte par une jetée ; l'auvent sur le quai nord, le pavillon à son bout est. To be, Have
  // ou has et Présent simple en R (les malles), Story time en C.
  {
    id: 'ferry',
    name: 'La Gare maritime',
    at: 'à la Gare maritime',
    agree: 'fs',
    island: 'english-6e-grammar',
    scenes: ['to-be', 'have-got', 'present-simple', 'story'],
    plan: [338, 800],
    door: { x: 1.2, z: 3.4 },
    yaw: 0,
    touchRadius: 6.5,
  },
];

export const PLACES: readonly OpenPlace[] = PLACE_SPECS.map((s) => ({
  id: s.id,
  name: s.name,
  at: s.at,
  agree: s.agree,
  island: s.island,
  scenes: s.scenes,
  ...(s.panels ? { panels: s.panels } : {}),
  center: fromPlan(s.plan),
  yaw: s.yaw,
  door: s.id,
  touchRadius: s.touchRadius,
}));

/** Un lieu du 6e seulement, par son identifiant (pour un lieu de tout niveau : `placeById` de ./levelPlan.ts). */
export const placeById = (id: PlaceId): OpenPlace => PLACES.find((p) => p.id === id)!;

/** Le lieu du 6e seulement qui reprend les missions d'une île, s'il y en a un (tout niveau : ./levelPlan.ts). */
export const placeOfIsland = (island: string): OpenPlace | undefined => PLACES.find((p) => p.island === island);

/** Un nœud du réseau des chemins. */
export interface PathNode {
  id: string;
  at: Vec2;
}

const node = (id: string, p: [number, number]): PathNode => ({ id, at: fromPlan(p) });

/** La porte d'un lieu : à son décalage de son centre, en unités. */
const doorNode = (s: PlaceSpec): PathNode => {
  const c = fromPlan(s.plan);
  return { id: s.id, at: { x: c.x + s.door.x, z: c.z + s.door.z } };
};

/**
 * L'Escale, le lieu de départ du monde continu (GD-20, lot 2) : le Port, sur la rive sud du lagon, là où la digue
 * venue du Phare touche terre, à l'ouest des Quais ; « le Port et le Phare » sont le lieu de départ, reliés par la
 * digue. Son repère : l'origine au pied du quai, sur le rivage, `x` le long du rivage vers l'est, `z` vers l'intérieur
 * des terres (au sud) ; `yaw` le tourne pour suivre le rivage. Le quai avance dans l'eau ; derrière lui, une place de
 * pierre qui monte doucement du quai, et le long du rivage, façades au sud (vers la caméra qui suit Kéo, toujours
 * tournée vers le nord), la galerie des succès, puis l'école, et au fond le lieu d'assemblage. Rien ne se pose devant
 * une porte ; le côté ouest du quai reste libre pour la Nef (lot 5).
 */
export const PORT = (() => {
  const origin = { x: 0, z: 91.1 };
  const yaw = 0.2;
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  return {
    origin,
    yaw,
    /** Un point du repère du Port dans le monde. */
    toWorld: (lx: number, lz: number): Vec2 => ({ x: origin.x + lx * c + lz * s, z: origin.z - lx * s + lz * c }),
    /** Un point du monde dans le repère du Port. */
    toLocal: (p: Vec2): Vec2 => {
      const dx = p.x - origin.x,
        dz = p.z - origin.z;
      return { x: dx * c - dz * s, z: dx * s + dz * c };
    },
  } as const;
})();

/**
 * Le pavage du Port, dans son repère : le quai, de la pointe dans l'eau jusqu'à la place, et la place, le long des
 * façades. Kéo y marche sur la pierre (`portFloor`), les chemins n'y sont pas dessinés.
 */
export const PORT_PAVING = {
  quay: { x0: -3, x1: 3, z0: -9, z1: 6.5 },
  square: { x0: -3.5, x1: 36.5, z0: 6.5, z1: 12.5 },
} as const;

/** La hauteur du quai, au-dessus de l'eau, et la pente de la place qui en monte (par unité vers l'intérieur). */
const PORT_LEVEL = { quay: 0.75, rise: 0.115, from: 1 } as const;

/** La hauteur de la pierre du Port en un point de son repère (le quai à plat, puis la place qui monte). */
export const portLevel = (lz: number): number => PORT_LEVEL.quay + PORT_LEVEL.rise * Math.max(0, lz - PORT_LEVEL.from);

const PORT_COS = Math.cos(PORT.yaw);
const PORT_SIN = Math.sin(PORT.yaw);

/**
 * La pierre du Port sous un point du monde (`x`, `z`), ou rien hors du pavage : Kéo s'y tient, au-dessus du sol. Lue à
 * chaque image (les pieds de Kéo, la caméra) : rien n'y est créé.
 */
export function portFloor(x: number, z: number): number | null {
  const dx = x - PORT.origin.x,
    dz = z - PORT.origin.z;
  const lx = dx * PORT_COS - dz * PORT_SIN,
    lz = dx * PORT_SIN + dz * PORT_COS;
  const { quay: q, square: s } = PORT_PAVING;
  const inside = (lx >= q.x0 && lx <= q.x1 && lz >= q.z0 && lz <= q.z1) || (lx >= s.x0 && lx <= s.x1 && lz >= s.z0 && lz <= s.z1);
  return inside ? portLevel(lz) : null;
}

/** Les matières de l'école, une porte chacune, dans l'ordre de la barre (Français, Maths, Anglais). */
export type PortSubject = 'french' | 'maths' | 'english';
export const PORT_SUBJECTS: readonly PortSubject[] = ['french', 'maths', 'english'];

/**
 * Les endroits du Port où Kéo se tient : le quai (le départ), chaque porte de l'école, la galerie des succès, le lieu
 * d'assemblage. Chacun a son nœud de chemin, `port-<endroit>`.
 */
export type PortSpot = 'quai' | PortSubject | 'succes' | 'chantier';

/** Le nœud du chemin d'un endroit du Port. */
export const portNode = (spot: PortSpot): string => `port-${spot}`;

/**
 * Où Kéo se tient au quai, dans le repère du Port : au pied de la place, côté est, pour que la galerie entre dans le
 * champ du départ, le Phare au fond, au bout de la digue.
 */
export const PORT_QUAY_SPOT: readonly [number, number] = [1.5, 4];

/** Les nœuds du Port, dans son repère : le quai, le pied de la place, puis devant chaque façade, à trois unités d'elle. */
const PORT_NODES: readonly { id: string; at: readonly [number, number] }[] = [
  { id: portNode('quai'), at: PORT_QUAY_SPOT },
  { id: 'port-place', at: [0, 9.5] },
  { id: portNode('succes'), at: [13, 9.5] },
  { id: portNode('french'), at: [19.3, 9.5] },
  { id: portNode('maths'), at: [22.5, 9.5] },
  { id: portNode('english'), at: [25.7, 9.5] },
  { id: portNode('chantier'), at: [34, 9.5] },
];

/** Les nœuds : les portes des lieux, les coudes des sentiers, la digue et le ponton, puis l'Escale. */
export const PATH_NODES: readonly PathNode[] = [
  ...PLACE_SPECS.map(doorNode),
  node('digue', [945, 664]),
  node('ponton', [1008, 704]),
  node('est-1', [1152, 730]),
  node('est-2', [1196, 625]),
  node('est-3', [1194, 525]),
  node('est-4', [1150, 452]),
  node('nord-1', [1092, 402]),
  node('nord-2', [1062, 330]),
  // Le carrefour des Filets (GD-20, point 3, lot 1 « Relier » ; tracé accepté par le directeur artistique) : reculé au sud
  // du lieu, hors de sa brume, pour que sa porte soit au bout d'un embranchement, jamais sur un chemin de passage.
  node('fil-0', [1064, 293]),
  // Le carrefour des Écluses (même lot) : reculé à l'ouest du lieu ; le chemin des Marais salants y part. Le chemin de
  // crête qui le reliait aux Filets a disparu avec le détroit des Crêtes (GD-20, point 3, « vraies terres »).
  node('ecl-0', [1160, 414]),
  // Vers les Marais salants (lot L5) : des Écluses, une passerelle sur la rivière juste sous le bassin d'aval, puis la
  // terre de l'est, le long de la côte, jusqu'à la grève ; le chemin contourne les bassins par l'ouest et arrive au sud,
  // face au lieu, où le chemin des abords le rejoint (relecture du directeur artistique : le lieu entier à l'arrivée ;
  // le tracé des liaisons viendra plus tard). Depuis le lot 1 « Relier » (GD-20, point 3), le chemin part du carrefour des
  // Écluses et passe la rivière un peu plus au sud, hors de la brume des Écluses.
  node('sel-1', [1215, 452]),
  node('sel-2', [1246, 434]),
  node('sel-3', [1300, 448]),
  node('sel-4', [1350, 480]),
  node('sel-5', [1392, 528]),
  node('sel-6', [1418, 592]),
  node('sel-7', [1402, 676]),
  // Vers la Turbine (lot L6a) : de l'est, une passerelle de planches sur la rivière, puis le chemin contourne le lieu par
  // le sud et monte à sa porte, au sud, face au lieu (on le voit entier à l'arrivée).
  node('tur-1', [1236, 614]),
  node('tur-2', [1268, 610]),
  node('tur-3', [1290, 632]),
  // Vers le Chantier naval (lot L6b) : de `est-1`, vers le sud, à l'est du bassin des Quais, jusqu'à la grève ; puis
  // vers l'ouest, le long de l'eau, jusqu'à la porte, au sud-est de l'atelier (le lieu entier se voit à l'arrivée).
  node('car-1', [1146, 800]),
  node('car-2', [1152, 872]),
  node('car-3', [1176, 922]),
  node('car-4', [1150, 944]),
  // Le rivage nord (lot L7) : de `nord-2`, la grève jusqu'à la cour de l'Imprimerie ; de là, le long du lagon, le parvis
  // des Archives ; et la rampe de la Vigie, du pied de la falaise à son plateau, puis la porte de la tour, au sud.
  node('imp-1', [1000, 352]),
  node('arc-1', [920, 384]),
  node('vig-1', [950, 330]),
  node('vig-2', [896, 281]),
  node('vig-3', [842, 232]),
  node('vig-4', [826, 318]),
  // Le rivage sud (lot L8) : de la place de l'Escale vers l'ouest, le long du lagon ; le pont du Couchant entre `sud-1`
  // et `sud-2`, reculé à l'ouest du détroit (GD-20, point 3, « vraies terres », artiste technique 3D).
  node('sud-1', [858, 900]),
  node('sud-2', [790, 906]),
  node('sud-3', [725, 905]),
  // Vers la Mangrove (lot L8a) : du rivage sud, le chemin remonte vers la rive et arrive au sud-est du lieu.
  node('man-1', [700, 860]),
  // Vers l'Observatoire (lot L8c) : du rivage sud, le chemin descend vers la pointe, puis arrive de l'est, côté grève, à
  // la porte, au sud, face à la rotonde.
  node('obs-1', [700, 945]),
  node('obs-2', [680, 970]),
  // Vers la Halle (lot L8d) : du rivage sud, le chemin descend vers la grève à l'ouest de la Halle, qu'il contourne, puis
  // arrive à sa porte, au sud, face à la toiture.
  node('hal-1', [885, 942]),
  // Le large (lot L9) : du bout ouest du rivage sud, le chemin longe la côte vers l'ouest ; à `lar-2`, il se sépare : au
  // nord, les Balises, sur la lèvre sud de la passe (la porte au sud, le lieu entier à l'arrivée) ; à l'ouest, la côte,
  // puis la jetée de planches jusqu'à l'îlot de la Gare maritime, où elle accoste au sud-est (`lar-5`).
  node('lar-1', [610, 880]),
  node('lar-2', [500, 835]),
  node('lar-3', [445, 760]),
  node('lar-4', [402, 808]),
  node('lar-5', [352.6, 812.9]),
  ...PORT_NODES.map(({ id, at }) => ({ id, at: PORT.toWorld(at[0], at[1]) })),
];

/** Les liaisons entre nœuds : sentiers, digue (Phare – Quais) et ponton (les Quais). */
export const PATH_EDGES: readonly (readonly [string, string])[] = [
  ['phare', 'digue'],
  ['digue', 'ponton'],
  ['ponton', 'quais'],
  ['quais', 'est-1'],
  ['est-1', 'est-2'],
  ['est-2', 'est-3'],
  ['est-3', 'est-4'],
  ['est-4', 'ecl-0'],
  ['ecl-0', 'ecluses'],
  ['est-4', 'nord-1'],
  ['nord-1', 'nord-2'],
  ['nord-2', 'fil-0'],
  ['fil-0', 'filets'],
  ['ecl-0', 'sel-1'],
  ['sel-1', 'sel-2'],
  ['sel-2', 'sel-3'],
  ['sel-3', 'sel-4'],
  ['sel-4', 'sel-5'],
  ['sel-5', 'sel-6'],
  ['sel-6', 'sel-7'],
  ['sel-7', 'saltworks'],
  ['est-2', 'tur-1'],
  ['tur-1', 'tur-2'],
  ['tur-2', 'tur-3'],
  ['tur-3', 'engine'],
  ['est-1', 'car-1'],
  ['car-1', 'car-2'],
  ['car-2', 'car-3'],
  ['car-3', 'car-4'],
  ['car-4', 'shipyard'],
  ['nord-2', 'imp-1'],
  ['imp-1', 'printworks'],
  ['imp-1', 'arc-1'],
  ['arc-1', 'archives'],
  ['imp-1', 'vig-1'],
  ['vig-1', 'vig-2'],
  ['vig-2', 'vig-3'],
  ['vig-3', 'vig-4'],
  ['vig-4', 'lookout'],
  ['port-place', 'sud-1'],
  ['sud-1', 'sud-2'],
  ['sud-2', 'sud-3'],
  // La Mangrove (lot L8a), au bout du rivage sud.
  ['sud-3', 'man-1'],
  ['man-1', 'mangrove'],
  // Les Ruines (lot L8b), une impasse depuis le rivage sud.
  ['sud-2', 'ruins'],
  // L'Observatoire (lot L8c), au bout du rivage sud, sur la pointe.
  ['sud-3', 'obs-1'],
  ['obs-1', 'obs-2'],
  ['obs-2', 'observatory'],
  // La Halle (lot L8d), juste au sud de l'Escale.
  ['sud-1', 'hal-1'],
  ['hal-1', 'commons'],
  // Le large (lot L9) : deux impasses depuis `lar-2`, les Balises au nord, la Gare maritime à l'ouest, par sa jetée.
  ['sud-3', 'lar-1'],
  ['lar-1', 'lar-2'],
  ['lar-2', 'lar-3'],
  ['lar-3', 'beacons'],
  ['lar-2', 'lar-4'],
  ['lar-4', 'lar-5'],
  ['lar-5', 'ferry'],
  // L'Escale : la digue du Phare jusqu'au quai, puis la place, le long des façades.
  ['phare', portNode('quai')],
  [portNode('quai'), 'port-place'],
  ['port-place', portNode('succes')],
  [portNode('succes'), portNode('french')],
  [portNode('french'), portNode('maths')],
  [portNode('maths'), portNode('english')],
  [portNode('english'), portNode('chantier')],
];

/**
 * Le terrain : l'étendue de la carte de hauteurs (le plan de 362 à 1 496 pixels d'ouest en est, de 86 à 1 024 du nord
 * au sud), le pas de sa grille, et ses tuiles carrées de `tileCells` cases de côté. Les tuiles ont deux niveaux de
 * détail : de près, chaque case ; de loin, une case sur `coarse` en chaque sens (`tileCells` en est un multiple).
 */
export const TERRAIN = (() => {
  const step = 1.75;
  const tileCells = 18;
  const tile = step * tileCells;
  const min = fromPlan([362, 86]);
  const max = fromPlan([1496, 1024]);
  const tilesX = Math.ceil((max.x - min.x) / tile);
  const tilesZ = Math.ceil((max.z - min.z) / tile);
  return { minX: min.x, minZ: min.z, step, tileCells, coarse: 3, tilesX, tilesZ } as const;
})();

/** La hauteur du dessus de la digue et des pontons, au-dessus de l'eau (0). */
export const DECK_HEIGHT = 0.45;

/**
 * Les cinq terres du 6e (GD-20, point 3, ./lands.ts), dans l'ordre où l'on peut les relier (chacune après la sienne) : la
 * Pointe du Phare, le départ, ouverte dès le début avec l'Escale (ses quatre lieux se touchent, sans bras de mer), puis
 * les quatre qu'on relie.
 */
export const LANDS_6E: readonly Land[] = [
  { id: 'pointe', name: 'La Pointe du Phare', places: ['phare', 'quais', 'shipyard', 'commons'], after: null, bridgeName: null },
  { id: 'couchant', name: 'Le Couchant', places: ['mangrove', 'ruins', 'observatory'], after: 'pointe', bridgeName: 'Le pont du Couchant' },
  { id: 'large', name: 'Le Large', places: ['beacons', 'ferry'], after: 'couchant', bridgeName: 'Le pont du Large' },
  { id: 'levant', name: 'Le Levant', places: ['ecluses', 'saltworks', 'engine'], after: 'pointe', bridgeName: 'Le pont du Levant' },
  { id: 'cretes', name: 'Les Crêtes', places: ['filets', 'lookout', 'archives', 'printworks'], after: 'levant', bridgeName: 'Le pont des Crêtes' },
];
