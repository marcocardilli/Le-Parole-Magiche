const CACHE = 'prato-v3';
const ASSETS = [
  './', './index.html', './style.css', './app.js', './manifest.webmanifest',
  './prato.jpg', './icon-180.png', './icon-192.png', './icon-512.png',
  './audio/cane.wav', './audio/gatto.wav', './audio/mucca.wav', './audio/papera.wav',
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('prato-') && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cached = request.mode === 'navigate' ? await caches.match('./index.html') : await caches.match(request.url);
    if (!cached) return fetch(request);
    const range = request.headers.get('range');
    if (!range) return cached;
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!match) return fetch(request);
    const data = await cached.arrayBuffer();
    const start = Number(match[1]);
    const end = match[2] ? Math.min(Number(match[2]), data.byteLength - 1) : data.byteLength - 1;
    if (start > end) return new Response(null, {status: 416, headers: {'Content-Range': 'bytes */' + data.byteLength}});
    return new Response(data.slice(start, end + 1), {status: 206, headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'audio/wav',
      'Content-Length': String(end - start + 1),
      'Content-Range': 'bytes ' + start + '-' + end + '/' + data.byteLength,
      'Accept-Ranges': 'bytes',
    }});
  })());
});

