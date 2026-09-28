// Icônes de l'application installée. Leur adresse porte l'empreinte de leur contenu (« pwa-192.png?v=1a2b3c4d ») :
// quand un dessin change, l'adresse change aussi. Le manifeste change donc à coup sûr, ce que Chrome et Edge
// (Android, ordinateur) guettent pour proposer la nouvelle icône à une appli déjà installée, et aucun cache
// ne peut resservir l'ancienne image à une installation neuve. Le service worker ignore ce paramètre (vite.config.ts).
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PUBLIC = join(import.meta.dirname, "..", "public");

/** Les huit premiers caractères de l'empreinte SHA-256 d'un fichier de public/. */
export function empreinte(fichier, dossier = PUBLIC) {
  return createHash("sha256")
    .update(readFileSync(join(dossier, fichier)))
    .digest("hex")
    .slice(0, 8);
}

/** L'adresse d'une icône de public/, relative, avec son empreinte. */
export function iconeUrl(fichier, dossier = PUBLIC) {
  return `${fichier}?v=${empreinte(fichier, dossier)}`;
}
