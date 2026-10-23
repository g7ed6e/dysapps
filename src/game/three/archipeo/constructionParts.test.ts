// Les parties de la construction des lieux du monde continu (GD-20, lot 1) : celles de la grille, mêmes identifiants,
// même ordre, même sauvegarde ; chacune en tranches d'étapes, qui couvrent chaque étape une fois, de bas en haut.
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, retenirReglages } from '../../../core/settings';
import type { BiomeId } from '../../biomes';
import { constructionFacets, WHOLE } from '../../world/continu/construction';
import { PLACES } from '../../world/continu/plan6e';
import { buildHeightField, heightOnMesh } from '../../world/continu/terrain';
import { partiesDe, poserLesParties } from '../../world/parts';
import { textesDe } from '../../../universes';
import { planCells, plansFor } from '../../world/plans';
import { phraseDeLaPose } from '../../poseWords';
import type { OpenPlace } from '../../world/continu/levelPlan';
import { planFor } from '../../world/continu/levelPlan';
import { constructionState, fanalRestored, mapStateWord, ofOpenPlace, partShapes, placeConstruction, posedShapes, stagePoseWords, stateWord } from './constructionParts';

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

  /** Le bilan d'une pose : les parties posées (leur rang), les plans qu'elles finissent (leur rang), la phrase dite. */
  const said = (place: Pick<OpenPlace, 'at' | 'island'>, rangs: number[], finis: number[]) => {
    const island = place.island as BiomeId;
    const parties = partiesDe(island);
    const plans = plansFor(island);
    const pose = { parts: {}, posees: rangs.map((r) => parties[r - 1]), plansFinis: finis.map((k) => plans[k - 1]) };
    return phraseDeLaPose(pose, stagePoseWords(island, place));
  };
  const place5e = (id: string) => places5e.find((p) => p.id === id)!;
  const xp = (place: Pick<OpenPlace, 'island'>, k: number) => plansFor(place.island as BiomeId)[k - 1].reward.xp;

  it('un lieu à trois parties (le Hameau) : chaque partie finit son plan, une seule phrase « Étape finie », sans redite', () => {
    const h = place5e('hameau');
    expect(partiesDe(h.island as BiomeId)).toHaveLength(3);
    expect([1, 2, 3].map((k) => xp(h, k))).toEqual([40, 50, 60]);
    expect(said(h, [1], [1])).toBe('Étape finie : le corps du Hameau. +40 XP.');
    expect(said(h, [2], [2])).toBe('Étape finie : le haut du Hameau. +50 XP.');
    expect(said(h, [3], [3])).toBe('Étape finie : les abords du Hameau. +60 XP.');
    for (const text of [said(h, [1], [1]), said(h, [2], [2]), said(h, [3], [3])]) {
      expect(text).not.toMatch(/Partie posée|fournil|Mie|bâtisseur/);
      for (const plan of plansFor(h.island as BiomeId)) expect(text).not.toContain(plan.done);
    }
  });

  it('un lieu à cinq parties (la Montée) : « Partie posée : le corps de la Montée, 1 sur 2. », puis l’étape finie', () => {
    const m = place5e('montee');
    expect(partiesDe(m.island as BiomeId)).toHaveLength(5);
    expect(said(m, [1], [])).toBe('Partie posée : le corps de la Montée, 1 sur 2.');
    expect(said(m, [2], [1])).toBe(`Étape finie : le corps de la Montée. +${xp(m, 1)} XP.`);
    expect(said(m, [3], [])).toBe('Partie posée : le haut de la Montée, 1 sur 2.');
    expect(said(m, [4], [2])).toBe(`Étape finie : le haut de la Montée. +${xp(m, 2)} XP.`);
    expect(said(m, [5], [3])).toBe(`Étape finie : les abords de la Montée. +${xp(m, 3)} XP.`);
    // Le corps en trois parties (les Radeaux) : 1 sur 3, 2 sur 3, puis fini.
    const r = place5e('radeaux');
    expect(said(r, [1], [])).toBe('Partie posée : le corps des Radeaux, 1 sur 3.');
    expect(said(r, [2], [])).toBe('Partie posée : le corps des Radeaux, 2 sur 3.');
    expect(said(r, [3], [1])).toBe(`Étape finie : le corps des Radeaux. +${xp(r, 1)} XP.`);
  });

  it('un lieu à quatre parties (les Nacelles) : le corps en deux, puis le haut et les abords entiers', () => {
    const n = place5e('nacelles');
    expect(partiesDe(n.island as BiomeId)).toHaveLength(4);
    expect(said(n, [1], [])).toBe('Partie posée : le corps des Nacelles, 1 sur 2.');
    expect(said(n, [2], [1])).toBe(`Étape finie : le corps des Nacelles. +${xp(n, 1)} XP.`);
    expect(said(n, [3], [2])).toBe(`Étape finie : le haut des Nacelles. +${xp(n, 2)} XP.`);
  });

  it('un lieu à deux parties : la seconde pose le haut et les abords, jamais « le haut du corps »', () => {
    // Aucun lieu du 5e n'a deux parties aujourd'hui : l'Imprimerie du 6e en a deux, nommée comme le serait un lieu du 5e.
    const p = PLACES.find((q) => q.id === 'printworks')!;
    expect(partiesDe(p.island as BiomeId)).toHaveLength(2);
    expect(said(p, [1], [1])).toBe(`Étape finie : le corps de l’Imprimerie. +${xp(p, 1)} XP.`);
    expect(said(p, [2], [2, 3])).toBe(`Étapes finies : le haut et les abords de l’Imprimerie. +${xp(p, 2) + xp(p, 3)} XP.`);
    // Posée avant la première (une sauvegarde d'avant GD-6) : rien n'est fini, la partie se dit sans part.
    expect(said(p, [2], [])).toBe('Partie posée : le haut et les abords de l’Imprimerie.');
  });

  it('chaque lieu du 5e, chaque partie : l’étape du lieu, jamais un nom de plan ni « le haut du corps »', () => {
    for (const place of places5e) {
      const island = place.island as BiomeId;
      const names = plansFor(island).map((p) => p.name.toLowerCase());
      partiesDe(island).forEach((_, i) => {
        const text = said(place, [i + 1], []);
        expect(text, place.id).toMatch(/^Partie posée : (le corps|le haut|les abords)( et les abords)? (du |de la |des |de l’)/);
        expect(text, place.id).not.toMatch(/du corps/);
        for (const n of names) expect(text.toLowerCase(), place.id).not.toContain(n);
      });
    }
  });

  it('après un changement d’option, le porche posé en latin reste debout en grec, sans finir la partie (GD-14)', () => {
    const island = 'lca-5e-legends';
    const [abri, porche] = plansFor(island);
    const toutes = (plan: typeof abri) => planCells(plan).map((c) => c.key);
    const parts = { [abri.id]: toutes(abri), [porche.id]: toutes(porche) };
    retenirReglages({ ...DEFAULT_SETTINGS, lca: 'gr' });
    const c = placeConstruction(island, parts);
    expect(c.posed).toEqual([true, false]);
    expect(constructionState(c)).toBe('en-chantier');
    // L'abri entier, puis le porche seul de la deuxième partie (le cercle des conteurs reste en trace).
    expect(posedShapes(c)).toEqual([partShapes(island)[0], [partShapes(island)[1][0]]]);
    expect(posedShapes(c)[1][0].stage).toBe(1);
  });
});

afterEach(() => retenirReglages(null));

describe('La fin des Ferrailleurs, lue au 4e (le pont du Rafiot vide)', () => {
  it('vraie seulement quand toutes les parties du Fanal du 3e sont posées', () => {
    const island = planFor('3e').places.find((p) => p.id === 'fanal')!.island as BiomeId;
    expect(fanalRestored({})).toBe(false);
    const one = poserLesParties(island, {}, 1).parts;
    expect(fanalRestored(one)).toBe(false);
    expect(fanalRestored(poserLesParties(island, one, 99).parts)).toBe(true);
  });
});
