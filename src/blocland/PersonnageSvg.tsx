// Un personnage d'Archipéo en SVG (lot R6), derrière `?rendu=archipeo` : le repli sans WebGL de la bulle d'une
// créature et du défi d'un Gardien, ou hors de la vue 3D. Ses facettes vues, en polygones plats
// (world/personnages/portrait.ts), sans animation. Chargé à la demande : les modèles ne pèsent pas sur le monde en blocs.
import { useMemo } from 'react';
import type { BiomeId } from './biomes';
import { modeleDuPortrait, portraitDe } from './world/personnages/portrait';

export interface PersonnageSvgProps {
  kind: 'creature' | 'guardian';
  id: BiomeId;
  /** Pour un Gardien : son degré d'allumage (0 : éteint, 1 : rallumé). */
  allumage?: number;
  /** Nom lisible par les lecteurs d'écran (sinon décoratif). */
  label?: string;
  className?: string;
}

/** La marge autour du personnage, en blocs. */
const MARGE = 0.15;

export default function PersonnageSvg({ kind, id, allumage, label, className }: PersonnageSvgProps) {
  const portrait = useMemo(() => portraitDe(modeleDuPortrait(kind, id), kind === 'guardian' ? { allumage: allumage ?? 0 } : {}), [kind, id, allumage]);
  const { x, y, largeur, hauteur } = portrait.cadre;
  const box = [x - MARGE, y - MARGE, largeur + 2 * MARGE, hauteur + 2 * MARGE].map((v) => v.toFixed(3)).join(' ');
  return (
    <svg
      className={`creature personnage-svg ${className ?? ''}`.trim()}
      viewBox={box}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      shapeRendering="geometricPrecision"
    >
      {portrait.facettes.map((f, i) => (
        <polygon
          key={i}
          points={f.points.map(([px, py]) => `${px.toFixed(3)},${py.toFixed(3)}`).join(' ')}
          fill={f.couleur}
          stroke={f.couleur}
          strokeWidth={0.006}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
