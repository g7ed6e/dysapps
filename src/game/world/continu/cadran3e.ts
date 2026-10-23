/**
 * Le Détour du Cadran (le Versant du 3e, GD-25, lot 2 ; proposition du consultant d'Archipéo, § 7, et planche
 * `selection-versant-v1`, graine 42), sur le mécanisme des autres Détours (./detours.ts, ./replat4e.ts) : « un grand
 * cadran solaire sur un rocher rond, face au pic ». Kéo s'y arrête, la vue se tourne au cap de 335°, vers le pic et, à sa
 * droite, le Fanal, le soleil dans le dos ; « Le Cadran » s'écrit une fois et se dit, et Kéo ajoute une phrase, écrite
 * dessous. Une sente reste tracée pour de bon après la première arrivée, depuis le chemin de `ve-3` à `ve-5`. Ni
 * compteur, ni récompense, ni mission, ni étape.
 *
 * La place : `DETOUR_SPOTS_3E.cadran`, au nord-est du Versant, entre l'Abri et le Grenier, loin de la langue de glace et
 * des rives, sur l'herbe à plat. Elle était à l'ouest du Jardin : le pic y cachait le Fanal, juste derrière lui ; d'ici,
 * le Fanal se tient à droite du pic, dégagé (relecture du Versant par le directeur artistique, (a) 3).
 * Un gros rocher rond de granit ; dessus, un disque de pierre claire uni et un style de fer bruni penché vers le nord, son
 * ombre fine sur le disque ; les trois pierres plates des Détours, de part et d'autre de la sente, jamais dessus. Ni
 * chiffre, ni trait, ni banc ; rien à lire. Le dessin reçoit son sol (`ground`). Code pur.
 */
import { SENTE_5E as SENTE } from './creux5e';
import type { Detour } from './detours';
import { FacetBuilder, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import { C3E } from './place3eKit';
import type { P3 } from './place4eKit';
import { DETOUR_SPOTS_3E, PATH_NODES_3E } from './plan3e';

/** Le cap de l'arrivée (proposition, § 7) : 335° ; la vue le tourne encore un peu à droite (`CADRAN_VIEW.turn`), le Fanal à droite du pic. */
const CAP = (335 * Math.PI) / 180;
const LOOK: Vec2 = { x: Math.sin(CAP), z: -Math.cos(CAP) };

/** La vue du Cadran à l'arrivée : la caméra monte à peine, le dessus du disque en vue ; tournée de 0,42 vers la droite, la pointe du pic à gauche du cartouche du nom, jamais dessous (relecture des Alpages, (a) 7). */
const CADRAN_VIEW = { height: -4, back: 1.6, turn: -0.42 } as const;

/**
 * Le budget du Cadran (proposition, § 7) : 175 triangles au plus sans la sente, dans le maillage des lieux, sans appel de
 * plus ; et sa sente, une fois tracée, au plus `sente` de plus.
 */
export const CADRAN_BUDGET = { triangles: 175, sente: 170 } as const;

/** Le rocher rond : son centre (la place réservée), son rayon au pied et en haut, sa hauteur ; le disque et le style. */
const ROCK = { at: DETOUR_SPOTS_3E.cadran, r0: 2.0, r1: 1.6, h: 1.15, cap: 0.25 } as const;
const DISC = { r: 1.4, h: 0.14 } as const;
const STYLE = { base: 0.4, len: 1.25, rise: 0.8, shadow: 1.1, shadowTurn: -0.45 } as const;

/**
 * Là où Kéo s'arrête : devant le rocher, au sud, un peu à sa gauche, le regard au cap de l'arrivée : le rocher et son
 * disque à droite de Kéo, jamais derrière lui.
 */
const AT: Vec2 = { x: ROCK.at.x - LOOK.x * 3.2 + LOOK.z * 2.0, z: ROCK.at.z - LOOK.z * 3.2 - LOOK.x * 2.0 };

/** Le point du chemin de `ve-3` à `ve-5` le plus proche de Kéo, d'où part la sente. */
const SENTE_FROM: Vec2 = (() => {
  const a = PATH_NODES_3E.find((n) => n.id === 've-3')!.at;
  const c = PATH_NODES_3E.find((n) => n.id === 've-5')!.at;
  const dx = c.x - a.x,
    dz = c.z - a.z;
  const t = Math.min(1, Math.max(0, ((AT.x - a.x) * dx + (AT.z - a.z) * dz) / (dx * dx + dz * dz)));
  return { x: a.x + dx * t, z: a.z + dz * t };
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
 * Le Cadran, un Détour comme les autres (son nom : la proposition, § 7). `face` va du pic vers Kéo : la caméra regarde à
 * l'opposé (`detourCap`). `says` : la phrase de Kéo, écrite sous le nom et lue après lui (proposition, au directeur du
 * contenu).
 */
export const CADRAN: Detour = {
  id: 'cadran',
  land: 'versant',
  name: 'Le Cadran',
  kind: 'cadran',
  at: AT,
  radius: 2.2,
  foot: AT,
  face: Math.atan2(-LOOK.z, -LOOK.x),
  sente: [SENTE_FROM, AT],
  view: CADRAN_VIEW,
  says: 'Ici, l’ombre disait l’heure.',
};

/**
 * Les couleurs : le granit du rocher (celui des Passeurs), le dessus un cran plus clair ; la pierre claire du disque ;
 * l'ombre fine du style, plus sombre que le disque, jamais noire ; le fer bruni ; les trois pierres des Détours.
 */
const C = {
  rock: C3E.graniteShade,
  rockTop: C3E.granite,
  rockSun: C3E.graniteSun,
  disc: C3E.stone,
  discSide: C3E.stoneShade,
  shadow: C3E.joint,
  iron: C3E.iron,
  flat: 0xc9c0ae,
  flatSide: 0xa9a08f,
} as const;

/** Le sol sous un point. */
type Ground = (x: number, z: number) => number;

/** Les trois pierres plates, autour de Kéo, de part et d'autre de la sente (jamais dessus) : leur place, leur rayon. */
export const CADRAN_STONES = [
  { deg: -40, r: 2.0, size: 0.5 },
  { deg: 38, r: 2.1, size: 0.45 },
  { deg: -125, r: 1.9, size: 0.4 },
] as const;

/** Le pied d'une pierre de `CADRAN_STONES`, dans le monde. */
export const cadranStoneAt = (k: number): Vec2 => around(CADRAN_STONES[k].deg, CADRAN_STONES[k].r);

/** Le dessus du rocher, où se pose le disque. */
const rockTop = (ground: Ground): number => ground(ROCK.at.x, ROCK.at.z) + ROCK.h + ROCK.cap;

/** Le rocher rond : un tronc à sept pans enfoncé dans l'herbe, puis son épaule arrondie. */
function rock(b: FacetBuilder, ground: Ground): void {
  const { x, z } = ROCK.at;
  const g = ground(x, z);
  b.prism({ x, y: g - 0.4, z, yaw: 0.3 }, ROCK.r0, ROCK.r1 + 0.15, ROCK.h + 0.4, 7, C.rock, C.rockTop);
  b.prism({ x, y: g + ROCK.h, z, yaw: 0.75 }, ROCK.r1 + 0.1, ROCK.r1 - 0.15, ROCK.cap, 7, C.rockSun, C.rockTop);
}

/** Le disque uni de pierre claire, le style de fer penché vers le nord, et son ombre fine sur le disque. */
function dial(b: FacetBuilder, ground: Ground): void {
  const { x, z } = ROCK.at;
  const y = rockTop(ground);
  b.prism({ x, y: y - 0.04, z }, DISC.r, DISC.r, DISC.h, 10, C.discSide, C.disc);
  const top = y - 0.04 + DISC.h;
  const foot = { x: x - LOOK.x * STYLE.base, y: top, z: z - LOOK.z * STYLE.base };
  const k = STYLE.len / Math.hypot(1, STYLE.rise);
  b.beam(foot, { x: foot.x + LOOK.x * k, y: top + STYLE.rise * k, z: foot.z + LOOK.z * k }, 0.07, C.iron);
  // L'ombre : un trait fin du pied du style vers le nord-ouest, le soleil du matin dans le dos.
  const a = Math.atan2(LOOK.z, LOOK.x) + STYLE.shadowTurn;
  const d = { x: Math.cos(a), z: Math.sin(a) };
  const w = 0.045;
  const p = (t: number, o: number): P3 => [foot.x + d.x * t - d.z * o, top + 0.006, foot.z + d.z * t + d.x * o];
  b.quad(p(0, -w), p(0, w), p(STYLE.shadow, w * 0.6), p(STYLE.shadow, -w * 0.6), C.shadow);
}

function stones(b: FacetBuilder, ground: Ground): void {
  CADRAN_STONES.forEach((s, k) => {
    const p = cadranStoneAt(k);
    b.prism({ x: p.x, y: ground(p.x, p.z) - 0.05, z: p.z, yaw: CADRAN.face + k }, s.size, s.size * 0.85, 0.22, 4, C.flatSide, C.flat);
  });
}

/** La sente du Cadran, en pointillé : celle du 5e (./creux5e.ts, `SENTE_5E`), un pavé par tiret, comme au Replat. */
function sente(b: FacetBuilder, ground: Ground): void {
  const [a, c] = CADRAN.sente;
  const len = distance(a, c);
  const dx = (c.x - a.x) / len,
    dz = (c.z - a.z) / len;
  const p = (t: number, o: number): P3 => [a.x + dx * t + dz * o, ground(a.x + dx * t, a.z + dz * t) + SENTE.lift, a.z + dz * t - dx * o];
  // Elle s'arrête un pas avant Kéo, aux pierres.
  const end = len - 1.2;
  for (let s = 0; s < end; s += SENTE.dash + SENTE.gap) {
    const e = Math.min(end, s + SENTE.dash);
    for (let t = s; t < e - 1e-6; t += 0.7) {
      const t1 = Math.min(e, t + 0.7);
      b.quad(p(t, SENTE.half), p(t, -SENTE.half), p(t1, -SENTE.half), p(t1, SENTE.half), SENTE.color);
    }
  }
}

/**
 * Le décor du Cadran, tel que la vue l'ajoute au maillage des lieux (aucun appel de plus) : le rocher, le disque, le
 * style et son ombre, les pierres, et sa sente une fois trouvée (`found`), dans le monde comme sur la Carte. Sans la
 * sente : le plafond de 175 triangles (proposition, § 7).
 */
export function cadranFacets(found: boolean, ground: Ground): Facets {
  const b = new FacetBuilder();
  rock(b, ground);
  dial(b, ground);
  stones(b, ground);
  if (found) sente(b, ground);
  return b.build();
}

/** Le plan du Cadran, pour les tests. */
export const CADRAN_LAYOUT = { look: LOOK, down: DOWN, rock: ROCK, disc: DISC, senteFrom: SENTE_FROM, colors: C, around } as const;
