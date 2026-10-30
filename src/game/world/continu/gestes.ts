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
// reste porté par l'écrit (référent dys). L'équipage dans le monde (piste B, GD-23 lot 4 ; ./equipageMonde.ts) : près de
// l'habitant du premier lieu rallumé qu'il a guidé, l'équipier a son propre outil (`EQUIPIER_TOOL`), et le geste s'y fait
// à tour de rôle (`gesteSlot`) : l'habitant, un repos, l'équipier, un repos ; jamais les deux à la fois. Code pur.
import { SEAT_COLOR, seatFacets, type BodyFrame } from './corps';
import type { Equipier } from './equipage';
import { equipierFrame, type EquipierInWorld } from './equipageMonde';
import { FacetBuilder, type Facets } from './facets';
import { distance, type Vec3 } from './geometry';
import type { PlaceId, ScenePlaceId } from './levelPlan';
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
  /** L'équipier dont c'est l'outil, près de l'habitant de `place` ; absent, c'est l'outil de l'habitant. */
  who?: Equipier;
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
 * Le repère d'un corps (un habitant, un équipier) dans le monde : ses pieds, son cap (le visage vers +z au cap nul), sa
 * hauteur. Sa main droite est à −x dans son repère (il fait face à +z, y en haut) : le kit, coté x vers la droite, est
 * retourné.
 */
function frameAt(frame: BodyFrame): (p: Vec3) => Vec3 {
  const c = Math.cos(frame.yaw),
    s = Math.sin(frame.yaw);
  const k = frame.height / KIT_HEIGHT;
  const { at } = frame;
  return (p) => ({ x: at.x + k * (-p.x * c + p.z * s), y: at.y + k * p.y, z: at.z + k * (p.x * s + p.z * c) });
}

/**
 * Les outils des habitants de `places` (ceux qui en ont un, hors ruine : `withTool` ; dans la ruine, le bloc de l'habitant
 * assis à la place), à leur place dans le monde, dans un seul maillage ; la pièce mobile de chacun au repos, repérée. L'ordre des sommets : pour chaque lieu, sa pièce fixe puis
 * sa pièce mobile. `toolOf` ne sert qu'aux tests, pour poser une forme du kit à un lieu donné ; la scène garde `gesteToolOf`.
 */
export function worldGestes(places: readonly PlaceId[], ground: (x: number, z: number) => number, withTool: (place: ScenePlaceId) => boolean = () => true, toolOf: (place: ScenePlaceId) => ToolShape | null = gesteToolOf, equipage: readonly EquipierInWorld[] = []): WorldGestes {
  const b = new FacetBuilder();
  const mobiles: MobilePiece[] = [];
  let vertices = 0;
  /** Un outil posé dans le repère d'un corps : sa pièce fixe, puis sa pièce mobile, repérée. */
  const placeTool = (tool: ToolShape, frame: BodyFrame, piece: { place: ScenePlaceId; who?: Equipier }) => {
    const put = frameAt(frame);
    const { yaw } = frame;
    const k = frame.height / KIT_HEIGHT;
    const fixed = new FacetBuilder();
    tool.fixed(fixed);
    const mobile = new FacetBuilder();
    tool.mobile(mobile);
    const f = placeIn(fixed.build(), put, yaw);
    const m = placeIn(mobile.build(), put, yaw);
    b.append(f);
    vertices += f.positions.length / 3;
    b.append(m);
    const turn = (v: Vec3): Vec3 => ({ x: -v.x * Math.cos(yaw) + v.z * Math.sin(yaw), y: v.y, z: v.x * Math.sin(yaw) + v.z * Math.cos(yaw) });
    const a = unit(turn(tool.axis));
    // Un repère retourné (x vers la droite devient −x) renverse le sens des rotations : l'amplitude change de signe.
    const sh = tool.shift ? turn(tool.shift) : undefined;
    mobiles.push({ ...piece, start: vertices, count: m.positions.length / 3, pivot: put(tool.pivot), axis: a, amplitude: -tool.amplitude, ...(sh ? { shift: { x: sh.x * k, y: sh.y * k, z: sh.z * k } } : {}) });
    vertices += m.positions.length / 3;
  };
  for (const place of places) {
    if (!hasWorldHabitant(place)) continue;
    if (!withTool(place)) {
      // La ruine : ni outil ni support, mais le bloc où l'habitant est assis (./corps.ts), fixe.
      const at = worldHabitantAt(place, ground);
      if (!at) continue;
      const seat = new FacetBuilder();
      seatFacets(seat, { at, yaw: worldHabitantYaw(place), height: worldHabitantHeight(place) }, SEAT_COLOR);
      const f = seat.build();
      b.append(f);
      vertices += f.positions.length / 3;
      continue;
    }
    const tool = toolOf(place);
    const at = tool && worldHabitantAt(place, ground);
    if (!tool || !at) continue;
    placeTool(tool, { at, yaw: worldHabitantYaw(place), height: worldHabitantHeight(place) }, { place });
  }
  // L'outil de chaque équipier, à sa place près de l'habitant (hors ruine, comme lui), après tous ceux des habitants.
  for (const { equipier, place } of equipage) {
    if (!places.includes(place) || !withTool(place)) continue;
    const frame = equipierFrame(place, ground);
    if (frame) placeTool(TOOL_KIT[EQUIPIER_TOOL[equipier]](), frame, { place, who: equipier });
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
export function activeGeste(here: { x: number; z: number }, candidates: readonly GesteCandidate[], previous: ScenePlaceId | null): ScenePlaceId | null {
  const kept = previous && candidates.find((c) => c.place === previous);
  if (kept && distance(here, kept) <= GESTE_REACH * GESTE_SLACK) return previous;
  let best: ScenePlaceId | null = null;
  let bestD = GESTE_REACH;
  for (const c of candidates) {
    const d = distance(here, c);
    if (d < bestD) {
      best = c.place;
      bestD = d;
    }
  }
  return best;
}

/** Un habitant dont l'outil peut bouger, à la place de ses pieds, posée une fois (`gesteCandidates`), pas à chaque image. */
export interface GesteCandidate {
  place: ScenePlaceId;
  x: number;
  z: number;
  /** L'équipier qui partage le geste à ce lieu, à tour de rôle avec l'habitant (`gesteSlot`) ; absent, l'habitant seul. */
  shared?: Equipier;
}

/** Les candidats du geste, dans l'ordre de `places` (celui du niveau : l'égalité se départage par lui) ; `equipage`, les équipiers à leur lieu. */
export function gesteCandidates(places: readonly ScenePlaceId[], ground: (x: number, z: number) => number, equipage: readonly EquipierInWorld[] = []): GesteCandidate[] {
  const out: GesteCandidate[] = [];
  for (const place of places) {
    const at = worldHabitantAt(place, ground);
    if (!at) continue;
    const shared = equipage.find((e) => e.place === place)?.equipier;
    out.push({ place, x: at.x, z: at.z, ...(shared ? { shared } : {}) });
  }
  return out;
}

/** À qui est le geste à cet instant, et sa part : à l'habitant (`who` nul) ou à l'équipier ; `phase` 0 au repos. */
export interface GesteSlot {
  who: Equipier | null;
  phase: number;
}

/**
 * Le geste à `t` secondes du début, au lieu d'un candidat, écrit dans `out` (rien n'est alloué : la fonction se joue à
 * chaque image) : seul, l'habitant le fait sans fin ; partagé avec un équipier, à tour de rôle, un cycle chacun
 * (`GESTE_CYCLE`) séparé d'un repos (`GESTE_SETTLE`), l'habitant d'abord ; jamais deux corps qui bougent ensemble
 * (référent dys).
 */
export function gesteSlot(t: number, shared: Equipier | undefined, out: GesteSlot): GesteSlot {
  if (!shared) {
    out.who = null;
    out.phase = gestePhase(t);
    return out;
  }
  const turn = GESTE_CYCLE + GESTE_SETTLE;
  const n = Math.floor(t / turn);
  const u = t - n * turn;
  out.who = n % 2 === 0 ? null : shared;
  out.phase = u < GESTE_CYCLE ? gestePhase(u) : 0;
  return out;
}

/** Une face fine dressée dans le plan xy (un fil, une toile), vue des deux côtés, centrée en `c`, de `w` sur `h`. */
function sheet(b: FacetBuilder, c: Vec3, w: number, h: number, color: number): void {
  const x0 = c.x - w / 2, x1 = c.x + w / 2, y0 = c.y - h / 2, y1 = c.y + h / 2;
  b.quad([x0, y0, c.z], [x1, y0, c.z], [x1, y1, c.z], [x0, y1, c.z], color);
  b.quad([x0, y0, c.z], [x0, y1, c.z], [x1, y1, c.z], [x1, y0, c.z], color);
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
/** Le support d'un équipier : devant lui plutôt qu'à côté, pour que l'outil ne soit jamais entre lui et l'habitant (directeur artistique). */
const EQUIPIER_STAND = v(0.4, 0, 0.6);
/** La main qui tient un outil. */
const HAND = v(0.55, 1.6, 0.3);

/** Le côté où pointent la longue-vue et le pavillon : à 60° de qui arrive, vers le large, pour que leur longueur se voie. */
const ASIDE_YAW = rad(60);
const ASIDE = v(Math.sin(ASIDE_YAW), 0, Math.cos(ASIDE_YAW));
const X: Vec3 = v(1, 0, 0);
const Y: Vec3 = v(0, 1, 0);
const Z: Vec3 = v(0, 0, 1);

/**
 * Le kit : quatorze formes et leurs variantes, puis les deux outils des équipiers (directeur artistique, avec le consultant d'Archipéo, 30 octobre 2026 ; retouchées à sa relecture : cloche au large, cadre au large, billot bas, instruments tournés vers le large), boîtes et prismes,
 * de 24 à 60 triangles. L'axe et le sens de chaque mouvement sont choisis pour que la pièce bouge comme le geste le
 * veut (la tête du marteau monte, la clé tourne sur le boulon) ; la pose de repos est l'outil en position de travail.
 */
export const TOOL_KIT = {
  /** 1. Le marteau sur le billot (bas, `block` : bois sombre, ou fer à la Forge) : la tête monte de 30° depuis 0,05 au-dessus du billot, sans jamais le toucher. */
  marteau: (block = DARK_WOOD): ToolShape => ({
    fixed: (b) => b.box(STAND, [0.6, 0.6, 0.6], block),
    mobile: (b) => {
      beam(b, v(0.3, 0.73, 0.35), v(0.9, 0.73, 0.35), 0.08, WOOD);
      b.box(v(0.75, 0.65, 0.35), [0.18, 0.18, 0.4], IRON);
    },
    pivot: v(0.3, 0.73, 0.35),
    axis: Z,
    amplitude: rad(30),
  }),
  /** 2. L'outil à long manche (la pelle, la bêche), tenu, la tête posée au sol, qui avance et recule de 12°. */
  pelle: (): ToolShape => longHandle((b, foot) => b.box({ ...foot, pitch: rad(25) }, [0.35, 0.05, 0.4], IRON)),
  /** 2 bis. La pelle à four (le Hameau) : une pale large et plate, en bois clair. */
  pelleAFour: (): ToolShape => longHandle((b, foot) => b.box({ ...foot, pitch: rad(25) }, [0.4, 0.05, 0.5], WOOD)),
  /** 2 ter. Le râteau (à sel) : une barre et trois dents. */
  rateau: (): ToolShape =>
    longHandle((b, foot) => {
      b.box(foot, [0.6, 0.1, 0.1], WOOD);
      for (const dx of [-0.2, 0, 0.2]) b.box(v(foot.x + dx, foot.y - 0.12, foot.z), [0.04, 0.12, 0.04], WOOD);
    }),
  /** 2 quater. La brosse à long manche. */
  brosse: (): ToolShape => longHandle((b, foot) => b.box(v(foot.x, foot.y - 0.1, foot.z), [0.5, 0.1, 0.15], LINEN)),
  /** 3. La gaffe (`hook` : son crochet au pied de la perche, côté eau) ou la perche de sonde, tenue, penchée vers l'eau, qui va et vient de côté de 10°. */
  gaffe: (hook = true): ToolShape => {
    // Tenue près de sa tête : elle descend devant et au large de l'habitant, sans repasser devant son corps.
    const d = unit(v(0.5, -0.87, 0.5));
    const top = v(HAND.x - d.x * 0.25, HAND.y - d.y * 0.25, HAND.z - d.z * 0.25);
    const foot = v(HAND.x + d.x * 2.15, HAND.y + d.y * 2.15, HAND.z + d.z * 2.15);
    return {
      fixed: () => {},
      mobile: (b) => {
        beam(b, foot, top, 0.07, WOOD);
        if (hook) b.box({ x: foot.x, y: foot.y + 0.05, z: foot.z, pitch: rad(-60) }, [0.05, 0.22, 0.12], IRON);
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
  trepied: (): ToolShape => tripod((b) => beam(b, v(0.75 - 0.35 * ASIDE.x, 1.75, 0.35 - 0.35 * ASIDE.z), v(0.75 + 0.35 * ASIDE.x, 1.75, 0.35 + 0.35 * ASIDE.z), 0.15, BRASS)),
  /** 6 bis. L'appareil sur trépied. */
  appareil: (): ToolShape => tripod((b) => b.box(v(0.75, 1.65, 0.35), [0.35, 0.3, 0.3], LEATHER)),
  /** 6 ter. La girouette sur trépied : une ailette. */
  girouette: (): ToolShape => tripod((b) => b.box(v(0.75, 1.65, 0.5), [0.02, 0.2, 0.3], SIGNAL)),
  /** 6 quater. Le pavillon (le cornet) sur trépied, l'embouchure vers le côté. */
  pavillon: (): ToolShape => tripod((b) => b.prism({ x: 0.75 - 0.25 * ASIDE.x, y: 1.7, z: 0.35 - 0.25 * ASIDE.z, pitch: rad(90), yaw: ASIDE_YAW }, 0.05, 0.22, 0.5, 6, BRASS)),
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
  /** 9. Le levier sur socle (l'aiguillage, la presse ; le manipulateur du Standard, court, sur une table, au pommeau de laiton) : penché vers l'habitant, il va de 25° en avant. `l` : sa longueur ; `base` : la hauteur du socle. */
  levier: (l = 0.9, base = 0.5, knob = SIGNAL): ToolShape => {
    const foot = v(0.75, base, 0.35);
    const top = v(foot.x, foot.y + l * Math.cos(rad(25)), foot.z - l * Math.sin(rad(25)));
    return {
      fixed: (b) => b.box(STAND, [0.4, base, 0.4], DARK_WOOD),
      mobile: (b) => {
        beam(b, foot, top, 0.07, IRON);
        b.box(v(top.x, top.y - 0.06, top.z), [0.12, 0.12, 0.12], knob);
      },
      pivot: foot,
      axis: X,
      amplitude: rad(25),
    };
  },
  /** 10. La navette sur le cadre (le métier, le cadre à filet ; `cloth` : une toile pleine à la Loge, au lieu des trois fils) : elle glisse de 0,4 le long des fils, au large du corps. */
  navette: (cloth = false): ToolShape => ({
    fixed: (b) => {
      beam(b, v(0.6, 0, 0.35), v(0.6, 1.8, 0.35), 0.06, WOOD);
      beam(b, v(1.5, 0, 0.35), v(1.5, 1.8, 0.35), 0.06, WOOD);
      b.box(v(1.05, 1.8, 0.35), [1.0, 0.06, 0.06], WOOD);
      // Les fils et la toile en faces fines à deux côtés (pas en pavés) : le cadre tient dans les 60 triangles.
      if (cloth) sheet(b, v(1.05, 0.6, 0.35), 0.84, 0.55, LINEN);
      else for (const y of [1.0, 1.2, 1.4]) sheet(b, v(1.05, y, 0.35), 0.9, 0.03, LINEN);
    },
    mobile: (b) => b.box({ x: 0.75, y: 1.17, z: 0.4, pitch: rad(90), yaw: rad(90) }, [0.07, 0.3, 0.07], WOOD),
    pivot: v(0.75, 1.2, 0.4),
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
      b.box(v(0.75, 0, 0.35), [0.1, 1.9, 0.1], DARK_WOOD);
      b.box(v(0.975, 1.8, 0.35), [0.55, 0.1, 0.1], DARK_WOOD);
    },
    mobile: (b) => b.prism(v(1.15, 1.45, 0.35), 0.18, 0.07, 0.35, 6, BRASS),
    pivot: v(1.15, 1.8, 0.35),
    axis: X,
    amplitude: rad(12),
  }),
  /** 12 bis. Le gong, un disque octogonal sous la potence. */
  gong: (): ToolShape => ({
    ...TOOL_KIT.cloche(),
    mobile: (b) => b.prism({ x: 1.15, y: 1.3, z: 0.33, pitch: rad(90) }, 0.25, 0.25, 0.04, 8, BRASS),
  }),
  /** 13. La balance, au large du corps (son plateau intérieur à 0,65) : le fléau penche de 10° d'un côté puis de l'autre, ses plateaux avec lui. */
  balance: (): ToolShape => ({
    fixed: (b) => {
      b.box(v(1.0, 0, 0.35), [0.4, 0.1, 0.4], DARK_WOOD);
      b.box(v(1.0, 0.1, 0.35), [0.1, 1.4, 0.1], DARK_WOOD);
    },
    mobile: (b) => {
      b.box(v(1.0, 1.475, 0.35), [0.8, 0.05, 0.05], BRASS);
      b.box(v(0.65, 1.2, 0.35), [0.25, 0.03, 0.25], BRASS);
      b.box(v(1.35, 1.2, 0.35), [0.25, 0.03, 0.25], BRASS);
    },
    pivot: v(1.0, 1.5, 0.35),
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
  /**
   * 15. L'écrou (Zia) : un poteau de fer fin, haut jusqu'à la main, coiffé d'un gros écrou de laiton ; la clé, longue,
   * posée sur l'écrou et tenue sous la main, tourne de 25° autour de lui (directeur artistique, seconde passe : à hauteur
   * de main, jamais au genou).
   */
  ecrou: (): ToolShape => ({
    fixed: (b) => {
      b.box(EQUIPIER_STAND, [0.24, 1.45, 0.24], IRON);
      b.box(v(EQUIPIER_STAND.x, 1.45, EQUIPIER_STAND.z), [0.24, 0.12, 0.24], BRASS);
    },
    mobile: (b) => {
      // Le manche part vers le large et vers qui arrive, pour se voir hors de la main (directeur artistique, 3e passe :
      // vers l'arrière, l'angle de vue et le geste le raccourcissaient).
      beam(b, v(EQUIPIER_STAND.x, 1.57, EQUIPIER_STAND.z), v(EQUIPIER_STAND.x + 0.46, 1.57, EQUIPIER_STAND.z + 0.17), 0.08, IRON);
      b.box(v(EQUIPIER_STAND.x, 1.56, EQUIPIER_STAND.z), [0.2, 0.08, 0.16], IRON);
    },
    pivot: v(EQUIPIER_STAND.x, 1.57, EQUIPIER_STAND.z),
    axis: Y,
    amplitude: rad(25),
  }),
  /**
   * 16. Le registre (Malo) : un pupitre de bois au plateau incliné de 15° vers qui arrive, à hauteur de main, le registre
   * ouvert dessus (deux pages de lin, un dos de bois sombre) ; une feuille tenue au-dessus descend vers la page, sans
   * la toucher (directeur artistique, seconde passe : lisible de loin, les pages larges).
   */
  registre: (): ToolShape => {
    // Le plateau un peu plus au large que le pied, pour ne jamais passer devant le corps (règle du kit).
    const c = v(EQUIPIER_STAND.x + 0.1, 1.35, EQUIPIER_STAND.z);
    const page = (dx: number, y: number, w: number, d: number, color: number, b: FacetBuilder) => b.box({ x: c.x + dx, y, z: c.z, pitch: rad(15) }, [w, 0.03, d], color);
    return {
      fixed: (b) => {
        b.box(EQUIPIER_STAND, [0.16, 1.2, 0.16], WOOD);
        b.box({ x: c.x, y: c.y, z: c.z, pitch: rad(15) }, [0.5, 0.05, 0.56], WOOD);
        page(-0.13, 1.39, 0.22, 0.48, LINEN, b);
        page(0.13, 1.39, 0.22, 0.48, LINEN, b);
        page(0, 1.4, 0.05, 0.5, DARK_WOOD, b);
      },
      mobile: (b) => page(0.13, 1.62, 0.22, 0.4, LINEN, b),
      pivot: v(c.x + 0.13, 1.62, c.z),
      axis: X,
      amplitude: 0,
      shift: v(0, -0.17, 0),
    };
  },
} satisfies Record<string, (...args: never[]) => ToolShape>;

/** L'outil de chaque équipier dans le monde (directeur artistique, avec le consultant d'Archipéo : la mécanicienne serre un écrou, l'archiviste range ses feuilles). */
export const EQUIPIER_TOOL: Readonly<Record<Equipier, ToolKind>> = { zia: 'ecrou', malo: 'registre' };

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

/** Les sortes d'outil du kit (les deux dernières, celles des équipiers). */
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
  beacons: 'gaffe', // La perche de sonde, sans crochet (directeur artistique) ; le crochet reste aux Quais.
  ferry: 'drapeau',
  // Le 5e.
  montee: 'manivelle',
  croisee: 'navette',
  radeaux: 'balance',
  instants: 'marteau',
  etuve: 'manivelle',
  semaphore: 'drapeau',
  gaillard: 'chevalet',
  donjon: 'marteau',
  terrasses: 'manivelle',
  fumerolles: 'girouette',
  nacelles: 'cle',
  hameau: 'pelleAFour',
  auberge: 'louche',
  oracle: 'chevalet',
  // Le 4e.
  forge: 'marteau',
  soute: 'pupitre',
  porte: 'pupitre',
  etalon: 'balance',
  gabarit: 'pupitre',
  manufacture: 'navette',
  loge: 'navette', // Une toile pleine : la couture, pas le tissage de la Manufacture.
  chariot: 'cle',
  dynamo: 'cle',
  herbier: 'arrosoir',
  roches: 'pupitre',
  jonction: 'levier',
  veillee: 'balance',
  basilique: 'marteau',
  terminus: 'manivelle',
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

/**
 * L'outil de l'habitant d'un lieu, ou rien (un lieu sans habitant, ou dont le métier n'a pas d'outil décidé). Les
 * variantes (directeur artistique) : au Standard, le manipulateur, un levier court sur une table, au pommeau de laiton ;
 * à la Maquette et au Gabarit, un plan bleu sur le pupitre ; à la Forge, le billot de fer ; aux Balises, la perche sans
 * crochet ; à la Loge, la toile pleine sur le cadre.
 */
export function gesteToolOf(place: ScenePlaceId): ToolShape | null {
  const kind = TOOL_OF[place];
  if (!kind) return null;
  if (kind === 'levier') return place === 'standard' ? TOOL_KIT.levier(0.4, 1.0, BRASS) : TOOL_KIT.levier();
  if (kind === 'pupitre') return TOOL_KIT.pupitre(place === 'maquette' || place === 'gabarit' ? LAGOON : LINEN);
  if (kind === 'marteau') return TOOL_KIT.marteau(place === 'forge' ? IRON : DARK_WOOD);
  if (kind === 'gaffe') return TOOL_KIT.gaffe(place !== 'beacons');
  if (kind === 'navette') return TOOL_KIT.navette(place === 'loge');
  return TOOL_KIT[kind]();
}
