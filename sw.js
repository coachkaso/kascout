// Offline support: the app's own files are kept on the phone. Google is never cached.
const VERSION = '1.3.1-7fe3bf7ec6';
const CACHE = `fns-phone-${VERSION}`;
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'].concat(["./barlow-condensed-latin-500-normal-BgYH2mbd.woff2","./barlow-condensed-latin-700-normal-v1xN8_Wq.woff2","./barlow-condensed-latin-800-normal-BKzMuPgK.woff2","./barlow-latin-400-normal-qiz4-Cze.woff2","./barlow-latin-600-normal-DILqtrty.woff2","./main-CSkArC_K.js","./main-DkohacKv.css","./modulepreload-polyfill-B5Qt9EMX.js"]);

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('fns-phone-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope);
  if (!url.pathname.startsWith(scope.pathname)) return;
  if (url.pathname.endsWith('oauth-callback.html')) return; // always fresh, never stored with a token
  const isAsset = url.pathname.includes('/assets/') || /-[A-Za-z0-9_-]{8}\.(js|css|woff2?)$/.test(url.pathname);
  if (isAsset) {
    // file names change with every version: cache first
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })));
    return;
  }
  // pages: newest when online, saved copy when offline
  e.respondWith(
    fetch(req)
      .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html'))),
  );
});
