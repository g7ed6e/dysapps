// Le monde suit la disposition sauvegardée (GD-9) : un lieu déplacé et tourné (quatre orientations), lu dans la
// sauvegarde, emporte tout ce qui dépend de sa place (terrain, décor, îlot et Gardien, créature, bornes, liaisons,
// grande construction au large, cadrage de sa vue, commandes), dans les deux univers ; revenu à la carte de départ, le
// monde est exactement celui d'avant (aucun cache ne garde l'ancienne place).
import { afterEach, describe, expect, it } from 'vitest';
import type { BiomeId } from '../biomes';
import { sanitizeState, EMPTY_STATE } from '../engine';
import type { World } from '../engine/state';
import { applyLayout } from './appliedLayout';
import { freeSpots, isFixedPlace, linksToRelink, moveIsland, routesIn, startingSpot } from './arrange';
import { ARCHIPELAGO_IDS } from './archipelagos';
import { placesOf } from './routing';
import { toutConstruitAvecLesCommandes } from './budget';
import { PLAFOND_DU_MONDE_EN_BLOCS, worstCaseOfRegion } from './budget';
import { monumentIslet, poseOfSpot } from './footprint';
import { grilleDe } from './grid';
import { placedLinksOf } from './linkGeometry';
import { islandDef, startingIsland } from './map';
import { MONUMENT_ISLET, monumentsOf } from './monuments';
import { layoutVersion, ORIENTATIONS, type Quarts, turnCell, turnPoint } from './placement';
import type { Layout, LayoutTurn } from './savedLayout';
import { HABILLAGES } from './skin';
import { creaturePlacements, guardianPlacements, islandCenter, questStations, viewYaw, worldCubes } from './terrain';
import { monumentCenter } from './terrain/monuments';

afterEach(() => {
  applyLayout(undefined);
});

/** La Tour du lecteur (6e) : un lieu ordinaire, avec une grande construction au large, deux liaisons, une commande. */
const TOUR: BiomeId = 'french-6e-reading';

/** La partie toute construite, ses commandes livrées. */
const partie = toutConstruitAvecLesCommandes();

/** Une place libre de la Tour à l'orientation `q`, loin de sa place de départ. */
function placeLoin(q: LayoutTurn) {
  const d = startingSpot(TOUR);
  const libres = freeSpots(partie.world, TOUR, q).filter((s) => Math.abs(s.x - d.x) + Math.abs(s.y - d.y) >= 3);
  expect(libres.length, `orientation ${q}`).toBeGreaterThan(0);
  return libres[libres.length - 1];
}

/** La disposition lue comme la lit une sauvegarde (`sanitizeState`). */
function relue(layout: Layout): Layout | undefined {
  const s = sanitizeState(JSON.parse(JSON.stringify({ ...EMPTY_STATE, world: { ...partie.world, layout } })));
  return s.world.layout;
}

/** Les cubes d'un lieu dans le monde (sans ses liaisons ni sa grande construction), en texte. */
function cubesDuLieu(atelier: 'fabrique' | 'halle', world: World = partie.world): string[] {
  return worldCubes('6e', partie.progress, world, false, [], true, atelier)
    .filter((c) => c.tag === TOUR && !c.bridge && !c.place?.startsWith('monument:'))
    .map((c) => `${c.x},${c.y},${c.z},${c.color},${c.top ?? ''},${c.quest ?? ''},${c.muted ?? ''}`)
    .sort();
}

const cellules = (p: { origin: { x: number; y: number; z: number }; cubes: { x: number; y: number; z: number }[] }) =>
  p.cubes.map((c) => `${p.origin.x + c.x},${p.origin.y + c.y},${p.origin.z + c.z}`).sort();

for (const univers of ['blocland', 'archipeo'] as const)
  describe(`le monde suit la disposition sauvegardée (${univers})`, () => {
    const atelier = HABILLAGES[univers].atelier;

    for (const q of ORIENTATIONS)
      it(`un lieu déplacé, ${q} quart(s) de tour`, () => {
        const def0 = startingIsland(TOUR);
        const tourne = (x: number, y: number, pose: { x: number; y: number }) => {
          const t = turnCell(x - def0.core.x, y - def0.core.y, q as Quarts);
          return { x: pose.x + t.x, y: pose.y + t.y };
        };
        // Tout, sur la carte de départ.
        applyLayout(undefined);
        const cubes0 = worldCubes('6e', partie.progress, partie.world, false, [], true, atelier);
        const lieu0 = cubesDuLieu(atelier);
        const gardien0 = guardianPlacements('6e', partie.progress, partie.world.links, true).find((g) => g.id === TOUR)!;
        const creature0 = creaturePlacements('6e', partie.world.links).find((c) => c.id === TOUR)!;
        const m = monumentsOf('6e').find((x) => x.biome === TOUR)!;
        const ilot0 = monumentIslet(m);
        const yaw0 = viewYaw(TOUR);

        // La disposition, écrite par l'action et relue comme une sauvegarde.
        const spot = placeLoin(q);
        const r = moveIsland(partie.world, TOUR, spot);
        if (!r.ok) throw new Error(r.reason);
        const layout = relue(r.world.layout!)!;
        expect(layout).toEqual(r.world.layout);
        const avant = layoutVersion();
        applyLayout(layout);
        expect(layoutVersion()).not.toBe(avant);
        const pose = poseOfSpot('6e', spot);
        expect(islandDef(TOUR).core).toEqual({ x: pose.x, y: pose.y });
        expect(islandDef(TOUR).quarts).toBe(q);

        // Le terrain, le décor, les bornes et la commande livrée : les mêmes cubes, à la nouvelle place, tournés d'un bloc.
        const attendus = lieu0
          .map((k) => {
            const [x, y, ...reste] = k.split(',');
            const p = tourne(Number(x), Number(y), pose);
            return [p.x, p.y, ...reste].join(',');
          })
          .sort();
        expect(cubesDuLieu(atelier, r.world)).toEqual(attendus);
        // Les bornes, que la grille trouve sous leurs cubes.
        const grille = grilleDe('6e');
        const monde = worldCubes('6e', partie.progress, r.world, false, [], true, atelier);
        for (const st of questStations(TOUR)) {
          const p = grille.versMonde(grille.placeDe({ genre: 'borne', id: `${TOUR}:${st.typeId}` })!);
          expect(monde.some((c) => c.x === p.x && c.y === p.y && c.quest === `${TOUR}:${st.typeId}`)).toBe(true);
        }
        // Le Gardien sur son îlot, la créature.
        const gardien = guardianPlacements('6e', partie.progress, r.world.links, true).find((g) => g.id === TOUR)!;
        const attendre = (cells: string[]) =>
          cells
            .map((k) => {
              const [x, y, z] = k.split(',').map(Number);
              const p = tourne(x, y, pose);
              return `${p.x},${p.y},${z}`;
            })
            .sort();
        expect(cellules(gardien)).toEqual(attendre(cellules(gardien0)));
        const creature = creaturePlacements('6e', r.world.links).find((c) => c.id === TOUR)!;
        expect(cellules(creature)).toEqual(attendre(cellules(creature0)));
        // La grande construction au large suit son lieu ; son îlot reste carré.
        const ilot = monumentIslet(m);
        const n = MONUMENT_ISLET;
        const a0 = turnPoint(ilot0.x - def0.core.x, ilot0.y - def0.core.y, q as Quarts);
        const b0 = turnPoint(ilot0.x + n - def0.core.x, ilot0.y + n - def0.core.y, q as Quarts);
        expect(ilot).toEqual({ x: pose.x + Math.min(a0.x, b0.x), y: pose.y + Math.min(a0.y, b0.y) });
        const milieu = Math.floor(n / 2);
        expect(monde.some((c) => c.place === `monument:${m.id}` && c.x === ilot.x + milieu && c.y === ilot.y + milieu)).toBe(true);
        expect(monumentCenter(m).x).toBe(ilot.x + (n - 1) / 2);
        // La vue du lieu tourne avec lui ; le centre de l'île (étiquette, Carte) la suit.
        expect(viewYaw(TOUR)).toBeCloseTo(yaw0 + (q * Math.PI) / 2, 9);
        expect(islandCenter(TOUR).x).toBe(pose.x + 8);
        // Ses liaisons arrivent sur sa côte, ou attendent d'être reposées.
        const relink = linksToRelink(r.world, '6e');
        for (const [id, t] of routesIn(r.world, '6e')) if (t && (t.depuis.lieu === TOUR || t.vers.lieu === TOUR)) expect(relink).not.toContain(id);

        // Revenu à la carte de départ : le monde d'avant, à l'identique.
        applyLayout(undefined);
        expect(islandDef(TOUR)).toBe(def0);
        expect(JSON.stringify(worldCubes('6e', partie.progress, partie.world, false, [], true, atelier))).toBe(JSON.stringify(cubes0));
      });
  });

describe('les liaisons à reposer quittent le dessin', () => {
  it('une liaison à reposer n’est ni tracée ni dessinée ; la carte de départ la rend', () => {
    const lien = placedLinksOf('6e', partie.world.links).find((b) => b.cost > 0)!;
    const avec = worldCubes('6e', partie.progress, partie.world, false).filter((c) => c.bridge === lien.id && !c.ghost).length;
    expect(avec).toBeGreaterThan(0);
    applyLayout({ '6e': { relink: [lien.id] } });
    expect(placedLinksOf('6e', partie.world.links).map((b) => b.id)).not.toContain(lien.id);
    expect(worldCubes('6e', partie.progress, partie.world, false).filter((c) => c.bridge === lien.id && !c.ghost).length).toBe(0);
    applyLayout(undefined);
    expect(worldCubes('6e', partie.progress, partie.world, false).filter((c) => c.bridge === lien.id && !c.ghost).length).toBe(avec);
  });

  it('la même disposition ne refait rien ; une autre vide les caches', () => {
    const layout: Layout = { '6e': { relink: [placedLinksOf('6e', partie.world.links).find((b) => b.cost > 0)!.id] } };
    const v = applyLayout(layout);
    expect(applyLayout(layout)).toBe(v);
    expect(applyLayout(undefined)).not.toBe(v);
  });
});

describe('le budget, des lieux déplacés et tournés (GD-9)', () => {
  it.each(ARCHIPELAGO_IDS)('%s : le pire cas reste sous 88 000 triangles et 240 appels', (a) => {
    // Chaque lieu qui bouge, tourné d'un quart et posé à la place libre la plus loin de la sienne.
    let w: World = partie.world;
    for (const id of placesOf(a)) {
      if (isFixedPlace(id)) continue;
      const d = startingSpot(id);
      const ecart = (s: { x: number; y: number }) => Math.abs(s.x - d.x) + Math.abs(s.y - d.y);
      const loin = [...freeSpots(w, id, 1)].sort((p, s) => ecart(s) - ecart(p))[0];
      const r = loin ? moveIsland(w, id, loin) : null;
      if (r?.ok) w = r.world;
    }
    expect(Object.keys(w.layout?.[a]?.islands ?? {}).length).toBeGreaterThanOrEqual(2);
    applyLayout(w.layout);
    const pire = worstCaseOfRegion(a);
    expect(pire.triangles).toBeLessThanOrEqual(PLAFOND_DU_MONDE_EN_BLOCS.triangles);
    expect(pire.drawCalls).toBeLessThanOrEqual(PLAFOND_DU_MONDE_EN_BLOCS.drawCalls);
  });
});
