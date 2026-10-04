import { COTE_DU_VISAGE, type Visage } from './world/personnages/visage';

/**
 * Le visage du joueur, celui du médaillon « toi » de la Carte (`drawMedaillon`, world/labelCanvas.ts) : le bouton
 * Recentrer le porte, la vue revient à lui (mot du mainteneur, 4 octobre 2026). En pixels (Blocland) ou en facettes
 * (Archipéo, choix « 1a », même jour) : `visageDuJoueur` (world/personnages/visage.ts). Décoratif.
 */
export function VisageDuBonhomme({ visage, size = 32 }: { visage: Visage; size?: number }) {
  if ('facettes' in visage)
    return (
      <svg width={size} height={size} viewBox={`0 0 ${COTE_DU_VISAGE} ${COTE_DU_VISAGE}`} aria-hidden="true" focusable="false">
        {visage.facettes.map(({ couleur, points }, i) => (
          <polygon key={i} points={points.map(([x, y]) => `${x},${y}`).join(' ')} fill={couleur} />
        ))}
      </svg>
    );
  const n = visage.length;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {visage.flatMap((ligne, j) => ligne.map((couleur, i) => <rect key={`${i}-${j}`} x={i} y={j} width={1} height={1} fill={couleur} />))}
    </svg>
  );
}
