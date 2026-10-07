// Faire glisser le monde d'un doigt ou à la souris : la vue se déplace à plat, sans rotation. Ce qui se calcule sans
// Three.js : le seuil entre un toucher et un glissé, le point du sol sous le doigt, le décalage borné à l'archipel.
// La caméra (./camera.ts) ajoute ce décalage à son cadrage, et sur la Carte son zoom ; WorldCanvas.tsx traduit le pointeur.

/**
 * En pixels CSS : en dessous, le doigt qui bouge un peu reste un toucher ; au-delà, c'est un glissé, et lever le doigt
 * n'ouvre rien.
 */
export const SEUIL_DU_GLISSE = 10;

/**
 * En pixels CSS : le glissé du choix, dans le mode « Aménager » (GD-9, choix 1b du mainteneur), ne part qu'au-delà,
 * plus loin que celui de la Carte : un doigt qui retouche le choix pour le lâcher et bouge un peu ne le pose pas
 * ailleurs. Entre les deux seuils, rien ne bouge encore, ni le choix, ni la Carte.
 */
export const SEUIL_DU_CHOIX = 24;

/**
 * La marque d'un appui relayé à la scène par un bouton posé par-dessus (la poignée d'un bout de liaison,
 * ArrangeHandles.tsx) : le doigt y est parti en glissé, la vue glisse avec lui, et le lever n'ouvre rien.
 */
export const RELAYE_DEPUIS_UN_BOUTON = 'dysappsRelaye';

/** Un décalage sur le plan horizontal, en cases du monde (`x` : vers l'est, `z` : la grille `y`). */
export interface Decalage {
  x: number;
  z: number;
}

/** L'étendue de l'archipel, en cases (world/terrain.ts, `worldBounds`). */
export interface Etendue {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Le doigt a assez bougé depuis l'appui pour glisser le choix du mode « Aménager » (`SEUIL_DU_CHOIX`). */
export function choixCommence(dx: number, dy: number): boolean {
  return Math.hypot(dx, dy) >= SEUIL_DU_CHOIX;
}

/** Le doigt a assez bougé depuis l'appui pour que ce soit un glissé. */
export function glisseCommence(dx: number, dy: number): boolean {
  return Math.hypot(dx, dy) >= SEUIL_DU_GLISSE;
}

/** Le décalage n'est pas nul : la vue a été déplacée (le bouton « Recentrer » se montre). */
export function estDecale(d: Decalage): boolean {
  return Math.abs(d.x) > 1e-6 || Math.abs(d.z) > 1e-6;
}

/**
 * Le décalage `d` borné pour que la cible de la caméra (`base`, le cadrage géré, plus `d`) reste au-dessus de
 * l'archipel : arrêt net au bord. Une cible déjà hors de l'étendue (un repère au large) garde le droit de rester où
 * elle est : un décalage nul est toujours permis, le bornage ne fait jamais sauter la vue. Écrit dans `sortie` (un
 * nouvel objet par défaut).
 */
export function bornerLeDecalage(base: Decalage, d: Decalage, e: Etendue, sortie: Decalage = { x: 0, z: 0 }): Decalage {
  // `sortie` peut être `d` lui-même : la caméra borne son décalage en place, à chaque image, sans allocation.
  const x = borne(d.x, base.x, e.minX, e.maxX);
  const z = borne(d.z, base.z, e.minY, e.maxY);
  sortie.x = x;
  sortie.z = z;
  return sortie;
}

/** `b + v` ramené dans [min, max], élargi pour contenir `b` ; rend le décalage borné. */
function borne(v: number, b: number, min: number, max: number): number {
  return Math.min(Math.max(b, max), Math.max(Math.min(b, min), b + v)) - b;
}

/**
 * Le point du plan horizontal d'altitude `y` sur le rayon parti de `o` dans la direction `d`, ou `null` si le rayon ne
 * le coupe pas (il monte vers le ciel, ou le croise trop loin : au ras de l'horizon, un pixel vaudrait des centaines de
 * cases).
 */
export function pointDuPlan(o: { x: number; y: number; z: number }, d: { x: number; y: number; z: number }, y: number, loinMax = Infinity): Decalage | null {
  if (d.y > -1e-6) return null;
  const t = (y - o.y) / d.y;
  if (t <= 0 || t * Math.hypot(d.x, d.y, d.z) > loinMax) return null;
  return { x: o.x + t * d.x, z: o.z + t * d.z };
}
