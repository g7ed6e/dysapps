import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import type { OpenWorld } from './scene';
import { WorldQuestion } from './WorldQuestion';
import enclos from '../../exercises/data/french-6e-grammar-spelling-word-classes-1.json';

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

function renderPlace(place: 'phare' | 'quais' | 'filets' | 'ecluses' | 'saltworks', mission: string, plain = false) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <WorldQuestion place={place} mission={mission} plain={plain} world={world} onClose={() => {}} />
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
    const more = screen.getByRole('button', { name: 'Lire la suite de la consigne' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await user.click(more);
    expect(screen.getByRole('button', { name: 'Replier la consigne' })).toHaveAttribute('aria-expanded', 'true');
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

  it('au plus grand texte, la consigne s’ouvre repliée : la rangée reste visible ; « Lire la suite » la déplie', async () => {
    localStorage.setItem('dysapps:settings', JSON.stringify({ fontSize: 32, univers: 'archipeo' }));
    const user = userEvent.setup();
    renderPhare();
    await screen.findByRole('list', { name: 'Cloches à trier' });
    const start = screen.queryByRole('button', { name: /Commencer/ });
    if (start) await user.click(start);
    await user.click(screen.getByRole('button', { name: /Vue simple/ }));
    // La cible sur la ligne de la consigne repliée, avant les mots ; des manches de quatre (relecture de L3).
    const target = () => document.querySelector('.world-consigne-fold .world-consigne-cible');
    expect(target()?.textContent).toMatch(/^Le son \[\S+\]$/);
    const list = screen.getByRole('list', { name: 'Cloches à trier' });
    expect(within(list).getAllByRole('button').length).toBeLessThanOrEqual(4);
    expect(target()!.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Une seule fois : la ligne de la cible au-dessus des mots ne s'ajoute pas.
    expect(document.querySelectorAll('.sound-target')).toHaveLength(1);
    const more = screen.getByRole('button', { name: 'Lire la suite de la consigne' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await user.click(more);
    expect(screen.getByRole('button', { name: 'Replier la consigne' })).toHaveAttribute('aria-expanded', 'true');
    // Dépliée, la consigne entière, et la cible toujours là.
    expect(target()).not.toBeNull();
  });
});

describe('Les trois missions du Phare aux mêmes cloches (GD-20, point 8, lot L3)', () => {
  it('l’Abattage syllabique : le mot sans syllabes en couleurs, trois cloches à toucher, sans « Valider »', async () => {
    const user = userEvent.setup();
    renderPlace('phare', 'syllables');
    expect(await screen.findByText('La gardienne du phare')).toBeInTheDocument();
    const start = screen.queryByRole('button', { name: /Commencer/ });
    if (start) await user.click(start);
    const answers = () => [...document.querySelectorAll<HTMLButtonElement>('.world-answers .world-answer')];
    await vi.waitFor(() => expect(answers()).toHaveLength(3));
    expect(answers().every((b) => /^\d$/.test(b.textContent ?? ''))).toBe(true);
    const word = document.querySelector('.question-prompt.item-word');
    expect(word).not.toBeNull();
    // Aucune couleur de syllabes : elles donneraient la réponse.
    expect(word!.querySelector('.syllables')).toBeNull();
    expect(screen.queryByRole('button', { name: /Valider/ })).toBeNull();
    // La consigne dit la cloche à toucher, jamais « tape » (relecture de L3, contenu).
    expect(document.querySelector('.quiz.in-world')!.textContent).toContain('touche la cloche du nombre de syllabes');
  });

  it('les Rimes-échelle : le même geste que la Chasse au son, le mot repère en tête, « Valider »', async () => {
    const user = userEvent.setup();
    renderPlace('phare', 'rhymes');
    await screen.findByRole('list', { name: 'Cloches à trier' });
    const start = screen.queryByRole('button', { name: /Commencer/ });
    if (start) await user.click(start);
    expect(document.querySelector('.sound-target')?.textContent).toMatch(/^Rime avec \S+/);
    const bells = within(screen.getByRole('list', { name: 'Cloches à trier' })).getAllByRole('button');
    expect(bells.length).toBeGreaterThanOrEqual(4);
    expect(bells.length).toBeLessThanOrEqual(6);
    await user.click(bells[0]);
    expect(bells[0]).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: /Valider/ }));
    // La correction de l'écran de la grille : un mot oublié ou qui ne rime pas se dit, chacun à sa place.
    // La manche est corrigée comme sur l'écran de la grille (un tri : un deuxième essai après une erreur).
    await vi.waitFor(() => expect(document.querySelector('.feedback')).not.toBeNull());
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
    // Sans « Valider », le repère « Suite plus bas » se montre tant que des caisses restent sous le bord, puis part en bas.
    const panel = document.querySelector<HTMLElement>('.quiz.in-world.simple')!;
    expect(within(panel).getByRole('img', { name: 'Suite plus bas' })).toBeInTheDocument();
    Object.defineProperty(panel, 'scrollHeight', { configurable: true, value: 600 });
    Object.defineProperty(panel, 'clientHeight', { configurable: true, value: 300 });
    // Toutes les caisses au-dessus du bord : l'indice plus bas ne rallume pas le repère.
    panel.dispatchEvent(new Event('scroll'));
    await new Promise((r) => requestAnimationFrame(r));
    expect('repere' in panel.dataset).toBe(false);
    // Une caisse sous le bord du panneau : le repère se montre.
    vi.spyOn(answers().at(-1)!, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ x: 0, y: 450, width: 80, height: 50 }));
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

describe('Toutes les missions des Quais en scénette (GD-20, point 8)', () => {
  const answers = () => [...document.querySelectorAll<HTMLButtonElement>('.world-answers .world-answer')];
  // Une tablette : la page a sa taille, la scène est demandée.
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1024);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(768);
  });
  afterEach(() => vi.restoreAllMocks());

  it.each(['times-tables', 'make-ten', 'word-problems', 'measures'])('%s : le docker, les caisses, l’item de référence ; jamais « Valider »', async (mission) => {
    const user = userEvent.setup();
    vi.mocked(world.question).mockClear();
    renderPlace('quais', mission);
    expect(await screen.findByText('Le docker')).toBeInTheDocument();
    const start = screen.queryByRole('button', { name: /Commencer/ });
    if (start) await user.click(start);
    await vi.waitFor(() => expect(answers().length).toBeGreaterThanOrEqual(3));
    // Trois choix au moins, six au plus : une caisse chacun, sur le quai vide (le gabarit du lieu n'est pas écrit).
    expect(answers().length).toBeLessThanOrEqual(6);
    expect(screen.queryByRole('button', { name: /Valider/ })).toBeNull();
    // La scène est demandée avec la mission (sa trace au retour) et le quai vide.
    await vi.waitFor(() => expect(world.question).toHaveBeenCalled());
    const request = vi.mocked(world.question).mock.calls.at(-1)?.[0];
    expect(request).toMatchObject({ place: 'quais', mission, item: { scene: { kind: 'quai', op: 'calcul' } } });
    // La figure ou l'aide de l'item restent dans le panneau, comme sur l'écran classique.
    const panel = document.querySelector('.quiz.in-world')!;
    expect(panel.querySelector('.world-question-figure, .world-question-aid')).not.toBeNull();
  });

  it('une mission dont la scénette n’est pas faite se joue sur l’écran habituel : ni rôle, ni « Vue simple », ni scène', async () => {
    vi.mocked(world.question).mockClear();
    renderPlace('filets', 'e-er-ez', true);
    await vi.waitFor(() => expect(document.querySelector('.quiz.in-world.ecran-habituel')).not.toBeNull());
    expect(screen.queryByText('La pêcheuse')).toBeNull();
    expect(screen.queryByRole('button', { name: /Vue simple/ })).toBeNull();
    // L'écran de la grille, avec sa consigne écrite en tête.
    expect(document.querySelector('.quiz.in-world.ecran-habituel > .consigne')).not.toBeNull();
    expect(document.querySelector('.world-place')).toBeNull();
    expect(world.question).not.toHaveBeenCalled();
  });
});

describe('Toutes les missions des Écluses en scénette (GD-20, point 8, lot L2)', () => {
  const answers = () => [...document.querySelectorAll<HTMLButtonElement>('.world-answers .world-answer')];
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1024);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(768);
  });
  afterEach(() => vi.restoreAllMocks());

  const start = async () => {
    const user = userEvent.setup();
    expect(await screen.findByText('L’éclusier')).toBeInTheDocument();
    const go = screen.queryByRole('button', { name: /Commencer/ });
    if (go) await user.click(go);
    await vi.waitFor(() => expect(answers().length).toBeGreaterThanOrEqual(3));
    await vi.waitFor(() => expect(world.question).toHaveBeenCalled());
    return vi.mocked(world.question).mock.calls.at(-1)![0]!;
  };

  it('Deux rives : sa consigne, les deux sas dans la scène, les barres dans « Vue simple » seulement', async () => {
    const user = userEvent.setup();
    vi.mocked(world.question).mockClear();
    renderPlace('ecluses', 'equivalence');
    const request = await start();
    expect(request).toMatchObject({ place: 'ecluses', mission: 'equivalence', item: { scene: { kind: 'lockPair' }, count: 3 } });
    expect(document.querySelector('.quiz.in-world')!.textContent).toContain('Touche la plus grande fraction');
    expect(document.querySelector('.quiz.in-world .world-question-aid')).toBeNull();
    // La phrase courte du contenu ; les deux fractions comparées et leur point sur une seule ligne.
    expect(document.querySelector('.question-prompt')!.textContent).toMatch(/^Compare /);
    const together = [...document.querySelectorAll('.question-prompt .world-nobreak')];
    expect(together.some((n) => n.querySelectorAll('.frac').length === 2 && (n.textContent ?? '').endsWith('.'))).toBe(true);
    await user.click(screen.getByRole('button', { name: /Vue simple/ }));
    expect(document.querySelector('.quiz.in-world.simple .world-question-aid')).not.toBeNull();
    // En « Vue simple », ses trois réponses sur une rangée.
    expect(document.querySelector('.quiz.in-world.simple .world-answers.une-rangee')).not.toBeNull();
  });

  it.each(['sharing', 'place-value'])('%s : le sas au repos, l’item de référence, une réponse par levier', async (mission) => {
    vi.mocked(world.question).mockClear();
    renderPlace('ecluses', mission);
    const request = await start();
    expect(request).toMatchObject({ place: 'ecluses', mission, item: { scene: { kind: 'lockIdle', column: false } } });
    expect(request.layout.slots).toHaveLength(answers().length);
  });

  it('Calculer avec des fractions : les réponses dans la colonne, juste après la phrase ; aucune dans la scène', async () => {
    vi.mocked(world.question).mockClear();
    renderPlace('ecluses', 'fraction-sums');
    const request = await start();
    expect(request).toMatchObject({ item: { scene: { kind: 'lockIdle', column: true } } });
    expect(request.layout.slots).toEqual([]);
    expect(document.querySelector('.quiz.in-world.reponses-colonne .world-question-prompt .world-answers')).not.toBeNull();
    for (const a of answers()) expect(a.style.left).toBe('');
  });
});

describe('L’Enclos au plus grand texte sur un téléphone couché (dérogation du 16 octobre 2026)', () => {
  it('la règle sur la ligne de la consigne repliée, la consigne dépliable ; un sujet sous la bande de « Valider » allume le chevron', async () => {
    localStorage.setItem('dysapps:settings', JSON.stringify({ fontSize: 32, univers: 'archipeo' }));
    const user = userEvent.setup();
    renderPlace('filets', 'word-classes');
    expect(await screen.findByText('La pêcheuse')).toBeInTheDocument();
    const go = screen.queryByRole('button', { name: /Commencer/ });
    if (go) await user.click(go);
    const simple = screen.queryByRole('button', { name: /Vue simple/ });
    if (simple) await user.click(simple);
    await vi.waitFor(() => expect(document.querySelector('.world-consigne-fold .world-consigne-regle')).not.toBeNull());
    // Repliée, la règle tient la ligne ; « Lire la suite » (l'icône du livre) montre la consigne, la règle reste.
    const fold = document.querySelector('.world-consigne-fold')!;
    const words = fold.querySelector<HTMLElement>(':scope > [aria-hidden="true"]')!;
    expect(words.hidden).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Lire la suite de la consigne' }));
    expect(words.hidden).toBe(false);
    expect(words.textContent).toMatch(/Touche le sujet, puis son panier/);
    expect(fold.querySelector('.world-consigne-regle')).not.toBeNull();
    // Le panneau défile : tant qu'un sujet est caché sous la bande de « Valider », le chevron « Suite plus bas ».
    const panel = document.querySelector<HTMLElement>('.quiz.in-world.simple')!;
    Object.defineProperty(panel, 'scrollHeight', { configurable: true, value: 600 });
    Object.defineProperty(panel, 'clientHeight', { configurable: true, value: 300 });
    vi.spyOn(panel.querySelector('.world-simple-validate')!, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ x: 0, y: 250, width: 600, height: 54 }));
    panel.dispatchEvent(new Event('scroll'));
    await new Promise((r) => requestAnimationFrame(r));
    expect('repere' in panel.dataset).toBe(false);
    vi.spyOn(panel.querySelector('.world-sort-prise')!, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ x: 0, y: 260, width: 120, height: 48 }));
    panel.dispatchEvent(new Event('scroll'));
    await vi.waitFor(() => expect('repere' in panel.dataset).toBe(true));
    expect(within(panel).getByRole('img', { name: 'Suite plus bas' })).toBeInTheDocument();
    // Replier la consigne ne change que des attributs (la classe du panneau, `hidden`) : le repère se recalcule sans
    // défilement (sonde des plis du lot L5 : il restait éteint quand la consigne dépliée poussait les réponses).
    vi.spyOn(panel.querySelector('.world-sort-prise')!, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ x: 0, y: 100, width: 120, height: 48 }));
    await user.click(screen.getByRole('button', { name: 'Replier la consigne' }));
    await vi.waitFor(() => expect('repere' in panel.dataset).toBe(false));
    vi.restoreAllMocks();
    localStorage.removeItem('dysapps:settings');
  });
});

describe('Les Filets complets (GD-20, point 8, lot L4)', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1024);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(768);
  });
  afterEach(() => vi.restoreAllMocks());

  const begin = async () => {
    const user = userEvent.setup();
    expect(await screen.findByText('La pêcheuse')).toBeInTheDocument();
    const go = screen.queryByRole('button', { name: /Commencer/ });
    if (go) await user.click(go);
    return user;
  };
  const lastRequest = () => vi.mocked(world.question).mock.calls.at(-1)![0]!;

  it('l’Enclos se range au clavier : prendre, reposer (Échap, sans fermer le panneau), ranger, reprendre, puis « Valider »', async () => {
    vi.mocked(world.question).mockClear();
    renderPlace('filets', 'word-classes');
    const user = await begin();
    const subjects = () => within(screen.getByRole('list', { name: 'Sujets à ranger' })).getAllByRole('button');
    const bins = () => within(screen.getByRole('list', { name: 'Paniers' })).getAllByRole('button');
    await vi.waitFor(() => expect(subjects()).toHaveLength(4));
    expect(bins().map((b) => b.textContent)).toEqual(['Singulier', 'Pluriel']);
    // La consigne dit le geste ; « Valider » attend que tout soit rangé.
    expect(document.querySelector('.quiz.in-world')!.textContent).toMatch(/Pour chaque sujet, son verbe est-il au singulier ou au pluriel\s?\? Touche le sujet, puis son panier\./);
    const validate = screen.getByRole('button', { name: /Valider/ });
    expect(validate).toBeDisabled();
    const status = screen.getByRole('status');

    // Un panier touché sans rien tenir : une phrase douce, rien ne change.
    await user.click(bins()[0]);
    expect(status).toHaveTextContent('Touche d’abord un sujet');

    // Prendre : le sujet est tenu, dit, et les paniers le nomment.
    subjects()[0].focus();
    await user.keyboard('{Enter}');
    const first = subjects()[0].querySelector('.word-text')!.textContent!;
    expect(subjects()[0]).toHaveAttribute('aria-pressed', 'true');
    expect(status).toHaveTextContent(`Tu tiens : ${first}`);
    expect(bins()[1]).toHaveAccessibleName(`Panier Pluriel : y ranger ${first}`);
    expect(lastRequest().item).toMatchObject({ scene: { kind: 'enclos' }, count: 6, sort: { bins: [0, 5], held: 1 } });

    // Échap repose le sujet ; le panneau n'entend pas Échap tant qu'un sujet est tenu.
    const closes = vi.fn();
    window.addEventListener('keydown', closes);
    await user.keyboard('{Escape}');
    expect(closes).not.toHaveBeenCalled();
    expect(subjects()[0]).toHaveAttribute('aria-pressed', 'false');
    // L'annonce nomme le sujet reposé : deux reposés de suite se disent chacun (relecture de L4, code).
    expect(status).toHaveTextContent(`Reposé : ${first}.`);
    await user.keyboard('{Escape}');
    expect(closes).toHaveBeenCalledTimes(1);
    window.removeEventListener('keydown', closes);

    // Ranger les quatre : après chaque dépôt, le focus va au prochain sujet pas encore rangé, puis à « Valider ».
    for (let i = 0; i < 4; i++) {
      await user.click(subjects()[i]);
      await user.click(bins()[i % 2]);
      expect(status).toHaveTextContent('rangé dans');
      if (i < 3) expect(subjects()[i + 1]).toHaveFocus();
    }
    expect(validate).toHaveFocus();
    expect(validate).toBeEnabled();
    expect(lastRequest().item.sort).toMatchObject({ held: null, placed: [null, 0, 5, 0, 5, null] });
    // Un sujet rangé se reprend jusqu'à « Valider » : il sort de son panier.
    await user.click(subjects()[1]);
    expect(validate).toBeDisabled();
    await user.click(bins()[0]);
    expect(lastRequest().item.sort).toMatchObject({ placed: [null, 0, 0, 0, 5, null] });
    const round = subjects().map((b) => b.textContent);
    await user.click(validate);
    // La manche est corrigée : la suivante s'ouvre, rien de tenu, rien de rangé.
    await vi.waitFor(() => expect(subjects().map((b) => b.textContent)).not.toEqual(round));
    expect(subjects().every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true);
  });

  it('l’Enclos, après « Valider » : chaque sujet montre son verbe accordé, et la voix le dit ; les paniers ont leur icône', async () => {
    const said: string[] = [];
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        lang = '';
        rate = 1;
        voice: unknown = null;
        onend: unknown = null;
        constructor(public text: string) {}
      },
    );
    vi.stubGlobal('speechSynthesis', { cancel: () => {}, getVoices: () => [], speak: (u: { text: string }) => said.push(u.text) });
    renderPlace('filets', 'word-classes');
    const user = await begin();
    const subjects = () => within(screen.getByRole('list', { name: 'Sujets à ranger' })).getAllByRole('button');
    const bins = () => within(screen.getByRole('list', { name: 'Paniers' })).getAllByRole('button');
    await vi.waitFor(() => expect(subjects()).toHaveLength(4));
    expect(bins().every((b) => b.querySelector('svg'))).toBe(true);
    // Les sujets en texte simple : aucune syllabe colorée (elle marquerait le -s final).
    expect(document.querySelector('.world-sort-prise .syllable, .world-sort-prise [class*="syll"]')).toBeNull();
    const items = new Map(enclos.items.map((it) => [it.subject, it]));
    const shown = subjects().map((b) => items.get(b.querySelector('.word-text')!.textContent!)!);
    for (const [i, it] of shown.entries()) {
      await user.click(subjects()[i]);
      await user.click(bins()[it.answer === 'pluriel' ? 1 : 0]);
    }
    await user.click(screen.getByRole('button', { name: /Valider/ }));
    for (const [i, it] of shown.entries()) expect(subjects()[i].querySelector('.world-sort-verbe')).toHaveTextContent(it.answer === 'pluriel' ? it.plural : it.singular);
    await user.click(screen.getByRole('button', { name: /Écouter les sujets/ }));
    const first = shown[0];
    expect(said.at(-1)).toContain(`${first.subject} ${first.answer === 'pluriel' ? first.plural : first.singular}`);
    // Sur tablette, la carte de règle entière est à côté : pas de ligne de règle en plus.
    expect(document.querySelector('.world-sort-regle')).toBeNull();
    vi.unstubAllGlobals();
  });

  it.each([
    ['sorting', 2],
    ['e-er-ez', 3],
  ])('%s : la phrase dans le panneau, un panier par réponse, rien dans la scène ne désigne la réponse', async (mission, n) => {
    vi.mocked(world.question).mockClear();
    renderPlace('filets', mission);
    await begin();
    await vi.waitFor(() => expect(document.querySelectorAll('.world-answers .world-answer')).toHaveLength(n));
    await vi.waitFor(() => expect(world.question).toHaveBeenCalled());
    // La pêche du jour sur le filet, la même pour tous les items : la scène ne dit pas la réponse.
    expect(lastRequest()).toMatchObject({ place: 'filets', mission, item: { scene: { kind: 'filets', catch: 'pêche', count: 1 }, count: n } });
    expect(document.querySelector('.question-prompt')!.textContent).not.toBe('');
  });
});

describe('Les Marais salants (GD-20, point 8, lot L5)', () => {
  it('sur un téléphone couché, les deux entiers de la jauge se montrent dès le premier item, pas seulement après la première réponse', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(667);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(375);
    // Le panneau de « Commencer » couvre la scène ; au premier item, il se réduit à la colonne de gauche.
    const rect = Element.prototype.getBoundingClientRect;
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      if (!this.classList.contains('quiz')) return rect.call(this);
      return this.classList.contains('intro') ? DOMRect.fromRect({ x: 8, y: 92, width: 651, height: 253 }) : DOMRect.fromRect({ x: 8, y: 28, width: 253, height: 324 });
    });
    vi.mocked(world.question).mockImplementation(() => [{ text: '8', x: 520, y: 100 }]);
    const user = userEvent.setup();
    renderPlace('saltworks', 'scale');
    await user.click(await screen.findByRole('button', { name: /Commencer/ }));
    await vi.waitFor(() => expect(document.querySelector('.world-question-label')?.textContent).toBe('8'));
    vi.mocked(world.question).mockImplementation(() => []);
    vi.restoreAllMocks();
  });
});
