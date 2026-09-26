import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsProvider } from '../../core/SettingsContext';
import { CalculScreen } from './CalculScreen';
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
