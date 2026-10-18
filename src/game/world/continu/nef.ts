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

/** Les parties montrées à un temps : toutes celles des temps faits ; aucune au ber vide ni après le départ. */
export function nefShownParts(look: NefLook): string[] {
  if (look === 0 || look === 4) return [];
  return ([1, 2, 3] as const).filter((t) => t <= look).flatMap((t) => NEF_TEMPS_PARTS[t]);
}

/** Les parties qui viennent d'arriver en passant d'un temps à l'autre (rien si l'on recule ou que la Nef part). */
export function nefArrivingParts(from: NefLook, to: NefLook): string[] {
  if (to === 4 || to <= from) return [];
  return ([1, 2, 3] as const).filter((t) => t > from && t <= to).flatMap((t) => NEF_TEMPS_PARTS[t]);
}

/**
 * Le modèle du voilier : sa taille (une case du modèle vaut `scale` unités du monde, la Nef un peu plus longue que la
 * moitié du quai, le mât plus haut que l'avatar : environ 4,6 et 5,3 unités), et le milieu de sa coque dans son repère
 * (le fichier : x de 0,9 à 4,1, z de −1,5 à 5,6, la proue vers −z ; le pont vers y 0).
 */
const NEF_MODEL = { scale: 0.65, center: { x: 2.5, z: 2.06 } } as const;

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
export const NEF_LIFT = { ber: 0.85, afloat: 0.35, slide: 0.08 } as const;

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
export function nefModelFacets(parts: readonly NefModelPart[], names: readonly string[]): Facets {
  const list = parts.filter((p) => names.includes(p.name));
  const { scale: s, center: c } = NEF_MODEL;
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
export function nefAtBerth(model: Facets): Facets {
  const at = nefBerthWorld();
  return placeFacets(model, { x: at.x, y: NEF_LIFT.ber, z: at.z, yaw: at.yaw });
}

const C = {
  ber: 0xa9784a,
  berDark: 0x8a6440,
  // La brume du large (consultant Archipéo, « Brume ») : claire, jamais blanche pure ; ses flancs un peu plus froids.
  banc: 0xe5ebe3,
  bancSide: 0xcfd8d4,
  // La bouée, à la couleur de la bande de la Nef.
  buoy: 0x2f6fa8,
  buoyTop: 0xf2eee4,
} as const;

/**
 * Le ber, dans le repère du Port, sous le poste : deux longrines dans l'eau et trois couples en V qui portent la coque ;
 * vide après le départ, avec la bouée amarrée au bout du quai.
 */
function berLocal(b: FacetBuilder, departed: boolean): void {
  const { x, z } = NEF_BERTH;
  for (const dx of [-0.55, 0.55]) b.box({ x: x + dx, y: -1.2, z }, [0.22, 1.25, 4.2], C.berDark, C.ber);
  for (const dz of [-1.4, 0, 1.4]) {
    b.box({ x: x - 0.5, y: 0, z: z + dz }, [0.2, 0.75, 0.22], C.ber);
    b.box({ x: x + 0.5, y: 0, z: z + dz }, [0.2, 0.75, 0.22], C.ber);
    b.box({ x, y: 0.05, z: z + dz }, [1.3, 0.16, 0.24], C.berDark, C.ber);
  }
  if (!departed) return;
  // La bouée : un flotteur rond, son dessus clair, au nord du ber (le monde dit que la Nef est partie, sans texte).
  b.prism({ x, y: -0.15, z: z - 2.8 }, 0.42, 0.34, 0.5, 8, C.buoy, C.buoyTop);
  b.prism({ x, y: 0.35, z: z - 2.8 }, 0.08, 0.08, 0.7, 4, C.buoy);
}

/** Le ber (et la bouée après le départ), posé dans le monde. */
export function berFacets(look: NefLook): Facets {
  const b = new FacetBuilder();
  berLocal(b, look === 4);
  return placeFacets(b.build(), { x: PORT.origin.x, y: 0, z: PORT.origin.z, yaw: PORT.yaw });
}

/**
 * Le banc de brume du large (index.md, « L'obstacle » ; GD-21) : quatre gros volumes ronds et opaques, posés sur l'eau
 * au-delà de la passe de l'ouest (plan6e.ts, `PASS`, de x −179 à −96), en travers du chenal de la Nef, plus hauts que la
 * terre la plus haute, immobiles. De forme, de place et de hauteur, il n'a rien du voile bas des terres fermées.
 * Toujours dessiné hors de la brume du lointain (la vue le met dans le maillage du lieu suivi) : on le voit de l'Escale.
 */
export const NEF_BANC: readonly { x: number; z: number; r: number; h: number }[] = [
  { x: -212, z: -34, r: 15, h: 21 },
  { x: -206, z: -8, r: 17, h: 24 },
  { x: -209, z: 20, r: 16, h: 22 },
  { x: -215, z: 46, r: 14, h: 21 },
];

/** Le profil d'un volume du banc : du pied sur l'eau au sommet arrondi (rayon et hauteur relatifs). */
const DOME: readonly (readonly [number, number])[] = [
  [1, 0],
  [1, 0.3],
  [0.82, 0.62],
  [0.48, 0.88],
  [0, 1],
];

/** Le banc, dans le monde, décalé de `shift` vers l'ouest (son retrait au départ de la Nef). */
export function bancFacets(shift = 0): Facets {
  const b = new FacetBuilder();
  for (const v of NEF_BANC)
    for (let k = 0; k < DOME.length - 1; k++) {
      const [r0, y0] = DOME[k];
      const [r1, y1] = DOME[k + 1];
      b.prism({ x: v.x - shift, y: y0 * v.h - 1, z: v.z }, r0 * v.r, r1 * v.r, (y1 - y0) * v.h + (k === 0 ? 1 : 0), 7, k === 0 ? C.bancSide : C.banc);
    }
  return b.build();
}

/** Le banc touché (un point au sol, sur l'eau ou sur un volume) : une zone large, jamais un détail à viser. */
export function bancTouched(p: Vec2): boolean {
  return NEF_BANC.some((v) => Math.hypot(p.x - v.x, p.z - v.z) <= v.r + 8);
}

/** La Nef touchée (un point du monde) : son poste, ber compris, avec une marge (une cible large). */
export function nefTouched(p: Vec2): boolean {
  const l = PORT.toLocal(p);
  return Math.abs(l.x - NEF_BERTH.x) <= 2.2 && Math.abs(l.z - NEF_BERTH.z) <= 3.8;
}

/**
 * Le départ (GD-21) : la Nef glisse de son poste vers la passe, puis au large, et le banc se retire vers l'horizon ; six
 * secondes (huit au plus, index.md, « Le passage »), qu'un toucher termine ; d'un coup avec « Réduire les animations ».
 */
export const NEF_DEPARTURE = { seconds: 6, bancFrom: 0.3, bancShift: 170 } as const;

/** Le chemin de la Nef au départ, dans le monde : son poste, le lagon, la passe, le large, au-delà du banc. */
function departureRoute(): Vec2[] {
  const at = nefBerthWorld();
  return [
    { x: at.x, z: at.z },
    { x: at.x - 3, z: at.z - 12 },
    { x: -40, z: 55 },
    { x: -95, z: 12 },
    { x: -175, z: 8 },
    { x: -260, z: 8 },
  ];
}

/**
 * Lente au départ, puis de plus en plus vite : la Nef quitte son ber et traverse le lagon sous les yeux de l'élève (la
 * caméra ne bouge pas : la moitié du temps dans l'image), puis file vers la passe et le large.
 */
const easeIn = (u: number) => u ** 2.4;

/**
 * Où est la Nef au départ, à la fraction `u` (0 à 1) du temps : sa place sur le chemin (à vitesse régulière en
 * longueur), son cap (la proue dans le sens de la marche), et le retrait du banc.
 */
export function nefDeparture(u: number): { x: number; y: number; z: number; yaw: number; bancShift: number } {
  const t = Math.min(1, Math.max(0, u));
  const route = departureRoute();
  const lengths = route.slice(1).map((p, i) => Math.hypot(p.x - route[i].x, p.z - route[i].z));
  const total = lengths.reduce((s, l) => s + l, 0);
  let d = easeIn(t) * total;
  let i = 0;
  while (i < lengths.length - 1 && d > lengths[i]) d -= lengths[i++];
  const a = route[i];
  const b = route[i + 1];
  const f = lengths[i] > 0 ? Math.min(1, d / lengths[i]) : 1;
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
