// La case à compléter reste avec son article, un mot composé ne se coupe pas à son trait d'union : à l'affichage
// seulement (une classe `mot-lie`, une boîte en ligne), le texte ne change pas.
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RichText } from './RichText';

describe('RichText, ce qui ne se coupe pas', () => {
  it('« l’ » et la case à compléter dans un même conteneur insécable', () => {
    const { container } = render(<RichText text="Le fil est en cuivre, parce que ce métal conduit bien l’…" />);
    const kept = container.querySelectorAll('.mot-lie');
    expect(kept).toHaveLength(1);
    expect(kept[0].textContent?.replace(/\s+/g, '')).toBe('l’…');
    expect(kept[0].querySelector('.blank')).not.toBeNull();
    expect(container.textContent?.replace(/\s+/g, ' ')).toContain('conduit bien l’');
  });

  it('un mot composé et une inversion verbe-pronom gardés entiers, sans trait d’union insécable dans le texte', () => {
    const { container } = render(<RichText text="Que soulève-t-il avec le taille-crayon ?" />);
    expect([...container.querySelectorAll('.mot-lie')].map((e) => e.textContent)).toEqual(['soulève-t-il', 'taille-crayon\u00a0?']);
    expect(container.textContent).not.toContain('‑');
    expect(container.textContent).toBe('Que soulève-t-il avec le taille-crayon ?');
  });

  it('« a-t-on », « États-Unis » et « J.-C. » entiers, dans la phrase comme dans une correction', () => {
    const { container } = render(<RichText text="Que a-t-on vu aux États-Unis, en 52 av. J.-C. ?" />);
    expect([...container.querySelectorAll('.mot-lie')].map((e) => e.textContent)).toEqual(['a-t-on', 'États-Unis,', 'J.-C.\u00a0?']);
  });

  it('une fraction à compléter reste une fraction en colonne', () => {
    const { container } = render(<RichText text="Complète 3/… ." />);
    expect(container.querySelector('.frac .blank')).not.toBeNull();
  });
});
