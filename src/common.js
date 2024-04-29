/* global Nimiq */
/* global RpcServer */
/* global Errors */
/* global Constants */
/* global CONFIG */

/**
 * @callback reject
 * @param {Error} error
 */

/** @type {Promise<void>?} */
let __nimiqLoaded = null;

/** @type {Promise<void>?} */
let __albatrossLoaded = null;

if (navigator.serviceWorker) {
    // Register service worker to strip cookie from requests.
    // This is on a best-effort basis. Cookies might still be sent to the server, if the service worker is not activated
    // yet or the user disables Javascript.
    // This file is always called from a ./request/*/ folder, hence the paths.
    navigator.serviceWorker.register('../../ServiceWorker.js', {
        scope: '../../',
    }).then(reg => {
        console.debug(`Service worker has been registered for scope: ${reg.scope}`);
    }).catch(error => {
        console.error('Service worker installation failed');
        throw error;
    });
}

/**
 * Singleton promise
 *
 * @returns {Promise<void>}
 */
async function loadNimiq() {
    // eslint-disable-next-line no-return-assign
    return __nimiqLoaded || (__nimiqLoaded = new Promise(async resolve => {
        // Load web assembly encryption library into browser (if supported)
        await Nimiq.WasmHelper.doImport();

        switch (CONFIG.NETWORK) {
            case Constants.NETWORK.DEV:
                Nimiq.GenesisConfig.dev();
                break;
            case Constants.NETWORK.TEST:
                Nimiq.GenesisConfig.test();
                break;
            case Constants.NETWORK.MAIN:
                Nimiq.GenesisConfig.main();
                break;
            default:
                throw new Errors.InvalidNetworkConfig();
        }

        resolve();
    }));
}

/**
 * Singleton promise
 *
 * @returns {Promise<void>}
 */
async function loadAlbatross() {
    // eslint-disable-next-line no-return-assign
    return __albatrossLoaded || (__albatrossLoaded = new Promise(async resolve => {
        await Albatross.default(); // eslint-disable-line no-undef
        resolve();
    }));
}

/**
 * @typedef {{loadNimiq: boolean, loadAlbatross: boolean, whitelist: string[]}} Options
 */

/**
 * @template {KeyguardRequest.RedirectRequest} T
 * @param {Newable} RequestApiClass - Class object of the API which is to be exposed via RPC
 * @param {Partial<Options>} [opts]
 */
async function runKeyguard(RequestApiClass, opts) { // eslint-disable-line no-unused-vars
    /** @type {Options} */
    const defaultOptions = {
        loadNimiq: true,
        loadAlbatross: false,
        whitelist: ['request'],
    };

    /** @type {Options} */
    const options = Object.assign(defaultOptions, opts);

    if (options.loadNimiq) {
        await loadNimiq();
    }

    if (options.loadAlbatross) {
        await loadAlbatross();
    }

    // If user navigates back to loading screen, skip it
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '') {
            window.history.back();
        }
    });

    // Back arrow functionality
    document.body.addEventListener('click', event => {
        if (!(event.target instanceof HTMLElement) || !event.target.matches('a.page-header-back-button')) return;
        window.history.back();
    });

    // Instantiate handler.
    /** @type {TopLevelApi<T> | IFrameApi} */
    const api = new RequestApiClass();

    const serviceWorker = navigator.serviceWorker && navigator.serviceWorker.controller;
    if (!document.referrer && serviceWorker) {
        // Firefox does not correctly forward the referrer if a service worker was involved in loading the page, see
        // ServiceWorker.js
        const fallbackReferrer = await new Promise(resolve => {
            const requestId = Date.now();
            /** @param {MessageEvent} event */
            const onMessage = ({ origin, data: eventData }) => {
                if (origin !== window.location.origin
                    || !eventData || typeof eventData !== 'object' || eventData.requestId !== requestId) return;
                navigator.serviceWorker.removeEventListener('message', onMessage);
                resolve(eventData.data);
            };
            navigator.serviceWorker.addEventListener('message', onMessage);
            serviceWorker.postMessage({
                requestId,
                type: 'getReferrer',
            });
        });
        if (fallbackReferrer) {
            // Use Object.defineProperty because document.referrer can not be overwritten directly.
            Object.defineProperty(document, 'referrer', { value: fallbackReferrer });
        }
    }

    window.rpcServer = new RpcServer(CONFIG.ALLOWED_ORIGIN);

    options.whitelist.forEach(/** @param {string} method */ method => {
        // @ts-expect-error (Element implicitly has an 'any' type because type 'TopLevelApi' has no index signature.)
        window.rpcServer.onRequest(method, api[method].bind(api));
    });

    const handledRedirectRequest = window.rpcServer.init();

    if (window.top === window && !handledRedirectRequest) {
        // This is not an iframe and no request was handled
        TopLevelApi.showNoRequestErrorPage(); // eslint-disable-line no-undef
    }
}
