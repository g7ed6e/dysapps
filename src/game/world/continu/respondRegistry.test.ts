// Le registre du monde qui répond se remplit au chargement des fichiers des lieux : la scène et le budget, qui ne les
// importent que par leur chaîne d'imports, doivent trouver les quatre lieux témoins (expert frontend, 30 octobre 2026) ;
// sinon le budget compterait zéro triangle en silence et la scène ne poserait rien.
import { describe, expect, it } from 'vitest';
import './budget';
import { responds, respondTriangles } from './respond';

describe('Le registre du monde qui répond, par le budget seul', () => {
  it.each(['mangrove', 'hameau', 'forge', 'ondes'] as const)('%s répond et coûte des triangles', (place) => {
    expect(responds(place)).toBe(true);
    expect(respondTriangles(place)).toBeGreaterThan(0);
  });
});
