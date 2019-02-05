/* global TopLevelApi */
/* global DeriveAddress */
/* global Key */
/* global Errors */

class DeriveAddressApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.DeriveAddressRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await this.parseRequest(request);
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
     * @returns {Promise<ParsedDeriveAddressRequest>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        if (parsedRequest.keyInfo.type === Key.Type.LEGACY) {
            throw new Errors.InvalidRequestError('Cannot derive addresses for single-account wallets');
        }
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);
        parsedRequest.baseKeyPath = this.parsePath(request.baseKeyPath, 'baseKeyPath');
        parsedRequest.indicesToDerive = this.parseIndicesArray(request.indicesToDerive);

        return parsedRequest;
    }
}
