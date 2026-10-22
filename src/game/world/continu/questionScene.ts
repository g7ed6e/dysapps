// La scène d'une question dans un lieu (lot 4) : ce que le lieu montre de l'item (la pêche sur le filet, l'eau dans le
// sas ou sur l'échelle, les caisses en palettes de dix sur le quai), les objets qui portent les réponses (cloches,
// paniers, leviers, caisses à plaque) sur un ponton, le geste de la réaction, et la trace que la réussite laisse dans le
// lieu. Tout en volumes simples, en aplats ; rien à lire n'est peint : les mots, les nombres et les repères de
// l'échelle sont des panneaux de la page, accrochés aux points que donne ce fichier. Code pur : la vue dessine.
import { boundsOf, FacetBuilder, placeFacets, type Facets } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { placeArt } from './northShore';
import { placeById, scenePlace, type PlaceId as AnyPlaceId, type ScenePlaceId as PlaceId } from './levelPlan';
import { heightFor } from './placeGround';
import { DOCK_EDGE } from './plan6e';
import type { ItemScene } from './questions';
import { COMMONS, ENGINE, FILETS_RACK, OBSERVATORY, SHIPYARD, SLIP_N, SLIP_U, SLIP_YAW, STEAM_GAP, VALVE_PUFFS, drumFace, engineSteam, filetsRack, hullEdge, hullPoint, slipPoint } from './places';
import { MANGROVE, mangroveDeckTop } from './places';
import { RUINS } from './places';
import { BARQUE_FLOOR, LANTERN_GLASS, barque, barqueBow, barqueFloor } from './surroundingsKit';
import { heightAt, standingHeight } from './terrain';

const C = {
  deck: 0xa9784a,
  /**
   * Le dessus du quai, plus clair : les caisses s'y détachent ; sa tranche, du même bois (reprise des Quais : des planches
   * claires sur leurs pieux, pas une dalle brune ; éclairci encore à la reprise des abords, référent dys : vus de côté ou
   * de dos, Kéo et le docker s'y détachent).
   */
  quay: 0xf7e9cc,
  quaySide: 0xb08658,
  crane: 0xd9a441,
  rope: 0x5a4632,
  deckSide: 0x8a6440,
  net: 0x8e7b5a,
  netLine: 0x6f5e42,
  silver: 0xb9c4c8,
  fish: 0x5b8db0,
  fishTop: 0x9cc3da,
  fishTail: 0x46769a,
  fishEye: 0x2f3e46,
  silverTop: 0xd9e0e2,
  white: 0xf2eee4,
  grey: 0x9aa0a3,
  beak: 0xd9a441,
  paper: 0xc9cbc8,
  crab: 0x5f8f3a,
  crabTop: 0x76a64a,
  bucket: 0x6f8089,
  shrimp: 0xe58f7a,
  stone: 0xb9b2a3,
  stoneDark: 0x8f897d,
  /**
   * Le dos et les bouts des parois des sas des Écluses : le bois sombre des portes d'écluse du canal
   * (./eclusesSurroundings.ts), en planches de deux tons, ses traverses et sa margelle d'un bois plus clair.
   */
  gateWood: 0x6e5038,
  gateWoodAlt: 0x7d5b3f,
  gateWoodTop: 0x8a6848,
  /** Les dalles chaudes du sol d'une scène (lot commun des scénettes), à la place de la pierre grise : scenette.ts. */
  paving: 0xd6b98e,
  pavingSide: 0xb0926a,
  water: 0x2f8fc8,
  waterTop: 0x5fb3e0,
  empty: 0xe4ddcf,
  level: 0xfff6dc,
  /** Les traits entre les bandes du sas rempli : une eau très claire, qu'on voit sur l'eau. */
  lockLine: 0xd6ecf5,
  /** La margelle des leviers : une pierre ocre, ses joints plus sombres ; la pierre du quai en bordure. */
  ochre: 0xc9a46c,
  ochreJoint: 0xa8865a,
  // Le bronze des cloches, éclairci vers la paille, et son reflet chaud (directeur artistique) : rien de presque noir.
  bronze: 0xc8963c,
  bronzeLight: 0xe8c27a,
  // La patine du bronze, vert-de-gris : la couronne des cloches.
  patina: 0x7fae9a,
  // La corde de sonnerie de la gardienne : la brume du pack.
  ringRope: 0xe5ebe3,
  post: 0x7a5538,
  straw: 0xd9a441,
  strawDark: 0xb8862e,
  lever: 0x8a6440,
  knob: 0xc0503a,
  crate: 0xb5793f,
  crateTop: 0xc98d50,
  plate: 0xf2eee4,
  pallet: 0x8a6440,
  hull: 0x4f7fa3,
  hullTop: 0xa9784a,
  lamp: 0xffd36b,
  newRope: 0xc9a36a,
  /** La toile claire des ballots de l'Enclos, et son ombre (relecture de L4 : ils se détachent du ponton). */
  canvas: 0xeadfc6,
  /** Le creux d'un panier d'osier : une paille foncée, chaude (relecture de L4, consultant Archipéo), pas un brun noir. */
  strawInside: 0x8c6a2e,
  canvasShade: 0xd3c3a2,
  newWood: 0xc28a52,
  paint: 0xd9a441,
  /** L'anneau des élingues, en fer sombre (la moufle de la grue est en ardoise). */
  iron: 0x4a555c,
  /** Le gris d'ardoise de la toiture du Phare : la cage des lanternes de sa galerie. */
  slate: 0x6f8089,
  // Les Marais salants (lot L5, consultant Archipéo) : le sac de sel, d'un beige chaud, sa bande d'ardoise ; le sel (la
  // Brume du pack), son ombre gris-bleu et sa base ocre ; l'eau des bassins, plus claire que la mer ; l'argile des murets.
  sack: 0xdcb27c,
  sackShade: 0xc39a64,
  salt: 0xe5ebe3,
  saltShade: 0xb9c4c8,
  saltBase: 0xc9a46c,
  pan: 0x5fb3e0,
  clay: 0xb59a72,
  clayTop: 0xc7ad83,
  /** La natte des mulons : de la paille tressée. */
  mat: 0xc9a058,
  // La Turbine (lot L6a, directeur artistique) : le fer (#2F3E48) et son dessus, le cuivre, la brique, le bois clair ;
  // le fer sombre des rails ; la pierre des Écluses.
  ironTop: 0x45586a,
  copper: 0xc07a3e,
  brick: 0xb5653f,
  brickShade: 0x8e4a2e,
  lightWood: 0xdaa66a,
  engineIron: 0x2f3e48,
  // Le Chantier naval (lot L6b, directeur artistique) : le bordé et son second ton, la quille, les œuvres vives ; le
  // cordage du treuil ; le flotteur clair du capteur de marée (sans drapeau ni graduation) ; le bois neuf du gouvernail.
  planking: 0xc98e55,
  plankingShade: 0xb98049,
  keel: 0x8a5a36,
  bottom: 0xa4553a,
  cable: 0xc9a36a,
  float: 0xf2eee4,
  plankFace: 0xd9ad72,
  // La Mangrove (lot L8a, directeur artistique) : la pirogue (sa coque et son intérieur, plus clair) ; les bois des
  // passerelles ; le carnet Bleu lagon, en accent ; la claie et ses godets, le vert des jeunes plants ; les roseaux.
  pirogue: 0x8c4f32,
  pirogueInside: 0xc9925f,
  walkway: 0xb98654,
  walkwayDark: 0x8a6440,
  notebook: 0x178078,
  pot: 0xb07a52,
  sapling: 0x4f8f4a,
  reed: 0xc2ad6a,
  reedShade: 0xa8945a,
  // Les Ruines (lot L8b, directeur artistique) : la pierre des Passeurs et son ombre, le bronze des clés, le sable des
  // fouilles (et le fond de la fosse, d'une seule couleur, jamais des couches), la toile écrue de la tente, la corde.
  passeurStone: 0xdcd0b5,
  passeurShade: 0xb9a988,
  passeurBronze: 0x9c7a3c,
  digSand: 0xcdb58a,
  pitFloor: 0xa48b62,
  tentCanvas: 0xe8e0cc,
  cord: 0xe0d3b0,
  // L'Observatoire (lot L8c, directeur artistique) : l'enduit du tambour et son ombre (les mêmes que places.ts, ramenés
  // vers le Sable du pack), la vitre pâle et unie, les volets Bleu lagon ; la pierre des Passeurs, `passeurStone` (plus
  // haut, la même valeur de base que places.ts).
  plaster: 0xe0bf94,
  plasterShade: 0xc4a074,
  bayGlass: 0xd9e6e8,
  shutter: 0x178078,
  // La Halle (lot L8d, directeur artistique) : le bronze des Passeurs (le bec de la borne), l'eau du filet et de l'auge,
  // un aplat clair ; le chêne des bancs et des pupitres et son dessus ; la haie taillée et son dessus.
  passeursBronze: 0x9c7a3c,
  fountainWater: 0xa9dceb,
  oak: 0x8e6a48,
  oakTop: 0xa98258,
  hedge: 0x4f8a3c,
  hedgeTop: 0x5f9c48,
} as const;

/** La hauteur où l'on se tient en un point (le sol, ou le dessus de la digue sur l'eau). */
const groundAt = (p: Vec2): number => standingHeight(heightAt(p));

/** La même, sur le sol du niveau d'un lieu (la Montée, au 5e : ./placeGround.ts). */
const groundOf = (place: PlaceId, p: Vec2): number => standingHeight(heightFor(place)(p));

/**
 * Le quai de la scénette des Quais (piste 1, lot 3) : son bord sur le bassin (`front`, en unités au sud du centre du
 * lieu, contre le bord de quai de pierre), sa largeur et sa profondeur au moins, et la bande de devant où se tiennent
 * Kéo et le docker (`strip`) ; les caisses de l'item sont derrière elle. Le bord ne bouge pas d'un item à l'autre : le
 * quai s'allonge vers le nord quand les caisses sont nombreuses.
 */
export const QUAY = { dx: 0.5, front: 12, width: 12, depth: 5.6, strip: 1.6 } as const;

/**
 * Le centre de la scène d'un item, devant son lieu (au sud : vers la caméra), et la demi-taille de sa plate-forme. Aux
 * Filets et aux Écluses (lot 4 de la piste 1), la demi-taille est celle de toute la scénette (la plate-forme de l'item,
 * les planchers de Kéo et de l'habitant, le canal), relevée finement (`fine`) : son sol ne s'enfonce nulle part. Les Filets se décalent vers la grève, à l'est, où le sol est plat.
 */
const SCENE_SPOT: Record<PlaceId, { dx: number; dz: number; half: [number, number]; fine?: true }> = {
  phare: { dx: 0, dz: 0.5, half: [0, 0] },
  filets: { dx: 2.5, dz: 5, half: [5.8, 1.6], fine: true },
  ecluses: { dx: -0.5, dz: 5, half: [5.5, 1.2], fine: true },
  // Les Marais salants (lot L5) : le bord d'un bassin, au sud de la grille, sur la grève plate.
  saltworks: { dx: 0, dz: 6.4, half: [6, 1.6], fine: true },
  // La Turbine (lot L6a) : le dallage devant la chaudière, le rotor derrière, à l'est.
  engine: { dx: 0, dz: 4.4, half: [5, 1.4], fine: true },
  // Le Chantier naval (lot L6b) : le plancher au sud-est de la coque, le long de son flanc, sur la grève aplanie.
  shipyard: { dx: -0.03, dz: 5.31, half: [3.2, 1], fine: true },
  // La Mangrove (lot L8a) : le platelage de rive, au bord de l'eau, le lagon derrière lui.
  mangrove: { dx: MANGROVE.deck.x, dz: MANGROVE.deck.z, half: [4.6, 1.5], fine: true },
  // Les Ruines (lot L8b) : le dallage devant l'arcade, face à sa deuxième pile ; deux arcs entiers derrière.
  ruins: { dx: RUINS.arcade.piles[1], dz: -1.2, half: [4.4, 1.3], fine: true },
  // L'Observatoire (lot L8c) : la terrasse au sud du tambour, contre lui, loin du parapet (il reste sous les pieds de Kéo
  // et de la photographe, relecture de L8c-d).
  observatory: { dx: 0, dz: 4.0, half: [4.4, 1.2], fine: true },
  // La Halle (lot L8d) : sous le bord sud de la toiture, entre les deux piliers du milieu.
  commons: { dx: 0, dz: 4.4, half: [4.4, 1.2], fine: true },
  quais: { dx: QUAY.dx, dz: QUAY.front - QUAY.depth / 2, half: [QUAY.width / 2, QUAY.depth / 2] },
  // Le rivage nord (lot L7) : la scène de chaque lieu, dans son fichier (placeArt.ts).
  lookout: placeArt('lookout')!.sceneSpot,
  archives: placeArt('archives')!.sceneSpot,
  printworks: placeArt('printworks')!.sceneSpot,
  // Le large (lot L9) : la cale des Balises, le quai sous l'auvent de la Gare maritime.
  beacons: placeArt('beacons')!.sceneSpot,
  ferry: placeArt('ferry')!.sceneSpot,
  // Le 5e (GD-22, lot 3) : le plancher de la Montée, devant le bassin, face au trait de zéro.
  montee: placeArt('montee')!.sceneSpot,
  // Le Hameau (lot 5) : le ponton devant la bouche du four.
  hameau: placeArt('hameau')!.sceneSpot,
  // Les Radeaux (lot 6) : le quai devant la façade de la cabane du marchand.
  radeaux: placeArt('radeaux')!.sceneSpot,
  // La Croisée (lot 7) : le rond-point devant le pont, la cabane et le pied du tronc derrière.
  croisee: placeArt('croisee')!.sceneSpot,
  // Les Instants (lot 8) : le débarcadère de la rive est.
  instants: placeArt('instants')!.sceneSpot,
  // Les Fumerolles (lot 9) : la dalle de relevé, devant la cabane de la sondeuse.
  fumerolles: placeArt('fumerolles')!.sceneSpot,
  // L'Étuve (lot 10) : le pavé devant l'établi, le four à gauche derrière, le chalet à droite.
  etuve: placeArt('etuve')!.sceneSpot,
  // Les Terrasses (lot 11) : le pavé gris devant le moulin, sa porte derrière, le bas du tertre à gauche.
  terrasses: placeArt('terrasses')!.sceneSpot,
  // L'Auberge (lot 12) : le parvis, la façade et sa porte derrière.
  auberge: placeArt('auberge')!.sceneSpot,
  // Le Donjon (lot 13a) : la cour devant le logis, sa porte derrière, le pied du piton à gauche.
  donjon: placeArt('donjon')!.sceneSpot,
  // L'Oracle (lot 13b) : dans l'abri, devant le fond peint, sous la voûte.
  oracle: placeArt('oracle')!.sceneSpot,
  // Le Sémaphore (lot 14) : la cour, la façade sud et sa porte derrière, la corne à gauche.
  semaphore: placeArt('semaphore')!.sceneSpot,
  // Le Gaillard (lot 15) : la cour devant le perron, la porte et son linteau derrière.
  gaillard: placeArt('gaillard')!.sceneSpot,
  // Les Nacelles (lot 16) : la cour devant le quai, le pied du mât et un rouage à gauche, la halle derrière.
  nacelles: placeArt('nacelles')!.sceneSpot,
  forge: placeArt('forge')!.sceneSpot,
  // La Soute (lot 2 du 4e) : les planches du quai, devant la halle, au sud de la bitte.
  soute: placeArt('soute')!.sceneSpot,
  // La Porte (lot 2 du 4e) : la place, au milieu du cercle des bancs, derrière le portail.
  porte: placeArt('porte')!.sceneSpot,
  // L'Étalon (lot 2 du 4e) : la cour devant la façade, la bascule à gauche, le mur des niches derrière.
  etalon: placeArt('etalon')!.sceneSpot,
};

/** Les points relevés sous la plate-forme d'une scène : ses coins et son milieu, ou tous les pas d'une unité (`fine`). */
function spotSamples(place: PlaceId): Vec2[] {
  const p = placeById(place);
  const s = SCENE_SPOT[place];
  const at = { x: p.center.x + s.dx, z: p.center.z + s.dz };
  const nx = s.fine ? Math.ceil(s.half[0]) : 1;
  const nz = s.fine ? Math.ceil(s.half[1]) : 1;
  const out: Vec2[] = [];
  for (let i = -nx; i <= nx; i++) for (let k = -nz; k <= nz; k++) out.push({ x: at.x + (i / nx) * s.half[0], z: at.z + (k / nz) * s.half[1] });
  return out;
}

/**
 * Le point de la scène d'un item dans un lieu : au sol, au plus haut de sa plate-forme (elle ne s'enfonce jamais dans
 * une pente ; elle descend jusqu'au sol sous elle, `sceneDepth`).
 */
export function sceneSpot(anyPlace: AnyPlaceId): Vec3 {
  const place = scenePlace(anyPlace);
  const p = placeById(place);
  const s = SCENE_SPOT[place];
  const at = { x: p.center.x + s.dx, z: p.center.z + s.dz };
  let y = groundOf(place, at);
  for (const q of spotSamples(place)) y = Math.max(y, groundOf(place, q));
  return { x: at.x, y, z: at.z };
}

/** La profondeur de la plate-forme d'une scène, sous le point de la scène : assez pour toucher le sol d'une pente. */
const PLATFORM_DEPTH = 1.5;

/** Le fond de l'eau, pour les jupes des planchers : un peu sous la surface (0). */
const UNDER_WATER = -0.3;

/**
 * La profondeur des planchers d'une scène sous son point : jusqu'au plus bas du sol sous elle (ou un peu sous l'eau),
 * jamais moins que `PLATFORM_DEPTH`.
 */
export function sceneDepth(place: PlaceId): number {
  const y = sceneSpot(place).y;
  const height = heightFor(place);
  const low = Math.min(...spotSamples(place).map((q) => Math.max(UNDER_WATER, height(q))));
  return Math.max(PLATFORM_DEPTH, y - low + 0.2);
}

/** Des facettes agrandies de `k` depuis leur origine, puis posées en `at`. */
function placed(f: Facets, k: number, at: Vec3 = { x: 0, y: 0, z: 0 }): Facets {
  const positions = new Float32Array(f.positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = f.positions[i] * k + at.x;
    positions[i + 1] = f.positions[i + 1] * k + at.y;
    positions[i + 2] = f.positions[i + 2] * k + at.z;
  }
  return { ...f, positions };
}

/**
 * La pêche agrandie pour tenir dans le creux d'un panier d'osier de l'échelle `scale` (sans dépasser sa taille dans le
 * filet), centrée sur lui : rien ne dépasse du rebord (le bord fait 0,9 de large ; relecture de L4, bilan de la Récolte).
 */
function basketFit(f: Facets, scale: number): Facets {
  const { min, max } = boundsOf(f);
  const width = Math.max(max[0] - min[0], max[2] - min[2], 1e-3);
  const k = Math.min(CATCH_SCALE, (BASKET_HOLLOW * scale) / width);
  return placed(f, k, { x: (-k * (min[0] + max[0])) / 2, y: 0, z: (-k * (min[2] + max[2])) / 2 });
}

/** La taille de la pêche : à la mesure du filet, lisible de loin. */
const CATCH_SCALE = 1.6;

// ---------- La place de la question à l'écran ----------

/** Ce que la page garde autour de la question, en pixels. */
export const ANSWER_LAYOUT = {
  /** La hauteur d'une étiquette de réponse (48 px au moins), sur tablette et sur un écran bas. */
  label: 56,
  labelLow: 48,
  edge: 12,
  edgeLow: 8,
  gap: 12,
  maxWidth: 200,
  /** La largeur d'une étiquette en dessous de laquelle la rangée prend toute la largeur (les mots des cloches). */
  minLabel: 72,
  minLabelBells: 116,
  /** L'écart entre l'objet et son étiquette. */
  lift: 4,
  /** La hauteur d'un objet : au moins celle de son étiquette, au plus une part de l'écran. */
  objectShare: 0.6,
  objectMax: 0.15,
  /** Les cloches, plus petites que les autres objets. */
  bellMax: 0.09,
  /** La colonne, à gauche : sa part de la largeur. */
  panelMax: 400,
  panelShare: 0.38,
  /** Sur tablette, une colonne plus large quand l'item a sa règle (la carte de l'accord tient en moins de lignes). */
  panelAidMax: 480,
  panelAidShare: 0.46,
  /** La barre du haut : « Vue simple » et la pause (56 px de haut). */
  bar: 56,
  /** En dessous de cette hauteur d'écran, un téléphone couché : la rangée des réponses en bas. */
  low: 500,
} as const;

/** Un rectangle de l'écran, en pixels depuis le coin haut gauche. */
export interface ScreenBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** La place d'une réponse : son étiquette, le pied de son objet, et la cible de toucher qui couvre les deux. */
export interface AnswerSlot {
  label: ScreenBox;
  foot: { x: number; y: number };
  hit: ScreenBox;
}

/** La place de la question à l'écran. */
export interface QuestionLayout {
  /** Un écran bas (un téléphone couché) : la consigne en icône, les réponses en bas, la règle à droite. */
  low: boolean;
  slots: AnswerSlot[];
  /** La hauteur d'un objet à l'écran (au moins celle de son étiquette). */
  objectHeight: number;
  /** La colonne de la phrase, de la ligne de calcul, d'une action et du résultat (fond uni), à gauche. */
  panel: { left: number; top: number; width: number; maxHeight: number };
  /** La règle affichée, hors de la colonne sur un écran bas ; `null` : dans la colonne. */
  aid: ScreenBox | null;
  /** Là où la scène de l'item se montre. */
  view: ScreenBox;
  /**
   * Une scénette (./scenette.ts) : là où Kéo et l'habitant se tiennent, et la place de « Valider » en bas à droite
   * (`null` : dans la colonne). Absent : une question du lot 4.
   */
  scenette?: { stage: ScreenBox; validate: ScreenBox | null };
}

/** Ce que demande une question : combien de réponses, des mots longs (les cloches), une règle, la scène au milieu. */
export interface QuestionNeeds {
  count: number;
  bells?: boolean;
  aid?: boolean;
  /** Sur un écran bas, la colonne élargie d'un cran ou deux quand la phrase n'y tient pas (`PANEL_LOW_SHARES`). */
  widen?: number;
}

/** La part de la largeur que prend la colonne sur un écran bas : 38 %, puis plus large si la phrase n'y tient pas. */
const PANEL_LOW_SHARES = [0.38, 0.46, 0.54] as const;
/**
 * Au-delà de 54 % (un très grand texte), la phrase passe seule en pleine largeur, sur un panneau sous la barre du haut
 * et au-dessus des objets (`WIDEN_FULL`) ; si elle n'y tient toujours pas, l'écran propose « Vue simple » d'emblée
 * (`WIDEN_OFFER`, même place).
 */
export const WIDEN_FULL = PANEL_LOW_SHARES.length;
export const WIDEN_OFFER = WIDEN_FULL + 1;
/**
 * Le cran le plus large où la scène garde sa place à droite de la colonne (54 %) : en C sur un écran bas, revenu de
 * « Vue simple » à « Scène », la colonne n'en passe plus (GD-20, point 8, L8).
 */
export const WIDEN_SCENE = WIDEN_FULL - 1;

/**
 * La place d'une question sur un écran de `width` × `height` pixels.
 * Sur tablette, la colonne à gauche, et les réponses dans le tiers du milieu, chaque étiquette posée au-dessus de son
 * objet, à droite de la colonne si elles y tiennent, sinon sur toute la largeur sous la colonne.
 * Sur un écran bas, la colonne étroite à gauche (38 %), les réponses en rangée en bas, les objets juste au-dessus
 * (jamais derrière les étiquettes), la règle à droite. Rien ne défile.
 */
export function questionLayout(needs: QuestionNeeds, width: number, height: number): QuestionLayout {
  const L = ANSWER_LAYOUT;
  const low = height < L.low;
  const n = Math.max(1, needs.count);
  const edge = low ? L.edgeLow : L.edge;
  const lh = low ? L.labelLow : L.label;
  const top = edge + L.bar + edge;
  const full = low && (needs.widen ?? 0) >= WIDEN_FULL;
  const lowShare = PANEL_LOW_SHARES[Math.max(0, Math.min(PANEL_LOW_SHARES.length - 1, needs.widen ?? 0))];
  const panelW = low ? lowShare * width : needs.aid ? Math.min(L.panelAidMax, L.panelAidShare * width) : Math.min(L.panelMax, L.panelShare * width);
  const panelRight = edge + panelW;
  const minLabel = needs.bells ? L.minLabelBells : L.minLabel;
  const slotWidth = (left: number, right: number) => Math.min(L.maxWidth, (right - left - (n - 1) * L.gap) / n);
  // Sur tablette, la rangée tient-elle à droite de la colonne ? Sur un écran bas, elle prend toujours toute la largeur.
  const beside = !low && slotWidth(panelRight + edge, width - edge) >= minLabel;
  const rowLeft = beside ? panelRight + edge : edge;
  const rowRight = width - edge;
  const w = Math.max(48, slotWidth(rowLeft, rowRight));
  const objectHeight = Math.max(lh, Math.min(L.objectShare * (w + L.gap), (needs.bells ? L.bellMax : L.objectMax) * height));
  const total = n * w + (n - 1) * L.gap;
  const first = (rowLeft + rowRight - total) / 2;
  const slots: AnswerSlot[] = [];
  for (let i = 0; i < n; i++) {
    const left = first + i * (w + L.gap);
    const x = left + w / 2;
    if (low) {
      const label = { left, right: left + w, top: height - edge - lh, bottom: height - edge };
      const foot = { x, y: label.top - L.lift };
      slots.push({ label, foot, hit: { left, right: left + w, top: foot.y - objectHeight, bottom: label.bottom } });
    } else {
      // L'objet dans le tiers du milieu, son étiquette au-dessus.
      const foot = { x, y: Math.round((2 * height) / 3) };
      const label = { left, right: left + w, bottom: foot.y - objectHeight - L.lift, top: foot.y - objectHeight - L.lift - lh };
      slots.push({ label, foot, hit: { left, right: left + w, top: label.top, bottom: foot.y } });
    }
  }
  const highest = Math.min(...slots.map((s) => s.hit.top));
  const panel = full
    ? { left: edge, top, width: width - 2 * edge, maxHeight: Math.max(0, highest - edge - top) }
    : {
        left: edge,
        top: edge,
        width: panelW,
        maxHeight: Math.max(0, (low || !beside ? highest - edge : height - edge) - edge),
      };
  const viewBottom = highest - edge;
  const aid = low && needs.aid && !full ? { left: panelRight + edge, top, right: width - edge, bottom: viewBottom } : null;
  return { low, slots, objectHeight, panel, aid, view: { left: panelRight + edge, top, right: width - edge, bottom: Math.max(top + 48, viewBottom) } };
}

// ---------- Les objets des réponses ----------

/**
 * L'objet qui porte une réponse dans chaque lieu ; aucun à la Turbine (lot L6a) ni au Chantier naval (lot L6b), où
 * toutes les missions se jouent en C, les réponses dans la colonne. Au rivage nord (lot L7), celui du
 * fichier du lieu (`lieu` : placeArt.ts, `answer`) : les vitraux de la Vigie, les tiroirs à fiches des Archives, les
 * feuilles de l'Imprimerie.
 */
const ANSWER_OBJECT: Record<PlaceId, 'cloche' | 'panier' | 'levier' | 'caisse' | 'sac' | 'lieu' | null> = {
  phare: 'cloche',
  filets: 'panier',
  ecluses: 'levier',
  quais: 'caisse',
  saltworks: 'sac',
  engine: null,
  shipyard: null,
  lookout: 'lieu',
  archives: 'lieu',
  printworks: 'lieu',
  mangrove: null,
  ruins: null,
  observatory: null,
  commons: null,
  // Le large (lot L9) : les bouées des Balises, les malles de la Gare maritime.
  beacons: 'lieu',
  ferry: 'lieu',
  // Le 5e (GD-22, lot 3) : les godets pendus de la Montée.
  montee: 'lieu',
  // Le Hameau (lot 5) : les miches sur la planche à pain.
  hameau: 'lieu',
  // Les Radeaux (lot 6) : les poids sur la planche de comptoir.
  radeaux: 'lieu',
  // La Croisée (lot 7) : les bobines sur la planche à cordes.
  croisee: 'lieu',
  // Les Instants (lot 8) : les galets sur la planche de l'établi.
  instants: 'lieu',
  // Les Fumerolles (lot 9) : les galets sur la planche à relevés.
  fumerolles: 'lieu',
  // L'Étuve (lot 10) : les gobelets dans la planche percée.
  etuve: 'lieu',
  // Les Terrasses (lot 11) : les bols de riz sur le long banc de pierre.
  terrasses: 'lieu',
  // L'Auberge (lot 12) : les malles bombées sur la planche à tréteaux.
  auberge: 'lieu',
  // Le Donjon (lot 13a) : les claveaux sur le banc de bois.
  donjon: 'lieu',
  // L'Oracle (lot 13b) : les lampes à huile éteintes sur la banquette de pierre.
  oracle: 'lieu',
  // Le Sémaphore (lot 14) : les fanions unis, distingués par leur forme, sur la planche à encoches.
  semaphore: 'lieu',
  // Le Gaillard (lot 15) : les petites toiles nues sur le rail bas à tréteaux.
  gaillard: 'lieu',
  // Les Nacelles (lot 16) : les moufles pendues à la poutre basse.
  nacelles: 'lieu',
  forge: 'lieu',
  // La Soute (lot 2 du 4e) : les petites caisses de bois clair, sans motif.
  soute: 'lieu',
  // La Porte (lot 2 du 4e) : les planchettes de bois clair, debout sur un banc bas.
  porte: 'lieu',
  // L'Étalon : les poids de fonte ronds, sur leur planche.
  etalon: 'lieu',
};

/** La hauteur et la demi-largeur de chaque objet, à l'échelle 1. */
const OBJECT_SIZE: Record<Exclude<(typeof ANSWER_OBJECT)[PlaceId], 'lieu' | null>, { height: number; half: number }> = {
  cloche: { height: 1, half: 0.45 },
  panier: { height: 0.9, half: 0.5 },
  levier: { height: 1.8, half: 0.32 },
  caisse: { height: 1.4, half: 0.42 },
  sac: { height: 1.15, half: 0.36 },
};

/** L'écart entre deux objets voisins, au sol (deux unités s'il n'y en a qu'un). */
const stepOf = (points: readonly Vec3[]): number => (points.length > 1 ? Math.hypot(points[1].x - points[0].x, points[1].z - points[0].z) : 2);

/**
 * L'échelle des objets des réponses : leur hauteur `height` (en unités du monde, tirée de la hauteur à l'écran), sans
 * qu'un objet déborde sur la place de son voisin.
 */
export function answerScale(anyPlace: AnyPlaceId, points: readonly Vec3[], height: number): number {
  const place = scenePlace(anyPlace);
  const kind = ANSWER_OBJECT[place];
  if (!kind) return 1;
  const size = kind === 'lieu' ? placeArt(place)?.answer?.size : OBJECT_SIZE[kind];
  if (!size) return 1;
  return Math.max(0.05, Math.min(height / size.height, (0.45 * stepOf(points)) / size.half));
}

/** Les couleurs d'une cloche : le bronze, son reflet (les vagues) et la patine de sa couronne. */
interface BellColors {
  body: number;
  light: number;
  patina: number;
}

const BRONZE: BellColors = { body: C.bronze, light: C.bronzeLight, patina: C.patina };
const LIT: BellColors = { body: C.lamp, light: C.lamp, patina: C.lamp };

/** Le rayon du corps d'une cloche (à l'échelle 1) à la hauteur `y` : de la lèvre à l'épaule. */
const bellRadius = (y: number) => 0.4 - (0.18 * (y - 0.1)) / 0.62;

/**
 * Une cloche pendue, sans lettre (lot 2) : la lèvre évasée, le corps de bronze, une frise de vagues en relief à mi-hauteur,
 * la couronne patinée et son anneau ; de `p` (sa lèvre) à `p.y + s` (son anneau). `grow` : plus grande, son anneau à la
 * même place (la lumière de la réaction) ; `swing` : penchée de côté autour de son anneau, comme une cloche qu'on vient
 * de tirer (une cloche choisie : sa forme le dit, pas seulement la couleur de son étiquette).
 */
function bell(b: FacetBuilder, p: Vec3, s: number, colors: BellColors, grow = 1, swing = 0): void {
  const f = new FacetBuilder();
  f.prism({ x: 0, y: 0, z: 0 }, 0.45, 0.4, 0.1, 10, colors.body, colors.light);
  f.prism({ x: 0, y: 0.1, z: 0 }, 0.4, 0.22, 0.62, 10, colors.body, colors.patina);
  f.prism({ x: 0, y: 0.72, z: 0 }, 0.2, 0.12, 0.16, 8, colors.patina);
  f.box({ x: 0, y: 0.88, z: 0 }, [0.1, 0.12, 0.1], colors.patina);
  // La frise : une bande de vagues (cinq crêtes) posée sur le corps, un peu en saillie.
  const N = 20;
  const ring = (k: number, dy: number) => {
    const a = (2 * Math.PI * k) / N;
    const y = 0.36 + 0.06 * Math.sin(5 * a) + dy;
    const r = bellRadius(y) + 0.02;
    return [r * Math.cos(a), y, r * Math.sin(a)] as const;
  };
  for (let k = 0; k < N; k++) f.quad(ring(k + 1, -0.035), ring(k, -0.035), ring(k, 0.035), ring(k + 1, 0.035), colors.light);
  const built = f.build();
  const k = s * grow;
  const pos = built.positions;
  const nor = built.normals;
  const cs = Math.cos(swing), sn = Math.sin(swing);
  for (let i = 0; i < pos.length; i += 3) {
    // Autour de l'anneau (en haut), dans le plan de l'écran, puis à l'échelle, puis à sa place : l'anneau reste en
    // `p.y + s`.
    const x = pos[i], y = pos[i + 1] - 1;
    pos[i] = (x * cs - y * sn) * k + p.x;
    pos[i + 1] = (x * sn + y * cs) * k + p.y + s;
    pos[i + 2] = pos[i + 2] * k + p.z;
    const nx = nor[i], ny = nor[i + 1];
    nor[i] = nx * cs - ny * sn;
    nor[i + 1] = nx * sn + ny * cs;
  }
  b.append(built);
}

/** Où pendent les cloches d'une scénette : la main qui tient la corde de sonnerie, et le haut de la rambarde. */
interface BellHanging {
  hand: Vec3;
  rail: Vec3;
}

/**
 * Ce qui change l'allure des objets : les choisis (`picked` : une cloche balancée, une caisse penchée en arrière, un
 * signe de forme, pas seulement de couleur), ceux qui sont partis avec la réaction (`gone` : la bonne caisse, montée
 * au crochet), et où pendent les cloches d'une scénette (`hanging`).
 */
export interface AnswerLook {
  picked?: readonly number[];
  gone?: readonly number[];
  hanging?: BellHanging;
  /**
   * La hauteur du sol sous le ponton des réponses, quand il est posé à terre (les Filets, les Écluses) : sa jupe y
   * descend. Sans elle, le ponton flotte sur l'eau (les Quais).
   */
  ground?: number;
  /** Le geste « ranger » (lot L4) : quels objets sont des paniers, l'objet tenu, et où chaque objet est rangé. */
  sort?: SortLook;
}

/**
 * Le geste « ranger » vu par la scène, en places de la rangée (la vue ne décide rien, elle dessine) : `bins`, les places
 * des paniers ; `held`, la place de l'objet tenu ; `placed[i]`, la place du panier où l'objet de la place `i` est rangé
 * (`null` : sur le ponton) ; `moving`, la place d'un objet qui vole vers son panier (la réaction le dessine).
 */
export interface SortLook {
  bins: readonly number[];
  held: number | null;
  placed: readonly (number | null)[];
  moving?: number | null;
  /** Un écran bas (un téléphone couché) : les paniers y prennent moins de l'écart entre deux places (`sortScales`). */
  low?: boolean;
}

/** Les paniers du geste « ranger » : une fois et demie ceux du Troupeau (directeur artistique, lot L4), au plus. */
const SORT_BIN_SCALE = 1.5;
/** L'objet tenu : soulevé de 0,3 unité et un peu penché, il reste à sa place (il ne va pas vers Kéo). */
export const HELD_LIFT = 0.3;
const HELD_TILT = 0.25;

/**
 * Un objet à ranger de l'Enclos : un ballot de toile claire ficelé de deux tours de corde (relecture de L4, directeur
 * artistique : il se détache du ponton). Tous les mêmes : rien ne dit un ou plusieurs (la réponse) ; seule l'étiquette
 * les distingue. `tilt` : penché (tenu).
 */
export function sortPrise(b: FacetBuilder, at: Vec3, s: number, tilt = 0): void {
  const c = Math.cos(tilt),
    sn = Math.sin(tilt);
  b.box({ x: at.x, y: at.y, z: at.z, yaw: tilt }, [0.6 * s, 0.34 * s, 0.42 * s], C.canvasShade, C.canvas);
  for (const k of [-1, 1]) b.box({ x: at.x + k * 0.15 * s * c, y: at.y - 0.01, z: at.z - k * 0.15 * s * sn, yaw: tilt }, [0.06 * s, 0.37 * s, 0.45 * s], C.rope);
}

/**
 * La part de l'écart entre deux places de la rangée que prend un panier, au plus : le panier du bout de la rangée reste
 * entier, à 28 px du bord environ (relecture de L4, directeur artistique) : 0,42 sur un écran bas (844 px de large),
 * 0,52 sur une tablette (1024 px), où la caméra voit la rangée de plus loin.
 */
const SORT_BIN_GAP = { low: 0.42, wide: 0.52 } as const;
/** Un objet à ranger, au plus : le panier divisé par 1,2 (le ballot reste nettement plus petit que le panier). */
const SORT_PRISE_UNDER = 1.2;

/** La taille d'un objet rangé dans son panier : plus petit, pour que quatre y tiennent. */
const SORT_IN_BASKET = 0.62;

/**
 * Les échelles du geste « ranger » pour la rangée posée en `points`, à l'échelle des objets `s` : `bin`, celle des
 * paniers, une fois et demie celle des objets, sans jamais prendre plus que `SORT_BIN_GAP` de l'écart entre deux places
 * voisines (leur étiquette reste sous eux) ; `prise`, celle des objets, qui suit les paniers quand ils rapetissent (le
 * panier reste plus grand que ce qu'il reçoit : `SORT_PRISE_UNDER`) ; `inBasket`, celle d'un objet rangé.
 */
export function sortScales(points: readonly Vec3[], s: number, low = true): { bin: number; prise: number; inBasket: number } {
  let gap = Infinity;
  for (let i = 1; i < points.length; i++) gap = Math.min(gap, Math.abs(points[i].x - points[i - 1].x));
  const bin = Math.min(SORT_BIN_SCALE * s, SORT_BIN_GAP[low ? 'low' : 'wide'] * gap);
  const prise = Math.min(s, bin / SORT_PRISE_UNDER);
  return { bin, prise, inBasket: SORT_IN_BASKET * prise };
}

/**
 * Où se pose le `k`-ième objet rangé dans le panier posé en `at` (de l'échelle `B`, `sortScales`), en deux rangs de
 * deux : enfoncé dans le panier, son dessus au-dessus du bord (il se voit dedans, le panier reste entier).
 */
export function inBasket(at: Vec3, B: number, k: number): Vec3 {
  return { x: at.x + ((k % 2) - 0.5) * 0.36 * B, y: at.y + 0.42 * B + 0.12 * B * Math.floor(k / 4), z: at.z + ((Math.floor(k / 2) % 2) - 0.5) * 0.3 * B };
}

/** Le rang de l'objet de la place `i` dans son panier : combien d'objets rangés dans le même panier le précèdent. */
export function rankInBasket(placed: readonly (number | null)[], i: number): number {
  const bin = placed[i];
  let k = 0;
  for (let j = 0; j < i; j++) if (placed[j] === bin) k++;
  return k;
}

/** Le panier d'osier du geste « ranger », à l'échelle 1 : rayon du fond, du bord, hauteur. */
const BASKET = { bottom: 0.3, rim: 0.45, height: 0.5 } as const;
/** La largeur du creux d'un panier d'osier à l'échelle 1, sous son bord (0,9 de large) : ce qui s'y pose y tient. */
const BASKET_HOLLOW = 0.8;

/**
 * Un panier d'osier des Filets (relecture de L4, directeur artistique) : un corps évasé et opaque, un bandeau de
 * paille tressée plus claire sous le bord, le creux de paille foncée, et une anse ; rien ne le couvre. L'anse se relève quand un
 * objet est tenu (le panier est prêt à le recevoir : la forme le dit) ; sinon, elle est rabattue en arrière sur le bord.
 */
function sortBin(b: FacetBuilder, p: Vec3, B: number, open: boolean): void {
  const r0 = BASKET.bottom * B,
    r1 = BASKET.rim * B,
    h = BASKET.height * B;
  b.prism({ x: p.x, y: p.y, z: p.z }, r0, r1, h, 8, C.strawDark, C.strawInside);
  // Le bandeau : un anneau à peine plus large que le corps, aux deux tiers de sa hauteur.
  const at = (y: number) => r0 + ((r1 - r0) * y) / h;
  b.prism({ x: p.x, y: p.y + 0.62 * h, z: p.z }, at(0.62 * h) + 0.025 * B, at(0.84 * h) + 0.025 * B, 0.22 * h, 8, C.straw);
  // L'anse, d'un bord à l'autre en trois brins : haute au-dessus du panier, ou couchée en arrière (vers -z).
  const lift = open ? 0.42 * B : 0.06 * B,
    back = open ? 0 : -0.32 * B,
    t = 0.05 * B;
  const ends = [-1, 1].map((k) => ({ x: p.x + k * (r1 - t), y: p.y + h, z: p.z }));
  const mid = [-1, 1].map((k) => ({ x: p.x + k * 0.22 * B, y: p.y + h + lift, z: p.z + back }));
  b.beam(ends[0], mid[0], t, C.straw);
  b.beam(mid[0], mid[1], t, C.straw);
  b.beam(mid[1], ends[1], t, C.straw);
}

/** Les paniers et les objets du geste « ranger », sur le ponton des réponses (hauteur `y`). */
function sortObjects(b: FacetBuilder, points: readonly Vec3[], y: number, s: number, look: SortLook): void {
  const open = look.held !== null;
  const { bin: B, prise, inBasket: k } = sortScales(points, s, look.low ?? true);
  for (const i of look.bins) if (points[i]) sortBin(b, { x: points[i].x, y, z: points[i].z }, B, open);
  for (const [i, p] of points.entries()) {
    if (look.bins.includes(i) || look.moving === i) continue;
    const bin = look.placed[i];
    if (bin !== null && bin !== undefined && points[bin]) sortPrise(b, inBasket({ x: points[bin].x, y, z: points[bin].z }, B, rankInBasket(look.placed, i)), k);
    else if (look.held === i) sortPrise(b, { x: p.x, y: y + HELD_LIFT, z: p.z }, prise, HELD_TILT);
    else sortPrise(b, { x: p.x, y, z: p.z }, prise);
  }
}

/**
 * Les objets des réponses, posés sur un ponton aux points donnés (au sol, dans l'ordre des choix ; la vue les tire de
 * l'écran), à l'échelle `answerScale`, pour que chacun tienne au-dessus de son bouton. Au Phare, les cloches pendent à
 * une poutre devant la rambarde de la galerie (`hanging`), les choisies balancées de côté.
 */
export function answerObjects(place: PlaceId, points: readonly Vec3[], s: number, look: AnswerLook = {}): Facets {
  const b = new FacetBuilder();
  const kind = ANSWER_OBJECT[place];
  if (points.length === 0 || !kind) return b.build();
  const picked = look.picked ?? [];
  const gone = look.gone ?? [];
  const xs = points.map((p) => p.x);
  const y = points[0].y;
  const z = points.reduce((t, p) => t + p.z, 0) / points.length;
  if (kind === 'cloche') {
    if (!look.hanging && look.ground !== undefined) groundBells(b, points, s, look.ground);
    else hangBells(b, points, s, picked, look.hanging);
    return b.build();
  }
  // Le rivage nord (lot L7) : ce qui est sous la rangée et les objets, dessinés dans le fichier du lieu.
  const art = kind === 'lieu' ? placeArt(place)?.answer : null;
  if (art) {
    const xs0 = points.map((p) => p.x);
    const z0 = points.reduce((t, p) => t + p.z, 0) / points.length;
    art.base(b, (Math.min(...xs0) + Math.max(...xs0)) / 2, points[0].y, z0, Math.max(...xs0) - Math.min(...xs0) + 1.4 * s, s, look.ground ?? points[0].y);
    // La malle marquée de la Gare maritime reste, sans son couvercle : la réaction le rabat sur elle (lot L9b).
    for (const [i, p] of points.entries()) if (!gone.includes(i) || art.replaces) art.object(b, p, s, i, points.length, picked.includes(i), gone.includes(i));
    return b.build();
  }
  if (kind === 'lieu') return b.build();
  // Le ponton sous la rangée : jamais un objet posé sur l'eau ; à terre, il descend jusqu'au sol. Sous les leviers des
  // Écluses, une margelle juste assez profonde pour eux : de pierre ocre, ses joints entre les leviers, la pierre du
  // quai en bordure (directeur artistique).
  const skirt = look.ground === undefined ? 0.12 * s : Math.max(0.12 * s, y - look.ground + 0.1);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  const span = Math.max(...xs) - Math.min(...xs) + 1.4 * s;
  if (kind === 'levier') {
    const depth = 0.9 * s,
      rim = 0.12 * s;
    b.box({ x: mid, y: y - skirt, z }, [span, skirt, depth], C.stoneDark, C.ochre);
    for (const side of [-1, 1]) b.box({ x: mid, y: y - 0.02, z: z + (side * (depth - rim)) / 2 }, [span + 0.02, 0.04, rim], C.stone);
    for (const side of [-1, 1]) b.box({ x: mid + (side * (span - rim)) / 2, y: y - 0.02, z }, [rim, 0.04, depth - 2 * rim], C.stone);
    for (let i = 1; i < points.length; i++)
      b.box({ x: (points[i - 1].x + points[i].x) / 2, y: y - 0.02, z }, [0.05 * s, 0.035, depth - 2 * rim], C.ochreJoint);
  } else if (kind === 'sac') saltRack(b, mid, y, z, span, s, look.ground ?? y);
  else rowDeck(b, mid, y, z, span, 0.8 * s, skirt, look.ground);
  if (look.sort) {
    sortObjects(b, points, y, s, look.sort);
    return b.build();
  }
  for (const [i, p] of points.entries()) {
    if (gone.includes(i)) continue;
    if (kind === 'panier') {
      // Le même panier d'osier que celui de l'Enclos, aux quatre missions des Filets (un seul objet-réponse, relecture de
      // L4, directeur artistique) : seule sa taille change.
      sortBin(b, { x: p.x, y, z: p.z }, s, false);
    } else if (kind === 'sac') {
      // Un sac choisi (une réponse tentée) penche en arrière sur la claie : sa forme le dit.
      saltSack(b, { x: p.x, y, z: p.z }, s, picked.includes(i) ? SACK_TIPPED : 0);
    } else if (kind === 'levier') {
      b.box({ x: p.x, y, z: p.z }, [0.6 * s, 0.35 * s, 0.5 * s], C.stoneDark, C.stone);
      // Un grand levier de vanne, penché vers le nord, et sa poignée ; un levier choisi (une réponse tentée) est tiré
      // vers l'élève : sa forme le dit.
      const k = picked.includes(i) ? -1 : 1;
      b.box({ x: p.x, y: y + 0.3 * s, z: p.z, pitch: -0.35 * k }, [0.12 * s, 1.5 * s, 0.12 * s], C.lever);
      b.box({ x: p.x, y: y + 0.3 * s + 1.41 * s, z: p.z - 0.51 * s * k }, [0.3 * s, 0.22 * s, 0.22 * s], C.knob);
    } else {
      // Une caisse choisie (une réponse tentée) bascule en arrière sur son arête : sa forme le dit.
      answerCrate(b, { x: p.x, y, z: p.z }, s, picked.includes(i) ? CRATE_TIPPED : 0);
    }
  }
  return b.build();
}

/** Les pieux sous le ponton des réponses (lot commun des scénettes, directeur artistique) : au plus 2,5 d'écart. */
const ROW_PILES = { gap: 2.5, side: 0.16, thick: 0.2 } as const;

/**
 * Le ponton sous la rangée des réponses, son dessus en `y` : une tranche d'au moins `ROW_PILES.thick` (aucune plaque
 * mince), et, quand il ne descend pas jusqu'au sol (`ground`, rien sur l'eau), sa rangée de pieux devant, jusqu'au sol
 * ou sous l'eau : rien ne flotte.
 */
function rowDeck(b: FacetBuilder, mid: number, y: number, z: number, span: number, depth: number, skirt: number, ground: number | undefined): void {
  const t = Math.max(skirt, ROW_PILES.thick);
  b.box({ x: mid, y: y - t, z }, [span, t, depth], C.deckSide, C.deck);
  const foot = ground ?? UNDER_WATER;
  if (y - t - foot < 0.05) return;
  const n = Math.max(2, Math.ceil(span / ROW_PILES.gap) + 1);
  for (let i = 0; i < n; i++) {
    const x = mid - span / 2 + ROW_PILES.side / 2 + ((span - ROW_PILES.side) * i) / (n - 1);
    b.box({ x, y: foot, z: z + depth / 2 - ROW_PILES.side / 2 }, [ROW_PILES.side, y - t - foot, ROW_PILES.side], C.post);
  }
}

/**
 * La claie des Marais salants, sous la rangée des sacs : un plateau de lattes sur quatre pieds, posé sur le sol
 * (`ground`), son dessus en `y`.
 */
function saltRack(b: FacetBuilder, mid: number, y: number, z: number, span: number, s: number, ground: number): void {
  const t = 0.07 * s,
    d = 0.75 * s;
  b.box({ x: mid, y: y - t, z }, [span, t, d], C.deckSide, C.newWood);
  // Les lattes en travers, plus sombres : le plateau se lit comme une claie, pas comme une planche.
  for (const side of [-1, 1]) b.box({ x: mid, y: y - 0.01, z: z + side * 0.24 * s }, [span, 0.02, 0.08 * s], C.deckSide);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box({ x: mid + sx * (span / 2 - 0.08 * s), y: ground - 0.1, z: z + sz * (d / 2 - 0.06 * s) }, [0.1 * s, y - t - ground + 0.1, 0.1 * s], C.post);
}

/**
 * Le sac de sel, à l'échelle 1 : son corps, plus large en bas, son épaule qui se resserre jusqu'au col, sa bouche
 * froncée qui s'évase au-dessus (le sel s'y voit), et sa bande d'ardoise.
 */
const SACK = { bottom: 0.36, top: 0.31, body: 0.82, neck: 0.15, shoulder: 0.14, mouth: 0.25, frill: 0.12, band: 0.26 } as const;

/**
 * Un sac de sel de réponse, debout sur la claie, à l'échelle `s` (relecture avant L5, consultant Archipéo : plus haut que
 * les ballots des Filets, à bouche froncée, d'un beige chaud, une bande d'ardoise) : tous les mêmes ; rien ne dit la
 * réponse, seule l'étiquette les distingue. `tilt` : penché en arrière (vers le nord) autour de son pied.
 */
function saltSack(b: FacetBuilder, at: Vec3, s: number, tilt = 0): void {
  // Un point de l'axe du sac, à la hauteur `h` au-dessus de son pied.
  const up = (h: number) => ({ x: at.x, y: at.y + h * Math.cos(tilt), z: at.z + h * Math.sin(tilt), pitch: tilt });
  b.prism(up(0), SACK.bottom * s, SACK.top * s, SACK.body * s, 8, C.sack, C.sackShade);
  b.prism(up(SACK.band * s), (SACK.bottom - 0.01) * s, (SACK.bottom - 0.02) * s, 0.1 * s, 8, C.slate);
  // L'épaule, qui se resserre jusqu'au col ; la bouche froncée, qui s'évase, et le sel dedans (son dessus).
  b.prism(up(SACK.body * s), SACK.top * s, SACK.neck * s, SACK.shoulder * s, 8, C.sackShade);
  b.prism(up((SACK.body + SACK.shoulder) * s), SACK.neck * s, SACK.mouth * s, SACK.frill * s, 8, C.sack, C.salt);
}

/** La bascule d'un sac choisi, en radians (en arrière). */
const SACK_TIPPED = -0.35;

/**
 * Le lien qui ferme le sac de la bonne réponse (le geste de la réaction, à l'échelle `s`, depuis le pied du sac) : la
 * toile resserrée sur la bouche, qu'elle couvre, le lien d'ardoise, et la toile qui dépasse au-dessus.
 */
function sackTie(s: number): Facets {
  const b = new FacetBuilder();
  const neck = (SACK.body + SACK.shoulder) * s;
  // La toile froncée remonte et se referme en pointe sur la bouche, qu'elle couvre ; le lien serré au col, d'ardoise ;
  // au-dessus, la toile qui dépasse en houppe.
  b.prism({ x: 0, y: neck - 0.02 * s, z: 0 }, (SACK.mouth + 0.03) * s, 0.07 * s, 0.24 * s, 8, C.sack, C.sackShade);
  b.prism({ x: 0, y: neck - 0.03 * s, z: 0 }, (SACK.neck + 0.05) * s, (SACK.neck + 0.05) * s, 0.08 * s, 8, C.slate);
  b.prism({ x: 0, y: neck + 0.2 * s, z: 0, yaw: 0.4 }, 0.06 * s, 0.14 * s, 0.1 * s, 6, C.sack, C.sackShade);
  return b.build();
}

/** La bascule d'une caisse choisie, en radians (en arrière, vers le quai). */
const CRATE_TIPPED = -0.6;

/**
 * Une caisse de réponse, à l'échelle `s`, posée en `at` : le corps, ses lattes, et la plaque à l'avant, sans rien
 * d'écrit (le nombre est dans le panneau de la page). `tilt` : basculée en arrière autour de son arête du fond.
 */
function answerCrate(b: FacetBuilder, at: Vec3, s: number, tilt = 0): void {
  const f = new FacetBuilder();
  const w = 0.8, h = 0.7, d = 0.7;
  f.box({ x: 0, y: 0, z: 0 }, [w, h, d], C.crate, C.crateTop);
  // Deux lattes en travers, plus sombres, et la plaque claire.
  for (const y of [0.12, 0.5]) f.box({ x: 0, y, z: d / 2 + 0.01 }, [w + 0.02, 0.08, 0.03], C.pallet);
  f.box({ x: 0, y: 0.22, z: d / 2 + 0.03 }, [0.5, 0.24, 0.03], C.plate);
  const built = f.build();
  const pos = built.positions;
  const nor = built.normals;
  const c = Math.cos(tilt), sn = Math.sin(tilt);
  for (let i = 0; i < pos.length; i += 3) {
    // Autour de l'arête du bas, au fond (z = −d/2) : la caisse se couche en arrière, son devant vers le ciel.
    const y0 = pos[i + 1], z0 = pos[i + 2] + d / 2;
    pos[i] = pos[i] * s + at.x;
    pos[i + 1] = (y0 * c - z0 * sn) * s + at.y;
    pos[i + 2] = (y0 * sn + z0 * c - d / 2) * s + at.z;
    const ny = nor[i + 1], nz = nor[i + 2];
    nor[i + 1] = ny * c - nz * sn;
    nor[i + 2] = ny * sn + nz * c;
  }
  b.append(built);
}

/**
 * Les cloches pendues à leur poutre, chacune à sa corde, la poutre tenue à la rambarde par deux potences ; la corde de
 * sonnerie va de la main de l'habitant au bout de la poutre. Sans `hanging`, la poutre seule les tient.
 */
function hangBells(b: FacetBuilder, points: readonly Vec3[], s: number, picked: readonly number[], hanging?: BellHanging): void {
  const xs = points.map((p) => p.x);
  const z = points.reduce((t, p) => t + p.z, 0) / points.length;
  const beamY = Math.max(...points.map((p) => p.y)) + 1.12 * s;
  const left = Math.min(...xs) - 0.6 * s;
  const right = Math.max(...xs) + 0.6 * s;
  b.box({ x: (left + right) / 2, y: beamY, z }, [right - left, 0.14 * s, 0.16 * s], C.post);
  points.forEach((p, i) => {
    b.box({ x: p.x, y: p.y + s, z: p.z }, [0.05 * s, beamY - p.y - s, 0.05 * s], C.rope);
    bell(b, p, s, BRONZE, 1, picked.includes(i) ? 0.3 : 0);
  });
  if (!hanging) return;
  // Deux potences : de la poutre à la rambarde, puis au haut de la rambarde.
  const mid = hanging.rail.x;
  for (const x of [Math.max(left, mid - 1.1), Math.min(right, mid + 1.1)]) {
    b.beam({ x, y: beamY, z }, { x, y: beamY, z: hanging.rail.z }, 0.1, C.post);
    b.beam({ x, y: beamY, z: hanging.rail.z }, { x, y: hanging.rail.y, z: hanging.rail.z }, 0.1, C.post);
  }
  // La corde de sonnerie, de la main de l'habitant au bout de la poutre.
  b.beam(hanging.hand, { x: right, y: beamY, z }, 0.09, C.ringRope);
}

/**
 * Les cloches tombées au pied du Phare (sa galerie pas encore posée) : debout sur une avancée du socle de rochers, sa
 * pierre jusqu'au sol (`ground`), quelques pierres tombées à ses bouts. On les frappe là ; une cloche choisie ne bascule
 * pas (elle ne pend pas) : la réponse tentée se lit sur son bouton.
 */
function groundBells(b: FacetBuilder, points: readonly Vec3[], s: number, ground: number): void {
  const xs = points.map((p) => p.x);
  const y = points[0].y;
  const z = points.reduce((t, p) => t + p.z, 0) / points.length;
  const left = Math.min(...xs) - 0.7 * s;
  const right = Math.max(...xs) + 0.7 * s;
  const skirt = Math.max(0.12 * s, y - ground + 0.1);
  b.box({ x: (left + right) / 2, y: y - skirt, z }, [right - left, skirt, 1.1 * s], C.stoneDark, C.stone);
  b.box({ x: left - 0.1 * s, y, z: z - 0.15 * s, yaw: 0.5 }, [0.45 * s, 0.3 * s, 0.4 * s], C.stoneDark, C.stone);
  b.box({ x: right + 0.05 * s, y, z: z + 0.2 * s, yaw: -0.4 }, [0.4 * s, 0.26 * s, 0.35 * s], C.stoneDark, C.stone);
  for (const p of points) bell(b, p, s, BRONZE);
}

/**
 * Les objets des réponses face à une caméra tournée de `yaw` autour de l'axe vertical qui passe par `pivot` (l'axe de la
 * galerie du Phare) : dessinés comme de face, puis tournés avec elle. La poutre des cloches reste ainsi horizontale à
 * l'écran, sous la rambarde et sous les pieds de Kéo et de la gardienne, sur tout l'arc de la caméra ; ses potences
 * restent sur la rambarde, ronde autour de l'axe. `points` : les pieds des objets dans le monde, dans le plan tourné ;
 * `look.hanging.rail` : le point de la rambarde de face, que le tour emporte ; la main de l'habitant ne bouge pas.
 */
export function facingAnswerObjects(anyPlace: AnyPlaceId, points: readonly Vec3[], s: number, look: AnswerLook, pivot: Vec3, yaw: number): Facets {
  const place = scenePlace(anyPlace);
  if (!yaw) return answerObjects(place, points, s, look);
  const c = Math.cos(yaw), sn = Math.sin(yaw);
  // L'inverse du tour de `placeFacets` : du monde au repère de face, centré sur le pivot.
  const local = (p: Vec3): Vec3 => {
    const dx = p.x - pivot.x, dz = p.z - pivot.z;
    return { x: dx * c - dz * sn, y: p.y, z: dx * sn + dz * c };
  };
  const h = look.hanging;
  const hanging = h && { hand: local(h.hand), rail: { x: h.rail.x - pivot.x, y: h.rail.y, z: h.rail.z - pivot.z } };
  return placeFacets(answerObjects(place, points.map(local), s, { ...look, hanging }), { x: pivot.x, y: 0, z: pivot.z, yaw });
}

// ---------- La scène d'un item ----------

/** Un panneau de la page accroché à un point de la scène (les repères 0, 1, 2 de l'échelle). */
interface SceneLabel {
  text: string;
  at: Vec3;
  /** Centré sous son point (les fractions sous les deux sas), sinon posé à sa droite (les repères de l'échelle). */
  center?: boolean;
}

/**
 * Le geste de la réaction, une à deux secondes (`REACTION_SECONDS`) : un objet qui va de `from` à `to` en passant
 * `arc` unités plus haut, puis reste (`stay`) ou s'efface. Avec « Réduire les animations », il est tout de suite à `to`.
 */
export interface Reaction {
  facets: Facets;
  from: Vec3;
  to: Vec3;
  arc: number;
  stay: boolean;
  /**
   * Le cap du maillage (autour de la verticale) et son roulis à la fin (autour de son z local, de 0 au départ à `roll` à
   * l'arrivée) : la planche de bordé du Chantier naval, couchée sur ses tréteaux, se lève contre le flanc de la coque
   * (lot L6b). Sans : ni cap ni roulis.
   */
  turn?: { yaw: number; roll: number };
  /**
   * Des battants qui tournent sur leurs gonds (les volets de l'Observatoire, clôture de L8), au lieu du geste de `from` à
   * `to` : chacun, une plage de sommets de `facets` (posés dans le monde, fermés), tourne autour d'un axe vertical en
   * `pivot`, de 0 à `angle`, en `seconds`. Avec « Réduire les animations », ils sont ouverts d'un coup.
   */
  swing?: Swing;
}

/** Les battants d'une réaction : leur durée, et pour chacun son gond, son angle d'ouverture et ses sommets. */
export interface Swing {
  seconds: number;
  leaves: readonly { pivot: { x: number; z: number }; angle: number; first: number; count: number }[];
}

/**
 * Les battants d'une réaction à la fraction `e` de leur course (0 fermés, 1 ouverts), écrits dans `positions` et
 * `normals` (de la taille de ceux de `facets`, jamais les mêmes tableaux) ; sans allocation, appelé à chaque image.
 */
export function swingTo(facets: Facets, swing: Swing, e: number, positions: Float32Array, normals: Float32Array): void {
  positions.set(facets.positions);
  normals.set(facets.normals);
  for (const leaf of swing.leaves) {
    const a = leaf.angle * e;
    const c = Math.cos(a),
      sn = Math.sin(a);
    for (let v = leaf.first; v < leaf.first + leaf.count; v++) {
      const i = 3 * v;
      const x = facets.positions[i] - leaf.pivot.x,
        z = facets.positions[i + 2] - leaf.pivot.z;
      positions[i] = leaf.pivot.x + x * c + z * sn;
      positions[i + 2] = leaf.pivot.z - x * sn + z * c;
      const nx = facets.normals[i],
        nz = facets.normals[i + 2];
      normals[i] = nx * c + nz * sn;
      normals[i + 2] = -nx * sn + nz * c;
    }
  }
}

/** La course des volets de l'Observatoire, en secondes (directeur artistique, relecture de L8c-d, Q1). */
const SHUTTER_SECONDS = 0.5;

/** La scène d'un item : ce qui reste en place, les panneaux, et la réaction (`null` : rien ne bouge). */
export interface ItemSceneFacets {
  still: Facets;
  labels: SceneLabel[];
  reaction: Reaction | null;
}

/** Le grand filet étendu sur sa plate-forme, ses mailles en traits. */
function restingNet(b: FacetBuilder, o: Vec3): void {
  b.box({ x: o.x, y: o.y, z: o.z }, [4.6, 0.03, 2.6], C.net);
  for (let k = -2; k <= 2; k++) b.box({ x: o.x + k * 0.9, y: o.y + 0.03, z: o.z }, [0.05, 0.01, 2.6], C.netLine);
  for (let k = -1; k <= 1; k++) b.box({ x: o.x, y: o.y + 0.03, z: o.z + k * 0.85 }, [4.6, 0.01, 0.05], C.netLine);
}

/** Un petit poisson (une sardine), couché, sa tête vers l'est. */
function fish(b: FacetBuilder, x: number, y: number, z: number, yaw = 0): void {
  // Un poisson qui se lit : un corps fuselé bleu argent (deux pavés), la queue en V, un œil et une nageoire.
  const c = Math.cos(yaw),
    sn = Math.sin(yaw);
  const along = (d: number) => ({ x: x + d * c, z: z - d * sn });
  b.box({ ...along(0), y, yaw }, [0.62, 0.22, 0.24], C.fish, C.fishTop);
  b.box({ ...along(0.36), y: y + 0.03, yaw }, [0.14, 0.16, 0.18], C.fish, C.fishTop);
  for (const side of [-1, 1]) b.box({ ...along(-0.4), y: y + 0.02 + side * 0.06, yaw: yaw + side * 0.6 }, [0.24, 0.07, 0.08], C.fishTail);
  b.box({ ...along(0.02), y: y + 0.22, yaw }, [0.22, 0.06, 0.04], C.fishTail);
  b.box({ ...along(0.3), y: y + 0.08, yaw }, [0.06, 0.06, 0.26], C.fishEye);
}

/** Les objets de la pêche, au point (x, y, z), en rangée : la phrase dit ce qu'on voit, et combien. */
function catchObjects(b: FacetBuilder, scene: Extract<ItemScene, { kind: 'filets' }>, x: number, y: number, z0: number, pile = false): void {
  const n = Math.max(1, scene.count);
  const pitch = scene.catch === 'pêche' ? 0 : 0.85;
  for (let i = 0; i < (scene.catch === 'pêche' ? 1 : n); i++) {
    // En rangée sur le filet ; en tas de deux de front dans le panier, pour rester lisible.
    const cx = pile ? x + (n > 1 ? ((i % 2) - 0.5) * 0.7 : 0) : x + (i - (n - 1) / 2) * pitch;
    const rows = Math.ceil(n / 2);
    const z = pile ? z0 + (Math.floor(i / 2) - (rows - 1) / 2) * 0.42 : z0;
    switch (scene.catch) {
      case 'sardines':
        fish(b, cx, y, z, 0.2 * (i % 2 ? 1 : -1));
        break;
      case 'filets':
        b.box({ x: cx, y, z }, [0.8, 0.3, 0.6], C.net, C.netLine);
        break;
      case 'mouette':
        // Une mouette posée : le corps blanc, la tête, le bec orangé, les ailes grises repliées en V, les pattes.
        b.box({ x: cx, y: y + 0.22, z }, [0.62, 0.3, 0.32], C.white);
        b.box({ x: cx + 0.34, y: y + 0.42, z }, [0.22, 0.22, 0.22], C.white);
        b.box({ x: cx + 0.52, y: y + 0.42, z }, [0.16, 0.07, 0.08], C.beak);
        for (const side of [-1, 1]) b.box({ x: cx - 0.05, y: y + 0.4, z: z + side * 0.16, yaw: side * 0.25 }, [0.5, 0.08, 0.14], C.grey);
        b.box({ x: cx - 0.36, y: y + 0.3, z }, [0.16, 0.1, 0.2], C.grey);
        for (const dz of [-0.08, 0.08]) b.box({ x: cx, y, z: z + dz }, [0.05, 0.22, 0.05], C.beak);
        break;
      case 'bocaux':
        // Un bocal gris, sans étiquette, et son couvercle.
        b.prism({ x: cx, y, z }, 0.24, 0.24, 0.5, 8, C.grey, C.silverTop);
        b.prism({ x: cx, y: y + 0.5, z }, 0.18, 0.18, 0.08, 8, C.stoneDark);
        break;
      case 'crabes':
      case 'crabe':
        // Un crabe : la carapace, deux pinces levées devant, trois pattes de chaque côté.
        b.box({ x: cx, y: y + 0.12, z }, [0.5, 0.18, 0.38], C.crab, C.crabTop);
        for (const side of [-1, 1]) {
          b.box({ x: cx + side * 0.22, y: y + 0.24, z: z + 0.3 }, [0.16, 0.14, 0.18], C.crab, C.crabTop);
          for (const dz of [-0.12, 0, 0.12]) b.box({ x: cx + side * 0.32, y: y + 0.04, z: z + dz }, [0.18, 0.06, 0.05], C.crab);
        }
        break;
      case 'seaux':
        b.prism({ x: cx, y, z }, 0.28, 0.34, 0.55, 8, C.bucket, C.shrimp);
        break;
      case 'pêche':
        for (let k = 0; k < 7; k++) fish(b, x + ((k % 4) - 1.5) * 0.55, y + 0.14 * Math.floor(k / 4), z + (k % 2) * 0.3 - 0.15, 0.3 * ((k % 3) - 1));
        break;
    }
  }
}

/** Les caisses d'un quai : en palettes de dix (deux rangées de cinq) et en caisses seules (rangées de cinq), une couche. */
export function crateLayout(count: number): {
  palettes: number;
  singles: number;
} {
  const c = Math.max(0, Math.min(99, Math.floor(count)));
  return { palettes: Math.floor(c / 10), singles: c % 10 };
}

const CRATE = 0.4;
const CRATE_PITCH = 0.48;

/**
 * La place que prennent les caisses de `count` : largeur (x) et profondeur (z), allées comprises ; `rows`, la profondeur
 * des seules caisses, du bord de la première rangée à celui de la dernière (sans l'allée après la dernière palette).
 */
function crateBlock(count: number): { w: number; d: number; rows: number } {
  const { palettes, singles } = crateLayout(count);
  const pw = 5 * CRATE_PITCH + 0.3,
    pd = 2 * CRATE_PITCH + 0.3;
  const cols = Math.min(3, palettes);
  const w = cols * pw + (singles ? (palettes ? 0.2 : 0) + Math.min(5, singles) * CRATE_PITCH : 0);
  const d = Math.max(Math.ceil(palettes / 3) * pd, Math.ceil(singles / 5) * CRATE_PITCH);
  const rows = Math.max(Math.ceil(palettes / 3) * pd - (palettes ? 0.3 : 0), Math.ceil(singles / 5) * CRATE_PITCH);
  return { w: Math.max(w, CRATE_PITCH), d: Math.max(d, CRATE_PITCH), rows: Math.max(rows, CRATE_PITCH) };
}

/** Les caisses de `count`, rangées depuis (x0, z0) : les palettes en grille de trois de front, les caisses seules à droite. */
function crates(b: FacetBuilder, count: number, x0: number, y: number, z0: number): void {
  const { palettes, singles } = crateLayout(count);
  const paletteW = 5 * CRATE_PITCH,
    paletteD = 2 * CRATE_PITCH;
  for (let p = 0; p < palettes; p++) {
    const px = x0 + (p % 3) * (paletteW + 0.3);
    const pz = z0 + Math.floor(p / 3) * (paletteD + 0.3);
    b.box({ x: px + paletteW / 2 - CRATE_PITCH / 2, y, z: pz + CRATE_PITCH / 2 }, [paletteW, 0.06, paletteD], C.pallet);
    for (let k = 0; k < 10; k++)
      b.box(
        {
          x: px + (k % 5) * CRATE_PITCH,
          y: y + 0.06,
          z: pz + Math.floor(k / 5) * CRATE_PITCH,
        },
        [CRATE, CRATE, CRATE],
        C.crate,
        C.crateTop,
      );
  }
  // Les caisses seules juste à droite des palettes posées.
  const sx = x0 + Math.min(3, palettes) * (paletteW + 0.3) + (palettes ? 0.2 : 0);
  for (let k = 0; k < singles; k++)
    b.box(
      {
        x: sx + (k % 5) * CRATE_PITCH,
        y,
        z: z0 + Math.floor(k / 5) * CRATE_PITCH,
      },
      [CRATE, CRATE, CRATE],
      C.crate,
      C.crateTop,
    );
}

/** Une barque, sa coque vers l'est. */
function boat(b: FacetBuilder, x: number, y: number, z: number, length = 2.4): void {
  b.box({ x, y: y - 0.1, z }, [length, 0.45, 0.9], C.hull, C.hullTop);
  b.box({ x: x + length / 2 + 0.15, y: y - 0.1, z }, [0.3, 0.35, 0.5], C.hull);
}

/**
 * Le canal des Écluses (piste 1, lot 4), dans le repère de la scène : devant le sas, de `front` à `back` unités au sud
 * de son milieu, son eau `water` sous le plancher, sur `half` unités de chaque côté ; la porte qui le ferme, entre le sas
 * et l'éclusier, qui ne la cache pas (`gate`, depuis le milieu du sas, ses deux vantaux de `leaf`, en pointe de `mitre`
 * vers l'amont quand ils sont fermés, leur haut `gateTop` au-dessus du quai, à l'épaule de l'éclusier, et leurs
 * balanciers de `beam`), le milieu de la barque arrêtée devant
 * elle (`stop`, devant le sas), puis passée, dans le champ (`beyond`) ; au sud du canal, la berge (`forecourt`, sa
 * profondeur, assez pour que son flanc sorte du cadre ; plus large que le canal de `bank` de chaque côté), bordée de
 * pierre (`kerb`), puis le chemin de halage (`towpath`) et l'herbe, sous la rangée des leviers (retour du directeur
 * artistique : la pierre en bordure seulement). Le canal court sur `reach` unités de chaque côté du sas, jusqu'à ses
 * abords (./eclusesSurroundings.ts : il sort d'une voûte à l'ouest, descend vers la mer à l'est).
 */
export const LOCK = {
  front: 0.8,
  back: 2.2,
  water: 0.3,
  half: 8,
  gate: 2.1,
  leaf: 0.7,
  mitre: 0.3,
  gateTop: 1,
  beam: 1,
  stop: 0.2,
  beyond: 3.4,
  forecourt: 11,
  bank: 1,
  kerb: 0.45,
  towpath: 1.1,
  reach: 12,
} as const;

/**
 * La paroi d'un sas des Écluses (sa face, au sud, porte l'item) et son dos fini, vu quand la caméra tourne : le dos et
 * les bouts habillés du bois sombre des portes d'écluse du concept (directeur artistique, troisième passe du 18 octobre
 * 2026 : de côté et de dos, un pilier de pierre au milieu du cadre), en planches debout de deux tons et deux traverses,
 * et une margelle de bois sur le haut. La face reste de pierre autour de l'item.
 */
function lockWall(b: FacetBuilder, x: number, y: number, z: number, w: number, h: number): void {
  b.box({ x, y, z }, [w, h, 0.6], C.stoneDark, C.stone);
  // Les planches du dos, à plat sur lui ; ses deux bouts.
  const back = z - 0.3 - 0.01;
  const n = Math.max(3, Math.round(w / 0.55));
  for (let i = 0; i < n; i++) {
    const x0 = x - w / 2 + (w * i) / n,
      x1 = x - w / 2 + (w * (i + 1)) / n;
    b.quad([x1, y, back], [x0, y, back], [x0, y + h, back], [x1, y + h, back], i % 2 ? C.gateWood : C.gateWoodAlt);
  }
  for (const side of [-1, 1]) {
    const ex = x + side * (w / 2 + 0.01);
    const [z0, z1] = side > 0 ? [z + 0.3, z - 0.3] : [z - 0.3, z + 0.3];
    b.quad([ex, y, z0], [ex, y, z1], [ex, y + h, z1], [ex, y + h, z0], C.gateWood);
  }
  for (const k of [0.22, 0.68]) b.box({ x, y: y + k * h, z: back - 0.04 }, [w - 0.1, 0.18, 0.08], C.gateWood, C.gateWoodTop);
  b.box({ x, y: y + h, z: z - 0.04 }, [w + 0.12, 0.12, 0.74], C.gateWood, C.gateWoodTop);
}

/** La barque des Écluses, sa coque vers l'est, au repère de la réaction (la vue la déplace). */
export function lockBoat(): Facets {
  const b = new FacetBuilder();
  boat(b, 0, 0, 0);
  return b.build();
}

/** Les deux sas de Deux rives : la largeur et la hauteur de chacun (la même), et l'écart entre leurs milieux. */
const PAIR = { w: 1.35, h: 3.2, step: 2.05 } as const;

/** Le milieu de chacun des deux sas de Deux rives (`a` à l'ouest, `b` à l'est, l'ordre du tirage), et sa part. */
const pairSas = (x: number, scene: Extract<ItemScene, { kind: 'lockPair' }>): [number, [number, number]][] => [
  [x - PAIR.step / 2, scene.a],
  [x + PAIR.step / 2, scene.b],
];

/**
 * Le sas rempli, à la réussite de la mission aux Écluses : l'eau dans toutes les bandes de la paroi, chacune la sienne,
 * séparées par des traits clairs (le sas se lit « 6 parts sur 6 », pas en aplat ; niveau 1), ou jusqu'en haut du bassin
 * de l'échelle (niveau 2), et le trait clair du niveau en haut. Un voile posé juste devant la scène de l'item, qui reste.
 */
export function lockFull(scene: ItemScene): Facets {
  const b = new FacetBuilder();
  const o = sceneSpot('ecluses');
  const zf = o.z + 0.35;
  if (scene.kind === 'sas') {
    const h = 3.2,
      w = 3,
      d = Math.max(1, scene.d),
      band = h / d;
    for (let k = 0; k < d; k++) b.box({ x: o.x, y: o.y + 0.15 + k * band + 0.05, z: zf + 0.06 }, [w, band - 0.1, 0.04], C.water);
    for (let k = 1; k < d; k++) b.box({ x: o.x, y: o.y + 0.15 + k * band - 0.05, z: zf + 0.06 }, [w, 0.1, 0.04], C.lockLine);
    b.box({ x: o.x, y: o.y + 0.15 + h - 0.06, z: zf + 0.1 }, [w + 0.8, 0.12, 0.06], C.level);
  } else if (scene.kind === 'lockPair') {
    for (const [cx, [, d]] of pairSas(o.x, scene)) {
      const k = Math.max(1, d),
        band = PAIR.h / k;
      for (let i = 0; i < k; i++) b.box({ x: cx, y: o.y + 0.15 + i * band + 0.05, z: zf + 0.06 }, [PAIR.w, band - 0.1, 0.04], C.water);
      for (let i = 1; i < k; i++) b.box({ x: cx, y: o.y + 0.15 + i * band - 0.05, z: zf + 0.06 }, [PAIR.w, 0.1, 0.04], C.lockLine);
      b.box({ x: cx, y: o.y + 0.15 + PAIR.h - 0.06, z: zf + 0.1 }, [PAIR.w + 0.2, 0.12, 0.06], C.level);
    }
  } else if (scene.kind === 'echelle') {
    const top = 2 * 1.7;
    b.box({ x: o.x - 0.6, y: o.y + 0.1, z: zf + 0.12 }, [2, top, 0.04], C.water);
    b.box({ x: o.x - 0.2, y: o.y + 0.1 + top - 0.06, z: zf + 0.15 }, [2.9, 0.12, 0.05], C.level);
  }
  return b.build();
}

/**
 * Le panier plein des Filets : un grand panier de paille, la pêche en tas qui dépasse (des sardines), posé en `at`, à
 * l'échelle `s` (1 : à la taille de la pêcheuse).
 */
export function fullBasket(b: FacetBuilder, at: Vec3, s = 1): void {
  // Le panier d'osier des réponses (un seul panier aux Filets), l'anse rabattue.
  sortBin(b, at, s, false);
  const h = BASKET.height * s;
  // Le tas : deux couches de sardines, la seconde plus étroite, qui dépasse du bord.
  const f = new FacetBuilder();
  for (let k = 0; k < 4; k++) fish(f, ((k % 2) - 0.5) * 0.36, 0, (Math.floor(k / 2) - 0.5) * 0.28, 0.25 * (k % 2 ? 1 : -1));
  for (let k = 0; k < 2; k++) fish(f, (k - 0.5) * 0.3, 0.2, 0, 0.3 * (k ? -1 : 1));
  b.append(placed(f.build(), 0.75 * s, { x: at.x, y: at.y + h - 0.12 * s, z: at.z }));
}

/** Le crochet de levage, au bout de la corde : une tige et un anneau ouvert (huit pavés). */
export function liftingHook(b: FacetBuilder, top: Vec3, color: number, r = 0.16): void {
  b.box({ x: top.x, y: top.y - 0.3, z: top.z }, [0.07, 0.3, 0.07], color);
  const cy = top.y - 0.3 - r;
  for (let k = 0; k < 7; k++) {
    const a0 = Math.PI / 2 + (k * 2 * Math.PI) / 8, a1 = a0 + (2 * Math.PI) / 8;
    b.beam({ x: top.x + r * Math.cos(a0), y: cy + r * Math.sin(a0), z: top.z }, { x: top.x + r * Math.cos(a1), y: cy + r * Math.sin(a1), z: top.z }, 0.06, color);
  }
}

const ORIGIN: Vec3 = { x: 0, y: 0, z: 0 };

/**
 * La scène d'un item dans son lieu : `answered` donne l'état juste (après la réponse, juste ou corrigée), jamais l'état
 * faux ; `right` : les points des objets des bonnes réponses (la pêche va au panier, les bonnes cloches s'allument),
 * `scale` : l'échelle de ces objets (`answerScale`).
 */
export function itemScene(anyPlace: AnyPlaceId, scene: ItemScene, answered: boolean, right: readonly Vec3[] = [], scale = 1, posed = true): ItemSceneFacets {
  const place = scenePlace(anyPlace);
  const b = new FacetBuilder();
  const o = sceneSpot(place);
  const labels: SceneLabel[] = [];
  let reaction: Reaction | null = null;
  const answerAt = right[0];
  if (scene.kind === 'cloches') {
    // Les bonnes cloches s'allument le temps de la réaction, puis redeviennent de bronze : rien ne reste.
    if (answered && right.length) {
      const r = new FacetBuilder();
      for (const p of right) bell(r, p, scale, LIT, 1.12);
      reaction = {
        facets: r.build(),
        from: ORIGIN,
        to: ORIGIN,
        arc: 0,
        stay: false,
      };
    }
    return { still: b.build(), labels, reaction };
  }
  // Une plate-forme sous la scène : elle ne flotte jamais ; de bois aux Filets, de pierre aux Écluses (le sas).
  const depth = sceneDepth(place);
  const platform = (w: number, d: number, stone = false) =>
    b.box({ x: o.x, y: o.y - depth, z: o.z }, [w, depth, d], stone ? C.pavingSide : C.deckSide, stone ? C.paving : C.deck);
  // La barque des Écluses passe dans le canal, devant le sas, et s'arrête devant la porte fermée.
  const lockReaction = (): Reaction => {
    const r = new FacetBuilder();
    boat(r, 0, 0, 0);
    const y = o.y - LOCK.water;
    const z = o.z + (LOCK.front + LOCK.back) / 2;
    return { facets: r.build(), from: { x: o.x - LOCK.half + 1.5, y, z }, to: { x: o.x + LOCK.stop, y, z }, arc: 0, stay: true };
  };
  if (scene.kind === 'enclos') {
    // L'Enclos (lot L4) : le filet étendu, au repos, sans pêche ; les objets à ranger et les paniers sont sur le ponton.
    platform(5.4, 3.2);
    restingNet(b, o);
  } else if (scene.kind === 'filets') {
    platform(5.4, 3.2);
    restingNet(b, o);
    const r = new FacetBuilder();
    catchObjects(r, scene, 0, 0, 0);
    const pecheFacets = placed(r.build(), CATCH_SCALE);
    const from = { x: o.x, y: o.y + 0.05, z: o.z };
    if (!answered) b.append(placed(pecheFacets, 1, from));
    else if (answerAt) {
      // La prise va au panier de la bonne réponse, en tas, assez grande pour se lire.
      const p = new FacetBuilder();
      catchObjects(p, scene, 0, 0, 0, true);
      const pile = p.build();
      reaction = {
        facets: basketFit(pile, scale),
        from,
        // Sur le creux du panier d'osier (son bord à 0,5), enfoncée d'un rien : elle se voit dedans.
        to: { x: answerAt.x, y: answerAt.y + 0.4 * scale, z: answerAt.z },
        arc: 1.2,
        stay: true,
      };
    }
  } else if (scene.kind === 'sas') {
    platform(4.6, 1.6, true);
    const d = Math.max(1, scene.d),
      n = Math.max(0, Math.min(d, scene.n));
    const w = 3,
      h = 3.2,
      band = h / d,
      zf = o.z + 0.35;
    // La paroi du sas, de face : les bandes égales (des traits, sans chiffres), l'eau dans les `n` du bas.
    lockWall(b, o.x, o.y, o.z, w + 0.5, h + 0.3);
    for (let k = 0; k < d; k++) b.box({ x: o.x, y: o.y + 0.15 + k * band + 0.03, z: zf }, [w, band - 0.06, 0.05], k < n ? C.water : C.empty);
    // Le trait du niveau de l'eau, large et clair : le niveau se lit sans la couleur.
    b.box({ x: o.x, y: o.y + 0.15 + n * band - 0.06, z: zf + 0.04 }, [w + 0.8, 0.12, 0.06], C.level);
    if (answered) reaction = lockReaction();
  } else if (scene.kind === 'lockPair') {
    // Deux rives (lot L2) : deux sas côte à côte, de même hauteur, de même largeur, à la même distance de la caméra (la
    // même unité) ; dans chacun, ses parts égales en traits, l'eau pile sur un trait, la surface de son eau en trait
    // clair, et rien de commun aux deux (aucun trait d'un sas à l'autre). Sous chacun, sa fraction, un panneau de la
    // page. Rien ne change à la réponse, sauf la barque qui avance jusqu'à la porte.
    platform(4.6, 1.6, true);
    const zf = o.z + 0.35;
    for (const [cx, [n0, d0]] of pairSas(o.x, scene)) {
      const d = Math.max(1, d0),
        n = Math.max(0, Math.min(d, n0)),
        band = PAIR.h / d;
      lockWall(b, cx, o.y, o.z, PAIR.w + 0.3, PAIR.h + 0.3);
      for (let k = 0; k < d; k++) b.box({ x: cx, y: o.y + 0.15 + k * band + 0.03, z: zf }, [PAIR.w, band - 0.06, 0.05], k < n ? C.water : C.empty);
      b.box({ x: cx, y: o.y + 0.15 + n * band - 0.05, z: zf + 0.04 }, [PAIR.w + 0.1, 0.1, 0.06], C.level);
      labels.push({ text: `${n0}/${d0}`, at: { x: cx, y: o.y - 0.25, z: zf }, center: true });
    }
    if (answered) reaction = lockReaction();
  } else if (scene.kind === 'lockIdle') {
    // Le sas au repos (lot L2) : sa paroi de pierre, sa vanne de bois fermée, sa tige et son volant ; rien de l'item.
    platform(4.6, 1.6, true);
    const zf = o.z + 0.35;
    lockWall(b, o.x, o.y, o.z, 3.5, 3.5);
    b.box({ x: o.x, y: o.y + 0.15, z: zf }, [1.5, 1.7, 0.08], C.lever, C.deck);
    for (const dx of [-0.5, 0, 0.5]) b.box({ x: o.x + dx, y: o.y + 0.15, z: zf + 0.05 }, [0.06, 1.7, 0.03], C.deckSide);
    // La tige de la vanne, et son volant de manœuvre : une roue de fer à huit pans, face à la caméra, sur son moyeu.
    const wheel = { x: o.x, y: o.y + 2.55, z: zf + 0.12 };
    b.box({ x: o.x, y: o.y + 1.85, z: zf + 0.05 }, [0.1, wheel.y - o.y - 1.85, 0.1], C.iron);
    const r = 0.42;
    for (let k = 0; k < 8; k++) {
      const a0 = (k * Math.PI) / 4,
        a1 = ((k + 1) * Math.PI) / 4;
      b.beam({ x: wheel.x + r * Math.cos(a0), y: wheel.y + r * Math.sin(a0), z: wheel.z }, { x: wheel.x + r * Math.cos(a1), y: wheel.y + r * Math.sin(a1), z: wheel.z }, 0.07, C.iron);
    }
    b.box({ x: wheel.x, y: wheel.y - 0.09, z: wheel.z }, [0.18, 0.18, 0.12], C.iron);
    if (answered) reaction = lockReaction();
  } else if (scene.kind === 'echelle') {
    platform(4.6, 1.6, true);
    const d = Math.max(1, scene.d),
      n = Math.max(0, Math.min(2 * d, scene.n));
    const unit = 1.7,
      zf = o.z + 0.35,
      px = o.x + 0.9;
    // Le bassin et son eau, jusqu'au cran `n`.
    lockWall(b, o.x - 0.6, o.y, o.z, 2.2, 2 * unit + 0.4);
    b.box({ x: o.x - 0.6, y: o.y + 0.1, z: zf }, [2, (n / d) * unit, 0.05], C.water);
    // Le poteau gradué, de 0 à 2 : un cran par part, un grand cran aux unités (leurs nombres sont des panneaux).
    b.box({ x: px, y: o.y, z: zf }, [0.22, 2 * unit + 0.3, 0.12], C.white);
    for (let k = 0; k <= 2 * d; k++) {
      const big = k % d === 0;
      b.box(
        {
          x: px - (big ? 0.35 : 0.22),
          y: o.y + 0.1 + (k / d) * unit - 0.03,
          z: zf + 0.07,
        },
        [big ? 0.7 : 0.44, 0.06, 0.04],
        C.stoneDark,
      );
      if (big)
        labels.push({
          text: String(k / d),
          at: { x: px + 0.55, y: o.y + 0.1 + (k / d) * unit, z: zf },
        });
    }
    b.box({ x: o.x - 0.2, y: o.y + 0.1 + (n / d) * unit - 0.06, z: zf + 0.09 }, [2.9, 0.12, 0.05], C.level);
    if (answered) reaction = lockReaction();
  } else if (scene.kind === 'quai') {
    reaction = quai(b, scene, answered, o, answerAt, scale, posed);
  } else if (scene.kind === 'column') {
    // Le C neutre (lot L6a) : le décor du lieu et son objet témoin ; après une bonne réponse (la vue ne passe `answered`
    // qu'à elle), il réagit et reste jusqu'à l'item suivant ; jamais seul à dire la réussite (le retour habituel la dit).
    reaction = COLUMN_DECOR[place]?.(b, o, answered) ?? null;
  } else if (scene.kind === 'rest') {
    // Le lieu au repos (lot L7) : son décor seul ; la réponse juste se dit dans le panneau, rien ne bouge (directeur
    // artistique : aucun témoin en R au rivage nord).
    placeArt(place)?.rest?.(b, o);
  } else if (scene.kind === 'restMark') {
    // Le lieu au repos (lot L9) : son décor seul ; après une bonne réponse seulement (la vue ne passe `answered` qu'à
    // elle), l'objet de la bonne réponse réagit et reste jusqu'à l'item suivant (la bouée reçoit son voyant, la malle se
    // ferme) ; jamais seul à dire la réussite (le retour habituel la dit).
    const art = placeArt(place);
    art?.rest?.(b, o);
    if (answered && answerAt && art?.answer?.mark) reaction = art.answer.mark(answerAt, scale);
  } else if (scene.kind === 'saline' || scene.kind === 'jauge') {
    if (scene.kind === 'jauge') jauge(b, labels, scene, o);
    else idleSluice(b, o);
    // Le sac de la bonne réponse se ferme d'un lien, et le reste : rien d'autre ne change (la jauge non plus).
    if (answered && answerAt) reaction = { facets: sackTie(scale), from: answerAt, to: answerAt, arc: 0, stay: true };
  }
  return { still: b.build(), labels, reaction };
}

/**
 * Le décor du C neutre de chaque lieu qui en a un (lot L6a), posé sur la scène en `o`, et son objet témoin : `done`, une
 * bonne réponse vient d'être donnée ; rend la réaction (ce qui bouge, puis reste), ou rien.
 */
const COLUMN_DECOR: Partial<Record<PlaceId, (b: FacetBuilder, o: Vec3, done: boolean) => Reaction | null>> = {
  engine: steamValve,
  shipyard: hullPlank,
  // Le rivage nord (lot L7) : le décor et le témoin du fichier du lieu (le volet de la Vigie ; les Archives n'en ont pas).
  lookout: (b, o, done) => placeArt('lookout')!.column?.(b, o, done) ?? null,
  archives: (b, o, done) => placeArt('archives')!.column?.(b, o, done) ?? null,
  mangrove: pirogueWitness,
  ruins: digWinch,
  observatory: observatoryBay,
  commons: commonsFountain,
  // Le large (lot L9) : la bouée témoin des Balises, la malle témoin de la Gare maritime.
  beacons: (b, o, done) => placeArt('beacons')!.column?.(b, o, done) ?? null,
  ferry: (b, o, done) => placeArt('ferry')!.column?.(b, o, done) ?? null,
};

/** Le plancher de la scène du Chantier naval monte de tant au-dessus de la grève (il s'en détache). */
export const SHIPYARD_FLOOR_RISE = 0.12;

/**
 * La planche de bordé du Chantier naval, l'objet témoin de ses missions (lot L6b) : sa longueur, sa largeur, son
 * épaisseur ; ses tréteaux (leur hauteur, leur écart le long de la planche) ; sa place sur le plancher, depuis le milieu
 * de la scène ; la part de la longueur de la coque où elle se plaque (sur la partie droite du flanc, entre deux couples
 * de même largeur, hors des accores) ; la bande du bordé où elle se plaque (de la couture au liston, presque debout,
 * face à la caméra, au-dessus de la tête des accores : relecture de L6b, directeur artistique) ; le lever de son arc.
 */
export const PLANK = { length: 1.8, width: 0.32, thick: 0.07, trestle: 0.72, spread: 0.62, at: { dx: 0, dz: -0.5 }, hull: 0.53, band: 2, arc: 0.45 } as const;

/**
 * Où la planche de bordé se plaque sur la coque, dans le monde : son milieu, à peine hors du flanc au sud-est, entre le
 * bouchain et la couture du bordé, à la part `PLANK.hull` de la longueur ; son roulis (la pente du flanc à cet endroit).
 */
export function plankOnHull(): { at: Vec3; roll: number } {
  const c = placeById('shipyard').center;
  const h0 = groundAt(c);
  const [lo, hi] = [hullEdge(PLANK.hull, PLANK.band, 1), hullEdge(PLANK.hull, PLANK.band + 1, 1)];
  const [mx, my, mz] = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  // La pente du flanc, dans le plan (vers le sud-est, vers le haut) ; la planche s'écarte du flanc de sa demi-épaisseur.
  const across = (hi[0] - lo[0]) * SLIP_N.x + (hi[2] - lo[2]) * SLIP_N.z;
  const up = hi[1] - lo[1];
  const roll = Math.atan2(up, across);
  const off = PLANK.thick / 2 + 0.03;
  const [ox, oy] = [Math.sin(roll) * off, -Math.cos(roll) * off];
  return { at: { x: c.x + mx + ox * SLIP_N.x, y: h0 + my + oy, z: c.z + mz + ox * SLIP_N.z }, roll };
}

/** Un tréteau, posé le long de la cale (son z local) : sa traverse, et deux pieds écartés en travers. */
function trestle(b: FacetBuilder, at: Vec3, height: number, color: number, top = color): void {
  b.box({ x: at.x, y: at.y + height - 0.1, z: at.z, yaw: SLIP_YAW }, [0.62, 0.1, 0.14], color, top);
  for (const side of [-1, 1]) {
    const foot = { x: at.x + side * 0.34 * SLIP_N.x, y: at.y - 0.05, z: at.z + side * 0.34 * SLIP_N.z };
    const head = { x: at.x + side * 0.16 * SLIP_N.x, y: at.y + height - 0.1, z: at.z + side * 0.16 * SLIP_N.z };
    b.beam(foot, head, 0.08, color);
  }
}

/**
 * La planche de bordé du Chantier naval, l'objet témoin de ses missions (lot L6b) : couchée sur ses deux tréteaux, au
 * milieu du plancher, entre Kéo et le charpentier, le long de la coque. Après une bonne réponse, elle se lève et va se
 * plaquer contre le flanc de la coque, à sa place dans le bordé, en un geste court (son arc, son roulis), puis reste
 * jusqu'à l'item suivant, où elle revient sur ses tréteaux ; d'un coup avec « Réduire les animations ». Sans éclat.
 */
function hullPlank(b: FacetBuilder, spot: Vec3, done: boolean): Reaction | null {
  const o = { ...spot, y: spot.y + SHIPYARD_FLOOR_RISE };
  const at = { x: o.x + PLANK.at.dx, y: o.y, z: o.z + PLANK.at.dz };
  for (const u of [-PLANK.spread, PLANK.spread]) trestle(b, { x: at.x + u * SLIP_U.x, y: at.y, z: at.z + u * SLIP_U.z }, PLANK.trestle, C.post, C.lever);
  const rest = { x: at.x, y: at.y + PLANK.trestle + PLANK.thick / 2, z: at.z };
  const plank = new FacetBuilder();
  plank.box({ x: 0, y: -PLANK.thick / 2, z: 0 }, [PLANK.width, PLANK.thick, PLANK.length], C.planking, C.plankFace);
  // Sa face du dessous, claire elle aussi : plaquée contre le flanc, c'est elle qu'on voit.
  const [w, t, l] = [PLANK.width / 2, PLANK.thick / 2, PLANK.length / 2];
  plank.quad([-w, -t, -l], [w, -t, -l], [w, -t, l], [-w, -t, l], C.plankFace);
  const facets = plank.build();
  if (!done) {
    b.append(placeFacets(facets, { ...rest, yaw: SLIP_YAW }));
    return null;
  }
  const hull = plankOnHull();
  return { facets, from: rest, to: hull.at, arc: PLANK.arc, stay: true, turn: { yaw: SLIP_YAW, roll: hull.roll } };
}

/**
 * Le treuil de fouille des Ruines, l'objet témoin de ses missions (lot L8b ; « treuil de fouille », jamais un nom
 * d'animal) : au milieu du dallage de la scène, entre Kéo et l'archéologue, un trépied de trois perches, une poulie fixe
 * en haut (elle ne tourne pas, sans roue dentée), sa corde, et un seau de bois au fond d'une petite fosse bordée de
 * planches, son bord seul visible. Après une bonne réponse seulement, le seau remonte (d'environ 0,8 au plus haut) et se
 * pose sur une planche au bord de la fosse, plein de sable seulement ; il reste jusqu'à l'item suivant, où il est de
 * nouveau au fond, d'un coup ; d'un coup aussi avec « Réduire les animations ». La corde va au seau posé.
 */
export const DIG_WINCH = { back: 0.9, legs: 0.7, height: 1.75, pit: 0.36, board: 0.6, bucket: 0.3, sunk: 0.27, arc: 0.65 } as const;

/** Le dallage de la scène des Ruines, levé au-dessus du dallage du lieu (scenette.ts le dessine). */
export const RUINS_PAVING_RISE = 0.12;

/** Le seau du treuil de fouille, à l'origine (son fond en 0) : un tonnelet de bois cerclé, son dessus de sable. */
function digBucket(b: FacetBuilder): void {
  b.prism({ x: 0, y: 0, z: 0 }, 0.14, 0.17, DIG_WINCH.bucket, 8, C.walkwayDark, C.digSand);
  b.prism({ x: 0, y: DIG_WINCH.bucket - 0.08, z: 0 }, 0.175, 0.175, 0.04, 8, C.passeurBronze, C.walkwayDark);
}

/** Où le seau se tient au fond de la fosse et sur la planche, dans le monde (son fond). */
export function digBucketSpots(): { pit: Vec3; board: Vec3 } {
  const s = sceneSpot('ruins');
  const W = DIG_WINCH;
  const floor = s.y + RUINS_PAVING_RISE;
  const z = s.z - W.back;
  return { pit: { x: s.x, y: floor + 0.03 - W.bucket, z }, board: { x: s.x + W.pit + 0.1 + W.board / 2, y: floor + 0.05, z } };
}

function digWinch(b: FacetBuilder, spot: Vec3, done: boolean): Reaction | null {
  const W = DIG_WINCH;
  const floor = spot.y + RUINS_PAVING_RISE;
  const p = { x: spot.x, z: spot.z - W.back };
  const up = [0, 1, 0] as const;
  // La fosse : son fond sombre, d'une seule couleur, et sa bordure de planches ; la planche où le seau se pose, à l'est.
  facing(
    b,
    [
      [p.x - W.pit, floor + 0.006, p.z - W.pit],
      [p.x + W.pit, floor + 0.006, p.z - W.pit],
      [p.x + W.pit, floor + 0.006, p.z + W.pit],
      [p.x - W.pit, floor + 0.006, p.z + W.pit],
    ],
    up,
    C.pitFloor,
  );
  for (const side of [-1, 1]) {
    b.box({ x: p.x, y: floor, z: p.z + side * (W.pit + 0.05) }, [2 * W.pit + 0.2, 0.06, 0.1], C.walkwayDark, C.walkway);
    b.box({ x: p.x + side * (W.pit + 0.05), y: floor, z: p.z }, [0.1, 0.06, 2 * W.pit], C.walkwayDark, C.walkway);
  }
  const { pit, board } = digBucketSpots();
  b.box({ x: board.x, y: floor, z: board.z }, [W.board, 0.05, 0.42], C.walkwayDark, C.walkway);
  // Le trépied : trois perches de la fosse jusqu'en haut, deux devant (de part et d'autre de la fosse), une derrière.
  const apex = { x: p.x, y: floor + W.height, z: p.z };
  for (const t of [Math.PI * 0.75, Math.PI * 0.25, -Math.PI / 2]) b.beam({ x: p.x + W.legs * Math.cos(t), y: floor, z: p.z + W.legs * Math.sin(t) }, apex, 0.07, C.walkwayDark);
  // La poulie, fixe, sur son axe, face au sud.
  b.drum({ x: apex.x, y: apex.y - 0.16, z: apex.z - 0.03, pitch: Math.PI / 2 }, 0.11, 0.06, 8, C.passeurBronze);
  const r = new FacetBuilder();
  digBucket(r);
  const bucket = r.build();
  const at = done ? board : pit;
  b.beam({ x: apex.x, y: apex.y - 0.27, z: apex.z }, { x: at.x, y: at.y + W.bucket, z: at.z }, 0.025, C.cord);
  if (!done) {
    b.append(placed(bucket, 1, pit));
    return null;
  }
  return { facets: bucket, from: pit, to: board, arc: W.arc, stay: true };
}

/**
 * La pirogue de la Mangrove, l'objet témoin de ses missions (lot L8a) : vide, sans pagayeur, au repos sur l'eau à
 * `rest` du bord du platelage, au milieu, entre Kéo et la botaniste, sa longueur le long du bord. Après une bonne réponse
 * seulement, elle glisse droit de `glide` vers le platelage (une translation courte, sans roulis) et s'arrête à un peu
 * plus d'une unité de son bord : plus près, le platelage, plus haut que son plat-bord, la cacherait sous la caméra de la
 * scénette (relevé sur capture) ; elle reste jusqu'à l'item suivant, où elle est de nouveau à sa place, d'un coup ; d'un
 * coup aussi avec « Réduire les animations ».
 */
export const PIROGUE = { rest: 2.4, glide: 1.2, length: 1.7, bow: 0.55, width: 0.62, keel: -0.12, rim: 0.2 } as const;

/** Le bord nord du platelage de la scénette de la Mangrove (scenette.ts le dessine un peu plus grand que celui du lieu). */
export const MANGROVE_SCENE_DECK = { grow: 0.1, rise: 0.03 } as const;

/** Où la pirogue se tient, au repos, dans le monde (sa coque à fleur d'eau). */
export function pirogueRest(): Vec3 {
  const o = sceneSpot('mangrove');
  const front = o.z - MANGROVE.deck.d / 2 - MANGROVE_SCENE_DECK.grow;
  return { x: o.x, y: 0, z: front - PIROGUE.rest - PIROGUE.width / 2 };
}

/** Un quadrilatère tourné vers `out` (son ordre retourné s'il le faut). */
function facing(b: FacetBuilder, q: readonly (readonly [number, number, number])[], out: readonly [number, number, number], color: number): void {
  const [a, c, d] = q;
  const u = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const [p0, p1, p2, p3] = n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0 ? q : [...q].reverse();
  b.quad(p0, p1, p2, p3, color);
}

/**
 * La pirogue, à l'origine, sa longueur le long de x : la coque taillée d'une pièce (ses flancs de bois sombre, son
 * intérieur plus clair vu d'en haut), ses deux pointes un peu relevées.
 */
function pirogue(b: FacetBuilder): void {
  const P = PIROGUE;
  const w = P.width / 2;
  // La coque et son plat-bord sombres, l'intérieur clair, en creux, plus étroit qu'elle, et un banc au milieu : vue
  // d'en haut, une coque creuse, jamais une planche (relevé sur capture).
  b.box({ x: 0, y: P.keel, z: 0 }, [P.length, P.rim - P.keel, P.width], C.pirogue);
  const [li, wi] = [P.length / 2 + P.bow * 0.45, w - 0.08];
  b.quad([-li, P.rim + 0.004, wi], [li, P.rim + 0.004, wi], [li, P.rim + 0.004, -wi], [-li, P.rim + 0.004, -wi], C.pirogueInside);
  b.box({ x: 0, y: P.rim, z: 0 }, [0.1, 0.02, 2 * wi], C.pirogue);
  for (const dir of [-1, 1]) {
    const x0 = (dir * P.length) / 2;
    const tip = x0 + dir * P.bow;
    const top: [number, number, number] = [tip, P.rim + 0.06, 0];
    const low: [number, number, number] = [tip, P.keel + 0.1, 0];
    // Le dessus de la pointe, vers le ciel : l'ordre de ses sommets suit le sens de la pointe.
    if (dir > 0) b.triangle([x0, P.rim, w], top, [x0, P.rim, -w], C.pirogue);
    else b.triangle([x0, P.rim, -w], top, [x0, P.rim, w], C.pirogue);
    for (const side of [-1, 1]) facing(b, [[x0, P.keel, side * w], low, top, [x0, P.rim, side * w]], [dir * 0.4, 0, side], C.pirogue);
  }
}

function pirogueWitness(b: FacetBuilder, _spot: Vec3, done: boolean): Reaction | null {
  const r = new FacetBuilder();
  pirogue(r);
  const boat = r.build();
  const from = pirogueRest();
  if (!done) {
    b.append(placed(boat, 1, from));
    return null;
  }
  return { facets: boat, from, to: { ...from, z: from.z + PIROGUE.glide }, arc: 0, stay: true };
}

/**
 * La soupape de la Turbine, l'objet témoin de ses missions (lot L6a) : sur sa colonne de cuivre, au milieu du dallage,
 * entre Kéo et la machiniste, son corps de fer, son chapeau de cuivre, et son levier à contrepoids, couché au repos.
 * Après une bonne réponse, le levier se lève et une bouffée de vapeur monte au-dessus d'un écart d'air clair (jamais
 * collée à la soupape), en un geste court, puis reste jusqu'à l'item suivant ; d'un coup avec « Réduire les
 * animations ». Sans éclat ni lumière.
 */
export const VALVE = { z: -0.75, riser: 0.95, body: 0.32, lever: 1.05, lift: 0.4, capX: 0.04, capHeight: 0.16, rise: 0.3 } as const;

/** Le dallage de la scène de la Turbine monte de tant au-dessus du replat (sans quoi il s'y confond, à la même hauteur). */
export const ENGINE_PAVING_RISE = 0.15;

function steamValve(b: FacetBuilder, spot: Vec3, done: boolean): Reaction | null {
  const o = { ...spot, y: spot.y + ENGINE_PAVING_RISE };
  const z = o.z + VALVE.z;
  b.prism({ x: o.x, y: o.y - 0.05, z }, 0.26, 0.24, 0.12, 8, C.stoneDark, C.stone);
  b.prism({ x: o.x, y: o.y, z }, 0.11, 0.11, VALVE.riser, 8, C.copper);
  const top = o.y + VALVE.riser;
  b.box({ x: o.x, y: top, z }, [VALVE.body, VALVE.body, VALVE.body], C.engineIron, C.ironTop);
  const cap = top + VALVE.body;
  b.prism({ x: o.x + VALVE.capX, y: cap, z }, 0.1, 0.08, VALVE.capHeight, 8, C.copper);
  // Le levier, de sa charnière (à l'est du chapeau) vers l'ouest, son contrepoids au bout ; levé après une bonne réponse
  // (la bouffée monte au-dessus de lui : rien ne se touche).
  const angle = done ? VALVE.lift : 0;
  const pivot = { x: o.x + 0.24, y: cap + 0.2, z: z + 0.02 };
  b.box({ x: pivot.x, y: cap, z: pivot.z }, [0.08, 0.24, 0.08], C.engineIron);
  const end = { x: pivot.x - VALVE.lever * Math.cos(angle), y: pivot.y + VALVE.lever * Math.sin(angle), z: pivot.z };
  b.beam(pivot, end, 0.07, C.engineIron);
  b.prism({ x: end.x, y: end.y - 0.13, z: end.z }, 0.14, 0.14, 0.24, 8, C.engineIron, C.ironTop);
  if (!done) return null;
  // La bouffée, centrée au-dessus du chapeau (directeur artistique, relecture de L6a), monte de `VALVE.rise` ; l'écart
  // d'air clair (`STEAM_GAP`) est tenu dès son départ (directeur du contenu pédagogique) au-dessus de tout ce qui est sous
  // elle : le chapeau, et le levier levé (son bras, son contrepoids au bout).
  const r = new FacetBuilder();
  engineSteam(r, { x: 0, y: 0, z: 0 }, 0.55, VALVE_PUFFS);
  const puff = r.build();
  const x = o.x + VALVE.capX;
  const west = x + boundsOf(puff).min[0];
  const weight = end.x + 0.14;
  const lever = west <= weight ? end.y + 0.11 : pivot.y + ((pivot.x - west) / (pivot.x - end.x)) * (end.y - pivot.y) + 0.05;
  const from = { x, y: Math.max(cap + VALVE.capHeight, lever) + STEAM_GAP, z };
  return { facets: puff, from, to: { ...from, y: from.y + VALVE.rise }, arc: 0, stay: true };
}

/**
 * La jauge du bassin des Marais salants (lot L5), au milieu de la scène, dans l'eau du bassin, derrière Kéo et la
 * saunière : la cuve de réserve vue de face, son eau jusqu'à la graduation `n`, et le poteau gradué à sa droite, de
 * `base` à `base + height` au-dessus du sol de la scène, un cran par graduation, un grand cran à chaque entier (ses
 * nombres sont des panneaux de la page, rien n'est peint). L'eau s'arrête pile sur une graduation, son trait clair
 * passe sur le poteau ; rien ne bouge.
 */
export const JAUGE = { height: 3, base: 0.2, z: -0.55, tank: 1.9, post: 0.85 } as const;

function jauge(b: FacetBuilder, labels: SceneLabel[], scene: Extract<ItemScene, { kind: 'jauge' }>, o: Vec3): void {
  const J = JAUGE;
  const d = Math.max(1, scene.d),
    n = Math.max(0, Math.min(d, scene.n));
  const z = o.z + J.z;
  const zf = z + 0.2;
  const y0 = o.y + J.base;
  const px = o.x + J.post;
  const level = y0 + (n / d) * J.height;
  // La cuve : son fond d'argile, ses deux montants de bois ; le vide clair au-dessus de l'eau.
  b.box({ x: o.x - 0.25, y: o.y - 0.2, z }, [J.tank + 0.5, J.height + 0.6, 0.35], C.clay, C.clayTop);
  // De dos (caméra libre), la cuve n'est pas une dalle nue : deux montants de bois à ses bords et deux cerclages.
  const back = z - 0.2;
  for (const side of [-1, 1]) b.box({ x: o.x - 0.25 + side * (J.tank / 2 + 0.17), y: o.y - 0.2, z: back }, [0.16, J.height + 0.6, 0.1], C.post);
  for (const h of [0.35, 0.7]) b.box({ x: o.x - 0.25, y: o.y - 0.2 + h * (J.height + 0.6), z: back }, [J.tank + 0.36, 0.13, 0.08], C.post);
  b.box({ x: o.x - 0.25, y: y0, z: zf - 0.02 }, [J.tank, J.height, 0.04], C.empty);
  b.box({ x: o.x - 0.25, y: y0, z: zf }, [J.tank, level - y0, 0.05], C.pan);
  // Le poteau gradué, blanc, de l'entier du bas à celui du haut.
  b.box({ x: px, y: y0 - 0.15, z: zf }, [0.22, J.height + 0.3, 0.12], C.white);
  for (let k = 0; k <= d; k++) {
    const big = k === 0 || k === d;
    const y = y0 + (k / d) * J.height;
    b.box({ x: px - (big ? 0.3 : 0.2), y: y - 0.025, z: zf + 0.07 }, [big ? 0.6 : 0.4, 0.05, 0.04], C.stoneDark);
    if (big) labels.push({ text: String(scene.start + k / d), at: { x: px + 0.5, y, z: zf } });
  }
  b.box({ x: o.x - 0.05, y: level - 0.05, z: zf + 0.09 }, [J.tank + 1, 0.1, 0.05], C.level);
}

/**
 * Le bassin au repos (lot L5) : la vanne de bois qui laisse entrer l'eau, fermée, sur le muret, et un petit cône de sel
 * raclé au bord ; rien de l'item.
 */
function idleSluice(b: FacetBuilder, o: Vec3): void {
  const z = o.z + JAUGE.z;
  for (const side of [-1, 1]) b.box({ x: o.x + side * 0.7, y: o.y - 0.2, z }, [0.2, 1.5, 0.2], C.post);
  b.box({ x: o.x, y: o.y - 0.1, z: z + 0.05 }, [1.3, 1.05, 0.1], C.newWood, C.deck);
  b.box({ x: o.x, y: o.y + 1.3, z }, [1.7, 0.16, 0.24], C.post);
  b.prism({ x: o.x + 1.7, y: o.y, z: z + 0.2 }, 0.62, 0.66, 0.16, 8, C.saltBase, C.saltShade);
  b.prism({ x: o.x + 1.7, y: o.y + 0.16, z: z + 0.2, yaw: 0.3 }, 0.6, 0.2, 0.62, 8, C.salt, C.saltShade);
  b.prism({ x: o.x + 1.7, y: o.y + 0.78, z: z + 0.2, yaw: 0.3 }, 0.2, 0, 0.18, 8, C.saltShade);
}


/**
 * Le quai de la scénette des Quais (lot 3) : le quai de bois contre le bord de pierre du bassin, la bande de devant
 * libre pour Kéo et le docker, les caisses de l'item en palettes derrière elle ; la barque amarrée dans le bassin ; la
 * grue au bout est, sa flèche au-dessus du quai, son crochet. Avant la réponse, la moitié : toutes les caisses sur le
 * quai, la barque vide ; le double : les caisses du quai au fond, les nouvelles dans la barque. Après : les caisses ont
 * changé de place (la moitié dans la barque, les nouvelles sur le quai), et la bonne caisse de réponse monte au crochet
 * (la réaction, `answerAt` : sa place dans la rangée) et y reste. Le quai vide (`calcul`, les autres missions des
 * Quais) : rien sur le quai ni dans la barque, la bonne caisse monte au crochet de même.
 */
function quai(b: FacetBuilder, scene: Extract<ItemScene, { kind: 'quai' }>, answered: boolean, o: Vec3, answerAt: Vec3 | undefined, scale: number, posed: boolean): Reaction | null {
  const moved = Math.abs(scene.after - scene.before);
  const kept = scene.op === 'moitie' ? scene.after : scene.before;
  // Les caisses du devant du bloc (toutes, pour la moitié ; les nouvelles, pour le double) et celles du fond ; aucune
  // sur le quai vide (`calcul`).
  const front = crateBlock(scene.op === 'moitie' ? scene.before : moved);
  const back = scene.op === 'double' ? crateBlock(scene.before) : { w: 0, d: 0 };
  const gap = back.d ? 0.4 : 0;
  const edge = o.z + QUAY.depth / 2;
  const qd = Math.max(QUAY.depth, front.d + gap + back.d + 0.5 + QUAY.strip);
  const qw = Math.max(QUAY.width, Math.max(front.w, back.w) + 4);
  b.box({ x: o.x, y: o.y - PLATFORM_DEPTH, z: edge - qd / 2 }, [qw, PLATFORM_DEPTH, qd], C.quaySide, C.quay);
  // Les blocs de caisses, au milieu du quai, un peu à gauche (le docker et la grue sont à droite).
  const x0 = o.x - 0.4 - Math.max(front.w, back.w) / 2 + CRATE_PITCH / 2;
  const zFront = edge - QUAY.strip - front.d + CRATE_PITCH / 2;
  const zBack = zFront - gap - back.d;
  // La barque dans le bassin, contre le bord de pierre.
  const boat = quayBoat(scene, o);
  barque(b, boat.at, boat.length, boat.width);
  barqueFloor(b, boat.at, boat.length, boat.width);
  const onBoat = boat.cargo;
  // La grue au bout est du quai : son pied, son mât, sa flèche vers l'ouest au-dessus du quai, la corde et le crochet.
  // Tant que le haut des Quais (leur grue) n'est pas posé (`posed`), son pied de pierre seul : la grue attend.
  const mast = { x: o.x + qw / 2 - 0.9, z: edge - QUAY.strip - 0.2 };
  const hook = craneHook(o, qw);
  b.box({ x: mast.x, y: o.y, z: mast.z }, [0.8, 0.5, 0.8], C.stoneDark);
  if (posed) {
    b.box({ x: mast.x, y: o.y + 0.5, z: mast.z }, [0.32, CRANE.height - 0.5, 0.32], C.crane);
    b.box({ x: (mast.x + hook.x) / 2 - 0.3, y: o.y + CRANE.height, z: mast.z }, [mast.x - hook.x + 1, 0.24, 0.24], C.crane);
    b.box({ x: hook.x, y: hook.y + 0.3, z: hook.z }, [0.05, o.y + CRANE.height - hook.y - 0.3, 0.05], C.rope);
    liftingHook(b, { x: hook.x, y: hook.y + 0.3, z: hook.z }, C.stoneDark);
  }
  if (scene.op === 'moitie') {
    crates(b, answered ? kept : scene.before, x0, o.y, zFront);
    if (answered) crates(b, moved, onBoat.x, onBoat.y, onBoat.z);
  } else if (scene.op === 'double') {
    crates(b, kept, x0, o.y, zBack);
    if (answered) crates(b, moved, x0, o.y, zFront);
    else crates(b, moved, onBoat.x, onBoat.y, onBoat.z);
  }
  if (!answered || !answerAt) return null;
  // La bonne caisse de réponse monte au crochet, et y reste pendue ; sans grue, elle passe d'un bond dans la barque, à la
  // place que la grue lui aurait donnée.
  const r = new FacetBuilder();
  answerCrate(r, ORIGIN, scale);
  // Le haut de la caisse juste sous l'anneau du crochet.
  const to = posed ? { x: hook.x, y: hook.y - 0.4 - 0.7 * scale, z: hook.z } : boat.hold;
  return { facets: r.build(), from: answerAt, to, arc: 1.2, stay: true };
}

/**
 * La barque d'une scène de quai : assez grande pour les caisses qui partent ou arrivent (au milieu, un peu vers la
 * poupe), une place libre devant elles, côté proue, pour la caisse que la grue y descend à la réussite de la mission
 * (`hold`), et la vitre de sa lanterne de proue (`lantern`, son bas). La proue reste dans le cadre de la scénette (à
 * droite, sous la grue) : une longue barque file vers l'ouest.
 */
export function quayBoat(scene: Extract<ItemScene, { kind: 'quai' }>, o: Vec3 = sceneSpot('quais')): { at: Vec3; length: number; width: number; cargo: Vec3; hold: Vec3; lantern: Vec3 } {
  const cargo = crateBlock(Math.abs(scene.after - scene.before));
  const length = Math.max(5.2, cargo.w + 3.4);
  const width = Math.max(1.8, cargo.d + 1);
  const edge = o.z + QUAY.depth / 2;
  const at = { x: Math.min(o.x - 0.8, o.x + 3.4 - width / 2 - 0.3 - length / 2), y: 0, z: edge + 0.75 + width / 2 };
  return {
    at,
    length,
    width,
    // Les caisses posées sur le plancher, au milieu de la coque en travers (les palettes n'ont pas d'allée entre elles et
    // le bordé : directeur artistique, reprise des abords, elles ne le chevauchent plus).
    cargo: { x: at.x - cargo.w / 2 - 0.5 + CRATE_PITCH / 2, y: at.y + BARQUE_FLOOR, z: at.z - cargo.rows / 2 + CRATE_PITCH / 2 },
    hold: { x: at.x + length / 2 - 1.25, y: at.y + BARQUE_FLOOR, z: at.z },
    lantern: barqueBow(at, length, width).lantern,
  };
}

/**
 * La réussite de la mission aux Quais (directeur artistique) : la caisse du crochet descendue dans la barque, à sa
 * place (`crate`, à l'échelle des caisses-réponses), et la vitre allumée de la lanterne de proue (`glass`, un peu plus
 * grande que l'éteinte, qu'elle recouvre ; la vue la dessine sans lumière).
 */
export function quaySuccess(scene: Extract<ItemScene, { kind: 'quai' }>, scale: number): { crate: Facets; glass: Facets; hold: Vec3 } {
  const boat = quayBoat(scene);
  const c = new FacetBuilder();
  answerCrate(c, boat.hold, scale);
  const g = new FacetBuilder();
  const k = LANTERN_GLASS * 1.15;
  g.box({ x: boat.lantern.x, y: boat.lantern.y - (k - LANTERN_GLASS) / 2, z: boat.lantern.z }, [k, k, k], C.lamp);
  return { crate: c.build(), glass: g.build(), hold: boat.hold };
}

/** La barque chargée laissée aux Quais par la réussite : dix caisses, et celle de la grue à la proue. */
const LOADED_BOAT: Extract<ItemScene, { kind: 'quai' }> = { kind: 'quai', op: 'moitie', before: 20, after: 10 };
const LOADED_BOAT_CRATE = 0.8;

/** La barque chargée laissée aux Quais : sa place, sa longueur et sa largeur (la vue cadre le retour de la scénette sur elle). */
export function loadedBoat(): { at: Vec3; length: number; width: number } {
  const { at, length, width } = quayBoat(LOADED_BOAT);
  return { at, length, width };
}

/** La grue du quai : la hauteur de sa flèche au-dessus du quai, et l'écart du crochet au bout est du quai. */
const CRANE = { height: 4.2, reach: 5.2, hookDrop: 2 } as const;

/** Le haut du crochet de la grue du quai (la corde s'y arrête), au-dessus de la bande de devant. */
export function craneHook(o: Vec3 = sceneSpot('quais'), qw: number = QUAY.width): Vec3 {
  const edge = o.z + QUAY.depth / 2;
  return { x: o.x + qw / 2 - 0.9 - CRANE.reach, y: o.y + CRANE.height - CRANE.hookDrop, z: edge - QUAY.strip - 0.2 };
}

// ---------- Les traces des scénettes ----------

/**
 * Le panier plein laissé aux Filets par la réussite de la scénette, depuis le centre du lieu : là où il s'est posé, au
 * pied du plancher de séchage, devant la pêcheuse, sur la grève (hors du plancher : dans la scénette et dans le monde,
 * il est à la même place, à la même hauteur, sans saut au retour).
 */
const FILETS_BASKET: Vec2 = { x: 5.2, z: 7.3 };

/** Le panier plein des Filets, posé sur le sable dans le monde (et dans la scénette, au pied du plancher). */
export function filetsBasketAt(): Vec3 {
  const c = placeById('filets').center;
  const at = { x: c.x + FILETS_BASKET.x, z: c.z + FILETS_BASKET.z };
  return { ...at, y: heightAt(at) };
}

/**
 * Le pan de filet raccommodé et tendu sur le séchoir des Filets (son pan du nord, places.ts, `filetsRack`), ses mailles
 * en cordes en travers et de haut en bas sur sa face tournée vers la caméra : la trace de la réussite, dans la scénette
 * puis dans le monde.
 */
export function mendedNet(b: FacetBuilder): void {
  const p = placeById('filets');
  const y0 = groundAt(p.center);
  const c = Math.cos(p.yaw),
    s = Math.sin(p.yaw);
  const at = (lx: number, lz: number) => ({ x: p.center.x + lx * c + lz * s, z: p.center.z - lx * s + lz * c });
  const rack = filetsRack();
  const yaw = p.yaw + rack.yaw;
  // Le long de la perche (`u`), et vers la caméra (`n`, à l'ouest et au sud), dans le repère du lieu.
  const u = { x: Math.cos(rack.yaw), z: -Math.sin(rack.yaw) };
  const n = { x: -u.z, z: u.x };
  const side = n.x * -0.46 + n.z * 0.88 > 0 ? 1 : -1;
  const pan = rack.pans[0];
  const w = rack.length / 2 - 0.15;
  const { bottom, height } = FILETS_RACK.pan;
  const ahead = (k: number, along = 0) => at(pan.x + side * n.x * k + u.x * along, pan.z + side * n.z * k + u.z * along);
  // Devant le pan usé du modèle, qu'il recouvre.
  const front = ahead(0.08);
  b.box({ x: front.x, y: y0 + bottom, z: front.z, yaw }, [w, height, 0.08], C.newRope);
  for (const dy of [0.35, 0.95, 1.55]) {
    const q = ahead(0.14);
    b.box({ x: q.x, y: y0 + bottom + dy, z: q.z, yaw }, [w, 0.05, 0.03], C.netLine);
  }
  for (const dx of [-w / 3, 0, w / 3]) {
    const q = ahead(0.14, dx);
    b.box({ x: q.x, y: y0 + bottom, z: q.z, yaw }, [0.05, height, 0.03], C.netLine);
  }
}

/**
 * La porte d'amont des Écluses (entre le bassin du haut et le sas du milieu), dans le monde : fermée tant que la
 * mission n'est pas réussie (le bois sombre du modèle, ses balanciers couchés sur les murs), puis ouverte, ses deux
 * vantaux neufs rabattus contre les murs du sas, de l'eau jusqu'au-dessus du mur, leurs balanciers couchés sur le mur
 * du bassin du haut, l'eau du sas montée au niveau du bassin du haut (ses murs rehaussés). Deux bornes de pierre aux
 * gonds : la porte se lit comme une porte d'écluse, jamais comme une planche posée sur l'eau.
 */
function lockGate(b: FacetBuilder, x: number, y: number, z: number, open: boolean): void {
  const hinge = z - 1.5;
  for (const side of [-1, 1]) b.box({ x: x + side * 1.95, y: y + 1.6, z: hinge }, [0.4, 0.45, 0.4], C.stoneDark, C.stone);
  if (!open) {
    b.box({ x, y: y + 0.7, z: hinge }, [3.6, 1.2, 0.3], C.lever);
    // Les balanciers couchés sur le mur du bassin du haut (son haut à 1,6), pas au-dessus.
    for (const side of [-1, 1])
      b.beam({ x: x + side * 1.5, y: y + 1.7, z: hinge }, { x: x + side * 2, y: y + 1.7, z: hinge - 1.6 }, 0.2, C.lever);
    return;
  }
  for (const side of [-1, 1]) b.box({ x: x + side * 1.95, y: y + 0.9, z }, [0.5, 0.7, 3], C.stoneDark, C.stone);
  b.box({ x, y: y + 0.9, z: z + 1.3 }, [4.4, 0.7, 0.4], C.stoneDark, C.stone);
  b.box({ x, y: y + 0.95, z: z - 0.1 }, [3.4, 0.55, 2.4], C.water, C.waterTop);
  for (const side of [-1, 1]) {
    // Le vantail, rangé contre le mur, son haut au ras du mur (rien ne dépasse de l'eau comme une planche) ; son
    // balancier couché sur le mur du bassin du haut, d'où il part de la borne.
    b.box({ x: x + side * 1.6, y: y + 1, z: hinge + 0.85 }, [0.18, 0.66, 1.5], C.newWood, C.lever);
    b.beam({ x: x + side * 1.75, y: y + 1.75, z: hinge + 0.2 }, { x: x + side * 1.95, y: y + 1.75, z: hinge - 1.8 }, 0.26, C.lever);
  }
}

/**
 * La trace que la réussite d'une scénette laisse dans son lieu (GD-20, lot 1 : les pièces durables du prototype sont
 * devenues les parties de la construction du lieu, ./construction.ts ; les traces restent). Une trace par mission jouée en
 * scénette (GD-20, point 8 : d'une mission à l'autre, seule la trace de la réussite change), tirée de `done`, les missions
 * du lieu déjà réussies : au Phare, pour la Chasse au son, les lampes de la galerie, face au sud, et une chose par autre
 * mission (`PHARE_TRACES`, lot L3) ; aux Filets, pour le Troupeau, le pan de filet raccommodé tendu sur le séchoir et le
 * panier plein à côté, et une chose par autre mission (`FILETS_TRACES`, lot L4) ; aux Écluses, pour les Nénuphars, la porte
 * d'amont ouverte et le sas rempli (fermée avant : elle est de la trace, pas du modèle, pour s'ouvrir), et une chose par
 * autre mission (`ECLUSES_TRACES`, lot L2) ; aux Quais, une chose remise en ordre sur le quai par mission
 * (`QUAIS_TRACES`) ; aux Marais salants, une chose par mission autour du hangar à sel (`SALTWORKS_TRACES`, lot L5) ;
 * à la Turbine, une chose par mission autour de la machine (`ENGINE_TRACES`, lot L6a) ; au Chantier naval, une chose
 * par mission autour de la cale (`SHIPYARD_TRACES`, lot L6b).
 * Rien avant la première réussite, sauf la porte fermée des Écluses.
 */
export function placeTrace(anyPlace: AnyPlaceId, done: readonly string[]): Facets {
  const place = scenePlace(anyPlace);
  const b = new FacetBuilder();
  const p = placeById(place);
  const y0 = groundOf(place, p.center);
  const { x, z } = p.center;
  if (place === 'ecluses') {
    lockGate(b, x, y0, z, done.includes('number-line'));
    for (const mission of done) ECLUSES_TRACES[mission]?.(b, x, y0, z);
  }
  if (place === 'phare') {
    if (done.includes('sound-hunt')) galleryLanterns(b, x, y0 + PHARE_GALLERY, z);
    for (const mission of done) if (Object.hasOwn(PHARE_TRACES, mission)) PHARE_TRACES[mission](b, x, z);
  } else if (place === 'filets') {
    if (done.includes('plurals')) {
      mendedNet(b);
      fullBasket(b, filetsBasketAt());
    }
    for (const mission of done) if (Object.hasOwn(FILETS_TRACES, mission)) FILETS_TRACES[mission](b, x, z);
  } else if (place === 'quais') {
    for (const mission of done) QUAIS_TRACES[mission]?.(b, x, z);
  } else if (place === 'saltworks') {
    for (const mission of done) if (Object.hasOwn(SALTWORKS_TRACES, mission)) SALTWORKS_TRACES[mission](b, x, z);
  } else if (place === 'engine') {
    for (const mission of done) if (Object.hasOwn(ENGINE_TRACES, mission)) ENGINE_TRACES[mission](b, x, z);
  } else if (place === 'shipyard') {
    for (const mission of done) if (Object.hasOwn(SHIPYARD_TRACES, mission)) SHIPYARD_TRACES[mission](b, x, z);
  } else if (place === 'mangrove') {
    for (const mission of done) if (Object.hasOwn(MANGROVE_TRACES, mission)) MANGROVE_TRACES[mission](b, x, z);
  } else if (place === 'ruins') {
    for (const mission of done) if (Object.hasOwn(RUINS_TRACES, mission)) RUINS_TRACES[mission](b, x, z);
  } else if (place === 'observatory') {
    for (const mission of done) if (Object.hasOwn(OBSERVATORY_TRACES, mission)) OBSERVATORY_TRACES[mission](b, x, z);
  } else if (place === 'commons') {
    for (const mission of done) if (Object.hasOwn(COMMONS_TRACES, mission)) COMMONS_TRACES[mission](b, x, z);
  } else {
    // Le rivage nord (lot L7) : une chose par mission, dessinée dans le fichier du lieu.
    // Une trace que portent deux missions (à l'Auberge, la mission de même rang des deux langues de la LV2) se dessine une
    // fois : l'identité de l'objet est la clé (les deux missions pointent vers le même objet de `traces`, jamais une copie).
    const traces = placeArt(place)?.traces ?? {};
    const drawn = new Set<object>();
    for (const mission of done)
      if (Object.hasOwn(traces, mission) && !drawn.has(traces[mission])) {
        drawn.add(traces[mission]);
        traces[mission].draw(b, { x, y: y0, z });
      }
  }
  return b.build();
}

/** Le dessus de la galerie du Phare (places.ts, ses abords), au-dessus du pied du lieu : ses lampes s'y posent. */
export const PHARE_GALLERY = 11.55;

/** Les lanternes de la galerie : leur poteau, puis la lanterne (socle, verre, chapeau), 0,6 unité de haut. */
export const GALLERY_LANTERN = { post: 0.35, base: 0.06, glass: 0.34, cap: 0.2, width: 0.3 } as const;

/**
 * La trace de la Chasse au son (relecture de L3, directeur artistique) : quatre lanternes à cage sombre, montants et
 * chapeau dans le gris de la toiture, verre jaune, chacune sur un poteau planté au milieu d'un pan de la rambarde face
 * au sud ; plus hautes que la rambarde, elles se découpent sur le ciel, et leur cage les sépare de la lanterne du Phare.
 */
function galleryLanterns(b: FacetBuilder, x: number, top: number, z: number): void {
  const L = GALLERY_LANTERN;
  // Le milieu d'un pan de la rambarde (un prisme à huit pans de rayon 2, places.ts) : 2·cos(π/8).
  const r = 2 * Math.cos(Math.PI / 8);
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 2 + ((k - 1.5) * Math.PI) / 4;
    const [px, pz] = [x + r * Math.cos(a), z + r * Math.sin(a)];
    let y = top;
    b.box({ x: px, y, z: pz }, [0.08, L.post, 0.08], C.slate);
    y += L.post;
    b.box({ x: px, y, z: pz }, [L.width, L.base, L.width], C.slate);
    y += L.base;
    b.box({ x: px, y, z: pz }, [L.width - 0.08, L.glass, L.width - 0.08], C.lamp);
    // Les quatre montants de la cage, aux coins du verre.
    const h = L.width / 2 - 0.03;
    for (const [dx, dz] of [[-h, -h], [h, -h], [-h, h], [h, h]] as const) b.box({ x: px + dx, y, z: pz + dz }, [0.05, L.glass, 0.05], C.slate);
    y += L.glass;
    // Le chapeau : une pyramide à quatre pans, ses arêtes sur les coins.
    b.prism({ x: px, y, z: pz, yaw: Math.PI / 4 }, (L.width / 2 + 0.03) * Math.SQRT2, 0, L.cap, 4, C.slate);
  }
}

/**
 * Où se pose la trace de chaque mission du Phare (hors de la Chasse au son, les lampes de la galerie), depuis le centre
 * du lieu, sur le plat de l'îlot, hors des chemins (la digue part au sud-est, le chemin de l'Escale au sud) et du jardin
 * de la gardienne (à l'ouest) : la corne de brume à l'est de la tour, le mât de signaux au sud-ouest ; tous deux dans le
 * champ du retour d'une scénette, au sud.
 */
export const PHARE_TRACE_SPOTS = {
  syllables: { x: 5.2, z: 2.6 },
  rhymes: { x: -4.6, z: 5 },
} as const;

/**
 * Les traces du Phare (GD-20, point 8, lot L3 : une par mission, au même lieu, dans les mêmes volumes, chacune lisible par
 * sa silhouette, sans figure ni texte, rien qui se compte ou se lise comme une réponse ; posées avec les abords, comme
 * les lampes de la galerie) :
 * - Abattage syllabique : la corne de brume, sur son socle de pierre, son pavillon rouge tourné vers le large, à l'est ;
 *   ce qui sonne au Phare quand la lanterne ne suffit pas (aucun battant, aucune cloche : les cloches portent les
 *   réponses) ;
 * - Rimes-échelle : le mât de signaux, sa vergue et une flamme rouge au vent, tenu par deux haubans à l'est et à
 *   l'ouest ; une seule flamme (rien ne se compte).
 * La Chasse au son garde la sienne : les quatre lampes de la galerie, face au sud.
 */
const PHARE_TRACES: Record<string, (b: FacetBuilder, cx: number, cz: number) => void> = {
  syllables: (b, x, z) => {
    const o = PHARE_TRACE_SPOTS.syllables;
    const g = quaiGround(x + o.x, z + o.z);
    // Le socle de pierre, qui descend dans le sol ; le caisson de la corne dessus, et son pied.
    b.box({ x: g.x, y: g.y - 0.4, z: g.z }, [1.1, 0.9, 1.0], C.stoneDark, C.stone);
    b.box({ x: g.x - 0.2, y: g.y + 0.5, z: g.z }, [0.6, 0.5, 0.6], C.post, C.lever);
    b.box({ x: g.x + 0.05, y: g.y + 0.5, z: g.z }, [0.14, 0.75, 0.14], C.iron);
    // Le pavillon, couché, sa bouche vers l'est (vers le large), vu de profil depuis le sud : un cône évasé ; le dedans
    // de sa bouche, plus sombre.
    b.prism({ x: g.x - 0.15, y: g.y + 1.25, z: g.z, pitch: Math.PI / 2, yaw: Math.PI / 2 }, 0.13, 0.48, 1.25, 10, C.knob, C.iron);
  },
  rhymes: (b, x, z) => {
    const o = PHARE_TRACE_SPOTS.rhymes;
    const g = quaiGround(x + o.x, z + o.z);
    const top = g.y + 4.6;
    b.box({ x: g.x, y: g.y - 0.4, z: g.z }, [0.8, 0.65, 0.8], C.stoneDark, C.stone);
    b.box({ x: g.x, y: g.y + 0.2, z: g.z }, [0.16, top - g.y - 0.2, 0.16], C.post);
    // La vergue, en travers, aux trois quarts du mât.
    b.box({ x: g.x, y: top - 1.3, z: g.z }, [1.9, 0.1, 0.1], C.post);
    // La flamme : un long triangle au vent, vers l'est, sous la pomme du mât ; ses deux faces se voient.
    const at = (dx: number, dy: number, dz: number) => [g.x + dx, top + dy, g.z + dz] as const;
    for (const dz of [-0.02, 0.02]) {
      const [a, c, d] = [at(0.08, -0.15, dz), at(0.08, -0.85, dz), at(1.7, -0.45, dz)];
      if (dz > 0) b.triangle(a, c, d, C.knob);
      else b.triangle(a, d, c, C.knob);
    }
    b.box({ x: g.x, y: top, z: g.z }, [0.24, 0.16, 0.24], C.paint);
    // Deux haubans, de la tête du mât à deux piquets plantés à l'est et à l'ouest.
    for (const dx of [-1, 1]) {
      const foot = quaiGround(g.x + 1.4 * dx, g.z);
      b.beam({ x: g.x, y: top - 0.2, z: g.z }, { x: foot.x, y: foot.y + 0.2, z: foot.z }, 0.04, C.rope);
      b.box({ x: foot.x, y: foot.y - 0.2, z: foot.z }, [0.12, 0.45, 0.12], C.post);
    }
  },
};

/**
 * Où se pose la trace de chaque mission des Filets (hors du Troupeau, le filet raccommodé et le panier plein), depuis le
 * centre du lieu, dans le champ du retour d'une scénette (Kéo devant le séchoir, au sud) : le vivier dans l'eau, à un
 * pas du bord (ses pieds immergés, l'eau dedans ; relecture de L4), au sud-est du séchoir ; la pyramide de nasses contre le pan sud du séchoir, côté sable (le pan nord porte le filet
 * raccommodé) ; le carrelet sur le replat de l'eau, à l'est du séchoir, son bras vers le large.
 */
export const FILETS_TRACE_SPOTS = {
  'word-classes': { x: 6.6, z: 2.6 },
  sorting: { x: 2.04, z: 2.71 },
  'e-er-ez': { x: 4.0, z: 0.9 },
} as const;

/** Le vivier de l'Enclos : neuf pieux en cercle, de ce rayon, leur tête au-dessus de l'eau. */
export const FILETS_VIVIER = { stakes: 9, radius: 0.85, top: 0.55 } as const;

/** Le carrelet de la Récolte : son plancher sur pilotis, au-dessus de l'eau, et le bout de son bras, la trace la plus haute du lieu. */
export const FILETS_CARRELET = { deck: 1.25, tip: 3.4, reach: 3.3, frame: 0.9 } as const;

/** Le sol, ou le fond sous l'eau, en (x, z) : les pieux et les pilotis y plantent leur pied. */
const bedAt = (x: number, z: number): number => Math.min(heightAt({ x, z }), 0) - 0.1;

/**
 * Les traces des Filets (GD-20, point 8, lot L4 : une par mission, au même lieu, en volumes du code aux couleurs du lieu,
 * bois clair et sombre, cordes, paille ; sans rouge ni texte, rien qui se compte ou se lise comme une réponse ; posées
 * avec les abords) :
 * - Enclos : un vivier de neuf pieux en cercle dans l'eau du bord, un filet tendu de l'un à l'autre ;
 * - Tri des graines : une pyramide de nasses d'osier (cônes couchés, trois, deux, une) contre le séchoir ;
 * - Récolte : un carrelet, plancher sur pilotis, long bras levé vers le large et filet carré pendu au-dessus de l'eau,
 *   la trace la plus haute du lieu.
 * Le Troupeau garde la sienne : le filet raccommodé sur le séchoir et le panier plein.
 */
const FILETS_TRACES: Record<string, (b: FacetBuilder, cx: number, cz: number) => void> = {
  'word-classes': (b, x, z) => {
    const o = FILETS_TRACE_SPOTS['word-classes'];
    const { stakes, radius, top } = FILETS_VIVIER;
    const at = (k: number) => {
      const a = (2 * Math.PI * k) / stakes;
      return { x: x + o.x + radius * Math.cos(a), z: z + o.z + radius * Math.sin(a) };
    };
    for (let k = 0; k < stakes; k++) {
      const p = at(k);
      const q = at(k + 1);
      const bed = bedAt(p.x, p.z);
      b.box({ x: p.x, y: bed, z: p.z }, [0.13, top - bed, 0.13], C.deckSide, C.deck);
      // Le filet, de pieu en pieu, de sous l'eau à mi-hauteur des pieux : une nappe sans épaisseur, vue des deux côtés
      // (quatre triangles au lieu des dix d'un pavé : ce qu'ils gagnent paie les anneaux des nasses).
      const lo = -0.15,
        hi = 0.35;
      const a0 = [p.x, lo, p.z] as const,
        a1 = [q.x, lo, q.z] as const,
        b1 = [q.x, hi, q.z] as const,
        b0 = [p.x, hi, p.z] as const;
      b.quad(a0, a1, b1, b0, C.netLine);
      b.quad(a1, a0, b0, b1, C.netLine);
    }
  },
  sorting: (b, x, z) => {
    const o = FILETS_TRACE_SPOTS.sorting;
    const g = quaiGround(x + o.x, z + o.z);
    // Le long du séchoir (`u`, dans le monde : le séchoir est tourné avec le lieu), et du pan sud vers le sable (`axis`).
    const p = placeById('filets');
    const rack = filetsRack();
    const rackYaw = p.yaw + rack.yaw;
    const u = { x: Math.cos(rackYaw), z: -Math.sin(rackYaw) };
    const pan = rack.pans[1];
    const c = Math.cos(p.yaw),
      sn = Math.sin(p.yaw);
    const away = { x: g.x - (x + pan.x * c + pan.z * sn), z: g.z - (z - pan.x * sn + pan.z * c) };
    const side = away.x * -u.z + away.z * u.x > 0 ? 1 : -1;
    const axis = { x: -u.z * side, z: u.x * side };
    const r = 0.24,
      len = 0.8;
    const yaw = Math.atan2(axis.x, axis.z);
    // Trois, deux, une : chaque cône couché, sa bouche vers le sable, sa pointe contre le pan du séchoir.
    for (const [row, count] of [
      [0, 3],
      [1, 2],
      [2, 1],
    ] as const)
      for (let i = 0; i < count; i++) {
        const along = (i - (count - 1) / 2) * 2 * r;
        const mouth = { x: g.x + u.x * along + axis.x * (len / 2), y: g.y + r + row * 1.7 * r, z: g.z + u.z * along + axis.z * (len / 2) };
        // Le cône, de la bouche vers le séchoir ; à la bouche, un anneau d'osier clair (relecture de L4 : la nasse ne se
        // lit plus comme un tronc), et le dedans sombre, un cône bas posé sur lui.
        b.prism({ ...mouth, yaw: yaw + Math.PI, pitch: Math.PI / 2 }, r, 0.06, len, 8, C.newRope, C.deck);
        b.prism({ ...mouth, yaw, pitch: Math.PI / 2 }, r + 0.03, r + 0.03, 0.04, 8, C.canvas);
        b.prism({ x: mouth.x + axis.x * 0.04, y: mouth.y, z: mouth.z + axis.z * 0.04, yaw, pitch: Math.PI / 2 }, r - 0.07, 0, 0.03, 8, C.deckSide);
      }
  },
  'e-er-ez': (b, x, z) => {
    const o = FILETS_TRACE_SPOTS['e-er-ez'];
    const g = { x: x + o.x, z: z + o.z };
    const { deck, tip: tipY, reach, frame } = FILETS_CARRELET;
    // Le bras vers le large, au nord-est.
    const d = { x: 0.55, z: -0.835 };
    const q = { x: -d.z, z: d.x };
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      const px = g.x + sx * 0.55,
        pz = g.z + sz * 0.55;
      const bed = bedAt(px, pz);
      b.box({ x: px, y: bed, z: pz }, [0.14, deck - bed, 0.14], C.deckSide);
    }
    b.box({ x: g.x, y: deck, z: g.z }, [1.4, 0.12, 1.4], C.deckSide, C.deck);
    // Le poteau du pivot, et le bras qui passe dessus : son contrepoids au bout du plancher, sa pointe au-dessus de l'eau.
    const pivot = { x: g.x + d.x * 0.5, z: g.z + d.z * 0.5 };
    b.box({ x: pivot.x, y: deck + 0.12, z: pivot.z }, [0.16, 1.1, 0.16], C.deckSide);
    const back = { x: g.x - d.x * 0.6, y: deck + 0.85, z: g.z - d.z * 0.6 };
    const tip = { x: g.x + d.x * reach, y: tipY, z: g.z + d.z * reach };
    b.beam(back, tip, 0.12, C.deck);
    b.box({ x: back.x, y: back.y - 0.45, z: back.z }, [0.32, 0.36, 0.32], C.deckSide);
    // Le filet carré pendu au bout du bras, à un pas au-dessus de l'eau : quatre cordes, son cadre, ses deux arceaux
    // croisés et la nappe.
    const y = 0.55;
    const corner = (a: number, c: number) => ({ x: tip.x + (a * d.x + c * q.x) * frame, y, z: tip.z + (a * d.z + c * q.z) * frame });
    const corners = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
    for (const [k, c] of corners.entries()) {
      b.beam(tip, c, 0.03, C.netLine);
      b.beam(c, corners[(k + 1) % 4], 0.06, C.deck);
    }
    b.beam({ ...corners[0], y: y + 0.05 }, { ...corners[2], y: y + 0.05 }, 0.05, C.deckSide);
    b.beam({ ...corners[1], y: y + 0.05 }, { ...corners[3], y: y + 0.05 }, 0.05, C.deckSide);
    b.box({ x: tip.x, y: y - 0.12, z: tip.z, yaw: Math.atan2(-d.z, d.x) }, [2 * frame, 0.02, 2 * frame], C.netLine);
  },
};

/** Un point du quai, depuis le centre des Quais (`x`, `z`), au sol. */
const quaiGround = (x: number, z: number): Vec3 => ({ x, y: groundAt({ x, z }), z });

/**
 * Où se pose la trace de chaque mission des Quais, depuis le centre du lieu (sur le terre-plein entre le hangar et le
 * bassin, au sud, dans le champ du retour d'une scénette ; l'eau du bassin pour la barque du passeur ; le bout nord du
 * ponton, au plus près du crochet de la grue, pour la palette de dix).
 */
export const QUAIS_TRACE_SPOTS = {
  'times-tables': { x: 5.6, z: 8.4 },
  'make-ten': { x: -5.4, z: -0.45 },
  'word-problems': { x: 6.6, z: 13.6 },
  measures: { x: 8.9, z: 9.6 },
} as const;

/** Le crochet de la grue des Quais (places.ts) : sa place depuis le centre du lieu et le bas de sa moufle, au-dessus du pied du lieu. */
const QUAIS_HOOK = { x: -5.6, z: -3.5, y: 3 } as const;
/** Le dessus du ponton des Quais (places.ts), au-dessus du pied du lieu. */
const QUAIS_DECK_TOP = 0.6;

/** Une caisse simple, posée en `at` (son pied), de côté `s` : le bois des caisses, son dessus plus clair. */
const plainCrate = (b: FacetBuilder, at: Vec3, s: number) => b.box(at, [s, s * 0.85, s * 0.85], C.crate, C.crateTop);

/**
 * Les traces des Quais (GD-20, point 8, lot L1 : une par mission, au même quai, dans les mêmes volumes ; revues sur les
 * avis du directeur artistique et du consultant Archipéo) :
 * - Doubles et moitiés : la grue remontée (sa cabine, sa contre-flèche et son contrepoids) et la barque chargée,
 *   amarrée au bord de quai, sa lanterne de proue allumée ;
 * - Champ des tables : un rayonnage de bois à trois niveaux, ses caisses alignées en rangées ;
 * - Pont de dix : la palette de dix au bout du ponton, au plus près du crochet de la grue, élinguée (quatre brins
 *   réunis à un anneau, l'amarre tendue vers le crochet), prête à lever ;
 * - Carnet du passeur : la petite barque du passeur, vide, amarrée dans le bassin, sa passerelle à garde-corps posée sur
 *   le bord de quai (le passeur est un rôle, sans personnage) ;
 * - Mesures et figures : la balance du quai, son socle de bois sombre, son fléau et ses deux plateaux, à égalité.
 * Rien à lire n'est peint ; les caisses ne se comptent pas (aucune ne dit la réponse d'une mission). Les bois sombres
 * des montants, des socles et des palettes détachent chaque trace du terre-plein clair.
 */
const QUAIS_TRACES: Record<string, (b: FacetBuilder, cx: number, cz: number) => void> = {
  'doubles-halves': (b, x, z) => {
    const y0 = groundAt({ x, z });
    // La grue remontée : sa cabine autour du mât, et sa contre-flèche (le prolongement de la flèche derrière le mât),
    // son contrepoids pendu dessous, contre elle : rien ne flotte (directeur artistique).
    const mast = { x: x - 2.6, z: z - 1.6 };
    b.box({ x: mast.x, y: y0 + 4.6, z: mast.z }, [1, 1, 1], C.paint, C.newWood);
    // L'axe de la flèche (places.ts, les Quais) : du mât vers le ponton, au nord-ouest ; la contre-flèche à l'opposé.
    const a = Math.atan2(1, 1.6);
    const back = { x: Math.cos(a), z: Math.sin(a) };
    b.box({ x: mast.x + back.x * 0.85, y: y0 + 6.3, z: mast.z + back.z * 0.85, yaw: -a }, [1.9, 0.4, 0.4], C.newWood);
    b.box({ x: mast.x + back.x * 1.45, y: y0 + 5.45, z: mast.z + back.z * 1.45, yaw: -a }, [0.75, 0.85, 0.75], C.paint);
    // La barque chargée amarrée au bord de quai, sa lanterne de proue allumée : ce que la réussite de la scénette a
    // laissé (directeur artistique), vu ensuite depuis le monde ouvert.
    const boat = quayBoat(LOADED_BOAT);
    barque(b, boat.at, boat.length, boat.width);
    crates(b, 10, boat.cargo.x, boat.cargo.y, boat.cargo.z);
    answerCrate(b, boat.hold, LOADED_BOAT_CRATE);
    b.append(quaySuccess(LOADED_BOAT, LOADED_BOAT_CRATE).glass);
  },
  'times-tables': (b, x, z) => {
    const o = QUAIS_TRACE_SPOTS['times-tables'];
    const g = quaiGround(x + o.x, z + o.z);
    const w = 2.3, d = 0.8, levels = [0.12, 0.86, 1.6];
    // Les quatre montants, puis les trois planches, chacune portant sa rangée de trois caisses.
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box({ x: g.x + sx * (w / 2 - 0.06), y: g.y, z: g.z + sz * (d / 2 - 0.06) }, [0.12, 2.25, 0.12], C.post);
    for (const ly of levels) {
      b.box({ x: g.x, y: g.y + ly - 0.08, z: g.z }, [w, 0.08, d], C.post, C.newWood);
      for (const dx of [-0.7, 0, 0.7]) plainCrate(b, { x: g.x + dx, y: g.y + ly, z: g.z }, 0.52);
    }
  },
  'make-ten': (b, x, z) => {
    const y0 = groundAt({ x, z });
    const o = QUAIS_TRACE_SPOTS['make-ten'];
    const deck = y0 + QUAIS_DECK_TOP;
    // La palette de dix, deux rangées de cinq, sur le bout du ponton.
    crates(b, 10, x + o.x - 2 * CRATE_PITCH, deck, z + o.z - CRATE_PITCH / 2);
    // Les élingues : quatre brins des coins du chargement à l'anneau, au-dessus de son milieu ; l'amarre de l'anneau au
    // crochet de la grue, tendue : la palette est prête à lever.
    const top = deck + 0.06 + CRATE;
    const ring = { x: x + o.x, y: top + 0.9, z: z + o.z };
    const hw = 2.5 * CRATE_PITCH, hd = CRATE_PITCH;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.beam({ x: x + o.x + sx * hw, y: top, z: z + o.z + sz * hd }, ring, 0.05, C.rope);
    b.box({ x: ring.x, y: ring.y - 0.06, z: ring.z }, [0.22, 0.12, 0.22], C.iron);
    b.beam(ring, { x: x + QUAIS_HOOK.x, y: y0 + QUAIS_HOOK.y, z: z + QUAIS_HOOK.z }, 0.06, C.rope);
  },
  'word-problems': (b, x, z) => {
    const o = QUAIS_TRACE_SPOTS['word-problems'];
    const at = { x: x + o.x, y: 0, z: z + o.z };
    // Plus petite que la barque chargée, vide : sa silhouette la distingue, pas sa couleur.
    barque(b, at, 2.4, 1.0);
    // La passerelle : une planche large du bord de quai au plat-bord, et ses deux garde-corps ; les deux taquets.
    const edge = DOCK_EDGE.from.z;
    const deck = groundAt({ x: at.x, z: edge - 0.6 });
    const from = { x: at.x - 0.2, y: deck + 0.05, z: edge - 0.5 };
    const to = { x: at.x - 0.2, y: 0.2, z: at.z - 0.2 };
    b.beam(from, to, 0.7, C.newWood);
    for (const side of [-1, 1]) b.beam({ x: from.x + side * 0.33, y: from.y + 0.55, z: from.z }, { x: to.x + side * 0.33, y: to.y + 0.55, z: to.z }, 0.06, C.post);
    for (const dx of [-1.0, 0.6]) b.box({ x: at.x + dx, y: deck, z: edge - 0.35 }, [0.2, 0.25, 0.2], C.post);
  },
  measures: (b, x, z) => {
    const o = QUAIS_TRACE_SPOTS.measures;
    const g = quaiGround(x + o.x, z + o.z);
    // La balance du quai : son socle de bois sombre, son pied, son fléau en travers, et ses deux plateaux pendus, à
    // égalité ; une caisse à côté, attendant sa pesée.
    b.box({ x: g.x, y: g.y, z: g.z }, [1.4, 0.2, 1.1], C.post, C.lever);
    b.box({ x: g.x, y: g.y + 0.2, z: g.z - 0.35 }, [0.16, 1.5, 0.16], C.post);
    b.box({ x: g.x, y: g.y + 1.7, z: g.z - 0.35 }, [1.5, 0.1, 0.12], C.paint);
    for (const side of [-1, 1]) {
      b.box({ x: g.x + side * 0.7, y: g.y + 1.12, z: g.z - 0.35 }, [0.03, 0.58, 0.03], C.rope);
      b.prism({ x: g.x + side * 0.7, y: g.y + 1.06, z: g.z - 0.35 }, 0.26, 0.2, 0.06, 8, C.bucket);
    }
    answerCrate(b, { x: g.x + 0.25, y: g.y + 0.2, z: g.z + 0.15 }, 0.6);
  },
};

/**
 * Où se pose la trace de chaque mission des Écluses (hors des Nénuphars, la porte d'amont ouverte), depuis le centre du
 * lieu : la barque dans le bassin d'aval, la table devant la maison de l'éclusier (au sud du quai du lavoir, sans le
 * toucher : world/continu/amenagements.ts), l'escalier contre le mur est du bassin d'aval, la lanterne du sas sur le coin
 * sud-ouest de ce bassin ; tous dans le champ du retour d'une scénette, au sud.
 */
export const ECLUSES_TRACE_SPOTS = {
  equivalence: { x: 0, z: 3 },
  sharing: { x: 4.1, z: 6.3 },
  'place-value': { x: 2.75, z: 2.6 },
  'fraction-sums': { x: -2.05, z: 4.35 },
} as const;

/** Le haut des murs des bassins des Écluses (places.ts), au-dessus du pied du lieu : le bassin du milieu, celui d'aval. */
const ECLUSES_TOPS = { middle: 0.9, low: 0.2 } as const;

/**
 * Les traces des Écluses (GD-20, point 8, lot L2 : une par mission, au même lieu, dans les mêmes volumes, chacune lisible
 * par sa silhouette, sans figure ni texte, rien qui se compte ou se lise comme une réponse) :
 * - Deux rives : une barque amarrée dans le bassin d'aval, à flot, son amarre à une bitte du mur ;
 * - Partage du gâteau : la table de l'éclusier et ses deux bancs, devant sa maison, rien dessus ;
 * - Galets en colonnes : l'escalier de pierre contre le mur est du bassin d'aval, du quai du sas au bord de l'eau, sa
 *   main courante de bois ;
 * - Calculer avec des fractions : la lanterne du sas, un poteau de bois sur le coin du bassin d'aval, sa lanterne allumée.
 * Les Nénuphars gardent la leur : la porte d'amont ouverte et le sas rempli (`lockGate`).
 */
const ECLUSES_TRACES: Record<string, (b: FacetBuilder, cx: number, y0: number, cz: number) => void> = {
  equivalence: (b, x, y0, z) => {
    const o = ECLUSES_TRACE_SPOTS.equivalence;
    const at = { x: x + o.x - 0.2, y: y0 + ECLUSES_TOPS.low + 0.12, z: z + o.z };
    barque(b, at, 1.7, 0.95);
    // La bitte sur le mur ouest, et l'amarre jusqu'à la poupe.
    const bollard = { x: x - 2.0, y: y0 + ECLUSES_TOPS.low, z: at.z - 0.3 };
    b.prism(bollard, 0.13, 0.11, 0.3, 8, C.iron);
    b.beam({ x: bollard.x, y: bollard.y + 0.22, z: bollard.z }, { x: at.x - 0.85, y: at.y + 0.05, z: at.z - 0.1 }, 0.05, C.rope);
  },
  sharing: (b, x, _y0, z) => {
    const o = ECLUSES_TRACE_SPOTS.sharing;
    const g = { x: x + o.x, y: groundAt({ x: x + o.x, z: z + o.z }), z: z + o.z };
    const low = g.y - 0.5;
    // La table : son plateau clair sur quatre pieds sombres, assez hauts pour descendre dans la pente (jamais en l'air) ;
    // deux bancs.
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box({ x: g.x + sx * 0.6, y: low, z: g.z + sz * 0.3 }, [0.1, 1.25, 0.1], C.post);
    b.box({ x: g.x, y: g.y + 0.75, z: g.z }, [1.5, 0.1, 0.85], C.post, C.newWood);
    for (const sz of [-1, 1]) {
      for (const sx of [-1, 1]) b.box({ x: g.x + sx * 0.55, y: low, z: g.z + sz * 0.75 }, [0.08, 0.92, 0.08], C.post);
      b.box({ x: g.x, y: g.y + 0.42, z: g.z + sz * 0.75 }, [1.4, 0.08, 0.3], C.post, C.newWood);
    }
  },
  'place-value': (b, x, y0, z) => {
    const o = ECLUSES_TRACE_SPOTS['place-value'];
    // Quatre marches, du haut du mur du sas (au nord) au haut du mur d'aval (au sud), contre le mur est ; leur pierre
    // descend jusqu'au sol ; la main courante de bois, sur deux poteaux.
    const steps = 4;
    const run = 0.55;
    const from = y0 + ECLUSES_TOPS.middle;
    const to = y0 + ECLUSES_TOPS.low;
    const base = Math.min(groundAt({ x: x + o.x, z: z + o.z + 1 }), to) - 0.6;
    const step = (k: number) => ({ top: from - ((from - to) * (k + 1)) / (steps + 1), z: z + o.z - 0.8 + k * run });
    for (let k = 0; k < steps; k++) b.box({ x: x + o.x, y: base, z: step(k).z }, [0.9, step(k).top - base, run], C.stoneDark, C.stone);
    const rail = (k: number) => ({ x: x + o.x + 0.5, y: step(k).top + 0.75, z: step(k).z });
    for (const k of [0, steps - 1]) b.box({ x: rail(k).x, y: rail(k).y - 0.75, z: rail(k).z }, [0.08, 0.78, 0.08], C.post);
    b.beam(rail(0), rail(steps - 1), 0.08, C.newWood);
  },
  'fraction-sums': (b, x, y0, z) => {
    const o = ECLUSES_TRACE_SPOTS['fraction-sums'];
    const at = { x: x + o.x, y: y0 + ECLUSES_TOPS.low, z: z + o.z };
    // La lanterne du sas : un socle de pierre sur le coin du mur, un poteau, un bras, et la lanterne pendue, sa vitre allumée.
    b.box(at, [0.45, 0.25, 0.45], C.stoneDark, C.stone);
    b.box({ x: at.x, y: at.y + 0.25, z: at.z }, [0.16, 2.7, 0.16], C.post);
    b.box({ x: at.x + 0.35, y: at.y + 2.85, z: at.z }, [0.85, 0.12, 0.12], C.post);
    const lamp = { x: at.x + 0.65, y: at.y + 2.15, z: at.z };
    b.box({ x: lamp.x, y: lamp.y + 0.52, z: lamp.z }, [0.05, 0.18, 0.05], C.iron);
    b.box({ x: lamp.x, y: lamp.y - 0.06, z: lamp.z }, [0.4, 0.07, 0.4], C.stoneDark);
    b.box({ x: lamp.x, y: lamp.y, z: lamp.z }, [0.32, 0.4, 0.32], C.lamp);
    b.box({ x: lamp.x, y: lamp.y + 0.4, z: lamp.z }, [0.46, 0.1, 0.46], C.stoneDark);
  },
};

/**
 * Où se pose la trace de chaque mission des Marais salants, depuis le centre du lieu (lot L5), autour de la grille des
 * bassins et du hangar à sel, sur la grève plate, hors des chemins (celui du réseau contourne les bassins par l'ouest
 * et arrive au sud ; celui des abords monte de la porte à la passerelle) : la brouette au sud-est des bassins, les
 * râteaux contre la façade sud du hangar, à l'est de sa porte (vus du sud, relecture du directeur artistique), la pompe
 * à vent au bord du large, au nord-est des bassins, le stock de sacs et les mulons au sud-ouest.
 */
export const SALTWORKS_TRACE_SPOTS = {
  ordering: { x: 3.1, z: 5.0 },
  operations: { x: 2.25, z: -2.45 },
  scale: { x: 5.9, z: -2.4 },
  'large-numbers': { x: -6.3, z: 2.6 },
  'rounding-products': { x: -5.8, z: 5.4 },
} as const;

/**
 * La pompe à vent de la Pente graduée, la trace la plus haute du lieu : la hauteur de son moyeu au-dessus du sol, la
 * longueur de ses ailes, et leur couleur, que seules elles portent dans le monde (la vue les fait tourner autour du
 * moyeu, dans le matériau des lieux, sans appel de plus ; à l'arrêt avec « Réduire les animations »).
 */
export const SALT_PUMP = { hub: 4.9, blade: 1.25, vane: 0xd4a670 } as const;

/** Le moyeu de la pompe à vent des Marais salants, dans le monde : ses ailes tournent autour de lui, face au sud. */
export function saltPumpHub(): Vec3 {
  const c = placeById('saltworks').center;
  const o = SALTWORKS_TRACE_SPOTS.scale;
  const g = { x: c.x + o.x, z: c.z + o.z };
  return { x: g.x, y: groundAt(g) + SALT_PUMP.hub, z: g.z + 0.42 };
}

/**
 * Les traces des Marais salants (GD-20, point 8, lot L5 : une par mission, aux couleurs du lieu, bois, toile, sel en deux
 * ou trois valeurs ; sans texte, rien qui se compte ou se lise comme une réponse ; posées avec le hangar à sel) :
 * - Cratère des rangs : une brouette à sel, un seul tas dedans ;
 * - Coulée de lave : les râteaux à sel sur leur râtelier, contre le pignon du hangar ;
 * - Pente graduée : la pompe à vent de bois rustique, la plus haute du lieu, ses ailes face au sud ;
 * - Nombres géants : un stock de sacs sous une toile ;
 * - Arrondis et produits : deux mulons arrondis sur une natte.
 */
const SALTWORKS_TRACES: Record<string, (b: FacetBuilder, cx: number, cz: number) => void> = {
  ordering: (b, x, z) => {
    const o = SALTWORKS_TRACE_SPOTS.ordering;
    const g = quaiGround(x + o.x, z + o.z);
    // La caisse de bois, sa roue à l'avant (vers l'est), ses deux bras et ses pieds à l'arrière ; le tas de sel dedans.
    b.box({ x: g.x, y: g.y + 0.35, z: g.z }, [1.1, 0.32, 0.75], C.post, C.lever);
    b.drum({ x: g.x + 0.62, y: g.y + 0.25, z: g.z - 0.05, yaw: 0, pitch: Math.PI / 2 }, 0.25, 0.1, 8, C.post, C.lever);
    for (const side of [-1, 1]) {
      b.beam({ x: g.x + 0.55, y: g.y + 0.4, z: g.z + side * 0.3 }, { x: g.x - 1.05, y: g.y + 0.62, z: g.z + side * 0.3 }, 0.07, C.lever);
      b.box({ x: g.x - 0.4, y: g.y, z: g.z + side * 0.3 }, [0.08, 0.36, 0.08], C.lever);
    }
    b.prism({ x: g.x, y: g.y + 0.62, z: g.z, yaw: 0.2 }, 0.45, 0.16, 0.36, 8, C.salt, C.saltShade);
  },
  operations: (b, x, z) => {
    const o = SALTWORKS_TRACE_SPOTS.operations;
    const g = quaiGround(x + o.x, z + o.z);
    // Le râtelier, contre la façade sud du hangar, à l'est de sa porte (d'est en ouest) : deux poteaux et sa barre ;
    // trois râteaux à sel, leur long manche appuyé sur la barre, leur large tête de bois debout au sol, face au sud
    // (relecture du lot L5, directeur artistique : plus gros, lisibles du sud).
    for (const dx of [-0.8, 0.8]) b.box({ x: g.x + dx, y: g.y - 0.2, z: g.z }, [0.14, 1.6, 0.14], C.post);
    b.box({ x: g.x, y: g.y + 1.25, z: g.z }, [1.85, 0.12, 0.12], C.post);
    for (const dx of [-0.52, 0, 0.52]) {
      const foot = { x: g.x + dx, y: g.y + 0.2, z: g.z + 0.85 };
      b.beam(foot, { x: g.x + dx, y: g.y + 1.65, z: g.z - 0.08 }, 0.1, C.newWood);
      b.box({ x: foot.x, y: g.y - 0.05, z: foot.z + 0.04 }, [0.46, 0.26, 0.09], C.lever, C.post);
    }
  },
  scale: (b, x, z) => {
    const o = SALTWORKS_TRACE_SPOTS.scale;
    const g = quaiGround(x + o.x, z + o.z);
    const hub = SALT_PUMP.hub;
    // Le chevalet : quatre jambes de bois qui se resserrent vers le haut, deux traverses ; la caisse du mécanisme, la
    // queue qui la tient face au vent (au nord) ; le tuyau qui descend vers les bassins.
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) b.beam({ x: g.x + sx * 0.75, y: g.y - 0.2, z: g.z + sz * 0.75 }, { x: g.x + sx * 0.18, y: g.y + hub - 0.3, z: g.z + sz * 0.18 }, 0.12, C.post);
    for (const y of [1.3, 2.9]) {
      const k = 0.75 - (0.57 * (y + 0.2)) / (hub + 0.1);
      b.box({ x: g.x, y: g.y + y, z: g.z + k }, [2 * k + 0.1, 0.08, 0.08], C.post);
      b.box({ x: g.x, y: g.y + y, z: g.z - k }, [2 * k + 0.1, 0.08, 0.08], C.post);
    }
    b.box({ x: g.x, y: g.y + hub - 0.35, z: g.z }, [0.46, 0.5, 0.6], C.lever, C.post);
    b.beam({ x: g.x, y: g.y + hub - 0.1, z: g.z - 0.3 }, { x: g.x, y: g.y + hub - 0.1, z: g.z - 1.4 }, 0.07, C.post);
    b.box({ x: g.x, y: g.y + hub - 0.55, z: g.z - 1.45 }, [0.05, 0.8, 0.7], C.newWood);
    b.box({ x: g.x - 0.2, y: g.y - 0.1, z: g.z + 0.2 }, [0.14, hub - 0.4, 0.14], C.iron);
    // Le moyeu, puis les quatre ailes de planches, à plat face au sud, des deux côtés (la vue les fait tourner).
    const h = saltPumpHub();
    b.box({ x: h.x, y: h.y - 0.12, z: h.z - 0.08 }, [0.24, 0.24, 0.2], C.iron);
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2 + 0.35;
      const u = { x: Math.cos(a), y: Math.sin(a) };
      const v = { x: -u.y, y: u.x };
      const at = (r: number, w: number) => [h.x + u.x * r + v.x * w, h.y + u.y * r + v.y * w, h.z + 0.04] as const;
      const [p0, p1, p2, p3] = [at(0.12, -0.05), at(SALT_PUMP.blade, -0.05), at(SALT_PUMP.blade, 0.32), at(0.3, 0.14)];
      b.quad(p0, p1, p2, p3, SALT_PUMP.vane);
      b.quad(p3, p2, p1, p0, SALT_PUMP.vane);
    }
  },
  'large-numbers': (b, x, z) => {
    const o = SALTWORKS_TRACE_SPOTS['large-numbers'];
    const g = quaiGround(x + o.x, z + o.z);
    // Les sacs sur une palette : au premier rang, trois sacs de sel debout, entiers, leur bouche froncée au-dessus ;
    // derrière, la pile couverte d'une toile claire jetée en deux pans, l'un sur le dessus, l'autre qui retombe derrière
    // (relecture du lot L5, directeur artistique : on y voit des sacs, pas une caisse).
    b.box({ x: g.x, y: g.y - 0.1, z: g.z }, [1.9, 0.22, 1.3], C.post, C.lever);
    for (const dx of [-0.55, 0, 0.55]) saltSack(b, { x: g.x + dx, y: g.y + 0.12, z: g.z + 0.32 }, 0.6);
    b.box({ x: g.x, y: g.y + 0.12, z: g.z - 0.3 }, [1.7, 0.62, 0.6], C.sackShade, C.sack);
    const ridge = { y: g.y + 0.86, z: g.z + 0.02 },
      fold = { y: g.y + 0.78, z: g.z - 0.72 },
      hem = { y: g.y + 0.05, z: g.z - 0.78 };
    const pan = (a: { y: number; z: number }, c: { y: number; z: number }, color: number) => {
      const p: [number, number, number][] = [
        [g.x - 0.95, a.y, a.z],
        [g.x + 0.95, a.y, a.z],
        [g.x + 0.95, c.y, c.z],
        [g.x - 0.95, c.y, c.z],
      ];
      b.quad(p[0], p[1], p[2], p[3], color);
      b.quad(p[3], p[2], p[1], p[0], color);
    };
    pan(ridge, fold, C.canvas);
    pan(fold, hem, C.canvasShade);
  },
  'rounding-products': (b, x, z) => {
    const o = SALTWORKS_TRACE_SPOTS['rounding-products'];
    const g = quaiGround(x + o.x, z + o.z);
    // La natte de paille, et deux tas de sel arrondis, de tailles différentes, l'un un peu derrière l'autre (pas en
    // rangée) : leur base ocre, leur corps clair, leur dôme à l'ombre gris-bleu.
    b.box({ x: g.x, y: g.y - 0.05, z: g.z, yaw: 0.15 }, [2.4, 0.08, 1.6], C.mat);
    for (const [dx, dz, r] of [
      [-0.45, 0.2, 0.62],
      [0.6, -0.25, 0.48],
    ] as const) {
      const p = { x: g.x + dx, y: g.y + 0.03, z: g.z + dz };
      b.prism(p, r, r * 0.95, 0.12, 8, C.saltBase, C.salt);
      b.prism({ ...p, y: p.y + 0.12, yaw: 0.4 }, r * 0.95, r * 0.6, r * 0.45, 8, C.salt, C.saltShade);
      b.prism({ ...p, y: p.y + 0.12 + r * 0.45, yaw: 0.4 }, r * 0.6, 0, r * 0.25, 8, C.saltShade);
    }
  },
};

/**
 * Où se pose la trace de chaque mission de la Turbine, depuis le centre du lieu (lot L6a), autour de la machine, sur le
 * replat, hors des chemins (celui du réseau arrive au sud, celui des abords monte de la porte à la chaudière) et du
 * dallage de la scénette : la citerne au nord-ouest, derrière la source ; le wagonnet au sud-est ; le marteau-pilon au
 * bout de l'arbre, à l'est du carter ; le cadran solaire au sud-ouest.
 */
export const ENGINE_TRACE_SPOTS = {
  'states-of-matter': { x: -3.6, z: -2.55 },
  'motion-signals': { x: 6.1, z: 2.7 },
  'energy-circuits': { x: ENGINE.shaft.to + 0.55, z: ENGINE.rotor.z },
  'materials-light': { x: -5.6, z: 3.6 },
} as const;

/**
 * Les traces de la Turbine (GD-20, point 8, lot L6a : une par mission, aux couleurs du lieu, bois clair, fer, cuivre,
 * brique, pierre ; sans texte, sans graduation, rien qui se compte ou se lise comme une réponse ; aucun objet interdit
 * par le contenu, ni lampe, ni fil, ni cadran à aiguille ; posées avec le haut ; aucune plus haute que le rotor) :
 * - États et mélanges : une citerne de bois cerclée de fer sur son chevalet, la plus haute ;
 * - Mouvements et signaux : un wagonnet immobile sur deux rails courts et droits, de fer sombre, sur leurs traverses de
 *   bois, et son butoir ;
 * - Énergie et circuits : le marteau-pilon au bout de l'arbre, son portique, son marteau levé, son enclume ;
 * - Matériaux, transformations et saisons : un cadran solaire de pierre, son style de cuivre fin, sans ombre peinte ni
 *   graduation.
 */
/** Le style du cadran solaire de la Turbine : sa direction, son pied et son bout le long d'elle, la hauteur de son bout, la section de la tige. */
const GNOMON = { yaw: 0.7, foot: 0.4, head: 0.3, height: 0.4, rod: 0.05 } as const;

const ENGINE_TRACES: Record<string, (b: FacetBuilder, cx: number, cz: number) => void> = {
  'states-of-matter': (b, x, z) => {
    const o = ENGINE_TRACE_SPOTS['states-of-matter'];
    const g = quaiGround(x + o.x, z + o.z);
    // Le chevalet : quatre pieds et deux traverses ; la citerne de douves claires, ses deux cercles de fer, son couvercle.
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box({ x: g.x + sx * 0.55, y: g.y - 0.2, z: g.z + sz * 0.45 }, [0.14, 1.45, 0.14], C.post);
    for (const sz of [-1, 1]) b.box({ x: g.x, y: g.y + 1.1, z: g.z + sz * 0.45 }, [1.3, 0.14, 0.14], C.post);
    const y = g.y + 1.24;
    b.prism({ x: g.x, y, z: g.z }, 0.72, 0.68, 1.5, 10, C.lightWood, C.newWood);
    for (const h of [0.22, 1.12]) b.prism({ x: g.x, y: y + h, z: g.z }, 0.74, 0.735, 0.12, 10, C.engineIron);
    b.prism({ x: g.x, y: y + 1.5, z: g.z }, 0.66, 0.5, 0.14, 10, C.newWood);
  },
  'motion-signals': (b, x, z) => {
    const o = ENGINE_TRACE_SPOTS['motion-signals'];
    const g = quaiGround(x + o.x, z + o.z);
    const length = 3.2;
    // Les traverses de bois, puis les deux rails droits de fer sombre, d'ouest en est ; le butoir au bout est.
    for (let k = 0; k < 4; k++) b.box({ x: g.x - length / 2 + 0.3 + (k * (length - 0.6)) / 3, y: g.y - 0.05, z: g.z }, [0.26, 0.12, 1.15], C.lever);
    for (const side of [-1, 1]) b.box({ x: g.x, y: g.y + 0.07, z: g.z + side * 0.36 }, [length, 0.08, 0.09], C.engineIron);
    b.box({ x: g.x + length / 2 + 0.05, y: g.y - 0.1, z: g.z }, [0.3, 0.68, 1.0], C.post, C.lever);
    // Le wagonnet, à l'arrêt à l'ouest du butoir : sa caisse de bois, ses quatre roues de fer sur les rails.
    const w = { x: g.x + 0.2, y: g.y + 0.15 };
    for (const sx of [-1, 1])
      for (const side of [-1, 1]) b.drum({ x: w.x + sx * 0.38, y: w.y + 0.17, z: g.z + side * 0.36 - 0.06, pitch: Math.PI / 2 }, 0.17, 0.12, 8, C.engineIron);
    b.box({ x: w.x, y: w.y + 0.2, z: g.z }, [1.25, 0.6, 0.86], C.lever, C.post);
  },
  'energy-circuits': (b, x, z) => {
    const o = ENGINE_TRACE_SPOTS['energy-circuits'];
    const g = quaiGround(x + o.x, z + o.z);
    // Le socle de pierre, l'enclume de fer sur son billot ; le portique de bois, sa traverse ; le marteau levé, sur sa
    // tige, à mi-hauteur ; la came au bout de l'arbre.
    b.box({ x: g.x, y: g.y - 0.15, z: g.z }, [1.5, 0.3, 1.5], C.stoneDark, C.stone);
    b.box({ x: g.x, y: g.y + 0.15, z: g.z }, [0.62, 0.38, 0.62], C.lever, C.post);
    b.box({ x: g.x, y: g.y + 0.53, z: g.z }, [0.78, 0.26, 0.44], C.engineIron, C.ironTop);
    for (const sz of [-1, 1]) b.box({ x: g.x, y: g.y + 0.15, z: g.z + sz * 0.62 }, [0.2, 2.3, 0.2], C.lever);
    b.box({ x: g.x, y: g.y + 2.45, z: g.z }, [0.3, 0.24, 1.6], C.lever, C.post);
    b.box({ x: g.x, y: g.y + 1.35, z: g.z }, [0.56, 0.48, 0.5], C.engineIron, C.ironTop);
    b.box({ x: g.x, y: g.y + 1.83, z: g.z }, [0.1, 0.62, 0.1], C.engineIron);
    b.box({ x: g.x - 0.55, y: g.y + ENGINE.shaft.y - 0.3, z: g.z }, [0.3, 0.6, 0.42], C.engineIron, C.ironTop);
  },
  'materials-light': (b, x, z) => {
    const o = ENGINE_TRACE_SPOTS['materials-light'];
    const g = quaiGround(x + o.x, z + o.z);
    // Le fût de pierre, la table ronde, nue (ni ombre peinte, ni graduation, ni chiffre), et le style de cuivre : une tige
    // fine, penchée, et son étai, tournés de biais pour se lire du sud (directeur artistique, relecture de L6a : jamais
    // une plaque pleine, qui se lirait comme le bouton « lecture »).
    b.prism({ x: g.x, y: g.y - 0.2, z: g.z }, 0.42, 0.34, 0.25, 8, C.stoneDark, C.stone);
    b.prism({ x: g.x, y: g.y + 0.05, z: g.z }, 0.24, 0.22, 0.8, 8, C.stone);
    b.prism({ x: g.x, y: g.y + 0.85, z: g.z }, 0.6, 0.6, 0.1, 12, C.stoneDark, C.stone);
    const [ux, uz] = [Math.cos(GNOMON.yaw), -Math.sin(GNOMON.yaw)];
    const at = (u: number, y: number) => ({ x: g.x + u * ux, y: g.y + 0.95 + y, z: g.z + u * uz });
    b.beam(at(-GNOMON.foot, 0), at(GNOMON.head, GNOMON.height), GNOMON.rod, C.copper);
    b.beam(at(GNOMON.head, 0), at(GNOMON.head, GNOMON.height), GNOMON.rod * 0.8, C.copper);
  },
};

/**
 * Où se pose la trace de chaque mission du Chantier naval, depuis le centre du lieu (lot L6b), hors des chemins (celui du
 * réseau arrive à l'est, le long de l'eau ; celui des abords monte de la porte à l'atelier) et du plancher de la
 * scénette : le gouvernail sur ses tréteaux devant l'étrave, entre la coque et le chemin de l'atelier, en vue depuis la
 * porte (relecture de L6b : derrière l'étrave, il se cachait) ; le parc à bois au nord-ouest de la coque ; le
 * capteur de marée au bout du ponton, dans l'eau ; le treuil à la tête de la cale.
 */
export const SHIPYARD_TRACE_SPOTS = {
  'object-function': { x: 2.6, z: 0.9 },
  materials: { x: -5.4, z: -3.3 },
  'information-networks': { x: SHIPYARD.pontoon.x, z: SHIPYARD.pontoon.z1 + 0.72 },
  'solve-program': slipPoint(-1.4),
} as const;

/**
 * Le gouvernail neuf du Chantier naval (trace d'« À quoi ça sert ») : la pale, un trapèze vu de dessus (x d'ouest en
 * est, z du nord au sud), étroite à la tête, à l'ouest, large au talon, son bord droit au nord ; son épaisseur ; sa
 * bascule, le bord nord relevé ; le bout ouest de la mèche ; la longueur de la barre.
 */
const RUDDER = {
  blade: [
    [-1.05, -0.45],
    [1.1, -0.45],
    [1.1, 0.7],
    [-1.05, 0.15],
  ] as readonly (readonly [number, number])[],
  thick: 0.1,
  tilt: 0.4,
  stockEnd: -1.6,
  tiller: 0.95,
} as const;

/** Le puits du capteur de marée : ses rayons, intérieur et extérieur ; son haut au-dessus de l'eau ; le flotteur. */
const TIDE_WELL = { r0: 0.4, r1: 0.62, top: 0.7, float: 0.3, rod: 1.05 } as const;

/**
 * Les traces du Chantier naval (GD-20, point 8, lot L6b : une par mission, aux couleurs du lieu, bois, bordé, pierre ;
 * sans texte, sans graduation, rien qui se compte ou se lise comme une réponse ; aucun objet interdit par le contenu, ni
 * lanterne, ni roue dentée, ni chaîne ; posées avec les abords ; toutes basses, sous le plat-bord de la coque) :
 * - À quoi ça sert : un gouvernail neuf, couché sur ses deux tréteaux ;
 * - Les matériaux : le parc à bois, une pile de planches et des grumes sur leurs cales, sans écriteau ni jeune arbre ;
 * - L'information et les objets : le capteur de marée au bout du ponton, un flotteur dans un puits de pierre, sa tige
 *   dans son guide, immobile, sans lumière, ni graduation, ni drapeau ;
 * - Résoudre et programmer : le treuil à la tête de la cale, son tambour et sa manivelle, son câble jusqu'à l'étrave ;
 *   immobile, sans roue dentée, sans panneau ni case au sol.
 */
const SHIPYARD_TRACES: Record<string, (b: FacetBuilder, cx: number, cz: number) => void> = {
  'object-function': (b, x, z) => {
    const o = SHIPYARD_TRACE_SPOTS['object-function'];
    const g = quaiGround(x + o.x, z + o.z);
    // Les deux tréteaux, en travers de la longueur du gouvernail (d'ouest en est) ; le safran posé dessus, une pale large
    // en trapèze, plus longue que l'écart des tréteaux et plus large qu'eux, terre cuite comme les œuvres vives de la
    // coque, son bord droit relevé vers le nord (sa face vers la porte, d'où on la voit) ; sa mèche le long de ce bord,
    // qui dépasse vers l'ouest ; la barre en travers, au bout de la mèche (relecture de L6b, directeur artistique : couché à
    // plat, couleur du sable, le gouvernail se lisait comme un banc).
    for (const dx of [-0.55, 0.55]) {
      b.box({ x: g.x + dx, y: g.y + 0.62, z: g.z }, [0.14, 0.1, 0.9], C.post, C.lever);
      for (const side of [-1, 1]) b.beam({ x: g.x + dx, y: g.y - 0.05, z: g.z + side * 0.42 }, { x: g.x + dx, y: g.y + 0.62, z: g.z + side * 0.18 }, 0.08, C.post);
    }
    const R = RUDDER;
    const [lift, run] = [Math.sin(R.tilt), Math.cos(R.tilt)];
    // Le dessus de la pale : son bord sud (le plus bas) posé sur les tréteaux.
    const south = Math.max(...R.blade.map((q) => q[1]));
    const y = g.y + 0.72 + south * lift + R.thick * run;
    const on = (px: number, pz: number) => ({ x: g.x + px, y: y - pz * lift, z: g.z + pz * run });
    b.extrude({ x: g.x, y, z: g.z, pitch: Math.PI / 2 + R.tilt }, R.blade, R.thick, C.keel, C.bottom);
    const stock = R.blade[0][1];
    b.beam(on(R.stockEnd, stock), on(R.blade[1][0], stock), 0.12, C.keel);
    b.beam(on(R.stockEnd, stock - 0.06), on(R.stockEnd, stock + R.tiller), 0.09, C.keel);
  },
  materials: (b, x, z) => {
    const o = SHIPYARD_TRACE_SPOTS.materials;
    const g = quaiGround(x + o.x, z + o.z);
    // La pile de planches, au sud : quatre lits sur leurs lattes, en deux tons ; au nord, trois grumes sur deux cales.
    for (const sx of [-0.8, 0.8]) b.box({ x: g.x + sx, y: g.y - 0.1, z: g.z + 0.55 }, [0.16, 0.22, 1], C.keel);
    for (let k = 0; k < 4; k++) b.box({ x: g.x + (k % 2 ? 0.06 : 0), y: g.y + 0.12 + k * 0.2, z: g.z + 0.55 }, [2.3, 0.16, 0.9], k % 2 ? C.plankingShade : C.planking, C.planking);
    for (const sx of [-0.7, 0.7]) b.box({ x: g.x + sx, y: g.y - 0.1, z: g.z - 0.75 }, [0.2, 0.2, 1.2], C.keel);
    for (const [dz, dy] of [
      [-0.4, 0.3],
      [-1.06, 0.3],
      [-0.73, 0.82],
    ] as const)
      b.drum({ x: g.x - 1.25, y: g.y + dy - 0.05, z: g.z + dz, yaw: Math.PI / 2, pitch: Math.PI / 2 }, 0.27, 2.5, 7, C.post, C.plankFace);
  },
  'information-networks': (b, x, z) => {
    const o = SHIPYARD_TRACE_SPOTS['information-networks'];
    const W = TIDE_WELL;
    const at = { x: x + o.x, z: z + o.z };
    // Le puits, dans l'eau, du fond jusqu'au-dessus du ponton ; le flotteur à fleur d'eau, dedans ; sa tige monte dans le
    // guide, une traverse de bois posée sur le bord du puits.
    b.annulus({ x: at.x, y: -1.4, z: at.z }, W.r0, W.r1, W.top + 1.4, 10, C.stoneDark, C.stone);
    b.drum({ x: at.x, y: -0.06, z: at.z }, W.float, 0.16, 8, C.float);
    b.box({ x: at.x, y: 0.1, z: at.z }, [0.07, W.rod, 0.07], C.post);
    b.box({ x: at.x, y: W.top, z: at.z }, [2 * W.r1 + 0.1, 0.12, 0.16], C.post, C.lever);
  },
  'solve-program': (b, x, z) => {
    const o = SHIPYARD_TRACE_SPOTS['solve-program'];
    const g = quaiGround(x + o.x, z + o.z);
    const axis = { x: g.x, y: g.y + 0.62, z: g.z };
    // Le bâti le long de la cale : sa semelle, ses deux joues en travers ; le tambour entre elles, l'axe en travers de la
    // cale, son câble enroulé ; la manivelle de la joue sud-est ; le câble qui va jusqu'au pied de l'étrave.
    b.box({ x: g.x, y: g.y - 0.1, z: g.z, yaw: SLIP_YAW }, [1.5, 0.22, 1.0], C.keel, C.post);
    for (const side of [-1, 1]) b.box({ x: g.x + side * 0.55 * SLIP_N.x, y: g.y + 0.1, z: g.z + side * 0.55 * SLIP_N.z, yaw: SLIP_YAW }, [0.12, 0.82, 0.7], C.post, C.lever);
    const along = (d: number) => ({ x: axis.x + d * SLIP_N.x, y: axis.y, z: axis.z + d * SLIP_N.z });
    b.drum({ ...along(-0.48), yaw: Math.PI / 2 + SLIP_YAW, pitch: Math.PI / 2 }, 0.24, 0.96, 8, C.lever, C.post);
    b.band({ ...along(-0.3), yaw: Math.PI / 2 + SLIP_YAW, pitch: Math.PI / 2 }, 0.27, 0.6, 8, C.cable);
    const crank = along(0.66);
    b.beam(crank, { ...crank, y: crank.y + 0.36 }, 0.07, C.keel);
    b.beam({ ...crank, y: crank.y + 0.36 }, { x: crank.x + 0.24 * SLIP_N.x, y: crank.y + 0.36, z: crank.z + 0.24 * SLIP_N.z }, 0.07, C.keel);
    const c = placeById('shipyard').center;
    const [sx, , sz] = hullPoint(0.02, 0, 0);
    const stem = { x: c.x + sx, y: groundAt(c) + SHIPYARD.hull.keel + 0.9, z: c.z + sz };
    b.beam({ x: axis.x, y: axis.y + 0.27, z: axis.z }, stem, 0.05, C.cable);
  },
};

/**
 * Où se pose la trace de chaque mission de la Mangrove, depuis le centre du lieu (lot L8a), hors des chemins (celui du
 * réseau arrive au sud-est, la passerelle des abords monte de la porte au platelage) et du platelage de la scénette : le
 * pupitre de relevé au coude de la passerelle, sur son palier ; la pépinière sur la vase, à l'ouest du platelage ; la
 * plateforme haute au bord de l'eau, au nord-ouest ; l'affût de roseaux au bord de l'eau, à l'est.
 */
export const MANGROVE_TRACE_SPOTS = {
  'living-groups': { x: MANGROVE.walk.knee.x + 1.25, z: MANGROVE.walk.knee.z - 0.1 },
  'food-growth': { x: -2.7, z: -1.6 },
  'planet-earth': { x: -4.6, z: -6.2 },
  'life-enquiry': { x: 9.6, z: 2.3 },
} as const;

/** Le dessus du platelage et de la passerelle de la Mangrove, dans le monde. */
const mangroveDeckWorld = (): number => groundAt(placeById('mangrove').center) + mangroveDeckTop();

/**
 * Les traces de la Mangrove (GD-20, point 8, lot L8a : une par mission, aux couleurs du lieu, bois des passerelles,
 * roseaux, vert des plants ; posées avec le corps ; sans texte, sans graduation, rien qui se compte ou se lise comme une
 * réponse ; aucun animal, ni fleur ni fruit ; aucune plus haute que le carbet) :
 * - Classer le vivant : un pupitre de relevé incliné, sur un palier au coude de la passerelle, un carnet fermé dessus ;
 * - Se nourrir et grandir : une petite pépinière, quatre jeunes palétuviers en godets sur une claie, tous de la même
 *   taille et du même vert (jamais trois : « trois pots » est un document du contenu) ;
 * - La Terre et ses milieux : une plateforme haute sur pilotis et son échelle de bois, d'où l'on voit plus loin ;
 * - Mener une enquête : un affût de roseaux au bord de l'eau, vide.
 */
const MANGROVE_TRACES: Record<string, (b: FacetBuilder, cx: number, cz: number) => void> = {
  'living-groups': (b, x, z) => {
    const o = MANGROVE_TRACE_SPOTS['living-groups'];
    const g = { x: x + o.x, z: z + o.z };
    const top = mangroveDeckWorld();
    // Le palier, accolé au coude, sur ses deux pieux dans l'eau ; le pupitre, son pied, son plateau penché vers le sud.
    b.box({ x: g.x, y: top - 0.14, z: g.z }, [1.1, 0.14, 1.1], C.walkwayDark, C.walkway);
    for (const dz of [-0.4, 0.4]) b.box({ x: g.x + 0.45, y: -1.2, z: g.z + dz }, [0.14, top - 0.14 + 1.2, 0.14], C.walkwayDark);
    b.box({ x: g.x, y: top, z: g.z }, [0.12, 0.9, 0.12], C.walkwayDark);
    b.box({ x: g.x, y: top + 0.88, z: g.z, pitch: 0.35 }, [0.62, 0.05, 0.46], C.walkwayDark, C.walkway);
    b.box({ x: g.x, y: top + 0.93, z: g.z + 0.02, pitch: 0.35 }, [0.26, 0.04, 0.32], C.notebook);
  },
  'food-growth': (b, x, z) => {
    const o = MANGROVE_TRACE_SPOTS['food-growth'];
    const g = quaiGround(x + o.x, z + o.z);
    // La claie sur ses deux tréteaux ; quatre godets en rang, chacun son jeune plant, tous pareils.
    for (const dx of [-0.6, 0.6]) b.box({ x: g.x + dx, y: g.y - 0.2, z: g.z }, [0.1, 0.72, 0.6], C.walkwayDark);
    const y = g.y + 0.52;
    b.box({ x: g.x, y, z: g.z }, [1.6, 0.06, 0.62], C.walkwayDark, C.walkway);
    for (let k = 0; k < 4; k++) {
      const px = g.x - 0.54 + k * 0.36;
      b.prism({ x: px, y: y + 0.06, z: g.z }, 0.12, 0.14, 0.16, 6, C.pot);
      b.prism({ x: px, y: y + 0.22, z: g.z, yaw: 0.3 }, 0.15, 0, 0.36, 5, C.sapling);
    }
  },
  'planet-earth': (b, x, z) => {
    const o = MANGROVE_TRACE_SPOTS['planet-earth'];
    const g = quaiGround(x + o.x, z + o.z);
    const floor = g.y + 1.9;
    // Quatre pieux, le plancher ; l'échelle de bois au sud, ses deux montants penchés et trois barreaux.
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box({ x: g.x + sx * 0.55, y: g.y - 0.3, z: g.z + sz * 0.55 }, [0.14, floor - g.y + 0.3, 0.14], C.walkwayDark);
    b.box({ x: g.x, y: floor, z: g.z }, [1.35, 0.12, 1.35], C.walkwayDark, C.walkway);
    const foot = g.z + 1.45;
    for (const dx of [-0.25, 0.25]) b.beam({ x: g.x + dx, y: g.y - 0.05, z: foot }, { x: g.x + dx, y: floor + 0.1, z: g.z + 0.68 }, 0.08, C.walkwayDark);
    for (const k of [0.3, 0.55, 0.8]) b.box({ x: g.x, y: g.y + (floor - g.y) * k, z: foot + (g.z + 0.68 - foot) * k }, [0.5, 0.06, 0.06], C.walkway);
  },
  'life-enquiry': (b, x, z) => {
    const o = MANGROVE_TRACE_SPOTS['life-enquiry'];
    const g = quaiGround(x + o.x, z + o.z);
    // L'affût : trois parois de roseaux, ouvert au sud, son toit plat de roseaux un peu penché, des tiges qui dépassent.
    b.box({ x: g.x, y: g.y - 0.2, z: g.z - 0.5 }, [1.3, 1.15, 0.12], C.reedShade, C.reed);
    for (const dx of [-0.6, 0.6]) b.box({ x: g.x + dx, y: g.y - 0.2, z: g.z }, [0.12, 1.05, 1.0], C.reedShade, C.reed);
    b.box({ x: g.x, y: g.y + 0.92, z: g.z - 0.02, pitch: -0.12 }, [1.45, 0.08, 1.15], C.reed, C.reed);
    for (const dx of [-0.45, -0.1, 0.25, 0.5]) b.prism({ x: g.x + dx, y: g.y + 0.95, z: g.z - 0.5 }, 0.05, 0, 0.32, 3, C.reed);
  },
};

/** Les places des traces des Ruines (lot L8b), depuis le centre du lieu. */
export const RUINS_TRACE_SPOTS = {
  'early-humans': { x: RUINS.dig.x, z: RUINS.dig.z },
  'ancient-peoples': { x: 5.2, z: 2.2 },
  'roman-empire': { x: (RUINS.arcade.piles[0] + RUINS.arcade.piles[1]) / 2, z: RUINS.arcade.z },
  viewpoints: { x: -2.9, z: 3.1 },
} as const;

/**
 * La vague de bronze de la stèle des Ruines, la même écriture que sur la clé ornée de l'arcade (relecture DA de L8) :
 * une incrustation sur toute la largeur de la face sud (de `x - half` à `x + half`), le bord du bas droit à `y0`, le
 * bord du haut une seule onde (un creux et une crête, jamais un chevron) autour de `y1` ; jamais un trait fin isolé, qui
 * se lirait comme une lettre.
 */
function bronzeWave(b: FacetBuilder, x: number, y0: number, y1: number, z: number, half: number): void {
  const at = (i: number) => x - half + (2 * half * i) / 6;
  const crest = (i: number) => y1 + 0.06 * Math.sin((2 * Math.PI * i) / 6);
  for (let i = 0; i < 6; i++)
    facing(
      b,
      [
        [at(i), y0, z],
        [at(i + 1), y0, z],
        [at(i + 1), crest(i + 1), z],
        [at(i), crest(i), z],
      ],
      [0, 0, 1],
      C.passeurBronze,
    );
}

/**
 * Les traces des Ruines (GD-20, point 8, lot L8b : une par mission, en pierre des Passeurs, bois et toile ; posées avec
 * les abords ; aucune plus haute que la corniche ; aucun objet historique réel, aucune inscription, aucune date, ni
 * couches de terre dans la fosse) :
 * - Premiers humains, premiers États : une tente de fouille, une toile écrue tendue à plat sur quatre perches, ouverte,
 *   au-dessus de la fouille ;
 * - Grecs, Romains et Hébreux : un tamis sur son chevalet, un petit tas de déblais ;
 * - L'Empire romain : un cintre de bois sous l'arc le plus à l'ouest, celui qui a servi à le remonter ;
 * - Points de vue : une stèle lisse relevée sur son socle, debout, plus haute que large, le seul motif de vagues dessus.
 */
const RUINS_TRACES: Record<string, (b: FacetBuilder, cx: number, cz: number) => void> = {
  'early-humans': (b, x, z) => {
    const o = RUINS_TRACE_SPOTS['early-humans'];
    const g = quaiGround(x + o.x, z + o.z);
    const h = 1.6;
    const r = RUINS.dig.half + 0.2;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box({ x: g.x + sx * r, y: g.y - 0.3, z: g.z + sz * r }, [0.08, h + 0.3, 0.08], C.walkwayDark);
    b.box({ x: g.x, y: g.y + h, z: g.z }, [2 * r + 0.3, 0.04, 2 * r + 0.3], C.tentCanvas);
  },
  'ancient-peoples': (b, x, z) => {
    const o = RUINS_TRACE_SPOTS['ancient-peoples'];
    const g = quaiGround(x + o.x, z + o.z);
    // Le chevalet : deux pieds en A, de part et d'autre ; le tamis, un cercle de bois et son fond de sable, à peine penché.
    for (const dx of [-0.45, 0.45]) for (const dz of [-0.3, 0.3]) b.beam({ x: g.x + dx, y: g.y - 0.1, z: g.z + dz }, { x: g.x + dx, y: g.y + 0.72, z: g.z }, 0.06, C.walkwayDark);
    b.box({ x: g.x, y: g.y + 0.68, z: g.z }, [0.98, 0.05, 0.06], C.walkwayDark);
    b.drum({ x: g.x, y: g.y + 0.74, z: g.z, pitch: 0.12 }, 0.4, 0.1, 10, C.walkway, C.digSand);
    b.prism({ x: g.x + 1.0, y: g.y - 0.05, z: g.z + 0.15 }, 0.42, 0.06, 0.34, 6, C.digSand);
  },
  'roman-empire': (b, x, z) => {
    const o = RUINS_TRACE_SPOTS['roman-empire'];
    const A = RUINS.arcade;
    const g = quaiGround(x + o.x, z + o.z);
    const half = (A.piles[1] - A.piles[0]) / 2 - A.pile / 2 - 0.08;
    const rise = A.rise - 0.06;
    const base = groundAt(placeById('ruins').center);
    const impost = base + A.impost;
    // Deux poteaux contre les piles, une entretoise à l'imposte, puis le cintre qui suit la douelle de l'arc.
    for (const side of [-1, 1]) b.beam({ x: g.x + side * half, y: g.y - 0.1, z: g.z }, { x: g.x + side * half, y: impost, z: g.z }, 0.1, C.lightWood);
    b.beam({ x: g.x - half, y: impost - 0.06, z: g.z }, { x: g.x + half, y: impost - 0.06, z: g.z }, 0.1, C.lightWood);
    const n = 6;
    for (let k = 0; k < n; k++) {
      const [ta, tb] = [Math.PI - (k * Math.PI) / n, Math.PI - ((k + 1) * Math.PI) / n];
      b.beam({ x: g.x + half * Math.cos(ta), y: impost + rise * Math.sin(ta), z: g.z }, { x: g.x + half * Math.cos(tb), y: impost + rise * Math.sin(tb), z: g.z }, 0.1, C.lightWood);
    }
    b.beam({ x: g.x, y: impost - 0.06, z: g.z }, { x: g.x, y: impost + rise, z: g.z }, 0.08, C.lightWood);
  },
  viewpoints: (b, x, z) => {
    const o = RUINS_TRACE_SPOTS.viewpoints;
    const g = quaiGround(x + o.x, z + o.z);
    b.box({ x: g.x, y: g.y - 0.2, z: g.z }, [0.72, 0.4, 0.5], C.passeurShade, C.passeurStone);
    b.box({ x: g.x, y: g.y + 0.2, z: g.z }, [0.44, 1.25, 0.16], C.passeurStone);
    bronzeWave(b, g.x, g.y + 0.92, g.y + 1.1, g.z + 0.085, 0.22);
  },
};

/**
 * La dalle de la scénette de l'Observatoire (lot L8c) monte de tant au-dessus du tertre : un peu au-dessus de la terrasse
 * dallée (places.ts, ses abords), sur laquelle elle se pose quand elle est là.
 */
export const OBSERVATORY_PAVING_RISE = OBSERVATORY.terrace.top + 0.03;

/**
 * La baie de l'Observatoire, l'objet témoin de ses missions (lot L8c) : au milieu du cadre, entre Kéo et la photographe,
 * sur le pan sud du tambour, un pan d'enduit et son encadrement, la vitre pâle et unie (ni paysage, ni ville, ni reflet)
 * et ses deux volets de bois Bleu lagon. Fermés au repos ; après une bonne réponse, ouverts d'un quart de tour sur leurs
 * gonds (perpendiculaires au mur, hors de la vitre), d'un coup en attendant la charnière (la réaction de la vue ne fait
 * que glisser un maillage ; la rotation sur les gonds viendra dans un commit commun, décision du directeur artistique sur
 * L8c-d), et ils restent ouverts jusqu'à l'item suivant, où ils sont refermés d'un coup.
 * Sans éclat ni lumière : la vitre est éclairée comme le mur.
 */
export const OBSERVATORY_BAY = { width: 1.1, height: 1.5, bottom: 0.6, panel: [1.9, 2.7, 0.2], shutter: 0.07 } as const;

function observatoryBay(b: FacetBuilder, spot: Vec3, done: boolean): Reaction | null {
  const W = OBSERVATORY_BAY;
  const o = { ...spot, y: spot.y + OBSERVATORY_PAVING_RISE };
  // Le pan sud du tambour, dans le monde ; le pan d'enduit dépasse un peu devant lui.
  const face = placeById('observatory').center.z + drumFace(OBSERVATORY.drum.r);
  const [pw, ph, pd] = W.panel;
  b.box({ x: o.x, y: o.y - 0.05, z: face + pd / 2 - 0.02 }, [pw, ph + 0.05, pd], C.plaster, C.plasterShade);
  const front = face + pd - 0.02;
  const y0 = o.y + W.bottom;
  b.box({ x: o.x, y: y0, z: front + 0.01 }, [W.width, W.height, 0.04], C.bayGlass);
  // L'appui et le linteau, d'enduit plus sombre.
  b.box({ x: o.x, y: y0 - 0.12, z: front + 0.05 }, [W.width + 0.36, 0.12, 0.14], C.plasterShade);
  b.box({ x: o.x, y: y0 + W.height, z: front + 0.04 }, [W.width + 0.36, 0.16, 0.12], C.plasterShade);
  // Les deux battants, fermés : dans la scène au repos ; après une bonne réponse, dans la réaction, où chacun tourne d'un
  // quart de tour sur son gond, au bord de la baie, vers la caméra, et se tient droit, perpendiculaire au mur (clôture de
  // L8 : environ une demi-seconde, sans rebond ; ouverts d'un coup avec « Réduire les animations »).
  const leaf = (into: FacetBuilder, side: number) =>
    into.box({ x: o.x + side * (W.width / 4 + 0.005), y: y0, z: front + 0.03 + W.shutter / 2 }, [W.width / 2 - 0.01, W.height, W.shutter], C.shutter);
  if (!done) {
    for (const side of [-1, 1]) leaf(b, side);
    return null;
  }
  const r = new FacetBuilder();
  const leaves: Swing['leaves'][number][] = [];
  let first = 0;
  for (const side of [-1, 1]) {
    const one = new FacetBuilder();
    leaf(one, side);
    const f = one.build();
    r.append(f);
    const count = f.positions.length / 3;
    leaves.push({ pivot: { x: o.x + side * (W.width / 2), z: front + 0.03 }, angle: (side * Math.PI) / 2, first, count });
    first += count;
  }
  const zero = { x: 0, y: 0, z: 0 };
  return { facets: r.build(), from: zero, to: zero, arc: 0, stay: true, swing: { seconds: SHUTTER_SECONDS, leaves } };
}

/**
 * Où se pose la trace de chaque mission de l'Observatoire, depuis le centre du lieu (lot L8c), sur la terrasse ou au pied
 * de son escalier, hors des chemins (celui du réseau arrive de l'est, au sud de la terrasse) et du cadre de la scénette
 * (au sud du tambour) : le banc au nord-est, contre le parapet ; le cairn à l'ouest-nord-ouest, au bord de la terrasse ;
 * le palier au pied de l'escalier, à l'ouest-sud-ouest.
 */
export const OBSERVATORY_TRACE_SPOTS = {
  metropolises: { x: 5.0, z: -1.62 },
  'low-density': { x: -5.25, z: -1.71 },
  'inhabited-world': { x: -7.89, z: 2.57 },
} as const;

/** Le cap de chaque trace de l'Observatoire : le banc le long du parapet, le palier dans l'axe de l'escalier. */
const OBSERVATORY_TRACE_YAW = { metropolises: Math.atan2(Math.cos(-0.314), Math.sin(-0.314)), 'inhabited-world': Math.atan2(Math.cos(2.827), Math.sin(2.827)) } as const;

/**
 * Les traces de l'Observatoire (GD-20, point 8, lot L8c : une par mission, de pierre et de bois ; sans texte, sans
 * graduation, sans drapeau ni fanion ; rien qui montre une donnée, ni carte, ni panneau, ni flèche ; posées avec les
 * abords ; aucune plus haute que le tambour) :
 * - Les métropoles : un banc de pierre des Passeurs, sur la terrasse, contre le parapet, ses deux pieds bien visibles ;
 * - Les espaces de faible densité : un cairn, un petit tas de pierres sèches, au bord de la terrasse (rondes et de
 *   biais, jamais en gradins) ;
 * - Littoraux et monde habité : l'escalier de la grève prolongé d'un palier de bois au pied, court, sur ses pieux (ni
 *   bitte, ni bateau : rien d'un port).
 */
const OBSERVATORY_TRACES: Record<string, (b: FacetBuilder, cx: number, cz: number) => void> = {
  metropolises: (b, x, z) => {
    const o = OBSERVATORY_TRACE_SPOTS.metropolises;
    const y = groundAt({ x, z }) + OBSERVATORY.terrace.top;
    const yaw = OBSERVATORY_TRACE_YAW.metropolises;
    const t = { x: Math.cos(yaw), z: -Math.sin(yaw) };
    for (const side of [-1, 1]) b.box({ x: x + o.x + t.x * side * 0.62, y: y - 0.03, z: z + o.z + t.z * side * 0.62, yaw }, [0.22, 0.42, 0.42], C.passeurShade, C.passeurStone);
    b.box({ x: x + o.x, y: y + 0.39, z: z + o.z, yaw }, [1.8, 0.13, 0.52], C.passeurShade, C.passeurStone);
  },
  'low-density': (b, x, z) => {
    const o = OBSERVATORY_TRACE_SPOTS['low-density'];
    let y = groundAt({ x, z }) + OBSERVATORY.terrace.top - 0.03;
    // Quatre pierres sèches, de la plus grosse à la plus petite, posées de biais l'une sur l'autre.
    for (const [dx, dz, r, h, yaw, color] of [
      [0, 0, 0.46, 0.3, 0.2, C.stoneDark],
      [0.05, -0.04, 0.36, 0.28, 0.9, C.stone],
      [-0.04, 0.03, 0.28, 0.24, 0.4, C.stoneDark],
      [0.02, 0, 0.17, 0.2, 1.3, C.stone],
    ] as const) {
      b.prism({ x: x + o.x + dx, y, z: z + o.z + dz, yaw }, r, r * 0.72, h, 6, color, C.stone);
      y += h * 0.92;
    }
  },
  'inhabited-world': (b, x, z) => {
    const o = OBSERVATORY_TRACE_SPOTS['inhabited-world'];
    const yaw = OBSERVATORY_TRACE_YAW['inhabited-world'];
    const at = { x: x + o.x, z: z + o.z };
    const top = groundAt(at) + 0.12;
    // Le plancher du palier, ses deux planches de rive, et quatre pieux jusqu'au sol (le tertre descend vers la grève).
    const [ux, uz] = [Math.sin(yaw), Math.cos(yaw)];
    const [vx, vz] = [Math.cos(yaw), -Math.sin(yaw)];
    b.box({ x: at.x, y: top - 0.1, z: at.z, yaw }, [1.6, 0.1, 1.3], C.deckSide, C.newWood);
    for (const side of [-1, 1]) b.box({ x: at.x + vx * side * 0.74, y: top - 0.02, z: at.z + vz * side * 0.74, yaw }, [0.12, 0.08, 1.3], C.deckSide);
    for (const su of [-1, 1])
      for (const sv of [-1, 1]) {
        const p = { x: at.x + ux * su * 0.55 + vx * sv * 0.7, z: at.z + uz * su * 0.55 + vz * sv * 0.7 };
        const foot = groundAt(p) - 0.3;
        b.box({ x: p.x, y: foot, z: p.z }, [0.14, top - foot + 0.05, 0.14], C.post);
      }
  },
};

/**
 * La dalle de la scénette de la Halle (lot L8d) monte de tant au-dessus du replat : un peu au-dessus du dallage (places.ts,
 * ses abords), sur lequel elle se pose quand il est là.
 */
export const COMMONS_PAVING_RISE = COMMONS.paving.top + 0.03;

/**
 * La borne-fontaine de la Halle, l'objet témoin de ses missions (lot L8d) : au milieu du cadre, entre Kéo et le couvreur,
 * sous le bord de la toiture, entre les deux piliers du milieu, une borne de la pierre des Passeurs, son bec de bronze,
 * et à son pied une auge de pierre, sèche au repos (son fond sombre, à vue). Sans statue, sans croix, sans inscription.
 * Après une bonne réponse seulement : un filet d'eau en aplat clair (#A9DCEB), droit et assez large pour se lire, tombe
 * du bec dans l'auge, immobile, et l'eau de l'auge monte d'un geste court puis reste (d'un coup avec « Réduire les
 * animations ») ; jusqu'à l'item suivant, où l'auge est de nouveau sèche. La paroi sud de l'auge, vers la caméra, est
 * plus basse que l'eau à son repos : une bande claire d'eau se voit monter au-dessus d'elle, une lèvre, jamais un débord
 * (relecture de L8c-d). Ni ruissellement qui continue, ni éclaboussure, ni reflet. Ses mesures : le recul de la borne
 * vers les piliers, sa largeur, sa hauteur, sa profondeur ; la hauteur du bec, sa longueur ; l'auge (sa largeur, sa
 * hauteur, sa profondeur, ses parois, le haut de sa paroi sud) ; le haut de l'eau, sous le bord des trois autres
 * parois, d'où elle monte et l'épaisseur de son aplat ; la largeur du filet.
 */
export const FOUNTAIN = {
  z: -0.6,
  width: 0.46,
  height: 1.05,
  depth: 0.4,
  spout: 0.78,
  reach: 0.26,
  trough: [0.95, 0.38, 0.56],
  wall: 0.08,
  lip: 0.2,
  water: 0.3,
  from: 0.12,
  sheet: 0.2,
  jet: 0.12,
} as const;

function commonsFountain(b: FacetBuilder, spot: Vec3, done: boolean): Reaction | null {
  const F = FOUNTAIN;
  const o = { ...spot, y: spot.y + COMMONS_PAVING_RISE };
  const z = o.z + F.z;
  // La borne et son chaperon, un peu plus large.
  b.box({ x: o.x, y: o.y - 0.05, z }, [F.width, F.height + 0.05, F.depth], C.passeurShade, C.passeurStone);
  b.box({ x: o.x, y: o.y + F.height, z }, [F.width + 0.1, 0.1, F.depth + 0.1], C.passeurShade, C.passeurStone);
  // Le bec de bronze, de la face sud de la borne, vers le sud et un peu vers le bas.
  const front = z + F.depth / 2;
  const tip = { x: o.x, y: o.y + F.spout - 0.04, z: front + F.reach };
  b.beam({ x: o.x, y: o.y + F.spout, z: front - 0.02 }, tip, 0.08, C.passeursBronze);
  // L'auge : son fond (sombre tant qu'elle est sèche, sous l'eau sinon) et ses quatre parois, sous le bec.
  const [tw, th, td] = F.trough;
  const tz = front + F.reach;
  const t = F.wall;
  b.box({ x: o.x, y: o.y - 0.05, z: tz }, [tw, 0.05 + 0.08, td], C.passeurShade, C.stoneDark);
  for (const side of [-1, 1]) {
    b.box({ x: o.x + side * (tw / 2 - t / 2), y: o.y - 0.05, z: tz }, [t, th + 0.05, td], C.passeurShade, C.passeurStone);
    // La paroi sud (vers la caméra) plus basse : l'eau se voit monter au-dessus d'elle.
    const h = side > 0 ? F.lip : th;
    b.box({ x: o.x, y: o.y - 0.05, z: tz + side * (td / 2 - t / 2) }, [tw - 2 * t, h + 0.05, t], C.passeurShade, C.passeurStone);
  }
  if (!done) return null;
  // Le filet, immobile et droit, du bec jusqu'à l'eau de l'auge.
  const surface = o.y + F.water;
  b.box({ x: tip.x, y: surface, z: tip.z }, [F.jet, tip.y - surface, F.jet * 0.75], C.fountainWater);
  // L'eau de l'auge, un aplat clair entre ses parois, qui monte de sous la paroi sud jusqu'au-dessus d'elle (sous le bord
  // des trois autres), puis reste ; son côté sud se lit en bande au-dessus de la paroi basse.
  const r = new FacetBuilder();
  r.box({ x: 0, y: -F.sheet, z: 0 }, [tw - 2 * t - 0.02, F.sheet, td - 2 * t - 0.02], C.fountainWater);
  const from = { x: o.x, y: o.y + F.from, z: tz };
  return { facets: r.build(), from, to: { ...from, y: surface }, arc: 0, stay: true };
}

/**
 * Où se pose la trace de chaque mission de la Halle, depuis le centre du lieu (lot L8d) : les bancs et les pupitres sous
 * le bord sud de la toiture, de part et d'autre du milieu (où se tient la scénette), au sud du rang des piliers (sous la
 * toiture, mais vus du sud au retour : plus loin sous elle, l'égout les cache) ; la haie au coin sud-est, hors du
 * dallage et du chemin (qui arrive de l'ouest).
 */
export const COMMONS_TRACE_SPOTS = {
  representatives: { x: -4.4, z: 4.25 },
  'school-secularism': { x: 4.1, z: 4.15 },
  'private-life': { x: 7.9, z: 5.9 },
} as const;

/**
 * Les traces de la Halle (GD-20, point 8, lot L8d : une par mission, de pierre, de chêne et de haie ; sans texte ni
 * écriteau, sans drapeau, sans tableau ni affiche, rien d'une tribune, d'une urne ou d'un cadenas ; posées avec la
 * toiture ; cachées pendant toute question, aussi en « Vue simple ») :
 * - Représenter les autres : deux longs bancs de chêne sur pieds de pierre, l'un après l'autre, le long du rang des
 *   piliers du sud (jamais en cercle ni face à une tribune) ;
 * - L'école laïque : trois petits pupitres d'écolier en rang, chacun son plateau de chêne incliné et son siège attaché,
 *   plus bas, tous tournés vers le nord (rien devant eux : ni tableau, ni affiche, ni tribune) ;
 * - Ma vie privée : une haie basse taillée, en équerre, au coin sud-est, et son portillon de bois (sans cadenas ni
 *   serrure).
 */
/**
 * Un pupitre d'écolier de la Halle, depuis son milieu (lot L8d, relecture de L8c-d) : le demi-écart de ses joues, leur
 * profondeur, la hauteur de son plateau, son inclinaison (vers le sud, l'écolier), sa largeur et sa profondeur ; le
 * demi-écart des pieds du siège, sa hauteur, son recul vers le sud.
 */
const COMMONS_DESK = { foot: 0.26, cheek: 0.3, height: 0.68, tilt: 0.35, top: [0.78, 0.5] as const, seatFoot: 0.24, seat: 0.38, seatZ: 0.56 } as const;

const COMMONS_TRACES: Record<string, (b: FacetBuilder, cx: number, cz: number) => void> = {
  representatives: (b, x, z) => {
    const o = COMMONS_TRACE_SPOTS.representatives;
    // Sur le dallage usé de la ruine, toujours là (le neuf, plus haut, vient avec les abords : les pieds y entrent).
    const y = groundAt({ x: x + o.x, z: z + o.z }) + COMMONS.paving.worn;
    for (const dx of [-1.2, 1.2]) {
      const cx = x + o.x + dx;
      for (const side of [-1, 1]) b.box({ x: cx + side * 0.72, y: y - 0.03, z: z + o.z }, [0.2, 0.43, 0.36], C.passeurShade, C.passeurStone);
      b.box({ x: cx, y: y + 0.4, z: z + o.z }, [1.95, 0.1, 0.44], C.oak, C.oakTop);
    }
  },
  'school-secularism': (b, x, z) => {
    const o = COMMONS_TRACE_SPOTS['school-secularism'];
    // Sur le dallage usé de la ruine, toujours là (le neuf, plus haut, vient avec les abords : les pieds y entrent).
    const y = groundAt({ x: x + o.x, z: z + o.z }) + COMMONS.paving.worn;
    const D = COMMONS_DESK;
    for (const dx of [-1.35, 0, 1.35]) {
      const cx = x + o.x + dx;
      const cz = z + o.z;
      // Le pupitre, tourné vers le nord : son plateau incliné d'environ 20° (haut au nord, bas vers l'écolier), plus large
      // que ses deux joues ; son siège attaché derrière lui, au sud, plus bas, sur ses deux pieds ; deux patins au sol
      // les relient (relecture de L8c-d : le siège plus bas fait lire un pupitre d'écolier, jamais un lutrin).
      for (const side of [-1, 1]) {
        b.box({ x: cx + side * D.foot, y: y - 0.02, z: cz }, [0.06, D.height - 0.06, D.cheek], C.oak);
        b.box({ x: cx + side * D.seatFoot, y: y - 0.02, z: cz + D.seatZ }, [0.05, D.seat, 0.06], C.oak);
        b.box({ x: cx + side * D.foot, y: y - 0.02, z: cz + (D.seatZ - D.cheek / 2) / 2 }, [0.06, 0.08, D.seatZ + D.cheek / 2 + 0.03], C.oak);
      }
      b.box({ x: cx, y: y + D.height - 0.06, z: cz, pitch: D.tilt }, [D.top[0], 0.05, D.top[1]], C.oak, C.oakTop);
      b.box({ x: cx, y: y + D.seat - 0.02, z: cz + D.seatZ }, [0.6, 0.05, 0.28], C.oak, C.oakTop);
    }
  },
  'private-life': (b, x, z) => {
    const o = COMMONS_TRACE_SPOTS['private-life'];
    const cx = x + o.x,
      cz = z + o.z;
    // La haie en équerre : au sud, deux tronçons de part et d'autre du portillon ; à l'est, un tronçon vers le nord.
    for (const [hx, hz, sx, sz] of [
      [-1.25, 0.7, 1.3, 0.45],
      [0.75, 0.7, 1.1, 0.45],
      [1.1, -0.45, 0.45, 1.9],
    ] as const) {
      const at = { x: cx + hx, z: cz + hz };
      b.box({ x: at.x, y: groundAt(at) - 0.3, z: at.z }, [sx, 0.9, sz], C.hedge, C.hedgeTop);
    }
    // Le portillon : deux poteaux et le vantail fermé, de deux traverses et de trois lattes.
    const g = { x: cx - 0.2, z: cz + 0.7 };
    const y = groundAt(g);
    for (const side of [-1, 1]) b.box({ x: g.x + side * 0.38, y: y - 0.3, z: g.z }, [0.1, 0.95, 0.1], C.oak);
    for (const h of [0.15, 0.45]) b.box({ x: g.x, y: y + h, z: g.z }, [0.66, 0.07, 0.05], C.oak);
    for (const dx of [-0.2, 0, 0.2]) b.box({ x: g.x + dx, y: y + 0.08, z: g.z }, [0.07, 0.5, 0.04], C.oakTop);
  },
};
