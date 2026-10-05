// Le niveau du sol en un point du monde : l'altitude de l'île plus la hauteur de sa terre (0 dans le cœur,
// hors plateau). Code pur, partagé par les sentiers et le bonhomme.
import { ARCHIPELAGO_IDS, inCore, isLand, landscape, mapOf, toPlace } from './map';

/** Le z du dessus du sol en (x, y), ou 0 (niveau de la mer) si la case est dans l'eau. Les lieux à leur place, tournés. */
export function groundLevelAt(x: number, y: number): number {
  for (const a of ARCHIPELAGO_IDS)
    for (const def of mapOf(a)) {
      // La case dans le dessin du lieu (posé, pas tourné).
      const l = toPlace(def, x, y);
      const dx = def.core.x + l.x;
      const dy = def.core.y + l.y;
      if (!isLand(def, dx, dy)) continue;
      if (inCore(def, dx, dy)) return def.altitude;
      const cell = landscape(def).find((c) => c.x === dx && c.y === dy);
      return def.altitude + Math.max(0, cell?.h ?? 0);
    }
  return 0;
}
