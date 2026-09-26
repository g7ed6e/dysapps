import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { AppRoutes } from '../App';
import { BloclandProvider } from './BloclandContext';
import { getExercise } from './exercises';
import { runItems, runSeed } from './exercises/run';

function renderAt(path: string) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={[path]}>
            <AppRoutes />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

const DEF = getExercise('foret-echauffement-001')!;

/** Joue l'exercice en entier : `wrongAt` = index des items à rater volontairement. */
async function play(user: ReturnType<typeof userEvent.setup>, wrongAt: number[] = [], attempts = 0) {
  // Les items de cette partie (la première joue le lot de référence, les suivantes varient).
  const items = runItems(DEF, runSeed(DEF, attempts));
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const choices = item.choices as string[];
    const pick = wrongAt.includes(i) ? choices.find((c) => c !== item.answer)! : (item.answer as string);
    await user.click(screen.getByRole('button', { name: pick }));
    const sheet = screen.getByRole('region', { name: 'Résultat' });
    if (wrongAt.includes(i)) expect(within(sheet).getByText(new RegExp(`${item.heard} : ${item.answer} syllabes`))).toBeInTheDocument();
    else expect(within(sheet).getByText('Bien entendu !')).toBeInTheDocument();
    await user.click(within(sheet).getByRole('button', { name: i < items.length - 1 ? /Suivant/ : /Voir mes blocs/ }));
  }
}

it('joue un exercice : consigne, feedback, étoiles, blocs, XP, puis étoiles sur la page du biome', async () => {
  const user = userEvent.setup();
  renderAt('/aventure/foret');
  expect(screen.getByRole('link', { name: /Abattage syllabique.*Nouveau/ })).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: /Abattage syllabique/ }));
  expect(screen.getByText(DEF.instruction)).toBeInTheDocument();

  await play(user, [1]);
  expect(screen.getByRole('heading', { name: 'Bien joué !' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: '2 étoiles sur 3' })).toBeInTheDocument();
  expect(screen.getByText('+6')).toBeInTheDocument(); // 3 blocs × 5/6 arrondi, +1 pour deux étoiles, +2 première fois
  expect(screen.getByText(/\+2 première fois, \+1 pour 2 étoiles/)).toBeInTheDocument();
  expect(screen.getByText('+10')).toBeInTheDocument();
  expect(screen.getByText(/1 jour d’affilée/)).toBeInTheDocument();

  const saved = JSON.parse(localStorage.getItem('dysapps:blocland')!);
  expect(saved.inventory.bois).toBe(6);
  expect(saved.progress[DEF.id]).toMatchObject({ stars: 2, attempts: 1 });
  expect(saved.spaced).toHaveLength(1);
  expect(saved.spaced[0].itemId).toBe(`${DEF.id}:${DEF.items[1].key}`);
  // L'XP alimente aussi les rangs communs.
  expect(JSON.parse(localStorage.getItem('dysapps:progress')!).sessionsCompleted).toBe(1);

  // Le lien de retour (en haut) et le bouton de fin mènent au même endroit.
  await user.click(screen.getAllByRole('link', { name: /Forêt des sons/ })[0]);
  expect(screen.getByRole('img', { name: /2 étoiles sur 3, meilleur score 83 %/ })).toBeInTheDocument();
  expect(screen.getByText(/Tu en as 6/)).toBeInTheDocument();
});

it('propose une pause après 3 exercices, et laisse continuer', async () => {
  const user = userEvent.setup();
  renderAt('/aventure/foret/abattage');
  for (let round = 1; round <= 3; round++) {
    // Une erreur par partie : on reste au niveau 1 (une partie quasi parfaite ferait monter au niveau 2, un autre exercice).
    await play(user, [0], round - 1);
    if (round < 3) {
      expect(screen.queryByText(/Belle séance/)).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /Rejouer/ }));
    }
  }
  expect(screen.getByText(/Belle séance/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /J’arrête pour aujourd’hui/ })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Encore un peu/ }));
  expect(screen.getByRole('button', { name: /Rejouer/ })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('dysapps:blocland')!).progress[DEF.id].attempts).toBe(3);
});
