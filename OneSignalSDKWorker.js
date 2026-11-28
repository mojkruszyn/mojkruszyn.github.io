// Jeden service worker dla całej witryny: (1) powiadomienia push OneSignal, (2) praca offline.
// Plik musi leżeć w katalogu głównym (zasięg "/"), a OneSignal szuka go pod tą nazwą.
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const VER = 'kruszyn-v2';
const SHELL = ['./', 'index.html', 'data/wies.json', 'assets/favicon.svg', 'assets/icon-192.png', 'assets/manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Dane i strona: najpierw internet (świeże), w razie braku – ostatnia zapisana kopia.
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;   // pogoda (Open-Meteo) ma własny zapas w aplikacji
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VER).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => caches.match(r, {ignoreSearch: true}).then(hit => hit || (r.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
