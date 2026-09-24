import { DEFAULT_SETTINGS, applySettings, sanitizeSettings } from './settings';

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

it('active la vue 3D par défaut et lit la préférence enregistrée', () => {
  expect(sanitizeSettings({}).view3d).toBe(true);
  expect(sanitizeSettings({ view3d: false }).view3d).toBe(false);
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
