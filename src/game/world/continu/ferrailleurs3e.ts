// La fin des Ferrailleurs (le Cirque du 3e, GD-25 ; décision du mainteneur du 22 octobre 2026, point 2 ; proposition du
// Cirque, « La fin des Ferrailleurs ») : les pièces de bronze qu'ils avaient démontées du pont du Rafiot, au 6e, au 5e et
// au 4e, pour les monter sur la gondole de leur zeppelin. Chacune se reconnaît à sa forme, sans étiquette : une cloche,
// une marmite, un miroir, une vasque, un crochet. Au Fanal restauré, ils les rendent : elles quittent la gondole et
// apparaissent rangées sur un râtelier de bois au pied du Fanal, côté Rampe ; Grappin se tient à côté, en pion, graphite
// et prune ; au nord, à l'horizon, leur port répond d'une seule lumière fixe. Ce fichier dessine les pièces, le râtelier,
// Grappin et le port ; le Fanal les montre à sa restauration (./fanal3e.ts, `restoration`), la gondole les porte avant
// (./parvis3e.ts, `zeppelinPiecesFacets`). Le bronze n'est qu'aux pièces rendues (relecture des Prairies, (b) 4). Code pur.
import type { FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { C3E } from './place3eKit';
import { COLORS_3E } from './plan3e';

/** Le bronze des pièces, au soleil et à l'ombre, et le dedans d'une marmite ou d'une vasque, un brun chaud (jamais presque noir). */
const BRONZE = { side: C3E.bronze, sun: 0xb98c4c, inside: 0x7a5a36 } as const;

/** Les cinq pièces, dans l'ordre où elles se rangent sur le râtelier, de gauche à droite vues de face. */
export const PIECES_3E = ['marmite', 'cloche', 'vasque', 'crochet', 'miroir'] as const;
export type Piece3e = (typeof PIECES_3E)[number];

/** Une pièce pendue (la cloche, le crochet) se suspend à la barre du haut ; les autres se posent sur la planche. */
export const HANGS_3E: Readonly<Record<Piece3e, boolean>> = { marmite: false, cloche: true, vasque: false, crochet: true, miroir: false };

/** La hauteur de chaque pièce, à l'échelle 1 (le haut d'une pièce pendue, depuis son bas). */
export const PIECE_HEIGHT_3E: Readonly<Record<Piece3e, number>> = { marmite: 0.46, cloche: 0.6, vasque: 0.34, crochet: 0.78, miroir: 0.82 };

/**
 * Une pièce, son bas en (`x`, `y`, `z`), à l'échelle `s`, sa face vers +z : la cloche évasée et sa couronne ; la marmite
 * ventrue, ses deux anses et ses trois pieds ; le miroir rond debout sur son pied ; la vasque large et basse sur son pied ;
 * le crochet en J, son anneau en haut.
 */
export function piece3e(b: FacetBuilder, id: Piece3e, x: number, y: number, z: number, s = 1): void {
  const P = (dx: number, dy: number, dz = 0) => ({ x: x + dx * s, y: y + dy * s, z: z + dz * s });
  switch (id) {
    case 'cloche':
      b.prism(P(0, 0), 0.38 * s, 0.33 * s, 0.08 * s, 8, BRONZE.sun);
      b.prism(P(0, 0.08), 0.33 * s, 0.17 * s, 0.4 * s, 8, BRONZE.side, BRONZE.sun);
      b.prism(P(0, 0.48), 0.17 * s, 0.09 * s, 0.07 * s, 8, BRONZE.sun);
      b.drum({ ...P(0, 0.6, -0.03), pitch: Math.PI / 2 }, 0.06 * s, 0.06 * s, 6, BRONZE.side);
      return;
    case 'marmite':
      for (let k = 0; k < 3; k++) {
        const a = (2 * Math.PI * k) / 3 + 0.5;
        b.prism(P(Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2), 0.04 * s, 0.04 * s, 0.1 * s, 4, BRONZE.side);
      }
      b.prism(P(0, 0.08), 0.24 * s, 0.34 * s, 0.22 * s, 8, BRONZE.side, BRONZE.side);
      b.prism(P(0, 0.3), 0.34 * s, 0.3 * s, 0.12 * s, 8, BRONZE.side, BRONZE.inside);
      b.prism(P(0, 0.42), 0.33 * s, 0.33 * s, 0.04 * s, 8, BRONZE.sun, BRONZE.inside);
      for (const side of [-1, 1]) b.box(P(side * 0.39, 0.3), [0.08 * s, 0.14 * s, 0.1 * s], BRONZE.sun);
      return;
    case 'vasque':
      b.prism(P(0, 0), 0.16 * s, 0.09 * s, 0.1 * s, 8, BRONZE.side);
      b.prism(P(0, 0.1), 0.12 * s, 0.5 * s, 0.22 * s, 8, BRONZE.side, BRONZE.inside);
      b.prism(P(0, 0.31), 0.5 * s, 0.5 * s, 0.03 * s, 8, BRONZE.sun, BRONZE.inside);
      return;
    case 'crochet': {
      const t = 0.07 * s;
      const pts: [number, number][] = [
        [0, 0.72],
        [0, 0.24],
        [0.06, 0.08],
        [0.2, 0.02],
        [0.32, 0.1],
        [0.34, 0.26],
      ];
      for (let k = 1; k < pts.length; k++) b.beam(P(pts[k - 1][0] - 0.12, pts[k - 1][1]), P(pts[k][0] - 0.12, pts[k][1]), t, k % 2 ? BRONZE.side : BRONZE.sun);
      b.drum({ ...P(-0.12, 0.72, -0.03), pitch: Math.PI / 2 }, 0.08 * s, 0.06 * s, 6, BRONZE.sun);
      return;
    }
    case 'miroir':
      b.box(P(0, 0), [0.36 * s, 0.06 * s, 0.22 * s], BRONZE.side, BRONZE.sun);
      b.box(P(0, 0.06), [0.08 * s, 0.12 * s, 0.08 * s], BRONZE.side);
      b.drum({ ...P(0, 0.48, -0.03), pitch: Math.PI / 2 }, 0.34 * s, 0.06 * s, 10, BRONZE.side, BRONZE.sun);
      return;
  }
}

/** Le râtelier de bois : sa longueur, la hauteur de sa planche et de sa barre, la profondeur de la planche ; la place des pièces le long. */
const RACK_3E = { length: 3.9, shelf: 0.75, bar: 1.75, depth: 0.5, at: [-1.45, -0.7, 0.1, 0.85, 1.5] as const } as const;

/**
 * Le râtelier de bois dans son repère (son pied en y = 0, sa longueur le long de x, sa face vers +z) et ses `shown`
 * premières pièces (`PIECES_3E`) : la planche porte la marmite, la vasque et le miroir, la barre du haut la cloche et le
 * crochet, chacun à sa cordelette de cuir.
 */
export function rack3e(l: FacetBuilder, shown: number): void {
  const R = RACK_3E;
  for (const sx of [-1, 1]) {
    l.box({ x: (sx * R.length) / 2, y: -0.3, z: 0 }, [0.16, R.bar + 0.4, 0.16], C3E.woodShade, C3E.wood);
    l.beam({ x: (sx * R.length) / 2, y: 0, z: -0.45 }, { x: (sx * R.length) / 2, y: R.shelf * 0.8, z: -0.06 }, 0.1, C3E.woodShade);
  }
  l.box({ x: 0, y: R.shelf - 0.07, z: 0 }, [R.length + 0.1, 0.07, R.depth], C3E.woodShade, C3E.newWood);
  l.box({ x: 0, y: R.bar, z: 0 }, [R.length + 0.3, 0.12, 0.12], C3E.woodShade, C3E.wood);
  PIECES_3E.slice(0, shown).forEach((id, k) => {
    const x = R.at[k];
    if (!HANGS_3E[id]) return piece3e(l, id, x, R.shelf, 0.02);
    const bottom = R.shelf + 0.28;
    const top = bottom + PIECE_HEIGHT_3E[id];
    l.beam({ x: id === 'crochet' ? x - 0.12 : x, y: R.bar, z: 0 }, { x: id === 'crochet' ? x - 0.12 : x, y: top - 0.02, z: 0 }, 0.04, C3E.leather);
    piece3e(l, id, x, bottom, 0);
  });
}

/** Les couleurs de Grappin, en pion : la veste prune, le bas graphite, les cheveux d'un brun gris ; le teint. */
const GRAPPIN = { coat: COLORS_3E.prune, legs: COLORS_3E.graphite, hair: 0x6a5a50, skin: 0xe3b48a, boots: 0x5a5552 } as const;

/** Une tête à facettes (comme celle des pions de scénette), en `c`, de rayon `r`. */
function head(b: FacetBuilder, c: Vec3, r: number, color: number): void {
  const rings = 5,
    sides = 8;
  const at = (i: number, k: number) => {
    const phi = (Math.PI * i) / rings;
    const theta = (2 * Math.PI * k) / sides;
    return [c.x + r * Math.sin(phi) * Math.cos(theta), c.y + r * Math.cos(phi), c.z + r * Math.sin(phi) * Math.sin(theta)] as const;
  };
  for (let i = 0; i < rings; i++)
    for (let k = 0; k < sides; k++) {
      const a = at(i, k),
        e = at(i, k + 1),
        f = at(i + 1, k + 1),
        d = at(i + 1, k);
      if (i === 0) b.triangle(a, f, d, color);
      else if (i === rings - 1) b.triangle(a, e, d, color);
      else b.quad(a, e, f, d, color);
    }
}

/**
 * Grappin en pion (aucun modèle 3D encore), debout au sol en `at`, à hauteur de Kéo : bottes, bas graphite, veste prune,
 * tête et cheveux, les bras le long du corps ; il ne parle pas dans le monde.
 */
export function grappin3e(b: FacetBuilder, at: Vec3): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, GRAPPIN.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.26, 0.24, 0.42, 8, GRAPPIN.legs);
  b.prism({ x: at.x, y: at.y + 0.56, z: at.z }, 0.31, 0.26, 0.46, 8, GRAPPIN.coat);
  head(b, { x: at.x, y: at.y + 1.16, z: at.z }, 0.2, GRAPPIN.skin);
  b.prism({ x: at.x, y: at.y + 1.24, z: at.z }, 0.215, 0.17, 0.15, 8, GRAPPIN.hair);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.32, y: at.y + 0.97, z: at.z }, { x: at.x + side * 0.38, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, GRAPPIN.coat);
}

/**
 * Le port des Ferrailleurs, au nord, à l'horizon (proposition du Cirque, « La vue finale ») : un rocher de granit dans
 * les nuages, une tour de ferraille, et sa lanterne, éteinte, puis allumée d'ocre, une seule lumière fixe, quand le Fanal
 * est restauré. Assez haute pour sortir du brouillard du lointain (`FOG_3E`, qui s'éclaircit en hauteur), à moins de 200
 * unités du Cirque ; jamais sur la Carte.
 */
const FERRAILLEURS_PORT_3E = { at: { x: 30, z: -300 } as Vec2, rock: 9, rockTop: 3, tower: 13, lamp: 2.4 } as const;

/** Le port des Ferrailleurs, dans le repère du monde : son rocher, sa tour de ferraille, sa lanterne allumée ou non. */
export function ferrailleursPort3e(b: FacetBuilder, lit: boolean): void {
  const P = FERRAILLEURS_PORT_3E;
  const { x, z } = P.at;
  b.prism({ x, y: -3, z }, P.rock, P.rock * 0.7, P.rockTop + 3, 7, COLORS_3E.granite, COLORS_3E.graniteSun);
  b.prism({ x: x + 3, y: -3, z: z + 4 }, P.rock * 0.5, P.rock * 0.3, P.rockTop + 2, 6, COLORS_3E.graniteShade, COLORS_3E.granite);
  b.prism({ x, y: P.rockTop, z }, 1.6, 0.8, P.tower, 4, COLORS_3E.graphite);
  const y = P.rockTop + P.tower;
  b.box({ x, y, z }, [P.lamp, P.lamp, P.lamp], lit ? C3E.lantern : C3E.lanternOff);
  b.prism({ x, y: y + P.lamp, z, yaw: Math.PI / 4 }, P.lamp * 0.85, 0, P.lamp * 0.6, 4, COLORS_3E.graphite);
}
