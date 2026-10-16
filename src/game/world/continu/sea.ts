// La mer et le lagon du monde continu : un seul plan d'eau au niveau 0, peint par une petite image tirée par le code
// (rien d'importé) : l'eau claire du lagon et des bords, qui fond vers le bleu du large à quelques unités de la côte.
// Au-delà de l'image, la couleur du large (le bord de l'image) s'étend jusqu'à l'horizon. Code pur.
import { distance, insidePolygon, smoothstep, type Vec2 } from './geometry';
import { BEACON_MASTS, COAST, COLORS_6E, FERRY_ISLET } from './plan6e';
import { landDistance } from './terrain';

/** L'image de l'eau : son côté en pixels, et le carré du monde qu'elle couvre, centré sur l'origine. */
export const SEA_TEXTURE = { size: 256, half: 260 } as const;

/** La part d'eau claire en un point de l'eau (1 dans le lagon et au ras de la côte, 0 au large). */
export function shallowness(p: Vec2): number {
  if (insidePolygon(p, COAST)) return 1;
  // Hors de l'anneau : l'eau claire suit la côte sur trois unités, puis fond vers le large en dix-sept ; de même autour
  // des haut-fonds du large (lot L9) : l'îlot de la Gare maritime et les roches des mâts des Balises.
  let u = smoothstep(-20, -3, landDistance(p));
  u = Math.max(u, smoothstep(FERRY_ISLET.radius + 14, FERRY_ISLET.radius + 3, distance(p, FERRY_ISLET.center)));
  for (const m of BEACON_MASTS) u = Math.max(u, smoothstep(9, 2, distance(p, m)));
  return u;
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
