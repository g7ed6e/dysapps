// Les couleurs peu voilées du 5e et du 4e (levelWorld.ts, `thinFog` ; expert frontend, seconde relecture de la retouche
// du lot 4 du 5e, puis relecture du lot 1 du 4e) : la vue les reconnaît dans le shader du décor à 0,004 près, en
// linéaire, comme la lanterne du 5e, qu'elle laisse sans ombre à tous les niveaux. Une autre couleur du niveau qui
// tomberait aussi près prendrait leur brouillard par accident : aucune ne le fait, ni dans le sol et ce qui y pousse, ni
// dans les lieux, les passages, les chemins, le lieu de départ, la Nef, la pose, la question, la scénette ou la Carte.
import { describe, expect, it, vi } from 'vitest';
import { mapCost4e, mapCost5e, openWorldCost4e, openWorldCost5e } from './budget';
import { FacetBuilder } from './facets';
import { linearRgb } from './geometry';
import { levelWorld } from './levelWorld';
import { TERRAIN_4E } from './plan4e';
import { COLORS_5E, TERRAIN_5E } from './plan5e';
import { buildHeightField4e, tileFacets4e } from './terrain4e';
import { buildHeightField5e, tileFacets5e } from './terrain5e';

/** La tolérance du shader (three/archipeo/scene.ts, `thinFogLines`), canal par canal, en linéaire. */
const TOLERANCE = 0.004;

/** Les couleurs que dessine `draw` (chaque triangle construit pendant son appel). */
function colorsDrawn(draw: () => void): Set<number> {
  const seen = new Set<number>();
  const triangle = FacetBuilder.prototype.triangle;
  const spy = vi.spyOn(FacetBuilder.prototype, 'triangle').mockImplementation(function (this: FacetBuilder, a, b, c, color) {
    seen.add(color);
    triangle.call(this, a, b, c, color);
  });
  try {
    draw();
  } finally {
    spy.mockRestore();
  }
  return seen;
}

/** Les couleurs peu voilées d'un niveau, et la lanterne du 5e, que la vue laisse sans ombre à tous les niveaux. */
const thinOf = (level: '5e' | '4e'): number[] => [...new Set([...levelWorld(level).thinFog.map((t) => t.color), COLORS_5E.lantern])];

/** Les couleurs dessinées à moins de 0,004 d'une couleur peu voilée, sans être l'une d'elles (aucune attendue). */
function tooClose(seen: Set<number>, level: '5e' | '4e' = '5e'): Record<string, string[]> {
  const thin = thinOf(level);
  // Les couleurs peu voilées elles-mêmes sont voulues (la lanterne d'ocre, partout au 5e, se lit comme une lumière).
  const others = [...seen].filter((c) => !thin.includes(c));
  expect(others.length).toBeGreaterThan(10);
  return Object.fromEntries(
    thin.map((t) => {
      const lt = linearRgb(t);
      return [t.toString(16), others.filter((c) => linearRgb(c).every((v, k) => Math.abs(v - lt[k]) < TOLERANCE)).map((c) => c.toString(16))];
    }),
  );
}

/** Aucune couleur trop proche, pour chaque couleur peu voilée. */
const none = (level: '5e' | '4e' = '5e') => Object.fromEntries(thinOf(level).map((t) => [t.toString(16), []]));

describe('les couleurs peu voilées du 5e : aucune autre couleur du 5e à moins de 0,004 de l’une d’elles', () => {
  it('dans tout ce que dessine le monde ouvert, dans chacune de ses vues, et sur la Carte', () => {
    const seen = colorsDrawn(() => {
      for (const view of ['scenette', 'monde', 'depart'] as const) openWorldCost5e(view);
      mapCost5e();
    });
    expect(tooClose(seen)).toEqual(none());
  });

  it('dans chaque tuile du sol et sa forêt, de près et de loin (le budget ne fait que les compter)', () => {
    const field = buildHeightField5e();
    const seen = colorsDrawn(() => {
      for (let tz = 0; tz < TERRAIN_5E.tilesZ; tz++)
        for (let tx = 0; tx < TERRAIN_5E.tilesX; tx++) for (const detail of ['near', 'far'] as const) tileFacets5e(field, tx, tz, detail);
    });
    expect(tooClose(seen)).toEqual(none());
  });
});

describe('les couleurs peu voilées du 4e : aucune autre couleur du 4e à moins de 0,004 de l’une d’elles', () => {
  it('dans tout ce que dessine le monde ouvert, dans ses deux vues, et sur la Carte', () => {
    const seen = colorsDrawn(() => {
      for (const view of ['monde', 'depart'] as const) openWorldCost4e(view);
      mapCost4e();
    });
    expect(tooClose(seen, '4e')).toEqual(none('4e'));
  });

  it('dans chaque tuile du sol et ce qui y pousse, de près et de loin (le budget ne fait que les compter)', () => {
    const field = buildHeightField4e();
    const seen = colorsDrawn(() => {
      for (let tz = 0; tz < TERRAIN_4E.tilesZ; tz++)
        for (let tx = 0; tx < TERRAIN_4E.tilesX; tx++) for (const detail of ['near', 'far'] as const) tileFacets4e(field, tx, tz, detail);
    });
    expect(tooClose(seen, '4e')).toEqual(none('4e'));
  });
});
