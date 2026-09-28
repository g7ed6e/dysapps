// Les personnages d'Archipéo en 2D peinte (lot R6), derrière `?rendu=archipeo` : le bonhomme, les créatures et les
// sentinelles, rastérisés depuis leurs modèles en facettes (./personnages.ts), sans contour noir, de nuit par palier.
// Chargé à la demande par ./WorldCanvas2D.tsx, seulement sous le drapeau : les modèles ne pèsent pas sur la 2D en pixels.
import type { BiomeId } from '../biomes';
import { bonhommePeint } from '../world/personnages/bonhomme';
import { creaturePeinte } from '../world/personnages/creaturesPeintes';
import { sentinellePeinte } from '../world/personnages/sentinellesPeintes';
import type { Facing, Sprite } from './characters';
import type { Peinture } from './painted';
import { spriteDePersonnage } from './paintedSprites';
import { rasterDuModele } from './personnages';

/**
 * Où regarde le bonhomme peint : de face, de dos, ou de trois quarts vers la gauche ou la droite (de profil, ses yeux
 * ne se verraient pas d'en haut). En radians, autour de la verticale, comme le cap de la vue 3D.
 */
export const ANGLE_DU_BONHOMME: Record<Facing, number> = { down: 0, up: Math.PI, right: -1.1, left: 1.1 };

/** Le pas du bonhomme peint : au pas 1, les bras et les jambes balancent (comme dans la vue 3D). */
export const GESTES_DU_PAS: Record<string, number> = { 'bras-gauche': 0.5, 'bras-droit': -0.5, 'jambe-gauche': -0.5, 'jambe-droite': 0.5 };

/** Le bonhomme d'Archipéo en 2D peinte, dans une direction, au pas 0 ou 1, au palier de lumière de `P`. */
export function bonhommePeint2D(facing: Facing, step: number, P: Peinture): Sprite | null {
  return spriteDePersonnage(`bonhomme:${facing}:${step}`, P, () =>
    rasterDuModele(bonhommePeint(), { archipel: P.archipel, light: P.light, angle: ANGLE_DU_BONHOMME[facing], gestes: step ? GESTES_DU_PAS : {} }),
  );
}

/**
 * Une créature ou un Gardien d'Archipéo en 2D peinte, de face : la créature de l'île, ou sa sentinelle, éteinte (le
 * rallumage viendra au lot 6).
 */
export function personnagePeint2D(kind: 'creature' | 'guardian', id: BiomeId, P: Peinture, allumage = 0): Sprite | null {
  if (kind === 'guardian')
    return spriteDePersonnage(`sentinelle:${id}:${allumage}`, P, () => rasterDuModele(sentinellePeinte(id), { archipel: P.archipel, light: P.light, allumage }));
  return spriteDePersonnage(`creature:${id}`, P, () => rasterDuModele(creaturePeinte(id), { archipel: P.archipel, light: P.light }));
}

