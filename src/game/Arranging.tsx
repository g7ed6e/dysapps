// Le mode « Aménager » (GD-9, point 1), sur la Carte : l'état du mode (`useAmenagement`) : le choix, la phrase écrite et
// lue à chaque calage et après chaque pose (et sa ligne courte, pour le téléphone), la liste des ouvrages à reposer (le
// mot de l'univers), la question de « Réunir », et le geste de la pose (1,5 s au plus, un toucher le termine ; posé
// d'un coup avec moins d'animations). Ce qui s'affiche est dans ArrangeBar.tsx ; les règles dans world/arrange.ts et
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
  choiceSummary,
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
import { type PlaceName, placeSentence } from './world/placeSentence';
import { joinedSentence, thePlace, toPlace } from './world/placeArticle';
import { LIAISON, type LinkPhrases, type LinkWord, linkPhrases } from './world/linkWord';

/** La clé de l'appareil qui retient que le mot « ouvrage à reposer » (le mot de l'univers) a été expliqué (une fois). */
const CLE_DE_L_EXPLICATION = 'amenager-liaison-expliquee';

/** La clé de l'appareil qui retient que le mot « réunir » a été expliqué (une fois). */
const CLE_DE_LA_REUNION = 'amenager-reunir-explique';

/** Ce que dit le mot « ouvrage à reposer » (le mot de l'univers), la première fois. */
function explicationDeLaLiaison(m: LinkPhrases): string {
  return `${m.Un} à reposer, c’est ${m.un} que tu as déjà ${m.accord('construit')} : en déplaçant un lieu, ${m.accord('il', 'elle')} s’est ${m.accord('séparé')}. Rien n’est perdu : tu ${m.accord('le', 'la')} reposes gratuitement entre deux lieux voisins, quand tu veux.`;
}

/**
 * Ce que dit « Réunir » la première fois, après la question (qui dit déjà que les deux lieux ne se sépareront plus) : une
 * phrase sur la construction de l'univers (la digue dans Blocland, la jetée dans Archipéo).
 */
function explicationDeLaReunion(reunion: TextesDeLaReunion): string {
  return reunion.description;
}

/** Ce que dit le jeu quand une pose ne se fait pas. */
function refus(reason: string, m: LinkPhrases): string {
  const textes: Readonly<Record<string, string>> = {
    fixe: 'Ce lieu ne bouge pas : c’est le point de départ de la région.',
    occupee: 'Cette place n’est pas libre.',
    reunis: 'Ce lieu ne peut pas se réunir à un autre ici.',
    liaison: `${m.Ce} ne se pose pas là.`,
    inconnu: 'Ce n’est pas possible ici.',
  };
  return textes[reason] ?? textes.inconnu;
}

/** Le nom et la description de la construction qui réunit deux lieux, dans l'univers (`textes.reunion`). */
interface TextesDeLaReunion {
  nom: string;
  description: string;
}

/** Sans univers : les mots communs. */
const REUNION_COMMUNE: TextesDeLaReunion = { nom: 'La construction qui les réunit', description: 'On la bâtit bloc par bloc, comme une grande construction.' };

/** Les flèches de la barre, dans leur ordre, nommées en mots. */
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
  phrase: string;
  resume: string;
  timers: number[];
  remonte: boolean;
}

export interface Amenagement {
  ouvert: boolean;
  ouvrir(): void;
  terminer(): void;
  choix: ArrangeChoice | null;
  vue: ArrangeView | null;
  phrase: string;
  /** La ligne courte de la phrase, au téléphone : le nom et la direction, ou sa première phrase. */
  resume: string;
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
  /** Le lieu qui se déplace pendant le geste (son étiquette garde « Choisi » jusqu'à la fin), ou rien. */
  lieuDuGeste: BiomeId | null;
  /** Une intention de la vue dans le mode : `true` si le mode l'a prise. */
  intention(i: Intention): boolean;
  /** Un toucher pendant le geste : il se termine tout de suite. */
  finirLeGeste(): void;
  fleche(dir: Direction): void;
  tourner(): void;
  poserIci(): void;
  defaire(): void;
  remettre(): void;
  peutDefaire: boolean;
  peutRemettre: boolean;
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

export function useAmenagement({ world, a, arrange, nom, reduceMotion, habillage, sons, dire, versMonde, reunion = REUNION_COMMUNE, liaisons = LIAISON, hautDuLieu }: Options): Amenagement {
  const mot = useMemo(() => linkPhrases(liaisons), [liaisons]);
  const [session, setSession] = useState<ArrangeSession | null>(null);
  const [choix, setChoix] = useState<ArrangeChoice | null>(null);
  const [phrase, setPhrase] = useState('');
  // La ligne courte de la phrase, au téléphone (le nom et la direction) ; sans elle, la première phrase.
  const [resume, setResume] = useState('');
  const [liste, setListe] = useState(false);
  const [explication, setExplication] = useState(false);
  const [question, setQuestion] = useState<QuestionDeReunion | null>(null);
  // Ce que la vue garde entier après une réunion : la paire et sa construction.
  const [cadre, setCadre] = useState<CadreDuMode | null>(null);
  const [geste, setGeste] = useState<ArrangeGesture | null>(null);
  const [lieuDuGeste, setLieuDuGeste] = useState<BiomeId | null>(null);
  const enCours = useRef<GesteEnCours | null>(null);
  const seq = useRef(0);
  const worldRef = useRef(world);
  worldRef.current = world;
  const [sonDeLaPose] = useState(() => sonDePose(habillage.pose));
  const ouvert = session !== null;
  const aReposer = linksToRelink(world, a);

  const annoncer = (texte: string, court = premierePhrase(texte)) => {
    setPhrase(texte);
    setResume(court);
    if (texte) dire(texte);
  };
  /** Le lieu avec lequel un lieu se réunirait, à sa place dans un monde (le premier voisin ouvert), ou rien. */
  const voisinAReunir = (w: World, id: BiomeId) => joinCandidates(w, id)[0] ?? null;
  /** « Il peut se réunir à … » : dit quand un lieu choisi ou posé a un voisin ouvert à réunir. */
  const peutSeReunir = (w: World, id: BiomeId) => {
    const v = voisinAReunir(w, id);
    return v ? ` Il peut se réunir ${toPlace(nom(v))}. Touche à nouveau ${thePlace(nom(id))}, puis « Réunir ».` : '';
  };
  const choisir = (c: ArrangeChoice | null, texte?: string) => {
    setChoix(c);
    setQuestion(null);
    setCadre(null);
    const w = worldRef.current;
    const aReunir = c?.genre === 'lieu' && sameSpot(c.spot, spotOf(w, c.id)) && voisinAReunir(w, c.id) ? ` Il peut se réunir ${toPlace(nom(voisinAReunir(w, c.id)!))} : « Réunir ».` : '';
    if (texte !== undefined || !c) annoncer(texte ?? '');
    else annoncer(choiceSentence(w, c, nom, mot) + aReunir, choiceSummary(w, c, nom, mot));
  };

  /** Le geste fini (ou touché) : le monde posé, le son, la phrase. */
  const finirLeGeste = () => {
    const g = enCours.current;
    if (!g) return;
    for (const t of g.timers) window.clearTimeout(t);
    enCours.current = null;
    if (!g.remonte) arrange(g.apres);
    setGeste(null);
    setLieuDuGeste(null);
    if (sons) sonDeLaPose();
    annoncer(g.phrase, g.resume);
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
    if (!r.ok) return annoncer(refus(r.reason, mot));
    setSession(recordPose(session, w, r.world));
    setCadre(null);
    // La ligne courte au téléphone : « Posé au nord de la Forêt des sons, à 2 cases. » pour un lieu, deux lignes au plus.
    const court =
      choix.genre === 'lieu' ? `Posé ${placeSentence(r.world, choix.id, spotOf(r.world, choix.id), nom)}.` : `C’est posé. ${choiceSummary(r.world, choix, nom, mot)}`;
    const texte =
      poseSentence(r.world, choix, nom, mot) +
      (r.relink.length ? ` ${mot.aReposer(r.relink.length)}` : '') +
      (choix.genre === 'lieu' ? peutSeReunir(r.world, choix.id) : '');
    setChoix(null);
    // Le geste (un lieu seulement) : démonté à sa place d'avant, remonté à la nouvelle ; d'un coup avec moins d'animations.
    if (choix.genre !== 'lieu' || reduceMotion) {
      arrange(r.world);
      if (sons) sonDeLaPose();
      return annoncer(texte, court);
    }
    const id = choix.id;
    const alt = placeIn(w, id).altitude;
    // Le démontage part du plus haut cube du lieu (et de celui qui lui est réuni) : pas de temps mort au début du geste.
    const autre = joinedWith(w, id);
    const sommets = [id, ...(autre ? [autre] : [])].map((l) => hautDuLieu?.(l)).filter((h): h is number => h !== undefined);
    const base = { bas: alt - GESTE_SOUS_LE_SOL, haut: sommets.length ? Math.max(...sommets) + 1 : alt + 24, dureeMs: GESTE_DU_LIEU.demonteMs };
    const g: GesteEnCours = { apres: r.world, phrase: texte, resume: court, timers: [], remonte: false };
    enCours.current = g;
    const ancienne = gestureZone(emprise(w, id));
    const nouvelle = gestureZone(emprise(r.world, id));
    setGeste({ ...base, seq: ++seq.current, phase: 'demonte', zone: ancienne, autre: nouvelle, debut: performance.now() });
    setLieuDuGeste(id);
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
  const terminer = () => {
    finirLeGeste();
    setSession(null);
    setChoix(null);
    setQuestion(null);
    setCadre(null);
    setListe(false);
    setExplication(false);
    setPhrase('');
    setResume('');
  };

  const fleche = (dir: Direction) => {
    if (!choix || enCours.current) return;
    const s = stepChoice(worldRef.current, choix, dir);
    if (!s) return annoncer(NO_MORE_ROOM);
    choisir(s);
  };
  const tourner = () => {
    if (!choix || enCours.current || !session) return;
    if (choix.genre === 'gardien') {
      const w = worldRef.current;
      const { result, sentence } = turnGuardianNow(w, choix.id);
      if (!result.ok) return annoncer(refus(result.reason, mot));
      setSession(recordPose(session, w, result.world));
      arrange(result.world);
      if (sons) sonDeLaPose();
      // Tourner un Gardien le pose tout de suite : la phrase le dit.
      return annoncer(`C’est posé. ${sentence}`);
    }
    if (choix.genre !== 'lieu') return;
    const t = turnChoice(worldRef.current, choix);
    if (!t) return annoncer(refus('occupee', mot));
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
  const remettre = () => {
    if (!session || enCours.current) return;
    const r = resetToEntry(session, worldRef.current);
    setSession(r.session);
    arrange(r.world);
    choisir(null, 'Tout est remis comme avant.');
  };

  const demanderReunion = (direct?: BiomeId) => {
    const w = worldRef.current;
    if (!session || enCours.current) return;
    const id = direct ?? (choix?.genre === 'lieu' && sameSpot(choix.spot, spotOf(w, choix.id)) ? choix.id : null);
    const voisins = id ? joinCandidates(w, id) : [];
    if (!id || !voisins.length) return annoncer(refus('reunis', mot));
    // Le mot « réunir » et la construction de l'univers, expliqués la première fois.
    const premiere = !loadJSON<{ vu: boolean }>(CLE_DE_LA_REUNION, { vu: false }).vu;
    if (premiere) saveJSON(CLE_DE_LA_REUNION, { vu: true });
    const q: QuestionDeReunion = { id, voisins, explication: premiere ? explicationDeLaReunion(reunion) : null };
    setQuestion(q);
    // L'espace insécable avant « ? » : le point d'interrogation ne part jamais seul à la ligne.
    const texte = `Réunir ${thePlace(nom(id))} et ${voisins.length === 1 ? thePlace(nom(voisins[0])) : 'quel lieu'}\u00a0? Les deux lieux ne se sépareront plus.`;
    setPhrase(texte);
    setResume(premierePhrase(texte));
    dire(q.explication ? `${texte} ${q.explication}` : texte);
  };
  const annulerReunion = () => {
    setQuestion(null);
    annoncer('Rien n’est réuni.');
  };

  const reunir = (id: BiomeId, autre: BiomeId) => {
    const w = worldRef.current;
    setQuestion(null);
    if (!session || enCours.current) return;
    const r = joinIslands(w, id, autre);
    if (!r.ok) return annoncer(refus(r.reason, mot));
    setSession(recordPose(session, w, r.world));
    arrange(r.world);
    setChoix(null);
    setCadre({ rect: emprise(r.world, id), z: placeIn(r.world, id).altitude, seq: ++seq.current });
    if (sons) sonDeLaPose();
    // Des phrases courtes, une idée chacune, sans symbole ; « réuni » s'accorde avec le premier lieu.
    const reunis = joinedSentence(nom(id), nom(autre));
    annoncer(
      [reunis, 'Les deux lieux bougent ensemble.', r.relink.length ? mot.aReposer(r.relink.length) : '', `${reunion.nom} se construit depuis le panneau de l’île.`, 'Défaire annule la réunion.'].filter(Boolean).join(' '),
      reunis,
    );
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
        else annoncer('Touche d’abord un lieu, un gardien, une borne ou une liaison.');
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
        if (!c) annoncer(refus('fixe', mot));
        else choisir(c);
        return true;
      }
      case 'creature':
        if (i.gardien) choisir(chooseGuardian(w, i.id));
        else {
          const c = chooseIsland(w, i.id);
          if (c) choisir(c);
          else annoncer(refus('fixe', mot));
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

  // Au clavier : les flèches décalent le fantôme (hors d'un champ de saisie).
  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      const f = FLECHES.find((x) => x.touche === e.key);
      if (!f || e.defaultPrevented || (e.target as Element | null)?.closest?.('input, select, textarea')) return;
      e.preventDefault();
      fleche(f.dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Le nom du lieu choisi se pose sur son fantôme (la 3D l'écrit au-dessus).
  const nomChoisi = choix?.genre === 'lieu' ? nom(choix.id) : undefined;
  const vue = useMemo(() => (choix ? { ...arrangeView(world, choix), ...(nomChoisi ? { nom: nomChoisi } : {}) } : null), [world, choix, nomChoisi]);
  const reunirAvec = choix?.genre === 'lieu' && sameSpot(choix.spot, spotOf(world, choix.id)) ? voisinAReunir(world, choix.id) : null;
  return {
    ouvert,
    ouvrir,
    terminer,
    choix,
    vue,
    phrase,
    resume,
    liste,
    ouvrirLaListe,
    fermerLaListe,
    explication,
    texteDeLExplication: explicationDeLaLiaison(mot),
    mot,
    aReposer,
    geste,
    lieuDuGeste,
    intention,
    finirLeGeste,
    fleche,
    tourner,
    poserIci,
    defaire,
    remettre,
    peutDefaire: Boolean(session && canUndo(session)),
    peutRemettre: Boolean(session && hasChanged(session, world)),
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

/** La première phrase d'un texte (jusqu'au premier point, point d'interrogation ou d'exclamation suivi d'une espace). */
function premierePhrase(texte: string): string {
  const m = /^.*?[.?!](?=\s|$)/.exec(texte);
  return m ? m[0] : texte;
}

/** Deux places de la grille sont-elles la même (orientation comprise) ? */
function sameSpot(p: { x: number; y: number; turn: number }, q: { x: number; y: number; turn: number }): boolean {
  return p.x === q.x && p.y === q.y && p.turn === q.turn;
}
