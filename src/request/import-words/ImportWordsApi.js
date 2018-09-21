/* global TopLevelApi */
/* global ImportWords */

class ImportWordsApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {ImportRequest} request
     */
    async onRequest(request) {
        const parsedRequest = ImportWordsApi._parseRequest(request);
        const handler = new ImportWords(parsedRequest, this.resolve.bind(this));
        handler.run();
    }

    /**
     * @param {ImportRequest} request
     * @returns {ImportRequest}
     * @private
     */
    static _parseRequest(request) {
        if (!request) {
            throw new Error('Empty request');
        }

        if (typeof request.appName !== 'string' || !request.appName) {
            throw new Error('appName is required');
        }

        return request;
    }
}
