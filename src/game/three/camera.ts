// La caméra de la scène 3D : gérée par l'application (pas de rotation ; on touche une île pour y aller).
// Elle rejoint en douceur sa place : le navire en route, le bonhomme qui marche, l'île ouverte, sinon le bonhomme.
// L'élève peut faire glisser la vue à plat pour explorer (./drag.ts) : un décalage s'ajoute à ce cadrage, borné à
// l'archipel, et s'efface dès que l'application reprend la main (une île touchée, la Carte, une marche, un voyage).
// L'élève peut aussi zoomer (pincer, molette, touches + et −, `zoomer`). Sur la Carte : de l'archipel entier, son
// cadrage d'ouverture, jusqu'à deux îles environ ; effacé à sa fermeture. Dans le monde : un peu plus loin ou bien
// plus près que le cadrage (`ZOOM_DU_MONDE`), gardé d'une île à l'autre jusqu'à « Recentrer ».
// Les cadrages (les vues, la Carte, la traversée) sont dans ./camera/framings.ts ; ce fichier garde la caméra qui les
// suit, et en réexporte les noms publics.
import * as THREE from 'three';
import type { Derniers, Instant, Monde, PartieDeLaScene } from './scenePart';
import type { BiomeId } from '../biomes';
import { type PlaceLue, RESERVE_DU_BAS } from '../freeSpace';
import { bornesDansLeMonde, type CadreDeCases, islandCenter, viewYaw, viewZone, VISEE_AU_DESSUS_DU_SOL, worldBounds } from '../world/terrain';
import { CADRAGE_DU_REPERE, repereDeLaVue } from '../world/framing';
import { mapOf } from '../world/map';
import { layoutVersion } from '../world/placement';
import { bornerLeDecalage, type Decalage, estDecale } from './drag';
import { cadrageDeLaCarte, cadrageDeLaTraversee, type CadrageDesBornes, cadrerLesBornes, cleDeLaDestination, decalagePourViser, ECHELLE_MIN_DE_LA_TRAVERSEE, FOLLOW_DISTANCE, FOLLOW_MAX, HAUTEUR_DE_TABLETTE, ISLAND_DISTANCE, ISLAND_VIEW, LARGEUR_D_UNE_ILE, type LectureDeLaCarte, PAS, VIEW, VISEE, VOYAGE_VIEW, ZOOM_DE_LA_CARTE, ZOOM_DU_MONDE } from './camera/framings';
export { AUTOUR_DE_LA_DESTINATION, BORNES_AU_TELEPHONE, cadrageDeLaCarte, cadrageDeLaTraversee, decalagePourViser, ECHELLE_MIN_DE_LA_TRAVERSEE, ISLAND_VIEW, type LectureDeLaCarte, PLANCHER_DE_LA_CARTE, ZOOM_DU_MONDE } from './camera/framings';

declare global {
  interface Window {
    /** La caméra, pour les captures (en développement, ou avec `?mesures`) : voir `Camera.poser`. */
    __dysappsCamera?: { poser(): number; ecran(p: { x: number; y: number; z: number }): { x: number; y: number } | null };
    /**
     * Pour les captures d'un lot (scripts/rendu/mesures.mjs, `poseA`, avec `?mesures`) : la pose d'une partie tenue à
     * cette part de sa durée dès son lancement (three/cubes.ts, `tenirLaVague`).
     */
    __dysappsPoseA?: number;
    /**
     * Pour les captures (en développement, ou avec `?mesures`) : le geste de la pose du mode « Aménager » tenu à ce
     * moment de son démontage, en ms (Arranging.tsx ne passe pas au remontage ; ./arrange.ts lit l'heure tenue).
     */
    __dysappsGesteA?: number;
  }
}

export interface Camera extends PartieDeLaScene {
  /** Là où la caméra regarde en ce moment (les flèches du clavier cherchent l'île voisine depuis ce point). */
  cible: THREE.Vector3;
  /** Au premier cadrage : la caméra y est d'un coup. */
  cadrer(focus: Derniers['focus'], carte: boolean, home: BiomeId | null): void;
  /**
   * Fait glisser la vue de (`dx`, `dz`) cases sur le plan horizontal, borné à l'archipel : la caméra y est tout de suite
   * (la vue suit le doigt), et sa place visée aussi. Le nord, la hauteur et la direction de vue ne changent pas.
   */
  glisser(dx: number, dz: number): void;
  /**
   * Remet le décalage à zéro : la caméra revient en douceur à son cadrage (d'un coup, avec moins d'animations). Le zoom
   * du monde n'est effacé qu'avec `aussiLeZoom` (le bouton « Recentrer »), et hors de la Carte : toucher une cible le
   * garde, et « Recentrer » sur la Carte ne remet que la Carte.
   */
  recentrer(aussiLeZoom?: boolean): void;
  /** La vue a été déplacée (un décalage non nul) ou zoomée (sur la Carte, seul son zoom compte, pas celui du monde). */
  decale(): boolean;
  /** Le décalage de la vue glissée, en cases sur le plan horizontal (zéro : la vue à son cadrage). */
  decalage(): Readonly<{ x: number; z: number }>;
  /**
   * Rapproche (`facteur` > 1) ou éloigne la vue. Sur la Carte, borné entre le cadrage d'ouverture et deux îles environ
   * (`ZOOM_DE_LA_CARTE`) ; dans le monde, entre les bornes de `ZOOM_DU_MONDE` (pas pendant un voyage ni une traversée
   * au cadre fixe). Le point du sol vu en `vers` (coordonnées normalisées de l'écran, −1 à 1) reste sous le doigt ; la
   * caméra y est tout de suite. Ni le nord, ni la direction de vue ne changent. Rend vrai si la vue a changé.
   */
  zoomer(facteur: number, vers: { x: number; y: number }): boolean;
  /**
   * Pour les captures : met la caméra d'un coup à son cadrage de la dernière image, sans attendre son pas, et rend
   * l'écart qu'il restait (infini avant la première image). Deux appels de suite qui rendent presque zéro : le cadrage
   * ne bouge plus.
   */
  poser(): number;
  /**
   * Un glissé est en cours : les étiquettes gardent l'écart calculé au début (pas de nouveau calcul à chaque image) ;
   * elles le refont une fois le doigt levé.
   */
  glissant: boolean;
  /**
   * Où ce point du monde se pose à l'écran (pixels CSS d'une vue `W` × `H`), la caméra à sa place visée (pas celle où
   * elle est en chemin) ; `null` avant la première image ou derrière la caméra.
   */
  auBut(point: THREE.Vector3, W: number, H: number): { x: number; y: number } | null;
  /**
   * La fiche d'un objet le cache (lot 2 de « Toucher le monde ») : le cadrage glisse à plat pour que ce point du monde se
   * pose en `vers` (coordonnées normalisées de l'écran, −1 à 1), sans changer de distance ni de direction. Effacé quand
   * l'application reprend la main (une île, la Carte, une marche, un voyage). Sur la Carte (le mode « Aménager »), la
   * Carte glisse une fois de ce qu'il faut, comme sous le doigt, zoom gardé.
   */
  recadrer(point: THREE.Vector3, vers: { x: number; y: number }): void;
}

/**
 * La caméra de la scène ; `carte` : ce qu'elle lit pour cadrer la Carte (la place libre, la destination). Sans elle (un
 * test), la vue d'une tablette moins la bande du bas, sans destination.
 */
export function creerCamera(
  monde: Monde,
  camera: THREE.PerspectiveCamera,
  avatar: THREE.Object3D,
  derniers: { readonly current: Derniers },
  instant: Instant,
  carte: LectureDeLaCarte | null = null,
): Camera {
  const reperes = monde.habillage.reperes === 'cadres';
  /** Combien de fois la Carte s'est ouverte : à chaque ouverture, la place libre est relue. */
  let ouvertures = 0;
  let surLaCarte = false;
  let contexte = { ouvertures: -1, destination: '', cle: '' };
  let cadrageCarte: { lue: PlaceLue | null; destination: string; bonhomme: BiomeId | null; region: boolean; aspect: number; target: THREE.Vector3; pos: THREE.Vector3; echelle: number; zoomMax: number } | null = null;
  /**
   * Le cadrage de la Carte, recalculé seulement quand la place libre lue (le même objet tant qu'elle ne change pas) ou
   * la destination changent (pas image par image). `saut` : sans mouvement.
   */
  const laCarte = (aspect: number) => {
    if (!surLaCarte) ouvertures++;
    surLaCarte = true;
    const destination = carte?.destination() ?? null;
    const cle = cleDeLaDestination(destination);
    if (contexte.ouvertures !== ouvertures || contexte.destination !== cle) contexte = { ouvertures, destination: cle, cle: `${ouvertures}|${cle}` };
    const lue = carte?.place(contexte.cle) ?? null;
    // Le cadre de la région entière dans le mode « Aménager » (les places libres s'y voient) ; sinon, les lieux
    // d'aujourd'hui, et au plancher l'île du bonhomme avec la destination (`cadrageDeLaCarte`).
    const bonhomme = derniers.current.home;
    const region = derniers.current.amenager !== 'non';
    if (!cadrageCarte || cadrageCarte.lue !== lue || cadrageCarte.destination !== cle || cadrageCarte.bonhomme !== bonhomme || cadrageCarte.region !== region || (!lue && cadrageCarte.aspect !== aspect)) {
      // Sans lecture (un test) : une vue de tablette, moins la bande des boutons du bas.
      const w = lue ? Math.max(1, lue.w) : HAUTEUR_DE_TABLETTE * aspect;
      const h = lue ? Math.max(1, lue.h) : HAUTEUR_DE_TABLETTE;
      const libre = lue?.libre ?? { x0: 0, y0: 0, x1: w, y1: h - RESERVE_DU_BAS };
      const c = cadrageDeLaCarte(monde.archipel, destination, w, h, libre, { bonhomme, region });
      // Au plus près, une île remplit la moitié du petit côté de la place libre (`ZOOM_DE_LA_CARTE` ; jamais moins près qu’à l’ouverture).
      const cote = Math.max(1, Math.min(libre.x1 - libre.x0, libre.y1 - libre.y0));
      const zoomMax = Math.max(1, (ZOOM_DE_LA_CARTE.ile * cote) / (LARGEUR_D_UNE_ILE * c.echelle));
      cadrageCarte = { lue, destination: cle, bonhomme, region, aspect, ...c, zoomMax };
    }
    return { target: cadrageCarte.target, pos: cadrageCarte.pos, saut: lue?.saut ?? false };
  };
  /**
   * Où la caméra veut être : sur l'île ouverte (vue rapprochée), sinon autour du bonhomme. La caméra est gérée par
   * l'application : pas de rotation ; on touche une île pour y aller, ou on fait glisser la vue (le décalage, et sur la
   * Carte le zoom, s'ajoutent après, dans `animer`). En portrait, un peu plus loin pour que tout tienne dans la largeur.
   */
  const framing = (
    island: BiomeId | null,
    avatarAt: THREE.Vector3,
    aspect: number,
    onMap = false,
    zone: BiomeId | null = null,
    spot: { x: number; y: number; z: number } | null = null,
  ) => {
    // La Carte : l'archipel entier dans la place libre, ou au plancher la destination en son centre (DA-31).
    if (onMap) return laCarte(aspect);
    surLaCarte = false;
    const portrait = aspect < 1 ? 1 / Math.sqrt(Math.max(0.4, aspect)) : 1;
    const avatar = { x: avatarAt.x, y: avatarAt.z, z: avatarAt.y };
    let c = spot ?? (island ? islandCenter(island) : avatar);
    let d = (island ? ISLAND_DISTANCE : FOLLOW_DISTANCE) * portrait;
    const v = island ? ISLAND_VIEW : VIEW;
    // Bonhomme posé sur son île : on cadre la zone (son île et ses voisines), le bonhomme restant au premier tiers.
    if (!island && zone) {
      const z = viewZone(zone);
      const zc = { x: (z.minX + z.maxX) / 2, y: (z.minY + z.maxY) / 2 };
      const home = islandCenter(zone);
      c = { x: (home.x * 2 + zc.x) / 3, y: (home.y * 2 + zc.y) / 3, z: home.z };
      const ex = z.maxX - z.minX;
      const ey = z.maxY - z.minY;
      const need = (Math.max(ex / Math.max(0.6, aspect), ey * 1.1) * 0.5) / Math.tan((20 * Math.PI) / 180);
      d = Math.min(FOLLOW_MAX, Math.max(FOLLOW_DISTANCE, need * 0.8)) * portrait;
    }
    // Archipéo : un grand repère de la vue (le grand phare des Îles du Ciel) reste dans le cadre : la cible glisse vers
    // lui et la caméra recule un peu (world/framing.ts). Pas sur une place précise de l'île (`spot`).
    const repere = reperes && !spot && (island || zone) ? repereDeLaVue(island, island ? null : zone) : null;
    let pivot = 0;
    if (repere) {
      // Depuis l'île même du repère, ou une île d'où la vue pivote pour lui (world/framing.ts), la cible ne glisse pas :
      // le pivot suffit, et l'île de la vue reste au premier plan.
      const pivote = zone !== null && (zone === repere.ile || repere.pivot?.[zone] !== undefined);
      const k = island ? CADRAGE_DU_REPERE.ile : pivote ? null : CADRAGE_DU_REPERE.zone;
      if (k) {
        c = { x: c.x + k.vers * (repere.x - c.x), y: c.y + k.vers * (repere.y - c.y), z: c.z };
        d *= k.recul;
      }
      if (!island && zone) pivot = repere.pivot?.[zone] ?? 0;
    }
    // Le pivot vers le cœur du continent : la direction de vue tourne autour de la verticale.
    // (pivot positif : la caméra passe à l'ouest et regarde vers l'est, d'où le signe).
    const yaw = -(island ? viewYaw(island) : zone ? viewYaw(zone) : 0) + pivot;
    const dx = v.dx * Math.cos(yaw) - v.dy * Math.sin(yaw);
    const dy = v.dx * Math.sin(yaw) + v.dy * Math.cos(yaw);
    const target = new THREE.Vector3(c.x, c.z + VISEE_AU_DESSUS_DU_SOL, c.y);
    const pos = new THREE.Vector3(c.x + d * dx, c.z + VISEE_AU_DESSUS_DU_SOL + d * v.up, c.y + d * dy);
    // Au téléphone en portrait, les bornes de l'île (ou de celle du bonhomme) et leur bulle tiennent dans la vue : le
    // cadrage glisse de côté, ou recule, juste ce qu'il faut (GD-14, `cadrerLesBornes`). Pas sur une place précise.
    const ileDesBornes = spot ? null : (island ?? zone);
    if (ileDesBornes) {
      const r = bornesCadrees(ileDesBornes, island !== null, target, pos, aspect);
      if (r.recul !== 1) pos.sub(target).multiplyScalar(r.recul).add(target);
      target.add(r.glisse);
      pos.add(r.glisse);
    }
    return { target, pos };
  };

  /**
   * Le cadrage des bornes au téléphone (`cadrerLesBornes`), gardé tant que ni l'île, ni la vue (île ou bonhomme), ni la
   * taille de la vue, ni la disposition ne changent : pas recalculé image par image.
   */
  let cadrageDesBornes: { id: BiomeId; ile: boolean; version: number; w: number; h: number; fov: number; r: CadrageDesBornes } | null = null;
  const bornesCadrees = (id: BiomeId, ile: boolean, target: THREE.Vector3, pos: THREE.Vector3, aspect: number): CadrageDesBornes => {
    // Sans taille de la vue (un test), une vue de tablette de cet aspect.
    const h = carte?.vue?.h || HAUTEUR_DE_TABLETTE;
    const w = carte?.vue?.w || h * aspect;
    const version = layoutVersion();
    const c = cadrageDesBornes;
    if (c && c.id === id && c.ile === ile && c.version === version && c.w === w && c.h === h && c.fov === camera.fov) return c.r;
    const r = cadrerLesBornes(target, pos, bornesDansLeMonde(id), w, h, camera.fov);
    cadrageDesBornes = { id, ile, version, w, h, fov: camera.fov, r };
    return r;
  };

  /**
   * Une longue traversée (GD-7) : la caméra se pose sur tout le trajet, du départ à l'arrivée, dans la place libre de la
   * vue (comme la Carte, DA-31), et ne bouge plus ; le bonhomme traverse le cadre. Calculé une fois par traversée : rien
   * n'est recalculé ni alloué tant que le cadre (le même objet), la place lue et l'aspect ne changent pas. Si le trajet
   * entier ne tient qu'en trop petit (`ECHELLE_MIN_DE_LA_TRAVERSEE`, un téléphone) : `null`, la caméra suit le bonhomme.
   */
  const altitude = mapOf(monde.archipel)[0]?.altitude ?? 0;
  let cadreFixe: { cadre: CadreDeCases; lue: PlaceLue | null; aspect: number; contexte: string; target: THREE.Vector3; pos: THREE.Vector3; echelle: number } | null = null;
  let traversees = 0;
  const traversee = (z: CadreDeCases, aspect: number) => {
    // Une nouvelle traversée : la place libre est relue (un autre contexte), une fois.
    const contexte = cadreFixe?.cadre === z ? cadreFixe.contexte : `traversee|${++traversees}`;
    const lue = carte?.place(contexte) ?? null;
    if (!cadreFixe || cadreFixe.cadre !== z || cadreFixe.lue !== lue || cadreFixe.aspect !== aspect) {
      const w = lue ? Math.max(1, lue.w) : HAUTEUR_DE_TABLETTE * aspect;
      const h = lue ? Math.max(1, lue.h) : HAUTEUR_DE_TABLETTE;
      const libre = lue?.libre ?? { x0: 0, y0: 0, x1: w, y1: h - RESERVE_DU_BAS };
      cadreFixe = { cadre: z, lue, aspect, contexte, ...cadrageDeLaTraversee(z, altitude, w, h, libre, camera.fov) };
    }
    return cadreFixe.echelle >= ECHELLE_MIN_DE_LA_TRAVERSEE ? cadreFixe : null;
  };

  const camTarget = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const { but } = instant;
  const etendue = worldBounds(monde.archipel);
  /** Le décalage de l'élève (glissé), et celui que voient les étiquettes (gelé pendant un glissé). */
  const decalage: Decalage = { x: 0, z: 0 };
  const decalageDuBut: Decalage = { x: 0, z: 0 };
  /** La cible du cadrage géré, sans décalage, à la dernière image : le bornage se fait autour d'elle. */
  const base: Decalage = { x: 0, z: 0 };
  /** La place visée à cette image, décalage compris (sans allocation : le cadrage de la Carte est gardé tel quel). */
  const vise = new THREE.Vector3();
  const place = new THREE.Vector3();
  /** Ce qui, en changeant, rend la main à l'application : la demande de cadrage, la Carte ouverte ou fermée. */
  const demande = { seq: -1, ile: null as BiomeId | null, carte: false };
  /** Le décalage voulu par un glissé, avant bornage (gardé d'un appel à l'autre : pas d'allocation). */
  const voulu: Decalage = { x: 0, z: 0 };
  /**
   * Le zoom de la Carte : 1 au cadrage d'ouverture, plus grand en se rapprochant (la distance à la cible est divisée
   * d'autant). Celui du monde, de même autour du cadrage, gardé quand l'application reprend la main. Et celui que voient
   * les étiquettes (gelé pendant un geste, comme le décalage).
   */
  let zoom = 1;
  let zoomDuMonde = 1;
  let zoomDuBut = 1;
  /** À la dernière image, la vue était celle du monde (ni la Carte, ni un voyage, ni une traversée au cadre fixe). */
  let dansLeMonde = false;
  const zero = () => {
    decalage.x = 0;
    decalage.z = 0;
    zoom = 1;
  };
  /** Les points du sol sous le doigt, avant et après un zoom (alloués une fois). */
  const avantLeZoom = new THREE.Vector3();
  const apresLeZoom = new THREE.Vector3();
  /** Le point du plan horizontal de la cible vu en `vers` par la caméra, dans `out` ; faux à l'horizon. */
  const solVu = (vers: { x: number; y: number }, out: THREE.Vector3): boolean => {
    camera.updateMatrixWorld();
    rayon.setFromCamera(VISEE.set(vers.x, vers.y), camera);
    const { origin: o, direction: d } = rayon.ray;
    if (Math.abs(d.y) < 1e-6) return false;
    const t = (camTarget.y - o.y) / d.y;
    if (t <= 0) return false;
    out.set(o.x + d.x * t, camTarget.y, o.z + d.z * t);
    return true;
  };
  /** Le cadrage a été calculé au moins une fois (`vise` et `place` le tiennent). */
  let vu = false;
  /** Le recadrage d'une fiche (`recadrer`) : le point à poser, et où ; effacé quand l'application reprend la main. */
  let recadre: { point: THREE.Vector3; vers: { x: number; y: number } } | null = null;
  /** Une caméra et un rayon de travail, pour le recadrage d'une fiche (alloués une fois). */
  const essai = new THREE.PerspectiveCamera();
  const rayon = new THREE.Raycaster();
  const glissement = new THREE.Vector3();
  const projete = new THREE.Vector3();
  const essaiCible = new THREE.Vector3();
  const essaiPlace = new THREE.Vector3();
  /** Place la caméra de travail en `pos`, regardant `target`, comme la vraie. */
  const placerLEssai = (target: THREE.Vector3, pos: THREE.Vector3) => {
    essai.fov = camera.fov;
    essai.aspect = camera.aspect;
    essai.near = camera.near;
    essai.far = camera.far;
    essai.updateProjectionMatrix();
    essai.position.copy(pos);
    essai.lookAt(target);
    essai.updateMatrixWorld();
  };

  const self: Camera = {
    cible: camTarget,
    glissant: false,
    cadrer: (focus, carteOuverte, home) => {
      const { target, pos } = framing(focus.island, avatar.position, camera.aspect, carteOuverte, home, focus.spot ?? null);
      zero();
      camTarget.copy(target);
      camPos.copy(pos);
      camera.position.copy(pos);
      camera.lookAt(target);
    },
    glisser: (dx, dz) => {
      voulu.x = decalage.x + dx;
      voulu.z = decalage.z + dz;
      bornerLeDecalage(base, voulu, etendue, voulu);
      const fait = { x: voulu.x - decalage.x, z: voulu.z - decalage.z };
      decalage.x = voulu.x;
      decalage.z = voulu.z;
      // La caméra suit le doigt tout de suite, sans attendre son pas : le point du sol saisi reste sous le doigt.
      camTarget.x += fait.x;
      camTarget.z += fait.z;
      camPos.x += fait.x;
      camPos.z += fait.z;
      camera.position.copy(camPos);
      camera.lookAt(camTarget);
      camera.updateMatrixWorld();
    },
    recentrer: (aussiLeZoom = false) => {
      zero();
      if (aussiLeZoom && !instant.carte) zoomDuMonde = 1;
    },
    decale: () => estDecale(decalage) || zoom > 1 + 1e-6 || (!instant.carte && Math.abs(zoomDuMonde - 1) > 1e-6),
    decalage: () => decalage,
    zoomer: (facteur, vers) => {
      if (!(facteur > 0)) return false;
      const surLaCarte = instant.carte;
      if (surLaCarte ? !cadrageCarte : !dansLeMonde) return false;
      const actuel = surLaCarte ? zoom : zoomDuMonde;
      const min = surLaCarte ? 1 : ZOOM_DU_MONDE.loin;
      const max = surLaCarte && cadrageCarte ? cadrageCarte.zoomMax : ZOOM_DU_MONDE.pres;
      const voulu = Math.min(max, Math.max(min, actuel * facteur));
      if (Math.abs(voulu - actuel) < 1e-9) return false;
      const saisi = solVu(vers, avantLeZoom);
      // La caméra avance (ou recule) vers sa cible tout de suite, sans attendre son pas : la vue suit les doigts.
      const k = actuel / voulu;
      camPos.sub(camTarget).multiplyScalar(k).add(camTarget);
      if (surLaCarte) zoom = voulu;
      else zoomDuMonde = voulu;
      camera.position.copy(camPos);
      camera.lookAt(camTarget);
      // Le point saisi revient sous le doigt : la vue glisse à plat d'autant.
      if (saisi && solVu(vers, apresLeZoom)) self.glisser(avantLeZoom.x - apresLeZoom.x, avantLeZoom.z - apresLeZoom.z);
      else camera.updateMatrixWorld();
      return true;
    },
    auBut: (point, W, H) => {
      if (!vu) return null;
      placerLEssai(but.target, but.pos);
      projete.copy(point).project(essai);
      if (projete.z > 1) return null;
      return { x: ((projete.x + 1) / 2) * W, y: ((1 - projete.y) / 2) * H };
    },
    recadrer: (point, vers) => {
      recadre = { point: point.clone(), vers: { ...vers } };
    },
    poser: () => {
      if (!vu) return Infinity;
      const ecart = camTarget.distanceTo(vise) + camPos.distanceTo(place);
      camTarget.copy(vise);
      camPos.copy(place);
      camera.position.copy(camPos);
      camera.lookAt(camTarget);
      return ecart;
    },
    animer: (_t, _dt, reduit) => {
      if (!instant.carte) surLaCarte = false;
      const sailing = instant.navigue;
      const walking = instant.marche;
      const { focus, home, carte: carteDemandee } = derniers.current;
      // L'application reprend la main : une nouvelle demande de cadrage, la Carte ouverte ou fermée, une marche, un voyage.
      const ile = focus.island ?? null;
      if (focus.seq !== demande.seq || ile !== demande.ile || carteDemandee !== demande.carte || sailing || walking) {
        zero();
        recadre = null;
      }
      demande.seq = focus.seq;
      demande.ile = ile;
      demande.carte = carteDemandee;
      // Une longue traversée : le cadre fixe, s'il tient à une taille lisible ; sinon la caméra suit le bonhomme.
      // Une liaison montrée depuis un autre départ (GD-9, « Partir d'une autre île ») : le même cadre fixe, au-dessus de
      // la fiche ; d'un coup quand l'appareil demande moins d'animations (`reduit`).
      const choisie = !sailing && !walking && !instant.carte ? derniers.current.cadreDeLaLiaison : null;
      const fixe = !sailing && walking && instant.traversee ? traversee(instant.traversee, camera.aspect) : choisie ? traversee(choisie, camera.aspect) : null;
      // En mer (ou dans les airs) : vue de côté sur le navire, la caméra s'écarte à mesure qu'il s'éloigne.
      const frame = sailing
        ? (() => {
            const dist = sailing.stage === 1 ? 22 + 12 * sailing.k : sailing.stage === 2 ? 22 + 26 * sailing.k : 26;
            const target = new THREE.Vector3(sailing.at.x + 2.5, sailing.at.y + (sailing.stage === 3 ? 4 : 1), sailing.at.z + 5);
            const len = Math.hypot(VOYAGE_VIEW.dx, VOYAGE_VIEW.dy, VOYAGE_VIEW.up);
            const pos = new THREE.Vector3(target.x + (dist * VOYAGE_VIEW.dx) / len, target.y + (dist * VOYAGE_VIEW.up) / len, target.z + (dist * VOYAGE_VIEW.dy) / len);
            return { target, pos };
          })()
        : fixe ??
          framing(
            walking ? null : focus.island,
            avatar.position,
            camera.aspect,
            instant.carte,
            walking ? null : home,
            walking ? null : (focus.spot ?? null),
          );
      // Le cadrage de la Carte est gardé d'une image à l'autre : le décalage s'ajoute à une copie.
      const target = vise.copy(frame.target);
      const pos = place.copy(frame.pos);
      // Une fiche cachait son objet : le cadrage glisse à plat pour le poser dans la place libre.
      if (recadre && !sailing && !fixe && !instant.carte) {
        placerLEssai(target, pos);
        decalagePourViser(essai, recadre.point, recadre.vers, glissement, rayon);
        target.add(glissement);
        pos.add(glissement);
      }
      // Le zoom rapproche la caméra de sa cible (la vue de l'élève, et celle que voient les étiquettes) : celui de la
      // Carte sur la Carte, celui du monde dans le monde ; ni l'un ni l'autre pendant un voyage ou une traversée fixe.
      const surLaCarteIci = instant.carte && !sailing && !fixe;
      dansLeMonde = !instant.carte && !sailing && !fixe;
      // Hors de la Carte, son zoom s'efface ; sur la Carte, la borne de près suit la place libre (la taille du texte a changé).
      if (!surLaCarteIci) zoom = 1;
      else if (cadrageCarte && zoom > cadrageCarte.zoomMax) zoom = cadrageCarte.zoomMax;
      const zoomVu = surLaCarteIci ? zoom : dansLeMonde ? zoomDuMonde : 1;
      if (!self.glissant) zoomDuBut = zoomVu;
      const kDuBut = 1 / zoomDuBut;
      const kVu = 1 / zoomVu;
      base.x = target.x;
      base.z = target.z;
      // Sur la Carte, le mode « Aménager » garde le fantôme dans la bande libre (`recadrer`) : la Carte glisse une fois,
      // comme sous le doigt, d'après la vue visée (zoom et glissement compris), puis l'élève la reprend.
      if (recadre && surLaCarteIci) {
        essaiCible.set(target.x + decalage.x, target.y, target.z + decalage.z);
        essaiPlace.set(target.x + (pos.x - target.x) * kVu + decalage.x, target.y + (pos.y - target.y) * kVu, target.z + (pos.z - target.z) * kVu + decalage.z);
        placerLEssai(essaiCible, essaiPlace);
        decalagePourViser(essai, recadre.point, recadre.vers, glissement, rayon);
        decalage.x += glissement.x;
        decalage.z += glissement.z;
        recadre = null;
      }
      // La place visée a pu bouger (la vue a changé de taille) : le décalage reste dans l'archipel.
      bornerLeDecalage(base, decalage, etendue, decalage);
      if (!self.glissant) {
        decalageDuBut.x = decalage.x;
        decalageDuBut.z = decalage.z;
      }
      but.target.set(target.x + decalageDuBut.x, target.y, target.z + decalageDuBut.z);
      but.pos.set(target.x + (pos.x - target.x) * kDuBut + decalageDuBut.x, target.y + (pos.y - target.y) * kDuBut, target.z + (pos.z - target.z) * kDuBut + decalageDuBut.z);
      pos.sub(target).multiplyScalar(kVu).add(target);
      target.x += decalage.x;
      target.z += decalage.z;
      pos.x += decalage.x;
      pos.z += decalage.z;
      vu = true;
      const k = reduit ? 1 : 1 - Math.exp(-PAS * 3.5);
      // La taille du texte a changé sur la Carte : la caméra se recadre d'un coup, sans mouvement.
      const saut = 'saut' in frame && frame.saut;
      if (saut || (camTarget.lengthSq() === 0 && camPos.lengthSq() === 0)) {
        camTarget.copy(target);
        camPos.copy(pos);
      } else {
        camTarget.lerp(target, k);
        camPos.lerp(pos, k);
      }
      camera.position.copy(camPos);
      camera.lookAt(camTarget);
      // Le monde vu de plus loin que son cadrage : la brume recule d'autant (./mist.ts).
      instant.recul = zoomVu < 1 ? camPos.distanceTo(camTarget) * (1 - zoomVu) : 0;
    },
    dispose: () => {},
  };
  return self;
}
