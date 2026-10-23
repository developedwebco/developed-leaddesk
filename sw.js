const CACHE_NAME = 'developed-leaddesk-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',
  '/icon.svg',
  '/js/app.js',
  '/js/seed-data.js',
  '/js/store.js',
  '/js/finder-service.js',
  '/js/ui-helpers.js',
  '/js/modals.js',
  '/js/view-dashboard.js',
  '/js/view-finder.js',
  '/js/view-pipeline.js',
  '/js/view-callmode.js',
  '/js/view-scripts-templates.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
