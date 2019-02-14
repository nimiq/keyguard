/*
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

// Names of the two caches used in this version of the service worker.
// Change to v2, etc. when you update any of the local resources, which will
// in turn trigger the install event again.
const PRECACHE = 'v1';
const RUNTIME = 'runtime';

// A list of local resources we always want to be cached.
/** @type {string[]} */
const PRECACHE_URLS = [
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
    // @ts-ignore
    event.waitUntil(
        caches.open(PRECACHE)
            .then(cache => cache.addAll(PRECACHE_URLS))
            // @ts-ignore
            .then(self.skipWaiting()),
    );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
    const currentCaches = [PRECACHE, RUNTIME];
    // @ts-ignore
    event.waitUntil(
        caches.keys().then(cacheNames => cacheNames.filter(cacheName => currentCaches.indexOf(cacheName) === -1))
            .then(cachesToDelete => Promise.all(cachesToDelete.map(cacheToDelete => caches.delete(cacheToDelete))))
            // @ts-ignore
            .then(() => self.clients.claim()),
    );
});


// Intercept fetch
self.addEventListener('fetch', event => {
    // @ts-ignore
    if (event.request.url.startsWith(self.location.origin)) {
        // forward request
        // @ts-ignore
        event.respondWith(fetch(event.request, {
            // omit cookie transmission
            credentials: 'omit',
        }));
    }
});
