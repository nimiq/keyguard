/* global TopLevelApi */
/* global Export */
/* global Errors */

class ExportApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.ExportRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.ExportRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.useLegacyStore = this.parseBoolean(request.useLegacyStore);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId, parsedRequest.useLegacyStore);
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);
        parsedRequest.fileOnly = this.parseBoolean(request.fileOnly);
        parsedRequest.wordsOnly = this.parseBoolean(request.wordsOnly);
        if (parsedRequest.fileOnly && parsedRequest.wordsOnly) {
            throw new Errors.InvalidRequestError('fileOnly and wordsOnly cannot both be set to true.');
        }

        return parsedRequest;
    }

    get Handler() {
        return Export;
    }
}
