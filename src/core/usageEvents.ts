// Ce que la mesure d'usage envoie (src/core/usage.ts) et ce que le Worker en garde (src/worker/index.ts), écrit une
// fois pour les deux côtés : la forme d'un envoi, sa vérification (le Worker ne croit rien de ce qui arrive) et la
// ligne écrite dans Workers Analytics Engine. Aucun identifiant, aucune adresse IP : seulement des comptes et des
// durées, rattachés à la version, à l'univers, à la vue et à l'écran.

/** Un lancement de l'application (un chargement de la page). */
export interface LaunchEvent {
  kind: 'launch';
  /** Du début du chargement au démarrage du code de l'application, en ms. */
  startMs: number;
  /** Du début du chargement à la première image du monde en 3D, en ms ; 0 sans monde en 3D. */
  firstFrameMs: number;
  /** La taille de la fenêtre, arrondie à la centaine de pixels. */
  width: number;
  height: number;
  /** La densité de l'écran, arrondie au demi. */
  dpr: number;
  /** Vrai si l'application est ouverte depuis l'écran d'accueil (installée). */
  installed: boolean;
}

/** Un passage sur un écran, tant que l'application est visible. */
interface ScreenEvent {
  kind: 'screen';
  /** L'adresse de l'écran, sans paramètres (`/adventure/maths-6e-calculation`). */
  screen: string;
  seconds: number;
  /** Les images du monde en 3D dessinées pendant ce passage ; 0 sans monde en 3D. */
  frames: number;
  /** La somme de leurs durées, en ms (images par seconde = frames / frameMs × 1000). */
  frameMs: number;
  /** Celles de plus de 50 ms (moins de 20 images par seconde). */
  slowFrames: number;
}

/** Une erreur de l'application, sans sa pile. */
interface UsageErrorEvent {
  kind: 'error';
  screen: string;
  message: string;
}

export type UsageEvent = LaunchEvent | ScreenEvent | UsageErrorEvent;

/** Un envoi : ce qui vaut pour tous ses évènements, puis les évènements. */
export interface UsageBatch {
  version: string;
  universe: string;
  /** La vue choisie dans les réglages : le monde en 3D, ou la liste des îles. */
  view: '3d' | 'list';
  events: UsageEvent[];
}

/** Au plus ce nombre d'évènements par envoi ; l'application envoie bien avant. */
export const MAX_EVENTS = 50;
/** Au plus cette taille d'envoi, en octets. */
export const MAX_BYTES = 16_384;
export const SLOW_FRAME_MS = 50;
const MAX_SECONDS = 3600;
const MAX_MESSAGE = 120;

/** Une adresse d'écran : des segments en minuscules, chiffres et tirets, au plus quatre. */
const SCREEN = /^(\/[a-z0-9-]{1,48}){0,4}\/?$/;
const WORD = /^[a-z0-9.-]{1,24}$/;

/**
 * Le message d'une erreur tel qu'on le garde : sur une ligne, sans adresse ni texte entre guillemets (une erreur de
 * lecture JSON cite un morceau de ce qu'elle lisait : tout ce qui va du premier guillemet au dernier), au plus 120 signes.
 */
export function cleanMessage(message: string): string {
  return message
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/[a-z][a-z0-9+.-]*:\/\/\S+/gi, '<url>')
    .replace(/["'«`].*["'»`]/, '"…"')
    .trim()
    .slice(0, MAX_MESSAGE);
}

/** L'adresse d'un écran telle qu'on la mesure : sans paramètres, au plus quatre segments, `/x` pour un segment inattendu. */
export function screenOf(pathname: string): string {
  const segments = pathname
    .split(/[?#]/)[0]
    .split('/')
    .filter(Boolean)
    .slice(0, 4)
    .map((s) => (/^[a-z0-9-]{1,48}$/.test(s) ? s : 'x'));
  return `/${segments.join('/')}`;
}

const num = (v: unknown, max: number): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(Math.round(v), max) : null;

function parseEvent(raw: unknown): UsageEvent | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const e = raw as Record<string, unknown>;
  if (e.kind === 'launch') {
    const startMs = num(e.startMs, 120_000);
    const firstFrameMs = num(e.firstFrameMs, 120_000);
    const width = num(e.width, 10_000);
    const height = num(e.height, 10_000);
    const dpr = typeof e.dpr === 'number' && Number.isFinite(e.dpr) ? Math.min(Math.max(Math.round(e.dpr * 2) / 2, 0.5), 5) : null;
    if (startMs === null || firstFrameMs === null || width === null || height === null || dpr === null) return null;
    return { kind: 'launch', startMs, firstFrameMs, width, height, dpr, installed: e.installed === true };
  }
  if (e.kind === 'screen') {
    const seconds = num(e.seconds, MAX_SECONDS);
    const frames = num(e.frames, 1_000_000);
    const frameMs = num(e.frameMs, MAX_SECONDS * 1000);
    const slowFrames = num(e.slowFrames, 1_000_000);
    if (typeof e.screen !== 'string' || !SCREEN.test(e.screen)) return null;
    if (seconds === null || frames === null || frameMs === null || slowFrames === null) return null;
    return { kind: 'screen', screen: e.screen, seconds, frames, frameMs, slowFrames: Math.min(slowFrames, frames) };
  }
  if (e.kind === 'error') {
    if (typeof e.screen !== 'string' || !SCREEN.test(e.screen) || typeof e.message !== 'string') return null;
    return { kind: 'error', screen: e.screen, message: cleanMessage(e.message) };
  }
  return null;
}

/** Les évènements bien formés d'une liste (ceux gardés sur l'appareil en attendant le réseau, src/core/usage.ts). */
export function parseUsageEvents(raw: unknown): UsageEvent[] {
  return Array.isArray(raw) ? raw.map(parseEvent).filter((e): e is UsageEvent => e !== null) : [];
}

/** L'envoi vérifié, ou `null` s'il n'a pas la forme attendue ; les évènements mal formés sont laissés de côté. */
export function parseUsageBatch(raw: unknown): UsageBatch | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.version !== 'string' || !WORD.test(b.version)) return null;
  if (typeof b.universe !== 'string' || !WORD.test(b.universe)) return null;
  if (b.view !== '3d' && b.view !== 'list') return null;
  if (!Array.isArray(b.events) || b.events.length > MAX_EVENTS) return null;
  const events = b.events.map(parseEvent).filter((e): e is UsageEvent => e !== null);
  return { version: b.version, universe: b.universe, view: b.view, events };
}

/** Une ligne de Workers Analytics Engine. */
export interface DataPoint {
  blobs: string[];
  doubles: number[];
  indexes: [string];
}

/**
 * La ligne d'un évènement. L'ordre des colonnes ne change jamais (scripts/pilotage/usage.mjs les lit) :
 * blob1 le genre, blob2 la version, blob3 l'univers, blob4 la vue, blob5 le canal (production ou aperçu), blob6
 * l'écran, blob7 le message d'une erreur ou « installed »/« browser » d'un lancement ; double1 à double5, les nombres
 * de l'évènement dans l'ordre de son type.
 */
export function toDataPoint(batch: UsageBatch, event: UsageEvent, channel: string): DataPoint {
  const common = [event.kind, batch.version, batch.universe, batch.view, channel];
  switch (event.kind) {
    case 'launch':
      return {
        blobs: [...common, '', event.installed ? 'installed' : 'browser'],
        doubles: [event.startMs, event.firstFrameMs, event.width, event.height, event.dpr],
        indexes: [event.kind],
      };
    case 'screen':
      return {
        blobs: [...common, event.screen, ''],
        doubles: [event.seconds, event.frames, event.frameMs, event.slowFrames],
        indexes: [event.kind],
      };
    case 'error':
      return { blobs: [...common, event.screen, event.message], doubles: [], indexes: [event.kind] };
  }
}
