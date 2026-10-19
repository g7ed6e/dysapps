// Le panneau d'un lieu (GD-20, point 8) : toutes les missions de son île, une seule mise en avant, le signe « Dans le
// lieu » sur celles qui s'y jouent, le focus sur la ligne dont on revient, Échap qui ferme ; l'adresse de retour lue sans
// rien inventer.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import { getBiome } from '../../biomes';
import type { MissionMark } from '../../world/continu/mission';
import { placeById, type PlaceId } from '../../world/continu/plan6e';
import { IN_PLACE_LABEL, PlacePanel, placeFromParam, placeResume, placeReturn } from './PlacePanel';
import { planFor } from '../../world/continu/levelPlan';

/** Le plan du 6e, le seul enregistré (GD-22). */
const PLAN = planFor('6e');

function renderPanel(place: PlaceId, missions: MissionMark[], suggested: string | null, focus: string | null = null) {
  const onPlay = vi.fn();
  const onClose = vi.fn();
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <PlacePanel place={placeById(place)} missions={missions} suggested={suggested} focus={focus} onPlay={onPlay} onClose={onClose} />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
  return { onPlay, onClose, sheet: screen.getByRole('dialog', { name: placeById(place).name }) };
}

const marks = (island: string, etat: (i: number) => MissionMark['etat'] = () => 'new'): MissionMark[] =>
  getBiome(island)!.exercises.map((e, i) => ({ ile: island, mission: e.id, etat: etat(i) }));

it('les Quais : une ligne par mission de l’île, toutes dans le lieu ; la prochaine seule mise en avant', async () => {
  const { sheet, onPlay } = renderPanel('quais', marks('maths-6e-calculation', (i) => (i === 0 ? 2 : 'new')), 'make-ten');
  const rows = within(sheet).getAllByRole('button').filter((b) => b.classList.contains('app-card'));
  expect(rows).toHaveLength(5);
  expect(rows.map((r) => r.querySelector('.app-title')?.textContent)).toEqual(getBiome('maths-6e-calculation')!.exercises.map((e) => e.title));
  // Le même signe sur chacune, dit à la voix, jamais seul : le titre et l'étiquette restent écrits.
  for (const r of rows) expect(within(r).getByRole('img', { name: IN_PLACE_LABEL })).toBeInTheDocument();
  expect(rows.filter((r) => r.getAttribute('aria-current') === 'step')).toEqual([rows[1]]);
  expect(within(rows[0]).getByRole('img', { name: '2 étoiles sur 3' })).toBeInTheDocument();
  expect(rows[1]).toHaveTextContent('Nouveau');
  // Sans autre ligne de retour, le focus va à la mission mise en avant.
  expect(rows[1]).toHaveFocus();
  await userEvent.setup().click(rows[3]);
  expect(onPlay).toHaveBeenCalledWith('word-problems');
});

it('les Filets complets (GD-20, point 8, lot L4) : le signe sur chacune de leurs missions, le focus sur la ligne dont on revient', () => {
  const { sheet } = renderPanel('filets', marks('french-6e-grammar-spelling'), null, 'e-er-ez');
  const rows = within(sheet).getAllByRole('button').filter((b) => b.classList.contains('app-card'));
  const signed = rows.filter((r) => within(r).queryByRole('img', { name: IN_PLACE_LABEL }));
  expect(signed).toEqual(rows);
  expect(rows).toHaveLength(4);
  expect(rows.some((r) => r.getAttribute('aria-current'))).toBe(false);
  expect(rows.find((r) => r.querySelector('.app-title')?.textContent === 'Récolte -é / -er / -ez')).toHaveFocus();
});

it('au retour d’une autre mission, la suggestion reste mise en avant, le focus sur la ligne jouée ; la voix lit titre, « Scène », étoiles', () => {
  const { sheet } = renderPanel('quais', marks('maths-6e-calculation', (i) => (i === 2 ? 1 : 'new')), 'times-tables', 'doubles-halves');
  const rows = within(sheet).getAllByRole('button').filter((b) => b.classList.contains('app-card'));
  expect(rows[2]).toHaveFocus();
  expect(rows[0]).toHaveAttribute('aria-current', 'step');
  expect(rows[0]).toHaveClass('suggested');
  expect(rows[2]).not.toHaveClass('suggested');
  // L'icône de lecture est muette : le nom de la ligne suit l'ordre de lecture.
  expect(rows[2]).toHaveAccessibleName('Doubles et moitiés Scène 1 étoile sur 3');
});

it('Échap ferme le panneau, comme la croix', async () => {
  const { onClose } = renderPanel('phare', marks('french-6e-phonology'), 'syllables');
  await userEvent.setup().keyboard('{Escape}');
  expect(onClose).toHaveBeenCalled();
});

it('l’adresse de retour d’un lieu se lit sans rien inventer', () => {
  expect(placeReturn('quais', 'make-ten')).toBe('/adventure?lieu=quais&mission=make-ten');
  expect(placeReturn('phare')).toBe('/adventure?lieu=phare');
  expect(placeFromParam(PLAN, 'quais')).toBe('quais');
  for (const v of [null, '', 'quai', 'Quais', 'vigie', '../quais']) expect(placeFromParam(PLAN, v)).toBeNull();
  expect(placeResume('/adventure/maths-6e-calculation/measures')).toBe('/adventure?lieu=quais&mission=measures');
  // Une île sans lieu, une mission qui n'est pas de l'île, une autre adresse : son retour habituel.
  for (const path of ['/adventure/history-6e-antiquity/dates', '/adventure/maths-6e-calculation/inventee', '/app/tables', '/adventure/maths-6e-calculation'])
    expect(placeResume(path)).toBeUndefined();
});
