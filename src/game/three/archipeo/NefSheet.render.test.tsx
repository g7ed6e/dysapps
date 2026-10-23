import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import { NOMS_ARCHIPELS, voyageId } from '../../world/archipelago';
import { planCells } from '../../world/plans';
import { VEHICLE_STAGES } from '../../world/vehicle';
import { EarnPlaces, type EarnPlaceOf } from '../../PlanSection';
import { planFor } from '../../world/continu/levelPlan';
import { NefSheet, nefStageOf } from './NefSheet';
import { earnPlacesOf } from './PlacePanel';

const stage = VEHICLE_STAGES[0];

function show(kit: boolean, missing: number, building = stage, opts: { drop?: number; earn?: EarnPlaceOf } = {}) {
  localStorage.clear();
  localStorage.setItem('dysapps:settings', JSON.stringify({ univers: 'archipeo', autoRead: false, sounds: false }));
  // Au 5e, le voilier est parti du 6e : le dirigeable se construit à la Lisière.
  const before = VEHICLE_STAGES.filter((s) => s.stage < building.stage);
  const parts = Object.fromEntries([...before, building].map((s) => [s.id, planCells(s).map((c) => c.key)]));
  // Des cases du haut pas encore posées (sans blocs en réserve) : il en manque.
  if (opts.drop) parts[building.id] = parts[building.id].slice(0, -opts.drop);
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, world: { parts, links: before.map((s) => voyageId(s.to)) } }));
  const onDepart = vi.fn();
  const onMap = vi.fn();
  const onReturn = vi.fn();
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <EarnPlaces.Provider value={opts.earn ?? null}>
              <NefSheet stage={building} kit={kit} missing={missing} onDepart={onDepart} onMap={onMap} onReturn={onReturn} onClose={() => {}} />
            </EarnPlaces.Provider>
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
  return { onDepart, onMap, onReturn };
}

/** Le texte d'un élément de la fiche, ses espaces fines et insécables ramenées à des espaces. */
const said = (selector: string) => document.querySelector(`#panneau-nef ${selector}`)?.textContent?.replace(/[\u00a0\u202f]/g, ' ').trim();

describe('la fiche de la Nef du monde continu (GD-21)', () => {
  it('attend sa voile : le nombre de lieux à achever, et la Carte à la place de l’action', async () => {
    const { onMap, onDepart } = show(false, 1);
    // Une seule idée, la même à l'écran et au lecteur d'écran (référent dys, retouche du lot 4).
    expect(said('.visually-hidden')).toBe('Encore 1 lieu à achever.');
    expect(said('.fiche-signes + .world-fiche-phrase')).toBe('Encore 1 lieu à achever.');
    expect(document.querySelectorAll('.nef-pastille')[2].querySelector('svg')).toBeNull();
    expect(screen.queryByRole('button', { name: /Partir/ })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /Carte/ }));
    expect(onMap).toHaveBeenCalled();
    expect(onDepart).not.toHaveBeenCalled();
  });

  it('prête : sa destination seule, et « Partir » seulement au toucher du bouton', async () => {
    const { onDepart } = show(true, 0);
    expect(said('.world-fiche-phrase')).toBe(`Prête. Direction : les ${NOMS_ARCHIPELS[stage.to]}.`);
    await userEvent.click(screen.getByRole('button', { name: /Partir/ }));
    expect(onDepart).toHaveBeenCalledWith(stage);
  });

  it('au 5e, le dirigeable attend son gouvernail (GD-22, lot 4)', () => {
    const dirigeable = nefStageOf('5e');
    expect(dirigeable.stage).toBe(2);
    show(false, 2, dirigeable);
    expect(said('.visually-hidden')).toBe('Encore 2 lieux à achever.');
    expect(said('.fiche-signes + .world-fiche-phrase')).toBe('Encore 2 lieux à achever.');
    // Les mêmes pastilles qu'au 6e : aucun dessin sur la troisième (seconde passe du directeur artistique).
    expect(document.querySelectorAll('.nef-pastille')[2].querySelector('svg')).toBeNull();
  });

  it('au monde ouvert, un bloc qui manque se gagne dans un lieu du plan, nommé comme lui (chaque cadre nomme ce qu’il montre)', () => {
    const plan = planFor('5e');
    show(false, 0, nefStageOf('5e'), { drop: 3, earn: earnPlacesOf(plan) });
    const link = screen.getByRole('link');
    expect(plan.places.map((p) => p.at)).toContain(link.textContent);
    expect(link.getAttribute('href')).toMatch(/^\/adventure\?lieu=/);
  });

  it('montre la rangée « Revenir » des niveaux déjà atteints, sous l’action, sans la remplacer (voyage entre niveaux)', async () => {
    // Au 5e, le voilier est parti du 6e : le 6e est atteint.
    const { onReturn } = show(false, 1, VEHICLE_STAGES[1]);
    const row = within(screen.getByRole('list', { name: 'Voyager avec la Nef' }));
    expect(row.getAllByRole('button').map((b) => b.textContent?.trim())).toEqual(['Revenir en 6e']);
    expect(screen.getByRole('button', { name: /Carte/ })).toBeTruthy();
    await userEvent.click(row.getByRole('button', { name: `Revenir en 6e : les ${NOMS_ARCHIPELS['6e']}` }));
    expect(onReturn).toHaveBeenCalledWith('6e');
  });

  it('au 6e, sans voyage fait, n’a pas de rangée « Revenir »', () => {
    show(false, 1);
    expect(screen.queryByRole('list', { name: 'Voyager avec la Nef' })).toBeNull();
  });
});
