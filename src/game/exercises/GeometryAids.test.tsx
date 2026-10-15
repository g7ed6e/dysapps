import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vitest';
import { AngleFigure, CoordinatePlane, gridTriangle, PlaneFigure, SolidFigure, TransformationFigure, TriangleAngles, triangleAngles } from './GeometryAids';
import { AID_COMPONENTS } from './maths';

type Point = [number, number];

/** Les sommets d'un polygone dessiné. */
const vertices = (polygon: Element): Point[] =>
  (polygon.getAttribute('points') ?? '')
    .split(' ')
    .map((p) => p.split(',').map(Number) as Point);

/** L'angle en `v` (degrés) entre les directions de `a` et de `b`. */
function angleAt(v: Point, a: Point, b: Point) {
  const [u, w] = [
    [a[0] - v[0], a[1] - v[1]],
    [b[0] - v[0], b[1] - v[1]],
  ];
  return (Math.acos((u[0] * w[0] + u[1] * w[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(w[0], w[1]))) * 180) / Math.PI;
}

describe('les figures de géométrie', () => {
  it('sont des aides connues de l’écran de calcul', () => {
    expect(AID_COMPONENTS['triangle-angles']).toBe(TriangleAngles);
    expect(AID_COMPONENTS.angle).toBe(AngleFigure);
    expect(AID_COMPONENTS['plane-figure']).toBe(PlaneFigure);
    expect(AID_COMPONENTS.solid).toBe(SolidFigure);
    expect(AID_COMPONENTS.transformation).toBe(TransformationFigure);
    expect(AID_COMPONENTS['coordinate-plane']).toBe(CoordinatePlane);
  });
});

describe('TriangleAngles', () => {
  it('calcule l’angle à trouver pour le tracé', () => {
    expect(triangleAngles([40, 60, '?'])).toEqual([40, 60, 80]);
    expect(triangleAngles([80, '?', '?'], 'isosceles')).toEqual([80, 50, 50]);
    expect(triangleAngles(['?', 70, '?'], 'isosceles')).toEqual([40, 70, 70]);
    expect(triangleAngles(['?', '?', '?'], 'equilateral')).toEqual([60, 60, 60]);
    expect(triangleAngles([100, 90, '?'])).toBeNull();
    expect(triangleAngles([80, '?', '?'])).toBeNull();
  });

  it('trace le triangle avec ses vrais angles, sans écrire ni lire le troisième', () => {
    const { container } = render(<TriangleAngles angles={[40, 60, '?']} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAccessibleName('Triangle : un angle de 40°, un angle de 60° et un angle à trouver.');
    expect(img.tagName).toBe('svg');
    const [A, B, C] = vertices(container.querySelector('polygon') as Element);
    expect(angleAt(A, B, C)).toBeCloseTo(40, 0);
    expect(angleAt(B, A, C)).toBeCloseTo(60, 0);
    expect(angleAt(C, A, B)).toBeCloseTo(80, 0);
    expect(container.textContent).not.toContain('80');
    expect([...container.querySelectorAll('text.ask')].map((t) => t.textContent)).toEqual(['?']);
  });

  it('marque l’angle droit d’un petit carré et les côtés égaux', () => {
    const { container: droit } = render(<TriangleAngles angles={[90, 35, '?']} />);
    expect(droit.querySelectorAll('.geo-right')).toHaveLength(1);
    const { container: isocele } = render(<TriangleAngles angles={[80, '?', '?']} marks="isosceles" />);
    expect(isocele.querySelectorAll('.geo-tick')).toHaveLength(2);
    expect(screen.getAllByRole('img')[1]).toHaveAccessibleName('Triangle isocèle, ses deux côtés égaux marqués : un angle de 80° et deux angles à trouver.');
    expect(isocele.textContent).not.toContain('50');
    const { container: equilateral } = render(<TriangleAngles angles={['?', '?', '?']} marks="equilateral" />);
    expect(equilateral.querySelectorAll('.geo-tick')).toHaveLength(3);
  });
});

describe('AngleFigure', () => {
  it('montre un angle seul à côté d’un angle droit en pointillé', () => {
    const { container } = render(<AngleFigure layout="single" values={[120]} />);
    expect(screen.getByRole('img')).toHaveAccessibleName('Un angle de 120°, à côté d’un angle droit en pointillé, pour comparer.');
    expect(screen.getByText('120°')).toBeInTheDocument();
    expect(container.querySelector('.geo-dash')).not.toBeNull();
  });

  it('ne donne pas l’angle cherché, et ne marque rien sur les angles voisins', () => {
    const { container: plat } = render(<AngleFigure layout="straight" values={[130, '?']} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Une droite et une demi-droite partant d’un de ses points : deux angles côte à côte, qui forment un angle plat. L’un mesure 130°, l’autre est à trouver.',
    );
    expect(plat.textContent).not.toContain('50');
    const { container: croise } = render(<AngleFigure layout="crossed" values={[70, '?']} />);
    expect(screen.getAllByRole('img')[1].getAttribute('aria-label')).not.toContain('110');
    expect([...croise.querySelectorAll('text')].map((t) => t.textContent)).toEqual(['70°', '?']);
  });
});

describe('PlaneFigure', () => {
  it('cote chaque longueur une fois, l’aire cherchée dans la figure', () => {
    render(<PlaneFigure shape="rectangle" values={[5, 3]} area="?" />);
    expect(screen.getByRole('img')).toHaveAccessibleName('Rectangle de longueur 5 et de largeur 3 ; son aire est à trouver.');
    expect(screen.getByText('aire = ?')).toHaveClass('ask');
    expect(screen.getAllByText('5')).toHaveLength(1);
  });

  it('ne cote qu’un côté du carré, avec les marques d’égalité', () => {
    const { container } = render(<PlaneFigure shape="square" values={[6]} area="?" />);
    expect(container.querySelectorAll('.geo-tick')).toHaveLength(4);
    expect(screen.getAllByText('6')).toHaveLength(1);
  });

  it('trace la hauteur en pointillé avec un angle droit', () => {
    const { container } = render(<PlaneFigure shape="parallelogram" values={[5, 3, 4]} area="?" />);
    expect(screen.getByRole('img')).toHaveAccessibleName('Parallélogramme de base 5 et de hauteur 3, la hauteur en pointillé, côté penché 4 ; son aire est à trouver.');
    expect(container.querySelector('.geo-dash')).not.toBeNull();
    expect(container.querySelector('.geo-right')).not.toBeNull();
  });

  it('dit la médiatrice et le rectangle partagé sans la valeur cherchée', () => {
    render(<PlaneFigure shape="bisector" values={[7, '?']} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Le segment AB et sa médiatrice, qui le coupe en son milieu à angle droit. Le point M est sur la médiatrice : la longueur MA vaut 7, la longueur MB est à trouver.',
    );
    render(<PlaneFigure shape="split" values={[3]} widths={['x', 4]} areas={['?', '?']} />);
    expect(screen.getAllByRole('img')[1]).toHaveAccessibleName('Un rectangle de hauteur 3, partagé en 2 parts de largeurs x et 4 ; l’aire de chaque part est à trouver.');
  });

  it('écrit le diamètre cherché sur lui', () => {
    render(<PlaneFigure shape="circle" values={[4]} diameter="?" />);
    expect(screen.getByRole('img').getAttribute('aria-label')).not.toContain('8');
    expect(screen.getByText('diamètre = ?')).toHaveClass('ask');
  });
});

describe('SolidFigure', () => {
  it('montre chaque petit cube, sans total', () => {
    const { container } = render(<SolidFigure solid="cubes" boxes={[[4, 2, 3]]} />);
    expect(screen.getByRole('img')).toHaveAccessibleName('Un pavé fait de petits cubes : 3 couches de 4 cubes sur 2.');
    // Les lignes entre les cubes, chacune sur deux faces : 3 sur la longueur, 2 entre les couches, 1 sur la largeur.
    expect(container.querySelectorAll('.geo-cube-line')).toHaveLength((3 + 2 + 1) * 2);
    expect(container.textContent).not.toContain('24');
  });

  it('nomme les deux boîtes A et B', () => {
    render(<SolidFigure solid="cubes" boxes={[[3, 2, 2], [2, 2, 3]]} />);
    expect(screen.getByRole('img')).toHaveAccessibleName('Deux boîtes remplies de petits cubes. Boîte A : 2 couches de 3 cubes sur 2. Boîte B : 3 couches de 2 cubes sur 2.');
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('écrit « 1 cm » sur trois arêtes du cube, sans unité de volume', () => {
    const { container } = render(<SolidFigure solid="cube" values={[1]} />);
    expect(screen.getAllByText('1 cm')).toHaveLength(3);
    expect(container.textContent).not.toContain('cm³');
  });

  it('ne nomme pas le cylindre qu’une question demande', () => {
    render(<SolidFigure solid="cylinder" />);
    expect(screen.getByRole('img').getAttribute('aria-label')).not.toMatch(/cylindre/i);
    render(<SolidFigure solid="cylinder" values={[3, 2]} volume="?" />);
    expect(screen.getAllByRole('img')[1]).toHaveAccessibleName('Un solide à deux bases en disque et une face courbe : rayon 3, hauteur 2 ; son volume est à trouver.');
  });

  it('dessine le cône et le prisme à côté de la pyramide', () => {
    render(<SolidFigure solid="cone" values={['r', 'h']} />);
    expect(screen.getByRole('img')).toHaveAccessibleName('Un solide à une base en disque et un sommet : rayon r, hauteur h, la hauteur en pointillé.');
    render(<SolidFigure solid="prism-pyramid" values={['h']} />);
    expect(screen.getByText('prisme droit')).toBeInTheDocument();
    expect(screen.getByText('pyramide')).toBeInTheDocument();
  });
});

describe('TransformationFigure', () => {
  it('choisit un triangle du quadrillage dont l’angle marqué a l’air de sa mesure, assez profond pour l’écrire dedans', () => {
    for (const angle of [40, 50, 60, 70]) {
      const [v, q, r] = gridTriangle(angle, 4, 4);
      expect([v, q, r].flat().every(Number.isInteger)).toBe(true);
      expect(Math.abs(angleAt(v, q, r) - angle)).toBeLessThan(2.5);
      // La distance du sommet marqué au côté opposé : trois cases au moins.
      const depth = Math.abs((q[0] - v[0]) * (r[1] - v[1]) - (q[1] - v[1]) * (r[0] - v[0])) / Math.hypot(r[0] - q[0], r[1] - q[1]);
      expect(depth).toBeGreaterThanOrEqual(3);
    }
  });

  it('fait partir l’arc de la rotation d’un autre sommet que l’angle marqué', () => {
    const { container } = render(<TransformationFigure transform="rotation" amount={90} angles={[50, '?']} />);
    const [shape, image] = [...container.querySelectorAll('polygon.geo-shape')].map(vertices);
    const arc = container.querySelector('path.geo-dash')?.getAttribute('d') ?? '';
    const [start, end] = [/^M ([\d.-]+) ([\d.-]+)/.exec(arc), / ([\d.-]+) ([\d.-]+)$/.exec(arc)].map((m) => [Number(m?.[1]), Number(m?.[2])] as Point);
    const near = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.5;
    expect(shape.some((p) => near(p, start))).toBe(true);
    expect(near(shape[0], start)).toBe(false);
    expect(near(image[0], end)).toBe(false);
  });

  it('pose la figure et son image sur des points du quadrillage', () => {
    const cases: ComponentProps<typeof TransformationFigure>[] = [
      { transform: 'translation' },
      { transform: 'reflection', areas: [12, '?'] },
      { transform: 'point-reflection', arc: '?' },
      { transform: 'rotation', amount: 90, angles: [50, '?'] },
      { transform: 'dilation', amount: 2, angles: [40, '?'] },
    ];
    for (const props of cases) {
      const { container, unmount } = render(<TransformationFigure {...props} />);
      const grid = [...container.querySelectorAll('.geo-grid')];
      const xs = new Set(grid.filter((l) => l.getAttribute('x1') === l.getAttribute('x2')).map((l) => Number(l.getAttribute('x1'))));
      const ys = new Set(grid.filter((l) => l.getAttribute('y1') === l.getAttribute('y2')).map((l) => Number(l.getAttribute('y1'))));
      const polygons = container.querySelectorAll('polygon.geo-shape');
      expect(polygons).toHaveLength(2);
      for (const [x, y] of [...polygons].flatMap(vertices)) {
        expect([...xs].some((g) => Math.abs(g - x) < 0.11)).toBe(true);
        expect([...ys].some((g) => Math.abs(g - y) < 0.11)).toBe(true);
      }
      unmount();
    }
  });

  it('écrit une mesure trop fermée hors de l’angle, dans le dessin', () => {
    const { container } = render(<AngleFigure layout="single" values={[20]} />);
    const [, , width, height] = (container.querySelector('svg')?.getAttribute('viewBox') ?? '').split(' ').map(Number);
    for (const text of container.querySelectorAll('text')) {
      const [x, y] = [Number(text.getAttribute('x')), Number(text.getAttribute('y'))];
      expect(x > 0 && x < width && y > 0 && y < height, text.textContent ?? '').toBe(true);
    }
  });

  it('ne nomme jamais la transformation, ni l’angle de la rotation, ni le rapport', () => {
    render(<TransformationFigure transform="rotation" amount={90} angles={[50, '?']} />);
    const label = screen.getByRole('img').getAttribute('aria-label') ?? '';
    expect(label).toBe(
      'Sur un quadrillage, un triangle et son image, tournée autour du point O ; un arc en pointillé va d’un sommet à son image. Un angle marqué du triangle : 50° ; l’angle qui lui correspond sur l’image : à trouver.',
    );
    expect(label).not.toContain('90');
    render(<TransformationFigure transform="dilation" amount={2} angles={[40, '?']} />);
    expect(screen.getAllByRole('img')[1].getAttribute('aria-label')).not.toMatch(/2|homothétie|rapport/);
    for (const transform of ['translation', 'reflection', 'point-reflection'] as const) {
      const { unmount } = render(<TransformationFigure transform={transform} />);
      expect(screen.getAllByRole('img').at(-1)?.getAttribute('aria-label')).not.toMatch(/translation|symétrie|axiale|centrale|rotation|demi-tour/);
      unmount();
    }
  });

  it('écrit les deux aires de part et d’autre de l’axe', () => {
    const { container } = render(<TransformationFigure transform="reflection" areas={[12, '?']} />);
    expect(container.querySelector('.geo-axis')).not.toBeNull();
    expect(screen.getByText('aire = 12')).toBeInTheDocument();
    expect(screen.getByText('aire = ?')).toHaveClass('ask');
  });
});

describe('les descriptions lues', () => {
  it('ne nomment jamais la transformation ni le solide qu’une question peut demander', () => {
    const figures = [
      <TransformationFigure key="t" transform="translation" />,
      <TransformationFigure key="a" transform="reflection" />,
      <TransformationFigure key="aa" transform="reflection" areas={[12, '?']} />,
      <TransformationFigure key="c" transform="point-reflection" arc="?" />,
      <TransformationFigure key="r" transform="rotation" amount={90} angles={[50, '?']} />,
      <TransformationFigure key="h" transform="dilation" amount={2} angles={[40, '?']} />,
      <SolidFigure key="cy" solid="cylinder" />,
      <SolidFigure key="cyv" solid="cylinder" values={[3, 2]} volume="?" />,
      <SolidFigure key="co" solid="cone" values={['r', 'h']} />,
    ];
    for (const figure of figures) {
      const { container, unmount } = render(figure);
      const words = `${container.querySelector('[role="img"]')?.getAttribute('aria-label')} ${container.textContent}`;
      expect(words).not.toMatch(/translation|symétrie|axiale|centrale|rotation|homothétie|demi-tour|cylindre|cône/i);
      unmount();
    }
  });
});

describe('CoordinatePlane', () => {
  it('va de −6 à 6 et nomme ses axes', () => {
    const { container } = render(<CoordinatePlane points={[]} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Repère gradué de −6 à 6 sur les deux axes, une graduation par unité, un nombre écrit sur deux : l’axe des abscisses, horizontal, et l’axe des ordonnées, vertical. Chaque demi-axe porte son signe : « + » à droite et en haut, « − » à gauche et en bas.',
    );
    expect(screen.getByText('axe des abscisses')).toBeInTheDocument();
    expect(screen.getByText('axe des ordonnées')).toBeInTheDocument();
    const ticks = [...container.querySelectorAll('.geo-tick-label')].map((t) => t.textContent);
    // Un nombre sur deux, sur chaque axe : −6, −4… 6.
    expect(ticks).toHaveLength(14);
    expect(ticks).toContain('−6');
    expect(ticks.join()).not.toContain('-');
    expect([...container.querySelectorAll('.geo-sign')].map((t) => t.textContent)).toEqual(['+', '−', '+', '−']);
  });

  it('nomme le point sans lire ses coordonnées', () => {
    const { container } = render(<CoordinatePlane points={[{ name: 'A', x: 4, y: -2 }]} />);
    const label = screen.getByRole('img').getAttribute('aria-label') ?? '';
    expect(label).toContain('Le point A est placé.');
    expect(label).not.toMatch(/\b4\b|−2/);
    expect(container.querySelectorAll('.geo-plot-point')).toHaveLength(1);
    expect(container.querySelectorAll('.geo-sign')).toHaveLength(0);
    expect(container.querySelectorAll('.geo-dash')).toHaveLength(0);
  });
});
