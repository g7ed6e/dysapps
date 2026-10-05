import { useEffect, useRef, useState } from "react";
import { APP_VERSION } from "../core/appUpdate";
import { SpeakButton } from "./SpeakButton";
import {
  creerSauvegarde,
  lireSauvegarde,
  nomDuFichier,
  restaurerSauvegarde,
  TAILLE_MAX,
  type Sauvegarde,
} from "../core/saveFile";

// Après une restauration, la page se recharge : ce drapeau (pour cet onglet seulement) dit au retour que c'est fait.
const DRAPEAU_RESTAUREE = "dysapps-restored";

const REMPLACER =
  "Si tu veux garder la progression de cet appareil, enregistre-la d’abord.";

/** Les quatre étapes pour réinstaller : un titre, puis une ligne par appareil. Le même texte s'affiche et se lit. */
const ETAPES: { titre: string; details: string[] }[] = [
  {
    titre:
      "Enregistre ta progression, avec le bouton « Enregistrer ma progression ».",
    details: [],
  },
  {
    titre: "Supprime l’appli.",
    details: [
      "iPhone, iPad : appui long sur l’icône, « Supprimer l’app », puis « Supprimer ».",
      "Android : appui long sur l’icône, puis « Désinstaller ».",
      "Ordinateur : dans l’appli, menu ⋮ (trois points) en haut, puis « Désinstaller ».",
    ],
  },
  {
    titre: "Installe-la de nouveau, depuis l’adresse ci-dessous.",
    details: [
      "iPhone, iPad : dans Safari, bouton Partager, puis « Sur l’écran d’accueil ».",
      "Android : dans Chrome, menu ⋮ (trois points), puis « Installer l’application ».",
      "Ordinateur : dans Chrome ou Edge, icône d’installation à droite de l’adresse.",
    ],
  },
  {
    titre:
      "Ouvre l’appli installée, puis Réglages, « Restaurer une sauvegarde ». Choisis ton fichier.",
    details: [],
  },
];
const NOTE_IOS =
  "Sur iPhone et iPad, restaure dans l’appli installée, pas dans Safari : ils ne partagent pas la progression.";
const TEXTE_ETAPES =
  ETAPES.map(
    (e, i) => `Étape ${i + 1}. ${e.titre} ${e.details.join(" ")}`,
  ).join(" ") +
  " " +
  NOTE_IOS;

function dateEnMots(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Sur tablette et téléphone, la feuille de partage (Fichiers, Drive, e-mail) ; sur ordinateur, un téléchargement. */
async function enregistrer(
  fichier: File,
): Promise<"partage" | "telecharge" | "annule"> {
  const tactile =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  if (tactile && navigator.canShare?.({ files: [fichier] })) {
    try {
      await navigator.share({ files: [fichier], title: fichier.name });
      return "partage";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "annule";
      // Partage refusé : on retombe sur le téléchargement.
    }
  }
  const url = URL.createObjectURL(fichier);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = fichier.name;
  document.body.append(lien);
  lien.click();
  lien.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return "telecharge";
}

/** Deux sections des Réglages : la sauvegarde dans un fichier, et comment réinstaller l'appli sans rien perdre. */
export function SauvegardePanel() {
  const choix = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);
  const [aRestaurer, setARestaurer] = useState<Sauvegarde | null>(null);
  const confirmation = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DRAPEAU_RESTAUREE)) {
        sessionStorage.removeItem(DRAPEAU_RESTAUREE);
        setNote("Ta progression est restaurée.");
      }
    } catch {
      /* stockage indisponible */
    }
  }, []);
  useEffect(() => {
    if (aRestaurer) confirmation.current?.focus();
  }, [aRestaurer]);

  const sauver = async () => {
    const s = creerSauvegarde(APP_VERSION);
    const fichier = new File([JSON.stringify(s)], nomDuFichier(s), {
      type: "application/json",
    });
    const fait = await enregistrer(fichier);
    if (fait !== "annule")
      setNote(
        "Fichier enregistré. Garde-le dans Fichiers ou envoie-le par e-mail.",
      );
  };

  const lire = async (fichier: File | undefined) => {
    if (!fichier) return;
    const s =
      fichier.size > TAILLE_MAX ? null : lireSauvegarde(await fichier.text());
    if (!s) {
      setNote(
        "Ce fichier n’est pas une sauvegarde de l’appli. Rien n’a changé.",
      );
      return;
    }
    setNote(null);
    setARestaurer(s);
  };

  const restaurer = () => {
    if (!aRestaurer) return;
    if (!restaurerSauvegarde(aRestaurer)) {
      setARestaurer(null);
      setNote(
        "La sauvegarde n’a pas pu être restaurée : l’appareil manque de place. Rien n’a changé.",
      );
      return;
    }
    try {
      sessionStorage.setItem(DRAPEAU_RESTAUREE, "1");
    } catch {
      /* le message ne s'affichera pas, la progression est restaurée quand même */
    }
    window.location.reload();
  };

  const adresse = new URL(import.meta.env.BASE_URL, window.location.origin)
    .href;
  const [copiee, setCopiee] = useState(false);
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(adresse);
      setCopiee(true);
    } catch {
      /* presse-papiers refusé : l'adresse reste affichée */
    }
  };

  return (
    <>
      <fieldset className="panel">
        <legend>Ma sauvegarde</legend>
        <p>
          Ta progression et tes réglages tiennent dans un fichier. Garde-le pour
          changer d’appareil ou réinstaller l’appli.
        </p>
        <div className="settings-links">
          <button
            type="button"
            className="button"
            onClick={() => void sauver()}
          >
            Enregistrer ma progression
          </button>
          <button
            type="button"
            className="button"
            onClick={() => choix.current?.click()}
          >
            Restaurer une sauvegarde…
          </button>
          <input
            ref={choix}
            type="file"
            accept=".json,application/json"
            hidden
            data-testid="fichier-sauvegarde"
            onChange={(e) => {
              void lire(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        {aRestaurer && (
          <>
            <p ref={confirmation} tabIndex={-1} className="settings-note">
              Sauvegarde du {dateEnMots(aRestaurer.date)}. Elle va{" "}
              <strong>remplacer</strong> la progression de cet appareil.
            </p>
            <p className="settings-note">{REMPLACER}</p>
            <SpeakButton
              text={`Sauvegarde du ${dateEnMots(aRestaurer.date)}. Elle va remplacer la progression de cet appareil. ${REMPLACER}`}
            />
            <div className="actions">
              <button
                type="button"
                className="button primary"
                onClick={restaurer}
              >
                Restaurer
              </button>
              <button
                type="button"
                className="button"
                onClick={() => setARestaurer(null)}
              >
                Annuler
              </button>
            </div>
          </>
        )}
        <p className="settings-note" role="status" aria-live="polite">
          {note}
        </p>
      </fieldset>

      <fieldset className="panel">
        <legend>Réinstaller l’appli</legend>
        <p>
          Pour avoir la nouvelle icône, ou si l’appli ne marche plus. Avant de
          commencer, prends une photo de cet écran : il disparaît à l’étape 2.
        </p>
        <SpeakButton text={TEXTE_ETAPES} />
        <ol className="settings-steps">
          {ETAPES.map((e) => (
            <li key={e.titre}>
              <strong>{e.titre}</strong>
              {e.details.length > 0 && (
                <ul>
                  {e.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
        <p>
          L’adresse : <span className="settings-adresse">{adresse}</span>
        </p>
        <button type="button" className="button" onClick={() => void copier()}>
          {copiee ? "Adresse copiée" : "Copier l’adresse"}
        </button>
        <p className="settings-note">{NOTE_IOS}</p>
      </fieldset>
    </>
  );
}
