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
  });
});

it('convertit les anciens thèmes et polices', () => {
  expect(sanitizeSettings({ theme: 'bd' as never }).theme).toBe('creme');
  expect(sanitizeSettings({ theme: 'sombre' as never }).theme).toBe('nuit');
  expect(sanitizeSettings({ font: 'systeme' as never }).font).toBe('arial');
});

it('montre le monde en 3D par défaut et lit la vue enregistrée', () => {
  expect(sanitizeSettings({}).worldView).toBe('3d');
  expect(sanitizeSettings({ worldView: 'liste' }).worldView).toBe('liste');
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
  expect(sanitizeSettings({ view3d: false }).worldView).toBe('liste');
  expect(sanitizeSettings({ view3d: true }).worldView).toBe('3d');
  expect(sanitizeSettings({ view3d: false, worldView: 'liste' }).worldView).toBe('liste');
  expect('view3d' in sanitizeSettings({ view3d: false })).toBe(false);
});

it('éteint les rendus expérimentaux par défaut et rejette les styles inconnus', () => {
  expect(sanitizeSettings({}).renduArchipeo).toBe(false);
  expect(sanitizeSettings({}).styleArchipeo).toBe('textures');
  expect(sanitizeSettings({ renduArchipeo: true, styleArchipeo: 'c' })).toMatchObject({ renduArchipeo: true, styleArchipeo: 'c' });
  expect(sanitizeSettings({ renduArchipeo: 'oui' as never, styleArchipeo: 'z' as never })).toMatchObject({ renduArchipeo: false, styleArchipeo: 'textures' });
  expect(sanitizeSettings({ styleArchipeo: 'toString' as never }).styleArchipeo).toBe('textures');
});

it('respecte les minimums orthophoniques', () => {
  const s = sanitizeSettings({ fontSize: 12, lineHeight: 1.1 });
  expect(s.fontSize).toBe(18);
  expect(s.lineHeight).toBe(1.5);
});

describe('applySettings', () => {
  it('pose le thème et les variables CSS', () => {
    const root = document.createElement('div');
    applySettings({ ...DEFAULT_SETTINGS, theme: 'nuit', fontSize: 24, font: 'opendyslexic' }, root);
    expect(root.dataset.theme).toBe('nuit');
    expect(root.style.getPropertyValue('--font-size')).toBe('24px');
    expect(root.style.getPropertyValue('--font-family')).toContain('OpenDyslexic');
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

it('s’ouvre sur le village par défaut, et lit le choix « Au démarrage »', () => {
  expect(sanitizeSettings({}).startIn).toBe('village');
  expect(sanitizeSettings({ startIn: 'menu' }).startIn).toBe('menu');
  expect(sanitizeSettings({ startIn: 'plage' as never }).startIn).toBe('village');
});

it('distingue un univers absent (avant le lot 6) d’un univers inconnu, qui vaut Archipéo', () => {
  expect('univers' in sanitizeSettings({})).toBe(false);
  expect(sanitizeSettings({ univers: 'blocland' }).univers).toBe('blocland');
  expect(sanitizeSettings({ univers: 'archipeo' }).univers).toBe('archipeo');
  expect(sanitizeSettings({ univers: 'atlantide' as never }).univers).toBe('archipeo');
  expect(sanitizeSettings({ univers: 'toString' as never }).univers).toBe('archipeo');
  expect('univers' in DEFAULT_SETTINGS).toBe(false);
});
