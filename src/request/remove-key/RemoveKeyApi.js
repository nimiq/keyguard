/* global TopLevelApi */
/* global RemoveKey */
/* global KeyStore */
/* global Errors */

class RemoveKeyApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.SimpleRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await RemoveKeyApi._parseRequest(request);
        const removeKeyHandler = new RemoveKey(parsedRequest, this.resolve.bind(this), this.reject.bind(this));

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type {HTMLButtonElement} */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => this.reject(new Errors.RequestCanceled()));

        removeKeyHandler.run();
    }

    /**
     * @param {KeyguardRequest.SimpleRequest} request
     * @returns {Promise<KeyguardRequest.ParsedSimpleRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('Empty request');
        }

        // Check that keyId is given.
        if (!request.keyId || typeof request.keyId !== 'string') {
            throw new Errors.InvalidRequestError('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Errors.KeyNotFoundError();
        }

        // Validate labels.
        if (request.keyLabel !== undefined && (typeof request.keyLabel !== 'string' || request.keyLabel.length > 64)) {
            throw new Errors.InvalidRequestError('Invalid label');
        }

        return /** @type {ParsedRemoveKeyRequest} */ {
            appName: request.appName,
            keyInfo,
            keyLabel: request.keyLabel,
        };
    }
}
