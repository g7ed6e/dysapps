import { islandsOf } from './archipelago';
import { GD11_GUARDIAN_SQUARES } from './guardianSquares';
import { placedLinksOf } from './linkGeometry';
import { BLOC, BIOMES, missionsJouables } from '../biomes';
import { ARCHIPELAGO_IDS, CORE, MAP, bornesDuCoeur, coeurDe, isLand, islandDef, lagoonWater, landBox, landCells, mapOf, startingIsland } from './map';
import { BADGES } from '../../core/progress';
import { trophyBlock } from '../trophies';
import { PLAN_ZONE, planCells, plansFor } from './plans';
import { MONUMENT_ISLET, monumentsOf } from './monuments';
import { villageStage } from './villageStage';
import { CREATURE_CUBES } from './characters/creatures';
import { GUARDIAN_CUBES } from './characters/guardians';
import { ARCHIPELAGOS, BRIDGES, VOYAGES, archipelagoOf, linkKind, linkWholeRegion } from './archipelago';
import { walkGround, walkPath } from './paths';
import { possibleLandings } from './routing';
import { TOWARDS_SEA } from './placement';
import { dockBox, dockCells, dockOrigin, dockPosts, shoreY, vehicleRestZ, VEHICLE_DECK, VEHICLE_SIZE } from './harbor';
import { VEHICLE_STAGES } from './vehicle';
import { recetteDeLArchipel } from './assembly';
import { toutConstruit } from './budget';
import { decorPose } from './decor';
import { bridgesOf, isBiomeUnlocked } from './archipelago';
import { routeDeDepart } from './linkGeometry';
import { zoneDesPlans } from './plans';
import { AVATAR_HOME } from './terrain/base';
import { SENTINELLE_DANS_LE_MONDE } from './terrain/creatures';
import { DEMI_LARGEUR_DE_SENTINELLE, ECHELLE_DANS_LE_MONDE, HAUTEUR_DANS_LE_MONDE } from './characters/sentinel';
import { portesDesLieux } from './terrain/village';
import { PLACES_DES_BORNES_DES_ECOLES, QUEST_ROW } from './terrain/markers';
import {
  avatarHome,
  BALEINES_REPLACEES,
  rangeeDevantLesBornes,
  avatarRoute,
  boardingRoute,
  bridgePath,
  cacheUneBorne,
  cacheUnLieu,
  creatureDuMonde,
  creaturePlacements,
  creatureSpot,
  DEPTH,
  fade,
  groundHeight,
  gardienDuMonde,
  gardienEnPartieRallume,
  GUARDIAN_SQUARE,
  guardianCells,
  guardianCenter,
  guardianPlacements,
  guardianSpot,
  partDuGardienVue,
  SEUIL_DU_GARDIEN_VU,
  projectionDeLaVueDeLIle,
  VUE_DE_L_ILE_PANNEAU_OUVERT,
  trophySpot,
  ISLAND,
  islandAt,
  islandCenter,
  islandOrigin,
  mistPatches,
  origineDe,
  PORTEE_DEVANT_LA_BORNE,
  questStations,
  routeAt,
  routeLengths,
  placeDoor,
  placeSpot,
  TROPHY_AT,
  TROPHY_SIZE,
  TROPHY_SLOTS,
  trophyModel,
  lieuxVus,
  VILLAGE_PLACES,
  ASSEMBLAGE_SIZE,
  atelierModel,
  seaDecor,
  vehiclePlacement,
  versLaCamera,
  VIEW_YAW_MAX,
  viewYaw,
  viewZone,
  whaleSpots,
  worldBounds,
  worldCubes,
  ileDeLaVueGlissee,
} from './terrain';

/** La pierre éteinte d'une statue (`stoneOf`) : un gris froid, bleu de 24 de plus que le rouge. */
const estPierre = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, v, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return v - r === 8 && b - v === 16;
};

const village = (bridges: string[]) => ({ parts: {}, log: [], links: bridges });
/** Tous les archipels d'un coup, pour les tests qui parcourent toutes les îles. */
const allCubes = (progress: Record<string, { stars: number }>, v = village([]), withCreatures = true) =>
  ARCHIPELAGO_IDS.flatMap((a) => worldCubes(a, progress, v, withCreatures));
/** Des plans terminés, toutes leurs cases posées. */
const builtPlans = (plans: Parameters<typeof planCells>[0][]) => Object.fromEntries(plans.map((p) => [p.id, planCells(p).map((c) => c.key)]));
/** Tout relié : les liaisons qu'une partie peut poser (GD-9 : une région reliée de proche en proche) et les voyages. */
const everything = [...new Set([...ARCHIPELAGO_IDS.flatMap((a) => linkWholeRegion(a, VOYAGES.map((v) => v.id))), ...VOYAGES.map((v) => v.id)])];

it('construit une île par biome, avec créature seulement si un pont y mène', () => {
  const cubes = allCubes({});
  for (const b of BIOMES) expect(cubes.filter((c) => c.tag === b.id).length).toBeGreaterThanOrEqual(ISLAND * ISLAND * (DEPTH + 1));
  const o = islandOrigin(1);
  const onIsland = (c: { x: number; y: number }) => c.x >= o.ox && c.x < o.ox + ISLAND && c.y >= o.oy && c.y < o.oy + ISLAND;
  const foret = cubes.filter((c) => c.tag === 'french-6e-phonology');
  const mine = cubes.filter((c) => c.tag === 'french-6e-letter-confusion' && onIsland(c));
  // La Forêt (ouverte) a des cubes de créature au-dessus du sol ; la Mine (fermée) est délavée et sans créature.
  expect(foret.some((c) => c.z >= 1 && c.color === '#5e9b4a')).toBe(true);
  // Sans créatures dans le terrain (elles sont animées à part), la Forêt n'a plus de cube de Mousso.
  expect(worldCubes('6e', {}, undefined, false).some((c) => c.color === '#5e9b4a')).toBe(false);
  expect(creaturePlacements('6e', []).map((c) => c.id)).toEqual(['french-6e-phonology', 'maths-6e-calculation']);
  expect(creaturePlacements('6e', ['french-6e-phonology-french-6e-letter-confusion']).map((c) => c.id)).toEqual(['french-6e-phonology', 'french-6e-letter-confusion', 'maths-6e-calculation']);
  // Les créatures d'un autre archipel ne sont pas dans cette scène.
  expect(creaturePlacements('5e', ['passage-5e']).map((c) => c.id)).toEqual(['maths-5e-proportionality']);
  expect(mine.every((c) => c.muted)).toBe(true);
  expect(mine.some((c) => c.texture === 'pierre')).toBe(true);
  expect(foret.some((c) => c.muted)).toBe(false);
  const unlocked = worldCubes('6e', {}, village(['french-6e-phonology-french-6e-letter-confusion']));
  expect(unlocked.filter((c) => c.tag === 'french-6e-letter-confusion' && onIsland(c)).some((c) => c.muted)).toBe(false);
  // Délavé : plus clair et moins saturé, jamais gris uniforme.
  expect(fade('#6cb33f')).not.toBe(fade('#b8623a'));
});

it('place les îles de chaque archipel dans leur bande, à leur altitude', () => {
  const at = (id: string) => islandOrigin(BIOMES.findIndex((b) => b.id === id));
  expect(at('french-6e-phonology')).toEqual({ ox: 68, oy: 63, oz: 0 });
  expect(at('maths-6e-calculation').oz).toBe(0);
  expect(at('maths-5e-signed-numbers').oz).toBe(3);
  expect(at('maths-4e-powers').oz).toBe(6);
  expect(at('maths-3e-functions').oz).toBe(9);
  expect(islandCenter('maths-3e-functions').z).toBe(9);
  // Le sol d'une île en altitude est bien à son altitude, et elle flotte : de la roche dessous, rien au niveau de la mer.
  const cubes = worldCubes('3e', {});
  const phare = cubes.filter((c) => c.tag === 'maths-3e-functions');
  expect(phare.some((c) => c.z === 9)).toBe(true);
  expect(phare.some((c) => c.z < 9 - DEPTH && c.texture === 'pierre')).toBe(true);
  // (Le quai du Phare est à hauteur d'île ; aucune cascade ne descend jusqu'à la mer.)
  expect(phare.some((c) => c.z <= 0 && c.texture !== 'eau' && c.texture !== 'nuage')).toBe(false);
  // Chaque archipel occupe sa bande : les étendues ne se recouvrent pas, et une scène ne contient que ses îles.
  for (let i = 0; i + 1 < ARCHIPELAGO_IDS.length; i++) {
    const a = worldBounds(ARCHIPELAGO_IDS[i]);
    const b = worldBounds(ARCHIPELAGO_IDS[i + 1]);
    expect(a.maxY, `${ARCHIPELAGO_IDS[i]} / ${ARCHIPELAGO_IDS[i + 1]}`).toBeLessThan(b.minY);
  }
  for (const a of ARCHIPELAGO_IDS) {
    const tags = new Set(worldCubes(a, {}).map((c) => c.tag));
    for (const b of BIOMES) expect(tags.has(b.id), `${b.id} dans ${a}`).toBe(b.classe === a);
  }
});

it('le cœur a un relief léger : sol à 0 ou 1, jamais de trou, terre sous les cases surélevées', () => {
  const cubes = allCubes({});
  const at = new Set(cubes.map((c) => `${c.x},${c.y},${c.z}`));
  BIOMES.forEach((_, i) => {
    const { ox, oy, oz } = islandOrigin(i);
    let raised = 0;
    for (let x = 0; x < ISLAND; x++) {
      for (let y = 0; y < ISLAND; y++) {
        const h = groundHeight(i, x, y);
        expect([0, 1]).toContain(h);
        for (let z = -DEPTH; z <= h; z++) expect(at.has(`${ox + x},${oy + y},${oz + z}`)).toBe(true);
        if (h) raised++;
      }
    }
    expect(raised).toBeGreaterThan(4);
    expect(raised).toBeLessThan((ISLAND * ISLAND) / 2);
  });
  // Aucun cube en double.
  expect(at.size).toBe(cubes.length);
});

it('relie les îles par des ponts continus (fantômes tant qu’ils ne sont pas construits), tous dans leur archipel', () => {
  const bridgeCubes = (bridges: string[], id: string) => allCubes({}, village(bridges)).filter((c) => c.bridge === id);
  // Forêt–Mine : un sentier sur l'isthme, constructible dès le début, donc en fantôme : des pierres de gué sur le sol.
  const trail = bridgeCubes([], 'french-6e-phonology-french-6e-letter-confusion');
  expect(trail.length).toBeGreaterThanOrEqual(4);
  expect(trail.every((c) => c.ghost)).toBe(true);
  expect(trail.filter((c) => c.texture === 'galet').every((c) => c.z >= 1 && c.z <= 4)).toBe(true);
  // Plaine–Ferme : un pont, en planches, à plat (même altitude).
  const ghost = bridgeCubes([], 'french-6e-grammar-spelling-maths-6e-calculation').filter((c) => c.ghost);
  expect(ghost.length).toBeGreaterThanOrEqual(4);
  expect(ghost.filter((c) => c.texture !== 'lanterne' && c.texture !== 'tronc').every((c) => c.texture === 'planches' && c.z === 0)).toBe(true);
  // Une lanterne sur un poteau à chaque bout, à côté du tablier (jamais sur le passage).
  const lanterns = ghost.filter((c) => c.texture === 'lanterne');
  expect(lanterns).toHaveLength(2);
  const deck = new Set(ghost.filter((c) => c.texture === 'planches').map((c) => `${c.x},${c.y}`));
  for (const l of lanterns) expect(deck.has(`${l.x},${l.y}`)).toBe(false);
  const built = bridgeCubes(['french-6e-grammar-spelling-maths-6e-calculation'], 'french-6e-grammar-spelling-maths-6e-calculation').filter((c) => !c.ghost);
  expect(built.length).toBe(ghost.length);
  // Mine–Carrière : trop loin tant que la Mine est fermée, aucun cube de pont côté Carrière.
  expect(bridgeCubes([], 'french-6e-letter-confusion-french-6e-word-spelling')).toHaveLength(0);
  expect(bridgeCubes(['french-6e-phonology-french-6e-letter-confusion'], 'french-6e-letter-confusion-french-6e-word-spelling').filter((c) => c.ghost).length).toBeGreaterThanOrEqual(4);
  // Plaine–Rivière : un bac, des poteaux de bois et un radeau, au fil de l'eau.
  const ferry = bridgeCubes([], 'maths-6e-calculation-maths-6e-fractions');
  expect(ferry.some((c) => c.texture === 'tronc')).toBe(true);
  expect(ferry.filter((c) => c.texture === 'planches').length).toBeGreaterThanOrEqual(3);
  expect(ferry.filter((c) => c.texture !== 'lanterne').every((c) => c.z === 0)).toBe(true);
  // Depuis GD-9, plus d'escalier ni de col : une liaison est un pont, un bac, ou un sentier entre deux lieux réunis.
  const stairs = bridgeCubes(['passage-5e', 'passage-4e', 'maths-4e-algebra-french-4e-agreement'], 'french-4e-agreement-french-4e-vocabulary');
  expect(stairs.some((c) => c.texture === 'planches')).toBe(true);
  const pass = bridgeCubes(['passage-5e', 'passage-4e', 'passage-3e'], 'maths-3e-functions-french-3e-close-reading');
  expect(pass.some((c) => c.texture === 'planches')).toBe(true);
  // Chaque ouvrage relie deux îles du même archipel.
  for (const b of BRIDGES) expect(archipelagoOf(b.from).classe, b.id).toBe(archipelagoOf(b.to).classe);
  // Tout construit : aucun cube d'ouvrage en double, ni sur un autre cube.
  const all = allCubes({}, village(everything), false);
  const seen = new Set<string>();
  for (const c of all) {
    const key = `${c.x},${c.y},${c.z}`;
    expect(seen.has(key), `cube en double en ${key} (${c.tag}, ${c.bridge})`).toBe(false);
    seen.add(key);
  }
  // Tout tient dans son archipel, sauf l'habillage de la mer, semé au large exprès.
  for (const a of ARCHIPELAGO_IDS) {
    const cubes = worldCubes(a, {}, village(everything)).filter((c) => c.tag !== 'mer');
    const bounds = worldBounds(a);
    for (const c of cubes) {
      expect(c.x, `${a} ${c.tag}`).toBeGreaterThanOrEqual(bounds.minX);
      expect(c.x, `${a} ${c.tag}`).toBeLessThan(bounds.maxX);
      expect(c.y, `${a} ${c.tag}`).toBeGreaterThanOrEqual(bounds.minY);
      expect(c.y, `${a} ${c.tag}`).toBeLessThan(bounds.maxY);
    }
  }
  // (Ce test reconstruit les quatre archipels plusieurs fois : on lui laisse le temps sur une machine chargée.)
}, 30_000);

it("retrouve l'île sous un point, y compris depuis un pont", () => {
  for (const b of BIOMES) {
    const c = islandCenter(b.id);
    expect(islandAt(b.classe, c.x, c.y)).toBe(b.id);
  }
  const o = islandOrigin(1);
  // Juste à côté du bord du cœur de la deuxième île, sur sa terre ou son pont.
  expect(islandAt('6e', o.ox + ISLAND + 1, o.oy + ISLAND / 2)).toBe(BIOMES[1].id);
});

it('sans les Gardiens éteints, le Gardien apparaît sur son île quand il accepte le défi, en pierre, puis en couleurs une fois rallumé, son bloc d’or devant lui (GD-8, GD-11)', async () => {
  const { typesWithContent } = await import('../boss');
  const { exercisesOf } = await import('../exercises');
  const { getBiome } = await import('../biomes');
  const FORET = 'french-6e-phonology';
  const ready: Record<string, { stars: number }> = {};
  for (const type of typesWithContent(getBiome(FORET)!)) ready[exercisesOf(FORET, type)[0].id] = { stars: 2 };
  expect(guardianPlacements('6e', {}, [])).toEqual([]);
  // Plus d'îlot devant l'île : rien devant sa terre.
  expect(worldCubes('6e', ready).some((c) => c.tag === FORET && c.y < landBox(islandDef(FORET)).y0)).toBe(false);
  const [g] = guardianPlacements('6e', ready, [], false, [], 0.5);
  expect(g).toMatchObject({ id: FORET, kind: 'guardian', still: true, beaten: false, echelle: 0.5 });
  // Prêt, il est encore éteint : en pierre grise (GD-8), debout sur le sol de son île, sur son carré.
  expect(g.cubes.every((c) => estPierre(c.color))).toBe(true);
  const def = islandDef(FORET);
  expect(g.origin.z).toBe(def.altitude + 1);
  expect(g.cases).toEqual(guardianCells(FORET));
  for (const c of g.cases) expect(isLand(def, c.x, c.y), `${c.x},${c.y}`).toBe(true);
  const t = trophySpot(FORET);
  const surLeSocle = (c: { x: number; y: number; z: number; texture?: string }) => c.x === def.core.x + t.x && c.y === def.core.y + t.y && c.z === def.altitude + 2 && c.texture === 'or';
  expect(worldCubes('6e', ready).some(surLeSocle)).toBe(false);
  // Rallumé : en couleurs (GD-8), et son bloc d'or sur un socle de pierre, sur la rangée de devant de son carré.
  const beaten = { ...ready, [`${FORET}-challenge`]: { stars: 2 } };
  const [s] = guardianPlacements('6e', beaten, []);
  expect(s.beaten).toBe(true);
  expect(s.cubes).toEqual(gardienDuMonde(FORET).map((c) => expect.objectContaining({ color: c.color })));
  const monde = worldCubes('6e', beaten);
  expect(monde.some(surLeSocle)).toBe(true);
  expect(monde.some((c) => c.x === def.core.x + t.x && c.y === def.core.y + t.y && c.z === def.altitude + 1 && c.texture === 'pierre')).toBe(true);
  expect(guardianSpot(FORET).y).toBe(t.y);
});

it('avec les sentinelles (Archipéo, lot 6), le Gardien est là dès l’ouverture de son île', () => {
  // La Forêt est ouverte dès le début : sa sentinelle attend, éteinte, sur son île.
  const [g] = guardianPlacements('6e', {}, [], true);
  expect(g).toMatchObject({ id: 'french-6e-phonology', kind: 'guardian', beaten: false });
  // Une île fermée n'a pas de sentinelle.
  const ouvertes = BIOMES.filter((b) => b.classe === '6e' && isBiomeUnlocked(b.id, [])).map((b) => b.id);
  expect(ouvertes.length).toBeLessThan(BIOMES.filter((b) => b.classe === '6e').length);
  expect(guardianPlacements('6e', {}, [], true).map((p) => p.id)).toEqual(ouvertes);
});

describe('chaque Gardien sur son île (GD-11, décision du mainteneur du 8 octobre 2026)', () => {
  it('GD-12 : les 52 carrés des Gardiens ne bougent pas, qu’une île ait pris sa forme ou non', () => {
    // Une île qui a sa forme garde le carré de GD-11 (figé) ; les autres le retrouvent par la recherche. Le seuil de 75 %
    // et la part vue de chaque Gardien se vérifient plus bas, sur les mêmes carrés.
    expect(Object.keys(GD11_GUARDIAN_SQUARES)).toHaveLength(52);
    expect(Object.keys(GD11_GUARDIAN_SQUARES).sort()).toEqual(BIOMES.map((b) => b.id).sort());
    for (const b of BIOMES) {
      const s = guardianSpot(b.id);
      expect({ x: s.x, y: s.y, palier: s.palier }, b.id).toEqual(GD11_GUARDIAN_SQUARES[b.id]);
    }
  });

  it('chaque île a sa place, sans repli : les îles ont grandi (« Agrandir les îles », 8 octobre 2026)', () => {
    // Mesuré le 8 octobre 2026, avant GD-11 point 3 : 23 îles sur 51 au repli. Depuis que le cœur a grandi, aucune.
    // Avant la règle « rien ne cache le Gardien » (relecture des planches, 8 octobre 2026) : 47 îles au palier 1, 3 au
    // palier 2, 1 au palier 3 ; 33 Gardiens en partie cachés (la Forêt à moitié). Avec elle : 23, 1 et 27, 15 en partie
    // cachés. Depuis les côtés de la bande de devant (DA, 8 octobre 2026) : 34, 0 et 17, dont 13 sur un côté de devant.
    // Depuis que les rayons visent les yeux de la caméra en perspective (le Sphinx de marbre que Théo cachait) : 29, 0
    // et 22, dont 16 sur un côté. Depuis que le chemin du bonhomme depuis ses arrivées écarte les côtés (DA, 8 octobre
    // 2026 ; appliqué derrière la bande aussi : 14 au palier 1) : 20, 0 et 31, dont 6 sur un côté. Depuis le seuil de
    // 75 % (DA, 8 octobre 2026 : sous lui, la bande du chemin des arrivées cède sur un côté de devant) : 23, 0 et 28,
    // dont 9 sur un côté (le Hangar des inventions, l'Imprimerie des révolutions et le Verger de la santé y viennent).
    // Depuis la cinquième mission (GD-14, 9 octobre 2026), une borne de plus touche trois carrés de devant : 21, 0 et 30,
    // dont 6 sur un côté (le Hangar des inventions passe derrière la bande, au palier 1 ; le Manoir du passé et le
    // Belvédère de Thalès au palier 3).
    // Avec le Préau des délégués (EMC-2), au palier 1 sur un côté de devant, mesurés après GD-14 : 22, 0 et 30, dont 7
    // sur un côté.
    expect(BIOMES.filter((b) => guardianSpot(b.id).repli).map((b) => b.id)).toEqual([]);
    const paliers = (n: number) => BIOMES.filter((b) => guardianSpot(b.id).palier === n).map((b) => b.id);
    expect(paliers(1)).toHaveLength(22);
    expect(paliers(2)).toEqual([]);
    expect(paliers(3)).toHaveLength(30);
    expect(BIOMES.filter((b) => guardianSpot(b.id).y <= QUEST_ROW + 1).map((b) => b.id)).toEqual([
      'english-4e-comprehension',
      'civics-6e-democratic-society',
      'history-4e-revolutions',
      'geography-4e-globalization',
      'life-earth-sciences-4e-cells-evolution',
      'history-3e-twentieth-century',
      'life-earth-sciences-3e-human-body',
    ]);
  });

  it('sur un côté de la bande de devant : hors des colonnes des bornes, du chemin du bonhomme, et entier dans le cadre', () => {
    for (const b of BIOMES) {
      const s = guardianSpot(b.id);
      if (s.y > QUEST_ROW + 1) continue;
      const xs = questStations(b.id).map((st) => st.x);
      // Aucune colonne de la première borne moins une à la dernière plus une.
      expect(s.x + GUARDIAN_SQUARE - 1 < Math.min(...xs) - 1 || s.x > Math.max(...xs) + 1, b.id).toBe(true);
      // Ni le départ du bonhomme, ni une case autour.
      expect(Math.abs(s.x + 2 - AVATAR_HOME.x) > 3 || Math.abs(s.y + 2 - AVATAR_HOME.y) > 3, b.id).toBe(true);
      // Ni l'arrivée d'une de ses liaisons, ni une case autour : le bonhomme en vient (DA, 8 octobre 2026).
      const depart = startingIsland(b.id).core;
      for (const ouvrage of bridgesOf(b.id)) {
        const trace = routeDeDepart(ouvrage);
        for (const a of trace ? [trace.depuis, trace.vers] : []) {
          if (a.lieu !== b.id) continue;
          const l = { x: a.x - depart.x, y: a.y - depart.y };
          const loin = l.x < s.x - 1 || l.x > s.x + GUARDIAN_SQUARE || l.y < s.y - 1 || l.y > s.y + GUARDIAN_SQUARE;
          expect(loin, `${b.id} arrivée de ${ouvrage.id}`).toBe(true);
        }
      }
      // Entier dans la vue de l'île panneau ouvert, au-dessus des boutons du bas.
      const V = VUE_DE_L_ILE_PANNEAU_OUVERT;
      const { projeter } = projectionDeLaVueDeLIle(b.id);
      const def = islandDef(b.id);
      for (const [i, j] of [[0, 0], [GUARDIAN_SQUARE, 0], [0, GUARDIAN_SQUARE], [GUARDIAN_SQUARE, GUARDIAN_SQUARE]]) {
        const [u, v] = projeter(def.core.x + s.x + i, def.core.y + s.y + j, def.altitude + 1);
        expect(u, b.id).toBeGreaterThanOrEqual(0);
        expect(u, b.id).toBeLessThanOrEqual(V.largeur);
        expect(v, b.id).toBeLessThanOrEqual(V.hauteur - V.bas);
      }
    }
  });

  it('la vue d’une île qui a un lagon cadre son lagon et sa passe, panneau ouvert, au-dessus des boutons (GD-12, le Bassin des maquettes)', () => {
    // Visée au milieu de son cœur, le lagon tombait sous le panneau de l'île (relecture du 9 octobre 2026).
    const V = VUE_DE_L_ILE_PANNEAU_OUVERT;
    const avecLagon = MAP.filter((d) => lagoonWater(d).length > 0);
    expect(avecLagon.map((d) => d.id)).toEqual(['technology-4e-modeling']);
    for (const def of avecLagon) {
      const { projeter } = projectionDeLaVueDeLIle(def.id);
      for (const c of lagoonWater(def))
        for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const [u, v] = projeter(c.x + i, c.y + j, 0);
          expect(u >= 0 && u <= V.largeur && v >= 0 && v <= V.hauteur - V.bas, `${def.id} (${c.x}, ${c.y})`).toBe(true);
        }
    }
  });

  it('la sentinelle que la place du Gardien laisse voir est celle que dessine Archipéo', () => {
    expect(SENTINELLE_DANS_LE_MONDE.demiLargeur).toBeCloseTo(DEMI_LARGEUR_DE_SENTINELLE * ECHELLE_DANS_LE_MONDE, 9);
    expect(SENTINELLE_DANS_LE_MONDE.hauteur).toBeCloseTo(HAUTEUR_DANS_LE_MONDE, 9);
  });

  it('rien ne le cache dans la vue de l’île : ni l’habitant, ni un lieu ou un bâtiment, ni l’étiquette du nom, dans les deux univers', () => {
    // Faute de carré où il se voit entier, même le décor effacé (palier 3), derrière la bande de devant ou sur un de ses
    // côtés, ces îles gardent le carré où il se voit le plus : la part vue, au centième, dans la forme la plus cachée des
    // deux univers, les rayons visant les deux yeux de la caméra (en paysage et panneau ouvert). Sous 85 % : le Phare
    // des fonctions (68 %), la Prairie des climats (76 %), la Vigie des signaux (78 %), l'Horloge des verbes (79 %), la
    // Falaise des accords, le Bassin des maquettes et le Tremplin des forces (83 %). Sous le seuil de 75 % (DA,
    // 8 octobre 2026), seul le Phare des fonctions : aucun carré, même la bande du chemin des arrivées cédée, ne le
    // montre plus. Le Hangar des inventions et le Verger de la santé (54 %), l'Imprimerie des révolutions (66 %) se
    // voient entiers sur un côté de devant depuis ce seuil. Depuis la cinquième mission (GD-14), le Belvédère de Thalès
    // (82 %) a quitté le sien, qu'une borne de plus touchait ; le Manoir du passé aussi (81 % en (0, 14)), puis, sa forme prise, la recherche refaite sur sa terre l'a posé en (15, 15), où il se voit entier.
    const enPartie: Record<string, number> = {
      'maths-6e-calculation': 0.92,
      'maths-5e-signed-numbers': 0.88,
      'maths-4e-algebra': 0.87,
      'french-4e-agreement': 0.83,
      'maths-3e-functions': 0.68,
      'english-6e-grammar': 0.79,
      'history-6e-antiquity': 0.99,
      'geography-6e-living': 0.99,
      'life-earth-sciences-6e-living-world': 0.85,
      'history-5e-middle-ages': 0.93,
      'geography-5e-resources': 0.99,
      'life-earth-sciences-5e-active-planet': 0.76,
      'technology-5e-design': 0.89,
      'physics-chemistry-4e-signals-circuits': 0.78,
      'technology-4e-modeling': 0.83,
      'physics-chemistry-3e-motion-energy': 0.83,
      'maths-3e-geometry': 0.82,
    };
    for (const b of BIOMES) {
      const vue = Math.min(...(['gardien', 'sentinelle'] as const).map((forme) => partDuGardienVue(b.id, forme)));
      if (b.id in enPartie) expect(vue, b.id).toBeCloseTo(enPartie[b.id], 2);
      else expect(vue, b.id).toBe(1);
    }
    expect(BIOMES.filter((b) => Math.min(...(['gardien', 'sentinelle'] as const).map((forme) => partDuGardienVue(b.id, forme))) < SEUIL_DU_GARDIEN_VU).map((b) => b.id)).toEqual(['maths-3e-functions']);
  });

  it('jamais sur une colline, ni sur la case d’entrée derrière une arrivée de liaison', () => {
    for (const b of BIOMES) {
      const s = guardianSpot(b.id);
      const index = BIOMES.indexOf(b);
      const carre = new Set<string>();
      for (let i = 0; i < GUARDIAN_SQUARE; i++) for (let j = 0; j < GUARDIAN_SQUARE; j++) carre.add(`${s.x + i},${s.y + j}`);
      for (const k of carre) {
        const [x, y] = k.split(',').map(Number);
        expect(groundHeight(index, x, y), `${b.id} ${k}`).toBeLessThanOrEqual(0);
      }
      for (const l of possibleLandings(startingIsland(b.id))) {
        const v = TOWARDS_SEA[l.cote];
        expect(carre.has(`${l.x - v.dx},${l.y - v.dy}`), `${b.id} entrée ${l.cote} ${l.pas}`).toBe(false);
      }
    }
  });

  it('son carré est sur la terre de son île, hors des bornes, de l’habitant, du départ du bonhomme, des portes, des arrivées des liaisons et du chantier', () => {
    for (const b of BIOMES) {
      const def = islandDef(b.id);
      const s = guardianSpot(b.id);
      const carre = new Set<string>();
      for (let i = 0; i < GUARDIAN_SQUARE; i++) for (let j = 0; j < GUARDIAN_SQUARE; j++) carre.add(`${s.x + i},${s.y + j}`);
      for (const k of carre) {
        const [x, y] = k.split(',').map(Number);
        expect(isLand(def, def.core.x + x, def.core.y + y), `${b.id} ${k}`).toBe(true);
      }
      for (const st of questStations(b.id)) expect(carre.has(`${st.x},${st.y}`), `${b.id} borne`).toBe(false);
      const c = creatureSpot(b.id);
      for (const k of creatureDuMonde(b.id)) expect(carre.has(`${c.x + k.x},${c.y + k.y}`), `${b.id} habitant`).toBe(false);
      expect(carre.has(`${AVATAR_HOME.x},${AVATAR_HOME.y}`), `${b.id} bonhomme`).toBe(false);
      for (const k of portesDesLieux(b.id)) expect(carre.has(k), `${b.id} porte ${k}`).toBe(false);
      // Aucune liaison n'arrive sous lui.
      for (const l of possibleLandings(def)) expect(carre.has(`${l.x},${l.y}`), `${b.id} arrivée ${l.cote} ${l.pas}`).toBe(false);
      const zone = zoneDesPlans(b.id);
      for (let x = zone.x; x < zone.x + zone.w; x++) for (let y = zone.y; y < zone.y + zone.h; y++) expect(carre.has(`${x},${y}`), `${b.id} chantier`).toBe(false);
      // Les pas de l'habitant ne le traversent pas.
      const cr = creaturePlacements(b.classe, everything).find((p) => p.id === b.id);
      if (cr) expect(cr.steps.length, b.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('la grille et la caméra du rallumage visent le milieu du Gardien posé, pas celui de son carré', () => {
    const tout = Object.fromEntries(BIOMES.map((b) => [b.id, { stars: 3 }]));
    for (const a of ARCHIPELAGO_IDS)
      for (const g of guardianPlacements(a, tout, BRIDGES.map((l) => l.id), true)) {
        const xs = g.cubes.map((c) => g.origin.x + c.x);
        const ys = g.cubes.map((c) => g.origin.y + c.y);
        const c = guardianCenter(g.id);
        expect(c.x, g.id).toBeCloseTo((Math.min(...xs) + Math.max(...xs)) / 2, 5);
        expect(c.y, g.id).toBeCloseTo((Math.min(...ys) + Math.max(...ys)) / 2, 5);
      }
  });

  it('dans Blocland, réduit de moitié, chaque Gardien tient sur son carré ; dans Archipéo, sa sentinelle aussi', () => {
    for (const b of BIOMES) {
      const e = gardienDuMonde(b.id);
      const largeur = Math.max(...e.map((c) => c.x)) - Math.min(...e.map((c) => c.x)) + 1;
      const profondeur = Math.max(...e.map((c) => c.y)) - Math.min(...e.map((c) => c.y)) + 1;
      expect(largeur * 0.5, b.id).toBeLessThanOrEqual(GUARDIAN_SQUARE);
      expect(profondeur * 0.5, b.id).toBeLessThanOrEqual(GUARDIAN_SQUARE + 0.5);
    }
  });
});

it('les repères : un grand arbre à la Forêt, un phare au Phare, de la fumée au Volcan ; plus aucune cascade', () => {
  const cubes = allCubes({}, village(everything), false);
  const of = (id: string) => cubes.filter((c) => c.tag === id && !c.bridge);
  const foret = of('french-6e-phonology');
  expect(Math.max(...foret.filter((c) => c.texture === 'feuilles').map((c) => c.z))).toBeGreaterThanOrEqual(8);
  const phare = of('maths-3e-functions');
  expect(phare.filter((c) => c.texture === 'lanterne').length).toBeGreaterThanOrEqual(4);
  expect(Math.max(...phare.map((c) => c.z))).toBeGreaterThanOrEqual(9 + 10);
  expect(of('maths-6e-decimals').some((c) => c.color === '#a9a4a0')).toBe(true);
  expect(of('french-6e-letter-confusion').some((c) => c.texture === 'toile')).toBe(true);
  expect(of('french-5e-conjugation').filter((c) => c.color === '#d9453f').length).toBeGreaterThanOrEqual(20);
  // Une cascade, une colonne d'eau d'une île en altitude jusqu'au niveau de la mer : plus aucune depuis les formes des
  // Îles du Ciel (GD-12, 9 octobre 2026 ; une île qui a sa forme n'a plus de mare d'où l'eau déborde).
  const falls = cubes.filter((c) => c.texture === 'eau' && c.z === 0 && BIOMES.some((b) => b.id === c.tag && islandCenter(b.id).z > 0));
  expect(falls).toEqual([]);
  // La brume des sommets : sous les douze Îles du Ciel (le Refuge des carnets, le Kiosque des témoins, le Plateau des
  // territoires et les trois îles de sciences de SC-3 compris), nulle part ailleurs.
  expect(mistPatches('3e').length).toBe(12);
  for (const m of mistPatches('3e')) expect(m.z).toBe(7.5);
  expect(mistPatches('6e')).toEqual([]);
  // Un repère par archipel du collège aussi : l'aiguille de glace du Glacier, le haut-fourneau de la Forge.
  const glacier = of('maths-5e-signed-numbers');
  expect(glacier.filter((c) => c.texture === 'glace' && c.z >= 3 + 6).length).toBeGreaterThanOrEqual(3);
  expect(glacier.some((c) => c.texture === 'cristal' && c.z >= 3 + 9)).toBe(true);
  const forge = of('maths-4e-powers');
  expect(forge.filter((c) => c.texture === 'basalte' && c.z >= 6 + 9).length).toBeGreaterThanOrEqual(4);
  expect(forge.some((c) => c.texture === 'lave' && c.z >= 6 + 10)).toBe(true);
  expect(forge.some((c) => c.color === '#a9a4a0' && c.z >= 6 + 12)).toBe(true);
});

it('le bonhomme avance au même pas le long d’un itinéraire, quelle que soit la longueur des segments', () => {
  // Un long segment (toute une île), puis deux cases de pont.
  const route = [
    { x: 0, y: 0, z: 1 },
    { x: 8, y: 0, z: 1 },
    { x: 9, y: 0, z: 2 },
    { x: 10, y: 0, z: 2 },
  ];
  const cum = routeLengths(route);
  expect(cum).toEqual([0, 8, 9, 10]);
  expect(routeAt(route, cum, 0)).toEqual(route[0]);
  expect(routeAt(route, cum, 5)).toEqual({ x: 5, y: 0, z: 1 });
  expect(routeAt(route, cum, 8.5)).toEqual({ x: 8.5, y: 0, z: 1.5 });
  expect(routeAt(route, cum, 10)).toEqual(route[3]);
  expect(routeAt(route, cum, 42)).toEqual(route[3]);
  // Une route sur place (un seul point répété) : on y reste.
  const still = [route[0], route[0]];
  expect(routeAt(still, routeLengths(still), 0.5)).toEqual(route[0]);
  // Un vrai trajet Forêt → Mine : à temps égaux, des pas égaux, sur l’île comme sur le sentier.
  const walk = avatarRoute('french-6e-phonology', 'french-6e-letter-confusion', ['french-6e-phonology-french-6e-letter-confusion'])!;
  const walkCum = routeLengths(walk);
  const total = walkCum[walkCum.length - 1];
  const steps = 40;
  for (let i = 1; i <= steps; i++) {
    const a = routeAt(walk, walkCum, (total * (i - 1)) / steps);
    const b = routeAt(walk, walkCum, (total * i) / steps);
    // Sur une ligne droite par morceaux, la corde ne dépasse jamais l’arc, et ne s’en éloigne qu’aux coudes.
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThanOrEqual(total / steps + 1e-9);
  }
  const mid = routeAt(walk, walkCum, total / 2);
  const before = walkCum.findIndex((c) => c > total / 2) - 1;
  expect(Math.hypot(mid.x - walk[before].x, mid.y - walk[before].y)).toBeCloseTo(total / 2 - walkCum[before], 9);
});

it('le bonhomme marche d’île en île sur les ouvrages construits, jamais sur l’eau, et pas d’un archipel à l’autre', () => {
  expect(avatarRoute('french-6e-phonology', 'french-6e-phonology', [])).toEqual([avatarHome('french-6e-phonology')]);
  // Sans ouvrage construit vers la Mine : pas de chemin.
  expect(avatarRoute('french-6e-phonology', 'french-6e-letter-confusion', [])).toBeNull();
  const route = avatarRoute('french-6e-phonology', 'french-6e-letter-confusion', ['french-6e-phonology-french-6e-letter-confusion'])!;
  expect(route[0]).toEqual(avatarHome('french-6e-phonology'));
  expect(route[route.length - 1]).toEqual(avatarHome('french-6e-letter-confusion'));
  // Le pont de la Forêt à la Mine (GD-9, elles ne sont plus réunies) se marche sur son tablier (z = 1), sur ses cubes.
  expect(route.length).toBeGreaterThan(5);
  for (const p of route) expect(p.z).toBeGreaterThanOrEqual(0);
  const deck = new Set(
    worldCubes('6e', {}, village(['french-6e-phonology-french-6e-letter-confusion']))
      .filter((c) => c.bridge === 'french-6e-phonology-french-6e-letter-confusion')
      .map((c) => `${c.x},${c.y},${c.z}`),
  );
  expect(route.some((p) => p.z === 1 && deck.has(`${p.x},${p.y},${p.z - 1}`))).toBe(true);
  // Deux ouvrages : Forêt → Ferme (pont) → Tour (pont) ; le pont se marche sur le tablier (z = 1).
  const far = avatarRoute('french-6e-phonology', 'french-6e-reading', ['french-6e-phonology-french-6e-grammar-spelling', 'french-6e-grammar-spelling-french-6e-reading'])!;
  expect(far[far.length - 1]).toEqual(avatarHome('french-6e-reading'));
  expect(far.some((p) => p.z === 1)).toBe(true);
  // D'un archipel à l'autre, on ne marche pas : c'est le Bloc-Navire (changement de scène).
  expect(avatarRoute('maths-6e-calculation', 'maths-5e-proportionality', ['passage-5e'])).toBeNull();
  // Dans les Collines, on marche à leur altitude. (Le tracé des liaisons suit celles que la partie a posées.)
  const liens = ['passage-5e', 'maths-5e-proportionality-french-5e-conjugation'];
  const up = avatarRoute('maths-5e-proportionality', 'french-5e-conjugation', liens)!;
  expect(Math.min(...up.map((p) => p.z))).toBe(4);
});

it('le bonhomme a toujours les pieds sur un bloc, jamais dedans, sur chaque île et chaque ouvrage (hors bac)', () => {
  const solid = new Set(
    allCubes({}, village(everything), false)
      .filter((c) => !c.ghost)
      .map((c) => `${c.x},${c.y},${c.z}`),
  );
  // Sur son île, il se tient sur le sol, à la même hauteur que la créature.
  for (const b of BIOMES) {
    const h = avatarHome(b.id);
    expect(h.z, b.id).toBe(islandOrigin(BIOMES.indexOf(b)).oz + 1);
  }
  const ferries = new Set(BRIDGES.filter((b) => linkKind(b, everything) === 'bac').map((b) => b.id));
  for (const bridge of BRIDGES.filter((b) => everything.includes(b.id))) {
    if (ferries.has(bridge.id)) continue; // le bac flotte au fil de l'eau, entre ses poteaux
    const route = avatarRoute(bridge.from, bridge.to, everything)!;
    for (const p of route) {
      expect(solid.has(`${p.x},${p.y},${p.z - 1}`), `${bridge.id} (${p.x},${p.y},${p.z}) sur un bloc`).toBe(true);
      expect(solid.has(`${p.x},${p.y},${p.z}`), `${bridge.id} (${p.x},${p.y},${p.z}) pas dans un bloc`).toBe(false);
    }
  }
});

it('les baleines nagent dans les clairières d’eau de chaque archipel, jamais sur une terre ni le port', () => {
  // Pas de mer dans les Îles du Ciel : pas de baleines.
  expect(whaleSpots('3e', [])).toEqual([]);
  for (const a of ARCHIPELAGO_IDS) {
    if (a === '3e') continue;
    const spots = whaleSpots(a, []);
    // Quatre dans les Premiers Rivages ; au moins deux dans les petits archipels, où l'eau libre est plus rare.
    expect(spots.length, a).toBeGreaterThanOrEqual(a === '6e' ? 4 : 2);
    expect(spots.length, a).toBeLessThanOrEqual(4);
    const land = new Set<string>();
    for (const def of mapOf(a)) for (const c of landCells(def)) land.add(`${c.x},${c.y}`);
    const dock = dockBox(ARCHIPELAGOS.find((x) => x.classe === a)!.port);
    for (let x = dock.x0; x <= dock.x1; x++) for (let y = dock.y0; y <= dock.y1; y++) land.add(`${x},${y}`);
    const b = worldBounds(a);
    for (const s of spots) {
      expect(s.r).toBeGreaterThanOrEqual(4);
      // Dans le monde (visible), et tout le rond (avec deux cases de marge) dans l'eau.
      expect(s.x).toBeGreaterThan(b.minX);
      expect(s.x).toBeLessThan(b.maxX);
      for (let x = Math.floor(s.x - s.r - 2); x <= Math.ceil(s.x + s.r + 2); x++)
        for (let y = Math.floor(s.y - s.r - 2); y <= Math.ceil(s.y + s.r + 2); y++)
          if (Math.hypot(x - s.x, y - s.y) <= s.r + 2) expect(land.has(`${x},${y}`), `baleine sur la terre en ${x},${y}`).toBe(false);
    }
  }
});

it('une baleine replacée à la main nage en eau libre, à trois cases au moins de toute terre, ponton, ouvrage ou monument', () => {
  for (const a of ARCHIPELAGO_IDS)
    for (const { vers } of BALEINES_REPLACEES[a] ?? []) {
      const s = whaleSpots(a, []).find((w) => w.x === vers.x && w.y === vers.y);
      expect(s, `${a} : la baleine replacée en ${vers.x}, ${vers.y}`).toBeDefined();
      expect(s!.r).toBeGreaterThanOrEqual(4);
      const pres: { x: number; y: number }[] = [];
      for (const def of mapOf(a)) pres.push(...landCells(def));
      const dock = dockBox(ARCHIPELAGOS.find((x) => x.classe === a)!.port);
      for (let x = dock.x0; x <= dock.x1; x++) for (let y = dock.y0; y <= dock.y1; y++) pres.push({ x, y });
      for (const m of monumentsOf(a)) for (let x = 0; x < MONUMENT_ISLET; x++) for (let y = 0; y < MONUMENT_ISLET; y++) pres.push({ x: m.islet.x + x, y: m.islet.y + y });
      // Les liaisons posées (au départ de la région, seulement le pont déjà construit) : la baleine s'en écarte.
      for (const br of placedLinksOf(a, [])) pres.push(...bridgePath(br, []));
      const ecart = Math.min(...pres.map((c) => Math.hypot(c.x - s!.x, c.y - s!.y))) - s!.r;
      expect(ecart, `${a} : la baleine replacée en ${vers.x}, ${vers.y}`).toBeGreaterThanOrEqual(3);
    }
});

it('sur une île-école, la rangée de côte devant les bornes reste nue : aucun décor, rien posé sur le sol', () => {
  const tout = toutConstruit();
  for (const archipel of ARCHIPELAGOS) {
    const id = archipel.school;
    const def = islandDef(id);
    const rangee = rangeeDevantLesBornes(id);
    // La rangée de côte, droit devant toutes les bornes (et plus loin sur l'axe de la caméra).
    const y = def.core.y + bornesDuCoeur(def).y0 - 1;
    for (const st of questStations(id)) expect(rangee.has(`${def.core.x + st.x},${y}`), `${id}, borne ${st.typeId}`).toBe(true);
    for (const partie of [{ progress: {}, world: { parts: {}, log: [], links: [] } }, tout])
      for (const sentinelles of [false, true]) {
        const surLaRangee = worldCubes(archipel.classe, partie.progress, partie.world, true, [], sentinelles).filter(
          (c) => c.y === y && rangee.has(`${c.x},${c.y}`) && (c.decor !== undefined || !c.sol),
        );
        expect(
          surLaRangee.map((c) => `${c.x - def.core.x},${c.y - def.core.y},${c.z}:${c.decor ?? c.color}`),
          id,
        ).toEqual([]);
      }
  }
  // Les autres îles n'en ont pas.
  expect(rangeeDevantLesBornes('french-6e-grammar-spelling').size).toBe(0);
});

it('chaque mission a sa borne sur la rangée de devant, dans le cœur, hors de la zone des plans et loin de la créature', () => {
  for (const b of BIOMES) {
    const stations = questStations(b.id);
    expect(stations.map((s) => s.typeId)).toEqual(missionsJouables(b).map((e) => e.id));
    const spot = creatureSpot(b.id);
    const creature = new Set<string>();
    for (const [sx, sy] of spot.steps) for (const c of CREATURE_CUBES[b.id]) creature.add(`${spot.x + sx + c.x},${spot.y + sy + c.y}`);
    for (const st of stations) {
      expect(st.x).toBeGreaterThanOrEqual(0);
      // Une île-école à cinq missions pose sa dernière borne en (16, 1), dans son cœur agrandi (GD-14).
    expect(st.x).toBeLessThanOrEqual(PLACES_DES_BORNES_DES_ECOLES.at(-1)!);
    if (st.x >= CORE) expect(bornesDuCoeur(islandDef(b.id)).x1, b.id).toBeGreaterThan(st.x);
      expect(st.y).toBeLessThan(PLAN_ZONE.y);
      expect(creature.has(`${st.x},${st.y}`), `${b.id} ${st.typeId}`).toBe(false);
    }
  }
  // Dans le monde : un socle et une ardoise étoilée par borne, étiquetés « île:mission », délavés sur une île fermée.
  const cubes = worldCubes('6e', {}, { parts: {}, log: [], links: [] });
  const foret = cubes.filter((c) => c.quest?.startsWith('french-6e-phonology:'));
  expect(foret).toHaveLength(2 * 3);
  expect(foret.filter((c) => c.texture === 'borne')).toHaveLength(3);
  expect(foret.every((c) => !c.muted)).toBe(true);
  const mine = cubes.filter((c) => c.quest?.startsWith('french-6e-letter-confusion:'));
  expect(mine.length).toBeGreaterThan(0);
  expect(mine.every((c) => c.muted)).toBe(true);
});

it('chaque créature reste petite devant son Gardien, dans les modèles (le dessin de Blocland réduit le Gardien de moitié, GD-11)', () => {
  for (const b of BIOMES) {
    const g = GUARDIAN_CUBES[b.id];
    expect(Math.min(...g.map((c) => c.x)), b.id).toBeGreaterThanOrEqual(0);
    const gh = Math.max(...g.map((c) => c.z)) + 1;
    const ch = Math.max(...CREATURE_CUBES[b.id].map((c) => c.z)) + 1;
    expect(gh, b.id).toBeGreaterThanOrEqual(6);
    expect(ch, b.id).toBeLessThanOrEqual(9);
    expect(ch, b.id).toBeLessThan(gh + 2);
  }
});

it('la caméra cadre l’île du bonhomme et ses voisines, et pivote vers le centre de l’archipel sans dépasser 40 degrés', () => {
  // La Forêt et ses voisines (Mine, Ferme, Plaine) : la zone englobe toutes leurs terres ; le Carrefour est ailleurs.
  const z = viewZone('french-6e-phonology');
  for (const id of ['french-6e-phonology', 'french-6e-letter-confusion', 'french-6e-grammar-spelling', 'maths-6e-calculation'] as const) {
    const b = landBox(islandDef(id));
    expect(b.x0).toBeGreaterThanOrEqual(z.minX);
    expect(b.x1).toBeLessThanOrEqual(z.maxX);
    expect(b.y0).toBeGreaterThanOrEqual(z.minY);
    expect(b.y1).toBeLessThanOrEqual(z.maxY);
  }
  expect(landBox(islandDef('french-5e-homophones')).y0).toBeGreaterThan(z.maxY);
  // Au centre, pas de pivot ; sur le bord ouest (Tour), la caméra tourne vers l'est ; à l'est (Carrière), vers l'ouest.
  expect(Math.abs(viewYaw('french-6e-phonology'))).toBeLessThan(0.25);
  expect(viewYaw('french-6e-reading')).toBeGreaterThan(0.3);
  expect(viewYaw('french-6e-word-spelling')).toBeLessThan(-0.3);
  for (const b of BIOMES) expect(Math.abs(viewYaw(b.id))).toBeLessThanOrEqual(VIEW_YAW_MAX + 1e-9);
});

it('la mer est habillée de rochers et de bancs de sable, loin des terres, des ouvrages, du port et des baleines', () => {
  const decor = seaDecor('6e');
  expect(decor.length).toBeGreaterThan(60);
  expect(decor.some((c) => c.texture === 'sable')).toBe(true);
  expect(decor.some((c) => c.texture === 'galet')).toBe(true);
  expect(decor.every((c) => c.tag === 'mer' && c.z >= -1 && c.z <= 1)).toBe(true);
  const solid = new Set<string>();
  for (const def of mapOf('6e')) for (const c of landCells(def)) solid.add(`${c.x},${c.y}`);
  // Les tracés des liaisons : les écueils en gardent une case (le traceur les contourne), la terre en garde trois.
  const traces = new Set<string>();
  for (const def of BRIDGES.filter((b) => archipelagoOf(b.from).classe === '6e')) for (const c of bridgePath(def, [])) traces.add(`${c.x},${c.y}`);
  const dock = dockBox('maths-6e-calculation');
  for (let x = dock.x0; x <= dock.x1; x++) for (let y = dock.y0; y <= dock.y1; y++) solid.add(`${x},${y}`);
  const whales = whaleSpots('6e', []);
  for (const c of decor) {
    for (let dx = -3; dx <= 3; dx++)
      for (let dy = -3; dy <= 3; dy++) expect(solid.has(`${c.x + dx},${c.y + dy}`), `décor de mer contre la terre en ${c.x},${c.y}`).toBe(false);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) expect(traces.has(`${c.x + dx},${c.y + dy}`), `décor de mer contre une liaison en ${c.x},${c.y}`).toBe(false);
    for (const w of whales) expect(Math.hypot(w.x - c.x, w.y - c.y)).toBeGreaterThan(w.r + 2);
  }
  // Les cubes du monde contiennent l'habillage, et un ouvrage ne le remplace jamais.
  const world = worldCubes('6e', {}, { parts: {}, log: [], links: BRIDGES.map((b) => b.id) });
  expect(world.filter((c) => c.tag === 'mer')).toHaveLength(decor.length);
  // Chaque archipel habille sa mer à sa façon : plaques de glace dans les Collines, aiguilles d'ardoise dans les Monts, rien dans le ciel.
  const collines = seaDecor('5e');
  expect(collines.some((c) => c.texture === 'glace')).toBe(true);
  expect(collines.some((c) => c.texture === 'sable')).toBe(false);
  const monts = seaDecor('4e');
  expect(monts.some((c) => c.texture === 'ardoise' && c.z >= 1)).toBe(true);
  expect(monts.some((c) => c.texture === 'sable')).toBe(false);
  expect(seaDecor('3e')).toEqual([]);
  expect(worldCubes('3e', {}).some((c) => c.tag === 'mer')).toBe(false);
});

it('le port : une jetée dans l’eau devant l’île-port, et le Bloc-Navire à côté, hors de tout', () => {
  for (const a of ARCHIPELAGOS) {
    const def = islandDef(a.port);
    const cells = dockCells(a.port);
    expect(cells.length, a.port).toBeGreaterThanOrEqual(8);
    // Dans l'eau, devant l'île, hors de tout ouvrage ; descend d'une marche par case au plus.
    const paths = new Set(BRIDGES.filter((b) => archipelagoOf(b.from).classe === a.classe).flatMap((b) => bridgePath(b, []).map((c) => `${c.x},${c.y}`)));
    let prevZ = def.altitude;
    for (const c of cells) {
      expect(isLandAt(c.x, c.y), `${a.port} jetée sur la terre en ${c.x},${c.y}`).toBe(false);
      expect(c.y, a.port).toBeLessThan(def.core.y);
      expect(paths.has(`${c.x},${c.y}`), `${a.port} jetée sur un ouvrage`).toBe(false);
      expect(prevZ - c.z, a.port).toBeLessThanOrEqual(1);
      prevZ = c.z;
    }
    // L'emprise du navire : dans l'eau, hors de la jetée, dans l'étendue de la scène.
    const o = dockOrigin(a.port);
    const jetty = new Set(cells.map((c) => `${c.x},${c.y}`));
    const bounds = worldBounds(a.classe);
    for (let x = o.x; x < o.x + VEHICLE_SIZE.w; x++)
      for (let y = o.y; y < o.y + VEHICLE_SIZE.d; y++) {
        expect(isLandAt(x, y), `${a.port} navire sur la terre en ${x},${y}`).toBe(false);
        expect(jetty.has(`${x},${y}`), `${a.port} navire sur la jetée`).toBe(false);
        expect(x).toBeGreaterThanOrEqual(bounds.minX);
        expect(y).toBeGreaterThanOrEqual(bounds.minY);
      }
    // Dans le monde : les planches et deux lanternes du quai (allumées dès qu'un plan est fini), étiquetées du port.
    const cubes = worldCubes(a.classe, {}, { ...village(everything), parts: builtPlans(plansFor(a.port)) }, false).filter((c) => c.tag === a.port);
    expect(cubes.filter((c) => c.texture === 'planches' || c.texture === 'escalier').length).toBeGreaterThanOrEqual(cells.length);
    expect(cubes.filter((c) => c.texture === 'lanterne' && c.y < def.core.y).length).toBeGreaterThanOrEqual(2);
  }
  function isLandAt(x: number, y: number): boolean {
    return MAP.some((d) => landCells(d).some((c) => c.x === x && c.y === y));
  }
});

it('le port montre l’état du village : lanternes, barques, foyer, caisses, fanions et feu de port, jamais sur la jetée ni à la place du navire', () => {
  for (const a of ARCHIPELAGOS) {
    const port = a.port;
    const portPlans = builtPlans(plansFor(port));
    const all = { ...portPlans, ...builtPlans(monumentsOf(a.classe)) };
    const paid = BRIDGES.map((b) => b.id);
    // Un village à chaque état, du 1 au 5 (le 3e s'arrête à 4 : pas de voyage suivant).
    const states = [
      village([]),
      { ...village([]), parts: portPlans },
      { ...village(paid), parts: portPlans },
      { ...village(paid), parts: all },
      { ...village(everything), parts: all },
    ].slice(0, a.classe === '3e' ? 4 : 5);
    const cells = dockCells(port);
    const jetty = new Set(cells.map((c) => `${c.x},${c.y}`));
    const posts = dockPosts(port);
    const o = dockOrigin(port);
    const inShip = (c: { x: number; y: number }) => c.x >= o.x && c.x < o.x + VEHICLE_SIZE.w && c.y >= o.y && c.y < o.y + VEHICLE_SIZE.d;
    const end = cells[cells.length - 1];
    const beacon = { x: end.x, y: end.y - 1 };
    states.forEach((v, i) => {
      expect(villageStage(v, a.classe).rank, `${port} état ${i + 1}`).toBe(i + 1);
      const world = worldCubes(a.classe, {}, v, true);
      const mine = world.filter((c) => c.tag === port);
      const onPost = (texture: string) => posts.filter((p) => mine.some((c) => c.x === p.x && c.y === p.y && c.z === p.z + 1 && c.texture === texture));
      // Les objets ajoutés : ceux du quai (barques, foyer, caisses, fanions), les chapeaux des poteaux et le feu de port.
      const props = mine.filter((c) => /\/(barque|foyer|caisse|fanion)@/.test(c.decor ?? ''));
      const added = [...props, ...mine.filter((c) => posts.some((p) => p.x === c.x && p.y === c.y && c.z > p.z) || (c.x === beacon.x && c.y === beacon.y))];
      for (const c of added) {
        expect(jetty.has(`${c.x},${c.y}`), `${port} ${c.decor ?? c.texture} sur la jetée`).toBe(false);
        expect(inShip(c), `${port} ${c.decor ?? c.texture} à la place du navire`).toBe(false);
      }
      // Chaque cube ajouté a sa place à lui.
      const at = new Map<string, number>();
      for (const c of world) at.set(`${c.x},${c.y},${c.z}`, (at.get(`${c.x},${c.y},${c.z}`) ?? 0) + 1);
      for (const c of added) expect(at.get(`${c.x},${c.y},${c.z}`), `${port} cube en double en ${c.x},${c.y},${c.z}`).toBe(1);
      const rank = i + 1;
      const lit = onPost('lanterne');
      if (rank === 1) {
        // Abandonné : aucune lanterne sur la jetée, un bouchon de bois sur les deux derniers poteaux.
        expect(lit).toEqual([]);
        expect(onPost('planches')).toHaveLength(2);
      } else expect(lit).toHaveLength(rank >= 5 ? posts.length : 2);
      // Au port : une lanterne par poteau, et le feu au bout de la jetée (un pilier de pierre depuis l'eau, ou depuis le
      // quai dans le ciel, et une lanterne trois cases au-dessus du quai).
      const fire = mine.filter((c) => c.x === beacon.x && c.y === beacon.y);
      const rest = vehicleRestZ(a.classe);
      const pied = a.classe === '3e' ? rest : 0;
      if (rank >= 5) expect(fire.map((c) => c.texture)).toEqual([...Array(rest + 3 - pied).fill('pierre'), 'lanterne']);
      else expect(fire).toEqual([]);
      // Les barques : aucune dans le ciel ; grise sur la grève (1), en bois (2), à l'eau contre la jetée (3), une de chaque (4, 5).
      const boats = props.filter((c) => c.decor!.includes('/barque@'));
      const afloat = boats.filter((c) => c.z <= vehicleRestZ(a.classe) + 1 && c.x < end.x && c.y < shoreY(port));
      const ashore = boats.filter((c) => !afloat.includes(c));
      if (a.classe === '3e') expect(boats).toEqual([]);
      else {
        expect(ashore.length > 0, `${port} barque sur la grève, état ${rank}`).toBe(rank !== 3);
        expect(afloat.length > 0, `${port} barque amarrée, état ${rank}`).toBe(rank >= 3);
        expect(ashore.every((c) => Boolean(c.muted) === (rank === 1))).toBe(true);
      }
      // Le foyer fume dès la reconstruction ; caisses et fanions au développement.
      const has = (kind: string) => props.some((c) => c.decor!.includes(`/${kind}@`));
      expect(has('foyer'), `${port} foyer`).toBe(rank >= 3);
      expect(has('caisse'), `${port} caisses`).toBe(rank >= 4);
      expect(new Set(props.filter((c) => c.decor!.includes('/fanion@')).map((c) => c.decor)).size, `${port} fanions`).toBe(rank >= 4 ? 2 : 0);
      // Le bonhomme marche toujours de sa place au pied de la jetée, et les objets du quai ne sont pas un sol.
      const ground = walkGround(world, creaturePlacements(a.classe, v.links));
      const route = boardingRoute(port);
      const foot = route[2];
      expect(walkPath(ground, route[0], foot), `${port} état ${rank}`).not.toBeNull();
      for (const c of props) expect(ground.feet.has(`${c.x},${c.y}`) && ground.feet.get(`${c.x},${c.y}`)! > c.z, `${port} on marche sur ${c.decor}`).toBe(false);
    });
  }
});

it('le bonhomme embarque : de son île à la jetée, planche par planche, jusqu’au pont du navire', () => {
  for (const a of ARCHIPELAGOS) {
    const route = boardingRoute(a.port);
    const o = dockOrigin(a.port);
    expect(route[0]).toEqual(avatarHome(a.port));
    // Il finit sur le pont, une case au-dessus du plancher.
    expect(route[route.length - 1]).toEqual({ x: o.x + VEHICLE_DECK.x, y: o.y + VEHICLE_DECK.y, z: o.z + 1 });
    // Sur la jetée, ses pieds sont sur une planche.
    const planks = new Map(dockCells(a.port).map((c) => [`${c.x},${c.y}`, c.z]));
    const onJetty = route.filter((p) => planks.has(`${p.x},${p.y}`));
    expect(onJetty.length, a.port).toBeGreaterThanOrEqual(3);
    for (const p of onJetty) expect(p.z, a.port).toBe(planks.get(`${p.x},${p.y}`)! + 1);
    // Jamais un pas de plus d'un bloc de haut.
    for (let i = 1; i < route.length; i++) expect(Math.abs(route[i].z - route[i - 1].z), a.port).toBeLessThanOrEqual(1);
  }
});

it('le Bloc-Navire : le chantier du port montre ses cases en fantôme, les étapes parties sont dessinées entières', () => {
  const [coque, ballon] = VEHICLE_STAGES;
  // Le navire n'est pas dans le terrain (il tangue, c'est un objet à part) : le terrain ne garde que la jetée.
  // Au large de sa côte de devant (le cœur agrandi et sa côte, GD-11).
  const plaine = islandDef('maths-6e-calculation');
  const terrain = worldCubes('6e', {}, village([]), false).filter((c) => c.tag === 'maths-6e-calculation' && c.y < coeurDe(plaine).y0 - plaine.ext.front);
  expect(terrain.some((c) => c.ghost)).toBe(false);
  expect(terrain.every((c) => c.texture === 'planches' || c.texture === 'escalier' || c.texture === 'tronc' || c.texture === 'lanterne')).toBe(true);
  // Au début, sur la Plaine : la coque en fantôme (la voile aussi, tant que les Gardiens ne sont pas vaincus), amarrée au quai.
  const fresh = vehiclePlacement('6e', {}, village([]));
  expect(fresh.port).toBe('maths-6e-calculation');
  expect(fresh.origin).toEqual(dockOrigin('maths-6e-calculation'));
  expect(fresh.afloat).toBe(true);
  expect(fresh.building).toBe(coque.id);
  expect(fresh.cubes.filter((c) => c.ghost).length).toBe(coque.cells.length + coque.kit.length);
  // Les cubes sont locaux : dans l'encombrement du navire.
  for (const c of fresh.cubes) {
    expect(c.x).toBeGreaterThanOrEqual(0);
    expect(c.x).toBeLessThan(VEHICLE_SIZE.w);
    expect(c.y).toBeLessThan(VEHICLE_SIZE.d);
  }
  // Trois Gardiens vaincus : la voile est là, en dur.
  const guardians = Object.fromEntries(['french-6e-phonology', 'maths-6e-calculation', 'french-6e-letter-confusion'].map((id) => [`${id}-challenge`, { stars: 2 }]));
  const sail = vehiclePlacement('6e', guardians, village([])).cubes.filter((c) => c.texture === 'toile');
  expect(sail).toHaveLength(coque.kit.filter((c) => c.block === BLOC.toile).length);
  expect(sail.every((c) => !c.ghost)).toBe(true);
  // Le voyage fait : la coque entière et en dur ; au Marché, le ballon en fantôme au-dessus.
  const sailed = vehiclePlacement('5e', {}, village(['passage-5e']));
  expect(sailed.port).toBe('maths-5e-proportionality');
  expect(sailed.building).toBe(ballon.id);
  expect(sailed.cubes.filter((c) => !c.ghost && c.texture === 'planches').length).toBeGreaterThan(0);
  expect(sailed.cubes.filter((c) => c.ghost).length).toBe(ballon.cells.length + ballon.kit.length);
  // Revenu dans les Premiers Rivages après le deuxième voyage : le navire porte son ballon, rien en fantôme, rien à construire ici.
  const back = vehiclePlacement('6e', {}, village(['passage-5e', 'passage-4e']));
  expect(back.cubes.some((c) => c.ghost)).toBe(false);
  expect(back.building).toBeNull();
  expect(back.cubes.filter((c) => c.texture === 'toile').length).toBeGreaterThan(coque.kit.length);
  // Dans les Îles du Ciel, il plane à hauteur de quai.
  expect(vehiclePlacement('3e', {}, village(['passage-5e', 'passage-4e', 'passage-3e'])).afloat).toBe(false);
});

it('l’école, la salle des trophées et le lieu où l’on assemble : sur l’île de l’école de chaque archipel, libres, leur porte accessible, les ouvrages aussi', () => {
  for (const [a, atelier] of ARCHIPELAGOS.flatMap((x) => (['fabrique', 'halle'] as const).map((t) => [x, t] as const))) {
    const island = a.school;
    expect(a.starts).toContain(island);
    const cubes = worldCubes(a.classe, {}, village(everything), true, [BLOC.or, BLOC.cristal, BLOC.quartz], false, atelier);
    const { ox, oy } = islandOrigin(BIOMES.findIndex((b) => b.id === island));
    const ground = walkGround(cubes, creaturePlacements(a.classe, everything));
    for (const place of ['school', 'trophies', 'assembly'] as const) {
      const cells = cubes.filter((c) => c.place === place);
      expect(cells.length, place).toBeGreaterThan(0);
      // Rien que sur l'île de l'école.
      expect(new Set(cells.map((c) => c.tag))).toEqual(new Set([island]));
      const spot = placeSpot(place, island)!;
      expect(spot).toMatchObject({ x: ox + VILLAGE_PLACES[place].at.x, y: oy + VILLAGE_PLACES[place].at.y });
      for (const c of cells) {
        const lx = c.x - ox;
        const ly = c.y - oy;
        // Dans son emprise (les autres lieux, le décor et la créature s'en écartent).
        const { at, size } = VILLAGE_PLACES[place];
        expect(lx >= at.x && lx < at.x + size.w && ly >= at.y && ly < at.y + size.d, `${place} ${lx},${ly}`).toBe(true);
        // Dans le cœur, hors de la zone des plans, loin des bornes (et de leur marge) ; la rangée de devant reste libre.
        const bc = bornesDuCoeur(islandDef(island));
        expect(lx >= bc.x0 && lx < bc.x1 && ly >= bc.y0 && ly < bc.y1, `${place} ${lx},${ly}`).toBe(true);
        expect(lx >= PLAN_ZONE.x && lx < PLAN_ZONE.x + PLAN_ZONE.w && ly >= PLAN_ZONE.y && ly < PLAN_ZONE.y + PLAN_ZONE.h).toBe(false);
        for (const st of questStations(island)) expect(Math.abs(lx - st.x) <= 1 && Math.abs(ly - st.y) <= 1).toBe(false);
        expect(ly).toBeGreaterThan(0);
      }
      // Le bonhomme va de sa place à la porte.
      const door = placeDoor(place, island)!;
      expect(ground.feet.get(`${door.x},${door.y}`)).toBe(door.z);
      expect(walkPath(ground, avatarHome(island), door)).not.toBeNull();
      // Hors de l'emprise que la salle des trophées prendra en grandissant (GD-3 : jusqu'à 8 × 3, de (0,8) à (7,10)).
      if (place !== 'trophies') {
        const dx = door.x - ox;
        const dy = door.y - oy;
        expect(dx >= 0 && dx <= 7 && dy >= 8 && dy <= 10, `${place} : porte en ${dx},${dy}`).toBe(false);
        for (const c of cells) expect(c.x - ox <= 7 && c.y - oy >= 8 && c.y - oy <= 10, `${place} ${c.x - ox},${c.y - oy}`).toBe(false);
      }
    }
    // L'école : murs, porte, toit et cloche. La salle : un trophée par succès, à sa place.
    expect(cubes.filter((c) => c.place === 'school').some((c) => c.texture === 'porte')).toBe(true);
    const hall = placeSpot('trophies', island)!;
    const trophy = (i: number) => cubes.find((c) => c.place === 'trophies' && c.x === hall.x + TROPHY_SLOTS[i].x && c.y === hall.y + TROPHY_SLOTS[i].y && c.z === islandDef(island).altitude + hall.h + TROPHY_SLOTS[i].z);
    expect([0, 1, 2].map((i) => trophy(i)?.texture)).toEqual(['or', 'cristal', 'quartz']);
    expect(trophy(3)).toBeUndefined();
    // Les ouvrages qui partent de l'île restent accessibles à pied depuis la place du bonhomme.
    for (const b of BRIDGES.filter((x) => linkKind(x, everything) !== 'sentier' && everything.includes(x.id) && (x.from === island || x.to === island))) {
      const path = bridgePath(b, everything);
      const end = b.from === island ? path[0] : path[path.length - 1];
      expect(walkPath(ground, avatarHome(island), { x: end.x, y: end.y, z: end.z + 1 }), b.id).not.toBeNull();
    }
  }
  // Ailleurs, rien.
  expect(placeSpot('school', 'french-6e-letter-confusion')).toBeNull();
  expect(allCubes({}, village(everything)).filter((c) => c.place === 'school' || c.place === 'trophies' || c.place === 'assembly').every((c) => ARCHIPELAGOS.some((a) => a.school === c.tag))).toBe(true);
});

it('le lieu où l’on assemble (GD-2) : la Fabrique de Blocland et la Halle d’Archipéo, même emprise, même porte ouverte, le bloc de l’archipel suspendu', () => {
  for (const a of ARCHIPELAGOS) {
    const recette = recetteDeLArchipel(a.classe)!;
    for (const atelier of ['fabrique', 'halle'] as const) {
      const m = atelierModel(atelier, a.classe);
      const at = (x: number, y: number, z: number) => m.find((c) => c.x === x && c.y === y && c.z === z)?.block;
      // Aucune case en double, toutes dans l'emprise.
      expect(new Set(m.map((c) => `${c.x},${c.y},${c.z}`)).size).toBe(m.length);
      expect(m.every((c) => c.x >= 0 && c.x < ASSEMBLAGE_SIZE.w && c.y >= 0 && c.y < ASSEMBLAGE_SIZE.d && c.z >= 1)).toBe(true);
      // La grande porte ouverte, en face de la case où le bonhomme s'arrête : la cour et la porte sont libres.
      const door = VILLAGE_PLACES.assembly.door;
      for (const [y, z] of [[0, 1], [0, 2], [1, 1], [1, 2], [2, 1], [2, 2], [3, 1], [3, 2]]) expect(at(door, y, z), `${y},${z}`).toBeUndefined();
      expect(at(door, 4, 1)).toBeDefined();
      // Le bloc assemblé de l'archipel, suspendu sous le bras de bois de la potence (rien autour de lui), et les blocs de
      // sa recette. Dans la Halle, la potence est plus haute : son repère au-dessus de la salle des trophées.
      const bras = atelier === 'halle' ? 6 : 4;
      expect(at(0, 0, bras - 2)).toBe(recette.bloc);
      for (let z = 1; z < bras; z++) if (z !== bras - 2) expect(at(0, 0, z), `${z}`).toBeUndefined();
      expect([at(0, 0, bras), at(0, 1, bras), at(0, 1, 1)]).toEqual([BLOC.bois, BLOC.bois, BLOC.bois]);
      for (const i of recette.ingredients) expect(m.some((c) => c.y < 2 && c.block === i.bloc), i.bloc).toBe(true);
      // Ce qui change d'un univers à l'autre : la brique, le toit plat et la cheminée ; le bois sur la pierre et les deux pentes.
      if (atelier === 'fabrique') {
        // Un soubassement de pierre sous la brique, une haute cheminée (sommet à 7).
        expect([at(0, 2, 1), at(0, 2, 2)]).toEqual([BLOC.pierre, BLOC.brique]);
        expect(m.filter((c) => c.z === 4 && c.y >= 2).every((c) => c.block === BLOC.taille)).toBe(true);
        expect([5, 6, 7].map((z) => at(2, 4, z))).toEqual([BLOC.pierre, BLOC.pierre, BLOC.pierre]);
        expect(Math.max(...m.map((c) => c.z))).toBe(7);
      } else {
        expect([at(0, 2, 1), at(0, 2, 2)]).toEqual([BLOC.pierre, BLOC.bois]);
        expect(at(1, 2, 4)).toBe(BLOC.toit);
        expect(at(0, 2, 4)).toBeUndefined();
        expect(m.filter((c) => c.z > 4).every((c) => c.x === 0 && c.y <= 1)).toBe(true);
      }
    }
  }
});

it('la salle des trophées a une place par succès', () => {
  expect(TROPHY_SLOTS.length).toBeGreaterThanOrEqual(BADGES.length);
  expect(new Set(TROPHY_SLOTS.map((t) => `${t.x},${t.y},${t.z}`)).size).toBe(TROPHY_SLOTS.length);
  // Un trophée ne remplace jamais un cube de la salle.
  const hall = new Set(trophyModel().map((c) => `${c.x},${c.y},${c.z}`));
  for (const t of TROPHY_SLOTS) expect(hall.has(`${t.x},${t.y},${t.z}`)).toBe(false);
});

describe('les bornes dans la vue de l’île', () => {
  it('aucun décor posé (arbre, buisson, rocher, objet du quai) ne cache une borne, pied compris, partie vierge ou tout construit', () => {
    const tout = toutConstruit();
    for (const a of ARCHIPELAGO_IDS)
      for (const partie of [{ progress: {}, world: { parts: {}, log: [], links: [] } }, tout]) {
        const cubes = worldCubes(a, partie.progress, partie.world);
        for (const b of BIOMES.filter((x) => x.classe === a)) {
          const o = origineDe(b.id);
          const socles = new Map(cubes.filter((c) => c.quest?.startsWith(`${b.id}:`)).map((c) => [`${c.x},${c.y}`, c]));
          const bornes = questStations(b.id).map((st) => {
            const socle = socles.get(`${o.x + st.x},${o.y + st.y}`);
            expect(socle, `${b.id}, borne ${st.typeId}`).toBeDefined();
            return { x: o.x + st.x, y: o.y + st.y, base: socle!.z - 1 };
          });
          const vers = versLaCamera(b.id);
          const cachent = cubes.filter((c) => decorPose(c.decor) && cacheUneBorne(bornes, vers, c.x, c.y, c.z)).map((c) => c.decor);
          expect([...new Set(cachent)], `${a}, ${b.id}`).toEqual([]);
        }
      }
  });

  it('la salle des trophées avec ses 24 succès (ses deux travées) ne couvre ni le pied ni le haut d’une borne (GD-3)', () => {
    const { progress, world: village } = toutConstruit();
    const tous = BADGES.map((x) => trophyBlock(x.id));
    for (const a of ARCHIPELAGOS) {
      const cubes = worldCubes(a.classe, progress, village, true, tous);
      const o = origineDe(a.school);
      const salle = cubes.filter((c) => c.place === 'trophies');
      // Les deux travées sont là : la salle va de x = 0 à 7 dans son emprise.
      expect(new Set(salle.map((c) => c.x - o.x - TROPHY_AT.x)).size, a.school).toBe(TROPHY_SIZE.w);
      const bornes = questStations(a.school).map((st) => {
        const socle = cubes.find((c) => c.quest === `${a.school}:${st.typeId}` && c.texture !== 'borne');
        expect(socle, `${a.school}, borne ${st.typeId}`).toBeDefined();
        return { x: o.x + st.x, y: o.y + st.y, base: socle!.z - 1 };
      });
      const vers = versLaCamera(a.school);
      expect(
        salle.filter((c) => cacheUneBorne(bornes, vers, c.x, c.y, c.z)).map((c) => `${c.x - o.x},${c.y - o.y},${c.z}`),
        a.school,
      ).toEqual([]);
    }
  });

  it('à la Tour du lecteur, rien ne se dresse devant la deuxième borne, entre elle et la caméra', () => {
    const cubes = worldCubes('6e', {});
    const o = origineDe('french-6e-reading');
    const st = questStations('french-6e-reading')[1];
    const socle = cubes.find((c) => c.quest && c.x === o.x + st.x && c.y === o.y + st.y);
    expect(socle).toBeDefined();
    const base = socle!.z - 1;
    // Le tronc de l’arbre qui la cachait était en (6, −1), deux rangées devant elle.
    expect(cubes.filter((c) => c.decor && c.x === o.x + st.x && c.y < o.y + st.y && c.y >= o.y + st.y - 3 && c.z > base + 1)).toEqual([]);
  });

  it('sur les quatre îles-écoles, la créature et ses pas ne se tiennent jamais entre la caméra de l’île et un lieu du village, emprise réservée de la salle comprise (GD-3)', () => {
    const ecoles = ARCHIPELAGOS.map((a) => a.school);
    expect(ecoles.sort()).toEqual(['french-6e-phonology', 'maths-3e-functions', 'maths-4e-algebra', 'maths-5e-proportionality']);
    for (const id of ecoles) {
      const lieux = lieuxVus(id);
      // Toute l'emprise de la salle (8 × 3, sur deux rangs), l'école et le lieu où l'on assemble.
      for (let x = 0; x < TROPHY_SIZE.w; x++)
        for (let y = 0; y < TROPHY_SIZE.d; y++) expect(lieux.filter((l) => l.x === TROPHY_AT.x + x && l.y === TROPHY_AT.y + y).length, `${id} ${x},${y}`).toBe(2);
      const vers = versLaCamera(id);
      const spot = creatureSpot(id);
      const caches = spot.steps.flatMap(([sx, sy]) => creatureDuMonde(id).filter((c) => cacheUnLieu(lieux, vers, spot.x + sx + c.x, spot.y + sy + c.y, c.z + 1)));
      expect(caches, id).toEqual([]);
    }
    // Ailleurs, pas de lieu : rien à cacher.
    expect(lieuxVus('maths-6e-calculation')).toEqual([]);
  });

  it('un cube devant la salle des trophées, entre elle et la caméra, la cache ; derrière elle ou au-dessus des rayons, jamais', () => {
    const lieux = lieuxVus('french-6e-phonology');
    const vers = versLaCamera('french-6e-phonology');
    // Devant la première travée (vers la caméra : x croissants, y décroissants), à hauteur d'homme.
    expect(cacheUnLieu(lieux, vers, TROPHY_AT.x + 3, TROPHY_AT.y - 2, 2)).toBe(true);
    // Sur l'emprise réservée elle-même.
    expect(cacheUnLieu(lieux, vers, TROPHY_AT.x, TROPHY_AT.y, 1)).toBe(true);
    // Derrière la salle, ou sous le sol.
    expect(cacheUnLieu(lieux, vers, TROPHY_AT.x + 3, TROPHY_AT.y + TROPHY_SIZE.d + 2, 2)).toBe(false);
    expect(cacheUnLieu(lieux, vers, TROPHY_AT.x + 3, TROPHY_AT.y - 2, -1)).toBe(false);
  });

  it('un cube collé à la borne, à sa hauteur, la cache quelle que soit la direction ; un cube sous son sol ou au-delà de la portée, jamais', () => {
    const bornes = [{ x: 0, y: 0, base: 0 }];
    for (const vers of [versLaCamera('french-6e-reading'), [0, 0, 1] as [number, number, number], [-0.6, 0.6, 0.53] as [number, number, number]]) {
      expect(cacheUneBorne(bornes, vers, 1, 0, 1)).toBe(true);
      expect(cacheUneBorne(bornes, vers, 0, 1, 2)).toBe(true);
      expect(cacheUneBorne(bornes, vers, 1, 0, 0)).toBe(false);
      expect(cacheUneBorne(bornes, vers, PORTEE_DEVANT_LA_BORNE + 1, 0, 3)).toBe(false);
    }
  });
});

describe('les bulles suivent la vue glissée (4 octobre 2026)', () => {
  it('un petit glissé reste sur l’île où l’on est ; un glissé jusqu’au cœur d’une voisine passe sur elle', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const iles = islandsOf(a);
      for (const ile of iles) {
        for (const d of [{ x: 2, z: 0 }, { x: -2, z: 0 }, { x: 0, z: 2 }, { x: 0, z: -2 }]) expect(ileDeLaVueGlissee(a, ile.id, d)).toBe(ile.id);
      }
      const [x, y] = iles;
      if (!y) continue;
      const cx = islandCenter(x.id);
      const cy = islandCenter(y.id);
      expect(ileDeLaVueGlissee(a, x.id, { x: cy.x - cx.x, z: cy.y - cx.y })).toBe(y.id);
    }
  });
});

it('un Gardien qui se rallume au défi reprend ses couleurs des pieds vers la tête (GD-8)', () => {
  const g = gardienDuMonde('french-6e-phonology');
  const gris = (c: { color: string }) => estPierre(c.color);
  expect(gardienEnPartieRallume(g, 0).every(gris)).toBe(true);
  expect(gardienEnPartieRallume(g, 1)).toEqual(g);
  const moitie = gardienEnPartieRallume(g, 0.5);
  const bas = Math.min(...g.map((c) => c.z));
  const haut = Math.max(...g.map((c) => c.z));
  // Les pieds en couleurs, la tête encore en pierre.
  expect(moitie.filter((c) => c.z === bas)).toEqual(g.filter((c) => c.z === bas));
  expect(moitie.filter((c) => c.z === haut).every(gris)).toBe(true);
});
