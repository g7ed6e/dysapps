// La traversée de la Nef (sortie de WorldPage.tsx, qualité du code, lot 6) : le voyage en cours, le voile, le
// fondu court d'un voyage déjà fait (`hop`), la cinématique d'un premier voyage (`onBoard`, puis `onLegEnd` à la fin de
// chaque temps) et l'écran fixe (`arrive`). Les minuteries (`later`) sont annulées quand la page se démonte.
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { useProgress } from '../core/ProgressContext';
import type { useSettings } from '../core/SettingsContext';
import type { useBlocland } from './BloclandContext';
import type { useTextes } from '../universes';
import type { BoutsDuTrajet } from './world/grid';
import type { Entite, Point } from './world/layout';
import type { Bonhomme } from './world/view';
import { frenchTypography } from '../components/math/RichText';
import type { BiomeId } from './biomes';
import { voyageSentence } from './VoyagePanel';
import { playArrival, playBurner, playHorn, playReactor, playSail } from './sound';
import { embarquer, etapeDuVoyage, finDuTemps, nouveauVoyage, versLArrivee, type Voyage } from './world/model';
import { VEIL_MS, legTiming } from './world/voyage';
import { walkDuration } from './world/scene';
import { archipelagoOf, getArchipelago, type ArchipelagoId } from './world/archipelago';
import { stageTo } from './world/vehicle';

/** Ce que la traversée lit de la page : l'archipel, le bonhomme, les réglages, et ce qui le fait marcher. */
interface Traversee {
  a: ArchipelagoId;
  at: BiomeId;
  archipelago: ReturnType<typeof archipelagoOf>;
  biomeId: string | undefined;
  liens: string[];
  reduceMotion: boolean;
  textes: ReturnType<typeof useTextes>;
  settings: ReturnType<typeof useSettings>['settings'];
  speak: ReturnType<typeof useSettings>['speak'];
  navigate: NavigateFunction;
  moveTo: ReturnType<typeof useBlocland>['moveTo'];
  launch: ReturnType<typeof useBlocland>['launch'];
  launchVoyage: ReturnType<typeof useProgress>['launchVoyage'];
  chemin: (de: BiomeId, vers: Entite, bouts?: BoutsDuTrajet) => Point[] | null;
  seTenir: (id: BiomeId) => Point;
  setWalk: Dispatch<SetStateAction<Bonhomme<Point>>>;
  setFocus: Dispatch<SetStateAction<{ island: BiomeId | null; seq: number }>>;
}

export function useTraversee({ a, at, archipelago, biomeId, liens, reduceMotion, textes, settings, speak, navigate, moveTo, launch, launchVoyage, chemin, seTenir, setWalk, setFocus }: Traversee) {
  // Le voyage en cours (la Nef) : le premier voyage vers un archipel (bouton « Embarquer » du port). Les voyages
  // déjà faits (retours, « Aller au port », liens et retours d'exercice vers une île d'un autre archipel, sélecteur
  // d'archipel) sont un fondu court (`hop`, plus bas). Une cinématique en deux temps : le départ dans cet archipel, puis, sous un voile, le changement
  // d'archipel et l'arrivée dans le suivant. Si le bonhomme n'est pas au port, il y marche d'abord (`approach`).
  // Arrivé au port d'en face, il marche jusqu'à l'île demandée (`dest`). Quand l'appareil demande moins d'animations : un écran
  // HTML fixe (le navire dessiné, la phrase, le bouton « Arriver »), puis le changement d'archipel d'un coup.
  const [voyage, setVoyage] = useState<Voyage | null>(null);
  const [veil, setVeil] = useState(false);
  const timers = useRef<number[]>([]);
  const later = (f: () => void, ms: number) => timers.current.push(window.setTimeout(f, ms));
  const clearTimers = () => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);
  // Un voyage déjà fait (retour, ou un archipel déjà atteint) : pas de cinématique, un fondu court vers l'île demandée,
  // sans rien écrire. La cinématique et le mot d'arrivée (une seule fois, voir useWhaleWord) restent pour le premier voyage.
  // Seul un lecteur d'écran entend où l'on arrive (WCAG 4.1.3) ; à l'écran, la coche de la rangée de classes le dit.
  const [arriveeLue, setArriveeLue] = useState('');
  const hop = (dest: BiomeId) => {
    clearTimers();
    const land = () => {
      const classe = archipelagoOf(dest).classe;
      setArriveeLue(`Archipel de ${classe} : les ${textes.archipels[classe]}`);
      moveTo(dest);
      setWalk((w) => ({ route: [seTenir(dest)], seq: w.seq + 1 }));
      setFocus((f) => ({ island: dest, seq: f.seq + 1 }));
      if (biomeId !== dest) navigate(`/adventure/${dest}`);
    };
    if (reduceMotion) return land();
    setVeil(true);
    later(() => {
      land();
      later(() => setVeil(false), VEIL_MS / 3);
    }, VEIL_MS / 2);
  };
  const onBoard = (to: ArchipelagoId, back: boolean, dest: BiomeId = getArchipelago(to).port) => {
    if (back) return hop(dest);
    clearTimers();
    const trip = { to, from: a, back, dest, bridges: liens, reduceMotion };
    if (reduceMotion) return setVoyage((v) => nouveauVoyage({ ...trip, approach: false }, v));
    const stage = etapeDuVoyage(to, back, liens);
    const text = voyageSentence(to, back, textes.archipels, a);
    if (settings.autoRead) speak(frenchTypography(text));
    // Le bonhomme n'est pas au port : il y marche d'abord, la caméra sur le port ; le départ suit.
    const port = archipelago.port;
    const route = at === port ? null : chemin(at, { genre: 'ile', id: port });
    if (route) {
      setWalk((w) => ({ route, seq: w.seq + 1 }));
      moveTo(port);
      setFocus((f) => ({ island: port, seq: f.seq + 1 }));
      setVoyage((v) => nouveauVoyage({ ...trip, approach: true }, v));
      later(() => sail(stage, back), walkDuration(route));
      return;
    }
    if (at !== port) {
      // Pas de chemin d'ouvrages jusqu'au port : il s'y trouve directement.
      moveTo(port);
      setWalk((w) => ({ route: [seTenir(port)], seq: w.seq + 1 }));
    }
    setVoyage((v) => nouveauVoyage({ ...trip, approach: false }, v));
    horn(stage, back);
  };
  /** Le départ commence : le bonhomme est au port, il embarque. */
  const sail = (stage: 1 | 2 | 3, back: boolean) => {
    clearTimers();
    setVoyage(embarquer);
    horn(stage, back);
  };
  const horn = (stage: 1 | 2 | 3, back: boolean) => {
    if (!settings.sounds) return;
    playHorn();
    later(() => (stage === 1 ? playSail : stage === 2 ? playBurner : playReactor)(), legTiming('depart', back).walk);
  };
  /** Le voyage est fait : l'état change (le voyage reste fait, le bonhomme est au port d'en face). */
  const applyArrival = (v: { to: ArchipelagoId; back: boolean }): BiomeId => {
    const port = getArchipelago(v.to).port;
    if (v.back) moveTo(port);
    else {
      const stage = stageTo(v.to);
      const r = stage ? launch(stage) : null;
      if (stage && r?.ok) launchVoyage(stage.reward.xp);
    }
    return port;
  };
  /** Au port d'en face : le bonhomme débarque, puis marche jusqu'à l'île demandée, dont le panneau s'ouvre. */
  const finish = (port: BiomeId, dest: BiomeId) => {
    clearTimers();
    setVoyage(null);
    setVeil(false);
    const route = dest === port ? null : chemin(port, { genre: 'ile', id: dest });
    setWalk((w) => ({ route: route ?? [seTenir(dest)], seq: w.seq + 1 }));
    if (dest !== port) moveTo(dest);
    setFocus((f) => ({ island: dest, seq: f.seq + 1 }));
    if (biomeId !== dest) navigate(`/adventure/${dest}`);
    if (settings.sounds) playArrival();
  };
  // L'écran fixe : « Arriver ».
  const arrive = () => {
    if (!voyage) return;
    finish(applyArrival(voyage), voyage.dest);
  };
  // La cinématique : la fin d'un temps (ou un toucher, une touche : on arrive tout de suite).
  const onLegEnd = () => {
    const next = finDuTemps(voyage);
    if (!voyage || !next) return;
    // Encore en route vers le port : un toucher le fait embarquer tout de suite.
    if (next === 'embarquer') return sail(voyage.stage, voyage.back);
    clearTimers();
    if (next === 'changer-d-archipel') {
      // Sous le voile : l'archipel change (la scène est reconstruite), puis l'arrivée se joue dans le nouveau.
      setVeil(true);
      later(() => {
        const port = applyArrival(voyage);
        // La caméra et le bonhomme passent au port d'en face : la scène nouvelle s'ouvre sur lui, pas sur la mer.
        setFocus((f) => ({ island: port, seq: f.seq + 1 }));
        setWalk((w) => ({ route: [seTenir(port)], seq: w.seq + 1 }));
        setVoyage(versLArrivee);
        later(() => setVeil(false), VEIL_MS / 3);
      }, VEIL_MS / 2);
    } else finish(getArchipelago(voyage.to).port, voyage.dest);
  };
  // Entrée, Espace ou Échap pendant le voyage : on arrive tout de suite (le canvas fait pareil quand il a le focus).
  useEffect(() => {
    if (!voyage || voyage.mode !== 'cinema') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        onLegEnd();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voyage?.seq, voyage?.leg, voyage?.mode, voyage?.approach]);
  return { voyage, veil, arriveeLue, later, hop, onBoard, arrive, onLegEnd };
}
