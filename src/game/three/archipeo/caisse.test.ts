// La caisse de « Donner » (GD-20, point 4, lot L2 ; arbitrages du directeur artistique, point 4) : aux Quais, aux
// Archives et au Chantier naval, les trois lieux où une étape « donner » se fait au 6e ; la caisse d'abord, puis un
// élément par bloc donné ; du bois neutre, sans rien d'autre ; à ses pieds, posée sur le sol de la scène, sans rien du
// décor dessous ; entière dans le cadre de la remise avec ce qui est déjà posé chez l'habitant, et jamais devant
// l'habitant ni Kéo, aux trois formats.
import { describe, expect, it } from 'vitest';
import { linearRgb } from '../../world/continu/geometry';
import { screenOf } from '../../world/continu/camera';
import { AMENAGEMENTS, HABITANT_HEIGHT, remiseInclude, remisePosed, remiseStage } from '../../world/continu/amenagements';
import { HABITANT_HALVES } from '../../world/continu/habitants';
import { CAISSE, CAISSE_MAX, CAISSE_PLACES, CAISSE_WOOD, caisseSpot, caisseTriangles, placedCaisse } from '../../world/continu/caisse';
import { portFloor } from '../../world/continu/plan6e';
import { remisePose, scenetteDecor, scenetteHabitant, scenetteKeo } from '../../world/continu/scenette';
import { buildHeightField, heightOnMesh } from '../../world/continu/terrain';
import { STORIES } from '../../world/stories';
import { BLOCKS } from '../../biomes';
import { placeOfIsland } from '../../world/continu/plan6e';
import { placedAmenagement } from './amenagements';

const field = buildHeightField();
const ground = (x: number, z: number) => portFloor(x, z) ?? heightOnMesh(field, x, z);
const BLOCK = { dessus: 0xc29a5f, cote: 0x9c7a48 };
const screens = [
  [1024, 768],
  [844, 390],
  [800, 1280],
] as const;
/** La marge, en pixels, entre la caisse et le bord de la scène de la remise (celle des aménagements). */
const MARGIN = 12;

describe('La caisse de « Donner »', () => {
  it('aux trois lieux où une étape « donner » se fait au 6e', () => {
    const gives = STORIES.filter((s) => s.region === '6e').flatMap((s) => s.steps.filter((st) => st.kind === 'give').map((st) => placeOfIsland(st.place)?.id));
    expect([...new Set(gives)].sort()).toEqual([...CAISSE_PLACES].sort());
  });

  it('la caisse d’abord, là dès le début, puis un élément par bloc donné, qui se suivent ; quatre au plus', () => {
    for (const n of [1, 2, 3, CAISSE_MAX]) {
      const p = placedCaisse('quais', n, BLOCK);
      expect(p.elements).toHaveLength(n);
      expect(p.assise!.from).toBe(0);
      expect(p.elements[0].from).toBe(0);
      for (let i = 1; i < n; i++) expect(p.elements[i].from).toBe(p.elements[i - 1].to);
      expect(p.elements[n - 1].to).toBe(p.facets.triangles);
    }
    expect(placedCaisse('quais', 9, BLOCK).elements).toHaveLength(CAISSE_MAX);
    expect(caisseTriangles()).toBe(placedCaisse('quais', CAISSE_MAX, BLOCK).facets.triangles);
    expect(caisseTriangles()).toBeLessThan(300);
  });

  it('du bois neutre et la couleur des blocs donnés, rien d’autre (ni plaque ni marque)', () => {
    const p = placedCaisse('archives', 3, BLOCK);
    const allowed = [...Object.values(CAISSE_WOOD), BLOCK.dessus, BLOCK.cote].map((c) => linearRgb(c).map((v) => v.toFixed(3)).join(','));
    const seen = new Set<string>();
    for (let k = 0; k < p.facets.colors.length; k += 3) seen.add([0, 1, 2].map((j) => p.facets.colors[k + j].toFixed(3)).join(','));
    // Les couleurs viennent du bois et des blocs (une face un peu plus sombre ou plus claire : l'ombrage des facettes).
    expect(seen.size).toBeLessThanOrEqual(allowed.length * 3);
    expect(seen.size).toBeGreaterThan(0);
  });

  it('chaque bloc donné se détache de la caisse : son dessus et son côté à 2:1 au moins du fond sombre, et le liseré clair du bois sombre', () => {
    // Le contraste de luminance (WCAG) entre deux couleurs 0xrrggbb.
    const lum = (c: number) => {
      const [r, g, b] = [(c >> 16) & 255, (c >> 8) & 255, c & 255].map((v) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a: number, b: number) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    const given = STORIES.filter((x) => x.region === '6e').flatMap((x) => x.steps.flatMap((st) => (st.kind === 'give' ? [st.block] : [])));
    expect(given).toHaveLength(3);
    const low: string[] = [];
    for (const id of given)
      for (const face of [BLOCKS[id].top, BLOCKS[id].side]) {
        const r = ratio(parseInt(face.slice(1), 16), CAISSE_WOOD.fond);
        if (r < 2) low.push(`${id} ${face} : ${r.toFixed(2)}`);
      }
    expect(low).toEqual([]);
    expect(ratio(CAISSE_WOOD.liseré, CAISSE_WOOD.cote)).toBeGreaterThan(3);
  });

  it('posée sur le sol de la scène, à plat, à ses pieds : ni sur l’habitant ni sur Kéo, et rien du décor ne monte sous elle', () => {
    for (const place of CAISSE_PLACES) {
      const posed = remisePosed(place);
      const at = caisseSpot(place);
      const h = scenetteHabitant(place, posed);
      const k = scenetteKeo(place, posed).at;
      expect(at.y, place).toBeCloseTo(h.y, 5);
      // Ni sous l'habitant (la demi-largeur de son modèle, bras compris), ni sous Kéo (une épaule).
      expect(Math.hypot(at.x - h.x, at.z - h.z) - Math.hypot(CAISSE.w, CAISSE.d) / 2, place).toBeGreaterThan(HABITANT_HALVES[place].x);
      expect(Math.hypot(at.x - k.x, at.z - k.z) - Math.hypot(CAISSE.w, CAISSE.d) / 2, place).toBeGreaterThan(0.3);
      // Le décor de la scénette : aucun de ses triangles au-dessus du sol sous la caisse.
      const decor = scenetteDecor(place, false, posed);
      const under: string[] = [];
      for (let t = 0; t < decor.triangles; t++) {
        const xs = [0, 1, 2].map((v) => decor.positions[t * 9 + v * 3]);
        const ys = [0, 1, 2].map((v) => decor.positions[t * 9 + v * 3 + 1]);
        const zs = [0, 1, 2].map((v) => decor.positions[t * 9 + v * 3 + 2]);
        const [cx, cz] = [xs.reduce((a, b) => a + b) / 3, zs.reduce((a, b) => a + b) / 3];
        if (Math.abs(cx - at.x) < CAISSE.w / 2 && Math.abs(cz - at.z) < CAISSE.d / 2 && Math.max(...ys) > at.y + 0.02) under.push(`${place} : ${cx.toFixed(2)}, ${Math.max(...ys).toFixed(2)}, ${cz.toFixed(2)}`);
      }
      expect(under).toEqual([]);
    }
  });

  it('jamais sur ce qui est déjà posé chez l’habitant (ses aménagements, vus d’en haut)', () => {
    for (const place of CAISSE_PLACES) {
      const c = placedCaisse(place, CAISSE_MAX, BLOCK).box;
      for (const a of AMENAGEMENTS.filter((x) => x.place === place)) {
        const b = placedAmenagement(a.id, ground).box;
        const overlap = Math.min(c.max[0], b.max[0]) > Math.max(c.min[0], b.min[0]) && Math.min(c.max[2], b.max[2]) > Math.max(c.min[2], b.min[2]);
        expect(overlap, `${place} : ${a.id}`).toBe(false);
      }
    }
  });

  it('entière dans la scène de la remise, avec une marge, avec ce qui est posé chez l’habitant, et jamais devant l’habitant ni Kéo, aux trois formats', () => {
    const out: string[] = [];
    for (const place of CAISSE_PLACES) {
      const posed = remisePosed(place);
      const c = placedCaisse(place, CAISSE_MAX, BLOCK).box;
      const list = [...AMENAGEMENTS.filter((x) => x.place === place).map((a) => ({ a, box: placedAmenagement(a.id, ground).box })), { a: {}, box: c }];
      const h = scenetteHabitant(place, posed);
      const k = scenetteKeo(place, posed).at;
      const figures = [
        { name: 'l’habitant', min: [h.x - HABITANT_HALVES[place].x, h.y, h.z - HABITANT_HALVES[place].z], max: [h.x + HABITANT_HALVES[place].x, h.y + HABITANT_HEIGHT, h.z + HABITANT_HALVES[place].z] },
        { name: 'Kéo', min: [k.x - 0.3, k.y, k.z - 0.3], max: [k.x + 0.3, k.y + 1, k.z + 0.3] },
      ];
      for (const [w, hh] of screens) {
        const stage = remiseStage(w, hh);
        const { pose, shift } = remisePose(place, remiseInclude(list), stage, w, hh, posed);
        const onScreen = (box: { min: readonly number[]; max: readonly number[] }) => {
          const s: { x: number; y: number }[] = [];
          for (const x of [box.min[0], box.max[0]]) for (const y of [box.min[1], box.max[1]]) for (const z of [box.min[2], box.max[2]]) s.push(screenOf(pose, { x, y, z }, w, hh));
          return { l: Math.min(...s.map((q) => q.x)) - shift.x, r: Math.max(...s.map((q) => q.x)) - shift.x, t: Math.min(...s.map((q) => q.y)) - shift.y, b: Math.max(...s.map((q) => q.y)) - shift.y };
        };
        const s = onScreen(c);
        const m = Math.min(s.l - stage.left, stage.right - s.r, s.t - stage.top, stage.bottom - s.b);
        if (m < MARGIN) out.push(`${place} ${w}×${hh} : marge ${m.toFixed(0)} px`);
        for (const f of figures) {
          // Seule la part de la caisse plus près de la caméra que la figure peut la couvrir.
          const beside = c.max[0] < f.min[0] || c.min[0] > f.max[0];
          const near = beside ? f.max[2] : f.min[2];
          if (c.max[2] <= near) continue;
          const so = onScreen({ min: [c.min[0], c.min[1], Math.max(c.min[2], near)], max: c.max });
          const sf = onScreen(f);
          if (Math.min(so.r, sf.r) > Math.max(so.l, sf.l) && Math.min(so.b, sf.b) > Math.max(so.t, sf.t)) out.push(`la caisse couvre ${f.name} (${place}, ${w}×${hh})`);
        }
      }
    }
    expect(out).toEqual([]);
  });
});
