import { langAttr, langueVivante, pickVoice } from './speech';

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

  it('trouve l’allemand d’Allemagne et l’espagnol d’Espagne, sinon toute voix de la langue', () => {
    const lv2 = [voice('es-MX', true, 'Paulina'), voice('es-ES', false, 'Mónica'), voice('de-AT'), voice('fr-FR')];
    expect(pickVoice(lv2, 'es')?.name).toBe('Mónica');
    expect(pickVoice(lv2, 'de')?.lang).toBe('de-AT');
    expect(pickVoice([voice('fr-FR'), voice('en-GB')], 'de')).toBeUndefined();
  });

  it('comprend « en_GB » (Android)', () => {
    expect(pickVoice([voice('en-US'), voice('en_GB', false, 'Android')], 'en')?.name).toBe('Android');
  });
});

it('ne marque que le texte qui n’est pas en français', () => {
  expect(langAttr('en')).toBe('en');
  expect(langAttr('de')).toBe('de');
  expect(langAttr('es')).toBe('es');
  expect(langAttr('fr')).toBeUndefined();
  expect(langAttr(undefined)).toBeUndefined();
});

it('reconnaît les langues vivantes lues par leur voix, et rien d’autre', () => {
  expect(langueVivante('en')).toBe('en');
  expect(langueVivante('de')).toBe('de');
  expect(langueVivante('es')).toBe('es');
  expect(langueVivante('fr')).toBeUndefined();
  expect(langueVivante('toString')).toBeUndefined();
  expect(langueVivante(undefined)).toBeUndefined();
});
