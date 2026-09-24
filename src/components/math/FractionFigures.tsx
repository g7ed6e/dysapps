// Représentations d'une fraction : barre, disque, droite graduée.

/** Barre partagée en `d` parts égales, dont `n` coloriées. */
export function FractionBar({ n, d, label = true }: { n: number; d: number; label?: boolean }) {
  const w = 280 / d;
  return (
    <svg
      className="fraction-bar"
      viewBox="0 0 290 50"
      role="img"
      aria-label={label ? `Barre partagée en ${d} parts égales, ${n} coloriée${n > 1 ? 's' : ''}` : undefined}
      aria-hidden={label ? undefined : true}
    >
      {Array.from({ length: d }, (_, i) => (
        <rect key={i} x={5 + i * w} y={5} width={w} height={40} className={i < n ? 'part filled' : 'part'} />
      ))}
    </svg>
  );
}

/** Disque (pizza) partagé en `d` parts égales, dont `n` coloriées. */
export function FractionDisc({ n, d }: { n: number; d: number }) {
  const r = 60;
  const c = 70;
  const point = (i: number) => {
    const a = (i / d) * 2 * Math.PI - Math.PI / 2;
    return [c + r * Math.cos(a), c + r * Math.sin(a)];
  };
  return (
    <svg className="fraction-disc" viewBox="0 0 140 140" role="img" aria-label={`Disque partagé en ${d} parts égales, ${n} coloriée${n > 1 ? 's' : ''}`}>
      {Array.from({ length: d }, (_, i) => {
        const [x1, y1] = point(i);
        const [x2, y2] = point(i + 1);
        const large = d === 1 ? 1 : 0;
        return <path key={i} d={`M ${c} ${c} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`} className={i < n ? 'part filled' : 'part'} />;
      })}
    </svg>
  );
}

/** Deux barres de même longueur, l'une sous l'autre, pour comparer. */
export function CompareBars({ a, b }: { a: [number, number]; b: [number, number] }) {
  return (
    <div className="compare-bars">
      {[a, b].map(([n, d], i) => (
        <div key={i} className="compare-row">
          <span className="compare-label">
            {n}/{d}
          </span>
          <FractionBar n={n} d={d} />
        </div>
      ))}
    </div>
  );
}

interface LineProps {
  /** Nombre au début de la droite. */
  start: number;
  /** Nombre d'unités représentées. */
  units: number;
  /** Graduations par unité. */
  perUnit: number;
  /** Position du point, en graduations depuis le début (absent : pas de point). */
  point?: number;
  /** Libellé des nombres entiers (par défaut, le nombre). */
  format?: (n: number) => string;
}

/** Droite graduée ; seuls les entiers sont écrits, le point à trouver est marqué. */
export function GraduatedLine({ start, units, perUnit, point, format = String }: LineProps) {
  const total = units * perUnit;
  const x = (i: number) => 20 + (i / total) * 280;
  return (
    <svg
      className="graduated-line"
      viewBox="0 0 320 90"
      role="img"
      aria-label={`Droite graduée de ${format(start)} à ${format(start + units)}, chaque unité partagée en ${perUnit} parts${point !== undefined ? ', un point est marqué' : ''}`}
    >
      <line x1="10" y1="50" x2="310" y2="50" className="axis" />
      {Array.from({ length: total + 1 }, (_, i) => {
        const whole = i % perUnit === 0;
        return (
          <g key={i}>
            <line x1={x(i)} y1={whole ? 38 : 43} x2={x(i)} y2={whole ? 62 : 57} className={whole ? 'tick whole' : 'tick'} />
            {whole && (
              <text x={x(i)} y="84" textAnchor="middle" className="tick-label">
                {format(start + i / perUnit)}
              </text>
            )}
          </g>
        );
      })}
      {point !== undefined && (
        <g>
          <path d={`M ${x(point)} 36 l -8 -14 h 16 z`} className="marker" />
          <text x={x(point)} y="16" textAnchor="middle" className="marker-label">
            ?
          </text>
        </g>
      )}
    </svg>
  );
}

/** `total` points répartis en `groups` groupes égaux ; `taken` groupes mis en couleur. */
export function DotGroups({ total, groups, taken }: { total: number; groups: number; taken: number }) {
  const per = total / groups;
  return (
    <div className="dot-groups" role="img" aria-label={`${total} points partagés en ${groups} groupes de ${per}`}>
      {Array.from({ length: groups }, (_, g) => (
        <span key={g} className={`dot-group${g < taken ? ' taken' : ''}`}>
          {Array.from({ length: per }, (_, i) => (
            <span key={i} className="dot" />
          ))}
        </span>
      ))}
    </div>
  );
}
