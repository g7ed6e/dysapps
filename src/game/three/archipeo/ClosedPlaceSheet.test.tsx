// La fiche d'un lieu fermé (GD-20, point 3, lot 1 « Relier ») : une seule rangée, « Relier », son prix et ce que
// l'élève a ; inactive par sa forme quand il en manque, jamais retirée ; mise en avant pour la liaison suggérée seule.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import { placeById } from '../../world/continu/plan6e';
import { ClosedPlaceSheet, linkLabel } from './ClosedPlaceSheet';

function renderSheet(have: number, suggested = false) {
  const onLink = vi.fn();
  const onClose = vi.fn();
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <ClosedPlaceSheet place={placeById('filets')} price={4} have={have} suggested={suggested} onLink={onLink} onClose={onClose} />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
  return { onLink, onClose, sheet: screen.getByRole('dialog', { name: 'Les Filets' }) };
}

it('le nom entier du lieu, une seule rangée « Relier » et « 3 / 4 » dessous ; aucune mission', () => {
  const { sheet } = renderSheet(3);
  const buttons = within(sheet).getAllByRole('button').filter((b) => b.classList.contains('closed-place-link'));
  expect(buttons).toHaveLength(1);
  expect(buttons[0]).toHaveTextContent('Relier');
  expect(buttons[0]).toHaveTextContent('4');
  expect(sheet.querySelector('.closed-place-have')).toHaveTextContent('3 / 4');
  expect(within(sheet).queryByText(/Y aller|Jouer/)).toBeNull();
});

it('quand il en manque : le bouton reste, inactif par sa forme (aria-disabled), lu avec ce qui manque, et ne relie pas', async () => {
  const user = userEvent.setup();
  const { onLink, sheet } = renderSheet(3);
  const link = within(sheet).getByRole('button', { name: linkLabel(4, 3) });
  expect(link).toHaveAttribute('aria-disabled', 'true');
  expect(link).not.toBeDisabled();
  expect(link.getAttribute('aria-label')).toBe('Relier : 4 ressources. Tu en as 3, il en manque 1.');
  await user.click(link);
  expect(onLink).not.toHaveBeenCalled();
});

it('assez de ressources : « Relier » relie ; mis en avant pour la liaison suggérée seulement', async () => {
  const user = userEvent.setup();
  const { onLink, sheet } = renderSheet(6);
  const link = within(sheet).getByRole('button', { name: linkLabel(4, 6) });
  expect(link).not.toHaveAttribute('aria-disabled');
  expect(link).not.toHaveClass('primary');
  expect(sheet.querySelector('.closed-place-have')).toHaveTextContent('4 / 4');
  await user.click(link);
  expect(onLink).toHaveBeenCalledTimes(1);
});

it('la liaison suggérée : « Relier » en avant', () => {
  const { sheet } = renderSheet(4, true);
  expect(within(sheet).getByRole('button', { name: linkLabel(4, 4) })).toHaveClass('primary');
});
