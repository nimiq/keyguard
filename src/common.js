/* global Nimiq */
/* global Rpc */

/**
 * @returns {string}
 */
function allowedOrigin() {
    switch (window.location.origin) {
    case 'https://keyguard-next.nimiq.com': return 'https://accounts-next.nimiq.com';
    case 'https://keyguard-next.nimiq-network.com': return 'https://accounts-next.nimiq-network.com';
    default: return '*';
    }
}

/**
 * @param {Newable} RequestApiClass - Class object of the API which is to be exposed via postMessage RPC
 * @param {object} [options]
 */
async function runKeyguard(RequestApiClass, options) { // eslint-disable-line no-unused-vars
    const defaultOptions = {
        loadNimiq: true,
        whitelist: ['request'],
    };

    options = Object.assign(defaultOptions, options);

    if (options.loadNimiq) {
        // Load web assembly encryption library into browser (if supported)
        await Nimiq.WasmHelper.doImportBrowser();
        // Configure to use test net for now
        Nimiq.GenesisConfig.test();
    }

    // If user navigates back to loading screen, skip it
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '') {
            history.back();
        }
    });
    
    // Back arrow functionality
    const $backButtons = (document.querySelectorAll('a.page-header-back-button'));
    for (const $backButton of $backButtons) {
        $backButton.addEventListener('click', () => history.back());
    }

    // Instantiate handler.
    const api = new RequestApiClass();

    window.rpcServer = new Rpc.RpcServer(allowedOrigin());

    // TODO: Use options.whitelist when adding onRequest handlers (iframe uses different methods)
    window.rpcServer.onRequest('request', (state, request) => api.request(request));

    window.rpcServer.init();
}
