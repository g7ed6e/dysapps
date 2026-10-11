// Charge les personnages importés d'Archipéo (./world/characters/imported/models.ts, et Kéo : ./world/characters/imported/keo.ts) : les fichiers .glb des modèles
// retravaillés, servis avec le reste de l'application (Vite leur donne une adresse, le service worker les garde pour
// jouer hors ligne). Chargé à la demande avec les personnages d'Archipéo : Blocland ne les télécharge jamais.
import type { ArchipelagoId } from './world/archipelago';
import { archipelagoOfIsland } from './world/archipelagos';
import { lireGlb } from './world/characters/imported/glb';
import { enregistrerKeo, FICHIER_DE_KEO, keoImporte, TENUES_DE_KEO } from './world/characters/imported/keo';
import { enregistrer, FICHIER, ILES_IMPORTEES, modeleImporte, nomDuModele, type Genre, type Niveau } from './world/characters/imported/models';

/** L'adresse de chaque fichier, par son chemin dans le dépôt (« …/modeles/<nom>/final-200.glb »). */
const ADRESSES = import.meta.glob('../../docs/univers/archipeo/personnages/modeles/{6e-*,5e-*,4e-*,3e-*}/final-*.glb', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const adresseDe = (nom: string, niveau: Niveau): string | undefined => ADRESSES[`../../docs/univers/archipeo/personnages/modeles/${nom}/${FICHIER[niveau]}`];

/** Le chargement de chaque archipel, et s'il a manqué un fichier, quand il a fini. */
const enCours = new Map<ArchipelagoId, { p: Promise<void>; manque?: number }>();
/** Un chargement qui a manqué un fichier se refait au plus tôt après ce délai (le défi et les fiches l'attendent). */
const RELANCE_MS = 30_000;

/**
 * Charge les modèles importés d'un archipel, ses Gardiens et ses créatures, de près et de loin (une fois par archipel).
 * Un fichier qui manque ou ne se lit pas est passé : son personnage garde le modèle dessiné en code.
 */
export function chargerLesModeles(archipel: ArchipelagoId): Promise<void> {
  const deja = enCours.get(archipel);
  if (deja && (deja.manque === undefined || performance.now() - deja.manque < RELANCE_MS)) return deja.p;
  const iles = ILES_IMPORTEES.filter((id) => archipelagoOfIsland(id) === archipel);
  const taches = iles.flatMap((id) =>
    (['gardien', 'creature'] as Genre[]).flatMap((genre) =>
      (['pres', 'loin'] as Niveau[]).map(async (niveau) => {
        if (modeleImporte(genre, id, niveau)) return true;
        const nom = nomDuModele(genre, id);
        const url = nom ? adresseDe(nom, niveau) : undefined;
        if (!url) return true;
        try {
          const r = await fetch(url);
          if (!r.ok) return false;
          enregistrer(genre, id, niveau, lireGlb(await r.arrayBuffer()));
        } catch {
          // Hors ligne sans le fichier, ou un fichier abîmé : le modèle dessiné en code reste.
          return false;
        }
        return true;
      }),
    ),
  );
  // Un fichier manqué (réseau coupé, service worker en mise à jour) se redemande plus tard, à un prochain appel ; d'ici
  // là, la même promesse, déjà tenue : le défi et les fiches ne l'attendent pas en boucle.
  const chargement: { p: Promise<void>; manque?: number } = { p: Promise.resolve() };
  chargement.p = Promise.all(taches).then((faits) => {
    if (faits.includes(false)) chargement.manque = performance.now();
  });
  enCours.set(archipel, chargement);
  return chargement.p;
}

/** Le chargement de Kéo dans la tenue de chaque archipel, et s'il a manqué, quand. */
const keoEnCours = new Map<ArchipelagoId, { p: Promise<void>; manque?: number }>();

/**
 * Charge Kéo dans la tenue d'un archipel, et elle seule : le monde de cet archipel l'habille ainsi (le bonhomme débarque
 * habillé). Ne rejette jamais : un fichier qui manque ou ne se lit pas laisse le bonhomme dessiné en code, et se
 * redemande au plus tôt `RELANCE_MS` plus tard.
 */
export function chargerKeo(archipel: ArchipelagoId): Promise<void> {
  const deja = keoEnCours.get(archipel);
  if (deja && (deja.manque === undefined || performance.now() - deja.manque < RELANCE_MS)) return deja.p;
  const chargement: { p: Promise<void>; manque?: number } = { p: Promise.resolve() };
  const url = ADRESSES[`../../docs/univers/archipeo/personnages/modeles/${TENUES_DE_KEO[archipel]}/${FICHIER_DE_KEO}`];
  chargement.p = (async () => {
    if (keoImporte(archipel) || !url) return;
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(String(r.status));
      enregistrerKeo(archipel, lireGlb(await r.arrayBuffer()));
    } catch {
      // Hors ligne sans le fichier, ou un fichier abîmé : le bonhomme dessiné en code reste.
      chargement.manque = performance.now();
    }
  })();
  keoEnCours.set(archipel, chargement);
  return chargement.p;
}
