import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { UNIVERS, UNIVERS_IDS } from './universe';

it('chaque univers a son logo dans public/, et Blocland n’emprunte pas celui d’Archipéo', () => {
  for (const id of UNIVERS_IDS) expect(existsSync(join('public', UNIVERS[id].logo)), id).toBe(true);
  expect(UNIVERS.blocland.logo).not.toBe(UNIVERS.archipeo.logo);
});
