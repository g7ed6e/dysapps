// Les seize habitants du 3e en modèles fixes (concepts validés par le mainteneur, intégrés le 23 octobre 2026) : un
// fichier par lieu du plan du 3e (`planFor('3e')`), lu comme la vue le lit, au plus 8 000 triangles (le plafond du
// directeur artistique, comme au 5e et au 4e), texturé d'un JPEG, positions quantifiées, à la hauteur d'un habitant une
// fois mis en place. Les seize lieux du 3e sont construits (./plan3e.ts, `BUILT_PLACES_3E`) : chacun montre son
// habitant en modèle dans sa scénette, à la place de son pion.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HABITANT_FILE, HABITANT_TRIANGLES_3E, habitantFit, habitantModelName, hasHabitantModel } from '../../continu/habitants';
import { isBuiltPlace3e } from '../../continu/plan3e';
import { planFor } from '../../continu/levelPlan';
import { lireGlbTexture } from './glb';

const DOSSIER = resolve(__dirname, '../../../../../docs/univers/archipeo/personnages/modeles');

describe('Les habitants du 3e', () => {
  it('chaque lieu du 3e a son habitant : au plus 8 000 triangles, texturé d’un JPEG, positions quantifiées', () => {
    const places = planFor('3e').places;
    expect(places).toHaveLength(16);
    for (const { id } of places) {
      const nom = habitantModelName(id);
      expect(nom, id).toBe(`3e-habitant-${id}`);
      expect(isBuiltPlace3e(id), id).toBe(true);
      expect(hasHabitantModel(id), id).toBe(true);
      const b = readFileSync(resolve(DOSSIER, nom, HABITANT_FILE));
      const m = lireGlbTexture(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
      const triangles = m.indices.length / 3;
      expect(triangles, id).toBeLessThanOrEqual(HABITANT_TRIANGLES_3E);
      expect(triangles, id).toBeGreaterThan(7_500);
      expect(m.image.mimeType, id).toBe('image/jpeg');
      expect([m.image.bytes[0], m.image.bytes[1]], id).toEqual([0xff, 0xd8]);
      const json = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString()) as { extensionsUsed?: string[] };
      expect(json.extensionsUsed, id).toContain('KHR_mesh_quantization');
      expect(habitantFit(m.positions).scale, id).toBeGreaterThan(0);
    }
  });
});
