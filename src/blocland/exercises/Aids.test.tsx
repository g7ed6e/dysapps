import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Graph, graphPoints, graphSegment } from './Aids';
import { AID_COMPONENTS } from './maths';

const FRAME = { xMin: -4, xMax: 4, yMin: -4, yMax: 4 };

describe('Graph', () => {
  it('est une aide connue de l’écran de calcul', () => {
    expect(AID_COMPONENTS.graph).toBe(Graph);
  });

  it('garde les points de la droite aux intersections du quadrillage, dans le cadre', () => {
    // f(x) = 2x − 1 : de x = −1 (−3) à x = 2 (3) ; x = −2 donne −5 et x = 3 donne 5, hors du cadre.
    expect(graphPoints({ a: 2, b: -1, ...FRAME })).toEqual([
      [-1, -3],
      [0, -1],
      [1, 1],
      [2, 3],
    ]);
    for (const a of [-3, -2, -1, 1, 2, 3])
      for (let b = -3; b <= 3; b++)
        for (const [x, y] of graphPoints({ a, b, ...FRAME })) {
          expect(Number.isInteger(x) && Number.isInteger(y)).toBe(true);
          expect(Math.abs(x) <= 4 && Math.abs(y) <= 4).toBe(true);
          expect(y).toBe(a * x + b);
        }
  });

  it('coupe la droite au bord du cadre', () => {
    expect(graphSegment({ a: 2, b: -1, ...FRAME })).toEqual([
      [-1.5, -4],
      [2.5, 4],
    ]);
    expect(graphSegment({ a: -1, b: 0, ...FRAME })).toEqual([
      [-4, 4],
      [4, -4],
    ]);
    expect(graphSegment({ a: 0, b: 6, ...FRAME })).toBeNull();
  });

  it('dit le repère et les points de la droite, et nomme les axes', () => {
    const { container } = render(<Graph a={-2} b={1} {...FRAME} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Graphique de la fonction f dans un repère : x de −4 à 4, f(x) de −4 à 4, une graduation par unité. ' +
        'La droite de f passe par les points (−1 ; 3), (0 ; 1), (1 ; −1), (2 ; −3).',
    );
    expect(screen.getByText('La droite épaisse est celle de f.')).toBeInTheDocument();
    // Les axes sont nommés sur le graphique.
    expect([...container.querySelectorAll('.graph-name')].map((t) => t.textContent)).toEqual(['x', 'f(x)']);
    // Le 0 de l'origine a un fond plein : ni l'axe ni la droite ne le barrent.
    expect(container.querySelectorAll('.graph-tick-bg')).toHaveLength(1);
    // Une graduation par unité, chaque nombre écrit une fois (0 une seule fois, à l'origine), avec le vrai signe moins.
    const ticks = [...container.querySelectorAll('.graph-tick')].map((t) => t.textContent);
    expect(ticks).toHaveLength(17);
    expect(ticks.filter((t) => t === '0')).toHaveLength(1);
    expect(ticks).toContain('−4');
    expect(ticks.join()).not.toContain('-');
    expect(container.querySelectorAll('.graph-point')).toHaveLength(4);
    expect(container.querySelectorAll('.graph-line')).toHaveLength(1);
    // Rien d'animé.
    expect(container.querySelector('animate, animateTransform, animateMotion')).toBeNull();
  });
});
