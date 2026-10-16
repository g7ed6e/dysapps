// Les syllabes en couleurs : un mot composé ne se coupe pas à son trait d'union, avec ou sans syllabes.
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SettingsProvider } from '../core/SettingsContext';
import { Syllabified } from './Syllabified';

describe('Syllabified, les mots composés', () => {
  it('avec les syllabes, « est-il » dans un conteneur insécable, la voix lit la phrase entière', () => {
    const { container } = render(
      <SettingsProvider>
        <Syllabified text="Pourquoi le cadre est-il en aluminium ?" force />
      </SettingsProvider>,
    );
    expect([...container.querySelectorAll('.mot-lie')].map((e) => e.textContent)).toEqual(['est-il']);
    expect(container.querySelector('.syllables')?.getAttribute('aria-label')).toBe('Pourquoi le cadre est-il en aluminium ?');
  });

  it('sans les syllabes, « taille-crayon » aussi, le texte inchangé', () => {
    const { container } = render(
      <SettingsProvider>
        <Syllabified text="Le taille-crayon garde les copeaux." />
      </SettingsProvider>,
    );
    expect([...container.querySelectorAll('.mot-lie')].map((e) => e.textContent)).toEqual(['taille-crayon']);
    expect(container.textContent).toBe('Le taille-crayon garde les copeaux.');
  });
});
