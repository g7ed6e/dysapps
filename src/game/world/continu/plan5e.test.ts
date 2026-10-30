// Le monde ouvert du 5e (GD-22, lot 2, « toute l'île en grandes masses ») : ses quatorze lieux, ses quatre terres et leurs
// passages, ses deux étages faits par la seule hauteur du sol, ses chenaux sans gué, ses ruines, ses couleurs (jamais
// presque noires) et son budget. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { LINK_PRICE, islandsOf } from '../archipelago';
import { FOREST_REWORK_MAX_5E, OPEN_WORLD_BUDGETS, PLACE_TRIANGLES_MAX_5E, mapCost5e, openWorldCost5e, worldGestesCost, worldHabitantsCost } from './budget';
import { bridgeFacets, bridgeFloor, bridgeSite, clampToOpen, isCabin } from './bridges';
import { closestOnSegment, distance, distanceToPolyline, linearRgb, signedDistance, type Vec2 } from './geometry';
import { bridgeEdge, landOf, landPrice, linkedLands, nodeLands } from './lands';
import { planFor } from './levelPlan';
import { CLIFF_MAP_COLORS, CLIFF_MAP_SHAPE, cliffMapLine, cliffMapSegments, riftMistFacets, riftMistSpots, RIFT_MIST } from './mist5e';
import { modelOfPlace } from './places';
import { CAUSEWAY_5E, NETWORK_5E, PATH_MAP_EDGE, RIBBONS_5E, besideStation, causewayFacets, pathMapEdges5e, pathRibbons5e, quayFacets } from './paths5e';
import { edgesNear, networkRibbons, pathTopAt } from './paths';
import { BUILT_PLACES_5E, COAST_5E, COLORS_5E, DEPARTURE_5E, LINKS_5E, NEEDLES_5E, PATH_EDGES_5E, PLATEAU, PLATEAU_5E, QUAY_5E, TERRAIN_5E, UPPER_PLACES_5E } from './plan5e';
import { COLORS_6E } from './plan6e';
import { ILES } from '../../islands';
import { MONTEE_HEIGHT } from './montee5e';
import { PERCHOIR_TRIANGLES_MAX } from './perchoir5e';
import { HEIGHT_LIGHT_5E, HORIZON_COLOR_5E, LIGHT_5E, SKY_OF, skyColorAt, skyDome } from './sky';
import { SEA_TEXTURE, WATER_TONES_5E, seaPixels5e, waterTone5e } from './sea';
import { FOREST_COLORS, buildHeightField5e, channelClearance, groundFar5e, groundOn5e, heightAt5e, landDistance5e, onPlateau, plateauRim5e, plateauShare, tileCounts5e, tileFacets5e, tileFlora5e, tileGround5e } from './terrain5e';
import { standingHeight } from './terrain';
import { VEIL_LAYERS, VEIL_LAYERS_5E, veilFacets, veilShare } from './veil';

const PLAN = planFor('5e');
const LINKED = linkedLands(PLAN);
const node = (id: string): Vec2 => NETWORK_5E.pathNode(id).at;
const isPassage = (a: string, b: string) => Object.values(LINKS_5E).some(({ bridge: [u, v] }) => (u === a && v === b) || (u === b && v === a));

/** La luminance relative d'une couleur linéaire : au-dessus de tant, rien n'est presque noir. */
const luminance = ([r, g, b]: readonly number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const NOT_BLACK = 0.03;

describe('Le plan du 5e', () => {
  it('quatorze lieux, un par île du 5e, chacun dans une terre et une seule', () => {
    expect(PLAN.places).toHaveLength(14);
    expect(new Set(PLAN.places.map((p) => p.island))).toEqual(new Set(islandsOf('5e').map((b) => b.id)));
    const all = PLAN.lands.flatMap((l) => l.places);
    expect(new Set(all)).toEqual(new Set(PLAN.places.map((p) => p.id)));
    expect(all).toHaveLength(14);
    expect(PLAN.lands.map((l) => l.name)).toEqual(['Les Frondaisons', 'Les Roselières', 'Les Contreforts', 'Les Aiguilles']);
  });

  it('chaque lieu construit joue toutes les quêtes de son île, dans leur ordre, et rien d’autre (les Radeaux : maths-5e-proportionality)', () => {
    for (const [id, missions] of Object.entries(BUILT_PLACES_5E)) {
      const island = PLAN.places.find((p) => p.id === id)!.island;
      const quests = ILES.find((i) => i.id === island)!.exercises.map((e) => e.id);
      expect([...missions], `${id} (${island})`).toEqual(quests);
    }
    expect(PLAN.places.find((p) => p.id === 'radeaux')!.island).toBe('maths-5e-proportionality');
  });

  it('la Lisière, le départ, au sud-est, dans les Frondaisons, près du Hameau', () => {
    expect(nodeLands(PLAN).get(DEPARTURE_5E.node)).toBe('frondaisons');
    expect(distance(node(DEPARTURE_5E.node), PLAN.places.find((p) => p.id === 'hameau')!.center)).toBeLessThan(85);
    expect(DEPARTURE_5E.at.x).toBeGreaterThan(0);
    expect(DEPARTURE_5E.at.z).toBeGreaterThan(0);
  });

  it('le prix d’une terre : celui d’une liaison du 5e par lieu, l’Oracle en option ne compte pas (10, 15, 20)', () => {
    expect(PLAN.pricePerPlace).toBe(LINK_PRICE['5e']);
    expect(PLAN.unpriced).toEqual(['oracle']);
    expect(LINKED.map(landPrice)).toEqual([10, 15, 20]);
  });

  it('sans ses trois passages, le réseau fait exactement les quatre terres', () => {
    const lands = nodeLands(PLAN);
    expect(new Set(lands.values())).toEqual(new Set(PLAN.lands.map((l) => l.id)));
    for (const p of PLAN.places) expect(lands.get(p.door), p.id).toBe(landOf(p.id));
    const passages = new Set(LINKED.map((l) => bridgeEdge(PLAN, l)));
    PATH_EDGES_5E.forEach(([a, b], i) => {
      if (!passages.has(i)) expect(lands.get(a), `${a}–${b}`).toBe(lands.get(b));
    });
    // D'un seul tenant, passages compris : de la Lisière, on va partout.
    for (const p of PLAN.places) expect(NETWORK_5E.findRoute(NETWORK_5E.atNode('port-quai'), NETWORK_5E.atNode(p.door)).length, p.id).toBeGreaterThan(1);
  });
});

describe('Deux étages, par la seule hauteur du sol', () => {
  it('les lieux du haut sont sur le plateau, les autres en bas ; la Carte met un triangle à côté des seuls lieux du haut', () => {
    for (const p of PLAN.places) expect(onPlateau(p.center), p.id).toBe(UPPER_PLACES_5E.includes(p.id as never));
    expect(PLAN.upper).toEqual(UPPER_PLACES_5E);
    expect(PLAN.lands.find((l) => l.id === 'aiguilles')!.places.slice().sort()).toEqual([...UPPER_PLACES_5E].sort());
  });

  it('de vraies falaises : le plateau monte de toute sa hauteur sur quelques unités', () => {
    for (const x of [-150, -60, 60, 150]) {
      let steepest = 0;
      for (let z = -60; z < 40; z += 0.5) steepest = Math.max(steepest, heightAt5e({ x, z: z - 3 }) - heightAt5e({ x, z: z + 3 }));
      expect(steepest, `x = ${x}`).toBeGreaterThan(PLATEAU.height * 0.8);
    }
  });

  it('aucun sentier ne monte la falaise ni ne passe l’eau : seuls les deux ponts et la cabine', () => {
    for (const [a, b] of PATH_EDGES_5E) {
      if (isPassage(a, b)) continue;
      const p = node(a);
      const q = node(b);
      const n = Math.ceil(distance(p, q) / 0.5);
      const shares: number[] = [];
      for (let k = 0; k <= n; k++) {
        const at = { x: p.x + ((q.x - p.x) * k) / n, z: p.z + ((q.z - p.z) * k) / n };
        expect(landDistance5e(at), `${a}–${b}`).toBeGreaterThan(1);
        shares.push(plateauShare(at));
      }
      // Tout en haut, ou tout en bas.
      expect(Math.min(...shares) > 0.95 || Math.max(...shares) < 0.05, `${a}–${b}`).toBe(true);
    }
  });

  it('les chenaux : profonds au droit de chaque pont, sans gué, d’eau sombre jamais presque noire', () => {
    for (const land of LINKED.filter((l) => !isCabin(l))) {
      const s = bridgeSite(land);
      expect(channelClearance(s.mid), land).toBeLessThan(-3);
      expect(heightAt5e(s.mid), land).toBeLessThan(-1.5);
      expect(waterTone5e(s.mid), land).toBe(WATER_TONES_5E.night);
    }
    for (const c of Object.values(WATER_TONES_5E)) if (c > 0xff) expect(luminance(linearRgb(c))).toBeGreaterThan(NOT_BLACK);
  });

  it('les aiguilles se tiennent loin des chemins et des lieux ; la Montée, au centre, est la plus haute', () => {
    for (const n of NEEDLES_5E) {
      for (const [a, b] of PATH_EDGES_5E) expect(distanceToPolyline(n.at, [node(a), node(b)]), `${n.at.x}, ${n.at.z}`).toBeGreaterThan(n.radius + 2);
      for (const p of PLAN.places) expect(distance(n.at, p.center)).toBeGreaterThan(n.radius + 8);
    }
    const montee = PLAN.places.find((p) => p.id === 'montee')!;
    for (const n of NEEDLES_5E) expect(heightAt5e(n.at) + n.height).toBeLessThan(heightAt5e(montee.center) + MONTEE_HEIGHT - 5);
    expect(distance(montee.center, { x: 0, z: 0 })).toBeLessThan(5);
    expect(modelOfPlace('montee').top).toBeGreaterThan(Math.max(...PLAN.places.filter((p) => p.id !== 'montee').map((p) => modelOfPlace(p.id).top)) + 20);
  });
});

describe('Les silhouettes : une famille d’aiguilles, une ruine par lieu', () => {
  it('toutes les aiguilles dépassent la tour du Donjon ; la Montée les dépasse toutes, et la canopée de loin', () => {
    const donjon = PLAN.places.find((p) => p.id === 'donjon')!;
    const donjonTop = heightAt5e(donjon.center) + modelOfPlace('donjon').top;
    for (const n of NEEDLES_5E) expect(heightAt5e(n.at) + n.height, `${n.at.x}, ${n.at.z}`).toBeGreaterThan(donjonTop + 2);
    // La canopée la plus haute : un palétuvier de près, sa seconde couronne comprise (moins de 9 unités au-dessus du sol).
    expect(modelOfPlace('montee').top).toBeGreaterThan(MONTEE_HEIGHT - 2);
    expect(MONTEE_HEIGHT).toBeGreaterThan(6 * 9);
  });

  it('chaque ruine a sa hauteur et son contour propres : aucune boîte commune', () => {
    const sizes = PLAN.places.map((p) => {
      const f = modelOfPlace(p.id).facets;
      const min = [Infinity, Infinity, Infinity];
      const max = [-Infinity, -Infinity, -Infinity];
      for (let k = 0; k < f.positions.length; k++) {
        min[k % 3] = Math.min(min[k % 3], f.positions[k]);
        max[k % 3] = Math.max(max[k % 3], f.positions[k]);
      }
      return `${Math.round(max[0] - min[0])}×${Math.round(max[1] - min[1])}×${Math.round(max[2] - min[2])}`;
    });
    expect(new Set(sizes).size).toBe(PLAN.places.length);
    // Le Donjon : une tour plus haute que large, sur son piton.
    expect(modelOfPlace('donjon').top).toBeGreaterThan(18);
  });

  it('les Radeaux : leurs plateformes sur l’eau du grand chenal, à ras de l’eau', () => {
    const radeaux = PLAN.places.find((p) => p.id === 'radeaux')!;
    const f = modelOfPlace('radeaux').facets;
    const y0 = Math.max(heightAt5e(radeaux.center), 0.04);
    let wet = 0;
    for (let k = 0; k < f.positions.length; k += 3) {
      const p = { x: radeaux.center.x + f.positions[k], z: radeaux.center.z + f.positions[k + 2] };
      const y = y0 + f.positions[k + 1];
      if (channelClearance(p, 'grand') < -1 && y > 0 && y < 1.2) wet++;
    }
    expect(wet).toBeGreaterThan(20);
  });
});

describe('La Lisière : l’eau et le ponton au départ', () => {
  it('Kéo part au pied du ponton ; le ponton avance au nord, de la rive sur l’eau sombre de l’anse', () => {
    expect(distance(DEPARTURE_5E.at, QUAY_5E.from)).toBeLessThan(3);
    expect(landDistance5e(QUAY_5E.from)).toBeGreaterThan(0);
    expect(channelClearance(QUAY_5E.to, 'anse')).toBeLessThan(-2);
    expect(waterTone5e(QUAY_5E.to)).toBe(WATER_TONES_5E.night);
    // Au nord de Kéo : la caméra, tournée vers le nord au départ, a l'eau et le ponton devant elle.
    expect(QUAY_5E.to.z).toBeLessThan(DEPARTURE_5E.at.z - 8);
    expect(Math.abs(QUAY_5E.to.x - DEPARTURE_5E.at.x)).toBeLessThan(QUAY_5E.to.z < DEPARTURE_5E.at.z ? DEPARTURE_5E.at.z - QUAY_5E.to.z : 0);
    // Ses deux lanternes d'ocre.
    const f = quayFacets();
    const [r, g, b] = linearRgb(COLORS_5E.lantern);
    let lit = 0;
    for (let k = 0; k < f.colors.length; k += 3) if (Math.abs(f.colors[k] - r) < 1e-6 && Math.abs(f.colors[k + 1] - g) < 1e-6 && Math.abs(f.colors[k + 2] - b) < 1e-6) lit++;
    expect(lit).toBe(2 * 10 * 3);
  });

  it('aucun arbre ne couvre l’eau des chenaux : un tronc se tient loin de l’eau', () => {
    const field = buildHeightField5e();
    for (const [tx, tz] of [[9, 7], [10, 8], [5, 7], [13, 9]] as const) {
      const f = tileFlora5e(field, tx, tz, 'far');
      // De loin, la seule canopée : son centre est au-dessus de la terre.
      for (let k = 0; k < f.positions.length; k += 9) {
        const p = { x: (f.positions[k] + f.positions[k + 3] + f.positions[k + 6]) / 3, z: (f.positions[k + 2] + f.positions[k + 5] + f.positions[k + 8]) / 3 };
        expect(channelClearance(p), `${p.x}, ${p.z}`).toBeGreaterThan(-1.5);
      }
    }
  });
});

describe('La Carte : le trait de la falaise', () => {
  it('sur l’île seulement, jamais sur la mer', () => {
    const segments = cliffMapSegments();
    expect(segments.length).toBeGreaterThan(8);
    for (const [a, b] of segments) {
      expect(signedDistance(a, COAST_5E)).toBeGreaterThan(1.5);
      expect(signedDistance(b, COAST_5E)).toBeGreaterThan(1.5);
    }
    // Deux bandes par tronçon (quatre triangles), puis une dent par `pitch` unités.
    const { tooth, pitch } = CLIFF_MAP_SHAPE;
    const teeth = segments.reduce((n, [a, b]) => (distance(a, b) < tooth ? n : n + Math.floor((distance(a, b) - tooth) / pitch) + 1), 0);
    expect(teeth).toBeGreaterThan(60);
    expect(cliffMapLine().triangles).toBe(segments.length * 4 + teeth);
  });

  it('asymétrique, d’une autre forme qu’un chemin : le sombre côté plateau, le clair et les dents du seul côté du pied (retouche du lot 2)', () => {
    const line = cliffMapLine();
    const segments = cliffMapSegments();
    const p = line.positions;
    const c = line.colors;
    const dark = linearRgb(CLIFF_MAP_COLORS.dark);
    const light = linearRgb(CLIFF_MAP_COLORS.light);
    let teeth = 0;
    let insideDark = 0;
    for (let i = 0; i < p.length; i += 9) {
      const centre = { x: (p[i] + p[i + 3] + p[i + 6]) / 3, z: (p[i + 2] + p[i + 5] + p[i + 8]) / 3 };
      // De quel côté du rebord : dans le plateau (côté sombre) ou dehors, vers le pied.
      const inside = signedDistance(centre, PLATEAU_5E) > 0;
      const isLight = Math.abs(c[i] - light[0]) < 1e-3 && Math.abs(c[i + 1] - light[1]) < 1e-3;
      const isDark = Math.abs(c[i] - dark[0]) < 1e-3 && Math.abs(c[i + 1] - dark[1]) < 1e-3;
      expect(isLight || isDark).toBe(true);
      // Le clair, jamais côté plateau (sur la pierre il se confond) : le liseré borde le pied seulement.
      if (isLight) expect(inside).toBe(false);
      else if (Math.abs(p[i + 1] - (PLATEAU.height + 2.55)) < 1e-3) insideDark += inside ? 1 : 0;
      // Toutes les facettes d'une face vers le haut (lues de la Carte).
      const ux = p[i + 3] - p[i], uz = p[i + 5] - p[i + 2], vx = p[i + 6] - p[i], vz = p[i + 8] - p[i + 2];
      expect(uz * vx - ux * vz).toBeGreaterThan(0);
      // Une dent : un triangle sombre seul, levé au-dessus des deux bandes.
      if (isDark && Math.abs(p[i + 1] - (PLATEAU.height + 2.6)) < 1e-3) teeth++;
    }
    expect(teeth).toBe(line.triangles - segments.length * 4);
    // La bande sombre, elle, déborde côté plateau (sur la pierre) : une de ses deux moitiés par tronçon au moins.
    expect(insideDark).toBeGreaterThanOrEqual(segments.length);
    // Le sombre domine : sa bande au moins deux fois plus large que le trait clair continu.
    // Le liseré reste un trait continu sous les dents, d'au moins un pixel (0,6 unité) ; les dents laissent du clair entre elles.
    const { back, front, rim, reach, tooth, pitch } = CLIFF_MAP_SHAPE;
    expect(reach - front).toBeGreaterThanOrEqual(1);
    expect(rim - reach).toBeGreaterThanOrEqual(0.6);
    expect(back + front).toBeGreaterThanOrEqual(2 * (rim - reach));
    expect(tooth).toBeLessThanOrEqual(pitch / 2);
  });

  it('jamais sur l’eau des chenaux : la ligne coupée là où le chenal de l’ouest entaille le plateau (retouche du lot 2)', () => {
    const segments = cliffMapSegments();
    for (const [a, b] of segments)
      for (let t = 0; t <= 1; t += 0.05) {
        const p = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
        expect(channelClearance(p), `${p.x.toFixed(1)} ${p.z.toFixed(1)}`).toBeGreaterThan(1.5);
      }
    // Aucune facette de la ligne (bandes et dents) au-dessus de l'eau d'un chenal.
    const p = cliffMapLine().positions;
    for (let i = 0; i < p.length; i += 9) {
      const centre = { x: (p[i] + p[i + 3] + p[i + 6]) / 3, z: (p[i + 2] + p[i + 5] + p[i + 8]) / 3 };
      expect(channelClearance(centre), `${centre.x.toFixed(1)} ${centre.z.toFixed(1)}`).toBeGreaterThan(0);
    }
    // Le chenal de l'ouest coupe un côté du plateau : la ligne s'arrête de part et d'autre de son eau.
    const ends = segments.flat().map((e) => channelClearance(e, 'ouest'));
    expect(ends.filter((d) => d < 3).length, ends.map((d) => d.toFixed(1)).join(' ')).toBe(2);
  });

  it('se lit sur la pierre du plateau (3:1 au moins, sous la même lumière), son trait clair sur le sombre', () => {
    const contrast = (a: number, b: number) => {
      const [la, lb] = [luminance(linearRgb(a)), luminance(linearRgb(b))];
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    };
    for (const ground of [COLORS_5E.stone, COLORS_5E.stoneSun, COLORS_5E.plateauMoss]) expect(contrast(CLIFF_MAP_COLORS.dark, ground), ground.toString(16)).toBeGreaterThan(3);
    expect(contrast(CLIFF_MAP_COLORS.light, CLIFF_MAP_COLORS.dark)).toBeGreaterThan(7);
    expect(luminance(linearRgb(CLIFF_MAP_COLORS.dark))).toBeGreaterThan(NOT_BLACK);
  });

  it('un liseré clair du côté du pied : il se lit sur la mousse sombre et la forêt du pied, le sombre sur la pierre (seconde relecture du lot 2)', () => {
    const contrast = (a: number, b: number) => {
      const [la, lb] = [luminance(linearRgb(a)), luminance(linearRgb(b))];
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    };
    for (const ground of [COLORS_5E.moss, COLORS_5E.mossShade, COLORS_5E.mossSun, COLORS_5E.pool, FOREST_COLORS.canopy, FOREST_COLORS.canopyTop]) expect(contrast(CLIFF_MAP_COLORS.light, ground), ground.toString(16)).toBeGreaterThan(3);
  });
});

describe('La forêt noyée (pistes B, C puis A du 21 octobre 2026)', () => {
  it('l’eau basse sous les racines est plus claire que l’eau des chenaux, qu’on ne traverse jamais', () => {
    const l = (c: number) => luminance(linearRgb(c));
    expect(l(COLORS_5E.pool)).toBeGreaterThan(1.5 * l(COLORS_5E.waterShallow));
    expect(l(COLORS_5E.pool)).toBeGreaterThan(1.5 * l(COLORS_5E.water));
  });

  it('aucun bord d’eau profonde sans sa berge claire : chaque facette du sol qui coupe le niveau de l’eau prend la vase claire', () => {
    const field = buildHeightField5e();
    const bank = linearRgb(COLORS_5E.bank);
    let edges = 0;
    for (let tz = 0; tz < TERRAIN_5E.tilesZ; tz++)
      for (let tx = 0; tx < TERRAIN_5E.tilesX; tx++) {
        const { positions, normals, colors, triangles } = tileGround5e(field, tx, tz, 'near');
        for (let t = 0; t < triangles; t++) {
          // La jupe des bords de tuile, verticale, sous le sol : jamais vue.
          if (Math.abs(normals[9 * t + 1]) < 1e-6) continue;
          const ys = [1, 4, 7].map((k) => positions[9 * t + k]);
          if (Math.min(...ys) >= 0 || Math.max(...ys) <= 0) continue;
          edges++;
          for (let k = 0; k < 3; k++) expect(colors[9 * t + k], `${tx},${tz}`).toBeCloseTo(bank[k], 5);
        }
      }
    expect(edges).toBeGreaterThan(1000);
    const l = (c: number) => luminance(linearRgb(c));
    expect(l(COLORS_5E.bank)).toBeGreaterThan(1.5 * l(COLORS_5E.pool));
    expect(l(COLORS_5E.bank)).toBeLessThan(l(CLIFF_MAP_COLORS.light) / 1.5);
  });

  it('le compte sans construire de chaque tuile, de près et de loin, est celui des triangles construits', () => {
    const field = buildHeightField5e();
    for (const detail of ['near', 'far'] as const) {
      const counts = tileCounts5e(field, detail);
      for (let tz = 0; tz < TERRAIN_5E.tilesZ; tz++) for (let tx = 0; tx < TERRAIN_5E.tilesX; tx++) expect(tileFacets5e(field, tx, tz, detail).triangles, `${detail} ${tx},${tz}`).toBe(counts[tz * TERRAIN_5E.tilesX + tx]);
    }
  });
});

describe('La Carte : le liseré sombre des chemins', () => {
  const field = buildHeightField5e();
  const ground = (x: number, z: number) => groundOn5e(field, x, z);
  const edges = pathMapEdges5e(ground, CLIFF_MAP_COLORS.dark);

  it('deux bandes par morceau du ruban, hors de son sable, jamais sur l’eau, au-dessus du sol', () => {
    expect(edges.triangles % 4).toBe(0);
    expect(edges.triangles).toBeGreaterThan(400);
    // Le sable du ruban s'arrête à 0,66 unité de la ligne (./paths.ts : sa demi-largeur 0,8, moins son liseré de 0,14).
    expect(PATH_MAP_EDGE.inner).toBeGreaterThanOrEqual(0.66);
    expect(PATH_MAP_EDGE.outer - PATH_MAP_EDGE.inner).toBeGreaterThanOrEqual(0.6);
    const p = edges.positions;
    for (let i = 0; i < p.length; i += 9) {
      const x = (p[i] + p[i + 3] + p[i + 6]) / 3;
      const y = (p[i + 1] + p[i + 4] + p[i + 7]) / 3;
      const z = (p[i + 2] + p[i + 5] + p[i + 8]) / 3;
      expect(y).toBeGreaterThan(0);
      expect(y - ground(x, z)).toBeGreaterThan(-1);
    }
  });

  it('aucun morceau à cheval sur la côte : sous chaque bande, la ligne du chemin est sur la terre', () => {
    const p = edges.positions;
    const lines = PATH_EDGES_5E.map(([a, b]) => [node(a), node(b)] as const);
    for (let i = 0; i < p.length; i += 3) {
      // Le sommet ramené sur la ligne de sa liaison (la plus proche) : la terre, jamais l'eau.
      const v = { x: p[i], z: p[i + 2] };
      let best = { d: Infinity, at: v };
      for (const [a, b] of lines) {
        const q = closestOnSegment(v, a, b).point;
        const d = distance(v, q);
        if (d < best.d) best = { d, at: q };
      }
      expect(ground(best.at.x, best.at.z), `${v.x.toFixed(1)} ${v.z.toFixed(1)}`).toBeGreaterThanOrEqual(0.05);
    }
  });

  it('se lit sur la pierre du plateau, l’ocre des Contreforts, et sous le sable du chemin', () => {
    const contrast = (a: number, b: number) => {
      const [la, lb] = [luminance(linearRgb(a)), luminance(linearRgb(b))];
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    };
    for (const ground of [COLORS_5E.stone, COLORS_5E.stoneSun, COLORS_5E.plateauMoss, COLORS_5E.ochre]) expect(contrast(CLIFF_MAP_COLORS.dark, ground), ground.toString(16)).toBeGreaterThan(3);
    expect(contrast(COLORS_6E.path, CLIFF_MAP_COLORS.dark)).toBeGreaterThan(7);
  });
});

describe('Les passages : deux ponts et la cabine de la Montée', () => {
  it('fermé, Kéo s’arrête avant ; relié, il passe, et sur la cabine il monte du bas au plateau', () => {
    for (const land of LINKED) {
      const s = bridgeSite(land);
      const beyond = { edge: s.edge, t: s.nearEnd === 0 ? 0.99 : 0.01, at: s.mid };
      expect(clampToOpen(beyond, [land], PLAN), land).toEqual(s.stop);
      expect(clampToOpen(beyond, [], PLAN), land).toBe(beyond);
    }
    const cabin = bridgeSite('aiguilles');
    const along = (d: number) => ({ x: cabin.near.x + cabin.dir.x * d, z: cabin.near.z + cabin.dir.z * d });
    const low = along(cabin.abut[0] + 0.5);
    const high = along(cabin.abut[1] - 0.5);
    expect(bridgeFloor(low.x, low.z, ['aiguilles'], PLAN)).toBeNull();
    expect(bridgeFloor(high.x, high.z, [], PLAN)! - bridgeFloor(low.x, low.z, [], PLAN)!).toBeGreaterThan(PLATEAU.height * 0.8);
  });

  it('tombés et relevés, chacun se dessine ; sur la Carte, un trait pour chacun et la ligne de la falaise', () => {
    for (const land of LINKED) {
      expect(bridgeFacets(land, false).triangles, land).toBeGreaterThan(20);
      expect(bridgeFacets(land, true).triangles, land).toBeGreaterThan(bridgeFacets(land, false).triangles * 0.5);
    }
    expect(cliffMapLine().triangles).toBeGreaterThan(20);
  });
});

describe('La brume', () => {
  it('celle des terres fermées couvre leurs lieux, jamais ceux d’une autre terre ; celle des Aiguilles reste en haut', () => {
    for (const land of LINKED) {
      for (const p of PLAN.places) {
        const share = veilShare(land, p.center);
        if (landOf(p.id) === land) expect(share, `${land} ${p.id}`).toBeGreaterThan(0.5);
        else expect(share, `${land} ${p.id}`).toBe(0);
      }
    }
    expect(veilFacets(LINKED).triangles).toBeGreaterThan(0);
  });

  it('la brume d’état du 5e : trois voiles jusqu’au ras de la canopée, jamais opaque, jamais sur un chemin', () => {
    const through = (layers: readonly { alpha: number }[]) => 1 - layers.reduce((s, l) => s * (1 - l.alpha), 1);
    // Le plafond du référent dys pour les voiles réunis (./veil.ts) : 0,62.
    expect(through(VEIL_LAYERS_5E)).toBeLessThanOrEqual(0.62);
    expect(through(VEIL_LAYERS)).toBeLessThanOrEqual(0.62);
    expect(Math.max(...VEIL_LAYERS_5E.map((l) => l.lift))).toBeGreaterThan(6);
    for (const land of LINKED)
      for (const [a, b] of PATH_EDGES_5E) {
        const p = node(a);
        const q = node(b);
        expect(veilShare(land, { x: (p.x + q.x) / 2, z: (p.z + q.z) / 2 }), `${land} ${a}–${b}`).toBe(0);
      }
  });

  it('celle des failles : au pied de la falaise, dans l’entaille du chenal de l’ouest et au pied des aiguilles, jamais sur un chemin ni sur un lieu', () => {
    const spots = riftMistSpots();
    expect(spots.length).toBeGreaterThan(5);
    const atNeedle = (s: Vec2) => NEEDLES_5E.some((n) => distance(s, n.at) < n.radius + 1);
    // Au pied de chaque aiguille assez loin des chemins, une nappe ; les autres, en bas, sous la falaise.
    expect(spots.filter((s) => atNeedle(s.at)).length).toBeGreaterThan(5);
    for (const { at, radius } of spots) {
      expect(radius).toBeGreaterThanOrEqual(RIFT_MIST.smallest);
      expect(radius).toBeLessThanOrEqual(RIFT_MIST.radius);
      if (!atNeedle(at)) expect(plateauShare(at)).toBeLessThan(0.3);
      for (const [a, b] of PATH_EDGES_5E) expect(distanceToPolyline(at, [node(a), node(b)])).toBeGreaterThanOrEqual(radius + RIFT_MIST.path - 1e-6);
      for (const p of PLAN.places) expect(distance(at, p.center)).toBeGreaterThanOrEqual(radius + RIFT_MIST.place - 1e-6);
    }
    // Deux voiles par nappe, au-dessus du sol de la forêt ; jamais plus denses que leur cœur.
    const m = riftMistFacets();
    expect(m.triangles).toBe(spots.length * RIFT_MIST.layers.length * RIFT_MIST.sides);
    const most = Math.max(...RIFT_MIST.layers.map((l) => l.alpha));
    for (let k = 3; k < m.colors.length; k += 4) expect(m.colors[k]).toBeLessThanOrEqual(most);
  });
});

describe('Le sol, l’eau, le ciel', () => {
  it('une tuile en deux temps (son sol, puis ce qui y pousse) fait la tuile entière ; de loin, le sol suit la grille grossière', () => {
    const field = buildHeightField5e();
    for (const [tx, tz] of [[7, 5], [3, 6]] as const)
      for (const d of ['near', 'far'] as const) expect(tileGround5e(field, tx, tz, d).triangles + tileFlora5e(field, tx, tz, d).triangles).toBe(tileFacets5e(field, tx, tz, d).triangles);
    // Hors de la grille, le sol du plan.
    expect(groundFar5e(field, 1000, 1000)).toBe(heightAt5e({ x: 1000, z: 1000 }));
    expect(groundOn5e(field, 1000, 1000)).toBe(heightAt5e({ x: 1000, z: 1000 }));
  });

  it('l’image de l’eau du 5e a la taille de celle du 6e ; le ciel du 5e a ses couleurs à lui', () => {
    expect(seaPixels5e()).toHaveLength(SEA_TEXTURE.size * SEA_TEXTURE.size * 4);
    expect(skyDome(1, SKY_OF['5e']).colors).not.toEqual(skyDome(1, SKY_OF['6e']).colors);
    expect(skyDome(1, SKY_OF['6e']).colors).toEqual(skyDome(1).colors);
  });
});

describe('Les couleurs et la lumière', () => {
  it('jamais presque noires : le sol, la forêt, les aiguilles, les ruines', () => {
    for (const c of [...Object.values(COLORS_5E), ...Object.values(FOREST_COLORS), HORIZON_COLOR_5E]) expect(luminance(linearRgb(c)), c.toString(16)).toBeGreaterThan(NOT_BLACK);
    const field = buildHeightField5e();
    const check = (colors: Float32Array, what: string) => {
      for (let k = 0; k < colors.length; k += 3) expect(luminance([colors[k], colors[k + 1], colors[k + 2]]), what).toBeGreaterThan(NOT_BLACK);
    };
    for (const [tx, tz] of [[7, 5], [7, 2], [3, 6], [10, 7]] as const) check(tileFacets5e(field, tx, tz, 'near').colors, `tuile ${tx}, ${tz}`);
    for (const p of PLAN.places) check(modelOfPlace(p.id).facets.colors, p.id);
  });

  it('deux étages de lumière : en bas, le soleil affaibli et la lumière refroidie ; en haut, toute la lumière ; les sommets sortent de la brume', () => {
    const h = HEIGHT_LIGHT_5E;
    // Le sol de la forêt sous `low`, le plateau au-dessus de `high`.
    expect(h.low).toBeGreaterThan(1.5);
    expect(h.high).toBeLessThan(PLATEAU.height);
    expect(h.sunLow).toBeLessThan(0.35);
    // Plus froide en bas : le bleu et le vert gardés, le rouge baissé.
    expect(h.tintLow[0]).toBeLessThan(h.tintLow[1]);
    expect(h.tintLow[1]).toBeLessThanOrEqual(h.tintLow[2]);
    // Le brouillard s'éclaircit au-dessus du plateau, jamais jusqu'à rien : le sommet de la Montée y reste voilé.
    expect(h.fogFrom).toBeGreaterThan(PLATEAU.height);
    expect(h.fogTo).toBeLessThan(MONTEE_HEIGHT);
    expect(h.fogTop).toBeGreaterThan(0.3);
    expect(h.fogTop).toBeLessThan(0.7);
  });

  it('le ciel en dégradé : doré à l’horizon, une brume grise en haut', () => {
    const [r0, , b0] = skyColorAt(0, SKY_OF['5e']);
    const [r1, g1, b1] = skyColorAt(90, SKY_OF['5e']);
    expect(r0 - b0).toBeGreaterThan(0.25);
    expect(Math.max(r1, g1, b1) - Math.min(r1, g1, b1)).toBeLessThan(0.12);
    expect(linearRgb(HORIZON_COLOR_5E)).toEqual(skyColorAt(0, SKY_OF['5e']));
  });

  it('un soleil bas, de l’ouest, sur la fin de l’après-midi', () => {
    const { x, y, z } = LIGHT_5E.sunFrom;
    const elevation = (Math.atan2(y, Math.hypot(x, z)) * 180) / Math.PI;
    expect(elevation).toBeGreaterThan(8);
    expect(elevation).toBeLessThan(20);
    expect(x).toBeLessThan(0);
  });
});

/** La réserve des lots suivants au lot 13b (l'Oracle), sous l'enveloppe du 5e, scénette ouverte. */
const RESERVE_LOT13B_5E = 13_200;

describe('Le budget du 5e', () => {
  it('le monde et la Carte tiennent dans l’enveloppe du monde ouvert, avec de la place pour les lots suivants', () => {
    const cost = openWorldCost5e();
    const triangles = cost.reduce((s, c) => s + c.triangles, 0);
    const calls = cost.reduce((s, c) => s + c.calls, 0);
    // Après le lot 5 (le Hameau), environ 23 000 triangles et 3 appels restent pour les douze autres lieux, les Détours, le
    // Rafiot et les aménagements (intention du directeur artistique du 20 octobre 2026, « Le budget ») ; après le lot 6
    // (les Radeaux et le Creux) et le pied des palétuviers de loin (#475), 22 784 triangles ; après le lot 7 (la Croisée,
    // 96 367 triangles mesurés scénette ouverte, retouches des Radeaux comprises), 21 633 : la réserve passe à 21 000 ;
    // après le lot 8 (les Instants et la Hutte, 95 800 : la forêt dégagée le long de la chaussée retire plus que le lieu
    // n'ajoute) puis le lot 9 (les Fumerolles, +1 163, le lieu restauré à la place de sa ruine), 96 963 triangles mesurés
    // scénette ouverte, et sa retouche 1 (la vapeur en bouffées, les têtes rondes des sondes, les goujons ronds, +15),
    // 96 978, 21 022 : la réserve reste à 21 000 ; sa retouche 2 (la vapeur en colonnes de quatre bouffées, +78), 97 056,
    // 20 944 : la réserve passe à 20 900, de la seule hausse due au lot (l'enveloppe reste 118 000 et 22) ; après le lot 10
    // (l'Étuve, +1 259, le lieu restauré à la place de son tambour rond), 98 315, 19 685 : la réserve passe à 19 600 ; après le lot 11
    // (les Terrasses et la Faille, +1 958, le lieu restauré à la place de sa ruine, le Détour et le coude du chemin),
    // 100 273, 17 727 : la réserve passe à 17 700 ; après le lot 12 (l'Auberge, retouche 1 comprise, +1 138, le lieu
    // restauré à la place de sa ruine), 101 411, 16 589 : la réserve passe à 16 500 ; sa retouche 2 (l'anse de la cruche
    // en six segments, +4), 101 415, 16 585 : la réserve reste à 16 500 ; les chaussées dallées du plateau (lot 13a, +1 454,
    // à la place du sable), 102 869, 15 131 : la réserve passe à 15 100 ; le Donjon (lot 13a, +862, le lieu restauré à la
    // place de sa ruine), 103 731, 14 269 : la réserve passe à 14 200 ; sa retouche 1 (les nœuds des chaussées à douze
    // pans, +132 ; le parapet, les marches, le logis de pierre et le signe de l'Auberge, +100 ; le Sémaphore et les
    // Nacelles couchés, −14), 103 949, 14 051 : la réserve passe à 14 000 ; ses deux passes suivantes (les marches, +38 ;
    // l'escalier, −48), 103 939, 14 061 : elle reste à 14 000 ; l'Oracle (lot 13b, +767 sur le Donjon fini, le lieu
    // restauré à la place de sa ruine), 104 706, 13 294 : la réserve passe à 13 200, de la seule hausse. Depuis, elle
    // baisse d'un lieu au plus par lieu fini (`PLACE_TRIANGLES_MAX_5E`), sans se réécrire à chaque lot : deux lots
    // parallèles n'ont plus à se rebaser pour elle ; le Sémaphore (lot 14) en est le premier, le Gaillard (lot 15) le
    // deuxième, les Nacelles (lot 16) le troisième. La forêt retaillée (pistes B, C puis A du 21 octobre 2026, dans le
    // maillage du sol, +5 737 mesurés) la baisse de son plafond, `FOREST_REWORK_MAX_5E` : 13 200 − 5 800 = 7 400 avant le
    // Sémaphore. Le Détour du Perchoir (lot 16) s'y ajoute par son plafond propre, `PERCHOIR_TRIANGLES_MAX`.
    const since = Object.keys(BUILT_PLACES_5E).filter((id) => !['montee', 'hameau', 'radeaux', 'croisee', 'instants', 'fumerolles', 'etuve', 'terrasses', 'auberge', 'donjon', 'oracle'].includes(id)).length;
    expect(triangles).toBeLessThanOrEqual(OPEN_WORLD_BUDGETS['5e'].triangles - RESERVE_LOT13B_5E + FOREST_REWORK_MAX_5E + since * PLACE_TRIANGLES_MAX_5E + PERCHOIR_TRIANGLES_MAX);
    expect(calls).toBeLessThanOrEqual(OPEN_WORLD_BUDGETS['5e'].calls - 3);
    // Les habitants près de leur porte (choix du mainteneur du 21 octobre 2026, « Garder au 5e », en modèle 3D depuis le
    // 23 octobre) se cachent pendant une scénette : ils ne prennent rien sur cette réserve. Hors scénette et au départ, ils
    // sont comptés (`worldHabitantsCost`, un appel) : ces deux vues prennent la réserve, qui ne sert plus aux lots du 5e
    // (tous finis), et restent sous l'enveloppe.
    expect(cost.some((c) => c.poste === 'habitants')).toBe(false);
    for (const view of ['monde', 'depart'] as const) {
      const v = openWorldCost5e(view);
      const habitants = v.find((c) => c.poste === 'habitants')!;
      expect(habitants).toEqual({ poste: 'habitants', ...worldHabitantsCost('5e') });
      // Et leur outil (le geste du métier, GD-27 lot 5), un maillage, un appel, aux mêmes vues.
      expect(v.find((c) => c.poste === 'gestes')).toEqual({ poste: 'gestes', ...worldGestesCost('5e') });
      expect(v.reduce((s, c) => s + c.triangles, 0)).toBeLessThanOrEqual(OPEN_WORLD_BUDGETS['5e'].triangles);
      expect(v.reduce((s, c) => s + c.calls, 0)).toBeLessThanOrEqual(OPEN_WORLD_BUDGETS['5e'].calls - 3);
    }
    // La Carte dans l'enveloppe (ses plafonds lot par lot : ./hameau5e.test.ts, ./croisee5e.test.ts).
    const map = mapCost5e();
    expect(map.triangles).toBeLessThanOrEqual(OPEN_WORLD_BUDGETS['5e'].triangles);
    expect(map.calls).toBeLessThanOrEqual(OPEN_WORLD_BUDGETS['5e'].calls);
    // Les chemins se dessinent sur le sol du 5e.
    const field = buildHeightField5e();
    expect(pathRibbons5e((px, pz) => groundOn5e(field, px, pz)).triangles).toBeGreaterThan(1000);
  });
});

describe('Les chaussées du plateau (GD-22, lot 13a)', () => {
  const field = buildHeightField5e();
  const ground = (x: number, z: number) => groundOn5e(field, x, z);
  const causeways = causewayFacets(ground);
  const upperEdges = PATH_EDGES_5E.map(([a, b], edge) => ({ a: node(a), b: node(b), edge })).filter(({ b }) => onPlateau(b));

  /** Les couleurs (rouge, vert, bleu linéaires) des triangles de `f`, avec leur centre. */
  const triangles = (f: ReturnType<typeof causewayFacets>) =>
    Array.from({ length: f.triangles }, (_, t) => {
      const i = t * 9;
      const at = { x: (f.positions[i] + f.positions[i + 3] + f.positions[i + 6]) / 3, z: (f.positions[i + 2] + f.positions[i + 5] + f.positions[i + 8]) / 3 };
      return { at, rgb: [f.colors[i], f.colors[i + 1], f.colors[i + 2]] };
    });
  const same = (rgb: readonly number[], color: number) => linearRgb(color).every((v, k) => Math.abs(v - rgb[k]) < 1e-5);

  it('plus aucun sable en haut : le sentier et son liseré brun s’arrêtent au rebord, la cabine passée', () => {
    for (const { at, rgb } of triangles(networkRibbons(RIBBONS_5E, ground))) {
      if (plateauShare(at) <= 0.6) continue;
      expect(same(rgb, COLORS_6E.path) || same(rgb, COLORS_6E.pathEdge), `${at.x.toFixed(1)} ${at.z.toFixed(1)}`).toBe(false);
    }
  });

  it('toutes les liaisons du plateau, de la gare haute aux cinq lieux, sont dallées : 3 de large, Kéo y marche dessus', () => {
    // Les dix liaisons du plateau et la fin de celle de la cabine.
    expect(upperEdges).toHaveLength(11);
    for (const id of ['cab-haut', 'aig-1', 'aig-2', 'aig-3', 'aig-4', 'aig-5', ...UPPER_PLACES_5E]) expect(PATH_EDGES_5E.flat()).toContain(id);
    expect(2 * CAUSEWAY_5E.half).toBe(3);
    const near: number[] = [];
    for (const { a, b, edge } of upperEdges) {
      const len = distance(a, b);
      const [dx, dz] = [(b.x - a.x) / len, (b.z - a.z) / len];
      const cut = RIBBONS_5E.cut(edge);
      for (let d = 0.5; d < len; d += 2) {
        const p = { x: a.x + dx * d, z: a.z + dz * d };
        // Le rail de la cabine n'est pas une chaussée : on y monte dans la caisse.
        if (!onPlateau(p) || (cut && d < cut[1] + 1)) continue;
        // Au bord de la chaussée, Kéo et son anneau sont encore dessus ; un pas plus loin, sur la pierre.
        for (const o of [-1, 1]) {
          const q = { x: p.x + dz * o * (CAUSEWAY_5E.half - 0.1), z: p.z - dx * o * (CAUSEWAY_5E.half - 0.1) };
          edgesNear(q.x, q.z, 0.1, near, RIBBONS_5E);
          expect(near, `${edge} ${d}`).toContain(edge);
          expect(pathTopAt(q.x, q.z, ground, near, RIBBONS_5E), `${edge} ${d}`).toBeGreaterThan(standingHeight(ground(p.x, p.z)) - 0.5);
        }
      }
    }
  });

  it('des dalles chaudes, des joints et un liseré gris : rien d’autre (ni lanterne, ni bois, ni sable)', () => {
    const rocks = [COLORS_5E.stone, COLORS_5E.stoneSun, COLORS_5E.stoneShade];
    let slab = 0;
    let line = 0;
    for (const { rgb } of triangles(causeways)) {
      if (same(rgb, CAUSEWAY_5E.slab)) slab++;
      else if (same(rgb, CAUSEWAY_5E.line)) line++;
      else expect(rocks.some((c) => same(rgb, c))).toBe(true);
    }
    // Les joints et le liseré : plus de triangles que les dalles (deux joints et deux liserés par pas).
    expect(line).toBeGreaterThan(slab);
    expect(CAUSEWAY_5E.slab).toBe(0xcfc6b4);
    expect(CAUSEWAY_5E.line).toBe(0x777d77);
  });

  it('un rang de pierres basses seulement à moins de 10 unités du rebord, du côté du vide, hors de la chaussée', () => {
    const stones = triangles(causeways).filter(({ rgb }) => same(rgb, COLORS_5E.stone) || same(rgb, COLORS_5E.stoneSun));
    expect(stones.length).toBeGreaterThan(0);
    for (const { at } of stones) {
      expect(plateauRim5e(at)).toBeLessThan(CAUSEWAY_5E.edge.reach + 2);
      // Hors de la chaussée : plus loin de toute ligne du plateau que sa demi-largeur.
      const d = Math.min(...upperEdges.map(({ a, b }) => distanceToPolyline(at, [a, b])));
      expect(d).toBeGreaterThan(CAUSEWAY_5E.half);
    }
  });

  it('aucune pierre sous la gare haute, quel que soit le sens de la liaison : la coupe au début ou à la fin', () => {
    const S = CAUSEWAY_5E.edge.station;
    const len = 30;
    const first: [number, number] = [0, 6];
    const last: [number, number] = [len - 6, len];
    // Un morceau contre la gare, d'un côté puis de l'autre : sans pierre ; un morceau plus loin : avec.
    expect(besideStation(first, 6, 7.25)).toBe(true);
    expect(besideStation(last, len - 7.25, len - 6)).toBe(true);
    expect(besideStation(first, 6 + S + 0.1, 12)).toBe(false);
    expect(besideStation(last, 12, len - 6 - S - 0.1)).toBe(false);
    expect(besideStation(null, 0, 1.25)).toBe(false);
    // La liaison de la cabine, sur le plateau : aucune pierre à moins de `station` de sa gare haute (le bout de son rail).
    const cabin = upperEdges.find(({ edge }) => RIBBONS_5E.cut(edge))!;
    const cut = RIBBONS_5E.cut(cabin.edge)!;
    const len2 = distance(cabin.a, cabin.b);
    const end = cut[0] < 1e-6 ? cut[1] : cut[0];
    const station = { x: cabin.a.x + ((cabin.b.x - cabin.a.x) * end) / len2, z: cabin.a.z + ((cabin.b.z - cabin.a.z) * end) / len2 };
    for (const { at, rgb } of triangles(causeways))
      if (same(rgb, COLORS_5E.stone) && distanceToPolyline(at, [cabin.a, cabin.b]) < CAUSEWAY_5E.half + 1.5) expect(distance(at, station), `${at.x} ${at.z}`).toBeGreaterThan(S - 1.3);
  });

  it('aux carrefours, le liseré fait le tour sans coin qui dépasse : rien de lui plus loin d’une liaison que sa demi-largeur', () => {
    const f = causeways;
    // Autour des nœuds du plateau (les pierres du côté du vide, d'un gris voisin, sont plus loin d'eux).
    const nodes = [...new Set(PATH_EDGES_5E.flat())].map(node).filter((n) => onPlateau(n));
    for (let i = 0; i < f.positions.length; i += 3) {
      const rgb = [f.colors[i], f.colors[i + 1], f.colors[i + 2]];
      if (!same(rgb, CAUSEWAY_5E.line)) continue;
      const at = { x: f.positions[i], z: f.positions[i + 2] };
      if (!nodes.some((n) => distance(n, at) < 1.7)) continue;
      const d = Math.min(...PATH_EDGES_5E.map(([a, b]) => distanceToPolyline(at, [node(a), node(b)])));
      expect(d, `${at.x.toFixed(2)} ${at.z.toFixed(2)}`).toBeLessThanOrEqual(CAUSEWAY_5E.half + 1e-4);
    }
  });

  it('leur coût : celui de la terre, dans le maillage des chemins, sans appel de plus', () => {
    const paths = openWorldCost5e().find((c) => c.poste === 'chemins')!;
    expect(paths.calls).toBe(1);
    expect(causeways.triangles).toBeLessThan(paths.triangles);
  });
});
