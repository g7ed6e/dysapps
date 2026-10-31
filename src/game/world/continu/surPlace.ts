// L'épreuve hors des murs (GD-27, lot 6, piste B « aller voir sur place », choix du mainteneur du 31 octobre 2026) : au
// niveau 1 de « Classer le vivant », à la Mangrove, les items sans jumeau se jouent d'abord dans la scénette ; puis la
// botaniste dit « Va voir les animaux de la rive. », Kéo marche une seule fois jusqu'à la station, aux abords du lieu, et
// les quatre jumeaux (docs/contenu/life-earth-sciences-6e-living-world.md, « ### Sur place ») se jouent en touchant un
// des trois animaux posés sur leurs pierres. Trois pierres plates, fixes, à 1,4 l'une de l'autre (le cadrage disait 1,2 :
// les ailes de la chauve-souris touchaient ses voisins, et deux cibles doivent garder huit pixels entre elles), de gauche
// à droite dans l'ordre des choix ; les objets changent à chaque item, jamais les pierres (directeur artistique, cadrage).
// Le kit : cinq animaux (aigrette, chauve-souris, libellule, poisson, araignée), chacun 40 à 80 triangles en aplats
// francs, aux silhouettes distinctes même en gris ; une pierre, 12 triangles : trois objets et trois pierres font au plus
// `SUR_PLACE_TRIANGLES_MAX` triangles, dans le maillage de l'item, aucun appel de plus (artiste technique 3D, budget).
// La caméra est fixe pour tout l'item, quoi que fasse la bulle : l'œil à deux unités du sol, six et demie en arrière de
// l'objet du milieu (le cadrage disait cinq : le trio tenait trop de place), en plongée de quinze degrés, le champ de la scénette ; le trio au centre-bas, un peu à droite du milieu pour
// laisser le rappel à gauche, Kéo derrière les pierres, au tiers gauche, le lieu et sa porte au fond.
// Code pur : la scène (../../three/archipeo/scene.ts) pose Kéo, la caméra et le maillage ; la page écrit les étiquettes.
import { CAMERA_FOV, type CameraPose } from './camera';
import { FacetBuilder, boundsOf, type Facets } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { PlaceId } from './levelPlan';
import { sceneSpot } from './questionScene';
import type { ItemScene, SurPlaceObject } from './questions';
import { groundUnderFeet } from './worldHabitants';

/** La scène d'un item joué sur place : ses objets, un par choix, dans l'ordre des choix. */
export type SurPlaceScene = Extract<ItemScene, { kind: 'surPlace' }>;

/** Les pierres : trois, à `step` l'une de l'autre, du nord au sud (de gauche à droite pour la caméra, à l'ouest). */
const SUR_PLACE_STONES = { count: 3, step: 1.4, radius: 0.5, height: 0.12 } as const;

/** Le plafond des triangles d'un objet du kit, et celui de la scène entière (trois objets et trois pierres). */
export const SUR_PLACE_OBJECT_TRIANGLES = { min: 40, max: 80 } as const;
export const SUR_PLACE_STONE_TRIANGLES = 12;
export const SUR_PLACE_TRIANGLES_MAX = SUR_PLACE_STONES.count * (SUR_PLACE_OBJECT_TRIANGLES.max + SUR_PLACE_STONE_TRIANGLES);

/**
 * La station de chaque lieu joué sur place, depuis le sol de sa scénette (`sceneSpot`) : à la Mangrove, douze unités à
 * l'ouest et quatre au sud du platelage, hors de la boîte du lieu où l'on ne marche pas, sur un sol plat où l'on marche
 * (relevé du terrain du 31 octobre 2026) ; le lieu, son ponton et sa cabane restent au fond, à droite la porte.
 */
const STATIONS: Readonly<Partial<Record<PlaceId, { dx: number; dz: number }>>> = { mangrove: { dx: -12, dz: 4 } };

/** Un lieu qui a sa station (et donc son kit). */
export const hasSurPlaceStation = (place: PlaceId): boolean => Object.hasOwn(STATIONS, place);

/** Kéo à la station : derrière les pierres (à l'est, loin de la caméra), au tiers gauche de l'image, tourné vers les objets. */
const KEO_AT_STATION = { dx: 3.6, dz: -4.2 } as const;

/**
 * La caméra de la station : la plongée, le recul depuis l'objet du milieu, la hauteur visée au-dessus des pierres, et où
 * ce point tombe à l'écran (`across` de la largeur, `down` de la hauteur) : toujours au même endroit, la bulle et le
 * rappel n'y changent rien (référent dys : rien ne bouge à la station).
 */
export const SUR_PLACE_CAMERA = { pitch: (15.5 * Math.PI) / 180, distance: 6.5, aim: 0.3, across: 0.6, down: 0.64 } as const;

/** Le point du sol où Kéo s'arrête (la marche y mène), ou rien si le lieu ne se joue pas sur place. */
export function surPlaceStation(place: PlaceId): Vec2 | null {
  const s = STATIONS[place];
  if (!s) return null;
  const o = sceneSpot(place);
  return { x: o.x + s.dx, z: o.z + s.dz };
}

/** La station posée : les pierres, Kéo et le point visé par la caméra, à la hauteur du sol. */
export interface SurPlaceSite {
  /** Le sol au milieu des pierres. */
  floor: Vec3;
  /** Le haut de chaque pierre (le pied de son objet), du nord au sud. */
  stones: Vec3[];
  keo: { at: Vec2; yaw: number };
}

export function surPlaceSite(place: PlaceId, ground: (x: number, z: number) => number): SurPlaceSite | null {
  const at = surPlaceStation(place);
  if (!at) return null;
  const { count, step, height } = SUR_PLACE_STONES;
  const stones = Array.from({ length: count }, (_, i) => {
    const z = at.z + (i - (count - 1) / 2) * step;
    return { x: at.x, y: groundUnderFeet(at.x, z, ground) + height, z };
  });
  const keo = { x: at.x + KEO_AT_STATION.dx, z: at.z + KEO_AT_STATION.dz };
  // Le visage vers +z au cap nul : Kéo regarde l'objet du milieu.
  const yaw = Math.atan2(at.x - keo.x, at.z - keo.z);
  return { floor: { x: at.x, y: groundUnderFeet(at.x, at.z, ground), z: at.z }, stones, keo: { at: keo, yaw } };
}

/**
 * La pose fixe de la caméra à la station : à l'ouest des pierres, le regard vers l'est, l'objet du milieu visé à
 * `SUR_PLACE_CAMERA.aim` au-dessus de sa pierre, à `distance` en arrière, en plongée de `pitch` ; le décalage met le point
 * visé à `across` de la largeur et `down` de la hauteur de l'écran, quelle que soit la bulle.
 */
export function surPlacePose(site: SurPlaceSite, width: number, height: number): { pose: CameraPose; shift: { x: number; y: number } } {
  const mid = site.stones[Math.floor(site.stones.length / 2)];
  const target = { x: mid.x, y: mid.y + SUR_PLACE_CAMERA.aim, z: mid.z };
  const { pitch, distance, across, down } = SUR_PLACE_CAMERA;
  return {
    pose: { target, position: { x: target.x - distance * Math.cos(pitch), y: target.y + distance * Math.sin(pitch), z: target.z }, fov: CAMERA_FOV, lens: 0 },
    shift: { x: width * (0.5 - across), y: height * (0.5 - down) },
  };
}

// ---------- Le kit ----------

/** Les couleurs du kit : des aplats francs, jamais presque noirs ; `grey`, la silhouette d'un objet écarté. */
const K = {
  stone: 0xc8bfae,
  stoneSide: 0x9c937f,
  water: 0x2f8fc8,
  white: 0xf2eee4,
  whiteShade: 0xd9d4c8,
  beak: 0xd9a441,
  legs: 0x6f6a5e,
  fur: 0x7a553a,
  furTop: 0x9a7352,
  belly: 0xb08c6a,
  wing: 0x55423a,
  teal: 0x3a8f9f,
  tealTop: 0x5fb3c2,
  wingPale: 0xdbe7ea,
  fish: 0x5b8db0,
  fishTop: 0x9cc3da,
  fishTail: 0x46769a,
  eye: 0x2f3e46,
  spider: 0x6b5a4e,
  spiderTop: 0x8d7a6a,
  grey: 0x9aa0a3,
  greyTop: 0xb5babd,
} as const;

type Palette = Record<keyof typeof K, number>;
const GREY: Palette = Object.fromEntries(Object.keys(K).map((k) => [k, k.endsWith('Top') || k === 'whiteShade' || k === 'belly' ? K.greyTop : K.grey])) as Palette;

/** Une touche verticale, face à la caméra (à l'ouest, vers -x) : du point bas au point haut, dans le plan x = `x`. */
function stroke(b: FacetBuilder, x: number, from: readonly [number, number], to: readonly [number, number], w: number, color: number): void {
  const [lo, hi] = from[0] <= to[0] ? [from, to] : [to, from];
  b.quad([x, lo[0], lo[1] - w / 2], [x, lo[0], lo[1] + w / 2], [x, hi[0], hi[1] + w / 2], [x, hi[0], hi[1] - w / 2], color);
}

/** Un pan dressé face à la caméra, du point bas au point haut, de largeur `w` à son bout : une aile. */
function wing(b: FacetBuilder, x: number, from: readonly [number, number], to: readonly [number, number], w: number, color: number): void {
  const d = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
  const nx = (-(to[1] - from[1]) / d) * (w / 2);
  const ny = ((to[0] - from[0]) / d) * (w / 2);
  b.quad([x, from[0], from[1]], [x, to[0] - ny * 0.3, to[1] - nx * 0.3], [x, to[0] + ny, to[1] + nx], [x, from[0] + ny * 0.5, from[1] + nx * 0.5], color);
}

/** Une aile plate, vue de dessus, relevée vers la caméra du côté est (`lift`) pour qu'elle se lise en plongée. */
function flat(b: FacetBuilder, x0: number, x1: number, y: number, z0: number, z1: number, color: number, lift = 0.08): void {
  b.quad([x0, y, z0], [x0, y, z1], [x1, y + lift, z1], [x1, y + lift, z0], color);
}

/** L'aigrette, debout, de profil : les plumes blanches, deux longues pattes, le long cou, le bec. */
function aigrette(b: FacetBuilder, o: Vec3, c: Palette): void {
  const leg = 0.42;
  b.box({ x: o.x, y: o.y, z: o.z - 0.1 }, [0.05, leg, 0.05], c.legs);
  b.box({ x: o.x, y: o.y, z: o.z + 0.1 }, [0.05, leg, 0.05], c.legs);
  b.box({ x: o.x, y: o.y + leg, z: o.z }, [0.26, 0.26, 0.56], c.whiteShade, c.white);
  // La queue, un peu relevée, vers le sud.
  b.box({ x: o.x, y: o.y + leg + 0.14, z: o.z + 0.36 }, [0.14, 0.08, 0.2], c.whiteShade, c.white);
  // Le cou vers le nord, la tête au bout, le bec jaune.
  b.box({ x: o.x, y: o.y + leg + 0.22, z: o.z - 0.26 }, [0.09, 0.4, 0.09], c.whiteShade, c.white);
  b.box({ x: o.x, y: o.y + leg + 0.6, z: o.z - 0.3 }, [0.13, 0.13, 0.2], c.whiteShade, c.white);
  b.prism({ x: o.x, y: o.y + leg + 0.66, z: o.z - 0.4, pitch: -Math.PI / 2 }, 0.03, 0, 0.22, 4, c.beak);
}

/** La chauve-souris, posée, les ailes de peau à demi ouvertes : le corps brun à poils, les oreilles pointues. */
function chauveSouris(b: FacetBuilder, o: Vec3, c: Palette): void {
  b.box({ x: o.x, y: o.y, z: o.z }, [0.22, 0.3, 0.26], c.fur, c.furTop);
  b.box({ x: o.x - 0.11, y: o.y + 0.05, z: o.z }, [0.02, 0.18, 0.16], c.belly);
  b.box({ x: o.x, y: o.y + 0.3, z: o.z }, [0.18, 0.16, 0.18], c.fur, c.furTop);
  b.prism({ x: o.x, y: o.y + 0.46, z: o.z - 0.06 }, 0.035, 0, 0.12, 3, c.fur);
  b.prism({ x: o.x, y: o.y + 0.46, z: o.z + 0.06 }, 0.035, 0, 0.12, 3, c.fur);
  // Les deux ailes, étalées de part et d'autre, leurs doigts en traits.
  b.box({ x: o.x, y: o.y + 0.1, z: o.z - 0.31 }, [0.03, 0.26, 0.38], c.wing);
  b.box({ x: o.x, y: o.y + 0.1, z: o.z + 0.31 }, [0.03, 0.26, 0.38], c.wing);
  stroke(b, o.x - 0.02, [o.y + 0.1, o.z - 0.14], [o.y + 0.38, o.z - 0.44], 0.03, c.fur);
  stroke(b, o.x - 0.02, [o.y + 0.1, o.z + 0.14], [o.y + 0.38, o.z + 0.44], 0.03, c.fur);
  stroke(b, o.x - 0.02, [o.y + 0.1, o.z - 0.28], [o.y + 0.36, o.z - 0.5], 0.03, c.fur);
  stroke(b, o.x - 0.02, [o.y + 0.1, o.z + 0.28], [o.y + 0.36, o.z + 0.5], 0.03, c.fur);
}

/**
 * La libellule, posée, de profil : le long corps fin, six pattes qui se comptent, et quatre ailes pâles dressées en
 * éventail face à la caméra (des ailes à plat ne se liraient pas en plongée).
 */
function libellule(b: FacetBuilder, o: Vec3, c: Palette): void {
  const y = o.y + 0.18;
  // Les six pattes, trois de chaque côté du corps, en traits verticaux.
  for (const dz of [-0.14, 0, 0.14]) {
    stroke(b, o.x - 0.07, [o.y, o.z + dz - 0.05], [y + 0.04, o.z + dz], 0.025, c.teal);
    stroke(b, o.x + 0.07, [o.y, o.z + dz + 0.05], [y + 0.04, o.z + dz], 0.025, c.teal);
  }
  b.box({ x: o.x, y, z: o.z - 0.05 }, [0.12, 0.11, 0.3], c.teal, c.tealTop);
  b.box({ x: o.x, y: y + 0.01, z: o.z + 0.38 }, [0.06, 0.06, 0.56], c.teal, c.tealTop);
  b.box({ x: o.x, y: y - 0.01, z: o.z - 0.26 }, [0.14, 0.14, 0.14], c.teal, c.tealTop);
  // Quatre ailes, deux de chaque côté, dressées depuis le dos : les deux du devant plus hautes, celles de derrière plus
  // couchées, chacune un long pan pâle.
  const back = y + 0.1;
  for (const side of [-1, 1]) {
    wing(b, o.x - 0.02, [back, o.z + side * 0.02], [back + 0.46, o.z + side * 0.34], 0.1, c.wingPale);
    wing(b, o.x + 0.02, [back, o.z + side * 0.04], [back + 0.26, o.z + side * 0.46], 0.09, c.wingPale);
  }
}

/** Le poisson, dans sa flaque peinte sur la pierre : le corps bleu à écailles, la queue, la nageoire du dos, l'œil. */
function poisson(b: FacetBuilder, o: Vec3, c: Palette): void {
  // La flaque : un aplat d'eau sur la pierre.
  b.quad([o.x - 0.42, o.y + 0.005, o.z - 0.5], [o.x - 0.42, o.y + 0.005, o.z + 0.5], [o.x + 0.42, o.y + 0.005, o.z + 0.5], [o.x + 0.42, o.y + 0.005, o.z - 0.5], c.water);
  b.box({ x: o.x, y: o.y + 0.02, z: o.z - 0.06 }, [0.16, 0.3, 0.56], c.fish, c.fishTop);
  b.box({ x: o.x, y: o.y + 0.08, z: o.z + 0.34 }, [0.04, 0.26, 0.2], c.fishTail);
  flat(b, o.x - 0.02, o.x + 0.02, o.y + 0.32, o.z - 0.2, o.z + 0.1, c.fishTail, 0.1);
  stroke(b, o.x - 0.09, [o.y + 0.08, o.z + 0.02], [o.y + 0.14, o.z + 0.14], 0.05, c.fishTail);
  b.box({ x: o.x - 0.08, y: o.y + 0.2, z: o.z - 0.26 }, [0.02, 0.06, 0.06], c.eye);
  b.box({ x: o.x + 0.08, y: o.y + 0.2, z: o.z - 0.26 }, [0.02, 0.06, 0.06], c.eye);
}

/** L'araignée : le gros abdomen, la tête, huit pattes écartées en arceaux, quatre de chaque côté, qui se comptent. */
function araignee(b: FacetBuilder, o: Vec3, c: Palette): void {
  const y = o.y + 0.16;
  for (const [i, dz] of [-0.3, -0.1, 0.1, 0.3].entries()) {
    const out = (i < 2 ? -1 : 1) * 0.42;
    for (const side of [-1, 1]) {
      const x = o.x + side * 0.1;
      // Un arceau : de la pierre jusqu'au genou, puis du genou au corps.
      stroke(b, x, [o.y, o.z + dz + out], [y + 0.14, o.z + dz + out / 2], 0.03, c.spider);
      stroke(b, x, [y + 0.14, o.z + dz + out / 2], [y + 0.04, o.z + dz], 0.03, c.spider);
    }
  }
  b.box({ x: o.x, y: y - 0.04, z: o.z + 0.1 }, [0.3, 0.26, 0.36], c.spider, c.spiderTop);
  b.box({ x: o.x, y, z: o.z - 0.2 }, [0.2, 0.16, 0.2], c.spider, c.spiderTop);
}

const DRAWINGS: Readonly<Record<SurPlaceObject, (b: FacetBuilder, o: Vec3, c: Palette) => void>> = {
  aigrette,
  'chauve-souris': chauveSouris,
  libellule,
  poisson,
  araignée: araignee,
};

/** Un objet du kit posé en `o` (le haut de sa pierre), tel quel ou en gris (écarté par un essai ou le joker). */
export function surPlaceObject(name: SurPlaceObject, o: Vec3 = { x: 0, y: 0, z: 0 }, greyed = false): Facets {
  const b = new FacetBuilder();
  DRAWINGS[name](b, o, greyed ? GREY : K);
  return b.build();
}

/** Une pierre plate, à `o` son dessus : un prisme à quatre pans, 12 triangles, tourné pour que les trois diffèrent. */
export function surPlaceStone(o: Vec3, yaw = 0): Facets {
  const b = new FacetBuilder();
  const { radius, height } = SUR_PLACE_STONES;
  b.prism({ x: o.x, y: o.y - height, z: o.z, yaw }, radius * 1.1, radius, height, 4, K.stoneSide, K.stone);
  return b.build();
}

/** Ce que la scène montre d'un item sur place : la réponse donnée, les rangs des bonnes réponses, les essais écartés. */
export interface SurPlaceLook {
  answered: boolean;
  right: readonly number[];
  picked: readonly number[];
}

/** Un objet à l'écran : le point de son étiquette (son haut) et sa boîte dans le monde ; `null`, un objet parti. */
export interface SurPlaceAnchor {
  top: Vec3;
  min: [number, number, number];
  max: [number, number, number];
}

/**
 * La scène de la station : les trois pierres, et sur chacune l'objet de son choix. Un objet écarté (un essai faux, le
 * joker) reste en gris ; après la bonne réponse, les deux autres partent d'un coup, la bonne reste seule sur sa pierre
 * (référent dys : jamais la couleur seule ; la page écrit l'étiquette, le cadre et la coche). Les pierres ne changent
 * jamais. `anchors[i]` : l'objet `i` pour l'étiquette et la cible de la page, ou `null` s'il est parti.
 */
export function surPlaceFacets(site: SurPlaceSite, scene: SurPlaceScene, look: SurPlaceLook): { facets: Facets; anchors: (SurPlaceAnchor | null)[] } {
  const b = new FacetBuilder();
  const anchors: (SurPlaceAnchor | null)[] = [];
  const succeeded = look.answered && look.right.length > 0;
  for (const [i, stone] of site.stones.entries()) {
    const f = surPlaceStone(stone, (i - 1) * 0.35);
    b.append(f);
    const name = scene.objects[i];
    if (!name || (succeeded && !look.right.includes(i))) {
      anchors.push(null);
      continue;
    }
    const object = surPlaceObject(name, stone, look.picked.includes(i));
    b.append(object);
    const { min, max } = boundsOf(object);
    anchors.push({ top: { x: (min[0] + max[0]) / 2, y: max[1], z: (min[2] + max[2]) / 2 }, min, max });
  }
  return { facets: b.build(), anchors };
}
