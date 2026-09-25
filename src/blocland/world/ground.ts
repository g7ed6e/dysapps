// Le niveau du sol en un point du monde : l'altitude de l'île plus la hauteur de sa terre (0 dans le cœur,
// hors plateau). Code pur, partagé par les sentiers et le bonhomme.
import { MAP, inCore, isLand, landscape } from './map';

/** Le z du dessus du sol en (x, y), ou 0 (niveau de la mer) si la case est dans l'eau. */
export function groundLevelAt(x: number, y: number): number {
  for (const def of MAP) {
    if (!isLand(def, x, y)) continue;
    if (inCore(def, x, y)) return def.altitude;
    const cell = landscape(def).find((c) => c.x === x && c.y === y);
    return def.altitude + Math.max(0, cell?.h ?? 0);
  }
  return 0;
}
