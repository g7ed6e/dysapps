// Le plan du 4e en données (lot 1 du monde ouvert du 4e, « l'île entière en grandes masses », références validées par le
// mainteneur le 21 octobre 2026) : les Anciens Ateliers, une île longue entre une usine et un volcan calme. Au
// sud-est, sur la baie, les Fabriques (le départ) et la Crique ; à l'est, au-delà du bassin à flot, la pointe du
// Bastion ; à l'ouest, au-delà d'un ravin sec, les pentes des Coteaux ; au nord, au-delà de la coulée figée, l'Épaule.
// Au nord-ouest, le volcan : un cône large et bas, son sommet où l'on ne marche pas, de la mer au cratère ; la coulée
// figée descend du cratère à la mer du nord-est. Relevé sur le plan des lieux validé (archipeo/univers-challenge/niveaux/
// 4e/references/plan-4e.png, et plan/plan4e.py pour les coordonnées, dans la Bibliothèque du projet) et la fiche du
// niveau (fiche-4e.md, § 4 et § 5) : les seize lieux, les quatre terres et leurs passages, le réseau des chemins, la
// ligne de rails. Les points sont écrits en pixels du plan (2 000 × 1 450), pour se relire contre l'image, et convertis
// en unités du monde (`fromPlan4e`). Les noms sont ceux de la fiche, proposés et validés avec le plan. Code pur.
import { distanceToPolyline, type Vec2 } from './geometry';
import type { Land } from './lands';
import type { PathNode } from './network';
import { portNode, type OpenPlace } from './plan6e';

/** Pixels du plan par unité du monde : l'île fait environ 490 unités d'est en ouest. */
const PLAN_SCALE = 3.6;
/** Le point du plan qui est l'origine du monde : le milieu de l'île, au sud-est de la Forge. */
const PLAN_ORIGIN = { x: 1025, y: 610 };

/** Un point du plan du 4e (en pixels de l'image) en unités du monde. */
export const fromPlan4e = ([px, py]: readonly [number, number]): Vec2 => ({ x: (px - PLAN_ORIGIN.x) / PLAN_SCALE, z: (py - PLAN_ORIGIN.y) / PLAN_SCALE });

const poly = (points: readonly (readonly [number, number])[]): Vec2[] => points.map(fromPlan4e);

/**
 * Les couleurs du 4e (fiche du niveau, § 2 ; vue globale validée, palette chaude du 12 octobre) : la mer bleu nuit, le
 * sable des grèves, la terre rouge des Fabriques et du Bastion, les verts brûlés des Coteaux, la roche brune du volcan,
 * la croûte de basalte de la coulée (jamais presque noire : ce sont les fentes de lave qui font le sombre), la brique, la
 * terre cuite, le cuivre et le fer rouillé de l'usine, la lave figée (des fentes fines plus rouges qu'orange, une lueur
 * fixe), la fumée claire du panache.
 */
export const COLORS_4E = {
  /** La mer autour de l'île : le bleu nuit de la vue globale, jamais plus sombre. */
  sea: 0x1e3e58,
  /** La bande du bord de mer, un cran plus claire. */
  seaShallow: 0x2f6078,
  /** L'eau du bassin à flot, au cœur. */
  dock: 0x24506a,
  /** Le sable des grèves. */
  sand: 0xc48c60,
  /** La terre rouge des Fabriques et du Bastion, assez sombre pour que le sable des chemins et le pavé de la Crique s'en détachent à 3 contre 1 en luminance au moins (référent dys, retouche 1 du lot 1). */
  soil: 0xb06c5e,
  /** La même au soleil, un aplat plus clair. */
  soilSun: 0xb46e60,
  /** La même à l'ombre (jamais presque noire). */
  soilShade: 0x986052,
  /** Les verts brûlés des Coteaux. */
  burnt: 0x9a8862,
  burntSun: 0xa6966c,
  burntShade: 0x80704e,
  /** La roche brune du volcan, au soleil et à l'ombre. */
  rock: 0x76544a,
  rockSun: 0x8c6658,
  rockShade: 0x654840,
  /**
   * Le basalte du cône du volcan (fiche, § 2 : #4A4240, chaud et sombre, jamais presque noir ; retouche 1 du lot 1,
   * directeur artistique : le fourneau se détache sur le flanc sombre), au soleil et à l'ombre.
   */
  basalt: 0x4a4240,
  basaltSun: 0x574d48,
  basaltShade: 0x423a38,
  /** La croûte de basalte de la coulée figée et du sommet, et son ombre. */
  crust: 0x544a46,
  crustShade: 0x48403e,
  /** Le fond sec du ravin. */
  gully: 0x7e6450,
  /** La lave : le liseré du cratère et les fentes de la cuvette, une lueur fixe. */
  lava: 0xc4462c,
  /** La fumée du panache, et son ombre. */
  smoke: 0xded8ce,
  smokeShade: 0xc9c1b6,
  /** La brique et la terre cuite de l'usine. */
  brick: 0xa4553e,
  brickShade: 0x8a4634,
  terracotta: 0xc0704a,
  /** Le cuivre et le fer rouillé (les rails, les cerclages, les charpentes). */
  copper: 0xb87333,
  rust: 0xaf6c55,
  rustShade: 0x8c5444,
  /** La pierre grise des Passeurs, et son ombre. */
  stone: 0x9a8e84,
  stoneShade: 0x7e746c,
  stoneSun: 0xb3a89c,
  /** Le bois gris de la ruine, et son ombre. */
  wood: 0x9a826a,
  woodShade: 0x7e6a56,
  /** Le ballast sous les rails. */
  ballast: 0x6e5a50,
} as const;

/** Le bord de l'île (le sable compris), dans le sens des aiguilles d'une montre depuis l'ouest. */
const ISLAND_PX: readonly (readonly [number, number])[] = [
  [150, 380], [230, 190], [420, 80], [680, 75], [940, 140], [1160, 250], [1380, 390], [1620, 470], [1830, 530], [1910, 650],
  [1870, 770], [1740, 830], [1600, 840], [1500, 900], [1460, 1000], [1390, 1100], [1200, 1140], [980, 1100], [770, 1000],
  [540, 920], [330, 790], [140, 620],
];

/** Le bord de l'île, son sable compris (le plan l'élargit de 2,5 % autour de son milieu). */
export const COAST_4E = (() => {
  const cx = ISLAND_PX.reduce((s, [x]) => s + x, 0) / ISLAND_PX.length;
  const cy = ISLAND_PX.reduce((s, [, y]) => s + y, 0) / ISLAND_PX.length;
  return poly(ISLAND_PX.map(([x, y]) => [cx + (x - cx) * 1.025, cy + (y - cy) * 1.025] as const));
})();

/**
 * Le volcan (fiche, § 5 : « un cône large et bas, sa hauteur fait environ le tiers de sa base » ; retouche 1 du lot 1,
 * directeur artistique : 34 unités pour 148 de base faisaient 0,23, il en fait maintenant 0,32) : son cratère, le rayon
 * de son cône au sol, sa hauteur au centre du cône, le rayon du cratère et sa profondeur sous le rebord.
 */
export const VOLCANO_4E = { crater: fromPlan4e([370, 295]), radius: 74, height: 49, craterRadius: 7, craterDepth: 5 } as const;

/**
 * Le sommet, où l'on ne marche pas (hachuré sur la Carte) : du cratère à la mer de l'ouest, il ferme l'Épaule côté
 * Coteaux (plan, `summit`).
 */
export const SUMMIT_4E = poly([
  [20, 250], [150, 238], [230, 245], [300, 225], [410, 225], [455, 265], [440, 330], [370, 350], [260, 352], [150, 362], [20, 372],
]);

/**
 * La coulée figée, du cratère à la mer du nord-est (plan, `C`), et sa demi-largeur (en unités) : une bande de croûte de
 * basalte, un peu creusée, où l'on ne marche pas ; elle ferme l'Épaule au sud. Son seul passage : le pont de basalte.
 */
export const COULEE_4E = {
  line: poly([[370, 300], [450, 308], [560, 338], [680, 378], [800, 405], [900, 420], [1000, 408], [1080, 365], [1160, 308], [1290, 218]]),
  halfWidth: 4.6,
} as const;

/**
 * La cuvette, au pied de la coulée, juste au-dessus de la Forge : seul endroit de la coulée où des fentes de lave se
 * voient (références, README : aucune lave sous le cratère ni sur les flancs) ; son centre et ses demi-axes.
 */
export const CUVETTE_4E = { center: fromPlan4e([895, 421]), rx: 9, rz: 5 } as const;

/**
 * La rigole de la Forge : un canal de pierre couvert, de la cuvette au fourneau (références : couverte devant la Forge,
 * ouverte seulement à la prise et sous une grille au pied du fourneau) ; vide et grise avant la restauration (lot 1).
 */
export const RIGOLE_4E = poly([[912, 430], [945, 470], [972, 515]]);

/** Le ravin sec, de la coulée à la mer du sud (plan, `R`), et sa demi-largeur : jamais un ruisseau. */
export const RAVIN_4E = {
  line: poly([[805, 410], [828, 480], [812, 580], [775, 700], [735, 860], [695, 1030], [668, 1150]]),
  halfWidth: 4.2,
} as const;

/** Le bassin à flot, entre deux quais droits, de la mer du nord à la baie : il sépare le Bastion des Fabriques. */
export const BASSIN_4E = { line: poly([[1522, 400], [1508, 650], [1488, 920]]), halfWidth: 7.5 } as const;

/** Les coupures qu'on relie, par leur nom. */
export type Cut4e = 'bassin' | 'ravin' | 'coulee';

/** Les lieux du 4e : leurs identifiants restent neutres, sans accent (ceux des modèles `4e-habitant-<id>`). */
export type PlaceId4e =
  | 'forge'
  | 'soute'
  | 'porte'
  | 'etalon'
  | 'gabarit'
  | 'manufacture'
  | 'loge'
  | 'chariot'
  | 'herbier'
  | 'roches'
  | 'jonction'
  | 'veillee'
  | 'basilique'
  | 'terminus'
  | 'orgues'
  | 'dynamo';

/** Un lieu : son centre sur le plan (en pixels), et sa porte depuis lui (en unités). */
interface PlaceSpec extends Omit<OpenPlace<PlaceId4e>, 'center' | 'door' | 'scenes' | 'yaw' | 'touchRadius' | 'mapSide'> {
  plan: [number, number];
  door: Vec2;
}

/**
 * Les seize lieux (fiche, § 4), à leur place sur le plan. L'Étalon et la Jonction sont nouveaux : leurs missions
 * s'écrivent avec leur lot, dans un lieu du monde ouvert seulement (GD-24) : l'Étalon (`maths-4e-data`) a les siennes ;
 * la Jonction (`french-4e-sentence`) n'existe pas encore dans le contenu, et son panneau reste vide d'ici là. Aucune mission ne se joue encore en scénette : toutes passent par l'écran habituel.
 */
const PLACE_SPECS: readonly PlaceSpec[] = [
  { id: 'forge', name: 'La Forge', at: 'à la Forge', agree: 'fs', island: 'maths-4e-powers', plan: [1000, 545], door: { x: 6, z: 11 } },
  { id: 'soute', name: 'La Soute', at: 'à la Soute', agree: 'fs', island: 'geography-4e-globalization', plan: [1400, 860], door: { x: 0, z: 8 } },
  { id: 'porte', name: 'La Porte', at: 'à la Porte', agree: 'fs', island: 'civics-4e-rights-freedoms', plan: [1250, 700], door: { x: 0, z: 8 } },
  { id: 'etalon', name: 'L’Étalon', at: 'à l’Étalon', agree: 'ms', island: 'maths-4e-data', plan: [1118, 512], door: { x: 2, z: 9 } },
  { id: 'gabarit', name: 'Le Gabarit', at: 'au Gabarit', agree: 'ms', island: 'maths-4e-algebra', plan: [1830, 680], door: { x: -3, z: 8 } },
  { id: 'manufacture', name: 'La Manufacture', at: 'à la Manufacture', agree: 'fs', island: 'history-4e-revolutions', plan: [1640, 610], door: { x: 0, z: 8 } },
  { id: 'loge', name: 'La Loge', at: 'à la Loge', agree: 'fs', island: 'english-4e-comprehension', plan: [1740, 790], door: { x: 0, z: -8 } },
  { id: 'chariot', name: 'Le Chariot', at: 'au Chariot', agree: 'ms', island: 'technology-4e-modeling', plan: [1610, 735], door: { x: 3, z: 7 } },
  { id: 'herbier', name: 'L’Herbier', at: 'à l’Herbier', agree: 'ms', island: 'life-earth-sciences-4e-cells-evolution', plan: [520, 790], door: { x: 0, z: -8 } },
  { id: 'roches', name: 'Les Roches', at: 'aux Roches', agree: 'fp', island: 'french-4e-vocabulary', plan: [560, 460], door: { x: 7, z: 4 } },
  { id: 'jonction', name: 'La Jonction', at: 'à la Jonction', agree: 'fs', island: 'french-4e-sentence', plan: [690, 585], door: { x: 4, z: -7 } },
  { id: 'veillee', name: 'La Veillée', at: 'à la Veillée', agree: 'fs', island: 'lv2-4e-daily-life', plan: [230, 580], door: { x: 6, z: 5 } },
  { id: 'basilique', name: 'La Basilique', at: 'à la Basilique', agree: 'fs', island: 'lca-4e-cities', plan: [350, 700], door: { x: 8, z: 0 } },
  { id: 'terminus', name: 'Le Terminus', at: 'au Terminus', agree: 'ms', island: 'english-4e-grammar', plan: [560, 150], door: { x: 8, z: 3 } },
  { id: 'orgues', name: 'Les Orgues', at: 'aux Orgues', agree: 'fp', island: 'french-4e-agreement', plan: [760, 175], door: { x: 0, z: 8 } },
  { id: 'dynamo', name: 'La Dynamo', at: 'à la Dynamo', agree: 'fs', island: 'physics-chemistry-4e-signals-circuits', plan: [900, 250], door: { x: 0, z: 8 } },
];

/** Le rayon de toucher d'un lieu du 4e : large, rien de précis à viser. */
const TOUCH_RADIUS = 7;

/**
 * Sur la Carte, le côté où le nom de chaque lieu se pose d'abord, comme sur le plan validé (retouche 1 du lot 1,
 * consultant UX UI) : sous son point le plus souvent ; à droite pour l'Étalon (« Toi », devant la Forge, reste libre) et
 * la Manufacture (hors du bassin à flot) ; à gauche pour le Terminus (le bord nord reste libre) et le Chariot (la
 * grappe du Bastion se desserre) ; la Dynamo sous elle, à l'est des Orgues, la Jonction sous elle, hors du pont du ravin.
 */
const MAP_SIDES_4E: Readonly<Record<PlaceId4e, 'below' | 'left' | 'right'>> = {
  forge: 'below',
  soute: 'below',
  porte: 'below',
  etalon: 'right',
  gabarit: 'below',
  manufacture: 'right',
  loge: 'below',
  chariot: 'left',
  herbier: 'below',
  roches: 'below',
  jonction: 'below',
  veillee: 'below',
  basilique: 'below',
  terminus: 'left',
  orgues: 'below',
  dynamo: 'below',
};

export const PLACES_4E: readonly OpenPlace<PlaceId4e>[] = PLACE_SPECS.map((s) => ({
  id: s.id,
  name: s.name,
  at: s.at,
  agree: s.agree,
  island: s.island,
  scenes: [],
  center: fromPlan4e(s.plan),
  yaw: 0,
  door: s.id,
  touchRadius: TOUCH_RADIUS,
  mapSide: MAP_SIDES_4E[s.id],
}));

/**
 * Les lieux en option, hors du prix de leur terre (fiche, § 5 : « les lieux en option hors du prix, comme l'Oracle au
 * 5e ») : la Veillée et la Basilique, au bord des Coteaux.
 */
export const UNPRICED_PLACES_4E: readonly PlaceId4e[] = ['veillee', 'basilique'];

/** La hauteur de la pierre de la Crique, au-dessus de l'eau : la place et le quai, au même niveau. */
export const CRIQUE_LEVEL = 1.3;

/** Un repère à plat : son origine, son cap ; `toWorld` et `toLocal` passent de l'un à l'autre (comme `PORT`). */
export interface Frame4e {
  readonly origin: Vec2;
  readonly yaw: number;
  toWorld(lx: number, lz: number): Vec2;
  toLocal(p: Vec2): Vec2;
}

/** Le repère tourné de `yaw` où le point local (`kx`, `kz`) tombe sur `at`. */
function frameAt(at: Vec2, yaw: number, kx: number, kz: number): Frame4e {
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  const origin = { x: at.x - (kx * c + kz * s), z: at.z - (-kx * s + kz * c) };
  return {
    origin,
    yaw,
    toWorld: (lx, lz) => ({ x: origin.x + lx * c + lz * s, z: origin.z - lx * s + lz * c }),
    toLocal: (p) => {
      const dx = p.x - origin.x,
        dz = p.z - origin.z;
      return { x: dx * c - dz * s, z: dx * s + dz * c };
    },
  };
}

/**
 * La Crique, le débarcadère (fiche, § 5) : une petite anse au sud-est, près de la Soute. Son repère est celui de l'Escale
 * (plan6e.ts, `PORT`) : la Maison des Savoirs, la Galerie des Merveilles et l'Entrepôt en rangée, à la même place
 * (`x` le long de la rangée, `z` de leur dos vers la place). La rangée court du sud-ouest au nord-est, ses façades
 * tournées vers la baie ; Kéo arrive au bout du quai (`CRIQUE_QUAY_SPOT`), au bord de l'eau ; vue du quai, la caméra
 * regarde la Forge et le volcan (fiche, § 5), la rangée à droite. Le lieu entier vient avec son lot (lot 4).
 */
export const CRIQUE_QUAY_SPOT: readonly [number, number] = [0, 25];
export const CRIQUE = frameAt(fromPlan4e([1372, 1092]), Math.PI / 4, CRIQUE_QUAY_SPOT[0], CRIQUE_QUAY_SPOT[1]);

/** Le pavage de la Crique, dans son repère : la place devant la rangée, et le quai qui la prolonge jusqu'à l'eau. */
export const CRIQUE_PAVING = {
  quay: { x0: -3, x1: 3, z0: 17, z1: 27 },
  square: { x0: -8, x1: 40, z0: 6.5, z1: 17 },
} as const;

/** Les bâtiments de la Crique dans son repère : la marche libre les contourne. */
export const CRIQUE_BUILDINGS = { x0: 3.6, x1: 38.4, z0: 1.1, z1: 6.4 } as const;

/**
 * L'aire de la Nef (fiche, § 5 : l'aéronef posé sur son aire de bois cerclée de fer, au bout du quai) : une passerelle
 * de bois du bout du quai à l'aire ronde, sur l'eau de la baie, dans le repère de la Crique (`z0`, `z1` : la passerelle de l'aire ;
 * `pad` : le centre de l'aire, son rayon) ; la hauteur de leurs planches. Un décor : on n'y marche pas.
 */
export const CRIQUE_PAD = { z0: 27, z1: 41, width: 2.6, pad: { x: 0, z: 45.5 }, radius: 4.5, deck: CRIQUE_LEVEL - 0.02 } as const;

const CRIQUE_COS = Math.cos(CRIQUE.yaw);
const CRIQUE_SIN = Math.sin(CRIQUE.yaw);
const scratch = { x: 0, z: 0 };

/**
 * La pierre de la Crique sous un point du monde (`x`, `z`), ou rien hors de son pavage : Kéo s'y tient, au-dessus du
 * sol. Lue à chaque image : rien n'y est créé.
 */
export function criqueFloor(x: number, z: number): number | null {
  const dx = x - CRIQUE.origin.x,
    dz = z - CRIQUE.origin.z;
  scratch.x = dx * CRIQUE_COS - dz * CRIQUE_SIN;
  scratch.z = dx * CRIQUE_SIN + dz * CRIQUE_COS;
  const { quay: q, square: s } = CRIQUE_PAVING;
  const l = scratch;
  const inside = (l.x >= q.x0 && l.x <= q.x1 && l.z >= q.z0 && l.z <= q.z1) || (l.x >= s.x0 && l.x <= s.x1 && l.z >= s.z0 && l.z <= s.z1);
  return inside ? CRIQUE_LEVEL : null;
}

/** Le lieu de départ du 4e : le quai de la Crique (le nœud du quai a le nom de celui de l'Escale, que la page connaît). */
export const DEPARTURE_4E = { node: portNode('quai'), at: CRIQUE.toWorld(CRIQUE_QUAY_SPOT[0], CRIQUE_QUAY_SPOT[1]) } as const;

/** Les nœuds de la Crique, dans son repère : le bout de la place, puis devant chaque façade, comme à l'Escale. */
const CRIQUE_NODES: readonly { id: string; at: readonly [number, number] }[] = [
  { id: 'port-place', at: [0, 15] },
  { id: portNode('succes'), at: [13, 9.5] },
  { id: portNode('french'), at: [19.3, 9.5] },
  { id: portNode('maths'), at: [22.5, 9.5] },
  { id: portNode('english'), at: [25.7, 9.5] },
  { id: portNode('chantier'), at: [34, 9.5] },
  // Au bout de la place, passé l'Entrepôt : le chemin de la Soute en part.
  { id: 'cri-1', at: [43, 9] },
];

const node = (id: string, p: [number, number]): PathNode => ({ id, at: fromPlan4e(p) });

/** La porte d'un lieu : à son décalage de son centre, en unités. */
const doorNode = (s: PlaceSpec): PathNode => {
  const c = fromPlan4e(s.plan);
  return { id: s.id, at: { x: c.x + s.door.x, z: c.z + s.door.z } };
};

/**
 * Les nœuds : les portes des lieux, puis les coudes des chemins, terre par terre. Les Fabriques : du quai de la Crique
 * à la Soute, à la Porte, à l'Étalon et à la Forge, puis aux trois ponts. Le Bastion, au-delà du bassin à flot ; les
 * Coteaux, au-delà du ravin ; l'Épaule, au-delà de la coulée, par le pont de basalte.
 */
export const PATH_NODES_4E: readonly PathNode[] = [
  ...PLACE_SPECS.map(doorNode),
  { id: DEPARTURE_4E.node, at: DEPARTURE_4E.at },
  ...CRIQUE_NODES.map(({ id, at }) => ({ id, at: CRIQUE.toWorld(at[0], at[1]) })),
  // Les Fabriques.
  node('fab-1', [1330, 790]),
  node('fab-2', [1170, 630]),
  node('fab-3', [925, 590]),
  node('rav-1', [866, 506]),
  node('fab-4', [1018, 452]),
  node('fab-5', [1420, 655]),
  // Le Bastion.
  node('bas-1', [1600, 650]),
  node('bas-2', [1690, 690]),
  node('bas-3', [1770, 735]),
  // Les Coteaux.
  node('rav-2', [772, 516]),
  node('cot-1', [650, 480]),
  node('cot-2', [560, 650]),
  node('cot-3', [300, 650]),
  // L'Épaule.
  node('epa-1', [968, 362]),
  node('epa-2', [800, 235]),
];

/** Les liaisons : sentiers, et le passage de chaque terre (le pont du bassin, le pont du ravin, le pont de basalte). */
export const PATH_EDGES_4E: readonly (readonly [string, string])[] = [
  // Les Fabriques : la Crique, du quai à la place, le long des façades, puis vers la Soute.
  [DEPARTURE_4E.node, 'port-place'],
  ['port-place', portNode('succes')],
  [portNode('succes'), portNode('french')],
  [portNode('french'), portNode('maths')],
  [portNode('maths'), portNode('english')],
  [portNode('english'), portNode('chantier')],
  [portNode('chantier'), 'cri-1'],
  ['cri-1', 'soute'],
  ['cri-1', 'fab-1'],
  ['fab-1', 'porte'],
  ['porte', 'fab-2'],
  ['fab-2', 'etalon'],
  ['fab-2', 'forge'],
  ['forge', 'fab-3'],
  ['fab-3', 'rav-1'],
  ['etalon', 'fab-4'],
  ['fab-1', 'fab-5'],
  // Le pont du bassin, puis le Bastion.
  ['fab-5', 'bas-1'],
  ['bas-1', 'manufacture'],
  ['bas-1', 'bas-2'],
  ['bas-2', 'chariot'],
  ['bas-2', 'bas-3'],
  ['bas-3', 'gabarit'],
  ['bas-3', 'loge'],
  // Le pont du ravin, puis les Coteaux.
  ['rav-1', 'rav-2'],
  ['rav-2', 'jonction'],
  ['rav-2', 'cot-1'],
  ['cot-1', 'roches'],
  ['jonction', 'cot-2'],
  ['cot-2', 'herbier'],
  ['cot-2', 'basilique'],
  ['basilique', 'cot-3'],
  ['cot-3', 'veillee'],
  // Le pont de basalte, puis l'Épaule.
  ['fab-4', 'epa-1'],
  ['epa-1', 'dynamo'],
  ['dynamo', 'epa-2'],
  ['epa-2', 'orgues'],
  ['epa-2', 'terminus'],
];

/** Le passage de chaque terre qu'on relie : la liaison du réseau qui le franchit, de la terre d'avant à elle, et sa coupure. */
export const LINKS_4E = {
  bastion: { bridge: ['fab-5', 'bas-1'], cut: 'bassin' },
  coteaux: { bridge: ['rav-1', 'rav-2'], cut: 'ravin' },
  epaule: { bridge: ['fab-4', 'epa-1'], cut: 'coulee' },
} as const satisfies Record<string, { bridge: readonly [string, string]; cut: Cut4e }>;

/**
 * Les quatre terres du 4e (fiche, § 5), dans l'ordre : les Fabriques, le départ, puis le Bastion (suggéré d'abord), les
 * Coteaux et l'Épaule (suggérée en dernier, jamais imposée : GD-24, retouche 1 du lot 1), chacune reliée depuis les
 * Fabriques ; la fin du niveau est la dernière terre reliée.
 */
export const LANDS_4E: readonly Land[] = [
  { id: 'fabriques', name: 'Les Fabriques', places: ['forge', 'soute', 'porte', 'etalon'], after: null, bridgeName: null },
  { id: 'bastion', name: 'Le Bastion', places: ['gabarit', 'manufacture', 'loge', 'chariot'], after: 'fabriques', bridgeName: 'Le pont du bassin' },
  { id: 'coteaux', name: 'Les Coteaux', places: ['herbier', 'roches', 'jonction', 'veillee', 'basilique'], after: 'fabriques', bridgeName: 'Le pont du ravin' },
  { id: 'epaule', name: 'L’Épaule', places: ['terminus', 'orgues', 'dynamo'], after: 'fabriques', bridgeName: 'Le pont de l’Épaule' },
];

/**
 * La ligne de rails (fiche, § 5) : du Terminus, à travers l'Épaule, par le pont de basalte (son seul passage), jusqu'au
 * butoir de la Forge, contre la halle de l'Étalon ; au pied du pont, l'embranchement part vers l'ouest, passe la rigole
 * couverte, franchit le ravin par le pont du ravin et finit à la Jonction, dont deux voies de service s'arrêtent sur
 * des heurtoirs. Sur les deux ponts, les rails suivent la ligne du chemin (le pont les porte) ; ils s'arrêtent à ses
 * culées tant qu'il n'est pas posé. En masses au lot 1 (la benne vient avec la ligne en service).
 */
export const RAILS_4E = {
  line: poly([[588, 160], [605, 240], [700, 300], [850, 340], [930, 352], [968, 362], [1018, 452], [1055, 488], [1090, 505]]),
  branch: poly([[1018, 452], [960, 478], [866, 506], [772, 516], [730, 540], [700, 568]]),
  sidings: [poly([[700, 568], [640, 548]]), poly([[700, 568], [648, 628]])],
} as const;

/** Un point est-il à moins de `reach` unités d'un rail ? */
export const nearRails4e = (p: Vec2, reach: number): boolean =>
  distanceToPolyline(p, RAILS_4E.line) < reach || distanceToPolyline(p, RAILS_4E.branch) < reach || RAILS_4E.sidings.some((s) => distanceToPolyline(p, s) < reach);

/**
 * La place des Détours du 4e (fiche, § 5), réservée dès le plan : l'Épave (Fabriques), le Recoin (Bastion), le Replat
 * (Coteaux), la Dalle (Épaule). Ils se construisent avec leur lot ; rien ne s'y dessine encore.
 */
export const DETOUR_SPOTS_4E = {
  epave: fromPlan4e([1060, 1060]),
  recoin: fromPlan4e([1760, 560]),
  replat: fromPlan4e([300, 470]),
  dalle: fromPlan4e([1075, 245]),
} as const;

/** La place réservée des deux grands projets (GD-10) : le portique des docks, la tour des signaux (plan, en pointillé). */
export const RESERVED_4E = {
  portique: { center: fromPlan4e([1275, 905]), half: { x: 15, z: 7 } },
  tour: { center: fromPlan4e([452, 582]), half: { x: 6, z: 6 } },
} as const;

/** Le Rafiot des Ferrailleurs, amarré au bout d'un quai abandonné, entre la Crique et l'Épave (plan) : sa place et son cap. */
export const RAFIOT_4E = { quay: [fromPlan4e([1180, 1120]), fromPlan4e([1180, 1192])], at: fromPlan4e([1182, 1212]), yaw: 0 } as const;

/**
 * Le terrain : l'étendue de la carte de hauteurs (le plan de 110 à 1 950 pixels d'ouest en est, de 40 à 1 190 du nord au
 * sud), le pas de sa grille et ses tuiles, comme au 5e.
 */
export const TERRAIN_4E = (() => {
  const step = 1.75;
  const tileCells = 18;
  const tile = step * tileCells;
  const min = fromPlan4e([110, 40]);
  const max = fromPlan4e([1950, 1190]);
  const tilesX = Math.ceil((max.x - min.x) / tile);
  const tilesZ = Math.ceil((max.z - min.z) / tile);
  return { minX: min.x, minZ: min.z, step, tileCells, coarse: 3, tilesX, tilesZ } as const;
})();
