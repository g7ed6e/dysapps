// La géométrie des liaisons que pose l'élève (GD-9) : leur tracé dans la disposition du moment, posées dans l'ordre
// de la sauvegarde, et ce qu'en savent les règles (`LinkGeometry`, ./archipelago.ts) : la nature d'une liaison (un pont
// jusqu'à 36 cases, un bac au-delà, un pont dans le ciel) et si une liaison de plus tiendrait. Code pur, sans Three.js ;
// chargé au démarrage de l'application (src/main.tsx) et des tests (src/setupTests.ts), qui donnent ainsi la grille
// aux règles.
import type { BiomeId } from '../biomes';
import { type BridgeDef, type BridgeKind, BRIDGES, bridgesOf, getBridge, otherEnd, provideLinkGeometry, SHORT_LINK } from './archipelago';
import { type ArchipelagoId, archipelagoOfIsland, DANS_LE_CIEL, mapOf } from './map';
import { cacheDeLaDisposition } from './placement';
import { liaisonEntreReunis, LONGUEUR_LONGUE, type TraceDeLiaison, TraceurDeRegion } from './routing';
import { ecueilsDe } from './terrain/sea';


/** Le tracé d'une liaison seule dans la disposition (sans les autres liaisons) : ce qui fait sa nature. */
const seules = cacheDeLaDisposition<string, TraceDeLiaison | null>();

/** Le traceur d'une région, sans aucune liaison : la terre, les îlots, les quais et les écueils. */
function traceurVide(a: ArchipelagoId): TraceurDeRegion {
  return new TraceurDeRegion(a, { lieux: mapOf(a), ecueils: ecueilsDe(a) });
}

const traceursVides = cacheDeLaDisposition<ArchipelagoId, TraceurDeRegion>();

/** Le tracé d'une liaison seule dans la disposition (sans les autres liaisons). */
function traceSeule(b: BridgeDef): TraceDeLiaison | null {
  let t = seules.get(b.id);
  if (t === undefined) {
    const a = archipelagoOfIsland(b.from);
    let vide = traceursVides.get(a);
    if (!vide) traceursVides.set(a, (vide = traceurVide(a)));
    t = vide.essayer(b, LONGUEUR_LONGUE);
    seules.set(b.id, t);
  }
  return t;
}

/**
 * Le tracé de repli d'une liaison posée que le traceur ne refait pas (une sauvegarde d'avant GD-9, posée quand les
 * lieux n'étaient pas à la même place) : celui qu'elle prendrait seule, sur la disposition du moment. Il évite la terre,
 * les îlots des Gardiens et les écueils ; faute de quoi la liaison garde son tracé d'origine (`traceDOrigine`).
 */
export function traceDeRepli(b: BridgeDef): TraceDeLiaison | null {
  return traceSeule(b);
}

/**
 * La nature d'une liaison dans la disposition, les liaisons de la partie posées (`liaisonsPosees`) : un sentier entre
 * deux lieux réunis ; sinon, selon son tracé (le sien si elle est posée, celui qu'elle prendrait sinon, ou à défaut
 * celui qu'elle aurait seule), un pont jusqu'à `SHORT_LINK` cases, un bac jusqu'à 96 (un pont dans le ciel, où un bac
 * aurait ses poteaux dans le vide) ; `null` si elle ne se trace pas.
 */
export function linkKind(b: BridgeDef): BridgeKind | null {
  if (liaisonEntreReunis(b)) return 'sentier';
  const t = traceDeLaLiaison(b, posees) ?? traceSeule(b);
  if (!t) return null;
  return t.cases.length <= SHORT_LINK || DANS_LE_CIEL[archipelagoOfIsland(b.from)] ? 'pont' : 'bac';
}

/**
 * Les voisins d'un lieu dans la disposition : ceux qu'un pont relierait (une liaison qui, seule, tient en `SHORT_LINK`
 * cases), et celui avec qui il est réuni. La vue d'un lieu les cadre avec lui (`viewZone`).
 */
export function voisinsDe(id: BiomeId): BiomeId[] {
  return bridgesOf(id)
    .filter((b) => {
      if (liaisonEntreReunis(b)) return true;
      const t = traceSeule(b);
      return t !== null && t.cases.length <= SHORT_LINK;
    })
    .map((b) => otherEnd(b, id));
}

/** Les liaisons posées d'une région, dans l'ordre : le pont déjà construit au départ, puis celles de la sauvegarde. */
function poseesDe(a: ArchipelagoId, built: readonly string[]): BridgeDef[] {
  const out = BRIDGES.filter((b) => b.cost === 0 && archipelagoOfIsland(b.from) === a);
  for (const id of built) {
    const b = getBridge(id);
    if (b && b.cost !== 0 && archipelagoOfIsland(b.from) === a && !out.includes(b)) out.push(b);
  }
  return out;
}

/** Les liaisons posées d'une région tracées, et le traceur qui dit si une de plus tiendrait. */
interface EtatDesLiaisons {
  traces: Map<string, TraceDeLiaison | null>;
  traceur: TraceurDeRegion;
  essais: Map<string, TraceDeLiaison | null>;
}

const etats = cacheDeLaDisposition<string, EtatDesLiaisons>();

/** Le tracé des liaisons posées d'une région (mémorisé par disposition et par liste de liaisons posées). */
function etatDe(a: ArchipelagoId, built: readonly string[]): EtatDesLiaisons {
  const posees = poseesDe(a, built);
  const cle = `${a}|${posees.map((b) => b.id).join(',')}`;
  let e = etats.get(cle);
  if (!e) {
    // Peu de listes différentes dans une partie ; on oublie les anciennes au-delà de quelques-unes.
    if (etats.size > 32) etats.clear();
    const traceur = traceurVide(a);
    const traces = new Map<string, TraceDeLiaison | null>();
    for (const b of posees) if (!liaisonEntreReunis(b)) traces.set(b.id, traceur.poser(b, LONGUEUR_LONGUE));
    e = { traces, traceur, essais: new Map() };
    etats.set(cle, e);
  }
  return e;
}

/**
 * Le tracé d'une liaison, celles de `built` posées : le sien si elle est posée (`null` si le traceur ne la refait pas :
 * elle garde alors son tracé d'origine, `bridgePath`), sinon celui qu'elle prendrait, posée après elles (`null` si elle
 * ne tiendrait pas). Rien pour une liaison entre deux lieux réunis (un sentier sur leur isthme).
 */
export function traceDeLaLiaison(b: BridgeDef, built: readonly string[]): TraceDeLiaison | null {
  if (liaisonEntreReunis(b)) return null;
  const e = etatDe(archipelagoOfIsland(b.from), built);
  if (e.traces.has(b.id)) return e.traces.get(b.id)!;
  let t = e.essais.get(b.id);
  if (t === undefined) {
    t = e.traceur.essayer(b, LONGUEUR_LONGUE);
    e.essais.set(b.id, t);
  }
  return t;
}

/** Une liaison est-elle posée (le pont du départ, ou dans `built`) ? */
function estPosee(b: BridgeDef, built: readonly string[]): boolean {
  return b.cost === 0 || built.includes(b.id);
}

provideLinkGeometry({
  kind: linkKind,
  length(b, built) {
    if (liaisonEntreReunis(b)) return 0;
    const t = traceDeLaLiaison(b, built);
    if (t) return t.cases.length;
    // Une liaison posée que le traceur ne refait pas garde son tracé d'origine : elle tient.
    return estPosee(b, built) ? 0 : null;
  },
});

// ---------- Les liaisons posées de la partie en cours ----------

let posees: readonly string[] = [];

/**
 * Les liaisons posées de la partie en cours (`world.links`), que lit le dessin des liaisons (`bridgePath`) : le monde
 * les donne à chaque construction (`worldCubes`), la partie à chaque changement (BloclandContext).
 */
export function poserLesLiaisons(links: readonly string[]): void {
  if (links.length === posees.length && links.every((id, i) => posees[i] === id)) return;
  posees = [...links];
}

/** Les liaisons posées de la partie en cours (`poserLesLiaisons`). */
export function liaisonsPosees(): readonly string[] {
  return posees;
}

/** Les liaisons posées d'une région dans la partie en cours, dans l'ordre : le pont du départ, puis la sauvegarde. */
export function liaisonsPoseesDe(a: ArchipelagoId): BridgeDef[] {
  return poseesDe(a, posees);
}

/** Les liaisons posées d'un lieu dans la partie en cours. */
export function liaisonsPoseesDuLieu(id: BiomeId): BridgeDef[] {
  return liaisonsPoseesDe(archipelagoOfIsland(id)).filter((b) => b.from === id || b.to === id);
}
