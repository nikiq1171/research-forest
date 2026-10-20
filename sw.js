// 离线缓存 v3：网页本身（HTML）优先联网获取，保证每次打开都是最新版本；
// 打包后的 JS/CSS 文件名带版本号，可以放心从缓存读取；断网时退回缓存。
const CACHE = 'keyan-senlin-v3';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/') || url.pathname.endsWith('.webmanifest');
  if (isPage) {
    e.respondWith(fetch(req, { cache: 'no-store' }).then((r) => {
      const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return r;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match('./'))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(req);
    if (hit) return hit;
    const r = await fetch(req);
    if (r.ok) c.put(req, r.clone());
    return r;
  }));
});
