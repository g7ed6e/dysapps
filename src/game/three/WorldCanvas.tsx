// Le village en 3D : un seul maillage par matériau (faces visibles seulement), caméra gérée que l'élève peut faire
// glisser à plat (bornée à l'archipel), eau autour des îles, vol vers une île, jour et nuit, créatures qui se
// promènent. Chargé à la demande (voir ./index.ts).
// La scène est faite de parties (cubes, navire, bornes, personnages, lumière, brume, étiquettes, le large, la caméra) :
// ce composant les crée et leur passe les props ; les gestes (./gestures.ts) et la boucle d'image (./loop.ts) sont à part.
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { estDecale } from './drag';
import type { BiomeId } from '../biomes';
import { cadreDeLaLiaison, ileDeLaVueGlissee, islandCenter, worldBounds } from '../world/terrain';
import { getBridge } from '../world/archipelago';
import { cubeTags, type VoyageRun } from '../world/scene';
import { rappelsDeLaVue, type WorldViewProps } from '../world/view';
import { centreDeLObjet, cleDeLaCreature, cleDeLObjet, signesDesObjets, sommetsDesBornes, type ObjetDeLaFiche, type ObjetTouche } from '../world/affordance';
import { useEnCasesDuMonde } from '../useInWorldCells';
import { createMeter } from './meter';
import { habillageDe } from '../skin';
import { mesuresDemandees, renduDuMonde, styleDuMonde } from '../rendering';
import { useSettings } from '../../core/SettingsContext';
import { surfaceDe } from './surface';
import type { Derniers, Instant, Monde, PartieDeLaScene } from './scenePart';
import { creerLumiere } from './light';
import { creerBrume } from './mist';
import { creerLarge } from './offshore';
import { creerBornes, type Bornes } from './markers';
import { creerAffordance, type Affordance } from './affordance';
import { creerEtiquettes, type Etiquettes } from './labels';
import { creerPersonnages, type Personnages } from './characters';
import { creerSignes, type Signes } from './signs';
import { creerCubes, type Cubes } from './cubes';
import { creerNavire, type Amarre, type Navire } from './ship';
import { creerCamera, type Camera } from './camera';
import { creerRond } from './groundRing';
import { ecouterLeClavier, ecouterLesGestes } from './gestures';
import { lancerLaBoucle } from './loop';
import { creerAmenagement, type Amenagement } from './arrange';
import { contourner, lecteurDePlaceLibre, lirePlaceLibre, lirePlaceReelle, sousLaFiche, type PlaceLue } from '../freeSpace';


/** La scène en cours : le moteur de rendu, la caméra, et les parties que les props mettent à jour. */
interface Scene3D {
  camera: THREE.PerspectiveCamera;
  cadrage: Camera;
  bornes: Bornes;
  /** Les signes des objets touchables (Blocland). */
  affordance: Affordance;
  etiquettes: Etiquettes;
  personnages: Personnages;
  signes: Signes;
  cubes: Cubes;
  navire: Navire;
  /** Le mode « Aménager » (GD-9). */
  amenagement: Amenagement;
  /** Le fantôme du mode est hors de la vue : le cadrage glisse pour le poser au centre de la place libre. */
  /** Garde entier à l'écran un rectangle du monde (en cases, x et y) à une hauteur : la vue glisse s'il en sort. */
  garderEnVue(cadre: { rect: { x0: number; y0: number; x1: number; y1: number }; z: number }): void;
  /** Efface le décalage de l'élève et le dit à la page. */
  recentrer(): void;
  /** Le signe de l'objet d'une fiche fait son petit saut (s'il en porte un). */
  sauter(objet: ObjetDeLaFiche): void;
  /** La fiche posée dans la page cache son objet : le cadrage glisse pour le poser dans la place libre. */
  garderHorsDeLaFiche(objet: ObjetDeLaFiche): void;
}

/** Pas de créatures : une seule liste vide, pour que les signes des objets ne se recalculent pas à chaque rendu. */
const SANS_CREATURES: NonNullable<WorldViewProps['creatures']> = [];

/**
 * À l'ouverture de sa fiche, le milieu d'un Gardien reste à tant (en part du petit côté de la vue) du bord de la place
 * libre, sinon la caméra le recentre : un Gardien fait jusqu'à 9 cases de large, une centaine de pixels sur la tablette.
 */
const MARGE_D_UN_GARDIEN = 0.15;

export default function WorldCanvas({
  archipelago,
  cubes,
  focus: focusEnAncrages,
  reduceMotion = false,
  creatures = SANS_CREATURES,
  signes = [],
  prochaine = null,
  calme = false,
  forceDay = false,
  bridges = [],
  liaisonCadree = null,
  marker: markerEnAncrage = null,
  imageDeLaCarte = null,
  vehicle = null,
  voyage = null,
  avatar: avatarEnAncrages,
  map = false,
  home,
  trail: trailEnAncrages,
  quests: questsEnAncrages,
  etatsDesObjets,
  islandLabels,
  whalePass = null,
  rallumage = null,
  burst: burstEnAncrage,
  pose = null,
  onPose,
  onVueDeplacee,
  recentrage = 0,
  fiche = null,
  situer,
  className,
  label,
  onIntent,
  chantier = false,
  amenager = null,
  geste: gesteDuMode = null,
}: WorldViewProps) {
  // Les positions reçues en ancrages (une île, un point dans son repère), dessinées en cases du monde.
  const { focus, marker, avatar, trail, quests, burst } = useEnCasesDuMonde({
    archipelago,
    focus: focusEnAncrages,
    marker: markerEnAncrage,
    avatar: avatarEnAncrages,
    trail: trailEnAncrages,
    quests: questsEnAncrages,
    burst: burstEnAncrage,
    bridges,
  });
  // Les gestes deviennent des intentions (world/view.ts) : la vue garde ses rappels, tirés d'elles, lus au moment du geste.
  const rappelsDuRendu = rappelsDeLaVue(onIntent, archipelago, chantier);
  const rappels = useRef(rappelsDuRendu);
  rappels.current = rappelsDuRendu;
  const { build, onVoyageLegEnd } = rappelsDuRendu;
  const host = useRef<HTMLDivElement>(null);
  // Le rendu du monde (celui de l'univers, voir rendering.ts), lu une fois pour la vie du composant.
  const rendu = useRef(renduDuMonde()).current;
  const world = useRef<Scene3D | null>(null);
  /** Le voyage en cours dans la scène : son temps (départ ou arrivée), son début, où l'on en est. */
  const voyageRef = useRef<VoyageRun | null>(null);
  /** Le navire amarré : son origine dans le monde et les cases fantômes que l'on peut poser. */
  const vehicleRef = useRef<Amarre | null>(null);
  // Les cubes des bornes de mission et des ouvrages, par case : pour savoir ce qu'on touche.
  const tags = useRef(cubeTags([]));
  const dansLeMode = Boolean(amenager);
  // Où la page veut savoir que se tient le choix du mode à l'écran (les flèches autour de lui), lu à chaque image.
  const ecranDuModeRef = useRef(amenager?.ecran);
  ecranDuModeRef.current = amenager?.ecran;
  useEffect(() => {
    // Un ouvrage construit se touche comme le sol (lot 2 de « Toucher le monde ») : seuls ceux en fantôme sont des cibles.
    const t = cubeTags(cubes);
    // Dans le mode « Aménager » (GD-9), une liaison posée se touche : son arrivée la plus proche se choisit.
    if (!dansLeMode) for (const [cle, id] of t.bridges) if (bridges.includes(id)) t.bridges.delete(cle);
    tags.current = t;
  }, [cubes, bridges, dansLeMode]);
  // Ce qu'il faut pour trouver l'objet d'une fiche dans le monde (lu au moment du recadrage, pas à chaque image).
  const objetsRef = useRef({ cubes, creatures, vehicle });
  objetsRef.current = { cubes, creatures, vehicle };
  const archRef = useRef(archipelago);
  archRef.current = archipelago;
  const avatarRef = useRef(avatar);
  avatarRef.current = avatar;
  const vueDeplaceeRef = useRef(onVueDeplacee);
  vueDeplaceeRef.current = onVueDeplacee;
  const { settings } = useSettings();
  // Les props que la scène lit à chaque image (elle n'est pas refaite quand elles changent).
  // Une liaison montrée depuis un autre départ (GD-9) : son cadre, le même objet tant qu'elle ne change pas.
  const cadreChoisi = useMemo(() => {
    const def = liaisonCadree ? getBridge(liaisonCadree) : undefined;
    return def ? cadreDeLaLiaison(def, bridges) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liaisonCadree, bridges.join(',')]);
  const modeDAmenager = amenager ? (amenager.vue ? 'choix' : 'mode') : 'non';
  const derniers = useRef<Derniers>({ carte: map, focus, home: home ?? null, forceDay, whalePass, sons: settings.sounds, calme, cadreDeLaLiaison: cadreChoisi, onVoyageLegEnd, amenager: modeDAmenager });
  derniers.current = { carte: map, focus, home: home ?? null, forceDay, whalePass, sons: settings.sounds, calme, cadreDeLaLiaison: cadreChoisi, onVoyageLegEnd, amenager: modeDAmenager };
  // Le passage de la baleine : demandé par `whalePass`, joué une fois par `seq` (même si la scène est refaite).
  const passSeqRef = useRef<number | null>(null);
  // Les liaisons posées (GD-9), lues par la scène quand elle se construit et à chaque trajet : elle n'est pas refaite pour elles.
  const liaisonsRef = useRef<readonly string[]>(bridges);
  liaisonsRef.current = bridges;

  // ---- Création de la scène (une fois par archipel)
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight, false);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    // Le compteur de mesures (lot R0) : visible avec `?mesures`, lisible par les scripts en développement.
    const meter = createMeter(el, rendu, mesuresDemandees(), import.meta.env.DEV || mesuresDemandees());

    const scene = new THREE.Scene();
    const bounds = worldBounds(archipelago);
    // Archipéo (lot R1) : l'option de style `?style=a|b|c` (seulement avec le drapeau), sinon les textures des blocs.
    const habillage = habillageDe(rendu);
    const style = habillage.sol === 'facettes' ? styleDuMonde() : null;
    const monde: Monde = {
      scene,
      archipel: archipelago,
      habillage,
      surface: style ? surfaceDe(style, archipelago) : null,
      etendue: bounds,
      centre: { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 },
      largeur: Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY),
      liaisons: () => liaisonsRef.current,
    };
    const camera = new THREE.PerspectiveCamera(40, el.clientWidth / Math.max(1, el.clientHeight), 0.5, monde.largeur * 10);
    const instant: Instant = { now: 0, marche: false, traversee: null, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } };

    // Les parties, créées dans l'ordre d'avant la découpe, à quelques objets près (les nappes de brume avant l'eau, la
    // flèche de la Carte après les balises, les créatures avant le terrain, la case visée avant le navire) : sans effet
    // sur l'image, le rendu trie les objets par matériau et profondeur. `etiquettes` et `personnages` lisent le
    // bonhomme et le sol par des fonctions, appelées seulement une fois toutes les parties créées.
    const lumiere = creerLumiere(monde, camera, derniers);
    const brume = creerBrume(monde, lumiere, instant);
    const large = creerLarge(monde, camera, lumiere, derniers, passSeqRef);
    const bornes = creerBornes(monde, instant);
    // Les plaques des créatures (créées plus bas, lues seulement à l'animation) : les étiquettes s'en écartent.
    const plaques = { boites: (cam: THREE.Camera, W: number, H: number) => signesDesCreatures.boites(cam, W, H), get version() { return signesDesCreatures.version; } };
    // La place de la bulle d'or : relue tout de suite quand une fiche s'ouvre ou se ferme sur la Carte (comme les bulles
    // de l'île, signs.ts : la clé change avec elle), et sans « Recentrer », qui paraît avec la vue déplacée, donc avec la
    // bulle tenue au bord. Le cadrage de la caméra, lui, ne le compte pas : la Carte s'ouvrirait autrement.
    const lirePlaceDeLaBulle = lecteurDePlaceLibre(el);
    const lecteurDeLaPlaceDeLaBulle = (contexte: string): PlaceLue => {
      const lue = lirePlaceDeLaBulle(derniers.current.calme ? `${contexte}:calme` : contexte);
      const bouton = el.closest('[data-scene]')?.querySelector('.world-recentrer');
      if (!bouton) return lue;
      const vue = el.getBoundingClientRect();
      const b = bouton.getBoundingClientRect();
      const libre = contourner(lue.libre, { x: b.left - vue.left + b.width / 2, y: b.top - vue.top + b.height / 2, w: b.width, h: b.height });
      return libre === lue.libre ? lue : { ...lue, libre };
    };
    // Les poignées du mode « Modifier le plan » (créées plus bas, lues seulement à l'animation) : des obstacles durs.
    const poigneesDuMode = { boites: (cam: THREE.Camera, W: number, H: number) => amenagement.poignees.boites(cam, W, H), get version() { return amenagement.poignees.version; } };
    const etiquettes = creerEtiquettes(monde, el, camera, bornes.donneesDeLaFleche, () => personnages.avatar, instant, plaques, lecteurDeLaPlaceDeLaBulle, poigneesDuMode);
    const personnages = creerPersonnages(monde, () => cubesDuMonde.champ(), instant, lumiere);
    const cubesDuMonde = creerCubes(monde, large, lumiere, instant);
    const navire = creerNavire(monde, personnages, cubesDuMonde, derniers, instant, vehicleRef, voyageRef);
    const rond = creerRond(monde, personnages, () => cubesDuMonde.champ(), lumiere, instant);
    // Les bulles se tiennent dans la place libre : leur propre lecteur, pour ne pas changer la clé de celui de la caméra.
    // Les bulles suivent l'île que montre la vue glissée (hors de la Carte) : l'île la plus proche du cœur de l'île où
    // l'on est, déplacé comme la vue. Un petit glissé les laisse donc sur cette île, même quand le cadrage regarde un peu
    // à côté (tiré vers le centre de l'archipel) ; au-dessus de la mer, la plus proche.
    // `cadrage` est créé plus bas : `ileVisee` n'est appelée qu'à l'animation, jamais pendant creerSignes. Le résultat est
    // retenu par case, pour ne rien recalculer ni allouer à chaque image d'un glissé.
    const vise = { archipel: '', ici: '', x: NaN, z: NaN, ile: null as BiomeId | null };
    const ileVisee = () => {
      const ici = derniers.current.focus.island ?? derniers.current.home;
      if (derniers.current.carte || !ici || !estDecale(cadrage.decalage())) return null;
      const d = cadrage.decalage();
      const x = Math.round(d.x), z = Math.round(d.z);
      if (x !== vise.x || z !== vise.z || ici !== vise.ici || archRef.current !== vise.archipel) {
        Object.assign(vise, { archipel: archRef.current, ici, x, z, ile: ileDeLaVueGlissee(archRef.current, ici, { x, z }) });
      }
      return vise.ile;
    };
    const signesDesCreatures = creerSignes(monde, el, camera, personnages, derniers, instant, lecteurDePlaceLibre(el), ileVisee);
    const affordance = creerAffordance(derniers, instant);
    // La Carte se cadre dans la place que l'interface laisse libre, autour de la flèche de la destination (DA-31).
    const lecture = {
      place: lecteurDePlaceLibre(el),
      // L'île de la flèche, ou la case où elle se pose sur un ouvrage (GD-7) : le cadrage garde la flèche dans la vue.
      destination: () => {
        const { ouvrage, pointe, island } = bornes.donneesDeLaFleche();
        return ouvrage ? pointe : island;
      },
    };
    const cadrage = creerCamera(monde, camera, personnages.avatar, derniers, instant, lecture);
    // Une poignée du mode sort de la place libre : la Carte glisse pour poser le milieu du choix au milieu de la place
    // libre (pas pendant un glissé de l'élève ; une fois le doigt levé).
    const ramenerLesPoignees = (p: { cx: number; cy: number; z: number }) => {
      if (cadrage.glissant) return false;
      const libre = lirePlaceReelle(el);
      const w = Math.max(1, el.clientWidth);
      const h = Math.max(1, el.clientHeight);
      cadrage.recadrer(new THREE.Vector3(p.cx, p.z, p.cy), { x: (libre.x0 + libre.x1) / w - 1, y: 1 - (libre.y0 + libre.y1) / h });
      return true;
    };
    const amenagement = creerAmenagement(monde, reduceMotion, camera, el, lumiere, () => ecranDuModeRef.current, ramenerLesPoignees);
    world.current = {
      amenagement,
      garderEnVue: ({ rect: r, z }) => {
        const point = new THREE.Vector3((r.x0 + r.x1) / 2, z, (r.y0 + r.y1) / 2);
        const vue = el.getBoundingClientRect();
        // La hauteur réelle de la barre du mode et de sa phrase (un pli ouvert compris) : le fantôme se cadre dans la
        // bande libre entre les deux.
        const libre = lirePlaceReelle(el);
        // Une marge pour les poignées, déjà comprises dans le cadre (`garderEnVue` reçoit leur emprise) : rien au ras du bord.
        const marge = 24;
        // Les quatre coins dans la place libre : rien à faire.
        const dedans = [r.x0, r.x1].every((x) =>
          [r.y0, r.y1].every((y) => {
            const ecran = cadrage.auBut(new THREE.Vector3(x, z, y), vue.width, vue.height);
            return ecran !== null && ecran.x >= libre.x0 + marge && ecran.x <= libre.x1 - marge && ecran.y >= libre.y0 + marge && ecran.y <= libre.y1 - marge;
          }),
        );
        if (dedans) return;
        const w = Math.max(1, el.clientWidth);
        const h = Math.max(1, el.clientHeight);
        cadrage.recadrer(point, { x: (libre.x0 + libre.x1) / w - 1, y: 1 - (libre.y0 + libre.y1) / h });
      },
      camera,
      cadrage,
      bornes,
      affordance,
      etiquettes,
      personnages,
      signes: signesDesCreatures,
      cubes: cubesDuMonde,
      navire,
      // Le bouton « Recentrer » : la vue revient à son cadrage, zoom du monde compris.
      recentrer: () => recentrer(true),
      sauter: (objet) => {
        if (objet.genre === 'creature') {
          if (!reduceMotion) signesDesCreatures.rebondir(cleDeLaCreature(objet.id));
        } else if (objet.genre !== 'ile') sauterLeSigne(objet);
      },
      garderHorsDeLaFiche: (objet) => garderHorsDeLaFiche(objet),
    };
    // La scène refaite (un autre archipel, la préférence de mouvement) : le bonhomme reparaît là où il se tient. Ses
    // effets, plus bas, ne repassent qu'à un nouvel itinéraire.
    const ici = avatarRef.current;
    personnages.montrerLeBonhomme(Boolean(ici));
    if (ici?.route.length) personnages.marcher({ route: [ici.route[ici.route.length - 1]], seq: 0 });
    // Les captures (scripts/prise-de-vue.mjs) posent la caméra à son cadrage sans attendre son pas : lisible par les
    // scripts, comme le compteur de mesures.
    // `ecran` : où un point du monde (en cases) se pose dans la page, pour viser une construction à la molette.
    const pourLesCaptures = {
      poser: () => cadrage.poser(),
      ecran: (p: { x: number; y: number; z: number }) => {
        const e = cadrage.auBut(new THREE.Vector3(p.x, p.z, p.y), el.clientWidth, el.clientHeight);
        const r = el.getBoundingClientRect();
        return e ? { x: e.x + r.left, y: e.y + r.top } : null;
      },
    };
    if (import.meta.env.DEV || mesuresDemandees()) window.__dysappsCamera = pourLesCaptures;
    /** La vue déplacée, telle que la page la connaît : on ne la prévient que quand cela change. */
    let deplacee = false;
    const signaler = () => {
      const d = cadrage.decale();
      if (d === deplacee) return;
      deplacee = d;
      vueDeplaceeRef.current?.(d);
    };
    const recentrer = (aussiLeZoom = false) => {
      cadrage.recentrer(aussiLeZoom);
      signaler();
    };
    /** Ce qui bouge dans le monde, avant la caméra : le bonhomme, puis le navire (qui le fait embarquer et débarquer). */
    const deplacements: PartieDeLaScene[] = [personnages, navire];
    /** Le reste de l'image, dans cet ordre : la caméra suit ce qui a bougé ; les étiquettes se placent pour elle, en dernier. */
    const parties: PartieDeLaScene[] = [personnages, cadrage, bornes, affordance, brume, lumiere, large, navire, cubesDuMonde, rond, amenagement, signesDesCreatures, etiquettes];

    /** Un objet touché répond : la pile d'étoiles d'une borne réussie saute, sinon sa bulle rebondit, s'il en a une. */
    const sauterLeSigne = (objet: ObjetTouche) => {
      if (reduceMotion) return;
      if (objet.genre === 'borne' && bornes.sauterLaPile(objet.id)) return;
      signesDesCreatures.rebondir(cleDeLObjet(objet));
    };
    /** Le point du monde de l'objet d'une fiche : une créature là où elle se promène, sinon le centre de ses cubes. */
    const pointDeLObjet = (objet: ObjetDeLaFiche): THREE.Vector3 | null => {
      if (objet.genre === 'creature') {
        const o = personnages.creatures.children.find((c) => c.userData.creature === objet.id && c.userData.kind !== 'guardian');
        if (o) return o.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1, 0));
      }
      const c = centreDeLObjet(objet, { ...objetsRef.current, ile: islandCenter });
      return c ? new THREE.Vector3(c.x, c.z, c.y) : null;
    };
    /**
     * La fiche (`.world-fiche`, dans la scène de la page) cache-t-elle l'objet, la caméra à sa place visée, ou est-il
     * hors de la vue ? Alors le cadrage glisse pour le poser au centre de la place libre (la fiche y compte) ; sinon la
     * caméra ne bouge pas.
     */
    const garderHorsDeLaFiche = (objet: ObjetDeLaFiche) => {
      // Son cadre, médaillon compris (Blocland : le portrait déborde au-dessus d'elle).
      const feuille = el.closest('[data-scene]')?.querySelector('.world-fiche-cadre, .world-fiche');
      const point = pointDeLObjet(objet);
      if (!feuille || !point) return;
      const vue = el.getBoundingClientRect();
      const ecran = cadrage.auBut(point, vue.width, vue.height);
      const f = feuille.getBoundingClientRect();
      // Hors de la vue (« Relier », « Y aller »), il est aussi caché. Un Gardien, grand, se voit entier : son milieu à
      // plus de `MARGE_D_UN_GARDIEN` du bord de la place libre (à l'Escale, au bord de la vue de l'île, il était coupé
      // dans le coin, HG-3).
      const { libre } = lirePlaceLibre(el);
      const m = objet.genre === 'gardien' ? MARGE_D_UN_GARDIEN * Math.min(vue.width, vue.height) : 0;
      const horsDeLaVue = !ecran || (m ? ecran.x < libre.x0 + m || ecran.y < libre.y0 + m || ecran.x > libre.x1 - m || ecran.y > libre.y1 - m : ecran.x < 0 || ecran.y < 0 || ecran.x > vue.width || ecran.y > vue.height);
      if (!horsDeLaVue && !sousLaFiche(ecran, { x0: f.left - vue.left, y0: f.top - vue.top, x1: f.right - vue.left, y1: f.bottom - vue.top })) return;
      const w = Math.max(1, el.clientWidth);
      const h = Math.max(1, el.clientHeight);
      cadrage.recadrer(point, { x: ((libre.x0 + libre.x1) / w) - 1, y: 1 - (libre.y0 + libre.y1) / h });
    };
    /**
     * Le glissé est permis : la page montre « Recentrer », ni marche suivie par la caméra ni voyage en cours (le toucher
     * y change le but ou fait arriver ; une flânerie sur son île, que la caméra ne suit pas, n'empêche rien). La Carte
     * aussi se fait glisser, une fois zoomée ou à son plancher, pour l'explorer.
     */
    const glissePermis = () => Boolean(vueDeplaceeRef.current) && !voyageRef.current && !instant.marche && !instant.navigue;
    /** Le zoom est permis quand le glissé l'est, sur la Carte comme dans le monde (pas pendant que la Carte s'ouvre ou se ferme). */
    const zoomPermis = () => glissePermis() && derniers.current.carte === instant.carte;
    // Le clavier (les flèches vont à l'île voisine) et les gestes (./gestures.ts).
    const scenePourLesGestes = {
      canvas: renderer.domElement,
      camera,
      monde,
      derniers,
      personnages,
      bornes,
      navire,
      cubes: cubesDuMonde,
      affordance,
      signes: signesDesCreatures,
      etiquettes,
      cadrage,
      rappels,
      voyage: voyageRef,
      amarre: vehicleRef,
      archipel: archRef,
      tags,
      reduceMotion,
      glissePermis,
      zoomPermis,
      recentrer,
      signaler,
      sauterLeSigne,
    };
    const arreterLeClavier = ecouterLeClavier(el, scenePourLesGestes);
    const arreterLesGestes = ecouterLesGestes(scenePourLesGestes);

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      signesDesCreatures.redimensionner(h);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    // Jour et nuit : la lumière suit l'heure réelle, ajustée chaque minute (figée avec « réduire les animations »).
    lumiere.allumer(reduceMotion);

    const arreterLaBoucle = lancerLaBoucle({
      el,
      renderer,
      scene,
      camera,
      meter,
      deplacements,
      parties,
      instant,
      derniers,
      reduceMotion,
      prete: () => world.current !== null,
      signaler,
    });
    // Où se tient un objet à l'écran, la caméra posée (le vol des blocs part de la borne de la mission).
    // Rien sur la Carte ni pendant un voyage : la caméra n'est pas sur l'île, le vol part alors du centre de la scène.
    const ouEst = (objet: ObjetDeLaFiche) => {
      if (derniers.current.carte || voyageRef.current || instant.navigue) return null;
      const point = pointDeLObjet(objet);
      const vue = el.getBoundingClientRect();
      const ecran = point ? cadrage.auBut(point, vue.width, vue.height) : null;
      return ecran ? { x: vue.left + ecran.x, y: vue.top + ecran.y } : null;
    };
    if (situer) situer.current = ouEst;

    return () => {
      arreterLaBoucle();
      arreterLeClavier();
      observer.disconnect();
      arreterLesGestes();
      for (const p of parties) p.dispose();
      meter?.dispose();
      if (window.__dysappsCamera === pourLesCaptures) delete window.__dysappsCamera;
      // Le contexte WebGL est rendu tout de suite (une scène refaite à chaque pose en ouvrirait sinon plusieurs à la fois).
      renderer.forceContextLoss();
      renderer.dispose();
      renderer.domElement.remove();
      world.current = null;
      if (situer?.current === ouEst) situer.current = null;
      // La scène refaite (un autre archipel) part de son cadrage : « Recentrer » n'a plus lieu d'être.
      if (deplacee) vueDeplaceeRef.current?.(false);
    };
    // La scène est construite une fois par archipel (sa mer, sa brume, ses baleines) ; le terrain, les créatures et la
    // caméra sont mis à jour à part. Le changement d'archipel se fait derrière l'écran du voyage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, archipelago]);

  // ---- Le mode « Aménager » (GD-9) : l'ajout aux matériaux des blocs, seulement le temps que le mode est ouvert
  useEffect(() => {
    world.current?.amenagement.ouvrir(dansLeMode);
    // Reposé aussi quand la scène est refaite (un lieu posé, la préférence de mouvement).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dansLeMode, reduceMotion, archipelago]);
  // ---- Le dessin du choix, et la vue qui suit le fantôme s'il sort de l'écran
  const vueDuMode = amenager?.vue ?? null;
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    w.amenagement.poser(vueDuMode);
    // Le lieu choisi : son nom n'est écrit qu'une fois, sur son fantôme.
    w.etiquettes.cacher(vueDuMode?.lieu ?? null);
    // La vue garde à l'écran le fantôme et ses poignées sur l'eau autour de lui.
    if (vueDuMode) {
      const p = vueDuMode.poignees;
      w.garderEnVue(p ? { rect: p.emprise, z: p.z } : (vueDuMode.cadre ?? { rect: { x0: vueDuMode.suivre.x, y0: vueDuMode.suivre.y, x1: vueDuMode.suivre.x + 1, y1: vueDuMode.suivre.y + 1 }, z: vueDuMode.suivre.z }));
    }
    // Reposé aussi quand la scène est refaite (un lieu posé, la préférence de mouvement).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vueDuMode, reduceMotion, archipelago]);
  // ---- Le bouton d'une poignée touché : la poignée dessinée s'enfonce et remonte
  const touchersDuMode = amenager?.touchers;
  useEffect(() => touchersDuMode?.ecouter((cle) => world.current?.amenagement.toucher(cle)), [touchersDuMode]);
  // ---- Après une réunion : la paire et sa construction entières à l'écran (la scène est refaite, la vue les cadre)
  const cadreDuMode = amenager?.cadre ?? null;
  useEffect(() => {
    if (cadreDuMode) world.current?.garderEnVue(cadreDuMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cadreDuMode?.seq, reduceMotion, archipelago]);
  // ---- Le geste de la pose : il continue dans la scène refaite (le lieu à sa nouvelle place)
  useEffect(() => {
    world.current?.amenagement.geste(gesteDuMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gesteDuMode?.seq, gesteDuMode?.phase, reduceMotion, archipelago]);

  // ---- « Recentrer » : la vue efface son décalage, la caméra revient en douceur à son cadrage
  useEffect(() => {
    if (recentrage) world.current?.recentrer();
  }, [recentrage]);

  // ---- Le geste de pose (Blocland, world/pose.ts) : le dernier bloc d'un plan descend et s'enclenche dans sa case.
  // Avant le terrain : le terrain garde son maillage d'avant (le fantôme de la case) le temps de la descente.
  const geste = Boolean(burst?.pose) && habillageDe(rendu).pose === 'geste';
  useEffect(() => {
    const w = world.current;
    if (!w || !burst || burst.seq === 0 || !geste || reduceMotion) return;
    const { x, y, z } = burst.cell;
    const cube = cubes.find((c) => c.x === x && c.y === y && c.z === z && !c.ghost);
    // Le cube pas encore là (la scène suit d'un rendu) : les poussières, pour que la pose se voie quand même.
    if (cube) w.cubes.enclencher(cube);
    else w.cubes.eclater(burst);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burst?.seq]);

  // ---- La pose d'une partie en vague (GD-6, Blocland, world/wave.ts) : lancée une fois par `seq`, arrêtée quand la page
  // la retire (finie ou touchée). Relancée si la scène est refaite (un autre archipel, « Réduire les animations ») : la
  // partie ne reste jamais cachée, et le terrain est reposé dans le même effet (la scène neuve n'a pas encore les cubes),
  // une seule fois, avec la vague. Sur la même scène, le terrain reçu suffit : la vague lancée ou arrêtée le refait.
  const poseRef = useRef(onPose);
  poseRef.current = onPose;
  /** La scène qui a reçu le terrain : une scène refaite le reçoit de nouveau. */
  const terrainDe = useRef<object | null>(null);
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    if (pose) {
      w.cubes.lancerLaVague(pose.cubes, (moment) => poseRef.current?.(moment));
      // Les captures d'un lot tiennent la pose à un moment choisi (la ruine, le mi-fondu) ou la mènent à sa fin.
      const tenue = window.__dysappsPoseA;
      if (typeof tenue === 'number' && Number.isFinite(tenue) && (import.meta.env.DEV || mesuresDemandees())) w.cubes.tenirLaVague(tenue);
    } else w.cubes.arreterLaVague();
    // Pendant la vague, une plaque nouvelle se montre, mais les étiquettes attendent sa fin pour se replacer.
    w.signes.suivreLaVague(Boolean(pose));
    if (terrainDe.current !== w.cubes) {
      w.cubes.poser(cubes);
      terrainDe.current = w.cubes;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose?.seq, reduceMotion, archipelago]);

  // ---- Terrain : une géométrie par matériau, faces visibles seulement
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    w.cubes.poser(cubes);
    terrainDe.current = w.cubes;
  }, [cubes]);

  // ---- Créatures : un groupe chacune, positionné sur son île, animé dans la boucle
  useEffect(() => {
    world.current?.personnages.poserLesCreatures(creatures);
    // Reposées aussi quand la scène est refaite (un autre archipel, la préférence de mouvement).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creatures, reduceMotion, archipelago]);

  // ---- Les créatures qui font signe (GD-4, étape 1) : un geste à l'arrivée sur leur île, puis l'icône de la notion
  const signesKey = signes.map((x) => `${x.id}:${x.icone}:${x.bloc ?? ''}`).join('|');
  useEffect(() => {
    world.current?.signes.poser(signes);
    // La liste refaite à chaque rendu de la page : on ne repose que si elle change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signesKey, reduceMotion, archipelago]);

  // ---- Le moment du rallumage (lot 6) : la sentinelle se rallume en fondu, d'un coup avec moins d'animations
  useEffect(() => {
    world.current?.personnages.rallumer(rallumage?.id ?? null, reduceMotion ? 0 : (rallumage?.dureeMs ?? 0));
    // Un moment par `seq`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rallumage?.id, rallumage?.seq]);

  // ---- Le Bloc-Navire : la coque (tout ce qui est sous le mât) et le ballon, qui pivote au sommet du mât
  useEffect(() => {
    world.current?.navire.poser(vehicle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle, reduceMotion, archipelago]);

  // ---- Le voyage : au départ, le bonhomme marche jusqu'au pont ; à l'arrivée, il est à bord et le navire accoste
  useEffect(() => {
    world.current?.navire.voyager(voyage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voyage?.seq, voyage?.leg]);

  // ---- Ce que montre la flèche de la destination (une île, un ouvrage, ou une case du monde : le chantier du navire) ;
  // la 3D la dessine en bulle sur la Carte (three/labels.ts)
  useEffect(() => {
    world.current?.bornes.poserLaFleche(marker);
  }, [marker]);

  // ---- Blocland, sur la Carte : l'image de la bulle d'or de la prochaine destination
  const cleDeLImageDeLaCarte = imageDeLaCarte ? JSON.stringify(imageDeLaCarte) : '';
  useEffect(() => {
    world.current?.etiquettes.poserLImageDeLaCarte(imageDeLaCarte);
    // La scène refaite (mouvement réduit, archipel) repart sur l'étoile : l'image s'y repose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleDeLImageDeLaCarte, reduceMotion, archipelago]);

  // ---- Le nom des îles ouvertes (une texture par étiquette, refaite quand la liste change) ; sur la Carte, leur état
  const labelsKey = (islandLabels ?? []).map((l) => `${l.id}:${l.text}:${l.state?.id ?? ''}:${l.state?.name ?? ''}:${l.bloc ?? ''}`).join('|');
  useEffect(() => {
    const etiquettes = world.current?.etiquettes;
    if (!etiquettes) return;
    etiquettes.poser(islandLabels);
    return etiquettes.vider;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labelsKey, reduceMotion, archipelago]);

  // ---- Mode chantier : pas de case visée en dehors
  useEffect(() => {
    world.current?.cubes.viser(null);
  }, [Boolean(build)]);

  // ---- À la pose d'un bloc : trois poussières claires qui montent doucement, sans partir en tous sens (sauf au geste
  // de pose de Blocland, sans poussière)
  useEffect(() => {
    const w = world.current;
    if (!w || !burst || burst.seq === 0 || reduceMotion || geste) return;
    w.cubes.eclater(burst);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burst?.seq]);

  // ---- Le bonhomme : ses cubes (une fois), puis chaque itinéraire
  useEffect(() => {
    world.current?.personnages.montrerLeBonhomme(Boolean(avatar));
  }, [Boolean(avatar)]);
  useEffect(() => {
    const w = world.current;
    if (!w || !avatar || !avatar.route.length) return;
    w.personnages.marcher(avatar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatar?.seq]);

  // ---- Les repères des bornes de mission : les étoiles gagnées en petits cubes d'or empilés (une borne à faire porte sa
  // bulle, plus bas). Rien sur une île fermée.
  const sommets = useMemo(() => sommetsDesBornes(cubes), [cubes]);
  useEffect(() => {
    world.current?.bornes.poserLesMissions(quests, sommets);
    // Refaits aussi quand la scène l'est (un autre archipel, la préférence de mouvement).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quests, sommets, reduceMotion, archipelago]);

  // ---- Les objets touchables (world/affordance.ts) : leurs zones de toucher, et une bulle au-dessus de ceux
  // qui sont à faire (trois au plus sur l'île où l'on est, la prochaine chose à faire mise en avant).
  const signesDuMonde = useMemo(
    () => signesDesObjets({ cubes, quests, creatures, vehicle, etats: etatsDesObjets }),
    [cubes, quests, creatures, vehicle, etatsDesObjets],
  );
  useEffect(() => {
    world.current?.affordance.poser(signesDuMonde);
    world.current?.signes.poserLesObjets(signesDuMonde, prochaine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signesDuMonde, prochaine, reduceMotion, archipelago]);

  // ---- Le chemin à construire (sur la Carte) : une balise toutes les trois cases, au-dessus du sol.
  useEffect(() => {
    world.current?.bornes.poserLeChemin(trail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trail, reduceMotion, archipelago]);

  // ---- La fiche ouverte (lot 2 de « Toucher le monde ») : son signe saute s'il n'a pas été touché ; une fois la fiche
  // posée (deux images), l'objet qu'elle cacherait est recadré dans la place libre.
  useEffect(() => {
    const w = world.current;
    if (!w || !fiche) return;
    if (fiche.saut) w.sauter(fiche.objet);
    let image = requestAnimationFrame(() => {
      image = requestAnimationFrame(() => world.current?.garderHorsDeLaFiche(fiche.objet));
    });
    return () => cancelAnimationFrame(image);
    // Une fois par fiche ouverte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fiche?.seq]);

  // ---- Caméra : l'île demandée (ou le bonhomme) est rejointe en douceur par la boucle ; au premier cadrage, d'un coup.
  useEffect(() => {
    const w = world.current;
    if (!w || focus.seq !== 0) return;
    w.cadrage.cadrer(focus, Boolean(map), home ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus.island, focus.seq]);

  return (
    <div ref={host} className={`voxel-canvas ${className ?? ''}`.trim()} data-rendu={rendu} role="img" aria-label={`${label}. ${onVueDeplacee ? 'Faire glisser pour explorer. ' : ''}Au clavier : les flèches vont à l'île voisine${map || onVueDeplacee ? ' ; les touches plus et moins rapprochent ou éloignent la vue' : ''}.`} />
  );
}
