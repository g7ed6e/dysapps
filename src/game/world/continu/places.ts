// Les lieux du prototype (le Phare, les Quais, les Filets, les Écluses, les Marais salants, la Turbine, le Chantier naval) : des volumes simples dessinés par le code, en
// aplats francs (le low poly d'Archipéo), dans le repère du lieu (le centre au sol en 0, le nord vers −z). Chaque lieu
// est sa propre construction (GD-20, lot 1, « le lieu se rebâtit lui-même ») : une ruine, toujours là, puis ses
// volumes rangés par étape (le corps, le haut, les abords) et par rangée, que les parties de la grille posent
// (./construction.ts). `modelOfPlace` rend le lieu entier, ruine comprise : sa hauteur porte la marque, la brume et le
// cadenas. La ruine est délavée (pierre usée, bois gris), jamais sombre ; ce qui se pose est neuf, de couleurs
// franches. Quelques volumes de la ruine sont tombés là d'où une rangée les relèvera (la cloche du Phare, au pied de la
// tour, que la galerie raccroche) : ils s'en vont quand elle se pose. Aucun texte (rien à lire dans la 3D) ; la seule
// lumière est la lanterne du Phare (`lanternLight`, que la vue dessine sans ombre). Code pur.
import type { Stage } from './construction';
import { FacetBuilder, boundsOf, placeFacets, type Facets } from './facets';
import type { Vec2 } from './geometry';
import { placeArt } from './northShore';
import { COLORS_6E, PATH_NODES, placeById, type PlaceId } from './plan6e';
import { buildHeightField, heightAt, heightOnMesh, standingHeight } from './terrain';

/** Le modèle d'un lieu : ses facettes dans son repère, d'où il vient, et la hauteur de son sommet (la marque s'y pose). */
export interface PlaceModel {
  facets: Facets;
  /** `dessine` : les volumes de ce fichier ; `importe` : un modèle TRELLIS (pas encore). */
  source: 'dessine';
  top: number;
}

/**
 * Un volume d'un lieu : la ruine (`ruine`, là avant toute partie), ou l'étape et la rangée où il se pose (de 0 à 1, le
 * bas de la tranche qui le prend : 0, 0,34 et 0,67 pour trois rangées, 0 et 0,5 pour deux) ; son dessin. Un volume de
 * la ruine tombé là d'où une rangée le relèvera (`until`) s'en va quand elle se pose.
 */
export interface PlacePiece {
  stage: Stage | 'ruine';
  row: number;
  until?: { stage: Stage; row: number };
  draw(b: FacetBuilder): void;
}

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter sur une pente. */
const SINK = -0.8;

const C = {
  white: 0xf2eee4,
  stone: 0xb9b2a3,
  darkStone: 0x9a9488,
  // Rien de presque noir (directeur artistique, 14 octobre 2026) : l'ardoise est un gris-bleu franc.
  slate: 0x6f8089,
  // La vitre de la lanterne éteinte : claire, gris-bleu, proche de la Brume du pack (#E5EBE3).
  glass: 0xbfd0d3,
  // La lanterne allumée : la seule note chaude du monde, vue jusque depuis la Carte.
  lamp: 0xffd36b,
  // La galerie du Phare : une pierre claire, plus sombre que la tour, pour qu'elle se détache.
  gallery: 0x9aa6a8,
  bell: 0x8c9a7a,
  door: 0x7a5538,
  wood: 0xa9784a,
  darkWood: 0x8a6440,
  newWood: 0xc8955a,
  deck: 0xd9ad72,
  straw: 0xd9a441,
  wall: 0xe9dcc0,
  net: 0x8e7b5a,
  barrel: 0xb5793f,
  barrelTop: 0xc98d50,
  rust: 0xb0583a,
  water: 0x2fb5a6,
  green: 0x6fae4f,
  leaf: 0x86c062,
  // La ruine : délavée (pierre usée, bois gris, enduit passé), d'un ton moyen qui se distingue du neuf, jamais sombre.
  worn: 0xaaa08d,
  wornTop: 0x9e9482,
  wornWood: 0x9f9279,
  wornWall: 0xb9ae98,
  mud: 0xa39a85,
  // Les Marais salants (lot L5) : le sel blanc cassé (la Brume du pack, jamais un blanc pur), son ombre gris-bleu et sa
  // base ocre ; l'eau des bassins, plus claire et plus bleue que la mer ; l'argile des murets ; le sable qui les comble.
  salt: 0xe5ebe3,
  saltShade: 0xb9c4c8,
  saltBase: 0xc9a46c,
  pan: 0x5fb3e0,
  clay: 0xb59a72,
  clayTop: 0xc7ad83,
  sandFill: 0xd8bd88,
  // La Turbine (lot L6a, directeur artistique) : la brique et son ombre, le fer du carter, le cuivre des conduites, le
  // bois clair, l'eau laiteuse de la source chaude (distincte du lagon et des bassins) et ses cercles ; la vapeur, en
  // deux valeurs claires de la Brume, jamais de gris foncé. La ruine : brique et fer délavés, jamais sombres.
  brick: 0xb5653f,
  brickShade: 0x8e4a2e,
  iron: 0x2f3e48,
  copper: 0xc07a3e,
  lightWood: 0xdaa66a,
  spring: 0x8fcfc3,
  springRing: 0xbfe6dd,
  // La vapeur : la Brume du pack et son ombre, à un cran près, que rien d'autre ne prend dans le monde (`STEAM_COLORS`).
  steam: 0xe6ece4,
  steamShade: 0xc8d2cf,
  wornBrick: 0xb89a86,
  wornIron: 0x8c969b,
  wornSteel: 0xb3babd,
  // Le Chantier naval (lot L6b, directeur artistique) : le bordé et son second ton, la quille et les rails, les œuvres
  // vives terre cuite, l'ardoise du toit de l'atelier (le sable tassé du chantier est celui du sol, terrain.ts ; la cale
  // ensablée, du sable chaud des plages) ; la ruine : la quille, les rails et
  // les planches délavés, jamais sombres. Le liston est le Bleu lagon du pack (`COLORS_6E.deepSea`).
  planking: 0xc98e55,
  plankingShade: 0xb98049,
  keel: 0x8a5a36,
  bottom: 0xa4553a,
  shipSlate: 0x4d6a82,
  wornKeel: 0x9a8a78,
  wornPlank: 0xb3a68f,
} as const;

/** Les volumes d'un lieu en construction : `add(stage, row, draw)`, et `until` pour un volume tombé de la ruine. */
type Add = (stage: Stage | 'ruine', row: number, draw: (b: FacetBuilder) => void, until?: PlacePiece['until']) => void;

/** Le sol sous un point du lieu (dans son repère), depuis le sol du centre ; sur l'eau, le niveau de l'eau. */
function siteGround(id: PlaceId): { at(lx: number, lz: number): number; foot(lx: number, lz: number, r: number): { top: number; low: number }; water: number } {
  const p = placeById(id);
  const c = Math.cos(p.yaw),
    s = Math.sin(p.yaw);
  const h0 = standingHeight(heightAt(p.center));
  const world = (lx: number, lz: number): Vec2 => ({ x: p.center.x + lx * c + lz * s, z: p.center.z - lx * s + lz * c });
  const at = (lx: number, lz: number) => standingHeight(heightAt(world(lx, lz))) - h0;
  return {
    at,
    // Le plus haut du sol sous un volume (rien ne s'y enfonce) et le plus bas (sa base y descend).
    foot(lx, lz, r) {
      let top = -Infinity;
      let low = Infinity;
      for (let a = -r; a <= r + 1e-6; a += r / 2)
        for (let d = -r; d <= r + 1e-6; d += r / 2) {
          const g = at(lx + a, lz + d);
          top = Math.max(top, g);
          low = Math.min(low, g);
        }
      return { top, low };
    },
    water: -h0,
  };
}

/** La vitre de la lanterne du Phare, dans son repère : son bas, son rayon, sa hauteur. */
const LANTERN = { y: 11.1, r: 1.05, h: 1.5 } as const;

/** La cloche tombée du Phare, sur le socle à l'est de la tour, dans son repère. */
const FALLEN_BELL = { x: 2.05, z: 0.1 } as const;

/**
 * La lumière de la lanterne du Phare, dans son repère : un peu plus large que sa vitre, qu'elle recouvre, de la couleur
 * de la lampe (#FFD36B, `LAMP_COLOR`). La vue dessine cette couleur sans ombre (sa face au soleil comme sa face à
 * l'ombre) : elle se lit comme une lumière, de près, et sur la Carte une fois rapprochée (directeur artistique).
 */
export function lanternLight(): Facets {
  const b = new FacetBuilder();
  b.prism({ x: 0, y: LANTERN.y - 0.02, z: 0 }, LANTERN.r + 0.04, LANTERN.r + 0.04, LANTERN.h + 0.04, 8, C.lamp);
  return b.build();
}

/** La couleur de la lampe allumée, la seule note chaude du monde : la vue la dessine sans ombre. */
export const LAMP_COLOR = C.lamp;

/** Le rayon de la tour du Phare à la hauteur `y` : 1,7 à son pied (0,7), 1,2 sous la galerie (10,7). */
const towerRadius = (y: number) => 1.7 - (0.5 * (y - 0.7)) / 10;

/**
 * Le Phare. Avant : le socle de rochers et le moignon de la tour, au tiers, ses pierres tombées, et sa cloche tombée
 * avec elles, couchée sur le socle à l'est de la tour. Le corps : le fût blanc qui monte en trois rangs (la porte au
 * premier). Le haut : le collier, la lanterne et son toit d'ardoise. Les abords : la galerie et sa cloche raccrochée
 * (la cloche tombée s'en va), puis le muret et le jardin clos de la gardienne, bas, à l'ouest de la tour.
 */
function phare(add: Add): void {
  const g = siteGround('phare');
  add('ruine', 0, (b) => {
    b.prism({ x: 0, y: SINK, z: 0 }, 3.6, 2.9, 1.5, 7, C.darkStone);
    b.prism({ x: 0, y: 0.7, z: 0 }, 1.7, towerRadius(3.4), 2.7, 8, C.worn, C.wornTop);
    // Le haut ébréché du moignon, et des pierres tombées sur le socle (hors de la place de la scénette, devant la porte).
    b.box({ x: 0.75, y: 3.4, z: 0.7, yaw: 0.4 }, [0.8, 0.5, 0.6], C.worn, C.wornTop);
    b.box({ x: -2.35, y: 0.7, z: 0.6, yaw: 0.5 }, [0.8, 0.5, 0.6], C.worn, C.wornTop);
    b.box({ x: 2.1, y: 0.7, z: -1.3, yaw: -0.3 }, [0.6, 0.45, 0.7], C.worn, C.wornTop);
    b.box({ x: 2.45, y: 0.7, z: 0.75, yaw: 0.9 }, [0.5, 0.35, 0.45], C.worn, C.wornTop);
  });
  // La cloche tombée et sa potence brisée, couchées sur le socle parmi les pierres : la galerie les raccroche.
  add(
    'ruine',
    0,
    (b) => {
      b.prism({ x: FALLEN_BELL.x, y: 0.7 + 0.27, z: FALLEN_BELL.z, yaw: 0.9, pitch: Math.PI / 2 - 0.12 }, 0.28, 0.13, 0.55, 8, C.bell);
      b.beam({ x: 1.75, y: 0.76, z: -0.75 }, { x: 2.55, y: 0.76, z: 0.05 }, 0.1, C.slate);
    },
    { stage: 2, row: 0 },
  );
  // Le fût, en trois rangs : le premier habille le moignon (sa porte), les deux autres montent jusqu'à la galerie.
  const rings = [0.7, 4.0, 7.3, 10.7];
  for (let k = 0; k < 3; k++) {
    const y0 = rings[k],
      y1 = rings[k + 1];
    add(0, [0, 0.34, 0.67][k], (b) => {
      b.prism({ x: 0, y: y0, z: 0 }, towerRadius(y0) + (k === 0 ? 0.03 : 0), towerRadius(y1) + (k === 0 ? 0.03 : 0), y1 - y0, 8, C.white);
      if (k === 0) b.box({ x: 0, y: 0.7, z: 1.55 }, [0.9, 1.6, 0.3], C.door);
    });
  }
  add(1, 0, (b) => b.prism({ x: 0, y: 10.7, z: 0 }, 1.4, 1.4, 0.4, 8, C.gallery));
  // La vitre, éteinte ; allumée, la lumière la recouvre (`lanternLight`).
  add(1, 0.34, (b) => b.prism({ x: 0, y: LANTERN.y, z: 0 }, LANTERN.r, LANTERN.r, LANTERN.h, 8, C.glass));
  add(1, 0.67, (b) => b.prism({ x: 0, y: 12.6, z: 0 }, 1.35, 0, 1.1, 8, C.slate));
  // La galerie, large et bien marquée (sa dalle et son garde-corps), et sa cloche à l'est, sur sa potence.
  add(2, 0, (b) => {
    b.prism({ x: 0, y: 10.7, z: 0 }, 2.1, 2.1, 0.4, 8, C.gallery);
    b.prism({ x: 0, y: 11.1, z: 0 }, 2.0, 2.0, 0.45, 8, C.gallery);
    b.beam({ x: 1.9, y: 11.55, z: -0.4 }, { x: 1.9, y: 12.35, z: -0.4 }, 0.1, C.slate);
    b.beam({ x: 1.9, y: 12.35, z: -0.4 }, { x: 2.4, y: 12.35, z: -0.4 }, 0.1, C.slate);
    b.prism({ x: 2.4, y: 11.75, z: -0.4 }, 0.28, 0.13, 0.55, 8, C.bell);
  });
  // Le muret du jardin clos, ouvert à l'est, puis ses deux carrés de légumes : bas, sur le plat de l'îlot.
  const garden = { x: -6, z: 0.5, w: 3.2, d: 3.4 };
  const foot = g.foot(garden.x, garden.z, 1.8);
  add(2, 0.34, (b) => {
    const y = foot.low - 0.3;
    const h = foot.top - y + 0.55;
    const { x, z, w, d } = garden;
    b.box({ x, y, z: z - d / 2 }, [w, h, 0.3], C.stone);
    b.box({ x, y, z: z + d / 2 }, [w, h, 0.3], C.stone);
    b.box({ x: x - w / 2, y, z }, [0.3, h, d], C.stone);
    for (const side of [-1, 1]) b.box({ x: x + w / 2, y, z: z + side * (d / 2 - 0.6) }, [0.3, h, 1.2], C.stone);
  });
  add(2, 0.67, (b) => {
    for (const dx of [-0.75, 0.75]) b.box({ x: garden.x + dx, y: foot.low - 0.3, z: garden.z }, [1.0, foot.top - foot.low + 0.55, 2.4], C.darkWood, C.green);
    b.prism({ x: garden.x + 0.9, y: foot.top + 0.25, z: garden.z - 1.1 }, 0.45, 0, 0.9, 6, C.leaf);
  });
}

/**
 * Les Quais. Avant : des pieux nus dans l'eau, au bord du lagon, le pied de pierre de la grue et le hangar sans toit.
 * Le corps : le tablier du quai, en trois travées. Le haut : le toit et la porte du hangar, puis la grue en bois (son
 * mât, sa flèche vers le ponton). Les abords : les bollards, les tonneaux devant le hangar, une barque amarrée.
 */
function quais(add: Add): void {
  const g = siteGround('quais');
  const deck = { x: -5.4, w: 3.4, top: 0.6, z: [-0.9, 0.75, 2.4, 4.3] };
  add('ruine', 0, (b) => {
    for (const x of [-6.8, -4.0]) for (const z of [-0.5, 1.6, 3.8]) b.box({ x, y: g.water - 0.6, z }, [0.3, deck.top - 0.25 - g.water + 0.6, 0.3], C.wornWood);
    b.box({ x: -2.6, y: SINK, z: -1.6 }, [1.6, 1.4, 1.6], C.darkStone);
    // Les quatre murs du hangar, sans toit, la porte ouverte au sud.
    const h = { x: 3.6, z: 2.6, w: 4.2, d: 3, top: 2.8 };
    const tall = h.top - SINK;
    b.box({ x: h.x, y: SINK, z: h.z - h.d / 2 + 0.15 }, [h.w, tall, 0.3], C.wornWall, C.wornTop);
    for (const side of [-1, 1]) b.box({ x: h.x + side * (h.w / 2 - 0.15), y: SINK, z: h.z }, [0.3, tall, h.d], C.wornWall, C.wornTop);
    for (const side of [-1, 1]) b.box({ x: h.x + side * 1.4, y: SINK, z: h.z + h.d / 2 - 0.15 }, [1.4, tall, 0.3], C.wornWall, C.wornTop);
  });
  for (let k = 0; k < 3; k++)
    add(0, [0, 0.34, 0.67][k], (b) => {
      const z0 = deck.z[k],
        z1 = deck.z[k + 1];
      b.box({ x: deck.x, y: deck.top - 0.3, z: (z0 + z1) / 2 }, [deck.w, 0.3, z1 - z0 - 0.04], C.newWood, C.deck);
    });
  add(1, 0, (b) => {
    b.gableRoof({ x: 3.6, y: 2.8, z: 2.6 }, 4.6, 3.4, 1.4, C.rust, C.wall);
    b.box({ x: 3.6, y: SINK, z: 4.15 }, [1.4, 2.6 - SINK, 0.1], C.darkWood);
  });
  // La grue en bois : son mât, puis sa flèche vers le ponton (au nord-ouest), sa corde et son crochet.
  add(1, 0.34, (b) => b.box({ x: -2.6, y: 0.6, z: -1.6 }, [0.45, 6, 0.45], C.wood));
  add(1, 0.67, (b) => {
    // La flèche part du haut du mât (−2,6 ; −1,6) vers le crochet (−5,6 ; −3,5), sur cet axe.
    b.box({ x: -4.2, y: 6.3, z: -2.6, yaw: -Math.atan2(1, 1.6) }, [4.6, 0.4, 0.4], C.wood);
    b.box({ x: -5.6, y: 3.4, z: -3.5 }, [0.12, 2.9, 0.12], C.slate);
    b.box({ x: -5.6, y: 3, z: -3.5 }, [0.6, 0.4, 0.6], C.slate);
  });
  add(2, 0, (b) => {
    for (const z of [0.1, 3.4]) b.prism({ x: deck.x - deck.w / 2 + 0.3, y: deck.top, z }, 0.22, 0.22, 0.6, 6, C.slate);
  });
  add(2, 0.34, (b) => {
    for (const [x, z] of [
      [1.2, 0.5],
      [2.0, 0.9],
      [1.4, 1.5],
    ] as const) {
      const f = g.foot(x, z, 0.35);
      b.prism({ x, y: f.low - 0.2, z }, 0.36, 0.36, f.top - f.low + 1, 7, C.barrel, C.barrelTop);
    }
  });
  // La barque amarrée le long du tablier, à l'ouest, et son amarre au bollard.
  add(2, 0.67, (b) => {
    const boat = { x: deck.x - deck.w / 2 - 1.1, z: 1.75 };
    b.box({ x: boat.x, y: g.water - 0.3, z: boat.z }, [1.3, 0.75, 3.4], C.wood, C.darkWood);
    b.box({ x: boat.x, y: g.water + 0.2, z: boat.z }, [0.9, 0.12, 0.3], C.newWood);
    b.beam({ x: boat.x + 0.5, y: g.water + 0.4, z: boat.z - 1.5 }, { x: deck.x - deck.w / 2 + 0.3, y: deck.top + 0.5, z: 0.1 }, 0.06, C.net);
  });
}

/**
 * Le séchoir des Filets, dans le repère du lieu : sur le sable, à côté des cabanes, le long du rivage (à l'est), hors de
 * la porte et du chemin, au nord du plancher de la scénette. Ses deux bouts (`from`, au nord, et `to`), la hauteur de
 * sa perche et de ses pans de filet au-dessus du centre du lieu.
 */
export const FILETS_RACK = { from: { x: 0.75, z: 0.45 }, to: { x: 1.95, z: 3.85 }, bar: 2.5, pan: { bottom: 0.45, height: 1.85 } } as const;

/** Le séchoir des Filets : sa longueur, son quart de tour (le long de la perche), le milieu de chacun de ses deux pans. */
export function filetsRack(): { length: number; yaw: number; pans: [Vec2, Vec2]; posts: [Vec2, Vec2, Vec2] } {
  const { from, to } = FILETS_RACK;
  const dx = to.x - from.x,
    dz = to.z - from.z;
  const at = (k: number): Vec2 => ({ x: from.x + dx * k, z: from.z + dz * k });
  return { length: Math.hypot(dx, dz), yaw: Math.atan2(-dz, dx), pans: [at(0.25), at(0.75)], posts: [at(0), at(0.5), at(1)] };
}

/** Une barque à fond plat tirée sur le sable, dans son repère (la proue vers +x) : sa coque creuse, sa proue en pointe, son étrave, un banc. */
function beachedBoat(b: FacetBuilder, length: number, width: number): void {
  const wall = 0.16,
    h = 0.6,
    bow = 0.55 * width;
  b.box({ x: 0, y: 0, z: 0 }, [length, 0.16, width], C.darkWood, C.wood);
  for (const side of [-1, 1]) b.box({ x: 0, y: 0, z: (side * (width - wall)) / 2 }, [length, h, wall], C.darkWood, C.newWood);
  b.box({ x: -length / 2 + wall / 2, y: 0, z: 0 }, [wall, h, width], C.darkWood, C.newWood);
  // La proue : un fond en losange, deux bordés qui se rejoignent en pointe, l'étrave qui monte, penchée vers l'avant.
  const end = length / 2;
  b.prism({ x: end, y: 0, z: 0 }, width / 2, width / 2, 0.16, 4, C.darkWood, C.wood);
  const side = Math.hypot(bow, width / 2);
  const angle = Math.atan2(width / 2, bow);
  for (const k of [-1, 1]) b.box({ x: end + bow / 2, y: 0, z: (k * width) / 4, yaw: k * angle }, [side + wall / 2, h, wall], C.darkWood, C.newWood);
  b.beam({ x: end + bow - 0.05, y: 0, z: 0 }, { x: end + bow + 0.2, y: h + 0.35, z: 0 }, 0.16, C.darkWood);
  b.box({ x: 0.2, y: h - 0.2, z: 0 }, [0.3, 0.08, width - 2 * wall], C.newWood);
}

/** La barque des Filets, sur le sable au sud du séchoir, le long du rivage, la proue vers les cabanes. */
const FILETS_BOAT = { x: 3.95, z: 9.3, length: 2.3, width: 1.1 } as const;

/**
 * Les Filets. Avant : les murets de deux cabanes et les perches du séchoir couchées sur le sable. Le corps : les murs
 * des cabanes, en trois rangs (la porte au deuxième). Le haut : les toits de chaume. Les abords : le séchoir, relevé
 * sur le sable à côté des cabanes (ses perches couchées s'en vont), puis ses filets et la barque tirée sur le sable.
 */
function filets(add: Add): void {
  const g = siteGround('filets');
  const huts = [
    { x: -2.4, z: -0.6, s: 1 },
    { x: 2.2, z: -1.4, s: 0.85 },
  ] as const;
  const MURET = 0.5;
  const wallTop = (s: number) => 2.2 * s;
  const rack = filetsRack();
  add('ruine', 0, (b) => {
    for (const { x, z, s } of huts) {
      const w = 3 * s,
        d = 2.4 * s;
      // Quatre murets bas, inégaux, l'ouverture de la porte au sud.
      b.box({ x, y: SINK, z: z - d / 2 + 0.12 }, [w, MURET - SINK, 0.24], C.wornWall, C.wornTop);
      b.box({ x: x - w / 2 + 0.12, y: SINK, z }, [0.24, MURET - 0.15 - SINK, d], C.wornWall, C.wornTop);
      b.box({ x: x + w / 2 - 0.12, y: SINK, z }, [0.24, MURET + 0.1 - SINK, d], C.wornWall, C.wornTop);
      for (const side of [-1, 1]) b.box({ x: x + side * (w / 4 + 0.2), y: SINK, z: z + d / 2 - 0.12 }, [w / 2 - 0.4, MURET - 0.1 - SINK, 0.24], C.wornWall, C.wornTop);
    }
  });
  // Les perches du séchoir, couchées sur le sable là où il se relèvera : elles s'en vont quand il se relève.
  add(
    'ruine',
    0,
    (b) => {
      const { from, to } = FILETS_RACK;
      for (const [k, off] of [
        [0, -0.35],
        [1, 0.05],
        [2, 0.4],
      ] as const) {
        const a = { x: from.x + off - 0.1 * k, z: from.z + 0.2 * k };
        const c = { x: to.x + off - 0.25 * k, z: to.z - 0.3 * k };
        b.beam({ x: a.x, y: g.at(a.x, a.z) + 0.08, z: a.z }, { x: c.x, y: g.at(c.x, c.z) + 0.08, z: c.z }, 0.16, C.wornWood);
      }
    },
    { stage: 2, row: 0 },
  );
  for (let k = 0; k < 3; k++)
    add(0, [0, 0.34, 0.67][k], (b) => {
      for (const { x, z, s } of huts) {
        const y0 = MURET + ((wallTop(s) - MURET) * k) / 3;
        const y1 = MURET + ((wallTop(s) - MURET) * (k + 1)) / 3;
        b.box({ x, y: k === 0 ? SINK : y0, z }, [3 * s, y1 - (k === 0 ? SINK : y0), 2.4 * s], C.wall);
        if (k === 1) b.box({ x, y: 0, z: z + 1.21 * s }, [0.8 * s, 1.5 * s, 0.08], C.darkWood);
      }
    });
  huts.forEach(({ x, z, s }, i) =>
    add(1, i * 0.5, (b) => b.gableRoof({ x, y: wallTop(s) - 0.05, z }, 3.5 * s, 2.9 * s, 1.5 * s, C.straw, C.wall)),
  );
  // Le séchoir : trois poteaux plantés dans le sable et sa perche ; puis ses deux pans de filet et la barque.
  add(2, 0, (b) => {
    for (const p of rack.posts) b.box({ x: p.x, y: SINK, z: p.z }, [0.22, FILETS_RACK.bar + 0.2 - SINK, 0.22], C.darkWood);
    const mid = rack.posts[1];
    b.box({ x: mid.x, y: FILETS_RACK.bar, z: mid.z, yaw: rack.yaw }, [rack.length + 0.4, 0.18, 0.18], C.darkWood);
  });
  add(2, 0.5, (b) => {
    for (const p of rack.pans) b.box({ x: p.x, y: FILETS_RACK.pan.bottom, z: p.z, yaw: rack.yaw }, [rack.length / 2 - 0.25, FILETS_RACK.pan.height, 0.06], C.net);
    const f = g.foot(FILETS_BOAT.x, FILETS_BOAT.z, 1.2);
    const boat = new FacetBuilder();
    beachedBoat(boat, FILETS_BOAT.length, FILETS_BOAT.width);
    // Posée sur le sable (sa quille un peu enfoncée au plus bas), le long du rivage, la proue vers le sud.
    const yaw = Math.atan2(FILETS_RACK.to.z - FILETS_RACK.from.z, -(FILETS_RACK.to.x - FILETS_RACK.from.x)) + Math.PI;
    b.append(placeFacets(boat.build(), { x: FILETS_BOAT.x, y: f.low - 0.05, z: FILETS_BOAT.z, yaw }));
  });
}

/**
 * Les Écluses. Avant : les murs du canal, ébréchés, leurs bassins à sec, sans portes. Le corps : les murs refaits et
 * l'eau, bassin par bassin, du bas vers le haut. Le haut : la porte d'aval (celle d'amont est de la trace,
 * questionScene.ts, `placeTrace`, pour s'ouvrir), puis la passerelle. Les abords : le treuil, une roue fixe, sans
 * aucune animation, puis la petite maison de l'éclusier, en retrait au sud-est.
 */
function ecluses(add: Add): void {
  const g = siteGround('ecluses');
  const steps = [
    { z: 3, top: 0.2 },
    { z: 0, top: 0.9 },
    { z: -3, top: 1.6 },
  ];
  const BROKEN = 0.55;
  add('ruine', 0, (b) => {
    // Chaque bassin : son fond à sec, et ses quatre murs ébréchés, à des hauteurs inégales, l'un plus bas (la brèche).
    steps.forEach(({ z, top }, k) => {
      const wall = top - BROKEN;
      b.box({ x: 0, y: SINK, z }, [4.4, wall - 0.5 - SINK, 3], C.worn, C.mud);
      const cut = [0.15, 0.35, 0.05][k];
      b.box({ x: -2.0, y: SINK, z }, [0.4, wall - SINK, 3], C.worn, C.wornTop);
      b.box({ x: 2.0, y: SINK, z }, [0.4, wall - cut - SINK, 3], C.worn, C.wornTop);
      b.box({ x: 0, y: SINK, z: z - 1.3 }, [3.6, wall - 0.25 - SINK, 0.4], C.worn, C.wornTop);
      b.box({ x: -0.9, y: SINK, z: z + 1.3 }, [1.8, wall - SINK, 0.4], C.worn, C.wornTop);
      b.box({ x: 0.9, y: SINK, z: z + 1.3 }, [1.8, wall - 0.4 - SINK, 0.4], C.worn, C.wornTop);
    });
    // Des pierres tombées du haut des murs.
    b.box({ x: 2.5, y: steps[0].top - BROKEN, z: 3.6, yaw: 0.3 }, [0.6, 0.4, 0.5], C.worn, C.wornTop);
    b.box({ x: -2.5, y: steps[1].top - BROKEN, z: -0.6, yaw: -0.4 }, [0.5, 0.35, 0.6], C.worn, C.wornTop);
  });
  steps.forEach(({ z, top }, k) =>
    add(0, [0, 0.34, 0.67][k], (b) => {
      b.box({ x: 0, y: top - BROKEN, z }, [4.4, BROKEN, 3], C.stone);
      // L'eau du bassin, juste sous le bord.
      b.box({ x: 0, y: top - 0.25, z }, [3.4, 0.3, 2.2], C.stone, C.water);
    }),
  );
  // La porte d'aval, entre le sas et le bassin du bas : des vantaux de bois, leurs bornes de pierre aux gonds et leurs
  // balanciers couchés sur les murs du sas (une porte d'écluse, pas une planche).
  add(1, 0, (b) => {
    b.box({ x: 0, y: 0, z: 1.5 }, [3.6, 1.2, 0.3], C.darkWood);
    for (const side of [-1, 1]) {
      b.box({ x: side * 1.95, y: 0.9, z: 1.5 }, [0.4, 0.45, 0.4], C.darkStone, C.stone);
      b.beam({ x: side * 1.5, y: 0.99, z: 1.5 }, { x: side * 2, y: 0.99, z: 0.1 }, 0.18, C.darkWood);
    }
  });
  // La passerelle, d'un mur à l'autre au-dessus du sas, ses piles sur les murs, son garde-corps.
  add(1, 0.5, (b) => {
    const z = -0.6;
    for (const side of [-1, 1]) b.box({ x: side * 2.0, y: 0.9, z }, [0.35, 0.85, 0.35], C.stone);
    b.box({ x: 0, y: 1.75, z }, [4.4, 0.16, 0.9], C.newWood, C.deck);
    for (const side of [-1, 1]) b.box({ x: 0, y: 2.3, z: z + side * 0.4 }, [4.4, 0.08, 0.06], C.wood);
    for (const x of [-1.9, 0, 1.9]) for (const side of [-1, 1]) b.box({ x, y: 1.91, z: z + side * 0.4 }, [0.08, 0.45, 0.08], C.wood);
  });
  // Le treuil : une roue fixe, un tambour fermé (ses deux faces, leurs rayons), sur son socle de pierre, son axe porté
  // par deux piles. Elle se lit comme une roue posée, jamais comme un arc en l'air ; elle ne tourne jamais.
  add(2, 0, (b) => {
    const wheel = { x: WHEEL.x, y: WHEEL.y, z: WHEEL.z };
    b.box({ x: wheel.x, y: SINK, z: wheel.z }, [1.5, wheel.y - WHEEL.r - 0.2 - SINK, 1.8], C.darkStone, C.stone);
    for (const dx of [-0.55, 0.55]) b.box({ x: wheel.x + dx, y: SINK, z: wheel.z }, [0.3, wheel.y + 0.3 - SINK, 0.45], C.darkStone, C.stone);
    b.beam({ x: wheel.x - 0.8, y: wheel.y, z: wheel.z }, { x: wheel.x + 0.8, y: wheel.y, z: wheel.z }, 0.22, C.darkWood);
    const w = WHEEL.width / 2;
    b.drum({ x: wheel.x - w, y: wheel.y, z: wheel.z, yaw: Math.PI / 2, pitch: Math.PI / 2 }, WHEEL.r, WHEEL.width, 10, C.wood, C.darkWood);
    for (const fx of [-w - 0.012, w + 0.012])
      for (let k = 0; k < 3; k++) {
        const a = (k * Math.PI) / 3;
        const half = WHEEL.r - 0.15;
        b.box({ x: wheel.x + fx, y: wheel.y - half * Math.cos(a), z: wheel.z - half * Math.sin(a), pitch: a }, [0.024, 2 * half, 0.16], C.wood);
      }
  });
  // La maison de l'éclusier, en retrait : petite, de pierre claire, son toit d'ardoise, sa porte vers le canal.
  add(2, 0.5, (b) => {
    const h = ECLUSIER;
    const f = g.foot(h.x, h.z, 1.3);
    // Posée à mi-pente : le haut de la pente entre dans ses murs, son socle rattrape le bas.
    const base = (f.top + f.low) / 2;
    b.box({ x: h.x, y: f.low - 0.3, z: h.z }, [2.4, base - f.low + 0.3 + 0.2, 2], C.stone);
    b.box({ x: h.x, y: base + 0.2, z: h.z }, [2.2, 1.5, 1.8], C.wall);
    b.gableRoof({ x: h.x, y: base + 1.68, z: h.z }, 2.6, 2.3, 1, C.slate, C.wall);
    b.box({ x: h.x - 1.12, y: base + 0.2, z: h.z + 0.2 }, [0.08, 1.1, 0.7], C.door);
  });
}

/** La maison de l'éclusier, dans le repère des Écluses : au sud-est, sur un sol presque plat, loin des chemins. */
const ECLUSIER = { x: 6.2, z: 5.4 } as const;

/** La Roue des Écluses (le treuil), dans le repère du lieu : son axe (est-ouest), son rayon et sa largeur, fixe. */
const WHEEL = { x: 3.05, y: 1.5, z: -0.4, r: 1.5, width: 0.44 } as const;

/**
 * Les Marais salants, dans le repère du lieu (le nord vers −z, le large à l'est) : la grille des bassins, trois de front
 * sur deux rangs (`cols`, `rows` : leurs milieux ; `w`, `d` : leur taille), leurs murets d'argile (`levee`, leur largeur
 * et leur haut), et le hangar à sel au nord (son milieu, sa longueur le long du faîtage, sa profondeur, le haut de ses
 * murs, sa porte au sud).
 */
const SALTWORKS = {
  cols: [-3.4, -0.6, 2.2],
  rows: [0, 2.3],
  w: 2.8,
  d: 2.3,
  levee: { width: 0.32, top: 0.3 },
  water: 0.12,
  hangar: { x: -0.6, z: -4.1, length: 7.2, depth: 2.8, wall: 1.7, roof: 1.3 },
} as const;

/** Les deux bouts de la grille des bassins, en x et en z (le bord extérieur de ses murets). */
function saltGrid(): { x0: number; x1: number; z0: number; z1: number } {
  const S = SALTWORKS;
  return { x0: S.cols[0] - S.w / 2, x1: S.cols[2] + S.w / 2, z0: S.rows[0] - S.d / 2, z1: S.rows[1] + S.d / 2 };
}

/**
 * Un cône de sel (un mulon du décor) posé en (`x`, `z`) sur le sol `y` : trois valeurs, sa base ocre, son corps blanc
 * cassé, son sommet émoussé à l'ombre gris-bleu (le blanc ne se lit jamais en aplat) : un tronc plus court, fermé d'un
 * dessus plat, plutôt qu'une pointe (relecture du lot L5, consultant Archipéo ; 16 triangles de plus par cône).
 */
function saltCone(b: FacetBuilder, x: number, y: number, z: number, r: number): void {
  b.prism({ x, y: y - 0.1, z }, r * 1.08, r * 1.02, 0.2, 8, C.saltBase, C.saltShade);
  b.prism({ x, y: y + 0.1, z, yaw: 0.3 }, r, r * 0.42, r * 0.95, 8, C.salt, C.saltShade);
  b.prism({ x, y: y + 0.1 + r * 0.95, z, yaw: 0.3 }, r * 0.42, r * 0.2, r * 0.16, 8, C.saltShade);
}

/**
 * Les Marais salants (lot L5). Avant : des bassins comblés de sable, leurs murets écroulés, et le hangar à sel sans toit,
 * ses murs ébréchés. Le corps : les murets se relèvent et l'eau entre, rang par rang (le rang du sud, puis celui du nord
 * et les cônes de sel à l'est) ; le sable s'en va. Le haut : le hangar à sel, ses murs, puis son long toit d'ardoise
 * (l'étape qui porte les traces). Les abords : la passerelle de planches sur les bassins, et le chemin jusqu'au hangar.
 * Sur la grève plate de la côte est (terrain.ts), sans étage.
 */
function saltworks(add: Add): void {
  const S = SALTWORKS;
  const G = saltGrid();
  const L = S.levee;
  const H = S.hangar;
  const width = G.x1 - G.x0;
  const xs = [G.x0, (S.cols[0] + S.cols[1]) / 2, (S.cols[1] + S.cols[2]) / 2, G.x1];
  const rowEdge = [G.z0, (S.rows[0] + S.rows[1]) / 2, G.z1];
  // Les murets écroulés : des bouts d'argile usée, bas et inégaux, sur le pourtour et entre les bassins ; chacun s'en va
  // quand le rang qui le relève se pose (le sud au premier rang du corps, le nord au second), jamais en double avec lui.
  const south = { stage: 0, row: 0 } as const,
    north = { stage: 0, row: 0.5 } as const;
  const muret = (at: { x: number; z: number }, size: [number, number, number], until: PlacePiece['until']) =>
    add('ruine', 0, (b) => b.box({ x: at.x, y: SINK, z: at.z }, [size[0], size[1] - SINK, size[2]], C.worn, C.wornTop), until);
  muret({ x: G.x0 + 1.2, z: G.z1 }, [2.2, 0.15, L.width], south);
  muret({ x: G.x1 - 1.6, z: G.z1 }, [2.6, 0.1, L.width], south);
  muret({ x: G.x0, z: rowEdge[1] - 0.6 }, [L.width, 0.18, 2.4], north);
  muret({ x: G.x1, z: rowEdge[1] + 0.5 }, [L.width, 0.12, 2.8], south);
  muret({ x: xs[1], z: S.rows[0] + 0.3 }, [L.width, 0.08, 1.4], north);
  muret({ x: G.x0 + 3.6, z: G.z0 }, [3.2, 0.14, L.width], north);
  // Le soubassement du hangar, qui reste : ses murs s'y relèveront.
  add('ruine', 0, (b) => b.box({ x: H.x, y: SINK, z: H.z }, [H.length + 0.2, 0.12 - SINK, H.depth + 0.2], C.wornWall, C.wornTop));
  // Le hangar sans toit : ses murs ébréchés, à des hauteurs inégales, la porte ouverte au sud ; ils s'en vont quand ses
  // murs entiers se posent (le haut, premier rang).
  add(
    'ruine',
    0,
    (b) => {
      const wz = H.z + H.depth / 2 - 0.15;
      b.box({ x: H.x, y: SINK, z: H.z - H.depth / 2 + 0.15 }, [H.length, 1.1 - SINK, 0.3], C.wornWall, C.wornTop);
      b.box({ x: H.x - H.length / 2 + 0.15, y: SINK, z: H.z }, [0.3, 0.8 - SINK, H.depth], C.wornWall, C.wornTop);
      b.box({ x: H.x + H.length / 2 - 0.15, y: SINK, z: H.z }, [0.3, 1.25 - SINK, H.depth], C.wornWall, C.wornTop);
      b.box({ x: H.x - H.length / 4 - 0.4, y: SINK, z: wz }, [H.length / 2 - 0.8, 0.6 - SINK, 0.3], C.wornWall, C.wornTop);
      b.box({ x: H.x + H.length / 4 + 0.4, y: SINK, z: wz }, [H.length / 2 - 0.8, 0.95 - SINK, 0.3], C.wornWall, C.wornTop);
    },
    { stage: 1, row: 0 },
  );
  // Le sable qui comble chaque rang de bassins : il s'en va quand l'eau y entre.
  for (const k of [0, 1])
    add(
      'ruine',
      0,
      (b) => b.box({ x: (G.x0 + G.x1) / 2, y: SINK, z: (rowEdge[k] + rowEdge[k + 1]) / 2 }, [width, 0.06 - SINK, rowEdge[k + 1] - rowEdge[k]], C.sandFill),
      { stage: 0, row: k ? 0 : 0.5 },
    );
  // Le corps : chaque rang, son eau (une nappe sous les murets, qui la partagent en bassins) et ses murets relevés ; le
  // rang du sud d'abord, puis celui du nord, puis les cônes de sel, à l'est, entre les bassins et le large.
  for (const k of [1, 0])
    add(0, k ? 0 : 0.5, (b) => {
      const z0 = rowEdge[k],
        z1 = rowEdge[k + 1];
      b.box({ x: (G.x0 + G.x1) / 2, y: SINK, z: (z0 + z1) / 2 }, [width, S.water - SINK, z1 - z0], C.clay, C.pan);
      // Le muret du bord extérieur de ce rang (au sud pour le premier, au nord pour le second), puis le muret du milieu
      // avec le premier rang, et les murets en travers.
      b.box({ x: (G.x0 + G.x1) / 2, y: SINK, z: k ? z1 : z0 }, [width + L.width, L.top - SINK, L.width], C.clay, C.clayTop);
      if (k) b.box({ x: (G.x0 + G.x1) / 2, y: SINK, z: z0 }, [width, L.top - SINK, L.width], C.clay, C.clayTop);
      for (const x of xs) b.box({ x, y: SINK, z: (z0 + z1) / 2 }, [L.width, L.top - SINK, z1 - z0], C.clay, C.clayTop);
    });
  add(0, 0.67, (b) => {
    for (const [dx, dz, r] of SALT_CONES) saltCone(b, G.x1 + dx, L.top - 0.25, dz, r);
  });
  // Le haut : les murs du hangar (la porte au milieu de son long côté sud), puis son long toit d'ardoise.
  add(1, 0, (b) => {
    const wz = H.z + H.depth / 2 - 0.15;
    // La porte, face à la passerelle (sur le muret entre le premier et le deuxième bassin de chaque rang).
    const door = { x: xs[2], w: 1.3 };
    const west = H.x - H.length / 2,
      east = H.x + H.length / 2;
    b.box({ x: H.x, y: SINK, z: H.z - H.depth / 2 + 0.15 }, [H.length, H.wall - SINK, 0.3], C.wall);
    for (const side of [-1, 1]) b.box({ x: H.x + side * (H.length / 2 - 0.15), y: SINK, z: H.z }, [0.3, H.wall - SINK, H.depth - 0.6], C.wall);
    for (const [a, c] of [
      [west, door.x - door.w / 2],
      [door.x + door.w / 2, east],
    ] as const)
      b.box({ x: (a + c) / 2, y: SINK, z: wz }, [c - a, H.wall - SINK, 0.3], C.wall);
    b.box({ x: door.x, y: 1.35, z: wz }, [door.w, H.wall - 1.35, 0.3], C.wall);
    b.box({ x: door.x, y: SINK, z: wz - 0.1 }, [door.w - 0.1, 1.35 - SINK, 0.08], C.door);
  });
  add(1, 0.5, (b) => b.gableRoof({ x: H.x, y: H.wall - 0.05, z: H.z }, H.length + 0.7, H.depth + 0.9, H.roof, C.slate, C.wall));
  // Les abords : la passerelle de planches sur le muret entre les bassins, du sud jusqu'à la porte du hangar, sur ses
  // poteaux ; le chemin de sable tassé, de la porte du lieu (où arrive le chemin du réseau, plan6e.ts) au pied de la
  // passerelle.
  add(2, 0, (b) => {
    const x = xs[2];
    const z0 = G.z1 + 0.6,
      z1 = H.z + H.depth / 2 + 0.2;
    b.box({ x, y: L.top + 0.18, z: (z0 + z1) / 2 }, [0.9, 0.1, z0 - z1], C.newWood, C.deck);
    for (const z of [z0 - 0.3, G.z1, (G.z0 + G.z1) / 2, G.z0, z1 + 0.3]) b.box({ x, y: SINK, z }, [0.16, L.top + 0.18 - SINK, 0.16], C.darkWood);
  });
  add(2, 0.5, (b) => {
    // La porte du lieu, dans son repère (le lieu n'est pas tourné) : là où arrive le chemin du réseau.
    const c = placeById('saltworks').center;
    const at = PATH_NODES.find((n) => n.id === 'saltworks')!.at;
    const door = { x: at.x - c.x, z: at.z - c.z };
    const foot = { x: xs[2], z: G.z1 + 0.6 };
    const [dx, dz] = [foot.x - door.x, foot.z - door.z];
    const length = Math.hypot(dx, dz);
    b.box({ x: (door.x + foot.x) / 2, y: 0, z: (door.z + foot.z) / 2, yaw: Math.atan2(dx, dz) }, [1.1, 0.03, length + 0.5], C.mud, COLORS_6E.path);
  });
}

/**
 * La Turbine (lot L6a), dans son repère (le lieu n'est pas tourné : sa face au sud, vers la caméra) : la source chaude à
 * l'ouest (son milieu, le rayon de sa margelle, ses trois cercles à fleur d'eau : leur rayon du milieu et leur largeur) ;
 * la chaudière couchée sur son massif de briques (son bout ouest, sa longueur, son rayon, son axe à `axis` au-dessus du
 * sol, son milieu en z) ; le rotor dans son carter, à l'est (son moyeu ; le disque plein, son rayon et son épaisseur ; la
 * couronne pleine qui ferme le cercle, son rayon et son épaisseur ; les aubes en relief sur la face, leur nombre, leur
 * pied, leur largeur, `sweep` : l'avance de leur bout sur leur pied, en radians, `relief` ; le rayon et l'épaisseur du
 * carter, `rim` : la largeur de son liseré de cuivre) ; l'évent de briques et son panache ; l'arbre qui sort du carter vers
 * l'est, jusqu'à son palier.
 */
export const ENGINE = {
  spring: { x: -4.6, z: 0.6, r: 1.3, rings: [0.32, 0.6, 0.88], ring: 0.07 },
  boiler: { x0: -2.3, length: 3.1, r: 0.72, axis: 1.45, z: -0.6, massif: 0.75 },
  rotor: {
    x: 3.4,
    y: 2.55,
    z: -1,
    r: 1.8,
    depth: 0.3,
    crown: 2.15,
    crownDepth: 0.5,
    blades: 16,
    bladeFoot: 1.2,
    bladeWidth: 0.3,
    sweep: 0.14,
    relief: 0.03,
    hub: 0.5,
    casing: 2.45,
    casingDepth: 1.2,
    rim: 0.14,
  },
  vent: { x: -1.75, z: -0.6, top: 3.35 },
  shaft: { y: 1.15, to: 7 },
} as const;

/**
 * Les deux teintes du rotor de la Turbine, un acier bleuté bien plus clair que le fer du carter (le disque ; puis sa
 * couronne, son moyeu et ses aubes, plus clairs encore), que lui seul porte dans le monde : la vue fait tourner leurs
 * sommets autour de son moyeu, face au sud, dans le matériau des lieux, sans appel de plus (scene.ts, `unshadedLamp`) ; à
 * l'arrêt pendant toute question et avec « Réduire les animations ».
 */
export const ENGINE_ROTOR_COLORS = [0x7d97a4, 0xa9bcc6] as const;

/** Le moyeu du rotor de la Turbine, dans le monde : il tourne autour de lui, dans le plan face au sud (x, y). */
export function engineRotorHub(): { x: number; y: number; z: number } {
  const c = placeById('engine').center;
  const R = ENGINE.rotor;
  return { x: c.x + R.x, y: standingHeight(heightAt(c)) + R.y, z: c.z + R.z };
}

/** Un point d'un cercle du plan x, y, autour de (`cx`, `cy`), à l'angle `a`. */
const onCircle = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

/** Un contour du plan x, y dans le sens inverse des aiguilles d'une montre vu du sud (+z), comme `extrude` l'attend. */
function counterClockwise(outline: [number, number][]): [number, number][] {
  let area = 0;
  for (let k = 0; k < outline.length; k++) {
    const [x0, y0] = outline[k];
    const [x1, y1] = outline[(k + 1) % outline.length];
    area += x0 * y1 - x1 * y0;
  }
  return area < 0 ? outline.reverse() : outline;
}

/**
 * Le rotor de la Turbine, debout, sa face au sud, son moyeu en (`at.x`, `at.y`), son disque de `at.z` à `at.z + depth`
 * (directeur artistique, relecture de L6a : jamais une lame de scie) : le disque plein ; la couronne pleine qui ferme le
 * cercle, plus épaisse que lui des deux côtés ; les aubes, courtes, en relief sur la face, penchées dans le sens de la
 * marche, toutes sous la couronne (rien ne dépasse de son bord ni de son épaisseur) ; le moyeu. `colors` : le disque, puis
 * la couronne, le moyeu et les aubes ; `missing` : les aubes qui manquent (la ruine, la couronne restée entière) ;
 * `pitch` : couché à plat dans l'herbe, sa face vers le ciel.
 */
function engineRotor(b: FacetBuilder, at: { x: number; y: number; z: number; pitch?: number }, colors: readonly [number, number], missing: readonly number[] = []): void {
  const R = ENGINE.rotor;
  const [disc, rim] = colors;
  const pitch = at.pitch ?? 0;
  // Le repère du disque, avancé de `d` le long de son axe (vers sa face, au sud debout, vers le ciel couché).
  const along = (d: number) => ({ x: at.x, y: at.y - d * Math.sin(pitch), z: at.z + d * Math.cos(pitch), pitch });
  b.extrude(along(0), Array.from({ length: 16 }, (_, k) => onCircle(0, 0, R.r, (2 * Math.PI * k) / 16)), R.depth, disc);
  // La couronne : l'anneau pose sa face sur le plan x, z de son repère ; un quart de tour de plus la tourne vers le sud.
  const lip = (R.crownDepth - R.depth) / 2;
  b.annulus({ ...along(-lip), pitch: pitch + Math.PI / 2 }, R.r - 0.04, R.crown, R.crownDepth, 16, rim);
  // Le moyeu, en saillie des deux côtés, jamais plus que la couronne.
  b.extrude(along(-lip), Array.from({ length: 8 }, (_, k) => onCircle(0, 0, R.hub, (2 * Math.PI * k) / 8)), R.crownDepth, rim);
  for (let k = 0; k < R.blades; k++) {
    if (missing.includes(k)) continue;
    const a = (2 * Math.PI * k) / R.blades;
    // Une aube trapue, de son pied jusque sous la couronne, son bout en avance sur son pied : un godet vu de face.
    const foot = R.bladeWidth / 2 / R.bladeFoot;
    const tip = R.bladeWidth / 2 / R.r;
    const outline = counterClockwise([onCircle(0, 0, R.bladeFoot, a - foot), onCircle(0, 0, R.bladeFoot, a + foot), onCircle(0, 0, R.r - 0.04, a + R.sweep + tip), onCircle(0, 0, R.r - 0.04, a + R.sweep - tip)]);
    // Un aplat à peine devant la face (deux triangles par aube, au lieu de douze en volume : la maquette tient sous son
    // plafond d'environ 1 000 triangles).
    b.plate(along(R.depth + R.relief), outline, rim);
  }
}

/**
 * Le carter de la Turbine : un demi-tambour de fer qui couvre la moitié basse du rotor, devant comme derrière, sa
 * tranche plate à la hauteur du moyeu (le rotor en sort par le haut), de `at.z` à `at.z + depth`. `rim` : le liseré de
 * cuivre sur le bord de sa face au sud, l'arc et la tranche (directeur artistique : sa demi-lune se détache du rotor).
 */
function engineCasing(b: FacetBuilder, at: { x: number; y: number; z: number; pitch?: number; yaw?: number }, color: number, face: number, rim?: number): void {
  const R = ENGINE.rotor;
  const half: [number, number][] = Array.from({ length: 11 }, (_, k) => onCircle(0, 0, R.casing, Math.PI + (Math.PI * k) / 10));
  b.extrude(at, half, R.casingDepth, color, face);
  if (rim === undefined) return;
  // Un aplat à peine devant la face (sans épaisseur : on ne le voit que du sud) : dix pans le long de l'arc, et la tranche.
  const z = at.z + R.casingDepth + 0.03;
  const p = (x: number, y: number) => [at.x + x, at.y + y, z] as const;
  for (let k = 0; k < 10; k++) {
    const [a0, a1] = [Math.PI + (Math.PI * k) / 10, Math.PI + (Math.PI * (k + 1)) / 10];
    const [i0, o0, o1, i1] = [onCircle(0, 0, R.casing - R.rim, a0), onCircle(0, 0, R.casing, a0), onCircle(0, 0, R.casing, a1), onCircle(0, 0, R.casing - R.rim, a1)];
    b.quad(p(...i0), p(...o0), p(...o1), p(...i1), rim);
  }
  b.quad(p(-R.casing, -R.rim), p(R.casing, -R.rim), p(R.casing, 0), p(-R.casing, 0), rim);
}

/** La chaudière : un cylindre couché le long de x, de `x0` sur `length`, son axe à `y`, son dôme de cuivre. */
function engineBoiler(b: FacetBuilder, x0: number, y: number, z: number, color: number, hoop: number, yaw = Math.PI / 2): void {
  const B = ENGINE.boiler;
  b.drum({ x: x0, y, z, yaw, pitch: Math.PI / 2 }, B.r, B.length, 12, color, color);
  // Deux cerclages de cuivre : le cylindre se lit comme une chaudière, pas comme un bloc.
  const ax = Math.sin(yaw),
    az = Math.cos(yaw);
  for (const u of [0.45, B.length - 0.6]) b.band({ x: x0 + ax * u, y, z: z + az * u, yaw, pitch: Math.PI / 2 }, B.r + 0.05, 0.16, 12, hoop);
}

/**
 * La Turbine (lot L6a). Avant : la source bouchée de galets, sa margelle usée ; le massif de briques ébréché ; la
 * chaudière couchée dans l'herbe ; le rotor couché à plat, deux aubes manquantes, et son carter ouvert à côté. Le corps :
 * la source dégagée (son eau laiteuse, ses cercles), le massif et la chaudière redressée, puis les conduites de cuivre.
 * Le haut : le rotor dans son carter et l'arbre vers l'est, l'évent de briques, puis son panache (l'étape qui porte les
 * traces). Les abords : le chemin de la porte, un muret de pierres sèches, la rigole vers la rivière. Ce qui gît dans la
 * ruine s'en va quand ce qui le relève se pose, jamais en double. Sur le replat de la rive est (terrain.ts).
 */
function engine(add: Add): void {
  const S = ENGINE.spring;
  const B = ENGINE.boiler;
  const R = ENGINE.rotor;
  const V = ENGINE.vent;
  // La source bouchée : sa margelle usée, ébréchée, et un tas de galets dessus ; elle s'en va quand la source est dégagée.
  add(
    'ruine',
    0,
    (b) => {
      b.prism({ x: S.x, y: SINK, z: S.z }, S.r, S.r * 0.96, 0.22 - SINK, 10, C.worn, C.wornTop);
      for (const [dx, dz, r, h] of [
        [-0.3, -0.2, 0.55, 0.42],
        [0.45, 0.2, 0.42, 0.34],
        [-0.15, 0.55, 0.36, 0.28],
      ] as const)
        b.prism({ x: S.x + dx, y: 0.2, z: S.z + dz, yaw: dx }, r, r * 0.55, h, 6, C.darkStone, C.stone);
    },
    { stage: 0, row: 0 },
  );
  // Le massif ébréché : deux bouts de briques délavées, à des hauteurs inégales ; il s'en va quand le massif se relève.
  add(
    'ruine',
    0,
    (b) => {
      b.box({ x: B.x0 + 0.9, y: SINK, z: B.z }, [1.7, 0.5 - SINK, 1.5], C.wornBrick, C.wornTop);
      b.box({ x: B.x0 + 2.5, y: SINK, z: B.z + 0.1, yaw: 0.15 }, [1, 0.3 - SINK, 1.3], C.wornBrick, C.wornTop);
    },
    { stage: 0, row: 0.5 },
  );
  // La chaudière couchée dans l'herbe, au nord du massif, de travers ; relevée avec lui.
  add('ruine', 0, (b) => engineBoiler(b, B.x0 - 0.2, B.r - 0.05, B.z - 2.2, C.wornIron, C.wornIron, Math.PI / 2 - 0.35), { stage: 0, row: 0.5 });
  // Le rotor couché à plat dans l'herbe, deux aubes manquantes, et son carter ouvert à côté, sur le flanc ; le haut les
  // relève.
  add(
    'ruine',
    0,
    (b) => {
      engineRotor(b, { x: R.x - 0.6, y: 0.12, z: 2.1, pitch: -Math.PI / 2 }, [C.wornIron, C.wornSteel], [4, 5]);
      engineCasing(b, { x: R.x + 2.4, y: 0, z: -2.3, pitch: -Math.PI / 2, yaw: 0.5 }, C.wornIron, C.wornIron);
    },
    { stage: 1, row: 0 },
  );
  // Le corps : la source dégagée, sa margelle de pierre, son eau laiteuse et ses trois cercles à fleur d'eau, fins,
  // concentriques et pleins sur tout leur tour, immobiles (le bouillonnement ; elle ne fume pas). Rien au milieu que
  // l'eau claire (directeur artistique, relecture de L6a : ni secteurs ni centre sombre).
  add(0, 0, (b) => {
    b.prism({ x: S.x, y: SINK, z: S.z }, S.r, S.r, 0.32 - SINK, 10, C.darkStone, C.stone);
    b.prism({ x: S.x, y: 0.3, z: S.z }, S.r - 0.22, S.r - 0.22, 0.03, 10, C.spring);
    for (const r of S.rings) b.annulus({ x: S.x, y: 0.335, z: S.z }, r - S.ring / 2, r + S.ring / 2, 0.01, 16, C.springRing, C.springRing, false);
  });
  // Le massif de briques, la chaudière redressée dessus, son dôme de cuivre.
  add(0, 0.5, (b) => {
    b.box({ x: B.x0 + B.length / 2, y: SINK, z: B.z }, [B.length + 0.3, B.massif - SINK, 1.5], C.brickShade, C.brick);
    engineBoiler(b, B.x0, B.axis, B.z, C.iron, C.copper);
    b.prism({ x: B.x0 + B.length / 2 + 0.3, y: B.axis + B.r - 0.08, z: B.z }, 0.32, 0.26, 0.42, 8, C.copper);
  });
  // Les conduites de cuivre : de la source au pied de la chaudière ; du dôme jusqu'au carter, sur un pilier de briques
  // (la conduite ne reste jamais en l'air avant le haut).
  add(0, 0.67, (b) => {
    const dome = { x: B.x0 + B.length / 2 + 0.3, y: B.axis + B.r + 0.3, z: B.z };
    const over = { x: R.x - R.casing + 0.35, y: dome.y + 0.35, z: R.z + R.casingDepth / 2 - 0.1 };
    b.beam({ x: S.x + S.r - 0.2, y: 0.28, z: S.z }, { x: B.x0 + 0.15, y: 0.55, z: B.z + 0.35 }, 0.14, C.copper);
    b.beam(dome, { x: dome.x, y: over.y, z: dome.z }, 0.16, C.copper);
    b.beam({ x: dome.x, y: over.y, z: dome.z }, over, 0.16, C.copper);
    b.beam(over, { x: over.x, y: R.y - 0.05, z: over.z }, 0.16, C.copper);
    b.box({ x: over.x, y: SINK, z: over.z }, [0.42, R.y - 0.1 - SINK, 0.42], C.brickShade, C.brick);
  });
  // Le haut : le rotor dans son carter, sur son socle de pierre, l'arbre qui sort du carter vers l'est jusqu'à son palier.
  add(1, 0, (b) => {
    const front = R.z - R.casingDepth / 2;
    b.box({ x: R.x, y: SINK, z: R.z }, [2 * R.casing + 0.3, 0.12 - SINK, R.casingDepth + 0.4], C.darkStone, C.stone);
    engineRotor(b, { x: R.x, y: R.y, z: R.z - R.depth / 2 }, ENGINE_ROTOR_COLORS);
    engineCasing(b, { x: R.x, y: R.y, z: front }, C.iron, C.iron, C.copper);
    const shaft = ENGINE.shaft;
    b.beam({ x: R.x + R.casing - 0.2, y: shaft.y, z: R.z }, { x: shaft.to, y: shaft.y, z: R.z }, 0.16, C.iron);
    b.box({ x: shaft.to - 0.15, y: SINK, z: R.z }, [0.36, shaft.y + 0.1 - SINK, 0.5], C.brickShade, C.brick);
  });
  // L'évent de briques, à l'ouest de la chaudière, sur son massif.
  add(1, 0.5, (b) => {
    b.box({ x: V.x, y: B.axis, z: V.z }, [0.62, V.top - B.axis, 0.62], C.brickShade, C.brick);
    b.box({ x: V.x, y: V.top, z: V.z }, [0.78, 0.14, 0.78], C.brick, C.brickShade);
  });
  // Le panache : des aplats de vapeur immobiles, en deux valeurs claires, au-dessus d'un écart d'air clair (jamais collés à
  // l'évent), qui s'étirent vers l'est.
  add(1, 0.67, (b) => engineSteam(b, { x: V.x, y: V.top + 0.14 + STEAM_GAP, z: V.z }, 1.2));
  // Les abords : le chemin de sable tassé, de la porte du lieu (où arrive le chemin du réseau, plan6e.ts) jusque devant la
  // chaudière.
  add(2, 0, (b) => {
    const c = placeById('engine').center;
    const at = PATH_NODES.find((n) => n.id === 'engine')!.at;
    const door = { x: at.x - c.x, z: at.z - c.z };
    const foot = { x: B.x0 + B.length / 2, z: B.z + 1.25 };
    const [dx, dz] = [foot.x - door.x, foot.z - door.z];
    b.box({ x: (door.x + foot.x) / 2, y: 0, z: (door.z + foot.z) / 2, yaw: Math.atan2(dx, dz) }, [1.1, 0.03, Math.hypot(dx, dz) + 0.5], C.mud, COLORS_6E.path);
  });
  // Le muret de pierres sèches, bas, à l'ouest et au nord, derrière la source et la chaudière : des pierres de hauteurs
  // inégales.
  add(2, 0.5, (b) => {
    for (const [x, z, w, d, h] of ENGINE_WALL) b.box({ x, y: SINK, z, yaw: 0.04 * x }, [w, h - SINK, d], C.darkStone, C.stone);
  });
  // La rigole : l'eau de la source qui descend la pente vers la rivière, à l'ouest, bordée de pierre, jusqu'à la berge, où
  // elle se déverse dans la rivière (directeur artistique, relecture de L6a : jamais en l'air au-dessus de l'eau).
  add(2, 0.67, (b) => drawEngineRill(b));
}

/**
 * Le tracé de la rigole de la Turbine, dans le repère du lieu, d'est en ouest le long de la source (z = `ENGINE.spring.z`) :
 * ses points (x, et le haut de son eau, posé sur le sol dessiné, celui des tuiles, sous toute sa largeur), jusqu'à la
 * berge ; puis la chute, de la berge jusqu'à l'eau de la rivière (`water`), et la nappe qui s'y étale (`spill`).
 */
export function engineRill(): { points: { x: number; y: number }[]; water: number; spill: { x: number; r: number } } {
  const S = ENGINE.spring;
  const c = placeById('engine').center;
  const h0 = standingHeight(heightAt(c));
  const field = buildHeightField();
  // Le lieu n'est pas tourné : son repère est celui du monde, déplacé.
  const ground = (x: number) => Math.max(...[-RILL.half, 0, RILL.half].map((dz) => heightOnMesh(field, c.x + x, c.z + S.z + dz))) - h0;
  const water = -h0;
  const start = S.x - S.r + 0.15;
  // La berge : là où le sol dessiné descend à fleur d'eau.
  let shore = start;
  while (ground(shore - RILL.probe) > water + RILL.bank) shore -= RILL.probe;
  const n = Math.max(1, Math.ceil((start - shore) / RILL.step));
  const points = Array.from({ length: n + 1 }, (_, k) => {
    const x = start + ((shore - start) * k) / n;
    return { x, y: ground(x) + RILL.lift };
  });
  // La chute : de la berge, en pente, jusqu'à l'eau.
  points.push({ x: shore - RILL.fall, y: water + RILL.wet });
  return { points, water, spill: { x: shore - RILL.fall - RILL.spill * 0.6, r: RILL.spill } };
}

/**
 * La rigole : sa demi-largeur (pierre comprise), celle de son eau, le pas de son tracé, le pas où l'on cherche la berge,
 * le sol à la berge au-dessus de l'eau, le haut de son eau au-dessus du sol, la profondeur de ses bords sous lui, la
 * longueur de la chute, le haut de l'eau de la chute au-dessus de la rivière, le rayon de la nappe.
 */
const RILL = { half: 0.4, water: 0.21, step: 0.8, probe: 0.1, bank: 0.08, lift: 0.04, wall: 0.45, fall: 0.6, wet: 0.02, spill: 0.75 } as const;

/** Un quadrilatère tourné vers `out` (son ordre retourné s'il le faut) : la rigole suit une pente quelconque. */
function quadToward(b: FacetBuilder, q: readonly (readonly [number, number, number])[], out: readonly [number, number, number], color: number): void {
  const [a, c, d] = q;
  const u = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const facing = n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0;
  const [p0, p1, p2, p3] = facing ? q : [...q].reverse();
  b.quad(p0, p1, p2, p3, color);
}

/**
 * La rigole de la Turbine (`engineRill`) : son eau laiteuse entre deux bords de pierre, de la source à la berge, puis la
 * chute et la nappe dans la rivière, à fleur d'eau.
 */
function drawEngineRill(b: FacetBuilder): void {
  const z = ENGINE.spring.z;
  const { points, water, spill } = engineRill();
  const R = RILL;
  for (let k = 0; k + 1 < points.length; k++) {
    const [p, q] = [points[k], points[k + 1]];
    const up = [0, 1, 0] as const;
    // L'eau, puis les deux bords de pierre, un peu plus hauts ; leur flanc descend sous le sol (la marche de 0,03 entre
    // l'eau et la pierre ne se voit pas : pas de face pour elle).
    quadToward(b, [[p.x, p.y, z - R.water], [q.x, q.y, z - R.water], [q.x, q.y, z + R.water], [p.x, p.y, z + R.water]], up, C.spring);
    for (const side of [-1, 1]) {
      const [i, o] = [z + side * R.water, z + side * R.half];
      const [py, qy] = [p.y + 0.03, q.y + 0.03];
      quadToward(b, [[p.x, py, i], [q.x, qy, i], [q.x, qy, o], [p.x, py, o]], up, C.stone);
      quadToward(b, [[p.x, py, o], [q.x, qy, o], [q.x, q.y - R.wall, o], [p.x, p.y - R.wall, o]], [0, 0, side], C.darkStone);
    }
  }
  // La nappe : l'eau de la source qui s'étale dans la rivière, à fleur d'eau.
  b.prism({ x: spill.x, y: water, z }, spill.r, spill.r, R.wet, 8, C.spring);
}

/**
 * Les deux teintes de la vapeur de la Turbine (la Brume du pack, #E5EBE3, et son ombre, #C9D3D0, à un cran près, que
 * rien d'autre ne prend dans le monde) : la vue les dessine sans ombre, de leur couleur même (scene.ts, `unshadedLamp`),
 * pour que le panache et la bouffée se lisent en aplats clairs, jamais en gris foncé.
 */
export const STEAM_COLORS = [C.steam, C.steamShade] as const;

/** L'écart d'air clair entre l'évent (ou la soupape) et le premier aplat de vapeur. */
export const STEAM_GAP = 0.45;

/**
 * Un nuage de vapeur, à l'échelle `k`, son bas en `at` : des coussins arrondis (deux troncs à huit pans, l'un évasé,
 * l'autre qui se referme), le plus grand au milieu, en deux valeurs claires de la Brume, qui montent en s'étirant vers
 * l'est (le panache), ou `puffs`, d'autres coussins (la bouffée de la soupape). Immobile, sans transparence.
 */
export function engineSteam(b: FacetBuilder, at: { x: number; y: number; z: number }, k: number, puffs: readonly (readonly [number, number, number, number, number])[] = STEAM_PUFFS): void {
  for (const [dx, dy, r, h, color] of puffs) {
    const p = { x: at.x + dx * k, y: at.y + dy * k, z: at.z, yaw: 0.2 + dx };
    b.prism(p, r * k * 0.7, r * k, h * k * 0.45, 8, color, color);
    b.prism({ ...p, y: p.y + h * k * 0.45 }, r * k, r * k * 0.55, h * k * 0.55, 8, color, C.steam);
  }
}

/** Les coussins d'un nuage de vapeur : leur décalage (vers l'est, vers le haut), leur rayon, leur hauteur, leur teinte. */
const STEAM_PUFFS: readonly (readonly [number, number, number, number, number])[] = [
  [0, 0, 0.5, 0.55, C.steamShade],
  [0.55, 0.35, 0.68, 0.7, C.steam],
  [1.25, 0.62, 0.55, 0.6, C.steam],
  [1.85, 0.95, 0.4, 0.45, C.steamShade],
];

/**
 * La bouffée de la soupape (lot L6a) : trois coussins centrés sur `at` (le plus grand au milieu, un de chaque côté, un
 * peu plus haut), qui montent droit au-dessus du chapeau, jamais de biais sur le flanc de la chaudière.
 */
export const VALVE_PUFFS: readonly (readonly [number, number, number, number, number])[] = [
  [0, 0, 0.62, 0.7, C.steam],
  [-0.5, 0.22, 0.4, 0.5, C.steamShade],
  [0.5, 0.26, 0.4, 0.5, C.steamShade],
];

/** Les pierres du muret de la Turbine : leur milieu, leur largeur, leur profondeur, leur haut. */
const ENGINE_WALL: readonly (readonly [number, number, number, number, number])[] = [
  [-6.6, -1.1, 0.45, 1.5, 0.5],
  [-6.6, -2.7, 0.45, 1.6, 0.4],
  [-5.3, -3.9, 2.2, 0.45, 0.48],
  [-3.2, -3.95, 2.0, 0.45, 0.38],
  [-1.2, -3.9, 2.0, 0.45, 0.46],
];

// ---------- Le Chantier naval (lot L6b) ----------

/**
 * Le Chantier naval (lot L6b), dans son repère (le lieu n'est pas tourné : sa face au sud, vers la caméra) : la cale en
 * oblique (`angle` : son cap, de sa tête vers son pied, tourné de 40° du sud vers l'ouest ; sa tête ; sa longueur, de la
 * tête jusque sous l'eau ; l'écart de ses rails, leur section, leur lever au-dessus du sol, le nombre de ses traverses) ;
 * la coque sur sa cale, l'étrave vers la tête (où se pose son étrave le long de la cale, sa longueur, le dessous de sa
 * quille au-dessus du sol) ; l'atelier bas, au nord-est (son milieu, sa largeur d'ouest en est, sa profondeur, ses murs,
 * son toit d'ardoise, sa grande porte au sud) ; le ponton, au sud-est, sur la grève puis dans l'eau, hors du champ de la
 * scénette (son milieu en x, d'où à où il va, sa demi-largeur).
 */
export const SHIPYARD = {
  angle: (40 * Math.PI) / 180,
  slip: { x: 1.1, z: -1.1, length: 15.5, gauge: 0.92, rail: 0.16, lift: 0.1, sleepers: 6 },
  hull: { at: 1.3, length: 7.2, keel: 0.8 },
  shop: { x: 6.3, z: -3.9, w: 5.2, d: 3.4, wall: 2.5, roof: 1, door: 1.9 },
  pontoon: { x: 6.6, z0: 6, z1: 11.6, half: 0.75 },
} as const;

/** Le cap de la cale (de sa tête vers son pied), et sa normale vers le sud-est (vers la caméra), dans le plan x, z. */
export const SLIP_U = { x: -Math.sin(SHIPYARD.angle), z: Math.cos(SHIPYARD.angle) } as const;
export const SLIP_N = { x: Math.cos(SHIPYARD.angle), z: Math.sin(SHIPYARD.angle) } as const;

/** Le quart de tour d'un volume posé le long de la cale : son z local suit la cale, son x local va vers le sud-est. */
export const SLIP_YAW = -SHIPYARD.angle;

/** Un point du plan de la cale : à `s` de sa tête le long d'elle, à `b` de son axe vers le sud-est. */
export function slipPoint(s: number, b = 0): Vec2 {
  const S = SHIPYARD.slip;
  return { x: S.x + s * SLIP_U.x + b * SLIP_N.x, z: S.z + s * SLIP_U.z + b * SLIP_N.z };
}

/**
 * Les couples de la coque, de l'étrave (0) au tableau (1) : leur place le long de la coque, leur demi-largeur, la hauteur
 * du plat-bord et celle du dessous de la coque au-dessus de la quille (le pied de l'étrave se relève).
 */
const HULL_STATIONS: readonly (readonly [number, number, number, number])[] = [
  [0, 0, 2.2, 1],
  [0.16, 0.78, 1.95, 0.28],
  [0.4, 1.15, 1.78, 0],
  [0.7, 1.12, 1.78, 0],
  [1, 0.84, 1.95, 0.1],
];

/** Le couple de la coque à la part `t` de sa longueur (entre deux couples, en ligne droite). */
function hullSection(t: number): { w: number; sheer: number; rise: number } {
  const k = Math.max(0, HULL_STATIONS.findIndex((st) => st[0] >= t) - 1);
  const [t0, w0, h0, r0] = HULL_STATIONS[k];
  const [t1, w1, h1, r1] = HULL_STATIONS[Math.min(k + 1, HULL_STATIONS.length - 1)];
  const u = t1 > t0 ? Math.min(1, Math.max(0, (t - t0) / (t1 - t0))) : 0;
  return { w: w0 + (w1 - w0) * u, sheer: h0 + (h1 - h0) * u, rise: r0 + (r1 - r0) * u };
}

/**
 * Le profil d'un flanc de la coque, de la quille au plat-bord : la part de la demi-largeur et la part de la hauteur de
 * chaque arête (la quille, le bouchain, la couture du bordé, le bas du liston, le plat-bord), et la couleur de chaque
 * bande, de bas en haut (les œuvres vives, le bordé en deux tons, le liston).
 */
const HULL_PROFILE: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.8, 0.3],
  [0.97, 0.62],
  [1, 0.86],
  [0.97, 1],
];

/** Un point de la coque, dans le repère du lieu : à la part `t` de sa longueur, à `b` de son axe, à `y` du sol. */
export function hullPoint(t: number, b: number, y: number): [number, number, number] {
  const p = slipPoint(SHIPYARD.hull.at + t * SHIPYARD.hull.length, b);
  return [p.x, y, p.z];
}

/** L'arête `k` du profil du flanc `side` (+1 au sud-est, −1 au nord-ouest), au couple `t`. */
export function hullEdge(t: number, k: number, side: number): [number, number, number] {
  const s = hullSection(t);
  const [fb, fy] = HULL_PROFILE[k];
  return hullPoint(t, side * fb * s.w, SHIPYARD.hull.keel + s.rise + fy * (s.sheer - s.rise));
}

/** Un polygone convexe tourné vers `out` (son ordre retourné s'il le faut), en éventail depuis son premier sommet. */
function polyToward(b: FacetBuilder, pts: readonly (readonly [number, number, number])[], out: readonly [number, number, number], color: number): void {
  for (let k = 1; k + 1 < pts.length; k++) {
    const [a, c, d] = [pts[0], pts[k], pts[k + 1]];
    const u = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (Math.hypot(n[0], n[1], n[2]) < 1e-9) continue;
    if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0) b.triangle(a, c, d, color);
    else b.triangle(a, d, c, color);
  }
}

/**
 * La coque bordée, sur sa cale (la quille horizontale), de bas en haut. `bottom` : les fonds, la bande des œuvres vives
 * (terre cuite), vue des deux côtés (tant que les flancs ne sont pas posés, on voit dedans d'en haut). `sides` : les
 * flancs (le bordé en deux tons, le liston Bleu lagon sous le plat-bord), le pont et le tableau.
 */
function shipHull(b: FacetBuilder, part: 'bottom' | 'sides'): void {
  const bands = part === 'bottom' ? [0] : [1, 2, 3];
  const colors = [C.bottom, C.planking, C.plankingShade, COLORS_6E.deepSea];
  const ts = HULL_STATIONS.map((st) => st[0]);
  for (const side of [-1, 1]) {
    const out = [side * SLIP_N.x, 0, side * SLIP_N.z] as const;
    const inside = [-out[0], 0, -out[2]] as const;
    for (let i = 0; i + 1 < ts.length; i++)
      for (const k of bands) {
        const quad = [hullEdge(ts[i], k, side), hullEdge(ts[i + 1], k, side), hullEdge(ts[i + 1], k + 1, side), hullEdge(ts[i], k + 1, side)];
        polyToward(b, quad, out, colors[k]);
        if (part === 'bottom') polyToward(b, quad, inside, C.plankingShade);
      }
  }
  if (part === 'bottom') return;
  const top = HULL_PROFILE.length - 1;
  for (let i = 0; i + 1 < ts.length; i++) polyToward(b, [hullEdge(ts[i], top, -1), hullEdge(ts[i], top, 1), hullEdge(ts[i + 1], top, 1), hullEdge(ts[i + 1], top, -1)], [0, 1, 0], C.deck);
  // Le tableau, à l'arrière, tourné vers le pied de la cale.
  const stern = [...HULL_PROFILE.map((_, k) => hullEdge(1, top - k, -1)), ...HULL_PROFILE.slice(1).map((_, k) => hullEdge(1, k + 1, 1))];
  polyToward(b, stern, [SLIP_U.x, 0, SLIP_U.z], C.plankingShade);
}

/** La quille, le pied de l'étrave, l'étrave et l'étambot : l'échine de la coque, bordée ou nue. */
function shipSpine(b: FacetBuilder, color: number): void {
  const K = SHIPYARD.hull.keel;
  const p = (t: number, y: number) => {
    const [x, , z] = hullPoint(t, 0, 0);
    return { x, y, z };
  };
  b.beam(p(0.16, K + 0.06), p(1, K + 0.06), 0.2, color);
  b.beam(p(0.16, K + 0.06), p(0.005, K + 1), 0.18, color);
  b.beam(p(0.005, K + 1), p(-0.012, K + 2.55), 0.18, color);
  b.beam(p(1, K + 0.06), p(1.01, K + 2.05), 0.14, color);
}

/**
 * Le ber : les tins sous la quille (de `SINK` au dessous de la quille) ; `shores` : les accores, deux de chaque côté,
 * seules (les tins sont déjà là). Au sud-est, elles laissent libre le flanc où se plaque la planche de bordé de la
 * scénette, et la place de Kéo.
 */
function shipCradle(b: FacetBuilder, color: number, shores: boolean, only = false): void {
  const K = SHIPYARD.hull.keel;
  if (!only)
    for (const t of [0.3, 0.55, 0.82]) {
      const [x, , z] = hullPoint(t, 0, 0);
      b.box({ x, y: SINK, z, yaw: SLIP_YAW }, [0.62, K - 0.04 - SINK, 0.5], color);
    }
  if (!shores) return;
  for (const [side, ts] of SHORES)
    for (const t of ts) {
      const s = hullSection(t);
      const [fx, , fz] = hullPoint(t, side * (s.w + 0.8), 0);
      const [hx, hy, hz] = hullEdge(t, 2, side);
      b.beam({ x: fx, y: -0.05, z: fz }, { x: hx + side * SLIP_N.x * 0.06, y: hy - 0.15, z: hz + side * SLIP_N.z * 0.06 }, 0.13, color);
    }
}

/** Les accores de la coque : au nord-ouest, à deux couples ; au sud-est, près de l'étrave et après la planche de bordé. */
export const SHORES: readonly (readonly [number, readonly number[]])[] = [
  [-1, [0.36, 0.7]],
  [1, [0.2, 0.84]],
];

/** Les membrures nues de la ruine : à chaque couple, de la quille au bouchain puis au plat-bord, des deux côtés. */
function shipRibs(b: FacetBuilder, color: number): void {
  for (const t of [0.24, 0.44, 0.64, 0.84])
    for (const side of [-1, 1]) {
      const [k, bilge, sheer] = [0, 1, 4].map((e) => {
        const [x, y, z] = hullEdge(t, e, side);
        return { x, y, z };
      });
      b.beam(k, bilge, 0.13, color);
      b.beam(bilge, sheer, 0.13, color);
    }
}

/** Le sol dessiné sous un point du Chantier naval (dans son repère, celui du monde déplacé), depuis le sol de son centre. */
function shipyardGround(): (lx: number, lz: number) => number {
  const c = placeById('shipyard').center;
  const h0 = standingHeight(heightAt(c));
  const field = buildHeightField();
  return (lx, lz) => heightOnMesh(field, c.x + lx, c.z + lz) - h0;
}

/**
 * Les rails de la cale, de sa tête jusque sous l'eau : à chaque traverse, la hauteur du dessus du rail (le sol dessiné
 * sous la traverse, au plus haut de sa largeur, plus le lever ; sous l'eau, le fond).
 */
export function slipRails(): { s: number; y: number }[] {
  const S = SHIPYARD.slip;
  const ground = shipyardGround();
  return Array.from({ length: S.sleepers }, (_, k) => {
    const s = (S.length * k) / (S.sleepers - 1);
    const y = Math.max(...[-S.gauge, 0, S.gauge].map((b) => ground(slipPoint(s, b).x, slipPoint(s, b).z)));
    return { s, y: y + S.lift };
  });
}

/**
 * La cale : ses traverses, puis ses deux rails, d'une traverse à la suivante. Dans la ruine, `sleepers` et `rails` disent
 * ce qui reste (les traverses, les bouts de rail de la traverse `k` à la suivante), `sink` l'enfonce dans le sable.
 */
function slipway(b: FacetBuilder, rail: number, sleeper: number, ruin?: { sleepers: (k: number) => boolean; rails: (k: number) => boolean; sink: number }): void {
  const sink = ruin?.sink ?? 0;
  const S = SHIPYARD.slip;
  const pts = slipRails();
  for (const [k, p] of pts.entries()) {
    if (ruin && !ruin.sleepers(k)) continue;
    const at = slipPoint(p.s);
    b.box({ x: at.x, y: p.y - S.rail - 0.3 - sink, z: at.z, yaw: SLIP_YAW }, [S.gauge + 0.9, 0.3, 0.32], sleeper);
  }
  for (let k = 0; k + 1 < pts.length; k++) {
    if (ruin && !ruin.rails(k)) continue;
    for (const side of [-1, 1]) {
      const [p, q] = [pts[k], pts[k + 1]];
      const [a, c] = [slipPoint(p.s, (side * S.gauge) / 2), slipPoint(q.s, (side * S.gauge) / 2)];
      b.beam({ x: a.x, y: p.y - S.rail / 2 - sink, z: a.z }, { x: c.x, y: q.y - S.rail / 2 - sink, z: c.z }, S.rail, rail);
    }
  }
}

/**
 * Le Chantier naval (lot L6b). Avant : la cale ensablée, ses rails rompus ; la quille et les membrures nues sur leur ber ;
 * l'atelier sans toit, ses murs tombés à mi-hauteur ; des planches éparses sur la grève. Le corps : la cale refaite (ses
 * traverses, ses rails jusque sous l'eau), puis la coque bordée sur son ber, ses accores. Le haut : l'atelier bas, son
 * toit d'ardoise, sa grande porte. Les abords : le ponton sur la grève et dans l'eau, ses deux bittes, puis le chemin de
 * la porte (l'étape qui porte les traces). Ce qui gît dans la ruine s'en va quand ce qui le relève se pose, jamais en
 * double ; les planches éparses sont prises par le bordé. Sur la grève aplanie de la côte sud (terrain.ts).
 */
function shipyard(add: Add): void {
  const H = SHIPYARD.shop;
  const P = SHIPYARD.pontoon;
  const g = siteGround('shipyard');
  // La cale ensablée : des bouts de rail, de travers, à demi enfouis, et le sable qui les couvre ailleurs.
  add(
    'ruine',
    0,
    (b) => {
      slipway(b, C.wornKeel, C.wornWood, { sleepers: (k) => k !== 2 && k !== 4, rails: (k) => k === 0 || k === 3, sink: 0.12 });
      for (const [s, r] of [
        [5.5, 1.1],
        [9.4, 1.25],
        [1.6, 0.8],
      ] as const) {
        const at = slipPoint(s, 0.2);
        b.prism({ x: at.x, y: g.at(at.x, at.z) - 0.2, z: at.z, yaw: s }, r, r * 0.45, 0.42, 7, COLORS_6E.sand);
      }
    },
    { stage: 0, row: 0 },
  );
  // La quille et les membrures nues, sur leur ber : la quille neuve et les fonds les prennent.
  add(
    'ruine',
    0,
    (b) => {
      shipSpine(b, C.wornKeel);
      shipRibs(b, C.wornWood);
      shipCradle(b, C.wornKeel, false);
    },
    { stage: 0, row: 0.34 },
  );
  // Les planches éparses sur la grève, entre la coque et l'atelier ; le bordé des flancs les prend.
  add(
    'ruine',
    0,
    (b) => {
      for (const [x, z, yaw] of SCATTERED_PLANKS) b.box({ x, y: g.at(x, z) - 0.02, z, yaw }, [0.32, 0.08, 2.3], C.wornPlank);
    },
    { stage: 0, row: 0.67 },
  );
  // L'atelier sans toit : ses murs tombés à mi-hauteur, inégaux, la porte béante ; l'atelier les relève.
  add(
    'ruine',
    0,
    (b) => {
      const [x0, x1, z0, z1] = [H.x - H.w / 2, H.x + H.w / 2, H.z - H.d / 2, H.z + H.d / 2];
      b.box({ x: H.x, y: SINK, z: z0 + 0.1 }, [H.w, 1.5 - SINK, 0.2], C.wornWood, C.wornTop);
      b.box({ x: x0 + 0.1, y: SINK, z: H.z }, [0.2, 1.2 - SINK, H.d], C.wornWood, C.wornTop);
      b.box({ x: x1 - 0.1, y: SINK, z: H.z - 0.6 }, [0.2, 1.7 - SINK, H.d - 1.2], C.wornWood, C.wornTop);
      b.box({ x: x0 + 0.85, y: SINK, z: z1 - 0.1 }, [1.7, 0.9 - SINK, 0.2], C.wornWood, C.wornTop);
      b.box({ x: x1 - 0.7, y: SINK, z: z1 - 0.1 }, [1.4, 1.3 - SINK, 0.2], C.wornWood, C.wornTop);
    },
    { stage: 1, row: 0 },
  );
  // Le corps : la cale refaite, ses traverses et ses rails, de la tête jusque sous l'eau.
  add(0, 0, (b) => slipway(b, C.keel, C.darkWood));
  // La quille neuve sur son ber, l'étrave, l'étambot, et les fonds de la coque ; puis ses flancs bordés, son pont, son
  // tableau, et les accores qui la tiennent debout.
  add(0, 0.34, (b) => {
    shipSpine(b, C.keel);
    shipCradle(b, C.keel, false);
    shipHull(b, 'bottom');
  });
  add(0, 0.67, (b) => {
    shipHull(b, 'sides');
    shipCradle(b, C.keel, true, true);
  });
  // Le haut : l'atelier bas, ses planches et ses poteaux d'angle ; puis son toit d'ardoise ; puis sa grande porte.
  add(1, 0, (b) => {
    b.box({ x: H.x, y: SINK, z: H.z }, [H.w, H.wall - SINK, H.d], C.wood);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box({ x: H.x + sx * (H.w / 2 - 0.08), y: SINK, z: H.z + sz * (H.d / 2 - 0.08) }, [0.26, H.wall + 0.05 - SINK, 0.26], C.darkWood);
  });
  add(1, 0.34, (b) => b.gableRoof({ x: H.x, y: H.wall - 0.02, z: H.z }, H.w + 0.6, H.d + 0.7, H.roof, C.shipSlate, C.wood));
  add(1, 0.67, (b) => {
    const z = H.z + H.d / 2 + 0.04;
    for (const dx of [-0.48, 0.48]) b.box({ x: H.x + dx, y: -0.02, z }, [0.9, H.door, 0.08], C.door);
    b.box({ x: H.x, y: H.door - 0.02, z: z + 0.02 }, [2.2, 0.18, 0.14], C.darkWood);
  });
  // Les abords : le ponton, de la grève jusque dans l'eau, ses planches sur leurs pieux.
  add(2, 0, (b) => {
    const top = g.water + 0.62;
    const len = P.z1 - P.z0;
    for (let k = 0; k < 3; k++) b.box({ x: P.x - P.half + P.half / 3 + (k * 2 * P.half) / 3, y: top - 0.16, z: (P.z0 + P.z1) / 2 }, [(2 * P.half) / 3 - 0.06, 0.16, len], k % 2 ? C.deck : C.newWood);
    for (const z of PONTOON_POSTS) for (const side of [-1, 1]) b.box({ x: P.x + side * (P.half + 0.08), y: g.water - 1.3, z }, [0.2, top + 0.22 - (g.water - 1.3), 0.2], C.darkWood);
  });
  // Ses deux bittes d'amarrage, de bois sombre, sur le ponton.
  add(2, 0.34, (b) => {
    const top = g.water + 0.62;
    for (const z of [P.z0 + 2.8, P.z1 - 1.2]) {
      b.prism({ x: P.x + P.half - 0.3, y: top, z }, 0.15, 0.15, 0.4, 6, C.keel);
      b.prism({ x: P.x + P.half - 0.3, y: top + 0.4, z }, 0.22, 0.2, 0.08, 6, C.keel, C.darkWood);
    }
  });
  // Le chemin de sable tassé, de la porte du lieu jusqu'à la grande porte de l'atelier.
  add(2, 0.67, (b) => {
    const c = placeById('shipyard').center;
    const at = PATH_NODES.find((n) => n.id === 'shipyard')!.at;
    const door = { x: at.x - c.x, z: at.z - c.z };
    const foot = { x: H.x, z: H.z + H.d / 2 + 0.5 };
    const [dx, dz] = [foot.x - door.x, foot.z - door.z];
    b.box({ x: (door.x + foot.x) / 2, y: 0, z: (door.z + foot.z) / 2, yaw: Math.atan2(dx, dz) }, [1.1, 0.03, Math.hypot(dx, dz) + 0.5], C.mud, COLORS_6E.path);
  });
}

/** Les planches éparses de la ruine du Chantier naval : leur milieu, leur quart de tour. */
const SCATTERED_PLANKS: readonly (readonly [number, number, number])[] = [
  [2.6, 1.4, 0.4],
  [3.4, 0.6, 1.2],
  [1.9, 2.6, -0.5],
  [-3.6, -1.2, 0.9],
];

/** Les paires de pieux du ponton du Chantier naval, le long de lui (dans l'eau et au bord). */
const PONTOON_POSTS = [8, 9.9, 11.4] as const;

/** Les cônes de sel des Marais salants, à l'est de la grille (depuis son bord est) : écart, z, rayon. */
const SALT_CONES: readonly (readonly [number, number, number])[] = [
  [1.1, -0.3, 0.55],
  [1.3, 1.1, 0.48],
  [1.0, 2.6, 0.52],
];

/**
 * Un lieu du rivage nord (lot L7) : dessiné dans son fichier (placeArt.ts), son sol et sa porte lus ici, dans son repère.
 */
function northPlace(id: PlaceId): (add: Add) => void {
  return (add) => {
    const art = placeArt(id)!;
    const c = placeById(id).center;
    const at = PATH_NODES.find((n) => n.id === id)!.at;
    art.model(add, siteGround(id), { x: at.x - c.x, z: at.z - c.z });
  };
}

const DRAWN: Record<PlaceId, (add: Add) => void> = {
  phare,
  quais,
  filets,
  ecluses,
  saltworks,
  engine,
  shipyard,
  lookout: northPlace('lookout'),
  archives: northPlace('archives'),
  printworks: northPlace('printworks'),
};

const pieces = new Map<PlaceId, PlacePiece[]>();

/** Les volumes d'un lieu, la ruine d'abord, puis étape par étape (faits une fois par lieu). */
export function placePieces(id: PlaceId): readonly PlacePiece[] {
  let list = pieces.get(id);
  if (!list) {
    const made: PlacePiece[] = [];
    DRAWN[id]((stage, row, draw, until) => made.push(until ? { stage, row, until, draw } : { stage, row, draw }));
    list = made;
    pieces.set(id, list);
  }
  return list;
}

/** Les facettes de certains volumes d'un lieu, dans son repère. */
export function drawPieces(id: PlaceId, keep: (p: PlacePiece) => boolean): Facets {
  const b = new FacetBuilder();
  for (const p of placePieces(id)) if (keep(p)) p.draw(b);
  return b.build();
}

const ruins = new Map<PlaceId, Facets>();

/** La ruine d'un lieu, dans son repère : ce qui reste avant toute partie, sans ce qui est tombé (fait une fois). */
export function ruinOf(id: PlaceId): Facets {
  let f = ruins.get(id);
  if (!f) ruins.set(id, (f = drawPieces(id, (p) => p.stage === 'ruine' && !p.until)));
  return f;
}

const cache = new Map<PlaceId, PlaceModel>();

/**
 * Le lieu entier, dans son repère : sa ruine et toutes ses étapes (ce qui était tombé, relevé), la lanterne éteinte.
 * Sa hauteur porte la marque, la brume et le cadenas.
 */
export function modelOfPlace(id: PlaceId): PlaceModel {
  let m = cache.get(id);
  if (!m) {
    const facets = drawPieces(id, (p) => !p.until);
    m = { facets, source: 'dessine', top: boundsOf(facets).max[1] };
    cache.set(id, m);
  }
  return m;
}
