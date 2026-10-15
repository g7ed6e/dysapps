// La pose d'une partie en vague, et celle de la petite construction d'une commande livrée (sortie de WorldPage.tsx,
// qualité du code, lot 6) : la vague à lancer, ses sons, sa fin (touchée, interrompue ou en silence), et ce que la vue
// en dessine (`cubesVus`, `poseVue`).
import type { PetiteConstructionAPoser } from './world/placedFixtures';
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { useSettings } from '../core/SettingsContext';
import type { BiomeId, getBiome } from './biomes';
import type { Habillage } from './skin';
import type { VoxelCube } from './world/cube';
import { playDone, sonDePose } from './sound';
import type { Partie } from './world/parts';
import { prendreLaPose } from './poseToShow';
import { VAGUE, cubesDeLaVague, sansLaPartie } from './world/wave';
import { casesDesPlansDansLeMonde, casesDeLaPetiteConstructionDansLeMonde } from './world/terrain';

/** Une vague en cours : ses cases, absentes du monde jusqu'à ce que la vue les pose ; `commande`, sans partie (GD-7). */
export interface Vague {
  seq: number;
  biome: BiomeId;
  parties: Partie[];
  cases: Set<string>;
  commande?: string;
}

/** Ce que la pose lit de la page : l'île ouverte, le lien suivi, les réglages, les cubes du monde et la vague. */
interface PoseEnVague {
  island: ReturnType<typeof getBiome>;
  chantier: string | null;
  reduceMotion: boolean;
  settings: ReturnType<typeof useSettings>['settings'];
  habillage: Habillage;
  cubes: VoxelCube[];
  later: (f: () => void, ms: number) => void;
  vague: Vague | null;
  setVague: Dispatch<SetStateAction<Vague | null>>;
  apresLeVolSIlYEnA: (f: () => void) => void;
}

export function usePoseEnVague({ island, chantier, reduceMotion, settings, habillage, cubes, later, vague, setVague, apresLeVolSIlYEnA }: PoseEnVague) {
  // La pose d'une partie en vague (GD-6) : « Voir le bâtiment » arrive ici avec la pose à montrer, une fois
  // (poseToShow.ts). La caméra ne bouge pas. Blocland : les cases de la partie restent vides jusqu'à ce que la vague
  // les pose, couche par couche, un « clac » par couche. Archipéo : elles sont en pierre des ruines dès la première image
  // et passent à la couleur du plan au même rythme (le fondu, choix « 2c » du mainteneur, 4 octobre 2026), un « toc »
  // par couche. Puis le carillon, sans phrase par-dessus le monde (la phrase est dans le panneau de l'île, avec
  // « Écouter », pas lue d'office : l'écran de fin l'a déjà lue). Un toucher sur la scène pose tout d'un coup ; un appui
  // sur Menu, l'archipel, Recentrer ou la barre garde son effet et pose la partie en silence. « Réduire les animations » :
  // posée d'un coup, un seul « clac » (ou « toc ») et le carillon. Rien n'est enregistré ici : la partie l'est déjà, à
  // l'écran de fin.
  // La phrase « Partie posée : … » du panneau, une fois le dernier cube posé (ou l'écran touché).
  const [partiesDites, setPartiesDites] = useState<{ biome: BiomeId; parties: Partie[]; toc: boolean; muet: boolean; seq: number } | null>(null);
  const [sonDeLaPose] = useState(() => sonDePose(habillage.pose));
  useEffect(() => {
    if (!island || chantier !== 'part') return;
    const parties = prendreLaPose(island.id);
    if (!parties) return;
    const id = island.id;
    // Après le vol des blocs gagnés, s'il y en a un : un seul mouvement à la fois.
    apresLeVolSIlYEnA(() => {
      if (reduceMotion) direLaPose(id, parties, true);
      else setVague((v) => ({ seq: (v?.seq ?? 0) + 1, biome: id, parties, cases: casesDesPlansDansLeMonde(parties.flatMap((p) => p.cases)) }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [island?.id, chantier]);
  // Une autre île ouverte pendant la pose : la partie est posée tout de suite, sans rien dire.
  useEffect(() => {
    if (vague && vague.biome !== island?.id) setVague(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [island?.id]);
  /**
   * La pose finie (ou touchée) : la partie entière dans le monde, puis le carillon. Aucune phrase par-dessus le monde
   * (mot du mainteneur, 4 octobre 2026 : la notification après la pose est retirée) : la partie posée se voit ; la
   * phrase reste dans le panneau de l'île, avec « Écouter ». `muet` : l'élève a pris un contrôle de la scène (Menu…),
   * la partie est posée sans un son.
   */
  function direLaPose(biome: BiomeId, parties: Partie[], toc = false, muet = false) {
    setVague(null);
    setPartiesDites((d) => ({ biome, parties, toc, muet, seq: (d?.seq ?? 0) + 1 }));
  }
  useEffect(() => {
    if (!partiesDites || partiesDites.muet) return;
    const dire = () => {
      if (settings.sounds) playDone();
    };
    if (!partiesDites.toc) return dire();
    // Moins d'animations : un seul « clac » (ou « toc »), puis le carillon, sans qu'ils se couvrent.
    if (settings.sounds) sonDeLaPose();
    const timer = window.setTimeout(dire, VAGUE.finApresMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partiesDites?.seq]);
  /**
   * La vague finie, touchée ou interrompue. Une partie : sa phrase dans le panneau (`direLaPose`). Une petite construction
   * (GD-7, PR 3) : la section Commandes écrit sa phrase à la place de la ligne livrée, avec le carillon (sauf `muet`).
   */
  const finirLaVague = (muet = false) => {
    if (!vague) return;
    if (vague.commande === undefined) return direLaPose(vague.biome, vague.parties, false, muet);
    setVague(null);
    if (!muet && settings.sounds) playDone();
  };
  const onPose = (moment: 'couche' | 'finie') => {
    if (!vague) return;
    if (moment === 'couche') {
      if (settings.sounds) sonDeLaPose();
    } else finirLaVague();
  };
  const poserToutDUnCoup = () => finirLaVague();
  const poserEnSilence = () => finirLaVague(true);
  /**
   * « Livrer » (GD-7, PR 3) : la petite construction se pose chez la créature avec le geste d'une partie (GD-6), la caméra
   * immobile, cube par cube et couche par couche, un « clac » par couche, puis le carillon et, au même moment, la phrase
   * « posée » dans le panneau, à la place de la ligne livrée (directeur artistique ; la fête ne passe jamais sur elle).
   * « Réduire les animations », ou la vague sautée : posée d'un coup, la phrase tout de suite, un « clac » puis le
   * carillon. Rend `true` : le son est pris ici, la section n'en joue pas.
   */
  const poserLaCommande = (c: PetiteConstructionAPoser): boolean => {
    if (habillage.pose !== 'geste') return false;
    const cases = casesDeLaPetiteConstructionDansLeMonde(c.biome, c.fixture);
    if (reduceMotion || !cases.size) {
      if (settings.sounds) {
        sonDeLaPose();
        // Annulé si la page se démonte avant (`later`).
        later(playDone, VAGUE.finApresMs);
      }
      return true;
    }
    setVague((v) => ({ seq: (v?.seq ?? 0) + 1, biome: c.biome, parties: [], cases, commande: c.id }));
    return true;
  };
  const cubesVus = useMemo(() => (vague ? sansLaPartie(cubes, vague.cases) : cubes), [cubes, vague]);
  const poseVue = useMemo(() => (vague ? { seq: vague.seq, cubes: cubesDeLaVague(cubes, vague.cases) } : null), [cubes, vague]);
  return { cubesVus, poseVue, partiesDites, onPose, poserToutDUnCoup, poserEnSilence, poserLaCommande };
}
