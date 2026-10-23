/**
 * Le Détour de la Bergerie (les Alpages du 3e, GD-25, lot 3 ; proposition du consultant d'Archipéo, § 8, relecture des
 * lieux du directeur artistique, § 4, et planche `selection-alpages-v1`), sur le mécanisme des autres Détours
 * (./detours.ts, ./cadran3e.ts) : « une petite bergerie de pierre et ses moutons, sous le pic ». Kéo s'y arrête, la vue
 * se tourne vers l'est (80°), la bergerie à gauche, l'enclos au milieu, le pic au tiers droit, le soleil de côté ;
 * « La Bergerie » s'écrit une fois et se dit, et Kéo ajoute une phrase, écrite dessous. Une sente reste tracée pour de
 * bon après la première arrivée, depuis le chemin du Kiosque. Ni compteur, ni récompense, ni mission, ni étape.
 *
 * La place : `DETOUR_SPOTS_3E.bergerie`, au nord des Alpages, sous l'arête ouest, loin de la rive. Une bergerie basse de
 * pierres sèches au toit d'ardoise à deux pans, son pignon et sa porte de bois tournés vers Kéo ; contre elle, un enclos
 * de pierre sèche, bas, avec une seule entrée ; dedans, trois moutons couchés, immobiles (rien ne bouge, « Réduire les
 * animations » ou non) ; les trois pierres plates des Détours, de part et d'autre de la sente, jamais dessus. 205
 * triangles au plus, moutons compris. Le dessin reçoit son sol (`ground`). Code pur.
 */
import { SENTE_5E as SENTE } from './creux5e';
import type { Detour } from './detours';
import { FacetBuilder, type Facets } from './facets';
import { distance, distanceToPolyline, type Vec2, type Vec3 } from './geometry';
import { C3E } from './place3eKit';
import type { P3 } from './place4eKit';
import { DETOUR_SPOTS_3E, PATH_NODES_3E } from './plan3e';

/**
 * Le cap de l'arrivée : 80°, le pic au tiers droit du cadre et, presque au milieu, le Fanal. La relecture disait 65° ;
 * le pic, à 101° de la Bergerie, sortait alors du cadre de la tablette : la vue tourne de 15° vers lui.
 */
const CAP_DEG = 80;
const CAP = (CAP_DEG * Math.PI) / 180;
/** Devant Kéo, et à sa droite. */
const LOOK: Vec2 = { x: Math.sin(CAP), z: -Math.cos(CAP) };
const RIGHT: Vec2 = { x: Math.cos(CAP), z: Math.sin(CAP) };

/** La vue de la Bergerie à l’arrivée : la caméra plus bas que celle qui suit, le pic entier, sa pointe comprise, et le Fanal dans le cadre, les moutons au-dessus du muret (relecture des Alpages, (a) 7). */
const BERGERIE_VIEW = { height: -4, back: 1.3, turn: 0.1 } as const;

/**
 * Le budget de la Bergerie (proposition, § 8, porté de 175 à 205 pour le corps rond des moutons, relecture des Prairies,
 * (a) 11) : 205 triangles au plus sans la sente, moutons compris, dans le maillage des
 * lieux, sans appel de plus ; et sa sente, une fois tracée, au plus `sente` de plus (elle vient de loin, du Kiosque).
 */
export const BERGERIE_BUDGET = { triangles: 205, sente: 170 } as const;

/** Le milieu de l'enclos : la place réservée ; dans le repère de Kéo, devant lui et à sa gauche (`PEN`). */
const SPOT = DETOUR_SPOTS_3E.bergerie;

/**
 * L'enclos : contre le mur droit de la bergerie, de `s0` à `s1` en travers (à gauche de Kéo) et de `f0` à `f1` le long
 * de la vue ; son muret bas, son épaisseur ; une seule entrée, dans le muret tourné vers Kéo, de `gate.s0` à `gate.s1`
 * (0,85 : loin des rives, relecture du Versant, (b) 6). L'enclos s'écarte de Kéo vers la gauche, un pas d'herbe entre eux
 * (relecture des Prairies, (a) 11). Rien de la Bergerie dans l'axe de Kéo, qui le cacherait
 * (relecture du Versant, (b) 1) : la moitié droite du cadre reste au pré, au Fanal et au pic.
 */
const PEN = { s0: -8.0, s1: -3.2, f0: 3.8, f1: 8.2, h: 0.45, t: 0.38, gate: { s0: -5.9, s1: -5.05 } } as const;

/** Là où Kéo s'arrête : au sud-ouest de l'enclos, qu'il voit devant lui et à sa gauche, la bergerie au-delà. */
const AT: Vec2 = (() => {
  const f = (PEN.f0 + PEN.f1) / 2,
    s = (PEN.s0 + PEN.s1) / 2;
  return { x: SPOT.x - LOOK.x * f - RIGHT.x * s, z: SPOT.z - LOOK.z * f - RIGHT.z * s };
})();

/** Un point du repère de Kéo (`f` devant, `s` à droite), dans le monde. */
const local = (f: number, s: number): Vec2 => ({ x: AT.x + LOOK.x * f + RIGHT.x * s, z: AT.z + LOOK.z * f + RIGHT.z * s });

/**
 * La bergerie : son milieu (à gauche de l'enclos, contre lui), sa largeur (en travers de la vue), sa profondeur (le long
 * de la vue, celle de l'enclos), la hauteur des murs, du faîte, et le débord du toit ; sa porte, dans le pignon tourné
 * vers Kéo.
 */
const HUT = { f: (PEN.f0 + PEN.f1) / 2, s: PEN.s0 - 1.7, w: 3.4, d: PEN.f1 - PEN.f0, wall: 1.6, ridge: 1.25, eave: 0.32, door: { w: 0.8, h: 1.15 } } as const;

/** Les trois moutons couchés : leur place dans l'enclos, leur sens (la tête au bout de leur x), de profil pour Kéo. */
export const SHEEP = [
  { f: 5.0, s: -4.0, yaw: 0.25 },
  { f: 7.3, s: -5.5, yaw: 2.9 },
  { f: 5.2, s: -7.0, yaw: -0.3 },
] as const;

/** Le point du chemin du Kiosque (de `al-1` au Kiosque, puis à `al-2`) le plus proche de Kéo, d'où part la sente. */
const SENTE_FROM: Vec2 = (() => {
  const node = (id: string) => PATH_NODES_3E.find((n) => n.id === id)!.at;
  const line = [node('al-1'), node('kiosque'), node('al-2')];
  let best = line[0];
  for (let k = 0; k < line.length - 1; k++) {
    const a = line[k],
      c = line[k + 1];
    const dx = c.x - a.x,
      dz = c.z - a.z;
    const t = Math.min(1, Math.max(0, ((AT.x - a.x) * dx + (AT.z - a.z) * dz) / (dx * dx + dz * dz)));
    const p = { x: a.x + dx * t, z: a.z + dz * t };
    if (distance(p, AT) < distance(best, AT)) best = p;
  }
  return best;
})();

/** Le sens de la sente, de Kéo vers le chemin. */
const DOWN: Vec2 = (() => {
  const len = distance(SENTE_FROM, AT);
  return { x: (SENTE_FROM.x - AT.x) / len, z: (SENTE_FROM.z - AT.z) / len };
})();

/** Un point à `r` de Kéo, à `deg` degrés du sens de la sente (positif : vers la droite en descendant). */
const around = (deg: number, r: number): Vec2 => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a),
    s = Math.sin(a);
  return { x: AT.x + (DOWN.x * c - DOWN.z * s) * r, z: AT.z + (DOWN.z * c + DOWN.x * s) * r };
};

/**
 * La Bergerie, un Détour comme les autres (son nom : la proposition, § 8). `face` va de la vue vers Kéo : la caméra
 * regarde à l'opposé (`detourCap`). `says` : la phrase de Kéo, écrite sous le nom et lue après lui (proposition, au
 * directeur du contenu).
 */
export const BERGERIE: Detour = {
  id: 'bergerie',
  land: 'alpages',
  name: 'La Bergerie',
  kind: 'bergerie',
  at: AT,
  radius: 2.2,
  foot: AT,
  face: Math.atan2(-LOOK.z, -LOOK.x),
  sente: [SENTE_FROM, AT],
  view: BERGERIE_VIEW,
  says: 'Les moutons passent l’été tout là-haut.',
};

/**
 * Les couleurs : la pierre sèche claire de la bergerie, le pignon à l'ombre ; le muret de l'enclos d'un gris
 * chaud plus sombre, pour que la laine s'en détache ; l'ardoise du toit ; la porte de bois ; la laine des moutons, le dos plus clair, la tête brune (jamais
 * presque noire) ; les trois pierres des Détours.
 */
const C = {
  wall: C3E.stone,
  gable: C3E.stoneShade,
  pen: 0x9a9284,
  penTop: 0xb2aa9a,
  slate: C3E.slate,
  door: C3E.woodShade,
  wool: 0xf2eee4,
  woolTop: 0xfcfaf4,
  head: 0x6b5a4e,
  flat: 0xc9c0ae,
  flatSide: 0xa9a08f,
} as const;

/** Le sol sous un point. */
type Ground = (x: number, z: number) => number;

/** Les trois pierres plates, autour de Kéo, de part et d'autre de la sente (jamais dessus) : leur place, leur rayon. */
export const BERGERIE_STONES = [
  { deg: -42, r: 2.0, size: 0.5 },
  { deg: 40, r: 2.1, size: 0.45 },
  { deg: 125, r: 1.9, size: 0.4 },
] as const;

/** Le pied d'une pierre de `BERGERIE_STONES`, dans le monde. */
export const bergerieStoneAt = (k: number): Vec2 => around(BERGERIE_STONES[k].deg, BERGERIE_STONES[k].r);

/** Le quart de tour qui couche le repère d'un pavé dans celui de Kéo : x à droite, −z devant. */
const YAW = -CAP;

/** Un pavé du repère de Kéo, de `f0` à `f1` devant et de `s0` à `s1` en travers, de hauteur `h`, posé sur le sol. */
function slab(b: FacetBuilder, ground: Ground, f0: number, f1: number, s0: number, s1: number, h: number, color: number, top: number): void {
  const p = local((f0 + f1) / 2, (s0 + s1) / 2);
  const g = Math.min(ground(local(f0, s0).x, local(f0, s0).z), ground(local(f1, s1).x, local(f1, s1).z));
  b.box({ x: p.x, y: g - 0.1, z: p.z, yaw: YAW }, [s1 - s0, h + 0.1, f1 - f0], color, top);
}

/** La bergerie : ses murs de pierre sèche, son toit d'ardoise à deux pans qui déborde, sa porte dans le pignon. */
function hut(b: FacetBuilder, ground: Ground): void {
  const H = HUT;
  slab(b, ground, H.f - H.d / 2, H.f + H.d / 2, H.s - H.w / 2, H.s + H.w / 2, H.wall, C.wall, C.wall);
  const p = local(H.f, H.s);
  const y = ground(p.x, p.z) + H.wall;
  // Le faîte le long de la vue : le pignon de pierre, avec la porte, tourné vers Kéo ; le pan droit au soleil.
  b.gableRoof({ x: p.x, y, z: p.z, yaw: YAW + Math.PI / 2 }, H.d + H.eave * 2, H.w + H.eave * 2, H.ridge, C.slate, C.gable);
  const n = local(H.f - H.d / 2 - 0.02, H.s);
  const g = ground(n.x, n.z);
  const q = (ds: number, dy: number): P3 => {
    const v = local(H.f - H.d / 2 - 0.02, H.s + ds);
    return [v.x, g + dy, v.z];
  };
  b.quad(q(-H.door.w / 2, 0), q(H.door.w / 2, 0), q(H.door.w / 2, H.door.h), q(-H.door.w / 2, H.door.h), C.door);
}

/** L'enclos : trois murets bas contre la bergerie, celui tourné vers Kéo ouvert d'une seule entrée. */
function pen(b: FacetBuilder, ground: Ground): void {
  const P = PEN;
  const wall = (f0: number, f1: number, s0: number, s1: number) => slab(b, ground, f0, f1, s0, s1, P.h, C.pen, C.penTop);
  wall(P.f0, P.f0 + P.t, P.s0, P.gate.s0);
  wall(P.f0, P.f0 + P.t, P.gate.s1, P.s1);
  wall(P.f0 + P.t, P.f1 - P.t, P.s1 - P.t, P.s1);
  wall(P.f1 - P.t, P.f1, P.s0, P.s1);
}

/**
 * Un ellipsoïde à facettes (`rings` anneaux du haut au bas, `sides` pans autour) : centré en `c`, de demi-axes `along`
 * (le long de `yaw`, penché de `pitch` vers le bas), `up` et `across` ; le haut d'une couleur (`top`), le reste de `color`.
 * Aucune arête vive : un volume rond, de peu de pans larges.
 */
function ellipsoid(b: FacetBuilder, c: Vec3, along: number, up: number, across: number, yaw: number, pitch: number, rings: number, sides: number, color: number, top: number): void {
  const fx = Math.cos(yaw) * Math.cos(pitch),
    fy = -Math.sin(pitch),
    fz = -Math.sin(yaw) * Math.cos(pitch);
  const ux = Math.cos(yaw) * Math.sin(pitch),
    uy = Math.cos(pitch),
    uz = -Math.sin(yaw) * Math.sin(pitch);
  // Le côté : avant × haut, pour garder le sens des faces (tournées vers le dehors).
  const sx = fy * uz - fz * uy,
    sy = fz * ux - fx * uz,
    sz = fx * uy - fy * ux;
  const at = (i: number, k: number): P3 => {
    const phi = (Math.PI * i) / rings;
    const theta = (2 * Math.PI * k) / sides;
    const a = Math.sin(phi) * Math.cos(theta) * along,
      h = Math.cos(phi) * up,
      w = Math.sin(phi) * Math.sin(theta) * across;
    return [c.x + a * fx + h * ux + w * sx, c.y + a * fy + h * uy + w * sy, c.z + a * fz + h * uz + w * sz];
  };
  for (let i = 0; i < rings; i++)
    for (let k = 0; k < sides; k++) {
      const p0 = at(i, k),
        p1 = at(i, k + 1),
        p2 = at(i + 1, k + 1),
        p3 = at(i + 1, k);
      const tone = i === 0 ? top : color;
      if (i === 0) b.triangle(p0, p2, p3, tone);
      else if (i === rings - 1) b.triangle(p0, p1, p3, tone);
      else b.quad(p0, p1, p2, p3, tone);
    }
}

/**
 * Un mouton couché (relecture des Alpages, (a) 6, des Prairies, (a) 11, et du Cirque, correction 7) : le corps de laine
 * blanche, un ovale bombé à six larges pans, posé bas dans l'herbe, le dos rond, sans arête ni bout plat ; la petite tête brune,
 * un ovale à cinq pans qui dépasse nettement en avant et plus bas que le dos, le museau penché vers l'herbe. Aucun angle
 * droit, rien d'une caisse.
 */
function sheep(b: FacetBuilder, ground: Ground): void {
  /** Le corps : ses demi-axes (long, haut, large), son milieu au-dessus du sol (le bas enfoncé : il est couché). */
  const BODY = { along: 0.62, up: 0.42, across: 0.46, y: 0.3, rings: 3, sides: 6 } as const;
  /** La tête : ses demi-axes, sa place devant le milieu du corps et sa hauteur, son museau penché. */
  const HEAD = { along: 0.27, up: 0.17, across: 0.17, out: 0.74, y: 0.34, droop: 0.5, rings: 2, sides: 5 } as const;
  for (const m of SHEEP) {
    const p = local(m.f, m.s);
    const g = ground(p.x, p.z);
    const yaw = YAW + m.yaw;
    const dx = Math.cos(yaw),
      dz = -Math.sin(yaw);
    ellipsoid(b, { x: p.x, y: g + BODY.y, z: p.z }, BODY.along, BODY.up, BODY.across, yaw, 0, BODY.rings, BODY.sides, C.wool, C.woolTop);
    ellipsoid(b, { x: p.x + dx * HEAD.out, y: g + HEAD.y, z: p.z + dz * HEAD.out }, HEAD.along, HEAD.up, HEAD.across, yaw, HEAD.droop, HEAD.rings, HEAD.sides, C.head, C.head);
  }
}

function stones(b: FacetBuilder, ground: Ground): void {
  BERGERIE_STONES.forEach((s, k) => {
    const p = bergerieStoneAt(k);
    b.prism({ x: p.x, y: ground(p.x, p.z) - 0.05, z: p.z, yaw: BERGERIE.face + k }, s.size, s.size * 0.85, 0.22, 4, C.flatSide, C.flat);
  });
}

/** La sente de la Bergerie, en pointillé : celle du 5e (./creux5e.ts, `SENTE_5E`), un pavé par tiret, comme au Cadran. */
function sente(b: FacetBuilder, ground: Ground): void {
  const [a, c] = BERGERIE.sente;
  const len = distance(a, c);
  const dx = (c.x - a.x) / len,
    dz = (c.z - a.z) / len;
  const p = (t: number, o: number): P3 => [a.x + dx * t + dz * o, ground(a.x + dx * t, a.z + dz * t) + SENTE.lift, a.z + dz * t - dx * o];
  // Elle s'arrête un pas avant Kéo, aux pierres ; un tiret d'un seul pavé, tant elle vient de loin.
  const end = len - 1.2;
  for (let s = 0; s < end; s += SENTE.dash + SENTE.gap) {
    const e = Math.min(end, s + SENTE.dash);
    b.quad(p(s, SENTE.half), p(s, -SENTE.half), p(e, -SENTE.half), p(e, SENTE.half), SENTE.color);
  }
}

/**
 * Le décor de la Bergerie, tel que la vue l'ajoute au maillage des lieux (aucun appel de plus) : la bergerie, l'enclos,
 * les trois moutons, les pierres, et sa sente une fois trouvée (`found`), dans le monde comme sur la Carte. Sans la
 * sente : le plafond de 205 triangles (proposition, § 8, et relecture des Prairies, (a) 11).
 */
export function bergerieFacets(found: boolean, ground: Ground): Facets {
  const b = new FacetBuilder();
  hut(b, ground);
  pen(b, ground);
  sheep(b, ground);
  stones(b, ground);
  if (found) sente(b, ground);
  return b.build();
}

/** Le plan de la Bergerie, pour les tests : les volumes dans le monde (leurs coins), la sente, les couleurs. */
export const BERGERIE_LAYOUT = {
  look: LOOK,
  spot: SPOT,
  senteFrom: SENTE_FROM,
  colors: C,
  hut: [local(HUT.f - HUT.d / 2, HUT.s - HUT.w / 2), local(HUT.f + HUT.d / 2, HUT.s + HUT.w / 2)] as const,
  pen: [local(PEN.f0, PEN.s0), local(PEN.f1, PEN.s1)] as const,
  gate: [local(PEN.f0, PEN.gate.s0), local(PEN.f0, PEN.gate.s1)] as const,
  sheep: SHEEP.map((m) => local(m.f, m.s)),
  /** Ce qui se tient debout autour de Kéo : la bergerie et l'enclos, à cette distance au moins de la sente. */
  clearOfSente: (p: Vec2) => distanceToPolyline(p, [SENTE_FROM, AT]),
} as const;
