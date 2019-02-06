/* global Nimiq */
/* global RpcServer */

/** @type {Promise<void>?} */
let __nimiqLoaded = null;

/**
 * Singleton promise
 *
 * @returns {Promise<void>}
 */
async function loadNimiq() {
    // eslint-disable-next-line no-return-assign
    return __nimiqLoaded || (__nimiqLoaded = new Promise(async resolve => {
        // Load web assembly encryption library into browser (if supported)
        await Nimiq.WasmHelper.doImportBrowser();

        // Configure to use test net for now
        Nimiq.GenesisConfig.test();

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
        // @ts-ignore
        if (!event.target || !event.target.matches('a.page-header-back-button')) return;
        window.history.back();
    });

    // Instantiate handler.
    /** @type {TopLevelApi | IFrameApi} */
    const api = new RequestApiClass();

    /**
     * @returns {string}
     */
    function allowedOrigin() {
        switch (window.location.origin) {
        case 'https://keyguard-next.nimiq.com': return 'https://accounts.nimiq.com';
        case 'https://keyguard-next.nimiq-testnet.com': return 'https://accounts.nimiq-testnet.com';
        default: return '*';
        }
    }

    window.rpcServer = new RpcServer(allowedOrigin());

    options.whitelist.forEach(/** @param {string} method */ method => {
        // @ts-ignore (Element implicitly has an 'any' type because type 'TopLevelApi' has no index signature.)
        window.rpcServer.onRequest(method, api[method].bind(api));
    });

    window.rpcServer.init();
}

function getDocumentWidth() {
    return window.innerWidth
        || document.documentElement.clientWidth
        || document.getElementsByTagName('body')[0].clientWidth;
}
