/**
 * Simplified definition of the browser's native CookieStore. Not to be confused with our CookieStorage.
 * @typedef {{get: (name: string) => Promise<{ value: string } | undefined>}} CookieStore
 */

// eslint-disable-next-line no-restricted-globals
const sw = /** @type {ServiceWorkerGlobalScope & { cookieStore?: CookieStore }} */ (/** @type {unknown} */ (self));

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
    const request = event.request;
    const requestHost = new URL(request.url).host;
    if (requestHost !== sw.location.host) return;

    if (event.resultingClientId) {
        // This is a page navigation request or page reload.
        // Store the original request referrer, because Firefox has a bug causing it to not forward this referrer to
        // document.referrer if a service worker handles the request, regardless of the previous page's, the Keyguard's
        // and this request's referrerPolicy. Possibly related bug tracking:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1626616, https://bugzilla.mozilla.org/show_bug.cgi?id=1626192.
        clientReferrers.set(event.resultingClientId, request.referrer);
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
    // On testnet, allow cookies, if the branch selector cookie is set.
    event.respondWith((async () => {
        const preserveBranchSelectorCookie = sw.location.hostname.endsWith('.nimiq-testnet.com')
            // If cookieStore is supported, check whether the branch selector cookie is set. If cookieStore is not
            // supported, there's no way for us to know whether the branch selector cookie is set, and we have to assume
            // that it is, which is fine in testnet. Notably, we cannot check request.headers.get('cookie') because the
            // cookies are only attached by the browser after the ServiceWorker processed the request, depending on
            // request.credentials.
            && (!sw.cookieStore || !!(await sw.cookieStore.get('environment')));
        // Note that if we want to preserve the branch selector cookie, we have to keep all cookies because it is not
        // possible to set custom request cookies, only including the branch selector cookie, as the cookie header can
        // not be overwritten: https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name
        return fetch(request, !preserveBranchSelectorCookie ? { credentials: 'omit' } : {});
    })());
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
