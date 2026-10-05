import { ARCHIPELAGO_IDS } from './archipels';
import { couleurDuSol, ENCRE, IVOIRE } from './palette';
import { couleursDuRond, formeDuRond, RAYON_DU_CERNE, RAYON_DU_PLEIN } from './rondAuSol';

/** La luminance relative (WCAG) d'une couleur 0xRRGGBB. */
const contraste = (a: number, b: number) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
};
const luminance = (c: number) => {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin((c >> 16) & 255) + 0.7152 * lin((c >> 8) & 255) + 0.0722 * lin(c & 255);
};

describe('Le rond au sol', () => {
  it.each(['blocs', 'peint'] as const)('%s : quelques triangles, dans la case, un plein et un cerne bien distincts', (style) => {
    const f = formeDuRond(style);
    const n = f.roles.length;
    expect(n % 3).toBe(0);
    expect(f.sommets.length).toBe(n * 2);
    // Quelques triangles : un seul appel de dessin, presque rien à dessiner.
    expect(n / 3).toBeLessThanOrEqual(48);
    // Tout tient dans la case (sous les pieds du bonhomme), le cerne autour du plein.
    for (let i = 0; i < n; i++) {
      const r = Math.hypot(f.sommets[i * 2], f.sommets[i * 2 + 1]);
      expect(r).toBeLessThanOrEqual(RAYON_DU_CERNE + 1e-6);
      if (f.roles[i] === 0) expect(r).toBeLessThanOrEqual(RAYON_DU_PLEIN + 1e-6);
      else expect(r).toBeGreaterThanOrEqual(RAYON_DU_PLEIN - 1e-6);
    }
    expect(RAYON_DU_CERNE).toBeLessThan(0.5);
    // Il se lit par sa forme (un plein clair cerclé de foncé) : un contraste d'au moins 7 entre les deux.
    const [hi, lo] = [luminance(f.plein), luminance(f.cerne)].sort((p, q) => q - p);
    expect((hi + 0.05) / (lo + 0.05)).toBeGreaterThanOrEqual(7);
  });

  it('le monde en blocs : un octogone aux côtés droits ; le monde peint : un rond plus doux', () => {
    expect(formeDuRond('blocs').roles.length / 9).toBe(8);
    expect(formeDuRond('peint').roles.length / 9).toBe(16);
  });

  it('Archipéo : l’ivoire et l’encre de sa palette ; la nuit, l’ivoire se teinte un peu, toujours net sur le cerne et l’herbe', () => {
    for (const a of ARCHIPELAGO_IDS) {
      expect(couleursDuRond('peint', a, 1)).toEqual({ plein: IVOIRE, cerne: ENCRE });
      const nuit = couleursDuRond('peint', a, 0);
      expect(nuit.plein).not.toBe(IVOIRE);
      expect(contraste(nuit.plein, nuit.cerne), a).toBeGreaterThanOrEqual(7);
      expect(contraste(nuit.plein, couleurDuSol(a, 'herbe', 0).dessus), a).toBeGreaterThanOrEqual(3);
      // De jour, sur l'herbe aussi : le cerne foncé le détache.
      expect(contraste(ENCRE, couleurDuSol(a, 'herbe', 1).dessus), a).toBeGreaterThanOrEqual(3);
    }
    // Le monde en blocs garde ses couleurs.
    expect(couleursDuRond('blocs', '6e', 0)).toEqual(couleursDuRond('blocs', '6e', 1));
  });
});
