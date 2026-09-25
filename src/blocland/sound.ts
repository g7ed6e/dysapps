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
