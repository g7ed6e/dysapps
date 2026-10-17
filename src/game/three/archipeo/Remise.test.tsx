// La remise (GD-20, point 4, lot L1 « Livrer ») : la consigne, la pose qui part sans voix après un délai borné, l'état
// final (la livraison écrite une fois, la phrase de fin, « Continuer » qui prend le focus) ; un toucher qui saute mène à
// l'état final, jamais plus loin ; « Vue simple » aussi ; une sortie par l'application passe par l'état final. Au plus
// grand texte, la « Vue simple » d'office seulement sur un écran vraiment bas, une fois la taille mesurée ; sous le mode
// strict de React, une seule livraison.
import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode, type ReactNode } from 'react';
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

/** Le plus grand texte des réglages (`texteGrand`) : OpenDyslexic grande taille, espacements au maximum. */
const GRAND_TEXTE = { fontSize: 32, letterSpacing: 0.2 };

function renderRemise({ w = 1024, h = 768, strict = false }: { w?: number; h?: number; strict?: boolean } = {}) {
  const f = fakeWorld();
  const deliver = vi.fn();
  const onClose = vi.fn();
  const tree: ReactNode = (
    <SettingsProvider>
      <div data-w={w} data-h={h}>
        <Remise world={f.world} request={request} deliver={deliver} onClose={onClose} />
      </div>
    </SettingsProvider>
  );
  const view = render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  return { ...f, deliver, onClose, view };
}

/** La consigne, puis la phrase de fin à sa place, dans la scène ; en « Vue simple », la fin sous l'objet. */
const consigneZone = () => document.getElementById('remise-consigne')!;
const finSimple = () => document.querySelector('.open-world-remise-fin[role="status"]:not(#remise-consigne)')!;

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  // Pas de mise en page sous jsdom : la taille du parent de la remise vient de ses attributs `data-w` et `data-h`.
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
    return Number(this.dataset.w ?? 0);
  });
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return Number(this.dataset.h ?? 0);
  });
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
  vi.restoreAllMocks();
});

it('la consigne, puis la pose sans voix après un délai borné, puis l’état final : livré une fois, la fin dite, « Continuer »', () => {
  const { calls, events, deliver, onClose } = renderRemise();
  expect(calls.remise).toHaveBeenCalledWith({ place: 'phare', amenagement: 'french-6e-phonology-fixture-1' }, expect.anything());
  expect(screen.getByText(request.role)).toBeInTheDocument();
  expect(consigneZone().textContent?.replace(/\s+/g, ' ')).toMatch(/^Tu livres 3 blocs de terre pour le potager/);
  expect(consigneZone()).toHaveAttribute('role', 'status');
  expect(finSimple()).toHaveTextContent('');
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
  // La phrase de fin prend la place de la consigne (un seul emplacement), dans la même zone annoncée.
  expect(consigneZone()).toHaveTextContent('Le potager est en place.');
  expect(consigneZone()).not.toHaveTextContent(/Tu livres/);
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

it('« Vue simple » : la consigne, puis la phrase de fin sous l’objet, « Continuer » ; la livraison écrite une fois', () => {
  const { deliver } = renderRemise();
  fireEvent.click(screen.getByRole('button', { name: /Vue simple/ }));
  expect(deliver).toHaveBeenCalledTimes(1);
  expect(consigneZone().textContent?.replace(/\s+/g, ' ')).toMatch(/^Tu livres 3 blocs de terre pour le potager/);
  expect(finSimple()).toHaveTextContent('Le potager est en place.');
  fireEvent.click(screen.getByRole('button', { name: /Scène/ }));
  expect(deliver).toHaveBeenCalledTimes(1);
  expect(consigneZone()).toHaveTextContent('Le potager est en place.');
});

it('au plus grand texte sur une tablette, la remise ne se saute pas au montage : la consigne reste, rien n’est livré', () => {
  localStorage.setItem('dysapps:settings', JSON.stringify(GRAND_TEXTE));
  const { calls, deliver } = renderRemise({ w: 1024, h: 768 });
  expect(calls.remiseFinish).not.toHaveBeenCalled();
  expect(deliver).not.toHaveBeenCalled();
  expect(consigneZone()).toHaveTextContent(/Tu livres 3 blocs de terre/);
  expect(screen.queryByRole('button', { name: /Continuer/ })).toBeNull();
  expect(screen.getByRole('button', { name: /Vue simple/ })).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(voiceFallbackMs(request.consigne) + 10));
  expect(calls.remiseStart).toHaveBeenCalledTimes(1);
});

it('au plus grand texte sur un écran vraiment bas (844 × 390), la « Vue simple » d’office : l’état final, une livraison', () => {
  localStorage.setItem('dysapps:settings', JSON.stringify(GRAND_TEXTE));
  const { calls, deliver } = renderRemise({ w: 844, h: 390 });
  expect(calls.remiseFinish).toHaveBeenCalledTimes(1);
  expect(deliver).toHaveBeenCalledTimes(1);
  expect(consigneZone()).toHaveTextContent(/Tu livres 3 blocs de terre/);
  expect(finSimple()).toHaveTextContent('Le potager est en place.');
  expect(screen.getByRole('button', { name: /Continuer/ })).toHaveFocus();
  // Pas de retour à la scène : elle ne tiendrait pas.
  expect(screen.queryByRole('button', { name: /Scène/ })).toBeNull();
});

it('sous le mode strict de React : une seule livraison, au saut comme au démontage', async () => {
  const { calls, deliver, view } = renderRemise({ strict: true });
  await Promise.resolve();
  // Le double montage ne livre rien, et la scène garde la remise.
  expect(deliver).not.toHaveBeenCalled();
  expect(calls.remise).not.toHaveBeenCalledWith(null);
  fireEvent.click(screen.getByRole('button', { name: 'Passer' }));
  expect(deliver).toHaveBeenCalledTimes(1);
  view.unmount();
  await Promise.resolve();
  expect(deliver).toHaveBeenCalledTimes(1);
  expect(calls.remise).toHaveBeenLastCalledWith(null);
});

it('quitter avant l’état final (une autre adresse, le Retour du système) l’écrit d’abord, une fois', async () => {
  const { calls, deliver, view } = renderRemise();
  view.unmount();
  await Promise.resolve();
  expect(deliver).toHaveBeenCalledTimes(1);
  expect(calls.remise).toHaveBeenLastCalledWith(null);
});
