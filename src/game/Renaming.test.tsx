import { fireEvent, render, screen } from '@testing-library/react';
import { ProgressProvider } from '../core/ProgressContext';
import { noterRenommage, SettingsProvider } from '../core/SettingsContext';
import { loadJSON, saveJSON } from '../core/storage';
import { RENOMMAGE_KEY } from '../core/universe';
import { RenamingPanel, useRenaming } from './Renaming';

beforeEach(() => localStorage.clear());

function Ecran() {
  const r = useRenaming();
  return r.ouvert ? <RenamingPanel onClose={r.fermer} /> : <p>Rien à dire</p>;
}

const monter = () =>
  render(
    <SettingsProvider>
      <ProgressProvider>
        <Ecran />
      </ProgressProvider>
    </SettingsProvider>,
  );

it('un nouvel élève ne voit jamais l’écran des nouveaux noms : il est noté dit dès le premier lancement', () => {
  monter();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(loadJSON(RENOMMAGE_KEY, null)).toEqual({ said: true });
  // Il joue ensuite : rien ne change, la note est déjà prise.
  saveJSON('progress', { xp: 40, totalAnswers: 10 });
  noterRenommage();
  expect(loadJSON(RENOMMAGE_KEY, null)).toEqual({ said: true });
});

it('un élève qui jouait déjà le voit une seule fois dans Blocland : une phrase par archipel, un seul bouton', () => {
  saveJSON('game', { progress: { 'foret:sons': { stars: 2 } } });
  const { unmount } = monter();
  expect(screen.getByRole('dialog', { name: /De nouveaux noms/ })).toBeTruthy();
  const lignes = screen.getAllByRole('listitem').map((li) => li.textContent ?? '');
  expect(lignes).toHaveLength(3);
  expect(lignes[0]).toMatch(/Premiers Rivages s.appellent maintenant les Basses Terres/);
  // Un seul bouton pour fermer (Écouter s'y ajoute là où la voix existe).
  expect(screen.getAllByRole('button').map((b) => b.textContent?.trim()).filter((t) => t !== 'Écouter')).toEqual(['D’accord']);
  fireEvent.click(screen.getByRole('button', { name: 'D’accord' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(loadJSON(RENOMMAGE_KEY, null)).toEqual({ said: true });
  unmount();
  monter();
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('Échap ferme l’écran, qui ne revient pas', () => {
  saveJSON('progress', { xp: 40, totalAnswers: 10 });
  monter();
  expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(loadJSON(RENOMMAGE_KEY, null)).toEqual({ said: true });
});

it('dans Archipéo, rien à annoncer : les noms y restent, et l’écran attend un passage par Blocland', () => {
  saveJSON('progress', { xp: 40, totalAnswers: 10 });
  saveJSON('settings', { univers: 'archipeo' });
  monter();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(loadJSON(RENOMMAGE_KEY, null)).toEqual({ said: false });
});
