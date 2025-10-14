
self.addEventListener('install',e=>{
  e.waitUntil(caches.open('acw-v1').then(c=>c.addAll(['./','index.html','manifest.json','acw-icon.png'])));
});
self.addEventListener('fetch',e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request).then(res=>{
    const copy=res.clone(); caches.open('acw-v1').then(c=>c.put(e.request, copy)); return res;
  }).catch(()=>caches.match('index.html'))));
});
