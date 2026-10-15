// La Carte des lieux ouverts du monde continu (piste 1, lot 3, condition du consultant UX UI : « garder la Carte, lieux
// ouverts seulement ») : l'île vue de haut, nord en haut, qu'on fait glisser à un doigt et qu'on pince à deux (ou à la
// molette), comme la Carte du monde en grille (#331), sans boutons + ou −. Seuls les lieux ouverts se touchent ; un
// lieu encore sous la brume porte son cadenas. Rien n'est écrit dans la 3D : les noms des lieux sont des boutons de la
// page. Ici, la pose de la caméra et ses limites, sans Three.js ; la vue fait le reste (../../three/archipeo/scene.ts).
import { screenOf, type CameraPose } from './camera';
import type { Vec2 } from './geometry';
import { COAST } from './plan6e';

/**
 * La caméra de la Carte : son angle sous l'horizon (presque à plomb, un peu de biais pour garder le relief), son champ
 * vertical, la marge autour de l'île vue entière (en part), et sa distance la plus proche, en unités (un lieu remplit
 * alors la moitié de l'écran).
 */
export const MAP_CAMERA = { pitch: (64 * Math.PI) / 180, fov: 40, margin: 1.04, closest: 100 } as const;

/** La pose de la Carte : le point regardé, au sol (à hauteur de l'eau), et la distance de la caméra à ce point. */
export interface MapView {
  x: number;
  z: number;
  distance: number;
}

/** La boîte de l'île (le bord de son anneau de sable), en unités. */
export const ISLAND_BOX = (() => {
  const xs = COAST.map((p) => p.x);
  const zs = COAST.map((p) => p.z);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
})();

/** La distance la plus lointaine qu'on cherche, en unités (bien au-delà de l'île entière). */
const FARTHEST = 4000;

/**
 * La distance où l'île entière tient dans un écran de rapport `aspect` (largeur sur hauteur), avec sa marge : les
 * quatre coins de sa boîte à l'écran, en perspective (le bord sud, plus proche, est plus grand), cherchée par
 * dichotomie. Le résultat ne dépend que du rapport : il est gardé.
 */
export function fitDistance(aspect: number): number {
  const key = Math.round(aspect * 1000);
  const known = fits.get(key);
  if (known !== undefined) return known;
  const h = 1000;
  const w = Math.max(0.1, aspect) * h;
  const { minX, maxX, minZ, maxZ } = ISLAND_BOX;
  const x = (minX + maxX) / 2;
  const z = (minZ + maxZ) / 2;
  const corners = [
    { x: minX, y: 0, z: minZ },
    { x: maxX, y: 0, z: minZ },
    { x: minX, y: 0, z: maxZ },
    { x: maxX, y: 0, z: maxZ },
  ];
  const inside = (distance: number) =>
    corners.every((c) => {
      const s = screenOf(mapPose({ x, z, distance }), c, w, h);
      return s.x >= 0 && s.x <= w && s.y >= 0 && s.y <= h;
    });
  let lo: number = MAP_CAMERA.closest;
  let hi: number = FARTHEST;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (inside(mid)) hi = mid;
    else lo = mid;
  }
  const d = hi * MAP_CAMERA.margin;
  fits.set(key, d);
  return d;
}
const fits = new Map<number, number>();

/** La Carte à l'ouverture : l'île entière, au milieu de l'écran. */
export function mapStart(aspect: number): MapView {
  return { x: (ISLAND_BOX.minX + ISLAND_BOX.maxX) / 2, z: (ISLAND_BOX.minZ + ISLAND_BOX.maxZ) / 2, distance: fitDistance(aspect) };
}

/** La pose garde l'île sous les yeux : la distance entre la plus proche et l'île entière, le point regardé dans l'île. */
export function clampMap(v: MapView, aspect: number): MapView {
  const distance = Math.min(fitDistance(aspect), Math.max(MAP_CAMERA.closest, v.distance));
  return {
    x: Math.min(ISLAND_BOX.maxX, Math.max(ISLAND_BOX.minX, v.x)),
    z: Math.min(ISLAND_BOX.maxZ, Math.max(ISLAND_BOX.minZ, v.z)),
    distance,
  };
}

/** La Carte glissée : le point regardé déplacé de (`dx`, `dz`), dans ses limites. */
export function panMap(v: MapView, dx: number, dz: number, aspect: number): MapView {
  return clampMap({ x: v.x + dx, z: v.z + dz, distance: v.distance }, aspect);
}

/**
 * La Carte zoomée d'un facteur (`factor` > 1 rapproche), autour du point du sol `toward` (sous les doigts ou le
 * pointeur) : ce point reste où il est à l'écran, sauf aux limites.
 */
export function zoomMap(v: MapView, factor: number, toward: Vec2, aspect: number): MapView {
  const want = clampMap({ ...v, distance: v.distance / Math.max(0.01, factor) }, aspect).distance;
  const k = want / v.distance;
  return clampMap({ x: toward.x + (v.x - toward.x) * k, z: toward.z + (v.z - toward.z) * k, distance: want }, aspect);
}

/** La pose de la caméra pour une pose de la Carte, remplie dans `out` s'il est donné. */
export function mapPose(v: MapView, out?: CameraPose): CameraPose {
  const pose = out ?? { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: MAP_CAMERA.fov, lens: 0 };
  pose.target.x = v.x;
  pose.target.y = 0;
  pose.target.z = v.z;
  pose.position.x = v.x;
  pose.position.y = v.distance * Math.sin(MAP_CAMERA.pitch);
  pose.position.z = v.z + v.distance * Math.cos(MAP_CAMERA.pitch);
  pose.fov = MAP_CAMERA.fov;
  pose.lens = 0;
  return pose;
}
