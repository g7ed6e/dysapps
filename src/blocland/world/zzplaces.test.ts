import { writeFileSync } from 'node:fs';
import { BIOMES, type BiomeId } from '../biomes';
import { archipelagoOfIsland } from './map';
import { avatarHome, islandCenter, placeDoor, questStations } from './terrain';
const P = process.env.NEUF ? ['school', 'trophies', 'assembly'] : ['ecole', 'trophees', 'assemblage'];
it('d', () => {
  const places = BIOMES.filter((b) => archipelagoOfIsland(b.id as BiomeId) === '6e').map((b) => {
    const id = b.id as BiomeId;
    return [id, islandCenter(id), avatarHome(id), questStations(id), ...P.map((p) => placeDoor(p as never, id))];
  });
  writeFileSync(process.env.OUT!, JSON.stringify(places, null, 1));
});
