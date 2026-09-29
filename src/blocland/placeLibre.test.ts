import { afterEach, describe, expect, it, vi } from 'vitest';
import { lecteurDePlaceLibre, lirePlaceLibre } from './placeLibre';

const rect = (left: number, top: number, width: number, height: number) => () => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect;

/** La scène de la tablette (1024 × 641 sous la barre du haut, à 127 px) : Pause et l'archipel à droite, le panneau de la Carte, la barre du bas. */
function scene(pliOuvert: boolean, listeOuverte = false) {
  document.body.innerHTML = `
    <div data-scene>
      <div id="vue"></div>
      <button data-couvre="bouton" id="pause"></button>
      <div data-couvre="bouton" id="archipel"><button id="bateau" aria-expanded="${listeOuverte}"></button></div>
      <div data-couvre="scene" id="haut"><div id="panneau"><p id="phrase"></p><details ${pliOuvert ? 'open' : ''}><summary id="pli"></summary><ul></ul></details></div></div>
      <nav data-couvre="scene" id="barre"><button id="carte"></button></nav>
    </div>`;
  const q = (s: string) => document.querySelector<HTMLElement>(s)!;
  const vue = q('#vue');
  Object.defineProperty(vue, 'clientWidth', { value: 1024, configurable: true });
  Object.defineProperty(vue, 'clientHeight', { value: 641, configurable: true });
  vue.getBoundingClientRect = rect(0, 127, 1024, 641);
  q('#pause').getBoundingClientRect = rect(955, 137, 52, 52);
  q('#bateau').getBoundingClientRect = rect(870, 214, 136, 62);
  q('#archipel').getBoundingClientRect = rect(870, 214, 136, listeOuverte ? 300 : 62);
  // Le haut défile (60 % de la vue au plus) : pli ouvert, le panneau le dépasse, défilé jusqu'en bas.
  const haut = q('#haut');
  haut.getBoundingClientRect = rect(10, 137, 843, 385);
  Object.defineProperty(haut, 'scrollTop', { value: pliOuvert ? 300 : 0, configurable: true });
  const decale = pliOuvert ? -300 : 0;
  q('#panneau').getBoundingClientRect = rect(20, 147 + decale, 833, pliOuvert ? 655 : 355);
  q('#pli').getBoundingClientRect = rect(36, 432 + decale, 800, 48);
  q('details').getBoundingClientRect = rect(36, 432 + decale, 800, pliOuvert ? 348 : 48);
  q('#barre').getBoundingClientRect = rect(10, 678, 1004, 80);
  q('#carte').getBoundingClientRect = rect(50, 678, 240, 72);
  return vue;
}

describe('la place libre de la Carte (DA-31)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-texte');
    vi.restoreAllMocks();
  });

  it('sous le panneau, au-dessus de la barre, la colonne Pause et archipel au-dessus : toute la largeur', () => {
    expect(lirePlaceLibre(scene(false))).toEqual({ libre: { x0: 0, y0: 375, x1: 1024, y1: 551 }, panneau: true });
  });

  it('le pli ouvert (et le haut défilé) ou la liste des archipels ouverte comptent fermés : la place ne change pas', () => {
    expect(lirePlaceLibre(scene(true)).libre).toEqual({ x0: 0, y0: 375, x1: 1024, y1: 551 });
    expect(lirePlaceLibre(scene(false, true)).libre).toEqual({ x0: 0, y0: 375, x1: 1024, y1: 551 });
  });

  it('sans page autour (un aperçu) : la vue moins la bande du bas', () => {
    document.body.innerHTML = '<div id="vue"></div>';
    const vue = document.querySelector<HTMLElement>('#vue')!;
    Object.defineProperty(vue, 'clientWidth', { value: 800 });
    Object.defineProperty(vue, 'clientHeight', { value: 600 });
    expect(lirePlaceLibre(vue)).toEqual({ libre: { x0: 0, y0: 0, x1: 800, y1: 528 }, panneau: true });
  });

  it('gardée tant que rien ne change ; relue à une autre ouverture, et d’un saut quand le texte change', () => {
    let now = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const vue = scene(false);
    const lire = lecteurDePlaceLibre(vue);
    expect(lire('1|forge').libre.y0).toBe(375);
    // Deux secondes plus tard, le panneau a grandi (un autre panneau, le pli n'y est pour rien) : la caméra ne le suit pas.
    now += 2000;
    document.querySelector<HTMLElement>('#panneau')!.getBoundingClientRect = rect(20, 147, 833, 365);
    expect(lire('1|forge').libre.y0).toBe(375);
    // La Carte rouverte : relue, sans saut.
    now += 100;
    const rouverte = lire('2|forge');
    expect(rouverte.libre.y0).toBe(385);
    expect(rouverte.saut).toBe(false);
    // Le texte grandit : relue, d'un saut, une fois.
    now += 2000;
    document.documentElement.setAttribute('data-texte', 'grand');
    document.querySelector<HTMLElement>('#panneau')!.getBoundingClientRect = rect(20, 147, 833, 370);
    expect(lire('2|forge')).toMatchObject({ libre: { y0: 390 }, saut: true });
    expect(lire('2|forge').saut).toBe(false);
  });
});
