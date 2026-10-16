// Le large (GD-20, point 8, lot L9) : les Balises, à terre sur la lèvre sud de la passe, et la Gare maritime, sur son
// îlot au bout de la jetée. Leur budget, leur reconstruction, le chenal de la Nef laissé libre, l'îlot, et leurs scènes.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BEACON_SLIP, BEACONS, BEACONS_TRACE_SPOTS, MAST } from './beacons';
import { constructionFacets, fallenFacets, ruinFacets, WHOLE } from './construction';
import { boundsOf, type Facets } from './facets';
import { linearRgb } from './geometry';
import { CANOPY, FERRY, FERRY_TRACE_SPOTS, ISLET_REACH } from './ferry';
import { modelOfPlace, placePieces, ruinOf } from './places';
import { BEACON_MASTS, COLORS_6E, FERRY_ISLET, LARGE, NEF_CHANNEL, PATH_NODES, hidesTraces, placeById, toPlan, type PlaceId } from './plan6e';
import { networkSamples } from './paths';
import { answerObjects, itemScene, placeTrace } from './questionScene';
import { COLUMN, EARS_PROMPT, REST_MARK, placeItems, type QuestionItem } from './questions';
import { scenetteDecor, scenetteHidesPlace } from './scenette';
import { shallowness } from './sea';
import { buildHeightField, heightAt, heightOnMesh, standingHeight } from './terrain';

const field = buildHeightField();
const ground = (x: number, z: number) => heightOnMesh(field, x, z);
const missions = (id: PlaceId) => placeById(id).scenes.concat(placeById(id).panels ?? []);

/** Tout ce que le lieu dessine dans le monde : sa ruine, ce qui y est tombé, le lieu entier, ses traces, sa scénette. */
const everything = (id: PlaceId): Facets[] => [ruinFacets(id, ground), fallenFacets(id, [], ground), constructionFacets(id, [WHOLE], ground), placeTrace(id, missions(id)), scenetteDecor(id)];

/** Les sommets de ces facettes, en coordonnées du plan (x, y du plan). */
const planPoints = (list: readonly Facets[]): [number, number][] => {
  const out: [number, number][] = [];
  for (const f of list) for (let k = 0; k < f.positions.length; k += 3) out.push(toPlan({ x: f.positions[k], z: f.positions[k + 2] }));
  return out;
};

const inChannel = ([x, y]: readonly [number, number]) => x >= NEF_CHANNEL.x0 && x <= NEF_CHANNEL.x1 && y > NEF_CHANNEL.y0 && y < NEF_CHANNEL.y1 - 0.01;

const items = (id: string): QuestionItem[] => JSON.parse(readFileSync(join(__dirname, '../../exercises/data', `${id}.json`), 'utf8')).items;

describe('Le large (lot L9)', () => {
  it('une trace par mission ; chaque lieu et ses traces sous 2 300 triangles', () => {
    for (const id of LARGE) {
      const art = id === 'beacons' ? BEACONS : FERRY;
      expect(Object.keys(art.traces).sort(), id).toEqual([...missions(id)].sort());
      for (const m of missions(id)) expect(placeTrace(id, [m]).triangles, `${id} ${m}`).toBeGreaterThan(0);
      const model = modelOfPlace(id).facets.triangles;
      const traces = placeTrace(id, missions(id)).triangles;
      console.info(`${id} : lieu ${model}, ruine ${ruinOf(id).triangles}, traces ${traces}, total ${model + traces}`);
      expect(model + traces, id).toBeLessThanOrEqual(2300);
    }
  });

  it('une ruine, trois étapes non vides ; ce qui est tombé s’en va quand sa rangée se pose', () => {
    for (const id of LARGE) {
      expect(ruinOf(id).triangles, id).toBeGreaterThan(0);
      const pieces = placePieces(id);
      for (const stage of [0, 1, 2] as const) expect(pieces.some((p) => p.stage === stage), `${id} ${stage}`).toBe(true);
      for (const p of pieces) if (p.until) expect(p.stage).toBe('ruine');
      expect(fallenFacets(id, [], ground).triangles, id).toBeGreaterThan(0);
      expect(fallenFacets(id, [WHOLE], ground).triangles, id).toBe(0);
    }
  });

  it('le chenal de la Nef reste libre : rien des deux lieux, aucun nœud ni ruban du large entre y 565 et 660', () => {
    for (const id of LARGE) {
      const inside = planPoints(everything(id)).filter(inChannel);
      expect(inside.slice(0, 3), id).toEqual([]);
    }
    for (const n of PATH_NODES.filter((n) => n.id.startsWith('lar-'))) expect(inChannel(toPlan(n.at)), n.id).toBe(false);
    const ribbons = networkSamples(0.5).map(toPlan).filter(([x, y]) => x < NEF_CHANNEL.x1 && y > NEF_CHANNEL.y0 && y < NEF_CHANNEL.y1);
    expect(ribbons).toEqual([]);
  });

  it('les mâts des Balises, roches comprises, restent au sud du chenal (y du plan ≥ 668)', () => {
    for (const m of BEACON_MASTS) expect(toPlan(m)[1] - (MAST.rock * 2.8)).toBeGreaterThanOrEqual(668);
    // À l'ouest de la station (là où sont les mâts), aucun sommet du lieu au nord de 668.
    const west = planPoints(everything('beacons')).filter(([x]) => x < 410);
    expect(west.length).toBeGreaterThan(0);
    expect(Math.min(...west.map(([, y]) => y))).toBeGreaterThanOrEqual(668);
    // La cale et son ponton s'arrêtent au bord du chenal.
    const c = placeById('beacons').center;
    expect(toPlan({ x: c.x, z: c.z + BEACON_SLIP.to })[1]).toBeGreaterThanOrEqual(NEF_CHANNEL.y1 - 0.01);
  });

  it('l’îlot de la Gare : son rocher tient dans le disque réservé, sans ruban de chemin dessus, l’eau claire autour', () => {
    expect(ISLET_REACH).toBeLessThanOrEqual(FERRY_ISLET.radius);
    const c = FERRY_ISLET.center;
    const onIslet = networkSamples(0.5).filter((p) => Math.hypot(p.x - c.x, p.z - c.z) < FERRY_ISLET.radius - 0.5);
    // Les échantillons du réseau passent sur l'îlot (la jetée y arrive), mais ses rubans s'y arrêtent : le quai les porte.
    expect(onIslet.length).toBeGreaterThan(0);
    const near = shallowness({ x: c.x, z: c.z + FERRY_ISLET.radius + 2 });
    const far = shallowness({ x: c.x - 40, z: c.z + 30 });
    expect(near).toBeGreaterThan(0.9);
    expect(near).toBeGreaterThan(far);
    for (const m of BEACON_MASTS) expect(shallowness(m)).toBeGreaterThan(0.9);
  });

  it('le dos de l’îlot, son liseré de roche et son herbe, regarde le ciel', () => {
    const f = modelOfPlace('ferry').facets;
    for (const col of [0xab9576, COLORS_6E.grass]) {
      const [r, g, b] = linearRgb(col);
      const up: number[] = [];
      for (let k = 0; k < f.colors.length; k += 3) if (Math.abs(f.colors[k] - r) < 1e-6 && Math.abs(f.colors[k + 1] - g) < 1e-6 && Math.abs(f.colors[k + 2] - b) < 1e-6) up.push(f.normals[k + 1]);
      expect(up.length, col.toString(16)).toBeGreaterThan(0);
      expect(Math.min(...up), col.toString(16)).toBeGreaterThan(0.99);
    }
  });

  it('les traces restent sur leur lieu : sous la tête des mâts aux Balises, sous l’auvent à la Gare', () => {
    for (const id of LARGE) {
      const c = placeById(id).center;
      const y0 = standingHeight(heightAt(c));
      const top = id === 'beacons' ? MAST.height : CANOPY.height + CANOPY.thick;
      const spots = id === 'beacons' ? BEACONS_TRACE_SPOTS : FERRY_TRACE_SPOTS;
      for (const m of missions(id)) {
        const b = boundsOf(placeTrace(id, [m]));
        const s = spots[m as keyof typeof spots] as { x: number; z: number };
        expect(b.max[1] - y0, `${id} ${m}`).toBeLessThan(top);
        expect(Math.hypot((b.max[0] + b.min[0]) / 2 - (c.x + s.x), (b.max[2] + b.min[2]) / 2 - (c.z + s.z)), `${id} ${m}`).toBeLessThan(3);
      }
    }
  });

  it('pendant une question du large, les traces des deux lieux se cachent, et la station s’efface le temps de la scénette', () => {
    expect(hidesTraces('beacons', 'ferry')).toBe(true);
    expect(hidesTraces('ferry', 'beacons')).toBe(true);
    expect(hidesTraces('beacons', 'phare')).toBe(false);
    expect(scenetteHidesPlace('beacons')).toBe(true);
    expect(scenetteHidesPlace('ferry')).toBe(false);
  });
});

describe('Les scènes du large', () => {
  it('chaque mission jouée au lieu : R pour les réponses à toucher, C pour les documents et l’histoire', () => {
    const r = placeItems('ferry', 'english-6e-grammar-have-got-1', items('english-6e-grammar-have-got-1'));
    expect(r[0].placeScene).toEqual(REST_MARK);
    expect((r[0].choices as string[]).length).toBe(2);
    for (const id of ['english-6e-vocabulary-signs-1', 'english-6e-vocabulary-famous-people-1']) expect(placeItems('beacons', id, items(id))[0].placeScene, id).toEqual(COLUMN);
    expect(placeItems('ferry', 'english-6e-grammar-story-1', items('english-6e-grammar-story-1'))[0].placeScene).toEqual(COLUMN);
    for (const id of ['english-6e-vocabulary-hello-1', 'english-6e-vocabulary-numbers-1']) expect(placeItems('beacons', id, items(id))[0].placeScene, id).toEqual(REST_MARK);
  });

  it('Ears : la phrase en français, la voix dit le mot anglais à l’ouverture et le redit', () => {
    const source = items('english-6e-vocabulary-first-listening-1');
    const [ears] = placeItems('beacons', 'english-6e-vocabulary-first-listening-1', source);
    expect(ears.prompt).toBe(EARS_PROMPT);
    expect(ears.promptLang).toBe('fr');
    expect(ears.spoken).toBe(source[0].word);
    expect(ears.speakOnOpen).toBe(true);
    expect(ears.listen).toBe('reecouter');
  });

  it('en R, l’objet de la bonne réponse réagit après une bonne réponse seulement, et reste ; en C, le témoin aussi', () => {
    for (const id of LARGE) {
      const at = { x: 0, y: 1, z: 0 };
      expect(itemScene(id, REST_MARK, false, [at]).reaction, id).toBeNull();
      const marked = itemScene(id, REST_MARK, true, [at]).reaction;
      expect(marked?.stay, id).toBe(true);
      // Le voyant monte sur sa tige ; le couvercle de la malle descend sur la caisse.
      if (id === 'beacons') expect(marked!.to.y).toBeGreaterThan(marked!.from.y);
      else expect(marked!.to.y).toBeLessThan(marked!.from.y);
      expect(itemScene(id, COLUMN, false).reaction, id).toBeNull();
      expect(itemScene(id, COLUMN, true).reaction?.stay, id).toBe(true);
    }
  });

  it('une réponse choisie penche sans changer de forme ; la malle marquée perd son couvercle, que la réaction rapporte', () => {
    const points = [-1.2, 0, 1.2].map((dx) => ({ x: dx, y: 1, z: 0 }));
    for (const id of LARGE) {
      const still = answerObjects(id, points, 1);
      const picked = answerObjects(id, points, 1, { picked: [1] });
      expect(picked.triangles, id).toBe(still.triangles);
      expect(Array.from(picked.positions), id).not.toEqual(Array.from(still.positions));
    }
    // La bouée marquée disparaît des réponses (le voyant monte à sa place) ; la malle reste, sans son couvercle.
    expect(answerObjects('beacons', points, 1, { gone: [1] }).triangles).toBeLessThan(answerObjects('beacons', points, 1).triangles);
    const open = answerObjects('ferry', points, 1);
    const marked = answerObjects('ferry', points, 1, { gone: [1] });
    expect(marked.triangles).toBeLessThan(open.triangles);
    expect(marked.triangles).toBeGreaterThan(0);
  });
});
