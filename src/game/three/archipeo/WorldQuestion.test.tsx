import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import type { OpenWorld } from './scene';
import { WorldQuestion } from './WorldQuestion';

// La scène 3D n'est pas là sous jsdom : la question ne lui demande que de poser les objets et d'allumer la lampe.
const world = { question: vi.fn(() => []), scenetteEnd: vi.fn() } as unknown as OpenWorld;

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
});

function renderPhare() {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <WorldQuestion place="phare" mission="sound-hunt" world={world} onClose={() => {}} onSimpleView={() => {}} />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

describe('La scénette du Phare', () => {
  it('« Vue simple » puis « Scène » gardent la cloche choisie', async () => {
    const user = userEvent.setup();
    renderPhare();
    const bells = () => within(screen.getByRole('list', { name: 'Cloches à trier' })).getAllByRole('button');
    await screen.findByRole('list', { name: 'Cloches à trier' });
    const start = screen.queryByRole('button', { name: /Commencer/ });
    if (start) await user.click(start);
    const word = bells()[0].textContent;
    await user.click(bells()[0]);
    expect(bells()[0]).toHaveAttribute('aria-pressed', 'true');

    // La même question en liste, sur place : la cloche reste choisie, « Valider » sous la liste.
    await user.click(screen.getByRole('button', { name: /Vue simple/ }));
    expect(document.querySelector('.quiz.in-world.simple')).not.toBeNull();
    expect(bells()[0].textContent).toBe(word);
    expect(bells()[0]).toHaveAttribute('aria-pressed', 'true');
    expect(
      bells()
        .slice(1)
        .every((b) => b.getAttribute('aria-pressed') === 'false'),
    ).toBe(true);
    const list = screen.getByRole('list', { name: 'Cloches à trier' });
    const validate = screen.getByRole('button', { name: /Valider/ });
    expect(list.compareDocumentPosition(validate) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // Retour à la scène, à la même place que « Vue simple » : la cloche est toujours choisie.
    await user.click(screen.getByRole('button', { name: /Scène/ }));
    expect(document.querySelector('.quiz.in-world.simple')).toBeNull();
    expect(screen.getByRole('button', { name: /Vue simple/ })).toBeInTheDocument();
    expect(bells()[0].textContent).toBe(word);
    expect(bells()[0]).toHaveAttribute('aria-pressed', 'true');
  });
});
