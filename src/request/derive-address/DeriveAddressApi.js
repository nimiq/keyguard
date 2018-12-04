/* global TopLevelApi */
/* global DeriveAddress */
/* global Key */
/* global KeyStore */
/* global Nimiq */
/* global Errors */

class DeriveAddressApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.DeriveAddressRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await DeriveAddressApi._parseRequest(request);
        const handler = new DeriveAddress(parsedRequest, this.resolve.bind(this), this.reject.bind(this));

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type {HTMLButtonElement} */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => this.reject(new Errors.RequestCanceled()));

        handler.run();
    }

    /**
     * @param {KeyguardRequest.DeriveAddressRequest} request
     * @returns {Promise<KeyguardRequest.ParsedDeriveAddressRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('Empty request');
        }

        if (!request.appName || typeof request.appName !== 'string') {
            throw new Errors.InvalidRequestError('appName is required');
        }

        if (!request.keyId || typeof request.keyId !== 'string') {
            throw new Errors.InvalidRequestError('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Errors.KeyNotFoundError();
        }

        if (keyInfo.type === Key.Type.LEGACY) {
            throw new Errors.InvalidRequestError('Cannot derive addresses for single-account wallets');
        }

        if (!request.baseKeyPath || !Nimiq.ExtendedPrivateKey.isValidPath(request.baseKeyPath)) {
            throw new Errors.InvalidRequestError('Invalid baseKeyPath');
        }

        if (!request.indicesToDerive || !(request.indicesToDerive instanceof Array)) {
            throw new Errors.InvalidRequestError('Invalid indicesToDerive');
        }

        return {
            appName: request.appName,
            keyInfo,
            keyLabel: request.keyLabel,
            baseKeyPath: request.baseKeyPath,
            indicesToDerive: request.indicesToDerive,
        };
    }
}
