import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { AppRoutes } from '../App';
import { BloclandProvider } from './BloclandContext';
import { loadAllExercises } from './exercises';
import { runItems, runSeed } from './exercises/run';
import { frenchTypography } from '../components/math/RichText';

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

const DEF = getExercise('french-6e-phonology-syllables-warmup-001')!;

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
  expect(await screen.findByRole('heading', { name: DEF.instruction })).toBeInTheDocument();
  expect(document.querySelector('.item-word .syllables')).toBeNull();

  const items = await play(user, [1]);
  expect(screen.getByRole('heading', { name: 'Bien joué !' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: '2 étoiles sur 3' })).toBeInTheDocument();
  expect(screen.getByText('+6')).toBeInTheDocument(); // 3 blocs × 5/6 arrondi, +1 pour deux étoiles, +2 première fois
  expect(screen.getByText(/\+2 première fois, \+1 pour 2 étoiles/)).toBeInTheDocument();
  expect(screen.getByText('+10')).toBeInTheDocument();
  expect(screen.getByText(/1 jour d’affilée/)).toBeInTheDocument();
  // À quoi servent les blocs : le plan de l'île, avec sa jauge, et « Voir le chantier » qui l'ouvre.
  expect(document.querySelector('.reward-site')).toHaveTextContent(/La cabane de Mousso, sur Forêt des sons : 6 blocs sur les \d+ qui manquent\./);
  expect(screen.getByRole('link', { name: /Voir le chantier/ })).toHaveAttribute('href', '/aventure/foret?chantier=plan');

  const saved = JSON.parse(localStorage.getItem('dysapps:game')!);
  expect(saved.stock['french-6e-phonology']).toBe(6);
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
  // Le focus va à « J'arrête pour aujourd'hui ».
  expect(screen.getByRole('link', { name: /J’arrête pour aujourd’hui/ })).toHaveFocus();
  await user.click(screen.getByRole('button', { name: /Encore un peu/ }));
  expect(screen.getByRole('button', { name: /Rejouer/ })).toBeInTheDocument();
  // Le focus revient au bouton principal du bilan.
  expect(screen.getByRole('link', { name: /Revenir sur|Voir le chantier/ })).toHaveFocus();
  expect(JSON.parse(localStorage.getItem('dysapps:game')!).progress[DEF.id].attempts).toBe(3);
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
  expect(JSON.parse(localStorage.getItem('dysapps:game')!).progress[DEF.id].best).toBeCloseTo(5.5 / 6);
  expect(screen.queryByRole('heading', { name: 'Sans faute !' })).not.toBeInTheDocument();
});

describe('lecture automatique', () => {
  // La synthèse vocale simulée : chaque phrase dite est notée.
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
  afterEach(() => vi.unstubAllGlobals());

  /** Répond juste à l'item affiché, puis passe au suivant : renvoie ce qui a été dit entre les deux écrans. */
  async function suivant(user: ReturnType<typeof userEvent.setup>, answer: string) {
    await user.click(screen.getByRole('button', { name: answer }));
    const avant = dit.length;
    await user.click(within(screen.getByRole('region', { name: 'Résultat' })).getByRole('button', { name: /Suivant/ }));
    return dit.slice(avant);
  }

  it('sans question : la consigne seule à l’ouverture, rien de plus à l’item suivant', async () => {
    const user = userEvent.setup();
    renderAt('/aventure/foret/abattage');
    await loaded();
    // La lecture part d'un effet : on attend qu'elle ait eu lieu.
    await waitFor(() => expect(dit).toEqual([DEF.instruction]));
    const [item] = runItems(DEF, runSeed(DEF));
    expect(await suivant(user, item.answer as string)).toEqual([]);
  }, 30_000);

  it('document à lire : la consigne puis la question au premier écran, la question seule ensuite', async () => {
    const user = userEvent.setup();
    const notices = getExercise('english-5e-vocabulary-notices-1')!;
    renderAt('/aventure/comptoir/notices');
    await loaded();
    const [first, second] = runItems(notices, runSeed(notices));
    // Une seule phrase, avec l'espace insécable de la typographie française avant « ? ».
    await waitFor(() => expect(dit).toEqual([`${frenchTypography(notices.instruction)} ${frenchTypography(first.question as string)}`]));
    await suivant(user, first.answer as string);
    // La question du second écran est dite seule, sans la consigne ni le document.
    await waitFor(() => expect(dit[dit.length - 1]).toBe(frenchTypography(second.question as string)));
    const derniere = dit[dit.length - 1];
    expect(derniere).not.toContain(frenchTypography(notices.instruction));
    expect(derniere).not.toContain(second.prompt as string);
  }, 30_000);

  it('histoire à écouter (Story) : la consigne et la question, puis l’histoire en anglais ; la question et l’histoire ensuite', async () => {
    const user = userEvent.setup();
    const langues: string[] = [];
    let enCours: { onend?: () => void } | null = null;
    vi.stubGlobal('speechSynthesis', {
      cancel: () => {},
      getVoices: () => [],
      speaking: false,
      pending: false,
      speak: (u: { text: string; lang: string; onend?: () => void }) => {
        dit.push(u.text);
        langues.push(u.lang);
        enCours = u;
      },
    });
    const story = getExercise('english-6e-grammar-story-1')!;
    renderAt('/aventure/horloge/story');
    await loaded();
    const [first, second] = runItems(story, runSeed(story));
    // La première lecture part avec l'écran : sur une machine lente, après la fin du chargement.
    await waitFor(() => expect(dit).toEqual([`${frenchTypography(story.instruction)} ${frenchTypography(first.question as string)}`]));
    enCours!.onend?.();
    expect(dit.at(-1)).toBe(first.spoken);
    expect(langues).toEqual(['fr-FR', 'en-GB']);
    await suivant(user, first.answer as string);
    await waitFor(() => expect(dit.at(-1)).toBe(frenchTypography(second.question as string)));
    enCours!.onend?.();
    expect(dit.at(-1)).toBe(second.spoken);
  }, 30_000);

  it('dictée à choix en LV2 (niveau 2) : la consigne, puis le mot dans la voix de la langue ; le mot seul ensuite', async () => {
    const user = userEvent.setup();
    // La synthèse simulée finit chaque phrase aussitôt dite (fin de la consigne, puis de chaque mot).
    const langues: string[] = [];
    let enCours: { onend?: () => void } | null = null;
    vi.stubGlobal('speechSynthesis', {
      cancel: () => {},
      getVoices: () => [],
      speaking: false,
      pending: false,
      speak: (u: { text: string; lang: string; onend?: () => void }) => {
        dit.push(u.text);
        langues.push(u.lang);
        enCours = u;
      },
    });
    localStorage.setItem('dysapps:game', JSON.stringify({ types: { 'es-familia': { level: 2 } } }));
    const dictee = getExercise('lv2-5e-introductions-es-family-2')!;
    renderAt('/aventure/relais/es-familia');
    await loaded();
    const [first, second] = runItems(dictee, runSeed(dictee));
    // La première lecture part après le rendu de l'écran : on l'attend (une CI lente la lance plus tard).
    await waitFor(() => expect(dit).toEqual([frenchTypography(dictee.instruction)]));
    enCours!.onend?.();
    expect(dit).toEqual([frenchTypography(dictee.instruction), first.spoken]);
    expect(langues).toEqual(['fr-FR', 'es-ES']);
    expect(await suivant(user, first.answer as string)).toEqual([second.spoken]);
  }, 30_000);
});
