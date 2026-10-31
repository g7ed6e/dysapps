// Le corps qui travaille (GD-27, lot 5, piste B ; l'histoire du choix dans docs/gameplay/propositions/GD-27.md). Sans
// squelette : les sommets de la version de loin d'un habitant, déjà mis à sa place dans le monde (./worldHabitants.ts),
// sont déformés sommet par sommet, comme la pièce mobile de son outil (./gestes.ts). Au geste, le buste tourne autour des
// hanches vers l'avant (`BEND`), la tête à peine plus basse, et le bras droit se lève vers l'outil (`ARM`) ; dans la
// ruine, l'habitant est assis (`seatedBody`), les cuisses à l'horizontale, les pieds au sol, sur un bloc bas aux arêtes
// coupées (`seatFacets`), gris pierre à tous les niveaux. Les régions (hanches, genoux, épaules, bras) se lisent par la
// hauteur et la largeur du modèle, avec un fondu entre elles pour ne rien déchirer. Zéro triangle, zéro appel : seul
// l'habitant actif bouge, et la boîte du toucher ne lit pas le maillage. Code pur, sans allocation au geste.
import { FacetBuilder } from './facets';
import { smoothstep, type Vec3 } from './geometry';

/** Le repère d'un habitant dans le monde : ses pieds, son cap (le visage vers +z au cap nul) et sa hauteur. */
export interface BodyFrame {
  at: Vec3;
  yaw: number;
  height: number;
}

/** Les hauteurs des articulations, en part de la hauteur de l'habitant (modèles remaillés, directeur artistique). */
export const KNEE = 0.26;
export const HIP = 0.48;
export const SHOULDER = 0.78;
/** La demi-hauteur du fondu entre deux régions, en part de la hauteur. */
const BLEND = 0.04;
/** L'épaule droite, au large de l'axe du corps, en part de la hauteur. */
const SHOULDER_HALF = 0.17;
/** La bande de hauteur où se lit la largeur du tronc (la poitrine), en part de la hauteur. */
const CHEST_BAND = { from: 0.6, to: 0.75 } as const;
/** Le bras : les sommets au-delà de cette part de la plus grande demi-largeur du tronc (fondu entre les deux bornes). */
const ARM_OUTER = { from: 0.55, to: 0.75 } as const;
/** Le bras commence aux hanches (fondu de `from` à `to`, en part de la hauteur) : rien sous les hanches, la jupe et le tablier restent. */
const ARM_LOW = { from: HIP - 0.02, to: HIP + 0.06 } as const;
/** Le bras finit un peu au-dessus de l'épaule (fondu). */
const ARM_HIGH = { from: SHOULDER + 0.02, to: SHOULDER + 0.08 } as const;

/** Le buste penché au bout du geste (15° au plus, directeur artistique) et le bras droit levé vers l'outil. */
export const BEND = (15 * Math.PI) / 180;
export const ARM = (25 * Math.PI) / 180;

/** La demi-largeur de la boîte du toucher d'un habitant, debout et assis (les jambes avancent), en unités du monde. */
export const TOUCH_HALF = { standing: 0.5, seated: 0.8 } as const;

/**
 * Le bloc où l'habitant s'assoit dans la ruine : le gris des Gardiens de pierre, une pierre, à tous les niveaux
 * (directeur artistique, à l'essai : la teinte du sol faisait un buisson).
 */
export const SEAT_COLOR = 0x8e8c84;
/** Le bloc : un prisme à huit côtés, 24 triangles (sous les 60 d'un outil, que la ruine ne montre pas). */
export const SEAT_TRIANGLES = 24;
const SEAT_SIDES = 8;
/** Le bloc, en part de la hauteur de l'habitant : son rayon au sol, en haut, et son recul derrière la ligne des hanches. */
const SEAT = { bottom: 0.26, top: 0.22, back: 0.12 } as const;

/** Les poids d'un sommet : sa part dans le buste qui penche (`bend`) et dans le bras droit qui se lève (`arm`). */
export interface BodyWeights {
  bend: Float32Array;
  arm: Float32Array;
}

/**
 * Les axes du repère dans le monde : devant (`f`), la droite de l'habitant (`r`, le côté de son outil : la main droite
 * du modèle est à −x dans son repère, comme dans `habitantFrame` de ./gestes.ts).
 */
function axes(frame: BodyFrame): { f: Vec3; r: Vec3 } {
  const c = Math.cos(frame.yaw), s = Math.sin(frame.yaw);
  return { f: { x: s, y: 0, z: c }, r: { x: -c, y: 0, z: s } };
}

/**
 * Les poids de chaque sommet de `rest` (les sommets mis en place dans le monde, trois nombres chacun), lus une fois. Le
 * buste : de 0 sous les hanches à 1 au-dessus, en fondu. Le bras droit : des hanches à l'épaule, les sommets au large
 * du tronc, du côté droit (la largeur du tronc lue sur le modèle : la plus grande demi-largeur à hauteur de poitrine,
 * dont le bras occupe le dehors).
 */
export function bodyWeights(rest: Float32Array, frame: BodyFrame): BodyWeights {
  const n = rest.length / 3;
  const bend = new Float32Array(n);
  const arm = new Float32Array(n);
  const { r } = axes(frame);
  const h = frame.height;
  let widest = 0;
  for (let i = 0; i < n; i++) {
    const y = (rest[i * 3 + 1] - frame.at.y) / h;
    if (y < CHEST_BAND.from || y > CHEST_BAND.to) continue;
    widest = Math.max(widest, Math.abs((rest[i * 3] - frame.at.x) * r.x + (rest[i * 3 + 2] - frame.at.z) * r.z) / h);
  }
  for (let i = 0; i < n; i++) {
    const y = (rest[i * 3 + 1] - frame.at.y) / h;
    bend[i] = smoothstep(HIP - BLEND, HIP + BLEND, y);
    const lat = ((rest[i * 3] - frame.at.x) * r.x + (rest[i * 3 + 2] - frame.at.z) * r.z) / h;
    const band = smoothstep(ARM_LOW.from, ARM_LOW.to, y) * (1 - smoothstep(ARM_HIGH.from, ARM_HIGH.to, y));
    arm[i] = widest > 0 ? band * smoothstep(ARM_OUTER.from * widest, ARM_OUTER.to * widest, lat) : 0;
    // Le bras suit le buste tout entier (l'épaule bouge avec lui), même sa main sous les hanches.
    bend[i] = Math.max(bend[i], arm[i]);
  }
  return { bend, arm };
}

/**
 * Tourne le point (`px`, `py`, `pz`) autour de l'axe horizontal unitaire (`ax`, 0, `az`) passant par le pivot (`cx`,
 * `cy`, `cz`), de `angle`, dans `out` à l'indice `k` (la formule de Rodrigues, l'axe sans composante verticale).
 */
function rotateInto(out: Float32Array, k: number, px: number, py: number, pz: number, cx: number, cy: number, cz: number, ax: number, az: number, angle: number): void {
  const c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
  const x = px - cx, y = py - cy, z = pz - cz;
  out[k] = cx + (c + ax * ax * t) * x - az * s * y + ax * az * t * z;
  out[k + 1] = cy + az * s * x + c * y - ax * s * z;
  out[k + 2] = cz + ax * az * t * x + ax * s * y + (c + az * az * t) * z;
}

/**
 * Le corps à la part `phase` de son geste (0 : au repos, 1 : au bout) : les sommets de `rest` écrits dans `out`
 * (même forme) à partir de l'indice `start` (trois nombres par sommet), et rien hors de ce tronçon. Le buste tourne
 * autour de la ligne des hanches, vers l'avant, du poids de chaque sommet ; le bras droit tourne autour de l'épaule
 * droite, vers l'avant, de son poids. Rien n'est alloué : la fonction se joue à chaque image.
 */
export function workBody(rest: Float32Array, out: Float32Array, start: number, frame: BodyFrame, w: BodyWeights, phase: number): void {
  const h = frame.height;
  // La droite de l'habitant (`axes`), et l'axe des hanches, vers sa gauche : une rotation positive penche le haut vers
  // l'avant (un test le relit).
  const rx = -Math.cos(frame.yaw), rz = Math.sin(frame.yaw);
  const ax = -rx, az = -rz;
  const hx = frame.at.x, hy = frame.at.y + HIP * h, hz = frame.at.z;
  // L'épaule droite suit le buste : tournée de la même rotation, une fois ; `out` sert de tampon, réécrit juste après.
  rotateInto(out, start, hx + rx * SHOULDER_HALF * h, frame.at.y + SHOULDER * h, hz + rz * SHOULDER_HALF * h, hx, hy, hz, ax, az, BEND * phase);
  const sx = out[start], sy = out[start + 1], sz = out[start + 2];
  const n = rest.length / 3;
  for (let i = 0; i < n; i++) {
    const k = i * 3;
    const o = start + k;
    const b = w.bend[i] * BEND * phase;
    if (b === 0) {
      out[o] = rest[k];
      out[o + 1] = rest[k + 1];
      out[o + 2] = rest[k + 2];
    } else rotateInto(out, o, rest[k], rest[k + 1], rest[k + 2], hx, hy, hz, ax, az, b);
    // Le bras pend sous l'épaule : la rotation inverse de celle du buste le lève vers l'avant.
    const a = -w.arm[i] * ARM * phase;
    if (a !== 0) rotateInto(out, o, out[o], out[o + 1], out[o + 2], sx, sy, sz, ax, az, a);
  }
}

/** La hauteur d'un habitant assis (ses pieds à sa tête). */
export const seatedHeight = (height: number): number => height * (1 - (HIP - KNEE));

/**
 * L'habitant assis (la ruine) : un nouveau tableau. Le haut du corps descend de la longueur des cuisses, les cuisses
 * tournent à l'horizontale vers l'avant depuis les hanches, les jambes avancent d'autant, les pieds restent au sol ; un
 * fondu aux hanches et aux genoux.
 */
export function seatedBody(rest: Float32Array, frame: BodyFrame): Float32Array {
  const { f, r } = axes(frame);
  const h = frame.height;
  const thigh = (HIP - KNEE) * h;
  const out = new Float32Array(rest.length);
  for (let k = 0; k < rest.length; k += 3) {
    const dx = rest[k] - frame.at.x, dy = rest[k + 1] - frame.at.y, dz = rest[k + 2] - frame.at.z;
    const fwd = dx * f.x + dz * f.z;
    const lat = dx * r.x + dz * r.z;
    const y = dy / h;
    const wUp = smoothstep(HIP - BLEND, HIP + BLEND, y);
    const wLeg = 1 - smoothstep(KNEE - BLEND, KNEE + BLEND, y);
    const wThigh = Math.max(0, 1 - wUp - wLeg);
    // Le haut : descendu ; la cuisse : tournée d'un quart de tour vers l'avant autour des hanches ; la jambe : avancée.
    const up = { fwd, y: dy - thigh };
    const th = { fwd: HIP * h - dy, y: KNEE * h + fwd };
    const leg = { fwd: fwd + thigh, y: dy };
    const F = wUp * up.fwd + wThigh * th.fwd + wLeg * leg.fwd;
    const Y = wUp * up.y + wThigh * th.y + wLeg * leg.y;
    out[k] = frame.at.x + f.x * F + r.x * lat;
    out[k + 1] = frame.at.y + Y;
    out[k + 2] = frame.at.z + f.z * F + r.z * lat;
  }
  return out;
}

/** Le bloc sous l'habitant assis : un prisme bas à huit côtés, à hauteur de genou, un peu en arrière de la ligne des hanches. */
export function seatFacets(b: FacetBuilder, frame: BodyFrame, color: number): void {
  const { f } = axes(frame);
  const h = frame.height;
  const back = SEAT.back * h;
  b.prism({ x: frame.at.x - f.x * back, y: frame.at.y, z: frame.at.z - f.z * back, yaw: frame.yaw + Math.PI / SEAT_SIDES }, SEAT.bottom * h, SEAT.top * h, KNEE * h, SEAT_SIDES, color);
}
