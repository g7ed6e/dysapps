import { digitsOf } from './decimal';

const INT_COLS = [
  { short: 'C', long: 'centaines' },
  { short: 'D', long: 'dizaines' },
  { short: 'U', long: 'unités' },
];
const DEC_COLS = [
  { short: 'd', long: 'dixièmes' },
  { short: 'c', long: 'centièmes' },
  { short: 'm', long: 'millièmes' },
];

interface Props {
  /** Nombres en millièmes, un par ligne. */
  rows: number[];
  /** Complète avec des 0 grisés pour aligner les parties décimales (aide à la comparaison). */
  padZeros?: boolean;
  caption?: string;
}

/** Tableau de numération avec la virgule matérialisée entre unités et dixièmes. */
export function DecimalTable({ rows, padZeros = false, caption }: Props) {
  const digits = rows.map(digitsOf);
  const decLength = Math.max(1, ...digits.map((d) => d.dec.length));
  return (
    <figure className="place-table decimal-table">
      <table>
        <caption className="visually-hidden">Tableau de numération</caption>
        <thead>
          <tr>
            {[...INT_COLS, ...DEC_COLS].map((c, i) => (
              <th key={c.short} scope="col" className={i === 2 ? 'comma-col' : i > 2 ? 'dec-col' : undefined}>
                <abbr title={c.long}>{c.short}</abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {digits.map(({ int, dec }, r) => {
            const intCells = int.padStart(3, ' ').slice(-3).split('');
            const decCells = Array.from({ length: 3 }, (_, i) => {
              if (i < dec.length) return { d: dec[i], faded: false };
              if (padZeros && i < decLength) return { d: '0', faded: true };
              return { d: '', faded: false };
            });
            return (
              <tr key={r}>
                {intCells.map((d, i) => (
                  <td key={i} className={i === 2 ? 'comma-col' : undefined}>
                    {d.trim()}
                  </td>
                ))}
                {decCells.map((c, i) => (
                  <td key={i} className={`dec-col${c.faded ? ' faded' : ''}`}>
                    {c.d}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
