import { renderHook } from '@testing-library/react';
import { usePanneauDeLaCarte } from './usePanneauDeLaCarte';

const rect = (top: number, bottom: number) => ({ top, bottom, left: 0, right: 300, width: 300, height: bottom - top, x: 0, y: top, toJSON: () => ({}) });

/** Une scène avec le panneau de la Carte : « Y aller » dont le bas est à 260 px, le panneau en haut à 80 px. */
function scene() {
  const stage = document.createElement('div');
  stage.innerHTML = `<div class="world-overlay-top"><div class="world-map-line"><p class="world-map-actions"><button class="button primary">Y aller</button></p>
    <details class="world-map-islands"><summary>Les îles et leur état</summary></details></div></div>`;
  document.body.append(stage);
  const haut = stage.querySelector<HTMLElement>('.world-overlay-top')!;
  haut.getBoundingClientRect = () => rect(80, 500);
  stage.querySelector<HTMLElement>('.button.primary')!.getBoundingClientRect = () => rect(190, 260);
  return { stage, haut, pli: stage.querySelector('details')! };
}

describe('le panneau de la Carte sur téléphone en grand texte (DA-31)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-texte');
    vi.unstubAllGlobals();
  });

  it('s’arrête sous « Y aller », pli fermé ; pli ouvert, il reprend sa hauteur', () => {
    vi.stubGlobal('matchMedia', (media: string) => ({ matches: true, media, addEventListener: () => {}, removeEventListener: () => {} }));
    document.documentElement.setAttribute('data-texte', 'grand');
    const { stage, pli } = scene();
    const { unmount } = renderHook(() => usePanneauDeLaCarte({ current: stage }, true, ''));
    expect(stage.style.getPropertyValue('--carte-panneau-max')).toBe(`${260 - 80 + 8}px`);
    pli.open = true;
    pli.dispatchEvent(new Event('toggle'));
    expect(stage.style.getPropertyValue('--carte-panneau-max')).toBe('');
    unmount();
  });

  it('ne pose rien en texte normal, ni sur tablette', () => {
    vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener: () => {}, removeEventListener: () => {} }));
    document.documentElement.setAttribute('data-texte', 'grand');
    const { stage } = scene();
    renderHook(() => usePanneauDeLaCarte({ current: stage }, true, ''));
    expect(stage.style.getPropertyValue('--carte-panneau-max')).toBe('');
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
});
