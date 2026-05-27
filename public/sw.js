const CACHE = 'wanda-v12'

self.addEventListener('install', e => {
  self.skipWaiting()
  // Pre-cache index.html so SPA routing never fails
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.add('/index.html').catch(() => {})
    )
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
    .then(() => self.clients.claim())
  )
})

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return

  const url = e.request.url
  if (url.includes('supabase')) return
  if (url.includes('accounts.google.com')) return
  if (url.includes('googleapis.com')) return
  if (url.includes('gstatic.com')) return
  if (url.includes('/@vite')) return
  if (url.includes('node_modules')) return
  if (url.includes('version.json')) return

  // HTML navigation (SPA): network-first, fallback to cached index.html, then offline page
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(res => {
          // Cache a fresh copy of index.html for offline fallback
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put('/index.html', clone)).catch(() => {})
          }
          return res
        })
        .catch(() =>
          caches.match('/index.html').then(cached =>
            cached || new Response(
              '<html><body style="background:#1a1a2e;color:#fff;font-family:sans-serif;text-align:center;padding:4rem"><h2 style="color:#C8963E">You are offline</h2><p>Please check your connection and try again.</p><button onclick="location.reload()" style="padding:12px 32px;border-radius:25px;background:#C8963E;color:#fff;border:none;font-size:16px;cursor:pointer;margin-top:1rem">Retry</button></body></html>',
              { status: 503, headers: { 'Content-Type': 'text/html' } }
            )
          )
        )
    )
    return
  }

  // Other assets: network-first with cache fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {})
        }
        return res
      })
      .catch(() =>
        caches.match(e.request).then(cached =>
          cached || new Response('', { status: 404 })
        )
      )
  )
})

// Push Notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {}
  e.waitUntil(self.registration.showNotification(
    data.title || 'Wanda',
    {
      body: data.body || 'Something new on Wanda!',
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'wanda',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
    }
  ))
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
