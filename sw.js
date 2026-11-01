const VERSAO = 'estoque-0103-v7';
const ARQUIVOS = ['./', './index.html', './marcelo.html', './manifest.webmanifest', './marcelo.webmanifest'];
const SDK = 'https://www.gstatic.com/firebasejs/';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => Promise.all(ARQUIVOS.map(a => c.add(a).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  /* SDK do Firebase: a versão nunca muda, então usa a cópia guardada */
  if (req.url.startsWith(SDK)) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(resp => {
      const copia = resp.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); return resp;
    })));
    return;
  }
  /* Qualquer outra coisa de fora (como o banco do Firebase) passa direto */
  if (url.origin !== self.location.origin) return;
  /* Arquivos do site: tenta a internet primeiro, sem internet usa a cópia */
  e.respondWith(
    fetch(req).then(resp => {
      const copia = resp.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); return resp;
    }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match(url.pathname.endsWith('marcelo.html') ? './marcelo.html' : './index.html')))
  );
});
