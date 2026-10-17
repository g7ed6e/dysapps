// La lumière et le ciel du monde continu (GD-20, point 3, lot 3, premier levier graphique ; décision du mainteneur du 17
// octobre 2026) : une ambiance plus basse et plus froide, un soleil chaud plus bas, à l'est (le matin clair du 6e), et
// un dôme de ciel en dégradé, crème à l'horizon, bleu en haut ; la brume du lointain prend la couleur de l'horizon, où
// la mer et le ciel se rejoignent. Rien n'y bouge. Code pur : la vue (three/archipeo/scene.ts) donne ces nombres à
// Three.js.
import { linearRgb } from './geometry';

/**
 * Les couleurs du ciel (sRGB), de l'horizon au zénith, à leur hauteur angulaire (degrés au-dessus de l'horizon) : la
 * crème de la planche à l'horizon, puis un bleu pâle, jamais saturé (aucun texte ne se lit sur le ciel, mais la marque du
 * lieu suivant s'y pose).
 */
const SKY_STOPS: readonly { at: number; color: number }[] = [
  { at: 0, color: 0xefe9d6 },
  { at: 6, color: 0xe6e9dc },
  { at: 18, color: 0xcfe2e6 },
  { at: 40, color: 0xaed3e3 },
  { at: 90, color: 0x9cc9df },
];

/** La couleur de l'horizon : celle de la brume du lointain (le brouillard), du fond de la scène et du bas du dôme. */
export const HORIZON_COLOR = SKY_STOPS[0].color;

/**
 * La lumière (artiste technique 3D ; à valider sur captures par le directeur artistique) : le ciel froid et le sol
 * vert renvoyé (`HemisphereLight`), plus bas qu'avant (1,35 au lieu de 1,5) ; le soleil chaud, plus fort et plus bas (environ 33° au
 * lieu de 47°), à l'est-sud-est : les pentes au soleil s'éclairent, les autres gardent leur couleur, plus sombre, jamais
 * presque noire (l'ambiance seule en donne encore le tiers). Le mappage des tons neutre de Three.js adoucit les blancs.
 */
export const LIGHT = {
  sky: 0xdde8e6,
  ground: 0x8e9a7c,
  ambient: 1.35,
  sun: 0xfff0d8,
  sunIntensity: 2.9,
  /** D'où vient le soleil (une direction, pas une place). */
  sunFrom: { x: 52, y: 40, z: 34 },
  exposure: 1,
} as const;

/** Le sens où tombent les ombres peintes, au sol (l'opposé du soleil, à plat, d'une unité). */
export const SHADOW_DIR = (() => {
  const l = Math.hypot(LIGHT.sunFrom.x, LIGHT.sunFrom.z);
  return { x: -LIGHT.sunFrom.x / l, z: -LIGHT.sunFrom.z / l };
})();

/** La couleur du ciel à une hauteur angulaire (degrés ; sous l'horizon, l'horizon), en rouge, vert, bleu linéaires. */
export function skyColorAt(elevation: number): [number, number, number] {
  const e = Math.max(0, Math.min(90, elevation));
  let k = 0;
  while (k < SKY_STOPS.length - 2 && e > SKY_STOPS[k + 1].at) k++;
  const a = SKY_STOPS[k];
  const b = SKY_STOPS[k + 1];
  const t = (e - a.at) / (b.at - a.at);
  const ca = linearRgb(a.color);
  const cb = linearRgb(b.color);
  return [ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t];
}

/** Le dôme du ciel : ses côtés, et les hauteurs angulaires de ses rangs (un rang à chaque couleur, un sous l'horizon). */
export const SKY_DOME = { sides: 16, rows: [-30, 0, 6, 18, 40, 65, 90] } as const;

/** Un dôme : trois sommets par triangle, et leurs couleurs (linéaires). */
export interface SkyDome {
  positions: Float32Array;
  colors: Float32Array;
  triangles: number;
}

/**
 * Le dôme du ciel, de rayon `radius`, centré sur la caméra par la vue : un dégradé par sommet (le seul du monde : le
 * ciel n'est pas une facette), sans lumière ni brouillard, vu des deux côtés.
 */
export function skyDome(radius: number): SkyDome {
  const { sides, rows } = SKY_DOME;
  const pos: number[] = [];
  const col: number[] = [];
  const vertex = (row: number, k: number) => {
    const e = (rows[row] * Math.PI) / 180;
    const a = (2 * Math.PI * k) / sides;
    return [radius * Math.cos(e) * Math.cos(a), radius * Math.sin(e), radius * Math.cos(e) * Math.sin(a)] as const;
  };
  const push = (row: number, k: number) => {
    pos.push(...vertex(row, k));
    col.push(...skyColorAt(rows[row]));
  };
  for (let r = 0; r < rows.length - 1; r++)
    for (let k = 0; k < sides; k++) {
      const n = (k + 1) % sides;
      if (r + 1 === rows.length - 1) {
        // Le dernier rang est un point (le zénith) : un seul triangle par côté.
        push(r, k);
        push(r + 1, k);
        push(r, n);
        continue;
      }
      push(r, k);
      push(r + 1, k);
      push(r + 1, n);
      push(r, k);
      push(r + 1, n);
      push(r, n);
    }
  const positions = new Float32Array(pos);
  return { positions, colors: new Float32Array(col), triangles: positions.length / 9 };
}
