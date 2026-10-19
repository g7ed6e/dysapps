// La mer et le lagon du monde continu : un seul plan d'eau au niveau 0, peint par une petite image tirée par le code
// (rien d'importé) : l'eau claire du lagon et des bords, puis le bleu du large à quelques unités de la côte, en paliers
// nets (GD-20, point 3, lot 3, cinquième levier graphique : plus de dégradé). L'image ne porte pas les couleurs mais trois
// champs (reprise du lot 3) : la vue tranche net sur leur ligne zéro, et le bord de chaque palier est lisse. Au-delà de l'image, la couleur du large (le
// bord de l'image) s'étend jusqu'à l'horizon. Les bras de mer (GD-20, point 3, « vraies terres ») ont un cœur d'eau
// profonde, la Nuit océan du pack. L'écume du rivage est dans les tuiles du terrain (./terrain.ts, `FOAM`). Code pur.
import { distance, insidePolygon, smoothstep, type Vec2 } from './geometry';
import { BEACON_MASTS, COAST, COLORS_6E, FERRY_ISLET, PATH_NODES, STRAITS } from './plan6e';
import { COAST_5E, COLORS_5E } from './plan5e';
import { landDistance, straitClearance } from './terrain';
import { channelClearance, landDistance5e } from './terrain5e';

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
 * Les trois paliers de l'eau (lot 3 ; reprise d'après la relecture du directeur artistique et du consultant) : le
 * turquoise clair (#5CC3B5, plus clair et moins saturé qu'avant) réservé au lagon fermé et à une bande de bord autour de
 * l'anneau ; un palier franc vers le Bleu lagon du pack (#178078) au large et sur les épaules des bras de mer ; la Nuit
 * océan au cœur des bras de mer seulement, à plus de `heart` unités de leurs rives et, au-delà de `reach` unités du
 * pont, de plus en plus étroit (`taper` par unité, sa profondeur bornée à `cap`) : un cœur court, d'un seul tenant,
 * centré sur le pont, qu'aucun évasement du bras ne prolonge. La Nuit océan pure du pack
 * (#142B38) se lisait comme un trou noir (le mainteneur : jamais de presque-noir) : elle est éclaircie (#205E72).
 */
export const WATER_TONES = { clear: 0x5cc3b5, shelf: 0x34a296, lagoon: COLORS_6E.deepSea, night: 0x205e72, heart: 3.4, cap: 1.5, reach: 10, taper: 0.5 } as const;

/**
 * Le palier du milieu, hors de l'anneau (deuxième reprise du lot 3, consultant Archipéo : le large passe plus nettement
 * au Bleu lagon en s'éloignant de la côte, Carte comprise) : après la bande claire, un turquoise moyen (`WATER_TONES.shelf`)
 * jusqu'à `reach` unités de la côte (ou tant que `shallowness` passe `from`, autour des haut-fonds du large), puis le Bleu
 * lagon du pack au-delà, sur la Carte comme de près.
 */
const SHELF = { from: 0.2, reach: 24 } as const;

/** Le milieu de l'eau de chaque pont (le point le plus près de la ligne du bras, sur sa liaison). */
let bridgeMids: Vec2[] | null = null;
function nearestBridge(p: Vec2): number {
  bridgeMids ??= Object.values(STRAITS).map((s) => {
    const [a, b] = s.bridge.map((id) => PATH_NODES.find((n) => n.id === id)!.at);
    return { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
  });
  return bridgeMids.reduce((d, m) => Math.min(d, distance(p, m)), Infinity);
}

/**
 * Les deux champs de l'eau en un point, en unités, positifs du côté du palier : `night`, de combien on est dans le cœur
 * d'un bras de mer ; `clear`, de combien on est dans l'eau claire. Leur ligne zéro est le bord d'un palier : la vue les
 * lit dans l'image de l'eau, interpolés, et tranche net sur zéro (le contour suit le bras, lisse, sans pixels).
 */
function waterFields(p: Vec2): SeaFields {
  if (insidePolygon(p, COAST)) {
    const deep = -straitClearance(p);
    const night = Math.min(deep - WATER_TONES.heart, WATER_TONES.cap) - Math.max(0, nearestBridge(p) - WATER_TONES.reach) * WATER_TONES.taper;
    return { night, clear: STRAIT_DEEP.clear - deep, shelf: -8 };
  }
  // Hors de l'anneau : la bande claire tant que l'eau est peu profonde (`shallowness` au-dessus de 0,75), puis le palier
  // du milieu (au-dessus de `SHELF.from`), mis à l'échelle d'une distance (environ dix unités pour toute la pente).
  const u = shallowness(p);
  return { night: -8, clear: (u - 0.75) * 10, shelf: Math.max((u - SHELF.from) * 10, landDistance(p) + SHELF.reach) };
}

/** Les trois champs de l'eau en un point (en unités, positifs du côté de leur palier). */
export interface SeaFields {
  night: number;
  clear: number;
  /** Le palier du milieu, au large (`SHELF`) ; absent, il ne compte pas. */
  shelf?: number;
}

/** Le palier de l'eau en un point : le cœur d'un bras de mer, le Bleu lagon de ses épaules et du large, le palier du milieu, ou l'eau claire. */
export function waterTone(p: Vec2): number {
  return toneOfFields(waterFields(p));
}

/** Le palier que donnent les deux champs (comme le shader de la vue, sans son fondu d'un pixel). */
export function toneOfFields(f: SeaFields): number {
  return f.night > 0 ? WATER_TONES.night : f.clear > 0 ? WATER_TONES.clear : (f.shelf ?? -1) > 0 ? WATER_TONES.shelf : WATER_TONES.lagoon;
}

/** Un champ codé dans un octet : 128 sur sa ligne zéro, `SEA_FIELD_SCALE` par unité, borné. */
const SEA_FIELD_SCALE = 16;
const encode = (v: number) => Math.max(0, Math.min(255, Math.round(128 + v * SEA_FIELD_SCALE)));

/** Décode un octet de l'image de l'eau en unités (les tests ; la vue, elle, tranche sur 128/255). */
export const decodeSeaField = (b: number) => (b - 128) / SEA_FIELD_SCALE;

/**
 * L'image de l'eau, ligne après ligne du nord au sud : rouge, le champ du cœur des bras de mer ; vert, celui de l'eau
 * claire ; bleu, celui du palier du milieu (codés par `encode`) ; alpha plein. Le bord de l'image reste au large (les deux champs au plus
 * bas) : la couleur qui s'étend jusqu'à l'horizon.
 */
export function seaPixels(): Uint8Array {
  return pixelsOf(waterFields);
}

/** L'image des champs `fields`, ligne après ligne du nord au sud, son bord au large. */
function pixelsOf(fields: (p: Vec2) => SeaFields): Uint8Array {
  const { size, half } = SEA_TEXTURE;
  const out = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++)
    for (let i = 0; i < size; i++) {
      const edge = i === 0 || j === 0 || i === size - 1 || j === size - 1;
      const p = { x: -half + ((i + 0.5) * 2 * half) / size, z: -half + ((j + 0.5) * 2 * half) / size };
      const f = edge ? { night: -8, clear: -8, shelf: -8 } : fields(p);
      const k = (j * size + i) * 4;
      out[k] = encode(f.night);
      out[k + 1] = encode(f.clear);
      out[k + 2] = encode(f.shelf ?? -8);
      out[k + 3] = 255;
    }
  return out;
}

// ---------- L'eau du 5e (GD-22, lot 2) ----------

/**
 * Les paliers de l'eau du 5e (fiche, § 2 : « l'eau des racines, calme et sombre ») : le cœur des chenaux, l'eau des
 * racines (#1E5452, jamais plus sombre : le mainteneur refuse le presque-noir) ; le bord des rives, un cran plus clair ;
 * le large autour de l'île, entre les deux ; la bande du bord de mer, comme le bord des rives. Mêmes champs, même shader
 * que le 6e : seules les couleurs changent. `heart` : à tant d'unités de la rive, on est au cœur d'un chenal.
 */
export const WATER_TONES_5E = { clear: COLORS_5E.waterShallow, shelf: COLORS_5E.waterShallow, lagoon: COLORS_5E.sea, night: COLORS_5E.water, heart: 1.8 } as const;

/** Les trois champs de l'eau du 5e en un point : le cœur des chenaux, le bord des rives, la bande du bord de mer. */
function waterFields5e(p: Vec2): SeaFields {
  const chan = channelClearance(p);
  if (insidePolygon(p, COAST_5E)) return { night: -chan - WATER_TONES_5E.heart, clear: STRAIT_DEEP.clear + chan, shelf: -8 };
  const coast = landDistance5e(p);
  return { night: -8, clear: coast + 2.5, shelf: coast + 9 };
}

/** L'image de l'eau du 5e, codée comme celle du 6e (`seaPixels`). */
export function seaPixels5e(): Uint8Array {
  return pixelsOf(waterFields5e);
}

/** Le palier de l'eau du 5e en un point. */
export function waterTone5e(p: Vec2): number {
  const f = waterFields5e(p);
  const t = WATER_TONES_5E;
  return f.night > 0 ? t.night : f.clear > 0 ? t.clear : (f.shelf ?? -1) > 0 ? t.shelf : t.lagoon;
}
