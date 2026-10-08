// La mesure automatique (`?mesures=auto`), pour le mainteneur, sur la tablette de référence : la sauvegarde gelée, la
// partie toute construite des mesures (world/budget.ts) jouée en mémoire, puis le tour des vues du 6e (l'île, reculée,
// l'archipel, reculé, la Carte, l'ouverture et la fermeture de « Modifier le plan », la pose d'une partie en vague) ;
// à la fin, un tableau à copier. Chargé à part (React.lazy), seulement avec cette adresse : aucun élève ne le voit.
// La vraie partie revient en rechargeant la page sans `?mesures=auto`.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBlocland } from './BloclandContext';
import { BIOMES, type BiomeId } from './biomes';
import { toutConstruitAvecLesCommandes } from './world/budget';
import { type LigneDeMesure, partieDeLaPose, partieDeMesure, resumerLesImages, tableauDesMesures } from './autoMeasure';
import { MODIFIER_LE_PLAN } from './ArrangeBar';

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

/** Le monde dessine (le compteur de `?mesures` a vu une image), au plus 30 s ; puis la caméra a le temps de se poser. */
async function attendreLeMonde(): Promise<void> {
  for (let i = 0; i < 300 && !window.__dysappsRendu?.calls; i++) await attendre(100);
  await attendre(3000);
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

/** Touche le bouton dont le nom commence par `nom` (son nom accessible, ou son texte). */
function toucher(nom: string): boolean {
  const bouton = [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim().startsWith(nom));
  bouton?.click();
  return Boolean(bouton);
}

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
    const ligne = async (nom: string, fenetre = 4000, ecarts?: number[]) => {
      setEtape(`Mesure : ${nom}…`);
      const images = resumerLesImages(ecarts ?? (await ecartsPendant(fenetre)));
      const s = window.__dysappsRendu;
      lignes.push({ etape: nom, appels: s?.calls ?? 0, triangles: s?.triangles ?? 0, ...images });
    };
    void (async () => {
      const { progress, world } = toutConstruitAvecLesCommandes();
      const ile = BIOMES.find((b) => b.classe === '6e')!.id;
      chargerPourLesMesures(partieDeMesure(progress, world, ile));
      navigate(`/adventure/${ile}`);
      await attendreLeMonde();
      await ligne('île');
      await reculer(10);
      await ligne('île, au plus reculé');
      navigate('/adventure');
      await attendreLeMonde();
      await ligne('archipel');
      await reculer(10);
      await ligne('archipel, au plus reculé');
      navigate('/adventure/map');
      await attendreLeMonde();
      await ligne('Carte');
      // « Modifier le plan » ouvert puis annulé : la plus longue image vient du terrain refait (sans faces fondues).
      if (toucher(MODIFIER_LE_PLAN)) {
        await ligne('ouvrir « Modifier le plan »', 3000);
        if (toucher('Annuler')) await ligne('fermer « Modifier le plan »', 3000);
      }
      // La pose d'une partie en vague, depuis l'arrivée sur l'île (le monde refait compris).
      chargerPourLesMesures(partieDeLaPose(progress, world, ILE_DE_LA_POSE));
      try {
        sessionStorage.removeItem('dysapps:poses-montrees');
        sessionStorage.setItem('dysapps:pose', JSON.stringify({ biome: ILE_DE_LA_POSE, rangs: [1] }));
      } catch {
        // Stockage indisponible : l'île s'ouvre sans vague, la ligne le dira (peu d'écart).
      }
      navigate(`/adventure/${ILE_DE_LA_POSE}?worksite=part`);
      await ligne('pose en vague (arrivée comprise)', 12000);
      // La pose oubliée : la vraie partie, au rechargement, ne la rejouera pas.
      try {
        sessionStorage.removeItem('dysapps:pose');
      } catch {
        // Stockage indisponible : rien n'a été écrit.
      }
      const appareil = `${screen.width}×${screen.height} px, ×${window.devicePixelRatio} · ${window.__dysappsRendu?.rendu ?? '?'} · ${navigator.userAgent}`;
      setResultat(tableauDesMesures(lignes, appareil));
      setEtape('Mesure finie.');
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

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        top: 8,
        left: 8,
        right: 8,
        zIndex: 1000,
        maxHeight: '60vh',
        overflow: 'auto',
        padding: '8px 12px',
        background: '#000d',
        color: '#fff',
        font: '14px/1.4 ui-monospace, monospace',
        borderRadius: 8,
      }}
    >
      <div>{etape}</div>
      {resultat && (
        <>
          <button type="button" className="button" onClick={copier} style={{ margin: '8px 0' }}>
            {copie ? 'Copié' : 'Copier'}
          </button>
          <pre style={{ whiteSpace: 'pre-wrap', userSelect: 'text', margin: 0 }}>{resultat}</pre>
        </>
      )}
    </div>
  );
}
