// Les seize habitants du 4e en modèles fixes (concepts validés par le mainteneur le 21 octobre 2026) : un fichier par
// lieu du 4e, lu comme la vue le lit, au plus 8 000 triangles (le plafond du directeur artistique, comme au 5e), texturé
// d'un JPEG, positions quantifiées, à la hauteur d'un habitant une fois mis en place. Le plan du 4e n'est pas encore
// enregistré (`planFor`) : ses seize identifiants, accordés avec son lot 1, sont écrits ici ; la pull request qui
// enregistre le plan les lit dans `planFor('4e').places`.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HABITANT_FILE, habitantFit } from '../../continu/habitants';
import { lireGlbTexture } from './glb';

const DOSSIER = resolve(__dirname, '../../../../../docs/univers/archipeo/personnages/modeles');

const LIEUX_4E = [
  'forge',
  'soute',
  'porte',
  'etalon',
  'gabarit',
  'manufacture',
  'loge',
  'chariot',
  'herbier',
  'roches',
  'jonction',
  'veillee',
  'basilique',
  'terminus',
  'orgues',
  'dynamo',
] as const;

describe('Les habitants du 4e', () => {
  it('chaque lieu du 4e a son habitant : au plus 8 000 triangles, texturé d’un JPEG, positions quantifiées', () => {
    for (const id of LIEUX_4E) {
      const b = readFileSync(resolve(DOSSIER, `4e-habitant-${id}`, HABITANT_FILE));
      const m = lireGlbTexture(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
      const triangles = m.indices.length / 3;
      expect(triangles, id).toBeLessThanOrEqual(8_000);
      expect(triangles, id).toBeGreaterThan(7_500);
      expect(m.image.mimeType, id).toBe('image/jpeg');
      expect([m.image.bytes[0], m.image.bytes[1]], id).toEqual([0xff, 0xd8]);
      const json = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString()) as { extensionsUsed?: string[] };
      expect(json.extensionsUsed, id).toContain('KHR_mesh_quantization');
      expect(habitantFit(m.positions).scale, id).toBeGreaterThan(0);
    }
  });
});
