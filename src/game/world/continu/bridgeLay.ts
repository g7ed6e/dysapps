// La pose d'un pont qu'on vient de rebâtir (GD-20, point 3, « vraies terres, vrais ponts », « La pose », second lot) : la
// fiche se ferme, la caméra ne bouge pas ; les piles se relèvent de l'eau, puis le tablier s'avance d'une culée à
// l'autre, puis les garde-corps et les lanternes montent du tablier, en 3 s environ ; un seul toc à la fin, puis la
// brume de la terre se lève en fondu doux. Rien ne rebondit, rien ne clignote : les lanternes montent avec les
// garde-corps, de leur couleur, sans lumière qui s'allume. La vue garde ce qui ne bouge pas (les culées, les départs
// d'arche : `bridgeLayRest`) dans le maillage des lieux, et pose le reste dans son maillage de pose, à part le temps de
// la pose : aucun appel de plus. Ici, les sommets de chaque instant, écrits dans un tableau que la vue donne à Three.js
// (rien n'est créé à chaque image). Code pur.
import { BRIDGE, STUMP_TOP, SWING, bridgeParts, bridgeSite, bridgeSurface, isSwing, stumpPile, swingMove, swingRuin, swingRustDeck, type BridgeSite } from './bridges';
import { boundsOf, mergeFacets, type Facets } from './facets';
import type { LinkedLand } from './lands';

/**
 * Le déroulé de la pose, en secondes (artiste technique 3D) : chaque pile se relève en `pile`, la suivante partie
 * `pileGap` après ; le tablier s'avance en `deck` ; les garde-corps et les lanternes montent en `rails` ; le toc,
 * puis la brume se lève en `fade`.
 */
export const BRIDGE_LAY = { pile: 0.7, pileGap: 0.15, deck: 1.0, rails: 0.8, fade: 1.2 } as const;

/**
 * Le déroulé de la pose du pont tournant des docks (intention du 22 octobre 2026, « La pose ») : la volée ouverte se
 * redresse en `raise` (son bout sort de l'eau, la rouille passe au fer bruni) ; elle pivote d'un quart de tour sur son
 * tambour en `turn`, en ralentissant à l'arrivée ; les garde-corps et les lanternes montent du tablier en `rails` ; le
 * toc à 3 s au plus.
 */
export const SWING_LAY = { raise: 0.6, turn: 1.6, rails: 0.7 } as const;

/** Les temps de la pose : les piles, le tablier, les garde-corps et les lanternes ; la volée du pont tournant. */
const STAGE_PILES = 0;
const STAGE_DECK = 1;
const STAGE_RAILS = 2;
const STAGE_SWING = 3;

/**
 * Ce qui se relève d'un pont : ses sommets à leur place (`facets`), et pour chacun son temps (`stage`) et son repère :
 * pour une pile, de combien elle part sous sa place (`param`) et quand elle part (`delay`) ; pour le tablier, sa
 * distance au bout de ce côté-ci sur la ligne du pont ; pour un garde-corps ou une lanterne, le dessus du pont sous lui,
 * d'où il monte. `sink` : jusqu'où une pile descend sous sa place (la boîte englobante de la vue la suit).
 */
export interface BridgeLay {
  land: LinkedLand;
  facets: Facets;
  stage: Uint8Array;
  param: Float32Array;
  delay: Float32Array;
  /** Le tablier va de `deck[0]` à `deck[1]` sur la ligne du pont. */
  deck: readonly [number, number];
  dir: { x: number; z: number };
  near: { x: number; z: number };
  sink: number;
  /** Les secondes jusqu'au toc (toutes les parties posées). */
  landed: number;
  /** Le nombre de sommets des piles, puis des piles et du tablier : ce qui n'est pas encore à son temps ne se dessine pas. */
  ends: readonly [number, number];
  /** Quand le tablier (`ends[1]`), puis tout le reste, commencent à se dessiner, en secondes. */
  drawAt: readonly [number, number];
  /** Quand les garde-corps et les lanternes commencent à monter. */
  railsAt: number;
  /**
   * Le pont tournant (au bassin à flot du 4e) : son site, les couleurs rouillées d'où part le fondu de la volée, et la
   * boîte de tout ce que la pose dessine (la volée ouverte comprise : l'élimination hors champ reste allumée). Absent :
   * un pont à piles.
   */
  swing: { site: BridgeSite; rust: Float32Array; bounds: { min: [number, number, number]; max: [number, number, number] } } | null;
}

/** La pose d'un instant : toutes les parties posées (le toc), la brume levée (0 à 1), le fondu fini (la phrase peut venir). */
export interface BridgeLayState {
  landed: boolean;
  fade: number;
  done: boolean;
}

/** Une part de 0 à 1, adoucie à l'arrivée : ce qui se pose ralentit, sans rebond. */
const ease = (e: number) => {
  const u = Math.min(1, Math.max(0, e));
  return 1 - (1 - u) * (1 - u);
};

const lays = new Map<LinkedLand, BridgeLay>();

/** Ce qui se relève du pont d'une terre (calculé une fois). */
export function bridgeLay(land: LinkedLand): BridgeLay {
  const known = lays.get(land);
  if (known) return known;
  const lay = isSwing(land) ? swingLay(land) : pilesLay(land);
  lays.set(land, lay);
  return lay;
}

/** La pose d'un pont à piles : les piles se relèvent, le tablier s'avance, les garde-corps et les lanternes montent. */
function pilesLay(land: LinkedLand): BridgeLay {
  const s = bridgeSite(land);
  const parts = bridgeParts(land);
  const facets = mergeFacets([...parts.piles, parts.deck, parts.rails]);
  const n = facets.positions.length / 3;
  const stage = new Uint8Array(n);
  const param = new Float32Array(n);
  const delay = new Float32Array(n);
  // Le haut d'une pile : le dessus de son chaperon.
  const pileTop = BRIDGE.deck - BRIDGE.plank - 0.24;
  // Une pile part tout entière sous l'eau ; à la place d'un moignon, elle part de son haut (les moignons se relèvent).
  const under = pileTop + 0.4;
  const fromStump = pileTop - STUMP_TOP;
  let i = 0;
  parts.piles.forEach((f, k) => {
    const sink = stumpPile(land, k) ? fromStump : under;
    for (let end = i + f.positions.length / 3; i < end; i++) {
      stage[i] = STAGE_PILES;
      param[i] = sink;
      delay[i] = k * BRIDGE_LAY.pileGap;
    }
  });
  const along = (j: number) => (facets.positions[j * 3] - s.near.x) * s.dir.x + (facets.positions[j * 3 + 2] - s.near.z) * s.dir.z;
  const pilesCount = i;
  for (let end = i + parts.deck.positions.length / 3; i < end; i++) {
    stage[i] = STAGE_DECK;
    param[i] = along(i);
  }
  const deckCount = i;
  for (; i < n; i++) {
    stage[i] = STAGE_RAILS;
    param[i] = bridgeSurface(s, along(i));
  }
  const pilesEnd = (parts.piles.length - 1) * BRIDGE_LAY.pileGap + BRIDGE_LAY.pile;
  return {
    land,
    facets,
    stage,
    param,
    delay,
    deck: [s.water[0] + BRIDGE.over - 0.3, s.water[1] - BRIDGE.over + 0.3],
    dir: s.dir,
    near: s.near,
    sink: under,
    landed: pilesEnd + BRIDGE_LAY.deck + BRIDGE_LAY.rails,
    ends: [pilesCount, deckCount],
    drawAt: [pilesEnd, pilesEnd + BRIDGE_LAY.deck],
    railsAt: pilesEnd + BRIDGE_LAY.deck,
    swing: null,
  };
}

/**
 * La pose du pont tournant : la volée (fermée, à sa place de pont rebâti, dans `facets`), qui part ouverte et affaissée
 * comme dans la ruine ; puis les garde-corps et les lanternes.
 */
function swingLay(land: LinkedLand): BridgeLay {
  const s = bridgeSite(land);
  const parts = bridgeParts(land);
  const facets = mergeFacets([parts.deck, parts.rails]);
  const n = facets.positions.length / 3;
  const deckCount = parts.deck.positions.length / 3;
  const stage = new Uint8Array(n);
  const param = new Float32Array(n);
  const along = (j: number) => (facets.positions[j * 3] - s.near.x) * s.dir.x + (facets.positions[j * 3 + 2] - s.near.z) * s.dir.z;
  for (let i = 0; i < n; i++) {
    stage[i] = i < deckCount ? STAGE_SWING : STAGE_RAILS;
    if (i >= deckCount) param[i] = bridgeSurface(s, along(i));
  }
  const rust = new Float32Array(facets.colors);
  rust.set(swingRustDeck(land).colors);
  // La boîte : le pont fermé et la volée ouverte (la ruine), et une marge pour le redressement (le bout de la volée
  // s'allonge un peu, à plat, pendant qu'elle se redresse) ; elle l'encadre à tout instant de la pose.
  const closed = boundsOf(facets);
  const open = boundsOf(swingRuin(s));
  const pad = 0.5;
  const bounds = {
    min: [0, 1, 2].map((k) => Math.min(closed.min[k], open.min[k]) - pad) as [number, number, number],
    max: [0, 1, 2].map((k) => Math.max(closed.max[k], open.max[k]) + pad) as [number, number, number],
  };
  const turned = SWING_LAY.raise + SWING_LAY.turn;
  return {
    land,
    facets,
    stage,
    param,
    delay: new Float32Array(n),
    deck: [s.water[0], s.water[1]],
    dir: s.dir,
    near: s.near,
    sink: 0,
    landed: turned + SWING_LAY.rails,
    ends: [0, deckCount],
    drawAt: [0, turned],
    railsAt: turned,
    swing: { site: s, rust, bounds },
  };
}

/**
 * Les sommets de ce qui se relève, `u` secondes après le début de la pose, écrits dans `out` (de la taille de
 * `lay.facets.positions`) : chaque pile monte de sous sa place, l'une après l'autre ; le tablier s'avance depuis la
 * culée de ce côté-ci (ses sommets au-delà de son bout ramenés sur lui) ; les garde-corps et les lanternes montent du
 * dessus du pont. Rien n'est créé.
 */
export function bridgeLayPositions(lay: BridgeLay, u: number, out: Float32Array, normals?: Float32Array): void {
  const rest = lay.facets.positions;
  const deckE = ease((u - lay.drawAt[0]) / BRIDGE_LAY.deck);
  const front = lay.deck[0] + (lay.deck[1] - lay.deck[0]) * deckE;
  const railsE = ease((u - lay.railsAt) / (lay.swing ? SWING_LAY.rails : BRIDGE_LAY.rails));
  // La volée du pont tournant : redressée, puis tournée jusqu'à sa place (`swingAt`).
  const sag = SWING.sag * (1 - ease(u / SWING_LAY.raise));
  const turn = SWING.open * (1 - ease((u - SWING_LAY.raise) / SWING_LAY.turn));
  const n = rest.length / 3;
  for (let i = 0; i < n; i++) {
    const x = rest[i * 3];
    const y = rest[i * 3 + 1];
    const z = rest[i * 3 + 2];
    out[i * 3] = x;
    out[i * 3 + 2] = z;
    const st = lay.stage[i];
    if (st === STAGE_SWING && lay.swing) {
      swingMove(lay.swing.site, x, y, z, sag, turn, out, i * 3);
      if (normals) {
        const nr = lay.facets.normals;
        swingMove(lay.swing.site, nr[i * 3], nr[i * 3 + 1], nr[i * 3 + 2], sag, turn, normals, i * 3, true);
      }
    } else if (st === STAGE_PILES) {
      out[i * 3 + 1] = y - lay.param[i] * (1 - ease((u - lay.delay[i]) / BRIDGE_LAY.pile));
    } else if (st === STAGE_DECK) {
      out[i * 3 + 1] = y;
      const back = lay.param[i] - front;
      if (back > 0) {
        out[i * 3] = x - lay.dir.x * back;
        out[i * 3 + 2] = z - lay.dir.z * back;
      }
    } else {
      const base = lay.param[i];
      out[i * 3 + 1] = base + (y - base) * railsE;
    }
  }
}

/**
 * Combien de sommets se dessinent `u` secondes après le début de la pose : les piles d'abord, le tablier à son temps, puis
 * les garde-corps et les lanternes (avant, ils seraient à plat sur le tablier).
 */
export function bridgeLayDrawn(lay: BridgeLay, u: number): number {
  if (u < lay.drawAt[0]) return lay.ends[0];
  if (u < lay.drawAt[1]) return lay.ends[1];
  return lay.facets.positions.length / 3;
}

/**
 * Les couleurs de la pose du pont tournant, `u` secondes après son début, écrites dans `out` : la volée passe de la
 * rouille au fer bruni par un fondu court, le temps qu'elle se redresse. Faux pour un pont à piles (rien à écrire).
 */
export function bridgeLayColors(lay: BridgeLay, u: number, out: Float32Array): boolean {
  if (!lay.swing) return false;
  const k = Math.min(1, Math.max(0, u / SWING_LAY.raise));
  const from = lay.swing.rust;
  const to = lay.facets.colors;
  for (let i = 0; i < from.length; i++) out[i] = from[i] + (to[i] - from[i]) * k;
  return true;
}

/** La pose `u` secondes après son début, écrite dans `out` (la vue l'appelle à chaque image, sans rien créer). */
export function bridgeLayAt(lay: BridgeLay, u: number, out: BridgeLayState): BridgeLayState {
  out.landed = u >= lay.landed;
  out.fade = out.landed ? Math.min(1, (u - lay.landed) / BRIDGE_LAY.fade) : 0;
  out.done = out.fade >= 1;
  return out;
}
