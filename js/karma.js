// Bank Kebaikan: a small, device-only ledger of good (and not-so-good) deeds done in Jeda.
// Points are a playful reminder to keep doing good, not a claim about real merit or reward;
// that framing is shown wherever the balance appears.
//
// Every interaction is also tallied (how many times you rang the bell, slid a bead, gave alms...),
// so the space can show a running count above your head and the bank can show your history.

import { load, save } from './store.js';

const KEY = 'karma';
const START_BALANCE = 10;
const LEDGER_LIMIT = 60;

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fresh() {
  return {
    balance: START_BALANCE,
    earned: START_BALANCE,
    lost: 0,
    spent: 0,
    ledger: [{ t: Date.now(), delta: START_BALANCE, label: 'Hadiah selamat datang', kind: 'gift' }],
    tally: {},
    day: { date: today(), points: {} },
    wishes: [],
    tickets: [],
    school: {},
  };
}

function read() {
  const state = { ...fresh(), ...load(KEY, {}) };
  if (!state.day || state.day.date !== today()) {
    state.day = { date: today(), points: {} };
  }
  return state;
}

function write(state, change) {
  save(KEY, state);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('jeda:karma', { detail: { balance: state.balance, change } }));
  }
}

function record(state, delta, label, kind) {
  state.ledger.unshift({ t: Date.now(), delta, label, kind });
  state.ledger = state.ledger.slice(0, LEDGER_LIMIT);
}

export function karma() {
  return read();
}

export function balance() {
  return read().balance;
}

// Count one interaction. `points` (positive = good deed, negative = bad deed) are only booked
// the first `cap` times per day for the same id, so tapping a bell 50 times is counted (and shown)
// but does not farm points. Returns { count, today, delta, balance }.
export function act(id, { label, points = 0, cap = 5, icon = '' } = {}) {
  const state = read();
  const entry = state.tally[id] || { label: label || id, icon, total: 0, today: 0, date: today() };
  if (entry.date !== today()) {
    entry.today = 0;
    entry.date = today();
  }
  entry.total += 1;
  entry.today += 1;
  entry.label = label || entry.label;
  entry.icon = icon || entry.icon;
  state.tally[id] = entry;
  let delta = 0;
  if (points) {
    const used = state.day.points[id] || 0;
    if (used < cap) {
      state.day.points[id] = used + 1;
      delta = points;
      state.balance = Math.max(0, state.balance + points);
      if (points > 0) {
        state.earned += points;
      } else {
        state.lost += -points;
      }
      record(state, points, label || id, points > 0 ? 'good' : 'bad');
    }
  }
  write(state, { id, delta });
  return { count: entry.total, today: entry.today, delta, balance: state.balance };
}

// One-off rewards (finishing a lesson, passing a quiz): booked only once per key.
export function rewardOnce(key, points, label) {
  const state = read();
  state.school = state.school || {};
  if (state.school[key]) {
    return 0;
  }
  state.school[key] = Date.now();
  state.balance += points;
  state.earned += points;
  record(state, points, label, 'study');
  write(state, { id: key, delta: points });
  return points;
}

export function done(key) {
  return Boolean((read().school || {})[key]);
}

export function spend(cost, label, kind = 'wish') {
  const state = read();
  if (cost > state.balance) {
    return false;
  }
  state.balance -= cost;
  state.spent += cost;
  record(state, -cost, label, kind);
  write(state, { id: kind, delta: -cost });
  return true;
}

export function addWish(wish) {
  const state = read();
  state.wishes.unshift({ ...wish, t: Date.now() });
  state.wishes = state.wishes.slice(0, 40);
  save(KEY, state);
}

export function hasTicket(id) {
  return read().tickets.includes(id);
}

export function addTicket(id) {
  const state = read();
  if (!state.tickets.includes(id)) {
    state.tickets.push(id);
    save(KEY, state);
  }
}

export function onKarma(handler) {
  const listener = (event) => handler(event.detail);
  window.addEventListener('jeda:karma', listener);
  return () => window.removeEventListener('jeda:karma', listener);
}

// What the points can be spent on. `effect` is played in the 3D space (see engine.celebrate);
// `tree` wishes are written on a ribbon and hung on the wish tree at home.
export const WISHES = [
  { id: 'lentera', icon: '🏮', name: 'Lentera harapan', cost: 15, effect: 'lanterns', desc: 'Lepaskan lentera bercahaya ke langit di tempatmu sekarang.' },
  { id: 'kelopak', icon: '🌸', name: 'Hujan kelopak bunga', cost: 20, effect: 'petals', desc: 'Kelopak bunga turun pelan di sekelilingmu.' },
  { id: 'kunang', icon: '✨', name: 'Kunang-kunang', cost: 12, effect: 'fireflies', desc: 'Cahaya kecil menari di sekitarmu, terutama indah saat malam.' },
  { id: 'pita', icon: '🎗', name: 'Pita harapan', cost: 10, effect: 'ribbon', tree: true, desc: 'Tulis satu harapan. Pitanya tergantung di Pohon Harapan di rumah.' },
  { id: 'traktir', icon: '🍵', name: 'Traktir teh untuk semua', cost: 25, effect: 'treat', desc: 'Semua orang di kedai mendapat teh hangat darimu.' },
];

export const KARMA_NOTE = 'Poin kebaikan di Jeda hanyalah pengingat yang menyenangkan untuk terus berbuat baik, bukan ukuran pahala yang sesungguhnya. Kebaikan nyata terjadi di luar layar.';

export function tallies() {
  const state = read();
  return Object.entries(state.tally)
    .map(([id, entry]) => ({ id, ...entry, today: entry.date === today() ? entry.today : 0 }))
    .sort((a, b) => b.total - a.total);
}
