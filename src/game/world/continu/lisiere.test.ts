// La Lisière et le dirigeable du 5e (GD-22, lot 4 ; intention du directeur artistique du 19 octobre 2026) : le lieu de
// départ, ses nœuds et sa clairière, la graine géante, la lumière du Phare ; la Nef en trois temps, le gréement déposé,
// le mur de nuages et le panache, le départ par les airs ; leurs coûts sous les plafonds du lot.
import { describe, expect, it } from 'vitest';
import { NEF_SISTERS } from '../nefModels';
import { lisiereCost } from './budget';
import { distance, distanceToPolyline } from './geometry';
import { LISIERE_SITE, LISIERE_VIEW, PHARE_LIGHT, SEED_AT, phareLightFacets, seedFacets } from './lisiere';
import { planFor } from './levelPlan';
import { MONTEE_HEIGHT } from './montee5e';
import type { NefFlight } from './nef';
import { NEF_5E, NEF_5E_DEPARTURE, NEF_5E_TEMPS, NEF_PLUME, NEF_WALL, RIG_SISTERS, nef5eFlight, nef5eSiteTriangles, nef5eTouched, rigShown, wallFacets, wallTouched } from './nef5e';
import { NETWORK_5E } from './paths5e';
import { DEPARTURE_5E, LISIERE, LISIERE_BUILDINGS, NEEDLES_5E, PATH_EDGES_5E, PLATEAU, inLisiereClearing, lisiereFloor } from './plan5e';
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

  it('la lumière du Phare, au sud-est, en mer, au ras de l’horizon', () => {
    expect(PHARE_LIGHT.x).toBeGreaterThan(DEPARTURE_5E.at.x);
    expect(PHARE_LIGHT.z).toBeGreaterThan(DEPARTURE_5E.at.z);
    expect(heightAt5e(PHARE_LIGHT)).toBeLessThan(0);
    expect(PHARE_LIGHT.y).toBeLessThan(10);
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

  it('le mur, au nord, en mer, au-delà des aiguilles, plus haut qu’elles et plus bas que la Montée', () => {
    const north = Math.min(...NEEDLES_5E.map((n) => n.at.z));
    for (const v of NEF_WALL) {
      expect(heightAt5e(v)).toBeLessThan(0);
      expect(v.z + v.r).toBeLessThan(north);
      expect(v.h).toBeGreaterThan(needleTop);
      expect(v.h).toBeLessThan(MONTEE_HEIGHT + PLATEAU.height);
      expect(wallTouched(v)).toBe(true);
    }
    // Le panache, derrière le mur, au nord-est.
    expect(NEF_PLUME.z).toBeLessThan(Math.min(...NEF_WALL.map((v) => v.z - v.r)));
    expect(NEF_PLUME.x).toBeGreaterThan(0);
    expect(wallFacets(30).triangles).toBe(wallFacets().triangles);
  });

  it('monte à la verticale, puis file au nord, à l’écart de la Montée, au-delà du mur, en huit secondes au plus', () => {
    const f: NefFlight = { x: 0, y: 0, z: 0, yaw: 0, shiftX: 0, shiftZ: 0 };
    expect(nef5eFlight(0, f)).toBe(f);
    expect(f.x).toBeCloseTo(NEF_5E.berth.x);
    expect(f.z).toBeCloseTo(NEF_5E.berth.z);
    expect(f.yaw).toBeCloseTo(NEF_5E.berth.yaw);
    expect(f.shiftZ).toBeCloseTo(0);
    let lowest = Infinity;
    for (let i = 0; i <= 400; i++) {
      nef5eFlight(i / 400, f);
      const away = Math.hypot(f.x - NEF_5E.berth.x, f.z - NEF_5E.berth.z);
      // Rien ne s'écarte du ber avant d'avoir passé la canopée.
      if (away > 1) expect(f.y, `${i}`).toBeGreaterThan(NEF_5E_DEPARTURE.climb - 1);
      lowest = Math.min(lowest, Math.hypot(f.x - montee.x, f.z - montee.z));
    }
    expect(lowest).toBeGreaterThan(40);
    nef5eFlight(1, f);
    expect(f.z).toBeLessThan(Math.min(...NEF_WALL.map((v) => v.z - v.r)));
    expect(f.shiftZ).toBe(-NEF_5E_DEPARTURE.wallShift);
    expect(NEF_5E_DEPARTURE.seconds).toBeLessThanOrEqual(8);
  });
});
