// Les lieux du prototype (le Phare, les Quais, les Filets, les Écluses, les Marais salants) : des volumes simples dessinés par le code, en
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
import { COLORS_6E, placeById, type PlaceId } from './plan6e';
import { heightAt, standingHeight } from './terrain';

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
 * cassé, sa pointe à l'ombre gris-bleu (le blanc ne se lit jamais en aplat).
 */
function saltCone(b: FacetBuilder, x: number, y: number, z: number, r: number): void {
  b.prism({ x, y: y - 0.1, z }, r * 1.08, r * 1.02, 0.2, 8, C.saltBase, C.saltShade);
  b.prism({ x, y: y + 0.1, z, yaw: 0.3 }, r, r * 0.35, r * 0.95, 8, C.salt, C.saltShade);
  b.prism({ x, y: y + 0.1 + r * 0.95, z, yaw: 0.3 }, r * 0.35, 0, r * 0.3, 8, C.saltShade);
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
  add('ruine', 0, (b) => {
    // Les murets écroulés : des bouts d'argile usée, bas et inégaux, sur le pourtour et entre les bassins.
    b.box({ x: G.x0 + 1.2, y: SINK, z: G.z1 }, [2.2, 0.15 - SINK, L.width], C.worn, C.wornTop);
    b.box({ x: G.x1 - 1.6, y: SINK, z: G.z1 }, [2.6, 0.1 - SINK, L.width], C.worn, C.wornTop);
    b.box({ x: G.x0, y: SINK, z: rowEdge[1] - 0.6 }, [L.width, 0.18 - SINK, 2.4], C.worn, C.wornTop);
    b.box({ x: G.x1, y: SINK, z: rowEdge[1] + 0.5 }, [L.width, 0.12 - SINK, 2.8], C.worn, C.wornTop);
    b.box({ x: xs[1], y: SINK, z: S.rows[0] + 0.3 }, [L.width, 0.08 - SINK, 1.4], C.worn, C.wornTop);
    b.box({ x: G.x0 + 3.6, y: SINK, z: G.z0 }, [3.2, 0.14 - SINK, L.width], C.worn, C.wornTop);
    // Le hangar sans toit : ses murs ébréchés, à des hauteurs inégales, la porte ouverte au sud.
    const wz = H.z + H.depth / 2 - 0.15;
    b.box({ x: H.x, y: SINK, z: H.z - H.depth / 2 + 0.15 }, [H.length, 1.1 - SINK, 0.3], C.wornWall, C.wornTop);
    b.box({ x: H.x - H.length / 2 + 0.15, y: SINK, z: H.z }, [0.3, 0.8 - SINK, H.depth], C.wornWall, C.wornTop);
    b.box({ x: H.x + H.length / 2 - 0.15, y: SINK, z: H.z }, [0.3, 1.25 - SINK, H.depth], C.wornWall, C.wornTop);
    b.box({ x: H.x - H.length / 4 - 0.4, y: SINK, z: wz }, [H.length / 2 - 0.8, 0.6 - SINK, 0.3], C.wornWall, C.wornTop);
    b.box({ x: H.x + H.length / 4 + 0.4, y: SINK, z: wz }, [H.length / 2 - 0.8, 0.95 - SINK, 0.3], C.wornWall, C.wornTop);
  });
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
  // poteaux ; le chemin de sable tassé, le long des bassins au sud, jusqu'au pied de la passerelle.
  add(2, 0, (b) => {
    const x = xs[2];
    const z0 = G.z1 + 0.6,
      z1 = H.z + H.depth / 2 + 0.2;
    b.box({ x, y: L.top + 0.18, z: (z0 + z1) / 2 }, [0.9, 0.1, z0 - z1], C.newWood, C.deck);
    for (const z of [z0 - 0.3, G.z1, (G.z0 + G.z1) / 2, G.z0, z1 + 0.3]) b.box({ x, y: SINK, z }, [0.16, L.top + 0.18 - SINK, 0.16], C.darkWood);
  });
  add(2, 0.5, (b) => {
    const x = xs[2];
    const z0 = G.z1 + 0.6;
    b.box({ x: (x + PATH_START) / 2, y: 0, z: z0 }, [x - PATH_START + 0.5, 0.03, 1.1], C.mud, COLORS_6E.path);
  });
}

/** Les cônes de sel des Marais salants, à l'est de la grille (depuis son bord est) : écart, z, rayon. */
const SALT_CONES: readonly (readonly [number, number, number])[] = [
  [1.1, -0.3, 0.55],
  [1.3, 1.1, 0.48],
  [1.0, 2.6, 0.52],
];

/** Le bout ouest du chemin des abords des Marais salants, le long des bassins, au sud (hors du réseau des chemins). */
const PATH_START = -4.2;

const DRAWN: Record<PlaceId, (add: Add) => void> = { phare, quais, filets, ecluses, saltworks };

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
