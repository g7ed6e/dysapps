// La fin des Ferrailleurs (le Cirque du 3e, GD-25 ; décision du mainteneur du 22 octobre 2026, point 2 ; proposition du
// Cirque, « La fin des Ferrailleurs ») : les pièces de bronze qu'ils avaient démontées du pont du Rafiot, au 6e, au 5e et
// au 4e, pour les monter sur la gondole de leur zeppelin. Ce sont les six du pont du Rafiot du 4e, aux mêmes formes
// (./crique4e.ts, `rafiotPiece`), chacune reconnaissable sans étiquette : l'anneau d'amarrage, la cloche, le poids étalon,
// le régulateur à boules, le gong, la vasque. Au Fanal restauré, ils les rendent : elles quittent la gondole et
// apparaissent rangées sur un râtelier de bois au pied du Fanal, côté Rampe ; Grappin se tient à côté, en pion, graphite
// et prune ; au nord, à l'horizon, leur port répond d'une seule lumière fixe. Ce fichier dessine les pièces, le râtelier,
// Grappin et le port ; le Fanal les montre à sa restauration (./fanal3e.ts, `restoration`), la gondole les porte avant
// (./parvis3e.ts, `zeppelinPiecesFacets`). Le bronze n'est qu'aux pièces rendues (relecture des Prairies, (b) 4) :
// celui de `PIECES_BRONZE`, le même qu'au pont du Rafiot. Code pur.
import { PIECES_BRONZE, RAFIOT_PIECE_HEIGHT, rafiotPiece, type RafiotPiece } from './crique4e';
import { drawPosed, type FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { C3E } from './place3eKit';
import { COLORS_3E } from './plan3e';
import { rock } from './surroundingsKit';

/**
 * Les six pièces du Rafiot (`RAFIOT_PIECES`), dans l'ordre où elles se rangent sur le râtelier, de gauche à droite vues
 * de face : la cloche pend au-dessus du poids étalon.
 */
export const PIECES_3E = ['anneau', 'regulateur', 'cloche', 'poids', 'gong', 'vasque'] as const satisfies readonly RafiotPiece[];
export type Piece3e = (typeof PIECES_3E)[number];

/** Une pièce pendue (la cloche) se suspend à la barre du haut ; les autres se posent sur la planche. */
export const HANGS_3E: Readonly<Record<Piece3e, boolean>> = { anneau: false, regulateur: false, cloche: true, poids: false, gong: false, vasque: false };

/** La hauteur de chaque pièce, à l'échelle 1 (le haut d'une pièce pendue, depuis son bas). */
export const PIECE_HEIGHT_3E: Readonly<Record<Piece3e, number>> = RAFIOT_PIECE_HEIGHT;

/** Une pièce du Rafiot, son bas en (`x`, `y`, `z`), à l'échelle `s`, sa face vers +z (l'anneau, le gong, les boules du régulateur). */
export function piece3e(b: FacetBuilder, id: Piece3e, x: number, y: number, z: number, s = 1): void {
  drawPosed(b, { x, y, z, yaw: Math.PI / 2 }, (l) => rafiotPiece(l, id, 0, 0, 0, PIECES_BRONZE, s));
}

/**
 * Le râtelier de bois : sa longueur, la hauteur de sa planche et de sa barre, la profondeur de la planche, l'échelle des
 * pièces ; la place des pièces le long (la cloche au-dessus du poids).
 */
const RACK_3E = { length: 3.9, shelf: 0.75, bar: 2.05, depth: 0.5, scale: 0.85, at: [-1.47, -0.73, -0.06, -0.06, 0.66, 1.46] as const } as const;

/**
 * Le râtelier de bois dans son repère (son pied en y = 0, sa longueur le long de x, sa face vers +z) et ses `shown`
 * premières pièces (`PIECES_3E`) : la planche porte l'anneau, le régulateur, le poids, le gong et la vasque ; la barre
 * du haut la cloche, à sa cordelette de cuir.
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
    if (!HANGS_3E[id]) return piece3e(l, id, x, R.shelf, 0.02, R.scale);
    const bottom = R.bar - 0.12 - PIECE_HEIGHT_3E[id] * R.scale;
    l.beam({ x, y: R.bar, z: 0 }, { x, y: bottom + PIECE_HEIGHT_3E[id] * R.scale - 0.02, z: 0 }, 0.04, C3E.leather);
    piece3e(l, id, x, bottom, 0, R.scale);
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
 * Le port des Ferrailleurs, au nord, loin sur l'horizon (proposition du Cirque, « La vue finale » ; relecture du Cirque,
 * correction 2 : la tour de ferraille se lisait comme un second phare, et seul le Fanal doit se reconnaître de partout).
 * Une silhouette basse et large, posée au ras des nuages : un récif de granit, une longue jetée de ferraille, une grue,
 * les mâts de deux coques amarrées, et la lumière sur un poteau bas, au bout de la jetée. Éteinte, une vitre gris-bleu
 * sombre ; allumée d'ocre, une seule lumière fixe, quand le Fanal est restauré. À environ 215 unités du Fanal, plus loin
 * que les lieux, dans le brouillard du lointain (`FOG_3E`) ; jamais sur la Carte. `at` : le milieu de la jetée ; `jetty` :
 * sa longueur (d'ouest en est), sa largeur, son dessus ; `crane`, `masts`, `post`, `lamp` : leurs hauteurs.
 */
export const FERRAILLEURS_PORT_3E = {
  at: { x: 40, z: -330 } as Vec2,
  jetty: { length: 36, width: 3, top: 1.4 },
  crane: { at: -11, h: 8, jib: 8 },
  masts: [
    { at: 2, h: 6.5 },
    { at: 8.5, h: 5.5 },
  ],
  post: 2.8,
  lamp: 2.1,
} as const;

/** La vitre éteinte du port, un gris-bleu sombre (jamais presque noir), loin du crème des lanternes éteintes des lieux. */
export const PORT_LAMP_OFF_3E = 0x56637a;

/** Les tons du granit du récif, en rochers à facettes. */
const REEF = { light: COLORS_3E.graniteSun, shade: COLORS_3E.graniteShade, top: COLORS_3E.granite } as const;

/** Le port des Ferrailleurs, dans le repère du monde : son récif, sa jetée, sa grue, ses mâts, sa lumière allumée ou non. */
export function ferrailleursPort3e(b: FacetBuilder, lit: boolean): void {
  const P = FERRAILLEURS_PORT_3E;
  const { x, z } = P.at;
  const J = P.jetty;
  // Le récif : trois rochers bas, larges, inégaux, sous la jetée et à ses bouts.
  rock(b, { x: x - 14, y: -0.6, z: z + 1 }, 7, 2.4, 31, REEF);
  rock(b, { x: x + 1, y: -0.6, z: z - 2 }, 7.5, 1.8, 32, REEF);
  rock(b, { x: x + 15, y: -0.6, z: z + 1.5 }, 6, 1.8, 33, REEF);
  // La jetée de ferraille, longue et basse, sur trois piles.
  b.box({ x, y: J.top - 0.5, z }, [J.length, 0.5, J.width], COLORS_3E.graphite, COLORS_3E.graphiteSun);
  for (const dx of [-J.length / 2 + 1, 0, J.length / 2 - 1]) b.box({ x: x + dx, y: -0.5, z }, [0.8, J.top - 0.5 + 0.5, 0.8], COLORS_3E.graphite);
  // La grue : un fût, sa flèche penchée vers le large, son câble pendant.
  const cx = x + P.crane.at;
  const top = J.top + P.crane.h;
  b.box({ x: cx, y: J.top, z }, [0.7, P.crane.h, 0.7], COLORS_3E.graphite, COLORS_3E.graphiteSun);
  b.beam({ x: cx, y: top - 0.3, z }, { x: cx - P.crane.jib, y: top + 1.2, z: z - 1 }, 0.35, COLORS_3E.graphiteSun);
  b.beam({ x: cx, y: top - 0.3, z }, { x: cx + 2, y: top - 1.6, z }, 0.3, COLORS_3E.graphite);
  b.beam({ x: cx - P.crane.jib, y: top + 1.2, z: z - 1 }, { x: cx - P.crane.jib, y: J.top + 1.5, z: z - 1 }, 0.12, COLORS_3E.graphite);
  // Deux coques basses amarrées au sud de la jetée, leurs mâts et leurs vergues.
  for (const m of P.masts) {
    const mx = x + m.at;
    b.box({ x: mx, y: -0.1, z: z + J.width / 2 + 1.1 }, [5, 1.2, 1.8], COLORS_3E.prune, COLORS_3E.graphite);
    b.box({ x: mx, y: 1, z: z + J.width / 2 + 1.1 }, [0.22, m.h, 0.22], COLORS_3E.graphite);
    b.box({ x: mx, y: 1 + m.h * 0.7, z: z + J.width / 2 + 1.1 }, [3, 0.2, 0.2], COLORS_3E.graphite);
  }
  // La lumière, sur un poteau bas au bout est de la jetée.
  const lx = x + J.length / 2 - 1.2;
  b.box({ x: lx, y: J.top, z }, [0.4, P.post, 0.4], COLORS_3E.graphite);
  b.box({ x: lx, y: J.top + P.post, z }, [P.lamp, P.lamp, P.lamp], lit ? C3E.lantern : PORT_LAMP_OFF_3E);
  b.prism({ x: lx, y: J.top + P.post + P.lamp, z, yaw: Math.PI / 4 }, P.lamp * 0.85, 0, P.lamp * 0.45, 4, COLORS_3E.graphite);
}
