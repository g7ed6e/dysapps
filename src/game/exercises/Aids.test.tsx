import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ClassTable, ColumnOperation, Graph, LongDivision, RuleCard, graphPoints, graphSegment } from './Aids';
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
    // Un petit trait à chaque graduation des deux axes.
    expect(container.querySelectorAll('.graph-axis-tick')).toHaveLength(18);
    // Une graduation par unité : les neuf nombres de x et les neuf de f(x), avec le vrai signe moins.
    const tickNodes = [...container.querySelectorAll('.graph-tick')];
    const ticks = tickNodes.map((t) => t.textContent);
    expect(ticks).toHaveLength(18);
    expect(ticks.filter((t) => t === '0')).toHaveLength(2);
    expect(ticks).toContain('−4');
    expect(ticks.join()).not.toContain('-');
    // Les nombres sont dans les marges, hors du cadre où passent la droite et ses points (rayon 5, trait de 4) : ceux de x
    // sous le cadre (le haut des chiffres, à 21 unités, est à 16 au-dessus de la ligne d'écriture), ceux de f(x) à sa gauche.
    const grid = [...container.querySelectorAll('.graph-grid')].map((l) => ['x1', 'y1', 'x2', 'y2'].map((k) => Number(l.getAttribute(k))));
    const frameLeft = Math.min(...grid.map(([x1, , x2]) => Math.min(x1, x2)));
    const frameBottom = Math.max(...grid.map(([, y1, , y2]) => Math.max(y1, y2)));
    const at = (t: Element, k: string) => Number(t.getAttribute(k));
    const [bottomRow, leftColumn] = [tickNodes.slice(0, 9), tickNodes.slice(9)];
    for (const t of bottomRow) expect(at(t, 'y') - 16).toBeGreaterThan(frameBottom + 5);
    for (const t of leftColumn) {
      expect(t.getAttribute('text-anchor')).toBe('end');
      expect(at(t, 'x')).toBeLessThan(frameLeft - 5);
    }
    expect(container.querySelectorAll('.graph-point')).toHaveLength(4);
    expect(container.querySelectorAll('.graph-line')).toHaveLength(1);
    // Rien d'animé.
    expect(container.querySelector('animate, animateTransform, animateMotion')).toBeNull();
  });
});

describe('Opérations posées', () => {
  it('sont des aides connues de l’écran de calcul', () => {
    expect(AID_COMPONENTS['column-operation']).toBe(ColumnOperation);
    expect(AID_COMPONENTS['long-division']).toBe(LongDivision);
  });

  it('pose l’addition virgule sous virgule, un chiffre par case, le résultat à trouver', () => {
    const { container } = render(<ColumnOperation op="+" rows={['12,5', '3,25']} />);
    screen.getByRole('img', { name: 'Addition posée : 12,5 plus 3,25, virgule sous virgule. Le résultat est à trouver.' });
    const rows = [...container.querySelectorAll('tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent));
    // Le signe, deux chiffres avant la virgule, la virgule, deux chiffres après : chaque colonne garde son rang.
    expect(rows[0]).toEqual(['', '1', '2', ',', '5', '']);
    expect(rows[1]).toEqual(['+', '', '3', ',', '2', '5']);
    expect(rows[2]).toEqual(['', '?']);
    expect(container.querySelector('tr.posee-line')).toBe(container.querySelectorAll('tr')[1]);
    expect(container.querySelector('.posee-note')).toBeNull();
    expect(container.querySelectorAll('.unknown')).toHaveLength(1);
  });

  it('pose une multiplication d’entiers chiffre sous chiffre, avec ses deux lignes à remplir, sans colonne de virgule', () => {
    const { container } = render(<ColumnOperation op="×" rows={['47', '23']} />);
    screen.getByRole('img', {
      name: 'Multiplication posée : 47 fois 23, chiffre sous chiffre. 2 lignes à poser sur ton cahier, la ligne des dizaines décalée d’un rang, avec son 0. Le résultat est à trouver.',
    });
    const trs = [...container.querySelectorAll('tr')];
    const rows = trs.map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent));
    // Quatre colonnes : le produit peut en avoir quatre, et les cases vides ne disent pas combien de chiffres il a.
    expect(rows).toEqual([
      ['', '', '', '4', '7'],
      ['×', '', '', '2', '3'],
      ['', '', '', '', ''],
      ['+', '', '', '', '0'],
      ['', '?'],
    ]);
    expect(trs[2].querySelectorAll('.posee-box')).toHaveLength(4);
    expect(trs[3].querySelectorAll('.posee-box')).toHaveLength(3);
    expect([...container.querySelectorAll('tr.posee-line')]).toEqual([trs[1], trs[3]]);
    expect(container.querySelector('.posee-comma')).toBeNull();
    expect(container.querySelectorAll('.unknown')).toHaveLength(1);
    // Une phrase visible : les cases guident, elles se posent sur le cahier.
    expect(container.querySelector('.posee-note')?.textContent).toBe('Pose ces lignes sur ton cahier.');
  });

  it('ne dessine rien sans nombre à poser', () => {
    const { container } = render(<ColumnOperation op="+" rows={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('pose la division en potence : le dividende, le diviseur, le quotient et le reste à trouver', () => {
    const { container } = render(<LongDivision dividend="624" divisor="6" remainder />);
    screen.getByRole('img', { name: 'Division posée de 624 par 6 : le quotient et le reste sont à trouver.' });
    const [top, bottom] = [...container.querySelectorAll('tr')];
    expect([...top.querySelectorAll('td')].map((td) => td.textContent)).toEqual(['6', '2', '4', '6']);
    expect(top.querySelector('.posee-divisor')?.textContent).toBe('6');
    expect(bottom.querySelector('.posee-quotient')?.textContent).toBe('?');
    expect(bottom.querySelector('.posee-remainder')?.textContent).toBe('reste ?');
    // Le dernier chiffre du dividende, un peu écarté du trait du diviseur.
    expect(top.querySelector('.posee-last')?.textContent).toBe('4');
  });

  it('garde la virgule du dividende dans sa case ; sans reste demandé, rien sous le dividende', () => {
    const { container } = render(<LongDivision dividend="14,4" divisor="4" />);
    screen.getByRole('img', { name: 'Division posée de 14,4 par 4 : le quotient est à trouver.' });
    const top = container.querySelector('tr')!;
    expect([...top.querySelectorAll('td')].map((td) => td.textContent)).toEqual(['1', '4', ',', '4', '4']);
    expect(container.querySelector('.posee-remainder')).toBeNull();
    expect(container.querySelectorAll('.unknown')).toHaveLength(1);
  });
});

describe('RuleCard', () => {
  it('lie la ponctuation haute à son mot : les deux-points ne passent jamais seuls en début de ligne', () => {
    const { container } = render(<RuleCard title="Soustraction posée" lines={['Chiffre du haut trop petit : ajoute 10 en haut.']} />);
    expect(container.querySelector('li')?.textContent).toBe('Chiffre du haut trop petit\u00a0: ajoute 10 en haut.');
  });
});

describe('Tableau de numération par classes', () => {
  it('est une aide connue de l’écran de calcul', () => {
    expect(AID_COMPONENTS['class-table']).toBe(ClassTable);
  });

  const texts = (container: HTMLElement, selector: string) => [...container.querySelectorAll(selector)].map((e) => e.textContent);

  it('range le nombre un chiffre par case, classe par classe, un trait épais devant chaque classe sauf la première', () => {
    const { container } = render(<ClassTable value="1035264" />);
    screen.getByRole('img', { name: 'Tableau de numération par classes : classe des millions, 1 ; classe des mille, 035 ; classe des unités, 264.' });
    expect(texts(container, '.class-name')).toEqual(['millions', 'mille', 'unités']);
    expect(texts(container, '.class-rank')).toEqual(['C', 'D', 'U', 'C', 'D', 'U', 'C', 'D', 'U']);
    expect(texts(container, '.class-digit')).toEqual(['', '', '1', '0', '3', '5', '2', '6', '4']);
    // Une classe par bloc, le trait des classes devant la 2e et la 3e.
    const blocks = [...container.querySelectorAll('.class-block')];
    expect(blocks.map((b) => b.classList.contains('class-start'))).toEqual([false, true, true]);
    expect(blocks.map((b) => b.querySelectorAll('.class-digit').length)).toEqual([3, 3, 3]);
  });

  it('écrit chaque classe en lettres au-dessus de trois cases vides, jusqu’aux milliards', () => {
    const { container } = render(<ClassTable words={['trois', 'quarante', '', 'six cents']} />);
    screen.getByRole('img', {
      name: 'Tableau de numération par classes, à remplir : trois dans la classe des milliards, quarante dans la classe des millions, rien dans la classe des mille, six cents dans la classe des unités.',
    });
    // Chaque mot dans le bloc de sa classe : il ne peut pas passer dans la classe voisine.
    const blocks = [...container.querySelectorAll('.class-block')];
    expect(blocks.map((b) => [b.querySelector('.class-name')!.textContent, b.querySelector('.class-word')!.textContent])).toEqual([
      ['milliards', 'trois'],
      ['millions', 'quarante'],
      ['mille', ''],
      ['unités', 'six cents'],
    ]);
    const boxes = [...container.querySelectorAll('.class-box')];
    expect(boxes).toHaveLength(12);
    expect(boxes.every((td) => td.textContent === '')).toBe(true);
  });
});
