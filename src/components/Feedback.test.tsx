import { render } from '@testing-library/react';
import { SettingsProvider } from '../core/SettingsContext';
import { Feedback } from './Feedback';

it('« Presque ! » garde son point d’exclamation sur sa ligne (espace insécable, plus grand texte sur téléphone)', () => {
  const { container } = render(
    <SettingsProvider>
      <Feedback shout="Presque !" message="Réessaie." tone="rate" />
    </SettingsProvider>,
  );
  expect(container.querySelector('.feedback-shout')!.textContent).toBe('Presque !');
});
