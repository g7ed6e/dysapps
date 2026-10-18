import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import { planCells } from '../../world/plans';
import { VEHICLE_STAGES } from '../../world/vehicle';
import { NefSheet } from './NefSheet';

const stage = VEHICLE_STAGES[0];

function show(kit: boolean, missing: number) {
  localStorage.clear();
  localStorage.setItem('dysapps:settings', JSON.stringify({ univers: 'archipeo', autoRead: false, sounds: false }));
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, world: { parts: { [stage.id]: planCells(stage).map((c) => c.key) }, links: [] } }));
  const onDepart = vi.fn();
  const onMap = vi.fn();
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <NefSheet kit={kit} missing={missing} onDepart={onDepart} onMap={onMap} onClose={() => {}} />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
  return { onDepart, onMap };
}

describe('la fiche de la Nef du monde continu (GD-21)', () => {
  it('attend sa voile : le nombre de lieux à achever, et la Carte à la place de l’action', async () => {
    const { onMap, onDepart } = show(false, 1);
    expect(screen.getByText(/La Nef a tous ses blocs ! Achève encore 1 lieu pour hisser sa voile\./)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Partir/ })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /Carte/ }));
    expect(onMap).toHaveBeenCalled();
    expect(onDepart).not.toHaveBeenCalled();
  });

  it('prête : « Partir » seulement au toucher du bouton', async () => {
    const { onDepart } = show(true, 0);
    await userEvent.click(screen.getByRole('button', { name: /Partir/ }));
    expect(onDepart).toHaveBeenCalledWith(stage);
  });
});
