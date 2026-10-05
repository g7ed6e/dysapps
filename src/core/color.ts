export type RGB = [number, number, number];

/** Les trois composantes (0 à 255) d'une couleur `#rrggbb`. */
export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * La couleur délavée d'une île fermée : elle s'efface vers un gris clair, comme dans la brume. Le même calcul pour la
 * texture 3D, la vue simple et la 2D ; les composantes ne sont pas arrondies.
 */
export function fadeRgb(r: number, g: number, b: number): RGB {
  const lum = r * 0.3 + g * 0.59 + b * 0.11;
  const mix = (c: number) => (c * 0.4 + lum * 0.6) * 0.55 + 205 * 0.45;
  return [mix(r), mix(g), mix(b)];
}
