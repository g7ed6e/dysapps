// Charge les personnages importés d'Archipéo (./world/characters/imported/models.ts, et Kéo :
// ./world/characters/imported/keo.ts) : les fichiers .glb des modèles retravaillés, servis avec le reste de
// l'application (Vite leur donne une adresse, le service worker les garde pour jouer hors ligne). Chargé à la demande
// avec les personnages d'Archipéo : Blocland ne les télécharge jamais.
import type { ArchipelagoId } from './world/archipelago';
import { archipelagoOfIsland } from './world/archipelagos';
import { lireGlb, lireGlbTexture, type ModeleTexture } from './world/characters/imported/glb';
import { registerKeo, KEO_FILE, loadedKeo, KEO_OUTFITS } from './world/characters/imported/keo';
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
export const RELANCE_MS = 30_000;

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
const keoLoads = new Map<ArchipelagoId, { p: Promise<void>; manque?: number }>();

/**
 * Charge Kéo dans la tenue d'un archipel, et elle seule : le monde de cet archipel l'habille ainsi (le bonhomme débarque
 * habillé). Ne rejette jamais : un fichier qui manque ou ne se lit pas laisse le bonhomme dessiné en code, et se
 * redemande au plus tôt `RELANCE_MS` plus tard.
 */
export function loadKeo(archipel: ArchipelagoId): Promise<void> {
  const deja = keoLoads.get(archipel);
  if (deja && (deja.manque === undefined || performance.now() - deja.manque < RELANCE_MS)) return deja.p;
  const chargement: { p: Promise<void>; manque?: number } = { p: Promise.resolve() };
  const url = ADRESSES[`../../docs/univers/archipeo/personnages/modeles/${KEO_OUTFITS[archipel]}/${KEO_FILE}`];
  chargement.p = (async () => {
    if (loadedKeo(archipel) || !url) return;
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(String(r.status));
      registerKeo(archipel, lireGlb(await r.arrayBuffer()));
    } catch {
      // Hors ligne sans le fichier, ou un fichier abîmé : le bonhomme dessiné en code reste.
      chargement.manque = performance.now();
    }
  })();
  keoLoads.set(archipel, chargement);
  return chargement.p;
}

/**
 * L'adresse du modèle de chaque habitant des scénettes du monde ouvert (« 6e-habitant-<lieu> », « 5e-habitant-<lieu> »,
 * « 4e-habitant-<lieu> »), texturé, déjà compacté par sa chaîne : le build le publie tel quel (scripts/rendu/compacterGlb.mjs).
 */
const HABITANTS = import.meta.glob('../../docs/univers/archipeo/personnages/modeles/[4-6]e-habitant-*/habitant.glb', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Les chargements en cours des habitants et des équipiers, et s'ils ont manqué, quand. */
const texturedLoads = new Map<string, { p: Promise<ModeleTexture | null>; manque?: number }>();

/**
 * Charge le modèle d'un habitant des scénettes (son dossier, « <niveau>-habitant-<lieu> ») : lu, ou rien. Ne rejette jamais :
 * un fichier qui manque ou ne se lit pas laisse le pion dessiné en code, et se redemande au plus tôt `RELANCE_MS` plus
 * tard. Rien n'est gardé une fois lu (la vue garde ce qu'elle montre) : un second appel relit le fichier, que le service
 * worker garde à la première lecture (cache « dysapps-habitants-3d », vite.config.ts).
 */
export function loadHabitant(nom: string): Promise<ModeleTexture | null> {
  return loadTextured(nom, HABITANTS[`../../docs/univers/archipeo/personnages/modeles/${nom}/habitant.glb`]);
}

/**
 * L'adresse du modèle de chaque équipier qui guide une scénette (GD-23, « 6e-equipage-<nom> »), texturé, déjà compacté
 * par sa chaîne, comme les habitants (./world/continu/equipage.ts).
 */
const EQUIPIERS = import.meta.glob('../../docs/univers/archipeo/personnages/modeles/6e-equipage-*/equipier.glb', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Charge le modèle d'un équipier (son dossier, « 6e-equipage-<nom> ») : lu, ou rien, comme un habitant. */
export function loadEquipier(nom: string): Promise<ModeleTexture | null> {
  return loadTextured(nom, EQUIPIERS[`../../docs/univers/archipeo/personnages/modeles/${nom}/equipier.glb`]);
}

/** Lit un modèle texturé (un habitant, un équipier) à son adresse : lu, ou rien ; ne rejette jamais. */
function loadTextured(nom: string, url: string | undefined): Promise<ModeleTexture | null> {
  const deja = texturedLoads.get(nom);
  if (deja && (deja.manque === undefined || performance.now() - deja.manque < RELANCE_MS)) return deja.p;
  const chargement: { p: Promise<ModeleTexture | null>; manque?: number } = { p: Promise.resolve(null) };
  chargement.p = (async () => {
    try {
      if (!url) throw new Error(`Modèle inconnu : ${nom}`);
      const r = await fetch(url);
      if (!r.ok) throw new Error(String(r.status));
      return lireGlbTexture(await r.arrayBuffer());
    } catch {
      // Hors ligne sans le fichier, ou un fichier abîmé : le pion dessiné en code reste (l'équipier, rien).
      chargement.manque = performance.now();
      return null;
    } finally {
      // Lu (ou manqué) : le prochain appel relit le fichier, ou attend la relance.
      if (chargement.manque === undefined) texturedLoads.delete(nom);
    }
  })();
  texturedLoads.set(nom, chargement);
  return chargement.p;
}
