// L'Imprimerie (lot L7) : son budget de triangles, lieu et traces, et ses feuilles de réponse sans symétrie.
import { describe, expect, it } from 'vitest';
import { FacetBuilder, type Facets } from './facets';
import { linearRgb } from './geometry';
import { modelOfPlace, ruinOf } from './places';
import { placeById } from './plan6e';
import { PAPER_COLOR, PRINTWORKS } from './printworks';
import { answerObjects, placeTrace } from './questionScene';

/** Les sommets d'une couleur (les indices de leurs positions). */
const colorVertices = (f: Facets, color: number) => {
  const [r, g, b] = linearRgb(color);
  const out: number[] = [];
  for (let k = 0; k < f.colors.length; k += 3) if (Math.abs(f.colors[k] - r) < 1e-6 && Math.abs(f.colors[k + 1] - g) < 1e-6 && Math.abs(f.colors[k + 2] - b) < 1e-6) out.push(k);
  return out;
};

describe('L’Imprimerie', () => {
  it('tient sa cible : 1 900 triangles au plus, le lieu entier et toutes ses traces', () => {
    const b = new FacetBuilder();
    const c = placeById('printworks').center;
    for (const t of Object.values(PRINTWORKS.traces)) t.draw(b, { x: c.x, y: 1, z: c.z });
    const place = modelOfPlace('printworks').facets.triangles;
    const traces = b.build().triangles;
    console.log('lieu', place, 'ruine', ruinOf('printworks').triangles, 'traces', traces, 'total', place + traces);
    expect(place + traces).toBeLessThanOrEqual(1900);
  });

  it('ses deux feuilles ont des formes différentes selon leur place : large et basse à gauche, étroite, haute et pendue plus bas à droite', () => {
    const one = (i: number) => {
      const b = new FacetBuilder();
      PRINTWORKS.answer!.object(b, { x: 0, y: 0, z: 0 }, 1, i, 2, false);
      const f = b.build();
      const xs: number[] = [], ys: number[] = [];
      for (let k = 0; k < f.positions.length; k += 3) {
        xs.push(f.positions[k]);
        ys.push(f.positions[k + 1]);
      }
      return { w: Math.max(...xs) - Math.min(...xs), low: Math.min(...ys), tri: f.triangles };
    };
    const [left, right] = [one(0), one(1)];
    expect(left.w).toBeGreaterThan(right.w * 1.5);
    expect(right.low).toBeLessThan(left.low - 0.3);
  });

  it('la presse, vue de la pose, n’est jamais une masse noire : ses faces au sud sont du fer clair, sauf au socle et à la vis (relecture de L7)', () => {
    const f = modelOfPlace('printworks').facets;
    // La presse debout, à l'ouest de l'atelier (x < −3,9 dans le repère du lieu).
    const dark = colorVertices(f, 0x2f3e48).filter((k) => f.positions[k] < -3.9 && f.normals[k + 2] > 0.5);
    const light = colorVertices(f, 0x4a5f6e).filter((k) => f.positions[k] < -3.9 && f.normals[k + 2] > 0.5);
    expect(light.length).toBeGreaterThan(dark.length);
    // Les faces sombres au sud : le socle (sous le plateau, à 0,06 + 0,55) et la vis (sa tige fine, au milieu).
    for (const k of dark) {
      const y = f.positions[k + 1];
      const dx = f.positions[k] - -4.75;
      expect(y <= 0.62 || (Math.abs(dx - 0.08) < 0.08 && y >= 1.15 && y <= 1.87), `${dx} ${y}`).toBe(true);
    }
  });

  it('le papier des feuilles n’est pris que par les feuilles : ni le lieu, ni sa ruine, ni ses traces (la vue l’éclaire sans ombre)', () => {
    expect(colorVertices(answerObjects('printworks', [{ x: 0, y: 0, z: 0 }, { x: 1.5, y: 0, z: 0 }], 1), PAPER_COLOR).length).toBeGreaterThan(0);
    expect(colorVertices(modelOfPlace('printworks').facets, PAPER_COLOR)).toEqual([]);
    expect(colorVertices(ruinOf('printworks'), PAPER_COLOR)).toEqual([]);
    expect(colorVertices(placeTrace('printworks', placeById('printworks').scenes), PAPER_COLOR)).toEqual([]);
  });

  it('le cornet se tourne de profil, le long du mur : son pavillon s’ouvre vers l’est, jamais vers la caméra (relecture de L7)', () => {
    const f = placeTrace('printworks', ['sound-discrimination']);
    // Le fond du pavillon (`copperIn`, sa face ouverte) : sa normale regarde l'est bien plus que le sud.
    const mouth = colorVertices(f, 0x9a5f2e);
    expect(mouth.length).toBeGreaterThan(0);
    for (const k of mouth) expect(f.normals[k]).toBeGreaterThan(2 * Math.abs(f.normals[k + 2]));
  });
});

describe('La scénette de l’Imprimerie', () => {
  it('l’imprimeur, immobile, tient en 360 triangles au plus', () => {
    const b = new FacetBuilder();
    const sphere = (f: FacetBuilder, c: { x: number; y: number; z: number }, r: number, sides: number, rings: number, color: number) => {
      for (let i = 0; i < rings; i++) for (let k = 0; k < sides; k++) {
        const p = [c.x + r, c.y, c.z] as const;
        if (i === 0 || i === rings - 1) f.triangle(p, p, p, color);
        else f.quad(p, p, p, p, color);
      }
    };
    PRINTWORKS.decor(b, { x: 0, y: 0, z: 0 }, { x: 2.6, y: 0, z: 0.25 }, sphere);
    const answers = new FacetBuilder();
    PRINTWORKS.answer!.base(answers, 0, 0, 1, 3, 1, 0);
    for (const i of [0, 1]) PRINTWORKS.answer!.object(answers, { x: i ? 1 : -1, y: 0, z: 1 }, 1, i, 2, i === 1);
    // Le sol de la scène : un pavé et ses trois joints, dix triangles chacun.
    const habitant = b.build().triangles - 40;
    console.log('habitant', habitant, 'corde et feuilles', answers.build().triangles);
    expect(habitant).toBeLessThanOrEqual(360);
  });
});
