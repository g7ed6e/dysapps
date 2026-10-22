/**
 * Le Détour du Replat (les Coteaux du 4e ; intention du directeur artistique du 22 octobre 2026, § 8), rattaché à la
 * Veillée, sur le mécanisme des autres Détours (./detours.ts, ./epave4e.ts) : « un endroit plat dans la pente, d'où l'on
 * voit toute l'usine ». Kéo s'y arrête, la vue se tourne au cap de 105°, vers l'usine, et reste à sa hauteur ; « Le
 * Replat » s'écrit une fois et se dit, et la voix ajoute une phrase. Une sente reste tracée pour de bon après la première
 * arrivée, depuis le chemin de `cot-3` à la Veillée. Ni compteur, ni récompense, ni mission, ni étape.
 *
 * La place : sur l'épaule ouest du cône, hors des chemins (./plan4e.ts, `REPLAT_4E`), où la pente s'adoucit autour de
 * Kéo (./terrain4e.ts). Une terrasse d'herbe d'un vert un cran plus franc que les verts brûlés, jamais vif, sur la pente
 * brune ; un muret bas de pierres sèches (0,5) en arc ouvert, du côté où la pente descend, en huit blocs jointifs (la
 * sente passe entre deux) ; un vieux poteau de bois gris et sa lanterne d'ocre, allumée dès le départ ; les trois pierres plates des
 * Détours, de part et d'autre de la sente, jamais dessus. Ni banc, ni dalle, ni cabane, ni longue-vue ; rien à lire. Le
 * dessin reçoit son sol (`ground`). Code pur.
 */
import { SENTE_5E as SENTE } from './creux5e';
import type { Detour } from './detours';
import { FacetBuilder, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import { C4E, lantern, type P3 } from './place4eKit';
import { REPLAT_4E } from './plan4e';

/** Le cap de l'arrivée (intention, « Les caps ») : 105°, à 48° du soleil ; la caméra regarde vers l'usine. */
const CAP = (105 * Math.PI) / 180;
const LOOK: Vec2 = { x: Math.sin(CAP), z: -Math.cos(CAP) };

/** La vue du Replat à l'arrivée : la caméra monte peu et reste à hauteur de Kéo, comme à l'Épave (./epave4e.ts). */
const REPLAT_VIEW = { height: -3, back: 1.15, turn: 0 } as const;

/**
 * Le budget du Replat (intention, « Le coût ») : 175 triangles au plus sans la sente, dans le maillage des lieux, sans
 * appel de plus ; et sa sente, une fois tracée, au plus `sente` de plus (comme celle de l'Épave).
 */
export const REPLAT_BUDGET = { triangles: 175, sente: 170 } as const;

/** Là où Kéo s'arrête : au milieu de la terrasse. */
const AT: Vec2 = { x: REPLAT_4E.at.x, z: REPLAT_4E.at.z };

/** Le sens où la pente descend, depuis Kéo (vers la Veillée et la mer, au sud-sud-ouest) : celui de la sente, qui monte de là. */
const DOWN: Vec2 = (() => {
  const { senteFrom } = REPLAT_4E;
  const len = distance(senteFrom, AT);
  return { x: (senteFrom.x - AT.x) / len, z: (senteFrom.z - AT.z) / len };
})();

/** Un point à `r` de Kéo, à `deg` degrés du sens de la descente (positif : vers l'est, à gauche en descendant). */
const around = (deg: number, r: number): Vec2 => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a),
    s = Math.sin(a);
  return { x: AT.x + (DOWN.x * c - DOWN.z * s) * r, z: AT.z + (DOWN.z * c + DOWN.x * s) * r };
};

/**
 * Le Replat, un Détour comme les autres (son nom : l'intention, « Le Replat »). `face` va de l'usine vers Kéo : la
 * caméra regarde à l'opposé (`detourCap`). `says`, lu seulement (`saysAloudOnly`) : ce que la voix ajoute, une fois,
 * après le nom, sans l'écrire.
 */
export const REPLAT: Detour = {
  id: 'replat',
  land: 'coteaux',
  name: 'Le Replat',
  kind: 'replat',
  at: AT,
  radius: 2.5,
  foot: AT,
  face: Math.atan2(-LOOK.z, -LOOK.x),
  sente: [{ x: REPLAT_4E.senteFrom.x, z: REPLAT_4E.senteFrom.z }, AT],
  view: REPLAT_VIEW,
  says: 'Un replat, c’est un endroit plat dans une pente.',
  saysAloudOnly: true,
};

/**
 * Les couleurs : l'herbe de la terrasse, un cran plus franche que les verts brûlés des Coteaux (`COLORS_4E.burnt`),
 * jamais vive, et son bord ; la pierre sèche du muret (la pierre grise des Passeurs) ; le bois gris du vieux poteau ; les
 * trois pierres des Détours (celles du 6e, ./detours.ts).
 */
const C = {
  grass: 0x8a9858,
  grassEdge: 0x76844c,
  stone: C4E.stone,
  stoneSun: C4E.stoneSun,
  stoneShade: C4E.stoneShade,
  pole: C4E.woodShade,
  poleTop: C4E.wood,
  flat: 0xc9c0ae,
  flatSide: 0xa9a08f,
} as const;

/** Le sol sous un point. */
type Ground = (x: number, z: number) => number;

/** La terrasse : son rayon (jusqu'au muret) et le nombre de ses côtés ; de combien elle passe au-dessus du sol. */
const TERRACE = { r: 3.9, sides: 9, lift: 0.06 } as const;

/**
 * Le muret de pierres sèches, en arc ouvert du côté où la pente descend : huit blocs jointifs, chacun à `deg` du sens de
 * la descente, à `r` de Kéo, tangents à l'arc (retouche 1 : cinq blocs espacés ne se lisaient pas en arc) ; leur longueur
 * (la corde de leur part d'arc, un rien de plus pour qu'ils se touchent), leur épaisseur, leur hauteur (0,5). La sente
 * passe entre le quatrième et le cinquième (à 0°), un pas de chaque côté.
 */
const MURET = { blocks: [-91, -69, -47, -25, 25, 47, 69, 91], r: 3.6, len: 1.45, t: 0.45, h: 0.5 } as const;

/** Le vieux poteau et sa lanterne : à l'est de Kéo, sur le bord de la terrasse, vers le haut ; sa hauteur. */
const POLE = { deg: 125, r: 2.9, h: 1.7 } as const;

/** Les trois pierres plates, autour de Kéo, de part et d'autre de la sente (jamais dessus) : leur place, leur rayon. */
export const REPLAT_STONES = [
  { deg: -32, r: 2.2, size: 0.5 },
  { deg: 34, r: 2.1, size: 0.45 },
  { deg: -160, r: 2.0, size: 0.42 },
] as const;

/** Le pied d'une pierre de `REPLAT_STONES`, dans le monde. */
export const replatStoneAt = (k: number): Vec2 => around(REPLAT_STONES[k].deg, REPLAT_STONES[k].r);

/** La terrasse d'herbe : un aplat à plusieurs côtés, chaque coin juste au-dessus du sol (elle épouse le replat). */
function terrace(b: FacetBuilder, ground: Ground): void {
  const pts: P3[] = [];
  for (let k = 0; k < TERRACE.sides; k++) {
    const a = (2 * Math.PI * k) / TERRACE.sides;
    const x = AT.x + Math.cos(a) * TERRACE.r,
      z = AT.z + Math.sin(a) * TERRACE.r;
    pts.push([x, ground(x, z) + TERRACE.lift, z]);
  }
  const mid: P3 = [AT.x, ground(AT.x, AT.z) + TERRACE.lift, AT.z];
  // Un éventail depuis le milieu, tourné vers le haut ; son bord, un cran plus sombre, au-dessus du sol d'un doigt.
  for (let k = 0; k < TERRACE.sides; k++) {
    const p = pts[k],
      q = pts[(k + 1) % TERRACE.sides];
    b.triangle(mid, q, p, C.grass);
    b.quad(p, q, [q[0], q[1] - 0.25, q[2]], [p[0], p[1] - 0.25, p[2]], C.grassEdge);
  }
}

/** Le muret : huit blocs de pierre sèche, chacun tangent à l'arc, posé sur le sol. */
function muret(b: FacetBuilder, ground: Ground): void {
  for (const deg of MURET.blocks) {
    const p = around(deg, MURET.r);
    // Tangent à l'arc : sa longueur en travers du rayon.
    const yaw = Math.atan2(p.x - AT.x, p.z - AT.z) + Math.PI / 2;
    b.box({ x: p.x, y: ground(p.x, p.z) - 0.25, z: p.z, yaw }, [MURET.len, MURET.h + 0.25, MURET.t], C.stoneShade, C.stoneSun);
  }
}

/** Le vieux poteau de bois gris et sa lanterne d'ocre, allumée dès le départ. */
function pole(b: FacetBuilder, ground: Ground): void {
  const p = around(POLE.deg, POLE.r);
  const y = ground(p.x, p.z);
  b.box({ x: p.x, y: y - 0.3, z: p.z }, [0.16, POLE.h + 0.3, 0.16], C.pole, C.poleTop);
  lantern(b, { x: p.x, y: y + POLE.h + 0.02, z: p.z }, true, 0.85);
}

function stones(b: FacetBuilder, ground: Ground): void {
  REPLAT_STONES.forEach((s, k) => {
    const p = replatStoneAt(k);
    b.prism({ x: p.x, y: ground(p.x, p.z) - 0.05, z: p.z, yaw: REPLAT.face + k }, s.size, s.size * 0.85, 0.22, 4, C.flatSide, C.flat);
  });
}

/** La sente du Replat, en pointillé : celle du 5e (./creux5e.ts, `SENTE_5E`), un pavé par tiret, comme à l'Épave. */
function sente(b: FacetBuilder, ground: Ground): void {
  const [a, c] = REPLAT.sente;
  const len = distance(a, c);
  const dx = (c.x - a.x) / len,
    dz = (c.z - a.z) / len;
  const p = (t: number, o: number): P3 => [a.x + dx * t + dz * o, ground(a.x + dx * t, a.z + dz * t) + SENTE.lift, a.z + dz * t - dx * o];
  for (let s = 0; s < len - TERRACE.r; s += SENTE.dash + SENTE.gap) {
    const e = Math.min(len - TERRACE.r, s + SENTE.dash);
    for (let t = s; t < e - 1e-6; t += 0.7) {
      const t1 = Math.min(e, t + 0.7);
      b.quad(p(t, SENTE.half), p(t, -SENTE.half), p(t1, -SENTE.half), p(t1, SENTE.half), SENTE.color);
    }
  }
}

/**
 * Le décor du Replat, tel que la vue l'ajoute au maillage des lieux (aucun appel de plus) : la terrasse, le muret, le
 * poteau et sa lanterne, les pierres, et sa sente une fois trouvée (`found`), dans le monde comme sur la Carte. Sans la
 * sente : le plafond de 175 triangles (intention, « Le coût »).
 */
export function replatFacets(found: boolean, ground: Ground): Facets {
  const b = new FacetBuilder();
  terrace(b, ground);
  muret(b, ground);
  pole(b, ground);
  stones(b, ground);
  if (found) sente(b, ground);
  return b.build();
}

/** Le plan du Replat, pour les tests. */
export const REPLAT_LAYOUT = { look: LOOK, down: DOWN, terrace: TERRACE, muret: MURET, pole: POLE, around } as const;
