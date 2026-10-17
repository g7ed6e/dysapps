// La pose d'un aménagement (GD-20, point 4, piste B, lot L0), sur un dessin fait à la main : sa coupe en morceaux, ses
// éléments dans l'ordre de la pose, son demi-tour (le devant de la grille vers le sud), son échelle (l'échelle commune,
// ou la sienne pour la potence de façade), son quart de tour, sa hauteur (au plus bas du sol, sur la surface du lieu, au
// plus haut sur son assise de pierre, ou sur la dalle de la scène), et le cadre de la remise. Les dix-neuf de la table, avec
// leurs vrais dessins, se vérifient du côté de la vue (three/archipeo/amenagements.test.ts), qui les trace. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { screenOf } from './camera';
import { boundsOf } from './facets';
import { placeById } from './plan6e';
import { remisePose, scenetteHabitant, scenetteKeo, scenettePose } from './scenette';
import { standingHeight } from './terrain';
import { AMENAGEMENT_SCALE, AMENAGEMENTS, ASSISE_TRIANGLES, piecesOf, remiseInclude, showsAmenagements, placeAmenagement, remisePosed, remiseStage, type Amenagement, type DrawnObject } from './amenagements';

/** Un triangle tourné vers le haut, de (x, z) à (x + 1, z + 1), à la hauteur y, dans le repère d'un dessin. */
const flat = (x: number, y: number, z: number) => [x, y, z, x + 1, y, z, x, y, z + 1];

/** Un dessin de trois morceaux : un triangle au sol, un à mi-hauteur, un en haut ; son devant (y de la grille, ici z) en 0. */
function drawing(): DrawnObject {
  const positions = new Float32Array([...flat(0, 0, 0), ...flat(1, 1, 0), ...flat(0, 2, 1)]);
  const normals = new Float32Array(positions.length).map((_, i) => (i % 3 === 1 ? 1 : 0));
  const colors = new Float32Array(positions.length).map((_, i) => Math.floor(i / 9) / 2);
  return { positions, normals, colors, marks: [1, 2] };
}

const sample = (over: Partial<Amenagement> = {}): Amenagement => ({ id: 'essai', name: 'l’essai', place: 'quais', kind: 'commande', elements: [[0], [1], [2]], at: { x: 1, z: 2 }, yaw: 0, ...over });

describe('La pose d’un aménagement', () => {
  it('ses morceaux : de marque en marque', () => {
    expect(piecesOf(drawing())).toEqual([
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
    ]);
    expect(piecesOf({ ...drawing(), marks: [] })).toEqual([{ from: 0, to: 3 }]);
  });

  it('ses éléments dans l’ordre de la pose, qui peut réunir des morceaux et changer leur ordre', () => {
    const p = placeAmenagement(sample({ elements: [[2, 0], [1]] }), drawing(), () => 0);
    expect(p.elements).toEqual([
      { from: 0, to: 2 },
      { from: 2, to: 3 },
    ]);
    // Le premier élément commence par le morceau du haut (sa couleur), puis celui du sol.
    expect([p.facets.colors[0], p.facets.colors[9], p.facets.colors[18]]).toEqual([1, 0, 0.5]);
    expect(p.facets.triangles).toBe(3);
  });

  it('centré sur sa place, à l’échelle commune, son devant vers le sud ; tourné de son quart de tour', () => {
    const c = placeById('quais').center;
    const p = placeAmenagement(sample(), drawing(), () => 0);
    const b = boundsOf(p.facets);
    expect((b.min[0] + b.max[0]) / 2).toBeCloseTo(c.x + 1, 5);
    expect((b.min[2] + b.max[2]) / 2).toBeCloseTo(c.z + 2, 5);
    expect(b.max[0] - b.min[0]).toBeCloseTo(2 * AMENAGEMENT_SCALE, 5);
    expect(b.max[1] - b.min[1]).toBeCloseTo(2 * AMENAGEMENT_SCALE, 5);
    // Le devant de la grille (z = 0 du dessin, ses deux premiers morceaux) vient au sud (z du monde le plus grand).
    expect(p.facets.positions[2]).toBeCloseTo(b.max[2], 5);
    // Un quart de tour : la largeur et la profondeur s'échangent, le devant regarde l'est.
    const q = placeAmenagement(sample({ yaw: Math.PI / 2 }), drawing(), () => 0);
    const bq = boundsOf(q.facets);
    expect(bq.max[2] - bq.min[2]).toBeCloseTo(2 * AMENAGEMENT_SCALE, 5);
    expect(q.facets.positions[0]).toBeCloseTo(bq.max[0], 5);
  });

  it('posé au plus bas du sol sous sa forme, ou sur la surface de son lieu au-dessus de son pied', () => {
    const c = placeById('quais').center;
    const slope = (x: number) => 1 + (x - c.x) * 0.1;
    const p = placeAmenagement(sample(), drawing(), (x) => slope(x));
    const b = boundsOf(p.facets);
    expect(b.min[1]).toBeCloseTo(slope(b.min[0]), 5);
    const q = placeAmenagement(sample({ floor: 0.3 }), drawing(), () => -1.5);
    expect(boundsOf(q.facets).min[1]).toBeCloseTo(standingHeight(-1.5) + 0.3, 5);
  });
});

describe('L’assise de pierre, la dalle de la scène, la potence', () => {
  const c = placeById('quais').center;
  const slope = (x: number) => 1 + (x - c.x) * 0.1;

  it('sur une pente, à plat au plus haut du sol sous sa forme, sur une assise qui descend sous le sol au plus bas, posée avec le premier élément', () => {
    const p = placeAmenagement(sample({ assise: true }), drawing(), (x) => slope(x));
    const top = Math.max(...[-1, 1].map((u) => slope(c.x + 1 + u * AMENAGEMENT_SCALE)));
    expect(p.base).toBeCloseTo(top, 5);
    expect(p.assise).toEqual({ from: 0, to: ASSISE_TRIANGLES });
    expect(p.facets.triangles).toBe(3 + ASSISE_TRIANGLES);
    expect(p.elements[0]).toEqual({ from: 0, to: ASSISE_TRIANGLES + 1 });
    const stone = boundsOf({ ...p.facets, positions: p.facets.positions.slice(0, ASSISE_TRIANGLES * 9) });
    expect(stone.max[1]).toBeCloseTo(p.base, 5);
    expect(stone.min[1]).toBeLessThan(slope(stone.min[0]));
    // Sa boîte, sans l'assise : l'objet seul, posé sur elle.
    expect(p.box.min[1]).toBeCloseTo(p.base, 5);
    // Sans assise, rien de plus.
    const q = placeAmenagement(sample(), drawing(), (x) => slope(x));
    expect(q.assise).toBeUndefined();
    expect(q.facets.triangles).toBe(3);
  });

  it('sur la dalle de la scène, à sa hauteur (celle des pieds de l’habitant), juste au-dessus d’elle, sur son assise', () => {
    const p = placeAmenagement(sample({ scene: true }), drawing(), () => 0);
    const h = scenetteHabitant('quais', remisePosed('quais'));
    expect(p.base).toBeGreaterThan(h.y);
    expect(p.base).toBeLessThan(h.y + 0.05);
    expect(p.assise?.to).toBe(ASSISE_TRIANGLES);
  });

  it('à son échelle, si elle en a une (la potence de façade)', () => {
    const p = placeAmenagement(sample({ scale: 1 }), drawing(), () => 0);
    expect(boundsOf(p.facets).max[1] - boundsOf(p.facets).min[1]).toBeCloseTo(2, 5);
  });

  it('le cadre de la remise prend les aménagements du lieu, élargi en x de la marge de ceux qui en demandent une', () => {
    const box = { min: [0, 0, 0], max: [1, 1, 1] };
    const other = { min: [2, 0, -1], max: [3, 2, 0] };
    expect(remiseInclude([{ a: sample(), box }, { a: sample(), box: other }])).toEqual({ min: [0, 0, -1], max: [3, 2, 1] });
    expect(remiseInclude([{ a: sample({ frame: 1.5 }), box }, { a: sample(), box: other }])).toEqual({ min: [-1.5, 0, -1], max: [3, 2, 1] });
    expect(remiseInclude([]).min[0]).toBe(Infinity);
  });
});

describe('Montrés, ou cachés pendant une question', () => {
  it('cachés pendant une question ou une scénette du lieu, et de ses voisins du même cadre ; montrés dans la remise', () => {
    expect(showsAmenagements(null, 'quais', null)).toBe(true);
    expect(showsAmenagements('quais', 'quais', null)).toBe(false);
    expect(showsAmenagements('phare', 'quais', null)).toBe(true);
    // Le rivage nord : les trois lieux voisins, dans le même cadre.
    expect(showsAmenagements('lookout', 'archives', null)).toBe(false);
    expect(showsAmenagements('beacons', 'ferry', null)).toBe(false);
    expect(showsAmenagements('quais', 'quais', 'quais')).toBe(true);
    expect(showsAmenagements('lookout', 'archives', 'lookout')).toBe(false);
  });
});

describe('La remise', () => {
  it('au Phare, au pied de la tour ; ailleurs, au site des missions', () => {
    expect(remisePosed('phare')).toBe(false);
    expect(remisePosed('quais')).toBe(true);
  });

  it('sa scène : celle d’une scénette sans rangée de réponses, sous la consigne', () => {
    for (const [w, h] of [
      [1024, 768],
      [844, 390],
    ] as const) {
      const s = remiseStage(w, h);
      expect(s.right - s.left).toBeGreaterThan(w / 3);
      expect(s.bottom - s.top).toBeGreaterThan(h / 4);
    }
  });

  it('le même regard que la scénette, un peu plus large : l’habitant, Kéo et la boîte de l’aménagement dans la scène', () => {
    const [w, h] = [1024, 768];
    const stage = remiseStage(w, h);
    for (const place of ['quais', 'phare'] as const) {
      const posed = remisePosed(place);
      const hab = scenetteHabitant(place, posed);
      const include = { min: [hab.x + 2, hab.y, hab.z - 1], max: [hab.x + 3.5, hab.y + 1, hab.z] };
      const { pose, shift } = remisePose(place, include, stage, w, h, posed);
      const scenette = scenettePose(place, stage, w, h, posed).pose;
      // Le même angle : la caméra regarde dans la même direction.
      const dir = (p: typeof pose) => {
        const d = [p.target.x - p.position.x, p.target.y - p.position.y, p.target.z - p.position.z];
        const l = Math.hypot(...d);
        return d.map((v) => v / l);
      };
      dir(pose).forEach((v, i) => expect(v).toBeCloseTo(dir(scenette)[i], 5));
      const inStage = (x: number, y: number, z: number) => {
        const o = screenOf(pose, { x, y, z }, w, h);
        return o.x - shift.x >= stage.left - 1 && o.x - shift.x <= stage.right + 1 && o.y - shift.y >= stage.top - 1 && o.y - shift.y <= stage.bottom + 1;
      };
      expect(inStage(hab.x, hab.y + 1, hab.z)).toBe(true);
      const k = scenetteKeo(place, posed).at;
      expect(inStage(k.x, k.y + 0.5, k.z)).toBe(true);
      for (const x of [include.min[0], include.max[0]]) for (const y of [include.min[1], include.max[1]]) for (const z of [include.min[2], include.max[2]]) expect(inStage(x, y, z), `${place} ${x},${y},${z}`).toBe(true);
    }
  });

  it('la table : dix-neuf aménagements, chacun à son lieu', () => {
    expect(AMENAGEMENTS).toHaveLength(19);
  });
});
