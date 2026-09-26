import { langAttr, pickVoice } from './speech';

const voice = (lang: string, localService = false, name = lang) => ({ lang, localService, name }) as SpeechSynthesisVoice;

describe('choix de la voix', () => {
  const voices = [voice('en-US', true), voice('fr-CA', true), voice('en-GB'), voice('fr-FR'), voice('fr-FR', true, 'Amélie'), voice('en-GB', true, 'Daniel')];

  it('prend l’accent attendu, installée sur l’appareil de préférence', () => {
    expect(pickVoice(voices, 'fr')?.name).toBe('Amélie');
    expect(pickVoice(voices, 'en')?.name).toBe('Daniel');
  });

  it('se rabat sur toute voix de la langue, jamais sur une autre langue', () => {
    expect(pickVoice([voice('fr-FR'), voice('en-US')], 'en')?.lang).toBe('en-US');
    expect(pickVoice([voice('fr-FR')], 'en')).toBeUndefined();
  });

  it('comprend « en_GB » (Android)', () => {
    expect(pickVoice([voice('en-US'), voice('en_GB', false, 'Android')], 'en')?.name).toBe('Android');
  });
});

it('ne marque que le texte qui n’est pas en français', () => {
  expect(langAttr('en')).toBe('en');
  expect(langAttr('fr')).toBeUndefined();
  expect(langAttr(undefined)).toBeUndefined();
});
