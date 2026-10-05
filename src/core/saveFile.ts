// Sauvegarder et restaurer la progression dans un fichier : pour changer d'appareil ou réinstaller l'appli
// (sur iPhone et iPad, supprimer l'appli de l'écran d'accueil efface ses données). Le fichier copie telles quelles
// les valeurs rangées sur l'appareil sous le préfixe de l'appli. Depuis les mots neutres (2 octobre 2026), le fichier est
// à la version 2 (`dysapps-backup`, `data`, `app`) ; un fichier de la version 1 (`dysapps-sauvegarde`, `donnees`,
// `appli`) se lit toujours, se restaure tel quel, puis passe par la même traduction que l'appareil (migration.ts).
import { migrateStorage } from "./migration";
import { STORAGE_PREFIX } from "./storage";

const FORMAT_SAUVEGARDE = "dysapps-backup";
const VERSION_FORMAT = 2;
/** Le format d'avant les mots neutres, toujours lu. */
const FORMAT_V1 = "dysapps-sauvegarde";
/** Au-delà, ce n'est pas une sauvegarde de l'appli (le stockage d'un navigateur tient en quelques Mo). */
export const TAILLE_MAX = 5 * 1024 * 1024;
const CLE_VALIDE = /^dysapps:[\w.:-]{1,100}$/;

export interface Sauvegarde {
  format: typeof FORMAT_SAUVEGARDE;
  version: number;
  /** Date de l'enregistrement, ISO 8601. */
  date: string;
  /** Version de l'appli qui l'a écrite. */
  app: string;
  /** Clé complète (avec le préfixe) → valeur brute, telle qu'elle était rangée. */
  data: Record<string, string>;
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
  app: string,
  maintenant = new Date(),
): Sauvegarde {
  return {
    format: FORMAT_SAUVEGARDE,
    version: VERSION_FORMAT,
    date: maintenant.toISOString(),
    app,
    data: lireTout(),
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
  const s = brut as Record<string, unknown>;
  // La version 2 (mots neutres), ou la version 1 d'avant, avec ses noms français.
  const v2 = s.format === FORMAT_SAUVEGARDE && s.version === VERSION_FORMAT;
  const v1 = s.format === FORMAT_V1 && s.version === 1;
  if (!v2 && !v1) return null;
  const app = v2 ? s.app : s.appli;
  const brutes = v2 ? s.data : s.donnees;
  if (
    typeof s.date !== "string" ||
    Number.isNaN(Date.parse(s.date)) ||
    typeof app !== "string"
  )
    return null;
  if (typeof brutes !== "object" || brutes === null || Array.isArray(brutes))
    return null;
  const data: Record<string, string> = {};
  for (const [cle, valeur] of Object.entries(brutes)) {
    if (!CLE_VALIDE.test(cle) || typeof valeur !== "string") return null;
    // Chaque valeur rangée par l'appli est du JSON : une valeur qui n'en est pas trahit un fichier abîmé.
    try {
      JSON.parse(valeur);
    } catch {
      return null;
    }
    data[cle] = valeur;
  }
  return {
    format: FORMAT_SAUVEGARDE,
    version: VERSION_FORMAT,
    date: s.date,
    app: app.slice(0, 40),
    data,
  };
}

/**
 * Remplace ce qui est rangé sur l'appareil par la sauvegarde. Tout ou rien : si l'écriture échoue (stockage plein),
 * l'appareil retrouve ce qu'il avait. Une sauvegarde aux anciens noms est ensuite traduite (`migrateStorage`). La page
 * doit enfin se recharger pour relire la progression.
 */
export function restaurerSauvegarde(s: Sauvegarde): boolean {
  const avant = lireTout();
  const remplacer = (donnees: Record<string, string>) => {
    for (const cle of clesDeLAppli()) localStorage.removeItem(cle);
    for (const [cle, valeur] of Object.entries(donnees))
      localStorage.setItem(cle, valeur);
  };
  try {
    remplacer(s.data);
  } catch {
    try {
      remplacer(avant);
    } catch {
      /* rien de mieux à faire */
    }
    return false;
  }
  migrateStorage();
  return true;
}
