// Faire glisser le monde : le seuil entre un toucher et un glissé, le point du sol sous le doigt, le bornage.
import { bornerLeDecalage, choixCommence, estDecale, glisseCommence, pointDuPlan, SEUIL_DU_CHOIX, SEUIL_DU_GLISSE } from './drag';

const E = { minX: 0, maxX: 100, minY: 0, maxY: 60 };

describe('Faire glisser le monde', () => {
  it('un doigt qui bouge de moins de 10 px reste un toucher ; au-delà, c’est un glissé', () => {
    expect(SEUIL_DU_GLISSE).toBe(10);
    expect(glisseCommence(0, 0)).toBe(false);
    expect(glisseCommence(6, 7)).toBe(false);
    expect(glisseCommence(6, 8)).toBe(true);
    expect(glisseCommence(-12, 0)).toBe(true);
  });

  it('le choix du mode « Aménager » ne se glisse qu’au-delà d’un seuil plus grand que la Carte (choix 1b)', () => {
    expect(SEUIL_DU_CHOIX).toBeGreaterThan(SEUIL_DU_GLISSE);
    // Un doigt qui retouche le choix pour le lâcher et bouge de 15 px : un glissé pour la Carte, pas pour le choix.
    expect(glisseCommence(9, 12)).toBe(true);
    expect(choixCommence(9, 12)).toBe(false);
    expect(choixCommence(0, SEUIL_DU_CHOIX)).toBe(true);
  });

  it('le décalage garde la cible au-dessus de l’archipel : arrêt net au bord', () => {
    expect(bornerLeDecalage({ x: 50, z: 30 }, { x: 10, z: -5 }, E)).toEqual({ x: 10, z: -5 });
    expect(bornerLeDecalage({ x: 50, z: 30 }, { x: 80, z: -45 }, E)).toEqual({ x: 50, z: -30 });
    expect(bornerLeDecalage({ x: 50, z: 30 }, { x: -80, z: 45 }, E)).toEqual({ x: -50, z: 30 });
  });

  it('borne en place, sans allocation, quand la sortie est le décalage lui-même', () => {
    const d = { x: 500, z: 0 };
    expect(bornerLeDecalage({ x: 50, z: 30 }, d, E, d)).toBe(d);
    expect(d).toEqual({ x: 50, z: 0 });
  });

  it('une cible déjà hors de l’archipel n’est pas ramenée d’un saut : un décalage nul reste permis', () => {
    expect(bornerLeDecalage({ x: 110, z: 30 }, { x: 0, z: 0 }, E)).toEqual({ x: 0, z: 0 });
    // Vers l'archipel, oui ; plus loin au large, non.
    expect(bornerLeDecalage({ x: 110, z: 30 }, { x: -20, z: 0 }, E)).toEqual({ x: -20, z: 0 });
    expect(bornerLeDecalage({ x: 110, z: 30 }, { x: 5, z: 0 }, E)).toEqual({ x: 0, z: 0 });
  });

  it('dit quand la vue a été déplacée', () => {
    expect(estDecale({ x: 0, z: 0 })).toBe(false);
    expect(estDecale({ x: 0, z: 0.5 })).toBe(true);
  });

  it('le point du sol sous le doigt : là où le rayon coupe le plan, rien vers le ciel ni trop loin', () => {
    expect(pointDuPlan({ x: 0, y: 10, z: 0 }, { x: 1, y: -1, z: 0 }, 0)).toEqual({ x: 10, z: 0 });
    expect(pointDuPlan({ x: 0, y: 10, z: 0 }, { x: 1, y: 0.1, z: 0 }, 0)).toBeNull();
    expect(pointDuPlan({ x: 0, y: 10, z: 0 }, { x: 1, y: -0.01, z: 0 }, 0, 100)).toBeNull();
  });
});
