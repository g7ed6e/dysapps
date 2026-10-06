// Sur la Carte, chaque île a son nom (référent dys, relecture du 01/10/2026 : le « Marais des temps » s'était tu au
// 5e quand les îles-écoles ont grandi). Sans WebGL ni navigateur : la caméra de la Carte se cadre comme dans la scène
// (`cadrageDeLaCarte`), les îles et leurs étiquettes se projettent à l'écran, et le placement est celui des deux vues
// (`placerEtiquettes`). Les étiquettes ont la taille de `labelCanvas.ts`, le texte mesuré dans la police de lecture
// (la chasse lue dans son fichier, `testFonts.ts`) ; l'interface est celle relevée sur les captures de la tablette.
// Ce que le test ne couvre pas :
// - OpenDyslexic. En taille normale, son panneau est plus haut que celui relevé ici (non mesuré sans navigateur) ; avec
//   un panneau de 214 px, un nom se tait encore au 3e (les Données) ; à 310 px, aussi au 6e (la Carrière) et au 5e (le
//   Marais). C'était déjà le cas avant les îles-écoles agrandies, et plus souvent (référent dys). En grand texte,
//   la Carte est au plancher (`PLANCHER_DE_LA_CARTE`) : les îles y sont à 115 px les unes des autres, leurs noms en
//   OpenDyslexic font de 240 à 400 px de large dans une bande de 180 px de haut ; tous ne peuvent pas se montrer.
// - OpenDyslexic 10 % plus large, au 3e : la Géométrie et les Statistiques n'ont aucune place qui tienne (entière, hors
//   de l'interface, près de leur île et pas plus près d'une autre) ; elles se taisent, les autres noms se montrent.
//   Le plafond d'essais de la recherche n'y est pour rien : elle ne s'arrête pas sur eux (HG-3).
// - Au 6e, une autre destination que le port : onze îles serrées, le fanion du bonhomme sur la Forêt ; un nom peut
//   s'y taire (la Ferme, quand la destination est la Tour).
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { getArchipelago, islandsOf } from '../world/archipelago';
import { ARCHIPELAGO_IDS, type ArchipelagoId } from '../world/archipelagos';
import { boitesDuTrace, placerAvecLaFlecheDOuvrage, placerDAbordSimplement, placerEtiquettes, replierLesSignes, separateMark, type LabelBox, type RechercheDuCadrage } from '../world/labelLayout';
import { avatarHome, casesDeLOuvrage, islandCenter } from '../world/terrain';
import { BRIDGES, getBridge, linkWholeRegion, NOMS_ARCHIPELS, VOYAGES } from '../world/archipelago';
import { archipelagoOfIsland } from '../world/archipelagos';
import { dispositionEnGrille } from '../world/grid';
import { placeLibre } from '../freeSpace';
import { cadrageDeLaCarte } from './camera';
import { largeurEnGras, type PoliceDeTest } from './testFonts';
import { caseALEcran } from './signs';
import { MEDAILLON_CSS } from './labels';
import { sanitizeState } from '../engine';
import { textesDe } from '../../universes';
import { nextDestination } from '../world/destination';
import { toutConstruit } from '../world/budget';

/** La tablette de référence, et ce que l'interface y pose sur la Carte (relevé sur les captures, village complet). */
const TABLETTE = { w: 1024, h: 768 };
const PANNEAU: LabelBox = { x: 467, y: 119, w: 678, h: 214 };
const BARRE: LabelBox = { x: 512, y: 731, w: 540, h: 50 };
const BOUTONS: LabelBox[] = [
  { x: 985, y: 37, w: 52, h: 52 },
  { x: 966, y: 98, w: 66, h: 46 },
];
const ZONES = [PANNEAU, BARRE, ...BOUTONS];
/**
 * La Carte à l'ouverture, telle que la montrent les captures depuis que le panneau de l'île ne s'ouvre plus tout seul :
 * pas de panneau, la barre du bas, Pause et la colonne des quatre classes (relevé sur les captures du lot HG-2).
 */
const CLASSES: LabelBox[] = [154, 211, 267].map((y) => ({ x: 980, y, w: 50, h: 46 }));
const ZONES_PAR_DEFAUT = [BARRE, ...BOUTONS, ...CLASSES];

/** La largeur du bloc de l'île et de son écart avant le nom (`labelCanvas.ts`, `blocW`), le nom à 18 px. */
const BLOC_W = (Math.sqrt(3) * 0.52 + 0.3) * 18;

/** L'étiquette d'une île sur la Carte, en pixels CSS : le nom à 18 px, l'état à 16 px (voir `labelCanvas.ts`, `labels.ts`). */
function etiquette(nom: string, etat: string, largeur: (t: string) => number, elargir: number): { w: number; h: number } {
  const px = 18;
  const nomW = largeur(nom) * px * elargir;
  const etatW = px * 0.9 * 1.35 + largeur(etat) * px * 0.9 * elargir;
  const bord = 2 * Math.max(2, Math.round(40 / 8)) * (px / 40);
  // (Plus 4 pixels de canvas autour, à l'échelle de l'affichage.)
  return { w: Math.max(nomW, etatW) + px * 1.2 + bord + 4 * (px / 40), h: px * 3.05 + bord + 4 * (px / 40) };
}

/**
 * La Carte d'un archipel tout construit, comme sur les captures : la destination est le port (« Le village est complet »),
 * le bonhomme sur la première île de l'archipel. Rend les îles dont le nom se tait alors que l'île se voit (`tus`), et
 * de combien chaque nom se pose au-dessus de son île, en pixels (`dessus`).
 */
// Les liaisons posées d'une partie : depuis GD-9, une liaison qui ne tient pas n'a ni tracé ni flèche.
const POSEES = [...new Set([...ARCHIPELAGO_IDS.flatMap((a) => linkWholeRegion(a, VOYAGES.map((v) => v.id))), ...VOYAGES.map((v) => v.id)])];

/**
 * `parDefaut` : la Carte à l'ouverture, au plus près de la scène (`labels.ts`) : sans panneau (`ZONES_PAR_DEFAUT`), la
 * bulle de la destination à sa taille (`caseALEcran`), le médaillon « toi », les étiquettes avec le bloc de leur île
 * (repliées sans lui si un nom se tait, `replierLesSignes`), et sur un ouvrage le tracé suggéré et le poids de l'île
 * d'arrivée.
 */
function laCarte(a: ArchipelagoId, etat: string, police: PoliceDeTest, elargir: number, destination: BiomeId | { ouvrage: string; depuis?: BiomeId } = getArchipelago(a).port, parDefaut = false) {
  const zones = parDefaut ? ZONES_PAR_DEFAUT : ZONES;
  const { w: W, h: H } = TABLETTE;
  // Une île : la pointe au-dessus de son cœur ; un ouvrage (GD-7) : juste au-dessus de ses places sur la liaison, la
  // première pour le cadrage (`markers.ts`).
  const places = typeof destination === 'string' ? [] : dispositionEnGrille(a, POSEES).placesDeLaFleche(destination.ouvrage, destination.depuis).map((m) => ({ x: m.x + 0.5, y: m.y + 0.5, z: m.z + 2 }));
  const ici = places[0] ?? null;
  const c = cadrageDeLaCarte(a, ici ?? (destination as BiomeId), W, H, placeLibre(W, H, parDefaut ? [BARRE] : [PANNEAU, BARRE], parDefaut ? [...BOUTONS, ...CLASSES] : BOUTONS));
  const cam = new THREE.PerspectiveCamera(40, W / H, 0.5, 1e5);
  cam.position.copy(c.pos);
  cam.lookAt(c.target);
  cam.updateMatrixWorld();
  const v = new THREE.Vector3();
  const ecran = (x: number, y: number, z: number) => {
    v.set(x, y, z).project(cam);
    return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H };
  };
  const iles = islandsOf(a);
  const largeur = largeurEnGras(police);
  const centres = iles.map((b) => islandCenter(b.id));
  // L'étiquette flotte à 12 cases au-dessus du sol de son île (`labels.ts`).
  const sansBloc = iles.map((b, i) => ({ ...ecran(centres[i].x + 0.5, centres[i].z + 12, centres[i].y + 0.5), ...etiquette(b.name, etat, largeur, elargir) }));
  const boxes = parDefaut ? sansBloc.map((b) => ({ ...b, w: b.w + BLOC_W * elargir })) : sansBloc;
  const points = centres.map((p) => ecran(p.x + 0.5, p.z, p.y + 0.5));
  // Le fanion du bonhomme et la flèche de la destination (`marksOnScreen`).
  const av = avatarHome(iles[0].id);
  const pied = ecran(av.x + 0.5, av.z + 4.5, av.y + 0.5);
  const tete = ecran(av.x + 0.5, av.z + 17, av.y + 0.5);
  const fh = Math.max(24, Math.abs(pied.y - tete.y));
  // À l'ouverture : le médaillon posé au-dessus de la tête, la bulle de la destination pointe en bas (`marksOnScreen`).
  const fanion = parDefaut ? { x: pied.x, y: pied.y - MEDAILLON_CSS / 2, w: MEDAILLON_CSS, h: MEDAILLON_CSS } : { x: (pied.x + tete.x) / 2, y: (pied.y + tete.y) / 2, w: Math.max(24, fh * 0.9), h: fh };
  const bulle = caseALEcran(true);
  const flecheEn = (pointe: { x: number; y: number }) => {
    const ecart = separateMark(pointe, { x: fanion.x, y: fanion.y + fanion.h / 2 }, 56);
    return parDefaut ? { x: pointe.x + ecart.dx, y: pointe.y + ecart.dy - bulle / 2, w: bulle, h: bulle } : { x: pointe.x + ecart.dx, y: pointe.y + ecart.dy - 24, w: (48 * 96) / 124, h: 48 };
  };
  // Sur un ouvrage, la flèche prend la première de ses places libres, et aucune étiquette ne se pose sur elle
  // (`placerAvecLaFlecheDOuvrage`, comme `labels.ts`).
  const cadre = { w: W, h: H };
  const d = islandCenter((typeof destination === 'string' ? destination : iles[0].id) as BiomeId);
  const fleches = places.map((p) => flecheEn(ecran(p.x, p.z, p.y)));
  // La destination : l'île, ou celle d'où part l'ouvrage (`labels.ts`).
  const dest = typeof destination === 'string' ? destination : destination.depuis;
  const def = typeof destination === 'string' ? undefined : getBridge(destination.ouvrage);
  const enFace = def && (dest === def.to ? def.from : def.to);
  const arrivee = parDefaut && enFace ? iles.findIndex((b) => b.id === enFace) : -1;
  const indice = iles.findIndex((b) => b.id === dest);
  const poids = { weights: iles.map((b) => (b.id === dest ? 2 : 1)), ...(parDefaut && indice >= 0 ? { destination: indice } : {}), ...(arrivee >= 0 ? { arrivee } : {}) };
  // Le tracé de l'ouvrage, que les étiquettes évitent si elles peuvent (`souplesDuTrace`).
  const souples = parDefaut && def ? boitesDuTrace(casesDeLOuvrage(def, POSEES).map((p) => ecran(p.x + 0.5, p.z + 1, p.y + 0.5))) : [];
  // Le placement simple d'abord, puis une recherche complète pour tout le placement du cadrage s'il tait un nom ou en
  // pose un sur une autre île, comme `labels.ts` (`placerDAbordSimplement`).
  const vue = { zones, bulles: [], bounds: cadre, gap: 6, souples };
  let recherche: RechercheDuCadrage | null = null;
  const placer = (r: RechercheDuCadrage | null) => (b: LabelBox[]) =>
    places.length
      ? placerAvecLaFlecheDOuvrage(fleches, b, points, { ...vue, obstacles: [fanion], recherche: r }, poids)
      : { fleche: 0, ...placerEtiquettes(b, points, { ...vue, obstacles: [flecheEn(ecran(d.x + 0.5, d.z + 8, d.y + 0.5)), fanion], recherche: r }, poids) };
  const etroites = parDefaut ? sansBloc.map((b) => b.w) : [];
  const { visibles, offsets, fleche: prise } = placerDAbordSimplement(
    boxes,
    points,
    vue,
    (r) => ((recherche = r), parDefaut ? replierLesSignes(boxes, etroites, placer(r)) : placer(r)(boxes)),
    etroites,
  );
  /** Le placement simple seul, sans recherche complète, pour comparer. */
  const simple = parDefaut ? replierLesSignes(boxes, etroites, placer(null)) : placer(null)(boxes);
  const fleche = places.length ? fleches[prise] : flecheEn(ecran(d.x + 0.5, d.z + 8, d.y + 0.5));
  const sousLInterface = (p: { x: number; y: number }) => zones.some((z) => Math.abs(p.x - z.x) < z.w / 2 && Math.abs(p.y - z.y) < z.h / 2);
  const seVoit = (p: { x: number; y: number }) => p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H && !sousLInterface(p);
  const recouvre = (p: LabelBox, q: LabelBox) => Math.abs(p.x - q.x) < (p.w + q.w) / 2 && Math.abs(p.y - q.y) < (p.h + q.h) / 2;
  return {
    /** Ce que la recherche complète a dépensé pour ce cadrage (`RechercheDuCadrage`), `null` si elle ne s'est pas lancée. */
    recherche: recherche as RechercheDuCadrage | null,
    /** Les noms se posent-ils comme le placement simple seul (même place, mêmes noms montrés) ? */
    commeLePlacementSimple: visibles.every((v, i) => v === simple.visibles[i] && (!v || (offsets[i].dx === simple.offsets[i].dx && offsets[i].dy === simple.offsets[i].dy))),
    /** Sur un ouvrage, l'indice de la place prise par la flèche. */
    prise,
    /** Les îles qui se voient et montrent leur nom. */
    vues: iles.filter((_, i) => visibles[i] && seVoit(points[i])).map((b) => b.id),
    tus: iles.filter((_, i) => !visibles[i] && seVoit(points[i])).map((b) => b.id),
    /** Les étiquettes montrées posées sur la flèche. */
    surLaFleche: iles.filter((_, i) => visibles[i] && recouvre({ ...boxes[i], x: boxes[i].x + offsets[i].dx, y: boxes[i].y + offsets[i].dy }, fleche)).map((b) => b.id),
    dessus: new Map(iles.map((b, i) => [b.id, points[i].y - (boxes[i].y + offsets[i].dy)])),
    /** Les îles dont le nom, montré, est plus près d'une autre île que de la sienne, vu de son milieu. */
    ailleurs: iles
      .filter((_, i) => {
        if (!visibles[i]) return false;
        const at = { x: boxes[i].x + offsets[i].dx, y: boxes[i].y + offsets[i].dy, w: boxes[i].w / 2, h: boxes[i].h };
        const loin = (p: { x: number; y: number }) => Math.hypot(Math.max(0, Math.abs(p.x - at.x) - at.w / 2), Math.max(0, Math.abs(p.y - at.y) - at.h / 2));
        return points.some((p, j) => j !== i && loin(p) < loin(points[i]));
      })
      .map((b) => b.id),
  };
}
const nomsTus = (...args: Parameters<typeof laCarte>) => laCarte(...args).tus;

/** Le mot de l'état « tout construit » dans chaque univers (`etatsDIle`). */
const ETATS = { blocland: 'Bâtie', archipeo: 'Restaurée' };

describe('La Carte : chaque île a son nom (tablette 1024 × 768)', () => {
  it.each(ARCHIPELAGO_IDS)('%s, archipel tout construit : toutes les îles sont à l’écran, hors de l’interface, et montrent leur nom', (a) => {
    for (const [univers, etat] of Object.entries(ETATS))
      // La police de lecture par défaut, et la même 10 % plus large (une police de repli, si elle manque à l'appareil).
      for (const elargir of [1, 1.1]) expect(nomsTus(a, etat, 'atkinson-hyperlegible', elargir), `${a}, ${univers}, ×${elargir}`).toEqual([]);
  });

  it('6e, à l’ouverture de la Carte (sans panneau, la destination du jeu tout construit) : aucune île ne perd son nom, chacun sur son île (HG-2)', () => {
    // La destination que le jeu donne au village tout construit, le bonhomme sur la Forêt des sons (`nextDestination`).
    const { progress, world } = toutConstruit();
    const etat = sanitizeState({ progress, world: { ...world, place: islandsOf('6e')[0].id } } as never);
    const d = nextDestination(etat, NOMS_ARCHIPELS, textesDe('blocland').libelles);
    const destination = d.ouvrage ? { ouvrage: d.ouvrage, depuis: d.island } : d.island;
    for (const [univers, mot] of Object.entries(ETATS))
      for (const elargir of [1, 1.1]) {
        const carte = laCarte('6e', mot, 'atkinson-hyperlegible', elargir, destination, true);
        expect(carte.tus, `${univers}, ×${elargir}`).toEqual([]);
        // Chaque nom sur son île, pas sur une voisine : la Fouille des siècles et la Pointe des paysages comme les autres
        // (HG-3, consultant UX UI).
        expect(carte.ailleurs, `${univers}, ×${elargir}`).toEqual([]);
        // Toutes les îles du 6e se voient (aucune sous l'interface) : aucune ne perd son nom.
        expect(carte.vues.length, `${univers}, ×${elargir}`).toBe(islandsOf('6e').length);
      }
  });

  // Les six îles d'histoire-géographie des 5e, 4e et 3e (HG-3), deux par archipel, voisines dans les deux premiers.
  const VOISINES_HG3 = {
    '5e': ['history-5e-middle-ages', 'geography-5e-resources'],
    '4e': ['history-4e-revolutions', 'geography-4e-globalization'],
    '3e': ['history-3e-twentieth-century', 'geography-3e-france'],
  } as const;

  it.each(['5e', '4e', '3e'] as const)('%s, à l’ouverture de la Carte (sans panneau, la destination du jeu tout construit) : aucune île ne perd son nom, chacun sur son île (HG-3)', (a) => {
    const { progress, world } = toutConstruit();
    const etat = sanitizeState({ progress, world: { ...world, place: islandsOf(a)[0].id } } as never);
    const d = nextDestination(etat, NOMS_ARCHIPELS, textesDe('blocland').libelles);
    const destination = d.ouvrage ? { ouvrage: d.ouvrage, depuis: d.island } : d.island;
    const hg: readonly string[] = VOISINES_HG3[a];
    for (const [univers, mot] of Object.entries(ETATS))
      for (const elargir of [1, 1.1]) {
        const carte = laCarte(a, mot, 'atkinson-hyperlegible', elargir, destination, true);
        expect(carte.tus, `${univers}, ×${elargir}`).toEqual([]);
        expect(carte.ailleurs.filter((id) => hg.includes(id)), `${univers}, ×${elargir}`).toEqual([]);
        expect(carte.vues.length, `${univers}, ×${elargir}`).toBe(islandsOf(a).length);
        // En OpenDyslexic : tous les noms en taille normale ; 10 % plus large, ceux des îles d'histoire-géographie (au
        // 3e, la Géométrie et les Statistiques n'ont alors aucune place, voir l'en-tête).
        const od = laCarte(a, mot, 'opendyslexic', elargir, destination, true);
        expect(elargir === 1 ? od.tus : od.tus.filter((id) => hg.includes(id)), `${univers}, OpenDyslexic ×${elargir}`).toEqual([]);
        expect(od.ailleurs.filter((id) => hg.includes(id)), `${univers}, OpenDyslexic ×${elargir}`).toEqual([]);
      }
  });

  it('6e, à l’ouverture de la Carte : chaque nom sur son île ; la recherche complète reste bornée (HG-3, DA ; SC-2)', () => {
    // Le DA, 6 octobre 2026 : au 6e, chaque nom gardait la place qu'il avait avant HG-3 ; la recherche complète ne se lance
    // que si le placement simple tait un nom ou en pose un sur une autre île (`placerDAbordSimplement`). Avant les îles de
    // sciences, rien ne la lançait dans la police de lecture ; 10 % plus large, la Grammaire (anglais) se posait sur le
    // Vocabulaire : la recherche la remettait sur son île, en quelques centaines d'essais (avant : onze recherches par
    // ouverture, 52 000 places vérifiées et 2 000 essais).
    const { progress, world } = toutConstruit();
    const etat = sanitizeState({ progress, world: { ...world, place: islandsOf('6e')[0].id } } as never);
    const d = nextDestination(etat, NOMS_ARCHIPELS, textesDe('blocland').libelles);
    const destination = d.ouvrage ? { ouvrage: d.ouvrage, depuis: d.island } : d.island;
    for (const [univers, mot] of Object.entries(ETATS)) {
      // Depuis les trois îles de sciences (SC-2, la grille du 6e réarrangée), le placement simple pose le nom de la Mine
      // des lettres plus près de la Carrière des mots, et celui de la Ferme des accords plus près de la Tour du lecteur :
      // la recherche complète se lance dès la police de lecture et les remet sur leur île (270 essais, 3 570 places
      // vérifiées). À revoir par le DA : sa règle « au 6e, chaque nom garde la place d'avant HG-3 » ne tient plus pour
      // ces deux noms.
      const simple = laCarte('6e', mot, 'atkinson-hyperlegible', 1, destination, true);
      expect(simple.tus, univers).toEqual([]);
      expect(simple.ailleurs, univers).toEqual([]);
      expect(simple.recherche?.essais ?? 0, univers).toBeLessThanOrEqual(300);
      expect(simple.recherche?.places ?? 0, univers).toBeLessThanOrEqual(4_000);
      const large = laCarte('6e', mot, 'atkinson-hyperlegible', 1.1, destination, true);
      expect(large.tus, `${univers}, ×1,1`).toEqual([]);
      expect(large.recherche?.essais ?? 0, `${univers}, ×1,1`).toBeLessThanOrEqual(300);
      expect(large.recherche?.places ?? 0, `${univers}, ×1,1`).toBeLessThanOrEqual(4_000);
    }
  });

  it('le Marais des temps (5e) garde son nom, et l’Atelier (4e, la destination) le sien au-dessus de son île', () => {
    expect(nomsTus('5e', ETATS.blocland, 'atkinson-hyperlegible', 1)).not.toContain('french-5e-conjugation');
    for (const etat of Object.values(ETATS)) {
      const atelier = laCarte('4e', etat, 'atkinson-hyperlegible', 1);
      expect(getArchipelago('4e').port).toBe('maths-4e-algebra');
      expect(atelier.tus).toEqual([]);
      expect(atelier.dessus.get('maths-4e-algebra')).toBeGreaterThan(0);
    }
  });

  it.each(['5e', '4e', '3e'] as const)('%s : quelle que soit la destination, chaque île qui se voit garde son nom', (a) => {
    for (const dest of islandsOf(a).map((b) => b.id)) expect(nomsTus(a, ETATS.blocland, 'atkinson-hyperlegible', 1, dest), `${a} → ${dest}`).toEqual([]);
  });

  const posees = POSEES;

  it.each(ARCHIPELAGO_IDS)('%s : la flèche sur un ouvrage (GD-7), depuis chacune de ses îles, reste libre, aucune étiquette dessus', (a) => {
    for (const def of BRIDGES.filter((b) => archipelagoOfIsland(b.from) === a && posees.includes(b.id)))
      for (const depuis of [def.from, def.to]) {
        const carte = laCarte(a, ETATS.blocland, 'atkinson-hyperlegible', 1, { ouvrage: def.id, depuis });
        expect(carte.surLaFleche, `${def.id} depuis ${depuis}`).toEqual([]);
      }
  });

  it.each(ARCHIPELAGO_IDS)('%s : la flèche sur un ouvrage, l’île de départ (la destination) garde son nom', (a) => {
    for (const def of BRIDGES.filter((b) => archipelagoOfIsland(b.from) === a && posees.includes(b.id)))
      for (const depuis of [def.from, def.to]) expect(nomsTus(a, ETATS.blocland, 'atkinson-hyperlegible', 1, { ouvrage: def.id, depuis }), `${def.id} depuis ${depuis}`).not.toContain(depuis);
  });

  it.each(['5e', '4e', '3e'] as const)('%s : la flèche sur un ouvrage, chaque île qui se voit garde son nom', (a) => {
    for (const def of BRIDGES.filter((b) => archipelagoOfIsland(b.from) === a && posees.includes(b.id)))
      for (const depuis of [def.from, def.to]) {
        expect(nomsTus(a, ETATS.blocland, 'atkinson-hyperlegible', 1, { ouvrage: def.id, depuis }), `${def.id} depuis ${depuis}`).toEqual([]);
      }
  });
});
