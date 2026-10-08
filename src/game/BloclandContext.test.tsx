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
  const spot = { x: 13, y: 7, turn: 1 as const };
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
