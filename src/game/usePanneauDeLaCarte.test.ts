import { renderHook } from '@testing-library/react';
import { usePanneauDeLaCarte } from './usePanneauDeLaCarte';

/** Une scène avec le panneau de la Carte : le chemin d'ouvrages vers une île pâle. */
function scene() {
  const stage = document.createElement('div');
  stage.innerHTML = `<div class="world-overlay-top"><div class="world-map-line"><ol class="world-map-path"><li>Le pont</li></ol></div></div>`;
  document.body.append(stage);
  return { stage, haut: stage.querySelector<HTMLElement>('.world-overlay-top')! };
}

describe('le panneau de la Carte qui défile (DA-31)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('marque d’un trait qu’il continue, en bas puis en haut une fois défilé', () => {
    const { stage, haut } = scene();
    Object.defineProperties(haut, { scrollHeight: { value: 600 }, clientHeight: { value: 200 } });
    renderHook(() => usePanneauDeLaCarte({ current: stage }, true, ''));
    expect(haut.dataset.suite).toBe('bas');
    haut.scrollTop = 400;
    haut.dispatchEvent(new Event('scroll'));
    expect(haut.dataset.suite).toBe('haut');
  });

  it('ne marque rien quand il tient, ni une fois fermé', () => {
    const { stage, haut } = scene();
    const { unmount } = renderHook(() => usePanneauDeLaCarte({ current: stage }, true, ''));
    expect(haut.dataset.suite).toBeUndefined();
    unmount();
    expect(haut.dataset.suite).toBeUndefined();
  });
});
