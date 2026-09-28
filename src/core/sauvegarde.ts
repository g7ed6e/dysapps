// Sauvegarder et restaurer la progression dans un fichier : pour changer d'appareil ou réinstaller l'appli
// (sur iPhone et iPad, supprimer l'appli de l'écran d'accueil efface ses données). Le fichier copie telles quelles
// les valeurs rangées sur l'appareil sous le préfixe de l'appli : aucun format de sauvegarde n'est changé ni converti.
import { STORAGE_PREFIX } from "./storage";

export const FORMAT_SAUVEGARDE = "dysapps-sauvegarde";
const VERSION_FORMAT = 1;
/** Au-delà, ce n'est pas une sauvegarde de l'appli (le stockage d'un navigateur tient en quelques Mo). */
export const TAILLE_MAX = 5 * 1024 * 1024;
const CLE_VALIDE = /^dysapps:[\w.:-]{1,100}$/;

export interface Sauvegarde {
  format: typeof FORMAT_SAUVEGARDE;
  version: number;
  /** Date de l'enregistrement, ISO 8601. */
  date: string;
  /** Version de l'appli qui l'a écrite. */
  appli: string;
  /** Clé complète (avec le préfixe) → valeur brute, telle qu'elle était rangée. */
  donnees: Record<string, string>;
}

function clesDeLAppli(): string[] {
  const cles: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const cle = localStorage.key(i);
    // La même règle qu'à la restauration : tout ce qui est enregistré se restaure.
    if (cle?.startsWith(STORAGE_PREFIX) && CLE_VALIDE.test(cle)) cles.push(cle);
  }
  return cles;
}

function lireTout(): Record<string, string> {
  const donnees: Record<string, string> = {};
  for (const cle of clesDeLAppli()) {
    const valeur = localStorage.getItem(cle);
    if (valeur !== null) donnees[cle] = valeur;
  }
  return donnees;
}

/** Ce qui est rangé sur l'appareil aujourd'hui, prêt à écrire dans un fichier. */
export function creerSauvegarde(
  appli: string,
  maintenant = new Date(),
): Sauvegarde {
  return {
    format: FORMAT_SAUVEGARDE,
    version: VERSION_FORMAT,
    date: maintenant.toISOString(),
    appli,
    donnees: lireTout(),
  };
}

/** Le nom du fichier : « dysapps-progression-2026-09-28.json ». */
export function nomDuFichier(s: Sauvegarde): string {
  return `dysapps-progression-${s.date.slice(0, 10)}.json`;
}

/** Lit un fichier de sauvegarde. Rend null si ce n'en est pas une (rien n'est alors écrit sur l'appareil). */
export function lireSauvegarde(texte: string): Sauvegarde | null {
  if (texte.length > TAILLE_MAX) return null;
  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    return null;
  }
  if (typeof brut !== "object" || brut === null) return null;
  const s = brut as Partial<Record<keyof Sauvegarde, unknown>>;
  if (
    s.format !== FORMAT_SAUVEGARDE ||
    typeof s.version !== "number" ||
    s.version < 1 ||
    s.version > VERSION_FORMAT
  )
    return null;
  if (
    typeof s.date !== "string" ||
    Number.isNaN(Date.parse(s.date)) ||
    typeof s.appli !== "string"
  )
    return null;
  if (
    typeof s.donnees !== "object" ||
    s.donnees === null ||
    Array.isArray(s.donnees)
  )
    return null;
  const donnees: Record<string, string> = {};
  for (const [cle, valeur] of Object.entries(s.donnees)) {
    if (!CLE_VALIDE.test(cle) || typeof valeur !== "string") return null;
    // Chaque valeur rangée par l'appli est du JSON : une valeur qui n'en est pas trahit un fichier abîmé.
    try {
      JSON.parse(valeur);
    } catch {
      return null;
    }
    donnees[cle] = valeur;
  }
  return {
    format: FORMAT_SAUVEGARDE,
    version: s.version,
    date: s.date,
    appli: s.appli.slice(0, 40),
    donnees,
  };
}

/**
 * Remplace ce qui est rangé sur l'appareil par la sauvegarde. Tout ou rien : si l'écriture échoue (stockage plein),
 * l'appareil retrouve ce qu'il avait. La page doit ensuite se recharger pour relire la progression.
 */
export function restaurerSauvegarde(s: Sauvegarde): boolean {
  const avant = lireTout();
  const remplacer = (donnees: Record<string, string>) => {
    for (const cle of clesDeLAppli()) localStorage.removeItem(cle);
    for (const [cle, valeur] of Object.entries(donnees))
      localStorage.setItem(cle, valeur);
  };
  try {
    remplacer(s.donnees);
    return true;
  } catch {
    try {
      remplacer(avant);
    } catch {
      /* rien de mieux à faire */
    }
    return false;
  }
}
