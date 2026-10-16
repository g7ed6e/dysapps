// La construction des lieux du monde continu (GD-20, lot 1) : le lieu se rebâtit lui-même. Sa ruine avant toute partie,
// ses trois étapes, coupées en tranches qui se suivent ; ses volumes hors des chemins et sur la terre ; la trace qui
// attend l'étape qui la porte ; la caméra de la pose, du côté de la porte. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { CAMERA_FOV, FOLLOW, screenOf } from './camera';
import { constructionFacets, createPoseRun, fallenFacets, keoSpots, lanternLit, poseFocus, poseSide, poseView, POSE_DROP, POSE_SECONDS, ruinFacets, stageComplete, traceShown, traceStagePosed, WHOLE, type PartShape, type Stage } from './construction';
import { boundsOf, placeFacets, type Facets } from './facets';
import { distance, linearRgb } from './geometry';
import { networkSamples, pathNode } from './paths';
import { PLACES, placeById } from './plan6e';
import { filetsRack, FILETS_RACK, LAMP_COLOR, lanternLight, modelOfPlace, placePieces, ruinOf } from './places';
import { buildHeightField, heightAt, heightOnMesh, landDistance, standingHeight } from './terrain';

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

  it('le Phare monte rang par rang ; sa lanterne coiffe le fût, allumée dès que son haut est posé', () => {
    const low = boundsOf(constructionFacets('phare', [slice(0, 0, 1 / 3)], ground));
    const high = boundsOf(constructionFacets('phare', [slice(0, 2 / 3, 1)], ground));
    expect(high.max[1]).toBeGreaterThan(low.max[1] + 2);
    const top = boundsOf(constructionFacets('phare', [slice(1, 0, 1)], ground));
    expect(top.max[1]).toBeGreaterThan(high.max[1]);
    // La vitre posée est claire ; la lumière, de la seule couleur de la lampe, la recouvre.
    const yellow = (f: Facets) => {
      let n = 0;
      for (let k = 0; k < f.colors.length; k += 3) if (f.colors[k] > 0.9 && f.colors[k + 2] < 0.2) n++;
      return n;
    };
    expect(yellow(constructionFacets('phare', [WHOLE], ground))).toBe(0);
    const light = lanternLight();
    expect(yellow(light)).toBe(light.positions.length / 3);
    const lamp = linearRgb(LAMP_COLOR);
    // À la précision des sommets près : la vue la reconnaît à moins de 0,004 (scene.ts, `unshadedLamp`).
    for (const [i, c] of Array.from(light.colors.slice(0, 3)).entries()) expect(Math.abs(c - lamp[i])).toBeLessThan(1e-6);
    // Plus large que la vitre, qu'elle recouvre.
    const glass = boundsOf(constructionFacets('phare', [slice(1, 1 / 3, 2 / 3)], ground));
    const lit = boundsOf(placeFacets(light, { x: placeById('phare').center.x, y: 0, z: placeById('phare').center.z }));
    expect(lit.max[0] - lit.min[0]).toBeGreaterThan(glass.max[0] - glass.min[0]);
    // Allumée dès que son haut est posé, sa scénette jouée ou non ; pas avant.
    expect(lanternLit([slice(0, 0, 1), slice(1, 0, 1)])).toBe(true);
    expect(lanternLit([slice(0, 0, 1), slice(1, 0, 0.5)])).toBe(false);
    expect(lanternLit([slice(0, 0, 1)])).toBe(false);
  });

  it('la cloche du Phare, tombée au pied de la tour, y reste jusqu’à ce que la galerie la raccroche ; les perches des Filets jusqu’au séchoir', () => {
    const fallen = fallenFacets('phare', [], ground);
    expect(fallen.triangles).toBeGreaterThan(0);
    // Au sol, sur le socle : plus bas que le moignon.
    expect(boundsOf(fallen).max[1] - standingHeight(ground(placeById('phare').center.x, placeById('phare').center.z))).toBeLessThan(1.5);
    expect(fallenFacets('phare', [slice(0, 0, 1), slice(1, 0, 1)], ground).triangles).toBe(fallen.triangles);
    // La galerie posée (la première rangée des abords) la raccroche.
    expect(fallenFacets('phare', [slice(2, 0, 1 / 3)], ground).triangles).toBe(0);
    expect(fallenFacets('phare', [WHOLE], ground).triangles).toBe(0);
    // Les perches du séchoir des Filets, couchées sur le sable, s'en vont quand il se relève ; aux Quais et aux Écluses,
    // rien n'est tombé.
    expect(fallenFacets('filets', [WHOLE.slice(0, 2)], ground).triangles).toBeGreaterThan(0);
    expect(fallenFacets('filets', [slice(2, 0, 0.5)], ground).triangles).toBe(0);
    for (const id of ['quais', 'ecluses'] as const) expect(fallenFacets(id, [], ground).triangles).toBe(0);
  });

  it('aux Marais salants, le sable s’en va quand l’eau entre, rang par rang ; le hangar à sel, sans toit avant, le reçoit avec son haut (lot L5)', () => {
    const c = placeById('saltworks').center;
    // Sur la grève plate : le lieu entier, ruine comprise, à moins d'une unité du sol de son centre.
    const y0 = standingHeight(ground(c.x, c.z));
    expect(boundsOf(ruinOf('saltworks')).max[1]).toBeLessThan(1.3);
    expect(fallenFacets('saltworks', [], ground).triangles).toBeGreaterThan(0);
    const sand = fallenFacets('saltworks', [], ground).triangles;
    // Le premier rang d'eau chasse son sable, le second le reste.
    expect(fallenFacets('saltworks', [slice(0, 0, 0.5)], ground).triangles).toBeLessThan(sand);
    expect(fallenFacets('saltworks', [slice(0, 0, 0.5)], ground).triangles).toBeGreaterThan(0);
    expect(fallenFacets('saltworks', [slice(0, 0, 1)], ground).triangles).toBe(0);
    // Le haut : les murs, puis le toit, au-dessus de la ruine.
    const walls = boundsOf(constructionFacets('saltworks', [slice(1, 0, 0.5)], ground));
    const roof = boundsOf(constructionFacets('saltworks', [slice(1, 0.5, 1)], ground));
    expect(roof.max[1]).toBeGreaterThan(walls.max[1] + 1);
    expect(walls.max[1] - y0).toBeGreaterThan(boundsOf(ruinOf('saltworks')).max[1]);
    // Le hangar se rebâtit sur ses murs ébréchés, au nord de la grille des bassins.
    expect(roof.max[2]).toBeLessThan(c.z - 1);
    for (const p of placePieces('saltworks')) expect(p.stage === 'ruine' || p.until === undefined).toBe(true);
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

  it('le séchoir des Filets est sur le sable, à côté des cabanes, loin de la porte et du chemin ; sa barque aussi, sur le sable', () => {
    const p = placeById('filets');
    const c = Math.cos(p.yaw),
      s = Math.sin(p.yaw);
    const world = (q: { x: number; z: number }) => ({ x: p.center.x + q.x * c + q.z * s, z: p.center.z - q.x * s + q.z * c });
    const sand = (q: { x: number; z: number }) => heightAt(q) > -0.12 && (heightAt(q) < 0.12 || landDistance(q) < 1.3);
    const paths = networkSamples(0.5);
    const door = pathNode(p.door).at;
    for (const post of filetsRack().posts) {
      const q = world(post);
      expect(sand(q), `${post.x},${post.z}`).toBe(true);
      expect(distance(q, door)).toBeGreaterThan(2);
      expect(Math.min(...paths.map((x) => distance(x, q)))).toBeGreaterThan(1);
      // À côté des cabanes : à moins de cinq unités du centre du lieu.
      expect(Math.hypot(post.x, post.z)).toBeLessThan(5);
    }
    expect(FILETS_RACK.bar).toBeGreaterThan(FILETS_RACK.pan.bottom + FILETS_RACK.pan.height);
    // La barque : les points de sa coque, au sol, sur le sable.
    const abords = constructionFacets('filets', [slice(2, 0.5, 1)], ground);
    const hull = footprint(abords).filter((q) => distance(q, world({ x: 3.95, z: 9.3 })) < 2);
    expect(hull.length).toBeGreaterThan(20);
    for (const q of hull) expect(heightAt(q), `${q.x},${q.z}`).toBeGreaterThan(-0.3);
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
  it('attend que l’étape qui la porte soit entièrement posée ; la scénette se joue sur ce qui est bâti', () => {
    expect(traceStagePosed('phare', [slice(0, 0, 1), slice(1, 0, 1)])).toBe(false);
    expect(traceStagePosed('phare', [WHOLE])).toBe(true);
    expect(traceStagePosed('quais', [slice(1, 0, 0.5)])).toBe(false);
    expect(traceStagePosed('quais', [slice(1, 0, 1)])).toBe(true);
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

  it('Kéo, là où il se tient pendant une pose (la porte, ou le retour de sa scénette), entier dans l’image', () => {
    for (const p of PLACES) {
      const pose = poseView(p.id, ground, { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: CAMERA_FOV, lens: 1 });
      const pts = keoSpots(p.id, ground);
      expect(pts.length).toBeGreaterThanOrEqual(24);
      for (const { w, h } of SCREENS)
        for (let k = 0; k < pts.length; k += 3) {
          const q = screenOf(pose, { x: pts[k], y: pts[k + 1], z: pts[k + 2] }, w, h);
          expect(q.x, `${p.id} ${w}`).toBeGreaterThan(0);
          expect(q.x, `${p.id} ${w}`).toBeLessThan(w);
          expect(q.y, `${p.id} ${w}`).toBeGreaterThan(0);
          expect(q.y, `${p.id} ${w}`).toBeLessThan(h);
        }
    }
  });

  it('une pose finit toujours, une fois : à son terme, passée, interrompue par la Carte ou une question, ou par une autre pose', () => {
    const log: string[] = [];
    const run = createPoseRun({
      rise: () => log.push('rise'),
      drop: () => log.push('drop'),
      land: () => log.push('land'),
      turn: () => log.push('turn'),
      back: () => log.push('back'),
      done: () => log.push('done'),
    });
    const count = () => log.filter((x) => x === 'done').length;
    // À son terme.
    run.start(0, false);
    let t = 0;
    while (run.active && t < 20) run.step((t += 0.05));
    expect(count()).toBe(1);
    expect(log).toContain('drop');
    expect(log).toContain('turn');
    expect(t).toBeLessThan(5);
    // Interrompue pendant la descente (la Carte, une question ouverte : la vue appelle `finish`), puis encore : une fois.
    log.length = 0;
    run.start(0, false);
    run.step(POSE_SECONDS.rise + 0.1);
    run.step(POSE_SECONDS.rise + 0.3);
    expect(run.active).toBe(true);
    run.finish();
    run.finish();
    run.step(10);
    expect(count()).toBe(1);
    expect(log.at(-2)).toBe('land');
    expect(run.active).toBe(false);
    // Deux poses d'affilée (deux réussites rapprochées) : la première passe la main, posée, sans dire sa fin ; seule la
    // seconde la dit, à son terme (« Succès débloqué » ne sort pas au milieu de la seconde).
    log.length = 0;
    run.start(0, false);
    run.step(POSE_SECONDS.rise + 0.1);
    run.handOver();
    expect(count()).toBe(0);
    expect(log.at(-1)).toBe('land');
    run.start(1, false);
    t = 1;
    while (run.active && t < 20) {
      run.step((t += 0.05));
      if (run.active) expect(count()).toBe(0);
    }
    expect(count()).toBe(1);
    // Sans pose en cours, passer la main ne fait rien.
    log.length = 0;
    run.handOver();
    expect(log).toEqual([]);
    // Avec « Réduire les animations » : posée tout de suite, finie après un temps.
    log.length = 0;
    run.start(0, true);
    expect(log).toEqual(['land']);
    run.step(POSE_SECONDS.still + 0.01);
    expect(count()).toBe(1);
  });

  it('courte : quelques secondes en tout, une descente de moins d’une seconde', () => {
    const total = POSE_SECONDS.rise + POSE_SECONDS.drop + POSE_SECONDS.look + POSE_SECONDS.back;
    expect(total).toBeLessThanOrEqual(4);
    expect(POSE_SECONDS.drop).toBeLessThan(1);
    expect(POSE_SECONDS.still).toBeLessThanOrEqual(2);
    expect(POSE_DROP).toBeGreaterThan(0);
  });
});
