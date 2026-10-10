// Les personnages d'Archipéo dans la scène 3D (lot R6), dans l’univers Archipéo (voir rendering.ts) : le bonhomme (un maillage à six
// os), les créatures d'un archipel (un maillage à deux os par créature : le corps, le bras et son outil) et les
// Gardiens en sentinelles de pierre (un maillage fixe), un appel de dessin chacun. Les modèles sont ceux de
// world/characters/ (merges.ts), placés depuis la grille d'aujourd'hui : l'emprise au sol, la marche, les
// promenades et le toucher ne changent pas. Ce qui brille (la lanterne de Fi, l'abdomen d'Astra, la braise de Braise la
// nuit ; la flamme et les veines d'un Gardien vaincu) passe par un attribut `lueur` que lit le matériau.
import * as THREE from 'three';
import { piedsSur, type ChampDuSol } from '../world/landMesh';
import {
  allumageDuGardien,
  couleursDesGardiens,
  fusionDesCreatures,
  fusionDesGardiens,
  fusionDuBonhomme,
  lueursDesGardiens,
  pointDePose,
  type Fusion,
  type FusionDesGardiens,
  type Os,
  type PersonnagePlace,
} from '../world/characters/merges';
import type { BiomeId } from '../biomes';
import { startStrolls, strollAt, type Stroll } from '../world/scene';
import { LISERE_DE_NUIT } from '../world/characters/colors';
import type { Lumiere } from './light';
import type { Instant, Monde } from './scenePart';
import type { Habits } from './characters';

/** Le balancement du pas du bonhomme, os par os (le même que celui du bonhomme en blocs). */
const PAS: Record<string, number> = {
  'bras-gauche': 1,
  'bras-droit': -1,
  'jambe-gauche': -1,
  'jambe-droite': 1,
};

/** Le geste lent d'une créature : son bras et son outil se lèvent un peu, une fois toutes les cinq secondes. */
export const GESTE = { periode: 5, angle: 0.12 } as const;

/**
 * Un matériau de personnage : ses couleurs de sommet, éclairées ; ce qui brille, selon `force` (0 à 1) ; et la nuit, le
 * voile éclairci et le liseré froid des vivants, selon `lisere` (0 à 1 ; toujours 0 pour les sentinelles).
 */
export interface MateriauALueur {
  materiau: THREE.MeshLambertMaterial;
  force: { value: number };
  lisere: { value: number };
}

/**
 * Le liseré de nuit en 3D (référent dys, 28/09 : de nuit, une créature doit se lire au moins aussi bien que de jour).
 * Le liseré seul n'y suffit pas (quelques pixels) : il s'ajoute à un voile de nuit plus léger (`ECLAIRCIE`).
 * Comme dans l’ancienne 2D peinte, la silhouette prend du côté éclairé une teinte claire et froide : ici, les facettes
 * du bord (vues de biais : leur normale s'écarte de la direction de la caméra au-delà de `bord`), d'autant plus qu'elles
 * regardent vers le haut, mêlées à `LISERE_DE_NUIT` jusqu'à `poids` au cœur de la nuit. Fixe : rien ne clignote.
 */
export const LISERE_3D = { bord: [0.4, 0.75], poids: 0.9 } as const;

/**
 * Et un voile de nuit plus léger sur les vivants : au cœur de la nuit, leur lumière est multipliée par `1 + ECLAIRCIE`
 * (la nuit de la scène divise à peu près par deux celle du jour) ; ils restent bleutés, mais plus clairs que le sol.
 */
export const ECLAIRCIE = 0.4;

/**
 * Le matériau des personnages : un Lambert à couleurs de sommet, qui mêle à la lumière de la scène la couleur de
 * l'attribut `lueur` (rgb, et son poids en a), à `force` : ce qui brille ne s'assombrit pas la nuit ; et la nuit, à
 * `lisere`, un voile plus léger que celui de la scène et le liseré froid du bord de la silhouette.
 */
export function materiauALueur(): MateriauALueur {
  const force = { value: 0 };
  const lisere = { value: 0 };
  const couleurDuLisere = { value: new THREE.Color(LISERE_DE_NUIT) };
  const materiau = new THREE.MeshLambertMaterial({ vertexColors: true });
  materiau.onBeforeCompile = (shader) => {
    shader.uniforms.forceDeLueur = force;
    shader.uniforms.forceDeNuit = lisere;
    shader.uniforms.couleurDuLisere = couleurDuLisere;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 lueur;\nvarying vec4 vLueur;')
      .replace('#include <color_vertex>', '#include <color_vertex>\nvLueur = lueur;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float forceDeLueur;\nuniform float forceDeNuit;\nuniform vec3 couleurDuLisere;\nvarying vec4 vLueur;')
      .replace(
        '#include <opaque_fragment>',
        [
          'outgoingLight *= 1.0 + forceDeNuit * ' + ECLAIRCIE.toFixed(2) + ';',
          'outgoingLight = mix(outgoingLight, vLueur.rgb, forceDeLueur * vLueur.a);',
          'float bordDuLisere = smoothstep(' + LISERE_3D.bord[0].toFixed(2) + ', ' + LISERE_3D.bord[1].toFixed(2) + ', 1.0 - saturate(dot(geometryNormal, geometryViewDir)));',
          'float hautDuLisere = 0.5 + 0.5 * dot(geometryNormal, normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz));',
          'outgoingLight = mix(outgoingLight, couleurDuLisere, forceDeNuit * ' + LISERE_3D.poids.toFixed(2) + ' * bordDuLisere * hautDuLisere * (1.0 - vLueur.a));',
          '#include <opaque_fragment>',
        ].join('\n'),
      );
  };
  materiau.customProgramCacheKey = () => 'personnage-lueur';
  return { materiau, force, lisere };
}

/** La géométrie d'une fusion : ses positions, normales, couleurs, et ce qui brille (sans lueur : rien). */
function geometrieDe(f: Fusion, lueur?: Float32Array): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(f.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(f.normals, 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(f.colors), 3));
  g.setAttribute('lueur', new THREE.BufferAttribute(lueur ?? new Float32Array((f.positions.length / 3) * 4), 4));
  return g;
}

/**
 * Les gestes d'une créature qui a un squelette (scripts/rendu/modeles/squelette.py), lents et jamais ensemble
 * (référent dys, 9 octobre 2026) : au repos, elle respire (le dos), regarde de côté (la tête) et balance la queue, sur
 * des cycles de 4 s ou plus ; quand elle fait un pas, ses jambes vont au rythme du sautillé (`strollAt`). Amplitudes
 * en radians, périodes en secondes ; les mêmes que l'aperçu des squelettes (scripts/rendu/modeles/apercu_squelette.py).
 */
export const GESTES = {
  souffle: [0.04, 4.5],
  regard: [0.2, 7],
  queue: [0.3, 4],
  // La marche (`poseDeMarche`) : la cuisse (`angle`), les bras à l'inverse des jambes, le buste penché en avant ;
  // `bassin` : sa rotation avec la jambe qui avance, `buste` celle des épaules à l'inverse ; `bascule` : le bassin qui
  // descend du côté de la jambe en l'air ; `dandine` : le roulis des créatures à pattes courtes (une taupe en
  // manteau) ; `monte` : de combien le corps monte quand les jambes se croisent (en hauteurs de case).
  pas: { angle: 0.45, cadence: 8, bras: 0.45, buste: 0.06, penche: 0.06, dandine: 0.1, bassin: 0.07, bascule: 0.05, monte: 0.04 },
} as const;

/** Une allure : les amplitudes de la marche (`GESTES.pas`). */
export type Allure = { readonly [K in keyof typeof GESTES.pas]: number };

/**
 * Les créatures qui ne marchent pas comme les autres (choix du mainteneur, qualifiées une à une sur leur vidéo).
 */
export const ALLURES: Partial<Record<BiomeId, Partial<Allure>>> = {
  // Rouxel, le renard : une marche fine et distinguée, à petits pas, les bras à peine balancés, le buste droit.
  'french-6e-word-spelling': { angle: 0.3, bras: 0.18, buste: 0.02, bassin: 0.05, bascule: 0.03, penche: -0.03, monte: 0.025 },
  // Bloquette, la brebis : son râteau, tenu comme un bâton de marche, balance peu.
  'french-6e-grammar-spelling': { bras: 0.2 },
  // Nenu, la grenouille : sa rame, tenue debout comme un bâton, balance peu.
  'maths-6e-fractions': { bras: 0.2 },
  // Silex, l'ours : son balai, tenu debout comme un bâton, balance peu.
  'history-6e-antiquity': { bras: 0.2 },
  // Pince, la fourmi : sa clé levée balance peu.
  'technology-6e-objects': { bras: 0.2 },
};

/** L'allure d'une créature : la marche commune, et ce que la sienne change. */
export const allureDe = (id: BiomeId): Allure => ({ ...GESTES.pas, ...ALLURES[id] });

/**
 * Les os d'un squelette, chacun à sa place de repos (relative à son parent), et le maillage qui les porte. Sans
 * `poids`, chaque sommet suit son os seul.
 */
function squelette(
  g: THREE.BufferGeometry,
  os: Uint16Array,
  table: Os[],
  materiau: THREE.Material,
  lesPoids?: { joints: Uint16Array; weights: Float32Array },
): { mesh: THREE.SkinnedMesh; bones: THREE.Bone[] } {
  const n = os.length;
  const index = lesPoids?.joints ?? new Uint16Array(n * 4);
  const poids = lesPoids?.weights ?? new Float32Array(n * 4);
  if (!lesPoids)
    for (let v = 0; v < n; v++) {
      index[v * 4] = os[v];
      poids[v * 4] = 1;
    }
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(index, 4));
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(poids, 4));
  const mesh = new THREE.SkinnedMesh(g, materiau);
  const bones = table.map(() => new THREE.Bone());
  table.forEach((o, i) => {
    const b = bones[i];
    const p = o.parent >= 0 ? table[o.parent].pivot : [0, 0, 0];
    b.position.set(o.pivot[0] - p[0], o.pivot[1] - p[1], o.pivot[2] - p[2]);
    if (o.parent >= 0) bones[o.parent].add(b);
    else mesh.add(b);
  });
  mesh.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(bones));
  // Le maillage couvre l'archipel et ses os bougent : il est toujours dessiné (un appel), jamais écarté.
  mesh.frustumCulled = false;
  return { mesh, bones };
}

/** Une créature qui se promène : son os, sa promenade, sa boîte de toucher et leur place de repos. */
interface Promeneur {
  corps: THREE.Bone;
  bras: THREE.Bone;
  stroll: Stroll;
  boite: THREE.Mesh;
  /** Le centre de la boîte moins le point de pose, et le milieu de l'emprise moins l'origine de la case. */
  decalage: THREE.Vector3;
  milieu: { x: number; y: number };
  phase: number;
  /** Les os de son squelette, par nom (hanches, dos, tête, jambes, bras, queue), s'il en a un. */
  membres: Map<string, THREE.Bone>;
  allure: Allure;
}

/** Tourne un os de squelette par son nom, s'il existe. */
function tourner(membres: Map<string, THREE.Bone>, nom: string, axe: 'x' | 'y' | 'z', angle: number): void {
  const b = membres.get(nom);
  if (b) b.rotation[axe] = angle;
}

/** Un cycle de geste (`GESTES`) au temps `t`, décalé de la phase de la créature et de `decalage` (en radians). */
const cycle = ([angle, periode]: readonly [number, number], t: number, decalage = 0) => angle * Math.sin((2 * Math.PI * t) / periode - decalage);

/** De 0 à 1 et retour, en cloche sans à-coup, autour de `centre` dans le cycle (angles en radians), sur `largeur`. */
function cloche(x: number, centre: number, largeur: number): number {
  const d = Math.abs(Math.atan2(Math.sin(x - centre), Math.cos(x - centre))) / (largeur / 2);
  return d >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * d);
}

/**
 * La pose d'une marche à un instant : un cycle de marche réel, ramené à nos os (hanche, genou, bassin, épaule ; pas
 * de cheville ni de coude). `phi` : l'angle dans le cycle de la jambe gauche (la droite a un demi-cycle d'écart) ;
 * `elan` : de 0 à 1, l'ampleur du moment (0 à l'arrêt). Pour une jambe (repères des cycles de marche humains) :
 * - la cuisse va de l'avant (au contact du talon, `phi` = π/2) à l'arrière (à la poussée, −π/2) ;
 * - le genou est presque tendu au contact, plie un peu en recevant le poids (une quinzaine de degrés), se tend en
 *   appui, puis plie fort pendant que la jambe repasse devant (une soixantaine de degrés, mise à l'échelle de
 *   l'allure), pour que le pied ne frotte pas le sol ;
 * - le bassin tourne avec la jambe qui avance, et descend un peu du côté de la jambe en l'air ; les épaules tournent à
 *   l'inverse du bassin, et la tête reste droite ;
 * - les bras balancent à l'inverse des jambes, un rien en retard ;
 * - le corps est au plus bas juste après le contact et au plus haut quand les jambes se croisent (`haut`, de 0 à 1).
 */
export function poseDeMarche(allure: Allure, phi: number, elan: number): { angles: [nom: string, axe: 'x' | 'y' | 'z', angle: number][]; haut: number } {
  const jambe = (p: number) => {
    // Le genou : la cloche du poids reçu (juste après le contact), puis celle du pas en l'air (avant le croisement).
    const genou = 0.5 * cloche(p, Math.PI / 2 + 0.6, 1.2) + 2.2 * cloche(p, -0.6, 2.6);
    return { cuisse: allure.angle * Math.sin(p), genou: -allure.angle * genou };
  };
  const g = jambe(phi);
  const d = jambe(phi + Math.PI);
  const s = Math.sin(phi);
  const c = Math.cos(phi);
  const bras = allure.bras * Math.sin(phi - 0.35);
  return {
    angles: [
      ['thigh.L', 'x', elan * g.cuisse],
      ['shin.L', 'x', elan * g.genou],
      ['thigh.R', 'x', elan * d.cuisse],
      ['shin.R', 'x', elan * d.genou],
      // Le bassin : il tourne avec la jambe gauche qui avance et descend du côté de la jambe en l'air, sous un buste
      // qui reste droit ; une créature à pattes courtes se dandine (tout son corps penche sur la patte posée).
      ['hips', 'y', elan * -allure.bassin * s],
      ['hips', 'z', elan * (allure.bascule - allure.dandine) * c],
      ['spine', 'y', elan * (allure.bassin + allure.buste) * s],
      ['spine', 'z', elan * -allure.bascule * c],
      ['head', 'y', elan * -allure.buste * s],
      ['arm.L', 'x', elan * -bras],
      ['arm.R', 'x', elan * bras],
    ],
    haut: elan * (0.5 + 0.5 * Math.cos(2 * phi)),
  };
}

/**
 * Joue les gestes d'une créature qui a un squelette (`GESTES`, et son `allure` pour la marche). `pas` : où elle en
 * est de son pas, de 0 à 1 (0 au repos) ; ses membres partent et reviennent en douceur sur le premier et le dernier
 * cinquième du pas, sans à-coup (référent dys), et suivent entre les deux un cycle de marche (`poseDeMarche`).
 * Rend la hauteur du corps (de 0 à 1) : le jeu le soulève d'autant de `allure.monte`.
 */
function bouger(membres: Map<string, THREE.Bone>, allure: Allure, t: number, phase: number, pas: number, dureeDuPas: number): number {
  const elan = adoucir(Math.min(pas, 1 - pas) / 0.2);
  const { angles, haut } = poseDeMarche(allure, pas * dureeDuPas * allure.cadence, elan);
  for (const [nom, axe, angle] of angles) tourner(membres, nom, axe, angle);
  tourner(membres, 'spine', 'x', cycle(GESTES.souffle, t + phase) - allure.penche * elan);
  // La tête regarde de côté au repos, et reste droite quand le buste tourne.
  const tete = membres.get('head');
  if (tete) tete.rotation.y += cycle(GESTES.regard, t + phase);
  tourner(membres, 'tail.1', 'y', cycle(GESTES.queue, t + phase));
  tourner(membres, 'tail.2', 'y', 1.2 * cycle(GESTES.queue, t + phase, 0.9));
  return haut;
}

/**
 * De 0 (des jambes au quart de la hauteur du cou, ou plus : Mousso) à 1 (des pattes au dixième, ou moins : Tunel).
 * Les têtes des os sont rangées par rapport à leur parent : hanches, dos puis tête s'empilent jusqu'au cou.
 */
function pattesCourtes(membres: Map<string, THREE.Bone>): number {
  const hanches = membres.get('hips')?.position.y ?? 0;
  const cou = hanches + (membres.get('spine')?.position.y ?? 0) + (membres.get('head')?.position.y ?? 0);
  return membres.has('thigh.L') && cou > 0 ? Math.min(1, Math.max(0, (0.25 - hanches / cou) / 0.15)) : 0;
}

/** De 0 à 1 sans à-coup (sa pente est nulle aux deux bouts). */
function adoucir(x: number): number {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
}

/**
 * Les personnages d'Archipéo dans les groupes de la scène (./characters.ts, qui fait marcher le bonhomme) : le
 * bonhomme dans `avatar`, les boîtes de toucher des créatures et des Gardiens dans `creatures`, leurs maillages dans la
 * scène.
 */
export function habiller(
  monde: Monde,
  champ: () => ChampDuSol | null,
  instant: Instant,
  lumiere: Pick<Lumiere, 'nuit'> | null,
  avatar: THREE.Group,
  creatures: THREE.Group,
): Habits {
  const { scene } = monde;

  // Le bonhomme : posé par le groupe extérieur, sous ses pieds ; le modèle regarde vers −Z.
  const bonhomme = fusionDuBonhomme();
  const matBonhomme = materiauALueur();
  const corpsDuBonhomme = squelette(geometrieDe(bonhomme), bonhomme.os, bonhomme.squelette, matBonhomme.materiau);
  avatar.add(corpsDuBonhomme.mesh);

  // Les créatures et les Gardiens : leurs maillages dans la scène, leurs boîtes de toucher (invisibles) dans `creatures`.
  const boite = new THREE.BoxGeometry(1, 1, 1);
  const invisible = new THREE.MeshBasicMaterial({ visible: false });
  const matCreatures = materiauALueur();
  const matGardiens = materiauALueur();
  // Un Gardien vaincu brille pleinement, de jour comme de nuit.
  matGardiens.force.value = 1;
  let maillages: THREE.Mesh[] = [];
  let promeneurs: Promeneur[] = [];
  // Les sentinelles posées, et le rallumage en cours (lot 6) : le Gardien, le début et la durée de son fondu.
  let sentinelles: { f: FusionDesGardiens; g: THREE.BufferGeometry; placements: PersonnagePlace[] } | null = null;
  let fondu: { id: BiomeId; t0: number; dureeMs: number; fini: boolean } | null = null;
  /** Le degré de chaque Gardien : celui de son placement, et celui du fondu pour le Gardien qui se rallume. */
  const degresDe = (gardiens: { id: BiomeId }[]): Partial<Record<BiomeId, number>> => {
    const degres: Partial<Record<BiomeId, number>> = Object.fromEntries(gardiens.map((c) => [c.id, allumageDuGardien(c)]));
    if (fondu && fondu.id in degres) {
      const u = fondu.dureeMs > 0 ? Math.min(1, (performance.now() - fondu.t0) / fondu.dureeMs) : 1;
      degres[fondu.id] = Math.max(degres[fondu.id] ?? 0, u * u * (3 - 2 * u));
    }
    return degres;
  };
  /**
   * Repeint les sentinelles à leurs degrés. Avec `seul` (le fondu, image par image), seul ce Gardien est repeint, et
   * seule sa plage part vers la carte graphique.
   */
  const repeindre = (seul?: BiomeId) => {
    if (!sentinelles) return;
    const { f, g, placements } = sentinelles;
    const degres = degresDe(placements);
    const couleurs = g.getAttribute('color') as THREE.BufferAttribute;
    const lueurs = g.getAttribute('lueur') as THREE.BufferAttribute;
    couleursDesGardiens(f, degres, couleurs.array as Float32Array<ArrayBuffer>, seul);
    lueursDesGardiens(f, degres, lueurs.array as Float32Array<ArrayBuffer>, seul);
    const plage = seul ? f.plages.find((p) => p.id === seul) : undefined;
    if (plage) {
      couleurs.addUpdateRange(plage.debut * 9, (plage.fin - plage.debut) * 9);
      lueurs.addUpdateRange(plage.debut * 12, (plage.fin - plage.debut) * 12);
    }
    couleurs.needsUpdate = true;
    lueurs.needsUpdate = true;
  };

  const vider = () => {
    for (const m of maillages) {
      scene.remove(m);
      m.geometry.dispose();
      if (m instanceof THREE.SkinnedMesh) m.skeleton.dispose();
    }
    maillages = [];
    promeneurs = [];
    sentinelles = null;
    for (const c of [...creatures.children]) creatures.remove(c);
  };

  const boiteDe = (b: [number, number, number, number, number, number], userData: Record<string, string>): THREE.Mesh => {
    const m = new THREE.Mesh(boite, invisible);
    m.scale.set(b[3] - b[0], b[4] - b[1], b[5] - b[2]);
    m.position.set((b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2);
    m.userData = userData;
    creatures.add(m);
    return m;
  };

  /** Pose un os de corps sur le sol à facettes : au milieu de son emprise, décalé de la promenade, plus le balancement. */
  const poser = (p: Promeneur, dx: number, dy: number, bob: number) => {
    const o = p.stroll.origin;
    const x = o.x + dx + p.milieu.x;
    const y = o.y + dy + p.milieu.y;
    p.corps.position.set(x, piedsSur(champ(), x, y, o.z) + bob, y);
    p.boite.position.copy(p.corps.position).add(p.decalage);
  };

  return {
    membres: bonhomme.squelette.map((o, i) => ({ os: corpsDuBonhomme.bones[i] as THREE.Object3D, sens: PAS[o.nom] ?? 0 })).filter((m) => m.sens),
    poserLesCreatures: (placements, pres = null) => {
      vider();
      const lesCreatures = placements.filter((c) => (c.kind ?? 'creature') === 'creature');
      const gardiens = placements.filter((c) => c.kind === 'guardian');
      if (lesCreatures.length) {
        const f = fusionDesCreatures(lesCreatures, pres);
        const { mesh, bones } = squelette(geometrieDe(f, f.lueur), f.os, f.squelette, matCreatures.materiau, f.poids);
        scene.add(mesh);
        maillages.push(mesh);
        const strolls = startStrolls(lesCreatures, performance.now());
        promeneurs = lesCreatures.map((c, i) => {
          const b = f.boites[i].boite;
          const pivot = f.squelette[2 * i].pivot;
          const membres = new Map(f.squelette.flatMap((o, k) => (k >= 2 * lesCreatures.length && o.id === c.id ? [[o.nom, bones[k]] as const] : [])));
          const allure = allureDe(c.id);
          const promeneur: Promeneur = {
            corps: bones[2 * i],
            bras: bones[2 * i + 1],
            stroll: strolls[i],
            boite: boiteDe(b, { creature: c.id, kind: 'creature' }),
            decalage: new THREE.Vector3((b[0] + b[3]) / 2 - pivot[0], (b[1] + b[4]) / 2 - pivot[1], (b[2] + b[5]) / 2 - pivot[2]),
            milieu: { x: pivot[0] - c.origin.x, y: pivot[2] - c.origin.y },
            phase: (i * 1.7) % GESTE.periode,
            membres,
            // Le dandinement selon ses pattes, mesuré une fois sur la pose de repos.
            allure: { ...allure, dandine: allure.dandine * pattesCourtes(membres) },
          };
          poser(promeneur, 0, 0, 0);
          return promeneur;
        });
      }
      if (gardiens.length) {
        const f = fusionDesGardiens(gardiens, pres);
        // Chaque sentinelle se pose sur le sol à facettes, comme ses cubes (jamais dedans) : on descend ses sommets.
        gardiens.forEach((c, i) => {
          const o = pointDePose(c);
          const dy = piedsSur(champ(), o[0], o[2], o[1]) - o[1];
          if (dy) for (let k = f.plages[i].debut * 9 + 1; k < f.plages[i].fin * 9; k += 3) f.positions[k] += dy;
        });
        const degres = degresDe(gardiens);
        const g = geometrieDe(f, lueursDesGardiens(f, degres));
        // Le cast est sûr : `geometrieDe` fait l'attribut `color` d'un Float32Array neuf (une copie de `f.colors`, que les
        // couleurs allumées réécrivent sans toucher au modèle), que `getAttribute` rend typé en `TypedArray`.
        couleursDesGardiens(f, degres, g.getAttribute('color').array as Float32Array<ArrayBuffer>);
        const mesh = new THREE.Mesh(g, matGardiens.materiau);
        scene.add(mesh);
        maillages.push(mesh);
        sentinelles = { f, g, placements: gardiens };
        // Les sentinelles ne bougent pas : leurs boîtes non plus.
        gardiens.forEach((c, i) => {
          const { debut, fin } = f.plages[i];
          const b: [number, number, number, number, number, number] = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
          for (let k = debut * 9; k < fin * 9; k++) {
            const v = f.positions[k];
            b[k % 3] = Math.min(b[k % 3], v);
            b[(k % 3) + 3] = Math.max(b[(k % 3) + 3], v);
          }
          boiteDe(b, { creature: c.id, kind: 'guardian' });
        });
      }
    },
    animer: (t, reduit) => {
      // Ce qui brille la nuit suit le degré de nuit (figé avec « Réduire les animations », comme la lumière).
      const nuit = lumiere?.nuit() ?? 0;
      matCreatures.force.value = nuit;
      // Le liseré froid des vivants, la nuit (les sentinelles n'en ont pas : leur pierre se lit sans).
      matCreatures.lisere.value = nuit;
      matBonhomme.lisere.value = nuit;
      // Le fondu du rallumage, jusqu'à son terme (d'un coup quand l'appareil demande moins d'animations : durée nulle).
      if (fondu && !fondu.fini) {
        repeindre(fondu.id);
        fondu.fini = performance.now() - fondu.t0 >= fondu.dureeMs;
      }
      if (reduit) {
        // Les squelettes à leur pose de repos (l'appareil a pu demander moins d'animations en cours de partie).
        for (const q of promeneurs) for (const b of q.membres.values()) b.rotation.set(0, 0, 0);
        return;
      }
      for (const q of promeneurs) {
        const { dx, dy, bob } = strollAt(q.stroll, instant.now, t);
        // Une créature à squelette ne sautille pas : son corps monte et descend avec ses pas.
        const pas = q.stroll.start ? Math.min(1, (instant.now - q.stroll.start) / q.stroll.duration) : 0;
        const haut = q.membres.size ? q.allure.monte * bouger(q.membres, q.allure, t, q.phase, pas, q.stroll.duration / 1000) : bob;
        poser(q, dx, dy, haut);
        // Le geste lent : le bras se lève et redescend, en cinq secondes (coupé avec « Réduire les animations »).
        q.bras.rotation.x = -GESTE.angle * Math.max(0, Math.sin(((t + q.phase) / GESTE.periode) * Math.PI * 2));
      }
    },
    rallumer: (id, dureeMs) => {
      if (id === (fondu?.id ?? null)) return;
      fondu = id ? { id, t0: performance.now(), dureeMs, fini: false } : null;
      repeindre();
    },
    dispose: () => {
      vider();
      avatar.remove(corpsDuBonhomme.mesh);
      corpsDuBonhomme.mesh.geometry.dispose();
      corpsDuBonhomme.mesh.skeleton.dispose();
      boite.dispose();
      invisible.dispose();
      for (const m of [matBonhomme, matCreatures, matGardiens]) m.materiau.dispose();
    },
  };
}
