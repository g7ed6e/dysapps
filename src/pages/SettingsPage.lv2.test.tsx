import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from './SettingsPage';
import { ProgressProvider } from '../core/ProgressContext';
import { SettingsProvider } from '../core/SettingsContext';

// Une synthèse vocale dont la liste des voix arrive après coup, comme sur Chrome et Android.
class FausseSynthese extends EventTarget {
  voices: SpeechSynthesisVoice[] = [];
  getVoices = () => this.voices;
  speak = vi.fn();
  cancel = vi.fn();
}

let synthese: FausseSynthese;
// Le message est découpé en syllabes : on lit le texte de son paragraphe.
const message = () => document.querySelector('.settings-note')?.textContent ?? '';

beforeEach(() => {
  localStorage.clear();
  synthese = new FausseSynthese();
  vi.stubGlobal('speechSynthesis', synthese);
  vi.stubGlobal('SpeechSynthesisUtterance', class {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it('dit qu’il manque la voix espagnole quand la liste des voix arrive sans elle, jamais avant', () => {
  render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );
  expect(screen.getByRole('button', { name: /Tester la voix espagnole/ })).toBeInTheDocument();
  // Liste pas encore chargée : on ne sait pas, on ne dit rien.
  expect(message()).not.toMatch(/pas de voix espagnole/);
  act(() => {
    synthese.voices = [{ lang: 'fr-FR', localService: true, name: 'Amélie' } as SpeechSynthesisVoice];
    synthese.dispatchEvent(new Event('voiceschanged'));
  });
  expect(message()).toMatch(/pas de voix espagnole/);
  act(() => {
    synthese.voices = [...synthese.voices, { lang: 'es-ES', localService: true, name: 'Mónica' } as SpeechSynthesisVoice];
    synthese.dispatchEvent(new Event('voiceschanged'));
  });
  expect(message()).not.toMatch(/pas de voix espagnole/);
});
