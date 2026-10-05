// Le large de la scène 3D : la mer (ou le plancher de nuages des Îles du Ciel), les nuages, les oiseaux et les baleines,
// dont le passage au large quand la baleine parle (world/whalePass.ts). Archipéo (lot R3) : la mer en dégradé de
// profondeur et la faune en facettes, un appel de dessin par famille.
import * as THREE from 'three';
import { AMBIENCE, palette } from '../world/daylight';
import { capDuNuage, deriveDesNuages, oiseauxDe, placeDesNuages, placeDesNuagesDArchipeo, PLANEUR, planeurDe, poseDePassage, poseDeRonde, poseDuPlaneur, type NuageAuLoin, type PoseDeBaleine, type Ronde } from '../world/fauna';
import type { ChampDuSol } from '../world/landMesh';
import { PLANCHER_DE_NUAGES, signatureDesTerres, terresDeLaMer } from '../world/sea';
import { cielDe, teinteSur } from '../world/palette';
import { viewYaw, whaleSpots } from '../world/terrain';
import { passingWhale, whalePassRoute, type WhaleRoute } from '../world/whalePass';
import type { VoxelCube } from '../Voxel';
import { playWhaleBlow } from '../sound';
import { ISLAND_VIEW } from './camera';
import { creerFaune } from './fauna';
import type { Lumiere } from './light';
import { creerMer } from './sea';
import type { Derniers, Monde, PartieDeLaScene } from './scenePart';
import { blockMaterial } from './textures';

/** Hauteur de l'eau : les deux couches de terre affleurent, le sol reste bien au-dessus. */
const WATER_LEVEL = -0.45;
/** La couleur moyenne de la texture de l'eau (world/pixels.ts) : Archipéo teinte la mer pour qu'elle ait, en moyenne, la couleur de la palette. */
const EAU_MOYENNE = 0x54a2e4;

export interface Large extends PartieDeLaScene {
  /** La côte a peut-être changé : la mer d'Archipéo est repeinte si c'est le cas. */
  rivage(champ: ChampDuSol, autres: VoxelCube[]): void;
}

export function creerLarge(
  monde: Monde,
  camera: THREE.PerspectiveCamera,
  lumiere: Lumiere,
  derniers: { readonly current: Derniers },
  /** Le dernier passage de la baleine joué : gardé par la vue, pour ne pas le rejouer quand la scène est refaite. */
  passSeq: { current: number | null },
): Large {
  const { scene, archipel, etendue: bounds, centre: center, largeur: width } = monde;
  const peinte = monde.habillage.large === 'mer-et-faune';
  const ambience = AMBIENCE[archipel];

  // L'eau : un grand plan sous le niveau du sol, avec des crêtes pixel qui défilent.
  const waterMaterial = (
    Array.isArray(blockMaterial('eau')) ? (blockMaterial('eau') as THREE.Material[])[2] : blockMaterial('eau')
  ) as THREE.MeshLambertMaterial;
  const waterMat = waterMaterial.clone();
  waterMat.transparent = true;
  waterMat.opacity = 0.92;
  if (waterMat.map) {
    waterMat.map = waterMat.map.clone();
    waterMat.map.wrapS = THREE.RepeatWrapping;
    waterMat.map.wrapT = THREE.RepeatWrapping;
    waterMat.map.repeat.set(width * 2, width * 2);
    waterMat.map.needsUpdate = true;
  }
  const water = new THREE.Mesh(new THREE.PlaneGeometry(width * 8, width * 8), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(center.x, WATER_LEVEL, center.y);
  // Les Îles du Ciel : pas de mer, un plancher de nuages sous les îles.
  water.visible = !ambience.sky && !peinte;
  scene.add(water);
  // Archipéo (lot R3) : la mer en dégradé de profondeur, l'écume du rivage et la houle (ou le plancher de nuages), en
  // un appel de dessin ; peinte avec le terrain, quand la côte est connue.
  const mer = peinte ? creerMer(archipel, bounds, width * 4) : null;
  if (mer) {
    mer.mesh.position.y = ambience.sky ? PLANCHER_DE_NUAGES : WATER_LEVEL;
    scene.add(mer.mesh);
  }
  let merSignature = '';
  // Le plancher de nuages des Îles du Ciel (Blocland) : uni et opaque, de la couleur de l'eau de la palette, qui suit le
  // jour comme l'eau des autres archipels (DA-35 : la nappe en dégradé répété faisait un damier de ronds blancs).
  const cloudFloorMat = new THREE.MeshBasicMaterial({ color: palette(1, archipel).water });
  const cloudFloor = new THREE.Mesh(new THREE.PlaneGeometry(width * 8, width * 8), cloudFloorMat);
  cloudFloor.rotation.x = -Math.PI / 2;
  cloudFloor.position.set(center.x, PLANCHER_DE_NUAGES, center.y);
  cloudFloor.visible = ambience.sky && !peinte;
  scene.add(cloudFloor);

  // Blocland : nuages en cubes, au-dessus du monde ; dans les Îles du Ciel, deux fois plus, et bas, entre les îles.
  // Archipéo : des cumulus facettés, au loin derrière l'archipel (DA-11), dessinés avec la faune (plus bas).
  const cloudGeo = new THREE.BoxGeometry(1, 0.5, 1.2);
  const clouds = new THREE.Group();
  /**
   * Où sont les nuages : le coin de leur premier cube (le monde en blocs), et leur longueur. Archipéo : au loin, au nord
   * de l'archipel, jamais sur un pont ni sur un chemin (DA-11, world/fauna.ts).
   */
  const cloudAt: NuageAuLoin[] = peinte ? placeDesNuagesDArchipeo(archipel, bounds) : placeDesNuages(archipel, bounds, width).map((n) => ({ ...n, grossi: 1 }));
  /** Archipéo : la dérive des nuages, et leur fondu au bout (world/fauna.ts). */
  const derive = deriveDesNuages(bounds);
  if (!peinte)
    cloudAt.forEach(({ x, y, z, len }) => {
      const cloud = new THREE.Group();
      for (let k = 0; k < len; k++) {
        const puff = new THREE.Mesh(cloudGeo, blockMaterial('nuage'));
        puff.position.set(k, (k % 2) * 0.5, 0);
        cloud.add(puff);
      }
      cloud.position.set(x, y, z);
      clouds.add(cloud);
    });
  scene.add(clouds);

  // Les oiseaux : de petits V sombres qui tournent au-dessus du monde, ailes battantes.
  const birdMat = new THREE.MeshLambertMaterial({ color: 0x3a2f2a });
  const wingGeo = new THREE.BoxGeometry(0.5, 0.08, 0.16);
  const birds: { group: THREE.Group; wings: THREE.Mesh[]; cx: number; cy: number; r: number; alt: number; phase: number; speed: number }[] = [];
  // Plus d'oiseaux et plus haut dans les Anciens Ateliers ; tout en haut dans les Îles du Ciel.
  const { nombre: birdCount, altitude: birdAlt } = oiseauxDe(archipel);
  for (let i = 0; i < birdCount; i++) {
    const group = new THREE.Group();
    const left = new THREE.Mesh(wingGeo, birdMat);
    const right = new THREE.Mesh(wingGeo, birdMat);
    left.position.x = -0.25;
    right.position.x = 0.25;
    group.add(left, right);
    // (Archipéo : les oiseaux sont des instances de la faune, plus bas ; le groupe ne sert qu'à garder leur vol.)
    if (!peinte) scene.add(group);
    birds.push({
      group,
      wings: [left, right],
      cx: bounds.minX + (0.2 + 0.6 * ((i * 0.37) % 1)) * width,
      cy: bounds.minY + (0.2 + 0.6 * ((i * 0.61) % 1)) * (bounds.maxY - bounds.minY),
      r: 8 + (i % 3) * 4,
      alt: birdAlt + (i % 2) * 3,
      phase: i * 1.7,
      speed: 0.25 + (i % 3) * 0.05,
    });
  }

  // Les baleines : trois grandes bêtes bleu ardoise qui tournent au large, font surface et soufflent.
  const whaleMat = new THREE.MeshLambertMaterial({ color: 0x3f5d7a });
  const bellyMat = new THREE.MeshLambertMaterial({ color: 0xc9d6e2 });
  const spoutMat = new THREE.MeshLambertMaterial({ color: 0xf4f8fb, transparent: true, opacity: 0.85 });
  const whales: ({ group: THREE.Group; fluke: THREE.Mesh; spout: THREE.Group; skin: THREE.Mesh[] } & Ronde)[] = [];
  whaleSpots(archipel).forEach((spot, i) => {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.3, 1.5), whaleMat);
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1.3), whaleMat);
    head.position.x = 2.3;
    const belly = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.3, 1.1), bellyMat);
    belly.position.y = -0.6;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.15, 0.7), whaleMat);
    fin.position.set(0.6, -0.2, 1.0);
    const fluke = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 2.2), whaleMat);
    fluke.position.x = -2.2;
    const spout = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const puff = new THREE.Mesh(new THREE.BoxGeometry(0.3 + k * 0.15, 0.3, 0.3 + k * 0.15), spoutMat);
      puff.position.set(2.3 + (k - 1) * 0.2, 0.9 + k * 0.45, 0);
      spout.add(puff);
    }
    spout.visible = false;
    group.add(body, head, belly, fin, fluke, spout);
    // (Archipéo : les baleines sont des instances de la faune, plus bas.)
    if (!peinte) scene.add(group);
    whales.push({ group, fluke, spout, skin: [body, head, fin, fluke], cx: spot.x, cy: spot.y, r: spot.r, phase: i * 2.1, speed: 0.12 + i * 0.03 });
  });
  // Le passage au large (le mot de la baleine) : la baleine qui passe prend une peau qui garde sa silhouette la nuit
  // (un reflet de lune, sans briller), et un liseré d'écume au ras de l'eau la détache de la mer sombre.
  const passMat = new THREE.MeshLambertMaterial({ color: 0x3f5d7a });
  const foamMat = new THREE.MeshLambertMaterial({ color: 0xeef4f8, transparent: true, opacity: 0.8, depthWrite: false });
  const foam = new THREE.Group();
  for (const [w, d, x, z] of [
    [5.6, 0.35, -0.3, 1.05],
    [5.6, 0.35, -0.3, -1.05],
    [0.35, 1.8, 2.6, 0],
    [0.35, 1.4, -3.1, 0],
    [1.6, 0.3, -4.3, 0.55],
    [1.6, 0.3, -4.3, -0.55],
  ] as const) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), foamMat);
    strip.position.set(x, 0, z);
    foam.add(strip);
  }
  foam.visible = false;
  if (!peinte) scene.add(foam);
  // Archipéo (lot R3) : les baleines, les oiseaux et les nuages en facettes, un appel de dessin par famille.
  // Aux Îles du Ciel, l'oiseau planeur (R4b-3e) : une instance de plus des oiseaux, la dernière, sans appel de dessin de plus.
  const planeur = peinte ? planeurDe(archipel, bounds) : null;
  const faune = peinte ? creerFaune({ baleines: whales.length, oiseaux: birds.length + (planeur ? 1 : 0), nuages: cloudAt.length }) : null;
  const poserPlaneur = (t: number, reduit: boolean) => {
    if (!planeur || !faune) return;
    const p = poseDuPlaneur(planeur, t, reduit);
    faune.poserOiseau(birds.length, p.x, p.y, p.z, p.cap, PLANEUR.ailes, p.echelle);
  };
  if (faune) scene.add(faune.group);
  /**
   * Pose un nuage d'Archipéo à sa place (le milieu de ses cubes), tourné d'un rien, chacun le sien, à sa taille (`grossi`)
   * et défait au bout de sa dérive.
   */
  const placeCloud = (i: number) => {
    const c = cloudAt[i];
    const milieu = c.x + c.len / 2;
    faune?.poserNuage(i, milieu, c.y, c.z + 0.6, c.len, capDuNuage(i), c.grossi * derive.taille(milieu));
  };
  /** Le vol d'un oiseau à l'instant `t` : sur son cercle, à son altitude, tourné le long du cercle. */
  const birdAt = (b: (typeof birds)[number], t: number) => {
    const a = t * b.speed + b.phase;
    return { x: b.cx + Math.cos(a) * b.r, y: b.alt + Math.sin(t * 0.7 + b.phase) * 0.6, z: b.cy + Math.sin(a) * b.r, cap: -a };
  };
  if (faune) {
    // Leur place de départ : avec « Réduire les animations », ils y restent, figés (ailes à plat, queue droite, sans
    // souffle).
    cloudAt.forEach((_, i) => placeCloud(i));
    birds.forEach((b, i) => {
      const o = birdAt(b, 0);
      faune.poserOiseau(i, o.x, o.y, o.z, o.cap, 0.6);
    });
    poserPlaneur(0, true);
    whales.forEach((wh, i) => faune.poserBaleine(i, { ...poseDeRonde(wh, 0), queue: 0, souffle: 0 }));
    faune.fin();
  }
  /** Le passage en cours : la baleine, son trajet, son début (temps de l'horloge), son souffle déjà joué ou non. */
  let pass: { whale: number; route: WhaleRoute; heading: number; start: number; blown: boolean } | null = null;

  // L'eau (ou le plancher de nuages) et la faune suivent le jour.
  lumiere.suivre((jour) => {
    if (peinte) {
      const c = cielDe(archipel, jour);
      waterMat.color.setHex(teinteSur(c.mer, EAU_MOYENNE));
      if (ambience.sky) cloudFloorMat.color.setHex(c.mer);
      faune?.nuit(1 - jour);
    } else {
      const eau = palette(jour, archipel).water;
      waterMat.color.setHex(eau);
      if (ambience.sky) cloudFloorMat.color.setHex(eau);
    }
  });

  return {
    rivage: (champ, autres) => {
      // La mer (lot R3) : repeinte seulement si la côte a changé.
      if (!mer) return;
      const terres = terresDeLaMer(champ, autres);
      const sig = signatureDesTerres(terres);
      if (sig !== merSignature) {
        mer.peindre(terres);
        merSignature = sig;
      }
    },
    animer: (t, _dt, reduit) => {
      if (reduit) return;
      // Nuages qui dérivent, eau qui ondule.
      for (const cloud of clouds.children) {
        cloud.position.x -= 0.004;
        if (cloud.position.x < bounds.minX - 12) cloud.position.x = bounds.maxX + 12;
      }
      if (faune)
        cloudAt.forEach((c, i) => {
          c.x -= 0.004;
          if (c.x + c.len / 2 < derive.debut) c.x = derive.fin - c.len / 2;
          placeCloud(i);
        });
      if (waterMat.map) waterMat.map.offset.set(t * 0.02, t * 0.013);
      // La houle et l'écume d'Archipéo.
      mer?.temps(t);
      poserPlaneur(t, false);
      for (const [i, b] of birds.entries()) {
        const o = birdAt(b, t);
        // Archipéo : l'oiseau bat des ailes en s'écrasant en hauteur (ailes relevées, puis baissées).
        if (faune) {
          faune.poserOiseau(i, o.x, o.y, o.z, o.cap, 0.3 + 0.8 * Math.sin(t * 9 + b.phase));
          continue;
        }
        b.group.position.set(o.x, o.y, o.z);
        b.group.rotation.y = o.cap;
        const flap = Math.sin(t * 9 + b.phase) * 0.6;
        b.wings[0].rotation.z = flap;
        b.wings[1].rotation.z = -flap;
      }
      // Le mot de la baleine : un nouveau `seq`, un passage (s'il y a une mer et de l'eau libre au large de l'île).
      const wp = derniers.current.whalePass;
      if (wp && wp.seq !== passSeq.current) {
        passSeq.current = wp.seq;
        if (!pass) {
          // Vers la caméra de la vue de l'île (le même pivot que le cadrage) : le passage se voit depuis cette vue.
          const yaw = -viewYaw(wp.island);
          const toCamera = { x: ISLAND_VIEW.dx * Math.cos(yaw) - ISLAND_VIEW.dy * Math.sin(yaw), y: ISLAND_VIEW.dx * Math.sin(yaw) + ISLAND_VIEW.dy * Math.cos(yaw) };
          const route = whales.length > 0 ? whalePassRoute(wp.island, toCamera, camera.aspect < 0.9) : null;
          const i = route ? passingWhale(whales.map((wh) => ({ x: wh.cx, y: wh.cy })), route) : -1;
          if (route && i >= 0) {
            pass = { whale: i, route, heading: Math.atan2(-(route.to.y - route.from.y), route.to.x - route.from.x), start: t, blown: false };
            if (!faune) for (const m of whales[i].skin) m.material = passMat;
          }
        }
      }
      for (const [i, wh] of whales.entries()) {
        // Sa ronde au large ; pendant son passage, au large de l'île (world/fauna.ts).
        let pose: PoseDeBaleine = poseDeRonde(wh, t);
        const passing = pass !== null && pass.whale === i;
        if (pass && passing) {
          const p = poseDePassage(wh, t, pass);
          if (p.fini) {
            // De retour à sa ronde : sa peau ordinaire, plus d'écume.
            if (!faune) for (const m of wh.skin) m.material = whaleMat;
            foam.visible = false;
            faune?.poserEcume(null, 0);
            pass = null;
          } else {
            pose = p.pose;
            if (pose.souffle > 0 && !pass.blown) {
              pass.blown = true;
              if (derniers.current.sons) playWhaleBlow();
            }
          }
        }
        const enPassage = passing && pass !== null;
        if (faune) {
          faune.poserBaleine(i, pose);
          if (enPassage) faune.poserEcume(pose, WATER_LEVEL + 0.04);
          continue;
        }
        wh.group.position.set(pose.x, pose.y, pose.z);
        wh.group.rotation.y = pose.cap;
        wh.group.rotation.z = pose.roulis;
        if (passing) wh.group.scale.setScalar(pose.echelle);
        wh.fluke.rotation.z = pose.queue;
        wh.spout.visible = pose.souffle > 0;
        if (pose.souffle > 0) wh.spout.scale.setScalar(pose.souffle);
        if (!enPassage) continue;
        // Le liseré d'écume sous la baleine qui passe ; la nuit, un reflet de lune garde sa silhouette.
        const night = lumiere.nuit();
        passMat.emissive.setRGB(0.05 * night, 0.09 * night, 0.14 * night);
        foamMat.emissive.setRGB(0.3 * night, 0.34 * night, 0.38 * night);
        foamMat.opacity = pose.ecume;
        foam.visible = foamMat.opacity > 0.02;
        foam.position.set(pose.x, WATER_LEVEL + 0.04, pose.z);
        foam.rotation.y = pose.cap;
        foam.scale.setScalar(pose.echelle);
      }
      faune?.fin();
    },
    dispose: () => {
      // Les baleines et l'écume du passage.
      for (const g of [...whales.map((wh) => wh.group), foam])
        g.traverse((o) => {
          if (o instanceof THREE.Mesh) o.geometry.dispose();
        });
      for (const m of [whaleMat, bellyMat, spoutMat, passMat, foamMat]) m.dispose();
      water.geometry.dispose();
      waterMat.map?.dispose();
      waterMat.dispose();
      cloudFloor.geometry.dispose();
      cloudFloorMat.dispose();
      cloudGeo.dispose();
      wingGeo.dispose();
      birdMat.dispose();
      mer?.dispose();
      faune?.dispose();
    },
  };
}
