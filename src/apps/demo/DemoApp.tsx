import { QuizSession, type Question } from '../../components/QuizSession';
import { shuffle } from '../../core/random';

function makeQuestions(): Question[] {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 2 + Math.floor(Math.random() * 8);
  const product = a * b;
  return [
    {
      id: 'homophone-a',
      prompt: 'Complète : « Léa … un chat. »',
      choices: ['a', 'à'],
      answer: 'a',
      hint: 'Remplace par « avait » : « Léa avait un chat » fonctionne-t-il ?',
      explanation: 'On peut dire « Léa avait un chat », donc c’est le verbe avoir : « a » sans accent.',
    },
    {
      id: 'calcul',
      prompt: `Combien font ${a} × ${b} ?`,
      choices: shuffle([product, product + a, product - b, product + 1].filter((n, i, arr) => arr.indexOf(n) === i).map(String)),
      answer: String(product),
      hint: `C’est ${a} fois le nombre ${b}. Tu peux compter de ${b} en ${b}.`,
      explanation: `${a} × ${b} = ${product}.`,
    },
    {
      id: 'homophone-et',
      prompt: 'Complète : « Le ciel … bleu. »',
      choices: ['et', 'est'],
      answer: 'est',
      hint: 'Remplace par « était » : « Le ciel était bleu » fonctionne-t-il ?',
      explanation: 'On peut dire « Le ciel était bleu », donc c’est le verbe être : « est ».',
    },
    {
      id: 'fraction',
      prompt: 'Une pizza est coupée en 4 parts égales. Tu en manges 1. Quelle fraction as-tu mangée ?',
      choices: ['1/4', '4/1', '1/3'],
      answer: '1/4',
      hint: 'En bas, on écrit le nombre total de parts. En haut, les parts mangées.',
      explanation: '1 part sur 4 parts égales : c’est 1/4 (un quart).',
    },
  ];
}

export default function DemoApp() {
  return <QuizSession appId="demo" makeQuestions={makeQuestions} />;
}
