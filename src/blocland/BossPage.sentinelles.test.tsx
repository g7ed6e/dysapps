// Le défi d'une sentinelle (lot 6, fil B2) : l'écran d'Archipéo, essayé comme s'il était ouvert (les textes de
// l'univers sont ceux d'Archipéo, quelle que soit la constante `UNIVERS_OUVERT`).
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { AppRoutes } from '../App';
import { getBiome } from './biomes';
import { BloclandProvider } from './BloclandContext';
import { typesWithContent } from './boss';
import { exercisesOf } from './exercises';
import * as sound from './sound';

vi.mock('../univers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../univers')>();
  return { ...actual, useTextes: () => actual.textesDe('archipeo') };
});

function renderAt(path: string) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={[path]}>
            <AppRoutes />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

const loaded = () => waitFor(() => expect(screen.queryByText('Chargement…')).not.toBeInTheDocument());

function ready(biomeId: string) {
  const biome = getBiome(biomeId)!;
  const progress: Record<string, unknown> = {};
  for (const type of typesWithContent(biome)) progress[exercisesOf(biome.id, type)[0].id] = { stars: 2, attempts: 1, best: 0.8 };
  return progress;
}

it('sans les étoiles, la créature dit que le Gardien attend encore, sans « bâtisseur »', async () => {
  renderAt('/aventure/foret/gardien');
  await loaded();
  expect(document.body.textContent).toMatch(/Le Grand Chêne attend encore\. Obtiens 2 étoiles dans chaque mission de l’île/);
  expect(document.body.textContent).not.toMatch(/bâtisseur/);
});

it('la page de l’île dit que le défi est prêt, sans combat', () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ progress: ready('foret') }));
  renderAt('/aventure/foret');
  expect(screen.getByText('Défi prêt')).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/affronter/);
});

it('le défi compte les épreuves réussies, dit le seuil, et une épreuve ratée n’a ni son ni pastille', async () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ progress: ready('foret') }));
  const drum = vi.spyOn(sound, 'playDrum').mockImplementation(() => {});
  const growl = vi.spyOn(sound, 'playGrowl').mockImplementation(() => {});
  const user = (await import('@testing-library/user-event')).default.setup();
  renderAt('/aventure/foret/gardien');
  await loaded();
  expect(screen.getByRole('region', { name: 'Le défi du Grand Chêne' })).toBeInTheDocument();
  const gauge = () => screen.getByRole('progressbar', { name: 'Épreuves réussies' });
  const total = Number(gauge().getAttribute('aria-valuemax'));
  const needed = Math.ceil(total * 0.7);
  expect(gauge()).toHaveAttribute('aria-valuenow', '0');
  expect(gauge()).toHaveAttribute('aria-valuetext', `0 épreuve réussie sur ${total}, il en faut ${needed}`);
  expect(screen.getByText(`0 sur ${total}`)).toBeInTheDocument();
  expect(document.body.textContent).toContain(`Il en faut ${needed} pour la rallumer.`);
  // La consigne dit la règle.
  expect(document.body.textContent).toContain('Chaque épreuve réussie allume une partie de sa lumière, et une épreuve ratée n’éteint rien.');
  expect(screen.getByRole('heading', { level: 1, name: /Le défi du Grand Chêne/ })).toBeInTheDocument();
  expect(drum).not.toHaveBeenCalled();

  // Une épreuve ratée : rien ne s'allume, rien ne s'éteint, aucun son.
  const { loadExercise } = await import('./exercises');
  const def = (await loadExercise('foret-echauffement-001'))!;
  const prompt = screen.getByRole('group', { name: 'Réponses possibles' }).parentElement!.textContent ?? '';
  const item = def.items.find((i) => prompt.includes(String(i.word)))!;
  const wrong = screen.getAllByRole('button').find((b) => b.closest('[role="group"]') && b.textContent !== String(item.answer))!;
  await user.click(wrong);
  expect(gauge()).toHaveAttribute('aria-valuenow', '0');
  expect(document.body.textContent).toMatch(/Rien ne s’éteint\./);
  expect(growl).not.toHaveBeenCalled();
  expect(gauge().querySelectorAll('.arena-pastille.on')).toHaveLength(0);
  expect(gauge().querySelectorAll('.arena-pastille')).toHaveLength(total);
});
