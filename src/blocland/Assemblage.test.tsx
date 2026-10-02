import { readFileSync } from 'node:fs';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { BloclandProvider } from './BloclandContext';
import { AssemblagePage } from './Assemblage';
import { AssemblageQuestionPage } from './AssemblageQuestion';
import { BRIDGES, VOYAGES } from './world/archipelago';
import { prochaineQuestion, tirageNeuf, type TirageAssemblage } from './world/assemblage';
import type { AssemblageDef } from './exercises/types';

function renderIn(node: React.ReactNode, at = '/aventure/assemblage') {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={[at]}>{node}</MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

/** Le lieu et la question d'un bloc, comme dans l'application. */
function renderFabrique(at = '/aventure/assemblage') {
  return renderIn(
    <Routes>
      <Route path="/aventure/assemblage" element={<AssemblagePage />} />
      <Route path="/aventure/assemblage/:bloc" element={<AssemblageQuestionPage />} />
    </Routes>,
    at,
  );
}

const POUTRE = JSON.parse(readFileSync('src/blocland/exercises/data/assemblage-poutre.json', 'utf8')) as AssemblageDef;
const CLES = POUTRE.items.map((it) => it.key);
const sauvegarde = () => JSON.parse(localStorage.getItem('dysapps:game')!);

/** Une partie avec ces blocs et un tirage connu : la question que l'élève verra, et ses choix juste et faux. */
function partie(inventory: Record<string, number>, tirage: TirageAssemblage = tirageNeuf('test')) {
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: inventory, assemblyDraw: { poutre: tirage } }));
  const item = POUTRE.items.find((it) => it.key === prochaineQuestion(CLES, tirage))!;
  const faux = (item.choices as string[]).filter((c) => c !== item.answer);
  return { item, juste: String(item.answer), faux };
}

/** Le texte de la page, les espaces insécables de la typographie française rendues ordinaires. */
const page = () => (document.body.textContent ?? '').replace(/[\u00a0\u202f]/g, ' ');
const sans = (t: unknown) => String(t).replace(/[\u00a0\u202f]/g, ' ');

/** Le bouton d'un choix (son texte entier). */
const choix = (texte: string) => within(screen.getByRole('group', { name: 'Réponses possibles' })).getByRole('button', { name: texte });

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

it('la Fabrique montre la recette de l’archipel, ce qu’il manque et le monument qui attend le bloc', () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { bois: 1 } }));
  renderIn(<AssemblagePage />);
  expect(screen.getByRole('heading', { level: 1, name: /La Fabrique/ })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 3, name: /Poutre/ })).toBeInTheDocument();
  expect(screen.getByRole('list', { name: 'Pour 1 poutre, il faut' }).textContent).toMatch(/2 blocs de bois.*1 brique/);
  expect(document.body.textContent).toContain('Il te manque 1 bloc de bois');
  expect(screen.getByRole('link', { name: 'L’observatoire des baleines' })).toHaveAttribute('href', '/aventure/monument-observatoire');
  // Chaque monument dit combien il en attend (rien à retenir).
  expect(document.body.textContent).toMatch(/L’observatoire des baleines attend \d+ poutres/);
  expect(screen.getByRole('button', { name: /Assembler 1 poutre/ })).toHaveAttribute('aria-disabled', 'true');
  // Seul l'archipel atteint : pas de recette des Îles du Ciel en 6e.
  expect(screen.queryByRole('heading', { level: 3, name: /Miroir/ })).toBeNull();
});

it('« Assembler » ouvre la question du tirage ; juste du premier coup, le bloc est assemblé', async () => {
  const user = userEvent.setup();
  // Une voix, et la lecture automatique : la consigne et la question sont lues en ouvrant.
  const dit: string[] = [];
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      constructor(public text: string) {}
    },
  );
  vi.stubGlobal('speechSynthesis', { cancel: () => {}, getVoices: () => [], speak: (u: { text: string }) => dit.push(u.text) });
  localStorage.setItem('dysapps:settings', JSON.stringify({ autoRead: true }));
  const { item, juste } = partie({ bois: 4, brique: 1 });
  renderFabrique();
  await user.click(screen.getByRole('button', { name: /Assembler 1 poutre/ }));
  // L'écran d'une mission : la consigne, le document et sa question, trois choix, Écouter, le rappel, l'indice.
  // Les questions se chargent à la demande : on attend les réponses.
  expect(await screen.findByRole('group', { name: 'Réponses possibles' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1, name: /Assembler 1 poutre/ })).toBeInTheDocument();
  expect(sans(screen.getByRole('heading', { level: 2 }).textContent)).toBe(sans(POUTRE.instruction));
  expect(page()).toContain(sans(item.question));
  expect(within(screen.getByRole('group', { name: 'Réponses possibles' })).getAllByRole('button')).toHaveLength(3);
  expect(screen.getAllByRole('button', { name: /Écouter/ }).length).toBeGreaterThanOrEqual(1);
  await waitFor(() => expect(dit.some((t) => sans(t).includes(sans(item.question)))).toBe(true));
  expect(page()).toContain(sans((item.aid as { props: { title: string } }).props.title));
  expect(screen.getByRole('button', { name: /Un indice/ })).toBeInTheDocument();
  // Rien n'est pris tant que la question n'a pas sa réponse.
  expect(sauvegarde().stock).toMatchObject({ bois: 4, brique: 1 });
  await user.click(choix(juste));
  expect(screen.getByText('Tu as assemblé 1 poutre. Tu en as 1.')).toBeInTheDocument();
  // Un seul bouton Écouter dans le résultat, et le focus sur le bouton principal.
  expect(within(screen.getByRole('region', { name: 'Résultat' })).getAllByRole('button', { name: /Écouter/ })).toHaveLength(1);
  expect(screen.getByRole('link', { name: /Revenir à la Fabrique/ })).toHaveFocus();
  expect(sauvegarde().stock).toMatchObject({ bois: 2, brique: 0, poutre: 1 });
  expect(sauvegarde().assemblyDraw.poutre.recentes).toEqual([item.key]);
  // Ni XP ni étoiles : la question ne compte pas comme une mission.
  expect(sauvegarde().progress).toEqual({});
  // Plus de brique : pas d'autre poutre à proposer ; retour au lieu, qui redit ce qui vient d'être assemblé.
  expect(screen.queryByRole('button', { name: /Assembler 1 autre poutre/ })).toBeNull();
  await user.click(screen.getByRole('link', { name: /Revenir à la Fabrique/ }));
  expect(screen.getByRole('heading', { level: 1, name: /La Fabrique/ })).toBeInTheDocument();
  expect(screen.getByText('Tu as assemblé 1 poutre. Tu en as 1.')).toBeInTheDocument();
  const bouton = screen.getByRole('button', { name: /Assembler 1 poutre/ });
  expect(bouton).toHaveAttribute('aria-disabled', 'true');
});

it('une erreur laisse un second essai, avec l’indice et la réponse barrée ; juste au second, le bloc est assemblé', async () => {
  const user = userEvent.setup();
  const { item, juste, faux } = partie({ bois: 4, brique: 2 });
  renderFabrique('/aventure/assemblage/poutre');
  await user.click(await screen.findByRole('button', { name: faux[0] }));
  expect(screen.getByText('Presque !')).toBeInTheDocument();
  expect(page()).toContain(`Indice : ${sans(item.hint)}`);
  expect(choix(faux[0])).toBeDisabled();
  expect(sauvegarde().stock).toMatchObject({ bois: 4, brique: 2 });
  await user.click(choix(juste));
  expect(screen.getByText('Tu as assemblé 1 poutre. Tu en as 1.')).toBeInTheDocument();
  expect(sauvegarde().stock).toMatchObject({ bois: 2, brique: 1, poutre: 1 });
  // Encore assez de blocs : une autre poutre, une autre question.
  await user.click(screen.getByRole('button', { name: /Assembler 1 autre poutre/ }));
  expect(screen.queryByText('Tu as assemblé 1 poutre. Tu en as 1.')).toBeNull();
  expect(screen.getByRole('group', { name: 'Réponses possibles' })).toBeInTheDocument();
});

it('deux erreurs : rien n’est perdu, l’explication s’affiche, la question reviendra, une autre est proposée', async () => {
  const user = userEvent.setup();
  const { item, faux } = partie({ bois: 2, brique: 1 });
  renderFabrique('/aventure/assemblage/poutre');
  await user.click(await screen.findByRole('button', { name: faux[0] }));
  await user.click(choix(faux[1]));
  expect(screen.getByText('Pas tout à fait')).toBeInTheDocument();
  expect(page()).toContain(sans(item.explanation));
  expect(page()).toContain('Tes blocs sont toujours dans ta poche.');
  expect(sauvegarde().stock).toEqual({ bois: 2, brique: 1 });
  expect(sauvegarde().assemblyDraw.poutre.ratees).toEqual([item.key]);
  expect(screen.getByRole('button', { name: /Une autre question/ })).toHaveFocus();
  // Le second bouton ramène au lieu, comme après une bonne réponse.
  expect(screen.getByRole('link', { name: /Revenir à la Fabrique/ })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Une autre question/ }));
  // Une autre question, jamais la même juste après.
  const suivante = POUTRE.items.find((it) => it.key === prochaineQuestion(CLES, sauvegarde().assemblyDraw.poutre))!;
  expect(suivante.key).not.toBe(item.key);
  expect(page()).toContain(sans(suivante.question));
  expect(screen.queryByText('Pas tout à fait')).toBeNull();
});

it('un double toucher sur la bonne réponse n’assemble qu’un bloc', async () => {
  const user = userEvent.setup();
  const { juste } = partie({ bois: 4, brique: 2 });
  renderFabrique('/aventure/assemblage/poutre');
  await user.dblClick(await screen.findByRole('button', { name: juste }));
  expect(sauvegarde().stock).toMatchObject({ bois: 2, brique: 1, poutre: 1 });
});

it('le résultat s’ouvre sur sa fin s’il tient dans l’écran, sur son début s’il est plus haut', async () => {
  const user = userEvent.setup();
  const defile = vi.fn();
  const hauteur = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
  Element.prototype.scrollIntoView = defile;
  try {
    for (const [haut, block] of [
      [200, 'end'],
      [window.innerHeight + 100, 'start'],
    ] as const) {
      defile.mockClear();
      hauteur.mockReturnValue({ height: haut } as DOMRect);
      const { juste } = partie({ bois: 2, brique: 1 });
      const { unmount } = renderFabrique('/aventure/assemblage/poutre');
      await user.click(await screen.findByRole('button', { name: juste }));
      expect(defile).toHaveBeenCalledWith(expect.objectContaining({ block }));
      // Le focus reste sur le bouton principal, sans défiler jusqu'à lui.
      expect(screen.getByRole('link', { name: /Revenir à la Fabrique/ })).toHaveFocus();
      unmount();
      localStorage.clear();
    }
  } finally {
    hauteur.mockRestore();
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  }
});

it('sans assez de blocs, rien ne change : le bouton est grisé, la ligne de ce qui manque reste, aucune question', async () => {
  const user = userEvent.setup();
  partie({ bois: 3 });
  renderFabrique();
  const bouton = screen.getByRole('button', { name: /Assembler 1 poutre/ });
  expect(bouton).toHaveAttribute('aria-disabled', 'true');
  await user.click(bouton);
  // Grisé, il garde le focus et ne fait rien : rien ne se perd.
  expect(bouton).toHaveFocus();
  expect(screen.getByRole('heading', { level: 1, name: /La Fabrique/ })).toBeInTheDocument();
  expect(document.body.textContent).toContain('Il te manque 1 brique');
  expect(sauvegarde().stock).toEqual({ bois: 3 });
});

it('la question tapée à la main, sans assez de blocs, ramène au lieu', async () => {
  partie({ bois: 1 });
  renderFabrique('/aventure/assemblage/poutre');
  expect(await screen.findByRole('heading', { level: 1, name: /La Fabrique/ })).toBeInTheDocument();
});

it('dans Archipéo, la Halle aux matériaux et le madrier', () => {
  localStorage.setItem('dysapps:settings', JSON.stringify({ univers: 'archipeo' }));
  renderIn(<AssemblagePage />);
  expect(screen.getByRole('heading', { level: 1, name: /La Halle aux matériaux/ })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 3, name: /Madrier/ })).toBeInTheDocument();
  expect(screen.getByRole('list', { name: 'Pour 1 madrier, il faut' })).toBeInTheDocument();
});

it('venue d’un monument, la Fabrique montre d’abord la recette du bloc demandé, les autres sous un pli', () => {
  // En 5e, la poutre (6e) passe devant le vitrail quand on vient d'un monument de 6e.
  const bridges = [...BRIDGES, ...VOYAGES].map((b) => b.id);
  localStorage.setItem('dysapps:game', JSON.stringify({ world: { place: 'marche', links: bridges } }));
  renderIn(<AssemblagePage />, '/aventure/assemblage?bloc=poutre');
  const titres = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
  expect(titres[0]).toMatch(/Poutre/);
  expect(screen.getByText('Les autres archipels')).toBeInTheDocument();
});

it('« Défaire » rend les blocs d’un bloc assemblé en poche', async () => {
  const user = userEvent.setup();
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { poutre: 1 } }));
  renderIn(<AssemblagePage />);
  // Refaire la poutre posera une question : la carte le dit sous le bouton.
  expect(screen.getByText('Pour refaire 1 poutre, tu répondras à une question.')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Défaire 1 poutre/ }));
  expect(screen.getByText('Tu as défait 1 poutre : tu récupères 2 blocs de bois et 1 brique.')).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('dysapps:game')!).stock).toMatchObject({ bois: 2, brique: 1, poutre: 0 });
  // Plus de poutre en poche : le bouton s'en va.
  expect(screen.queryByRole('button', { name: /Défaire 1 poutre/ })).toBeNull();
  // Défaire ne pose aucune question.
  expect(screen.queryByRole('group', { name: 'Réponses possibles' })).toBeNull();
  expect(JSON.parse(localStorage.getItem('dysapps:game')!).assemblyDraw).toBeUndefined();
});

it('les questions d’assemblage comptent dans l’horloge de séance : la pause s’affiche à la troisième', async () => {
  const user = userEvent.setup();
  partie({ bois: 6, brique: 3 });
  renderFabrique();
  await user.click(screen.getByRole('button', { name: /Assembler 1 poutre/ }));
  // La bonne réponse de la question tirée, lue dans le tirage que la sauvegarde garde.
  const repondreJuste = async () => {
    await screen.findByRole('group', { name: 'Réponses possibles' });
    const tirage = sauvegarde().assemblyDraw.poutre as TirageAssemblage;
    const item = POUTRE.items.find((it) => it.key === prochaineQuestion(CLES, tirage))!;
    await user.click(choix(String(item.answer)));
  };
  await repondreJuste();
  expect(screen.queryByText(/Belle séance/)).toBeNull();
  await user.click(screen.getByRole('button', { name: /Assembler 1 autre poutre/ }));
  await repondreJuste();
  expect(screen.queryByText(/Belle séance/)).toBeNull();
  await user.click(screen.getByRole('button', { name: /Assembler 1 autre poutre/ }));
  await repondreJuste();
  // La troisième : la pause remplace les boutons, le bloc est bien assemblé.
  expect(screen.getByText(/Belle séance/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /J’arrête pour aujourd’hui/ })).toHaveFocus();
  expect(screen.queryByRole('link', { name: /Revenir à la Fabrique/ })).toBeNull();
  expect(sauvegarde().stock).toMatchObject({ poutre: 3 });
  // « Encore un peu » : une nouvelle petite séance, les boutons reviennent.
  await user.click(screen.getByRole('button', { name: 'Encore un peu' }));
  expect(screen.queryByText(/Belle séance/)).toBeNull();
  expect(screen.getByRole('link', { name: /Revenir à la Fabrique/ })).toHaveFocus();
});
