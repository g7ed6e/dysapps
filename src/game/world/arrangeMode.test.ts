// Le mode « Aménager » (GD-9, L5) : choisir, caler le fantôme sur la place libre la plus proche, le décaler aux
// flèches jusqu'à « Plus de place par là », le tourner, le poser ; la phrase dit toujours où ; le dessin du choix
// montre le fantôme en pointillés, les places autour de lui seulement, les liaisons retracées et celles barrées.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../biomes';
import type { World } from '../engine/state';
import { DIRECTIONS, freeSpots, guardianOf, isFreeSpot, linksToRelink, placeIn, spotOf, stationOf } from './arrange';
import { isLandInWorld, mapOf } from './map';
import {
  type ArrangeChoice,
  choiceFits,
  chooseGuardian,
  chooseIsland,
  chooseLanding,
  chooseLinkEnd,
  chooseRelink,
  chooseStation,
  choiceSentence,
  poseChoice,
  poseSentence,
  snapChoice,
  stepChoice,
  turnChoice,
  turnGuardianNow,
} from './arrangeMode';
import { arrangeView } from './arrangeView';
import { toutConstruit } from './budget';
import { questStations } from './terrain/markers';
import { startingPlaces } from './routing';

const partie = (): World => toutConstruit().world;
const VOLCAN: BiomeId = 'maths-6e-decimals';

describe('choisir', () => {
  it('le lieu de départ ne se choisit pas ; un autre lieu part de sa place', () => {
    const w = partie();
    expect(chooseIsland(w, startingPlaces('6e')[0])).toBeNull();
    expect(chooseIsland(w, VOLCAN)).toEqual({ genre: 'lieu', id: VOLCAN, spot: spotOf(w, VOLCAN) });
    expect(chooseGuardian(w, VOLCAN)).toEqual({ genre: 'gardien', id: VOLCAN, place: { side: 'front', step: 0 } });
    expect(chooseStation(w, `${VOLCAN}:inconnue`)).toBeNull();
  });
});

describe('un lieu : caler, décaler, tourner, poser', () => {
  it('toucher la mer cale le fantôme sur une place libre ; les flèches avancent d’un cran, libre ou pris, jusqu’au bord', () => {
    const w = partie();
    const c = chooseIsland(w, VOLCAN)!;
    const cale = snapChoice(w, c, { x: 0, y: 0 });
    if (cale.genre !== 'lieu') throw new Error('lieu');
    expect(isFreeSpot(w, VOLCAN, cale.spot)).toBe(true);
    expect(choiceFits(w, cale)).toBe(true);
    let prise: ArrangeChoice | null = null;
    for (const dir of DIRECTIONS) {
      let s = stepChoice(w, cale, dir);
      let n = 0;
      // Au bout, « Plus de place par là » (null), au bord de la carte seulement.
      while (s && n < 200) {
        if (s.genre !== 'lieu') throw new Error('lieu');
        expect(choiceFits(w, s)).toBe(isFreeSpot(w, VOLCAN, s.spot));
        if (!choiceFits(w, s)) prise ??= s;
        s = stepChoice(w, s, dir);
        n++;
      }
      expect(s).toBeNull();
    }
    // Sur une place prise : « Poser » refuse, et le dessin montre la croix grise (dans les poignées).
    expect(prise).not.toBeNull();
    expect(poseChoice(w, prise!)).toEqual({ ok: false, reason: 'occupee' });
    expect(arrangeView(w, prise!).poignees?.prise).toBeDefined();
    expect(arrangeView(w, cale).poignees?.prise).toBeUndefined();
  });

  it('« Tourner » fait pivoter le fantôme sur place, même sur une place prise (choix 3)', () => {
    const w = partie();
    const c = chooseIsland(w, VOLCAN)!;
    if (c.genre !== 'lieu') throw new Error('lieu');
    const t = turnChoice(w, c);
    if (t?.genre !== 'lieu') throw new Error('lieu');
    expect(t.spot).toEqual({ ...c.spot, turn: (c.spot.turn + 1) % 4 });
    expect(choiceFits(w, t)).toBe(isFreeSpot(w, VOLCAN, t.spot));
    // Sur une place libre, tourné : « Poser » le pose, et la phrase le dit.
    const libre = snapChoice(w, t, { x: 0, y: 0 });
    if (libre.genre !== 'lieu') throw new Error('lieu');
    expect(libre.spot.turn).toBe(t.spot.turn);
    expect(choiceSentence(w, libre)).toMatch(/^Volcan des décimaux : (à l’|au )\S+.* de (la |l’|du ).+, à \d+ cases?\.$/);
    const r = poseChoice(w, libre);
    if (!r.ok) throw new Error(r.reason);
    expect(spotOf(r.world, VOLCAN)).toEqual(libre.spot);
    expect(poseSentence(r.world, libre)).toMatch(/^Volcan des décimaux : /);
  });

  it('« Tourner » ne fait pas pivoter le fantôme d’un lieu qui, tourné, n’a aucune place libre (HG-3, consultant UX UI)', () => {
    // Le Glacier des relatifs (5e) et la Gare du futur (4e) depuis HG-3, la Grammaire (5e) et le Refuge des carnets (3e)
    // depuis SC-3 : `SANS_PLACE` (arrange.test.ts). La ligne dit alors le refus (Arranging.tsx).
    const w = partie();
    for (const id of ['maths-5e-signed-numbers', 'english-5e-grammar', 'english-4e-grammar', 'lv2-3e-travel'] as BiomeId[]) {
      const c = chooseIsland(w, id);
      if (c?.genre !== 'lieu') throw new Error(id);
      expect(freeSpots(w, id, ((c.spot.turn + 1) % 4) as 0 | 1 | 2 | 3), id).toEqual([]);
      expect(turnChoice(w, c), id).toBeNull();
    }
  });

  it('les places autour qui colleraient le lieu à un voisin portent l’icône de « Réunir » (choix 2a)', () => {
    const w = partie();
    const TOUR = 'french-6e-reading' as BiomeId;
    const c = chooseIsland(w, TOUR)!;
    const v = arrangeView(w, c);
    const reunions = v.reunions ?? [];
    expect(reunions.length).toBeGreaterThan(0);
    // Chaque icône est sur la jointure, sur l'eau où irait la construction : jamais sur une terre (ni celle du lieu
    // choisi, ni à sa place d'aujourd'hui), à fleur d'eau ; une par voisin au plus.
    const places = v.cases.filter((x) => x.genre === 'place');
    for (const r of reunions) {
      for (const l of mapOf('6e').map((d) => d.id)) expect(isLandInWorld(placeIn(w, l), Math.floor(r.x), Math.floor(r.y)), l).toBe(false);
      expect(r.z).toBe(places[0].z + 1);
    }
    // Pas toutes : seulement celles qui le colleraient à un voisin.
    expect(reunions.length).toBeLessThan(places.length);
  });

  it('le dessin du choix : fantôme en pointillés, places autour seulement, liaisons retracées, barrées avec une croix', () => {
    const w = partie();
    const c = snapChoice(w, chooseIsland(w, VOLCAN)!, { x: 200, y: 200 });
    if (c.genre !== 'lieu') throw new Error('lieu');
    const v = arrangeView(w, c);
    const fantome = v.cases.filter((x) => x.genre === 'fantome');
    expect(fantome.length).toBeGreaterThan(20);
    // Pointillés : jamais deux cases voisines.
    const k = new Set(fantome.map((x) => `${x.x},${x.y}`));
    for (const x of fantome) expect(k.has(`${x.x + 1},${x.y}`) || k.has(`${x.x},${x.y + 1}`)).toBe(false);
    // Les places montrées : moins que toutes les places libres.
    expect(v.cases.filter((x) => x.genre === 'place').length).toBeLessThan(freeSpots(w, VOLCAN).length);
    // Loin de ses voisins, ses liaisons ne tiennent plus : barrées, chacune sous une croix.
    const barrees = v.barrees.length;
    expect(v.cases.filter((x) => x.genre === 'croix').length).toBe(barrees * 5);
    const r = poseChoice(w, c);
    if (!r.ok) throw new Error(r.reason);
    expect(r.relink).toEqual(v.barrees);
    expect(v.souleve).not.toBeNull();
  });

  it('le dessin du choix se calcule vite (un toucher, une flèche)', () => {
    const w = partie();
    const c = chooseIsland(w, VOLCAN)!;
    arrangeView(w, c);
    const t0 = performance.now();
    for (let i = 0; i < 5; i++) arrangeView(w, snapChoice(w, c, { x: 40 * i, y: 30 * i }));
    expect((performance.now() - t0) / 5).toBeLessThan(400);
  });
});

describe('un Gardien, une borne, une arrivée, une liaison à reposer', () => {
  it('un Gardien se cale autour de son lieu, se pose, et tourne avec sa phrase', () => {
    const w = partie();
    const c = snapChoice(w, chooseGuardian(w, VOLCAN), { x: 0, y: 1000 });
    if (c.genre !== 'gardien') throw new Error('gardien');
    expect(c.place.side).not.toBe('front');
    expect(choiceSentence(w, c)).toMatch(/^Le Gardien du Volcan des décimaux : .+ de son île\.$/);
    const r = poseChoice(w, c);
    if (!r.ok) throw new Error(r.reason);
    expect(guardianOf(r.world, VOLCAN).side).toBe(c.place.side);
    const t = turnGuardianNow(r.world, VOLCAN);
    expect(t.sentence).toMatch(/^Il regarde/);
    expect(arrangeView(w, c).cases.some((x) => x.genre === 'fantome')).toBe(true);
  });

  it('une borne se décale dans la bande de devant et se pose', () => {
    const w = partie();
    const key = `${VOLCAN}:${questStations(VOLCAN)[0].typeId}`;
    const c = chooseStation(w, key)!;
    // Un cran, puis un autre, jusqu'à une place libre de la bande (les places prises se montrent, sans se poser).
    const crans = DIRECTIONS.flatMap((d) => {
      const out: NonNullable<ReturnType<typeof stepChoice>>[] = [];
      for (let s = stepChoice(w, c, d); s && out.length < 20; s = stepChoice(w, s, d)) out.push(s);
      return out;
    });
    const ailleurs = crans.find((s) => choiceFits(w, s))!;
    expect(ailleurs).toBeTruthy();
    for (const s of crans) if (!choiceFits(w, s)) expect(poseChoice(w, s).ok).toBe(false);
    expect(choiceSentence(w, ailleurs)).toMatch(/^La borne, à la place \d+ sur \d+ de la rangée des bornes du Volcan des décimaux, en partant de la gauche\.$/);
    const r = poseChoice(w, ailleurs);
    if (!r.ok || ailleurs.genre !== 'borne') throw new Error('borne');
    expect(stationOf(r.world, key)).toEqual(ailleurs.place);
  });

  it('une arrivée se choisit au bout le plus proche, se décale et se pose', () => {
    const w = partie();
    const lien = w.links.find((id) => id.includes('decimals')) ?? w.links[0];
    const c = chooseLanding(w, lien, { x: 0, y: 0 });
    expect(c).not.toBeNull();
    const autre = DIRECTIONS.map((d) => stepChoice(w, c!, d)).find(Boolean);
    if (autre) expect(poseChoice(w, autre).ok).toBe(true);
    expect(choiceSentence(w, c!)).toMatch(/^L’arrivée, sur la côte (nord|sud|est|ouest) /);
    // La poignée d'un bout (choix 1a) choisit la même arrivée ; les flèches la mènent le long de la côte, d'un cran.
    expect(chooseLinkEnd(w, lien, c!.genre === 'arrivee' ? c!.end : 'from')).toEqual(c);
    expect(chooseLinkEnd(w, 'inconnue', 'from')).toBeNull();
  });

  it('une liaison séparée se repose entre deux voisins, gratuitement', () => {
    const w = partie();
    const c = snapChoice(w, chooseIsland(w, VOLCAN)!, { x: 200, y: 200 });
    const r = poseChoice(w, c);
    if (!r.ok) throw new Error(r.reason);
    const relink = linksToRelink(r.world, '6e');
    expect(relink.length).toBeGreaterThan(0);
    const l = chooseRelink(r.world, relink[0]);
    if (l.genre !== 'liaison') throw new Error('liaison');
    expect(choiceSentence(r.world, l)).toMatch(/^(La liaison à reposer, entre .+ et .+\.|Cette liaison ne se repose nulle part)/);
    if (l.to) {
      const p = poseChoice(r.world, l);
      expect(p.ok).toBe(true);
      if (p.ok) expect(linksToRelink(p.world, '6e')).not.toContain(relink[0]);
    }
  });
});
