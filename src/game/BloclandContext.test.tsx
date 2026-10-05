import { render, screen } from '@testing-library/react';
import { ProgressProvider, useProgress } from '../core/ProgressContext';
import { SettingsProvider } from '../core/SettingsContext';
import { BloclandProvider, useBlocland } from './BloclandContext';
import { exercisesOf } from './exercises';
import { partiesPosees } from './world/parties';
import { getPlan } from './world/plans';

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
