// CacaoID service worker: the field app must open with no signal (ROADMAP Fase 3).
// Network first, so online users always get fresh code and data; the last good copy is the offline fallback.
// Writes (saving a sample) are not cached: offline they fail and go to the app's own queue (GAPS G-12).
const CACHE = 'cacaoid-v1'
const SHELL = ['/m', '/manifest.webmanifest', '/icon-192.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin) return
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
        }
        return res
      })
      .catch(async () => {
        const hit = await caches.match(req)
        if (hit) return hit
        // Any page of the single-page app is the same shell; the router picks the screen.
        if (req.mode === 'navigate') return (await caches.match('/m')) ?? Response.error()
        return Response.error()
      }),
  )
})
