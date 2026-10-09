import { render, screen } from '@testing-library/react';
import { SettingsProvider } from '../core/SettingsContext';
import { ForeignWordsProvider, Marked } from './ForeignWords';
import { SpeakButton } from './SpeakButton';
import { Syllabified } from './Syllabified';
import { RichText } from './math/RichText';
import type { ForeignWord } from '../core/foreignWords';

const MOTS: ForeignWord[] = [
  { word: 'rosam', lang: 'la', spoken: 'rossamm' },
  { word: 'philos', lang: 'grc-Latn', spoken: 'filoss' },
];

const avec = (ui: React.ReactNode) =>
  render(
    <SettingsProvider>
      <ForeignWordsProvider words={MOTS}>{ui}</ForeignWordsProvider>
    </SettingsProvider>,
  );

describe('les mots marqués à l’écran (principes dys, « Le latin et le grec »)', () => {
  beforeEach(() => localStorage.clear());

  it('un mot latin est marqué dans sa langue, sans syllabes colorées ; le français autour garde les siennes', () => {
    const { container } = avec(<Syllabified text="La fille aime rosam." />);
    const latin = container.querySelector('[lang="la"]');
    expect(latin?.textContent).toBe('rosam');
    expect(latin?.querySelector('.syl')).toBeNull();
    expect(container.querySelectorAll('.syllables .syl').length).toBeGreaterThan(0);
    // Ni le « lu » à l'écran, ni pour les lecteurs d'écran.
    expect(container.innerHTML).not.toContain('rossamm');
  });

  it('dans une réponse, une ligne de rappel ou un indice aussi', () => {
    const { container } = avec(
      <>
        <RichText text="philos, l’ami" />
        <Marked text="Cherche rosam dans le rappel." />
      </>,
    );
    expect([...container.querySelectorAll('[lang]')].map((e) => [e.getAttribute('lang'), e.textContent])).toEqual([
      ['grc-Latn', 'philos'],
      ['la', 'rosam'],
    ]);
    expect(screen.getByText(/Cherche/)).toBeInTheDocument();
  });

  it('hors d’une île qui en a, rien ne change', () => {
    const { container } = render(
      <SettingsProvider>
        <Syllabified text="rosam" />
      </SettingsProvider>,
    );
    expect(container.querySelector('[lang]')).toBeNull();
  });
});

describe('le bouton Écouter d’un texte écrit pour la voix', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] });
    vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(public text: string) {} });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('son nom accessible reprend le texte affiché, jamais le « lu »', () => {
    avec(<SpeakButton text="Pouélla rossamm amatt" shown="Puella rosam amat" />);
    expect(screen.getByRole('button', { name: 'Écouter : Puella rosam amat' })).toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain('rossamm');
  });
});
