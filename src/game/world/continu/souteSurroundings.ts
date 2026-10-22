/**
 * Les abords de la scénette de la Soute (lot 2 du monde ouvert du 4e ; intention du directeur artistique, § 6 : « le
 * quai, la bitte et son support vide, la halle »). Le quai, la bitte et la halle sont au lieu (./soute4e.ts) : ce fichier
 * ne pose que ce qui cadre, de part et d'autre de Kéo et du magasinier, jamais entre eux et la caméra (qui regarde le
 * long du quai, vers le nord, depuis le sud) : deux tonneaux cerclés de fer côté halle, à gauche de Kéo, une glène de
 * corde côté eau, à droite du magasinier. Rien sur un chemin. Dans le
 * repère du quai (`SOUTE_LAYOUT.quayToLocal`), posés sur ses planches. Aplats francs, une couleur par facette. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { SOUTE_LAYOUT } from './soute4e';
import type { SurroundingsState } from './surroundings';

const L = SOUTE_LAYOUT;

/** Les tonneaux et la glène, dans le repère du quai : leur place, leur rayon. */
const BARRELS = [
  { u: 11.15, v: 2.6, r: 0.32 },
  { u: 11.0, v: 3.4, r: 0.32 },
] as const;
const COIL = { u: 16.5, v: 2.2, r: 0.42 } as const;

/** Les abords, pour les tests. */
export const SOUTE_SURROUNDINGS = { barrels: BARRELS, coil: COIL } as const;

/** Les abords de la Soute, autour du sol de sa scène (`floor` : le dessus des planches au milieu de la scène). */
export function souteSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const at = (u: number, v: number): { x: number; z: number } => {
    const p = L.quayToLocal(u, v);
    return { x: floor.x + p.x - L.scene.dx, z: floor.z + p.z - L.scene.dz };
  };
  for (const r of BARRELS) {
    const p = at(r.u, r.v);
    b.prism({ x: p.x, y: floor.y - 0.02, z: p.z }, r.r, r.r * 0.92, 0.8, 8, L.colors.woodShade, L.colors.wood);
    for (const y of [0.18, 0.58]) b.band({ x: p.x, y: floor.y + y, z: p.z }, r.r * 1.02, 0.06, 8, L.colors.iron);
  }
  const p = at(COIL.u, COIL.v);
  b.annulus({ x: p.x, y: floor.y - 0.01, z: p.z }, COIL.r * 0.45, COIL.r, 0.18, 8, L.colors.rope, L.colors.rope);
}
