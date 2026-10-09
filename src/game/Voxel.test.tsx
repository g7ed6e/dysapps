// Les icônes de bloc (Voxel.tsx) : ce qui les distingue quand la couleur seule ne suffit pas.
import { render } from '@testing-library/react';
import { BLOC, BLOCKS } from './biomes';
import { BATONS_DU_DESSUS, BlockIcon } from './Voxel';

describe('l’icône de la craie (DA, relecture des captures emc-2, passe 2)', () => {
  it('porte deux bâtons pâles sur le dessus, blanc et rose pâle : unie, l’ardoise se lisait charbon', () => {
    const craie = BLOCKS[BLOC.craie];
    const { container } = render(<BlockIcon top={craie.top} side={craie.side} size={28} />);
    const fonds = [...container.querySelectorAll('polygon')].map((p) => p.getAttribute('fill'));
    expect(craie.batons).toEqual(['#f2efe6', '#eec4c4']);
    for (const c of craie.batons ?? []) expect(fonds).toContain(c);
  });

  it('un bloc sans bâton garde son icône de trois faces', () => {
    const sel = BLOCKS[BLOC.sel];
    const { container } = render(<BlockIcon top={sel.top} side={sel.side} size={28} />);
    expect(container.querySelectorAll('g.cube')).toHaveLength(1);
    expect(container.querySelectorAll('svg > g:not(.cube)')).toHaveLength(0);
  });

  it('ses bâtons tiennent sur le dessus du cube, et ne sont pas parallèles (ni un signe égal, ni une fente)', () => {
    for (const { baton, ombre } of BATONS_DU_DESSUS)
      for (const [x, y] of [...baton, ...ombre]) {
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(1);
        expect(y).toBeGreaterThan(0);
        expect(y).toBeLessThan(1);
      }
    const angle = ({ baton: [a, b] }: (typeof BATONS_DU_DESSUS)[number]) => Math.atan2(b[1] - a[1], b[0] - a[0]);
    expect(Math.abs(angle(BATONS_DU_DESSUS[0]) - angle(BATONS_DU_DESSUS[1]))).toBeGreaterThan(0.3);
  });
});
