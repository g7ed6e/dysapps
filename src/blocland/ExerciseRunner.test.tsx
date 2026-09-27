import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { AppRoutes } from '../App';
import { BloclandProvider } from './BloclandContext';
import { loadAllExercises } from './exercises';
import { runItems, runSeed } from './exercises/run';

const ALL = await loadAllExercises();
const getExercise = (id: string) => ALL.find((e) => e.id === id);

// La graine d'une partie est tirée au hasard : ici, on la fixe pour savoir quels items le test doit jouer.
const partie = vi.hoisted(() => ({ n: 0 }));
vi.mock('./exercises/run', async (original) => ({
  ...(await original<typeof import('./exercises/run')>()),
  runSeed: (def: { id: string }) => `${def.id}#test${partie.n}`,
}));
beforeEach(() => {
  partie.n = 0;
});

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

/** Attend que le contenu de l'exercice (chargé à la demande) soit là. */
const loaded = () => waitFor(() => expect(screen.queryByText('Chargement…')).not.toBeInTheDocument());

const DEF = getExercise('foret-echauffement-001')!;

/** Joue l'exercice en entier : `wrongAt` = index des items à rater volontairement. */
async function play(user: ReturnType<typeof userEvent.setup>, wrongAt: number[] = []) {
  // Les items de la partie en cours (même graine que l'écran).
  const items = runItems(DEF, runSeed(DEF));
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const choices = item.choices as string[];
    if (wrongAt.includes(i)) {
      // Deux erreurs : le premier essai raté donne « Presque ! » et un deuxième essai, la réponse tentée barrée.
      const [first, second] = choices.filter((c) => c !== item.answer);
      await user.click(screen.getByRole('button', { name: first }));
      expect(screen.getByText('Presque !')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: second }));
    } else await user.click(screen.getByRole('button', { name: item.answer as string }));
    const sheet = screen.getByRole('region', { name: 'Résultat' });
    if (wrongAt.includes(i)) expect(within(sheet).getByText(new RegExp(`On entend ${item.heard} : ${item.answer}, c’est le nombre de syllabes`))).toBeInTheDocument();
    else expect(within(sheet).getByText('Bien entendu !')).toBeInTheDocument();
    await user.click(within(sheet).getByRole('button', { name: i < items.length - 1 ? /Suivant/ : /Voir mes blocs/ }));
  }
  return items;
}

it('joue un exercice : consigne, feedback, étoiles, blocs, XP, puis étoiles sur la page du biome', async () => {
  const user = userEvent.setup();
  renderAt('/aventure/foret');
  expect(screen.getByRole('link', { name: /Abattage syllabique.*Nouveau/ })).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: /Abattage syllabique/ }));
  // La consigne est écrite (pas seulement lue), et le mot n'est pas découpé en syllabes (ce serait la réponse).
  expect(screen.getByRole('heading', { name: DEF.instruction })).toBeInTheDocument();
  expect(document.querySelector('.item-word .syllables')).toBeNull();

  const items = await play(user, [1]);
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
  expect(saved.spaced[0].itemId).toBe(`${DEF.id}:${items[1].key}`);
  // L'XP alimente aussi les rôles communs.
  expect(JSON.parse(localStorage.getItem('dysapps:progress')!).sessionsCompleted).toBe(1);

  // Le lien de retour (en haut) et le bouton de fin mènent au même endroit.
  await user.click(screen.getAllByRole('link', { name: /Forêt des sons/ })[0]);
  expect(screen.getByRole('img', { name: /2 étoiles sur 3, meilleur score 83 %/ })).toBeInTheDocument();
  expect(screen.getByText(/Tu en as 6/)).toBeInTheDocument();
});

it('propose une pause après 3 exercices, et laisse continuer', async () => {
  const user = userEvent.setup();
  renderAt('/aventure/foret/abattage');
  await loaded();
  for (let round = 1; round <= 3; round++) {
    // Une erreur par partie : on reste au niveau 1 (une partie quasi parfaite ferait monter au niveau 2, un autre exercice).
    await play(user, [0]);
    if (round < 3) {
      expect(screen.queryByText(/Belle séance/)).not.toBeInTheDocument();
      partie.n = round;
      await user.click(screen.getByRole('button', { name: /Rejouer/ }));
    }
  }
  expect(screen.getByText(/Belle séance/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /J’arrête pour aujourd’hui/ })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Encore un peu/ }));
  expect(screen.getByRole('button', { name: /Rejouer/ })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('dysapps:blocland')!).progress[DEF.id].attempts).toBe(3);
});

it('deuxième essai : juste au second coup, le point compte moitié', async () => {
  const user = userEvent.setup();
  renderAt('/aventure/foret/abattage');
  await loaded();
  const items = runItems(DEF, runSeed(DEF));
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i === 0) {
      const wrong = (item.choices as string[]).find((c) => c !== item.answer)!;
      await user.click(screen.getByRole('button', { name: wrong }));
      expect(screen.getByText('Presque !')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: wrong })).toBeDisabled();
    }
    await user.click(screen.getByRole('button', { name: item.answer as string }));
    const sheet = screen.getByRole('region', { name: 'Résultat' });
    await user.click(within(sheet).getByRole('button', { name: i < items.length - 1 ? /Suivant/ : /Voir mes blocs/ }));
  }
  // 5 points et demi sur 6, trois étoiles mais pas « sans faute ».
  expect(JSON.parse(localStorage.getItem('dysapps:blocland')!).progress[DEF.id].best).toBeCloseTo(5.5 / 6);
  expect(screen.queryByRole('heading', { name: 'Sans faute !' })).not.toBeInTheDocument();
});
