// 파일을 수정해 다시 배포할 때마다 버전 숫자를 올려 주세요.
// (parts-data.json만 바꿀 때는 올리지 않아도 돼요. 항상 최신 파일을 먼저 확인해요.)
const CACHE = 'parts-note-v10';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const networkFirst = (req, key) => fetch(req).then(r => {
  if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(key || req, c)); }
  return r;
}).catch(() => caches.match(key || req));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 앱 화면과 파츠 데이터는 네트워크 우선(업데이트 반영), 오프라인이면 캐시
  if (req.mode === 'navigate') { e.respondWith(networkFirst(req, './index.html')); return; }
  if (url.pathname.endsWith('/parts-data.json')) { e.respondWith(networkFirst(req, './parts-data.json')); return; }
  // 나머지(폰트, 아이콘)는 캐시 우선
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); }
    return r;
  }).catch(() => hit)));
});
