import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { BloclandProvider } from './BloclandContext';
import { InventorySheet, READY_SHOWN } from './Inventory';
import { SchoolSheet } from './School';
import { TrophySheet } from './TrophySheet';

function renderIn(node: React.ReactNode) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>{node}</MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

it('« Tu peux construire » montre trois chantiers, celui de l’île du bonhomme en tête, et le reste derrière « Tout voir »', async () => {
  const user = userEvent.setup();
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-phonology': 200, 'maths-6e-calculation': 200, 'french-6e-letter-confusion': 200, 'french-6e-word-spelling': 200 } }));
  renderIn(<InventorySheet onClose={() => {}} />);
  const sheet = screen.getByRole('dialog', { name: 'Mes blocs' });
  expect(sheet.textContent).not.toContain('Touche une île');
  const now = screen.getByRole('list', { name: /Tu peux construire/ });
  expect(within(now).getAllByRole('link')).toHaveLength(READY_SHOWN);
  // Le bonhomme est sur la Forêt : son plan d'abord.
  expect(within(now).getAllByRole('link')[0]).toHaveTextContent('Plan de Forêt des sons');
  const all = screen.getByRole('button', { name: /^Tout voir \((\d+)\)$/ });
  const n = Number(/\((\d+)\)/.exec(all.textContent!)![1]);
  expect(n).toBeGreaterThan(READY_SHOWN);
  await user.click(all);
  expect(within(now).getAllByRole('link')).toHaveLength(n);
  expect(screen.queryByRole('button', { name: /Tout voir/ })).not.toBeInTheDocument();
});

it('rien à construire : pas de « Tout voir »', () => {
  renderIn(<InventorySheet onClose={() => {}} />);
  expect(document.body.textContent).toContain('Rien pour l’instant');
  expect(screen.queryByRole('button', { name: /Tout voir/ })).not.toBeInTheDocument();
});

it('l’école : une ligne pour les blocs, l’accueil de la créature dans un pli avec Écouter, les portes tout de suite', () => {
  renderIn(<SchoolSheet onClose={() => {}} />);
  expect(screen.getByText('Chaque mission ici donne des blocs de bois.')).toBeInTheDocument();
  const more = document.querySelector<HTMLDetailsElement>('.school .sheet-more')!;
  expect(more).not.toHaveAttribute('open');
  expect(more.querySelector('summary')).toHaveTextContent('En savoir plus');
  expect(more.textContent).toContain('Bienvenue à l’école !');
  expect(screen.getByRole('list', { name: 'Les trois portes de l’école' })).toBeInTheDocument();
  expect(document.body.textContent).not.toContain('Une mission finie');
});

it('les trophées : l’accueil de la salle dans un pli, la salle tout de suite', () => {
  renderIn(<TrophySheet onClose={() => {}} />);
  const sheet = screen.getByRole('dialog', { name: /Trophées|trophées/ });
  const more = sheet.querySelector<HTMLDetailsElement>('.sheet-more')!;
  expect(more).not.toHaveAttribute('open');
  expect(more.querySelector('summary')).toHaveTextContent('En savoir plus');
  expect(more.textContent).toContain('La salle est vide pour l’instant.');
  expect(sheet.querySelector('.island-sheet-says')).toBeNull();
});

it('« Dans ta poche » ne redit pas les chantiers que « Tu peux construire » montre déjà', () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-phonology': 200, 'maths-6e-calculation': 200, 'french-6e-letter-confusion': 200, 'french-6e-word-spelling': 200 } }));
  renderIn(<InventorySheet onClose={() => {}} />);
  const shown = within(screen.getByRole('list', { name: /Tu peux construire/ }))
    .getAllByRole('link')
    .map((a) => a.getAttribute('href'));
  const poche = screen.getByRole('list', { name: /Dans ta poche/ });
  // Le plan de la Forêt est en tête de « Tu peux construire » : la poche ne le redit pas.
  expect(within(poche).queryByRole('link', { name: /Plan de Forêt des sons/ })).not.toBeInTheDocument();
  for (const link of within(poche).queryAllByRole('link')) expect(shown).not.toContain(link.getAttribute('href'));
});

describe('à l’ouverture, seul le texte visible est lu', () => {
  const dit: string[] = [];
  beforeEach(() => {
    dit.length = 0;
    class Utterance {
      lang = '';
      rate = 1;
      voice: unknown = null;
      constructor(public text: string) {}
    }
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
    vi.stubGlobal('speechSynthesis', { cancel: () => {}, getVoices: () => [], speak: (u: { text: string }) => dit.push(u.text) });
    localStorage.setItem('dysapps:settings', JSON.stringify({ autoRead: true }));
  });

  it('l’école lit sa ligne, pas l’accueil du pli', async () => {
    renderIn(<SchoolSheet onClose={() => {}} />);
    await waitFor(() => expect(dit).toHaveLength(1));
    expect(dit[0]).toContain('Chaque mission ici donne des blocs de bois.');
    expect(dit[0]).not.toContain('Bienvenue');
  });

  it('les trophées lisent leur compte, pas l’accueil du pli', async () => {
    renderIn(<TrophySheet onClose={() => {}} />);
    await waitFor(() => expect(dit).toHaveLength(1));
    expect(dit[0]).toMatch(/^Salle des trophées\s:\s0 trophée sur \d+\.$/u);
  });
});
