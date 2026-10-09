// Un angle en un point : seul, côte à côte sur une droite, ou opposé par le sommet (voir index.ts).

import { AngleMark, ASK, fmt, isAsk, Label, type Point, polar, r1, RightMark, size, type Value } from './tools';

type AngleLayout = 'single' | 'straight' | 'crossed';

/**
 * Un angle en un point. `single` : l'angle seul, à côté d'un angle droit en pointillé pour comparer. `straight` : deux
 * angles côte à côte, sur une droite (un angle plat). `crossed` : deux droites qui se coupent, la mesure sur un angle et
 * « ? » sur l'angle opposé par le sommet ; les deux autres angles ne portent rien.
 */
export function AngleFigure({ layout, values }: { layout: AngleLayout; values: Value[] }) {
  const [first, second = ASK] = values;
  if (layout === 'single') {
    const theta = size(first, 60);
    const vertex: Point = theta > 90 ? [170, 165] : [70, 165];
    const end = polar(vertex, theta, 140);
    const right = polar(vertex, 0, 140);
    const square = polar(vertex, 90, 125);
    return (
      <figure className="geometry angle-figure">
        <svg viewBox="0 0 320 200" role="img" aria-label={`${isAsk(first) ? 'Un angle à trouver' : `Un angle de ${fmt(first)}°`}, à côté d’un angle droit en pointillé, pour comparer.`}>
          <line x1={vertex[0]} y1={vertex[1]} x2={r1(square[0])} y2={r1(square[1])} className="geo-dash" />
          <RightMark v={vertex} a={right} b={square} side={18} className="geo-right geo-dash" />
          <Label at={[square[0] + 8, square[1] - 4]} text="angle droit" anchor="start" />
          <line x1={vertex[0]} y1={vertex[1]} x2={r1(right[0])} y2={r1(right[1])} className="geo-line" />
          <line x1={vertex[0]} y1={vertex[1]} x2={r1(end[0])} y2={r1(end[1])} className="geo-line" />
          {/* La mesure loin du sommet : elle ne touche ni l'angle droit de comparaison, ni son pointillé. */}
          <AngleMark vertex={vertex} from={right} to={end} value={first} radius={34} minDistance={80} />
        </svg>
      </figure>
    );
  }
  const center: Point = layout === 'straight' ? [160, 160] : [160, 105];
  // L'angle qui se trace : la mesure donnée, ou ce qui reste de 180° (angle plat) ; opposés par le sommet, ils sont égaux.
  const theta = typeof first === 'number' ? first : layout === 'straight' ? 180 - size(second, 120) : size(second, 60);
  const reach = layout === 'straight' ? 140 : 130;
  const [east, west, ray] = [polar(center, 0, reach), polar(center, 180, reach), polar(center, theta, layout === 'straight' ? reach : 95)];
  const oblique = layout === 'straight' ? reach : 95;
  const opposite = polar(center, theta + 180, oblique);
  const measure = (v: Value) => (isAsk(v) ? 'est à trouver' : `mesure ${fmt(v)}°`);
  const label =
    layout === 'straight'
      ? `Une droite et une demi-droite partant d’un de ses points : deux angles côte à côte, qui forment un angle plat. L’un ${measure(first)}, l’autre ${measure(second)}.`
      : `Deux droites qui se coupent. Un angle ${measure(first)} ; l’angle opposé par le sommet ${measure(second)} ; les deux autres angles ne sont pas marqués.`;
  return (
    <figure className="geometry angle-figure">
      <svg viewBox={layout === 'straight' ? '0 0 320 200' : '0 0 320 210'} role="img" aria-label={label}>
        <line x1={r1(west[0])} y1={r1(west[1])} x2={r1(east[0])} y2={r1(east[1])} className="geo-line" />
        {layout === 'straight' ? (
          <line x1={center[0]} y1={center[1]} x2={r1(ray[0])} y2={r1(ray[1])} className="geo-line" />
        ) : (
          <line x1={r1(opposite[0])} y1={r1(opposite[1])} x2={r1(ray[0])} y2={r1(ray[1])} className="geo-line" />
        )}
        <circle cx={center[0]} cy={center[1]} r="4" className="geo-point" />
        <AngleMark vertex={center} from={east} to={ray} value={first} radius={30} spread={layout === 'crossed' ? 8 : 0} />
        {layout === 'straight' ? (
          <AngleMark vertex={center} from={ray} to={west} value={second} radius={30} />
        ) : (
          <AngleMark vertex={center} from={west} to={opposite} value={second} radius={30} spread={8} />
        )}
      </svg>
    </figure>
  );
}
