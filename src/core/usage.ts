// La mesure d'usage et de performance (demande du mainteneur, 9 octobre 2026) : combien de lancements, combien de
// temps sur chaque écran, à quelle fluidité tourne le monde en 3D, quelles erreurs. Anonyme : aucun identifiant, rien
// n'est écrit sur l'appareil, et le Worker n'enregistre pas l'adresse IP (src/worker/index.ts). C'est une mesure
// d'audience exemptée de consentement au sens de la CNIL ; Réglages › Application permet de la couper.
// Seulement dans l'application publiée sur Cloudflare (ni le serveur de développement, ni GitHub Pages), et jamais
// pendant les captures et les mesures (navigateur piloté, `?mesures`). Les évènements attendent en mémoire et partent
// ensemble quand l'application passe en arrière-plan, ou tous les dix.
import { APP_VERSION } from './appUpdate';
import { reglagesCourants } from './settings';
import { universAffiche } from './universe';
import { cleanMessage, type LaunchEvent, MAX_EVENTS, screenOf, SLOW_FRAME_MS, type UsageBatch, type UsageEvent } from './usageEvents';

/** L'application publiée à la racine : Cloudflare, pas GitHub Pages ni le serveur de développement. */
const published = () => import.meta.env.PROD && import.meta.env.BASE_URL === '/' && typeof window !== 'undefined';
const FLUSH_AT = 10;
/** Un passage plus court n'est pas compté (une redirection, un retour aussitôt). */
const MIN_SCREEN_MS = 1000;
/** Un écart plus long entre deux images est une pause (onglet caché, boucle arrêtée), pas une image lente. */
const MAX_FRAME_MS = 1000;

interface OpenScreen {
  screen: string;
  since: number;
  frames: number;
  frameMs: number;
  slowFrames: number;
}

let started = false;
let launch: LaunchEvent | null = null;
let current: OpenScreen | null = null;
let queue: UsageEvent[] = [];
let firstFrameMs = 0;
/** Les écrans ouverts depuis le lancement : la première image ne compte que sur le premier. */
let screensOpened = 0;

/** La mesure est-elle permise ici ? Le réglage se relit à chaque envoi : le couper efface ce qui attendait. */
function allowed(): boolean {
  if (!published()) return false;
  if (navigator.webdriver || new URLSearchParams(window.location.search).has('mesures')) return false;
  return reglagesCourants()?.usageStats ?? true;
}

const round = (v: number, step: number) => Math.round(v / step) * step;

/** Démarre la mesure au lancement de l'application : le lancement, puis l'envoi en arrière-plan et les erreurs. */
export function startUsage(): void {
  if (started || !published()) return;
  started = true;
  launch = {
    kind: 'launch',
    startMs: Math.round(performance.now()),
    firstFrameMs: 0,
    width: round(window.innerWidth, 100),
    height: round(window.innerHeight, 100),
    dpr: round(window.devicePixelRatio || 1, 0.5),
    installed: window.matchMedia?.('(display-mode: standalone)').matches === true,
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      closeScreen();
      flushUsage();
    } else if (paused) {
      openScreen(paused);
      paused = null;
    }
  });
  window.addEventListener('pagehide', () => {
    closeScreen();
    flushUsage();
  });
  window.addEventListener('error', (e) => recordError(e.message));
  window.addEventListener('unhandledrejection', (e) => recordError(e.reason));
}

/** L'écran que l'application cachée retrouvera en revenant. */
let paused: string | null = null;

function openScreen(screen: string, now = performance.now()): void {
  current = { screen, since: now, frames: 0, frameMs: 0, slowFrames: 0 };
}

function closeScreen(now = performance.now()): void {
  if (!current) return;
  const { screen, since, frames, frameMs, slowFrames } = current;
  paused = screen;
  current = null;
  if (now - since < MIN_SCREEN_MS) return;
  push({ kind: 'screen', screen, seconds: Math.round((now - since) / 1000), frames, frameMs: Math.round(frameMs), slowFrames });
}

function push(event: UsageEvent): void {
  queue.push(event);
  if (queue.length >= FLUSH_AT) flushUsage();
}

/** L'écran affiché change (l'adresse de la page, sans ses paramètres). */
export function usageScreen(pathname: string): void {
  if (!started) return;
  const screen = screenOf(pathname);
  if (current?.screen === screen) return;
  closeScreen();
  // Cachée, l'application rouvrira cet écran en revenant.
  paused = screen;
  if (!document.hidden) {
    openScreen(screen);
    paused = null;
  }
  screensOpened++;
}

/** Une image du monde en 3D vient d'être dessinée, `ms` après la précédente (la boucle du monde, three/loop.ts). */
export function usageFrame(ms: number): void {
  if (!started) return;
  // La première image du monde, s'il est le premier écran ouvert (sinon elle compterait le temps passé ailleurs).
  if (firstFrameMs === 0 && screensOpened <= 1) firstFrameMs = Math.round(performance.now());
  if (!current || ms <= 0 || ms > MAX_FRAME_MS) return;
  current.frames++;
  current.frameMs += ms;
  if (ms > SLOW_FRAME_MS) current.slowFrames++;
}

let lastError = '';
/** Une erreur : celles de la page, et celles que React attrape (limites d'erreur, `main.tsx`). */
export function recordError(raw: unknown): void {
  const message = cleanMessage(raw instanceof Error ? raw.message : String(raw ?? ''));
  if (!started || !message || message === lastError) return;
  lastError = message;
  push({ kind: 'error', screen: current?.screen ?? paused ?? '/', message });
}

/** Envoie ce qui attend, ou l'oublie si la mesure n'est pas permise. */
export function flushUsage(): void {
  if (!started) return;
  const events = queue;
  queue = [];
  if (launch) {
    events.unshift({ ...launch, firstFrameMs });
    launch = null;
  }
  if (events.length === 0 || !allowed()) return;
  const settings = reglagesCourants();
  const batch: UsageBatch = {
    version: APP_VERSION,
    universe: universAffiche(settings?.univers),
    view: settings?.worldView ?? '3d',
    events: events.slice(0, MAX_EVENTS),
  };
  try {
    // En texte simple : la requête part même quand la page se ferme, sans requête préalable.
    navigator.sendBeacon(`${import.meta.env.BASE_URL}api/usage`, new Blob([JSON.stringify(batch)], { type: 'text/plain' }));
  } catch {
    // Pas d'envoi possible : la mesure se perd, l'application continue.
  }
}
