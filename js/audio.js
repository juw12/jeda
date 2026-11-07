// Synthesised sounds (no audio files needed): bells, wood block, ambience.

import { prefs } from './store.js';

let context = null;
let master = null;

function ctx() {
  if (!context) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = 0.8;
    master.connect(context.destination);
  }
  if (context.state === 'suspended') {
    context.resume();
  }
  return context;
}

function enabled() {
  return prefs.get().sound;
}

// Struck metal: a sum of inharmonic partials with exponential decay.
function strike({ frequency, partials, duration, volume }) {
  if (!enabled()) {
    return;
  }
  const audio = ctx();
  if (!audio) {
    return;
  }
  const now = audio.currentTime;
  partials.forEach(([ratio, gain, decayFactor]) => {
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency * ratio;
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(volume * gain, now + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration * decayFactor);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(now);
    oscillator.stop(now + duration * decayFactor + 0.05);
  });
}

export function bell() {
  strike({
    frequency: 196,
    partials: [
      [1, 0.6, 1],
      [2.0, 0.3, 0.7],
      [2.76, 0.25, 0.6],
      [5.4, 0.12, 0.35],
      [8.93, 0.06, 0.2],
    ],
    duration: 7,
    volume: 0.35,
  });
}

export function gong() {
  strike({
    frequency: 98,
    partials: [
      [1, 0.7, 1],
      [1.48, 0.35, 0.8],
      [2.2, 0.2, 0.6],
      [3.1, 0.1, 0.4],
    ],
    duration: 8,
    volume: 0.4,
  });
}

export function chime() {
  strike({
    frequency: 880,
    partials: [
      [1, 0.5, 1],
      [2.4, 0.2, 0.6],
      [4.1, 0.08, 0.3],
    ],
    duration: 2.5,
    volume: 0.18,
  });
}

export function woodblock() {
  strike({
    frequency: 720,
    partials: [
      [1, 0.6, 1],
      [1.9, 0.25, 0.6],
    ],
    duration: 0.18,
    volume: 0.35,
  });
}

export function bead() {
  strike({
    frequency: 1400,
    partials: [[1, 0.5, 1]],
    duration: 0.06,
    volume: 0.15,
  });
}

function noiseBuffer(audio, seconds = 2) {
  const length = audio.sampleRate * seconds;
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

export function crackle(seconds = 4) {
  if (!enabled()) {
    return;
  }
  const audio = ctx();
  if (!audio) {
    return;
  }
  const count = Math.round(seconds * 14);
  for (let i = 0; i < count; i++) {
    const at = audio.currentTime + Math.random() * seconds;
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = 200 + Math.random() * 1800;
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(0.05, at + 0.002);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(at);
    oscillator.stop(at + 0.05);
  }
}

let cachedNoise = null;
function sharedNoise(audio) {
  if (!cachedNoise || cachedNoise.sampleRate !== audio.sampleRate) {
    cachedNoise = noiseBuffer(audio, 2);
  }
  return cachedNoise;
}

// A quiet, wordless murmur of recitation (zikir pelan, paritta, Salam Maria) under each bead.
// Band-passed breath noise shaped into soft syllables; no melody, no instrument.
export function murmur(seconds = 1.1, volume = 0.05) {
  if (!enabled()) {
    return;
  }
  const audio = ctx();
  if (!audio) {
    return;
  }
  const now = audio.currentTime;
  const source = audio.createBufferSource();
  source.buffer = sharedNoise(audio);
  const low = audio.createBiquadFilter();
  low.type = 'bandpass';
  low.frequency.value = 520;
  low.Q.value = 1.4;
  const high = audio.createBiquadFilter();
  high.type = 'bandpass';
  high.frequency.value = 1300;
  high.Q.value = 2.2;
  const envelope = audio.createGain();
  envelope.gain.setValueAtTime(0.0001, now);
  const syllables = Math.max(3, Math.round(seconds * 5));
  for (let i = 0; i < syllables; i++) {
    const at = now + (i / syllables) * seconds;
    const peak = volume * (0.6 + Math.random() * 0.4) * (i === syllables - 1 ? 0.6 : 1);
    envelope.gain.exponentialRampToValueAtTime(peak, at + 0.05);
    envelope.gain.exponentialRampToValueAtTime(volume * 0.12, at + (seconds / syllables) * 0.9);
  }
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + seconds + 0.15);
  source.connect(low);
  source.connect(high);
  low.connect(envelope);
  high.connect(envelope);
  envelope.connect(master);
  source.start(now, Math.random() * 1.5);
  source.stop(now + seconds + 0.2);
}

// Paper page turning.
export function pageTurn() {
  if (!enabled()) {
    return;
  }
  const audio = ctx();
  if (!audio) {
    return;
  }
  const now = audio.currentTime;
  const source = audio.createBufferSource();
  source.buffer = sharedNoise(audio);
  const filter = audio.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1800;
  const envelope = audio.createGain();
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.exponentialRampToValueAtTime(0.16, now + 0.05);
  envelope.gain.exponentialRampToValueAtTime(0.05, now + 0.18);
  envelope.gain.exponentialRampToValueAtTime(0.12, now + 0.26);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(master);
  source.start(now, Math.random());
  source.stop(now + 0.5);
}

// Sustained chant voice. 'hum' = low humming drone (Buddhist chanting under the mala),
// 'om' = Om that opens on "o" and closes to "m" with each breath (Hindu japa).
// Returns stop().
export function chant(type = 'hum') {
  const audio = ctx();
  if (!audio || !enabled()) {
    return () => {};
  }
  const output = audio.createGain();
  output.gain.value = 0;
  output.connect(master);
  const pitch = type === 'om' ? 130.8 : 110;
  const voice = audio.createOscillator();
  voice.type = 'sawtooth';
  voice.frequency.value = pitch;
  const vibrato = audio.createOscillator();
  const vibratoDepth = audio.createGain();
  vibrato.frequency.value = 4.6;
  vibratoDepth.gain.value = 0.6;
  vibrato.connect(vibratoDepth);
  vibratoDepth.connect(voice.frequency);
  // Second, quieter voice a fifth below for warmth.
  const lowVoice = audio.createOscillator();
  lowVoice.type = 'sawtooth';
  lowVoice.frequency.value = pitch * 0.667;
  const lowLevel = audio.createGain();
  lowLevel.gain.value = 0.35;
  lowVoice.connect(lowLevel);
  const formantOne = audio.createBiquadFilter();
  formantOne.type = 'bandpass';
  formantOne.Q.value = 5;
  const formantTwo = audio.createBiquadFilter();
  formantTwo.type = 'bandpass';
  formantTwo.Q.value = 7;
  const closing = audio.createBiquadFilter();
  closing.type = 'lowpass';
  closing.frequency.value = 2400;
  const breath = audio.createGain();
  breath.gain.value = 0.0001;
  [voice, lowLevel].forEach((node) => {
    node.connect(formantOne);
    node.connect(formantTwo);
  });
  formantOne.connect(closing);
  formantTwo.connect(closing);
  closing.connect(breath);
  breath.connect(output);
  output.gain.linearRampToValueAtTime(0.5, audio.currentTime + 1.5);
  voice.start();
  lowVoice.start();
  vibrato.start();
  let timer = null;
  const cycle = () => {
    const at = audio.currentTime;
    const length = type === 'om' ? 5 : 4.2;
    // Vowel: "o" (Om) or "u" (hum); closes toward "m" by darkening the filter.
    formantOne.frequency.setValueAtTime(type === 'om' ? 520 : 330, at);
    formantTwo.frequency.setValueAtTime(type === 'om' ? 880 : 760, at);
    closing.frequency.setValueAtTime(2400, at);
    closing.frequency.linearRampToValueAtTime(type === 'om' ? 2200 : 900, at + length * 0.45);
    closing.frequency.linearRampToValueAtTime(320, at + length * 0.7);
    breath.gain.cancelScheduledValues(at);
    breath.gain.setValueAtTime(0.0001, at);
    breath.gain.exponentialRampToValueAtTime(0.14, at + 0.6);
    breath.gain.setValueAtTime(0.14, at + length * 0.7);
    breath.gain.exponentialRampToValueAtTime(0.0001, at + length);
    timer = setTimeout(cycle, (length + 0.8) * 1000);
  };
  cycle();
  return () => {
    clearTimeout(timer);
    const at = audio.currentTime;
    output.gain.cancelScheduledValues(at);
    output.gain.setValueAtTime(output.gain.value, at);
    output.gain.linearRampToValueAtTime(0, at + 0.8);
    setTimeout(() => {
      [voice, lowVoice, vibrato].forEach((node) => {
        try {
          node.stop();
        } catch {
          // already stopped
        }
      });
      output.disconnect();
    }, 1000);
  };
}

// Ambience loops. Returns a stop() function.
export function ambience(type) {
  const audio = ctx();
  if (!audio || !enabled()) {
    return () => {};
  }
  const output = audio.createGain();
  output.gain.value = 0;
  output.gain.linearRampToValueAtTime(1, audio.currentTime + 2);
  output.connect(master);
  const nodes = [];
  const timers = [];

  if (type === 'rain' || type === 'wind' || type === 'river') {
    const source = audio.createBufferSource();
    source.buffer = noiseBuffer(audio, 3);
    source.loop = true;
    const filter = audio.createBiquadFilter();
    const level = audio.createGain();
    if (type === 'rain') {
      filter.type = 'highpass';
      filter.frequency.value = 900;
      level.gain.value = 0.22;
    } else if (type === 'river') {
      filter.type = 'bandpass';
      filter.frequency.value = 500;
      filter.Q.value = 0.6;
      level.gain.value = 0.35;
    } else {
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      level.gain.value = 0.3;
      const lfo = audio.createOscillator();
      const lfoGain = audio.createGain();
      lfo.frequency.value = 0.08;
      lfoGain.gain.value = 0.15;
      lfo.connect(lfoGain);
      lfoGain.connect(level.gain);
      lfo.start();
      nodes.push(lfo);
    }
    source.connect(filter);
    filter.connect(level);
    level.connect(output);
    source.start();
    nodes.push(source);
  }

  if (type === 'night') {
    const chirp = () => {
      const at = audio.currentTime;
      for (let i = 0; i < 3; i++) {
        const oscillator = audio.createOscillator();
        const envelope = audio.createGain();
        oscillator.frequency.value = 4200 + Math.random() * 300;
        envelope.gain.setValueAtTime(0.0001, at + i * 0.07);
        envelope.gain.exponentialRampToValueAtTime(0.02, at + i * 0.07 + 0.01);
        envelope.gain.exponentialRampToValueAtTime(0.0001, at + i * 0.07 + 0.05);
        oscillator.connect(envelope);
        envelope.connect(output);
        oscillator.start(at + i * 0.07);
        oscillator.stop(at + i * 0.07 + 0.06);
      }
      timers.push(setTimeout(chirp, 600 + Math.random() * 1400));
    };
    chirp();
  }

  if (type === 'gamelan' || type === 'chimes' || type === 'temple') {
    // Gentle metallophone notes. Pelog-like for gamelan, pentatonic for chimes.
    const scales = {
      gamelan: [293, 311, 349, 415, 440, 523, 554],
      chimes: [523, 587, 659, 784, 880],
      temple: [130, 196, 261],
    };
    const scale = scales[type];
    const play = () => {
      const note = scale[Math.floor(Math.random() * scale.length)];
      const at = audio.currentTime;
      [[1, 0.5, 1], [3.0, 0.12, 0.4], [4.2, 0.05, 0.25]].forEach(([ratio, gain, decay]) => {
        const oscillator = audio.createOscillator();
        const envelope = audio.createGain();
        oscillator.frequency.value = note * ratio;
        envelope.gain.setValueAtTime(0.0001, at);
        envelope.gain.exponentialRampToValueAtTime(0.06 * gain, at + 0.01);
        envelope.gain.exponentialRampToValueAtTime(0.0001, at + 3.5 * decay);
        oscillator.connect(envelope);
        envelope.connect(output);
        oscillator.start(at);
        oscillator.stop(at + 3.6 * decay);
      });
      const pause = type === 'temple' ? 6000 + Math.random() * 6000 : 1400 + Math.random() * 2600;
      timers.push(setTimeout(play, pause));
    };
    play();
  }

  return () => {
    timers.forEach(clearTimeout);
    output.gain.cancelScheduledValues(audio.currentTime);
    output.gain.setValueAtTime(output.gain.value, audio.currentTime);
    output.gain.linearRampToValueAtTime(0, audio.currentTime + 1);
    setTimeout(() => {
      nodes.forEach((node) => {
        try {
          node.stop();
        } catch {
          // already stopped
        }
      });
      output.disconnect();
    }, 1200);
  };
}


// ---------- Food & kitchen sounds (ASMR) ----------
// All synthesised from filtered noise and short partials: crunch, chew, slurp, sip, sizzle, pour...
// Real recordings would sound better; these are designed to be close, light, and work offline.

let asmrGain = 1;
export function setAsmrGain(value) {
  asmrGain = Math.max(0, Math.min(2, Number(value) || 0));
}

// Call from a user gesture so looping kitchen sounds can start on phones.
export function wakeAudio() {
  if (enabled()) {
    ctx();
  }
}

function noiseBurst(audio, destination, { at, duration, type = 'bandpass', frequency = 1000, q = 1, gain = 0.1, attack = 0.004, sweepTo = null }) {
  const source = audio.createBufferSource();
  source.buffer = sharedNoise(audio);
  const filter = audio.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(frequency, at);
  if (sweepTo) {
    filter.frequency.exponentialRampToValueAtTime(sweepTo, at + duration);
  }
  filter.Q.value = q;
  const envelope = audio.createGain();
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + attack);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(destination);
  source.start(at, Math.random() * 1.5);
  source.stop(at + duration + 0.05);
}

function tone(audio, destination, { at, frequency, to = null, duration, gain, type = 'sine' }) {
  const oscillator = audio.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, at);
  if (to) {
    oscillator.frequency.exponentialRampToValueAtTime(to, at + duration);
  }
  const envelope = audio.createGain();
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(envelope);
  envelope.connect(destination);
  oscillator.start(at);
  oscillator.stop(at + duration + 0.05);
}

// One-shot food/kitchen sound. kind: crunch | crisp | chew | softchew | slurp | sip | ahh | gulp | clink |
// chop | pour | wok | fan | bag | tear | crackle | sizzle | plate
export function asmr(kind, { volume = 1, delay = 0 } = {}) {
  if (!enabled()) {
    return;
  }
  const audio = ctx();
  if (!audio) {
    return;
  }
  const out = audio.createGain();
  out.gain.value = volume * asmrGain;
  out.connect(master);
  const now = audio.currentTime + delay;
  const r = () => Math.random();
  switch (kind) {
    case 'crunch':
    case 'crisp': {
      // Brittle fracture: a cluster of very short bright clicks plus a dull body thump.
      const bursts = kind === 'crunch' ? 9 : 6;
      for (let i = 0; i < bursts; i++) {
        const at = now + i * (0.018 + r() * 0.03);
        noiseBurst(audio, out, { at, duration: 0.012 + r() * 0.03, type: 'highpass', frequency: 2200 + r() * 3200, q: 0.8, gain: 0.08 + r() * 0.14 });
      }
      noiseBurst(audio, out, { at: now, duration: 0.09, type: 'lowpass', frequency: 420, q: 0.7, gain: 0.12 });
      // Follow-up chews with crumbs.
      for (let c = 1; c <= 4; c++) {
        const at = now + 0.35 + c * 0.42;
        for (let i = 0; i < 4; i++) {
          noiseBurst(audio, out, { at: at + i * 0.02, duration: 0.015 + r() * 0.02, type: 'highpass', frequency: 1800 + r() * 2500, gain: (0.05 + r() * 0.05) / c });
        }
        noiseBurst(audio, out, { at, duration: 0.12, type: 'lowpass', frequency: 300, gain: 0.05 });
      }
      break;
    }
    case 'chew':
    case 'softchew': {
      // Mouth closed, soft and wet: low muffled pulses with tiny saliva clicks.
      const chews = kind === 'chew' ? 6 : 5;
      for (let c = 0; c < chews; c++) {
        const at = now + 0.15 + c * (0.36 + r() * 0.08);
        noiseBurst(audio, out, { at, duration: 0.16, type: 'lowpass', frequency: kind === 'chew' ? 520 : 380, q: 0.9, gain: 0.07 + r() * 0.03, attack: 0.03 });
        noiseBurst(audio, out, { at: at + 0.05 + r() * 0.05, duration: 0.01, type: 'bandpass', frequency: 2800 + r() * 1500, q: 9, gain: 0.05 + r() * 0.04 });
        if (r() < 0.5) {
          noiseBurst(audio, out, { at: at + 0.11, duration: 0.008, type: 'bandpass', frequency: 4200, q: 10, gain: 0.03 });
        }
      }
      tone(audio, out, { at: now + 0.2 + chews * 0.4, frequency: 160, to: 90, duration: 0.12, gain: 0.05 });
      break;
    }
    case 'slurp': {
      // Air and noodles sucked in: band of noise rising in pitch with turbulence.
      const length = 0.55 + r() * 0.2;
      const steps = 10;
      for (let i = 0; i < steps; i++) {
        const at = now + (i / steps) * length;
        const f = 500 + (i / steps) * 1800;
        noiseBurst(audio, out, { at, duration: length / steps + 0.04, type: 'bandpass', frequency: f, q: 2.5, gain: 0.08 + r() * 0.06, attack: 0.01, sweepTo: f * 1.25 });
      }
      for (let i = 0; i < 4; i++) {
        noiseBurst(audio, out, { at: now + r() * length, duration: 0.01, type: 'bandpass', frequency: 3500, q: 8, gain: 0.05 });
      }
      break;
    }
    case 'sip': {
      noiseBurst(audio, out, { at: now, duration: 0.28, type: 'bandpass', frequency: 1400, q: 3, gain: 0.07, attack: 0.04, sweepTo: 2300 });
      tone(audio, out, { at: now + 0.42, frequency: 150, to: 80, duration: 0.14, gain: 0.09 });
      noiseBurst(audio, out, { at: now + 0.44, duration: 0.06, type: 'lowpass', frequency: 260, gain: 0.07 });
      // Soft exhale after a hot drink.
      noiseBurst(audio, out, { at: now + 0.8, duration: 0.65, type: 'bandpass', frequency: 850, q: 1.2, gain: 0.05, attack: 0.12, sweepTo: 600 });
      break;
    }
    case 'gulp': {
      tone(audio, out, { at: now, frequency: 170, to: 80, duration: 0.14, gain: 0.1 });
      noiseBurst(audio, out, { at: now, duration: 0.07, type: 'lowpass', frequency: 300, gain: 0.08 });
      break;
    }
    case 'clink': {
      [[2650, 0.07, 0.3], [6100, 0.03, 0.12], [9400, 0.015, 0.07]].forEach(([f, g, d]) => tone(audio, out, { at: now, frequency: f, duration: d, gain: g }));
      break;
    }
    case 'chop': {
      noiseBurst(audio, out, { at: now, duration: 0.05, type: 'lowpass', frequency: 240, gain: 0.22 });
      tone(audio, out, { at: now, frequency: 420, to: 300, duration: 0.07, gain: 0.08, type: 'triangle' });
      noiseBurst(audio, out, { at: now + 0.005, duration: 0.02, type: 'highpass', frequency: 3500, gain: 0.05 });
      break;
    }
    case 'pour': {
      // A stream filling a glass: resonant band climbing as the glass fills.
      const length = 1.6;
      for (let i = 0; i < 16; i++) {
        const at = now + (i / 16) * length;
        noiseBurst(audio, out, { at, duration: 0.16, type: 'bandpass', frequency: 650 + i * 70 + r() * 80, q: 6, gain: 0.07 + r() * 0.04, attack: 0.02 });
      }
      noiseBurst(audio, out, { at: now, duration: length, type: 'highpass', frequency: 3000, gain: 0.02, attack: 0.2 });
      break;
    }
    case 'wok': {
      [[310, 0.12, 0.5], [847, 0.06, 0.3], [1590, 0.03, 0.18]].forEach(([f, g, d]) => tone(audio, out, { at: now, frequency: f, duration: d, gain: g, type: 'triangle' }));
      noiseBurst(audio, out, { at: now, duration: 0.4, type: 'highpass', frequency: 2500, gain: 0.1, attack: 0.01 });
      break;
    }
    case 'fan': {
      noiseBurst(audio, out, { at: now, duration: 0.14, type: 'lowpass', frequency: 500, gain: 0.08, attack: 0.03 });
      break;
    }
    case 'bag': {
      for (let i = 0; i < 26; i++) {
        noiseBurst(audio, out, { at: now + r() * 0.7, duration: 0.01 + r() * 0.02, type: 'highpass', frequency: 3000 + r() * 4000, gain: 0.03 + r() * 0.05 });
      }
      break;
    }
    case 'tear': {
      noiseBurst(audio, out, { at: now, duration: 0.22, type: 'bandpass', frequency: 1200, q: 1.5, gain: 0.07, sweepTo: 600 });
      break;
    }
    case 'plate': {
      tone(audio, out, { at: now, frequency: 1850, duration: 0.18, gain: 0.05 });
      noiseBurst(audio, out, { at: now, duration: 0.05, type: 'lowpass', frequency: 400, gain: 0.08 });
      break;
    }
    case 'sizzle': {
      noiseBurst(audio, out, { at: now, duration: 1.2, type: 'highpass', frequency: 3200, gain: 0.16, attack: 0.02 });
      for (let i = 0; i < 18; i++) {
        noiseBurst(audio, out, { at: now + r() * 1.1, duration: 0.008, type: 'highpass', frequency: 4000, gain: 0.08 + r() * 0.08 });
      }
      break;
    }
    case 'crackle': {
      for (let i = 0; i < 10; i++) {
        noiseBurst(audio, out, { at: now + r() * 0.8, duration: 0.01, type: 'bandpass', frequency: 900 + r() * 2500, q: 3, gain: 0.06 + r() * 0.06 });
      }
      break;
    }
    default:
      break;
  }
  setTimeout(() => out.disconnect(), (delay + 4) * 1000);
}

// Continuous kitchen / room sounds with a volume knob (set from distance to the stall).
// type: sizzle | fry | simmer | charcoal | steam | crowd
export function loopSound(type) {
  const audio = enabled() ? ctx() : null;
  if (!audio) {
    return { setVolume() {}, stop() {} };
  }
  const output = audio.createGain();
  output.gain.value = 0;
  output.connect(master);
  const nodes = [];
  let level = 0;
  const bed = (filterType, frequency, q, gain) => {
    const source = audio.createBufferSource();
    source.buffer = sharedNoise(audio);
    source.loop = true;
    const filter = audio.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    const g = audio.createGain();
    g.gain.value = gain;
    source.connect(filter);
    filter.connect(g);
    g.connect(output);
    source.start(0, Math.random() * 1.5);
    nodes.push(source);
    return g;
  };
  const beds = {
    sizzle: () => bed('highpass', 3400, 0.7, 0.35),
    fry: () => {
      bed('highpass', 2600, 0.6, 0.28);
      bed('bandpass', 1500, 1.2, 0.12);
    },
    simmer: () => bed('lowpass', 260, 0.7, 0.18),
    charcoal: () => bed('lowpass', 180, 0.7, 0.25),
    steam: () => bed('highpass', 5200, 0.5, 0.18),
    crowd: () => {
      const voices = [bed('bandpass', 320, 1.6, 0.25), bed('bandpass', 720, 1.8, 0.2), bed('bandpass', 1450, 2.2, 0.1)];
      voices.forEach((g, i) => {
        const lfo = audio.createOscillator();
        const depth = audio.createGain();
        lfo.frequency.value = 0.13 + i * 0.07;
        depth.gain.value = g.gain.value * 0.6;
        lfo.connect(depth);
        depth.connect(g.gain);
        lfo.start();
        nodes.push(lfo);
      });
    },
  };
  (beds[type] || beds.sizzle)();
  // Random events on top of the bed: oil pops, bubbles, embers, cutlery.
  let timer = null;
  const events = () => {
    const at = audio.currentTime;
    if (level > 0.02) {
      if (type === 'sizzle' || type === 'fry') {
        for (let i = 0; i < 3; i++) {
          noiseBurst(audio, output, { at: at + Math.random() * 0.2, duration: 0.008, type: 'highpass', frequency: 3500 + Math.random() * 3000, gain: 0.25 * Math.random() });
        }
      } else if (type === 'simmer') {
        tone(audio, output, { at, frequency: 260 + Math.random() * 200, to: 120, duration: 0.07, gain: 0.12 * Math.random() });
      } else if (type === 'charcoal') {
        noiseBurst(audio, output, { at, duration: 0.01, type: 'bandpass', frequency: 1000 + Math.random() * 2500, q: 3, gain: 0.25 * Math.random() });
      } else if (type === 'crowd' && Math.random() < 0.25) {
        tone(audio, output, { at, frequency: 2300 + Math.random() * 2000, duration: 0.2, gain: 0.05 });
      }
    }
    const pause = type === 'crowd' ? 700 + Math.random() * 2200 : type === 'simmer' ? 120 + Math.random() * 380 : 60 + Math.random() * 260;
    timer = setTimeout(events, pause);
  };
  events();
  return {
    setVolume(value) {
      const next = Math.max(0, Math.min(1.5, value)) * asmrGain;
      if (Math.abs(next - level) < 0.01) {
        return;
      }
      level = next;
      output.gain.setTargetAtTime(level, audio.currentTime, 0.15);
    },
    stop() {
      clearTimeout(timer);
      output.gain.setTargetAtTime(0, audio.currentTime, 0.2);
      setTimeout(() => {
        nodes.forEach((node) => {
          try {
            node.stop();
          } catch {
            // already stopped
          }
        });
        output.disconnect();
      }, 900);
    },
  };
}

export const AMBIENCE_LABELS = {
  rain: 'Hujan',
  wind: 'Angin',
  river: 'Sungai',
  night: 'Malam',
  gamelan: 'Gamelan lembut',
  chimes: 'Lonceng angin',
  temple: 'Genta jauh',
};
