// Le retour devant un lieu : l'adresse rouvre la liste une fois par navigation, même vers la même adresse (avis de
// l'expert frontend) ; une pose qui ne dit jamais sa fin ne retient pas la liste.
import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { POSE_GUARD_SECONDS } from '../../world/continu/construction';
import type { PlaceId } from '../../world/continu/plan6e';
import { usePlaceAddress, usePoseGuard } from './usePlaceReturn';

afterEach(() => vi.useRealTimers());

type Props = { place: PlaceId | null; mission: string | null; navigation: string; ready: number; worldUp: boolean };

function setup(initial: Props) {
  const open = vi.fn();
  const goTo = vi.fn();
  const hook = renderHook((p: Props) => usePlaceAddress({ ...p, goTo: (place) => (p.worldUp ? (goTo(place), true) : false), open }), { initialProps: initial });
  return { open, goTo, ...hook };
}

it('retour, fermeture, puis nouvelle navigation vers la même adresse : la liste se rouvre', () => {
  const { open, goTo, rerender } = setup({ place: 'quais', mission: 'make-ten', navigation: 'a', ready: 1, worldUp: true });
  expect(open).toHaveBeenLastCalledWith('quais', 'make-ten');
  expect(goTo).toHaveBeenCalledTimes(1);
  // Un rendu de plus (la liste fermée, l'état qui change) ne la rouvre pas.
  rerender({ place: 'quais', mission: 'make-ten', navigation: 'a', ready: 1, worldUp: true });
  expect(open).toHaveBeenCalledTimes(1);
  // « Ma dernière mission » vers la même adresse : une nouvelle navigation.
  rerender({ place: 'quais', mission: 'make-ten', navigation: 'b', ready: 1, worldUp: true });
  expect(open).toHaveBeenCalledTimes(2);
  expect(goTo).toHaveBeenCalledTimes(2);
});

it('attend la scène ; une mission d’une autre île ne prend pas le focus', () => {
  const { open, rerender } = setup({ place: 'quais', mission: 'plurals', navigation: 'a', ready: 0, worldUp: false });
  expect(open).not.toHaveBeenCalled();
  rerender({ place: 'quais', mission: 'plurals', navigation: 'a', ready: 1, worldUp: true });
  expect(open).toHaveBeenLastCalledWith('quais', null);
});

it('sans lieu dans l’adresse, rien ne s’ouvre', () => {
  const { open } = setup({ place: null, mission: 'make-ten', navigation: 'a', ready: 1, worldUp: true });
  expect(open).not.toHaveBeenCalled();
});

it('une pose qui ne dit jamais sa fin est tenue pour finie après le garde-fou', () => {
  vi.useFakeTimers();
  const release = vi.fn();
  const { rerender } = renderHook(({ active }) => usePoseGuard(active, release), { initialProps: { active: true } });
  act(() => vi.advanceTimersByTime(POSE_GUARD_SECONDS * 1000 - 1));
  expect(release).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(release).toHaveBeenCalledTimes(1);
  // Une pose qui finit à temps n'appelle rien.
  rerender({ active: false });
  rerender({ active: true });
  rerender({ active: false });
  act(() => vi.advanceTimersByTime(POSE_GUARD_SECONDS * 1000));
  expect(release).toHaveBeenCalledTimes(1);
});
