import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from './SettingsPage';
import { ProgressProvider } from '../core/ProgressContext';
import { SettingsProvider } from '../core/SettingsContext';

it('garde la section Expérimental, sans la section Univers, jusqu’à la bascule', () => {
  render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );
  expect(screen.getByRole('group', { name: 'Expérimental' })).toBeInTheDocument();
  expect(screen.queryByRole('group', { name: 'Univers' })).not.toBeInTheDocument();
});
