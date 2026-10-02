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

const OBS = getMonument('monument-observatoire')!;

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
  expect(screen.getAllByRole('link', { name: 'Plaine des nombres' })[0]).toHaveAttribute('href', '/aventure/plaine');
  expect(screen.getByRole('button', { name: /Poser tout ce que j’ai/ })).toBeDisabled();
});

it('« Poser tout ce que j’ai » emploie les blocs en poche ; fini, il rapporte l’XP et le succès Patrimoine', async () => {
  const user = userEvent.setup();
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { brique: 40, bois: 5 } }));
  renderIn(<Page />);
  await user.click(screen.getByRole('button', { name: /Poser tout ce que j’ai/ }));
  const posed = monumentNeeds(OBS).brique! + 5;
  expect(screen.getByText(new RegExp(`^${posed} blocs posés\\. Il en reste ${OBS.cells.length - posed} à poser`))).toBeInTheDocument();
  const saved = JSON.parse(localStorage.getItem('dysapps:game')!);
  expect(saved.stock.brique).toBe(40 - monumentNeeds(OBS).brique!);
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
  const poutres = monumentNeeds(OBS).poutre!;
  // Tout le reste est posé : les cases restantes attendent des poutres.
  const posees = planCells(OBS)
    .filter((c) => c.block !== 'poutre')
    .map((c) => c.key);
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { bois: 0 }, world: { parts: { [OBS.id]: posees } } }));
  renderIn(<Page />);
  expect(screen.getByRole('button', { name: /Poser le bloc suivant/ })).toBeDisabled();
  expect(document.body.textContent).toContain(`Il te reste ${poutres} poutres à poser : va à la Fabrique pour les assembler.`);
  for (const l of screen.getAllByRole('link', { name: 'à la Fabrique' })) expect(l).toHaveAttribute('href', '/aventure/assemblage?bloc=poutre');
});

it('la liste des monuments : par archipel, ceux des archipels pas encore atteints sont fermés', () => {
  renderIn(<MonumentsList />);
  expect(screen.getByRole('link', { name: /L’observatoire des baleines\s*0 \/ \d+ blocs posés/ })).toHaveAttribute('href', '/aventure/monument-observatoire');
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
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { brique: 2 } }));
  renderIn(<Page />);
  expect(document.querySelector('.monument-lacking')).toBeNull();
  expect(screen.getByRole('button', { name: /Poser le bloc suivant/ })).toBeEnabled();
});

it('la ligne de ce qui manque : les deux plus gros manques, puis « d’autres blocs »', () => {
  expect(lackingLine([['pierre', 3]], {})).toBe('Il manque 3 blocs de pierre.');
  expect(lackingLine([['bois', 5], ['brique', 30]], { bois: 2 })).toBe('Il manque 30 briques et 3 blocs de bois.');
  expect(lackingLine([['bois', 5], ['brique', 30], ['pierre', 1]], {})).toBe('Il manque 30 briques, 5 blocs de bois et d’autres blocs.');
  expect(lackingLine([['bois', 5]], { bois: 5 })).toBe('');
});
