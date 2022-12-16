// eslint-disable-next-line spaced-comment
/// <reference lib='webworker' />

// eslint-disable-next-line no-restricted-globals
const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

/* eslint-disable no-restricted-globals */
// const PRECACHE = 'v1';

// A list of local resources we always want to be cached.
// /** @type {string[]} */
// const PRECACHE_URLS = [];

// The install handler takes care of precaching the resources we always need.
/*
sw.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await sw.caches.open(PRECACHE);
        await cache.addAll(PRECACHE_URLS);
        return sw.skipWaiting();
    })());
});
*/

/*
// The activate handler takes care of cleaning up old caches.
sw.addEventListener('activate', event => {
    const currentCaches = [PRECACHE, RUNTIME];
    event.waitUntil((async () => {
        const cacheNames = await sw.caches.keys();
        const cachesToDelete = cacheNames.filter(cacheName => currentCaches.indexOf(cacheName) === -1);
        await Promise.all(cachesToDelete.map(cacheToDelete => sw.caches.delete(cacheToDelete)));
        return sw.clients.claim();
    })());
});
*/

/** @type {Map<string, string>} */
const clientReferrers = new Map();
let clientReferrersCleanupInterval = -1;

// Intercept fetch
sw.addEventListener('fetch', event => {
    const requestHost = new URL(event.request.url).host;
    if (requestHost !== sw.location.host) return;

    if (event.resultingClientId) {
        // This is a page navigation request or page reload.
        // Store the original request referrer, because Firefox has a bug causing it to not forward this referrer to
        // document.referrer if a service worker handles the request, regardless of the previous page's, the Keyguard's
        // and this request's referrerPolicy. Possibly related bug tracking:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1626616, https://bugzilla.mozilla.org/show_bug.cgi?id=1626192.
        clientReferrers.set(event.resultingClientId, event.request.referrer);
        if (clientReferrersCleanupInterval === -1) {
            clientReferrersCleanupInterval = sw.setInterval(async () => {
                for (const clientId of clientReferrers.keys()) {
                    if (await sw.clients.get(clientId)) continue; // eslint-disable-line no-await-in-loop
                    // The client window has been closed.
                    clientReferrers.delete(clientId);
                }
                if (!clientReferrers.size) {
                    sw.clearInterval(clientReferrersCleanupInterval);
                    clientReferrersCleanupInterval = -1;
                }
            }, 5 * 60 * 1000);
        }
    }

    // Strip cookies from all requests with matching host, as those are the ones potentially leaking cookie data.
    // See: https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy#Cross-origin_data_storage_access
    event.respondWith(fetch(event.request, {
        // omit cookie transmission
        credentials: 'omit',
    }));
});

sw.addEventListener('message', async ({ origin, source: client, data: eventData }) => {
    if (origin !== sw.location.origin
        || !(client instanceof Client) // eslint-disable-line no-undef
        || !eventData || typeof eventData !== 'object' || eventData.requestId === undefined || !eventData.type) return;
    const { requestId, type /* , data */ } = eventData;
    switch (type) {
        case 'getReferrer':
            client.postMessage({
                requestId,
                data: clientReferrers.get(client.id),
            });
            break;
        default:
            throw new Error(`Unsupported service worker message type ${type}`);
    }
});
