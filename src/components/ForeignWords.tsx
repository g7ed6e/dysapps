// Les mots marqués d'une île (le latin, le grec transcrit, une langue vivante citée : src/core/foreignWords.ts) pendant
// qu'on y joue : les textes affichés les marquent dans leur langue, sans syllabes colorées, et la voix les dit comme
// l'écrit leur « lu », jamais affiché.
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { oublierMotsEtrangers, retenirMotsEtrangers, splitForeignWords, type ForeignWord } from '../core/foreignWords';

const ForeignWordsContext = createContext<readonly ForeignWord[] | undefined>(undefined);

/** Les mots marqués de l'île où l'on joue, ou `undefined`. */
export function useForeignWords(): readonly ForeignWord[] | undefined {
  return useContext(ForeignWordsContext);
}

/**
 * Pose les mots marqués d'une île pour l'affichage (ce contexte) et pour la voix (`retenirMotsEtrangers`), le temps d'y
 * jouer. La voix les reçoit avant le premier rendu des enfants, comme les réglages (`retenirReglages`) : la consigne lue
 * dès l'ouverture de l'écran les a déjà. Au démontage, l'oubli attend la fin des effets (`oublierMotsEtrangers`).
 */
export function ForeignWordsProvider({ words, children }: { words: readonly ForeignWord[] | undefined; children: ReactNode }) {
  retenirMotsEtrangers(words);
  useEffect(() => {
    retenirMotsEtrangers(words);
    return oublierMotsEtrangers;
  }, [words]);
  return <ForeignWordsContext.Provider value={words?.length ? words : undefined}>{children}</ForeignWordsContext.Provider>;
}

/** Un mot marqué : dans sa langue pour les lecteurs d'écran et la césure, sans syllabes colorées. */
export function ForeignWordSpan({ text, lang }: { text: string; lang: string }) {
  return (
    <span lang={lang} className="foreign-word">
      {text}
    </span>
  );
}

/** Un texte sans syllabes colorées, ses mots marqués dans leur langue (une ligne de rappel, un indice). */
export function Marked({ text }: { text: string }) {
  const words = useForeignWords();
  const runs = splitForeignWords(text, words);
  if (runs.length === 1 && !runs[0].word) return <>{text}</>;
  return <>{runs.map((r, i) => (r.word ? <ForeignWordSpan key={i} text={r.text} lang={r.word.lang} /> : r.text))}</>;
}
