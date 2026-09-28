import { toutConstruit } from '../budget';
import { ARCHIPELAGO_IDS } from '../map';
import { creaturePlacements, guardianPlacements } from '../terrain';
import { bonhommePeint } from './bonhomme';
import { creaturePeinte } from './creaturesPeintes';
import { couleursDesGardiens, fusionDesCreatures, fusionDesGardiens, fusionDuBonhomme, pointDePose, trianglesDeLaFusion } from './fusions';
import { couleursAllumees } from './sentinelle';
import { sentinellePeinte } from './sentinellesPeintes';

const { progress, village } = toutConstruit();

describe('Les personnages fusionnés, archipel par archipel', () => {
  it('pose un personnage au milieu de l’emprise de ses cubes, sur le haut de sa case (repère de Three.js)', () => {
    const p = { id: 'foret' as const, origin: { x: 10, y: 20, z: 3 }, cubes: [0, 1, 2].flatMap((x) => [0, 1].map((y) => ({ x, y, z: 0 }))) };
    expect(pointDePose(p)).toEqual([11.5, 3, 21]);
  });

  for (const a of ARCHIPELAGO_IDS) {
    it(`${a} : chaque créature garde son modèle, son corps et son bras sur deux os, sa boîte de toucher`, () => {
      const places = creaturePlacements(a, village.bridges);
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
      const places = guardianPlacements(a, progress, village.bridges);
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

  it('le bonhomme : un os par pièce, les mêmes que ses pièces', () => {
    const f = fusionDuBonhomme();
    const m = bonhommePeint();
    expect(f.squelette.map((o) => o.nom)).toEqual(m.table.map((p) => p.nom));
    for (let t = 0; t < m.pieces.length; t++) expect(f.os[t * 3 + 2]).toBe(m.pieces[t]);
  });
});
