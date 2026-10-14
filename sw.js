/* Kill-switch: replaces the old root v2 service worker so browsers drop the stale app and load /dist/. */
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil((async()=>{for(const k of await caches.keys()) if(!/^zy-[0-9a-f]{10}$/.test(k)) await caches.delete(k);
await self.registration.unregister();for(const c of await self.clients.matchAll({type:"window"})) c.navigate(new URL("dist/",self.registration.scope).href);})()));
