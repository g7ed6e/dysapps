// Le toucher qui saute le moment du rallumage (lot 6, fil B2) : il saute le moment, et ne va pas plus loin.
import { fireEvent, render } from '@testing-library/react';
import { toucherQuiSaute } from './Rallumage';

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
