import { toutConstruit } from '../budget';
import { ARCHIPELAGO_IDS } from '../map';
import { creaturePlacements, guardianPlacements } from '../terrain';
import { bonhommePeint } from './avatar';
import { creaturePeinte } from './paintedCreatures';
import { allumageDuGardien, couleursDesGardiens, fusionDesCreatures, lueursDesGardiens, fusionDesGardiens, fusionDuBonhomme, pointDePose, trianglesDeLaFusion } from './merges';
import { couleursAllumees } from './sentinel';
import { sentinellePeinte } from './paintedSentinels';

const { progress, world: village } = toutConstruit();

describe('Les personnages fusionnés, archipel par archipel', () => {
  it('pose un personnage au milieu de l’emprise de ses cubes, sur le haut de sa case (repère de Three.js)', () => {
    const p = { id: 'french-6e-phonology' as const, origin: { x: 10, y: 20, z: 3 }, cubes: [0, 1, 2].flatMap((x) => [0, 1].map((y) => ({ x, y, z: 0 }))) };
    expect(pointDePose(p)).toEqual([11.5, 3, 21]);
  });

  for (const a of ARCHIPELAGO_IDS) {
    it(`${a} : chaque créature garde son modèle, son corps et son bras sur deux os, sa boîte de toucher`, () => {
      const places = creaturePlacements(a, village.links);
      const f = fusionDesCreatures(places);
      expect(f.plages.map((p) => p.id)).toEqual(places.map((p) => p.id));
      expect(f.squelette).toHaveLength(2 * places.length);
      expect(f.os.length).toBe(trianglesDeLaFusion(f) * 3);
      places.forEach((p, i) => {
        const m = creaturePeinte(p.id);
        const { debut, fin } = f.plages[i];
        expect(fin - debut, p.id).toBe(m.pieces.length);
        const o = pointDePose(p);
        expect(f.squelette[2 * i]).toEqual({ id: p.id, nom: 'corps', parent: -1, pivot: o });
        expect(f.squelette[2 * i + 1].parent).toBe(2 * i);
        // Les sommets sont ceux du modèle, déplacés au point de pose ; le bras et l'outil sur l'os du bras.
        expect(f.positions[debut * 9] - m.positions[0]).toBeCloseTo(o[0], 4);
        expect(f.positions[debut * 9 + 1] - m.positions[1]).toBeCloseTo(o[1], 4);
        expect(f.positions[debut * 9 + 2] - m.positions[2]).toBeCloseTo(o[2], 4);
        for (let t = 0; t < m.pieces.length; t++) {
          const nom = m.table[m.pieces[t]].nom;
          expect(f.os[(debut + t) * 3], `${p.id} ${nom}`).toBe(2 * i + (nom === 'bras' || nom === 'outil' ? 1 : 0));
        }
        const b = f.boites[i].boite;
        expect(b[1]).toBeCloseTo(o[1], 1);
        expect(b[4] - b[1]).toBeGreaterThan(1.5);
      });
    });

    it(`${a} : les Gardiens en sentinelles, éteints, et ce qui s'allume marqué sommet par sommet`, () => {
      const places = guardianPlacements(a, progress, village.links);
      const f = fusionDesGardiens(places);
      expect(f.plages.map((p) => p.id)).toEqual(places.map((p) => p.id));
      expect(Array.from(couleursDesGardiens(f, {}))).toEqual(Array.from(f.colors));
      const allumes = couleursDesGardiens(f, { [places[0].id]: 1 });
      const { debut, fin } = f.plages[0];
      expect(Array.from(allumes.subarray(debut * 9, fin * 9))).toEqual(Array.from(couleursAllumees(sentinellePeinte(places[0].id), 1)));
      expect(Array.from(allumes.subarray(fin * 9))).toEqual(Array.from(f.colors.subarray(fin * 9)));
      places.forEach((p, i) => {
        const m = sentinellePeinte(p.id);
        for (let t = 0; t < m.pieces.length; t++) expect(f.lueur[(f.plages[i].debut + t) * 3]).toBe(m.table[m.pieces[t]].lueur === 'allumage' ? 1 : 0);
      });
    });
  }

  it('ce qui brille la nuit : la lanterne de Fi (verre ambre le jour, lueur la nuit), l’abdomen d’Astra, la braise de Braise', () => {
    const brillent = (a: '3e' | '4e') => {
      const f = fusionDesCreatures(creaturePlacements(a, village.links));
      const ids = new Set<string>();
      f.plages.forEach((p) => {
        for (let v = p.debut * 3; v < p.fin * 3; v++) {
          expect([0, 1]).toContain(f.lueur[v * 4 + 3]);
          if (f.lueur[v * 4 + 3]) ids.add(p.id);
        }
      });
      return { f, ids: [...ids].sort() };
    };
    expect(brillent('3e').ids).toEqual(['french-3e-close-reading', 'maths-3e-functions']);
    expect(brillent('4e').ids).toEqual(['maths-4e-powers']);
    // Le verre de Fi est ambre le jour (sa couleur de sommet) et prend la lueur la nuit (#FFD866 : rouge linéaire 1).
    const { f } = brillent('3e');
    const fi = f.plages.find((p) => p.id === 'maths-3e-functions')!;
    let lueur = false;
    for (let v = fi.debut * 3; v < fi.fin * 3; v++) if (f.lueur[v * 4 + 3] && Math.abs(f.lueur[v * 4] - 1) < 1e-6) lueur = true;
    expect(lueur).toBe(true);
  });

  it('les Gardiens vaincus s’allument (1), les autres restent éteints (0) ; seules la flamme et les veines brillent', () => {
    expect(allumageDuGardien({ beaten: true })).toBe(1);
    expect(allumageDuGardien({ beaten: false })).toBe(0);
    expect(allumageDuGardien({})).toBe(0);
    const places = guardianPlacements('6e', progress, village.links);
    const f = fusionDesGardiens(places);
    expect(lueursDesGardiens(f, {}).every((x) => x === 0)).toBe(true);
    const l = lueursDesGardiens(f, { [places[0].id]: 1 });
    const { debut, fin } = f.plages[0];
    for (let v = 0; v < f.lueur.length; v++) expect(l[v * 4 + 3], `${v}`).toBe(v >= debut * 3 && v < fin * 3 && f.lueur[v] ? 1 : 0);
  });

  it('le fondu ne repeint que le Gardien qui se rallume (seul) : les autres gardent leurs couleurs et leurs lueurs', () => {
    const places = guardianPlacements('6e', progress, village.links);
    const f = fusionDesGardiens(places);
    const [a, b] = places.map((p) => p.id);
    const tout = { [a]: 1, [b]: 1 };
    const couleurs = new Float32Array(f.colors.length);
    const lueurs = new Float32Array((f.colors.length / 3) * 4);
    couleursDesGardiens(f, tout, couleurs);
    lueursDesGardiens(f, tout, lueurs);
    couleursDesGardiens(f, { [a]: 0, [b]: 0 }, couleurs, a);
    lueursDesGardiens(f, { [a]: 0, [b]: 0 }, lueurs, a);
    expect(couleurs).toEqual(couleursDesGardiens(f, { [a]: 0, [b]: 1 }));
    expect(lueurs).toEqual(lueursDesGardiens(f, { [a]: 0, [b]: 1 }));
  });

  it('le bonhomme : un os par pièce, les mêmes que ses pièces', () => {
    const f = fusionDuBonhomme();
    const m = bonhommePeint();
    expect(f.squelette.map((o) => o.nom)).toEqual(m.table.map((p) => p.nom));
    for (let t = 0; t < m.pieces.length; t++) expect(f.os[t * 3 + 2]).toBe(m.pieces[t]);
  });
});
