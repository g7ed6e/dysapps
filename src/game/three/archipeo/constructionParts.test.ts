// Les parties de la construction des lieux du monde continu (GD-20, lot 1) : celles de la grille, mêmes identifiants,
// même ordre, même sauvegarde ; chacune en tranches d'étapes, qui couvrent chaque étape une fois, de bas en haut.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { constructionFacets, WHOLE } from '../../world/continu/construction';
import { PLACES } from '../../world/continu/plan6e';
import { buildHeightField, heightOnMesh } from '../../world/continu/terrain';
import { partiesDe, poserLesParties } from '../../world/parts';
import { textesDe } from '../../../universes';
import { plansFor } from '../../world/plans';
import { planFor } from '../../world/continu/levelPlan';
import { constructionState, mapStateWord, ofOpenPlace, partShapes, placeConstruction, posedShapes, stagePoseWords, stateWord } from './constructionParts';

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

describe('La Montée du 5e (GD-22, lot 3)', () => {
  it('chacune de ses cinq parties pose quelque chose de visible, et toutes ensemble la Montée entière', async () => {
    const { buildHeightField5e, groundOn5e } = await import('../../world/continu/terrain5e');
    const f5 = buildHeightField5e();
    const g5 = (x: number, z: number) => groundOn5e(f5, x, z);
    const shapes = partShapes('maths-5e-signed-numbers' as BiomeId);
    expect(shapes).toHaveLength(5);
    for (const [i, shape] of shapes.entries()) expect(constructionFacets('montee', [shape], g5).triangles, String(i)).toBeGreaterThan(0);
    expect(constructionFacets('montee', shapes, g5).triangles).toBe(constructionFacets('montee', [WHOLE], g5).triangles);
  });
});

describe('Le bilan d’un lieu du 5e nomme l’étape, jamais le plan (directeur du contenu pédagogique, lot 5 du 5e)', () => {
  const places5e = planFor('5e').places;

  it('« du Hameau », « de la Montée », « des Radeaux », « de l’Auberge »', () => {
    const of = (id: string) => ofOpenPlace(places5e.find((p) => p.id === id)!);
    expect(of('hameau')).toBe('du Hameau');
    expect(of('montee')).toBe('de la Montée');
    expect(of('radeaux')).toBe('des Radeaux');
    expect(of('auberge')).toBe('de l’Auberge');
  });

  it('au Hameau : le corps, le haut, les abords ; ni le fournil, ni Mie, ni la réplique d’un plan', () => {
    const hameau = places5e.find((p) => p.id === 'hameau')!;
    const island = hameau.island as BiomeId;
    const words = stagePoseWords(island, hameau);
    const parts = partiesDe(island).map((p) => words.part(p));
    expect(parts).toEqual(['le corps du Hameau', 'le haut du Hameau', 'les abords du Hameau']);
    const done = plansFor(island).map((p) => words.planDone(p));
    expect(done).toEqual(['Étape finie : le corps du Hameau.', 'Étape finie : le haut du Hameau.', 'Étape finie : les abords du Hameau.']);
    for (const text of [...parts, ...done]) {
      expect(text).not.toMatch(/fournil|Mie|bâtisseur/);
      for (const plan of plansFor(island)) expect(text).not.toContain(plan.done);
    }
  });

  it('chaque lieu du 5e : une étape par partie, jamais un nom de plan', () => {
    for (const place of places5e) {
      const island = place.island as BiomeId;
      const words = stagePoseWords(island, place);
      const names = plansFor(island).map((p) => p.name.toLowerCase());
      for (const partie of partiesDe(island)) {
        const said = words.part(partie);
        expect(said, place.id).toMatch(/^(le corps|le haut|les abords) (du |de la |des |de l’)/);
        for (const n of names) expect(said.toLowerCase(), place.id).not.toContain(n);
      }
    }
  });
});
