// La mesure automatique (`?mesures=auto`), pour le mainteneur, sur la tablette de référence : la sauvegarde gelée, la
// partie toute construite des mesures (world/budget.ts) jouée en mémoire, puis le tour des vues du 6e (l'île, reculée,
// l'archipel, reculé, la Carte, l'ouverture et la fermeture de « Modifier le plan », la pose d'une partie en vague) ;
// à la fin, un tableau à copier. Chargé à part (React.lazy), seulement avec cette adresse : aucun élève ne le voit.
// Elle se lance aussi depuis les Réglages (« Mesurer l’appareil », pages/settings/ApplicationSection.tsx). La vraie partie
// revient par « Réglages » (la page rechargée sans `?mesures`, sur les Réglages), à tout moment.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBlocland } from './BloclandContext';
import { BIOMES, type BiomeId } from './biomes';
import { toutConstruitAvecLesCommandes } from './world/budget';
import { adresseSansMesure } from './rendering';
import { type LigneDeMesure, partieDeLaPose, partieDeMesure, resumerLesImages, tableauDesMesures } from './autoMeasure';
import { MODIFIER_LE_PLAN } from './ArrangeBar';
import { Icon } from '../components/Icon';

/** L'île de la pose : la Forêt des sons, comme les captures de la famille `pose`. */
const ILE_DE_LA_POSE: BiomeId = 'french-6e-phonology';

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
    const ligne = async (nom: string, fenetre = 4000) => {
      setEtape(`Mesure : ${nom}…`);
      const images = resumerLesImages(await ecartsPendant(fenetre));
      const s = window.__dysappsRendu;
      lignes.push({ etape: nom, appels: s?.calls ?? 0, triangles: s?.triangles ?? 0, ...images });
    };
    const finir = (etape: string) => {
      const appareil = `${screen.width}×${screen.height} px, ×${window.devicePixelRatio} · ${window.__dysappsRendu?.rendu ?? '?'}${moinsDAnimations() ? ' · Réduire les animations' : ''} · ${navigator.userAgent}`;
      setResultat(tableauDesMesures(lignes, appareil, notes));
      setEtape(etape);
    };
    // Sans annulation : le composant vit aussi longtemps que la page (l'adresse ne change pas pendant la mesure).
    void (async () => {
      const ile = BIOMES.find((b) => b.classe === '6e')?.id;
      if (!ile) return setEtape('Aucune île de 6e : rien à mesurer.');
      const { progress, world } = toutConstruitAvecLesCommandes();
      chargerPourLesMesures(partieDeMesure(progress, world, ile));
      navigate(`/adventure/${ile}`);
      if (!(await attendreLeMonde(''))) return setEtape('Pas de monde en 3D (vue simple ?) : rien à mesurer.');
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
      finir('Mesure finie.');
    })();
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
        <button type="button" className="button" onClick={revenir}>
          <Icon name="back" /> Réglages
        </button>
      </div>
      {resultat && <pre style={{ whiteSpace: 'pre-wrap', userSelect: 'text', margin: 0, font: '14px/1.4 ui-monospace, monospace' }}>{resultat}</pre>}
    </div>
  );
}
