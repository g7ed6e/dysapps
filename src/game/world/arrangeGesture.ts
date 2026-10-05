// Le geste de la pose dans le mode « Aménager » (GD-9) : 1,5 s au plus, sans flash ni secousse, caméra fixe, un toucher
// le termine ; posé d'un coup quand l'appareil demande moins d'animations. Blocland : le lieu se démonte couche par
// couche, du haut vers le bas, puis se remonte à sa nouvelle place, du bas vers le haut, et le « clac » de la pose
// sonne à la fin. Archipéo : un voile de brume couvre le lieu, passe sur la place choisie et se lève, un seul « toc ».
// Ici, le temps et la hauteur de coupe, sans Three.js ; la 3D (three/arrange.ts) ne fait que lire l'heure.
import type { Rectangle } from './placement';
import type { ArrangeGesture } from './view';

/** Les deux temps du geste (ms) : ensemble, au plus 1,5 s (GD-9, « Ce qui ne bouge pas »). */
export const GESTE_DU_LIEU = { demonteMs: 600, remonteMs: 600 } as const;

/** L'avancée du geste à l'heure `now`, de 0 à 1. */
function gestureProgress(g: ArrangeGesture, now: number): number {
  return g.dureeMs <= 0 ? 1 : Math.min(1, Math.max(0, (now - g.debut) / g.dureeMs));
}

/**
 * La hauteur de coupe du geste (en cases) : tout ce qui est au-dessus, dans la zone, n'est pas dessiné. Elle descend
 * d'une couche entière à la fois (le démontage) ou monte d'une couche entière à la fois (le remontage) : jamais une
 * tranche de cube.
 */
export function gestureCut(g: ArrangeGesture, now: number): number {
  const k = gestureProgress(g, now);
  const n = g.haut - g.bas;
  return g.phase === 'demonte' ? g.bas + Math.ceil(n * (1 - k)) : g.bas + Math.floor(n * k);
}

/**
 * Le voile de brume d'Archipéo, de 0 à 1 : il couvre pendant la première moitié du démontage, reste plein pendant
 * qu'il glisse, puis se lève pendant la seconde moitié du remontage.
 */
export function veilOpacity(g: ArrangeGesture, now: number): number {
  const k = gestureProgress(g, now);
  return g.phase === 'demonte' ? Math.min(1, k * 2) : Math.min(1, (1 - k) * 2);
}

/** Un mouvement doux, sans à-coup au départ ni à l'arrivée. */
const doux = (t: number) => t * t * (3 - 2 * t);

const entre = (a: Rectangle, b: Rectangle, t: number): Rectangle => ({
  x0: a.x0 + (b.x0 - a.x0) * t,
  y0: a.y0 + (b.y0 - a.y0) * t,
  x1: a.x1 + (b.x1 - a.x1) * t,
  y1: a.y1 + (b.y1 - a.y1) * t,
});

const ensemble = (a: Rectangle, b: Rectangle): Rectangle => ({ x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) });

/**
 * Où se tient le voile de brume d'Archipéo : il ne disparaît jamais d'une place pour reparaître à l'autre, il GLISSE.
 * Démontage : il couvre l'ancienne place, puis, plein, s'étire jusqu'à couvrir les deux ; au plus fort (le lieu change
 * de place dessous), il couvre les deux. Remontage : il se resserre sur la nouvelle place, puis s'y lève. Sans `autre`,
 * il reste sur sa zone.
 */
export function veilZone(g: ArrangeGesture, now: number): Rectangle {
  if (!g.autre) return g.zone;
  const k = gestureProgress(g, now);
  const deux = ensemble(g.zone, g.autre);
  if (g.phase === 'demonte') return entre(g.zone, deux, doux(Math.max(0, k * 2 - 1)));
  return entre(deux, g.zone, doux(Math.min(1, k * 2)));
}

/** La zone d'un geste autour d'une emprise : une case de plus de chaque côté (une cascade, un ponton). */
export function gestureZone(r: Rectangle): Rectangle {
  return { x0: r.x0 - 1, y0: r.y0 - 1, x1: r.x1 + 1, y1: r.y1 + 1 };
}
