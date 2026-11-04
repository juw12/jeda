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

export const AMBIENCE_LABELS = {
  rain: 'Hujan',
  wind: 'Angin',
  river: 'Sungai',
  night: 'Malam',
  gamelan: 'Gamelan lembut',
  chimes: 'Lonceng angin',
  temple: 'Genta jauh',
};
