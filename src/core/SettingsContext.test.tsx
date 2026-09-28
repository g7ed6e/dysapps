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

it('ouvert, fige le premier univers : Archipéo pour un appareil neuf', () => {
  expect(lireReglages(true)).toMatchObject({ settings: { univers: 'archipeo' }, message: false });
});

it('ouvert, garde Blocland à un appareil qui a une progression, avec le message unique à dire', () => {
  saveJSON('blocland', { progress: { 'foret:sons': { stars: 2 } } });
  expect(lireReglages(true)).toMatchObject({ settings: { univers: 'blocland' }, message: true });
  // Lire ne note rien : le message se note à l'ouverture de l'application (l'effet du fournisseur).
  expect(loadJSON(MESSAGE_UNIVERS_KEY, null)).toBeNull();
});

it('ouvert, passe à Archipéo sans message un appareil qui essayait déjà le nouveau dessin', () => {
  saveJSON('progress', { xp: 40, totalAnswers: 10 });
  saveJSON('settings', { renduArchipeo: true });
  expect(lireReglages(true)).toMatchObject({ settings: { univers: 'archipeo' }, message: false });
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
