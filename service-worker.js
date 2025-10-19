/* ACW-App v4.0 – Simple runtime cache (PWA base, push-ready later) */
const CACHE = 'acw-v4.0';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/config.js',
  '/manifest.json',
  '/assets/icon-acw.png',
  '/assets/icon-acw-512.png',
  '/assets/logo3d.gif'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k!==CACHE)?caches.delete(k):null)))
  );
});
self.addEventListener('fetch', (e)=>{
  const req = e.request;
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res=>{
      const copy = res.clone();
      caches.open(CACHE).then(c=>c.put(req, copy));
      return res;
    }).catch(()=>cached))
  );
});

/* Push will be added in Phase 2 */
