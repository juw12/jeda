// Read-aloud (Web Speech API) for elders and low-literacy users. Runs fully on the device.

import { toast } from './ui.js';

export function canSpeak() {
  return 'speechSynthesis' in window;
}

function indonesianVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('id')) || null;
}

export function speak(text, onEnd) {
  if (!canSpeak()) {
    toast('Perangkat ini belum mendukung fitur suara.');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'id-ID';
  utterance.rate = 0.9;
  const voice = indonesianVoice();
  if (voice) {
    utterance.voice = voice;
  } else {
    toast('Suara Bahasa Indonesia belum terpasang; memakai suara bawaan perangkat.');
  }
  utterance.onend = () => onEnd && onEnd();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (canSpeak()) {
    window.speechSynthesis.cancel();
  }
}

// Adds a toggle button that reads `getText()` aloud.
export function speakButton(container, getText) {
  if (!canSpeak()) {
    return;
  }
  const button = document.createElement('button');
  button.className = 'btn-ghost';
  button.type = 'button';
  button.textContent = '🔊 Dengarkan';
  let speaking = false;
  button.addEventListener('click', () => {
    if (speaking) {
      stopSpeaking();
      speaking = false;
      button.textContent = '🔊 Dengarkan';
      return;
    }
    speaking = true;
    button.textContent = '⏹ Berhenti';
    speak(getText(), () => {
      speaking = false;
      button.textContent = '🔊 Dengarkan';
    });
  });
  container.prepend(button);
}
