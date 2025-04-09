// Service Worker dla Dziennika nawodnienia
const CACHE_NAME = 'dziennik-nawodnienia-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './statistics.js',
  './charts.js',
  './custom-reminders.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css'
];

// Instalacja Service Workera
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache otwarty');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Aktywacja Service Workera
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Obsługa żądań fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Zwróć z cache jeśli istnieje
        if (response) {
          return response;
        }
        
        // Inaczej pobierz z sieci
        return fetch(event.request).then(response => {
          // Sprawdź czy odpowiedź jest poprawna
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Sklonuj odpowiedź, ponieważ jest strumieniem
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              // Dodaj odpowiedź do cache
              cache.put(event.request, responseToCache);
            });
            
          return response;
        });
      })
      .catch(() => {
        // Fallback dla obrazów
        if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
          return caches.match('./icons/icon-512x512.png');
        }
      })
  );
});

// Obsługa powiadomień push
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body || 'Czas na szklankę wody!',
    icon: data.icon || './icons/icon-192x192.png',
    badge: './icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1
    },
    actions: [
      { action: 'close', title: 'Zamknij' },
      { action: 'check', title: 'Sprawdź' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Dziennik nawodnienia', options)
  );
});

// Obsługa kliknięcia w powiadomienie
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'check') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});