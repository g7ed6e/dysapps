// La fiche d'une terre fermée (GD-20, point 3, « vraies terres ») : le nom de la terre, les icônes de ses lieux, une
// seule rangée, « Relier », son prix et ce que l'élève a ; inactive par sa forme quand il en manque, jamais retirée ;
// mise en avant pour le pont suggéré seul ; une fiche d'ordre pour une terre pas encore reliable.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import { landPrice, type LinkedLand } from '../../world/continu/lands';
import { ClosedLandSheet, afterLabel, closedLandLabel, linkLabel, linkableLabel } from './ClosedLandSheet';

function renderSheet(have: number, suggested = false, land: LinkedLand = 'cretes', after: LinkedLand | null = null) {
  const onLink = vi.fn();
  const onClose = vi.fn();
  const onAfter = vi.fn();
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <ClosedLandSheet land={land} after={after} onAfter={onAfter} price={landPrice(land)} have={have} suggested={suggested} onLink={onLink} onClose={onClose} />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
  return { onLink, onClose, onAfter };
}

it('le nom entier de la terre, l’icône de chacun de ses lieux, une seule rangée « Relier » et « 8 / 12 » dessous ; aucune mission', () => {
  renderSheet(8, false, 'couchant');
  const sheet = screen.getByRole('dialog', { name: 'Le Couchant' });
  expect(sheet.querySelectorAll('.closed-land-places li')).toHaveLength(3);
  // Le nom de chaque lieu est lu par la voix (montré au grand texte seulement).
  expect(within(sheet).getByText('Les Ruines')).toHaveClass('closed-land-place-name');
  const buttons = within(sheet).getAllByRole('button').filter((b) => b.classList.contains('closed-place-link'));
  expect(buttons).toHaveLength(1);
  expect(buttons[0]).toHaveTextContent('Relier');
  expect(buttons[0]).toHaveTextContent('12');
  expect(sheet.querySelector('.closed-place-have')).toHaveTextContent('8 / 12');
  expect(within(sheet).queryByText(/Y aller|Jouer/)).toBeNull();
});

it('quand il en manque : le bouton reste, inactif par sa forme (aria-disabled), lu avec ce qui manque, et ne relie pas', async () => {
  const user = userEvent.setup();
  const { onLink } = renderSheet(8, false, 'couchant');
  const link = screen.getByRole('button', { name: linkLabel(12, 8) });
  expect(link).toHaveAttribute('aria-disabled', 'true');
  expect(link).not.toBeDisabled();
  expect(link.getAttribute('aria-label')).toBe('Relier : 12 ressources. Tu en as 8, il en manque 4.');
  await user.click(link);
  expect(onLink).not.toHaveBeenCalled();
});

it('assez de ressources : « Relier » relie ; mis en avant pour le pont suggéré seulement', async () => {
  const user = userEvent.setup();
  const { onLink } = renderSheet(20);
  const link = screen.getByRole('button', { name: linkLabel(16, 20) });
  expect(link).not.toHaveAttribute('aria-disabled');
  expect(link).not.toHaveClass('primary');
  expect(document.querySelector('.closed-place-have')).toHaveTextContent('16 / 16');
  await user.click(link);
  expect(onLink).toHaveBeenCalledTimes(1);
});

it('le pont suggéré : « Relier » en avant', () => {
  renderSheet(16, true);
  expect(screen.getByRole('button', { name: linkLabel(16, 16) })).toHaveClass('primary');
});

it('une terre pas encore reliable : ni « Relier », ni prix, ni « 8 / 12 » ; le cadenas et la terre d’avant, qui ouvre sa fiche', async () => {
  const user = userEvent.setup();
  const { onAfter, onLink } = renderSheet(20, true, 'large', 'couchant');
  const sheet = screen.getByRole('dialog', { name: 'Le Large' });
  expect(within(sheet).queryByText('Relier')).toBeNull();
  expect(sheet.querySelector('.closed-place-have')).toBeNull();
  expect(sheet.querySelector('.closed-place-link')).toBeNull();
  expect(sheet.querySelector('.closed-place-lock')).not.toBeNull();
  const go = within(sheet).getByRole('button', { name: "Le Large : relie d'abord le Couchant." });
  expect(go.getAttribute('aria-label')).toBe(afterLabel('large', 'couchant'));
  expect(go).toHaveTextContent('Le Couchant');
  expect(go).not.toHaveClass('primary');
  await user.click(go);
  expect(onAfter).toHaveBeenCalledWith('couchant');
  expect(onLink).not.toHaveBeenCalled();
});

test('les phrases des ponts : « peut être rebâti », « fermé, le pont est à rebâtir »', () => {
  expect(linkableLabel('cretes')).toBe('Le pont des Crêtes peut être rebâti.');
  expect(linkableLabel('large')).toBe('Le pont du Large peut être rebâti.');
  expect(afterLabel('cretes', 'levant')).toBe("Les Crêtes : relie d'abord le Levant.");
  expect(closedLandLabel('couchant')).toBe('Le Couchant : fermé, le pont est à rebâtir.');
});
