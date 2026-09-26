// Le voyage du Bloc-Navire, en deux temps séparés par le changement d'archipel (la scène 3D est reconstruite sous un
// voile) : le départ (le bonhomme embarque, le navire s'éloigne) puis l'arrivée (le navire accoste, le bonhomme
// débarque). Code pur : durées et trajectoire ; l'animation est dans WorldCanvas, l'enchaînement dans WorldPage.

export type VoyageLeg = 'depart' | 'arrivee';

export interface LegTiming {
  /** Le bonhomme marche jusqu'au pont (départ) ou du pont jusqu'à son île (arrivée). */
  walk: number;
  /** Le navire s'éloigne (départ) ou accoste (arrivée). */
  sail: number;
}

/** Un premier voyage : huit secondes en tout. */
export const VOYAGE_MS: Record<VoyageLeg, LegTiming> = {
  depart: { walk: 1500, sail: 2500 },
  arrivee: { sail: 3000, walk: 1000 },
};
/** Un retour (ou un nouveau départ vers un archipel déjà atteint) : cinq secondes. */
export const RETURN_MS: Record<VoyageLeg, LegTiming> = {
  depart: { walk: 900, sail: 1500 },
  arrivee: { sail: 1900, walk: 700 },
};
/** Le voile entre les deux temps : le temps de changer d'archipel. */
export const VEIL_MS = 600;

export function legTiming(leg: VoyageLeg, back: boolean): LegTiming {
  return (back ? RETURN_MS : VOYAGE_MS)[leg];
}

export function legDuration(leg: VoyageLeg, back: boolean): number {
  const t = legTiming(leg, back);
  return t.walk + t.sail;
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Où est le navire pendant qu'il s'éloigne, en cases par rapport à son quai : `k` de 0 (amarré) à 1 (loin).
 * La voile glisse vers le large ; le ballon s'élève et l'archipel rétrécit ; le réacteur monte presque à la verticale.
 * `dy` est négatif : le large est devant l'île (−y). `pitch` : le nez qui se lève, en radians.
 */
export function vehiclePath(stage: 1 | 2 | 3, k: number): { dx: number; dy: number; dz: number; pitch: number } {
  const t = Math.max(0, Math.min(1, k));
  if (stage === 1) return { dx: 0, dy: -26 * ease(t), dz: 0, pitch: Math.sin(t * Math.PI * 3) * 0.03 };
  if (stage === 2) return { dx: 0, dy: -18 * t, dz: 30 * ease(t), pitch: -0.08 * t };
  return { dx: 0, dy: -8 * t, dz: 60 * t * t, pitch: -0.25 * t };
}
