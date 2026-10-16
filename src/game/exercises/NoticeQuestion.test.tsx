// La colonne d'un C (la question et son document, NoticeQuestion) : un mot composé n'y est jamais coupé à l'affichage.
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SettingsProvider } from '../../core/SettingsContext';
import { NoticeQuestion } from './CalculationScreen';

describe('NoticeQuestion, les mots composés', () => {
  it('dans la question et dans chaque ligne du document', () => {
    const { container } = render(
      <SettingsProvider>
        <NoticeQuestion question="Pourquoi le cadre est-il en aluminium ?" prompt={'Le vélo vient des États-Unis.\nOn l’a-t-on vu en 52 av. J.-C. ?'} spoken="" image="" lang="fr" />
      </SettingsProvider>,
    );
    const kept = [...container.querySelectorAll('.mot-lie')].map((e) => e.textContent);
    expect(kept).toEqual(['est-il', 'États-Unis.', 'l’a-t-on', 'J.-C.\u00a0?']);
  });
});
