import { render } from '@testing-library/react';
import { SettingsProvider } from '../core/SettingsContext';
import { BloclandProvider } from '../blocland/BloclandContext';
import { todayISO } from '../blocland/engine';
import { AppBadge } from './AppBadge';

function renderBadge() {
  return render(
    <SettingsProvider>
      <BloclandProvider>
        <AppBadge />
      </BloclandProvider>
    </SettingsProvider>,
  );
}

it('pose un point sur l’icône quand des révisions attendent, et l’enlève sinon', () => {
  const setAppBadge = vi.fn(() => Promise.resolve());
  const clearAppBadge = vi.fn(() => Promise.resolve());
  Object.assign(navigator, { setAppBadge, clearAppBadge });
  const { unmount } = renderBadge();
  expect(clearAppBadge).toHaveBeenCalled();
  unmount();
  localStorage.setItem('dysapps:game', JSON.stringify({ spaced: [{ itemId: 'foret-echauffement-001:cabane', due: todayISO(), stage: 0, streak: 0 }] }));
  renderBadge();
  // Un point, sans nombre : pas de pression.
  expect(setAppBadge).toHaveBeenCalledWith();
  delete (navigator as { setAppBadge?: unknown }).setAppBadge;
  delete (navigator as { clearAppBadge?: unknown }).clearAppBadge;
});
