// Sons d'action du village, générés par le code (Web Audio, aucun fichier) : pose, retrait, plan terminé.
// Jamais pendant la lecture à voix haute, et seulement si le réglage « sons » est activé.

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function speaking(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
}

/** Une note brève : sinusoïde qui descend (ou monte) avec une enveloppe courte. */
function blip(freqFrom: number, freqTo: number, duration: number, volume: number, type: OscillatorType = 'square'): void {
  const ac = context();
  if (!ac || speaking()) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, t);
  osc.frequency.exponentialRampToValueAtTime(freqTo, t + duration);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration);
}

/** « Toc » sourd : un bloc se pose. */
export function playPlace(): void {
  blip(220, 110, 0.12, 0.18, 'triangle');
}

/** « Pop » clair : un bloc se retire. */
export function playRemove(): void {
  blip(330, 660, 0.1, 0.12, 'triangle');
}

/** Petite fanfare de trois notes : un plan est terminé. */
export function playDone(): void {
  const ac = context();
  if (!ac || speaking()) return;
  [523, 659, 784].forEach((f, i) => setTimeout(() => blip(f, f, 0.18, 0.15, 'square'), i * 140));
}

/** Refus doux (pas de bloc, hors zone) : deux notes descendantes courtes. */
export function playNope(): void {
  blip(200, 160, 0.14, 0.1, 'sine');
}

/** Trois coups de tambour sourds : le Gardien arrive. */
export function playDrum(): void {
  [0, 260, 520].forEach((d) => setTimeout(() => blip(90, 60, 0.22, 0.2, 'sine'), d));
}

/** Grondement doux (épreuve ratée) : jamais agressif. */
export function playGrowl(): void {
  blip(120, 70, 0.35, 0.09, 'triangle');
}

/** Victoire : la fanfare, puis une note tenue. */
export function playVictory(): void {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, f, 0.2, 0.14, 'square'), i * 130));
  setTimeout(() => blip(1047, 1047, 0.8, 0.1, 'triangle'), 560);
}

// ---------- Ambiance (en option) : vent continu, oiseaux le jour, grillons la nuit ----------

let ambience: { gain: GainNode; stop: () => void } | null = null;

function noiseBuffer(ac: AudioContext): AudioBuffer {
  const seconds = 2;
  const buffer = ac.createBuffer(1, ac.sampleRate * seconds, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Démarre l'ambiance (idempotent). `night` change le chant : oiseaux ou grillons. */
export function startAmbience(night: boolean): void {
  const ac = context();
  if (!ac || ambience) return;
  const gain = ac.createGain();
  gain.gain.value = 0.05;
  // Vent : bruit blanc filtré, dont le souffle varie lentement.
  const wind = ac.createBufferSource();
  wind.buffer = noiseBuffer(ac);
  wind.loop = true;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  const lfo = ac.createOscillator();
  lfo.frequency.value = 0.15;
  const lfoGain = ac.createGain();
  lfoGain.gain.value = 200;
  lfo.connect(lfoGain).connect(filter.frequency);
  wind.connect(filter).connect(gain).connect(ac.destination);
  wind.start();
  lfo.start();
  // Chants : de temps en temps, quelques notes.
  let alive = true;
  const sing = () => {
    if (!alive) return;
    if (!speaking()) {
      if (night) for (let i = 0; i < 6; i++) setTimeout(() => alive && blip(3800, 3600, 0.05, 0.03, 'sine'), i * 90);
      else for (let i = 0; i < 3; i++) setTimeout(() => alive && blip(1800 + Math.random() * 800, 2600, 0.12, 0.04, 'sine'), i * 160);
    }
    setTimeout(sing, 3000 + Math.random() * 5000);
  };
  setTimeout(sing, 1500);
  ambience = {
    gain,
    stop: () => {
      alive = false;
      wind.stop();
      lfo.stop();
      gain.disconnect();
    },
  };
}

export function stopAmbience(): void {
  ambience?.stop();
  ambience = null;
}
