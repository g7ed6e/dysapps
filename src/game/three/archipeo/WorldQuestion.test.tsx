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

function renderPlace(place: 'phare' | 'quais', mission: string) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <WorldQuestion place={place} mission={mission} world={world} onClose={() => {}} />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

const renderPhare = () => renderPlace('phare', 'sound-hunt');

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
    // Sur un écran bas (jsdom n'a pas de taille), la consigne repliée en une ligne se déplie avec « Lire la suite ».
    const more = screen.getByRole('button', { name: 'Lire la suite' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await user.click(more);
    expect(screen.getByRole('button', { name: 'Replier' })).toHaveAttribute('aria-expanded', 'true');
    expect(document.querySelector('.quiz.in-world.simple-bas.consigne-ouverte')).not.toBeNull();
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

  it('au plus grand texte, la consigne s’ouvre dépliée au premier item', async () => {
    localStorage.setItem('dysapps:settings', JSON.stringify({ fontSize: 32, univers: 'archipeo' }));
    const user = userEvent.setup();
    renderPhare();
    await screen.findByRole('list', { name: 'Cloches à trier' });
    const start = screen.queryByRole('button', { name: /Commencer/ });
    if (start) await user.click(start);
    await user.click(screen.getByRole('button', { name: /Vue simple/ }));
    expect(screen.getByRole('button', { name: 'Replier' })).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('La scénette des Quais', () => {
  it('le docker en tête ; « Vue simple » puis « Scène » gardent la caisse tentée, barrée', async () => {
    const user = userEvent.setup();
    renderPlace('quais', 'doubles-halves');
    expect(await screen.findByText('Le docker')).toBeInTheDocument();
    const start = screen.queryByRole('button', { name: /Commencer/ });
    if (start) await user.click(start);
    const answers = () => [...document.querySelectorAll<HTMLButtonElement>('.world-answers .world-answer')];
    await vi.waitFor(() => expect(answers().length).toBeGreaterThan(1));
    const labels = answers().map((b) => b.textContent);
    // Une réponse tentée : juste, l'item est fini ; fausse, elle reste barrée et les autres se touchent encore.
    await user.click(answers()[0]);
    const wrong = answers()[0].disabled;
    await user.click(screen.getByRole('button', { name: /Vue simple/ }));
    expect(document.querySelector('.quiz.in-world.simple')).not.toBeNull();
    expect(answers().map((b) => b.textContent)).toEqual(labels);
    if (wrong) expect(answers()[0].disabled).toBe(true);
    // Sans « Valider », le repère « Suite plus bas » se montre tant que des caisses restent plus bas, puis part en bas.
    const panel = document.querySelector<HTMLElement>('.quiz.in-world.simple')!;
    expect(within(panel).getByRole('img', { name: 'Suite plus bas' })).toBeInTheDocument();
    Object.defineProperty(panel, 'scrollHeight', { configurable: true, value: 600 });
    Object.defineProperty(panel, 'clientHeight', { configurable: true, value: 300 });
    panel.dispatchEvent(new Event('scroll'));
    await vi.waitFor(() => expect('repere' in panel.dataset).toBe(true));
    panel.scrollTop = 300;
    panel.dispatchEvent(new Event('scroll'));
    await vi.waitFor(() => expect('repere' in panel.dataset).toBe(false));
    await user.click(screen.getByRole('button', { name: /Scène/ }));
    expect(document.querySelector('.quiz.in-world.simple')).toBeNull();
    expect(answers().map((b) => b.textContent)).toEqual(labels);
    if (wrong) expect(answers()[0].disabled).toBe(true);
  });
});
