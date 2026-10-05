import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleDesZones, lecteurDeZones, zonesCouvertes } from './coveredZones';

const rect = (left: number, top: number, width: number, height: number) => () => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect;

describe('zones couvertes par l’interface du monde (DA-10)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('mesure le panneau de la Carte, le bouton Pause et les boutons du bas, relatifs à la vue, sans les éléments cachés', () => {
    document.body.innerHTML = `
      <div data-scene>
        <div id="vue"></div>
        <button class="world-menu-button" data-couvre="bouton"></button>
        <div class="world-overlay-top" data-couvre="scene"><div id="panneau"></div><div id="cache"></div></div>
        <nav class="world-bar" data-couvre="scene"><button id="carte"></button></nav>
      </div>`;
    const q = (s: string) => document.querySelector<HTMLElement>(s)!;
    q('#vue').getBoundingClientRect = rect(0, 64, 1024, 704);
    q('.world-menu-button').getBoundingClientRect = rect(960, 90, 50, 50);
    q('#panneau').getBoundingClientRect = rect(140, 92, 680, 210);
    q('#cache').getBoundingClientRect = rect(0, 0, 0, 0);
    q('#carte').getBoundingClientRect = rect(250, 708, 130, 48);
    q('.world-overlay-top').getBoundingClientRect = rect(10, 74, 1004, 460);
    q('.world-bar').getBoundingClientRect = rect(0, 700, 1024, 68);
    const zones = zonesCouvertes(q('#vue'));
    expect(zones).toEqual([
      { x: 985, y: 51, w: 50, h: 50 },
      { x: 480, y: 133, w: 680, h: 210 },
      { x: 315, y: 668, w: 130, h: 48 },
    ]);
    expect(zonesCouvertes(q('#vue'), 2)[1]).toEqual({ x: 960, y: 266, w: 1360, h: 420 });
    // Plus haut que le haut de l'écran, qui défile : il ne couvre que le cadre.
    q('#panneau').getBoundingClientRect = rect(140, 92, 680, 900);
    expect(zonesCouvertes(q('#vue'))[1]).toEqual({ x: 480, y: 249, w: 680, h: 442 });
    expect(cleDesZones(zones)).toBe('985,51,50,50;480,133,680,210;315,668,130,48');
  });

  it('ne trouve rien sans page autour (un aperçu)', () => {
    document.body.innerHTML = '<div id="vue"></div>';
    expect(zonesCouvertes(document.querySelector<HTMLElement>('#vue')!)).toEqual([]);
  });

  it('relit les zones au plus quatre fois par seconde, à chaque image si l’horloge est figée ou recule, et se replie sans page', () => {
    document.body.innerHTML = '<div data-scene><div id="vue"></div><div data-couvre="bulle"><div id="bulle"></div></div></div>';
    const vue = document.querySelector<HTMLElement>('#vue')!;
    vue.getBoundingClientRect = rect(0, 0, 400, 800);
    const bulle = document.querySelector<HTMLElement>('#bulle')!;
    bulle.getBoundingClientRect = rect(0, 600, 400, 100);
    document.querySelector<HTMLElement>('[data-couvre="bulle"]')!.getBoundingClientRect = rect(0, 500, 400, 300);
    let t = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => t);
    const repli = [{ x: 200, y: 764, w: 400, h: 72 }];
    const lire = lecteurDeZones(vue, () => repli);
    // Aucune zone durable : le repli ; la bulle, à part.
    expect(lire()).toMatchObject({ zones: repli, bulles: [{ x: 200, y: 650, w: 400, h: 100 }] });
    bulle.getBoundingClientRect = rect(0, 700, 400, 100);
    t = 1100;
    expect(lire().bulles[0].y).toBe(650);
    t = 1300;
    expect(lire().bulles[0].y).toBe(750);
    bulle.getBoundingClientRect = rect(0, 600, 400, 100);
    // Horloge figée (même instant) : relue quand même.
    expect(lire().bulles[0].y).toBe(650);
    bulle.getBoundingClientRect = rect(0, 700, 400, 100);
    t = 900;
    expect(lire().bulles[0].y).toBe(750);
  });
});
