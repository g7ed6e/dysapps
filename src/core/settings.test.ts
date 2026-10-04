import { DEFAULT_SETTINGS, applySettings, sanitizeSettings, spacingWord, speedWord } from './settings';

describe('sanitizeSettings', () => {
  it('complète les réglages manquants', () => {
    expect(sanitizeSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it('borne les valeurs et rejette les choix inconnus', () => {
    const s = sanitizeSettings({ fontSize: 100, lineHeight: 0, theme: 'rose' as never, font: 'comic' as never });
    expect(s.fontSize).toBe(32);
    expect(s.lineHeight).toBe(DEFAULT_SETTINGS.lineHeight);
    expect(s.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(s.font).toBe(DEFAULT_SETTINGS.font);
    expect(sanitizeSettings({ worldLight: 'nuit' as never }).worldLight).toBe('real');
    expect(sanitizeSettings({ worldLight: 'day' }).worldLight).toBe('day');
  });
});

it('convertit les anciens thèmes et polices', () => {
  expect(sanitizeSettings({ theme: 'bd' as never }).theme).toBe('cream');
  expect(sanitizeSettings({ theme: 'sombre' as never }).theme).toBe('night');
  expect(sanitizeSettings({ font: 'systeme' as never }).font).toBe('arial');
});

it('lit les réglages d’avant les mots neutres sous leurs nouvelles valeurs', () => {
  const s = sanitizeSettings({ theme: 'clair', worldView: 'liste', worldLight: 'jour', lv2: 'aucune' } as never);
  expect(s).toMatchObject({ theme: 'light', worldView: 'list', worldLight: 'day', lv2: 'none' });
  expect(sanitizeSettings({ theme: 'creme', worldLight: 'reelle' } as never)).toMatchObject({ theme: 'cream', worldLight: 'real' });
  expect(sanitizeSettings({ theme: 'nuit' } as never).theme).toBe('night');
});

it('le Contraste élevé et « Réduire les animations » retirés : la Nuit, et plus de réglage des animations', () => {
  expect(sanitizeSettings({ theme: 'contraste' as never }).theme).toBe('night');
  expect(sanitizeSettings({ reduceMotion: true } as never)).not.toHaveProperty('reduceMotion');
});

it('montre le monde en 3D par défaut et lit la vue enregistrée', () => {
  expect(sanitizeSettings({}).worldView).toBe('3d');
  expect(sanitizeSettings({ worldView: 'list' }).worldView).toBe('list');
  expect(sanitizeSettings({ worldView: 'iso' as never }).worldView).toBe('3d');
});

it('remplace l’ancien choix du monde en 2D, retiré, par le monde en 3D', () => {
  expect(sanitizeSettings({ worldView: '2d' as never }).worldView).toBe('3d');
  expect(sanitizeSettings({ view3d: false, worldView: '2d' as never }).worldView).toBe('3d');
});

it('ignore l’ancien réglage « Marche libre », retiré', () => {
  const s = sanitizeSettings({ freeWalk: true } as never);
  expect('freeWalk' in s).toBe(false);
  expect(s).toEqual(sanitizeSettings({}));
});

it('convertit l’ancien interrupteur « vues en 3D »', () => {
  expect(sanitizeSettings({ view3d: false }).worldView).toBe('list');
  expect(sanitizeSettings({ view3d: true }).worldView).toBe('3d');
  expect(sanitizeSettings({ view3d: false, worldView: 'list' }).worldView).toBe('list');
  expect('view3d' in sanitizeSettings({ view3d: false })).toBe(false);
});

it('oublie les réglages de l’ancienne section Expérimental (lot 6) : l’univers choisit le rendu', () => {
  const s = sanitizeSettings({ renduArchipeo: true, styleArchipeo: 'c' } as never);
  expect('renduArchipeo' in s).toBe(false);
  expect('styleArchipeo' in s).toBe(false);
  expect('univers' in s).toBe(false);
});

it('respecte les minimums orthophoniques', () => {
  const s = sanitizeSettings({ fontSize: 12, lineHeight: 1.1 });
  expect(s.fontSize).toBe(18);
  expect(s.lineHeight).toBe(1.5);
});

describe('applySettings', () => {
  it('pose le thème et les variables CSS', () => {
    const root = document.createElement('div');
    applySettings({ ...DEFAULT_SETTINGS, theme: 'night', fontSize: 24, font: 'opendyslexic' }, root);
    expect(root.dataset.theme).toBe('night');
    expect(root.style.getPropertyValue('--font-size')).toBe('24px');
    expect(root.style.getPropertyValue('--font-family')).toContain('OpenDyslexic');
  });

  it('dit quand le texte est grand : jamais aux réglages par défaut, toujours à 24 px ou aux plus grands écarts', () => {
    const root = document.createElement('div');
    applySettings(DEFAULT_SETTINGS, root);
    expect(root.dataset.texte).toBe('normal');
    applySettings({ ...DEFAULT_SETTINGS, fontSize: 24 }, root);
    expect(root.dataset.texte).toBe('grand');
    applySettings({ ...DEFAULT_SETTINGS, letterSpacing: 0.2 }, root);
    expect(root.dataset.texte).toBe('grand');
  });

  it('pose l’univers affiché, qui choisit l’habillage : l’univers choisi, Blocland par défaut', () => {
    const root = document.createElement('div');
    applySettings({ ...DEFAULT_SETTINGS, univers: 'blocland' }, root);
    expect(root.dataset.univers).toBe('blocland');
    applySettings({ ...DEFAULT_SETTINGS, univers: 'archipeo' }, root);
    expect(root.dataset.univers).toBe('archipeo');
    // Un appareil sans univers enregistré s'habille comme l'univers par défaut.
    applySettings(DEFAULT_SETTINGS, root);
    expect(root.dataset.univers).toBe('blocland');
  });
});

it('dit les espacements et la vitesse de la voix en mots, pas en nombres', () => {
  expect(spacingWord(DEFAULT_SETTINGS.letterSpacing, DEFAULT_SETTINGS.letterSpacing, 0.2)).toBe('Normal');
  expect(spacingWord(0, DEFAULT_SETTINGS.letterSpacing, 0.2)).toBe('Plus serré');
  expect(spacingWord(0.08, 0.03, 0.2)).toBe('Un peu plus large');
  expect(spacingWord(0.14, 0.03, 0.2)).toBe('Plus large');
  expect(spacingWord(0.2, 0.03, 0.2)).toBe('Très large');
  expect(speedWord(0.5)).toBe('Lente');
  expect(speedWord(DEFAULT_SETTINGS.speechRate)).toBe('Normale');
  expect(speedWord(1.3)).toBe('Rapide');
});

it('oublie l’ancien réglage « Au démarrage » : l’appli s’ouvre toujours sur le village', () => {
  expect(sanitizeSettings({ startIn: 'menu' } as never)).not.toHaveProperty('startIn');
});

it('distingue un univers absent (avant le lot 6) d’un univers inconnu, qui vaut l’univers par défaut', () => {
  expect('univers' in sanitizeSettings({})).toBe(false);
  expect(sanitizeSettings({ univers: 'blocland' }).univers).toBe('blocland');
  expect(sanitizeSettings({ univers: 'archipeo' }).univers).toBe('archipeo');
  expect(sanitizeSettings({ univers: 'atlantide' as never }).univers).toBe('blocland');
  expect(sanitizeSettings({ univers: 'toString' as never }).univers).toBe('blocland');
  expect('univers' in DEFAULT_SETTINGS).toBe(false);
});

it('met l’espagnol en LV2 par défaut, garde l’allemand ou « Pas de LV2 » choisis, rejette une langue inconnue', () => {
  expect(sanitizeSettings({}).lv2).toBe('es');
  expect(sanitizeSettings({ lv2: 'de' }).lv2).toBe('de');
  expect(sanitizeSettings({ lv2: 'none' }).lv2).toBe('none');
  expect(sanitizeSettings({ lv2: 'it' as never }).lv2).toBe('es');
  expect(sanitizeSettings({ lv2: 'toString' as never }).lv2).toBe('es');
});
