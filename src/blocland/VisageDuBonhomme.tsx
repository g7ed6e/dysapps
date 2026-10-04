import { VISAGE_DU_BONHOMME } from './Avatar';

/**
 * Le visage du bonhomme en pixels, celui du médaillon « toi » de la Carte (`drawMedaillon`, world/labelCanvas.ts) : le
 * bouton Recentrer le porte, la vue revient à lui (mot du mainteneur, 4 octobre 2026). Décoratif.
 */
export function VisageDuBonhomme({ size = 32 }: { size?: number }) {
  const n = VISAGE_DU_BONHOMME.length;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {VISAGE_DU_BONHOMME.flatMap((ligne, j) => ligne.map((couleur, i) => <rect key={`${i}-${j}`} x={i} y={j} width={1} height={1} fill={couleur} />))}
    </svg>
  );
}
