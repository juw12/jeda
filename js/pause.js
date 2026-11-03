// "Ambil jeda": a one-minute guided breathing break available from anywhere in the app.

import * as audio from './audio.js';
import { t } from './i18n.js';

const CYCLE = [
  { key: 'pause.in', ms: 4000, cls: 'in' },
  { key: 'pause.hold', ms: 4000, cls: 'hold' },
  { key: 'pause.out', ms: 6000, cls: 'out' },
];
const TOTAL_MS = 60000;

export function openPause() {
  if (document.querySelector('.pause-overlay')) {
    return;
  }
  const overlay = document.createElement('div');
  overlay.className = 'pause-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', t('pause.title'));
  overlay.innerHTML = `
    <div class="pause-inner">
      <p class="pause-title">${t('pause.title')}</p>
      <div class="breath-circle pause-circle"></div>
      <p class="pause-label" aria-live="polite"></p>
      <div class="pause-progress"><span></span></div>
      <button class="btn-ghost pause-close">${t('pause.close')}</button>
    </div>`;
  document.body.append(overlay);
  const circle = overlay.querySelector('.pause-circle');
  const label = overlay.querySelector('.pause-label');
  const bar = overlay.querySelector('.pause-progress span');
  const closeButton = overlay.querySelector('.pause-close');
  const started = Date.now();
  let stepTimer = null;
  let index = 0;

  const close = () => {
    clearTimeout(stepTimer);
    clearInterval(progressTimer);
    document.removeEventListener('keydown', onKey);
    overlay.classList.add('closing');
    setTimeout(() => overlay.remove(), 300);
  };
  const onKey = (event) => {
    if (event.key === 'Escape') {
      close();
    }
  };
  const step = () => {
    if (Date.now() - started >= TOTAL_MS) {
      circle.className = 'breath-circle pause-circle';
      label.textContent = t('pause.done');
      audio.bell();
      return;
    }
    const current = CYCLE[index % CYCLE.length];
    circle.className = `breath-circle pause-circle ${current.cls}`;
    circle.style.transitionDuration = `${current.ms}ms`;
    label.textContent = t(current.key);
    index += 1;
    stepTimer = setTimeout(step, current.ms);
  };
  const progressTimer = setInterval(() => {
    const ratio = Math.min(1, (Date.now() - started) / TOTAL_MS);
    bar.style.width = `${ratio * 100}%`;
    if (ratio >= 1) {
      clearInterval(progressTimer);
    }
  }, 250);

  closeButton.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  audio.chime();
  step();
  closeButton.focus();
}
