// Local-only storage. Nothing here is sent to a server.
// Religion is specific personal data under UU PDP No. 27/2022, so it stays on the device.

const PREFIX = 'jeda:v1:';

const DEFAULT_PREFS = {
  faith: null,
  streams: [],
  dialect: null,
  lang: 'id',
  theme: 'dark',
  largeText: false,
  sound: true,
  reducedMotion: false,
  city: 'jakarta',
};

export function load(name, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function save(name, value) {
  try {
    localStorage.setItem(PREFIX + name, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(name) {
  localStorage.removeItem(PREFIX + name);
}

export const prefs = {
  get() {
    return { ...DEFAULT_PREFS, ...load('prefs', {}) };
  },
  set(patch) {
    const next = { ...this.get(), ...patch };
    save('prefs', next);
    return next;
  },
};

const NAME_FIRST = ['Embun', 'Bambu', 'Teratai', 'Angin', 'Pelita', 'Awan', 'Ombak', 'Daun', 'Bintang', 'Rintik', 'Kabut', 'Cahaya'];
const NAME_SECOND = ['Pagi', 'Senja', 'Tenang', 'Teduh', 'Malam', 'Lembut', 'Sunyi', 'Hening', 'Jernih', 'Damai'];

export function newGuestName() {
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  return `${pick(NAME_FIRST)} ${pick(NAME_SECOND)}`;
}

// Anonymous, device-only guest name (like Sansa's random novice name). Never sent anywhere.
export function guestName() {
  const current = prefs.get().guestName;
  if (current) {
    return current;
  }
  const name = newGuestName();
  prefs.set({ guestName: name });
  return name;
}

export function exportAll() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      data[key.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(key));
    }
  }
  return { app: 'jeda', exportedAt: new Date().toISOString(), data };
}

export function importAll(payload) {
  if (!payload || payload.app !== 'jeda' || typeof payload.data !== 'object') {
    throw new Error('Berkas bukan cadangan Jeda.');
  }
  for (const [name, value] of Object.entries(payload.data)) {
    save(name, value);
  }
}

export function clearAll() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach((key) => localStorage.removeItem(key));
}

// Small IndexedDB wrapper for larger blobs (family archive voice notes).
const DB_NAME = 'jeda-archive';
const STORE = 'items';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function archivePut(item) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => resolve(item);
    tx.onerror = () => reject(tx.error);
  });
}

export async function archiveAll() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.created - a.created));
    request.onerror = () => reject(request.error);
  });
}

export async function archiveDelete(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
