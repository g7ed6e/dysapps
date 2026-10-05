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
import { WorldCard, type FicheOuverte } from './WorldCard';
import { oublierLesRemises } from './reminders';
import type { VehicleBuilder } from './useVehicleBuilder';
import { getCommande, type Commande } from './world/requests';

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
            <WorldCard
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
  // Les boutons de la fiche, sous le texte qui défile : « Reprendre » en principal, « Plus tard » en second.
  const actions = f.querySelector('.world-fiche-actions') as HTMLElement;
  expect(within(actions).getByRole('link', { name: /Reprendre/ })).toHaveClass('primary');
  expect(within(actions).getByRole('button', { name: 'Plus tard' })).not.toHaveClass('primary');
  expect(f.querySelector('.world-fiche-texte .button')).toBeNull();
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
  const f = screen.getByRole('dialog', { name: /Le Bloc-Navire\s:\sétape 1 sur 3/ });
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

it('le Gardien rallumé : « Rejouer », avec ses étoiles (GD-8)', () => {
  sauver({ progress: { ...joue(FORET), [`${FORET}-challenge`]: { stars: 3, attempts: 1, best: 1 } } });
  ouvrir({ objet: { genre: 'gardien', id: FORET }, seq: 1, saut: false });
  const f = screen.getByRole('dialog', { name: 'Le Grand Chêne' });
  expect(f).toHaveTextContent('Déjà rallumé. On rejoue ?');
  expect(within(f).getByRole('img', { name: 'Gardien rallumé' }).querySelectorAll('.star.lit')).toHaveLength(3);
  expect(within(f).getByRole('link', { name: 'Rejouer' })).toHaveAttribute('href', `/adventure/${FORET}/challenge`);
});

it('le Bloc-Navire dont le voyage de ce port est fait : le titre sans étape, la prochaine étape, « Y aller »', async () => {
  sauver({ world: { parts: {}, log: [], links: ['passage-5e'], place: PLAINE } });
  const onBoard = vi.fn();
  ouvrir({ objet: { genre: 'navire', port: PLAINE }, seq: 1, saut: false }, { onBoard });
  const f = screen.getByRole('dialog', { name: 'Le Bloc-Navire' });
  expect(f).toHaveTextContent('La prochaine étape est au port des Collines du Large.');
  expect(f).not.toHaveTextContent('étape 1');
  await userEvent.click(within(f).getByRole('button', { name: /Y aller/ }));
  expect(onBoard).toHaveBeenCalledWith('5e', true, 'maths-5e-proportionality');
});

it('une île pâle touchée la première fois : l’indice, puis la découverte, dans la fiche', () => {
  sauver({});
  ouvrir({ objet: { genre: 'ile', id: 'french-6e-letter-confusion' }, seq: 1, saut: false, decouverte: 'Les îles pâles sont fermées.' });
  const f = screen.getByRole('dialog', { name: 'Mine des lettres' });
  const phrases = [...f.querySelectorAll('.world-fiche-phrase')].map((p) => p.textContent);
  expect(phrases).toHaveLength(2);
  expect(phrases[0]).toMatch(/^Tunel\u00a0:/);
  expect(phrases[1]).toBe('Les îles pâles sont fermées.');
});

it('la ponctuation des fiches : une espace insécable avant « ! »', () => {
  sauver({ progress: joue(FORET) });
  ouvrir({ objet: { genre: 'gardien', id: FORET }, seq: 1, saut: false });
  expect(screen.getByRole('dialog', { name: 'Le Grand Chêne' }).querySelector('.world-fiche-phrase')!.textContent).toContain('rallumer\u00a0!');
});

describe('le portrait en médaillon (P2, PR 2, Blocland)', () => {
  const medaillon = () => document.querySelector('.world-fiche-medaillon');

  it('la créature et le Gardien : leur portrait en cubes, décoratif, à la place de l’icône du titre', () => {
    sauver({ progress: {}, stock: {}, world: { parts: {}, log: [], links: [], place: FORET } });
    const creature = ouvrir({ objet: { genre: 'creature', id: FORET }, seq: 1, saut: false, phrase: 'Bonjour !' });
    expect(medaillon()).toHaveAttribute('aria-hidden', 'true');
    expect(medaillon()!.querySelector('svg.creature')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mousso' }).querySelector('svg')).toBeNull();
    // Hors de la fiche qui défile : il reste entier.
    expect(medaillon()!.closest('.world-fiche')).toBeNull();
    expect(document.querySelector('.world-fiche-cadre')).toHaveClass('avec-medaillon');
    creature.unmount();
    ouvrir({ objet: { genre: 'gardien', id: FORET }, seq: 2, saut: false });
    expect(medaillon()!.querySelector('svg.guardian-svg')).toBeInTheDocument();
  });

  it('la borne, le navire, l’ouvrage et l’île pâle gardent l’icône du titre, sans médaillon', () => {
    sauver({ progress: {}, stock: {}, world: { parts: {}, log: [], links: [], place: FORET } });
    const fiches: FicheOuverte['objet'][] = [
      { genre: 'borne', id: `${FORET}:syllables` },
      { genre: 'navire', port: FORET },
      { genre: 'ouvrage', id: 'french-6e-phonology-french-6e-letter-confusion' },
      { genre: 'ile', id: 'french-6e-letter-confusion' },
    ];
    for (const objet of fiches) {
      const vue = ouvrir({ objet, seq: 1, saut: false });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(medaillon()).toBeNull();
      expect(document.querySelector('.world-fiche-titre svg')).toBeInTheDocument();
      vue.unmount();
    }
  });

  it('une borne jouable met ses étoiles et Jouer sur une même rangée ; fermée, sa phrase reste dessous', () => {
    sauver({ progress: {}, stock: {}, world: { parts: {}, log: [], links: [], place: FORET } });
    const ouverte = ouvrir({ objet: { genre: 'borne', id: `${FORET}:syllables` }, seq: 1, saut: false });
    const ligne = document.querySelector('.world-fiche-ligne');
    expect(ligne).not.toBeNull();
    expect(within(ligne as HTMLElement).getByRole('link', { name: /Jouer/ })).toBeInTheDocument();
    ouverte.unmount();
    ouvrir({ objet: { genre: 'borne', id: 'french-6e-letter-confusion:letter-pairs' }, seq: 2, saut: false });
    expect(document.querySelector('.world-fiche-ligne')).toBeNull();
    expect(document.querySelector('.world-fiche-phrase')).not.toBeNull();
  });

  it('Archipéo (« 4a », 4 octobre 2026) : le médaillon aussi, avec le portrait du modèle en SVG, l’icône en attendant', async () => {
    sauver({ progress: {}, stock: {}, world: { parts: {}, log: [], links: [], place: FORET } });
    localStorage.setItem('dysapps:settings', JSON.stringify({ univers: 'archipeo', autoRead: false, sounds: false }));
    ouvrir({ objet: { genre: 'creature', id: FORET }, seq: 1, saut: false, phrase: 'Bonjour !' });
    expect(screen.getByRole('dialog', { name: 'Mousso' })).toBeInTheDocument();
    expect(medaillon()).not.toBeNull();
    expect(medaillon()!.querySelector('svg')).not.toBeNull();
    await vi.waitFor(() => expect(medaillon()!.querySelector('.personnage-svg')).not.toBeNull(), { timeout: 5000 });
    expect(medaillon()!.querySelector('.voxel-scene, .creature-cubes')).toBeNull();
    expect(medaillon()).toHaveAttribute('aria-hidden', 'true');
  });
});
