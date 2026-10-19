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
 * Retouche : le ciel renvoyé moins bleu (#DDE8E6), l'herbe ne tire plus vers le vert d'eau ; le sol renvoyé plus clair
 * (#A3AB8C), le dessous des tabliers et des piles ne tombe pas au presque-noir. Reprise (directeur artistique : encore
 * du presque-noir sous le pont) : le sol renvoyé, la lumière que l'eau claire et le sable rendent, plus clair et plus
 * chaud (#E0D9C0), l'ambiance un peu plus haute (1,6) et le soleil un peu plus bas (2,75) : les faces à l'ombre et le
 * dessous des tabliers remontent, les pans au soleil changent à peine ; la séparation des flancs des collines tient à
 * leurs couleurs (./terrain.ts). Lot commun des scénettes (directeur artistique, 18 octobre 2026 : « lumière rasante
 * dorée ») : le soleil plus bas encore (environ 21° au lieu de 33°, même azimut : les flancs au soleil et à l'ombre ne
 * changent pas de côté), plus chaud (#FFD49A), plus fort, l'ambiance plus basse (1) et plus chaude (le ciel renvoyé
 * #E4E4D4, le sol renvoyé #E8D3A8) : une face au soleil ressort deux fois plus claire que la même à l'ombre, qui garde
 * sa couleur (l'exposition relevée, 1,18, la tient claire ; valeurs du directeur artistique).
 */
/** La lumière d'un niveau, que la vue donne à Three.js. */
export interface SceneLight {
  readonly sky: number;
  readonly ground: number;
  readonly ambient: number;
  readonly sun: number;
  readonly sunIntensity: number;
  readonly sunFrom: { readonly x: number; readonly y: number; readonly z: number };
  readonly exposure: number;
}

export const LIGHT = {
  sky: 0xe4e4d4,
  ground: 0xe8d3a8,
  ambient: 1,
  sun: 0xffd49a,
  sunIntensity: 3.6,
  /** D'où vient le soleil (une direction, pas une place). */
  sunFrom: { x: 52, y: 23.8, z: 34 },
  exposure: 1.18,
} as const;

/** Le sens où tombent les ombres peintes, au sol (l'opposé du soleil, à plat, d'une unité). */
export const SHADOW_DIR = (() => {
  const l = Math.hypot(LIGHT.sunFrom.x, LIGHT.sunFrom.z);
  return { x: -LIGHT.sunFrom.x / l, z: -LIGHT.sunFrom.z / l };
})();

/**
 * Le ciel et la lumière du 5e (GD-22, lot 2 ; fiche du niveau, § 2 : « fin d'après-midi », planche de rendu validée le 19
 * octobre 2026) : un soleil bas et doré, à l'ouest-sud-ouest (environ 18°), qui prend les sommets, le plateau et les
 * aiguilles ; en bas, sous la canopée, une lumière plus sombre et diffuse, tirée vers le bleu-vert (`HEIGHT_LIGHT_5E`).
 * Le ciel en dégradé : doré à l'horizon, une brume gris-vert en haut, jamais saturée. Retouche du lot 2 (directeur
 * artistique : « la lumière est plate, sans or sur les sommets ni pénombre en bas ; le ciel est crème et uni ») : le
 * soleil moins orangé (la pierre grise virait au tabac), le ciel renvoyé plus fort et plus gris (la pierre reste grise à
 * l'ombre, jamais presque noire), l'écart entre les deux étages porté par la hauteur.
 */
const SKY_STOPS_5E: readonly { at: number; color: number }[] = [
  { at: 0, color: 0xeed3a0 },
  { at: 6, color: 0xebd9b6 },
  { at: 18, color: 0xdcdac9 },
  { at: 40, color: 0xc7cfc8 },
  { at: 90, color: 0xb6c1bf },
];

/** La couleur de l'horizon du 5e : la brume du lointain et le bas du dôme, un or pâle. */
export const HORIZON_COLOR_5E = SKY_STOPS_5E[0].color;

/**
 * La lumière du 5e (valeurs de l'artiste technique 3D, à valider sur captures) : le ciel renvoyé gris-vert et fort (2,7),
 * le sol renvoyé d'un gris d'olive, le soleil d'un or pâle (#FFDCAA), 4,6, bas à l'ouest-sud-ouest ; l'exposition un peu
 * plus basse qu'au 6e (1,12). Au soleil, la pierre du haut sort dorée (#B7AA82 environ), à l'ombre grise (#555D4F) ; le
 * sol de la forêt, en bas, reste sombre et bleu-vert (#2D5444 environ), jamais presque noir.
 */
export const LIGHT_5E = {
  sky: 0xd0dad8,
  ground: 0xa4a28c,
  ambient: 2.7,
  sun: 0xffdcaa,
  sunIntensity: 4.6,
  sunFrom: { x: -58, y: 22, z: 26 },
  exposure: 1.12,
} as const satisfies SceneLight;

/**
 * La lumière par la hauteur, au 5e (artiste technique 3D) : les deux étages de la planche. Sous `low` (le sol de la
 * forêt, le bas des troncs), le soleil ne passe qu'à `sunLow` de sa force (la canopée l'arrête), et le ciel renvoyé prend
 * la teinte `tintLow` (rouge, vert, bleu : plus froide, vers le bleu-vert) ; au-dessus de `high` (le haut de la falaise, le
 * plateau, les aiguilles, la Montée), toute la lumière ; entre les deux, un fondu. Le brouillard s'éclaircit en hauteur :
 * de `fogFrom` à `fogTo`, sa part tombe à `fogTop`, et les sommets dépassent la brume du lointain (la Montée se voit de
 * la Lisière). Une ligne de shader dans le matériau du décor (three/archipeo/scene.ts), aucun appel de plus ; rien ne
 * bouge.
 */
export interface HeightLight {
  readonly low: number;
  readonly high: number;
  readonly sunLow: number;
  readonly tintLow: readonly [number, number, number];
  readonly fogFrom: number;
  readonly fogTo: number;
  readonly fogTop: number;
}

export const HEIGHT_LIGHT_5E: HeightLight = { low: 2.5, high: 12, sunLow: 0.2, tintLow: [0.86, 0.97, 1.04], fogFrom: 14, fogTo: 40, fogTop: 0.45 };

/** Le sens où tombent les ombres peintes du 5e (l'opposé de son soleil, à plat). */
export const SHADOW_DIR_5E = (() => {
  const l = Math.hypot(LIGHT_5E.sunFrom.x, LIGHT_5E.sunFrom.z);
  return { x: -LIGHT_5E.sunFrom.x / l, z: -LIGHT_5E.sunFrom.z / l };
})();

/** Le ciel d'un niveau : ses couleurs, de l'horizon au zénith. */
export type SkyStops = readonly { at: number; color: number }[];

/** Les couleurs du ciel du 6e (le défaut) et du 5e. */
export const SKY_OF = { '6e': SKY_STOPS, '5e': SKY_STOPS_5E } as const satisfies Record<string, SkyStops>;

/** La couleur du ciel à une hauteur angulaire (degrés ; sous l'horizon, l'horizon), en rouge, vert, bleu linéaires. */
export function skyColorAt(elevation: number, stops: SkyStops = SKY_STOPS): [number, number, number] {
  const e = Math.max(0, Math.min(90, elevation));
  let k = 0;
  while (k < stops.length - 2 && e > stops[k + 1].at) k++;
  const a = stops[k];
  const b = stops[k + 1];
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
export function skyDome(radius: number, stops: SkyStops = SKY_STOPS): SkyDome {
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
    col.push(...skyColorAt(rows[row], stops));
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
