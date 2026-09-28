import { existsSync } from 'node:fs';
import { UNIVERS, UNIVERS_IDS } from './univers';

it('chaque univers a son logo dans public/, et Blocland n’emprunte pas celui d’Archipéo', () => {
  for (const id of UNIVERS_IDS) expect(existsSync(new URL(`../../public/${UNIVERS[id].logo}`, import.meta.url)), id).toBe(true);
  expect(UNIVERS.blocland.logo).not.toBe(UNIVERS.archipeo.logo);
});
