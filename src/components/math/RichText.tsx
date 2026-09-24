import { fractionWords } from '../../core/fractions';

/** Fraction « en colonne » : numérateur au-dessus, dénominateur en dessous. « … » = case à compléter. */
export function Frac({ n, d }: { n: string; d: string }) {
  const label = n === '…' || d === '…' ? `${n === '…' ? 'combien' : n} sur ${d === '…' ? 'combien' : d}` : fractionWords(Number(n), Number(d));
  return (
    <span className="frac" role="img" aria-label={label}>
      <span className={`frac-num${n === '…' ? ' blank' : ''}`}>{n}</span>
      <span className={`frac-den${d === '…' ? ' blank' : ''}`}>{d}</span>
    </span>
  );
}

const TOKEN = /((?:\d+|…)\/(?:\d+|…)|…)/;

/**
 * Texte enrichi pour les énoncés et les réponses :
 * « n/d » devient une fraction en colonne, « … » une case à compléter bien visible.
 */
export function RichText({ text }: { text: string }) {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part ? <span key={i}>{part}</span> : null;
        if (part === '…') {
          return (
            <span key={i} className="blank">
              …
            </span>
          );
        }
        const [n, d] = part.split('/');
        return <Frac key={i} n={n} d={d} />;
      })}
    </>
  );
}
