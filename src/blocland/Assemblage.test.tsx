import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { BloclandProvider } from './BloclandContext';
import { AssemblagePage } from './Assemblage';
import { BRIDGES, VOYAGES } from './world/archipelago';

function renderIn(node: React.ReactNode, at = '/aventure/assemblage') {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={[at]}>{node}</MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

afterEach(() => localStorage.clear());

it('la Fabrique montre la recette de l’archipel, ce qu’il manque et le monument qui attend le bloc', () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { bois: 1 } }));
  renderIn(<AssemblagePage />);
  expect(screen.getByRole('heading', { level: 1, name: /La Fabrique/ })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 3, name: /Poutre/ })).toBeInTheDocument();
  expect(screen.getByRole('list', { name: 'Pour 1 poutre, il faut' }).textContent).toMatch(/2 blocs de bois.*1 bloc de pierre/);
  expect(document.body.textContent).toContain('Il te manque 1 bloc de bois');
  expect(screen.getByRole('link', { name: 'L’observatoire des baleines' })).toHaveAttribute('href', '/aventure/monument-observatoire');
  // Chaque monument dit combien il en attend (rien à retenir).
  expect(document.body.textContent).toMatch(/L’observatoire des baleines attend \d+ poutres/);
  expect(screen.getByRole('button', { name: /Assembler 1 poutre/ })).toHaveAttribute('aria-disabled', 'true');
  // Seul l'archipel atteint : pas de recette des Îles du Ciel en 6e.
  expect(screen.queryByRole('heading', { level: 3, name: /Miroir/ })).toBeNull();
});

it('« Assembler » fait un bloc à la fois et l’enregistre', async () => {
  const user = userEvent.setup();
  localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { bois: 4, pierre: 1 } }));
  renderIn(<AssemblagePage />);
  await user.click(screen.getByRole('button', { name: /Assembler 1 poutre/ }));
  expect(screen.getByText('Tu as assemblé 1 poutre. Tu en as 1.')).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('dysapps:blocland')!).inventory).toMatchObject({ bois: 2, pierre: 0, poutre: 1 });
  const bouton = screen.getByRole('button', { name: /Assembler 1 poutre/ });
  expect(bouton).toHaveAttribute('aria-disabled', 'true');
  // Grisé, il garde le focus et ne fait rien : rien ne se perd.
  expect(bouton).toHaveFocus();
  await user.click(bouton);
  expect(JSON.parse(localStorage.getItem('dysapps:blocland')!).inventory).toMatchObject({ bois: 2, pierre: 0, poutre: 1 });
});

it('dans Archipéo, la Halle aux matériaux et le madrier', () => {
  localStorage.setItem('dysapps:settings', JSON.stringify({ univers: 'archipeo' }));
  renderIn(<AssemblagePage />);
  expect(screen.getByRole('heading', { level: 1, name: /La Halle aux matériaux/ })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 3, name: /Madrier/ })).toBeInTheDocument();
  expect(screen.getByRole('list', { name: 'Pour 1 madrier, il faut' })).toBeInTheDocument();
});

it('venue d’un monument, la Fabrique montre d’abord la recette du bloc demandé, les autres sous un pli', () => {
  // En 5e, la poutre (6e) passe devant le vitrail quand on vient d'un monument de 6e.
  const bridges = [...BRIDGES, ...VOYAGES].map((b) => b.id);
  localStorage.setItem('dysapps:blocland', JSON.stringify({ village: { at: 'marche', bridges } }));
  renderIn(<AssemblagePage />, '/aventure/assemblage?bloc=poutre');
  const titres = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
  expect(titres[0]).toMatch(/Poutre/);
  expect(screen.getByText('Les autres archipels')).toBeInTheDocument();
});

it('n’assemble plus quand les monuments n’attendent plus ce bloc, et dit pourquoi', () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { bois: 9, pierre: 9, poutre: 99 } }));
  renderIn(<AssemblagePage />);
  expect(screen.getByRole('button', { name: /Assembler 1 poutre/ })).toHaveAttribute('aria-disabled', 'true');
  expect(document.body.textContent).toContain('Les monuments n’attendent plus de poutre');
});
