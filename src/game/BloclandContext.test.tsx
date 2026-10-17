import { act, render, screen } from '@testing-library/react';
import { ProgressProvider, useProgress } from '../core/ProgressContext';
import { SettingsProvider } from '../core/SettingsContext';
import { BloclandProvider, useBlocland } from './BloclandContext';
import { exercisesOf } from './exercises';
import { partiesPosees } from './world/parts';
import { getPlan } from './world/plans';
import { poseOfSpot } from './world/footprint';
import { islandDef, startingIsland } from './world/map';
import { layoutVersion } from './world/placement';
import { degelerSauvegarde } from '../core/storage';
import { EMPTY_STATE } from './engine/state';
import { reachableIslands } from './world/archipelago';
import { landById } from './world/continu/lands';
import { gridLand } from './three/archipeo/landLinks';
import { placeById } from './world/continu/plan6e';

function Etat() {
  const { progress } = useProgress();
  const { state } = useBlocland();
  return (
    <p>
      xp {progress.xp} · bâtiments {progress.structuresCompleted} · parties {partiesPosees('french-6e-phonology', state.world.parts)}
    </p>
  );
}

const ouvrir = () =>
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <Etat />
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );

it('une sauvegarde d’avant GD-6 reçoit à l’ouverture ses parties et l’XP de ses plans finis, une seule fois', () => {
  localStorage.clear();
  const joue = (type: string) => ({ [exercisesOf('french-6e-phonology', type)[0].id]: { stars: 2, attempts: 1, best: 0.7 } });
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, progress: { ...joue('rhymes'), ...joue('syllables') }, world: { parts: {}, log: [], links: [] } }));
  const xp = getPlan('french-6e-phonology-1')!.reward.xp + getPlan('french-6e-phonology-2')!.reward.xp;
  const { unmount } = ouvrir();
  expect(screen.getByText(`xp ${xp} · bâtiments 2 · parties 2`)).toBeInTheDocument();
  unmount();
  // Rouverte : déjà rattrapée, rien de plus.
  ouvrir();
  expect(screen.getByText(`xp ${xp} · bâtiments 2 · parties 2`)).toBeInTheDocument();
});

it('la disposition sauvegardée (GD-9) est posée sur le monde dès l’ouverture, et retirée avec la partie', () => {
  localStorage.clear();
  const spot = { x: 12, y: 2, turn: 1 as const };
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, progress: {}, world: { parts: {}, log: [], links: [], layout: { '6e': { islands: { 'maths-6e-decimals': spot } } } } }));
  let reset: () => void = () => {};
  function Lieu() {
    const ctx = useBlocland();
    reset = ctx.reset;
    const def = islandDef('maths-6e-decimals');
    return <p>{`${def.core.x},${def.core.y},${def.quarts},${ctx.disposition === layoutVersion()}`}</p>;
  }
  const { unmount } = render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <Lieu />
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
  const pose = poseOfSpot('6e', spot);
  expect(screen.getByText(`${pose.x},${pose.y},1,true`)).toBeInTheDocument();
  act(() => reset());
  const depart = startingIsland('maths-6e-decimals').core;
  expect(screen.getByText(`${depart.x},${depart.y},0,true`)).toBeInTheDocument();
  unmount();
  localStorage.clear();
});

it('la partie des mesures (`?mesures=auto`) se joue en mémoire : la sauvegarde de l’élève n’est pas touchée', () => {
  localStorage.clear();
  const sauvegarde = JSON.stringify({ version: 3, progress: {}, world: { parts: {}, log: [], links: [] } });
  localStorage.setItem('dysapps:game', sauvegarde);
  let charger: (etat: typeof EMPTY_STATE) => void = () => {};
  function Mesures() {
    const ctx = useBlocland();
    charger = ctx.chargerPourLesMesures;
    return <p>{`lieu ${ctx.state.world.place ?? 'aucun'}`}</p>;
  }
  const { unmount } = render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <Mesures />
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
  const avant = localStorage.getItem('dysapps:game');
  act(() => charger({ ...EMPTY_STATE, world: { ...EMPTY_STATE.world, place: 'maths-6e-decimals' } }));
  expect(screen.getByText('lieu maths-6e-decimals')).toBeInTheDocument();
  expect(localStorage.getItem('dysapps:game')).toBe(avant);
  unmount();
  degelerSauvegarde();
  localStorage.clear();
});

it('« Relier » une terre depuis le monde continu (GD-20, point 3, « vraies terres ») : deux touchers de suite, un seul débit, une commande au plus', () => {
  localStorage.clear();
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, progress: {}, stock: { 'french-6e-letter-confusion': 15 }, world: { parts: {}, log: [], links: [] } }));
  let ctx: ReturnType<typeof useBlocland> | null = null;
  function Lien() {
    ctx = useBlocland();
    return null;
  }
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <Lien />
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
  const before = ctx!.state.world.requests?.length ?? 0;
  let first: unknown;
  let second: unknown;
  act(() => {
    first = ctx!.linkLand(gridLand('couchant'));
    second = ctx!.linkLand(gridLand('couchant'));
  });
  expect(first).toMatchObject({ ok: true });
  expect(second).toEqual({ ok: false, reason: 'construit' });
  // Le Couchant : trois lieux, 12 ressources, payées une fois.
  expect(ctx!.state.stock['french-6e-letter-confusion']).toBe(3);
  const open = reachableIslands(ctx!.state.world.links);
  for (const id of landById('couchant').places) expect([...open]).toContain(placeById(id).island);
  expect((ctx!.state.world.requests?.length ?? 0) - before).toBeLessThanOrEqual(1);
  // Les Crêtes attendent le Levant ; le Large coûte 8 : refusés, rien de débité.
  act(() => {
    expect(ctx!.linkLand(gridLand('cretes'))).toEqual({ ok: false, reason: 'ordre' });
    expect(ctx!.linkLand(gridLand('large'))).toEqual({ ok: false, reason: 'blocs', missing: 5 });
  });
  expect(ctx!.state.stock['french-6e-letter-confusion']).toBe(3);
});
