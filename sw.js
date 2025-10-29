// Bump this cache name whenever you change files to force clients to refresh
const CACHE_NAME = 'halloween-rock-v3'
// Use relative paths in the precache so the service worker works under a repo subpath (GH Pages)
const PRECACHE_URLS = [
  'index.html',
  'styles/main.css',
  'scripts/state.js',
  'scripts/audio.js',
  'scripts/ui.js',
  'scripts/main.js',
  'public/images/face.png',
  // optional audio sample - will be fetched and cached only if present
  'public/audio/drum.wav',
  // tom sample (precache so it's available offline on install)
  'public/audio/tom.wav',
  // cymbal sample (precache so it's available offline on install)
  'public/audio/cymbal.wav'
]

self.addEventListener('install', event => {
  self.skipWaiting()
  // Precache only the assets that are reachable (don't fail install if some are missing)
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    for (const url of PRECACHE_URLS) {
      try {
        const resp = await fetch(url)
        if (resp && resp.ok) {
          await cache.put(url, resp.clone())
        }
      } catch (e) {
        // ignore missing resources (e.g., optional audio not yet added to repo)
        console.warn('SW precache skip', url, e && e.message)
      }
    }
  })())
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k) })
    ))
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  // Only handle same-origin requests
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(resp => {
          // Cache successful basic responses for future
          if (resp && resp.status === 200 && resp.type === 'basic') {
            const copy = resp.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy))
          }
          return resp
          }).catch(() => caches.match('index.html'))
      })
    )
  }
})

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})
