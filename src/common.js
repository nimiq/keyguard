/* global Nimiq */
/* global RpcServer */
/* global Errors */
/* global Constants */
/* global CONFIG */
/* global BrowserDetection */

/**
 * @callback reject
 * @param {Error} error
 */

/** @type {Promise<void>?} */
let __nimiqLoaded = null;

if ((BrowserDetection.isIOS() || BrowserDetection.isSafari()) && 'serviceWorker' in navigator) {
    // Register service worker to strip cookie from requests.
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
 * @param {Newable} RequestApiClass - Class object of the API which is to be exposed via RPC
 * @param {object} [options]
 */
async function runKeyguard(RequestApiClass, options) { // eslint-disable-line no-unused-vars
    const defaultOptions = {
        loadNimiq: true,
        whitelist: ['request'],
    };

    options = Object.assign(defaultOptions, options);

    if (options.loadNimiq) {
        await loadNimiq();
    }

    // If user navigates back to loading screen, skip it
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '') {
            window.history.back();
        }
    });

    // Back arrow functionality
    document.body.addEventListener('click', event => {
        // @ts-ignore (Property 'matches' does not exist on type 'EventTarget'.)
        if (!event.target || !event.target.matches('a.page-header-back-button')) return;
        window.history.back();
    });

    // Instantiate handler.
    /** @type {TopLevelApi | IFrameApi} */
    const api = new RequestApiClass();

    /** @type {string} */
    const allowedOrigin = CONFIG.ALLOWED_ORIGIN;

    window.rpcServer = new RpcServer(allowedOrigin);

    options.whitelist.forEach(/** @param {string} method */ method => {
        // @ts-ignore (Element implicitly has an 'any' type because type 'TopLevelApi' has no index signature.)
        window.rpcServer.onRequest(method, api[method].bind(api));
    });

    const handledRedirectRequest = window.rpcServer.init();

    if (window.top === window && !handledRedirectRequest) {
        // This is not an iframe and no request was handled
        TopLevelApi.showNoRequestErrorPage(); // eslint-disable-line no-undef
    }
}
