// Les aménagements du monde ouvert (GD-20, point 4, piste B « La remise », choisie par le mainteneur le 17 octobre 2026 ;
// lot L0, « Les aménagements posés », la 3D seule, sans geste) : les dix-neuf petites constructions du 6e (seize
// commandes, trois objets d'entraide), déjà dessinées par le code pour la grille d'Archipéo, posées chacune à son lieu,
// à une échelle commune. Ce fichier ne dessine rien : la vue (three/archipeo/amenagements.ts) trace le dessin de la
// grille dans son atelier et le lui donne en facettes brutes (`DrawnObject`) ; ici, sa place, son échelle, son quart de
// tour et sa coupe en éléments (un par ressource que la commande demande, pour la pose du lot L1).
//
// La règle des places (directeur artistique, arbitrages du 17 octobre 2026, point 4, et avis sur le lot L0, même jour) :
// une seule place par défaut, au sol, du côté de l'habitant, dans le rayon de toucher du lieu (l'objet n'est qu'une
// partie du lieu : son toucher ouvre le lieu) ; jamais sur la porte, une trace, un chemin, une passerelle, le chenal de
// la Nef, la place de l'Escale, ni un passage de la scénette (le départ d'un escalier, une passerelle) ; au Phare, au
// pied de la tour (la remise s'y joue). Un objet trop petit pour se lire se règle par sa place (plus près, dans le
// cadre), jamais par sa taille : l'échelle est commune, sans autre exception que la grue des Archives.
// - L'exception de côté : à la Gare maritime, le côté de l'habitant est pris par le pavillon et l'eau ; la vitrine est
//   sur le quai ouest, du côté de Kéo, pour ce lieu seul, hors de la bande de passage entre Kéo et l'habitant.
// - Les places sur un plancher (`floor`) : là où le sol libre manque dans le rayon, l'objet se pose sur la surface du
//   lieu, à sa hauteur, comme l'habitant (la placette sur la terrasse de l'Observatoire, le nichoir de la Mangrove sur
//   le platelage de la scénette, sur son poteau, à l'est de la botaniste, près du bord avant, hors de l'escalier et de
//   la passerelle du carbet, tourné d'un quart de tour : son pignon, son entrée et son toit à deux pentes vers la
//   caméra), et la vitrine sur le quai de la Gare maritime.
// - L'assise de pierre (`assise`) : sur une pente, l'objet ne s'enfonce jamais ; son dessus reste à plat, au plus haut
//   du sol sous lui, et une marche basse de pierre rattrape la pente jusqu'au sol (le potager du Phare, au niveau du
//   seuil du muret). Sur la dalle de la scène (`scene`, que seule la scénette pose : la cale des Balises, le quai de
//   pierre des Écluses), l'objet est à la hauteur de la dalle, sur son assise : à la marche, elle le porte ; dans la
//   remise, elle est dans la dalle.
// - Le quai de la scène (`quai`) : au-delà d'une marche basse (0,3), à la marche, on ne dessine pas de socle ; on dessine
//   aussi le morceau du sol de la scène qui porte l'objet (directeur artistique, troisième passe, point C). Le lavoir des
//   Écluses : le morceau du quai de pierre du sas sous lui, même pierre, même dessus, même hauteur que dans la remise,
//   assez large pour qu'il y paraisse posé ; à fleur du sol en haut de la pente (est), un mur de quai droit en bas (ouest
//   et sud), contre l'assise de la maison de l'éclusier ; hors de l'axe de sa porte, la table au sud de lui.
// - Hors du rayon de toucher : là où l'habitant de la scénette l'est lui-même, le directeur artistique met l'objet près
//   de lui (la boutique des Quais, à droite du docker ; le lavoir des Écluses, entre l'éclusière et sa maison, hors de
//   l'axe de la porte ; le nichoir de la Mangrove, à l'est de la botaniste) : leur toucher se tranche au lot L1.
// - La potence de façade (`facade`) : la grue des Archives s'appuie sur le bâtiment, contre le pilier d'angle gauche
//   de la colonnade, du côté opposé aux Quais ; elle se mesure à la façade (le haut de son mât juste sous
//   l'architrave), jamais à l'habitant : la seule exception à l'échelle et à la règle de hauteur, écrite dans le test.
// Le potager du Phare prolonge le jardin clos par l'ouverture de son muret. Les lanternes (celle d'entraide du Phare,
// le poteau-lanterne de la Vigie) restent éteintes : leurs vitres en verre mat (la vue les peint, `MATTE_GLASS`). Code
// pur.
import { FacetBuilder, boundsOf, mergeFacets, type Facets } from './facets';
import type { Vec2 } from './geometry';
import { hidesTraces, placeById, type PlaceId } from './plan6e';
import { questionLayout, type ScreenBox } from './questionScene';
import { remisePose, scenetteHabitant, scenetteLayout } from './scenette';
import type { CameraPose } from './camera';
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

/** La pierre de l'assise : celle du muret du jardin du Phare et de la cale des Balises (son dessus, son flanc). */
export const ASSISE_STONE = { dessus: 0xb9b2a3, cote: 0x9a9488 } as const;

/** Les triangles d'une assise : un pavé sans dessous. */
export const ASSISE_TRIANGLES = 10;

/** La pierre du quai de la scène (le quai du sas des Écluses, scenette.ts, `lockQuay`) : son dessus, son flanc. */
export const QUAI_STONE = { dessus: 0xb9b2a3, cote: 0x8f897d } as const;

/** Les triangles du morceau de quai de la scène : un pavé sans dessous. */
export const QUAI_TRIANGLES = 10;

/**
 * Le dessus du morceau de quai, sous la dalle de la scène (dans la remise, elle le couvre : jamais deux faces l'une sur
 * l'autre) ; l'assise de l'objet y entre d'autant (`QUAI.sink`), un rien, et dépasse de lui juste ce qu'elle dépasse de la dalle.
 */
const QUAI = { drop: 0.02, sink: 0.05 } as const;

/** Le débord de l'assise autour de la forme de l'objet (une marche basse), et ce qu'elle entre sous le sol au plus bas. */
const ASSISE = { rim: 0.06, sink: 0.12 } as const;

/** Sur la dalle de la scène, l'assise dépasse un peu de la dalle : jamais deux faces l'une sur l'autre. */
const SCENE_LIFT = 0.03;

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
   * Posé sur une surface du lieu, et non sur le terrain (la terrasse de l'Observatoire, le platelage de la Mangrove, le
   * quai de la Gare maritime, le socle de la façade des Archives) : la hauteur de son dessus au-dessus du pied du lieu
   * (`standingHeight` du sol en son centre).
   */
  floor?: number;
  /** Sur une pente : à plat, au plus haut du sol sous sa forme, sur une assise de pierre qui rattrape la pente. */
  assise?: true;
  /** Sur la dalle de la scène de la remise (les Balises), à sa hauteur, sur une assise de pierre qui le porte à la marche. */
  scene?: true;
  /**
   * Sur la dalle de la scène, là où son assise dépasserait le sol de plus d'une marche basse (0,3) à la marche : le
   * morceau du quai de la scène qui le porte, dessiné aussi à la marche (le lavoir des Écluses), ses bords en x et en z
   * depuis le centre du lieu. Son dessus, celui de la dalle ; son pied, sous le sol au plus bas.
   */
  quai?: { x: readonly [number, number]; z: readonly [number, number] };
  /**
   * Adossé à une façade (la grue des Archives, en potence) : la seule exception à la règle de hauteur, écrite dans le
   * test ; son échelle (`scale`) la mesure à la façade, le haut de son mât juste sous l'architrave.
   */
  facade?: true;
  /** Son échelle, si ce n'est pas l'échelle commune : la potence de façade seule. */
  scale?: number;
  /**
   * Dans le cadrage de la remise, la marge gardée de part et d'autre de lui, en unités du monde, si elle doit être plus
   * large que la marge commune (le potager du Phare : au moins sa largeur jusqu'au bord du cadre).
   */
  frame?: number;
}

/**
 * Les dix-neuf aménagements du 6e, un lieu chacun (deux au Phare, aux Filets et à la Vigie : la commande et l'objet
 * d'entraide). Les places, relevées sur le plan des lieux et vérifiées par le test (three/archipeo/amenagements.test.ts) ;
 * tranchées par le directeur artistique lieu par lieu sur les captures du lot L0 (avis du 17 octobre 2026).
 */
export const AMENAGEMENTS: readonly Amenagement[] = [
  // Le Phare : le potager dans le prolongement du jardin clos de la gardienne (à l'ouest de la tour), par l'ouverture de
  // son muret, à plat au niveau du seuil, sur son assise côté tour ; la lanterne d'entraide sur son banc, au pied de la
  // tour, à côté de la porte. Dans la remise, au moins sa largeur jusqu'au bord gauche du cadre.
  { id: 'french-6e-phonology-fixture-1', name: 'le potager', place: 'phare', kind: 'commande', elements: [[0], [1], [2]], at: { x: -3.65, z: 0.5 }, yaw: 0, assise: true, frame: 1.4 },
  { id: 'french-6e-phonology-fixture-2', name: 'la lanterne', place: 'phare', kind: 'quete', elements: [[0, 1]], at: { x: 3.0, z: 3.4 }, yaw: 0 },
  { id: 'french-6e-letter-confusion-fixture-1', name: 'le puits', place: 'printworks', kind: 'commande', elements: [[0], [1], [2], [3]], at: { x: 4.9, z: 1.8 }, yaw: 0 },
  { id: 'french-6e-word-spelling-fixture-1', name: 'la grue', place: 'archives', kind: 'commande', elements: [[0], [1]], at: { x: -3.644, z: -2.187 }, yaw: 0, floor: 0.32, facade: true, scale: 1.08 },
  { id: 'french-6e-grammar-spelling-fixture-1', name: 'le bac à eau', place: 'filets', kind: 'commande', elements: [[1], [0, 2]], at: { x: 2.3, z: 4.4 }, yaw: 0 },
  { id: 'french-6e-grammar-spelling-fixture-2', name: 'le portillon', place: 'filets', kind: 'quete', elements: [[0]], at: { x: -3.2, z: 2.8 }, yaw: 0 },
  { id: 'french-6e-reading-fixture-1', name: 'le poteau-lanterne', place: 'lookout', kind: 'commande', elements: [[0], [1], [2]], at: { x: 4.4, z: 2.5 }, yaw: 0 },
  { id: 'french-6e-reading-fixture-2', name: 'l’escalier', place: 'lookout', kind: 'quete', elements: [[0]], at: { x: 4.2, z: 1.1 }, yaw: 0 },
  { id: 'maths-6e-calculation-fixture-1', name: 'la boutique', place: 'quais', kind: 'commande', elements: [[0], [1], [2]], at: { x: 6.0, z: 9.8 }, yaw: 0 },
  { id: 'maths-6e-fractions-fixture-1', name: 'le lavoir', place: 'ecluses', kind: 'commande', elements: [[0], [1], [2], [3]], at: { x: 4.42, z: 4.7 }, yaw: 0, scene: true, quai: { x: [2.8, 5.05], z: [4.2, 5.24] } },
  { id: 'maths-6e-decimals-fixture-1', name: 'le parasol', place: 'saltworks', kind: 'commande', elements: [[0], [1], [2], [3]], at: { x: 4.3, z: -1.7 }, yaw: 0 },
  { id: 'english-6e-vocabulary-fixture-1', name: 'la pendule', place: 'beacons', kind: 'commande', elements: [[0], [1]], at: { x: 3.45, z: -6.6 }, yaw: 0, scene: true },
  { id: 'english-6e-grammar-fixture-1', name: 'la vitrine', place: 'ferry', kind: 'commande', elements: [[0], [1], [2]], at: { x: -5.3, z: 0.8 }, yaw: Math.PI / 3, floor: 0.04 },
  { id: 'history-6e-antiquity-fixture-1', name: 'le tamis', place: 'ruins', kind: 'commande', elements: [[0], [1], [2]], at: { x: 1.4, z: -0.3 }, yaw: 0 },
  { id: 'geography-6e-living-fixture-1', name: 'la placette', place: 'observatory', kind: 'commande', elements: [[0], [1], [2], [3]], at: { x: 4.6, z: 2.2 }, yaw: 0, floor: 0.45 },
  { id: 'life-earth-sciences-6e-living-world-fixture-1', name: 'le nichoir', place: 'mangrove', kind: 'commande', elements: [[0], [1, 3], [2]], at: { x: 9.3, z: -1.3 }, yaw: -Math.PI / 2, floor: 0.3 },
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
  /** La hauteur de son pied (le dessus de son assise, s'il en a une). */
  base: number;
  /** Sa boîte dans le monde, sans son assise (celle que le cadrage de la remise prend). */
  box: WorldBox;
  /** Son assise de pierre, s'il en a une, et le morceau de quai sous elle : leurs triangles, au début du premier élément. */
  assise?: { from: number; to: number };
  /** Le dessus du morceau de quai de la scène sous lui, s'il en a un. */
  quai?: number;
}

/** Les morceaux d'un dessin : de marque en marque, en triangles. */
export function piecesOf(d: DrawnObject): { from: number; to: number }[] {
  const total = d.positions.length / 9;
  const cuts = [0, ...d.marks, total];
  return cuts.slice(0, -1).map((from, i) => ({ from, to: cuts[i + 1] }));
}

/**
 * Pose le dessin d'un aménagement dans le monde : centré sur sa forme, tourné d'un demi-tour (le devant de la grille, vers
 * −y, regarde le sud, vers la caméra), à son échelle, tourné de son `yaw`. Sa hauteur : sur la surface de son lieu
 * (`floor`), sur la dalle de la scène (`scene`), au plus haut du sol sous sa forme (`assise`), ou au plus bas (il ne
 * flotte jamais ; il entre un peu dans une pente douce). Ses triangles rangés élément par élément, dans l'ordre de la
 * pose ; son assise de pierre, s'il en a une, avec le premier.
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
  const s = a.scale ?? AMENAGEMENT_SCALE;
  // Le demi-tour puis le quart de tour de l'aménagement, en un seul : (−x, −z) tourné de `yaw`.
  const c = Math.cos(a.yaw);
  const sn = Math.sin(a.yaw);
  const p = placeById(a.place).center;
  const ox = p.x + a.at.x;
  const oz = p.z + a.at.z;
  const turn = (x: number, z: number): [number, number] => [-x * c - z * sn, x * sn - z * c];
  // Le sol sous sa forme (ses coins, le milieu de ses bords, son milieu) : son plus bas et son plus haut.
  const [hx, hz] = [((x1 - x0) / 2) * s, ((z1 - z0) / 2) * s];
  let [low, high] = [Infinity, -Infinity];
  const steps = a.assise ? [-1, -0.5, 0, 0.5, 1] : [-1, 0, 1];
  for (const u of steps)
    for (const v of steps) {
      const [dx, dz] = turn(hx * u, hz * v);
      const g = ground(ox + dx, oz + dz);
      low = Math.min(low, g);
      high = Math.max(high, g);
    }
  const y =
    a.floor !== undefined
      ? standingHeight(ground(p.x, p.z)) + a.floor
      : a.scene
        ? scenetteHabitant(a.place, remisePosed(a.place)).y + SCENE_LIFT
        : a.assise
          ? high
          : low;
  // Sur la pente, l'assise déborde un peu (une marche basse) ; sous la dalle de la scène, elle reste sous sa forme.
  const rim = a.assise ? ASSISE.rim : 0;
  // Sur le morceau de quai de la scène, l'assise y entre un rien : elle ne descend plus jusqu'au sol.
  const quaiTop = a.quai ? y - SCENE_LIFT - QUAI.drop : undefined;
  const assise = a.assise || a.scene ? assiseFacets(turn, ox, oz, hx + rim, hz + rim, quaiTop !== undefined ? quaiTop - QUAI.sink : low - ASSISE.sink, y) : null;
  const stone = assise && a.quai && quaiTop !== undefined ? mergeFacets([quaiFacets(a.quai, p, quaiTop, ground), assise]) : assise;
  const n = d.positions.length;
  const extra = stone ? stone.positions.length : 0;
  const positions = new Float32Array(n + extra);
  const normals = new Float32Array(n + extra);
  const colors = new Float32Array(n + extra);
  const elements: { from: number; to: number }[] = [];
  let t = 0;
  if (stone) {
    positions.set(stone.positions);
    normals.set(stone.normals);
    colors.set(stone.colors);
    t = stone.triangles;
  }
  for (const [e, element] of a.elements.entries()) {
    const from = e === 0 ? 0 : t;
    for (const i of element) {
      const piece = pieces[i];
      // Une marque manquante (`at.part()` oublié dans le dessin) : le dit, plutôt que de planter plus loin.
      if (!piece) throw new Error(`Aménagement ${a.id} : l’élément ${e} demande le morceau ${i}, mais le dessin n’en a que ${pieces.length} (une marque manque)`);
      for (let tri = piece.from; tri < piece.to; tri++, t++)
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
  const facets = { positions, normals, colors, triangles: t };
  const from = stone ? stone.positions.length : 0;
  const box = boundsOf({ ...facets, positions: positions.subarray(from) });
  return { facets, elements, base: y, box, ...(stone ? { assise: { from: 0, to: stone.triangles } } : {}), ...(quaiTop !== undefined ? { quai: quaiTop } : {}) };
}

/**
 * Le morceau du quai de la scène sous un objet, à la marche : un pavé sans dessous, de ses bords (depuis le centre du
 * lieu `c`), son dessus en `top`, son pied sous le sol au plus bas sous lui (relevé tous les quarts d'unité) : en bas de
 * la pente, un mur de quai droit ; en haut, à fleur du sol.
 */
function quaiFacets(q: NonNullable<Amenagement['quai']>, c: Vec2, top: number, ground: (x: number, z: number) => number): Facets {
  const [x0, x1, z0, z1] = [c.x + q.x[0], c.x + q.x[1], c.z + q.z[0], c.z + q.z[1]];
  const [nx, nz] = [Math.ceil((x1 - x0) / 0.25), Math.ceil((z1 - z0) / 0.25)];
  let low = Infinity;
  for (let i = 0; i <= nx; i++) for (let k = 0; k <= nz; k++) low = Math.min(low, ground(x0 + ((x1 - x0) * i) / nx, z0 + ((z1 - z0) * k) / nz));
  const bottom = low - ASSISE.sink;
  const b = new FacetBuilder();
  b.box({ x: (x0 + x1) / 2, y: bottom, z: (z0 + z1) / 2 }, [x1 - x0, top - bottom, z1 - z0], QUAI_STONE.cote, QUAI_STONE.dessus);
  return b.build();
}

/**
 * L'assise de pierre sous un aménagement : un pavé sans dessous, de sa forme élargie d'un débord, son dessus sous lui
 * (en `top`), son pied sous le sol au plus bas (en `bottom`) ; tourné comme lui.
 */
function assiseFacets(turn: (x: number, z: number) => [number, number], ox: number, oz: number, hx: number, hz: number, bottom: number, top: number): Facets {
  const b = new FacetBuilder();
  b.box({ x: 0, y: bottom, z: 0 }, [2 * hx, top - bottom, 2 * hz], ASSISE_STONE.cote, ASSISE_STONE.dessus);
  const f = b.build();
  for (let k = 0; k < f.positions.length; k += 3) {
    const [x, z] = turn(f.positions[k], f.positions[k + 2]);
    f.positions[k] = ox + x;
    f.positions[k + 2] = oz + z;
    const [nx, nz] = turn(f.normals[k], f.normals[k + 2]);
    f.normals[k] = nx;
    f.normals[k + 2] = nz;
  }
  return f;
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
 * Le cadrage de la remise de `place` sur un écran de `width` × `height` : les aménagements du lieu (`list`, ceux déjà là
 * et celui qui se pose, avec leur boîte) entiers dans la scène de la remise, l'habitant et Kéo avec eux. La scène le
 * calcule à l'entrée de la remise, et de nouveau quand l'écran change de taille (une tablette qui tourne pendant la
 * pose : relecture du code du lot L1), sans refaire la scénette.
 */
export function remiseFrame(place: PlaceId, list: readonly { a: Pick<Amenagement, 'frame'>; box: WorldBox }[], width: number, height: number): { pose: CameraPose; shift: { x: number; y: number } } {
  return remisePose(place, remiseInclude(list), remiseStage(width, height), width, height, remisePosed(place));
}

/** Une boîte dans le monde : son plus petit et son plus grand coin, en x, y, z. */
export interface WorldBox {
  min: readonly number[];
  max: readonly number[];
}

/**
 * Ce que le cadrage de la remise doit prendre, en plus de l'habitant et de Kéo : la boîte des aménagements posés du lieu,
 * élargie en x de la marge de ceux qui en demandent une (`frame` : le potager du Phare, au moins sa largeur jusqu'au
 * bord du cadre) ; vide s'il n'y en a aucun.
 */
export function remiseInclude(list: readonly { a: Pick<Amenagement, 'frame'>; box: WorldBox }[]): WorldBox {
  if (!list.length) return { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  const min = [0, 1, 2].map((k) => Math.min(...list.map(({ a, box }) => box.min[k] - (k === 0 ? (a.frame ?? 0) : 0))));
  const max = [0, 1, 2].map((k) => Math.max(...list.map(({ a, box }) => box.max[k] + (k === 0 ? (a.frame ?? 0) : 0))));
  return { min, max };
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
