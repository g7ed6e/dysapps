// Le défi d'une sentinelle (lot 6, fil B2) : l'écran d'Archipéo, avec les textes d'Archipéo.
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

it('sans les étoiles, une seule phrase dit comment ouvrir le défi, sans « bâtisseur »', async () => {
  renderAt('/adventure/french-6e-phonology/challenge');
  await loaded();
  expect(document.body.textContent).toMatch(/Pour ouvrir son défi, gagne 2 étoiles dans /);
  expect(document.body.textContent).not.toMatch(/attend encore/);
  expect(document.body.textContent).not.toMatch(/bâtisseur/);
});

it('la page de l’île dit que le défi est prêt, sans combat', () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ progress: ready('french-6e-phonology') }));
  renderAt('/adventure/french-6e-phonology');
  expect(screen.getByText('Défi prêt')).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/affronter/);
});

it('le défi compte les épreuves réussies, dit le seuil, et une épreuve ratée n’a ni son ni pastille', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ progress: ready('french-6e-phonology') }));
  const drum = vi.spyOn(sound, 'playDrum').mockImplementation(() => {});
  const growl = vi.spyOn(sound, 'playGrowl').mockImplementation(() => {});
  const user = (await import('@testing-library/user-event')).default.setup();
  renderAt('/adventure/french-6e-phonology/challenge');
  await loaded();
  expect(screen.getByRole('region', { name: 'Le défi du Grand Chêne' })).toBeInTheDocument();
  const gauge = () => screen.getByRole('progressbar', { name: 'Épreuves réussies' });
  const total = Number(gauge().getAttribute('aria-valuemax'));
  const needed = Math.ceil(total * 0.7);
  expect(gauge()).toHaveAttribute('aria-valuenow', '0');
  expect(gauge()).toHaveAttribute('aria-valuetext', `0 épreuve réussie sur ${total}, il en faut ${needed}`);
  expect(screen.getByText(`0 sur ${total}`)).toBeInTheDocument();
  expect(document.body.textContent).toContain(`Il faut ${needed} épreuves réussies pour rallumer sa lumière.`);
  // La consigne dit la règle.
  expect(document.body.textContent).toContain('Chaque épreuve réussie allume une partie de sa lumière, et une épreuve ratée n’éteint rien.');
  expect(screen.getByRole('heading', { level: 1, name: /Le défi du Grand Chêne/ })).toBeInTheDocument();
  expect(drum).not.toHaveBeenCalled();

  // Une épreuve ratée : rien ne s'allume, rien ne s'éteint, aucun son.
  const { loadExercise } = await import('./exercises');
  const def = (await loadExercise('french-6e-phonology-syllables-warmup-001'))!;
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

it('le nom du Gardien seulement dans le titre ; la réplique et la règle se replient à la première épreuve (DA-34)', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ progress: ready('french-6e-phonology') }));
  const user = (await import('@testing-library/user-event')).default.setup();
  renderAt('/adventure/french-6e-phonology/challenge');
  await loaded();
  const arene = screen.getByRole('region', { name: 'Le défi du Grand Chêne' });
  expect(arene.querySelector('.arena-name')).toBeNull();
  expect(Array.from(arene.querySelectorAll('p')).some((p) => p.textContent === 'Le Grand Chêne')).toBe(false);
  expect(arene.querySelector('.arena-replique')).not.toHaveClass('repliee');
  expect(screen.queryByRole('button', { name: 'Toute la réplique' })).not.toBeInTheDocument();

  const { loadExercise } = await import('./exercises');
  const def = (await loadExercise('french-6e-phonology-syllables-warmup-001'))!;
  const prompt = screen.getByRole('group', { name: 'Réponses possibles' }).parentElement!.textContent ?? '';
  const item = def.items.find((i) => prompt.includes(String(i.word)))!;
  await user.click(screen.getByRole('button', { name: String(item.answer) }));
  expect(arene.querySelector('.arena-replique')).toHaveClass('repliee');
  // Repliée, la première phrase à l'écran ; la suite reste dans la page pour le lecteur d'écran, et le chevron l'ouvre.
  const ligne = arene.querySelector('.arena-line')!;
  expect(ligne.textContent).toBe('Une branche s’allume dans ma couronne. Tu as l’oreille fine.');
  expect(ligne.querySelector('.visually-hidden')!.textContent).toBe(' Tu as l’oreille fine.');
  expect(screen.getByRole('button', { name: 'Toute la réplique' })).toHaveAttribute('aria-expanded', 'false');
  // La règle, ouverte au premier défi, se replie aussi ; sa phrase courte reste (DA-28, DA-34).
  expect(pli().open).toBe(false);
  expect(pli().querySelector('summary')!.textContent).toBe('Une épreuve ratée n’éteint rien.');
  // Rouverte par l'élève, elle le reste à l'épreuve suivante.
  await user.click(pli().querySelector('summary')!);
  expect(pli().open).toBe(true);
  const prompt2 = screen.getByRole('group', { name: 'Réponses possibles' }).parentElement!.textContent ?? '';
  const item2 = def.items.find((i) => prompt2.includes(String(i.word)))!;
  await user.click(screen.getByRole('button', { name: String(item2.answer) }));
  expect(pli().open).toBe(true);
});

const pli = () => screen.getByRole('region', { name: 'Le défi du Grand Chêne' }).querySelector('.arena-regle details') as HTMLDetailsElement;

it('la règle est un pli dans l’arène : sa phrase courte toujours lue, ouvert au premier défi (DA-28)', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ progress: ready('french-6e-phonology') }));
  renderAt('/adventure/french-6e-phonology/challenge');
  await loaded();
  expect(pli().querySelector('summary')!.textContent).toBe('Une épreuve ratée n’éteint rien.');
  expect(pli().textContent).toContain('Chaque épreuve réussie allume une partie de sa lumière');
  expect(pli().open).toBe(true);
});

it('déjà affronté (une partie enregistrée, même perdue), le pli de la règle est fermé et sa phrase courte reste (DA-28)', async () => {
  localStorage.setItem(
    'dysapps:game',
    JSON.stringify({ progress: { ...ready('french-6e-phonology'), 'french-6e-phonology-challenge': { stars: 0, attempts: 1, best: 0.4 } } }),
  );
  renderAt('/adventure/french-6e-phonology/challenge');
  await loaded();
  expect(pli().open).toBe(false);
  expect(pli().querySelector('summary')!.textContent).toBe('Une épreuve ratée n’éteint rien.');
});
