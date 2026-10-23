// Le Parvis, le lieu de départ du 3e, et l'aéronef au repos (lot 1 du monde ouvert du 3e, en grandes masses ; le lieu
// entier vient avec son lot, le lot 3 de la fiche) : l'Escale du 6e servie dans les matières froides du 3e (./port.ts
// dessine les mêmes bâtiments, à la même place de leur repère) : la pierre claire, posée au sol sans pilotis, le granit
// bleuté des Passeurs, les toits d'ardoise, le bois gris. Au milieu de la place, l'aire ronde de l'aéronef (./paths3e.ts
// la dessine). Ce qui ne change jamais autour de lui : le pic, vu de toute la montagne (./terrain3e.ts), et le zeppelin
// des Ferrailleurs, amarré par le nez à son mât sur un rocher à part, immobile, qui n'est pas sur la Carte. L'aéronef se pose sur l'aire en trois
// temps, comme au 4e (world/nefModels.ts, `NEF_SISTERS[3]`) ; au lot 1, son départ monte droit vers le ciel, sans
// obstacle (le 3e est le dernier niveau : ce départ ne mène nulle part). Code pur.
import type { DetourView } from './camera';
import { drawPosed, FacetBuilder, placeFacets, type Facets } from './facets';
import { HANGS_3E, PIECE_HEIGHT_3E, PIECES_3E, piece3e } from './ferrailleurs3e';
import { distance, type Vec2 } from './geometry';
import type { NefFlight, NefSite } from './nef';
import { quadOut, triOut } from './place4eKit';
import { COLORS_3E, PARVIS, PARVIS_CORNERS, PARVIS_LEVEL, PARVIS_PAD, PARVIS_PAVING, PARVIS_QUAY_SPOT, PARVIS_ROUND, PEAK_3E, ZEPPELIN_3E } from './plan3e';
import type { PortSite } from './port';
import { peakFacets } from './terrain3e';

/**
 * Les matières du Parvis : la pierre claire de la place, ses flancs dans le granit des Passeurs ; des murs de pierre
 * blanche, des toits d'ardoise (celle des rives, plus claire pour la galerie), le bois gris, les ferrures de bronze.
 */
const PARVIS_COLORS = {
  stone: COLORS_3E.parvis,
  stoneSide: COLORS_3E.granite,
  coping: COLORS_3E.graniteSun,
  plinth: COLORS_3E.graniteShade,
  white: 0xece9e1,
  wall: 0xdcd8cc,
  frame: COLORS_3E.graniteSun,
  slate: COLORS_3E.slateTop,
  paleSlate: 0x7d93b0,
  shingle: COLORS_3E.slate,
  wood: COLORS_3E.wood,
  darkWood: COLORS_3E.woodShade,
  newWood: 0xb8a690,
  door: COLORS_3E.woodShade,
  inside: 0x9c9284,
  socle: COLORS_3E.graniteSun,
  bollard: COLORS_3E.bronze,
  lamp: COLORS_3E.lantern,
  habitant: [0x8c9f7a, 0x8a95ab, 0xa38a74],
  skin: 0xd9b38c,
} as const;

/**
 * Le muret du Parvis et sa bordure (lot du Versant) : le muret plein, de granit, à hauteur de poitrine de Kéo au-dessus
 * de la place (`height`), épais de `thick`, son chaperon d'ardoise (`coping`, qui déborde de `over`) ; la bordure d'ardoise
 * basse du côté de la montagne (`border` : sa largeur, sa hauteur au-dessus de la place) ; le pied de la pierre, sous le
 * sol.
 */
const PARVIS_WALL = { height: 1.15, thick: 0.6, coping: 0.16, over: 0.1, border: { width: 0.55, rise: 0.05 }, foot: -0.8 } as const;

/** Un pan de la place ronde porte-t-il le muret (côté des rives) ? Sinon, la bordure d'ardoise. */
const parvisWalled = (k: number): boolean => k >= PARVIS_ROUND.wall.from && k < PARVIS_ROUND.wall.to;

/**
 * La place ronde du Parvis, dans son repère : la pierre claire à plat, ses flancs de granit jusque sous le sol, puis, pan
 * par pan, le muret plein côté rives ou la bordure d'ardoise basse côté montagne (./plan3e.ts, `PARVIS_ROUND`). Le muret
 * ne s'ouvre nulle part ; chaque pan déborde un peu sur le suivant, sans jour aux angles.
 */
function parvisGround(b: FacetBuilder): void {
  const y = PARVIS_LEVEL;
  const W = PARVIS_WALL;
  const n = PARVIS_CORNERS.length;
  const c = PARVIS_ROUND.center;
  for (let k = 0; k < n; k++) {
    const a = PARVIS_CORNERS[k],
      e = PARVIS_CORNERS[(k + 1) % n];
    triOut(b, [c.x, y, c.z], [a.x, y, a.z], [e.x, y, e.z], [0, 1, 0], PARVIS_COLORS.stone);
    const out: [number, number, number] = [(a.x + e.x) / 2 - c.x, 0, (a.z + e.z) / 2 - c.z];
    quadOut(b, [a.x, W.foot, a.z], [e.x, W.foot, e.z], [e.x, y, e.z], [a.x, y, a.z], out, PARVIS_COLORS.stoneSide);
    // Le long du pan, la normale vers le dehors, le cap du pavé.
    const len = Math.hypot(e.x - a.x, e.z - a.z);
    const ox = out[0] / Math.hypot(out[0], out[2]),
      oz = out[2] / Math.hypot(out[0], out[2]);
    const yaw = Math.atan2(-(e.z - a.z), e.x - a.x);
    const mx = (a.x + e.x) / 2,
      mz = (a.z + e.z) / 2;
    if (parvisWalled(k)) {
      const w = { x: mx - (ox * W.thick) / 2, z: mz - (oz * W.thick) / 2 };
      b.box({ x: w.x, y: W.foot, z: w.z, yaw }, [len + W.thick * 0.6, y + W.height - W.foot, W.thick], COLORS_3E.graniteShade, COLORS_3E.granite);
      b.box({ x: w.x, y: y + W.height, z: w.z, yaw }, [len + W.thick * 0.6 + 2 * W.over, W.coping, W.thick + 2 * W.over], COLORS_3E.slate, COLORS_3E.slateTop);
    } else {
      const w = { x: mx + (ox * W.border.width) / 2 - ox * 0.1, z: mz + (oz * W.border.width) / 2 - oz * 0.1 };
      b.box({ x: w.x, y: W.foot, z: w.z, yaw }, [len + 0.3, y + W.border.rise - W.foot, W.border.width], COLORS_3E.slate, COLORS_3E.slateTop);
    }
  }
}

/** Le Parvis : son repère, son pavage, sa pierre posée au sol, le bout où l'on arrive (la lanterne, la ligne des habitants ; ni barque ni bitte). */
export const PARVIS_SITE: PortSite = {
  frame: PARVIS,
  paving: PARVIS_PAVING,
  level: () => PARVIS_LEVEL,
  quaySpot: PARVIS_QUAY_SPOT,
  colors: PARVIS_COLORS,
  quay: {
    coping: false,
    bollards: [],
    lamp: [PARVIS_PAVING.quay.x1 - 0.4, PARVIS_PAVING.quay.z1 - 0.6],
    habitants: { z: 14.5, xs: [6, 34, 40] },
    boats: [],
  },
  ground: parvisGround,
};

/**
 * La caméra à l'arrivée au Parvis (fiche, § 5 : « vue du Parvis, le Belvédère et le pic ») : le cap (0 : le nord), vers
 * le nord-est (53°), le soleil dans le dos. Le pic à gauche, le Belvédère à droite du milieu, et dans le quart droit,
 * l'anse de nuages à l'est du Parvis (lot du Versant ; directeur artistique, point 8 : un quart de l'image au moins). Le
 * changer ici.
 */
export const PARVIS_VIEW = { yaw: (-53 * Math.PI) / 180 } as const;

/**
 * La vue d'arrivée au Parvis (retouche 1 du lot 1, directeur artistique et consultant d'Archipéo : à hauteur de Kéo,
 * l'herbe filait jusqu'à l'horizon, rien ne disait « au-dessus des nuages ») : la caméra monte de `height` et recule de
 * `back` fois, au même cap, pour voir par-dessus le replat la mer de nuages entre la terre et l'horizon, à droite, et les
 * Prairies posées dessus. Elle reprend la poursuite au premier pas.
 */
export const PARVIS_ARRIVAL: DetourView = { height: 12, back: 1.6 };

/** Le haut que le regard levé cadre au Parvis : le sommet du pic. */
export const PARVIS_LOOK = { x: PEAK_3E.at.x, y: PEAK_3E.base + PEAK_3E.height, z: PEAK_3E.at.z } as const;

/**
 * Le bout de la caméra qui suit Kéo au 3e : le pic se voit de toute la montagne, et des Prairies (le Parvis en est à
 * 200 unités, la Lutherie à près de 300) ; le zeppelin, au nord-est. Au-delà, rien.
 */
export const FOLLOW_FAR_3E = 600;

// ---------- Le zeppelin des Ferrailleurs ----------

/**
 * Le zeppelin (fiche, § 6 ; décision du 22 octobre 2026 ; proposition des Prairies, § 7, et correction 20 du directeur
 * artistique) : un rocher de granit à part dans les nuages, son mât de ferraille, et l'enveloppe amarrée par le nez au
 * haut du mât, posée à l'horizontale, la queue au nord-nord-ouest (`ZEPPELIN_3E.tail`, cap 330° environ) : vue du
 * Parvis, du Belvédère et des arches, elle se lit de profil, un long cigare à côtes, et non plus par le bout. Son ventre
 * au ras des nuages, son dos plus bas qu'au lot 1. L'enveloppe rigide graphite, ses côtes et ses rustines de prune, ses
 * quatre empennages ; dessous, la gondole, sa planche et sa barre de flanc, et ses deux hélices arrêtées. Les pièces de
 * bronze prises au Rafiot, rangées sur la planche, se dessinent à part (`zeppelinPiecesFacets`) : le Fanal les montre tant
 * qu'il n'est pas restauré, puis les range sur son râtelier (./ferrailleurs3e.ts). Immobile tout le niveau, sans mot.
 */
const ZEPPELIN = {
  rockTop: 2.6,
  mast: 4.2,
  radius: 3.6,
  nose: 3.2,
  tail: 7,
  fin: 2.8,
  sides: 8,
  /** Les côtes : leur place le long de l'enveloppe (en part de sa longueur), leur saillie, leur largeur. */
  ribs: [0.3, 0.48, 0.66] as const,
  rib: { out: 0.12, w: 0.4 },
  /** Les rustines : leur angle autour de l'axe (en degrés, au milieu d'une face), leur place, leur taille. */
  patches: [
    { a: 22.5, at: 0.4, l: 1.6, w: 1.3 },
    { a: 157.5, at: 0.56, l: 1.3, w: 1.1 },
    { a: 202.5, at: 0.36, l: 1.2, w: 1.0 },
  ] as const,
  /** La gondole sous l'enveloppe : de `from` à `to` (en part de la longueur), son rayon, son écart sous le ventre. */
  gondola: { from: 0.34, to: 0.6, r: 0.95, gap: 0.75 },
  /** Les deux hélices arrêtées, au bout de la gondole : leur écart de côté, la longueur d'une pale. */
  propeller: { side: 2.1, blade: 1.2 },
  /** La planche de flanc des pièces, côté sud-ouest (vers le Parvis et les Prairies) : son écart, sa hauteur sous l'axe de la gondole, l'échelle des pièces. */
  shelf: { out: 0.45, drop: 0.35, bar: 1.1, scale: 0.85 },
} as const;

/** La couleur des rustines : une prune un cran plus claire que les côtes, jamais vive. */
const PATCH_3E = 0x8a6681;

/** Le zeppelin sur son rocher : un décor du monde, jamais sur la Carte (fiche, § 5 bis ; `Departure.offMap`). */
export function zeppelinFacets(): Facets {
  const b = new FacetBuilder();
  const Z = ZEPPELIN;
  const { rock, rockRadius, tail } = ZEPPELIN_3E;
  // Le rocher : un bloc de granit à sept pans, son pied sous les nuages, son dessus d'ardoise.
  b.prism({ x: rock.x, y: -2, z: rock.z }, rockRadius, rockRadius * 0.8, Z.rockTop + 2, 7, COLORS_3E.granite, COLORS_3E.graniteSun);
  // Le mât : un fût et trois haubans de ferraille, sa tête de ferraille (le bronze n'est qu'aux pièces prises au Rafiot).
  const top = Z.rockTop + Z.mast;
  b.prism({ x: rock.x, y: Z.rockTop, z: rock.z }, 0.35, 0.22, Z.mast, 5, COLORS_3E.graphite);
  for (let k = 0; k < 3; k++) {
    const a = (2 * Math.PI * k) / 3 + 0.4;
    b.beam({ x: rock.x + Math.cos(a) * 3, y: Z.rockTop, z: rock.z + Math.sin(a) * 3 }, { x: rock.x, y: top - 1, z: rock.z }, 0.14, COLORS_3E.graphite);
  }
  b.prism({ x: rock.x, y: top, z: rock.z }, 0.5, 0.5, 0.6, 6, COLORS_3E.graphiteSun);
  // L'enveloppe, du nez (au mât) à la queue : trois pièces le long de son axe, couché à l'horizontale.
  const len = distance(rock, tail);
  const yaw = Math.atan2(tail.x - rock.x, tail.z - rock.z);
  const y = top + 0.3;
  drawPosed(b, { x: rock.x, y, z: rock.z, yaw, pitch: Math.PI / 2 }, (l) => {
    // Après la bascule, la hauteur d'une pièce suit l'axe de l'enveloppe, du nez vers la queue ; `z` descend.
    l.prism({ x: 0, y: 0.4, z: 0 }, 1, Z.radius, Z.nose, Z.sides, COLORS_3E.graphiteSun);
    l.prism({ x: 0, y: 0.4 + Z.nose, z: 0 }, Z.radius, Z.radius, len - Z.nose - Z.tail, Z.sides, COLORS_3E.graphite);
    l.prism({ x: 0, y: len - Z.tail + 0.4, z: 0 }, Z.radius, 0.9, Z.tail, Z.sides, COLORS_3E.graphiteSun, COLORS_3E.prune);
    // Les côtes : un anneau de prune qui dépasse à peine, en travers de l'enveloppe.
    for (const t of Z.ribs) l.prism({ x: 0, y: len * t, z: 0 }, Z.radius + Z.rib.out, Z.radius + Z.rib.out, Z.rib.w, Z.sides, COLORS_3E.prune);
    // Les rustines : une plaque mince posée sur une face, tournée avec elle autour de l'axe.
    const face = Z.radius * Math.cos(Math.PI / Z.sides);
    for (const p of Z.patches) {
      const a = (p.a * Math.PI) / 180;
      l.box({ x: Math.cos(a) * face, y: len * p.at, z: Math.sin(a) * face, yaw: -a }, [0.16, p.l, p.w], PATCH_3E);
    }
    // La gondole, couchée sous le ventre ; son nez, vers le mât.
    const G = Z.gondola;
    const gz = Z.radius + G.gap + G.r;
    l.prism({ x: 0, y: len * G.from, z: gz }, G.r, G.r, len * (G.to - G.from), 6, COLORS_3E.prune, COLORS_3E.graphite);
    l.prism({ x: 0, y: len * G.from - 0.7, z: gz }, 0.15, G.r, 0.7, 6, COLORS_3E.graphiteSun);
  });
  drawPosed(b, { x: rock.x, y, z: rock.z, yaw }, (l) => {
    // Les quatre empennages près de la queue.
    const fz = len - Z.tail + 1.4;
    l.box({ x: 0, y: Z.radius - 0.3, z: fz }, [0.3, Z.fin, Z.tail - 1], COLORS_3E.prune);
    l.box({ x: 0, y: -Z.radius - Z.fin + 0.3, z: fz }, [0.3, Z.fin, Z.tail - 1], COLORS_3E.prune);
    for (const s of [-1, 1]) l.box({ x: s * (Z.radius + Z.fin / 2 - 0.3), y: -0.15, z: fz }, [Z.fin, 0.3, Z.tail - 1], COLORS_3E.prune);
    // La gondole : ses deux suspentes, la bande des hublots de chaque côté, la rambarde de la plate-forme ; la planche de
    // flanc et sa barre, où se rangent les pièces prises au Rafiot.
    const G = Z.gondola;
    const gy = -(Z.radius + G.gap + G.r);
    const z0 = len * G.from,
      z1 = len * G.to;
    for (const z of [z0 + 1.2, z1 - 1.2]) l.beam({ x: 0, y: gy + G.r * 0.8, z }, { x: 0, y: -Z.radius + 0.2, z }, 0.16, COLORS_3E.graphite);
    for (const s of [-1, 1]) l.box({ x: s * G.r * 0.88, y: gy + 0.05, z: (z0 + z1) / 2 + 0.6 }, [0.1, 0.32, z1 - z0 - 2.4], COLORS_3E.graphiteSun);
    l.box({ x: 0, y: gy + G.r * 0.85, z: z0 + 0.7 }, [G.r * 1.6, 0.12, 1.2], COLORS_3E.graphite);
    const S = Z.shelf;
    const sx = G.r * 0.86 + S.out;
    l.box({ x: sx, y: gy - S.drop - 0.08, z: (z0 + z1) / 2 }, [0.8, 0.08, z1 - z0 - 1.2], COLORS_3E.graphite);
    l.box({ x: sx, y: gy - S.drop + S.bar, z: (z0 + z1) / 2 }, [0.1, 0.1, z1 - z0 - 1.2], COLORS_3E.graphite);
    // Les deux hélices arrêtées, au bout de la gondole, une pale en haut, une en bas ; leur moyeu.
    const P = Z.propeller;
    for (const s of [-1, 1]) {
      const hub = { x: s * P.side, y: gy, z: z1 - 0.3 };
      l.beam({ x: s * G.r * 0.7, y: gy, z: hub.z }, hub, 0.12, COLORS_3E.graphite);
      l.drum({ x: hub.x, y: hub.y, z: hub.z + 0.15, pitch: Math.PI / 2 }, 0.22, 0.3, 6, COLORS_3E.graphiteSun);
      l.box({ x: hub.x, y: hub.y - P.blade, z: hub.z + 0.32 }, [0.26, 2 * P.blade, 0.08], COLORS_3E.graphiteSun);
    }
  });
  return b.build();
}

/**
 * Les pièces de bronze prises au Rafiot (./ferrailleurs3e.ts), rangées sur la planche de flanc de la gondole, tournées
 * vers le sud-ouest : dans le repère du monde ; le Fanal les dessine tant qu'il n'est pas restauré (`restoration`).
 */
export function zeppelinPiecesFacets(): Facets {
  const b = new FacetBuilder();
  const Z = ZEPPELIN;
  const { rock, tail } = ZEPPELIN_3E;
  const len = distance(rock, tail);
  const yaw = Math.atan2(tail.x - rock.x, tail.z - rock.z);
  const y = Z.rockTop + Z.mast + 0.3;
  drawPosed(b, { x: rock.x, y, z: rock.z, yaw }, (l) => {
    const G = Z.gondola;
    const S = Z.shelf;
    const gy = -(Z.radius + G.gap + G.r);
    const z0 = len * G.from + 0.9,
      z1 = len * G.to - 0.9;
    const sx = G.r * 0.86 + S.out;
    PIECES_3E.forEach((id, k) => {
      const z = z0 + ((z1 - z0) * (k + 0.5)) / PIECES_3E.length;
      const bottom = HANGS_3E[id] ? gy - S.drop + S.bar - 0.05 - PIECE_HEIGHT_3E[id] * S.scale : gy - S.drop;
      drawPosed(l, { x: sx, y: bottom, z, yaw: Math.PI / 2 }, (k2) => piece3e(k2, id, 0, 0, 0, S.scale));
    });
  });
  return b.build();
}

/** Le décor du Parvis qui ne change pas, sur la Carte comme dans le monde : le pic. */
export const parvisDecorFacets = (): Facets => peakFacets();

// ---------- L'aéronef ----------

/** Les parties de l'aéronef (ses os) qui arrivent à chaque temps (world/nefModels.ts, `NEF_SISTERS[3]`), comme au 4e. */
const NEF_3E_TEMPS = { 1: ['coque', 'lanterne'], 2: ['cabine', 'rotor', 'mat'], 3: ['helices', 'derive'] } as const satisfies Readonly<Record<1 | 2 | 3, readonly string[]>>;

/** Le modèle de l'aéronef (`3-aeronef/final-1464.glb`), le même qu'au 4e : le milieu de sa coque, son échelle. */
const MODEL = { scale: 0.65, center: { x: 2.5, z: 6 } } as const;

/** La hauteur de la Nef sur son aire : ses patins sur la pierre. */
const LIFT = { ber: PARVIS_PAD.deck + 0.6 } as const;

/** Le poste : au milieu de l'aire, la proue vers le sud-ouest, vers le bord du Parvis et les nuages. */
const BERTH = (() => {
  const p = PARVIS.toWorld(PARVIS_PAD.center.x, PARVIS_PAD.center.z);
  return { x: p.x, z: p.z, yaw: (3 * Math.PI) / 4 };
})();

/** Rien : l'aire de la Nef est dessinée avec les chemins (./paths3e.ts), et le 3e n'a pas d'obstacle au départ. */
const NOTHING: Facets = new FacetBuilder().build();

/** Le départ du lot 1 : la Nef monte droit au-dessus de l'aire en tournant d'un quart de tour, puis file vers le haut. */
const NEF_3E_DEPARTURE = { seconds: 8, rise: 70, drift: 40, turn: Math.PI / 2, outOfView: 0.5, pointBeyond: 180 } as const;

/** Où est la Nef au départ, à la fraction `u` (0 à 1) du temps (rempli dans `out`, rien n'est créé). */
export function nef3eFlight(u: number, out: NefFlight): NefFlight {
  const t = Math.min(1, Math.max(0, u));
  const e = t * t * (3 - 2 * t);
  const D = NEF_3E_DEPARTURE;
  // Vers le sud-ouest, au-dessus des nuages, en montant.
  out.x = BERTH.x - Math.SQRT1_2 * D.drift * t * t;
  out.z = BERTH.z + Math.SQRT1_2 * D.drift * t * t;
  out.y = LIFT.ber + D.rise * e;
  out.yaw = BERTH.yaw + D.turn * e;
  out.shiftX = 0;
  out.shiftZ = 0;
  out.open = 0;
  return out;
}

/** Un toucher sur l'aéronef : sur son aire. */
function nef3eTouched(p: Vec2): boolean {
  return Math.hypot(p.x - BERTH.x, p.z - BERTH.z) <= PARVIS_PAD.radius;
}

/** L'aéronef du 3e (lot 1, en masses : au repos sur son aire, son départ simple, sans obstacle). */
export const NEF_3E: NefSite = {
  form: 3,
  temps: NEF_3E_TEMPS,
  model: MODEL,
  lift: LIFT,
  berth: BERTH,
  ber: () => NOTHING,
  obstacle: () => NOTHING,
  after: () => null,
  stays: () => null,
  obstacleTouched: () => false,
  touched: nef3eTouched,
  seconds: NEF_3E_DEPARTURE.seconds,
  outOfView: NEF_3E_DEPARTURE.outOfView,
  obstacleDone: 0,
  pointBeyond: NEF_3E_DEPARTURE.pointBeyond,
  flight: nef3eFlight,
};

// ---------- Les trois parures de l'aéronef ----------

/**
 * Les trois parures de l'aéronef au repos (fiche du 3e, § 5 ; proposition du Versant, § 2 ; directeur artistique,
 * corrections 7 à 9), dans le repère de la Nef (la proue vers −z, le pont vers y = 0 ; le modèle `3-aeronef` à l'échelle
 * du monde : son bastingage à 0,87 au-dessus de son origine, sa coque large de 1,45 de chaque côté de 2,5 à 5,5 unités
 * de la proue) : la figure de proue, une tête de baleine de bronze, lisse, sans yeux peints ; le pavois, une rangée de
 * plaques carrées d'émail cobalt, rigides et unies, debout le long du bastingage, de chaque côté ; les deux feux de
 * position, deux lanternes d'ocre identiques, fixes, une de chaque côté, près de la proue (jamais une rouge et une
 * verte). Elles se posent dans l'ordre, la troisième en dernier ; leurs plans et leur fiche se règlent dans GD-25.
 */
export const NEF_PARURES = ['proue', 'pavois', 'feux'] as const;
export type NefParure = (typeof NEF_PARURES)[number];

/** Les mesures des parures, dans le repère de la Nef. */
const PARURES_LOOK = {
  /** La tête de baleine : le bout de la proue, sa hauteur, sa longueur, son rayon. */
  head: { z: -2.35, y: 0.62, length: 0.95, radius: 0.36 },
  /** Le pavois : le bord du bastingage, le bas et le haut des plaques, de quelle part de la proue à quelle part de la poupe, combien de plaques. */
  pavois: { x: 1.47, y0: 0.5, y1: 1.02, z0: -1.05, z1: 1.45, plates: 5, gap: 0.05, thick: 0.05 },
  /** Les feux : leur écart à l'axe, leur hauteur, leur place le long de la coque. */
  feux: { x: 1.3, y: 1.0, z: -1.2 },
} as const;

/** L'ocre des lanternes, seule lumière (`#E0A84A`), et le fer de leur potence. */
const PARURE_COLORS = { bronze: COLORS_3E.bronze, bronzeSun: 0xb98c4c, cobalt: COLORS_3E.cobalt, cobaltEdge: 0x264f92, lantern: 0xe0a84a, iron: 0x6b7690 } as const;

/** Les parures posées, dans le repère de la Nef. */
function nefParuresLocal(posed: readonly NefParure[]): Facets {
  const b = new FacetBuilder();
  const L = PARURES_LOOK;
  if (posed.includes('proue')) {
    // La tête : un fuseau à huit pans couché le long de l'axe, arrondi aux deux bouts (le museau devant), lisse.
    const H = L.head;
    drawPosed(b, { x: 0, y: H.y, z: H.z, yaw: Math.PI, pitch: Math.PI / 2 }, (l) => {
      l.prism({ x: 0, y: 0, z: 0 }, H.radius * 0.8, H.radius, H.length * 0.45, 8, PARURE_COLORS.bronze, PARURE_COLORS.bronzeSun);
      l.prism({ x: 0, y: H.length * 0.45, z: 0 }, H.radius, H.radius * 0.55, H.length * 0.4, 8, PARURE_COLORS.bronze, PARURE_COLORS.bronzeSun);
      l.prism({ x: 0, y: H.length * 0.85, z: 0 }, H.radius * 0.55, 0, H.length * 0.15, 8, PARURE_COLORS.bronzeSun);
    });
  }
  if (posed.includes('pavois')) {
    const P = L.pavois;
    const w = (P.z1 - P.z0 - (P.plates - 1) * P.gap) / P.plates;
    for (const s of [-1, 1])
      for (let i = 0; i < P.plates; i++) {
        const z = P.z0 + i * (w + P.gap) + w / 2;
        b.box({ x: s * (P.x + P.thick / 2), y: P.y0, z }, [P.thick, P.y1 - P.y0, w], PARURE_COLORS.cobalt, PARURE_COLORS.cobaltEdge);
      }
  }
  if (posed.includes('feux')) {
    const F = L.feux;
    for (const s of [-1, 1]) {
      b.beam({ x: s * (F.x - 0.18), y: F.y - 0.1, z: F.z }, { x: s * F.x, y: F.y - 0.1, z: F.z }, 0.06, PARURE_COLORS.iron);
      b.box({ x: s * F.x, y: F.y - 0.12, z: F.z }, [0.2, 0.24, 0.2], PARURE_COLORS.lantern);
      b.prism({ x: s * F.x, y: F.y + 0.12, z: F.z, yaw: Math.PI / 4 }, 0.17, 0, 0.13, 4, PARURE_COLORS.bronze);
    }
  }
  return b.build();
}

/** Les parures posées de l'aéronef, sur son aire, dans le monde (au poste et à la hauteur de la Nef). */
export const nefParuresFacets = (posed: readonly NefParure[]): Facets => placeFacets(nefParuresLocal(posed), { x: BERTH.x, y: LIFT.ber, z: BERTH.z, yaw: BERTH.yaw });
