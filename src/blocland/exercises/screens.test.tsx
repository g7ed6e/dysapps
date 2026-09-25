import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../../core/SettingsContext';
import { ProgressProvider } from '../../core/ProgressContext';
import { AppRoutes } from '../../App';
import { BloclandProvider } from '../BloclandContext';
import { getExercise } from './index';

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

/** Débloque les biomes suivants : une étoile dans chacun des biomes précédents. */
function unlockAll() {
  localStorage.setItem(
    'dysapps:blocland',
    JSON.stringify({
      progress: {
        'foret-x': { stars: 1, attempts: 1, best: 1 },
        'mine-x': { stars: 1, attempts: 1, best: 1 },
        'carriere-x': { stars: 1, attempts: 1, best: 1 },
        'ferme-x': { stars: 1, attempts: 1, best: 1 },
      },
    }),
  );
}

const sheet = () => screen.getByRole('region', { name: 'Résultat' });

afterEach(() => vi.useRealTimers());

describe('déblocage des biomes', () => {
  it('verrouille la Mine tant que le pont n’est pas construit', async () => {
    const user = userEvent.setup();
    renderAt('/aventure');
    expect(screen.getAllByText(/Pont à construire : 3 blocs/).length).toBe(4);
    expect(screen.getAllByText(/Île lointaine/).length).toBe(4);
    await user.click(screen.getByRole('link', { name: /^Mine des lettres/ }));
    // Le message est découpé en syllabes (plusieurs éléments) : on lit le texte complet.
    expect(document.body.textContent).toMatch(/Pas si vite/);
    expect(screen.queryByRole('link', { name: /Filon/ })).not.toBeInTheDocument();
    expect(screen.getAllByText('Verrouillé').length).toBeGreaterThan(0);
  });

  it('ouvre la Mine quand on construit le pont avec ses blocs', async () => {
    localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { bois: 2, pierre: 2 } }));
    const user = userEvent.setup();
    renderAt('/aventure/mine');
    expect(screen.queryByRole('link', { name: /Filon/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Construire/ }));
    expect(document.body.textContent).toMatch(/Le pont vers Forêt des sons est construit/);
    expect(screen.getByRole('link', { name: /Filon/ })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('dysapps:blocland')!).village.bridges).toEqual(['foret-mine']);
    expect(JSON.parse(localStorage.getItem('dysapps:blocland')!).inventory).toEqual({ pierre: 1 });
  });

  it('une sauvegarde d’avant les ponts garde la Mine ouverte', () => {
    localStorage.setItem('dysapps:blocland', JSON.stringify({ progress: { 'foret-chasse-son-an': { stars: 1, attempts: 1, best: 0.5 } } }));
    renderAt('/aventure/mine');
    expect(screen.getByRole('link', { name: /Filon/ })).toBeInTheDocument();
    expect(screen.queryByText(/Pas si vite/)).not.toBeInTheDocument();
  });
});

it('chasse au son : on choisit les mots, on valide, la correction nomme le son entendu', async () => {
  const user = userEvent.setup();
  const def = getExercise('foret-chasse-son-an')!;
  renderAt('/aventure/foret/chasse-son');
  expect(screen.getByText(def.instruction)).toBeInTheDocument();
  const first = def.items.slice(0, 4);
  // Une erreur volontaire : le premier mauvais mot est coché aussi.
  const wrong = first.find((i) => !i.correct)!;
  for (const it of first) if (it.correct || it.key === wrong.key) await user.click(screen.getByRole('button', { name: String(it.word) }));
  expect(screen.getByRole('button', { name: String(wrong.word) })).toHaveAttribute('aria-pressed', 'true');
  await user.click(screen.getByRole('button', { name: /Valider/ }));
  expect(within(sheet()).getByText(new RegExp(`Dans ${wrong.word}, on entend \\${wrong.heard}`))).toBeInTheDocument();
  await user.click(within(sheet()).getByRole('button', { name: /Suivant/ }));
  // Écran 2 sans faute
  const second = def.items.slice(4, 8);
  for (const it of second) if (it.correct) await user.click(screen.getByRole('button', { name: String(it.word) }));
  await user.click(screen.getByRole('button', { name: /Valider/ }));
  expect(within(sheet()).getByText(def.feedback.correct)).toBeInTheDocument();
});

it('filon : piocher la cible est juste, laisser passer une autre lettre aussi', async () => {
  unlockAll();
  localStorage.setItem('dysapps:settings', JSON.stringify({ reduceMotion: true }));
  const user = userEvent.setup();
  const def = getExercise('mine-filon-b')!;
  renderAt('/aventure/mine/filon');
  for (let i = 0; i < 3; i++) {
    const it = def.items[i];
    const block = screen.getByRole('button', { name: `Bloc avec la lettre ${it.letter}. Piocher` });
    if (it.correct) await user.click(block);
    else await user.click(screen.getByRole('button', { name: /Laisser passer/ }));
    expect(within(sheet()).getByText('Bien piochée !')).toBeInTheDocument();
    await user.click(within(sheet()).getByRole('button', { name: /Suivant/ }));
  }
  // Erreur volontaire sur le 4e : on pioche même si ce n'est pas la cible, ou on laisse passer la cible.
  const it = def.items[3];
  if (it.correct) await user.click(screen.getByRole('button', { name: /Laisser passer/ }));
  else await user.click(screen.getByRole('button', { name: `Bloc avec la lettre ${it.letter}. Piocher` }));
  expect(within(sheet()).getByText(/PAS TOUT À FAIT/)).toBeInTheDocument();
});

it('filon : sans « réduire les animations », le bloc qui sort de la galerie compte comme laissé passer', () => {
  vi.useFakeTimers();
  unlockAll();
  // Sans historique, l'exercice proposé est le premier du catalogue pour ce type.
  const def = getExercise('mine-filon-b')!;
  renderAt('/aventure/mine/filon');
  const it = def.items[0];
  act(() => {
    vi.advanceTimersByTime(9000);
  });
  const text = sheet().textContent!;
  expect(text).toMatch(it.correct ? /PAS TOUT À FAIT/ : /Bien piochée/);
  vi.useRealTimers();
});

it('mot troué : le bon bloc remplit le trou, la correction montre la bonne écriture', async () => {
  unlockAll();
  const user = userEvent.setup();
  const def = getExercise('carriere-mot-troue-1')!;
  renderAt('/aventure/carriere/mot-troue');
  const it = def.items[0];
  const wrong = (it.choices as string[]).find((c) => c !== it.answer)!;
  await user.click(screen.getByRole('button', { name: wrong }));
  expect(within(sheet()).getByText(new RegExp(`${it.word} s’écrit avec « ${it.answer} »`))).toBeInTheDocument();
  expect(screen.getByLabelText(/Mot à compléter/)).toHaveTextContent(`${it.before}${it.answer}${it.after}`);
});

it('tri des graines : phrase à trou, puis règle et astuce de substitution après une erreur', async () => {
  unlockAll();
  const user = userEvent.setup();
  renderAt('/aventure/ferme/graines');
  const def = getExercise('ferme-graines-a')!;
  const it = def.items[0];
  const wrong = (it.choices as string[]).find((c) => c !== it.answer)!;
  await user.click(screen.getByRole('button', { name: wrong }));
  expect(within(sheet()).getByText(/Astuce : Remplace par « avait »/)).toBeInTheDocument();
});

it('ascension : un étage par paragraphe validé, temps comparé à soi-même', async () => {
  unlockAll();
  const user = userEvent.setup();
  renderAt('/aventure/tour/ascension');
  const def = getExercise('tour-ascension-mousso')!;
  expect(screen.getByRole('img', { name: 'Tour : 0 étage sur 4' })).toBeInTheDocument();
  for (let i = 0; i < def.items.length; i++) {
    expect(screen.getByText(`Paragraphe ${i + 1} / ${def.items.length}`)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /J’ai lu ce paragraphe/ }));
  }
  expect(screen.getByRole('img', { name: 'Tour : 4 étages sur 4' })).toBeInTheDocument();
  expect(screen.getByText(/Première lecture/)).toBeInTheDocument();
  await user.click(within(sheet()).getByRole('button', { name: /Voir mes blocs/ }));
  expect(screen.getByRole('img', { name: '3 étoiles sur 3' })).toBeInTheDocument();
  const saved = JSON.parse(localStorage.getItem('dysapps:blocland')!);
  expect(saved.fluence[def.id]).toHaveLength(1);
  expect(saved.inventory.verre).toBe(4);
});
