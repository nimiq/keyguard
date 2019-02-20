/*
 Based on code under the following license:
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
     http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

/* eslint-disable no-restricted-globals */
// const PRECACHE = 'v1';

// A list of local resources we always want to be cached.
// /** @type {string[]} */
// const PRECACHE_URLS = [];

// The install handler takes care of precaching the resources we always need.
/*
self.addEventListener('install', event => {
    // @ts-ignore Property 'waitUntil' does not exist on type 'Event'.ts
    event.waitUntil((async () => {
        const cache = await caches.open(PRECACHE);
        await cache.addAll(PRECACHE_URLS);
        // @ts-ignore Property 'skipWaiting' does not exist on type 'Window'.ts
        return self.skipWaiting();
    })());
});
*/

/*
// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
    const currentCaches = [PRECACHE, RUNTIME];
    // @ts-ignore Property 'waitUntil' does not exist on type 'Event'.ts(2339)
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();
        const cachesToDelete = cacheNames.filter(cacheName => currentCaches.indexOf(cacheName) === -1);
        await Promise.all(cachesToDelete.map(cacheToDelete => caches.delete(cacheToDelete)));
        // @ts-ignore Property 'clients' does not exist on type 'Window'.ts
        return self.clients.claim();
    })());
});
*/

// Intercept fetch
self.addEventListener('fetch', event => {
    // Respond to all requests with matching host, as those are the ones potentially leaking cookie data to the server.
    // See: https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy#Cross-origin_data_storage_access
    // @ts-ignore Property 'request' does not exist on type 'Event'.ts
    const requestHost = new URL(event.request.url).host;
    if (requestHost === location.host) {
        // forward request
        // @ts-ignore Property 'respondWith' does not exist on type 'Event'.ts,
        // Property 'request' does not exist on type 'Event'.ts
        event.respondWith(fetch(event.request, {
            // omit cookie transmission
            credentials: 'omit',
        }));
    }
});
