// Les syllabes en couleurs : un mot composé ne se coupe pas à son trait d'union, avec ou sans syllabes.
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SettingsProvider } from '../core/SettingsContext';
import { syllabify } from '../core/syllables';
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

  it('l’alternance des couleurs ne repart pas à un mot gardé : la même que sur la phrase entière', () => {
    // Chaque mot commence par sa première couleur (syllabify, mot par mot) ; un morceau gardé ne coupe jamais un mot,
    // la suite des couleurs est donc celle du texte d'un seul tenant, avant comme après « est-il » et « taille-crayon ».
    const text = 'Pourquoi le taille-crayon est-il rangé dans le tiroir ? Il l’a-t-on vu, l’… ?';
    const { container } = render(
      <SettingsProvider>
        <Syllabified text={text} force />
      </SettingsProvider>,
    );
    const shown = [...container.querySelectorAll('.syl')].map((e) => `${e.textContent}:${e.className.replace('syl syl-', '')}`);
    const whole = syllabify(text)
      .filter((p) => p.syllable !== null)
      .map((p) => `${p.text}:${(p.syllable ?? 0) % 2}`);
    expect(container.querySelectorAll('.mot-lie').length).toBeGreaterThanOrEqual(4);
    expect(shown).toEqual(whole);
  });
});
