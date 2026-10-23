// La mesure automatique (`?mesures=auto`), pour le mainteneur, sur la tablette de référence : la sauvegarde gelée, la
// partie toute construite des mesures (world/budget.ts) jouée en mémoire, puis le tour des vues du 6e (l'île, reculée,
// l'archipel, reculé, la Carte, l'ouverture et la fermeture de « Modifier le plan », la pose d'une partie en vague) ;
// à la fin, un tableau à copier. Avec le monde ouvert (`?monde=ouvert`, Archipéo), le tour est le sien : l'arrivée, la
// marche d'un bout à l'autre de l'île, la Carte, une scénette (et après « Commencer », s'il y a un récit d'abord).
// Chargé à part (React.lazy), seulement avec cette adresse : aucun élève ne le voit.
// Elle se lance aussi depuis les Réglages (« Mesurer l’appareil », pages/settings/ApplicationSection.tsx). La vraie partie
// revient par « Réglages » (la page rechargée sans `?mesures`, sur les Réglages), à tout moment.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBlocland } from './BloclandContext';
import type { BiomeId } from './biomes';
import type { World } from './engine/state';
import { toutConstruitAvecLesCommandes } from './world/budget';
import { placeById, type OpenWorldLevel, type PlaceId } from './world/continu/levelPlan';
import { adresseSansMesure, mondeOuvertDArchipeo } from './rendering';
import { type LigneDeMesure, NIVEAUX_MESURES, ileDuNiveau, partieDeLaPose, partieDeMesure, resumerLesImages, tableauDesMesures, tourDuMondeOuvert } from './autoMeasure';
import { MODIFIER_LE_PLAN } from './ArrangeBar';
import { Icon } from '../components/Icon';

/** L'île de la pose : la Forêt des sons, comme les captures de la famille `pose`. */
const ILE_DE_LA_POSE: BiomeId = 'french-6e-phonology';

/** La partie toute construite, telle que world/budget.ts la prépare. */
type Progression = ReturnType<typeof toutConstruitAvecLesCommandes>['progress'];

/** Une étape mesurée : son nom, et la durée de sa fenêtre en millisecondes. */
type Mesure = (nom: string, fenetre?: number) => Promise<void>;

/** Le nom d'un lieu, sans son article (« Phare », « Balises ») : pour le tableau. */
const nomDuLieu = (id: PlaceId) => placeById(id).name.replace(/^(Le |La |Les |L’|L')/, '');

const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/** Les écarts entre images pendant `ms` (requestAnimationFrame, comme la boucle du monde). */
function ecartsPendant(ms: number): Promise<number[]> {
  return new Promise((resolve) => {
    const ecarts: number[] = [];
    const debut = performance.now();
    let avant = debut;
    const pas = (t: number) => {
      ecarts.push(t - avant);
      avant = t;
      if (t - debut < ms) requestAnimationFrame(pas);
      else resolve(ecarts.slice(1));
    };
    requestAnimationFrame(pas);
  });
}

/**
 * Le monde dessine et ses chiffres ne bougent plus : le compteur de `?mesures` garde ceux de la vue d'avant
 * (`ancienne`) tant que la scène n'est pas refaite, d'où l'attente qu'ils changent, puis une seconde de suite sans
 * changement ; au plus 30 s. Puis la caméra a le temps de se poser. Faux s'il n'y a pas de monde en 3D (la vue simple,
 * sans `.voxel-canvas`).
 */
async function attendreLeMonde(ancienne: string): Promise<boolean> {
  let avant = '';
  let stable = 0;
  let change = false;
  for (let i = 0; i < 300 && stable < 10; i++) {
    await attendre(100);
    const cle = chiffres();
    change ||= cle !== ancienne;
    stable = change && cle && cle === avant ? stable + 1 : 0;
    avant = cle;
  }
  await attendre(2000);
  return Boolean(document.querySelector('.voxel-canvas'));
}

/**
 * Le monde ouvert d'un niveau dessine (`window.__dysappsMondeOuvert`, posé avec `?mesures`, un autre que `ancien`, celui
 * du niveau d'avant) et ses chiffres ne bougent plus depuis une seconde ; au plus 30 s. Puis la caméra a le temps de se
 * poser. Faux s'il ne vient pas.
 */
async function attendreLeMondeOuvert(ancien: Window['__dysappsMondeOuvert']): Promise<boolean> {
  let avant = '';
  let stable = 0;
  const nouveau = () => window.__dysappsMondeOuvert !== undefined && window.__dysappsMondeOuvert !== ancien;
  for (let i = 0; i < 300 && stable < 10; i++) {
    await attendre(100);
    const cle = nouveau() ? chiffres() : '';
    stable = cle && cle === avant ? stable + 1 : 0;
    avant = cle;
  }
  await attendre(2000);
  return nouveau();
}

/** Touche le bouton qui répond à `selecteur`, puis laisse la vue se poser ; faux s'il n'est pas à l'écran. */
async function toucherPuisAttendre(selecteur: string, ms = 2500): Promise<boolean> {
  const bouton = document.querySelector<HTMLButtonElement>(selecteur);
  bouton?.click();
  if (bouton) await attendre(ms);
  return Boolean(bouton);
}

/** Ce que dessine la dernière image (appels/triangles), vide sans compteur. */
function chiffres(): string {
  const s = window.__dysappsRendu;
  return s?.calls ? `${s.calls}/${s.triangles}` : '';
}

/** La touche − sur le monde, `n` fois (three/gestures.ts : ×0,8 chaque fois, jusqu'à la borne du zoom). */
async function reculer(n: number): Promise<void> {
  const monde = document.querySelector<HTMLElement>('.voxel-canvas');
  for (let i = 0; i < n; i++) {
    monde?.dispatchEvent(new KeyboardEvent('keydown', { key: '-', bubbles: true }));
    await attendre(100);
  }
  await attendre(2500);
}

/** Touche, dans `dans`, le bouton dont le nom commence par `nom` (son nom accessible, ou son texte). */
function toucher(nom: string, dans: ParentNode = document): boolean {
  const bouton = [...dans.querySelectorAll<HTMLButtonElement>('button')].find((b) => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim().startsWith(nom));
  bouton?.click();
  return Boolean(bouton);
}

/** Ce qui change la pose et les images : « Réduire les animations » (la pose se fait sans vague). */
const moinsDAnimations = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export default function AutoMeasure() {
  const { chargerPourLesMesures } = useBlocland();
  const navigate = useNavigate();
  const [etape, setEtape] = useState('Préparation de la partie toute construite…');
  const [resultat, setResultat] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);
  const lancee = useRef(false);

  useEffect(() => {
    if (lancee.current) return;
    lancee.current = true;
    const lignes: LigneDeMesure[] = [];
    const notes: string[] = [];
    // Une étape mesurée d'un niveau : ses images pendant `fenetre` ms, ce que dessine sa dernière image.
    const mesurer =
      (niveau: string, rang: string): Mesure =>
      async (nom, fenetre = 4000) => {
        setEtape(`Mesure${rang ? ` (${rang})` : ''} : ${niveau}, ${nom}…`);
        const images = resumerLesImages(await ecartsPendant(fenetre));
        const s = window.__dysappsRendu;
        lignes.push({ niveau, etape: nom, appels: s?.calls ?? 0, triangles: s?.triangles ?? 0, ...images });
      };
    const finir = (etape: string) => {
      const appareil = `${screen.width}×${screen.height} px, ×${window.devicePixelRatio} · ${window.__dysappsRendu?.rendu ?? '?'}${moinsDAnimations() ? ' · Réduire les animations' : ''} · ${navigator.userAgent}`;
      setResultat(tableauDesMesures(lignes, appareil, notes));
      setEtape(etape);
    };
    // Sans annulation : le composant vit aussi longtemps que la page (l'adresse ne change pas pendant la mesure).
    void (async () => {
      const { progress, world } = toutConstruitAvecLesCommandes();
      // Chaque niveau, l'un après l'autre : la partie toute construite, Kéo à la première île du niveau (le monde du
      // niveau refait, comme après le voyage entre niveaux), puis le tour de ses vues.
      const niveaux = NIVEAUX_MESURES.flatMap((niveau) => {
        const ile = ileDuNiveau(niveau);
        return ile ? [{ niveau, ile }] : [];
      });
      if (!niveaux.length) return setEtape('Aucune île : rien à mesurer.');
      const ouvert = mondeOuvertDArchipeo();
      for (const [i, { niveau, ile }] of niveaux.entries()) {
        const ligne = mesurer(niveau, `${i + 1}/${niveaux.length}`);
        const ancienMonde = window.__dysappsMondeOuvert;
        const anciens = chiffres();
        chargerPourLesMesures(partieDeMesure(progress, world, ile));
        navigate(`/adventure/${ile}`);
        if (ouvert) {
          if (!(await attendreLeMondeOuvert(ancienMonde))) {
            notes.push(`${niveau} : pas de monde ouvert en 3D.`);
            continue;
          }
          await tourDuMondeOuvertDe(niveau, ligne);
          continue;
        }
        if (!(await attendreLeMonde(anciens))) {
          notes.push(`${niveau} : pas de monde en 3D (vue simple ?).`);
          continue;
        }
        await tourDeLaGrille(ligne);
        // « Modifier le plan » et la pose, au 6e seulement : sur sa Carte, où le tour vient de finir.
        if (niveau === '6e') await poseEtPlan(ligne, progress, world);
      }
      finir(lignes.length ? 'Mesure finie.' : 'Rien à mesurer.');
    })();

    /** Le tour du monde ouvert d'un niveau : l'arrivée, la marche, la Carte, une scénette (et sa question). */
    async function tourDuMondeOuvertDe(niveau: OpenWorldLevel, ligne: Mesure) {
      const tour = tourDuMondeOuvert(niveau);
      await ligne('à l’arrivée');
      // La marche d'un lieu au plus loin : l'île traversée, les lieux qui entrent et sortent du champ.
      window.__dysappsMondeOuvert?.goTo(tour.depart, true);
      await attendre(2500);
      window.__dysappsMondeOuvert?.goTo(tour.arrivee);
      await ligne(`marche, ${nomDuLieu(tour.depart)} → ${nomDuLieu(tour.arrivee)}`, 6000);
      window.__dysappsMondeOuvert?.skip();
      await attendre(2500);
      // Le panneau du lieu, ouvert à l'arrivée, fermé (Échap) : la Carte s'ouvre sur le monde seul.
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await attendre(500);
      const carte = '.open-world-map-button:not(.open-world-lieux-button)';
      if (!(await toucherPuisAttendre(carte, 3000))) notes.push(`${niveau} : « Carte », bouton non trouvé.`);
      else {
        await ligne('Carte');
        await toucherPuisAttendre(carte);
      }
      // Une scénette : la liste du lieu ouverte à l'arrivée, sa première mission jouée au lieu.
      if (!tour.scene) return notes.push(`${niveau} : aucun lieu à scénette.`);
      window.__dysappsMondeOuvert?.goTo(tour.scene, true);
      await attendre(2500);
      const mission = [...document.querySelectorAll<HTMLButtonElement>('#panneau-lieu button.app-card')].find((b) => b.querySelector('.mission-sign'));
      if (!mission) return notes.push(`${niveau} : aucune mission jouée au lieu (${nomDuLieu(tour.scene)}).`);
      mission.click();
      await attendre(3000);
      await ligne(`scénette, ${nomDuLieu(tour.scene)}`);
      // Une mission avec un récit d'abord (« Commencer ») : la question posée se mesure aussi.
      if (await toucherPuisAttendre('.world-question-start', 3000)) await ligne('scénette, la question posée');
    }

    /** Le tour d'un niveau dans la grille : l'île, l'archipel, chacun reculé, la Carte. */
    async function tourDeLaGrille(ligne: Mesure) {
      await ligne('île');
      await reculer(10);
      await ligne('île, au plus reculé');
      const ileReculee = chiffres();
      navigate('/adventure');
      await attendreLeMonde(ileReculee);
      await ligne('archipel');
      await reculer(10);
      await ligne('archipel, au plus reculé');
      const archipelRecule = chiffres();
      navigate('/adventure/map');
      await attendreLeMonde(archipelRecule);
      await ligne('Carte');
    }

    /** Au 6e, dans la grille, depuis sa Carte : « Modifier le plan » ouvert et fermé, puis la pose d'une partie en vague. */
    async function poseEtPlan(ligne: Mesure, progress: Progression, world: World) {
      // « Modifier le plan » ouvert puis annulé : la plus longue image vient du terrain refait (sans faces fondues).
      if (!toucher(MODIFIER_LE_PLAN)) notes.push('« Modifier le plan » : bouton non trouvé.');
      else {
        await ligne('ouvrir « Modifier le plan »', 3000);
        const barre = document.querySelector('.arrange-bar-fin');
        if (barre && toucher('Annuler', barre)) await ligne('fermer « Modifier le plan »', 3000);
        else notes.push('« Annuler » : bouton non trouvé.');
      }
      // La pose d'une partie en vague, depuis l'arrivée sur l'île (le monde refait compris).
      chargerPourLesMesures(partieDeLaPose(progress, world, ILE_DE_LA_POSE));
      try {
        sessionStorage.removeItem('dysapps:poses-montrees');
        sessionStorage.setItem('dysapps:pose', JSON.stringify({ biome: ILE_DE_LA_POSE, rangs: [1] }));
      } catch {
        notes.push('Pose : stockage de la session indisponible, sans vague.');
      }
      if (moinsDAnimations()) notes.push('Pose : « Réduire les animations » est actif, elle se fait sans vague.');
      navigate(`/adventure/${ILE_DE_LA_POSE}?worksite=part`);
      await ligne('pose en vague (arrivée comprise)', 12000);
      // La pose oubliée : la vraie partie, au rechargement, ne la rejouera pas.
      try {
        sessionStorage.removeItem('dysapps:pose');
      } catch {
        // Stockage indisponible : rien n'a été écrit.
      }
    }
  }, [chargerPourLesMesures, navigate]);

  const copier = async () => {
    if (!resultat) return;
    try {
      await navigator.clipboard.writeText(resultat);
      setCopie(true);
    } catch {
      setCopie(false);
    }
  };

  // Le partage de l'appareil (sur la tablette : Messages, Mail, Notes…), quand il existe : le résultat part tel quel.
  const partageable = typeof navigator.share === 'function';
  const envoyer = async () => {
    if (!resultat) return;
    try {
      await navigator.share({ title: 'Mesure automatique', text: resultat });
    } catch {
      // Partage refermé sans envoyer : rien à faire.
    }
  };

  // La page rechargée sans `?mesures` : la sauvegarde, gelée pendant la mesure, revient telle quelle ; la pose de la
  // tournée, si on part pendant elle, est oubliée (la vraie partie ne la rejouera pas).
  const revenir = () => {
    try {
      sessionStorage.removeItem('dysapps:pose');
    } catch {
      // Stockage indisponible : rien n'a été écrit.
    }
    window.location.assign(adresseSansMesure(window.location.href));
  };

  return (
    <div
      style={{
        position: 'fixed',
        // Hors de l'encoche, comme le reste de l'appli (global.css).
        top: 'max(8px, env(safe-area-inset-top))',
        left: 'max(8px, env(safe-area-inset-left))',
        right: 'max(8px, env(safe-area-inset-right))',
        zIndex: 1000,
        maxHeight: '60vh',
        overflow: 'auto',
        padding: '8px 12px',
        // Opaque : derrière, le monde bouge tout seul.
        background: '#000',
        color: '#fff',
        borderRadius: 8,
      }}
    >
      <div role="status">{etape}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0' }}>
        {resultat && (
          <button type="button" className="button" onClick={copier}>
            {copie ? 'Copié' : 'Copier'}
          </button>
        )}
        {resultat && partageable && (
          <button type="button" className="button" onClick={envoyer}>
            Envoyer
          </button>
        )}
        <button type="button" className="button" onClick={revenir}>
          <Icon name="back" /> Réglages
        </button>
      </div>
      {resultat && <pre style={{ whiteSpace: 'pre-wrap', userSelect: 'text', margin: 0, font: '14px/1.4 ui-monospace, monospace' }}>{resultat}</pre>}
    </div>
  );
}
