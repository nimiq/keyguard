/* global TopLevelApi */
/* global ChangePassphrase */
/* global KeyStore */
/* global Errors */
class ChangePassphraseApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.SimpleRequest} request
     */
    async onRequest(request) {
        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type {HTMLButtonElement} */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => this.reject(new Errors.Cancel()));
        try {
            const parsedRequest = await ChangePassphraseApi._parseRequest(request);
            const handler = new ChangePassphrase(parsedRequest, this.resolve.bind(this));
            handler.run();
        } catch (e) {
            this.reject(e);
        }
    }

    /**
     * @param {KeyguardRequest.SimpleRequest} request
     * @returns {Promise<KeyguardRequest.ParsedSimpleRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequest('Request can not be empty');
        }

        // Check that keyId is given.
        if (!request.keyId || typeof request.keyId !== 'string') {
            throw new Errors.InvalidRequest('keyId is required');
        }

        // Check that appName is given
        if (!request.appName || typeof request.appName !== 'string') {
            throw new Errors.InvalidRequest('appName is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Errors.InvalidRequest('keyId not found');
        }

        // Validate labels.
        if (request.keyLabel !== undefined && (typeof request.keyLabel !== 'string' || request.keyLabel.length > 64)) {
            throw new Errors.InvalidRequest('Invalid keyLabel');
        }

        return /** @type {ParsedSimpleRequest} */ {
            appName: request.appName,
            keyInfo,
            keyLabel: request.keyLabel,
        };
    }
}
