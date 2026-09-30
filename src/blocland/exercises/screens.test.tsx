import { act, render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../../core/SettingsContext';
import { ProgressProvider } from '../../core/ProgressContext';
import { AppRoutes } from '../../App';
import { BloclandProvider } from '../BloclandContext';
import { loadAllExercises } from './index';
import { EnclosScreen } from './EnclosScreen';
import { QcmItem } from './QcmItem';
import { FamillesScreen } from './FamillesScreen';
import { demanderMoinsDAnimations } from '../../core/mouvement.testing';

const ALL = await loadAllExercises();
const getExercise = (id: string) => ALL.find((e) => e.id === id);

// Ces tests décrivent les écrans : on les joue avec les items dans l'ordre du fichier (le hasard a ses propres tests).
vi.mock('./run', async (original) => ({
  ...(await original<typeof import('./run')>()),
  runItems: (def: { items: unknown[]; perRun?: number }) => (def.perRun ? def.items.slice(0, def.perRun) : def.items),
}));

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
    expect(screen.getAllByText(/Pont à construire : 3 blocs/).length).toBe(2);
    expect(screen.getAllByText(/Sentier à construire : 3 blocs/).length).toBe(1);
    expect(screen.getAllByText(/Bac à construire : 3 blocs/).length).toBe(1);
    expect(screen.getAllByText(/Île lointaine/).length).toBe(3);
    expect(screen.getAllByText(/Archipel à rejoindre/).length).toBe(21);
    await user.click(screen.getByRole('link', { name: /^Mine des lettres/ }));
    // Le message est découpé en syllabes (plusieurs éléments) : on lit le texte complet.
    expect(document.body.textContent).toMatch(/Pas si vite/);
    expect(screen.queryByRole('link', { name: /Filon/ })).not.toBeInTheDocument();
    expect(screen.getAllByText('Verrouillé').length).toBeGreaterThan(0);
    // (Vingt cartes d'îles avec leur créature : on laisse le temps sur une machine chargée.)
  }, 20_000);

  it('ouvre la Mine quand on construit le pont avec ses blocs', async () => {
    localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { bois: 2, pierre: 2 } }));
    const user = userEvent.setup();
    renderAt('/aventure/mine');
    expect(screen.queryByRole('link', { name: /Filon/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Construire/ }));
    expect(document.body.textContent).toMatch(/Le sentier vers Forêt des sons est tracé/);
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
  await loaded();
  expect(screen.getByRole('heading', { name: def.instruction })).toBeInTheDocument();
  const first = def.items.slice(0, 4);
  // Une erreur volontaire : le premier mauvais mot est coché aussi.
  const wrong = first.find((i) => !i.correct)!;
  for (const it of first) if (it.correct || it.key === wrong.key) await user.click(screen.getByRole('button', { name: String(it.word) }));
  expect(screen.getByRole('button', { name: String(wrong.word) })).toHaveAttribute('aria-pressed', 'true');
  await user.click(screen.getByRole('button', { name: /Valider/ }));
  // Premier essai : « Presque ! » et l'écran se refait ; on refait la même erreur.
  expect(screen.getByText('Presque !')).toBeInTheDocument();
  for (const it of first) if (it.correct || it.key === wrong.key) await user.click(screen.getByRole('button', { name: String(it.word) }));
  await user.click(screen.getByRole('button', { name: /Valider/ }));
  expect(within(sheet()).getByText(new RegExp(`Dans ${wrong.word}, on entend \\${wrong.heard}`))).toBeInTheDocument();
  await user.click(within(sheet()).getByRole('button', { name: /Suivant/ }));
  // Écran 2 sans faute
  const second = def.items.slice(4, 8);
  for (const it of second) if (it.correct) await user.click(screen.getByRole('button', { name: String(it.word) }));
  await user.click(screen.getByRole('button', { name: /Valider/ }));
  expect(within(sheet()).getByText(def.feedback.correct)).toBeInTheDocument();
});

it('chasse au son : la correction nomme tous les mots oubliés et chaque intrus, et les cartes le montrent', async () => {
  const user = userEvent.setup();
  const def = getExercise('foret-chasse-son-an')!;
  renderAt('/aventure/foret/chasse-son');
  await loaded();
  const first = def.items.slice(0, 4);
  const good = first.filter((i) => i.correct).map((i) => String(i.word));
  const intruder = first.find((i) => !i.correct)!;
  // Aucun bon mot, un intrus : tout est faux, deux fois.
  for (let essai = 0; essai < 2; essai++) {
    await user.click(screen.getByRole('button', { name: String(intruder.word) }));
    await user.click(screen.getByRole('button', { name: /Valider/ }));
  }
  const text = within(sheet()).getByText(/Tu as oublié/).textContent!;
  for (const w of good) expect(text).toContain(w);
  expect(text).toMatch(new RegExp(`Dans ${intruder.word}, on entend \\${intruder.heard}, pas \\[an\\]`));
  expect(screen.getAllByText('oublié')).toHaveLength(good.length);
  expect(screen.getByText('pas [an]')).toBeInTheDocument();
});

it('chasse au son au clavier : les chiffres cochent les cartes, Entrée valide puis passe à la suite', async () => {
  const user = userEvent.setup();
  const def = getExercise('foret-chasse-son-an')!;
  renderAt('/aventure/foret/chasse-son');
  await loaded();
  const first = def.items.slice(0, 4);
  const keys = first.map((it, i) => (it.correct ? String(i + 1) : '')).join('');
  await user.keyboard(keys);
  for (const it of first) expect(screen.getByRole('button', { name: String(it.word) })).toHaveAttribute('aria-pressed', String(Boolean(it.correct)));
  await user.keyboard('{Enter}');
  expect(within(sheet()).getByText(def.feedback.correct)).toBeInTheDocument();
  await user.keyboard('{Enter}');
  expect(screen.queryByRole('region', { name: 'Résultat' })).not.toBeInTheDocument();
});

it('filon : piocher la cible est juste, laisser passer une autre lettre aussi', async () => {
  unlockAll();
  demanderMoinsDAnimations();
  const user = userEvent.setup();
  const def = getExercise('mine-filon-b')!;
  renderAt('/aventure/mine/filon');
  await loaded();
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
  expect(within(sheet()).getByText(/Pas tout à fait/)).toBeInTheDocument();
});

it('filon : sans « réduire les animations », le bloc qui sort de la galerie compte comme laissé passer', async () => {
  unlockAll();
  // Sans historique, l'exercice proposé est le premier du catalogue pour ce type.
  const def = getExercise('mine-filon-b')!;
  vi.useFakeTimers();
  renderAt('/aventure/mine/filon');
  // Le contenu de l'exercice arrive par un import dynamique : on l'attend sans horloge.
  await act(() => vi.dynamicImportSettled());
  const it = def.items[0];
  act(() => {
    vi.advanceTimersByTime(9000);
  });
  const text = sheet().textContent!;
  expect(text).toMatch(it.correct ? /Pas tout à fait/ : /Bien piochée/);
  vi.useRealTimers();
});

it('mot troué : le bon bloc remplit le trou, la correction montre la bonne écriture', async () => {
  unlockAll();
  const user = userEvent.setup();
  const def = getExercise('carriere-mot-troue-1')!;
  renderAt('/aventure/carriere/mot-troue');
  await loaded();
  const it = def.items[0];
  const [wrong, other] = (it.choices as string[]).filter((c) => c !== it.answer);
  await user.click(screen.getByRole('button', { name: wrong }));
  // Premier essai raté : « Presque ! », la réponse tentée est barrée, on réessaie.
  expect(screen.getByText('Presque !')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: wrong })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: other }));
  expect(within(sheet()).getByText(new RegExp(`${it.word} s’écrit avec « ${it.answer} »`))).toBeInTheDocument();
  expect(screen.getByLabelText(/Mot à compléter/)).toHaveTextContent(`${it.before}${it.answer}${it.after}`);
});

it('tri des graines : phrase à trou, puis règle et astuce de substitution après une erreur', async () => {
  unlockAll();
  const user = userEvent.setup();
  renderAt('/aventure/ferme/graines');
  await loaded();
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
  await loaded();
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
  // 4 blocs, +2 pour trois étoiles, +2 la première fois.
  expect(saved.inventory.verre).toBe(8);
});

it('enclos et récolte : la carte de règle du niveau s’affiche avec les sujets et la phrase ; sans aide, pas de carte', () => {
  const props = { answered: null, onAnswer: () => {}, onHelp: () => {}, level: 1 };
  const cases = [
    { Screen: EnclosScreen, def: getExercise('ferme-enclos-1')!, n: 4 },
    { Screen: QcmItem, def: getExercise('ferme-recolte-1')!, n: 1 },
  ];
  for (const { Screen, def, n } of cases) {
    const items = def.items.slice(0, n);
    const title = (items[0].aid as { props: { title: string } }).props.title;
    const { container, unmount } = render(
      <SettingsProvider>
        <Screen {...props} items={items} exerciseId={def.id} />
      </SettingsProvider>,
    );
    expect(screen.getByText(title)).toBeInTheDocument();
    if (Screen === EnclosScreen) expect(container.querySelector('.panel.enclos.has-aid')).not.toBeNull();
    unmount();
    const bare = render(
      <SettingsProvider>
        <Screen {...props} items={items.map(({ aid: _aid, ...it }) => it)} exerciseId={def.id} />
      </SettingsProvider>,
    );
    expect(screen.queryByText(title)).not.toBeInTheDocument();
    expect(bare.container.querySelector('figure')).toBeNull();
    expect(bare.container.querySelector('.has-aid')).toBeNull();
    bare.unmount();
  }
});

it('familles : quand le morceau écrit ne se lit pas seul, c’est le mot de la famille qui est dit (« dans » → « danse »)', () => {
  const def = getExercise('carriere-familles-2')!;
  const item = def.items.find((it) => it.word === 'danseur')!;
  expect(item.root).toBe('dans');
  expect(item.spokenRoot).toBe('danse');
  render(
    <SettingsProvider>
      <FamillesScreen items={[item]} answered={null} onAnswer={() => {}} onHelp={() => {}} level={1} exerciseId={def.id} />
    </SettingsProvider>,
  );
  expect(within(screen.getByLabelText(/danse/)).getByText('dans', { exact: true })).toBeInTheDocument();
});

it('mot troué en deux mots : « parce que » garde un écart visible entre les deux mots', async () => {
  const def = getExercise('carriere-mot-troue-2')!;
  const item = def.items.find((it) => it.key === 'parce')!;
  expect(item.word).toBe('parce que');
  const { MotTroueScreen } = await import('./MotTroueScreen');
  const { container } = render(
    <SettingsProvider>
      <MotTroueScreen items={[item]} answered={null} onAnswer={() => {}} onHelp={() => {}} level={2} exerciseId={def.id} />
    </SettingsProvider>,
  );
  const que = within(container.querySelector('.gap-word') as HTMLElement).getByText('que', { exact: true });
  expect(que).toHaveClass('word-space-before');
});
