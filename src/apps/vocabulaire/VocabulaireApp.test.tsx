import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../../core/SettingsContext';
import { ProgressProvider } from '../../core/ProgressContext';
import VocabulaireApp from './VocabulaireApp';

function renderApp() {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter>
          <VocabulaireApp />
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

it('lance une mission de niveau de 10 mots, le mot anglais marqué comme tel', async () => {
  const user = userEvent.setup();
  renderApp();
  await user.click(screen.getByRole('button', { name: /Niveau 1 · J’écoute/ }));
  expect(screen.getByText('Question 1 / 10')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('lang', 'en');
});

it('révise un thème jusqu’au résultat', async () => {
  const user = userEvent.setup();
  renderApp();
  await user.click(screen.getByRole('button', { name: 'Les couleurs' }));
  for (let i = 0; i < 8; i++) {
    expect(screen.getByText(`Question ${i + 1} / 8`)).toBeInTheDocument();
    // Toujours le premier choix : bonne réponse, ou second essai puis correction.
    while (!screen.queryByRole('button', { name: /Suivante|Voir le résultat/ })) {
      const choice = screen.getAllByRole('button').find((b) => b.classList.contains('choice') && !b.hasAttribute('disabled'))!;
      await user.click(choice);
    }
    await user.click(screen.getByRole('button', { name: /Suivante|Voir le résultat/ }));
  }
  expect(screen.getByRole('heading', { name: 'Résultat' })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('dysapps:progress')!).apps['vocabulaire:theme-couleurs']).toBeDefined();
});
