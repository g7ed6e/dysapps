// Les fiches du monde (lot 2 de « Toucher le monde ») : ce que chacune dit et propose, avec les actions qui existent
// déjà (Livrer, Reprendre et Plus tard, Poser le bloc suivant, Embarquer). Le parcours (toucher, fermer, une seule à la
// fois) est dans WorldPage.test.tsx.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { BLOC, getBiome, missionsJouables, type BiomeId } from './biomes';
import { BloclandProvider } from './BloclandContext';
import { todayISO } from './engine';
import { CATALOG, exercisesOf } from './exercises';
import { FicheDuMonde, type FicheOuverte } from './FicheDuMonde';
import { oublierLesRemises } from './rappels';
import type { VehicleBuilder } from './useVehicleBuilder';
import { getCommande, type Commande } from './world/commandes';

const FORET: BiomeId = 'french-6e-phonology';
const PLAINE: BiomeId = 'maths-6e-calculation';
const MOUSSO = 'french-6e-phonology-request-1';

const joue = (...iles: BiomeId[]) =>
  Object.fromEntries(iles.flatMap((ile) => missionsJouables(getBiome(ile)!).map((m) => [exercisesOf(ile, m.id)[0].id, { stars: 2, attempts: 1, best: 0.8 }])));

function sauver(game: Record<string, unknown>) {
  localStorage.clear();
  localStorage.setItem('dysapps:settings', JSON.stringify({ univers: 'blocland', autoRead: false, sounds: false }));
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, ...game }));
}

/** Un chantier du navire factice : ce que la fiche lit, et ce qu'on y touche. */
function chantier(partiel: Partial<VehicleBuilder>): VehicleBuilder {
  return {
    stage: null,
    status: null,
    launch: null,
    kit: false,
    canFill: false,
    notice: null,
    burst: { seq: 0, cell: { x: 0, y: 0, z: 0 }, color: '#fff' } as unknown as VehicleBuilder['burst'],
    fillNext: vi.fn(),
    fillAll: vi.fn(),
    tryFill: () => false,
    ...partiel,
  };
}

function ouvrir(fiche: FicheOuverte, extra: { ship?: VehicleBuilder; commande?: Commande; onLivree?: (c: Commande) => boolean; onBoard?: () => void } = {}) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <FicheDuMonde
              fiche={fiche}
              onClose={() => {}}
              ship={extra.ship ?? chantier({})}
              onBoard={extra.onBoard ?? (() => {})}
              onBuilt={() => {}}
              commande={extra.commande}
              onLivree={extra.onLivree}
              onVoirOuvrage={() => {}}
            />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

beforeEach(() => oublierLesRemises());

it('une créature qui a une commande prête : sa phrase et « Livrer », qui pose la petite construction et dit la phrase', async () => {
  sauver({ progress: joue(FORET, PLAINE), stock: { [BLOC.terre]: 4 }, world: { parts: {}, log: [], links: [], place: FORET, requests: [MOUSSO] } });
  const onLivree = vi.fn(() => true);
  ouvrir({ objet: { genre: 'creature', id: FORET }, seq: 1, saut: false, phrase: 'Bonjour !' }, { commande: getCommande(MOUSSO), onLivree });
  const f = screen.getByRole('dialog', { name: 'Mousso' });
  expect(f).toHaveTextContent('Tu as les blocs de terre ! Livre-les à Mousso.');
  expect(f).not.toHaveTextContent('Bonjour !');
  await userEvent.click(within(f).getByRole('button', { name: /Livrer/ }));
  expect(onLivree).toHaveBeenCalledWith(getCommande(MOUSSO));
  expect(f).toHaveTextContent('Potager posé chez Mousso !');
  expect(within(f).queryByRole('button', { name: /Livrer/ })).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('dysapps:game')!).world.requests ?? []).not.toContain(MOUSSO);
});

it('une créature qui a des révisions dues : « Reprendre » et « Plus tard » ; après « Plus tard », sa phrase', async () => {
  const syllabes = CATALOG.find((e) => e.biome === FORET && e.type === 'syllables')!;
  sauver({ spaced: [{ itemId: `${syllabes.id}:cabane`, due: todayISO(), stage: 0, streak: 0 }], progress: { [syllabes.id]: { stars: 1, attempts: 1, best: 0.3 } } });
  ouvrir({ objet: { genre: 'creature', id: FORET }, seq: 1, saut: false, phrase: 'Bonjour !' });
  const f = screen.getByRole('dialog', { name: 'Mousso' });
  expect(within(f).getByRole('link', { name: /Reprendre/ })).toHaveAttribute('href', `/adventure/${FORET}/syllables?revision=1`);
  await userEvent.click(within(f).getByRole('button', { name: 'Plus tard' }));
  expect(within(f).queryByRole('link', { name: /Reprendre/ })).not.toBeInTheDocument();
  expect(f).toHaveTextContent('Bonjour !');
  expect(f).toHaveTextContent('D’accord, plus tard.');
});

it('une créature sans rien à proposer : son nom et sa phrase, sans bouton principal', () => {
  sauver({});
  ouvrir({ objet: { genre: 'creature', id: FORET }, seq: 1, saut: false, phrase: 'Bonjour !' });
  const f = screen.getByRole('dialog', { name: 'Mousso' });
  expect(f).toHaveTextContent('Bonjour !');
  expect(f.querySelector('.world-fiche-actions')).toBeNull();
});

it('le Bloc-Navire : « Poser le bloc suivant » et « Poser tout ce que j’ai » quand on peut poser ; « Embarquer » quand tout est prêt', async () => {
  sauver({});
  const { VEHICLE_STAGES } = await import('./world/vehicle');
  const fillNext = vi.fn();
  const pose = chantier({ stage: VEHICLE_STAGES[0], status: { done: 3, total: 45, complete: false, missing: {} } as unknown as VehicleBuilder['status'], canFill: true, fillNext });
  const { unmount } = ouvrir({ objet: { genre: 'navire', port: PLAINE }, seq: 1, saut: false }, { ship: pose });
  const f = screen.getByRole('dialog', { name: /Le Bloc-Navire : étape 1 sur 3/ });
  await userEvent.click(within(f).getByRole('button', { name: /Poser le bloc suivant/ }));
  expect(fillNext).toHaveBeenCalled();
  expect(within(f).getByRole('button', { name: /Poser tout ce que j’ai/ })).toBeInTheDocument();
  unmount();
  const onBoard = vi.fn();
  const pret = chantier({ stage: VEHICLE_STAGES[0], status: { done: 45, total: 45, complete: true, missing: {} } as unknown as VehicleBuilder['status'], launch: { ok: true } as VehicleBuilder['launch'] });
  ouvrir({ objet: { genre: 'navire', port: PLAINE }, seq: 2, saut: false }, { ship: pret, onBoard });
  const g = screen.getByRole('dialog', { name: /Le Bloc-Navire/ });
  expect(g).toHaveTextContent('Prêt : embarque !');
  await userEvent.click(within(g).getByRole('button', { name: /Embarquer vers les Collines du Large/ }));
  expect(onBoard).toHaveBeenCalledWith('5e', false);
});

it('le Gardien vaincu : « Défier » de nouveau, avec ses étoiles', () => {
  sauver({ progress: { ...joue(FORET), [`${FORET}-challenge`]: { stars: 3, attempts: 1, best: 1 } } });
  ouvrir({ objet: { genre: 'gardien', id: FORET }, seq: 1, saut: false });
  const f = screen.getByRole('dialog', { name: 'Le Grand Chêne' });
  expect(f).toHaveTextContent('Déjà vaincu. Une revanche ?');
  expect(within(f).getByRole('img', { name: 'Gardien vaincu' }).querySelectorAll('.star.lit')).toHaveLength(3);
  expect(within(f).getByRole('link', { name: 'Défier' })).toHaveAttribute('href', `/adventure/${FORET}/challenge`);
});
