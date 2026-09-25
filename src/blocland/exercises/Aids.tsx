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
