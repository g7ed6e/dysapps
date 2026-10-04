import type { BiomeId, BlockId } from './biomes';

/**
 * Les blocs qui volent jusqu'au compteur (proposition P2, PR 2, Blocland) : l'écran de fin d'une
 * mission qui a donné des blocs retient le gain ; le monde le prend en arrivant sur l'île, une fois, et fait voler trois
 * petits blocs au plus de la borne de la mission jusqu'à la pastille du bouton Blocs, qui change de chiffre une fois, à
 * l'arrivée du dernier. Les blocs sont déjà dans l'inventaire (à l'écran de fin) : ce mot, gardé le temps de la visite
 * (`sessionStorage`), ne dit que quoi montrer. Un seul mouvement à la fois : le vol passe avant la pose de la partie et
 * avant la fiche d'un chantier ; le mot de la baleine, le renommage et les bandeaux de récompense l'attendent.
 */
const CLE = 'dysapps:blocs-gagnes';

/** Le gain retenu à l'écran de fin : l'île, la mission (sa borne), le bloc gagné (son dessin) et combien en tout. */
export interface GainRetenu {
  biome: BiomeId;
  mission: string;
  bloc: BlockId;
  /** Tous les blocs gagnés (la mission, le coffre de régularité, le coffre d'un plan fini). */
  nombre: number;
  /** Quand l'écran de fin l'a retenu (ms) : au-delà de `VOL.gardeMs`, il ne se montre plus (retour tardif). */
  quand: number;
}

/** Les temps et le nombre du vol (spécification du consultant UX UI). */
export const VOL = {
  /** Trois petits blocs au plus, quel que soit le nombre gagné. */
  blocsMax: 3,
  /** Le trajet d'un bloc, en arc simple. */
  trajetMs: 600,
  /** L'écart entre deux départs. */
  ecartMs: 100,
  /** Le temps que la caméra se pose sur l'île avant le premier départ. */
  attenteMs: 1000,
  /** Le rebond de la pastille quand son chiffre change. */
  rebondMs: 150,
  /** Un gain retenu plus vieux ne vole plus : l'élève est revenu sur l'île bien plus tard (mission lancée d'ailleurs). */
  gardeMs: 60_000,
} as const;

/** Combien de blocs volent pour un gain : un par bloc gagné, trois au plus ; aucun sans gain. */
export const blocsDuVol = (nombre: number): number => Math.max(0, Math.min(VOL.blocsMax, Math.floor(nombre)));

/** La durée du vol entier, du premier départ à l'arrivée du dernier (0,8 s pour trois blocs). */
export const dureeDuVol = (nombre: number): number => (blocsDuVol(nombre) ? VOL.trajetMs + (blocsDuVol(nombre) - 1) * VOL.ecartMs : 0);

/** Ce qui, à l'écran, empêche le vol : il ne passe jamais sur la question ni sur ce que l'élève lit. */
export interface CeQuiEmpeche {
  /** L'appareil demande moins d'animations : pas de vol, le chiffre change. */
  moinsDAnimations: boolean;
  /** Un autre univers que Blocland. */
  autreUnivers: boolean;
  /** Une fiche ouverte, le tutoriel, un mot qui attend « J'ai compris », un voyage, un panneau en plein écran. */
  ficheOuverte: boolean;
  tutoriel: boolean;
  motQuiAttend: boolean;
  voyage: boolean;
  pleinEcran: boolean;
}

/** Le vol a-t-il lieu ? Seulement avec des blocs gagnés, et rien à l'écran qu'il couvrirait. */
export function volALieu(gain: Pick<GainRetenu, 'nombre'> | null, e: CeQuiEmpeche): boolean {
  if (!gain || blocsDuVol(gain.nombre) === 0) return false;
  return !(e.moinsDAnimations || e.autreUnivers || e.ficheOuverte || e.tutoriel || e.motQuiAttend || e.voyage || e.pleinEcran);
}

/**
 * Le chiffre de la pastille : le total, sauf pendant le vol, où il garde celui d'avant le gain jusqu'à l'arrivée du
 * dernier bloc (il ne change qu'une fois).
 */
export const chiffreDeLaPastille = (total: number, gainEnVol: number | null): number => (gainEnVol ? Math.max(0, total - gainEnVol) : total);

/** Le nom lu du bouton Blocs : « Mes blocs, 12 » (le nombre n'est plus caché aux lecteurs d'écran). */
export const nomDuBoutonBlocs = (total: number): string => `Mes blocs, ${total}`;

function lire(): unknown {
  try {
    const brut = sessionStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as unknown) : null;
  } catch {
    return null;
  }
}

function ecrire(valeur: GainRetenu | null): void {
  try {
    if (valeur === null) sessionStorage.removeItem(CLE);
    else sessionStorage.setItem(CLE, JSON.stringify(valeur));
  } catch {
    // Stockage indisponible (navigation privée stricte) : le chiffre change, sans vol.
  }
}

/** Le gain retenu, tel qu'écrit : une île, une mission, un bloc (chaînes) et un nombre entier positif, ou rien. */
function lireLeGain(): GainRetenu | null {
  const brut = lire();
  if (!brut || typeof brut !== 'object') return null;
  const { biome, mission, bloc, nombre, quand } = brut as Record<string, unknown>;
  if (typeof biome !== 'string' || typeof mission !== 'string' || typeof bloc !== 'string' || !Number.isInteger(nombre) || (nombre as number) <= 0) return null;
  if (typeof quand !== 'number' || !Number.isFinite(quand)) return null;
  return { biome: biome as BiomeId, mission, bloc: bloc as BlockId, nombre: nombre as number, quand };
}

/** Retient les blocs que la mission vient de donner (rien sans gain), à montrer au retour sur son île. */
export function retenirLesBlocs(gain: GainRetenu): void {
  ecrire(gain.nombre > 0 ? gain : null);
}

/** Prend le gain à montrer sur cette île, une fois ; un gain d'une autre île est oublié (on n'y est pas revenu). */
export function prendreLesBlocs(biome: BiomeId, maintenant = Date.now()): GainRetenu | null {
  const gain = lireLeGain();
  ecrire(null);
  if (!gain || maintenant - gain.quand > VOL.gardeMs || maintenant < gain.quand) return null;
  return gain.biome === biome ? gain : null;
}

/** Pour les tests : rien en attente. */
export function oublierLesBlocs(): void {
  ecrire(null);
}
