// La mer et le lagon du monde continu : un seul plan d'eau au niveau 0, peint par une petite image tirée par le code
// (rien d'importé) : l'eau claire du lagon et des bords, puis le bleu du large à quelques unités de la côte, en paliers
// nets (GD-20, point 3, lot 3, cinquième levier graphique : plus de dégradé). Au-delà de l'image, la couleur du large (le
// bord de l'image) s'étend jusqu'à l'horizon. Les bras de mer (GD-20, point 3, « vraies terres ») ont un cœur d'eau
// profonde, la Nuit océan du pack. L'écume du rivage est dans les tuiles du terrain (./terrain.ts, `FOAM`). Code pur.
import { distance, insidePolygon, smoothstep, type Vec2 } from './geometry';
import { BEACON_MASTS, COAST, COLORS_6E, FERRY_ISLET } from './plan6e';
import { landDistance, straitClearance } from './terrain';

/**
 * L'image de l'eau : son côté en pixels, et le carré du monde qu'elle couvre, centré sur l'origine ; environ un pixel
 * par unité (512, artiste technique 3D), pour que le cœur profond d'un bras de mer, large de quelques unités, s'y lise.
 */
export const SEA_TEXTURE = { size: 512, half: 260 } as const;

/**
 * Le cœur d'un bras de mer : l'eau claire au bord, sur `clear` unités depuis la rive, puis fondue en `fade` vers le
 * bleu du large (ni banc, ni gué).
 */
const STRAIT_DEEP = { clear: 1.5, fade: 2 } as const;

/** La part d'eau claire en un point de l'eau (1 dans le lagon et au ras de la côte, 0 au large et au cœur d'un bras de mer). */
export function shallowness(p: Vec2): number {
  if (insidePolygon(p, COAST)) return 1 - smoothstep(STRAIT_DEEP.clear, STRAIT_DEEP.clear + STRAIT_DEEP.fade, -straitClearance(p));
  // Hors de l'anneau : l'eau claire suit la côte sur trois unités, puis fond vers le large en dix-sept ; de même autour
  // des haut-fonds du large (lot L9) : l'îlot de la Gare maritime et les roches des mâts des Balises.
  let u = smoothstep(-20, -3, landDistance(p));
  u = Math.max(u, smoothstep(FERRY_ISLET.radius + 14, FERRY_ISLET.radius + 3, distance(p, FERRY_ISLET.center)));
  for (const m of BEACON_MASTS) u = Math.max(u, smoothstep(9, 2, distance(p, m)));
  return u;
}

/**
 * Les trois paliers de l'eau (lot 3) : le turquoise clair du lagon et des bords, le Bleu lagon du pack (#178078) au
 * large et sur les épaules des bras de mer, la Nuit océan au cœur des bras de mer seulement, à plus de `heart` unités de
 * leurs rives. La Nuit océan pure du pack (#142B38), sans lumière sur l'eau, se lisait comme un trou
 * noir (essai sur captures ; le mainteneur : jamais assombrir jusqu'au presque-noir) : elle est éclaircie vers le Bleu
 * lagon (#1C5468), au choix du directeur artistique.
 */
export const WATER_TONES = { clear: 0x34bfae, lagoon: COLORS_6E.deepSea, night: 0x1c5468, heart: 3.2 } as const;

/** Le palier de l'eau en un point : le cœur d'un bras de mer, le Bleu lagon de ses épaules et du large, ou l'eau claire. */
export function waterTone(p: Vec2): number {
  if (insidePolygon(p, COAST)) {
    const deep = -straitClearance(p);
    return deep > WATER_TONES.heart ? WATER_TONES.night : deep > STRAIT_DEEP.clear ? WATER_TONES.lagoon : WATER_TONES.clear;
  }
  return shallowness(p) > 0.75 ? WATER_TONES.clear : WATER_TONES.lagoon;
}

const channels = (hex: number) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];

/** Les pixels de l'eau, en rouge, vert, bleu, alpha (sRGB), ligne après ligne du nord au sud. */
export function seaPixels(): Uint8Array {
  const { size, half } = SEA_TEXTURE;
  const out = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++)
    for (let i = 0; i < size; i++) {
      // Le bord de l'image reste au large : la couleur qui s'étend jusqu'à l'horizon.
      const edge = i === 0 || j === 0 || i === size - 1 || j === size - 1;
      const p = { x: -half + ((i + 0.5) * 2 * half) / size, z: -half + ((j + 0.5) * 2 * half) / size };
      const rgb = channels(edge ? WATER_TONES.lagoon : waterTone(p));
      const k = (j * size + i) * 4;
      for (let c = 0; c < 3; c++) out[k + c] = rgb[c];
      out[k + 3] = 255;
    }
  return out;
}
