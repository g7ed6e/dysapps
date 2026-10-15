// Le retour d'une mission du portail : vers sa matière, ou vers la porte d'où l'on vient (l'école du village, ou une
// porte de l'école du monde continu, `/adventure?porte=…`, GD-20, lot 2).
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProgressProvider } from '../core/ProgressContext';
import { SettingsProvider } from '../core/SettingsContext';
import { BloclandProvider } from '../game/BloclandContext';
import { AppPage } from './AppPage';

function renderAt(from?: string) {
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={[{ pathname: '/app/tables', state: from ? { from } : null }]}>
            <Routes>
              <Route path="/app/:appId" element={<AppPage />} />
            </Routes>
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
  return screen.getAllByRole('link')[0];
}

beforeEach(() => localStorage.clear());

it('venue d’une porte de l’école du monde continu, la mission y ramène', () => {
  expect(renderAt('/adventure?porte=maths')).toHaveAttribute('href', '/adventure?porte=maths');
});

it('sans origine, la mission ramène à sa matière', () => {
  expect(renderAt()).toHaveAttribute('href', '/matiere/maths');
});

it('une adresse d’ailleurs n’est jamais suivie', () => {
  expect(renderAt('/reglages')).toHaveAttribute('href', '/matiere/maths');
});
