import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsProvider } from '../../core/SettingsContext';
import { CalculScreen } from './CalculScreen';
import { autoReadText } from './lecture';
import { DicteeItem } from './DicteeItem';
import { QcmItem } from './QcmItem';
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

it('document en français (Tour du lecteur) : le petit texte est découpé en syllabes, une ligne par phrase', () => {
  renderScreen(
    CalculScreen,
    { question: 'Qui est « il » ?', prompt: 'Léa attend son frère.\nIl arrive en courant.', choices: ['le frère de Léa', 'Léa'], answer: 'le frère de Léa' },
    'fr',
  );
  const lines = screen.getAllByRole('listitem');
  expect(lines).toHaveLength(2);
  expect(lines.every((l) => l.querySelector('.syllables'))).toBe(true);
  // Français : aucun élément du document ne porte d'attribut de langue étrangère.
  expect(document.querySelector('.notice [lang]')).toBeNull();
});
