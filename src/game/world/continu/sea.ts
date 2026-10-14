// La mer et le lagon du monde continu : un seul plan d'eau au niveau 0, peint par une petite image tirée par le code
// (rien d'importé) : l'eau claire du lagon et des bords, qui fond vers le bleu du large à quelques unités de la côte.
// Au-delà de l'image, la couleur du large (le bord de l'image) s'étend jusqu'à l'horizon. Code pur.
import { insidePolygon, smoothstep, type Vec2 } from './geometry';
import { COAST, COLORS_6E } from './plan6e';
import { landDistance } from './terrain';

/** L'image de l'eau : son côté en pixels, et le carré du monde qu'elle couvre, centré sur l'origine. */
export const SEA_TEXTURE = { size: 128, half: 64 } as const;

/** La part d'eau claire en un point de l'eau (1 dans le lagon et au ras de la côte, 0 au large). */
export function shallowness(p: Vec2): number {
  if (insidePolygon(p, COAST)) return 1;
  // Hors de l'anneau : l'eau claire suit la côte sur deux unités, puis fond vers le large en huit.
  return smoothstep(-10, -2, landDistance(p));
}

const channels = (hex: number) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];

/** Les pixels de l'eau, en rouge, vert, bleu, alpha (sRGB), ligne après ligne du nord au sud. */
export function seaPixels(): Uint8Array {
  const { size, half } = SEA_TEXTURE;
  const deep = channels(COLORS_6E.deepSea);
  const clear = channels(COLORS_6E.lagoon);
  const out = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++)
    for (let i = 0; i < size; i++) {
      // Le bord de l'image reste au large : la couleur qui s'étend jusqu'à l'horizon.
      const edge = i === 0 || j === 0 || i === size - 1 || j === size - 1;
      const p = { x: -half + ((i + 0.5) * 2 * half) / size, z: -half + ((j + 0.5) * 2 * half) / size };
      const u = edge ? 0 : shallowness(p);
      const k = (j * size + i) * 4;
      for (let c = 0; c < 3; c++) out[k + c] = Math.round(deep[c] + (clear[c] - deep[c]) * u);
      out[k + 3] = 255;
    }
  return out;
}
