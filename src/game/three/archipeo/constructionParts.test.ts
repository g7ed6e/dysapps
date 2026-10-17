// Les parties de la construction des lieux du monde continu (GD-20, lot 1) : celles de la grille, mêmes identifiants,
// même ordre, même sauvegarde ; chacune en tranches d'étapes, qui couvrent chaque étape une fois, de bas en haut.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { constructionFacets, WHOLE } from '../../world/continu/construction';
import { PLACES } from '../../world/continu/plan6e';
import { buildHeightField, heightOnMesh } from '../../world/continu/terrain';
import { partiesDe, poserLesParties } from '../../world/parts';
import { textesDe } from '../../../universes';
import { constructionState, mapStateWord, partShapes, placeConstruction, posedShapes, stateWord } from './constructionParts';

const field = buildHeightField();
const ground = (x: number, z: number) => heightOnMesh(field, x, z);

describe('Les parties d’un lieu du monde continu', () => {
  it('autant que dans la grille, dans le même ordre ; chaque étape couverte une fois, en tranches qui se suivent', () => {
    // Le 6e a des lieux à deux (l’Imprimerie, lot L7), trois, quatre et cinq missions : toutes les coupes de GD-14 y sont.
    const counts = new Set<number>();
    for (const p of PLACES) {
      const island = p.island as BiomeId;
      const shapes = partShapes(island);
      expect(shapes).toHaveLength(partiesDe(island).length);
      counts.add(shapes.length);
      for (const stage of [0, 1, 2] as const) {
        const slices = shapes.flat().filter((s) => s.stage === stage);
        expect(slices[0].from).toBe(0);
        expect(slices[slices.length - 1].to).toBe(1);
        for (let k = 1; k < slices.length; k++) expect(slices[k].from).toBeCloseTo(slices[k - 1].to, 9);
      }
      // Toutes les parties posées dessinent la construction entière, ni plus ni moins.
      expect(constructionFacets(p.id, shapes, ground).triangles).toBe(constructionFacets(p.id, [WHOLE], ground).triangles);
    }
    expect([...counts].sort()).toEqual([2, 3, 4, 5]);
  });

  it('une partie posée dans la grille l’est dans le monde continu, et l’état du lieu suit', () => {
    const p = PLACES.find((x) => x.id === 'quais')!;
    const island = p.island as BiomeId;
    expect(constructionState(placeConstruction(island, {}))).toBeNull();
    const one = poserLesParties(island, {}, 1).parts;
    const c1 = placeConstruction(island, one);
    expect(posedShapes(c1)).toEqual([partShapes(island)[0]]);
    expect(constructionState(c1)).toBe('en-chantier');
    const all = poserLesParties(island, one, 99).parts;
    const c = placeConstruction(island, all);
    expect(posedShapes(c)).toHaveLength(partShapes(island).length);
    expect(constructionState(c)).toBe('restauree');
    // Les mêmes objets d'une lecture à l'autre : la scène reconnaît une partie déjà posée.
    expect(posedShapes(placeConstruction(island, all))[0]).toBe(posedShapes(c)[0]);
  });
});

describe('Le mot d’état d’un lieu sur la Carte', () => {
  const archipeo = { fermee: 'Fermée', 'a-explorer': 'À explorer', 'en-chantier': 'En chantier', restauree: 'Restaurée' };
  it('s’accorde au nom du lieu : le Phare restauré, les Quais et les Filets restaurés, les Écluses restaurées', () => {
    const word = (id: string) => stateWord('restauree', archipeo, PLACES.find((p) => p.id === id)!.agree);
    expect(word('phare')).toBe('Restauré');
    expect(word('quais')).toBe('Restaurés');
    expect(word('filets')).toBe('Restaurés');
    expect(word('ecluses')).toBe('Restaurées');
    // « En chantier » ne s'accorde pas.
    expect(stateWord('en-chantier', archipeo, 'fp')).toBe('En chantier');
  });

  it('les Ruines, un nom de site, ne prennent jamais le mot d’achèvement sur la Carte, mais leur geste, accordé ; « En chantier » reste dit (lot L8b)', () => {
    const ruins = PLACES.find((p) => p.id === 'ruins')!;
    expect(mapStateWord(ruins, 'restauree', archipeo)).toBe('Relevées');
    expect(mapStateWord(ruins, 'en-chantier', archipeo)).toBe('En chantier');
    expect(mapStateWord(ruins, null, archipeo)).toBeNull();
    expect(mapStateWord(PLACES.find((p) => p.id === 'ecluses')!, 'restauree', archipeo)).toBe('Restaurées');
  });

  it('les mots d’état des deux univers s’accordent : l’accord repose sur leur « e » final (Restaurée, Bâtie)', () => {
    const agreed = { ms: '', mp: 's', fs: 'e', fp: 'es' } as const;
    for (const univers of ['archipeo', 'blocland'] as const) {
      const words = textesDe(univers).etatsDIle;
      // Un mot d'univers qui ne finirait pas par « e » ne s'accorderait pas en silence : ce test le dirait.
      expect(words.restauree.endsWith('e'), univers).toBe(true);
      const stem = words.restauree.slice(0, -1);
      for (const [agree, end] of Object.entries(agreed)) expect(stateWord('restauree', words, agree as keyof typeof agreed), `${univers} ${agree}`).toBe(stem + end);
    }
    expect(stateWord('restauree', textesDe('blocland').etatsDIle, 'fp')).toBe('Bâties');
  });
});
