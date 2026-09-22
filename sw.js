/* IRON LOG — service worker
   >>> BUMP `BUILD` A OGNI DEPLOY. E' cio' che invalida la cache sul telefono. <<< */
const BUILD = '2026-09-22-6';
const CACHE = `ironlog-${BUILD}`;

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', e => {
  // Niente skipWaiting automatico: e' la pagina a chiedere conferma all'utente.
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

/* ============================ NOTIFICA FINE RECUPERO ============================
   La pagina manda REST_END con il timestamp di scadenza; il SW tiene un proprio
   setTimeout e mostra la notifica.
   Limite reale: se il SW viene terminato dal sistema (app chiusa davvero, memoria
   liberata) il timeout muore con lui. Senza Web Push non c'e' modo di risvegliarlo:
   questo copre l'app in background, non l'app chiusa.
   Il caso "app chiusa" e' gestito lato pagina con TimestampTrigger, dove esiste. */
const REST_TAG = 'ironlog-rest';
let restTO = null;

function clearRest() {
  if (restTO) { clearTimeout(restTO); restTO = null; }
}

async function closeRestNotifs() {
  try {
    const ns = await self.registration.getNotifications({ tag: REST_TAG });
    ns.forEach(n => n.close());
  } catch (_) {}
}

function showRest(title, body, opts) {
  restTO = null;
  return self.registration.showNotification(title || 'Recupero finito', Object.assign({
    body: body || 'Vai con la prossima serie.',
    tag: REST_TAG,
    renotify: true,
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [220, 120, 220],
    data: { kind: 'rest' }
  }, opts || {}));
}

self.addEventListener('message', e => {
  const d = e.data;

  // la pagina usa ancora la stringa secca per l'aggiornamento
  if (d === 'SKIP_WAITING') { self.skipWaiting(); return; }
  if (!d || typeof d !== 'object') return;

  if (d.type === 'REST_END') {
    clearRest();
    const delay = Math.max(0, (d.at || 0) - Date.now());
    // scadenza gia' passata o oltre le 2 ore: non schedulo nulla
    if (!d.at || delay > 2 * 3600e3) return;
    e.waitUntil(closeRestNotifs());
    if (delay === 0) { showRest(d.title, d.body, d.opts); return; }
    restTO = setTimeout(() => showRest(d.title, d.body, d.opts), delay);
    return;
  }

  if (d.type === 'REST_CANCEL') {
    clearRest();
    e.waitUntil(closeRestNotifs());
    return;
  }
});

/* Tap sulla notifica: riporto in primo piano la scheda gia' aperta invece di
   aprirne una nuova, altrimenti l'app si duplica e il timer si sdoppia. */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of cs) {
      if ('focus' in c) return c.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow('./index.html');
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  // HTML -> network-first: con rete vedi subito il deploy nuovo.
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith((async () => {
      try {
        const preload = await e.preloadResponse;
        const res = preload || await fetch(req);
        const c = await caches.open(CACHE);
        c.put('./index.html', res.clone());
        return res;
      } catch (_) {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Asset statici -> stale-while-revalidate.
  e.respondWith((async () => {
    const cached = await caches.match(req);
    const network = fetch(req).then(res => {
      if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
      return res;
    }).catch(() => null);
    return cached || (await network) || Response.error();
  })());
});
