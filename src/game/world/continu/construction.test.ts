// La construction des lieux du monde continu (GD-20, lot 1) : le lieu se rebâtit lui-même. Sa ruine avant toute partie,
// ses trois étapes, coupées en tranches qui se suivent ; ses volumes hors des chemins et sur la terre ; la trace qui
// attend l'étape qui la porte ; la caméra de la pose, du côté de la porte. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { CAMERA_FOV, FOLLOW, screenOf } from './camera';
import { constructionFacets, poseFocus, poseSide, poseView, POSE_DROP, POSE_SECONDS, ruinFacets, stageComplete, traceShown, WHOLE, type PartShape, type Stage } from './construction';
import { boundsOf, type Facets } from './facets';
import { distance } from './geometry';
import { networkSamples, pathNode } from './paths';
import { PLACES, placeById } from './plan6e';
import { modelOfPlace, placePieces, ruinOf } from './places';
import { buildHeightField, heightOnMesh } from './terrain';

const field = buildHeightField();
const ground = (x: number, z: number) => heightOnMesh(field, x, z);
const slice = (stage: Stage, from: number, to: number): PartShape => [{ stage, from, to }];

/** Les points d'un maillage, au sol (x, z). */
const footprint = (f: Facets) => Array.from({ length: f.positions.length / 3 }, (_, k) => ({ x: f.positions[3 * k], z: f.positions[3 * k + 2] }));

describe('Le lieu se rebâtit lui-même', () => {
  it('avant toute partie, une ruine basse ; posé en entier, le lieu entier, ni plus ni moins', () => {
    for (const p of PLACES) {
      const ruin = ruinFacets(p.id, ground);
      expect(ruin.triangles).toBeGreaterThan(20);
      expect(constructionFacets(p.id, [], ground).triangles).toBe(0);
      const whole = constructionFacets(p.id, [WHOLE], ground);
      expect(ruin.triangles + whole.triangles).toBe(modelOfPlace(p.id).facets.triangles);
      // La ruine est plus basse que le lieu rebâti.
      expect(boundsOf(ruinOf(p.id)).max[1]).toBeLessThan(modelOfPlace(p.id).top - 1);
    }
    // Le Phare : le moignon de la tour, au tiers.
    expect(boundsOf(ruinOf('phare')).max[1]).toBeLessThan(modelOfPlace('phare').top / 3);
  });

  it('chaque étape, coupée en deux ou en trois rangées, se pose une fois : rien de dessiné deux fois, rien d’oublié', () => {
    for (const p of PLACES)
      for (const stage of [0, 1, 2] as const) {
        const whole = constructionFacets(p.id, [slice(stage, 0, 1)], ground).triangles;
        expect(whole).toBeGreaterThan(0);
        for (const m of [2, 3]) {
          const cut = Array.from({ length: m }, (_, k) => constructionFacets(p.id, [slice(stage, k / m, (k + 1) / m)], ground).triangles);
          expect(cut.reduce((s, n) => s + n, 0)).toBe(whole);
          // Le corps se coupe en rangées qui ont chacune leurs volumes ; le haut et les abords, en deux.
          if (stage === 0 || m === 2) for (const n of cut) expect(n).toBeGreaterThan(0);
        }
      }
  });

  it('le Phare monte rang par rang ; sa lanterne coiffe le fût, allumée une fois son haut posé', () => {
    const low = boundsOf(constructionFacets('phare', [slice(0, 0, 1 / 3)], ground));
    const high = boundsOf(constructionFacets('phare', [slice(0, 2 / 3, 1)], ground));
    expect(high.max[1]).toBeGreaterThan(low.max[1] + 2);
    const top = boundsOf(constructionFacets('phare', [slice(1, 0, 1)], ground));
    expect(top.max[1]).toBeGreaterThan(high.max[1]);
    // Allumée : la seule note chaude, le jaune de la lampe ; éteinte, la vitre claire.
    const yellow = (f: Facets) => {
      let n = 0;
      for (let k = 0; k < f.colors.length; k += 3) if (f.colors[k] > 0.9 && f.colors[k + 2] < 0.2) n++;
      return n;
    };
    expect(yellow(constructionFacets('phare', [slice(1, 0, 1)], ground, true))).toBeGreaterThan(0);
    expect(yellow(constructionFacets('phare', [slice(1, 0, 1)], ground, false))).toBe(0);
  });

  it('ses volumes restent hors des chemins (Kéo n’y passe jamais au travers), sauf le lieu lui-même autour de sa porte', () => {
    const paths = networkSamples(0.5);
    for (const p of PLACES) {
      const door = pathNode(p.door).at;
      // Les volumes posés loin du centre (jardin, tonneaux, barque, maison de l'éclusier) : à plus d'une unité d'un chemin.
      for (const q of footprint(constructionFacets(p.id, [slice(2, 0, 1)], ground))) {
        if (distance(q, p.center) < 4.5) continue;
        const near = Math.min(...paths.map((s) => distance(s, q)));
        expect(near, `${p.id} ${q.x.toFixed(1)},${q.z.toFixed(1)}`).toBeGreaterThan(1);
      }
      // La porte reste libre.
      for (const q of footprint(modelOfPlace(p.id).facets)) expect(Math.hypot(q.x + p.center.x - door.x, q.z + p.center.z - door.z)).toBeGreaterThan(0.3);
    }
  });

  it('chaque volume du lieu est à une étape (ruine, corps, haut, abords) et à une rangée de 0 à 1', () => {
    for (const p of PLACES) {
      const pieces = placePieces(p.id);
      expect(pieces.some((x) => x.stage === 'ruine')).toBe(true);
      for (const stage of [0, 1, 2] as const) expect(pieces.some((x) => x.stage === stage)).toBe(true);
      for (const x of pieces) {
        expect(x.row).toBeGreaterThanOrEqual(0);
        expect(x.row).toBeLessThan(1);
      }
    }
  });
});

describe('La trace d’une scénette', () => {
  it('attend que l’étape qui la porte soit entièrement posée', () => {
    expect(stageComplete([], 1)).toBe(false);
    expect(stageComplete([slice(1, 0, 0.5)], 1)).toBe(false);
    expect(stageComplete([slice(1, 0, 0.5), slice(1, 0.5, 1)], 1)).toBe(true);
    expect(stageComplete([WHOLE], 2)).toBe(true);
    // Les lampes de la galerie du Phare : avec les abords seulement.
    expect(traceShown('phare', [slice(0, 0, 1), slice(1, 0, 1)], true)).toBe(false);
    expect(traceShown('phare', [WHOLE], true)).toBe(true);
    expect(traceShown('phare', [WHOLE], false)).toBe(false);
    // La porte d'amont des Écluses : avec le haut.
    expect(traceShown('ecluses', [slice(0, 0, 1), slice(1, 0, 1)], true)).toBe(true);
  });
});

describe('La pose d’une partie', () => {
  const SCREENS = [
    { w: 1024, h: 768 },
    { w: 667, h: 375 },
    { w: 844, h: 390 },
  ];

  it('la caméra regarde le lieu entier du côté de sa porte, au champ de la caméra qui suit, au-dessus du sol', () => {
    for (const p of PLACES) {
      const pose = poseView(p.id, ground, { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: CAMERA_FOV, lens: 1 });
      const f = poseFocus(p.id, ground);
      expect(pose.fov).toBe(FOLLOW.fov);
      expect(pose.lens).toBe(0);
      expect(pose.position.y).toBeGreaterThan(f.y);
      // Du côté de la porte (ramené vers le sud, d'où vient la caméra qui suit).
      const door = pathNode(placeById(p.id).door).at;
      const side = poseSide(p.id);
      expect(side.z).toBeGreaterThan(0);
      expect((pose.position.x - f.x) * (door.x - placeById(p.id).center.x) + (pose.position.z - f.z) * (door.z - placeById(p.id).center.z)).toBeGreaterThan(0);
      // Jamais sous le sol entre elle et le lieu.
      for (let t = 0; t <= 1; t += 0.05) {
        const x = pose.position.x + (pose.target.x - pose.position.x) * t;
        const z = pose.position.z + (pose.target.z - pose.position.z) * t;
        const y = pose.position.y + (pose.target.y - pose.position.y) * t;
        expect(y).toBeGreaterThan(ground(x, z));
      }
    }
  });

  it('le lieu entier tient dans l’image, sur tablette comme sur téléphone couché', () => {
    for (const p of PLACES) {
      const pose = poseView(p.id, ground, { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: CAMERA_FOV, lens: 1 });
      const pts = constructionFacets(p.id, [WHOLE], ground).positions;
      for (const { w, h } of SCREENS)
        for (let k = 0; k < pts.length; k += 3) {
          // Sous l'eau (les pieux, la quille de la barque), la mer le cache.
          if (pts[k + 1] < 0) continue;
          const s = screenOf(pose, { x: pts[k], y: pts[k + 1], z: pts[k + 2] }, w, h);
          expect(s.y, `${p.id} ${w}`).toBeGreaterThan(0);
          expect(s.y, `${p.id} ${w}`).toBeLessThan(h);
          expect(s.x, `${p.id} ${w}`).toBeGreaterThan(-w * 0.05);
          expect(s.x, `${p.id} ${w}`).toBeLessThan(w * 1.05);
        }
    }
  });

  it('courte : quelques secondes en tout, une descente de moins d’une seconde', () => {
    const total = POSE_SECONDS.rise + POSE_SECONDS.drop + POSE_SECONDS.look + POSE_SECONDS.back;
    expect(total).toBeLessThanOrEqual(4);
    expect(POSE_SECONDS.drop).toBeLessThan(1);
    expect(POSE_SECONDS.still).toBeLessThanOrEqual(2);
    expect(POSE_DROP).toBeGreaterThan(0);
  });
});
