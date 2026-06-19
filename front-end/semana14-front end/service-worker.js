const CACHE_NAME = 'pwa-estudos-v1'; 

const ARQUIVOS = [ 

  './', 

  './index.html', 

  './app.js', 

  './manifest.json' 

]; 

 

self.addEventListener('install', event => { 

  console.log('Service Worker instalando.'); 

  self.skipWaiting(); 

  event.waitUntil( 

    caches.open(CACHE_NAME).then(cache => cache.addAll(ARQUIVOS)) 

  ); 

}); 

 

self.addEventListener('activate', event => { 

  console.log('Service Worker ativado.'); 

  event.waitUntil( 

    caches.keys().then(cacheNames => { 

      return Promise.all( 

        cacheNames.map(cacheName => { 

          if (cacheName !== CACHE_NAME) { 

            return caches.delete(cacheName); 

          } 

        }) 

      ); 

    }) 

  ); 

}); 

 

self.addEventListener('fetch', event => { 

  console.log('Requisicao de fetch para:', event.request.url); 

  event.respondWith( 

    caches.match(event.request).then(response => { 

      return response || fetch(event.request); 

    }) 

  ); 

}); 

 

self.addEventListener('push', event => { 

  console.log('Notificacao push recebida:', event); 

}); 