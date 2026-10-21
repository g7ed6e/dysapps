// La couleur d'une face telle qu'on la voit à l'écran, sous la lumière du 5e : pour vérifier qu'une teinte ne sort jamais
// saturée au soleil (la brique du Donjon, lot 13a ; les panneaux peints de l'Oracle, lot 13b). Code pur, sans Three.js.
import { linearRgb } from './geometry';
import { LIGHT_5E } from './sky';

/** Une couleur en teinte, saturation et clarté (HSL, de 0 à 1). */
export function hsl(color: number): { s: number; l: number } {
  const [r, g, b] = [(color >> 16) & 255, (color >> 8) & 255, color & 255].map((v) => v / 255);
  const [hi, lo] = [Math.max(r, g, b), Math.min(r, g, b)];
  const l = (hi + lo) / 2;
  return { s: hi === lo ? 0 : (hi - lo) / (1 - Math.abs(2 * l - 1)), l };
}

/**
 * La couleur d'une face à l'écran, sous la lumière du 5e (`LIGHT_5E`), comme la rend Three.js : le Lambert du soleil et
 * du ciel renvoyé (hémisphère), l'exposition, le mappage des tons neutre (`NeutralToneMapping`), puis sRGB ; au-dessus de
 * la lumière par la hauteur, sans brouillard. `color` en rouge, vert, bleu linéaires ; `n`, la normale de la face.
 */
export function rendered5e(color: readonly number[], n: readonly number[]): number {
  const L = LIGHT_5E;
  const [sky, ground, sun] = [linearRgb(L.sky), linearRgb(L.ground), linearRgb(L.sun)];
  const d = Math.hypot(L.sunFrom.x, L.sunFrom.y, L.sunFrom.z);
  const ndl = Math.max(0, (n[0] * L.sunFrom.x + n[1] * L.sunFrom.y + n[2] * L.sunFrom.z) / d);
  const w = 0.5 * n[1] + 0.5;
  let c = color.map((v, i) => ((v / Math.PI) * (ndl * sun[i] * L.sunIntensity + (ground[i] + (sky[i] - ground[i]) * w) * L.ambient)) * L.exposure);
  const x = Math.min(...c);
  const offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  c = c.map((v) => v - offset);
  const peak = Math.max(...c);
  if (peak >= 0.76) {
    const np = 1 - 0.24 ** 2 / (peak + 0.24 - 0.76);
    const g = 1 - 1 / (0.15 * (peak - np) + 1);
    c = c.map((v) => (v * np) / peak * (1 - g) + np * g);
  }
  const srgb = c.map((v) => Math.round(255 * Math.min(1, v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)));
  return (srgb[0] << 16) | (srgb[1] << 8) | srgb[2];
}
