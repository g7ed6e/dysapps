import { fractionWords } from '../../core/fractions';
import type { Lang } from '../../core/speech';
import { frenchTypography, keepTogether } from '../../core/typography';
import { Marked } from '../ForeignWords';

/** Fraction « en colonne » : numérateur au-dessus, dénominateur en dessous. « … » = case à compléter. */
function Frac({ n, d }: { n: string; d: string }) {
  const label = n === '…' || d === '…' ? `${n === '…' ? 'combien' : n} sur ${d === '…' ? 'combien' : d}` : fractionWords(Number(n), Number(d));
  return (
    <span className="frac" role="img" aria-label={label}>
      <span className={`frac-num${n === '…' ? ' blank' : ''}`}>{n}</span>
      <span className={`frac-den${d === '…' ? ' blank' : ''}`}>{d}</span>
    </span>
  );
}

const TOKEN = /((?:\d+|…)\/(?:\d+|…)|…)/;

// La typographie française vit dans core/typography.ts (le code pur s'en sert aussi) ; on la garde ici pour les écrans.
export { frenchTypography };

/** Les morceaux d'un texte : « n/d » en fraction en colonne, « … » en case à compléter, le reste tel quel. */
function Tokens({ text }: { text: string }) {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((part, i) => {
        // Sur l'île du latin et du grec, les mots marqués s'affichent dans leur langue (../ForeignWords.tsx).
        if (i % 2 === 0)
          return part ? (
            <span key={i}>
              <Marked text={part} />
            </span>
          ) : null;
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

/**
 * Texte enrichi pour les énoncés et les réponses :
 * « n/d » devient une fraction en colonne, « … » une case à compléter bien visible. Un mot composé, une inversion
 * verbe-pronom (« est-il ») et la case avec le mot qui lui est collé (« l'… ») ne se coupent pas à l'affichage
 * (`keepTogether`) ; le texte, lui, ne change pas.
 */
export function RichText({ text, lang = 'fr' }: { text: string; lang?: Lang }) {
  // L'anglais, l'allemand et l'espagnol n'ont pas d'espace avant « ? ! : ; » : on n'y touche pas.
  const runs = keepTogether(lang === 'fr' ? frenchTypography(text) : text);
  return (
    <>
      {runs.map((run, i) =>
        run.keep ? (
          <span key={i} className="mot-lie">
            <Tokens text={run.text} />
          </span>
        ) : (
          <Tokens key={i} text={run.text} />
        ),
      )}
    </>
  );
}
