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
        viewBox="-70 0 390 210"
        role="img"
        aria-label={`Triangle ABC, M sur [AB], N sur [AC], (MN) parallèle à (BC). AM = ${am}, AB = ${ab}, AN = ${an}, AC = ${ac}`}
      >
        {/* A en haut, B et C en bas : M sur [AB] (le côté gauche), N sur [AC], (MN) parallèle à (BC). */}
        <polygon points="40,20 40,180 300,180" className="tri" />
        <line x1="40" y1="100" x2="170" y2="100" className="par" />
        <line x1="40" y1="180" x2="300" y2="180" className="par" />
        <text x="26" y="18" className="pt">
          A
        </text>
        <text x="26" y="196" className="pt">
          B
        </text>
        <text x="304" y="196" className="pt">
          C
        </text>
        <text x="26" y="104" className="pt">
          M
        </text>
        <text x="176" y="96" className="pt">
          N
        </text>
        <text x="48" y="90" className="len">{`AM = ${am}`}</text>
        <text x="22" y="146" textAnchor="end" className="len">{`AB = ${ab}`}</text>
        <text x="98" y="42" className="len">{`AN = ${an}`}</text>
        {/* AC au milieu de tout le côté, pas le long de [NC] seul. */}
        <text x="186" y="80" className="len hyp">{`AC = ${ac}`}</text>
      </svg>
    </figure>
  );
}

/**
 * Petite série en barres, avec une valeur repère (moyenne, médiane) tracée. Avec `labels`, c'est un diagramme en
 * barres : chaque barre porte le nom de sa réponse, puis son effectif écrit en chiffres.
 */
export function BarList({ values, labels: given, mark, markLabel }: { values: number[]; labels?: string[]; mark?: number; markLabel?: string }) {
  const max = Math.max(...values, mark ?? 0);
  // Un nom par barre, ou aucun : une liste qui ne correspond pas donne l'aide sans noms.
  const labels = given && given.length === values.length ? given : undefined;
  const described = labels
    ? `Diagramme en barres : ${values.map((v, i) => `${labels[i]}, ${v}`).join(' ; ')}`
    : `${values.length} valeurs : ${values.join(', ')}`;
  return (
    <figure className={labels ? 'bar-list labelled' : 'bar-list'}>
      <div role="img" aria-label={`${described}${mark !== undefined ? ` ; ${markLabel} : ${mark}` : ''}`}>
        {values.map((v, i) => (
          <div key={i} className="bar-row">
            {labels && <span className="bar-label">{labels[i]}</span>}
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

/** « −3 » avec le vrai signe moins. */
const signed = (v: number) => (v < 0 ? `−${-v}` : String(v));

/** Le cadre d'un graphique : de xMin à xMax sur l'axe horizontal, de yMin à yMax sur l'axe vertical, entiers. */
export interface GraphFrame {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/** Le cadre des graphiques du Phare : x et f(x) de −4 à 4, une graduation par unité (défini ici seulement). */
export const GRAPH_FRAME: GraphFrame = { xMin: -4, xMax: 4, yMin: -4, yMax: 4 };

/** Une droite y = ax + b dans son cadre. */
type FramedLine = { a: number; b: number } & GraphFrame;

/** Les points du quadrillage par où passe la droite y = ax + b, dans le cadre (x entier, y entier). */
export function graphPoints({ a, b, xMin, xMax, yMin, yMax }: FramedLine): [number, number][] {
  const out: [number, number][] = [];
  for (let x = xMin; x <= xMax; x++) {
    const y = a * x + b;
    if (Number.isInteger(y) && y >= yMin && y <= yMax) out.push([x, y]);
  }
  return out;
}

/** Le morceau de la droite y = ax + b qui tient dans le cadre (deux extrémités), ou `null` si elle n'y passe pas. */
export function graphSegment({ a, b, xMin, xMax, yMin, yMax }: FramedLine): [[number, number], [number, number]] | null {
  let lo = xMin;
  let hi = xMax;
  if (a === 0) {
    if (b < yMin || b > yMax) return null;
  } else {
    const [p, q] = [(yMin - b) / a, (yMax - b) / a].sort((u, v) => u - v);
    lo = Math.max(lo, p);
    hi = Math.min(hi, q);
  }
  if (lo > hi) return null;
  return [
    [lo, a * lo + b],
    [hi, a * hi + b],
  ];
}

/**
 * Le graphique d'une fonction affine f(x) = ax + b dans un repère : un quadrillage discret d'une graduation par unité,
 * les deux axes fléchés, tous les nombres écrits le long des axes, la droite épaisse et ses points aux intersections du
 * quadrillage (on ne lit jamais entre deux graduations). La légende nomme la droite ; la description donne aux lecteurs
 * d'écran le repère et les points de la droite, ceux que l'on voit.
 */
export function Graph({
  a,
  b,
  xMin = GRAPH_FRAME.xMin,
  xMax = GRAPH_FRAME.xMax,
  yMin = GRAPH_FRAME.yMin,
  yMax = GRAPH_FRAME.yMax,
  name = 'f',
}: { a: number; b: number; name?: string } & Partial<GraphFrame>) {
  const cell = 36;
  const left = 34;
  const top = 30;
  const w = (xMax - xMin) * cell;
  const h = (yMax - yMin) * cell;
  const X = (v: number) => left + (v - xMin) * cell;
  const Y = (v: number) => top + (yMax - v) * cell;
  // Les axes passent par 0, ou longent le bord du cadre quand 0 n'y est pas.
  const x0 = Math.min(Math.max(0, xMin), xMax);
  const y0 = Math.min(Math.max(0, yMin), yMax);
  const frame = { a, b, xMin, xMax, yMin, yMax };
  const points = graphPoints(frame);
  const segment = graphSegment(frame);
  const xs = Array.from({ length: xMax - xMin + 1 }, (_, i) => xMin + i);
  const ys = Array.from({ length: yMax - yMin + 1 }, (_, i) => yMin + i);
  const label =
    `Graphique de la fonction ${name} dans un repère : x de ${signed(xMin)} à ${signed(xMax)}, ${name}(x) de ${signed(yMin)} à ${signed(yMax)}, ` +
    `une graduation par unité. La droite de ${name} passe par les points ${points.map(([x, y]) => `(${signed(x)} ; ${signed(y)})`).join(', ')}.`;
  return (
    <figure className="graph">
      <svg viewBox={`0 0 ${left + w + 34} ${top + h + 26}`} role="img" aria-label={label}>
        <defs>
          <marker id="graph-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="graph-arrow" />
          </marker>
        </defs>
        {xs.map((v) => (
          <line key={`gx${v}`} x1={X(v)} y1={Y(yMax)} x2={X(v)} y2={Y(yMin)} className="graph-grid" />
        ))}
        {ys.map((v) => (
          <line key={`gy${v}`} x1={X(xMin)} y1={Y(v)} x2={X(xMax)} y2={Y(v)} className="graph-grid" />
        ))}
        <line x1={X(xMin)} y1={Y(y0)} x2={X(xMax) + 20} y2={Y(y0)} className="graph-axis" markerEnd="url(#graph-arrow)" />
        <line x1={X(x0)} y1={Y(yMin)} x2={X(x0)} y2={Y(yMax) - 20} className="graph-axis" markerEnd="url(#graph-arrow)" />
        <text x={X(xMax) + 22} y={Y(y0) - 8} textAnchor="end" className="graph-name">
          x
        </text>
        <text x={X(x0) + 8} y={Y(yMax) - 12} className="graph-name">
          {`${name}(x)`}
        </text>
        {segment && <line x1={X(segment[0][0])} y1={Y(segment[0][1])} x2={X(segment[1][0])} y2={Y(segment[1][1])} className="graph-line" />}
        {points.map(([x, y]) => (
          <circle key={`p${x}`} cx={X(x)} cy={Y(y)} r="5" className="graph-point" />
        ))}
        {/* Les nombres par-dessus la droite (leur halo la coupe) ; sur l'axe horizontal, tous centrés sous leur graduation, à
            pas égal, 0 compris : écrit à part, près d'un −1, il se lirait « −10 ». Le 0 n'est pas répété sur l'axe vertical. */}
        {/* Le 0 de l'origine sur un fond plein : ni l'axe vertical ni la droite ne le barrent. */}
        {x0 === 0 && y0 === 0 && <rect x={X(0) - 10} y={Y(0) + 5} width="20" height="24" className="graph-tick-bg" />}
        {xs.map((v) => (
          <text key={`lx${v}`} x={X(v)} y={Y(y0) + 24} textAnchor="middle" className="graph-tick">
            {signed(v)}
          </text>
        ))}
        {ys
          .filter((v) => !(v === 0 && x0 === 0 && y0 === 0))
          .map((v) => (
            <text key={`ly${v}`} x={X(x0) - 6} y={Y(v) + 7} textAnchor="end" className="graph-tick">
              {signed(v)}
            </text>
          ))}
      </svg>
      <figcaption>{`La droite épaisse est celle de ${name}.`}</figcaption>
    </figure>
  );
}
