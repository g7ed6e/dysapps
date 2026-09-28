import { act, renderHook } from '@testing-library/react';
import { moinsDAnimations, useMoinsDAnimations } from './mouvement';
import { demanderMoinsDAnimations } from './mouvement.testing';

it('suit la préférence de l’appareil, et vaut non quand le navigateur ne sait pas la dire', () => {
  expect(moinsDAnimations()).toBe(false);
  demanderMoinsDAnimations();
  expect(moinsDAnimations()).toBe(true);
});

it('change dans un composant quand la préférence de l’appareil change', () => {
  let demande = false;
  const rappels = new Set<() => void>();
  vi.stubGlobal('matchMedia', (media: string) => ({
    get matches() {
      return demande;
    },
    media,
    addEventListener: (_: string, f: () => void) => rappels.add(f),
    removeEventListener: (_: string, f: () => void) => rappels.delete(f),
  }));
  const { result, unmount } = renderHook(() => useMoinsDAnimations());
  expect(result.current).toBe(false);
  act(() => {
    demande = true;
    rappels.forEach((f) => f());
  });
  expect(result.current).toBe(true);
  unmount();
  expect(rappels.size).toBe(0);
});
