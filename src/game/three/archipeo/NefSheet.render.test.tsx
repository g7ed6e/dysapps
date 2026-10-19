import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import { voyageId } from '../../world/archipelago';
import { planCells } from '../../world/plans';
import { VEHICLE_STAGES } from '../../world/vehicle';
import { NefSheet, nefStageOf } from './NefSheet';

const stage = VEHICLE_STAGES[0];

function show(kit: boolean, missing: number, building = stage) {
  localStorage.clear();
  localStorage.setItem('dysapps:settings', JSON.stringify({ univers: 'archipeo', autoRead: false, sounds: false }));
  // Au 5e, le voilier est parti du 6e : le dirigeable se construit à la Lisière.
  const before = VEHICLE_STAGES.filter((s) => s.stage < building.stage);
  const parts = Object.fromEntries([...before, building].map((s) => [s.id, planCells(s).map((c) => c.key)]));
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, world: { parts, links: before.map((s) => voyageId(s.to)) } }));
  const onDepart = vi.fn();
  const onMap = vi.fn();
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <NefSheet stage={building} kit={kit} missing={missing} onDepart={onDepart} onMap={onMap} onClose={() => {}} />
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

  it('au 5e, le dirigeable attend son gouvernail (GD-22, lot 4)', () => {
    const dirigeable = nefStageOf('5e');
    expect(dirigeable.stage).toBe(2);
    show(false, 2, dirigeable);
    expect(screen.getByText(/La Nef a tous ses blocs ! Achève encore 2 lieux pour fixer son gouvernail\./)).toBeTruthy();
  });
});
