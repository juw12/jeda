// Offline support: app shell cache-first, content network-first (so reviewed updates arrive quickly).

const VERSION = 'hening-v0.1.0';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/icon.svg',
  'css/style.css',
  'js/app.js',
  'js/config.js',
  'js/store.js',
  'js/ui.js',
  'js/audio.js',
  'js/calendar.js',
  'js/prayertimes.js',
  'js/content.js',
  'js/search.js',
  'js/scenes.js',
  'js/views/core.js',
  'js/views/space.js',
  'js/views/rituals.js',
  'js/views/pustaka.js',
  'js/views/tanya.js',
  'js/views/tools.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }
  if (url.pathname.includes('/content/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
