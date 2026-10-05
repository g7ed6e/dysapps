// Le logo de Blocland qui se construit à l'écran titre (GD-1, point 4, comme l'ancien écran titre où le bloc d'herbe
// tombait et se posait) : le dessin de public/blocland.svg, sans un trait changé (BuildingLogo.test.tsx le
// compare au fichier), rangé en quatre cubes qui se posent l'un après l'autre sur la mer : le pied de l'île, son dessus
// d'herbe et de terre, le tronc, le feuillage. Chaque cube descend en accélérant et s'arrête d'un coup, sans rebond ni
// flash ; le dernier est posé avant une seconde (LOGO_QUI_SE_CONSTRUIT). Le toucher n'attend pas : rien ne couvre « Jouer », et
// le logo reçoit ses gestes dès le début. Sans animation quand l'appareil en demande moins (global.css).
import type { PointerEventHandler, Ref } from 'react';

/**
 * Le logo de Blocland qui se construit à l'écran titre : ses quatre cubes (le pied de l'île, le dessus d'herbe et de
 * terre, le tronc, le feuillage) se posent l'un après l'autre, de la même chute en un cran. Délais en millisecondes ;
 * le dernier cube est posé avant une seconde.
 */
export const LOGO_QUI_SE_CONSTRUIT = { chuteMs: 280, ecartMs: 170, cubes: 4 } as const;

/** La fin de la construction du logo : le dernier cube s'arrête à ce moment-là (en millisecondes). */
export const finDuLogo = (): number => LOGO_QUI_SE_CONSTRUIT.ecartMs * (LOGO_QUI_SE_CONSTRUIT.cubes - 1) + LOGO_QUI_SE_CONSTRUIT.chuteMs;

type Rect = readonly [x: number, y: number, width: number, height: number, fill: string];

/** La mer et le fond, posés d'emblée. */
export const MER_DU_LOGO: readonly Rect[] = [
  [56, 352, 400, 48, '#4a9be0'],
  [72, 364, 32, 8, '#5eaae8'],
  [408, 380, 32, 8, '#5eaae8'],
];

/** Les quatre cubes, dans l'ordre où ils se posent. */
export const CUBES_DU_LOGO: readonly (readonly Rect[])[] = [
  // Le pied de l'île, dans la mer.
  [
    [128, 328, 256, 40, '#94694a'],
    [184, 368, 144, 16, '#7a5637'],
  ],
  // Le dessus : l'herbe, la terre, ses touffes et ses cailloux.
  [
    [88, 216, 336, 32, '#7cc24a'],
    [88, 248, 336, 80, '#94694a'],
    [88, 248, 336, 16, '#5fa233'],
    [104, 264, 16, 8, '#5fa233'],
    [200, 264, 16, 8, '#5fa233'],
    [296, 264, 16, 8, '#5fa233'],
    [392, 264, 16, 8, '#5fa233'],
    [152, 296, 16, 16, '#7a5637'],
    [336, 312, 16, 16, '#7a5637'],
  ],
  // Le tronc du grand chêne.
  [[152, 152, 32, 64, '#7a5637']],
  // Son feuillage.
  [
    [112, 96, 112, 64, '#5fa233'],
    [128, 104, 40, 24, '#7cc24a'],
  ],
];

interface Props {
  ref?: Ref<SVGSVGElement>;
  className?: string;
  onPointerDown?: PointerEventHandler<SVGSVGElement>;
  onPointerUp?: PointerEventHandler<SVGSVGElement>;
  onPointerCancel?: PointerEventHandler<SVGSVGElement>;
  onLostPointerCapture?: PointerEventHandler<SVGSVGElement>;
}

const dessiner = (rects: readonly Rect[]) => rects.map(([x, y, width, height, fill]) => <rect key={`${x},${y},${width},${height},${fill}`} x={x} y={y} width={width} height={height} fill={fill} />);

export function LogoQuiSeConstruit({ ref, className, ...gestes }: Props) {
  const { ecartMs, chuteMs } = LOGO_QUI_SE_CONSTRUIT;
  return (
    <svg ref={ref} className={className} viewBox="0 0 512 512" width={160} height={160} shapeRendering="crispEdges" aria-hidden="true" focusable="false" {...gestes}>
      <rect width={512} height={512} rx={48} fill="#13283d" />
      {dessiner(MER_DU_LOGO)}
      {CUBES_DU_LOGO.map((rects, i) => (
        <g key={i} className="logo-cube" style={{ animationDelay: `${i * ecartMs}ms`, animationDuration: `${chuteMs}ms, 60ms` }}>
          {dessiner(rects)}
        </g>
      ))}
    </svg>
  );
}
