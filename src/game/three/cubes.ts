// Les cubes de la scène 3D : le monde en blocs (une géométrie par matériau, faces visibles seulement) ; dans Archipéo,
// le sol et la roche en facettes (lot R2) et le décor en primitives (lot R4), le reste en cubes. Aussi la case visée en
// chantier, les éclats (la poussière d'un bloc posé, l'écume du navire) et, dans Blocland, le geste de pose (le dernier
// bloc d'un plan descend et s'enclenche, world/pose.ts) et la pose d'une partie du bâtiment en vague (GD-6, world/wave.ts) ;
// dans Archipéo, la même pose en fondu, de la pierre des ruines à la couleur du plan (world/fadeMesh.ts).
import * as THREE from 'three';
import type { VoxelCube } from '../Voxel';
import type { BiomeId } from '../biomes';
import { caseDuDecor, maillageDuDecor, rangerLeDecor, signatureDuDecor } from '../world/decorMesh';
import { champDuSol, landMesh, pickCell, poseDuDecor, signatureDuChamp, type ChampDuSol } from '../world/landMesh';
import { cacheDeLaConstruction, caseDeLaConstruction, caseDeLaPiece, construireParIle, couleursDesRoles, miseBoutABout, piliersDe, type MaillageDeLaConstruction, sansToursDuCoeur } from '../world/construction';
import { modelerLeSol } from '../world/drawnModel';
import { buildMesh, type MeshOptions } from '../world/mesher';
import { hiddenBottomLevel } from '../world/sea';
import { gesteFini, hauteurDuGeste } from '../world/pose';
import { avanceeDuFondu, couchesPosees, cubesPartis, hauteurDansLaVague, planDeLaVague, type PlanDeLaVague } from '../world/wave';
import { maillageAvecLaVague, vagueEnBlocs, type QueueDeLaVague } from '../world/waveMesh';
import { blockRegions, buildBlockMesh, buildRegionMesh, chunkTouches } from '../world/blockMesh';
import { couleurDuFondu, maillageDuFondu, type FonduDeLaPose } from '../world/fadeMesh';
import type { EnCasesDuMonde } from '../world/view';
import { styleDuMonde } from '../rendering';
import { creerPiliers } from './markers';
import { creerConstruction, creerMateriaux, type MateriauxDeConstruction } from './construction';
import { creerDecor } from './decor';
import { WATER_LEVEL, type Large } from './offshore';
import { creerLueurs } from './lanternGlow';
import { AMBIENCE } from '../world/daylight';
import type { Lumiere } from './light';
import { blockMeshOf, meshOf } from './meshes';
import { modeOuvertDansLesMateriaux, suivreLeMode, suivreLesZonesSoulevees, zonesSouleveesDuMode } from './arrange';
import type { Instant, Monde, PartieDeLaScene } from './scenePart';
import { creerSol } from './ground';

type Case = { x: number; y: number; z: number };

/** Le pas le plus long du geste de pose, par image (ms) : la descente dure au moins six images, moins d'une seconde dès 10 images par seconde. */
const PAS_DU_GESTE_MS = 60;

export interface Cubes extends PartieDeLaScene {
  /** Le sol à facettes d'Archipéo, pour le toucher et la marche (`null` dans le monde en blocs, ou avant les cubes). */
  champ(): ChampDuSol | null;
  /** Ce qu'on peut toucher : les cubes, le sol à facettes et le décor. */
  cibles(): THREE.Object3D[];
  /** Le bloc touché et la case voisine devant la face, en coordonnées de grille (x, y, z = hauteur). */
  casesTouchees(hit: THREE.Intersection): { cell: Case; next: Case };
  poser(cubes: VoxelCube[]): void;
  /** La case visée en chantier (son contour), ou aucune. */
  viser(next: Case | null): void;
  /** À la pose d'un bloc : trois poussières claires qui montent doucement, sans partir en tous sens. */
  eclater(burst: NonNullable<EnCasesDuMonde['burst']>): void;
  /**
   * Le geste de pose (Blocland) : ce cube, le dernier d'un plan, descend dans sa case (où le fantôme attend) et
   * s'enclenche. Le terrain garde son maillage d'avant pendant la descente ; les cubes reçus entre-temps sont posés à
   * l'arrêt, en un seul maillage (pas un de plus que sans le geste).
   */
  enclencher(cube: VoxelCube): void;
  /**
   * La pose d'une partie en vague (GD-6) : ces cubes, absents des cubes reçus par `poser`, descendent couche par couche,
   * un par un, dans les maillages du terrain (Blocland) ; ou, dans Archipéo, sont là dès la première image, en pierre des
   * ruines, au bout du groupe opaque de la construction, et passent un par un, au même rythme, à la couleur du plan
   * (le fondu). Pas un appel de dessin de plus. `rappel` dit chaque couche posée, puis la fin ; les cubes restent posés
   * jusqu'à `arreterLaVague`, que la page appelle en donnant le monde avec la partie. Le temps est celui de la scène
   * (le `dt` de la boucle), d'un pas borné.
   */
  lancerLaVague(cubes: VoxelCube[], rappel: (moment: 'couche' | 'finie') => void): void;
  /** La vague s'arrête (finie, touchée ou quittée) : le prochain terrain reçu se dessine sans elle. */
  arreterLaVague(): void;
  /**
   * Pour les captures d'un lot (scripts/rendu/mesures.mjs, `poseA`) : la vague en cours tenue à cette part de sa durée
   * (0 : avant le premier cube, la ruine dans Archipéo ; 0,5 : à mi-chemin), sans rien dire ; à 1, elle va à sa fin.
   */
  tenirLaVague(part: number): void;
  /** Un éclat de plus (petit cube qui retombe et disparaît) ; `material` lui appartient. */
  eclat(mesh: THREE.Mesh, velocity: THREE.Vector3, born: number): void;
  /** La forme d'un éclat, partagée. */
  formeDEclat: THREE.BufferGeometry;
  /** Les matériaux de la construction taillée d'Archipéo (lot R5), que le navire partage (`null` dans le monde en blocs). */
  materiaux: MateriauxDeConstruction | null;
  /**
   * L'île de près (`null` : aucune, la Carte), la même que celle des personnages (./characters.ts) : son bâtiment importé
   * d'Archipéo de près, ceux des autres îles de loin (world/buildingModels.ts). Refait la construction de ces deux îles.
   */
  approcher(id: BiomeId | null): void;
}

interface Spark {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  born: number;
}

export function creerCubes(monde: Monde, large: Large, lumiere: Lumiere, instant: Instant): Cubes {
  const { scene, archipel, surface } = monde;
  const facettes = monde.habillage.sol === 'facettes';
  const terrain = new THREE.Group();
  scene.add(terrain);
  // Archipéo (lot R2) : le sol et la roche en facettes, à part des cubes (construction) ; le décor en primitives (R4).
  const sol = facettes ? { en3D: creerSol(), champ: null as ChampDuSol | null, signature: '', decor: creerDecor(instant), decorSignature: '' } : null;
  if (sol) scene.add(sol.en3D.group, sol.decor.group);
  // La lanterne du phare et la couleur des fumées suivent le moment du jour (R4b-6e).
  if (sol) lumiere.suivre((jour) => sol.decor.jour(jour));
  // Archipéo (lot R5) : la construction taillée, en trois appels, et les piliers des bornes, instanciés ; ses murs peints
  // aux couleurs du kit d'architecture de l'archipel (lot 7).
  const materiaux = facettes ? creerMateriaux(lumiere, couleursDesRoles(archipel)) : null;
  // Un maillage par île, gardé : poser un bloc ne refait que son île.
  const taille = materiaux
    ? {
        construction: creerConstruction(materiaux),
        piliers: creerPiliers(archipel),
        cache: cacheDeLaConstruction(),
        maillage: null as MaillageDeLaConstruction | null,
        /** Le fondu peint au bout de la construction, s'il y en a un. */
        fondu: null as FonduDeLaPose | null,
      }
    : null;
  if (taille) scene.add(taille.construction.group, taille.piliers.group);
  // Le contour de la case visée (mode chantier).
  const hover = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02)), new THREE.LineBasicMaterial({ color: 0x1e6fd9 }));
  hover.visible = false;
  scene.add(hover);
  const sparkGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
  const sparks: Spark[] = [];
  /**
   * Le geste de pose en cours : le bloc qui descend (ses matériaux sont partagés), le temps écoulé depuis la première
   * image qui le dessine (`null` avant), les cubes qui attendent.
   */
  let geste: { bloc: THREE.Group; ecoule: number | null; enAttente: VoxelCube[] | null } | null = null;
  /**
   * La vague en cours (GD-6) : ses cubes et son plan, son temps (`null` avant la première image), les couches déjà dites,
   * et, dans chaque maillage du terrain qui la porte, sa part et la hauteur de repos de ses sommets (Blocland) ; ou son
   * fondu, les couleurs du groupe opaque qui le portent et son premier sommet (Archipéo).
   */
  let vague: {
    cubes: VoxelCube[];
    plan: PlanDeLaVague;
    ecoule: number | null;
    couches: number;
    finie: boolean;
    rappel: (moment: 'couche' | 'finie') => void;
    queues: { mesh: THREE.Mesh; queue: QueueDeLaVague; repos: Float32Array }[];
    fondu: { maillage: FonduDeLaPose; couleurs: THREE.BufferAttribute | null; sommet: number } | null;
    /** Le temps où les captures la tiennent (`tenirLaVague`), ou rien. */
    tenue?: number;
  } | null = null;
  /** Les derniers cubes reçus, et s'il faut refaire le terrain avec eux à la prochaine image (la vague lancée ou arrêtée). */
  let derniers: VoxelCube[] = [];
  let aRefaire = false;
  let disposed = false;
  // Archipéo : les monuments et les bâtiments des plans importés de l'archipel (world/monumentModels.ts,
  // world/buildingModels.ts), chargés à la demande ; arrivés, la construction est refaite à la prochaine image. Un
  // fichier qui manque (hors ligne) : le monument ou le bâtiment garde ses blocs.
  if (taille) {
    const arrives = (loadedNew: boolean) => {
      if (loadedNew && !disposed && derniers.length) aRefaire = true;
    };
    import('../importedMonuments')
      .then(({ loadMonuments }) => loadMonuments(archipel))
      .then(arrives)
      .catch(() => {});
    import('../importedBuildings')
      .then(({ loadBuildings }) => loadBuildings(archipel))
      .then(arrives)
      .catch(() => {});
  }
  /** L'île de près : son bâtiment importé de près (world/buildingModels.ts). */
  let pres: BiomeId | null = null;

  /** Blocland : les dessous sous l'eau (ou sous le plancher de nuages) ne sont pas dessinés. */
  const dessous: MeshOptions = { hiddenBottomsUpTo: hiddenBottomLevel(archipel) };
  /**
   * Blocland (sans option de style du lot R1) : le terrain en une seule texture, par morceaux du monde, ses faces voisines
   * fondues (world/blockMesh.ts) ; sauf dans « Modifier le plan », qui soulève un lieu sommet par sommet : une face fondue
   * à cheval sur son bord s'étirerait. Le terrain se refait à l'ouverture et à la fermeture du mode.
   */
  const enBlocs = !sol && !surface;
  // Blocland : la lueur des lanternes allumées la nuit (GD-10, le phare du large fini), sur l'eau ou sans mer (Îles du Ciel).
  const lueurs = sol ? null : creerLueurs(scene, lumiere, AMBIENCE[archipel].sky ? null : WATER_LEVEL);
  const neplusSuivreLeMode = enBlocs ? suivreLeMode(() => (aRefaire = true)) : () => {};
  const neplusSuivreLesZones = enBlocs ? suivreLesZonesSoulevees(() => (aRefaire = true)) : () => {};
  /**
   * Blocland : les maillages de chaque région du monde, faces fondues ou non, avec la signature de ses cubes. Une pose ne
   * refait que les régions qu'elle touche ; celles de l'autre état (fondu, ou non dans le mode) restent de côté, hors de
   * la scène, et reviennent telles quelles si rien n'a changé entre-temps (le mode ouvert puis fermé sans rien bouger).
   */
  const regions = { fondues: new Map<string, { signature: string; meshes: THREE.Mesh[] }>(), unes: new Map<string, { signature: string; meshes: THREE.Mesh[] }>() };

  const jeter = (meshes: readonly THREE.Object3D[]) => {
    for (const child of meshes) {
      terrain.remove(child);
      (child as THREE.Mesh).geometry.dispose();
    }
  };
  const viderLeTerrain = () => {
    jeter([...terrain.children]);
    for (const m of [regions.fondues, regions.unes]) {
      for (const r of m.values()) jeter(r.meshes);
      m.clear();
    }
  };
  /** La vague à part (Blocland), refaite à chaque terrain. */
  let maillagesDeLaVague: THREE.Mesh[] = [];

  /**
   * Le terrain de Blocland, région par région : seules les régions dont les cubes ont changé sont refaites. Dans le mode,
   * seules les régions que touche ce qu'il soulève (le lieu choisi, `zonesSouleveesDuMode`) se dessinent face par face ;
   * les autres gardent leurs faces fondues (piste 1 du budget de GD-12).
   */
  const poserLesRegions = (cubes: VoxelCube[]) => {
    const mode = modeOuvertDansLesMateriaux();
    const zones = mode ? zonesSouleveesDuMode() : [];
    const neuves = blockRegions(cubes);
    for (const m of [regions.fondues, regions.unes])
      for (const [k, r] of m) {
        if (neuves.get(k)?.signature === r.signature) continue;
        jeter(r.meshes);
        m.delete(k);
      }
    for (const [k, region] of neuves) {
      const fondre = !chunkTouches(region, zones);
      const ici = fondre ? regions.fondues : regions.unes;
      // La même région dans l'autre état quitte la scène (gardée de côté).
      for (const m of (fondre ? regions.unes : regions.fondues).get(k)?.meshes ?? []) terrain.remove(m);
      let r = ici.get(k);
      if (!r) ici.set(k, (r = { signature: region.signature, meshes: buildRegionMesh(region, { ...dessous, fondre }).map(blockMeshOf) }));
      for (const m of r.meshes) if (m.parent !== terrain) terrain.add(m);
    }
  };

  /** Un maillage qui porte une part de la vague : ses sommets bougent, depuis leur hauteur de repos. */
  const brancherLaQueue = (mesh: THREE.Mesh, queue: QueueDeLaVague) => {
    if (!vague) return;
    // Les cubes de la vague descendent de haut, hors de la sphère englobante : ces maillages-là se dessinent toujours.
    mesh.frustumCulled = false;
    const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    position.setUsage(THREE.DynamicDrawUsage);
    const repos = new Float32Array(queue.rangDuSommet.length);
    for (let i = 0; i < repos.length; i++) repos[i] = position.getY(queue.premierSommet + i);
    vague.queues.push({ mesh, queue, repos });
  };

  /** Le terrain : région par région, en une texture (Blocland), ou le sol à facettes, la construction et le décor (Archipéo). */
  const poserLeTerrain = (cubes: VoxelCube[]) => {
    derniers = cubes;
    aRefaire = false;
    // Dans « Modifier le plan », un lieu se soulève dans le shader : la lueur, posée à sa place, s'éteint le temps du mode.
    lueurs?.poser(modeOuvertDansLesMateriaux() ? [] : cubes);
    if (enBlocs) {
      jeter(maillagesDeLaVague);
      maillagesDeLaVague = [];
      poserLesRegions(cubes);
      if (!vague) return;
      // La vague à part, un maillage par passe : ses sommets bougent, le terrain non.
      vague.queues = [];
      for (const { morceau, vague: queue } of vagueEnBlocs(vague.cubes, vague.plan)) {
        const mesh = blockMeshOf(morceau);
        terrain.add(mesh);
        maillagesDeLaVague.push(mesh);
        brancherLaQueue(mesh, queue);
      }
      placerLaVague(vague.ecoule ?? 0);
      return;
    }
    viderLeTerrain();
    if (!sol && vague) {
      // La vague à la fin des maillages du terrain : ses sommets bougent, le terrain non.
      vague.queues = [];
      for (const { groupe, vague: queue } of maillageAvecLaVague(cubes, vague.cubes, vague.plan, dessous)) {
        const mesh = meshOf(groupe, surface);
        terrain.add(mesh);
        if (!queue) continue;
        brancherLaQueue(mesh, queue);
      }
      placerLaVague(vague.ecoule ?? 0);
      return;
    }
    if (!sol) {
      for (const g of buildMesh(cubes, [], dessous)) terrain.add(meshOf(g, surface));
      return;
    }
    // Archipéo : le sol et la roche en facettes, le reste en cubes. Le maillage du sol n'est refait que s'il change
    // (poser un bloc sur un plan ne le change pas : la case est déjà figée par le fantôme).
    const surLeSol: VoxelCube[] = [];
    const autres: VoxelCube[] = [];
    // Sans les tours du décor du cœur (un seul phare par île, lot R5) : Blocland les garde.
    for (const c of sansToursDuCoeur(cubes)) (c.sol ? surLeSol : autres).push(c);
    // Le décor en primitives (lot R4) : sorti des cubes, il ne fige plus sa case ; le sol à facettes passe dessous.
    const { elements, reste } = rangerLeDecor(autres);
    // Le modelé dessiné d'Archipéo (U2) par-dessus le relief de marche, que la grille garde.
    const auSol = modelerLeSol(archipel, surLeSol, reste);
    const champ = champDuSol(archipel, auSol, reste);
    // Le décor resté en cubes (les objets du quai) d'une case descendue au bas de sa pente descend avec elle.
    // La construction taillée (lot R5), refaite seulement si ses cubes changent ; les bornes à part, instanciées.
    const construction = poseDuDecor(champ, reste);
    if (taille) {
      const { maillage, change } = construireParIle(archipel, construction, auSol, taille.cache, pres);
      // Le fondu de la pose, au bout du groupe opaque : les tranches des pièces et des phares ne bougent pas.
      const fondu = vague?.fondu ?? null;
      if (change || !taille.maillage || (fondu?.maillage ?? null) !== taille.fondu) {
        taille.construction.peindre(fondu ? miseBoutABout([maillage, fondu.maillage.maillage]) : maillage);
        taille.piliers.poser(piliersDe(construction));
        taille.maillage = maillage;
        taille.fondu = fondu?.maillage ?? null;
        if (fondu) {
          const couleurs = (taille.construction.opaque()?.geometry.getAttribute('color') as THREE.BufferAttribute | undefined) ?? null;
          couleurs?.setUsage(THREE.DynamicDrawUsage);
          fondu.couleurs = couleurs;
          fondu.sommet = maillage.opaque.positions.length / 3;
          placerLeFondu(vague?.ecoule ?? 0);
        }
      }
    }
    const signature = signatureDuChamp(champ);
    const style = styleDuMonde() === 'a' ? 'a' : 'b';
    if (signature !== sol.signature) sol.en3D.peindre(landMesh(champ, { style }));
    const decorSignature = signatureDuDecor(elements);
    if (signature !== sol.signature || decorSignature !== sol.decorSignature) {
      sol.decor.peindre(maillageDuDecor(archipel, champ, elements, { style }));
      sol.decorSignature = decorSignature;
    }
    sol.signature = signature;
    sol.champ = champ;
    large.rivage(champ, autres);
  };

  /** Le geste de pose fini (ou coupé) : le bloc qui descendait s'en va, le terrain reçoit les cubes qui attendaient. */
  const finirLeGeste = () => {
    if (!geste) return;
    const { bloc, enAttente } = geste;
    geste = null;
    if (enAttente) poserLeTerrain(enAttente);
    scene.remove(bloc);
    for (const child of bloc.children) (child as THREE.Mesh).geometry.dispose();
  };

  /** Les cubes de la vague à `ms` : seuls ceux qui sont partis sont dessinés, chacun à la hauteur de son geste. */
  const placerLaVague = (ms: number) => {
    if (!vague) return;
    const partis = cubesPartis(vague.plan, ms);
    for (const { mesh, queue, repos } of vague.queues) {
      mesh.geometry.setDrawRange(0, queue.premierIndice + (partis ? queue.indicesJusquA[partis - 1] : 0));
      const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < repos.length; i++) {
        const rang = queue.rangDuSommet[i];
        if (rang >= partis) break;
        position.setY(queue.premierSommet + i, repos[i] + hauteurDansLaVague(vague.plan, rang, ms));
      }
      position.clearUpdateRanges();
      position.addUpdateRange(queue.premierSommet * 3, repos.length * 3);
      position.needsUpdate = true;
    }
  };

  /** Le fondu à `ms` (Archipéo) : chaque cube passe de la pierre à la couleur du plan, à son départ ; rien ne bouge. */
  const placerLeFondu = (ms: number) => {
    const fondu = vague?.fondu;
    if (!vague || !fondu?.couleurs) return;
    const { maillage, couleurs, sommet } = fondu;
    const tableau = couleurs.array as Float32Array;
    const n = maillage.rangDuSommet.length;
    for (let i = 0; i < n; i++) couleurDuFondu(maillage, i, avanceeDuFondu(vague.plan, maillage.rangDuSommet[i], ms), tableau, 3 * (sommet + i));
    couleurs.clearUpdateRanges();
    couleurs.addUpdateRange(sommet * 3, n * 3);
    couleurs.needsUpdate = true;
  };

  /** La vague, image par image : son temps avance d'un pas borné ; chaque couche posée, puis la fin, sont dites une fois. */
  const animerLaVague = (dt: number, reduit: boolean) => {
    if (!vague || vague.finie) return;
    vague.ecoule = vague.ecoule === null ? 0 : vague.ecoule + Math.min(dt * 1000, PAS_DU_GESTE_MS);
    if (vague.tenue !== undefined && !reduit) {
      vague.ecoule = vague.tenue;
      if (vague.fondu) placerLeFondu(vague.ecoule);
      else placerLaVague(vague.ecoule);
      return;
    }
    // Avec « Réduire les animations » (la page ne lance pas de vague alors, mais le réglage peut changer) : posée d'un coup.
    if (reduit) vague.ecoule = vague.plan.finMs;
    if (vague.fondu) placerLeFondu(vague.ecoule);
    else placerLaVague(vague.ecoule);
    const posees = couchesPosees(vague.plan, vague.ecoule);
    const { rappel } = vague;
    if (!reduit) for (; vague.couches < posees; vague.couches += 1) rappel('couche');
    vague.couches = posees;
    if (vague.ecoule >= vague.plan.finMs) {
      vague.finie = true;
      rappel('finie');
    }
  };

  return {
    champ: () => sol?.champ ?? null,
    cibles: () =>
      sol
        ? [...terrain.children, ...sol.en3D.group.children, ...sol.decor.group.children, ...(taille ? [...taille.construction.group.children, ...taille.piliers.group.children] : [])]
        : terrain.children,
    casesTouchees: (hit) => {
      const n = hit.face?.normal ?? new THREE.Vector3(0, 1, 0);
      // Le sol à facettes (lot R2) : le point touché et la normale de la facette redonnent la case (world/landMesh.ts).
      const champ = sol?.champ;
      if (hit.object.userData.sol && champ) {
        const picked = pickCell(champ, hit.point, n);
        if (picked) return picked;
      }
      // Le décor en primitives (lot R4) : la case où pousse l'élément touché.
      const decor = sol?.decor.maillage;
      if (hit.object.userData.decor && champ && decor && hit.faceIndex != null) {
        const picked = caseDuDecor(champ, decor, Boolean(hit.object.userData.lueur), hit.faceIndex);
        if (picked) return picked;
      }
      // Un modèle qui remplace des cubes : la case de la pièce d'architecture (lot 7), ou la case du plan sous le phare.
      const groupe = hit.object.userData.groupe as string | undefined;
      if (taille?.maillage && (groupe === 'opaque' || groupe === 'fenetres') && hit.faceIndex != null) {
        const picked = caseDeLaPiece(taille.maillage, groupe, hit.faceIndex, hit.point, n);
        if (picked) return picked;
      }
      // Un cube, un bloc taillé ou une borne : le bloc derrière la facette, et la case devant (world/construction.ts).
      return caseDeLaConstruction(hit.point, n);
    },
    poser: (cubes) => {
      if (geste) geste.enAttente = cubes;
      else poserLeTerrain(cubes);
    },
    lancerLaVague: (cubes, rappel) => {
      vague = null;
      // Sans la construction taillée (le sol à facettes sans elle : jamais dans le jeu), la partie est posée d'un coup.
      if ((sol && !taille) || !cubes.length) {
        rappel('finie');
        return;
      }
      const plan = planDeLaVague(cubes);
      // Archipéo : le fondu, au bout de la construction ; Blocland : la vague, au bout des maillages du terrain.
      const fondu = taille ? { maillage: maillageDuFondu(archipel, cubes, plan), couleurs: null, sommet: 0 } : null;
      vague = { cubes, plan, ecoule: null, couches: 0, finie: false, rappel, queues: [], fondu };
      aRefaire = true;
    },
    arreterLaVague: () => {
      if (!vague) return;
      vague = null;
      aRefaire = true;
    },
    tenirLaVague: (part) => {
      if (!vague) return;
      if (part >= 1) {
        vague.tenue = undefined;
        vague.ecoule = vague.plan.finMs;
      } else vague.tenue = Math.max(0, part) * vague.plan.finMs;
    },
    enclencher: (cube) => {
      finirLeGeste();
      const bloc = new THREE.Group();
      if (enBlocs) for (const g of buildBlockMesh([cube], { morceau: Infinity })) bloc.add(blockMeshOf(g));
      else for (const g of buildMesh([cube])) bloc.add(meshOf(g, surface));
      bloc.position.y = hauteurDuGeste(0);
      scene.add(bloc);
      geste = { bloc, ecoule: null, enAttente: null };
    },
    viser: (next) => {
      hover.visible = next !== null;
      if (next) hover.position.set(next.x + 0.5, next.z + 0.5, next.y + 0.5);
    },
    eclater: (burst) => {
      const color = new THREE.Color(burst.color).lerp(new THREE.Color('#ffffff'), 0.6);
      for (let i = 0; i < 3; i++) {
        const mesh = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color }));
        mesh.position.set(burst.cell.x + 0.3 + i * 0.2, burst.cell.z + 0.8, burst.cell.y + 0.5);
        const velocity = new THREE.Vector3(0, 3.6 + i * 0.3, 0);
        scene.add(mesh);
        sparks.push({ mesh, velocity, born: performance.now() });
      }
    },
    eclat: (mesh, velocity, born) => {
      scene.add(mesh);
      sparks.push({ mesh, velocity, born });
    },
    formeDEclat: sparkGeo,
    materiaux,
    approcher: (id) => {
      if (id === pres) return;
      pres = id;
      // Blocland n'a pas de bâtiment importé : rien à refaire.
      if (taille && derniers.length) aRefaire = true;
    },
    animer: (t, dt, reduit) => {
      // Les fumées bougent, ou prennent leur pose immobile avec « Réduire les animations » (R4b-6e).
      sol?.decor.animer(t, dt, reduit);
      // La vague lancée ou arrêtée sans nouveau terrain dans le même rendu de la page : le terrain est refait ici, une fois.
      if (aRefaire && !geste) poserLeTerrain(derniers);
      animerLaVague(dt, reduit);
      // Le geste de pose : le bloc descend, en accélérant, puis s'arrête d'un coup dans sa case (world/pose.ts).
      // Son temps avance image par image, d'un pas borné : une image longue (la fin d'un plan refait le village) ne fait
      // pas sauter la descente, qui se voit toujours en entier.
      if (geste) {
        geste.ecoule = geste.ecoule === null ? 0 : geste.ecoule + Math.min(dt * 1000, PAS_DU_GESTE_MS);
        if (reduit || gesteFini(geste.ecoule)) finirLeGeste();
        else geste.bloc.position.y = hauteurDuGeste(geste.ecoule);
      }
      if (reduit) return;
      // Éclats : petits cubes qui retombent et disparaissent.
      for (const s of [...sparks]) {
        const age = (instant.now - s.born) / 1000;
        s.velocity.y -= 9 * 0.016;
        s.mesh.position.addScaledVector(s.velocity, 0.016);
        s.mesh.rotation.x += 0.2;
        s.mesh.rotation.z += 0.15;
        if (age > 0.7) {
          scene.remove(s.mesh);
          (s.mesh.material as THREE.Material).dispose();
          sparks.splice(sparks.indexOf(s), 1);
        }
      }
    },
    dispose: () => {
      disposed = true;
      neplusSuivreLeMode();
      neplusSuivreLesZones();
      vague = null;
      if (geste) geste.enAttente = null;
      finirLeGeste();
      hover.geometry.dispose();
      (hover.material as THREE.Material).dispose();
      viderLeTerrain();
      sol?.en3D.dispose();
      sol?.decor.dispose();
      lueurs?.dispose();
      taille?.construction.dispose();
      taille?.piliers.dispose();
      materiaux?.dispose();
      for (const s of sparks) (s.mesh.material as THREE.Material).dispose();
      sparkGeo.dispose();
    },
  };
}
