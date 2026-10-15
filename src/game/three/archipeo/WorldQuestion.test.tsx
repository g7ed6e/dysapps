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

function renderPlace(place: 'phare' | 'quais' | 'filets' | 'ecluses', mission: string, plain = false) {
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
    const more = screen.getByRole('button', { name: 'Lire la suite de la consigne' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await user.click(more);
    expect(screen.getByRole('button', { name: 'Replier la consigne' })).toHaveAttribute('aria-expanded', 'true');
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
    expect(document.querySelector('.quiz.in-world')!.textContent).toContain('Compare les deux sas');
    expect(document.querySelector('.quiz.in-world .world-question-aid')).toBeNull();
    // Les deux fractions comparées et leur « ? » sur une seule ligne ; « sont-elles » jamais coupé à son trait d'union.
    const together = [...document.querySelectorAll('.question-prompt .world-nobreak')];
    expect(together.some((n) => n.querySelectorAll('.frac').length === 2 && /\?$/.test(n.textContent ?? ''))).toBe(true);
    expect(together.some((n) => n.textContent === 'sont-elles')).toBe(true);
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
