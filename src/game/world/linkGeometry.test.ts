// Les liaisons que pose l'élève (GD-9) : sur la carte de départ calée sur le pas, chaque lieu peut être relié ; une
// liaison est droite ou en L à un seul coude, ne coupe ni un lieu ni une autre liaison, coûte le même prix partout
// dans la région ; un pont jusqu'à 36 cases, un bac au-delà. Une sauvegarde d'avant garde toutes ses liaisons.
import { afterEach, describe, expect, it } from 'vitest';
import { BIOMES } from '../biomes';
import {
  ARCHIPELAGOS,
  BRIDGES,
  LINK_PRICE,
  LINKS_BEFORE_GD9,
  buildableBridges,
  bridgeState,
  getBridge,
  islandsOf,
  linksToIsland,
  opensAnIsland,
  reachableIslands,
  relierLaRegion,
  VOYAGES,
  remainingPath,
} from './archipelago';
import { ARCHIPELAGO_IDS } from './archipelagos';
import { cadreDe, ECART_ENTRE_LES_LIEUX } from './footprint';
import { liaisonsPoseesDe, linkKind, poserLesLiaisons } from './linkGeometry';
import { archipelagoOfIsland, DANS_LE_CIEL, isLand, isthmusOf, mapOf } from './map';
import { PAS } from './placement';
import { ecartsTropPetits, liaisonEntreReunis, LONGUEUR_COURTE, LONGUEUR_LONGUE } from './routing';
import { avatarRoute, BAC_LONG, bridgePath, cadreDeTraversee, casesDeLOuvrage } from './terrain';

afterEach(() => poserLesLiaisons([]));

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
    it(`${a} : chaque lieu au pas depuis le coin du cadre (le second d'une paire réunie, aussi), dans le cadre, à ${ECART_ENTRE_LES_LIEUX} cases d'eau des autres`, () => {
      const c = cadreDe(a);
      for (const d of mapOf(a)) {
        expect(((d.core.x - c.x0) % PAS + PAS) % PAS, d.id).toBe(0);
        expect(((d.core.y - c.y0) % PAS + PAS) % PAS, d.id).toBe(0);
      }
      expect(ecartsTropPetits(a, mapOf(a))).toEqual([]);
    });
});

describe('relier toute une région', () => {
  for (const a of ARCHIPELAGOS)
    it(`${a.classe} : chaque lieu s'ouvre par une liaison, droite ou en L, sans en couper une autre ni un lieu`, () => {
      const links = relierLaRegion(a.classe, VOYAGES.map((v) => v.id));
      poserLesLiaisons(links);
      const ouverts = reachableIslands(links);
      for (const b of islandsOf(a.classe)) expect(ouverts.has(b.id), b.id).toBe(true);
      const posees = liaisonsPoseesDe(a.classe).filter((b) => !liaisonEntreReunis(b));
      const traces = posees.map((b) => ({ b, cases: bridgePath(b) }));
      for (const { b, cases } of traces) {
        expect(cases.length, b.id).toBeGreaterThan(0);
        expect(cases.length, b.id).toBeLessThanOrEqual(LONGUEUR_LONGUE);
        expect(coudes(cases), b.id).toBeLessThanOrEqual(1);
        // Chaque pas va d'une case à sa voisine, jamais en biais.
        for (let i = 1; i < cases.length; i++) expect(Math.abs(cases[i].x - cases[i - 1].x) + Math.abs(cases[i].y - cases[i - 1].y), b.id).toBe(1);
        // Sur l'eau : jamais sur la terre d'un lieu.
        for (const c of cases) for (const d of mapOf(a.classe)) expect(isLand(d, c.x, c.y), `${b.id} sur ${d.id} (${c.x}, ${c.y})`).toBe(false);
        // Un pont jusqu'à 36 cases, un bac au-delà (dans le ciel, toujours un pont).
        expect(b.kind, b.id).toBe(cases.length <= LONGUEUR_COURTE || DANS_LE_CIEL[a.classe] ? 'pont' : 'bac');
      }
      // Deux liaisons ne se croisent ni ne se frôlent.
      for (let i = 0; i < traces.length; i++)
        for (let j = i + 1; j < traces.length; j++)
          for (const p of traces[i].cases)
            for (const q of traces[j].cases) expect(Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)), `${traces[i].b.id} et ${traces[j].b.id}`).toBeGreaterThanOrEqual(2);
    });

  it('un bac au coude d’une liaison en L y pose un cube plein, où la corde tourne', () => {
    for (const a of ARCHIPELAGOS) {
      const links = relierLaRegion(a.classe, VOYAGES.map((v) => v.id));
      poserLesLiaisons(links);
      for (const b of liaisonsPoseesDe(a.classe)) {
        const cases = casesDeLOuvrage(b);
        const coude = cases.filter((c) => c.coude);
        expect(coude.length, b.id).toBeLessThanOrEqual(1);
        if (coude.length) expect(coudes(cases), b.id).toBe(1);
      }
    }
  });
});

describe('le prix et la nature d’une liaison', () => {
  it('une liaison entre chaque paire de lieux d’une région, au même prix : 4 blocs en 6e, 5 ailleurs ; le pont du départ gratuit', () => {
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
    expect(bridgePath(b).length).toBeGreaterThan(0);
  });

  it('un sentier entre deux lieux réunis ; la Ferme et la Tour ne le sont plus', () => {
    expect(linkKind(getBridge('french-6e-phonology-french-6e-letter-confusion')!)).toBe('sentier');
    expect(isthmusOf('french-6e-grammar-spelling')).toBeNull();
    expect(getBridge('french-6e-grammar-spelling-french-6e-reading')!.kind).not.toBe('sentier');
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
      if (bridgePath(b).length === 0 && !liaisonEntreReunis(b)) expect(bridgeState(b, BRIDGES.filter((x) => x.cost === 0).map((x) => x.id)), b.id).not.toBe('buildable');
  });

  it('au-delà de 36 cases sur une liaison, la caméra cadre la traversée du départ à l’arrivée', () => {
    const open = reachableIslands([]);
    const long = BRIDGES.find((b) => archipelagoOfIsland(b.from) === '6e' && opensAnIsland(b, open) && bridgeState(b, []) === 'buildable' && bridgePath(b).length > BAC_LONG)!;
    expect(long).toBeDefined();
    poserLesLiaisons([long.id]);
    const depart = open.has(long.from) ? long.from : long.to;
    const route = avatarRoute(depart, depart === long.from ? long.to : long.from, [long.id])!;
    expect(cadreDeTraversee('6e', route)).not.toBeNull();
  });
});

describe('une sauvegarde d’avant les liaisons posées par l’élève', () => {
  it('garde chaque liaison construite : les mêmes lieux ouverts, et chacune dessinée (son tracé d’origine si le traceur ne la refait pas)', () => {
    const liaisons = LINKS_BEFORE_GD9.filter((b) => b.cost > 0).map((b) => b.id);
    const avant = [...liaisons, ...VOYAGES.map((v) => v.id)];
    poserLesLiaisons(avant);
    const ouverts = reachableIslands(avant);
    for (const b of BIOMES) expect(ouverts.has(b.id), b.id).toBe(true);
    for (const id of liaisons) {
      const b = getBridge(id)!;
      expect(b, id).toBeDefined();
      expect(bridgeState(b, avant), id).toBe('built');
      expect(bridgePath(b).length, id).toBeGreaterThan(0);
    }
  });
});
