// Les lieux du prototype (le Phare, les Quais, les Filets, les Écluses) : des volumes simples dessinés par le code, en
// aplats francs (le low poly d'Archipéo), dans le repère du lieu (le centre au sol en 0, le nord vers −z). Chaque lieu
// est sa propre construction (GD-20, lot 1, « le lieu se rebâtit lui-même ») : une ruine, toujours là, puis ses
// volumes rangés par étape (le corps, le haut, les abords) et par rangée, que les parties de la grille posent
// (./construction.ts). `modelOfPlace` rend le lieu entier, ruine comprise : sa hauteur porte la marque, la brume et la
// scénette. La ruine est délavée (pierre usée, bois gris), jamais sombre ; ce qui se pose est neuf, de couleurs
// franches. Aucun texte (rien à lire dans la 3D) ; la seule lumière est la lanterne du Phare, allumée quand son haut est
// posé. Code pur.
import type { Stage } from './construction';
import { FacetBuilder, boundsOf, type Facets } from './facets';
import type { Vec2 } from './geometry';
import { placeById, type PlaceId } from './plan6e';
import { heightAt, standingHeight } from './terrain';

/** Le modèle d'un lieu : ses facettes dans son repère, d'où il vient, et la hauteur de son sommet (la marque s'y pose). */
export interface PlaceModel {
  facets: Facets;
  /** `dessine` : les volumes de ce fichier ; `importe` : un modèle TRELLIS (pas encore). */
  source: 'dessine';
  top: number;
}

/** Ce qui change le dessin d'un volume : la lanterne du Phare allumée (son haut posé). */
export interface PieceLook {
  lit: boolean;
}

/**
 * Un volume d'un lieu : la ruine (`ruine`, là avant toute partie), ou l'étape et la rangée où il se pose (de 0 à 1, le
 * bas de la tranche qui le prend : 0, 0,34 et 0,67 pour trois rangées, 0 et 0,5 pour deux) ; son dessin.
 */
export interface PlacePiece {
  stage: Stage | 'ruine';
  row: number;
  draw(b: FacetBuilder, look: PieceLook): void;
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
} as const;

/** Les volumes d'un lieu en construction : `add(stage, row, draw)`. */
type Add = (stage: Stage | 'ruine', row: number, draw: (b: FacetBuilder, look: PieceLook) => void) => void;

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

/** Le rayon de la tour du Phare à la hauteur `y` : 1,7 à son pied (0,7), 1,2 sous la galerie (10,7). */
const towerRadius = (y: number) => 1.7 - (0.5 * (y - 0.7)) / 10;

/**
 * Le Phare. Avant : le socle de rochers et le moignon de la tour, au tiers, ses pierres tombées. Le corps : le fût
 * blanc qui monte en trois rangs (la porte au premier). Le haut : le collier, la lanterne (allumée une fois posée) et
 * son toit d'ardoise. Les abords : la galerie et sa cloche, puis le muret et le jardin clos de la gardienne, bas, à
 * l'ouest de la tour.
 */
function phare(add: Add): void {
  const g = siteGround('phare');
  add('ruine', 0, (b) => {
    b.prism({ x: 0, y: SINK, z: 0 }, 3.6, 2.9, 1.5, 7, C.darkStone);
    b.prism({ x: 0, y: 0.7, z: 0 }, 1.7, towerRadius(3.4), 2.7, 8, C.worn, C.wornTop);
    // Le haut ébréché du moignon, et deux pierres tombées sur le socle.
    b.box({ x: 0.75, y: 3.4, z: 0.7, yaw: 0.4 }, [0.8, 0.5, 0.6], C.worn, C.wornTop);
    b.box({ x: -2.1, y: 0.7, z: 1.5, yaw: 0.5 }, [0.8, 0.5, 0.6], C.worn, C.wornTop);
    b.box({ x: 2.1, y: 0.7, z: -1.3, yaw: -0.3 }, [0.6, 0.45, 0.7], C.worn, C.wornTop);
  });
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
  add(1, 0.34, (b, look) => b.prism({ x: 0, y: 11.1, z: 0 }, 1.05, 1.05, 1.5, 8, look.lit ? C.lamp : C.glass));
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
    b.box({ x: -4.2, y: 6.3, z: -2.6, yaw: Math.atan2(1, 1.6) }, [4.6, 0.4, 0.4], C.wood);
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
 * Les Filets. Avant : les murets de deux cabanes et des perches couchées dans le sable. Le corps : les murs des cabanes,
 * en trois rangs (la porte au deuxième). Le haut : les toits de chaume. Les abords : le séchoir et ses filets, une
 * barque tirée sur le sable.
 */
function filets(add: Add): void {
  const g = siteGround('filets');
  const huts = [
    { x: -2.4, z: -0.6, s: 1 },
    { x: 2.2, z: -1.4, s: 0.85 },
  ] as const;
  const MURET = 0.5;
  const wallTop = (s: number) => 2.2 * s;
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
    for (const dz of [0, 0.35, 0.7]) b.beam({ x: -2.6, y: 0.08, z: 1.9 + dz }, { x: 2.3, y: 0.08, z: 2.2 + dz }, 0.16, C.wornWood);
  });
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
  // Le séchoir : trois poteaux et sa perche ; puis ses deux pans de filet et la barque tirée sur le sable, à l'ouest.
  add(2, 0, (b) => {
    for (const x of [-2.6, 0, 2.6]) b.box({ x, y: SINK, z: 2.4 }, [0.22, 3 - SINK, 0.22], C.darkWood);
    b.box({ x: 0, y: 2.8, z: 2.4 }, [5.6, 0.18, 0.18], C.darkWood);
  });
  add(2, 0.5, (b) => {
    b.box({ x: -1.3, y: 0.6, z: 2.4 }, [2.4, 2.1, 0.06], C.net);
    b.box({ x: 1.3, y: 0.6, z: 2.4 }, [2.4, 2.1, 0.06], C.net);
    const f = g.foot(-5.5, 0.5, 1.2);
    b.box({ x: -5.5, y: f.low - 0.3, z: 0.5, yaw: 0.5 }, [1.2, f.top - f.low + 1.1, 3], C.wood, C.darkWood);
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

const DRAWN: Record<PlaceId, (add: Add) => void> = { phare, quais, filets, ecluses };

const pieces = new Map<PlaceId, PlacePiece[]>();

/** Les volumes d'un lieu, la ruine d'abord, puis étape par étape (faits une fois par lieu). */
export function placePieces(id: PlaceId): readonly PlacePiece[] {
  let list = pieces.get(id);
  if (!list) {
    const made: PlacePiece[] = [];
    DRAWN[id]((stage, row, draw) => made.push({ stage, row, draw }));
    list = made;
    pieces.set(id, list);
  }
  return list;
}

/** Les facettes de certains volumes d'un lieu, dans son repère. */
export function drawPieces(id: PlaceId, keep: (p: PlacePiece) => boolean, look: PieceLook): Facets {
  const b = new FacetBuilder();
  for (const p of placePieces(id)) if (keep(p)) p.draw(b, look);
  return b.build();
}

const ruins = new Map<PlaceId, Facets>();

/** La ruine d'un lieu, dans son repère : ce qui reste avant toute partie (faite une fois). */
export function ruinOf(id: PlaceId): Facets {
  let f = ruins.get(id);
  if (!f) ruins.set(id, (f = drawPieces(id, (p) => p.stage === 'ruine', { lit: false })));
  return f;
}

const cache = new Map<PlaceId, PlaceModel>();

/**
 * Le lieu entier, dans son repère : sa ruine et toutes ses étapes, la lanterne éteinte (la scénette l'allume). Sa
 * hauteur porte la marque, la brume et le cadenas ; la scénette d'un lieu le montre entier.
 */
export function modelOfPlace(id: PlaceId): PlaceModel {
  let m = cache.get(id);
  if (!m) {
    const facets = drawPieces(id, () => true, { lit: false });
    m = { facets, source: 'dessine', top: boundsOf(facets).max[1] };
    cache.set(id, m);
  }
  return m;
}
