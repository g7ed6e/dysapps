// Le mode « Aménager » à l'écran (GD-9, point 1), sur la Carte : le bouton en icône (quatre flèches) et sa pastille des
// liaisons à reposer, la barre du mode à place fixe (les flèches nommées en mots, « Tourner », « Poser ici », ↶,
// « Remettre comme avant », ✓ Terminé), la phrase écrite et lue à chaque calage et après chaque pose, la liste des
// liaisons à reposer, et le geste de la pose (1,5 s au plus, un toucher le termine ; posé d'un coup avec moins
// d'animations). Les règles sont dans world/arrange.ts et world/arrangeMode.ts ; la 3D dessine le choix
// (three/arrange.ts). Les mots sont communs aux deux univers ; chaque univers habille le geste et son son.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, type AnyIconName } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { loadJSON, saveJSON } from '../core/storage';
import type { BiomeId } from './biomes';
import type { World } from './engine/state';
import { sonDePose } from './sound';
import type { Habillage } from './skin';
import { getBridge } from './world/archipelago';
import { type ArchipelagoId, archipelagoOfIsland } from './world/archipelagos';
import { type Direction, guardianOf, joinCandidates, joinedWith, joinIslands, joinsIn, linksToRelink, NO_MORE_ROOM, placeIn, spotOf } from './world/arrange';
import {
  type ArrangeChoice,
  canTurn,
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
import { GESTE_DU_LIEU, gestureZone } from './world/arrangeGesture';
import type { ArrangeGesture, ArrangeView } from './world/view';
import { footprintOf } from './world/footprint';
import type { Intention, Point } from './world/layout';
import type { Rectangle } from './world/placement';
import type { PlaceName } from './world/placeSentence';

/** La clé de l'appareil qui retient que le mot « liaison à reposer » a été expliqué (une fois). */
const CLE_DE_L_EXPLICATION = 'amenager-liaison-expliquee';

/** Ce que dit le mot « liaison à reposer », la première fois. */
const EXPLICATION_DE_LA_LIAISON =
  'Une liaison à reposer, c’est une liaison que tu as déjà construite : en déplaçant un lieu, elle s’est séparée. Rien n’est perdu : tu la reposes gratuitement entre deux lieux voisins, quand tu veux.';

/** Ce que dit le jeu quand une pose ne se fait pas. */
const REFUS: Readonly<Record<string, string>> = {
  fixe: 'Ce lieu ne bouge pas : c’est le point de départ de la région.',
  occupee: 'Cette place n’est pas libre.',
  reunis: 'Ce lieu ne peut pas se réunir à un autre ici.',
  liaison: 'Cette liaison ne se pose pas là.',
  inconnu: 'Ce n’est pas possible ici.',
};

/** Les flèches de la barre, dans leur ordre, nommées en mots. */
const FLECHES: readonly { dir: Direction; icone: AnyIconName; nom: string; touche: string }[] = [
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
  /** Le nom de la construction qui réunit deux lieux dans l'univers (« La digue »), avec l'article. */
  nomDeLaReunion?: string;
}

/** Le geste de pose en cours : ce qu'il posera, et ses minuteries. */
interface GesteEnCours {
  apres: World;
  phrase: string;
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
  /** La liste des liaisons à reposer est ouverte. */
  liste: boolean;
  ouvrirLaListe(): void;
  fermerLaListe(): void;
  /** Le mot « liaison à reposer » à expliquer (la première fois), ou rien. */
  explication: boolean;
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
  remettre(): void;
  peutDefaire: boolean;
  peutRemettre: boolean;
  choisirUneLiaison(id: string): void;
  /**
   * « Réunir » (GD-9, point 10) : le lieu choisi (ou `id`, depuis la vue simple), à sa place, avec son premier voisin
   * ouvert à la bonne distance.
   */
  reunir(id?: BiomeId): void;
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

export function useAmenagement({ world, a, arrange, nom, reduceMotion, habillage, sons, dire, versMonde, nomDeLaReunion = 'La construction qui les réunit' }: Options): Amenagement {
  const [session, setSession] = useState<ArrangeSession | null>(null);
  const [choix, setChoix] = useState<ArrangeChoice | null>(null);
  const [phrase, setPhrase] = useState('');
  const [liste, setListe] = useState(false);
  const [explication, setExplication] = useState(false);
  const [geste, setGeste] = useState<ArrangeGesture | null>(null);
  const enCours = useRef<GesteEnCours | null>(null);
  const seq = useRef(0);
  const worldRef = useRef(world);
  worldRef.current = world;
  const [sonDeLaPose] = useState(() => sonDePose(habillage.pose));
  const ouvert = session !== null;
  const aReposer = linksToRelink(world, a);

  const annoncer = (texte: string) => {
    setPhrase(texte);
    if (texte) dire(texte);
  };
  /** Le lieu avec lequel un lieu se réunirait, à sa place dans un monde (le premier voisin ouvert), ou rien. */
  const voisinAReunir = (w: World, id: BiomeId) => joinCandidates(w, id)[0] ?? null;
  /** « Il peut se réunir à … » : dit quand un lieu choisi ou posé a un voisin ouvert à réunir. */
  const peutSeReunir = (w: World, id: BiomeId) => {
    const v = voisinAReunir(w, id);
    return v ? ` Il peut se réunir à ${nom(v)} : touche-le, puis « Réunir ».` : '';
  };
  const choisir = (c: ArrangeChoice | null, texte?: string) => {
    setChoix(c);
    const w = worldRef.current;
    const reunion = c?.genre === 'lieu' && sameSpot(c.spot, spotOf(w, c.id)) && voisinAReunir(w, c.id) ? ` Il peut se réunir à ${nom(voisinAReunir(w, c.id)!)} : « Réunir ».` : '';
    annoncer(texte ?? (c ? choiceSentence(w, c, nom) + reunion : ''));
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
    annoncer(g.phrase);
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
    if (!r.ok) return annoncer(REFUS[r.reason] ?? REFUS.inconnu);
    setSession(recordPose(session, w, r.world));
    const texte =
      poseSentence(r.world, choix, nom) +
      (r.relink.length ? ` ${r.relink.length === 1 ? 'Une liaison est' : `${r.relink.length} liaisons sont`} à reposer.` : '') +
      (choix.genre === 'lieu' ? peutSeReunir(r.world, choix.id) : '');
    setChoix(null);
    // Le geste (un lieu seulement) : démonté à sa place d'avant, remonté à la nouvelle ; d'un coup avec moins d'animations.
    if (choix.genre !== 'lieu' || reduceMotion) {
      arrange(r.world);
      if (sons) sonDeLaPose();
      return annoncer(texte);
    }
    const id = choix.id;
    const alt = placeIn(w, id).altitude;
    const base = { bas: alt - 5, haut: alt + 24, dureeMs: GESTE_DU_LIEU.demonteMs };
    const g: GesteEnCours = { apres: r.world, phrase: texte, timers: [], remonte: false };
    enCours.current = g;
    setGeste({ ...base, seq: ++seq.current, phase: 'demonte', zone: gestureZone(emprise(w, id)), debut: performance.now() });
    g.timers.push(
      window.setTimeout(() => {
        g.remonte = true;
        arrange(r.world);
        setGeste({ ...base, dureeMs: GESTE_DU_LIEU.remonteMs, seq: ++seq.current, phase: 'remonte', zone: gestureZone(emprise(r.world, id)), debut: performance.now() });
        g.timers.push(window.setTimeout(finirLeGeste, GESTE_DU_LIEU.remonteMs));
      }, GESTE_DU_LIEU.demonteMs),
    );
  };

  const ouvrir = () => {
    if (ouvert) return;
    setSession(startArranging(worldRef.current));
    choisir(null, 'Touche un lieu, un gardien, une borne ou une liaison pour le déplacer.');
  };
  const terminer = () => {
    finirLeGeste();
    setSession(null);
    setChoix(null);
    setListe(false);
    setExplication(false);
    setPhrase('');
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
      if (!result.ok) return annoncer(REFUS[result.reason]);
      setSession(recordPose(session, w, result.world));
      arrange(result.world);
      if (sons) sonDeLaPose();
      return annoncer(sentence);
    }
    if (choix.genre !== 'lieu') return;
    const t = turnChoice(worldRef.current, choix);
    if (!t) return annoncer(REFUS.occupee);
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

  const reunir = (direct?: BiomeId) => {
    const w = worldRef.current;
    if (!session || enCours.current) return;
    const id = direct ?? (choix?.genre === 'lieu' && sameSpot(choix.spot, spotOf(w, choix.id)) ? choix.id : null);
    const autre = id ? voisinAReunir(w, id) : null;
    if (!id || !autre) return annoncer(REFUS.reunis);
    const r = joinIslands(w, id, autre);
    if (!r.ok) return annoncer(REFUS[r.reason] ?? REFUS.inconnu);
    setSession(recordPose(session, w, r.world));
    arrange(r.world);
    setChoix(null);
    if (sons) sonDeLaPose();
    const liaisons = r.relink.length ? ` ${r.relink.length === 1 ? 'Une liaison est' : `${r.relink.length} liaisons sont`} à reposer.` : '';
    annoncer(`${nom(id)} et ${nom(autre)} sont réunis : ils bougent maintenant ensemble.${liaisons} ${nomDeLaReunion} se construit depuis le panneau du lieu. ↶ défait la réunion tant que le mode est ouvert.`);
  };

  const ouvrirLaListe = () => {
    if (!ouvert) ouvrir();
    setListe(true);
    setExplication(false);
    if (!loadJSON<{ vu: boolean }>(CLE_DE_L_EXPLICATION, { vu: false }).vu) {
      setExplication(true);
      saveJSON(CLE_DE_L_EXPLICATION, { vu: true });
      dire(EXPLICATION_DE_LA_LIAISON);
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
        if (!c) annoncer(REFUS.fixe);
        else choisir(c);
        return true;
      }
      case 'creature':
        if (i.gardien) choisir(chooseGuardian(w, i.id));
        else {
          const c = chooseIsland(w, i.id);
          if (c) choisir(c);
          else annoncer(REFUS.fixe);
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

  const vue = useMemo(() => (choix ? arrangeView(world, choix) : null), [world, choix]);
  const reunirAvec = choix?.genre === 'lieu' && sameSpot(choix.spot, spotOf(world, choix.id)) ? voisinAReunir(world, choix.id) : null;
  return {
    ouvert,
    ouvrir,
    terminer,
    choix,
    vue,
    phrase,
    liste,
    ouvrirLaListe,
    fermerLaListe,
    explication,
    aReposer,
    geste,
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
    reunir,
    reunirAvec,
    voisinAReunir: (id) => voisinAReunir(world, id),
    choisirDirect: (c) => choisir(c),
  };
}

/** Deux places de la grille sont-elles la même (orientation comprise) ? */
function sameSpot(p: { x: number; y: number; turn: number }, q: { x: number; y: number; turn: number }): boolean {
  return p.x === q.x && p.y === q.y && p.turn === q.turn;
}

/** Le bouton « Aménager » de la barre de la Carte : quatre flèches, et la pastille des liaisons à reposer (icône et nombre). */
export function ArrangeButton({ amenagement }: { amenagement: Amenagement }) {
  const n = amenagement.aReposer.length;
  return (
    <button
      type="button"
      className="button world-bar-amenager"
      aria-pressed={amenagement.ouvert}
      aria-label={n ? `Aménager (${n} liaison${n > 1 ? 's' : ''} à reposer)` : 'Aménager'}
      onClick={() => (amenagement.ouvert ? amenagement.terminer() : n ? amenagement.ouvrirLaListe() : amenagement.ouvrir())}
    >
      <Icon name="amenager" /> <span className="world-bar-text">Aménager</span>
      {n > 0 && (
        <span className="world-bar-count arrange-count" aria-hidden="true">
          <Icon name="aReposer" size={14} />
          {n}
        </span>
      )}
    </button>
  );
}

/** La phrase du mode, en haut, sur un fond uni : écrite, et lisible à voix haute. */
export function ArrangeSentence({ amenagement, nom }: { amenagement: Amenagement; nom: PlaceName }) {
  const { liste, explication, aReposer, phrase } = amenagement;
  if (liste)
    return (
      <div className="creature-line world-line arrange-relink" role="dialog" aria-label="Liaisons à reposer">
        {explication && (
          <p className="arrange-explication">
            {EXPLICATION_DE_LA_LIAISON} <SpeakButton text={EXPLICATION_DE_LA_LIAISON} compact />
          </p>
        )}
        <p>
          <strong>
            <Icon name="aReposer" /> Liaisons à reposer : {aReposer.length}
          </strong>
        </p>
        <ul className="arrange-relink-list">
          {aReposer.map((id) => {
            const b = getBridge(id);
            return (
              <li key={id}>
                <button type="button" className="button" onClick={() => amenagement.choisirUneLiaison(id)}>
                  {b ? `Entre ${nom(b.from)} et ${nom(b.to)}` : id}
                </button>
              </li>
            );
          })}
        </ul>
        <button type="button" className="icon-button" aria-label="Fermer" onClick={amenagement.fermerLaListe}>
          <Icon name="close" />
        </button>
      </div>
    );
  if (!phrase) return null;
  return (
    <div className="creature-line world-line arrange-line" role="status" aria-live="polite">
      <p>{phrase}</p>
      <SpeakButton text={phrase} compact />
    </div>
  );
}

/**
 * La barre du mode, à place fixe : les quatre flèches nommées, « Tourner », « Poser ici », ↶, « Remettre comme avant »
 * et ✓ Terminé. Un seul bouton mis en avant : « Poser ici » pendant un choix, ✓ Terminé quand rien n'est en cours. Les
 * boutons sans effet restent à leur place, éteints.
 */
export function ArrangeBar({ amenagement, className }: { amenagement: Amenagement; className?: string }) {
  const { choix, geste } = amenagement;
  const occupe = Boolean(geste);
  return (
    <nav className={`arrange-bar${className ? ` ${className}` : ''}`} data-couvre="scene" aria-label="Aménager">
      <div className="arrange-bar-row">
        {FLECHES.map((f) => (
          <button key={f.dir} type="button" className="button arrange-arrow" disabled={!choix || occupe} onClick={() => amenagement.fleche(f.dir)}>
            <Icon name={f.icone} /> <span>{f.nom}</span>
          </button>
        ))}
        <button type="button" className="button" disabled={!canTurn(choix) || occupe} onClick={amenagement.tourner}>
          <Icon name="tourner" /> <span>Tourner</span>
        </button>
        <button type="button" className="button" disabled={!amenagement.reunirAvec || occupe} onClick={() => amenagement.reunir()}>
          <Icon name="reunir" /> <span>Réunir</span>
        </button>
        <button type="button" className={`button arrange-pose${choix ? ' primary' : ''}`} disabled={!choix || occupe} onClick={amenagement.poserIci}>
          <Icon name="check" /> <span>Poser ici</span>
        </button>
      </div>
      <div className="arrange-bar-row">
        <button type="button" className="button" disabled={!amenagement.peutDefaire || occupe} onClick={amenagement.defaire} aria-label="Défaire la dernière pose">
          <Icon name="defaire" />
        </button>
        {/* Sans icône : la seule flèche de la rangée reste celle de ↶, qui ne se confond plus avec une autre. */}
        <button type="button" className="button" disabled={!amenagement.peutRemettre || occupe} onClick={amenagement.remettre}>
          <span>Remettre comme avant</span>
        </button>
        <button type="button" className={`button arrange-fin${choix ? '' : ' primary'}`} onClick={amenagement.terminer}>
          <Icon name="check" /> <span>Terminé</span>
        </button>
      </div>
    </nav>
  );
}
