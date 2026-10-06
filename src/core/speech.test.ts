import { langAttr, langueVivante, pickVoice, pourLaVoix } from './speech';

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

describe('le texte lu à voix haute', () => {
  it('recolle les milliers écrits avec une espace insécable, sans toucher aux autres espaces', () => {
    expect(pourLaVoix('3\u202f822')).toBe('3822');
    expect(pourLaVoix('1\u00a0234\u202f567 reste\u00a08')).toBe('1234567 reste\u00a08');
    expect(pourLaVoix('12 et 345')).toBe('12 et 345');
    expect(pourLaVoix('12\u00a0km')).toBe('12\u00a0km');
    expect(pourLaVoix('3\u202f82')).toBe('3\u202f82');
    // Les grands nombres (Nombres géants) : toutes les classes recollées, jusqu’aux milliards.
    expect(pourLaVoix((12345678).toLocaleString('fr-FR'))).toBe('12345678');
    expect(pourLaVoix(`Dans ${(24091000912).toLocaleString('fr-FR')}, quel est le chiffre ?`)).toBe('Dans 24091000912, quel est le chiffre ?');
    // Dans Nombres géants, les classes séparées par une espace insécable pleine, plus large : recollées aussi.
    expect(pourLaVoix('Combien de milliers y a-t-il dans 24\u00a0091\u00a0912 ?')).toBe('Combien de milliers y a-t-il dans 24091912 ?');
  });

  it('dit les siècles et « J.-C. » en mots', () => {
    expect(pourLaVoix('Au VIIIe siècle avant J.-C.')).toBe('Au huitième siècle avant Jésus-Christ.');
    // Le point de « J.-C. » qui finit la phrase reste, pour la pause.
    expect(pourLaVoix('Avant J.-C. Les Romains, après J.-C., l’Empire')).toBe('Avant Jésus-Christ. Les Romains, après Jésus-Christ, l’Empire');
    expect(pourLaVoix('Le siècle')).toBe('Le siècle');
    expect(pourLaVoix('François Ier, Louis XIV et Napoléon III')).toBe('François premier, Louis quatorze et Napoléon trois');
    // Un article devant un chiffre romain, ou une majuscule seule, ne fait pas un souverain.
    expect(pourLaVoix('Le XVIIIe siècle, la Ve République, Le IV')).toBe('Le dix-huitième siècle, la cinquième République, Le IV');
    expect(pourLaVoix('Élisabeth II')).toBe('Élisabeth deux');
    // Un « I » seul n'est pas un roi, et l'anglais garde ses lettres.
    expect(pourLaVoix('Because I missed the bus. Can I go?')).toBe('Because I missed the bus. Can I go?');
    expect(pourLaVoix('Louis XIV', 'en')).toBe('Louis XIV');
    expect(pourLaVoix('Ier siècle, IVe siècle, Ve siècle, IXe siècle')).toBe('premier siècle, quatrième siècle, cinquième siècle, neuvième siècle');
    expect(pourLaVoix('XIXe siècle, XXIe siècle')).toBe('dix-neuvième siècle, vingt-et-unième siècle');
    // Hors d'un siècle, rien ne change.
    expect(pourLaVoix('Le IIe arrondissement')).toBe('Le IIe arrondissement');
  });
});
