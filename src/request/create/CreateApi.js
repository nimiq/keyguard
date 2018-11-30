/* global TopLevelApi */
/* global Create */
/* global Nimiq */
/* global Errors */
class CreateApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.CreateRequest} request
     */
    async onRequest(request) {
        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type {HTMLButtonElement} */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => this.reject(new Errors.Cancel()));
        const parsedRequest = CreateApi._parseRequest(request);
        const handler = new Create(parsedRequest, this.resolve.bind(this), this.reject.bind(this));
        handler.run();
    }

    /**
     * @param {KeyguardRequest.CreateRequest} request
     * @returns {KeyguardRequest.CreateRequest}
     * @private
     */
    static _parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequest('Empty request');
        }

        if (!request.appName || typeof request.appName !== 'string') {
            throw new Errors.InvalidRequest('appName is required');
        }

        if (!request.defaultKeyPath || !Nimiq.ExtendedPrivateKey.isValidPath(request.defaultKeyPath)) {
            throw new Errors.InvalidRequest('Invalid defaultKeyPath');
        }

        return request;
    }
}
