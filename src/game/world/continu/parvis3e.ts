// Le Parvis, le lieu de départ du 3e, et l'aéronef au repos (lot 1 du monde ouvert du 3e, en grandes masses ; le lieu
// entier vient avec son lot, le lot 3 de la fiche) : l'Escale du 6e servie dans les matières froides du 3e (./port.ts
// dessine les mêmes bâtiments, à la même place de leur repère) : la pierre claire, posée au sol sans pilotis, le granit
// bleuté des Passeurs, les toits d'ardoise, le bois gris. Au milieu de la place, l'aire ronde de l'aéronef (./paths3e.ts
// la dessine). Ce qui ne change jamais autour de lui : le pic, vu de toute la montagne (./terrain3e.ts), et le zeppelin
// des Ferrailleurs, amarré par le nez à son mât sur un rocher à part, immobile, qui n'est pas sur la Carte. L'aéronef se pose sur l'aire en trois
// temps, comme au 4e (world/nefModels.ts, `NEF_SISTERS[3]`) ; au lot 1, son départ monte droit vers le ciel, sans
// obstacle (le 3e est le dernier niveau : ce départ ne mène nulle part). Code pur.
import type { DetourView } from './camera';
import { drawPosed, FacetBuilder, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import type { NefFlight, NefSite } from './nef';
import { COLORS_3E, PARVIS, PARVIS_LEVEL, PARVIS_PAD, PARVIS_PAVING, PARVIS_QUAY_SPOT, PEAK_3E, ZEPPELIN_3E } from './plan3e';
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
};

/**
 * La caméra à l'arrivée au Parvis (fiche, § 5 : « vue du Parvis, le Belvédère et le pic ») : le cap (0 : le nord), vers
 * le nord-est, le soleil dans le dos. Le changer ici.
 */
export const PARVIS_VIEW = { yaw: -0.9 } as const;

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
 * Le zeppelin (fiche, § 6 ; décision du 22 octobre 2026), en masses : un rocher de granit à part dans les nuages, son mât
 * de ferraille, et l'enveloppe amarrée par le nez au haut du mât, posée à l'horizontale vers le nord-est ; ses quatre
 * empennages, sa nacelle dessous. Le graphite et la prune des Ferrailleurs ; immobile tout le niveau.
 */
const ZEPPELIN = { rockTop: 2.6, mast: 9, radius: 4.2, nose: 3.5, tail: 6, fin: 3.2, sides: 8 } as const;

/** Le zeppelin sur son rocher : un décor du monde, jamais sur la Carte (fiche, § 5 bis ; `Departure.offMap`). */
export function zeppelinFacets(): Facets {
  const b = new FacetBuilder();
  const Z = ZEPPELIN;
  const { rock, rockRadius, tail } = ZEPPELIN_3E;
  // Le rocher : un bloc de granit à sept pans, son pied sous les nuages, son dessus d'ardoise.
  b.prism({ x: rock.x, y: -2, z: rock.z }, rockRadius, rockRadius * 0.8, Z.rockTop + 2, 7, COLORS_3E.granite, COLORS_3E.graniteSun);
  // Le mât : un fût et trois haubans de ferraille, une tête de bronze.
  const top = Z.rockTop + Z.mast;
  b.prism({ x: rock.x, y: Z.rockTop, z: rock.z }, 0.35, 0.22, Z.mast, 5, COLORS_3E.graphite);
  for (let k = 0; k < 3; k++) {
    const a = (2 * Math.PI * k) / 3 + 0.4;
    b.beam({ x: rock.x + Math.cos(a) * 3, y: Z.rockTop, z: rock.z + Math.sin(a) * 3 }, { x: rock.x, y: top - 2, z: rock.z }, 0.14, COLORS_3E.graphite);
  }
  b.prism({ x: rock.x, y: top, z: rock.z }, 0.5, 0.5, 0.6, 6, COLORS_3E.bronze);
  // L'enveloppe, du nez (au mât) à la queue : trois pièces le long de son axe, couché à l'horizontale.
  const len = distance(rock, tail);
  const yaw = Math.atan2(tail.x - rock.x, tail.z - rock.z);
  const y = top + 0.3;
  drawPosed(b, { x: rock.x, y, z: rock.z, yaw, pitch: Math.PI / 2 }, (l) => {
    // Après la bascule, la hauteur d'une pièce suit l'axe de l'enveloppe, du nez vers la queue.
    l.prism({ x: 0, y: 0.4, z: 0 }, 1, Z.radius, Z.nose, Z.sides, COLORS_3E.graphiteSun);
    l.prism({ x: 0, y: 0.4 + Z.nose, z: 0 }, Z.radius, Z.radius, len - Z.nose - Z.tail, Z.sides, COLORS_3E.graphite);
    l.prism({ x: 0, y: len - Z.tail + 0.4, z: 0 }, Z.radius, 0.9, Z.tail, Z.sides, COLORS_3E.graphiteSun, COLORS_3E.prune);
  });
  drawPosed(b, { x: rock.x, y, z: rock.z, yaw }, (l) => {
    // Les quatre empennages près de la queue, la nacelle sous le milieu, une bande de prune autour du ventre.
    const fz = len - Z.tail + 1.4;
    l.box({ x: 0, y: Z.radius - 0.3, z: fz }, [0.3, Z.fin, Z.tail - 1], COLORS_3E.prune);
    l.box({ x: 0, y: -Z.radius - Z.fin + 0.3, z: fz }, [0.3, Z.fin, Z.tail - 1], COLORS_3E.prune);
    for (const s of [-1, 1]) l.box({ x: s * (Z.radius + Z.fin / 2 - 0.3), y: -0.15, z: fz }, [Z.fin, 0.3, Z.tail - 1], COLORS_3E.prune);
    l.box({ x: 0, y: -Z.radius - 1.3, z: len * 0.45 }, [2, 1.4, 6], COLORS_3E.prune, COLORS_3E.graphite);
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
