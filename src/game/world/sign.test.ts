// Le signe de la créature qui se souvient (GD-4, étape 1) : un geste lent et court, une seule bosse, puis l'icône ; avec
// « Réduire les animations », pas de geste, l'icône tout de suite.
import { GESTE_DU_SIGNE, hauteurDuSigne, iconeDuSigneVisible } from './sign';

describe('le geste du signe', () => {
  it('un seul saut lent : rien avant ni après, une bosse douce entre les deux, au plus un demi-bloc', () => {
    const { dureeMs, hauteur } = GESTE_DU_SIGNE;
    expect(dureeMs).toBeGreaterThanOrEqual(1000);
    expect(dureeMs).toBeLessThanOrEqual(2000);
    expect(hauteur).toBeLessThanOrEqual(0.5);
    expect(hauteurDuSigne(-10)).toBe(0);
    expect(hauteurDuSigne(0)).toBe(0);
    expect(hauteurDuSigne(dureeMs)).toBe(0);
    expect(hauteurDuSigne(dureeMs * 5)).toBe(0);
    expect(hauteurDuSigne(dureeMs / 2)).toBeCloseTo(hauteur);
    // Une seule bosse : la hauteur monte, puis descend, sans rebond.
    const pas = Array.from({ length: 41 }, (_, i) => hauteurDuSigne((dureeMs * i) / 40));
    const sommet = pas.indexOf(Math.max(...pas));
    for (let i = 1; i <= sommet; i++) expect(pas[i]).toBeGreaterThanOrEqual(pas[i - 1]);
    for (let i = sommet + 1; i < pas.length; i++) expect(pas[i]).toBeLessThanOrEqual(pas[i - 1]);
  });

  it('l’icône vient après le geste, fixe ; tout de suite sans geste ou avec « Réduire les animations »', () => {
    const debut = 1000;
    expect(iconeDuSigneVisible(debut, debut - 500, false)).toBe(false);
    expect(iconeDuSigneVisible(debut, debut + GESTE_DU_SIGNE.dureeMs / 2, false)).toBe(false);
    expect(iconeDuSigneVisible(debut, debut + GESTE_DU_SIGNE.dureeMs, false)).toBe(true);
    expect(iconeDuSigneVisible(null, 0, false)).toBe(true);
    expect(iconeDuSigneVisible(debut, debut, true)).toBe(true);
  });
});
