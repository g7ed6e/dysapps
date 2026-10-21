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
import type { PlaceId } from './levelPlan';
import { placeById as placeOfAnyLevel } from './levelPlan';
import { heightFor } from './placeGround';
import { PATH_NODES_4E } from './plan4e';
import { PATH_NODES_5E } from './plan5e';
import { COLORS_6E, PATH_NODES, placeById, type PlaceId as PlaceId6e } from './plan6e';
import { RUINS_4E } from './ruins4e';
import { buildHeightField, heightAt, heightOnMesh, standingHeight } from './terrain';
import { landDistance } from './terrain';

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
  // Le toit de la lanterne du Phare : une ardoise brune et chaude (consultant Archipéo, 19 octobre 2026 : vu de dos, son
  // pan à l'ombre ne tombe plus dans le gris-noir).
  lanternRoof: 0x8f7766,
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
  // La ruine du Phare : le blanc passé de sa tour (un cran sous le blanc du fût neuf) et la pierre chaude de son socle.
  wornWhite: 0xe6e0d2,
  wornWhiteTop: 0xd6cebd,
  socle: 0xb3a690,
  socleTop: 0xc4b8a2,
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
  // Le fer usé de la ruine (la chaudière couchée, le rotor à plat) : rouillé, vers la pierre chaude des abords (STONE,
  // surroundingsKit.ts), jamais un gris-bleu froid (consultant Archipéo, 19 octobre 2026).
  wornIron: 0xa39480,
  wornSteel: 0xc4b6a0,
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
  // Les membrures nues de la ruine (évaluation du directeur artistique, 18 octobre 2026 : « un peu plus sombres ») : le
  // bois gris de la ruine, un cran plus brun et plus sombre, jamais presque noir.
  wornShipRib: 0x86775f,
  // La Mangrove (lot L8a, directeur artistique) : le feuillage des palétuviers et son ombre (ni l'herbe ni le haut de
  // falaise), leurs troncs et leurs racines, la vase (plus sombre que la boue de ruine, jamais presque noire), les
  // passerelles en deux bois et leurs pieux, les cordes des rambardes, les palmes du carbet.
  leafMangrove: 0x2e6e4e,
  leafMangroveShade: 0x24583f,
  mangroveWood: 0x7a6a58,
  vase: 0x7d735b,
  walkway: 0xb98654,
  walkwayLight: 0xc9965f,
  walkwayDark: 0x8a6440,
  cord: 0xe0d3b0,
  palm: 0xa88f48,
  palmShade: 0x8f793b,
  // Les Ruines (lot L8b, directeur artistique) : la pierre des Passeurs, un calcaire clair, et son ombre (plus claires que
  // les tons délavés de la ruine, pour que la pierre relevée se lise ; une seule valeur de base pour les Ruines, la table
  // d'orientation de l'Observatoire et la Halle, directeur artistique, L8) ; le bronze des clés (plus sombre et plus brun que
  // le cuivre de la Turbine) ; les dalles noyées, la pierre vue à travers l'eau claire du lagon (un aplat juste au-dessus
  // de l'eau, aucun appel de plus) ; le bois des planches de la fouille.
  passeurStone: 0xdcd0b5,
  passeurShade: 0xb9a988,
  bronze: 0x9c7a3c,
  drownedStone: 0xa8d4c0,
  digSand: 0xcdb58a,
  // L'Observatoire (lot L8c, directeur artistique) : l'enduit du tambour et son ombre, ramenés du rose pâle vers le Sable
  // du pack (#DAA66A ; abords de l'Observatoire, deuxième passe du directeur artistique, 18 octobre 2026 : sous le soleil
  // chaud, le rose virait à la terre cuite), le zinc clair de la coupole et ses côtes, les volets Bleu lagon ; sa table
  // d'orientation, de la pierre des Passeurs (`passeurStone`, plus haut). La ruine :
  // l'enduit, le zinc et les volets délavés, d'un ton moyen, jamais sombres ; la corde coupée.
  plaster: 0xe0bf94,
  plasterShade: 0xc4a074,
  zinc: 0xb7c3c8,
  rib: 0x8e9da4,
  shutter: 0x178078,
  wornPlaster: 0xc4ad8e,
  wornPlasterTop: 0xb59f82,
  wornZinc: 0xa9b1b3,
  wornRib: 0x9aa3a6,
  wornShutter: 0x6f9e98,
  cutRope: 0xc9b38a,
  // La Halle (lot L8d, directeur artistique) : les tuiles vernissées Vert île et leur ombre (ni l'ardoise de l'école, ni
  // le bardeau de l'assemblage), la charpente de chêne, le dallage de la pierre des Passeurs (le même que les Ruines). La
  // ruine : la pierre, le dallage et les tuiles délavés, d'un ton moyen, jamais sombres.
  tile: 0x438b82,
  tileShade: 0x356f68,
  oak: 0x8e6a48,
  paving: 0xd6cebc,
  // Relecture du 19 octobre 2026 : vue de dos, la ruine se lisait sombre et froide ; les tuiles tombées passent à un
  // vert d'eau clair, les piliers usés à une pierre chaude plus claire (leurs faces à l'ombre restent lisibles).
  wornTile: 0xa9cdbd,
  wornPasseurs: 0xcdbd9f,
  wornPasseursTop: 0xd9cbb0,
  wornPaving: 0xbdb6a6,
} as const;

/** Les volumes d'un lieu en construction : `add(stage, row, draw)`, et `until` pour un volume tombé de la ruine. */
type Add = (stage: Stage | 'ruine', row: number, draw: (b: FacetBuilder) => void, until?: PlacePiece['until']) => void;

/** Le sol sous un point du lieu (dans son repère), depuis le sol du centre ; sur l'eau, le niveau de l'eau. */
function siteGround(id: PlaceId): { at(lx: number, lz: number): number; foot(lx: number, lz: number, r: number): { top: number; low: number }; water: number } {
  const p = placeOfAnyLevel(id);
  const height = heightFor(id);
  const c = Math.cos(p.yaw),
    s = Math.sin(p.yaw);
  const h0 = standingHeight(height(p.center));
  const world = (lx: number, lz: number): Vec2 => ({ x: p.center.x + lx * c + lz * s, z: p.center.z - lx * s + lz * c });
  const at = (lx: number, lz: number) => standingHeight(height(world(lx, lz))) - h0;
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

/**
 * Le jardin clos de la gardienne du Phare, depuis le centre du lieu : son milieu, sa largeur (x) et sa profondeur (z),
 * et la longueur de chacun des deux pans de son muret est, de part et d'autre de l'ouverture. Le potager du monde ouvert
 * le prolonge par cette ouverture (world/continu/amenagements.ts, GD-20, point 4).
 */
export const PHARE_GARDEN = { x: -6, z: 0.5, w: 3.2, d: 3.4, eastWall: 1.2 } as const;

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
  // La ruine du Phare dit encore une tour blanche (directeur artistique, évaluation du 18 octobre 2026 : « rien ne dit
  // phare même en ruine ») : le moignon et ses pierres d'un blanc passé, le socle d'une pierre chaude, jamais sombre.
  add('ruine', 0, (b) => {
    b.prism({ x: 0, y: SINK, z: 0 }, 3.6, 2.9, 1.5, 7, C.socle, C.socleTop);
    b.prism({ x: 0, y: 0.7, z: 0 }, 1.7, towerRadius(3.4), 2.7, 8, C.wornWhite, C.wornWhiteTop);
    // Le haut ébréché du moignon, et des pierres tombées sur le socle (hors de la place de la scénette, devant la porte).
    b.box({ x: 0.75, y: 3.4, z: 0.7, yaw: 0.4 }, [0.8, 0.5, 0.6], C.wornWhite, C.wornWhiteTop);
    b.box({ x: -2.35, y: 0.7, z: 0.6, yaw: 0.5 }, [0.8, 0.5, 0.6], C.wornWhite, C.wornWhiteTop);
    b.box({ x: 2.1, y: 0.7, z: -1.3, yaw: -0.3 }, [0.6, 0.45, 0.7], C.wornWhite, C.wornWhiteTop);
    b.box({ x: 2.45, y: 0.7, z: 0.75, yaw: 0.9 }, [0.5, 0.35, 0.45], C.wornWhite, C.wornWhiteTop);
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
  add(1, 0.67, (b) => b.prism({ x: 0, y: 12.6, z: 0 }, 1.35, 0, 1.1, 8, C.lanternRoof));
  // La galerie, large et bien marquée (sa dalle et son garde-corps), et sa cloche à l'est, sur sa potence.
  add(2, 0, (b) => {
    b.prism({ x: 0, y: 10.7, z: 0 }, 2.1, 2.1, 0.4, 8, C.gallery);
    b.prism({ x: 0, y: 11.1, z: 0 }, 2.0, 2.0, 0.45, 8, C.gallery);
    b.beam({ x: 1.9, y: 11.55, z: -0.4 }, { x: 1.9, y: 12.35, z: -0.4 }, 0.1, C.slate);
    b.beam({ x: 1.9, y: 12.35, z: -0.4 }, { x: 2.4, y: 12.35, z: -0.4 }, 0.1, C.slate);
    b.prism({ x: 2.4, y: 11.75, z: -0.4 }, 0.28, 0.13, 0.55, 8, C.bell);
  });
  // Le muret du jardin clos, ouvert à l'est, puis ses deux carrés de légumes : bas, sur le plat de l'îlot.
  const garden = PHARE_GARDEN;
  const foot = g.foot(garden.x, garden.z, 1.8);
  add(2, 0.34, (b) => {
    const y = foot.low - 0.3;
    const h = foot.top - y + 0.55;
    const { x, z, w, d } = garden;
    b.box({ x, y, z: z - d / 2 }, [w, h, 0.3], C.stone);
    b.box({ x, y, z: z + d / 2 }, [w, h, 0.3], C.stone);
    b.box({ x: x - w / 2, y, z }, [0.3, h, d], C.stone);
    for (const side of [-1, 1]) b.box({ x: x + w / 2, y, z: z + side * (d / 2 - garden.eastWall / 2) }, [0.3, h, garden.eastWall], C.stone);
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
 * chaudière couchée dans l'herbe ; le rotor couché à plat, deux aubes manquantes (son carter n'y gît plus). Le corps :
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
  // Le rotor couché à plat dans l'herbe, deux aubes manquantes ; le haut le relève. Son carter ne gît plus sur le flanc,
  // au nord-est (directeur artistique, 18 octobre 2026 : la masse de fer, de dos, bouchait la vue comme un rocher).
  add('ruine', 0, (b) => engineRotor(b, { x: R.x - 0.6, y: 0.12, z: 2.1, pitch: -Math.PI / 2 }, [C.wornIron, C.wornSteel], [4, 5]), { stage: 1, row: 0 });
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
      shipRibs(b, C.wornShipRib);
      shipCradle(b, C.wornKeel, false);
    },
    { stage: 0, row: 0.34 },
  );
  // Les planches éparses sur la grève, entre la coque et l'atelier ; le bordé des flancs les prend.
  add(
    'ruine',
    0,
    (b) => {
      for (const [x, z, yaw] of SCATTERED_PLANKS) b.box({ x, y: g.at(x, z) + 0.01, z, yaw }, [0.32, 0.08, 2.3], C.wornPlank);
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

/**
 * L'Observatoire (lot L8c), dans son repère (le lieu n'est pas tourné : sa face au sud, vers la caméra) : la terrasse
 * (son rayon, le haut de sa dalle, ses dix pans) ; le tambour (son rayon, la hauteur de sa première rangée, son haut, ses
 * douze pans, un pan plein au sud) et sa corniche ; les baies (leur bas et leur haut au-dessus du sol, leur largeur, les
 * pans qui en ont une : est, sud, ouest, nord) ; la porte (son pan, au sud-est) ; la coupole (son rayon, ses côtes) et
 * son épi ; la ruine, arasée à mi-hauteur (son plus haut, l'épaisseur de son mur, le faîte de chacun de ses douze pans,
 * de l'est vers le sud) ; l'escalier vers la grève (son pan de terrasse, à l'ouest-sud-ouest).
 */
export const OBSERVATORY = {
  terrace: { r: 6.6, top: 0.45, sides: 10 },
  drum: { r: 3.2, mid: 1.7, top: 3.3, sides: 12 },
  cornice: { r: 3.42, h: 0.3 },
  bay: { bottom: 1.05, top: 2.55, width: 1.1, angles: [0, 90, 180, 270] },
  door: { angle: 60, width: 0.95, height: 2.5 },
  dome: { r: 3.1, ribs: 6, spire: 0.75 },
  ruin: { top: 1.6, wall: 0.35, crest: [1.45, 1.15, 1.35, 1.6, 1.0, 1.35, 1.25, 0.9, 1.5, 1.3, 1.1, 1.55] },
  stair: { angle: 162, steps: 3, depth: 0.45, width: 1.5 },
} as const;

/** La table d'orientation de l'Observatoire, sur la terrasse, au nord-est, hors du cadre de la scénette. */
export const OBSERVATORY_TABLE = { x: 2.8, z: -4.6 } as const;

/** Les côtes tombées de l'Observatoire, en tas au nord du tambour : le centre de l'arc de chacune et son rayon. */
const RUIN_RIBS: readonly (readonly [number, number, number])[] = [
  [-2.2, -3.0, 1.6],
  [-2.05, -3.15, 1.5],
  [-2.35, -2.9, 1.75],
  [-2.15, -3.1, 1.65],
];

/** Le quart de tour des pans du tambour : un pan plein au sud (les sommets de son prisme à 15° de part et d'autre). */
const DRUM_YAW = Math.PI / 12;

/** La distance du centre au milieu d'un pan du tambour de rayon `r` (douze pans). */
export const drumFace = (r: number): number => r * Math.cos(Math.PI / 12);

/** Un point à l'angle `deg` (en degrés, de l'est vers le sud) et au rayon `r`, au sol du repère. */
const polar = (deg: number, r: number) => ({ x: r * Math.cos((deg * Math.PI) / 180), z: r * Math.sin((deg * Math.PI) / 180) });

/** Le quart de tour qui tourne la face +z d'un volume vers l'angle `deg` (le dehors d'un pan). */
const facing = (deg: number) => Math.atan2(Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180));

/**
 * Les côtes de la coupole : des lattes à plat sur ses méridiens, un peu en saillie sur le zinc, des deux faces (avant le
 * zinc, on les voit de partout : une cage de côtes), de la corniche jusqu'au pied de l'épi. Elles suivent le profil à
 * facettes du zinc (`domeShell`), au milieu de ses pans, et non la demi-sphère qu'il approche : collées au zinc jusqu'en
 * haut, jamais détachées en traits fins près de l'épi (relecture de L8c-d).
 */
function domeRibs(b: FacetBuilder, base: number): void {
  const D = OBSERVATORY.dome;
  const lift = 0.03;
  // Le profil du zinc au milieu d'un pan (douze pans) : les cercles de ses troncs, puis le pied de l'épi, sur le cône du
  // haut ; chaque point un peu soulevé, selon la normale du zinc.
  const apothem = Math.cos(Math.PI / 12);
  const profile: (readonly [number, number])[] = [0, 30, 60].map((d) => [D.r * Math.cos((d * Math.PI) / 180) * apothem, D.r * Math.sin((d * Math.PI) / 180)] as const);
  const [lr, ly] = profile[2];
  const foot = 0.13;
  profile.push([foot, ly + (D.r - ly) * (1 - foot / lr)]);
  const lifted = profile.map(([pr, py], j) => {
    const prev = profile[Math.max(0, j - 1)];
    const next = profile[Math.min(profile.length - 1, j + 1)];
    const [tr, ty] = [next[0] - prev[0], next[1] - prev[1]];
    const n = Math.hypot(tr, ty);
    return [pr + (lift * ty) / n, py - (lift * tr) / n] as const;
  });
  for (let k = 0; k < D.ribs; k++) {
    const a = (2 * Math.PI * k) / D.ribs + Math.PI / 6;
    const [ca, sa] = [Math.cos(a), Math.sin(a)];
    const at = (j: number, side: number): [number, number, number] => [ca * lifted[j][0] - sa * 0.07 * side, base + lifted[j][1], sa * lifted[j][0] + ca * 0.07 * side];
    for (let j = 0; j + 1 < lifted.length; j++) {
      const quad = [at(j, -1), at(j, 1), at(j + 1, 1), at(j + 1, -1)] as const;
      const [dr, dy] = [lifted[j + 1][0] - lifted[j][0], lifted[j + 1][1] - lifted[j][1]];
      const out = [ca * dy, -dr, sa * dy] as const;
      quadToward(b, quad, out, C.rib);
      quadToward(b, quad, [-out[0], -out[1], -out[2]], C.rib);
    }
  }
}

/** La coupole de zinc : une demi-sphère en trois troncs à douze pans, sur la corniche, de `base` à son sommet. */
function domeShell(b: FacetBuilder, base: number): void {
  const r = OBSERVATORY.dome.r;
  const rings = [0, 30, 60, 90].map((d) => (d * Math.PI) / 180);
  for (let j = 0; j + 1 < rings.length; j++) {
    const [p, q] = [rings[j], rings[j + 1]];
    const top = j + 2 === rings.length ? 0 : r * Math.cos(q);
    b.prism({ x: 0, y: base + r * Math.sin(p), z: 0, yaw: DRUM_YAW }, r * Math.cos(p), top, r * (Math.sin(q) - Math.sin(p)), 12, C.zinc);
  }
}

/** Les deux volets d'une baie du tambour, fermés, sur le pan à l'angle `deg` (le milieu du pan à `r`). */
function closedShutters(b: FacetBuilder, deg: number, r: number): void {
  const B = OBSERVATORY.bay;
  const yaw = facing(deg);
  const c = polar(deg, r + 0.07);
  // Le long du pan (l'axe x du volume tourné).
  const t = { x: Math.cos(yaw), z: -Math.sin(yaw) };
  for (const side of [-1, 1]) {
    const dx = side * (B.width / 4 + 0.01);
    b.box({ x: c.x + t.x * dx, y: B.bottom, z: c.z + t.z * dx, yaw }, [B.width / 2 - 0.02, B.top - B.bottom, 0.06], C.shutter);
  }
}

/**
 * L'Observatoire (lot L8c), un belvédère couvert sur le tertre de la pointe sud, plus large que haut : une rotonde basse
 * (le tambour d'enduit rose pâle, ses grandes baies aux volets Bleu lagon, sa corniche) sous une coupole de zinc en
 * demi-sphère, ses côtes et un épi court, sans lanterneau ; ni fente, ni lunette, ni étoile. Avant (éteint par le
 * temps et la mer) : le tambour arasé à mi-hauteur, ses baies vides ; les côtes de la coupole en tas et le zinc empilé sur le
 * tertre, au nord, une corde coupée près d'eux ; des volets couchés à l'ouest. Le corps : le tambour en deux rangées, ses
 * baies, puis ses volets fermés, sa corniche et sa porte. Le haut : les côtes, puis le zinc et l'épi. Les abords (l'étape
 * qui porte les traces) : la terrasse dallée et le chemin de la porte, puis son parapet, la table d'orientation (un
 * disque de bronze lisse sur un pied de pierre : ni lettre, ni flèche, ni rayon) et l'escalier vers la grève. Ce qui
 * est tombé dans la ruine s'en va quand ce qui le relève se pose, jamais en double. Rien ne tourne : la coupole est fixe.
 */
function observatory(add: Add): void {
  const T = OBSERVATORY.terrace;
  const D = OBSERVATORY.drum;
  const B = OBSERVATORY.bay;
  const domeBase = D.top + OBSERVATORY.cornice.h;
  // Le tambour arasé, ouvert en haut (relecture de L8c-d : jamais une boîte au couvercle plat) : un mur d'enduit usé avec
  // son épaisseur, pan par pan, au faîte irrégulier (des pans plus bas que d'autres, tous sous la première rangée du
  // corps, qui le couvre) ; ses baies vides, un appui et deux tableaux, rien de peint ; la porte, un vide entre deux
  // tableaux. D'un ton moyen, jamais sombre. La première rangée du corps le remplace (il ne reste pas caché dedans).
  add(
    'ruine',
    0,
    (b) => {
      const R = OBSERVATORY.ruin;
      const out = drumFace(D.r - 0.03);
      const pan = 2 * (D.r - 0.03) * Math.sin(Math.PI / 12);
      for (const [k, h] of R.crest.entries()) {
        const deg = 30 * k;
        const yaw = facing(deg);
        const c = polar(deg, out - R.wall / 2);
        // Le long du pan (l'axe x du volume tourné).
        const t = { x: Math.cos(yaw), z: -Math.sin(yaw) };
        const bay = (B.angles as readonly number[]).includes(deg);
        const opening = bay ? B.width : deg === OBSERVATORY.door.angle ? OBSERVATORY.door.width : 0;
        if (!opening) {
          b.box({ x: c.x, y: SINK, z: c.z, yaw }, [pan, h - SINK, R.wall], C.wornPlaster, C.wornPlasterTop);
          continue;
        }
        // Les deux tableaux de l'ouverture, l'un plus haut que l'autre ; l'appui d'une baie (une porte n'en a pas).
        const jamb = (pan - opening) / 2;
        for (const side of [-1, 1]) {
          const dx = side * (opening / 2 + jamb / 2);
          b.box({ x: c.x + t.x * dx, y: SINK, z: c.z + t.z * dx, yaw }, [jamb, h - (side > 0 ? 0.25 : 0) - SINK, R.wall], C.wornPlaster, C.wornPlasterTop);
        }
        if (bay) b.box({ x: c.x, y: SINK, z: c.z, yaw }, [opening, B.bottom - SINK, R.wall], C.wornPlaster, C.wornPlasterTop);
      }
    },
    { stage: 0, row: 0 },
  );
  // Les volets couchés à plat à l'ouest, parallèles, côte à côte contre le mur (jamais en étoile : rien qui se lise comme
  // un signe) : les volets fermés du corps les relèvent.
  add(
    'ruine',
    0,
    (b) => {
      for (const [x, z] of [
        [-3.75, 0.05],
        [-4.4, -0.1],
        [-5.05, 0.1],
      ] as const)
        b.box({ x, y: 0.02, z }, [0.55, 0.07, 1.5], C.wornShutter);
    },
    { stage: 0, row: 0.67 },
  );
  // Les côtes de la coupole en tas sur le tertre, au nord : courbes, couchées l'une sur l'autre (chacune trois lattes en
  // arc), et une corde coupée à côté (un indice de passage, loin de la scénette) : les côtes du haut les relèvent.
  add(
    'ruine',
    0,
    (b) => {
      for (const [k, [cx, cz, r]] of RUIN_RIBS.entries()) {
        const y = 0.06 + 0.07 * k;
        const arc = [30, 70, 110, 150].map((deg) => ({ x: cx + r * Math.cos((deg * Math.PI) / 180), y, z: cz - r * Math.sin((deg * Math.PI) / 180) }));
        for (let j = 0; j + 1 < arc.length; j++) b.beam(arc[j], arc[j + 1], 0.14, C.wornRib);
      }
      b.beam({ x: -0.6, y: 0.05, z: -4.4 }, { x: 0.3, y: 0.05, z: -3.9 }, 0.06, C.cutRope);
      b.beam({ x: 0.3, y: 0.05, z: -3.9 }, { x: 0.55, y: 0.05, z: -4.5 }, 0.06, C.cutRope);
    },
    { stage: 1, row: 0 },
  );
  // Les plaques de zinc en pile, au nord-est, alignées l'une sur l'autre : le zinc du haut les relève.
  add(
    'ruine',
    0,
    (b) => {
      for (const k of [0, 1, 2, 3]) b.box({ x: 2.2 + 0.04 * (k % 2), y: 0.09 * k, z: -5.1 - 0.03 * k, yaw: 0.1 }, [1.6, 0.09, 1.1], C.wornRib, C.wornZinc);
    },
    { stage: 1, row: 0.5 },
  );
  // Le corps : la première rangée du tambour (elle couvre la ruine)…
  add(0, 0, (b) => b.prism({ x: 0, y: SINK, z: 0, yaw: DRUM_YAW }, D.r, D.r, D.mid - SINK, D.sides, C.plaster, C.plasterShade));
  // … puis la seconde, jusqu'à la corniche, et l'encadrement des baies, d'enduit plus sombre.
  add(0, 0.34, (b) => {
    b.prism({ x: 0, y: D.mid, z: 0, yaw: DRUM_YAW }, D.r, D.r, D.top - D.mid, D.sides, C.plaster, C.plasterShade);
    for (const deg of B.angles) {
      const at = polar(deg, drumFace(D.r) + 0.02);
      b.box({ x: at.x, y: B.bottom - 0.12, z: at.z, yaw: facing(deg) }, [B.width + 0.3, B.top - B.bottom + 0.24, 0.05], C.plasterShade);
    }
  });
  // Les volets fermés, la corniche, et la porte au sud-est (vers le chemin).
  add(0, 0.67, (b) => {
    for (const deg of B.angles) closedShutters(b, deg, drumFace(D.r));
    b.prism({ x: 0, y: D.top, z: 0, yaw: DRUM_YAW }, OBSERVATORY.cornice.r, OBSERVATORY.cornice.r, OBSERVATORY.cornice.h, D.sides, C.plasterShade);
    const Dd = OBSERVATORY.door;
    const at = polar(Dd.angle, drumFace(D.r) + 0.03);
    b.box({ x: at.x, y: 0, z: at.z, yaw: facing(Dd.angle) }, [Dd.width, Dd.height, 0.08], C.door);
  });
  // Le haut : les côtes de la coupole, puis son zinc et son épi.
  add(1, 0, (b) => domeRibs(b, domeBase));
  add(1, 0.5, (b) => {
    domeShell(b, domeBase);
    b.prism({ x: 0, y: domeBase + OBSERVATORY.dome.r - 0.03, z: 0 }, 0.13, 0, OBSERVATORY.dome.spire, 6, C.rib);
  });
  // Les abords : la terrasse dallée, de la pierre des Écluses, et le chemin de sable tassé de la porte (où arrive le
  // chemin du réseau, plan6e.ts) jusqu'à elle.
  const apothem = T.r * Math.cos(Math.PI / T.sides);
  add(2, 0, (b) => {
    b.prism({ x: 0, y: SINK, z: 0 }, T.r, T.r, T.top - SINK, T.sides, C.darkStone, C.stone);
    const c = placeById('observatory').center;
    const door = PATH_NODES.find((n) => n.id === 'observatory')!.at;
    const d = { x: door.x - c.x, z: door.z - c.z };
    const from = apothem - 0.2;
    b.box({ x: d.x, y: SINK, z: (d.z + from) / 2 + 0.1 }, [1.1, 0.03 - SINK, d.z - from + 0.3], C.mud, COLORS_6E.path);
  });
  // Le parapet, ouvert au sud (la porte) et à l'ouest-sud-ouest (l'escalier) ; la table d'orientation au nord-est ;
  // l'escalier qui descend vers la grève.
  add(2, 0.5, (b) => {
    const half = Math.PI / T.sides;
    for (let k = 0; k < T.sides; k++) {
      const deg = 18 + 36 * k;
      if (deg === 90 || deg === OBSERVATORY.stair.angle) continue;
      const at = polar(deg, apothem - 0.17);
      b.box({ x: at.x, y: T.top - 0.05, z: at.z, yaw: facing(deg) }, [2 * T.r * Math.sin(half) - 0.15, 0.55, 0.3], C.darkStone, C.stone);
    }
    const table = OBSERVATORY_TABLE;
    b.prism({ x: table.x, y: T.top - 0.05, z: table.z }, 0.3, 0.22, 0.8, 6, C.passeurShade, C.passeurStone);
    b.drum({ x: table.x, y: T.top + 0.75, z: table.z }, 0.55, 0.1, 10, C.bronze, C.bronze);
    const S = OBSERVATORY.stair;
    for (let k = 0; k < S.steps; k++) {
      const at = polar(S.angle, apothem + S.depth * (k + 0.5));
      b.box({ x: at.x, y: SINK, z: at.z, yaw: facing(S.angle) }, [S.width, (T.top * (S.steps - k)) / (S.steps + 1) - SINK, S.depth], C.darkStone, C.stone);
    }
  });
}

/**
 * La Halle (lot L8d), dans son repère (le lieu n'est pas tourné : sa face au sud, vers la caméra) : le dallage (ses
 * demi-côtés, son dessus, celui du dallage usé de la ruine, toujours là) ; les piliers (le x de chaque file, le z des rangs du sud et du nord, leur côté, leur socle,
 * leur chapiteau, le haut de leur chapiteau) ; les sablières et les entraits (leur hauteur, leur section) ; la toiture à
 * quatre pans (le haut de son égout, ses demi-côtés à l'égout, la demi-longueur de son faîtage, sa hauteur, ses rangs
 * de tuiles) ; le muret du nord (son z, sa hauteur, son épaisseur).
 */
export const COMMONS = {
  paving: { halfX: 6.9, halfZ: 5.4, top: 0.12, worn: 0.08 },
  pillar: { xs: [-4.8, -1.6, 1.6, 4.8], z: 3.4, side: 0.55, socle: [0.8, 0.3], capital: [0.75, 0.2], top: 3.25 },
  beam: { h: 0.3, w: 0.32 },
  roof: { eave: 2.85, ex: 6.6, ez: 5.0, ridge: 1.6, height: 2.5, courses: 6 },
  wall: { z: -5.15, h: 0.5, t: 0.35 },
} as const;

/** Les piliers de la Halle : quatre files de deux (les rangs du sud et du nord), et un au milieu de chaque pignon. */
export function commonsPillars(): readonly { x: number; z: number }[] {
  const P = COMMONS.pillar;
  return [...P.xs.flatMap((x) => [{ x, z: P.z }, { x, z: -P.z }]), { x: P.xs[0], z: 0 }, { x: P.xs[3], z: 0 }];
}

/** Un point de la toiture, au rang `t` de l'égout (0) au faîtage (1) : ses demi-côtés et sa hauteur. */
function roofAt(t: number): { hx: number; hz: number; y: number } {
  const R = COMMONS.roof;
  return { hx: R.ex - (R.ex - R.ridge) * t, hz: R.ez * (1 - t), y: R.eave + R.height * t };
}

/**
 * La bande de la toiture entre les rangs `t0` et `t1` sur ses quatre pans (le sud, l'est, le nord, l'ouest), de la
 * couleur `color`, vue du dessus ; ou son dessous (`under`). Les pans de l'est et de l'ouest finissent en pointe au
 * faîtage (un triangle).
 */
function roofBand(b: FacetBuilder, t0: number, t1: number, color: number, under = false): void {
  const a = roofAt(t0),
    c = roofAt(t1);
  const s = under ? -1 : 1;
  const pans: [readonly [number, number, number][], readonly [number, number, number]][] = [
    [[[-a.hx, a.y, a.hz], [a.hx, a.y, a.hz], [c.hx, c.y, c.hz], [-c.hx, c.y, c.hz]], [0, s, 0.5 * s]],
    [[[a.hx, a.y, a.hz], [a.hx, a.y, -a.hz], [c.hx, c.y, -c.hz], [c.hx, c.y, c.hz]], [0.5 * s, s, 0]],
    [[[a.hx, a.y, -a.hz], [-a.hx, a.y, -a.hz], [-c.hx, c.y, -c.hz], [c.hx, c.y, -c.hz]], [0, s, -0.5 * s]],
    [[[-a.hx, a.y, -a.hz], [-a.hx, a.y, a.hz], [-c.hx, c.y, c.hz], [-c.hx, c.y, -c.hz]], [-0.5 * s, s, 0]],
  ];
  for (const [k, [q, out]] of pans.entries()) {
    // Au faîtage, les pans de l'est et de l'ouest se referment en pointe : un triangle, sans facette vide.
    if (k % 2 === 1 && c.hz < 1e-6) {
      const n = triangleNormal(q);
      if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0) b.triangle(q[0], q[1], q[2], color);
      else b.triangle(q[2], q[1], q[0], color);
    } else quadToward(b, q, out, color);
  }
}

/** La normale (non normée) d'un triangle, dans l'ordre de ses sommets. */
function triangleNormal(t: readonly (readonly [number, number, number])[]): [number, number, number] {
  const [a, c, d] = t;
  const u = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
}

/**
 * Les rangs de tuiles de la toiture, de `from` à `to` (en rangs, de l'égout) : chaque rang de tuile Vert île, sa lèvre
 * d'ombre en bas (le rang qui recouvre celui du dessous), et le dessous de la toiture, sombre, vu d'entre les piliers.
 */
function roofCourses(b: FacetBuilder, from: number, to: number): void {
  const n = COMMONS.roof.courses;
  for (let k = from; k < to; k++) {
    const [t0, t1] = [k / n, (k + 1) / n];
    const lip = t0 + 0.2 * (t1 - t0);
    roofBand(b, t0, lip, C.tileShade);
    roofBand(b, lip, t1, C.tile);
  }
  roofBand(b, from / n, to / n, C.tileShade, true);
}

/**
 * La Halle (lot L8d), une halle de village au sud de l'Escale : une grande toiture à quatre pans, basse et débordante,
 * de tuiles vernissées Vert île, sur dix piliers de la pierre des Passeurs, ouverte sur ses quatre côtés ; la toiture
 * fait presque tout le volume (plus large, plus basse que le lieu d'assemblage de l'Escale, une halle de bois à deux
 * pentes). Ni girouette, ni clocheton, ni horloge ; aucun symbole. Avant (éteinte par le temps et la mer) : les piliers
 * usés, deux écimés, la charpente effondrée en travers, des tuiles éparses, de l'herbe dans le dallage usé. Le corps :
 * les piliers, puis les sablières, puis les entraits. Le haut (l'étape qui porte les traces) : les poinçons et le
 * faîtage de la charpente avec les rangs de tuiles du bas, puis ceux du haut, les arêtiers et l'épi du faîtage. Les abords : le dallage et le
 * chemin de la porte, puis le muret du nord. Ce qui est tombé dans la ruine s'en va quand ce qui le relève se pose.
 */
function commons(add: Add): void {
  const P = COMMONS.pillar;
  const Bm = COMMONS.beam;
  const R = COMMONS.roof;
  const D = COMMONS.paving;
  const pillars = commonsPillars();
  // Le dallage usé, sous le neuf (qui le couvre, un peu plus large et plus haut).
  add('ruine', 0, (b) => b.box({ x: 0, y: SINK, z: 0 }, [2 * D.halfX - 0.3, D.worn - SINK, 2 * D.halfZ - 0.3], C.worn, C.wornPaving));
  // Les piliers usés, debout, deux écimés (au nord-ouest et au milieu du pignon de l'est, loin de la scénette) : les
  // piliers neufs les remplacent.
  add(
    'ruine',
    0,
    (b) => {
      for (const p of pillars) {
        const cut = p.x === P.xs[1] && p.z < 0 ? 1.5 : p.x === P.xs[3] && p.z === 0 ? 1.9 : P.top - 0.25;
        b.box({ x: p.x, y: SINK, z: p.z }, [P.side - 0.06, cut - SINK, P.side - 0.06], C.wornPasseurs, C.wornPasseursTop);
      }
      // Les blocs tombés des deux piliers écimés, à leur pied.
      b.box({ x: P.xs[1] + 0.7, y: 0.05, z: -P.z - 0.5, yaw: 0.5 }, [0.5, 0.42, 0.5], C.wornPasseurs, C.wornPasseursTop);
      b.box({ x: P.xs[3] + 0.8, y: 0.05, z: 0.6, yaw: -0.3 }, [0.5, 0.42, 0.5], C.wornPasseurs, C.wornPasseursTop);
    },
    { stage: 0, row: 0 },
  );
  // La charpente effondrée en travers du dallage, au nord, une poutre appuyée contre un pilier de l'ouest : les
  // sablières la relèvent.
  add(
    'ruine',
    0,
    (b) => {
      for (const [x0, y0, z0, x1, y1, z1] of [
        [-4.2, 0.25, -2.6, 2.4, 0.25, -1.4],
        [-1.0, 0.45, -3.0, 3.8, 0.25, -0.2],
        [0.6, 0.2, -2.4, 4.4, 0.2, -3.4],
        [-4.8, 2.1, -0.25, -3.0, 0.2, 1.2],
      ] as const)
        b.beam({ x: x0, y: y0, z: z0 }, { x: x1, y: y1, z: z1 }, 0.26, C.wornWood);
    },
    { stage: 0, row: 0.34 },
  );
  // Les tuiles éparses sur le dallage (hors du milieu du sud, où se tient la scénette) : la toiture les relève.
  add(
    'ruine',
    0,
    (b) => {
      for (const [x, z, yaw] of [
        [-5.6, 1.2, 0.4],
        [-3.4, -1.1, 1.1],
        [-2.6, 1.6, -0.3],
        [2.9, 1.9, 0.8],
        [3.6, -2.0, -0.6],
        [5.7, 2.6, 0.2],
        [-0.4, -4.3, 1.4],
        [1.8, -0.4, -1.0],
      ] as const)
        b.box({ x, y: D.worn, z, yaw }, [0.42, 0.05, 0.3], C.wornTile);
    },
    { stage: 1, row: 0 },
  );
  // L'herbe dans les joints du dallage usé : le dallage neuf la recouvre.
  add(
    'ruine',
    0,
    (b) => {
      for (const [x, z, r] of [
        [-5.9, -3.9, 0.3],
        [-2.2, -0.2, 0.25],
        [0.9, -2.9, 0.3],
        [4.0, 0.9, 0.28],
        [6.0, -4.2, 0.32],
        [-4.0, 4.6, 0.26],
      ] as const)
        b.prism({ x, y: 0.02, z }, r, r * 0.4, 0.24, 5, C.green, C.leaf);
    },
    { stage: 2, row: 0 },
  );
  // Le corps : les piliers, chacun sur son socle, sous son chapiteau…
  add(0, 0, (b) => {
    const [sw, sh] = P.socle,
      [cw, ch] = P.capital;
    for (const p of pillars) {
      b.box({ x: p.x, y: SINK, z: p.z }, [sw, sh - SINK, sw], C.passeurShade, C.passeurStone);
      b.box({ x: p.x, y: sh, z: p.z }, [P.side, P.top - ch - sh, P.side], C.passeurStone);
      b.box({ x: p.x, y: P.top - ch, z: p.z }, [cw, ch, cw], C.passeurShade, C.passeurStone);
    }
  });
  // … puis les sablières, de chêne, d'un pilier d'angle à l'autre…
  add(0, 0.34, (b) => {
    const [x0, x1] = [P.xs[0], P.xs[3]];
    for (const z of [P.z, -P.z]) b.box({ x: 0, y: P.top, z }, [x1 - x0 + Bm.w, Bm.h, Bm.w], C.oak);
    for (const x of [x0, x1]) b.box({ x, y: P.top, z: 0 }, [Bm.w, Bm.h, 2 * P.z - Bm.w], C.oak);
  });
  // … puis les entraits des deux files du milieu.
  add(0, 0.67, (b) => {
    for (const x of [P.xs[1], P.xs[2]]) b.box({ x, y: P.top, z: 0 }, [Bm.w - 0.04, Bm.h, 2 * P.z - Bm.w], C.oak);
  });
  // Le haut : les poinçons et le faîtage de la charpente, avec les rangs de tuiles du bas (l'égout débordant ; relecture
  // de L8c-d : sans toiture, ils se lisaient comme un portique), puis les rangs du haut, les arêtiers et le faîtage.
  const half = R.courses / 2;
  add(1, 0, (b) => {
    const ridgeY = R.eave + R.height;
    for (const x of [P.xs[1], P.xs[2]]) b.box({ x, y: P.top + Bm.h, z: 0 }, [0.24, ridgeY - 0.3 - P.top - Bm.h, 0.24], C.oak);
    b.beam({ x: P.xs[1], y: ridgeY - 0.2, z: 0 }, { x: P.xs[2], y: ridgeY - 0.2, z: 0 }, 0.2, C.oak);
    roofCourses(b, 0, half);
    // La rive de l'égout, une bande d'ombre sous le bord : la toiture a une épaisseur.
    const a = roofAt(0);
    const rim = 0.12;
    const corners: [number, number][] = [
      [-a.hx, a.hz],
      [a.hx, a.hz],
      [a.hx, -a.hz],
      [-a.hx, -a.hz],
    ];
    for (let k = 0; k < 4; k++) {
      const [p, q] = [corners[k], corners[(k + 1) % 4]];
      const mid = [(p[0] + q[0]) / 2, 0, (p[1] + q[1]) / 2] as const;
      quadToward(b, [[p[0], a.y - rim, p[1]], [q[0], a.y - rim, q[1]], [q[0], a.y, q[1]], [p[0], a.y, p[1]]], mid, C.tileShade);
    }
  });
  add(1, 0.5, (b) => {
    roofCourses(b, half, R.courses);
    const top = roofAt(1);
    const a = roofAt(0);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) b.beam({ x: sx * a.hx, y: a.y + 0.06, z: sz * a.hz }, { x: sx * top.hx, y: top.y + 0.06, z: 0 }, 0.16, C.tileShade);
    b.beam({ x: -top.hx - 0.05, y: top.y + 0.06, z: 0 }, { x: top.hx + 0.05, y: top.y + 0.06, z: 0 }, 0.2, C.tileShade);
  });
  // Les abords : le dallage de la pierre claire des Passeurs, et le chemin de sable tassé de la porte (où arrive le
  // chemin du réseau, plan6e.ts) jusqu'à lui.
  add(2, 0, (b) => {
    b.box({ x: 0, y: SINK, z: 0 }, [2 * D.halfX, D.top - SINK, 2 * D.halfZ], C.passeurShade, C.paving);
    const c = placeById('commons').center;
    const door = PATH_NODES.find((n) => n.id === 'commons')!.at;
    const d = { x: door.x - c.x, z: door.z - c.z };
    const from = D.halfZ - 0.2;
    b.box({ x: d.x, y: SINK, z: (d.z + from) / 2 + 0.1 }, [1.1, 0.03 - SINK, d.z - from + 0.3], C.mud, COLORS_6E.path);
  });
  // Le muret bas du nord, de la même pierre, d'un bout à l'autre du dallage, contre le village.
  add(2, 0.5, (b) => {
    const W = COMMONS.wall;
    b.box({ x: 0, y: SINK, z: W.z }, [2 * D.halfX - 0.4, W.h - SINK, W.t], C.passeurShade, C.passeurStone);
  });
}

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
    const c = placeOfAnyLevel(id).center;
    const at = [...PATH_NODES, ...PATH_NODES_5E, ...PATH_NODES_4E].find((n) => n.id === id)!.at;
    art.model(add, siteGround(id), { x: at.x - c.x, z: at.z - c.z });
  };
}

/**
 * La Mangrove (lot L8a), dans son repère (le lieu n'est pas tourné ; le lagon au nord-est, la rive en biais, du
 * nord-ouest au sud-est) : le platelage de rive (son milieu, sa largeur le long de x, sa profondeur, son dessus au-dessus
 * du sol le plus haut sous lui) et ses pieux ; la passerelle en coude, de l'angle nord-est du platelage (`start`) au coude
 * (`knee`), puis au carbet (`end`), sa largeur, la hauteur de ses rambardes ; le carbet sur pilotis (son milieu, sa
 * largeur, sa profondeur, son plancher, ses poteaux, son toit de palmes) ; les trois palétuviers (dans l'eau, au bord) ;
 * la vasière ; la passerelle qui rejoint le chemin, du platelage à la porte ; le ponton d'accostage du carbet.
 */
export const MANGROVE = {
  deck: {
    x: 5.5,
    z: -2,
    w: 9,
    d: 2.8,
    lift: 0.3,
    piles: [
      [1.7, -3.3],
      [4.9, -3.3],
      [7.7, -3.3],
      [9.9, -3.3],
      [9.9, -0.7],
      [7.7, -0.7],
    ],
  },
  walk: { start: { x: 9.1, z: -3.3 }, knee: { x: 9.1, z: -6.6 }, end: { x: 6.4, z: -8.75 }, width: 1, rail: 0.75 },
  carbet: { x: 5.5, z: -10, w: 2.6, d: 2.2, floor: 0.42, posts: 1.8, roof: 1.3 },
  trees: [
    [1.5, -7],
    [12, -4],
    [12.1, -0.9],
  ],
  mud: { x: 0, z: -1.5, rx: 4.6, rz: 4 },
  path: { from: { x: 3.7, z: -0.5 }, width: 1 },
  pontoon: { x: 3.5, z: -10.2, w: 1.4, d: 1 },
} as const;

/** Le sol d'un lieu sous un point de son repère, depuis le sol de son centre, sans le plancher de l'eau (la vase). */
function rawGround(id: PlaceId6e): (lx: number, lz: number) => number {
  const p = placeById(id);
  const h0 = standingHeight(heightAt(p.center));
  return (lx, lz) => heightAt({ x: p.center.x + lx, z: p.center.z + lz }) - h0;
}

/**
 * Le dessus du platelage de rive de la Mangrove, au-dessus du sol de son centre : `lift` au-dessus du plus haut du sol
 * sous lui (rien ne s'y enfonce). La scénette pose son plancher juste au-dessus (scenette.ts).
 */
export function mangroveDeckTop(): number {
  const D = MANGROVE.deck;
  const g = siteGround('mangrove');
  let top = 0;
  for (let i = 0; i <= 6; i++) for (let k = 0; k <= 2; k++) top = Math.max(top, g.at(D.x - D.w / 2 + (i * D.w) / 6, D.z - D.d / 2 + (k * D.d) / 2));
  return top + D.lift;
}

/** Un pieu carré, de section `t`, de son pied (le sol, ou le fond de l'eau, `bottom`) jusqu'à `top`. */
function pile(b: FacetBuilder, x: number, z: number, bottom: number, top: number, color: number, t = 0.18): void {
  b.box({ x, y: bottom, z }, [t, top - bottom, t], color);
}

/**
 * Une passerelle de planches de `from` à `to` (le dessus des planches de `y0` à `y1`), de largeur `width` : un corps de
 * bois sombre, et ses planches en travers, en deux bois, avec un jour entre elles (on les lit une à une).
 */
function plankWalk(b: FacetBuilder, from: Vec2, to: Vec2, y0: number, y1: number, width: number, dark: number, woods: readonly [number, number]): void {
  const len = Math.hypot(to.x - from.x, to.z - from.z) || 1e-6;
  const [dx, dz] = [(to.x - from.x) / len, (to.z - from.z) / len];
  const yaw = Math.atan2(dx, dz);
  const mid = { x: (from.x + to.x) / 2, z: (from.z + to.z) / 2 };
  const thick = 0.14;
  b.box({ x: mid.x, y: (y0 + y1) / 2 - thick, z: mid.z, yaw, pitch: -Math.asin((y1 - y0) / len) }, [width, thick, len], dark);
  const n = Math.max(1, Math.round(len / PLANK_PITCH));
  const step = len / n;
  const up = [0, 1, 0] as const;
  const [ox, oz] = [dz * (width / 2 - 0.04), -dx * (width / 2 - 0.04)];
  for (let k = 0; k < n; k++) {
    const at = (u: number) => ({ x: from.x + dx * u, y: y0 + ((y1 - y0) * u) / len + 0.006, z: from.z + dz * u });
    const [p, q] = [at(k * step + 0.04), at((k + 1) * step - 0.04)];
    quadToward(
      b,
      [
        [p.x + ox, p.y, p.z + oz],
        [q.x + ox, q.y, q.z + oz],
        [q.x - ox, q.y, q.z - oz],
        [p.x - ox, p.y, p.z - oz],
      ],
      up,
      woods[k % 2],
    );
  }
}

/** Le pas des planches d'une passerelle (une planche et son jour). */
const PLANK_PITCH = 0.5;

/** Une racine-échasse : un pied effilé à trois pans, de `a` (en bas) à `c`, sans dessus ni dessous. */
function stilt(b: FacetBuilder, a: { x: number; y: number; z: number }, c: { x: number; y: number; z: number }, r0: number, r1: number, color: number): void {
  const d = [c.x - a.x, c.y - a.y, c.z - a.z];
  const l = Math.hypot(d[0], d[1], d[2]) || 1e-6;
  const n = d.map((v) => v / l);
  const ref = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u0 = [n[1] * ref[2] - n[2] * ref[1], n[2] * ref[0] - n[0] * ref[2], n[0] * ref[1] - n[1] * ref[0]];
  const ul = Math.hypot(u0[0], u0[1], u0[2]);
  const u = u0.map((v) => v / ul);
  const v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
  const ring = (p: { x: number; y: number; z: number }, r: number) =>
    [0, 1, 2].map((k) => {
      const t = (2 * Math.PI * k) / 3;
      const [cu, sv] = [Math.cos(t) * r, Math.sin(t) * r];
      return [p.x + cu * u[0] + sv * v[0], p.y + cu * u[1] + sv * v[1], p.z + cu * u[2] + sv * v[2]] as const;
    });
  const lo = ring(a, r0);
  const hi = ring(c, r1);
  for (let k = 0; k < 3; k++) {
    const m = (k + 1) % 3;
    b.quad(lo[k], lo[m], hi[m], hi[k], color);
  }
}

/**
 * Un palétuvier jeune, son pied en (`x`, `z`), dans l'eau ou au bord, au niveau `foot` (relectures DA de L8 : jamais un
 * parasol sur trépied, jamais un tripode qui marche) : le houppier en dôme, bas, large, sombre et rond, plus lourd que
 * les racines, en deux masses (la grande, l'ombre dessous et les flancs qui se referment, et une plus petite posée
 * dessus, un peu de côté, qui monte le milieu du dôme) ; un bout de tronc nu sous lui ; et cinq racines-échasses
 * inégales, attachées bas, à des angles décalés (jamais la symétrie d'un trépied), chacune en deux segments qui
 * s'évasent en arc : le premier descend vers 40°, le second plonge vers 65°, jamais une cuisse à plat sur un tibia
 * droit. 96 triangles (le tronc à trois pans, comme les racines ; aucune face cachée sous le houppier) ; ni fleur, ni
 * fruit.
 */
function mangroveTree(b: FacetBuilder, x: number, z: number, foot: number, turn: number): void {
  const T = MANGROVE_TREE;
  const at = (a: number, r: number, y: number) => ({ x: x + r * Math.cos(a), y, z: z + r * Math.sin(a) });
  const bottom = foot - 0.4;
  T.roots.forEach(([offset, scale], k) => {
    const a = turn + (2 * Math.PI * k) / T.roots.length + offset;
    const [run, drop] = [T.first * scale, T.first * scale * Math.tan(T.slopes[0])];
    const elbow = at(a, 0.1 + run, T.root - drop);
    const reach = 0.1 + run + (elbow.y - bottom) / Math.tan(T.slopes[1]);
    stilt(b, at(a, reach, bottom), elbow, 0.09, 0.08, C.mangroveWood);
    stilt(b, elbow, at(a, 0.1, T.root), 0.08, 0.08, C.mangroveWood);
  });
  stilt(b, { x, y: T.root - 0.1, z }, { x, y: T.crown + 0.1, z }, 0.17, 0.14, C.mangroveWood);
  crownBand(b, x, T.crown, z, 0.75, 1.15, 0.32, turn, C.leafMangroveShade);
  b.prism({ x, y: T.crown + 0.32, z, yaw: turn }, 1.15, 0.6, 0.5, 5, C.leafMangrove, C.leafMangrove);
  const [dx, dz] = [0.22 * Math.cos(turn + 1), 0.22 * Math.sin(turn + 1)];
  b.prism({ x: x + dx, y: T.crown + 0.74, z: z + dz, yaw: turn + 0.6 }, 0.7, 0, 0.36, 5, C.leafMangrove);
}

/**
 * Le bas du houppier d'un palétuvier : un tour de tronc de cône à cinq pans, de `r0` en bas à `r1` en haut, sans dessus
 * ni dessous (le haut du houppier le ferme ; on ne le voit pas d'en bas).
 */
function crownBand(b: FacetBuilder, x: number, y: number, z: number, r0: number, r1: number, h: number, turn: number, color: number): void {
  const ring = (r: number, yy: number) => Array.from({ length: 5 }, (_, k) => [x + r * Math.cos((2 * Math.PI * k) / 5 - turn), yy, z + r * Math.sin((2 * Math.PI * k) / 5 - turn)] as const);
  const [lo, hi] = [ring(r0, y), ring(r1, y + h)];
  for (let k = 0; k < 5; k++) {
    const n = (k + 1) % 5;
    b.quad(lo[n], lo[k], hi[k], hi[n], color);
  }
}

/**
 * Le palétuvier : l'attache des racines au tronc (`root`), le bas du houppier (`crown`) ; le tronc nu se voit entre les
 * deux. Ses racines : la longueur à plat du premier segment (`first`), les pentes des deux segments (`slopes`, en
 * radians depuis l'horizontale), et pour chacune son décalage d'angle et sa longueur relative (`roots`).
 */
const MANGROVE_TREE = {
  root: 0.7,
  crown: 1.25,
  first: 0.42,
  slopes: [0.72, 1.13],
  roots: [
    [0, 1],
    [0.3, 0.8],
    [-0.2, 1.15],
    [0.15, 0.9],
    [-0.1, 1.05],
  ],
} as const;

/**
 * La Mangrove (lot L8a). Avant (éteinte par le temps et la mer) : la vasière ; des pilotis cassés et penchés dans l'eau, des
 * planches échouées dans la vase ; le carbet sans toit, son plancher troué ; trois touffes basses de jeunes palétuviers.
 * Le corps (l'étape qui porte les traces) : le platelage de rive sur ses pieux, puis la passerelle en coude qui avance sur
 * l'eau. Le haut : le carbet sur pilotis et son toit de palmes à deux pentes (le plus haut point, le repère), puis les
 * trois palétuviers sur leurs racines. Les abords : la passerelle qui rejoint le chemin, les rambardes de corde, le petit
 * ponton d'accostage. Aucun animal, ni fleur ni fruit ; rien ne bouge. Ce qui gît dans la ruine s'en va quand ce qui le
 * relève se pose, jamais en double. Sur la vasière de la rive sud-ouest (terrain.ts).
 */
function mangrove(add: Add): void {
  const M = MANGROVE;
  const D = M.deck;
  const W = M.walk;
  const K = M.carbet;
  const g = siteGround('mangrove');
  const raw = rawGround('mangrove');
  const water = g.water;
  const top = mangroveDeckTop();
  const bed = water - 0.7;
  const c = placeById('mangrove').center;
  // La vasière : un aplat de vase posé sur le sol, sur la terre seulement (son bord recule devant l'eau, le sable du
  // rivage reste), au contour arrondi et irrégulier (un rayon tiré d'un hasard fixe à chaque rayon) : jamais un carré.
  add('ruine', 0, (b) => {
    const V = M.mud;
    const up = [0, 1, 0] as const;
    const n = 12;
    const rim = Array.from({ length: n }, (_, k) => {
      const t = (2 * Math.PI * k) / n;
      const wobble = 0.8 + 0.2 * (((k * 7) % 5) / 4);
      let r = wobble;
      const at = (s: number) => ({ x: V.x + Math.cos(t) * V.rx * s, z: V.z + Math.sin(t) * V.rz * s });
      while (r > 0.2 && landDistance({ x: c.x + at(r).x, z: c.z + at(r).z }) < 0.4) r -= 0.1;
      return [at(r), at(r / 2)] as const;
    });
    const lift = (p: Vec2) => [p.x, raw(p.x, p.z) + 0.05, p.z] as const;
    const mid = lift({ x: V.x, z: V.z });
    for (let k = 0; k < n; k++) {
      const [outA, inA] = rim[k];
      const [outB, inB] = rim[(k + 1) % n];
      b.triangle(mid, lift(inB), lift(inA), C.vase);
      quadToward(b, [lift(inA), lift(inB), lift(outB), lift(outA)], up, C.vase);
    }
  });
  // Les pilotis cassés et penchés, dans l'eau là où le platelage et la passerelle se relèveront, et les planches
  // échouées dans la vase : ils s'en vont quand le platelage se pose.
  add(
    'ruine',
    0,
    (b) => {
      for (const [x, z, h, lean] of MANGROVE_BROKEN_PILES) b.box({ x, y: bed, z, pitch: lean, yaw: x }, [0.18, water + h - bed, 0.18], C.wornWood);
      for (const [x, z, yaw] of MANGROVE_STRANDED) b.box({ x, y: raw(x, z) + 0.02, z, yaw }, [0.42, 0.08, 1.7], C.wornWood);
    },
    { stage: 0, row: 0 },
  );
  // Le carbet ruiné : trois pieux tronqués, son plancher troué (deux bouts de planches de travers), sans toit ; il s'en
  // va quand le carbet se relève.
  add(
    'ruine',
    0,
    (b) => {
      for (const [dx, dz, h] of [
        [-1.2, -1, 0.9],
        [1.2, -1, 0.5],
        [1.2, 1, 0.7],
      ] as const)
        pile(b, K.x + dx, K.z + dz, bed, water + h, C.wornWood);
      b.box({ x: K.x + 0.4, y: water + 0.5, z: K.z - 0.3, yaw: 0.1, pitch: 0.12 }, [1.6, 0.1, 0.9], C.wornWood);
      b.box({ x: K.x + 0.9, y: water + 0.45, z: K.z + 0.7, yaw: -0.3 }, [0.9, 0.1, 0.5], C.wornWood);
    },
    { stage: 1, row: 0 },
  );
  // Trois touffes basses de jeunes palétuviers, au pied de trois des arbres (rien de mort) : elles s'en vont quand les
  // arbres poussent.
  add(
    'ruine',
    0,
    (b) => {
      for (const [x, z] of M.trees.slice(0, 3)) b.prism({ x, y: Math.min(water, raw(x, z)) - 0.05, z, yaw: x }, 0.6, 0.25, 0.6, 6, C.leafMangroveShade, C.leafMangrove);
    },
    { stage: 1, row: 0.67 },
  );
  // Le corps : le platelage de rive sur ses pieux.
  add(0, 0, (b) => {
    for (const [x, z] of D.piles) pile(b, x, z, Math.min(bed, raw(x, z) - 0.3), top - 0.14, C.walkwayDark);
    plankWalk(b, { x: D.x - D.w / 2, z: D.z }, { x: D.x + D.w / 2, z: D.z }, top, top, D.d, C.walkwayDark, [C.walkway, C.walkwayLight]);
  });
  // La passerelle en coude, qui avance sur l'eau : son premier bras vers le nord et ses pieux (leur tête porte la
  // rambarde), puis son second bras, vers le carbet.
  const postTop = top + W.rail;
  add(0, 0.34, (b) => {
    plankWalk(b, W.start, W.knee, top, top, W.width, C.walkwayDark, [C.walkway, C.walkwayLight]);
    for (const at of [W.start, W.knee]) for (const p of walkSides(W.start, W.knee, at)) pile(b, p.x, p.z, bed, postTop, C.walkwayDark, 0.14);
  });
  add(0, 0.67, (b) => {
    plankWalk(b, W.knee, W.end, top, top, W.width, C.walkwayDark, [C.walkwayLight, C.walkway]);
    for (const p of walkSides(W.knee, W.end, W.end)) pile(b, p.x, p.z, bed, postTop, C.walkwayDark, 0.14);
  });
  // Le haut : le carbet sur pilotis, ses quatre poteaux du fond de l'eau au toit, son plancher, son mur du fond ; puis son
  // toit de palmes à deux pentes, le plus haut point du lieu ; puis les trois palétuviers.
  const floor = mangroveCarbetFloor();
  add(1, 0, (b) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) pile(b, K.x + sx * (K.w / 2 - 0.1), K.z + sz * (K.d / 2 - 0.1), bed, floor + K.posts, C.mangroveWood, 0.16);
    b.box({ x: K.x, y: floor - 0.14, z: K.z }, [K.w, 0.14, K.d], C.walkwayDark, C.walkway);
    b.box({ x: K.x, y: floor, z: K.z - K.d / 2 + 0.08 }, [K.w - 0.3, 1.05, 0.1], C.palmShade, C.palm);
  });
  add(1, 0.34, (b) => b.gableRoof({ x: K.x, y: floor + K.posts, z: K.z }, K.w + 0.7, K.d + 0.8, K.roof, C.palm, C.palmShade));
  add(1, 0.67, (b) => M.trees.forEach(([x, z], k) => mangroveTree(b, x, z, Math.min(water, raw(x, z)), 0.4 + k)));
  // Les abords : la passerelle qui rejoint le chemin, du platelage jusque devant la porte, posée sur la vase, et ses pieux
  // courts aux deux bouts.
  add(2, 0, (b) => {
    const door = PATH_NODES.find((n) => n.id === 'mangrove')!.at;
    const to = { x: door.x - c.x, z: door.z - c.z - 0.65 };
    const from = M.path.from;
    const y1 = Math.max(top - 0.05, g.at(to.x, to.z) + 0.16);
    plankWalk(b, from, to, top, y1, M.path.width, C.walkwayDark, [C.walkway, C.walkwayLight]);
    for (const [at, y] of [
      [from, top],
      [to, y1],
    ] as const)
      for (const side of [-1, 1]) pile(b, at.x + side * 0.6, at.z, raw(at.x, at.z) - 0.4, y + 0.12, C.walkwayDark, 0.14);
  });
  // Les rambardes de corde, d'une tête de pieu à l'autre, des deux côtés de la passerelle en coude.
  add(2, 0.34, (b) => {
    for (const [from, to] of [
      [W.start, W.knee],
      [W.knee, W.end],
    ] as const) {
      const [a, e] = [walkSides(from, to, from), walkSides(from, to, to)];
      for (const k of [0, 1]) b.beam({ x: a[k].x, y: postTop - 0.05, z: a[k].z }, { x: e[k].x, y: postTop - 0.05, z: e[k].z }, 0.06, C.cord);
    }
  });
  // Le petit ponton d'accostage, à l'ouest du carbet, un peu plus bas que son plancher, sur deux pieux.
  add(2, 0.67, (b) => {
    const P = M.pontoon;
    plankWalk(b, { x: P.x + P.w / 2, z: P.z }, { x: P.x - P.w / 2, z: P.z }, floor - 0.12, floor - 0.12, P.d, C.walkwayDark, [C.walkway, C.walkwayLight]);
    for (const sz of [-1, 1]) pile(b, P.x - P.w / 2 + 0.1, P.z + sz * (P.d / 2 - 0.08), bed, floor + 0.05, C.walkwayDark, 0.14);
  });
}

/** Le plancher du carbet de la Mangrove, au-dessus du sol du centre du lieu : un peu plus haut que le platelage. */
export const mangroveCarbetFloor = (): number => mangroveDeckTop() + MANGROVE.carbet.floor - 0.3;

/** Les deux pieux, de part et d'autre d'une passerelle de `from` à `to`, en son point `at` (à côté des planches). */
function walkSides(from: Vec2, to: Vec2, at: Vec2): [Vec2, Vec2] {
  const l = Math.hypot(to.x - from.x, to.z - from.z) || 1e-6;
  const [nx, nz] = [(to.z - from.z) / l, -(to.x - from.x) / l];
  const o = MANGROVE.walk.width / 2 + 0.1;
  return [
    { x: at.x + nx * o, z: at.z + nz * o },
    { x: at.x - nx * o, z: at.z - nz * o },
  ];
}

/** Les pilotis cassés de la ruine de la Mangrove, dans l'eau : leur pied, le haut de leur bout cassé, leur pente. */
const MANGROVE_BROKEN_PILES: readonly (readonly [number, number, number, number])[] = [
  [7.7, -3.3, 0.9, 0.35],
  [9.9, -1.2, 0.6, -0.4],
  [8.9, -5.2, 1.1, 0.25],
  [8.1, -6.9, 0.7, -0.3],
];

/** Les planches échouées dans la vase : leur milieu et leur quart de tour. */
const MANGROVE_STRANDED: readonly (readonly [number, number, number])[] = [
  [2.2, -1.8, 0.4],
  [-1.6, 0.6, -0.7],
  [2.6, 1.4, 1.2],
];

/**
 * Les Ruines (lot L8b), dans leur repère : l'arcade de quatre arcs d'est en ouest, face au sud (vue de face à
 * l'arrivée), ses piles ouest sur la terre, ses piles est dans l'eau ; le dallage devant elle, ses dalles noyées dans
 * l'eau ; l'escalier qui descend à l'eau ; la fouille ; les têtes de piles qui affleurent.
 */
export const RUINS = {
  arcade: { z: -4, piles: [-7.6, -4.2, -0.8, 2.6, 6.0], pile: 0.7, depth: 0.8, impost: 2.2, rise: 0.75, ring: 0.35, voussoirs: 7, spandrel: 0.25, cornice: 0.22 },
  paving: { x0: -8.75, x1: 8.75, z0: -3.5, z1: 1.5, cell: 1.25, drownedBeyond: 2 },
  stair: { x: 4.4, z: -2.3, steps: 3, w: 1.3, run: 0.5 },
  dig: { x: 2.2, z: 3.2, half: 0.8 },
  stubs: [
    [5.4, -2.6],
    [7.4, -2.9],
    [8.6, -1.6],
  ],
} as const;

/** Le dessus de la corniche des Ruines, au-dessus du sol du centre : le plus haut point du lieu. */
export const ruinsTop = (): number => {
  const A = RUINS.arcade;
  return A.impost + A.rise + A.ring + A.spandrel + A.cornice;
};

/**
 * Un arc surbaissé des Ruines (en anse de panier : une demi-ellipse, plus large que haute), de centre `cx` : ses
 * voussoirs (leur face avant, leur face arrière et leur douelle), en deux pierres alternées, la clé au milieu, et les
 * tympans au-dessus jusqu'au haut du mur. Aucune face cachée (le dos des voussoirs, contre le tympan). `ornate` : la
 * seule clé ornée de l'arcade (`RUINS_ORNATE_ARCH`).
 */
function passeurArch(b: FacetBuilder, cx: number, half: number, ornate: boolean): void {
  const A = RUINS.arcade;
  const [zf, zb] = [A.z + A.depth / 2, A.z - A.depth / 2];
  const top = A.impost + A.rise + A.ring + A.spandrel;
  const inner = (t: number) => [cx + half * Math.cos(t), A.impost + A.rise * Math.sin(t)] as const;
  const outer = (t: number) => [cx + (half + A.ring) * Math.cos(t), A.impost + (A.rise + A.ring) * Math.sin(t)] as const;
  const n = A.voussoirs;
  for (let k = 0; k < n; k++) {
    const [ta, tb] = [Math.PI - (k * Math.PI) / n, Math.PI - ((k + 1) * Math.PI) / n];
    const [ia, ib, oa, ob] = [inner(ta), inner(tb), outer(ta), outer(tb)];
    const color = k % 2 ? C.passeurStone : C.passeurShade;
    quadToward(b, [[ia[0], ia[1], zf], [ib[0], ib[1], zf], [ob[0], ob[1], zf], [oa[0], oa[1], zf]], [0, 0, 1], color);
    quadToward(b, [[ia[0], ia[1], zb], [ib[0], ib[1], zb], [ob[0], ob[1], zb], [oa[0], oa[1], zb]], [0, 0, -1], color);
    const mid = (ta + tb) / 2;
    quadToward(b, [[ia[0], ia[1], zf], [ib[0], ib[1], zf], [ib[0], ib[1], zb], [ia[0], ia[1], zb]], [-Math.cos(mid), -Math.sin(mid), 0], C.passeurShade);
    // Le tympan au-dessus du voussoir, jusqu'au haut du mur, devant et derrière.
    for (const [z, out] of [
      [zf, 1],
      [zb, -1],
    ] as const)
      quadToward(b, [[oa[0], oa[1], z], [ob[0], ob[1], z], [ob[0], top, z], [oa[0], top, z]], [0, 0, out], C.passeurStone);
  }
  // Le dessus du mur, entre les deux piles (la corniche le couvre ensuite).
  quadToward(b, [[cx - half - A.ring, top, zf], [cx + half + A.ring, top, zf], [cx + half + A.ring, top, zb], [cx - half - A.ring, top, zb]], [0, 1, 0], C.passeurStone);
  if (!ornate) return;
  // La clé ornée et sa vague de bronze (relecture DA de L8 : une seule clé, jamais une rangée de petits signes) : une
  // incrustation sur toute la largeur de la face avant de la clé, son bas sur la douelle, son haut une seule onde, un
  // creux et une crête (jamais un chevron), à mi-hauteur de la clé ; elle suit les joints de la clé.
  const key = (n - 1) / 2;
  const [ta, tb] = [Math.PI - (key * Math.PI) / n, Math.PI - ((key + 1) * Math.PI) / n];
  const [ia, ib, oa, ob] = [inner(ta), inner(tb), outer(ta), outer(tb)];
  const on = (u: number, v: number) => {
    const lo = [ia[0] + (ib[0] - ia[0]) * u, ia[1] + (ib[1] - ia[1]) * u];
    const hi = [oa[0] + (ob[0] - oa[0]) * u, oa[1] + (ob[1] - oa[1]) * u];
    return [lo[0] + (hi[0] - lo[0]) * v, lo[1] + (hi[1] - lo[1]) * v, zf + 0.012] as const;
  };
  const crest = (i: number) => 0.5 + 0.2 * Math.sin((2 * Math.PI * i) / 6);
  for (let i = 0; i < 6; i++) quadToward(b, [on(i / 6, 0), on((i + 1) / 6, 0), on((i + 1) / 6, crest(i + 1)), on(i / 6, crest(i))], [0, 0, 1], C.bronze);
}

/**
 * La seule clé ornée de l'arcade des Ruines (relecture DA de L8) : celle de l'arc 1, entre les piles 1 et 2. Les arcs 0
 * et 1 sont à égale distance de l'axe de la scénette (la pile 1) ; l'arc 1 est le plus près du centre du lieu (on le
 * voit à l'arrivée) et, dans la scénette, il tombe dans la moitié du cadre que le panneau ne couvre pas.
 */
export const RUINS_ORNATE_ARCH = 1;

/**
 * Les Ruines (lot L8b). Avant (éteintes par le temps et la mer) : le dallage ensablé et ses dalles
 * noyées sous l'eau claire, deux piles tronquées debout, une pile couchée, des voussoirs épars dans le sable et l'eau peu
 * profonde. Le corps : les cinq piles relevées (d'abord celles de la terre, puis celles de l'eau) ; le sable et la pile
 * couchée s'en vont. Le haut : les quatre arcs surbaissés, leurs voussoirs, leurs clés au motif de vagues des Passeurs, puis
 * la corniche basse (les voussoirs épars s'en vont). Les abords (l'étape des traces) : l'escalier qui descend à l'eau, la
 * fouille (une fosse carrée bordée de planches), les têtes de piles qui affleurent. Aucune animation, aucun texte. Sur la
 * rive basse du sud du lagon (terrain.ts).
 */
function passeurRuins(add: Add): void {
  const A = RUINS.arcade;
  const P = RUINS.paving;
  const g = siteGround('ruins');
  const raw = rawGround('ruins');
  const c = placeById('ruins').center;
  const water = g.water;
  const bed = water - 0.8;
  const up = [0, 1, 0] as const;
  const onLand = (x: number, z: number) => landDistance({ x: c.x + x, z: c.z + z }) >= 0.4;
  // Le dallage : des dalles et leurs joints (l'herbe ou le sable entre elles) ; sur la terre, posées sur le sol ; dans
  // l'eau, les dalles noyées, un aplat pâle juste au-dessus de l'eau, à 0,06 (à 0,012, il ne se voyait plus : relevé sur
  // capture), ni inscription ni mosaïque ; jamais plus haut que 0,08, jamais une tranche (elles se liraient comme un gué,
  // relecture DA de L8). Le dallage continue sous l'eau à l'est, sur sa première rangée seulement (`drownedBeyond`
  // dalles de plus, plus loin dans l'eau, dans l'alignement des autres : jamais en pas japonais).
  add('ruine', 0, (b) => {
    const nx = Math.round((P.x1 - P.x0) / P.cell);
    const nz = Math.round((P.z1 - P.z0) / P.cell);
    for (let i = 0; i < nx + P.drownedBeyond; i++)
      for (let k = 0; k < (i < nx ? nz : 1); k++) {
        const [x0, x1] = [P.x0 + i * P.cell + 0.05, P.x0 + (i + 1) * P.cell - 0.05];
        const [z0, z1] = [P.z0 + k * P.cell + 0.05, P.z0 + (k + 1) * P.cell - 0.05];
        const corners = [
          [x0, z0],
          [x1, z0],
          [x1, z1],
          [x0, z1],
        ] as const;
        const land = corners.filter(([x, z]) => onLand(x, z)).length;
        if (land === 4) quadToward(b, corners.map(([x, z]) => [x, raw(x, z) + 0.05, z] as const), up, C.passeurShade);
        else if (land === 0 && corners.every(([x, z]) => landDistance({ x: c.x + x, z: c.z + z }) < -0.3)) quadToward(b, corners.map(([x, z]) => [x, water + 0.06, z] as const), up, C.drownedStone);
      }
  });
  // Le sable sur le dallage : un aplat arrondi et irrégulier, sur la terre seulement ; il s'en va quand les piles se relèvent.
  add(
    'ruine',
    0,
    (b) => {
      const n = 12;
      const [cx, cz, rx, rz] = [-2.5, -1, 6.2, 2.4];
      const rim = Array.from({ length: n }, (_, k) => {
        const t = (2 * Math.PI * k) / n;
        let r = 0.8 + 0.2 * (((k * 7) % 5) / 4);
        const at = (s: number) => ({ x: cx + Math.cos(t) * rx * s, z: cz + Math.sin(t) * rz * s });
        while (r > 0.2 && !onLand(at(r).x, at(r).z)) r -= 0.1;
        return [at(r), at(r / 2)] as const;
      });
      const lift = (p: Vec2) => [p.x, raw(p.x, p.z) + 0.09, p.z] as const;
      const mid = lift({ x: cx, z: cz });
      for (let k = 0; k < n; k++) {
        const [outA, inA] = rim[k];
        const [outB, inB] = rim[(k + 1) % n];
        b.triangle(mid, lift(inB), lift(inA), C.sandFill);
        quadToward(b, [lift(inA), lift(inB), lift(outB), lift(outA)], up, C.sandFill);
      }
      // La pile couchée, à demi dans le sable, devant l'arcade, et la première pile tronquée, debout.
      b.box({ x: -6.2, y: raw(-6.2, -1.6) - 0.15, z: -1.6, yaw: 0.35 }, [2.0, 0.6, 0.62], C.worn, C.wornTop);
      b.box({ x: A.piles[1], y: bed, z: A.z }, [A.pile - 0.04, 1.1 - bed, A.depth - 0.04], C.worn, C.wornTop);
    },
    { stage: 0, row: 0 },
  );
  // La seconde pile tronquée, dans l'eau : elle s'en va quand les piles de l'eau se relèvent.
  add('ruine', 0, (b) => b.box({ x: A.piles[3], y: bed, z: A.z }, [A.pile - 0.04, water + 0.55 - bed, A.depth - 0.04], C.worn, C.wornTop), { stage: 0, row: 0.67 });
  // Les voussoirs épars, dans le sable et l'eau peu profonde : ils s'en vont quand les arcs se posent.
  add(
    'ruine',
    0,
    (b) => {
      for (const [x, z, yaw] of RUINS_FALLEN_VOUSSOIRS) {
        const y = onLand(x, z) ? raw(x, z) - 0.08 : water - 0.14;
        b.box({ x, y, z, yaw, pitch: 0.12 }, [0.5, 0.34, 0.42], C.worn, C.wornTop);
      }
    },
    { stage: 1, row: 0 },
  );
  // Le corps : les piles, de la terre, du bord, puis de l'eau, leur pied sous le sol ou au fond, leur imposte un peu
  // plus large.
  for (const [row, ks] of [
    [0, [0, 1]],
    [0.34, [2]],
    [0.67, [3, 4]],
  ] as const)
    add(0, row, (b) => {
      for (const k of ks) {
        const x = A.piles[k];
        b.box({ x, y: bed, z: A.z }, [A.pile, A.impost - 0.16 - bed, A.depth], C.passeurStone);
        b.box({ x, y: A.impost - 0.16, z: A.z }, [A.pile + 0.14, 0.16, A.depth + 0.1], C.passeurShade);
      }
    });
  // Le haut : les arcs, deux par deux, d'ouest en est ; aux deux bouts, le mur monte au-dessus des piles ; puis la corniche.
  const half = (A.piles[1] - A.piles[0]) / 2 - A.pile / 2;
  const wallTop = A.impost + A.rise + A.ring + A.spandrel;
  for (const [row, ks] of [
    [0, [0, 1]],
    [0.34, [2, 3]],
  ] as const)
    add(1, row, (b) => {
      for (const k of ks) passeurArch(b, (A.piles[k] + A.piles[k + 1]) / 2, half, k === RUINS_ORNATE_ARCH);
      const end = ks[0] === 0 ? A.piles[0] - A.pile / 4 : A.piles[4] + A.pile / 4;
      b.box({ x: end, y: A.impost, z: A.z }, [A.pile / 2, wallTop - A.impost, A.depth], C.passeurStone);
    });
  add(1, 0.67, (b) => {
    const [x0, x1] = [A.piles[0] - A.pile / 2 - 0.12, A.piles[4] + A.pile / 2 + 0.12];
    b.box({ x: (x0 + x1) / 2, y: wallTop, z: A.z }, [x1 - x0, A.cornice, A.depth + 0.24], C.passeurShade, C.passeurStone);
  });
  // Les abords : l'escalier qui descend du dallage à l'eau, vers l'est ; la fouille, une fosse carrée bordée de planches,
  // son fond de sable d'une seule couleur (jamais des couches) ; les têtes de piles qui affleurent devant l'arcade.
  add(2, 0, (b) => {
    const S = RUINS.stair;
    const y0 = raw(S.x - S.run, S.z) + 0.05;
    for (let k = 0; k < S.steps; k++) {
      const y = y0 - ((k + 1) * (y0 - water - 0.05)) / S.steps;
      b.box({ x: S.x + k * S.run, y: bed, z: S.z }, [S.run, y - bed, S.w], C.passeurShade, C.passeurStone);
    }
  });
  add(2, 0.34, (b) => {
    const D = RUINS.dig;
    const y = raw(D.x, D.z);
    quadToward(
      b,
      [
        [D.x - D.half, y + 0.03, D.z - D.half],
        [D.x + D.half, y + 0.03, D.z - D.half],
        [D.x + D.half, y + 0.03, D.z + D.half],
        [D.x - D.half, y + 0.03, D.z + D.half],
      ],
      up,
      C.digSand,
    );
    for (const side of [-1, 1]) {
      b.box({ x: D.x, y: y - 0.1, z: D.z + side * D.half }, [2 * D.half + 0.16, 0.24, 0.12], C.darkWood, C.wood);
      b.box({ x: D.x + side * D.half, y: y - 0.1, z: D.z }, [0.12, 0.24, 2 * D.half - 0.08], C.darkWood, C.wood);
    }
  });
  add(2, 0.67, (b) => {
    for (const [x, z] of RUINS.stubs) b.box({ x, y: bed, z }, [0.62, water + 0.12 - bed, 0.62], C.passeurShade, C.passeurStone);
  });
}

/** Les voussoirs épars de la ruine des Ruines (lot L8b), dans leur repère : dans le sable devant l'arcade et dans l'eau peu profonde. */
const RUINS_FALLEN_VOUSSOIRS = [
  [-3.1, -2.6, 0.5],
  [-0.4, -2.9, -0.4],
  [1.6, -2.2, 1.1],
  [3.6, -3.3, 0.2],
  [4.8, -4.9, -0.7],
] as const;

/** Une ruine du 4e (./ruins4e.ts), en une seule pièce : ses lieux n'ont pas encore d'étapes (GD-22, lot 2). */
const ruinOnly =
  (draw: (b: FacetBuilder) => void) =>
  (add: Add): void =>
    add('ruine', 0, draw);

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
  mangrove,
  ruins: passeurRuins,
  observatory,
  commons,
  // Le large (lot L9) : dessinés dans leur fichier, comme le rivage nord.
  beacons: northPlace('beacons'),
  ferry: northPlace('ferry'),
  // Le 5e : la Montée finie (lot 3), le Hameau (lot 5), les Radeaux (lot 6), la Croisée (lot 7), les Instants (lot 8),
  // les Fumerolles (lot 9), l'Étuve (lot 10), les Terrasses (lot 11), l'Auberge (lot 12), le Donjon (lot 13a), l'Oracle
  // (lot 13b), le Sémaphore (lot 14), le Gaillard (lot 15) et les Nacelles (lot 16), dessinés dans leur fichier ; les autres, des
  // ruines simples (lot 2).
  montee: northPlace('montee'),
  radeaux: northPlace('radeaux'),
  croisee: northPlace('croisee'),
  instants: northPlace('instants'),
  semaphore: northPlace('semaphore'),
  gaillard: northPlace('gaillard'),
  donjon: northPlace('donjon'),
  terrasses: northPlace('terrasses'),
  fumerolles: northPlace('fumerolles'),
  etuve: northPlace('etuve'),
  nacelles: northPlace('nacelles'),
  hameau: northPlace('hameau'),
  auberge: northPlace('auberge'),
  oracle: northPlace('oracle'),
  // Le 4e : la Forge et la Soute (lot 2), dessinées dans leur fichier ; les autres, des ruines simples (lot 1, ./ruins4e.ts).
  forge: northPlace('forge'),
  soute: northPlace('soute'),
  porte: ruinOnly(RUINS_4E.porte),
  etalon: ruinOnly(RUINS_4E.etalon),
  gabarit: ruinOnly(RUINS_4E.gabarit),
  manufacture: ruinOnly(RUINS_4E.manufacture),
  loge: ruinOnly(RUINS_4E.loge),
  chariot: ruinOnly(RUINS_4E.chariot),
  herbier: ruinOnly(RUINS_4E.herbier),
  roches: ruinOnly(RUINS_4E.roches),
  jonction: ruinOnly(RUINS_4E.jonction),
  veillee: ruinOnly(RUINS_4E.veillee),
  basilique: ruinOnly(RUINS_4E.basilique),
  terminus: ruinOnly(RUINS_4E.terminus),
  orgues: ruinOnly(RUINS_4E.orgues),
  dynamo: ruinOnly(RUINS_4E.dynamo),
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
