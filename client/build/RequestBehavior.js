import { RedirectRpcClient } from '@nimiq/rpc';
export class RequestBehavior {
    static getAllowedOrigin(endpoint) {
        // FIXME derive from endpoint url
        return '*';
    }
    static getRequestUrl(endpoint, command) {
        return `${endpoint}/request/${command}/`;
    }
    constructor(targetUrl, localState) {
        const location = window.location;
        this._targetUrl = targetUrl
            || `${location.protocol}//${location.hostname}:${location.port}${location.pathname}`;
        this._localState = localState || {};
        // Reject local state with reserved property.
        if (localState && typeof localState.__command !== 'undefined') {
            throw new Error('Invalid localState: Property \'__command\' is reserved');
        }
    }
    async request(endpoint, command, args) {
        const url = RequestBehavior.getRequestUrl(endpoint, command);
        const origin = RequestBehavior.getAllowedOrigin(endpoint);
        const client = new RedirectRpcClient(url, origin);
        await client.init();
        const state = Object.assign({ __command: command }, this._localState);
        client.callAndSaveLocalState(this._targetUrl, state, 'request', ...args);
    }
}
//# sourceMappingURL=RequestBehavior.js.map