/* global TopLevelApi */
/* global Export */
/* global Errors */

class ExportApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {Parsed<KeyguardRequest.SimpleRequest>} request
     */
    async onRequest(request) {
        const exportHandler = new Export(request, this.resolve.bind(this), this.reject.bind(this));

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type {HTMLButtonElement} */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => this.reject(new Errors.RequestCanceled()));

        exportHandler.run();
    }

    /**
     * @param {KeyguardRequest.SimpleRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SimpleRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);

        return parsedRequest;
    }
}
