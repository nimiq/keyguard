/* global TopLevelApi */
/* global ExportWords */
/* global KeyStore */
class ExportWordsApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {ExportWordsRequest} request
     */
    async onRequest(request) {
        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => this.reject(new Error('CANCEL')));

        const parsedRequest = await ExportWordsApi._parseRequest(request);
        const handler = new ExportWords(parsedRequest, this.resolve.bind(this), this.reject.bind(this));
        handler.run();
    }

    /**
     * @param {ExportWordsRequest} request
     * @returns {Promise<ParsedExportWordsRequest>}
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Error('Empty request');
        }

        // Check that keyId is given.
        if (typeof request.keyId !== 'string' || !request.keyId) {
            throw new Error('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Error('Unknown keyId');
        }

        // Validate labels.
        if (request.keyLabel !== undefined && (typeof request.keyLabel !== 'string' || request.keyLabel.length > 64)) {
            throw new Error('Invalid label');
        }

        return /** @type {ParsedExportWordsRequest} */ {
            appName: request.appName,
            keyInfo,
            keyLabel: request.keyLabel,
        };
    }
}
