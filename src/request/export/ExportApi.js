/* global TopLevelApi */
/* global Export */
/* global Errors */

class ExportApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {ParsedSimpleRequest} request
     */
    async onRequest(request) {
        const exportHandler = new Export(request, this.resolve.bind(this), this.reject.bind(this));
        exportHandler.run();
    }

    /**
     * @param {KeyguardRequest.SimpleRequest} request
     * @returns {Promise<ParsedSimpleRequest>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);
        // parsedRequest.usedKeyPaths = this.parsePathsArray(request.usedKeyPaths, 'usedKeyPaths');

        return parsedRequest;
    }
}
