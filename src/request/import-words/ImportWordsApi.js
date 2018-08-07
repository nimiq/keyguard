/* global Nimiq */
/* global TopLevelApi */
/* global ImportWords */

class ImportWordsApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {ImportWordsRequest} request
     */
    async onRequest(request) {
        const parsedRequest = ImportWordsApi._parseRequest(request);
        const handler = new ImportWords(parsedRequest, this.resolve.bind(this));
        handler.run();
    }

    /**
     * @param {ImportWordsRequest} request
     * @returns {ImportWordsRequest}
     * @private
     */
    static _parseRequest(request) {
        if (!request) {
            throw new Error('Empty request');
        }

        if (typeof request.defaultKeyPath !== 'string' || !request.defaultKeyPath) {
            throw new Error('defaultKeyPath is required');
        }

        if (!Nimiq.ExtendedPrivateKey.isValidPath(request.defaultKeyPath)) {
            throw new Error('Invalid defaultKeyPath');
        }

        return request;
    }
}
