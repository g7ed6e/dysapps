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
import { type P3, quadOut, triOut } from './place4eKit';
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
  /** Le plus gros rayon de l'enveloppe, au premier tiers. */
  radius: 3.6,
  sides: 8,
  /**
   * Le profil du cigare (relecture des Prairies, (a) 1) : le rayon (en part du plus gros) à chaque place le long de
   * l'enveloppe (en part de sa longueur), du nez arrondi au plus gros diamètre vers le premier tiers, puis un effilement
   * continu jusqu'à la queue ; jamais un cylindre fermé par deux cônes.
   */
  profile: [
    [0, 0.12],
    [0.04, 0.5],
    [0.1, 0.76],
    [0.2, 0.93],
    [0.32, 1],
    [0.46, 0.97],
    [0.62, 0.84],
    [0.78, 0.62],
    [0.9, 0.38],
    [1, 0.1],
  ] as const,
  /** Les côtes : leur place le long de l'enveloppe (en part de sa longueur), leur saillie, leur largeur. */
  ribs: [0.3, 0.48, 0.66] as const,
  rib: { out: 0.12, w: 0.4 },
  /** Les rustines : leur angle autour de l'axe (en degrés, au milieu d'une face), leur place, leur taille. */
  patches: [
    { a: 22.5, at: 0.4, l: 1.6, w: 1.3 },
    { a: 157.5, at: 0.56, l: 1.3, w: 1.1 },
    { a: 202.5, at: 0.36, l: 1.2, w: 1.0 },
  ] as const,
  /** Les quatre empennages, en trapèze le long de l'effilement : de `from` à `to` (en part de la longueur), leur hauteur au pied et au bout. */
  fins: { from: 0.76, to: 0.97, root: 2.2, tip: 1.3 },
  /**
   * La gondole, une cabine courte collée sous le ventre (relecture des Prairies, (a) 1) : de `from` à `to` (en part de la
   * longueur), sa demi-hauteur (`r`), sa demi-largeur, son écart sous le ventre ; sa bande de hublots.
   */
  gondola: { from: 0.38, to: 0.54, r: 0.75, half: 0.95, gap: -0.2, windows: 5 },
  /** Les deux hélices arrêtées, à l'arrière de la cabine : leur écart de côté, la longueur d'une pale. */
  propeller: { side: 2.3, blade: 1.9, width: 0.6 },
  /** La planche de flanc des pièces, côté sud-ouest (vers le Parvis et les Prairies) : son écart, sa hauteur sous l'axe de la gondole, l'échelle des pièces. */
  shelf: { out: 0.45, drop: 0.35, bar: 1.1, scale: 0.85 },
} as const;

/** La couleur des rustines : une prune un cran plus claire que les côtes, jamais vive ; le verre des hublots. */
const PATCH_3E = 0x8a6681;
const PORTHOLE_3E = 0xa9bccc;

/** Le rayon de l'enveloppe à la part `t` de sa longueur. */
function zeppelinRadius(t: number): number {
  const P = ZEPPELIN.profile;
  for (let k = 0; k < P.length - 1; k++)
    if (t <= P[k + 1][0]) return ZEPPELIN.radius * (P[k][1] + ((P[k + 1][1] - P[k][1]) * (t - P[k][0])) / (P[k + 1][0] - P[k][0]));
  return ZEPPELIN.radius * P[P.length - 1][1];
}

/** Le milieu de la cabine sous l'axe de l'enveloppe (négatif : dessous), et sa place le long d'elle. */
function gondolaFrame(len: number): { gy: number; z0: number; z1: number } {
  const G = ZEPPELIN.gondola;
  const belly = Math.max(zeppelinRadius(G.from), zeppelinRadius(G.to)) * Math.cos(Math.PI / ZEPPELIN.sides);
  return { gy: -(belly + G.gap + G.r), z0: len * G.from, z1: len * G.to };
}

/** Le rocher : un granit large et irrégulier, à facettes, son pied sous les nuages, son liseré d'ardoise au ras d'eux. */
function zeppelinRock(b: FacetBuilder, rock: Vec2, r: number, top: number): void {
  b.prism({ x: rock.x, y: -2, z: rock.z, yaw: 0.3 }, r, r * 0.72, top + 2, 7, COLORS_3E.granite, COLORS_3E.graniteSun);
  b.prism({ x: rock.x + r * 0.7, y: -2, z: rock.z + r * 0.35, yaw: 1.1 }, r * 0.6, r * 0.3, top + 1.2, 5, COLORS_3E.graniteShade, COLORS_3E.granite);
  b.prism({ x: rock.x - r * 0.55, y: -2, z: rock.z - r * 0.6, yaw: 2.0 }, r * 0.5, r * 0.25, top + 0.9, 5, COLORS_3E.graniteShade, COLORS_3E.granite);
  b.annulus({ x: rock.x + 0.2, y: -0.15, z: rock.z }, r * 1.25, r * 1.25 + 0.6, 0.3, 9, COLORS_3E.slate, COLORS_3E.slateTop, false);
}

/** Le zeppelin sur son rocher : un décor du monde, jamais sur la Carte (fiche, § 5 bis ; `Departure.offMap`). */
export function zeppelinFacets(): Facets {
  const b = new FacetBuilder();
  const Z = ZEPPELIN;
  const { rock, rockRadius, tail } = ZEPPELIN_3E;
  zeppelinRock(b, rock, rockRadius, Z.rockTop);
  // Le mât : un fût et trois haubans de ferraille, sa tête de ferraille (le bronze n'est qu'aux pièces prises au Rafiot).
  const top = Z.rockTop + Z.mast;
  b.prism({ x: rock.x, y: Z.rockTop, z: rock.z }, 0.35, 0.22, Z.mast, 5, COLORS_3E.graphite);
  for (let k = 0; k < 3; k++) {
    const a = (2 * Math.PI * k) / 3 + 0.4;
    b.beam({ x: rock.x + Math.cos(a) * 3, y: Z.rockTop, z: rock.z + Math.sin(a) * 3 }, { x: rock.x, y: top - 1, z: rock.z }, 0.14, COLORS_3E.graphite);
  }
  b.prism({ x: rock.x, y: top, z: rock.z }, 0.5, 0.5, 0.6, 6, COLORS_3E.graphiteSun);
  // L'enveloppe, du nez (au mât) à la queue, en cigare : une pièce par pas du profil, couchée à l'horizontale.
  const len = distance(rock, tail);
  const yaw = Math.atan2(tail.x - rock.x, tail.z - rock.z);
  const y = top + 0.3;
  drawPosed(b, { x: rock.x, y, z: rock.z, yaw, pitch: Math.PI / 2 }, (l) => {
    // Après la bascule, la hauteur d'une pièce suit l'axe de l'enveloppe, du nez vers la queue ; `z` descend.
    // Une bande ouverte (sans fond ni couvercle, cachés dans l'enveloppe) entre deux anneaux le long de l'axe.
    const ring = (r: number, h: number): P3[] => Array.from({ length: Z.sides }, (_, k) => [r * Math.cos((2 * Math.PI * k) / Z.sides), h, r * Math.sin((2 * Math.PI * k) / Z.sides)]);
    const band = (h0: number, r0: number, h1: number, r1: number, color: number) => {
      const lo = ring(r0, h0),
        hi = ring(r1, h1);
      for (let k = 0; k < Z.sides; k++) l.quad(lo[(k + 1) % Z.sides], lo[k], hi[k], hi[(k + 1) % Z.sides], color);
    };
    const P = Z.profile;
    // Le nez arrondi, fermé contre le mât.
    const nose = ring(Z.radius * P[0][1], 0.4);
    for (let k = 0; k < Z.sides; k++) l.triangle([0, 0.4, 0], nose[k], nose[(k + 1) % Z.sides], COLORS_3E.graphiteSun);
    for (let k = 0; k < P.length - 1; k++) {
      const [t0, r0] = P[k],
        [t1, r1] = P[k + 1];
      band(0.4 + len * t0, Z.radius * r0, 0.4 + len * t1, Z.radius * r1, k === 0 ? COLORS_3E.graphiteSun : COLORS_3E.graphite);
    }
    // La queue, fermée en pointe.
    const end = ring(Z.radius * P[P.length - 1][1], 0.4 + len);
    for (let k = 0; k < Z.sides; k++) l.triangle([0, 0.4 + len, 0], end[(k + 1) % Z.sides], end[k], COLORS_3E.graphite);
    // Les côtes : un anneau de prune qui dépasse à peine, en travers de l'enveloppe.
    for (const t of Z.ribs) {
      const r = zeppelinRadius(t) + Z.rib.out;
      band(0.4 + len * t - Z.rib.w / 2, r, 0.4 + len * t + Z.rib.w / 2, r, COLORS_3E.prune);
    }
    // Les rustines : une plaque mince posée sur une face, tournée avec elle autour de l'axe.
    for (const p of Z.patches) {
      const a = (p.a * Math.PI) / 180;
      const face = zeppelinRadius(p.at) * Math.cos(Math.PI / Z.sides);
      l.box({ x: Math.cos(a) * face, y: 0.4 + len * p.at, z: Math.sin(a) * face, yaw: -a }, [0.16, p.l, p.w], PATCH_3E);
    }
  });
  drawPosed(b, { x: rock.x, y, z: rock.z, yaw }, (l) => {
    // Les quatre empennages, en trapèze, couchés le long de l'effilement : leur pied sur l'enveloppe, plus bas vers la queue.
    const F = Z.fins;
    const za = 0.4 + len * F.from,
      zb = 0.4 + len * F.to;
    const ra = zeppelinRadius(F.from) - 0.15,
      rb = zeppelinRadius(F.to) - 0.15;
    for (const [dx, dy] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ] as const) {
      const at = (r: number, z: number): P3 => [dx * r, dy * r, z];
      const a = at(ra, za),
        bb = at(rb, zb),
        c = at(rb + F.tip, zb),
        d = at(ra + F.root, za + len * 0.06);
      l.quad(a, bb, c, d, COLORS_3E.prune);
      l.quad(a, d, c, bb, COLORS_3E.prune);
    }
    // La cabine, collée sous le ventre : son corps de prune, son toit de graphite, son nez arrondi vers le mât, la bande
    // des hublots de chaque côté ; deux suspentes courtes ; la planche de flanc et sa barre, où se rangent les pièces.
    const G = Z.gondola;
    const { gy, z0, z1 } = gondolaFrame(len);
    l.box({ x: 0, y: gy - G.r, z: (z0 + z1) / 2 }, [2 * G.half, 2 * G.r, z1 - z0], COLORS_3E.prune, COLORS_3E.graphite);
    drawPosed(l, { x: 0, y: gy, z: z0, yaw: 0, pitch: -Math.PI / 2 }, (k) => k.prism({ x: 0, y: 0, z: 0 }, G.r * 1.1, G.r * 0.45, 0.8, 6, COLORS_3E.prune, COLORS_3E.graphiteSun));
    for (const z of [z0 + 0.8, z1 - 0.8]) l.beam({ x: 0, y: gy + G.r - 0.05, z }, { x: 0, y: gy + G.r + G.gap + 0.3, z }, 0.14, COLORS_3E.graphite);
    for (const s of [-1, 1]) {
      const x = s * (G.half + 0.01);
      l.box({ x: x + s * 0.02, y: gy + 0.05, z: (z0 + z1) / 2 }, [0.04, 0.34, z1 - z0 - 0.6], COLORS_3E.graphiteSun);
      for (let k = 0; k < G.windows; k++) {
        const z = z0 + 0.6 + ((z1 - z0 - 1.2) * (k + 0.5)) / G.windows;
        const q = (dz: number, dy: number): P3 => [x + s * 0.05, gy + 0.22 + dy, z + dz];
        if (s > 0) l.quad(q(-0.14, -0.14), q(-0.14, 0.14), q(0.14, 0.14), q(0.14, -0.14), PORTHOLE_3E);
        else l.quad(q(-0.14, -0.14), q(0.14, -0.14), q(0.14, 0.14), q(-0.14, 0.14), PORTHOLE_3E);
      }
    }
    const S = Z.shelf;
    const sx = G.half + S.out;
    l.box({ x: sx, y: gy - S.drop - 0.08, z: (z0 + z1) / 2 }, [0.8, 0.08, z1 - z0 - 0.6], COLORS_3E.graphite);
    l.box({ x: sx, y: gy - S.drop + S.bar, z: (z0 + z1) / 2 }, [0.1, 0.1, z1 - z0 - 0.6], COLORS_3E.graphite);
    // Les deux hélices arrêtées, à l'arrière de la cabine, une pale en haut, une en bas, assez grandes pour se voir de profil ; leur moyeu.
    const P = Z.propeller;
    for (const s of [-1, 1]) {
      const hub = { x: s * P.side, y: gy, z: z1 + 0.2 };
      l.beam({ x: s * G.half, y: gy, z: z1 - 0.4 }, hub, 0.12, COLORS_3E.graphite);
      l.drum({ x: hub.x, y: hub.y, z: hub.z + 0.15, pitch: Math.PI / 2 }, 0.34, 0.3, 6, COLORS_3E.graphiteSun);
      // Deux pales larges en croix penchée, des deux faces, pour qu'au moins une se lise de profil comme de trois quarts.
      for (const roll of [0.35, 0.35 + Math.PI / 2]) {
        const [c, sn] = [Math.cos(roll), Math.sin(roll)];
        const at = (u: number, v: number): P3 => [hub.x + c * u - sn * v, hub.y + sn * u + c * v, hub.z + 0.32];
        const q = [at(-P.width / 2, -P.blade), at(P.width / 2, -P.blade), at(P.width / 2, P.blade), at(-P.width / 2, P.blade)] as const;
        l.quad(q[0], q[1], q[2], q[3], COLORS_3E.graphiteSun);
        l.quad(q[0], q[3], q[2], q[1], COLORS_3E.graphiteSun);
      }
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
    const S = Z.shelf;
    const g = gondolaFrame(len);
    const z0 = g.z0 + 0.5,
      z1 = g.z1 - 0.5;
    const sx = Z.gondola.half + S.out;
    PIECES_3E.forEach((id, k) => {
      const z = z0 + ((z1 - z0) * (k + 0.5)) / PIECES_3E.length;
      const bottom = HANGS_3E[id] ? g.gy - S.drop + S.bar - 0.05 - PIECE_HEIGHT_3E[id] * S.scale : g.gy - S.drop;
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
  /** La tête de baleine : son attache au haut de l'étrave (le dessous de la mâchoire), et sa pente (le museau relevé de 10°). */
  head: { z: -2.35, y: 0.32, tilt: Math.tan((10 * Math.PI) / 180) },
  /** Le pavois : le bord du bastingage, le bas et le haut des plaques, de quelle part de la proue à quelle part de la poupe, combien de plaques. */
  pavois: { x: 1.47, y0: 0.5, y1: 1.02, z0: -1.05, z1: 1.45, plates: 5, gap: 0.05, thick: 0.05 },
  /** Les feux : leur écart à l'axe, leur hauteur, leur place le long de la coque. */
  feux: { x: 1.3, y: 1.0, z: -1.2 },
} as const;

/**
 * La tête de baleine (règle des parures, § 6 ; décision du mainteneur du 23 octobre 2026), en tranches de l'attache au
 * museau : `d`, la distance devant l'étrave ; `w`, la demi-largeur ; `top`, le haut du crâne au-dessus du dessous de la
 * mâchoire. Plus large que haute (0,85 sur 0,6 environ), le crâne en dôme aplati, au plus haut au tiers arrière, qui
 * descend en pente douce vers un museau rond et franc, 0,9 devant l'étrave.
 */
const WHALE_HEAD = [
  { d: 0, w: 0.4, top: 0.54 },
  { d: 0.3, w: 0.425, top: 0.56 },
  { d: 0.55, w: 0.41, top: 0.49 },
  { d: 0.72, w: 0.36, top: 0.4 },
  { d: 0.84, w: 0.26, top: 0.3 },
  { d: 0.9, w: 0.13, top: 0.2 },
] as const;

/**
 * La mâchoire : une dalle plate dessous, épaisse de `thick`, aussi large que la tête à l'arrière, un peu resserrée
 * devant (`front`, en part de la largeur), qui finit au ras du museau (`to`). La ligne de bouche : un creux net entre le
 * crâne et la mâchoire, qui part du bout du museau, au ras de la mâchoire, et remonte doucement vers l'arrière jusqu'à
 * la place de l'œil (`eye`, à `rise` au-dessus de la mâchoire), sans œil ; épaisse de `line`.
 */
const WHALE_JAW = { thick: 0.12, front: 0.82, to: 0.84, eye: 0.3, rise: 0.12, line: 0.035 } as const;

/** Le bronze chaud de la tête, sans reflet : le corps, la face au soleil, la mâchoire et l'ombre (jamais de vert). */
const WHALE_BRONZE = { body: 0xb47e3e, sun: 0xcc9757, shade: 0x8a5b2c } as const;

/** La tête de baleine, dans le repère de la Nef : le crâne, la mâchoire et la ligne de bouche ; environ 120 triangles. */
function whaleHead(b: FacetBuilder): void {
  const H = PARURES_LOOK.head;
  const J = WHALE_JAW;
  const C = WHALE_BRONZE;
  /** Un point de la tête : `d` devant l'étrave, `x` de côté, `y` au-dessus du dessous de la mâchoire, relevé de 10°. */
  const at = (d: number, x: number, y: number): P3 => [x, H.y + y + d * H.tilt, H.z - d];
  /** Le dedans de la tête à la distance `d` (pour tourner chaque face vers le dehors). */
  const axis = (d: number, y: number): P3 => at(d, 0, y);
  const out = (p: P3, q: P3): P3 => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
  const mid = (...ps: P3[]): P3 => [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length, ps.reduce((s, p) => s + p[2], 0) / ps.length];
  // Le crâne : six points par tranche, du bas d'un flanc (au ras de la mâchoire) au bas de l'autre, par le dôme aplati.
  const ring = (k: number): P3[] => {
    const s = WHALE_HEAD[k];
    const lo = J.thick;
    const side = lo + (s.top - lo) * 0.55;
    return [at(s.d, -s.w, lo), at(s.d, -s.w * 0.96, side), at(s.d, -s.w * 0.55, s.top), at(s.d, s.w * 0.55, s.top), at(s.d, s.w * 0.96, side), at(s.d, s.w, lo)];
  };
  const rings = WHALE_HEAD.map((_, k) => ring(k));
  for (let k = 0; k < rings.length - 1; k++) {
    const r0 = rings[k],
      r1 = rings[k + 1];
    const centre = axis((WHALE_HEAD[k].d + WHALE_HEAD[k + 1].d) / 2, J.thick + 0.12);
    // Le dessus du dôme au soleil, les flancs dans le bronze du corps.
    for (let j = 0; j < r0.length - 1; j++) quadOut(b, r0[j], r0[j + 1], r1[j + 1], r1[j], out(mid(r0[j], r1[j + 1]), centre), j === 2 ? C.sun : C.body);
  }
  // Le museau rond : la dernière tranche se ferme sur un point, devant, au milieu de sa hauteur.
  const last = rings[rings.length - 1];
  const tipD = WHALE_HEAD[WHALE_HEAD.length - 1].d + 0.05;
  const tip = at(tipD, 0, (J.thick + WHALE_HEAD[WHALE_HEAD.length - 1].top) / 2);
  for (let j = 0; j < last.length - 1; j++) triOut(b, last[j], last[j + 1], tip, out(mid(last[j], last[j + 1]), axis(tipD - 0.1, J.thick + 0.05)), j === 2 ? C.sun : C.body);
  triOut(b, last[last.length - 1], last[0], tip, [0, -1, -0.3], C.shade);
  // Le dos de la tête, contre l'étrave : fermé, sans jour.
  const first = rings[0];
  for (let j = 1; j < first.length - 1; j++) triOut(b, first[0], first[j], first[j + 1], [0, 0, 1], C.body);
  // La mâchoire : une dalle à quatre faces vues (le dessous plat, les deux flancs, le bout), de l'attache au museau.
  const jaw = (d: number): number => {
    const u = d / J.to;
    const w = WHALE_HEAD.findIndex((s) => s.d >= d);
    const s0 = WHALE_HEAD[Math.max(0, w - 1)],
      s1 = WHALE_HEAD[Math.max(0, w)];
    const head = s1.d === s0.d ? s1.w : s0.w + ((s1.w - s0.w) * (d - s0.d)) / (s1.d - s0.d);
    return Math.min(head, WHALE_HEAD[0].w * (1 - (1 - J.front) * u));
  };
  const steps = [0, 0.3, 0.55, 0.72, J.to];
  for (let k = 0; k < steps.length - 1; k++) {
    const d0 = steps[k],
      d1 = steps[k + 1];
    const w0 = jaw(d0) - 0.01,
      w1 = jaw(d1) - 0.01;
    quadOut(b, at(d0, -w0, 0), at(d0, w0, 0), at(d1, w1, 0), at(d1, -w1, 0), [0, -1, 0], C.shade);
    for (const sx of [-1, 1]) quadOut(b, at(d0, sx * w0, 0), at(d1, sx * w1, 0), at(d1, sx * w1, J.thick), at(d0, sx * w0, J.thick), [sx, 0, 0], C.shade);
  }
  const wf = jaw(J.to) - 0.01;
  quadOut(b, at(J.to, -wf, 0), at(J.to, wf, 0), at(J.to, wf, J.thick), at(J.to, -wf, J.thick), [0, 0, -1], C.shade);
  // La ligne de bouche, de chaque côté : une bande sombre posée sur le flanc du crâne, du museau jusqu'à l'œil.
  const line = [J.to, 0.72, 0.55, J.eye] as const;
  for (const sx of [-1, 1])
    for (let k = 0; k < line.length - 1; k++) {
      const d0 = line[k],
        d1 = line[k + 1];
      const y = (d: number) => J.thick + (J.rise * (J.to - d)) / (J.to - J.eye);
      const w = (d: number) => {
        const i = WHALE_HEAD.findIndex((s) => s.d >= d);
        const s0 = WHALE_HEAD[Math.max(0, i - 1)],
          s1 = WHALE_HEAD[i];
        return (s0.w + ((s1.w - s0.w) * (d - s0.d)) / (s1.d - s0.d || 1)) * 0.99 + 0.012;
      };
      quadOut(b, at(d0, sx * w(d0), y(d0) - J.line / 2), at(d1, sx * w(d1), y(d1) - J.line / 2), at(d1, sx * w(d1), y(d1) + J.line / 2), at(d0, sx * w(d0), y(d0) + J.line / 2), [sx, 0, 0], C.shade);
    }
}

/** L'ocre des lanternes, seule lumière (`#E0A84A`), et le fer de leur potence. */
const PARURE_COLORS = { bronze: COLORS_3E.bronze, cobalt: COLORS_3E.cobalt, cobaltEdge: 0x264f92, lantern: 0xe0a84a, iron: 0x6b7690 } as const;

/** Les parures posées, dans le repère de la Nef (la vue les pose sur l'aéronef, et fait descendre celle qui arrive). */
export function nefParuresLocal(posed: readonly NefParure[]): Facets {
  const b = new FacetBuilder();
  const L = PARURES_LOOK;
  if (posed.includes('proue')) whaleHead(b);
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
