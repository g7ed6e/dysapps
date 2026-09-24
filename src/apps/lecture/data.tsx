import type { Question } from '../../components/QuizSession';
import { frenchTypography } from '../../components/math/RichText';
import rawTexts from './texts.json';

export interface ReadingText {
  id: string;
  title: string;
  author: string;
  source: string;
  /** « vers » : un segment par vers, numérotés. « prose » : un segment par phrase. */
  kind: 'vers' | 'prose';
  /** Paragraphes (ou strophes), chacun découpé en segments. */
  paragraphs: string[][];
  glossary: { word: string; definition: string }[];
  questions: { prompt: string; choices: string[]; answer: string; lines: [number, number]; explanation: string }[];
}

// Le JSON est validé par les tests (data.test.tsx).
export const TEXTS = rawTexts as unknown as ReadingText[];

export function segmentsOf(text: ReadingText): string[] {
  return text.paragraphs.flat();
}

/** Extrait cité en aide : les segments visés par la question (numérotation à partir de 1). */
function Passage({ text, from, to }: { text: ReadingText; from: number; to: number }) {
  const segs = segmentsOf(text).slice(from - 1, to);
  return (
    <blockquote className="passage">
      {segs.map((s, i) => (
        <p key={i}>
          {text.kind === 'vers' && <span className="line-number">{from + i}</span>}
          {frenchTypography(s)}
        </p>
      ))}
    </blockquote>
  );
}

export function questionsFor(text: ReadingText): Question[] {
  return text.questions.map((q, i) => {
    const [from, to] = q.lines;
    const where =
      text.kind === 'vers' ? (from === to ? `le vers ${from}` : `les vers ${from} à ${to}`) : from === to ? 'la phrase ci-dessous' : 'le passage ci-dessous';
    return {
      id: `${text.id}-${i}`,
      prompt: q.prompt,
      choices: q.choices,
      answer: q.answer,
      hint: `Relis ${where}.`,
      aid: <Passage text={text} from={from} to={to} />,
      explanation: q.explanation,
    };
  });
}
