/**
 * La caméra qui tourne autour d'une scénette : l'arc du Phare et du Guet, sa butée, et le retour en douceur au cap de
 * départ à chaque nouvel item.
 */
import { describe, expect, it } from 'vitest';
import { wrapAngle } from './camera';
import { PLACES } from './plan6e';
import { SCENE_RETURN, SCENETTE_ARCS, sceneReturnYaw, scenetteArc, scenetteStartYaw, turnSceneYaw } from './scenette';

const deg = (d: number) => (d * Math.PI) / 180;

describe('L’arc de la caméra d’une scénette', () => {
  it('limite le Phare (sur sa galerie et à son pied) et le Guet ; les autres lieux gardent le tour complet', () => {
    expect(scenetteArc('phare')).toBe(SCENETTE_ARCS.phare);
    expect(scenetteArc('phare', false)).toBe(SCENETTE_ARCS.phareFoot);
    expect(scenetteArc('lookout')).toBe(SCENETTE_ARCS.lookout);
    for (const p of PLACES) if (p.id !== 'phare' && p.id !== 'lookout') expect(scenetteArc(p.id)).toBeNull();
  });

  it('reste un arc réglé sur captures : 50° sur la galerie, 70° au pied de la tour, 120° au Guet', () => {
    expect(SCENETTE_ARCS.phare).toBeCloseTo(deg(50), 9);
    expect(SCENETTE_ARCS.phareFoot).toBeCloseTo(deg(70), 9);
    expect(SCENETTE_ARCS.lookout).toBeCloseTo(deg(120), 9);
    for (const arc of Object.values(SCENETTE_ARCS)) expect(arc).toBeLessThan(Math.PI);
  });

  it('sans arc, le geste tourne librement, par-delà le demi-tour', () => {
    expect(turnSceneYaw(deg(170), deg(20), 0, null)).toBeCloseTo(deg(-170), 9);
  });

  it('borne l’angle au bout de l’arc, de part et d’autre du cap de départ', () => {
    const start = deg(65);
    const arc = deg(120);
    expect(turnSceneYaw(start, deg(30), start, arc)).toBeCloseTo(deg(95), 9);
    expect(turnSceneYaw(start + deg(110), deg(30), start, arc)).toBeCloseTo(wrapAngle(start + arc), 9);
    expect(turnSceneYaw(start - deg(110), deg(-30), start, arc)).toBeCloseTo(wrapAngle(start - arc), 9);
  });

  it('au-delà de la butée, le geste ne fait plus rien, et revenir part aussitôt', () => {
    const arc = deg(120);
    let yaw = 0;
    for (let i = 0; i < 40; i++) yaw = turnSceneYaw(yaw, deg(10), 0, arc);
    expect(yaw).toBeCloseTo(arc, 9);
    expect(turnSceneYaw(yaw, deg(10), 0, arc)).toBeCloseTo(arc, 9);
    expect(turnSceneYaw(yaw, deg(-10), 0, arc)).toBeCloseTo(deg(110), 9);
  });

  it('un angle hors de l’arc (un cap changé) y revient au bord le plus proche, sans traverser le dos', () => {
    expect(turnSceneYaw(deg(170), 0, 0, deg(120))).toBeCloseTo(deg(120), 9);
    expect(turnSceneYaw(deg(-170), 0, 0, deg(120))).toBeCloseTo(deg(-120), 9);
  });
});

describe('Le retour au cap de départ à chaque nouvel item', () => {
  it('dure environ 0,6 s', () => {
    expect(SCENE_RETURN.seconds).toBeCloseTo(0.6, 9);
  });

  it('part de l’angle courant et arrive au cap, sans le dépasser ni revenir en arrière', () => {
    const from = deg(100);
    const to = scenetteStartYaw('phare');
    expect(sceneReturnYaw(from, to, 0)).toBeCloseTo(from, 9);
    expect(sceneReturnYaw(from, to, 1)).toBeCloseTo(to, 9);
    expect(sceneReturnYaw(from, to, 2)).toBeCloseTo(to, 9);
    let prev = from;
    for (let i = 1; i <= 20; i++) {
      const y = sceneReturnYaw(from, to, i / 20);
      expect(y).toBeLessThanOrEqual(prev + 1e-12);
      expect(y).toBeGreaterThanOrEqual(to - 1e-12);
      prev = y;
    }
  });

  it('ralentit à l’arrivée (une courbe d’atténuation, pas un pas constant)', () => {
    const first = Math.abs(sceneReturnYaw(deg(90), 0, 0.1) - deg(90));
    const lastStep = Math.abs(sceneReturnYaw(deg(90), 0, 1) - sceneReturnYaw(deg(90), 0, 0.9));
    expect(first).toBeGreaterThan(lastStep * 10);
  });

  it('prend le plus court, par-delà le demi-tour', () => {
    const mid = sceneReturnYaw(deg(170), deg(-170), 0.5);
    expect(Math.abs(mid)).toBeGreaterThan(deg(170));
  });
});
