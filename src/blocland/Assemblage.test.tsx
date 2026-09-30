import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { BloclandProvider } from './BloclandContext';
import { AssemblagePage } from './Assemblage';

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

afterEach(() => localStorage.clear());

it('la Fabrique montre la recette de l’archipel, ce qu’il manque et le monument qui attend le bloc', () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { bois: 1 } }));
  renderIn(<AssemblagePage />);
  expect(screen.getByRole('heading', { level: 1, name: /La Fabrique/ })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 3, name: /Poutre/ })).toBeInTheDocument();
  expect(document.body.textContent).toContain('Pour 1 poutre, il faut 2 blocs de bois et 1 bloc de pierre.');
  expect(document.body.textContent).toContain('Il te manque 1 bloc de bois');
  expect(screen.getByRole('link', { name: 'L’observatoire des baleines' })).toHaveAttribute('href', '/aventure/monument-observatoire');
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
  expect(document.body.textContent).toContain('Pour 1 madrier, il faut');
});
