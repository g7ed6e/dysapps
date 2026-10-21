import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MemoryRouter } from 'react-router-dom';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import type { OpenWorld } from './scene';
import { JAUGE_INSTRUCTION, JAUGE_PROMPT } from '../../world/continu/questions';
import { PIN_MAX, PlaceText, WorldQuestion, afterAnswer, foldReserve, onResult } from './WorldQuestion';
import { belowFold } from './fit';
import { PlaceDocument } from './placeScreen';
import { exercisesOf, loadExercise } from '../../exercises';
import { getBiome } from '../../biomes';
import { placeById, type PlaceId } from '../../world/continu/plan6e';
import enclos from '../../exercises/data/french-6e-grammar-spelling-word-classes-1.json';

// La scène 3D n'est pas là sous jsdom : la question ne lui demande que de poser les objets et d'allumer la lampe.
const world = { question: vi.fn(() => []), onSceneTurn: vi.fn(() => () => {}), scenetteEnd: vi.fn() } as unknown as OpenWorld;

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
});
// Les tailles et les rectangles simulés ne passent jamais d'un test à l'autre (relecture du lot L5, expert frontend).
afterEach(() => vi.restoreAllMocks());
// Les exercices écrits en JSON se chargent à la demande (`loadExercise`) : le panneau montre « Chargement… » jusqu'à
// leur arrivée. Sous la charge de la suite complète, un premier import dépassait l'attente d'un `findByText` du rôle
// (« L'éclusier », « Le docker » introuvables). Ceux de tous les lieux du fichier sont chargés une fois, avant les tests :
// la cause est retirée, aucune attente n'est allongée.
beforeAll(async () => {
  const places: PlaceId[] = ['phare', 'quais', 'filets', 'ecluses', 'saltworks', 'engine', 'shipyard'];
  await Promise.all(
    places.flatMap((place) => {
      const biome = getBiome(placeById(place).island)!;
      return biome.exercises.flatMap((mission) => exercisesOf(biome.id, mission.id).map((e) => loadExercise(e.id)));
    }),
  );
});

function renderPlace(place: 'phare' | 'quais' | 'filets' | 'ecluses' | 'saltworks' | 'engine' | 'shipyard' | 'lookout' | 'archives' | 'printworks' | 'mangrove' | 'ruins' | 'observatory' | 'commons' | 'beacons' | 'ferry', mission: string, plain = false) {
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

describe('La phrase d’un lieu', () => {
  it('garde le point final avec le trou, sans toucher au trou d’une fraction', () => {
    const { container } = render(<PlaceText text="Une expédition s’appelle une … ." />);
    const glued = [...container.querySelectorAll('.world-nobreak')];
    // Collé vraiment : aucune espace entre le trou et le point.
    expect(glued.map((n) => n.textContent)).toEqual(['….']);
    const frac = render(<PlaceText text="Complète …/4 ." />).container;
    expect(frac.querySelector('.world-nobreak')).toBeNull();
  });
});

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
    // Sans « Valider », le repère « Suite plus bas » se montre tant qu'il reste quoi que ce soit sous le bord, une caisse
    // ou seulement l'indice (relecture du lot L5, consultant UX UI), puis part en bas, la dernière caisse atteinte.
    const panel = document.querySelector<HTMLElement>('.quiz.in-world.simple')!;
    expect(within(panel).getByRole('img', { name: 'Suite plus bas' })).toBeInTheDocument();
    Object.defineProperty(panel, 'scrollHeight', { configurable: true, value: 600 });
    Object.defineProperty(panel, 'clientHeight', { configurable: true, value: 300 });
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ x: 0, y: 0, width: 400, height: 300 }));
    // La dernière caisse suit le défilement : 450 px sous le haut du contenu.
    const last = answers().at(-1)!;
    vi.spyOn(last, 'getBoundingClientRect').mockImplementation(() => DOMRect.fromRect({ x: 0, y: 450 - panel.scrollTop, width: 80, height: 50 }));
    panel.dispatchEvent(new Event('scroll'));
    await vi.waitFor(() => expect('repere' in panel.dataset).toBe(true));
    expect(last.getBoundingClientRect().bottom).toBeGreaterThan(panel.getBoundingClientRect().bottom);
    // Défilé jusqu'en bas : la dernière caisse est dans le panneau, le repère part.
    panel.scrollTop = 300;
    panel.dispatchEvent(new Event('scroll'));
    await vi.waitFor(() => expect('repere' in panel.dataset).toBe(false));
    expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(panel.getBoundingClientRect().bottom);
    // Rien d'autre que l'indice plus bas, toutes les caisses visibles : le repère se montre encore.
    panel.scrollTop = 0;
    vi.spyOn(last, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ x: 0, y: 200, width: 80, height: 50 }));
    panel.dispatchEvent(new Event('scroll'));
    await vi.waitFor(() => expect('repere' in panel.dataset).toBe(true));
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

  it('un mot coupé dans son étiquette : « Vue simple » proposé, la scène ne dessine plus les objets des réponses, la voix garde son nom (retouche 3 du lot 5 du 5e)', async () => {
    const user = userEvent.setup();
    vi.mocked(world.question).mockClear();
    vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] });
    vi.stubGlobal('SpeechSynthesisUtterance', class {});
    // Chaque étiquette de réponse plus étroite que son mot (la page, elle, a la taille d'une tablette).
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('world-answer-label') ? 2000 : 0;
    });
    renderPlace('quais', 'times-tables');
    expect(await screen.findByText('Le docker')).toBeInTheDocument();
    const start = screen.queryByRole('button', { name: /Commencer/ });
    if (start) await user.click(start);
    await vi.waitFor(() => expect(document.querySelector('.quiz.in-world.offer.answers-out')).not.toBeNull());
    expect(vi.mocked(world.question).mock.calls[0]?.[0]).toMatchObject({ answersOut: false });
    // Les objets sans étiquette ne se dessinent plus : rien ne semble se toucher dans la scène.
    await vi.waitFor(() => expect(vi.mocked(world.question).mock.calls.at(-1)?.[0]).toMatchObject({ answersOut: true }));
    // Seul sous « Vue simple », le haut-parleur de la question garde un nom (sa phrase écrite est cachée).
    const voice = document.querySelector<HTMLButtonElement>('.quiz.in-world.offer .question-head .speak-button');
    expect(voice?.getAttribute('aria-label')).toMatch(/^\S.* : \S/);
    vi.unstubAllGlobals();
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
    const scenePrompt = document.querySelector('.question-prompt')!.textContent;
    expect(scenePrompt).toMatch(/^Compare /);
    const together = [...document.querySelectorAll('.question-prompt .world-nobreak')];
    expect(together.some((n) => n.querySelectorAll('.frac').length === 2 && (n.textContent ?? '').endsWith('.'))).toBe(true);
    await user.click(screen.getByRole('button', { name: /Vue simple/ }));
    expect(document.querySelector('.quiz.in-world.simple .world-question-aid')).not.toBeNull();
    // En « Vue simple », l'item de référence en entier : sa phrase et sa consigne, plus celles des deux sas.
    expect(document.querySelector('.question-prompt')!.textContent).not.toBe(scenePrompt);
    expect(document.querySelector('.quiz.in-world')!.textContent).not.toContain('Touche la plus grande fraction');
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
    // Le panneau défile : tant que quelque chose est caché sous la bande de « Valider », le chevron « Suite plus bas ».
    const panel = document.querySelector<HTMLElement>('.quiz.in-world.simple')!;
    Object.defineProperty(panel, 'scrollHeight', { configurable: true, value: 600 });
    Object.defineProperty(panel, 'clientHeight', { configurable: true, value: 300 });
    panel.dispatchEvent(new Event('scroll'));
    await vi.waitFor(() => expect('repere' in panel.dataset).toBe(true));
    expect(within(panel).getByRole('img', { name: 'Suite plus bas' })).toBeInTheDocument();
    // Replier la consigne ne change que des attributs (la classe du panneau, `hidden`) : le repère se recalcule sans
    // défilement (sonde des plis du lot L5 : il restait éteint quand la consigne dépliée poussait les réponses).
    Object.defineProperty(panel, 'scrollHeight', { configurable: true, value: 300 });
    await user.click(screen.getByRole('button', { name: 'Replier la consigne' }));
    await vi.waitFor(() => expect('repere' in panel.dataset).toBe(false));
    // La déplier pousse de nouveau la suite sous le bord : le chevron se rallume.
    Object.defineProperty(panel, 'scrollHeight', { configurable: true, value: 600 });
    await user.click(screen.getByRole('button', { name: 'Lire la suite de la consigne' }));
    await vi.waitFor(() => expect('repere' in panel.dataset).toBe(true));
    localStorage.removeItem('dysapps:settings');
  });
});

describe('Les Filets complets (GD-20, point 8, lot L4)', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1024);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(768);
  });

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
  });

  it('la Pente graduée, niveau 1 : la jauge et ses textes dans la scène ; « Vue simple » joue l’item de référence en entier', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1024);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(768);
    const user = userEvent.setup();
    vi.mocked(world.question).mockClear();
    renderPlace('saltworks', 'scale');
    expect(await screen.findByText('La saunière')).toBeInTheDocument();
    const go = screen.queryByRole('button', { name: /Commencer/ });
    if (go) await user.click(go);
    await vi.waitFor(() => expect(world.question).toHaveBeenCalled());
    expect(vi.mocked(world.question).mock.calls.at(-1)![0]).toMatchObject({ place: 'saltworks', item: { scene: { kind: 'jauge' } } });
    // Les espaces insécables de la typographie française comptent comme des espaces.
    const text = (el: Element | null) => (el?.textContent ?? '').replace(/\s/gu, ' ');
    const panel = () => document.querySelector('.quiz.in-world')!;
    const prompt = () => text(document.querySelector('.question-prompt'));
    expect(prompt()).toBe(JAUGE_PROMPT);
    expect(text(panel())).toContain(JAUGE_INSTRUCTION);
    expect(panel().querySelector('.world-question-figure')).toBeNull();
    await user.click(screen.getByRole('button', { name: /Vue simple/ }));
    // La phrase, la consigne et la droite graduée de la référence.
    await vi.waitFor(() => expect(prompt()).not.toBe(JAUGE_PROMPT));
    expect(text(panel())).not.toContain(JAUGE_INSTRUCTION);
    expect(panel().querySelector('.world-question-figure')).not.toBeNull();
    // « Scène » : la jauge et ses textes reviennent.
    await user.click(screen.getByRole('button', { name: /Scène/ }));
    expect(prompt()).toBe(JAUGE_PROMPT);
  });
});

describe('La Turbine, ses quatre missions en C (GD-20, point 8, lot L6a)', () => {
  const answers = () => [...document.querySelectorAll<HTMLButtonElement>('.world-answers .world-answer')];
  const panel = () => document.querySelector<HTMLElement>('.quiz.in-world')!;
  const follows = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  // Le même ordre dans la scène et dans « Vue simple » : la phrase, les réponses, le document, puis le reste.
  const inOrder = () => {
    const head = panel().querySelector('.question-head')!;
    const list = panel().querySelector('.world-answers')!;
    expect(follows(head, list)).toBe(true);
    const doc = panel().querySelector('.world-document');
    if (doc) {
      expect(follows(list, doc)).toBe(true);
      for (const after of panel().querySelectorAll('.world-question-actions, .world-question-aid')) expect(follows(doc, after)).toBe(true);
    }
  };
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1024);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(768);
  });

  const start = async (mission: string) => {
    const user = userEvent.setup();
    vi.mocked(world.question).mockClear();
    renderPlace('engine', mission);
    expect(await screen.findByText('La machiniste')).toBeInTheDocument();
    const go = screen.queryByRole('button', { name: /Commencer/ });
    if (go) await user.click(go);
    await vi.waitFor(() => expect(answers().length).toBeGreaterThanOrEqual(2));
    await vi.waitFor(() => expect(world.question).toHaveBeenCalled());
    return user;
  };
  const last = () => vi.mocked(world.question).mock.calls.at(-1)![0]!;

  it.each(['states-of-matter', 'motion-signals', 'energy-circuits', 'materials-light'])(
    '%s : la scène neutre, les réponses dans la colonne, dans le même ordre qu’en « Vue simple »',
    async (mission) => {
      const user = await start(mission);
      expect(last()).toMatchObject({ place: 'engine', mission, item: { scene: { kind: 'column' }, answered: false } });
      expect(last().layout.slots).toEqual([]);
      expect(panel().classList.contains('reponses-colonne')).toBe(true);
      expect(panel().classList.contains('mode-c')).toBe(true);
      for (const a of answers()) expect(a.style.left).toBe('');
      inOrder();
      await user.click(screen.getByRole('button', { name: /Vue simple/ }));
      expect(panel().classList.contains('simple')).toBe(true);
      expect(panel().classList.contains('mode-c')).toBe(true);
      inOrder();
    },
  );

  // Le témoin lit la bonne réponse dans l'exercice lui-même (jamais dans ce qu'affiche le panneau : relecture du code de
  // L6a), retrouvée par les réponses montrées.
  const rightAnswer = async () => {
    const shown = answers().map((a) => a.querySelector('.world-answer-label')?.textContent?.trim() ?? a.textContent?.trim() ?? '');
    const exercise = await loadExercise('physics-chemistry-6e-matter-energy-energy-circuits-1');
    const items = (exercise as unknown as { items: { prompt?: string; question?: string; choices?: string[]; answer?: string }[] }).items;
    // Les mêmes réponses servent à plusieurs items (« en chaleur », « en mouvement »…) : la phrase les départage.
    const letters = (t: string) => t.normalize('NFD').replace(/[^a-z]/giu, '').toLowerCase();
    const head = letters(panel().querySelector('.question-head')?.textContent ?? '');
    const item = items.find(
      (it) => it.choices && it.choices.length === shown.length && it.choices.every((c) => shown.includes(c)) && head.includes(letters(it.question ?? it.prompt ?? '').slice(0, 16)),
    );
    expect(item?.answer).toBeTruthy();
    return { shown, answer: item!.answer! };
  };

  it('le témoin se lève après un essai faux puis la bonne réponse', async () => {
    const user = await start('energy-circuits');
    const { shown, answer } = await rightAnswer();
    await user.click(answers()[shown.findIndex((s) => s !== answer)]);
    expect(document.querySelector('.next-button')).toBeNull();
    expect(last().item.answered).toBe(false);
    await user.click(answers()[shown.indexOf(answer)]);
    await vi.waitFor(() => expect(last().item.answered).toBe(true));
  });

  it('le témoin reste au repos après deux essais faux (la correction)', async () => {
    const user = await start('energy-circuits');
    const { shown, answer } = await rightAnswer();
    const wrong = shown.map((s, i) => (s === answer ? -1 : i)).filter((i) => i >= 0);
    for (const i of wrong) {
      if (document.querySelector('.next-button')) break;
      await user.click(answers()[i]);
    }
    await vi.waitFor(() => expect(document.querySelector('.next-button')).not.toBeNull());
    expect(last().item.answered).toBe(false);
  });

  it('la voix de la phrase a sa place dans la ligne épinglée ; une phrase trop haute pour l’épinglé n’y tient pas', async () => {
    // Une phrase plus haute que la moitié du panneau (la règle du directeur artistique, relecture de L6a) : seule la
    // ligne reste épinglée, la voix de la phrase y passe.
    expect(PIN_MAX).toBe(0.5);
    vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] });
    vi.stubGlobal('SpeechSynthesisUtterance', class {});
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(500);
    await start('energy-circuits');
    await vi.waitFor(() => expect(panel().dataset.epingle).toBe('ligne'));
    expect(within(panel().querySelector<HTMLElement>(':scope > .world-phrase-voice')!).getByRole('button', { name: /^Phrase : / })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('une phrase qui tient dans la moitié du panneau reste épinglée', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(100);
    await start('energy-circuits');
    await vi.waitFor(() => expect(panel().dataset.epingle).toBe('phrase'));
  });

  // À la réponse, une fois par item : la phrase épinglée cède la place au résultat qui ne tiendrait pas sous elle
  // (« Suivant » entier au-dessus du pli), et la garde quand il tient (directeur artistique, L8).
  it.each([
    [700, 'ligne'],
    [100, 'phrase'],
  ])('après la réponse, un résultat de %i px laisse la phrase en « %s »', async (sheet, epingle) => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.matches('.result-sheet') ? sheet : 100;
    });
    const user = await start('energy-circuits');
    await vi.waitFor(() => expect(panel().dataset.epingle).toBe('phrase'));
    const { shown, answer } = await rightAnswer();
    await user.click(answers()[shown.indexOf(answer)]);
    const next = await screen.findByRole('button', { name: /Suivant/ });
    next.focus();
    await vi.waitFor(() => expect(panel().dataset.epingle).toBe(epingle));
    // La décision tient pour l'item : la mesure suivante de l'épinglage ne la défait pas.
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    expect(panel().dataset.epingle).toBe(epingle);
  });
});

describe('Le document d’un C (lot L6a)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('toujours ouvert : « Écouter le document » en tête, une ligne par information', () => {
    vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] });
    vi.stubGlobal('SpeechSynthesisUtterance', class {});
    render(
      <SettingsProvider>
        <PlaceDocument text={'Les sources d’énergie\nÉoliennes : le vent\nBarrage : l’eau'} spoken="Les sources d’énergie." />
      </SettingsProvider>,
    );
    expect(screen.getByRole('button', { name: /^Écouter le document : Les sources d’énergie/ })).toBeInTheDocument();
    expect(document.querySelectorAll('.world-document .notice-line')).toHaveLength(3);
    expect(document.querySelector('details, [aria-expanded]')).toBeNull();
  });
});

describe('Le défilement d’un C après une réponse (relecture de L6a)', () => {
  const rect = (el: Element, top: number, height: number) =>
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ top, bottom: top + height, height, left: 0, right: 300, width: 300, x: 0, y: top, toJSON: () => ({}) });
  const build = (repere: boolean) => {
    const panel = document.createElement('div');
    panel.innerHTML = `<div class="world-consigne-line" style="position: sticky"></div><div class="question-head" style="position: sticky"></div><div class="world-answers"></div><button class="next-button"></button>${repere ? '<div class="world-repere" style="--repere-haut: 34px"></div>' : ''}`;
    document.body.append(panel);
    Object.defineProperty(panel, 'clientHeight', { configurable: true, value: 300 });
    Object.defineProperty(panel, 'clientTop', { configurable: true, value: 0 });
    rect(panel, 100, 300);
    rect(panel.querySelector('.world-consigne-line')!, 100, 40);
    rect(panel.querySelector('.question-head')!, 140, 60);
    return panel;
  };
  afterEach(() => document.body.replaceChildren());

  it('la réserve du pli est la hauteur du repère « Suite plus bas », lue dans son style, 0 sans repère', () => {
    expect(foldReserve(build(true))).toBe(34);
    document.body.replaceChildren();
    expect(foldReserve(build(false))).toBe(0);
  });

  it('assez bas pour voir « Suivant », jamais au point de cacher les réponses sous l’épinglé', () => {
    const panel = build(false);
    rect(panel.querySelector('.world-answers')!, 210, 200);
    // « Suivant » loin dessous : on s'arrête aux réponses, juste sous la phrase épinglée (210 − 100 − 100 − 4).
    rect(panel.querySelector('.next-button')!, 800, 56);
    expect(afterAnswer(panel, panel.querySelector('.world-answers')!, panel.querySelector('.next-button')!)).toBe(6);
    // « Suivant » presque visible : on descend juste ce qu'il faut pour voir son bas (402 − 100 − 300).
    rect(panel.querySelector('.next-button')!, 350, 52);
    expect(afterAnswer(panel, panel.querySelector('.world-answers')!, panel.querySelector('.next-button')!)).toBe(2);
    // Déjà visible : rien ne bouge.
    rect(panel.querySelector('.next-button')!, 300, 56);
    expect(afterAnswer(panel, panel.querySelector('.world-answers')!, panel.querySelector('.next-button')!)).toBe(0);
  });

  it('le résultat d’abord : la réponse choisie juste sous l’épinglé quand « Suivant » reste entier, sinon le résultat (L8)', () => {
    const panel = build(false);
    const chosen = document.createElement('button');
    const sheet = document.createElement('div');
    panel.append(chosen, sheet);
    rect(chosen, 210, 56);
    rect(sheet, 270, 150);
    const next = panel.querySelector('.next-button')!;
    // Tout tient : la réponse choisie commence juste sous la phrase épinglée (210 − 100 − 100 − 4).
    rect(next, 350, 50);
    expect(onResult(panel, chosen, sheet, next)).toBe(6);
    // « Suivant » ne tiendrait plus avec la réponse : le résultat commence juste sous l'épinglé (270 − 100 − 100 − 4), et
    // « Suivant » est entier (il faut descendre de 40).
    rect(next, 390, 50);
    expect(onResult(panel, chosen, sheet, next)).toBe(66);
    // Le résultat plus haut que la place : son haut (« Bravo ! ») d'abord.
    rect(next, 500, 50);
    expect(onResult(panel, chosen, sheet, next)).toBe(66);
  });
});

describe('La Mangrove, ses quatre missions en C (GD-20, point 8, lot L8a)', () => {
  const answers = () => [...document.querySelectorAll<HTMLButtonElement>('.world-answers .world-answer')];
  const panel = () => document.querySelector<HTMLElement>('.quiz.in-world')!;
  const follows = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1024);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(768);
  });
  beforeAll(async () => {
    await Promise.all(['living-groups', 'food-growth', 'planet-earth', 'life-enquiry'].map((m) => loadExercise(`life-earth-sciences-6e-living-world-${m}-1`)));
  });

  it.each(['living-groups', 'food-growth', 'planet-earth', 'life-enquiry'])('%s : la botaniste, la scène neutre, les réponses dans la colonne, sous la phrase', async (mission) => {
    const user = userEvent.setup();
    vi.mocked(world.question).mockClear();
    renderPlace('mangrove', mission);
    expect(await screen.findByText('La botaniste')).toBeInTheDocument();
    const go = screen.queryByRole('button', { name: /Commencer/ });
    if (go) await user.click(go);
    await vi.waitFor(() => expect(answers().length).toBeGreaterThanOrEqual(2));
    await vi.waitFor(() => expect(world.question).toHaveBeenCalled());
    const last = vi.mocked(world.question).mock.calls.at(-1)![0]!;
    expect(last).toMatchObject({ place: 'mangrove', mission, item: { scene: { kind: 'column' }, answered: false } });
    expect(last.layout.slots).toEqual([]);
    expect(panel().classList.contains('mode-c')).toBe(true);
    expect(follows(panel().querySelector('.question-head')!, panel().querySelector('.world-answers')!)).toBe(true);
  });
});

describe('Les Ruines, leurs quatre missions en C (GD-20, point 8, lot L8b)', () => {
  const answers = () => [...document.querySelectorAll<HTMLButtonElement>('.world-answers .world-answer')];
  const panel = () => document.querySelector<HTMLElement>('.quiz.in-world')!;
  const follows = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1024);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(768);
  });
  beforeAll(async () => {
    await Promise.all(['early-humans', 'ancient-peoples', 'roman-empire', 'viewpoints'].map((m) => loadExercise(`history-6e-antiquity-${m}-1`)));
  });

  it.each(['early-humans', 'ancient-peoples', 'roman-empire', 'viewpoints'])('%s : l’archéologue, la scène neutre, les réponses dans la colonne, sous la phrase', async (mission) => {
    const user = userEvent.setup();
    vi.mocked(world.question).mockClear();
    renderPlace('ruins', mission);
    expect(await screen.findByText('L’archéologue')).toBeInTheDocument();
    const go = screen.queryByRole('button', { name: /Commencer/ });
    if (go) await user.click(go);
    await vi.waitFor(() => expect(answers().length).toBeGreaterThanOrEqual(2));
    await vi.waitFor(() => expect(world.question).toHaveBeenCalled());
    const last = vi.mocked(world.question).mock.calls.at(-1)![0]!;
    expect(last).toMatchObject({ place: 'ruins', mission, item: { scene: { kind: 'column' }, answered: false } });
    expect(last.layout.slots).toEqual([]);
    expect(panel().classList.contains('mode-c')).toBe(true);
    expect(follows(panel().querySelector('.question-head')!, panel().querySelector('.world-answers')!)).toBe(true);
  });
});

describe('Le Chantier naval, ses quatre missions en C (GD-20, point 8, lot L6b)', () => {
  const missions = ['object-function', 'materials', 'information-networks', 'solve-program'];
  const answers = () => [...document.querySelectorAll<HTMLButtonElement>('.world-answers .world-answer')];
  const panel = () => document.querySelector<HTMLElement>('.quiz.in-world')!;
  const follows = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  const last = () => vi.mocked(world.question).mock.calls.at(-1)![0]!;
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1024);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(768);
  });

  it.each(missions)('%s : le charpentier, la scène neutre, les réponses dans la colonne, sous la phrase, en scène comme en « Vue simple »', async (mission) => {
    const user = userEvent.setup();
    vi.mocked(world.question).mockClear();
    renderPlace('shipyard', mission);
    expect(await screen.findByText('Le charpentier')).toBeInTheDocument();
    const go = screen.queryByRole('button', { name: /Commencer/ });
    if (go) await user.click(go);
    await vi.waitFor(() => expect(answers().length).toBeGreaterThanOrEqual(2));
    await vi.waitFor(() => expect(world.question).toHaveBeenCalled());
    expect(last()).toMatchObject({ place: 'shipyard', mission, item: { scene: { kind: 'column' }, answered: false } });
    expect(last().layout.slots).toEqual([]);
    expect(panel().classList.contains('mode-c')).toBe(true);
    expect(follows(panel().querySelector('.question-head')!, panel().querySelector('.world-answers')!)).toBe(true);
    await user.click(screen.getByRole('button', { name: /Vue simple/ }));
    expect(panel().classList.contains('simple')).toBe(true);
    expect(follows(panel().querySelector('.question-head')!, panel().querySelector('.world-answers')!)).toBe(true);
  });

  it('l’ordre des réponses d’un item ne bouge pas dans la partie : ni en passant à « Vue simple », ni après un essai faux (relecture dys de L6b)', async () => {
    const user = userEvent.setup();
    renderPlace('shipyard', 'materials');
    const go = await screen.findByRole('button', { name: /Commencer/ }).catch(() => null);
    if (go) await user.click(go);
    await vi.waitFor(() => expect(answers().length).toBeGreaterThanOrEqual(3));
    const labels = () => answers().map((a) => a.textContent?.trim());
    const first = labels();
    await user.click(screen.getByRole('button', { name: /Vue simple/ }));
    expect(labels()).toEqual(first);
    await user.click(answers()[0]);
    if (!document.querySelector('.next-button')) expect(labels()).toEqual(first);
    await user.click(screen.getByRole('button', { name: /Scène/ }));
    expect(labels()).toEqual(first);
  });

  it('en texte normal sur un téléphone couché, une phrase sous le pli ouvre « Vue simple » d’office', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(844);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(390);
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const bottom = this.matches('.question-head') ? 900 : 390;
      return { top: 0, bottom, height: bottom, left: 0, right: 844, width: 844, x: 0, y: 0, toJSON: () => ({}) };
    });
    const user = userEvent.setup();
    renderPlace('shipyard', 'information-networks');
    const go = await screen.findByRole('button', { name: /Commencer/ }).catch(() => null);
    if (go) await user.click(go);
    await vi.waitFor(() => expect(panel().classList.contains('simple')).toBe(true));
  });
});

describe('La Turbine au plus grand texte, en « Vue simple » sur un écran bas (relecture de L6a)', () => {
  it('le rôle de l’habitant quitte la ligne repliée de la consigne : la place va à la phrase et aux réponses', async () => {
    localStorage.setItem('dysapps:settings', JSON.stringify({ fontSize: 32, univers: 'archipeo' }));
    const user = userEvent.setup();
    renderPlace('engine', 'energy-circuits');
    const go = await screen.findByRole('button', { name: /Commencer/ }).catch(() => null);
    if (go) await user.click(go);
    const simple = screen.queryByRole('button', { name: /Vue simple/ });
    if (simple) await user.click(simple);
    await vi.waitFor(() => expect(document.querySelector('.world-consigne-fold')).not.toBeNull());
    expect(document.querySelector('.world-consigne-fold')!.textContent).not.toMatch(/machiniste/);
    expect(document.querySelector('.world-consigne-fold .world-scenette-role')).toBeNull();
    localStorage.removeItem('dysapps:settings');
  });
});

describe('La Turbine en texte normal sur un téléphone couché (deuxième passe de L6a)', () => {
  it('en C, une phrase sous le pli ouvre « Vue simple » d’office ; revenu à « Scène », l’élève garde son choix', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(844);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(390);
    // La phrase passe sous le bord du panneau (le reste tient dans l'écran) ; dans la colonne serrée revenue à « Scène »,
    // elle tient (sinon l'item resterait en « Vue simple », L8).
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const tight = this.closest('.quiz.in-world')?.classList.contains('scene-gardee') ?? false;
      const bottom = this.matches('.question-head') && !tight ? 900 : 390;
      return { top: 0, bottom, height: bottom, left: 0, right: 844, width: 844, x: 0, y: 0, toJSON: () => ({}) };
    });
    const user = userEvent.setup();
    renderPlace('engine', 'energy-circuits');
    const go = await screen.findByRole('button', { name: /Commencer/ }).catch(() => null);
    if (go) await user.click(go);
    const panel = () => document.querySelector<HTMLElement>('.quiz.in-world')!;
    await vi.waitFor(() => expect(panel().classList.contains('simple')).toBe(true));
    await user.click(screen.getByRole('button', { name: /Scène/ }));
    await vi.waitFor(() => expect(panel().classList.contains('simple')).toBe(false));
  });

  // Un téléphone couché de 667 × 375 au plus grand texte (GD-20, point 8, L8) : la phrase passe sous le bord tant que la
  // colonne n'a pas sa forme serrée (`scene-gardee`) ; serrée, elle tient (`fits`), ou non. Les réponses, elles, passent
  // toujours sous le bord (la colonne défile) : la colonne d'avant s'élargissait alors jusqu'à la pleine largeur.
  // `wordsWrap` : chaque mot de la consigne repliée passe à la ligne (pas un ne tient à côté des boutons).
  const phone = (fits: () => boolean, wordsWrap = false) => {
    localStorage.setItem('dysapps:settings', JSON.stringify({ fontSize: 32, univers: 'archipeo' }));
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(667);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(375);
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const tight = this.closest('.quiz.in-world')?.classList.contains('scene-gardee') ?? false;
      const [top, bottom] = this.matches('.question-head')
        ? [60, tight && fits() ? 300 : 900]
        : this.matches('.world-answer')
          ? [310, 900]
          : wordsWrap && this.matches('.world-consigne-word, .world-consigne-ellipsis')
            ? [300, 330]
            : wordsWrap && this.matches('.world-consigne-line')
              ? [0, 48]
              : wordsWrap && this.matches('.world-consigne-more')
                ? [54, 102]
                : [0, 375];
      return { top, bottom, height: bottom - top, left: 0, right: 667, width: 667, x: 0, y: top, toJSON: () => ({}) };
    });
  };
  const panel = () => document.querySelector<HTMLElement>('.quiz.in-world')!;
  const toScene = () => screen.queryByRole('button', { name: /^Scène$/ });
  const open = async (user: ReturnType<typeof userEvent.setup>) => {
    renderPlace('engine', 'energy-circuits');
    const go = await screen.findByRole('button', { name: /Commencer/ }).catch(() => null);
    if (go) await user.click(go);
    await vi.waitFor(() => expect(panel().classList.contains('simple')).toBe(true));
  };
  // Une réponse fausse se retente (la règle du C) : jusqu'au résultat.
  // Rend le texte de la dernière réponse touchée.
  const answer = async (user: ReturnType<typeof userEvent.setup>) => {
    let last: string | null = null;
    for (let k = 0; k < 4 && !panel().classList.contains('has-sheet'); k++) {
      const free = [...document.querySelectorAll<HTMLButtonElement>('.world-answers .world-answer')].find((b) => !b.disabled);
      if (!free) break;
      last = free.textContent;
      await user.click(free);
      await vi.waitFor(() => expect(panel().classList.contains('has-sheet') || !free.isConnected || free.disabled).toBe(true));
    }
    await vi.waitFor(() => expect(panel().classList.contains('has-sheet')).toBe(true));
    return last;
  };
  afterEach(() => localStorage.removeItem('dysapps:settings'));

  it('revenu à « Scène », la colonne serrée garde la phrase au-dessus du pli et la scène à droite : jamais une bande au bord (GD-20, point 8, L8)', async () => {
    phone(() => true);
    const user = userEvent.setup();
    vi.mocked(world.question).mockClear();
    await open(user);
    await user.click(toScene()!);
    // La forme serrée de « Vue simple » : la consigne repliée en une ligne, sans le rôle ; ni pleine largeur, ni « Vue
    // simple » proposé dans la colonne.
    await vi.waitFor(() => expect(panel().classList.contains('scene-gardee')).toBe(true));
    expect(panel().classList.contains('simple-bas')).toBe(true);
    expect(panel().classList.contains('simple')).toBe(false);
    expect(panel().classList.contains('full')).toBe(false);
    expect(panel().classList.contains('offer')).toBe(false);
    expect(document.querySelector('.world-consigne-fold')).not.toBeNull();
    expect(document.querySelector('.world-consigne-fold .world-scenette-role')).toBeNull();
    // Le pli mesuré : la phrase entière à 0 px sous le bord du panneau, le repère compté.
    expect(belowFold(panel(), [panel().querySelector('.question-head')!], foldReserve(panel()))).toBe(0);
    // La scène à droite de la colonne, qui garde au plus sa dernière part.
    const { layout } = vi.mocked(world.question).mock.calls.at(-1)![0]!;
    const stage = layout.scenette!.stage;
    expect(layout.panel.left + layout.panel.width).toBeLessThan(0.6 * 667);
    expect(stage.left).toBeGreaterThanOrEqual(layout.panel.left + layout.panel.width);
    expect(stage.right - stage.left).toBeGreaterThan(0.35 * 667);
    // Le choix tient : les réponses sous le bord ne font plus élargir la colonne, ni son résultat.
    await answer(user);
    expect(panel().classList.contains('sheet-wide')).toBe(false);
    expect(panel().classList.contains('full')).toBe(false);
    expect(panel().classList.contains('scene-gardee')).toBe(true);
  });

  it('après une erreur, le résultat montre d’abord la réponse choisie, barrée, jamais la bonne à sa place (directeur artistique, L8)', async () => {
    phone(() => true);
    const user = userEvent.setup();
    vi.mocked(world.question).mockClear();
    await open(user);
    await user.click(toScene()!);
    await vi.waitFor(() => expect(panel().classList.contains('scene-gardee')).toBe(true));
    // L'élève se trompe à chaque essai : la bonne réponse, lue dans l'exercice par la clé de l'item que reçoit la scène,
    // jamais touchée.
    const key = String((vi.mocked(world.question).mock.calls.at(-1)![0]!.item as { key?: string } | undefined)?.key);
    const exercise = await loadExercise('physics-chemistry-6e-matter-energy-energy-circuits-1');
    const items = (exercise as unknown as { items: { key: string; answer?: string }[] }).items;
    const right = items.find((it) => key === it.key || key.startsWith(`${it.key}#`))?.answer;
    expect(right, key).toBeTruthy();
    let last: string | null = null;
    for (let k = 0; k < 4 && !panel().classList.contains('has-sheet'); k++) {
      const free = [...document.querySelectorAll<HTMLButtonElement>('.world-answers .world-answer')].find((b) => !b.disabled && b.textContent !== right);
      if (!free) break;
      last = free.textContent;
      await user.click(free);
      await vi.waitFor(() => expect(panel().classList.contains('has-sheet') || !free.isConnected || free.disabled).toBe(true));
    }
    await vi.waitFor(() => expect(panel().classList.contains('has-sheet')).toBe(true));
    const picked = [...panel().querySelectorAll('.world-answers .world-answer[data-choisie]')];
    expect(picked.map((el) => el.textContent)).toEqual([last]);
    expect(picked[0].classList.contains('wrong')).toBe(true);
    expect(panel().querySelector('.world-answers .world-answer.right')?.textContent).toBe(right);
  });

  it('le pli se mesure une fois par item, avant la réponse : le résultat ne ramène jamais l’item en « Vue simple » (avis code de L8)', async () => {
    let fits = true;
    phone(() => fits);
    const user = userEvent.setup();
    await open(user);
    await user.click(toScene()!);
    await vi.waitFor(() => expect(panel().classList.contains('scene-gardee')).toBe(true));
    // Après la réponse, la phrase complétée passerait sous le pli : l'item reste sur la scène, le résultat dans la colonne.
    fits = false;
    await answer(user);
    expect(panel().classList.contains('scene-gardee')).toBe(true);
    expect(panel().classList.contains('simple')).toBe(false);
  });

  it('chaque voix touche son texte, et garde son nom quand son mot est masqué ; la ligne repliée garde son premier mot (L8)', async () => {
    vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] });
    vi.stubGlobal('SpeechSynthesisUtterance', class {});
    phone(() => true, true);
    const user = userEvent.setup();
    await open(user);
    await user.click(toScene()!);
    await vi.waitFor(() => expect(panel().classList.contains('scene-gardee')).toBe(true));
    // La voix de la phrase dans la phrase (`.question-head`), son nom dit ; « Lire la suite », icône seule, nommée.
    expect(within(panel().querySelector<HTMLElement>('.question-head')!).getByRole('button', { name: /^(Lire la phrase|Question) : / })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lire la suite de la consigne' })).toBeInTheDocument();
    // Pas un mot ne tient sur la ligne : le premier reste, jamais « … » seul.
    const fold = panel().querySelector<HTMLElement>('.world-consigne-fold')!;
    await vi.waitFor(() => expect(fold.classList.contains('premier-mot')).toBe(true));
    const words = [...fold.querySelectorAll<HTMLElement>('.world-consigne-word')];
    expect(words[0].hidden).toBe(false);
    expect(words.slice(1).every((w) => w.hidden)).toBe(true);
    // « Lire la suite », passé à la rangée d'après, ne s'épingle pas : il ne couvre jamais le premier mot.
    expect(panel().dataset.livre).toBe('dessous');
    vi.unstubAllGlobals();
  });

  it('une phrase qui passe encore sous le pli dans la colonne serrée garde l’item en « Vue simple », sans « Scène » ; l’item suivant revient à la scène', async () => {
    let fits = false;
    phone(() => fits);
    const user = userEvent.setup();
    await open(user);
    await user.click(toScene()!);
    await vi.waitFor(() => expect(panel().classList.contains('simple')).toBe(true));
    expect(toScene()).toBeNull();
    // « Scène » parti de la barre, le focus passe à « Lire la suite », jamais au corps de la page.
    await vi.waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Lire la suite de la consigne' })));
    // L'item suivant, dont la phrase tient : la scène revient d'elle-même, le choix de l'élève gardé.
    fits = true;
    await answer(user);
    await user.click(screen.getByRole('button', { name: /Suivant/ }));
    await vi.waitFor(() => expect(panel().classList.contains('scene-gardee')).toBe(true));
    expect(panel().classList.contains('simple')).toBe(false);
  });
});

describe('L’Observatoire, ses trois missions en C (GD-20, point 8, lot L8c)', () => {
  const answers = () => [...document.querySelectorAll<HTMLButtonElement>('.world-answers .world-answer')];
  const panel = () => document.querySelector<HTMLElement>('.quiz.in-world')!;
  const follows = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1024);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(768);
  });
  beforeAll(async () => {
    await Promise.all(['metropolises', 'low-density', 'inhabited-world'].map((m) => loadExercise(`geography-6e-living-${m}-1`)));
  });

  it.each(['metropolises', 'low-density', 'inhabited-world'])('%s : la scène neutre, les réponses dans la colonne, le rappel dessous', async (mission) => {
    const user = userEvent.setup();
    vi.mocked(world.question).mockClear();
    renderPlace('observatory', mission);
    expect(await screen.findByText('La photographe')).toBeInTheDocument();
    const go = screen.queryByRole('button', { name: /Commencer/ });
    if (go) await user.click(go);
    await vi.waitFor(() => expect(answers().length).toBeGreaterThanOrEqual(2));
    await vi.waitFor(() => expect(world.question).toHaveBeenCalled());
    expect(vi.mocked(world.question).mock.calls.at(-1)![0]).toMatchObject({ place: 'observatory', mission, item: { scene: { kind: 'column' }, answered: false } });
    expect(panel().classList.contains('mode-c')).toBe(true);
    const head = panel().querySelector('.question-head')!;
    const list = panel().querySelector('.world-answers')!;
    expect(follows(head, list)).toBe(true);
    // Le rappel de l'item, dans la colonne, après les réponses.
    const aid = panel().querySelector('.world-question-aid');
    expect(aid).not.toBeNull();
    expect(follows(list, aid!)).toBe(true);
  });
});

describe('La Halle, ses trois missions en C (GD-20, point 8, lot L8d)', () => {
  const answers = () => [...document.querySelectorAll<HTMLButtonElement>('.world-answers .world-answer')];
  const panel = () => document.querySelector<HTMLElement>('.quiz.in-world')!;
  const follows = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1024);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(768);
  });
  beforeAll(async () => {
    await Promise.all(['representatives', 'school-secularism', 'private-life'].map((m) => loadExercise(`civics-6e-democratic-society-${m}-1`)));
  });

  it.each(['representatives', 'school-secularism', 'private-life'])('%s : la scène neutre, les réponses dans la colonne, le rappel dessous', async (mission) => {
    const user = userEvent.setup();
    vi.mocked(world.question).mockClear();
    renderPlace('commons', mission);
    expect(await screen.findByText('Le couvreur')).toBeInTheDocument();
    const go = screen.queryByRole('button', { name: /Commencer/ });
    if (go) await user.click(go);
    await vi.waitFor(() => expect(answers().length).toBeGreaterThanOrEqual(2));
    await vi.waitFor(() => expect(world.question).toHaveBeenCalled());
    expect(vi.mocked(world.question).mock.calls.at(-1)![0]).toMatchObject({ place: 'commons', mission, item: { scene: { kind: 'column' }, answered: false } });
    expect(panel().classList.contains('mode-c')).toBe(true);
    const head = panel().querySelector('.question-head')!;
    const list = panel().querySelector('.world-answers')!;
    expect(follows(head, list)).toBe(true);
    const aid = panel().querySelector('.world-question-aid');
    expect(aid).not.toBeNull();
    expect(follows(list, aid!)).toBe(true);
  });
});

describe('La phrase d’un C sur un écran bas, en « Vue simple » (relecture UX UI de L8)', () => {

  it('prend la largeur du panneau à toute taille de texte : jamais une ligne coupée à droite', () => {
    // jsdom ne met rien en page : la règle se lit dans la feuille de style (la phrase, en `display: contents`, prenait
    // sinon sa largeur naturelle dans la rangée).
    const css = readFileSync(join(process.cwd(), 'src/game/three/archipeo/openWorld.css'), 'utf8');
    const rule = /(^|\n)\.world-question \.in-world\.simple-bas\.mode-c \.world-question-prompt > \* \{([^}]*)\}/.exec(css);
    expect(rule?.[2]).toMatch(/flex: 0 0 100%;/);
    expect(rule?.[2]).toMatch(/min-width: 0;/);
  });
});

describe('Le rivage nord, les écrans de référence redits (GD-20, point 8, lot L7)', () => {
  const answers = () => [...document.querySelectorAll<HTMLButtonElement>('.world-answers .world-answer')];
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1024);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(768);
  });
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });
  // La voix du navigateur, simulée : chaque phrase dite garde son texte.
  class FakeUtterance {
    lang = '';
    rate = 1;
    voice = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(public text: string) {}
  }
  const start = async () => {
    const user = userEvent.setup();
    const go = screen.queryByRole('button', { name: /Commencer/ });
    if (go) await user.click(go);
    await vi.waitFor(() => expect(answers().length).toBeGreaterThanOrEqual(2));
  };

  it('Familles-craft aux Archives : le sens, la racine trouée, les affixes écrits avec leur trait d’union', async () => {
    const first = renderPlace('archives', 'word-families');
    expect(await screen.findByText('La copiste')).toBeInTheDocument();
    // La phrase de la copiste, à la première rencontre seulement depuis le lancement (relecture de L7) : gardée au niveau
    // du module, elle ne se voit qu'au premier rendu des Archives de ce fichier ; ce test doit rester le premier à les
    // ouvrir.
    await vi.waitFor(() => expect(document.querySelector('.world-scenette-greeting')?.textContent).toContain('La copiste copie les textes à la main.'));
    first.unmount();
    renderPlace('archives', 'word-families');
    expect(await screen.findByText('La copiste')).toBeInTheDocument();
    expect(document.querySelector('.world-scenette-greeting')).toBeNull();
    await start();
    expect(document.querySelector('.world-gap-word')?.textContent).toMatch(/^…|…$/);
    for (const a of answers()) expect(a.textContent?.trim()).toMatch(/^-|-$/);
  });

  it('Oreille du mineur à l’Imprimerie : la phrase dite une fois à l’ouverture, si la lecture automatique est choisie ; « Réécouter »', async () => {
    const speak = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn(), getVoices: () => [], speaking: false });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    localStorage.setItem('dysapps:settings', JSON.stringify({ autoRead: true }));
    renderPlace('printworks', 'sound-discrimination');
    expect(await screen.findByText('L’imprimeur')).toBeInTheDocument();
    await start();
    expect(screen.getByRole('button', { name: /Réécouter/ })).toBeInTheDocument();
    await vi.waitFor(() => expect(speak).toHaveBeenCalled());
    const spoken = speak.mock.calls.map((c) => (c[0] as { text?: string }).text ?? '');
    // La phrase n'est jamais écrite dans le panneau.
    const panel = document.querySelector('.quiz.in-world')!.textContent ?? '';
    for (const t of spoken.filter((x) => x.split(' ').length > 3)) expect(panel).not.toContain(t);
  });

  it('sans lecture automatique, rien n’est dit à l’ouverture, et le bouton s’appelle « Écouter »', async () => {
    const speak = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn(), getVoices: () => [], speaking: false });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    localStorage.setItem('dysapps:settings', JSON.stringify({ autoRead: false }));
    renderPlace('printworks', 'sound-discrimination');
    await start();
    expect(screen.queryByRole('button', { name: /Réécouter/ })).toBeNull();
    expect(screen.getAllByRole('button', { name: /^Écouter :/ }).length).toBeGreaterThan(0);
    expect(speak).not.toHaveBeenCalled();
  });
});

describe('Le large (GD-20, point 8, lot L9)', () => {
  const answers = () => [...document.querySelectorAll<HTMLButtonElement>('.world-answers .world-answer')];
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1024);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(768);
  });
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });
  beforeAll(async () => {
    await Promise.all(['english-6e-vocabulary-first-listening-1', 'english-6e-grammar-story-1', 'english-6e-grammar-have-got-1'].map((id) => loadExercise(id)));
  });
  class FakeUtterance {
    lang = '';
    rate = 1;
    voice = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(public text: string) {}
  }
  const start = async () => {
    const user = userEvent.setup();
    const go = screen.queryByRole('button', { name: /Commencer/ });
    if (go) await user.click(go);
    await vi.waitFor(() => expect(answers().length).toBeGreaterThanOrEqual(2));
  };

  /** Le texte de la page, sans les noms des boutons (le mot dit n'y est pas écrit). */
  const pageText = () => document.body.textContent ?? '';

  it('Ears aux Balises : la phrase de l’item ne répète pas la consigne ; le mot dit en anglais à l’ouverture, jamais écrit avant la réponse', async () => {
    const speak = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn(), getVoices: () => [], speaking: false });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    localStorage.setItem('dysapps:settings', JSON.stringify({ autoRead: true }));
    vi.mocked(world.question).mockClear();
    renderPlace('beacons', 'first-listening');
    expect(await screen.findByText('Le pilote du chenal')).toBeInTheDocument();
    await start();
    // Le bouton, son nom écrit à côté du haut-parleur.
    expect(screen.getByRole('button', { name: /^Réécouter :/ }).textContent).toContain('Réécouter');
    await vi.waitFor(() => expect(speak).toHaveBeenCalled());
    const said = speak.mock.calls.map((c) => c[0] as FakeUtterance).filter((u) => u.lang.startsWith('en'));
    expect(said.length).toBeGreaterThan(0);
    const word = said[0].text;
    expect(new RegExp(`\\b${word}\\b`).test(pageText())).toBe(false);
    // La consigne, écrite une fois.
    expect(pageText().split('puis choisis ce qu’il veut dire').length - 1).toBeLessThanOrEqual(1);
    // Les réponses en français, la langue de la page : aucune ne porte de langue.
    expect(answers().length).toBeGreaterThanOrEqual(2);
    expect(document.querySelectorAll('.world-answer-label[lang]')).toHaveLength(0);
    await vi.waitFor(() => expect(world.question).toHaveBeenCalled());
    expect(vi.mocked(world.question).mock.calls.at(-1)![0]).toMatchObject({ place: 'beacons', item: { scene: { kind: 'restMark' }, answered: false } });
  });

  it('Ears, lecture automatique coupée : rien n’est dit à l’ouverture ; « Écouter le mot » dit le mot en anglais', async () => {
    const user = userEvent.setup();
    const speak = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn(), getVoices: () => [], speaking: false });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    localStorage.setItem('dysapps:settings', JSON.stringify({ autoRead: false }));
    renderPlace('beacons', 'first-listening');
    await start();
    expect(speak).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /^Écouter le mot :/ }));
    expect(speak).toHaveBeenCalledTimes(1);
    expect((speak.mock.calls[0][0] as FakeUtterance).lang).toMatch(/^en/);
  });

  it('Ears sans synthèse vocale : le mot anglais est écrit, en anglais, dès l’ouverture', async () => {
    renderPlace('beacons', 'first-listening');
    await start();
    const written = document.querySelector('.world-listen .item-word');
    expect(written?.getAttribute('lang')).toBe('en');
    expect(written?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('Story time à la Gare maritime : l’histoire n’est pas écrite avant la réponse ; « Écouter », visible ; le C et sa malle', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [], speaking: false });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    vi.mocked(world.question).mockClear();
    renderPlace('ferry', 'story');
    expect(await screen.findByText('Le chef de gare')).toBeInTheDocument();
    await start();
    await vi.waitFor(() => expect(world.question).toHaveBeenCalled());
    expect(vi.mocked(world.question).mock.calls.at(-1)![0]).toMatchObject({ place: 'ferry', mission: 'story', item: { scene: { kind: 'column' }, answered: false } });
    expect(document.querySelector('.quiz.in-world')!.classList.contains('mode-c')).toBe(true);
    // Avant la réponse : aucune ligne de l'histoire, l'invitation à écouter et son bouton nommé.
    expect(document.querySelector('.world-document .notice-line')).toBeNull();
    expect(pageText()).toContain('Écoute l’histoire en anglais.');
    expect(within(document.querySelector<HTMLElement>('.world-document.recit')!).getByRole('button', { name: /^Écouter :/ }).textContent).toContain('Écouter');
    // Après la réponse (juste, ou la seconde fausse), l'histoire s'écrit, pour se corriger en la relisant ; un premier essai
    // faux la laisse à écouter.
    for (let k = 0; k < 3 && !document.querySelector('.world-document .notice-line'); k++) {
      const a = answers().find((b) => !b.disabled);
      if (a) await user.click(a);
      await vi.waitFor(() => expect(answers().some((b) => !b.disabled) || document.querySelector('.world-document .notice-line')).toBeTruthy());
    }
    await vi.waitFor(() => expect(document.querySelector('.world-document .notice-line')).not.toBeNull());
    expect(document.querySelector('.world-document ul')?.getAttribute('lang')).toBe('en');
  });

  it('Story time sans synthèse vocale : l’histoire est écrite dès l’ouverture', async () => {
    renderPlace('ferry', 'story');
    await start();
    expect(document.querySelector('.world-document .notice-line')).not.toBeNull();
  });
});
