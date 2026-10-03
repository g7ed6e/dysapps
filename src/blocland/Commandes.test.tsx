// La section « Commandes » (GD-7, PR 3) dans le panneau d'île et la page de l'île, et l'arrivée des commandes dans le
// contexte du jeu : Blocland seulement, Archipéo inchangé.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { BLOC, getBiome, missionsJouables, type BiomeId } from './biomes';
import { BloclandProvider, useBlocland } from './BloclandContext';
import { exercisesOf } from './exercises';
import { IslandSheet } from './IslandSheet';
import { MenuSheet } from './MenuSheet';
import { getCommande } from './world/commandes';
import { casesDeLaPetiteConstruction } from './world/petitesConstructions';

const FORET = 'french-6e-phonology';
const PLAINE = 'maths-6e-calculation';
const PONT_FERME = 'french-6e-phonology-french-6e-grammar-spelling';
const MOUSSO = 'french-6e-phonology-request-1';
const COCO = 'maths-6e-calculation-request-1';

const joue = (...iles: BiomeId[]) =>
  Object.fromEntries(iles.flatMap((ile) => missionsJouables(getBiome(ile)!).map((m) => [exercisesOf(ile, m.id)[0].id, { stars: 2, attempts: 1, best: 0.8 }])));

function sauver(game: Record<string, unknown>, univers: 'blocland' | 'archipeo' = 'blocland') {
  localStorage.clear();
  localStorage.setItem('dysapps:settings', JSON.stringify({ univers, autoRead: false, sounds: false }));
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, ...game }));
}

function Etat() {
  const { state, buildBridge } = useBlocland();
  return (
    <>
      <p data-testid="etat">
        commandes {(state.world.requests ?? []).join(',') || 'aucune'} · terre {state.stock[BLOC.terre] ?? 0} · posée{' '}
        {state.world.parts['french-6e-phonology-fixture-1']?.length ?? 0}
      </p>
      <button type="button" onClick={() => buildBridge(PONT_FERME)}>
        Construire le pont
      </button>
    </>
  );
}

function ouvrir(ile?: BiomeId, highlight?: string) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            {ile ? <IslandSheet biome={getBiome(ile)!} onClose={() => {}} highlight={highlight} /> : <MenuSheet onClose={() => {}} />}
            <Etat />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

const pret = { progress: joue(FORET, PLAINE), stock: { [BLOC.terre]: 4 }, world: { parts: {}, log: [], links: [PONT_FERME], place: FORET, requests: [MOUSSO, COCO] } };

it('dans le panneau de l’île de la créature : « Livrer » pose la petite construction et dit la phrase', async () => {
  sauver(pret);
  ouvrir(FORET);
  const liste = screen.getByRole('list', { name: 'Les commandes des créatures' });
  const lignes = within(liste).getAllByRole('listitem');
  // La plus ancienne en tête ; la phrase de la première fois, tant que rien n'est livré.
  expect(lignes.map((l) => l.getAttribute('data-commande'))).toEqual([MOUSSO, COCO]);
  expect(document.body.textContent).toContain('Une commande, c’est une créature qui te demande des blocs pour une petite construction. Rien ne presse.');
  // Mousso : prête, sur son île : « Livrer ». Coco : pas prête : la phrase dit quoi faire, et « Y aller » vers la Forêt.
  expect(lignes[0].textContent).toContain('3 blocs de terre');
  expect(lignes[0].textContent).toContain('Tu as les blocs de terre ! Livre-les à Mousso.');
  expect(within(lignes[1]).getByRole('link', { name: /Y aller/ })).toHaveAttribute('href', `/adventure/${FORET}`);
  expect(within(lignes[1]).queryByRole('button', { name: /Livrer/ })).toBeNull();
  await userEvent.click(within(lignes[0]).getByRole('button', { name: /Livrer/ }));
  expect(document.body.textContent).toContain('Carré de semis posé chez Mousso !');
  const cases = casesDeLaPetiteConstruction(getCommande(MOUSSO)!.fixture)!.length;
  expect(screen.getByTestId('etat').textContent).toBe(`commandes ${COCO} · terre 1 · posée ${cases}`);
});

it('ailleurs, une commande prête mène chez sa créature, sur sa ligne ; jamais de « Livrer » grisé', () => {
  sauver(pret);
  ouvrir(PLAINE);
  const ligne = document.querySelector(`[data-commande="${MOUSSO}"]`) as HTMLElement;
  expect(within(ligne).getByRole('link', { name: /Y aller/ })).toHaveAttribute('href', `/adventure/${FORET}?worksite=${MOUSSO}`);
  expect(screen.queryByRole('button', { name: /Livrer/ })).toBeNull();
});

it('le menu montre la même section, avec « Y aller » seulement', () => {
  sauver(pret);
  ouvrir();
  const menu = screen.getByRole('dialog', { name: 'Menu' });
  expect(within(menu).getByRole('heading', { name: /Commandes/ })).toBeInTheDocument();
  expect(within(menu).queryByRole('button', { name: /Livrer/ })).toBeNull();
  expect(within(menu).getAllByRole('link', { name: /Y aller/ })).toHaveLength(2);
});

it('un ouvrage construit fait arriver une commande dans Blocland', async () => {
  sauver({ progress: joue(FORET, PLAINE), stock: { [BLOC.bois]: 9 }, world: { parts: {}, log: [], links: [], place: FORET } });
  ouvrir(FORET);
  expect(screen.getByTestId('etat').textContent).toContain('commandes aucune');
  expect(screen.queryByRole('heading', { name: /Commandes/ })).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Construire le pont' }));
  expect(screen.getByTestId('etat').textContent).toContain(`commandes ${MOUSSO}`);
  expect(screen.getByRole('heading', { name: /Commandes/ })).toBeInTheDocument();
});

it('Archipéo, en pause : aucune commande n’arrive ni ne s’affiche', async () => {
  sauver({ progress: joue(FORET, PLAINE), stock: { [BLOC.bois]: 9 }, world: { parts: {}, log: [], links: [], place: FORET, requests: [COCO] } }, 'archipeo');
  ouvrir(FORET);
  expect(screen.queryByRole('heading', { name: /Commandes/ })).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Construire le pont' }));
  // La sauvegarde garde ce qu'elle avait, rien n'arrive en plus.
  expect(screen.getByTestId('etat').textContent).toContain(`commandes ${COCO} ·`);
  expect(screen.queryByRole('heading', { name: /Commandes/ })).toBeNull();
});
