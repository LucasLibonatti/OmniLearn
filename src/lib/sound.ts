// Efeitos sonoros gerados com a Web Audio API (sem arquivos externos).
let ctx: AudioContext | null = null;
let unlockBound = false;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/** Desbloqueia o AudioContext no primeiro gesto do usuário (exigência de Autoplay dos navegadores). */
export function unlockAudio() {
  const c = getContext();
  if (c && c.state === 'suspended') {
    void c.resume().catch(() => {});
  }
}

function bindAutoUnlock() {
  if (unlockBound || typeof window === 'undefined') return;
  unlockBound = true;
  const onGesture = () => {
    unlockAudio();
    if (ctx && ctx.state === 'running') {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    }
  };
  window.addEventListener('pointerdown', onGesture, { passive: true });
  window.addEventListener('keydown', onGesture, { passive: true });
}
bindAutoUnlock();

function scheduleTone(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, gain: number) {
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
  o.stop(t0 + dur + 0.04);
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.26) {
  const c = getContext();
  if (!c) return;
  if (c.state === 'suspended') {
    void c
      .resume()
      .then(() => scheduleTone(c, freq, start, dur, type, gain))
      .catch(() => {});
    return;
  }
  scheduleTone(c, freq, start, dur, type, gain);
}

/** "Plim" — duas notas ascendentes para acerto. */
export function playCorrect() {
  tone(880, 0, 0.14, 'sine', 0.28);
  tone(1318.5, 0.09, 0.24, 'sine', 0.24);
}

/** "Tadam" — duas notas graves descendentes para erro. */
export function playWrong() {
  tone(233, 0, 0.18, 'triangle', 0.28);
  tone(174.6, 0.14, 0.34, 'triangle', 0.24);
}
