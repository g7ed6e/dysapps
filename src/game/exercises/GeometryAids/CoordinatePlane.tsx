// Un repère de −6 à 6 (voir index.ts).

import { Arrow, fmt, Label, list } from './tools';

interface PlanePoint {
  name: string;
  x: number;
  y: number;
}

/** Les bornes du repère, sur les deux axes : avec −4 à 4, un point du 4 ou du −4 tomberait sur le bord. */
const PLANE_RANGE = 6;

/**
 * Un repère de −6 à 6 sur les deux axes, une graduation par unité, les nombres dans les marges (comme le graphique) et
 * les axes nommés « axe des abscisses » et « axe des ordonnées ». Vide, ses demi-axes portent « + » et « − » ; sinon,
 * les points sont placés et nommés, sans pointillés vers les axes. La description lue nomme les points, jamais leurs
 * coordonnées (les lire est souvent la question).
 */
export function CoordinatePlane({ points = [] }: { points?: PlanePoint[] }) {
  const n = PLANE_RANGE;
  // Une case de 22 et un dessin de 330 de large : au téléphone, les nombres (21) restent à 18 px au moins.
  const cell = 22;
  const [left, top, right, bottom] = [40, 48, 26, 62];
  const span = 2 * n * cell;
  const X = (v: number) => left + (v + n) * cell;
  const Y = (v: number) => top + (n - v) * cell;
  const values = Array.from({ length: 2 * n + 1 }, (_, i) => i - n);
  const names = points.map((p) => p.name);
  const placed = names.length === 0 ? '' : names.length === 1 ? ` Le point ${names[0]} est placé.` : ` Les points ${list(names)} sont placés.`;
  const signs = points.length === 0 ? ' Chaque demi-axe porte son signe : « + » à droite et en haut, « − » à gauche et en bas.' : '';
  const label = `Repère gradué de −6 à 6 sur les deux axes, une graduation par unité, un nombre écrit sur deux : l’axe des abscisses, horizontal, et l’axe des ordonnées, vertical.${signs}${placed}`;
  const W = left + span + right;
  const H = top + span + bottom;
  return (
    <figure className="geometry coordinate-plane">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {values.map((v) => (
          <g key={`g${v}`}>
            <line x1={X(v)} y1={Y(n)} x2={X(v)} y2={Y(-n)} className="geo-grid" />
            <line x1={X(-n)} y1={Y(v)} x2={X(n)} y2={Y(v)} className="geo-grid" />
          </g>
        ))}
        <Arrow a={[X(-n), Y(0)]} b={[X(n) + 18, Y(0)]} className="geo-line geo-thin" />
        <Arrow a={[X(0), Y(-n)]} b={[X(0), Y(n) - 18]} className="geo-line geo-thin" />
        {values.map((v) => (
          <g key={`t${v}`}>
            <line x1={X(v)} y1={Y(0) - 5} x2={X(v)} y2={Y(0) + 5} className="geo-right" />
            <line x1={X(0) - 5} y1={Y(v)} x2={X(0) + 5} y2={Y(v)} className="geo-right" />
            {/* Un nombre sur deux, une graduation par unité : les nombres ne se touchent pas. */}
            {v % 2 === 0 && (
              <>
                <text x={X(v)} y={Y(-n) + 28} textAnchor="middle" className="geo-text geo-tick-label">
                  {fmt(v)}
                </text>
                <text x={X(-n) - 8} y={Y(v) + 7} textAnchor="end" className="geo-text geo-tick-label">
                  {fmt(v)}
                </text>
              </>
            )}
          </g>
        ))}
        <Label at={[X(n), Y(-n) + 46]} text="axe des abscisses" anchor="end" name />
        {/* Ancré à droite : le nom ne dépasse jamais du dessin. */}
        <Label at={[W - 4, top - 32]} text="axe des ordonnées" anchor="end" name />
        {points.length === 0 && (
          <>
            {(
              [
                [X(n - 0.6), Y(0) - 18, '+'],
                [X(-n + 0.6), Y(0) - 18, '−'],
                [X(0) + 18, Y(n - 0.6), '+'],
                [X(0) + 18, Y(-n + 0.6), '−'],
              ] as const
            ).map(([x, y, sign]) => (
              <text key={`${x},${y}`} x={x} y={y + 9} textAnchor="middle" className="geo-text geo-name geo-sign">
                {sign}
              </text>
            ))}
          </>
        )}
        {points.map((p) => (
          <g key={p.name}>
            <circle cx={X(p.x)} cy={Y(p.y)} r="6" className="geo-plot-point" />
            <Label at={[X(p.x) + 10, Y(p.y) - 14]} text={p.name} anchor="start" name />
          </g>
        ))}
      </svg>
    </figure>
  );
}
