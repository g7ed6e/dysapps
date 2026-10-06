// Le mode « Aménager » (GD-9, point 1), sur la Carte, ouvert par « Modifier le plan » et fermé par « Valider » ou
// « Annuler » (décision du mainteneur, 6 octobre 2026) : l'état du mode (`useAmenagement`) : le choix, la ligne du mode à
// chaque calage et après chaque pose (des signes écrits, la même chose dite en mots ; piste A), la liste des ouvrages à reposer (le
// mot de l'univers), la question de « Réunir », et le geste de la pose (1,5 s au plus, un toucher le termine ; posé
// d'un coup avec moins d'animations). Ce qui s'affiche est dans ArrangeBar.tsx et ArrangeHandles.tsx (les flèches autour
// du choix) ; les règles dans world/arrange.ts et
// world/arrangeMode.ts ; la 3D dessine le choix (three/arrange.ts). Les mots sont communs aux deux univers ; chaque
// univers habille le geste et son son.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AnyIconName } from '../components/Icon';
import { loadJSON, saveJSON } from '../core/storage';
import type { BiomeId } from './biomes';
import type { World } from './engine/state';
import { sonDePose } from './sound';
import { mesuresDemandees } from './rendering';
import type { Habillage } from './skin';
import { type ArchipelagoId, archipelagoOfIsland } from './world/archipelagos';
import { type Direction, guardianOf, joinCandidates, joinedWith, joinIslands, joinsIn, linksToRelink, NO_MORE_ROOM, placeIn, spotOf } from './world/arrange';
import {
  type ArrangeChoice,
  chooseGuardian,
  chooseIsland,
  chooseLanding,
  chooseRelink,
  chooseStation,
  choiceSentence,
  poseChoice,
  poseSentence,
  snapChoice,
  stepChoice,
  turnChoice,
  turnGuardianNow,
} from './world/arrangeMode';
import { type ArrangeSession, canUndo, hasChanged, recordPose, resetToEntry, startArranging, undoLast } from './world/arrangeSession';
import { arrangeView } from './world/arrangeView';
import { GESTE_DU_LIEU, GESTE_SOUS_LE_SOL, gestureZone } from './world/arrangeGesture';
import type { ArrangeGesture, ArrangeView, CadreDuMode } from './world/view';
import { footprintOf } from './world/footprint';
import type { Intention, Point } from './world/layout';
import type { Rectangle } from './world/placement';
import { guardianSigns, type PlaceName, type PlaceSigns, placeSigns, placeSignsSentence } from './world/placeSentence';
import type { LayoutGuardian } from './world/savedLayout';
import { joinedSentence, thePlace } from './world/placeArticle';
import { LIAISON, type LinkPhrases, type LinkWord, linkPhrases } from './world/linkWord';

/*
 * Les phrases d'explication de la première fois (GD-9 ; 6 octobre 2026, choix 2a du mainteneur) : l'ouvrage « à
 * reposer », et « Réunir » avec la construction de l'univers (la digue, la jetée). Chacune tient en une phrase, écrite
 * et lue, et ne se montre qu'une fois par appareil (`CLE_DE_L_EXPLICATION`, `CLE_DE_LA_REUNION`, retenues dans
 * l'appareil comme le mot de la baleine). « Tes ouvrages restent. » avant « Revenir » (MenuSheet.tsx) se dit, lui, à
 * chaque fois.
 */

/** La clé de l'appareil qui retient que le mot « ouvrage à reposer » (le mot de l'univers) a été expliqué (une fois). */
const CLE_DE_L_EXPLICATION = 'amenager-liaison-expliquee';

/** La clé de l'appareil qui retient que le mot « réunir » a été expliqué (une fois). */
const CLE_DE_LA_REUNION = 'amenager-reunir-explique';

/** Ce que dit le mot « ouvrage à reposer » (le mot de l'univers), la première fois. */
function explicationDeLaLiaison(m: LinkPhrases): string {
  return `${m.Un} à reposer, c’est ${m.un} ${m.accord('séparé')} en déplaçant un lieu : tu ${m.accord('le', 'la')} reposes gratuitement.`;
}

/**
 * Ce que dit « Réunir » la première fois, après la question (qui dit déjà que les deux lieux ne se sépareront plus) : une
 * phrase sur la construction de l'univers (la digue dans Blocland, la jetée dans Archipéo).
 */
function explicationDeLaReunion(reunion: TextesDeLaReunion): string {
  return reunion.description;
}

/**
 * Ce que montre la ligne du mode, en haut (GD-9, piste A : des signes à la place des phrases). La voix et le
 * `role="status"` disent `phrase`, la même chose en mots.
 * - `place` : le voisin repère, la flèche, le nombre et la case (« Mine des lettres ↖ 4 ⬚ »), et les ouvrages à reposer ;
 * - `refus` : une croix (ou un cadenas pour le lieu fixe) et deux ou trois mots, toujours écrits (référent dys) ;
 * - `gardien` : le bouclier, son île, la flèche, l'écart (comme `place`, son île pour repère) ;
 * - `reunis` : les deux lieux réunis, l'icône de « Réunir » entre eux ;
 * - `texte` : une phrase écrite telle quelle (une borne, une arrivée, « Touche un lieu… »).
 */
export type LigneDuMode =
  | { genre: 'texte'; texte: string }
  | { genre: 'place'; signes: PlaceSigns; aReposer: number }
  | { genre: 'gardien'; signes: PlaceSigns }
  | { genre: 'refus'; icone: 'close' | 'lock'; texte: string }
  | { genre: 'reunis'; a: string; b: string; aReposer: number };

/** Ce que montre le jeu quand une pose ne se fait pas : une croix ou un cadenas, et deux ou trois mots. */
function refus(reason: string): Extract<LigneDuMode, { genre: 'refus' }> {
  const textes: Readonly<Record<string, string>> = {
    occupee: 'Place prise',
    reunis: 'Pas de réunion ici',
    liaison: 'Pas ici',
    inconnu: 'Pas ici',
  };
  if (reason === 'fixe') return { genre: 'refus', icone: 'lock', texte: 'Ce lieu ne bouge pas' };
  return { genre: 'refus', icone: 'close', texte: textes[reason] ?? textes.inconnu };
}

/** « Plus de place par là » : la flèche bute sur le bord. */
const PLUS_DE_PLACE: Extract<LigneDuMode, { genre: 'refus' }> = { genre: 'refus', icone: 'close', texte: NO_MORE_ROOM.replace(/\.$/, '') };

/** Ce que demande « Annuler » quand quelque chose a bougé, écrit dans la ligne et dit. */
export const QUESTION_D_ANNULATION = 'Tout remettre comme avant\u00a0?';

/** Une phrase, sa première lettre en capitale et un point final. */
function enPhrase(texte: string): string {
  return `${texte.charAt(0).toUpperCase()}${texte.slice(1)}.`;
}

/** Le nom et la description de la construction qui réunit deux lieux, dans l'univers (`textes.reunion`). */
interface TextesDeLaReunion {
  nom: string;
  description: string;
}

/** Sans univers : les mots communs. */
const REUNION_COMMUNE: TextesDeLaReunion = { nom: 'La construction qui les réunit', description: 'On la bâtit bloc par bloc, comme une grande construction.' };

/** Les flèches autour du choix (ou de la barre, en vue simple), dans leur ordre, nommées en mots. */
export const FLECHES: readonly { dir: Direction; icone: AnyIconName; nom: string; touche: string }[] = [
  { dir: 'ouest', icone: 'ouest', nom: 'Ouest', touche: 'ArrowLeft' },
  { dir: 'nord', icone: 'nord', nom: 'Nord', touche: 'ArrowUp' },
  { dir: 'sud', icone: 'sud', nom: 'Sud', touche: 'ArrowDown' },
  { dir: 'est', icone: 'est', nom: 'Est', touche: 'ArrowRight' },
];

interface Options {
  world: World;
  a: ArchipelagoId;
  arrange: (next: Pick<World, 'links' | 'layout'>) => void;
  nom: PlaceName;
  reduceMotion: boolean;
  habillage: Habillage;
  sons: boolean;
  /** Dire une phrase (la lecture à voix haute, si l'élève l'a gardée). */
  dire: (texte: string) => void;
  /** Une case d'une île (un ancrage) dans le monde. */
  versMonde: (p: NonNullable<Extract<Intention, { genre: 'ile' }>['sol']>) => Point;
  /** La construction qui réunit deux lieux dans l'univers (« La digue », avec l'article, et ce qu'elle est). */
  reunion?: TextesDeLaReunion;
  /** Le mot qui nomme une liaison dans l'univers (« ouvrage »). */
  liaisons?: LinkWord;
  /**
   * La hauteur du plus haut cube d'un lieu dans le monde (la 3D), pour que le démontage commence à son sommet et non
   * dans le vide ; sans elle, 24 cases au-dessus de son sol.
   */
  hautDuLieu?: (id: BiomeId) => number | undefined;
  /** Le panneau où le mode s'ouvre (la vue simple), s'il y en a un : Échap le ferme, après la question. */
  fermerLePanneau?: () => void;
}

/** « Réunir » touché : la question, avec un bouton par voisin possible (GD-9, point 10). */
interface QuestionDeReunion {
  id: BiomeId;
  voisins: BiomeId[];
  /** Le mot « réunir » est expliqué (la première fois). */
  explication: string | null;
}

/** Le geste de pose en cours : ce qu'il posera, et ses minuteries. */
interface GesteEnCours {
  apres: World;
  ligne: LigneDuMode | null;
  phrase: string;
  timers: number[];
  remonte: boolean;
}

export interface Amenagement {
  ouvert: boolean;
  ouvrir(): void;
  /**
   * « Valider » : le choix en cours se pose d'abord, s'il est valable (sinon il reste à sa place d'avant), puis le mode
   * se ferme, le plan tel qu'il est (chaque pose est déjà enregistrée au fil de l'eau ; un plan modifié reste gardé si
   * l'appli se ferme en plein mode).
   */
  valider(): void;
  /**
   * « Annuler » : rien n'a bougé, le mode se ferme ; sinon il demande d'abord « Tout remettre comme avant ? »
   * (`aConfirmer`), à la même place. Échap n'annule jamais.
   */
  annuler(): void;
  /** « Annuler » attend sa confirmation : « Garder » ou « Annuler ». */
  aConfirmer: boolean;
  /** « Annuler » confirmé : le plan revient tel qu'il était à l'entrée dans le mode, puis le mode se ferme. */
  confirmerLAnnulation(): void;
  /** « Garder » : rien n'est remis, le mode reste ouvert. */
  garder(): void;
  choix: ArrangeChoice | null;
  vue: ArrangeView | null;
  /** Ce que dit la ligne du mode, en mots (la voix, le `role="status"`). */
  phrase: string;
  /** Ce que montre la ligne du mode, en signes, ou rien. */
  ligne: LigneDuMode | null;
  /** La liste des liaisons à reposer est ouverte. */
  liste: boolean;
  ouvrirLaListe(): void;
  fermerLaListe(): void;
  /** Le mot « ouvrage à reposer » à expliquer (la première fois), ou rien. */
  explication: boolean;
  /** Ce que dit le mot « ouvrage à reposer » (le mot de l'univers). */
  texteDeLExplication: string;
  /** Le mot des liaisons dans l'univers, accordé. */
  mot: LinkPhrases;
  aReposer: string[];
  geste: ArrangeGesture | null;
  /** Une intention de la vue dans le mode : `true` si le mode l'a prise. */
  intention(i: Intention): boolean;
  /** Un toucher pendant le geste : il se termine tout de suite. */
  finirLeGeste(): void;
  fleche(dir: Direction): void;
  tourner(): void;
  poserIci(): void;
  defaire(): void;
  peutDefaire: boolean;
  choisirUneLiaison(id: string): void;
  /**
   * « Réunir » (GD-9, point 10) : la question, pour le lieu choisi (ou `id`, depuis la vue simple), à sa place, avec un
   * bouton par voisin ouvert à la bonne distance ; rien ne se fait avant la réponse.
   */
  demanderReunion(id?: BiomeId): void;
  /** La question de « Réunir » en cours, ou rien. */
  question: QuestionDeReunion | null;
  /** Ce que la vue garde entier après une réunion (la paire et sa construction), ou rien. */
  cadre: CadreDuMode | null;
  /** La réponse : réunir `id` et `autre`. */
  reunir(id: BiomeId, autre: BiomeId): void;
  /** « Non » : rien n'est réuni. */
  annulerReunion(): void;
  /** Le premier voisin ouvert avec lequel un lieu se réunirait, à sa place, ou rien (la vue simple le propose). */
  voisinAReunir(id: BiomeId): BiomeId | null;
  /** Choisir directement (la vue simple : une borne, une arrivée), avec sa phrase. */
  choisirDirect(c: ArrangeChoice): void;
  /** Le lieu avec lequel le lieu choisi se réunirait (« Réunir » allumé), ou rien. */
  reunirAvec: BiomeId | null;
}

/**
 * L'emprise d'un lieu (sa terre et l'îlot de son Gardien) dans un monde, en un rectangle ; avec le lieu auquel il est
 * réuni et leur réunion, qui bougent avec lui.
 */
function emprise(world: World, id: BiomeId): Rectangle {
  const autre = joinedWith(world, id);
  const lieux = autre ? [id, autre] : [id];
  const parts: Rectangle[] = lieux.flatMap((l) => footprintOf(l, placeIn(world, l), guardianOf(world, l)).filter((p) => p.genre === 'terre' || p.genre === 'ilot'));
  const zone = autre ? joinsIn(world, archipelagoOfIsland(id)).find((j) => j.pair.includes(id))?.shape.zone : undefined;
  if (zone) parts.push(zone);
  return {
    x0: Math.min(...parts.map((p) => p.x0)),
    y0: Math.min(...parts.map((p) => p.y0)),
    x1: Math.max(...parts.map((p) => p.x1)),
    y1: Math.max(...parts.map((p) => p.y1)),
  };
}

export function useAmenagement({
  world,
  a,
  arrange,
  nom,
  reduceMotion,
  habillage,
  sons,
  dire,
  versMonde,
  reunion = REUNION_COMMUNE,
  liaisons = LIAISON,
  hautDuLieu,
  fermerLePanneau,
}: Options): Amenagement {
  const mot = useMemo(() => linkPhrases(liaisons), [liaisons]);
  const [session, setSession] = useState<ArrangeSession | null>(null);
  const [choix, setChoix] = useState<ArrangeChoice | null>(null);
  const [phrase, setPhrase] = useState('');
  const [ligne, setLigne] = useState<LigneDuMode | null>(null);
  const [liste, setListe] = useState(false);
  const [explication, setExplication] = useState(false);
  const [question, setQuestion] = useState<QuestionDeReunion | null>(null);
  // Ce que la vue garde entier après une réunion : la paire et sa construction.
  const [cadre, setCadre] = useState<CadreDuMode | null>(null);
  const [geste, setGeste] = useState<ArrangeGesture | null>(null);
  // « Annuler » attend sa confirmation ; la ligne d'avant la question, rendue à « Garder ».
  const [aConfirmer, setAConfirmer] = useState(false);
  const avantLaQuestion = useRef<{ ligne: LigneDuMode | null; phrase: string }>({ ligne: null, phrase: '' });
  const enCours = useRef<GesteEnCours | null>(null);
  const seq = useRef(0);
  const worldRef = useRef(world);
  worldRef.current = world;
  const [sonDeLaPose] = useState(() => sonDePose(habillage.pose));
  const ouvert = session !== null;
  const aReposer = linksToRelink(world, a);

  /** La ligne du mode (des signes) et ce qu'elle dit en mots, lu à voix haute. */
  const annoncer = (l: LigneDuMode | null, lu: string) => {
    setLigne(l);
    setPhrase(lu);
    if (lu) dire(lu);
  };
  /** Une phrase écrite telle quelle (vide : la ligne s'efface). */
  const direTexte = (texte: string) => annoncer(texte ? { genre: 'texte', texte } : null, texte);
  /** Un refus : ses mots écrits, et dits. */
  const direRefus = (r: Extract<LigneDuMode, { genre: 'refus' }>) => annoncer(r, `${r.texte}.`);
  /**
   * Où est un lieu à une place, en signes ; la voix dit « Au nord-ouest de la Mine des lettres, à 4 cases. », et `apres`
   * (les ouvrages à reposer). Sans voisin, son nom.
   */
  const ligneDuLieu = (w: World, id: BiomeId, spot = spotOf(w, id), aReposer = 0): { ligne: LigneDuMode; lu: string } => {
    const signes = placeSigns(w, id, spot, nom);
    if (!signes) return { ligne: { genre: 'texte', texte: nom(id) }, lu: nom(id) };
    const lu = enPhrase(placeSignsSentence(signes)) + (aReposer ? ` ${mot.aReposer(aReposer)}` : '');
    return { ligne: { genre: 'place', signes, aReposer }, lu };
  };
  /** Le lieu avec lequel un lieu se réunirait, à sa place dans un monde (le premier voisin ouvert), ou rien. */
  const voisinAReunir = (w: World, id: BiomeId) => joinCandidates(w, id)[0] ?? null;
  /** Où est le Gardien d'un lieu, en signes (son île, la flèche, l'écart) ; dit en mots. */
  const ligneDuGardien = (w: World, id: BiomeId, g?: Pick<LayoutGuardian, 'side' | 'step'>): { ligne: LigneDuMode; lu: string } => {
    const signes = guardianSigns(w, id, g, nom);
    return { ligne: { genre: 'gardien', signes }, lu: `Le Gardien : ${placeSignsSentence(signes)}.` };
  };
  const choisir = (c: ArrangeChoice | null, texte?: string) => {
    setChoix(c);
    setQuestion(null);
    setCadre(null);
    setAConfirmer(false);
    const w = worldRef.current;
    if (texte !== undefined || !c) return direTexte(texte ?? '');
    if (c.genre === 'lieu') {
      const l = ligneDuLieu(w, c.id, c.spot);
      return annoncer(l.ligne, l.lu);
    }
    if (c.genre === 'gardien') {
      const l = ligneDuGardien(w, c.id, c.place);
      return annoncer(l.ligne, l.lu);
    }
    direTexte(choiceSentence(w, c, nom, mot));
  };

  /** Le geste fini (ou touché) : le monde posé, le son, la phrase. */
  const finirLeGeste = () => {
    const g = enCours.current;
    if (!g) return;
    for (const t of g.timers) window.clearTimeout(t);
    enCours.current = null;
    if (!g.remonte) arrange(g.apres);
    setGeste(null);
    if (sons) sonDeLaPose();
    annoncer(g.ligne, g.phrase);
  };
  useEffect(
    () => () => {
      for (const t of enCours.current?.timers ?? []) window.clearTimeout(t);
    },
    [],
  );

  const poserIci = () => {
    const w = worldRef.current;
    if (!choix || !session || enCours.current) return;
    const r = poseChoice(w, choix);
    if (!r.ok) return direRefus(refus(r.reason));
    setSession(recordPose(session, w, r.world));
    setCadre(null);
    // Après une pose, aucune bulle (« C'est posé » n'est plus écrit) : la ligne se met à jour, le son de la pose suffit.
    const n = r.relink.length;
    const apres: { ligne: LigneDuMode; lu: string } =
      choix.genre === 'lieu'
        ? ligneDuLieu(r.world, choix.id, spotOf(r.world, choix.id), n)
        : choix.genre === 'gardien' && !n
          ? ligneDuGardien(r.world, choix.id)
          : (() => {
            const t = poseSentence(r.world, choix, nom, mot);
            const lu = t + (n ? ` ${mot.aReposer(n)}` : '');
            return { ligne: { genre: 'texte', texte: lu } satisfies LigneDuMode, lu };
          })();
    setChoix(null);
    // Le geste (un lieu seulement) : démonté à sa place d'avant, remonté à la nouvelle ; d'un coup avec moins d'animations.
    if (choix.genre !== 'lieu' || reduceMotion) {
      arrange(r.world);
      if (sons) sonDeLaPose();
      return annoncer(apres.ligne, apres.lu);
    }
    const id = choix.id;
    const alt = placeIn(w, id).altitude;
    // Le démontage part du plus haut cube du lieu (et de celui qui lui est réuni) : pas de temps mort au début du geste.
    const autre = joinedWith(w, id);
    const sommets = [id, ...(autre ? [autre] : [])].map((l) => hautDuLieu?.(l)).filter((h): h is number => h !== undefined);
    const base = { bas: alt - GESTE_SOUS_LE_SOL, haut: sommets.length ? Math.max(...sommets) + 1 : alt + 24, dureeMs: GESTE_DU_LIEU.demonteMs };
    const g: GesteEnCours = { apres: r.world, ligne: apres.ligne, phrase: apres.lu, timers: [], remonte: false };
    enCours.current = g;
    const ancienne = gestureZone(emprise(w, id));
    const nouvelle = gestureZone(emprise(r.world, id));
    setGeste({ ...base, seq: ++seq.current, phase: 'demonte', zone: ancienne, autre: nouvelle, debut: performance.now() });
    // Les captures tiennent le geste dans son démontage (`__dysappsGesteA`) : il ne passe pas au remontage.
    if (typeof window.__dysappsGesteA === 'number' && (import.meta.env.DEV || mesuresDemandees())) return;
    g.timers.push(
      window.setTimeout(() => {
        g.remonte = true;
        arrange(r.world);
        setGeste({ ...base, dureeMs: GESTE_DU_LIEU.remonteMs, seq: ++seq.current, phase: 'remonte', zone: nouvelle, autre: ancienne, debut: performance.now() });
        g.timers.push(window.setTimeout(finirLeGeste, GESTE_DU_LIEU.remonteMs));
      }, GESTE_DU_LIEU.demonteMs),
    );
  };

  const ouvrir = () => {
    if (ouvert) return;
    setSession(startArranging(worldRef.current));
    choisir(null, `Touche un lieu, un Gardien, une borne ou ${mot.un} pour le déplacer.`);
  };
  /** Le mode se ferme : rien n'est en cours, plus rien ne s'affiche. */
  const fermer = () => {
    setSession(null);
    setChoix(null);
    setQuestion(null);
    setCadre(null);
    setListe(false);
    setExplication(false);
    setAConfirmer(false);
    setPhrase('');
    setLigne(null);
  };
  const valider = () => {
    if (enCours.current) finirLeGeste();
    else if (choix && session) {
      // Le choix en cours se pose d'un coup, s'il est valable ; sinon il reste à sa place d'avant, rien n'est perdu.
      const r = poseChoice(worldRef.current, choix);
      if (r.ok) {
        arrange(r.world);
        if (sons) sonDeLaPose();
      }
    }
    fermer();
  };
  const annuler = () => {
    if (!session) return;
    if (!aConfirmer && (enCours.current || hasChanged(session, worldRef.current))) {
      // Quelque chose a bougé : « Tout remettre comme avant ? », à la place d'« Annuler ».
      avantLaQuestion.current = { ligne, phrase };
      setAConfirmer(true);
      annoncer({ genre: 'texte', texte: QUESTION_D_ANNULATION }, QUESTION_D_ANNULATION);
      return;
    }
    confirmerLAnnulation();
  };
  const garder = () => {
    if (!aConfirmer) return;
    setAConfirmer(false);
    setLigne(avantLaQuestion.current.ligne);
    setPhrase(avantLaQuestion.current.phrase);
  };
  const confirmerLAnnulation = () => {
    if (!session) return;
    // Un geste en cours s'arrête là : sa pose n'est pas faite (s'il remontait déjà, l'instantané la défait aussi).
    const g = enCours.current;
    if (g) for (const t of g.timers) window.clearTimeout(t);
    enCours.current = null;
    setGeste(null);
    // Les poses du passage ne coûtent rien (une réunion se paie plus tard, quand on bâtit sa construction, hors du
    // mode) : revenir à l'instantané de l'entrée ne perd ni bloc ni XP.
    const w = worldRef.current;
    if (hasChanged(session, w)) {
      arrange(resetToEntry(session, w).world);
      dire('Le plan est remis comme avant.');
    }
    fermer();
  };

  const fleche = (dir: Direction) => {
    if (!choix || enCours.current) return;
    const s = stepChoice(worldRef.current, choix, dir);
    if (!s) return direRefus(PLUS_DE_PLACE);
    choisir(s);
  };
  const tourner = () => {
    if (!choix || enCours.current || !session) return;
    if (choix.genre === 'gardien') {
      const w = worldRef.current;
      const { result, sentence } = turnGuardianNow(w, choix.id);
      if (!result.ok) return direRefus(refus(result.reason));
      setSession(recordPose(session, w, result.world));
      arrange(result.world);
      if (sons) sonDeLaPose();
      // Tourner un Gardien le pose tout de suite : la ligne dit où il regarde, le son de la pose suffit.
      return direTexte(sentence);
    }
    if (choix.genre !== 'lieu') return;
    const t = turnChoice(worldRef.current, choix);
    if (!t) return direRefus(refus('occupee'));
    choisir(t);
  };
  const defaire = () => {
    if (!session || enCours.current) return;
    const r = undoLast(session, worldRef.current);
    if (!r) return;
    setSession(r.session);
    arrange(r.world);
    choisir(null, 'La dernière pose est défaite.');
  };

  const demanderReunion = (direct?: BiomeId) => {
    const w = worldRef.current;
    if (!session || enCours.current) return;
    const id = direct ?? (choix?.genre === 'lieu' && sameSpot(choix.spot, spotOf(w, choix.id)) ? choix.id : null);
    const voisins = id ? joinCandidates(w, id) : [];
    if (!id || !voisins.length) return direRefus(refus('reunis'));
    // Le mot « réunir » et la construction de l'univers, expliqués la première fois.
    const premiere = !loadJSON<{ vu: boolean }>(CLE_DE_LA_REUNION, { vu: false }).vu;
    if (premiere) saveJSON(CLE_DE_LA_REUNION, { vu: true });
    const q: QuestionDeReunion = { id, voisins, explication: premiere ? explicationDeLaReunion(reunion) : null };
    setQuestion(q);
    // Écrite en signes (« A ⋈ B 🔒 ») ; dite en mots. L'espace insécable avant « ? » : le point d'interrogation ne part
    // jamais seul à la ligne.
    const texte = `Réunir ${thePlace(nom(id))} et ${voisins.length === 1 ? thePlace(nom(voisins[0])) : 'quel lieu'}\u00a0? Les deux lieux ne se sépareront plus.`;
    setLigne(null);
    setPhrase(texte);
    dire(q.explication ? `${texte} ${q.explication}` : texte);
  };
  const annulerReunion = () => {
    setQuestion(null);
    annoncer(null, '');
  };

  const reunir = (id: BiomeId, autre: BiomeId) => {
    const w = worldRef.current;
    setQuestion(null);
    if (!session || enCours.current) return;
    const r = joinIslands(w, id, autre);
    if (!r.ok) return direRefus(refus(r.reason));
    setSession(recordPose(session, w, r.world));
    arrange(r.world);
    setChoix(null);
    setCadre({ rect: emprise(r.world, id), z: placeIn(r.world, id).altitude, seq: ++seq.current });
    if (sons) sonDeLaPose();
    // Écrit « A ⋈ B » ; dit en mots, « réuni » accordé avec le premier lieu.
    const n = r.relink.length;
    annoncer({ genre: 'reunis', a: nom(id), b: nom(autre), aReposer: n }, [joinedSentence(nom(id), nom(autre)), n ? mot.aReposer(n) : ''].filter(Boolean).join(' '));
  };

  const ouvrirLaListe = () => {
    if (!ouvert) ouvrir();
    setListe(true);
    setExplication(false);
    if (!loadJSON<{ vu: boolean }>(CLE_DE_L_EXPLICATION, { vu: false }).vu) {
      setExplication(true);
      saveJSON(CLE_DE_L_EXPLICATION, { vu: true });
      dire(explicationDeLaLiaison(mot));
    }
  };
  const fermerLaListe = () => {
    setListe(false);
    setExplication(false);
  };
  const choisirUneLiaison = (id: string) => {
    setListe(false);
    setExplication(false);
    choisir(chooseRelink(worldRef.current, id));
  };

  /** Un point touché sur un lieu est-il hors de son emprise (la mer à côté, un écueil) ? */
  const horsDuLieu = (id: BiomeId, p: Point) => {
    const r = emprise(worldRef.current, id);
    return p.x < r.x0 || p.x >= r.x1 || p.y < r.y0 || p.y >= r.y1;
  };
  const intention = (i: Intention): boolean => {
    if (!ouvert) return false;
    if (enCours.current) {
      finirLeGeste();
      return true;
    }
    const w = worldRef.current;
    switch (i.genre) {
      case 'mer':
        if (choix) choisir(snapChoice(w, choix, i.point));
        else direTexte('Touche d’abord un lieu, un gardien, une borne ou une liaison.');
        return true;
      case 'ile': {
        const p = i.sol ? versMonde(i.sol) : null;
        // Une borne ou une arrivée choisie : toucher son lieu la cale là ; la mer à côté d'un lieu, comme la mer.
        if (p && choix && (choix.genre === 'borne' || choix.genre === 'arrivee')) {
          choisir(snapChoice(w, choix, p));
          return true;
        }
        if (p && choix && horsDuLieu(i.id, p)) {
          choisir(snapChoice(w, choix, p));
          return true;
        }
        const c = chooseIsland(w, i.id);
        if (!c) direRefus(refus('fixe'));
        else choisir(c);
        return true;
      }
      case 'creature':
        if (i.gardien) choisir(chooseGuardian(w, i.id));
        else {
          const c = chooseIsland(w, i.id);
          if (c) choisir(c);
          else direRefus(refus('fixe'));
        }
        return true;
      case 'borne': {
        const c = chooseStation(w, `${i.ile}:${i.mission}`);
        if (c) choisir(c);
        return true;
      }
      case 'ouvrage': {
        const c = i.point && w.links.includes(i.id) ? chooseLanding(w, i.id, i.point) : null;
        if (c) choisir(c);
        return true;
      }
      default:
        return true;
    }
  };

  // Au clavier : les flèches décalent le fantôme (hors d'un champ de saisie) ; Échap ferme d'abord la question ouverte
  // (« Réunir », « Tout remettre comme avant ? »), puis le panneau ouvert (la liste des ouvrages à reposer, le panneau de
  // la vue simple), puis il désélectionne le choix. Il n'annule jamais.
  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || (e.target as Element | null)?.closest?.('input, select, textarea')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (question) annulerReunion();
        else if (aConfirmer) garder();
        else if (liste) fermerLaListe();
        else if (fermerLePanneau) fermerLePanneau();
        else if (choix && !enCours.current) choisir(null, '');
        return;
      }
      const f = FLECHES.find((x) => x.touche === e.key);
      if (!f) return;
      e.preventDefault();
      fleche(f.dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Le nom du lieu choisi se pose sur son fantôme (la 3D l'écrit au-dessus) ; son étiquette sur l'île se tait.
  const nomChoisi = choix?.genre === 'lieu' ? nom(choix.id) : undefined;
  const vue = useMemo(() => (choix ? { ...arrangeView(world, choix), ...(nomChoisi && choix.genre === 'lieu' ? { nom: nomChoisi, lieu: choix.id } : {}) } : null), [world, choix, nomChoisi]);
  const reunirAvec = choix?.genre === 'lieu' && sameSpot(choix.spot, spotOf(world, choix.id)) ? voisinAReunir(world, choix.id) : null;
  return {
    ouvert,
    ouvrir,
    valider,
    annuler,
    aConfirmer,
    confirmerLAnnulation,
    garder,
    choix,
    vue,
    phrase,
    ligne,
    liste,
    ouvrirLaListe,
    fermerLaListe,
    explication,
    texteDeLExplication: explicationDeLaLiaison(mot),
    mot,
    aReposer,
    geste,
    intention,
    finirLeGeste,
    fleche,
    tourner,
    poserIci,
    defaire,
    peutDefaire: Boolean(session && canUndo(session)),
    choisirUneLiaison,
    demanderReunion,
    question,
    cadre,
    reunir,
    annulerReunion,
    reunirAvec,
    voisinAReunir: (id) => voisinAReunir(world, id),
    choisirDirect: (c) => choisir(c),
  };
}

/** Deux places de la grille sont-elles la même (orientation comprise) ? */
function sameSpot(p: { x: number; y: number; turn: number }, q: { x: number; y: number; turn: number }): boolean {
  return p.x === q.x && p.y === q.y && p.turn === q.turn;
}
