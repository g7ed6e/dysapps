import { act, render } from '@testing-library/react';
import { lireReglages, SettingsProvider, useSettings } from './SettingsContext';
import { loadJSON, saveJSON } from './storage';
import { MESSAGE_UNIVERS_KEY } from './univers';

beforeEach(() => localStorage.clear());

it('fermé, n’écrit jamais l’univers : un appareil neuf ne reste pas figé sur un choix d’avant la bascule', () => {
  saveJSON('progress', { xp: 40, totalAnswers: 10 });
  expect('univers' in lireReglages(false).settings).toBe(false);
  render(
    <SettingsProvider>
      <p />
    </SettingsProvider>,
  );
  expect('univers' in loadJSON<Record<string, unknown>>('settings', {})).toBe(false);
  expect(loadJSON(MESSAGE_UNIVERS_KEY, null)).toBeNull();
});

it('ouvert, fige le premier univers : Blocland pour un appareil neuf, sans message', () => {
  expect(lireReglages(true)).toMatchObject({ settings: { univers: 'blocland' }, message: false });
});

it('ouvert, garde Blocland à un appareil qui a une progression, avec le message unique à dire', () => {
  saveJSON('blocland', { progress: { 'foret:sons': { stars: 2 } } });
  expect(lireReglages(true)).toMatchObject({ settings: { univers: 'blocland' }, message: true });
  // Lire ne note rien : le message se note à l'ouverture de l'application (l'effet du fournisseur).
  expect(loadJSON(MESSAGE_UNIVERS_KEY, null)).toBeNull();
});

it('ouvert, garde Blocland même à un appareil qui essayait le nouveau dessin : Archipéo ne s’active que dans les Réglages', () => {
  saveJSON('progress', { xp: 40, totalAnswers: 10 });
  saveJSON('settings', { renduArchipeo: true });
  expect(lireReglages(true)).toMatchObject({ settings: { univers: 'blocland' }, message: true });
});

it('ouvert, ne recalcule jamais un univers déjà choisi', () => {
  saveJSON('progress', { xp: 40, totalAnswers: 10 });
  saveJSON('settings', { univers: 'archipeo' });
  expect(lireReglages(true)).toMatchObject({ settings: { univers: 'archipeo' }, message: false });
});

it('« Affichage par défaut » garde l’univers', () => {
  saveJSON('settings', { univers: 'blocland', fontSize: 28 });
  let ctx: ReturnType<typeof useSettings> | null = null;
  function Espion() {
    ctx = useSettings();
    return null;
  }
  render(
    <SettingsProvider>
      <Espion />
    </SettingsProvider>,
  );
  act(() => ctx!.reset());
  expect(ctx!.settings.fontSize).toBe(20);
  expect(ctx!.settings.univers).toBe('blocland');
});
