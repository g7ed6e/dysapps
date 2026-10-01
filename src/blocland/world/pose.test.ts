// Le geste de pose (GD-1, point 4, conditions du référent dys) : moins d'une seconde, un seul cran, sans rebond.
import { finDuLogo, GESTE_DE_POSE, gesteFini, hauteurDuGeste } from './pose';

it('le bloc descend en accélérant et s’arrête d’un coup dans sa case, sans remonter', () => {
  expect(GESTE_DE_POSE.dureeMs).toBeLessThan(1000);
  expect(hauteurDuGeste(0)).toBe(GESTE_DE_POSE.hauteur);
  let avant = hauteurDuGeste(0);
  let pas = 0;
  for (let ms = 10; ms <= GESTE_DE_POSE.dureeMs; ms += 10) {
    const h = hauteurDuGeste(ms);
    expect(h).toBeLessThanOrEqual(avant);
    // Il accélère : chaque pas descend plus que le précédent.
    expect(avant - h).toBeGreaterThanOrEqual(pas - 1e-9);
    pas = avant - h;
    avant = h;
  }
  expect(hauteurDuGeste(GESTE_DE_POSE.dureeMs)).toBe(0);
  // Après l'arrêt, plus rien ne bouge : ni rebond ni second cran.
  for (const ms of [400, 600, 2000]) expect(hauteurDuGeste(ms)).toBe(0);
  expect(gesteFini(GESTE_DE_POSE.dureeMs - 1)).toBe(false);
  expect(gesteFini(GESTE_DE_POSE.dureeMs)).toBe(true);
});

it('le logo de l’écran titre est construit en moins d’une seconde', () => {
  expect(finDuLogo()).toBeLessThan(1000);
});
