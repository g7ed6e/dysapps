// Les liaisons que pose l'élève (GD-9) : sur la carte de départ calée sur le pas, chaque lieu peut être relié ; une
// liaison est droite ou en L à un seul coude, ne coupe ni un lieu ni une autre liaison, coûte le même prix partout
// dans la région ; un pont jusqu'à 36 cases, un bac au-delà. Une sauvegarde d'avant garde toutes ses liaisons.
import { thePlace } from './placeArticle';
import { describe, expect, it } from 'vitest';
import { BIOMES, getBiome } from '../biomes';
import { sanitizeState } from '../engine';
import { lockedHint } from './goals';
import { textesDe } from '../../universes';
import {
  ARCHIPELAGOS,
  BRIDGES,
  LINK_PRICE,
  NOMS_ARCHIPELS,
  LINKS_BEFORE_GD9,
  buildableBridges,
  bridgeState,
  getBridge,
  islandsOf,
  linkKind,
  linksToIsland,
  nearestDeparture,
  opensAnIsland,
  otherEnd,
  reachableIslands,
  linkWholeRegion,
  VOYAGES,
  remainingPath,
} from './archipelago';
import { ARCHIPELAGO_IDS } from './archipelagos';
import { frameOf, GAP_BETWEEN_PLACES, tooSmallGaps } from './footprint';
import { placedLinksOf } from './linkGeometry';
import { archipelagoOfIsland, DANS_LE_CIEL, isLand, isthmusOf, mapOf } from './map';
import { STEP } from './placement';
import { linkBetweenJoined, SHORT_LENGTH, LONG_LENGTH } from './routing';
import { avatarRoute, BAC_LONG, bridgePath, cadreDeTraversee, casesDeLOuvrage, worldCubes } from './terrain';

/** Le nombre de coudes d'un tracé : les changements de direction d'une case à la suivante. */
function coudes(cases: readonly { x: number; y: number }[]): number {
  let n = 0;
  for (let i = 2; i < cases.length; i++) {
    const a = `${cases[i - 1].x - cases[i - 2].x},${cases[i - 1].y - cases[i - 2].y}`;
    const b = `${cases[i].x - cases[i - 1].x},${cases[i].y - cases[i - 1].y}`;
    if (a !== b) n++;
  }
  return n;
}

describe('la carte de départ, calée sur le pas', () => {
  for (const a of ARCHIPELAGO_IDS)
    it(`${a} : chaque lieu au pas depuis le coin du cadre (le second d'une paire réunie, aussi), dans le cadre, à ${GAP_BETWEEN_PLACES} cases d'eau des autres`, () => {
      const c = frameOf(a);
      for (const d of mapOf(a)) {
        expect(((d.core.x - c.x0) % STEP + STEP) % STEP, d.id).toBe(0);
        expect(((d.core.y - c.y0) % STEP + STEP) % STEP, d.id).toBe(0);
      }
      expect(tooSmallGaps(a, mapOf(a))).toEqual([]);
    });
});

describe('relier toute une région', () => {
  for (const a of ARCHIPELAGOS)
    it(`${a.classe} : chaque lieu s'ouvre par une liaison, droite ou en L, sans en couper une autre ni un lieu`, () => {
      const links = linkWholeRegion(a.classe, VOYAGES.map((v) => v.id));
      const ouverts = reachableIslands(links);
      for (const b of islandsOf(a.classe)) expect(ouverts.has(b.id), b.id).toBe(true);
      const posees = placedLinksOf(a.classe, links).filter((b) => !linkBetweenJoined(b));
      const traces = posees.map((b) => ({ b, cases: bridgePath(b, links) }));
      for (const { b, cases } of traces) {
        expect(cases.length, b.id).toBeGreaterThan(0);
        expect(cases.length, b.id).toBeLessThanOrEqual(LONG_LENGTH);
        expect(coudes(cases), b.id).toBeLessThanOrEqual(1);
        // Chaque pas va d'une case à sa voisine, jamais en biais.
        for (let i = 1; i < cases.length; i++) expect(Math.abs(cases[i].x - cases[i - 1].x) + Math.abs(cases[i].y - cases[i - 1].y), b.id).toBe(1);
        // Sur l'eau : jamais sur la terre d'un lieu.
        for (const c of cases) for (const d of mapOf(a.classe)) expect(isLand(d, c.x, c.y), `${b.id} sur ${d.id} (${c.x}, ${c.y})`).toBe(false);
        // Un pont jusqu'à 36 cases, un bac au-delà (dans le ciel, toujours un pont).
        expect(linkKind(b, links), b.id).toBe(cases.length <= SHORT_LENGTH || DANS_LE_CIEL[a.classe] ? 'pont' : 'bac');
      }
      // Deux liaisons ne se croisent ni ne se frôlent.
      for (let i = 0; i < traces.length; i++)
        for (let j = i + 1; j < traces.length; j++)
          for (const p of traces[i].cases)
            for (const q of traces[j].cases) expect(Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)), `${traces[i].b.id} et ${traces[j].b.id}`).toBeGreaterThanOrEqual(2);
    });

  it('un bac au coude d’une liaison en L y pose un cube plein, où la corde tourne', () => {
    for (const a of ARCHIPELAGOS) {
      const links = linkWholeRegion(a.classe, VOYAGES.map((v) => v.id));
      for (const b of placedLinksOf(a.classe, links)) {
        const cases = casesDeLOuvrage(b, links);
        const coude = cases.filter((c) => c.coude);
        expect(coude.length, b.id).toBeLessThanOrEqual(1);
        if (coude.length) expect(coudes(cases), b.id).toBe(1);
      }
    }
  });
});

describe('le prix et la nature d’une liaison', () => {
  it('une liaison entre chaque paire de lieux d’une région, au même prix : 4 blocs en 6e, 5 ailleurs ; seul le pont du départ est gratuit', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const n = islandsOf(a).length;
      const ici = BRIDGES.filter((b) => archipelagoOfIsland(b.from) === a);
      expect(ici.length, a).toBe((n * (n - 1)) / 2);
      for (const b of ici) expect(b.cost === 0 || b.cost === LINK_PRICE[a], b.id).toBe(true);
    }
    expect(BRIDGES.filter((b) => b.cost === 0).map((b) => b.id)).toEqual(['french-6e-phonology-maths-6e-calculation']);
    expect(LINK_PRICE).toEqual({ '6e': 4, '5e': 5, '4e': 5, '3e': 5 });
  });

  it('les deux lieux ouverts au départ restent reliés, sans rien payer', () => {
    const b = getBridge('french-6e-phonology-maths-6e-calculation')!;
    expect(bridgeState(b, [])).toBe('built');
    expect(bridgePath(b, []).length).toBeGreaterThan(0);
  });

  it('plus aucun lieu réuni sur la carte de départ : la Forêt et la Mine, la Ferme et la Tour sont reliées par un pont', () => {
    expect(isthmusOf('french-6e-phonology')).toBeNull();
    expect(linkKind(getBridge('french-6e-phonology-french-6e-letter-confusion')!, [])).toBe('pont');
    expect(isthmusOf('french-6e-grammar-spelling')).toBeNull();
    expect(linkKind(getBridge('french-6e-grammar-spelling-french-6e-reading')!, [])).not.toBe('sentier');
  });

  it('la Baie et l’Horloge ne sont plus réunies : quatre cases d’eau au moins, un pont au prix de la classe', () => {
    expect(isthmusOf('english-6e-vocabulary')).toBeNull();
    const lieux = mapOf('6e').filter((d) => d.id === 'english-6e-vocabulary' || d.id === 'english-6e-grammar');
    expect(tooSmallGaps('6e', lieux)).toEqual([]);
    const b = getBridge('english-6e-vocabulary-english-6e-grammar')!;
    expect(b.cost).toBe(LINK_PRICE['6e']);
    expect(bridgeState(b, [])).not.toBe('built');
    expect(linkKind(b, [])).toBe('pont');
    expect(bridgePath(b, []).length).toBeGreaterThan(0);
  });
});

describe('relier un lieu fermé', () => {
  it('la liaison proposée part du lieu relié le plus proche ; les autres départs suivent, du plus court au plus long', () => {
    const open = reachableIslands([]);
    for (const b of buildableBridges([])) {
      if (!opensAnIsland(b, open)) continue;
      const ferme = open.has(b.from) ? b.to : b.from;
      const departs = linksToIsland(ferme, []);
      expect(departs[0]?.id, ferme).toBe(b.id);
      expect(remainingPath(ferme, [])[0]?.id, ferme).toBe(b.id);
    }
    // Sur le lieu fermé, tous ses départs possibles.
    const mine = 'french-6e-word-spelling';
    expect(buildableBridges([], mine).map((b) => b.id)).toEqual(linksToIsland(mine, []).map((b) => b.id));
  });

  it('une liaison qui ne tiendrait pas n’est pas proposée, et ne se pose pas', () => {
    for (const b of BRIDGES.filter((x) => archipelagoOfIsland(x.from) === '6e' && x.cost > 0))
      if (bridgePath(b, []).length === 0 && !linkBetweenJoined(b)) expect(bridgeState(b, BRIDGES.filter((x) => x.cost === 0).map((x) => x.id)), b.id).not.toBe('buildable');
  });

  it('au-delà de 36 cases sur une liaison, la caméra cadre la traversée du départ à l’arrivée', () => {
    // La première liaison longue qu'on peut poser, région après région, à l'arrivée.
    const cas = ARCHIPELAGOS.map((a) => {
      const arrivee = VOYAGES.slice(0, ARCHIPELAGOS.indexOf(a)).map((v) => v.id);
      const open = reachableIslands(arrivee);
      const long = BRIDGES.find((b) => archipelagoOfIsland(b.from) === a.classe && opensAnIsland(b, open) && bridgeState(b, arrivee) === 'buildable' && bridgePath(b, arrivee).length > BAC_LONG);
      return long ? { a: a.classe, arrivee, open, long } : null;
    }).find((c) => c !== null);
    expect(cas).toBeDefined();
    const { a, arrivee, open, long } = cas!;
    const depart = open.has(long.from) ? long.from : long.to;
    const route = avatarRoute(depart, depart === long.from ? long.to : long.from, [...arrivee, long.id])!;
    expect(cadreDeTraversee(a, [...arrivee, long.id], route)).not.toBeNull();
  });
});

describe('un seul départ pour « Relier », la phrase de l’île pâle et le fantôme du monde', () => {
  for (const a of ARCHIPELAGOS)
    it(`${a.classe} : à chaque étape de la région reliée, les trois disent le même départ`, () => {
      const arrivee = VOYAGES.slice(0, ARCHIPELAGOS.indexOf(a)).map((v) => v.id);
      const toutes = linkWholeRegion(a.classe, arrivee);
      // Du début de la région à la région toute reliée, une liaison de plus à chaque étape.
      for (let n = arrivee.length; n <= toutes.length; n += 2) {
        const links = toutes.slice(0, n);
        const state = sanitizeState({ world: { links } });
        const open = reachableIslands(links);
        const fantomes = new Set(worldCubes(a.classe, {}, { parts: {}, log: [], links }, false).filter((c) => c.ghost && c.bridge).map((c) => c.bridge!));
        for (const ile of islandsOf(a.classe)) {
          if (open.has(ile.id)) continue;
          const depart = nearestDeparture(ile.id, links, open);
          if (!depart) {
            // Sans liaison directe : pas de « Relier », pas de fantôme vers elle, la phrase dit l'île à relier d'abord.
            expect(lockedHint(state, ile.id, NOMS_ARCHIPELS, textesDe('blocland').libelles), ile.id).not.toContain('Pour venir ici');
            for (const id of fantomes) expect([getBridge(id)!.from, getBridge(id)!.to], id).not.toContain(ile.id);
            continue;
          }
          const depuis = getBiome(otherEnd(depart, ile.id))!.name;
          expect(lockedHint(state, ile.id, NOMS_ARCHIPELS, textesDe('blocland').libelles), ile.id).toContain(`depuis ${thePlace(depuis)} :`);
          expect(remainingPath(ile.id, links)[0]?.id, ile.id).toBe(depart.id);
          if (getBiome(ile.id)!.subject !== 'lv2') expect(fantomes.has(depart.id), `${ile.id} : ${depart.id}`).toBe(true);
          for (const autre of linksToIsland(ile.id, links, open).slice(1)) expect(fantomes.has(autre.id), autre.id).toBe(false);
        }
      }
    });
});

describe('une sauvegarde d’avant les liaisons posées par l’élève', () => {
  it('garde chaque liaison construite : les mêmes lieux ouverts, et chacune dessinée (son tracé d’origine si le traceur ne la refait pas)', () => {
    const liaisons = LINKS_BEFORE_GD9.filter((b) => b.cost > 0).map((b) => b.id);
    const avant = [...liaisons, ...VOYAGES.map((v) => v.id)];
    const ouverts = reachableIslands(avant);
    // Tous les lieux d'avant GD-9 ; les îles d'histoire-géographie de 6e, venues après (HG-2), restent à relier.
    for (const b of BIOMES) expect(ouverts.has(b.id), b.id).toBe(b.subject !== 'history-geography');
    for (const id of liaisons) {
      const b = getBridge(id)!;
      expect(b, id).toBeDefined();
      expect(bridgeState(b, avant), id).toBe('built');
      expect(bridgePath(b, avant).length, id).toBeGreaterThan(0);
    }
  });
});
