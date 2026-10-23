// La fiche de la Nef au repos du 3e (GD-25) : la figure de proue, puis le pavois, se posent avec « Poser » ; les feux
// attendent des lieux avec « Carte » ; à la fin, « La Nef est complète. », sans bouton ; jamais « Partir ».
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import { NEF_PARURES_ID, NEF_PARURES_PLAN, paruresFeux, paruresLook } from '../../world/nefParures';
import { planCells } from '../../world/plans';
import { NefParuresSheet } from './NefSheet';

const keys = planCells(NEF_PARURES_PLAN).map((c) => c.key);

function show(posed: readonly string[], stock: Record<string, number>, achieved: number) {
  localStorage.clear();
  localStorage.setItem('dysapps:settings', JSON.stringify({ univers: 'archipeo', autoRead: false, sounds: false }));
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 5, stock, world: { parts: { [NEF_PARURES_ID]: posed }, links: [] } }));
  const feux = paruresFeux({}, achieved);
  const look = paruresLook({ [NEF_PARURES_ID]: posed }, {}, achieved);
  const onMap = vi.fn();
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <NefParuresSheet look={look} feux={feux.kit} missing={feux.missing} onMap={onMap} onClose={() => {}} />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
  return { onMap };
}

const said = (selector: string) => document.querySelector(`#panneau-nef ${selector}`)?.textContent?.replace(/[  ]/g, ' ').trim();
const done = () => [...document.querySelectorAll('.nef-pastille')].map((p) => (p.classList.contains('faite') ? 'faite' : p.classList.contains('en-cours') ? 'en-cours' : 'a-venir'));

describe('la fiche de la Nef au repos du 3e (GD-25)', () => {
  it('rien de posé : la figure de proue, sa jauge, le marbre qui manque et où le gagner', () => {
    show([], { 'maths-3e-geometry': 2 }, 0);
    expect(screen.getByRole('heading', { name: 'La Nef' })).toBeTruthy();
    expect(done()).toEqual(['en-cours', 'a-venir', 'a-venir']);
    expect(said('.visually-hidden')).toMatch(/^La figure de proue\. 0 blocs posés sur 6\. 4 blocs de marbre, à gagner /);
    expect(said('.fiche-signes')).toContain('0/6');
    expect(screen.getByRole('button', { name: /Poser/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Partir/ })).toBeNull();
    expect(document.body.textContent).not.toMatch(/il te manque|aéronef/i);
  });

  it('« Poser » pose la tête seule, jamais le pavois avant, même avec du quartz', async () => {
    show([], { 'maths-3e-geometry': 6, 'maths-3e-statistics': 10 }, 0);
    await userEvent.click(screen.getByRole('button', { name: /Poser/ }));
    expect(said('[role=status]')).toBe('La figure de proue est posée.');
    const saved = JSON.parse(localStorage.getItem('dysapps:game')!) as { world: { parts: Record<string, string[]> }; stock: Record<string, number> };
    expect(saved.world.parts[NEF_PARURES_ID]).toEqual(keys.slice(0, 6));
    expect(saved.stock['maths-3e-statistics']).toBe(10);
  });

  it('la tête posée : le pavois, 0 sur 10, et le quartz', () => {
    show(keys.slice(0, 6), {}, 0);
    expect(done()).toEqual(['faite', 'en-cours', 'a-venir']);
    expect(said('.visually-hidden')).toMatch(/^Les plaques bleues\. 0 blocs posés sur 10\. 10 blocs de quartz, à gagner /);
    expect(screen.queryByRole('button', { name: /Poser/ })).toBeNull();
  });

  it('les deux posées, les feux attendent un lieu : « Carte » à la place de l’action', async () => {
    const { onMap } = show(keys, {}, 1);
    expect(done()).toEqual(['faite', 'faite', 'en-cours']);
    expect(said('.visually-hidden')).toBe('Encore 1 lieu à achever.');
    await userEvent.click(screen.getByRole('button', { name: /Carte/ }));
    expect(onMap).toHaveBeenCalled();
  });

  it('toutes posées : « La Nef est complète. », sans bouton, jamais « Partir »', () => {
    show(keys, {}, 2);
    expect(done()).toEqual(['faite', 'faite', 'faite']);
    expect(said('.world-fiche-phrase')).toBe('La Nef est complète.');
    expect(document.querySelector('#panneau-nef .nef-sheet-actions')).toBeNull();
    expect(screen.queryByRole('button', { name: /Partir|Poser|Carte/ })).toBeNull();
  });
});
