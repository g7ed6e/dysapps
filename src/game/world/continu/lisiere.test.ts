// La Lisière et le dirigeable du 5e (GD-22, lot 4 ; intention du directeur artistique du 19 octobre 2026) : le lieu de
// départ, ses nœuds et sa clairière, la graine géante, la lumière du Phare ; la Nef en trois temps, le gréement déposé,
// le mur de nuages et le panache, le départ par les airs ; leurs coûts sous les plafonds du lot.
import { describe, expect, it } from 'vitest';
import { NEF_SISTERS } from '../nefModels';
import { lisiereCost } from './budget';
import { WORLD_FOG, followPose, lookUp, screenOf } from './camera';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { LISIERE_PONTON, LISIERE_SITE, LISIERE_VIEW, PHARE_DARK, PHARE_LIGHT, SEED_AT, phareLightFacets, seedFacets } from './lisiere';
import { levelWorld } from './levelWorld';
import { planFor } from './levelPlan';
import { MONTEE_HEIGHT } from './montee5e';
import type { NefFlight } from './nef';
import { FOLLOW_FAR_5E, NEF_5E, NEF_5E_DEPARTURE, NEF_5E_TEMPS, NEF_PLUME, NEF_WALL, PLUME_COLORS, PLUME_SQUASH, RIG_SISTERS, WALL_COLORS, nef5eFlight, nef5eSiteTriangles, nef5eTouched, RIG_SPAN, rigShown, wallFacets, wallSides, wallTouched } from './nef5e';
import { NETWORK_5E } from './paths5e';
import { ANSE_5E, COLORS_5E, DEPARTURE_5E, LISIERE, LISIERE_LEVEL, LISIERE_BUILDINGS, LISIERE_PAVING, NEEDLES_5E, NEF_TAKEOFF_5E, PATH_EDGES_5E, PLATEAU, QUAY_5E, inLisiereClearing, lisiereFloor } from './plan5e';
import { HORIZON_COLOR_5E } from './sky';
import { modelOfPlace } from './places';
import { portHeading, portTouch } from './port';
import { heightAt5e } from './terrain5e';

const PLAN = planFor('5e');
const montee = PLAN.places.find((p) => p.id === 'montee')!.center;
const at = (id: string) => NETWORK_5E.pathNode(id).at;
const LISIERE_NODES = ['port-quai', 'port-place', 'port-succes', 'port-french', 'port-maths', 'port-english', 'port-chantier'];

describe('La Lisière', () => {
  it('Kéo arrive à son quai, au pied du ponton ; la place, le quai et tous ses nœuds sont pavés, au-dessus du sol', () => {
    const quay = LISIERE.toWorld(...LISIERE_SITE.quaySpot);
    expect(distance(quay, DEPARTURE_5E.at)).toBeLessThan(0.01);
    for (const id of LISIERE_NODES) {
      expect(lisiereFloor(at(id).x, at(id).z), id).not.toBeNull();
      expect(inLisiereClearing(at(id)), id).toBe(true);
    }
    // Les bâtiments ne sont pas pavés : la marche libre les contourne.
    const hall = LISIERE.toWorld((LISIERE_BUILDINGS.x0 + LISIERE_BUILDINGS.x1) / 2, (LISIERE_BUILDINGS.z0 + LISIERE_BUILDINGS.z1) / 2);
    expect(lisiereFloor(hall.x, hall.z)).toBeNull();
  });

  it('le chemin passe par le quai, la place, chaque façade, puis part vers le Hameau', () => {
    const chain = [...LISIERE_NODES, 'lis-1', 'fro-1'];
    for (let i = 0; i < chain.length - 1; i++) expect(PATH_EDGES_5E.some(([a, b]) => (a === chain[i] && b === chain[i + 1]) || (b === chain[i] && a === chain[i + 1])), `${chain[i]}–${chain[i + 1]}`).toBe(true);
    for (const p of PLAN.places) expect(NETWORK_5E.findRoute(NETWORK_5E.atNode('port-quai'), NETWORK_5E.atNode(p.door)).length, p.id).toBeGreaterThan(1);
  });

  it('au quai, la caméra regarde vers la Montée (question 4, décision du 19 octobre 2026)', () => {
    const quay = DEPARTURE_5E.at;
    const toward = Math.atan2(-(montee.x - quay.x), -(montee.z - quay.z));
    const off = Math.atan2(Math.sin(toward - LISIERE_VIEW.yaw), Math.cos(toward - LISIERE_VIEW.yaw));
    // La Montée dans le champ, à gauche du milieu (cap vers la droite : elle reste dans la moitié gauche).
    expect(Math.abs(off)).toBeLessThan(0.45);
    expect(portHeading('quai', LISIERE_SITE, LISIERE_VIEW.yaw)).toBeCloseTo(LISIERE_VIEW.yaw + Math.PI);
  });

  it('le quai et la place, bord à bord, à la même pierre ; le ponton à leur niveau (aucune marche)', () => {
    const { quay, square } = LISIERE_PAVING;
    expect(quay.z0).toBeLessThanOrEqual(square.z1);
    for (const z of [square.z1 - 0.05, square.z1 + 0.05]) {
      const p = LISIERE.toWorld(0, z);
      expect(lisiereFloor(p.x, p.z)).toBe(LISIERE_LEVEL);
    }
    expect(Math.abs(QUAY_5E.deck - LISIERE_LEVEL)).toBeLessThan(0.05);
  });

  it('se touche par ses façades, comme l’Escale', () => {
    expect(portTouch(at('port-french'), LISIERE_SITE)).not.toBeNull();
    expect(portTouch(montee, LISIERE_SITE)).toBeNull();
  });

  it('tient sous ses plafonds : la Lisière 3 800 triangles, la graine 200, la lumière du Phare 30', () => {
    expect(lisiereCost() - seedFacets().triangles - phareLightFacets().triangles).toBeLessThanOrEqual(3800);
    expect(seedFacets().triangles).toBeLessThanOrEqual(200);
    expect(phareLightFacets().triangles).toBeLessThanOrEqual(30);
  });
});

describe('La graine géante et la lumière du Phare', () => {
  it('la graine, dans l’anse, hors des chemins, de la place et du poste de la Nef', () => {
    for (const [a, b] of PATH_EDGES_5E) expect(distanceToPolyline(SEED_AT, [at(a), at(b)]), `${a}–${b}`).toBeGreaterThan(2);
    expect(lisiereFloor(SEED_AT.x, SEED_AT.z)).toBeNull();
    expect(nef5eTouched(SEED_AT)).toBe(false);
    expect(distance(SEED_AT, NEF_5E.berth)).toBeGreaterThan(5);
    // Deux fois haute comme Kéo, environ : ni un arbre, ni un monument.
    const f = seedFacets();
    let top = -Infinity;
    for (let k = 1; k < f.positions.length; k += 3) top = Math.max(top, f.positions[k]);
    expect(top).toBeGreaterThan(2.5);
    expect(top).toBeLessThan(5);
  });

  it('la graine, écartée de la Nef vers la rive du Hameau', () => {
    const hameau = PLAN.places.find((p) => p.id === 'hameau')!.center;
    expect(distance(SEED_AT, NEF_5E.berth)).toBeGreaterThan(8);
    expect(distance(SEED_AT, hameau)).toBeLessThan(distance(NEF_5E.berth, hameau));
  });

  it('la lumière du Phare, au sud-est, en mer, sur la ligne d’horizon : plus large que haute, sur sa tour, à 3:1 du ciel', () => {
    expect(PHARE_LIGHT.x).toBeGreaterThan(DEPARTURE_5E.at.x);
    expect(PHARE_LIGHT.z).toBeGreaterThan(DEPARTURE_5E.at.z);
    expect(heightAt5e(PHARE_LIGHT)).toBeLessThan(0);
    const f = phareLightFacets();
    let [lo, hi, wide] = [Infinity, -Infinity, 0];
    for (let k = 0; k < f.positions.length; k += 3) {
      lo = Math.min(lo, f.positions[k + 1]);
      hi = Math.max(hi, f.positions[k + 1]);
      wide = Math.max(wide, Math.hypot(f.positions[k] - PHARE_LIGHT.x, f.positions[k + 2] - PHARE_LIGHT.z));
    }
    // La tour part de la mer ; le point, sur la mer visible, juste en deçà du brouillard complet du lointain (au-delà, il
    // flottait au-dessus de la ligne où la mer rejoint le ciel).
    expect(lo).toBeLessThan(0);
    const far = distance(PHARE_LIGHT, DEPARTURE_5E.at);
    expect(far).toBeGreaterThan(WORLD_FOG.near);
    expect(far).toBeLessThan(WORLD_FOG.far);
    // Plus large que haute : la largeur du losange de la lumière contre sa hauteur au-dessus de la tour.
    expect(2 * wide).toBeGreaterThan(2 * (hi - PHARE_LIGHT.y));
    expect(hi).toBeLessThan(5);
    // Le liseré sombre contre le ciel du couchant, et la lumière contre lui (référent dys, 3:1).
    expect(contrast(PHARE_DARK, HORIZON_COLOR_5E)).toBeGreaterThanOrEqual(3);
    expect(contrast(COLORS_5E.lantern, PHARE_DARK)).toBeGreaterThanOrEqual(3);
    // Quatre crans de la caméra au quai (un demi-tour) la mettent au milieu de l'image, sur la ligne où la mer rejoint le
    // ciel (la mer au bout du brouillard), la lumière large d'au moins 30 pixels sur 1 024 ; la première vue ne la montre pas.
    const keo = { x: DEPARTURE_5E.at.x, y: LISIERE_LEVEL, z: DEPARTURE_5E.at.z };
    const turned = followPose(keo, 0, undefined, LISIERE_VIEW.yaw + Math.PI);
    const S = (p: { x: number; y: number; z: number }) => screenOf(turned, p, 1024, 768);
    const lantern = linearRgb(COLORS_5E.lantern);
    const xs: number[] = [];
    for (let k = 0; k < f.positions.length; k += 3)
      if (lantern.every((v, c) => Math.abs(f.colors[k + c] - v) < 1e-6)) xs.push(S({ x: f.positions[k], y: f.positions[k + 1], z: f.positions[k + 2] }).x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(30);
    const at = S(PHARE_LIGHT);
    expect(Math.abs(at.x - 512)).toBeLessThan(20);
    const toward = { x: PHARE_LIGHT.x - turned.position.x, z: PHARE_LIGHT.z - turned.position.z };
    const d = Math.hypot(toward.x, toward.z);
    const sea = S({ x: turned.position.x + (toward.x / d) * WORLD_FOG.far, y: 0, z: turned.position.z + (toward.z / d) * WORLD_FOG.far });
    expect(Math.abs(at.y - sea.y)).toBeLessThan(10);
    const first = followPose(keo, 0, undefined, LISIERE_VIEW.yaw);
    expect((PHARE_LIGHT.x - first.position.x) * (first.target.x - first.position.x) + (PHARE_LIGHT.z - first.position.z) * (first.target.z - first.position.z)).toBeLessThan(0);
    // Presque sans brouillard, à la couleur des lanternes.
    const thin = levelWorld('5e').thinFog;
    expect(thin.find((t) => t.color === COLORS_5E.lantern)!.fog).toBeLessThan(0.2);
    expect(thin.find((t) => t.color === PHARE_DARK)!.fog).toBeLessThan(0.2);
    expect(levelWorld('6e').thinFog).toEqual([]);
  });
});

describe('Le dirigeable en trois temps', () => {
  it('ses cinq parties, chacune à un temps : la nacelle et sa lanterne, l’enveloppe et ses cordes, le gouvernail', () => {
    const all = [...NEF_5E_TEMPS[1], ...NEF_5E_TEMPS[2], ...NEF_5E_TEMPS[3]].sort();
    expect(all).toEqual(['ballon', 'coque', 'empennage', 'lanterne', 'suspentes']);
    expect(NEF_5E.form).toBe(2);
  });

  it('le gréement rangé sur le ponton part quand sa sœur arrive, comme la mue de la grille', () => {
    for (const [piece, sister] of Object.entries(RIG_SISTERS)) expect(NEF_SISTERS[2][sister], piece).toBe(piece);
    // Et dans l'autre sens : chaque pièce que le dirigeable reprend du voilier (la coque et la lanterne restent) est au gréement.
    expect(Object.entries(NEF_SISTERS[2]).filter(([part, from]) => part !== from).map(([part]) => part).sort()).toEqual(Object.values(RIG_SISTERS).sort());
    expect(rigShown(1).sort()).toEqual(['mat', 'vergue', 'voile']);
    expect(rigShown(2)).toEqual(['vergue']);
    expect(rigShown(3)).toEqual([]);
    expect(rigShown(4)).toEqual([]);
  });

  it('range le gréement sur le ponton, devant la caméra du quai, jamais entre elle et Kéo ; la Nef levée sur son ber', () => {
    const keo = DEPARTURE_5E.at;
    const yaw = LISIERE_VIEW.yaw;
    const cam = { x: keo.x + 9.7 * Math.sin(yaw), z: keo.z + 9.7 * Math.cos(yaw) };
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    for (const z of [RIG_SPAN.z0, RIG_SPAN.z1])
      for (const dx of [-0.7, 0.55]) {
        const p = ANSE_5E.toWorld(LISIERE_PONTON.x + dx, z);
        expect((p.x - cam.x) * look.x + (p.z - cam.z) * look.z, `${z}`).toBeGreaterThan(9.7);
        expect(distanceToPolyline(p, [cam, keo]), `${z}`).toBeGreaterThan(1);
      }
    expect(NEF_5E.lift.ber).toBeGreaterThanOrEqual(0.8);
  });

  it('a son ber dans l’eau de l’anse, à côté du ponton, loin du quai de Kéo, et une cible large', () => {
    expect(heightAt5e(NEF_5E.berth)).toBeLessThan(0);
    expect(nef5eTouched(NEF_5E.berth)).toBe(true);
    expect(nef5eTouched(DEPARTURE_5E.at)).toBe(false);
    expect(wallTouched(NEF_5E.berth)).toBe(false);
  });

  it('ouvre la fiche de la Nef quand on touche la bouée du ber vide, à l’est du ber (voyage entre niveaux)', () => {
    const l = ANSE_5E.toLocal(NEF_5E.berth);
    expect(nef5eTouched(ANSE_5E.toWorld(l.x + 2.1, l.z))).toBe(true);
    expect(nef5eTouched(ANSE_5E.toWorld(l.x + 4, l.z))).toBe(false);
  });

  it('coûte sous ses plafonds : le modèle, son ber et la bouée 1 900 ; le gréement 150 ; le mur et le panache 800', () => {
    const t = nef5eSiteTriangles();
    expect(t.ber).toBeLessThanOrEqual(150 + 196);
    // 800, plafond définitif (directeur artistique, troisième passe) : le panache monte au-dessus du mur vu du quai, son
    // sommet plat et large (240 triangles), dans l'enveloppe du monde ouvert inchangée.
    expect(t.wall + t.plume).toBeLessThanOrEqual(800);
  });
});

describe('Le mur de nuages et le départ par les airs', () => {
  const needleTop = Math.max(...NEEDLES_5E.map((n) => n.height + PLATEAU.height));

  it('le mur, au nord, en mer, au-delà des aiguilles, plus haut qu’elles et plus bas que la Montée, en cumulus', () => {
    const north = Math.min(...NEEDLES_5E.map((n) => n.at.z));
    for (const v of NEF_WALL) {
      expect(heightAt5e(v)).toBeLessThan(0);
      expect(v.z + v.r).toBeLessThan(north);
      expect(v.h).toBeGreaterThan(needleTop);
      expect(v.h).toBeLessThan(MONTEE_HEIGHT + PLATEAU.height);
      // Un dôme plus large que haut.
      expect(2 * v.r).toBeGreaterThan(v.h);
      expect(wallTouched(v)).toBe(true);
    }
    // Des tailles du simple au double, avec les épaules (0,55 du rayon), et des écarts inégaux.
    const radii = NEF_WALL.flatMap((v) => [v.r, 0.55 * v.r]);
    expect(Math.max(...radii) / Math.min(...radii)).toBeGreaterThanOrEqual(2);
    const gaps = new Set(NEF_WALL.slice(1).map((v, i) => Math.round(v.x - NEF_WALL[i].x)));
    expect(gaps.size).toBeGreaterThan(3);
    // Les deux cumulus de la brèche glissent l'un vers l'ouest, l'autre vers l'est.
    expect(NEF_WALL.filter((v) => v.side === -1)).toHaveLength(1);
    expect(NEF_WALL.filter((v) => v.side === 1)).toHaveLength(1);
    // Le panache, derrière le mur.
    expect(NEF_PLUME.z).toBeLessThan(Math.min(...NEF_WALL.map((v) => v.z - v.r)));
    // Des boules plus larges que hautes, très chevauchées (leurs milieux à moins des deux tiers d'un rayon), qui penchent
    // vers l'est ; au-dessus du pied, aucune plus étroite que celle d'en dessous (aucun étranglement) ; au sommet, plat
    // et large, une boule de chaque côté de la dernière, à sa hauteur, qui la chevauche.
    expect(PLUME_SQUASH).toBeLessThan(1);
    const column = NEF_PLUME.balls;
    column.slice(1).forEach(([y, r, e], i) => {
      const [y0, r0, e0] = column[i];
      expect(y - y0).toBeLessThanOrEqual((2 / 3) * Math.min(r, r0));
      expect(e).toBeGreaterThanOrEqual(e0);
      if (i > 0) expect(r).toBeGreaterThanOrEqual(r0);
    });
    const [ya, ra, ea] = column[column.length - 1];
    for (const [yb, rb, eb] of NEF_PLUME.crown) {
      expect(Math.abs(ya - yb)).toBeLessThan(0.25 * Math.min(ra, rb));
      expect(Math.abs(ea - eb)).toBeGreaterThan(Math.min(ra, rb));
      expect(Math.abs(ea - eb)).toBeLessThan(ra + rb);
    }
    expect(NEF_PLUME.crown.map(([, , e]) => Math.sign(e - ea)).sort()).toEqual([-1, 1]);
    expect(wallFacets(30, 30).triangles).toBe(wallFacets().triangles);
  });

  it('un gris clair et froid pour le panache, jamais noir, son soleil à 15 % au plus de son ombre ; une ombre gris-bleu plus sombre que le soleil du mur, moins voilés que le reste', () => {
    for (const c of Object.values(PLUME_COLORS)) expect(lum(c)).toBeGreaterThan(0.15);
    // Froid : le bleu au-dessus du rouge.
    for (const c of Object.values(PLUME_COLORS)) expect(c & 0xff, c.toString(16)).toBeGreaterThanOrEqual(c >> 16);
    // L'écart soleil et ombre, sur les valeurs à l'écran (la moyenne des trois canaux) : 10 à 15 %.
    const value = (c: number) => ((c >> 16) + ((c >> 8) & 255) + (c & 255)) / 3;
    expect(value(PLUME_COLORS.lit) / value(PLUME_COLORS.side)).toBeGreaterThanOrEqual(1.1);
    expect(value(PLUME_COLORS.lit) / value(PLUME_COLORS.side)).toBeLessThanOrEqual(1.15);
    expect(lum(PLUME_COLORS.side)).toBeLessThan(lum(WALL_COLORS.shade));
    expect(lum(WALL_COLORS.shade)).toBeLessThan(lum(WALL_COLORS.lit) * 0.7);
    const thin = levelWorld('5e').thinFog;
    for (const c of [...Object.values(WALL_COLORS), ...Object.values(PLUME_COLORS)]) expect(thin.find((t) => t.color === c)!.fog, c.toString(16)).toBeLessThan(1);
  });

  it('vu du quai : le panache dépasse le mur, la Nef passe toujours à sa droite, jamais devant lui, et finit dans la moitié est de la brèche', () => {
    // La caméra de l'arrivée au quai, telle que la vue la pose (le regard levé vers le sommet de la Montée).
    const keo = { x: DEPARTURE_5E.at.x, y: LISIERE_LEVEL, z: DEPARTURE_5E.at.z };
    const top = { x: montee.x, y: heightAt5e(montee) + modelOfPlace('montee').top, z: montee.z };
    const pose = followPose(keo, 0, undefined, LISIERE_VIEW.yaw);
    lookUp(pose, top, keo, 1, 768);
    const S = (p: { x: number; y: number; z: number }) => screenOf(pose, p, 1024, 768);
    const fx = pose.target.x - pose.position.x;
    const fz = pose.target.z - pose.position.z;
    const fl = Math.hypot(fx, fz);
    const right = { x: -fz / fl, z: fx / fl };
    /** Le bord gauche et droit, à l'écran, d'une sphère de rayon `r` (à plat). */
    const across = (c: { x: number; y: number; z: number }, r: number) => [S({ x: c.x - right.x * r, y: c.y, z: c.z - right.z * r }).x, S({ x: c.x + right.x * r, y: c.y, z: c.z + right.z * r }).x];
    const all = [...NEF_PLUME.balls, ...NEF_PLUME.crown];
    const balls = all.map(([y, r, e]) => across({ x: NEF_PLUME.x + e, y, z: NEF_PLUME.z }, r));
    const plumeLeft = Math.min(...balls.map((b) => b[0]));
    const plumeRight = Math.max(...balls.map((b) => b[1]));
    const topWidth = Math.max(...balls.slice(NEF_PLUME.balls.length - 1).map((b) => b[1] - b[0]));
    // Le haut du panache, au-dessus du haut des cumulus qui sont devant lui.
    const plumeTop = S({ x: NEF_PLUME.x, y: Math.max(...all.map(([y, r]) => y + PLUME_SQUASH * r)), z: NEF_PLUME.z }).y;
    for (const v of NEF_WALL) {
      const [l, r] = across({ x: v.x, y: v.h, z: v.z }, v.r);
      if (r > plumeLeft && l < plumeRight) expect(plumeTop, `${v.x}`).toBeLessThan(S({ x: v.x, y: v.h, z: v.z }).y - 15);
    }
    // Tout le panache en deçà du bout de la caméra du 5e (expert frontend) : plus loin, il disparaîtrait sans bruit.
    const C = pose.position;
    for (const [y, r, e] of all) expect(Math.hypot(NEF_PLUME.x + e - C.x, y - C.y, NEF_PLUME.z - C.z) + r).toBeLessThan(FOLLOW_FAR_5E);
    // La Nef (7,2 de long : elle fait ainsi les 265 pixels de la capture, sur son ber), à droite du panache à tout instant,
    // d'au moins la largeur de la boule du sommet.
    const LENGTH = 7.2;
    const f: NefFlight = { x: 0, y: 0, z: 0, yaw: 0, shiftX: 0, shiftZ: 0, open: 0 };
    for (let i = 0; i <= 160; i++) {
      nef5eFlight(i / 160, f);
      const dx = (-Math.sin(f.yaw) * LENGTH) / 2;
      const dz = (-Math.cos(f.yaw) * LENGTH) / 2;
      const left = Math.min(S({ x: f.x + dx, y: f.y + 2.3, z: f.z + dz }).x, S({ x: f.x - dx, y: f.y + 2.3, z: f.z - dz }).x);
      expect(left - plumeRight, `${i}`).toBeGreaterThanOrEqual(topWidth);
    }
    // La fin : dans la moitié est de la brèche ouverte (entre son milieu et le bord du cumulus de l'est), à l'écran.
    const opened = NEF_WALL.map((v) => across({ x: v.x + v.side * NEF_5E_DEPARTURE.open, y: 0.6 * v.h, z: v.z - NEF_5E_DEPARTURE.back }, v.r));
    const eastIndex = NEF_WALL.findIndex((v) => v.side === 1);
    const breachRight = opened[eastIndex][0];
    const breachLeft = Math.max(...opened.slice(0, eastIndex).map((b) => b[1]));
    const end = S({ x: f.x, y: f.y + 2.3, z: f.z }).x;
    expect(end).toBeGreaterThan((breachLeft + breachRight) / 2);
    expect(end).toBeLessThan(breachRight);
  });

  it('finit vers 6,2 s : la Nef n’est plus qu’un point (12 pixels) un peu après 5 s, le mur ouvert à 6,24 s ; 8 s au plus', () => {
    const keo = { x: DEPARTURE_5E.at.x, y: LISIERE_LEVEL, z: DEPARTURE_5E.at.z };
    const top = { x: montee.x, y: heightAt5e(montee) + modelOfPlace('montee').top, z: montee.z };
    const pose = followPose(keo, 0, undefined, LISIERE_VIEW.yaw);
    lookUp(pose, top, keo, 1, 768);
    const f: NefFlight = { x: 0, y: 0, z: 0, yaw: 0, shiftX: 0, shiftZ: 0, open: 0 };
    const { seconds, openTo, outOfView, pointBeyond } = NEF_5E_DEPARTURE;
    let point: number = seconds;
    for (let t = 0; t <= seconds; t += 0.05) {
      nef5eFlight(t / seconds, f);
      if (Math.hypot(f.x - pose.position.x, f.y + 2 - pose.position.y, f.z - pose.position.z) > pointBeyond) {
        point = t;
        break;
      }
    }
    const end = Math.min(seconds, Math.max(openTo * seconds, point + outOfView));
    expect(end).toBeGreaterThanOrEqual(6);
    expect(end).toBeLessThanOrEqual(6.5);
  });

  it('ouvre la brèche sommet par sommet : chacun glisse dans le sens de son cumulus', () => {
    const sides = wallSides();
    const closed = wallFacets();
    const open = wallFacets(0, 10);
    expect(sides.length * 3).toBe(closed.positions.length);
    for (let i = 0; i < sides.length; i++) {
      expect(open.positions[3 * i] - closed.positions[3 * i]).toBeCloseTo(10 * sides[i]);
      expect(open.positions[3 * i + 1]).toBe(closed.positions[3 * i + 1]);
    }
    expect(NEF_5E.obstacleSides?.()).toBe(NEF_5E.obstacleSides?.());
  });

  it('monte en biais au ras des cimes, vire au nord, s’ouvre la brèche, passe à l’écart de la Montée et au-delà du mur', () => {
    const f: NefFlight = { x: 0, y: 0, z: 0, yaw: 0, shiftX: 0, shiftZ: 0, open: 0 };
    expect(nef5eFlight(0, f)).toBe(f);
    expect(f.x).toBeCloseTo(NEF_5E.berth.x);
    expect(f.z).toBeCloseTo(NEF_5E.berth.z);
    expect(f.yaw).toBeCloseTo(NEF_5E.berth.yaw);
    expect(f.shiftZ).toBeCloseTo(0);
    expect(f.open).toBeCloseTo(0);
    let lowest = Infinity;
    for (let i = 0; i <= 400; i++) {
      nef5eFlight(i / 400, f);
      lowest = Math.min(lowest, Math.hypot(f.x - montee.x, f.z - montee.z));
      // Au-dessus d'une aiguille, plus haut qu'elle.
      for (const n of NEEDLES_5E) if (Math.hypot(f.x - n.at.x, f.z - n.at.z) < n.radius + 4) expect(f.y, `${i}`).toBeGreaterThan(n.height + PLATEAU.height);
    }
    expect(lowest).toBeGreaterThan(40);
    // Le mur s'ouvre de son début à sa fin, puis ne bouge plus ; la brèche est ouverte quand la Nef y passe.
    nef5eFlight(NEF_5E_DEPARTURE.openFrom, f);
    expect(f.open).toBeCloseTo(0);
    nef5eFlight(NEF_5E_DEPARTURE.openTo, f);
    expect(f.open).toBeCloseTo(NEF_5E_DEPARTURE.open);
    nef5eFlight(1, f);
    expect(f.z).toBeLessThan(Math.min(...NEF_WALL.map((v) => v.z - v.r)) - NEF_5E_DEPARTURE.back);
    expect(f.shiftZ).toBeCloseTo(-NEF_5E_DEPARTURE.back);
    expect(f.open).toBeCloseTo(NEF_5E_DEPARTURE.open);
    const west = NEF_WALL.find((v) => v.side === -1)!;
    const east = NEF_WALL.find((v) => v.side === 1)!;
    expect(f.x).toBeGreaterThan(west.x - NEF_5E_DEPARTURE.open);
    expect(f.x).toBeLessThan(east.x + NEF_5E_DEPARTURE.open);
    expect(NEF_5E_DEPARTURE.seconds).toBeLessThanOrEqual(8);
    expect(NEF_5E.obstacleDone).toBe(NEF_5E_DEPARTURE.openTo);
  });

  it('part sans traverser la forêt : l’envol reste libre d’arbres', () => {
    expect(inLisiereClearing(NEF_TAKEOFF_5E.from)).toBe(true);
    expect(inLisiereClearing({ x: (NEF_TAKEOFF_5E.from.x + NEF_TAKEOFF_5E.to.x) / 2, z: (NEF_TAKEOFF_5E.from.z + NEF_TAKEOFF_5E.to.z) / 2 })).toBe(true);
    expect(inLisiereClearing(NEF_TAKEOFF_5E.to)).toBe(true);
  });
});

/** La luminance relative (WCAG) d'une couleur `0xRRGGBB`, et le contraste de deux couleurs. */
function lum(c: number): number {
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(((c >> 16) & 255) / 255) + 0.7152 * lin(((c >> 8) & 255) / 255) + 0.0722 * lin((c & 255) / 255);
}
function contrast(a: number, b: number): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
