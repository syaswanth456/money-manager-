// Service Worker for WealthFlow PWA
const CACHE_NAME = 'wealthflow-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/accounts.html',
  '/expenses.html',
  '/income.html',
  '/transfer.html',
  '/css/base.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/animations.css',
  '/css/responsive.css',
  '/js/auth.js',
  '/js/api.js',
  '/js/state.js',
  '/pwa/icons/icon-192x192.png',
  '/pwa/icons/icon-512x512.png'
];

// ========================
// INSTALL EVENT
// ========================
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Install failed:', error);
      })
  );
});

// ========================
// ACTIVATE EVENT
// ========================
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// ========================
// FETCH EVENT
// ========================
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle API requests differently
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful API responses for offline viewing
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached API response if offline
          return caches.match(event.request);
        })
    );
    return;
  }

  // For HTML pages, try network first, then cache, then offline page
  if (event.request.headers.get('Accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cache with fresh response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Return cached version
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Show offline page
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }

  // For static assets: cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Update cache in background
          fetch(event.request).then((response) => {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          });
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Cache new response
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
            return response;
          })
          .catch(() => {
            // Return placeholder for images
            if (event.request.destination === 'image') {
              return caches.match('/pwa/icons/icon-192x192.png');
            }
          });
      })
  );
});

// ========================
// BACKGROUND SYNC
// ========================
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncPendingTransactions());
  }
});

async function syncPendingTransactions() {
  const db = await openDatabase();
  const pendingTransactions = await db.getAll('pending_transactions');
  
  for (const transaction of pendingTransactions) {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify(transaction)
      });
      
      if (response.ok) {
        await db.delete('pending_transactions', transaction.id);
        console.log('Synced transaction:', transaction.id);
      }
    } catch (error) {
      console.error('Failed to sync transaction:', error);
    }
  }
}

// ========================
// PUSH NOTIFICATIONS
// ========================
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/pwa/icons/icon-192x192.png',
    badge: '/pwa/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.url || '/dashboard.html',
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || event.action === '') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Focus existing window if open
          for (const client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(event.notification.data || '/');
          }
        })
    );
  }
});

// ========================
// HELPER FUNCTIONS
// ========================
async function getAuthToken() {
  // Get token from IndexedDB
  const db = await openDatabase();
  const user = await db.get('user', 'current');
  return user ? user.access_token : null;
}

function openDatabase() {
  return new Promise((resolve) => {
    const request = indexedDB.open('WealthFlowDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('user')) {
        db.createObjectStore('user', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('pending_transactions')) {
        const store = db.createObjectStore('pending_transactions', { 
          keyPath: 'id',
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      
      // Add helper methods
      db.get = (storeName, key) => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.get(key);
          
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      };
      
      db.getAll = (storeName) => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.getAll();
          
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      };
      
      db.put = (storeName, value) => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.put(value);
          
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      };
      
      db.delete = (storeName, key) => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.delete(key);
          
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      };
      
      resolve(db);
    };
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      resolve(null);
    };
  });
}

// ========================
// PERIODIC SYNC (for background updates)
// ========================
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-cache') {
      event.waitUntil(updateCachedData());
    }
  });
}

async function updateCachedData() {
  console.log('[Service Worker] Periodic sync started');
  
  try {
    // Update cached API data
    const cache = await caches.open(CACHE_NAME);
    const urlsToUpdate = [
      '/api/accounts',
      '/api/transactions/recent',
      '/api/summary'
    ];
    
    for (const url of urlsToUpdate) {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('Updated cache for:', url);
      }
    }
  } catch (error) {
    console.error('Periodic sync failed:', error);
  }
}

// ========================
// SERVICE WORKER READY
// ========================
console.log('[Service Worker] WealthFlow PWA Service Worker loaded');
