// Efeitos sonoros gerados com a Web Audio API (não precisamos de arquivos de áudio).
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.15) {
  const c = audio();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.03);
}

/** "Plim" — duas notas ascendentes para acerto. */
export function playCorrect() {
  tone(880, 0, 0.12, 'sine', 0.18);
  tone(1318.5, 0.09, 0.22, 'sine', 0.16);
}

/** "Tadam" — duas notas graves descendentes para erro. */
export function playWrong() {
  tone(233, 0, 0.18, 'triangle', 0.18);
  tone(174.6, 0.14, 0.34, 'triangle', 0.16);
}
