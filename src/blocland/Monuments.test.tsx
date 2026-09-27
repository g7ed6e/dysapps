import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { BloclandProvider } from './BloclandContext';
import { MonumentPage, MonumentsList } from './Monuments';
import { useMonumentBuilder } from './useMonumentBuilder';
import { getMonument, monumentNeeds } from './world/monuments';

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
  localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { brique: 40, bois: 5 } }));
  renderIn(<Page />);
  await user.click(screen.getByRole('button', { name: /Poser tout ce que j’ai/ }));
  const posed = monumentNeeds(OBS).brique! + 5;
  expect(screen.getByText(new RegExp(`^${posed} blocs posés\\. Il en reste ${OBS.cells.length - posed} à poser`))).toBeInTheDocument();
  const saved = JSON.parse(localStorage.getItem('dysapps:blocland')!);
  expect(saved.inventory.brique).toBe(40 - monumentNeeds(OBS).brique!);
  expect(saved.village.plans[OBS.id]).toHaveLength(posed);

  document.body.innerHTML = '';
  localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: monumentNeeds(OBS) }));
  renderIn(<Page />);
  await user.click(screen.getByRole('button', { name: /Poser tout ce que j’ai/ }));
  expect(screen.getAllByText(/L’observatoire des baleines : terminé !/).length).toBeGreaterThan(0);
  expect(screen.getByText(/Terminé !/, { selector: '.plan-done' })).toBeInTheDocument();
  const progress = JSON.parse(localStorage.getItem('dysapps:progress')!);
  expect(progress.monumentsCompleted).toBe(1);
  expect(progress.badges.patrimoine).toBeTruthy();
});

it('la liste des monuments : par archipel, ceux des archipels pas encore atteints sont fermés', () => {
  renderIn(<MonumentsList />);
  expect(screen.getByRole('link', { name: /L’observatoire des baleines\s*0 \/ \d+ blocs posés/ })).toHaveAttribute('href', '/aventure/monument-observatoire');
  expect(screen.getByRole('link', { name: /Le temple de marbre\s*Archipel fermé/ })).toBeInTheDocument();
});
