// La remise (GD-20, point 4, piste B « La remise », lot L1 « Livrer ») : « Livrer » touché chez l'habitant, la scénette de
// son lieu s'ouvre, cadrée un peu plus large pour l'aménagement (le même regard que la mission du lieu). Trois temps,
// une seule action par temps (référent dys, arbitrages du directeur artistique, points 5 et 6) :
// 1. la consigne, écrite et lue (« Tu livres 3 blocs de terre pour le potager. »), sous le rôle de l'habitant, son
//    icône, le paquet ; la pose ne part qu'à la fin de la voix, ou, sans voix, après un délai borné
//    (world/continu/remise.ts) ;
// 2. la pose : chaque élément descend à sa place, un toc chacun (tout d'un coup et un seul toc avec « Réduire les
//    animations ») ;
// 3. l'état final : tout est posé, la phrase de fin (« Le potager est en place. »), qui prend la place de la consigne
//    (un seul emplacement, consultant UX UI), lue depuis son début, et « Continuer », en bas, là où se tient la rangée
//    des réponses d'une mission, le focus sur lui.
// Un toucher n'importe où pendant les temps 1 et 2 (la zone de la scène, dite « Passer » au lecteur d'écran ; au clavier,
// Entrée ou Espace) mène à l'état final, jamais plus loin : « Continuer » ne prend ni ce toucher ni la répétition de la
// touche. « Vue simple » (à la place de celui d'une mission, le coin de la pause laissé vide) : la consigne, l'icône de
// l'objet et la phrase de fin, en liste, puis « Continuer » (l'état final) ; elle s'ouvre d'elle-même au plus grand texte
// sur un écran vraiment bas, une fois sa taille mesurée, comme en mission. La livraison (`deliver`, celle de la grille)
// s'écrit une fois, à l'état final ; toute sortie par l'application (Retour du système, une autre adresse) passe d'abord
// par lui, et coupe la voix. Une coupure brutale avant n'écrit rien : la commande reste prête.
//
// Lot L2, l'entraide : la même remise pour ses deux gestes. « Donner » : les blocs donnés descendent un à un dans une
// caisse ouverte, aux pieds de l'habitant (world/continu/caisse.ts), et la fin dit l'étape suivante (« Apporte la
// lanterne au Phare. ») ; « Continuer » seul, jamais « Y aller » (arbitrages, point 5) : au retour, la suggestion la
// porte. « Apporter » : l'objet passe de la main de Kéo à sa place, d'un seul bloc ; la fin « posée », puis les 50 XP de
// l'entraide finie, avec l'icône et le compte habituels. L'étape (`tapStory`) s'écrit comme la livraison : une fois, à
// l'état final.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Icon } from '../../../components/Icon';
import { SpeakButton } from '../../../components/SpeakButton';
import { Syllabified } from '../../../components/Syllabified';
import { frenchTypography } from '../../../components/math/RichText';
import { isSpeechAvailable } from '../../../core/speech';
import { useSettings } from '../../../core/SettingsContext';
import { texteGrand } from '../../../core/settings';
import { BLOCKS } from '../../biomes';
import { playWoodTap } from '../../sound';
import { BlockIcon } from '../../Voxel';
import { questionLayout } from '../../world/continu/questionScene';
import { VOICE_CAP_MS, voiceFallbackMs } from '../../world/continu/remise';
import { scenetteLayout } from '../../world/continu/scenette';
import type { RemiseRequest } from './remiseOf';
import type { OpenWorld } from './scene';

/** Le temps pendant lequel « Continuer », à peine montré, ne prend aucun toucher : celui qui vient de sauter la scène. */
const CONTINUE_GUARD_MS = 300;
/** Le pas de l'attente d'une voix qui parle encore. */
const QUIET_STEP_MS = 250;

type Phase = 'consigne' | 'pose' | 'fin';

interface Props {
  world: OpenWorld;
  request: RemiseRequest;
  /** Écrit la livraison, ou l'étape d'entraide (une fois : le composant la garde). */
  act(): void;
  /** « Continuer » : la remise est finie, la page rend le monde. */
  onClose(): void;
}

/** La voix parle-t-elle encore ? */
const speaking = () => isSpeechAvailable() && window.speechSynthesis.speaking;

export function Remise({ world, request, act, onClose }: Props) {
  const { settings, speak, stop } = useSettings();
  const grand = texteGrand(settings);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = box.current?.parentElement;
    if (!el) return;
    const measure = () => setSize((s) => (s.w === el.clientWidth && s.h === el.clientHeight ? s : { w: el.clientWidth, h: el.clientHeight }));
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, []);
  const layout = useMemo(() => scenetteLayout({ count: 0, grand }, size.w || 1, size.h || 1, questionLayout({ count: 0 }, size.w || 1, size.h || 1)), [grand, size]);

  const consigne = frenchTypography(request.consigne);
  const done = frenchTypography(request.done);
  const [phase, setPhase] = useState<Phase>('consigne');
  const phaseRef = useRef<Phase>('consigne');
  // Au plus grand texte sur un écran bas, « Vue simple » d'office (comme en mission) : l'état final, sa liste.
  const [simple, setSimple] = useState(false);
  const delivered = useRef(false);
  const deliverOnce = useRef(act);
  useEffect(() => {
    deliverOnce.current = act;
  }, [act]);
  const writeDelivery = useCallback(() => {
    if (delivered.current) return;
    delivered.current = true;
    deliverOnce.current();
  }, []);

  /** L'état final, d'un coup ou au bout de la pose : tout est posé, la livraison écrite, la fin lue depuis son début. */
  const toFinal = useCallback(
    (skipped: boolean) => {
      if (phaseRef.current === 'fin') return;
      phaseRef.current = 'fin';
      world.remiseFinish();
      // Sauté pendant la consigne : rien n'avait encore été posé, un seul toc pour tout.
      if (skipped && settings.sounds) playWoodTap();
      writeDelivery();
      setPhase('fin');
      if (settings.autoRead) speak(done);
      else stop();
    },
    [world, settings.sounds, settings.autoRead, speak, stop, done, writeDelivery],
  );
  const toFinalRef = useRef(toFinal);
  useEffect(() => {
    toFinalRef.current = toFinal;
  }, [toFinal]);

  // La remise dans la scène, et la consigne : lue, puis la pose ; sans voix, après un délai borné. Jamais pendant qu'une
  // voix parle (« Réécouter » touché pendant la consigne : la pose attend sa fin).
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const since = performance.now();
    let timer: number | undefined;
    const start = () => {
      if (!mounted.current || phaseRef.current !== 'consigne') return;
      if (speaking() && performance.now() - since < VOICE_CAP_MS) {
        timer = window.setTimeout(start, QUIET_STEP_MS);
        return;
      }
      phaseRef.current = 'pose';
      setPhase('pose');
      world.remiseStart();
    };
    world.remise(request.play, {
      element: () => {
        if (settings.sounds) playWoodTap();
      },
      done: () => toFinalRef.current(false),
    });
    const voice = settings.autoRead && isSpeechAvailable();
    if (voice) speak(consigne, () => window.setTimeout(start, 0));
    // La fin de la voix qui n'arrive jamais, ou pas de voix : le délai borné (plus long d'un cap quand la voix lit).
    timer = window.setTimeout(start, voice ? VOICE_CAP_MS : voiceFallbackMs(consigne));
    return () => {
      mounted.current = false;
      window.clearTimeout(timer);
      // Démonté (une autre adresse, le Retour du système) : l'état final d'abord, donc la livraison, la voix coupée, puis
      // la scène quitte la remise (rien, si la page entière s'est fermée : la scène défaite ne fait plus rien). Le double
      // montage du mode strict remonte avant la micro-tâche : rien ne s'écrit alors.
      queueMicrotask(() => {
        if (mounted.current) return;
        writeDelivery();
        stop();
        world.remise(null);
      });
    };
    // Une seule remise par montage : la page la monte avec sa clé (la commande, ou la quête et son étape).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // « Vue simple » d'office au plus grand texte sur un écran bas : l'état final, en liste. Jamais avant la mesure de la
  // taille (au premier rendu, la taille vaut 0 : tout écran paraîtrait bas, et la remise serait sautée au montage).
  useEffect(() => {
    if (size.h > 0 && grand && layout.low && !simple) {
      setSimple(true);
      toFinal(true);
    }
  }, [size.h, grand, layout.low, simple, toFinal]);

  // « Continuer » : le focus dès qu'il paraît ; ni le toucher qui a sauté la scène, ni la répétition de la touche.
  const continueRef = useRef<HTMLButtonElement>(null);
  const shownAt = useRef(0);
  useEffect(() => {
    if (phase !== 'fin') return;
    shownAt.current = performance.now();
    continueRef.current?.focus();
  }, [phase, simple]);
  // En « Vue simple », la liste qui ne tient pas (le plus grand texte sur un écran bas) défile jusqu'à la phrase de fin.
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = panelRef.current;
    if (phase === 'fin' && simple && el) el.scrollTop = el.scrollHeight;
  }, [phase, simple]);
  const skipRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    skipRef.current?.focus();
  }, []);
  const onContinue = () => {
    if (performance.now() - shownAt.current < CONTINUE_GUARD_MS) return;
    stop();
    // La scène quitte la remise tout de suite (la caméra derrière Kéo), avant que le panneau du lieu se rouvre et s'y cadre.
    world.remise(null);
    onClose();
  };
  const onContinueKey = (e: KeyboardEvent) => {
    if (e.repeat) e.preventDefault();
  };
  const openSimple = () => {
    setSimple(true);
    toFinal(true);
  };

  const block = BLOCKS[request.block];
  const style = {
    '--question-left': `${layout.panel.left}px`,
    '--question-top': `${layout.panel.top}px`,
    '--question-width': `${layout.panel.width}px`,
    '--question-max-height': `${layout.panel.maxHeight}px`,
  } as CSSProperties;
  const final = phase === 'fin';

  return (
    <div className={`open-world-remise${simple ? ' simple' : ''}${layout.low ? ' low' : ''}`} ref={box} style={style}>
      {/* La zone de la scène : un toucher y mène à l'état final, jamais plus loin ; sans bouton visible (une seule action). */}
      {!final && <button type="button" ref={skipRef} className="open-world-remise-skip" aria-label="Passer" onClick={() => toFinal(true)} />}
      <section ref={panelRef} className="open-world-remise-panel" aria-labelledby="remise-consigne">
        <p className="open-world-remise-role">{request.role}</p>
        <div className="open-world-remise-consigne">
          <span className="open-world-remise-paquet" aria-hidden="true">
            <Icon name="paquet" />
          </span>
          {/* La consigne, puis, à l'état final, la phrase de fin à sa place (dans la scène) ; une zone annoncée par les
              lecteurs d'écran, là dès le début : seule la phrase de fin, qui change, est annoncée. En « Vue simple », la
              consigne reste, la phrase de fin vient dessous, avec l'icône de l'objet. */}
          <p id="remise-consigne" className={final && !simple ? 'open-world-remise-fin' : undefined} role="status">
            <Syllabified text={final && !simple ? done : consigne} />
          </p>
          <SpeakButton text={final ? (simple ? `${consigne} ${done}` : done) : consigne} label="Réécouter" compact />
        </div>
        {/* En « Vue simple » (toujours l'état final), l'icône de l'objet et la phrase de fin, sur une ligne, dans leur zone
            annoncée, là dès le début, vide jusque-là. */}
        <p className="open-world-remise-fin" role="status">
          {final && simple ? (
            <>
              {block && (
                <span className="open-world-remise-objet" aria-hidden="true">
                  <BlockIcon top={block.top} side={block.side} size={36} />
                </span>
              )}
              <Syllabified text={done} />
            </>
          ) : (
            ''
          )}
        </p>
        {/* L'XP d'une entraide finie, après la phrase de fin, avec l'icône et le compte habituels (ceux du bilan). */}
        {final && request.xp ? (
          <ul className="world-done-pills open-world-remise-gain">
            <li aria-label={`${request.xp} XP`}>
              <Icon name="zap" size="1.4rem" />
              <span aria-hidden="true">+{request.xp}</span>
            </li>
          </ul>
        ) : null}
      </section>
      {final && (
        <div className="open-world-remise-suite">
          <button type="button" ref={continueRef} className="button primary" onClick={onContinue} onKeyDown={onContinueKey}>
            <Icon name="play" /> Continuer
          </button>
        </div>
      )}
      {/* « Vue simple », à la place de celui d'une mission, et « Scène » pour revenir à l'objet posé. */}
      {!simple ? (
        <button type="button" className="button open-world-remise-simple" onClick={openSimple}>
          <Icon name="liste" /> <span>Vue simple</span>
        </button>
      ) : (
        !(grand && layout.low) && (
          <button type="button" className="button open-world-remise-simple" onClick={() => setSimple(false)}>
            <Icon name="mountain" /> <span>Scène</span>
          </button>
        )
      )}
    </div>
  );
}
