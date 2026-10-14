/* Zabanyar service worker — version is injected at build time */
const VERSION = "7f09bd086f", CACHE = "zy-" + VERSION, PRECACHE = ["./","app.js","content/a1.json","content/a2.json","content/b1.json","content/b2.json","content/c1.json","content/program.json","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon.svg","icons/maskable-512.png","index.html","manifest.json","placement.js","styles.css","voice.js","voices.js","content/index.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE))); });
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("zy-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("message", e => { if (e.data === "skipWaiting") self.skipWaiting(); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // never cache AI/API calls
  if (u.pathname.endsWith("/version.json")) return; // always network
  if (u.pathname.includes("/audio/")) { // prebuilt lesson audio: separate cache that survives app updates
    e.respondWith(caches.open("zyaudio-1").then(c => c.match(e.request).then(r => r || fetch(e.request).then(res => { if (res.ok && !u.pathname.endsWith("manifest.json")) c.put(e.request, res.clone()); return res; })))); return; }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return res; }).catch(() => e.request.mode === "navigate" ? caches.match("index.html") : Response.error())));
});
