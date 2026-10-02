// Le moment du rallumage (lot 6, fil B2) : le toucher qui le saute, et un Gardien vu qui le reste.
import { act, fireEvent, render, renderHook } from '@testing-library/react';
import { degelerSauvegarde, gelerSauvegarde, saveJSON } from '../core/storage';
import { bacASable } from './batisseur';
import { EMPTY_STATE } from './engine';
import { oublierRallumagesEnMemoire, toucherQuiSaute, useRallumage } from './Rallumage';

it('un toucher sur la scène saute le moment sans atteindre le canvas, « Passer » garde le sien', () => {
  const sauter = vi.fn();
  const { container } = render(
    <div onPointerDownCapture={toucherQuiSaute(sauter)}>
      <canvas />
      <button type="button" className="rallumage-passer">
        Passer
      </button>
    </div>,
  );
  const canvas = container.querySelector('canvas')!;
  const auCanvas = vi.fn();
  canvas.addEventListener('pointerdown', auCanvas);
  fireEvent.pointerDown(canvas);
  expect(sauter).toHaveBeenCalledTimes(1);
  expect(auCanvas).not.toHaveBeenCalled();

  const bouton = container.querySelector('button')!;
  const auBouton = vi.fn();
  bouton.addEventListener('pointerdown', auBouton);
  fireEvent.pointerDown(bouton);
  expect(sauter).toHaveBeenCalledTimes(1);
  expect(auBouton).toHaveBeenCalled();
});

describe('useRallumage quand rien ne s’écrit sur l’appareil', () => {
  beforeEach(() => {
    localStorage.clear();
    oublierRallumagesEnMemoire();
  });
  afterEach(() => {
    degelerSauvegarde();
    oublierRallumagesEnMemoire();
  });

  it('un Gardien vu ne revient pas : son moment ne tourne pas en boucle', () => {
    saveJSON('guardians-seen', {});
    gelerSauvegarde();
    const { progress } = bacASable(EMPTY_STATE);
    const { result } = renderHook(() => useRallumage(progress, '6e', true));
    const premier = result.current.enAttente[0];
    expect(premier).toBe('french-6e-phonology');
    act(() => result.current.noterVu(premier));
    expect(result.current.enAttente).not.toContain(premier);
  });
});
