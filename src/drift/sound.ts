// The drift game's sounds, made in the browser (Web Audio, no files): an
// engine hum rising with speed, tyres squealing while drifting, a thud on
// hits, a chime at gates, notes for combos and banked drifts, a fanfare for
// a clean lap. Off until the player turns it on (saved with the scores);
// on an iPhone it then plays even with the silent switch on, as a video
// would: the player chose it. Tried in the drift lab (2026-11-28).

interface Voices {
  context: AudioContext;
  master: GainNode;
  engine: OscillatorNode;
  engineGain: GainNode;
  squealGain: GainNode;
}

let voices: Voices | undefined;
let on = false;

function noise(context: AudioContext, seconds: number): AudioBuffer {
  const buffer = context.createBuffer(
    1,
    Math.ceil(context.sampleRate * seconds),
    context.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function setUp(): Voices {
  if (voices) return voices;
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0.6;
  master.connect(context.destination);

  const engine = context.createOscillator();
  engine.type = 'sawtooth';
  engine.frequency.value = 60;
  const muffle = context.createBiquadFilter();
  muffle.type = 'lowpass';
  muffle.frequency.value = 500;
  const engineGain = context.createGain();
  engineGain.gain.value = 0;
  engine.connect(muffle).connect(engineGain).connect(master);
  engine.start();

  const hiss = context.createBufferSource();
  hiss.buffer = noise(context, 2);
  hiss.loop = true;
  const squeal = context.createBiquadFilter();
  squeal.type = 'bandpass';
  squeal.frequency.value = 2600;
  squeal.Q.value = 6;
  const squealGain = context.createGain();
  squealGain.gain.value = 0;
  hiss.connect(squeal).connect(squealGain).connect(master);
  hiss.start();

  voices = { context, master, engine, engineGain, squealGain };
  return voices;
}

const live = () => (on && voices?.context.state === 'running' ? voices : undefined);

function tone(
  v: Voices,
  frequency: number,
  start: number,
  length: number,
  type: OscillatorType,
  volume: number,
) {
  const oscillator = v.context.createOscillator();
  const gain = v.context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  oscillator.connect(gain).connect(v.master);
  oscillator.start(start);
  oscillator.stop(start + length + 0.05);
}

/** Turns sound on (call from the tap that asks for it) or off. */
export async function setSound(wanted: boolean): Promise<void> {
  on = wanted;
  if (!wanted) {
    if (voices) {
      voices.engineGain.gain.value = 0;
      voices.squealGain.gain.value = 0;
      await voices.context.suspend().catch(() => undefined);
    }
    return;
  }
  try {
    // iPhone: play like a video, not muted by the silent switch.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = 'playback';
  } catch {
    // Older Safari: follows the silent switch.
  }
  try {
    const v = setUp();
    // The usual iPhone unlock: a silent sound inside the tap.
    const source = v.context.createBufferSource();
    source.buffer = v.context.createBuffer(1, 1, 22050);
    source.connect(v.context.destination);
    source.start(0);
    await v.context.resume();
  } catch {
    // No Web Audio: the game plays silent.
  }
}

/** Engine and tyres for this frame. */
export function soundFrame(speed: number, driftAngle: number, drifting: boolean, running: boolean) {
  const v = live();
  if (!v) return;
  const t = v.context.currentTime;
  v.engineGain.gain.setTargetAtTime(running ? 0.05 : 0, t, 0.05);
  v.engine.frequency.setTargetAtTime(55 + speed * 45, t, 0.08);
  const squeal = running && drifting ? Math.min(0.12, (driftAngle / 1.2) * 0.12) : 0;
  v.squealGain.gain.setTargetAtTime(squeal, t, 0.04);
}

export function playThud() {
  const v = live();
  if (!v) return;
  const t = v.context.currentTime;
  const source = v.context.createBufferSource();
  source.buffer = noise(v.context, 0.2);
  const low = v.context.createBiquadFilter();
  low.type = 'lowpass';
  low.frequency.value = 300;
  const gain = v.context.createGain();
  gain.gain.setValueAtTime(0.5, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  source.connect(low).connect(gain).connect(v.master);
  source.start(t);
}

export function playChime(great: boolean) {
  const v = live();
  if (!v) return;
  const t = v.context.currentTime;
  tone(v, 880, t, 0.15, 'sine', 0.18);
  tone(v, great ? 1320 : 1175, t + 0.07, 0.2, 'sine', 0.18);
}

export function playCombo(level: number) {
  const v = live();
  if (v) tone(v, 440 + level * 110, v.context.currentTime, 0.12, 'triangle', 0.12);
}

export function playBanked(points: number) {
  const v = live();
  if (!v) return;
  const t = v.context.currentTime;
  const top = points < 150 ? 660 : points < 500 ? 880 : 1175;
  tone(v, top * 0.75, t, 0.1, 'triangle', 0.12);
  tone(v, top, t + 0.06, 0.18, 'triangle', 0.14);
}

export function playFanfare() {
  const v = live();
  if (!v) return;
  const t = v.context.currentTime;
  [523, 659, 784, 1047].forEach((f, i) => tone(v, f, t + i * 0.09, 0.25, 'triangle', 0.15));
}

/** Closing the card or leaving the page: silence. */
export function pauseSound() {
  if (voices) {
    voices.engineGain.gain.value = 0;
    voices.squealGain.gain.value = 0;
  }
}
