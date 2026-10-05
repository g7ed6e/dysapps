// Le logo qui se construit (GD-1, point 4) : le même dessin que public/blocland.svg, en quatre cubes posés en moins
// d'une seconde ; l'écran titre de Blocland le montre, celui d'Archipéo garde son image.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TitleScreen } from '../components/TitleScreen';
import { SettingsProvider } from '../core/SettingsContext';
import { CUBES_DU_LOGO, finDuLogo, LOGO_QUI_SE_CONSTRUIT, AssemblingLogo, MER_DU_LOGO } from './AssemblingLogo';

const rectsDe = (svg: string) =>
  [...svg.matchAll(/<rect\b([^>]*)\/>/g)]
    .map(([, attrs]) => {
      const a = (n: string) => new RegExp(`\\b${n}="([^"]*)"`).exec(attrs)?.[1] ?? '';
      return [a('x') || '0', a('y') || '0', a('width'), a('height'), a('fill'), a('rx')].join(' ');
    })
    .sort();

/** Les rectangles d'un fichier SVG, y compris ceux d'un groupe `<g fill>` (qui leur donne sa couleur). */
function rectsDuFichier(svg: string): string[] {
  const aplati = svg.replace(/<g fill="([^"]+)">(.*?)<\/g>/g, (_, fill: string, inner: string) => inner.replace(/<rect /g, `<rect fill="${fill}" `));
  return rectsDe(aplati);
}

it('dessine exactement le logo de public/blocland.svg, sans un trait changé', () => {
  const fichier = readFileSync(join(process.cwd(), 'public/blocland.svg'), 'utf8');
  const { container } = render(<AssemblingLogo />);
  const dessines = [...container.querySelectorAll('rect')]
    .map((r) => ['x', 'y', 'width', 'height', 'fill', 'rx'].map((n) => r.getAttribute(n) ?? (n === 'x' || n === 'y' ? '0' : '')).join(' '))
    .sort();
  expect(dessines).toEqual(rectsDuFichier(fichier));
});

it('pose quatre cubes sur la mer, le dernier avant une seconde', () => {
  expect(CUBES_DU_LOGO).toHaveLength(LOGO_QUI_SE_CONSTRUIT.cubes);
  expect(LOGO_QUI_SE_CONSTRUIT.cubes).toBeGreaterThanOrEqual(3);
  expect(finDuLogo()).toBeLessThan(1000);
  expect(MER_DU_LOGO.length).toBeGreaterThan(0);
  const { container } = render(<AssemblingLogo />);
  const cubes = [...container.querySelectorAll<SVGGElement>('.logo-cube')];
  expect(cubes.map((g) => g.style.animationDelay)).toEqual(['0ms', '170ms', '340ms', '510ms']);
  // Le logo est une illustration : le lecteur d'écran lit le titre, pas le dessin.
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
});

function renderTitle() {
  return render(
    <SettingsProvider>
      <MemoryRouter initialEntries={['/']}>
        <TitleScreen />
      </MemoryRouter>
    </SettingsProvider>,
  );
}

describe('À l’écran titre', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('Blocland montre le logo qui se construit, et « Jouer » se touche tout de suite', async () => {
    const user = userEvent.setup();
    const { container } = renderTitle();
    expect(container.querySelector('svg.title-logo.title-logo-construit')).toBeInTheDocument();
    expect(container.querySelector('img.title-logo')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Jouer/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Archipéo garde son image', () => {
    localStorage.setItem('dysapps:settings', JSON.stringify({ univers: 'archipeo' }));
    const { container } = renderTitle();
    expect(container.querySelector('img.title-logo')).toHaveAttribute('src', expect.stringContaining('archipeo.svg'));
    expect(container.querySelector('.logo-cube')).not.toBeInTheDocument();
  });
});
