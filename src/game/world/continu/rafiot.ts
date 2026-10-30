// Le Rafiot des Ferrailleurs (GD-19 ; fiche d'Archipéo, § 6 ; intention, § 5), le même bateau à chaque niveau où il
// paraît : au 4e, amarré au quai abandonné de la Crique (./crique4e.ts) ; au 6e, au mouillage près d'un lieu éteint, la seule
// trace de la bande dans ce niveau (GD-23, lot 2 ; GD-27 ; GD-28 : ./rafiot6e.ts). Un remorqueur lisible, sans voile ni
// mât : sa coque basse de fer rouillé sombre, la proue relevée, sa ligne de flottaison sombre, son liston de bois ; sa
// cabine de bois, ses fenêtres en aplats sombres, sans lanterne ; une cheminée courte ceinte de fer bruni et, s'il
// chauffe, sa fumée courte et basse, couchée vers le sud-est, jamais plus haute que deux fois la cheminée ; sur le pont
// arrière, les pièces de bronze qu'il porte à ce niveau, boulonnées, jamais comptées (GD-28). Ses couleurs sont les
// siennes (celles posées au 4e), à tous les niveaux. Code pur, sans Three.js.
import { FacetBuilder, mergeFacets, placeFacets, type Facets } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { COLORS_3E } from './plan3e';

type P3 = [number, number, number];

/**
 * Les couleurs du Rafiot (intention, § 5) : la coque de fer rouillé sombre (jamais presque noire), sa ligne de flottaison
 * plus sombre, le liston et le pont de bois, la cabine de bois et son toit, ses fenêtres en aplats sombres (sans vitre
 * lumineuse), la cheminée et sa bande de fer bruni, la fumée courte, plus sombre que le panache ; le bronze de ses
 * pièces est celui du 3e (`PIECES_BRONZE`).
 */
/** La fumée du Rafiot, sans ombre comme le panache (sinon, éclairée, elle se lisait comme des pierres en l'air). */
export const RAFIOT_SMOKE_COLORS = { smoke: 0xb3aca5, smokeShade: 0xa7a099 } as const;

/**
 * La coque du Rafiot et sa ligne de flottaison, sans ombre (retouche 1 du consultant d'Archipéo : éclairée, la lumière
 * chaude du 4e la tirait vers l'orange ; elle se lit vers #8C5444 au soleil, un fer rouillé qui ne claque pas) : chaque
 * pan au soleil ou à l'ombre, comme les Aiguilles. Des couleurs à elles (la rouille des ruines reste éclairée).
 */
export const RAFIOT_HULL_COLORS = { hull: 0x8a5446, hullShade: 0x6c4238, waterline: 0x5c3c35, waterlineShade: 0x4a302b } as const;

const RAFIOT_COLORS = {
  ...RAFIOT_HULL_COLORS,
  // Le bois et le fer du Rafiot : ceux du 4e, où il a été dessiné (`COLORS_4E.wood`, `woodShade`, `C4E.iron`), gardés tels
  // quels à tous les niveaux.
  rail: 0x9a826a,
  deck: 0x9a826a,
  cabin: 0xa08a74,
  roof: 0x7e6a56,
  window: 0x4e423a,
  funnel: 0x8e6a5a,
  iron: 0x5c504c,
  ...RAFIOT_SMOKE_COLORS,
} as const;

/**
 * Le bord de la coque, vu de dessus, dans le repère du Rafiot (la proue vers −z) : la poupe carrée, les flancs, la proue
 * en pointe, relevée ; `[x, z, y]`, le haut du bordé. Dans le sens des prismes (./facets.ts).
 */
const HULL: readonly (readonly [number, number, number])[] = [
  [1.6, 4.0, 1.0],
  [-1.6, 4.0, 1.0],
  [-1.75, 0.6, 0.95],
  [-1.5, -2.6, 1.05],
  [0, -4.7, 1.6],
  [1.5, -2.6, 1.05],
  [1.75, 0.6, 0.95],
];

/** Le pont du Rafiot, en poupe : là où les pièces de bronze sont boulonnées. */
const RAFIOT_DECK = 1.0;

/** Une boule à huit facettes (un octaèdre), de rayon `r`. */
function ball(b: FacetBuilder, c: Vec3, r: number, color: number): void {
  const p = (x: number, y: number, z: number): P3 => [c.x + x * r, c.y + y * r, c.z + z * r];
  const ring = [p(1, 0, 0), p(0, 0, 1), p(-1, 0, 0), p(0, 0, -1)];
  for (let k = 0; k < 4; k++) {
    const n = (k + 1) % 4;
    b.triangle(ring[n], ring[k], p(0, 1, 0), color);
    b.triangle(ring[k], ring[n], p(0, -1, 0), color);
  }
}

/**
 * Les six pièces de bronze du Rafiot (intention, § 5), dans l'ordre de leur place sur le pont : l'anneau d'amarrage
 * debout, la cloche de départ, le poids étalon (un cylindre trapu à anse), le régulateur à boules (deux boules sur leur
 * axe), le gong (un disque debout dans son cadre) et la vasque. Les mêmes, rendues au Fanal du 3e (./ferrailleurs3e.ts).
 */
export const RAFIOT_PIECES = ['anneau', 'cloche', 'poids', 'regulateur', 'gong', 'vasque'] as const;
export type RafiotPiece = (typeof RAFIOT_PIECES)[number];

/** La hauteur de chaque pièce, à l'échelle 1, de son pied à son haut. */
export const RAFIOT_PIECE_HEIGHT: Readonly<Record<RafiotPiece, number>> = { anneau: 0.72, cloche: 0.52, poids: 0.53, regulateur: 0.85, gong: 0.93, vasque: 0.44 };

/** Le bronze d'une pièce : ses flancs et ses dessus. */
export interface BronzeColors {
  bronze: number;
  bronzeTop: number;
}

/**
 * Le bronze des six pièces, le même sur le pont du Rafiot du 4e et, rendues, au Fanal du 3e (./ferrailleurs3e.ts) :
 * celui des ferrures du 3e (`COLORS_3E.bronze`, #A77B3F) et son dessus au soleil (#B98C4C). Un seul métal aux deux
 * endroits (restes du 3e, piste 5 ; choix du mainteneur du 23 octobre 2026 : le Rafiot portait #9C8452). La tête de
 * baleine de l'aéronef garde son bronze chaud : c'est une parure, pas une pièce.
 */
export const PIECES_BRONZE: BronzeColors = { bronze: COLORS_3E.bronze, bronzeTop: 0xb98c4c };

/**
 * Une pièce de bronze du Rafiot, son pied en (`x`, `y`, `z`), à l'échelle `s` ; ses faces debout (l'anneau, le gong, les
 * boules du régulateur) regardent ±x. Elles se lisent de loin par leur forme, aucune en croix.
 */
export function rafiotPiece(b: FacetBuilder, id: RafiotPiece, x: number, y: number, z: number, C: BronzeColors, s = 1): void {
  const P = (dx: number, dy: number, dz: number) => ({ x: x + dx * s, y: y + dy * s, z: z + dz * s });
  const flank = { yaw: Math.PI / 2, pitch: Math.PI / 2 };
  switch (id) {
    case 'anneau':
      // Debout sur son socle.
      b.box(P(0, 0, 0), [0.16 * s, 0.08 * s, 0.34 * s], C.bronze, C.bronzeTop);
      b.annulus({ ...P(-0.05, 0.38, 0), ...flank }, 0.2 * s, 0.34 * s, 0.1 * s, 6, C.bronze, C.bronzeTop);
      return;
    case 'cloche':
      // Large en bas, étroite en haut, et son bouton.
      b.prism(P(0, 0, 0), 0.3 * s, 0.13 * s, 0.42 * s, 6, C.bronze, C.bronzeTop);
      b.prism(P(0, 0.42, 0), 0.07 * s, 0.05 * s, 0.1 * s, 4, C.bronze, C.bronzeTop);
      return;
    case 'poids':
      // Un cylindre trapu, son anse en chevron.
      b.prism(P(0, 0, 0), 0.26 * s, 0.24 * s, 0.3 * s, 6, C.bronze, C.bronzeTop);
      b.beam(P(0, 0.3, -0.13), P(0, 0.5, 0), 0.06 * s, C.bronze);
      b.beam(P(0, 0.5, 0), P(0, 0.3, 0.13), 0.06 * s, C.bronze);
      return;
    case 'regulateur':
      // L'axe debout, deux bras, deux boules de part et d'autre.
      b.beam(P(0, 0, 0), P(0, 0.85, 0), 0.07 * s, C.bronze);
      for (const k of [-1, 1]) {
        b.beam(P(0, 0.8, 0), P(0, 0.5, k * 0.24), 0.05 * s, C.bronze);
        ball(b, P(0, 0.46, k * 0.28), 0.12 * s, C.bronzeTop);
      }
      return;
    case 'gong':
      // Le disque debout, son cadre de deux montants et d'une traverse.
      b.drum({ ...P(0.04, 0.5, 0), ...flank }, 0.3 * s, 0.06 * s, 6, C.bronze, C.bronzeTop);
      for (const k of [-1, 1]) b.beam(P(0, 0, k * 0.4), P(0, 0.9, k * 0.4), 0.06 * s, C.bronze);
      b.beam(P(0, 0.9, -0.45), P(0, 0.9, 0.45), 0.06 * s, C.bronze);
      return;
    case 'vasque':
      // Son pied, sa coupe évasée, le dessus clair.
      b.prism(P(0, 0, 0), 0.1 * s, 0.08 * s, 0.2 * s, 4, C.bronze);
      b.prism(P(0, 0.2, 0), 0.14 * s, 0.36 * s, 0.24 * s, 6, C.bronze, C.bronzeTop);
      return;
  }
}

/** La place de chaque pièce sur le pont arrière : deux rangées de trois. */
const RAFIOT_PIECE_AT: Readonly<Record<RafiotPiece, readonly [number, number]>> = {
  anneau: [-0.9, 2.55],
  cloche: [0, 2.55],
  poids: [0.9, 2.55],
  regulateur: [-0.9, 3.45],
  gong: [0, 3.45],
  vasque: [0.9, 3.45],
};

/** La caisse du pont avant : un bois plus clair que le pont, qui détache le bronze posé dessus. */
const RAFIOT_CRATE_COLORS = { side: 0xb3a088, top: 0xc2b09a } as const;
/** La caisse : son milieu sur le pont avant, tirée vers −x (la rive, pour un Rafiot vu de flanc de sa rive), et ses dimensions. */
const RAFIOT_CRATE = { x: -0.3, z: -1.5, size: [1.0, 0.5, 2.1] as P3 } as const;
/** Les trois places sur la caisse, en file le long du bateau : de flanc, aucune n'en cache une autre. */
const RAFIOT_CRATE_AT: readonly number[] = [-0.85, -1.5, -2.15];

/**
 * Les pièces de bronze `pieces` du Rafiot, en décor, sans texte ; leurs faces debout regardent les flancs (on voit le
 * Rafiot de flanc). Elles ne changent pas avec les lieux du niveau. Boulonnées sur le pont arrière, chacune à sa place
 * (`stern`, le 4e) ; ou posées en file sur une caisse du pont avant, la première en tête (`bow`, le 6e : trois au plus).
 */
function bronzes(b: FacetBuilder, pieces: readonly RafiotPiece[], stowed: 'stern' | 'bow'): void {
  if (stowed === 'stern') {
    for (const id of pieces) rafiotPiece(b, id, RAFIOT_PIECE_AT[id][0], RAFIOT_DECK, RAFIOT_PIECE_AT[id][1], PIECES_BRONZE);
    return;
  }
  const c = RAFIOT_CRATE;
  b.box({ x: c.x, y: RAFIOT_DECK, z: c.z }, c.size, RAFIOT_CRATE_COLORS.side, RAFIOT_CRATE_COLORS.top);
  pieces.slice(0, RAFIOT_CRATE_AT.length).forEach((id, i) => rafiotPiece(b, id, c.x, RAFIOT_DECK + c.size[1], RAFIOT_CRATE_AT[i], PIECES_BRONZE));
}

/** Où le Rafiot est amarré : son milieu dans le monde, et son cap (la proue vers −z de son repère, tourné de `yaw`). */
export interface RafiotSite {
  readonly at: Vec2;
  readonly yaw: number;
}

/**
 * Ce que le Rafiot montre à un niveau : les pièces sur son pont, où elles sont rangées (`stowed` : boulonnées sur le pont
 * arrière, derrière la cabine, au 4e ; posées sur une caisse sur le pont avant, du côté de la rive, au 6e, où elles sont
 * la seule trace et doivent se lire de près, directeur artistique, relecture du lot 3 de GD-27), et sa fumée (il
 * chauffe) ou rien (il attend).
 */
export interface RafiotLook {
  readonly pieces: readonly RafiotPiece[];
  readonly stowed?: 'stern' | 'bow';
  readonly smoke: boolean;
}

/**
 * Le Rafiot amarré en `site`, sous le soleil `sun` du niveau (à plat, vers le soleil ; chaque pan de la coque au soleil
 * ou à l'ombre, comme les Aiguilles du 4e), avec ce qu'il montre (`look`) : sa coque, sa cabine, sa cheminée, ses pièces
 * et, s'il chauffe, sa fumée (consultant d'Archipéo, relecture de la PR du 3e : le pont vide une fois les pièces rendues
 * au Fanal). Sans son quai, qui est celui du lieu.
 */
export function rafiotFacets(site: RafiotSite, sun: Vec2, look: RafiotLook): Facets {
  const b = new FacetBuilder();
  const C = RAFIOT_COLORS;
  // La coque, en quatre bandes de bordé : la flottaison (de sous l'eau à 0,3), la coque, le liston qui déborde, le plat-bord.
  const ring = (y: (top: number) => number, scale: number) => HULL.map(([x, z, top]): P3 => [x * scale, y(top), z * scale]);
  const rings = [ring(() => -0.3, 0.92), ring(() => 0.3, 0.97), ring((t) => t - 0.2, 1), ring((t) => t - 0.06, 1.04), ring((t) => t, 1)];
  // Un pan de bordé est au soleil si le milieu de son bord, vu du milieu de la coque, regarde le soleil (dans le monde).
  const yc = Math.cos(site.yaw),
    ys = Math.sin(site.yaw);
  const sunny = HULL.map(([x, z], j) => {
    const [nx, nz] = HULL[(j + 1) % HULL.length];
    const mx = (x + nx) / 2,
      mz = (z + nz) / 2;
    return (mx * yc + mz * ys) * sun.x + (-mx * ys + mz * yc) * sun.z > 0;
  });
  const bands = [
    [C.waterline, C.waterlineShade],
    [C.hull, C.hullShade],
    [C.rail, C.rail],
    [C.rail, C.rail],
  ] as const;
  for (let k = 0; k < bands.length; k++)
    for (let j = 0; j < HULL.length; j++) {
      const n = (j + 1) % HULL.length;
      b.quad(rings[k][n], rings[k][j], rings[k + 1][j], rings[k + 1][n], bands[k][sunny[j] ? 0 : 1]);
    }
  const deck = rings[rings.length - 1];
  const middle: P3 = [0, RAFIOT_DECK, 0];
  for (let j = 0; j < HULL.length; j++) b.triangle(middle, deck[(j + 1) % HULL.length], deck[j], C.deck);
  // La cabine, son toit débordant, ses fenêtres (deux par flanc, deux à l'avant), en aplats sombres.
  const cabin = { z: 0.9, w: 2.0, h: 1.45, d: 2.4 } as const;
  b.box({ x: 0, y: RAFIOT_DECK - 0.05, z: cabin.z }, [cabin.w, cabin.h, cabin.d], C.cabin);
  const roof = RAFIOT_DECK - 0.05 + cabin.h;
  b.box({ x: 0, y: roof, z: cabin.z }, [cabin.w + 0.3, 0.14, cabin.d + 0.4], C.roof, C.deck);
  const wy = RAFIOT_DECK + 0.7;
  for (const s of [-1, 1])
    for (const z of [cabin.z - 0.55, cabin.z + 0.55]) {
      const x = s * (cabin.w / 2 + 0.02);
      const q = (dz: number, dy: number): P3 => [x, wy + dy, z - s * dz];
      b.quad(q(-0.25, 0), q(0.25, 0), q(0.25, 0.45), q(-0.25, 0.45), C.window);
    }
  for (const x of [-0.45, 0.45]) {
    const z = cabin.z - cabin.d / 2 - 0.02;
    b.quad([x + 0.25, wy, z], [x - 0.25, wy, z], [x - 0.25, wy + 0.45, z], [x + 0.25, wy + 0.45, z], C.window);
  }
  // La cheminée courte, sa bande de fer bruni.
  const funnel = { z: 1.5, y: roof + 0.14, h: 1.05, r: 0.36 } as const;
  b.prism({ x: 0, y: funnel.y, z: funnel.z }, funnel.r, funnel.r - 0.02, funnel.h, 8, C.funnel, C.roof);
  b.band({ x: 0, y: funnel.y + 0.6, z: funnel.z }, funnel.r + 0.03, 0.18, 8, C.iron);
  bronzes(b, look.pieces, look.stowed ?? 'stern');
  if (!look.smoke) return placeFacets(b.build(), { x: site.at.x, y: 0, z: site.at.z, yaw: site.yaw });
  // La fumée, un panache court (retouche 1 du directeur artistique et du consultant d'Archipéo : trois prismes posés en
  // l'air se lisaient comme des pierres) : la première bouffée posée sur le haut de la cheminée, plus large en bas qu'en
  // haut ; les suivantes plus plates, qui se chevauchent, traînent vers le sud-est (dans le monde) et montent peu ; dans
  // le monde (elles ne tournent pas avec le bateau), après la coque.
  const boat = placeFacets(b.build(), { x: site.at.x, y: 0, z: site.at.z, yaw: site.yaw });
  const s = new FacetBuilder();
  const top = { x: site.at.x + funnel.z * ys, y: funnel.y + funnel.h, z: site.at.z + funnel.z * yc };
  for (const [d, y, r0, r1, h] of RAFIOT_SMOKE) s.prism({ x: top.x + d * Math.SQRT1_2, y: top.y + y, z: top.z + d * Math.SQRT1_2, yaw: d }, r0, r1, h, 6, C.smokeShade, C.smoke);
  return mergeFacets([boat, s.build()]);
}

/**
 * Les bouffées du panache du Rafiot : leur décalage vers le sud-est depuis le haut de la cheminée, leur pied au-dessus
 * de lui, leur rayon en bas et en haut, leur hauteur.
 */
const RAFIOT_SMOKE: readonly (readonly [number, number, number, number, number])[] = [
  [0, 0, 0.42, 0.3, 0.42],
  [0.7, 0.3, 0.5, 0.36, 0.25],
  [1.45, 0.42, 0.56, 0.38, 0.25],
];

/** Le haut de la cheminée du Rafiot, dans son repère : la fumée ne monte jamais à plus de deux fois sa hauteur au-dessus. */
export const RAFIOT_FUNNEL = { top: RAFIOT_DECK - 0.05 + 1.45 + 0.14 + 1.05, height: 1.05 } as const;
