// La Crique, le lieu de départ du 4e, et son aéronef (lot 1 du monde ouvert du 4e, en grandes masses ; le lieu entier
// vient avec son lot, le lot 4 de la fiche) : l'Escale du 6e servie dans les matières chaudes du 4e (./port.ts dessine
// les mêmes bâtiments, à la même place de leur repère) : la pierre grise des Passeurs, des murs de terre cuite claire, le
// bois brun, les ferrures de cuivre. Au bout du quai, la passerelle de l'aire et l'aire ronde de l'aéronef (./paths4e.ts les dessine).
// Ce qui ne change jamais autour d'elle : le volcan vu de loin, sa lave figée et son panache (./terrain4e.ts), et le
// Rafiot des Ferrailleurs au bout de son quai abandonné. L'aéronef se pose sur l'aire en trois temps (la coque et sa
// lanterne, la cabine et le rotor, les hélices et la dérive : world/nefModels.ts, `NEF_SISTERS[3]`) ; au lot 1, son
// départ monte droit vers le ciel, sans obstacle (l'obstacle et le voyage viennent avec le lot de la Crique). Code pur.
import { FacetBuilder, mergeFacets, placeFacets, type Facets } from './facets';
import type { Vec2 } from './geometry';
import type { NefFlight, NefSite } from './nef';
import { COLORS_4E, CRIQUE, CRIQUE_LEVEL, CRIQUE_PAD, CRIQUE_PAVING, CRIQUE_QUAY_SPOT, RAFIOT_4E, VOLCANO_4E } from './plan4e';
import type { PortSite } from './port';
import { heightAt4e, lavaFacets, plumeFacets, volcanoFarFacets } from './terrain4e';

/**
 * Le dallage de la Crique (retouche 1 du lot 1, référent dys : la pierre grise ne se détachait de la terre rouge que par
 * sa teinte, rapport 1,04) : une pierre claire, qui s'en détache par sa clarté (au moins 3 contre 1 à l'écran) ; ses
 * flancs dans la pierre grise des Passeurs, plus sombres, le bordent.
 */
const CRIQUE_PAVING_COLOR = 0xf8f2ea;

/**
 * Les matières de la Crique : le dallage clair, la pierre grise, les murs de terre cuite claire, le bois brun, le
 * cuivre des ferrures. Les ardoises gardent celles de l'Escale, repères d'un niveau à l'autre.
 */
const CRIQUE_COLORS = {
  stone: CRIQUE_PAVING_COLOR,
  stoneSide: COLORS_4E.stoneShade,
  coping: COLORS_4E.stoneSun,
  plinth: COLORS_4E.stoneShade,
  white: 0xe2c4a8,
  wall: 0xcfa486,
  frame: COLORS_4E.stoneSun,
  slate: 0x5b7c99,
  paleSlate: 0x8aa3b8,
  shingle: COLORS_4E.terracotta,
  wood: COLORS_4E.wood,
  darkWood: COLORS_4E.woodShade,
  newWood: 0xc29a74,
  door: 0x7e5a44,
  inside: 0x9c8a70,
  socle: COLORS_4E.stoneSun,
  bollard: COLORS_4E.rust,
  lamp: 0xffd36b,
  habitant: [0x8c9f7a, 0xb5866a, 0x7f93a8],
  skin: 0xd9b38c,
} as const;

/** La Crique : son repère, son pavage, sa pierre plate, son quai (la lanterne, la ligne des habitants, une barque). */
export const CRIQUE_SITE: PortSite = {
  frame: CRIQUE,
  paving: CRIQUE_PAVING,
  level: () => CRIQUE_LEVEL,
  quaySpot: CRIQUE_QUAY_SPOT,
  colors: CRIQUE_COLORS,
  quay: {
    coping: true,
    bollards: [],
    lamp: [CRIQUE_PAVING.quay.x1 - 0.4, CRIQUE_PAVING.quay.z1 - 0.6],
    habitants: { z: 14.5, xs: [6, 16, 30] },
    boats: [[CRIQUE_PAVING.quay.x1 + 2.4, 22]],
  },
};

/**
 * La caméra à l'arrivée au quai de la Crique (fiche, § 5 : « vue du quai, la Forge et le volcan ») : le cap (0 : le
 * nord), vers le nord-ouest, la rangée à droite. Le changer ici.
 */
export const CRIQUE_VIEW = { yaw: 0.7 } as const;

/**
 * Le haut que le regard levé cadre au quai de la Crique (retouche 1 du lot 1 : fiche, § 1 et § 5, « vue du quai, la
 * Forge et le volcan ») : le rebord du cratère, un peu au-dessus (`above`, le pied du panache). La caméra qui suit Kéo
 * plonge trop pour qu'on voie le cône à plus de 300 unités ; levée, elle garde Kéo au-dessus de « Y aller », le
 * fourneau au milieu de l'image, le cône au fond, à gauche du milieu.
 */
export const CRIQUE_LOOK = (() => {
  const { crater, craterRadius } = VOLCANO_4E;
  const above = 4;
  return { x: crater.x, y: heightAt4e({ x: crater.x + craterRadius, z: crater.z }) + above, z: crater.z };
})();

/**
 * Le bout de la caméra qui suit Kéo au 4e (expert frontend, retouche 1 du lot 1 : explicite, plus celui du 5e pris sans
 * le dire) : le volcan se voit de toute l'île, son côté le plus loin de la Crique à un peu plus de 410 unités ; son
 * panache au-dessus. Au-delà, rien.
 */
export const FOLLOW_FAR_4E = 600;

/** Les couleurs du Rafiot : sa coque de fer rouillé, sa cabine de bois, sa cheminée et sa fumée courte. */
const RAFIOT_COLORS = { hull: COLORS_4E.rustShade, deck: COLORS_4E.wood, cabin: 0xa08a74, funnel: 0x8e6a5a } as const;

/**
 * Le Rafiot des Ferrailleurs (fiche, § 6), en masse : un remorqueur sans voile ni mât, sa coque, sa cabine, sa cheminée,
 * une fumée courte (deux boules, distinctes du panache du volcan par leur taille et leur place) ; et le quai abandonné,
 * de planches, où il est amarré. Les pièces de bronze boulonnées viennent avec les lieux.
 */
function rafiotFacets(): Facets {
  const b = new FacetBuilder();
  const C = RAFIOT_COLORS;
  b.box({ x: 0, y: -0.6, z: 0 }, [3.2, 1.5, 8], C.hull, C.deck);
  b.prism({ x: 0, y: -0.6, z: -4, yaw: Math.PI / 4 }, 2.26, 0.6, 1.5, 4, C.hull, C.deck);
  b.box({ x: 0, y: 0.9, z: 1 }, [2.2, 1.6, 3], C.cabin, COLORS_4E.terracotta);
  b.prism({ x: 0, y: 2.5, z: 1.4 }, 0.45, 0.4, 1.6, 8, C.funnel);
  b.prism({ x: 0.3, y: 4.3, z: 1.8 }, 0.7, 0.5, 0.8, 7, COLORS_4E.smokeShade, COLORS_4E.smoke);
  b.prism({ x: 0.7, y: 5, z: 2.4 }, 0.55, 0.35, 0.6, 7, COLORS_4E.smoke, COLORS_4E.smoke);
  const boat = placeFacets(b.build(), { x: RAFIOT_4E.at.x, y: 0, z: RAFIOT_4E.at.z, yaw: RAFIOT_4E.yaw });
  // Le quai abandonné : un tablier de planches, quelques pieux.
  const q = new FacetBuilder();
  const [from, to] = RAFIOT_4E.quay;
  const len = Math.hypot(to.x - from.x, to.z - from.z);
  const yaw = Math.atan2(to.x - from.x, to.z - from.z);
  const mid = { x: (from.x + to.x) / 2, z: (from.z + to.z) / 2 };
  q.box({ x: mid.x, y: 0.75, z: mid.z, yaw }, [2.2, 0.22, len], COLORS_4E.woodShade, COLORS_4E.wood);
  for (let d = 1; d < len; d += 4) {
    const p = { x: from.x + ((to.x - from.x) * d) / len, z: from.z + ((to.z - from.z) * d) / len };
    for (const s of [-1, 1]) q.prism({ x: p.x + Math.cos(yaw) * s * 0.9, y: -2, z: p.z - Math.sin(yaw) * s * 0.9 }, 0.2, 0.18, 2.8, 5, COLORS_4E.woodShade);
  }
  return mergeFacets([boat, q.build()]);
}

/** Le décor de la Crique qui ne change pas : le volcan vu de loin, sa lave figée et son panache ; le Rafiot. */
export const criqueDecorFacets = (): Facets => mergeFacets([volcanoFarFacets(), lavaFacets(), plumeFacets(), rafiotFacets()]);

// ---------- L'aéronef ----------

/** Les triangles de l'aéronef entier (le fichier `3-aeronef/final-1464.glb`, toutes ses parties). */
export const NEF_4E_MODEL_TRIANGLES = 1464;

/** Les parties de l'aéronef (ses os) qui arrivent à chaque temps (world/nefModels.ts, `NEF_SISTERS[3]`). */
const NEF_4E_TEMPS = { 1: ['coque', 'lanterne'], 2: ['cabine', 'rotor', 'mat'], 3: ['helices', 'derive'] } as const satisfies Readonly<Record<1 | 2 | 3, readonly string[]>>;

/**
 * Le modèle de l'aéronef (`3-aeronef/final-1464.glb`) : à l'échelle du voilier et du dirigeable, le milieu de sa coque
 * (x de −1,6 à 6,6, z de 2,0 à 10,1 ; la proue vers −z ; le bas de la coque à y −0,9).
 */
const MODEL = { scale: 0.65, center: { x: 2.5, z: 6 } } as const;

/** La hauteur de la Nef sur son aire : ses patins sur les planches. */
const LIFT = { ber: CRIQUE_PAD.deck + 0.6 } as const;

/** Le poste : au milieu de l'aire, la proue vers le large (le `z` du repère de la Crique). */
const BERTH = (() => {
  const p = CRIQUE.toWorld(CRIQUE_PAD.pad.x, CRIQUE_PAD.pad.z);
  return { x: p.x, z: p.z, yaw: Math.atan2(Math.sin(CRIQUE.yaw + Math.PI), Math.cos(CRIQUE.yaw + Math.PI)) };
})();

/** Rien : l'aire de la Nef est dessinée avec les chemins (./paths4e.ts), et l'obstacle vient avec le lot de la Crique. */
const NOTHING: Facets = new FacetBuilder().build();

/** Le départ du lot 1 : la Nef monte droit au-dessus de l'aire en tournant d'un quart de tour, puis file vers le haut. */
const NEF_4E_DEPARTURE = { seconds: 8, rise: 70, drift: 40, turn: Math.PI / 2, outOfView: 0.5, pointBeyond: 180 } as const;

/** Où est la Nef au départ, à la fraction `u` (0 à 1) du temps (rempli dans `out`, rien n'est créé). */
export function nef4eFlight(u: number, out: NefFlight): NefFlight {
  const t = Math.min(1, Math.max(0, u));
  const e = t * t * (3 - 2 * t);
  const D = NEF_4E_DEPARTURE;
  // Vers le large (le `z` du repère de la Crique), en montant.
  out.x = BERTH.x + Math.sin(CRIQUE.yaw) * D.drift * t * t;
  out.z = BERTH.z + Math.cos(CRIQUE.yaw) * D.drift * t * t;
  out.y = LIFT.ber + D.rise * e;
  out.yaw = BERTH.yaw + D.turn * e;
  out.shiftX = 0;
  out.shiftZ = 0;
  out.open = 0;
  return out;
}

/** Un toucher sur l'aéronef : sur son aire. */
function nef4eTouched(p: Vec2): boolean {
  return Math.hypot(p.x - BERTH.x, p.z - BERTH.z) <= CRIQUE_PAD.radius;
}

/** L'aéronef du 4e (lot 1, en masses : son départ simple, sans obstacle). */
export const NEF_4E: NefSite = {
  form: 3,
  temps: NEF_4E_TEMPS,
  model: MODEL,
  lift: LIFT,
  berth: BERTH,
  ber: () => NOTHING,
  obstacle: () => NOTHING,
  after: () => null,
  stays: () => null,
  obstacleTouched: () => false,
  touched: nef4eTouched,
  seconds: NEF_4E_DEPARTURE.seconds,
  outOfView: NEF_4E_DEPARTURE.outOfView,
  obstacleDone: 0,
  pointBeyond: NEF_4E_DEPARTURE.pointBeyond,
  flight: nef4eFlight,
};
