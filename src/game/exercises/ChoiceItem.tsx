import { RichText } from '../../components/math/RichText';
import { SpeakButton } from '../../components/SpeakButton';
import { Syllabified } from '../../components/Syllabified';
import { langAttr } from '../../core/speech';
import { Aid } from './Aid';
import type { AidData } from './maths';
import type { ScreenProps } from './registry';

/**
 * Écran générique « qcm » : un mot ou une phrase, des réponses à choisir.
 * Champs de l'item : prompt (ou word), choices, answer, et éventuellement spoken (texte lu).
 * Un prompt contenant « … » affiche une case à compléter. En anglais (`lang: 'en'`), le mot n'est pas découpé en
 * syllabes (le découpage suit les règles du français) et il est lu en voix anglaise. Avec `plainWord` (abattage), le mot
 * n'est pas découpé non plus : les couleurs donneraient le nombre de syllabes. Une aide (`aid`, la carte de règle de la
 * Récolte) s'affiche entre la phrase et les réponses, comme sur l'écran à règle.
 */
export function ChoiceItem({ items, answered, onAnswer, ruledOut, lang = 'fr', plainWord = false }: ScreenProps & { plainWord?: boolean }) {
  const item = items[0];
  const prompt = String(item.prompt ?? item.word ?? '');
  const choices = Array.isArray(item.choices) ? item.choices.map(String) : [];
  const answer = String(item.answer ?? '');
  const spoken = String(item.spoken ?? prompt);
  const chosen = answered?.detail?.chosen;
  const isSentence = prompt.includes('…') || prompt.length > 20;
  const choicesLang = item.choicesLang === 'fr' ? 'fr' : lang;
  const aid = item.aid as AidData | undefined;

  return (
    <div className="panel question">
      <div className="question-head">
        {isSentence || lang !== 'fr' || plainWord ? (
          <p className={`question-prompt${isSentence ? '' : ' item-word'}`} lang={langAttr(lang)}>
            <RichText text={prompt} lang={lang} />
          </p>
        ) : (
          <p className="question-prompt item-word">
            <Syllabified text={prompt} />
          </p>
        )}
        <SpeakButton text={spoken} label="Écouter" lang={lang} />
      </div>
      {aid && (
        <div className="aid calcul-aid">
          <Aid aid={aid} lang={lang} />
        </div>
      )}
      <div className={`choices${choices.every((c) => c.length <= 12) ? ' short' : ''}`} role="group" aria-label="Réponses possibles">
        {choices.map((choice) => {
          const isAnswer = answered && choice === answer;
          // Au deuxième essai, la réponse déjà tentée reste barrée.
          const isWrong = Boolean(answered && chosen === choice && choice !== answer) || Boolean(ruledOut?.includes(choice));
          return (
            <button
              key={choice}
              type="button"
              className={`choice${isAnswer ? ' right' : ''}${isWrong ? ' wrong' : ''}`}
              disabled={Boolean(answered) || Boolean(ruledOut?.includes(choice))}
              onClick={() => onAnswer({ results: [{ key: item.key, correct: choice === answer }], detail: { chosen: choice } })}
            >
              <span lang={langAttr(choicesLang)}>
                <RichText text={choice} lang={choicesLang} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
