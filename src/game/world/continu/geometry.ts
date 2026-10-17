// La géométrie à plat du monde continu (prototype du monde ouvert d'Archipéo, 6e) : points, polygones, segments, en
// unités du monde (x vers l'est, z vers le sud, comme la scène 3D). Code pur, sans Three.js, testé sous jsdom.

/** Un point au sol : x vers l'est, z vers le sud (le haut de l'écran est le nord). */
export interface Vec2 {
  x: number;
  z: number;
}

/** Un point dans l'espace : y vers le haut. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const distance = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.z - b.z);

/** Le point le plus proche de `p` sur le segment [a, b], et sa part `t` (0 en a, 1 en b). */
export function closestOnSegment(p: Vec2, a: Vec2, b: Vec2): { point: Vec2; t: number } {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const l2 = dx * dx + dz * dz;
  const t = l2 === 0 ? 0 : Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.z - a.z) * dz) / l2));
  return { point: { x: a.x + t * dx, z: a.z + t * dz }, t };
}

/** Le point est-il dans le polygone (règle pair-impair) ? */
export function insidePolygon(p: Vec2, poly: readonly Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.z > p.z !== b.z > p.z && p.x < ((b.x - a.x) * (p.z - a.z)) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}

/** La distance au bord du polygone, positive dedans, négative dehors. */
export function signedDistance(p: Vec2, poly: readonly Vec2[]): number {
  let d = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) d = Math.min(d, distance(p, closestOnSegment(p, poly[j], poly[i]).point));
  return insidePolygon(p, poly) ? d : -d;
}

/** La distance à une ligne brisée. */
export function distanceToPolyline(p: Vec2, line: readonly Vec2[]): number {
  let d = Infinity;
  for (let i = 1; i < line.length; i++) d = Math.min(d, distance(p, closestOnSegment(p, line[i - 1], line[i]).point));
  return d;
}

/** De 0 à 1 sans à-coup entre `a` et `b`. */
export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Un hasard fixe, de 0 à 1, pour deux entiers : le même dessin à chaque construction. */
export function hash2(i: number, j: number): number {
  let h = Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Une couleur `0xRRGGBB` en rouge, vert, bleu linéaires (les couleurs de sommet de la scène). */
export function linearRgb(hex: number): [number, number, number] {
  const lin = (c: number) => (c < 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return [lin(((hex >> 16) & 255) / 255), lin(((hex >> 8) & 255) / 255), lin((hex & 255) / 255)];
}
