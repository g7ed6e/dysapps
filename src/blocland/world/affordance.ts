// Les signes des objets qu'on touche dans le monde de Blocland (affordance-blocland.md §8 et §9, tranché par le
// directeur artistique le 3 octobre 2026) : un cube flotte 1,2 bloc au-dessus du sommet de chaque objet touchable, en
// trois états, chacun avec sa pose, sa taille et son mouvement, jamais la couleur seule :
// - « à faire » : le losange d'or des bornes (un cube de 0,7 posé sur sa pointe), qui flotte en douceur et tourne, seul
//   cube qui bouge, et seulement sur l'île du bonhomme, tous en phase ;
// - « pas encore » : un cube de pierre gris mat de 0,5, posé à plat, immobile, aux arêtes crème ;
// - « lieu » : un cube crème de 0,8, posé à plat, immobile, aux arêtes brun sombre.
// Qui porte quoi : une borne à faire (or) ou pas jouable (pierre), un Gardien pas encore vaincu, le Bloc-Navire, chaque
// chantier en fantôme (un ouvrage, un monument à bâtir : un cube par chantier) ; l'école, la salle des trophées et un
// monument bâti (crème). Rien sur une borne réussie (sa pile d'étoiles reste, three/bornes.ts), un Gardien vaincu, un
// ouvrage construit, une créature (sa plaque, three/signes.ts) ; rien sur la Carte. Une chose ne porte jamais deux signes.
// Au toucher, c'est toujours le signe qui fait un petit saut (`sautDuSigne`), jamais l'objet. Et la zone de toucher :
// au moins 48 pixels à l'écran autour de chaque objet qui porte un signe (`zoneRetenue`). Code pur, sans Three.js :
// three/affordance.ts le dessine, world/budget.ts le compte (`signesCost`).
import type { BiomeId } from '../biomes';
import { getBridge } from './archipelago';
import type { PlaceId, VoxelCube } from './cube';
import type { EtatsDesObjets } from './modele';
import type { Cell, CreaturePlacement } from './paths';
import type { VehiclePlacement } from './terrain';

/** L'état d'un signe : à faire (l'or), pas encore (la pierre), un lieu (le crème). */
export type EtatDuSigne = 'aFaire' | 'pasEncore' | 'lieu';

/** Le côté du cube de chaque état, en blocs. */
export const COTE_DU_SIGNE: Readonly<Record<EtatDuSigne, number>> = { aFaire: 0.7, pasEncore: 0.5, lieu: 0.8 };

/** Les couleurs des signes (sRGB) : la face et ses arêtes. L'or est celui de la flèche « Commence ici ». */
export const COULEURS_DU_SIGNE: Readonly<Record<EtatDuSigne, { face: string; arete: string }>> = {
  aFaire: { face: '#ffc83c', arete: '#ffc83c' },
  // Plus clair que la roche (#7d7d7d, #9c9c9c) : on ne le prend pas pour un bloc du décor.
  pasEncore: { face: '#b3b3ab', arete: '#fff6e0' },
  // Le crème et le brun de la plaque des créatures (three/signes.ts) : la même famille de signes.
  lieu: { face: '#fff6e0', arete: '#2b2118' },
};

/** Le mouvement et la taille des signes, et la zone de toucher. */
export const SIGNE = {
  /** Le centre du cube, au-dessus du sommet de l'objet, en blocs. */
  auDessus: 1.2,
  /** Le losange d'or flotte en douceur : un sinus de ± 0,15 bloc, en 3 s, sans rebond. */
  flotte: { amplitude: 0.15, periodeS: 3 },
  /** Et fait un tour en 6 s. */
  tourS: 6,
  /** La taille minimale d'un cube à l'écran, en pixels CSS : il grossit quand la caméra s'éloigne. */
  minPx: 14,
  /** Le saut au toucher : une bosse de 0,2 bloc en 180 ms (70 ms de montée, 110 de descente), sans rebond. */
  saut: { hauteur: 0.2, monteeMs: 70, descenteMs: 110 },
  /** La zone de toucher d'un objet qui porte un signe, au moins ce carré à l'écran, en pixels CSS. */
  zonePx: 48,
  /** Une zone est masquée quand le sol touché est plus proche que l'objet d'au moins tant de blocs. */
  masque: 2,
  /** La largeur des arêtes, en part du côté du cube (environ 2 pixels à la taille minimale). */
  arete: 0.14,
} as const;

/** L'objet qui porte un signe, tel que la vue le rend à la page quand on le touche. */
export type ObjetTouche =
  | { genre: 'borne'; id: string }
  | { genre: 'gardien'; id: BiomeId }
  | { genre: 'navire'; port: BiomeId }
  | { genre: 'ouvrage'; id: string }
  | { genre: 'lieu'; id: PlaceId; ile: BiomeId };

/** La clé d'un objet : un signe par objet. */
export function cleDeLObjet(o: ObjetTouche): string {
  if (o.genre === 'navire') return 'navire';
  return `${o.genre}:${o.id}`;
}

/** Une boîte en cases du monde (le max compris : un cube en z occupe z à z + 1). */
export interface Boite {
  min: Cell;
  max: Cell;
}

/** Le signe d'un objet, en cases du monde. */
export interface SigneDObjet {
  cle: string;
  objet: ObjetTouche;
  etat: EtatDuSigne;
  /** Le centre du cube : `x`, `y` sur la grille, `z` la hauteur (sa place au repos). */
  x: number;
  y: number;
  z: number;
  /** Les îles où il est : le losange d'or ne flotte que sur l'île du bonhomme (un ouvrage en touche deux). */
  iles: BiomeId[];
  /** La boîte de l'objet : la zone de toucher la projette à l'écran, avec le signe. */
  boite: Boite;
}

/** Le sommet d'un objet : le plus haut z de ses cubes, + 1 (le dessus du cube), décalé de `dz`. */
export function sommetDe(cubes: readonly { z: number }[], dz = 0): number {
  let haut = -Infinity;
  for (const c of cubes) if (c.z > haut) haut = c.z;
  return haut + 1 + dz;
}

/** La hauteur du centre du signe d'un objet : 1,2 bloc au-dessus de son sommet. */
export function hauteurDuSigneDeLObjet(cubes: readonly { z: number }[], dz = 0): number {
  return sommetDe(cubes, dz) + SIGNE.auDessus;
}

/** La boîte de cubes, décalés de `o`. */
function boiteDe(cubes: readonly Cell[], o: Cell = { x: 0, y: 0, z: 0 }): Boite {
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const c of cubes) {
    min.x = Math.min(min.x, c.x + o.x);
    min.y = Math.min(min.y, c.y + o.y);
    min.z = Math.min(min.z, c.z + o.z);
    max.x = Math.max(max.x, c.x + o.x + 1);
    max.y = Math.max(max.y, c.y + o.y + 1);
    max.z = Math.max(max.z, c.z + o.z + 1);
  }
  return { min, max };
}

/** Le signe d'un objet, au-dessus du milieu de sa boîte. */
function signeAuDessus(objet: ObjetTouche, etat: EtatDuSigne, iles: BiomeId[], boite: Boite): SigneDObjet {
  return { cle: cleDeLObjet(objet), objet, etat, x: (boite.min.x + boite.max.x) / 2, y: (boite.min.y + boite.max.y) / 2, z: boite.max.z + SIGNE.auDessus, iles, boite };
}

/**
 * Le sommet de chaque borne de mission (le dessus de son ardoise), par « île:mission » : la pile d'étoiles d'une borne
 * réussie s'y pose (three/bornes.ts).
 */
export function sommetsDesBornes(cubes: readonly VoxelCube[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const c of cubes) if (c.quest) out.set(c.quest, Math.max(out.get(c.quest) ?? -Infinity, c.z + 1));
  return out;
}

/** Ce qu'il faut pour poser les signes : le monde en cubes, l'état des bornes, les personnages, le navire, le reste. */
export interface EntreeDesSignes {
  cubes: readonly VoxelCube[];
  /** L'état de chaque borne (« île:mission ») : une borne sans état connu n'a pas de signe. */
  quests?: readonly { id: string; state: 'new' | 'locked' | number }[];
  creatures?: readonly CreaturePlacement[];
  vehicle?: VehiclePlacement | null;
  /** Ce que les cubes ne disent pas (world/modele.ts) ; sans lui, tout ce qui n'est pas une borne à faire est « pas encore ». */
  etats?: EtatsDesObjets;
}

/**
 * Les signes des objets touchables d'un archipel, en cases du monde : un par objet, dans cet ordre (bornes, lieux et
 * monuments, ouvrages, Gardiens, navire). Une borne d'une île fermée n'en a pas (l'île entière se lit fermée).
 */
export function signesDesObjets({ cubes, quests = [], creatures = [], vehicle = null, etats }: EntreeDesSignes): SigneDObjet[] {
  const prets = new Set(etats?.chantiersPrets ?? []);
  // Les cubes des bornes, des lieux (sans leur îlot) et des ouvrages en fantôme, en un passage.
  const bornes = new Map<string, VoxelCube[]>();
  const fermees = new Set<string>();
  const lieux = new Map<PlaceId, { cubes: VoxelCube[]; ile: BiomeId; fantome: boolean }>();
  const ouvrages = new Map<string, VoxelCube[]>();
  for (const c of cubes) {
    if (c.quest) {
      const l = bornes.get(c.quest);
      if (l) l.push(c);
      else bornes.set(c.quest, [c]);
      if (c.muted) fermees.add(c.quest);
    } else if (c.place && !c.sol && c.place !== 'assembly') {
      const l = lieux.get(c.place);
      if (l) {
        l.cubes.push(c);
        l.fantome ||= Boolean(c.ghost);
      } else lieux.set(c.place, { cubes: [c], ile: c.tag as BiomeId, fantome: Boolean(c.ghost) });
    } else if (c.bridge && c.ghost) {
      const l = ouvrages.get(c.bridge);
      if (l) l.push(c);
      else ouvrages.set(c.bridge, [c]);
    }
  }
  const out: SigneDObjet[] = [];
  // Les bornes : à faire (jamais jouée, ou jouée sans étoile : elle se rejoue), l'or ; pas jouable, la pierre ; réussies,
  // rien (leur pile d'étoiles).
  for (const q of quests) {
    const l = bornes.get(q.id);
    if (!l || fermees.has(q.id) || (typeof q.state === 'number' && q.state > 0)) continue;
    out.push(signeAuDessus({ genre: 'borne', id: q.id }, q.state === 'locked' ? 'pasEncore' : 'aFaire', [q.id.split(':')[0] as BiomeId], boiteDe(l)));
  }
  // L'école, la salle des trophées, un monument bâti : le crème. Un monument à bâtir est un chantier : l'or si l'élève
  // peut y poser un bloc, sinon la pierre.
  for (const [id, l] of lieux) {
    const monument = id.startsWith('monument:') ? id.slice('monument:'.length) : null;
    const etat: EtatDuSigne = monument && l.fantome ? (prets.has(monument) ? 'aFaire' : 'pasEncore') : 'lieu';
    out.push(signeAuDessus({ genre: 'lieu', id, ile: l.ile }, etat, [l.ile], boiteDe(l.cubes)));
  }
  // Un ouvrage en fantôme : un cube au-dessus de sa case du milieu (la colonne de ses cubes), pas au-dessus de sa boîte
  // entière (une liaison qui monte le mettrait haut dans le ciel).
  for (const [id, l] of ouvrages) {
    const milieu = l[Math.floor(l.length / 2)];
    const colonne = l.filter((c) => c.x === milieu.x && c.y === milieu.y);
    const def = getBridge(id);
    const iles = def ? [def.from, def.to] : [milieu.tag as BiomeId];
    out.push({ ...signeAuDessus({ genre: 'ouvrage', id }, prets.has(id) ? 'aFaire' : 'pasEncore', iles, boiteDe(l)), x: milieu.x + 0.5, y: milieu.y + 0.5, z: hauteurDuSigneDeLObjet(colonne) });
  }
  // Un Gardien pas encore vaincu : l'or si son défi est prêt, sinon la pierre. Les créatures n'ont jamais de cube.
  for (const g of creatures) {
    if (g.kind !== 'guardian' || g.beaten || !g.cubes.length) continue;
    const pret = etats ? etats.gardiensPrets.includes(g.id) : true;
    out.push(signeAuDessus({ genre: 'gardien', id: g.id }, pret ? 'aFaire' : 'pasEncore', [g.id], boiteDe(g.cubes, g.origin)));
  }
  // Le Bloc-Navire : l'or s'il a un bloc à poser ou s'il peut partir, sinon la pierre.
  if (vehicle?.cubes.length)
    out.push(signeAuDessus({ genre: 'navire', port: vehicle.port }, etats?.navirePret ? 'aFaire' : 'pasEncore', [vehicle.port], boiteDe(vehicle.cubes, vehicle.origin)));
  return out;
}

// ---- Le mouvement

/** Le flottement du losange d'or, en blocs, au temps `t` de la scène (en secondes) : le même pour tous (en phase). */
export function flottementDuSigne(t: number): number {
  return SIGNE.flotte.amplitude * Math.sin((2 * Math.PI * t) / SIGNE.flotte.periodeS);
}

/** Le tour du losange d'or, en radians, au temps `t` de la scène : un tour en 6 s. */
export function tourDuSigne(t: number): number {
  return ((2 * Math.PI * t) / SIGNE.tourS) % (2 * Math.PI);
}

/**
 * Le saut du signe au toucher, en blocs, `ms` millisecondes après le doigt levé : 0 avant et après ; une seule bosse,
 * vive (un quart de sinus pour monter, un quart de cosinus pour redescendre), sans rebond. Rien à voir avec le saut lent
 * des révisions (world/signe.ts), qui dit « j'ai quelque chose pour toi » : celui-ci dit « je t'ai entendu ».
 */
export function sautDuSigne(ms: number): number {
  const { hauteur, monteeMs, descenteMs } = SIGNE.saut;
  if (!(ms > 0) || ms >= monteeMs + descenteMs) return 0;
  if (ms < monteeMs) return hauteur * Math.sin((Math.PI / 2) * (ms / monteeMs));
  return hauteur * Math.cos((Math.PI / 2) * ((ms - monteeMs) / descenteMs));
}

/**
 * L'échelle d'un cube de côté `cote` vu à `profondeur` (en blocs, devant la caméra), quand un bloc à une unité de
 * distance fait `pxParUnite` pixels : 1 de près, plus loin assez pour garder `SIGNE.minPx` pixels à l'écran.
 */
export function echelleDuSigne(cote: number, profondeur: number, pxParUnite: number): number {
  const px = (cote * pxParUnite) / Math.max(0.5, profondeur);
  return px >= SIGNE.minPx ? 1 : SIGNE.minPx / Math.max(1e-6, px);
}

// ---- La forme

/** La forme d'un signe, en triangles sans indices : positions et normales (x, y, z, l'axe y vers le haut, comme Three.js), et les sommets des arêtes. */
export interface FormeDuSigne {
  positions: Float32Array;
  normals: Float32Array;
  /** 1 pour un sommet d'une arête, 0 pour la face (une couleur par sommet, dans la même géométrie). */
  aretes: Uint8Array;
}

type V3 = [number, number, number];
/** Les faces d'un cube : la normale, puis deux axes dont le produit vectoriel est la normale (sens trigonométrique vu de dehors). */
const FACES: [V3, V3, V3][] = [
  [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
  [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
  [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
  [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
  [[0, 0, -1], [0, 1, 0], [1, 0, 0]],
];

/**
 * La forme d'un signe, centrée : le losange d'or, un cube plein (12 triangles) posé sur sa pointe (tourné d'un huitième
 * de tour autour de la profondeur, puis de la largeur, comme le losange d'avant) ; la pierre et le crème, un cube posé à
 * plat dont chaque face est un cadre (ses quatre arêtes) autour d'un carré, sans le dessous, qu'aucune caméra ne voit
 * (50 triangles).
 */
export function formeDuSigne(etat: EtatDuSigne): FormeDuSigne {
  const h = COTE_DU_SIGNE[etat] / 2;
  const pos: number[] = [];
  const nrm: number[] = [];
  const are: number[] = [];
  const quad = (pts: V3[], n: V3, arete: number) => {
    for (const k of [0, 1, 2, 0, 2, 3]) {
      pos.push(...pts[k]);
      nrm.push(...n);
      are.push(arete);
    }
  };
  const plein = etat === 'aFaire';
  for (const [n, u, v] of FACES) {
    if (!plein && n[1] < 0) continue;
    const p = (a: number, b: number): V3 => [0, 1, 2].map((i) => n[i] * h + u[i] * a + v[i] * b) as V3;
    if (plein) {
      quad([p(-h, -h), p(h, -h), p(h, h), p(-h, h)], n, 0);
      continue;
    }
    const i = h - SIGNE.arete * 2 * h;
    quad([p(-h, -h), p(h, -h), p(i, -i), p(-i, -i)], n, 1);
    quad([p(h, -h), p(h, h), p(i, i), p(i, -i)], n, 1);
    quad([p(h, h), p(-h, h), p(-i, i), p(i, i)], n, 1);
    quad([p(-h, h), p(-h, -h), p(-i, -i), p(-i, i)], n, 1);
    quad([p(-i, -i), p(i, -i), p(i, i), p(-i, i)], n, 0);
  }
  const positions = Float32Array.from(pos);
  const normals = Float32Array.from(nrm);
  if (plein) {
    // Sur sa pointe : un huitième de tour autour de z, puis autour de x (l'ordre des angles d'Euler de Three.js).
    const c = Math.SQRT1_2;
    for (const t of [positions, normals])
      for (let k = 0; k < t.length; k += 3) {
        const [x, y, z] = [t[k], t[k + 1], t[k + 2]];
        const [x1, y1] = [c * x - c * y, c * x + c * y];
        t[k] = x1;
        t[k + 1] = c * y1 - c * z;
        t[k + 2] = c * y1 + c * z;
      }
  }
  return { positions, normals, aretes: Uint8Array.from(are) };
}

/** Les triangles d'un signe de chaque état. */
export const TRIANGLES_DU_SIGNE: Readonly<Record<EtatDuSigne, number>> = {
  aFaire: formeDuSigne('aFaire').positions.length / 9,
  pasEncore: formeDuSigne('pasEncore').positions.length / 9,
  lieu: formeDuSigne('lieu').positions.length / 9,
};

/** Triangles et appels de dessin des signes : un maillage instancié par état présent. */
export function coutDesSignes(signes: readonly Pick<SigneDObjet, 'etat'>[]): { triangles: number; drawCalls: number } {
  const etats = new Set(signes.map((s) => s.etat));
  return { triangles: signes.reduce((n, s) => n + TRIANGLES_DU_SIGNE[s.etat], 0), drawCalls: etats.size };
}

// ---- La zone de toucher

/** La zone de toucher d'un objet à l'écran : son centre et sa taille en pixels CSS, et sa distance à la caméra (en blocs). */
export interface ZoneDeToucher {
  x: number;
  y: number;
  w: number;
  h: number;
  /** La distance de la caméra au point le plus proche de l'objet. */
  distance: number;
}

/** La zone de toucher d'un rectangle à l'écran (l'objet et son signe projetés) : élargie à `SIGNE.zonePx` au moins, autour de son centre. */
export function zoneDeToucher(x0: number, y0: number, x1: number, y1: number, distance: number): ZoneDeToucher {
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: Math.max(SIGNE.zonePx, x1 - x0), h: Math.max(SIGNE.zonePx, y1 - y0), distance };
}

/**
 * La zone retenue sous le doigt levé, quand rien n'a été touché directement (un toucher direct sur la géométrie passe
 * d'abord : world/scene.ts, `toucheRetenue`) : parmi les zones qui contiennent le doigt, celle dont le centre est le plus
 * proche du doigt (en pixels), puis l'objet le plus proche de la caméra. Une zone est écartée quand le sol touché
 * (`sol`, sa distance le long du rayon, ou `null`) est plus proche que l'objet de `SIGNE.masque` blocs : l'objet est
 * caché derrière une colline, une maison. L'indice dans `zones`, ou −1.
 */
export function zoneRetenue(zones: readonly ZoneDeToucher[], doigt: { x: number; y: number }, sol: number | null): number {
  let best = -1;
  let bestPx = Infinity;
  zones.forEach((z, i) => {
    if (Math.abs(doigt.x - z.x) > z.w / 2 || Math.abs(doigt.y - z.y) > z.h / 2) return;
    if (sol !== null && sol < z.distance - SIGNE.masque) return;
    const px = Math.hypot(doigt.x - z.x, doigt.y - z.y);
    if (px < bestPx || (px === bestPx && z.distance < zones[best].distance)) {
      best = i;
      bestPx = px;
    }
  });
  return best;
}
