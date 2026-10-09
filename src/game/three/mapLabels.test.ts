// Sur la Carte, chaque île a son nom (référent dys, relecture du 01/10/2026 : le « Marais des temps » s'était tu au
// 5e quand les îles-écoles ont grandi). Sans WebGL ni navigateur : la caméra de la Carte se cadre comme dans la scène
// (`cadrageDeLaCarte`), les îles et leurs étiquettes se projettent à l'écran, et le placement est celui des deux vues
// (`placerEtiquettes`). Les étiquettes ont la taille de `labelCanvas.ts`, le texte mesuré dans la police de lecture
// (la chasse lue dans son fichier, `testFonts.ts`) ; l'interface est celle relevée sur les captures de la tablette.
// Ce que le test ne couvre pas :
// - Luciole, la police de lecture par défaut de l'application (réglages) : sauf en portrait (`TUS_EN_PORTRAIT`), les
//   tables sont mesurées dans Atkinson Hyperlegible, de 10 à 13 % plus étroite en gras (« Verger de la santé » : 157 px
//   contre 178 dans Luciole, relevé dans la page, SC-3). Les cas « 10 % plus large » (×1,1) s'en approchent. Mesurées
//   dans Luciole, la tablette panneau ouvert, le téléphone et la flèche sur un ouvrage taisent plus de noms : à remesurer
//   (au pilotage, SC-3).
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
import { avecLIleTouchee, boitesDuTrace, placerAvecLaFlecheDOuvrage, placerDAbordSimplement, placerEtiquettes, replierLesSignes, separateMark, type CarteDesEtiquettes, type LabelBox, type LabelOffset, type RechercheDuCadrage } from '../world/labelLayout';
import { avatarHome, casesDeLOuvrage, islandCenter } from '../world/terrain';
import { BRIDGES, getBridge, linkWholeRegion, NOMS_ARCHIPELS, VOYAGES } from '../world/archipelago';
import { archipelagoOfIsland } from '../world/archipelagos';
import { dispositionEnGrille } from '../world/grid';
import { placeLibre } from '../freeSpace';
import { cadrageDeLaCarte } from './camera';
import { largeurEnGras, type PoliceDeTest } from './testFonts';
import { caseALEcran } from './signs';
import { MEDAILLON_CSS, mapLabelWeights } from './labels';
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

/**
 * Un écran de la Carte : sa taille, ce que l'interface y pose (`zones`), et ce que le cadrage de la Carte laisse libre
 * (`placeLibre` : ce qui couvre le bas, ce qui couvre le côté).
 */
interface EcranDeLaCarte {
  taille: { w: number; h: number };
  zones: LabelBox[];
  bas: LabelBox[];
  cote: LabelBox[];
}
const TABLETTE_PANNEAU_OUVERT: EcranDeLaCarte = { taille: TABLETTE, zones: ZONES, bas: [PANNEAU, BARRE], cote: BOUTONS };
const TABLETTE_A_L_OUVERTURE: EcranDeLaCarte = { taille: TABLETTE, zones: ZONES_PAR_DEFAUT, bas: [BARRE], cote: [...BOUTONS, ...CLASSES] };
/**
 * La tablette en OpenDyslexic 32 px, la Carte à l'ouverture (relevé sur la capture `carte-6e-od32`, HG-3) : Menu, la
 * colonne des quatre classes (la classe choisie plus large, sa coche), puis Carte, Modifier le plan et Blocs en bas.
 */
const TABLETTE_OD32: EcranDeLaCarte = (() => {
  // Menu, puis la colonne des classes, d'un bloc (un seul élément de la page, comme la lit `lirePlaceLibre`).
  const cote = [
    { x: 978, y: 45, w: 54, h: 52 },
    { x: 936, y: 250, w: 138, h: 328 },
  ];
  const bas = [
    { x: 342, y: 711, w: 128, h: 80 },
    { x: 514, y: 694, w: 200, h: 114 },
    { x: 686, y: 708, w: 132, h: 96 },
  ];
  return { taille: TABLETTE, zones: [...bas, ...cote], bas, cote };
})();
/**
 * Le portrait 800 × 1280, la Carte à l'ouverture, en taille de texte normale (relevé sur la capture `carte-3e-800x1280`,
 * HG-3) : Menu et la colonne des classes à droite, les trois boutons du bas en icônes.
 */
const PORTRAIT_800: EcranDeLaCarte = (() => {
  // Menu, puis la colonne des classes, d'un bloc (la classe choisie plus large) : la place libre passe sous le Menu et
  // contourne la colonne par la gauche, comme dans la page.
  const cote = [{ x: 762, y: 38, w: 54, h: 52 }, { x: 747, y: 183, w: 84, h: 220 }];
  const bas = [336, 400, 464].map((x) => ({ x, y: 1240, w: 60, h: 60 }));
  return { taille: { w: 800, h: 1280 }, zones: [...bas, ...cote], bas, cote };
})();

/**
 * Le portrait 800 × 1280 en OpenDyslexic 32 px, la Carte à l'ouverture (relevé dans la page, capture
 * `formes-carte-6e-800x1280-od32`, GD-12) : Menu et la colonne des classes à droite, Carte, Modifier le plan et Blocs
 * en bas, avec leurs mots.
 */
const PORTRAIT_800_OD32: EcranDeLaCarte = (() => {
  const cote = [
    { x: 755, y: 45, w: 52, h: 52 },
    { x: 712, y: 254, w: 137, h: 333 },
  ];
  const bas = [
    { x: 230, y: 1222, w: 128, h: 78 },
    { x: 402, y: 1205, w: 200, h: 112 },
    { x: 572, y: 1220, w: 125, h: 81 },
  ];
  return { taille: { w: 800, h: 1280 }, zones: [...bas, ...cote], bas, cote };
})();

/**
 * Le téléphone 390 × 844, la Carte à l'ouverture, en taille de texte normale (relevé dans la page, HG-3) : Menu et la
 * colonne des classes à droite, les trois boutons du bas en icônes.
 */
const TELEPHONE: EcranDeLaCarte = (() => {
  const cote = [{ x: 352, y: 38, w: 52, h: 52 }, { x: 336, y: 183, w: 84, h: 218 }];
  const bas = [131, 195, 259].map((x) => ({ x, y: 805, w: 56, h: 56 }));
  return { taille: { w: 390, h: 844 }, zones: [...bas, ...cote], bas, cote };
})();

/**
 * En OpenDyslexic, la chasse lue dans le fichier (`testFonts.ts`, sans crénage) fait les noms de 3 à 7 % plus larges que
 * ceux que mesure la page (relevé sur les quinze étiquettes du 6e en OpenDyslexic 32 px, HG-3) : le test les prend 3 %
 * plus étroits, jamais plus étroits que dans la page.
 */
const CHASSE_OD32 = 0.97;

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
 * d'arrivée. `fermees` : les îles fermées (leur état écrit « Fermée », leur poids celui de la scène, `mapLabelWeights`) ;
 * `selected` : l'île touchée, dont le nom ne se tait jamais.
 */
function laCarte(
  a: ArchipelagoId,
  etat: string,
  police: PoliceDeTest,
  elargir: number,
  destination: BiomeId | { ouvrage: string; depuis?: BiomeId } = getArchipelago(a).port,
  parDefaut = false,
  ecranDeLaCarte: EcranDeLaCarte = parDefaut ? TABLETTE_A_L_OUVERTURE : TABLETTE_PANNEAU_OUVERT,
  bonhommeSur: BiomeId = islandsOf(a)[0].id,
  { fermees = [], selected = null }: { fermees?: readonly BiomeId[]; selected?: BiomeId | null } = {},
) {
  const { zones, bas, cote } = ecranDeLaCarte;
  const { w: W, h: H } = ecranDeLaCarte.taille;
  // Une île : la pointe au-dessus de son cœur ; un ouvrage (GD-7) : juste au-dessus de ses places sur la liaison, la
  // première pour le cadrage (`markers.ts`).
  const places = typeof destination === 'string' ? [] : dispositionEnGrille(a, POSEES).placesDeLaFleche(destination.ouvrage, destination.depuis).map((m) => ({ x: m.x + 0.5, y: m.y + 0.5, z: m.z + 2 }));
  const ici = places[0] ?? null;
  // Le cadrage de la Carte hors du mode « Aménager » : les lieux d'aujourd'hui, et au plancher l'île du bonhomme avec la
  // destination quand elle sort de la place (`cadrageDeLaCarte`).
  const c = cadrageDeLaCarte(a, ici ?? (destination as BiomeId), W, H, placeLibre(W, H, bas, cote), { bonhomme: bonhommeSur });
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
  const sansBloc = iles.map((b, i) => ({ ...ecran(centres[i].x + 0.5, centres[i].z + 12, centres[i].y + 0.5), ...etiquette(b.name, fermees.includes(b.id) ? 'Fermée' : etat, largeur, elargir) }));
  const boxes = parDefaut ? sansBloc.map((b) => ({ ...b, w: b.w + BLOC_W * elargir })) : sansBloc;
  const points = centres.map((p) => ecran(p.x + 0.5, p.z, p.y + 0.5));
  // Le fanion du bonhomme et la flèche de la destination (`marksOnScreen`).
  const av = avatarHome(bonhommeSur);
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
  // Le nom de l'île du bonhomme ne se tait jamais, comme celui de la destination (`labels.ts`, DA, HG-3).
  const avatarIsland = iles.findIndex((b) => b.id === bonhommeSur);
  // Les poids de la scène (`mapLabelWeights`) : la destination 2, une île fermée qu'aucun ouvrage ne relie à une île
  // ouverte 0,5, les autres 1 ; l'île touchée ne se tait jamais.
  const touchee = selected ? iles.findIndex((b) => b.id === selected) : -1;
  const lesPoids = (touchee: string | null) => mapLabelWeights(iles.map((b) => ({ id: b.id, closed: fermees.includes(b.id) })), dest, touchee);
  const poids: CarteDesEtiquettes = { weights: lesPoids(selected ?? null), ...(parDefaut && indice >= 0 ? { destination: indice } : {}), ...(arrivee >= 0 ? { arrivee } : {}), avatarIsland, ...(touchee >= 0 ? { selected: touchee } : {}) };
  // La Carte où rien n'est touché (`avecLIleTouchee`, comme `labels.ts`) : celle-ci sans la clé `selected`, ses poids
  // calculés sans l'île touchée (une île fermée touchée y pèse 1 au lieu de 0,5, `mapLabelWeights`).
  const { selected: _touchee, ...sansLaTouchee } = poids;
  const poidsSansLui: CarteDesEtiquettes = { ...sansLaTouchee, weights: lesPoids(null) };
  // Le tracé de l'ouvrage, que les étiquettes évitent si elles peuvent (`souplesDuTrace`).
  const souples = parDefaut && def ? boitesDuTrace(casesDeLOuvrage(def, POSEES).map((p) => ecran(p.x + 0.5, p.z + 1, p.y + 0.5))) : [];
  // Le placement simple d'abord, puis une recherche complète pour tout le placement du cadrage s'il tait un nom ou en
  // pose un sur une autre île, comme `labels.ts` (`placerDAbordSimplement`).
  const vue = { zones, bulles: [], bounds: cadre, gap: 6, souples };
  let recherche: RechercheDuCadrage | null = null;
  const placer = (r: RechercheDuCadrage | null, p: CarteDesEtiquettes) => (b: LabelBox[]) =>
    places.length
      ? placerAvecLaFlecheDOuvrage(fleches, b, points, { ...vue, obstacles: [fanion], recherche: r }, p)
      : { fleche: 0, ...placerEtiquettes(b, points, { ...vue, obstacles: [flecheEn(ecran(d.x + 0.5, d.z + 8, d.y + 0.5)), fanion], recherche: r }, p) };
  const etroites = parDefaut ? sansBloc.map((b) => b.w) : [];
  const place: { visibles: boolean[]; offsets: LabelOffset[]; fleche: number; sansSigne?: boolean[] } = avecLIleTouchee(points, vue, poids.selected, (sansLui) => {
    const p = sansLui ? poidsSansLui : poids;
    return placerDAbordSimplement(boxes, points, vue, (r) => ((recherche = r), parDefaut ? replierLesSignes(boxes, etroites, placer(r, p)) : placer(r, p)(boxes)), etroites);
  });
  // Une étiquette repliée sans le bloc de son île (`replierLesSignes`) a sa largeur étroite.
  const { visibles, offsets, fleche: prise, sansSigne } = place;
  const fleche = places.length ? fleches[prise] : flecheEn(ecran(d.x + 0.5, d.z + 8, d.y + 0.5));
  const sousLInterface = (p: { x: number; y: number }) => zones.some((z) => Math.abs(p.x - z.x) < z.w / 2 && Math.abs(p.y - z.y) < z.h / 2);
  const seVoit = (p: { x: number; y: number }) => p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H && !sousLInterface(p);
  const recouvre = (p: LabelBox, q: LabelBox) => Math.abs(p.x - q.x) < (p.w + q.w) / 2 && Math.abs(p.y - q.y) < (p.h + q.h) / 2;
  return {
    /** Ce que la recherche complète a dépensé pour ce cadrage (`RechercheDuCadrage`), `null` si elle ne s'est pas lancée. */
    recherche: recherche as RechercheDuCadrage | null,
    /** Les étiquettes montrées, à leur place à l'écran. */
    montrees: iles.flatMap((b, i) => (visibles[i] ? [{ id: b.id, x: boxes[i].x + offsets[i].dx, y: boxes[i].y + offsets[i].dy, w: sansSigne?.[i] ? etroites[i] : boxes[i].w, h: boxes[i].h }] : [])),
    /** Le médaillon du bonhomme (à l'ouverture) ou son fanion. */
    fanion,
    /** Sur un ouvrage, l'indice de la place prise par la flèche. */
    prise,
    /** Les îles qui se voient et montrent leur nom. */
    vues: iles.filter((_, i) => visibles[i] && seVoit(points[i])).map((b) => b.id),
    tus: iles.filter((_, i) => !visibles[i] && seVoit(points[i])).map((b) => b.id),
    /** Les étiquettes montrées posées sur la flèche. */
    surLaFleche: iles.filter((_, i) => visibles[i] && recouvre({ ...boxes[i], x: boxes[i].x + offsets[i].dx, y: boxes[i].y + offsets[i].dy }, fleche)).map((b) => b.id),
    dessus: new Map(iles.map((b, i) => [b.id, points[i].y - (boxes[i].y + offsets[i].dy)])),
    /** Les îles dont le nom, montré, est plus près d'une autre île que de la sienne, vu de son milieu (`onAnotherIsland`). */
    ailleurs: iles
      .filter((_, i) => {
        if (!visibles[i]) return false;
        const at = { x: boxes[i].x + offsets[i].dx, y: boxes[i].y + offsets[i].dy, w: boxes[i].w / 2, h: boxes[i].h };
        const loin = (p: { x: number; y: number }) => Math.hypot(Math.max(0, Math.abs(p.x - at.x) - at.w / 2), Math.max(0, Math.abs(p.y - at.y) - at.h / 2));
        // Deux îles sous son milieu, à la même distance : il désigne la plus proche de son centre, de côté (`onAnotherIsland`).
        return points.some((p, j) => j !== i && (loin(p) < loin(points[i]) || (loin(p) === loin(points[i]) && Math.abs(p.x - at.x) < Math.abs(points[i].x - at.x))));
      })
      .map((b) => b.id),
  };
}
/** Deux boîtes (centre, taille) se recouvrent-elles ? */
const couvre = (p: LabelBox, q: LabelBox) => Math.abs(p.x - q.x) < (p.w + q.w) / 2 && Math.abs(p.y - q.y) < (p.h + q.h) / 2;
const nomsTus = (...args: Parameters<typeof laCarte>) => laCarte(...args).tus;

/** Le mot de l'état « tout construit » dans chaque univers (`etatsDIle`). */
const ETATS = { blocland: 'Bâtie', archipeo: 'Restaurée' };

/**
 * En portrait 800 × 1280 (une tablette tenue debout), le bonhomme sur l'île d'histoire, selon la destination : les noms
 * qui se taisent, mesurés dans Luciole, la police de lecture par défaut de l'application (les autres tables de ce fichier
 * se mesurent encore dans Atkinson Hyperlegible, de 10 à 13 % plus étroite en gras : voir l'en-tête). La Carte y est au
 * plancher (`PLANCHER_DE_LA_CARTE`) ; les îles et leurs noms glissent au milieu de la place quand elles y tiennent
 * (`cadrageDeLaCarte`, référent dys, SC-3). Un nom au plus par Carte, jamais celui de la destination ni de l'île du
 * bonhomme ; aucun nom coupé par le bord (UX UI, SC-3). Limite connue (HG-3, SC-3), au pilotage.
 */
const TUS_EN_PORTRAIT: Partial<Record<string, string[]>> = {
  // Mesurés de nouveau depuis que la Carte cadre les lieux d'aujourd'hui et, au plancher, l'île du bonhomme hors de la
  // place avec la destination (GD-11, consultant UX UI) : six Cartes avant, quatre depuis, trois depuis une forme par
  // île aux Îles Brumeuses (GD-12, 9 octobre 2026 : le Delta n'y est plus sous le nom du Relais), deux depuis le dernier
  // recours de la Carte (`ECART_DU_DERNIER_RECOURS`, référent dys, 9 octobre 2026) : au 4e, vers les Puissances, la
  // Mondialisation se montre. Mesurés de nouveau avec les formes des Monts de Feu (GD-12, #407, 9 octobre 2026) : toujours
  // deux Cartes au 4e, les mêmes (sans le dernier recours, #407 en mesurait trois, avec la Mondialisation vers les Puissances).
  '4e:english-4e-comprehension': ['french-4e-vocabulary'],
  '4e:french-4e-agreement': ['lv2-4e-daily-life'],
  '3e:english-3e-grammar': ['lv2-3e-travel'],
  // Au 5e, depuis le Fournil des partages et la Grotte des légendes (EMC et latin-grec, 9 octobre 2026, mesuré) : vers le
  // Marais des temps, le nom du Carrefour des homophones, son voisin, se tait.
  '5e:french-5e-conjugation': ['french-5e-homophones'],
};

/**
 * Au 3e, en portrait, le bonhomme sur le Verger de la santé (la capture `sciences-college-carte-3e-800x1280`), vers la
 * destination du jeu tout construit (l'ouvrage depuis l'Observatoire des textes) : le Plateau des territoires se tait, dans
 * Luciole (la page le montre ainsi), son île dans le cadre.
 */
const TUS_EN_PORTRAIT_AU_VERGER: string[] = [];

/**
 * Au 3e, sur la tablette en OpenDyslexic 32 px, le bonhomme sur le Verger de la santé : les noms qui se taisent. Un seul
 * avant GD-11 ; trois depuis que les îles ont grandi (la Géométrie, l'Observatoire des textes, le Kiosque des témoins),
 * encore trois depuis que la Carte cadre les lieux d'aujourd'hui : le Verger et le Kiosque sont en haut à droite, sous la
 * colonne des classes, qui prend la place de leurs noms. Quatre depuis que le cadrage compte le nom le plus haut monté
 * d'une demi-étiquette (`cadrageDeLaCarte`, consultant UX UI) : le Belvédère de Thalès, le Château des hypothèses, le
 * Kiosque et la Ruche des réseaux ; l'Observatoire des textes se montre. Deux depuis le dernier recours de la Carte
 * (`ECART_DU_DERNIER_RECOURS`, référent dys, 9 octobre 2026) : le Château des hypothèses et la Ruche se montrent.
 */
const TUS_EN_OD32_AU_VERGER = ['maths-3e-geometry', 'history-3e-twentieth-century'];

/**
 * La tablette en OpenDyslexic 32 px, au 6e, selon l'île du bonhomme : les noms qui se taisent (mesurés, consultant UX
 * UI). Onze îles serrées à gauche autour du bonhomme, des noms de 250 à 400 px de large : la place manque. Le nom de la
 * destination et celui de l'île du bonhomme se montrent toujours (DA, HG-3) ; dans la page, la Fouille se montre sous son
 * île, sous le médaillon.
 */
const TUS_EN_OD32: Record<string, string[]> = {
  // Quatre noms depuis GD-11 (les îles plus grandes serrent la Carte du 6e), trois depuis que la Carte cadre les lieux
  // d'aujourd'hui (consultant UX UI), deux depuis qu'elle compte le nom le plus haut monté d'une demi-étiquette : la
  // Mine des lettres et l'Horloge des verbes se montrent, la Pointe des paysages se tait. Trois sur main avant GD-11.
  // Un depuis les formes des îles (GD-12) : la Vallée du vivant, un pas plus au fond, se montre. Deux depuis que leur
  // trait va jusqu'à sept cases et qu'un nom se tait plutôt que de se poser sur une autre île (directeur artistique,
  // 8 octobre 2026) : l'Horloge des verbes et le Volcan des décimaux, que l'écart posait sur une voisine, reprennent une
  // place sur leur île ; la Vallée du vivant (le bonhomme sur la Fouille) et la Mine des lettres (sur la Forêt, comme la
  // capture `formes-carte-6e-od32`) n'en trouvent plus.
  // Depuis les missions du programme (GD-14, 9 octobre 2026 : une borne de plus, le Gardien du Hangar des inventions
  // derrière la bande de devant), mesurés : la Carrière des mots seule, le bonhomme sur la Fouille ; aucun sur la Forêt.
  // Avec le Préau des délégués (EMC-2) en plus de GD-14, mesurés : la Carrière des mots seule, dans les deux cas.
  'history-6e-antiquity': ['french-6e-word-spelling'],
  'french-6e-phonology': ['french-6e-word-spelling'],
};

/**
 * La tablette, panneau ouvert, selon la destination : les noms qui se taisent depuis les îles de sciences (SC-3, mesurés).
 * Trois îles de plus par classe, posées sur les seules places libres hors de la colonne de la caméra : la recherche des
 * places (cœurs de `map.ts`) laissait un nom tu par classe, une seule destination chacune, jamais celui de la destination.
 */
const TUS_VERS_UNE_DESTINATION: Partial<Record<ArchipelagoId, Record<string, string[]>>> = {
  // Depuis que la Carte cadre les lieux d'aujourd'hui et, au plancher, l'île du bonhomme avec la destination (GD-11,
  // consultant UX UI) : aucun (cinq destinations en taisaient un depuis la grille de GD-11, trois sur main). Aux Monts
  // de Feu, depuis une forme par île (GD-12, 9 octobre 2026), le cadre a un rang de plus au fond, sous le panneau :
  // trois destinations taisaient cinq noms ; depuis que le Théâtre avance d'un pas et l'Imprimerie recule d'un pas
  // (relecture du 9 octobre 2026), deux destinations, trois noms : vers la Source, au coin de devant, l'Escale et le
  // Bassin, au coin opposé ; vers la Vigie, le Cabinet (régression, au pilotage). Le Bassin deux pas plus au fond n'en
  // taisait plus qu'un, mais coupait un morceau de plus du monde en blocs (six appels de plus) et défaisait sa réunion
  // avec le Cabinet.
  '4e': {
    'life-earth-sciences-4e-cells-evolution': ['geography-4e-globalization', 'technology-4e-modeling'],
    'physics-chemistry-4e-signals-circuits': ['french-4e-vocabulary'],
  },
  // Au 5e, depuis le Fournil des partages et la Grotte des légendes (EMC et latin-grec, 9 octobre 2026, mesurés) : trois
  // destinations taisent un ou deux noms. Vers le Glacier des relatifs, cinq se taisaient, au-delà du plafond de trois du
  // référent dys (Bloquant du consultant UX UI) ; aucun depuis que la recherche d'un nom tu de moins laisse aussi de côté,
  // à son tour, un nom montré (`chercherToutesLesPlaces`) : tous se posent, la Prairie des climats au dernier recours.
  '5e': {
    'english-5e-vocabulary': ['physics-chemistry-5e-matter-universe'],
    'french-5e-homophones': ['geography-5e-resources', 'technology-5e-design'],
    'geography-5e-resources': ['civics-5e-equality-solidarity'],
  },
};

/**
 * Les mêmes, dans Archipéo, là où ils diffèrent (« Restaurée » est plus large que « Bâtie », UX UI, SC-3) : au 5e,
 * depuis le Fournil des partages et la Grotte des légendes (mesurés), vers le Glacier des relatifs, un seul nom se tait.
 */
const TUS_VERS_UNE_DESTINATION_DANS_ARCHIPEO: Partial<Record<ArchipelagoId, Record<string, string[]>>> = {
  '5e': {
    'english-5e-vocabulary': ['lca-5e-legends'],
    'maths-5e-signed-numbers': ['life-earth-sciences-5e-active-planet'],
  },
};

/**
 * La flèche sur un ouvrage (GD-7), panneau ouvert : les noms qui se taisent depuis les îles de sciences (SC-3, mesurés),
 * jamais celui de l'île de départ. Même limite que `TUS_VERS_UNE_DESTINATION`.
 */
const TUS_SUR_UN_OUVRAGE: Partial<Record<ArchipelagoId, Record<string, string[]>>> = {
  // Mesurés de nouveau depuis que la Carte cadre les lieux d'aujourd'hui (GD-11, consultant UX UI) : deux ouvrages taisent
  // un nom (douze avant, cinq sur main) ; un seul depuis une forme par île aux Îles Brumeuses (GD-12, 9 octobre 2026 :
  // l'ouvrage entre le Manoir et la Prairie, qui a changé de place, ne tait plus la Menuiserie). Aux Monts de Feu, depuis une
  // forme par île (GD-12, 9 octobre 2026), cinq flèches taisaient un nom chacune (aucune avant) ; trois depuis que le
  // Théâtre avance d'un pas et l'Imprimerie recule d'un pas (relecture du 9 octobre 2026) : le Bassin des maquettes, au
  // coin du fond, sous le panneau, depuis les deux bouts de l'ouvrage de l'Atelier à la Forge et depuis la Source vers la
  // Forge (régression, au pilotage). Les deux îles d'histoire-géographie ne se taisent plus l'une vers l'autre.
  // Au 5e, depuis le Fournil des partages et la Grotte des légendes (EMC et latin-grec, 9 octobre 2026, mesurés) : cinq
  // flèches taisent un ou deux noms.
  '5e': {
    'maths-5e-proportionality-french-5e-conjugation depuis french-5e-conjugation': ['lca-5e-legends'],
    'maths-5e-signed-numbers-maths-5e-proportionality depuis maths-5e-proportionality': ['physics-chemistry-5e-matter-universe', 'lca-5e-legends'],
    'maths-5e-signed-numbers-maths-5e-proportionality depuis maths-5e-signed-numbers': ['physics-chemistry-5e-matter-universe', 'lca-5e-legends'],
    'technology-5e-design-lv2-5e-introductions depuis lv2-5e-introductions': ['civics-5e-equality-solidarity'],
    'technology-5e-design-lv2-5e-introductions depuis technology-5e-design': ['physics-chemistry-5e-matter-universe'],
  },
  '3e': { 'geography-3e-france-technology-3e-digital depuis geography-3e-france': ['technology-3e-digital'] },
  '4e': {
    'maths-4e-algebra-maths-4e-powers depuis maths-4e-algebra': ['technology-4e-modeling'],
    'maths-4e-algebra-maths-4e-powers depuis maths-4e-powers': ['technology-4e-modeling'],
    'maths-4e-powers-life-earth-sciences-4e-cells-evolution depuis life-earth-sciences-4e-cells-evolution': ['technology-4e-modeling'],
  },
};

/**
 * Les mêmes, dans Archipéo, là où ils diffèrent (« Restaurée » est plus large que « Bâtie », UX UI, SC-3) : aucun depuis
 * que la Carte cadre les lieux d'aujourd'hui (deux ponts du 5e y taisaient un nom de plus depuis GD-11).
 */
const TUS_SUR_UN_OUVRAGE_DANS_ARCHIPEO: Partial<Record<ArchipelagoId, Record<string, string[]>>> = {
  // Depuis le Fournil des partages et la Grotte des légendes (EMC et latin-grec de 5e, mesuré).
  '5e': { 'maths-5e-signed-numbers-maths-5e-proportionality depuis maths-5e-proportionality': ['life-earth-sciences-5e-active-planet', 'lca-5e-legends'] },
};

/**
 * La tablette à l'ouverture de la Carte, en OpenDyslexic, le bonhomme sur la destination (il y est arrivé) : les noms
 * qui se taisent selon la destination, dans les deux univers, sauf une clé « blocland:… », qui ne vaut que dans Blocland
 * (« Bâtie » et « Restaurée » n'ont pas la même largeur) (SC-3, mesurés ; consultant UX UI). La bulle et
 * le médaillon se posent alors sur la même île et prennent la place de plusieurs noms ; jamais celui de la destination.
 * Au 3e, la Ruche des réseaux et le Refuge des carnets, au bord gauche de l'écran, s'y taisaient eux-mêmes : la Ruche
 * prend son nom au-dessus de la bulle, glissé pour tenir dans l'écran (`showAtAllCosts`), et le Refuge avance à hauteur du
 * Château (map.ts). Huit destinations sur douze y taisent un à trois autres noms.
 */
const TUS_EN_OD_SUR_LA_DESTINATION: Partial<Record<ArchipelagoId, Record<string, string[]>>> = {
  // Mesurés de nouveau depuis que la Carte cadre les lieux d'aujourd'hui (GD-11, consultant UX UI) : aucun au 5e, trois
  // destinations au 4e, neuf au 3e (seize destinations avant dans Blocland, treize sur main). Au 3e, quatre depuis que
  // le cadrage compte le nom le plus haut monté d'une demi-étiquette (huit noms tus au lieu de treize) : le Kiosque des
  // témoins ne se tait plus que vers le Belvédère de Thalès (quatre destinations avant).
  // Au 5e, depuis une forme par île (GD-12, 9 octobre 2026), une seule destination : vers la Saline des mélanges, le
  // nom du Delta des ressources, sa voisine, se tait ; il n'est jamais posé sur une autre île (`ailleurs` vide). Aux Monts
  // de Feu, depuis une forme par île, aucune (trois destinations avant).
  // Depuis le Fournil des partages et la Grotte des légendes (EMC et latin-grec, 9 octobre 2026, mesurés) : sept
  // destinations, un nom chacune ; la Grotte et le Fournil, voisins au rang du fond, se taisent l'un vers l'autre.
  '5e': {
    'civics-5e-equality-solidarity': ['lca-5e-legends'],
    'french-5e-conjugation': ['french-5e-homophones'],
    'lca-5e-legends': ['civics-5e-equality-solidarity'],
    'life-earth-sciences-5e-active-planet': ['lca-5e-legends'],
    'lv2-5e-introductions': ['physics-chemistry-5e-matter-universe'],
    'maths-5e-proportionality': ['french-5e-conjugation'],
    'physics-chemistry-5e-matter-universe': ['geography-5e-resources'],
  },
  '3e': {
    'maths-3e-statistics': ['french-3e-close-reading', 'geography-3e-france'],
    'english-3e-grammar': ['technology-3e-digital'],
  },
};

/**
 * Le téléphone 390 × 844, au 6e, selon l'île du bonhomme : les noms qui se taisent (mesurés, consultant UX UI). La
 * Carte y est au plancher et cadre la destination (la Forêt des sons) ; les îles glissent au milieu de la place, en
 * hauteur, quand elles y tiennent (`cadrageDeLaCarte`). Un seul nom se taisait avant GD-11 (le Hangar des inventions, en
 * bas à droite) ; GD-11 en a tu trois ou quatre ; depuis GD-14, de nouveau un seul, deux avec le Préau des délégués
 * (EMC-2, ci-dessous), et sept noms se montrent.
 * Le cadrage de la tablette qui
 * compte le nom le plus haut monté d'une demi-étiquette ne vaut pas ici (portrait, au plancher).
 */
const TUS_AU_TELEPHONE: Record<string, string[]> = {
  // Depuis GD-11, les îles plus grandes serrent la Carte du 6e sur le téléphone : trois ou quatre noms se taisent (un
  // avant). Le bonhomme sur la Fouille des siècles, au bord gauche de l'écran, la Fouille et la destination ne tiennent
  // pas ensemble dans la place (`cadrageDeLaCarte`) : son nom glisse au bord de l'écran, sous le médaillon
  // (`showAtAllCosts`), et l'Horloge des verbes se tait à sa place. Régression connue, au pilotage. Depuis les formes
  // des îles (GD-12), les colonnes de côté sur quatre rangs et le rang du fond en quinconce : un nom tu le bonhomme sur
  // la Fouille (la Mine des lettres), trois sur la Forêt (le Volcan se montre).
  // Depuis les missions du programme (GD-14, 9 octobre 2026), mesurés : un seul nom tu dans les deux cas, le Hangar des
  // inventions. Avec le Préau des délégués (EMC-2) en plus, mesurés : deux, le Hangar et le Préau, au même bord.
  'history-6e-antiquity': ['technology-6e-objects', 'civics-6e-democratic-society'],
  'french-6e-phonology': ['technology-6e-objects', 'civics-6e-democratic-society'],
};

/**
 * Le portrait 800 × 1280 au 6e, dans Luciole, selon l'île du bonhomme : les noms qui se taisent (mesurés, GD-12, 8 octobre
 * 2026 ; trois au plus, référent dys) : aucun depuis GD-14.
 */
const SILENCED_IN_PORTRAIT_6E: Record<string, string[]> = {
  // Depuis les missions du programme (GD-14, 9 octobre 2026), mesurés : aucun.
  'history-6e-antiquity': [],
  'french-6e-phonology': [],
};

/**
 * Les mêmes en OpenDyslexic 32 px (GD-12, 8 octobre 2026, mesurés) : quatre, un de plus que le plafond du référent dys
 * (`SILENCED_NAMES_CAP`) sur la Fouille ; trois sur la Forêt depuis GD-14, quatre avec le Préau des délégués (EMC-2). La page est à revoir sur la capture
 * `formes-carte-6e-800x1280-od32`. Régression connue, au pilotage.
 */
const SILENCED_IN_PORTRAIT_6E_OD32: Record<string, string[]> = {
  // Depuis les missions du programme (GD-14, 9 octobre 2026), mesurés : la Mine des lettres à la place de la Vallée du
  // vivant sur la Fouille ; trois sur la Forêt. Avec le Préau des délégués (EMC-2) en plus de GD-14, mesurés : quatre
  // dans les deux cas, la Ferme des accords à la place du Laboratoire des éléments sur la Fouille.
  'history-6e-antiquity': ['french-6e-letter-confusion', 'french-6e-word-spelling', 'french-6e-grammar-spelling', 'geography-6e-living'],
  'french-6e-phonology': ['french-6e-letter-confusion', 'french-6e-word-spelling', 'french-6e-grammar-spelling', 'geography-6e-living'],
};

/** Trois noms tus au plus sur une Carte (référent dys). */
const SILENCED_NAMES_CAP = 3;

/**
 * L'île touchée qui se montre peut en taire un autre : quatre noms tus au plus, un de plus que le plafond (mesuré au 6e,
 * en portrait en OpenDyslexic 32 px, la Pointe des paysages touchée, le bonhomme sur la Forêt).
 */
const TUS_L_ILE_TOUCHEE = SILENCED_NAMES_CAP + 1;

/** Les noms montrés sur le téléphone, selon l'île du bonhomme (sept avant GD-11, six puis sept depuis GD-12 sur la Fouille). */
const NOMS_MONTRES_AU_TELEPHONE: Record<string, number> = { 'history-6e-antiquity': 7, 'french-6e-phonology': 7 };

/**
 * À l'ouverture de la Carte, sans panneau, en OpenDyslexic (taille normale, puis 10 % plus large), les noms qui se
 * taisent parmi ceux que le test exige (tous à ×1, ceux d'histoire-géographie à ×1,1) : aucun avant GD-11. Depuis que la
 * Carte cadre les lieux d'aujourd'hui, plus aucun au 4e ; au 3e, le Kiosque des témoins, en haut à droite sous la colonne
 * des classes, n'avait pas de place. Depuis que le cadrage compte le nom le plus haut monté d'une demi-étiquette
 * (consultant UX UI), le Kiosque se montre en taille normale, mais le Belvédère de Thalès et l'Observatoire des textes se
 * taisent ; à ×1,1, le Kiosque se tait encore. Régression connue, au pilotage. Depuis le dernier recours de la Carte
 * (`ECART_DU_DERNIER_RECOURS`, référent dys, 9 octobre 2026), le Belvédère se montre en taille normale.
 */
const TUS_EN_OD_A_L_OUVERTURE: Partial<Record<string, string[]>> = {
  '3e:1': ['french-3e-close-reading'],
  '3e:1.1': ['history-3e-twentieth-century'],
};

/**
 * La destination que le jeu donne au village tout construit, le bonhomme sur l'île `ici` (`nextDestination`), calculée
 * une fois par île : la partie toute construite coûte 300 ms à bâtir sous jsdom, et chaque test du 6e la demandait
 * quatre fois.
 */
const destinations = new Map<BiomeId, BiomeId | { ouvrage: string; depuis?: BiomeId }>();
function destinationDuJeu(ici: BiomeId): BiomeId | { ouvrage: string; depuis?: BiomeId } {
  const connue = destinations.get(ici);
  if (connue) return connue;
  const { progress, world } = toutConstruit();
  const etat = sanitizeState({ progress, world: { ...world, place: ici } } as never);
  const d = nextDestination(etat, NOMS_ARCHIPELS, textesDe('blocland').libelles);
  const r = d.ouvrage ? { ouvrage: d.ouvrage, depuis: d.island } : d.island;
  destinations.set(ici, r);
  return r;
}

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

  // Comme la capture `carte-6e-od32` : le bonhomme sur la Fouille des siècles, ou sur la première île. (Deux Cartes
  // serrées par test, chacune avec sa recherche complète : quelques secondes sous jsdom.)
  it.each(['history-6e-antiquity', islandsOf('6e')[0].id] as BiomeId[])('6e, tablette en OpenDyslexic 32 px, deux univers, le bonhomme sur %s : aucune étiquette sous un bouton ni hors de l’écran, aucune sous le médaillon ; jamais tus, les noms de la destination et de l’île du bonhomme (HG-3, DA)', (ici) => {
    const destination = destinationDuJeu(ici);
    const { w: W, h: H } = TABLETTE_OD32.taille;
    for (const [univers, mot] of Object.entries(ETATS)) {
      const carte = laCarte('6e', mot, 'opendyslexic', CHASSE_OD32, destination, true, TABLETTE_OD32, ici);
      const dit = (id: string) => `${univers}, bonhomme sur ${ici}, ${id}`;
      for (const m of carte.montrees) {
        expect(m.x - m.w / 2, dit(m.id)).toBeGreaterThanOrEqual(0);
        expect(m.x + m.w / 2, dit(m.id)).toBeLessThanOrEqual(W);
        expect(m.y - m.h / 2, dit(m.id)).toBeGreaterThanOrEqual(0);
        expect(m.y + m.h / 2, dit(m.id)).toBeLessThanOrEqual(H);
        for (const z of [...TABLETTE_OD32.zones, carte.fanion]) expect(couvre(m, z), `${dit(m.id)} ${JSON.stringify(m)} sur ${JSON.stringify(z)}`).toBe(false);
      }
      // Le nom de la prochaine destination et celui de l'île du bonhomme ne se taisent jamais (DA, HG-3) ; les noms
      // tus sont ceux mesurés (consultant UX UI), trois au plus (référent dys).
      expect(carte.tus, dit('la destination')).not.toContain(typeof destination === 'string' ? destination : destination.depuis);
      expect(carte.tus, dit('le bonhomme')).not.toContain(ici);
      expect(carte.tus, dit('les noms tus')).toEqual(TUS_EN_OD32[ici]);
      expect(carte.tus.length, dit('les noms tus')).toBeLessThanOrEqual(3);
      // Chaque nom montré sur son île : mieux vaut le taire que le poser sur une autre (directeur artistique, GD-12).
      expect(carte.ailleurs, dit('les noms sur une autre île')).toEqual([]);
    }
  }, 20_000);

  it('6e, téléphone 390 × 844, deux univers : les noms tus sont ceux mesurés, jamais ceux de la destination ni de l’île du bonhomme (HG-3, UX UI)', () => {
    for (const ici of ['history-6e-antiquity', islandsOf('6e')[0].id] as BiomeId[]) {
      const destination = destinationDuJeu(ici);
      for (const [univers, mot] of Object.entries(ETATS)) {
        const carte = laCarte('6e', mot, 'atkinson-hyperlegible', 1, destination, true, TELEPHONE, ici);
        const dit = (quoi: string) => `${univers}, bonhomme sur ${ici}, ${quoi}`;
        expect(carte.tus, dit('les noms tus')).toEqual(TUS_AU_TELEPHONE[ici]);
        expect(carte.vues, dit('les noms montrés')).toHaveLength(NOMS_MONTRES_AU_TELEPHONE[ici]);
        expect(carte.tus, dit('la destination')).not.toContain(typeof destination === 'string' ? destination : destination.depuis);
        expect(carte.tus, dit('le bonhomme')).not.toContain(ici);
        for (const m of carte.montrees) for (const z of [...TELEPHONE.zones, carte.fanion]) expect(couvre(m, z), dit(m.id)).toBe(false);
      }
    }
  }, 20_000);

  it('6e, portrait 800 × 1280, deux univers, dans Luciole et en OpenDyslexic 32 px : trois noms tus au plus dans Luciole (quatre en OpenDyslexic, régression connue), jamais ceux de la destination ni de l’île du bonhomme, chacun sur son île (GD-12, UX UI ; référent dys)', () => {
    for (const ici of ['history-6e-antiquity', islandsOf('6e')[0].id] as BiomeId[]) {
      const destination = destinationDuJeu(ici);
      for (const [univers, mot] of Object.entries(ETATS)) {
        // Dans Luciole, puis en OpenDyslexic 32 px.
        for (const [police, chasse, ecran, attendus, plafond] of [
          ['luciole', 1, PORTRAIT_800, SILENCED_IN_PORTRAIT_6E, SILENCED_NAMES_CAP],
          // Un de plus que le plafond (régression connue de GD-12 et GD-14, acceptée par le mainteneur le 9 octobre 2026,
          // « Pointe plus tard » : au pilotage), avec le Préau des délégués (EMC-2) aussi.
          ['opendyslexic', CHASSE_OD32, PORTRAIT_800_OD32, SILENCED_IN_PORTRAIT_6E_OD32, SILENCED_NAMES_CAP + 1],
        ] as const) {
          const carte = laCarte('6e', mot, police, chasse, destination, true, ecran, ici);
          const dit = (quoi: string) => `${univers}, ${police}, bonhomme sur ${ici}, ${quoi}`;
          expect(carte.tus, dit('les noms tus')).toEqual(attendus[ici]);
          expect(carte.tus.length, dit('les noms tus')).toBeLessThanOrEqual(plafond);
          expect(carte.tus, dit('la destination')).not.toContain(typeof destination === 'string' ? destination : destination.depuis);
          expect(carte.tus, dit('le bonhomme')).not.toContain(ici);
          expect(carte.ailleurs.filter((id) => id !== ici), dit('les noms sur une autre île')).toEqual([]);
          for (const m of carte.montrees) for (const z of [...ecran.zones, carte.fanion]) expect(couvre(m, z), dit(m.id)).toBe(false);
        }
      }
    }
  }, 20_000);

  it('le poids d’un nom sur la Carte : la destination 2, une île fermée qu’un ouvrage relie à une île ouverte 1, sinon 0,5 ; l’île touchée au moins 1 (référent dys)', () => {
    const labels = [
      { id: 'french-6e-phonology', closed: false },
      { id: 'civics-6e-democratic-society', closed: true },
      { id: 'geography-5e-resources', closed: true },
      { id: 'maths-6e-calculation', closed: false },
    ];
    // Le Préau se relie à la Forêt, ouverte ; aucune île des Îles Brumeuses n'est ouverte.
    expect(mapLabelWeights(labels, 'maths-6e-calculation')).toEqual([1, 1, 0.5, 2]);
    expect(mapLabelWeights(labels, 'maths-6e-calculation', 'geography-5e-resources')).toEqual([1, 1, 1, 2]);
  });

  // Le jeu tout construit sauf le Préau des délégués, la dernière île du 6e (EMC-2) : fermé, il pesait 0,5 et son nom
  // se taisait le premier (sur la tablette en OpenDyslexic 32 px, à la place de la Fouille des siècles, le bonhomme sur
  // la Forêt). Relié à une île ouverte, il pèse 1 : les mêmes noms se taisent que s'il était ouvert (mesuré).
  it('6e, le Préau des délégués fermé, en OpenDyslexic 32 px sur la tablette et en portrait : son nom ne se tait pas plus tôt, et pas un nom de plus (référent dys)', () => {
    const preau: BiomeId = 'civics-6e-democratic-society';
    for (const ici of ['history-6e-antiquity', islandsOf('6e')[0].id] as BiomeId[]) {
      const destination = destinationDuJeu(ici);
      for (const [ecran, attendus] of [
        [TABLETTE_OD32, TUS_EN_OD32],
        [PORTRAIT_800_OD32, SILENCED_IN_PORTRAIT_6E_OD32],
      ] as const) {
        const carte = laCarte('6e', ETATS.blocland, 'opendyslexic', CHASSE_OD32, destination, true, ecran, ici, { fermees: [preau] });
        expect(carte.tus, `bonhomme sur ${ici}, ${ecran.taille.w} × ${ecran.taille.h}`).toEqual(attendus[ici]);
      }
    }
  }, 20_000);

  // L'île touchée (sur la Carte, l'île fermée choisie ; ailleurs, celle dont la fiche est ouverte) : son nom ne se tait
  // jamais, comme celui de la destination, tant qu'une place le permet : entière, à 2,25 hauteurs d'étiquette au plus de
  // son île, pas plus près d'une autre île, ni sur le nom de la destination, ni sur celui du bonhomme s'il n'en trouve pas
  // d'autre (référent dys, 9 octobre 2026). Chaque nom tu, touché à son tour : ceux qui n'ont aucune place qui tienne se
  // taisent encore (`TOUCHEE_SANS_PLACE`, mesurés), les autres se montrent, au prix d'autres noms (`TUS_L_ILE_TOUCHEE`).
  const TOUCHEE_SANS_PLACE: Record<string, string[]> = {
    // La Carrière des mots, au bord gauche, entre la Pointe des paysages (dessus) et le Laboratoire (dessous), la Mine à
    // côté ; la Mine, entre la Carrière, la Forêt et la Rivière : toute place de leur nom est plus près d'une voisine.
    // La Mine des lettres, depuis GD-14 et le Préau des délégués (EMC-2) : sa seule place couvre le nom de la Forêt des
    // sons, la destination ; l'île touchée cède à la destination et au bonhomme (mesuré).
    // La Ferme des accords, depuis GD-14 et le Préau : montrée, elle taisait deux noms de plus que la Carte sans elle ;
    // elle cède (`avecLIleTouchee`, référent dys, mesuré), dans les deux cas.
    'portrait-od32:history-6e-antiquity': ['french-6e-word-spelling', 'french-6e-letter-confusion', 'french-6e-grammar-spelling'],
    'portrait-od32:french-6e-phonology': ['french-6e-letter-confusion', 'french-6e-word-spelling', 'french-6e-grammar-spelling'],
    // La Pointe, au bord du rang du fond, sous le nom de la Fouille ; la Mine, le bonhomme sur la Forêt.
    'tablette-od32:history-6e-antiquity': ['geography-6e-living'],
    'tablette-od32:french-6e-phonology': ['french-6e-letter-confusion'],
    'telephone:french-6e-phonology': ['french-6e-letter-confusion', 'civics-6e-democratic-society'],
    // Le Préau des délégués, au bord du téléphone sous le Hangar, depuis GD-14 et EMC-2 ensemble (mesuré).
    'telephone:history-6e-antiquity': ['civics-6e-democratic-society'],
  };
  it('6e, l’île touchée garde son nom, sauf sans aucune place qui tienne (mesuré) ; jamais aux dépens de la destination ni du bonhomme (référent dys)', () => {
    for (const ici of ['history-6e-antiquity', islandsOf('6e')[0].id] as BiomeId[]) {
      const destination = destinationDuJeu(ici);
      const dest = typeof destination === 'string' ? destination : destination.depuis;
      for (const [nom, ecran, police, chasse] of [
        ['portrait-od32', PORTRAIT_800_OD32, 'opendyslexic', CHASSE_OD32],
        ['tablette-od32', TABLETTE_OD32, 'opendyslexic', CHASSE_OD32],
        ['telephone', TELEPHONE, 'atkinson-hyperlegible', 1],
        ['portrait-luciole', PORTRAIT_800, 'luciole', 1],
      ] as const) {
        const sansPlace = TOUCHEE_SANS_PLACE[`${nom}:${ici}`] ?? [];
        for (const touchee of laCarte('6e', ETATS.blocland, police, chasse, destination, true, ecran, ici).tus) {
          const carte = laCarte('6e', ETATS.blocland, police, chasse, destination, true, ecran, ici, { selected: touchee, fermees: [touchee] });
          const dit = (quoi: string) => `${nom}, bonhomme sur ${ici}, ${touchee} touchée, ${quoi}`;
          expect(carte.tus.includes(touchee), dit('son nom')).toBe(sansPlace.includes(touchee));
          expect(carte.tus, dit('la destination')).not.toContain(dest);
          expect(carte.tus, dit('le bonhomme')).not.toContain(ici);
          // Chaque nom montré sur son île, sauf ceux qui ne se taisent jamais, glissés à l'aplomb de la leur.
          expect(carte.ailleurs.filter((id) => id !== ici && id !== touchee), dit('les noms sur une autre île')).toEqual([]);
          expect(carte.tus.length, dit('les noms tus')).toBeLessThanOrEqual(TUS_L_ILE_TOUCHEE);
        }
      }
    }
  }, 60_000);

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
        expect(elargir === 1 ? od.tus : od.tus.filter((id) => hg.includes(id)), `${univers}, OpenDyslexic ×${elargir}`).toEqual(TUS_EN_OD_A_L_OUVERTURE[`${a}:${elargir}`] ?? []);
        expect(od.ailleurs.filter((id) => hg.includes(id)), `${univers}, OpenDyslexic ×${elargir}`).toEqual([]);
      }
    // En portrait 800 × 1280 (une tablette tenue debout), dans Luciole, la police de lecture par défaut, le bonhomme sur
    // l'île d'histoire comme la capture `carte-<classe>-800x1280`, quelle que soit l'île de destination : chaque nom
    // montré est entier dans l'écran, hors des boutons et du médaillon, et chaque île qui se voit garde son nom, sauf
    // `TUS_EN_PORTRAIT` (consultant UX UI, HG-3, SC-3).
    const ici: BiomeId = VOISINES_HG3[a][0];
    const tusDebout: Record<string, string[]> = {};
    for (const vers of islandsOf(a).map((b) => b.id))
      for (const [univers, mot] of Object.entries(ETATS)) {
        const debout = laCarte(a, mot, 'luciole', 1, vers, true, PORTRAIT_800, ici);
        if (debout.tus.length) tusDebout[`${univers}:${vers}`] = debout.tus;
        for (const m of debout.montrees) {
          const dit = `${univers}, 800 × 1280, vers ${vers}, ${m.id}`;
          for (const z of [...PORTRAIT_800.zones, debout.fanion]) expect(couvre(m, z), dit).toBe(false);
          // Chaque nom montré, entier dans l'écran (UX UI, SC-3), comme en OpenDyslexic 32 px.
          expect(m.x - m.w / 2, dit).toBeGreaterThanOrEqual(0);
          expect(m.x + m.w / 2, dit).toBeLessThanOrEqual(PORTRAIT_800.taille.w);
          expect(m.y - m.h / 2, dit).toBeGreaterThanOrEqual(0);
          expect(m.y + m.h / 2, dit).toBeLessThanOrEqual(PORTRAIT_800.taille.h);
        }
      }
    const attendus: Record<string, string[]> = {};
    for (const vers of islandsOf(a).map((b) => b.id))
      for (const univers of Object.keys(ETATS)) {
        const t = TUS_EN_PORTRAIT[`${a}:${vers}`];
        if (t) attendus[`${univers}:${vers}`] = t;
      }
    expect(tusDebout, '800 × 1280').toEqual(attendus);
    // Huit Cartes et vingt-quatre en portrait, chacune avec sa recherche : plus que les 5 s par défaut sur la CI.
  }, 30_000);

  // Un test par univers : deux Cartes en OpenDyslexic 32 px chacun, avec leur recherche.
  it.each(Object.entries(ETATS))('6e, %s, à l’ouverture de la Carte : chaque nom sur son île ; la recherche complète reste bornée (HG-3, DA ; SC-2)', (univers, mot) => {
    // La recherche complète ne se lance que si le placement simple tait un nom ou en pose un sur une autre île
    // (`placerDAbordSimplement`, DA, 6 octobre 2026). Avant les îles de
    // sciences, rien ne la lançait dans la police de lecture ; 10 % plus large, la Grammaire (anglais) se posait sur le
    // Vocabulaire : la recherche la remettait sur son île, en quelques centaines d'essais (avant : onze recherches par
    // ouverture, 52 000 places vérifiées et 2 000 essais).
    const destination = destinationDuJeu(islandsOf('6e')[0].id);
    // Depuis les trois îles de sciences (SC-2, la grille du 6e réarrangée), le placement simple pose le nom de la Mine
    // des lettres plus près de la Carrière des mots, et celui de la Ferme des accords plus près de la Tour du lecteur :
    // la recherche complète se lance dès la police de lecture et les remet sur leur île (270 essais, 3 570 places
    // vérifiées). Le DA lève alors sa règle « au 6e, chaque nom garde la place d'avant HG-3 » (les îles ont bougé) : au
    // 6e, chaque nom sur son île et aucun tu, comme ailleurs. Le plafond de 300 essais (270 mesurés) sautera avec une île
    // de plus au 6e : le relever alors à sa mesure. Depuis que la Carte cadre les lieux d'aujourd'hui (GD-11,
    // consultant UX UI), 310 essais dans la police de lecture (270 à ×1,1) : son plafond passe à 320.
    const simple = laCarte('6e', mot, 'atkinson-hyperlegible', 1, destination, true);
    expect(simple.tus, univers).toEqual([]);
    expect(simple.ailleurs, univers).toEqual([]);
    expect(simple.recherche?.essais ?? 0, univers).toBeLessThanOrEqual(320);
    expect(simple.recherche?.places ?? 0, univers).toBeLessThanOrEqual(4_000);
    const large = laCarte('6e', mot, 'atkinson-hyperlegible', 1.1, destination, true);
    expect(large.tus, `${univers}, ×1,1`).toEqual([]);
    expect(large.recherche?.essais ?? 0, `${univers}, ×1,1`).toBeLessThanOrEqual(300);
    expect(large.recherche?.places ?? 0, `${univers}, ×1,1`).toBeLessThanOrEqual(4_000);
    // Dans la police de lecture, aucun nom tu : la recherche d'un nom tu de moins ne se lance pas.
    for (const r of [simple.recherche, large.recherche]) expect(r?.essaisDUnNomDeMoins ?? 0, univers).toBe(0);
    // En OpenDyslexic 32 px, la recherche d'un nom tu de moins garde son plafond pour tout le cadrage (1 000 essais),
    // à part de celui de la recherche large (2 000) : elle ne repart plus de zéro à chaque placement du cadrage
    // (jusqu'à 25 000 essais de plus au 6e, expert frontend, SC-3), ni après une recherche large arrêtée par son plafond.
    for (const ici of ['history-6e-antiquity', islandsOf('6e')[0].id] as BiomeId[]) {
      const od = laCarte('6e', mot, 'opendyslexic', CHASSE_OD32, destinationDuJeu(ici), true, TABLETTE_OD32, ici);
      expect(od.recherche?.essais ?? 0, `${univers}, OpenDyslexic 32 px, bonhomme sur ${ici}`).toBeLessThanOrEqual(2_000);
      expect(od.recherche?.essaisDUnNomDeMoins ?? 0, `${univers}, OpenDyslexic 32 px, bonhomme sur ${ici}`).toBeLessThanOrEqual(1_000);
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

  it.each(['5e', '4e', '3e'] as const)('%s : quelle que soit la destination, chaque île qui se voit garde son nom, sauf les limites mesurées (SC-3)', (a) => {
    // Dans les deux univers (« Bâtie » et « Restaurée » n'ont pas la même largeur, UX UI, SC-3).
    for (const [univers, mot] of Object.entries(ETATS)) {
      const tus: Record<string, string[]> = {};
      for (const dest of islandsOf(a).map((b) => b.id)) {
        const t = nomsTus(a, mot, 'atkinson-hyperlegible', 1, dest);
        if (t.length) tus[dest] = t;
      }
      expect(tus, univers).toEqual({ ...TUS_VERS_UNE_DESTINATION[a], ...(univers === 'archipeo' ? TUS_VERS_UNE_DESTINATION_DANS_ARCHIPEO[a] : {}) });
    }
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

  it.each(['5e', '4e', '3e'] as const)('%s : la flèche sur un ouvrage, chaque île qui se voit garde son nom, sauf les limites mesurées (SC-3)', (a) => {
    for (const [univers, mot] of Object.entries(ETATS)) {
      const tus: Record<string, string[]> = {};
      for (const def of BRIDGES.filter((b) => archipelagoOfIsland(b.from) === a && posees.includes(b.id)))
        for (const depuis of [def.from, def.to]) {
          const t = nomsTus(a, mot, 'atkinson-hyperlegible', 1, { ouvrage: def.id, depuis });
          if (t.length) tus[`${def.id} depuis ${depuis}`] = t;
        }
      expect(tus, univers).toEqual({ ...TUS_SUR_UN_OUVRAGE[a], ...(univers === 'archipeo' ? TUS_SUR_UN_OUVRAGE_DANS_ARCHIPEO[a] : {}) });
    }
  }, 30_000);

  it.each(['5e', '4e', '3e'] as const)(
    '%s, à l’ouverture en OpenDyslexic, le bonhomme sur la destination, quelle qu’elle soit, deux univers : ni la destination ni l’île du bonhomme ne se taisent, les autres noms tus sont ceux mesurés (SC-3, UX UI)',
    (a) => {
      const tus: Record<string, string[]> = {};
      for (const vers of islandsOf(a).map((b) => b.id))
        for (const [univers, mot] of Object.entries(ETATS)) {
          const carte = laCarte(a, mot, 'opendyslexic', 1, vers, true, TABLETTE_A_L_OUVERTURE, vers);
          expect(carte.tus, `${univers}, vers ${vers}`).not.toContain(vers);
          if (carte.tus.length) tus[`${univers}:${vers}`] = carte.tus;
        }
      const attendus: Record<string, string[]> = {};
      for (const [cle, noms] of Object.entries(TUS_EN_OD_SUR_LA_DESTINATION[a] ?? {}))
        for (const univers of cle.includes(':') ? [''] : Object.keys(ETATS)) attendus[univers ? `${univers}:${cle}` : cle] = noms;
      expect(tus).toEqual(attendus);
    },
    30_000,
  );

  it('3e, le bonhomme sur le Verger de la santé (les captures de SC-3), deux univers : en OpenDyslexic 32 px sur la tablette, les noms tus mesurés ; en portrait 800 × 1280, chaque île dans le cadre, chaque nom entier, aucun nom tu (référent dys, UX UI, SC-3)', () => {
    const ici: BiomeId = 'life-earth-sciences-3e-human-body';
    const destination = destinationDuJeu(ici);
    for (const [univers, mot] of Object.entries(ETATS)) {
      // Le Kiosque des témoins, le Plateau des territoires et l'Observatoire des données s'y taisaient ensemble : faute
      // de place pour les trois, un seul se tait (`chercherToutesLesPlaces`, un nom tu de moins). Ici, l'Observatoire des
      // données ; dans la page (la capture `sciences-college-carte-3e-od32`), le Kiosque des témoins. Même caméra, mêmes
      // places (relevé dans la page, SC-3) : seules les largeurs diffèrent, celles du test de 1 à 4 % plus larges que
      // celles de la page (`CHASSE_OD32`, sans crénage). À 394 px dans la page, l'Observatoire des données tient à sa
      // place ; à 406 px ici, non, et c'est lui que la recherche laisse de côté.
      const od = laCarte('3e', mot, 'opendyslexic', CHASSE_OD32, destination, true, TABLETTE_OD32, ici);
      expect(od.tus, `${univers}, OpenDyslexic 32 px`).toEqual(TUS_EN_OD32_AU_VERGER);
      for (const m of od.montrees) {
        expect(m.x - m.w / 2, m.id).toBeGreaterThanOrEqual(0);
        expect(m.x + m.w / 2, m.id).toBeLessThanOrEqual(TABLETTE_OD32.taille.w);
        for (const z of [...TABLETTE_OD32.zones, od.fanion]) expect(couvre(m, z), `${univers}, ${m.id}`).toBe(false);
      }
      // En portrait, la Ruche des réseaux et le Refuge des carnets sortaient à gauche, 450 px vides en haut : les îles
      // glissent au milieu de la place (`cadrageDeLaCarte`). Toutes dans le cadre, chaque nom montré entier ; dans
      // Luciole, la police par défaut, les noms tus mesurés (`TUS_EN_PORTRAIT_AU_VERGER`).
      const debout = laCarte('3e', mot, 'luciole', 1, destination, true, PORTRAIT_800, ici);
      expect(debout.tus, `${univers}, 800 × 1280`).toEqual(TUS_EN_PORTRAIT_AU_VERGER);
      expect(debout.vues.length + debout.tus.length, `${univers}, 800 × 1280`).toBe(islandsOf('3e').length);
      for (const m of debout.montrees) {
        expect(m.x - m.w / 2, `${univers}, 800 × 1280, ${m.id}`).toBeGreaterThanOrEqual(0);
        expect(m.x + m.w / 2, `${univers}, 800 × 1280, ${m.id}`).toBeLessThanOrEqual(PORTRAIT_800.taille.w);
      }
    }
  }, 30_000);
});
