// La Nef du monde continu (GD-20, point 5 ; GD-21, piste « La Nef en trois temps », choix du mainteneur du 18 octobre
// 2026) : au bout ouest du quai de l'Escale, sur un ber de bois, la proue vers la passe de l'ouest ; le banc de brume au
// large, au-delà de la passe, que la Nef lève en partant ; après le départ, le ber vide et une bouée. Le chantier se
// montre en trois temps, comme les parties d'un lieu, sans cubes ni fantômes : la coque et sa lanterne, puis le mât, la
// vergue, la bôme et la cabine, puis la voile. Les cases, leur nombre et ce qui manque restent dans la fiche. Le modèle
// du voilier (les parties d'un os chacune) vient de la vue, qui le charge ; ici, sa place, ce qui s'en montre, le banc,
// le départ et ce qu'on touche. Code pur.
import { FacetBuilder, mergeFacets, placeFacets, type Facets } from './facets';
import type { Vec2 } from './geometry';
import { PORT, PORT_PAVING } from './plan6e';

/**
 * Où en est la Nef : 0, le ber vide (rien de posé, ou pas encore la coque) ; 1, la coque ; 2, la coque, le mât et la
 * cabine (toutes les cases posées) ; 3, la voile hissée (prête à partir) ; 4, partie (le ber vide, la bouée, le banc levé).
 */
export type NefLook = 0 | 1 | 2 | 3 | 4;

/** Ce que la vue lit de la sauvegarde pour la Nef : les cases du bas posées, toutes posées, la voile arrivée, le voyage fait. */
export interface NefProgress {
  hull: boolean;
  all: boolean;
  sail: boolean;
  departed: boolean;
}

/** Le temps de la Nef pour une sauvegarde. La voile ne se hisse que sur une Nef dont toutes les cases sont posées. */
export function nefLook(p: NefProgress): NefLook {
  if (p.departed) return 4;
  if (!p.hull) return 0;
  if (!p.all) return 1;
  return p.sail ? 3 : 2;
}

/** Les parties du modèle (ses os) qui arrivent à chaque temps. */
export const NEF_TEMPS_PARTS: Readonly<Record<1 | 2 | 3, readonly string[]>> = {
  1: ['coque', 'lanterne'],
  2: ['mat', 'vergue', 'bome', 'cabine'],
  3: ['voile'],
};

/** Les parties de chaque temps d'une forme. */
type NefTemps = Readonly<Record<1 | 2 | 3, readonly string[]>>;

/** Les parties montrées à un temps : toutes celles des temps faits ; aucune au ber vide ni après le départ. */
export function nefShownParts(look: NefLook, temps: NefTemps = NEF_TEMPS_PARTS): string[] {
  if (look === 0 || look === 4) return [];
  return ([1, 2, 3] as const).filter((t) => t <= look).flatMap((t) => temps[t]);
}

/** Les parties qui viennent d'arriver en passant d'un temps à l'autre (rien si l'on recule ou que la Nef part). */
export function nefArrivingParts(from: NefLook, to: NefLook, temps: NefTemps = NEF_TEMPS_PARTS): string[] {
  if (to === 4 || to <= from) return [];
  return ([1, 2, 3] as const).filter((t) => t > from && t <= to).flatMap((t) => temps[t]);
}

/**
 * Le modèle du voilier : sa taille (une case du modèle vaut `scale` unités du monde, la Nef un peu plus longue que la
 * moitié du quai, le mât plus haut que l'avatar : environ 4,6 et 5,3 unités), et le milieu de sa coque dans son repère
 * (le fichier : x de 0,9 à 4,1, z de −1,5 à 5,6, la proue vers −z ; le pont vers y 0).
 */
const NEF_MODEL: NefModelFrame = { scale: 0.65, center: { x: 2.5, z: 2.06 } };

/** Le modèle d'une forme dans le monde : une case du modèle vaut `scale` unités, et le milieu de sa coque. */
export interface NefModelFrame {
  scale: number;
  center: { x: number; z: number };
}

/**
 * Le poste de la Nef, dans le repère du Port (plan6e.ts, `PORT`) : à l'ouest du quai, dans l'eau, le long de son bord
 * (`PORT_PAVING.quay.x0`), la proue au nord, vers le lagon et la passe ; à gauche de l'image quand la caméra regarde au
 * nord, jamais entre elle et l'avatar au quai.
 */
const NEF_BERTH = { x: PORT_PAVING.quay.x0 - 1.6, z: -4.5 } as const;

/**
 * La hauteur de la Nef : sur son ber tant qu'elle est à quai (sa quille hors de l'eau), à flot dès qu'elle en glisse, au
 * début du départ (`slide`, la part du temps du départ).
 */
const NEF_LIFT = { ber: 0.85, afloat: 0.35, slide: 0.08 } as const;

/** Le poste de la Nef dans le monde, et son cap (celui du Port : la proue au nord). */
export function nefBerthWorld(): { x: number; z: number; yaw: number } {
  const p = PORT.toWorld(NEF_BERTH.x, NEF_BERTH.z);
  return { x: p.x, z: p.z, yaw: PORT.yaw };
}

/** Une partie du modèle, telle que la vue la charge : ses facettes dans le repère du fichier. */
export interface NefModelPart {
  name: string;
  positions: Float32Array;
  normals: Float32Array;
  /** Rouge, vert, bleu linéaires, par sommet (les couleurs de sommet du fichier). */
  colors: Float32Array;
}

/** Des parties du modèle, ramenées à l'échelle du monde, la coque centrée sur l'origine (le repère de la Nef). */
export function nefModelFacets(parts: readonly NefModelPart[], names: readonly string[], frame: NefModelFrame = NEF_MODEL): Facets {
  const list = parts.filter((p) => names.includes(p.name));
  const { scale: s, center: c } = frame;
  return mergeFacets(
    list.map((p) => {
      const positions = new Float32Array(p.positions.length);
      for (let k = 0; k < positions.length; k += 3) {
        positions[k] = (p.positions[k] - c.x) * s;
        positions[k + 1] = p.positions[k + 1] * s;
        positions[k + 2] = (p.positions[k + 2] - c.z) * s;
      }
      return { positions, normals: p.normals, colors: p.colors, triangles: positions.length / 9 };
    }),
  );
}

/** La Nef à son poste, sur son ber, dans le monde. */
export function nefAtBerth(model: Facets, site: NefSite = NEF_6E): Facets {
  const at = site.berth;
  return placeFacets(model, { x: at.x, y: site.lift.ber, z: at.z, yaw: at.yaw });
}

/** Le bois du ber et la bouée d'un niveau. */
export interface BerColors {
  ber: number;
  berDark: number;
  buoy: number;
  buoyTop: number;
}

const C = {
  ber: 0xa9784a,
  berDark: 0x8a6440,
  // La brume du large (consultant Archipéo, « Brume ») : claire, jamais blanche pure, sans socle d'une autre teinte.
  banc: 0xe5ebe3,
  // La bouée, à la couleur de la bande de la Nef.
  buoy: 0x2f6fa8,
  buoyTop: 0xf2eee4,
} as const;

/**
 * Le ber, dans le repère du Port, sous le poste : deux longrines dans l'eau et trois couples en V qui portent la coque ;
 * vide après le départ, avec la bouée amarrée au bout du quai.
 */
export function berLocal(b: FacetBuilder, at: Vec2, departed: boolean, colors: BerColors = C, buoySide = -1): void {
  const { x, z } = at;
  for (const dx of [-0.55, 0.55]) b.box({ x: x + dx, y: -1.2, z }, [0.22, 1.25, 4.2], colors.berDark, colors.ber);
  for (const dz of [-1.4, 0, 1.4]) {
    b.box({ x: x - 0.5, y: 0, z: z + dz }, [0.2, 0.75, 0.22], colors.ber);
    b.box({ x: x + 0.5, y: 0, z: z + dz }, [0.2, 0.75, 0.22], colors.ber);
    b.box({ x, y: 0.05, z: z + dz }, [1.3, 0.16, 0.24], colors.berDark, colors.ber);
  }
  if (!departed) return;
  // La bouée, au flanc du ber (`buoySide`, à l'ouest à l'Escale).
  buoyAt(b, x + BUOY_OFFSET * buoySide, z, colors);
}

/**
 * La bouée de la Nef partie : un gros flotteur rond sur l'eau, en (`x`, `z`), son dessus clair bien visible (le monde dit
 * que la Nef est partie, sans texte ; relecture du directeur artistique et du consultant Archipéo). Au 4e, à côté de
 * l'aire, sans ber (./crique4e.ts).
 */
export function buoyAt(b: FacetBuilder, x: number, z: number, colors: Pick<BerColors, 'buoy' | 'buoyTop'>): void {
  b.prism({ x, y: -0.25, z }, 0.66, 0.5, 0.7, 10, colors.buoy, colors.buoyTop);
  b.prism({ x, y: 0.45, z }, 0.12, 0.12, 0.9, 5, colors.buoy);
}

/**
 * Le vert île de la bande de la Nef (consultant d'Archipéo, retouche du lot 4 du 5e : la bouée et la bande accordées),
 * repris par la bouée et par la bande de la toile pliée, au 5e et au 4e.
 */
export const NEF_BAND = 0x438b82;

/** Le ber (et la bouée après le départ), posé dans le monde. */
export function berFacets(look: NefLook): Facets {
  const b = new FacetBuilder();
  berLocal(b, NEF_BERTH, look === 4);
  return placeFacets(b.build(), { x: PORT.origin.x, y: 0, z: PORT.origin.z, yaw: PORT.yaw });
}

/**
 * Le banc de brume du large (index.md, « L'obstacle » ; GD-21) : six gros volumes ronds et opaques, de tailles inégales,
 * qui se chevauchent et se décalent vers le large (relecture du directeur artistique), posés sur l'eau
 * au-delà de la passe de l'ouest (plan6e.ts, `PASS`, de x −179 à −96), en travers du chenal de la Nef, plus hauts que la
 * terre la plus haute, immobiles. De forme, de place et de hauteur, il n'a rien du voile bas des terres fermées.
 * Toujours dessiné hors de la brume du lointain (la vue le met dans le maillage du lieu suivi) : on le voit de l'Escale.
 */
export const NEF_BANC: readonly { x: number; z: number; r: number; h: number }[] = [
  { x: -205, z: -32, r: 13, h: 20 },
  { x: -215, z: -13, r: 19, h: 26 },
  { x: -204, z: 6, r: 12, h: 21 },
  { x: -213, z: 25, r: 17, h: 24 },
  { x: -205, z: 44, r: 12, h: 21 },
  { x: -224, z: 58, r: 15, h: 22 },
];

/** Le profil d'un volume du banc : du pied sur l'eau au sommet doux (rayon et hauteur relatifs). */
const DOME: readonly (readonly [number, number])[] = [
  [1, 0],
  [0.97, 0.28],
  [0.84, 0.56],
  [0.6, 0.8],
  [0.3, 0.95],
  [0, 1],
];

/** Les pans d'un volume du banc. */
const BANC_SIDES = 10;

/** Le banc, dans le monde, décalé de `shift` vers l'ouest (son retrait au départ de la Nef). */
export function bancFacets(shift = 0): Facets {
  const b = new FacetBuilder();
  NEF_BANC.forEach((v, i) => {
    // Chaque volume tourné autrement : leurs pans ne s'alignent pas d'un volume à l'autre. Ses anneaux seuls, sans les
    // disques cachés entre deux étages ; le pied un peu sous l'eau.
    const yaw = i * 0.7;
    const rings = DOME.map(([r, y], k) =>
      Array.from({ length: BANC_SIDES }, (_, j): [number, number, number] => {
        const a = yaw + (2 * Math.PI * j) / BANC_SIDES;
        return [v.x - shift + r * v.r * Math.cos(a), k === 0 ? -1 : y * v.h, v.z + r * v.r * Math.sin(a)];
      }),
    );
    for (let k = 0; k < rings.length - 1; k++) {
      const lo = rings[k];
      const hi = rings[k + 1];
      for (let j = 0; j < BANC_SIDES; j++) {
        const n = (j + 1) % BANC_SIDES;
        if (k === rings.length - 2) b.triangle(lo[n], lo[j], hi[j], C.banc);
        else b.quad(lo[n], lo[j], hi[j], hi[n], C.banc);
      }
    }
  });
  return b.build();
}

/** Le banc touché (un point au sol, sur l'eau ou sur un volume) : une zone large, jamais un détail à viser. */
export function bancTouched(p: Vec2): boolean {
  return NEF_BANC.some((v) => Math.hypot(p.x - v.x, p.z - v.z) <= v.r + 8);
}

/** L'écart entre le ber et sa bouée (`berLocal`), et la marge d'un toucher sur la bouée (une cible large). */
const BUOY_OFFSET = 2.1;
const BUOY_TOUCH = 1.4;

/**
 * La bouée touchée, en coordonnées locales du ber (`buoySide`, comme `berLocal`) : après le départ, elle ouvre la fiche
 * de la Nef et sa rangée « Revenir » (voyage entre niveaux, piste A).
 */
export function buoyTouched(l: Vec2, berth: Vec2, buoySide = -1): boolean {
  return Math.hypot(l.x - (berth.x + BUOY_OFFSET * buoySide), l.z - berth.z) <= BUOY_TOUCH;
}

/** La Nef touchée (un point du monde) : son poste, ber et bouée compris, avec une marge (une cible large). */
export function nefTouched(p: Vec2): boolean {
  const l = PORT.toLocal(p);
  return (Math.abs(l.x - NEF_BERTH.x) <= 2.2 && Math.abs(l.z - NEF_BERTH.z) <= 3.8) || buoyTouched(l, NEF_BERTH);
}

/**
 * Le départ (GD-21) : la Nef glisse de son poste vers la passe, puis au large, et le banc se retire vers l'horizon ; huit
 * secondes au plus (index.md, « Le passage »), qu'un toucher termine ; d'un coup avec « Réduire les animations ». La
 * caméra ne bouge pas : le départ finit `outOfView` secondes après que la Nef a quitté l'image, l'élève ne regarde
 * jamais un lagon vide (relecture du directeur artistique et de l'artiste technique 3D).
 */
export const NEF_DEPARTURE = { seconds: 8, bancFrom: 0.3, bancShift: 170, outOfView: 0.5 } as const;

/** Le chemin de la Nef au départ, dans le monde : son poste, le lagon, la passe, le large, au-delà du banc. */
const ROUTE: readonly Vec2[] = (() => {
  const at = nefBerthWorld();
  return [
    { x: at.x, z: at.z },
    { x: at.x - 3, z: at.z - 12 },
    { x: -40, z: 55 },
    { x: -95, z: 12 },
    { x: -175, z: 8 },
    { x: -260, z: 8 },
  ];
})();
const LEGS = ROUTE.slice(1).map((p, i) => Math.hypot(p.x - ROUTE[i].x, p.z - ROUTE[i].z));
const ROUTE_LENGTH = LEGS.reduce((s, l) => s + l, 0);

/**
 * Lente au départ, puis de plus en plus vite : la Nef quitte son ber et traverse le lagon sous les yeux de l'élève (la
 * caméra ne bouge pas), puis file vers la passe et le large (relecture du directeur artistique).
 */
const easeIn = (u: number) => u ** 2.2;

/**
 * Où est la Nef au départ, à la fraction `u` (0 à 1) du temps : sa place sur le chemin (à vitesse régulière en
 * longueur), son cap (la proue dans le sens de la marche), et le retrait du banc.
 */
export function nefDeparture(u: number): { x: number; y: number; z: number; yaw: number; bancShift: number } {
  const t = Math.min(1, Math.max(0, u));
  let d = easeIn(t) * ROUTE_LENGTH;
  let i = 0;
  while (i < LEGS.length - 1 && d > LEGS[i]) d -= LEGS[i++];
  const a = ROUTE[i];
  const b = ROUTE[i + 1];
  const f = LEGS[i] > 0 ? Math.min(1, d / LEGS[i]) : 1;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  // La proue du modèle regarde vers −z de son repère : un cap `yaw` la tourne vers (−sin, −cos).
  const yaw = t === 0 ? nefBerthWorld().yaw : Math.atan2(-dx, -dz);
  const banc = t <= NEF_DEPARTURE.bancFrom ? 0 : (t - NEF_DEPARTURE.bancFrom) / (1 - NEF_DEPARTURE.bancFrom);
  const y = NEF_LIFT.ber + (NEF_LIFT.afloat - NEF_LIFT.ber) * Math.min(1, t / NEF_LIFT.slide);
  return { x: a.x + dx * f, y, z: a.z + dz * f, yaw, bancShift: NEF_DEPARTURE.bancShift * banc * banc };
}

/** Ce que coûtent le ber et la bouée, et le banc (le modèle du voilier se compte à part : la vue le charge). */
export function nefSiteTriangles(): { ber: number; banc: number } {
  return { ber: berFacets(4).triangles, banc: bancFacets().triangles };
}

/** Les triangles du voilier entier (le fichier `1-voilier/final-1264.glb`, toutes ses parties). */
export const NEF_MODEL_TRIANGLES = 1264;

/** Où est la Nef pendant son départ, à un instant : sa place, son cap, et le retrait de son obstacle (dans le monde). */
export interface NefFlight {
  x: number;
  y: number;
  z: number;
  yaw: number;
  /** Le déplacement de l'obstacle, à plat. */
  shiftX: number;
  shiftZ: number;
  /** L'ouverture de la brèche : chaque sommet de l'obstacle glisse d'autant en `x`, dans son sens (`obstacleSides`). */
  open: number;
}

/**
 * La Nef d'un niveau (GD-21, puis GD-22, lot 4 : le dirigeable du 5e) : la forme de son modèle et ses trois temps, son
 * poste et son ber, son obstacle, ce qu'on touche, et son départ. La vue n'en connaît que cela.
 */
export interface NefSite {
  /** La forme du modèle (./nefModels.ts : 1, le voilier ; 2, le dirigeable). */
  form: number;
  temps: NefTemps;
  model: NefModelFrame;
  /** La hauteur de la coque sur son ber. */
  lift: { ber: number };
  berth: { x: number; z: number; yaw: number };
  /** Le ber, et ce qui l'accompagne à ce temps (la bouée après le départ ; au 5e, le gréement déposé). */
  ber(look: NefLook): Facets;
  /** L'obstacle (le banc du large, le mur de nuages), tel qu'il se tient avant le départ. */
  obstacle(): Facets;
  /** Ce qui reste de l'obstacle après le départ (au 5e, le mur écarté ; au 6e, rien). */
  after(): Facets | null;
  /**
   * L'obstacle, et ce qu'il en reste, jamais sur la Carte (au 4e, les îles du ciel : sans nom, elles s'y lisaient comme
   * des îles en mer, des lieux où aller ; retouche 1 de la Crique). Absent : sur la Carte aussi.
   */
  offMap?: boolean;
  /** Ce qui ne part jamais, avant, pendant et après le départ (au 5e, le panache du 4e ; au 6e, rien). */
  stays(): Facets | null;
  obstacleTouched(p: Vec2): boolean;
  touched(p: Vec2): boolean;
  /** Le départ : sa durée, le temps après la sortie de l'image où il finit, et la Nef à la fraction `u` (rempli dans `out`). */
  seconds: number;
  outOfView: number;
  /**
   * Le sens de glissement de chaque sommet de l'obstacle quand la brèche s'ouvre (−1, 0 ou 1 ; au 6e, aucun : le banc
   * glisse d'un bloc).
   */
  obstacleSides?(): Float32Array;
  /** La fraction du temps avant laquelle le départ ne finit pas (l'obstacle s'ouvre jusque-là ; au 6e, 0). */
  obstacleDone: number;
  /** Au-delà de cette distance à la caméra, la Nef n'est plus qu'un point : le départ finit comme si elle était sortie (au 6e, jamais). */
  pointBeyond: number;
  flight(u: number, out: NefFlight): NefFlight;
}

let banc: Facets | null = null;

/** La Nef du 6e : le voilier à l'Escale, le banc de brume du large. */
export const NEF_6E: NefSite = {
  form: 1,
  temps: NEF_TEMPS_PARTS,
  model: NEF_MODEL,
  lift: NEF_LIFT,
  berth: nefBerthWorld(),
  ber: berFacets,
  obstacle: () => (banc ??= bancFacets()),
  after: () => null,
  stays: () => null,
  obstacleTouched: bancTouched,
  touched: nefTouched,
  seconds: NEF_DEPARTURE.seconds,
  outOfView: NEF_DEPARTURE.outOfView,
  obstacleDone: 0,
  pointBeyond: Infinity,
  flight: (u, out) => {
    const d = nefDeparture(u);
    out.x = d.x;
    out.y = d.y;
    out.z = d.z;
    out.yaw = d.yaw;
    out.shiftX = -d.bancShift;
    out.shiftZ = 0;
    out.open = 0;
    return out;
  },
};
