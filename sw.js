const CACHE_NAME = 'lf-turma-sabado-v29';

// Arquivos que o app precisa baixar na primeira vez para funcionar offline
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './fotos/logo.png',
    './fotos/apple-touch-icon.png',
    './audios/apito.mp3',
    './audios/sorteio.mp3'
];

// Instalação: baixa tudo e ATIVA na hora — sem esperar as abas fecharem.
// É isso que faz a atualização chegar sem precisar desinstalar/limpar cache.
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Ativação: assume o controle das abas abertas e limpa caches antigos
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        if (self.registration.navigationPreload) {
            try { await self.registration.navigationPreload.disable(); } catch (e) {}
        }
        const keys = await caches.keys();
        await Promise.all(keys.map(key => {
            if (key !== CACHE_NAME) return caches.delete(key);
        }));
        await self.clients.claim();
    })());
});

// Intercepta as requisições: tenta pegar do cache, se não tiver, pega da rede e já salva no cache
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response; // Achou no cache, retorna direto (Offline)
                }
                
                // Se não achou (ex: link do Tailwind, FontAwesome ou foto de jogador), baixa da net
                return fetch(event.request).then(fetchResponse => {
                    // Impede o cache de requisições que deram erro ou são de extensões
                    if(!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                        return fetchResponse;
                    }

                    // Clona a resposta para salvar no cache e entregar para o app
                    let responseToCache = fetchResponse.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            // Salva a nova requisição dinamicamente para a próxima vez
                            cache.put(event.request, responseToCache);
                        });

                    return fetchResponse;
                });
            }).catch(() => {
                // Caso falhe tudo e esteja sem internet, ele simplesmente ignora para não travar o app
            })
    );
});
