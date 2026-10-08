import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { BloclandProvider } from './BloclandContext';
import { MonumentPage, MonumentsList, lackingLine } from './Monuments';
import { useMonumentBuilder } from './useMonumentBuilder';
import { getMonument, monumentNeeds } from './world/monuments';
import { planCells } from './world/plans';

const OBS = getMonument('landmark-6e-1')!;

function Page() {
  return <MonumentPage builder={useMonumentBuilder(OBS)} />;
}

function renderIn(node: React.ReactNode) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>{node}</MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

it('un monument dit ce que c’est, ce qu’il demande et où gagner les blocs', () => {
  renderIn(<Page />);
  expect(screen.getByRole('heading', { level: 1, name: /L’observatoire des baleines/ })).toBeInTheDocument();
  expect(document.body.textContent).toContain('longue-vue');
  expect(screen.getByRole('progressbar', { name: /Avancement du monument/ })).toHaveAttribute('aria-valuenow', '0');
  expect(screen.getAllByRole('link', { name: 'Plaine des nombres' })[0]).toHaveAttribute('href', '/adventure/maths-6e-calculation');
  expect(screen.getByRole('button', { name: /Poser tout ce que j’ai/ })).toBeDisabled();
});

it('« Poser tout ce que j’ai » emploie les blocs en poche ; fini, il rapporte l’XP et le succès Patrimoine', async () => {
  const user = userEvent.setup();
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'maths-6e-calculation': 40, 'french-6e-phonology': 5 } }));
  renderIn(<Page />);
  await user.click(screen.getByRole('button', { name: /Poser tout ce que j’ai/ }));
  const posed = monumentNeeds(OBS)['maths-6e-calculation']! + 5;
  expect(screen.getByText(new RegExp(`^${posed} blocs posés\\. Il en reste ${OBS.cells.length - posed} à poser`))).toBeInTheDocument();
  const saved = JSON.parse(localStorage.getItem('dysapps:game')!);
  expect(saved.stock['maths-6e-calculation']).toBe(40 - monumentNeeds(OBS)['maths-6e-calculation']!);
  expect(saved.world.parts[OBS.id]).toHaveLength(posed);

  cleanup();
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: monumentNeeds(OBS) }));
  renderIn(<Page />);
  await user.click(screen.getByRole('button', { name: /Poser tout ce que j’ai/ }));
  expect(screen.getAllByText(/L’observatoire des baleines : terminé !/).length).toBeGreaterThan(0);
  expect(screen.getByText(/Terminé !/, { selector: '.plan-done' })).toBeInTheDocument();
  const progress = JSON.parse(localStorage.getItem('dysapps:progress')!);
  expect(progress.landmarksCompleted).toBe(1);
  expect(progress.badges.patrimoine).toBeTruthy();
});

it('quand il ne reste que des blocs assemblés à poser, il dit pourquoi les boutons sont grisés et où aller', () => {
  const poutres = monumentNeeds(OBS)['compound-6e']!;
  // Tout le reste est posé : les cases restantes attendent des poutres.
  const posees = planCells(OBS)
    .filter((c) => c.block !== 'compound-6e')
    .map((c) => c.key);
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-phonology': 0 }, world: { parts: { [OBS.id]: posees } } }));
  renderIn(<Page />);
  expect(screen.getByRole('button', { name: /Poser le bloc suivant/ })).toBeDisabled();
  expect(document.body.textContent).toContain(`Il te reste ${poutres} poutres à poser : va à la Fabrique pour les assembler.`);
  for (const l of screen.getAllByRole('link', { name: 'à la Fabrique' })) expect(l).toHaveAttribute('href', '/adventure/assembly?bloc=compound-6e');
});

it('la liste des monuments : par archipel, ceux des archipels pas encore atteints sont fermés', () => {
  renderIn(<MonumentsList />);
  expect(screen.getByRole('link', { name: /L’observatoire des baleines\s*0 \/ \d+ blocs posés/ })).toHaveAttribute('href', '/adventure/landmark-6e-1');
  expect(screen.getByRole('link', { name: /Le temple de marbre\s*Archipel fermé/ })).toBeInTheDocument();
});

it('« Poser » impossible : une ligne visible dit ce qui manque ; la liste des blocs est repliée', () => {
  renderIn(<Page />);
  const line = document.querySelector('.monument-lacking')!;
  expect(line.textContent).toMatch(/^\s*Il manque \d+ /);
  const blocks = document.querySelector<HTMLDetailsElement>('.monument-blocks')!;
  expect(blocks).not.toHaveAttribute('open');
  expect(blocks.querySelector('summary')).toHaveTextContent('Les blocs qu’il faut');
  expect(screen.getByRole('button', { name: /Poser le bloc suivant/ })).toBeDisabled();
  // Des blocs en poche : on peut poser, la ligne s'efface.
  cleanup();
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'maths-6e-calculation': 2 } }));
  renderIn(<Page />);
  expect(document.querySelector('.monument-lacking')).toBeNull();
  expect(screen.getByRole('button', { name: /Poser le bloc suivant/ })).toBeEnabled();
});

it('la ligne de ce qui manque : les deux plus gros manques, puis « d’autres blocs »', () => {
  expect(lackingLine([['french-6e-letter-confusion', 3]], {})).toBe('Il manque 3 blocs de pierre.');
  expect(lackingLine([['french-6e-phonology', 5], ['maths-6e-calculation', 30]], { 'french-6e-phonology': 2 })).toBe('Il manque 30 briques et 3 blocs de bois.');
  expect(lackingLine([['french-6e-phonology', 5], ['maths-6e-calculation', 30], ['french-6e-letter-confusion', 1]], {})).toBe('Il manque 30 briques, 5 blocs de bois et d’autres blocs.');
  expect(lackingLine([['french-6e-phonology', 5]], { 'french-6e-phonology': 5 })).toBe('');
});

const PHARE = getMonument('landmark-5e-1')!;

function PharePage() {
  return <MonumentPage builder={useMonumentBuilder(PHARE)} />;
}

it('le phare du large, un grand projet : cinq pièces, deux recettes, un seul bouton pour la suivante', async () => {
  const user = userEvent.setup();
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'english-5e-grammar': 6, 'geography-5e-resources': 4 }, world: { links: ['passage-5e'] } }));
  renderIn(<PharePage />);
  expect(screen.getByRole('list', { name: '0 pièce posée sur 5' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Poser tout/ })).toBeNull();
  const recettes = screen.getAllByRole('radio');
  expect(recettes).toHaveLength(2);
  // La recette que le stock paie est choisie d'avance, et le bouton mène à sa question.
  expect(recettes[1]).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByRole('link', { name: /Construire le socle/ })).toHaveAttribute('href', '/adventure/project/landmark-5e-1/1');
  // L'autre recette manque de blocs : le bouton est gris et la liste dit où les gagner.
  await user.click(recettes[0]);
  expect(screen.getByRole('button', { name: /Construire le socle/ })).toBeDisabled();
  expect(screen.getByRole('list', { name: 'Blocs qu’il manque' })).toBeInTheDocument();
});

it('une pièce commencée bloc par bloc se finit sans rien payer', async () => {
  const user = userEvent.setup();
  const une = planCells(PHARE).find((c) => c.z === 0)!.key;
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: {}, world: { links: ['passage-5e'], parts: { [PHARE.id]: [une] } } }));
  renderIn(<PharePage />);
  await user.click(screen.getByRole('button', { name: /Finir le socle/ }));
  expect(screen.getByRole('list', { name: '1 pièce posée sur 5' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Construire la tour/ })).toBeDisabled();
});
