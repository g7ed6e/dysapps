// La remise (GD-20, point 4, lot L1 « Livrer ») : la consigne, la pose qui part sans voix après un délai borné, l'état
// final (la livraison écrite une fois, la phrase de fin, « Continuer » qui prend le focus) ; un toucher qui saute mène à
// l'état final, jamais plus loin ; « Vue simple » aussi ; une sortie par l'application passe par l'état final.
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SettingsProvider } from '../../../core/SettingsContext';
import { COMMANDES } from '../../world/requests';
import { voiceFallbackMs } from '../../world/continu/remise';
import { Remise } from './Remise';
import { remiseOf, type RemiseRequest } from './remiseOf';
import type { OpenWorld, RemiseEvents } from './scene';

const request = remiseOf(COMMANDES.find((c) => c.fixture === 'french-6e-phonology-fixture-1')!.id) as RemiseRequest;

function fakeWorld() {
  let events: RemiseEvents | undefined;
  const world = {
    remise: vi.fn((_r: unknown, on?: RemiseEvents) => {
      if (on) events = on;
    }),
    remiseStart: vi.fn(),
    remiseFinish: vi.fn(),
  };
  return { world: world as unknown as OpenWorld, calls: world, events: () => events! };
}

function renderRemise() {
  const f = fakeWorld();
  const deliver = vi.fn();
  const onClose = vi.fn();
  const view = render(
    <SettingsProvider>
      <div style={{ width: 1024, height: 768 }}>
        <Remise world={f.world} request={request} deliver={deliver} onClose={onClose} />
      </div>
    </SettingsProvider>,
  );
  return { ...f, deliver, onClose, view };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  // Pas de ResizeObserver sous jsdom : la remise ne relit sa taille qu'avec lui.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('la consigne, puis la pose sans voix après un délai borné, puis l’état final : livré une fois, la fin dite, « Continuer »', () => {
  const { calls, events, deliver, onClose } = renderRemise();
  expect(calls.remise).toHaveBeenCalledWith({ place: 'phare', amenagement: 'french-6e-phonology-fixture-1' }, expect.anything());
  expect(screen.getByText(request.role)).toBeInTheDocument();
  expect(document.getElementById('remise-consigne')?.textContent?.replace(/\s+/g, ' ')).toMatch(/^Tu livres 3 blocs de terre pour le potager/);
  expect(screen.getByRole('status')).toHaveTextContent('');
  expect(screen.queryByRole('button', { name: /Continuer/ })).toBeNull();
  // La zone de la scène a le focus : Entrée ou Espace la sautent.
  expect(screen.getByRole('button', { name: 'Passer' })).toHaveFocus();
  act(() => vi.advanceTimersByTime(voiceFallbackMs(request.consigne) - 10));
  expect(calls.remiseStart).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(20));
  expect(calls.remiseStart).toHaveBeenCalledTimes(1);
  expect(deliver).not.toHaveBeenCalled();
  // La pose finie d'elle-même : l'état final.
  act(() => events().done());
  expect(deliver).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('status')).toHaveTextContent('Le potager est posé.');
  const suite = screen.getByRole('button', { name: /Continuer/ });
  expect(suite).toHaveFocus();
  expect(screen.queryByRole('button', { name: 'Passer' })).toBeNull();
  act(() => vi.advanceTimersByTime(400));
  fireEvent.click(suite);
  expect(calls.remise).toHaveBeenLastCalledWith(null);
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(deliver).toHaveBeenCalledTimes(1);
});

it('un toucher saute à l’état final, jamais plus loin : « Continuer » ne prend pas le toucher qui suit aussitôt', () => {
  const { calls, deliver, onClose } = renderRemise();
  fireEvent.click(screen.getByRole('button', { name: 'Passer' }));
  expect(calls.remiseFinish).toHaveBeenCalledTimes(1);
  expect(deliver).toHaveBeenCalledTimes(1);
  // Le toucher qui suit aussitôt ne vaut pas « Continuer ».
  const suite = screen.getByRole('button', { name: /Continuer/ });
  fireEvent.click(suite);
  expect(onClose).not.toHaveBeenCalled();
  // La pose ne part plus.
  act(() => vi.advanceTimersByTime(20000));
  expect(calls.remiseStart).not.toHaveBeenCalled();
  fireEvent.click(suite);
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('« Vue simple » : la même consigne, la phrase de fin, « Continuer » ; la livraison écrite une fois', () => {
  const { deliver } = renderRemise();
  fireEvent.click(screen.getByRole('button', { name: /Vue simple/ }));
  expect(deliver).toHaveBeenCalledTimes(1);
  expect(document.getElementById('remise-consigne')?.textContent?.replace(/\s+/g, ' ')).toMatch(/^Tu livres 3 blocs de terre pour le potager/);
  expect(screen.getByRole('status')).toHaveTextContent('Le potager est posé.');
  fireEvent.click(screen.getByRole('button', { name: /Scène/ }));
  expect(deliver).toHaveBeenCalledTimes(1);
});

it('quitter avant l’état final (une autre adresse, le Retour du système) l’écrit d’abord, une fois', async () => {
  const { calls, deliver, view } = renderRemise();
  view.unmount();
  await Promise.resolve();
  expect(deliver).toHaveBeenCalledTimes(1);
  expect(calls.remise).toHaveBeenLastCalledWith(null);
});
