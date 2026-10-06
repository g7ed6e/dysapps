// Les boutons transparents posés sur les poignées dessinées dans le monde (GD-9, 6 octobre 2026) : chacun sur sa
// poignée, jamais sous 48 px, jamais détaché d’elle ; la dernière place donnée aux boutons qui arrivent après
// elle ; et les touchers transmis à la 3D. Sans choix, un bouton sur chaque bout de liaison (choix 1a du mainteneur).
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ArrangeHandles, creerSuiviALEcran, placerLesBoutons, placerLesBoutsDesLiaisons } from './ArrangeHandles';
import type { Amenagement } from './Arranging';
import { RELAYE_DEPUIS_UN_BOUTON } from './three/drag';
import type { ChoixALEcran } from './world/view';

const LIBRE = { x0: 0, y0: 80, x1: 800, y1: 500 };

describe('les boutons des poignées', () => {
  it('chacun sur sa poignée, aussi grand qu’elle, jamais sous 48 px', () => {
    const b: ChoixALEcran = {
      libre: LIBRE,
      poignees: [
        { cle: 'nord', x: 400, y: 200, w: 30, h: 20 },
        { cle: 'est', x: 500, y: 290, w: 80, h: 60 },
      ],
    };
    const p = placerLesBoutons(b);
    expect(p.get('nord')).toEqual({ x: 400, y: 200, w: 48, h: 48 });
    expect(p.get('est')).toEqual({ x: 500, y: 290, w: 80, h: 60 });
    expect(p.get('sud')).toBeUndefined();
  });

  it('au bord de l’écran, sous le bandeau : le bouton reste sur la flèche (c’est la vue qui se recadre)', () => {
    const p = placerLesBoutons({ libre: LIBRE, poignees: [{ cle: 'nord', x: 10, y: 60, w: 48, h: 48 }] });
    expect(p.get('nord')).toEqual({ x: 10, y: 60, w: 48, h: 48 });
  });

  it('les boutons qui arrivent reçoivent la dernière place ; les touchers vont à la 3D', () => {
    const suivi = creerSuiviALEcran();
    const b: ChoixALEcran = { libre: LIBRE, poignees: [{ cle: 'sud', x: 1, y: 2, w: 48, h: 48 }] };
    suivi.suivre(b);
    const recu: (ChoixALEcran | null)[] = [];
    const arreter = suivi.ecouter((x) => recu.push(x));
    suivi.suivre(null);
    arreter();
    suivi.suivre(b);
    expect(recu).toEqual([b, null]);
    const touches: string[] = [];
    const fin = suivi.touchers.ecouter((c) => touches.push(c));
    suivi.toucher('tourner');
    fin();
    suivi.toucher('nord');
    expect(touches).toEqual(['tourner']);
  });

  it('les bouts des liaisons : un bouton sur chaque petit radeau, 48 px au moins, nommé par son bout (choix 1a)', () => {
    const b: ChoixALEcran = {
      libre: LIBRE,
      poignees: [],
      bouts: [
        { link: 'a-b', end: 'from', x: 100, y: 120, w: 20, h: 14 },
        { link: 'a-b', end: 'to', x: 300, y: 220, w: 60, h: 50 },
      ],
    };
    const p = placerLesBoutsDesLiaisons(b);
    expect(p.get('a-b|from')).toEqual({ x: 100, y: 120, w: 48, h: 48 });
    expect(p.get('a-b|to')).toEqual({ x: 300, y: 220, w: 60, h: 50 });
    expect(placerLesBoutsDesLiaisons({ libre: LIBRE, poignees: [] }).size).toBe(0);
  });

  it('deux bouts trop proches : leurs boutons se partagent la place à mi-distance, aucun ne couvre l’autre', () => {
    const p = placerLesBoutsDesLiaisons({
      libre: LIBRE,
      poignees: [],
      bouts: [
        { link: 'a-b', end: 'from', x: 100, y: 100, w: 28, h: 28 },
        { link: 'a-b', end: 'to', x: 130, y: 104, w: 28, h: 28 },
        { link: 'c-d', end: 'from', x: 400, y: 100, w: 28, h: 28 },
      ],
    });
    const a = p.get('a-b|from')!;
    const b = p.get('a-b|to')!;
    expect(a.w).toBe(30);
    expect(b.w).toBe(30);
    // Plus de recouvrement : leurs bords se touchent à mi-distance.
    expect(a.x + a.w / 2).toBeLessThanOrEqual(b.x - b.w / 2);
    expect(p.get('c-d|from')).toEqual({ x: 400, y: 100, w: 48, h: 48 });
  });

  it('trop près pour deux cibles de 24 px (ou au même point) : un seul bouton, celui du bout le plus près du milieu', () => {
    const deux = (ax: number, bx: number) =>
      placerLesBoutsDesLiaisons({
        libre: LIBRE,
        poignees: [],
        bouts: [
          { link: 'a-b', end: 'from', x: ax, y: 300, w: 28, h: 28 },
          { link: 'a-b', end: 'to', x: bx, y: 300, w: 28, h: 28 },
        ],
      });
    // Le milieu de la place libre est à x = 400 : le second bout en est plus près.
    const p = deux(380, 395);
    expect(p.has('a-b|from')).toBe(false);
    expect(p.get('a-b|to')).toEqual({ x: 395, y: 300, w: 48, h: 48 });
    // Au même point : le premier.
    expect([...deux(200, 200).keys()]).toEqual(['a-b|from']);
    // À 24 px : deux cibles de 24 px.
    expect(deux(200, 224).get('a-b|from')?.w).toBe(24);
  });
});

describe('le bouton d’un bout de liaison, au doigt', () => {
  const monter = () => {
    const choisirUnBout = vi.fn();
    const amenagement = { choix: null, geste: null, vue: null, bouts: [{ link: 'a-b', end: 'from', x: 0, y: 0, z: 0, dx: 1, dy: 0, nom: 'L’arrivée' }], choisirUnBout } as unknown as Amenagement;
    const { container } = render(
      <div data-scene>
        <canvas />
        <ArrangeHandles amenagement={amenagement} suivi={creerSuiviALEcran()} />
      </div>,
    );
    const recus: { type: string; relaye: boolean }[] = [];
    const canvas = container.querySelector('canvas')!;
    for (const type of ['pointerdown', 'pointermove']) canvas.addEventListener(type, (e) => recus.push({ type, relaye: RELAYE_DEPUIS_UN_BOUTON in e }));
    return { bouton: container.querySelector<HTMLButtonElement>('[data-bout]')!, choisirUnBout, recus };
  };

  it('un toucher court (moins de 8 px) choisit l’arrivée', () => {
    const { bouton, choisirUnBout, recus } = monter();
    fireEvent.pointerDown(bouton, { pointerId: 1, isPrimary: true, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(bouton, { pointerId: 1, isPrimary: true, buttons: 1, clientX: 104, clientY: 102 });
    fireEvent.pointerUp(bouton, { pointerId: 1, isPrimary: true });
    fireEvent.click(bouton, { detail: 1 });
    expect(choisirUnBout).toHaveBeenCalledWith('a-b', 'from');
    expect(recus).toEqual([]);
  });

  it('un glissé parti du bouton est relayé à la Carte, qui glisse ; il ne choisit rien', () => {
    const { bouton, choisirUnBout, recus } = monter();
    fireEvent.pointerDown(bouton, { pointerId: 1, isPrimary: true, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(bouton, { pointerId: 1, isPrimary: true, buttons: 1, clientX: 112, clientY: 100 });
    fireEvent.pointerUp(bouton, { pointerId: 1, isPrimary: true });
    fireEvent.click(bouton, { detail: 1 });
    expect(choisirUnBout).not.toHaveBeenCalled();
    expect(recus).toEqual([
      { type: 'pointerdown', relaye: true },
      { type: 'pointermove', relaye: false },
    ]);
    // Au clavier ensuite (Entrée : un clic sans `detail`), le bouton choisit l'arrivée.
    fireEvent.click(bouton, { detail: 0 });
    expect(choisirUnBout).toHaveBeenCalledWith('a-b', 'from');
  });

  it('la souris qui passe sans bouton enfoncé ne relaie rien', () => {
    const { bouton, recus } = monter();
    fireEvent.pointerDown(bouton, { pointerId: 1, isPrimary: true, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(bouton, { pointerId: 1, isPrimary: true, buttons: 0, clientX: 130, clientY: 100 });
    expect(recus).toEqual([]);
  });
});
