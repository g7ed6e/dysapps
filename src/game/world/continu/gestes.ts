// Le geste du métier (GD-27, axe 2, piste A ; lot 5 du chantier « Rendre le monde ouvert vivant », suite, 30 octobre
// 2026, piste A « l'outil qui travaille » du directeur artistique) : devant un lieu rallumé, l'outil de l'habitant près
// de sa porte bouge, le corps immobile ; une pièce fixe (le support, la tenue) et une pièce mobile, qui tourne autour de
// son pivot (ou glisse, la navette) d'un cycle lent et doux (`GESTE_CYCLE`), sans choc ni contact. Un seul habitant à la
// fois : celui du lieu rallumé le plus proche de Kéo arrêté, à portée (`GESTE_REACH`, avec une marge pour qu'il ne
// s'arrête pas à la limite), un temps après son arrêt (`GESTE_SETTLE`). Les outils des autres habitants sont là au repos
// (la pose de « Réduire les animations » : tenu ou posé en position de travail, jamais à mi-course). Dans la ruine,
// l'outil est absent, son support aussi, l'habitant reste debout les mains vides ; en chantier, l'outil est là, au repos
// (directeur artistique, avec le consultant d'Archipéo). Tous dans un seul maillage par niveau (un appel, comme les
// habitants), que la vue montre et cache avec eux ; la pièce mobile de l'habitant actif est déplacée sommet par sommet
// (`moveMobile`), quelques dizaines de sommets par image. Rien n'est annoncé : le mouvement est décoratif, l'état du lieu
// reste porté par l'écrit (référent dys). Code pur.
import { FacetBuilder, type Facets } from './facets';
import { distance, type Vec3 } from './geometry';
import { type PlaceId, type ScenePlaceId } from './levelPlan';
import { hasWorldHabitant, worldHabitantAt, worldHabitantHeight, worldHabitantYaw } from './worldHabitants';

/** Le cycle du geste, en secondes : un aller et retour, lent (directeur artistique ; bien sous trois variations par seconde). */
export const GESTE_CYCLE = 4;

/** Kéo à cette distance de l'habitant (ses pieds) ou moins : son outil peut bouger ; il s'arrête au-delà de `GESTE_REACH * GESTE_SLACK`. */
export const GESTE_REACH = 12;
export const GESTE_SLACK = 1.25;

/** Le temps, en secondes, entre l'arrêt de Kéo et le début du geste (référent dys : rien ne bouge pendant un trajet saccadé). */
export const GESTE_SETTLE = 1.5;

/** Les triangles d'un outil au plus, ses deux pièces réunies (directeur artistique : de 20 à 60). */
export const GESTE_TRIANGLES = 60;

/** La taille de l'habitant pour laquelle le kit est coté (directeur artistique) ; chaque outil suit la sienne. */
const KIT_HEIGHT = 3.5;

/** Les aplats du kit (directeur artistique) : rien de plus sombre que le bois sombre. */
const WOOD = 0xb07a4a;
const DARK_WOOD = 0x7a5236;
const IRON = 0x7c8790;
const BRASS = 0xc9a040;
const LINEN = 0xe5dcc5;
const LEATHER = 0x9a6440;
const SIGNAL = 0xc8483a;
const LAGOON = 0x178078;

/**
 * Un outil, dessiné dans le repère de l'habitant coté pour `KIT_HEIGHT` : l'origine à ses pieds, y en haut, z vers qui
 * arrive (il lui fait face), x vers sa main droite. Sa pièce fixe, sa pièce mobile, et le mouvement de celle-ci : une
 * rotation d'`amplitude` (radians) autour de `axis` passant par `pivot`, ou une translation de `shift`.
 */
export interface ToolShape {
  fixed(b: FacetBuilder): void;
  mobile(b: FacetBuilder): void;
  pivot: Vec3;
  axis: Vec3;
  amplitude: number;
  shift?: Vec3;
}

/** La part du geste à `t` secondes de son début : du repos (0) au bout (1) et retour, en douceur (jamais de saut au départ ni au point bas). */
export const gestePhase = (t: number): number => (1 - Math.cos((2 * Math.PI * t) / GESTE_CYCLE)) / 2;

/** La pièce mobile d'un habitant dans le maillage des outils : ses sommets de `start` à `start + count` (trois nombres chacun), son mouvement dans le monde. */
export interface MobilePiece {
  place: ScenePlaceId;
  start: number;
  count: number;
  pivot: Vec3;
  axis: Vec3;
  amplitude: number;
  shift?: Vec3;
}

/** Les outils d'un niveau : un seul maillage, les pièces mobiles repérées. */
export interface WorldGestes {
  facets: Facets;
  mobiles: readonly MobilePiece[];
}

const unit = (v: Vec3): Vec3 => {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
};

const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Le repère de l'habitant d'un lieu dans le monde : ses pieds, son cap (le visage vers +z au cap nul). Sa main droite
 * est à −x dans son repère (il fait face à +z, y en haut) : le kit, coté x vers la droite, est retourné (`mirror`).
 */
function habitantFrame(place: ScenePlaceId, ground: (x: number, z: number) => number): ((p: Vec3) => Vec3) | null {
  const at = worldHabitantAt(place, ground);
  if (!at) return null;
  const yaw = worldHabitantYaw(place);
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  const k = worldHabitantHeight(place) / KIT_HEIGHT;
  return (p) => ({ x: at.x + k * (-p.x * c + p.z * s), y: at.y + k * p.y, z: at.z + k * (p.x * s + p.z * c) });
}

/**
 * Les outils des habitants de `places` (ceux qui en ont un, hors ruine : `withTool`), à leur place dans le monde, dans un
 * seul maillage ; la pièce mobile de chacun au repos, repérée. L'ordre des sommets : pour chaque lieu, sa pièce fixe puis
 * sa pièce mobile.
 */
export function worldGestes(places: readonly PlaceId[], ground: (x: number, z: number) => number, withTool: (place: ScenePlaceId) => boolean = () => true, toolOf: (place: ScenePlaceId) => ToolShape | null = gesteToolOf): WorldGestes {
  const b = new FacetBuilder();
  const mobiles: MobilePiece[] = [];
  let vertices = 0;
  for (const place of places) {
    if (!hasWorldHabitant(place) || !withTool(place)) continue;
    const tool = toolOf(place);
    const frame = tool && habitantFrame(place, ground);
    if (!tool || !frame) continue;
    const yaw = worldHabitantYaw(place);
    const k = worldHabitantHeight(place) / KIT_HEIGHT;
    const fixed = new FacetBuilder();
    tool.fixed(fixed);
    const mobile = new FacetBuilder();
    tool.mobile(mobile);
    const f = placeIn(fixed.build(), frame, yaw);
    const m = placeIn(mobile.build(), frame, yaw);
    b.append(f);
    vertices += f.positions.length / 3;
    b.append(m);
    const turn = (v: Vec3): Vec3 => ({ x: -v.x * Math.cos(yaw) + v.z * Math.sin(yaw), y: v.y, z: v.x * Math.sin(yaw) + v.z * Math.cos(yaw) });
    const a = unit(turn(tool.axis));
    // Un repère retourné (x vers la droite devient −x) renverse le sens des rotations : l'amplitude change de signe.
    const sh = tool.shift ? turn(tool.shift) : undefined;
    mobiles.push({ place, start: vertices, count: m.positions.length / 3, pivot: frame(tool.pivot), axis: a, amplitude: -tool.amplitude, ...(sh ? { shift: { x: sh.x * k, y: sh.y * k, z: sh.z * k } } : {}) });
    vertices += m.positions.length / 3;
  }
  return { facets: b.build(), mobiles };
}

/**
 * Des facettes du kit mises dans le monde : positions par `frame` (qui retourne x), normales retournées puis tournées du
 * cap ; le retournement renverse chaque triangle, remis dans le sens de sa face.
 */
function placeIn(f: Facets, frame: (p: Vec3) => Vec3, yaw: number): Facets {
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  const positions = new Float32Array(f.positions.length);
  const normals = new Float32Array(f.normals.length);
  const colors = new Float32Array(f.colors.length);
  for (let tri = 0; tri < f.triangles; tri++) {
    for (let v = 0; v < 3; v++) {
      // Le sommet b et le sommet c échangés : le triangle garde sa face après le retournement.
      const src = (tri * 3 + (v === 0 ? 0 : 3 - v)) * 3;
      const dst = (tri * 3 + v) * 3;
      const p = frame({ x: f.positions[src], y: f.positions[src + 1], z: f.positions[src + 2] });
      positions[dst] = p.x;
      positions[dst + 1] = p.y;
      positions[dst + 2] = p.z;
      const nx = -f.normals[src], nz = f.normals[src + 2];
      normals[dst] = nx * c + nz * s;
      normals[dst + 1] = f.normals[src + 1];
      normals[dst + 2] = -nx * s + nz * c;
      colors[dst] = f.colors[src];
      colors[dst + 1] = f.colors[src + 1];
      colors[dst + 2] = f.colors[src + 2];
    }
  }
  return { positions, normals, colors, triangles: f.triangles };
}

/**
 * Met la pièce mobile `m` à la part `phase` de son geste (0 : au repos) : ses sommets au repos (`rest`, le maillage tel
 * qu'il est bâti) écrits dans `out` (les deux tableaux de même forme, celui du maillage). Les normales ne sont pas
 * touchées : à cette taille et à cette amplitude, l'éclairage ne se voit pas bouger.
 */
export function moveMobile(rest: Float32Array, out: Float32Array, m: MobilePiece, phase: number): void {
  const end = (m.start + m.count) * 3;
  if (m.shift) {
    for (let k = m.start * 3; k < end; k += 3) {
      out[k] = rest[k] + m.shift.x * phase;
      out[k + 1] = rest[k + 1] + m.shift.y * phase;
      out[k + 2] = rest[k + 2] + m.shift.z * phase;
    }
    return;
  }
  const angle = m.amplitude * phase;
  const c = Math.cos(angle),
    s = Math.sin(angle),
    t = 1 - c;
  const { x: ax, y: ay, z: az } = m.axis;
  // La matrice de Rodrigues.
  const r00 = c + ax * ax * t, r01 = ax * ay * t - az * s, r02 = ax * az * t + ay * s;
  const r10 = ay * ax * t + az * s, r11 = c + ay * ay * t, r12 = ay * az * t - ax * s;
  const r20 = az * ax * t - ay * s, r21 = az * ay * t + ax * s, r22 = c + az * az * t;
  for (let k = m.start * 3; k < end; k += 3) {
    const x = rest[k] - m.pivot.x, y = rest[k + 1] - m.pivot.y, z = rest[k + 2] - m.pivot.z;
    out[k] = m.pivot.x + r00 * x + r01 * y + r02 * z;
    out[k + 1] = m.pivot.y + r10 * x + r11 * y + r12 * z;
    out[k + 2] = m.pivot.z + r20 * x + r21 * y + r22 * z;
  }
}

/**
 * L'habitant dont l'outil bouge : parmi `candidates` (les lieux rallumés dont l'habitant est montré, dans l'ordre du
 * niveau, qui départage à égalité), le plus proche de Kéo (`here`) à portée ; celui d'avant (`previous`) garde la main
 * tant qu'il reste à portée élargie (pas d'alternance à la limite, ni d'une image à l'autre). Rien hors de portée.
 */
export function activeGeste(here: { x: number; z: number }, candidates: readonly ScenePlaceId[], previous: ScenePlaceId | null, ground: (x: number, z: number) => number): ScenePlaceId | null {
  const far = (place: ScenePlaceId): number => {
    const at = worldHabitantAt(place, ground);
    return at ? distance(here, at) : Infinity;
  };
  if (previous && candidates.includes(previous) && far(previous) <= GESTE_REACH * GESTE_SLACK) return previous;
  let best: ScenePlaceId | null = null;
  let bestD = GESTE_REACH;
  for (const place of candidates) {
    const d = far(place);
    if (d < bestD) {
      best = place;
      bestD = d;
    }
  }
  return best;
}

/** Un pavé posé d'un point à un autre (une poutre, un manche), de section `w` carrée. */
function beam(b: FacetBuilder, from: Vec3, to: Vec3, w: number, color: number): void {
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  const l = Math.hypot(dx, dy, dz);
  b.box({ x: from.x, y: from.y, z: from.z, yaw: Math.atan2(dx, dz), pitch: Math.acos(Math.max(-1, Math.min(1, dy / l))) }, [w, l, w], color);
}

/** Un point. */
const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

/** Où se pose un support : à côté de la main droite, un peu devant, jamais devant le corps. */
const STAND = v(0.75, 0, 0.35);
/** La main qui tient un outil. */
const HAND = v(0.55, 1.6, 0.3);

const X: Vec3 = v(1, 0, 0);
const Y: Vec3 = v(0, 1, 0);
const Z: Vec3 = v(0, 0, 1);

/**
 * Le kit : quatorze formes (directeur artistique, avec le consultant d'Archipéo, 30 octobre 2026), boîtes et prismes,
 * de 24 à 60 triangles. L'axe et le sens de chaque mouvement sont choisis pour que la pièce bouge comme le geste le
 * veut (la tête du marteau monte, la clé tourne sur le boulon) ; la pose de repos est l'outil en position de travail.
 */
export const TOOL_KIT = {
  /** 1. Le marteau sur le billot : la tête monte de 30° depuis 0,05 au-dessus du billot, sans jamais le toucher. */
  marteau: (): ToolShape => ({
    fixed: (b) => b.box(STAND, [0.6, 0.9, 0.6], DARK_WOOD),
    mobile: (b) => {
      beam(b, v(0.3, 1.03, 0.35), v(0.9, 1.03, 0.35), 0.08, WOOD);
      b.box(v(0.75, 0.95, 0.35), [0.14, 0.14, 0.3], IRON);
    },
    pivot: v(0.3, 1.03, 0.35),
    axis: Z,
    amplitude: rad(30),
  }),
  /** 2. L'outil à long manche (la pelle, la bêche), tenu, la tête posée au sol, qui avance et recule de 12°. */
  pelle: (): ToolShape => longHandle((b, foot) => b.box({ ...foot, pitch: rad(25) }, [0.35, 0.05, 0.4], IRON)),
  /** 2 bis. Le râteau (à sel) : une barre et trois dents. */
  rateau: (): ToolShape =>
    longHandle((b, foot) => {
      b.box(foot, [0.6, 0.1, 0.1], WOOD);
      for (const dx of [-0.2, 0, 0.2]) b.box(v(foot.x + dx, foot.y - 0.12, foot.z), [0.04, 0.12, 0.04], WOOD);
    }),
  /** 2 ter. La brosse à long manche. */
  brosse: (): ToolShape => longHandle((b, foot) => b.box(v(foot.x, foot.y - 0.1, foot.z), [0.5, 0.1, 0.15], LINEN)),
  /** 3. La gaffe ou la perche, tenue, penchée vers l'eau, qui va et vient de côté de 10°. */
  gaffe: (): ToolShape => {
    // Tenue près de sa tête : elle descend devant et au large de l'habitant, sans repasser devant son corps.
    const d = unit(v(0.5, -0.87, 0.5));
    const top = v(HAND.x - d.x * 0.25, HAND.y - d.y * 0.25, HAND.z - d.z * 0.25);
    return {
      fixed: () => {},
      mobile: (b) => {
        beam(b, v(HAND.x + d.x * 2.15, HAND.y + d.y * 2.15, HAND.z + d.z * 2.15), top, 0.07, WOOD);
        b.box({ ...top, pitch: rad(25) }, [0.05, 0.25, 0.15], IRON);
      },
      pivot: HAND,
      axis: Z,
      amplitude: rad(10),
    };
  },
  /** 4. Le pinceau au chevalet : la pointe balaie la toile de 25° depuis le bas. */
  chevalet: (): ToolShape => ({
    fixed: (b) => {
      beam(b, v(0.45, 0, 0.5), v(0.7, 1.7, 0.4), 0.06, WOOD);
      beam(b, v(1.05, 0, 0.5), v(0.8, 1.7, 0.4), 0.06, WOOD);
      b.box(v(0.75, 1.0, 0.43), [0.8, 0.6, 0.04], LINEN);
    },
    mobile: (b) => {
      beam(b, v(0.5, 1.4, 0.55), v(0.65, 1.1, 0.47), 0.05, WOOD);
      b.box({ x: 0.65, y: 1.06, z: 0.47, pitch: rad(-20) }, [0.05, 0.06, 0.05], LAGOON);
    },
    pivot: v(0.5, 1.4, 0.55),
    axis: Z,
    amplitude: rad(25),
  }),
  /** 5. La plume au pupitre : elle va de gauche à droite sur la feuille, de 20°. */
  pupitre: (sheet = LINEN): ToolShape => ({
    fixed: (b) => {
      b.box(STAND, [0.6, 1.3, 0.5], DARK_WOOD);
      b.box({ x: 0.75, y: 1.3, z: 0.35, pitch: rad(-20) }, [0.45, 0.02, 0.35], sheet);
    },
    mobile: (b) => {
      beam(b, v(0.6, 1.36, 0.3), v(0.7, 1.68, 0.2), 0.04, LINEN);
      b.box(v(0.6, 1.33, 0.3), [0.04, 0.04, 0.04], LEATHER);
    },
    pivot: v(0.6, 1.33, 0.3),
    axis: Y,
    amplitude: rad(20),
  }),
  /** 6. L'instrument sur trépied (la longue-vue, la lunette), tourné vers le large, qui pivote de 20°. */
  trepied: (): ToolShape => tripod((b) => beam(b, v(0.75, 1.75, 0.0), v(0.75, 1.75, 0.7), 0.15, BRASS)),
  /** 6 bis. L'appareil sur trépied. */
  appareil: (): ToolShape => tripod((b) => b.box(v(0.75, 1.65, 0.35), [0.35, 0.3, 0.3], LEATHER)),
  /** 6 ter. La girouette sur trépied : une ailette. */
  girouette: (): ToolShape => tripod((b) => b.box(v(0.75, 1.65, 0.5), [0.02, 0.2, 0.3], SIGNAL)),
  /** 6 quater. Le pavillon (le cornet) sur trépied. */
  pavillon: (): ToolShape => tripod((b) => b.prism({ x: 0.75, y: 1.7, z: 0.25, pitch: rad(90) }, 0.05, 0.16, 0.4, 6, BRASS)),
  /** 7. La manivelle sur son bâti (le treuil, la meule, le rouet, le volant) : le bras tourne de −20° à +20°, sans tour complet. */
  manivelle: (): ToolShape => {
    const hub = v(1.03, 0.93, 0.35);
    const tilt = rad(-20);
    const top = v(hub.x, hub.y + 0.4 * Math.cos(tilt), hub.z + 0.4 * Math.sin(tilt));
    return {
      fixed: (b) => {
        b.box(STAND, [0.5, 0.8, 0.4], DARK_WOOD);
        b.box(v(0.75, 0.8, 0.35), [0.5, 0.25, 0.25], IRON);
      },
      mobile: (b) => {
        beam(b, hub, top, 0.06, IRON);
        beam(b, top, v(top.x + 0.2, top.y, top.z), 0.07, WOOD);
      },
      pivot: hub,
      axis: X,
      amplitude: rad(40),
    };
  },
  /** 8. La clé (à molette, d'accord) sur le boulon : elle tourne de 25° depuis l'horizontale, côté main. */
  cle: (): ToolShape => ({
    fixed: (b) => {
      b.box(STAND, [0.4, 1.2, 0.4], DARK_WOOD);
      b.box(v(0.75, 1.2, 0.35), [0.15, 0.15, 0.15], IRON);
    },
    mobile: (b) => {
      beam(b, v(0.75, 1.3, 0.35), v(0.3, 1.3, 0.35), 0.06, IRON);
      b.box(v(0.75, 1.27, 0.35), [0.14, 0.06, 0.14], BRASS);
    },
    pivot: v(0.75, 1.3, 0.35),
    axis: Z,
    amplitude: rad(25),
  }),
  /** 9. Le levier sur socle (l'aiguillage, la presse, le manipulateur) : penché vers l'habitant, il va de 25° en avant. `l` : sa longueur. */
  levier: (l = 0.9): ToolShape => {
    const foot = v(0.75, 0.5, 0.35);
    const top = v(foot.x, foot.y + l * Math.cos(rad(25)), foot.z - l * Math.sin(rad(25)));
    return {
      fixed: (b) => b.box(STAND, [0.4, 0.5, 0.4], DARK_WOOD),
      mobile: (b) => {
        beam(b, foot, top, 0.07, IRON);
        b.box(v(top.x, top.y - 0.06, top.z), [0.12, 0.12, 0.12], SIGNAL);
      },
      pivot: foot,
      axis: X,
      amplitude: rad(25),
    };
  },
  /** 10. La navette sur le cadre (le métier, le cadre à filet) : elle glisse de 0,4 le long des fils. */
  navette: (): ToolShape => ({
    fixed: (b) => {
      beam(b, v(0.3, 0, 0.35), v(0.3, 1.8, 0.35), 0.06, WOOD);
      beam(b, v(1.2, 0, 0.35), v(1.2, 1.8, 0.35), 0.06, WOOD);
      b.box(v(0.75, 1.8, 0.35), [1.0, 0.06, 0.06], WOOD);
      b.box(v(0.75, 1.2, 0.35), [0.9, 0.03, 0.02], LINEN);
    },
    mobile: (b) => b.box({ x: 0.45, y: 1.17, z: 0.4, pitch: rad(90), yaw: rad(90) }, [0.07, 0.3, 0.07], WOOD),
    pivot: v(0.45, 1.2, 0.4),
    axis: X,
    amplitude: 0,
    shift: v(0.4, 0, 0),
  }),
  /** 11. Le drapeau de signal, tenu, levé à 20° de la verticale : la hampe s'abaisse de côté de 30°, sans claquer. */
  drapeau: (): ToolShape => {
    const top = v(HAND.x + 1.2 * Math.sin(rad(20)), HAND.y + 1.2 * Math.cos(rad(20)), HAND.z);
    return {
      fixed: () => {},
      mobile: (b) => {
        beam(b, HAND, top, 0.05, WOOD);
        b.box({ x: top.x + 0.22, y: top.y - 0.35, z: top.z, pitch: 0 }, [0.5, 0.35, 0.02], SIGNAL);
      },
      pivot: HAND,
      axis: Z,
      amplitude: rad(-30),
    };
  },
  /** 12. La cloche sur sa potence : elle se balance doucement de 12°, sans battant. */
  cloche: (): ToolShape => ({
    // La potence au large de l'habitant, la cloche sous le bout de son bras, hors de son manteau.
    fixed: (b) => {
      b.box(v(1.25, 0, 0.35), [0.1, 1.9, 0.1], DARK_WOOD);
      b.box(v(1.0, 1.8, 0.35), [0.5, 0.1, 0.1], DARK_WOOD);
    },
    mobile: (b) => b.prism(v(0.8, 1.45, 0.35), 0.18, 0.07, 0.35, 6, BRASS),
    pivot: v(0.8, 1.8, 0.35),
    axis: X,
    amplitude: rad(12),
  }),
  /** 12 bis. Le gong, un disque octogonal sous la potence. */
  gong: (): ToolShape => ({
    ...TOOL_KIT.cloche(),
    mobile: (b) => b.prism({ x: 0.8, y: 1.3, z: 0.33, pitch: rad(90) }, 0.25, 0.25, 0.04, 8, BRASS),
  }),
  /** 13. La balance : le fléau penche de 10° d'un côté puis de l'autre, ses plateaux avec lui. */
  balance: (): ToolShape => ({
    fixed: (b) => {
      b.box(STAND, [0.4, 0.1, 0.4], DARK_WOOD);
      b.box(v(0.75, 0.1, 0.35), [0.1, 1.4, 0.1], DARK_WOOD);
    },
    mobile: (b) => {
      b.box(v(0.75, 1.475, 0.35), [0.8, 0.05, 0.05], BRASS);
      b.box(v(0.4, 1.2, 0.35), [0.25, 0.03, 0.25], BRASS);
      b.box(v(1.1, 1.2, 0.35), [0.25, 0.03, 0.25], BRASS);
    },
    pivot: v(0.75, 1.5, 0.35),
    axis: Z,
    amplitude: rad(10),
  }),
  /** 14. La louche dans le chaudron : elle se lève de 25° et y revient. */
  louche: (): ToolShape => ({
    fixed: (b) => b.prism(v(0.75, 0.1, 0.35), 0.3, 0.3, 0.5, 6, IRON),
    mobile: (b) => {
      beam(b, v(0.5, 1.3, 0.3), v(0.75, 0.6, 0.35), 0.04, IRON);
      b.box(v(0.75, 0.5, 0.35), [0.15, 0.15, 0.15], IRON);
    },
    pivot: v(0.5, 1.3, 0.3),
    axis: X,
    amplitude: rad(25),
  }),
  /** 14 bis. L'arrosoir au-dessus du bac : il se penche de 25° pour verser. */
  arrosoir: (): ToolShape => ({
    fixed: (b) => b.box(STAND, [0.7, 0.4, 0.5], WOOD),
    mobile: (b) => {
      b.box(v(0.55, 1.0, 0.3), [0.25, 0.25, 0.15], LAGOON);
      b.prism({ x: 0.67, y: 1.15, z: 0.3, pitch: rad(90), yaw: rad(90) }, 0.04, 0.02, 0.3, 4, LAGOON);
    },
    pivot: v(0.55, 1.1, 0.3),
    axis: Z,
    amplitude: rad(-25),
  }),
} satisfies Record<string, (...args: never[]) => ToolShape>;

/** Un outil tenu à long manche, incliné de 25° vers l'avant, la tête au sol (`head`, au pied du manche). */
function longHandle(head: (b: FacetBuilder, foot: Vec3) => void): ToolShape {
  const hand = v(0.55, 1.7, 0.3);
  const foot = v(hand.x, hand.y - 1.6 * Math.cos(rad(25)), hand.z + 1.6 * Math.sin(rad(25)));
  return {
    fixed: () => {},
    mobile: (b) => {
      beam(b, hand, foot, 0.07, WOOD);
      head(b, foot);
    },
    pivot: hand,
    axis: X,
    amplitude: rad(12),
  };
}

/** Un trépied de trois pieds, l'instrument (`top`) à sa tête, qui pivote de 20° autour de la verticale. */
function tripod(top: (b: FacetBuilder) => void): ToolShape {
  const head = v(0.75, 1.6, 0.35);
  return {
    fixed: (b) => {
      for (const a of [0, 120, 240]) beam(b, v(head.x + 0.45 * Math.sin(rad(a)), 0, head.z + 0.45 * Math.cos(rad(a))), head, 0.05, WOOD);
    },
    mobile: top,
    pivot: head,
    axis: Y,
    amplitude: rad(20),
  };
}

/** Les sortes d'outil du kit. */
export type ToolKind = keyof typeof TOOL_KIT;

/** L'outil de chaque habitant (directeur artistique, avec le consultant d'Archipéo, 30 octobre 2026 ; `docs/gameplay/propositions/GD-27.md`). */
export const TOOL_OF: Readonly<Partial<Record<ScenePlaceId, ToolKind>>> = {
  // Le 6e.
  phare: 'cloche',
  quais: 'gaffe',
  filets: 'navette',
  ecluses: 'manivelle',
  saltworks: 'rateau',
  engine: 'pelle',
  shipyard: 'marteau',
  lookout: 'trepied',
  archives: 'pupitre',
  printworks: 'levier',
  mangrove: 'pupitre',
  ruins: 'brosse',
  observatory: 'appareil',
  commons: 'marteau',
  beacons: 'gaffe',
  ferry: 'drapeau',
  // Le 5e.
  montee: 'manivelle',
  croisee: 'manivelle',
  semaphore: 'drapeau',
  gaillard: 'chevalet',
  donjon: 'marteau',
  terrasses: 'manivelle',
  fumerolles: 'girouette',
  nacelles: 'cle',
  hameau: 'pelle',
  auberge: 'louche',
  oracle: 'chevalet',
  // Le 4e.
  forge: 'marteau',
  soute: 'pupitre',
  porte: 'pupitre',
  etalon: 'balance',
  gabarit: 'pupitre',
  manufacture: 'navette',
  loge: 'navette',
  chariot: 'cle',
  herbier: 'arrosoir',
  roches: 'marteau',
  jonction: 'levier',
  veillee: 'balance',
  basilique: 'marteau',
  terminus: 'marteau',
  orgues: 'marteau',
  // Le 3e.
  belvedere: 'trepied',
  grenier: 'manivelle',
  abri: 'girouette',
  jardin: 'pelle',
  fanal: 'manivelle',
  rampe: 'manivelle',
  standard: 'levier',
  kiosque: 'pupitre',
  maquette: 'pupitre',
  tribune: 'cloche',
  douane: 'levier',
  ermitage: 'pupitre',
  coupole: 'pupitre',
  lutherie: 'cle',
  ondes: 'pavillon',
  palais: 'gong',
};

/** L'outil de l'habitant d'un lieu, ou rien (un lieu sans habitant, ou dont le métier n'a pas d'outil décidé). `standard` : le manipulateur, un levier court ; `maquette` : un plan bleu sur le pupitre. */
export function gesteToolOf(place: ScenePlaceId): ToolShape | null {
  const kind = TOOL_OF[place];
  if (!kind) return null;
  if (kind === 'levier') return TOOL_KIT.levier(place === 'standard' ? 0.4 : 0.9);
  if (kind === 'pupitre') return TOOL_KIT.pupitre(place === 'maquette' || place === 'gabarit' ? LAGOON : LINEN);
  return TOOL_KIT[kind]();
}
