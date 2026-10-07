// Le mode « Aménager » (GD-9, L5) : choisir, caler le fantôme sur la place libre la plus proche, le décaler aux
// flèches jusqu'à « Plus de place par là », le tourner, le poser ; la phrase dit toujours où ; le dessin du choix
// montre le fantôme en pointillés, les places autour de lui seulement, les liaisons retracées et celles barrées.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../biomes';
import type { World } from '../engine/state';
import { DIRECTION_STEP, DIRECTIONS, freeSpots, guardianOf, isFreeSpot, linksToRelink, placeIn, spotOf, stationOf } from './arrange';
import { isLandInWorld, mapOf } from './map';
import {
  type ArrangeChoice,
  choiceFits,
  choiceMiddle,
  dragChoice,
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
import { landRectangle } from './footprint';
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
    const t = turnChoice(c);
    if (t.genre !== 'lieu') throw new Error('lieu');
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
    const c = snapChoice(w, chooseGuardian(w, VOLCAN)!, { x: 0, y: 1000 });
    if (c.genre !== 'gardien') throw new Error('gardien');
    // La place libre la plus proche du point : contre son lieu ou détachée (choix 4a), jamais celle d'où il part.
    expect(c.place.spot !== undefined || c.place.side !== 'front' || c.place.step !== 0).toBe(true);
    expect(choiceSentence(w, c)).toMatch(/^Le Gardien du Volcan des décimaux : .+ de son île\.$/);
    const r = poseChoice(w, c);
    if (!r.ok) throw new Error(r.reason);
    expect(guardianOf(r.world, VOLCAN).side).toBe(c.place.side);
    expect(guardianOf(r.world, VOLCAN).spot).toEqual(c.place.spot);
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

describe('glisser au doigt (7 octobre 2026, choix 1b, 2a, 3a, 6a du mainteneur)', () => {
  /** Le coût de la grille et de l'empreinte d'un dessin : deux triangles par carré, barres comprises. */
  const coutDuSol = (v: ReturnType<typeof arrangeView>) => 2 * v.cases.filter((k) => ['grille', 'empreinte', 'conflit', 'barre'].includes(k.genre)).length;

  it('un lieu suit le doigt place par place, libre ou prise ; la grille et l’empreinte se dessinent, les flèches se cachent', () => {
    const w = partie();
    const c = chooseIsland(w, VOLCAN)!;
    if (c.genre !== 'lieu') throw new Error('lieu');
    const m = choiceMiddle(w, c)!;
    // Sur sa place : rien ne bouge.
    expect(dragChoice(w, c, { x: m.x + 1, y: m.y - 1 })).toEqual(c);
    // Une place libre plus loin, puis une place prise (sur un voisin) : le fantôme y va quand même.
    const libre = freeSpots(w, VOLCAN).find((s) => Math.abs(s.x - c.spot.x) + Math.abs(s.y - c.spot.y) > 3)!;
    const versLibre = dragChoice(w, c, choiceMiddle(w, { ...c, spot: libre })!);
    expect(versLibre).toEqual({ ...c, spot: libre });
    expect(choiceFits(w, versLibre)).toBe(true);
    const voisin = mapOf('6e').find((d) => d.id !== VOLCAN)!.id;
    const surVoisin = dragChoice(w, c, { x: placeIn(w, voisin).core.x + 8, y: placeIn(w, voisin).core.y + 8 });
    if (surVoisin.genre !== 'lieu') throw new Error('lieu');
    expect(choiceFits(w, surVoisin)).toBe(false);
    // Pendant le glissé : la grille (9 × 9 places autour), l'empreinte, pas de places jaunes ni de poignées.
    const v = arrangeView(w, versLibre, true);
    expect(v.poignees).toBeUndefined();
    expect(v.cases.some((k) => k.genre === 'place')).toBe(false);
    const grille = v.cases.filter((k) => k.genre === 'grille');
    expect(grille.length).toBeGreaterThan(15);
    // La grille ne se pose que sur l'eau : jamais sur la terre d'un lieu, ni sur le lieu soulevé à sa place d'avant.
    for (const k of grille)
      for (const d of mapOf('6e')) {
        const t = landRectangle(placeIn(w, d.id));
        expect(k.x >= t.x0 && k.x < t.x1 && k.y >= t.y0 && k.y < t.y1, d.id).toBe(false);
      }
    // L'empreinte libre : le jaune des places libres sur son socle sombre ; la zone où les étiquettes s'estompent.
    expect(v.cases.filter((k) => k.genre === 'empreinte').length).toBeGreaterThan(0);
    expect(v.cases.filter((k) => k.genre === 'socle').length).toBe(v.cases.filter((k) => k.genre === 'empreinte').length);
    expect(v.zoneDuGlisse).toBeDefined();
    expect(v.cases.some((k) => k.genre === 'conflit')).toBe(false);
    // Le nom du choix se pose au bord nord de l'empreinte (au-dessus d'elle à l'écran), jamais sur elle.
    const empreinte = v.cases.filter((k) => k.genre === 'empreinte');
    const nordDeLEmpreinte = DIRECTION_STEP.nord.dy > 0 ? Math.max(...empreinte.map((k) => k.y)) : Math.min(...empreinte.map((k) => k.y));
    expect(v.nomAuNord).toBeDefined();
    expect(Math.abs(v.nomAuNord!.y - nordDeLEmpreinte)).toBeLessThanOrEqual(4);
    expect(v.nomAuNord!.x).toBeGreaterThanOrEqual(Math.min(...empreinte.map((k) => k.x)));
    expect(v.nomAuNord!.x).toBeLessThanOrEqual(Math.max(...empreinte.map((k) => k.x)));
    expect(arrangeView(w, versLibre).nomAuNord).toBeUndefined();
    // Sur une place prise : les cases en conflit en gris pierre, chacune barrée de deux barres (jamais la couleur seule).
    const vp = arrangeView(w, surVoisin, true);
    const conflits = vp.cases.filter((k) => k.genre === 'conflit').length;
    expect(conflits).toBeGreaterThan(0);
    expect(vp.cases.filter((k) => k.genre === 'barre').length).toBe(2 * conflits);
    // Hors du glissé : rien de tout cela, les flèches reviennent.
    const hors = arrangeView(w, versLibre);
    expect(hors.poignees).toBeDefined();
    expect(hors.cases.some((k) => k.genre === 'grille' || k.genre === 'empreinte')).toBe(false);
  });

  it('la grille et l’empreinte tiennent sous ~400 triangles pour chaque lieu et chaque Gardien, libre ou en conflit', () => {
    const w = partie();
    let pire = 0;
    for (const id of mapOf('6e').map((d) => d.id)) {
      const choix = [chooseIsland(w, id), chooseGuardian(w, id)].filter((c) => c !== null);
      for (const c of choix) {
        const m = choiceMiddle(w, c)!;
        for (const [dx, dy] of [[0, 0], [12, 0], [0, -12], [-20, 8]]) pire = Math.max(pire, coutDuSol(arrangeView(w, dragChoice(w, c, { x: m.x + dx, y: m.y + dy }), true)));
      }
    }
    expect(pire).toBeGreaterThan(0);
    expect(pire).toBeLessThanOrEqual(420);
  });

  it('un Gardien se glisse comme un lieu, détaché loin de son lieu : une ligne en pointillés les relie', () => {
    const w = partie();
    const c = chooseGuardian(w, VOLCAN)!;
    const m = choiceMiddle(w, c)!;
    const loin = dragChoice(w, c, { x: m.x + 40, y: m.y + 8 });
    if (loin.genre !== 'gardien') throw new Error('gardien');
    expect(loin.place.spot).toBeDefined();
    const ligne = arrangeView(w, loin).cases.filter((k) => k.genre === 'lien');
    expect(ligne.length).toBeGreaterThan(1);
    // Au-dessus des radeaux, chaque point sur son socle sombre.
    expect(ligne.every((k) => k.dessus)).toBe(true);
    // Elle part d'un coin de la terre de son lieu, jamais du coin nord-est, où se pose « Tourner ».
    const t = landRectangle(placeIn(w, VOLCAN));
    const ne = { x: DIRECTION_STEP.est.dx > 0 ? t.x1 - 1 : t.x0, y: DIRECTION_STEP.nord.dy > 0 ? t.y1 - 1 : t.y0 };
    expect([t.x0, t.x1 - 1]).toContain(ligne[0].x);
    expect([t.y0, t.y1 - 1]).toContain(ligne[0].y);
    expect(ligne[0].x === ne.x && ligne[0].y === ne.y).toBe(false);
    // Contre son lieu, pas de ligne.
    expect(arrangeView(w, c).cases.some((k) => k.genre === 'lien')).toBe(false);
  });

  it('le Gardien d’un lieu encore fermé ne se choisit pas (choix 6a)', () => {
    const w = partie();
    const ferme: World = { ...w, links: [] };
    const lieu = mapOf('6e').find((d) => !startingPlaces('6e').includes(d.id))!.id;
    expect(chooseGuardian(ferme, lieu)).toBeNull();
    expect(chooseGuardian(w, lieu)).not.toBeNull();
  });
});
