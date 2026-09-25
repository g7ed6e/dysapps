// Aides visuelles des îles du collège, dessinées à partir de données (voir maths.ts / college.ts).

/** Droite graduée d'entiers (relatifs compris), avec des points marqués et, au besoin, un bond. */
export function NumberLineInt({ min, max, points = [], jump }: { min: number; max: number; points?: number[]; jump?: [number, number] }) {
  const n = max - min;
  const x = (v: number) => 16 + ((v - min) / n) * 288;
  const every = n > 14 ? 5 : 1;
  const fmt = (v: number) => (v < 0 ? `−${-v}` : String(v));
  const label = `Droite graduée de ${fmt(min)} à ${fmt(max)}${points.length ? `, points marqués : ${points.map(fmt).join(', ')}` : ''}${jump ? `, bond de ${fmt(jump[0])} à ${fmt(jump[1])}` : ''}`;
  return (
    <figure className="number-line int-line">
      <svg viewBox="0 0 320 80" role="img" aria-label={label}>
        <line x1="8" y1="50" x2="312" y2="50" stroke="currentColor" strokeWidth="3" />
        {Array.from({ length: n + 1 }, (_, i) => {
          const v = min + i;
          const big = v % every === 0;
          return (
            <g key={v}>
              <line x1={x(v)} y1={big ? 42 : 46} x2={x(v)} y2={big ? 58 : 54} stroke="currentColor" strokeWidth={v === 0 ? 4 : 2} />
              {big && (
                <text x={x(v)} y="74" textAnchor="middle" className="tick-label">
                  {fmt(v)}
                </text>
              )}
            </g>
          );
        })}
        {jump && (
          <path
            d={`M ${x(jump[0])} 44 Q ${(x(jump[0]) + x(jump[1])) / 2} 8 ${x(jump[1])} 44`}
            fill="none"
            stroke="var(--violet)"
            strokeWidth="3"
            markerEnd="url(#arrow)"
          />
        )}
        {points.map((p, i) => (
          <circle key={i} cx={x(p)} cy="50" r="7" className={`int-point p${i}`} />
        ))}
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--violet)" />
          </marker>
        </defs>
      </svg>
    </figure>
  );
}

/** Tableau de proportionnalité (ou tableau de valeurs) : une case « ? » à trouver. */
export function RatioTable({ cols, rows, caption }: { cols: string[]; rows: (string | number)[][]; caption?: string }) {
  return (
    <figure className="ratio-table">
      <table>
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th key={i} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j} className={v === '?' ? 'unknown' : undefined}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** Rappel de règle : quelques lignes courtes, toujours visibles. */
export function RuleCard({ title, lines }: { title?: string; lines: string[] }) {
  return (
    <figure className="rule-card">
      {title && <figcaption>{title}</figcaption>}
      <ul>
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </figure>
  );
}

/** Triangle rectangle en A, codé : côtés AB (a), AC (b), hypoténuse BC (c) ; un côté peut être « ? ». */
export function RightTriangle({
  a,
  b,
  c,
  labels = ['A', 'B', 'C'],
  angle,
}: {
  a: number | string;
  b: number | string;
  c: number | string;
  labels?: string[];
  angle?: string;
}) {
  const [A, B, C] = labels;
  return (
    <figure className="right-triangle">
      <svg viewBox="0 0 320 200" role="img" aria-label={`Triangle ${A}${B}${C} rectangle en ${A} : ${A}${B} = ${a}, ${A}${C} = ${b}, ${B}${C} = ${c}`}>
        <polygon points="40,170 280,170 40,30" className="tri" />
        <polyline points="40,150 60,150 60,170" className="right-mark" />
        {angle && <path d={angle === 'B' ? 'M 250 170 A 30 30 0 0 0 256 156' : 'M 40 60 A 30 30 0 0 1 58 45'} className="angle-mark" />}
        <text x="30" y="188" className="pt">
          {A}
        </text>
        <text x="284" y="188" className="pt">
          {B}
        </text>
        <text x="30" y="24" className="pt">
          {C}
        </text>
        <text x="160" y="192" textAnchor="middle" className="len">
          {a}
        </text>
        <text x="22" y="105" textAnchor="middle" className="len" transform="rotate(-90 22 105)">
          {b}
        </text>
        <text x="175" y="90" textAnchor="middle" className="len hyp">
          {c}
        </text>
      </svg>
    </figure>
  );
}

/** Configuration de Thalès : deux triangles emboîtés, (MN) parallèle à (BC), longueurs codées. */
export function ThalesFigure({ am, ab, an, ac }: { am: string; ab: string; an: string; ac: string }) {
  return (
    <figure className="thales-figure">
      <svg
        viewBox="0 0 320 200"
        role="img"
        aria-label={`Triangle ABC, M sur [AB], N sur [AC], (MN) parallèle à (BC). AM = ${am}, AB = ${ab}, AN = ${an}, AC = ${ac}`}
      >
        <polygon points="40,180 300,180 40,20" className="tri" />
        <line x1="40" y1="100" x2="170" y2="100" className="par" />
        <line x1="40" y1="180" x2="300" y2="180" className="par" />
        <text x="26" y="188" className="pt">
          A
        </text>
        <text x="304" y="188" className="pt">
          B
        </text>
        <text x="26" y="18" className="pt">
          C
        </text>
        <text x="176" y="96" className="pt">
          N
        </text>
        <text x="26" y="104" className="pt">
          M
        </text>
        <text x="24" y="145" textAnchor="middle" className="len" transform="rotate(-90 24 145)">{`AM = ${am}`}</text>
        <text x="170" y="196" textAnchor="middle" className="len">{`AB = ${ab}`}</text>
        <text x="110" y="92" textAnchor="middle" className="len">{`AN = ${an}`}</text>
        <text x="190" y="60" textAnchor="middle" className="len hyp">{`AC = ${ac}`}</text>
      </svg>
    </figure>
  );
}

/** Petite série en barres, avec une valeur repère (moyenne, médiane) tracée. */
export function BarList({ values, mark, markLabel }: { values: number[]; mark?: number; markLabel?: string }) {
  const max = Math.max(...values, mark ?? 0);
  return (
    <figure className="bar-list">
      <div role="img" aria-label={`${values.length} valeurs : ${values.join(', ')}${mark !== undefined ? ` ; ${markLabel} : ${mark}` : ''}`}>
        {values.map((v, i) => (
          <div key={i} className="bar-row">
            <span className="bar-value">{v}</span>
            <span className="bar" style={{ width: `${(v / max) * 100}%` }} />
          </div>
        ))}
        {mark !== undefined && (
          <div className="bar-row bar-mark">
            <span className="bar-value">{markLabel}</span>
            <span className="bar mark" style={{ width: `${(mark / max) * 100}%` }} />
          </div>
        )}
      </div>
    </figure>
  );
}
