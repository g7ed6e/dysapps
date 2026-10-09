// Aides visuelles des îles du collège, dessinées à partir de données (voir maths.ts / college.ts).

import { frenchTypography } from '../../components/math/RichText';
import { SpeakButton } from '../../components/SpeakButton';
import type { Lang } from '../../core/speech';
import { GRAPH_FRAME, type GraphFrame } from './graph';
import { motsAEcouter } from './lexicon';

/** Droite graduée d'entiers (relatifs compris), avec des points marqués et, au besoin, un bond. */
export function NumberLineInt({ min, max, points = [], jump }: { min: number; max: number; points?: number[]; jump?: [number, number] }) {
  const n = max - min;
  const x = (v: number) => 16 + ((v - min) / n) * 288;
  const every = n > 14 ? 5 : 1;
  const fmt = (v: number) => (v < 0 ? `−${String(-v).replace('.', ',')}` : String(v).replace('.', ','));
  // Le nombre de points, jamais leur valeur : lire l'abscisse d'un point est souvent la question.
  const marked = points.length === 1 ? ', un point marqué' : points.length ? `, ${points.length} points marqués` : '';
  const label = `Droite graduée de ${fmt(min)} à ${fmt(max)}${marked}${jump ? `, bond de ${fmt(jump[0])} à ${fmt(jump[1])}` : ''}`;
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

/**
 * Rappel de règle : quelques lignes courtes, toujours visibles. En anglais (`lang: 'en'`, passé par l'écran), une ligne de
 * lexique (« push = pousser, pull = tirer ») porte à sa droite un bouton Écouter qui lit ses mots anglais en voix anglaise
 * (« push, pull », voir `lexicon.ts`) ; une ligne de méthode, en français, n'en a pas.
 */
export function RuleCard({ title, lines, lang = 'fr' }: { title?: string; lines: string[]; lang?: Lang }) {
  return (
    <figure className="rule-card">
      {title && <figcaption>{title}</figcaption>}
      <ul>
        {lines.map((l, i) => {
          const mots = lang === 'en' ? motsAEcouter(l) : '';
          return (
            <li key={i}>
              {mots ? (
                <span className="rule-line-listen">
                  <span>{frenchTypography(l)}</span>
                  <SpeakButton text={mots} lang={lang} compact />
                </span>
              ) : (
                frenchTypography(l)
              )}
            </li>
          );
        })}
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
 * les deux axes fléchés à 0, un petit trait à chaque graduation, la droite épaisse et ses points aux intersections du
 * quadrillage (on ne lit jamais entre deux graduations). Les nombres sont écrits dans les marges, hors du quadrillage :
 * ceux de x en bas, ceux de f(x) à gauche. La droite et ses points restent dans le cadre : ils ne touchent jamais un
 * nombre. La légende nomme la droite ; la description donne aux lecteurs d'écran le repère et les points de la droite.
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
  const left = 42;
  const top = 30;
  const right = 34;
  const bottom = 34;
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
      <svg viewBox={`0 0 ${left + w + right} ${top + h + bottom}`} role="img" aria-label={label}>
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
        {/* Un petit trait à chaque graduation, sur les deux axes. */}
        {xs.map((v) => (
          <line key={`tx${v}`} x1={X(v)} y1={Y(y0) - 5} x2={X(v)} y2={Y(y0) + 5} className="graph-axis-tick" />
        ))}
        {ys.map((v) => (
          <line key={`ty${v}`} x1={X(x0) - 5} y1={Y(v)} x2={X(x0) + 5} y2={Y(v)} className="graph-axis-tick" />
        ))}
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
        {/* Les nombres dans les marges, hors du cadre où passent la droite et ses points : ceux de x sous le cadre, centrés
            sous leur graduation, à pas égal ; ceux de f(x) à gauche du cadre, en face de leur ligne. */}
        {xs.map((v) => (
          <text key={`lx${v}`} x={X(v)} y={Y(yMin) + 26} textAnchor="middle" className="graph-tick">
            {signed(v)}
          </text>
        ))}
        {ys.map((v) => (
          <text key={`ly${v}`} x={X(xMin) - 9} y={Y(v) + 7} textAnchor="end" className="graph-tick">
            {signed(v)}
          </text>
        ))}
      </svg>
      <figcaption>{`La droite épaisse est celle de ${name}.`}</figcaption>
    </figure>
  );
}

/** Un nombre écrit pour une opération posée : ses chiffres avant la virgule, puis ceux d'après. */
function columnsOf(n: string): { whole: string[]; decimals: string[] } {
  const [whole, decimals = ''] = n.replace(/\s/g, '').split(',');
  return { whole: [...whole], decimals: [...decimals] };
}

type Operation = '+' | '−' | '×';
/** Sous les lignes à remplir de la multiplication : elles se posent sur le cahier. */
export const POSEES_NOTE = 'Pose ces lignes sur ton cahier.';
const OPERATION_NAME = {
  '+': ['Addition posée', 'plus'],
  '−': ['Soustraction posée', 'moins'],
  '×': ['Multiplication posée', 'fois'],
} satisfies Record<Operation, [string, string]>;

/**
 * Une opération posée en colonnes (addition, soustraction, multiplication) : un chiffre par case, les unités sous les
 * unités et la virgule sous la virgule, dans une colonne à elle ; le signe devant le dernier nombre, le trait, puis le
 * résultat à trouver (« ? »). Chaque chiffre a sa case : l'espacement des lettres des Réglages ne décale pas les colonnes.
 * Une multiplication par un nombre à plusieurs chiffres dessine aussi ses lignes, une par chiffre du bas, en cases vides
 * aux bords en pointillés (un guide, pas un champ à toucher ; le nombre de cases ne dit pas le nombre de chiffres) ; la
 * ligne des dizaines porte déjà son 0, et une phrase dessous dit de les poser sur le cahier, pas en tête.
 */
export function ColumnOperation({ op, rows }: { op: Operation; rows: string[] }) {
  const numbers = rows.map(columnsOf);
  if (numbers.length === 0) return null;
  const whole = Math.max(...numbers.map((n) => n.whole.length));
  const decimals = Math.max(...numbers.map((n) => n.decimals.length));
  const lower = numbers[numbers.length - 1];
  // Les lignes de la multiplication : autant que de chiffres au nombre du bas (entier), s'il en a plus d'un.
  const partials = op === '×' && numbers.length === 2 && !decimals && lower.whole.length > 1 ? lower.whole.length : 0;
  const wholeWidth = partials ? Math.max(whole, numbers[0].whole.length + lower.whole.length) : whole;
  const width = wholeWidth + (decimals ? 1 + decimals : 0);
  const [name, word] = OPERATION_NAME[op];
  const lines = partials ? ` ${partials} lignes à poser sur ton cahier, la ligne des dizaines décalée d’un rang, avec son 0.` : '';
  const label = `${name} : ${rows.join(` ${word} `)}, ${decimals ? 'virgule sous virgule' : 'chiffre sous chiffre'}.${lines} Le résultat est à trouver.`;
  return (
    <figure className="posee">
      <div role="img" aria-label={label}>
        <table>
          <tbody>
            {numbers.map((n, i) => {
              const cells = [
                ...Array<string>(wholeWidth - n.whole.length).fill(''),
                ...n.whole,
                ...(decimals ? [n.decimals.length ? ',' : ''] : []),
                ...n.decimals,
                ...Array<string>(decimals - n.decimals.length).fill(''),
              ];
              const last = i === numbers.length - 1;
              return (
                <tr key={i} className={last ? 'posee-line' : undefined}>
                  <td className="posee-sign">{last ? op : ''}</td>
                  {cells.map((c, j) => (
                    <td key={j} className={decimals && j === wholeWidth ? 'posee-comma' : undefined}>
                      {c}
                    </td>
                  ))}
                </tr>
              );
            })}
            {Array.from({ length: partials }, (_, k) => (
              <tr key={`p${k}`} className={k === partials - 1 ? 'posee-partial posee-line' : 'posee-partial'}>
                <td className="posee-sign">{k === partials - 1 ? '+' : ''}</td>
                {Array.from({ length: width }, (_, j) => {
                  // Le décalage : la ligne des dizaines a un 0 aux unités, celle des centaines deux.
                  const shifted = j >= width - k;
                  return (
                    <td key={j} className={shifted ? undefined : 'posee-box'}>
                      {shifted ? '0' : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="posee-sign" />
              <td colSpan={width} className="posee-result unknown">
                ?
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Les cases guident, elles ne se remplissent pas à l'écran : la phrase le dit (l'aria-label aussi). */}
      {partials > 0 && (
        <figcaption className="posee-note" aria-hidden="true">
          {POSEES_NOTE}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Une division posée, en potence : le dividende à gauche, un chiffre par case (la virgule dans la sienne), le diviseur à
 * droite du trait, le quotient à trouver sous le diviseur ; avec `remainder`, le reste à trouver sous le dividende.
 */
export function LongDivision({ dividend, divisor, remainder = false }: { dividend: string; divisor: string; remainder?: boolean }) {
  const { whole, decimals } = columnsOf(dividend);
  const cells = decimals.length ? [...whole, ',', ...decimals] : whole;
  const label = `Division posée de ${dividend} par ${divisor} : ${remainder ? 'le quotient et le reste sont' : 'le quotient est'} à trouver.`;
  return (
    <figure className="posee posee-division">
      <div role="img" aria-label={label}>
        <table>
          <tbody>
            <tr>
              {cells.map((c, j) => (
                <td key={j} className={c === ',' ? 'posee-comma' : j === cells.length - 1 ? 'posee-last' : undefined}>
                  {c}
                </td>
              ))}
              <td className="posee-divisor">{divisor}</td>
            </tr>
            <tr>
              <td colSpan={cells.length} className={remainder ? 'posee-remainder' : undefined}>
                {remainder && <span className="unknown">reste ?</span>}
              </td>
              <td className="posee-quotient unknown">?</td>
            </tr>
          </tbody>
        </table>
      </div>
    </figure>
  );
}

const CLASSES = ['unités', 'mille', 'millions', 'milliards'];
const CLASS_RANKS = [
  { short: 'C', long: 'centaines' },
  { short: 'D', long: 'dizaines' },
  { short: 'U', long: 'unités' },
];

/** Le nombre rangé dans le tableau (`value`, les chiffres sans espace), ou chaque classe en lettres (`words`). */
export type ClassTableProps = { value: string; words?: undefined } | { words: string[]; value?: undefined };

/**
 * Le tableau de numération par classes (Nombres géants) : un bloc par classe (milliards, millions, mille, unités), chacun
 * coupé en centaines, dizaines, unités, un trait épais devant chaque classe sauf la première. Avec `value` (les chiffres,
 * sans espace), le nombre y est rangé, un chiffre par case ; avec `words` (une classe en lettres par bloc, de la plus
 * grande à la plus petite, vide pour une classe vide), chaque classe est écrite en lettres au-dessus de trois cases
 * vides, d'un fond uni : le nombre à écrire, trois chiffres par classe. Chaque chiffre a sa case : l'espacement des
 * lettres des Réglages ne décale pas les colonnes. Les blocs se suivent sur une ligne ; quand elle est trop étroite (un
 * téléphone aux grands réglages), une classe passe à la ligne entière, jamais un mot dans la classe voisine.
 */
export function ClassTable(props: ClassTableProps) {
  const { value, words } = props;
  const count = Math.min(CLASSES.length, words ? words.length : Math.ceil((value ?? '').length / 3));
  if (count === 0) return null;
  // Les classes de gauche à droite : des milliards (ou des millions) aux unités.
  const classes = Array.from({ length: count }, (_, i) => CLASSES[count - 1 - i]);
  const padded = (value ?? '').padStart(count * 3, ' ');
  const groups = classes.map((_, i) => padded.slice(i * 3, i * 3 + 3));
  const label = words
    ? `Tableau de numération par classes, à remplir : ${classes.map((c, i) => `${words[i] || 'rien'} dans la classe des ${c}`).join(', ')}.`
    : `Tableau de numération par classes : ${classes.map((c, i) => `classe des ${c}, ${groups[i].trim()}`).join(' ; ')}.`;
  return (
    <figure className="class-table">
      <div role="img" aria-label={label} className={`class-blocks${words ? ' class-blocks-words' : ''}`}>
        {classes.map((c, i) => (
          <div key={c} className={`class-block${i > 0 ? ' class-start' : ''}`}>
            <div className="class-name">{c}</div>
            {CLASS_RANKS.map((r) => (
              <div key={r.short} className="class-rank">
                <abbr title={r.long}>{r.short}</abbr>
              </div>
            ))}
            {words && <div className="class-word">{words[i]}</div>}
            {groups[i].split('').map((d, k) => (
              <div key={k} className={words ? 'class-digit class-box' : 'class-digit'}>
                {words ? '' : d.trim()}
              </div>
            ))}
          </div>
        ))}
      </div>
    </figure>
  );
}
