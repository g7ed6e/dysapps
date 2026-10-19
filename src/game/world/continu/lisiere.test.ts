// La Lisière et le dirigeable du 5e (GD-22, lot 4 ; intention du directeur artistique du 19 octobre 2026) : le lieu de
// départ, ses nœuds et sa clairière, la graine géante, la lumière du Phare ; la Nef en trois temps, le gréement déposé,
// le mur de nuages et le panache, le départ par les airs ; leurs coûts sous les plafonds du lot.
import { describe, expect, it } from 'vitest';
import { NEF_SISTERS } from '../nefModels';
import { lisiereCost } from './budget';
import { WORLD_FOG } from './camera';
import { distance, distanceToPolyline } from './geometry';
import { LISIERE_PONTON, LISIERE_SITE, LISIERE_VIEW, PHARE_DARK, PHARE_LIGHT, SEED_AT, phareLightFacets, seedFacets } from './lisiere';
import { levelWorld } from './levelWorld';
import { planFor } from './levelPlan';
import { MONTEE_HEIGHT } from './montee5e';
import type { NefFlight } from './nef';
import { NEF_5E, NEF_5E_DEPARTURE, NEF_5E_TEMPS, NEF_PLUME, NEF_WALL, PLUME_COLORS, RIG_SISTERS, WALL_COLORS, nef5eFlight, nef5eSiteTriangles, nef5eTouched, RIG_SPAN, rigShown, wallFacets, wallSides, wallTouched } from './nef5e';
import { NETWORK_5E } from './paths5e';
import { ANSE_5E, COLORS_5E, DEPARTURE_5E, LISIERE, LISIERE_LEVEL, LISIERE_BUILDINGS, LISIERE_PAVING, NEEDLES_5E, NEF_TAKEOFF_5E, PATH_EDGES_5E, PLATEAU, QUAY_5E, inLisiereClearing, lisiereFloor } from './plan5e';
import { HORIZON_COLOR_5E } from './sky';
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

  it('coûte sous ses plafonds : le modèle, son ber et la bouée 1 900 ; le gréement 150 ; le mur et le panache 700', () => {
    const t = nef5eSiteTriangles();
    expect(t.ber).toBeLessThanOrEqual(150 + 196);
    expect(t.wall + t.plume).toBeLessThanOrEqual(700);
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
    // Le panache, derrière le mur, derrière la brèche.
    expect(NEF_PLUME.z).toBeLessThan(Math.min(...NEF_WALL.map((v) => v.z - v.r)));
    const west = NEF_WALL.find((v) => v.side === -1)!;
    const east = NEF_WALL.find((v) => v.side === 1)!;
    expect(NEF_PLUME.x).toBeGreaterThan(west.x - west.r);
    expect(NEF_PLUME.x).toBeLessThan(east.x);
    // Ses boules grossissent en montant, se chevauchent (aucune arête droite de haut en bas) et penchent vers l'est.
    NEF_PLUME.balls.slice(1).forEach(([y, r, e], i) => {
      const [y0, r0, e0] = NEF_PLUME.balls[i];
      expect(r).toBeGreaterThan(r0);
      expect(y - y0).toBeLessThan(r + r0);
      expect(e).toBeGreaterThanOrEqual(e0);
    });
    expect(wallFacets(30, 30).triangles).toBe(wallFacets().triangles);
  });

  it('un gris froid pour le panache, jamais noir ; une ombre gris-bleu plus sombre que le soleil du mur, moins voilés que le reste', () => {
    for (const c of Object.values(PLUME_COLORS)) expect(lum(c)).toBeGreaterThan(0.15);
    expect(lum(WALL_COLORS.shade)).toBeLessThan(lum(WALL_COLORS.lit) * 0.7);
    const thin = levelWorld('5e').thinFog;
    for (const c of [...Object.values(WALL_COLORS), ...Object.values(PLUME_COLORS)]) expect(thin.find((t) => t.color === c)!.fog, c.toString(16)).toBeLessThan(1);
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
