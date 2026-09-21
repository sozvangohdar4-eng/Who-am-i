let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.2, when = 0) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, c.currentTime + when);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + when + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime + when);
  osc.stop(c.currentTime + when + duration);
}

export const sounds = {
  unlock() {
    getCtx();
  },
  correct() {
    tone(660, 0.12, "sine", 0.25);
    tone(880, 0.18, "sine", 0.25, 0.1);
  },
  pass() {
    tone(320, 0.18, "triangle", 0.2);
    tone(240, 0.22, "triangle", 0.2, 0.12);
  },
  tick() {
    tone(1000, 0.05, "square", 0.08);
  },
  countdown() {
    tone(520, 0.15, "sine", 0.2);
  },
  go() {
    tone(780, 0.3, "sine", 0.25);
  },
  end() {
    tone(500, 0.2, "sawtooth", 0.15);
    tone(400, 0.2, "sawtooth", 0.15, 0.2);
    tone(300, 0.4, "sawtooth", 0.15, 0.4);
  },
};
