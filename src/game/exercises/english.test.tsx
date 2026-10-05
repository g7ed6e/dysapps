import type { ComponentType } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsProvider } from '../../core/SettingsContext';
import { CalculScreen } from './CalculationScreen';
import { autoReadText, dicteeAutoText } from './reading';
import { RecitScreen } from './StoryScreen';
import { DicteeItem } from './DictationItem';
import { QcmItem } from './ChoiceItem';
import type { ScreenProps } from './registry';

// Les écrans en anglais : le contenu marqué `lang="en"` et lu en voix anglaise, la consigne et l'aide en français.
const utterances: { text: string; lang: string }[] = [];

beforeEach(() => {
  utterances.length = 0;
  class Utterance {
    lang = '';
    rate = 1;
    voice: unknown = null;
    constructor(public text: string) {}
  }
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
  vi.stubGlobal('speechSynthesis', {
    cancel: () => {},
    getVoices: () => [],
    speak: (u: { text: string; lang: string }) => utterances.push({ text: u.text, lang: u.lang }),
  });
});

afterEach(() => vi.unstubAllGlobals());

function renderScreen(Screen: ComponentType<ScreenProps>, item: Record<string, unknown>, lang: ScreenProps['lang']) {
  return render(
    <SettingsProvider>
      <Screen items={[{ key: 'k', ...item }]} answered={null} onAnswer={() => {}} onHelp={() => {}} level={1} exerciseId="x" lang={lang} />
    </SettingsProvider>,
  );
}

it('QCM : le mot anglais n’est pas découpé en syllabes, il est marqué et lu en anglais', async () => {
  const user = userEvent.setup();
  renderScreen(QcmItem, { prompt: 'Wednesday', choices: ['mercredi', 'jeudi'], answer: 'mercredi', choicesLang: 'fr' }, 'en');
  const prompt = screen.getByText('Wednesday');
  expect(prompt.closest('[lang="en"]')).not.toBeNull();
  expect(document.querySelector('.syllables')).toBeNull();
  // Les réponses sont en français : pas de marque anglaise.
  expect(screen.getByRole('button', { name: 'mercredi' }).querySelector('[lang="en"]')).toBeNull();
  await user.click(screen.getByRole('button', { name: /Écouter/ }));
  expect(utterances.at(-1)).toEqual({ text: 'Wednesday', lang: 'en-GB' });
});

it('calcul : énoncé et réponses en anglais, indice lu en français', async () => {
  const user = userEvent.setup();
  renderScreen(CalculScreen, { prompt: 'She … a cat.', spoken: 'She (mot manquant) a cat.', choices: ['has got', 'have got'], answer: 'has got', hint: 'Avec she : has got.' }, 'en');
  expect(screen.getByRole('button', { name: 'has got' }).querySelector('[lang="en"]')).not.toBeNull();
  await user.click(screen.getByRole('button', { name: /^Écouter/ }));
  expect(utterances.at(-1)).toEqual({ text: 'She (mot manquant) a cat.', lang: 'en-GB' });
  await user.click(screen.getByRole('button', { name: /Un indice/ }));
  await user.click(screen.getByRole('button', { name: /Écouter : Avec she/ }));
  expect(utterances.at(-1)).toEqual({ text: 'Avec she : has got.', lang: 'fr-FR' });
});

it('document : la question en français d’abord, le document en anglais, une ligne par information', async () => {
  const user = userEvent.setup();
  renderScreen(
    CalculScreen,
    {
      question: 'Quel jour la piscine est-elle fermée ?',
      prompt: 'Swimming pool\nClosed on Mondays',
      spoken: 'Swimming pool. Closed on Mondays.',
      choices: ['Le lundi', 'Le mardi'],
      answer: 'Le lundi',
      choicesLang: 'fr',
    },
    'en',
  );
  const question = document.querySelector('.notice-question')!;
  expect(question.textContent?.replace(/\s/g, '')).toBe('Queljourlapiscineest-ellefermée?');
  expect(question.closest('[lang="en"]')).toBeNull();
  // La question est en français : découpée en syllabes, comme une consigne ; le document anglais ne l'est pas.
  expect(question.querySelector('.syllables')).not.toBeNull();
  // Le document est une liste : une information par élément, annoncée comme telle par un lecteur d'écran.
  const lines = screen.getAllByRole('listitem');
  expect(lines.map((l) => l.textContent)).toEqual(['Swimming pool', 'Closed on Mondays']);
  expect(document.querySelector('.notice .syllables')).toBeNull();
  expect(lines[0].closest('[lang="en"]')).not.toBeNull();
  // La question précède le document.
  expect(question.compareDocumentPosition(lines[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  await user.click(screen.getByRole('button', { name: /^Question/ }));
  expect(utterances.at(-1)).toEqual({ text: 'Quel jour la piscine est-elle fermée\u00a0?', lang: 'fr-FR' });
  await user.click(screen.getByRole('button', { name: /^Écouter/ }));
  expect(utterances.at(-1)).toEqual({ text: 'Swimming pool. Closed on Mondays.', lang: 'en-GB' });
});

it('document avec une image (Signs) : l’emoji vient devant le document, caché aux lecteurs d’écran', () => {
  renderScreen(
    CalculScreen,
    { question: 'De quelle couleur est le chat ?', prompt: 'Lost cat\nHe is black.', image: '🐈', choices: ['Noir', 'Blanc'], answer: 'Noir', choicesLang: 'fr' },
    'en',
  );
  const picto = screen.getByText('🐈');
  expect(picto).toHaveAttribute('aria-hidden', 'true');
  expect(picto.compareDocumentPosition(screen.getAllByRole('listitem')[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it('lecture automatique : la question d’un document suit la consigne au premier écran, puis vient seule ; jamais le document', () => {
  const doc = [{ key: 'k', question: 'Quel jour la piscine est-elle fermée ?', prompt: 'Closed on Mondays', spoken: 'Closed on Mondays.' }];
  expect(autoReadText('Lis la question.', doc)).toBe('Lis la question. Quel jour la piscine est-elle fermée\u00a0?');
  expect(autoReadText(null, doc)).toBe('Quel jour la piscine est-elle fermée\u00a0?');
  expect(autoReadText(null, doc)).not.toContain('Closed');
  // Sans question, la consigne seule au premier écran, rien ensuite.
  expect(autoReadText('Choisis le mot.', [{ key: 'k', prompt: 'She … a cat.' }])).toBe('Choisis le mot.');
  expect(autoReadText(null, [{ key: 'k', prompt: 'She … a cat.' }])).toBe('');
});

it('dictée : le mot anglais est lu en voix anglaise dès l’affichage', () => {
  renderScreen(DicteeItem, { word: 'teacher', choices: ['teacher', 'ticher'], answer: 'teacher' }, 'en');
  expect(utterances.at(-1)).toEqual({ text: 'teacher', lang: 'en-GB' });
  expect(screen.getByRole('button', { name: 'teacher' })).toHaveAttribute('lang', 'en');
});

it('sans langue : rien ne change (français)', () => {
  renderScreen(QcmItem, { prompt: 'chat', choices: ['a', 'b'], answer: 'a' }, undefined);
  expect(document.querySelector('[lang="en"]')).toBeNull();
  // Le mot français, lui, est bien découpé en syllabes.
  expect(document.querySelector('.syllables')).not.toBeNull();
});

it('document en français (Observatoire des textes) : le document est le texte à lire, découpé en syllabes', () => {
  renderScreen(
    CalculScreen,
    {
      question: 'Quel jour le club se réunit-il ?',
      prompt: 'Club lecture du CDI\nLe mardi à midi',
      spoken: 'Club lecture du CDI. Le mardi à midi.',
      choices: ['le mardi', 'le jeudi'],
      answer: 'le mardi',
    },
    undefined,
  );
  const lines = screen.getAllByRole('listitem');
  expect(lines.map((l) => l.textContent?.replace(/\s/g, ''))).toEqual(['ClublectureduCDI', 'Lemardiàmidi']);
  expect(lines.every((l) => l.querySelector('.syllables'))).toBe(true);
  expect(document.querySelector('[lang="en"]')).toBeNull();
});

it('histoire à écouter : la question d’abord, l’histoire cachée jusqu’à la réponse, puis affichée pour se corriger', async () => {
  const user = userEvent.setup();
  const item = {
    key: 'k',
    question: 'Où va Sam ?',
    prompt: 'Sam is hungry.\nHe goes to the kitchen.',
    spoken: 'Sam is hungry. He goes to the kitchen.',
    choices: ['À la cuisine', 'À la piscine'],
    answer: 'À la cuisine',
    choicesLang: 'fr',
  };
  const { rerender } = render(
    <SettingsProvider>
      <RecitScreen items={[item]} answered={null} onAnswer={() => {}} onHelp={() => {}} level={1} exerciseId="x" lang="en" />
    </SettingsProvider>,
  );
  expect(screen.queryByText(/kitchen/)).toBeNull();
  expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  await user.click(screen.getByRole('button', { name: /^Écouter/ }));
  expect(utterances.at(-1)).toEqual({ text: 'Sam is hungry. He goes to the kitchen.', lang: 'en-GB' });
  rerender(
    <SettingsProvider>
      <RecitScreen
        items={[item]}
        answered={{ results: [{ key: 'k', correct: true }], detail: { chosen: 'À la cuisine' } }}
        onAnswer={() => {}}
        onHelp={() => {}}
        level={1}
        exerciseId="x"
        lang="en"
      />
    </SettingsProvider>,
  );
  const lines = screen.getAllByRole('listitem');
  expect(lines.map((l) => l.textContent)).toEqual(['Sam is hungry.', 'He goes to the kitchen.']);
  expect(lines[0].closest('[lang="en"]')).not.toBeNull();
});

it('lecture automatique d’une histoire : la question, puis l’histoire en anglais ; jamais sans le type d’écoute', () => {
  const doc = [{ key: 'k', question: 'Où va Sam ?', prompt: 'He goes to the kitchen.', spoken: 'He goes to the kitchen.' }];
  expect(autoReadText(null, doc)).toBe('Où va Sam\u00a0?');
  expect(dicteeAutoText(doc, 'en', true)).toBe('He goes to the kitchen.');
  expect(dicteeAutoText(doc, 'en')).toBe('');
});

it('histoire à écouter, sans synthèse vocale : l’histoire s’affiche tout de suite', () => {
  vi.unstubAllGlobals();
  renderScreen(RecitScreen, { question: 'Où va Sam ?', prompt: 'He goes to the kitchen.', choices: ['À la cuisine', 'À la piscine'], answer: 'À la cuisine' }, 'en');
  expect(screen.getAllByRole('listitem').map((l) => l.textContent)).toEqual(['He goes to the kitchen.']);
  expect(screen.queryByText(/Écoute l’histoire/)).toBeNull();
});

it('lexique : une ligne « mot = sens » porte un bouton qui lit ses mots anglais en voix anglaise ; une ligne de méthode non', async () => {
  const user = userEvent.setup();
  const aid = { kind: 'rule-card', props: { title: 'Lire un panneau', lines: ['Lis d’abord la question.', 'push = pousser, pull = tirer'] } };
  renderScreen(CalculScreen, { question: 'Que faut-il faire ?', prompt: 'PUSH', choices: ['Pousser', 'Tirer'], answer: 'Pousser', aid }, 'en');
  const [methode, lexique] = within(screen.getByRole('figure')).getAllByRole('listitem');
  expect(within(methode).queryByRole('button')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Écouter : push, pull' }));
  expect(utterances.at(-1)).toMatchObject({ text: 'push, pull', lang: 'en-GB' });
  expect(lexique.textContent).toBe('push = pousser, pull = tirer');
});

it('lexique en français : pas de bouton par ligne', () => {
  const aid = { kind: 'rule-card', props: { lines: ['nombre = quantité'] } };
  renderScreen(CalculScreen, { prompt: '2 + 2', choices: ['4', '5'], answer: '4', aid }, 'fr');
  expect(within(screen.getByRole('figure')).queryByRole('button')).toBeNull();
});
