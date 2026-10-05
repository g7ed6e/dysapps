import { act, render } from '@testing-library/react';
import { lireReglages, SettingsProvider, useSettings } from './SettingsContext';
import { loadJSON, saveJSON } from './storage';
import { MESSAGE_UNIVERS_KEY } from './universe';

beforeEach(() => localStorage.clear());

it('fige le premier univers : Blocland pour un appareil neuf, sans message', () => {
  expect(lireReglages()).toMatchObject({ settings: { univers: 'blocland' }, message: false });
});

it('garde Blocland à un appareil qui a une progression, sans message : Archipéo n’est pas mis en avant', () => {
  saveJSON('game', { progress: { 'foret:sons': { stars: 2 } } });
  expect(lireReglages()).toMatchObject({ settings: { univers: 'blocland' }, message: false });
  expect(loadJSON(MESSAGE_UNIVERS_KEY, null)).toBeNull();
});

it('garde Blocland même à un appareil qui essayait l’ancienne section Expérimental : Archipéo ne s’active que dans les Réglages', () => {
  saveJSON('progress', { xp: 40, totalAnswers: 10 });
  saveJSON('settings', { renduArchipeo: true });
  expect(lireReglages()).toMatchObject({ settings: { univers: 'blocland' }, message: false });
});

it('ne recalcule jamais un univers déjà choisi', () => {
  saveJSON('progress', { xp: 40, totalAnswers: 10 });
  saveJSON('settings', { univers: 'archipeo' });
  expect(lireReglages()).toMatchObject({ settings: { univers: 'archipeo' }, message: false });
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
