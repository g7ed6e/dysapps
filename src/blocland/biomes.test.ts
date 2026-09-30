// Les îles s'écrivent dans docs/contenu/ (Markdown) et arrivent par iles.json : TypeScript ne vérifie plus leur forme,
// ces tests le font.
import { ICONS } from '../components/Icon';
import { byId } from '../programme';
import { BIOME_IDS, BIOMES, BLOCKS } from './biomes';

const MATIERES = ['francais', 'maths', 'anglais', 'lv2'];
const CLASSES = ['6e', '5e', '4e', '3e'];
const CHAMPS_ILE = ['id', 'name', 'module', 'subject', 'classe', 'description', 'block', 'guardian', 'icon', 'creature', 'exercises'];

describe('les îles de docs/contenu/', () => {
  it('sont celles de BiomeId, dans le même ordre', () => {
    expect(BIOMES.map((b) => b.id)).toEqual([...BIOME_IDS]);
  });

  it('ont une matière, une classe, un bloc, une icône et une créature connus', () => {
    for (const b of BIOMES) {
      expect(Object.keys(b), b.id).toEqual(CHAMPS_ILE);
      expect(MATIERES, b.id).toContain(b.subject);
      expect(CLASSES, b.id).toContain(b.classe);
      expect(BLOCKS[b.block], `${b.id} : bloc ${b.block}`).toBeTruthy();
      expect(b.icon in ICONS, `${b.id} : icône ${b.icon}`).toBe(true);
      expect(Object.keys(b.creature)).toEqual(['name']);
      for (const k of ['name', 'module', 'description', 'guardian'] as const) expect(b[k].length, `${b.id} : ${k}`).toBeGreaterThan(0);
    }
  });

  it('ont des missions aux identifiants uniques, qui citent des compétences du programme', () => {
    for (const b of BIOMES) {
      expect(b.exercises.length, b.id).toBeGreaterThan(0);
      expect(new Set(b.exercises.map((m) => m.id)).size, b.id).toBe(b.exercises.length);
      for (const m of b.exercises) {
        expect(m.title.length && m.description.length, `${b.id}, ${m.id}`).toBeTruthy();
        expect(m.programme.length, `${b.id}, ${m.id}`).toBeGreaterThan(0);
        for (const p of m.programme) expect(byId(p), `${b.id}, ${m.id} : compétence ${p}`).toBeTruthy();
        if (m.lv2 !== undefined) {
          expect(['es', 'de'], `${b.id}, ${m.id}`).toContain(m.lv2);
          expect(b.subject, `${b.id}, ${m.id}`).toBe('lv2');
        }
      }
    }
  });
});
