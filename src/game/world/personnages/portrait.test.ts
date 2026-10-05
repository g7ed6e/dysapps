import { bonhommePeint } from './bonhomme';
import { creaturePeinte } from './creaturesPeintes';
import { portraitDe } from './portrait';
import { sentinellePeinte } from './sentinellesPeintes';

describe('Le portrait d’un personnage, sans WebGL', () => {
  it('ne garde que les facettes tournées vers l’élève, du fond vers l’avant, dans leur cadre', () => {
    const f = creaturePeinte('french-6e-phonology');
    const p = portraitDe(f);
    expect(p.facettes.length).toBeGreaterThan(f.pieces.length / 4);
    expect(p.facettes.length).toBeLessThan(f.pieces.length);
    const { x, y, largeur, hauteur } = p.cadre;
    for (const q of p.facettes)
      for (const [px, py] of q.points) {
        expect(px).toBeGreaterThanOrEqual(x - 1e-9);
        expect(px).toBeLessThanOrEqual(x + largeur + 1e-9);
        expect(py).toBeGreaterThanOrEqual(y - 1e-9);
        expect(py).toBeLessThanOrEqual(y + hauteur + 1e-9);
      }
    // Debout : plus haut que large, la tête en haut (y vers le bas).
    expect(hauteur).toBeGreaterThan(largeur);
    expect(y).toBeLessThan(-2);
  });

  it('peint des couleurs sûres, et les yeux restent sombres', () => {
    const p = portraitDe(bonhommePeint(), { angle: 0 });
    expect(p.facettes.every((q) => /^#[0-9a-f]{6}$/.test(q.couleur))).toBe(true);
    expect(p.facettes.some((q) => parseInt(q.couleur.slice(1, 3), 16) < 0x30)).toBe(true);
  });

  it('une sentinelle rallumée n’a pas les couleurs d’une éteinte', () => {
    const f = sentinellePeinte('french-6e-phonology');
    const eteinte = portraitDe(f, { allumage: 0 }).facettes.map((q) => q.couleur);
    const allumee = portraitDe(f, { allumage: 1 }).facettes.map((q) => q.couleur);
    expect(allumee).not.toEqual(eteinte);
    expect(allumee).toContain('#ffd866');
  });
});
