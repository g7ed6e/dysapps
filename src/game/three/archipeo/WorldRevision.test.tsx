// La révision jouée dans la scène du lieu (GD-20, point 4, lot L3, B2) : les seuls items dus, mission par mission, le
// repère compté sur tout le passage, l'entrée qui dit une révision, un seul bilan, et rien d'une partie enregistré.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import { loadExercise } from '../../exercises';
import type { OpenWorld } from './scene';
import type { RevisionPlan } from './revisionOf';
import { WorldRevision, revisedSummary } from './WorldRevision';
import type { Completion } from '../../engine';

const world = { question: vi.fn(() => []), onSceneTurn: vi.fn(() => () => {}), scenetteEnd: vi.fn() } as unknown as OpenWorld;

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  // Une tablette : la page a sa taille, la scène est demandée.
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1024);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(768);
});
afterEach(() => vi.restoreAllMocks());
beforeAll(async () => {
  await Promise.all(['maths-6e-calculation-measures-1', 'maths-6e-calculation-measures-2'].map((id) => loadExercise(id)));
});

// Deux morceaux aux Quais : deux questions de la première mesure, une de la seconde.
const PLAN: RevisionPlan = {
  place: 'quais',
  segments: [
    { exercise: 'maths-6e-calculation-measures-1', type: 'measures', level: 1, keys: ['maths-6e-calculation-measures-1-3', 'maths-6e-calculation-measures-1-5'] },
    { exercise: 'maths-6e-calculation-measures-2', type: 'measures', level: 2, keys: ['maths-6e-calculation-measures-2-0'] },
  ],
  total: 3,
};

function renderRevision(onClose = () => {}) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <WorldRevision plan={PLAN} world={world} onClose={onClose} />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

const answers = () => [...document.querySelectorAll<HTMLButtonElement>('.world-answers .world-answer')];
/** Répond à l'écran (un essai, puis un autre s'il le faut) jusqu'à « Suivant » ou « Voir mes blocs ». */
async function answer(user: ReturnType<typeof userEvent.setup>) {
  await vi.waitFor(() => expect(answers().length).toBeGreaterThanOrEqual(2));
  for (let i = 0; i < answers().length && !document.querySelector('.next-button'); i++) await user.click(answers()[i]);
  await vi.waitFor(() => expect(document.querySelector('.next-button')).not.toBeNull());
  return document.querySelector<HTMLButtonElement>('.next-button')!;
}
/** Le texte d'un élément, ses espaces (insécables, fines) ramenées à une espace simple. */
const said = (el: Element | null) => el?.textContent?.replace(/\s+/gu, ' ').trim();
const saved = () => JSON.parse(localStorage.getItem('dysapps:game') ?? '{}') as { progress?: Record<string, unknown>; spaced?: { itemId: string; due: string }[] };

describe('La révision dans la scène du lieu (GD-20, point 4, lot L3)', () => {
  it('les items dus, mission par mission ; « 1 sur 3 » ; l’entrée dit la révision ; un seul bilan, sans étoiles ni partie enregistrée', async () => {
    localStorage.clear();
    // Les trois questions dues depuis longtemps : la révision les fait avancer dans la file.
    const due = PLAN.segments.flatMap((sg) => sg.keys.map((k) => `${sg.exercise}:${k}`));
    localStorage.setItem('dysapps:game', JSON.stringify({ spaced: due.map((itemId) => ({ itemId, due: '2020-01-01', stage: 0, streak: 0 })) }));
    vi.mocked(world.scenetteEnd).mockClear();
    const user = userEvent.setup();
    renderRevision();
    // Le docker en tête, la scène des Quais ; l'entrée ouvre la consigne du premier morceau, sans date ni échec.
    expect(await screen.findByText('Le docker')).toBeInTheDocument();
    const start = screen.queryByRole('button', { name: /Commencer/ });
    if (start) await user.click(start);
    await vi.waitFor(() => expect(said(document.querySelector('#consigne'))).toMatch(/^Tu revois 3 questions\. /));
    expect(screen.getByRole('list', { name: 'Question 1 sur 3' })).toHaveAttribute('data-count', '1 sur 3');
    expect(document.querySelectorAll('.quiz-steps-revision li')).toHaveLength(3);
    // Deux questions de la première mission : « Suivant » à la fin du morceau, la suite vient.
    await user.click(await answer(user));
    expect(screen.getByRole('list', { name: 'Question 2 sur 3' })).toBeInTheDocument();
    const end = await answer(user);
    expect(end).toHaveTextContent('Suivant');
    await user.click(end);
    // Le second morceau : sa consigne seule, le repère continue.
    await vi.waitFor(() => expect(screen.getByRole('list', { name: 'Question 3 sur 3' })).toBeInTheDocument());
    expect(document.querySelector('#consigne')?.textContent).not.toMatch(/Tu revois/);
    const last = await answer(user);
    expect(last).toHaveTextContent('Voir mes blocs');
    await user.click(last);
    // Un seul bilan : sa phrase, les blocs de deux révisions, ni étoiles ni « Détail ».
    await vi.waitFor(() => expect(said(document.querySelector('.world-done-revised #fin-titre'))).toBe('Tu as revu 3 questions.'));
    expect(document.querySelector('.world-done .stars')).toBeNull();
    expect(screen.queryByRole('button', { name: /Détail/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Continuer/ })).toBeInTheDocument();
    // Le texte du bilan à gauche ; la série porte un nom lu (« Série, 1 jour d’affilée »).
    expect(document.querySelector('.world-done-body')).toHaveClass('world-done-body-revised');
    expect(screen.getByRole('listitem', { name: 'Série, 1 jour d’affilée' })).toBeInTheDocument();
    // Rien ne se pose dans la scène : une révision ne remet rien en marche.
    expect(world.scenetteEnd).toHaveBeenCalledWith(false);
    // La file enregistrée sous les mêmes clés ; ni étoiles, ni meilleur score, ni partie comptée.
    await vi.waitFor(() => expect(saved().spaced?.filter((q) => due.includes(q.itemId)).map((q) => q.due)).not.toContain('2020-01-01'));
    expect(saved().progress ?? {}).toEqual({});
  });

  it('le bilan réunit les blocs de chaque sorte et l’XP de tous les morceaux', () => {
    const c = (block: string, blocks: number, xp: number) => ({ block, blocks, xp }) as unknown as Completion;
    expect(revisedSummary([c('stone', 3, 10), c('stone', 3, 12), c('wood', 2, 5)], 5)).toEqual({
      said: 'Tu as revu 5 questions.',
      blocks: [
        { block: 'stone', n: 6 },
        { block: 'wood', n: 2 },
      ],
      xp: 27,
    });
    expect(revisedSummary([c('stone', 3, 10)], 1).said).toBe('Tu as revu 1 question.');
  });
});
