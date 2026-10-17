// Les aménagements du monde ouvert (GD-20, point 4, piste B « La remise », choisie par le mainteneur le 17 octobre 2026 ;
// lot L0, « Les aménagements posés », la 3D seule, sans geste) : les dix-neuf petites constructions du 6e (seize
// commandes, trois objets d'entraide), déjà dessinées par le code pour la grille d'Archipéo, posées chacune à son lieu,
// à une échelle commune. Ce fichier ne dessine rien : la vue (three/archipeo/amenagements.ts) trace le dessin de la
// grille dans son atelier et le lui donne en facettes brutes (`DrawnObject`) ; ici, sa place, son échelle, son quart de
// tour et sa coupe en éléments (un par ressource que la commande demande, pour la pose du lot L1).
//
// La règle des places (directeur artistique, arbitrages du 17 octobre 2026, point 4) : une seule place par défaut, au
// sol, du côté de l'habitant, dans le rayon de toucher du lieu (l'objet n'est qu'une partie du lieu : son toucher ouvre
// le lieu) ; jamais sur la porte, une trace, un chemin, une passerelle, le chenal de la Nef ou la place de l'Escale ;
// au Phare, au pied de la tour (la remise s'y joue). Le potager du Phare prolonge le jardin clos par l'ouverture de son
// muret ; la grue des Archives est adossée à la façade, du côté opposé aux Quais (seule exception à la règle de hauteur).
// Les lanternes (celle d'entraide du Phare, le poteau-lanterne de la Vigie) restent éteintes : leurs vitres en verre mat
// (la vue les peint, `MATTE_GLASS`). Code pur.
import type { Facets } from './facets';
import type { Vec2 } from './geometry';
import { hidesTraces, placeById, type PlaceId } from './plan6e';
import { questionLayout, type ScreenBox } from './questionScene';
import { scenetteLayout } from './scenette';
import { standingHeight } from './terrain';

/**
 * L'échelle commune des aménagements : une case de la grille vaut tant d'unités du monde. Leurs tailles relatives sont
 * celles de la grille ; le plus haut (le parasol, 3,04 cases) reste sous l'habitant de la scénette (1,40 unité).
 */
export const AMENAGEMENT_SCALE = 0.45;

/** La hauteur de l'habitant d'une scénette, en unités du monde (le plus petit, mesuré sur les décors de près). */
export const HABITANT_HEIGHT = 1.4;

/**
 * Le verre mat des lanternes éteintes (consultant Archipéo, arbitrage du directeur artistique, point 3) : le dessus et
 * le côté de la vitre éteinte du Phare, jamais la couleur d'une lampe (la seule lueur chaude reste la lanterne du Phare).
 */
export const MATTE_GLASS = { dessus: 0xe5ebe3, cote: 0xcfd9d6 } as const;

/** Un dessin de la grille, en facettes brutes, dans le repère de sa forme : X = x, Y = la hauteur, Z = y (vers le fond). */
export interface DrawnObject {
  positions: Float32Array;
  normals: Float32Array;
  /** Rouge, vert, bleu linéaires, par sommet. */
  colors: Float32Array;
  /** Les marques du dessin (`Workshop.part`) : le nombre de triangles tracés à chacune ; elles le coupent en morceaux. */
  marks: readonly number[];
}

/** Un aménagement : la petite construction qu'il reprend, son lieu, sa place et ses éléments. */
export interface Amenagement {
  /** L'identifiant de la petite construction de la grille (world/fixtures.ts) : sa sauvegarde, `world.parts`. */
  id: string;
  /** Son nom, celui de la grille (« l'objet porte le même nom partout ») : pour se relire, jamais affiché d'ici. */
  name: string;
  place: PlaceId;
  /** Une commande (livrer), ou l'objet d'une quête d'entraide (apporter : d'un seul bloc). */
  kind: 'commande' | 'quete';
  /**
   * Les éléments, dans l'ordre de leur pose : chacun réunit des morceaux du dessin (les marques le coupent, dans l'ordre
   * où il est tracé ; un élément peut en prendre plusieurs, et dans un autre ordre : les pieds de l'établi avant son
   * plateau). Une commande en a un par ressource demandée ; un objet de quête, un seul.
   */
  elements: readonly (readonly number[])[];
  /** Le milieu de sa forme au sol, depuis le centre du lieu, en unités du monde. */
  at: Vec2;
  /** Son quart de tour autour de la verticale : nul, sa face (le devant de la grille) vers le sud, vers la caméra. */
  yaw: number;
  /**
   * Posé sur une surface du lieu, et non sur le terrain (la terrasse de l'Observatoire, le quai de la Gare maritime) : la
   * hauteur de son dessus au-dessus du pied du lieu (le pied de sa scénette, `standingHeight` du sol en son centre).
   */
  floor?: number;
  /** Adossé à une façade (la grue des Archives) : la seule exception à la règle de hauteur, écrite dans le test. */
  facade?: true;
}

/**
 * Les dix-neuf aménagements du 6e, un lieu chacun (deux au Phare, aux Filets et à la Vigie : la commande et l'objet
 * d'entraide). Les places, au sol, relevées sur le plan des lieux et vérifiées par le test (world/continu/amenagements.test.ts) ;
 * le directeur artistique les tranche lieu par lieu sur les captures du lot L0.
 */
export const AMENAGEMENTS: readonly Amenagement[] = [
  // Le Phare : le potager dans le prolongement du jardin clos de la gardienne (à l'ouest de la tour), par l'ouverture de
  // son muret ; la lanterne d'entraide sur son banc, au pied de la tour, à côté de la porte.
  { id: 'french-6e-phonology-fixture-1', name: 'le potager', place: 'phare', kind: 'commande', elements: [[0], [1], [2]], at: { x: -3.65, z: 0.5 }, yaw: 0 },
  { id: 'french-6e-phonology-fixture-2', name: 'la lanterne', place: 'phare', kind: 'quete', elements: [[0, 1]], at: { x: 3.0, z: 3.4 }, yaw: 0 },
  { id: 'french-6e-letter-confusion-fixture-1', name: 'le puits', place: 'printworks', kind: 'commande', elements: [[0], [1], [2], [3]], at: { x: 4.9, z: 1.8 }, yaw: 0 },
  { id: 'french-6e-word-spelling-fixture-1', name: 'la grue', place: 'archives', kind: 'commande', elements: [[0], [1]], at: { x: -3.4, z: -0.45 }, yaw: Math.PI, facade: true },
  { id: 'french-6e-grammar-spelling-fixture-1', name: 'le bac à eau', place: 'filets', kind: 'commande', elements: [[1], [0, 2]], at: { x: 2.3, z: 4.4 }, yaw: 0 },
  { id: 'french-6e-grammar-spelling-fixture-2', name: 'le portillon', place: 'filets', kind: 'quete', elements: [[0]], at: { x: -3.2, z: 2.8 }, yaw: 0 },
  { id: 'french-6e-reading-fixture-1', name: 'le poteau-lanterne', place: 'lookout', kind: 'commande', elements: [[0], [1], [2]], at: { x: 4.9, z: 2.4 }, yaw: 0 },
  { id: 'french-6e-reading-fixture-2', name: 'l’escalier', place: 'lookout', kind: 'quete', elements: [[0]], at: { x: 4.2, z: 0.8 }, yaw: 0 },
  { id: 'maths-6e-calculation-fixture-1', name: 'la boutique', place: 'quais', kind: 'commande', elements: [[0], [1], [2]], at: { x: -0.4, z: 4.1 }, yaw: 0 },
  { id: 'maths-6e-fractions-fixture-1', name: 'le lavoir', place: 'ecluses', kind: 'commande', elements: [[0], [1], [2], [3]], at: { x: 4.7, z: -1.3 }, yaw: -Math.PI / 2 },
  { id: 'maths-6e-decimals-fixture-1', name: 'le parasol', place: 'saltworks', kind: 'commande', elements: [[0], [1], [2], [3]], at: { x: 4.3, z: -1.7 }, yaw: 0 },
  { id: 'english-6e-vocabulary-fixture-1', name: 'la pendule', place: 'beacons', kind: 'commande', elements: [[0], [1]], at: { x: 5.3, z: -6.7 }, yaw: 0 },
  { id: 'english-6e-grammar-fixture-1', name: 'la vitrine', place: 'ferry', kind: 'commande', elements: [[0], [1], [2]], at: { x: -5.6, z: -0.5 }, yaw: Math.PI / 2, floor: 0.04 },
  { id: 'history-6e-antiquity-fixture-1', name: 'le tamis', place: 'ruins', kind: 'commande', elements: [[0], [1], [2]], at: { x: 1.4, z: -0.3 }, yaw: 0 },
  { id: 'geography-6e-living-fixture-1', name: 'la placette', place: 'observatory', kind: 'commande', elements: [[0], [1], [2], [3]], at: { x: 4.6, z: 2.2 }, yaw: 0, floor: 0.45 },
  { id: 'life-earth-sciences-6e-living-world-fixture-1', name: 'le nichoir', place: 'mangrove', kind: 'commande', elements: [[0], [1], [2]], at: { x: 5.7, z: 0.7 }, yaw: 0 },
  { id: 'physics-chemistry-6e-matter-energy-fixture-1', name: 'l’étagère à flacons', place: 'engine', kind: 'commande', elements: [[0], [1], [2]], at: { x: 4.3, z: 2.7 }, yaw: 0 },
  { id: 'technology-6e-objects-fixture-1', name: 'l’établi', place: 'shipyard', kind: 'commande', elements: [[1, 2], [0], [3]], at: { x: 5.0, z: 3.2 }, yaw: 0 },
  { id: 'civics-6e-democratic-society-fixture-1', name: 'l’urne', place: 'commons', kind: 'commande', elements: [[1], [0], [2]], at: { x: 3.6, z: 5.85 }, yaw: 0 },
];

/** Un aménagement par son identifiant (celui de sa petite construction). */
export const amenagementById = (id: string): Amenagement | undefined => AMENAGEMENTS.find((a) => a.id === id);

/** Les aménagements d'un lieu, dans l'ordre de la table. */
export const amenagementsOf = (place: PlaceId): Amenagement[] => AMENAGEMENTS.filter((a) => a.place === place);

/** Un aménagement posé dans le monde : ses facettes, et ses éléments (des triangles qui se suivent, dans l'ordre de la pose). */
export interface PlacedAmenagement {
  facets: Facets;
  /** Pour chaque élément, ses triangles dans `facets` : de `from` (compris) à `to` (exclu). */
  elements: { from: number; to: number }[];
}

/** Les morceaux d'un dessin : de marque en marque, en triangles. */
export function piecesOf(d: DrawnObject): { from: number; to: number }[] {
  const total = d.positions.length / 9;
  const cuts = [0, ...d.marks, total];
  return cuts.slice(0, -1).map((from, i) => ({ from, to: cuts[i + 1] }));
}

/**
 * Pose le dessin d'un aménagement dans le monde : centré sur sa forme, tourné d'un demi-tour (le devant de la grille, vers
 * −y, regarde le sud, vers la caméra), à l'échelle commune, tourné de son `yaw`, posé au plus bas du sol sous lui (il ne
 * flotte jamais ; il entre un peu dans une pente douce). Ses triangles rangés élément par élément, dans l'ordre de la pose.
 */
export function placeAmenagement(a: Amenagement, d: DrawnObject, ground: (x: number, z: number) => number): PlacedAmenagement {
  const pieces = piecesOf(d);
  let [x0, x1, z0, z1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (let k = 0; k < d.positions.length; k += 3) {
    x0 = Math.min(x0, d.positions[k]);
    x1 = Math.max(x1, d.positions[k]);
    z0 = Math.min(z0, d.positions[k + 2]);
    z1 = Math.max(z1, d.positions[k + 2]);
  }
  const [cx, cz] = [(x0 + x1) / 2, (z0 + z1) / 2];
  const s = AMENAGEMENT_SCALE;
  // Le demi-tour puis le quart de tour de l'aménagement, en un seul : (−x, −z) tourné de `yaw`.
  const c = Math.cos(a.yaw);
  const sn = Math.sin(a.yaw);
  const p = placeById(a.place).center;
  const ox = p.x + a.at.x;
  const oz = p.z + a.at.z;
  const turn = (x: number, z: number): [number, number] => [-x * c - z * sn, x * sn - z * c];
  // Sur une surface du lieu, sa hauteur ; sinon le plus bas du sol sous sa forme (ses coins, le milieu de ses bords, son milieu).
  let y = a.floor === undefined ? Infinity : standingHeight(ground(p.x, p.z)) + a.floor;
  if (a.floor === undefined)
    for (const u of [-1, 0, 1])
      for (const v of [-1, 0, 1]) {
        const [dx, dz] = turn(((x1 - x0) / 2) * u * s, ((z1 - z0) / 2) * v * s);
        y = Math.min(y, ground(ox + dx, oz + dz));
      }
  const n = d.positions.length;
  const positions = new Float32Array(n);
  const normals = new Float32Array(n);
  const colors = new Float32Array(n);
  const elements: { from: number; to: number }[] = [];
  let t = 0;
  for (const element of a.elements) {
    const from = t;
    for (const i of element) {
      for (let tri = pieces[i].from; tri < pieces[i].to; tri++, t++)
        for (let v = 0; v < 3; v++) {
          const k = (tri * 3 + v) * 3;
          const o = (t * 3 + v) * 3;
          const [dx, dz] = turn((d.positions[k] - cx) * s, (d.positions[k + 2] - cz) * s);
          positions[o] = ox + dx;
          positions[o + 1] = y + d.positions[k + 1] * s;
          positions[o + 2] = oz + dz;
          const [nx, nz] = turn(d.normals[k], d.normals[k + 2]);
          normals[o] = nx;
          normals[o + 1] = d.normals[k + 1];
          normals[o + 2] = nz;
          colors[o] = d.colors[k];
          colors[o + 1] = d.colors[k + 1];
          colors[o + 2] = d.colors[k + 2];
        }
    }
    elements.push({ from, to: t });
  }
  return { facets: { positions, normals, colors, triangles: n / 9 }, elements };
}

/**
 * La place de la remise à l'écran (le cadrage prévu du lot L1, montré en image fixe au lot L0) : celle d'une scénette
 * sans rangée de réponses (la place libérée en bas sert à l'aménagement, directeur artistique, point 4) ; en A, sous la
 * consigne jusqu'au bas de la rangée ; en B, à droite de la colonne.
 */
export function remiseStage(width: number, height: number, grand = false): ScreenBox {
  return scenetteLayout({ count: 0, grand }, width, height, questionLayout({ count: 0 }, width, height)).scenette.stage;
}

/**
 * Le site de la scénette où la remise se joue : au Phare, toujours au pied de la tour (directeur artistique, point 4 :
 * jamais sur la galerie) ; ailleurs, celui des missions.
 */
export const remisePosed = (place: PlaceId): boolean => place !== 'phare';

/**
 * Les aménagements d'un lieu se montrent-ils ? Toujours, sauf pendant une question ou une scénette (`scenette`) qui
 * cache les traces du lieu (les siennes ; au rivage nord et au large, celles des lieux du même cadre) : ils ne gênent
 * jamais la scène d'une question. Dans le cadrage de la remise (`remise`), ceux du lieu se montrent.
 */
export const showsAmenagements = (scenette: PlaceId | null, place: PlaceId, remise: PlaceId | null): boolean => remise === place || !hidesTraces(scenette, place);
