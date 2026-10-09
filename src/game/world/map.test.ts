import { BIOMES } from '../biomes';
import type { BiomeId } from '../biomes';
import { ALTITUDE, ARCHIPELAGO_IDS, type ArchipelagoId, CORE, etendueDuLieu, LACS, isLand, islandDef, landBox, landCells, landscape, mapOf, margesDuCoeur, MAP, reliefHeight } from './map';
import type { FormeDeLIle } from './formes';
import { footprintOf, frameOf, GAP_BETWEEN_PLACES, gapBetween, landRectangles } from './footprint';
import { silhouetteDe } from './silhouettes';
import { BRIDGES, LINKS_BEFORE_GD9, linkWholeRegion, VOYAGES } from './archipelago';
import { worldCubes } from './terrain';

it('chaque île a une place, une altitude selon sa classe, et son cœur fait partie de sa terre', () => {
  expect(MAP.map((d) => d.id).sort()).toEqual(BIOMES.map((b) => b.id).sort());
  for (const b of BIOMES) {
    const def = islandDef(b.id);
    expect(def.altitude).toBe(ALTITUDE[b.classe]);
    for (let x = 0; x < CORE; x++) for (let y = 0; y < CORE; y++) expect(isLand(def, def.core.x + x, def.core.y + y)).toBe(true);
    // Le contour déborde du cœur (au moins une case en plus), mais pas partout : contour irrégulier.
    const land = landCells(def);
    expect(land.length).toBeGreaterThan(CORE * CORE);
    const lb = landBox(def);
    expect(land.length).toBeLessThan((lb.x1 - lb.x0) * (lb.y1 - lb.y0));
  }
});

it('la côte écrite d’un lieu qui a une forme (GD-12) est celle de sa forme', () => {
  // La carte de départ l'écrit en dur, pour ne pas calculer un masque par lieu à l'import de map.ts. Les lieux des
  // Basses Terres (15), des Collines du Large (12) et des Monts de Feu (12) ont leur forme (GD-12) ; les Îles du Ciel la
  // prendront dans leur pull request (formes.test.ts compte les lieux de chaque archipel).
  const formes = MAP.filter((d) => silhouetteDe(d.id).forme);
  expect(formes.length).toBe(39);
  for (const d of formes) expect(d.ext, d.id).toEqual(etendueDuLieu(d, silhouetteDe(d.id).forme!));
});

/**
 * Les places gardées pour des îles futures (GD-12, coordination du 9 octobre 2026) : deux par archipel, l'éducation
 * morale et civique et le latin ou le grec, chacune avec un premier dessin de forme du catalogue, sans créer le lieu
 * (docs/gameplay/propositions/GD-12.md). Une île de la carte de départ ne s'y pose pas.
 */
const PLACES_FUTURES: Partial<Record<ArchipelagoId, readonly { nom: string; core: { x: number; y: number }; forme: FormeDeLIle }[]>> = {
  '5e': [
    { nom: 'EMC', core: { x: 29, y: 405 }, forme: { forme: 'trefle', vers: 'devant' } },
    { nom: 'latin ou grec', core: { x: 65, y: 405 }, forme: { forme: 'galet', vers: 'devant', short: true } },
  ],
  // Aux Monts de Feu, au rang du fond, entre la Vigie et le Bassin : l'EMC en trèfle derrière l'Escale, le latin ou le
  // grec en galet derrière le Théâtre (9 octobre 2026).
  '4e': [
    { nom: 'EMC', core: { x: 74, y: 716 }, forme: { forme: 'trefle', vers: 'devant' } },
    { nom: 'latin ou grec', core: { x: 106, y: 716 }, forme: { forme: 'galet', vers: 'devant' } },
  ],
};

it('les places des îles futures (GD-12) : dans le cadre, à quatre cases d’eau de toute emprise de départ', () => {
  for (const [a, places] of Object.entries(PLACES_FUTURES) as [ArchipelagoId, (typeof PLACES_FUTURES)['5e']][]) {
    const cadre = frameOf(a);
    const modele = mapOf(a)[0];
    const emprises = mapOf(a).flatMap((d) => footprintOf(d.id, d));
    const futures = places!.map((p) => {
      // Un lieu sans nom, pour son seul masque (le masque se garde par identifiant).
      const def = { ...modele, id: `futur-${a}-${p.nom}` as BiomeId, core: p.core, deplacee: undefined, vueDepuis: undefined, repere: p.core };
      return { nom: p.nom, rects: landRectangles({ ...def, ext: etendueDuLieu(def, p.forme) }) };
    });
    for (const f of futures)
      for (const r of f.rects) {
        expect(Math.min(r.x0 - cadre.x0, r.y0 - cadre.y0, cadre.x1 - r.x1, cadre.y1 - r.y1), `${a} ${f.nom} dans le cadre`).toBeGreaterThanOrEqual(0);
        for (const e of emprises) expect(gapBetween(r, e), `${a} ${f.nom} et ${e.lieu}`).toBeGreaterThanOrEqual(GAP_BETWEEN_PLACES);
        for (const g of futures) if (g !== f) for (const s of g.rects) expect(gapBetween(r, s), `${a} ${f.nom} et ${g.nom}`).toBeGreaterThanOrEqual(GAP_BETWEEN_PLACES);
      }
  }
});

it('la terre de chaque lieu, forme comprise, tient dans le cadre de sa région (GD-12)', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const c = frameOf(a);
    for (const d of mapOf(a)) for (const k of landCells(d)) expect(k.x >= c.x0 && k.x < c.x1 && k.y >= c.y0 && k.y < c.y1, `${a} ${d.id} (${k.x}, ${k.y})`).toBe(true);
  }
});

it('aucune terre ne chevauche une autre', () => {
  const owner = new Map<string, string>();
  BIOMES.forEach((b) => {
    const def = islandDef(b.id);
    for (const c of landCells(def)) {
      const key = `${c.x},${c.y}`;
      expect(owner.get(key), `${b.id} chevauche ${owner.get(key)} en ${key}`).toBeUndefined();
      owner.set(key, b.id);
    }
  });
});

it('chaque lieu a un voisin proche (GD-9 : une liaison entre chaque paire de la région), jamais séparé de plus d’un niveau', () => {
  for (const b of BRIDGES) {
    const a = islandDef(b.from);
    const c = islandDef(b.to);
    expect(Math.abs(a.altitude - c.altitude), b.id).toBeLessThanOrEqual(9);
  }
  // Toutes les paires d'une région ont leur liaison depuis GD-9 ; la carte garde à chaque lieu un voisin à portée.
  for (const def of MAP) {
    const proches = BRIDGES.filter((b) => b.from === def.id || b.to === def.id).map((b) => islandDef(b.from === def.id ? b.to : b.from));
    const dist = Math.min(...proches.map((c) => Math.hypot(def.core.x - c.core.x, def.core.y - c.core.y)));
    expect(dist, def.id).toBeLessThan(56);
  }
});

it('le relief : plat, collines de 0 à 2, montagne de 6 à 9, volcan avec son cratère de lave, jamais dans le cœur', () => {
  for (const def of MAP) {
    let max = 0;
    for (const c of landCells(def)) {
      const h = reliefHeight(def, c.x, c.y);
      expect(h).toBeGreaterThanOrEqual(0);
      if (def.core.x <= c.x && c.x < def.core.x + CORE && def.core.y <= c.y && c.y < def.core.y + CORE) expect(h).toBe(0);
      max = Math.max(max, h);
    }
    if (def.relief === 'plat') expect(max, def.id).toBeLessThanOrEqual(1);
    if (def.relief === 'collines') expect(max, def.id).toBeLessThanOrEqual(2);
    if (def.relief === 'montagne') {
      expect(max, def.id).toBeGreaterThanOrEqual(6);
      expect(max, def.id).toBeLessThanOrEqual(9);
    }
    if (def.relief === 'volcan') {
      expect(max, def.id).toBeGreaterThanOrEqual(6);
      expect(landscape(def).some((c) => c.ground === 'lave')).toBe(true);
    }
  }
});

it('le paysage : du décor sur chaque île, jamais sur l’eau ni la lave, les lacs dessinés, de la neige sur les sommets', () => {
  let lakes = 0;
  for (const def of MAP) {
    const cells = landscape(def);
    // Sur sa côte, ou ses jalons dans les marges du cœur : une côte d'une case (amincie par GD-11) est tout entière au
    // bord, sans décor.
    expect(
      cells.some((c) => c.decor) || margesDuCoeur(def).some((c) => c.decor),
      def.id,
    ).toBe(true);
    for (const c of cells) {
      if (c.ground === 'eau' || c.ground === 'lave') expect(c.decor, `${def.id} ${c.x},${c.y}`).toBeUndefined();
      // Une mare dans un creux ; le lac dessiné d'une île, au ras de sa rive d'herbe (consultant Archipéo, LV2-5).
      if (c.ground === 'eau') expect(c.h, `${def.id} ${c.x},${c.y}`).toBe(LACS[def.id] ? 0 : -1);
    }
    if (cells.some((c) => c.ground === 'eau')) lakes++;
    if (def.relief === 'montagne' && def.region !== 'feu')
      expect(
        cells.some((c) => c.ground === 'neige'),
        def.id,
      ).toBe(true);
  }
  // Une île qui a sa forme (GD-12) n'a plus de mare au hasard : restent les lacs dessinés (`LACS`), chacun sur son île, et
  // les mares des deux îles des Îles du Ciel d'où tombent leurs cascades, jusqu'à leurs formes.
  expect(lakes).toBe(Object.keys(LACS).length + 2);
});

it('aucun pont ne traverse la terre d’une autre île', () => {
  const land = new Map<string, string>();
  for (const def of MAP) for (const c of landCells(def)) land.set(`${c.x},${c.y}`, def.id);
  // Les liaisons qu'une partie peut avoir (GD-9) : toute une région reliée, et la sauvegarde d'avant, avec ses tracés d'origine.
  const all = [
    ...ARCHIPELAGO_IDS.flatMap((a) => linkWholeRegion(a, VOYAGES.map((v) => v.id))),
    ...LINKS_BEFORE_GD9.filter((b) => b.cost > 0).map((b) => b.id),
    ...VOYAGES.map((v) => v.id),
  ];
  const bridges = ARCHIPELAGO_IDS.flatMap((a) => worldCubes(a, {}, { parts: {}, log: [], links: all }, false)).filter((c) => c.bridge);
  for (const c of bridges) {
    const key = `${c.x},${c.y}`;
    const owner = land.get(key);
    if (owner) {
      const def = BRIDGES.find((b) => b.id === c.bridge)!;
      expect([def.from, def.to], `pont ${def.id} sur ${owner} en ${key}`).toContain(owner);
    }
  }
});
