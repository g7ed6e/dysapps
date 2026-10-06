// Le terrain du monde : une île par lieu (cœur 16 × 16 avec bornes de mission, relief léger, décor et créature, posé sur
// une terre plus large au relief varié, à son altitude), reliées par des ouvrages. Générateur pur (sans Three.js),
// testable. Ce fichier assemble les cubes d'une île et du monde ; chaque métier est dans son fichier de ./terrain/, que
// ce fichier réexporte : on importe le terrain d'ici. Le décor (arbres, repères, cascades, habillage de la mer) est
// dessiné par ./decor.ts, et posé ici.

import { type BiomeId, BIOMES, BLOC, BLOCKS } from '../biomes';
import type { World } from '../engine';
import type { VoxelCube } from './cube';
import { type ArchipelagoId, archipelagoOfIsland, inCoeurDOrigine, inCore, islandDef, type IslandDef, landCells, landscape, margesDuCoeur, noise, tirage, turnInWorld } from './map';
import { turnCell } from './placement';
import { type BridgeDef, buildableBridges, bridgeState, getBridge, isBiomeUnlocked, linkKind, opensAnIsland, reachableIslands } from './archipelago';
import { placedLinksOf } from './linkGeometry';
import { cascades, DECOR, decorate, GRASS, landmark, pontonEtBarque, type Put, WATER } from './decor';
import { LOW } from './paths';
import { guardianStatus } from '../boss';
import { commandeDeLIle } from './requests';
import { casesDeLaPetiteConstruction, eauDeLaPetiteConstruction, estPosee } from './fixtures';
import { decalageDesPlans, isPlanDone, planCells, type PlanDef, plansFor } from './plans';
import { lv2Courante } from '../../core/settings';
import { type Atelier, atelierModel, casesDuVillage, PLACE_IDS, placeCells, placeCube, placeSpot, schoolModel, trophyModel, VILLAGE_PLACES } from './terrain/village';
import { cleDeCube, DEPTH, fade, GROUND_COLOR, groundHeight, islandOrigin, LAYOUT_PAD, origineDe, taperLayers, TEXTURES, underground } from './terrain/base';
import { cacheUneBorne, presDUneBorne, questStations, rangeeDevantLesBornes } from './terrain/markers';
import { versLaCameraDuDessin } from './terrain/view';
import { abordsDansLesMarges, bridge, bridgePath, nearSentier, piedsDesOuvrages } from './terrain/links';
import { bossIslet } from './terrain/guardians';
import { creatureDuMonde, creatureSpot } from './terrain/creatures';
import { placeDeLaPetiteConstruction } from './terrain/fixture';
import { harbor } from './terrain/port';
import { monumentIslets } from './terrain/monuments';
import { joinsBetween } from './terrain/joins';
import { seaDecorShown } from './terrain/sea';

export { avatarHome, DEPTH, fade, FIN_DU_PLATEAU_DES_ECOLES, groundHeight, ISLAND, islandCenter, islandOrigin, LAYOUT_PAD, origineDe } from './terrain/base';
export { bornesDesLieux, type CadreDeCases, cadreDeLaLiaison, cadreDeTraversee, cameraDeLIle, DISTANCE_DE_LA_VUE_DE_L_ILE, HORS_DE_LA_COLONNE, ileDeLaVueGlissee, islandAt, overviewBounds, projectionDeLaVueDeLIle, versLaCamera, VIEW_YAW_MAX, viewYaw, viewZone, VISEE_AU_DESSUS_DU_SOL, VUE_DE_L_ILE, VUE_DE_L_ILE_PANNEAU_OUVERT, worldBounds } from './terrain/view';
export { type BorneVue, cacheUneBorne, PLACES_DES_BORNES_DES_ECOLES, placesDesBornes, PORTEE_DEVANT_LA_BORNE, questStations, rangeeDevantLesBornes } from './terrain/markers';
export { avatarRoute, BAC_LONG, boardingRoute, bridgePath, casesDeLOuvrage, placesDeLaFleche, portsDAttache, premierCoude, routeAt, routeLengths, tablier } from './terrain/links';
export { ASSEMBLAGE_SIZE, type Atelier, atelierModel, cacheUnLieu, casesDesLieux, HALLE, lieuxVus, placeDoor, placeSpot, schoolModel, TROPHY_AT, TROPHY_SIZE, TROPHY_SLOTS, trophyModel, VILLAGE_PLACES } from './terrain/village';
export { CREATURE_STEPS, creatureDuMonde, creaturePlacements, creatureSpot, gardienDuMonde, QUARTS_DE_TOUR, QUARTS_DE_TOUR_DE_LA_CREATURE, QUARTS_DE_TOUR_DU_GARDIEN } from './terrain/creatures';
export { bossIsletCenter, bossIsletOrigin, ILOT_DE_COTE, ISLET_GAP, ISLET_H, ISLET_W, origineDeLIlot } from './terrain/islets';
export { bossIsletCells, bossIsletSteps, gardienEnPartieRallume, guardianPlacements, statueDe } from './terrain/guardians';
export { casesDeLaPetiteConstructionDansLeMonde, placeDeLaPetiteConstruction } from './terrain/fixture';
export { BALEINES_REPLACEES, mistPatches, seaDecor, whaleSpots } from './terrain/sea';
export { vehiclePlacement, type VehiclePlacement } from './terrain/port';
export { ancreDuQuai, decalageDuQuai, monumentAnchor, monumentBlocked, monumentCenter, monumentIsletFree } from './terrain/monuments';

/**
 * Les cubes d'une île dans son repère (étape J5). Pour l'instant, l'île est calculée en cases du monde (map.ts place
 * son cœur dans le monde) puis ramenée à son origine ; R4b et la suite écrivent en repère d'île. Le sol, le paysage, le décor, les bornes, les lieux, l'îlot du
 * Gardien, la créature et les plans, en cases depuis le coin du cœur, z depuis l'altitude de l'île. Une case de plan
 * (c.x, c.y, c.z) y est le cube (c.x, c.y, c.z + 1). `voisins` : ce que les îles déjà posées occupent, en clés `cleDeCube` du monde
 * (une cascade ne tombe jamais sur la terre de l'île voisine) ; l'île y ajoute ses cubes.
 */
export function cubesDeLIle(
  id: BiomeId,
  progress: Record<string, { stars: number }>,
  village: World = { parts: {}, log: [], links: [] },
  withCreatures = true,
  /** Les succès gagnés, un bloc par succès : les trophées de la salle des trophées. */
  trophies: (keyof typeof BLOCKS)[] = [],
  voisins: Set<number> = new Set(),
  /** Archipéo (lot 6) : l'îlot et la sentinelle, avant que le défi soit prêt. */
  sentinelles = false,
  /** La silhouette du lieu où l'on assemble (GD-2), selon l'univers (l'habillage). */
  atelier: Atelier = 'fabrique',
): VoxelCube[] {
  const index = BIOMES.findIndex((b) => b.id === id);
  const cubes: VoxelCube[] = [];
  poserLIle(BIOMES[index], index, progress, village, withCreatures, trophies, voisins, cubes, sentinelles, atelier);
  const { ox, oy, oz } = islandOrigin(index);
  for (const c of cubes) {
    c.x -= ox;
    c.y -= oy;
    c.z -= oz;
  }
  tournerLesCubes(islandDef(id), cubes);
  return cubes;
}

/**
 * Les cubes d'un lieu dans son repère (relatifs à l'origine de son cœur), tournés avec lui (GD-9, `IslandDef.quarts`) :
 * le lieu se dessine sans être tourné, puis tourne d'un bloc autour du milieu de son cœur, bornes, bâtiments et îlot du
 * Gardien compris. Le nom d'un élément du décor du paysage porte sa case du monde (« arbre@x,y ») : elle tourne aussi.
 */
function tournerLesCubes(def: IslandDef, cubes: VoxelCube[]): void {
  if (!def.quarts) return;
  for (const c of cubes) {
    const t = turnCell(c.x, c.y, def.quarts);
    c.x = t.x;
    c.y = t.y;
    if (c.decor) c.decor = nomTourne(def, c.decor);
  }
}

/** Le nom d'un élément de décor (« lieu/genre@x,y », x, y du monde, le lieu pas tourné), sa case tournée avec le lieu. */
function nomTourne(def: IslandDef, nom: string): string {
  const at = nom.lastIndexOf('@');
  if (at < 0 || nom.includes('/cœur:')) return nom;
  const [x, y] = nom.slice(at + 1).split(',').map(Number);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return nom;
  const p = turnInWorld(def, x, y);
  return `${nom.slice(0, at + 1)}${p.x},${p.y}`;
}

/**
 * Tous les cubes d'un archipel, en cases du monde : chaque île née dans son repère (`cubesDeLIle`) et posée à sa place
 * par la grille, puis ce qui est entre les îles (le port, les îlots des monuments, la mer habillée, les ouvrages).
 */
export function worldCubes(
  a: ArchipelagoId,
  progress: Record<string, { stars: number }>,
  village: World = { parts: {}, log: [], links: [] },
  withCreatures = true,
  /** Les succès gagnés, un bloc par succès : les trophées de la salle des trophées. */
  trophies: (keyof typeof BLOCKS)[] = [],
  /** Archipéo (lot 6) : l'îlot et la sentinelle de chaque île ouverte, avant que son défi soit prêt. */
  sentinelles = false,
  /** La silhouette du lieu où l'on assemble (GD-2), selon l'univers (l'habillage) : la Fabrique ou la Halle. */
  atelier: Atelier = 'fabrique',
  /** Le départ choisi d'une liaison vers un lieu fermé (GD-9, « Relier », `chosenDeparture`) : son fantôme à la place du plus proche. */
  choisie: string | null = null,
): VoxelCube[] {
  const cubes: VoxelCube[] = [];
  // Tout ce qui est déjà posé dans la scène : une cascade ne tombe jamais sur la terre de l'île voisine.
  const placed = new Set<number>();
  for (const biome of BIOMES) {
    if (biome.classe !== a) continue;
    const o = origineDe(biome.id);
    for (const c of cubesDeLIle(biome.id, progress, village, withCreatures, trophies, placed, sentinelles, atelier)) {
      c.x += o.x;
      c.y += o.y;
      c.z += o.z;
      cubes.push(c);
    }
  }
  return entreLesIles(a, village, cubes, choisie, atelier);
}

/** Une île posée en cases du monde, ajoutée à `cubes` ; `placed` : ce que la scène occupe déjà (l'île y ajoute les siens). */
function poserLIle(
  biome: (typeof BIOMES)[number],
  index: number,
  progress: Record<string, { stars: number }>,
  village: World,
  withCreatures: boolean,
  trophies: (keyof typeof BLOCKS)[],
  placed: Set<number>,
  cubes: VoxelCube[],
  sentinelles = false,
  atelier: Atelier = 'fabrique',
): void {
  const def = islandDef(biome.id);
  const { ox, oy, oz } = islandOrigin(index);
  const unlocked = isBiomeUnlocked(biome.id, village.links);
  const block = BLOCKS[biome.block];
  // Les cœurs en herbe ; le Jardin des heures aussi (DA, LV2-4) : l'osier, son bloc, reste aux bordures, aux paniers et
  // à la serre ; et le Refuge des carnets (DA, LV2-5) : le bardeau reste aux murs ; la Fouille des siècles et la Pointe
  // des paysages (HG-2) : la mosaïque et le chaume restent aux plans, au décor et aux commandes, l'archipel le plus chargé
  // garde un sol calme ; de même les six îles d'histoire-géographie de 5e à 3e (HG-3), toutes les îles de la matière.
  const grassy =
    biome.id === 'french-6e-phonology' ||
    biome.id === 'french-6e-grammar-spelling' ||
    biome.id === 'maths-6e-calculation' ||
    biome.id === 'maths-6e-fractions' ||
    biome.id === 'maths-5e-proportionality' ||
    biome.id === 'french-5e-homophones' ||
    biome.id === 'lv2-4e-daily-life' ||
    biome.id === 'lv2-3e-travel' ||
    biome.subject === 'history-geography';
  const h = (x: number, y: number) => groundHeight(index, x, y);
  // Cubes du cœur (coordonnées relatives au cœur, z relatif au sol de l'île).
  // Cubes de la terre autour du cœur (coordonnées du monde). Île verrouillée : mêmes formes, couleurs délavées.
  const taken = new Set<number>();
  const putWorld = (x: number, y: number, z: number, color: string, decor?: string, sol?: true) => {
    taken.add(cleDeCube(x, y, z));
    placed.add(cleDeCube(x, y, oz + z));
    cubes.push({
      x,
      y,
      z: oz + z,
      color: unlocked ? color : fade(color),
      texture: TEXTURES[color],
      tag: biome.id,
      muted: unlocked ? undefined : true,
      decor: decor ? `${biome.id}/${decor}` : undefined,
      ...(sol ? { sol } : {}),
    });
  };
  // Le sol et la roche de l'île : le rendu Archipéo les dessine en facettes (world/landMesh.ts).
  const putSol = (x: number, y: number, z: number, color: string) => putWorld(x, y, z, color, undefined, true);
  // (Le décor du cœur est en coordonnées du cœur : son nom le dit, pour ne pas croiser celui du paysage.)
  const put: Put = (x, y, z, color, decor) => putWorld(ox + x, oy + y, z, color, decor && `cœur:${decor}`);
  // Le décor du cœur est dessiné sur la grille 12 × 12, décalée de la marge.
  // … sauf sur les cases des lieux du village (un feuillage voisin ne traverse pas leur toit).
  const placesAt = placeCells(biome.id);
  const putDecor: Put = (x, y, z, color, decor) =>
    !placesAt.has(`${LAYOUT_PAD.x + x},${LAYOUT_PAD.y + y}`) && put(LAYOUT_PAD.x + x, LAYOUT_PAD.y + y, z, color, decor);
  const land = landCells(def);
  for (const c of land) {
    if (!inCore(def, c.x, c.y)) continue;
    const x = c.x - ox;
    const y = c.y - oy;
    for (let d = 1; d <= DEPTH; d++) putSol(c.x, c.y, -d, BLOCKS[BLOC.terre].side);
    const top = h(x, y);
    if (top > 0) putSol(c.x, c.y, 0, BLOCKS[BLOC.terre].side);
    putSol(c.x, c.y, top, grassy ? GRASS : block.side);
  }
  // Le paysage autour du cœur : collines, pics, lacs, cratère, sable des plages, neige des sommets, puis le décor.
  const scenery = landscape(def);
  for (const c of scenery) {
    for (let d = 1; d <= DEPTH; d++) putSol(c.x, c.y, Math.min(0, c.h) - d, underground(def, c, c.h + d));
    for (let z = 0; z < c.h; z++) putSol(c.x, c.y, z, underground(def, c, c.h - z));
    putSol(c.x, c.y, c.h, GROUND_COLOR[c.ground]);
  }
  DECOR[biome.id](putDecor, (x, y) => h(x + LAYOUT_PAD.x, y + LAYOUT_PAD.y));
  // Les bornes de mission : un socle du bloc de l'île, une ardoise étoilée dessus. Délavées avec l'île quand elle est fermée.
  for (const st of questStations(biome.id)) {
    const quest = `${biome.id}:${st.typeId}`;
    const base = h(st.x, st.y);
    const tone = (c: string) => (unlocked ? c : fade(c));
    const muted = unlocked ? undefined : true;
    cubes.push({
      x: ox + st.x,
      y: oy + st.y,
      z: oz + base + 1,
      color: tone(block.side),
      top: block.top,
      texture: block.texture,
      tag: biome.id,
      quest,
      muted,
    });
    cubes.push({
      x: ox + st.x,
      y: oy + st.y,
      z: oz + base + 2,
      color: tone('#3a4a6a'),
      top: '#2f3d5c',
      texture: 'borne',
      tag: biome.id,
      quest,
      muted,
    });
    taken.add(cleDeCube(ox + st.x, oy + st.y, base + 1));
    taken.add(cleDeCube(ox + st.x, oy + st.y, base + 2));
  }
  // L'école, la salle des trophées et le lieu où l'on assemble (sur l'île de l'école de l'archipel) : on les touche pour
  // entrer, comme une borne.
  for (const place of PLACE_IDS) {
    const spot = placeSpot(place, biome.id);
    if (!spot) continue;
    const { at, size } = VILLAGE_PLACES[place];
    const modele = place === 'school' ? schoolModel() : place === 'trophies' ? trophyModel(trophies) : atelierModel(atelier, biome.classe);
    // Le soubassement rattrape une marche du sol, sous toute l'emprise du lieu ; pour la salle des trophées, sous ce qui
    // est bâti seulement : la place réservée d'une travée à venir reste le sol de l'île, sans dalle ni marque (GD-3).
    const bati = new Map<string, [number, number]>();
    if (place === 'trophies') for (const m of modele) bati.set(`${m.x},${m.y}`, [m.x, m.y]);
    else for (let dx = 0; dx < size.w; dx++) for (let dy = 0; dy < size.d; dy++) bati.set(`${dx},${dy}`, [dx, dy]);
    const cases = bati.values();
    for (const [dx, dy] of cases)
      for (let z = h(at.x + dx, at.y + dy) + 1; z <= spot.h; z++) cubes.push(placeCube(place, spot.x + dx, spot.y + dy, oz + z, BLOC.taille, biome.id, unlocked));
    for (const m of modele) cubes.push(placeCube(place, spot.x + m.x, spot.y + m.y, oz + spot.h + m.z, m.block, biome.id, unlocked));
  }
  landmark(def, scenery, (x, y, z, color, decor) => !taken.has(cleDeCube(x, y, z)) && putWorld(x, y, z, color, decor));
  cascades(def, scenery, (x, y, z, color, decor) => !taken.has(cleDeCube(x, y, z)) && !placed.has(cleDeCube(x, y, oz + z)) && putWorld(x, y, z, color, decor));
  pontonEtBarque(def, scenery, (x, y, z, color, decor) => !taken.has(cleDeCube(x, y, z)) && !placed.has(cleDeCube(x, y, oz + z)) && putWorld(x, y, z, color, decor));
  const bornes = questStations(biome.id).map((st) => ({ x: ox + st.x, y: oy + st.y, base: h(st.x, st.y) }));
  const vers = versLaCameraDuDessin(biome.id);
  // Sur une île-école, la rangée de côte devant les bornes reste nue (`rangeeDevantLesBornes`).
  const devant = rangeeDevantLesBornes(biome.id);
  // Le décor de la côte, puis celui des marges d'un cœur agrandi (au même rythme), hors des abords de ses ouvrages.
  const abords = abordsDansLesMarges(def);
  const pieds = piedsDesOuvrages(def);
  // Un élément assez près du pied d'un ouvrage pour que son feuillage y arrive (deux cases) : posé seulement s'il le laisse libre.
  const presDUnPied = (x: number, y: number) => {
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) if (pieds.has(cleDeCube(x + dx, y + dy))) return true;
    return false;
  };
  const marges = margesDuCoeur(def);
  // Les lieux du village en cases du monde : un élément de la côte ou des marges qui toucherait l'un d'eux (la Halle au
  // bord droit du cœur agrandi, 02/10/2026) n'est pas posé, plutôt que coupé.
  // En clés numériques (`cleDeCube`) : testées à chaque élément de décor, sans chaîne construite.
  // Devant la porte d'un lieu, et une case autour, rien non plus (un rocher de la côte se tenait à côté de la porte de la
  // Fabrique de l'Atelier, 02/10/2026).
  const lieuxDuMonde = new Set(casesDuVillage(biome.id).map(([x, y]) => cleDeCube(ox + x, oy + y)));
  if (lieuxDuMonde.size > 0)
    for (const place of PLACE_IDS) {
      const { at, door } = VILLAGE_PLACES[place];
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) lieuxDuMonde.add(cleDeCube(ox + at.x + door + dx, oy + at.y - 1 + dy));
    }
  const presDUnLieu = (x: number, y: number) => {
    if (lieuxDuMonde.size === 0) return false;
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) if (lieuxDuMonde.has(cleDeCube(x + dx, y + dy))) return true;
    return false;
  };
  for (let k = 0; k < scenery.length + marges.length; k++) {
    const c = k < scenery.length ? scenery[k] : marges[k - scenery.length];
    if (!c.decor || nearSentier(def, c.x, c.y)) continue;
    if (k >= scenery.length && abords.has(`${c.x},${c.y}`)) continue;
    const t = tirage(def, c.x, c.y);
    const r = noise(def.seed + 5, t.x, t.y);
    // Le décor ne remplace jamais un cube déjà posé (sol voisin plus haut, feuillage d'un autre arbre).
    // … ni ne déborde au-dessus du cœur d'origine (la zone des plans, les lieux et les bornes doivent rester libres).
    const poser: Put = (x, y, z, color, decor) => !inCoeurDOrigine(def, x, y) && !taken.has(cleDeCube(x, y, c.h + z)) && putWorld(x, y, c.h + z, color, decor);
    // Loin des bornes, rien ne peut en cacher une : posé directement. Près d'elles (une case de plus pour le feuillage),
    // un élément qui cacherait le pied d'une borne n'est pas posé (voir `cacheUneBorne`), ni un élément qui toucherait
    // la rangée de côte devant les bornes d'une île-école.
    const piedProche = pieds.size > 0 && !LOW.has(c.decor) && presDUnPied(c.x, c.y);
    if (!presDUneBorne(bornes, c.x, c.y, 1) && !presDUnLieu(c.x, c.y) && !piedProche) {
      decorate(poser, c.decor, c.x, c.y, r);
      continue;
    }
    const poses: [number, number, number, string, string | undefined][] = [];
    decorate((x, y, z, color, decor) => poses.push([x, y, z, color, decor]), c.decor, c.x, c.y, r);
    if (poses.some(([x, y, z]) => devant.has(`${x},${y}`) || lieuxDuMonde.has(cleDeCube(x, y)) || (piedProche && pieds.has(cleDeCube(x, y))) || cacheUneBorne(bornes, vers, x, y, c.h + z))) continue;
    for (const [x, y, z, color, decor] of poses) poser(x, y, z, color, decor);
  }
  // Une île en altitude flotte : sa roche s'amincit dessous.
  if (def.altitude > 0)
    for (const t of taperLayers(land)) if (!taken.has(cleDeCube(t.x, t.y, -DEPTH - t.d))) putSol(t.x, t.y, -DEPTH - t.d, BLOCKS[BLOC.pierre].side);
  // L'îlot du Gardien, devant l'île, dès qu'il accepte le défi : une petite île, son arène et ses pas japonais. Une
  // sentinelle (lot 6) est là dès l'ouverture de l'île, sans les pas japonais tant qu'elle attend.
  const guardian = guardianStatus(biome, progress, village.links, sentinelles);
  if (guardian !== 'hidden') bossIslet(biome, guardian === 'beaten', cubes, guardian !== 'waiting');
  if (unlocked && withCreatures) {
    const spot = creatureSpot(biome.id);
    for (const c of creatureDuMonde(biome.id))
      cubes.push({
        x: ox + spot.x + c.x,
        y: oy + spot.y + c.y,
        z: oz + c.z + 1,
        color: c.color,
        tag: biome.id,
      });
  }
  // La petite construction d'une commande livrée (GD-7, PR 3), à côté de la créature, en cubes posés.
  const commande = unlocked ? commandeDeLIle(biome.id) : undefined;
  if (commande && estPosee(village.parts, commande.fixture)) {
    const place = placeDeLaPetiteConstruction(biome.id, commande.fixture);
    if (place)
      for (const c of casesDeLaPetiteConstruction(commande.fixture) ?? []) {
        const bd = BLOCKS[c.block];
        cubes.push({
          x: ox + place.x + c.x,
          y: oy + place.y + c.y,
          z: oz + c.z + 1,
          color: bd.side,
          top: bd.top,
          texture: bd.texture,
          tag: biome.id,
          sansDessous: true,
          petiteConstruction: true,
          // Une porte montre son dessus : il prend le dessin de ses côtés, sans appel de dessin de plus.
          dessusCommeLesCotes: c.block === BLOC.porte || undefined,
        });
      }
    if (place)
      for (const [x, y, z] of eauDeLaPetiteConstruction(commande.fixture))
        cubes.push({ x: ox + place.x + x, y: oy + place.y + y, z: oz + z + 1, color: WATER, texture: TEXTURES[WATER], tag: biome.id, sansDessous: true, petiteConstruction: true });
  }
  // Les plans : cellules posées en dur ; fantômes seulement pour le plan en cours (le premier non terminé) d'une île ouverte.
  if (unlocked) {
    let ghostsShown = false;
    for (const plan of plansFor(biome.id)) {
      const done = new Set(village.parts[plan.id] ?? []);
      const finished = isPlanDone(plan, village.parts);
      if (!finished && ghostsShown) break;
      if (!finished) ghostsShown = true;
      // Dessinées au fond de la zone au Marché et à l'Atelier (`decalageDesPlans`) ; les clés restent celles du plan.
      const d = decalageDesPlans(plan);
      for (const c of planCells(plan)) {
        const bd = BLOCKS[c.block];
        const built = done.has(c.key);
        cubes.push({ x: ox + c.x + d.x, y: oy + c.y + d.y, z: oz + c.z + d.z + 1, color: bd.side, top: bd.top, texture: bd.texture, tag: biome.id, ghost: !built });
      }
    }
  }
}

/**
 * Les cases du monde où se posent des cases de plans d'île (une partie du bâtiment, GD-6), en clés « x,y,z » : là où
 * `poserLIle` dessine chacune (le coin du cœur, le décalage des plans du fond, un cran au-dessus du sol).
 */
export function casesDesPlansDansLeMonde(cases: readonly { plan: PlanDef; keys: readonly string[] }[]): Set<string> {
  const out = new Set<string>();
  for (const { plan, keys } of cases) {
    const { ox, oy, oz } = islandOrigin(BIOMES.findIndex((b) => b.id === plan.biome));
    const d = decalageDesPlans(plan);
    const voulues = new Set(keys);
    for (const c of planCells(plan)) if (voulues.has(c.key)) out.add(`${ox + c.x + d.x},${oy + c.y + d.y},${oz + c.z + d.z + 1}`);
  }
  return out;
}

/** Ce qui est entre les îles, en cases du monde, ajouté à `cubes` : le port, les îlots des monuments, la mer, les ouvrages. */
function entreLesIles(a: ArchipelagoId, village: World, cubes: VoxelCube[], choisie: string | null, atelier: Atelier): VoxelCube[] {
  // Le port : la jetée (le Bloc-Navire est un objet à part, voir vehiclePlacement).
  harbor(a, village, cubes);
  // Les monuments, chacun sur son îlot au large : bâtis, ou en fantômes à construire.
  monumentIslets(a, village, cubes);
  // Les constructions qui réunissent deux lieux (GD-9) : une digue d'herbe et de pierre, une jetée de pierre dans
  // Archipéo (son habillage, la Halle).
  joinsBetween(a, village, cubes, atelier === 'halle');
  // La mer habillée : rochers et bancs de sable, loin de tout (jamais sous un ouvrage, ni sur l'îlot d'un monument).
  // Sans les écueils qu'un lieu posé dessus cache (GD-9, « Cacher »).
  for (const c of seaDecorShown(a)) cubes.push(c);
  // Les liaisons (GD-9) : en planches celles qui sont posées ; en fantôme, vers chaque lieu fermé, celle qui part du lieu
  // relié le plus proche (`buildableBridges`), si elle tient ; les raccourcis entre lieux ouverts ne s'annoncent pas
  // dans le monde (la fiche « Relier » les propose). Avec « Pas de LV2 », pas de fantôme vers l'île de la LV2 : elle
  // n'est pas proposée, rien ne l'annonce (DA, 28/09, LV2-4). Une liaison posée reste : la sauvegarde ne perd rien.
  const occupied = new Set(cubes.map((c) => `${c.x},${c.y},${c.z}`));
  const links = village.links;
  const poser = (def: BridgeDef, ghost: boolean) => bridge(def, linkKind(def, links), bridgePath(def, links), cubes, ghost, occupied);
  for (const def of placedLinksOf(a, links)) poser(def, false);
  // Un autre départ choisi dans la fiche (« Relier ») : son fantôme remplace celui du lieu relié le plus proche.
  const open = reachableIslands(village.links);
  const autre = choisie ? getBridge(choisie) : undefined;
  const fermeeChoisie = autre && opensAnIsland(autre, open) ? (open.has(autre.from) ? autre.to : autre.from) : null;
  const fantomes = buildableBridges(village.links, undefined, undefined, lv2Courante(), open).filter(
    (def) => archipelagoOfIsland(def.from) === a && opensAnIsland(def, open) && def.from !== fermeeChoisie && def.to !== fermeeChoisie,
  );
  if (autre && fermeeChoisie && archipelagoOfIsland(autre.from) === a) fantomes.unshift(autre);
  for (const def of fantomes) if (bridgeState(def, village.links, undefined, open) === 'buildable') poser(def, true);
  return cubes;
}
